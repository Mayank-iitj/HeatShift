'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sun, ArrowLeft, Building2, Send, CheckCircle2, 
  Users, Calculator, ShieldCheck, Headphones, Sparkles, Server 
} from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';

export default function ContactSalesPage() {
  const [workersCount, setWorkersCount] = useState<number>(2500);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    org: '',
    sector: 'infrastructure',
    region: 'delhi_ncr',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  // ROI Projections
  const avoidedExposureHours = Math.round(workersCount * 4.2 * 30); // ~30 extreme days
  const projectedIncidentsPrevented = Math.round(workersCount * 0.08);
  const medicalSavingsLakhs = (projectedIncidentsPrevented * 0.45).toFixed(1);

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
              Enterprise &amp; Municipal Pilots
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
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs text-orange-300 mb-4 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Municipal &amp; Enterprise Pilot Deployment</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
          Deploy HeatShift for Your Outdoor Workforce
        </h1>
        <p className="text-gray-400 max-w-3xl text-sm md:text-base leading-relaxed">
          Partner with HeatShift to safeguard construction crews, sanitation teams, and gig logistics personnel 
          with hyper-local predictive shift scheduling, Cedar policy compliance, and automated multi-channel emergency dispatches.
        </p>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20 space-y-12">
        
        {/* Interactive Workforce ROI Calculator */}
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">Workforce Impact &amp; Heat Risk ROI Calculator</h2>
            </div>
            <span className="text-xs font-mono text-gray-400">Delhi NCR Baseline Model</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-400">OUTDOOR WORKERS MONITORED:</span>
                <span className="text-2xl font-black text-orange-400">{workersCount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={workersCount}
                onChange={(e) => setWorkersCount(parseInt(e.target.value))}
                className="w-full accent-orange-500"
              />
              <p className="text-[11px] text-gray-500 pt-1">
                Drag slider to calculate projected avoided exposure hours and medical risk mitigation during peak summer.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase font-bold">AVOIDED HEAT EXPOSURE</span>
                <div className="text-2xl font-black text-white">{avoidedExposureHours.toLocaleString()} hrs</div>
                <p className="text-[10px] text-gray-400">Shifted to twilight &amp; dawn</p>
              </div>

              <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
                <span className="text-[10px] text-red-400 uppercase font-bold">HEAT STRESS PREVENTIONS</span>
                <div className="text-2xl font-black text-white">{projectedIncidentsPrevented} incidents</div>
                <p className="text-[10px] text-gray-400">Severe heat exhaustion cases avoided</p>
              </div>

              <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
                <span className="text-[10px] text-purple-400 uppercase font-bold">EST. HEALTHCARE SAVINGS</span>
                <div className="text-2xl font-black text-white">₹{medicalSavingsLakhs} Lakhs</div>
                <p className="text-[10px] text-gray-400">Direct hospitalizations mitigated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form & Enterprise Tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Pilot Request Form */}
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10">
            {submitted ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">Pilot Request Received</h3>
                <p className="text-gray-300 text-sm max-w-md mx-auto">
                  Thank you, <strong>{formData.name || 'Partner'}</strong>. Our climate risk engineering team will contact <strong>{formData.email || 'your email'}</strong> within 4 business hours with custom telemetry coordinates and Cedar policy integration templates.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition mt-4"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <h3 className="text-lg font-bold text-white mb-2">Request an Enterprise Pilot Sandbox</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 block mb-1 text-[11px] uppercase">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Singh"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1 text-[11px] uppercase">Official Email</label>
                    <input
                      type="email"
                      required
                      placeholder="vikram@mcd.gov.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 block mb-1 text-[11px] uppercase">Organization / Authority</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Delhi Metro Rail Corp"
                      value={formData.org}
                      onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                      className="w-full bg-black border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1 text-[11px] uppercase">Industry Sector</label>
                    <select
                      value={formData.sector}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      className="w-full bg-black border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="infrastructure">Metro &amp; Highway Infrastructure</option>
                      <option value="municipal">Municipal Sanitation &amp; Waste Management</option>
                      <option value="logistics">Quick Commerce &amp; Gig Delivery</option>
                      <option value="construction">Commercial High-Rise Construction</option>
                      <option value="energy">Power Grid &amp; Telecom Field Crews</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 text-[11px] uppercase">Deployment Requirements &amp; Scope</label>
                  <textarea
                    rows={3}
                    placeholder="Describe worksite locations, current shift timings, and worker health monitoring goals..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-black border border-white/15 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,88,12,0.4)] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting Request...' : 'Submit Enterprise Pilot Request'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Deployment Models */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-2 font-mono">Deployment Options</h3>
            
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold font-mono text-xs">
                <Server className="w-4 h-4" />
                <span>Option 1: Multi-Tenant Cloud SaaS</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                Instant turnkey provisioning. Access full 12-zone Delhi live telemetry, bilingual Telegram supervisor webhooks, and REST APIs. Zero infrastructure maintenance.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Option 2: Dedicated AWS VPC / SAM Stack</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                Deployed directly inside your enterprise AWS account using our SAM template (`template.yaml`). Dedicated DynamoDB tables, custom Bedrock foundation models, and sovereign Cedar safety rules.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold font-mono text-xs">
                <Headphones className="w-4 h-4" />
                <span>Option 3: Municipal Disaster Command Center</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                Built specifically for NDMA, State Disaster Management Authorities (SDMA), and city municipalities. Direct integration with emergency SMS alerts and mobile misting water tankers.
              </p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
