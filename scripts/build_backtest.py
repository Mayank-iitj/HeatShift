"""Build backtest dataset for HeatShift.

Computes precision/recall of the Open-Meteo forecast vs ERA5 reanalysis
for Delhi heat events in April-June 2024.
"""

import json
import logging
import os
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta

import requests

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.common.config import load_zones, _find_data_dir
from backend.common.risk import assess_risk

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
PREVIOUS_URL = "https://previous-runs-api.open-meteo.com/v1/forecast"
PARAMS = "temperature_2m,relative_humidity_2m,apparent_temperature,shortwave_radiation,wind_speed_10m"

START_DATE = "2024-04-01"
END_DATE = "2024-06-30"


def fetch_data(url: str, params: dict) -> list[dict]:
    for attempt in range(3):
        try:
            resp = requests.get(url, params=params, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            if not isinstance(data, list):
                data = [data]
            return data
        except Exception as e:
            logger.warning(f"Fetch failed: {e}")
            if attempt == 2:
                raise
            time.sleep(5)


def score_data(data: list[dict], zones: list[dict]) -> dict:
    """Score hourly data into daily heat events.
    A heat event is >= 3 hours of tier >= 2 between 08:00 and 18:00.
    """
    results_by_zone = {}
    
    for i, zone in enumerate(zones):
        zone_data = data[i].get("hourly", {})
        times = zone_data.get("time", [])
        temps = zone_data.get("temperature_2m", [])
        rhs = zone_data.get("relative_humidity_2m", [])
        apps = zone_data.get("apparent_temperature", [])
        
        # Group by day
        days = defaultdict(list)
        for j, ts in enumerate(times):
            if not ts or temps[j] is None:
                continue
            
            try:
                # Naive parse, assume format YYYY-MM-DDTHH:MM
                day_str = ts.split("T")[0]
                hour = int(ts.split("T")[1].split(":")[0])
                
                # Only care about working hours
                if 8 <= hour <= 18:
                    risk = assess_risk(temps[j], rhs[j], apps[j])
                    days[day_str].append(risk.tier)
            except Exception:
                continue
                
        # Evaluate days
        events = {}
        for day, tiers in days.items():
            unsafe_hours = sum(1 for t in tiers if t >= 2)
            events[day] = unsafe_hours >= 3
            
        results_by_zone[zone["id"]] = events
        
    return results_by_zone


def compute_metrics(truth: dict, pred: dict) -> dict:
    tp, fp, tn, fn = 0, 0, 0, 0
    
    for day in truth:
        t = truth[day]
        p = pred.get(day, False)
        
        if t and p:
            tp += 1
        elif not t and p:
            fp += 1
        elif not t and not p:
            tn += 1
        elif t and not p:
            fn += 1
            
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    
    return {
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1": round(f1, 3),
        "false_alarm_ratio": round(fp / (tp + fp) if (tp + fp) > 0 else 0, 3),
        "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn}
    }


def main():
    zones = load_zones()
    
    lats = ",".join(str(z["lat"]) for z in zones)
    lons = ",".join(str(z["lon"]) for z in zones)
    
    logger.info("Fetching ground truth (ERA5)...")
    truth_params = {
        "latitude": lats,
        "longitude": lons,
        "start_date": START_DATE,
        "end_date": END_DATE,
        "hourly": PARAMS,
        "timezone": "Asia/Kolkata",
    }
    truth_data = fetch_data(ARCHIVE_URL, truth_params)
    truth_scores = score_data(truth_data, zones)
    
    logger.info("Fetching 1-day lead forecast...")
    day1_params = {
        "latitude": lats,
        "longitude": lons,
        "start_date": START_DATE,
        "end_date": END_DATE,
        "hourly": "temperature_2m_previous_day1,relative_humidity_2m_previous_day1,apparent_temperature_previous_day1",
        "timezone": "Asia/Kolkata",
        "models": "best_match"
    }
    
    # We must remap the keys to match score_data expectations
    day1_raw = fetch_data(PREVIOUS_URL, day1_params)
    for z in day1_raw:
        if "hourly" in z:
            z["hourly"]["temperature_2m"] = z["hourly"].pop("temperature_2m_previous_day1", [])
            z["hourly"]["relative_humidity_2m"] = z["hourly"].pop("relative_humidity_2m_previous_day1", [])
            z["hourly"]["apparent_temperature"] = z["hourly"].pop("apparent_temperature_previous_day1", [])
            
    day1_scores = score_data(day1_raw, zones)
    
    # Evaluate overall
    all_truth = {}
    all_pred = {}
    
    for z in zones:
        zid = z["id"]
        for day in truth_scores[zid]:
            all_truth[f"{zid}_{day}"] = truth_scores[zid][day]
            all_pred[f"{zid}_{day}"] = day1_scores[zid].get(day, False)
            
    overall_metrics = compute_metrics(all_truth, all_pred)
    
    # Per zone metrics
    zone_metrics = {}
    for z in zones:
        zid = z["id"]
        t_dict = {d: truth_scores[zid][d] for d in truth_scores[zid]}
        p_dict = {d: day1_scores[zid].get(d, False) for d in truth_scores[zid]}
        zone_metrics[zid] = compute_metrics(t_dict, p_dict)
        zone_metrics[zid]["name"] = z["name"]
        
    results = {
        "period": f"{START_DATE} to {END_DATE}",
        "definition": ">= 3 hours of tier >= 2 between 08:00 and 18:00",
        "overall": overall_metrics,
        "by_zone": zone_metrics,
    }
    
    out_file = _find_data_dir() / "backtest.json"
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)
        
    logger.info(f"Backtest complete. Overall Recall: {overall_metrics['recall']:.2f}")

if __name__ == "__main__":
    main()
