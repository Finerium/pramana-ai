/**
 * Teks temuan seed BEKU (blueprint 6.7): fixture kanonik AN-1..AN-6.
 * Sumber verbatim: design-handoff/mobile/Pramana App.dc.html (array FIND) dan
 * kontrak 6.7. BUKAN hasil LLM. File ini milik verification workflow (F4/F14);
 * worker dilarang mengubahnya. Ejaan dipertahankan persis seperti prototype.
 *
 * Konsumen: scripts/seed (precompute audit_run source="seed"), fixture test
 * AC-SEED-02, dan AC-LLM-02.
 */

export type TemuanSeedBukti = {
  jenis: "transaksi" | "pinjaman" | "rasio" | "jadwal";
  /** id baris DB stabil per skema id 6.7 (trx-an1, pj-an5, dst) atau id turunan untuk rasio/jadwal */
  id: string;
  label: string;
};

export type TemuanSeed = {
  /** id anomali kontraktual, dipakai test AC-SEED-02 */
  id: "an1" | "an2" | "an3" | "an4" | "an5" | "an6";
  agent:
    | "konflik_kepentingan"
    | "anomali_transaksi"
    | "kesehatan_finansial"
    | "kepatuhan_proses";
  severity: "info" | "kuning" | "merah";
  judul: string;
  penjelasan_awam: string;
  kenapa_penting: string;
  bukti: TemuanSeedBukti[];
  pertanyaan_rat: string;
  tanggapan_pengurus?: string;
};

/** Ringkasan verdict merah run Juni 2026, beku per 6.7. */
export const RINGKASAN_MERAH =
  "Kas koperasi menurun dan ada satu pembelian besar yang perlu dijelaskan pengurus.";

