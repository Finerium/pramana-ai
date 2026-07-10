"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GovOverview, VerdictColor } from "@/lib/contracts";
import { GOV_COPY } from "@/lib/copy/gov";
import { AGENT_LABELS } from "@/lib/copy";
import { BENTUK } from "@/app/(gov)/_logic/verdict";
import {
  DEFAULT_DIR,
  deltaKpi,
  deltaRingkasTeks,
  deriveDistribusi,
  filterKoperasi,
  heroKalimat,
  nextSort,
  periodeLabelDari,
  bulanDari,
  sebaranProvinsi,
  segmenLabel,
  segmenLebar,
  sortKoperasi,
  sparklineFromSeri,
  tersebarCount,
  trenChart,
  waktuRelatif,
  worstWarna,
  type DeltaChip,
  type SortDir,
  type SortKey,
} from "@/app/(gov)/_logic/overview";
import { terapkanTema } from "./theme";
import { ThemeToggle } from "./ThemeToggle";
import { VerdictShape } from "./VerdictShape";

type Status = "memuat" | "default" | "kosong" | "gagal";
type TemaDefault = "terang" | "gelap" | "sistem";

const PANEL_MT: React.CSSProperties = { marginTop: 20 };
const MUTED = "var(--muted-foreground)";

const stripKop = (nama: string) =>
  nama.replace("Koperasi Desa Merah Putih ", "");
const toPts = (pts: Array<{ x: number; y: number }>) =>
  pts.map((p) => `${p.x},${p.y}`).join(" ");

// --- Ikon bentuk (caret dropdown, segitiga delta) --------------------------

function Caret({ color = MUTED, rot = 0 }: { color?: string; rot?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 7,
        height: 7,
        background: color,
        clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)",
        opacity: 0.6,
        transform: `rotate(${rot}deg)`,
        display: "inline-block",
      }}
    />
  );
}

// --- Header (logo, dropdown periode, tema, menu akun) -----------------------

