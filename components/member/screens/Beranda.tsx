"use client";

/**
 * Beranda anggota (F02, U3, F13). Kartu verdict warna penuh + ikon bentuk +
 * label + ringkasan + CTA; baris notifikasi; panel Pengawas empat pemeriksa
 * dengan animasi berjalan; pintasan Uang dan RAT; Aktivitas Terbaru. Semua
 * state: memuat/kosong/gagal(cache)/isi. Data fetch nyata ke endpoint 6.3.
 */
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useState } from "react";
import type { VerdictResp, MemberSummary } from "@/lib/contracts";
import type {
  MemberFinding,
  MemberFindingsResp,
} from "@/components/member/types";
import { COPY } from "@/lib/copy";
import {
  MEMBER_COPY,
  MEMBER_IDENTITY,
  AKTIVITAS_TERBARU,
} from "@/lib/copy/member";
import { useResource } from "@/components/member/data";
import { useAgentRun } from "@/components/member/agents";
import { deriveVerdict, agentRows } from "@/components/member/derive";
import {
  fmtRp,
  fmtTanggalPanjang,
  fmtTanggalPendek,
  waktuSalam,
  isi,
} from "@/components/member/format";
import {
  Card,
  Banner,
  Skeleton,
  SectionLabel,
  EmptyCard,
  rise,
  SHADOW_SM,
  SHADOW_MD,
} from "@/components/member/ui";
import {
  IkonVerdict,
  IkonLonceng,
  IkonPerisai,
  IkonDompet,
  IkonKalender,
  IkonChevronKanan,
  IkonSegar,
  IkonJam,
  IkonLingkaranCentang,
} from "@/components/member/icons";

const OPTS_VERDICT = { emptyStatuses: [404] };

export function Beranda() {
  const router = useRouter();
  const verdict = useResource<VerdictResp>("/api/member/verdict", OPTS_VERDICT);
  const summary = useResource<MemberSummary>("/api/member/summary");
  const findings = useResource<MemberFindingsResp>("/api/member/findings");
  const { agRun, agStep, agCounts, run } = useAgentRun(true);

  // Sapaan dan tanggal bergantung waktu klien; dihitung HANYA setelah mount
  // agar HTML SSR (waktu server UTC) tidak berbeda dari render klien pertama
  // (hydration error #418). Pra-mount menampilkan bentuk netral SSR-deterministik.
  const [now, setNow] = useState<Date | null>(null);
  // Sengaja: nilai bergantung waktu klien di-defer ke pasca-mount agar render
  // klien pertama identik HTML SSR (anti hydration #418).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(new Date()), []);
  const sapaan = now
    ? `${MEMBER_COPY[`salam.${waktuSalam(now.getHours())}`]}, ${MEMBER_IDENTITY.sapaanNama}`
    : MEMBER_IDENTITY.sapaanNama;

  const vstat = verdict.muat.status;
  const v =
    vstat === "isi"
      ? verdict.muat.data
      : vstat === "gagal"
        ? verdict.muat.data
        : null;

  const sum =
    summary.muat.status === "isi"
      ? summary.muat.data
      : summary.muat.status === "gagal"
        ? summary.muat.data
        : null;
  const fr =
    findings.muat.status === "isi"
      ? findings.muat.data
      : findings.muat.status === "gagal"
        ? findings.muat.data
        : null;
  const findingList: MemberFinding[] = fr?.temuan ?? [];

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
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          background: "color-mix(in srgb, var(--bg) 82%, transparent)",
          backdropFilter: "blur(18px) saturate(1.6)",
          WebkitBackdropFilter: "blur(18px) saturate(1.6)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 650,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            {now ? fmtTanggalPanjang(now) : " "}
          </span>
          <span style={{ fontSize: 23, fontWeight: 750, letterSpacing: -0.4 }}>
            {sapaan}
          </span>
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
            {MEMBER_IDENTITY.koperasi}
          </span>
        </div>
        <button
          type="button"
          onClick={() => router.push("/profil")}
          aria-label={MEMBER_COPY["beranda.profilAria"]}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "var(--surface)",
            border: "0.5px solid var(--border)",
            boxShadow: SHADOW_SM,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--accent)",
            flex: "none",
          }}
        >
          {MEMBER_IDENTITY.inisial}
        </button>
      </header>

      {vstat === "memuat" ? (
        <Skeleton heights={[320, 150, 88, 88]} />
      ) : vstat === "kosong" ? (
        <EmptyCard
          icon={<IkonJam size={48} style={{ stroke: "var(--muted)" }} />}
          judul={MEMBER_COPY["beranda.kosong.judul"]}
          sub={MEMBER_COPY["beranda.kosong.sub"]}
        />
      ) : !v ? (
        <>
          <Banner tone="peringatan">{COPY["banner.cache"]}</Banner>
          <EmptyCard
            icon={<IkonJam size={48} style={{ stroke: "var(--muted)" }} />}
            judul={MEMBER_COPY["beranda.kosong.judul"]}
            sub={MEMBER_COPY["beranda.kosong.sub"]}
          />
        </>
      ) : (
        <BerandaIsi
          v={v}
          gagal={vstat === "gagal"}
          sum={sum}
          findingList={findingList}
          agRun={agRun}
          agStep={agStep}
          agCounts={agCounts}
          onRun={run}
          onOpenTemuan={(id) =>
            router.push(id ? `/temuan?open=${id}` : "/temuan")
          }
          onOpenUang={() => router.push("/uang")}
          onOpenSuara={() => router.push("/suara")}
          onOpenArus={() => router.push("/arus")}
        />
      )}
    </main>
  );
}