export const TEMUAN_SEED: readonly TemuanSeed[] = [
  {
    id: "an1",
    agent: "konflik_kepentingan",
    severity: "merah",
    judul:
      "Pembelian Rp 15.000.000 ke toko yang beralamat sama dengan rumah bendahara",
    penjelasan_awam:
      "Pada 14 Juni 2026 koperasi membeli barang senilai Rp 15.000.000 dari Toko Berkah. Alamat toko ini sama dengan alamat rumah bendahara koperasi.",
    kenapa_penting:
      "Uang koperasi adalah uang bersama seluruh anggota. Saat pembelian besar mengalir ke pihak yang dekat dengan pengurus, anggota berhak memastikan harganya wajar dan barangnya benar diterima.",
    bukti: [
      {
        jenis: "transaksi",
        id: "trx-an1",
        label: "Pembelian Rp 15.000.000 ke Toko Berkah, 14 Juni 2026",
      },
      {
        jenis: "transaksi",
        id: "trx-an1",
        label: "Alamat vendor sama dengan alamat bendahara, Jl. Melati No. 12",
      },
    ],
    pertanyaan_rat:
      "Bisakah pengurus menjelaskan alasan memilih Toko Berkah untuk pembelian Rp 15.000.000 dan bagaimana harganya dibandingkan penjual lain?",
  },
  {
    id: "an2",
    agent: "anomali_transaksi",
    severity: "kuning",
    judul: "Lima pinjaman disetujui pada hari yang sama",
    penjelasan_awam:
      "Pada 20 Juni 2026 ada lima pinjaman disetujui sekaligus dengan total Rp 30.000.000. Biasanya koperasi menyetujui satu sampai dua pinjaman per minggu.",
    kenapa_penting:
      "Persetujuan yang menumpuk dalam satu hari bisa berarti antrean biasa, bisa juga berarti pemeriksaan yang terburu-buru. Anggota berhak tahu prosesnya tetap teliti.",
    bukti: [
      {
        jenis: "pinjaman",
        id: "pj-an2-1",
        label: "Lima pencairan pinjaman pada 20 Juni 2026, total Rp 30.000.000",
      },
      {
        jenis: "rasio",
        id: "baseline-persetujuan-mingguan",
        label: "Kebiasaan sebelumnya satu sampai dua persetujuan per minggu",
      },
    ],
    pertanyaan_rat:
      "Apa alasan lima pinjaman disetujui bersamaan pada 20 Juni dan bagaimana pemeriksaannya dilakukan?",
    tanggapan_pengurus:
      "Kelima pinjaman merupakan program musim tanam yang disetujui rapat pengurus 18 Juni, dokumen tersedia di kantor koperasi.",
  },
  {
    id: "an3",
    agent: "anomali_transaksi",
    severity: "kuning",
    judul: "Satu pembelian besar dipecah menjadi tiga pembelian kecil",
    penjelasan_awam:
      "Dalam lima hari ada tiga pembelian ke CV Sumber Rejeki, masing-masing Rp 4.900.000, sedikit di bawah batas Rp 5.000.000 yang memerlukan persetujuan tambahan.",
    kenapa_penting:
      "Memecah satu pembelian besar menjadi beberapa pembelian kecil dapat membuat pembelian lolos tanpa pemeriksaan yang seharusnya. Ini pola yang wajar untuk ditanyakan.",
    bukti: [
      {
        jenis: "transaksi",
        id: "trx-an3-1",
        label:
          "Tiga pembelian Rp 4.900.000 ke CV Sumber Rejeki, 9 sampai 13 Juni 2026",
      },
    ],
    pertanyaan_rat:
      "Mengapa pembelian ke CV Sumber Rejeki dipecah menjadi tiga kali dalam lima hari?",
  },
  {
    id: "an4",
    agent: "kesehatan_finansial",
    severity: "kuning",
    judul: "Kas koperasi menurun 37 persen dalam tiga bulan",
    penjelasan_awam:
      "Uang kas koperasi turun dari Rp 58.000.000 pada April menjadi Rp 36.500.000 pada Juni. Seperti rumah tangga, koperasi perlu pegangan uang tunai yang cukup.",
    kenapa_penting:
      "Jika kas terus menurun, koperasi bisa kesulitan melayani penarikan simpanan anggota. Penurunan yang cepat perlu dijelaskan penyebabnya, bukan didiamkan.",
    bukti: [
      {
        jenis: "rasio",
        id: "kas-apr-jun-2026",
        label: "Saldo kas April Rp 58.000.000, Juni Rp 36.500.000",
      },
    ],
    pertanyaan_rat:
      "Apa penyebab kas koperasi menurun sejak April dan bagaimana rencana memulihkannya?",
  },
  {
    id: "an5",
    agent: "kepatuhan_proses",
    severity: "kuning",
    judul: "Pinjaman melebihi batas dengan dokumen belum lengkap",
    penjelasan_awam:
      "Ada pinjaman Rp 12.000.000, di atas batas Rp 10.000.000 per anggota, dan dokumen persyaratannya tercatat belum lengkap.",
    kenapa_penting:
      "Batas pinjaman dibuat untuk menjaga uang bersama. Melewatinya boleh saja dalam keadaan tertentu, tetapi harus dengan alasan dan dokumen yang jelas.",
    bukti: [
      {
        jenis: "pinjaman",
        id: "pj-an5",
        label: "Pinjaman Rp 12.000.000, batas per anggota Rp 10.000.000",
      },
      {
        jenis: "pinjaman",
        id: "pj-an5",
        label: "Dokumen persyaratan tercatat belum lengkap",
      },
    ],
    pertanyaan_rat:
      "Atas dasar apa pinjaman Rp 12.000.000 disetujui melebihi batas dan kapan dokumennya akan dilengkapi?",
  },
  {
    id: "an6",
    agent: "kepatuhan_proses",
    severity: "info",
    judul: "Rapat Anggota Tahunan 2026 belum dijadwalkan",
    penjelasan_awam:
      "Sampai akhir Juni 2026 koperasi belum melaksanakan Rapat Anggota Tahunan untuk tahun buku 2025.",
    kenapa_penting:
      "Rapat tahunan adalah tempat anggota mendengar laporan dan mengambil keputusan bersama. Tanpa rapat, anggota tidak punya ruang resmi untuk bertanya.",
    bukti: [
      {
        jenis: "jadwal",
        id: "rat-2026",
        label: "Belum ada jadwal Rapat Anggota Tahunan untuk tahun buku 2025",
      },
    ],
    pertanyaan_rat: "Kapan Rapat Anggota Tahunan akan dilaksanakan?",
  },
] as const;

/**
 * Urutan tampil temuan pada prototype mobile (severity turun, lalu urutan
 * kurasi bundle). Dipakai seed agar render live identik dengan bundle.
 */
export const URUTAN_TAMPIL = [
  "an1",
  "an4",
  "an2",
  "an3",
  "an5",
  "an6",
] as const;

/**
 * Agregat pertanyaan RAT seeded (F-04 di .crown/notes.md): 6.7 membekukan
 * AN-1 = 12 anggota; AN-4 = 7 dan AN-2 = 5 mengikuti prototype agar UI, seed,
 * dan bundle konsisten.
 */
export const SEED_AGREGAT: Record<string, number> = {
  an1: 12,
  an4: 7,
  an2: 5,
};
