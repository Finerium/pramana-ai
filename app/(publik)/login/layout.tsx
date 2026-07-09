import "@/styles/tokens/mobile.css";
import "@/styles/tokens/subjek.css";
import {
  Archivo,
  Geist,
  Public_Sans,
  Spline_Sans,
  Spline_Sans_Mono,
} from "next/font/google";

// Satu rute /login melayani tiga varian visual (F-09): default anggota
// (mobile, Geist), ?as=pemerintah (dashboard, Archivo + Public Sans),
// ?as=bendahara (subjek, Spline Sans). Semua font self-host di sini; token
// dashboard di-import oleh komponen variannya, token subjek di-import di atas
// karena varian subjek mengandalkan token hadir pada halaman inang.
// Wrapper surface (.m-app / .gov) dipasang oleh varian masing-masing.
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
  display: "swap",
});
const splineSans = Spline_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-spline-sans",
  display: "swap",
});
const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-spline-sans-mono",
  display: "swap",
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${geist.variable} ${archivo.variable} ${publicSans.variable} ${splineSans.variable} ${splineMono.variable}`}
      style={{ minHeight: "100dvh" }}
    >
      {children}
    </div>
  );
}
