import type { NextRequest } from "next/server";
import { z } from "zod";
import { ulid } from "ulid";
import { getDb } from "../../../../db/client";
import { pinjaman } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { koperasiForPengurus, requireRole } from "../../../../lib/auth";

const Body = z.object({
  anggotaId: z.string().min(1),
  pokok: z.number().int().positive(),
  cicilanBulanan: z.number().int().positive(),
  jatuhTempoBerikut: z.string().min(1),
  disetujuiOleh: z.string().min(1),
  dokumenLengkap: z.boolean(),
});

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "pengurus");
    const koperasiId = await koperasiForPengurus(s.userId);
    if (!koperasiId)
      throw new ApiError("FORBIDDEN", "Akun pengurus tidak terkait koperasi.");

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      throw new ApiError("VALIDATION", "Data pinjaman tidak lengkap atau tidak sah.");
    const b = parsed.data;
    const pinjamanId = ulid();
    const { db } = getDb();
    await db.insert(pinjaman).values({
      id: pinjamanId,
      anggotaId: b.anggotaId,
      pokok: b.pokok,
      sisa: b.pokok,
      cicilanBulanan: b.cicilanBulanan,
      jatuhTempoBerikut: b.jatuhTempoBerikut,
      disetujuiPada: new Date().toISOString(),
      disetujuiOleh: b.disetujuiOleh,
      dokumenLengkap: b.dokumenLengkap,
    });
    return ok({ pinjamanId });
  });
}
