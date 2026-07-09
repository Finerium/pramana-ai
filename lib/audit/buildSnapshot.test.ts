import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createDb, type Created } from "../../db/client";
import { seed } from "../../scripts/seed/index";
import { buildSnapshot } from "../../lib/audit/buildSnapshot";

let created: Created;

beforeAll(async () => {
  created = createDb("file:./.vitest-snap.db");
  await seed(created.db);
});
afterAll(() => created.client.close());

describe("buildSnapshot 6.9", () => {
  it("saldoKasPerBulan direkonstruksi walk-backward", async () => {
    const { snapshot, periode } = await buildSnapshot(
      created.db,
      "kop-sukamaju",
    );
    expect(periode).toBe("2026-06");
    const saldos = snapshot.koperasi.saldoKasPerBulan;
    expect(saldos.map((s) => s.periode)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
    expect(saldos.map((s) => s.saldo)).toEqual([
      52_000_000, 54_500_000, 56_000_000, 58_000_000, 47_500_000, 36_500_000,
    ]);
  });

  it("transaksi hanya periode berjalan dan berbatas 500", async () => {
    const { snapshot } = await buildSnapshot(created.db, "kop-sukamaju");
    expect(snapshot.transaksi.length).toBeLessThanOrEqual(500);
    expect(snapshot.transaksi.length).toBeGreaterThan(0);
    expect(
      snapshot.transaksi.every((t) => t.tanggal.startsWith("2026-06")),
    ).toBe(true);
  });

  it("pinjaman aktif, pengurus, plafon", async () => {
    const { snapshot } = await buildSnapshot(created.db, "kop-sukamaju");
    expect(snapshot.pinjaman.every((p) => p.sisa > 0)).toBe(true);
    expect(snapshot.plafonPerAnggota).toBe(10_000_000);
    expect(snapshot.pengurus.length).toBe(5);
    expect(
      snapshot.pinjaman.find((p) => p.id === "pj-an5")?.disetujuiOleh,
    ).toBe("Budi Santoso");
  });
});
