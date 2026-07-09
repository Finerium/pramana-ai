import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  parseEnvKeys,
  findProcessEnvKeys,
  checkEnvExample,
  collectSources,
  REQUIRED,
} from "./check-env-example.mjs";

// Build usage strings at runtime so this source file never contains a literal
// full env access that the scanner would flag against itself.
const dot = (k: string) => "process.env." + k;
const bracket = (k: string) => 'process.env["' + k + '"]';

const canon = readFileSync(".env.example", "utf8");

describe("check-env-example", () => {
  it("the canonical .env.example holds exactly the 6.16 key set", () => {
    expect(new Set(parseEnvKeys(canon))).toEqual(new Set(REQUIRED));
  });

  it("reports an extra key not in the frozen set", () => {
    const r = checkEnvExample(canon + "\nEXTRA_KEY=1", []);
    expect(r.extra).toContain("EXTRA_KEY");
    expect(r.ok).toBe(false);
  });

  it("reports a missing required key", () => {
    const partial = REQUIRED.slice(1)
      .map((k) => k + "=")
      .join("\n");
    const r = checkEnvExample(partial, []);
    expect(r.missing).toEqual([REQUIRED[0]]);
  });

  it("extracts both dot and bracket process.env accesses", () => {
    const text =
      "const a = " + dot("FOO") + "; const b = " + bracket("BAR") + ";";
    const keys = findProcessEnvKeys(text);
    expect(keys).toContain("FOO");
    expect(keys).toContain("BAR");
  });

  it("allows the runtime allowlist but flags anything else", () => {
    const okSrc = [{ file: "x.ts", text: "const e = " + dot("NODE_ENV") }];
    const badSrc = [{ file: "y.ts", text: "const e = " + dot("STRIPE_KEY") }];
    expect(checkEnvExample(canon, okSrc).badUsages).toEqual([]);
    expect(checkEnvExample(canon, badSrc).badUsages).toEqual([
      { file: "y.ts", key: "STRIPE_KEY" },
    ]);
  });

  it("passes against the real repo source tree as it stands now", () => {
    const sources = collectSources(["app", "lib", "db", "scripts"]);
    const r = checkEnvExample(canon, sources);
    expect(r.missing).toEqual([]);
    expect(r.extra).toEqual([]);
    expect(r.badUsages).toEqual([]);
    expect(r.ok).toBe(true);
  });
});
