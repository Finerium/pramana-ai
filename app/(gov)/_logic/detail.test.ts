import { describe, it, expect } from "vitest";
import { sortTemuanBySeverity, buktiLabel, trenCells, formatProfilLokasi } from "./detail";
import type { Severity } from "@/lib/contracts";

type T = { id: string; severity: Severity };
const TEMUAN: T[] = [
  { id: "an4", severity: "kuning" },
  { id: "an1", severity: "merah" },
  { id: "an6", severity: "info" },
  { id: "an2", severity: "kuning" },
  { id: "an5", severity: "kuning" },
  { id: "an3", severity: "kuning" },
];

describe("sortTemuanBySeverity tingkat tertinggi dulu, tie id asc", () => {
  it("merah, kuning (an2..an5), info", () => {
    expect(sortTemuanBySeverity(TEMUAN).map((t) => t.id)).toEqual([
      "an1", "an2", "an3", "an4", "an5", "an6",
    ]);
  });
});

describe("buktiLabel dari EvidenceRef (jenis dominan, id distinct)", () => {
  it("AN-1 dua ref transaksi id sama = 1 transaksi", () => {
    expect(buktiLabel([
      { jenis: "transaksi", id: "trx-an1", label: "" },
      { jenis: "transaksi", id: "trx-an1", label: "" },
    ])).toBe("1 transaksi");
  });
  it("AN-4 rasio, AN-6 jadwal", () => {
    expect(buktiLabel([{ jenis: "rasio", id: "kas", label: "" }])).toBe("1 rasio");
    expect(buktiLabel([{ jenis: "jadwal", id: "rat-2026", label: "" }])).toBe("1 jadwal");
  });
  it("AN-2 jenis dominan pinjaman (ref pertama)", () => {
    expect(buktiLabel([
      { jenis: "pinjaman", id: "pj-an2-1", label: "" },
      { jenis: "rasio", id: "baseline", label: "" },
    ])).toBe("1 pinjaman");
  });
});

describe("trenCells memetakan periode ke bulan Indonesia", () => {
  it("Jan..Jun bentuk + label", () => {
    const cells = trenCells([
      { periode: "2026-01", warna: "hijau" },
      { periode: "2026-05", warna: "kuning" },
      { periode: "2026-06", warna: "merah" },
    ]);
    expect(cells.map((c) => c.bulan)).toEqual(["Jan", "Mei", "Jun"]);
    expect(cells.map((c) => c.bulanPenuh)).toEqual(["Januari", "Mei", "Juni"]);
    expect(cells[2].bentuk.label).toBe("Merah");
  });
});

describe("formatProfilLokasi", () => {
  it("menyusun baris lokasi", () => {
    expect(formatProfilLokasi({
      id: "kop-sukamaju", nama: "x", desa: "Sukamaju", kabupaten: "Kabupaten Bandung",
      provinsi: "Jawa Barat", jumlahAnggota: 30, unitUsaha: [],
    })).toBe("Desa Sukamaju, Kabupaten Bandung, Jawa Barat · 30 anggota · kop-sukamaju");
  });
});
