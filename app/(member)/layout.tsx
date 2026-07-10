import "@/styles/tokens/mobile.css";
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeScript } from "@/components/landing/ThemeScript";
import { TabBar } from "@/components/member/TabBar";
import { RegisterSW } from "@/components/member/RegisterSW";

// Geist self-host di-wire ke variabel --font-sans pada pembungkus .m-app supaya
// menang atas literal :root token mobile.css untuk subtree anggota.
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Pramana AI",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Pramana", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ed" },
    { media: "(prefers-color-scheme: dark)", color: "#29282f" },
  ],
};

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Terapkan tema sebelum paint (kunci pramana-tema lintas surface). */}
      <ThemeScript />
      {/* .m-frame: bingkai perangkat iPhone di desktop (mobile.css), full-bleed di ponsel. */}
      <div className="m-frame">
        <div className={`m-app ${geist.variable}`}>
          <div className="m-shell">{children}</div>
          <TabBar />
          <RegisterSW />
        </div>
      </div>
    </>
  );
}
