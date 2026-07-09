/**
 * AC-DEMO-03 / B4: journey demo B1 dijalankan terhadap server TANPA kunci model
 * (port 3100). Assert /control/stats hits mock TIDAK bertambah selama journey
 * (nol panggilan keluar ke provider). Jalur read-only (tanpa mutasi) agar aman.
 */
import { test, expect } from "./helpers/fixtures";
import { login, reseed, mockHits } from "./helpers/sesi";
import { RINGKASAN_MERAH, TEMUAN_SEED } from "../scripts/fixtures/temuan-seed";

const AN1 = TEMUAN_SEED.find((t) => t.id === "an1")!;

test.beforeAll(() => reseed());

test("AC-DEMO-03 journey demo tanpa kunci model: nol panggilan keluar", async ({
  page,
}) => {
  const before = await mockHits();

  await login(page, "anggota");
  await page.goto("/beranda");
  await expect(page.getByText(RINGKASAN_MERAH)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Perlu Dijelaskan" })).toBeVisible();

  await page.getByRole("button", { name: "Lihat yang perlu Anda tahu" }).click();
  await page.waitForURL("**/temuan");
  const kartu = page.locator("#tmn-an1");
  await kartu.getByRole("button", { name: "Kenapa ini penting?" }).click();
  await expect(kartu.getByText(AN1.kenapa_penting)).toBeVisible();

  await page.goto("/suara");
  await expect(page.getByText("12 anggota menanyakan hal yang sama")).toBeVisible();

  const after = await mockHits();
  expect(
    after,
    "journey demo tanpa kunci model tidak boleh memanggil provider",
  ).toBe(before);
});
