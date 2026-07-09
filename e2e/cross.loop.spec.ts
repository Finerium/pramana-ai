/**
 * AC-SUBJ-02: loop lintas permukaan dengan mock LLM deterministik. Bendahara
 * catat preset konflik (transaksi BARU vendor beralamat pengurus); pemerintah
 * jalankan Pemeriksaan Ulang -> audit_run live BARU memuat temuan yang merujuk
 * transaksi baru (bukti berisi id transaksi baru) -> temuan tampil di detail
 * pemerintah DAN daftar temuan anggota (source verdict = live). reseed.
 */
import { test, expect } from "./helpers/fixtures";
import { login, reseed, setMockMode } from "./helpers/sesi";

type BuktiRow = { id: string; label: string };
type FindingRow = { bukti: BuktiRow[] };

test.beforeAll(async () => {
  await setMockMode("ok");
  reseed();
});
test.afterAll(() => reseed());

test("AC-SUBJ-02 loop lintas surface: entri konsol -> audit live -> temuan merujuk trx baru", async ({
  page,
}) => {
  await setMockMode("ok");

  // 1. Bendahara catat preset konflik (transaksi baru) via konsol.
  await login(page, "bendahara");
  await page.goto("/pembukuan");
  await expect(page.getByText("Rp 36.500.000")).toBeVisible();
  await page
    .getByRole("button", { name: "Isi contoh: pembelian ke alamat pengurus" })
    .click();
  const [resp] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("/api/subjek/transaksi") &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Catat Transaksi" }).click(),
  ]);
  const trxId = ((await resp.json()) as { data: { transaksiId: string } }).data
    .transaksiId;
  expect(trxId, "id transaksi baru").toBeTruthy();
  await expect(page.getByText("Toko Berkah")).toBeVisible();

  // 2. Pemerintah jalankan Pemeriksaan Ulang (cookie ditukar ke pemerintah).
  await login(page, "pemerintah");
  await page.goto("/pemerintah/koperasi/kop-sukamaju");
  await page.getByRole("button", { name: "Jalankan Pemeriksaan Ulang" }).click();
  await expect(
    page.getByText("Hasil pemeriksaan langsung, baru saja dijalankan."),
  ).toBeVisible({ timeout: 45_000 });

  // 3. Audit_run live memuat temuan merujuk transaksi baru (bukti id baru).
  const govResp = await page.request.get("/api/gov/koperasi/kop-sukamaju");
  const gd = (await govResp.json()) as {
    data: { auditRun: { source: string }; temuan: FindingRow[] };
  };
  expect(gd.data.auditRun.source).toBe("live");
  const govBuktiIds = gd.data.temuan.flatMap((t) => t.bukti.map((b) => b.id));
  expect(govBuktiIds, "detail pemerintah memuat bukti id transaksi baru").toContain(
    trxId,
  );
  await expect(page.getByText(/beralamat sama dengan pengurus/).first()).toBeVisible();

  // 4. Temuan tampil di daftar temuan anggota + source verdict = live.
  await login(page, "anggota");
  const verdictResp = await page.request.get("/api/member/verdict");
  const vj = (await verdictResp.json()) as { data: { source: string } };
  expect(vj.data.source).toBe("live");
  const findResp = await page.request.get("/api/member/findings");
  const fj = (await findResp.json()) as { data: { temuan: FindingRow[] } };
  const memBuktiIds = fj.data.temuan.flatMap((t) => t.bukti.map((b) => b.id));
  expect(memBuktiIds, "daftar temuan anggota memuat bukti id transaksi baru").toContain(
    trxId,
  );
  await page.goto("/temuan");
  await expect(page.getByText(/beralamat sama dengan pengurus/).first()).toBeVisible();
});
