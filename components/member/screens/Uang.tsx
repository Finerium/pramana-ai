"use client";

/**
 * Uang Anda (F08). Total simpanan besar (count-up 52px), rincian
 * pokok/wajib/sukarela, sisa pinjaman + progres angsuran, cicilan berikutnya.
 * Rincian & pinjaman awal fallback seed (kontrak minimal, ditandai di derive).
 */
import type { MemberSummary } from "@/lib/contracts";
import { MEMBER_COPY, MEMBER_IDENTITY } from "@/lib/copy/member";
import { useResource } from "@/components/member/data";
import { deriveUang } from "@/components/member/derive";
import { fmtRp, fmtTanggal } from "@/components/member/format";
import { CountUp } from "@/components/member/anim";
import { Banner, Skeleton, EmptyCard, cardStyle, rise } from "@/components/member/ui";
import { IkonDompet, IkonKalender } from "@/components/member/icons";

const OPTS: { emptyStatuses: number[]; isEmpty: (s: MemberSummary) => boolean } = {
  emptyStatuses: [404],
  isEmpty: (s) => s.uangAnda.totalSimpanan <= 0,
};

export function Uang() {
  const { muat } = useResource<MemberSummary>("/api/member/summary", OPTS);
  const s = muat.status === "isi" ? muat.data : muat.status === "gagal" ? muat.data : null;

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
        <h1 style={{ margin: 0, fontSize: 25, fontWeight: 750, letterSpacing: -0.5 }}>{MEMBER_COPY["uang.judul"]}</h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          {MEMBER_IDENTITY.nama}, No. Anggota {MEMBER_IDENTITY.noAnggota}
        </p>
      </header>

      {muat.status === "memuat" ? (
        <Skeleton heights={[220, 140, 140]} />
      ) : muat.status === "kosong" ? (
        <EmptyCard
          icon={<IkonDompet size={48} style={{ stroke: "var(--muted)" }} strokeWidth={1.6} />}
          judul={MEMBER_COPY["uang.kosong.judul"]}
          sub={MEMBER_COPY["uang.kosong.sub"]}
        />
      ) : !s ? (
        <>
          <Banner tone="peringatan">{MEMBER_COPY["uang.banner.cache"]}</Banner>
          <EmptyCard
            icon={<IkonDompet size={48} style={{ stroke: "var(--muted)" }} strokeWidth={1.6} />}
            judul={MEMBER_COPY["uang.kosong.judul"]}
            sub={MEMBER_COPY["uang.kosong.sub"]}
          />
        </>
      ) : (
        <UangIsi s={s} gagal={muat.status === "gagal"} />
      )}
    </main>
  );
}

function baris(label: string, nominal: number) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: 14, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 650 }}>{fmtRp(nominal)}</span>
    </div>
  );
}

function UangIsi({ s, gagal }: { s: MemberSummary; gagal: boolean }) {
  const u = deriveUang(s);
  return (
    <>
      {gagal ? <Banner tone="peringatan">{MEMBER_COPY["uang.banner.cache"]}</Banner> : null}

      <section style={cardStyle({ padding: 22, display: "flex", flexDirection: "column", gap: 14, ...rise(0.03) })}>
        <span style={{ fontSize: 14, color: "var(--muted)" }}>{MEMBER_COPY["uang.total"]}</span>
        <CountUp
          className="tnum"
          value={u.totalSimpanan}
          format={fmtRp}
          style={{ fontSize: 52, fontWeight: 600, letterSpacing: -1.8, lineHeight: 1 }}
        />
        <div style={{ height: 0.5, background: "var(--border)" }} />
        <div className="tnum" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {baris(MEMBER_COPY["uang.pokok"], u.pokok)}
          {baris(MEMBER_COPY["uang.wajib"], u.wajib)}
          {baris(MEMBER_COPY["uang.sukarela"], u.sukarela)}
        </div>
      </section>

      <section style={cardStyle({ padding: 22, display: "flex", flexDirection: "column", gap: 12, ...rise(0.09) })}>
        <span style={{ fontSize: 14, color: "var(--muted)" }}>{MEMBER_COPY["uang.sisa"]}</span>
        <span className="tnum" style={{ fontSize: 31, fontWeight: 650, letterSpacing: -0.8, lineHeight: 1 }}>
          {fmtRp(u.sisaPinjaman)}
        </span>
        <div style={{ height: 8, borderRadius: 999, background: "var(--bg)", overflow: "hidden" }}>
          <div
            style={{
              width: `${u.progressPct}%`,
              height: "100%",
              borderRadius: 999,
              background: "var(--accent)",
              transformOrigin: "left",
              animation: "m-growX 0.8s cubic-bezier(0.2,0.7,0.2,1) 0.25s both",
            }}
          />
        </div>
        <span className="tnum" style={{ fontSize: 13, color: "var(--muted)" }}>
          Sudah diangsur {fmtRp(u.diangsur)} dari {fmtRp(u.pinjamanAwal)}
        </span>
      </section>

      {u.cicilan ? (
        <section style={cardStyle({ padding: 22, display: "flex", flexDirection: "column", gap: 10, ...rise(0.15) })}>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>{MEMBER_COPY["uang.cicilan"]}</span>
          <span className="tnum" style={{ fontSize: 31, fontWeight: 650, letterSpacing: -0.8, lineHeight: 1 }}>
            {fmtRp(u.cicilan.jumlah)}
          </span>
          <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
            <IkonKalender size={16} style={{ stroke: "var(--muted)" }} strokeWidth={1.9} />
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>Jatuh tempo {fmtTanggal(u.cicilan.tanggal)}</span>
          </div>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{MEMBER_COPY["uang.cicilan.tempat"]}</span>
        </section>
      ) : null}
    </>
  );
}
