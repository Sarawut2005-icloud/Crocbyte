import type { Metadata } from "next";
import { Kanit, Playfair_Display } from "next/font/google"; 
import "./globals.css";
import CrocBot from "../components/CrocBot"; // ✅ 1. Import บอทเข้ามา

// 1. ฟอนต์เนื้อหา (อ่านง่าย ทันสมัย สไตล์ไทย/อังกฤษ)
const kanit = Kanit({ 
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-kanit",
  display: "swap", // ช่วยให้โหลดไวขึ้น
});

// 2. ฟอนต์หัวข้อ (หรูหรา Luxury สไตล์นิตยสาร)
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"], 
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CrocByte - Luxury Admin",
  description: "Premium System by SkizzKat",
  icons: {
    icon: "/favicon.ico", // อย่าลืมหารูปไอคอนมาใส่นะครับ
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased selection:bg-[#d4af37] selection:text-black bg-[#0f172a] text-white">
        {children}
        
        {/* ✅ 2. วางบอทไว้ตรงนี้ (ลอยอยู่มุมขวาล่างทุกหน้า) */}
        <CrocBot />
        
      </body>
    </html>
  );
}