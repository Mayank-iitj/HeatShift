"""Ingest and score weather data from Open-Meteo for all 12 Delhi zones.

Runs hourly via EventBridge (LIVE mode) or per-tick from Step Functions (REPLAY mode).
Fetches forecast data, computes wet-bulb and risk tiers, stores readings in DynamoDB.
"""

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone, timedelta

import requests

# Add layer path
sys.path.insert(0, "/opt/python")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.common.config import (
    load_zones,
    OPEN_METEO_FORECAST_URL,
)
from backend.common.risk import assess_risk
from backend.common.time_utils import IST, now_ist, format_iso
from backend.common import ddb

logger = logging.getLogger()
logger.setLevel(logging.INFO)

OPEN_METEO_PARAMS = (
    "temperature_2m,relative_humidity_2m,apparent_temperature,"
    "shortwave_radiation,wind_speed_10m,precipitation"
)


def fetch_forecast(zones: list[dict], hours: int = 72) -> dict:
    """Fetch forecast from Open-Meteo for all zones in a single request.

    Uses comma-separated lat/lon for multi-location query.

    Returns:
        Dict keyed by zone_id with hourly weather data.
    """
    lats = ",".join(str(z["lat"]) for z in zones)
    lons = ",".join(str(z["lon"]) for z in zones)

    params = {
        "latitude": lats,
        "longitude": lons,
        "hourly": OPEN_METEO_PARAMS,
        "timezone": "Asia/Kolkata",
        "forecast_days": max(1, hours // 24),
    }

    for attempt in range(3):
        try:
            resp = requests.get(OPEN_METEO_FORECAST_URL, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            break
        except (requests.RequestException, json.JSONDecodeError) as e:
            logger.warning(f"Open-Meteo fetch attempt {attempt + 1} failed: {e}")
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)

    # Multi-location response is a list; single location is a dict
    if isinstance(data, list):
        result = {}
        for i, zone in enumerate(zones):
            result[zone["id"]] = data[i]
        return result
    else:
        # Single zone fallback
        return {zones[0]["id"]: data}


def process_zone_forecast(zone_id: str, forecast_data: dict, data_mode: str = "LIVE") -> list[dict]:
    """Process forecast data into scored readings for a zone.

    Returns list of ZoneReading dicts ready for DynamoDB.
    """
    hourly = forecast_data.get("hourly", {})
    times = hourly.get("time", [])
    temps = hourly.get("temperature_2m", [])
    rhs = hourly.get("relative_humidity_2m", [])
    apparent = hourly.get("apparent_temperature", [])
    solar = hourly.get("shortwave_radiation", [])
    wind = hourly.get("wind_speed_10m", [])
    precip = hourly.get("precipitation", [])

    readings = []
    now = format_iso(now_ist())

    for i, ts in enumerate(times):
        if i >= len(temps) or i >= len(rhs) or i >= len(apparent):
            break
        if temps[i] is None or rhs[i] is None or apparent[i] is None:
            continue

        try:
            risk = assess_risk(
                temperature_c=float(temps[i]),
                relative_humidity_pct=float(rhs[i]),
                apparent_temperature=float(apparent[i]),
                shortwave_radiation=float(solar[i]) if i < len(solar) and solar[i] is not None else None,
                wind_speed=float(wind[i]) if i < len(wind) and wind[i] is not None else None,
            )
        except (ValueError, TypeError) as e:
            logger.warning(f"Risk calc failed for {zone_id} at {ts}: {e}")
            continue

        reading = {
            "zone_id": zone_id,
            "timestamp": ts,
            "temperature": str(risk.temperature),
            "relative_humidity": str(risk.relative_humidity),
            "apparent_temperature": str(risk.apparent_temperature),
            "wet_bulb": str(risk.wet_bulb),
            "effective_apparent": str(risk.effective_apparent),
            "tier": risk.tier,
            "tier_label": risk.tier_label,
            "data_mode": data_mode,
            "stale": False,
            "ingested_at": now,
        }
        if risk.shortwave_radiation is not None:
            reading["shortwave_radiation"] = str(risk.shortwave_radiation)
        if risk.wind_speed is not None:
            reading["wind_speed"] = str(risk.wind_speed)
        if i < len(precip) and precip[i] is not None:
            reading["precipitation"] = str(precip[i])

        readings.append(reading)

    return readings


def lambda_handler(event, context):
    """Lambda entry point.

    Handles both EventBridge (hourly) and Step Functions (replay tick) invocations.
    """
    logger.info(f"Ingest invoked: {json.dumps(event)[:500]}")

    # Check if this is a replay invocation
    replay_mode = event.get("replay_mode", False)
    replay_timestamp = event.get("replay_timestamp")
    data_mode = "REPLAY" if replay_mode else "LIVE"

    try:
        zones = load_zones()
        forecast_data = fetch_forecast(zones)

        total_readings = 0
        for zone_id, zone_forecast in forecast_data.items():
            readings = process_zone_forecast(zone_id, zone_forecast, data_mode)
            for reading in readings:
                ddb.put_reading(reading)
            total_readings += len(readings)
            logger.info(f"Zone {zone_id}: {len(readings)} readings stored")

        # Update state
        state = ddb.get_state()
        state["last_ingest"] = format_iso(now_ist())
        state["mode"] = data_mode
        if replay_timestamp:
            state["replay_virtual_time"] = replay_timestamp
        ddb.put_state(state)

        # Feed event
        ddb.put_feed_event({
            "event_type": "reading",
            "timestamp": format_iso(now_ist()),
            "summary": f"Ingested {total_readings} readings for {len(zones)} zones",
            "data_mode": data_mode,
            "data": {"total_readings": total_readings, "zones": len(zones)},
        })

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": f"Ingested {total_readings} readings",
                "zones": len(zones),
                "mode": data_mode,
            }),
        }

    except Exception as e:
        logger.error(f"Ingest failed: {e}", exc_info=True)

        # Mark data as stale
        try:
            state = ddb.get_state()
            state["last_ingest_error"] = str(e)
            ddb.put_state(state)
        except Exception:
            pass

        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }
