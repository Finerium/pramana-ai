"use client";
import { useSyncExternalStore, type CSSProperties } from "react";
import { SUBJEK_COPY } from "@/lib/copy/subjek";

/**
 * Tema surface subjek memakai konvensi app-wide: localStorage "pramana-tema"
 * ("gelap"/"terang") + kelas .dark/.light pada <html>. Default terang (:root),
 * cocok prototipe. tokens.css .dark menjadi set saudara penuh.
 */
const SKRIP = `(function(){try{var t=localStorage.getItem("pramana-tema");var el=document.documentElement;el.classList.remove("dark","light");if(t==="gelap")el.classList.add("dark");else if(t==="terang")el.classList.add("light");}catch(e){}})();`;

/** Server component: menyuntik skrip apply-tema sebelum paint (hindari flash). */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SKRIP }} />;
}

// External store: baca kelas .dark hidrasi-aman (server = terang). Toggle
// menyiarkan event agar setiap tombol tema tetap sinkron.
const EVT = "pramana-tema";
function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}
function isDark() {
  return document.documentElement.classList.contains("dark");
}
function serverSnapshot() {
  return false;
}

const ICON_BTN: CSSProperties = {
  width: "42px",
  height: "42px",
  minWidth: "42px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "10px",
  border: "1px solid var(--color-border-strong)",
  background: "var(--color-surface)",
  color: "var(--color-ink)",
  cursor: "pointer",
  fontSize: "16px",
};

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, serverSnapshot);
  const toggle = () => {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.remove("dark", "light");
    el.classList.add(next ? "dark" : "light");
    try {
      localStorage.setItem("pramana-tema", next ? "gelap" : "terang");
    } catch {
      /* ignore storage errors */
    }
    window.dispatchEvent(new Event(EVT));
  };
  return (
    <button
      type="button"
      style={ICON_BTN}
      onClick={toggle}
      aria-label={SUBJEK_COPY.header.tema}
    >
      {dark ? "◐" : "◑"}
    </button>
  );
}
