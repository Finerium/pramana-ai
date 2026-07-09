#!/usr/bin/env node
// scripts/scan-secrets.mjs — secret scanner (Node only, no deps). AC-SEC-04.
// Scans the working tree (excluding vendored/build/oracle dirs) AND `git log -p`
// history for API-key patterns. Never prints matched values, only file + line +
// pattern label, so a .env value is never echoed. Exit 0 clean, exit 1 with hits.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// Patterns require a realistic suffix length so benign words (task-, disk-, risky)
// never match a bare "sk-".
const PATTERNS = [
  { label: "openai-key", re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { label: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{20,}\b/ },
  { label: "github-token", re: /\bgh[pousr]_[0-9A-Za-z]{20,}\b/ },
  { label: "slack-token", re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/ },
  { label: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "private-key", re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/ },
  { label: "jwt", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "design-handoff",
  "coverage",
]);

/** Pure: returns [{line, pattern}] for a text blob. Never returns the matched value. */
export function findSecrets(text) {
  const hits = [];
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const { label, re } of PATTERNS) {
      if (re.test(lines[i])) hits.push({ line: i + 1, pattern: label });
    }
  }
  return hits;
}

function isBinary(buf) {
  const n = Math.min(buf.length, 8000);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(`${dir}/${entry.name}`, out);
    } else if (entry.isFile()) {
      out.push(`${dir}/${entry.name}`);
    }
  }
}

function scanWorkingTree(root = ".") {
  const files = [];
  walk(root, files);
  const findings = [];
  for (const f of files) {
    let buf;
    try {
      if (statSync(f).size > 2_000_000) continue;
      buf = readFileSync(f);
    } catch {
      continue;
    }
    if (isBinary(buf)) continue;
    for (const h of findSecrets(buf.toString("utf8"))) {
      findings.push({ where: f.replace(/^\.\//, ""), line: h.line, pattern: h.pattern });
    }
  }
  return findings;
}

function scanHistory() {
  let out;
  try {
    out = execSync("git log -p --no-color", { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  } catch {
    return []; // no git or empty history: nothing to scan
  }
  const findings = [];
  let commit = "(unknown)";
  const lines = out.split(/\r?\n/);
  for (const line of lines) {
    const m = /^commit ([0-9a-f]{7,40})/.exec(line);
    if (m) {
      commit = m[1].slice(0, 10);
      continue;
    }
    for (const { label, re } of PATTERNS) {
      if (re.test(line)) findings.push({ where: `history@${commit}`, pattern: label });
    }
  }
  return findings;
}

function main() {
  const tree = scanWorkingTree(".");
  const history = scanHistory();
  const all = [...tree, ...history];
  if (all.length === 0) {
    console.log("scan-secrets: LULUS (0 pola rahasia di working tree dan git log -p).");
    process.exit(0);
  }
  console.error(`scan-secrets: ${all.length} pola rahasia terdeteksi (nilai TIDAK dicetak)`);
  for (const f of all) {
    console.error(`  ${f.where}${f.line ? ":" + f.line : ""}  ${f.pattern}`);
  }
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
