#!/usr/bin/env node
// scripts/check-keputusan.mjs — docs/keputusan-teknis.md checker (AC-DEL-08).
// Asserts the six mandatory H2 sections exist and each one discusses rejected
// alternatives (kata "alternatif" + "ditolak"/"penolakan"). Exit 0 ok, exit 1 otherwise.

import { readFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const REQUIRED = [
  "Bahasa dan Runtime",
  "Kerangka dan Arsitektur",
  "Database dan Desain Skema",
  "Model AI dan Arsitektur Agen",
  "Keamanan",
  "Mode Demo dan Keandalan",
];

/** Split into H2 sections: { heading -> body text until the next H2 }. */
export function sections(text) {
  const map = new Map();
  let current = null;
  let buf = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current !== null) map.set(current, buf.join("\n"));
      current = m[1];
      buf = [];
    } else if (current !== null) {
      buf.push(line);
    }
  }
  if (current !== null) map.set(current, buf.join("\n"));
  return map;
}

export function checkKeputusan(text) {
  const secs = sections(text);
  const headings = [...secs.keys()];
  const missingHeadings = [];
  const missingAlternatives = [];

  for (const req of REQUIRED) {
    const found = headings.find((h) =>
      h.toLowerCase().includes(req.toLowerCase()),
    );
    if (!found) {
      missingHeadings.push(req);
      continue;
    }
    const body = secs.get(found) || "";
    const hasAlt = /alternatif/i.test(body);
    const hasReject = /ditolak|penolakan/i.test(body);
    if (!hasAlt || !hasReject) missingAlternatives.push(req);
  }

  return {
    ok: missingHeadings.length === 0 && missingAlternatives.length === 0,
    missingHeadings,
    missingAlternatives,
  };
}

function main() {
  const path = "docs/keputusan-teknis.md";
  if (!existsSync(path)) {
    console.error(`check-keputusan: ${path} belum ada.`);
    process.exit(1);
  }
  const r = checkKeputusan(readFileSync(path, "utf8"));
  if (r.ok) {
    console.log(
      "check-keputusan: LULUS (6 heading wajib + alternatif ditolak lengkap).",
    );
    process.exit(0);
  }
  if (r.missingHeadings.length)
    console.error(`  heading wajib kurang: ${r.missingHeadings.join(", ")}`);
  if (r.missingAlternatives.length)
    console.error(
      `  tanpa pembahasan alternatif yang ditolak: ${r.missingAlternatives.join(", ")}`,
    );
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
