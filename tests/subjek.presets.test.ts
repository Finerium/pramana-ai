/**
 * AC-SUBJ-04: empat preset konsol subjek menghasilkan payload yang PERSIS
 * memicu tipologi 6.6 agennya masing-masing, diuji terhadap aturan deteksi
 * deterministik (bukan LLM). Milik verification workflow.
 */
import { describe, expect, it } from "vitest";
import {
  presetKas,
  presetKonflik,
  presetPecah,
  presetPlafon,
} from "../components/subjek/logic";
import { buildSeedData } from "../scripts/seed/data";

const seed = buildSeedData();

describe("preset konsol memicu tipologi 6.6 (AC-SUBJ-04)", () => {
  it("konflik kepentingan: vendorAlamat sama dengan alamat bendahara seed dan nilai >= Rp10.000.000 (merah)", () => {
    const f = presetKonflik();
    const bendahara = seed.pengurus.find((p) => p.jabatan === "bendahara");
    expect(bendahara).toBeDefined();
    expect(f.vendorAlamat).toBe(bendahara?.alamat);
    expect(f.jenis).toBe("pembelian");
    expect(Number(f.jumlah)).toBeGreaterThanOrEqual(10_000_000);
  });

  it("anomali transaksi: pembelian di bawah ambang Rp5.000.000 ke vendor pola pemecahan seed (CV Sumber Rejeki)", () => {
    const f = presetPecah();
    expect(f.jenis).toBe("pembelian");
    expect(Number(f.jumlah)).toBeLessThan(5_000_000);
    const an3 = seed.transaksi.filter(
      (t) => t.vendorNama === "CV Sumber Rejeki",
    );
    expect(an3.length).toBeGreaterThanOrEqual(3);
    expect(f.vendorNama).toBe("CV Sumber Rejeki");
    for (const t of an3) expect(t.jumlah).toBeLessThan(5_000_000);
  });

  it("kesehatan finansial: pengeluaran operasional besar menekan kas (arah keluar, nominal signifikan terhadap saldo 36.5jt)", () => {
    const f = presetKas();
    expect(f.jenis).toBe("operasional");
    const jumlah = Number(f.jumlah);
    expect(jumlah).toBeGreaterThanOrEqual(20_000_000);
    const saldoJun = 36_500_000;
    expect(jumlah / saldoJun).toBeGreaterThan(0.5);
  });

  it("kepatuhan proses: pinjaman melampaui plafon Rp10.000.000 dengan dokumen belum lengkap", () => {
    const f = presetPlafon([{ value: "ang-x", label: "Anggota X" }]);
    expect(Number(f.pokok)).toBeGreaterThan(10_000_000);
    expect(f.dokumenLengkap).toBe(false);
    expect(f.disetujuiOleh).toBe("bendahara");
  });
});
