/**
 * SEMUA string UI Pramana terpusat di modul ini (ADR-11): inti 6.15 verbatim
 * plus label per surface. Register 6.8 berlaku mutlak: sapaan "Anda", tanpa
 * em dash, tanpa emoji, layar anggota tanpa jargon akuntansi.
 * File per surface (landing, member, gov, subjek) dimiliki unit build
 * masing-masing; file index ini milik orchestrator.
 */
import type { AgentId, VerdictColor } from "@/lib/contracts";

/** Copy kanonik state kunci, blueprint 6.15, kunci dan nilai VERBATIM. */
export const COPY = {
  "banner.cache":
    "Menampilkan hasil pemeriksaan tersimpan. Pemeriksaan langsung sedang tidak tersedia.",
  "banner.live": "Hasil pemeriksaan langsung, baru saja dijalankan.",
  "verdict.cta": "Lihat yang perlu Anda tahu",
  "notif.template":
    "Pengawas menemukan {n} hal yang sebaiknya Anda tanyakan kepada pengurus bulan ini.",
  "temuan.tambah": "Tambahkan ke pertanyaan rapat",
  "temuan.tambah.ok":
    "Tersimpan. Pertanyaan ini akan dibawa ke Rapat Anggota Tahunan.",
  "temuan.kenapa": "Kenapa ini penting?",
  "onboard.nik.err":
    "Nomor NIK harus 16 angka. Silakan periksa kembali KTP Anda.",
  "onboard.sukses":
    "Selamat, Anda resmi menjadi anggota. Ini kartu anggota digital Anda.",
  "login.err": "Email atau kata sandi belum tepat. Silakan coba lagi.",
  "audit.jalan":
    "Pengawas sedang memeriksa. Ini memerlukan waktu kurang dari dua menit.",
  "audit.gagal":
    "Pemeriksaan langsung gagal. Menampilkan hasil tersimpan terakhir.",
  "kosong.temuan":
    "Tidak ada hal yang perlu ditanyakan bulan ini. Koperasi Anda dalam keadaan baik.",
  "verifikasi.label": "Verifikasi simulasi untuk purwarupa",
  "landing.tagline": "Pengawas koperasi desa, di genggaman setiap anggota",
  "landing.cta.anggota": "Masuk sebagai Anggota",
  "landing.cta.pemerintah": "Masuk sebagai Pemerintah",
  "landing.cta.daftar": "Daftar sebagai Anggota Baru",
  "landing.juri": "Akun uji untuk juri tersedia di halaman masuk.",
  "subjek.header": "Simulasi Pembukuan Koperasi",
  "subjek.sub": "Sumber data yang diawasi Pramana",
  "subjek.sync": "Tersinkron ke Pramana",
  "subjek.simpan": "Catat Transaksi",
  "subjek.pinjaman.simpan": "Setujui Pinjaman",
  "subjek.preset.konflik": "Isi contoh: pembelian ke alamat pengurus",
  "subjek.preset.pecah": "Isi contoh: pemecahan pembelian",
  "subjek.preset.plafon": "Isi contoh: pinjaman lampaui plafon tanpa dokumen",
  "subjek.preset.kas": "Isi contoh: pengeluaran menguras kas",
  "subjek.login.hint": "Akun uji bendahara",
} as const;

export type CopyKey = keyof typeof COPY;

/**
 * Label verdict per warna (F-06, .crown/notes.md): teks prototype diadopsi
 * sebagai copy final; konsisten chip mobile dan landing.
 */
export const VERDICT_LABELS: Record<VerdictColor, string> = {
  hijau: "Sehat",
  kuning: "Perlu Perhatian",
  merah: "Perlu Dijelaskan",
};

/**
 * Ringkasan beranda untuk run live non-fixture (F-07): dipakai hanya bila
 * adjudikator tidak memberi ringkasan valid untuk verdict kuning/hijau;
 * ringkasan merah Sukamaju tetap fixture beku 6.7.
 */
export const RINGKASAN_LIVE: Record<Exclude<VerdictColor, "merah">, string> = {
  kuning:
    "Ada beberapa hal yang sebaiknya Anda tanyakan kepada pengurus bulan ini.",
  hijau: "Tidak ada hal yang perlu dikhawatirkan pada pemeriksaan bulan ini.",
};

/**
 * Label agen per surface (F-03): register anggota memakai sebutan "Pemeriksa"
 * yang manusiawi; register pemerintah memakai istilah forensik. Keduanya
 * disengaja dan dipertahankan.
 */
export const AGENT_LABELS: Record<
  "anggota" | "pemerintah",
  Record<AgentId, string>
> = {
  anggota: {
    konflik_kepentingan: "Pemeriksa Konflik Kepentingan",
    anomali_transaksi: "Pemeriksa Transaksi",
    kesehatan_finansial: "Pemeriksa Kesehatan Keuangan",
    kepatuhan_proses: "Pemeriksa Kepatuhan",
  },
  pemerintah: {
    konflik_kepentingan: "Konflik Kepentingan",
    anomali_transaksi: "Anomali Transaksi",
    kesehatan_finansial: "Kesehatan Finansial",
    kepatuhan_proses: "Kepatuhan Proses",
  },
};

export * from "./landing";
export * from "./member";
export * from "./gov";
export * from "./subjek";
