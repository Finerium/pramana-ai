import "@/styles/tokens/landing.css";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeScript } from "@/components/landing/ThemeScript";

// Self-host saat build, tanpa request runtime ke Google (kontrak porting).
// Variabel dipakai token --font-teks / --font-mono di styles/tokens/landing.css.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export default function PublikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Terapkan tema sebelum paint agar tidak flash. */}
      <ThemeScript />
      <div className={`${jakarta.variable} ${jetbrains.variable}`}>
        {children}
      </div>
    </>
  );
}
