"use client";

/**
 * Arus Dana (F09, U5). Kas tiga bulan (bar), total masuk/keluar (count-up), bar
 * kategori kanonik 6.3b, sorotan "Sedang diperiksa Pengawas" menaut ke temuan.
 * Tren kas & persentase turun fallback seed (tidak ada di FlowResp; ditandai).
 */
import { useRouter } from "next/navigation";
import type { FlowResp } from "@/lib/contracts";
import { COPY } from "@/lib/copy";
import { MEMBER_COPY } from "@/lib/copy/member";
import { useResource } from "@/components/member/data";
import { kasBarsFallback, kasTurunPersen, kasTurunRupiah, flowBars } from "@/components/member/derive";
import { fmtRp } from "@/components/member/format";
import { CountUp } from "@/components/member/anim";
import { Banner, Skeleton, EmptyCard, cardStyle, SectionLabel, rise, SHADOW_SM } from "@/components/member/ui";
import { IkonSegitigaSeru, IkonPanahAtas, IkonPanahBawah, IkonChevronKanan } from "@/components/member/icons";

const OPTS: { emptyStatuses: number[]; isEmpty: (f: FlowResp) => boolean } = {
  emptyStatuses: [404],
  isEmpty: (f) => f.masuk.length === 0 && f.keluar.length === 0,
};

export function Arus() {
  const router = useRouter();
  const { muat } = useResource<FlowResp>("/api/member/flow?periode=2026-06", OPTS);
  const f = muat.status === "isi" ? muat.data : muat.status === "gagal" ? muat.data : null;

  return (
    <main
      style={{
        minHeight: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "0 20px 130px",
        animation: "m-fadein 0.28s ease",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          margin: "0 -20px",
          padding: "66px 20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          background: "color-mix(in srgb, var(--bg) 82%, transparent)",
          backdropFilter: "blur(18px) saturate(1.6)",
          WebkitBackdropFilter: "blur(18px) saturate(1.6)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 25, fontWeight: 750, letterSpacing: -0.5 }}>{MEMBER_COPY["arus.judul"]}</h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{MEMBER_COPY["arus.sub"]}</p>
      </header>

      {muat.status === "memuat" ? (
        <Skeleton heights={[230, 110, 230]} />
      ) : muat.status === "kosong" ? (
        <EmptyCard
          icon={
            <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 48, height: 48, fill: "none", stroke: "var(--muted)", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }}>
              <path d="M7 17V7" /><path d="M4 10l3-3 3 3" /><path d="M17 7v10" /><path d="M14 14l3 3 3-3" />
            </svg>
          }
          judul={MEMBER_COPY["arus.kosong"]}
        />
      ) : !f ? (
        <>
          <Banner tone="peringatan">{MEMBER_COPY["arus.kosong"]}</Banner>
        </>
      ) : (
        <ArusIsi f={f} gagal={muat.status === "gagal"} onOpen={(id) => router.push(`/temuan?open=${id}`)} />
      )}
    </main>
  );
}

