/**
 * scripts/audit-bench.ts (pnpm audit:bench) - AC references live-audit latency.
 * When LLM_API_KEY is absent the live path cannot run, so it prints HUMAN-GATED and
 * exits 0. With a key present it triggers 5 live audit runs as the juri-pemerintah,
 * records their durations, computes p95, and writes audit-bench.json.
 */
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { percentile } from "./perf-api";

/** Live bench needs a real model key; without one the run is deferred to a human. */
export function isHumanGated(env: Record<string, string | undefined>): boolean {
  return !env.LLM_API_KEY;
}

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const CRED = {
  email: "juri.pemerintah@pramana.id",
  password: "PramanaJuri2026",
};
const KOP = "kop-sukamaju";
const RUNS = 5;

async function login(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(CRED),
      redirect: "manual",
    });
    const raw = res.headers.get("set-cookie");
    return raw ? (raw.split(";")[0] ?? null) : null;
  } catch {
    return null;
  }
}

async function timedAuditRun(cookie: string): Promise<number | null> {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE}/api/gov/audit/run`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ koperasiId: KOP }),
    });
    if (!res.ok) return null;
    // ponytail: runAudit responds when the audit finishes (synchronous server-side),
    // so the POST round-trip is the audit duration. If the endpoint turns async with a
    // job id, add a poll loop here on the returned run id before stopping the clock.
    await res.text();
    return performance.now() - start;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  if (isHumanGated(process.env)) {
    console.log(
      "HUMAN-GATED: LLM_API_KEY tidak tersedia. Lewati audit-bench live (exit 0).",
    );
    process.exit(0);
  }
  const cookie = await login();
  if (!cookie) {
    console.error(
      `audit-bench: login pemerintah gagal atau server ${BASE} tidak tersedia.`,
    );
    process.exit(2);
  }
  const durations: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const d = await timedAuditRun(cookie);
    if (d !== null) durations.push(d);
  }
  const report = {
    baseUrl: BASE,
    generatedAt: new Date().toISOString(),
    runs: RUNS,
    ok: durations.length,
    p50: percentile(durations, 0.5),
    p95: percentile(durations, 0.95),
    durations,
  };
  writeFileSync("audit-bench.json", JSON.stringify(report, null, 2));
  console.log(
    `audit-bench: ${durations.length}/${RUNS} run live sukses, ` +
      `p95=${report.p95 === null ? "n/a" : report.p95.toFixed(0) + "ms"}. Laporan: audit-bench.json`,
  );
  process.exit(durations.length ? 0 : 1);
}

const invokedDirectly =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((e) => {
    console.error("audit-bench: gagal", e);
    process.exit(2);
  });
}
