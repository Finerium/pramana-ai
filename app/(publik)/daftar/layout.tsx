import "@/styles/tokens/mobile.css";
import { Geist } from "next/font/google";

// Daftar memakai desain mobile. ThemeScript dari layout (publik) induk.
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default function DaftarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`m-app ${geist.variable}`} style={{ minHeight: "100dvh" }}>
      <div style={{ maxWidth: 460, margin: "0 auto", minHeight: "100dvh" }}>{children}</div>
    </div>
  );
}
