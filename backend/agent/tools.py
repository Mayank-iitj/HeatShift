"""Tools for the Strands Agent SDK."""

import json
import logging
from typing import Optional, Dict, List, Any

from strands_agents.tools import tool

from backend.common import ddb
from backend.common.config import load_zones
from backend.common.i18n import build_plan_message, build_rest_rule_text
from backend.agent.cedar_validator import validate_blocks

logger = logging.getLogger(__name__)

# Global trace to track tool calls
_tool_trace = []


def _record_trace(name: str, args: dict, duration_ms: float = 0):
    _tool_trace.append({
        "tool": name,
        "args": args,
        "duration_ms": duration_ms
    })


def get_and_clear_trace() -> List[dict]:
    """Get the current trace and clear it for the next run."""
    global _tool_trace
    trace = _tool_trace.copy()
    _tool_trace = []
    return trace


@tool
def get_site_profile(site_id: str) -> str:
    """Get the profile of the site, including vulnerability factors.
    
    Args:
        site_id: The unique identifier for the site.
    """
    import time
    start = time.time()
    
    site = ddb.get_site(site_id)
    duration = (time.time() - start) * 1000
    _record_trace("get_site_profile", {"site_id": site_id}, duration)
    
    if not site:
        return json.dumps({"error": f"Site {site_id} not found"})
        
    return json.dumps({
        "site_id": site["site_id"],
        "name": site["name"],
        "zone_id": site["zone_id"],
        "worker_count": site["worker_count"],
        "over50_share": site.get("over50_share", 0.0),
        "unshaded": site.get("unshaded", False),
        "heavy_labor": site.get("heavy_labor", False),
        "shift_start": site.get("shift_start", 8),
        "shift_end": site.get("shift_end", 18),
    })


@tool
def get_zone_forecast(zone_id: str, hours: int = 48) -> str:
    """Get the hourly forecast and risk tier for the site's zone.
    
    Args:
        zone_id: The zone identifier.
        hours: How many hours to look ahead.
    """
    import time
    start = time.time()
    
    readings = ddb.get_latest_readings(zone_id, limit=hours)
    
    duration = (time.time() - start) * 1000
    _record_trace("get_zone_forecast", {"zone_id": zone_id, "hours": hours}, duration)
    
    if not readings:
        return json.dumps({"error": f"No readings found for zone {zone_id}"})
        
    # Simplify the readings for the LLM
    simple_readings = []
    for r in readings:
        try:
            ts = r.get("timestamp", "")
            if "T" in ts:
                hour = int(ts.split("T")[1].split(":")[0])
                simple_readings.append({
                    "hour": hour,
                    "tier": int(r.get("tier", 0)),
                    "tier_label": r.get("tier_label", "Low"),
                    "apparent_temp": float(r.get("apparent_temperature", 0)),
                    "wet_bulb": float(r.get("wet_bulb", 0))
                })
        except Exception:
            pass
            
    # Need them sorted chronologically
    simple_readings.reverse() 
    
    return json.dumps({"zone_id": zone_id, "hourly_forecast": simple_readings})


@tool
def find_cooling_points(zone_id: str, limit: int = 3) -> str:
    """Find nearby cooling points or water sources for the zone.
    
    Args:
        zone_id: The zone identifier.
        limit: Max number of points to return.
    """
    import time
    start = time.time()
    
    points = []
    try:
        from backend.common.config import _find_data_dir
        cp_path = _find_data_dir() / "cooling_points.json"
        if cp_path.exists():
            with open(cp_path) as f:
                all_points = json.load(f)
            points = [p for p in all_points if p.get("zone_id") == zone_id][:limit]
    except Exception as e:
        logger.warning(f"Failed to load cooling points: {e}")
        
    duration = (time.time() - start) * 1000
    _record_trace("find_cooling_points", {"zone_id": zone_id, "limit": limit}, duration)
    
    return json.dumps({"cooling_points": points})


@tool
def evaluate_cedar_policies(site_id: str, blocks: list[dict]) -> str:
    """Validate proposed work blocks against Cedar safety policies.
    Every work block must pass this check.
    
    Args:
        site_id: The site identifier.
        blocks: A list of proposed work blocks, e.g., [{"type": "work", "start": 8, "end": 10, "continuous_minutes": 60, "tier": 1}]
    """
    import time
    start = time.time()
    
    site = ddb.get_site(site_id)
    if not site:
        return json.dumps({"error": f"Site {site_id} not found"})
        
    # We need the hourly tiers. Load them from DB.
    hourly_tiers = {}
    readings = ddb.get_latest_readings(site.get("zone_id", ""), limit=24)
    for r in readings:
        try:
            ts = r.get("timestamp", "")
            if "T" in ts:
                hour = int(ts.split("T")[1].split(":")[0])
                hourly_tiers[hour] = {"tier": int(r.get("tier", 0))}
        except Exception:
            pass
            
    decisions = validate_blocks(site, blocks, hourly_tiers)
    
    duration = (time.time() - start) * 1000
    _record_trace("evaluate_cedar_policies", {"site_id": site_id, "blocks_count": len(blocks)}, duration)
    
    return json.dumps({"decisions": decisions})


@tool
def compose_messages(
    zone_name: str, zone_name_hi: str, overall_tier_max: int, 
    recommended_start: int, recommended_end: int, rest_rule_en: str, rest_rule_hi: str,
    hydration_en: str, hydration_hi: str, cooling_point_name: str = "",
    dangerous_hours: str = "", dangerous_hours_hi: str = ""
) -> str:
    """Compose bilingual (English and Hindi) messages for the contractor.
    
    Args:
        zone_name: Zone name in English.
        zone_name_hi: Zone name in Hindi.
        overall_tier_max: Max tier (0-3).
        recommended_start: Shift start hour (0-23).
        recommended_end: Shift end hour (0-23).
        rest_rule_en: Rest rule in English.
        rest_rule_hi: Rest rule in Hindi.
        hydration_en: Hydration instruction in English.
        hydration_hi: Hydration instruction in Hindi.
        cooling_point_name: (Optional) Nearest cooling point.
        dangerous_hours: (Optional) Extreme heat hours (e.g. "12 PM-4 PM").
        dangerous_hours_hi: (Optional) Extreme heat hours in Hindi.
    """
    import time
    from datetime import datetime
    
    start = time.time()
    
    today = datetime.now().strftime("%a, %d %b")
    
    msg_en = build_plan_message(
        zone_name, zone_name_hi, today, overall_tier_max,
        recommended_start, recommended_end, rest_rule_en, rest_rule_hi,
        hydration_en, hydration_hi, cooling_point_name,
        dangerous_hours, dangerous_hours_hi, lang="en"
    )
    
    msg_hi = build_plan_message(
        zone_name, zone_name_hi, today, overall_tier_max,
        recommended_start, recommended_end, rest_rule_en, rest_rule_hi,
        hydration_en, hydration_hi, cooling_point_name,
        dangerous_hours, dangerous_hours_hi, lang="hi"
    )
    
    duration = (time.time() - start) * 1000
    _record_trace("compose_messages", {"zone": zone_name}, duration)
    
    return json.dumps({"messages": {"en": msg_en, "hi": msg_hi}})