function BerandaIsi({
  v,
  gagal,
  sum,
  findingList,
  agRun,
  agStep,
  agCounts,
  onRun,
  onOpenTemuan,
  onOpenUang,
  onOpenSuara,
  onOpenArus,
}: {
  v: VerdictResp;
  gagal: boolean;
  sum: MemberSummary | null;
  findingList: MemberFinding[];
  agRun: boolean;
  agStep: number;
  agCounts: number[];
  onRun: () => void;
  onOpenTemuan: (temuanId?: string) => void;
  onOpenUang: () => void;
  onOpenSuara: () => void;
  onOpenArus: () => void;
}) {
  const dv = deriveVerdict(v);
  const rows = agentRows(
    findingList,
    agStep,
    agCounts.length > 0 ? agRun : false,
    agCounts,
  );
  const showBanner = gagal || v.source === "cache";
  // Notif menautkan langsung ke temuan paling perlu perhatian (findings sudah
  // terurut server-side: merah, kuning, info). Kosong -> daftar temuan.
  const topTemuanId = findingList[0]?.id;

  const simpanan = sum ? sum.uangAnda.totalSimpanan : 600000;
  const cic = sum?.uangAnda.cicilanBerikut ?? {
    jumlah: 200000,
    tanggal: "2026-07-05",
  };
  const cicilanLine = isi(MEMBER_COPY["beranda.simpanan.cicilan"], {
    rp: fmtRp(cic.jumlah),
    tgl: fmtTanggalPendek(cic.tanggal),
  });
  const agendaLine =
    dv.n > 0
      ? isi(MEMBER_COPY["beranda.rat.agenda"], { n: dv.n })
      : MEMBER_COPY["beranda.rat.agendaKosong"];

  return (
    <>
      {showBanner ? (
        <Banner tone="peringatan">{COPY["banner.cache"]}</Banner>
      ) : null}

      <section
        style={{
          background: `var(${dv.tokens.bg})`,
          color: `var(${dv.tokens.on})`,
          borderRadius: 26,
          padding: "26px 24px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 2px 4px rgba(0,0,0,0.05),0 14px 36px rgba(0,0,0,0.10)",
          ...rise(0.03),
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 650,
            letterSpacing: 0.8,
            opacity: 0.85,
          }}
        >
          {MEMBER_COPY["beranda.verdict.kicker"]}
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 13,
            padding: "6px 0 2px",
          }}
        >
          <IkonVerdict warna={v.warna} size={58} />
          <h2
            style={{
              margin: 0,
              fontSize: 37,
              lineHeight: 1.05,
              fontWeight: 750,
              letterSpacing: -0.9,
            }}
          >
            {dv.label}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 16.5,
              lineHeight: 1.5,
              opacity: 0.94,
            }}
          >
            {dv.ringkasan}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenTemuan()}
          style={{
            height: 56,
            borderRadius: 999,
            background: "var(--surface)",
            color: `var(${dv.tokens.cta})`,
            fontSize: 16.5,
            fontWeight: 650,
            textAlign: "center",
          }}
        >
          {COPY["verdict.cta"]}
        </button>
      </section>

      {dv.showNotif ? (
        <button
          type="button"
          onClick={() => onOpenTemuan(topTemuanId)}
          style={{
            display: "flex",
            gap: 11,
            alignItems: "flex-start",
            background: "var(--surface)",
            border: "0.5px solid var(--border)",
            borderRadius: 18,
            padding: "15px 16px",
            minHeight: 44,
            boxShadow: SHADOW_SM,
            ...rise(0.08),
          }}
        >
          <IkonLonceng
            size={19}
            style={{ stroke: "var(--accent)", marginTop: 1 }}
          />
          <span
            style={{
              flex: 1,
              fontSize: 14,
              lineHeight: 1.5,
              textAlign: "left",
            }}
          >
            {dv.notif}
          </span>
          <IkonChevronKanan
            size={15}
            style={{ stroke: "var(--muted)", marginTop: 2 }}
          />
        </button>
      ) : null}

      <PengawasPanel
        rows={rows}
        agRun={agRun}
        onRun={onRun}
        style={rise(0.13)}
      />

      <button
        type="button"
        onClick={onOpenUang}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          background: "var(--surface)",
          border: "0.5px solid var(--border)",
          borderRadius: 22,
          padding: "17px 18px",
          boxShadow: SHADOW_MD,
          ...rise(0.18),
        }}
      >
        <IkonDompet size={21} style={{ stroke: "var(--accent)" }} />
        <span
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
            {MEMBER_COPY["beranda.simpanan.label"]}
          </span>
          <span
            className="tnum"
            style={{ fontSize: 22, fontWeight: 650, letterSpacing: -0.4 }}
          >
            {fmtRp(simpanan)}
          </span>
          <span
            className="tnum"
            style={{ fontSize: 12.5, color: "var(--muted)" }}
          >
            {cicilanLine}
          </span>
        </span>
        <IkonChevronKanan size={15} style={{ stroke: "var(--muted)" }} />
      </button>

      <button
        type="button"
        onClick={onOpenSuara}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          background: "var(--surface)",
          border: "0.5px solid var(--border)",
          borderRadius: 22,
          padding: "17px 18px",
          boxShadow: SHADOW_MD,
          ...rise(0.23),
        }}
      >
        <IkonKalender size={21} style={{ stroke: "var(--accent)" }} />
        <span
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 14.5, fontWeight: 650 }}>
            {MEMBER_COPY["beranda.rat.judul"]}
          </span>
          <span
            style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.45 }}
          >
            {agendaLine}
          </span>
        </span>
        <IkonChevronKanan size={15} style={{ stroke: "var(--muted)" }} />
      </button>

      <Card
        style={{
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          ...rise(0.28),
        }}
      >
        <SectionLabel style={{ paddingBottom: 8 }}>
          {MEMBER_COPY["beranda.aktivitas.judul"]}
        </SectionLabel>
        {AKTIVITAS_TERBARU.map((a, i) => {
          const flag =
            a.flag === "merah"
              ? v.warna === "merah"
              : a.flag === "nonhijau"
                ? v.warna !== "hijau"
                : false;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 0",
                borderTop: "0.5px solid var(--border)",
              }}
            >
              <span
                className="tnum"
                style={{
                  width: 44,
                  flex: "none",
                  fontSize: 12,
                  color: "var(--muted)",
                }}
              >
                {a.tgl}
              </span>
              <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.4 }}>
                {a.label}
              </span>
              {flag ? (
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "var(--kuning-tint)",
                    color: "var(--kuning-tint-ink)",
                    fontSize: 10.5,
                    fontWeight: 700,
                    flex: "none",
                  }}
                >
                  {MEMBER_COPY["beranda.aktivitas.diperiksa"]}
                </span>
              ) : null}
              <span
                className="tnum"
                style={{ fontSize: 13.5, fontWeight: 650, flex: "none" }}
              >
                {fmtRp(a.jumlah)}
              </span>
            </div>
          );
        })}
        <button
          type="button"
          onClick={onOpenArus}
          style={{
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 13.5,
            fontWeight: 650,
            color: "var(--accent)",
            borderTop: "0.5px solid var(--border)",
            marginTop: 2,
          }}
        >
          {MEMBER_COPY["beranda.aktivitas.lihatArus"]}
          <IkonChevronKanan
            size={13}
            style={{ stroke: "currentColor" }}
            strokeWidth={2.4}
          />
        </button>
      </Card>
    </>
  );
}

