"use client";

/**
 * 🛡️ CROCWORK ADMIN (V13.1 - Stability Fix)
 * - [FIX] Crash on t.edit: Added fallback logic for language dictionary (TEXT).
 * - [FIX] LocalStorage: Strict check for 'en'/'th' to prevent undefined state.
 * - [CORE] All V13.0 logic (Add/Delete/CSV/Graphs) retained.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { db, auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, 
  doc, updateDoc, deleteDoc, getDocs, where, getDoc, setDoc
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUser, FaMoneyBillWave, FaEdit, FaTrash, FaSearch, FaEye, 
  FaSignOutAlt, FaTimes, FaCamera, FaBriefcase, FaPlus, FaSave, FaCheckCircle, 
  FaAddressCard, FaPhone, FaLine, FaFacebook, FaStar, FaEnvelope, FaImages,
  FaChartPie, FaFilter, FaLayerGroup, FaChevronLeft, FaChevronRight, 
  FaFileCsv, FaChartLine, FaChartBar, FaBullhorn, FaCrown, FaCog, FaBars, FaChevronDown, FaHome, FaLock, FaLanguage
} from "react-icons/fa";

// ✅ IMPORT COMPONENTS
import { SnowBackground } from "@/components/SnowBackground";
import { UnderwaterBackground } from "@/components/UnderwaterBackground";

// --- UTILS ---
const cn = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(" ");

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement("img");
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.7)); 
            };
        };
    });
};

const ADMIN_EMAIL = "skizzkat@gmail.com"; 

const MY_CONTACT = {
    name: "Sarawut Phusee",
    facebook: "https://www.facebook.com/sarawut.phusee",
    line: "sxrx_wut18",
    email: "skizzkat@gmail.com",
    avatar: "/croc-mascot.jpg"
};

const ADMIN_CATEGORIES = [
  { id: "docs", name: "Documents & Forms" },
  { id: "art", name: "Art & Design" },
  { id: "web_dev", name: "Web & Coding" },
  { id: "iot", name: "Arduino & IoT" },
  { id: "video", name: "Video & Multimedia" },
  { id: "tech_support", name: "IT Support & Teach" },
];

const VIP_TIERS = [
  { level: 10, min: 200000 }, { level: 9, min: 150000 }, { level: 8, min: 125000 },
  { level: 7, min: 100000 }, { level: 6, min: 80000 }, { level: 5, min: 50000 },
  { level: 4, min: 30000 }, { level: 3, min: 10000 }, { level: 2, min: 4000 },
  { level: 1, min: 1000 }, { level: 0, min: 0 },
];

const calculateVIP = (t:number) => VIP_TIERS.find(x=>t>=x.min)?.level||0;

const INITIAL_PACKAGE = { name: "", price: 0, days: 3, revisions: 3, desc: "", features: "" };
const INITIAL_SERVICE_FORM = {
  title: "", category: "", images: [] as string[], description: "", rating: 0, reviewsCount: 0, reviews: [] as any[],
  packages: {
    basic: { ...INITIAL_PACKAGE, name: "Basic" },
    standard: { ...INITIAL_PACKAGE, name: "Standard" },
    premium: { ...INITIAL_PACKAGE, name: "Premium" }
  }
};

// --- LUXURY STYLES DEFINITION ---
const LUXURY = {
    dark: {
        bg: "bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#121212]",
        glass: "bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]",
        text: "text-gray-100",
        accent: "text-amber-400",
        button: "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-900/50",
    },
    light: {
        bg: "bg-gradient-to-br from-gray-50 via-white to-slate-100",
        glass: "bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]",
        text: "text-slate-800",
        accent: "text-blue-600",
        button: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30",
    }
};

// --- MULTI-LANGUAGE ---
const TEXT = {
    en: {
        dashboard: "Admin Dashboard", analytics: "Analytics", services: "Services", users: "Customers",
        transactions: "Transactions", search: "Search...", edit_log: "Edit Log", go_home: "Go Home",
        logout: "Logout", total_rev: "Total Revenue", total_hires: "Total Hires", active_prod: "Active Products",
        view_only: "View Only Mode", save: "Save", cancel: "Cancel", processing: "Processing...",
        edit: "Edit", delete: "Delete", view: "View", add_new: "+ Add New", update: "Update", confirm: "Confirm",
        vip_dist: "VIP Distribution", rev_trend: "Revenue Trend", top_serv: "Top Services", cat_share: "Category Share"
    },
    th: {
        dashboard: "แผงควบคุม", analytics: "ภาพรวม", services: "บริการ", users: "ลูกค้า",
        transactions: "ธุรกรรม", search: "ค้นหา...", edit_log: "แก้ไข Log", go_home: "กลับหน้าหลัก",
        logout: "ออกจากระบบ", total_rev: "รายได้รวม", total_hires: "จ้างงานทั้งหมด", active_prod: "สินค้าที่ขาย",
        view_only: "โหมดดูอย่างเดียว", save: "บันทึก", cancel: "ยกเลิก", processing: "กำลังประมวลผล...",
        edit: "แก้ไข", delete: "ลบ", view: "ดูข้อมูล", add_new: "+ เพิ่มรายการ", update: "อัปเดต", confirm: "ยืนยัน",
        vip_dist: "การกระจายตัว VIP", rev_trend: "แนวโน้มรายได้", top_serv: "บริการยอดฮิต", cat_share: "สัดส่วนหมวดหมู่"
    }
};

export default function AdminPage() {
  const router = useRouter();
  
  // -- SYSTEM --
  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState<"underwater" | "snow">("underwater");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [lang, setLang] = useState<"en" | "th">("th");

  // -- ADMIN --
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'transactions' | 'services'>('analytics');
  const [loading, setLoading] = useState(false);
  
  // -- DATA --
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  // -- UI STATE --
  const [showLogEditor, setShowLogEditor] = useState(false);
  const [updateLogText, setUpdateLogText] = useState("");
  const [expandSettings, setExpandSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [previewImageFull, setPreviewImageFull] = useState<string | null>(null);

  // -- FILTER --
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // -- MODALS --
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingService, setViewingService] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  // -- FORMS --
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formRealName, setFormRealName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLine, setFormLine] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [workPreview, setWorkPreview] = useState<string | null>(null);
  
  const [editTransNote, setEditTransNote] = useState("");
  const [editTransSlip, setEditTransSlip] = useState<string | null>(null);
  const [editTransWork, setEditTransWork] = useState<string | null>(null);

  const [serviceForm, setServiceForm] = useState<any>(INITIAL_SERVICE_FORM);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [activePackageTab, setActivePackageTab] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [newReview, setNewReview] = useState({ user: "", comment: "", star: 5, image: null as string | null });

  // Refs
  const slipInputRef = useRef<HTMLInputElement>(null);
  const workInputRef = useRef<HTMLInputElement>(null);
  const editTransSlipRef = useRef<HTMLInputElement>(null);
  const editTransWorkRef = useRef<HTMLInputElement>(null);
  const serviceImageInputRef = useRef<HTMLInputElement>(null);
  const reviewImageInputRef = useRef<HTMLInputElement>(null);

  // ✅ [FIX] Fallback to 'en' if lang is corrupted or undefined
  const t = TEXT[lang] || TEXT['en'];

  useEffect(() => {
    setMounted(true);
    const s = localStorage.getItem("croc_scene");
    const t = localStorage.getItem("croc_theme");
    const l = localStorage.getItem("croc_lite");
    const lng = localStorage.getItem("croc_lang");
    
    if (s) setScene(s as any);
    if (t) setTheme(t as any);
    if (l) setIsLiteMode(l === "true");
    // ✅ [FIX] Strict check for language
    if (lng && (lng === "en" || lng === "th")) setLang(lng as any);

    if (window.innerWidth < 768) setIsSidebarOpen(false);

    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
          router.push("/login");
      } else if (u.email !== ADMIN_EMAIL) {
          alert("⛔ Access Denied / ไม่ได้รับอนุญาต");
          router.push("/");
      } else {
          setUser(u);
          setIsAuthorized(true);
      }
    });
    return () => { unsub(); };
  }, [router]);

  useEffect(() => {
    if (mounted) {
        localStorage.setItem("croc_scene", scene);
        localStorage.setItem("croc_theme", theme);
        localStorage.setItem("croc_lite", String(isLiteMode));
        localStorage.setItem("croc_lang", lang);
    }
  }, [scene, theme, isLiteMode, lang, mounted]);

  useEffect(() => {
    if (!isAuthorized) return;
    const unsub1 = onSnapshot(query(collection(db, "users"), orderBy("lastUpdated", "desc")), s => setUsers(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const unsub2 = onSnapshot(query(collection(db, "transactions"), orderBy("timestamp", "desc")), s => setTransactions(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const unsub3 = onSnapshot(collection(db, "services"), s => setServices(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const unsubLog = onSnapshot(doc(db, "system", "info"), (doc) => { if (doc.exists()) { setUpdateLogText(doc.data().text || ""); } });
    return () => { unsub1(); unsub2(); unsub3(); unsubLog(); };
  }, [isAuthorized]);

  const isAdmin = user?.email === ADMIN_EMAIL;
  
  const checkPermission = () => {
      if (!isAdmin) {
          alert("🔒 View Only Mode");
          return false;
      }
      return true;
  };

  const filteredServices = useMemo(() => {
      return services.filter(s => {
          const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
          const matchCat = filterCategory === "all" || s.category === filterCategory;
          const price = s.packages?.basic?.price || 0;
          const matchMin = minPrice ? price >= Number(minPrice) : true;
          const matchMax = maxPrice ? price <= Number(maxPrice) : true;
          return matchSearch && matchCat && matchMin && matchMax;
      });
  }, [services, searchQuery, filterCategory, minPrice, maxPrice]);

  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTrans = useMemo(() => transactions.filter(t => t.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || t.note?.toLowerCase().includes(searchQuery.toLowerCase())), [transactions, searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTrans = filteredTrans.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTrans.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const stats = useMemo(() => {
      const totalRevenue = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      const totalHires = transactions.length; 
      const dailyRevenue = transactions.reduce((acc:any, t) => {
          const date = t.timestamp?.toDate().toLocaleDateString('en-GB') || "Unknown";
          acc[date] = (acc[date] || 0) + Number(t.amount); return acc;
      }, {});
      const chartData = Object.keys(dailyRevenue).sort((a,b) => new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime()).slice(-10).map(date => ({ date, value: dailyRevenue[date] }));
      
      const categoryBreakdown = services.reduce((acc:any, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {});
      const categoryData = Object.entries(categoryBreakdown).map(([name, value]:any) => ({ name, value }));

      const vipDist = users.reduce((acc:any, u) => {
          const level = u.vipLevel || 0;
          acc[level] = (acc[level] || 0) + 1;
          return acc;
      }, {});
      const vipChartData = Object.keys(vipDist).map(level => ({ name: `VIP ${level}`, value: vipDist[level] }));

      const topServices = [...services].sort((a,b) => (b.reviewsCount||0) - (a.reviewsCount||0)).slice(0, 5).map(s => ({ name: s.title.substring(0, 15)+'...', value: s.reviewsCount || 0 }));

      return { totalRevenue, totalHires, chartData, categoryData, vipChartData, topServices, activeProducts: services.length };
  }, [transactions, services, users]);

  const handleSaveLog = async () => { if (!checkPermission()) return; setLoading(true); try { await setDoc(doc(db, "system", "info"), { text: updateLogText, updatedAt: serverTimestamp() }, { merge: true }); alert("✅ Saved!"); setShowLogEditor(false); } catch (e: any) { alert(e.message); } setLoading(false); };
  
  // ✅ [FIX] CSV Export with BOM for Thai Language
  const handleExportCSV = (data: any[], filename: string) => {
      if (!data.length) return alert("No data to export");
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map(obj => Object.values(obj).map(v => typeof v === 'object' ? JSON.stringify(v).replace(/,/g, ';') : `"${String(v).replace(/"/g, '""')}"`).join(","));
      const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); // Added BOM \uFEFF
      const link = document.createElement("a");
      link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvContent);
      link.download = `${filename}_${new Date().toISOString()}.csv`;
      link.click();
  };

  const handleFileChange = async (e: any, setPreview: any) => { const file = e.target.files[0]; if(file){ const compressed = await compressImage(file); setPreview(compressed); } };
  const handleServiceImageUpload = async (e: any) => { const files = Array.from(e.target.files); for (const file of files as File[]) { const compressed = await compressImage(file); setServiceForm((p:any)=>({...p, images:[...p.images, compressed]})); } };
  const removeServiceImage = (i: number) => setServiceForm((p:any) => ({...p, images:p.images.filter((_:any,x:number)=>x!==i)}));
  const handleReviewImageUpload = async (e: any) => { const file = e.target.files[0]; if(file){ const compressed = await compressImage(file); setNewReview({...newReview, image: compressed}); } };
  const handleSaveService = async (e:any) => { e.preventDefault(); if (!checkPermission()) return; setLoading(true); try { const processF = (f:any) => Array.isArray(f)?f:f.split(',').map((s:string)=>s.trim()).filter((s:string)=>s!==""); const data = { ...serviceForm, seller: {...MY_CONTACT, responseTime:"1 ชม."}, startingPrice:Number(serviceForm.packages.basic.price), packages: { basic:{...serviceForm.packages.basic, features:processF(serviceForm.packages.basic.features)}, standard:{...serviceForm.packages.standard, features:processF(serviceForm.packages.standard.features)}, premium:{...serviceForm.packages.premium, features:processF(serviceForm.packages.premium.features)} }, updatedAt:serverTimestamp() }; if(editingServiceId) await updateDoc(doc(db,"services",editingServiceId), data); else await addDoc(collection(db,"services"), {...data, createdAt:serverTimestamp()}); setShowServiceModal(false); setServiceForm(INITIAL_SERVICE_FORM); setEditingServiceId(null); } catch(e:any){ alert(e.message); } setLoading(false); };
  const handleDeleteService = async (id:string) => { if (!checkPermission()) return; if(confirm("Delete?")) await deleteDoc(doc(db,"services",id)); };
  
  // ✅ [LOGIC FIXED] Save User or Transaction with Auto-Link
  const handleSaveUserOrTrans = async (e:any) => { 
      e.preventDefault(); 
      if (!checkPermission()) return; 
      setLoading(true); 
      const amt = Number(formAmount); 
      
      try { 
          // Mode 1: Edit existing User
          if(activeTab === 'users' && isEditMode && editId) { 
              await updateDoc(doc(db,"users",editId), { 
                  name:formName, email:formEmail, realName:formRealName, phone:formPhone, lineId:formLine, address:formAddress, 
                  totalSpent:amt, vipLevel:calculateVIP(amt), lastUpdated: serverTimestamp()
              }); 
              alert("User Updated"); 
              cancelEdit(); 
          } 
          // Mode 2: Add New Transaction (And update/create User)
          else { 
              let uid = ""; 
              // 1. Check if user exists by email
              const q = query(collection(db,"users"), where("email","==",formEmail)); 
              const s = await getDocs(q); 
              
              if(!s.empty) { 
                  // User Exists -> Update their Total Spent
                  const userDoc = s.docs[0];
                  uid = userDoc.id; 
                  const currentTotal = userDoc.data().totalSpent || 0;
                  const newTotal = currentTotal + amt;
                  
                  await updateDoc(doc(db,"users",uid), { 
                      totalSpent: newTotal, 
                      vipLevel: calculateVIP(newTotal),
                      lastUpdated: serverTimestamp()
                  }); 
              } else { 
                  // User Not Found -> Create New User
                  const r = await addDoc(collection(db,"users"), { 
                      name:formName, email:formEmail, totalSpent:amt, vipLevel:calculateVIP(amt), 
                      createdAt: serverTimestamp(), lastUpdated: serverTimestamp() 
                  }); 
                  uid = r.id; 
              } 
              
              // 2. Add Transaction Record
              await addDoc(collection(db,"transactions"), { 
                  userId:uid, userName:formName, amount:amt, note:formNote, 
                  timestamp:serverTimestamp(), paymentSlip:slipPreview, workImage:workPreview 
              }); 
              
              alert("Transaction Saved & User Updated!"); 
              resetForm(); 
          } 
      } catch(e:any){ alert(e.message); } 
      setLoading(false); 
  };

  const handleUpdateTransaction = async () => { if (!checkPermission()) return; if(!editingTransaction)return; setLoading(true); await updateDoc(doc(db,"transactions",editingTransaction.id), { note:editTransNote, paymentSlip:editTransSlip, workImage:editTransWork }); setEditingTransaction(null); setLoading(false); };
  
  // ✅ [LOGIC FIXED] Delete Transaction & Revert User Stats
  const handleDeleteTransaction = async (id:string, uid:string, amt:number) => { 
      if (!checkPermission()) return; 
      if(!confirm("Delete Transaction? This will deduct amount from user.")) return; 
      setLoading(true); 
      try {
          // 1. Delete Transaction
          await deleteDoc(doc(db,"transactions",id)); 
          
          // 2. Update User Stats if user exists
          if(uid){ 
              const s = await getDoc(doc(db,"users",uid)); 
              if(s.exists()){ 
                  const currentTotal = s.data().totalSpent || 0;
                  const newTotal = Math.max(0, currentTotal - amt); // Prevent negative
                  await updateDoc(doc(db,"users",uid), { 
                      totalSpent:newTotal, 
                      vipLevel:calculateVIP(newTotal),
                      lastUpdated: serverTimestamp()
                  }); 
              } 
          }
      } catch(e:any) { alert(e.message); }
      setLoading(false); 
  };
  
  const startEditUser = (u:any) => { setActiveTab('users'); setIsEditMode(true); setEditId(u.id); setFormName(u.name); setFormEmail(u.email); setFormAmount(String(u.totalSpent)); setFormRealName(u.realName||""); setFormPhone(u.phone||""); setFormLine(u.lineId||""); setFormAddress(u.address||""); setShowUserModal(false); };
  const handleViewUser = (u: any) => { setSelectedUser(u); setShowUserModal(true); };
  const resetForm = () => { setFormName(""); setFormEmail(""); setFormAmount(""); setFormNote(""); setSlipPreview(null); setWorkPreview(null); setFormRealName(""); setFormPhone(""); setFormLine(""); setFormAddress(""); };
  const cancelEdit = () => { setIsEditMode(false); setEditId(null); resetForm(); };
  const handleLogout = async () => { await signOut(auth); router.push("/login"); };
  const handleGoHome = () => router.push("/");
  
  const handleEditService = (s:any) => { setServiceForm({...s, images:s.images||(s.thumbnail?[s.thumbnail]:[]), reviews:s.reviews||[], packages:{ basic:{...s.packages.basic, features:Array.isArray(s.packages.basic.features)?s.packages.basic.features.join(', '):s.packages.basic.features}, standard:{...s.packages.standard, features:Array.isArray(s.packages.standard.features)?s.packages.standard.features.join(', '):s.packages.standard.features}, premium:{...s.packages.premium, features:Array.isArray(s.packages.premium.features)?s.packages.premium.features.join(', '):s.packages.premium.features} }}); setEditingServiceId(s.id); setShowServiceModal(true); };
  const openView = (s: any) => { setViewingService(s); setShowViewModal(true); };
  const handleAddReview = () => { if(!newReview.user || !newReview.comment) return alert("Fill fields"); const newR = [...(serviceForm.reviews||[]), {...newReview, date: new Date().toISOString()}]; setServiceForm({...serviceForm, reviews:newR}); setNewReview({user:"",comment:"",star:5, image: null}); };
  const removeReview = (i:number) => { const newR = serviceForm.reviews.filter((_:any,x:number)=>x!==i); setServiceForm({...serviceForm, reviews:newR}); };

  const isDark = theme === "dark";
  const currentTheme = isDark ? LUXURY.dark : LUXURY.light;
  const panelColor = currentTheme.glass;

  if (!isAuthorized || !mounted) return <div className="bg-black h-screen w-screen flex items-center justify-center text-cyan-500 font-mono animate-pulse">VERIFYING ADMIN...</div>;

  return (
    <div className={cn("fixed inset-0 h-[100dvh] w-screen overflow-hidden flex flex-col select-none transition-colors duration-1000 font-sans", currentTheme.text, isLiteMode ? currentTheme.bg : (isDark ? "bg-[#050505]" : "bg-slate-100"))}>
      {!isLiteMode && (
          <div className="absolute inset-0 z-0 pointer-events-none w-full h-full">
            <motion.div className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {scene === "underwater" && <UnderwaterBackground />}
                {scene === "snow" && <SnowBackground count={150} />}
            </motion.div>
            <div className={cn("absolute inset-0 z-0", isDark ? "bg-black/20" : "bg-white/20")} />
          </div>
      )}

      <header className="relative z-50 p-4 md:p-6 shrink-0 flex justify-between items-center h-[12%]">
        <div className={cn("flex gap-3 items-center p-2 pr-5 rounded-[2.5rem] border backdrop-blur-xl shadow-xl", panelColor)}>
          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-cyan-500 shadow-lg">
            <Image src="/croc-mascot.jpg" alt="Mascot" fill className="object-cover" />
          </div>
          <div className="hidden sm:block">
            <h2 className={cn("text-sm font-black uppercase tracking-tighter leading-none", currentTheme.accent)}>Croc Admin</h2>
            <p className="text-[7px] font-mono tracking-widest mt-0.5 font-bold opacity-70">V13.1 STABLE</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={cn("md:hidden p-3 rounded-xl border shadow-lg active:scale-95 transition", panelColor)}><FaBars /></button>
           <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className={cn("flex items-center gap-2 p-2 pr-4 rounded-[2rem] border transition-all hover:bg-white/5 active:scale-95", panelColor)}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-[2px] shadow-lg"><div className="w-full h-full rounded-full overflow-hidden bg-black"><Image src="/croc-mascot.jpg" alt="Profile" width={32} height={32} className="object-cover"/></div></div>
                    <div className="text-right hidden sm:block"><div className="text-xs font-bold">{isAdmin ? "Admin" : "Guest"}</div>{!isAdmin && <div className="text-[9px] text-red-400 font-bold">Read-Only</div>}</div>
                    <FaChevronDown className={cn("text-[10px] opacity-50 transition-transform", showProfileMenu ? "rotate-180" : "")} />
                </button>
                <AnimatePresence>
                    {showProfileMenu && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className={cn("absolute top-full right-0 mt-2 w-48 p-2 rounded-2xl border flex flex-col gap-1 shadow-2xl backdrop-blur-xl origin-top-right overflow-hidden z-[200]", panelColor)}>
                            <button onClick={() => { if(checkPermission()) { setShowLogEditor(true); setShowProfileMenu(false); } }} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider transition-colors", isAdmin ? "hover:bg-white/10 text-yellow-500" : "opacity-50 cursor-not-allowed")}><FaBullhorn /> {t.edit_log}</button>
                            <button onClick={handleGoHome} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider transition-colors hover:bg-white/10"><FaHome /> {t.go_home}</button>
                            <div className="h-[1px] bg-current/10 mx-2 my-1" />
                            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider text-red-500 hover:bg-red-500/10 transition-colors"><FaSignOutAlt /> {t.logout}</button>
                        </motion.div>
                    )}
                </AnimatePresence>
           </div>
        </div>
      </header>

      <main className="relative z-20 flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
         <AnimatePresence>
            {(isSidebarOpen || window.innerWidth >= 768) && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className={cn("mb-8 flex justify-center flex-wrap gap-4", !isSidebarOpen && "hidden md:flex")}>
                    <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<FaChartPie />} label={t.analytics} isDark={isDark} />
                    <TabButton active={activeTab === 'services'} onClick={() => setActiveTab('services')} icon={<FaBriefcase />} label={t.services} isDark={isDark} />
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<FaUser />} label={t.users} isDark={isDark} />
                    <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<FaMoneyBillWave />} label={t.transactions} isDark={isDark} />
                </motion.div>
            )}
         </AnimatePresence>

         {activeTab === 'analytics' && (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-6xl mx-auto space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <StatCard title={t.total_rev} value={`฿${stats.totalRevenue.toLocaleString()}`} icon={<FaMoneyBillWave/>} color="emerald" isDark={isDark}/>
                     <StatCard title={t.total_hires} value={stats.totalHires} icon={<FaCheckCircle/>} color="blue" isDark={isDark}/>
                     <StatCard title={t.active_prod} value={stats.activeProducts} icon={<FaBriefcase/>} color="purple" isDark={isDark}/>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className={cn("p-6 rounded-3xl border flex flex-col h-80", panelColor)}>
                         <h3 className="font-bold mb-4 flex items-center gap-2"><FaChartLine className="text-emerald-500"/> {t.rev_trend}</h3>
                         <div className="flex-1 flex items-end gap-2 p-2 relative">
                             {stats.chartData.length > 0 ? stats.chartData.map((d:any, i:number) => (<div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full"><div className="w-full bg-emerald-500/20 hover:bg-emerald-500/50 transition-all rounded-t-lg relative group-hover:scale-105" style={{height: `${Math.max(10, (d.value / Math.max(...stats.chartData.map((x:any)=>x.value))) * 100)}%`}}></div><div className="text-[8px] opacity-50 mt-1 rotate-45 origin-left truncate w-full">{d.date}</div></div>)) : <div className="m-auto opacity-30">No data</div>}
                         </div>
                     </div>
                     <div className={cn("p-6 rounded-3xl border flex flex-col h-80", panelColor)}>
                         <h3 className="font-bold mb-4 flex items-center gap-2"><FaChartBar className="text-blue-500"/> {t.top_serv}</h3>
                         <div className="flex-1 flex flex-col justify-center space-y-3">
                             {stats.topServices.length > 0 ? stats.topServices.map((s:any, i:number) => (<div key={i} className="w-full"><div className="flex justify-between text-xs mb-1"><span className="truncate w-3/4">{s.name}</span><span className="font-bold">{s.value}</span></div><div className="h-2 bg-current/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width: `${(s.value / Math.max(...stats.topServices.map((x:any)=>x.value))) * 100}%`}}></div></div></div>)) : <div className="m-auto opacity-30">No data</div>}
                         </div>
                     </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className={cn("p-6 rounded-3xl border flex flex-col h-80", panelColor)}>
                         <h3 className="font-bold mb-4 flex items-center gap-2"><FaChartPie className="text-orange-500"/> {t.cat_share}</h3>
                         <div className="flex-1 flex justify-center items-center">
                             <div className="relative w-40 h-40">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    {stats.categoryData.reduce((acc:any, item:any, i:number) => { const total = stats.categoryData.reduce((a:number, b:any) => a + b.value, 0); const percent = (item.value / total) * 100; const dashArray = `${percent} ${100 - percent}`; const offset = acc.offset; acc.offset -= percent; const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]; acc.elements.push(<circle key={i} cx="50" cy="50" r="40" fill="transparent" stroke={colors[i % colors.length]} strokeWidth="20" strokeDasharray={dashArray} strokeDashoffset={offset} />); return acc; }, { offset: 0, elements: [] }).elements}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold opacity-50">CATS</div>
                             </div>
                             <div className="ml-6 space-y-2">
                                 {stats.categoryData.map((c:any, i:number) => ( <div key={i} className="flex items-center gap-2 text-xs"> <div className="w-3 h-3 rounded-full" style={{backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][i % 5]}}></div> <span>{c.name} ({c.value})</span> </div> ))}
                             </div>
                         </div>
                     </div>
                     <div className={cn("p-6 rounded-3xl border flex flex-col h-80", panelColor)}>
                         <h3 className="font-bold mb-4 flex items-center gap-2"><FaCrown className="text-yellow-500"/> {t.vip_dist}</h3>
                         <div className="flex-1 flex items-end gap-1 p-2">
                             {stats.vipChartData.map((d:any, i:number) => ( <div key={i} className="flex-1 flex flex-col justify-end items-center group"> <div className="w-full bg-yellow-500/20 hover:bg-yellow-500/50 rounded-t transition-all relative" style={{height: `${Math.max(5, (d.value / Math.max(...stats.vipChartData.map((x:any)=>x.value || 1))) * 100)}%`}}> <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] opacity-0 group-hover:opacity-100">{d.value}</div> </div> <div className="text-[8px] opacity-50 mt-1 rotate-45 origin-left truncate w-full">{d.name}</div> </div> ))}
                         </div>
                     </div>
                 </div>
             </motion.div>
         )}

         {activeTab === 'services' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-7xl mx-auto space-y-6">
                <div className={cn("p-6 rounded-3xl border flex flex-col md:flex-row justify-between gap-4", panelColor)}>
                    <button onClick={() => { if(checkPermission()) { setServiceForm(INITIAL_SERVICE_FORM); setEditingServiceId(null); setShowServiceModal(true); } }} className={cn("px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2", currentTheme.button, !isAdmin && "opacity-50 cursor-not-allowed")}><FaPlus /> {t.add_new}</button>
                    <div className="flex flex-wrap gap-2 items-center flex-1 justify-end">
                        <div className={cn("flex items-center px-3 py-2 rounded-xl border w-full md:w-auto", isDark?"border-white/10 bg-black/20":"border-black/10 bg-white/50")}><FaSearch className="opacity-50 mr-2"/><input placeholder={t.search} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="bg-transparent outline-none text-xs w-32"/></div>
                        <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className={cn("px-3 py-2 rounded-xl border text-xs outline-none bg-transparent", isDark?"border-white/10":"border-black/10")}><option value="all" className="text-black">All Cats</option>{ADMIN_CATEGORIES.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}</select>
                        <input type="number" placeholder="Min ฿" value={minPrice} onChange={e=>setMinPrice(e.target.value)} className={cn("w-20 px-3 py-2 rounded-xl border text-xs outline-none bg-transparent", isDark?"border-white/10":"border-black/10")} />
                        <input type="number" placeholder="Max ฿" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} className={cn("w-20 px-3 py-2 rounded-xl border text-xs outline-none bg-transparent", isDark?"border-white/10":"border-black/10")} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredServices.map((s) => (
                        <div key={s.id} className={cn("p-4 rounded-3xl border group hover:border-cyan-500/50 transition-all flex flex-col relative", panelColor)}>
                            {!isAdmin && <div className="absolute top-2 right-2 text-red-500"><FaLock /></div>}
                            <div className={`h-32 w-full rounded-2xl mb-3 relative overflow-hidden bg-black/20 cursor-pointer`} onClick={() => setPreviewImageFull(s.images?.[0])}>{s.images?.length > 0 ? (<img src={s.images[0]} className="w-full h-full object-cover" />) : ( <div className="w-full h-full flex items-center justify-center text-xs opacity-50">No Image</div> )}<div className="absolute top-2 left-2 bg-cyan-500/80 backdrop-blur-md px-2 py-1 rounded text-[8px] text-black font-bold uppercase">{s.category}</div></div>
                            <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">{s.title}</h3>
                            <div className="flex justify-between items-center text-xs opacity-60 mb-3 font-mono"><span>฿{s.packages?.basic?.price?.toLocaleString()}</span><span className="flex items-center gap-1 text-yellow-400"><FaStar/> {s.rating}</span></div>
                            <div className="mt-auto flex gap-2">
                                <ActionButton onClick={() => openView(s)} icon={<FaEye/>} color="green" isDark={isDark} title={t.view} />
                                <ActionButton onClick={() => handleEditService(s)} icon={<FaEdit/>} color="blue" isDark={isDark} title={t.edit} />
                                <ActionButton onClick={() => handleDeleteService(s.id)} icon={<FaTrash/>} color="red" isDark={isDark} title={t.delete} />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
         )}

         {(activeTab === 'users' || activeTab === 'transactions') && (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {activeTab === 'users' && (
                    <div className="lg:col-span-4">
                        <div className={cn("sticky top-0 backdrop-blur-xl p-6 rounded-[2rem] border shadow-2xl transition-all", panelColor)}>
                            <h2 className="font-black text-xl mb-6 flex items-center gap-2 uppercase">{isEditMode ? <><FaEdit className="text-blue-500"/> {t.edit}</> : <><FaMoneyBillWave className="text-cyan-500"/> Add Record</>}</h2>
                            <form onSubmit={handleSaveUserOrTrans} className="space-y-4">
                                <InputGroup label="Name" value={formName} onChange={setFormName} required isDark={isDark} />
                                <InputGroup label="Email" value={formEmail} onChange={setFormEmail} required isDark={isDark} />
                                {isEditMode && (<><div className="grid grid-cols-2 gap-3"><InputGroup label="Real Name" value={formRealName} onChange={setFormRealName} isDark={isDark} /><InputGroup label="Phone" value={formPhone} onChange={setFormPhone} isDark={isDark} /></div><InputGroup label="Line ID" value={formLine} onChange={setFormLine} isDark={isDark} /><InputGroup label="Address" value={formAddress} onChange={setFormAddress} isDark={isDark} /></>)}
                                <div className="grid grid-cols-2 gap-3"><InputGroup label={isEditMode ? "Total Spent" : "Amount"} type="number" value={formAmount} onChange={setFormAmount} required isDark={isDark} className="font-mono text-cyan-500 font-bold"/><InputGroup label="Note" value={formNote} onChange={setFormNote} isDark={isDark} /></div>
                                {!isEditMode && (<div className="grid grid-cols-2 gap-3 pt-2"><UploadBox label="Slip" preview={slipPreview} onClick={() => slipInputRef.current?.click()} isDark={isDark} /><UploadBox label="Work" preview={workPreview} onClick={() => workInputRef.current?.click()} isDark={isDark} color="cyan" /><input type="file" ref={slipInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setSlipPreview)} /><input type="file" ref={workInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setWorkPreview)} /></div>)}
                                <button type="submit" disabled={loading} className={cn("w-full py-3 rounded-xl font-bold shadow-lg mt-4", currentTheme.button, !isAdmin && "opacity-50 cursor-not-allowed")}>{loading ? t.processing : (isEditMode ? t.update : t.confirm)}</button>
                                {isEditMode && <button type="button" onClick={cancelEdit} className="w-full py-2 text-xs opacity-50">{t.cancel}</button>}
                            </form>
                        </div>
                    </div>
                )}
                <div className={activeTab === 'users' ? "lg:col-span-8" : "col-span-12"}>
                    <div className={cn("backdrop-blur-xl rounded-[2rem] border overflow-hidden shadow-xl min-h-[500px] flex flex-col", panelColor)}>
                        <div className="p-4 border-b border-white/5 flex flex-wrap justify-between items-center gap-2">
                            <div className="flex gap-2">
                                <div className={cn("flex items-center px-3 py-2 rounded-xl border", isDark?"border-white/10 bg-black/20":"border-black/10 bg-white/50")}><FaSearch className="opacity-50 mr-2"/><input placeholder={t.search} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="bg-transparent outline-none text-xs w-32"/></div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleExportCSV(activeTab === 'transactions' ? transactions : users, activeTab)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-500 transition flex items-center gap-2"><FaFileCsv/> Export</button>
                                {activeTab === 'transactions' && <button onClick={() => setActiveTab('users')} className="bg-cyan-500 text-black px-4 py-2 rounded-lg font-bold text-xs hover:scale-105 transition">{t.add_new}</button>}
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1">
                           <table className="w-full text-left">
                              <thead className={cn("text-[9px] uppercase tracking-widest", isDark ? "bg-white/5 text-cyan-500" : "bg-black/5 text-blue-600")}>
                                 <tr>{activeTab === 'users' ? (<><th className="p-5 pl-8">User</th><th className="p-5">Tier</th><th className="p-5 text-right">Spent</th><th className="p-5 text-center">Action</th></>) : (<><th className="p-5 pl-8">Date</th><th className="p-5">User</th><th className="p-5">Note</th><th className="p-5 text-right">Amount</th><th className="p-5 text-center">Action</th></>)}</tr>
                              </thead>
                              <tbody className="divide-y divide-current/10">
                                 {activeTab === 'users' ? filteredUsers.map(u => (<tr key={u.id} className="hover:bg-current/5 transition relative z-10"><td className="p-5 pl-8 font-bold cursor-pointer" onClick={() => handleViewUser(u)}>{u.name}<div className="text-xs opacity-50">{u.email}</div></td><td className="p-5 text-xs"><span className="border border-current/20 px-2 py-1 rounded-full">VIP {u.vipLevel}</span></td><td className="p-5 text-right font-mono font-bold">฿{u.totalSpent?.toLocaleString()}</td><td className="p-5 flex justify-center gap-2 relative z-20"><ActionButton onClick={() => handleViewUser(u)} icon={<FaEye/>} color="gray" isDark={isDark} /><ActionButton onClick={() => startEditUser(u)} icon={<FaEdit/>} color="blue" isDark={isDark} /><ActionButton onClick={() => {if(checkPermission() && confirm("Delete User?")) deleteDoc(doc(db,"users",u.id))}} icon={<FaTrash/>} color="red" isDark={isDark} /></td></tr>)) 
                                 : currentTrans.map(t => (<tr key={t.id} className="hover:bg-current/5 transition relative z-10"><td className="p-5 pl-8 text-xs font-mono opacity-50">{t.timestamp?.toDate().toLocaleString()}</td><td className="p-5 font-bold text-sm">{t.userName}</td><td className="p-5 text-sm">{t.note}</td><td className="p-5 text-right font-mono text-emerald-500 font-bold">+{t.amount?.toLocaleString()}</td><td className="p-5 flex justify-center gap-2 relative z-20"><ActionButton onClick={() => { setEditingTransaction(t); setEditTransNote(t.note||""); setEditTransSlip(t.paymentSlip); setEditTransWork(t.workImage); }} icon={<FaEdit/>} color="blue" isDark={isDark} /><ActionButton onClick={() => handleDeleteTransaction(t.id, t.userId, t.amount)} icon={<FaTrash/>} color="red" isDark={isDark} /></td></tr>))}
                              </tbody>
                           </table>
                        </div>
                    </div>
                </div>
             </motion.div>
         )}
      </main>

      <motion.div className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-[9999]">
        <div className="relative">
            <AnimatePresence>
                {expandSettings && (
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} className={cn("absolute bottom-full left-0 mb-4 p-4 rounded-[1.5rem] border flex flex-col gap-3 shadow-[0_15px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl origin-bottom-left w-48", panelColor)}>
                        <div className="flex gap-2">
                            <button onClick={() => setTheme(isDark?"light":"dark")} className={cn("flex-1 text-[8px] font-black py-3 rounded-xl transition-colors border border-transparent flex items-center justify-center gap-1", isDark?"bg-white/10 text-white":"bg-black/5 text-black")}> {isDark ? "☀️ LIGHT" : "🌙 DARK"} </button>
                            <button onClick={() => setLang(lang==="en"?"th":"en")} className={cn("w-12 text-[8px] font-black py-3 rounded-xl transition-colors border border-transparent flex items-center justify-center", "bg-cyan-500 text-black")}><FaLanguage className="text-sm mr-1"/>{lang.toUpperCase()}</button>
                        </div>
                        <button onClick={() => setIsLiteMode(!isLiteMode)} className={cn("text-[8px] font-black py-3 rounded-xl transition-colors border border-transparent flex items-center justify-center gap-1", isLiteMode?"bg-yellow-500 text-black":(isDark?"text-white/50 hover:text-white":"text-black/50 hover:text-black"))}> {isLiteMode ? "⚡ LITE" : "🐢 FULL"} </button>
                        <div className="h-[1px] bg-current/10 mx-1" />
                        <div className="flex gap-2 justify-center"> <button onClick={() => { setScene("underwater"); localStorage.setItem("croc_scene", "underwater"); }} className={cn("flex-1 p-2 rounded-xl transition-colors text-xs flex justify-center", scene==="underwater"?"bg-cyan-500 text-black shadow-lg":"bg-white/5 text-gray-500 hover:bg-white/10")}>🌊</button> <button onClick={() => { setScene("snow"); localStorage.setItem("croc_scene", "snow"); }} className={cn("flex-1 p-2 rounded-xl transition-colors text-xs flex justify-center", scene==="snow"?"bg-blue-500 text-white shadow-lg":"bg-white/5 text-gray-500 hover:bg-white/10")}>❄️</button> </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <button onClick={() => setExpandSettings(!expandSettings)} className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border transition-all hover:scale-110 active:scale-95", isDark ? "bg-black/80 border-white/20 text-white" : "bg-white border-slate-200 text-black", expandSettings && "bg-cyan-500 border-cyan-500 text-black rotate-90")}> {expandSettings ? <FaTimes /> : <FaCog />} </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showLogEditor && (<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowLogEditor(false)}><motion.div initial={{scale:0.95}} animate={{scale:1}} className={cn("w-full max-w-2xl bg-white p-8 rounded-[2rem] shadow-2xl flex flex-col", isDark ? "bg-[#121212] border border-white/20" : "")} onClick={e => e.stopPropagation()}><h3 className="text-2xl font-black mb-4 text-cyan-500">Edit System Log</h3><textarea className={cn("w-full h-64 p-4 rounded-xl border bg-transparent outline-none resize-none font-mono text-xs leading-relaxed", isDark ? "border-white/20 text-white" : "border-black/20 text-black")} value={updateLogText} onChange={(e) => setUpdateLogText(e.target.value)} placeholder="Type log here..." /><div className="flex justify-end gap-3 mt-4"><button onClick={() => setShowLogEditor(false)} className="px-6 py-2 rounded-xl opacity-50 hover:opacity-100">{t.cancel}</button><button onClick={handleSaveLog} className="bg-cyan-500 text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition">{loading ? t.processing : t.save}</button></div></motion.div></motion.div>)}
        {showServiceModal && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={cn("w-full max-w-5xl h-[90vh] rounded-[2rem] border overflow-hidden flex flex-col", isDark ? "bg-[#121212] border-white/20" : "bg-white")} onClick={e => e.stopPropagation()}><div className="p-6 border-b border-white/10 flex justify-between items-center"><h3 className="font-bold text-xl flex items-center gap-2">{editingServiceId ? "Edit Service" : "New Product"}</h3><button onClick={() => setShowServiceModal(false)}><FaTimes className="text-xl hover:text-red-500"/></button></div><div className="flex-1 overflow-y-auto custom-scrollbar p-8"><form onSubmit={handleSaveService} className="space-y-8"><div className="space-y-4"><h4 className="text-xs font-black uppercase tracking-widest text-cyan-500 border-b border-cyan-500/20 pb-2">1. Gallery & Info</h4><div className="flex gap-2 overflow-x-auto pb-2"><div onClick={() => serviceImageInputRef.current?.click()} className={cn("flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition hover:bg-white/5", isDark ? "border-white/20" : "border-black/20")}><FaPlus className="mb-1 opacity-50"/> <span className="text-[9px] opacity-50">Add Image</span></div><input type="file" ref={serviceImageInputRef} className="hidden" multiple accept="image/*" onChange={handleServiceImageUpload} />{serviceForm.images?.map((img:string, i:number) => (<div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-white/10 group"><img src={img} className="w-full h-full object-cover" /><button type="button" onClick={() => removeServiceImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-[8px] opacity-0 group-hover:opacity-100 transition"><FaTimes/></button></div>))}</div><InputGroup label="Service Title" value={serviceForm.title} onChange={(v:string) => setServiceForm({...serviceForm, title: v})} required isDark={isDark} /><div className="space-y-1"><label className="text-[9px] uppercase opacity-50 ml-2 font-bold">Category *</label><div className="relative"><select value={serviceForm.category} onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})} className={cn("w-full p-3 rounded-xl border outline-none transition-all bg-transparent cursor-pointer appearance-none", isDark ? "border-white/20 focus:border-cyan-500 text-white bg-[#0f172a]" : "border-gray-300 focus:border-blue-500 text-slate-900 bg-white")} required><option value="" className="text-gray-500">Select Category...</option>{ADMIN_CATEGORIES.map(c => (<option key={c.id} value={c.id} className="text-black">{c.name}</option>))}</select><div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-xs">▼</div></div></div><InputGroup label="Description" rows={4} value={serviceForm.description} onChange={(v:any) => setServiceForm({...serviceForm, description: v})} required isDark={isDark} /></div><div className="space-y-4"><h4 className="text-xs font-black uppercase tracking-widest text-cyan-500 border-b border-cyan-500/20 pb-2">2. Manual Reviews</h4><div className="flex gap-2"><InputGroup label="Customer Name" value={newReview.user} onChange={(v:string) => setNewReview({...newReview, user: v})} isDark={isDark} className="flex-1"/><InputGroup label="Star" type="number" value={newReview.star} onChange={(v:string) => setNewReview({...newReview, star: Number(v)})} isDark={isDark} className="w-20"/></div><div className="flex gap-2 items-center"><InputGroup label="Comment" value={newReview.comment} onChange={(v:string) => setNewReview({...newReview, comment: v})} isDark={isDark} className="flex-1"/><div className="mt-6 flex items-center gap-2"><div onClick={() => reviewImageInputRef.current?.click()} className={cn("w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition hover:bg-white/5", isDark ? "border-white/20" : "border-black/20")}>{newReview.image ? <img src={newReview.image} className="w-full h-full object-cover rounded-lg"/> : <FaCamera className="opacity-50"/>}</div><input type="file" ref={reviewImageInputRef} className="hidden" accept="image/*" onChange={handleReviewImageUpload} /></div><button type="button" onClick={handleAddReview} className="bg-green-600 text-white px-4 rounded-xl font-bold text-xs mt-6 h-[46px]">Add</button></div><div className="space-y-2 max-h-40 overflow-y-auto">{serviceForm.reviews?.map((r:any, i:number) => (<div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-xs"><div className="flex items-center gap-2">{r.image && <img src={r.image} className="w-8 h-8 rounded object-cover"/>}<span>⭐ {r.star} - <b>{r.user}</b>: {r.comment}</span></div><button type="button" onClick={() => removeReview(i)} className="text-red-500"><FaTrash/></button></div>))}</div></div><div className="space-y-4"><div className="flex justify-between items-end border-b border-cyan-500/20 pb-2"><h4 className="text-xs font-black uppercase tracking-widest text-cyan-500">3. Pricing Packages</h4><div className="flex gap-1">{['basic', 'standard', 'premium'].map(pk => (<button key={pk} type="button" onClick={() => setActivePackageTab(pk as any)} className={cn("px-4 py-1 text-[10px] font-bold uppercase rounded-t-lg transition-all", activePackageTab === pk ? "bg-cyan-500 text-black" : "bg-white/5 opacity-50 hover:opacity-100")}>{pk}</button>))}</div></div><div className={cn("p-6 rounded-2xl border", isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-200")}><div className="grid grid-cols-2 gap-4 mb-4"><InputGroup label="Name" value={serviceForm.packages[activePackageTab].name} onChange={(v:string) => setServiceForm({...serviceForm, packages: {...serviceForm.packages, [activePackageTab]: {...serviceForm.packages[activePackageTab], name: v}}})} isDark={isDark} /><InputGroup label="Price" type="number" value={serviceForm.packages[activePackageTab].price} onChange={(v:string) => setServiceForm({...serviceForm, packages: {...serviceForm.packages, [activePackageTab]: {...serviceForm.packages[activePackageTab], price: v}}})} isDark={isDark} /></div><div className="grid grid-cols-2 gap-4 mb-4"><InputGroup label="Days" type="number" value={serviceForm.packages[activePackageTab].days} onChange={(v:string) => setServiceForm({...serviceForm, packages: {...serviceForm.packages, [activePackageTab]: {...serviceForm.packages[activePackageTab], days: v}}})} isDark={isDark} /><InputGroup label="Revisions" type="number" value={serviceForm.packages[activePackageTab].revisions} onChange={(v:string) => setServiceForm({...serviceForm, packages: {...serviceForm.packages, [activePackageTab]: {...serviceForm.packages[activePackageTab], revisions: v}}})} isDark={isDark} /></div><InputGroup label="Desc" value={serviceForm.packages[activePackageTab].desc} onChange={(v:string) => setServiceForm({...serviceForm, packages: {...serviceForm.packages, [activePackageTab]: {...serviceForm.packages[activePackageTab], desc: v}}})} isDark={isDark} className="mb-4" /><InputGroup label="Features (Comma separated)" value={serviceForm.packages[activePackageTab].features} onChange={(v:string) => setServiceForm({...serviceForm, packages: {...serviceForm.packages, [activePackageTab]: {...serviceForm.packages[activePackageTab], features: v}}})} isDark={isDark} /></div></div><button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/30 transition-all uppercase tracking-widest">{loading ? t.processing : "Save Service Product"}</button></form></div></motion.div></motion.div>)}
        {showViewModal && viewingService && (<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowViewModal(false)}><motion.div initial={{scale:0.95}} animate={{scale:1}} className={cn("w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 shadow-2xl relative", isDark?"bg-[#0f172a] border border-white/10":"bg-white")} onClick={e => e.stopPropagation()}><button onClick={() => setShowViewModal(false)} className="absolute top-6 right-6 text-xl opacity-50 hover:text-red-500 transition"><FaTimes/></button><h2 className="text-2xl font-black uppercase tracking-tight mb-2">{viewingService.title}</h2><div className="flex gap-2 text-xs opacity-60 mb-6"><span>{viewingService.category}</span> • <span>⭐ {viewingService.rating} ({viewingService.reviewsCount})</span></div><div className="space-y-6"><div><h3 className="font-bold mb-2">Description</h3><p className="opacity-70 text-sm whitespace-pre-wrap">{viewingService.description}</p></div><div className="border-t border-current/10 pt-4"><h3 className="font-bold mb-4">Packages</h3><div className="grid grid-cols-3 gap-2 text-center">{['basic', 'standard', 'premium'].map(pk => (<div key={pk} className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-[10px] uppercase font-black opacity-50 mb-1">{pk}</div><div className="text-lg font-bold text-cyan-500">฿{viewingService.packages?.[pk]?.price}</div><div className="text-[10px] opacity-60">{viewingService.packages?.[pk]?.days} Days</div></div>))}</div></div></div></motion.div></motion.div>)}
        {previewImageFull && (<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImageFull(null)}><img src={previewImageFull} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" /><button className="absolute top-4 right-4 text-white text-2xl bg-black/50 p-2 rounded-full hover:bg-red-500 transition"><FaTimes/></button></motion.div>)}
        {showUserModal && selectedUser && (<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowUserModal(false)}><motion.div initial={{scale:0.95}} animate={{scale:1}} className={cn("w-full max-w-4xl h-[80vh] rounded-[2rem] border overflow-hidden flex flex-col md:flex-row shadow-2xl", isDark ? "bg-[#121212] border-white/20" : "bg-white")} onClick={e => e.stopPropagation()}><div className="md:w-1/3 bg-black/20 p-8 flex flex-col items-center text-center border-r border-white/5"><div className="w-24 h-24 rounded-full border-4 border-cyan-500 mb-4 overflow-hidden cursor-pointer" onClick={() => selectedUser.photoURL && setPreviewImageFull(selectedUser.photoURL)}>{selectedUser.photoURL ? <img src={selectedUser.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-4xl bg-black text-white">👤</div>}</div><h2 className="text-2xl font-black">{selectedUser.name}</h2><p className="text-xs opacity-50 mb-4">{selectedUser.email}</p><div className="w-full bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/20 mb-4"><div className="text-[10px] uppercase font-bold text-cyan-500">Total Spent</div><div className="text-2xl font-mono font-bold">฿{selectedUser.totalSpent?.toLocaleString()}</div></div><div className="text-left w-full space-y-2 text-xs opacity-70"><div><b>Real Name:</b> {selectedUser.realName || "-"}</div><div><b>Phone:</b> {selectedUser.phone || "-"}</div><div><b>Line:</b> {selectedUser.lineId || "-"}</div><div><b>Address:</b> {selectedUser.address || "-"}</div></div></div><div className="flex-1 p-6 flex flex-col overflow-hidden"><div className="flex justify-between items-center mb-4"><h3 className="font-bold uppercase tracking-widest opacity-60">Transaction History</h3><button onClick={() => setShowUserModal(false)}><FaTimes className="hover:text-red-500"/></button></div><div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">{transactions.filter(t => t.userId === selectedUser.id).map(t => (<div key={t.id} className="p-3 rounded-xl border bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10" onClick={() => t.paymentSlip && setPreviewImageFull(t.paymentSlip)}><div><div className="text-[10px] opacity-50 font-mono">{t.timestamp?.toDate().toLocaleString()}</div><div className="font-bold text-sm">{t.note}</div></div><div className="text-right"><div className="font-mono font-bold text-emerald-500">+{t.amount?.toLocaleString()}</div></div></div>))}{transactions.filter(t => t.userId === selectedUser.id).length === 0 && <div className="text-center opacity-30 py-10">No history found</div>}</div></div></motion.div></motion.div>)}
        {editingTransaction && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={cn("w-full max-w-md p-8 rounded-[2rem] border shadow-2xl", isDark ? "bg-[#1a1a1a] border-white/20" : "bg-white")} onClick={e => e.stopPropagation()}><h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FaEdit className="text-blue-500"/> Edit Transaction</h3><div className="space-y-4"><InputGroup label="Note" value={editTransNote} onChange={setEditTransNote} isDark={isDark} /><div className="flex gap-2"><UploadBox label="Slip" preview={editTransSlip} onClick={() => editTransSlipRef.current?.click()} isDark={isDark} /><UploadBox label="Work" preview={editTransWork} onClick={() => editTransWorkRef.current?.click()} isDark={isDark} color="cyan" /></div><input type="file" ref={editTransSlipRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setEditTransSlip)} /><input type="file" ref={editTransWorkRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setEditTransWork)} /><div className="flex gap-3 pt-4"><button onClick={() => setEditingTransaction(null)} className="flex-1 py-3 rounded-xl opacity-50 hover:opacity-100 font-bold">{t.cancel}</button><button onClick={handleUpdateTransaction} disabled={loading} className="flex-1 py-3 rounded-xl bg-cyan-500 text-black font-bold hover:scale-105 transition">{loading ? t.processing : t.save}</button></div></div></motion.div></motion.div>)}
      </AnimatePresence>
    </div>
  );
}

// --- SUB COMPONENTS ---
function StatCard({ title, value, icon, color, isDark }: any) {
    const colors:any = { emerald: "text-emerald-500", blue: "text-blue-500", purple: "text-purple-500" };
    return <div className={cn("p-6 rounded-3xl border flex items-center gap-4 transition hover:scale-105 bg-gradient-to-br", isDark?"from-white/5 to-white/0 border-white/10":"from-white to-slate-50 border-slate-200 shadow-sm")}>
        <div className={cn("text-3xl", colors[color])}>{icon}</div>
        <div><div className="text-[10px] uppercase opacity-50 font-bold tracking-widest">{title}</div><div className="text-2xl font-black">{value}</div></div>
    </div>
}
function TabButton({ active, onClick, icon, label, isDark }: any) {
    return <button onClick={onClick} className={cn("flex items-center gap-2 px-6 py-3 rounded-full transition-all border font-bold text-xs uppercase tracking-wide", active ? (isDark ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/20" : "bg-black text-white border-black") : (isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-gray-50"))}>{icon} {label}</button>;
}
function InputGroup({ label, type = "text", value, onChange, className = "", required = false, isDark, placeholder }: any) {
    return <div className={`space-y-1 ${className}`}><label className="text-[9px] uppercase opacity-50 ml-2 font-bold">{label} {required && "*"}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} className={cn("w-full p-3 rounded-xl border outline-none transition-all bg-transparent focus:ring-2 focus:ring-cyan-500/50", isDark ? "border-white/20 focus:border-cyan-500" : "border-gray-300 focus:border-blue-500")} /></div>;
}
function UploadBox({ label, preview, onClick, isDark, color = "white" }: any) {
    return <div className="space-y-1 cursor-pointer group flex-1" onClick={onClick}><label className="text-[9px] uppercase opacity-50 ml-1 group-hover:opacity-100 transition">{label}</label><div className={cn("h-16 w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all relative group-hover:border-cyan-500", preview ? "border-solid border-cyan-500" : (color==='cyan'?'border-cyan-500':'border-white/30'), isDark ? "bg-black/20 hover:bg-white/5" : "bg-gray-50 hover:bg-gray-100")}>{preview ? <img src={preview} className="w-full h-full object-cover" /> : <FaCamera className="opacity-30 group-hover:scale-110 transition" />}</div></div>;
}
function ActionButton({ onClick, icon, color, isDark, title }: any) {
    const colors: any = { gray: isDark?"hover:bg-white/20":"hover:bg-gray-200", blue: isDark?"hover:bg-blue-500/20 text-blue-400":"hover:bg-blue-100 text-blue-600", red: isDark?"hover:bg-red-500/20 text-red-400":"hover:bg-red-100 text-red-600", green: isDark?"hover:bg-green-500/20 text-green-400":"hover:bg-green-100 text-green-600" };
    return <button onClick={(e) => { e.stopPropagation(); onClick(); }} title={title} className={cn("p-2 rounded-lg transition-colors relative z-50 hover:scale-110 active:scale-95", colors[color])}>{icon}</button>;
}