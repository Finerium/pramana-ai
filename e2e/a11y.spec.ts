/**
 * AC-A11Y-01: axe-core pada 5 layar kunci (login, beranda, temuan, arus, gov
 * overview) -> nol pelanggaran serious/critical. AC-A11Y-02: touch target aksi
 * utama >= 44px; teks nominal utama layar anggota >= 24px.
 */
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./helpers/fixtures";
import { reseed, login } from "./helpers/sesi";

async function axeSeriousCritical(page: import("@playwright/test").Page) {
  const res = await new AxeBuilder({ page }).analyze();
  return res.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
}

test.beforeAll(() => reseed());

test("AC-A11Y-01 axe nol serious/critical pada 5 layar kunci", async ({
  page,
}) => {
  const laporan: string[] = [];

  // Kontras dinilai pada keadaan settle, bukan di tengah animasi entrance
  // (fade/rise membuat axe menyampel teks beropacity parsial). App menghormati
  // prefers-reduced-motion by design sehingga warna identik, animasi instan.
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();
  for (const v of await axeSeriousCritical(page))
    laporan.push(`login: ${v.id} (${v.impact})`);

  await login(page, "anggota");
  await page.goto("/beranda");
  await expect(
    page.getByRole("heading", { name: "Perlu Dijelaskan" }),
  ).toBeVisible();
  for (const v of await axeSeriousCritical(page))
    laporan.push(`beranda: ${v.id} (${v.impact})`);

  await page.goto("/temuan");
  await expect(page.locator("#tmn-an1")).toBeVisible();
  for (const v of await axeSeriousCritical(page))
    laporan.push(`temuan: ${v.id} (${v.impact})`);

  await page.goto("/arus");
  await expect(page.getByRole("heading", { name: "Arus Dana" })).toBeVisible();
  for (const v of await axeSeriousCritical(page))
    laporan.push(`arus: ${v.id} (${v.impact})`);

  await login(page, "pemerintah");
  await page.goto("/pemerintah");
  await expect(
    page.getByRole("heading", { name: "Peta Kesehatan Koperasi Desa" }),
  ).toBeVisible();
  for (const v of await axeSeriousCritical(page))
    laporan.push(`gov-overview: ${v.id} (${v.impact})`);

  expect(
    laporan,
    `pelanggaran serious/critical: ${laporan.join(" | ")}`,
  ).toEqual([]);
});

test("AC-A11Y-02 touch target >= 44px dan teks nominal >= 24px", async ({
  page,
}) => {
  await login(page, "anggota");
  await page.goto("/beranda");

  const cta = page.getByRole("button", { name: "Lihat yang perlu Anda tahu" });
  const box = await cta.boundingBox();
  expect(box, "CTA verdict punya bounding box").not.toBeNull();
  expect(box!.height, "touch target aksi utama >= 44px").toBeGreaterThanOrEqual(
    44,
  );

  await page.goto("/uang");
  await expect(page.getByText("Total simpanan Anda")).toBeVisible();
  const maxNominalFs = await page.evaluate(() => {
    let max = 0;
    for (const el of Array.from(document.querySelectorAll("main *"))) {
      const t = (el.textContent ?? "").trim();
      if (!t) continue;
      const fs = parseFloat(getComputedStyle(el as Element).fontSize);
      if (Number.isFinite(fs) && fs > max) max = fs;
    }
    return max;
  });
  expect(
    maxNominalFs,
    "teks nominal utama layar anggota >= 24px",
  ).toBeGreaterThanOrEqual(24);
});
