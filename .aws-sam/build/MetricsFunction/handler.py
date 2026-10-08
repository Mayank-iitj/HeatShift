"""Metrics handler.

Serves aggregated system metrics.
"""

import json
import logging
import os
import sys

sys.path.insert(0, "/opt/python")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.common import ddb

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("Fetching metrics")
    
    try:
        metrics = ddb.get_all_metrics()
        
        # Flatten for frontend
        flat_metrics = {
            "total_sites_confirmed": 0,
            "total_exposure_hours_avoided": 0,
            "total_alerts_sent": 0,
            "total_agent_fallbacks": 0,
            "total_plans_generated": 0,
        }
        
        for m in metrics:
            if m.get("metric_name") == "confirmed":
                flat_metrics["total_sites_confirmed"] += int(m.get("value", 0))
            elif m.get("metric_name") == "exposure_hours_avoided":
                flat_metrics["total_exposure_hours_avoided"] += int(m.get("value", 0))
            elif m.get("metric_name") == "alerts_sent":
                flat_metrics["total_alerts_sent"] += int(m.get("value", 0))
            elif m.get("metric_name") == "agent_fallbacks":
                flat_metrics["total_agent_fallbacks"] += int(m.get("value", 0))
            elif m.get("metric_name") == "plans_generated":
                flat_metrics["total_plans_generated"] += int(m.get("value", 0))
                
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({
                "metrics": flat_metrics,
                "raw": metrics
            })
        }
    except Exception as e:
        logger.error(f"Failed to fetch metrics: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal server error"})
        }
