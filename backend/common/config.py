"""HeatShift configuration loader.

Loads heat rules from YAML config and provides typed access
to thresholds, offsets, and work-rest rules.
"""

import os
import json
from pathlib import Path
from functools import lru_cache
from typing import Any

import yaml


def _find_config_dir() -> Path:
    """Find the config directory relative to this module or via env."""
    env_path = os.environ.get("HEATSHIFT_CONFIG_DIR")
    if env_path:
        return Path(env_path)
    # Relative to backend/common/ -> ../../config/
    return Path(__file__).resolve().parent.parent.parent / "config"


def _find_data_dir() -> Path:
    """Find the data directory relative to this module or via env."""
    env_path = os.environ.get("HEATSHIFT_DATA_DIR")
    if env_path:
        return Path(env_path)
    return Path(__file__).resolve().parent.parent.parent / "data"


@lru_cache(maxsize=1)
def load_heat_rules() -> dict[str, Any]:
    """Load and cache heat_rules.yaml."""
    config_path = _find_config_dir() / "heat_rules.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


@lru_cache(maxsize=1)
def load_zones() -> list[dict[str, Any]]:
    """Load and cache zones.json."""
    data_path = _find_data_dir() / "zones.json"
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_zones_by_id() -> dict[str, dict[str, Any]]:
    """Return zones indexed by id."""
    return {z["id"]: z for z in load_zones()}


def get_tier_thresholds() -> list[dict[str, Any]]:
    """Return tier threshold definitions sorted by tier number."""
    rules = load_heat_rules()
    return sorted(rules["tiers"], key=lambda t: t["tier"])


def get_vulnerability_offsets() -> dict[str, float]:
    """Return vulnerability offset values."""
    rules = load_heat_rules()
    return rules["vulnerability_offsets"]


def get_over50_threshold() -> float:
    """Return the threshold for over-50 worker share."""
    rules = load_heat_rules()
    return rules["over50_threshold"]


def get_work_rest_rules() -> dict[str, Any]:
    """Return work-rest rules keyed by tier."""
    rules = load_heat_rules()
    return rules["work_rest"]


def get_hydration_guidance(tier: int, lang: str = "en") -> str:
    """Return hydration guidance for a tier in the specified language."""
    rules = load_heat_rules()
    hydration = rules["hydration"]
    suffix = "_hi" if lang == "hi" else ""
    key = f"tier_{tier}{suffix}"
    return hydration.get(key, hydration.get(f"tier_0{suffix}", ""))


# Environment settings
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
DDB_TABLE_PREFIX = os.environ.get("DDB_TABLE_PREFIX", "HeatShift")
BEDROCK_MODEL_ID = os.environ.get(
    "BEDROCK_MODEL_ID",
    "anthropic.claude-3-haiku-20240307-v1:0"
)
BEDROCK_FALLBACK_MODEL_ID = os.environ.get(
    "BEDROCK_FALLBACK_MODEL_ID",
    "anthropic.claude-3-haiku-20240307-v1:0"
)
TELEGRAM_TOKEN_SSM_KEY = os.environ.get(
    "TELEGRAM_TOKEN_SSM_KEY",
    "/heatshift/telegram-token"
)
TELEGRAM_SECRET_SSM_KEY = os.environ.get(
    "TELEGRAM_SECRET_SSM_KEY",
    "/heatshift/telegram-secret"
)
ENABLE_SMS = os.environ.get("ENABLE_SMS", "false").lower() == "true"
WEBSOCKET_API_URL = os.environ.get("WEBSOCKET_API_URL", "")
CLOUDFRONT_DOMAIN = os.environ.get("CLOUDFRONT_DOMAIN", "")
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_PREVIOUS_RUNS_URL = "https://previous-runs-api.open-meteo.com/v1/forecast"
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
IST_OFFSET_HOURS = 5.5
