/**
 * Tema dasbor gov: kelas "dark" pada <html> (strategi class, cocok shadcn dan
 * token .dark .gov). Independen dari tema landing agar tidak saling menimpa.
 * Perubahan disiarkan lewat event window supaya ThemeToggle (useSyncExternalStore)
 * ikut render ulang tanpa setState di dalam effect.
 */
export const TEMA_KEY = "gov-tema";
export const TEMA_EVENT = "gov-tema-change";
export type Tema = "terang" | "gelap";

export function bacaTema(): Tema {
  if (typeof document === "undefined") return "terang";
  return document.documentElement.classList.contains("dark")
    ? "gelap"
    : "terang";
}

export function terapkanTema(t: Tema): void {
  document.documentElement.classList.toggle("dark", t === "gelap");
  try {
    localStorage.setItem(TEMA_KEY, t);
  } catch {
    /* localStorage bisa tidak tersedia; abaikan */
  }
  window.dispatchEvent(new Event(TEMA_EVENT));
}

/** Snippet pre-paint (dijalankan sebelum konten dilukis) untuk cegah flash. */
export const TEMA_SCRIPT = `try{var t=localStorage.getItem("${TEMA_KEY}");document.documentElement.classList.toggle("dark",t==="gelap");}catch(e){}`;
