import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#110e1a] text-[#fdf8e1] px-6 pt-16 pb-6 flex flex-col justify-between overflow-hidden relative">
      
      {/* Top Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-start mb-16 max-w-[100vw]">
        
        {/* Left side: Navigation and Copy */}
        <div className="flex flex-col gap-12">
          <nav className="flex gap-8 text-sm font-bold uppercase tracking-wider">
            <Link href="#" className="hover:opacity-70 transition-opacity">About us</Link>
            <Link href="#" className="hover:opacity-70 transition-opacity">Contact</Link>
          </nav>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-xl md:text-2xl font-bold">Safety, one shift away.</h3>
            <p className="text-sm opacity-80 max-w-md">
              © HeatShift. Building AI-driven heat risk management for vulnerable labor forces.
            </p>
          </div>
        </div>

        {/* Right side: Socials */}
        <div className="mt-12 md:mt-0">
          <Link href="#" className="text-sm font-bold uppercase tracking-wider hover:opacity-70 transition-opacity">
            GITHUB
          </Link>
        </div>
      </div>

      {/* Geometric Shapes Row */}
      <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-0 px-2 w-full">
        {/* Circle */}
        <div className="w-[8vw] h-[8vw] md:w-[6vw] md:h-[6vw] rounded-full bg-[#fdf8e1] shrink-0"></div>
        {/* Hexagon (using clip-path) */}
        <div className="w-[8vw] h-[8vw] md:w-[6vw] md:h-[6vw] bg-[#fdf8e1] shrink-0" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
        {/* Hexagon */}
        <div className="w-[8vw] h-[8vw] md:w-[6vw] md:h-[6vw] bg-[#fdf8e1] shrink-0" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
        {/* Square */}
        <div className="w-[8vw] h-[8vw] md:w-[6vw] md:h-[6vw] bg-[#fdf8e1] shrink-0"></div>
        {/* Long Rectangle */}
        <div className="h-[8vw] md:h-[6vw] bg-[#fdf8e1] flex-grow"></div>
      </div>

      {/* Giant Typography */}
      <div className="w-full flex justify-between items-end leading-[0.75] font-black tracking-tighter text-[#fdf8e1]">
        <h1 className="text-[20vw] md:text-[23vw] m-0 p-0 transform translate-y-[8%]">
          heatshift
        </h1>
      </div>
      
    </footer>
  );
}
