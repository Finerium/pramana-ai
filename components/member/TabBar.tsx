"use client";

/**
 * Navigasi bawah 4 tab (Beranda, Uang Anda, Arus Dana, Suara Anda). Ikon CSS +
 * kata, target sentuh >= 44px, latar blur. Tab Beranda aktif juga di /temuan
 * (temuan dibuka dari beranda, U1). Dilebarkan maksimum sesuai kolom aplikasi.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { MEMBER_COPY } from "@/lib/copy/member";

type Tab = {
  href: string;
  label: string;
  aktif: (p: string) => boolean;
  icon: (w: number) => ReactNode;
};

function svg(w: number, children: ReactNode): ReactNode {
  const s: CSSProperties = {
    width: 23,
    height: 23,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: w,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={s}>
      {children}
    </svg>
  );
}

const TABS: Tab[] = [
  {
    href: "/beranda",
    label: MEMBER_COPY["tab.beranda"],
    aktif: (p) => p === "/beranda" || p === "/temuan",
    icon: (w) =>
      svg(
        w,
        <>
          <path d="M4 10.5L12 4l8 6.5" />
          <path d="M5.5 9.5V20h13V9.5" />
        </>,
      ),
  },
  {
    href: "/uang",
    label: MEMBER_COPY["tab.uang"],
    aktif: (p) => p === "/uang",
    icon: (w) =>
      svg(
        w,
        <>
          <rect x="3" y="6" width="18" height="13.5" rx="3.5" />
          <path d="M3 10.5h18" />
          <path d="M15.5 15.5h2.5" />
        </>,
      ),
  },
  {
    href: "/arus",
    label: MEMBER_COPY["tab.arus"],
    aktif: (p) => p === "/arus",
    icon: (w) =>
      svg(
        w,
        <>
          <path d="M7 18V6" />
          <path d="M3.8 9.2L7 6l3.2 3.2" />
          <path d="M17 6v12" />
          <path d="M13.8 14.8L17 18l3.2-3.2" />
        </>,
      ),
  },
  {
    href: "/suara",
    label: MEMBER_COPY["tab.suara"],
    aktif: (p) => p === "/suara",
    icon: (w) => svg(w, <path d="M20 5.5H4v11h4v4l4-4h8v-11z" />),
  },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={MEMBER_COPY["tab.aria"]}
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 460,
        zIndex: 40,
        background: "color-mix(in srgb, var(--surface) 80%, transparent)",
        backdropFilter: "blur(20px) saturate(1.7)",
        WebkitBackdropFilter: "blur(20px) saturate(1.7)",
        borderTop: "0.5px solid var(--border)",
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        padding: "8px 6px 26px",
        boxSizing: "border-box",
      }}
    >
      {TABS.map((t) => {
        const on = t.aktif(pathname);
        // Link + prefetch: RSC/JS segmen tujuan dihangatkan lebih awal dan URL
        // berpindah optimistik, jadi highlight tab aktif (usePathname) berubah
        // seketika saat diklik dan loading.tsx menutup jeda muat (nol freeze).
        return (
          <Link
            key={t.href}
            href={t.href}
            prefetch
            aria-current={on ? "page" : undefined}
            style={{
              minHeight: 52,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              textDecoration: "none",
              color: on ? "var(--accent)" : "var(--muted)",
            }}
          >
            {t.icon(on ? 2.1 : 1.7)}
            <span style={{ fontSize: 11, fontWeight: 650 }}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
