/**
 * AC-E2E-05: login salah password -> login.err, tanpa detail bocor; varian
 * ?as=pemerintah dan ?as=bendahara render (screenshot).
 */
import { test, expect } from "./helpers/fixtures";
import { shot } from "./helpers/sesi";

const LOGIN_ERR = "Email atau kata sandi belum tepat. Silakan coba lagi.";

test("AC-E2E-05 password salah -> pesan awam tanpa detail bocor", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("textbox").first().fill("juri.anggota@pramana.id");
  await page.locator('input[type="password"]').fill("passwordSalah");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page.getByText(LOGIN_ERR)).toBeVisible();
  // Tidak membocorkan detail internal.
  await expect(
    page.getByText(/UNAUTHORIZED|INTERNAL|stack|Error:/),
  ).toHaveCount(0);
  await shot(page, "login", "01-error-anggota");
});

test("AC-E2E-05 varian ?as=pemerintah render", async ({ page }) => {
  await page.goto("/login?as=pemerintah");
  await expect(page.getByText("DASBOR PENGAWASAN KEMENKOP RI")).toBeVisible();
  await expect(page.locator("#gov-email")).toBeVisible();
  await shot(page, "login", "02-varian-pemerintah");
});

test("AC-E2E-05 varian ?as=bendahara render", async ({ page }) => {
  await page.goto("/login?as=bendahara");
  // exact: cocokkan label kotak akun saja, bukan kontainer induk yang teksnya
  // memuat frasa sama sebagai substring (hindari strict-mode 2 elemen).
  await expect(
    page.getByText("Akun uji bendahara", { exact: true }),
  ).toBeVisible();
  await shot(page, "login", "03-varian-bendahara");
});
