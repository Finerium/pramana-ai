/**
 * String konsol simulasi pembukuan (rute /pembukuan). Dimiliki unit h.
 * Teks diekstrak verbatim dari prototipe bundle subjek (Konsol Pembukuan).
 * Kunci beku 6.15 (header, sub, sync, simpan, pinjaman.simpan, preset.*,
 * login.hint, login.err) hidup di lib/copy/index.ts (COPY); di sini string
 * surface non-6.15 saja. Register 6.8: sapaan "Anda", tanpa em dash, tanpa
 * emoji, bahasa awam. Ikon presentasi (centang dll) tidak disimpan di sini.
 */
export const SUBJEK_COPY = {
  header: {
    saldoLabel: "Saldo kas koperasi",
    koperasi: "Koperasi Desa Merah Putih Sukamaju",
    simTag: "Mode simulasi",
    tema: "Ganti tema",
    keluar: "Keluar",
  },
  trx: {
    judul: "Catat Transaksi",
    deskripsi:
      "Setiap entri langsung menjadi sumber data yang diperiksa Pramana.",
    lJenis: "Jenis transaksi",
    lJumlah: "Jumlah",
    lTanggal: "Tanggal",
    lUnit: "Unit usaha",
    lVendorNama: "Nama vendor",
    lVendorAlamat: "Alamat vendor",
    lAnggota: "Anggota terkait",
    lDeskripsi: "Deskripsi",
    phJumlah: "0",
    phVendorNama: "Nama toko atau CV",
    phVendorAlamat: "Alamat lengkap vendor",
    phDeskripsi: "Jelaskan singkat transaksi ini",
    ariaJumlah: "Jumlah rupiah",
    ariaTanggal: "Tanggal transaksi",
    helper: "Masukkan angka tanpa titik. Contoh: 15000000",
    echoPrefix: "Terbaca: ",
    memuat: "Menyimpan...",
    bersihkan: "Bersihkan",
    sukses:
      "Transaksi tercatat. Saldo kas diperbarui dan entri dikirim ke Pramana.",
  },
  pin: {
    judul: "Persetujuan Pinjaman",
    deskripsi: "Plafon kebijakan koperasi Rp 10.000.000 per anggota.",
    lAnggota: "Anggota",
    lDisetujui: "Disetujui oleh",
    lPokok: "Pokok pinjaman",
    lCicilan: "Cicilan bulanan",
    lJatuhTempo: "Jatuh tempo berikut",
    lDokumen: "Kelengkapan dokumen",
    ariaPokok: "Pokok pinjaman",
    ariaCicilan: "Cicilan bulanan",
    ariaJatuhTempo: "Jatuh tempo berikut",
    dokJudul: "Dokumen lengkap",
    dokLengkap: "Dokumen dinyatakan lengkap.",
    dokBelum: "Dokumen belum lengkap.",
    memuat: "Menyimpan...",
    bersihkan: "Bersihkan",
    sukses: "Pinjaman tersimpan. Entri dikirim ke Pramana.",
  },
  reqMark: "wajib",
  optMark: "opsional",
  preset: {
    judul: "Preset skenario",
    deskripsi:
      "Mengisi form dengan contoh. Tidak langsung tersimpan, Anda tetap menekan tombol.",
    tag: "Contoh",
    noteKonflik:
      "Alamat vendor sama dengan alamat pengurus. Setelah dicatat, Pramana dapat menandainya sebagai hal yang perlu dijelaskan pengurus.",
    notePecah:
      "Pembelian dipecah menjadi beberapa nilai di bawah lima juta ke vendor yang sama dalam sepekan. Pola ini dapat ditanyakan Pramana.",
    noteKas:
      "Pengeluaran besar yang menekan saldo kas. Tren kas yang menurun tajam dapat menjadi perhatian Pramana.",
    notePlafon:
      "Pokok melebihi plafon sepuluh juta dan dokumen ditandai belum lengkap. Kombinasi ini dapat ditanyakan Pramana.",
  },
  rat: {
    judul: "Status RAT",
    deskripsi: "Rapat Anggota Tahunan tahun berjalan.",
    tahunLabel: "Tahun berjalan",
    tahun: "2026",
    sudahJudul: "RAT sudah terlaksana",
    belumJudul: "RAT belum terlaksana",
    sudahSub: "Isi tanggal pelaksanaan di bawah.",
    belumSub: "Status ini menjadi salah satu yang diperiksa Pramana.",
    lTanggal: "Tanggal pelaksanaan",
    ariaTanggal: "Tanggal RAT",
    sukses: "Status RAT diperbarui.",
    tombol: "Perbarui status RAT",
  },
  daftar: {
    judul: "Daftar Entri Terakhir",
    deskripsi:
      "Sepuluh transaksi dan lima pinjaman terbaru, dengan status sinkronisasi ke Pramana.",
    segTerisi: "Terisi",
    segKosong: "Kosong",
    subTrx: "Transaksi",
    subPin: "Pinjaman",
    tersinkron: "Tersinkron",
    menunggu: "Menunggu sinkron",
    dokLengkap: "Dokumen lengkap",
    dokBelum: "Dokumen belum lengkap",
    tempo: "Tempo",
    pokok: "Pokok",
    cicilan: "cicilan",
    kosongTrxJudul: "Belum ada transaksi",
    kosongTrxDesc:
      "Transaksi yang Anda catat akan muncul di sini dan langsung dikirim ke Pramana.",
    kosongPinJudul: "Belum ada pinjaman",
    kosongPinDesc:
      "Pinjaman yang Anda setujui akan muncul di sini beserta status dokumennya.",
  },
  tree: {
    judul: "Pemeriksaan Pramana",
    deskripsi:
      "Transaksi yang Anda catat langsung diperiksa empat agen AI secara paralel, lalu adjudikator menyatukan temuan menjadi satu kesimpulan.",
    aria: "Diagram pemeriksaan Pramana",
    root: "Pramana",
    rootSub: "Pengawas koperasi",
    model: "MiniMax-M2.7",
    memeriksa: "Memeriksa...",
    adjudikator: "Adjudikator",
    adjudikatorSub: "Menyatukan temuan menjadi satu kesimpulan.",
    menungguAgen: "Menunggu hasil empat pemeriksa...",
    kesimpulan: "Kesimpulan",
    menungguKesimpulan: "Menunggu kesimpulan...",
    temuanSatuan: "temuan",
    tanpaTemuan: "Tidak ada temuan",
    tanpaHasil: "Belum ada hasil",
    dasar: "Berdasarkan ",
    hasilTersimpan: "Hasil tersimpan",
    waktuHabis:
      "Pemeriksaan memerlukan waktu lebih lama dari biasanya. Hasilnya tersimpan begitu selesai dan tampil pada pemeriksaan berikutnya.",
    antiHalusinasi:
      "Setiap temuan menunjuk transaksi nyata; yang tidak dapat dibuktikan otomatis dibuang.",
  },
  footNote:
    "Konsol ini mensimulasikan sistem pembukuan koperasi. Data yang Anda catat menjadi sumber yang diperiksa Pramana. Ini bukan bagian produk Pramana untuk pengurus.",
  login: {
    kicker: "Simulasi Pembukuan Koperasi",
    judul: "Masuk sebagai bendahara",
    sub: "Sumber data yang diawasi Pramana. Gunakan akun uji di bawah untuk mencoba.",
    lEmail: "Email",
    lSandi: "Kata sandi",
    phEmail: "nama@pramana.id",
    phSandi: "Kata sandi",
    kredEmail: "bendahara@pramana.id",
    kredSandi: "PramanaBendahara2026",
    isiOtomatis: "Isi otomatis",
    masuk: "Masuk",
    foot: "Purwarupa untuk penjurian. Seluruh data bersifat sintetis.",
  },
  err: {
    jumlahKosong: "Jumlah wajib diisi.",
    jumlahInvalid:
      "Jumlah harus berupa angka lebih dari nol. Masukkan tanpa titik.",
    tanggalKosong: "Tanggal wajib diisi.",
    deskripsiKosong: "Deskripsi wajib diisi agar entri mudah ditelusuri.",
    unitKosong: "Unit usaha wajib dipilih untuk pembelian.",
    vendorNamaKosong: "Nama vendor wajib diisi untuk pembelian.",
    vendorAlamatKosong: "Alamat vendor wajib diisi untuk pembelian.",
    anggotaKosong: "Anggota wajib dipilih.",
    disetujuiKosong: "Jabatan penyetuju wajib dipilih.",
    pokokKosong: "Pokok pinjaman wajib diisi.",
    pokokInvalid: "Pokok harus berupa angka lebih dari nol.",
    cicilanKosong: "Cicilan bulanan wajib diisi.",
    cicilanInvalid: "Cicilan harus berupa angka lebih dari nol.",
    jatuhTempoKosong: "Tanggal jatuh tempo wajib diisi.",
  },
  opsi: {
    jenis: [
      { value: "pembelian", label: "Pembelian" },
      { value: "penjualan", label: "Penjualan" },
      { value: "setoran_simpanan", label: "Setoran simpanan" },
      { value: "penarikan_simpanan", label: "Penarikan simpanan" },
      { value: "pencairan_pinjaman", label: "Pencairan pinjaman" },
      { value: "angsuran", label: "Angsuran" },
      { value: "gaji", label: "Gaji" },
      { value: "operasional", label: "Operasional" },
    ],
    unit: [
      { value: "", label: "Pilih unit usaha" },
      { value: "sembako", label: "Gerai Sembako" },
      { value: "simpan_pinjam", label: "Unit Simpan Pinjam" },
      { value: "apotek", label: "Apotek Desa" },
      { value: "gudang", label: "Gudang" },
    ],
    jabatan: [
      { value: "", label: "Pilih jabatan" },
      { value: "ketua", label: "Ketua" },
      { value: "wakil", label: "Wakil Ketua" },
      { value: "sekretaris", label: "Sekretaris" },
      { value: "bendahara", label: "Bendahara" },
      { value: "pengawas", label: "Pengawas" },
    ],
    anggotaTrxPlaceholder: "Tidak terkait anggota",
    anggotaPinPlaceholder: "Pilih anggota",
  },
} as const;

/** Label jenis untuk baris daftar entri (turunan opsi.jenis). */
export const JENIS_LABEL: Record<string, string> = Object.fromEntries(
  SUBJEK_COPY.opsi.jenis.map((o) => [o.value, o.label]),
);
