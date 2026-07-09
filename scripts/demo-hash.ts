/**
 * scripts/demo-hash.ts (pnpm demo:hash) - AC-DEMO-01.
 * Logs in as the juri-anggota, fetches /api/member/verdict and /api/member/findings,
 * hashes the combined response, does it a second time, and compares the two sha256
 * digests. Prints both hashes and SAMA/BEDA. Tolerant of a server or endpoint that
 * is not up yet: it prints a clear message and exits non-zero instead of crashing.
 */
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

/** sha256 hex over the joined parts. Pure and deterministic. */
export function combinedHash(parts: string[]): string {
  return createHash("sha256").update(parts.join("\n")).digest("hex");
}

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const CRED = { email: "juri.anggota@pramana.id", password: "PramanaJuri2026" };
const PATHS = ["/api/member/verdict", "/api/member/findings"];

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

async function snapshot(cookie: string): Promise<string> {
  const parts: string[] = [];
  for (const p of PATHS) {
    const res = await fetch(`${BASE}${p}`, { headers: { cookie } });
    if (!res.ok) throw new Error(`${p} -> HTTP ${res.status}`);
    parts.push(await res.text());
  }
  return combinedHash(parts);
}

async function main(): Promise<void> {
  const cookie = await login();
  if (!cookie) {
    console.error(
      `demo-hash: login juri gagal atau server ${BASE} tidak tersedia. ` +
        "Jalankan pnpm dev + pnpm seed lalu ulangi. Tidak bisa memverifikasi determinisme.",
    );
    process.exit(2);
  }
  let a: string;
  let b: string;
  try {
    a = await snapshot(cookie);
    b = await snapshot(cookie);
  } catch (e) {
    console.error(
      `demo-hash: endpoint belum tersedia (${String(e)}). Jalankan pnpm seed dulu.`,
    );
    process.exit(2);
    return;
  }
  console.log(`hash-1: ${a}`);
  console.log(`hash-2: ${b}`);
  const same = a === b;
  console.log(
    same
      ? "SAMA: verdict + findings byte-identik antar-run (AC-DEMO-01 lulus)."
      : "BEDA: keluaran tidak deterministik (AC-DEMO-01 GAGAL).",
  );
  process.exit(same ? 0 : 1);
}

const invokedDirectly =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((e) => {
    console.error("demo-hash: gagal", e);
    process.exit(2);
  });
}
