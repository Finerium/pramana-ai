/**
 * String surface dasbor pemerintah (unit e). Teks diekstrak verbatim dari
 * prototype produksi dashboard. Register 6.8: sapaan "Anda", tanpa em dash,
 * tanpa emoji. Dasbor pemerintah boleh istilah teknis dengan tooltip (6.8).
 * Kunci state 6.15 (audit.jalan, audit.gagal, banner.live, login.err) DITULIS
 * verbatim di sini (mirror COPY 6.15). Tidak mengimpor COPY dari ./index karena
 * index.ts me-`export *` gov.ts (dependensi melingkar). Nilai wajib sama persis
 * dengan lib/copy COPY 6.15; label agen dari AGENT_LABELS.pemerintah.
 */

export const GOV_COPY = {
  // Shell / header
  "brand.nama": "Pramana",
  "brand.sub": "DASBOR PENGAWASAN KEMENKOP",
  "brand.subLogin": "DASBOR PENGAWASAN KEMENKOP RI",
  "shell.periode": "Periode · Juni 2026",
  "shell.tema.label": "Pilihan tema",
  "shell.tema.terang": "Terang",
  "shell.tema.gelap": "Gelap",
  "shell.user.nama": "Analis Kemenkop",
  "shell.user.email": "juri.pemerintah@pramana.id",
  "shell.user.inisial": "AK",

  // Overview
  "ov.judul": "Peta Kesehatan Koperasi Desa",
  "ov.diperbarui":
    "Diperbarui 8 Juli 2026, 08.15 WIB · Sumber: hasil pemeriksaan Pengawas per koperasi",
  "ov.kpi.koperasi": "KOPERASI TERPANTAU",
  "ov.kpi.hijau": "HIJAU",
  "ov.kpi.kuning": "KUNING",
  "ov.kpi.merah": "MERAH",
  "ov.kpi.temuan": "TEMUAN TERBUKA",
  "ov.kpi.sub.periode": "periode Juni 2026",
  "ov.kpi.sub.menunggu": "menunggu sinkronisasi",
  "ov.kpi.sub.gagal": "tidak dapat dimuat",
  "ov.distribusi.judul": "Distribusi Verdict",
  "ov.distribusi.sub.periode": "periode Juni 2026",
  "ov.distribusi.title.hijau":
    "Verdict hijau: tidak ada temuan yang perlu ditanyakan",
  "ov.distribusi.title.kuning":
    "Verdict kuning: ada hal yang perlu dijelaskan pengurus",
  "ov.distribusi.title.merah":
    "Verdict merah: ada temuan serius yang menunggu penjelasan",
  "ov.tabel.judul": "Koperasi dalam Pengawasan",
  "ov.tabel.jumlah.semua": "seluruh provinsi percontohan",
  "ov.cari.placeholder": "Cari koperasi atau provinsi",
  "ov.header.koperasi": "KOPERASI",
  "ov.header.provinsi": "PROVINSI",
  "ov.header.verdict": "VERDICT",
  "ov.header.temuan": "TEMUAN",
  "ov.header.sortTitle": "Urutkan",
  "ov.kosongFilter": "Tidak ada koperasi yang cocok dengan pencarian Anda.",
  "ov.footer.hint": "Klik baris untuk membuka detail koperasi",
  "ov.kosong.judul": "Belum ada koperasi dalam pengawasan.",
  "ov.kosong.sub":
    "Data akan tampil setelah sinkronisasi pertama dari sistem keanggotaan selesai dijalankan.",
  "ov.kosong.cta": "Muat Ulang",
  "ov.gagal.banner":
    "Gagal memuat data pengawasan. Periksa koneksi Anda lalu coba lagi.",
  "ov.gagal.cta": "Coba Lagi",
  "ov.gagal.panel": "Data tidak dapat dimuat.",
  "ov.memuat": "Memuat data pengawasan...",

  // Detail
  "dt.breadcrumb.root": "Semua Koperasi",
  "dt.verdict.periode": "Verdict Juni 2026",
  "dt.verdict.terakhir": "Pemeriksaan terakhir",
  "dt.kosong.chip": "Belum Diperiksa",
  "dt.kosong.teks":
    "Pengawas belum pernah memeriksa koperasi ini. Jalankan pemeriksaan pertama untuk mendapatkan verdict.",
  "dt.jalankan": "Jalankan Pemeriksaan Ulang",
  "dt.jalankan.pertama": "Jalankan Pemeriksaan",
  "dt.jalankan.berjalan": "Sedang Memeriksa",
  "dt.sumber.tersimpan": "Hasil pemeriksaan tersimpan",
  "dt.sumber.arsipPrefix": "Arsip Pengawas",
  "dt.sumber.berjalan":
    "Pengawas sedang memeriksa. Ini memerlukan waktu kurang dari dua menit.",
  "dt.sumber.langsung": "Hasil pemeriksaan langsung, baru saja dijalankan.",
  "dt.sumber.gagal":
    "Pemeriksaan langsung gagal. Menampilkan hasil tersimpan terakhir.",
  "dt.tren.judul": "Tren Verdict 6 Bulan",
  "dt.tren.sub": "Januari sampai Juni 2026",
  "dt.tren.kosong": "Belum ada riwayat pemeriksaan.",
  "dt.temuan.judul": "Temuan Pemeriksaan",
  "dt.temuan.sub.tail": "periode Juni 2026, diurutkan dari tingkat tertinggi",
  "dt.temuan.header.temuan": "TEMUAN",
  "dt.temuan.header.agen": "AGEN PEMERIKSA",
  "dt.temuan.header.tingkat": "TINGKAT",
  "dt.temuan.header.bukti": "BUKTI",
  // F-02 (.crown/notes.md): tanggal tanggapan pengurus disatukan ke 24 Juni 2026.
  "dt.tanggapan.label": "TANGGAPAN PENGURUS · 24 JUNI 2026",
  "dt.temuan.kosong.judul": "Belum ada pemeriksaan untuk koperasi ini.",
  "dt.temuan.kosong.sub":
    "Gunakan tombol Jalankan Pemeriksaan di atas untuk memulai.",
  "dt.rat.title": "RAT: Rapat Anggota Tahunan",
  "dt.memuat": "Memuat data koperasi...",
  "dt.gagal.banner":
    "Gagal memuat data koperasi. Periksa koneksi Anda lalu coba lagi.",
  "dt.gagal.cta": "Coba Lagi",
  "dt.gagal.panel": "Data koperasi tidak dapat dimuat.",

  // Riwayat pemeriksaan (daftar audit_run koperasi, terbaru di atas)
  "dt.riwayat.judul": "Riwayat Pemeriksaan",
  "dt.riwayat.sub":
    "Arsip pemeriksaan Pengawas untuk koperasi ini, terbaru di atas",
  "dt.riwayat.kosong": "Belum ada riwayat pemeriksaan untuk koperasi ini.",
  "dt.riwayat.temuanSatuan": "temuan",
  "dt.riwayat.header.periode": "PERIODE",
  "dt.riwayat.header.verdict": "VERDICT",
  "dt.riwayat.header.temuan": "TEMUAN",
  "dt.riwayat.header.waktu": "DIJALANKAN",

  // Diagram pemeriksaan langsung (pemerintah menonton agen berjalan)
  "dt.tree.judul": "Pemeriksaan Pramana",
  "dt.tree.deskripsi":
    "Pramana menjalankan empat agen pemeriksa secara paralel, lalu adjudikator menyatukan temuan menjadi satu verdict.",
  "dt.tree.aria": "Diagram pemeriksaan Pramana",
  "dt.tree.status.berjalan":
    "Empat agen sedang memeriksa transaksi koperasi. Ini memerlukan waktu kurang dari dua menit.",
  "dt.tree.status.selesai":
    "Pemeriksaan selesai. Verdict terbaru tampil di bawah.",
  "dt.tree.status.gagal":
    "Pemeriksaan langsung gagal. Verdict tersimpan terakhir tampil di bawah.",
  "dt.tree.root": "Pramana",
  "dt.tree.rootSub": "Pengawas koperasi",
  "dt.tree.model": "MiniMax-M2.7",
  "dt.tree.memeriksa": "Memeriksa...",
  "dt.tree.adjudikator": "Adjudikator",
  "dt.tree.adjudikatorSub": "Menyatukan temuan menjadi satu verdict.",
  "dt.tree.menungguAgen": "Menunggu hasil empat pemeriksa...",
  "dt.tree.kesimpulan": "Verdict",
  "dt.tree.menungguKesimpulan": "Menunggu verdict...",
  "dt.tree.temuanSatuan": "temuan",
  "dt.tree.tanpaTemuan": "Tidak ada temuan",
  "dt.tree.tanpaHasil": "Belum ada hasil",
  "dt.tree.hasilTersimpan": "Hasil tersimpan",
  "dt.tree.antiHalusinasi":
    "Setiap temuan menunjuk transaksi nyata. Yang tidak dapat dibuktikan otomatis dibuang.",

  // Login (varian visual pemerintah; rute /login milik unit d)
  "login.email.label": "Email",
  "login.email.placeholder": "nama@instansi.go.id",
  "login.sandi.label": "Kata Sandi",
  "login.sandi.placeholder": "Masukkan kata sandi Anda",
  "login.err": "Email atau kata sandi belum tepat. Silakan coba lagi.",
  "login.btn": "Masuk",
  "login.btn.memuat": "Memeriksa...",
  "login.hint.label": "AKUN UJI JURI",
  "login.hint.email": "juri.pemerintah@pramana.id",
  "login.hint.sandi": "PramanaJuri2026",
  "login.hint.aksi": "Isi otomatis",
  "login.footer.baris1":
    "Pramana AI · Purwarupa Digital Cooperatives Expo 2026",
  "login.footer.baris2": "Akses hanya untuk analis pemerintah yang terdaftar.",
} as const;

export type GovCopyKey = keyof typeof GOV_COPY;
