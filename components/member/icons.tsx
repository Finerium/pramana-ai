/**
 * Ikon garis surface anggota, path verbatim dari prototipe bundle. Semua
 * memakai stroke currentColor kecuali diberi warna eksplisit lewat prop.
 * Bentuk verdict berpasangan dengan aria-label (bentuk + kata, bukan warna
 * saja): lingkaran centang (hijau), segitiga seru (kuning), kotak silang
 * (merah), belah ketupat (catatan/info).
 */
import type { CSSProperties } from "react";
import type { Severity, VerdictColor } from "@/lib/contracts";

type SvgProps = { size?: number; style?: CSSProperties; strokeWidth?: number };

function base(size: number, style?: CSSProperties): CSSProperties {
  return {
    width: size,
    height: size,
    flex: "none",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...style,
  };
}

export function IkonLingkaranCentang({
  size = 24,
  style,
  strokeWidth = 1.7,
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Lingkaran centang"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.4l2.6 2.6 5-5.4" />
    </svg>
  );
}

export function IkonSegitigaSeru({
  size = 24,
  style,
  strokeWidth = 1.7,
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Segitiga seru"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M12 3.5L2.5 20.5h19L12 3.5z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.6v0.01" />
    </svg>
  );
}

export function IkonKotakSilang({
  size = 24,
  style,
  strokeWidth = 1.7,
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Kotak silang"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

/** Ikon verdict penuh (kartu beranda), 58px default. */
export function IkonVerdict({
  warna,
  size = 58,
  style,
}: { warna: VerdictColor } & SvgProps) {
  if (warna === "merah") return <IkonKotakSilang size={size} style={style} />;
  if (warna === "kuning") return <IkonSegitigaSeru size={size} style={style} />;
  return <IkonLingkaranCentang size={size} style={style} />;
}

/** Ikon chip severity (kecil), termasuk belah ketupat untuk info. */
export function IkonSeverity({
  sev,
  size = 12,
  style,
}: { sev: Severity } & SvgProps) {
  const s = base(size, style);
  if (sev === "merah")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={s} strokeWidth={2.4}>
        <rect x="4" y="4" width="16" height="16" rx="4.5" />
        <path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6" />
      </svg>
    );
  if (sev === "kuning")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={s} strokeWidth={2.4}>
        <path d="M12 3.5L2.5 20.5h19L12 3.5z" />
        <path d="M12 10.5v4" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={s} strokeWidth={2.4}>
      <path d="M12 2.5l9.5 9.5-9.5 9.5L2.5 12 12 2.5z" />
    </svg>
  );
}

export function IkonChevronKanan({
  size = 15,
  style,
  strokeWidth = 2.2,
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M9.5 5l7 7-7 7" />
    </svg>
  );
}

export function IkonChevronKiri({
  size = 16,
  style,
  strokeWidth = 2.2,
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M14.5 5l-7 7 7 7" />
    </svg>
  );
}

export function IkonChevronBawah({
  size = 15,
  style,
  strokeWidth = 2.2,
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M5 9.5l7 7 7-7" />
    </svg>
  );
}

export function IkonLonceng({ size = 19, style, strokeWidth = 1.8 }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.2 1.8 5.3 1.8 5.3H4.7s1.8-1.1 1.8-5.3z" />
      <path d="M10.2 18.5a1.9 1.9 0 0 0 3.6 0" />
    </svg>
  );
}

export function IkonPerisai({ size = 21, style, strokeWidth = 1.8 }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M12 3l7 2.8v5.6c0 4.3-2.9 7.2-7 8.9-4.1-1.7-7-4.6-7-8.9V5.8L12 3z" />
    </svg>
  );
}

export function IkonDompet({ size = 21, style, strokeWidth = 1.8 }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <rect x="3" y="6" width="18" height="13.5" rx="3.5" />
      <path d="M3 10.5h18" />
      <path d="M15.5 15.5h2.5" />
    </svg>
  );
}

export function IkonKalender({
  size = 21,
  style,
  strokeWidth = 1.8,
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <rect x="3.5" y="5" width="17" height="15" rx="3.5" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10.5h17" />
    </svg>
  );
}

export function IkonDokumen({ size = 13, style, strokeWidth = 1.9 }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M7 3.5h7l4 4v13H7v-17z" />
      <path d="M14 3.5v4h4" />
    </svg>
  );
}

export function IkonPanahAtas({
  size = 13,
  style,
  strokeWidth = 2.2,
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  );
}

export function IkonPanahBawah({
  size = 13,
  style,
  strokeWidth = 2.2,
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </svg>
  );
}

export function IkonSegar({ size = 15, style, strokeWidth = 1.9 }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3" />
      <path d="M4.5 17.5V12H10" />
    </svg>
  );
}

export function IkonCentang({ size = 12, style, strokeWidth = 2.4 }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M5 13l5 5L20 7" />
    </svg>
  );
}

export function IkonGembok({ size = 15, style, strokeWidth = 1.9 }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IkonKeluar({ size = 16, style, strokeWidth = 1.9 }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <path d="M9.5 4.5H5v15h4.5" />
      <path d="M14.5 8l4 4-4 4" />
      <path d="M18.5 12H9.5" />
    </svg>
  );
}

export function IkonJam({ size = 48, style, strokeWidth = 1.6 }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={base(size, style)}
      strokeWidth={strokeWidth}
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  );
}

/** Belah ketupat kecil (penanda kartu anggota / verifikasi). */
export function BelahKetupat({
  size = 12,
  color = "var(--accent-on)",
  style,
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: color,
        clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)",
        flex: "none",
        ...style,
      }}
    />
  );
}
