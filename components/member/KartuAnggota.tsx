/**
 * Kartu anggota digital (dipakai Profil dan sukses Daftar). Warna aksen penuh,
 * QR placeholder grid. Nomor anggota tabular.
 */
import { BelahKetupat } from "./icons";

export function KartuAnggota({
  nama,
  noAnggota,
  koperasiCaps,
  bergabung,
  gap = 20,
}: {
  nama: string;
  noAnggota: string;
  koperasiCaps: string;
  bergabung: string;
  gap?: number;
}) {
  return (
    <div
      style={{
        background: "var(--accent)",
        color: "var(--accent-on)",
        borderRadius: 26,
        padding: "24px 22px",
        display: "flex",
        flexDirection: "column",
        gap,
        boxShadow: "0 2px 4px rgba(0,0,0,0.06),0 16px 40px rgba(0,0,0,0.14)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 0.6, opacity: 0.85 }}>{koperasiCaps}</span>
        <BelahKetupat size={12} color="var(--accent-on)" style={{ opacity: 0.9 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 750, letterSpacing: -0.3 }}>{nama}</span>
        <span style={{ fontSize: 14, opacity: 0.85 }}>Anggota</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 11, letterSpacing: 0.6, opacity: 0.8 }}>NO. ANGGOTA</span>
          <span className="tnum" style={{ fontSize: 20, fontWeight: 700 }}>{noAnggota}</span>
          <span style={{ fontSize: 12.5, opacity: 0.85 }}>{bergabung}</span>
        </div>
        <div
          aria-hidden="true"
          style={{
            width: 58,
            height: 58,
            background: "var(--accent-on)",
            borderRadius: 12,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            padding: 10,
            boxSizing: "border-box",
          }}
        >
          <span style={{ background: "var(--accent)", borderRadius: 2 }} />
          <span style={{ background: "var(--accent)", borderRadius: 2, opacity: 0.55 }} />
          <span style={{ background: "var(--accent)", borderRadius: 2, opacity: 0.55 }} />
          <span style={{ background: "var(--accent)", borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}
