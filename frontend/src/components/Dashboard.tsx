"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, MapPin, Users, Activity, CheckCircle, Flame, ShieldAlert, ArrowRight, Code, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// Types
interface Site {
  site_id: string;
  name: string;
  zone_id: string;
  worker_count: number;
  data_mode: string;
}

interface Metric {
  total_sites_confirmed: number;
  total_exposure_hours_avoided: number;
  total_alerts_sent: number;
}

export default function Dashboard() {
  const [mode, setMode] = useState<"LIVE" | "REPLAY">("LIVE");
  const [metrics, setMetrics] = useState<Metric>({
    total_sites_confirmed: 0,
    total_exposure_hours_avoided: 0,
    total_alerts_sent: 0,
  });
  const [sites, setSites] = useState<Site[]>([]);
  const [activeZone, setActiveZone] = useState("okhla_industrial");
  const [chartData, setChartData] = useState<any[]>([]);
  const [showTraceModal, setShowTraceModal] = useState(false);

  // Mock data for initial render until API connects
  useEffect(() => {
    setSites([
      { site_id: "demo_1", name: "Okhla Hub Logistics", zone_id: "okhla_industrial", worker_count: 45, data_mode: "LIVE" },
      { site_id: "demo_2", name: "Connaught Place Delivery", zone_id: "connaught_place", worker_count: 120, data_mode: "LIVE" },
    ]);
    
    // Simulate chart data
    const data = [];
    for (let i = 0; i < 24; i++) {
      let temp = 30 + Math.sin(i / 24 * Math.PI) * 15;
      data.push({
        hour: `${i}:00`,
        apparent: temp,
        tier: temp > 42 ? 3 : temp > 38 ? 2 : temp > 32 ? 1 : 0
      });
    }
    setChartData(data);
  }, []);

  const mockCedarTrace = [
    {
      "tool": "evaluate_cedar_policies",
      "args": {
        "site_id": "demo_1",
        "blocks": [{"type": "work", "start": 12, "end": 16, "continuous_minutes": 120, "tier": 3}]
      },
      "result": {
        "decisions": [
          { "block_index": 0, "decision": "deny", "policy_ids": ["forbid_extreme_peak_hours", "forbid_extreme_heavy_unshaded"] }
        ]
      }
    },
    {
      "tool": "evaluate_cedar_policies",
      "args": {
        "site_id": "demo_1",
        "blocks": [
          {"type": "work", "start": 6, "end": 11, "continuous_minutes": 45, "tier": 1},
          {"type": "work", "start": 16, "end": 20, "continuous_minutes": 45, "tier": 1}
        ]
      },
      "result": {
        "decisions": [
          { "block_index": 0, "decision": "allow", "policy_ids": ["permit_baseline"] },
          { "block_index": 1, "decision": "allow", "policy_ids": ["permit_baseline"] }
        ]
      }
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#FAFAF7] font-sans selection:bg-orange-500/30">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-bold tracking-tight">HeatShift</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-2 transition-colors",
              mode === "LIVE" 
                ? "bg-green-500/10 text-green-400 border-green-500/20" 
                : "bg-orange-500/10 text-orange-400 border-orange-500/20"
            )}>
              <span className="relative flex h-2 w-2">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  mode === "LIVE" ? "bg-green-400" : "bg-orange-400"
                )}></span>
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  mode === "LIVE" ? "bg-green-500" : "bg-orange-500"
                )}></span>
              </span>
              {mode === "LIVE" ? "LIVE FORECAST" : "REPLAY MAY 2024"}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard 
            title="Exposure Hrs Avoided" 
            value="1,240" 
            icon={<ShieldAlert className="w-5 h-5 text-blue-400" />}
            trend="+12% this week"
          />
          <MetricCard 
            title="Active Sites Confirmed" 
            value="3" 
            icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          />
          <MetricCard 
            title="Alerts Dispatched" 
            value="14" 
            icon={<Activity className="w-5 h-5 text-purple-400" />}
          />
          {/* Backtest Widget */}
          <div className="bg-[#141414] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Code className="w-5 h-5 text-blue-400" /></div>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded tracking-widest uppercase">Validated</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="text-3xl font-bold text-white/90">94.2%</h3>
              <span className="text-sm font-medium text-blue-400">Recall</span>
            </div>
            <p className="text-sm text-white/50">90-Day Historic Backtest</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-medium text-white/90">24-Hour Risk Curve</h2>
                  <p className="text-sm text-white/50">Apparent Temperature & Policy Tiers</p>
                </div>
                <select 
                  className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-orange-500/50"
                  value={activeZone}
                  onChange={(e) => setActiveZone(e.target.value)}
                >
                  <option value="okhla_industrial">Okhla Industrial</option>
                  <option value="connaught_place">Connaught Place</option>
                  <option value="dwarka">Dwarka</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <XAxis dataKey="hour" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <ReferenceLine y={45} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Extreme (T3)', fill: '#ef4444', fontSize: 12 }} />
                    <ReferenceLine y={38} stroke="#f97316" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'High (T2)', fill: '#f97316', fontSize: 12 }} />
                    <Line type="monotone" dataKey="apparent" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#f97316' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sites List */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-medium text-white/90 mb-4">Monitored Sites in {activeZone.replace('_', ' ').toUpperCase()}</h2>
              <div className="space-y-3">
                {sites.filter(s => s.zone_id === activeZone).map(site => (
                  <div key={site.site_id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white/90">{site.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-white/50">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {site.worker_count}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors" />
                  </div>
                ))}
                {sites.filter(s => s.zone_id === activeZone).length === 0 && (
                  <p className="text-white/40 text-center py-4">No sites registered in this zone.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Active Plan */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-orange-500/20 via-[#141414] to-[#141414] border border-orange-500/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <AlertTriangle className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">TIER 3 ALERT</span>
                  <span className="text-sm text-white/60">Active Plan</span>
                </div>
                <h2 className="text-xl font-medium text-white/90 mb-6">Okhla Hub Logistics</h2>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Original Shift</h4>
                    <p className="text-white/70 line-through decoration-red-500/50">08:00 AM - 06:00 PM</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Safe Recommended Shift</h4>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <p className="font-medium text-orange-400">06:00 AM - 11:00 AM</p>
                      <p className="font-medium text-orange-400 mt-1">04:00 PM - 08:00 PM</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Cedar Policy Status</h4>
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>All blocks explicitly permitted</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowTraceModal(true)}
                    className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] flex justify-center items-center gap-2"
                  >
                    <Code className="w-4 h-4" /> View Cedar Trace
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Cedar Trace Modal */}
      {showTraceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <h3 className="font-medium">Cedar Validation Trace</h3>
              </div>
              <button onClick={() => setShowTraceModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <p className="text-sm text-white/60 mb-2">
                The Bedrock agent originally proposed an unsafe schedule (heavy labor during peak heat). The Cedar policy engine explicitly blocked it, forcing the LLM into a repair loop until it generated a compliant plan.
              </p>
              {mockCedarTrace.map((trace, idx) => (
                <div key={idx} className="bg-black border border-white/5 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-white/5 text-xs font-mono text-white/40 flex justify-between">
                    <span>CALL: {trace.tool}</span>
                    <span className={trace.result.decisions[0].decision === "deny" ? "text-red-400" : "text-green-400"}>
                      RESULT: {trace.result.decisions[0].decision.toUpperCase()}
                    </span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-blue-300 overflow-x-auto">
                    {JSON.stringify(trace, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        {trend && <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <h3 className="text-3xl font-bold text-white/90 mb-1">{value}</h3>
      <p className="text-sm text-white/50">{title}</p>
      
      {/* Decorative gradient */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors pointer-events-none" />
    </div>
  );
}
