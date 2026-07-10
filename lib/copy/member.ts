/**
 * String surface anggota (beranda, uang, arus, suara, login, daftar, profil).
 * Teks diekstrak verbatim dari prototipe bundle mobile; tanpa jargon akuntansi
 * (register 6.8). Kunci 6.15 (banner.cache, verdict.cta, notif.template,
 * temuan.tambah(.ok), temuan.kenapa, onboard.*, login.err, kosong.temuan,
 * verifikasi.label) TIDAK diduplikasi di sini; komponen memakainya dari COPY.
 *
 * Catatan porting: metrik agen "Pemeriksa Kesehatan Keuangan" pada prototipe
 * berbunyi memakai kata jargon yang dilarang register 6.8 pada layar anggota.
 * Diganti dengan padanan bahasa awam ("angka keuangan diperiksa"). Ini
 * peningkatan kepatuhan register, bukan penurunan fidelity.
 */
import type { AgentId, Severity } from "@/lib/contracts";

export const MEMBER_COPY = {
  // Login
  "login.judul": "Pramana",
  "login.tagline": "Pengawas yang bekerja untuk anggota koperasi",
  "login.email": "Email",
  "login.email.ph": "nama@contoh.id",
  "login.sandi": "Kata sandi",
  "login.sandi.ph": "Kata sandi Anda",
  "login.masuk": "Masuk",
  "login.busy": "Memeriksa...",
  "login.hint.kicker": "Akun uji juri",
  "login.hint.isi": "Isi otomatis",
  "login.hint.lain": "Akun uji lain",
  "login.belum": "Belum menjadi anggota?",
  "login.daftar": "Daftar",

  // Daftar
  "daftar.kembali": "Masuk",
  "daftar.judul": "Menjadi anggota",
  "daftar.koperasi": "Koperasi Desa Merah Putih Sukamaju",
  "daftar.nama": "Nama lengkap",
  "daftar.nama.ph": "Sesuai KTP",
  "daftar.nik": "NIK, 16 angka",
  "daftar.nik.ph": "Nomor pada KTP Anda",
  "daftar.alamat": "Alamat",
  "daftar.alamat.ph": "Dusun, desa, kecamatan",
  "daftar.email": "Email",
  "daftar.email.ph": "nama@contoh.id",
  "daftar.sandi": "Kata sandi",
  "daftar.sandi.ph": "Minimal 8 karakter",
  "daftar.kirim": "Daftar dan verifikasi",
  "daftar.busy": "Memeriksa...",
  "daftar.kartu.anggota": "Anggota",
  "daftar.kartu.no": "NO. ANGGOTA",
  "daftar.kartu.masuk": "Masuk ke Beranda",

  // Beranda
  "beranda.profilAria": "Buka profil",
  "beranda.memuat": "Memuat",
  "beranda.kosong.judul":
    "Pengawas belum menyelesaikan pemeriksaan pertama untuk koperasi Anda.",
  "beranda.kosong.sub": "Hasil pemeriksaan akan muncul di sini.",
  "beranda.verdict.kicker": "PEMERIKSAAN JUNI 2026",
  "beranda.pengawas.judul": "Pengawas",
  "beranda.pengawas.sub": "Empat pemeriksa bekerja untuk Anda setiap pagi",
  "beranda.pengawas.busy": "Memeriksa...",
  "beranda.pengawas.selesai": "Selesai 07.05",
  "beranda.pengawas.tunggu": "Menunggu giliran",
  "beranda.pengawas.caraKerja": "Lihat cara Pengawas bekerja",
  "beranda.pengawas.berikutnya": "Berikutnya besok 07.00",
  "beranda.simpanan.label": "Simpanan Anda",
  "beranda.rat.judul": "Rapat Anggota Tahunan",
  "beranda.aktivitas.judul": "AKTIVITAS TERBARU",
  "beranda.aktivitas.diperiksa": "Diperiksa",
  "beranda.aktivitas.lihatArus": "Lihat Arus Dana",

  // Greeting (kata waktu dipilih di format.ts)
  "salam.pagi": "Selamat pagi",
  "salam.siang": "Selamat siang",
  "salam.sore": "Selamat sore",
  "salam.malam": "Selamat malam",

  // Temuan
  "temuan.kembali": "Beranda",
  "temuan.judul": "Yang Perlu Anda Tahu",
  "temuan.bukti": "BUKTI",
  "temuan.pertanyaan": "PERTANYAAN UNTUK RAPAT",
  "temuan.tanggapan": "TANGGAPAN PENGURUS, 24 JUNI 2026",

  // Uang Anda
  "uang.judul": "Uang Anda",
  "uang.banner.cache":
    "Menampilkan catatan tersimpan. Pembaruan sedang tidak tersedia.",
  "uang.kosong.judul": "Belum ada catatan simpanan untuk akun Anda.",
  "uang.kosong.sub": "Setoran pertama Anda akan tercatat di sini.",
  "uang.total": "Total simpanan Anda",
  "uang.pokok": "Simpanan pokok",
  "uang.wajib": "Simpanan wajib",
  "uang.sukarela": "Simpanan sukarela",
  "uang.sisa": "Sisa pinjaman",
  "uang.cicilan": "Cicilan berikutnya",
  "uang.cicilan.tempat": "Dibayar di kantor koperasi.",

  // Arus Dana
  "arus.judul": "Arus Dana",
  "arus.sub": "Ke mana uang koperasi pergi, Juni 2026",
  "arus.kosong": "Belum ada data arus dana untuk periode ini.",
  "arus.kas.judul": "Kas koperasi",
  "arus.kas.sub": "Uang tunai yang dipegang, tiga bulan terakhir",
  "arus.masuk": "Uang masuk",
  "arus.keluar": "Uang keluar",
  "arus.masuk.label": "UANG MASUK",
  "arus.keluar.label": "UANG KELUAR",
  "arus.sorotan.label": "SEDANG DIPERIKSA PENGAWAS",
  "arus.sorotan.sub": "Terkait satu temuan Pengawas",

  // Suara Anda
  "suara.judul": "Suara Anda",
  "suara.sub": "Pertanyaan anggota dan keputusan bersama",
  "suara.banner.cache":
    "Menampilkan data tersimpan. Pembaruan sedang tidak tersedia.",
  "suara.kosong": "Belum ada pertanyaan atau keputusan yang dibuka.",
  "suara.pertanyaan.label": "PERTANYAAN UNTUK RAPAT ANGGOTA TAHUNAN",
  "suara.pertanyaan.anonim":
    "Pertanyaan digabung secara anonim. Pengurus melihat jumlah penanya, bukan nama Anda.",
  "suara.pertanyaan.milikAnda": "Termasuk pertanyaan Anda",
  "suara.pertanyaan.lihat": "Lihat temuan",
  "suara.pertanyaan.kosong":
    "Belum ada pertanyaan yang dikumpulkan untuk rapat berikutnya.",
  "suara.keputusan.label": "KEPUTUSAN KOPERASI",
  "suara.keputusan.terbuka": "TERBUKA",
  "suara.keputusan.ditutup": "DITUTUP",
  "suara.vote.setuju": "Setuju",
  "suara.vote.tidak": "Tidak Setuju",
  "suara.vote.sebelum": "Hasil sementara terlihat setelah Anda memilih.",
  "suara.vote.terkunci": "Pilihan tersimpan dan tidak dapat diubah.",

  // Profil
  "profil.judul": "Profil",
  "profil.kembali": "Beranda",
  "profil.dataDiri": "DATA DIRI",
  "profil.nama": "Nama",
  "profil.nik": "NIK",
  "profil.alamat": "Alamat",
  "profil.tampilan": "TAMPILAN",
  "profil.tema": "Tema",
  "profil.tema.sistem": "Sistem",
  "profil.tema.terang": "Terang",
  "profil.tema.gelap": "Gelap",
  "profil.tema.bantu": "Sistem mengikuti pengaturan gelap terang pada HP Anda.",
  "profil.lainnya": "LAINNYA",
  "profil.notif.judul": "Kabar pemeriksaan bulanan",
  "profil.notif.sub": "Pemberitahuan saat hasil baru terbit",
  "profil.hubungi": "Hubungi Pengawas",
  "profil.keluar": "Keluar",
  "profil.versi": "Pramana purwarupa, v1.0",

  // Kalimat dinamis (template {k}, diisi di titik render lewat isi()).
  // Dipusatkan di sini (ADR-11) agar tersapu check-register register 6.8.
  "beranda.simpanan.cicilan": "Cicilan {rp} jatuh tempo {tgl}",
  "beranda.rat.agenda":
    "Belum dijadwalkan pengurus. {n} pertanyaan siap dibawa ke rapat.",
  "beranda.rat.agendaKosong":
    "Belum dijadwalkan pengurus. Belum ada pertanyaan terkumpul.",
  "beranda.pengawas.ariaPeriksa": "Sedang memeriksa",
  "uang.subjudul": "{nama}, No. Anggota {no}",
  "uang.diangsur": "Sudah diangsur {sudah} dari {total}",
  "uang.cicilan.tempo": "Jatuh tempo {tgl}",
  "arus.kas.turunChip": "Turun {persen}%",
  "arus.kas.turunTeks":
    "Kas turun {rp} sejak April. Pengawas menandai penurunan ini sebagai temuan.",
  "arus.selisih": "Kas koperasi berkurang {rp} pada bulan Juni.",
  "suara.pertanyaan.hitung": "{n} anggota menanyakan hal yang sama",
  "suara.vote.lockPilih": "Pilihan Anda: {pilihan}. {lanjut}",
  "suara.vote.lockTersimpan": "Pilihan Anda tersimpan. {lanjut}",
  "suara.hasil.hitung": "{tot} dari {total} anggota sudah memilih",
  "suara.hasil.aria":
    "{s} suara setuju, {t} suara tidak setuju, {b} belum memilih",
  "suara.legend.setuju": "{n} Setuju",
  "suara.legend.tidak": "{n} Tidak Setuju",
  "suara.legend.belum": "{n} belum memilih",
  "temuan.hitung": "Pemeriksaan Juni 2026, {n} temuan",

  // Tab bar
  "tab.aria": "Navigasi utama",
  "tab.beranda": "Beranda",
  "tab.uang": "Uang Anda",
  "tab.arus": "Arus Dana",
  "tab.suara": "Suara Anda",
} as const;

