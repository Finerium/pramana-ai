/**
 * scripts/perf-api.ts (pnpm perf:api) - AC-PERF-01.
 * Fires RUNS requests at each key non-LLM endpoint against a running production
 * build, computes p50/p95 per endpoint, writes perf-api.json, and reports the
 * 500 ms p95 threshold. Sessions are established once per role (login is not part
 * of the measured loop). Resilient: a down server or missing endpoint is recorded
 * as errors rather than throwing.
 */
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

type Role = "anggota" | "pemerintah";

interface Endpoint {
  name: string;
  method: "GET" | "POST";
  path: string;
  role: Role;
}

export const ENDPOINTS: Endpoint[] = [
  {
    name: "member.summary",
    method: "GET",
    path: "/api/member/summary",
    role: "anggota",
  },
  {
    name: "member.verdict",
    method: "GET",
    path: "/api/member/verdict",
    role: "anggota",
  },
  {
    name: "member.findings",
    method: "GET",
    path: "/api/member/findings",
    role: "anggota",
  },
  {
    name: "member.flow",
    method: "GET",
    path: "/api/member/flow",
    role: "anggota",
  },
  {
    name: "member.voice",
    method: "GET",
    path: "/api/member/voice",
    role: "anggota",
  },
  {
    name: "gov.overview",
    method: "GET",
    path: "/api/gov/overview",
    role: "pemerintah",
  },
  {
    name: "gov.koperasi",
    method: "GET",
    path: "/api/gov/koperasi/kop-sukamaju",
    role: "pemerintah",
  },
];

const CREDS: Record<Role, { email: string; password: string }> = {
  anggota: { email: "juri.anggota@pramana.id", password: "PramanaJuri2026" },
  pemerintah: {
    email: "juri.pemerintah@pramana.id",
    password: "PramanaJuri2026",
  },
};

/** Nearest-rank percentile. p in [0,1]. Returns null for an empty sample. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil(p * sorted.length);
  const idx = Math.min(Math.max(rank, 1), sorted.length) - 1;
  return sorted[idx] ?? null;
}

export interface Stats {
  n: number;
  p50: number | null;
  p95: number | null;
  min: number | null;
  max: number | null;
}

export function computeStats(durations: number[]): Stats {
  return {
    n: durations.length,
    p50: percentile(durations, 0.5),
    p95: percentile(durations, 0.95),
    min: durations.length ? Math.min(...durations) : null,
    max: durations.length ? Math.max(...durations) : null,
  };
}

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const RUNS = 50;
const THRESHOLD_MS = 500;

async function login(email: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      redirect: "manual",
    });
    const raw = res.headers.get("set-cookie");
    if (!raw) return null;
    return raw.split(";")[0] ?? null;
  } catch {
    return null;
  }
}

async function timeRequest(
  method: string,
  path: string,
  cookie: string | null,
): Promise<{ ms: number; ok: boolean }> {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: cookie ? { cookie } : undefined,
    });
    return { ms: performance.now() - start, ok: res.ok };
  } catch {
    return { ms: performance.now() - start, ok: false };
  }
}

async function main(): Promise<void> {
  const cookies: Record<Role, string | null> = {
    anggota: await login(CREDS.anggota.email, CREDS.anggota.password),
    pemerintah: await login(CREDS.pemerintah.email, CREDS.pemerintah.password),
  };

  const rows = [];
  for (const ep of ENDPOINTS) {
    const durations: number[] = [];
    let errors = 0;
    for (let i = 0; i < RUNS; i++) {
      const r = await timeRequest(ep.method, ep.path, cookies[ep.role]);
      if (r.ok) durations.push(r.ms);
      else errors++;
    }
    const stats = computeStats(durations);
    const within = stats.p95 !== null && stats.p95 <= THRESHOLD_MS;
    rows.push({
      name: ep.name,
      method: ep.method,
      path: ep.path,
      ...stats,
      errors,
      withinThreshold: within,
    });
  }

  const allWithin = rows.every((r) => r.withinThreshold && r.errors === 0);
  const report = {
    baseUrl: BASE,
    generatedAt: new Date().toISOString(),
    runsPerEndpoint: RUNS,
    threshold_p95_ms: THRESHOLD_MS,
    allWithinThreshold: allWithin,
    endpoints: rows,
  };
  writeFileSync("perf-api.json", JSON.stringify(report, null, 2));

  for (const r of rows) {
    const p95 = r.p95 === null ? "n/a" : `${r.p95.toFixed(1)}ms`;
    const flag = r.withinThreshold && r.errors === 0 ? "OK" : "LEWAT";
    console.log(
      `  ${flag}  ${r.name}  p50=${r.p50 === null ? "n/a" : r.p50.toFixed(1) + "ms"} p95=${p95} err=${r.errors}`,
    );
  }
  console.log(
    allWithin
      ? `perf-api: LULUS (semua p95 <= ${THRESHOLD_MS}ms). Laporan: perf-api.json`
      : `perf-api: p95 melebihi ${THRESHOLD_MS}ms atau ada error. Laporan: perf-api.json`,
  );
  process.exit(allWithin ? 0 : 1);
}

const invokedDirectly =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((e) => {
    console.error("perf-api: gagal", e);
    process.exit(1);
  });
}
