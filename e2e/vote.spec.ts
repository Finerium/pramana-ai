/**
 * AC-E2E-04 / B2: voting. Login anggota -> /suara pilih Setuju -> hasil 10
 * setuju 3 tidak + terkunci; POST /api/vote kedua kali -> 200 idempoten hasil
 * tetap. reseed.
 */
import { test, expect } from "./helpers/fixtures";
import { login, reseed, shot } from "./helpers/sesi";

test.beforeAll(() => reseed());
test.afterAll(() => reseed());

test("AC-E2E-04 vote Setuju -> 10/3 terkunci, POST ulang idempoten", async ({
  page,
}) => {
  await login(page, "anggota");
  await page.goto("/suara");

  await expect(page.getByText("Pembelian freezer untuk gerai sembako")).toBeVisible();
  await page.getByRole("button", { name: "Setuju", exact: true }).click();

  // Hasil 10 setuju, 3 tidak + terkunci.
  await expect(page.getByText("10 Setuju")).toBeVisible();
  await expect(page.getByText("3 Tidak Setuju")).toBeVisible();
  await expect(
    page.getByText("Pilihan tersimpan dan tidak dapat diubah."),
  ).toBeVisible();
  await shot(page, "member", "04-suara-vote-terkunci");

  // POST /api/vote kedua kali -> 200 idempoten, hasil tidak berubah.
  const res = await page.request.post("/api/vote", {
    data: { keputusanId: "kpts-freezer", pilihan: "tidak" },
  });
  expect(res.status()).toBe(200);
  const j = (await res.json()) as { data: { hasil: { setuju: number; tidak: number } } };
  expect(j.data.hasil).toEqual({ setuju: 10, tidak: 3 });
});