export type MemberCopyKey = keyof typeof MEMBER_COPY;

/** Label chip severity pada kartu temuan (bentuk + kata, bukan warna saja). */
export const SEVERITY_CHIP: Record<Severity, string> = {
  merah: "Perlu Dijelaskan",
  kuning: "Perlu Perhatian",
  info: "Catatan",
};

/**
 * Panel Pengawas: empat pemeriksa dengan target hitung + satuan awam + jam.
 * Urutan mengikuti prototipe. Label nama diambil dari AGENT_LABELS.anggota.
 */
export const AGENT_PANEL: ReadonlyArray<{
  id: AgentId;
  target: number;
  unit: string;
  time: string;
}> = [
  {
    id: "anomali_transaksi",
    target: 312,
    unit: "transaksi diperiksa",
    time: "07.02",
  },
  {
    id: "konflik_kepentingan",
    target: 18,
    unit: "vendor dicocokkan",
    time: "07.03",
  },
  {
    id: "kesehatan_finansial",
    target: 6,
    unit: "angka keuangan diperiksa",
    time: "07.04",
  },
  {
    id: "kepatuhan_proses",
    target: 4,
    unit: "aturan koperasi diperiksa",
    time: "07.05",
  },
];

/**
 * Identitas anggota demo (fallback purwarupa). Kontrak 6.10 tidak membekukan
 * endpoint identitas/profil anggota; nama, nomor anggota, NIK, dan alamat
 * diambil dari data seed Sukamaju agar layar utuh dan demo-proof. Saat
 * integrasi, sumber ini di-override oleh sesi login (surface, bukan invented).
 */
