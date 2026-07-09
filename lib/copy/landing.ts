/**
 * String surface landing (rute /). Dimiliki unit g (Phase 1 wave 1).
 * Seluruh teks section landing diekstrak verbatim dari
 * design-handoff/landing/Pramana Landing.dc.html dan ditaruh di sini;
 * JSX landing tidak boleh memuat string hardcoded (AC-E2E-06).
 *
 * Register 6.8: sapaan "Anda", tanpa em dash, tanpa emoji, tanpa jargon.
 * Kunci 6.15 (landing.tagline / landing.cta.* / landing.juri, verdict.cta,
 * notif.template, temuan.*) TIDAK diduplikasi di sini: dipakai dari COPY inti.
 * Angka nasional TIDAK ditulis di sini: dipakai dari lib/facts.ts.
 */
export const LANDING_COPY = {
  brand: { nama: "Pramana", badge: "AI" },

  nav: {
    temaAria: "Ganti tema tampilan, tema saat ini",
  },

  hero: {
    badge: "PRAMANA AI",
    sub: "Empat pemeriksa AI membaca transaksi koperasi Anda. Satu adjudikator menimbang temuannya menjadi verdict hijau, kuning, atau merah, lengkap dengan pertanyaan siap pakai untuk Rapat Anggota Tahunan.",
  },

  preview: {
    // Stand-in mini-UI di dalam device frame. Akan diganti screenshot e2e
    // asli via next/image saat fase demo (lihat ScreenSlot).
    captions: [
      {
        eyebrow: "APLIKASI ANGGOTA · MOBILE",
        body: "Verdict dan temuan dalam bahasa awam, dipahami dalam waktu kurang dari satu menit.",
      },
      {
        eyebrow: "DASBOR PEMERINTAH · DESKTOP",
        body: "Kesehatan seluruh koperasi binaan dalam satu layar, dari agregat sampai detail temuan.",
      },
    ],
    phone: {
      jam: "09.41",
      sapaan: "Selamat pagi, Ibu Sari",
      notifJumlah: "5",
      verdictEyebrow: "MERAH · PERLU DIJELASKAN",
      verdictJudul:
        "Kas koperasi menurun dan ada satu pembelian besar yang perlu dijelaskan pengurus.",
      verdictMeta: "Koperasi Desa Merah Putih Sukamaju · Juni 2026",
      temuanEyebrow: "TEMUAN · KONFLIK KEPENTINGAN",
      temuanJudul: "Pembelian Rp15.000.000 ke Toko Berkah",
      temuanPenjelasan: "Alamat vendor tercatat sama dengan alamat bendahara.",
      tab: ["Beranda", "Uang Anda", "Arus Dana", "Suara Anda"],
    },
    dasbor: {
      judul: "Pramana · Dasbor Pemerintah",
      periode: "PERIODE JUNI 2026",
      kpi: [
        { nilai: "12", label: "KOPERASI TERPANTAU", tanda: "none" },
        { nilai: "6", label: "HIJAU", tanda: "hijau" },
        { nilai: "4", label: "KUNING", tanda: "kuning" },
        { nilai: "2", label: "MERAH", tanda: "merah" },
        { nilai: "17", label: "TEMUAN TERBUKA", tanda: "none" },
      ],
      distribusiLabel: "DISTRIBUSI VERDICT",
      tabelHeader: {
        koperasi: "KOPERASI",
        provinsi: "PROVINSI",
        verdict: "VERDICT",
        temuan: "TEMUAN",
      },
      baris: [
        {
          koperasi: "Merah Putih Sukamaju",
          provinsi: "Jawa Barat",
          warna: "merah",
          verdict: "Merah",
          temuan: "6",
        },
        {
          koperasi: "Merah Putih Lembah Sari",
          provinsi: "Sumatera Barat",
          warna: "merah",
          verdict: "Merah",
          temuan: "4",
        },
        {
          koperasi: "Merah Putih Cempaka Wangi",
          provinsi: "Lampung",
          warna: "kuning",
          verdict: "Kuning",
          temuan: "2",
        },
        {
          koperasi: "Merah Putih Wanasaba",
          provinsi: "Nusa Tenggara Barat",
          warna: "kuning",
          verdict: "Kuning",
          temuan: "2",
        },
        {
          koperasi: "Merah Putih Mekarsari",
          provinsi: "Jawa Barat",
          warna: "hijau",
          verdict: "Hijau",
          temuan: "0",
        },
      ],
    },
  },

  masalah: {
    eyebrow: "01 · MASALAH",
    judul: "Dananya sudah mengalir. Pengawasannya belum.",
    lede: "Program Koperasi Desa Merah Putih menyalurkan plafon hingga Rp3 miliar ke setiap koperasi desa. Badan pengawasnya sering kali hanya formalitas, dan anggota tidak punya alat untuk memeriksa sendiri.",
    // number + source (sumber · tanggal) diambil dari lib/facts.ts via factKey.
    stat: [
      { factKey: "koperasiTotal", eyebrow: "", label: "koperasi desa berdiri" },
      { factKey: "sudahRat", eyebrow: "BARU SEKITAR", label: "yang telah RAT" },
      {
        factKey: "risikoKebocoran",
        eyebrow: "RISIKO KEBOCORAN SEKITAR",
        label: "per koperasi per tahun",
      },
    ],
  },

  wawasan: {
    baris1: "Aplikasi koperasi selama ini dibangun untuk pengurus.",
    baris2: "Pramana dibangun untuk Anda, anggotanya.",
  },

  caraKerja: {
    eyebrow: "02 · CARA KERJA",
    judul: "Pramana bertanya, tidak menuduh.",
    lede: "Empat pemeriksa membaca data koperasi dari sisi yang berbeda, berjalan bersamaan. Satu adjudikator menimbang seluruh temuan, menulis ulang dalam bahasa awam, lalu menyusun pertanyaan yang siap Anda bawa ke rapat.",
    pemeriksa: [
      {
        kode: "P1",
        judul: "Konflik Kepentingan",
        teks: "Mencocokkan vendor transaksi dengan alamat dan nama pengurus.",
      },
      {
        kode: "P2",
        judul: "Anomali Transaksi",
        teks: "Menandai lonjakan persetujuan, pemecahan nilai, dan pembelian janggal.",
      },
      {
        kode: "P3",
        judul: "Kesehatan Finansial",
        teks: "Membaca tren kas dan pinjaman macet dengan analogi rumah tangga.",
      },
      {
        kode: "P4",
        judul: "Kepatuhan Proses",
        teks: "Memeriksa kelengkapan dokumen, plafon, wewenang, dan status RAT.",
      },
    ],
    adjudikatorEyebrow: "ADJUDIKATOR",
    adjudikatorTeks:
      "Menghapus duplikasi, menimbang bobot temuan, menulis ulang dalam bahasa awam, lalu mengusulkan satu verdict beserta daftar pertanyaan untuk rapat.",
    chip: [
      { warna: "hijau", label: "Hijau · Sehat" },
      { warna: "kuning", label: "Kuning · Perlu perhatian" },
      { warna: "merah", label: "Merah · Perlu dijelaskan" },
    ],
    catatan:
      "Setiap verdict kuning atau merah membawa pertanyaan siap pakai untuk Rapat Anggota Tahunan.",
  },

  fitur: {
    eyebrow: "03 · FITUR INTI",
    judul: "Empat layar, satu alur.",
    kartu: [
      {
        tanda: "lingkaran",
        judul: "Koperasi Anda Sehat?",
        teks: "Satu warna, satu kalimat ringkasan. Anda tahu kondisi koperasi dalam waktu kurang dari satu menit.",
      },
      {
        tanda: "segitiga",
        judul: "Yang Perlu Anda Tahu",
        teks: "Temuan dalam bahasa awam beserta bukti, tanggapan pengurus, dan pertanyaan siap pakai untuk rapat.",
      },
      {
        tanda: "batang",
        judul: "Ke Mana Uang Koperasi Pergi",
        teks: "Arus dana bulanan sebagai cerita visual sederhana. Aliran yang sedang diperiksa Pengawas diberi tanda.",
      },
      {
        tanda: "duaLingkaran",
        judul: "Suara Anda",
        teks: "Pertanyaan Anda digabungkan dengan anggota lain, lalu dibawa bersama ke Rapat Anggota Tahunan.",
      },
    ],
  },

  footer: {
    tagline: "Pengawas koperasi desa, di genggaman setiap anggota.",
    tim: {
      eyebrow: "TIM",
      nama: "Tim Daulat",
      sub: "Politeknik Negeri Bandung",
    },
    ajang: {
      eyebrow: "AJANG",
      nama: "Hackathon Digital Cooperatives Expo 2026",
      repoLabel: "Repositori proyek",
      // ponytail: slot URL repo publik, diisi saat submit (blueprint 6.19 footer).
      repoHref: "#",
    },
    ghost: "PRAMANA",
    legalKiri: "© 2026 Tim Daulat",
    legalKanan:
      "Purwarupa untuk penjurian. Seluruh data bersifat sintetis, tanpa data pribadi nyata.",
  },
} as const;
