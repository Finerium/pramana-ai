"use client";

/**
 * Angka count-up (rise di CSS lewat keyframe m-*). Menghormati
 * prefers-reduced-motion: langsung ke nilai akhir tanpa animasi.
 */
import { useEffect, useState, type CSSProperties } from "react";
import { countAt } from "./format";
import { useReducedMotion } from "./data";

export function CountUp({
  value,
  format,
  durMs = 900,
  style,
  className,
}: {
  value: number;
  format: (n: number) => string;
  durMs?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    // reduced-motion: nilai akhir dipakai langsung lewat derivasi, tanpa animasi.
    if (reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / durMs);
      setN(countAt(value, p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, durMs, reduced]);

  return (
    <span className={className} style={style}>
      {format(reduced ? value : n)}
    </span>
  );
}
