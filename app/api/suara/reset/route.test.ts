/**
 * POST /api/suara/reset: mengembalikan agregat Suara ke baseline seed PERSIS.
 * Baris demo (id ULID) dibuang; baris seed (prefiks "vote-"/"prat-") tetap.
 * Baseline kop-sukamaju: vote 9 setuju/3 tidak, pertanyaan_rat tmn-an1 = 12.
 * ang-juri sengaja di luar vote+RAT seed (lihat seed.anomalies) sehingga aman
 * dipakai sebagai aktor demo tanpa bentrok unique index.
 */
import { NextRequest } from "next/server";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { createDb, resolveDbUrl, type Db } from "../../../../db/client";
import { seed } from "../../../../scripts/seed/index";
import { keputusan, pertanyaanRat, vote } from "../../../../db/schema";
import {
  SESSION_COOKIE,
  sealSession,
  type SessionData,
} from "../../../../lib/auth";
import { POST as resetPost } from "./route";

const SESS: Record<string, SessionData> = {
  anggota: {
    userId: "usr-juri-anggota",
    role: "anggota",
    anggotaId: "ang-juri",
  },
  pemerintah: { userId: "usr-juri-pemerintah", role: "pemerintah" },
  pengurus: { userId: "usr-bendahara", role: "pengurus" },
};

async function mkReq(session: SessionData | null): Promise<NextRequest> {
  const headers = new Headers();
  if (session)
    headers.set("cookie", `${SESSION_COOKIE}=${await sealSession(session)}`);
  return new NextRequest("http://localhost/api/suara/reset", {
    method: "POST",
    headers,
  });
}

let db: Db;

const num = (rows: { n: number }[]): number => Number(rows[0]?.n ?? 0);
const setuju = async (): Promise<number> =>
  num(
    await db
      .select({ n: sql<number>`count(*)` })
      .from(vote)
      .innerJoin(keputusan, eq(vote.keputusanId, keputusan.id))
      .where(
        and(
          eq(keputusan.koperasiId, "kop-sukamaju"),
          eq(vote.pilihan, "setuju"),
        ),
      ),
  );
const pratAn1 = async (): Promise<number> =>
  num(
    await db
      .select({ n: sql<number>`count(*)` })
      .from(pertanyaanRat)
      .where(eq(pertanyaanRat.temuanId, "tmn-an1")),
  );

describe("POST /api/suara/reset kembali ke baseline seed", () => {
  beforeAll(async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "file:./.vitest-suara-reset.db");
    const { url, authToken } = resolveDbUrl();
    ({ db } = createDb(url, authToken));
    await seed(db);
  });

  it("tanpa sesi -> 401; pengurus/pemerintah -> 403", async () => {
    expect((await resetPost(await mkReq(null))).status).toBe(401);
    expect((await resetPost(await mkReq(SESS.pengurus!))).status).toBe(403);
    expect((await resetPost(await mkReq(SESS.pemerintah!))).status).toBe(403);
  });

  it("buang vote+RAT demo (ULID), pertahankan seed, agregat balik 9/12", async () => {
    // Baseline seed.
    expect(await setuju()).toBe(9);
    expect(await pratAn1()).toBe(12);

    // Aktor demo ang-juri menambah 1 vote + 1 pertanyaan RAT (id ULID).
    await db.insert(vote).values({
      id: ulid(),
      keputusanId: "kpts-freezer",
      anggotaId: "ang-juri",
      pilihan: "setuju",
    });
    await db.insert(pertanyaanRat).values({
      id: ulid(),
      temuanId: "tmn-an1",
      anggotaId: "ang-juri",
      ditambahkanPada: new Date().toISOString(),
    });
    expect(await setuju()).toBe(10);
    expect(await pratAn1()).toBe(13);

    // Reset: agregat balik PERSIS ke baseline seed.
    const res = await resetPost(await mkReq(SESS.anggota!));
    expect(res.status).toBe(200);
    expect(await setuju()).toBe(9);
    expect(await pratAn1()).toBe(12);

    // Baris seed tetap utuh (prefiks stabil), bukan terhapus lalu 0.
    const seedVote = num(
      await db
        .select({ n: sql<number>`count(*)` })
        .from(vote)
        .where(sql`${vote.id} like 'vote-%'`),
    );
    expect(seedVote).toBe(12);
  });

  it("reset saat sudah bersih = no-op idempoten (tetap 9/12)", async () => {
    const res = await resetPost(await mkReq(SESS.anggota!));
    expect(res.status).toBe(200);
    expect(await setuju()).toBe(9);
    expect(await pratAn1()).toBe(12);
  });
});
