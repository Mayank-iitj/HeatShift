"use client";
import Link from "next/link";
import { ArrowRight, Sun, Shield, Activity, Users } from "lucide-react";
import { motion } from "motion/react";
import HorizontalTicker from "@/components/HorizontalTicker";
import CurvedLoop from "@/components/CurvedLoop";
import Footer from "@/components/Footer";
import ScrollVelocity from "@/components/ScrollVelocity";
import LogoLoop from "@/components/LogoLoop";
import Magnetic from "@/components/Magnetic";
import CustomCursor from "@/components/CustomCursor";
import NoiseOverlay from "@/components/NoiseOverlay";
import Plasma from "@/components/Plasma";
import CardNav from "@/components/CardNav";
import { SiReact, SiNextdotjs, SiTailwindcss, SiPython } from 'react-icons/si';
import { FaAws } from 'react-icons/fa';

const navItems = [
  {
    label: "Platform",
    bgColor: "#ea580c",
    textColor: "#fff",
    links: [
      { label: "Dashboard", ariaLabel: "Live Dashboard", href: "/dashboard" },
      { label: "Forecasting API", ariaLabel: "API Docs", href: "#" }
    ]
  },
  {
    label: "Resources", 
    bgColor: "#e11d48",
    textColor: "#fff",
    links: [
      { label: "Cedar Policies", ariaLabel: "Policies", href: "#" },
      { label: "Documentation", ariaLabel: "Docs", href: "#" }
    ]
  },
  {
    label: "Company",
    bgColor: "#be123c", 
    textColor: "#fff",
    links: [
      { label: "Contact Sales", ariaLabel: "Contact", href: "#" },
      { label: "About Us", ariaLabel: "About", href: "#" }
    ]
  }
];

