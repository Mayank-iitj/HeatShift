"""Replay Tick Handler.

Advances the clock in Replay mode by fetching historical ERA5 data for
the current virtual hour and pushing it as simulated readings.
"""

import json
import logging
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, "/opt/python")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.common import ddb
from backend.common.config import load_zones, _find_data_dir
from backend.common.time_utils import format_iso, parse_iso
from backend.common.risk import assess_risk

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def _load_replay_dataset() -> dict:
    data_dir = _find_data_dir()
    replay_dir = data_dir / "replay"
    dataset = {}
    
    if not replay_dir.exists():
        logger.warning("Replay dataset not found. Please run scripts/build_replay_dataset.py")
        return dataset
        
    for file in replay_dir.glob("*.json"):
        zone_id = file.stem
        with open(file) as f:
            dataset[zone_id] = json.load(f)
            
    return dataset

def lambda_handler(event, context):
    logger.info("Replay tick invoked")
    
    state = ddb.get_state()
    if state.get("mode") != "REPLAY":
        logger.info("Not in replay mode, aborting tick")
        return {"statusCode": 200, "body": "Skipped"}
        
    vclock = state.get("virtual_clock")
    if not vclock:
        logger.warning("No virtual clock found in state")
        return {"statusCode": 400, "body": "No virtual clock"}
        
    # Advance clock by 1 hour
    current_time = parse_iso(vclock)
    next_time = current_time + timedelta(hours=1)
    next_time_iso = format_iso(next_time)
    
    # We round to nearest hour to lookup in dataset
    lookup_time = next_time.replace(minute=0, second=0, microsecond=0)
    lookup_iso_utc = (lookup_time - timedelta(hours=5.5)).strftime("%Y-%m-%dT%H:00")
    lookup_iso_local = lookup_time.strftime("%Y-%m-%dT%H:00")
    
    dataset = _load_replay_dataset()
    if not dataset:
        return {"statusCode": 500, "body": "No dataset"}
        
    zones = load_zones()
    updates_pushed = 0
    
    for zone in zones:
        zid = zone["id"]
        zone_data = dataset.get(zid, {}).get("hourly", {})
        
        times = zone_data.get("time", [])
        
        # Open-Meteo returns time in the timezone requested (Asia/Kolkata)
        try:
            idx = times.index(lookup_iso_local)
        except ValueError:
            # If not found, skip
            continue
            
        temp = zone_data.get("temperature_2m", [])[idx]
        rh = zone_data.get("relative_humidity_2m", [])[idx]
        app_temp = zone_data.get("apparent_temperature", [])[idx]
        
        if temp is None or rh is None:
            continue
            
        risk = assess_risk(temp, rh, app_temp)
        
        reading = {
            "zone_id": zid,
            "timestamp": next_time_iso,
            "temperature": str(round(temp, 1)),
            "humidity": str(round(rh, 1)),
            "apparent_temperature": str(round(app_temp, 1)),
            "wet_bulb": str(round(risk.wet_bulb, 2)),
            "tier": int(risk.tier),
            "tier_label": risk.tier_label,
            "source": "REPLAY"
        }
        
        ddb.put_reading(reading)
        updates_pushed += 1
        
        # Publish feed event if tier changed
        last_tier = ddb.get_latest_readings(zid, limit=2)[-1].get("tier") if ddb.get_latest_readings(zid, limit=2) else 0
        if risk.tier != last_tier:
            ddb.put_feed_event({
                "event_type": "weather",
                "timestamp": next_time_iso,
                "zone_id": zid,
                "summary": f"Tier changed to {risk.tier_label} in {zone['name']}",
                "data_mode": "REPLAY",
                "data": reading
            })
            
    # Save new clock
    ddb.update_state("REPLAY", next_time_iso)
    
    return {
        "statusCode": 200,
        "body": json.dumps({
            "virtual_clock": next_time_iso,
            "updates_pushed": updates_pushed
        })
    }
