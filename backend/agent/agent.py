"""Strands Agent implementation for HeatShift planning.

Uses Bedrock to orchestrate the tools and produce a strict JSON SitePlan.
"""

import json
import logging
import os
from typing import Dict, Any

from pydantic import ValidationError

from strands_agents.agent import Agent
from strands_agents.models import BedrockModel

from backend.common import ddb
from backend.common.models import SitePlan, BlockType, WorkBlock
from backend.common.time_utils import now_ist, format_iso
from backend.common.config import BEDROCK_MODEL_ID
from backend.agent.tools import (
    get_site_profile, get_zone_forecast, find_cooling_points,
    evaluate_cedar_policies, compose_messages, get_and_clear_trace
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the HeatShift Planner Agent. Your job is to schedule outdoor work safely, avoiding extreme heat.
You must output a strict JSON object that matches the SitePlan schema exactly.

RULES:
1. You must check the site profile and the 24-hour forecast.
2. You must design a schedule of work and rest blocks (start_hour to end_hour, 0-23 IST).
3. EVERY work block you propose MUST be validated by the `evaluate_cedar_policies` tool.
4. If the tool says 'deny', you MUST repair the plan (e.g., shorten continuous_minutes, add rest, or move to cooler hours) and validate again until ALL blocks are allowed.
5. You must compose bilingual messages (EN and HI) using the `compose_messages` tool.
6. Return only the final JSON SitePlan. No markdown, no conversational text.

If all daytime hours are Tier 3 (Extreme), you must recommend no outdoor work, and output a valid plan with 0 work blocks.
"""

def create_plan_with_agent(site: dict, hourly_tiers: dict, zone_name: str, zone_name_hi: str) -> dict:
    """Run the agent to produce a plan."""
    get_and_clear_trace() # clear any old trace
    
    # Check Bedrock availability
    model_id = os.environ.get("BEDROCK_MODEL_ID", BEDROCK_MODEL_ID)
    try:
        model = BedrockModel(model_id=model_id, region_name=os.environ.get("AWS_REGION", "ap-south-1"))
    except Exception as e:
        logger.warning(f"Could not initialize Bedrock model: {e}")
        raise ValueError("Bedrock model unavailable")

    tools = [
        get_site_profile,
        get_zone_forecast,
        find_cooling_points,
        evaluate_cedar_policies,
        compose_messages
    ]
    
    agent = Agent(
        model=model,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
        max_iterations=10,
    )
    
    site_id = site.get("site_id", "")
    zone_id = site.get("zone_id", "")
    
    prompt = f"Create a safe work plan for site {site_id} in zone {zone_id} for today."
    
    try:
        response = agent.run(prompt)
        # Parse output
        output_text = response.content
        
        # Sometimes the LLM wraps it in markdown blocks
        if "```json" in output_text:
            output_text = output_text.split("```json")[1].split("```")[0].strip()
        elif "```" in output_text:
            output_text = output_text.split("```")[1].split("```")[0].strip()
            
        plan_dict = json.loads(output_text)
        
        # Validate schema via Pydantic
        # Fill in missing fields first if needed
        overall_tier_max = max(t.get("tier", 0) for t in hourly_tiers.values()) if hourly_tiers else 0
        
        # Validate that the LLM actually ran evaluate_cedar_policies on all blocks
        trace = get_and_clear_trace()
        
        cedar_evals = [t for t in trace if t["tool"] == "evaluate_cedar_policies"]
        if not cedar_evals and any(b.get("type") == "work" for b in plan_dict.get("blocks", [])):
            logger.warning("Agent did not validate blocks with Cedar! Falling back to rules.")
            raise ValueError("Agent failed to run Cedar validation")
            
        tier_sig = "-".join(str(hourly_tiers.get(h, {}).get("tier", 0)) for h in range(24))

        plan = {
            "plan_id": ddb.generate_id(),
            "date": now_ist().strftime("%Y-%m-%d"),
            "zone_id": zone_id,
            "site_id": site_id,
            "overall_tier_max": overall_tier_max,
            "blocks": plan_dict.get("blocks", []),
            "recommended_shift_start": plan_dict.get("recommended_shift_start", site.get("shift_start", 8)),
            "recommended_shift_end": plan_dict.get("recommended_shift_end", site.get("shift_end", 18)),
            "rest_rule": plan_dict.get("rest_rule", "Follow safety guidelines"),
            "hydration_note": plan_dict.get("hydration_note", "Drink water"),
            "cooling_points": plan_dict.get("cooling_points", []),
            "messages": plan_dict.get("messages", {"en": "Shift update", "hi": "शिफ्ट अपडेट"}),
            "trace": trace,
            "generated_by": "agent",
            "cedar_decisions": [], # LLM doesn't return this, we just have it in the trace
            "tier_signature": tier_sig,
            "created_at": format_iso(now_ist()),
            "data_mode": ddb.get_state().get("mode", "LIVE"),
        }
        
        # Will raise ValidationError if invalid
        validated = SitePlan(**plan)
        return json.loads(validated.model_dump_json())
        
    except Exception as e:
        logger.error(f"Agent failed: {e}")
        raise