const techLogos = [
  { node: <FaAws className="text-[#FF9900]" />, title: "AWS" },
  { node: <SiNextdotjs className="text-white" />, title: "Next.js" },
  { node: <SiReact className="text-[#61DAFB]" />, title: "React" },
  { node: <SiTailwindcss className="text-[#06B6D4]" />, title: "Tailwind CSS" },
  { node: <SiPython className="text-[#3776AB]" />, title: "Python" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30 relative">
      <CustomCursor />
      <NoiseOverlay />
      
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[150px]" />
      </div>

      <CardNav
        logoNode={
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.5)]">
              <Sun className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">HeatShift</span>
          </div>
        }
        items={navItems}
        baseColor="rgba(255,255,255,0.03)"
        menuColor="#fff"
        buttonBgColor="#ea580c"
        buttonTextColor="#fff"
      />

      {/* Hero Section */}
      <div className="relative w-full min-h-[80vh] flex flex-col justify-center overflow-hidden">
        {/* Plasma Background */}
        <div className="absolute inset-0 z-0">
          <Plasma 
            color="#ea580c"
            speed={0.6}
            direction="forward"
            scale={1.2}
            opacity={0.3}
            mouseInteractive={true}
          />
        </div>

        <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-32 pb-24 text-center max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-300 mb-8 backdrop-blur-sm animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Live Heat Risk Monitoring Active
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Protect your workforce from <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-rose-600">
              extreme heat waves.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            HeatShift is an AI-driven, hyper-local heat risk management platform. We dynamically shift work hours away from deadly heat peaks using real-time meteorological data and Cedar Policy enforcement.
          </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Magnetic>
            <Link href="/dashboard" className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-8 py-4 text-base font-semibold text-white transition-all hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] hover:scale-105">
              View Live Dashboard
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Magnetic>
          <Magnetic>
            <a href="#features" className="group flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20">
              How it works
            </a>
          </Magnetic>
        </div>

        {/* Floating Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.5, type: 'spring' }}
          className="relative w-full max-w-4xl mx-auto mt-20 rounded-2xl border border-white/10 bg-[#111]/80 backdrop-blur-xl shadow-[0_0_80px_rgba(249,115,22,0.15)] overflow-hidden aspect-[16/9] group hidden md:block"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/10 pointer-events-none" />
          <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <div className="ml-4 text-xs text-white/30 font-medium font-mono">heatshift-console // live</div>
          </div>
          <div className="p-6 grid grid-cols-3 gap-6 h-full text-left">
            <div className="col-span-2 space-y-6">
              <div className="flex gap-4">
                <div className="h-24 w-1/3 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-center">
                   <div className="text-white/40 text-xs uppercase font-bold mb-1">Active Shifts</div>
                   <div className="text-2xl font-black text-white">4,291</div>
                </div>
                <div className="h-24 w-1/3 rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 flex flex-col justify-center">
                   <div className="text-orange-400 text-xs uppercase font-bold mb-1">Current Risk</div>
                   <div className="text-2xl font-black text-orange-400">ELEVATED</div>
                </div>
                <div className="h-24 w-1/3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex flex-col justify-center">
                   <div className="text-red-400 text-xs uppercase font-bold mb-1">Violations Blocked</div>
                   <div className="text-2xl font-black text-red-400">142</div>
                </div>
              </div>
              <div className="h-48 rounded-xl bg-gradient-to-t from-orange-500/20 to-transparent border border-white/5 relative overflow-hidden">
                <svg className="absolute bottom-0 w-full h-full text-orange-500/30" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0,100 C20,80 40,120 60,60 C80,0 100,40 100,40 L100,100 Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-[200px] rounded-xl bg-white/5 border border-white/5 relative overflow-hidden flex flex-col justify-end p-4">
                <div className="text-white/40 text-sm mb-2 font-bold uppercase">Wet-Bulb Temp Tracker</div>
                <div className="w-full h-2 rounded-full bg-white/10 mb-2"><div className="w-[80%] h-full rounded-full bg-red-500" /></div>
                <div className="w-full h-2 rounded-full bg-white/10"><div className="w-[40%] h-full rounded-full bg-orange-500" /></div>
              </div>
              <div className="h-20 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-white/10 flex items-center px-4 gap-4">
                <Shield className="text-red-400 w-8 h-8" />
                <div className="text-sm font-bold text-white/80">Cedar Policy Enforced</div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      </div>

      {/* Horizontal GSAP Ticker */}
      <HorizontalTicker />

      {/* Scroll Velocity Banner */}
      <div className="py-8 bg-orange-600/10 border-y border-orange-500/20">
        <ScrollVelocity 
          texts={['AI-Driven Planning • Protect Your Workforce •', 'Dynamic Heat Risk Management • Live Alerts •']} 
          velocity={80} 
          className="text-orange-500/80 font-black uppercase tracking-widest"
        />
      </div>

      {/* Features Grid */}
      <section id="features" className="relative z-10 px-6 py-24 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid md:grid-cols-3 gap-6">
          
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 mb-6 border border-orange-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 relative z-10">Hyper-Local Forecasting</h3>
            <p className="text-gray-400 leading-relaxed relative z-10">
              Ingests hourly forecast and reanalysis data for distinct zones. We compute the Stull Wet-Bulb Approximation to determine precise risk tiers.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 mb-6 border border-red-500/20">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 relative z-10">Policy-as-Code Safety</h3>
            <p className="text-gray-400 leading-relaxed relative z-10">
              Strictly enforces work safety via AWS Cedar Policies, ensuring the AI planning agent can never hallucinate an unsafe shift assignment.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 mb-6 border border-rose-500/20">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 relative z-10">Automated Alerts</h3>
            <p className="text-gray-400 leading-relaxed relative z-10">
              Automatically notifies managers with bilingual instructions via Telegram and tracks confirmed exposure hours avoided in real-time.
            </p>
          </motion.div>

        </div>
      </section>

      {/* Interactive Curved Loop */}
      <div className="border-t border-white/5 py-12">
        <CurvedLoop 
          marqueeText="Stay Cool ✦ Stay Safe ✦ With HeatShift ✦" 
          speed={3}
          curveAmount={500}
          direction="right"
          className="fill-orange-500"
        />
      </div>

      {/* Tech Stack Logo Loop */}
      <div className="border-t border-white/5 pt-16 pb-12 overflow-hidden bg-[#0a0a0a]">
        <div className="text-center mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Powered by Modern Tech</p>
        </div>
        <LogoLoop
          logos={techLogos}
          speed={100}
          direction="left"
          logoHeight={56}
          gap={80}
          hoverSpeed={20}
          scaleOnHover
          fadeOut
          fadeOutColor="#0a0a0a"
          ariaLabel="Technology stack"
        />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
