"use client";

/**
 * Tema surface anggota. Memakai model tiga status yang sama dengan landing
 * (sistem/terang/gelap, kunci localStorage "pramana-tema", kelas .light/.dark
 * pada <html>) supaya pilihan tema konsisten lintas surface. Skrip pre-paint
 * (ThemeScript landing) sudah mencegah flash; helper ini menerapkan perubahan
 * langsung saat anggota menekan tombol tema di Profil.
 */
import { useSyncExternalStore } from "react";
import { bacaTema, type Tema } from "@/components/landing/tema";

export type { Tema };

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

/** Terapkan tema ke <html>, simpan, beri tahu pelanggan. */
export function terapkanTema(next: Tema): void {
  const el = document.documentElement;
  el.classList.remove("dark", "light");
  if (next === "gelap") el.classList.add("dark");
  if (next === "terang") el.classList.add("light");
  try {
    localStorage.setItem("pramana-tema", next);
  } catch {
    /* localStorage tidak tersedia: tema berlaku untuk sesi ini */
  }
  for (const l of listeners) l();
}

/** Pilihan tema aktif (reaktif). SSR = "sistem". */
export function useTemaPilihan(): Tema {
  return bacaTema(useSyncExternalStore(subscribe, snapshot, () => ""));
}
