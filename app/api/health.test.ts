import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { GET as health } from "./health/route";

// Isolasi DB via env (vi.stubEnv menghindari literal env di sumber test).
beforeAll(() => {
  vi.stubEnv("TURSO_DATABASE_URL", "file:./.vitest-health.db");
});
afterAll(() => vi.unstubAllEnvs());

describe("health 6.3 (AC-OBS-02)", () => {
  it("bentuk flat {ok, db, llm, demoMode, version}; tanpa panggil provider", async () => {
    const res = await health();
    const j = (await res.json()) as {
      ok: boolean;
      db: string;
      llm: string;
      demoMode: boolean;
      version: string;
    };
    expect(j.ok).toBe(true);
    expect(j.db).toBe("up");
    // Tanpa LLM_API_KEY -> "unset"; health tidak memanggil provider.
    expect(j.llm).toBe("unset");
    expect(j.demoMode).toBe(true);
    expect(typeof j.version).toBe("string");
  });
});
