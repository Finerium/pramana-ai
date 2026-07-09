import { describe, it, expect } from "vitest";
import {
  formatRp,
  formatTanggal,
  deriveArah,
  hitungSaldoBaru,
  isRawAmountValid,
  validateTransaksi,
  validatePinjaman,
  firstPresetAnggota,
  emptyTransaksi,
  emptyPinjaman,
  presetKonflik,
  presetPecah,
  presetKas,
  presetPlafon,
  SEED_ANGGOTA,
  SEED_SALDO,
} from "../../components/subjek/logic";

describe("formatRp", () => {
  it("groups thousands with dots and a space after Rp", () => {
    expect(formatRp(15000000)).toBe("Rp 15.000.000");
    expect(formatRp(4900000)).toBe("Rp 4.900.000");
    expect(formatRp(0)).toBe("Rp 0");
    expect(formatRp(50000)).toBe("Rp 50.000");
  });
});

describe("formatTanggal", () => {
  it("renders id-ID short month", () => {
    expect(formatTanggal("2026-06-14")).toBe("14 Jun 2026");
    expect(formatTanggal("2026-07-20")).toBe("20 Jul 2026");
    expect(formatTanggal("")).toBe("");
  });
});

describe("deriveArah", () => {
  it("masuk for setoran/penjualan/angsuran, keluar otherwise", () => {
    for (const j of ["setoran_simpanan", "penjualan", "angsuran"])
      expect(deriveArah(j)).toBe("masuk");
    for (const j of [
      "pembelian",
      "penarikan_simpanan",
      "pencairan_pinjaman",
      "gaji",
      "operasional",
    ])
      expect(deriveArah(j)).toBe("keluar");
  });
});

describe("hitungSaldoBaru", () => {
  it("subtracts outflow, adds inflow", () => {
    expect(hitungSaldoBaru(36500000, "operasional", 20000000)).toBe(16500000);
    expect(hitungSaldoBaru(36500000, "penjualan", 1000000)).toBe(37500000);
  });
});

describe("isRawAmountValid", () => {
  it("only positive integer digit strings", () => {
    expect(isRawAmountValid("15000000")).toBe(true);
    expect(isRawAmountValid("0")).toBe(false);
    expect(isRawAmountValid("")).toBe(false);
    expect(isRawAmountValid("12a")).toBe(false);
  });
});

describe("validateTransaksi", () => {
  it("flags all required incl vendor+unit for pembelian", () => {
    const e = validateTransaksi(emptyTransaksi());
    expect(Object.keys(e).sort()).toEqual(
      [
        "deskripsi",
        "jumlah",
        "tanggal",
        "unitUsaha",
        "vendorAlamat",
        "vendorNama",
      ].sort(),
    );
  });
  it("no vendor/unit requirement for non-pembelian", () => {
    const e = validateTransaksi({
      ...emptyTransaksi(),
      jenis: "operasional",
      jumlah: "20000000",
      tanggal: "2026-06-25",
      deskripsi: "x",
    });
    expect(e).toEqual({});
  });
  it("valid pembelian clears", () => {
    expect(validateTransaksi(presetKonflik())).toEqual({});
  });
});

describe("validatePinjaman", () => {
  it("flags five required on empty", () => {
    const e = validatePinjaman(emptyPinjaman());
    expect(Object.keys(e).sort()).toEqual(
      ["anggota", "cicilan", "disetujuiOleh", "jatuhTempo", "pokok"].sort(),
    );
  });
  it("valid clears", () => {
    expect(validatePinjaman(presetPlafon(SEED_ANGGOTA))).toEqual({});
  });
});

describe("firstPresetAnggota", () => {
  it("skips placeholder, Sari and juri, picks first plain member", () => {
    expect(firstPresetAnggota(SEED_ANGGOTA)).toBe("ang-g01");
  });
  it("returns empty when none qualify", () => {
    expect(
      firstPresetAnggota([
        { value: "", label: "Pilih" },
        { value: "ang-sari", label: "Sari Rahayu" },
        { value: "ang-juri", label: "Rahmat Hidayat" },
      ]),
    ).toBe("");
  });
});

describe("presets carry the exact frozen payloads", () => {
  it("konflik", () => {
    const p = presetKonflik();
    expect(p).toMatchObject({
      jenis: "pembelian",
      jumlah: "15000000",
      tanggal: "2026-06-14",
      unitUsaha: "sembako",
      vendorNama: "Toko Berkah",
      vendorAlamat: "Jl. Melati No. 12, Sukamaju",
    });
  });
  it("pecah", () => {
    const p = presetPecah();
    expect(p).toMatchObject({
      jenis: "pembelian",
      jumlah: "4900000",
      tanggal: "2026-06-22",
      vendorNama: "CV Sumber Rejeki",
    });
  });
  it("kas", () => {
    const p = presetKas();
    expect(p).toMatchObject({
      jenis: "operasional",
      jumlah: "20000000",
      tanggal: "2026-06-25",
    });
  });
  it("plafon (deterministic anggota, over-plafon, docs incomplete)", () => {
    const p = presetPlafon(SEED_ANGGOTA);
    expect(p).toMatchObject({
      anggota: "ang-g01",
      pokok: "12000000",
      cicilan: "1000000",
      jatuhTempo: "2026-07-20",
      disetujuiOleh: "bendahara",
      dokumenLengkap: false,
    });
  });
});

describe("SEED", () => {
  it("saldo awal Sukamaju", () => {
    expect(SEED_SALDO).toBe(36500000);
  });
});
