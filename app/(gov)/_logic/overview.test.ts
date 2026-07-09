import { describe, it, expect } from "vitest";
import {
  sortKoperasi,
  filterKoperasi,
  nextSort,
  DEFAULT_DIR,
  kpiSubPersen,
  tersebarCount,
  deriveDistribusi,
} from "./overview";
import type { KoperasiRow } from "./overview";

const DATA: KoperasiRow[] = [
  {
    id: "kop-sukamaju",
    nama: "Koperasi Desa Merah Putih Sukamaju",
    provinsi: "Jawa Barat",
    verdictWarna: "merah",
    temuanCount: 6,
  },
  {
    id: "kop-lembahsari",
    nama: "Koperasi Desa Merah Putih Lembah Sari",
    provinsi: "Sumatera Barat",
    verdictWarna: "merah",
    temuanCount: 4,
  },
  {
    id: "kop-cempakawangi",
    nama: "Koperasi Desa Merah Putih Cempaka Wangi",
    provinsi: "Lampung",
    verdictWarna: "kuning",
    temuanCount: 2,
  },
  {
    id: "kop-wanasaba",
    nama: "Koperasi Desa Merah Putih Wanasaba",
    provinsi: "Nusa Tenggara Barat",
    verdictWarna: "kuning",
    temuanCount: 2,
  },
  {
    id: "kop-batulicin",
    nama: "Koperasi Desa Merah Putih Batulicin",
    provinsi: "Kalimantan Selatan",
    verdictWarna: "kuning",
    temuanCount: 1,
  },
  {
    id: "kop-airmolek",
    nama: "Koperasi Desa Merah Putih Air Molek",
    provinsi: "Riau",
    verdictWarna: "kuning",
    temuanCount: 1,
  },
  {
    id: "kop-mekarsari",
    nama: "Koperasi Desa Merah Putih Mekarsari",
    provinsi: "Jawa Barat",
    verdictWarna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-tirtayasa",
    nama: "Koperasi Desa Merah Putih Tirtayasa",
    provinsi: "Banten",
    verdictWarna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-argomulyo",
    nama: "Koperasi Desa Merah Putih Argomulyo",
    provinsi: "Jawa Tengah",
    verdictWarna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-sidodadi",
    nama: "Koperasi Desa Merah Putih Sidodadi",
    provinsi: "Jawa Timur",
    verdictWarna: "hijau",
    temuanCount: 1,
  },
  {
    id: "kop-karangasem",
    nama: "Koperasi Desa Merah Putih Karangasem",
    provinsi: "Bali",
    verdictWarna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-mattirowalie",
    nama: "Koperasi Desa Merah Putih Mattiro Walie",
    provinsi: "Sulawesi Selatan",
    verdictWarna: "hijau",
    temuanCount: 0,
  },
];

describe("sortKoperasi default verdict desc (tie: temuan desc, lalu nama asc)", () => {
  it("menghasilkan urutan bundle", () => {
    const out = sortKoperasi(DATA, "verdictWarna", "desc").map((r) => r.id);
    expect(out).toEqual([
      "kop-sukamaju",
      "kop-lembahsari",
      "kop-cempakawangi",
      "kop-wanasaba",
      "kop-airmolek",
      "kop-batulicin",
      "kop-sidodadi",
      "kop-argomulyo",
      "kop-karangasem",
      "kop-mattirowalie",
      "kop-mekarsari",
      "kop-tirtayasa",
    ]);
  });
  it("temuan asc menempatkan hijau nol paling atas", () => {
    const out = sortKoperasi(DATA, "temuanCount", "asc").map(
      (r) => r.temuanCount,
    );
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBe(6);
  });
  it("nama asc urut alfabet Indonesia", () => {
    const out = sortKoperasi(DATA, "nama", "asc").map((r) => r.id);
    expect(out[0]).toBe("kop-airmolek");
  });
});

describe("nextSort toggling", () => {
  it("kolom sama membalik arah", () => {
    expect(
      nextSort({ key: "verdictWarna", dir: "desc" }, "verdictWarna"),
    ).toEqual({ key: "verdictWarna", dir: "asc" });
  });
  it("kolom baru memakai arah default", () => {
    expect(nextSort({ key: "verdictWarna", dir: "desc" }, "nama")).toEqual({
      key: "nama",
      dir: DEFAULT_DIR.nama,
    });
    expect(nextSort({ key: "nama", dir: "asc" }, "temuanCount")).toEqual({
      key: "temuanCount",
      dir: "desc",
    });
  });
});

describe("filterKoperasi nama + provinsi", () => {
  it("cocok provinsi", () => {
    expect(filterKoperasi(DATA, "jawa").length).toBe(4);
  });
  it("cocok nama, tanpa peduli huruf besar", () => {
    expect(filterKoperasi(DATA, "SUKAMAJU").map((r) => r.id)).toEqual([
      "kop-sukamaju",
    ]);
  });
  it("kosong mengembalikan semua", () => {
    expect(filterKoperasi(DATA, "  ").length).toBe(12);
  });
});

describe("derivasi KPI", () => {
  it("persen dibulatkan", () => {
    expect(kpiSubPersen(6, 12)).toBe("50 persen dari total");
    expect(kpiSubPersen(4, 12)).toBe("33 persen dari total");
    expect(kpiSubPersen(2, 12)).toBe("17 persen dari total");
  });
  it("temuan terbuka tersebar di 7 koperasi", () => {
    expect(tersebarCount(DATA)).toBe(7);
  });
  it("distribusi hijau/kuning/merah dengan persen", () => {
    const d = deriveDistribusi({
      jumlahKoperasi: 12,
      hijau: 6,
      kuning: 4,
      merah: 2,
      temuanTerbuka: 17,
    });
    expect(d.map((s) => s.warna)).toEqual(["hijau", "kuning", "merah"]);
    expect(d.map((s) => s.count)).toEqual([6, 4, 2]);
    expect(d.map((s) => s.persen)).toEqual([50, 33, 17]);
  });
});
