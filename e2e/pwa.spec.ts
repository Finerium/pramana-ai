/**
 * AC-PWA-01: manifest.webmanifest (name, icons 192+512, display standalone,
 * lang id) terpasang di layout member. AC-PWA-02: SW cache shell; offline reload
 * menampilkan shell + pesan luring (bukan error putih). SW hanya di build produksi.
 *
 * AC-PWA-02 menguji jalur registrasi milik app APA ADANYA (TANPA event 'load'
 * sintetis). Bug RegisterSW (listener 'load' terpasang setelah event terjadi)
 * membuat SW tidak pernah teregistrasi; fix sudah mendarat di main (register
 * langsung saat document.readyState === "complete"). Pada pohon TANPA fix itu
 * test ini GAGAL pada assert registrasi, dan itu hasil yang benar.
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
  await page.goto("/beranda", { waitUntil: "load" });

  // Registrasi HARUS terjadi lewat jalur app sendiri (RegisterSW), tanpa
  // bantuan test. Gagal di sini = bug registrasi app (lihat header file).
  const teregistrasi = await page
    .waitForFunction(
      () => navigator.serviceWorker.getRegistrations().then((r) => r.length > 0),
      null,
      { timeout: 15_000 },
    )
    .then(() => true)
    .catch(() => false);
  expect(
    teregistrasi,
    "RegisterSW harus mendaftarkan /sw.js lewat jalur app sendiri; " +
      "gagal = listener 'load' terpasang setelah event (fix: register langsung " +
      "saat document.readyState === 'complete')",
  ).toBe(true);

  // SW aktif mengendalikan halaman (sw.js: skipWaiting + clients.claim).
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
    null,
    { timeout: 15_000 },
  );

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
