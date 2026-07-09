import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db/client";
import { auditRun } from "../../../../../db/schema";
import { ok, runRoute } from "../../../../../lib/api";
import { requireRole } from "../../../../../lib/auth";
import { latestRun, type AuditRunRow } from "../../../../../lib/audit/persist";

function compact(r: AuditRunRow) {
  return {
    id: r.id,
    koperasiId: r.koperasiId,
    periode: r.periode,
    source: r.source,
    verdictWarna: r.verdictWarna,
    ringkasan: r.ringkasan,
    dibuatPada: r.dibuatPada,
  };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return runRoute(async () => {
    await requireRole(req, "pemerintah");
    const { id } = await ctx.params;
    const { db } = getDb();

    const rows = await db
      .select()
      .from(auditRun)
      .where(eq(auditRun.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return ok({ status: "berjalan" });

    let marker = false;
    try {
      marker =
        (JSON.parse(row.rawJson) as { status?: string })?.status ===
        "gagal_langsung";
    } catch {
      marker = false;
    }
    if (marker) {
      const last = await latestRun(db, row.koperasiId);
      return ok({
        status: "gagal_langsung",
        auditRun: last ? compact(last) : null,
      });
    }
    return ok({ status: "selesai", auditRun: compact(row) });
  });
}
