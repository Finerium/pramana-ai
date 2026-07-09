import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { pertanyaanRat, temuan } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { requireRole } from "../../../../lib/auth";
import { latestRun } from "../../../../lib/audit/persist";
import type { AgentFinding, EvidenceRef, Severity } from "../../../../lib/contracts";

const KOPERASI_ID = "kop-sukamaju";
const RANK: Record<Severity, number> = { merah: 0, kuning: 1, info: 2 };

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "anggota");
    const anggotaId = s.anggotaId;
    if (!anggotaId) throw new ApiError("INTERNAL", "Sesi anggota tidak lengkap.");
    const { db } = getDb();

    const run = await latestRun(db, KOPERASI_ID);
    if (!run) return ok({ temuan: [], sudahDitambahkan: [] });

    const rows = await db
      .select()
      .from(temuan)
      .where(eq(temuan.auditRunId, run.id));
    rows.sort(
      (a, b) => RANK[a.severity] - RANK[b.severity] || a.id.localeCompare(b.id),
    );
    const temuanList: AgentFinding[] = rows.map((r) => ({
      id: r.id,
      agent: r.agent,
      severity: r.severity,
      judul: r.judul,
      penjelasan_awam: r.penjelasanAwam,
      kenapa_penting: r.kenapaPenting,
      bukti: JSON.parse(r.buktiJson) as EvidenceRef[],
      pertanyaan_rat: r.pertanyaanRat,
    }));

    const runTemuanIds = new Set(rows.map((r) => r.id));
    const added = await db
      .select({ temuanId: pertanyaanRat.temuanId })
      .from(pertanyaanRat)
      .where(eq(pertanyaanRat.anggotaId, anggotaId));
    const sudahDitambahkan = added
      .map((a) => a.temuanId)
      .filter((id) => runTemuanIds.has(id));

    return ok({ temuan: temuanList, sudahDitambahkan });
  });
}
