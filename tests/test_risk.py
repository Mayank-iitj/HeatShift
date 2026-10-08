"""Tests for HeatShift Risk Engine.

Covers:
- Wet-bulb temperature (Stull 2011) with known values
- Tier boundary computation
- Vulnerability offsets
- Input clamping
- NaN handling
- Exposure hours avoided calculation
"""

import math
import pytest

from backend.common.risk import (
    clamp,
    compute_wet_bulb,
    compute_effective_apparent,
    compute_tier,
    assess_risk,
    compute_exposure_hours_avoided,
    RiskAssessment,
)


# ─── Clamp ───

class TestClamp:
    def test_within_range(self):
        assert clamp(5.0, 0.0, 10.0) == 5.0

    def test_below_range(self):
        assert clamp(-5.0, 0.0, 10.0) == 0.0

    def test_above_range(self):
        assert clamp(15.0, 0.0, 10.0) == 10.0

    def test_at_boundary(self):
        assert clamp(0.0, 0.0, 10.0) == 0.0
        assert clamp(10.0, 0.0, 10.0) == 10.0


# ─── Wet-Bulb Temperature ───

class TestWetBulb:
    """Verify Stull (2011) implementation.

    Reference values from Table 1 of:
    Stull, R. (2011). Wet-Bulb Temperature from Relative Humidity and Air
    Temperature. J. Appl. Meteor. Climatol., 50(11), 2267–2269.
    """

    def test_moderate_conditions(self):
        """T=25°C, RH=50% → Tw ≈ 17.9°C (within 1°C of published)."""
        tw = compute_wet_bulb(25.0, 50.0)
        assert 16.5 <= tw <= 19.0, f"Expected ~17.9, got {tw}"

    def test_hot_humid(self):
        """T=35°C, RH=75% → Tw should be high (>30°C)."""
        tw = compute_wet_bulb(35.0, 75.0)
        assert tw > 30.0, f"Expected >30, got {tw}"

    def test_hot_dry(self):
        """T=40°C, RH=20% → Tw should be much lower than T."""
        tw = compute_wet_bulb(40.0, 20.0)
        assert tw < 30.0, f"Expected <30 for hot-dry, got {tw}"
        assert tw > 15.0, f"Expected >15 for hot-dry, got {tw}"

    def test_cold_dry(self):
        """T=5°C, RH=30% → Tw should be below T."""
        tw = compute_wet_bulb(5.0, 30.0)
        assert tw < 5.0, f"Expected <5, got {tw}"

    def test_saturated(self):
        """At 99% RH, Tw should be very close to T."""
        tw = compute_wet_bulb(30.0, 99.0)
        assert abs(tw - 30.0) < 2.0, f"Expected close to 30, got {tw}"

    def test_clamping_low_rh(self):
        """RH below 5% gets clamped to 5%."""
        tw = compute_wet_bulb(30.0, 2.0)
        tw_clamped = compute_wet_bulb(30.0, 5.0)
        assert tw == tw_clamped

    def test_clamping_high_temp(self):
        """Temp above 50°C gets clamped to 50°C."""
        tw = compute_wet_bulb(55.0, 50.0)
        tw_clamped = compute_wet_bulb(50.0, 50.0)
        assert tw == tw_clamped

    def test_clamping_low_temp(self):
        """Temp below -20°C gets clamped to -20°C."""
        tw = compute_wet_bulb(-25.0, 50.0)
        tw_clamped = compute_wet_bulb(-20.0, 50.0)
        assert tw == tw_clamped

    def test_nan_temperature_raises(self):
        with pytest.raises(ValueError, match="NaN"):
            compute_wet_bulb(float("nan"), 50.0)

    def test_nan_humidity_raises(self):
        with pytest.raises(ValueError, match="NaN"):
            compute_wet_bulb(30.0, float("nan"))

    def test_result_is_float(self):
        tw = compute_wet_bulb(30.0, 50.0)
        assert isinstance(tw, float)

    def test_wet_bulb_less_than_or_equal_temp(self):
        """Wet-bulb should generally be ≤ dry-bulb temperature."""
        for t in range(0, 50, 5):
            for rh in range(10, 100, 10):
                tw = compute_wet_bulb(float(t), float(rh))
                # Allow small tolerance due to approximation
                assert tw <= t + 1.5, f"Tw={tw} > T={t}+1.5 at RH={rh}"

    def test_delhi_summer_typical(self):
        """Delhi May: T=45°C, RH=20% → moderate wet-bulb."""
        tw = compute_wet_bulb(45.0, 20.0)
        assert 20.0 < tw < 35.0, f"Expected 20-35 for Delhi summer dry, got {tw}"

    def test_delhi_monsoon_typical(self):
        """Delhi July: T=35°C, RH=80% → high wet-bulb."""
        tw = compute_wet_bulb(35.0, 80.0)
        assert tw > 30.0, f"Expected >30 for Delhi monsoon, got {tw}"


# ─── Effective Apparent Temperature ───

