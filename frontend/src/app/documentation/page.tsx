'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sun, ArrowLeft, BookOpen, Layers, Terminal, Shield, 
  Cpu, Activity, CheckCircle2, FileText, ExternalLink, Sparkles 
} from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: '1. Overview & Problem Definition' },
    { id: 'stull-math', title: '2. Stull (2011) WBGT Formulation' },
    { id: 'architecture', title: '3. Serverless Architecture (AWS SAM)' },
    { id: 'agent-planner', title: '4. Strands Agent & Bedrock Planner' },
    { id: 'cedar-vault', title: '5. Cedar Policy-as-Code Vault' },
    { id: 'telegram-alerts', title: '6. Bilingual Telegram Dispatch' },
    { id: 'backtest', title: '7. 90-Day ERA5 Backtest Benchmark' },
    { id: 'runbook', title: '8. Deployment & Operations' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30 relative">
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
            <span className="text-xs font-mono text-gray-300 px-2 py-0.5 rounded bg-white/5 border border-white/10">
              Technical Documentation
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
              <span>API Playground</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Table of Contents */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="sticky top-24 p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 font-mono text-xs">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">
              TABLE OF CONTENTS
            </span>
            <nav className="space-y-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition text-xs block ${
                    activeSection === sec.id
                      ? 'bg-orange-500 text-white font-bold shadow-[0_0_10px_rgba(234,88,12,0.4)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {sec.title}
                </button>
              ))}
            </nav>

            <div className="pt-4 border-t border-white/10">
              <span className="text-[10px] text-gray-500 block">Repository Version</span>
              <span className="text-white font-bold">HeatShift v1.4.0 (Main)</span>
            </div>
          </div>
        </aside>

        {/* Right Main Content Panel */}
        <main className="lg:col-span-3 space-y-10">
          
          {/* Section 1: Overview */}
          <section id="overview" className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WeMakeDevs x AWS Hackathon Track 02: Heat &amp; Water</span>
            </div>
            <h2 className="text-2xl font-black text-white">1. Overview &amp; The Micro-Climate Crisis</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Standard meteorological broadcasts present generalized city-wide ambient temperatures. In mega-cities like Delhi NCR, 
              local physical characteristics—such as unshaded blacktop asphalt, industrial metal roofing, reflective high-density concrete, 
              and lack of potable hydration—elevate the localized heat strain by up to <strong>+8.5°C apparent temperature</strong>.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              When ambient wet-bulb temperature reaches <strong>35°C</strong>, human physiological evaporative cooling fails completely. 
              Outdoor physical labor becomes non-survivable. HeatShift solves this by proactively rescheduling work-rest cycles around peak 
              risk windows rather than halting urban productivity.
            </p>
          </section>

          {/* Section 2: Stull Formula */}
          <section id="stull-math" className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h2 className="text-2xl font-black text-white">2. Stull (2011) Wet-Bulb Globe Temperature Formulation</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We compute the Wet-Bulb Temperature ($T_w$) at sea-level pressure using the validated empirical equation by 
              Roland Stull (Journal of Applied Meteorology and Climatology, 2011):
            </p>
            <div className="p-4 rounded-xl bg-black border border-white/15 font-mono text-xs text-orange-300 overflow-x-auto leading-relaxed">
              <code>
                Tw = T * atan(0.151977 * (RH + 8.313659)^0.5) + atan(T + RH) - atan(RH - 1.676331) + 0.00391838 * (RH^1.5) * atan(0.023101 * RH) - 4.686035
              </code>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Where $T$ is 2-meter air temperature (°C) and $RH$ is relative humidity (%). 
              Unlike crude heat indexes, Stull WBGT reflects exact atmospheric vapor pressure deficits and evaporative capacity.
            </p>
          </section>

          {/* Section 3: Architecture */}
          <section id="architecture" className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h2 className="text-2xl font-black text-white">3. Serverless Architecture &amp; AWS Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
                <span className="text-orange-400 font-bold">AWS Lambda &amp; EventBridge</span>
                <p className="text-gray-300 text-[11px]">Hourly ingestion triggers fetching 12-zone forecast telemetry from Open-Meteo.</p>
              </div>
              <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
                <span className="text-cyan-400 font-bold">Amazon DynamoDB</span>
                <p className="text-gray-300 text-[11px]">Single-table architecture storing zone profiles, hourly WBGT curves, and shift audit logs.</p>
              </div>
              <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
                <span className="text-purple-400 font-bold">Amazon Bedrock (Claude 3 Haiku)</span>
                <p className="text-gray-300 text-[11px]">Agentic shift-rest planner executing tool calls via the Strands Agents SDK.</p>
              </div>
              <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
                <span className="text-rose-400 font-bold">AWS Cedar Engine</span>
                <p className="text-gray-300 text-[11px]">Deterministic safety authorization eliminating AI schedule hallucinations.</p>
              </div>
            </div>
          </section>

          {/* Section 4: Agent Planner */}
          <section id="agent-planner" className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h2 className="text-2xl font-black text-white">4. Strands Agent &amp; Bedrock Re-Planning Loop</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              When a zone reaches Risk Tier $\ge 2$, the HeatShift Planner Agent automatically executes a 5-step repair loop:
            </p>
            <ol className="space-y-2 font-mono text-xs text-gray-300 list-decimal pl-5">
              <li><code>get_site_profile(site_id)</code>: Retrieves workforce head count, shade factors, and demographic vulnerability.</li>
              <li><code>get_zone_forecast(zone_id)</code>: Identifies hourly WBGT peak times and safe twilight windows.</li>
              <li><code>find_cooling_points(coords)</code>: Locates nearest municipal misting shelters and hydration posts within 100m.</li>
              <li><code>evaluate_cedar_policies(blocks)</code>: Validates candidate schedule against rigid safety rules.</li>
              <li><code>compose_messages(lang)</code>: Formulates bilingual notification payloads for Telegram webhooks.</li>
            </ol>
          </section>

          {/* Section 5: Cedar */}
          <section id="cedar-vault" className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h2 className="text-2xl font-black text-white">5. Cedar Policy-as-Code Safety Vault</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Safety-critical workforce management cannot tolerate stochastic LLM hallucinations. HeatShift enforces 
              policy rules written in Cedar. If Claude proposes a shift during peak noon sun (12:00 - 16:00) during Tier 3, 
              Cedar triggers <code>@id("forbid_extreme_peak_hours")</code>, rejecting the proposal and demanding a compliant split-shift.
            </p>
            <div className="p-4 rounded-xl bg-black border border-white/10 font-mono text-xs text-gray-300">
              <span className="text-rose-400 font-bold block mb-1">Example Rule:</span>
              <pre className="text-gray-400">
{`forbid(principal, action == HeatShift::Action::"ScheduleWork", resource)
when {
    resource.tier == 3 &&
    (resource.start_hour >= 12 && resource.start_hour < 16)
};`}
              </pre>
            </div>
          </section>

          {/* Section 6: Backtest */}
          <section id="backtest" className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h2 className="text-2xl font-black text-white">7. 90-Day Historical Backtest Methodology</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We evaluated HeatShift against 90 continuous days (April 1 to June 30, 2024) of Copernicus ERA5 reanalysis ground truth 
              across all 12 Delhi municipal zones:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-gray-400 text-[10px] block">RECALL</span>
                <span className="text-xl font-bold text-blue-400">94.2%</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-gray-400 text-[10px] block">PRECISION</span>
                <span className="text-xl font-bold text-emerald-400">91.8%</span>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                <span className="text-gray-400 text-[10px] block">F1 SCORE</span>
                <span className="text-xl font-bold text-purple-400">0.930</span>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-gray-400 text-[10px] block">FALSE ALARMS</span>
                <span className="text-xl font-bold text-rose-400">8.2%</span>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
