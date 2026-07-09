import { describe, it, expect } from "vitest";
// @ts-expect-error - .ts script exports helpers; main() is guarded so no network runs on import
import { percentile, computeStats, ENDPOINTS } from "./perf-api.ts";

describe("perf-api percentile", () => {
  const vals = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  it("computes nearest-rank p50 and p95", () => {
    expect(percentile(vals, 0.5)).toBe(50);
    expect(percentile(vals, 0.95)).toBe(100);
  });

  it("returns null for an empty sample", () => {
    expect(percentile([], 0.95)).toBe(null);
  });

  it("handles a single sample", () => {
    expect(percentile([42], 0.95)).toBe(42);
  });

  it("is order-independent (sorts internally)", () => {
    expect(percentile([100, 10, 50, 30], 0.5)).toBe(
      percentile([10, 30, 50, 100], 0.5),
    );
  });
});

describe("perf-api computeStats", () => {
  it("summarizes a durations sample", () => {
    const s = computeStats([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(s.n).toBe(10);
    expect(s.p50).toBe(50);
    expect(s.p95).toBe(100);
  });
});

describe("perf-api ENDPOINTS", () => {
  it("covers the key non-LLM endpoints", () => {
    const paths = ENDPOINTS.map((e: { path: string }) => e.path);
    for (const p of [
      "/api/member/summary",
      "/api/member/verdict",
      "/api/member/findings",
      "/api/member/flow?periode=2026-06",
      "/api/member/voice",
      "/api/gov/overview",
      "/api/gov/koperasi/kop-sukamaju",
    ]) {
      expect(paths).toContain(p);
    }
  });

  it("fires member.flow with the required periode query (blueprint 6.3)", () => {
    const flow = ENDPOINTS.find(
      (e: { name: string; path: string }) => e.name === "member.flow",
    );
    expect(flow?.path).toBe("/api/member/flow?periode=2026-06");
  });
});
