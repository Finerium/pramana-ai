/**
 * POST /api/subjek/audit: pengurus memicu audit LIVE untuk koperasinya
 * sendiri (scope dari sesi, bukan body). Pola sama dengan gov/audit/run:
 * kerjakan runLiveAudit di latar via after(), balas 202 {auditRunId,
 * status:"berjalan"}; klien polling GET /api/subjek/audit/[id]. DEMO_MODE
 * tidak mematikan trigger; tanpa key LLM runLiveAudit menandai gagal_langsung.
 */
import { after, type NextRequest } from "next/server";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { getDb } from "../../../../db/client";
import { auditRun } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { koperasiForPengurus, requireRole } from "../../../../lib/auth";
import { runLiveAudit } from "../../../../lib/audit/persist";

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "pengurus");
    const koperasiId = await koperasiForPengurus(s.userId);
    if (!koperasiId)
      throw new ApiError("FORBIDDEN", "Akun pengurus tidak terkait koperasi.");

    const { db } = getDb();

    // Guard konkurensi: bila koperasi ini SUDAH punya audit berjalan (marker
    // < 5 menit, filter sama dgn gov/pemeriksaan-berjalan), jangan mulai audit
    // baru. Balas auditRunId yang sedang jalan agar klien polling itu. Mencegah
    // audit menumpuk, notif dobel, dan run basi menang sebagai latestRun.
    const batas = new Date(Date.now() - 5 * 60_000).toISOString();
    const sedangJalan = await db
      .select({
        auditRunId: sql<string>`json_extract(${auditRun.rawJson}, '$.auditRunId')`,
      })
      .from(auditRun)
      .where(
        and(
          eq(auditRun.koperasiId, koperasiId),
          sql`json_extract(${auditRun.rawJson}, '$.status') = 'berjalan'`,
          gt(auditRun.dibuatPada, batas),
        ),
      )
      .orderBy(desc(auditRun.dibuatPada))
      .limit(1);
    if (sedangJalan[0]?.auditRunId) {
      return ok(
        { auditRunId: sedangJalan[0].auditRunId, status: "berjalan" },
        { status: 202 },
      );
    }

    const auditRunId = ulid();

    // Marker "sedang diperiksa Pramana": disisipkan SINKRON sebelum audit latar
    // supaya dashboard pemerintah langsung menandai koperasi ini. runLiveAudit
    // menghapusnya saat audit selesai; bukanMarker mengecualikannya dari semua
    // hasil. Gagal insert TIDAK menggagalkan trigger (indikator best-effort).
    try {
      const now = new Date().toISOString();
      await db.insert(auditRun).values({
        id: "berjalan-" + auditRunId,
        koperasiId,
        periode: "",
        source: "live",
        verdictWarna: "kuning",
        ringkasan: "",
        durasiMs: 0,
        rawJson: JSON.stringify({ status: "berjalan", auditRunId, mulai: now }),
        dibuatPada: now,
      });
    } catch {
      // ponytail: marker best-effort; kegagalan insert tak boleh memblok audit.
    }

    try {
      // fokus:true = snapshot jendela kecil supaya audit interaktif bendahara
      // selalu selesai cepat (gov tetap snapshot penuh yang dalam).
      after(() =>
        runLiveAudit(auditRunId, koperasiId, {
          fokus: true,
          cancelViaMarker: true,
        }),
      );
    } catch {
      // ponytail: after() di luar konteks request (mis. unit test) diabaikan;
      // eksekusi live audit diuji langsung lewat runLiveAudit.
    }
    return ok({ auditRunId, status: "berjalan" }, { status: 202 });
  });
}
