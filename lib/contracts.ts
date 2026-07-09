/**
 * SATU-SATUNYA sumber tipe domain Pramana AI.
 * Transkripsi VERBATIM blueprint section 6.1 (skema Zod) dan 6.3b (tipe
 * response API + kategori arus kanonik). Kontrak BEKU: perubahan apa pun
 * adalah stop-and-ask, bukan improvisasi.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// 6.1 Domain types
// ---------------------------------------------------------------------------

export const AgentId = z.enum([
  "konflik_kepentingan",
  "anomali_transaksi",
  "kesehatan_finansial",
  "kepatuhan_proses",
]);

export const Severity = z.enum(["info", "kuning", "merah"]);
export const VerdictColor = z.enum(["hijau", "kuning", "merah"]);
export const AuditSource = z.enum(["seed", "live", "cache"]);

export const EvidenceRef = z.object({
  jenis: z.enum(["transaksi", "pinjaman", "rasio", "jadwal"]),
  id: z.string(), // id baris terkait di DB
  label: z.string(), // teks singkat manusiawi, mis. "Pembelian Rp15.000.000 ke Toko Berkah, 14 Juni 2026"
});

export const AgentFinding = z.object({
  id: z.string(), // ULID
  agent: AgentId,
  severity: Severity,
  judul: z.string().max(90),
  penjelasan_awam: z.string().max(600), // bahasa manusia, tanpa jargon
  kenapa_penting: z.string().max(600),
  bukti: z.array(EvidenceRef).min(1),
  pertanyaan_rat: z.string().max(280), // WAJIB berbentuk kalimat tanya, diakhiri "?"
});

export const Verdict = z.object({
  warna: VerdictColor,
  ringkasan: z.string().max(200), // satu kalimat
  temuan: z.array(AgentFinding),
});

export const AuditRun = z.object({
  id: z.string(),
  koperasiId: z.string(),
  periode: z.string(), // "2026-06"
  source: AuditSource,
  verdict: Verdict,
  dibuatPada: z.string(), // ISO datetime
  durasiMs: z.number().int().nonnegative(),
});

export type AgentId = z.infer<typeof AgentId>;
export type Severity = z.infer<typeof Severity>;
export type VerdictColor = z.infer<typeof VerdictColor>;
export type AuditSource = z.infer<typeof AuditSource>;
export type EvidenceRef = z.infer<typeof EvidenceRef>;
export type AgentFinding = z.infer<typeof AgentFinding>;
export type Verdict = z.infer<typeof Verdict>;
export type AuditRun = z.infer<typeof AuditRun>;

// ---------------------------------------------------------------------------
// 6.3b Tipe response endpoint gabungan
// ---------------------------------------------------------------------------

export type GovOverview = {
  kpi: {
    jumlahKoperasi: number;
    hijau: number;
    kuning: number;
    merah: number;
    temuanTerbuka: number;
  };
  koperasi: Array<{
    id: string;
    nama: string;
    provinsi: string;
    verdictWarna: "hijau" | "kuning" | "merah";
    temuanCount: number;
  }>;
};

export type FlowResp = {
  periode: string;
  totalMasuk: number;
  totalKeluar: number;
  masuk: Array<{ kategori: string; jumlah: number }>;
  keluar: Array<{ kategori: string; jumlah: number }>;
  sorotan: Array<{ transaksiId: string; temuanId: string; label: string }>;
};

export type VoiceResp = {
  pertanyaanAgregat: Array<{
    temuanId: string;
    judul: string;
    jumlahAnggota: number;
  }>;
  keputusan: Array<{
    id: string;
    judul: string;
    deskripsi: string;
    nominal: number | null;
    status: "terbuka" | "ditutup";
    sudahMemilih: boolean;
    hasil: { setuju: number; tidak: number } | null; // hasil null sebelum anggota memilih
  }>;
};

export type MemberSummary = {
  uangAnda: {
    totalSimpanan: number;
    sisaPinjaman: number;
    cicilanBerikut: { jumlah: number; tanggal: string } | null;
  };
  notifikasiBelumDibaca: number;
};

export type VerdictResp = {
  auditRunId: string;
  periode: string;
  source: "seed" | "live" | "cache";
  warna: "hijau" | "kuning" | "merah";
  ringkasan: string;
  jumlahTemuan: { merah: number; kuning: number; info: number };
};

export type OnboardResp = {
  anggotaId: string;
  noAnggota: string;
  kartu: {
    nama: string;
    noAnggota: string;
    koperasi: string;
    bergabungPada: string;
  };
};

export type SubjekTransaksiInput = {
  jenis:
    | "pembelian"
    | "penjualan"
    | "setoran_simpanan"
    | "penarikan_simpanan"
    | "pencairan_pinjaman"
    | "angsuran"
    | "gaji"
    | "operasional";
  jumlah: number;
  tanggal: string;
  unitUsahaId?: string;
  vendorNama?: string;
  vendorAlamat?: string;
  deskripsi: string;
  anggotaId?: string;
};

export type SubjekPinjamanInput = {
  anggotaId: string;
  pokok: number;
  cicilanBulanan: number;
  jatuhTempoBerikut: string;
  disetujuiOleh: string;
  dokumenLengkap: boolean;
};

// ---------------------------------------------------------------------------
// 6.3b Kategori kanonik arus dana (frozen)
// ---------------------------------------------------------------------------

export const KATEGORI_MASUK = [
  "Setoran simpanan",
  "Angsuran pinjaman",
  "Penjualan gerai",
  "Lainnya",
] as const;

export const KATEGORI_KELUAR = [
  "Pembelian stok",
  "Pencairan pinjaman",
  "Gaji dan honor",
  "Operasional",
  "Lainnya",
] as const;

/**
 * Mapping jenis transaksi ke kategori kanonik (6.3b): shu dan
 * penarikan_simpanan jatuh ke "Lainnya" mengikuti kolom arah.
 */
export const JENIS_KE_KATEGORI: Record<string, string> = {
  setoran_simpanan: "Setoran simpanan",
  angsuran: "Angsuran pinjaman",
  penjualan: "Penjualan gerai",
  pembelian: "Pembelian stok",
  pencairan_pinjaman: "Pencairan pinjaman",
  gaji: "Gaji dan honor",
  operasional: "Operasional",
  shu: "Lainnya",
  penarikan_simpanan: "Lainnya",
};
