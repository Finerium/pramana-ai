import type { NextRequest } from "next/server";
import { and, asc, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { notifikasi, pinjaman, simpanan } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { requireRole } from "../../../../lib/auth";
import type { MemberSummary } from "../../../../lib/contracts";

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "anggota");
    const anggotaId = s.anggotaId;
    if (!anggotaId)
      throw new ApiError("INTERNAL", "Sesi anggota tidak lengkap.");
    const { db } = getDb();

    const simp = await db
      .select({ total: sql<number>`coalesce(sum(${simpanan.saldo}), 0)` })
      .from(simpanan)
      .where(eq(simpanan.anggotaId, anggotaId));
    const totalSimpanan = Number(simp[0]?.total ?? 0);

    const pinj = await db
      .select()
      .from(pinjaman)
      .where(and(eq(pinjaman.anggotaId, anggotaId), gt(pinjaman.sisa, 0)))
      .orderBy(asc(pinjaman.jatuhTempoBerikut));
    const sisaPinjaman = pinj.reduce((a, p) => a + p.sisa, 0);
    const next = pinj[0];
    const cicilanBerikut = next
      ? { jumlah: next.cicilanBulanan, tanggal: next.jatuhTempoBerikut }
      : null;

    const notif = await db
      .select({ n: sql<number>`count(*)` })
      .from(notifikasi)
      .where(
        and(eq(notifikasi.anggotaId, anggotaId), isNull(notifikasi.dibacaPada)),
      );
    const notifikasiBelumDibaca = Number(notif[0]?.n ?? 0);

    return ok<MemberSummary>({
      uangAnda: { totalSimpanan, sisaPinjaman, cicilanBerikut },
      notifikasiBelumDibaca,
    });
  });
}
