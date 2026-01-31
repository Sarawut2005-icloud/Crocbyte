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
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import MagicBackground from "../../components/MagicBackground";

// --- 🔔 SHARK NOTIFICATION COMPONENT (แก้ไขตำแหน่ง) ---
const SeaToast = ({ message, type, show }: { message: string, type: 'success' | 'error', show: boolean }) => {
  if (!show) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`
      /* ✅ แก้ไขตรงนี้: เลื่อนลงมา top-28 ให้พ้น Navbar และใส่ z-9999 ให้อยู่บนสุด */
      fixed top-28 left-1/2 -translate-x-1/2 z-[9999]
      flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]
      backdrop-blur-2xl border-2 transition-all duration-500 animate-shark-bite min-w-[320px]
      ${isSuccess 
        ? "bg-[#002b36]/95 border-emerald-400 text-emerald-100 shadow-[0_0_30px_rgba(52,211,153,0.4)]" 
        : "bg-[#2b0000]/95 border-red-500 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
      }
    `}>
      {/* Icon */}
      <div className={`
        flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full text-2xl
        ${isSuccess ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}
      `}>
        {isSuccess ? "🦈" : "🐙"}
      </div>

      {/* Text */}
      <div className="flex flex-col flex-1">
        <h4 className={`text-sm font-black uppercase tracking-widest ${isSuccess ? "text-emerald-400" : "text-red-400"}`}>
          {isSuccess ? "MISSION COMPLETE" : "SYSTEM ALERT"}
        </h4>
        <p className="text-xs font-medium opacity-90">{message}</p>
      </div>

      {/* Progress Line */}
      <div className={`absolute bottom-0 left-0 h-[3px] animate-shrink-width
        ${isSuccess ? "bg-emerald-400" : "bg-red-500"}
      `} style={{ animationDuration: '3s' }} />
    </div>
  );
};

