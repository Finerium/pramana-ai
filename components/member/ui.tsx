/**
 * Primitif visual bersama surface anggota (gaya inline var(--token), setia
 * prototipe). Reduced-motion ditangani global oleh media query .m-app di
 * mobile.css, jadi animasi CSS m-* aman dipakai langsung.
 */
import type { CSSProperties, ReactNode } from "react";
import { IkonSegitigaSeru, IkonKotakSilang, IkonChevronKiri } from "./icons";

export const SHADOW_SM = "0 1px 2px rgba(0,0,0,0.04),0 6px 18px rgba(0,0,0,0.05)";
export const SHADOW_MD = "0 1px 2px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.05)";
export const EASE = "cubic-bezier(0.2,0.7,0.2,1)";

/** Animasi rise dengan delay (detik). */
export function rise(delay: number, dur = 0.5): CSSProperties {
  return { animation: `m-rise ${dur}s ${EASE} ${delay}s both` };
}

/** Kartu permukaan standar. */
export function cardStyle(extra?: CSSProperties): CSSProperties {
  return {
    background: "var(--surface)",
    border: "0.5px solid var(--border)",
    borderRadius: 22,
    boxShadow: SHADOW_MD,
    ...extra,
  };
}

export function Card({
  children,
  style,
  as,
  ...rest
}: {
  children: ReactNode;
  style?: CSSProperties;
  as?: "section" | "div" | "article";
} & { [k: string]: unknown }) {
  const Tag = (as ?? "section") as "section";
  return (
    <Tag style={cardStyle(style)} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: 0.8,
        color: "var(--muted)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Banner status/galat (tint + ikon bentuk + kata). */
export function Banner({ tone, children }: { tone: "peringatan" | "galat"; children: ReactNode }) {
  const galat = tone === "galat";
  return (
    <div
      role={galat ? "alert" : "status"}
      style={{
        display: "flex",
        gap: 9,
        alignItems: "flex-start",
        background: galat ? "var(--merah-tint)" : "var(--kuning-tint)",
        color: galat ? "var(--merah-tint-ink)" : "var(--kuning-tint-ink)",
        borderRadius: 14,
        padding: "12px 14px",
      }}
    >
      {galat ? (
        <IkonKotakSilang size={18} strokeWidth={2} style={{ marginTop: 0 }} />
      ) : (
        <IkonSegitigaSeru size={18} strokeWidth={2} />
      )}
      <span style={{ fontSize: 13, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

/** Blok skeleton pulse (tinggi per baris). */
export function Skeleton({ heights }: { heights: number[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }} aria-label="Memuat">
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            height: h,
            borderRadius: h > 200 ? 26 : 22,
            background: "var(--border)",
            animation: "m-pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

/** Tautan kembali (chevron kiri + label). */
export function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: 15,
        fontWeight: 600,
        color: "var(--accent)",
      }}
    >
      <IkonChevronKiri size={16} strokeWidth={2.2} />
      {label}
    </button>
  );
}

/** Kartu empty-state berpusat (ikon + judul + sub opsional). */
export function EmptyCard({
  icon,
  judul,
  sub,
}: {
  icon: ReactNode;
  judul: string;
  sub?: string;
}) {
  return (
    <div
      style={cardStyle({
        borderRadius: 26,
        padding: "36px 26px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        textAlign: "center",
      })}
    >
      {icon}
      <span style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.45 }}>{judul}</span>
      {sub ? (
        <span style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{sub}</span>
      ) : null}
    </div>
  );
}
