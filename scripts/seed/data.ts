/**
 * Data seed deterministik Pramana AI (blueprint 6.7 + 6.7b). SEMUA angka beku;
 * anomali id stabil (trx-an1, pj-an5, dst) sebagai fixture test AC-SEED-02.
 * RNG seeded konstan (rng.ts); tanpa Math.random / Date.now. Teks temuan AN-1..6
 * diambil verbatim dari fixture temuan-seed (bukan hasil LLM).
 */
import { intBetween, mulberry32, pick, splitAmount } from "./rng";
import {
  RINGKASAN_MERAH,
  SEED_AGREGAT,
  TEMUAN_SEED,
  URUTAN_TAMPIL,
} from "../fixtures/temuan-seed";
import { COPY, RINGKASAN_LIVE } from "../../lib/copy";
import {
  anggota,
  auditRun,
  keputusan,
  koperasi,
  notifikasi,
  pengurus,
  pertanyaanRat,
  pinjaman,
  simpanan,
  temuan,
  transaksi,
  unitUsaha,
  users,
  vote,
} from "../../db/schema";
import bcrypt from "bcryptjs";

type Row<T extends { $inferInsert: unknown }> = T["$inferInsert"];

export type SeedData = {
  koperasi: Row<typeof koperasi>[];
  unitUsaha: Row<typeof unitUsaha>[];
  pengurus: Row<typeof pengurus>[];
  anggota: Row<typeof anggota>[];
  simpanan: Row<typeof simpanan>[];
  pinjaman: Row<typeof pinjaman>[];
  transaksi: Row<typeof transaksi>[];
  auditRun: Row<typeof auditRun>[];
  temuan: Row<typeof temuan>[];
  pertanyaanRat: Row<typeof pertanyaanRat>[];
  keputusan: Row<typeof keputusan>[];
  vote: Row<typeof vote>[];
  notifikasi: Row<typeof notifikasi>[];
  users: Row<typeof users>[];
};

const SEED = 0x50524d41; // "PRMA"
const M = 1_000_000;

// bcrypt salt tetap agar hash deterministik (idempotensi AC-SEED-01). Akun seed
// bersifat publik (bukan rahasia); onboarding nyata (modul c) memakai salt acak.
// ponytail: salt tetap khusus seed; upgrade = random salt begitu ada akun sensitif.
const SEED_SALT = "$2b$10$pramanaSeedSalt000000u";
const hash = (pw: string) => bcrypt.hashSync(pw, SEED_SALT);

const BUDI_ALAMAT = "Jl. Melati No. 12, Sukamaju";
const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];

const pad2 = (n: number) => String(n).padStart(2, "0");

/** bergabungPada = 2026-06 dikurangi monthsAgo bulan, tanggal 15. */
function bergabung(monthsAgo: number): string {
  let y = 2026;
  let m = 6 - monthsAgo;
  while (m <= 0) {
    m += 12;
    y -= 1;
  }
  return `${y}-${pad2(m)}-15`;
}

// 11 koperasi ringkas (6.7b), verdict + temuanCount beku.
const KOPERASI_LAIN: {
  id: string;
  nama: string;
  desa: string;
  kabupaten: string;
  provinsi: string;
  warna: "hijau" | "kuning" | "merah";
  temuanCount: number;
}[] = [
  {
    id: "kop-lembahsari",
    nama: "Koperasi Desa Merah Putih Lembah Sari",
    desa: "Lembah Sari",
    kabupaten: "Kab. Agam",
    provinsi: "Sumatera Barat",
    warna: "merah",
    temuanCount: 4,
  },
  {
    id: "kop-cempakawangi",
    nama: "Koperasi Desa Merah Putih Cempaka Wangi",
    desa: "Cempaka Wangi",
    kabupaten: "Kab. Lampung Tengah",
    provinsi: "Lampung",
    warna: "kuning",
    temuanCount: 2,
  },
  {
    id: "kop-wanasaba",
    nama: "Koperasi Desa Merah Putih Wanasaba",
    desa: "Wanasaba",
    kabupaten: "Kab. Lombok Timur",
    provinsi: "Nusa Tenggara Barat",
    warna: "kuning",
    temuanCount: 2,
  },
  {
    id: "kop-batulicin",
    nama: "Koperasi Desa Merah Putih Batulicin",
    desa: "Batulicin",
    kabupaten: "Kab. Tanah Bumbu",
    provinsi: "Kalimantan Selatan",
    warna: "kuning",
    temuanCount: 1,
  },
  {
    id: "kop-airmolek",
    nama: "Koperasi Desa Merah Putih Air Molek",
    desa: "Air Molek",
    kabupaten: "Kab. Indragiri Hulu",
    provinsi: "Riau",
    warna: "kuning",
    temuanCount: 1,
  },
  {
    id: "kop-mekarsari",
    nama: "Koperasi Desa Merah Putih Mekarsari",
    desa: "Mekarsari",
    kabupaten: "Kab. Bogor",
    provinsi: "Jawa Barat",
    warna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-tirtayasa",
    nama: "Koperasi Desa Merah Putih Tirtayasa",
    desa: "Tirtayasa",
    kabupaten: "Kab. Serang",
    provinsi: "Banten",
    warna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-argomulyo",
    nama: "Koperasi Desa Merah Putih Argomulyo",
    desa: "Argomulyo",
    kabupaten: "Kab. Magelang",
    provinsi: "Jawa Tengah",
    warna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-sidodadi",
    nama: "Koperasi Desa Merah Putih Sidodadi",
    desa: "Sidodadi",
    kabupaten: "Kab. Malang",
    provinsi: "Jawa Timur",
    warna: "hijau",
    temuanCount: 1,
  },
  {
    id: "kop-karangasem",
    nama: "Koperasi Desa Merah Putih Karangasem",
    desa: "Karangasem",
    kabupaten: "Kab. Karangasem",
    provinsi: "Bali",
    warna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-mattirowalie",
    nama: "Koperasi Desa Merah Putih Mattiro Walie",
    desa: "Mattiro Walie",
    kabupaten: "Kab. Wajo",
    provinsi: "Sulawesi Selatan",
    warna: "hijau",
    temuanCount: 0,
  },
];

