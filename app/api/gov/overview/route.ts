import type { NextRequest } from "next/server";
import { asc, desc, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { auditRun, koperasi, temuan } from "../../../../db/schema";
import { ok, runRoute } from "../../../../lib/api";
import { requireRole } from "../../../../lib/auth";
import { bukanMarker, type AuditRunRow } from "../../../../lib/audit/persist";
import type { GovOverview, VerdictColor } from "../../../../lib/contracts";

const RANK: Record<VerdictColor, number> = { merah: 0, kuning: 1, hijau: 2 };

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    await requireRole(req, "pemerintah");
    const { db } = getDb();

    const kopRows = await db.select().from(koperasi);

    // Run terbaru non-marker per koperasi (himpunan run kecil, bukan load-all).
    const runs = await db
      .select()
      .from(auditRun)
      .where(bukanMarker)
      .orderBy(
        asc(auditRun.koperasiId),
        desc(auditRun.periode),
        desc(auditRun.dibuatPada),
      );
    const latestByKop = new Map<string, AuditRunRow>();
    for (const r of runs) {
      if (!latestByKop.has(r.koperasiId)) latestByKop.set(r.koperasiId, r);
    }

    const runIds = [...latestByKop.values()].map((r) => r.id);
    const countRows =
      runIds.length !== 0
        ? await db
            .select({ auditRunId: temuan.auditRunId, n: sql<number>`count(*)` })
            .from(temuan)
            .where(inArray(temuan.auditRunId, runIds))
            .groupBy(temuan.auditRunId)
        : [];
    const countByRun = new Map(countRows.map((c) => [c.auditRunId, Number(c.n)]));

    let hijau = 0;
    let kuning = 0;
    let merah = 0;
    let temuanTerbuka = 0;
    const koperasiOut = kopRows
      .map((k) => {
        const run = latestByKop.get(k.id);
        const verdictWarna: VerdictColor = run?.verdictWarna ?? "hijau";
        const temuanCount = run ? (countByRun.get(run.id) ?? 0) : 0;
        if (verdictWarna === "merah") merah++;
        else if (verdictWarna === "kuning") kuning++;
        else hijau++;
        temuanTerbuka += temuanCount;
        return {
          id: k.id,
          nama: k.nama,
          provinsi: k.provinsi,
          verdictWarna,
          temuanCount,
        };
      })
      .sort(
        (a, b) =>
          RANK[a.verdictWarna] - RANK[b.verdictWarna] ||
          a.nama.localeCompare(b.nama),
      );

    return ok<GovOverview>({
      kpi: {
        jumlahKoperasi: kopRows.length,
        hijau,
        kuning,
        merah,
        temuanTerbuka,
      },
      koperasi: koperasiOut,
    });
  });
}