function Header({
  periodeLabel,
  periodeItems,
  bukaPeriode,
  onTogglePeriode,
  onPilihPeriode,
  bukaProfil,
  onToggleProfil,
  onPengaturan,
  onKeluar,
}: {
  periodeLabel: string;
  periodeItems: Array<{
    periode: string;
    label: string;
    warna: VerdictColor;
    aktif: boolean;
  }>;
  bukaPeriode: boolean;
  onTogglePeriode: () => void;
  onPilihPeriode: (p: string) => void;
  bukaProfil: boolean;
  onToggleProfil: () => void;
  onPengaturan: () => void;
  onKeluar: () => void;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        position: "relative",
        zIndex: 70,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          aria-hidden="true"
          className="gov-raised-sm"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
          }}
        >
          <div
            className="gov-well-sm"
            style={{ width: 16, height: 16, borderRadius: "50%" }}
          />
        </div>
        <div>
          <div
            className="gov-disp"
            style={{
              fontWeight: 800,
              fontSize: 19,
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            {GOV_COPY["brand.nama"]}
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 9.5,
              lineHeight: 1,
              letterSpacing: "0.15em",
              color: MUTED,
              marginTop: 5,
            }}
          >
            {GOV_COPY["brand.sub"]}
          </div>
        </div>
      </div>
      <div style={{ flex: 1 }} />

      {/* Dropdown periode */}
      <PeriodeDropdown
        label={periodeLabel}
        items={periodeItems}
        open={bukaPeriode}
        onToggle={onTogglePeriode}
        onPilih={onPilihPeriode}
      />

      <ThemeToggle />

      {/* Menu akun */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={onToggleProfil}
          aria-expanded={bukaProfil}
          aria-label="Menu akun"
          className="gov-raised-sm"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 16px 6px 6px",
            borderRadius: 999,
          }}
        >
          <span
            className="gov-disp gov-well-sm"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 11,
              lineHeight: 1,
              color: MUTED,
            }}
          >
            {GOV_COPY["shell.user.inisial"]}
          </span>
          <span>
            <span
              style={{
                display: "block",
                fontWeight: 700,
                fontSize: 12,
                lineHeight: 1.1,
              }}
            >
              {GOV_COPY["shell.user.nama"]}
            </span>
            <span
              style={{
                display: "block",
                fontWeight: 500,
                fontSize: 10,
                lineHeight: 1.1,
                color: MUTED,
                marginTop: 3,
              }}
            >
              Kementerian Koperasi RI
            </span>
          </span>
          <Caret color={MUTED} />
        </button>
        {bukaProfil ? (
          <div
            role="menu"
            className="gov-raised-sm"
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              width: 250,
              padding: 8,
              borderRadius: 18,
              background: "var(--background)",
              boxShadow: "var(--shadow-raised-lg)",
              animation: "prm-pop .35s var(--ease-mewah) both",
              zIndex: 80,
            }}
          >
            <div style={{ padding: "12px 14px 10px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                {GOV_COPY["shell.user.nama"]}
              </div>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: MUTED,
                  marginTop: 3,
                }}
              >
                {GOV_COPY["shell.user.email"]}
              </div>
            </div>
            <div
              style={{
                height: 1,
                background: "var(--border-hairline)",
                margin: "4px 8px",
              }}
            />
            <button
              type="button"
              role="menuitem"
              onClick={onPengaturan}
              className="gov-row"
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 14px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 12.5,
                lineHeight: 1,
              }}
            >
              Pengaturan
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={onKeluar}
              className="gov-row"
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 14px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 12.5,
                lineHeight: 1,
                color: "var(--verdict-merah)",
              }}
            >
              Keluar
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function PeriodeDropdown({
  label,
  items,
  open,
  onToggle,
  onPilih,
}: {
  label: string;
  items: Array<{
    periode: string;
    label: string;
    warna: VerdictColor;
    aktif: boolean;
  }>;
  open: boolean;
  onToggle: () => void;
  onPilih: (p: string) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label="Ganti periode"
        className="gov-well-sm"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "11px 18px",
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 12,
          lineHeight: 1,
          color: "var(--foreground)",
        }}
      >
        <span style={{ color: MUTED }}>Periode</span> {label}
        <Caret color="currentColor" />
      </button>
      {open ? (
        <div
          role="menu"
          className="gov-raised-sm"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 200,
            padding: 8,
            borderRadius: 18,
            background: "var(--background)",
            boxShadow: "var(--shadow-raised-lg)",
            animation: "prm-pop .35s var(--ease-mewah) both",
            zIndex: 80,
          }}
        >
          {items.map((it) => (
            <button
              key={it.periode}
              type="button"
              role="menuitem"
              onClick={() => onPilih(it.periode)}
              className={it.aktif ? "gov-well-sm" : "gov-row"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 12.5,
                lineHeight: 1,
                background: it.aktif ? undefined : "transparent",
                color: it.aktif ? "var(--foreground)" : MUTED,
              }}
            >
              {it.label}
              <span style={{ flex: 1 }} />
              <VerdictShape bentuk={BENTUK[it.warna]} size={9} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// --- Panel: Kondisi Nasional (hero) ----------------------------------------

function HeroKondisi({
  data,
  filterVerdict,
  onFilter,
}: {
  data: GovOverview;
  filterVerdict: VerdictColor | null;
  onFilter: (w: VerdictColor) => void;
}) {
  const kpi = data.kpi;
  const b = bulanDari(data.periode);
  const activeIdx = data.periodeTersedia.indexOf(data.periode);
  const bulanPrev =
    activeIdx > 0
      ? bulanDari(data.periodeTersedia[activeIdx - 1] ?? "").nama
      : null;
  const segmen = deriveDistribusi(kpi).filter((s) => s.count > 0);
  return (
    <div
      className="gov-panel"
      style={{ display: "flex", gap: 26, padding: "24px 28px" }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="gov-disp"
          style={{
            fontWeight: 700,
            fontSize: 10,
            lineHeight: 1,
            letterSpacing: "0.13em",
            color: MUTED,
          }}
        >
          KONDISI NASIONAL · {b.nama.toUpperCase()} {b.tahun}
        </div>
        <div
          className="gov-disp"
          style={{
            fontWeight: 800,
            fontSize: 21,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            marginTop: 10,
          }}
        >
          {heroKalimat(kpi)}
        </div>
        <div style={{ flex: 1 }} />
        <div
          role="group"
          aria-label={`Distribusi verdict: ${kpi.hijau} hijau, ${kpi.kuning} kuning, ${kpi.merah} merah dari ${kpi.jumlahKoperasi} koperasi`}
          className="gov-well"
          style={{
            display: "flex",
            height: 30,
            borderRadius: 999,
            marginTop: 16,
            padding: 5,
            gap: 4,
          }}
        >
          {segmen.map((s) => {
            const aktif = filterVerdict === s.warna;
            return (
              <button
                key={s.warna}
                type="button"
                onClick={() => onFilter(s.warna)}
                aria-pressed={aktif}
                title={`Saring tabel: ${BENTUK[s.warna].label}`}
                style={{
                  width: `${segmenLebar(s.count, kpi.jumlahKoperasi)}%`,
                  borderRadius: 999,
                  background: BENTUK[s.warna].colorVar,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: aktif ? "0 0 0 3px var(--ring)" : "none",
                  outlineOffset: 3,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 11,
                    lineHeight: 1,
                    color: "var(--verdict-on)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {segmenLabel(s.warna, s.count, kpi.jumlahKoperasi)}
                </span>
              </button>
            );
          })}
        </div>
        <div
          style={{
            fontWeight: 500,
            fontSize: 11.5,
            lineHeight: 1.5,
            color: MUTED,
            marginTop: 12,
          }}
        >
          {deltaRingkasTeks(data.kpiDelta, bulanPrev)} · Klik segmen untuk
          menyaring tabel.
        </div>
      </div>
      <div
        style={{
          width: 200,
          flex: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          textAlign: "right",
        }}
      >
        <div
          className="gov-disp"
          style={{
            fontWeight: 700,
            fontSize: 10,
            lineHeight: 1,
            letterSpacing: "0.13em",
            color: MUTED,
          }}
        >
          {GOV_COPY["ov.kpi.temuan"]}
        </div>
        <div
          className="gov-num"
          style={{ fontWeight: 800, fontSize: 58, lineHeight: 1, marginTop: 8 }}
        >
          {kpi.temuanTerbuka}
        </div>
        <div
          style={{
            fontWeight: 500,
            fontSize: 11.5,
            lineHeight: 1.5,
            color: MUTED,
            marginTop: 6,
          }}
        >
          tersebar di {tersebarCount(data.koperasi)} koperasi
        </div>
      </div>
    </div>
  );
}

// --- Panel: Perlu Perhatian ------------------------------------------------

function PerluPerhatian({
  data,
  onBuka,
  onPrefetch,
}: {
  data: GovOverview;
  onBuka: (id: string) => void;
  onPrefetch: (id: string) => void;
}) {
  const items = data.perluPerhatian.slice(0, 4);
  return (
    <div
      className="gov-panel"
      style={{ padding: "20px 22px", display: "flex", flexDirection: "column" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div
          className="gov-disp"
          style={{
            fontWeight: 700,
            fontSize: 10,
            lineHeight: 1,
            letterSpacing: "0.13em",
            color: MUTED,
          }}
        >
          PERLU PERHATIAN
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 10.5,
            lineHeight: 1,
            color: "var(--verdict-merah)",
            padding: "4px 9px",
            borderRadius: 999,
            background: "var(--verdict-merah-surface)",
          }}
        >
          {data.perluPerhatian.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 6 }}>
        {items.map((p) => (
          <div
            key={p.id}
            onMouseEnter={() => onPrefetch(p.id)}
            onFocus={() => onPrefetch(p.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "11px 2px",
              borderTop: "1px solid var(--border-hairline)",
            }}
          >
            <VerdictShape bentuk={BENTUK[p.verdictWarna]} size={10} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: 12,
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {stripKop(p.nama)}
              </span>
              <span
                style={{
                  display: "block",
                  fontWeight: 500,
                  fontSize: 10.5,
                  lineHeight: 1.4,
                  color: MUTED,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.alasan}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onBuka(p.id)}
              className="gov-control"
              style={{
                padding: "8px 13px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 10.5,
                lineHeight: 1,
              }}
            >
              Buka
            </button>
            <button
              type="button"
              onClick={() => onBuka(p.id)}
              aria-label={`Periksa ${stripKop(p.nama)}`}
              className="gov-primary"
              style={{
                width: 76,
                padding: "8px 0",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 10.5,
                lineHeight: 1,
                textAlign: "center",
              }}
            >
              Periksa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Baris KPI --------------------------------------------------------------

function DeltaBadge({ delta }: { delta: DeltaChip }) {
  return (
    <div
      title="Dibanding bulan sebelumnya"
      className="gov-well-sm"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 9px",
        borderRadius: 999,
        marginBottom: 3,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 7,
          height: 6,
          background: delta.warnaVar,
          clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
          transform: `rotate(${delta.turun ? 180 : 0}deg)`,
          opacity: delta.nol ? 0 : 1,
        }}
      />
      <span
        className="gov-num"
        style={{
          fontWeight: 700,
          fontSize: 10,
          lineHeight: 1,
          color: delta.warnaVar,
        }}
      >
        {delta.teks}
      </span>
    </div>
  );
}

function Sparkline({
  seri,
  warnaVar,
  width = 92,
  height = 26,
}: {
  seri: number[];
  warnaVar: string;
  width?: number;
  height?: number;
}) {
  const pts = sparklineFromSeri(
    seri.length > 1 ? seri : [seri[0] ?? 0, seri[0] ?? 0],
    {
      width,
      height,
    },
  );
  const last = pts[pts.length - 1];
  return (
    <svg
      aria-hidden="true"
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block", marginTop: 10 }}
    >
      <polyline
        points={toPts(pts)}
        fill="none"
        stroke={warnaVar}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation: "prm-draw 1.1s var(--ease-mewah) .3s forwards",
        }}
      />
      {last ? <circle cx={last.x} cy={last.y} r={2.6} fill={warnaVar} /> : null}
    </svg>
  );
}

function KpiRow({
  data,
  filterVerdict,
  onFilter,
}: {
  data: GovOverview;
  filterVerdict: VerdictColor | null;
  onFilter: (w: VerdictColor) => void;
}) {
  const kpi = data.kpi;
  const d = data.kpiDelta;
  const activeIdx = data.periodeTersedia.indexOf(data.periode);
  const showDelta = activeIdx > 0;
  const seri = (k: "hijau" | "kuning" | "merah" | "temuan") =>
    data.tren.slice(0, activeIdx + 1).map((t) => t[k]);
  const seriTotal = data.tren
    .slice(0, activeIdx + 1)
    .map((t) => t.hijau + t.kuning + t.merah);

  type Card = {
    label: string;
    nilai: number;
    bentuk: VerdictColor | null;
    seri: number[];
    sparkVar: string;
    delta: DeltaChip | null;
    filter: VerdictColor | null;
  };
  const cards: Card[] = [
    {
      label: GOV_COPY["ov.kpi.koperasi"],
      nilai: kpi.jumlahKoperasi,
      bentuk: null,
      seri: seriTotal,
      sparkVar: MUTED,
      delta: null,
      filter: null,
    },
    {
      label: GOV_COPY["ov.kpi.hijau"],
      nilai: kpi.hijau,
      bentuk: "hijau",
      seri: seri("hijau"),
      sparkVar: "var(--verdict-hijau)",
      delta: showDelta ? deltaKpi(d.hijau, false) : null,
      filter: "hijau",
    },
    {
      label: GOV_COPY["ov.kpi.kuning"],
      nilai: kpi.kuning,
      bentuk: "kuning",
      seri: seri("kuning"),
      sparkVar: "var(--verdict-kuning)",
      delta: showDelta ? deltaKpi(d.kuning, true) : null,
      filter: "kuning",
    },
    {
      label: GOV_COPY["ov.kpi.merah"],
      nilai: kpi.merah,
      bentuk: "merah",
      seri: seri("merah"),
      sparkVar: "var(--verdict-merah)",
      delta: showDelta ? deltaKpi(d.merah, true) : null,
      filter: "merah",
    },
    {
      label: GOV_COPY["ov.kpi.temuan"],
      nilai: kpi.temuanTerbuka,
      bentuk: null,
      seri: seri("temuan"),
      sparkVar: "var(--primary)",
      delta: showDelta ? deltaKpi(d.temuanTerbuka, true) : null,
      filter: null,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        gap: 20,
        ...PANEL_MT,
      }}
    >
      {cards.map((c) => {
        const aktif = c.filter !== null && filterVerdict === c.filter;
        const inner = (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {c.bentuk ? (
                <VerdictShape bentuk={BENTUK[c.bentuk]} size={9} />
              ) : null}
              <div
                className="gov-disp"
                style={{
                  fontWeight: 700,
                  fontSize: 9.5,
                  lineHeight: 1.2,
                  letterSpacing: "0.12em",
                  color: MUTED,
                }}
              >
                {c.label}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                marginTop: 10,
              }}
            >
              <div
                className="gov-num"
                style={{ fontWeight: 700, fontSize: 32, lineHeight: 1 }}
              >
                {c.nilai}
              </div>
              {c.delta ? <DeltaBadge delta={c.delta} /> : null}
            </div>
            <Sparkline seri={c.seri} warnaVar={c.sparkVar} />
          </>
        );
        const base: React.CSSProperties = {
          padding: "16px 18px 14px",
          borderRadius: 20,
          textAlign: "left",
          outline: aktif ? "2px solid var(--ring)" : undefined,
          outlineOffset: aktif ? 2 : undefined,
        };
        return c.filter ? (
          <button
            key={c.label}
            type="button"
            onClick={() => onFilter(c.filter as VerdictColor)}
            aria-pressed={aktif}
            className="gov-panel"
            style={base}
          >
            {inner}
          </button>
        ) : (
          <div key={c.label} className="gov-panel" style={base}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

// --- Panel: Tren Nasional 6 Bulan ------------------------------------------

function LegendItem({ warna }: { warna: VerdictColor }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <VerdictShape bentuk={BENTUK[warna]} size={9} />
      <span
        style={{ fontWeight: 600, fontSize: 11, lineHeight: 1, color: MUTED }}
      >
        {BENTUK[warna].label}
      </span>
    </span>
  );
}

function TrenPanel({
  data,
  onPilihPeriode,
}: {
  data: GovOverview;
  onPilihPeriode: (p: string) => void;
}) {
  const [tip, setTip] = useState<number | null>(null);
  const activeIdx = data.periodeTersedia.indexOf(data.periode);
  const g = trenChart(data.tren, activeIdx);
  const warnaKunci: VerdictColor[] = ["hijau", "kuning", "merah"];
  const tipPoint = tip !== null ? data.tren[tip] : null;
  const tipX = tip !== null ? ((g.kolomX[tip] ?? 0) / g.w) * 100 : 0;
  return (
    <div className="gov-panel" style={{ padding: "20px 24px 18px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          className="gov-disp"
          style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1 }}
        >
          Tren Nasional 6 Bulan
        </div>
        <div
          style={{ fontWeight: 500, fontSize: 11, lineHeight: 1, color: MUTED }}
        >
          garis = verdict · balok = temuan
        </div>
        <div style={{ flex: 1 }} />
        <LegendItem warna="hijau" />
        <LegendItem warna="kuning" />
        <LegendItem warna="merah" />
      </div>
      <div
        className="gov-well"
        style={{
          position: "relative",
          marginTop: 14,
          borderRadius: 18,
          padding: "14px 10px 6px",
        }}
      >
        <svg
          width="100%"
          height={210}
          viewBox={`0 0 ${g.w} ${g.h}`}
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          {[52, 103, 154].map((y) => (
            <line
              key={y}
              x1={16}
              y1={y}
              x2={584}
              y2={y}
              stroke="var(--border-hairline)"
              strokeWidth={1}
              style={{ opacity: 0.4 }}
            />
          ))}
          {g.markerX !== null ? (
            <rect
              x={g.markerX}
              y={14}
              width={52}
              height={182}
              rx={10}
              fill="var(--muted-foreground)"
              opacity={0.09}
            />
          ) : null}
          {g.bar.map((b) => (
            <rect
              key={b.key}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={8}
              fill="var(--muted-foreground)"
              opacity={0.22}
            />
          ))}
          {warnaKunci.map((k, gi) => (
            <polyline
              key={k}
              points={g.garis[k]}
              fill="none"
              stroke={BENTUK[k].colorVar}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: `prm-draw 1.3s var(--ease-mewah) ${0.15 + gi * 0.15}s forwards`,
              }}
            />
          ))}
          {g.titik.map((t) => (
            <circle
              key={t.key}
              cx={t.x}
              cy={t.y}
              r={3.4}
              fill={BENTUK[t.warna].colorVar}
              stroke="var(--surface)"
              strokeWidth={1.5}
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: "14px 10px 6px",
            display: "flex",
          }}
        >
          {data.tren.map((t, i) => (
            <div
              key={t.periode}
              onMouseEnter={() => setTip(i)}
              onMouseLeave={() => setTip(null)}
              onClick={() => onPilihPeriode(t.periode)}
              title={`Lihat ${bulanDari(t.periode).nama}`}
              style={{ flex: 1, cursor: "pointer" }}
            />
          ))}
        </div>
        {tipPoint ? (
          <div
            className="gov-raised-sm"
            style={{
              position: "absolute",
              top: 10,
              left: `${tipX}%`,
              transform: "translateX(-50%)",
              pointerEvents: "none",
              padding: "10px 14px",
              borderRadius: 14,
              background: "var(--surface-fill)",
              boxShadow: "var(--shadow-raised-lg)",
              whiteSpace: "nowrap",
              zIndex: 5,
            }}
          >
            <div
              className="gov-disp"
              style={{ fontWeight: 700, fontSize: 11, lineHeight: 1 }}
            >
              {periodeLabelDari(tipPoint.periode)}
            </div>
            <div
              className="gov-num"
              style={{
                fontWeight: 500,
                fontSize: 11,
                lineHeight: 1.6,
                color: MUTED,
                marginTop: 5,
              }}
            >
              Hijau {tipPoint.hijau} · Kuning {tipPoint.kuning} · Merah{" "}
              {tipPoint.merah}
              <br />
              Temuan terbuka {tipPoint.temuan}
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", marginTop: 8, padding: "0 10px" }}>
        {data.tren.map((t, i) => (
          <div
            key={t.periode}
            style={{
              flex: 1,
              textAlign: "center",
              fontWeight: 600,
              fontSize: 10.5,
              lineHeight: 1,
              color: i === activeIdx ? "var(--foreground)" : MUTED,
            }}
          >
            {bulanDari(t.periode).singkat}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Panel: AI Agent Pemeriksa ---------------------------------------------

function AgentPanel({ data }: { data: GovOverview }) {
  const feed = data.agenFeed;
  return (
    <div
      className="gov-panel"
      style={{
        padding: "20px 22px 18px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          className="gov-disp"
          style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1 }}
        >
          AI Agent Pemeriksa
        </div>
        <div style={{ flex: 1 }} />
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--verdict-hijau)",
            animation: "prm-denyut 2.4s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontWeight: 600,
            fontSize: 10.5,
            lineHeight: 1,
            color: MUTED,
          }}
        >
          {feed.agen.length} agen aktif
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 14,
          flex: 1,
        }}
      >
        {feed.agen.map((a) => (
          <div
            key={a.agent}
            className="gov-well-sm"
            style={{ padding: "13px 15px", borderRadius: 16 }}
          >
            <div style={{ fontWeight: 700, fontSize: 11.5, lineHeight: 1.3 }}>
              {AGENT_LABELS.pemerintah[a.agent]}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 4,
              }}
            >
              <span
                className="gov-raised-sm"
                style={{
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontWeight: 600,
                  fontSize: 9,
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  color: MUTED,
                  padding: "3px 7px",
                  borderRadius: 999,
                  background: "var(--surface)",
                }}
              >
                {feed.model}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 9.5,
                  lineHeight: 1,
                  color: "var(--verdict-hijau)",
                }}
              >
                Aktif
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                marginTop: 11,
              }}
            >
              <span
                className="gov-num"
                style={{ fontWeight: 700, fontSize: 24, lineHeight: 1 }}
              >
                {a.temuan}
              </span>
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 10,
                  lineHeight: 1.3,
                  color: MUTED,
                  marginBottom: 2,
                }}
              >
                temuan
              </span>
              <span style={{ flex: 1 }} />
              <Sparkline
                seri={[a.temuan, a.temuan]}
                warnaVar={MUTED}
                width={52}
                height={20}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        className="gov-well-sm"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
          padding: "12px 15px",
          borderRadius: 16,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 10,
            height: 10,
            background: "var(--primary)",
            borderRadius: 2,
            flex: "none",
          }}
        />
        <span style={{ fontWeight: 700, fontSize: 11.5, lineHeight: 1.3 }}>
          Adjudikator
        </span>
        <span
          className="gov-raised-sm"
          style={{
            fontFamily: "ui-monospace, Menlo, monospace",
            fontWeight: 600,
            fontSize: 9,
            lineHeight: 1,
            letterSpacing: "0.06em",
            color: MUTED,
            padding: "3px 7px",
            borderRadius: 999,
            background: "var(--surface)",
          }}
        >
          {feed.adjudikatorModel}
        </span>
        <span
          style={{
            flex: 1,
            fontWeight: 500,
            fontSize: 10.5,
            lineHeight: 1.4,
            color: MUTED,
          }}
        >
          menyatukan temuan menjadi verdict
        </span>
        <span
          style={{
            fontWeight: 600,
            fontSize: 9.5,
            lineHeight: 1,
            color: "var(--verdict-hijau)",
          }}
        >
          Aktif
        </span>
      </div>
    </div>
  );
}

// --- Panel: Sebaran Provinsi (kartogram tile, cross-filter tabel) ----------

type ProvPos = { n: string; a: string; c: number; r: number };

// Tata letak kartogram (port bundle dashboard, verbatim posisi grid + singkatan
// provinsi). Ini presentasi, BUKAN data: angka + warna tiap tile berasal dari
// agregasi koperasi nyata (sebaranProvinsi). "dari 34" = PROV.length.
const PROV: ProvPos[] = [
  { n: "Aceh", a: "ACEH", c: 1, r: 1 },
  { n: "Sumatera Utara", a: "SUMUT", c: 1, r: 2 },
  { n: "Riau", a: "RIAU", c: 2, r: 2 },
  { n: "Kepulauan Riau", a: "KEPRI", c: 3, r: 2 },
  { n: "Sumatera Barat", a: "SUMBAR", c: 1, r: 3 },
  { n: "Jambi", a: "JAMBI", c: 2, r: 3 },
  { n: "Bangka Belitung", a: "BABEL", c: 3, r: 3 },
  { n: "Bengkulu", a: "BKL", c: 1, r: 4 },
  { n: "Sumatera Selatan", a: "SUMSEL", c: 2, r: 4 },
  { n: "Lampung", a: "LAMPG", c: 3, r: 4 },
  { n: "Kalimantan Utara", a: "KLTARA", c: 6, r: 1 },
  { n: "Kalimantan Barat", a: "KALBAR", c: 5, r: 2 },
  { n: "Kalimantan Timur", a: "KALTIM", c: 6, r: 2 },
  { n: "Kalimantan Tengah", a: "KALTNG", c: 5, r: 3 },
  { n: "Kalimantan Selatan", a: "KALSEL", c: 6, r: 3 },
  { n: "Sulawesi Utara", a: "SULUT", c: 10, r: 1 },
  { n: "Gorontalo", a: "GORON", c: 10, r: 2 },
  { n: "Sulawesi Tengah", a: "SULTNG", c: 9, r: 3 },
  { n: "Sulawesi Barat", a: "SULBAR", c: 8, r: 3 },
  { n: "Sulawesi Selatan", a: "SULSEL", c: 9, r: 4 },
  { n: "Sulawesi Tenggara", a: "SULTRA", c: 10, r: 4 },
  { n: "Maluku Utara", a: "MALUT", c: 11, r: 2 },
  { n: "Maluku", a: "MALUKU", c: 11, r: 4 },
  { n: "Papua Barat", a: "PAPBAR", c: 12, r: 3 },
  { n: "Papua", a: "PAPUA", c: 13, r: 3 },
  { n: "Banten", a: "BANTEN", c: 3, r: 5 },
  { n: "DKI Jakarta", a: "JKT", c: 4, r: 5 },
  { n: "Jawa Barat", a: "JABAR", c: 5, r: 5 },
  { n: "Jawa Tengah", a: "JATENG", c: 6, r: 5 },
  { n: "DI Yogyakarta", a: "DIY", c: 6, r: 6 },
  { n: "Jawa Timur", a: "JATIM", c: 7, r: 5 },
  { n: "Bali", a: "BALI", c: 8, r: 5 },
  { n: "Nusa Tenggara Barat", a: "NTB", c: 9, r: 5 },
  { n: "Nusa Tenggara Timur", a: "NTT", c: 10, r: 5 },
];

const ABBREV: React.CSSProperties = {
  fontFamily: "var(--font-archivo), Archivo, sans-serif",
  fontWeight: 700,
  fontSize: 7.5,
  lineHeight: 1,
  letterSpacing: "0.04em",
};

function SebaranProvinsi({
  koperasi,
  filterProv,
  onToggleProv,
}: {
  koperasi: GovOverview["koperasi"];
  filterProv: string | null;
  onToggleProv: (provinsi: string) => void;
}) {
  const agg = sebaranProvinsi(koperasi);
  const byNama = new Map(agg.map((a) => [a.provinsi, a]));
  return (
    <div className="gov-panel" style={{ padding: "20px 24px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          className="gov-disp"
          style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1 }}
        >
          Sebaran Provinsi
        </div>
        <div
          style={{ fontWeight: 500, fontSize: 11, lineHeight: 1, color: MUTED }}
        >
          {agg.length} provinsi aktif dari {PROV.length}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(13, 1fr)",
          gap: 6,
          marginTop: 16,
        }}
      >
        {PROV.map((p) => {
          const d = byNama.get(p.n);
          const pos: React.CSSProperties = {
            gridColumn: String(p.c),
            gridRow: String(p.r),
            aspectRatio: "1",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          };
          if (!d) {
            return (
              <div
                key={p.a}
                title={`${p.n}, belum masuk pemantauan`}
                style={{ ...pos, background: "var(--well)" }}
              >
                <span style={{ ...ABBREV, color: "var(--muted-foreground)" }}>
                  {p.a}
                </span>
              </div>
            );
          }
          const b = BENTUK[d.verdictTerburuk];
          const dipilih = filterProv === p.n;
          return (
            <button
              key={p.a}
              type="button"
              onClick={() => onToggleProv(p.n)}
              aria-pressed={dipilih}
              aria-label={`${p.n}, ${d.jumlahKoperasi} koperasi, ${d.temuanTotal} temuan terbuka, terburuk ${b.label}`}
              className={dipilih ? undefined : "gov-raised-sm"}
              style={{
                ...pos,
                flexDirection: "column",
                gap: 3,
                cursor: "pointer",
                background: dipilih ? b.colorVar : undefined,
                boxShadow: dipilih ? "var(--shadow-pressed-sm)" : undefined,
              }}
            >
              <span
                style={{
                  ...ABBREV,
                  color: dipilih ? "var(--verdict-on)" : "var(--foreground)",
                }}
              >
                {p.a}
              </span>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 3 }}
              >
                <VerdictShape bentuk={b} size={7} />
                <span
                  className="gov-num"
                  style={{
                    fontWeight: 700,
                    fontSize: 9,
                    lineHeight: 1,
                    color: dipilih ? "var(--verdict-on)" : "var(--foreground)",
                  }}
                >
                  {d.temuanTotal}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div
        style={{
          fontWeight: 500,
          fontSize: 10.5,
          lineHeight: 1.5,
          color: MUTED,
          marginTop: 12,
        }}
      >
        Angka = temuan terbuka. Klik provinsi untuk menyaring tabel. Provinsi
        lain belum masuk pemantauan.
      </div>
    </div>
  );
}

// --- Panel: Aktivitas AI Agent (feed audit_run nyata) ----------------------

function AktivitasPanel({ data }: { data: GovOverview }) {
  const items = data.aktivitas;
  const model = data.agenFeed.adjudikatorModel;
  // Waktu relatif bergantung jam klien; dihitung HANYA setelah mount (pola
  // Beranda: hindari hydration + react-hooks/purity). Helper waktuRelatif tetap
  // murni menerima `sekarang`. Tanpa setInterval: label dihitung sekali.
  const [sekarang, setSekarang] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSekarang(Date.now()), []);
  return (
    <div
      className="gov-panel"
      style={{
        padding: "20px 22px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div
          className="gov-disp"
          style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1 }}
        >
          Aktivitas AI Agent
        </div>
        <div style={{ flex: 1 }} />
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--primary)",
            animation: "prm-denyut 2.4s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontWeight: 600,
            fontSize: 10.5,
            lineHeight: 1,
            color: MUTED,
          }}
        >
          Terbaru
        </span>
      </div>
      {items.length === 0 ? (
        <div
          style={{
            padding: "28px 2px",
            fontWeight: 500,
            fontSize: 12,
            lineHeight: 1.5,
            color: MUTED,
            textAlign: "center",
          }}
        >
          Belum ada pemeriksaan pada periode ini.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 6 }}>
          {items.map((f) => {
            const b = BENTUK[f.verdictWarna];
            return (
              <div
                key={f.koperasiId}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 11,
                  padding: "11px 2px",
                  borderTop: "1px solid var(--border-hairline)",
                }}
              >
                <span
                  className="gov-well-sm"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                    marginTop: 1,
                  }}
                >
                  <VerdictShape bentuk={b} size={9} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontWeight: 600,
                      fontSize: 12,
                      lineHeight: 1.4,
                    }}
                  >
                    Pramana memeriksa Koperasi {stripKop(f.nama)}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontWeight: 500,
                      fontSize: 10.5,
                      lineHeight: 1.4,
                      color: MUTED,
                      marginTop: 2,
                    }}
                  >
                    Verdict {b.label} · {f.temuanCount} temuan · Adjudikator{" "}
                    {model}
                  </span>
                </span>
                <span
                  className="gov-num"
                  style={{
                    fontWeight: 500,
                    fontSize: 10,
                    lineHeight: 1,
                    color: MUTED,
                    whiteSpace: "nowrap",
                    marginTop: 3,
                  }}
                >
                  {sekarang === null
                    ? ""
                    : waktuRelatif(f.dibuatPada, sekarang)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Panel: Tabel koperasi (cross-filter + sort + search) ------------------

function Tabel({
  data,
  filterVerdict,
  filterProv,
  onClearFilter,
  onClearProv,
  onBuka,
  onPrefetch,
}: {
  data: GovOverview;
  filterVerdict: VerdictColor | null;
  filterProv: string | null;
  onClearFilter: () => void;
  onClearProv: () => void;
  onBuka: (id: string) => void;
  onPrefetch: (id: string) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "verdictWarna",
    dir: DEFAULT_DIR.verdictWarna,
  });
  const [cari, setCari] = useState("");
  const kpi = data.kpi;
  const total = data.koperasi.length;
  const dasar = data.koperasi.filter(
    (r) =>
      (!filterVerdict || r.verdictWarna === filterVerdict) &&
      (!filterProv || r.provinsi === filterProv),
  );
  const rows = sortKoperasi(filterKoperasi(dasar, cari), sort.key, sort.dir);

  const headers: Array<{ key: SortKey; label: string; end?: boolean }> = [
    { key: "nama", label: GOV_COPY["ov.header.koperasi"] },
    { key: "provinsi", label: GOV_COPY["ov.header.provinsi"] },
    { key: "verdictWarna", label: GOV_COPY["ov.header.verdict"] },
    { key: "temuanCount", label: GOV_COPY["ov.header.temuan"], end: true },
  ];
  const grid = "2fr 1.1fr 0.9fr 0.6fr";
  const menyaring =
    cari.trim() !== "" || filterVerdict !== null || filterProv !== null;

  return (
    <div className="gov-panel" style={{ ...PANEL_MT, padding: "8px 0 6px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 24px 12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            className="gov-disp"
            style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}
          >
            {GOV_COPY["ov.tabel.judul"]}
          </div>
          <div
            style={{
              fontWeight: 500,
              fontSize: 11.5,
              lineHeight: 1.4,
              color: MUTED,
              marginTop: 4,
            }}
          >
            {menyaring
              ? `Menampilkan ${rows.length} dari ${total} koperasi`
              : `${total} koperasi, periode ${periodeLabelDari(data.periode)}`}
          </div>
        </div>
        {filterVerdict ? (
          <button
            type="button"
            onClick={onClearFilter}
            title="Hapus saringan"
            className="gov-well-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 11,
              lineHeight: 1,
              color: "var(--foreground)",
            }}
          >
            Verdict: {BENTUK[filterVerdict].label}
            <span
              aria-hidden="true"
              style={{
                fontWeight: 700,
                fontSize: 10,
                lineHeight: 1,
                color: MUTED,
              }}
            >
              X
            </span>
          </button>
        ) : null}
        {filterProv ? (
          <button
            type="button"
            onClick={onClearProv}
            title="Hapus saringan provinsi"
            className="gov-well-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 11,
              lineHeight: 1,
              color: "var(--foreground)",
            }}
          >
            Provinsi: {filterProv}
            <span
              aria-hidden="true"
              style={{
                fontWeight: 700,
                fontSize: 10,
                lineHeight: 1,
                color: MUTED,
              }}
            >
              X
            </span>
          </button>
        ) : null}
        <div style={{ flex: 1 }} />
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder={GOV_COPY["ov.cari.placeholder"]}
          aria-label={GOV_COPY["ov.cari.placeholder"]}
          className="gov-well"
          style={{
            width: 270,
            padding: "12px 20px",
            borderRadius: 999,
            fontWeight: 500,
            fontSize: 12.5,
            lineHeight: 1,
            color: "var(--foreground)",
          }}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: grid,
          gap: 18,
          alignItems: "center",
          padding: "4px 24px 10px",
        }}
      >
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
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 999,
                justifySelf: h.end ? "end" : "start",
                background: aktif ? undefined : "transparent",
                color: aktif ? "var(--foreground)" : MUTED,
                fontWeight: 700,
                fontSize: 10.5,
                lineHeight: 1,
                letterSpacing: "0.11em",
              }}
            >
              {h.label}
              <span
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  background: "currentColor",
                  clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)",
                  opacity: aktif ? 1 : 0,
                  transform: `rotate(${aktif && sort.dir === "asc" ? "180deg" : "0deg"})`,
                  transition: "transform .15s",
                }}
              />
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
            onClick={() => onBuka(r.id)}
            onMouseEnter={() => onPrefetch(r.id)}
            onFocus={() => onPrefetch(r.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onBuka(r.id);
              }
            }}
            aria-label={`Buka detail ${r.nama}`}
            className="gov-row"
            style={{
              display: "grid",
              gridTemplateColumns: grid,
              gap: 18,
              alignItems: "center",
              padding: "13px 24px",
              borderTop: "1px solid var(--border-hairline)",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.35 }}>
              {r.nama}
            </div>
            <div
              style={{
                fontWeight: 500,
                fontSize: 12.5,
                lineHeight: 1.3,
                color: MUTED,
              }}
            >
              {r.provinsi}
            </div>
            <div>
              <span
                className="gov-well-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 13px",
                  borderRadius: 999,
                }}
              >
                <VerdictShape bentuk={b} size={10} />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 11.5,
                    lineHeight: 1,
                    color: b.colorVar,
                  }}
                >
                  {b.label}
                </span>
              </span>
            </div>
            <div
              className="gov-num"
              style={{
                fontWeight: 700,
                fontSize: 13.5,
                lineHeight: 1,
                textAlign: "right",
                paddingRight: 14,
              }}
            >
              {r.temuanCount}
            </div>
          </div>
        );
      })}
      {rows.length === 0 ? (
        <div
          style={{
            padding: "28px 24px",
            borderTop: "1px solid var(--border-hairline)",
            fontWeight: 500,
            fontSize: 13,
            lineHeight: 1.5,
            color: MUTED,
            textAlign: "center",
          }}
        >
          {GOV_COPY["ov.kosongFilter"]}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          gap: 14,
          padding: "14px 24px 12px",
          borderTop: "1px solid var(--border-hairline)",
        }}
      >
        <div
          style={{
            fontWeight: 500,
            fontSize: 11.5,
            lineHeight: 1,
            color: MUTED,
          }}
        >
          {kpi.merah} merah · {kpi.kuning} kuning · {kpi.hijau} hijau
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontWeight: 500,
            fontSize: 11.5,
            lineHeight: 1,
            color: MUTED,
          }}
        >
          {GOV_COPY["ov.footer.hint"]}
        </div>
      </div>
    </div>
  );
}

