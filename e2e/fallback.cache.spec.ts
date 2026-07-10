/**
 * AC-LLM-05 / B5: mock mode gagal -> pemerintah jalankan Pemeriksaan Ulang ->
 * status akhir gagal_langsung + banner audit.gagal + verdict yang tampil = run
 * seed terakhir (merah, ringkasan fixture). Kembalikan mock ke ok + reseed.
 */
import { test, expect } from "./helpers/fixtures";
import { login, reseed, setMockMode, shot } from "./helpers/sesi";
import { RINGKASAN_MERAH } from "../scripts/fixtures/temuan-seed";

const BANNER_GAGAL =
  "Pemeriksaan langsung gagal. Menampilkan hasil tersimpan terakhir.";

test.beforeAll(() => reseed());
test.afterAll(async () => {
  await setMockMode("ok");
  reseed();
});

test("AC-LLM-05 fallback cache: gagal_langsung + banner + verdict seed merah", async ({
  page,
}) => {
  await setMockMode("gagal");
  await login(page, "pemerintah");
  await page.goto("/pemerintah/koperasi/kop-sukamaju");

  await page
    .getByRole("button", { name: "Jalankan Pemeriksaan Ulang" })
    .click();

  // Banner gagal (status akhir gagal_langsung).
  await expect(page.getByText(BANNER_GAGAL)).toBeVisible({ timeout: 45_000 });
  // Verdict yang tampil = run seed terakhir (merah, ringkasan fixture).
  // Ringkasan seed muncul di dua wilayah pada gagal_langsung: panel verdict
  // utama dan simpul kesimpulan diagram pemeriksaan (fitur M4). Keduanya sah;
  // .first() menegaskan verdict seed merah tampil tanpa memilih salah satu.
  await expect(page.getByText(RINGKASAN_MERAH).first()).toBeVisible();
  await shot(page, "gov", "03-fallback-gagal");
});
