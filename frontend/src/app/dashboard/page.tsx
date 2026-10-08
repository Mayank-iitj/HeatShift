'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Shield, Users, ArrowLeft, Thermometer, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';

interface Site {
  id: string;
  name: string;
  zone: string;
  tier: number;
  status: string;
}

interface FeedEvent {
  time: string;
  type: string;
  message: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeShifts: 0,
    elevatedRisk: 0,
    violationsBlocked: 0,
    exposureAvoided: 0
  });

  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        
        setStats(data.stats);
        setSites(data.sites);
        setFeed(data.feed);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30 relative font-sans">
      <CustomCursor />
      <NoiseOverlay />

      {/* Top Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(234,88,12,0.5)]">
              <Thermometer className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-wider">HeatShift Console</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Live
          </div>
          <div className="text-gray-400">Admin</div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <Users className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-semibold uppercase tracking-wider">Active Workers</span>
            </div>
            <div className="text-4xl font-black text-white">
              {loading ? '...' : stats.activeShifts.toLocaleString()}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-semibold uppercase tracking-wider">Elevated Risk Zones</span>
            </div>
            <div className="text-4xl font-black text-red-400">
              {loading ? '...' : stats.elevatedRisk}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <Shield className="w-5 h-5 text-rose-400" />
              <span className="text-sm font-semibold uppercase tracking-wider">Violations Blocked</span>
            </div>
            <div className="text-4xl font-black text-white">
              {loading ? '...' : stats.violationsBlocked}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-semibold uppercase tracking-wider">Exposure Hrs Avoided</span>
            </div>
            <div className="text-4xl font-black text-green-400">
              {loading ? '...' : stats.exposureAvoided.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Sites List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" /> 
              Active Sites
            </h2>
            
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-5">Site Name</div>
                <div className="col-span-3">Zone</div>
                <div className="col-span-2 text-center">Risk Tier</div>
                <div className="col-span-2">Status</div>
              </div>
              
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading sites...</div>
              ) : (
                sites.map(site => (
                  <div key={site.id} className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/[0.04] transition-colors items-center">
                    <div className="col-span-5 font-medium">{site.name}</div>
                    <div className="col-span-3 text-sm text-gray-400">{site.zone}</div>
                    <div className="col-span-2 flex justify-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        site.tier === 3 ? 'bg-red-500/20 text-red-500' :
                        site.tier === 2 ? 'bg-orange-500/20 text-orange-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {site.tier}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        site.status.includes('Rest') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {site.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" /> 
              Live Event Feed
            </h2>
            
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
              {loading ? (
                <div className="text-center text-gray-500 py-4">Loading feed...</div>
              ) : (
                feed.map((event, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== feed.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-[-16px] w-[2px] bg-white/5" />
                    )}
                    <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      event.type === 'alert' ? 'bg-red-500/20 text-red-500' :
                      event.type === 'plan' ? 'bg-orange-500/20 text-orange-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {event.type === 'alert' ? <AlertTriangle className="w-3 h-3" /> :
                       event.type === 'plan' ? <Activity className="w-3 h-3" /> :
                       <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-mono mb-1">{event.time}</div>
                      <div className="text-sm text-gray-300 leading-snug">{event.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