// --- Slide-over: Pengaturan -------------------------------------------------

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className="gov-well-sm"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 16px",
        borderRadius: 16,
      }}
    >
      <span
        style={{ flex: 1, fontWeight: 600, fontSize: 12.5, lineHeight: 1.4 }}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className="gov-well-sm"
        style={{
          width: 40,
          height: 22,
          borderRadius: 999,
          background: on ? "var(--primary)" : "var(--well)",
          position: "relative",
          transition: "background .3s var(--ease-mewah)",
        }}
      >
        <span
          className="gov-raised-sm"
          style={{
            position: "absolute",
            top: 3,
            left: on ? 21 : 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--surface)",
            transition: "left .3s var(--ease-mewah)",
          }}
        />
      </span>
      <span
        style={{
          fontWeight: 700,
          fontSize: 10.5,
          lineHeight: 1,
          color: MUTED,
          width: 30,
          textAlign: "right",
        }}
      >
        {on ? "Aktif" : "Mati"}
      </span>
    </button>
  );
}

function SettingsSlideOver({
  data,
  temaDef,
  onTema,
  onPilihPeriode,
  notifMerah,
  notifSelesai,
  onToggleMerah,
  onToggleSelesai,
  bukaSandi,
  onBukaSandi,
  onSimpanSandi,
  onClose,
}: {
  data: GovOverview | null;
  temaDef: TemaDefault;
  onTema: (t: TemaDefault) => void;
  onPilihPeriode: (p: string) => void;
  notifMerah: boolean;
  notifSelesai: boolean;
  onToggleMerah: () => void;
  onToggleSelesai: () => void;
  bukaSandi: boolean;
  onBukaSandi: () => void;
  onSimpanSandi: () => void;
  onClose: () => void;
}) {
  const label = (t: TemaDefault) =>
    t === "terang" ? "Terang" : t === "gelap" ? "Gelap" : "Sistem";
  const seg = (aktif: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "9px 0",
    borderRadius: 999,
    textAlign: "center",
    fontWeight: 700,
    fontSize: 11.5,
    lineHeight: 1,
    background: aktif ? "var(--surface-fill)" : "transparent",
    boxShadow: aktif ? "var(--shadow-raised-sm)" : "none",
    color: aktif ? "var(--foreground)" : MUTED,
  });
  const HEAD: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: "0.13em",
    color: MUTED,
    margin: "26px 0 12px",
  };
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 90,
          background: "var(--scrim)",
          animation: "prm-pagein .3s ease both",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pengaturan"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          zIndex: 100,
          background: "var(--background)",
          boxShadow: "var(--shadow-raised-lg)",
          padding: 30,
          overflowY: "auto",
          animation: "prm-slidein .45s var(--ease-mewah) both",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            className="gov-disp"
            style={{ fontWeight: 800, fontSize: 17, lineHeight: 1 }}
          >
            Pengaturan
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="gov-well-sm"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
              lineHeight: 1,
              color: MUTED,
            }}
          >
            X
          </button>
        </div>

        <div className="gov-disp" style={HEAD}>
          TEMA DEFAULT
        </div>
        <div
          role="group"
          aria-label="Tema default"
          className="gov-well-sm"
          style={{
            display: "flex",
            gap: 4,
            padding: 5,
            borderRadius: 999,
          }}
        >
          {(["terang", "gelap", "sistem"] as TemaDefault[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTema(t)}
              aria-pressed={temaDef === t}
              style={seg(temaDef === t)}
            >
              {label(t)}
            </button>
          ))}
        </div>

        <div className="gov-disp" style={HEAD}>
          PERIODE DEFAULT
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(data?.periodeTersedia ?? []).map((p) => {
            const aktif = data?.periode === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPilihPeriode(p)}
                aria-pressed={aktif}
                style={{
                  padding: "9px 14px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 11.5,
                  lineHeight: 1,
                  background: aktif ? "var(--surface-fill)" : "transparent",
                  boxShadow: aktif ? "var(--shadow-raised-sm)" : "none",
                  color: aktif ? "var(--foreground)" : MUTED,
                }}
              >
                {bulanDari(p).singkat}
              </button>
            );
          })}
        </div>

        <div className="gov-disp" style={HEAD}>
          PREFERENSI NOTIFIKASI
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Toggle
            on={notifMerah}
            onToggle={onToggleMerah}
            label="Koperasi merah baru"
          />
          <Toggle
            on={notifSelesai}
            onToggle={onToggleSelesai}
            label="Pemeriksaan selesai"
          />
        </div>

        <div className="gov-disp" style={HEAD}>
          AKUN
        </div>
        <div
          className="gov-raised-sm"
          style={{ padding: "16px 18px", borderRadius: 16 }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
            {GOV_COPY["shell.user.nama"]}
          </div>
          <div
            style={{
              fontWeight: 500,
              fontSize: 11.5,
              lineHeight: 1.6,
              color: MUTED,
              marginTop: 4,
            }}
          >
            {GOV_COPY["shell.user.email"]}
            <br />
            Kementerian Koperasi RI
          </div>
          {bukaSandi ? (
            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <input
                type="password"
                placeholder="Kata sandi baru"
                aria-label="Kata sandi baru"
                className="gov-well"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 16px",
                  borderRadius: 999,
                  fontWeight: 500,
                  fontSize: 12.5,
                  lineHeight: 1,
                  color: "var(--foreground)",
                }}
              />
              <button
                type="button"
                onClick={onSimpanSandi}
                className="gov-primary"
                style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 12,
                  lineHeight: 1,
                  textAlign: "center",
                }}
              >
                Simpan Kata Sandi
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onBukaSandi}
              className="gov-control"
              style={{
                marginTop: 14,
                padding: "11px 18px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 11.5,
                lineHeight: 1,
              }}
            >
              Ganti Kata Sandi
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// --- Dialog: Keluar ---------------------------------------------------------

