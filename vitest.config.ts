import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
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
    },
  },
});
