"use client";

/**
 * 🐊 CROCODILE STUDIO LANDING PAGE (V2.8 - Final Fixed)
 * - [FIX] Import Path: Fixed "../lib/firebase" error.
 * - [UI] Typography: "CrocWork" & "CROCODILE" now use Serif font (Luxury Style).
 * - [CORE] Includes Magic Settings (Bottom-Left) & Profile Dropdown (Top-Right).
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaColumns, FaTrophy, FaSignInAlt, FaBars, FaTimes, FaCog, 
  FaSignOutAlt, FaChevronDown
} from "react-icons/fa";
// 👇 แก้ไขบรรทัดนี้แล้วครับ (ใช้ .. จุดสองจุดพอครับ)
import { auth, db } from "../lib/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// --- IMPORTS ---
import { SnowBackground } from "@/components/SnowBackground";
import { UnderwaterBackground } from "@/components/UnderwaterBackground";

// --- UTILITIES ---
const cn = (...classes: (string | undefined | null | boolean)[]) => 
  classes.filter(Boolean).join(" ");

// --- 🌍 LANGUAGE DICTIONARY ---
const TEXT = {
  en: {
    dashboard: "DASHBOARD",
    ranking: "RANKING",
    login: "LOGIN",
    logout: "LOGOUT",
    welcome: "Welcome Guest",
    explore: "EXPLORE SERVICES",
    subtitle: "Premium Web Development & Design",
    theme: "THEME",
    mode: "MODE",
    level: "Level",
    profile_menu: "Profile Menu"
  },
  th: {
    dashboard: "แดชบอร์ด",
    ranking: "จัดอันดับ",
    login: "เข้าสู่ระบบ",
    logout: "ออกจากระบบ",
    welcome: "ยินดีต้อนรับ",
    explore: "ดูบริการทั้งหมด",
    subtitle: "บริการรับทำเว็บไซต์และออกแบบครบวงจร",
    theme: "ธีม",
    mode: "โหมด",
    level: "เลเวล",
    profile_menu: "เมนูโปรไฟล์"
  }
};

// --- SUB-COMPONENTS ---

const ScrambleText = ({ text, className, trigger }: { text: string; className?: string; trigger: boolean }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
  
  useEffect(() => {
    if (!trigger) return;
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(text.split("").map((letter, index) => {
        if (index < iteration) return text[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
    return () => clearInterval(interval);
  }, [trigger, text]);

  return <span className={className}>{displayText}</span>;
};

// --- MAIN PAGE COMPONENT ---
export default function LandingPage() {
  const router = useRouter();
  
  // -- STATE --
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [localTime, setLocalTime] = useState<string>("");
  
  // Settings
  const [scene, setScene] = useState<"underwater" | "snow">("underwater");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [lang, setLang] = useState<"en" | "th">("en");
  
  // UI Toggles
  const [hovered, setHovered] = useState(false);
  const [expandSettings, setExpandSettings] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Helper for Translation
  const t = TEXT[lang];

  // -- INIT --
  useEffect(() => {
    setMounted(true);
    const s = localStorage.getItem("croc_scene");
    const tm = localStorage.getItem("croc_theme");
    const l = localStorage.getItem("croc_lite");
    const lng = localStorage.getItem("croc_lang");

    if (s) setScene(s as any);
    if (tm) setTheme(tm as any);
    if (l) setIsLiteMode(l === "true");
    if (lng) setLang(lng as "en" | "th");

    // Clock
    const timer = setInterval(() => {
        setLocalTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            setUser(snap.exists() ? { ...currentUser, ...snap.data() } : currentUser);
        } else {
            setUser(null);
        }
    });
    return () => { unsub(); clearInterval(timer); };
  }, []);

  // -- HANDLERS --
  const toggleScene = (s: "underwater" | "snow") => {
      setScene(s);
      localStorage.setItem("croc_scene", s);
  };
  
  const toggleTheme = () => {
      const newTheme = theme === "dark" ? "light" : "dark";
      setTheme(newTheme);
      localStorage.setItem("croc_theme", newTheme);
  };

  const toggleLite = () => {
      setIsLiteMode(!isLiteMode);
      localStorage.setItem("croc_lite", String(!isLiteMode));
  };

  const switchLang = (l: "en" | "th") => {
      setLang(l);
      localStorage.setItem("croc_lang", l);
  };

  const handleLogout = async () => {
      await signOut(auth);
      setShowProfileMenu(false);
      setIsMobileMenuOpen(false);
  };

  if (!mounted) return <div className="bg-black h-screen w-screen" />;

  const isDark = theme === "dark";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const panelColor = isDark ? "bg-black/40 border-white/10" : "bg-white/60 border-slate-200";

  return (
    <div className={cn("fixed inset-0 h-[100dvh] w-screen overflow-hidden flex flex-col select-none transition-colors duration-1000", isDark ? "bg-[#020617]" : "bg-slate-50")}>
      
      {/* 1. BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {!isLiteMode ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="w-full h-full">
            {scene === "underwater" && <UnderwaterBackground intensity={1} speed={0.5} />}
            {scene === "snow" && <SnowBackground count={150} intensity={0.8} speed={0.5} />}
          </motion.div>
        ) : (
           <div className={cn("w-full h-full transition-colors duration-1000", isDark ? (scene==="underwater"?"bg-gradient-to-b from-[#001a2c] to-black":"bg-slate-950") : "bg-slate-100")} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] z-1" />
      </div>

      {/* 2. NAVBAR */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="relative z-50 p-6 flex justify-between items-start"
      >
        {/* LOGO AREA */}
        <div className={cn("flex gap-3 items-center p-2 pr-5 rounded-[3rem] border backdrop-blur-md cursor-pointer hover:scale-105 transition-transform", panelColor)}>
          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-cyan-500 shadow-lg">
            <Image src="/croc-mascot.jpg" alt="Mascot" fill className="object-cover" />
          </div>
          <div className="flex flex-col">
            {/* ✅ FONT STYLE: SERIF */}
            <h2 className={cn("text-sm font-serif font-black uppercase tracking-tighter leading-none", textColor)}>CrocByte</h2>
            <div className="flex items-center gap-1 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
               <p className="text-[8px] text-cyan-500 font-mono tracking-widest opacity-80">ONLINE</p>
            </div>
          </div>
        </div>

        {/* RIGHT AREA: CLOCK & MENU */}
        <div className="flex flex-col items-end gap-3">
            {/* CLOCK */}
            <div className={cn("hidden md:block p-2 px-4 rounded-full border backdrop-blur-md font-mono text-xs tracking-widest", panelColor, textColor)}>
                LOCAL TIME <span className="font-bold ml-2 text-cyan-500">{localTime}</span>
            </div>

            {/* DESKTOP MENU (PROFILE DROPDOWN) */}
            <div className="hidden lg:flex items-center gap-3 relative">
                {user ? (
                    <div className="relative">
                        <button 
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className={cn("flex items-center gap-3 p-1.5 pr-4 rounded-full border transition-all hover:bg-white/5 active:scale-95", panelColor)}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-[2px] shadow-lg">
                                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                    {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
                                </div>
                            </div>
                            <div className="text-right hidden xl:block">
                                <div className={cn("text-xs font-bold", textColor)}>{user.displayName || "Diver"}</div>
                                <div className="text-[8px] opacity-60 uppercase tracking-widest">{t.level} {user.vipLevel || 0}</div>
                            </div>
                            <FaChevronDown className={cn("text-xs opacity-50 transition-transform duration-300", showProfileMenu ? "rotate-180" : "", textColor)} />
                        </button>

                        <AnimatePresence>
                            {showProfileMenu && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className={cn("absolute top-full right-0 mt-2 w-48 p-2 rounded-2xl border flex flex-col gap-1 shadow-2xl backdrop-blur-xl origin-top-right overflow-hidden", isDark ? "bg-black/90 border-white/10" : "bg-white/90 border-slate-200")}
                            >
                                <div className={cn("text-[8px] font-black uppercase px-3 py-2 opacity-40 tracking-widest", textColor)}>{t.profile_menu}</div>
                                
                                <button onClick={() => router.push('/dashboard')} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider transition-colors", isDark ? "text-cyan-400 hover:bg-white/10" : "text-blue-600 hover:bg-black/5")}>
                                    <FaColumns /> {t.dashboard}
                                </button>
                                
                                <button onClick={() => router.push('/ranking')} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider transition-colors", isDark ? "text-yellow-400 hover:bg-white/10" : "text-orange-600 hover:bg-black/5")}>
                                    <FaTrophy /> {t.ranking}
                                </button>

                                <div className="h-[1px] bg-current/10 mx-2 my-1" />

                                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider text-red-500 hover:bg-red-500/10 transition-colors w-full text-left">
                                    <FaSignOutAlt /> {t.logout}
                                </button>
                            </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <button onClick={() => router.push('/login')} className="px-6 py-3 rounded-full font-black text-xs tracking-widest bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg transition-all flex items-center gap-2">
                        <FaSignInAlt /> {t.login}
                    </button>
                )}
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className={cn("lg:hidden p-3 rounded-full border shadow-lg active:scale-95 transition", panelColor, textColor)}
            >
                <FaBars className="text-lg" />
            </button>
        </div>
      </motion.header>

      {/* 📱 MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn("fixed inset-0 z-[200] flex flex-col p-6 backdrop-blur-xl", isDark ? "bg-black/95" : "bg-white/95")}
            >
                <div className="flex justify-end">
                    <button onClick={() => setIsMobileMenuOpen(false)} className={cn("p-3 rounded-full border hover:bg-red-500 hover:text-white transition-colors", panelColor, textColor)}>
                        <FaTimes className="text-xl" />
                    </button>
                </div>
                
                <div className="flex flex-col items-center mt-10 space-y-6">
                    {user ? (
                        <div className="flex flex-col items-center gap-3 mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-[2px] shadow-2xl">
                                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                    {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
                                </div>
                            </div>
                            <div className={cn("text-center", textColor)}>
                                <h3 className="text-2xl font-bold">{user.displayName || "Diver"}</h3>
                                <p className="text-sm opacity-60">{t.level} {user.vipLevel || 0}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center mb-6">
                            {/* ✅ FONT STYLE: SERIF */}
                            <h2 className="text-3xl font-serif font-black uppercase tracking-widest text-cyan-500">CrocByte</h2>
                            <p className={cn("text-sm opacity-50", textColor)}>{t.welcome}</p>
                        </div>
                    )}

                    <div className="w-full max-w-xs space-y-4">
                        {user && (
                            <>
                                <button onClick={() => { setIsMobileMenuOpen(false); router.push('/dashboard'); }} className={cn("w-full py-4 rounded-2xl font-bold border text-sm flex items-center justify-center gap-3 active:scale-95 transition", isDark ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/5" : "border-blue-500/30 text-blue-600 bg-blue-500/5")}>
                                    <FaColumns /> {t.dashboard}
                                </button>
                                <button onClick={() => { setIsMobileMenuOpen(false); router.push('/ranking'); }} className={cn("w-full py-4 rounded-2xl font-bold border text-sm flex items-center justify-center gap-3 active:scale-95 transition", isDark ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/5" : "border-orange-500/30 text-orange-600 bg-orange-500/5")}>
                                    <FaTrophy /> {t.ranking}
                                </button>
                            </>
                        )}
                        {!user ? (
                            <button onClick={() => router.push('/login')} className="w-full py-4 rounded-2xl bg-cyan-500 text-black font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 text-lg">
                                <FaSignInAlt /> {t.login}
                            </button>
                        ) : (
                            <button onClick={() => { auth.signOut(); setIsMobileMenuOpen(false); }} className="w-full py-4 rounded-2xl border border-red-500/50 text-red-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-8">
                                <FaSignOutAlt /> {t.logout}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CENTER HERO CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="relative mb-6 group cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => setHovered(!hovered)}
        >
           <div className="absolute inset-0 bg-cyan-400/20 blur-[60px] md:blur-[80px] rounded-full animate-pulse group-hover:bg-cyan-400/40 transition-all" />
           <div className={cn("relative w-40 h-40 md:w-56 md:h-56 rounded-full border-4 shadow-[0_0_50px_rgba(6,182,212,0.4)] overflow-hidden transition-all duration-500", hovered ? "scale-110 border-cyan-400 shadow-[0_0_80px_rgba(6,182,212,0.8)] rotate-3" : "border-white/20")}>
              <Image src="/croc-mascot.jpg" alt="Mascot" fill className="object-cover" priority />
           </div>
        </motion.div>

        <div className="text-center space-y-4 max-w-2xl px-4">
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              {/* ✅ FONT STYLE: SERIF (LUXURY STYLE) */}
              <h1 className={cn("text-4xl md:text-7xl font-serif font-black tracking-tighter uppercase mb-2", textColor)}>
                <ScrambleText text="CROCODILE" className="text-white drop-shadow-2xl" trigger={mounted} /> <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">STUDIO</span>
              </h1>
              <p className={cn("text-xs md:text-sm font-mono tracking-[0.3em] uppercase opacity-60", textColor)}>
                {t.subtitle}
              </p>
           </motion.div>

           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <button 
                onClick={() => router.push('/services')}
                className={cn("px-10 py-4 rounded-full font-black text-sm md:text-base tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-105 hover:shadow-[0_0_50px_rgba(6,182,212,0.6)]", isDark ? "bg-white text-black hover:bg-cyan-400" : "bg-black text-white hover:bg-cyan-500")}
              >
                {t.explore}
              </button>
           </motion.div>
        </div>
      </main>

      {/* 4. MAGIC SETTINGS BUTTON (Bottom-Left) */}
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-[9999]">
        <div className="relative">
            <AnimatePresence>
                {expandSettings && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        className={cn("absolute bottom-full left-0 mb-4 p-3 rounded-[1.5rem] border flex flex-col gap-3 shadow-[0_15px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl origin-bottom-left min-w-[140px]", isDark ? "bg-black/90 border-white/10" : "bg-white/90 border-slate-200")}
                    >
                        <div className={cn("text-[8px] font-black uppercase text-center opacity-50 tracking-widest", textColor)}>System Controls</div>
                        
                        {/* THEME TOGGLE */}
                        <button onClick={toggleTheme} className={cn("text-[9px] font-bold py-3 px-4 rounded-xl transition-colors border border-transparent flex items-center justify-between", isDark?"bg-white/10 text-white hover:bg-white/20":"bg-black/5 text-black hover:bg-black/10")}>
                            <span>{t.theme}</span>
                            <span>{isDark ? "🌙" : "☀️"}</span>
                        </button>
                        
                        {/* LITE MODE */}
                        <button onClick={toggleLite} className={cn("text-[9px] font-bold py-3 px-4 rounded-xl transition-colors border border-transparent flex items-center justify-between", isLiteMode?"bg-yellow-500 text-black shadow-lg":(isDark?"text-white/50 hover:text-white bg-white/5":"text-black/50 hover:text-black bg-black/5"))}>
                            <span>{t.mode}</span>
                            <span>{isLiteMode ? "⚡" : "🐢"}</span>
                        </button>

                        <div className="h-[1px] bg-current/10 mx-1" />

                        {/* LANGUAGE SWITCHER */}
                        <div className="flex gap-1 justify-center">
                            <button onClick={() => switchLang("en")} className={cn("text-[8px] font-black p-2 w-full rounded transition-colors", lang==="en"?"bg-cyan-500 text-black":"opacity-50 hover:opacity-100")}>EN</button>
                            <button onClick={() => switchLang("th")} className={cn("text-[8px] font-black p-2 w-full rounded transition-colors", lang==="th"?"bg-cyan-500 text-black":"opacity-50 hover:opacity-100")}>TH</button>
                        </div>

                        <div className="h-[1px] bg-current/10 mx-1" />

                        {/* SCENE SWITCHER */}
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => toggleScene("underwater")} className={cn("p-2 rounded-full transition-colors text-lg border border-transparent", scene==="underwater"?"bg-cyan-500 text-black shadow-lg":"text-gray-500 hover:bg-white/10 hover:text-white")}>🌊</button>
                            <button onClick={() => toggleScene("snow")} className={cn("p-2 rounded-full transition-colors text-lg border border-transparent", scene==="snow"?"bg-blue-500 text-white shadow-lg":"text-gray-500 hover:bg-white/10 hover:text-white")}>❄️</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN GEAR BUTTON */}
            <button 
                onClick={() => setExpandSettings(!expandSettings)}
                className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border transition-all hover:scale-110 active:scale-95", isDark ? "bg-black/80 border-white/20 text-white" : "bg-white border-slate-200 text-black", expandSettings && "bg-cyan-500 border-cyan-500 text-black rotate-90")}
            >
                {expandSettings ? <FaTimes className="text-xl" /> : <FaCog className="text-2xl" />}
            </button>
        </div>
      </motion.div>

    </div>
  );
}