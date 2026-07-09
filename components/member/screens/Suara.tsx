"use client";

/**
 * Suara Anda (F10, U6). Agregat pertanyaan RAT terurut jumlah penanya
 * ("Termasuk pertanyaan Anda" untuk yang ditambahkan sesi ini) + kartu voting
 * keputusan (grid 30 titik, terkunci setelah memilih). Total anggota grid = 30
 * (jumlah anggota seed; tidak ada di VoiceResp).
 */
import { useRouter } from "next/navigation";
import type { VoiceResp } from "@/lib/contracts";
import { MEMBER_COPY } from "@/lib/copy/member";
import { useResource, useRatSet, useVotes, simpanVote, postJson } from "@/components/member/data";
import { suaraAggregate, voteDots, keputusanTally } from "@/components/member/derive";
import { fmtRp, isi } from "@/components/member/format";
import { Banner, Skeleton, EmptyCard, cardStyle, SectionLabel, rise, SHADOW_SM, SHADOW_MD } from "@/components/member/ui";
import { IkonCentang, IkonChevronKanan, IkonGembok } from "@/components/member/icons";

const TOTAL_ANGGOTA = 30;
const OPTS: { emptyStatuses: number[]; isEmpty: (v: VoiceResp) => boolean } = {
  emptyStatuses: [404],
  isEmpty: (v) => v.pertanyaanAgregat.length === 0 && v.keputusan.length === 0,
};

export function Suara() {
  const router = useRouter();
  const { muat } = useResource<VoiceResp>("/api/member/voice", OPTS);
  const ratSet = useRatSet();
  const votes = useVotes();
  const v = muat.status === "isi" ? muat.data : muat.status === "gagal" ? muat.data : null;

  async function vote(kid: string, pilihan: "setuju" | "tidak") {
    simpanVote(kid, pilihan);
    try {
      await postJson("/api/vote", { keputusanId: kid, pilihan });
    } catch {
      /* optimistik: pilihan tetap tampil dari sesi */
    }
  }

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
        <h1 style={{ margin: 0, fontSize: 25, fontWeight: 750, letterSpacing: -0.5 }}>{MEMBER_COPY["suara.judul"]}</h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{MEMBER_COPY["suara.sub"]}</p>
      </header>

      {muat.status === "memuat" ? (
        <Skeleton heights={[130, 130, 260]} />
      ) : muat.status === "kosong" ? (
        <EmptyCard
          icon={
            <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 48, height: 48, fill: "none", stroke: "var(--muted)", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }}>
              <path d="M20 5.5H4v11h4v4l4-4h8v-11z" />
            </svg>
          }
          judul={MEMBER_COPY["suara.kosong"]}
        />
      ) : !v ? (
        <Banner tone="peringatan">{MEMBER_COPY["suara.banner.cache"]}</Banner>
      ) : (
        <SuaraIsi
          v={v}
          gagal={muat.status === "gagal"}
          ratSet={ratSet}
          votes={votes}
          onVote={vote}
          onOpen={(id) => router.push(`/temuan?open=${id}`)}
        />
      )}
    </main>
  );
}

function SuaraIsi({
  v,
  gagal,
  ratSet,
  votes,
  onVote,
  onOpen,
}: {
  v: VoiceResp;
  gagal: boolean;
  ratSet: ReadonlySet<string>;
  votes: Record<string, "setuju" | "tidak">;
  onVote: (kid: string, pilihan: "setuju" | "tidak") => void;
  onOpen: (temuanId: string) => void;
}) {
  const qs = suaraAggregate(v.pertanyaanAgregat, ratSet);
  const k = v.keputusan[0];

  return (
    <>
      {gagal ? <Banner tone="peringatan">{MEMBER_COPY["suara.banner.cache"]}</Banner> : null}

      <section style={{ display: "flex", flexDirection: "column", gap: 10, ...rise(0.03) }}>
        <SectionLabel>{MEMBER_COPY["suara.pertanyaan.label"]}</SectionLabel>
        {qs.length > 0 ? (
          qs.map((q, i) => (
            <div
              key={q.temuanId}
              style={cardStyle({ borderRadius: 20, padding: 17, display: "flex", flexDirection: "column", gap: 9, boxShadow: SHADOW_SM, ...rise(0.05 + i * 0.04) })}
            >
              <span className="tnum" style={{ fontSize: 15.5, fontWeight: 650, lineHeight: 1.4 }}>
                {isi(MEMBER_COPY["suara.pertanyaan.hitung"], { n: q.jumlahAnggota })}
              </span>
              <span style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>{q.judul}</span>
              {q.milikAnda ? (
                <span
                  style={{
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: "var(--hijau-tint)",
                    color: "var(--hijau-tint-ink)",
                  }}
                >
                  <IkonCentang size={12} strokeWidth={2.4} />
                  <span style={{ fontSize: 11.5, fontWeight: 700 }}>{MEMBER_COPY["suara.pertanyaan.milikAnda"]}</span>
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => onOpen(q.temuanId)}
                style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 650, color: "var(--accent)" }}
              >
                {MEMBER_COPY["suara.pertanyaan.lihat"]}
                <IkonChevronKanan size={13} style={{ stroke: "currentColor" }} strokeWidth={2.4} />
              </button>
            </div>
          ))
        ) : (
          <div style={cardStyle({ borderRadius: 20, padding: 24, textAlign: "center", boxShadow: SHADOW_SM })}>
            <span style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{MEMBER_COPY["suara.pertanyaan.kosong"]}</span>
          </div>
        )}
      </section>

      {k ? <KeputusanCard k={k} chosen={votes[k.id]} onVote={onVote} /> : null}
    </>
  );
}

