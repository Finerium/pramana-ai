/**
 * Derivasi murni layar Overview (/pemerintah). Sumber logika: prototype bundle
 * dashboard (renderVals). Semua angka berasal dari GET /api/gov/overview; tidak
 * ada data yang dikarang di sini.
 */
import type { GovOverview, VerdictColor } from "@/lib/contracts";
import type { OverviewTrenKey, OverviewTrenPoint, TrenRun } from "./types";

export type KoperasiRow = GovOverview["koperasi"][number];
export type Kpi = GovOverview["kpi"];
export type SortKey = "nama" | "provinsi" | "verdictWarna" | "temuanCount";
export type SortDir = "asc" | "desc";

const RANK: Record<VerdictColor, number> = { merah: 3, kuning: 2, hijau: 1 };

export const DEFAULT_DIR: Record<SortKey, SortDir> = {
  nama: "asc",
  provinsi: "asc",
  verdictWarna: "desc",
  temuanCount: "desc",
};

export function nextSort(
  cur: { key: SortKey; dir: SortDir },
  key: SortKey,
): { key: SortKey; dir: SortDir } {
  if (cur.key === key) {
    return { key, dir: cur.dir === "asc" ? "desc" : "asc" };
  }
  return { key, dir: DEFAULT_DIR[key] };
}

export function filterKoperasi(rows: KoperasiRow[], q: string): KoperasiRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter(
    (r) =>
      r.nama.toLowerCase().includes(s) || r.provinsi.toLowerCase().includes(s),
  );
}

export function sortKoperasi(
  rows: KoperasiRow[],
  key: SortKey,
  dir: SortDir,
): KoperasiRow[] {
  const d = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let diff = 0;
    if (key === "verdictWarna")
      diff = RANK[a.verdictWarna] - RANK[b.verdictWarna];
    else if (key === "temuanCount") diff = a.temuanCount - b.temuanCount;
    else diff = String(a[key]).localeCompare(String(b[key]), "id");
    diff *= d;
    if (diff === 0) {
      diff =
        b.temuanCount - a.temuanCount || a.nama.localeCompare(b.nama, "id");
    }
    return diff;
  });
}

export function kpiSubPersen(count: number, total: number): string {
  const p = total > 0 ? Math.round((count / total) * 100) : 0;
  return `${p} persen dari total`;
}

export function tersebarCount(rows: KoperasiRow[]): number {
  return rows.filter((r) => r.temuanCount > 0).length;
}

export type DistribusiSegmen = {
  warna: VerdictColor;
  count: number;
  persen: number;
};

export function deriveDistribusi(kpi: Kpi): DistribusiSegmen[] {
  const total = kpi.jumlahKoperasi || 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  return [
    { warna: "hijau", count: kpi.hijau, persen: pct(kpi.hijau) },
    { warna: "kuning", count: kpi.kuning, persen: pct(kpi.kuning) },
    { warna: "merah", count: kpi.merah, persen: pct(kpi.merah) },
  ];
}

/** Lebar segmen bar distribusi (persen mentah, tanpa pembulatan). */
export function segmenLebar(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0;
}

// ---------------------------------------------------------------------------
// Agregasi tren nasional + turunan sparkline (M3-3). Fungsi murni; dipakai
// route API (buildTren) dan UI (sparklinePoints, formatDelta).
// ---------------------------------------------------------------------------

/**
 * Tren nasional per periode: untuk tiap periode, sebaran verdict lintas SELURUH
 * koperasi (tanpa run pada periode itu dihitung hijau 0 temuan, konsisten
 * dengan fallback KPI) plus total temuan. Deterministik, tanpa I/O.
 */
