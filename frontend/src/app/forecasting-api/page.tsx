'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sun, ArrowLeft, Terminal, Send, Copy, Check, Code2, 
  Layers, Shield, Zap, RefreshCw, ExternalLink, Globe, Sparkles 
} from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';

export default function ForecastingApiPage() {
  const [selectedZone, setSelectedZone] = useState('okhla_industrial');
  const [selectedMode, setSelectedMode] = useState('live');
  const [selectedScenario, setSelectedScenario] = useState('extreme');
  const [activeTab, setActiveTab] = useState<'response' | 'curl' | 'python' | 'typescript'>('response');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [latency, setLatency] = useState<number>(42);

  const fetchLiveForecast = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(`/api/forecast?zone=${selectedZone}&mode=${selectedMode}&scenario=${selectedScenario}`);
      const data = await res.json();
      setLatency(Math.round(performance.now() - start));
      setApiResponse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveForecast();
  }, [selectedZone, selectedMode, selectedScenario]);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlSnippet = `curl -X GET "https://api.heatshift.org/v1/forecast?zone=${selectedZone}&mode=${selectedMode}&scenario=${selectedScenario}" \\
  -H "Accept: application/json" \\
  -H "x-api-key: YOUR_AWS_API_GATEWAY_KEY"`;

  const pythonSnippet = `import requests

url = "https://api.heatshift.org/v1/forecast"
params = {
    "zone": "${selectedZone}",
    "mode": "${selectedMode}",
    "scenario": "${selectedScenario}"
}
headers = {"x-api-key": "YOUR_AWS_API_GATEWAY_KEY"}

response = requests.get(url, params=params, headers=headers)
forecast_data = response.json()

print(f"Peak Stull WBGT: {forecast_data['summary']['peak_wbgt_c']}°C")
print(f"OSHA Action: {forecast_data['summary']['recommended_action']}")`;

  const tsSnippet = `import { HeatShiftClient } from '@heatshift/sdk';

const client = new HeatShiftClient({
  apiKey: process.env.HEATSHIFT_API_KEY!,
  region: 'ap-south-1' // AWS Mumbai
});

const forecast = await client.getHourlyForecast({
  zone: '${selectedZone}',
  mode: '${selectedMode}',
  scenario: '${selectedScenario}'
});

console.log(forecast.summary.peak_wbgt_c);
console.log(forecast.summary.safe_windows);`;

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
            <span className="text-xs font-mono text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
              API Reference v1.4.0
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
              href="/cedar-policies"
              className="text-xs font-mono text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 transition flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Cedar Policies</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Title */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs text-orange-300 mb-4 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AWS Serverless REST &amp; WebSocket Endpoints</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
          Hyper-Local Heat Risk &amp; Forecasting API
        </h1>
        <p className="text-gray-400 max-w-3xl text-sm md:text-base leading-relaxed">
          Programmatic access to 24-hour Stull (2011) Wet-Bulb Globe Temperature calculations, 
          demographic heat strain matrices, and deterministic Cedar safety policy validations across Delhi NCR.
        </p>
      </div>

      {/* Main Playground Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20 space-y-8">
        
        {/* Endpoint Bar & Interactive Parameters */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                GET
              </span>
              <span className="text-white font-bold text-sm">/api/forecast</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">Content-Type: application/json</span>
            </div>

            <button
              onClick={fetchLiveForecast}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 text-white font-bold rounded-xl text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(234,88,12,0.4)] disabled:opacity-50 transition"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send Request</span>
            </button>
          </div>

          {/* Request Query Parameters Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 font-mono text-xs">
            <div>
              <label className="text-gray-400 block mb-1 text-[11px] uppercase tracking-wider font-bold">
                Zone ID (Query Param: <code>zone</code>)
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500"
              >
                <option value="okhla_industrial">Okhla Industrial Area (Heavy Labor)</option>
                <option value="dwarka">Dwarka Sector 21 (Metro Construction)</option>
                <option value="rohini">Rohini Metro Extension (High Density)</option>
                <option value="najafgarh">Najafgarh Drainage Project (Peri-Urban)</option>
                <option value="narela">Narela Sub-City Infrastructure</option>
                <option value="connaught_place">Connaught Place Central</option>
                <option value="mundka">Mundka Logistics Warehouse Depot</option>
                <option value="shahdara">Shahdara Industrial Rail Siding</option>
                <option value="mayur_vihar">Mayur Vihar Phase 1 Flyover</option>
                <option value="lajpat_nagar">Lajpat Nagar Central Utility</option>
                <option value="karol_bagh">Karol Bagh Market Utility Corridor</option>
                <option value="saket">Saket District Centre</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 block mb-1 text-[11px] uppercase tracking-wider font-bold">
                Telemetry Mode (Query Param: <code>mode</code>)
              </label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500"
              >
                <option value="live">LIVE (Open-Meteo 1-Day Lead Sync)</option>
                <option value="replay">REPLAY (Copernicus ERA5 May 2024 Heatwave)</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 block mb-1 text-[11px] uppercase tracking-wider font-bold">
                Simulation Scenario (Query Param: <code>scenario</code>)
              </label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500"
              >
                <option value="extreme">🔥 45.4°C Extreme Heatwave</option>
                <option value="moderate">☀️ 39.0°C Summer Dry</option>
                <option value="monsoon">💨 37.2°C Monsoon 88% Humidity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Code & Response Console */}
        <div className="rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl">
          {/* Console Header Tabs */}
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => setActiveTab('response')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'response' ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(234,88,12,0.4)]' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Response Body</span>
              </button>
              <button
                onClick={() => setActiveTab('curl')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'curl' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>cURL</span>
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'python' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Python SDK</span>
              </button>
              <button
                onClick={() => setActiveTab('typescript')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'typescript' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>TypeScript</span>
              </button>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                200 OK ({latency}ms)
              </span>
              <button
                onClick={() => copyCode(
                  activeTab === 'response' ? JSON.stringify(apiResponse, null, 2) :
                  activeTab === 'curl' ? curlSnippet :
                  activeTab === 'python' ? pythonSnippet : tsSnippet
                )}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Console Code View */}
          <div className="p-5 font-mono text-xs overflow-x-auto max-h-[500px]">
            {activeTab === 'response' && (
              <pre className="text-gray-300 leading-relaxed">
                {apiResponse ? JSON.stringify(apiResponse, null, 2) : '// Loading response...'}
              </pre>
            )}
            {activeTab === 'curl' && (
              <pre className="text-orange-300 leading-relaxed">{curlSnippet}</pre>
            )}
            {activeTab === 'python' && (
              <pre className="text-cyan-300 leading-relaxed">{pythonSnippet}</pre>
            )}
            {activeTab === 'typescript' && (
              <pre className="text-emerald-300 leading-relaxed">{tsSnippet}</pre>
            )}
          </div>
        </div>

        {/* API Specification Table */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 font-mono text-xs">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400" />
            Field Schema &amp; Scientific Definitions
          </h3>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10 text-gray-400 text-[11px]">
                <tr>
                  <th className="p-3">Field</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Standard / Formula</th>
                  <th className="p-3">Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                <tr>
                  <td className="p-3 font-bold text-orange-400">wbgt_stull_c</td>
                  <td className="p-3 text-gray-400">float</td>
                  <td className="p-3 text-gray-400">Stull (2011) Wet-Bulb Equation</td>
                  <td className="p-3">True heat stress threshold incorporating evaporative sweat cooling capability.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-red-400">risk_tier</td>
                  <td className="p-3 text-gray-400">integer (0-3)</td>
                  <td className="p-3 text-gray-400">OSHA &amp; NDMA Guidelines</td>
                  <td className="p-3">Tier 0 (Safe), Tier 1 (Moderate), Tier 2 (High), Tier 3 (Extreme Disaster).</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-rose-400">cedar_status</td>
                  <td className="p-3 text-gray-400">string</td>
                  <td className="p-3 text-gray-400">AWS Cedar Engine 3.1</td>
                  <td className="p-3"><code>PERMIT</code> if within work-rest policies, <code>FORBID</code> if violative.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-cyan-400">solar_radiation_wm2</td>
                  <td className="p-3 text-gray-400">integer</td>
                  <td className="p-3 text-gray-400">Shortwave Radiation (W/m²)</td>
                  <td className="p-3">Direct radiant heat load from direct sun exposure at noon.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
