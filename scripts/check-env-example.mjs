#!/usr/bin/env node
// scripts/check-env-example.mjs — .env.example completeness + config-via-env audit (AC-CFG-01).
// (1) .env.example must hold exactly the frozen 6.16 key set (no more, no less).
// (2) No process.env access in app/ lib/ db/ scripts/ outside that set + a runtime
//     allowlist. Exit 0 ok, exit 1 otherwise.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const REQUIRED = [
  "LLM_BASE_URL",
  "LLM_API_KEY",
  "LLM_MODEL",
  "DEMO_MODE",
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "SESSION_SECRET",
  "GIT_REMOTE_URL",
];

// Platform/runtime vars that legitimately come from the host, not .env.example.
export const ALLOWLIST = [
  "NODE_ENV",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "CI",
  "E2E_BASE_URL",
  "PORT",
];

export function parseEnvKeys(text) {
  const keys = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = /^\s*([A-Z][A-Z0-9_]*)\s*=/.exec(line);
    if (m) keys.push(m[1]);
  }
  return keys;
}

export function findProcessEnvKeys(text) {
  const set = new Set();
  const s = String(text);
  for (const m of s.matchAll(/process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g)) set.add(m[1]);
  for (const m of s.matchAll(/process\.env\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]/g))
    set.add(m[1]);
  return [...set];
}

const SRC_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "coverage"]);

export function collectSources(dirs) {
  const out = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(`${dir}/${entry.name}`);
      } else if (entry.isFile() && SRC_EXT.test(entry.name)) {
        try {
          out.push({ file: `${dir}/${entry.name}`, text: readFileSync(`${dir}/${entry.name}`, "utf8") });
        } catch {
          /* unreadable: skip */
        }
      }
    }
  };
  for (const d of dirs) walk(d);
  return out;
}

export function checkEnvExample(envText, sources) {
  const keys = parseEnvKeys(envText);
  const missing = REQUIRED.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !REQUIRED.includes(k));
  const allowed = new Set([...REQUIRED, ...ALLOWLIST]);

  const seen = new Set();
  const badUsages = [];
  for (const src of sources) {
    for (const key of findProcessEnvKeys(src.text)) {
      if (allowed.has(key)) continue;
      const sig = `${src.file}::${key}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      badUsages.push({ file: src.file, key });
    }
  }
  return {
    ok: missing.length === 0 && extra.length === 0 && badUsages.length === 0,
    missing,
    extra,
    badUsages,
  };
}

function main() {
  const path = ".env.example";
  if (!existsSync(path)) {
    console.error("check-env: .env.example belum ada.");
    process.exit(1);
  }
  const sources = collectSources(["app", "lib", "db", "scripts"]);
  const r = checkEnvExample(readFileSync(path, "utf8"), sources);
  if (r.ok) {
    console.log("check-env: LULUS (.env.example cocok set 6.16; tidak ada env liar).");
    process.exit(0);
  }
  if (r.missing.length) console.error(`  kunci .env.example kurang: ${r.missing.join(", ")}`);
  if (r.extra.length) console.error(`  kunci .env.example berlebih: ${r.extra.join(", ")}`);
  for (const b of r.badUsages)
    console.error(`  env di luar set 6.16 + allowlist: ${b.file} -> ${b.key}`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
