/**
 * AC-SUBJ-01: login bendahara -> preset konflik mengisi form -> Catat Transaksi
 * -> entri muncul di daftar terakhir + saldo kas berubah (36.500.000 ->
 * 21.500.000). reseed.
 */
import { test, expect } from "./helpers/fixtures";
import { login, reseed, shot } from "./helpers/sesi";

test.beforeAll(() => reseed());
test.afterAll(() => reseed());

test("AC-SUBJ-01 konsol: preset konflik, Catat Transaksi, entri + saldo turun", async ({
  page,
}) => {
  await login(page, "bendahara");
  await page.goto("/pembukuan");

  // Saldo awal terhidrasi.
  await expect(page.getByText("Rp 36.500.000")).toBeVisible();

  // Preset konflik mengisi form pembelian (vendor Toko Berkah, alamat pengurus).
  await page
    .getByRole("button", { name: "Isi contoh: pembelian ke alamat pengurus" })
    .click();

  // Catat Transaksi -> entri muncul di daftar + saldo baru 21.500.000.
  await page.getByRole("button", { name: "Catat Transaksi" }).click();
  await expect(page.getByText("Toko Berkah")).toBeVisible();
  await expect(page.getByText("Rp 21.500.000")).toBeVisible();
  await shot(page, "subjek", "01-konsol-entri");
});
