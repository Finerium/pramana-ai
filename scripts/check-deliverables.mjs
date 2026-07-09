#!/usr/bin/env node
// scripts/check-deliverables.mjs — machine-gate deliverables (AC-DEL-01/02/04/06,
// AC-REP-02). Node murni, tanpa dependency. Exit 0 bersih, exit 1 dengan daftar.
// Pola konsisten dengan check-readme/check-keputusan (checker terpisah menjadi
// bukti gate; sepadan dengan "vitest" yang disebut AC-DEL-06).

import { readFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Akun seeded beku (6.7); harus identik di tabel kredensial README (AC-DEL-06).
const AKUN = [
  ["juri.anggota@pramana.id", "PramanaJuri2026"],
  ["juri.pemerintah@pramana.id", "PramanaJuri2026"],
  ["sari@pramana.id", "SariSukamaju1"],
  ["bendahara@pramana.id", "PramanaBendahara2026"],
];

const DECK_H1_WAJIB = [
  "# Pramana AI",
  "# Masalah",
  "# Wawasan",
  "# Solusi",
  "# Cara Kerja",
  "# Demo: Temuan",
  "# Demo: Dari Temuan ke Rapat",
  "# Dua Antarmuka",
  "# Dampak",
  "# Implementasi",
  "# Penggunaan AI (Disclosure)",
  "# Penutup",
];

function read(p) {
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

export function checkDeliverables() {
  const err = [];

  // AC-DEL-06: kredensial juri README === seed.
  const readme = read("README.md");
  if (!readme) err.push("README.md tidak ada");
  else
    for (const [email, sandi] of AKUN) {
      if (!readme.includes(email)) err.push(`README tanpa email ${email}`);
      if (!readme.includes(sandi)) err.push(`README tanpa sandi untuk ${email}`);
    }

  // AC-DEL-01: DISCLOSURE-AI.
  const disc = read("DISCLOSURE-AI.md");
  if (!disc) err.push("DISCLOSURE-AI.md tidak ada");
  else {
    if (!disc.includes("Gagasan inti Pramana AI"))
      err.push("DISCLOSURE tanpa pernyataan gagasan inti");
    if (!/Claude Opus 4\.8/.test(disc))
      err.push("DISCLOSURE tanpa Claude Opus 4.8");
    if (!/MiniMax/.test(disc)) err.push("DISCLOSURE tanpa MiniMax");
    if (!disc.includes(".crown/ai-usage.md"))
      err.push("DISCLOSURE tanpa rujukan ai-usage.md");
  }

  // AC-DEL-02: deck 10-12 slide + H1 wajib.
  const deck = read("deck/pramana-deck.md");
  if (!deck) err.push("deck/pramana-deck.md tidak ada");
  else {
    const h1 = deck.split(/\r?\n/).filter((l) => /^# \S/.test(l));
    if (h1.length < 10 || h1.length > 12)
      err.push(`deck ${h1.length} slide (wajib 10-12)`);
    for (const w of DECK_H1_WAJIB)
      if (!h1.includes(w)) err.push(`deck tanpa slide "${w}"`);
  }

  // AC-DEL-04: video 7 scene, total <= 180 detik.
  const video = read("deliverables/video-script.md");
  if (!video) err.push("deliverables/video-script.md tidak ada");
  else {
    const durasi = [...video.matchAll(/^\|\s*\d+\s*\|\s*(\d+)\s*detik/gm)].map(
      (m) => Number(m[1]),
    );
    if (durasi.length !== 7)
      err.push(`video ${durasi.length} scene (wajib 7)`);
    const total = durasi.reduce((a, b) => a + b, 0);
    if (total > 180) err.push(`video total ${total} detik (maks 180)`);
  }

  // AC-DEL-05: submission-checklist ada.
  if (!existsSync("deliverables/submission-checklist.md"))
    err.push("submission-checklist.md tidak ada");

  // AC-REP-02: repo hygiene.
  const lic = read("LICENSE");
  if (!lic || !lic.includes("MIT License")) err.push("LICENSE MIT tidak ada");
  if (!existsSync("CHANGELOG.md")) err.push("CHANGELOG.md tidak ada");
  if (!existsSync("CONTRIBUTING.md")) err.push("CONTRIBUTING.md tidak ada");
  const pkg = read("package.json");
  if (!pkg || JSON.parse(pkg).version !== "1.0.0")
    err.push("versi package.json bukan 1.0.0");

  return err;
}

function main() {
  const err = checkDeliverables();
  if (err.length === 0) {
    console.log(
      "check-deliverables: LULUS (kredensial juri, disclosure, deck, video, repo hygiene).",
    );
    process.exit(0);
  }
  console.error("check-deliverables: GAGAL");
  for (const e of err) console.error("  " + e);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
