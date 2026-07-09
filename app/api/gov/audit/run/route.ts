import { after, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { ulid } from "ulid";
import { getDb } from "../../../../../db/client";
import { koperasi } from "../../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../../lib/api";
import { requireRole } from "../../../../../lib/auth";
import { runLiveAudit } from "../../../../../lib/audit/persist";

const Body = z.object({ koperasiId: z.string().min(1) });

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    await requireRole(req, "pemerintah");
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      throw new ApiError("VALIDATION", "koperasiId wajib diisi.");
    const { koperasiId } = parsed.data;
    const { db } = getDb();
    const kop = await db
      .select({ id: koperasi.id })
      .from(koperasi)
      .where(eq(koperasi.id, koperasiId))
      .limit(1);
    if (!kop[0]) throw new ApiError("NOT_FOUND", "Koperasi tidak ditemukan.");

    const auditRunId = ulid();
    // Kerjakan di latar setelah respons (Fluid Compute aman, 6.4). DEMO_MODE
    // tidak mematikan trigger; tanpa key runLiveAudit langsung menandai gagal.
    try {
      after(() => runLiveAudit(auditRunId, koperasiId));
    } catch {
      // ponytail: after() di luar konteks request (mis. unit test) diabaikan;
      // eksekusi live audit diuji langsung lewat runLiveAudit.
    }
    return ok({ auditRunId, status: "berjalan" }, { status: 202 });
  });
}
