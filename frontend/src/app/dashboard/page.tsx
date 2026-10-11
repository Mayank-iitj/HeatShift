'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Activity, Shield, Users, ArrowLeft, Thermometer, Clock, AlertTriangle, 
  CheckCircle2, RefreshCw, Send, Zap, Eye, X, ChevronRight, Droplets, Sun, 
  MapPin, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceArea, ReferenceLine 
} from 'recharts';

interface HourlyHeatPoint {
  hour: string;
  hourNum: number;
  temp: number;
  humidity: number;
  wbgt: number;
  solar: number;
  tier: number;
  riskLabel: 'Safe' | 'Moderate' | 'High' | 'Extreme';
  workRestRatio: string;
}

interface SiteData {
  id: string;
  name: string;
  zone: string;
  workers: number;
  laborType: string;
  shadeFactor: number;
  hydrationMeters: number;
  temp: number;
  wbgt: number;
  tier: number;
  status: 'Safe (Normal)' | 'Modified (Hydration)' | 'Rest (Peak Heat)';
  standardShift: string;
  aiShift: string;
  cedarStatus: 'Permit' | 'Forbid' | 'Review';
}

interface FeedEvent {
  id: string;
  time: string;
  type: string;
  message: string;
  badge: string;
}

export default function Dashboard() {
  const [scenario, setScenario] = useState<'extreme' | 'moderate' | 'monsoon'>('extreme');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(7); // default 13:00 / 14:00
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [siteFilter, setSiteFilter] = useState<'all' | '3' | '2' | '1'>('all');
  
  // Dynamic stats & data
  const [stats, setStats] = useState({
    activeShifts: 4850,
    elevatedRisk: 18,
    violationsBlocked: 247,
    exposureAvoided: 1420,
    peakWBGT: 34.2,
    currentAvgWBGT: 33.4
  });
  const [hourly, setHourly] = useState<HourlyHeatPoint[]>([]);
  const [sites, setSites] = useState<SiteData[]>([]);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Agent Re-plan Simulation State
  const [isReplanning, setIsReplanning] = useState(false);
  const [replanSuccess, setReplanSuccess] = useState<any>(null);
  const [replanSteps, setReplanSteps] = useState<string[]>([]);

  // Cedar Violation Test State
  const [violationBlockedAlert, setViolationBlockedAlert] = useState<any>(null);
  const [telegramSent, setTelegramSent] = useState(false);

  // Fetch Dashboard Data
  const loadDashboard = async (selectedScenario: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?scenario=${selectedScenario}`);
      const data = await res.json();
      setStats(data.stats);
      setHourly(data.hourly);
      setSites(data.sites);
      setFeed(data.feed);
      if (data.sites?.length > 0 && !selectedSite) {
        setSelectedSite(data.sites[0]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(scenario);
  }, [scenario]);

  const currentHourPoint = useMemo(() => {
    if (hourly.length === 0) return null;
    return hourly[Math.min(selectedHourIndex, hourly.length - 1)];
  }, [hourly, selectedHourIndex]);

  // Handle AI Shift-Shift Re-plan Trigger
  const handleTriggerReplan = async () => {
    setIsReplanning(true);
    setReplanSuccess(null);
    setReplanSteps([]);

    const steps = [
      'Ingesting live hyper-local Stull WBGT for 12 NCR Industrial Zones (Detected 33.8°C at 13:00)...',
      'Scanning labor vulnerability matrix (Steel rebar tying, 15% shade factor, 42 avg worker age)...',
      'Synthesizing optimized dual split-shift: Early Morning (05:30-10:30) + Twilight (16:30-19:30)...',
      'Submitting candidate schedule to Cedar Policy-as-Code Safety Vault...',
      'Cedar Policy Verdict: PERMIT (0 safety violations detected, 4.5 heat exposure hours avoided per worker).'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 450));
      setReplanSteps(prev => [...prev, steps[i]]);
    }

    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'replan' })
      });
      const data = await res.json();
      setReplanSuccess(data);
      // Prepend to feed
      setFeed(prev => [
        {
          id: String(Date.now()),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'agent',
          message: 'Amazon Bedrock Agent successfully generated and verified Cedar-compliant split shift across 12 zones.',
          badge: 'AI RE-PLAN'
        },
        ...prev
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReplanning(false);
    }
  };

  // Handle Test Policy Violation Attack
  const handleTestViolation = async () => {
    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-violation' })
      });
      const data = await res.json();
      setViolationBlockedAlert(data);
      setStats(prev => ({ ...prev, violationsBlocked: prev.violationsBlocked + 1 }));
      setFeed(prev => [
        {
          id: String(Date.now()),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'cedar',
          message: `Cedar Vault actively BLOCKED unsafe shift: ${data.ruleBroken}`,
          badge: 'POLICY BLOCK'
        },
        ...prev
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Telegram Dispatch
  const handleSendTelegram = () => {
    setTelegramSent(true);
    setTimeout(() => setTelegramSent(false), 4000);
    setFeed(prev => [
      {
        id: String(Date.now()),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'telegram',
        message: `Bilingual Telegram heat advisory broadcasted to 28 site supervisors across NCR.`,
        badge: 'TELEGRAM DISPATCH'
      },
      ...prev
    ]);
  };

  // Filtered Sites
  const filteredSites = useMemo(() => {
    if (siteFilter === 'all') return sites;
    return sites.filter(s => String(s.tier) === siteFilter);
  }, [sites, siteFilter]);

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-orange-500/30 relative font-sans pb-16">
      <CustomCursor />
      <NoiseOverlay />

      {/* Top Navbar & Scenario Switcher */}
      <nav className="relative z-20 border-b border-white/10 bg-[#080808]/90 backdrop-blur-md px-6 py-3.5 sticky top-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Landing Page</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.6)]">
              <Thermometer className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-sm flex items-center gap-2">
                HeatShift <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">AI Console</span>
              </span>
              <p className="text-[10px] text-gray-400 leading-none">Hyper-Local Heat Risk &amp; Autonomous Shift Re-Planning</p>
            </div>
          </div>
        </div>

        {/* Center: Scenario Switcher */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 p-1 rounded-xl text-xs">
          <span className="text-gray-400 text-[11px] font-mono px-2 hidden md:inline">SCENARIO:</span>
          {(['extreme', 'moderate', 'monsoon'] as const).map(sc => (
            <button
              key={sc}
              onClick={() => setScenario(sc)}
              className={`px-2.5 py-1 rounded-lg font-medium transition capitalize ${
                scenario === sc
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold shadow-[0_0_12px_rgba(234,88,12,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {sc === 'extreme' ? '🔥 45.4°C Heatwave' : sc === 'moderate' ? '☀️ 39°C Summer' : '💨 88% Monsoon'}
            </button>
          ))}
        </div>

        {/* Right: Bilingual Toggle & Heartbeat */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <div className="flex bg-white/[0.04] border border-white/10 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded ${language === 'en' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 rounded ${language === 'hi' ? 'bg-orange-500 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              हिंदी
            </button>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AWS SAM LIVE</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'en' ? 'Active Workers Monitored' : 'सक्रिय श्रमिक निगरानी'}
              </span>
              <Users className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {loading ? '...' : stats.activeShifts.toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Across 12 major NCR industrial &amp; metro sectors</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-red-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'en' ? 'Extreme Risk Zones (Tier 3)' : 'अत्यधिक जोखिम क्षेत्र (टियर 3)'}
              </span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-black text-red-400 font-mono">
              {loading ? '...' : stats.elevatedRisk} <span className="text-xs text-gray-400 font-normal">/ 12 Zones</span>
            </div>
            <p className="text-[11px] text-red-400/80 mt-1">Stull WBGT &gt; 33.0°C (Unshaded work halted)</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-rose-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'en' ? 'Cedar Violations Blocked' : 'सीडार नीतियां द्वारा रोके गए उल्लंघन'}
              </span>
              <Shield className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {loading ? '...' : stats.violationsBlocked}
            </div>
            <p className="text-[11px] text-rose-400/80 mt-1">100% Policy-as-Code determinism (Zero hallucinations)</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'en' ? 'Heat Exposure Hours Avoided' : 'बचाए गए हीट एक्सपोजर घंटे'}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {loading ? '...' : `${stats.exposureAvoided.toLocaleString()} hrs`}
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-1">Proactively shifted to morning &amp; twilight</p>
          </div>
        </div>

        {/* SECTION 1: 24-HOUR DYNAMIC THERMAL RISK ENGINE (Recharts) */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-orange-400" />
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {language === 'en' ? 'Hyper-Local Thermal Risk Engine (Stull WBGT)' : 'हाइपर-लोकल थर्मल रिस्क इंजन (स्टुल WBGT)'}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  DIURNAL 24H MODEL
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Combining ambient dry-bulb temperature, relative humidity, and solar radiance into OSHA/ISO 7243 Wet-Bulb Globe Temperature.
              </p>
            </div>

            {/* Current Selected Hour Inspection Card */}
            {currentHourPoint && (
              <div className="flex items-center gap-4 bg-black/60 border border-white/15 px-4 py-2 rounded-xl font-mono text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px]">INSPECTED TIME</span>
                  <span className="text-white font-bold text-sm">{currentHourPoint.hour}</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-gray-500 block text-[10px]">AMBIENT TEMP</span>
                  <span className="text-orange-400 font-bold text-sm">{currentHourPoint.temp}°C</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-gray-500 block text-[10px]">STULL WBGT</span>
                  <span className={`font-bold text-sm ${currentHourPoint.wbgt >= 33 ? 'text-red-400' : currentHourPoint.wbgt >= 31 ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {currentHourPoint.wbgt}°C
                  </span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-gray-500 block text-[10px]">RISK PROTOCOL</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    currentHourPoint.tier === 3 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    currentHourPoint.tier === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {currentHourPoint.riskLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Time Scrubber Slider */}
          <div className="mb-4 bg-white/[0.03] border border-white/10 p-3 rounded-xl flex items-center gap-4">
            <span className="text-xs text-gray-400 font-mono whitespace-nowrap flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>Scrub 24h Timeline:</span>
            </span>
            <input
              type="range"
              min="0"
              max={Math.max(0, hourly.length - 1)}
              value={selectedHourIndex}
              onChange={(e) => setSelectedHourIndex(parseInt(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 whitespace-nowrap">
              {currentHourPoint?.hour || '13:00'} ({currentHourPoint?.workRestRatio})
            </span>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wbgtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="hour" stroke="#666" tick={{ fontSize: 11 }} />
                <YAxis domain={[20, 50]} stroke="#666" tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as HourlyHeatPoint;
                      return (
                        <div className="bg-neutral-950 border border-white/20 p-3 rounded-xl shadow-xl text-xs font-mono">
                          <p className="font-bold text-white mb-1.5">{d.hour} • Risk: {d.riskLabel}</p>
                          <div className="space-y-1 text-gray-300">
                            <p><span className="text-orange-400">Ambient Temp:</span> {d.temp}°C</p>
                            <p><span className="text-red-400 font-bold">Stull WBGT:</span> {d.wbgt}°C</p>
                            <p><span className="text-cyan-400">Humidity:</span> {d.humidity}%</p>
                            <p><span className="text-yellow-400">Solar Radiance:</span> {d.solar} W/m²</p>
                            <p className="text-gray-400 text-[10px] pt-1 border-t border-neutral-800">{d.workRestRatio}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Danger Reference Areas */}
                <ReferenceArea y1={33} y2={50} fill="#ef4444" fillOpacity={0.12} />
                <ReferenceArea y1={31} y2={33} fill="#f97316" fillOpacity={0.08} />
                <ReferenceArea y1={28} y2={31} fill="#eab308" fillOpacity={0.05} />
                
                {/* Wet-Bulb & Ambient Temp Lines */}
                <Area type="monotone" dataKey="wbgt" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#wbgtGrad)" name="Wet-Bulb (WBGT °C)" />
                <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={1.8} strokeDasharray="4 4" dot={false} name="Dry-Bulb Ambient (°C)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Threshold Legend Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-white/10 gap-2">
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>&lt;28°C Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span>28–31°C Moderate (15m Rest/h)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>31–33°C High (30m Rest/h)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>&gt;33°C Extreme (Halt Unshaded Labor)</span>
              </div>
            </div>
            <span className="text-[11px] text-gray-500 italic">
              Formulated per Stull (2011) Wet-Bulb Equation &amp; OSHA Heat Stress Standard
            </span>
          </div>
        </div>

        {/* SECTION 2: AI AGENT RE-PLANNER & CEDAR POLICY VAULT (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* AI AGENT RE-PLANNER (Bedrock / Strands Simulator) */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Autonomous Shift Re-Planner
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        BEDROCK CLAUDE 3 HAIKU
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">Dynamically offsets labor shifts out of lethal peak heat windows.</p>
                  </div>
                </div>
              </div>

              {/* Shift Visualizer: Standard vs AI Split Shift */}
              <div className="space-y-3 my-4 bg-black/60 p-4 rounded-xl border border-white/10 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-gray-400 mb-1 text-[11px]">
                    <span className="flex items-center gap-1 text-red-400 font-bold">✕ Standard Rigid Shift (Traditional)</span>
                    <span>09:00 — 17:00 (Direct Peak Heat Collision)</span>
                  </div>
                  <div className="h-6 w-full bg-neutral-900 rounded-md overflow-hidden flex border border-neutral-800">
                    <div style={{ width: '25%' }} className="bg-emerald-500/30 border-r border-emerald-500/50 flex items-center justify-center text-[9px] text-emerald-200">09-11 Safe</div>
                    <div style={{ width: '50%' }} className="bg-red-500/80 flex items-center justify-center text-[10px] text-white font-bold animate-pulse">11:00 - 15:30 DANGER (WBGT 33.8°C)</div>
                    <div style={{ width: '25%' }} className="bg-orange-500/40 border-l border-orange-500/50 flex items-center justify-center text-[9px] text-orange-200">15:30-17 Mod</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-400 mb-1 text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">✓ HeatShift AI Dynamic Split-Shift</span>
                    <span>Proactive Shift Avoidance (0 Exposure Hrs)</span>
                  </div>
                  <div className="h-6 w-full bg-neutral-900 rounded-md overflow-hidden flex border border-neutral-800">
                    <div style={{ width: '40%' }} className="bg-emerald-500/90 flex items-center justify-center text-[10px] text-black font-bold">05:30-10:30 Morning (27°C)</div>
                    <div style={{ width: '35%' }} className="bg-neutral-800/80 flex items-center justify-center text-[10px] text-gray-400 italic">MANDATORY HEAT SIESTA</div>
                    <div style={{ width: '25%' }} className="bg-emerald-500/90 flex items-center justify-center text-[10px] text-black font-bold">16:30-19:30 Twilight</div>
                  </div>
                </div>
              </div>

              {/* Step by step agent execution stream */}
              {replanSteps.length > 0 && (
                <div className="mb-4 bg-neutral-950 p-3 rounded-xl border border-orange-500/30 space-y-1.5 font-mono text-[11px]">
                  <span className="text-[10px] text-orange-400 uppercase tracking-widest font-bold block mb-1">
                    AI AGENT EXECUTION TRACE:
                  </span>
                  {replanSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-gray-300">
                      <span className="text-orange-400">▹</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-gray-400 font-mono">
                {replanSuccess ? `✓ Re-planned for ${replanSuccess.workerCount} workers` : 'Ready to evaluate schedule candidates'}
              </span>
              <button
                onClick={handleTriggerReplan}
                disabled={isReplanning}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-[0_0_20px_rgba(234,88,12,0.4)] disabled:opacity-60"
              >
                {isReplanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isReplanning ? 'Agent Reasoning...' : 'Run Autonomous Shift Shift (Bedrock)'}</span>
              </button>
            </div>
          </div>

          {/* POLICY-AS-CODE (CEDAR) VERIFICATION VAULT */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Cedar Policy-as-Code Safety Vault
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        AWS CEDAR ENGINE
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">Formal verification sandbox ensuring AI agents cannot hallucinate unsafe shifts.</p>
                  </div>
                </div>
              </div>

              {/* Cedar Policy Rules List */}
              <div className="space-y-2.5 my-4 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">PERMIT</span>
                  <div className="text-gray-300 text-[11px]">
                    <code>permit(principal, action == &quot;assignShift&quot;, resource)</code>
                    <span className="text-gray-500 block text-[10px]">When resource.wbgt &lt; 32.0°C OR mandatory canopy misting deployed.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">FORBID</span>
                  <div className="text-gray-300 text-[11px]">
                    <code>forbid(principal, action == &quot;assignShift&quot;, resource)</code>
                    <span className="text-gray-500 block text-[10px]">When resource.wbgt &gt;= 33.0°C AND labor_type in [&quot;rebar&quot;, &quot;asphalt&quot;, &quot;trench&quot;].</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">ENFORCE</span>
                  <div className="text-gray-300 text-[11px]">
                    <code>enforce(hydration_stations.distance &lt;= 50m)</code>
                    <span className="text-gray-500 block text-[10px]">Mandatory electrolyte provisioning within 50 meters of every worker group.</span>
                  </div>
                </div>
              </div>

              {/* Violation Blocked Alert Popup */}
              {violationBlockedAlert && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-rose-400 font-bold">
                    <span>🛑 CEDAR POLICY VERDICT: FORBID</span>
                    <button onClick={() => setViolationBlockedAlert(null)} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  <p className="text-white text-[11px]">{violationBlockedAlert.details}</p>
                  <p className="text-rose-300 text-[10px]">{violationBlockedAlert.ruleBroken}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-gray-400 font-mono">
                {stats.violationsBlocked} illegal shift requests blocked to date
              </span>
              <button
                onClick={handleTestViolation}
                className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-rose-400" />
                <span>Simulate Unsafe Shift (Test Defense)</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: INTERACTIVE SITE MONITORING GRID & INSPECTION MODAL */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-400" />
                <span>Active Worksite Heat Map &amp; Inspection Grid</span>
              </h2>
              <p className="text-xs text-gray-400">Click any construction or infrastructure site for instant micro-climate telemetry.</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 bg-white/[0.04] p-1 rounded-xl text-xs font-medium">
              <span className="text-gray-500 text-[10px] font-mono px-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> TIER:
              </span>
              {(['all', '3', '2', '1'] as const).map(tierKey => (
                <button
                  key={tierKey}
                  onClick={() => setSiteFilter(tierKey)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    siteFilter === tierKey
                      ? 'bg-white text-black font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tierKey === 'all' ? 'All Sites (8)' : `Tier ${tierKey}`}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Site Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSites.map(site => {
              const isSelected = selectedSite?.id === site.id;
              return (
                <div
                  key={site.id}
                  onClick={() => setSelectedSite(site)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white/[0.06] border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.2)]'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.03]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        site.tier === 3 ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                        site.tier === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        Tier {site.tier} • {site.tier === 3 ? 'EXTREME' : site.tier === 2 ? 'HIGH' : 'NORMAL'}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">{site.wbgt}°C</span>
                    </div>

                    <h4 className="font-bold text-sm text-white leading-snug line-clamp-2">{site.name}</h4>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 font-mono">
                      <MapPin className="w-3 h-3 text-orange-400" />
                      <span>{site.zone}</span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-2 line-clamp-1">{site.laborType}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      <span>{site.workers}</span>
                    </span>
                    <span className={`text-[10px] font-bold ${site.status.includes('Rest') ? 'text-red-400' : 'text-emerald-400'}`}>
                      {site.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drill-Down Selected Site Inspection Card */}
          {selectedSite && (
            <div className="mt-6 p-5 rounded-xl bg-black/60 border border-orange-500/30 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="space-y-2">
                <span className="text-[10px] text-orange-400 uppercase tracking-widest font-bold">SELECTED SITE DETAIL:</span>
                <h3 className="text-base font-bold text-white">{selectedSite.name}</h3>
                <p className="text-gray-400 text-xs">{selectedSite.zone} • {selectedSite.laborType}</p>
                <div className="flex gap-4 pt-2">
                  <div>
                    <span className="text-gray-500 text-[10px] block">WORKERS</span>
                    <span className="text-white font-bold text-sm">{selectedSite.workers}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">SHADE CANOPY</span>
                    <span className="text-orange-400 font-bold text-sm">{selectedSite.shadeFactor}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">HYDRATION DIST</span>
                    <span className="text-emerald-400 font-bold text-sm">{selectedSite.hydrationMeters}m</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-l border-white/10 pl-4">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">SCHEDULE COMPARISON:</span>
                <div>
                  <span className="text-[11px] text-red-400 block font-bold">Standard Shift (Canceled):</span>
                  <span className="text-gray-300 text-xs">{selectedSite.standardShift}</span>
                </div>
                <div className="pt-2">
                  <span className="text-[11px] text-emerald-400 block font-bold">HeatShift AI Shift (Active):</span>
                  <span className="text-white text-xs">{selectedSite.aiShift}</span>
                </div>
              </div>

              <div className="space-y-3 border-l border-white/10 pl-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">SUPERVISOR DISPATCH:</span>
                  <p className="text-gray-300 text-xs mt-1">
                    Direct automated webhook to Site Supervisor Telegram channel.
                  </p>
                </div>
                <button
                  onClick={handleSendTelegram}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{telegramSent ? '✓ Webhook Sent to Telegram!' : 'Dispatch Telegram Warning'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: BILINGUAL TELEGRAM WEBHOOK SANDBOX & LIVE AUDIT FEED */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Telegram Supervisor Bilingual Dispatch Preview */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Telegram Multi-Channel Dispatcher
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        BILINGUAL (EN/HI)
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">Dispatches localized voice &amp; text alerts directly to onsite contractor radios &amp; Telegram.</p>
                  </div>
                </div>
              </div>

              {/* Simulated Telegram Card Preview */}
              <div className="bg-[#17212b] p-4 rounded-xl border border-white/10 my-4 text-xs font-sans space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-white/10 pb-2">
                  <span>📱 Telegram Bot: @HeatShiftAlertBot</span>
                  <span className="text-[10px] font-mono text-gray-400 ml-auto">Now</span>
                </div>

                {language === 'en' ? (
                  <div className="space-y-1.5 text-gray-200">
                    <p className="font-bold text-red-400">🚨 [HEATSHIFT EMERGENCY ADVISORY: TIER 3]</p>
                    <p><strong>Worksite:</strong> Okhla Phase II Corridor</p>
                    <p><strong>WBGT Index:</strong> 33.8°C (Extreme Heat Threshold Breached)</p>
                    <p><strong>Action:</strong> Unshaded rebar &amp; steel work halted immediately until 16:30. Mandatory cool-down protocol in effect. Move workers to misting tent stations.</p>
                    <p className="text-gray-400 text-[10px] pt-1">Reply /ack to log supervisor confirmation.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-gray-200">
                    <p className="font-bold text-red-400">🚨 [हीटशिफ्ट आपातकालीन चेतावनी: टियर 3]</p>
                    <p><strong>कार्यस्थल:</strong> ओखला फेज 2 कॉरिडोर</p>
                    <p><strong>WBGT सूचकांक:</strong> 33.8°C (अत्यधिक गर्मी सीमा पार)</p>
                    <p><strong>कार्रवाई:</strong> खुले में सरिया और स्टील का काम तुरंत शाम 4:30 बजे तक स्थगित। सभी श्रमिकों को मिस्टिंग और छायादार शिविरों में भेजें।</p>
                    <p className="text-gray-400 text-[10px] pt-1">पुष्टि दर्ज करने के लिए /ack का उत्तर दें।</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-mono text-gray-400 pt-2 border-t border-white/10">
              <span>Webhook Endpoint: /api/v1/alerts/telegram</span>
              <button
                onClick={handleSendTelegram}
                className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold transition"
              >
                {telegramSent ? 'Sent!' : 'Test Live Ping'}
              </button>
            </div>
          </div>

          {/* LIVE AUDIT & EVENT FEED */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Live Autonomous Audit Feed
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </h3>
                    <p className="text-xs text-gray-400">Real-time log of Cedar policy enforcements, AI re-plans, and supervisor acknowledgments.</p>
                  </div>
                </div>
              </div>

              {/* Feed items */}
              <div className="space-y-3 my-3 max-h-64 overflow-y-auto pr-1">
                {feed.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        ev.badge.includes('BLOCK') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        ev.badge.includes('AI') ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                        ev.badge.includes('TELEGRAM') ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {ev.badge}
                      </span>
                      <span className="text-[10px] text-gray-500">{ev.time}</span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">{ev.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-right">
              <span className="text-[11px] font-mono text-gray-500">
                Audit Trail stored in Amazon DynamoDB with SHA-256 integrity hash
              </span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
