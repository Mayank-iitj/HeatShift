"""Plan agent handler.

Generates site-specific work plans using the Strands Agents SDK + Bedrock,
with Cedar policy validation. Falls back to deterministic planner on failure.
"""

import json
import logging
import os
import sys
import time
import traceback

sys.path.insert(0, "/opt/python")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.common import ddb
from backend.common.config import load_zones, get_zones_by_id
from backend.common.risk import assess_risk, compute_exposure_hours_avoided
from backend.common.time_utils import now_ist, format_iso
from backend.common.i18n import (
    build_plan_message, build_rest_rule_text, format_hour_range, tier_label
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def get_hourly_tiers(zone_id: str, hours: int = 24) -> dict[int, dict]:
    """Get hourly tier data for a zone from the latest readings."""
    readings = ddb.get_latest_readings(zone_id, limit=hours)
    result = {}
    for r in readings:
        try:
            ts = r.get("timestamp", "")
            if "T" in ts:
                hour = int(ts.split("T")[1].split(":")[0])
            else:
                continue
            result[hour] = {
                "tier": int(r.get("tier", 0)),
                "tier_label": r.get("tier_label", "Low"),
                "apparent_temperature": float(r.get("apparent_temperature", 0)),
                "wet_bulb": float(r.get("wet_bulb", 0)),
            }
        except (ValueError, IndexError):
            pass
    return result


def deterministic_planner(site: dict, hourly_tiers: dict, zone_name: str, zone_name_hi: str) -> dict:
    """Deterministic fallback planner.

    Produces a valid plan that passes Cedar policies using rule-based logic.
    Used when the agent fails, times out, or returns invalid output.
    """
    from backend.common.config import get_work_rest_rules, get_hydration_guidance

    work_rest = get_work_rest_rules()
    shift_start = int(site.get("shift_start", 8))
    shift_end = int(site.get("shift_end", 18))
    unshaded = bool(site.get("unshaded", False))
    heavy_labor = bool(site.get("heavy_labor", False))
    over50_share = float(site.get("over50_share", 0.0))
    worker_count = int(site.get("worker_count", 1))

    # Find the max tier across the workday
    overall_tier_max = 0
    for h in range(shift_start, shift_end):
        tier = hourly_tiers.get(h, {}).get("tier", 0)
        if tier > overall_tier_max:
            overall_tier_max = tier

    # Build work/rest blocks
    blocks = []
    dangerous_hours = []
    safe_work_hours = []

    for h in range(0, 24):
        tier = hourly_tiers.get(h, {}).get("tier", 0)
        if tier >= 3:
            dangerous_hours.append(h)
        elif tier <= 1:
            safe_work_hours.append(h)

    # Determine recommended shift
    if overall_tier_max >= 3:
        # Split shift: early morning + evening, avoid peak
        morning_end = min(10, shift_end)
        evening_start = max(17, shift_start)
        rec_start = max(5, shift_start - 2)
        rec_end = min(20, shift_end + 2)

        # Morning block
        if rec_start < morning_end:
            blocks.append({
                "start": rec_start, "end": morning_end,
                "type": "work", "intensity": "moderate",
                "continuous_minutes": 45, "tier": 1,
            })
        # Rest during peak
        if morning_end < evening_start:
            blocks.append({
                "start": morning_end, "end": evening_start,
                "type": "rest", "intensity": None,
                "continuous_minutes": 0, "tier": 3,
            })
        # Evening block
        if evening_start < rec_end:
            blocks.append({
                "start": evening_start, "end": rec_end,
                "type": "work", "intensity": "moderate",
                "continuous_minutes": 45, "tier": 1,
            })
    elif overall_tier_max >= 2:
        # Modified shift: work in cooler hours with breaks
        rec_start = max(6, shift_start - 1)
        rec_end = min(19, shift_end + 1)
        continuous = 45
        if over50_share > 0.30:
            continuous = 30

        current = rec_start
        while current < rec_end:
            h_tier = hourly_tiers.get(current, {}).get("tier", 0)
            if h_tier >= 3:
                blocks.append({
                    "start": current, "end": current + 1,
                    "type": "rest", "intensity": None,
                    "continuous_minutes": 0, "tier": h_tier,
                })
            else:
                blocks.append({
                    "start": current, "end": current + 1,
                    "type": "work", "intensity": "light" if h_tier >= 2 else "moderate",
                    "continuous_minutes": continuous, "tier": h_tier,
                })
            current += 1
    else:
        # Normal shift
        blocks.append({
            "start": shift_start, "end": shift_end,
            "type": "work", "intensity": "moderate",
            "continuous_minutes": 90, "tier": overall_tier_max,
        })

    # Determine rest rule
    if overall_tier_max >= 3:
        continuous = 0
        rest_rule_en = "No outdoor work during extreme heat hours (12-4 PM)"
        rest_rule_hi = "अत्यधिक गर्मी के घंटों में बाहर काम नहीं (12-4 PM)"
    elif overall_tier_max >= 2:
        continuous = 30 if over50_share > 0.30 else 45
        rest_rule_en = f"Rest in shade after every {continuous} minutes of work"
        rest_rule_hi = f"हर {continuous} मिनट काम के बाद छाया में आराम करें"
    elif overall_tier_max >= 1:
        continuous = 90
        rest_rule_en = "Rest in shade after every 90 minutes of work"
        rest_rule_hi = "हर 90 मिनट काम के बाद छाया में आराम करें"
    else:
        continuous = 0
        rest_rule_en = "Normal work schedule"
        rest_rule_hi = "सामान्य कार्य अनुसूची"

    hydration_en = get_hydration_guidance(overall_tier_max, "en")
    hydration_hi = get_hydration_guidance(overall_tier_max, "hi")

    # Build recommended shift
    work_blocks = [b for b in blocks if b["type"] == "work"]
    rec_start = work_blocks[0]["start"] if work_blocks else shift_start
    rec_end = work_blocks[-1]["end"] if work_blocks else shift_end

    # Get cooling points
    cooling_points = _load_cooling_points(site.get("zone_id", ""))

    # Build messages
    today = now_ist().strftime("%a, %d %b")
    dangerous_str = ""
    dangerous_str_hi = ""
    if dangerous_hours:
        dangerous_str = format_hour_range(min(dangerous_hours), max(dangerous_hours) + 1)
        dangerous_str_hi = format_hour_range(min(dangerous_hours), max(dangerous_hours) + 1, "hi")

    cp_name = cooling_points[0]["name"] if cooling_points else ""

    msg_en = build_plan_message(
        zone_name, zone_name_hi, today, overall_tier_max,
        rec_start, rec_end, rest_rule_en, rest_rule_hi,
        hydration_en, hydration_hi, cp_name,
        dangerous_str, dangerous_str_hi, lang="en"
    )
    msg_hi = build_plan_message(
        zone_name, zone_name_hi, today, overall_tier_max,
        rec_start, rec_end, rest_rule_en, rest_rule_hi,
        hydration_en, hydration_hi, cp_name,
        dangerous_str, dangerous_str_hi, lang="hi"
    )

    # Build tier signature for caching
    tier_sig = "-".join(str(hourly_tiers.get(h, {}).get("tier", 0)) for h in range(24))

    plan = {
        "plan_id": ddb.generate_id(),
        "date": now_ist().strftime("%Y-%m-%d"),
        "zone_id": site.get("zone_id", ""),
        "site_id": site.get("site_id", ""),
        "overall_tier_max": overall_tier_max,
        "blocks": blocks,
        "recommended_shift_start": rec_start,
        "recommended_shift_end": rec_end,
        "rest_rule": rest_rule_en,
        "hydration_note": hydration_en,
        "cooling_points": cooling_points[:3],
        "messages": {"en": msg_en, "hi": msg_hi},
        "trace": [{"tool": "deterministic_planner", "duration_ms": 0}],
        "generated_by": "rules",
        "cedar_decisions": [],
        "tier_signature": tier_sig,
        "created_at": format_iso(now_ist()),
        "data_mode": ddb.get_state().get("mode", "LIVE"),
    }

    return plan


def _load_cooling_points(zone_id: str) -> list[dict]:
    """Load cooling points for a zone from cached data."""
    try:
        from backend.common.config import _find_data_dir
        data_dir = _find_data_dir()
        cp_path = data_dir / "cooling_points.json"
        if cp_path.exists():
            with open(cp_path) as f:
                all_points = json.load(f)
            return [p for p in all_points if p.get("zone_id") == zone_id][:3]
    except Exception as e:
        logger.warning(f"Failed to load cooling points: {e}")
    return []


def lambda_handler(event, context):
    """Generate plans for sites.

    Can be invoked by:
    - EventBridge (daily 05:00 IST): process all sites
    - API (replan): process a single site
    - DynamoDB stream: tier change triggered
    """
    logger.info(f"Plan agent invoked: {json.dumps(event)[:500]}")

    site_id = event.get("site_id")
    force = event.get("force", False)

    if site_id:
        # Single site replan
        sites = [ddb.get_site(site_id)]
        sites = [s for s in sites if s]
    else:
        # All sites
        sites = ddb.get_all_sites()

    if not sites:
        logger.info("No sites to process")
        return {"statusCode": 200, "body": "No sites"}

    zones_by_id = get_zones_by_id()
    plans_generated = 0

    for site in sites:
        try:
            zone_id = site.get("zone_id", "")
            zone = zones_by_id.get(zone_id, {})
            zone_name = zone.get("name", zone_id)
            zone_name_hi = zone.get("name_hi", zone_name)

            hourly_tiers = get_hourly_tiers(zone_id)

            if not hourly_tiers:
                logger.warning(f"No tier data for zone {zone_id}, skipping")
                continue

            # Check cache (skip if same tier signature already planned today)
            if not force:
                tier_sig = "-".join(str(hourly_tiers.get(h, {}).get("tier", 0)) for h in range(24))
                last_plan = ddb.get_latest_plan(site["site_id"])
                if last_plan and last_plan.get("tier_signature") == tier_sig:
                    today = now_ist().strftime("%Y-%m-%d")
                    if last_plan.get("date") == today:
                        logger.info(f"Plan cache hit for {site['site_id']}")
                        continue

            # Try agent first, fall back to deterministic planner
            plan = None
            try:
                plan = _run_agent(site, hourly_tiers, zone_name, zone_name_hi)
            except Exception as e:
                logger.warning(f"Agent failed for {site['site_id']}: {e}")
                logger.debug(traceback.format_exc())

            if plan is None:
                plan = deterministic_planner(site, hourly_tiers, zone_name, zone_name_hi)

            # Store plan
            ddb.put_plan(plan)
            plans_generated += 1

            # Increment metrics
            ddb.increment_metric("global", "plans_generated", 1)
            if plan.get("generated_by") == "rules":
                ddb.increment_metric("global", "agent_fallbacks", 1)

            # Feed event
            ddb.put_feed_event({
                "event_type": "plan",
                "timestamp": format_iso(now_ist()),
                "site_id": site["site_id"],
                "zone_id": zone_id,
                "summary": f"Plan generated for {site.get('name', site['site_id'])} (tier {plan['overall_tier_max']}, {plan['generated_by']})",
                "data_mode": plan.get("data_mode", "LIVE"),
                "data": {
                    "plan_id": plan["plan_id"],
                    "generated_by": plan["generated_by"],
                    "overall_tier_max": plan["overall_tier_max"],
                },
            })

            # Trigger alert dispatch
            _trigger_alert(site, plan)

        except Exception as e:
            logger.error(f"Plan generation failed for site {site.get('site_id')}: {e}", exc_info=True)

    return {
        "statusCode": 200,
        "body": json.dumps({"plans_generated": plans_generated}),
    }


def _run_agent(site: dict, hourly_tiers: dict, zone_name: str, zone_name_hi: str) -> dict:
    """Run the Strands agent to generate a plan.

    Returns a plan dict or raises an exception on failure.
    """
    # Import agent components — these may not be available
    try:
        from backend.agent.agent import create_plan_with_agent
        plan = create_plan_with_agent(site, hourly_tiers, zone_name, zone_name_hi)
        return plan
    except ImportError:
        logger.info("Agent module not available, using deterministic planner")
        raise
    except Exception as e:
        logger.warning(f"Agent execution failed: {e}")
        raise


def _trigger_alert(site: dict, plan: dict) -> None:
    """Trigger alert dispatch for a plan if the tier warrants it."""
    if plan.get("overall_tier_max", 0) >= 1:
        import boto3
        client = boto3.client("lambda", region_name=os.environ.get("AWS_REGION", "ap-south-1"))
        fn_name = os.environ.get(
            "ALERT_DISPATCH_FUNCTION_NAME",
            f"{os.environ.get('DDB_TABLE_PREFIX', 'HeatShift')}-alert-dispatch"
        )
        try:
            client.invoke(
                FunctionName=fn_name,
                InvocationType="Event",
                Payload=json.dumps({
                    "site_id": site["site_id"],
                    "plan_id": plan["plan_id"],
                }),
            )
        except Exception as e:
            logger.error(f"Failed to trigger alert dispatch: {e}")
