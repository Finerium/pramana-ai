/**
 * POST /api/subjek/reset: mengembalikan koperasi pengurus ke baseline seed
 * PERSIS untuk demo bersih. Hapus HANYA yang ditambah bendahara (id ULID +
 * pemeriksaan source="live"); entri seed (prefiks "trx-"/"pj-", run source=
 * "seed") TETAP. Saldo balik ke baseline Sukamaju Rp36.500.000, RAT ke "belum".
 * Anti IDOR: hanya pengurus, scope dari sesi.
 */
import { NextRequest } from "next/server";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { createDb, resolveDbUrl, type Db } from "../../../../db/client";
import { seed } from "../../../../scripts/seed/index";
import { auditRun, koperasi, transaksi } from "../../../../db/schema";
import {
  SESSION_COOKIE,
  sealSession,
  type SessionData,
} from "../../../../lib/auth";
import { POST as resetPost } from "./route";

const KOP = "kop-sukamaju";
const BASELINE_SALDO = 36_500_000;

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
  return new NextRequest("http://localhost/api/subjek/reset", {
    method: "POST",
    headers,
  });
}

let db: Db;
const num = (rows: { n: number }[]): number => Number(rows[0]?.n ?? 0);
const saldo = () =>
  db
    .select({ n: koperasi.saldoKas })
    .from(koperasi)
    .where(eq(koperasi.id, KOP))
    .limit(1)
    .then((r) => Number(r[0]?.n ?? -1));
const countTrx = async (like: string): Promise<number> =>
  num(
    await db
      .select({ n: sql<number>`count(*)` })
      .from(transaksi)
      .where(
        and(eq(transaksi.koperasiId, KOP), sql`${transaksi.id} like ${like}`),
      ),
  );
const countRun = async (source: "seed" | "live"): Promise<number> =>
  num(
    await db
      .select({ n: sql<number>`count(*)` })
      .from(auditRun)
      .where(and(eq(auditRun.koperasiId, KOP), eq(auditRun.source, source))),
  );

describe("POST /api/subjek/reset kembali ke baseline seed", () => {
  beforeAll(async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "file:./.vitest-subjek-reset.db");
    const { url, authToken } = resolveDbUrl();
    ({ db } = createDb(url, authToken));
    await seed(db);
  });

  it("tanpa sesi -> 401; anggota/pemerintah -> 403", async () => {
    expect((await resetPost(await mkReq(null))).status).toBe(401);
    expect((await resetPost(await mkReq(SESS.anggota!))).status).toBe(403);
    expect((await resetPost(await mkReq(SESS.pemerintah!))).status).toBe(403);
  });

  it("buang entri+run bendahara, pertahankan seed, saldo balik 36.500.000", async () => {
    const seedRunBaseline = await countRun("seed");
    expect(await saldo()).toBe(BASELINE_SALDO);
    expect(await countTrx("trx-an1")).toBe(1); // fixture konflik seed

    // Bendahara mencatat: transaksi ULID + pemeriksaan live + ubah saldo & RAT.
    await db.insert(transaksi).values({
      id: ulid(),
      koperasiId: KOP,
      tanggal: "2026-06-27",
      jenis: "operasional",
      arah: "keluar",
      jumlah: 5_000_000,
      deskripsi: "Pengeluaran demo",
    });
    await db.insert(auditRun).values({
      id: ulid(),
      koperasiId: KOP,
      periode: "2026-06",
      source: "live",
      verdictWarna: "merah",
      ringkasan: "Run live demo.",
      durasiMs: 1,
      rawJson: JSON.stringify({ verdict: { warna: "merah" } }),
      dibuatPada: new Date().toISOString(),
    });
    await db
      .update(koperasi)
      .set({ saldoKas: 99_000_000, ratStatus: "terlaksana" })
      .where(eq(koperasi.id, KOP));
    expect(await countRun("live")).toBe(1);

    // Reset.
    const res = await resetPost(await mkReq(SESS.pengurus!));
    expect(res.status).toBe(200);

    // Baseline PERSIS + seed utuh.
    expect(await saldo()).toBe(BASELINE_SALDO);
    expect(await countRun("live")).toBe(0); // run bendahara terhapus
    expect(await countRun("seed")).toBe(seedRunBaseline); // seed tak tersentuh
    expect(await countTrx("trx-an1")).toBe(1); // fixture seed aman
    // Transaksi demo (ULID, bukan awalan seed) sudah dibuang.
    const nonSeedTrx = num(
      await db
        .select({ n: sql<number>`count(*)` })
        .from(transaksi)
        .where(
          and(
            eq(transaksi.koperasiId, KOP),
            sql`${transaksi.id} not like 'trx-%'`,
          ),
        ),
    );
    expect(nonSeedTrx).toBe(0);
    const rat = await db
      .select({ s: koperasi.ratStatus })
      .from(koperasi)
      .where(eq(koperasi.id, KOP))
      .limit(1);
    expect(rat[0]?.s).toBe("belum");
  });
});
