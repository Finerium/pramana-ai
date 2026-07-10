/**
 * GET /api/gov/pemeriksaan-berjalan: koperasi yang SEDANG diperiksa Pramana
 * (audit LIVE berjalan). Sumbernya baris MARKER audit_run rawJson.status =
 * "berjalan" yang disisipkan sinkron saat trigger bendahara dan dihapus saat
 * audit selesai (lib/audit/persist runLiveAudit). Batas 5 menit menyaring
 * phantom bila cleanup gagal; string ISO leksikografis = kronologis.
 */
import type { NextRequest } from "next/server";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { auditRun, koperasi } from "../../../../db/schema";
import { ok, runRoute } from "../../../../lib/api";
import { requireRole } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    await requireRole(req, "pemerintah");
    const { db } = getDb();

    const batas = new Date(Date.now() - 5 * 60_000).toISOString();
    const berjalan = await db
      .select({
        koperasiId: auditRun.koperasiId,
        nama: koperasi.nama,
        mulai: sql<string>`json_extract(${auditRun.rawJson}, '$.mulai')`,
      })
      .from(auditRun)
      .innerJoin(koperasi, eq(koperasi.id, auditRun.koperasiId))
      .where(
        and(
          sql`json_extract(${auditRun.rawJson}, '$.status') = 'berjalan'`,
          gt(auditRun.dibuatPada, batas),
        ),
      )
      .orderBy(desc(auditRun.dibuatPada))
      .limit(24);

    return ok({ berjalan });
  });
}
