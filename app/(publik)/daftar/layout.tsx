import "@/styles/tokens/mobile.css";
import { Geist } from "next/font/google";

// Daftar memakai desain mobile (aplikasi anggota). Di desktop dibungkus bingkai
// iPhone (.m-frame > .m-app > .m-shell dari mobile.css), sama seperti login
// anggota dan layout (member); di ponsel nyata full-bleed. ThemeScript diwarisi
// dari layout (publik) induk. Kelas m-shell--daftar menandai override tinggi
// berlingkup: <main> komponen Daftar memakai inline min-height:100dvh yang
// dikoreksi ke tinggi badan ponsel di dalam frame (lihat mobile.css).
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default function DaftarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`m-frame ${geist.variable}`}>
      <div className="m-app">
        <div className="m-shell m-shell--daftar">{children}</div>
      </div>
    </div>
  );
}