function PengawasPanel({
  rows,
  agRun,
  onRun,
  style,
}: {
  rows: ReturnType<typeof agentRows>;
  agRun: boolean;
  onRun: () => void;
  style?: CSSProperties;
}) {
  return (
    <section
      aria-label={MEMBER_COPY["beranda.pengawas.judul"]}
      style={{
        background: "var(--surface)",
        border: "0.5px solid var(--border)",
        borderRadius: 22,
        padding: "19px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        boxShadow: SHADOW_MD,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingBottom: 10,
        }}
      >
        <IkonPerisai size={21} style={{ stroke: "var(--accent)" }} />
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
        >
          <span style={{ fontSize: 16, fontWeight: 650 }}>
            {MEMBER_COPY["beranda.pengawas.judul"]}
          </span>
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
            {MEMBER_COPY["beranda.pengawas.sub"]}
          </span>
        </div>
        <span
          className="tnum"
          style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}
        >
          {agRun
            ? MEMBER_COPY["beranda.pengawas.busy"]
            : MEMBER_COPY["beranda.pengawas.selesai"]}
        </span>
      </div>
      {rows.map((g) => (
        <div
          key={g.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "10px 0",
            borderTop: "0.5px solid var(--border)",
          }}
        >
          {g.isDone ? (
            <IkonLingkaranCentang
              size={21}
              strokeWidth={1.9}
              style={{ stroke: "var(--hijau)" }}
            />
          ) : g.isActive ? (
            <span
              role="status"
              aria-label={MEMBER_COPY["beranda.pengawas.ariaPeriksa"]}
              style={{
                width: 17,
                height: 17,
                flex: "none",
                margin: 2,
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "m-spin 0.8s linear infinite",
                boxSizing: "border-box",
              }}
            />
          ) : (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{
                width: 21,
                height: 21,
                flex: "none",
                fill: "none",
                stroke: "var(--border)",
                strokeWidth: 1.9,
              }}
            >
              <circle cx="12" cy="12" r="8.5" />
            </svg>
          )}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: g.isPending ? "var(--muted)" : "var(--ink)",
              }}
            >
              {g.nama}
            </span>
            <span
              className="tnum"
              style={{ fontSize: 12.5, color: "var(--muted)" }}
            >
              {g.metric}
            </span>
          </div>
          {g.showChip ? (
            <button
              type="button"
              onClick={onRun}
              style={{
                padding: "7px 11px",
                borderRadius: 999,
                background: "var(--kuning-tint)",
                color: "var(--kuning-tint-ink)",
                fontSize: 12,
                fontWeight: 700,
                flex: "none",
              }}
              className="tnum"
            >
              {g.chip}
            </button>
          ) : g.showTime ? (
            <span
              className="tnum"
              style={{ fontSize: 12.5, color: "var(--muted)", flex: "none" }}
            >
              {g.time}
            </span>
          ) : null}
        </div>
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          borderTop: "0.5px solid var(--border)",
          paddingTop: 6,
        }}
      >
        <button
          type="button"
          onClick={onRun}
          style={{
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13.5,
            fontWeight: 650,
            color: "var(--accent)",
          }}
        >
          <IkonSegar size={15} style={{ stroke: "currentColor" }} />
          {MEMBER_COPY["beranda.pengawas.caraKerja"]}
        </button>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {MEMBER_COPY["beranda.pengawas.berikutnya"]}
        </span>
      </div>
    </section>
  );
}