function ExitDialog({
  onBatal,
  onKeluar,
}: {
  onBatal: () => void;
  onKeluar: () => void;
}) {
  return (
    <>
      <div
        onClick={onBatal}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 90,
          background: "var(--scrim)",
          animation: "prm-pagein .3s ease both",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Konfirmasi keluar"
        style={{
          position: "fixed",
          left: "50%",
          top: "42%",
          transform: "translate(-50%,-50%)",
          zIndex: 100,
          width: 380,
          padding: "30px 32px",
          borderRadius: 24,
          background: "var(--background)",
          boxShadow: "var(--shadow-raised-lg)",
          animation: "prm-zoomin .4s var(--ease-mewah) both",
        }}
      >
        <div
          className="gov-disp"
          style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.3 }}
        >
          Keluar dari dasbor?
        </div>
        <div
          style={{
            fontWeight: 500,
            fontSize: 12.5,
            lineHeight: 1.6,
            color: MUTED,
            marginTop: 8,
          }}
        >
          Sesi Anda akan diakhiri dan Anda kembali ke halaman masuk.
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
          <button
            type="button"
            onClick={onBatal}
            className="gov-control"
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 12.5,
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onKeluar}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 12.5,
              lineHeight: 1,
              textAlign: "center",
              background: "var(--verdict-merah)",
              color: "var(--verdict-on)",
              boxShadow: "var(--shadow-raised-sm)",
            }}
          >
            Keluar
          </button>
        </div>
      </div>
    </>
  );
}

