#!/usr/bin/env node
// scripts/check-readme.mjs — README.md structure checker (blueprint 6.12, AC-REP-01).
// Asserts the required sections appear, in order, plus the Demo section carries a
// DEMO_MODE note and a juri credential table. Runs even when README is incomplete
// or absent and reports what is missing (used by Gate 8). Exit 0 ok, exit 1 otherwise.

import { readFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

// null matcher = the title (first level-1 heading). Order in this list is the
// required document order (6.12).
const REQUIRED = [
  ["judul", null],
  ["ringkasan produk", /ringkasan|ikhtisar|tentang|overview/i],
  ["demo", /\bdemo\b/i],
  ["arsitektur", /arsitektur|architecture/i],
  ["menjalankan secara lokal", /menjalankan|instalasi|install|jalankan|lokal/i],
  ["perintah", /perintah|command|skrip|script/i],
  ["keputusan teknis", /keputusan teknis/i],
  ["disclosure ai", /disclosure|penggunaan ai|pernyataan penggunaan ai/i],
  ["lisensi", /lisensi|license/i],
];

export function parseHeadings(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2] });
  }
  return out;
}

export function checkReadme(text, exists = true) {
  const r = { ok: false, fileMissing: !exists, missing: [], order: [], content: [] };
  const heads = parseHeadings(text);
  const firstH1 = heads.findIndex((h) => h.level === 1);

  const positions = [];
  for (const [id, re] of REQUIRED) {
    const idx = re === null ? firstH1 : heads.findIndex((h) => re.test(h.text));
    if (idx === -1) r.missing.push(id);
    else positions.push([id, idx]);
  }

  let last = -1;
  for (const [id, idx] of positions) {
    if (idx < last) r.order.push(id);
    else last = idx;
  }

  if (exists) {
    if (!/DEMO_MODE/.test(text)) r.content.push("catatan DEMO_MODE");
    if (!/juri\.\w+@pramana\.id/i.test(text)) r.content.push("tabel kredensial juri");
  }

  r.ok = exists && r.missing.length === 0 && r.order.length === 0 && r.content.length === 0;
  return r;
}

function main() {
  const path = "README.md";
  const exists = existsSync(path);
  const text = exists ? readFileSync(path, "utf8") : "";
  const r = checkReadme(text, exists);
  if (r.ok) {
    console.log("check-readme: LULUS (semua section 6.12 ada dan berurutan).");
    process.exit(0);
  }
  if (r.fileMissing) console.error("check-readme: README.md belum ada.");
  if (r.missing.length) console.error(`  section kurang: ${r.missing.join(", ")}`);
  if (r.order.length) console.error(`  section di luar urutan: ${r.order.join(", ")}`);
  if (r.content.length) console.error(`  konten kurang: ${r.content.join(", ")}`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
