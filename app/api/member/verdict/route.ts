import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { temuan } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { requireRole } from "../../../../lib/auth";
import { latestRun } from "../../../../lib/audit/persist";
import type { Severity } from "../../../../lib/contracts";
import type { VerdictResp } from "../../../../lib/contracts";

const KOPERASI_ID = "kop-sukamaju";

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    await requireRole(req, "anggota");
    const { db } = getDb();
    const run = await latestRun(db, KOPERASI_ID);
    if (!run) throw new ApiError("NOT_FOUND", "Belum ada hasil pemeriksaan.");

    const counts = await db
      .select({ severity: temuan.severity, n: sql<number>`count(*)` })
      .from(temuan)
      .where(eq(temuan.auditRunId, run.id))
      .groupBy(temuan.severity);
    const jumlahTemuan = { merah: 0, kuning: 0, info: 0 };
    for (const c of counts) {
      jumlahTemuan[c.severity as Severity] = Number(c.n);
    }

    return ok<VerdictResp>({
      auditRunId: run.id,
      periode: run.periode,
      source: run.source,
      warna: run.verdictWarna,
      ringkasan: run.ringkasan,
      jumlahTemuan,
    });
  });
}
