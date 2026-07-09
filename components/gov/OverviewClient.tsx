"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GovOverview } from "@/lib/contracts";
import { GOV_COPY } from "@/lib/copy/gov";
import { BENTUK } from "@/app/(gov)/_logic/verdict";
import {
  DEFAULT_DIR,
  deriveDistribusi,
  filterKoperasi,
  kpiSubPersen,
  nextSort,
  segmenLebar,
  sortKoperasi,
  tersebarCount,
  type SortDir,
  type SortKey,
} from "@/app/(gov)/_logic/overview";
import { GovHeader } from "./GovHeader";
import { VerdictShape } from "./VerdictShape";

type Status = "memuat" | "default" | "kosong" | "gagal";

const PANEL: React.CSSProperties = { marginTop: 20, borderRadius: 24 };

function Judul() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, margin: "36px 0 24px" }}>
      <div>
        <h1 className="gov-disp" style={{ fontWeight: 800, fontSize: 27, lineHeight: 1.15, letterSpacing: "-0.01em", margin: 0 }}>
          {GOV_COPY["ov.judul"]}
        </h1>
        <div style={{ fontWeight: 500, fontSize: 12.5, lineHeight: 1.5, color: "var(--muted-foreground)", marginTop: 8 }}>
          {GOV_COPY["ov.diperbarui"]}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, nilai, sub, bentukKey }: { label: string; nilai: string; sub: string; bentukKey?: "hijau" | "kuning" | "merah" }) {
  return (
    <div className="gov-panel" style={{ padding: "18px 20px 16px", borderRadius: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {bentukKey ? <VerdictShape bentuk={BENTUK[bentukKey]} size={9} /> : null}
        <div className="gov-disp" style={{ fontWeight: 700, fontSize: 10, lineHeight: 1.2, letterSpacing: "0.12em", color: "var(--muted-foreground)" }}>{label}</div>
      </div>
      <div className="gov-num" style={{ fontWeight: 700, fontSize: 34, lineHeight: 1.1, marginTop: 10 }}>{nilai}</div>
      <div style={{ fontWeight: 500, fontSize: 11.5, lineHeight: 1.4, color: "var(--muted-foreground)", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function KpiStrip({ status, data }: { status: Status; data: GovOverview | null }) {
  const kpi = data?.kpi;
  const total = kpi?.jumlahKoperasi ?? 0;
  const v = (n: number | undefined) => (status === "gagal" ? "-" : String(status === "kosong" ? 0 : (n ?? 0)));
  const sub = (real: string) =>
    status === "gagal" ? GOV_COPY["ov.kpi.sub.gagal"] : status === "kosong" ? GOV_COPY["ov.kpi.sub.menunggu"] : real;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 20 }}>
      <KpiCard label={GOV_COPY["ov.kpi.koperasi"]} nilai={v(kpi?.jumlahKoperasi)} sub={sub(GOV_COPY["ov.kpi.sub.periode"])} />
      <KpiCard label={GOV_COPY["ov.kpi.hijau"]} nilai={v(kpi?.hijau)} sub={sub(kpiSubPersen(kpi?.hijau ?? 0, total))} bentukKey="hijau" />
      <KpiCard label={GOV_COPY["ov.kpi.kuning"]} nilai={v(kpi?.kuning)} sub={sub(kpiSubPersen(kpi?.kuning ?? 0, total))} bentukKey="kuning" />
      <KpiCard label={GOV_COPY["ov.kpi.merah"]} nilai={v(kpi?.merah)} sub={sub(kpiSubPersen(kpi?.merah ?? 0, total))} bentukKey="merah" />
      <KpiCard label={GOV_COPY["ov.kpi.temuan"]} nilai={v(kpi?.temuanTerbuka)} sub={sub(`tersebar di ${tersebarCount(data?.koperasi ?? [])} koperasi`)} />
    </div>
  );
}

function Distribusi({ data }: { data: GovOverview }) {
  const kpi = data.kpi;
  const segmen = deriveDistribusi(kpi);
  const legend: Array<{ k: "hijau" | "kuning" | "merah"; n: number; title: string }> = [
    { k: "hijau", n: kpi.hijau, title: GOV_COPY["ov.distribusi.title.hijau"] },
    { k: "kuning", n: kpi.kuning, title: GOV_COPY["ov.distribusi.title.kuning"] },
    { k: "merah", n: kpi.merah, title: GOV_COPY["ov.distribusi.title.merah"] },
  ];
  return (
    <div className="gov-panel" style={{ ...PANEL, padding: "20px 24px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div className="gov-disp" style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1 }}>{GOV_COPY["ov.distribusi.judul"]}</div>
        <div style={{ fontWeight: 500, fontSize: 11.5, lineHeight: 1, color: "var(--muted-foreground)" }}>
          {kpi.jumlahKoperasi} koperasi, {GOV_COPY["ov.distribusi.sub.periode"]}
        </div>
        <div style={{ flex: 1 }} />
        {legend.map((l) => (
          <div key={l.k} style={{ display: "flex", alignItems: "center", gap: 7 }} title={l.title}>
            <VerdictShape bentuk={BENTUK[l.k]} size={9} />
            <span style={{ fontWeight: 600, fontSize: 11.5, lineHeight: 1, color: "var(--muted-foreground)" }}>{BENTUK[l.k].label} · {l.n}</span>
          </div>
        ))}
      </div>
      <div
        role="img"
        aria-label={`Distribusi verdict: ${kpi.hijau} hijau, ${kpi.kuning} kuning, ${kpi.merah} merah dari ${kpi.jumlahKoperasi} koperasi`}
        className="gov-well"
        style={{ display: "flex", height: 32, borderRadius: 999, marginTop: 16, padding: 5, gap: 4 }}
      >
        {segmen.map((s) => (
          <div key={s.warna} style={{ width: `${segmenLebar(s.count, kpi.jumlahKoperasi)}%`, borderRadius: 999, background: BENTUK[s.warna].colorVar, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 11, lineHeight: 1, color: "var(--verdict-on)", whiteSpace: "nowrap" }}>{s.count} {s.warna} · {s.persen}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tabel({ data }: { data: GovOverview }) {
  const router = useRouter();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "verdictWarna", dir: DEFAULT_DIR.verdictWarna });
  const [cari, setCari] = useState("");
  const total = data.koperasi.length;
  const rows = sortKoperasi(filterKoperasi(data.koperasi, cari), sort.key, sort.dir);
  const kpi = data.kpi;

  const headers: Array<{ key: SortKey; label: string; end?: boolean }> = [
    { key: "nama", label: GOV_COPY["ov.header.koperasi"] },
    { key: "provinsi", label: GOV_COPY["ov.header.provinsi"] },
    { key: "verdictWarna", label: GOV_COPY["ov.header.verdict"] },
    { key: "temuanCount", label: GOV_COPY["ov.header.temuan"], end: true },
  ];
  const grid = "2fr 1.1fr 0.9fr 0.6fr";
  const buka = (id: string) => router.push(`/pemerintah/koperasi/${id}`);

  return (
    <div className="gov-panel" style={{ ...PANEL, padding: "8px 0 6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px 16px" }}>
        <div>
          <div className="gov-disp" style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{GOV_COPY["ov.tabel.judul"]}</div>
          <div style={{ fontWeight: 500, fontSize: 11.5, lineHeight: 1.4, color: "var(--muted-foreground)", marginTop: 4 }}>
            {cari.trim() ? `Menampilkan ${rows.length} dari ${total} koperasi` : `${total} koperasi, ${GOV_COPY["ov.tabel.jumlah.semua"]}`}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder={GOV_COPY["ov.cari.placeholder"]}
          aria-label={GOV_COPY["ov.cari.placeholder"]}
          className="gov-well"
          style={{ width: 270, padding: "12px 20px", borderRadius: 999, fontWeight: 500, fontSize: 12.5, lineHeight: 1, color: "var(--foreground)" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: 18, alignItems: "center", padding: "4px 24px 10px" }}>
        {headers.map((h) => {
          const aktif = sort.key === h.key;
          return (
            <button
              key={h.key}
              type="button"
              onClick={() => setSort((s) => nextSort(s, h.key))}
              title={GOV_COPY["ov.header.sortTitle"]}
              aria-label={`${GOV_COPY["ov.header.sortTitle"]} ${h.label}`}
              className={`gov-disp${aktif ? " gov-well-sm" : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, justifySelf: h.end ? "end" : "start", background: aktif ? undefined : "transparent", color: aktif ? "var(--foreground)" : "var(--muted-foreground)", fontWeight: 700, fontSize: 10.5, lineHeight: 1, letterSpacing: "0.11em" }}
            >
              {h.label}
              <span aria-hidden="true" style={{ width: 7, height: 7, background: "currentColor", clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)", opacity: aktif ? 1 : 0, transform: `rotate(${aktif && sort.dir === "asc" ? "180deg" : "0deg"})`, transition: "transform .15s" }} />
            </button>
          );
        })}
      </div>
      {rows.map((r) => {
        const b = BENTUK[r.verdictWarna];
        return (
          <div
            key={r.id}
            role="link"
            tabIndex={0}
            onClick={() => buka(r.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); buka(r.id); } }}
            aria-label={`Buka detail ${r.nama}`}
            className="gov-row"
            style={{ display: "grid", gridTemplateColumns: grid, gap: 18, alignItems: "center", padding: "13px 24px", borderTop: "1px solid var(--border-hairline)" }}
          >
            <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.35 }}>{r.nama}</div>
            <div style={{ fontWeight: 500, fontSize: 12.5, lineHeight: 1.3, color: "var(--muted-foreground)" }}>{r.provinsi}</div>
            <div>
              <span className="gov-well-sm" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 999 }}>
                <VerdictShape bentuk={b} size={10} />
                <span style={{ fontWeight: 700, fontSize: 11.5, lineHeight: 1, color: b.colorVar }}>{b.label}</span>
              </span>
            </div>
            <div className="gov-num" style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1, textAlign: "right", paddingRight: 14 }}>{r.temuanCount}</div>
          </div>
        );
      })}
      {rows.length === 0 ? (
        <div style={{ padding: "28px 24px", borderTop: "1px solid var(--border-hairline)", fontWeight: 500, fontSize: 13, lineHeight: 1.5, color: "var(--muted-foreground)", textAlign: "center" }}>
          {GOV_COPY["ov.kosongFilter"]}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 14, padding: "14px 24px 12px", borderTop: "1px solid var(--border-hairline)" }}>
        <div style={{ fontWeight: 500, fontSize: 11.5, lineHeight: 1, color: "var(--muted-foreground)" }}>{kpi.merah} merah · {kpi.kuning} kuning · {kpi.hijau} hijau</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontWeight: 500, fontSize: 11.5, lineHeight: 1, color: "var(--muted-foreground)" }}>{GOV_COPY["ov.footer.hint"]}</div>
      </div>
    </div>
  );
}

function SkelBar({ w, h, r = 999, mt = 0 }: { w: string; h: number; r?: number; mt?: number }) {
  return <div className="gov-well-sm" style={{ height: h, width: w, borderRadius: r, marginTop: mt, animation: "prm-pulse 1.6s ease-in-out infinite" }} />;
}

function Memuat() {
  return (
    <>
      <div aria-busy="true" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 20 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="gov-panel" style={{ padding: "18px 20px 16px", borderRadius: 20 }}>
            <SkelBar w="62%" h={9} />
            <SkelBar w="38%" h={26} r={12} mt={14} />
          </div>
        ))}
      </div>
      <div className="gov-panel" style={{ ...PANEL, padding: "22px 24px" }}>
        <div className="gov-well" style={{ height: 30, borderRadius: 999, animation: "prm-pulse 1.6s ease-in-out infinite" }} />
      </div>
      <div className="gov-panel" style={{ ...PANEL, padding: "10px 0 18px" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1.1fr 0.9fr 0.6fr", gap: 18, alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--border-hairline)" }}>
            <SkelBar w="70%" h={11} />
            <SkelBar w="60%" h={11} />
            <SkelBar w="50%" h={11} />
            <SkelBar w="40%" h={11} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, justifyContent: "center" }}>
        <div aria-hidden="true" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--border-hairline)", borderTopColor: "var(--primary)", animation: "prm-spin .9s linear infinite" }} />
        <div style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1, color: "var(--muted-foreground)" }}>{GOV_COPY["ov.memuat"]}</div>
      </div>
    </>
  );
}

export function OverviewClient() {
  const [status, setStatus] = useState<Status>("memuat");
  const [data, setData] = useState<GovOverview | null>(null);

  const muat = useCallback(async () => {
    setStatus("memuat");
    try {
      const res = await fetch("/api/gov/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setStatus("gagal");
        return;
      }
      const d = json.data as GovOverview;
      setData(d);
      setStatus(d.kpi.jumlahKoperasi > 0 ? "default" : "kosong");
    } catch {
      setStatus("gagal");
    }
  }, []);

  useEffect(() => {
    // ponytail: fetch-on-mount; setState terjadi setelah await (bukan sinkron).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void muat();
  }, [muat]);

  return (
    <div style={{ maxWidth: 1440, minWidth: 1240, margin: "0 auto", padding: "26px 48px 60px" }}>
      <GovHeader />
      <Judul />

      {status === "gagal" ? (
        <div role="alert" className="gov-well-sm" style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 20px", padding: "14px 20px", borderRadius: 16, background: "var(--verdict-merah-surface)" }}>
          <VerdictShape bentuk={BENTUK.merah} size={12} />
          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.5, color: "var(--verdict-merah)" }}>{GOV_COPY["ov.gagal.banner"]}</div>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => void muat()} className="gov-primary" style={{ padding: "11px 22px", borderRadius: 999, fontWeight: 700, fontSize: 12.5, lineHeight: 1 }}>{GOV_COPY["ov.gagal.cta"]}</button>
        </div>
      ) : null}

      {status === "memuat" ? <Memuat /> : <KpiStrip status={status} data={data} />}

      {status === "default" && data ? (
        <>
          <Distribusi data={data} />
          <Tabel data={data} />
        </>
      ) : null}

      {status === "kosong" ? (
        <div className="gov-panel" style={{ ...PANEL, padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div className="gov-raised-sm" style={{ width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="gov-well-sm" style={{ width: 24, height: 24, borderRadius: "50%" }} />
          </div>
          <div className="gov-disp" style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3, marginTop: 20 }}>{GOV_COPY["ov.kosong.judul"]}</div>
          <div style={{ fontWeight: 500, fontSize: 12.5, lineHeight: 1.6, color: "var(--muted-foreground)", marginTop: 8, maxWidth: 420 }}>{GOV_COPY["ov.kosong.sub"]}</div>
          <button type="button" onClick={() => void muat()} className="gov-control" style={{ marginTop: 22, padding: "12px 24px", borderRadius: 999, fontWeight: 700, fontSize: 12.5, lineHeight: 1, color: "var(--foreground)" }}>{GOV_COPY["ov.kosong.cta"]}</button>
        </div>
      ) : null}

      {status === "gagal" ? (
        <div className="gov-panel" style={{ ...PANEL, padding: "44px 24px", textAlign: "center" }}>
          <div style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.5, color: "var(--muted-foreground)" }}>{GOV_COPY["ov.gagal.panel"]}</div>
        </div>
      ) : null}
    </div>
  );
}