function ArusIsi({ f, gagal, onOpen }: { f: FlowResp; gagal: boolean; onOpen: (temuanId: string) => void }) {
  const kas = kasBarsFallback();
  const masuk = flowBars(f.masuk);
  const keluar = flowBars(f.keluar);
  const selisih = f.totalKeluar - f.totalMasuk;
  // ponytail: kartu kas seluruhnya fallback seed (KAS_TREND_FALLBACK), jadi
  // deep-link memakai id seed temuan kesehatan_finansial AN-4 = "tmn-an4"
  // (scripts/seed/data.ts memberi id berpola tmn-anN, bukan "an4"). Naik kelas:
  // resolusi dari respons findings/flow bila id temuan menjadi dinamis (ULID).
  const kasTemuanId = "tmn-an4";

  return (
    <>
      {gagal ? <Banner tone="peringatan">{COPY["banner.cache"]}</Banner> : null}

      <section style={cardStyle({ padding: 20, display: "flex", flexDirection: "column", gap: 16, ...rise(0.03) })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 650 }}>{MEMBER_COPY["arus.kas.judul"]}</span>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{MEMBER_COPY["arus.kas.sub"]}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpen(kasTemuanId)}
            className="tnum"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 11px",
              borderRadius: 999,
              background: "var(--kuning-tint)",
              color: "var(--kuning-tint-ink)",
              fontSize: 12.5,
              fontWeight: 700,
              flex: "none",
            }}
          >
            <IkonSegitigaSeru size={12} strokeWidth={2.4} />
            Turun {kasTurunPersen()}%
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 150, padding: "0 4px" }}>
          {kas.map((k, i) => (
            <div key={k.label} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 7, height: "100%" }}>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 650, textAlign: "center", color: k.isLast ? "var(--ink)" : "var(--muted)" }}>
                {k.val}
              </span>
              <div
                style={{
                  height: k.heightPct,
                  borderRadius: "10px 10px 4px 4px",
                  background: k.isLast ? "var(--kuning)" : "color-mix(in srgb, var(--muted) 26%, transparent)",
                  transformOrigin: "bottom",
                  animation: `m-growY 0.7s cubic-bezier(0.2,0.7,0.2,1) ${(0.15 + i * 0.1).toFixed(2)}s both`,
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, padding: "0 4px" }}>
          {kas.map((k) => (
            <span key={k.label} style={{ flex: 1, textAlign: "center", fontSize: 12.5, color: "var(--muted)" }}>
              {k.label}
            </span>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--muted)", borderTop: "0.5px solid var(--border)", paddingTop: 12 }}>
          Kas turun {fmtRp(kasTurunRupiah())} sejak April. Pengawas menandai penurunan ini sebagai temuan.
        </p>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, ...rise(0.09) }}>
        <div style={cardStyle({ borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 6, boxShadow: SHADOW_SM })}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
            <IkonPanahAtas size={13} style={{ stroke: "var(--hijau)" }} strokeWidth={2.2} />
            {MEMBER_COPY["arus.masuk"]}
          </span>
          <CountUp className="tnum" value={f.totalMasuk} format={fmtRp} style={{ fontSize: 19, fontWeight: 650, letterSpacing: -0.4 }} />
        </div>
        <div style={cardStyle({ borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 6, boxShadow: SHADOW_SM })}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
            <IkonPanahBawah size={13} style={{ stroke: "var(--merah)" }} strokeWidth={2.2} />
            {MEMBER_COPY["arus.keluar"]}
          </span>
          <CountUp className="tnum" value={f.totalKeluar} format={fmtRp} style={{ fontSize: 19, fontWeight: 650, letterSpacing: -0.4 }} />
        </div>
      </div>
      {selisih > 0 ? (
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--muted)", ...rise(0.12) }}>
          Kas koperasi berkurang {fmtRp(selisih)} pada bulan Juni.
        </p>
      ) : null}

      <BarSection label={MEMBER_COPY["arus.masuk.label"]} bars={masuk} color="var(--accent)" delay={0.15} d0={0.2} />
      <BarSection label={MEMBER_COPY["arus.keluar.label"]} bars={keluar} color="var(--muted)" delay={0.2} d0={0.25} />

      {f.sorotan.length > 0 ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 10, ...rise(0.25) }}>
          <SectionLabel>{MEMBER_COPY["arus.sorotan.label"]}</SectionLabel>
          {f.sorotan.map((s) => (
            <button
              key={s.transaksiId}
              type="button"
              onClick={() => onOpen(s.temuanId)}
              style={{
                display: "flex",
                gap: 11,
                alignItems: "center",
                background: "var(--kuning-tint)",
                color: "var(--kuning-tint-ink)",
                borderRadius: 16,
                padding: "14px 15px",
                minHeight: 52,
              }}
            >
              <IkonSegitigaSeru size={17} strokeWidth={2.1} />
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
                <span className="tnum" style={{ fontSize: 14, fontWeight: 650 }}>{s.label}</span>
                <span style={{ fontSize: 12.5, opacity: 0.85 }}>{MEMBER_COPY["arus.sorotan.sub"]}</span>
              </span>
              <IkonChevronKanan size={14} style={{ stroke: "currentColor" }} strokeWidth={2.2} />
            </button>
          ))}
        </section>
      ) : null}
    </>
  );
}

function BarSection({
  label,
  bars,
  color,
  delay,
  d0,
}: {
  label: string;
  bars: ReturnType<typeof flowBars>;
  color: string;
  delay: number;
  d0: number;
}) {
  return (
    <section style={cardStyle({ padding: 20, display: "flex", flexDirection: "column", gap: 14, ...rise(delay) })}>
      <SectionLabel>{label}</SectionLabel>
      {bars.map((b, i) => (
        <div key={b.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 13.5 }}>{b.label}</span>
            <span className="tnum" style={{ fontSize: 13.5, fontWeight: 650 }}>{b.amt}</span>
          </div>
          <div style={{ height: 9, borderRadius: 999, background: "var(--bg)", overflow: "hidden" }}>
            <div
              style={{
                width: b.widthPct,
                height: "100%",
                borderRadius: 999,
                background: color,
                transformOrigin: "left",
                animation: `m-growX 0.8s cubic-bezier(0.2,0.7,0.2,1) ${(d0 + i * 0.07).toFixed(2)}s both`,
              }}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
