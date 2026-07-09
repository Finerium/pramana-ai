import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    // Beberapa suite (routes, seed.anomalies, db.design, buildSnapshot)
    // berbagi file:dev.db dan saling reseed; paralelisme antar-file memicu
    // SQLITE_BUSY. Serial antar-file: deterministik, biaya detik.
    fileParallelism: false,
    include: [
      "tests/**/*.test.ts",
      "lib/**/*.test.ts",
      "db/**/*.test.ts",
      "scripts/**/*.test.ts",
      "app/**/*.test.ts",
      "app/**/*.test.tsx",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: ["lib/**", "db/**", "app/api/**"],
      exclude: ["**/*.test.ts", "**/*.test.tsx"],
      // AC-UNI-01: global >= 70; aturan warna dan denylist 100 persen branch.
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
        "lib/audit/verdict.ts": { branches: 100 },
        "lib/registerGuard.ts": { branches: 100 },
      },
    },
  },
});
