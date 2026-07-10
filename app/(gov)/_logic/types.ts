/**
 * Bentuk respons endpoint gov yang dikonsumsi UI. GovOverview beku di
 * lib/contracts. GovKoperasiDetail belum dibekukan di 6.1/6.3b (blueprint 6.3
 * hanya menyebut {profil, auditRun, temuan[], tren}), jadi tipe ini adalah
 * kontrak UI-ke-backend; modul API menyesuaikan saat integrasi (Gate 2).
 */
import type {
  AgentFinding,
  AuditRun,
  GovOverview,
  VerdictColor,
} from "@/lib/contracts";

export type GovKoperasiProfil = {
  id: string;
  nama: string;
  desa: string;
  kabupaten: string;
  provinsi: string;
  jumlahAnggota: number;
  unitUsaha: string[];
};

export type GovTrenPoint = { periode: string; warna: VerdictColor };

/** Temuan detail = AgentFinding beku + tanggapan pengurus (di luar 6.1). */
export type GovTemuan = AgentFinding & { tanggapanPengurus?: string | null };

export type GovKoperasiDetail = {
  profil: GovKoperasiProfil;
  auditRun: AuditRun | null;
  temuan: GovTemuan[];
  tren: GovTrenPoint[];
};

/** Status polling live audit (blueprint 6.3 GET /api/audit/:id/status). */
export type AuditStatus = "berjalan" | "selesai" | "gagal_langsung";

export type AuditRunResp = { auditRunId: string; status: "berjalan" };
export type AuditStatusResp = { status: AuditStatus; auditRun?: AuditRun };

// ---------------------------------------------------------------------------
// Overview per periode (M3-3). Tren nasional dipakai chart + sparkline; titik
// run per (koperasi, periode) adalah input agregasi murni buildTren.
// ---------------------------------------------------------------------------
export type OverviewTrenPoint = GovOverview["tren"][number];
export type OverviewTrenKey = "hijau" | "kuning" | "merah" | "temuan";

/** Run terbaru per (koperasi, periode) sebagai input agregasi tren. */
export type TrenRun = {
  koperasiId: string;
  periode: string;
  verdictWarna: VerdictColor;
  temuanCount: number;
};