function KeputusanCard({
  k,
  chosen,
  onVote,
}: {
  k: VoiceResp["keputusan"][number];
  chosen: "setuju" | "tidak" | undefined;
  onVote: (kid: string, pilihan: "setuju" | "tidak") => void;
}) {
  const sudahVote = !!chosen || k.sudahMemilih;
  const { setuju: sCount, tidak: tCount } = keputusanTally(k, chosen);
  const tot = sCount + tCount;
  const dots = voteDots(sCount, tCount, TOTAL_ANGGOTA);
  const belum = dots.length - tot;
  const lock = chosen
    ? isi(MEMBER_COPY["suara.vote.lockPilih"], {
        pilihan: chosen === "setuju" ? MEMBER_COPY["suara.vote.setuju"] : MEMBER_COPY["suara.vote.tidak"],
        lanjut: MEMBER_COPY["suara.vote.terkunci"],
      })
    : isi(MEMBER_COPY["suara.vote.lockTersimpan"], { lanjut: MEMBER_COPY["suara.vote.terkunci"] });

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10, ...rise(0.14) }}>
      <SectionLabel>{MEMBER_COPY["suara.keputusan.label"]}</SectionLabel>
      <div style={cardStyle({ padding: 18, display: "flex", flexDirection: "column", gap: 13, boxShadow: SHADOW_MD })}>
        <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, border: "1px solid var(--border)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: k.status === "terbuka" ? "var(--hijau)" : "var(--muted)", flex: "none" }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)" }}>
            {k.status === "terbuka" ? MEMBER_COPY["suara.keputusan.terbuka"] : MEMBER_COPY["suara.keputusan.ditutup"]}
          </span>
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 650, lineHeight: 1.35 }}>{k.judul}</h3>
          {k.nominal != null ? (
            <span className="tnum" style={{ fontSize: 23, fontWeight: 700, letterSpacing: -0.4 }}>{fmtRp(k.nominal)}</span>
          ) : null}
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--muted)" }}>{k.deskripsi}</p>

        {!sudahVote ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                type="button"
                onClick={() => onVote(k.id, "setuju")}
                style={{ height: 52, borderRadius: 999, background: "var(--accent)", color: "var(--accent-on)", fontSize: 15.5, fontWeight: 650, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {MEMBER_COPY["suara.vote.setuju"]}
              </button>
              <button
                type="button"
                onClick={() => onVote(k.id, "tidak")}
                style={{ height: 52, borderRadius: 999, border: "1px solid var(--border)", color: "var(--ink)", fontSize: 15.5, fontWeight: 650, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {MEMBER_COPY["suara.vote.tidak"]}
              </button>
            </div>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{MEMBER_COPY["suara.vote.sebelum"]}</span>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "m-fadein 0.25s ease" }}>
            <span className="tnum" style={{ fontSize: 15, fontWeight: 650 }}>
              {isi(MEMBER_COPY["suara.hasil.hitung"], { tot, total: TOTAL_ANGGOTA })}
            </span>
            <div
              role="img"
              aria-label={isi(MEMBER_COPY["suara.hasil.aria"], { s: sCount, t: tCount, b: belum })}
              style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 8 }}
            >
              {dots.map((d, i) => (
                <span
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "50%",
                    background: d === "setuju" ? "var(--accent)" : d === "tidak" ? "var(--muted)" : "transparent",
                    border: d === "belum" ? "1.5px solid var(--border)" : "none",
                    boxSizing: "border-box",
                  }}
                />
              ))}
            </div>
            <div className="tnum" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Legend color="var(--accent)" label={isi(MEMBER_COPY["suara.legend.setuju"], { n: sCount })} />
              <Legend color="var(--muted)" label={isi(MEMBER_COPY["suara.legend.tidak"], { n: tCount })} />
              <Legend border label={isi(MEMBER_COPY["suara.legend.belum"], { n: belum })} />
            </div>
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--bg)", borderRadius: 14, padding: "12px 13px" }}>
              <IkonGembok size={15} style={{ stroke: "var(--muted)", marginTop: 1 }} strokeWidth={1.9} />
              <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--muted)" }}>{lock}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Legend({ color, border, label }: { color?: string; border?: boolean; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)" }}>
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: border ? "transparent" : color,
          border: border ? "1.5px solid var(--border)" : "none",
          boxSizing: "border-box",
          flex: "none",
        }}
      />
      {label}
    </span>
  );
}
