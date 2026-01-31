"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import MagicBackground from "../../components/MagicBackground";

// --- 💎 VIP CONFIG (สูตรใหม่ตามที่ขอ) ---
const VIP_TIERS = [
  { level: 0, minSpend: 0, discount: 0 },
  { level: 1, minSpend: 1000, discount: 0.04 },  // 4%
  { level: 2, minSpend: 4000, discount: 0.10 },  // 10%
  { level: 3, minSpend: 10000, discount: 0.14 }, // 14%
  { level: 4, minSpend: 30000, discount: 0.18 }, // 18%
  { level: 5, minSpend: 50000, discount: 0.24 }, // 24%
  { level: 6, minSpend: 80000, discount: 0.28 }, // 28%
  { level: 7, minSpend: 100000, discount: 0.36 },// 36%
  { level: 8, minSpend: 125000, discount: 0.42 },// 42%
  { level: 9, minSpend: 150000, discount: 0.48 },// 48%
  { level: 10, minSpend: 200000, discount: 0.60 }// 60%
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ nickname: "", phone: "", address: "", lineId: "" });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals
  const [viewTransaction, setViewTransaction] = useState<any>(null);
  const [showVipModal, setShowVipModal] = useState(false); // ✅ State สำหรับเปิดดูตาราง VIP

  // --- 1. AUTH & DATA FETCHING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUser({ id: docSnap.id, ...userData });
          setEditData({
            nickname: userData.nickname || "",
            phone: userData.phone || "",
            address: userData.address || "",
            lineId: userData.lineId || ""
          });
          setPhotoPreview(userData.photoURL || null);

          const q = query(collection(db, "transactions"), where("userId", "==", currentUser.uid), orderBy("timestamp", "desc"));
          const historySnap = await getDocs(q);
          setHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          alert("ไม่พบข้อมูลสมาชิก กรุณาติดต่อ Admin");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // --- 2. LOGIC ---
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
         alert("ไฟล์รูปใหญ่เกินไปครับ (ขอไม่เกิน 5 MB)");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.id), {
        ...editData,
        photoURL: photoPreview,
        lastUpdated: serverTimestamp()
      });
      setUser({ ...user, ...editData, photoURL: photoPreview }); 
      setIsEditing(false);
      alert("บันทึกข้อมูลเรียบร้อยครับ! 📝");
    } catch (error: any) {
      if (error.code === 'permission-denied') {
         alert("บันทึกไม่สำเร็จ: รูปภาพอาจใหญ่เกินไปสำหรับฐานข้อมูล");
      } else {
         alert("เกิดข้อผิดพลาด: " + error.message);
      }
    }
  };

  // Logic คำนวณ Level และ Progress
  const currentLevel = user?.vipLevel || 0;
  // หา Tier ถัดไป (ที่มี minSpend มากกว่า spend ปัจจุบัน)
  const nextTier = VIP_TIERS.find(t => t.minSpend > (user?.totalSpent || 0));
  
  // คำนวณ % หลอดพลัง
  let progressPercent = 100;
  if (nextTier) {
    const prevTierSpend = VIP_TIERS[currentLevel]?.minSpend || 0;
    const gap = nextTier.minSpend - prevTierSpend;
    const currentProgress = (user?.totalSpent || 0) - prevTierSpend;
    progressPercent = Math.min(100, Math.max(0, (currentProgress / gap) * 100));
    
    // กรณี user spend ต่ำกว่า MinSpend ของ Level ปัจจุบัน (เช่น admin ปรับลด manual)
    if(user?.totalSpent < prevTierSpend) progressPercent = 0;
  }

  if (loading) return (
    <MagicBackground>
      <div className="flex flex-col h-screen justify-center items-center text-cyan-400 gap-4">
        <div className="text-4xl animate-bounce">🦈</div>
        <p className="animate-pulse tracking-widest uppercase text-xs">Sonar Scanning...</p>
      </div>
    </MagicBackground>
  );

  return (
    <MagicBackground>
      <div className="container mx-auto p-4 md:p-8 max-w-5xl">
        
        {/* --- HEADER --- */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-cyan-400 overflow-hidden bg-black/50 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
               {user.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-2xl">👨‍✈️</div>
               )}
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                Ahoy, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">{user.nickname || user.name}</span>
              </h1>
              <p className="text-cyan-200/60 text-xs uppercase tracking-[0.3em] mt-1">Captain's Bridge</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="px-5 py-2.5 rounded-full border border-red-500 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            Abandon Ship
          </button>
        </header>

        {/* --- DASHBOARD GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. VIP CARD (Left Column) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Holographic Card */}
            <div className="relative overflow-hidden rounded-[2rem] p-6 border border-cyan-500/30 bg-gradient-to-br from-[#002b36]/90 to-[#000]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(8,145,178,0.2)] group">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
               
               <div className="flex justify-between items-start mb-8">
                 <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-2xl border border-cyan-400/50">
                   👑
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] text-cyan-400 uppercase tracking-widest">Member ID</p>
                   <p className="font-mono text-xs text-white/50">{user.id.slice(0, 8)}...</p>
                 </div>
               </div>

               <div className="mb-2">
                 <p className="text-sm text-gray-400 uppercase tracking-widest">Total Contribution</p>
                 <p className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                   ฿{user.totalSpent?.toLocaleString()}
                 </p>
               </div>

               <div className="mt-6 pt-6 border-t border-white/10">
                 <div className="flex justify-between text-xs mb-2">
                   <span className="text-cyan-400 font-bold">VIP {currentLevel}</span>
                   {/* ✅ ปุ่มดูสิทธิพิเศษ */}
                   <button onClick={() => setShowVipModal(true)} className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-yellow-300 transition flex items-center gap-1">
                     🎁 View Privileges
                   </button>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/10 mt-2">
                   <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_currentColor]" style={{ width: `${progressPercent}%` }} />
                 </div>
                 
                 <p className="text-[10px] text-gray-500 text-right mt-1">
                    {nextTier ? `Next: VIP ${nextTier.level} (${nextTier.minSpend.toLocaleString()})` : "MAX LEVEL"}
                 </p>
               </div>
            </div>

            {/* Profile Info (Mini) */}
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-sm space-y-3">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="text-cyan-400 uppercase tracking-widest font-bold">Personal Data</h3>
                 <button onClick={() => setIsEditing(true)} className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition">EDIT</button>
               </div>
               <div className="flex justify-between border-b border-white/5 pb-2">
                 <span className="opacity-50">Real Name</span>
                 <span className="text-white">{user.realName}</span>
               </div>
               <div className="flex justify-between border-b border-white/5 pb-2">
                 <span className="opacity-50">Phone</span>
                 <span className="text-white">{user.phone}</span>
               </div>
               <div className="flex justify-between border-b border-white/5 pb-2">
                 <span className="opacity-50">Email</span>
                 <span className="text-white truncate max-w-[150px]">{user.email}</span>
               </div>
               <div className="pt-1">
                 <p className="opacity-50 mb-1">Shipping Address</p>
                 <p className="text-white/80 text-xs leading-relaxed">{user.address || "-"}</p>
               </div>
            </div>

          </div>

          {/* 2. HISTORY TABLE */}
          <div className="lg:col-span-2">
            <div className="bg-[#001219]/80 backdrop-blur-2xl rounded-[2rem] border border-cyan-500/20 shadow-2xl overflow-hidden h-full flex flex-col min-h-[500px]">
              
              <div className="p-6 border-b border-cyan-500/10 flex justify-between items-center bg-black/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-cyan-400">📜</span> Mission Log
                </h2>
                <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20">
                  {history.length} Records
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[10px] uppercase tracking-widest text-cyan-500/60 border-b border-white/5">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Mission</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-center">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {history.length > 0 ? (
                      history.map((h) => (
                        <tr key={h.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group cursor-pointer" onClick={() => setViewTransaction(h)}>
                          <td className="p-4 font-mono opacity-60 text-xs">
                            {h.timestamp?.toDate().toLocaleDateString('th-TH')} <br/>
                            <span className="text-[9px] opacity-50">{h.timestamp?.toDate().toLocaleTimeString('th-TH')}</span>
                          </td>
                          <td className="p-4 text-white group-hover:text-cyan-200 transition-colors">{h.note}</td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-400">+{h.amount.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className="text-xs bg-white/10 px-2 py-1 rounded text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition">VIEW</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="p-10 text-center text-white/30 italic">No missions found...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

        </div>

        {/* --- MODAL 1: EDIT PROFILE --- */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)}>
            <div className="bg-[#0f172a] border border-cyan-500/30 p-8 rounded-3xl w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">📝 Edit Profile</h3>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                
                <div className="flex flex-col items-center mb-6">
                   <div className="relative w-24 h-24 rounded-full border-2 border-cyan-500 overflow-hidden bg-black/50 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">👨‍✈️</div>
                      )}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-white text-xs font-bold">CHANGE</span>
                      </div>
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                   <p className="text-[10px] text-gray-500 mt-2">Click to upload (Max 5MB)</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase text-cyan-500">Nickname</label>
                  <input type="text" value={editData.nickname} onChange={e => setEditData({...editData, nickname: e.target.value})} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none" required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase text-cyan-500">Phone</label>
                  <input type="tel" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value.replace(/[^0-9]/g, "")})} maxLength={10}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none" required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase text-cyan-500">LINE ID</label>
                  <input type="text" value={editData.lineId} onChange={e => setEditData({...editData, lineId: e.target.value})} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase text-cyan-500">Address</label>
                  <textarea rows={3} value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-900/20">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.4)]">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL 2: TRANSACTION DETAIL (Slip & Work) --- */}
        {viewTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setViewTransaction(null)}>
            <div className="bg-[#001a2c] border border-cyan-500/50 p-0 rounded-3xl w-full max-w-4xl shadow-[0_0_50px_rgba(8,145,178,0.3)] relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
               
               <div className="p-6 border-b border-cyan-500/20 bg-gradient-to-r from-[#002b36] to-black flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">📂 Mission Report</h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">Date: {viewTransaction.timestamp?.toDate().toLocaleString('th-TH')}</p>
                  </div>
                  <button onClick={() => setViewTransaction(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500 transition">✕</button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="mb-6 p-4 rounded-xl bg-cyan-900/20 border border-cyan-500/20 flex justify-between items-center">
                     <div>
                       <p className="text-[10px] uppercase text-cyan-500 tracking-widest">Mission Name</p>
                       <p className="text-white font-medium text-lg">{viewTransaction.note}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-[10px] uppercase text-cyan-500 tracking-widest">Value</p>
                       <p className="text-emerald-400 font-mono font-bold text-2xl">+{viewTransaction.amount.toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">🧾 Payment Evidence</h4>
                        <div className="aspect-[3/4] bg-black/40 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden relative group">
                           {viewTransaction.paymentSlip ? (
                             <>
                               <img src={viewTransaction.paymentSlip} alt="Slip" className="w-full h-full object-contain" />
                               <a href={viewTransaction.paymentSlip} target="_blank" className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 text-xs text-white rounded-full opacity-0 group-hover:opacity-100 transition">🔍 Zoom</a>
                             </>
                           ) : (
                             <div className="text-center text-gray-500">
                               <div className="text-4xl mb-2">🚫</div>
                               <p className="text-xs">No Slip Uploaded</p>
                             </div>
                           )}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">🎁 Mission Output (Received)</h4>
                        <div className="aspect-[3/4] bg-black/40 rounded-2xl border-2 border-cyan-500/30 flex items-center justify-center overflow-hidden relative group">
                           {viewTransaction.workImage ? (
                             <>
                               <img src={viewTransaction.workImage} alt="Work" className="w-full h-full object-contain" />
                               <a href={viewTransaction.workImage} target="_blank" className="absolute bottom-4 right-4 bg-cyan-600 px-3 py-1 text-xs text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg">⬇ Download</a>
                             </>
                           ) : (
                             <div className="text-center text-gray-500">
                               <div className="text-4xl mb-2 animate-pulse">⏳</div>
                               <p className="text-xs">Mission in Progress...</p>
                               <p className="text-[10px] opacity-50">(Wait for admin update)</p>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- ✅ MODAL 3: VIP PRIVILEGES (เพิ่มมาใหม่) --- */}
        {showVipModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowVipModal(false)}>
             <div className="bg-[#0f172a] border border-[#d4af37]/30 w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-[#78350f] to-[#451a03] border-b border-[#d4af37]/20 flex justify-between items-center text-white shrink-0">
                   <div className="flex items-center gap-3">
                      <div className="text-3xl">💎</div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-[#fef3c7]">VIP Privileges</h3>
                        <p className="text-xs opacity-70 uppercase tracking-widest">Captain's Benefits</p>
                      </div>
                   </div>
                   <button onClick={() => setShowVipModal(false)} className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition">✕</button>
                </div>

                {/* List Content */}
                <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar">
                   {VIP_TIERS.slice(1).map((tier) => { // slice(1) เพื่อซ่อน Level 0 (ถ้าต้องการ)
                      const isCurrent = currentLevel === tier.level;
                      return (
                        <div key={tier.level} className={`p-4 rounded-xl border flex justify-between items-center transition-all duration-300
                           ${isCurrent 
                             ? 'bg-[#d4af37]/20 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.3)] scale-105 relative z-10' 
                             : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100 hover:bg-white/10'}
                        `}>
                           <div>
                              <p className={`font-bold text-sm ${isCurrent ? 'text-[#d4af37]' : 'text-white'}`}>
                                 VIP {tier.level} 
                                 {isCurrent && <span className="ml-2 text-[8px] bg-[#d4af37] text-black px-1.5 py-0.5 rounded font-bold">YOU</span>}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Min Spend: ฿{tier.minSpend.toLocaleString()}</p>
                           </div>
                           <div className="text-right">
                              <span className={`text-lg font-black font-mono ${isCurrent ? 'text-[#d4af37]' : 'text-gray-300'}`}>
                                 {(tier.discount * 100).toFixed(0)}%
                              </span>
                              <p className="text-[8px] uppercase tracking-widest opacity-50">Discount</p>
                           </div>
                        </div>
                      );
                   })}
                </div>

             </div>
          </div>
        )}

      </div>
    </MagicBackground>
  );
}