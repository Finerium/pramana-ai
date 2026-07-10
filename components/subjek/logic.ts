/**
 * Logika murni Konsol Simulasi Pembukuan (unit h): format, derivasi arah,
 * validasi awam, payload preset beku, dan data seed fallback. Diuji di
 * app/(subjek)/logic.test.ts. Pesan validasi diambil dari lib/copy/subjek
 * (register 6.8). Impor relatif: vitest tidak memetakan alias "@/".
 */
import { SUBJEK_COPY } from "../../lib/copy/subjek";

export type AnggotaOption = { value: string; label: string };
export type SyncStatus = "menunggu" | "tersinkron";
export type RatStatus = "belum" | "terlaksana";

export type TransaksiForm = {
  jenis: string;
  jumlah: string;
  tanggal: string;
  unitUsaha: string;
  vendorNama: string;
  vendorAlamat: string;
  anggota: string;
  deskripsi: string;
};
export type PinjamanForm = {
  anggota: string;
  disetujuiOleh: string;
  pokok: string;
  cicilan: string;
  jatuhTempo: string;
  dokumenLengkap: boolean;
};
export type RatForm = { status: RatStatus; tanggal: string };

export type TransaksiEntry = {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  pihak: string;
  sync: SyncStatus;
};
export type PinjamanEntry = {
  id: string;
  anggota: string;
  pokok: number;
  cicilan: number;
  jatuhTempo: string;
  dokumenLengkap: boolean;
  sync: SyncStatus;
};
export type RecentData = {
  saldoKas: number;
  transaksi: TransaksiEntry[];
  pinjaman: PinjamanEntry[];
  ratStatus: RatStatus;
  ratTanggal: string | null;
  anggota: AnggotaOption[];
};

const BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** "Rp 15.000.000" (id-ID grouping, spasi setelah Rp). Deterministik, tanpa ICU. */
export function formatRp(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return "Rp " + (n < 0 ? "-" : "") + grouped;
}

/**
 * Waktu relatif Bahasa Indonesia untuk riwayat pemeriksaan ("baru saja",
 * "5 menit lalu", "kemarin"). `now` disuntik agar deterministik dan teruji.
 * ponytail: token waktu inline seperti BULAN di atas; pindah ke copy hanya bila
 * register hook memintanya.
 */
export function waktuRelatif(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const detik = Math.max(0, Math.floor((now - t) / 1000));
  if (detik < 60) return "baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari === 1) return "kemarin";
  if (hari < 30) return `${hari} hari lalu`;
  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return `${bulan} bulan lalu`;
  return `${Math.floor(hari / 365)} tahun lalu`;
}

/** "2026-06-14" -> "14 Jun 2026"; kosong -> "". */
export function formatTanggal(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const [y, m, dd] = parts as [string, string, string];
  const mo = BULAN[parseInt(m, 10) - 1] ?? m;
  return `${parseInt(dd, 10)} ${mo} ${y}`;
}

export const ARAH_MASUK: ReadonlySet<string> = new Set([
  "setoran_simpanan",
  "penjualan",
  "angsuran",
]);

export function deriveArah(jenis: string): "masuk" | "keluar" {
  return ARAH_MASUK.has(jenis) ? "masuk" : "keluar";
}

export function hitungSaldoBaru(
  saldo: number,
  jenis: string,
  jumlah: number,
): number {
  return saldo + (deriveArah(jenis) === "masuk" ? jumlah : -jumlah);
}

export function isRawAmountValid(raw: string): boolean {
  return /^\d+$/.test(raw) && parseInt(raw, 10) > 0;
}

export function validateTransaksi(
  f: TransaksiForm,
): Partial<Record<keyof TransaksiForm, string>> {
  const e: Partial<Record<keyof TransaksiForm, string>> = {};
  const err = SUBJEK_COPY.err;
  if (!f.jumlah) e.jumlah = err.jumlahKosong;
  else if (!isRawAmountValid(f.jumlah)) e.jumlah = err.jumlahInvalid;
  if (!f.tanggal) e.tanggal = err.tanggalKosong;
  if (!f.deskripsi || !f.deskripsi.trim()) e.deskripsi = err.deskripsiKosong;
  if (f.jenis === "pembelian") {
    if (!f.unitUsaha) e.unitUsaha = err.unitKosong;
    if (!f.vendorNama || !f.vendorNama.trim())
      e.vendorNama = err.vendorNamaKosong;
    if (!f.vendorAlamat || !f.vendorAlamat.trim())
      e.vendorAlamat = err.vendorAlamatKosong;
  }
  return e;
}

export function validatePinjaman(
  f: PinjamanForm,
): Partial<Record<keyof PinjamanForm, string>> {
  const e: Partial<Record<keyof PinjamanForm, string>> = {};
  const err = SUBJEK_COPY.err;
  if (!f.anggota) e.anggota = err.anggotaKosong;
  if (!f.disetujuiOleh) e.disetujuiOleh = err.disetujuiKosong;
  if (!f.pokok) e.pokok = err.pokokKosong;
  else if (!isRawAmountValid(f.pokok)) e.pokok = err.pokokInvalid;
  if (!f.cicilan) e.cicilan = err.cicilanKosong;
  else if (!isRawAmountValid(f.cicilan)) e.cicilan = err.cicilanInvalid;
  if (!f.jatuhTempo) e.jatuhTempo = err.jatuhTempoKosong;
  return e;
}

/**
 * Preset plafon memilih anggota deterministik: opsi pertama yang bukan
 * placeholder, bukan Sari, bukan akun juri (F-08 bind daftar anggota nyata DB).
 */
