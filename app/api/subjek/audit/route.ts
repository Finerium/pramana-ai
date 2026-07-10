/**
 * POST /api/subjek/audit: pengurus memicu audit LIVE untuk koperasinya
 * sendiri (scope dari sesi, bukan body). Pola sama dengan gov/audit/run:
 * kerjakan runLiveAudit di latar via after(), balas 202 {auditRunId,
 * status:"berjalan"}; klien polling GET /api/subjek/audit/[id]. DEMO_MODE
 * tidak mematikan trigger; tanpa key LLM runLiveAudit menandai gagal_langsung.
 */
import { after, type NextRequest } from "next/server";
import { ulid } from "ulid";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { koperasiForPengurus, requireRole } from "../../../../lib/auth";
import { runLiveAudit } from "../../../../lib/audit/persist";

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "pengurus");
    const koperasiId = await koperasiForPengurus(s.userId);
    if (!koperasiId)
      throw new ApiError("FORBIDDEN", "Akun pengurus tidak terkait koperasi.");

    const auditRunId = ulid();
    try {
      // fokus:true = snapshot jendela kecil supaya audit interaktif bendahara
      // selalu selesai cepat (gov tetap snapshot penuh yang dalam).
      after(() => runLiveAudit(auditRunId, koperasiId, { fokus: true }));
    } catch {
      // ponytail: after() di luar konteks request (mis. unit test) diabaikan;
      // eksekusi live audit diuji langsung lewat runLiveAudit.
    }
    return ok({ auditRunId, status: "berjalan" }, { status: 202 });
  });
}
