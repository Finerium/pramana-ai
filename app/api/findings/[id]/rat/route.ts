import type { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { getDb } from "../../../../../db/client";
import { auditRun, pertanyaanRat, temuan } from "../../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../../lib/api";
import { koperasiForAnggota, requireRole } from "../../../../../lib/auth";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return runRoute(async () => {
    const s = await requireRole(req, "anggota");
    const anggotaId = s.anggotaId;
    if (!anggotaId)
      throw new ApiError("INTERNAL", "Sesi anggota tidak lengkap.");
    const { id: temuanId } = await ctx.params;
    const { db } = getDb();

    // Scope ke koperasi sesi: temuan milik koperasi lain diperlakukan tidak ada
    // (anti IDOR; anggota hanya mengangkat temuan koperasinya sendiri).
    const koperasiId = await koperasiForAnggota(anggotaId);
    const exists = await db
      .select({ id: temuan.id })
      .from(temuan)
      .innerJoin(auditRun, eq(temuan.auditRunId, auditRun.id))
      .where(
        and(eq(temuan.id, temuanId), eq(auditRun.koperasiId, koperasiId ?? "")),
      )
      .limit(1);
    if (!exists[0]) throw new ApiError("NOT_FOUND", "Temuan tidak ditemukan.");

    // Idempoten per (temuan, anggota) via UNIQUE; ulangan tidak menyisip.
    await db
      .insert(pertanyaanRat)
      .values({
        id: ulid(),
        temuanId,
        anggotaId,
        ditambahkanPada: new Date().toISOString(),
      })
      .onConflictDoNothing();

    const agg = await db
      .select({ n: sql<number>`count(*)` })
      .from(pertanyaanRat)
      .where(eq(pertanyaanRat.temuanId, temuanId));
    return ok({ agregat: Number(agg[0]?.n ?? 0) });
  });
}
