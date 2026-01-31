"use client";
import { useState, useRef, useEffect } from "react";

// --- 🧠 ฐานข้อมูลคำตอบแบบ Manual (กัปตันแก้เองได้เลยตรงนี้) ---
const KNOWLEDGE = {
  contact: (
    <div className="space-y-2">
      <p>ติดต่อกัปตันแจ๊คกี้ได้ที่ช่องทางนี้ครับ! 👨‍✈️</p>
      <div className="text-xs bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
        <p>🔵 <b>Facebook:</b> <a href="https://www.facebook.com/sarawut.phusee" target="_blank" className="text-cyan-400 underline decoration-dotted">Sarawut Phusee</a></p>
        <p>🟢 <b>Line ID:</b> <span className="text-emerald-400">sxrx_wut18.</span></p>
        <p>📧 <b>Email:</b> <span className="text-yellow-400">skizzkat@gmail.com</span></p>
      </div>
    </div>
  ),
  vip: "💎 ระบบ VIP ของเรายิ่งยอดเยอะส่วนลดก็ยิ่งเยอะครับ! ตรวจสอบตารางส่วนลดได้ที่เมนู 'Privileges' ในหน้า Dashboard ได้เลยครับ",
  expire: "✅ <b>VIP ไม่มีวันหมดอายุครับ!</b> ยอดสะสมเป็นแบบ Lifetime (ตลอดชีพ) สะสมได้ยาวๆ ไม่มีการตัดยอดแน่นอนครับ",
  price: "💰 <b>เรทราคางาน:</b> ขึ้นอยู่กับขอบเขตของงานครับ ลองใช้ 'เครื่องคิดเลข 🧮' คำนวณเบื้องต้น หรือส่งรายละเอียดงานให้กัปตันประเมินได้เลยครับ",
  default: "สวัสดีครับ! ผมคือ CrocBot 🦈 เลือกหัวข้อที่สนใจด้านล่าง หรือใช้เครื่องคิดเลขคำนวณราคาได้เลยครับ"
};

export default function CrocBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'calc'>('chat');
  const [displayMsg, setDisplayMsg] = useState<any>(KNOWLEDGE.default);
  const [calcValue, setCalcValue] = useState("0");

  // --- 🧮 Calculator Logic ---
  const handleCalc = (val: string) => {
    if (val === 'C') setCalcValue("0");
    else if (val === '=') {
      try { setCalcValue(eval(calcValue).toString()); } catch { setCalcValue("Error"); }
    } else {
      setCalcValue(prev => prev === "0" ? val : prev + val);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      
      {/* --- Main Window --- */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[300px] bg-[#0f172a]/95 backdrop-blur-xl border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-cyan-900 to-black flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xl">{mode === 'chat' ? '🤖' : '🧮'}</span>
              <div className="text-xs">
                <p className="text-white font-bold">{mode === 'chat' ? 'CrocBot Assistant' : 'Shark Calculator'}</p>
                <p className="text-cyan-400 opacity-70">Active Now</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMode(mode === 'chat' ? 'calc' : 'chat')} className="text-sm bg-white/10 w-8 h-8 rounded-lg hover:bg-white/20">
                {mode === 'chat' ? '🧮' : '💬'}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
          </div>

          {/* Body: Chat Mode */}
          {mode === 'chat' && (
            <div className="p-4 space-y-4">
              <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none text-sm text-gray-200 border border-white/5 leading-relaxed">
                {displayMsg}
              </div>
              
              <div className="grid grid-cols-1 gap-2 pt-2">
                <button onClick={() => setDisplayMsg(KNOWLEDGE.contact)} className="text-left p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 hover:bg-cyan-500/20 transition">📞 ติดต่อกัปตันแจ๊คกี้ได้ทางไหน?</button>
                <button onClick={() => setDisplayMsg(KNOWLEDGE.vip)} className="text-left p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 hover:bg-cyan-500/20 transition">💎 ระบบ VIP คืออะไร?</button>
                <button onClick={() => setDisplayMsg(KNOWLEDGE.expire)} className="text-left p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 hover:bg-cyan-500/20 transition">⏳ VIP มีวันหมดอายุไหม?</button>
                <button onClick={() => setDisplayMsg(KNOWLEDGE.price)} className="text-left p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 hover:bg-cyan-500/20 transition">💰 เรทราคางานเริ่มต้นเท่าไหร่?</button>
                <button onClick={() => setDisplayMsg(KNOWLEDGE.default)} className="text-center p-1 text-[10px] text-gray-500 hover:text-white">ล้างหน้าจอ</button>
              </div>
            </div>
          )}

          {/* Body: Calculator Mode */}
          {mode === 'calc' && (
            <div className="p-4 space-y-3">
              <div className="bg-black/50 p-3 rounded-xl text-right text-2xl font-mono text-cyan-400 overflow-hidden truncate border border-white/10">
                {calcValue}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
                  <button key={btn} onClick={() => handleCalc(btn)} className={`p-3 rounded-lg font-bold text-sm transition ${btn === '=' ? 'bg-cyan-600 col-span-1' : btn === 'C' ? 'bg-red-900/40 text-red-400' : 'bg-white/5 hover:bg-white/10'}`}>
                    {btn}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-center text-gray-500">คำนวณงบประมาณเบื้องต้น</p>
            </div>
          )}
        </div>
      )}

      {/* --- Toggle Button --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white/20 transition-all duration-300 hover:scale-110 active:scale-95
          ${isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-br from-cyan-500 to-blue-600 animate-pulse'}
        `}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}