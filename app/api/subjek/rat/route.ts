import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../../db/client";
import { koperasi } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { koperasiForPengurus, requireRole } from "../../../../lib/auth";

const Body = z.object({
  status: z.enum(["belum", "terlaksana"]),
  tanggal: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "pengurus");
    const koperasiId = await koperasiForPengurus(s.userId);
    if (!koperasiId)
      throw new ApiError("FORBIDDEN", "Akun pengurus tidak terkait koperasi.");
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      throw new ApiError("VALIDATION", "Status RAT tidak sah.");
    const { status, tanggal } = parsed.data;
    const { db } = getDb();
    await db
      .update(koperasi)
      .set({ ratStatus: status, ratTanggal: tanggal ?? null })
      .where(eq(koperasi.id, koperasiId));
    return ok({ ratStatus: status });
  });
}
