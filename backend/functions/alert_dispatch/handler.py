"""Alert dispatch handler.

Sends Telegram (and optionally SNS email/SMS) alerts for plans
with tier >= 1. Triggered asynchronously from plan_agent.
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


def _get_telegram_token() -> str:
    """Fetch Telegram bot token from SSM."""
    import boto3
    ssm = boto3.client("ssm", region_name=os.environ.get("AWS_REGION", "ap-south-1"))
    key = os.environ.get("TELEGRAM_TOKEN_SSM_KEY", "/heatshift/telegram-token")
    try:
        resp = ssm.get_parameter(Name=key, WithDecryption=True)
        return resp["Parameter"]["Value"]
    except Exception as e:
        logger.error(f"Failed to fetch Telegram token: {e}")
        return ""


def send_telegram_alert(chat_id: str, message: str, link_code: str, token: str) -> bool:
    """Send alert via Telegram Bot API with inline keyboard for confirmation."""
    import requests

    if not token or not chat_id:
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"

    keyboard = {
        "inline_keyboard": [
            [{"text": "✅ Confirm Shift Change", "callback_data": f"confirm|{link_code}"}],
            [{"text": "❌ Cannot Change", "callback_data": f"reject|{link_code}"}]
        ]
    }

    payload = {
        "chat_id": chat_id,
        "text": message,
        "reply_markup": json.dumps(keyboard),
    }

    try:
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        return False


def lambda_handler(event, context):
    """Dispatch alerts for a generated plan."""
    logger.info(f"Alert dispatch: {json.dumps(event)[:300]}")

    site_id = event.get("site_id")
    plan_id = event.get("plan_id")

    if not site_id or not plan_id:
        return {"statusCode": 400, "body": "Missing site_id or plan_id"}

    site = ddb.get_site(site_id)
    plan = ddb.get_latest_plan(site_id)

    if not site or not plan:
        return {"statusCode": 404, "body": "Site or plan not found"}

    if plan.get("plan_id") != plan_id:
        # Avoid dispatching old plans
        return {"statusCode": 400, "body": "Plan ID mismatch"}

    if plan.get("overall_tier_max", 0) == 0:
        return {"statusCode": 200, "body": "No alert needed for Tier 0"}

    # Determine message language
    # Could check site preference, but default to Hindi for demo if available
    lang = "hi" if "hi" in plan.get("messages", {}) else "en"
    message = plan.get("messages", {}).get(lang, "Shift update available.")

    dispatched = []

    # 1. Telegram (Primary)
    chat_id = site.get("telegram_chat_id")
    if chat_id:
        token = _get_telegram_token()
        success = send_telegram_alert(chat_id, message, site.get("link_code", ""), token)
        if success:
            alert = {
                "alert_id": ddb.generate_id(),
                "site_id": site_id,
                "plan_id": plan_id,
                "channel": "telegram",
                "message_lang": lang,
                "message_text": message,
                "sent_at": format_iso(now_ist()),
                "delivered": True,
                "data_mode": plan.get("data_mode", "LIVE"),
            }
            ddb.put_alert(alert)
            dispatched.append("telegram")

            ddb.increment_metric("global", "alerts_sent", 1)

            ddb.put_feed_event({
                "event_type": "alert",
                "timestamp": format_iso(now_ist()),
                "site_id": site_id,
                "summary": f"Alert sent to Telegram for {site.get('name', site_id)}",
                "data_mode": alert["data_mode"],
                "data": {"channel": "telegram", "delivered": True},
            })

    # 2. SNS Email (Fallback)
    email = site.get("contact_email")
    if email and "telegram" not in dispatched:
        # Mock SNS logic for demo, log it
        logger.info(f"Would send SNS email to {email}")

    return {
        "statusCode": 200,
        "body": json.dumps({"dispatched": dispatched}),
    }
