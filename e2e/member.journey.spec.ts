/**
 * AC-E2E-01 / B1: alur juri.anggota lengkap. Login -> verdict MERAH + ringkasan
 * fixture + CTA -> temuan AN-1 -> "Kenapa ini penting?" (tanpa kata denylist
 * 6.5) -> "Tambahkan ke pertanyaan rapat" -> konfirmasi -> /suara agregat AN-1
 * 12 menjadi 13. Screenshot tiap layar (beranda + temuan kedua tema).
 */
import { test, expect } from "./helpers/fixtures";
import { login, reseed, shot, shotThemes, setTheme } from "./helpers/sesi";
import { RINGKASAN_MERAH, TEMUAN_SEED } from "../scripts/fixtures/temuan-seed";

const CTA = "Lihat yang perlu Anda tahu";
const KENAPA = "Kenapa ini penting?";
const TAMBAH = "Tambahkan ke pertanyaan rapat";
const TAMBAH_OK = "Tersimpan. Pertanyaan ini akan dibawa ke Rapat Anggota Tahunan.";
const DENYLIST = /\b(korupsi|mencuri|maling|penipuan|menggelapkan|pelaku)\b/i;

const AN1 = TEMUAN_SEED.find((t) => t.id === "an1")!;

test.beforeAll(() => reseed());
test.afterAll(() => reseed());

test("B1 alur anggota: verdict merah, temuan AN-1, tambah RAT, agregat 12->13", async ({
  page,
}) => {
  await login(page, "anggota");

  // --- Beranda: kartu verdict MERAH + ringkasan fixture + CTA ---------------
  await page.goto("/beranda");
  await expect(page.getByText(RINGKASAN_MERAH)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Perlu Dijelaskan" })).toBeVisible();
  const cta = page.getByRole("button", { name: CTA });
  await expect(cta).toBeVisible();
  await shotThemes(page, "member", "01-beranda-verdict-merah");

  // --- Buka temuan AN-1 -----------------------------------------------------
  await cta.click();
  await page.waitForURL("**/temuan");
  const kartu = page.locator("#tmn-an1");
  await expect(kartu).toBeVisible();
  await expect(kartu.getByText(AN1.judul)).toBeVisible();

  // --- "Kenapa ini penting?" -> teks edukasi tanpa kata denylist ------------
  await kartu.getByRole("button", { name: KENAPA }).click();
  const kenapa = kartu.getByText(AN1.kenapa_penting);
  await expect(kenapa).toBeVisible();
  const teks = (await kenapa.textContent()) ?? "";
  expect(teks, "teks kenapa_penting bebas kata denylist 6.5").not.toMatch(DENYLIST);
  await shotThemes(page, "member", "02-temuan-an1");

  // --- Tambahkan ke pertanyaan rapat -> konfirmasi --------------------------
  await kartu.getByRole("button", { name: TAMBAH }).click();
  await expect(page.getByText(TAMBAH_OK)).toBeVisible();

  // --- /suara: agregat AN-1 berubah 12 -> 13 --------------------------------
  await page.goto("/suara");
  await expect(
    page.getByText("13 anggota menanyakan hal yang sama"),
  ).toBeVisible();
  await expect(page.getByText("Termasuk pertanyaan Anda")).toBeVisible();
  await setTheme(page, "terang");
  await shot(page, "member", "03-suara-agregat-13");
});
