"use client";

/**
 * 🚀 CROCWORK SERVICES (V11.1 - Final Fixed)
 * - [FIX] Profile Image: Changed <img> to <Image /> to support 'unoptimized' prop.
 * - [FEAT] Gallery Zoom: Full-screen lightbox with Left/Right navigation.
 * - [UX] Keyboard Support: Arrow keys to slide images.
 * - [BASE] 100% based on "ดีที่สุด.txt" logic.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // ✅ Import Image
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaSearch, FaStar, FaCheckCircle, FaTimes, 
  FaSignInAlt, FaFacebook, FaLine, FaEnvelope, FaImages, FaFilter,
  FaChevronLeft, FaChevronRight, FaQuoteLeft, FaColumns, FaCamera, FaPen,
  FaTrophy, FaInfoCircle, FaCrown, FaTrashAlt, FaBars, FaCog, FaSignOutAlt, FaChevronDown,
  FaLaptopCode, FaPencilRuler, FaBullhorn, FaLanguage, FaRobot, FaMobileAlt, FaChartLine,
  FaMapMarkerAlt, FaPhone, FaFileAlt, FaPalette, FaVideo, FaTools, FaChalkboardTeacher, FaFileArchive,
  FaWpforms, FaLayerGroup, FaSearchPlus
} from "react-icons/fa";

// --- IMPORTS FROM LANDING PAGE ---
import { SnowBackground } from "@/components/SnowBackground";
import { UnderwaterBackground } from "@/components/UnderwaterBackground";

const cn = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(" ");

// --- 👤 THE BOSS PROFILE ---
const THE_BOSS = {
  name: "Sarawut Phusee",
  role: "Full Stack Developer",
  avatar: "/croc-mascot.jpg",
  facebook: "https://www.facebook.com/sarawut.phusee",
  line: "sxrx_wut18.",
  email: "skizzkat@gmail.com",
  phone: "0959670875",
  location: "Chiang Mai, Thailand",
  responseTime: "Within 1 hr",
  bio: "Professional Freelancer specialized in Web Development, UX/UI Design, and Automation Systems. Delivered over 100+ projects with high satisfaction."
};

// --- 📂 CATEGORY DEFINITIONS ---
const HERO_CATEGORIES = [
  { id: "docs", name: "Documents & Forms", icon: <FaFileAlt />, color: "from-blue-400 to-indigo-500", keywords: ["word", "doc", "pdf", "report", "type", "excel", "sheet", "form", "fill", "email", "writing", "เอกสาร", "รายงาน", "กรอกข้อมูล"] },
  { id: "art", name: "Art & Design", icon: <FaPalette />, color: "from-pink-500 to-rose-500", keywords: ["design", "art", "logo", "banner", "model", "3d", "canva", "psd", "ai", "figma", "ui", "ux", "poster", "draw", "ออกแบบ", "โลโก้", "กราฟิก"] },
  { id: "web_dev", name: "Web & Coding", icon: <FaLaptopCode />, color: "from-cyan-500 to-blue-600", keywords: ["web", "html", "css", "javascript", "react", "next", "vue", "node", "php", "sql", "code", "bug", "fix", "program", "เว็บไซต์", "เขียนโค้ด", "แก้บั๊ก"] },
  { id: "iot", name: "Arduino & IoT", icon: <FaRobot />, color: "from-emerald-500 to-green-600", keywords: ["arduino", "robot", "iot", "sensor", "hardware", "circuit", "c++", "embedded", "หุ่นยนต์", "อาดูโน่"] },
  { id: "video", name: "Video & Multimedia", icon: <FaVideo />, color: "from-purple-500 to-violet-600", keywords: ["video", "edit", "premiere", "after effect", "tiktok", "youtube", "cut", "motion", "vlog", "ตัดต่อ", "วิดีโอ"] },
  { id: "tech_support", name: "IT Support & Teach", icon: <FaTools />, color: "from-orange-500 to-amber-500", keywords: ["install", "download", "compress", "zip", "rar", "teach", "lesson", "consult", "setup", "software", "ลงโปรแกรม", "สอน", "บีบอัดไฟล์"] },
];

const VIP_TIERS = [
  { level: 10, min: 200000, discount: 60 },
  { level: 9, min: 150000, discount: 48 },
  { level: 8, min: 125000, discount: 42 },
  { level: 7, min: 100000, discount: 36 },
  { level: 6, min: 80000, discount: 28 },
  { level: 5, min: 50000, discount: 24 },
  { level: 4, min: 30000, discount: 18 },
  { level: 3, min: 10000, discount: 14 },
  { level: 2, min: 4000, discount: 10 },
  { level: 1, min: 1000, discount: 4 },
  { level: 0, min: 0, discount: 0 },
];

const getCategoryStyle = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes("word") || lower.includes("doc") || lower.includes("report") || lower.includes("เอกสาร")) return { icon: <FaFileAlt />, color: "from-blue-400 to-indigo-500" };
    if (lower.includes("design") || lower.includes("art") || lower.includes("logo") || lower.includes("model") || lower.includes("canva")) return { icon: <FaPalette />, color: "from-pink-500 to-rose-500" };
    if (lower.includes("web") || lower.includes("code") || lower.includes("program") || lower.includes("bug")) return { icon: <FaLaptopCode />, color: "from-cyan-500 to-blue-600" };
    if (lower.includes("arduino") || lower.includes("robot") || lower.includes("iot")) return { icon: <FaRobot />, color: "from-emerald-500 to-green-600" };
    if (lower.includes("video") || lower.includes("edit") || lower.includes("premiere")) return { icon: <FaVideo />, color: "from-purple-500 to-violet-600" };
    if (lower.includes("install") || lower.includes("zip") || lower.includes("support") || lower.includes("สอน")) return { icon: <FaTools />, color: "from-orange-500 to-amber-500" };
    return { icon: <FaLayerGroup />, color: "from-gray-500 to-slate-600" };
};

// --- LANGUAGE DICTIONARY ---
const TEXT = {
  en: { dashboard: "DASHBOARD", ranking: "RANKING", login: "LOGIN", logout: "LOGOUT", menu: "MENU", search_placeholder: "Search for services...", filter_label: "Filter:", all_cats: "All Services", sort_newest: "Newest", sort_price_asc: "Price: Low to High", sort_price_desc: "Price: High to Low", sort_rating: "Top Rated", min_price: "Min Price", max_price: "Max Price", no_services: "No Services Found", try_adjust: "Try adjusting your filters", starting_at: "Starting at", seller_info: "Service Provider", response_time: "Response", about_service: "About Service", verified_reviews: "Verified Reviews", write_review: "Write a Review", close_contact: "Close Contact", hire_diver: "Hire Me Now", click_contact: "Click below to contact me directly", days: "Days", revs: "Revs", vip_note: "Discount does not apply to XP calculation", submit_review: "Submit Review", image_added: "Image Added", add_photo: "Add Photo", review_placeholder: "Write your experience...", delete_confirm: "Are you sure you want to delete this review?", review_submitted: "✅ Review Submitted!", login_alert: "Please login to review", account: "Account", browse_cat: "Explore Categories", about_studio: "About CrocWork Studio", contact_us: "Contact Us", footer_copy: "© 2026 CrocWork Studio. All rights reserved." },
  th: { dashboard: "แดชบอร์ด", ranking: "จัดอันดับ", login: "เข้าสู่ระบบ", logout: "ออกจากระบบ", menu: "เมนูหลัก", search_placeholder: "ค้นหาบริการที่คุณต้องการ...", filter_label: "ตัวกรอง:", all_cats: "บริการทั้งหมด", sort_newest: "มาใหม่ล่าสุด", sort_price_asc: "ราคา: ต่ำ -> สูง", sort_price_desc: "ราคา: สูง -> ต่ำ", sort_rating: "คะแนนสูงสุด", min_price: "ราคาต่ำสุด", max_price: "ราคาสูงสุด", no_services: "ไม่พบสินค้า", try_adjust: "ลองปรับตัวกรองดูนะ", starting_at: "เริ่มต้นที่", seller_info: "ผู้ให้บริการ", response_time: "ตอบกลับ", about_service: "เกี่ยวกับบริการนี้", verified_reviews: "รีวิวจากลูกค้าจริง", write_review: "เขียนรีวิว", close_contact: "ปิดช่องทางติดต่อ", hire_diver: "จ้างงานผมเลย", click_contact: "คลิกด้านล่างเพื่อติดต่อผมโดยตรง", days: "วัน", revs: "ครั้ง (แก้)", vip_note: "ส่วนลดจะไม่นำมาคิดในส่วนค่าประสบการณ์", submit_review: "ส่งรีวิว", image_added: "แนบรูปแล้ว", add_photo: "แนบรูปงาน", review_placeholder: "เล่าประสบการณ์ของคุณ...", delete_confirm: "คุณแน่ใจหรือไม่ว่าจะลบรีวิวนี้?", review_submitted: "✅ ส่งรีวิวเรียบร้อย!", login_alert: "กรุณาเข้าสู่ระบบก่อนเขียนรีวิว", account: "บัญชีผู้ใช้", browse_cat: "หมวดหมู่ยอดนิยม", about_studio: "เกี่ยวกับ CrocWork Studio", contact_us: "ช่องทางติดต่อ", footer_copy: "© 2026 CrocWork Studio. สงวนลิขสิทธิ์." }
};

export default function ServicesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState<"underwater" | "snow">("underwater");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [lang, setLang] = useState<"en" | "th">("th");
  const [expandSettings, setExpandSettings] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<any>(null); 
  const [services, setServices] = useState<any[]>([]); 
  const [systemInfo, setSystemInfo] = useState("Loading...");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedService, setSelectedService] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0); 
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [showContact, setShowContact] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const reviewFileRef = useRef<HTMLInputElement>(null);

  // ✅ State for Gallery Zoom
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);

  const t = TEXT[lang as keyof typeof TEXT];

  useEffect(() => {
    setMounted(true);
    const s = localStorage.getItem("croc_scene");
    const t = localStorage.getItem("croc_theme");
    const l = localStorage.getItem("croc_lite"); 
    const lng = localStorage.getItem("croc_lang"); 
    if (s) setScene(s as any);
    if (t) setTheme(t as any);
    if (l) setIsLiteMode(l === "true");
    if (lng) setLang(lng as "en" | "th");

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            const userSnap = await getDoc(doc(db, "users", currentUser.uid));
            if (userSnap.exists()) setUser({ ...currentUser, ...userSnap.data() });
            else setUser(currentUser);
        } else setUser(null);
    });
    
    const unsubDB = onSnapshot(collection(db, "services"), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServices(items);
        if (selectedService) {
            const updated = items.find(i => i.id === selectedService.id);
            if (updated) setSelectedService(updated);
        }
    });

    const unsubLog = onSnapshot(doc(db, "system", "info"), (doc) => {
        if (doc.exists()) setSystemInfo(doc.data().text || "No recent updates.");
    });

    return () => { unsubAuth(); unsubDB(); unsubLog(); };
  }, [selectedService?.id]);

  useEffect(() => {
    if (mounted) {
        localStorage.setItem("croc_scene", scene);
        localStorage.setItem("croc_theme", theme);
        localStorage.setItem("croc_lite", String(isLiteMode));
        localStorage.setItem("croc_lang", lang); 
    }
  }, [scene, theme, isLiteMode, lang, mounted]);

  // ✅ Keyboard Navigation for Zoom
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (zoomedImageIndex === null || !selectedService?.images) return;
          if (e.key === "ArrowRight") navigateZoom(1);
          if (e.key === "ArrowLeft") navigateZoom(-1);
          if (e.key === "Escape") setZoomedImageIndex(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomedImageIndex, selectedService]);

  const navigateZoom = (direction: number) => {
      if (zoomedImageIndex === null || !selectedService?.images) return;
      const newIndex = zoomedImageIndex + direction;
      if (newIndex >= 0 && newIndex < selectedService.images.length) {
          setZoomedImageIndex(newIndex);
      }
  };
  
  const getVIPInfo = (totalSpent: number = 0) => VIP_TIERS.find(t => totalSpent >= t.min) || VIP_TIERS[VIP_TIERS.length - 1];
  const calculateDiscountedPrice = (originalPrice: number) => user ? Math.floor(originalPrice * (1 - getVIPInfo(user.totalSpent || 0).discount / 100)) : originalPrice;
  const handleLogout = async () => { await signOut(auth); setShowProfileMenu(false); setIsMobileMenuOpen(false); };
  const categories = useMemo(() => ["all", ...Array.from(new Set(services.map(s => s.category).filter(Boolean)))], [services]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description?.toLowerCase().includes(searchQuery.toLowerCase());
      let matchCat = false;
      if (filterCategory === "all") matchCat = true;
      else {
          const catDef = HERO_CATEGORIES.find(c => c.id === filterCategory);
          if (catDef && catDef.keywords) {
              const contentToCheck = `${s.category} ${s.title} ${s.description}`.toLowerCase();
              matchCat = catDef.keywords.some(k => contentToCheck.includes(k));
          } else matchCat = s.category === filterCategory;
      }
      const price = s.packages?.basic?.price || 0;
      const matchMin = minPrice ? price >= Number(minPrice) : true;
      const matchMax = maxPrice ? price <= Number(maxPrice) : true;
      return matchSearch && matchCat && matchMin && matchMax;
    }).sort((a, b) => {
        if (sortBy === "priceAsc") return (a.packages?.basic?.price || 0) - (b.packages?.basic?.price || 0);
        if (sortBy === "priceDesc") return (b.packages?.basic?.price || 0) - (a.packages?.basic?.price || 0);
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return 0; 
    });
  }, [services, searchQuery, filterCategory, minPrice, maxPrice, sortBy]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentServices = filteredServices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const paginate = (pageNumber: number) => { setCurrentPage(pageNumber); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleOpenService = (service: any) => { setSelectedService(service); setActiveImageIndex(0); setSelectedPackage('basic'); setShowContact(false); setShowReviewForm(false); };
  const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setReviewImage(reader.result as string); reader.readAsDataURL(file); } };
  const handleSubmitReview = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!user) return alert(t.login_alert); 
      if (!reviewComment) return alert("Please write a comment"); 
      setSubmittingReview(true); 
      try { 
          const serviceRef = doc(db, "services", selectedService.id); 
          const serviceSnap = await getDoc(serviceRef); 
          if (serviceSnap.exists()) { 
              const currentData = serviceSnap.data(); 
              const currentReviews = currentData.reviews || []; 
              const newReview = { uid: user.uid, user: user.displayName || "Anonymous", avatar: user.photoURL || null, star: reviewRating, comment: reviewComment, image: reviewImage, date: new Date().toISOString() }; 
              const allReviews = [...currentReviews, newReview]; 
              const totalStars = allReviews.reduce((acc: number, r: any) => acc + Number(r.star), 0); 
              const newAverage = (totalStars / allReviews.length).toFixed(1); 
              await updateDoc(serviceRef, { reviews: arrayUnion(newReview), rating: Number(newAverage), reviewsCount: allReviews.length }); 
              alert(t.review_submitted); setShowReviewForm(false); setReviewComment(""); setReviewImage(null); setReviewRating(5); 
          } 
      } catch (error: any) { console.error(error); alert("Error: " + error.message); } 
      setSubmittingReview(false); 
  };
  const handleDeleteReview = async (reviewToDelete: any) => {
      if(!confirm(t.delete_confirm)) return;
      try {
          const serviceRef = doc(db, "services", selectedService.id);
          const serviceSnap = await getDoc(serviceRef);
          if (serviceSnap.exists()) {
              const data = serviceSnap.data();
              const updatedReviews = data.reviews.filter((r:any) => r.date !== reviewToDelete.date);
              const totalStars = updatedReviews.reduce((acc: number, r: any) => acc + Number(r.star), 0);
              const newAverage = updatedReviews.length > 0 ? (totalStars / updatedReviews.length).toFixed(1) : 0;
              await updateDoc(serviceRef, { reviews: updatedReviews, rating: Number(newAverage), reviewsCount: updatedReviews.length });
          }
      } catch (error: any) { alert("Error deleting review: " + error.message); }
  };

  const isDark = theme === "dark";
  const bgColor = isDark ? "bg-[#020617]" : "bg-[#f8fafc]";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const panelColor = isDark ? "bg-black/40 border-white/10" : "bg-white/60 border-slate-200";

  if (!mounted) return <div className="h-screen w-screen bg-black" />;

  return (
    <div className={cn("fixed inset-0 h-[100dvh] w-screen overflow-hidden flex flex-col select-none transition-colors duration-500", bgColor, textColor)}>
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full">
        {!isLiteMode ? ( <motion.div className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}> {scene === "underwater" && <UnderwaterBackground intensity={1} speed={0.4} />} {scene === "snow" && <SnowBackground count={150} intensity={0.8} speed={0.6} />} </motion.div> ) : <div className={cn("w-full h-full", isDark ? "bg-slate-950" : "bg-slate-50")} />}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-1" />
      </div>

      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative z-50 p-4 md:p-6 shrink-0 flex justify-between items-center h-[12%]">
        <div onClick={() => router.push('/')} className={cn("flex gap-4 items-center p-2 pr-6 rounded-[3rem] border backdrop-blur-md cursor-pointer group hover:border-cyan-500/50 transition-all duration-500", panelColor)}>
          <div className="relative w-10 h-10 md:w-16 md:h-16 overflow-hidden rounded-full border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-transform">
            <Image src="/croc-mascot.jpg" alt="Mascot" fill className="object-cover" priority />
          </div>
          <div className="hidden sm:flex flex-col">
            <h2 className="text-sm md:text-lg font-serif font-black uppercase tracking-tighter leading-none">CrocWork</h2>
            <p className="text-[10px] text-cyan-500 font-mono tracking-widest mt-1 opacity-80">FREELANCE_HUB</p>
          </div>
        </div>
        <div className="hidden md:flex flex-1 max-w-lg mx-6">
            <div className={cn("w-full flex items-center px-6 py-3 rounded-[2rem] border backdrop-blur-md transition-all focus-within:ring-1 focus-within:ring-cyan-500/50", panelColor)}>
              <FaSearch className="opacity-40 mr-3" />
              <input className="bg-transparent outline-none w-full text-sm font-medium placeholder-current/40" placeholder={t.search_placeholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
            </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          {user ? (
              <div className="flex gap-3 items-center">
                <button onClick={() => router.push('/dashboard')} className={cn("flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs tracking-widest border transition-all hover:scale-105", isDark ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-blue-500/50 bg-blue-500/10 text-blue-600")}> <FaColumns /> {t.dashboard} </button>
                <button onClick={() => router.push('/ranking')} className={cn("flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs tracking-widest border transition-all hover:scale-105", isDark ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-orange-500/50 bg-orange-500/10 text-orange-600")}> <FaTrophy /> {t.ranking} </button>
                <div className="relative">
                    <button onClick={() => setShowProfileMenu(!showProfileMenu)} className={cn("flex items-center gap-3 p-2 pl-6 rounded-[3rem] border backdrop-blur-md transition-all hover:bg-white/5 active:scale-95", panelColor)}>
                        <div className="text-right hidden sm:block"> <div className="text-xs font-bold">{user.displayName || "Diver"}</div> <div className="text-[9px] opacity-60 uppercase tracking-widest">Online</div> </div>
                        {/* ✅ [FIXED] Changed <img> to <Image /> with 'unoptimized' to prevent domain errors */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-[2px]"> 
                            <div className="w-full h-full rounded-full overflow-hidden bg-black relative"> 
                                {user.photoURL ? <Image src={user.photoURL} alt="Profile" fill className="object-cover" unoptimized/> : <div className="w-full h-full flex items-center justify-center">👤</div>} 
                            </div> 
                        </div>
                        <FaChevronDown className={cn("text-xs opacity-50 ml-2 transition-transform duration-300", showProfileMenu ? "rotate-180" : "")} />
                    </button>
                    <AnimatePresence> {showProfileMenu && ( <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className={cn("absolute top-full right-0 mt-2 w-48 p-2 rounded-2xl border flex flex-col gap-1 shadow-2xl backdrop-blur-xl origin-top-right overflow-hidden", isDark ? "bg-black/90 border-white/10" : "bg-white/90 border-slate-200")}> <div className={cn("text-[8px] font-black uppercase px-3 py-2 opacity-40 tracking-widest", isDark ? "text-white" : "text-black")}>{t.account}</div> <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider text-red-500 hover:bg-red-500/10 transition-colors w-full text-left"> <FaSignOutAlt /> {t.logout} </button> </motion.div> )} </AnimatePresence>
                </div>
              </div>
          ) : <button onClick={() => router.push('/login')} className="px-8 py-4 rounded-full font-black text-xs tracking-widest bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2"><FaSignInAlt /> {t.login}</button>}
        </div>
        <div className="flex md:hidden"> <button onClick={() => setIsMobileMenuOpen(true)} className={cn("p-3 rounded-full border shadow-lg transition-transform active:scale-95", panelColor)}> <FaBars className="text-lg" /> </button> </div>
      </motion.header>

      <AnimatePresence> {isMobileMenuOpen && ( <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={cn("fixed inset-0 z-[200] flex flex-col p-6 backdrop-blur-xl", isDark ? "bg-black/90" : "bg-white/95")}> <div className="flex justify-end"> <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full border border-current/20 hover:bg-red-500 hover:text-white transition-colors"> <FaTimes className="text-xl" /> </button> </div> <div className="flex flex-col items-center mt-8 space-y-6"> {user ? ( <div className="flex flex-col items-center gap-2 mb-6"> <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-[2px] shadow-2xl"> <div className="w-full h-full rounded-full overflow-hidden bg-black"> {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>} </div> </div> <div className="text-center"> <h3 className="text-xl font-bold">{user.displayName || "Diver"}</h3> <p className="text-xs opacity-60">Level {user.vipLevel || 0}</p> </div> </div> ) : ( <div className="text-center mb-6"> <h2 className="text-2xl font-serif font-black uppercase tracking-widest text-cyan-500">CrocWork</h2> <p className="text-xs opacity-50">Welcome Guest</p> </div> )} <div className="w-full max-w-xs space-y-3"> <button onClick={() => { setIsMobileMenuOpen(false); router.push('/'); }} className={cn("w-full py-4 rounded-2xl font-bold border text-sm flex items-center justify-center gap-3 active:scale-95 transition", panelColor)}> 🏠 Home </button> {user && ( <> <button onClick={() => { setIsMobileMenuOpen(false); router.push('/dashboard'); }} className={cn("w-full py-4 rounded-2xl font-bold border text-sm flex items-center justify-center gap-3 active:scale-95 transition", isDark ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" : "border-blue-500/30 text-blue-600 bg-blue-500/10")}> <FaColumns /> {t.dashboard} </button> <button onClick={() => { setIsMobileMenuOpen(false); router.push('/ranking'); }} className={cn("w-full py-4 rounded-2xl font-bold border text-sm flex items-center justify-center gap-3 active:scale-95 transition", isDark ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" : "border-orange-500/30 text-orange-600 bg-orange-500/10")}> <FaTrophy /> {t.ranking} </button> </> )} {!user ? ( <button onClick={() => router.push('/login')} className="w-full py-4 rounded-2xl bg-cyan-500 text-black font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"> <FaSignInAlt /> {t.login} </button> ) : ( <button onClick={handleLogout} className="w-full py-4 rounded-2xl border border-red-500/50 text-red-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-8"> <FaSignOutAlt /> {t.logout} </button> )} </div> </div> </motion.div> )} </AnimatePresence>

      <button onClick={() => setShowInfoModal(true)} className="fixed top-28 right-6 z-[200] bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/20 hover:scale-110 transition shadow-lg text-cyan-400">
          <FaInfoCircle className="text-xl"/>
      </button>

      <main className="relative z-20 flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
         <div className="max-w-7xl mx-auto space-y-8">
            <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest opacity-60 ml-2 border-l-4 border-cyan-500 pl-3">{t.browse_cat}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.filter(c => c !== "all").map((catName) => {
                        const style = getCategoryStyle(catName);
                        return (
                            <motion.button key={catName} whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }} onClick={() => { setFilterCategory(catName); setCurrentPage(1); }} className={cn("flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-300 group cursor-pointer relative z-20", panelColor, filterCategory === catName ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "hover:bg-white/5")}>
                                <div className={`w-12 h-12 rounded-2xl mb-3 flex items-center justify-center text-2xl text-white shadow-lg bg-gradient-to-br ${style.color} group-hover:scale-110 transition-transform`}> {style.icon} </div>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight opacity-80 group-hover:opacity-100">{catName}</span>
                            </motion.button>
                        );
                    })}
                    {categories.length <= 1 && ( <div className="col-span-full text-center text-xs opacity-40 py-8"> No categories yet. Add services to see them here! </div> )}
                </div>
            </section>

            <section className={cn("p-8 rounded-[2.5rem] border backdrop-blur-md flex flex-col md:flex-row items-center gap-8 relative overflow-hidden", panelColor)}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden shrink-0"> <Image src={THE_BOSS.avatar} alt={THE_BOSS.name} fill className="object-cover" /> </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                    <h2 className="text-3xl font-serif font-black uppercase tracking-tight">{t.about_studio}</h2>
                    <p className="opacity-70 text-sm leading-relaxed max-w-2xl">{THE_BOSS.bio}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                        <a href={THE_BOSS.facebook} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"><FaFacebook/> Facebook</a>
                        <a href={`https://line.me/ti/p/~${THE_BOSS.line}`} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition"><FaLine/> Line</a>
                        <a href={`mailto:${THE_BOSS.email}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-600 text-white text-xs font-bold hover:bg-gray-700 transition"><FaEnvelope/> Email</a>
                    </div>
                </div>
            </section>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/5 p-4 rounded-[2rem] border border-white/5 backdrop-blur-sm relative z-20">
                <div className="w-full md:w-auto flex items-center px-4 py-2 rounded-xl border bg-transparent opacity-80"> <FaFilter className="mr-2 text-xs opacity-50"/> <span className="text-xs font-bold uppercase tracking-wide">{t.filter_label}</span> </div>
                <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto">
                    <select value={filterCategory} onChange={e=>{setFilterCategory(e.target.value); setCurrentPage(1);}} className={cn("px-4 py-2 rounded-xl border text-xs outline-none bg-transparent", isDark?"border-white/10 text-white":"border-black/10 text-black")}> <option value="all" className="text-black">{t.all_cats}</option> {categories.map(c => c !== "all" && <option key={c} value={c} className="text-black">{c}</option>)} </select>
                    <select value={sortBy} onChange={e=>{setSortBy(e.target.value); setCurrentPage(1);}} className={cn("px-4 py-2 rounded-xl border text-xs outline-none bg-transparent", isDark?"border-white/10 text-white":"border-black/10 text-black")}> <option value="newest" className="text-black">{t.sort_newest}</option> <option value="priceAsc" className="text-black">{t.sort_price_asc}</option> <option value="priceDesc" className="text-black">{t.sort_price_desc}</option> <option value="rating" className="text-black">{t.sort_rating}</option> </select>
                    <input type="number" placeholder={t.min_price} value={minPrice} onChange={e=>{setMinPrice(e.target.value); setCurrentPage(1);}} className={cn("w-24 px-4 py-2 rounded-xl border text-xs outline-none bg-transparent", isDark?"border-white/10":"border-black/10")}/>
                    <input type="number" placeholder={t.max_price} value={maxPrice} onChange={e=>{setMaxPrice(e.target.value); setCurrentPage(1);}} className={cn("w-24 px-4 py-2 rounded-xl border text-xs outline-none bg-transparent", isDark?"border-white/10":"border-black/10")}/>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                {filteredServices.length === 0 ? ( <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-full text-center py-20 opacity-50"><p className="text-xl font-bold">{t.no_services}</p><p className="text-sm">{t.try_adjust}</p></motion.div> ) : (
                    currentServices.map((service, i) => (
                        <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} key={service.id} onClick={() => handleOpenService(service)} className={cn("group rounded-[2rem] overflow-hidden border cursor-pointer hover:-translate-y-1 transition-all duration-500 hover:border-cyan-500/30 hover:shadow-2xl flex flex-col relative z-30", panelColor)}>
                            <div className={`h-48 w-full bg-gradient-to-tr ${service.thumbnail || 'from-gray-800 to-black'} relative overflow-hidden`}>
                                {service.images?.length > 0 ? (<img src={service.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />) : <div className="w-full h-full flex items-center justify-center opacity-30"><FaImages className="text-4xl"/></div>}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-wider border border-white/10">{service.category}</div>
                                <div className="absolute bottom-3 right-3 p-2 bg-white/10 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition hover:bg-white/20 hover:scale-110 z-40" onClick={(e) => { e.stopPropagation(); setSelectedService(service); setZoomedImageIndex(0); }}>
                                    <FaSearchPlus className="text-xs" />
                                </div>
                            </div>
                            <div className="p-5 flex flex-col flex-1"><div className="flex items-center justify-between mb-2 opacity-60 text-[9px] uppercase font-black tracking-widest"><span>{THE_BOSS.name}</span><span className="flex items-center gap-1 text-yellow-400"><FaStar/> {service.rating || "5.0"}</span></div><h3 className="font-bold text-sm leading-relaxed mb-4 line-clamp-2 h-10">{service.title}</h3><div className="mt-auto flex justify-between items-end border-t border-current/10 pt-4"><div className="text-[9px] opacity-40 uppercase tracking-widest">{t.starting_at}</div><div className={cn("font-mono font-bold text-lg", isDark ? "text-cyan-400" : "text-blue-600")}>฿{service.packages?.basic?.price?.toLocaleString()}</div></div></div>
                        </motion.div>
                    ))
                )}
                </AnimatePresence>
            </div>

            {filteredServices.length > itemsPerPage && (
                <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className={cn("p-3 rounded-xl transition-all disabled:opacity-30", panelColor, "hover:bg-white/10")}><FaChevronLeft /></button>
                    <span className="text-sm font-bold font-mono opacity-70">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className={cn("p-3 rounded-xl transition-all disabled:opacity-30", panelColor, "hover:bg-white/10")}><FaChevronRight /></button>
                </div>
            )}

            <footer className={cn("mt-16 p-8 rounded-[2rem] border text-center space-y-4", isDark ? "bg-black/40 border-white/10" : "bg-white/60 border-slate-200")}>
                <div className="flex justify-center gap-6 text-2xl opacity-60">
                    <a href={THE_BOSS.facebook} target="_blank" className="hover:text-blue-500 transition hover:scale-110"><FaFacebook/></a>
                    <a href={`https://line.me/ti/p/~${THE_BOSS.line}`} target="_blank" className="hover:text-green-500 transition hover:scale-110"><FaLine/></a>
                    <a href={`mailto:${THE_BOSS.email}`} className="hover:text-red-500 transition hover:scale-110"><FaEnvelope/></a>
                </div>
                <div className="flex flex-wrap justify-center gap-4 text-xs opacity-50 font-bold uppercase tracking-widest">
                    <span>{THE_BOSS.location}</span> <span>•</span> <a href={`tel:${THE_BOSS.phone}`} className="hover:text-cyan-500 transition"><FaPhone className="inline mr-1"/>{THE_BOSS.phone}</a> <span>•</span> <span>{THE_BOSS.email}</span>
                </div>
                <div className="text-[10px] opacity-30 pt-4 border-t border-current/10"> {t.footer_copy} </div>
            </footer>
         </div>
      </main>

      <AnimatePresence>
        {showInfoModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowInfoModal(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={cn("w-full max-w-2xl max-h-[90vh] rounded-[2rem] border overflow-hidden flex flex-col shadow-2xl p-8", isDark ? "bg-[#121212] border-white/20" : "bg-white")} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6">
                        <div> <h2 className="text-2xl font-black uppercase tracking-tighter text-cyan-500">System Updates</h2> <p className="text-xs opacity-60">Latest patch notes & features</p> </div>
                        <button onClick={() => setShowInfoModal(false)}><FaTimes className="text-xl hover:text-red-500"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar text-sm leading-relaxed space-y-4 opacity-80 whitespace-pre-line"> {systemInfo} </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedService && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedService(null)}>
              <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }} className={cn("w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border", panelColor)} onClick={e => e.stopPropagation()}>
                <div className="md:w-1/3 bg-black/20 p-6 flex flex-col border-r border-white/5">
                    {/* ✅ CLICK TO ZOOM IN MODAL */}
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-3 border border-white/10 bg-black cursor-zoom-in group" onClick={() => setZoomedImageIndex(activeImageIndex)}>
                        {selectedService.images?.length > 0 ? ( <img src={selectedService.images[activeImageIndex]} className="w-full h-full object-contain" /> ) : <div className="w-full h-full flex items-center justify-center opacity-30"><FaImages className="text-4xl"/></div>}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30"><FaSearchPlus className="text-3xl text-white"/></div>
                    </div>
                    {selectedService.images?.length > 1 && ( <div className="flex gap-2 overflow-x-auto pb-2 mb-4 custom-scrollbar"> {selectedService.images.map((img:string, idx:number) => ( <div key={idx} onClick={() => setActiveImageIndex(idx)} className={cn("w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all", activeImageIndex === idx ? "border-cyan-500 opacity-100" : "border-transparent opacity-50 hover:opacity-100")}> <img src={img} className="w-full h-full object-cover" /> </div> ))} </div> )}
                    <div className="mt-auto"> <h4 className="text-[10px] uppercase font-black tracking-widest opacity-50 mb-2">{t.seller_info}</h4> <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5"> <div className="w-10 h-10 rounded-full bg-cyan-500 p-0.5 overflow-hidden"> <img src={THE_BOSS.avatar} className="w-full h-full object-cover rounded-full" /> </div> <div> <div className="font-bold text-sm">{THE_BOSS.name}</div> <div className="text-[9px] opacity-60">{t.response_time}: {THE_BOSS.responseTime}</div> </div> </div> </div>
                </div>
                <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
                    <button onClick={() => setSelectedService(null)} className="absolute top-6 right-6 opacity-50 hover:opacity-100 hover:text-red-500 transition"><FaTimes className="text-xl"/></button>
                    <h2 className="text-2xl font-black mb-2 leading-tight pr-8">{selectedService.title}</h2>
                    <div className="flex gap-2 text-[10px] font-bold tracking-wide opacity-70 mb-6"><span className="bg-white/10 px-2 py-1 rounded uppercase">{selectedService.category}</span><span className="bg-white/10 px-2 py-1 rounded flex items-center gap-1 text-yellow-400"><FaStar/> {selectedService.rating || "0.0"} ({selectedService.reviewsCount || 0})</span></div>
                    <div className="space-y-4 mb-6">
                      <div className={cn("p-1 rounded-xl flex gap-1", isDark ? "bg-white/5" : "bg-black/5")}>{['basic', 'standard', 'premium'].map(pk => (<button key={pk} onClick={() => setSelectedPackage(pk as any)} className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", selectedPackage === pk ? "bg-cyan-500 text-black shadow-lg" : "opacity-40 hover:opacity-100")}>{pk}</button>))}</div>
                      <div className={cn("p-5 rounded-2xl border", isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5")}> <div className="flex justify-between items-center mb-2"><span className="font-bold text-lg capitalize">{selectedService.packages?.[selectedPackage]?.name}</span><div className="text-right">{user && getVIPInfo(user.totalSpent).discount > 0 ? (<><div className="text-xs line-through opacity-40">฿{selectedService.packages?.[selectedPackage]?.price?.toLocaleString()}</div><div className="font-mono font-bold text-xl text-yellow-400 flex items-center gap-1"><FaCrown className="text-xs"/> ฿{calculateDiscountedPrice(selectedService.packages?.[selectedPackage]?.price || 0).toLocaleString()}</div></>) : (<span className="font-mono font-bold text-xl text-cyan-500">฿{selectedService.packages?.[selectedPackage]?.price?.toLocaleString()}</span>)}</div></div> <p className="text-xs opacity-60 mb-4">{selectedService.packages?.[selectedPackage]?.desc}</p> <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-black/20 border border-white/5"><FaInfoCircle className="text-cyan-500 text-xs shrink-0"/><span className="text-[9px] opacity-70">{t.vip_note}</span></div> <div className="flex gap-4 text-xs opacity-70 mb-4 font-mono"><span>🕒 {selectedService.packages?.[selectedPackage]?.days} {t.days}</span><span>↺ {selectedService.packages?.[selectedPackage]?.revisions} {t.revs}</span></div> <ul className="space-y-2">{selectedService.packages?.[selectedPackage]?.features?.map((f:string, i:number) => (<li key={i} className="text-xs flex items-center gap-2 opacity-90"><FaCheckCircle className="text-green-500"/> {f}</li>))}</ul> </div>
                    </div>
                    <div className="mb-6"><h3 className="font-bold text-xs uppercase tracking-wider opacity-50 mb-2">{t.about_service}</h3><p className="text-sm opacity-80 leading-relaxed whitespace-pre-line">{selectedService.description}</p></div>
                    <div className="mb-6 border-t border-current/10 pt-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-xs uppercase tracking-wider opacity-50 flex items-center gap-2"><FaStar className="text-yellow-400"/> {t.verified_reviews} ({selectedService.reviews?.length || 0})</h3>{user && (<button onClick={() => setShowReviewForm(!showReviewForm)} className="text-[10px] font-bold text-cyan-500 hover:underline flex items-center gap-1"><FaPen /> {t.write_review}</button>)}</div>
                        <AnimatePresence>{showReviewForm && (<motion.form initial={{height:0, opacity:0}} animate={{height:"auto", opacity:1}} exit={{height:0, opacity:0}} onSubmit={handleSubmitReview} className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 overflow-hidden"><div className="flex gap-2 mb-3">{[1,2,3,4,5].map(s => (<FaStar key={s} className={cn("cursor-pointer text-lg", s <= reviewRating ? "text-yellow-400" : "opacity-30")} onClick={() => setReviewRating(s)} />))}</div><textarea placeholder={t.review_placeholder} className="w-full bg-transparent border-b border-cyan-500/30 outline-none text-sm p-2 mb-3 min-h-[60px]" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} required /><div className="flex justify-between items-center"><div className="flex items-center gap-2"><div onClick={() => reviewFileRef.current?.click()} className="cursor-pointer text-cyan-500 hover:text-cyan-400 flex items-center gap-1 text-xs"><FaCamera /> {reviewImage ? t.image_added : t.add_photo}</div><input type="file" ref={reviewFileRef} className="hidden" accept="image/*" onChange={handleReviewImageUpload} /></div><button type="submit" disabled={submittingReview} className="bg-cyan-500 text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:scale-105 transition">{submittingReview ? "Posting..." : t.submit_review}</button></div>{reviewImage && <div className="mt-2 w-16 h-16 rounded overflow-hidden relative"><img src={reviewImage} className="w-full h-full object-cover"/><button type="button" onClick={()=>setReviewImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 text-[8px]"><FaTimes/></button></div>}</motion.form>)}</AnimatePresence>
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2 pb-24"> {selectedService.reviews?.slice().reverse().map((r:any, i:number) => ( <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 relative group"> <FaQuoteLeft className="absolute top-3 right-3 text-2xl opacity-5"/> {user && (user.uid === r.uid || user.displayName === r.user) && (<button onClick={() => handleDeleteReview(r)} className="absolute top-2 right-2 text-red-500/50 hover:text-red-500 hover:bg-white/10 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Delete"><FaTrashAlt /></button>)} <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">{r.avatar ? <img src={r.avatar} className="w-full h-full object-cover"/> : r.user.charAt(0)}</div><div><div className="font-bold text-xs">{r.user}</div><div className="flex text-yellow-400 text-[8px]">{[...Array(5)].map((_, si) => (<FaStar key={si} className={si < r.star ? "opacity-100" : "opacity-20"} />))}</div></div></div><div className="text-[9px] opacity-30">{new Date(r.date).toLocaleDateString()}</div></div><p className="text-xs opacity-70 italic">"{r.comment}"</p>{r.image && (<div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-white/10 cursor-pointer" onClick={() => window.open(r.image, '_blank')}><img src={r.image} className="w-full h-full object-cover hover:scale-110 transition"/></div>)} </div> ))} {(!selectedService.reviews || selectedService.reviews.length === 0) && <div className="text-center text-xs opacity-40 py-4">No reviews yet. Be the first!</div>} </div>
                    </div>
                    <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-black via-black to-transparent"> <button onClick={() => setShowContact(!showContact)} className={cn("w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.95] transition-all flex items-center justify-center gap-2", isDark ? "bg-white text-black" : "bg-black text-white")}> {showContact ? t.close_contact : t.hire_diver} </button> <AnimatePresence> {showContact && ( <motion.div initial={{height:0, opacity:0}} animate={{height:"auto", opacity:1}} exit={{height:0, opacity:0}} className="overflow-hidden"> <div className="pt-4 grid grid-cols-3 gap-2"> <a href={THE_BOSS.facebook} target="_blank" className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"><FaFacebook className="text-xl mb-1"/><span className="text-[9px] font-bold">Facebook</span></a> <a href={`https://line.me/ti/p/~${THE_BOSS.line}`} target="_blank" className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-500 text-white hover:bg-green-600 transition"><FaLine className="text-xl mb-1"/><span className="text-[9px] font-bold">Line</span></a> <a href={`mailto:${THE_BOSS.email}`} className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-600 text-white hover:bg-gray-700 transition"><FaEnvelope className="text-xl mb-1"/><span className="text-[9px] font-bold">Email</span></a> </div> <p className="text-[9px] text-center opacity-40 mt-2">{t.click_contact}</p> </motion.div> )} </AnimatePresence> </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-[9999]">
        <div className="relative">
            <AnimatePresence>
                {expandSettings && (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }} className={cn("absolute bottom-full left-0 mb-4 p-2 rounded-[1.5rem] border flex flex-col gap-3 shadow-[0_15px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl origin-bottom-left", isDark ? "bg-black/90 border-white/10" : "bg-white/90 border-slate-200")}>
                        <button onClick={() => setTheme(isDark?"light":"dark")} className={cn("text-[8px] font-black py-2 px-3 rounded-xl transition-colors border border-transparent flex items-center justify-center gap-1 min-w-[60px]", isDark?"bg-white/10 text-white":"bg-black/5 text-black")}> {isDark ? "🌙 DARK" : "☀️ LIGHT"} </button>
                        <button onClick={() => setIsLiteMode(!isLiteMode)} className={cn("text-[8px] font-black py-2 px-3 rounded-xl transition-colors border border-transparent flex items-center justify-center gap-1", isLiteMode?"bg-yellow-500 text-black":(isDark?"text-white/50 hover:text-white":"text-black/50 hover:text-black"))}> {isLiteMode ? "⚡ LITE" : "🐢 FULL"} </button>
                        <div className="h-[1px] bg-current/10 mx-1" />
                        <div className="flex gap-1 justify-center"> <button onClick={() => setLang("en")} className={cn("text-[8px] font-black p-1.5 rounded transition-colors", lang==="en"?"bg-cyan-500 text-black":"opacity-50 hover:opacity-100")}>EN</button> <button onClick={() => setLang("th")} className={cn("text-[8px] font-black p-1.5 rounded transition-colors", lang==="th"?"bg-cyan-500 text-black":"opacity-50 hover:opacity-100")}>TH</button> </div>
                        <div className="h-[1px] bg-current/10 mx-1" />
                        <div className="flex gap-2 justify-center"> <button onClick={() => { setScene("underwater"); localStorage.setItem("croc_scene", "underwater"); }} className={cn("p-2 rounded-full transition-colors text-xs", scene==="underwater"?"bg-cyan-500 text-black shadow-lg":"text-gray-500 hover:bg-white/10")}>🌊</button> <button onClick={() => { setScene("snow"); localStorage.setItem("croc_scene", "snow"); }} className={cn("p-2 rounded-full transition-colors text-xs", scene==="snow"?"bg-blue-500 text-white shadow-lg":"text-gray-500 hover:bg-white/10")}>❄️</button> </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex items-center gap-3">
               <button onClick={() => setExpandSettings(!expandSettings)} className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border transition-all hover:scale-110 active:scale-95", isDark ? "bg-black/80 border-white/20 text-white" : "bg-white border-slate-200 text-black", expandSettings && "bg-cyan-500 border-cyan-500 text-black rotate-90")}> {expandSettings ? <FaTimes /> : <FaCog />} </button>
            </div>
        </div>
      </motion.div>

      {/* ✅ [NEW] FULL SCREEN GALLERY LIGHTBOX (With Next/Prev) */}
      <AnimatePresence>
        {zoomedImageIndex !== null && selectedService && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-xl" onClick={() => setZoomedImageIndex(null)}>
                <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <motion.div key={zoomedImageIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} className="relative max-w-5xl max-h-[90vh]">
                        <img src={selectedService.images[zoomedImageIndex]} alt="Zoomed" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                    </motion.div>
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition" onClick={() => setZoomedImageIndex(null)}><FaTimes className="text-2xl"/></button>
                    {/* Navigation Arrows */}
                    {selectedService.images.length > 1 && (
                        <>
                            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 rounded-full bg-white/5 hover:bg-white/20 transition disabled:opacity-20" onClick={(e) => { e.stopPropagation(); navigateZoom(-1); }} disabled={zoomedImageIndex === 0}><FaChevronLeft className="text-3xl"/></button>
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 rounded-full bg-white/5 hover:bg-white/20 transition disabled:opacity-20" onClick={(e) => { e.stopPropagation(); navigateZoom(1); }} disabled={zoomedImageIndex === selectedService.images.length - 1}><FaChevronRight className="text-3xl"/></button>
                        </>
                    )}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-xs font-mono tracking-widest text-white/70 backdrop-blur-md"> {zoomedImageIndex + 1} / {selectedService.images.length} </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}