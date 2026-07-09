/**
 * AC-SEC-03: input eksternal tervalidasi di boundary; fixture injeksi (string
 * SQLi, payload XSS pada nama) tersimpan ter-escape (parameterized query) dan
 * dikembalikan sebagai data inert. Render aman diassert di e2e onboarding.
 * Milik verification workflow.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDb, resolveDbUrl, type Db } from "../db/client";
import { anggota, users } from "../db/schema";
import { seed } from "../scripts/seed/index";
import { eq, like } from "drizzle-orm";
import { POST as onboardingPOST } from "../app/api/onboarding/route";

const XSS = '<script>alert("x")</script> Budi';
const SQLI = "Jl. Melati'; DROP TABLE users;--";

let db: Db;

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/onboarding", {
    method: "POST",
    headers: new Headers({
      "content-type": "application/json",
      "x-forwarded-for": "10.8.8.8",
    }),
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  vi.stubEnv("TURSO_DATABASE_URL", "file:./.vitest-injection.db");
  const { url, authToken } = resolveDbUrl();
  ({ db } = createDb(url, authToken));
  await seed(db);
});

describe("fixture injeksi (AC-SEC-03)", () => {
  it("payload XSS pada nama dan SQLi pada alamat tersimpan sebagai data inert", async () => {
    const res = await onboardingPOST(
      req({
        nama: XSS,
        nik: "9911223344556677",
        alamat: SQLI,
        email: "injeksi@pramana.id",
        password: "SandiAman123",
      }),
    );
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      ok: boolean;
      data: { anggotaId: string; kartu: { nama: string } };
    };
    expect(j.ok).toBe(true);
    // Nama kembali persis sebagai data (tidak dieksekusi, tidak dipotong diam-diam).
    expect(j.data.kartu.nama).toBe(XSS);

    // Tabel users selamat dari string SQLi (query parameterized).
    const stillThere = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "juri.anggota@pramana.id"));
    expect(stillThere.length).toBe(1);

    // Baris tersimpan verbatim (escape di lapisan driver, bukan mutasi data).
    const row = await db
      .select({ nama: anggota.nama, alamat: anggota.alamat })
      .from(anggota)
      .where(like(anggota.nama, "%Budi%"));
    const injected = row.find((r) => r.nama === XSS);
    expect(injected?.alamat).toBe(SQLI);

    await seed(db); // pulihkan
  });
});
