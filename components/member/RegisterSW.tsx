"use client";

/**
 * Registrasi service worker PWA (F14), best-effort. SW-nya network-first dan
 * melewati aset dev serta rute API, jadi aman diregistrasi tanpa flag. Kegagalan
 * diabaikan (bukan fitur inti).
 */
import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const on = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    // Effect berjalan SETELAH event load pada muatan pertama; daftar langsung
    // bila dokumen sudah selesai, listener hanya untuk kasus belum selesai.
    if (document.readyState === "complete") {
      on();
      return;
    }
    window.addEventListener("load", on);
    return () => window.removeEventListener("load", on);
  }, []);
  return null;
}