// --- Skeleton memuat --------------------------------------------------------

function SkelBar({
  w,
  h,
  r = 999,
  mt = 0,
}: {
  w: string;
  h: number;
  r?: number;
  mt?: number;
}) {
  return (
    <div
      className="gov-well-sm"
      style={{
        height: h,
        width: w,
        borderRadius: r,
        marginTop: mt,
        animation: "prm-pulse 1.6s ease-in-out infinite",
      }}
    />
  );
}

function Memuat() {
  return (
    <div aria-busy="true">
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div className="gov-panel" style={{ padding: 24 }}>
          <SkelBar w="40%" h={12} />
          <SkelBar w="70%" h={20} mt={16} />
          <SkelBar w="100%" h={30} r={999} mt={20} />
        </div>
        <div className="gov-panel" style={{ padding: 24 }}>
          <SkelBar w="60%" h={12} />
          <SkelBar w="80%" h={12} mt={14} />
          <SkelBar w="70%" h={12} mt={14} />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 20,
          ...PANEL_MT,
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="gov-panel"
            style={{ padding: "18px 20px", borderRadius: 20 }}
          >
            <SkelBar w="62%" h={9} />
            <SkelBar w="38%" h={26} r={12} mt={14} />
          </div>
        ))}
      </div>
      <div
        className="gov-panel"
        style={{ ...PANEL_MT, padding: "10px 0 14px" }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.1fr 0.9fr 0.6fr",
              gap: 18,
              alignItems: "center",
              padding: "16px 24px",
              borderTop: "1px solid var(--border-hairline)",
            }}
          >
            <SkelBar w="70%" h={11} />
            <SkelBar w="60%" h={11} />
            <SkelBar w="50%" h={11} />
            <SkelBar w="40%" h={11} />
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 18,
          justifyContent: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "2px solid var(--border-hairline)",
            borderTopColor: "var(--primary)",
            animation: "prm-spin .9s linear infinite",
          }}
        />
        <div
          style={{
            fontWeight: 600,
            fontSize: 12.5,
            lineHeight: 1,
            color: MUTED,
          }}
        >
          {GOV_COPY["ov.memuat"]}
        </div>
      </div>
    </div>
  );
}

