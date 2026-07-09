import type { NextRequest } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../../db/client";
import {
  anggota,
  auditRun,
  koperasi,
  temuan,
  unitUsaha,
} from "../../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../../lib/api";
import { requireRole } from "../../../../../lib/auth";
import {
  bukanMarker,
  latestRun,
  type AuditRunRow,
} from "../../../../../lib/audit/persist";
import type {
  AgentFinding,
  EvidenceRef,
  Severity,
} from "../../../../../lib/contracts";

const RANK: Record<Severity, number> = { merah: 0, kuning: 1, info: 2 };

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

    const kopRows = await db
      .select()
      .from(koperasi)
      .where(eq(koperasi.id, id))
      .limit(1);
    const kop = kopRows[0];
    if (!kop) throw new ApiError("NOT_FOUND", "Koperasi tidak ditemukan.");

    const uu = await db
      .select()
      .from(unitUsaha)
      .where(eq(unitUsaha.koperasiId, id));

    const run = await latestRun(db, id);
    const temuanRows = run
      ? await db.select().from(temuan).where(eq(temuan.auditRunId, run.id))
      : [];
    temuanRows.sort(
      (a, b) => RANK[a.severity] - RANK[b.severity] || a.id.localeCompare(b.id),
    );
    const temuanOut: (AgentFinding & { tanggapanPengurus: string | null })[] =
      temuanRows.map((r) => ({
        id: r.id,
        agent: r.agent,
        severity: r.severity,
        judul: r.judul,
        penjelasan_awam: r.penjelasanAwam,
        kenapa_penting: r.kenapaPenting,
        pertanyaan_rat: r.pertanyaanRat,
        bukti: JSON.parse(r.buktiJson) as EvidenceRef[],
        tanggapanPengurus: r.tanggapanPengurus,
      }));

    const trenRows = await db
      .select({
        periode: auditRun.periode,
        verdictWarna: auditRun.verdictWarna,
      })
      .from(auditRun)
      .where(and(eq(auditRun.koperasiId, id), bukanMarker))
      .orderBy(asc(auditRun.periode));
    const tren = trenRows.map((t) => ({
      periode: t.periode,
      warna: t.verdictWarna,
    }));

    // Perluasan aditif: jumlah anggota untuk baris profil (bundle menampilkannya).
    const jumlahAnggotaRows = await db
      .select({ n: sql<number>`count(*)` })
      .from(anggota)
      .where(eq(anggota.koperasiId, id));

    return ok({
      profil: {
        ...kop,
        unitUsaha: uu,
        jumlahAnggota: jumlahAnggotaRows[0]?.n ?? 0,
      },
      auditRun: run ? compact(run) : null,
      temuan: temuanOut,
      tren,
    });
  });
}
