import { describe, it, expect, vi, afterEach } from "vitest";
import { isHumanGated, timedAuditRun } from "./audit-bench";

describe("audit-bench isHumanGated", () => {
  it("is gated when LLM_API_KEY is absent or empty", () => {
    expect(isHumanGated({})).toBe(true);
    expect(isHumanGated({ LLM_API_KEY: "" })).toBe(true);
  });

  it("is not gated when a key is present", () => {
    expect(isHumanGated({ LLM_API_KEY: "sk-live-abc" })).toBe(false);
  });
});

function jsonRes(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Fast polling so the async loop (blueprint 6.3/6.4) runs in milliseconds.
const FAST = { pollIntervalMs: 1, pollTimeoutMs: 2000 };

describe("audit-bench timedAuditRun (async 202 + poll, blueprint 6.3 L257-258 / 6.4 L338)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("enqueues via 202 then polls status, timing to the 'selesai' terminal", async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn((input: string | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.endsWith("/api/gov/audit/run")) {
        return Promise.resolve(
          jsonRes(202, {
            ok: true,
            data: { auditRunId: "run-1", status: "berjalan" },
          }),
        );
      }
      const polls = calls.filter((c) =>
        c.includes("/api/audit/run-1/status"),
      ).length;
      return Promise.resolve(
        jsonRes(200, {
          ok: true,
          data: { status: polls >= 2 ? "selesai" : "berjalan" },
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const ms = await timedAuditRun("pramana_session=x", FAST);

    expect(ms).not.toBeNull();
    expect(ms).toBeGreaterThanOrEqual(0);
    expect(calls[0]).toBe("POST http://localhost:3000/api/gov/audit/run");
    // The clock must NOT stop on the 202 alone: at least two status polls ran.
    expect(
      calls.filter((c) => c.includes("/api/audit/run-1/status")).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("returns null when the run reports 'gagal_langsung'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL) => {
        const url = String(input);
        if (url.endsWith("/api/gov/audit/run")) {
          return Promise.resolve(
            jsonRes(202, {
              ok: true,
              data: { auditRunId: "run-2", status: "berjalan" },
            }),
          );
        }
        return Promise.resolve(
          jsonRes(200, { ok: true, data: { status: "gagal_langsung" } }),
        );
      }),
    );
    expect(await timedAuditRun("c", FAST)).toBeNull();
  });

  it("gives up and returns null when 'selesai' never arrives before timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL) => {
        const url = String(input);
        if (url.endsWith("/api/gov/audit/run")) {
          return Promise.resolve(
            jsonRes(202, {
              ok: true,
              data: { auditRunId: "run-3", status: "berjalan" },
            }),
          );
        }
        return Promise.resolve(
          jsonRes(200, { ok: true, data: { status: "berjalan" } }),
        );
      }),
    );
    expect(
      await timedAuditRun("c", { pollIntervalMs: 1, pollTimeoutMs: 25 }),
    ).toBeNull();
  });

  it("returns null when the enqueue POST is not accepted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonRes(500, { ok: false }))),
    );
    expect(await timedAuditRun("c", FAST)).toBeNull();
  });
});