function Judul() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 16,
        margin: "32px 0 22px",
      }}
    >
      <div>
        <h1
          className="gov-disp"
          style={{
            fontWeight: 800,
            fontSize: 27,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          {GOV_COPY["ov.judul"]}
        </h1>
        <div
          style={{
            fontWeight: 500,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: MUTED,
            marginTop: 8,
          }}
        >
          Pemantauan berkelanjutan oleh 4 AI Agent pemeriksa
        </div>
      </div>
    </div>
  );
}

// --- Banner: pemeriksaan LIVE sedang berjalan ------------------------------

type Berjalan = { koperasiId: string; nama: string };

// Empat titik berdenyut = empat agen forensik. prm-denyut mati otomatis di
// blok @media prefers-reduced-motion (.gov *) pada dashboard.css.
function LiveBanner({ list }: { list: Berjalan[] }) {
  const first = list[0];
  if (!first) return null;
  const extra = list.length - 1;
  return (
    <div
      role="status"
      aria-live="polite"
      className="gov-well-sm"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        margin: "0 0 20px",
        padding: "13px 20px",
        borderRadius: 16,
      }}
    >
      <span
        aria-hidden="true"
        style={{ display: "inline-flex", gap: 4, flex: "none" }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--primary)",
              animation: "prm-denyut 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </span>
      <span style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.5 }}>
        {GOV_COPY["ov.berjalan.prefix"]} {stripKop(first.nama)}
        {extra > 0
          ? ` ${GOV_COPY["ov.berjalan.dan"]} ${extra} ${GOV_COPY["ov.berjalan.lainnya"]}`
          : ""}
      </span>
    </div>
  );
}

