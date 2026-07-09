/**
 * AC-E2E-03 / B3: onboarding. NIK 15 digit -> error onboard.nik.err + TIDAK
 * membuat akun (login gagal). NIK 16 digit valid -> kartu anggota (nama +
 * noAnggota) -> sesi aktif (/beranda sukses). reseed sesudahnya.
 */
import { test, expect } from "./helpers/fixtures";
import { reseed, shot } from "./helpers/sesi";

const NIK_ERR = "Nomor NIK harus 16 angka. Silakan periksa kembali KTP Anda.";
const SUKSES = "Selamat, Anda resmi menjadi anggota. Ini kartu anggota digital Anda.";
const EMAIL16 = "uji-onboard16@pramana.id";
const PASS = "RahasiaUji123";

test.beforeAll(() => reseed());
test.afterAll(() => reseed());

test("AC-E2E-03 NIK 15 ditolak tanpa akun; NIK 16 membuat kartu + sesi aktif", async ({
  page,
}) => {
  // --- NIK 15 digit -> error, tidak membuat akun ----------------------------
  await page.goto("/daftar");
  await page.getByPlaceholder("Sesuai KTP").fill("Uji Lima Belas");
  await page.getByPlaceholder("Nomor pada KTP Anda").fill("123456789012345"); // 15
  await page.getByPlaceholder("Dusun, desa, kecamatan").fill("Dusun Uji, Sukamaju");
  await page.getByPlaceholder("nama@contoh.id").fill("uji-nik15@pramana.id");
  await page.getByPlaceholder("Minimal 8 karakter").fill(PASS);
  await page.getByRole("button", { name: "Daftar dan verifikasi" }).click();
  await expect(page.getByText(NIK_ERR)).toBeVisible();
  await shot(page, "daftar", "01-nik15-error");

  // Akun TIDAK dibuat: login dengan kredensial itu gagal.
  const gagal = await page.request.post("/api/auth/login", {
    data: { email: "uji-nik15@pramana.id", password: PASS },
  });
  expect(gagal.status()).toBe(401);

  // --- NIK 16 digit valid -> kartu anggota ---------------------------------
  await page.reload();
  await page.getByPlaceholder("Sesuai KTP").fill("Uji Enam Belas");
  await page.getByPlaceholder("Nomor pada KTP Anda").fill("3208010101010001"); // 16
  await page.getByPlaceholder("Dusun, desa, kecamatan").fill("Dusun Uji, Sukamaju");
  await page.getByPlaceholder("nama@contoh.id").fill(EMAIL16);
  await page.getByPlaceholder("Minimal 8 karakter").fill(PASS);
  await page.getByRole("button", { name: "Daftar dan verifikasi" }).click();

  await expect(page.getByText(SUKSES)).toBeVisible();
  await expect(page.getByText("Uji Enam Belas")).toBeVisible();
  await expect(page.getByText(/SKM-\d+/)).toBeVisible(); // noAnggota
  await shot(page, "daftar", "02-kartu-anggota");

  // --- Sesi aktif: /beranda sukses -----------------------------------------
  await page.goto("/beranda");
  await expect(
    page.getByText(
      "Kas koperasi menurun dan ada satu pembelian besar yang perlu dijelaskan pengurus.",
    ),
  ).toBeVisible();
});
