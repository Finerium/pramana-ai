/**
 * Fallback Suspense antar-tab surface anggota. Muncul seketika saat navigasi
 * (TabBar memakai Link + prefetch) sehingga transisi terasa langsung, bukan
 * freeze menunggu segmen tujuan selesai. Kerangka generik: header + beberapa
 * kartu, memakai token per-surface dan animasi m-pulse (mobile.css). Tanpa
 * "use client": server component murni, nol JS.
 */
const BLOCK = {
  background: "var(--border)",
  animation: "m-pulse 1.5s ease-in-out infinite",
} as const;

export default function MemberLoading() {
  return (
    <main
      aria-label="Memuat"
      style={{
        minHeight: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "64px 20px 130px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ ...BLOCK, height: 14, width: "45%", borderRadius: 8 }} />
        <div style={{ ...BLOCK, height: 26, width: "70%", borderRadius: 10 }} />
      </div>
      <div style={{ ...BLOCK, height: 200, borderRadius: 26 }} />
      <div style={{ ...BLOCK, height: 88, borderRadius: 22 }} />
      <div style={{ ...BLOCK, height: 88, borderRadius: 22 }} />
    </main>
  );
}
