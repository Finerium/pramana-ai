/**
 * Tipe respons API sisi klien surface anggota. Berakar pada kontrak 6.1/6.3b;
 * MemberFinding menambah tanggapanPengurus opsional (dirender bila ada, 6.10).
 */
import type { AgentFinding } from "@/lib/contracts";

export type MemberFinding = AgentFinding & { tanggapanPengurus?: string };

/** Respons GET /api/member/findings (kontrak 6.3): objek, bukan array. */
export type MemberFindingsResp = {
  temuan: MemberFinding[];
  sudahDitambahkan: string[];
  /** ISO waktu audit dibuat; null bila belum ada pemeriksaan. */
  diperiksaPada: string | null;
  /** Periode pemeriksaan, mis. "2026-06"; null bila belum ada. */
  periode: string | null;
};