class TestEffectiveApparent:
    def test_no_offsets(self):
        result = compute_effective_apparent(40.0)
        assert result == 40.0

    def test_unshaded(self):
        result = compute_effective_apparent(40.0, unshaded=True)
        assert result == 42.0

    def test_heavy_labor(self):
        result = compute_effective_apparent(40.0, heavy_labor=True)
        assert result == 41.5

    def test_over50_above_threshold(self):
        result = compute_effective_apparent(40.0, over50_share=0.35)
        assert result == 41.0

    def test_over50_below_threshold(self):
        result = compute_effective_apparent(40.0, over50_share=0.25)
        assert result == 40.0

    def test_over50_at_threshold(self):
        """At exactly 0.30, offset should NOT apply (> not >=)."""
        result = compute_effective_apparent(40.0, over50_share=0.30)
        assert result == 40.0

    def test_all_offsets_stacked(self):
        result = compute_effective_apparent(
            40.0, unshaded=True, heavy_labor=True, over50_share=0.5
        )
        assert result == 44.5  # 40 + 2 + 1.5 + 1

    def test_custom_offsets(self):
        result = compute_effective_apparent(
            40.0, unshaded=True,
            offsets={"unshaded": 3.0, "heavy_labor": 2.0, "over50_high": 1.5}
        )
        assert result == 43.0

    def test_nan_raises(self):
        with pytest.raises(ValueError, match="NaN"):
            compute_effective_apparent(float("nan"))


# ─── Tier Computation ───

class TestTier:
    def test_tier_0_low(self):
        tier, label = compute_tier(30.0, 24.0)
        assert tier == 0
        assert label == "Low"

    def test_tier_1_moderate_by_apparent(self):
        tier, label = compute_tier(35.0, 24.0)
        assert tier == 1
        assert label == "Moderate"

    def test_tier_1_moderate_by_wetbulb(self):
        tier, label = compute_tier(30.0, 27.0)
        assert tier == 1
        assert label == "Moderate"

    def test_tier_2_high(self):
        tier, label = compute_tier(40.0, 29.0)
        assert tier == 2
        assert label == "High"

    def test_tier_3_extreme_by_apparent(self):
        tier, label = compute_tier(46.0, 25.0)
        assert tier == 3
        assert label == "Extreme"

    def test_tier_3_extreme_by_wetbulb(self):
        tier, label = compute_tier(30.0, 32.0)
        assert tier == 3
        assert label == "Extreme"

    def test_tier_is_max_of_both(self):
        """Apparent says tier 1, wet-bulb says tier 2 → tier 2."""
        tier, _ = compute_tier(35.0, 29.0)
        assert tier == 2

    def test_boundary_32_is_moderate(self):
        """At exactly 32°C apparent, tier should be 1 (Moderate), not 0."""
        tier, _ = compute_tier(32.0, 20.0)
        assert tier == 1

    def test_boundary_just_below_32(self):
        tier, _ = compute_tier(31.99, 20.0)
        assert tier == 0

    def test_boundary_38_is_high(self):
        tier, _ = compute_tier(38.0, 20.0)
        assert tier == 2

    def test_boundary_45_is_extreme(self):
        tier, _ = compute_tier(45.0, 20.0)
        assert tier == 3


# ─── Full Risk Assessment ───

class TestAssessRisk:
    def test_returns_risk_assessment(self):
        result = assess_risk(35.0, 50.0, 38.0)
        assert isinstance(result, RiskAssessment)

    def test_hot_delhi_day(self):
        """Simulated Delhi May afternoon: T=45, RH=20, apparent=47."""
        result = assess_risk(45.0, 20.0, 47.0, unshaded=True, heavy_labor=True)
        assert result.tier == 3
        assert result.tier_label == "Extreme"
        assert result.effective_apparent == 47.0 + 2.0 + 1.5

    def test_cool_morning(self):
        result = assess_risk(25.0, 60.0, 26.0)
        assert result.tier == 0
        assert result.tier_label == "Low"

    def test_optional_fields(self):
        result = assess_risk(
            35.0, 50.0, 38.0,
            shortwave_radiation=800.0,
            wind_speed=3.5,
        )
        assert result.shortwave_radiation == 800.0
        assert result.wind_speed == 3.5


# ─── Exposure Hours Avoided ───

class TestExposureHoursAvoided:
    def test_simple_case(self):
        """Removing 2 unsafe hours for 10 workers = 20 person-hours."""
        original = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
        new = [6, 7, 8, 9, 10, 11, 16, 17]
        tiers = {h: (2 if 12 <= h <= 15 else 0) for h in range(24)}
        avoided = compute_exposure_hours_avoided(original, new, tiers, 10)
        assert avoided == 40.0  # hours 12,13,14,15 removed, all tier 2

    def test_no_unsafe_hours_removed(self):
        """Removing only safe hours yields 0."""
        original = [8, 9, 10, 11, 12]
        new = [9, 10, 11, 12]
        tiers = {h: 0 for h in range(24)}
        avoided = compute_exposure_hours_avoided(original, new, tiers, 10)
        assert avoided == 0.0

    def test_all_hours_unsafe_and_removed(self):
        original = [12, 13, 14, 15]
        new = []
        tiers = {h: 3 for h in range(24)}
        avoided = compute_exposure_hours_avoided(original, new, tiers, 5)
        assert avoided == 20.0  # 4 hours × 5 workers

    def test_zero_workers(self):
        original = [12, 13]
        new = []
        tiers = {12: 3, 13: 3}
        avoided = compute_exposure_hours_avoided(original, new, tiers, 0)
        assert avoided == 0.0

    def test_partial_overlap(self):
        original = [10, 11, 12, 13, 14]
        new = [10, 11, 14]
        tiers = {10: 0, 11: 1, 12: 2, 13: 3, 14: 1}
        avoided = compute_exposure_hours_avoided(original, new, tiers, 8)
        # Removed: 12 (tier 2), 13 (tier 3) → 2 hours × 8 = 16
        assert avoided == 16.0

    def test_custom_min_tier(self):
        original = [12, 13]
        new = []
        tiers = {12: 1, 13: 2}
        # With min_tier=1, both count
        avoided = compute_exposure_hours_avoided(original, new, tiers, 5, min_tier=1)
        assert avoided == 10.0