const DEPAN = [
  "Ahmad",
  "Siti",
  "Eko",
  "Rina",
  "Joko",
  "Sri",
  "Agus",
  "Wati",
  "Hendra",
  "Yuni",
  "Bambang",
  "Ani",
  "Dedi",
  "Nur",
  "Rudi",
  "Lina",
  "Asep",
  "Tuti",
  "Wawan",
  "Ida",
  "Iwan",
  "Endang",
  "Slamet",
  "Umi",
  "Tono",
  "Ratna",
  "Gunawan",
  "Yanti",
  "Rahmat",
  "Mega",
];
const BELAKANG = [
  "Santoso",
  "Wijaya",
  "Kusuma",
  "Pratama",
  "Halim",
  "Saputra",
  "Nugroho",
  "Permata",
  "Hidayat",
  "Maulana",
  "Sanjaya",
  "Utami",
];

// Template temuan generik untuk 11 koperasi ringkas. Register 6.8: pertanyaan
// diakhiri "?", tanpa kosakata vonis, tanpa em dash, tanpa emoji.
const GENERIK_MERAH = {
  agent: "konflik_kepentingan" as const,
  judul: "Pembelian besar yang perlu penjelasan pengurus",
  penjelasanAwam:
    "Ada satu pembelian bernilai besar bulan ini yang belum disertai keterangan pembanding harga.",
  kenapaPenting:
    "Uang koperasi adalah uang bersama. Pembelian besar sebaiknya dijelaskan agar anggota yakin harganya wajar.",
  pertanyaanRat:
    "Bisakah pengurus menjelaskan alasan dan harga pembelian besar bulan ini?",
  bukti: [
    {
      jenis: "transaksi",
      id: "ringkas-pembelian",
      label: "Pembelian besar bulan ini",
    },
  ],
};
const GENERIK_KUNING = [
  {
    agent: "anomali_transaksi" as const,
    judul: "Beberapa pinjaman disetujui dalam waktu berdekatan",
    penjelasanAwam:
      "Ada beberapa pinjaman yang disetujui dalam rentang waktu yang berdekatan bulan ini.",
    kenapaPenting:
      "Persetujuan yang menumpuk perlu dipastikan tetap melewati pemeriksaan yang teliti.",
    pertanyaanRat:
      "Bagaimana pemeriksaan dilakukan untuk pinjaman yang disetujui berdekatan itu?",
    bukti: [
      {
        jenis: "rasio",
        id: "ringkas-persetujuan",
        label: "Persetujuan pinjaman berdekatan",
      },
    ],
  },
  {
    agent: "kesehatan_finansial" as const,
    judul: "Kas koperasi menurun dibanding bulan sebelumnya",
    penjelasanAwam:
      "Saldo kas koperasi bulan ini lebih rendah daripada bulan sebelumnya.",
    kenapaPenting:
      "Penurunan kas perlu dijelaskan agar koperasi tetap mampu melayani anggota.",
    pertanyaanRat:
      "Apa penyebab penurunan kas bulan ini dan bagaimana rencana pemulihannya?",
    bukti: [{ jenis: "rasio", id: "ringkas-kas", label: "Saldo kas menurun" }],
  },
  {
    agent: "kepatuhan_proses" as const,
    judul: "Ada pinjaman dengan dokumen belum lengkap",
    penjelasanAwam:
      "Tercatat pinjaman yang dokumen persyaratannya belum lengkap.",
    kenapaPenting:
      "Kelengkapan dokumen menjaga agar keputusan pinjaman dapat dipertanggungjawabkan.",
    pertanyaanRat:
      "Kapan dokumen pinjaman yang belum lengkap itu akan dilengkapi?",
    bukti: [
      {
        jenis: "pinjaman",
        id: "ringkas-dokumen",
        label: "Pinjaman dokumen belum lengkap",
      },
    ],
  },
  {
    agent: "anomali_transaksi" as const,
    judul: "Pembelian berulang ke pemasok yang sama",
    penjelasanAwam:
      "Terdapat beberapa pembelian ke pemasok yang sama dalam waktu singkat.",
    kenapaPenting:
      "Pola pembelian berulang perlu ditanyakan agar tidak ada nilai yang terpecah tanpa pemeriksaan.",
    pertanyaanRat:
      "Mengapa pembelian ke pemasok yang sama dilakukan berulang dalam waktu singkat?",
    bukti: [
      {
        jenis: "transaksi",
        id: "ringkas-berulang",
        label: "Pembelian berulang ke pemasok sama",
      },
    ],
  },
];
const GENERIK_INFO = {
  agent: "kepatuhan_proses" as const,
  judul: "Rapat Anggota Tahunan belum dijadwalkan",
  penjelasanAwam:
    "Sampai bulan ini jadwal Rapat Anggota Tahunan belum ditetapkan.",
  kenapaPenting:
    "Rapat tahunan adalah ruang resmi anggota untuk bertanya dan mengambil keputusan bersama.",
  pertanyaanRat: "Kapan Rapat Anggota Tahunan akan dilaksanakan?",
  bukti: [
    { jenis: "jadwal", id: "ringkas-rat", label: "Jadwal RAT belum ada" },
  ],
};

