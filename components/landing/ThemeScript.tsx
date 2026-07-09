/**
 * Skrip apply-tema SEBELUM paint (hindari flash). Membaca localStorage key
 * "pramana-tema" dan menaruh kelas .light/.dark di <html>. Logika mengikuti
 * bacaTema() di tema.ts (hanya "terang"/"gelap" eksplisit; selain itu ikut
 * sistem = tanpa kelas). Server component: hanya menyuntik <script> inline.
 */
const SKRIP = `(function(){try{var t=localStorage.getItem("pramana-tema");var el=document.documentElement;el.classList.remove("dark","light");if(t==="gelap")el.classList.add("dark");else if(t==="terang")el.classList.add("light");}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SKRIP }} />;
}
