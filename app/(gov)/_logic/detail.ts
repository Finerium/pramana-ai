/**
 * Derivasi murni layar Detail Koperasi (/pemerintah/koperasi/[id]). Sumber
 * logika: prototype bundle dashboard. Data berasal dari GET /api/gov/koperasi/:id.
 */
import type { EvidenceRef, Severity } from "@/lib/contracts";
import { BENTUK, severityToBentuk, type Bentuk } from "./verdict";
import type { GovKoperasiProfil, GovTemuan, GovTrenPoint } from "./types";

const SEV_RANK: Record<Severity, number> = { merah: 3, kuning: 2, info: 1 };

/**
 * Urut temuan tingkat tertinggi dulu; tie-break id ascending supaya
 * deterministik dan cocok urutan bundle (AN-1..AN-6) untuk data seed berurutan.
 */
export function sortTemuanBySeverity<
  T extends { severity: Severity; id: string },
>(temuan: T[]): T[] {
  return [...temuan].sort(
    (a, b) =>
      SEV_RANK[b.severity] - SEV_RANK[a.severity] || a.id.localeCompare(b.id),
  );
}

/**
 * Label kolom BUKTI: jumlah baris bukti distinct dengan jenis dominan (jenis
 * ref pertama). ponytail: ringkasan real-world count (mis. "5 pinjaman") hidup
 * di teks bukti seed, bukan sebagai field terpisah; upgrade = field buktiRingkas
 * dari API bila fidelity mikro-label AN-2/AN-3 diperlukan.
 */
export function buktiLabel(bukti: EvidenceRef[]): string {
  const first = bukti[0];
  if (!first) return "0 bukti";
  const jenis = first.jenis;
  const ids = new Set(bukti.filter((b) => b.jenis === jenis).map((b) => b.id));
  return `${ids.size} ${jenis}`;
}

const BULAN_PENUH = [
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

export type TrenCell = {
  bulan: string;
  bulanPenuh: string;
  bentuk: Bentuk;
};

export function trenCells(tren: GovTrenPoint[]): TrenCell[] {
  return tren.map((t) => {
    const bulanIdx = Number(t.periode.slice(5, 7)) - 1;
    const bulanPenuh = BULAN_PENUH[bulanIdx] ?? t.periode;
    return {
      bulan: bulanPenuh.slice(0, 3),
      bulanPenuh,
      bentuk: BENTUK[t.warna],
    };
  });
}

export function formatProfilLokasi(p: GovKoperasiProfil): string {
  return `Desa ${p.desa}, ${p.kabupaten}, ${p.provinsi} · ${p.jumlahAnggota} anggota · ${p.id}`;
}

export type TemuanRow = {
  finding: GovTemuan;
  bentuk: Bentuk;
  bukti: string;
};

export function temuanRows(temuan: GovTemuan[]): TemuanRow[] {
  return sortTemuanBySeverity(temuan).map((f) => ({
    finding: f,
    bentuk: BENTUK[severityToBentuk(f.severity)],
    bukti: buktiLabel(f.bukti),
  }));
}
