"use client";

/**
 * 🏆 CROC LEADERBOARD
 * - แสดงอันดับลูกค้าตามยอดการใช้จ่าย (Total Spent)
 * - มีแท่นรางวัล (Podium) สำหรับ 3 อันดับแรก
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth, db } from "../../lib/firebase"; 
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  FaCrown, FaTrophy, FaMedal, FaUserAstronaut, FaSignInAlt, FaArrowLeft
} from "react-icons/fa";

// --- IMPORTS ---
import { SnowBackground } from "@/components/SnowBackground";
import { UnderwaterBackground } from "@/components/UnderwaterBackground";

const cn = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(" ");

export default function RankingPage() {
  const router = useRouter();

  // -- STATE --
  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState<"underwater" | "snow">("underwater");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLiteMode, setIsLiteMode] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const s = localStorage.getItem("croc_scene");
    const t = localStorage.getItem("croc_theme");
    const l = localStorage.getItem("croc_lite"); 
    if (s) setScene(s as any);
    if (t) setTheme(t as any);
    if (l) setIsLiteMode(l === "true");

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    
    // 🔥 ดึงข้อมูลลูกค้า เรียงตามยอดเงิน (totalSpent) จากมากไปน้อย
    const q = query(collection(db, "users"), orderBy("totalSpent", "desc"), limit(50));
    const unsubDB = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc, index) => ({ 
            id: doc.id, 
            rank: index + 1,
            ...doc.data() 
        }));
        setLeaders(data);
    });

    return () => { unsubAuth(); unsubDB(); };
  }, []);

  // หาอันดับของตัวเอง
  useEffect(() => {
      if (user && leaders.length > 0) {
          const me = leaders.find(l => l.email === user.email); 
          if (me) setMyRank(me.rank);
      }
  }, [user, leaders]);

  const isDark = theme === "dark";
  const bgColor = isDark ? "bg-[#020617]" : "bg-[#f8fafc]";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const panelColor = isDark ? "bg-black/40 border-white/10" : "bg-white/60 border-slate-200";

  if (!mounted) return <div className="h-screen w-screen bg-black" />;

  // แยก 3 อันดับแรกออกมาเพื่อแสดงบน Podium
  const top1 = leaders[0];
  const top2 = leaders[1];
  const top3 = leaders[2];
  const rest = leaders.slice(3);

  return (
    <div className={cn("fixed inset-0 h-[100dvh] w-screen overflow-hidden flex flex-col select-none transition-colors duration-500", bgColor, textColor)}>
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full">
        {!isLiteMode ? (
          <motion.div className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {scene === "underwater" && <UnderwaterBackground intensity={1} speed={0.4} />}
            {scene === "snow" && <SnowBackground count={150} intensity={0.8} speed={0.6} />}
          </motion.div>
        ) : (
          <div className={cn("w-full h-full", isDark ? "bg-slate-950" : "bg-slate-50")} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-1" />
      </div>

      {/* HEADER */}
      <div className="relative z-50 p-6 flex justify-between items-center h-[10%]">
          <button onClick={() => router.back()} className={cn("p-3 rounded-full border transition hover:scale-110", panelColor)}><FaArrowLeft/></button>
          <div className="text-center">
              <h1 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-lg">Hall of Fame</h1>
              <p className="text-[10px] opacity-60 font-mono">TOP SPENDERS RANKING</p>
          </div>
          <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* CONTENT */}
      <main className="relative z-20 flex-1 overflow-y-auto custom-scrollbar p-4 pb-32">
         
         {/* 🏆 PODIUM (Top 3) */}
         <div className="flex justify-center items-end gap-2 md:gap-6 mb-12 mt-4 min-h-[220px]">
             {/* RANK 2 (Silver) */}
             {top2 ? (
                 <div className="flex flex-col items-center">
                     <div className="mb-2 relative">
                         <div className="w-16 h-16 rounded-full border-2 border-slate-400 overflow-hidden shadow-lg shadow-slate-500/50">
                             {top2.photoURL ? <img src={top2.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-2xl">🥈</div>}
                         </div>
                         <div className="absolute -bottom-2 -right-2 bg-slate-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">2</div>
                     </div>
                     <div className="text-xs font-bold mb-1 max-w-[80px] truncate">{top2.name}</div>
                     <div className="text-[10px] font-mono opacity-60 mb-2">฿{top2.totalSpent?.toLocaleString()}</div>
                     <div className={cn("w-20 md:w-24 h-24 rounded-t-xl bg-gradient-to-t from-slate-800 to-slate-600 border-t-4 border-slate-400 relative", isLiteMode && "opacity-80")}>
                         <FaMedal className="text-slate-300 text-3xl absolute bottom-4 left-1/2 -translate-x-1/2 opacity-50"/>
                     </div>
                 </div>
             ) : <div className="w-20"></div>}

             {/* RANK 1 (Gold) */}
             {top1 ? (
                 <div className="flex flex-col items-center z-10 -mx-2 mb-2">
                     <div className="mb-2 relative">
                         <FaCrown className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 text-2xl animate-bounce"/>
                         <div className="w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.6)]">
                             {top1.photoURL ? <img src={top1.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-yellow-900 flex items-center justify-center text-2xl">🥇</div>}
                         </div>
                         <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full shadow-lg">1</div>
                     </div>
                     <div className="text-sm font-black mb-1 text-yellow-400 max-w-[100px] truncate">{top1.name}</div>
                     <div className="text-xs font-mono font-bold text-yellow-200 mb-2 drop-shadow-md">฿{top1.totalSpent?.toLocaleString()}</div>
                     <div className={cn("w-24 md:w-32 h-36 rounded-t-xl bg-gradient-to-t from-yellow-700 to-yellow-500 border-t-4 border-yellow-400 relative shadow-2xl", isLiteMode && "opacity-90")}>
                         <FaTrophy className="text-yellow-200 text-5xl absolute bottom-6 left-1/2 -translate-x-1/2 opacity-80 drop-shadow-md"/>
                     </div>
                 </div>
             ) : <div className="w-24"></div>}

             {/* RANK 3 (Bronze) */}
             {top3 ? (
                 <div className="flex flex-col items-center">
                     <div className="mb-2 relative">
                         <div className="w-16 h-16 rounded-full border-2 border-orange-700 overflow-hidden shadow-lg shadow-orange-700/50">
                             {top3.photoURL ? <img src={top3.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-orange-900 flex items-center justify-center text-2xl">🥉</div>}
                         </div>
                         <div className="absolute -bottom-2 -right-2 bg-orange-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full">3</div>
                     </div>
                     <div className="text-xs font-bold mb-1 max-w-[80px] truncate">{top3.name}</div>
                     <div className="text-[10px] font-mono opacity-60 mb-2">฿{top3.totalSpent?.toLocaleString()}</div>
                     <div className={cn("w-20 md:w-24 h-20 rounded-t-xl bg-gradient-to-t from-orange-900 to-orange-700 border-t-4 border-orange-600 relative", isLiteMode && "opacity-80")}>
                         <FaMedal className="text-orange-300 text-3xl absolute bottom-4 left-1/2 -translate-x-1/2 opacity-50"/>
                     </div>
                 </div>
             ) : <div className="w-20"></div>}
         </div>

         {/* 📜 RANK LIST (4-50) */}
         <div className="max-w-2xl mx-auto space-y-3 pb-8">
             {rest.map((r) => (
                 <div key={r.id} className={cn("flex items-center p-3 rounded-2xl border transition-all hover:scale-[1.02]", panelColor, user?.email === r.email ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "border-transparent")}>
                     <div className="w-8 font-black text-center opacity-50 font-mono">#{r.rank}</div>
                     <div className="w-10 h-10 rounded-full bg-black/30 overflow-hidden mx-3 border border-white/10">
                         {r.photoURL ? <img src={r.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
                     </div>
                     <div className="flex-1">
                         <div className="font-bold text-sm">{r.name}</div>
                         <div className="text-[10px] opacity-50 uppercase tracking-wider">VIP Level {r.vipLevel}</div>
                     </div>
                     <div className="font-mono font-bold text-cyan-400">฿{r.totalSpent?.toLocaleString()}</div>
                 </div>
             ))}
             {rest.length === 0 && <div className="text-center opacity-30 py-4">Waiting for more challengers...</div>}
         </div>

      </main>

      {/* MY RANK BAR (Sticky Bottom) */}
      {user && myRank && (
          <div className="fixed bottom-0 w-full p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-50">
              <div className="max-w-2xl mx-auto bg-cyan-600 text-white p-4 rounded-2xl shadow-2xl flex items-center border border-cyan-400 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  <div className="mr-4 text-center z-10">
                      <div className="text-[9px] uppercase opacity-80">Your Rank</div>
                      <div className="text-2xl font-black">#{myRank}</div>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden mr-3 z-10">
                      {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-black flex items-center justify-center">👤</div>}
                  </div>
                  <div className="flex-1 z-10">
                      <div className="font-bold">{user.displayName}</div>
                      <div className="text-xs opacity-80">Keep going to reach top 3!</div>
                  </div>
                  <button onClick={() => router.push('/services')} className="bg-white text-cyan-600 px-4 py-2 rounded-xl font-bold text-xs shadow-lg hover:scale-105 transition z-10">
                      UPGRADE
                  </button>
              </div>
          </div>
      )}

    </div>
  );
}