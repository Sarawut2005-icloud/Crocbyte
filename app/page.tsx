"use client";

/**
 * 🐊 CROCODILE STUDIO LANDING PAGE - MOTION EDITION
 * Version: 2.3.0 (Framer Motion Integrated)
 * Features:
 * - [NEW] Smooth Entrance Animations (Staggered)
 * - [NEW] Fluid Layout Transitions (Button to Progress Bar)
 * - [NEW] Interactive Hover/Tap Effects
 * - Retains all previous fixes (Z-Index, Responsive, Persistence)
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion"; // IMPORT FRAMER MOTION

// --- IMPORTS ---
import { SnowBackground } from "@/components/SnowBackground";
import { UnderwaterBackground } from "@/components/UnderwaterBackground";

// --- UTILITIES ---
const cn = (...classes: (string | undefined | null | boolean)[]) => 
  classes.filter(Boolean).join(" ");

const randomInt = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1) + min);

// --- SUB-COMPONENTS ---

const ScrambleText = ({ text, className, trigger }: { text: string; className?: string; trigger: boolean }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
  
  useEffect(() => {
    if (!trigger) return;
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text.split("").map((letter, index) => {
            if (index < iterations) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join("")
      );
      if (iterations >= text.length) clearInterval(interval);
      iterations += 1 / 3;
    }, 30);
    return () => clearInterval(interval);
  }, [text, trigger]);

  return <span className={className}>{displayText}</span>;
};

const ProgressBar = ({ progress, color = "bg-cyan-500" }: { progress: number; color?: string }) => (
  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
    <motion.div 
      className={cn("h-full", color)} 
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ type: "spring", stiffness: 50, damping: 20 }}
    />
  </div>
);

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

// --- MAIN PAGE COMPONENT ---

export default function HomePage() {
  const router = useRouter();

  // -- STATE: System --
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // -- STATE: Appearance --
  const [scene, setScene] = useState<"underwater" | "snow">("underwater");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLiteMode, setIsLiteMode] = useState(false);

  // -- STATE: Interactions --
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);

  // 1. Initialization & Storage Restore
  useEffect(() => {
    const savedScene = localStorage.getItem("croc_scene");
    const savedTheme = localStorage.getItem("croc_theme");
    const savedLite = localStorage.getItem("croc_lite");

    if (savedScene) setScene(savedScene as "underwater" | "snow");
    if (savedTheme) setTheme(savedTheme as "dark" | "light");
    if (savedLite) setIsLiteMode(savedLite === "true");

    setMounted(true);
    setTime(new Date());

    const clockTimer = setInterval(() => setTime(new Date()), 1000);

    return () => clearInterval(clockTimer);
  }, []);

  // 1.5 Persistence Listeners
  useEffect(() => {
    if (mounted) localStorage.setItem("croc_scene", scene);
  }, [scene, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem("croc_theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem("croc_lite", String(isLiteMode));
  }, [isLiteMode, mounted]);

  // 2. Mouse Parallax Logic
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isLiteMode) return;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setMousePos({ x, y });
  }, [isLiteMode]);

  // 3. Handle Launch Mission
  const handleStartMission = () => {
    if (isLaunching) return;
    setIsLaunching(true);

    let progress = 0;
    const interval = setInterval(() => {
      progress += randomInt(5, 15);
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setTimeout(() => {
          const queryParams = new URLSearchParams({
            scene,
            theme,
            lite: String(isLiteMode)
          }).toString();
          
          router.push(`/login?${queryParams}`);
        }, 800);
      }
      setLaunchProgress(progress);
    }, 0);
  };

  const timeString = time ? time.toLocaleTimeString('en-US', { hour12: false }) : "00:00:00"; 

  const isDark = theme === "dark";
  const bgColor = isDark ? "bg-[#020617]" : "bg-[#f8fafc]";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const panelColor = isDark ? "bg-black/40 border-white/10" : "bg-white/60 border-slate-200";
  
  const parallaxStyle = {
    transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`,
    transition: "transform 0.1s ease-out"
  };
  const bgParallaxStyle = {
    transform: `scale(1.1) translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)`,
    transition: "transform 0.4s ease-out"
  };

  if (!mounted) return <div className={cn("h-screen w-screen bg-black")} />;

  return (
    <div 
      onMouseMove={handleMouseMove}
      className={cn(
        "h-[100dvh] w-screen overflow-hidden relative flex flex-col transition-colors duration-500 selection:bg-cyan-500/30",
        bgColor, textColor
      )}
    >
      
      {/* LAYER 0: BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {!isLiteMode ? (
          <motion.div 
            className="w-full h-full" 
            style={bgParallaxStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            {scene === "underwater" && <UnderwaterBackground intensity={1} speed={0.4} />}
            {scene === "snow" && <SnowBackground count={150} intensity={0.8} speed={0.6} />}
          </motion.div>
        ) : (
          <div className={cn("w-full h-full transition-colors duration-1000", isDark ? "bg-slate-950" : "bg-slate-100")} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-1" />
        {isDark && (
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        )}
      </div>

      {/* LAYER 1: HEADER (HUD) */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="relative z-30 p-4 md:p-6 lg:p-8 shrink-0 flex justify-between items-start select-none h-[15vh] max-h-[120px]"
      >
        <div className={cn("flex gap-4 items-center p-2 pr-6 rounded-[3rem] border backdrop-blur-md transition-all duration-500 group hover:border-cyan-500/50", panelColor)}>
          <div className="relative w-10 h-10 md:w-16 md:h-16 overflow-hidden rounded-full border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-transform">
            <Image src="/croc-mascot.jpg" alt="Mascot" fill className="object-cover" />
          </div>
          <div className="hidden sm:flex flex-col">
            <h2 className="text-sm md:text-lg font-black uppercase tracking-tighter leading-none">Crocodile Dev</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-[10px] text-cyan-500 font-mono tracking-widest font-bold opacity-80">ONLINE</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
           <div className={cn("p-3 px-6 rounded-[2rem] backdrop-blur-md border font-mono text-right transition-all min-w-[120px] md:min-w-[140px]", panelColor)}>
            <div className="text-[9px] md:text-[10px] opacity-50 uppercase tracking-widest mb-1">Local Time</div>
            <div suppressHydrationWarning className="text-lg md:text-3xl font-black leading-none tracking-tight tabular-nums">
              {timeString}
            </div>
          </div>
        </div>
      </motion.header>

      {/* LAYER 2: MAIN CONTENT */}
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 w-full max-w-7xl mx-auto h-[70vh]"
      >
        
        {/* Mascot */}
        <motion.div variants={itemVariants} className="relative mb-4 md:mb-8 group cursor-pointer z-10">
           {/* ใช้ div ซ้อนข้างในเพื่อรับ mouse parallax โดยไม่ตีกับ framer animation */}
           <div style={parallaxStyle}>
             <div className="absolute inset-0 bg-cyan-400/20 blur-[60px] md:blur-[80px] rounded-full animate-pulse transition-all duration-1000 group-hover:bg-cyan-400/40" />
             <div className={cn(
               "relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 overflow-hidden rounded-[2rem] md:rounded-[4rem] border-4 shadow-2xl transition-all duration-500",
               isDark ? "border-white/10 shadow-cyan-900/20" : "border-white shadow-slate-300"
             )}>
               <Image src="/croc-mascot.jpg" alt="Main Mascot" fill className="object-cover transform transition-transform duration-700 group-hover:scale-110" priority />
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-[20%] w-full animate-scanline pointer-events-none opacity-50" />
             </div>
           </div>
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants} className="text-center relative z-10 mix-blend-difference">
          <h1 className={cn(
            "font-serif font-black leading-[0.85] tracking-tighter uppercase drop-shadow-2xl flex flex-col items-center transition-colors duration-500",
            "text-4xl sm:text-6xl md:text-7xl lg:text-[8rem]" 
          )}>
            <div className="flex gap-2 md:gap-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              <ScrambleText text="CROCODILE" trigger={mounted} />
            </div>
            <span className={cn(
              "font-sans italic font-light tracking-normal opacity-40 text-xl md:text-3xl mt-2 block",
              isDark ? "text-cyan-200" : "text-slate-600"
            )}>
              Creative Studio
            </span>
          </h1>
        </motion.div>

        {/* Action Area (Button) with Morphing Layout */}
        <motion.div 
          variants={itemVariants} 
          className="relative z-50 mt-8 md:mt-12 w-full max-w-xs flex flex-col items-center gap-4 h-[80px]"
        >
          <AnimatePresence mode="wait">
            {isLaunching ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
                className="w-full space-y-2 bg-black/50 p-4 rounded-xl backdrop-blur-sm border border-cyan-500/30"
              >
                 <div className="flex justify-between text-[10px] font-mono uppercase opacity-70 text-cyan-500">
                   <span>Launching...</span>
                   <span>{launchProgress}%</span>
                 </div>
                 <ProgressBar progress={launchProgress} color={isDark ? "bg-cyan-400" : "bg-black"} />
              </motion.div>
            ) : (
              <motion.button 
                key="start-btn"
                layout
                onClick={handleStartMission} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "group relative px-8 md:px-14 py-4 md:py-5 rounded-full font-black text-xs md:text-sm tracking-[0.3em] md:tracking-[0.4em] shadow-xl cursor-pointer overflow-hidden border-2 border-transparent",
                  isDark ? "bg-white text-black hover:shadow-[0_0_40px_rgba(6,182,212,0.8)]" : "bg-black text-white hover:bg-gray-800"
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  มาเริ่มกันเลย!
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.main>

      {/* LAYER 3: FOOTER */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="relative z-30 p-4 md:p-8 shrink-0 flex justify-center items-center h-[10vh]"
      >
        <div className={cn(
            "text-[9px] md:text-[10px] font-mono tracking-[0.2em] opacity-40 text-center uppercase",
            isDark ? "text-cyan-500" : "text-slate-500"
        )}>
          © 2026 Crocodile Studio. All Rights Reserved.
        </div>
      </motion.footer>

      {/* LAYER 4: FLOATING CONTROLS */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 60 }}
        className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-[9999]"
      >
        <div className={cn(
           "p-2 rounded-[2rem] border flex flex-col gap-3 shadow-[0_15px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl",
           isDark ? "bg-black/80 border-white/10" : "bg-white/90 border-slate-200"
        )}>
          <motion.button 
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setScene("underwater")} 
            className={cn(
              "relative group p-3 rounded-full transition-colors",
              scene === "underwater" ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/50" : "text-gray-500 hover:bg-white/10"
            )}
            title="Switch to Underwater"
          >
            <span className="text-xl">🌊</span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setScene("snow")} 
            className={cn(
              "relative group p-3 rounded-full transition-colors",
              scene === "snow" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50" : "text-gray-500 hover:bg-white/10"
            )}
            title="Switch to Snow"
          >
            <span className="text-xl">❄️</span>
          </motion.button>
          
          <div className="h-[1px] bg-white/10 mx-2 my-1" />
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLiteMode(!isLiteMode)} 
            className={cn(
              "text-[8px] font-black py-2 rounded-lg transition-colors border border-transparent hover:border-white/20",
              isLiteMode ? "bg-yellow-500 text-black" : (isDark ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black")
            )}
          >
            {isLiteMode ? "LITE" : "FULL"}
          </motion.button>

          <motion.button 
             whileTap={{ scale: 0.95 }}
             onClick={() => setTheme(isDark ? "light" : "dark")}
             className={cn(
               "text-[8px] font-black py-2 rounded-lg transition-colors border border-transparent",
               isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
             )}
          >
            {isDark ? "DARK" : "LIGHT"}
          </motion.button>
        </div>
      </motion.div>

    </div>
  ); 
}