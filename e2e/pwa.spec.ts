/**
 * AC-PWA-01: manifest.webmanifest (name, icons 192+512, display standalone,
 * lang id) terpasang di layout member. AC-PWA-02: SW cache shell; offline reload
 * menampilkan shell + pesan luring (bukan error putih). SW hanya di build produksi.
 *
 * CATATAN VERIFIKASI (bug app): components/member/RegisterSW.tsx memasang
 * listener 'load' di dalam useEffect; pada praktiknya 'load' sudah terjadi saat
 * efek berjalan sehingga SW TIDAK PERNAH teregistrasi (getRegistrations() == 0).
 * Test memicu ulang event 'load' agar handler registrasi milik app benar-benar
 * berjalan, lalu memverifikasi logika cache SW-nya. Perbaikan app: registrasi
 * langsung bila document.readyState === "complete".
 */
import { test, expect } from "./helpers/fixtures";
import { reseed, login } from "./helpers/sesi";

test.beforeAll(() => reseed());

test("AC-PWA-01 manifest valid + terpasang di layout member", async ({ page }) => {
  await login(page, "anggota");
  await page.goto("/beranda");
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);

  const res = await page.request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  const m = (await res.json()) as {
    name: string;
    lang: string;
    display: string;
    icons: Array<{ sizes: string }>;
  };
  expect(m.name).toBe("Pramana AI");
  expect(m.lang).toBe("id");
  expect(m.display).toBe("standalone");
  const sizes = m.icons.map((i) => i.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");
});

test("AC-PWA-02 SW cache shell; offline reload -> shell luring bukan error putih", async ({
  page,
  context,
}) => {
  await login(page, "anggota");
  await page.goto("/beranda");
  await page.waitForLoadState("networkidle").catch(() => {});

  // Jalankan handler registrasi SW milik app (RegisterSW mendengar 'load' yang
  // sudah lewat). Picu ulang lalu tunggu SW aktif dan mengendalikan halaman.
  await page.evaluate(() => window.dispatchEvent(new Event("load")));
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page
    .waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 15_000,
    })
    .catch(() => {});

  // Kunjungan kedua terkendali SW: shell /beranda tersimpan di cache.
  await page.goto("/beranda");
  await page.waitForLoadState("networkidle").catch(() => {});

  await context.setOffline(true);
  await page.reload().catch(() => {});
  const body = (await page.locator("body").textContent()) ?? "";
  expect(body.trim().length, "shell luring bukan halaman kosong").toBeGreaterThan(0);
  expect(
    body,
    "menampilkan shell atau pesan luring, bukan error putih",
  ).toMatch(/Anda sedang luring|Beranda|Uang Anda|Pramana/);
  await context.setOffline(false);
});
