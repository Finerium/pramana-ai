/**
 * Derivasi murni layar Overview (/pemerintah). Sumber logika: prototype bundle
 * dashboard (renderVals). Semua angka berasal dari GET /api/gov/overview; tidak
 * ada data yang dikarang di sini.
 */
import type { GovOverview, VerdictColor } from "@/lib/contracts";

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