export function firstPresetAnggota(options: AnggotaOption[]): string {
  const hit = options.find(
    (o) =>
      o.value &&
      o.value !== "ang-juri" &&
      o.value !== "ang-sari" &&
      o.label !== "Sari Rahayu",
  );
  return hit ? hit.value : "";
}

export function emptyTransaksi(): TransaksiForm {
  return {
    jenis: "pembelian",
    jumlah: "",
    tanggal: "",
    unitUsaha: "",
    vendorNama: "",
    vendorAlamat: "",
    anggota: "",
    deskripsi: "",
  };
}
export function emptyPinjaman(): PinjamanForm {
  return {
    anggota: "",
    disetujuiOleh: "",
    pokok: "",
    cicilan: "",
    jatuhTempo: "",
    dokumenLengkap: false,
  };
}

// ---- Payload preset beku (design-inventory section 5 + prototipe) ----------
export function presetKonflik(): TransaksiForm {
  return {
    jenis: "pembelian",
    jumlah: "15000000",
    tanggal: "2026-06-14",
    unitUsaha: "sembako",
    vendorNama: "Toko Berkah",
    vendorAlamat: "Jl. Melati No. 12, Sukamaju",
    anggota: "",
    deskripsi: "Pembelian perlengkapan gerai sembako",
  };
}
export function presetPecah(): TransaksiForm {
  return {
    jenis: "pembelian",
    jumlah: "4900000",
    tanggal: "2026-06-22",
    unitUsaha: "sembako",
    vendorNama: "CV Sumber Rejeki",
    vendorAlamat: "Jl. Raya Sukamaju No. 8",
    anggota: "",
    deskripsi: "Pembelian stok tahap ketiga minggu ini",
  };
}
export function presetKas(): TransaksiForm {
  return {
    jenis: "operasional",
    jumlah: "20000000",
    tanggal: "2026-06-25",
    unitUsaha: "",
    vendorNama: "",
    vendorAlamat: "",
    anggota: "",
    deskripsi: "Pengeluaran operasional besar akhir bulan",
  };
}
export function presetPlafon(anggota: AnggotaOption[]): PinjamanForm {
  return {
    anggota: firstPresetAnggota(anggota),
    disetujuiOleh: "bendahara",
    pokok: "12000000",
    cicilan: "1000000",
    jatuhTempo: "2026-07-20",
    dokumenLengkap: false,
  };
}

// ---- Data seed fallback (dipakai saat /api/subjek/recent tak tersedia) ------
// ponytail: seed = kebenaran visual prototipe + jaring demo-proof (aturan 7).
// Saat modul API /api/subjek/* mendarat, jalur live otomatis menggantikan.
export const SEED_SALDO = 36_500_000;

export const SEED_ANGGOTA: AnggotaOption[] = [
  { value: "ang-juri", label: "Rahmat Hidayat" },
  { value: "ang-sari", label: "Sari Rahayu" },
  { value: "ang-g01", label: "Eko Kusuma" },
  { value: "ang-g02", label: "Rina Pratama" },
  { value: "ang-g03", label: "Joko Halim" },
  { value: "ang-g04", label: "Sri Saputra" },
];

export const SEED_TRANSAKSI: TransaksiEntry[] = [
  {
    id: "s1",
    tanggal: "2026-06-20",
    jenis: "pencairan_pinjaman",
    jumlah: 6_000_000,
    pihak: "Rudi Hartono",
    sync: "tersinkron",
  },
  {
    id: "s2",
    tanggal: "2026-06-18",
    jenis: "penjualan",
    jumlah: 1_250_000,
    pihak: "Gerai Sembako",
    sync: "tersinkron",
  },
  {
    id: "s3",
    tanggal: "2026-06-14",
    jenis: "pembelian",
    jumlah: 15_000_000,
    pihak: "Toko Berkah",
    sync: "tersinkron",
  },
  {
    id: "s4",
    tanggal: "2026-06-12",
    jenis: "angsuran",
    jumlah: 200_000,
    pihak: "Sari Rahayu",
    sync: "tersinkron",
  },
  {
    id: "s5",
    tanggal: "2026-06-10",
    jenis: "gaji",
    jumlah: 2_500_000,
    pihak: "Budi Santoso",
    sync: "tersinkron",
  },
  {
    id: "s6",
    tanggal: "2026-06-08",
    jenis: "setoran_simpanan",
    jumlah: 50_000,
    pihak: "Dewi Lestari",
    sync: "tersinkron",
  },
];

export const SEED_PINJAMAN: PinjamanEntry[] = [
  {
    id: "p1",
    anggota: "Rudi Hartono",
    pokok: 12_000_000,
    cicilan: 1_000_000,
    jatuhTempo: "2026-07-20",
    dokumenLengkap: false,
    sync: "tersinkron",
  },
  {
    id: "p2",
    anggota: "Sari Rahayu",
    pokok: 2_000_000,
    cicilan: 200_000,
    jatuhTempo: "2026-07-05",
    dokumenLengkap: true,
    sync: "tersinkron",
  },
  {
    id: "p3",
    anggota: "Andi Pratama",
    pokok: 6_000_000,
    cicilan: 500_000,
    jatuhTempo: "2026-07-20",
    dokumenLengkap: true,
    sync: "tersinkron",
  },
];

export const SEED_RECENT: RecentData = {
  saldoKas: SEED_SALDO,
  transaksi: SEED_TRANSAKSI,
  pinjaman: SEED_PINJAMAN,
  ratStatus: "belum",
  ratTanggal: null,
  anggota: SEED_ANGGOTA,
};
