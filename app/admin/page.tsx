"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, deleteDoc, onSnapshot, orderBy, limit, Timestamp
} from "firebase/firestore";
import MagicBackground from "../../components/MagicBackground";

const ADMIN_EMAIL = "skizzkat@gmail.com"; 

const VIP_TIERS = [
  { level: 10, min: 200000 }, { level: 9, min: 150000 }, { level: 8, min: 125000 },
  { level: 7, min: 100000 }, { level: 6, min: 80000 }, { level: 5, min: 50000 },
  { level: 4, min: 30000 }, { level: 3, min: 10000 }, { level: 2, min: 4000 },
  { level: 1, min: 1000 }, { level: 0, min: 0 },
];

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  
  // 🆕 Edit Transaction State
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editTransNote, setEditTransNote] = useState("");
  const [editTransSlip, setEditTransSlip] = useState<string | null>(null);
  const [editTransWork, setEditTransWork] = useState<string | null>(null);
  
  // CRUD State (User/New Trans)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState(""); 
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState(""); 
  const [loading, setLoading] = useState(false);

  // 📷 Images State (New Trans)
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [workPreview, setWorkPreview] = useState<string | null>(null);
  
  // Refs
  const slipInputRef = useRef<HTMLInputElement>(null);
  const workInputRef = useRef<HTMLInputElement>(null);
  const editTransSlipRef = useRef<HTMLInputElement>(null);
  const editTransWorkRef = useRef<HTMLInputElement>(null);

  // Security & Fetch Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else if (user.email !== ADMIN_EMAIL) { alert("⛔ Access Denied"); router.push("/dashboard"); }
      else setIsAuthorized(true);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;
    const qUsers = query(collection(db, "users"), orderBy("lastUpdated", "desc"));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data); setFilteredUsers(data);
    });
    return () => unsubUsers();
  }, [isAuthorized]);

  useEffect(() => {
    if (!searchQuery) setFilteredUsers(users);
    else {
      const lowerQ = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => 
        (u.name && u.name.toLowerCase().includes(lowerQ)) || 
        (u.realName && u.realName.toLowerCase().includes(lowerQ)) ||
        (u.nickname && u.nickname.toLowerCase().includes(lowerQ)) ||
        (u.phone && u.phone.includes(lowerQ)) ||
        (u.email && u.email.toLowerCase().includes(lowerQ))
      ));
    }
  }, [searchQuery, users]);

  const calculateVIP = (total: number) => VIP_TIERS.find(t => total >= t.min)?.level || 0;
  const totalRevenue = users.reduce((acc, curr) => acc + (curr.totalSpent || 0), 0);

  // --- FILE HANDLER ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setPreview: Function) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
         alert("File too large (Max 5MB)"); return; 
      }
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- CRUD LOGIC (User/New Trans) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const amountVal = Number(formAmount);
    const timestamp = formDate ? Timestamp.fromDate(new Date(formDate)) : serverTimestamp();

    try {
      if (isEditMode && editId) {
        const newVIP = calculateVIP(amountVal);
        await updateDoc(doc(db, "users", editId), {
          name: formName, email: formEmail, totalSpent: amountVal, vipLevel: newVIP, lastUpdated: serverTimestamp()
        });
        alert(`✅ Updated Customer: ${formName}`);
        cancelEdit();
      } else {
        let userId = ""; let newTotal = 0; let newVIP = 0;
        const q = query(collection(db, "users"), where("email", "==", formEmail));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const userDoc = snap.docs[0]; userId = userDoc.id; const oldData = userDoc.data();
          newTotal = (oldData.totalSpent || 0) + amountVal; newVIP = calculateVIP(newTotal);
          await updateDoc(doc(db, "users", userId), { 
              totalSpent: newTotal, vipLevel: newVIP, lastUpdated: serverTimestamp() 
          });
        } else {
          newTotal = amountVal; newVIP = calculateVIP(newTotal);
          const newUserRef = await addDoc(collection(db, "users"), { 
              name: formName, realName: formName, email: formEmail, totalSpent: newTotal, vipLevel: newVIP, joinedAt: serverTimestamp(), lastUpdated: serverTimestamp() 
          });
          userId = newUserRef.id;
        }

        await addDoc(collection(db, "transactions"), { 
            userId: userId, userName: formName, amount: amountVal, note: formNote || "เติมเงิน", 
            timestamp: timestamp, adminEmail: auth.currentUser?.email,
            paymentSlip: slipPreview,
            workImage: workPreview
        });
        
        alert(`✅ Transaction & Images Saved`);
        resetForm();
      }
    } catch (err) { alert("Error: " + err); }
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if(confirm(`⚠️ Are you sure you want to DELETE user: ${name}?\nThis cannot be undone.`)) {
      try { await deleteDoc(doc(db, "users", id)); } catch(e) { alert("Error deleting: " + e); }
    }
  }

  const startEdit = (user: any) => {
    setIsEditMode(true); setEditId(user.id); setFormName(user.name); setFormEmail(user.email || "");
    setFormAmount(user.totalSpent); setFormNote("Manual Update via Admin"); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setIsEditMode(false); setEditId(null); resetForm(); };
  const resetForm = () => { 
    setFormName(""); setFormEmail(""); setFormAmount(""); setFormNote(""); setFormDate(""); 
    setSlipPreview(null); setWorkPreview(null); 
  };

  const openUserDetail = async (user: any) => {
    setSelectedUser(user);
    const q = query(collection(db, "transactions"), where("userId", "==", user.id), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    const history = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSelectedUser({ ...user, history }); setShowModal(true);
  };

  // ✅ New Function: Open Edit Transaction Modal
  const openEditTransaction = (trans: any) => {
    setEditingTransaction(trans);
    setEditTransNote(trans.note || "");
    setEditTransSlip(trans.paymentSlip || null);
    setEditTransWork(trans.workImage || null);
  };

  // ✅ New Function: Save Transaction Update
  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "transactions", editingTransaction.id), {
        note: editTransNote,
        paymentSlip: editTransSlip,
        workImage: editTransWork
      });
      
      // Update local state (refresh list in modal)
      const updatedHistory = selectedUser.history.map((h: any) => 
        h.id === editingTransaction.id 
          ? { ...h, note: editTransNote, paymentSlip: editTransSlip, workImage: editTransWork } 
          : h
      );
      setSelectedUser({ ...selectedUser, history: updatedHistory });
      
      alert("✅ Transaction Updated!");
      setEditingTransaction(null); // Close Edit Modal
    } catch (error: any) {
      alert("Error updating: " + error.message);
    }
    setLoading(false);
  };

  const InfoRow = ({ label, value, copy = false }: any) => (
    <div className="flex flex-col pb-3 border-b border-[#d4af37]/10 last:border-0 last:pb-0">
      <span className="text-[10px] uppercase opacity-50 text-[#d4af37] tracking-widest">{label}</span>
      <div className="flex items-center justify-between">
         <span className="font-medium text-gray-800 dark:text-[#e5e5e5] text-sm break-all">{value || "-"}</span>
         {copy && value && (
           <button onClick={() => navigator.clipboard.writeText(value)} className="text-[10px] opacity-30 hover:opacity-100 hover:text-[#d4af37]">COPY</button>
         )}
      </div>
    </div>
  );

  if (!isAuthorized) return <MagicBackground><div className="flex h-screen justify-center items-center text-[#d4af37] animate-pulse">🔒 Security Check...</div></MagicBackground>;

  return (
    <MagicBackground>
      <div className="container mx-auto p-4 md:p-8">
        
        <div className="mb-10 text-center md:text-left">
           <p className="font-serif text-3xl md:text-4xl text-gray-800 dark:text-[#e5e5e5] mb-2 transition-colors">
             Welcome Back, <span className="text-[#d4af37] italic">SkizzKat</span>
           </p>
           <p className="text-sm tracking-widest uppercase opacity-60 text-[#d4af37]">Super Admin Dashboard</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <StatCard title="Total Revenue" value={`฿${totalRevenue.toLocaleString()}`} icon="💰" />
          <StatCard title="Total Customers" value={`${users.length}`} icon="👥" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT: FORM --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`backdrop-blur-xl p-8 rounded-[2rem] border shadow-lg transition-all duration-500
                ${isEditMode ? 'bg-red-50 dark:bg-[#2a1c05]/90 border-red-500/30' : 'bg-white/80 dark:bg-[#121212]/80 border-[#d4af37]/20'}
            `}>
               <h2 className={`font-serif text-2xl mb-6 flex items-center gap-3 ${isEditMode ? 'text-red-500 dark:text-red-400' : 'text-[#d4af37]'}`}>
                 <span className="text-xl">{isEditMode ? '✏️' : '✨'}</span> 
                 {isEditMode ? 'Edit Customer' : 'New Transaction'}
               </h2>
               
               <form onSubmit={handleSave} className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] uppercase opacity-50 ml-2 text-gray-700 dark:text-gray-400">Customer Name</label>
                   <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required 
                     className="w-full bg-white/50 dark:bg-[#000]/40 p-3 rounded-xl border border-gray-300 dark:border-[#d4af37]/10 focus:border-[#d4af37] outline-none text-gray-900 dark:text-[#e5e5e5] transition-colors" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase opacity-50 ml-2 text-gray-700 dark:text-gray-400">Email</label>
                    <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                     className="w-full bg-white/50 dark:bg-[#000]/40 p-3 rounded-xl border border-gray-300 dark:border-[#d4af37]/10 focus:border-[#d4af37] outline-none text-gray-900 dark:text-[#e5e5e5] transition-colors" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-[10px] uppercase opacity-50 ml-2 text-gray-700 dark:text-gray-400">{isEditMode ? 'Total Balance' : 'Add Amount'}</label>
                       <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} required 
                        className="w-full bg-white/50 dark:bg-[#000]/40 p-3 rounded-xl border border-gray-300 dark:border-[#d4af37]/10 focus:border-[#d4af37] outline-none font-mono text-lg text-[#d4af37] transition-colors" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] uppercase opacity-50 ml-2 text-gray-700 dark:text-gray-400">Note</label>
                       <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)}
                        className="w-full bg-white/50 dark:bg-[#000]/40 p-3 rounded-xl border border-gray-300 dark:border-[#d4af37]/10 focus:border-[#d4af37] outline-none text-sm text-gray-900 dark:text-[#e5e5e5] transition-colors" />
                    </div>
                 </div>

                 {/* 📷 UPLOAD SECTION (SLIP & WORK) */}
                 {!isEditMode && (
                   <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1 text-center cursor-pointer group" onClick={() => slipInputRef.current?.click()}>
                         <label className="text-[9px] uppercase opacity-50 text-gray-400 group-hover:text-[#d4af37]">🧾 Payment Slip</label>
                         <div className={`h-20 w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden
                            ${slipPreview ? 'border-[#d4af37]' : 'border-gray-600 hover:border-[#d4af37]'}
                         `}>
                            {slipPreview ? <img src={slipPreview} className="w-full h-full object-cover" /> : <span className="text-xl">➕</span>}
                         </div>
                         <input type="file" ref={slipInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setSlipPreview)} />
                      </div>

                      <div className="space-y-1 text-center cursor-pointer group" onClick={() => workInputRef.current?.click()}>
                         <label className="text-[9px] uppercase opacity-50 text-gray-400 group-hover:text-cyan-400">🎁 Finished Work</label>
                         <div className={`h-20 w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden
                            ${workPreview ? 'border-cyan-400' : 'border-gray-600 hover:border-cyan-400'}
                         `}>
                            {workPreview ? <img src={workPreview} className="w-full h-full object-cover" /> : <span className="text-xl">➕</span>}
                         </div>
                         <input type="file" ref={workInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setWorkPreview)} />
                      </div>
                   </div>
                 )}

                 {!isEditMode && (
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase opacity-50 ml-2 text-[#d4af37]">📅 Backdate (Optional)</label>
                      <input type="datetime-local" value={formDate} onChange={e => setFormDate(e.target.value)}
                       className="w-full bg-white/50 dark:bg-[#000]/40 p-3 rounded-xl border border-gray-300 dark:border-[#d4af37]/10 focus:border-[#d4af37] outline-none text-sm text-gray-600 dark:text-gray-400 font-mono transition-colors" />
                   </div>
                 )}

                 <div className="flex gap-2 pt-2">
                   <button type="submit" disabled={loading} 
                     className={`flex-1 py-4 rounded-xl font-bold shadow-lg transition-all uppercase tracking-wider text-sm
                     ${isEditMode 
                       ? 'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white border border-red-500/50 dark:bg-red-900/50 dark:text-red-200' 
                       : 'bg-gradient-to-r from-[#b45309] via-[#d4af37] to-[#b45309] text-white dark:text-black hover:shadow-[#d4af37]/30'}
                     `}>
                      {loading ? "Processing..." : (isEditMode ? "Save Changes" : "Confirm")}
                   </button>
                   
                   {isEditMode && (
                     <button type="button" onClick={cancelEdit} className="px-6 rounded-xl bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 font-bold border border-gray-300 dark:border-gray-700 transition-colors">
                       Cancel
                     </button>
                   )}
                 </div>
               </form>
            </div>
          </div>

          {/* --- RIGHT: TABLE --- */}
          <div className="lg:col-span-8">
            <div className="bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl rounded-[2rem] border border-[#d4af37]/20 shadow-xl overflow-hidden min-h-[600px] flex flex-col transition-all duration-500">
               <div className="p-6 border-b border-[#d4af37]/10">
                 <div className="bg-gray-100 dark:bg-[#000]/40 rounded-xl flex items-center px-4 border border-transparent focus-within:border-[#d4af37] transition-colors">
                    <span className="opacity-50 text-[#d4af37]">🔍</span>
                    <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                      className="w-full bg-transparent p-4 outline-none text-gray-900 dark:text-[#e5e5e5] transition-colors" />
                 </div>
               </div>
               <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-left min-w-[700px]">
                   <thead className="text-[10px] uppercase tracking-widest bg-[#d4af37]/10 text-[#d4af37]">
                     <tr>
                       <th className="p-5 pl-8">Customer</th>
                       <th className="p-5">Tier</th>
                       <th className="p-5 text-right">Spent</th>
                       <th className="p-5 text-center">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#d4af37]/10 text-gray-800 dark:text-[#e5e5e5]">
                     {filteredUsers.map(u => (
                       <tr key={u.id} className="hover:bg-[#d4af37]/5 transition group">
                         <td className="p-5 pl-8 cursor-pointer" onClick={() => openUserDetail(u)}>
                           <div className="font-bold text-lg font-serif group-hover:text-[#d4af37] transition-colors flex items-center gap-2">
                             {u.realName || u.name}
                             {u.realName && u.phone && <span className="text-[9px] bg-green-500/20 text-green-500 px-1 rounded">KYC</span>}
                           </div>
                           <div className="text-xs opacity-50 dark:opacity-40">{u.nickname ? `(${u.nickname}) ` : ""}{u.email}</div>
                         </td>
                         <td className="p-5"><span className="px-3 py-1 rounded-full text-[10px] font-bold border border-[#d4af37]/20 text-[#d4af37] bg-[#d4af37]/5">VIP {u.vipLevel}</span></td>
                         <td className="p-5 text-right font-mono text-[#d4af37] text-lg">{u.totalSpent?.toLocaleString()}</td>
                         <td className="p-5 text-center flex justify-center gap-2">
                           <button onClick={() => openUserDetail(u)} className="p-2 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">👁️</button>
                           <button onClick={() => startEdit(u)} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors">✏️</button>
                           <button onClick={() => handleDelete(u.id, u.name)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors">🗑️</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>

        {/* --- USER DETAIL MODAL --- */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/90 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div className="relative bg-white dark:bg-[#121212] border border-[#d4af37]/30 w-full max-w-4xl rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.1)] overflow-hidden flex flex-col md:flex-row max-h-[90vh] transition-colors duration-500" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 z-[110] w-8 h-8 flex items-center justify-center bg-black/20 text-white rounded-full hover:bg-red-500 transition-all backdrop-blur-md shadow-lg">✕</button>

              {/* LEFT: User Profile */}
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#000000] p-8 text-white relative md:w-1/3 flex flex-col items-center text-center border-r border-[#d4af37]/20">
                 <div className="w-32 h-32 rounded-full border-4 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.5)] overflow-hidden mb-6 bg-black flex items-center justify-center">
                    {selectedUser.photoURL ? <img src={selectedUser.photoURL} className="w-full h-full object-cover" /> : <span className="text-6xl">👨‍✈️</span>}
                 </div>
                 <h2 className="font-serif text-3xl font-black text-[#d4af37] mb-1">{selectedUser.nickname || selectedUser.name?.split(" ")[0]}</h2>
                 <p className="opacity-50 font-mono text-xs mb-6 break-all">{selectedUser.email}</p>
                 <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 p-4 rounded-2xl mb-6 text-center w-full">
                    <p className="text-[10px] uppercase tracking-widest text-[#d4af37]">Total Spending</p>
                    <p className="text-3xl font-mono font-bold text-white mt-1">฿{selectedUser.totalSpent?.toLocaleString()}</p>
                    <div className="mt-2 inline-block px-3 py-1 bg-[#d4af37] text-black text-xs font-bold rounded-full">VIP LEVEL {selectedUser.vipLevel}</div>
                 </div>
                 <div className="mt-auto opacity-40 text-[10px] font-mono space-y-1">
                    <div>UID: {selectedUser.id}</div>
                    <div>Joined: {selectedUser.joinedAt?.toDate().toLocaleDateString() || "N/A"}</div>
                 </div>
              </div>

              {/* RIGHT: Details */}
              <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#0a0a0a] transition-colors overflow-hidden">
                 <div className="p-8 pb-8 overflow-y-auto custom-scrollbar pt-12">
                    
                    <div className="mb-8">
                       <h3 className="font-bold mb-4 text-[#d4af37] text-xs uppercase tracking-widest">📝 Personal Info (KYC)</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-[#121212] p-5 rounded-2xl border border-gray-200 dark:border-[#333] shadow-sm">
                          <InfoRow label="Real Name" value={selectedUser.realName} copy />
                          <InfoRow label="Nickname" value={selectedUser.nickname} />
                          <InfoRow label="Phone" value={selectedUser.phone} copy />
                          <InfoRow label="Line ID" value={selectedUser.lineId} copy />
                          <InfoRow label="Birthday" value={selectedUser.birthDate} />
                          <div className="md:col-span-2"><InfoRow label="Address" value={selectedUser.address} copy /></div>
                       </div>
                    </div>

                    <div>
                       <h3 className="font-bold mb-4 text-[#d4af37] text-xs uppercase tracking-widest border-b border-[#d4af37]/10 pb-2">Transaction History</h3>
                       <table className="w-full text-sm">
                         <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                           {selectedUser.history && selectedUser.history.length > 0 ? (
                             selectedUser.history.map((h: any) => (
                               <tr key={h.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition group">
                                 <td className="py-3 opacity-50 text-xs font-mono text-gray-700 dark:text-gray-400">{h.timestamp?.toDate().toLocaleString('th-TH')}</td>
                                 <td className="py-3 font-medium px-4 text-gray-900 dark:text-[#e5e5e5]">
                                   {h.note}
                                   <div className="flex gap-2 mt-1">
                                     {h.paymentSlip && <a href={h.paymentSlip} target="_blank" className="text-[9px] bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded hover:bg-[#d4af37] hover:text-black transition">🧾 Slip</a>}
                                     {h.workImage && <a href={h.workImage} target="_blank" className="text-[9px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded hover:bg-cyan-500 hover:text-black transition">🎁 Work</a>}
                                   </div>
                                 </td>
                                 <td className="py-3 text-right text-[#d4af37] font-mono font-bold">+{h.amount.toLocaleString()}</td>
                                 {/* ✅ ปุ่มแก้ไขรายการเก่า */}
                                 <td className="py-3 text-right">
                                    <button onClick={() => openEditTransaction(h)} className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition">EDIT ✏️</button>
                                 </td>
                               </tr>
                             ))
                           ) : (<tr><td colSpan={4} className="py-10 text-center opacity-40 text-gray-500 dark:text-gray-400">No history found.</td></tr>)}
                         </tbody>
                       </table>
                    </div>

                 </div>
              </div>
            </div>
          </div>
        )}

        {/* --- 🛠️ EDIT TRANSACTION MODAL --- */}
        {editingTransaction && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setEditingTransaction(null)}>
             <div className="bg-[#1a1a1a] border border-[#d4af37]/50 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-serif text-[#d4af37] mb-6 flex items-center gap-2">🛠️ Edit Transaction</h3>
                
                <div className="space-y-4">
                   {/* Note Input */}
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase opacity-50 text-gray-400">Description</label>
                      <input type="text" value={editTransNote} onChange={e => setEditTransNote(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#d4af37] outline-none" />
                   </div>

                   {/* Slip Upload */}
                   <div className="space-y-1" onClick={() => editTransSlipRef.current?.click()}>
                      <label className="text-[10px] uppercase opacity-50 text-gray-400">🧾 Payment Slip (Update)</label>
                      <div className={`h-16 w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer
                         ${editTransSlip ? 'border-[#d4af37]' : 'border-gray-600 hover:border-[#d4af37]'}
                      `}>
                         {editTransSlip ? <img src={editTransSlip} className="w-full h-full object-cover" /> : <span className="text-sm text-gray-500">Click to upload slip</span>}
                      </div>
                      <input type="file" ref={editTransSlipRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setEditTransSlip)} />
                   </div>

                   {/* Work Upload */}
                   <div className="space-y-1" onClick={() => editTransWorkRef.current?.click()}>
                      <label className="text-[10px] uppercase opacity-50 text-gray-400">🎁 Finished Work (Update)</label>
                      <div className={`h-16 w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer
                         ${editTransWork ? 'border-cyan-400' : 'border-gray-600 hover:border-cyan-400'}
                      `}>
                         {editTransWork ? <img src={editTransWork} className="w-full h-full object-cover" /> : <span className="text-sm text-gray-500">Click to upload work</span>}
                      </div>
                      <input type="file" ref={editTransWorkRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setEditTransWork)} />
                   </div>

                   <div className="flex gap-3 pt-4">
                      <button onClick={() => setEditingTransaction(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/10">Cancel</button>
                      <button onClick={handleUpdateTransaction} disabled={loading} className="flex-1 py-3 rounded-xl bg-[#d4af37] text-black font-bold hover:bg-[#b45309]">
                         {loading ? "Saving..." : "Update Transaction"}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </MagicBackground>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-[#d4af37]/20 shadow-lg flex items-center gap-5 group hover:border-[#d4af37]/50 transition-all duration-500">
      <div className="text-4xl grayscale group-hover:grayscale-0 transition-all duration-500">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#d4af37] mb-1 opacity-70 group-hover:opacity-100">{title}</p>
        <p className="font-serif text-3xl font-black text-gray-900 dark:text-[#e5e5e5] group-hover:text-[#d4af37] transition-colors">{value}</p>
      </div>
    </div>
  );
}