// --- Orkestrator ------------------------------------------------------------

export function OverviewClient() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("memuat");
  const [data, setData] = useState<GovOverview | null>(null);
  const [periode, setPeriode] = useState<string | null>(null);

  const [bukaPeriode, setBukaPeriode] = useState(false);
  const [bukaProfil, setBukaProfil] = useState(false);
  const [bukaSetelan, setBukaSetelan] = useState(false);
  const [bukaKeluar, setBukaKeluar] = useState(false);
  const [bukaSandi, setBukaSandi] = useState(false);

  const [filterVerdict, setFilterVerdict] = useState<VerdictColor | null>(null);
  const [filterProv, setFilterProv] = useState<string | null>(null);
  const [temaDef, setTemaDef] = useState<TemaDefault>("terang");
  const [notifMerah, setNotifMerah] = useState(true);
  const [notifSelesai, setNotifSelesai] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [berjalan, setBerjalan] = useState<Berjalan[]>([]);
  const berjalanIds = useRef<Set<string>>(new Set());

  const muat = useCallback(async (p: string | null) => {
    setStatus("memuat");
    try {
      const url = p ? `/api/gov/overview?periode=${p}` : "/api/gov/overview";
      const res = await fetch(url, { cache: "no-store" });
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
    // ponytail: fetch-on-mount / on-periode; setState terjadi setelah await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void muat(periode);
  }, [periode, muat]);

  useEffect(() => {
    return () => {
      if (toastT.current) clearTimeout(toastT.current);
    };
  }, []);

  // Poll ringan indikator pemeriksaan LIVE. Saat sebuah koperasi lenyap dari
  // list (audit selesai), muat ulang overview supaya verdict/temuan terbaru
  // tampil. tick tidak setState sinkron (await lebih dulu) jadi aman di effect.
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/gov/pemeriksaan-berjalan", {
          cache: "no-store",
        });
        const json = await res.json();
        if (!alive || !res.ok || !json?.ok) return;
        const list = (json.data?.berjalan ?? []) as Berjalan[];
        const idsBaru = new Set(list.map((x) => x.koperasiId));
        let adaSelesai = false;
        for (const prev of berjalanIds.current) {
          if (!idsBaru.has(prev)) {
            adaSelesai = true;
            break;
          }
        }
        berjalanIds.current = idsBaru;
        setBerjalan(list);
        if (adaSelesai) void muat(periode);
      } catch {
        /* diamkan; percobaan poll berikutnya coba lagi */
      }
    };
    void tick();
    const iv = setInterval(() => void tick(), 4000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [muat, periode]);

  const toastKan = useCallback((teks: string) => {
    if (toastT.current) clearTimeout(toastT.current);
    setToast(teks);
    toastT.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const pilihPeriode = useCallback((p: string) => {
    setBukaPeriode(false);
    setFilterVerdict(null);
    setFilterProv(null);
    setPeriode(p);
  }, []);

  const buka = useCallback(
    (id: string) => router.push(`/pemerintah/koperasi/${id}`),
    [router],
  );

  const prefetch = useCallback(
    (id: string) => router.prefetch(`/pemerintah/koperasi/${id}`),
    [router],
  );

  const onFilter = useCallback(
    (w: VerdictColor) => setFilterVerdict((cur) => (cur === w ? null : w)),
    [],
  );

  const onToggleProv = useCallback(
    (provinsi: string) =>
      setFilterProv((cur) => (cur === provinsi ? null : provinsi)),
    [],
  );

  const setTema = useCallback((t: TemaDefault) => {
    setTemaDef(t);
    if (t === "sistem") {
      const dark =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      terapkanTema(dark ? "gelap" : "terang");
    } else {
      terapkanTema(t);
    }
  }, []);

  const keluar = useCallback(async () => {
    setBukaKeluar(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* tetap arahkan ke login walau permintaan gagal */
    }
    router.push("/login");
  }, [router]);

  const periodeLabel = periode
    ? periodeLabelDari(periode)
    : data
      ? periodeLabelDari(data.periode)
      : "";
  const periodeItems = data
    ? data.periodeTersedia.map((p, i) => ({
        periode: p,
        label: periodeLabelDari(p),
        warna: worstWarna(data.tren[i] ?? { merah: 0, kuning: 0 }),
        aktif: p === data.periode,
      }))
    : [];

  const adaDrop = bukaPeriode || bukaProfil;

  return (
    <div
      style={{
        maxWidth: 1440,
        minWidth: 1240,
        margin: "0 auto",
        padding: "26px 48px 60px",
      }}
    >
      <Header
        periodeLabel={periodeLabel}
        periodeItems={periodeItems}
        bukaPeriode={bukaPeriode}
        onTogglePeriode={() => {
          setBukaPeriode((v) => !v);
          setBukaProfil(false);
        }}
        onPilihPeriode={pilihPeriode}
        bukaProfil={bukaProfil}
        onToggleProfil={() => {
          setBukaProfil((v) => !v);
          setBukaPeriode(false);
        }}
        onPengaturan={() => {
          setBukaProfil(false);
          setBukaSetelan(true);
        }}
        onKeluar={() => {
          setBukaProfil(false);
          setBukaKeluar(true);
        }}
      />

      {adaDrop ? (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 60 }}
          onClick={() => {
            setBukaPeriode(false);
            setBukaProfil(false);
          }}
        />
      ) : null}

      <Judul />

      {berjalan.length > 0 ? <LiveBanner list={berjalan} /> : null}

      {status === "gagal" ? (
        <>
          <div
            role="alert"
            className="gov-well-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "0 0 20px",
              padding: "14px 20px",
              borderRadius: 16,
              background: "var(--verdict-merah-surface)",
            }}
          >
            <VerdictShape bentuk={BENTUK.merah} size={12} />
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--verdict-merah)",
              }}
            >
              {GOV_COPY["ov.gagal.banner"]}
            </div>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => void muat(periode)}
              className="gov-primary"
              style={{
                padding: "11px 22px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 12.5,
                lineHeight: 1,
              }}
            >
              {GOV_COPY["ov.gagal.cta"]}
            </button>
          </div>
          <div
            className="gov-panel"
            style={{ padding: "44px 24px", textAlign: "center" }}
          >
            <div
              style={{
                fontWeight: 500,
                fontSize: 13,
                lineHeight: 1.5,
                color: MUTED,
              }}
            >
              {GOV_COPY["ov.gagal.panel"]}
            </div>
          </div>
        </>
      ) : null}

      {status === "memuat" ? <Memuat /> : null}

      {status === "kosong" ? (
        <div
          className="gov-panel"
          style={{
            padding: "80px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            className="gov-raised-sm"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="gov-well-sm"
              style={{ width: 24, height: 24, borderRadius: "50%" }}
            />
          </div>
          <div
            className="gov-disp"
            style={{
              fontWeight: 700,
              fontSize: 16,
              lineHeight: 1.3,
              marginTop: 20,
            }}
          >
            {GOV_COPY["ov.kosong.judul"]}
          </div>
          <div
            style={{
              fontWeight: 500,
              fontSize: 12.5,
              lineHeight: 1.6,
              color: MUTED,
              marginTop: 8,
              maxWidth: 420,
            }}
          >
            {GOV_COPY["ov.kosong.sub"]}
          </div>
          <button
            type="button"
            onClick={() => void muat(periode)}
            className="gov-control"
            style={{
              marginTop: 22,
              padding: "12px 24px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 12.5,
              lineHeight: 1,
              color: "var(--foreground)",
            }}
          >
            {GOV_COPY["ov.kosong.cta"]}
          </button>
        </div>
      ) : null}

      {status === "default" && data ? (
        <>
          <div
            style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}
          >
            <HeroKondisi
              data={data}
              filterVerdict={filterVerdict}
              onFilter={onFilter}
            />
            <PerluPerhatian data={data} onBuka={buka} onPrefetch={prefetch} />
          </div>
          <KpiRow
            data={data}
            filterVerdict={filterVerdict}
            onFilter={onFilter}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.35fr 1fr",
              gap: 20,
              ...PANEL_MT,
            }}
          >
            <TrenPanel data={data} onPilihPeriode={pilihPeriode} />
            <AgentPanel data={data} />
          </div>
          <Tabel
            data={data}
            filterVerdict={filterVerdict}
            filterProv={filterProv}
            onClearFilter={() => setFilterVerdict(null)}
            onClearProv={() => setFilterProv(null)}
            onBuka={buka}
            onPrefetch={prefetch}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.25fr 1fr",
              gap: 20,
              ...PANEL_MT,
            }}
          >
            <SebaranProvinsi
              koperasi={data.koperasi}
              filterProv={filterProv}
              onToggleProv={onToggleProv}
            />
            <AktivitasPanel data={data} />
          </div>
        </>
      ) : null}

      {bukaSetelan ? (
        <SettingsSlideOver
          data={data}
          temaDef={temaDef}
          onTema={setTema}
          onPilihPeriode={pilihPeriode}
          notifMerah={notifMerah}
          notifSelesai={notifSelesai}
          onToggleMerah={() => setNotifMerah((v) => !v)}
          onToggleSelesai={() => setNotifSelesai((v) => !v)}
          bukaSandi={bukaSandi}
          onBukaSandi={() => setBukaSandi(true)}
          onSimpanSandi={() => {
            setBukaSandi(false);
            toastKan("Kata sandi diperbarui.");
          }}
          onClose={() => {
            setBukaSetelan(false);
            setBukaSandi(false);
          }}
        />
      ) : null}

      {bukaKeluar ? (
        <ExitDialog onBatal={() => setBukaKeluar(false)} onKeluar={keluar} />
      ) : null}

      {toast ? (
        <div
          role="status"
          className="gov-raised-sm"
          style={{
            position: "fixed",
            bottom: 26,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 120,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 22px",
            borderRadius: 999,
            background: "var(--surface-fill)",
            animation: "prm-pop .5s var(--ease-mewah) both",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--verdict-hijau)",
              flex: "none",
            }}
          />
          <span style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.4 }}>
            {toast}
          </span>
        </div>
      ) : null}
    </div>
  );
}
