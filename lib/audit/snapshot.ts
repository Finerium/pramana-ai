/**
 * Bentuk snapshot koperasi (payload prompt 6.9) + fungsi murni pembentuk
 * payload per agen. TANPA query DB: perakit snapshot dari DB adalah milik wave
 * 2 (auth + API). Modul ini hanya mendefinisikan tipe dan serialisasi payload.
 */
import type { SubjekTransaksiInput } from "@/lib/contracts";

/** Baris transaksi dalam snapshot (subset kolom 6.2 yang dibaca agen). */
export interface SnapshotTransaksi {
  id: string;
  tanggal: string; // "2026-06-14"
  jenis: SubjekTransaksiInput["jenis"] | "shu";
  arah: "masuk" | "keluar";
  jumlah: number;
  deskripsi: string;
  vendorNama?: string | null;
  vendorAlamat?: string | null;
  unitUsahaId?: string | null;
  anggotaId?: string | null;
}

/** Baris pinjaman dalam snapshot. */
export interface SnapshotPinjaman {
  id: string;
  anggotaId: string;
  pokok: number;
  sisa: number;
  cicilanBulanan: number;
  jatuhTempoBerikut: string;
  disetujuiPada: string;
  disetujuiOleh: string; // id/nama pengurus penyetuju
  dokumenLengkap: boolean;
}

/** Payload snapshot 6.9 yang diterima setiap prompt forensik. */
export interface KoperasiSnapshot {
  koperasi: {
    nama: string;
    saldoKasPerBulan: Array<{ periode: string; saldo: number }>;
  };
  pengurus: Array<{ nama: string; jabatan: string; alamat: string }>;
  transaksi: SnapshotTransaksi[]; // maks 500 baris periode berjalan
  pinjaman: SnapshotPinjaman[];
  plafonPerAnggota: number;
  statusRat: string; // "belum" | "terlaksana" (+ konteks periode)
}

/** Batas baris transaksi pada payload forensik (6.9). */
export const MAKS_TRANSAKSI = 500;

/**
 * Payload user forensik (6.9): JSON snapshot penuh, transaksi dibatasi 500
 * baris agar prompt tidak membengkak. Sama untuk keempat agen forensik.
 */
export function buildForensicPayload(s: KoperasiSnapshot): string {
  const payload: KoperasiSnapshot = {
    ...s,
    transaksi: s.transaksi.slice(0, MAKS_TRANSAKSI),
  };
  return JSON.stringify(payload);
}

/** Ringkasan snapshot untuk adjudikator (bukan payload penuh). */
export function buildRingkasanSnapshot(s: KoperasiSnapshot): {
  koperasi: string;
  saldoKasPerBulan: Array<{ periode: string; saldo: number }>;
  statusRat: string;
  plafonPerAnggota: number;
  jumlahTransaksi: number;
  jumlahPinjaman: number;
} {
  return {
    koperasi: s.koperasi.nama,
    saldoKasPerBulan: s.koperasi.saldoKasPerBulan,
    statusRat: s.statusRat,
    plafonPerAnggota: s.plafonPerAnggota,
    jumlahTransaksi: s.transaksi.length,
    jumlahPinjaman: s.pinjaman.length,
  };
}
