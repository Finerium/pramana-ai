"use client";
/**
 * Diagram tree pemeriksaan Pramana pada konsol pembukuan: akar Pramana ->
 * empat agen forensik paralel -> adjudikator -> kesimpulan. SELURUH isi node
 * berasal dari audit tersimpan nyata (GET /api/subjek/audit/[id]); komponen
 * ini tidak mengarang temuan. Verdict = bentuk + label (VERDICT_LABELS),
 * tidak pernah warna saja; warna memakai token status surface subjek
 * (sync/pending/danger) karena namespace subjek tidak punya token verdict.
 */
import type { CSSProperties } from "react";
import type { AgentId, VerdictColor } from "@/lib/contracts";
import { AGENT_LABELS, COPY, VERDICT_LABELS } from "@/lib/copy";
import { SUBJEK_COPY } from "@/lib/copy/subjek";
import type { SubjekAuditStatus } from "./api";

export type AgentTreeState =
  | { fase: "berjalan" }
  | { fase: "selesai"; data: SubjekAuditStatus }
  | { fase: "gagal"; data: SubjekAuditStatus | null }
  | { fase: "habis" };

const AGEN_URUT: AgentId[] = [
  "konflik_kepentingan",
  "anomali_transaksi",
  "kesehatan_finansial",
  "kepatuhan_proses",
];

/** Bentuk verdict (selaras peta gov): hijau lingkaran, kuning segitiga,
 *  merah belah ketupat. Warna dari token status subjek yang sudah ada. */
const BENTUK: Record<
  VerdictColor,
  { clip?: string; radius: string; warna: string; soft: string; onSoft: string }
> = {
  hijau: {
    radius: "50%",
    warna: "var(--color-sync)",
    soft: "var(--color-sync-soft)",
    onSoft: "var(--color-on-sync-soft)",
  },
  kuning: {
    clip: "polygon(50% 8%, 96% 92%, 4% 92%)",
    radius: "0",
    warna: "var(--color-pending)",
    soft: "var(--color-pending-soft)",
    onSoft: "var(--color-on-pending-soft)",
  },
  merah: {
    clip: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    radius: "0",
    warna: "var(--color-danger)",
    soft: "var(--color-danger-soft)",
    onSoft: "var(--color-on-danger-soft)",
  },
};

const MONO = "var(--font-mono)";

