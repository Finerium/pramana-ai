/**
 * Skeleton instan rute (subjek) saat navigasi/suspense: header + kerangka kartu
 * konsol pembukuan. Server Component, tanpa data, hanya token var() surface
 * subjek (nol warna hard-coded). Menahan layar kosong agar terasa responsif.
 */
import type { CSSProperties } from "react";

const bar = (w: string, h = "12px"): CSSProperties => ({
  width: w,
  height: h,
  borderRadius: "6px",
  background: "var(--color-surface-sunken)",
});

const card: CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "16px",
  padding: "26px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const SKELETON_CSS = `
@keyframes subjekSkeleton { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
.subjek-skeleton .pulse { animation: subjekSkeleton 1.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .subjek-skeleton .pulse { animation: none; } }
`;

export default function SubjekLoading() {
  return (
    <div
      className="subjek-skeleton"
      style={{
        background: "var(--color-bg)",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "var(--font-sans)",
      }}
      aria-busy="true"
      aria-label="Memuat konsol"
    >
      <style>{SKELETON_CSS}</style>
      <div style={{ height: "3px", background: "var(--color-primary)" }} />
      <header
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            padding: "18px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          <div className="pulse" style={bar("240px", "20px")} />
          <div className="pulse" style={bar("180px", "34px")} />
        </div>
      </header>

      <div
        style={{ maxWidth: "1320px", margin: "0 auto", padding: "28px 32px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 356px",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {[0, 1].map((i) => (
              <div key={i} style={card}>
                <div className="pulse" style={bar("160px", "16px")} />
                <div className="pulse" style={bar("100%", "46px")} />
                <div className="pulse" style={bar("100%", "46px")} />
                <div className="pulse" style={bar("70%", "46px")} />
              </div>
            ))}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div style={card}>
              <div className="pulse" style={bar("140px", "16px")} />
              <div className="pulse" style={bar("100%", "44px")} />
              <div className="pulse" style={bar("100%", "44px")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
