import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { demoMode, hasLlmKey, sessionSecret } from "../lib/env";
import { ApiError, fail, ok, runRoute } from "../lib/api";
import {
  SESSION_COOKIE,
  getSession,
  requireRole,
  sealSession,
} from "../lib/auth";
import {
  clientIp,
  recordLoginFailure,
  resetRateLimit,
  tooManyLogins,
} from "../lib/rateLimit";

describe("env 6.16", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("DEMO_MODE default true", () => {
    expect(demoMode()).toBe(true);
    vi.stubEnv("DEMO_MODE", "false");
    expect(demoMode()).toBe(false);
  });

  it("SESSION_SECRET fail-fast di production tanpa secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    expect(() => sessionSecret()).toThrow(/32 karakter/);
  });

  it("SESSION_SECRET production menerima secret cukup panjang", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "x".repeat(40));
    expect(sessionSecret()).toHaveLength(40);
  });

  it("SESSION_SECRET dev jatuh ke fallback aman", () => {
    expect(sessionSecret().length).toBeGreaterThanOrEqual(32);
  });

  it("hasLlmKey mengikuti LLM_API_KEY", () => {
    expect(hasLlmKey()).toBe(false);
    vi.stubEnv("LLM_API_KEY", "sk-contoh");
    expect(hasLlmKey()).toBe(true);
  });
});

describe("api envelope 6.3", () => {
  it("ok berbentuk {ok:true,data}", async () => {
    const r = ok({ a: 1 });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, data: { a: 1 } });
  });

  it("fail memetakan enam kode ke status", async () => {
    const cases = [
      ["UNAUTHORIZED", 401],
      ["FORBIDDEN", 403],
      ["NOT_FOUND", 404],
      ["VALIDATION", 400],
      ["LLM_UNAVAILABLE", 503],
      ["INTERNAL", 500],
    ] as const;
    for (const [code, status] of cases) {
      const r = fail(code, "pesan");
      expect(r.status).toBe(status);
      const j = (await r.json()) as {
        ok: boolean;
        error: { code: string; message: string };
      };
      expect(j.ok).toBe(false);
      expect(j.error.code).toBe(code);
      expect(j.error.message).toBe("pesan");
    }
  });

  it("runRoute menerjemahkan ApiError ke envelope", async () => {
    const r = await runRoute(async () => {
      throw new ApiError("NOT_FOUND", "hilang");
    });
    expect(r.status).toBe(404);
    expect(((await r.json()) as { error: { code: string } }).error.code).toBe(
      "NOT_FOUND",
    );
  });

  it("runRoute menerjemahkan error tak terduga ke INTERNAL", async () => {
    const r = await runRoute(async () => {
      throw new Error("boom");
    });
    expect(r.status).toBe(500);
    const j = (await r.json()) as { error: { code: string; message: string } };
    expect(j.error.code).toBe("INTERNAL");
    // Tanpa membocorkan pesan mentah (tanpa PII).
    expect(j.error.message).not.toContain("boom");
  });
});

function reqWithCookie(sealed?: string): NextRequest {
  const headers = new Headers();
  if (sealed) headers.set("cookie", `${SESSION_COOKIE}=${sealed}`);
  return new NextRequest("http://localhost/api/x", { headers });
}

describe("auth session 6.4", () => {
  it("seal lalu unseal roundtrip", async () => {
    const sealed = await sealSession({
      userId: "u1",
      role: "anggota",
      anggotaId: "a1",
    });
    const s = await getSession(reqWithCookie(sealed));
    expect(s).toMatchObject({ userId: "u1", role: "anggota", anggotaId: "a1" });
  });

  it("getSession null tanpa cookie", async () => {
    expect(await getSession(reqWithCookie())).toBeNull();
  });

  it("requireRole 401 tanpa sesi", async () => {
    await expect(requireRole(reqWithCookie(), "anggota")).rejects.toMatchObject(
      { code: "UNAUTHORIZED" },
    );
  });

  it("requireRole 403 saat role salah", async () => {
    const sealed = await sealSession({ userId: "u", role: "pemerintah" });
    await expect(
      requireRole(reqWithCookie(sealed), "anggota"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("rateLimit AC-SEC-07", () => {
  beforeEach(() => resetRateLimit());

  it("permintaan ke-6 dalam window diblokir", () => {
    const ip = "9.9.9.9";
    for (let i = 0; i < 5; i++) {
      expect(tooManyLogins(ip)).toBe(false);
      recordLoginFailure(ip);
    }
    expect(tooManyLogins(ip)).toBe(true);
  });

  it("window terpisah per IP", () => {
    recordLoginFailure("1.1.1.1");
    recordLoginFailure("1.1.1.1");
    expect(tooManyLogins("2.2.2.2")).toBe(false);
  });

  it("clientIp mengambil IP pertama x-forwarded-for", () => {
    const req = new NextRequest("http://localhost/", {
      headers: { "x-forwarded-for": "5.6.7.8, 9.9.9.9" },
    });
    expect(clientIp(req)).toBe("5.6.7.8");
  });
});
