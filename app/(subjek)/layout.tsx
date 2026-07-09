import "@/styles/tokens/subjek.css";
import { Spline_Sans, Spline_Sans_Mono } from "next/font/google";
import { ThemeScript } from "@/components/subjek/theme";

// Self-host saat build, tanpa request runtime ke Google (kontrak porting).
// Variabel dipakai token --font-sans / --font-mono di styles/tokens/subjek.css.
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

export default function SubjekLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Terapkan tema sebelum paint agar tidak flash. */}
      <ThemeScript />
      <div className={`${splineSans.variable} ${splineMono.variable}`}>
        {children}
      </div>
    </>
  );
}
