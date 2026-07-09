/**
 * scripts/audit-bench.ts (pnpm audit:bench) - AC references live-audit latency.
 * When LLM_API_KEY is absent the live path cannot run, so it prints HUMAN-GATED and
 * exits 0. With a key present it triggers 5 live audit runs as the juri-pemerintah,
 * measures each run's END-TO-END latency, computes p95, and writes audit-bench.json.
 *
 * Contract 6.3 (L257-258) makes /api/gov/audit/run asynchronous: it answers
 * 202 {auditRunId, status:"berjalan"} and the client polls GET /api/audit/:id/status
 * (every 2s, giving up at 120s per 6.4 L338). A run's latency is therefore measured
 * from the enqueue POST until the status endpoint reports "selesai" - NOT the 202
 * round-trip, which would only time the enqueue and report a misleadingly small p95.
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

// Contract 6.4 (L338): client polls status every 2s and gives up after 120s.
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000;

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

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Reads the {ok,data} success envelope (6.3) or a bare body; both accepted. */
function unwrap(body: unknown): Record<string, unknown> {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (o.data && typeof o.data === "object") {
      return o.data as Record<string, unknown>;
    }
    return o;
  }
  return {};
}

/**
 * Enqueues one live audit (POST -> 202) then polls the status endpoint until the
 * server reports "selesai", returning the end-to-end duration in ms. Returns null on
 * a rejected enqueue, a "gagal_langsung" run, or a poll timeout. pollIntervalMs /
 * pollTimeoutMs are injectable so unit tests drive the loop without real waits;
 * production uses the 2s / 120s contract defaults.
 */
export async function timedAuditRun(
  cookie: string,
  opts: { pollIntervalMs?: number; pollTimeoutMs?: number } = {},
): Promise<number | null> {
  const pollIntervalMs = opts.pollIntervalMs ?? POLL_INTERVAL_MS;
  const pollTimeoutMs = opts.pollTimeoutMs ?? POLL_TIMEOUT_MS;
  const start = performance.now();
  try {
    // 6.3 L257: enqueue only; the 202 body carries the auditRunId to poll.
    const res = await fetch(`${BASE}/api/gov/audit/run`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ koperasiId: KOP }),
    });
    if (!res.ok) return null;
    const postBody: unknown = await res.json();
    const auditRunId = unwrap(postBody).auditRunId;
    if (typeof auditRunId !== "string") return null;

    // 6.3 L258 / 6.4 L338: poll status until "selesai" (terminal ok) before
    // stopping the clock; "gagal_langsung" and timeout are non-results (null).
    const deadline = start + pollTimeoutMs;
    while (performance.now() < deadline) {
      await sleep(pollIntervalMs);
      const sres = await fetch(
        `${BASE}/api/audit/${encodeURIComponent(auditRunId)}/status`,
        { headers: { cookie } },
      );
      if (!sres.ok) continue;
      const statusBody: unknown = await sres.json();
      const status = unwrap(statusBody).status;
      if (status === "selesai") return performance.now() - start;
      if (status === "gagal_langsung") return null;
    }
    return null;
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
