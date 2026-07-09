/**
 * AC-PERF-03: fixture 5.000 transaksi tidak pernah dimuat penuh. Daftar
 * berbatas (max 50), flow dihitung agregasi SQL, snapshot audit LIMIT 500.
 * Milik verification workflow.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDb, resolveDbUrl, type Db } from "../db/client";
import { schema, transaksi } from "../db/schema";
import { seed } from "../scripts/seed/index";
import { buildSnapshot } from "../lib/audit/buildSnapshot";
import { sealSession, SESSION_COOKIE, type SessionData } from "../lib/auth";
import { GET as flowGET } from "../app/api/member/flow/route";
import { GET as recentGET } from "../app/api/subjek/recent/route";

const ANGGOTA: SessionData = {
  userId: "usr-juri-anggota",
  role: "anggota",
  anggotaId: "ang-juri",
};
const PENGURUS: SessionData = { userId: "usr-bendahara", role: "pengurus" };

let db: Db;

async function mkReq(session: SessionData, url: string): Promise<NextRequest> {
  const headers = new Headers();
  headers.set("cookie", `${SESSION_COOKIE}=${await sealSession(session)}`);
  headers.set("x-forwarded-for", "10.9.9.9");
  return new NextRequest(url, { headers });
}

beforeAll(async () => {
  vi.stubEnv("TURSO_DATABASE_URL", "file:./.vitest-perf.db");
  const { url, authToken } = resolveDbUrl();
  ({ db } = createDb(url, authToken));
  await seed(db);
  // 5.000 transaksi tambahan periode berjalan (Juni 2026), bulk chunk 500.
  const rows = Array.from({ length: 5000 }, (_, i) => ({
    id: `trx-bulk-${String(i).padStart(4, "0")}`,
    koperasiId: "kop-sukamaju",
    unitUsahaId: null,
    tanggal: `2026-06-${String((i % 28) + 1).padStart(2, "0")}`,
    jenis: i % 2 === 0 ? ("penjualan" as const) : ("operasional" as const),
    arah: i % 2 === 0 ? ("masuk" as const) : ("keluar" as const),
    jumlah: 10_000 + (i % 90) * 1000,
    deskripsi: "Baris uji beban kueri berbatas",
    vendorNama: null,
    vendorAlamat: null,
    anggotaId: null,
  }));
  for (let i = 0; i < rows.length; i += 500) {
    await db.insert(transaksi).values(rows.slice(i, i + 500));
  }
  const n = await db.select().from(transaksi);
  expect(n.length).toBeGreaterThanOrEqual(5400);
}, 60_000);

describe("kueri berbatas dengan 5.000+ transaksi (AC-PERF-03)", () => {
  it("subjek/recent tetap mengembalikan maksimal 10 transaksi (batas <= 50)", async () => {
    const res = await recentGET(
      await mkReq(PENGURUS, "http://localhost/api/subjek/recent"),
    );
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      ok: boolean;
      data: { transaksi: unknown[]; pinjaman: unknown[] };
    };
    expect(j.ok).toBe(true);
    expect(j.data.transaksi.length).toBeLessThanOrEqual(50);
    expect(j.data.transaksi.length).toBe(10);
    expect(j.data.pinjaman.length).toBeLessThanOrEqual(50);
  });

  it("member/flow beragregasi via SQL: respons ringkas, total mencakup 5.406 baris", async () => {
    const res = await flowGET(
      await mkReq(ANGGOTA, "http://localhost/api/member/flow?periode=2026-06"),
    );
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      ok: boolean;
      data: {
        totalMasuk: number;
        totalKeluar: number;
        masuk: { kategori: string; jumlah: number }[];
        keluar: { kategori: string; jumlah: number }[];
        sorotan: unknown[];
      };
    };
    expect(j.ok).toBe(true);
    // Respons TIDAK memuat baris transaksi: hanya kategori kanonik (<= 5 entri).
    expect(j.data.masuk.length).toBeLessThanOrEqual(4);
    expect(j.data.keluar.length).toBeLessThanOrEqual(5);
    expect(j.data.sorotan.length).toBeLessThanOrEqual(20);
    // Bukti agregasi menjangkau baris bulk: total masuk Juni melampaui baseline
    // seed (~57 juta) berkat 2.500 baris penjualan tambahan.
    expect(j.data.totalMasuk).toBeGreaterThan(80_000_000);
    expect(j.data.totalKeluar).toBeGreaterThan(80_000_000);
  });

  it("buildSnapshot membatasi transaksi periode berjalan ke 500 baris", async () => {
    const { snapshot } = await buildSnapshot(db, "kop-sukamaju");
    expect(snapshot.transaksi.length).toBeLessThanOrEqual(500);
    expect(snapshot.koperasi.saldoKasPerBulan.length).toBeLessThanOrEqual(6);
  });

  it("reseed memulihkan state (idempoten, baris bulk hilang)", async () => {
    await seed(db);
    const n = await db.select().from(transaksi);
    expect(n.length).toBeLessThan(500);
  });
});

void schema;
