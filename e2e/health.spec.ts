/**
 * AC-OBS-02: /api/health melaporkan db, demoMode, version nyata.
 */
import { test, expect } from "./helpers/fixtures";

test("AC-OBS-02 /api/health {ok, db:up, demoMode:true, version}", async ({ page }) => {
  const res = await page.request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const j = (await res.json()) as {
    ok: boolean;
    db: string;
    demoMode: boolean;
    version: string;
  };
  expect(j.ok).toBe(true);
  expect(j.db).toBe("up");
  expect(j.demoMode).toBe(true);
  expect(typeof j.version).toBe("string");
  expect(j.version.length).toBeGreaterThan(0);
});
