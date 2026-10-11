'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, Sun, ArrowLeft, CheckCircle2, ShieldAlert, 
  Terminal, Play, Lock, Code2, AlertTriangle, Layers, Sparkles 
} from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';

export default function CedarPoliciesPage() {
  const [selectedRule, setSelectedRule] = useState<'all' | 'extreme' | 'duration' | 'vulnerable'>('all');
  
  // Interactive Sandbox State
  const [tier, setTier] = useState<number>(3);
  const [startHour, setStartHour] = useState<number>(13);
  const [continuousMinutes, setContinuousMinutes] = useState<number>(60);
  const [heavyLabor, setHeavyLabor] = useState<boolean>(true);
  const [unshaded, setUnshaded] = useState<boolean>(true);
  const [over50Share, setOver50Share] = useState<number>(35);
  
  const [testResult, setTestResult] = useState<any>(null);

  const evaluateCedarLocally = () => {
    // Exact logic from backend/policies/heat.cedar
    // Rule 1: forbid_extreme_heavy_unshaded
    if (tier === 3 && (heavyLabor || unshaded)) {
      setTestResult({
        verdict: 'FORBID',
        policyId: '@id("forbid_extreme_heavy_unshaded")',
        rule: 'forbid when { resource.tier == 3 && (principal.heavy_labor || principal.unshaded) }',
        explanation: 'Extreme heat (Tier 3) combined with direct sun exposure or heavy physical labor causes imminent heatstroke risk. Policy strictly prohibits this assignment.',
        remedy: 'Move workers to shaded misting tent or postpone heavy labor until twilight (after 16:30).'
      });
      return;
    }

    // Rule 2: forbid_extreme_peak_hours
    if (tier === 3 && (startHour >= 12 && startHour < 16)) {
      setTestResult({
        verdict: 'FORBID',
        policyId: '@id("forbid_extreme_peak_hours")',
        rule: 'forbid when { resource.tier == 3 && (resource.start_hour >= 12 && resource.start_hour < 16) }',
        explanation: 'Peak solar radiation window (12:00 - 16:00 IST) is strictly quarantine-locked during Tier 3 conditions. No shifts can start or continue.',
        remedy: 'Split schedule: 05:30 - 10:30 morning shift + 16:30 - 19:30 evening shift.'
      });
      return;
    }

    // Rule 3: forbid_high_tier_continuous_vulnerable
    if (tier === 2 && over50Share > 30 && continuousMinutes > 30) {
      setTestResult({
        verdict: 'FORBID',
        policyId: '@id("forbid_high_tier_continuous_vulnerable")',
        rule: 'forbid when { resource.tier == 2 && principal.over50_share > 0.30 && resource.continuous_minutes > 30 }',
        explanation: 'Workforce contains >30% vulnerable demographic (age 50+). Under Tier 2 heat stress, continuous exposure exceeding 30 minutes is prohibited.',
        remedy: 'Enforce 30-minute rotation cycles with mandatory 15-minute hydration breaks.'
      });
      return;
    }

    // Rule 4: forbid_high_tier_continuous_standard
    if (tier === 2 && continuousMinutes > 45) {
      setTestResult({
        verdict: 'FORBID',
        policyId: '@id("forbid_high_tier_continuous_standard")',
        rule: 'forbid when { resource.tier == 2 && resource.continuous_minutes > 45 }',
        explanation: 'Continuous duration exceeds the 45-minute maximum limit for Tier 2 conditions.',
        remedy: 'Limit continuous work bouts to 45 minutes followed by 15 minutes of rest.'
      });
      return;
    }

    // Rule 5: forbid_moderate_tier_continuous
    if (tier === 1 && continuousMinutes > 90) {
      setTestResult({
        verdict: 'FORBID',
        policyId: '@id("forbid_moderate_tier_continuous")',
        rule: 'forbid when { resource.tier == 1 && resource.continuous_minutes > 90 }',
        explanation: 'Continuous duration exceeds the 90-minute limit for Tier 1 conditions.',
        remedy: 'Schedule regular hydration breaks every 90 minutes.'
      });
      return;
    }

    // Baseline: permit_baseline
    setTestResult({
      verdict: 'PERMIT',
      policyId: '@id("permit_baseline")',
      rule: 'permit when { resource.tier <= 3 }',
      explanation: 'Schedule satisfies all Cedar safety constraints and OSHA work-rest requirements. Authorized for workforce assignment.',
      remedy: 'Safe to proceed with standard hydration protocol.'
    });
  };

  const cedarPolicyText = `// HeatShift Work-Safety Policies (backend/policies/heat.cedar)

@id("permit_baseline")
permit(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier <= 3
};

@id("forbid_extreme_heavy_unshaded")
forbid(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier == 3 &&
    (principal.heavy_labor || principal.unshaded)
};

@id("forbid_extreme_peak_hours")
forbid(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier == 3 &&
    (resource.start_hour >= 12 && resource.start_hour < 16)
};

@id("forbid_high_tier_continuous_standard")
forbid(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier == 2 &&
    resource.continuous_minutes > 45
};

@id("forbid_high_tier_continuous_vulnerable")
forbid(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier == 2 &&
    principal.over50_share.greaterThan(decimal("0.30")) &&
    resource.continuous_minutes > 30
};

@id("forbid_moderate_tier_continuous")
forbid(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier == 1 &&
    resource.continuous_minutes > 90
};`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-rose-500/30 relative">
      <CustomCursor />
      <NoiseOverlay />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-400 to-red-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.5)]">
                <Sun className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg tracking-tight group-hover:text-orange-400 transition">HeatShift</span>
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-xs font-mono text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              Cedar Safety Vault
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-mono text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Live Console</span>
            </Link>
            <Link
              href="/forecasting-api"
              className="text-xs font-mono text-orange-400 hover:text-orange-300 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 transition flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Forecasting API</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Title */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs text-rose-300 mb-4 font-mono">
          <Lock className="w-3.5 h-3.5" />
          <span>Zero-Hallucination Policy-as-Code Defense Layer</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
          AWS Cedar Policy Safety Engine
        </h1>
        <p className="text-gray-400 max-w-3xl text-sm md:text-base leading-relaxed">
          While Amazon Bedrock Claude 3 Haiku dynamically plans complex split shifts, 
          every candidate block must pass mathematically rigorous authorization in Cedar. 
          No hallucinated or dangerous schedule can ever bypass the policy engine.
        </p>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20 space-y-8">
        
        {/* Interactive Policy Playground & Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Simulator Controls */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Interactive Cedar Policy Simulator</h3>
                    <p className="text-xs text-gray-400">Test work schedule authorization against heat.cedar</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                  cedarpy 3.1
                </span>
              </div>

              {/* Form Controls */}
              <div className="space-y-4 font-mono text-xs pt-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">HEAT RISK TIER (resource.tier)</span>
                    <span className="text-orange-400 font-bold">Tier {tier} ({tier === 3 ? 'Extreme' : tier === 2 ? 'High' : tier === 1 ? 'Moderate' : 'Safe'})</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={tier}
                    onChange={(e) => setTier(parseInt(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">SHIFT START HOUR (resource.start_hour)</span>
                    <span className="text-white font-bold">{startHour}:00 IST {startHour >= 12 && startHour < 16 ? '(PEAK SUN)' : ''}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="22"
                    step="1"
                    value={startHour}
                    onChange={(e) => setStartHour(parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">CONTINUOUS WORK DURATION (resource.continuous_minutes)</span>
                    <span className="text-white font-bold">{continuousMinutes} mins</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="15"
                    value={continuousMinutes}
                    onChange={(e) => setContinuousMinutes(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">WORKERS AGED 50+ (principal.over50_share)</span>
                    <span className="text-white font-bold">{over50Share}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={over50Share}
                    onChange={(e) => setOver50Share(parseInt(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="p-3 rounded-xl bg-black border border-white/10 flex items-center gap-2.5 cursor-pointer hover:border-white/20 transition">
                    <input
                      type="checkbox"
                      checked={unshaded}
                      onChange={(e) => setUnshaded(e.target.checked)}
                      className="accent-rose-500 rounded"
                    />
                    <span className="text-[11px] text-gray-300">Direct Sun (Unshaded)</span>
                  </label>

                  <label className="p-3 rounded-xl bg-black border border-white/10 flex items-center gap-2.5 cursor-pointer hover:border-white/20 transition">
                    <input
                      type="checkbox"
                      checked={heavyLabor}
                      onChange={(e) => setHeavyLabor(e.target.checked)}
                      className="accent-rose-500 rounded"
                    />
                    <span className="text-[11px] text-gray-300">Heavy Manual Labor</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 mt-6">
              <button
                onClick={evaluateCedarLocally}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-bold rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.4)]"
              >
                <Shield className="w-4 h-4" />
                <span>Evaluate Cedar Authorization</span>
              </button>
            </div>
          </div>

          {/* Test Verdict & Explanation Output */}
          <div className="p-6 rounded-2xl bg-black border border-white/10 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-bold">
                  EVALUATION RESULT
                </span>
                {testResult && (
                  <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                    testResult.verdict === 'PERMIT' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  }`}>
                    VERDICT: {testResult.verdict}
                  </span>
                )}
              </div>

              {testResult ? (
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase">Triggered Policy ID</span>
                    <p className="text-sm font-bold text-white text-rose-300">{testResult.policyId}</p>
                    <p className="text-[11px] text-gray-400 font-mono pt-1">{testResult.rule}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase">Policy Rationale</span>
                    <p className="text-gray-300 text-xs leading-relaxed">{testResult.explanation}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold">AI Planner Corrective Action</span>
                    <p className="text-gray-200 text-xs leading-relaxed">{testResult.remedy}</p>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center font-mono text-xs text-gray-500 space-y-2">
                  <ShieldAlert className="w-8 h-8 text-gray-600 mx-auto" />
                  <p>Configure parameters on the left and click "Evaluate Cedar Authorization".</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 text-xs font-mono text-gray-500 flex justify-between items-center">
              <span>Policy File: <code>backend/policies/heat.cedar</code></span>
              <span className="text-emerald-400">Strict Determinism Active</span>
            </div>
          </div>
        </div>

        {/* Full Cedar Policy Code Explorer */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-white text-base">Production Cedar Policy Source (heat.cedar)</h3>
            </div>
            <span className="text-xs font-mono text-gray-400">AWS Cedar v3.1 Specification</span>
          </div>

          <div className="p-4 rounded-xl bg-black border border-white/10 font-mono text-xs overflow-x-auto text-gray-300 leading-relaxed max-h-96">
            <pre>{cedarPolicyText}</pre>
          </div>
        </div>

      </main>
    </div>
  );
}
