/**
 * POST /api/subjek/reset: kembalikan koperasi pengurus ke baseline seed untuk
 * demo bersih. Hapus HANYA yang ditambah bendahara (transaksi/pinjaman id ULID,
 * bukan awalan seed "trx-"/"pj-"; pemeriksaan source "live" termasuk marker
 * gagal), lalu set saldo + status RAT ke baseline. Transaksional; anti IDOR
 * (scope dari sesi). Run seed (source "seed") dan entri seed tidak tersentuh.
 */
import type { NextRequest } from "next/server";
import { and, eq, inArray, notLike } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import {
  anggota,
  auditRun,
  koperasi,
  notifikasi,
  pertanyaanRat,
  pinjaman,
  temuan,
  transaksi,
} from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { koperasiForPengurus, requireRole } from "../../../../lib/auth";
// ponytail: baseline = konstanta seed surface subjek (cermin kop-sukamaju.
// saldoKas di scripts/seed/data.ts). Impor buildSeedData penuh menyeret bcrypt/
// RNG ke fungsi; satu konstanta cukup. Naikkan ke lookup per-koperasi hanya bila
// ada konsol pengurus non-Sukamaju (kini hanya bendahara@ = kop-sukamaju).
import { SEED_SALDO } from "../../../../components/subjek/logic";

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "pengurus");
    const koperasiId = await koperasiForPengurus(s.userId);
    if (!koperasiId)
      throw new ApiError("FORBIDDEN", "Akun pengurus tidak terkait koperasi.");
    const { db } = getDb();

    await db.transaction(async (tx) => {
      // Pemeriksaan yang ditambah bendahara = source "live" (id ULID); run seed
      // (source "seed", id "ar-...") tetap. Marker gagal juga source "live" ->
      // ikut bersih. Scope koperasiId = anti IDOR.
      const liveRuns = await tx
        .select({ id: auditRun.id })
        .from(auditRun)
        .where(
          and(eq(auditRun.koperasiId, koperasiId), eq(auditRun.source, "live")),
        );
      const liveIds = liveRuns.map((r) => r.id);
      if (liveIds.length) {
        const liveTemuan = await tx
          .select({ id: temuan.id })
          .from(temuan)
          .where(inArray(temuan.auditRunId, liveIds));
        const liveTemuanIds = liveTemuan.map((t) => t.id);
        // pertanyaan_rat -> temuan (FK): buang dulu bila anggota sempat
        // mengangkat temuan live ke RAT, agar delete temuan tak melanggar FK.
        if (liveTemuanIds.length)
          await tx
            .delete(pertanyaanRat)
            .where(inArray(pertanyaanRat.temuanId, liveTemuanIds));
        await tx.delete(temuan).where(inArray(temuan.auditRunId, liveIds));
        await tx.delete(auditRun).where(inArray(auditRun.id, liveIds));
      }

      // Transaksi bendahara = id ULID (bukan awalan seed "trx-").
      await tx
        .delete(transaksi)
        .where(
          and(
            eq(transaksi.koperasiId, koperasiId),
            notLike(transaksi.id, "trx-%"),
          ),
        );

      // Pinjaman bendahara = id ULID (bukan awalan seed "pj-"), dibatasi anggota
      // koperasi ini (pinjaman tak menyimpan koperasiId langsung).
      const angg = await tx
        .select({ id: anggota.id })
        .from(anggota)
        .where(eq(anggota.koperasiId, koperasiId));
      const angIds = angg.map((a) => a.id);
      if (angIds.length) {
        await tx
          .delete(pinjaman)
          .where(
            and(
              notLike(pinjaman.id, "pj-%"),
              inArray(pinjaman.anggotaId, angIds),
            ),
          );
        // Notifikasi fan-out audit live = id ULID (bukan awalan seed "notif-").
        // Buang agar badge anggota kembali ke baseline seed sesudah reset demo;
        // tanpa ini badge menumpuk notif "N temuan" dari audit yang sudah dihapus
        // sementara layar Temuan sudah balik ke run seed (angka jadi tak konsisten).
        await tx
          .delete(notifikasi)
          .where(
            and(
              notLike(notifikasi.id, "notif-%"),
              inArray(notifikasi.anggotaId, angIds),
            ),
          );
      }

      // Baseline seed persis: saldo Sukamaju + RAT belum (konsol dapat mengubah
      // keduanya via transaksi dan status RAT).
      await tx
        .update(koperasi)
        .set({ saldoKas: SEED_SALDO, ratStatus: "belum", ratTanggal: null })
        .where(eq(koperasi.id, koperasiId));
    });

    return ok({ saldoKas: SEED_SALDO });
  });
}