export const MEMBER_IDENTITY = {
  nama: "Sari Rahayu",
  sapaanNama: "Bu Sari",
  inisial: "SR",
  noAnggota: "KDS-0007",
  koperasi: "Koperasi Desa Merah Putih Sukamaju",
  koperasiCaps: "KOPERASI DESA MERAH PUTIH SUKAMAJU",
  nikMasked: "3208 •••• •••• 0042",
  alamat: "Dusun Krajan RT 04, Sukamaju",
  bergabung: "Bergabung 12 Maret 2025",
} as const;

/**
 * Aktivitas terbaru beranda (fallback purwarupa): kontrak 6.10 tidak membekukan
 * endpoint aktivitas anggota; baris ini data seed Sukamaju. flag menandai baris
 * yang sedang diperiksa Pengawas: "nonhijau" tampil bila verdict bukan hijau,
 * "merah" hanya saat verdict merah.
 */
export const AKTIVITAS_TERBARU: ReadonlyArray<{
  tgl: string;
  label: string;
  jumlah: number;
  flag: "tidak" | "nonhijau" | "merah";
}> = [
  {
    tgl: "30 Jun",
    label: "Setoran simpanan anggota",
    jumlah: 4500000,
    flag: "tidak",
  },
  {
    tgl: "20 Jun",
    label: "Lima pinjaman dicairkan",
    jumlah: 30000000,
    flag: "nonhijau",
  },
  {
    tgl: "14 Jun",
    label: "Pembelian stok gerai",
    jumlah: 15000000,
    flag: "merah",
  },
];
