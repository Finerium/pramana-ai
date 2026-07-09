import type { NextRequest } from "next/server";
import { z } from "zod";
import { ulid } from "ulid";
import { and, eq, or } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { pengurus, pinjaman } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import {
  anggotaMilikKoperasi,
  koperasiForPengurus,
  requireRole,
} from "../../../../lib/auth";

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
      throw new ApiError(
        "VALIDATION",
        "Data pinjaman tidak lengkap atau tidak sah.",
      );
    const b = parsed.data;
    // Anti IDOR: pinjaman hanya untuk anggota koperasi pengurus sesi.
    if (!(await anggotaMilikKoperasi(b.anggotaId, koperasiId))) {
      throw new ApiError(
        "VALIDATION",
        "Anggota tidak terdaftar di koperasi ini.",
      );
    }
    const { db } = getDb();
    // disetujuiOleh kolom FK ke pengurus.id (6.2), tetapi form konsol memilih
    // JABATAN (bundle: "disetujui oleh, 5 jabatan"). Resolusi ke pengurus.id
    // koperasi ini via id ATAU jabatan; tanpa itu insert melanggar FK (500).
    const penyetuju = await db
      .select({ id: pengurus.id })
      .from(pengurus)
      .where(
        and(
          eq(pengurus.koperasiId, koperasiId),
          or(
            eq(pengurus.id, b.disetujuiOleh),
            // jabatan kolom enum; nilai string dicocokkan apa adanya (tak cocok
            // = tak ada baris, ditangani sebagai penyetuju tak dikenali).
            eq(
              pengurus.jabatan,
              b.disetujuiOleh as (typeof pengurus.$inferSelect)["jabatan"],
            ),
          ),
        ),
      )
      .limit(1);
    const disetujuiOlehId = penyetuju[0]?.id;
    if (!disetujuiOlehId) {
      throw new ApiError(
        "VALIDATION",
        "Penyetuju tidak dikenali pada koperasi ini.",
      );
    }
    const pinjamanId = ulid();
    await db.insert(pinjaman).values({
      id: pinjamanId,
      anggotaId: b.anggotaId,
      pokok: b.pokok,
      sisa: b.pokok,
      cicilanBulanan: b.cicilanBulanan,
      jatuhTempoBerikut: b.jatuhTempoBerikut,
      disetujuiPada: new Date().toISOString(),
      disetujuiOleh: disetujuiOlehId,
      dokumenLengkap: b.dokumenLengkap,
    });
    return ok({ pinjamanId });
  });
}
