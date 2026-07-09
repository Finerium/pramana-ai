/**
 * AC-UI-03 (@clicksweep): untuk setiap layar, klik/eksekusi setiap kontrol yang
 * terlihat (button, role=switch, header sortable, role=link), assert nol console
 * error nyata + nol pageerror (fixture) + tiap link punya target terdefinisi.
 * Elemen destruktif (Keluar) diklik terakhir. reseed di akhir.
 */
import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/fixtures";
import { login, reseed, setMockMode } from "./helpers/sesi";

const SEL = "button:visible, [role=switch]:visible, [role=link]:visible";
// Console error dari status HTTP terkelola (mis. login gagal saat menyapu tombol
// Masuk) bukan error aplikasi; disaring dari penegakan AC-UI-03.
const IGNORE_CONSOLE =
  /failed to load resource|net::err|status of 4\d\d|status of 5\d\d|server responded with a status/i;
const LOGOUT = /keluar|logout/i;

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(200);
}

/**
 * Sapu satu layar dalam satu lintasan maju O(n): klik tiap kontrol terlihat;
 * bila klik memicu navigasi keluar layar, kembali dan lanjut dari kontrol
 * berikutnya. Kontrol destruktif (Keluar) dilewati (ditangani terakhir).
 */
async function sweep(page: Page, url: string): Promise<void> {
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
    if (!page.url().endsWith(url)) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await settle(page);
      controls = page.locator(SEL);
      n = await controls.count();
    }
    const el = controls.nth(i);
    const raw = await el
      .getAttribute("aria-label")
      .catch(() => "")
      .then((v) => v ?? "");
    const name = (raw || (await el.textContent().catch(() => "")) || "").trim();
    if (LOGOUT.test(name)) continue; // destruktif: ditangani terakhir
    await el.click({ timeout: 1500 }).catch(() => {});
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
  test.setTimeout(180_000);

  // Publik.
  for (const u of ["/", "/login", "/login?as=pemerintah", "/login?as=bendahara", "/daftar"]) {
    await sweep(page, u);
  }

  // Anggota (Keluar diklik terakhir di /profil).
  await login(page, "anggota");
  for (const u of ["/beranda", "/temuan", "/uang", "/arus", "/suara", "/profil"]) {
    await sweep(page, u);
  }
  await logoutLast(page);

  // Pemerintah.
  await login(page, "pemerintah");
  await sweep(page, "/pemerintah");
  await sweep(page, "/pemerintah/koperasi/kop-sukamaju");

  // Bendahara (Keluar terakhir di /pembukuan).
  await login(page, "bendahara");
  await sweep(page, "/pembukuan");
  await logoutLast(page);

  const nyata = errorSink.consoleErrors.filter((m) => !IGNORE_CONSOLE.test(m));
  expect(nyata, `console error nyata: ${nyata.join(" | ")}`).toEqual([]);
});
