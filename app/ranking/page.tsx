"use client";

/**
 * 🏆 CROC LEADERBOARD (V17.5 - Streamlined Chat)
 * - [REMOVE] Audio System: Completely removed per request.
 * - [MOD] Reactions: Simplified to presets only (No [+] button).
 * - [FIX] Layout: Fixed emoji overflow and layout issues.
 * - [CORE] Text, Image, Zoom, Delete, Presets preserved.
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth, db } from "../../lib/firebase"; 
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaCrown, FaTrophy, FaMedal, FaArrowLeft, FaUsers, FaCommentDots, FaPaperPlane, FaStar, 
  FaTrash, FaSmile, FaImage, FaTimes, FaRegSmile
} from "react-icons/fa";
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

import { SnowBackground } from "@/components/SnowBackground";
import { UnderwaterBackground } from "@/components/UnderwaterBackground";

const cn = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(" ");

const VIP_TIERS = [
  { level: 10, min: 200000, label: "GOD", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  { level: 9, min: 150000, label: "LEGEND", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  { level: 8, min: 125000, label: "MYTHIC", color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  { level: 7, min: 100000, label: "DIAMOND", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
  { level: 6, min: 80000, label: "PLATINUM", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  { level: 5, min: 50000, label: "GOLD", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  { level: 4, min: 30000, label: "SILVER", color: "text-gray-300", bg: "bg-gray-300/10 border-gray-300/20" },
  { level: 3, min: 10000, label: "BRONZE", color: "text-orange-300", bg: "bg-orange-300/10 border-orange-300/20" },
  { level: 2, min: 4000, label: "IRON", color: "text-stone-400", bg: "bg-stone-400/10 border-stone-400/20" },
  { level: 1, min: 1000, label: "EGG", color: "text-yellow-100", bg: "bg-yellow-100/10 border-yellow-100/20" },
  { level: 0, min: 0, label: "NEW", color: "text-white", bg: "bg-white/5 border-white/10" },
];

const getVipLabel = (spent: number) => VIP_TIERS.find(t => spent >= t.min) || VIP_TIERS[VIP_TIERS.length - 1];

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement("img");
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 600;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext("2d");
                if(ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                }
            };
        };
    });
};

export default function RankingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState<"underwater" | "snow">("underwater");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  
  // Chat State
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMainEmoji, setShowMainEmoji] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  // Zoom State
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Reactions
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const s = localStorage.getItem("croc_scene");
    const t = localStorage.getItem("croc_theme");
    const l = localStorage.getItem("croc_lite"); 
    if (s) setScene(s as any);
    if (t) setTheme(t as any);
    if (l) setIsLiteMode(l === "true");

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    
    const qLeaders = query(collection(db, "users"), orderBy("totalSpent", "desc"), limit(50));
    const unsubLeaders = onSnapshot(qLeaders, (snapshot) => {
        const data = snapshot.docs.map((doc, index) => ({ id: doc.id, rank: index + 1, ...doc.data() }));
        setLeaders(data);
    });

    const qComments = query(collection(db, "ranking_comments"), orderBy("timestamp", "asc"), limit(100));
    const unsubComments = onSnapshot(qComments, (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => { unsubAuth(); unsubLeaders(); unsubComments(); };
  }, []);

  useEffect(() => {
      if (user && leaders.length > 0) {
          const me = leaders.find(l => l.email === user.email); 
          if (me) setMyRank(me.rank);
      }
  }, [user, leaders]);

  const handleEmojiClick = (emojiObject: any) => setNewComment(prev => prev + emojiObject.emoji);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const compressedBase64 = await compressImage(file);
              setMediaPreview(compressedBase64);
          } catch(e) { alert("Error reading image"); }
      }
  };

  const handlePostComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!user) return;
      if(!newComment.trim() && !mediaPreview) return;
      
      setIsSubmitting(true);
      try {
          const myData = leaders.find(l => l.email === user.email);
          const currentVip = getVipLabel(myData?.totalSpent || 0);

          const payload: any = {
              text: newComment,
              uid: user.uid,
              user: user.displayName || "Anonymous",
              photoURL: user.photoURL,
              vipLevel: currentVip.level,
              vipLabel: currentVip.label,
              vipColor: currentVip.color,
              timestamp: serverTimestamp(),
              type: "text",
              reactions: []
          };

          if (mediaPreview) {
              payload.media = mediaPreview; 
              payload.type = "image";
          }
          
          await addDoc(collection(db, "ranking_comments"), payload);
          resetChat();

      } catch (err: any) { alert(`Error: ${err.message}`); }
      setIsSubmitting(false);
  };

  const handleReaction = async (commentId: string, emoji: string) => {
      if(!user) return;
      try {
          const commentRef = doc(db, "ranking_comments", commentId);
          const commentSnap = await getDoc(commentRef);
          if (commentSnap.exists()) {
              const reactions = commentSnap.data().reactions || [];
              const existing = reactions.find((r:any) => r.uid === user.uid);
              if (existing) {
                  await updateDoc(commentRef, { reactions: arrayRemove(existing) });
                  if (existing.emoji !== emoji) {
                      await updateDoc(commentRef, { reactions: arrayUnion({ emoji, user: user.displayName, uid: user.uid, photoURL: user.photoURL }) });
                  }
              } else {
                  await updateDoc(commentRef, { reactions: arrayUnion({ emoji, user: user.displayName, uid: user.uid, photoURL: user.photoURL }) });
              }
          }
          setActiveReactionId(null);
      } catch (e) { console.error(e); }
  };

  const resetChat = () => {
      setNewComment("");
      setMediaPreview(null);
      setShowMainEmoji(false);
  };

  const handleDelete = async (id: string) => {
      if(confirm("Delete this message?")) await deleteDoc(doc(db, "ranking_comments", id));
  };

  const getMotivationalMessage = (rank: number) => {
      if (rank === 1) return "👑 THE GOD CROC!";
      if (rank <= 3) return "🔥 LEGENDARY!";
      if (rank <= 10) return "🚀 TOP 10 ELITE!";
      return "💪 KEEP PUSHING!";
  };

  const getGroupedReactions = (reactions: any[]) => {
      if (!reactions) return [];
      const grouped: {[key: string]: {count: number, hasReacted: boolean}} = {};
      reactions.forEach(r => {
          if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, hasReacted: false };
          grouped[r.emoji].count++;
          if (user && r.uid === user.uid) grouped[r.emoji].hasReacted = true;
      });
      return Object.entries(grouped);
  };

  const isDark = theme === "dark";
  const bgColor = isDark ? "bg-[#020617]" : "bg-[#f8fafc]";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const panelColor = isDark ? "bg-black/40 border-white/10" : "bg-white/60 border-slate-200";

  if (!mounted) return <div className="h-screen w-screen bg-black" />;

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
      <div className="relative z-50 p-4 md:p-6 flex justify-between items-center h-[80px] shrink-0">
          <button onClick={() => router.back()} className={cn("p-3 rounded-full border transition hover:scale-110 active:scale-95", panelColor)}><FaArrowLeft/></button>
          <div className="text-center">
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-lg">Hall of Fame</h1>
              <p className="text-[8px] md:text-[9px] opacity-60 font-mono tracking-[0.2em]">LEGENDS OF CROCWORK</p>
          </div>
          <div className="w-10"></div>
      </div>

      {/* MAIN CONTENT */}
      <main className="relative z-20 flex-1 overflow-y-auto custom-scrollbar p-4 pb-48"> 
          
          <div className="flex justify-center gap-4 mb-8">
              <div className={cn("px-4 py-2 rounded-full border flex items-center gap-2 text-xs font-bold shadow-lg backdrop-blur-md", panelColor)}>
                  <FaUsers className="text-cyan-400" />
                  <span>Total Members: {leaders.length}</span>
              </div>
          </div>

          {/* 🏆 PODIUM */}
          <div className="flex justify-center items-end gap-2 md:gap-6 mb-12 min-h-[220px]">
              {/* RANK 2 */}
              <div className="flex flex-col items-center w-24 order-1">
                  {top2 ? (
                      <>
                          <div className="mb-2 relative">
                              <div className="w-14 h-14 rounded-full border-2 border-slate-300 overflow-hidden shadow-lg">
                                  {top2.photoURL ? <img src={top2.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-2xl">👤</div>}
                              </div>
                              <div className="absolute -bottom-2 -right-2 bg-slate-300 text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white">2</div>
                          </div>
                          <div className="text-xs font-bold mb-1 w-full truncate text-center">{top2.name}</div>
                          <div className="text-[9px] font-mono opacity-60 mb-2">฿{top2.totalSpent?.toLocaleString()}</div>
                          <div className={cn("w-full h-24 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-500 border-t-4 border-slate-300 relative shadow-xl flex justify-center items-end pb-2", isLiteMode && "opacity-80")}>
                              <span className="text-2xl opacity-50">🥈</span>
                          </div>
                      </>
                  ) : <div className="h-24 w-full bg-white/5 rounded-t-2xl"/>}
              </div>
              {/* RANK 1 */}
              <div className="flex flex-col items-center w-32 z-10 -mb-2 order-2">
                  {top1 ? (
                      <>
                          <div className="mb-2 relative">
                              <FaCrown className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 text-4xl animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"/>
                              <div className="w-20 h-20 rounded-full border-4 border-yellow-400 overflow-hidden shadow-[0_0_40px_rgba(250,204,21,0.5)]">
                                  {top1.photoURL ? <img src={top1.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-yellow-900 flex items-center justify-center text-2xl">👤</div>}
                              </div>
                              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full border-2 border-white shadow-lg">1</div>
                          </div>
                          <div className="text-sm font-black mb-1 text-yellow-400 w-full truncate text-center">{top1.name}</div>
                          <div className="text-xs font-mono font-bold text-yellow-200 mb-2 drop-shadow-md">฿{top1.totalSpent?.toLocaleString()}</div>
                          <div className={cn("w-full h-36 rounded-t-2xl bg-gradient-to-t from-yellow-700 to-yellow-500 border-t-4 border-yellow-400 relative shadow-2xl flex justify-center items-end pb-4", isLiteMode && "opacity-90")}>
                              <span className="text-4xl opacity-80">👑</span>
                          </div>
                      </>
                  ) : <div className="h-36 w-full bg-white/5 rounded-t-2xl"/>}
              </div>
              {/* RANK 3 */}
              <div className="flex flex-col items-center w-24 order-3">
                  {top3 ? (
                      <>
                          <div className="mb-2 relative">
                              <div className="w-14 h-14 rounded-full border-2 border-orange-600 overflow-hidden shadow-lg">
                                  {top3.photoURL ? <img src={top3.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-orange-900 flex items-center justify-center text-2xl">👤</div>}
                              </div>
                              <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white">3</div>
                          </div>
                          <div className="text-xs font-bold mb-1 w-full truncate text-center">{top3.name}</div>
                          <div className="text-[9px] font-mono opacity-60 mb-2">฿{top3.totalSpent?.toLocaleString()}</div>
                          <div className={cn("w-full h-20 rounded-t-2xl bg-gradient-to-t from-orange-900 to-orange-600 border-t-4 border-orange-500 relative shadow-xl flex justify-center items-end pb-2", isLiteMode && "opacity-80")}>
                              <span className="text-2xl opacity-50">🥉</span>
                          </div>
                      </>
                  ) : <div className="h-20 w-full bg-white/5 rounded-t-2xl"/>}
              </div>
          </div>

          {/* 📜 RANK LIST */}
          <div className="max-w-2xl mx-auto space-y-2 pb-8">
              {rest.map((r) => {
                  const vip = getVipLabel(r.totalSpent || 0);
                  return (
                      <div key={r.id} className={cn("flex items-center p-2 rounded-xl border transition-all hover:scale-[1.01]", panelColor, user?.email === r.email ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "border-transparent")}>
                          <div className="w-8 font-black text-center opacity-50 font-mono italic">#{r.rank}</div>
                          <div className="w-10 h-10 rounded-full bg-black/30 overflow-hidden mx-2 border border-white/10 relative">
                              {r.photoURL ? <img src={r.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
                          </div>
                          <div className="flex-1">
                              <div className="font-bold text-sm flex items-center gap-2">
                                  {r.name}
                                  {r.vipLevel >= 5 && <FaStar className="text-[8px] text-yellow-400"/>}
                              </div>
                              <div className={cn("text-[9px] uppercase tracking-wider font-bold", vip.color)}>VIP: {vip.label}</div>
                          </div>
                          <div className="font-mono font-bold text-cyan-400 text-sm">฿{r.totalSpent?.toLocaleString()}</div>
                      </div>
                  )
              })}
          </div>

          {/* 💬 CHAT SECTION */}
          <div className="max-w-3xl mx-auto mt-8 pt-6 border-t border-white/10">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2"><FaCommentDots/> Community Lounge</h3>
              
              <div className={cn("h-[60vh] md:h-[500px] overflow-y-auto custom-scrollbar rounded-2xl p-4 mb-4 space-y-4 shadow-inner", isDark ? "bg-black/40" : "bg-white/40")}>
                  {comments.length === 0 ? <div className="text-center opacity-30 text-xs py-20">No messages yet. Start chatting!</div> : 
                    comments.map((c) => (
                      <div key={c.id} className={cn("flex gap-3 relative group", c.uid === user?.uid ? "flex-row-reverse" : "")}>
                          
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-black/50 shrink-0 border border-white/10 mt-1">
                              {c.photoURL ? <img src={c.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[10px]">👤</div>}
                          </div>

                          <div className={cn("max-w-[75%] flex flex-col", c.uid === user?.uid ? "items-end" : "items-start")}>
                              <div className={cn("flex items-center gap-2 text-[10px] mb-1 opacity-70", c.uid === user?.uid ? "flex-row-reverse" : "")}>
                                  <span className="font-bold">{c.user}</span>
                                  <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase border", VIP_TIERS.find(v => v.level === c.vipLevel)?.bg, VIP_TIERS.find(v => v.level === c.vipLevel)?.color)}>VIP {c.vipLevel}</span>
                              </div>
                              
                              <div className={cn("p-3 rounded-2xl text-sm relative shadow-md", c.uid === user?.uid ? "bg-cyan-600 text-white rounded-tr-none" : "bg-white/10 border border-white/5 rounded-tl-none")}>
                                  {c.type === 'text' && c.text}
                                  {c.type === 'image' && <img src={c.media} className="rounded-lg max-w-full cursor-pointer hover:brightness-110 transition" alt="attachment" onClick={() => setZoomedImage(c.media)} />}
                                  
                                  <div className="text-[9px] opacity-40 mt-1 text-right">{c.timestamp?.toDate ? c.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}</div>

                                  {c.reactions && c.reactions.length > 0 && (
                                      <div className="absolute -bottom-3 left-0 bg-black/80 rounded-full px-1.5 py-0.5 flex items-center -space-x-1 border border-white/10 cursor-pointer shadow-lg z-10">
                                          {getGroupedReactions(c.reactions).map(([emoji, data]:any) => (
                                              <div key={emoji} onClick={() => handleReaction(c.id, emoji)} className={cn("text-[10px] px-1.5 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition hover:scale-110", data.hasReacted ? "text-cyan-400" : "text-white")}>
                                                  <span>{emoji}</span>
                                                  <span className="font-bold opacity-70">{data.count}</span>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>

                              <div className={cn("flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity", c.uid === user?.uid ? "flex-row-reverse" : "")}>
                                  <div className="relative">
                                      {/* ✅ Simplified Reaction Button (Just the Smiley) */}
                                      <button onClick={() => setActiveReactionId(activeReactionId === c.id ? null : c.id)} className="text-gray-400 hover:text-yellow-400 p-1 rounded-full hover:bg-white/10 transition">
                                          <FaRegSmile className="text-sm"/>
                                      </button>
                                      <AnimatePresence>
                                          {activeReactionId === c.id && (
                                              <motion.div initial={{scale:0, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0, opacity:0}} className="absolute bottom-full left-0 mb-1 bg-gray-900 border border-white/10 rounded-xl p-2 flex gap-2 shadow-xl z-50 items-center">
                                                  {['👍','❤️','😂','🔥','😮','😢'].map(emoji => {
                                                      const isActive = c.reactions?.some((r:any) => r.uid === user?.uid && r.emoji === emoji);
                                                      return <button key={emoji} onClick={() => handleReaction(c.id, emoji)} className={cn("hover:scale-125 transition text-lg p-1 rounded", isActive && "bg-white/20")}>{emoji}</button>
                                                  })}
                                              </motion.div>
                                          )}
                                      </AnimatePresence>
                                  </div>

                                  {(user?.uid === c.uid || user?.email === "skizzkat@gmail.com") && (
                                      <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-white/10 transition text-xs"><FaTrash /></button>
                                  )}
                              </div>
                          </div>
                      </div>
                  ))}
                  <div ref={commentsEndRef} />
              </div>
              
              {/* INPUT AREA */}
              {user ? (
                  <div className={cn("p-3 rounded-2xl border relative transition-all focus-within:ring-1 focus-within:ring-cyan-500/50", panelColor)}>
                      {mediaPreview && (
                          <div className="flex items-center gap-3 mb-3 p-2 bg-black/20 rounded-xl border border-white/5">
                              <img src={mediaPreview} className="h-16 w-16 object-cover rounded-lg border border-white/10"/>
                              <button onClick={() => setMediaPreview(null)} className="text-red-500 ml-auto p-2 hover:bg-white/10 rounded-full transition"><FaTimes/></button>
                          </div>
                      )}

                      <div className="flex items-end gap-2">
                          <button onClick={() => setShowMainEmoji(!showMainEmoji)} className="p-2.5 text-yellow-400 hover:bg-white/10 rounded-full transition"><FaSmile className="text-lg"/></button>
                          <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-cyan-400 hover:bg-white/10 rounded-full transition"><FaImage className="text-lg"/></button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                          
                          <textarea 
                              value={newComment} 
                              onChange={(e) => setNewComment(e.target.value)} 
                              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) handlePostComment(e); }}
                              placeholder="Type a message..." 
                              className="flex-1 bg-transparent outline-none text-sm py-3 px-2 resize-none h-11 max-h-32 custom-scrollbar placeholder:opacity-30"
                          />
                          
                          <button onClick={handlePostComment} disabled={isSubmitting || (!newComment.trim() && !mediaPreview)} className="p-2.5 bg-cyan-600 text-white rounded-full hover:scale-110 transition shadow-lg disabled:opacity-50 disabled:scale-100 w-10 h-10 flex items-center justify-center">
                              <FaPaperPlane className="text-sm ml-0.5" />
                          </button>
                      </div>

                      <AnimatePresence>
                          {showMainEmoji && (
                              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/10">
                                  <EmojiPicker onEmojiClick={handleEmojiClick} theme={isDark ? "dark" : "light" as any} width={320} height={350} searchDisabled={false} />
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
              ) : (
                  <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 text-sm opacity-60 cursor-pointer hover:opacity-100 transition hover:bg-white/10" onClick={() => router.push('/login')}>
                      <div className="text-2xl mb-2">🔒</div>
                      Login to join the conversation
                  </div>
              )}
          </div>
      </main>

      {/* ✅ LIGHTBOX ZOOM */}
      <AnimatePresence>
        {zoomedImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="relative max-w-full max-h-full">
                    <img src={zoomedImage} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Zoomed" />
                    <button className="absolute -top-12 right-0 text-white text-3xl opacity-50 hover:opacity-100 transition"><FaTimes/></button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* STICKY RANK BAR */}
      {user && myRank && (
          <div className="fixed bottom-0 w-full p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-[100]">
              <div className={cn("max-w-2xl mx-auto p-3 rounded-2xl shadow-2xl flex items-center border relative overflow-hidden", isDark ? "bg-gray-900 border-cyan-500/50" : "bg-white border-cyan-200")}>
                  {myRank <= 3 && <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />}
                  <div className="mr-3 text-center min-w-[40px]">
                      <div className="text-[8px] uppercase opacity-60">Rank</div>
                      <div className="text-2xl font-black italic text-cyan-500">#{myRank}</div>
                  </div>
                  <div className="flex-1">
                      <div className="font-bold text-sm">{user.displayName}</div>
                      <div className="text-[10px] text-green-400 font-bold">{getMotivationalMessage(myRank)}</div>
                  </div>
                  <button onClick={() => router.push('/services')} className="bg-cyan-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:scale-105 transition z-10 relative">BOOST</button>
              </div>
          </div>
      )}
    </div>
  );
}