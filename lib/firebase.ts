import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ผมเอา Config ของแจ๊คใส่ให้แล้ว
const firebaseConfig = {
  apiKey: "AIzaSyDPvHhAjqjbUGLJ0gtDnRyFvgE9Z7Z_X9o",
  authDomain: "crocbyte-system.firebaseapp.com",
  projectId: "crocbyte-system",
  storageBucket: "crocbyte-system.firebasestorage.app",
  messagingSenderId: "398173553883",
  appId: "1:398173553883:web:c19d026c385286749378fe",
  measurementId: "G-3XB82BT6JX"
};

// เริ่มต้นระบบ Firebase App
const app = initializeApp(firebaseConfig);

// เริ่มต้น Database (Firestore) และระบบล็อกอิน (Auth)
const db = getFirestore(app);
const auth = getAuth(app);

// หมายเหตุ: ผมขอปิด Analytics ไว้ก่อนนะครับ เพราะบางทีมันจะ Error
// เวลารันบน Server ของ Next.js เอาไว้เว็บเสร็จค่อยมาเปิดทีหลังได้ครับ

// ส่งออกตัวแปรเพื่อให้หน้าอื่นเรียกใช้ได้
export { db, auth };