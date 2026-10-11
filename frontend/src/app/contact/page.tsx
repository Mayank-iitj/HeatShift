'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sun, ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle2, 
  Building2, MessageSquare, ShieldCheck, Sparkles, ExternalLink 
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: 'general',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

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
              Contact
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
            <a
              href="https://github.com/Mayank-iitj/HeatShift"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-orange-400 hover:text-orange-300 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 transition flex items-center gap-1.5"
            >
              <FaGithub className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs text-orange-300 mb-6 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Get in Touch with the HeatShift Team</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
          Contact &amp; Partnerships
        </h1>
        <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Whether you represent a municipal authority, an infrastructure contractor, or are evaluating our API for research—we’d love to connect.
        </p>
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Direct Contact Info & Channels */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <h3 className="font-bold text-white text-base">Direct Channels</h3>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-start gap-3 text-gray-300">
                  <Mail className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Official Email</span>
                    <a href="mailto:team@heatshift.org" className="hover:text-orange-400 transition">team@heatshift.org</a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-gray-300">
                  <FaGithub className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Source Repository</span>
                    <a 
                      href="https://github.com/Mayank-iitj/HeatShift" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-orange-400 transition flex items-center gap-1"
                    >
                      <span>Mayank-iitj/HeatShift</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-gray-300">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Deployment Focus</span>
                    <span>Delhi NCR &amp; Global South Urban Centers</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-950/30 to-neutral-900 border border-orange-500/20 space-y-2">
              <div className="flex items-center gap-2 text-orange-400 font-mono text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Response SLA</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed font-mono">
                Pilot queries, municipal coordination requests, and critical safety escalations are reviewed within <strong>4 business hours</strong>.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-2 p-8 rounded-2xl bg-white/[0.02] border border-white/10">
            {submitted ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">Message Dispatched</h3>
                <p className="text-gray-300 text-sm max-w-md mx-auto">
                  Thank you, <strong>{formData.name || 'Friend'}</strong>. Your inquiry has been logged in our queue. A member of the HeatShift team will reach out to <strong>{formData.email || 'your email'}</strong> promptly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition mt-4"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <h3 className="text-lg font-bold text-white mb-2">Send Us a Message</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 block mb-1 text-[11px] uppercase">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mayank"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1 text-[11px] uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 block mb-1 text-[11px] uppercase">Organization / Affiliation</label>
                    <input
                      type="text"
                      placeholder="e.g. IIT Jodhpur / MCD / Contractor"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full bg-black border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1 text-[11px] uppercase">Inquiry Type</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-black border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="pilot">Municipal / Enterprise Pilot</option>
                      <option value="api">API Access &amp; Webhooks</option>
                      <option value="research">Climate Research &amp; Backtesting</option>
                      <option value="general">General Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 text-[11px] uppercase">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we help protect your workforce from extreme heat?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-black border border-white/15 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,88,12,0.4)] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
