/**
 * Guard grounding: pembuktian anti-halusinasi server-side. Setiap bukti temuan
 * berjenis `transaksi` atau `pinjaman` WAJIB menunjuk id baris yang benar-benar
 * ada di snapshot koperasi yang diberikan ke model. Bila model mengarang id
 * (halusinasi bukti), temuan ditolak dan tidak pernah sampai ke pengguna.
 *
 * Bukti berjenis `rasio` / `jadwal` adalah turunan (rasio keuangan, jadwal RAT)
 * bukan baris DB, sehingga id-nya sintetis dan tidak dicek terhadap himpunan id.
 */
import type { EvidenceRef } from "@/lib/contracts";
import type { KoperasiSnapshot } from "./snapshot";

export interface GroundingIndex {
  transaksi: Set<string>;
  pinjaman: Set<string>;
}

export function buildGroundingIndex(s: KoperasiSnapshot): GroundingIndex {
  return {
    transaksi: new Set(s.transaksi.map((t) => t.id)),
    pinjaman: new Set(s.pinjaman.map((p) => p.id)),
  };
}

/** Temuan minimal yang perlu diperiksa: hanya daftar buktinya. */
type TemuanBerbukti = { bukti: Pick<EvidenceRef, "jenis" | "id">[] };

export function periksaGrounding(
  t: TemuanBerbukti,
  idx: GroundingIndex,
): { ok: true } | { ok: false; alasan: string[] } {
  const alasan: string[] = [];
  for (const b of t.bukti) {
    if (b.jenis === "transaksi" && !idx.transaksi.has(b.id))
      alasan.push(`bukti transaksi "${b.id}" tidak ada dalam data koperasi`);
    else if (b.jenis === "pinjaman" && !idx.pinjaman.has(b.id))
      alasan.push(`bukti pinjaman "${b.id}" tidak ada dalam data koperasi`);
  }
  return alasan.length === 0 ? { ok: true } : { ok: false, alasan };
}
