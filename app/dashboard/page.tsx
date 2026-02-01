"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { auth, db } from "../../lib/firebase"; 
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
// เพิ่ม import สำหรับ Storage (อัปโหลดรูป)
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { motion, AnimatePresence } from "framer-motion";

// --- IMPORTS FROM LANDING PAGE ---
import { SnowBackground } from "@/components/SnowBackground";
import { UnderwaterBackground } from "@/components/UnderwaterBackground";

// --- CONSTANTS (VIP TIERS) ---
// ตารางส่วนลดตามยอดสะสม (ยอดเต็มที่แอดมินกรอก)
const VIP_TIERS = [
  { level: 0, minSpend: 0, discount: 0 },
  { level: 1, minSpend: 1000, discount: 0.04 },  
  { level: 2, minSpend: 4000, discount: 0.10 }, 
  { level: 3, minSpend: 10000, discount: 0.14 }, 
  { level: 4, minSpend: 30000, discount: 0.18 }, 
  { level: 5, minSpend: 50000, discount: 0.24 }, 
  { level: 6, minSpend: 80000, discount: 0.28 }, 
  { level: 7, minSpend: 100000, discount: 0.36 },
  { level: 8, minSpend: 125000, discount: 0.42 },
  { level: 9, minSpend: 150000, discount: 0.48 },
  { level: 10, minSpend: 200000, discount: 0.60 }
];

// --- UTILITIES ---
const cn = (...classes: (string | undefined | null | boolean)[]) => 
  classes.filter(Boolean).join(" ");

// --- COMPONENTS ---

// 1. Top Right Controls
const TopRightControls = ({ scene, setScene, theme, setTheme, isLite, toggleLite, goHome }: any) => {
  const isDark = theme === "dark";
  const btnBase = "relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 backdrop-blur-sm border";
  
  const getBtnStyle = (isActive: boolean, activeColor: string) => cn(
    btnBase,
    isActive 
      ? `${activeColor} text-white border-transparent shadow-lg scale-105` 
      : isDark 
        ? "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white" 
        : "bg-black/5 border-black/10 text-black/50 hover:bg-black/10 hover:text-black"
  );

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring" }}
      className="fixed top-6 right-6 z-[50] flex items-center gap-3"
    >
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-full border shadow-2xl backdrop-blur-xl",
        isDark ? "bg-[#0f172a]/60 border-white/10" : "bg-white/60 border-slate-200"
      )}>
        <button onClick={goHome} className={getBtnStyle(false, "")} title="services">🏠</button>
        <div className="w-[1px] h-5 bg-current opacity-10 mx-1" />
        <div className="flex gap-1">
          <button onClick={() => setScene('underwater')} className={getBtnStyle(scene === 'underwater', "bg-cyan-500 shadow-cyan-500/50")}>🌊</button>
          <button onClick={() => setScene('snow')} className={getBtnStyle(scene === 'snow', "bg-blue-600 shadow-blue-600/50")}>❄️</button>
        </div>
        <div className="w-[1px] h-5 bg-current opacity-10 mx-1" />
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={getBtnStyle(false, "")}>{isDark ? "☀️" : "🌙"}</button>
        <button onClick={toggleLite} className={cn("px-3 h-9 rounded-full flex items-center gap-2 transition-all duration-300 font-bold text-[10px] tracking-widest uppercase border", isLite ? "bg-yellow-400 border-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)]" : isDark ? "bg-white/5 border-white/10 text-white/40 hover:text-white" : "bg-black/5 border-black/10 text-black/40 hover:text-black")}>
          <span>LITE</span>
          <div className={cn("w-1.5 h-1.5 rounded-full", isLite ? "bg-black animate-pulse" : "bg-current opacity-30")} />
        </button>
      </div>
    </motion.div>
  );
};

// 2. Generic Modal
const Modal = ({ isOpen, onClose, title, children, isDark }: any) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className={cn(
            "relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col",
            isDark ? "bg-[#0f172a] border border-cyan-500/30 text-white" : "bg-white border-white text-slate-900"
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-transparent via-white/5 to-transparent">
            <h3 className="font-serif text-2xl font-bold">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors">✕</button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// 3. Stat Card
const StatCard = ({ icon, label, value, subValue, delay, isDark }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay, type: "spring" }}
    className={cn(
      "relative overflow-hidden rounded-2xl p-5 border group hover:scale-[1.02] transition-transform duration-300",
      isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white/60 border-black/5 hover:bg-white/80"
    )}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2 rounded-lg text-xl", isDark ? "bg-cyan-500/20 text-cyan-300" : "bg-cyan-100 text-cyan-700")}>{icon}</div>
      <div className={cn("text-[9px] uppercase tracking-widest font-bold opacity-50", isDark ? "text-white" : "text-black")}>{label}</div>
    </div>
    <div className={cn("text-2xl font-bold font-serif", isDark ? "text-white" : "text-slate-900")}>{value}</div>
    {subValue && <div className={cn("text-xs mt-1 font-mono", isDark ? "text-cyan-400" : "text-cyan-600")}>{subValue}</div>}
  </motion.div>
);

