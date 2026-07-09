/**
 * AC-E2E-06: landing. Render viewport 390 dan 1280 kedua tema; CTA anggota +
 * pemerintah -> /login, daftar -> /daftar (href); statistik === lib/facts.ts
 * (import langsung); NOL panggilan API keluar. Screenshot 4 kombinasi.
 */
import { test, expect } from "./helpers/fixtures";
import { shot, setTheme } from "./helpers/sesi";
import { FACTS } from "../lib/facts";

test("AC-E2E-06 landing: CTA href, statistik facts, nol API, 4 screenshot", async ({
  page,
}) => {
  let apiCalls = 0;
  await page.route("**/api/**", (route) => {
    apiCalls += 1;
    return route.abort();
  });

  await page.goto("/");

  // CTA anggota + pemerintah -> /login; daftar -> /daftar (href).
  await expect(
    page.getByRole("link", { name: "Masuk sebagai Anggota" }).first(),
  ).toHaveAttribute("href", /\/login/);
  await expect(
    page.getByRole("link", { name: "Masuk sebagai Pemerintah" }),
  ).toHaveAttribute("href", /\/login\?as=pemerintah/);
  await expect(
    page.getByRole("link", { name: "Daftar sebagai Anggota Baru" }),
  ).toHaveAttribute("href", "/daftar");

  // Statistik di halaman === nilai lib/facts.ts.
  await expect(page.getByText(FACTS.koperasiTotal.tampil).first()).toBeVisible();
  await expect(page.getByText(FACTS.sudahRat.tampil).first()).toBeVisible();
  await expect(page.getByText(FACTS.risikoKebocoran.tampil).first()).toBeVisible();

  // Render 390 dan 1280, kedua tema (4 screenshot).
  for (const w of [390, 1280]) {
    await page.setViewportSize({ width: w, height: 900 });
    await setTheme(page, "terang");
    await shot(page, "landing", `w${w}-terang`);
    await setTheme(page, "gelap");
    await shot(page, "landing", `w${w}-gelap`);
  }

  expect(apiCalls, "landing tidak boleh memanggil /api").toBe(0);
});
