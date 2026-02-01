"use client";

import { useState, useEffect } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from "firebase/auth";
import { auth, db } from "../../lib/firebase"; 
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// --- IMPORTS FROM LANDING PAGE ---
import { SnowBackground } from "@/components/SnowBackground";
import { UnderwaterBackground } from "@/components/UnderwaterBackground";

// --- UTILITIES ---
const cn = (...classes: (string | undefined | null | boolean)[]) => 
  classes.filter(Boolean).join(" ");

// 🎮 COMPONENT: TOP RIGHT CONTROL BAR
const TopRightControls = ({ 
  scene, setScene, 
  theme, setTheme,
  isLite, toggleLite, 
  goHome 
}: any) => {
  const isDark = theme === "dark";

  // Base styling for mini buttons
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
      className="fixed top-6 right-6 z-[9999] flex items-center gap-3"
    >
      {/* Container รวมปุ่ม */}
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-full border shadow-2xl backdrop-blur-xl",
        isDark ? "bg-[#0f172a]/60 border-white/10" : "bg-white/60 border-slate-200"
      )}>
        
        {/* 1. HOME BUTTON */}
        <button 
          onClick={goHome}
          className={getBtnStyle(false, "")}
          title="Back to Home"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        <div className="w-[1px] h-5 bg-current opacity-10 mx-1" />

        {/* 2. SCENE TOGGLES */}
        <div className="flex gap-1">
          <button 
            onClick={() => setScene('underwater')}
            className={getBtnStyle(scene === 'underwater', "bg-cyan-500 shadow-cyan-500/50")}
            title="Underwater"
          >
            🌊
          </button>
          <button 
            onClick={() => setScene('snow')}
            className={getBtnStyle(scene === 'snow', "bg-blue-600 shadow-blue-600/50")}
            title="Snow"
          >
            ❄️
          </button>
        </div>

        <div className="w-[1px] h-5 bg-current opacity-10 mx-1" />

        {/* 3. THEME TOGGLE */}
        <button 
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={getBtnStyle(false, "")}
          title="Toggle Theme"
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {/* 4. LITE MODE TOGGLE */}
        <button 
          onClick={toggleLite}
          className={cn(
            "px-3 h-9 rounded-full flex items-center gap-2 transition-all duration-300 font-bold text-[10px] tracking-widest uppercase border",
            isLite 
              ? "bg-yellow-400 border-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)]" 
              : isDark
                ? "bg-white/5 border-white/10 text-white/40 hover:text-white"
                : "bg-black/5 border-black/10 text-black/40 hover:text-black"
          )}
        >
          <span>LITE</span>
          <div className={cn("w-1.5 h-1.5 rounded-full", isLite ? "bg-black animate-pulse" : "bg-current opacity-30")} />
        </button>

      </div>
    </motion.div>
  );
};

// ... [MotionToast Component remains same] ...
const MotionToast = ({ message, type, isVisible, onClose }: any) => {
    const isSuccess = type === 'success';
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ y: -100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: -50, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "fixed top-24 left-1/2 z-[9999] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl backdrop-blur-xl border border-white/10 min-w-[320px]",
              isSuccess ? "bg-[#002b36]/95 text-emerald-100" : "bg-[#2b0000]/95 text-red-100"
            )}
          >
            <div className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl",
              isSuccess ? "bg-emerald-500/20" : "bg-red-500/20"
            )}>
              {isSuccess ? "🦈" : "🐙"}
            </div>
            <div className="flex-1">
              <h4 className={cn("text-xs font-black uppercase tracking-widest", isSuccess ? "text-emerald-400" : "text-red-400")}>
                {isSuccess ? "SYSTEM READY" : "ACCESS DENIED"}
              </h4>
              <p className="text-xs font-medium opacity-80">{message}</p>
            </div>
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              onAnimationComplete={onClose}
              className={cn("absolute bottom-0 left-0 h-[2px]", isSuccess ? "bg-emerald-500" : "bg-red-500")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
};

