"""Tests for Cedar policies using cedarpy."""

import pytest
import os
from pathlib import Path
from backend.agent.cedar_validator import validate_blocks

# Ensure the paths point to the right place during tests
os.environ["HEATSHIFT_POLICIES_DIR"] = str(Path(__file__).resolve().parent.parent / "backend" / "policies")


class TestCedarPolicies:
    
    def test_permit_baseline(self):
        site = {"site_id": "test1", "worker_count": 10, "over50_share": 0.1, "unshaded": False, "heavy_labor": False}
        blocks = [{"type": "work", "start": 8, "end": 12, "continuous_minutes": 60, "tier": 1}]
        
        decisions = validate_blocks(site, blocks, {})
        assert len(decisions) == 1
        assert decisions[0]["decision"] == "allow"
        assert "permit_baseline" in decisions[0]["policy_ids"]

    def test_forbid_extreme_heavy_unshaded(self):
        site = {"site_id": "test2", "worker_count": 10, "over50_share": 0.1, "unshaded": True, "heavy_labor": False}
        blocks = [{"type": "work", "start": 8, "end": 9, "continuous_minutes": 30, "tier": 3}]
        
        decisions = validate_blocks(site, blocks, {})
        assert len(decisions) == 1
        assert decisions[0]["decision"] == "deny"
        assert "forbid_extreme_heavy_unshaded" in decisions[0]["policy_ids"]

    def test_forbid_extreme_peak_hours(self):
        site = {"site_id": "test3", "worker_count": 10, "over50_share": 0.1, "unshaded": False, "heavy_labor": False}
        blocks = [{"type": "work", "start": 13, "end": 14, "continuous_minutes": 30, "tier": 3}]
        
        decisions = validate_blocks(site, blocks, {})
        assert len(decisions) == 1
        assert decisions[0]["decision"] == "deny"
        assert "forbid_extreme_peak_hours" in decisions[0]["policy_ids"]

    def test_forbid_high_tier_continuous_standard(self):
        site = {"site_id": "test4", "worker_count": 10, "over50_share": 0.1, "unshaded": False, "heavy_labor": False}
        blocks = [{"type": "work", "start": 8, "end": 9, "continuous_minutes": 60, "tier": 2}]
        
        decisions = validate_blocks(site, blocks, {})
        assert len(decisions) == 1
        assert decisions[0]["decision"] == "deny"
        assert "forbid_high_tier_continuous_standard" in decisions[0]["policy_ids"]

    def test_forbid_high_tier_continuous_vulnerable(self):
        site = {"site_id": "test5", "worker_count": 10, "over50_share": 0.4, "unshaded": False, "heavy_labor": False}
        blocks = [{"type": "work", "start": 8, "end": 9, "continuous_minutes": 40, "tier": 2}]
        
        decisions = validate_blocks(site, blocks, {})
        assert len(decisions) == 1
        assert decisions[0]["decision"] == "deny"
        assert "forbid_high_tier_continuous_vulnerable" in decisions[0]["policy_ids"]

    def test_allow_high_tier_continuous_vulnerable_under_limit(self):
        site = {"site_id": "test5", "worker_count": 10, "over50_share": 0.4, "unshaded": False, "heavy_labor": False}
        blocks = [{"type": "work", "start": 8, "end": 9, "continuous_minutes": 30, "tier": 2}]
        
        decisions = validate_blocks(site, blocks, {})
        assert len(decisions) == 1
        assert decisions[0]["decision"] == "allow"
        assert "permit_baseline" in decisions[0]["policy_ids"]
        # Note: In Cedar, if there's no explicit `permit` rule, it defaults to deny.
        # My permit baseline is only for tier <= 1. 
        # I should probably adjust the Cedar policies to have a generic permit that gets overridden by forbids, or explicitly permit tier 2 if conditions are met. Let's adjust heat.cedar.
