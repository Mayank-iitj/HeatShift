"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Sun, Shield, Activity, Users } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HorizontalTicker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !textRef.current) return;

    const getScrollAmount = () => {
      const containerWidth = textRef.current?.scrollWidth || 0;
      return -(containerWidth - window.innerWidth);
    };

    const tween = gsap.to(textRef.current, {
      x: getScrollAmount,
      ease: "none"
    });

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: () => `+=${getScrollAmount() * -1}`,
      pin: true,
      animation: tween,
      scrub: 1,
      invalidateOnRefresh: true
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="h-screen w-full overflow-hidden bg-[#0a0a0a] flex items-center relative border-y border-white/5">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vh] bg-orange-600/10 rounded-[100%] blur-[120px] pointer-events-none" />

      {/* The scrolling text track */}
      <div ref={textRef} className="flex items-center flex-nowrap whitespace-nowrap pl-[10vw] pr-[50vw]">
        
        {/* Sentence part 1 */}
        <span className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter mix-blend-difference">
          In every shift,
        </span>
        
        {/* Inline Icon */}
        <div className="mx-6 md:mx-12 shrink-0 flex items-center justify-center h-20 w-20 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-orange-400 to-red-600 shadow-[0_0_50px_rgba(249,115,22,0.4)]">
          <Sun className="text-white w-10 h-10 md:w-16 md:h-16" />
        </div>

        {/* Sentence part 2 */}
        <span className="text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-200 tracking-tighter">
          discover the undeniable
        </span>

        {/* Inline Icon */}
        <div className="mx-6 md:mx-12 shrink-0 text-orange-500">
          <Shield className="w-16 h-16 md:w-24 md:h-24 stroke-[1.5]" />
        </div>

        {/* Sentence part 3 */}
        <span className="text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-rose-600 tracking-tighter">
          Safety
        </span>

        {/* Inline SVG Curve */}
        <div className="mx-6 md:mx-12 shrink-0 flex items-center">
          <svg width="200" height="80" viewBox="0 0 200 80" className="w-32 md:w-48 text-red-500/50 fill-none stroke-current stroke-[4] stroke-linecap-round stroke-linejoin-round">
            <path d="M 0 40 Q 50 0, 100 40 T 200 40" />
          </svg>
        </div>

        {/* Sentence part 4 */}
        <span className="text-6xl md:text-8xl lg:text-9xl font-black text-gray-300 tracking-tighter">
          of intelligent Planning
        </span>

        {/* Inline Icon */}
        <div className="mx-6 md:mx-12 shrink-0 text-rose-500">
          <Activity className="w-16 h-16 md:w-24 md:h-24 stroke-[1.5]" />
        </div>

        {/* Sentence part 5 */}
        <span className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter">
          that protects our Workforce
        </span>

        {/* Inline Icon */}
        <div className="mx-6 md:mx-12 shrink-0 flex items-center justify-center h-20 w-20 md:h-32 md:w-32 rounded-3xl border-2 border-white/20 bg-white/5 backdrop-blur-md">
          <Users className="text-white/80 w-10 h-10 md:w-16 md:h-16" />
        </div>

        {/* Sentence part 6 */}
        <span className="text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 tracking-tighter">
          from extreme Heat.
        </span>

      </div>
    </div>
  );
}
