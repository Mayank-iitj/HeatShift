"""REST API handler for HeatShift.

Single Lambda behind API Gateway that routes to the appropriate handler
based on the path and method.
"""

import json
import logging
import os
import sys
import re
from decimal import Decimal

sys.path.insert(0, "/opt/python")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.common.config import load_zones, get_zones_by_id
from backend.common.time_utils import now_ist, format_iso
from backend.common import ddb

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class DecimalEncoder(json.JSONEncoder):
    """Handle Decimal types from DynamoDB."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super().default(obj)


def json_response(status: int, body: dict, cors: bool = True) -> dict:
    headers = {"Content-Type": "application/json"}
    if cors:
        headers["Access-Control-Allow-Origin"] = "*"
        headers["Access-Control-Allow-Headers"] = "Content-Type"
        headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return {
        "statusCode": status,
        "headers": headers,
        "body": json.dumps(body, cls=DecimalEncoder),
    }


def handle_get_zones():
    """GET /zones — zones with latest reading and tier."""
    zones = load_zones()
    result = []
    for z in zones:
        readings = ddb.get_latest_readings(z["id"], limit=1)
        zone_data = {**z}
        if readings:
            zone_data["latest_reading"] = readings[0]
        else:
            zone_data["latest_reading"] = None
        result.append(zone_data)
    return json_response(200, {"zones": result})


def handle_get_zone_forecast(zone_id: str):
    """GET /zones/{id}/forecast — 72h hourly forecast."""
    zones_by_id = get_zones_by_id()
    if zone_id not in zones_by_id:
        return json_response(404, {"error": f"Zone {zone_id} not found"})

    readings = ddb.get_latest_readings(zone_id, limit=72)
    readings.reverse()  # oldest first
    return json_response(200, {"zone_id": zone_id, "readings": readings})


def handle_create_site(body: dict):
    """POST /sites — register a new site."""
    required = ["name", "zone_id", "worker_count"]
    for field in required:
        if field not in body:
            return json_response(400, {"error": f"Missing field: {field}"})

    zones_by_id = get_zones_by_id()
    if body["zone_id"] not in zones_by_id:
        return json_response(400, {"error": f"Invalid zone_id: {body['zone_id']}"})

    worker_count = int(body["worker_count"])
    if worker_count < 1 or worker_count > 500:
        return json_response(400, {"error": "worker_count must be 1-500"})

    site_id = ddb.generate_id()
    link_code = ddb.generate_link_code()

    site = {
        "site_id": site_id,
        "name": body["name"],
        "zone_id": body["zone_id"],
        "worker_count": worker_count,
        "over50_share": float(body.get("over50_share", 0.0)),
        "unshaded": bool(body.get("unshaded", False)),
        "heavy_labor": bool(body.get("heavy_labor", False)),
        "shift_start": int(body.get("shift_start", 8)),
        "shift_end": int(body.get("shift_end", 18)),
        "contact_email": body.get("contact_email"),
        "telegram_chat_id": None,
        "link_code": link_code,
        "created_at": format_iso(now_ist()),
        "data_mode": ddb.get_state().get("mode", "LIVE"),
    }

    ddb.put_site(site)

    ddb.put_feed_event({
        "event_type": "site",
        "timestamp": format_iso(now_ist()),
        "site_id": site_id,
        "zone_id": body["zone_id"],
        "summary": f"Site '{body['name']}' registered in zone {body['zone_id']}",
        "data_mode": site["data_mode"],
        "data": {"site_id": site_id},
    })

    return json_response(201, {
        "site": site,
        "link_code": link_code,
        "telegram_instructions": f"Send /start {link_code} to the HeatShift bot on Telegram to receive alerts.",
    })


def handle_get_site(site_id: str):
    """GET /sites/{id} — site profile + latest plan + linked channels."""
    site = ddb.get_site(site_id)
    if not site:
        return json_response(404, {"error": f"Site {site_id} not found"})

    plan = ddb.get_latest_plan(site_id)
    return json_response(200, {
        "site": site,
        "latest_plan": plan,
        "telegram_linked": bool(site.get("telegram_chat_id")),
    })


def handle_get_site_plans(site_id: str):
    """GET /sites/{id}/plans — plan history."""
    site = ddb.get_site(site_id)
    if not site:
        return json_response(404, {"error": f"Site {site_id} not found"})

    plans = ddb.get_plans_for_site(site_id)
    return json_response(200, {"site_id": site_id, "plans": plans})


def handle_replan(site_id: str):
    """POST /sites/{id}/replan — force a new plan."""
    site = ddb.get_site(site_id)
    if not site:
        return json_response(404, {"error": f"Site {site_id} not found"})

    # Rate limit: check last plan timestamp
    last_plan = ddb.get_latest_plan(site_id)
    if last_plan:
        from backend.common.time_utils import parse_iso
        last_time = parse_iso(last_plan.get("created_at", "2000-01-01T00:00:00+05:30"))
        delta = now_ist() - last_time
        if delta.total_seconds() < 60:
            return json_response(429, {"error": "Rate limit: wait 60 seconds between replans"})

    # Invoke plan_agent Lambda asynchronously
    import boto3
    client = boto3.client("lambda", region_name=os.environ.get("AWS_REGION", "ap-south-1"))
    plan_fn = os.environ.get("PLAN_AGENT_FUNCTION_NAME",
                              f"{os.environ.get('DDB_TABLE_PREFIX', 'HeatShift')}-plan-agent")
    try:
        client.invoke(
            FunctionName=plan_fn,
            InvocationType="Event",
            Payload=json.dumps({"site_id": site_id, "force": True}),
        )
    except Exception as e:
        logger.error(f"Failed to invoke plan agent: {e}")
        return json_response(500, {"error": "Failed to trigger replan"})

    return json_response(202, {"message": "Replan triggered", "site_id": site_id})


def handle_post_confirmation(body: dict):
    """POST /confirmations — web fallback for Telegram confirm."""
    required = ["site_id", "plan_id", "decision"]
    for field in required:
        if field not in body:
            return json_response(400, {"error": f"Missing field: {field}"})

    if body["decision"] not in ("confirmed", "rejected"):
        return json_response(400, {"error": "decision must be 'confirmed' or 'rejected'"})

    confirmation = {
        "confirmation_id": ddb.generate_id(),
        "site_id": body["site_id"],
        "plan_id": body["plan_id"],
        "decision": body["decision"],
        "source": "web",
        "confirmed_at": format_iso(now_ist()),
        "data_mode": ddb.get_state().get("mode", "LIVE"),
    }

    # Compute exposure hours avoided if confirmed
    if body["decision"] == "confirmed":
        site = ddb.get_site(body["site_id"])
        plan = ddb.get_latest_plan(body["site_id"])
        if site and plan:
            from backend.common.risk import compute_exposure_hours_avoided
            original_hours = list(range(int(site.get("shift_start", 8)), int(site.get("shift_end", 18))))
            new_hours = []
            for block in plan.get("blocks", []):
                if block.get("type") == "work":
                    new_hours.extend(range(int(block["start"]), int(block["end"])))

            readings = ddb.get_latest_readings(site["zone_id"], limit=24)
            hourly_tiers = {}
            for r in readings:
                try:
                    ts = r.get("timestamp", "")
                    hour = int(ts.split("T")[1].split(":")[0]) if "T" in ts else 0
                    hourly_tiers[hour] = int(r.get("tier", 0))
                except (ValueError, IndexError):
                    pass

            avoided = compute_exposure_hours_avoided(
                original_hours, new_hours, hourly_tiers,
                int(site.get("worker_count", 1))
            )
            confirmation["exposure_hours_avoided"] = str(avoided)

            ddb.increment_metric("global", "exposure_hours_avoided", avoided)
            ddb.increment_metric("global", "confirmed", 1)

    ddb.put_confirmation(confirmation)

    ddb.put_feed_event({
        "event_type": "confirmation",
        "timestamp": format_iso(now_ist()),
        "site_id": body["site_id"],
        "summary": f"Shift change {body['decision']} for site {body['site_id']}",
        "data_mode": confirmation["data_mode"],
        "data": confirmation,
    })

    return json_response(201, {"confirmation": confirmation})


def handle_get_metrics():
    """GET /metrics — totals + per-site."""
    totals = ddb.get_metrics_totals()
    return json_response(200, {"metrics": totals})


def handle_get_feed(limit: int = 50):
    """GET /feed — recent events."""
    events = ddb.get_feed(limit)
    return json_response(200, {"events": events})


def handle_replay_start(body: dict):
    """POST /replay/start — start replay mode."""
    import boto3

    date_range = body.get("date_range", {})
    speed = int(body.get("speed", 1))

    state = ddb.get_state()
    state["mode"] = "REPLAY"
    state["replay_speed"] = speed
    state["replay_date"] = date_range.get("start", "2024-05-20")
    state["replay_virtual_time"] = f"{date_range.get('start', '2024-05-20')}T00:00:00+05:30"
    ddb.put_state(state)

    # Start Step Functions execution
    sfn = boto3.client("stepfunctions", region_name=os.environ.get("AWS_REGION", "ap-south-1"))
    sm_arn = os.environ.get("REPLAY_STATE_MACHINE_ARN", "")
    if sm_arn:
        try:
            resp = sfn.start_execution(
                stateMachineArn=sm_arn,
                input=json.dumps({
                    "date_range": date_range,
                    "speed": speed,
                    "replay_mode": True,
                }),
            )
            state["replay_execution_arn"] = resp["executionArn"]
            ddb.put_state(state)
        except Exception as e:
            logger.error(f"Failed to start replay: {e}")
            return json_response(500, {"error": str(e)})

    return json_response(200, {"message": "Replay started", "state": state})


def handle_replay_stop():
    """POST /replay/stop — stop replay."""
    import boto3

    state = ddb.get_state()
    arn = state.get("replay_execution_arn")
    if arn:
        sfn = boto3.client("stepfunctions", region_name=os.environ.get("AWS_REGION", "ap-south-1"))
        try:
            sfn.stop_execution(executionArn=arn)
        except Exception as e:
            logger.warning(f"Stop execution failed: {e}")

    state["mode"] = "LIVE"
    state["replay_execution_arn"] = None
    ddb.put_state(state)

    return json_response(200, {"message": "Replay stopped"})


def handle_replay_reset():
    """POST /replay/reset — reset to live mode."""
    state = ddb.get_state()
    state["mode"] = "LIVE"
    state["replay_date"] = None
    state["replay_virtual_time"] = None
    state["replay_execution_arn"] = None
    ddb.put_state(state)
    return json_response(200, {"message": "Reset to LIVE mode"})


def handle_health():
    """GET /health — basic health check."""
    state = ddb.get_state()
    return json_response(200, {
        "status": "ok",
        "mode": state.get("mode", "LIVE"),
        "last_ingest": state.get("last_ingest"),
        "timestamp": format_iso(now_ist()),
    })


def lambda_handler(event, context):
    """Main router for all REST API requests."""
    logger.info(f"API event: {json.dumps(event)[:500]}")

    path = event.get("path", "")
    method = event.get("httpMethod", "GET")
    path_params = event.get("pathParameters") or {}
    query_params = event.get("queryStringParameters") or {}

    # Parse body for POST requests
    body = {}
    if method == "POST" and event.get("body"):
        try:
            body = json.loads(event["body"])
        except json.JSONDecodeError:
            return json_response(400, {"error": "Invalid JSON body"})

    # OPTIONS for CORS
    if method == "OPTIONS":
        return json_response(200, {})

    # Route
    try:
        if path == "/zones" and method == "GET":
            return handle_get_zones()

        elif re.match(r"^/zones/[^/]+/forecast$", path) and method == "GET":
            zone_id = path_params.get("id", path.split("/")[2])
            return handle_get_zone_forecast(zone_id)

        elif path == "/sites" and method == "POST":
            return handle_create_site(body)

        elif re.match(r"^/sites/[^/]+$", path) and method == "GET":
            site_id = path_params.get("id", path.split("/")[2])
            return handle_get_site(site_id)

        elif re.match(r"^/sites/[^/]+/plans$", path) and method == "GET":
            site_id = path_params.get("id", path.split("/")[2])
            return handle_get_site_plans(site_id)

        elif re.match(r"^/sites/[^/]+/replan$", path) and method == "POST":
            site_id = path_params.get("id", path.split("/")[2])
            return handle_replan(site_id)

        elif path == "/confirmations" and method == "POST":
            return handle_post_confirmation(body)

        elif path == "/metrics" and method == "GET":
            return handle_get_metrics()

        elif path == "/feed" and method == "GET":
            limit = int(query_params.get("limit", 50))
            return handle_get_feed(limit)

        elif path == "/replay/start" and method == "POST":
            return handle_replay_start(body)

        elif path == "/replay/stop" and method == "POST":
            return handle_replay_stop()

        elif path == "/replay/reset" and method == "POST":
            return handle_replay_reset()

        elif path == "/health" and method == "GET":
            return handle_health()

        else:
            return json_response(404, {"error": f"Not found: {method} {path}"})

    except Exception as e:
        logger.error(f"API error: {e}", exc_info=True)
        return json_response(500, {"error": "Internal server error"})
