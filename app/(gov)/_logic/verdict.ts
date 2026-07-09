/**
 * Peta bentuk verdict (bundle dashboard, verbatim). Verdict = bentuk + label,
 * tidak pernah warna saja: hijau lingkaran, kuning segitiga, merah belah
 * ketupat, info persegi. Bentuk digambar dengan clip-path CSS, bukan ikon font.
 */
import type { Severity, VerdictColor } from "@/lib/contracts";

export type BentukKey = VerdictColor | "info";

export type Bentuk = {
  label: string;
  colorVar: string;
  clip: string;
  radius: string;
  surfaceVar: string;
};

export const BENTUK: Record<BentukKey, Bentuk> = {
  hijau: {
    label: "Hijau",
    colorVar: "var(--verdict-hijau)",
    clip: "none",
    radius: "50%",
    surfaceVar: "var(--verdict-hijau-surface)",
  },
  kuning: {
    label: "Kuning",
    colorVar: "var(--verdict-kuning)",
    clip: "polygon(50% 8%, 96% 92%, 4% 92%)",
    radius: "0",
    surfaceVar: "var(--verdict-kuning-surface)",
  },
  merah: {
    label: "Merah",
    colorVar: "var(--verdict-merah)",
    clip: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    radius: "0",
    surfaceVar: "var(--verdict-merah-surface)",
  },
  info: {
    label: "Info",
    colorVar: "var(--verdict-info)",
    clip: "none",
    radius: "2px",
    surfaceVar: "var(--verdict-info-surface)",
  },
};

/** Severity temuan (info|kuning|merah) memetakan 1:1 ke kunci bentuk. */
export const severityToBentuk = (s: Severity): BentukKey => s;
