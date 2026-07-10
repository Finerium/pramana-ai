/**
 * Reset demo Suara (role anggota). Menghapus pertanyaan_rat + vote yang DITAMBAH
 * saat demo (di luar baseline seed) pada koperasi anggota ini, transaksional,
 * sehingga agregat kembali PERSIS ke baseline seed (an1=12/an4=7/an2=5, vote
 * 9 setuju/3 tidak). Baris seed dikenali dari prefiks id stabil (scripts/seed:
 * pertanyaan_rat "prat-", vote "vote-"); baris demo memakai ulid() sehingga
 * tidak berprefiks itu. Jadi baseline diturunkan dari data seed, bukan angka
 * hard-code. Scope koperasi via koperasiForAnggota (anti IDOR).
 */
import type { NextRequest } from "next/server";
import { and, eq, inArray, notLike } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import {
  auditRun,
  keputusan,
  pertanyaanRat,
  temuan,
  vote,
} from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { koperasiForAnggota, requireRole } from "../../../../lib/auth";

const SEED_PRAT = "prat-%";
const SEED_VOTE = "vote-%";

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "anggota");
    const anggotaId = s.anggotaId;
    if (!anggotaId)
      throw new ApiError("INTERNAL", "Sesi anggota tidak lengkap.");
    const koperasiId = await koperasiForAnggota(anggotaId);
    if (!koperasiId)
      throw new ApiError("INTERNAL", "Koperasi anggota tidak ditemukan.");
    const { db } = getDb();

    await db.transaction(async (tx) => {
      // Vote demo (ulid) pada keputusan koperasi ini; baris seed "vote-" tetap.
      await tx
        .delete(vote)
        .where(
          and(
            inArray(
              vote.keputusanId,
              tx
                .select({ id: keputusan.id })
                .from(keputusan)
                .where(eq(keputusan.koperasiId, koperasiId)),
            ),
            notLike(vote.id, SEED_VOTE),
          ),
        );
      // Pertanyaan RAT demo (ulid) pada temuan koperasi ini; baris seed "prat-" tetap.
      await tx
        .delete(pertanyaanRat)
        .where(
          and(
            inArray(
              pertanyaanRat.temuanId,
              tx
                .select({ id: temuan.id })
                .from(temuan)
                .innerJoin(auditRun, eq(temuan.auditRunId, auditRun.id))
                .where(eq(auditRun.koperasiId, koperasiId)),
            ),
            notLike(pertanyaanRat.id, SEED_PRAT),
          ),
        );
    });

    return ok({ reset: true });
  });
}
