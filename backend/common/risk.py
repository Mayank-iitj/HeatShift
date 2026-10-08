"""HeatShift Risk Engine.

Pure functions for computing wet-bulb temperature, effective apparent
temperature, and risk tiers from weather data.

All thresholds are configurable heuristics, NOT medical standards.

Wet-bulb calculation uses the Stull (2011) approximation:
  Stull, R. (2011). Wet-Bulb Temperature from Relative Humidity and Air
  Temperature. Journal of Applied Meteorology and Climatology, 50(11),
  2267–2269.

Valid approximately for RH 5–99% and T −20–50°C.
"""

import math
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class RiskAssessment:
    """Result of a risk assessment for a single hour."""
    temperature: float          # °C, raw air temperature
    relative_humidity: float    # %, raw
    apparent_temperature: float # °C, from forecast
    wet_bulb: float             # °C, computed
    effective_apparent: float   # °C, with vulnerability offsets
    tier: int                   # 0–3
    tier_label: str             # Low / Moderate / High / Extreme
    shortwave_radiation: Optional[float] = None  # W/m²
    wind_speed: Optional[float] = None           # m/s


# Default tier thresholds (can be overridden)
DEFAULT_TIER_THRESHOLDS = [
    {"tier": 0, "label": "Low",      "apparent_max": 32.0, "wb_max": 26.0},
    {"tier": 1, "label": "Moderate", "apparent_max": 38.0, "wb_max": 28.0},
    {"tier": 2, "label": "High",     "apparent_max": 45.0, "wb_max": 31.0},
    {"tier": 3, "label": "Extreme",  "apparent_max": float("inf"), "wb_max": float("inf")},
]


def clamp(value: float, lo: float, hi: float) -> float:
    """Clamp a value to [lo, hi]."""
    return max(lo, min(hi, value))


def compute_wet_bulb(temperature_c: float, relative_humidity_pct: float) -> float:
    """Compute wet-bulb temperature using the Stull (2011) approximation.

    Args:
        temperature_c: Air temperature in °C. Clamped to [−20, 50].
        relative_humidity_pct: Relative humidity in %. Clamped to [5, 99].

    Returns:
        Wet-bulb temperature in °C.

    Raises:
        ValueError: If inputs are NaN.
    """
    if math.isnan(temperature_c) or math.isnan(relative_humidity_pct):
        raise ValueError(
            f"NaN input: temperature={temperature_c}, "
            f"relative_humidity={relative_humidity_pct}"
        )

    t = clamp(temperature_c, -20.0, 50.0)
    rh = clamp(relative_humidity_pct, 5.0, 99.0)

    tw = (
        t * math.atan(0.151977 * (rh + 8.313659) ** 0.5)
        + math.atan(t + rh)
        - math.atan(rh - 1.676331)
        + 0.00391838 * rh ** 1.5 * math.atan(0.023101 * rh)
        - 4.686035
    )
    return round(tw, 2)


def compute_effective_apparent(
    apparent_temperature: float,
    unshaded: bool = False,
    heavy_labor: bool = False,
    over50_share: float = 0.0,
    offsets: Optional[dict[str, float]] = None,
    over50_threshold: float = 0.30,
) -> float:
    """Compute effective apparent temperature with vulnerability offsets.

    Args:
        apparent_temperature: Base apparent temperature from forecast (°C).
        unshaded: Whether the work area is unshaded.
        heavy_labor: Whether work involves heavy physical labor.
        over50_share: Share of workers over 50 years old (0–1).
        offsets: Custom offset values. Defaults to standard offsets.
        over50_threshold: Threshold above which over-50 offset applies.

    Returns:
        Effective apparent temperature in °C.
    """
    if math.isnan(apparent_temperature):
        raise ValueError(f"NaN apparent_temperature: {apparent_temperature}")

    if offsets is None:
        offsets = {"unshaded": 2.0, "heavy_labor": 1.5, "over50_high": 1.0}

    effective = apparent_temperature
    if unshaded:
        effective += offsets.get("unshaded", 2.0)
    if heavy_labor:
        effective += offsets.get("heavy_labor", 1.5)
    if over50_share > over50_threshold:
        effective += offsets.get("over50_high", 1.0)

    return round(effective, 2)