const T: Record<string, CSSProperties> = {
  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "16px",
    padding: "26px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    marginTop: "24px",
  },
  head: { marginBottom: "18px" },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--color-ink-strong)",
    letterSpacing: "-0.01em",
  },
  desc: {
    fontSize: "13px",
    color: "var(--color-muted)",
    marginTop: "5px",
    lineHeight: 1.5,
  },
  status: {
    fontSize: "12.5px",
    color: "var(--color-muted)",
    lineHeight: 1.5,
    background: "var(--color-surface-sunken)",
    border: "1px dashed var(--color-border-strong)",
    borderRadius: "10px",
    padding: "10px 13px",
    marginBottom: "18px",
  },
  root: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    background: "var(--color-primary-soft)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: "12px",
    padding: "10px 22px",
  },
  rootNama: {
    fontSize: "14px",
    fontWeight: 700,
    color: "var(--color-on-primary-soft)",
    letterSpacing: "0.01em",
  },
  rootSub: { fontSize: "11px", color: "var(--color-muted)" },
  agenGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
    gap: "14px",
  },
  agenCard: {
    background: "var(--color-surface-sunken)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    padding: "12px 13px",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
  },
  agenNama: {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "var(--color-ink-strong)",
    lineHeight: 1.35,
  },
  badge: {
    alignSelf: "flex-start",
    fontFamily: MONO,
    fontSize: "10px",
    fontWeight: 600,
    color: "var(--color-on-primary-soft)",
    background: "var(--color-primary-soft)",
    borderRadius: "5px",
    padding: "2px 7px",
    letterSpacing: "0.03em",
    whiteSpace: "nowrap",
  },
  agenStatus: {
    fontSize: "12px",
    color: "var(--color-muted)",
    lineHeight: 1.45,
  },
  agenJumlah: {
    fontFamily: MONO,
    fontSize: "12.5px",
    fontWeight: 600,
    color: "var(--color-ink-strong)",
    fontVariantNumeric: "tabular-nums",
  },
  bukti: {
    fontSize: "11.5px",
    color: "var(--color-muted)",
    lineHeight: 1.45,
  },
  tengah: { textAlign: "center" },
  adjCard: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    background: "var(--color-surface-sunken)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    padding: "12px 20px",
    maxWidth: "420px",
  },
  adjNama: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--color-ink-strong)",
  },
  adjSub: {
    fontSize: "12px",
    color: "var(--color-muted)",
    lineHeight: 1.45,
  },
  verdictKicker: {
    fontFamily: MONO,
    fontSize: "10px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--color-muted)",
  },
  verdictLabel: { fontSize: "15px", fontWeight: 700, lineHeight: 1.2 },
  verdictRingkasan: {
    fontSize: "12.5px",
    lineHeight: 1.5,
    maxWidth: "52ch",
  },
  cacheChip: {
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--color-on-pending-soft)",
    background: "var(--color-pending-soft)",
    borderRadius: "999px",
    padding: "3px 10px",
  },
  tunggu: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "1px dashed var(--color-border-strong)",
    borderRadius: "12px",
    padding: "11px 20px",
    fontSize: "12.5px",
    color: "var(--color-muted)",
  },
  foot: {
    fontSize: "11.5px",
    color: "var(--color-faint)",
    lineHeight: 1.55,
    marginTop: "18px",
  },
};

const TREE_CSS = `
@keyframes subjekTreePulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
.subjek-tree .pulse { animation: subjekTreePulse 1.2s ease-in-out infinite; }
.subjek-tree .konektor { width: 2px; height: 18px; background: var(--color-border-strong); margin: 0 auto; }
.subjek-tree .rail { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 0 14px; height: 18px; }
.subjek-tree .rail > span { position: relative; display: block; }
.subjek-tree .rail > span::before { content: ""; position: absolute; height: 2px; background: var(--color-border-strong); left: -7px; right: -7px; }
.subjek-tree .rail > span::after { content: ""; position: absolute; top: 0; bottom: 0; left: calc(50% - 1px); width: 2px; background: var(--color-border-strong); }
.subjek-tree .rail.sebar > span::before { top: 0; }
.subjek-tree .rail.kumpul > span::before { bottom: 0; }
.subjek-tree .rail > span:first-child::before { left: 50%; }
.subjek-tree .rail > span:last-child::before { right: 50%; }
@media (max-width: 860px) {
  .subjek-tree .rail { display: none; }
  .subjek-tree .agen-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (prefers-reduced-motion: reduce) { .subjek-tree .pulse { animation: none; } }
`;

function dotStyle(pulse: boolean): CSSProperties {
  return {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: pulse ? "var(--color-pending)" : "var(--color-sync)",
    display: "inline-block",
    flex: "none",
  };
}

