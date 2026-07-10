/**
 * GET /api/subjek/riwayat: riwayat pemeriksaan LIVE koperasi pengurus (panel
 * konsol di bawah tree). Hanya run source="live" non-marker, terbaru dulu,
 * bounded 8. temuanCount = COUNT nyata baris temuan per run (LEFT JOIN + GROUP
 * BY, run tanpa temuan tetap muncul dengan 0). Anti IDOR: scope dari sesi.
 */
import type { NextRequest } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { auditRun, temuan } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { koperasiForPengurus, requireRole } from "../../../../lib/auth";
import { bukanMarker } from "../../../../lib/audit/persist";

const BATAS = 8;

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "pengurus");
    const koperasiId = await koperasiForPengurus(s.userId);
    if (!koperasiId)
      throw new ApiError("FORBIDDEN", "Akun pengurus tidak terkait koperasi.");
    const { db } = getDb();

    const riwayat = await db
      .select({
        id: auditRun.id,
        dibuatPada: auditRun.dibuatPada,
        verdictWarna: auditRun.verdictWarna,
        temuanCount: sql<number>`count(${temuan.id})`,
      })
      .from(auditRun)
      .leftJoin(temuan, eq(temuan.auditRunId, auditRun.id))
      .where(
        and(
          eq(auditRun.koperasiId, koperasiId),
          eq(auditRun.source, "live"),
          bukanMarker,
        ),
      )
      .groupBy(auditRun.id)
      .orderBy(desc(auditRun.dibuatPada), desc(auditRun.id))
      .limit(BATAS);

    return ok({ riwayat });
  });
}
