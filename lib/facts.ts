/**
 * Angka nasional untuk landing dan deck (ADR-12): setiap angka menyimpan
 * sumber dan tanggal supaya pitch tetap jujur dan pembaruan cukup satu tempat.
 * Landing dan deck WAJIB mengimpor dari sini, tidak menulis angka sendiri
 * (AC-E2E-06).
 */
export type Fact = {
  nilai: number;
  tampil: string;
  keterangan: string;
  sumber: string;
  tanggal: string;
};

export const FACTS: Record<
  "koperasiTotal" | "sudahRat" | "risikoKebocoran" | "geraiResmi",
  Fact
> = {
  koperasiTotal: {
    nilai: 83383,
    tampil: "83.383",
    keterangan: "koperasi desa Merah Putih terbentuk",
    sumber: "Simkopdes via Katadata",
    tanggal: "29 Juni 2026",
  },
  sudahRat: {
    nilai: 50383,
    tampil: "50.383",
    keterangan: "koperasi yang telah melaksanakan RAT",
    sumber: "Simkopdes via Katadata",
    tanggal: "29 Juni 2026",
  },
  risikoKebocoran: {
    nilai: 60000000,
    tampil: "Rp60 juta",
    keterangan: "perkiraan risiko kebocoran per unit per tahun",
    sumber: "Studi CELIOS",
    tanggal: "2026",
  },
  geraiResmi: {
    nilai: 7,
    tampil: "7",
    keterangan: "jenis gerai resmi KDMP",
    sumber: "Inpres 9/2025",
    tanggal: "2025",
  },
};
