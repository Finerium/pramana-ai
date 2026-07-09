import { defineConfig, devices } from "@playwright/test";

const PROC_ENV = process.env;
// Mock boleh reuse (stateless per /control). Server next TIDAK reuse: server
// yatim di port 3000/3100 membuat run memakai binary/state basi (sumber run
// kacau reviewer). false = fail-fast bila port terpakai + selalu mulai dari
// seed segar; trade-off: tiap run membayar boot server dan port harus bersih.
const REUSE_MOCK = !PROC_ENV.CI;

// Secret dev/test tetap (>= 32 char) untuk `next start` produksi (lib/env
// fail-fast tanpa ini). BUKAN nilai produksi.
const SESSION_SECRET = "pramana-e2e-session-secret-000000000000";
const MOCK_BASE = "http://localhost:4545/v1";

// Layar member/onboarding/vote/pwa berjalan di viewport ponsel; gov/landing/
// subjek dan spec lintas-surface di desktop (spec lintas-surface menyetel
// viewport ponsel inline saat menyentuh layar anggota).
const MOBILE_SPECS = [
  "member.journey.spec.ts",
  "onboarding.spec.ts",
  "vote.spec.ts",
  "pwa.spec.ts",
];
const DESKTOP_SPECS = [
  "gov.journey.spec.ts",
  "landing.spec.ts",
  "login.spec.ts",
  "fallback.cache.spec.ts",
  "subjek.console.spec.ts",
  "cross.loop.spec.ts",
  "clicksweep.spec.ts",
  "a11y.spec.ts",
  "health.spec.ts",
];

export default defineConfig({
  testDir: "e2e",
  // Determinisme: satu worker, tanpa paralel (file:dev.db bersama + reseed).
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: PROC_ENV.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile",
      testMatch: MOBILE_SPECS,
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: "desktop",
      testMatch: DESKTOP_SPECS,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      // AC-DEMO-03: server TANPA kunci model (port 3100). Journey demo tidak
      // memicu audit; assert hits mock tidak bertambah (nol panggilan keluar).
      name: "nollm",
      testMatch: ["nollm.spec.ts"],
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        baseURL: PROC_ENV.E2E_NOLLM_URL ?? "http://localhost:3100",
      },
    },
  ],
  webServer: [
    {
      // Mock LLM deterministik lebih dulu (dipakai server utama sebagai provider).
      command: "npx tsx e2e/helpers/mock-llm.ts",
      url: "http://localhost:4545/control/health",
      reuseExistingServer: REUSE_MOCK,
      timeout: 60_000,
    },
    {
      // Server utama: build harus sudah ada. Seed hermetik + TURSO dikosongkan,
      // provider diarahkan ke mock, kunci hadir (memicu audit live).
      command: "pnpm seed && pnpm start",
      url: "http://localhost:3000/api/health",
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        TURSO_DATABASE_URL: "",
        TURSO_AUTH_TOKEN: "",
        SESSION_SECRET,
        LLM_API_KEY: "mock-key",
        LLM_BASE_URL: MOCK_BASE,
        DEMO_MODE: "true",
      },
    },
    {
      // Server tanpa kunci model (AC-DEMO-03) pada port 3100, berbagi dev.db.
      command: "pnpm start",
      url: "http://localhost:3100/api/health",
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        PORT: "3100",
        TURSO_DATABASE_URL: "",
        TURSO_AUTH_TOKEN: "",
        SESSION_SECRET,
        LLM_API_KEY: "",
        LLM_BASE_URL: MOCK_BASE,
        DEMO_MODE: "true",
      },
    },
  ],
});
