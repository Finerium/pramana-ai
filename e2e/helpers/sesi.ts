/**
 * Helper sesi + kontrol lingkungan e2e (spec 1). login lewat POST
 * /api/auth/login (cookie disegel pada context page), reseed hermetik (pnpm
 * seed, TURSO dikosongkan), kontrol mock LLM, tema, dan screenshot.
 * Semua spec memakai helper ini agar deterministik dan mandiri.
 */
import { execSync } from "node:child_process";
import type { Page } from "@playwright/test";

const PROC_ENV = process["env"];

export const PERSONAS = {
  anggota: { email: "juri.anggota@pramana.id", password: "PramanaJuri2026" },
  pemerintah: { email: "juri.pemerintah@pramana.id", password: "PramanaJuri2026" },
  bendahara: { email: "bendahara@pramana.id", password: "PramanaBendahara2026" },
  sari: { email: "sari@pramana.id", password: "SariSukamaju1" },
} as const;
export type Persona = keyof typeof PERSONAS;

const MOCK_URL = PROC_ENV.MOCK_LLM_URL ?? "http://localhost:4545";

/**
 * Reseed hermetik: kembalikan file:dev.db ke state seed deterministik. TURSO
 * dikosongkan agar tidak menyentuh basis data operator. Sinkron: menjaga urutan
 * sebelum grup destruktif (workers=1).
 */
export function reseed(): void {
  execSync("pnpm seed", {
    stdio: "pipe",
    env: { ...PROC_ENV, TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "" },
  });
}

/** Login persona via API; cookie sesi tersimpan pada context page. */
export async function login(page: Page, persona: Persona): Promise<void> {
  const { email, password } = PERSONAS[persona];
  const res = await page.request.post("/api/auth/login", {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`login ${persona} gagal: HTTP ${res.status()}`);
  }
}

// --- kontrol mock LLM (fetch global; dapat dipanggil di hook tanpa page) -----

/** Setel mode mock LLM: "ok" (jawaban valid) atau "gagal" (HTTP 500). */
export async function setMockMode(mode: "ok" | "gagal"): Promise<void> {
  await fetch(`${MOCK_URL}/control`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode }),
  });
}

/** Nolkan penghitung panggilan mock LLM. */
export async function resetMockHits(): Promise<void> {
  await fetch(`${MOCK_URL}/control/reset`, { method: "POST" });
}

/** Jumlah panggilan /v1/chat/completions yang diterima mock sejauh ini. */
export async function mockHits(): Promise<number> {
  const res = await fetch(`${MOCK_URL}/control/stats`);
  const j = (await res.json()) as { hits?: number };
  return Number(j.hits ?? 0);
}

export type Tema = "terang" | "gelap";

/**
 * Terapkan tema pada semua surface: set kedua kunci localStorage yang dipakai
 * skrip pre-paint (member/landing/subjek = "pramana-tema"; gov = "gov-tema")
 * lalu reload agar kelas .dark/.light diterapkan sebelum paint.
 */
export async function setTheme(page: Page, tema: Tema): Promise<void> {
  await page.evaluate((t) => {
    try {
      localStorage.setItem("pramana-tema", t);
      localStorage.setItem("gov-tema", t);
    } catch {
      /* localStorage tidak tersedia: abaikan */
    }
  }, tema);
  await page.reload({ waitUntil: "domcontentloaded" });
}

/** Screenshot penuh ke test-results/screens/<surface>/<name>.png. */
export async function shot(page: Page, surface: string, name: string): Promise<void> {
  await page.screenshot({
    path: `test-results/screens/${surface}/${name}.png`,
    fullPage: true,
  });
}

/** Screenshot kedua tema (terang lalu gelap) untuk satu layar. */
export async function shotThemes(
  page: Page,
  surface: string,
  name: string,
): Promise<void> {
  await setTheme(page, "terang");
  await shot(page, surface, `${name}-terang`);
  await setTheme(page, "gelap");
  await shot(page, surface, `${name}-gelap`);
  // Kembalikan ke terang agar interaksi lanjutan pada state default.
  await setTheme(page, "terang");
}
