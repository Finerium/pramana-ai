import { describe, it, expect } from "vitest";
import {
  parseTokens,
  compareTokens,
  documentedTokenNames,
  evaluateSurface,
  buildReport,
} from "./check-tokens.mjs";

describe("check-tokens parseTokens", () => {
  it("collects every distinct name/value pair and ignores comments", () => {
    const css =
      ":root{ --a: 1px; --b: oklch(0.5 0 0);} .dark{ --a: 2px; } /* --c: nope; */";
    const m = parseTokens(css);
    expect([...m.get("--a")]).toEqual(["1px", "2px"]);
    expect([...m.get("--b")]).toEqual(["oklch(0.5 0 0)"]);
    expect(m.has("--c")).toBe(false);
  });

  it("normalizes internal whitespace in values", () => {
    const m = parseTokens("--x:    oklch(0.9    0.1   75)  ;");
    expect([...m.get("--x")]).toEqual(["oklch(0.9 0.1 75)"]);
  });
});

describe("check-tokens compareTokens", () => {
  const bundle = parseTokens(":root{--a:1px;} .dark{--a:2px;}");

  it("flags a bundle value the app file lacks", () => {
    const app = parseTokens(":root{--a:1px;}");
    const drift = compareTokens(bundle, app, new Set());
    expect(drift.some((d) => d.name === "--a" && d.value === "2px")).toBe(true);
  });

  it("marks drift as documented when the variable is named in deviations", () => {
    const app = parseTokens(":root{--a:1px;}");
    const drift = compareTokens(bundle, app, new Set(["--a"]));
    expect(drift.every((d) => d.documented)).toBe(true);
  });

  it("returns no drift when app carries every bundle value", () => {
    const app = parseTokens(":root{--a:1px;} .dark{--a:2px;}");
    expect(compareTokens(bundle, app, new Set())).toEqual([]);
  });
});

describe("check-tokens documentedTokenNames", () => {
  it("extracts token names from the deviations ledger text", () => {
    const s = documentedTokenNames(
      "- D-05 token --latar & --aksen-kuat disesuaikan",
    );
    expect(s.has("--latar")).toBe(true);
    expect(s.has("--aksen-kuat")).toBe(true);
  });
});

describe("check-tokens evaluateSurface", () => {
  it("parses the real mobile bundle and reports missing app file without crashing", () => {
    const r = evaluateSurface(
      "design-handoff/mobile/handoff/tokens.css",
      "styles/tokens/does-not-exist.css",
      new Set(),
    );
    expect(r.status).toBe("missing-app");
    expect(r.tokenCount).toBeGreaterThan(10);
  });
});

describe("check-tokens buildReport strict mode (AC-UI-01, no vacuous pass)", () => {
  // Fixture surface: bundle nyata, file app sengaja tidak ada, supaya test
  // deterministik terhadap state repo (wave berapa pun).
  const FIXTURE: Array<[string, string, string]> = [
    [
      "mobile",
      "design-handoff/mobile/handoff/tokens.css",
      "styles/tokens/__fixture-does-not-exist__.css",
    ],
  ];

  it("tolerates an unwritten app token file by default (pre-port stays green)", () => {
    const r = buildReport(false, FIXTURE);
    expect(r.missingApp).toBe(true);
    expect(r.ok).toBe(true);
  });

  it("fails when a surface still lacks its app token file under --strict", () => {
    const r = buildReport(true, FIXTURE);
    expect(r.strict).toBe(true);
    expect(r.missingApp).toBe(true);
    expect(r.ok).toBe(false);
  });
});
