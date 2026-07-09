import "@/styles/tokens/mobile.css";
import { Geist } from "next/font/google";

// Login memakai desain mobile (palet Nila + Geist). ThemeScript sudah dirender
// layout (publik) induk. Geist self-host di-wire ke --font-sans pada .m-app.
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`m-app ${geist.variable}`} style={{ minHeight: "100dvh" }}>
      <div style={{ maxWidth: 460, margin: "0 auto", minHeight: "100dvh" }}>{children}</div>
    </div>
  );
}
