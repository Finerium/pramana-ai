"use client";

/**
 * Panel Temuan (F03, U4), dibuka dari Beranda. Kartu per temuan: chip severity
 * + agen + judul + penjelasan + BUKTI + expand "Kenapa ini penting?" +
 * PERTANYAAN UNTUK RAPAT + tombol tambah (konfirmasi hijau) + blok TANGGAPAN
 * PENGURUS bila ada. Query ?open=<id> membuka dan menggulir ke temuan tertentu.
 */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COPY, AGENT_LABELS } from "@/lib/copy";
import { MEMBER_COPY } from "@/lib/copy/member";
import type { MemberFinding, MemberFindingsResp } from "@/components/member/types";
import { useResource, useRatSet, tambahRat, semaiRat, postJson } from "@/components/member/data";
import { chipSeverity } from "@/components/member/derive";
import { isi } from "@/components/member/format";
import { Banner, Skeleton, cardStyle, rise, BackLink, EmptyCard } from "@/components/member/ui";
import { IkonSeverity, IkonChevronBawah, IkonDokumen, IkonLingkaranCentang } from "@/components/member/icons";

export function Temuan() {
  const router = useRouter();
  const params = useSearchParams();
  const openParam = params.get("open");
  const { muat } = useResource<MemberFindingsResp>("/api/member/findings");
  const ratSet = useRatSet();
  const [open, setOpen] = useState<Set<string>>(() => new Set(openParam ? [openParam] : []));

  const data = muat.status === "isi" ? muat.data : muat.status === "gagal" ? muat.data : null;
  const list: MemberFinding[] = data?.temuan ?? [];

  // Semai status "sudah ditambahkan" yang persisten di server (kontrak 6.3:
  // sudahDitambahkan) ke toko sesi agar tampil saat load.
  useEffect(() => {
    if (data) semaiRat(data.sudahDitambahkan);
  }, [data]);

  useEffect(() => {
    if (!openParam) return;
    // Efek hanya menggulir ke temuan tertaut (sinkron ke DOM); status buka
    // sudah disemai di initializer useState agar tidak setState di dalam efek.
    const el = document.getElementById(openParam);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openParam, muat.status]);

  function toggle(id: string) {
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function tambah(id: string) {
    tambahRat(id);
    try {
      await postJson(`/api/findings/${id}/rat`, {});
    } catch {
      /* optimistik: status tersimpan tetap tampil dari sesi */
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
          padding: "64px 20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "color-mix(in srgb, var(--bg) 82%, transparent)",
          backdropFilter: "blur(18px) saturate(1.6)",
          WebkitBackdropFilter: "blur(18px) saturate(1.6)",
        }}
      >
        <BackLink label={MEMBER_COPY["temuan.kembali"]} onClick={() => router.push("/beranda")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <h1 style={{ margin: 0, fontSize: 25, fontWeight: 750, letterSpacing: -0.5 }}>{MEMBER_COPY["temuan.judul"]}</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            {isi(MEMBER_COPY["temuan.hitung"], { n: list.length })}
          </p>
        </div>
      </header>

      {muat.status === "gagal" ? <Banner tone="peringatan">{COPY["banner.cache"]}</Banner> : null}

      {muat.status === "memuat" ? (
        <Skeleton heights={[190, 190, 190]} />
      ) : list.length === 0 ? (
        <EmptyCard
          icon={<IkonLingkaranCentang size={50} strokeWidth={1.7} style={{ stroke: "var(--hijau)" }} />}
          judul={COPY["kosong.temuan"]}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {list.map((f, i) => (
            <TemuanCard
              key={f.id}
              f={f}
              index={i}
              open={open.has(f.id)}
              added={ratSet.has(f.id)}
              onToggle={() => toggle(f.id)}
              onAdd={() => tambah(f.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function TemuanCard({
  f,
  index,
  open,
  added,
  onToggle,
  onAdd,
}: {
  f: MemberFinding;
  index: number;
  open: boolean;
  added: boolean;
  onToggle: () => void;
  onAdd: () => void;
}) {
  const chip = chipSeverity(f.severity);
  return (
    <article
      id={f.id}
      style={cardStyle({
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 13,
        scrollMarginTop: 120,
        ...rise(0.03 + index * 0.05),
      })}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 11px",
            borderRadius: 999,
            background: `var(${chip.tint})`,
            color: `var(${chip.tintInk})`,
          }}
        >
          <IkonSeverity sev={f.severity} size={12} />
          <span style={{ fontSize: 12, fontWeight: 700 }}>{chip.label}</span>
        </span>
        <span style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "right" }}>{AGENT_LABELS.anggota[f.agent]}</span>
      </div>

      <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 650, lineHeight: 1.35 }}>{f.judul}</h3>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55 }}>{f.penjelasan_awam}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, background: "var(--bg)", borderRadius: 14, padding: "12px 13px" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--muted)" }}>{MEMBER_COPY["temuan.bukti"]}</span>
        {f.bukti.map((b, j) => (
          <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <IkonDokumen size={13} style={{ stroke: "var(--muted)", marginTop: 2.5 }} strokeWidth={1.9} />
            <span className="tnum" style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink)" }}>{b.label}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{ minHeight: 46, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 15, fontWeight: 650, color: "var(--accent)" }}
      >
        <span>{COPY["temuan.kenapa"]}</span>
        <IkonChevronBawah size={15} style={{ stroke: "currentColor", transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open ? (
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, background: "var(--bg)", borderRadius: 14, padding: "13px 14px", animation: "m-fadein 0.2s ease" }}>
          {f.kenapa_penting}
        </p>
      ) : null}

      <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "12px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--muted)" }}>{MEMBER_COPY["temuan.pertanyaan"]}</span>
        <span style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.5 }}>{f.pertanyaan_rat}</span>
      </div>

      {!added ? (
        <button
          type="button"
          onClick={onAdd}
          style={{ height: 52, borderRadius: 999, background: "var(--accent)", color: "var(--accent-on)", fontSize: 15.5, fontWeight: 650, textAlign: "center" }}
        >
          {COPY["temuan.tambah"]}
        </button>
      ) : (
        <div
          role="status"
          style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--hijau-tint)", color: "var(--hijau-tint-ink)", borderRadius: 14, padding: "13px 14px", animation: "m-fadein 0.2s ease" }}
        >
          <IkonLingkaranCentang size={18} strokeWidth={2} style={{ stroke: "currentColor" }} />
          <span style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 600 }}>{COPY["temuan.tambah.ok"]}</span>
        </div>
      )}

      {f.tanggapanPengurus ? (
        <div style={{ background: "var(--bg)", borderRadius: 14, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--muted)" }}>{MEMBER_COPY["temuan.tanggapan"]}</span>
          <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>{f.tanggapanPengurus}</span>
        </div>
      ) : null}
    </article>
  );
}
