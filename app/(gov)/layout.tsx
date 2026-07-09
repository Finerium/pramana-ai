import "@/styles/tokens/dashboard.css";
import { Archivo, Public_Sans } from "next/font/google";
import { TEMA_SCRIPT } from "@/components/gov/theme";

// Self-host (tanpa request runtime ke Google). Variabel dipakai token
// --font-display / .gov-disp (Archivo) dan teks default gov (Public Sans).
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

export default function GovLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Terapkan tema gov sebelum paint agar tidak flash. */}
      <script dangerouslySetInnerHTML={{ __html: TEMA_SCRIPT }} />
      <div className={`gov ${archivo.variable} ${publicSans.variable}`}>{children}</div>
    </>
  );
}
