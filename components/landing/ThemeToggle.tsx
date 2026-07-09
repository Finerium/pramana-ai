"use client";

import { useSyncExternalStore } from "react";
import { LANDING_COPY } from "@/lib/copy";
import { bacaTema, labelTema, temaBerikutnya, type Tema } from "./tema";

// Tema = state eksternal (localStorage + kelas <html>). useSyncExternalStore
// membacanya tanpa mismatch hidrasi dan tanpa setState-di-effect: SSR memakai
// serverSnapshot ("sistem"), lalu klien menyelaraskan setelah hidrasi.
const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function snapshot(): string {
  try {
    return localStorage.getItem("pramana-tema") ?? "";
  } catch {
    return "";
  }
}

function serverSnapshot(): string {
  return "";
}

/** Terapkan kelas ke <html>, simpan, dan beri tahu pelanggan (re-render). */
function terapkan(next: Tema): void {
  const el = document.documentElement;
  el.classList.remove("dark", "light");
  if (next === "gelap") el.classList.add("dark");
  if (next === "terang") el.classList.add("light");
  try {
    localStorage.setItem("pramana-tema", next);
  } catch {
    /* localStorage tidak tersedia: tema tetap berlaku untuk sesi ini */
  }
  for (const l of listeners) l();
}

/** Ikon lingkaran: kosong = terang, penuh = gelap, setengah = sistem. */
function ikonBackground(t: Tema): string {
  if (t === "gelap") return "currentColor";
  if (t === "sistem")
    return "linear-gradient(90deg, currentColor 0 50%, transparent 50% 100%)";
  return "transparent";
}

export function ThemeToggle() {
  const tema = bacaTema(
    useSyncExternalStore(subscribe, snapshot, serverSnapshot),
  );
  const label = labelTema(tema);

  return (
    <button
      type="button"
      onClick={() => terapkan(temaBerikutnya(tema))}
      aria-label={`${LANDING_COPY.nav.temaAria} ${label}`}
      className="l-pil-garis"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        height: "40px",
        padding: "0 14px",
        borderRadius: "999px",
        font: "600 12.5px/1 var(--font-teks)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "11px",
          height: "11px",
          borderRadius: "50%",
          flex: "none",
          border: "1.5px solid currentColor",
          background: ikonBackground(tema),
        }}
      />
      <span>{label}</span>
    </button>
  );
}
