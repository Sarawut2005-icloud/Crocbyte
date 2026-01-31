"use client";
import { useState, useEffect, useRef } from "react";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobbleOffset: number;
}

export default function MagicBackground({ children }: Props) {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. THEME SETUP ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("croc-theme");
    if (savedTheme === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    setMounted(true);
  }, []);

  // --- 2. UNDERWATER ANIMATION (ฉบับแก้ไข) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let animationId: number;
    let tick = 0;

    // สร้าง Particles (ฟอง/ละออง)
    // เพิ่มจำนวนจาก 60 -> 100 เพื่อให้เห็นชัดขึ้น
    const particles: Particle[] = Array.from({ length: 100 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.5 + Math.random() * 2.5, // เพิ่มขนาดนิดนึง
      speed: 0.3 + Math.random() * 0.7, // เร็วขึ้นนิดนึง
      opacity: 0.4 + Math.random() * 0.6, // ชัดขึ้น
      wobbleOffset: Math.random() * Math.PI * 2,
    }));

    // ฟังก์ชันวาด
    const animate = () => {
      tick += 0.01;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // การเคลื่อนที่
        p.y -= p.speed; 
        p.x += Math.sin(tick * 1.5 + p.wobbleOffset) * 0.5;

        // วนลูป: ถ้าลอยพ้นขอบบน ให้กลับไปเริ่มข้างล่างใหม่
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        // วาดจุด
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // สี: ถ้า Dark Mode เป็นฟ้าอ่อนๆ, Light Mode เป็นขาว
        ctx.fillStyle = darkMode 
            ? `rgba(180, 240, 255, ${p.opacity})` 
            : `rgba(255, 255, 255, ${p.opacity})`; 
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    // ใช้ ResizeObserver เพื่อดักจับขนาดหน้าจอที่เปลี่ยนไป (แก้ปัญหา Init แล้ว Canvas เป็น 0)
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
        canvas.width = width;
        canvas.height = height;
      }
    });

    observer.observe(container);
    
    // เริ่ม Animation
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [darkMode, mounted]); // รันใหม่เมื่อ Theme เปลี่ยน หรือ Mount เสร็จ

  // --- ACTIONS ---
  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem("croc-theme", "dark");
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("croc-theme", "light");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!mounted) return <div className="min-h-screen bg-[#002233]" />;

  return (
    <div ref={containerRef} className="min-h-screen font-sans flex flex-col relative overflow-hidden transition-colors duration-1000"
      style={{
        background: darkMode 
          ? "linear-gradient(180deg, #006994 0%, #004466 40%, #002233 100%)" 
          : "linear-gradient(180deg, #00c6ff 0%, #0072ff 100%)"
      }}
    >
      {/* 1. Caustic Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[50%] opacity-30 mix-blend-overlay"
          style={{
            background: `radial-gradient(ellipse 40% 30% at 30% 30%, rgba(255,255,255,0.4), transparent),
                         radial-gradient(ellipse 35% 40% at 70% 40%, rgba(255,255,255,0.3), transparent)`,
            animation: `caustic1 8s ease-in-out infinite`,
            filter: "blur(40px)",
          }}
        />
        <div className="absolute -inset-[50%] opacity-25 mix-blend-overlay"
          style={{
            background: `radial-gradient(ellipse 50% 40% at 60% 35%, rgba(200,255,255,0.35), transparent)`,
            animation: `caustic2 12s ease-in-out infinite`,
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* 2. Light Rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="absolute top-0 transform -skew-x-12 origin-top"
            style={{
              left: `${20 + i * 20}%`,
              width: "10%",
              height: "120%",
              background: `linear-gradient(180deg, rgba(255, 255, 255, ${darkMode ? 0.08 : 0.2}) 0%, transparent 80%)`,
              animation: `ray ${6 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * -1.5}s`,
              filter: "blur(12px)",
            }}
          />
        ))}
      </div>

      {/* 3. Particles Canvas (ตัวปัญหาที่แก้แล้ว) */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none z-0" />

      {/* 4. Surface & Depth */}
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{ background: `linear-gradient(180deg, rgba(255, 255, 255, ${darkMode ? 0.1 : 0.3}) 0%, transparent 100%)` }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{ background: `linear-gradient(0deg, rgba(0, 0, 0, ${darkMode ? 0.6 : 0.2}) 0%, transparent 100%)` }}
      />

      {/* UI Layers */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b backdrop-blur-md
        ${darkMode ? 'bg-[#002233]/50 border-white/10' : 'bg-white/20 border-white/30'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
               <span className="text-3xl filter drop-shadow-lg">🐡</span>
               <div>
                 <h1 className="font-serif text-2xl font-black text-white tracking-widest drop-shadow-md">CrocByte</h1>
                 <p className="text-[9px] tracking-[0.3em] uppercase font-bold text-cyan-200">{darkMode ? 'Deep Ocean' : 'Tropical'}</p>
               </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={toggleTheme} className={`px-4 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95
                 ${darkMode ? 'border-cyan-400/30 text-cyan-200 hover:bg-cyan-900/50' : 'border-white/50 text-white hover:bg-white/20'}
              `}>{darkMode ? "🌙 Dark Sea" : "☀️ Lagoon"}</button>
              <div className="h-4 w-[1px] bg-white/20"></div>
              <button onClick={handleLogout} className="text-xs font-bold text-white/70 hover:text-red-300 transition tracking-[0.2em] uppercase">Logout</button>
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full shadow-2xl backdrop-blur-xl bg-black/60 border-b border-white/10">
            <div className="px-6 py-6 space-y-4">
              <button onClick={toggleTheme} className="w-full text-left font-bold text-sm uppercase tracking-widest text-cyan-200">Theme: {darkMode ? "Dark Sea" : "Lagoon"}</button>
              <button onClick={handleLogout} className="w-full text-left font-bold text-sm uppercase tracking-widest text-red-400">Logout</button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 relative z-10 mt-20 overflow-y-auto">
        {children}
      </main>

      <style jsx>{`
        @keyframes caustic1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(2%, 1%) scale(1.05); }
        }
        @keyframes caustic2 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(-2%, 2%) scale(1.02); }
        }
        @keyframes ray {
          0%, 100% { opacity: 0.4; transform: skewX(-12deg) translateX(0); }
          50% { opacity: 0.8; transform: skewX(-15deg) translateX(5px); }
        }
      `}</style>
    </div>
  );
}