/**
 * AC-REG-02 (properti pada seed): SETIAP temuan hasil seed, termasuk temuan
 * generik 11 koperasi ringkas, wajib punya pertanyaan_rat berbentuk kalimat
 * tanya (diakhiri "?") dan lolos registerGuard 6.5. Milik verification
 * workflow (ditulis gate evaluator).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { getDb } from "../../db/client";
import { schema } from "../../db/schema";
import { seed } from "./index";
import { periksaTemuan } from "../../lib/registerGuard";

describe("properti register temuan seed (AC-REG-02)", () => {
  beforeAll(async () => {
    await seed(getDb().db);
  });

  it("semua pertanyaan_rat diakhiri tanda tanya dan lolos registerGuard", async () => {
    const rows = await getDb().db.select().from(schema.temuan);
    expect(rows.length).toBeGreaterThan(0);
    for (const t of rows) {
      expect(t.pertanyaanRat, `temuan ${t.id} tanpa kalimat tanya`).toMatch(
        /\?$/,
      );
      const hasil = periksaTemuan({
        judul: t.judul,
        penjelasan_awam: t.penjelasanAwam,
        kenapa_penting: t.kenapaPenting,
        pertanyaan_rat: t.pertanyaanRat,
      });
      expect(
        hasil.ok,
        `temuan ${t.id} melanggar 6.5: ${"alasan" in hasil ? hasil.alasan?.join("; ") : ""}`,
      ).toBe(true);
    }
  });
});
