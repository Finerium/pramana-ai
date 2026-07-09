"use client";

import { useEffect } from "react";

/**
 * Motion sekali-jalan diport dari prototype (support.js):
 *  - scroll reveal: fade + rise 26px, 800ms cubic-bezier(.22,.61,.21,1),
 *    hanya elemen di bawah viewport awal, threshold 0.12, sekali.
 *  - diagram Cara Kerja menggambar dirinya (~2.3s) saat masuk viewport.
 * prefers-reduced-motion: reduce = TIDAK dijalankan sama sekali (konten sudah
 * dirender statis penuh di server). Komponen ini tidak merender apa pun.
 */
const EASE = "cubic-bezier(.22,.61,.21,1)";

export function MotionController() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const observers: IntersectionObserver[] = [];

    // --- scroll reveal ---------------------------------------------------
    const revealEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const tinggi = window.innerHeight;
    const target = revealEls.filter(
      (el) => el.getBoundingClientRect().top > tinggi * 0.82,
    );
    for (const el of target) {
      el.style.opacity = "0";
      el.style.transform = "translateY(26px)";
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const el = en.target as HTMLElement;
          const tunda = Number(el.getAttribute("data-reveal-delay") || 0);
          el.style.transition = `opacity .8s ${EASE} ${tunda}ms, transform .8s ${EASE} ${tunda}ms`;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          io.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    for (const el of target) io.observe(el);
    observers.push(io);

    // --- diagram self-draw ----------------------------------------------
    const akar = document.querySelector<HTMLElement>("[data-dg-root]");
    if (akar) {
      const q = (s: string) =>
        Array.from(akar.querySelectorAll<HTMLElement>(s));
      const kartu = q('[data-dg="card"]');
      const vlines = q('[data-dg="vline"]');
      const hline = q('[data-dg="hline"]');
      const tengah = q('[data-dg="mid"]');
      const adj = q('[data-dg="adj"]');
      const akhir = q('[data-dg="last"]');
      const chip = q('[data-dg="chip"]');
      const spine = q('[data-dg="spine"]');

      for (const el of kartu) {
        el.style.opacity = "0";
        el.style.transform = "translateY(18px)";
      }
      for (const el of [...vlines, ...tengah, ...akhir, ...spine]) {
        el.style.transform = "scaleY(0)";
        el.style.transformOrigin = "top center";
      }
      for (const el of hline) {
        el.style.transform = "scaleX(0)";
        el.style.transformOrigin = "center";
      }
      for (const el of adj) {
        el.style.opacity = "0";
        el.style.transform = "translateY(14px) scale(.98)";
      }
      for (const el of chip) {
        el.style.opacity = "0";
        el.style.transform = "scale(.9)";
      }

      const buka = (el: HTMLElement, dur: number) => {
        el.style.transition = `opacity ${dur}ms ${EASE}, transform ${dur}ms ${EASE}`;
        el.style.opacity = "1";
        el.style.transform = "none";
      };
      const t = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

      const jalan = () => {
        kartu.forEach((el, i) => t(90 * i, () => buka(el, 550)));
        t(430, () => vlines.forEach((el) => buka(el, 380)));
        t(430, () => spine.forEach((el) => buka(el, 1100)));
        t(780, () => hline.forEach((el) => buka(el, 420)));
        t(1150, () => tengah.forEach((el) => buka(el, 300)));
        t(1330, () => adj.forEach((el) => buka(el, 480)));
        t(1700, () => akhir.forEach((el) => buka(el, 300)));
        chip.forEach((el, i) => t(1900 + 110 * i, () => buka(el, 420)));
      };

      const ioDg = new IntersectionObserver(
        (ens) => {
          for (const en of ens) {
            if (!en.isIntersecting) continue;
            ioDg.disconnect();
            jalan();
          }
        },
        { threshold: 0.08 },
      );
      ioDg.observe(akar);
      observers.push(ioDg);
    }

    return () => {
      for (const o of observers) o.disconnect();
      for (const id of timers) clearTimeout(id);
    };
  }, []);

  return null;
}
