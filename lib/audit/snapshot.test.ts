import { describe, expect, it } from "vitest";
import {
  buildForensicPayload,
  buildRingkasanSnapshot,
  MAKS_TRANSAKSI,
  type KoperasiSnapshot,
} from "./snapshot";

function snap(nTransaksi: number): KoperasiSnapshot {
  return {
    koperasi: {
      nama: "Koperasi Uji",
      saldoKasPerBulan: [{ periode: "2026-06", saldo: 100 }],
    },
    pengurus: [{ nama: "Budi", jabatan: "bendahara", alamat: "Jl. Melati" }],
    transaksi: Array.from({ length: nTransaksi }, (_, i) => ({
      id: `t${i}`,
      tanggal: "2026-06-01",
      jenis: "pembelian" as const,
      arah: "keluar" as const,
      jumlah: 1000,
      deskripsi: "x",
    })),
    pinjaman: [],
    plafonPerAnggota: 10_000_000,
    statusRat: "belum",
  };
}

describe("snapshot payload (6.9)", () => {
  it("membatasi transaksi payload forensik ke 500 baris", () => {
    const payload = JSON.parse(buildForensicPayload(snap(700)));
    expect(payload.transaksi).toHaveLength(MAKS_TRANSAKSI);
    expect(payload.koperasi.nama).toBe("Koperasi Uji");
  });

  it("ringkasan snapshot memuat hitungan, bukan seluruh baris", () => {
    const r = buildRingkasanSnapshot(snap(700));
    expect(r.jumlahTransaksi).toBe(700);
    expect(r).not.toHaveProperty("transaksi");
  });
});