// 4. Menu Button
const MenuButton = ({ icon, title, desc, onClick, variant = "normal", isDark }: any) => (
  <button onClick={onClick} className={cn("w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 group text-left", variant === "danger" ? "bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40" : isDark ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-cyan-500/30" : "bg-white/50 border-black/5 hover:bg-white hover:border-cyan-500/30")}>
    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg transition-transform group-hover:scale-110", variant === "danger" ? "bg-red-500/20 text-red-400" : isDark ? "bg-white/5 text-cyan-300" : "bg-black/5 text-slate-700")}>{icon}</div>
    <div className="flex-1">
      <h3 className={cn("text-sm font-bold uppercase tracking-wide", variant === "danger" ? "text-red-400" : isDark ? "text-white" : "text-slate-900")}>{title}</h3>
      <p className={cn("text-[10px] opacity-60", variant === "danger" ? "text-red-300" : isDark ? "text-gray-400" : "text-gray-600")}>{desc}</p>
    </div>
    <div className={cn("text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all", variant === "danger" ? "text-red-400" : "text-cyan-500")}>➜</div>
  </button>
);

// --- MAIN PAGE ---

export default function DashboardPage() {
  const router = useRouter();

  // System State
  const [scene, setScene] = useState<"underwater" | "snow">("underwater");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // User Data State
  const [userData, setUserData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Modals State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPrivileges, setShowPrivileges] = useState(false);
  
  // 🆕 Image Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State & Upload
  const [editForm, setEditForm] = useState({ realName: "", nickname: "", phone: "", address: "", lineId: "" });
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null); // สำหรับเก็บไฟล์รูปใหม่
  const [previewProfileUrl, setPreviewProfileUrl] = useState<string | null>(null); // สำหรับพรีวิวรูปก่อนเซฟ
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // VIP Logic (Calculated from Total Spent - Full Amount)
  const vipStatus = useMemo(() => {
    const spent = userData?.totalSpent || 0;
    const currentTier = [...VIP_TIERS].reverse().find(t => spent >= t.minSpend) || VIP_TIERS[0];
    const nextTier = VIP_TIERS.find(t => t.minSpend > spent);
    const needed = nextTier ? nextTier.minSpend - spent : 0;
    return {
      currentLevel: currentTier.level,
      currentDiscount: (currentTier.discount * 100).toFixed(0),
      nextLevel: nextTier ? nextTier.level : "MAX",
      needed: needed,
    };
  }, [userData?.totalSpent]);

  // Auth & Fetch Data
  useEffect(() => {
    const savedScene = localStorage.getItem("croc_scene");
    const savedTheme = localStorage.getItem("croc_theme");
    const savedLite = localStorage.getItem("croc_lite_mode");

    if (savedScene) setScene(savedScene as any);
    if (savedTheme) setTheme(savedTheme as any);
    if (savedLite) setIsLiteMode(savedLite === "true");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get User Data
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({ ...data, uid: user.uid });
            setEditForm({
              realName: data.realName || "",
              nickname: data.nickname || "",
              phone: data.phone || "",
              address: data.address || "",
              lineId: data.lineId || ""
            });
          }
          // Get History
          const q = query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
          const historySnap = await getDocs(q);
          setHistory(historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Data error:", error);
        } finally {
          setLoading(false);
          setMounted(true);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Actions
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const toggleLiteMode = () => {
    setIsLiteMode(prev => {
      const newVal = !prev;
      localStorage.setItem("croc_lite_mode", String(newVal));
      return newVal;
    });
  };

  // 🆕 Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewProfileImage(file);
      setPreviewProfileUrl(URL.createObjectURL(file)); // สร้าง URL ชั่วคราวเพื่อแสดงผล
    }
  };

  // 🆕 Update Profile (with Image Upload)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.uid) return;
    setSaving(true);
    try {
      let photoURL = userData.photoURL;

      // ถ้ามีการเลือกรูปใหม่ ให้อัปโหลดไป Firebase Storage
      if (newProfileImage) {
        const storage = getStorage(); // เรียกใช้ Storage
        const storageRef = ref(storage, `profile_images/${userData.uid}/${Date.now()}_${newProfileImage.name}`);
        await uploadBytes(storageRef, newProfileImage);
        photoURL = await getDownloadURL(storageRef); // ได้ URL รูปใหม่มา
      }

      // อัปเดตข้อมูลใน Firestore
      await updateDoc(doc(db, "users", userData.uid), { 
        ...editForm,
        photoURL: photoURL 
      });

      setUserData({ ...userData, ...editForm, photoURL });
      setShowEditProfile(false);
      setNewProfileImage(null); // Reset
      alert("✅ Profile updated!");
    } catch (error) { 
      console.error(error);
      alert("Update failed"); 
    }
    setSaving(false);
  };

  if (!mounted) return null;
  const isDark = theme === "dark";

  return (
    <div className={cn("min-h-[100dvh] w-screen overflow-x-hidden relative flex flex-col items-center p-4 lg:p-10 transition-colors duration-500", isDark ? "bg-[#020617] text-white" : "bg-slate-50 text-slate-900")}>
      
      {/* Background Logic */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {!isLiteMode ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
              {scene === "underwater" && <UnderwaterBackground intensity={0.5} speed={0.2} />}
              {scene === "snow" && <SnowBackground count={50} intensity={0.4} speed={0.3} />}
          </motion.div>
        ) : (
          <div className={cn("absolute inset-0 transition-colors duration-500", isDark ? (scene === "underwater" ? "bg-gradient-to-b from-[#001a2c] to-[#000]" : "bg-gradient-to-b from-[#0f172a] to-[#000]") : "bg-gradient-to-b from-slate-100 to-white")} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_0%,rgba(0,0,0,0.8)_100%)] z-1" />
      </div>

      <TopRightControls scene={scene} setScene={(s:any) => { setScene(s); localStorage.setItem("croc_scene", s); }} theme={theme} setTheme={(t:any) => { setTheme(t); localStorage.setItem("croc_theme", t); }} isLite={isLiteMode} toggleLite={toggleLiteMode} goHome={() => router.push("/services")} />

      <div className="relative z-10 w-full max-w-5xl mx-auto pt-16 lg:pt-12">
        
        {/* Header Profile */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-6">
            <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl border overflow-hidden", isDark ? "bg-[#002b36] border-cyan-500/30 text-cyan-400" : "bg-white border-slate-200 text-slate-700")}>
              {userData?.photoURL ? <img src={userData.photoURL} className="w-full h-full object-cover"/> : "🦈"}
            </div>
            <div>
              <div className={cn("text-xs font-bold uppercase tracking-widest mb-1", isDark ? "text-cyan-500" : "text-cyan-700")}>Command Center</div>
              <h1 className="text-3xl md:text-4xl font-serif font-black">{userData?.nickname || userData?.realName || "Diver"}</h1>
              <p className={cn("text-sm mt-1 opacity-60", isDark ? "text-gray-300" : "text-gray-600")}>Level {vipStatus.currentLevel} • {userData?.email}</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
           <div className="flex items-center justify-center h-64"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="text-3xl">⚙️</motion.div></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard isDark={isDark} delay={0.1} icon="👑" label="VIP Level" value={`LVL ${vipStatus.currentLevel}`} subValue={vipStatus.nextLevel !== "MAX" ? `Next: ฿${vipStatus.needed.toLocaleString()}` : "Max Level Reached"} />
                {/* Total Spent shows the accumulated amount (full price) */}
                <StatCard isDark={isDark} delay={0.2} icon="💎" label="Total Accumulated" value={`฿${(userData?.totalSpent || 0).toLocaleString()}`} subValue={`Current Discount: ${vipStatus.currentDiscount}%`} />
                <StatCard isDark={isDark} delay={0.3} icon="💰" label="Transactions" value={history.length} subValue="Total Hires" />
              </div>

              {/* Profile Card */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className={cn("p-8 rounded-3xl border backdrop-blur-md shadow-xl", isDark ? "bg-[#001a2c]/60 border-white/10" : "bg-white/80 border-slate-200")}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold font-serif uppercase tracking-wider">My Profile (KYC)</h3>
                   <button onClick={() => setShowEditProfile(true)} className="text-xs text-cyan-500 hover:text-cyan-400 font-bold uppercase tracking-widest border border-cyan-500/30 px-3 py-1 rounded-full hover:bg-cyan-500/10 transition-colors">Edit Profile ✏️</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  {[ { l: "Real Name", v: userData?.realName }, { l: "Nickname", v: userData?.nickname }, { l: "Phone", v: userData?.phone }, { l: "Line ID", v: userData?.lineId }, { l: "Address", v: userData?.address }, { l: "Email", v: userData?.email } ].map((item, i) => (
                    <div key={i} className="group">
                      <div className={cn("text-[10px] uppercase tracking-widest opacity-40 mb-1", isDark ? "text-white" : "text-black")}>{item.l}</div>
                      <div className={cn("font-medium border-b pb-2 transition-colors", isDark ? "border-white/5 group-hover:border-cyan-500/50" : "border-black/5 group-hover:border-cyan-500/50")}>{item.v || "-"}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="space-y-4">
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="flex flex-col gap-3">
                 <div className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 pl-2">System Menu</div>
                 <MenuButton isDark={isDark} icon="📜" title="History" desc="View slips & finished works" onClick={() => setShowHistory(true)} />
                 <MenuButton isDark={isDark} icon="⭐" title="Privileges" desc="View VIP Tiers & Discounts" onClick={() => setShowPrivileges(true)} />
                 {/* Removed Support Button as requested */}
                 <div className="h-4" /> 
                 <MenuButton isDark={isDark} variant="danger" icon="🛑" title="Sign Out" desc="End session" onClick={handleLogout} />
               </motion.div>
               
               {/* Promo Card */}
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-lg relative overflow-hidden group cursor-pointer" onClick={() => setShowPrivileges(true)}>
                 <div className="absolute top-0 right-0 p-3 opacity-20 text-6xl transform rotate-12 group-hover:scale-110 transition-transform">🦈</div>
                 <div className="relative z-10">
                   <div className="text-[10px] font-black uppercase bg-white/20 inline-block px-2 py-0.5 rounded mb-2">{vipStatus.currentLevel > 0 ? `VIP LEVEL ${vipStatus.currentLevel}` : "MEMBER"}</div>
                   <h3 className="font-bold text-lg leading-tight">Next Reward: {(vipStatus.nextLevel !== "MAX") ? `Level ${vipStatus.nextLevel}` : "Maxed Out!"}</h3>
                   <p className="text-xs opacity-80 mt-1 mb-3">{vipStatus.nextLevel !== "MAX" ? `Spend ฿${vipStatus.needed.toLocaleString()} more to unlock ${VIP_TIERS.find(t=>t.level === vipStatus.nextLevel)?.discount! * 100}% discount.` : "You are the king of the ocean!"}</p>
                   <div className="text-xs font-bold underline decoration-white/50 underline-offset-4 group-hover:decoration-white transition-all">View All Tiers &rarr;</div>
                 </div>
               </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL: EDIT PROFILE (Updated with Image Upload) --- */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile" isDark={isDark}>
         <form onSubmit={handleUpdateProfile} className="space-y-6">
            
            {/* Image Upload Section */}
            <div className="flex flex-col items-center gap-3">
               <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className={cn("w-24 h-24 rounded-full border-2 overflow-hidden", isDark ? "border-cyan-500/50" : "border-slate-200")}>
                    <img src={previewProfileUrl || userData?.photoURL || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
                 </div>
                 <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white font-bold">CHANGE</span>
                 </div>
               </div>
               <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
               <p className="text-[10px] opacity-50 uppercase">Click image to upload new</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-xs uppercase opacity-50">Real Name</label><input type="text" value={editForm.realName} onChange={e => setEditForm({...editForm, realName: e.target.value})} className={cn("w-full p-3 rounded-xl border bg-transparent outline-none", isDark ? "border-white/20 focus:border-cyan-500" : "border-black/10 focus:border-cyan-500")} /></div>
              <div className="space-y-1"><label className="text-xs uppercase opacity-50">Nickname</label><input type="text" value={editForm.nickname} onChange={e => setEditForm({...editForm, nickname: e.target.value})} className={cn("w-full p-3 rounded-xl border bg-transparent outline-none", isDark ? "border-white/20 focus:border-cyan-500" : "border-black/10 focus:border-cyan-500")} /></div>
              <div className="space-y-1"><label className="text-xs uppercase opacity-50">Phone</label><input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={cn("w-full p-3 rounded-xl border bg-transparent outline-none", isDark ? "border-white/20 focus:border-cyan-500" : "border-black/10 focus:border-cyan-500")} /></div>
              <div className="space-y-1"><label className="text-xs uppercase opacity-50">Line ID</label><input type="text" value={editForm.lineId} onChange={e => setEditForm({...editForm, lineId: e.target.value})} className={cn("w-full p-3 rounded-xl border bg-transparent outline-none", isDark ? "border-white/20 focus:border-cyan-500" : "border-black/10 focus:border-cyan-500")} /></div>
              <div className="md:col-span-2 space-y-1"><label className="text-xs uppercase opacity-50">Address</label><textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} rows={3} className={cn("w-full p-3 rounded-xl border bg-transparent outline-none", isDark ? "border-white/20 focus:border-cyan-500" : "border-black/10 focus:border-cyan-500")} /></div>
            </div>
            <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-cyan-500/30 transition-all">{saving ? "Saving..." : "Save Changes"}</button>
         </form>
      </Modal>

      {/* --- MODAL: HISTORY --- */}
      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title="Transaction History" isDark={isDark}>
         <div className="space-y-4">
            {history.length === 0 ? (<div className="text-center opacity-40 py-10">No transactions found.</div>) : (
               history.map((item, i) => (
                 <div key={i} className={cn("p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-start md:items-center", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200")}>
                    <div className="flex-1">
                       <div className="text-[10px] opacity-50 font-mono">{item.timestamp?.toDate().toLocaleString()}</div>
                       <div className="font-bold text-lg">{item.note}</div>
                       {/* Display the full amount (points) */}
                       <div className={cn("font-mono font-bold text-xl", isDark ? "text-emerald-400" : "text-emerald-600")}>+{Number(item.amount).toLocaleString()}</div>
                    </div>
                    {/* ✅ UPDATED: Buttons trigger modal preview instead of new tab */}
                    <div className="flex gap-2 w-full md:w-auto">
                       {item.paymentSlip ? (
                          <button onClick={() => setPreviewImage(item.paymentSlip)} className="flex-1 md:flex-none text-center text-xs bg-orange-500/10 text-orange-500 border border-orange-500/30 px-3 py-2 rounded-lg hover:bg-orange-500 hover:text-white transition-all">🧾 View Slip</button>
                       ) : <span className="text-xs opacity-30 px-3 py-2">No Slip</span>}
                       {item.workImage ? (
                          <button onClick={() => setPreviewImage(item.workImage)} className="flex-1 md:flex-none text-center text-xs bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 px-3 py-2 rounded-lg hover:bg-cyan-500 hover:text-white transition-all">🎁 View Work</button>
                       ) : <span className="text-xs opacity-30 px-3 py-2">No Work</span>}
                    </div>
                 </div>
               ))
            )}
         </div>
      </Modal>

      {/* --- MODAL: PRIVILEGES --- */}
      <Modal isOpen={showPrivileges} onClose={() => setShowPrivileges(false)} title="VIP Privileges" isDark={isDark}>
          <table className="w-full text-sm">
             <thead className={cn("text-[10px] uppercase tracking-widest border-b", isDark ? "border-white/10 text-gray-400" : "border-black/10 text-gray-500")}>
                <tr><th className="py-3 text-left">Level</th><th className="py-3 text-right">Min Spend</th><th className="py-3 text-right">Discount</th></tr>
             </thead>
             <tbody className="divide-y divide-white/10">
                {VIP_TIERS.map((tier) => (
                   <tr key={tier.level} className={cn("transition-colors", vipStatus.currentLevel === tier.level ? (isDark ? "bg-cyan-500/20 text-cyan-300" : "bg-cyan-100 text-cyan-700") : "")}>
                      <td className="py-3 font-bold px-2">{tier.level === 0 ? "MEMBER" : `VIP ${tier.level}`}{vipStatus.currentLevel === tier.level && <span className="ml-2 text-[9px] bg-cyan-500 text-black px-1 rounded">YOU</span>}</td>
                      <td className="py-3 text-right font-mono opacity-70">฿{tier.minSpend.toLocaleString()}</td>
                      <td className="py-3 text-right font-bold text-emerald-400">{(tier.discount * 100).toFixed(0)}% OFF</td>
                   </tr>
                ))}
             </tbody>
          </table>
      </Modal>

      {/* --- 🆕 IMAGE VIEWER MODAL (LIGHTBOX) --- */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
             {/* Close Button */}
             <button className="absolute top-5 right-5 text-white/50 hover:text-white text-4xl transition-colors z-[210]">&times;</button>
             
             {/* Image Container */}
             <motion.img 
               initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
               src={previewImage} 
               className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain border border-white/10"
               onClick={e => e.stopPropagation()} 
             />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}