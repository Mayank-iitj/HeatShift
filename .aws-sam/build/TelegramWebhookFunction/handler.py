"""Telegram webhook handler.

Handles /start linking and inline button callbacks for confirmations.
Requires X-Telegram-Bot-Api-Secret-Token validation.
"""

import json
import logging
import os
import sys

sys.path.insert(0, "/opt/python")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.common import ddb
from backend.common.time_utils import format_iso, now_ist

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def _get_telegram_secret() -> str:
    """Fetch Telegram webhook secret from SSM."""
    import boto3
    ssm = boto3.client("ssm", region_name=os.environ.get("AWS_REGION", "ap-south-1"))
    key = os.environ.get("TELEGRAM_SECRET_SSM_KEY", "/heatshift/telegram-secret")
    try:
        resp = ssm.get_parameter(Name=key, WithDecryption=True)
        return resp["Parameter"]["Value"]
    except Exception as e:
        logger.error(f"Failed to fetch Telegram secret: {e}")
        return ""


def send_telegram_reply(chat_id: str, message: str) -> None:
    """Send a plain text reply."""
    import boto3
    import requests

    ssm = boto3.client("ssm", region_name=os.environ.get("AWS_REGION", "ap-south-1"))
    key = os.environ.get("TELEGRAM_TOKEN_SSM_KEY", "/heatshift/telegram-token")
    try:
        token = ssm.get_parameter(Name=key, WithDecryption=True)["Parameter"]["Value"]
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        requests.post(url, json={"chat_id": chat_id, "text": message}, timeout=10)
    except Exception as e:
        logger.error(f"Reply failed: {e}")


def handle_link(chat_id: str, link_code: str) -> None:
    """Link a Telegram chat to a site."""
    site = ddb.get_site_by_link_code(link_code.upper())
    if not site:
        send_telegram_reply(chat_id, "Invalid link code. Please check the dashboard.")
        return

    ddb.update_site_telegram(site["site_id"], str(chat_id))
    send_telegram_reply(
        chat_id,
        f"✅ Linked to {site['name']}. You will now receive HeatShift alerts here."
    )

    ddb.put_feed_event({
        "event_type": "site",
        "timestamp": format_iso(now_ist()),
        "site_id": site["site_id"],
        "summary": f"Telegram linked for {site['name']}",
        "data_mode": site.get("data_mode", "LIVE"),
        "data": {"channel": "telegram"},
    })


def handle_callback(callback_query: dict) -> None:
    """Handle inline button callback (confirm/reject)."""
    data = callback_query.get("data", "")
    chat_id = callback_query.get("message", {}).get("chat", {}).get("id")

    if not data or not chat_id:
        return

    parts = data.split("|")
    if len(parts) != 2:
        return

    action, link_code = parts
    site = ddb.get_site_by_link_code(link_code)

    if not site:
        send_telegram_reply(chat_id, "Site not found.")
        return

    site_id = site["site_id"]
    plan = ddb.get_latest_plan(site_id)

    if not plan:
        send_telegram_reply(chat_id, "No active plan found.")
        return

    decision = "confirmed" if action == "confirm" else "rejected"

    confirmation = {
        "confirmation_id": ddb.generate_id(),
        "site_id": site_id,
        "plan_id": plan["plan_id"],
        "decision": decision,
        "source": "telegram",
        "confirmed_at": format_iso(now_ist()),
        "data_mode": ddb.get_state().get("mode", "LIVE"),
    }

    # Compute avoided hours
    if decision == "confirmed":
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
        "site_id": site_id,
        "summary": f"Shift change {decision} via Telegram for site {site_id}",
        "data_mode": confirmation["data_mode"],
        "data": confirmation,
    })

    if decision == "confirmed":
        send_telegram_reply(chat_id, "✅ Shift change confirmed. Stay safe.")
    else:
        send_telegram_reply(chat_id, "Recorded. Please ensure adequate hydration and rest breaks.")


def lambda_handler(event, context):
    """Webhook entry point."""
    logger.info("Telegram webhook invoked")

    # Validate secret token
    headers = {k.lower(): v for k, v in event.get("headers", {}).items()}
    token_header = headers.get("x-telegram-bot-api-secret-token")

    expected_secret = _get_telegram_secret()
    if expected_secret and token_header != expected_secret:
        logger.warning("Invalid secret token")
        return {"statusCode": 401, "body": "Unauthorized"}

    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return {"statusCode": 400, "body": "Invalid JSON"}

    # Handle /start link_code
    message = body.get("message", {})
    if message.get("text", "").startswith("/start "):
        link_code = message["text"].split(" ")[1].strip()
        chat_id = message.get("chat", {}).get("id")
        if chat_id and link_code:
            handle_link(str(chat_id), link_code)

    # Handle inline keyboard callback
    callback_query = body.get("callback_query")
    if callback_query:
        handle_callback(callback_query)

    return {"statusCode": 200, "body": "OK"}
