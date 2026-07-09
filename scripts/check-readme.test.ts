import { describe, it, expect } from "vitest";
// @ts-expect-error - .mjs checker, no type declarations by design
import { checkReadme } from "./check-readme.mjs";

const good = [
  "# Pramana AI",
  "![badge](x)",
  "## Ringkasan produk",
  "Pengawas koperasi.",
  "## Demo",
  "URL demo. Mode DEMO_MODE aktif.",
  "| Peran | Email | Kata sandi |",
  "| --- | --- | --- |",
  "| Anggota | juri.anggota@pramana.id | PramanaJuri2026 |",
  "## Arsitektur",
  "Empat agen plus adjudikator.",
  "## Menjalankan secara lokal",
  "pnpm i, pnpm seed, pnpm dev",
  "## Perintah",
  "pnpm test",
  "## Keputusan teknis",
  "Lihat docs.",
  "## Disclosure AI",
  "Lihat DISCLOSURE-AI.md",
  "## Lisensi",
  "MIT",
].join("\n");

describe("check-readme", () => {
  it("passes a complete README in section order", () => {
    const r = checkReadme(good, true);
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.order).toEqual([]);
  });

  it("reports a missing section", () => {
    const r = checkReadme(
      good.replace("## Arsitektur", "## Bagan Sistem"),
      true,
    );
    expect(r.missing).toContain("arsitektur");
    expect(r.ok).toBe(false);
  });

  it("reports sections that are out of order", () => {
    const swapped = good.replace(
      "## Ringkasan produk",
      "## Lisensi sisip\n## Ringkasan produk",
    );
    const r = checkReadme(swapped, true);
    expect(r.order.length).toBeGreaterThan(0);
  });

  it("flags a missing DEMO_MODE note and juri credential table", () => {
    const bare = "# Pramana AI\n## Demo\nhanya teks";
    const r = checkReadme(bare, true);
    expect(r.content).toContain("catatan DEMO_MODE");
    expect(r.content).toContain("tabel kredensial juri");
  });

  it("does not crash when the file is absent", () => {
    const r = checkReadme("", false);
    expect(r.fileMissing).toBe(true);
    expect(r.ok).toBe(false);
    expect(r.missing.length).toBeGreaterThan(0);
  });
});
