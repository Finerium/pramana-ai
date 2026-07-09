import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { checkKeputusan } from "./check-keputusan.mjs";

const good = [
  "# Keputusan Teknis",
  "## Bahasa dan Runtime",
  "Alternatif yang dipertimbangkan: Python. Ditolak.",
  "## Kerangka dan Arsitektur",
  "Alternatif yang dipertimbangkan: Remix. Ditolak.",
  "## Database dan Desain Skema",
  "Alternatif yang dipertimbangkan: Postgres. Ditolak.",
  "## Model AI dan Arsitektur Agen",
  "Alternatif yang dipertimbangkan: multi-provider. Ditolak.",
  "## Keamanan",
  "Alternatif yang dipertimbangkan: NextAuth. Ditolak.",
  "## Mode Demo dan Keandalan",
  "Alternatif yang dipertimbangkan: selalu live. Ditolak.",
].join("\n");

describe("check-keputusan", () => {
  it("passes a document with all six headings and rejected alternatives", () => {
    const r = checkKeputusan(good);
    expect(r.ok).toBe(true);
  });

  it("reports a missing mandatory heading", () => {
    const r = checkKeputusan(good.replace("## Keamanan", "## Lainnya"));
    expect(r.missingHeadings).toContain("Keamanan");
    expect(r.ok).toBe(false);
  });

  it("reports a section without a rejected-alternatives discussion", () => {
    const r = checkKeputusan(
      good.replace(
        "Alternatif yang dipertimbangkan: NextAuth. Ditolak.",
        "Cukup aman.",
      ),
    );
    expect(r.missingAlternatives).toContain("Keamanan");
    expect(r.ok).toBe(false);
  });

  it("passes the real docs/keputusan-teknis.md as it stands now", () => {
    const text = readFileSync("docs/keputusan-teknis.md", "utf8");
    const r = checkKeputusan(text);
    expect(r.missingHeadings).toEqual([]);
    expect(r.missingAlternatives).toEqual([]);
    expect(r.ok).toBe(true);
  });
});