def compute_tier(
    effective_apparent: float,
    wet_bulb: float,
    thresholds: Optional[list[dict]] = None,
) -> tuple[int, str]:
    """Determine risk tier from effective apparent temp and wet-bulb temp.

    Tier is the maximum of the two individual tier assessments
    (apparent temperature tier and wet-bulb tier).

    Args:
        effective_apparent: Effective apparent temperature in °C.
        wet_bulb: Wet-bulb temperature in °C.
        thresholds: Custom tier thresholds.

    Returns:
        Tuple of (tier_number, tier_label).
    """
    if thresholds is None:
        thresholds = DEFAULT_TIER_THRESHOLDS

    def _tier_for_value(value: float, key: str) -> int:
        for thresh in thresholds:
            if value < thresh[key]:
                return thresh["tier"]
        return thresholds[-1]["tier"]

    apparent_tier = _tier_for_value(effective_apparent, "apparent_max")
    wb_tier = _tier_for_value(wet_bulb, "wb_max")
    final_tier = max(apparent_tier, wb_tier)

    label = "Unknown"
    for thresh in thresholds:
        if thresh["tier"] == final_tier:
            label = thresh["label"]
            break

    return final_tier, label


def assess_risk(
    temperature_c: float,
    relative_humidity_pct: float,
    apparent_temperature: float,
    unshaded: bool = False,
    heavy_labor: bool = False,
    over50_share: float = 0.0,
    shortwave_radiation: Optional[float] = None,
    wind_speed: Optional[float] = None,
    offsets: Optional[dict[str, float]] = None,
    over50_threshold: float = 0.30,
    thresholds: Optional[list[dict]] = None,
) -> RiskAssessment:
    """Full risk assessment for a single hour.

    Args:
        temperature_c: Air temperature in °C.
        relative_humidity_pct: Relative humidity in %.
        apparent_temperature: Apparent/feels-like temperature from forecast (°C).
        unshaded: Whether work area is unshaded.
        heavy_labor: Whether work involves heavy physical labor.
        over50_share: Share of workers over 50.
        shortwave_radiation: Solar radiation in W/m² (informational).
        wind_speed: Wind speed in m/s (informational).
        offsets: Custom vulnerability offsets.
        over50_threshold: Threshold for over-50 offset.
        thresholds: Custom tier thresholds.

    Returns:
        RiskAssessment with all computed values.
    """
    wb = compute_wet_bulb(temperature_c, relative_humidity_pct)
    effective = compute_effective_apparent(
        apparent_temperature, unshaded, heavy_labor,
        over50_share, offsets, over50_threshold
    )
    tier, label = compute_tier(effective, wb, thresholds)

    return RiskAssessment(
        temperature=round(temperature_c, 2),
        relative_humidity=round(relative_humidity_pct, 2),
        apparent_temperature=round(apparent_temperature, 2),
        wet_bulb=wb,
        effective_apparent=effective,
        tier=tier,
        tier_label=label,
        shortwave_radiation=shortwave_radiation,
        wind_speed=wind_speed,
    )


def compute_exposure_hours_avoided(
    original_shift_hours: list[int],
    new_shift_hours: list[int],
    hourly_tiers: dict[int, int],
    worker_count: int,
    min_tier: int = 2,
) -> float:
    """Compute person-hours of unsafe exposure avoided (modeled).

    For each hour in the original shift that is NOT in the new shift
    and has a tier >= min_tier, count it as an avoided exposure hour
    multiplied by the worker count.

    Args:
        original_shift_hours: List of hours (0–23) in the original shift.
        new_shift_hours: List of hours (0–23) in the new (adjusted) shift.
        hourly_tiers: Mapping of hour (0–23) to risk tier (0–3).
        worker_count: Number of workers at the site.
        min_tier: Minimum tier to count as unsafe (default: 2 = High).

    Returns:
        Person-hours of High/Extreme exposure avoided (modeled value).
    """
    avoided = 0.0
    removed_hours = set(original_shift_hours) - set(new_shift_hours)
    for hour in removed_hours:
        tier = hourly_tiers.get(hour, 0)
        if tier >= min_tier:
            avoided += worker_count
    return avoided
