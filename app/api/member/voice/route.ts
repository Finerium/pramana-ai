import type { NextRequest } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { keputusan, pertanyaanRat, temuan, vote } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { koperasiForAnggota, requireRole } from "../../../../lib/auth";
import { latestRun } from "../../../../lib/audit/persist";
import type { VoiceResp } from "../../../../lib/contracts";

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "anggota");
    const anggotaId = s.anggotaId;
    if (!anggotaId)
      throw new ApiError("INTERNAL", "Sesi anggota tidak lengkap.");
    const koperasiId = await koperasiForAnggota(anggotaId);
    if (!koperasiId)
      throw new ApiError("INTERNAL", "Koperasi anggota tidak ditemukan.");
    const { db } = getDb();

    const run = await latestRun(db, koperasiId);
    let pertanyaanAgregat: VoiceResp["pertanyaanAgregat"] = [];
    if (run) {
      const rows = await db
        .select({
          temuanId: pertanyaanRat.temuanId,
          judul: temuan.judul,
          n: sql<number>`count(*)`,
        })
        .from(pertanyaanRat)
        .innerJoin(temuan, eq(pertanyaanRat.temuanId, temuan.id))
        .where(eq(temuan.auditRunId, run.id))
        .groupBy(pertanyaanRat.temuanId, temuan.judul)
        .orderBy(desc(sql`count(*)`));
      pertanyaanAgregat = rows.map((r) => ({
        temuanId: r.temuanId,
        judul: r.judul,
        jumlahAnggota: Number(r.n),
      }));
    }

    const kRows = await db
      .select()
      .from(keputusan)
      .where(eq(keputusan.koperasiId, koperasiId));
    const keputusanList: VoiceResp["keputusan"] = [];
    for (const k of kRows) {
      const mine = await db
        .select({ id: vote.id })
        .from(vote)
        .where(and(eq(vote.keputusanId, k.id), eq(vote.anggotaId, anggotaId)))
        .limit(1);
      const sudahMemilih = Boolean(mine[0]);
      let hasil: { setuju: number; tidak: number } | null = null;
      if (sudahMemilih) {
        const tally = await db
          .select({ pilihan: vote.pilihan, n: sql<number>`count(*)` })
          .from(vote)
          .where(eq(vote.keputusanId, k.id))
          .groupBy(vote.pilihan);
        let setuju = 0;
        let tidak = 0;
        for (const t of tally) {
          if (t.pilihan === "setuju") setuju = Number(t.n);
          else tidak = Number(t.n);
        }
        hasil = { setuju, tidak };
      }
      keputusanList.push({
        id: k.id,
        judul: k.judul,
        deskripsi: k.deskripsi,
        nominal: k.nominal,
        status: k.status,
        sudahMemilih,
        hasil,
      });
    }

    return ok<VoiceResp>({ pertanyaanAgregat, keputusan: keputusanList });
  });
}