export function AgentTree({ state }: { state: AgentTreeState }) {
  const c = SUBJEK_COPY.tree;
  const data =
    state.fase === "selesai" || state.fase === "gagal" ? state.data : null;
  const berjalan = state.fase === "berjalan";
  const cache = state.fase === "gagal" && data !== null;

  const statusTeks =
    state.fase === "berjalan"
      ? COPY["audit.jalan"]
      : state.fase === "selesai"
        ? COPY["banner.live"]
        : state.fase === "habis"
          ? c.waktuHabis
          : COPY["audit.gagal"];

  const verdict = data?.verdict ?? null;

  return (
    <section className="subjek-tree" style={T.card} aria-label={c.aria}>
      <style>{TREE_CSS}</style>
      <div style={T.head}>
        <div style={T.title}>{c.judul}</div>
        <div style={T.desc}>{c.deskripsi}</div>
      </div>

      <div style={T.status} role="status" aria-live="polite">
        {statusTeks}
      </div>

      {/* Akar */}
      <div style={T.tengah}>
        <div style={T.root}>
          <span style={T.rootNama}>{c.root}</span>
          <span style={T.rootSub}>{c.rootSub}</span>
        </div>
      </div>
      <div className="konektor" aria-hidden="true" />
      <div className="rail sebar" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Empat agen forensik paralel */}
      <div className="agen-grid" style={T.agenGrid}>
        {AGEN_URUT.map((agent) => {
          const hasil = data?.temuanPerAgen.find((a) => a.agent === agent);
          return (
            <div key={agent} style={T.agenCard}>
              <div style={T.agenNama}>{AGENT_LABELS.pemerintah[agent]}</div>
              <span style={T.badge}>{c.model}</span>
              {berjalan || (state.fase === "habis" && !hasil) ? (
                <span
                  className={berjalan ? "pulse" : undefined}
                  style={{
                    ...T.agenStatus,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <span style={dotStyle(true)} aria-hidden="true" />
                  {c.memeriksa}
                </span>
              ) : hasil ? (
                hasil.jumlah > 0 ? (
                  <>
                    <span style={T.agenJumlah}>
                      {hasil.jumlah} {c.temuanSatuan}
                    </span>
                    {hasil.contohBukti && (
                      <span style={T.bukti}>
                        {c.dasar}
                        {hasil.contohBukti}
                      </span>
                    )}
                  </>
                ) : (
                  <span
                    style={{
                      ...T.agenStatus,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <span style={dotStyle(false)} aria-hidden="true" />
                    {c.tanpaTemuan}
                  </span>
                )
              ) : (
                <span style={T.agenStatus}>{c.tanpaHasil}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="rail kumpul" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="konektor" aria-hidden="true" />

      {/* Adjudikator */}
      <div style={T.tengah}>
        <div style={T.adjCard}>
          <div style={T.adjNama}>{c.adjudikator}</div>
          <span style={T.badge}>{c.model}</span>
          <span className={berjalan ? "pulse" : undefined} style={T.adjSub}>
            {berjalan ? c.menungguAgen : c.adjudikatorSub}
          </span>
        </div>
      </div>
      <div className="konektor" aria-hidden="true" />

      {/* Kesimpulan: bentuk + label, tidak pernah warna saja */}
      <div style={T.tengah}>
        {verdict ? (
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              background: BENTUK[verdict.warna].soft,
              border: "1px solid " + BENTUK[verdict.warna].warna,
              borderRadius: "12px",
              padding: "14px 24px",
              color: BENTUK[verdict.warna].onSoft,
            }}
          >
            <span style={T.verdictKicker}>{c.kesimpulan}</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "14px",
                  height: "14px",
                  background: BENTUK[verdict.warna].warna,
                  clipPath: BENTUK[verdict.warna].clip,
                  borderRadius: BENTUK[verdict.warna].radius,
                  flex: "none",
                  display: "inline-block",
                }}
              />
              <span style={T.verdictLabel}>
                {VERDICT_LABELS[verdict.warna]}
              </span>
            </span>
            {verdict.ringkasan && (
              <span style={T.verdictRingkasan}>{verdict.ringkasan}</span>
            )}
            {cache && <span style={T.cacheChip}>{c.hasilTersimpan}</span>}
          </div>
        ) : (
          <div style={T.tunggu}>
            {berjalan && <span className="pulse" style={dotStyle(true)} />}
            {berjalan ? c.menungguKesimpulan : c.tanpaHasil}
          </div>
        )}
      </div>

      <div style={T.foot}>{c.antiHalusinasi}</div>
    </section>
  );
}
