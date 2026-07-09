import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { ulid } from "ulid";
import { getDb } from "../../../db/client";
import { keputusan, vote } from "../../../db/schema";
import { ApiError, ok, runRoute } from "../../../lib/api";
import { requireRole } from "../../../lib/auth";

const Body = z.object({
  keputusanId: z.string(),
  pilihan: z.enum(["setuju", "tidak"]),
});

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "anggota");
    const anggotaId = s.anggotaId;
    if (!anggotaId) throw new ApiError("INTERNAL", "Sesi anggota tidak lengkap.");
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      throw new ApiError("VALIDATION", "Pilihan suara tidak sah.");
    const { keputusanId, pilihan } = parsed.data;
    const { db } = getDb();

    const kExists = await db
      .select({ id: keputusan.id })
      .from(keputusan)
      .where(eq(keputusan.id, keputusanId))
      .limit(1);
    if (!kExists[0])
      throw new ApiError("NOT_FOUND", "Keputusan tidak ditemukan.");

    // Idempoten via UNIQUE(keputusanId, anggotaId): pilihan pertama terkunci.
    await db
      .insert(vote)
      .values({ id: ulid(), keputusanId, anggotaId, pilihan })
      .onConflictDoNothing();

    const tally = await db
      .select({ pilihan: vote.pilihan, n: sql<number>`count(*)` })
      .from(vote)
      .where(eq(vote.keputusanId, keputusanId))
      .groupBy(vote.pilihan);
    let setuju = 0;
    let tidak = 0;
    for (const t of tally) {
      if (t.pilihan === "setuju") setuju = Number(t.n);
      else tidak = Number(t.n);
    }
    return ok({ hasil: { setuju, tidak } });
  });
}
