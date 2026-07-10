/**
 * Co-located: cabang route detail koperasi gov yang tidak disentuh
 * routes.test.ts. Menutup jalur riwayat (angka nTemuan NYATA = COUNT temuan,
 * konsisten dengan array temuan), koperasi tanpa run (auditRun/temuan/tren/
 * riwayat kosong + jumlahAnggota 0), dan NOT_FOUND. Harness meniru
 * routes.test.ts: file:dev.db bersama di-seed ulang (seed() menghapus semua
 * tabel dulu, jadi baris uji tidak bocor antar-file).
 */
import { NextRequest } from "next/server";
import { describe, it, expect, beforeAll } from "vitest";
import { createDb, resolveDbUrl, type Db } from "../../../../../db/client";
import { seed } from "../../../../../scripts/seed/index";
import {
  SESSION_COOKIE,
  sealSession,
  type SessionData,
} from "../../../../../lib/auth";
import { koperasi } from "../../../../../db/schema";
import { GET as govKoperasi } from "./route";

const PEM: SessionData = { userId: "usr-juri-pemerintah", role: "pemerintah" };
let testDb: Db;

async function req(): Promise<NextRequest> {
  const headers = new Headers();
  headers.set("cookie", `${SESSION_COOKIE}=${await sealSession(PEM)}`);
  headers.set("x-forwarded-for", "10.0.0.9");
  return new NextRequest("http://localhost/api/gov/koperasi/x", {
    method: "GET",
    headers,
  });
}
const P = (id: string) => ({ params: Promise.resolve({ id }) });
type Env = {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: { code: string };
};
const env = async (r: Response): Promise<Env> => (await r.json()) as Env;

beforeAll(async () => {
  const { url, authToken } = resolveDbUrl();
  const { db } = createDb(url, authToken);
  await seed(db);
  testDb = db;
});

describe("gov/koperasi/[id]: riwayat + cabang kosong", () => {
  it("riwayat: run non-marker terbaru dulu, nTemuan NYATA cocok array temuan", async () => {
    const d = (await env(await govKoperasi(await req(), P("kop-sukamaju"))))
      .data!;
    const riwayat = d.riwayat as {
      periode: string;
      verdictWarna: string;
      nTemuan: number;
      dibuatPada: string;
    }[];
    expect(Array.isArray(riwayat)).toBe(true);
    expect(riwayat.length).toBeGreaterThan(0);
    // Terbaru (periode desc) di indeks 0: run Juni = merah, jumlah temuan
    // harus sama dengan array temuan yang dipakai layar (satu sumber).
    const teratas = riwayat[0];
    expect(teratas?.periode).toBe("2026-06");
    expect(teratas?.verdictWarna).toBe("merah");
    expect(teratas?.nTemuan).toBe((d.temuan as unknown[]).length);
    // Tidak boleh ada nTemuan negatif atau NaN (COUNT selalu >= 0).
    for (const r of riwayat) expect(r.nTemuan).toBeGreaterThanOrEqual(0);
  });

  it("koperasi tanpa run: auditRun/temuan/tren/riwayat kosong, jumlahAnggota 0", async () => {
    await testDb.insert(koperasi).values({
      id: "kop-tanpa-run",
      nama: "Koperasi Uji Tanpa Run",
      desa: "Uji",
      kabupaten: "Uji",
      provinsi: "Uji",
      isDetailSeeded: false,
      saldoKas: 0,
      ratStatus: "belum",
      ratTanggal: null,
      dibentukPada: "2026-01-01",
    });
    const d = (await env(await govKoperasi(await req(), P("kop-tanpa-run"))))
      .data!;
    expect(d.auditRun).toBeNull();
    expect((d.temuan as unknown[]).length).toBe(0);
    expect((d.tren as unknown[]).length).toBe(0);
    expect((d.riwayat as unknown[]).length).toBe(0);
    const profil = d.profil as { jumlahAnggota: number; unitUsaha: unknown[] };
    expect(profil.jumlahAnggota).toBe(0);
    expect(profil.unitUsaha.length).toBe(0);
  });

  it("koperasi tidak ada: NOT_FOUND", async () => {
    const e = await env(await govKoperasi(await req(), P("kop-tidak-ada")));
    expect(e.ok).toBe(false);
    expect(e.error?.code).toBe("NOT_FOUND");
  });
});