// --- 🎨 SEA INPUT & BUTTON ---
const SeaButton = ({ children, onClick, loading, error, type = "button", variant = "primary" }: any) => {
  const isDanger = variant === "danger";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`
        group relative w-full overflow-hidden rounded-2xl p-4 transition-all duration-300
        ${error 
          ? "bg-red-500/20 border-red-400 text-red-100 animate-shake" 
          : isDanger
            ? "bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/20 hover:border-red-400"
            : "bg-cyan-500/20 border-cyan-400/30 text-cyan-50 hover:bg-cyan-400/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
        }
        border backdrop-blur-md flex items-center justify-between
      `}
    >
      <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent ${error ? 'hidden' : ''}`} />
      <span className="font-bold tracking-widest uppercase text-sm z-10 pl-2">
        {loading ? "Processing..." : children}
      </span>
      <div className={`
        relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
        ${error ? 'bg-red-500 text-white' : isDanger ? 'bg-red-500/20 text-red-200 group-hover:bg-red-500 group-hover:text-white' : 'bg-cyan-400 text-black group-hover:scale-110 group-hover:translate-x-1'}
      `}>
         {loading ? (
           <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
         ) : error ? (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
         ) : isDanger ? (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
         ) : (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
         )}
      </div>
    </button>
  );
};

const SeaInput = ({ label, type, value, onChange, placeholder, required, maxLength, error, readOnly }: any) => (
  <div className="space-y-1 group">
    <label className={`text-[10px] font-bold uppercase tracking-widest transition-colors ml-2
      ${error ? "text-red-300" : "text-cyan-200/60 group-focus-within:text-cyan-400"}
    `}>
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      <input 
        type={type} 
        value={value} 
        onChange={onChange}
        maxLength={maxLength}
        readOnly={readOnly}
        className={`
          w-full p-4 rounded-xl outline-none transition-all duration-300
          bg-black/20 backdrop-blur-sm border
          ${readOnly ? "opacity-50 cursor-not-allowed bg-black/40 text-gray-400 border-gray-600" : ""}
          ${error 
            ? "border-red-500/50 text-red-200 placeholder-red-300/30 animate-shake focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
            : !readOnly && "border-white/10 text-white placeholder-white/20 focus:border-cyan-400/50 focus:bg-black/40 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          }
        `}
        placeholder={placeholder} 
      />
      {!readOnly && (
        <div className={`absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-all duration-500
          ${error ? 'via-red-500 w-full' : 'w-0 group-focus-within:w-full'}
        `} />
      )}
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  
  // 🔔 Toast State
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
    show: false, message: "", type: 'success'
  });

  const [activeTab, setActiveTab] = useState<"google" | "email">("google");
  const [emailMode, setEmailMode] = useState<"login" | "register">("login");
  const [showGoogleKYC, setShowGoogleKYC] = useState(false);
  const [tempGoogleUser, setTempGoogleUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: "", password: "", realName: "", nickname: "", 
    phone: "", birthDate: "", address: "", lineId: ""
  });

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setToast({ show: true, message: msg, type });
    if (type === 'error') {
      setErrorState(true);
      setTimeout(() => setErrorState(false), 1000);
    }
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const checkEmailDuplicate = async (emailToCheck: string) => {
    try {
      const q = query(collection(db, "users"), where("email", "==", emailToCheck));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      return false;
    }
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
      showNotification("เบอร์โทรต้องมี 10 หลัก (เริ่มด้วย 0)", "error");
      return false;
    }
    const nameRegex = /^[a-zA-Zก-๙\s]+$/;
    if (!nameRegex.test(formData.realName) || formData.realName.trim().length < 3) {
      showNotification("ชื่อจริงต้องเป็นตัวหนังสือและยาวกว่า 3 ตัวอักษร", "error");
      return false;
    }
    return true;
  };

  const handleForceLogout = async () => {
    await signOut(auth);
    setShowGoogleKYC(false);
    setTempGoogleUser(null);
    setLoading(false);
    setFormData({
      email: "", password: "", realName: "", nickname: "", 
      phone: "", birthDate: "", address: "", lineId: ""
    });
    showNotification("ยกเลิกรายการเรียบร้อย", "error");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorState(false);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().realName) {
        showNotification("ยินดีต้อนรับกลับมาครับ! 🦈", "success");
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setTempGoogleUser(user);
        setFormData(prev => ({ ...prev, email: user.email || "" }));
        setShowGoogleKYC(true);
        setLoading(false);
        showNotification("กรุณากรอกข้อมูลเพิ่มเติม", "success");
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
      showNotification("เข้าสู่ระบบสำเร็จ! กำลังดำดิ่ง...", "success");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error: any) {
      showNotification("อีเมลหรือรหัสผ่านไม่ถูกต้อง", "error");
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return; 

    setLoading(true);

    const isDuplicate = await checkEmailDuplicate(formData.email);
    if (isDuplicate) {
        showNotification("อีเมลนี้มีผู้ใช้งานแล้ว", "error");
        setLoading(false);
        return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = result.user;
      await saveUserData(user);
      
      showNotification("🎉 สมัครสมาชิกสำเร็จ! ยินดีต้อนรับครับ", "success");
      setTimeout(() => router.push("/dashboard"), 2000);

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        showNotification("อีเมลนี้ถูกใช้สมัครไปแล้ว", "error");
      } else {
        showNotification(error.message, "error");
      }
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
      showNotification("บันทึกข้อมูลเรียบร้อย! ลุยกันเลย 🦈", "success");
      setTimeout(() => router.push("/dashboard"), 2000);
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

  return (
    <MagicBackground>
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes shark-bite {
          0% { transform: translate(-50%, -200%); opacity: 0; }
          60% { transform: translate(-50%, 10%); opacity: 1; }
          80% { transform: translate(-50%, -5%); }
          100% { transform: translate(-50%, 0); }
        }
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-shark-bite { animation: shark-bite 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-shrink-width { animation-timing-function: linear; animation-fill-mode: forwards; }
      `}</style>

      {/* 🔔 Notification Toast (ย้ายมา top-28) */}
      <SeaToast show={toast.show} message={toast.message} type={toast.type} />

      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        
        {/* Google KYC Form */}
        {showGoogleKYC ? (
          <div className="bg-[#001a2c]/80 backdrop-blur-xl p-8 rounded-[2rem] border border-cyan-500/30 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-20">
             <h2 className="text-xl font-serif font-black text-cyan-400 mb-6 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
               🌊 Diver Information
             </h2>
             <form onSubmit={handleGoogleKYCSubmit} className="space-y-4">
                <SeaInput label="Email (Google)" type="email" value={formData.email} onChange={()=>{}} readOnly={true} />
                <div className="grid grid-cols-2 gap-4">
                  <SeaInput label="ชื่อจริง-นามสกุล" type="text" value={formData.realName} onChange={(e:any) => handleChange('realName', e.target.value)} placeholder="สมชาย ใจดี" required error={errorState} />
                  <SeaInput label="ชื่อเล่น" type="text" value={formData.nickname} onChange={(e:any) => handleChange('nickname', e.target.value)} placeholder="แจ๊ค" required error={errorState} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SeaInput label="เบอร์โทรศัพท์" type="tel" value={formData.phone} onChange={(e:any) => handleChange('phone', e.target.value)} placeholder="08xxxxxxxx" maxLength={10} required error={errorState} />
                  <SeaInput label="วันเกิด" type="date" value={formData.birthDate} onChange={(e:any) => handleChange('birthDate', e.target.value)} required error={errorState} />
                </div>
                <SeaInput label="LINE ID" type="text" value={formData.lineId} onChange={(e:any) => handleChange('lineId', e.target.value)} error={errorState} />
                <SeaInput label="ที่อยู่" type="text" value={formData.address} onChange={(e:any) => handleChange('address', e.target.value)} error={errorState} />
                
                <div className="pt-4 flex gap-3">
                  <div className="w-1/3">
                     <SeaButton type="button" onClick={handleForceLogout} variant="danger">Cancel</SeaButton>
                  </div>
                  <div className="w-2/3">
                     <SeaButton type="submit" loading={loading} error={errorState}>Confirm Dive</SeaButton>
                  </div>
                </div>
             </form>
          </div>
        ) : (
          /* Main Login Card */
          <div className="bg-[#001a2c]/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_0_50px_rgba(8,145,178,0.2)] border border-cyan-500/20 w-full max-w-md overflow-hidden relative z-20">
            <div className="text-center pt-8 pb-4">
              <div className="text-6xl mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse">🦈</div>
              <h1 className="text-3xl font-serif font-black text-white tracking-widest drop-shadow-md">CrocByte</h1>
              <p className="text-[10px] text-cyan-300 uppercase tracking-[0.4em] mt-2 opacity-70">Deep Ocean Access</p>
            </div>

            <div className="flex border-b border-cyan-500/20 mx-8">
              <button onClick={() => {setActiveTab("google"); setErrorState(false);}}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all
                  ${activeTab === "google" ? "text-cyan-400 border-b-2 border-cyan-400 shadow-[0_10px_20px_-10px_rgba(34,211,238,0.5)]" : "text-gray-500 hover:text-cyan-200"}
                `}>Google</button>
              <button onClick={() => {setActiveTab("email"); setErrorState(false);}}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all
                  ${activeTab === "email" ? "text-cyan-400 border-b-2 border-cyan-400 shadow-[0_10px_20px_-10px_rgba(34,211,238,0.5)]" : "text-gray-500 hover:text-cyan-200"}
                `}>Email</button>
            </div>

            <div className="p-8">
              {activeTab === "google" && (
                <div className="space-y-6 text-center py-4">
                  <p className="text-xs text-cyan-200/60 uppercase tracking-widest mb-4">Quick Access</p>
                  <button onClick={handleGoogleLogin} disabled={loading}
                    className={`w-full bg-white text-black py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all
                      ${errorState ? 'animate-shake border-2 border-red-500' : ''}
                    `}>
                    <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" />
                    Sign in with Google
                  </button>
                </div>
              )}

              {activeTab === "email" && (
                <div>
                  {emailMode === "login" ? (
                    <form onSubmit={handleEmailLogin} className="space-y-5">
                      <SeaInput label="Email" type="email" value={formData.email} onChange={(e:any) => handleChange('email', e.target.value)} placeholder="captain@sea.com" required error={errorState} />
                      <SeaInput label="Password" type="password" value={formData.password} onChange={(e:any) => handleChange('password', e.target.value)} placeholder="••••••" required error={errorState} />
                      <div className="pt-2">
                         <SeaButton type="submit" loading={loading} error={errorState}>DIVE IN</SeaButton>
                      </div>
                      <div className="text-center mt-4">
                        <span className="text-xs text-cyan-200/50">New diver? </span>
                        <button type="button" onClick={() => setEmailMode("register")} className="text-xs font-bold text-cyan-400 hover:text-cyan-200 hover:underline">Register</button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleEmailRegister} className="space-y-3">
                      <div className="p-3 rounded-xl bg-black/20 border border-cyan-500/20 space-y-3">
                         <SeaInput label="Email" type="email" value={formData.email} onChange={(e:any) => handleChange('email', e.target.value)} required error={errorState} />
                         <SeaInput label="Password" type="password" value={formData.password} onChange={(e:any) => handleChange('password', e.target.value)} required error={errorState} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <SeaInput label="ชื่อจริง" type="text" value={formData.realName} onChange={(e:any) => handleChange('realName', e.target.value)} required error={errorState} />
                        <SeaInput label="ชื่อเล่น" type="text" value={formData.nickname} onChange={(e:any) => handleChange('nickname', e.target.value)} required error={errorState} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <SeaInput label="เบอร์โทร" type="tel" value={formData.phone} onChange={(e:any) => handleChange('phone', e.target.value)} maxLength={10} required error={errorState} />
                        <SeaInput label="วันเกิด" type="date" value={formData.birthDate} onChange={(e:any) => handleChange('birthDate', e.target.value)} required error={errorState} />
                      </div>
                      <SeaInput label="ที่อยู่" type="text" value={formData.address} onChange={(e:any) => handleChange('address', e.target.value)} error={errorState} />
                      <div className="pt-2 flex gap-3">
                         <div className="w-1/3">
                           <SeaButton type="button" onClick={() => setEmailMode("login")} variant="danger">Back</SeaButton>
                         </div>
                         <div className="w-2/3">
                           <SeaButton type="submit" loading={loading} error={errorState}>REGISTER DIVE</SeaButton>
                         </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MagicBackground>
  );
}