/**
 * Skeleton instan segmen pemerintah. Tampil selama segmen /pemerintah dan
 * /pemerintah/koperasi/[id] dimuat, sehingga klik baris koperasi (router.push
 * di OverviewClient) langsung menampilkan kerangka alih-alih layar kosong.
 * Ini fix lag utama: umpan balik navigasi instan tanpa menyentuh OverviewClient.
 * Warna hanya token gov (gov-panel / gov-well-sm); nol warna hardcode.
 */
const SKEL_CSS =
  "@keyframes govSkel{0%,100%{opacity:1}50%{opacity:.45}}" +
  "@media (prefers-reduced-motion: reduce){.gov-skel *{animation:none!important}}";

function Blok({ w, h, r = 12 }: { w: number | string; h: number; r?: number }) {
  return (
    <div
      className="gov-well-sm"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        animation: "govSkel 1.3s ease-in-out infinite",
      }}
    />
  );
}

export default function GovLoading() {
  return (
    <div
      className="gov-skel"
      aria-hidden="true"
      style={{
        maxWidth: 1440,
        minWidth: 1240,
        margin: "0 auto",
        padding: "26px 48px 60px",
      }}
    >
      <style>{SKEL_CSS}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Blok w={180} h={34} r={10} />
        <Blok w={220} h={34} r={999} />
      </div>

      <div style={{ marginTop: 30 }}>
        <Blok w={280} h={14} r={6} />
      </div>

      <div
        className="gov-panel"
        style={{ padding: "26px 28px", marginTop: 18 }}
      >
        <div style={{ display: "flex", gap: 28 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Blok w={360} h={24} r={8} />
            <Blok w={280} h={14} r={6} />
            <Blok w={200} h={14} r={6} />
          </div>
          <Blok w={400} h={130} r={18} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
          marginTop: 20,
        }}
      >
        <Blok w="100%" h={92} />
        <Blok w="100%" h={92} />
        <Blok w="100%" h={92} />
        <Blok w="100%" h={92} />
      </div>

      <div
        className="gov-panel"
        style={{
          padding: "20px 24px",
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <Blok w={220} h={16} r={6} />
        <Blok w="100%" h={44} r={10} />
        <Blok w="100%" h={44} r={10} />
        <Blok w="100%" h={44} r={10} />
      </div>
    </div>
  );
}
