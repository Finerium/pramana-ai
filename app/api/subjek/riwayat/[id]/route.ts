/**
 * GET /api/subjek/riwayat/[id]: detail satu run pemeriksaan LIVE koperasi
 * pengurus (klik dari panel riwayat konsol). Balasan id + dibuatPada +
 * verdictWarna + daftar temuan lengkap (bukti di-parse dari buktiJson),
 * diurut severity (merah, kuning, info) lalu id. Anti IDOR: run harus ada,
 * source "live", dan milik koperasi pengurus sesi, else NOT_FOUND (tak bocorkan
 * keberadaan run koperasi lain).
 */
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db/client";
import { auditRun, temuan } from "../../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../../lib/api";
import { koperasiForPengurus, requireRole } from "../../../../../lib/auth";
import type { EvidenceRef, Severity } from "../../../../../lib/contracts";

const RANK: Record<Severity, number> = { merah: 0, kuning: 1, info: 2 };

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return runRoute(async () => {
    const s = await requireRole(req, "pengurus");
    const koperasiId = await koperasiForPengurus(s.userId);
    if (!koperasiId)
      throw new ApiError("FORBIDDEN", "Akun pengurus tidak terkait koperasi.");

    const { id } = await ctx.params;
    const { db } = getDb();

    const runs = await db
      .select()
      .from(auditRun)
      .where(eq(auditRun.id, id))
      .limit(1);
    const run = runs[0];
    // Anti IDOR: keberadaan/kepemilikan run milik koperasi lain tak dibedakan.
    if (!run || run.source !== "live" || run.koperasiId !== koperasiId)
      throw new ApiError("NOT_FOUND", "Riwayat pemeriksaan tidak ditemukan.");

    const rows = await db
      .select()
      .from(temuan)
      .where(eq(temuan.auditRunId, run.id));
    rows.sort(
      (a, b) => RANK[a.severity] - RANK[b.severity] || a.id.localeCompare(b.id),
    );

    return ok({
      id: run.id,
      dibuatPada: run.dibuatPada,
      verdictWarna: run.verdictWarna,
      temuan: rows.map((r) => ({
        id: r.id,
        agent: r.agent,
        severity: r.severity,
        judul: r.judul,
        penjelasan_awam: r.penjelasanAwam,
        kenapa_penting: r.kenapaPenting,
        bukti: JSON.parse(r.buktiJson) as EvidenceRef[],
        pertanyaan_rat: r.pertanyaanRat,
      })),
    });
  });
}
