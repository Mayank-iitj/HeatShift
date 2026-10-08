"""Cedar policy validator wrapper."""

import json
import logging
import os
from pathlib import Path
from typing import Any

import cedarpy

logger = logging.getLogger(__name__)


def _get_policies_dir() -> Path:
    env_path = os.environ.get("HEATSHIFT_POLICIES_DIR")
    if env_path:
        return Path(env_path)
    return Path(__file__).resolve().parent.parent / "policies"


def validate_blocks(site: dict, blocks: list[dict], hourly_tiers: dict) -> list[dict]:
    """Validate a list of work blocks against Cedar policies.

    Returns a list of decision dictionaries (CedarDecision schema).
    """
    policies_dir = _get_policies_dir()
    schema_path = policies_dir / "schema.cedarschema"
    policies_path = policies_dir / "heat.cedar"

    try:
        with open(schema_path, "r") as f:
            schema_text = f.read()
        with open(policies_path, "r") as f:
            policies_text = f.read()
    except Exception as e:
        logger.error(f"Failed to load Cedar files: {e}")
        return [{"block_index": i, "action": "ScheduleWork", "decision": "deny", "reasons": ["system_error"]} for i in range(len(blocks))]

    site_entity_id = f"HeatShift::Site::\"{site.get('site_id', 'unknown')}\""

    entities = [
        {
            "uid": {"type": "HeatShift::Site", "id": site.get('site_id', 'unknown')},
            "attrs": {
                "worker_count": int(site.get("worker_count", 1)),
                "over50_share": {"__extn": {"fn": "decimal", "arg": f"{float(site.get('over50_share', 0.0)):.4f}"}},
                "unshaded": bool(site.get("unshaded", False)),
                "heavy_labor": bool(site.get("heavy_labor", False)),
            },
            "parents": []
        }
    ]

    decisions = []

    for i, block in enumerate(blocks):
        if block.get("type") != "work":
            continue

        # Look up tier if not provided
        tier = block.get("tier")
        if tier is None:
            # use max tier in the block
            tier = 0
            for h in range(int(block.get("start", 0)), int(block.get("end", 1))):
                h_tier = hourly_tiers.get(h, {}).get("tier", 0)
                if h_tier > tier:
                    tier = h_tier

        block_id = f"block_{i}"
        
        block_entity = {
            "uid": {"type": "HeatShift::WorkBlock", "id": block_id},
            "attrs": {
                "tier": int(tier),
                "start_hour": int(block.get("start", 0)),
                "end_hour": int(block.get("end", 1)),
                "continuous_minutes": int(block.get("continuous_minutes", 60)),
                "intensity": block.get("intensity", "moderate"),
            },
            "parents": []
        }

        # Validate with cedarpy
        try:
            request = {
                "principal": f'HeatShift::Site::"{site.get("site_id", "unknown")}"',
                "action": 'HeatShift::Action::"ScheduleWork"',
                "resource": f'HeatShift::WorkBlock::"{block_id}"',
                "context": {}
            }
            
            # Combine entities
            request_entities = entities + [block_entity]
            
            # Parse policies to get order of IDs
            policy_ids_in_order = []
            for line in policies_text.splitlines():
                if line.startswith("@id("):
                    policy_ids_in_order.append(line.split('"')[1])
            
            authz_result = cedarpy.is_authorized(
                request,
                policies_text,
                json.dumps(request_entities),
                schema_text
            )
            
            # Map returned policyN to actual IDs
            actual_reasons = []
            if hasattr(authz_result.diagnostics, 'reasons') and authz_result.diagnostics.reasons:
                for r in authz_result.diagnostics.reasons:
                    if r.startswith("policy") and r[6:].isdigit():
                        idx = int(r[6:])
                        if idx < len(policy_ids_in_order):
                            actual_reasons.append(policy_ids_in_order[idx])
                        else:
                            actual_reasons.append(r)
                    else:
                        actual_reasons.append(r)
                        
            decision = {
                "block_index": i,
                "action": "ScheduleWork",
                "decision": "allow" if authz_result.decision == cedarpy.Decision.Allow else "deny",
                "reasons": list(authz_result.diagnostics.errors) if authz_result.diagnostics.errors else [],
                "policy_ids": actual_reasons,
            }
            
            # If denied by default (no explicit permit), add a generic reason
            if decision["decision"] == "deny" and not decision["policy_ids"]:
                decision["policy_ids"].append("implicit_deny")
                
            decisions.append(decision)
            
        except Exception as e:
            logger.error(f"Cedar validation failed for block {i}: {e}")
            decisions.append({
                "block_index": i,
                "action": "ScheduleWork",
                "decision": "deny",
                "reasons": [str(e)],
                "policy_ids": []
            })

    return decisions
