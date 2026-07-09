#!/usr/bin/env node
// scripts/check-register.mjs — register 6.8 scanner (Node only, no deps).
// Detects em dash (U+2014), emoji, and the sapaan "kamu" (whole word, case-insensitive)
// in the product copy set. Member surfaces additionally reject accounting jargon
// (likuiditas / rasio / aktiva / NPL / CAR). Default mode scans the product set;
// `--file <path>` scans one file (used by the PostToolUse hook).
// Exit 0 clean, exit 1 with a listed findings report. AC-COPY-01/02/03.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

const EM_DASH = "—";
// Major emoji blocks only; generic arrows/math symbols are excluded on purpose so
// legitimate prose and code never false-positive.
const EMOJI_SRC =
  "[\\u{1F300}-\\u{1FAFF}\\u{1F1E6}-\\u{1F1FF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{FE0F}]";
// ponytail: likuiditas/rasio/aktiva match case-insensitive; NPL/CAR are uppercase
// acronyms matched case-sensitive so Indonesian words (cara, mencari) never trip.
const JARGON_CI_SRC = "\\b(?:likuiditas|rasio|aktiva)\\b";
const JARGON_CS_SRC = "\\b(?:NPL|CAR)\\b";

// The registerGuard denylist config legitimately contains forbidden vocabulary; never flag it.
const SKIP_FILES = ["lib/registerGuard.ts"];

export function isMemberSurface(path) {
  const p = String(path).replace(/\\/g, "/");
  return (
    p.endsWith("lib/copy/member.ts") ||
    p.includes("app/(member)/") ||
    p.includes("components/member/")
  );
}

export function shouldSkip(path) {
  const p = String(path).replace(/\\/g, "/");
  return SKIP_FILES.some((s) => p.endsWith(s));
}

export function scanText(path, text) {
  const findings = [];
  const member = isMemberSurface(path);
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const push = (kind, match, col) =>
      findings.push({ path, line: i + 1, col: col + 1, kind, match });

    let idx = line.indexOf(EM_DASH);
    while (idx !== -1) {
      push("em-dash", EM_DASH, idx);
      idx = line.indexOf(EM_DASH, idx + 1);
    }
    for (const m of line.matchAll(new RegExp(EMOJI_SRC, "gu")))
      push("emoji", m[0], m.index);
    for (const m of line.matchAll(/\bkamu\b/gi)) push("kamu", m[0], m.index);
    if (member) {
      for (const m of line.matchAll(new RegExp(JARGON_CI_SRC, "gi")))
        push("jargon", m[0], m.index);
      for (const m of line.matchAll(new RegExp(JARGON_CS_SRC, "g")))
        push("jargon", m[0], m.index);
    }
  }
  return findings;
}

function isBinary(buf) {
  const n = Math.min(buf.length, 8000);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

export function scanFile(path) {
  if (!existsSync(path) || shouldSkip(path)) return [];
  const buf = readFileSync(path);
  if (isBinary(buf)) return [];
  return scanText(path, buf.toString("utf8"));
}

const EXT_CODE = /\.(ts|tsx)$/;
const EXT_MD = /\.md$/;

function walk(dir, match, out) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(full, match, out);
    else if (match.test(entry.name)) out.push(full);
  }
}

export function defaultFiles(root = ".") {
  const out = [];
  walk(`${root}/lib/copy`, EXT_CODE, out);
  walk(`${root}/lib/prompts`, EXT_CODE, out);
  walk(`${root}/scripts/fixtures`, EXT_CODE, out);
  // P2-05: sapu juga komponen dan halaman supaya string inline yang lolos
  // dari copy terpusat tetap tertangkap register 6.8.
  walk(`${root}/components`, EXT_CODE, out);
  walk(`${root}/app`, EXT_CODE, out);
  if (existsSync(`${root}/README.md`)) out.push(`${root}/README.md`);
  walk(`${root}/deck`, EXT_MD, out);
  walk(`${root}/deliverables`, EXT_MD, out);
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const fi = args.indexOf("--file");
  let files;
  if (fi !== -1) {
    const f = args[fi + 1];
    if (!f) {
      console.error("check-register: --file membutuhkan path");
      process.exit(1);
    }
    files = [f];
  } else {
    files = defaultFiles(".");
  }
  const all = [];
  for (const f of files) all.push(...scanFile(f));
  if (all.length === 0) {
    console.log(
      `check-register: LULUS (${files.length} berkas diperiksa, 0 pelanggaran register 6.8).`,
    );
    process.exit(0);
  }
  console.error(`check-register: ${all.length} pelanggaran register 6.8`);
  for (const v of all) {
    console.error(
      `  ${v.path}:${v.line}:${v.col}  ${v.kind}  ${JSON.stringify(v.match)}`,
    );
  }
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
