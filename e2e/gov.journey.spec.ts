/**
 * AC-E2E-02: alur juri.pemerintah. Login -> KPI (12/6/4/2/17) -> sort tabel
 * (klik header VERDICT, urutan berubah) -> drill Sukamaju -> 6 temuan urut
 * severity + sub-row TANGGAPAN PENGURUS AN-2 "24 JUNI 2026". Screenshot overview
 * + detail kedua tema.
 */
import { test, expect } from "./helpers/fixtures";
import { reseed, login, shot, shotThemes, setTheme } from "./helpers/sesi";

async function kpiValue(
  page: import("@playwright/test").Page,
  label: string,
): Promise<string> {
  const card = page.locator(".gov-panel").filter({ hasText: label }).first();
  return ((await card.locator(".gov-num").first().textContent()) ?? "").trim();
}

test.beforeAll(() => reseed());

test("AC-E2E-02 alur pemerintah: KPI, sort, drill Sukamaju, tanggapan AN-2", async ({
  page,
}) => {
  await login(page, "pemerintah");
  await page.goto("/pemerintah");

  // --- KPI 12/6/4/2/17 ------------------------------------------------------
  await expect(
    page.getByRole("heading", { name: "Peta Kesehatan Koperasi Desa" }),
  ).toBeVisible();
  expect(await kpiValue(page, "KOPERASI TERPANTAU")).toBe("12");
  expect(await kpiValue(page, "TEMUAN TERBUKA")).toBe("17");
  // hijau 6, kuning 4, merah 2 (footer tabel gabungan, unik).
  await expect(page.getByText("2 merah · 4 kuning · 6 hijau")).toBeVisible();
  await shotThemes(page, "gov", "01-overview");

  // --- Sort tabel: klik header VERDICT -> urutan baris berubah --------------
  const rowLabels = () =>
    page
      .locator('[role="link"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  const before = await rowLabels();
  await page.getByRole("button", { name: "Urutkan VERDICT" }).click();
  await expect
    .poll(async () => JSON.stringify(await rowLabels()))
    .not.toBe(JSON.stringify(before));

  // --- Drill Sukamaju -------------------------------------------------------
  await page
    .getByRole("link", {
      name: "Buka detail Koperasi Desa Merah Putih Sukamaju",
    })
    .click();
  await page.waitForURL("**/pemerintah/koperasi/kop-sukamaju");
  await expect(
    page.getByRole("heading", { name: "Koperasi Desa Merah Putih Sukamaju" }),
  ).toBeVisible();

  // 6 temuan urut severity (merah AN-1 pertama), sub-row tanggapan AN-2.
  await expect(
    page.getByText("6 temuan, periode Juni 2026, diurutkan dari tingkat tertinggi"),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Pembelian Rp 15.000.000 ke toko yang beralamat sama dengan rumah bendahara",
    ),
  ).toBeVisible();
  await expect(page.getByText("TANGGAPAN PENGURUS · 24 JUNI 2026")).toBeVisible();
  await expect(
    page.getByText(/Kelima pinjaman merupakan program musim tanam/),
  ).toBeVisible();
  await setTheme(page, "terang");
  await shot(page, "gov", "02-detail-sukamaju-terang");
  await setTheme(page, "gelap");
  await shot(page, "gov", "02-detail-sukamaju-gelap");
});