export function buildSeedData(): SeedData {
  const rng = mulberry32(SEED);

  const anggotaIds = [
    "ang-juri",
    "ang-sari",
    ...Array.from({ length: 28 }, (_, i) => `ang-g${pad2(i + 1)}`),
  ];
  const anggotaExclJuri = anggotaIds.filter((id) => id !== "ang-juri");

  const koperasiRows: Row<typeof koperasi>[] = [
    {
      id: "kop-sukamaju",
      nama: "Koperasi Desa Merah Putih Sukamaju",
      desa: "Sukamaju",
      kabupaten: "Kab. Bandung",
      provinsi: "Jawa Barat",
      isDetailSeeded: true,
      saldoKas: 36_500_000,
      ratStatus: "belum",
      ratTanggal: null,
      dibentukPada: "2024-01-15",
    },
    ...KOPERASI_LAIN.map((k) => ({
      id: k.id,
      nama: k.nama,
      desa: k.desa,
      kabupaten: k.kabupaten,
      provinsi: k.provinsi,
      isDetailSeeded: false,
      saldoKas: 40_000_000 + intBetween(rng, 0, 40) * M,
      ratStatus: (k.warna === "hijau" ? "terlaksana" : "belum") as
        "belum" | "terlaksana",
      ratTanggal: k.warna === "hijau" ? "2026-02-20" : null,
      dibentukPada: "2024-01-15",
    })),
  ];

  const unitUsahaRows: Row<typeof unitUsaha>[] = [
    {
      id: "uu-gerai",
      koperasiId: "kop-sukamaju",
      nama: "Gerai Sembako",
      jenis: "sembako",
    },
    {
      id: "uu-sp",
      koperasiId: "kop-sukamaju",
      nama: "Unit Simpan Pinjam",
      jenis: "simpan_pinjam",
    },
    {
      id: "uu-apotek",
      koperasiId: "kop-sukamaju",
      nama: "Apotek Desa",
      jenis: "apotek",
    },
    {
      id: "uu-gudang",
      koperasiId: "kop-sukamaju",
      nama: "Gudang",
      jenis: "gudang",
    },
  ];

  const pengurusRows: Row<typeof pengurus>[] = [
    {
      id: "png-ketua",
      koperasiId: "kop-sukamaju",
      nama: "Haji Suhendar",
      jabatan: "ketua",
      alamat: "Jl. Mawar No. 3, Sukamaju",
    },
    {
      id: "png-wakil",
      koperasiId: "kop-sukamaju",
      nama: "Iwan Setiawan",
      jabatan: "wakil",
      alamat: "Jl. Anggrek No. 7, Sukamaju",
    },
    {
      id: "png-sekretaris",
      koperasiId: "kop-sukamaju",
      nama: "Dewi Lestari",
      jabatan: "sekretaris",
      alamat: "Jl. Kenanga No. 5, Sukamaju",
    },
    {
      id: "png-budi",
      koperasiId: "kop-sukamaju",
      nama: "Budi Santoso",
      jabatan: "bendahara",
      alamat: BUDI_ALAMAT,
    },
    {
      id: "png-pengawas",
      koperasiId: "kop-sukamaju",
      nama: "Kepala Desa Sukamaju",
      jabatan: "pengawas",
      alamat: "Kantor Desa Sukamaju",
    },
  ];

  const anggotaRows: Row<typeof anggota>[] = [];
  const simpananRows: Row<typeof simpanan>[] = [];
  anggotaIds.forEach((id, i) => {
    const nama =
      id === "ang-juri"
        ? "Rahmat Hidayat"
        : id === "ang-sari"
          ? "Sari Rahayu"
          : `${DEPAN[i % DEPAN.length]} ${BELAKANG[i % BELAKANG.length]}`;
    const monthsAgo = id === "ang-juri" ? 7 : intBetween(rng, 6, 28);
    const nik = `32${Array.from({ length: 14 }, () => intBetween(rng, 0, 9)).join("")}`;
    anggotaRows.push({
      id,
      koperasiId: "kop-sukamaju",
      nama,
      nik,
      noAnggota: `KDS-${String(i + 1).padStart(4, "0")}`,
      alamat: `Kampung Sukamaju RT ${pad2(intBetween(rng, 1, 8))} RW ${pad2(intBetween(rng, 1, 4))}`,
      bergabungPada: bergabung(monthsAgo),
    });
    const sukarela =
      id === "ang-juri" ? 150_000 : intBetween(rng, 0, 50) * 10_000;
    simpananRows.push(
      { id: `simp-${id}-pokok`, anggotaId: id, jenis: "pokok", saldo: 100_000 },
      {
        id: `simp-${id}-wajib`,
        anggotaId: id,
        jenis: "wajib",
        saldo: 50_000 * monthsAgo,
      },
      {
        id: `simp-${id}-sukarela`,
        anggotaId: id,
        jenis: "sukarela",
        saldo: sukarela,
      },
    );
  });

  const pinjamanRows: Row<typeof pinjaman>[] = [
    {
      id: "pj-juri",
      anggotaId: "ang-juri",
      pokok: 2_400_000,
      sisa: 1_200_000,
      cicilanBulanan: 200_000,
      jatuhTempoBerikut: "2026-07-05",
      disetujuiPada: "2025-12-05",
      disetujuiOleh: "png-budi",
      dokumenLengkap: true,
    },
    {
      id: "pj-sari",
      anggotaId: "ang-sari",
      pokok: 2_400_000,
      sisa: 1_200_000,
      cicilanBulanan: 200_000,
      jatuhTempoBerikut: "2026-07-05",
      disetujuiPada: "2025-12-05",
      disetujuiOleh: "png-budi",
      dokumenLengkap: true,
    },
    {
      id: "pj-an5",
      anggotaId: "ang-g01",
      pokok: 12_000_000,
      sisa: 12_000_000,
      cicilanBulanan: 1_000_000,
      jatuhTempoBerikut: "2026-07-10",
      disetujuiPada: "2026-06-15",
      disetujuiOleh: "png-budi",
      dokumenLengkap: false,
    },
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `pj-an2-${i + 1}`,
      anggotaId: `ang-g${pad2(i + 2)}`,
      pokok: 6_000_000,
      sisa: 6_000_000,
      cicilanBulanan: 500_000,
      jatuhTempoBerikut: "2026-07-20",
      disetujuiPada: "2026-06-20",
      disetujuiOleh: "png-budi",
      dokumenLengkap: true,
    })),
    {
      id: "pj-gen-1",
      anggotaId: "ang-g07",
      pokok: 3_000_000,
      sisa: 1_500_000,
      cicilanBulanan: 300_000,
      jatuhTempoBerikut: "2026-07-08",
      disetujuiPada: "2026-03-08",
      disetujuiOleh: "png-budi",
      dokumenLengkap: true,
    },
    {
      id: "pj-lunas-1",
      anggotaId: "ang-g08",
      pokok: 2_000_000,
      sisa: 0,
      cicilanBulanan: 200_000,
      jatuhTempoBerikut: "2026-06-01",
      disetujuiPada: "2025-06-01",
      disetujuiOleh: "png-budi",
      dokumenLengkap: true,
    },
    {
      id: "pj-lunas-2",
      anggotaId: "ang-g09",
      pokok: 1_500_000,
      sisa: 0,
      cicilanBulanan: 150_000,
      jatuhTempoBerikut: "2026-05-01",
      disetujuiPada: "2025-05-01",
      disetujuiOleh: "png-budi",
      dokumenLengkap: true,
    },
    {
      id: "pj-tunggak-1",
      anggotaId: "ang-g10",
      pokok: 4_000_000,
      sisa: 2_000_000,
      cicilanBulanan: 400_000,
      jatuhTempoBerikut: "2026-05-10",
      disetujuiPada: "2025-10-10",
      disetujuiOleh: "png-budi",
      dokumenLengkap: true,
    },
  ];

  const MONTHS = [
    {
      p: "2026-01",
      angsuran: 12,
      penjualan: 8,
      pembelian: [1, 1, 1, 1, 1],
      pencairan: 2,
      operasional: 2,
      delta: 2 * M,
    },
    {
      p: "2026-02",
      angsuran: 13,
      penjualan: 8,
      pembelian: [1, 1, 1, 1],
      pencairan: 1,
      operasional: 2,
      delta: 2.5 * M,
    },
    {
      p: "2026-03",
      angsuran: 14,
      penjualan: 9,
      pembelian: [1, 1, 1, 1, 1],
      pencairan: 2,
      operasional: 2,
      delta: 1.5 * M,
    },
    {
      p: "2026-04",
      angsuran: 14,
      penjualan: 10,
      pembelian: [1, 1, 1, 1, 1],
      pencairan: 2,
      operasional: 3,
      delta: 2 * M,
    },
    {
      p: "2026-05",
      angsuran: 12,
      penjualan: 9,
      pembelian: [4, 4, 4, 2, 2],
      pencairan: 1,
      operasional: 2,
      delta: -10.5 * M,
    },
    {
      p: "2026-06",
      angsuran: 16,
      penjualan: 12,
      pembelian: [1, 1, 1],
      pencairan: 1,
      operasional: 3,
      delta: -11 * M,
    },
  ];

  const transaksiRows: Row<typeof transaksi>[] = [];
  const day = (periode: string) => `${periode}-${pad2(intBetween(rng, 1, 28))}`;
  let seq = 0;
  const tid = (periode: string) =>
    `trx-${periode.replace("-", "")}-${pad2(++seq)}`;

  MONTHS.forEach((mo, idx) => {
    const bulanName = NAMA_BULAN[idx]!;
    let net = 0;
    const push = (r: Row<typeof transaksi>) => {
      transaksiRows.push(r);
      net += r.arah === "masuk" ? r.jumlah : -r.jumlah;
    };
    for (const aid of anggotaIds) {
      push({
        id: tid(mo.p),
        koperasiId: "kop-sukamaju",
        unitUsahaId: "uu-sp",
        tanggal: day(mo.p),
        jenis: "setoran_simpanan",
        arah: "masuk",
        jumlah: 50_000,
        deskripsi: "Setoran simpanan wajib anggota",
        vendorNama: null,
        vendorAlamat: null,
        anggotaId: aid,
      });
    }
    for (let g = 0; g < 5; g++) {
      push({
        id: tid(mo.p),
        koperasiId: "kop-sukamaju",
        unitUsahaId: null,
        tanggal: day(mo.p),
        jenis: "gaji",
        arah: "keluar",
        jumlah: 500_000,
        deskripsi: `Honor pengurus bulan ${bulanName}`,
        vendorNama: null,
        vendorAlamat: null,
        anggotaId: null,
      });
    }
    for (let a = 0; a < mo.angsuran; a++) {
      push({
        id: tid(mo.p),
        koperasiId: "kop-sukamaju",
        unitUsahaId: "uu-sp",
        tanggal: day(mo.p),
        jenis: "angsuran",
        arah: "masuk",
        jumlah: 250_000,
        deskripsi: "Angsuran pinjaman anggota",
        vendorNama: null,
        vendorAlamat: null,
        anggotaId: pick(rng, anggotaIds),
      });
    }
    for (const amt of mo.pembelian) {
      push({
        id: tid(mo.p),
        koperasiId: "kop-sukamaju",
        unitUsahaId: "uu-gudang",
        tanggal: day(mo.p),
        jenis: "pembelian",
        arah: "keluar",
        jumlah: amt * M,
        deskripsi: "Pembelian stok barang gerai",
        vendorNama: pick(rng, ["UD Sejahtera", "Toko Makmur", "CV Andalan"]),
        vendorAlamat: "Pasar Sukamaju",
        anggotaId: null,
      });
    }
    for (let c = 0; c < mo.pencairan; c++) {
      push({
        id: tid(mo.p),
        koperasiId: "kop-sukamaju",
        unitUsahaId: "uu-sp",
        tanggal: day(mo.p),
        jenis: "pencairan_pinjaman",
        arah: "keluar",
        jumlah: 2 * M,
        deskripsi: "Pencairan pinjaman anggota",
        vendorNama: null,
        vendorAlamat: null,
        anggotaId: pick(rng, anggotaIds),
      });
    }
    for (let o = 0; o < mo.operasional; o++) {
      push({
        id: tid(mo.p),
        koperasiId: "kop-sukamaju",
        unitUsahaId: null,
        tanggal: day(mo.p),
        jenis: "operasional",
        arah: "keluar",
        jumlah: 300_000,
        deskripsi: "Biaya operasional koperasi",
        vendorNama: null,
        vendorAlamat: null,
        anggotaId: null,
      });
    }
    if (mo.p === "2026-06") {
      push({
        id: "trx-an1",
        koperasiId: "kop-sukamaju",
        unitUsahaId: "uu-gerai",
        tanggal: "2026-06-14",
        jenis: "pembelian",
        arah: "keluar",
        jumlah: 15 * M,
        deskripsi: "Pembelian peralatan dari Toko Berkah",
        vendorNama: "Toko Berkah",
        vendorAlamat: BUDI_ALAMAT,
        anggotaId: null,
      });
      ["2026-06-09", "2026-06-11", "2026-06-13"].forEach((d, i) => {
        push({
          id: `trx-an3-${i + 1}`,
          koperasiId: "kop-sukamaju",
          unitUsahaId: "uu-gudang",
          tanggal: d,
          jenis: "pembelian",
          arah: "keluar",
          jumlah: 4_900_000,
          deskripsi: "Pembelian barang dari CV Sumber Rejeki",
          vendorNama: "CV Sumber Rejeki",
          vendorAlamat: "Jl. Industri No. 8, Bandung",
          anggotaId: null,
        });
      });
      for (let i = 0; i < 5; i++) {
        push({
          id: `trx-an2-${i + 1}`,
          koperasiId: "kop-sukamaju",
          unitUsahaId: "uu-sp",
          tanggal: "2026-06-20",
          jenis: "pencairan_pinjaman",
          arah: "keluar",
          jumlah: 6 * M,
          deskripsi: "Pencairan pinjaman program musim tanam",
          vendorNama: null,
          vendorAlamat: null,
          anggotaId: `ang-g${pad2(i + 2)}`,
        });
      }
    }
    const penjualanTotal = mo.delta - net;
    if (penjualanTotal <= 0)
      throw new Error(`penjualan ${mo.p} non-positif: ${penjualanTotal}`);
    splitAmount(rng, penjualanTotal, mo.penjualan).forEach((amt, i) => {
      const apotek = i % 3 === 0;
      push({
        id: tid(mo.p),
        koperasiId: "kop-sukamaju",
        unitUsahaId: apotek ? "uu-apotek" : "uu-gerai",
        tanggal: day(mo.p),
        jenis: "penjualan",
        arah: "masuk",
        jumlah: amt,
        deskripsi: apotek ? "Penjualan apotek desa" : "Penjualan gerai sembako",
        vendorNama: null,
        vendorAlamat: null,
        anggotaId: null,
      });
    });
  });

  const auditRunRows: Row<typeof auditRun>[] = [];
  const temuanRows: Row<typeof temuan>[] = [];
  const SUKAMAJU_TREN = [
    "hijau",
    "hijau",
    "hijau",
    "kuning",
    "kuning",
    "merah",
  ] as const;
  const rawSeed = JSON.stringify({
    source: "seed",
    metadata: { agenGagal: [] },
  });

  MONTHS.forEach((mo, idx) => {
    const warna = SUKAMAJU_TREN[idx]!;
    const id = `ar-sukamaju-${mo.p}`;
    const isJun = mo.p === "2026-06";
    auditRunRows.push({
      id,
      koperasiId: "kop-sukamaju",
      periode: mo.p,
      source: "seed",
      verdictWarna: warna,
      ringkasan: isJun
        ? RINGKASAN_MERAH
        : RINGKASAN_LIVE[warna === "merah" ? "kuning" : warna],
      durasiMs: 1500,
      rawJson: rawSeed,
      dibuatPada: `${mo.p}-28T09:00:00.000Z`,
    });
    if (isJun) {
      for (const anomali of URUTAN_TAMPIL) {
        const f = TEMUAN_SEED.find((x) => x.id === anomali)!;
        temuanRows.push({
          id: `tmn-${anomali}`,
          auditRunId: id,
          agent: f.agent,
          severity: f.severity,
          judul: f.judul,
          penjelasanAwam: f.penjelasan_awam,
          kenapaPenting: f.kenapa_penting,
          pertanyaanRat: f.pertanyaan_rat,
          buktiJson: JSON.stringify(f.bukti),
          tanggapanPengurus: f.tanggapan_pengurus ?? null,
        });
      }
    }
  });

  for (const k of KOPERASI_LAIN) {
    const id = `ar-${k.id}-2026-06`;
    auditRunRows.push({
      id,
      koperasiId: k.id,
      periode: "2026-06",
      source: "seed",
      verdictWarna: k.warna,
      ringkasan:
        k.warna === "merah"
          ? RINGKASAN_MERAH
          : k.warna === "kuning"
            ? RINGKASAN_LIVE.kuning
            : RINGKASAN_LIVE.hijau,
      durasiMs: 1500,
      rawJson: rawSeed,
      dibuatPada: "2026-06-28T09:00:00.000Z",
    });
    type Gen =
      | typeof GENERIK_MERAH
      | (typeof GENERIK_KUNING)[number]
      | typeof GENERIK_INFO;
    const picks: Gen[] = [];
    if (k.warna === "merah") {
      picks.push(GENERIK_MERAH);
      for (let i = 0; i < k.temuanCount - 1; i++)
        picks.push(GENERIK_KUNING[i % GENERIK_KUNING.length]!);
    } else if (k.warna === "kuning") {
      for (let i = 0; i < k.temuanCount; i++)
        picks.push(GENERIK_KUNING[i % GENERIK_KUNING.length]!);
    } else if (k.temuanCount > 0) {
      picks.push(GENERIK_INFO);
    }
    picks.forEach((t, i) => {
      const severity =
        t === GENERIK_MERAH ? "merah" : t === GENERIK_INFO ? "info" : "kuning";
      temuanRows.push({
        id: `tmn-${k.id}-${i + 1}`,
        auditRunId: id,
        agent: t.agent,
        severity,
        judul: t.judul,
        penjelasanAwam: t.penjelasanAwam,
        kenapaPenting: t.kenapaPenting,
        pertanyaanRat: t.pertanyaanRat,
        buktiJson: JSON.stringify(t.bukti),
        tanggapanPengurus: null,
      });
    });
  }

  // -------------------------------------------------------------------------
  // Riwayat audit Jan-Mei 2026 (fondasi data M3-3). APPEND: run/temuan Juni
  // existing tak disentuh. Trajektori verdict deterministik per koperasi;
  // indeks 5 (Juni) == verdict Juni existing agar tidak bentrok. Temuan nyata
  // dari template generik (register-clean, sama seperti run Juni) supaya
  // dropdown periode benar-benar mengubah angka. Tanpa RNG (urutan stabil).
  // -------------------------------------------------------------------------
  const TREN_BULANAN: Record<
    string,
    readonly ("hijau" | "kuning" | "merah")[]
  > = {
    "kop-sukamaju": ["hijau", "hijau", "hijau", "kuning", "kuning", "merah"],
    "kop-lembahsari": [
      "kuning",
      "kuning",
      "kuning",
      "kuning",
      "merah",
      "merah",
    ],
    "kop-cempakawangi": [
      "kuning",
      "kuning",
      "kuning",
      "kuning",
      "kuning",
      "kuning",
    ],
    "kop-wanasaba": ["hijau", "hijau", "kuning", "kuning", "kuning", "kuning"],
    "kop-batulicin": ["hijau", "hijau", "hijau", "kuning", "kuning", "kuning"],
    "kop-airmolek": [
      "kuning",
      "kuning",
      "kuning",
      "kuning",
      "kuning",
      "kuning",
    ],
    "kop-mekarsari": ["hijau", "hijau", "hijau", "hijau", "hijau", "hijau"],
    "kop-tirtayasa": ["hijau", "hijau", "hijau", "hijau", "hijau", "hijau"],
    "kop-argomulyo": ["hijau", "hijau", "hijau", "hijau", "hijau", "hijau"],
    "kop-sidodadi": ["hijau", "hijau", "hijau", "hijau", "hijau", "hijau"],
    "kop-karangasem": ["hijau", "hijau", "hijau", "hijau", "hijau", "hijau"],
    "kop-mattirowalie": ["hijau", "hijau", "hijau", "hijau", "hijau", "hijau"],
  };
  // Temuan generik per verdict riwayat: hijau 0; kuning = anomali_transaksi +
  // kesehatan_finansial; merah = satu tiap agen.
  type GenTemuan =
    | typeof GENERIK_MERAH
    | (typeof GENERIK_KUNING)[number]
    | typeof GENERIK_INFO;
  const temuanRiwayat = (warna: "hijau" | "kuning" | "merah"): GenTemuan[] => {
    if (warna === "hijau") return [];
    if (warna === "kuning") return [GENERIK_KUNING[0]!, GENERIK_KUNING[1]!];
    return [
      GENERIK_MERAH,
      GENERIK_KUNING[0]!,
      GENERIK_KUNING[1]!,
      GENERIK_KUNING[2]!,
    ];
  };
  for (const kop of koperasiRows) {
    const tren = TREN_BULANAN[kop.id]!;
    // Sukamaju sudah punya run Jan-Mei (loop MONTHS); hanya append temuannya.
    // 11 koperasi lain hanya punya run Juni, jadi append run riwayat + temuan.
    for (let idx = 0; idx < 5; idx++) {
      const periode = MONTHS[idx]!.p;
      const warna = tren[idx]!;
      const runId =
        kop.id === "kop-sukamaju"
          ? `ar-sukamaju-${periode}`
          : `ar-${kop.id}-${periode}`;
      if (kop.id !== "kop-sukamaju") {
        auditRunRows.push({
          id: runId,
          koperasiId: kop.id,
          periode,
          source: "seed",
          verdictWarna: warna,
          ringkasan: RINGKASAN_LIVE[warna === "merah" ? "kuning" : warna],
          durasiMs: 1500,
          rawJson: rawSeed,
          dibuatPada: `${periode}-28T09:00:00.000Z`,
        });
      }
      temuanRiwayat(warna).forEach((t, i) => {
        const severity =
          t === GENERIK_MERAH
            ? "merah"
            : t === GENERIK_INFO
              ? "info"
              : "kuning";
        temuanRows.push({
          id: `tmn-${kop.id}-${periode}-${i + 1}`,
          auditRunId: runId,
          agent: t.agent,
          severity,
          judul: t.judul,
          penjelasanAwam: t.penjelasanAwam,
          kenapaPenting: t.kenapaPenting,
          pertanyaanRat: t.pertanyaanRat,
          buktiJson: JSON.stringify(t.bukti),
          tanggapanPengurus: null,
        });
      });
    }
  }

  const pertanyaanRatRows: Row<typeof pertanyaanRat>[] = [];
  const agregat: [string, number][] = [
    ["tmn-an1", SEED_AGREGAT.an1!],
    ["tmn-an4", SEED_AGREGAT.an4!],
    ["tmn-an2", SEED_AGREGAT.an2!],
  ];
  for (const [temuanId, jumlah] of agregat) {
    for (let i = 0; i < jumlah; i++) {
      pertanyaanRatRows.push({
        id: `prat-${temuanId}-${pad2(i + 1)}`,
        temuanId,
        anggotaId: anggotaExclJuri[i]!,
        ditambahkanPada: "2026-06-25T10:00:00.000Z",
      });
    }
  }

  const keputusanRows: Row<typeof keputusan>[] = [
    {
      id: "kpts-freezer",
      koperasiId: "kop-sukamaju",
      judul: "Pembelian freezer untuk gerai sembako",
      deskripsi:
        "Pengurus mengusulkan pembelian satu unit freezer untuk gerai sembako senilai Rp 8.500.000. Anda dapat menyatakan setuju atau tidak.",
      nominal: 8_500_000,
      status: "terbuka",
      dibukaPada: "2026-06-10T09:00:00.000Z",
    },
  ];
  const voteRows: Row<typeof vote>[] = Array.from({ length: 12 }, (_, i) => ({
    id: `vote-${pad2(i + 1)}`,
    keputusanId: "kpts-freezer",
    anggotaId: anggotaExclJuri[i]!,
    pilihan: (i < 9 ? "setuju" : "tidak") as "setuju" | "tidak",
  }));

  const notifTeks = COPY["notif.template"].replace("{n}", "5");
  const notifikasiRows: Row<typeof notifikasi>[] = [
    {
      id: "notif-ang-juri",
      anggotaId: "ang-juri",
      teks: notifTeks,
      dibacaPada: null,
      dibuatPada: "2026-06-25T08:00:00.000Z",
    },
    {
      id: "notif-ang-sari",
      anggotaId: "ang-sari",
      teks: notifTeks,
      dibacaPada: null,
      dibuatPada: "2026-06-25T08:00:00.000Z",
    },
  ];

  const usersRows: Row<typeof users>[] = [
    {
      id: "usr-juri-anggota",
      email: "juri.anggota@pramana.id",
      passwordHash: hash("PramanaJuri2026"),
      role: "anggota",
      anggotaId: "ang-juri",
      pengurusId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-juri-pemerintah",
      email: "juri.pemerintah@pramana.id",
      passwordHash: hash("PramanaJuri2026"),
      role: "pemerintah",
      anggotaId: null,
      pengurusId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-sari",
      email: "sari@pramana.id",
      passwordHash: hash("SariSukamaju1"),
      role: "anggota",
      anggotaId: "ang-sari",
      pengurusId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-bendahara",
      email: "bendahara@pramana.id",
      passwordHash: hash("PramanaBendahara2026"),
      role: "pengurus",
      anggotaId: null,
      pengurusId: "png-budi",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  return {
    koperasi: koperasiRows,
    unitUsaha: unitUsahaRows,
    pengurus: pengurusRows,
    anggota: anggotaRows,
    simpanan: simpananRows,
    pinjaman: pinjamanRows,
    transaksi: transaksiRows,
    auditRun: auditRunRows,
    temuan: temuanRows,
    pertanyaanRat: pertanyaanRatRows,
    keputusan: keputusanRows,
    vote: voteRows,
    notifikasi: notifikasiRows,
    users: usersRows,
  };
}
