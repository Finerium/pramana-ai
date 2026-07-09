#!/usr/bin/env node
// scripts/check-tokens.mjs — design-token fidelity checker (AC-UI-01, kontrak 6.19).
// Every custom property in each design-handoff bundle must appear in the matching
// styles/tokens/<surface>.css with an identical (whitespace-normalized) value.
// Drift is only legitimate when the variable name is cited in .crown/design-deviations.md.
// Emits a JSON report to stdout. App files not yet written are reported "missing-app"
// (wave 2 fills them; the gate re-runs then) and do not fail the run.

import { readFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SURFACES = [
  ["mobile", "design-handoff/mobile/handoff/tokens.css", "styles/tokens/mobile.css"],
  ["dashboard", "design-handoff/dashboard/pramana-tokens.css", "styles/tokens/dashboard.css"],
  ["landing", "design-handoff/landing/tokens.css", "styles/tokens/landing.css"],
  ["subjek", "design-handoff/subjek/handoff/tokens.css", "styles/tokens/subjek.css"],
];
const DEVIATIONS = ".crown/design-deviations.md";

/** name -> Set(normalized value). A name can carry several values (light/.dark/@media). */
export function parseTokens(css) {
  const noComments = String(css).replace(/\/\*[\s\S]*?\*\//g, "");
  const map = new Map();
  for (const m of noComments.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    const name = `--${m[1]}`;
    const value = m[2].replace(/\s+/g, " ").trim();
    if (!map.has(name)) map.set(name, new Set());
    map.get(name).add(value);
  }
  return map;
}

/** Variable names (--foo) mentioned anywhere in the deviations ledger. */
export function documentedTokenNames(text) {
  const set = new Set();
  for (const m of String(text).matchAll(/--[\w-]+/g)) set.add(m[0]);
  return set;
}

/** Returns [{name, value, present, documented}] for every bundle value the app lacks. */
export function compareTokens(bundleMap, appMap, documented) {
  const drift = [];
  for (const [name, values] of bundleMap) {
    const appValues = appMap.get(name);
    for (const value of values) {
      if (appValues && appValues.has(value)) continue;
      drift.push({ name, value, present: !!appValues, documented: documented.has(name) });
    }
  }
  return drift;
}

export function evaluateSurface(bundlePath, appPath, documented) {
  if (!existsSync(bundlePath)) {
    return { status: "missing-bundle", bundleFile: bundlePath, appFile: appPath, tokenCount: 0 };
  }
  const bundleMap = parseTokens(readFileSync(bundlePath, "utf8"));
  const tokenCount = bundleMap.size;
  if (!existsSync(appPath)) {
    return { status: "missing-app", bundleFile: bundlePath, appFile: appPath, tokenCount };
  }
  const appMap = parseTokens(readFileSync(appPath, "utf8"));
  const drift = compareTokens(bundleMap, appMap, documented);
  const undocumented = drift.filter((d) => !d.documented);
  return {
    status: undocumented.length === 0 ? "ok" : "drift",
    bundleFile: bundlePath,
    appFile: appPath,
    tokenCount,
    driftCount: drift.length,
    undocumentedDrift: undocumented,
  };
}

export function buildReport() {
  const documented = existsSync(DEVIATIONS)
    ? documentedTokenNames(readFileSync(DEVIATIONS, "utf8"))
    : new Set();
  const surfaces = {};
  let undocumentedTotal = 0;
  let missingBundle = false;
  for (const [name, bundlePath, appPath] of SURFACES) {
    const r = evaluateSurface(bundlePath, appPath, documented);
    surfaces[name] = r;
    if (r.status === "drift") undocumentedTotal += r.undocumentedDrift.length;
    if (r.status === "missing-bundle") missingBundle = true;
  }
  return {
    ok: undocumentedTotal === 0 && !missingBundle,
    undocumentedDriftTotal: undocumentedTotal,
    surfaces,
  };
}

function main() {
  const report = buildReport();
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
