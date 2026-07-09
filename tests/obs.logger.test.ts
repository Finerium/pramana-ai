/**
 * AC-OBS-01: logger terstruktur JSON (level, requestId, code) dan runRoute
 * menyembunyikan pesan mentah error tak terduga (INTERNAL) tanpa PII di log.
 */
import { describe, it, expect, vi } from "vitest";
import { logInfo, logError } from "../lib/logger";
import { runRoute, ApiError } from "../lib/api";

function spyOut() {
  const lines: string[] = [];
  const spy = vi
    .spyOn(process.stdout, "write")
    .mockImplementation((s: string | Uint8Array): boolean => {
      lines.push(String(s));
      return true;
    });
  return { lines, spy };
}
function spyErr() {
  const lines: string[] = [];
  const spy = vi
    .spyOn(process.stderr, "write")
    .mockImplementation((s: string | Uint8Array): boolean => {
      lines.push(String(s));
      return true;
    });
  return { lines, spy };
}

describe("AC-OBS-01 logger JSON terstruktur", () => {
  it("logInfo/logError emit JSON dengan level, requestId, code", () => {
    const out = spyOut();
    const err = spyErr();
    logInfo({ msg: "hello", requestId: "req-1" });
    logError({ msg: "boom", requestId: "req-2", code: "INTERNAL" });
    out.spy.mockRestore();
    err.spy.mockRestore();

    expect(JSON.parse(out.lines[0]!)).toMatchObject({
      level: "info",
      msg: "hello",
      requestId: "req-1",
    });
    expect(JSON.parse(err.lines[0]!)).toMatchObject({
      level: "error",
      msg: "boom",
      requestId: "req-2",
      code: "INTERNAL",
    });
  });

  it("runRoute menyembunyikan pesan mentah error tak terduga (INTERNAL)", async () => {
    const err = spyErr();
    const raw = "SECRET raw db error dengan detail sensitif user@contoh.id";
    const res = await runRoute(async () => {
      throw new Error(raw);
    });
    err.spy.mockRestore();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Terjadi kesalahan pada sistem. Silakan coba lagi.",
      },
    });
    // Pesan mentah TIDAK bocor ke log.
    expect(err.lines.join("")).not.toContain(raw);
    const parsed = JSON.parse(err.lines[0]!);
    expect(parsed).toMatchObject({
      level: "error",
      code: "INTERNAL",
      msg: "unhandled error",
    });
    expect(typeof parsed.requestId).toBe("string");
    expect(parsed.requestId.length).toBeGreaterThan(0);
  });

  it("runRoute ApiError -> envelope beku + log dengan code", async () => {
    const err = spyErr();
    const res = await runRoute(async () => {
      throw new ApiError("FORBIDDEN", "Anda tidak memiliki akses ke sumber ini.");
    });
    err.spy.mockRestore();

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Anda tidak memiliki akses ke sumber ini." },
    });
    expect(JSON.parse(err.lines[0]!)).toMatchObject({
      level: "error",
      code: "FORBIDDEN",
    });
  });
});
