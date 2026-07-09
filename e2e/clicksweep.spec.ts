/**
 * AC-UI-03 (@clicksweep): untuk setiap layar, klik/eksekusi setiap kontrol yang
 * terlihat (button, role=switch, header sortable, role=link), assert nol console
 * error nyata + nol pageerror (fixture) + respons terdefinisi untuk kontrol
 * non-navigasi kunci (toggle tema mengubah kelas html, sort header mengubah
 * urutan, submit form kosong menampilkan validasi). Elemen destruktif (Keluar)
 * diklik terakhir. reseed di akhir.
 *
 * Tombol audit ("Jalankan Pemeriksaan...") TIDAK diklik saat sweep: tiap klik
 * memicu audit background yang menumpuk dan memperlambat server tanpa batas
 * (sumber flaky). Keberadaannya di-assert; alurnya diuji fallback.cache.spec
 * dan cross.loop.spec.
 */
import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/fixtures";
import { login, reseed, setMockMode } from "./helpers/sesi";

// Retry khusus spec ini (review #1): sweep menyentuh belasan layar nyata.
test.describe.configure({ retries: 1 });

const SEL = "button:visible, [role=switch]:visible, [role=link]:visible";
// HANYA 400/401 dari submit form kosong yang disengaja sweep (login/daftar).
// 5xx atau kode lain = error nyata dan MEMFAILKAN test (review #3).
const IGNORE_CONSOLE = /status of (400|401)/i;
const LOGOUT = /keluar|logout/i;
const AUDIT = /jalankan pemeriksaan|sedang memeriksa/i;
const LOGIN_ERR = "Email atau kata sandi belum tepat. Silakan coba lagi.";

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(200);
}

/**
 * Sapu satu layar dalam satu lintasan maju O(n). navSkip: nama kontrol yang
 * terbukti menavigasi; diklik SEKALI suite-wide (tab bar dan tautan chrome yang
 * sama muncul di banyak layar; mengekliknya berulang hanya menambah re-goto).
 * ponytail: dedup berdasar nama aksesibel; kontrol nav beda layar dengan nama
 * sama dianggap kontrol yang sama.
 */
async function sweep(page: Page, url: string, navSkip: Set<string>): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await settle(page);

  // Tiap tautan punya target terdefinisi (bukan kontrol mati).
  const anchors = page.locator("a[href]");
  const na = await anchors.count();
  for (let i = 0; i < na; i++) {
    expect(
      await anchors.nth(i).getAttribute("href"),
      `tautan tanpa href di ${url}`,
    ).toBeTruthy();
  }

  let controls = page.locator(SEL);
  let n = await controls.count();
  for (let i = 0; i < n; i++) {
    // DOM bisa menyusut di layar mutatif (tombol Tambahkan/vote berganti kotak
    // status): tanpa klem ini nth(i) basi menunggu 30 detik default per aksi.
    if (i >= (await controls.count())) break;
    const el = controls.nth(i);
    const raw =
      (await el.getAttribute("aria-label", { timeout: 300 }).catch(() => null)) ??
      (await el.textContent({ timeout: 300 }).catch(() => "")) ??
      "";
    const name = raw.trim().replace(/\s+/g, " ");
    if (LOGOUT.test(name) || AUDIT.test(name) || navSkip.has(name)) continue;
    await el.click({ timeout: 1500 }).catch(() => {});
    if (!page.url().endsWith(url)) {
      if (name) navSkip.add(name);
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await settle(page);
      controls = page.locator(SEL);
      n = await controls.count();
    }
  }
}

async function logoutLast(page: Page): Promise<void> {
  const btn = page.getByRole("button", { name: LOGOUT }).first();
  if ((await btn.count()) > 0) {
    await btn.click().catch(() => {});
    await page.waitForURL("**/login", { timeout: 10_000 }).catch(() => {});
  }
}

test.beforeAll(async () => {
  await setMockMode("ok");
  reseed();
});
test.afterAll(() => reseed());

test("@clicksweep AC-UI-03 full-click coverage semua layar", async ({
  page,
  errorSink,
}) => {
  test.setTimeout(120_000);
  const navSkip = new Set<string>();

  // --- Respons terdefinisi kontrol kunci (review #3) ------------------------
  // Toggle tema landing mengubah kelas <html>.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const kelasAwal = await page.evaluate(() => document.documentElement.className);
  await page.getByRole("button", { name: /Ganti tema tampilan/ }).first().click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.className))
    .not.toBe(kelasAwal);

  // Submit form login kosong menampilkan validasi (bukan kontrol mati).
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByText(LOGIN_ERR)).toBeVisible();

  // --- Publik ----------------------------------------------------------------
  for (const u of ["/", "/login", "/login?as=pemerintah", "/login?as=bendahara", "/daftar"]) {
    await sweep(page, u, navSkip);
  }

  // --- Anggota (Keluar diklik terakhir di /profil) ----------------------------
  await login(page, "anggota");
  for (const u of ["/beranda", "/temuan", "/uang", "/arus", "/suara", "/profil"]) {
    await sweep(page, u, navSkip);
  }
  await logoutLast(page);

  // --- Pemerintah -------------------------------------------------------------
  await login(page, "pemerintah");
  // Header sortable mengubah urutan baris (respons terdefinisi).
  await page.goto("/pemerintah", { waitUntil: "domcontentloaded" });
  const urutan = () =>
    page
      .locator('[role="link"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")).join("|"));
  await page.getByRole("button", { name: "Urutkan VERDICT" }).waitFor();
  const urutanAwal = await urutan();
  await page.getByRole("button", { name: "Urutkan VERDICT" }).click();
  await expect.poll(urutan).not.toBe(urutanAwal);
  await sweep(page, "/pemerintah", navSkip);
  // Tombol audit ADA (dieksekusi oleh fallback.cache + cross.loop, bukan sweep).
  await page.goto("/pemerintah/koperasi/kop-sukamaju", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: /Jalankan Pemeriksaan/ }).first(),
  ).toBeVisible();
  await sweep(page, "/pemerintah/koperasi/kop-sukamaju", navSkip);

  // --- Bendahara (Keluar terakhir) ---------------------------------------------
  await login(page, "bendahara");
  await sweep(page, "/pembukuan", navSkip);
  await logoutLast(page);

  const nyata = errorSink.consoleErrors.filter((m) => !IGNORE_CONSOLE.test(m));
  expect(nyata, `console error nyata: ${nyata.join(" | ")}`).toEqual([]);
});
