"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ConstellationBackground from "@/components/ConstellationBackground";

export default function HomePage() {
  const router = useRouter();
  const [time, setTime] = useState(new Date());

  // ✅ ระบบนับเวลา Real-time
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format เวลาและวันที่
  const timeString = time.toLocaleTimeString('en-US', { hour12: false });
  const dateString = time.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <ConstellationBackground 
      count={150} 
      nodeColor="rgba(34, 211, 238, 1)" 
      lineColor="rgba(34, 211, 238, 0.2)"
      connectionDistance={140}
    >
      {/* --- ตัวช่วยสร้าง Layer มืดเพื่อให้ตัวหนังสือเด่น --- */}
      <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500 text-white overflow-hidden bg-black/40 relative">
        
        {/* --- 🛰️ TOP HUD (Clock & Status) --- */}
        <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
          <div className="pointer-events-auto group">
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <div className="text-3xl animate-bounce">🦈</div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-black tracking-tighter uppercase leading-none">CrocByte</span>
                <span className="text-[8px] text-cyan-400 tracking-[0.4em] font-bold">OS VERSION 2.1.0 (shark) </span>
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex flex-col items-end gap-1 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="text-2xl font-mono font-bold text-cyan-400 tracking-tighter">
              {timeString}
            </div>
            <div className="text-[10px] font-bold text-white/60 tracking-widest uppercase">
              {dayName} | {dateString}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
              <span className="text-[8px] text-green-500 font-black tracking-widest uppercase">System Online</span>
            </div>
          </div>
        </div>

        {/* --- 🌌 CENTRAL COMMAND --- */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">
          {/* แสง Glow ตรงกลาง */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="space-y-8 animate-in fade-in zoom-in duration-1000">
            <div className="relative inline-block">
              <h2 className="text-[10px] md:text-xs uppercase tracking-[1.5em] text-cyan-400 font-black mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                Welcome To My Website
              </h2>
            </div>
            
            <h1 className="text-7xl md:text-[10rem] font-serif font-black text-white leading-[0.85] drop-shadow-[0_20px_50px_rgba(0,0,0,1)]">
              CROCB<span className="text-cyan-400 relative">Y<span className="absolute -top-10 -right-5 text-[10px] font-mono text-cyan-500/40 rotate-12 tracking-widest">REGISTERED</span></span>TE
            </h1>

            <div className="flex items-center justify-center gap-4 py-4">
               <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-cyan-500" />
               <p className="max-w-xl text-cyan-100/40 leading-relaxed text-[10px] md:text-sm font-medium tracking-[0.2em] uppercase px-4">
                 Advanced Backend & Frontend Architect by นีโม่
               </p>
               <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-cyan-500" />
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-center pt-6 relative z-50">
              <button 
                onClick={() => router.push("/login")}
                className="group relative px-16 py-5 rounded-full bg-white text-black font-black hover:bg-cyan-500 hover:text-white transition-all duration-500 shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:shadow-cyan-500/50 uppercase tracking-[0.3em] text-xs overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">Initiate Access <span className="text-lg">→</span></span>
              </button>
            </div>
          </div>
        </main>

        {/* --- ⚓ FOOTER --- */}
        <footer className="p-8 relative z-20 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full border-t border-white/5 bg-black/60 backdrop-blur-xl rounded-t-[3rem]">
          <div className="flex flex-col gap-1">
            <div className="text-[9px] text-gray-500 uppercase tracking-[0.4em] font-medium">
              &copy; 2026 CrocByte System | Crocodile Studio
            </div>
            <div className="text-[8px] text-cyan-500/50 font-mono tracking-widest uppercase">
              Encrypted Connection : AES-256
            </div>
          </div>
          
          <div className="flex items-center gap-12 mt-6 md:mt-0">
             <div className="flex flex-col items-end">
               <span className="text-[8px] text-cyan-500/50 uppercase tracking-widest font-black">Authorized Personnel</span>
               <span className="text-xs text-cyan-400 font-mono font-bold tracking-tighter">Sarawut Phusee</span>
             </div>
             <div className="flex flex-col items-end border-l border-white/10 pl-12">
               <span className="text-[8px] text-cyan-500/50 uppercase tracking-widest font-black">Server Node</span>
               <span className="text-xs text-white font-mono font-bold tracking-tighter uppercase">th-bkk-01</span>
             </div>
          </div>
        </footer>

      </div>
    </ConstellationBackground>
  );
}