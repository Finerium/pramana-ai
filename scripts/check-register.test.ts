import { describe, it, expect } from "vitest";
// @ts-expect-error — .mjs checker, no type declarations by design
import { scanText, shouldSkip, isMemberSurface } from "./check-register.mjs";

type Finding = { kind: string };

describe("check-register scanText", () => {
  it("flags em dash U+2014", () => {
    const f = scanText("deck/pramana-deck.md", "Dana mengalir — tak diawasi");
    expect(f.some((x: Finding) => x.kind === "em-dash")).toBe(true);
  });

  it("flags emoji", () => {
    const f = scanText("deck/pramana-deck.md", "Koperasi sehat \u{1F600}");
    expect(f.some((x: Finding) => x.kind === "emoji")).toBe(true);
  });

  it("flags 'kamu' as a whole word, case-insensitive", () => {
    const f = scanText("lib/copy/member.ts", "Halo Kamu, apa kabar");
    expect(f.some((x: Finding) => x.kind === "kamu")).toBe(true);
  });

  it("does not flag 'kamu' inside a larger word", () => {
    const f = scanText("lib/copy/member.ts", "teknik kamuflase militer");
    expect(f.some((x: Finding) => x.kind === "kamu")).toBe(false);
  });

  it("flags jargon only on member surface", () => {
    const member = scanText("lib/copy/member.ts", "rasio likuiditas naik");
    const gov = scanText("lib/copy/gov.ts", "rasio likuiditas naik");
    expect(member.some((x: Finding) => x.kind === "jargon")).toBe(true);
    expect(gov.some((x: Finding) => x.kind === "jargon")).toBe(false);
  });

  it("flags uppercase acronyms NPL/CAR as jargon on member surface", () => {
    const f = scanText("lib/copy/member.ts", "nilai NPL dan CAR koperasi");
    expect(f.filter((x: Finding) => x.kind === "jargon").length).toBe(2);
  });

  it("is clean on compliant Indonesian copy", () => {
    const f = scanText(
      "lib/copy/member.ts",
      "Pengawas menemukan hal yang sebaiknya Anda tanyakan kepada pengurus.",
    );
    expect(f).toEqual([]);
  });

  it("skips the registerGuard denylist config file", () => {
    expect(shouldSkip("lib/registerGuard.ts")).toBe(true);
    expect(shouldSkip("lib/copy/member.ts")).toBe(false);
  });

  it("recognizes member surfaces", () => {
    expect(isMemberSurface("lib/copy/member.ts")).toBe(true);
    expect(isMemberSurface("app/(member)/beranda/page.tsx")).toBe(true);
    expect(isMemberSurface("lib/copy/gov.ts")).toBe(false);
  });
});