export function buildTren(
  koperasiIds: string[],
  periodeList: string[],
  runByKopPeriode: Map<string, TrenRun>,
): OverviewTrenPoint[] {
  return periodeList.map((periode) => {
    let hijau = 0;
    let kuning = 0;
    let merah = 0;
    let temuan = 0;
    for (const kopId of koperasiIds) {
      const run = runByKopPeriode.get(`${kopId}|${periode}`);
      const warna = run?.verdictWarna ?? "hijau";
      if (warna === "merah") merah++;
      else if (warna === "kuning") kuning++;
      else hijau++;
      temuan += run?.temuanCount ?? 0;
    }
    return { periode, hijau, kuning, merah, temuan };
  });
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Titik polyline sparkline dari satu deret tren. x tersebar rata 0..width;
 * y dibalik untuk SVG (nilai tertinggi di atas). Deret datar diletakkan di
 * garis tengah. Sparkline tidak dikirim server, UI menurunkannya dari tren.
 */
/** Sparkline dari deret nilai mentah. Deret datar diletakkan di garis tengah. */
export function sparklineFromSeri(
  vals: number[],
  opts?: { width?: number; height?: number },
): Array<{ x: number; y: number }> {
  const width = opts?.width ?? 100;
  const height = opts?.height ?? 28;
  const n = vals.length;
  if (n === 0) return [];
  const min = Math.min(...vals);
  const span = Math.max(...vals) - min;
  return vals.map((val, i) => {
    const x = n === 1 ? 0 : (i / (n - 1)) * width;
    const norm = span === 0 ? 0.5 : (val - min) / span;
    return { x: round2(x), y: round2(height - norm * height) };
  });
}

export function sparklinePoints(
  tren: OverviewTrenPoint[],
  key: OverviewTrenKey,
  opts?: { width?: number; height?: number },
): Array<{ x: number; y: number }> {
  return sparklineFromSeri(
    tren.map((t) => t[key]),
    opts,
  );
}

/** Selisih KPI untuk chip: tanda eksplisit, tanpa em dash. */
export function formatDelta(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

// ---------------------------------------------------------------------------
// Derivasi tampilan Overview kaya (M3-3). Semua murni; angka dari GovOverview.
// ---------------------------------------------------------------------------

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const BULAN3 = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** Uraikan periode "YYYY-MM" menjadi nama bulan Indonesia + tahun. */
export function bulanDari(periode: string): {
  nama: string;
  singkat: string;
  tahun: string;
} {
  const [tahun = "", mm = ""] = periode.split("-");
  const i = Math.min(11, Math.max(0, Number(mm) - 1));
  return { nama: BULAN[i] ?? "", singkat: BULAN3[i] ?? "", tahun };
}

/** Label periode lengkap, mis. "Juni 2026". */
export function periodeLabelDari(periode: string): string {
  const b = bulanDari(periode);
  return `${b.nama} ${b.tahun}`;
}

/** Kalimat ringkas kondisi nasional dari sebaran verdict periode aktif. */
export function heroKalimat(kpi: {
  hijau: number;
  kuning: number;
  merah: number;
}): string {
  if (kpi.merah > 0)
    return `${kpi.merah} koperasi merah menunggu tindak lanjut Anda.`;
  if (kpi.kuning > 0)
    return `Tidak ada koperasi merah. ${kpi.kuning} koperasi kuning dalam pemantauan.`;
  return "Seluruh koperasi dalam kondisi baik.";
}

/** Selisih dengan kata "tetap" untuk nol (dipakai chip KPI + kalimat delta). */
export function fmtDeltaTetap(n: number): string {
  return n === 0 ? "tetap" : n > 0 ? `+${n}` : String(n);
}

export type DeltaChip = {
  teks: string;
  nol: boolean;
  turun: boolean;
  warnaVar: string;
};

/**
 * Chip delta KPI: teks bertanda, arah panah, dan warna semantik. burukNaik
 * menentukan apakah kenaikan itu buruk (merah untuk merah/kuning/temuan) atau
 * baik (hijau untuk jumlah hijau). Nol tampil "tetap" dengan warna redup.
 */
export function deltaKpi(n: number, burukNaik: boolean): DeltaChip {
  const nol = n === 0;
  const buruk = burukNaik ? n > 0 : n < 0;
  return {
    teks: fmtDeltaTetap(n),
    nol,
    turun: n < 0,
    warnaVar: nol
      ? "var(--muted-foreground)"
      : buruk
        ? "var(--verdict-merah)"
        : "var(--verdict-hijau)",
  };
}

/** Kalimat "Dibanding {bulan}: merah X, kuning Y, temuan Z" atau awal periode. */
export function deltaRingkasTeks(
  delta: GovOverview["kpiDelta"],
  bulanSebelumnya: string | null,
): string {
  if (!bulanSebelumnya) return "Awal periode pemantauan";
  return `Dibanding ${bulanSebelumnya}: merah ${fmtDeltaTetap(
    delta.merah,
  )}, kuning ${fmtDeltaTetap(delta.kuning)}, temuan ${fmtDeltaTetap(
    delta.temuanTerbuka,
  )}`;
}

/** Label segmen bar distribusi: hanya angka bila segmen sempit, else "N warna". */
export function segmenLabel(
  warna: VerdictColor,
  count: number,
  total: number,
): string {
  return total > 0 && count / total < 0.2 ? String(count) : `${count} ${warna}`;
}

/** Warna terburuk satu titik tren (merah > kuning > hijau). */
export function worstWarna(p: { merah: number; kuning: number }): VerdictColor {
  return p.merah > 0 ? "merah" : p.kuning > 0 ? "kuning" : "hijau";
}

// --- Geometri chart tren nasional (garis verdict + balok temuan) ------------

export type TrenChartOpts = {
  w?: number;
  h?: number;
  padX?: number;
  atas?: number;
  bawah?: number;
  barW?: number;
};
export type TrenTitik = {
  x: number;
  y: number;
  warna: VerdictColor;
  key: string;
};
export type TrenBar = {
  x: number;
  y: number;
  w: number;
  h: number;
  key: string;
};
export type TrenChartGeometri = {
  w: number;
  h: number;
  garis: Record<VerdictColor, string>;
  titik: TrenTitik[];
  bar: TrenBar[];
  kolomX: number[];
  markerX: number | null;
};

/**
 * Geometri chart tren: garis verdict per warna, titik, dan balok temuan.
 * Skala vertikal dinamis (verdict dibagi jumlah koperasi maksimum, temuan
 * dibagi temuan maksimum) supaya tidak meluber untuk data sembarang, sambil
 * mempertahankan proporsi bundle. Tanpa I/O, deterministik.
 */
export function trenChart(
  tren: OverviewTrenPoint[],
  activeIdx: number,
  opts: TrenChartOpts = {},
): TrenChartGeometri {
  const w = opts.w ?? 600;
  const h = opts.h ?? 210;
  const padX = opts.padX ?? 44;
  const atas = opts.atas ?? 18;
  const bawah = opts.bawah ?? 194;
  const barW = opts.barW ?? 34;
  const n = tren.length;
  const xAt = (i: number) =>
    n <= 1 ? w / 2 : padX + i * ((w - padX * 2) / (n - 1));
  const maxV = Math.max(
    1,
    ...tren.flatMap((t) => [t.hijau, t.kuning, t.merah]),
  );
  const maxT = Math.max(1, ...tren.map((t) => t.temuan));
  const yV = (v: number) => bawah - (v / maxV) * (bawah - atas);
  const warnaKunci: VerdictColor[] = ["hijau", "kuning", "merah"];
  const line = (k: VerdictColor) =>
    tren.map((t, i) => `${xAt(i).toFixed(1)},${yV(t[k]).toFixed(1)}`).join(" ");
  const garis = {
    hijau: line("hijau"),
    kuning: line("kuning"),
    merah: line("merah"),
  };
  const titik: TrenTitik[] = [];
  for (const k of warnaKunci) {
    tren.forEach((t, i) =>
      titik.push({
        x: round2(xAt(i)),
        y: round2(yV(t[k])),
        warna: k,
        key: `${k}${i}`,
      }),
    );
  }
  const bar: TrenBar[] = tren.map((t, i) => {
    const bh = (t.temuan / maxT) * (bawah - atas);
    return {
      x: round2(xAt(i) - barW / 2),
      y: round2(bawah - bh),
      w: barW,
      h: round2(bh),
      key: `b${i}`,
    };
  });
  const kolomX = tren.map((_, i) => round2(xAt(i)));
  const markerX =
    activeIdx >= 0 && activeIdx < n ? round2(xAt(activeIdx) - 26) : null;
  return { w, h, garis, titik, bar, kolomX, markerX };
}

// ---------------------------------------------------------------------------
// Panel Sebaran Provinsi + Aktivitas AI Agent (M3-D1). Semua murni: kartogram
// mengagregasi array koperasi periode aktif; feed diurutkan dari baris audit_run
// nyata yang diisi route. Tanpa data dikarang, tanpa I/O.
// ---------------------------------------------------------------------------

const WARNA_RANK: Record<VerdictColor, number> = {
  hijau: 1,
  kuning: 2,
  merah: 3,
};

export type ProvinsiAgg = {
  provinsi: string;
  jumlahKoperasi: number;
  verdictTerburuk: VerdictColor; // merah > kuning > hijau
  temuanTotal: number;
};

/**
 * Agregasi koperasi periode aktif per provinsi: jumlah koperasi, verdict
 * terburuk, dan total temuan terbuka. Urut nama provinsi (id) supaya
 * deterministik. Input = array koperasi GovOverview.
 */
export function sebaranProvinsi(koperasi: KoperasiRow[]): ProvinsiAgg[] {
  const map = new Map<string, ProvinsiAgg>();
  for (const k of koperasi) {
    const cur = map.get(k.provinsi) ?? {
      provinsi: k.provinsi,
      jumlahKoperasi: 0,
      verdictTerburuk: "hijau" as VerdictColor,
      temuanTotal: 0,
    };
    cur.jumlahKoperasi += 1;
    cur.temuanTotal += k.temuanCount;
    if (WARNA_RANK[k.verdictWarna] > WARNA_RANK[cur.verdictTerburuk])
      cur.verdictTerburuk = k.verdictWarna;
    map.set(k.provinsi, cur);
  }
  return [...map.values()].sort((a, b) =>
    a.provinsi.localeCompare(b.provinsi, "id"),
  );
}

const MENIT = 60_000;
const JAM = 3_600_000;
const HARI = 86_400_000;

/**
 * Waktu relatif Bahasa Indonesia dari ISO `dibuatPada` terhadap `sekarang`
 * (epoch ms). Murni supaya teruji; komponen klien meneruskan Date.now() saat
 * render. Selisih negatif (masa depan) jatuh ke "baru saja".
 */
export function waktuRelatif(dibuatPada: string, sekarang: number): string {
  const selisih = sekarang - new Date(dibuatPada).getTime();
  if (selisih < MENIT) return "baru saja";
  if (selisih < JAM) return `${Math.floor(selisih / MENIT)} menit lalu`;
  if (selisih < HARI) return `${Math.floor(selisih / JAM)} jam lalu`;
  return `${Math.floor(selisih / HARI)} hari lalu`;
}

export type AktivitasItem = GovOverview["aktivitas"][number];

/**
 * Urutkan feed aktivitas: dibuatPada desc, tiebreak koperasiId asc supaya
 * deterministik walau seed memakai timestamp identik per periode. Batas 7 item.
 */
export function urutkanAktivitas(items: AktivitasItem[]): AktivitasItem[] {
  return [...items]
    .sort(
      (a, b) =>
        b.dibuatPada.localeCompare(a.dibuatPada) ||
        a.koperasiId.localeCompare(b.koperasiId),
    )
    .slice(0, 7);
}