// ... [CrocInput & CrocButton Components remain same] ...
const CrocInput = ({ label, type, value, onChange, placeholder, required, maxLength, error, readOnly }: any) => (
    <div className="space-y-1 group">
      <label className={cn(
        "text-[9px] font-black uppercase tracking-widest transition-colors ml-2",
        error ? "text-red-400" : "text-cyan-200/60 group-focus-within:text-cyan-400"
      )}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <input 
          type={type} 
          value={value} 
          onChange={onChange}
          maxLength={maxLength}
          readOnly={readOnly}
          className={cn(
            "w-full p-3.5 rounded-xl outline-none transition-all duration-300 bg-black/20 backdrop-blur-md border",
            readOnly ? "opacity-50 cursor-not-allowed border-white/5 text-gray-400" : "text-white placeholder-white/20",
            error 
              ? "border-red-500/50 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
              : "border-white/10 focus:border-cyan-400/50 focus:bg-black/40 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          )}
          placeholder={placeholder} 
        />
        {!readOnly && (
          <motion.div 
            className={cn("absolute bottom-0 left-0 h-[1px]", error ? "bg-red-500" : "bg-cyan-400")}
            initial={{ width: "0%" }}
            animate={{ width: error ? "100%" : "0%" }}
            whileFocus={{ width: "100%" }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
    </div>
);

const CrocButton = ({ children, onClick, loading, error, type = "button", variant = "primary" }: any) => {
    const isDanger = variant === "danger";
    return (
      <motion.button
        type={type}
        onClick={onClick}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative w-full overflow-hidden rounded-xl p-4 transition-all duration-300 border flex items-center justify-between group",
          error 
            ? "bg-red-500/20 border-red-500 text-red-100" 
            : isDanger
              ? "bg-red-950/30 border-red-500/30 text-red-200 hover:bg-red-900/40"
              : "bg-cyan-950/30 border-cyan-500/30 text-cyan-50 hover:bg-cyan-900/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
        )}
      >
        <span className="font-bold tracking-[0.2em] uppercase text-xs z-10 pl-1">
          {loading ? "PROCESSING..." : children}
        </span>
        <div className={cn(
          "relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-xs",
          error ? "bg-red-500 text-white" : isDanger ? "bg-red-500/20 text-red-200" : "bg-cyan-400 text-black group-hover:scale-110"
        )}>
           {loading ? (
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
               ⚙️
             </motion.div>
           ) : error ? "!" : "➜"}
        </div>
      </motion.button>
    );
};

// --- MAIN PAGE ---

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // -- STATE: System --
  const [scene, setScene] = useState<"underwater" | "snow">("underwater");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // -- STATE: Auth --
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
    show: false, message: "", type: 'success'
  });
  const [mode, setMode] = useState<"initial" | "email_login" | "email_register" | "google_kyc">("initial");
  const [tempGoogleUser, setTempGoogleUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "", password: "", realName: "", nickname: "", 
    phone: "", birthDate: "", address: "", lineId: ""
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    // Check URL Params first, then LocalStorage
    const paramScene = searchParams.get("scene");
    const paramTheme = searchParams.get("theme");
    const paramLite = searchParams.get("lite");

    const savedScene = localStorage.getItem("croc_scene");
    const savedTheme = localStorage.getItem("croc_theme");
    const savedLite = localStorage.getItem("croc_lite_mode"); // ใช้ key ให้ตรงกันกับหน้าแรก

    if (paramScene) setScene(paramScene as any);
    else if (savedScene) setScene(savedScene as any);

    if (paramTheme) setTheme(paramTheme as any);
    else if (savedTheme) setTheme(savedTheme as any);

    if (paramLite) setIsLiteMode(paramLite === "true");
    else if (savedLite) setIsLiteMode(savedLite === "true");

    setMounted(true);
  }, [searchParams]);

  // --- HANDLERS: SYSTEM SETTINGS ---
  const toggleLiteMode = () => {
    setIsLiteMode(prev => {
      const newVal = !prev;
      localStorage.setItem("croc_lite_mode", String(newVal));
      return newVal;
    });
  };

  const handleSceneChange = (newScene: "underwater" | "snow") => {
    setScene(newScene);
    localStorage.setItem("croc_scene", newScene);
  };

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("croc_theme", newTheme);
  };

  const handleGoHome = () => {
    router.push("/"); 
  };

  // --- HANDLERS: AUTH (Same as before) ---
  const showNotification = (msg: string, type: 'success' | 'error') => {
    setToast({ show: true, message: msg, type });
    if (type === 'error') {
      setErrorState(true);
      setTimeout(() => setErrorState(false), 800);
    }
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleChange = (key: string, val: string) => {
    setErrorState(false);
    let cleanedVal = val;
    if (key === "phone") cleanedVal = val.replace(/[^0-9]/g, "");
    setFormData(prev => ({ ...prev, [key]: cleanedVal }));
  };

  const validateForm = () => {
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      showNotification("เบอร์โทรต้องมี 10 หลัก", "error");
      return false;
    }
    const nameRegex = /^[a-zA-Zก-๙\s]+$/;
    if (!nameRegex.test(formData.realName) || formData.realName.trim().length < 3) {
      showNotification("ชื่อจริงสั้นเกินไป", "error");
      return false;
    }
    return true;
  };

  // ... (Auth Functions: handleGoogleLogin, handleEmailLogin, etc.)
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().realName) {
        showNotification("ยินดีต้อนรับกลับมาครับ! 🦈", "success");
        setTimeout(() => router.push("/services"), 1500);
      } else {
        setTempGoogleUser(user);
        setFormData(prev => ({ ...prev, email: user.email || "" }));
        setMode("google_kyc");
        setLoading(false);
        showNotification("Please complete your profile", "success");
      }
    } catch (error: any) {
      showNotification(error.message, "error");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      showNotification("Access Granted. Diving...", "success");
      setTimeout(() => router.push("/services"), 1500);
    } catch (error: any) {
      showNotification("Invalid credentials", "error");
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    const q = query(collection(db, "users"), where("email", "==", formData.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        showNotification("Email already in use", "error");
        setLoading(false);
        return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await saveUserData(result.user);
      showNotification("Registration Complete!", "success");
      setTimeout(() => router.push("/services"), 2000);
    } catch (error: any) {
      showNotification(error.message, "error");
      setLoading(false);
    }
  };

  const handleGoogleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!tempGoogleUser) return;
    setLoading(true);
    try {
      await saveUserData(tempGoogleUser);
      showNotification("Profile Updated!", "success");
      setTimeout(() => router.push("/services"), 2000);
    } catch (error: any) {
      showNotification(error.message, "error");
      setLoading(false);
    }
  };

  const saveUserData = async (user: any) => {
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName || formData.email,
      email: user.email || formData.email,
      photoURL: user.photoURL || "",
      realName: formData.realName.trim(),
      nickname: formData.nickname.trim(),
      phone: formData.phone,
      birthDate: formData.birthDate,
      address: formData.address,
      lineId: formData.lineId,
      vipLevel: 0,
      totalSpent: 0,
      joinedAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
  };

  if (!mounted) return <div className="bg-black h-screen w-screen" />;
  const isDark = theme === "dark";

  return (
    <div className={cn(
      "h-[100dvh] w-screen overflow-hidden relative flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30 transition-colors duration-500",
      isDark ? "bg-[#020617] text-white" : "bg-slate-50 text-slate-900"
    )}>
      
      {/* 🎮 TOP RIGHT CONTROL BAR (The main request) */}
      <TopRightControls 
        scene={scene} 
        setScene={handleSceneChange}
        theme={theme}
        setTheme={handleThemeChange}
        isLite={isLiteMode}
        toggleLite={toggleLiteMode}
        goHome={handleGoHome}
      />

      {/* BACKGROUND LOGIC */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {!isLiteMode ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
              {scene === "underwater" && <UnderwaterBackground intensity={0.8} speed={0.3} />}
              {scene === "snow" && <SnowBackground count={100} intensity={0.6} speed={0.5} />}
          </motion.div>
        ) : (
          <div className={cn(
            "absolute inset-0 transition-colors duration-500",
            isDark 
              ? scene === "underwater" ? "bg-gradient-to-b from-[#001a2c] to-[#000]" : "bg-gradient-to-b from-[#0f172a] to-[#000]"
              : "bg-gradient-to-b from-slate-100 to-white"
          )} />
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-1" />
        
        {!isLiteMode && isDark && (
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        )}
      </div>

      <MotionToast isVisible={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

      {/* LAYER 1: MAIN CARD */}
      <motion.div 
        layout
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className={cn(
          "relative z-20 w-full max-w-md overflow-hidden backdrop-blur-xl border shadow-2xl transition-all duration-500",
          isDark 
            ? "bg-[#001a2c]/70 border-white/10 shadow-cyan-900/20 rounded-[2rem]" 
            : "bg-white/70 border-white/40 shadow-slate-300 rounded-[2rem]"
        )}
      >
        <div className="text-center pt-8 pb-2">
           <motion.div 
             animate={{ y: isLiteMode ? 0 : [0, -10, 0] }}
             transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
             className="text-6xl mb-2 drop-shadow-lg inline-block"
           >
             🦈
           </motion.div>
           <h1 className="text-3xl font-serif font-black tracking-widest uppercase">
             CROCWORK
           </h1>
           <p className={cn("text-[10px] uppercase tracking-[0.4em] mt-1 opacity-60", isDark ? "text-cyan-400" : "text-slate-500")}>
             ระบบล็อคอิน
           </p>
        </div>

        <div className="p-8 pt-4 min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* 1. INITIAL SELECTION */}
            {mode === "initial" && (
              <motion.div 
                key="initial"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 pt-4"
              >
                <button 
                  onClick={handleGoogleLogin}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 border",
                    isDark ? "bg-white text-black hover:bg-gray-100 border-transparent" : "bg-black text-white hover:bg-gray-800"
                  )}
                >
                  <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="Google" />
                  Sign in with Google
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className={cn("px-2 opacity-50", isDark ? "bg-[#001a2c] text-white" : "bg-white text-black")}>Or continue with</span></div>
                </div>

                <CrocButton onClick={() => setMode("email_login")} variant="primary">
                  Email Login
                </CrocButton>
                
                <div className="text-center pt-2">
                  <button onClick={() => setMode("email_register")} className="text-xs text-cyan-400 hover:underline opacity-80">
                    Register New Account
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. EMAIL LOGIN */}
            {mode === "email_login" && (
              <motion.form 
                key="login"
                onSubmit={handleEmailLogin}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center text-xs opacity-50 uppercase tracking-widest mb-4">Diver Login</div>
                <CrocInput label="Email" type="email" value={formData.email} onChange={(e:any) => handleChange('email', e.target.value)} placeholder="captain@sea.com" required error={errorState} />
                <CrocInput label="Password" type="password" value={formData.password} onChange={(e:any) => handleChange('password', e.target.value)} placeholder="••••••" required error={errorState} />
                
                <div className="pt-4 space-y-3">
                   <CrocButton type="submit" loading={loading} error={errorState}>Dive In</CrocButton>
                   <button type="button" onClick={() => setMode("initial")} className="w-full text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 py-2">Back to Options</button>
                </div>
              </motion.form>
            )}

            {/* 3. REGISTER */}
            {mode === "email_register" && (
              <motion.form 
                key="register"
                onSubmit={handleEmailRegister}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                 <div className="text-center text-xs opacity-50 uppercase tracking-widest mb-2">New Recruitment</div>
                 <div className="grid grid-cols-2 gap-3">
                   <CrocInput label="Email" type="email" value={formData.email} onChange={(e:any) => handleChange('email', e.target.value)} required error={errorState} />
                   <CrocInput label="Password" type="password" value={formData.password} onChange={(e:any) => handleChange('password', e.target.value)} required error={errorState} />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <CrocInput label="ชื่อจริง" type="text" value={formData.realName} onChange={(e:any) => handleChange('realName', e.target.value)} required error={errorState} />
                   <CrocInput label="ชื่อเล่น" type="text" value={formData.nickname} onChange={(e:any) => handleChange('nickname', e.target.value)} required error={errorState} />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <CrocInput label="เบอร์โทร" type="tel" value={formData.phone} onChange={(e:any) => handleChange('phone', e.target.value)} maxLength={10} required error={errorState} />
                   <CrocInput label="วันเกิด" type="date" value={formData.birthDate} onChange={(e:any) => handleChange('birthDate', e.target.value)} required error={errorState} />
                 </div>
                 <div className="pt-2 flex gap-3">
                    <div className="w-1/3">
                      <CrocButton type="button" onClick={() => setMode("initial")} variant="danger">Back</CrocButton>
                    </div>
                    <div className="w-2/3">
                      <CrocButton type="submit" loading={loading} error={errorState}>Join</CrocButton>
                    </div>
                 </div>
              </motion.form>
            )}

            {/* 4. GOOGLE KYC */}
            {mode === "google_kyc" && (
               <motion.form 
                key="kyc"
                onSubmit={handleGoogleKYCSubmit}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-3"
               >
                 <div className="text-center text-xs text-cyan-400 font-bold uppercase tracking-widest mb-4">Complete Your Profile</div>
                 <CrocInput label="Email (Google)" type="email" value={formData.email} onChange={()=>{}} readOnly={true} />
                 <div className="grid grid-cols-2 gap-3">
                   <CrocInput label="ชื่อจริง" type="text" value={formData.realName} onChange={(e:any) => handleChange('realName', e.target.value)} required error={errorState} />
                   <CrocInput label="ชื่อเล่น" type="text" value={formData.nickname} onChange={(e:any) => handleChange('nickname', e.target.value)} required error={errorState} />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <CrocInput label="เบอร์โทร" type="tel" value={formData.phone} onChange={(e:any) => handleChange('phone', e.target.value)} maxLength={10} required error={errorState} />
                    <CrocInput label="วันเกิด" type="date" value={formData.birthDate} onChange={(e:any) => handleChange('birthDate', e.target.value)} required error={errorState} />
                 </div>
                 <CrocInput label="LINE ID" type="text" value={formData.lineId} onChange={(e:any) => handleChange('lineId', e.target.value)} />
                 <div className="pt-2 flex gap-3">
                    <div className="w-1/3">
                      <CrocButton type="button" onClick={async () => {
                         await signOut(auth);
                         setMode("initial");
                         setTempGoogleUser(null);
                      }} variant="danger">Cancel</CrocButton>
                    </div>
                    <div className="w-2/3">
                      <CrocButton type="submit" loading={loading} error={errorState}>Confirm</CrocButton>
                    </div>
                 </div>
               </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 text-[9px] font-mono opacity-30 tracking-[0.2em]"
      >
        UPLINK SECURED
      </motion.div>

    </div>
  );
}