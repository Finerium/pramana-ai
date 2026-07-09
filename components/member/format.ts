/**
 * Formatter murni surface anggota. Manual (tanpa toLocaleString) supaya
 * deterministik lintas ICU dan bisa di-TDD. Angka rupiah selalu titik ribuan,
 * "Rp 600.000"; nominal jt pakai koma desimal, "47,5 jt".
 */

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** "Rp 600.000"; negatif jadi "-Rp 11.000.000". */
export function fmtRp(v: number): string {
  const neg = v < 0;
  const grouped = Math.round(Math.abs(v))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-Rp " : "Rp ") + grouped;
}

/** Rupiah ke juta ringkas: 47500000 -> "47,5 jt". */
export function fmtJt(rupiah: number): string {
  return (rupiah / 1_000_000).toFixed(1).replace(".", ",") + " jt";
}

/** ISO "2026-07-05" -> "5 Juli 2026". String yang sudah diformat dilewatkan apa adanya. */
export function fmtTanggal(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${Number(d)} ${BULAN[Number(mo) - 1]} ${y}`;
}

/** Date -> "Kamis, 9 Juli 2026" (hari, tanggal, bulan, tahun). */
export function fmtTanggalPanjang(d: Date): string {
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** Jam 0-23 ke bagian salam. */
export function waktuSalam(hour: number): "pagi" | "siang" | "sore" | "malam" {
  if (hour < 11) return "pagi";
  if (hour < 15) return "siang";
  if (hour < 19) return "sore";
  return "malam";
}

/** Easing count-up (dipakai animasi angka; reduced-motion langsung p=1). */
export function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

/** Nilai count-up terbulat pada progres p (0..1); mendarat tepat di target. */
export function countAt(target: number, p: number): number {
  return Math.round(target * easeOutCubic(p));
}

/** NIK sah = tepat 16 digit. */
export function nikValid(nik: string): boolean {
  return /^[0-9]{16}$/.test(nik);
}

/** Sanitasi input NIK: hanya angka, maksimum 16. */
export function nikDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 16);
}

/** Lebar bar proporsional dengan lantai 3% agar nilai kecil tetap terlihat. */
export function barWidth(v: number, max: number): string {
  if (max <= 0) return "0%";
  return Math.max(3, Math.round((v / max) * 100)) + "%";
}

/** Tinggi bar kas proporsional tanpa lantai. */
export function kasHeight(v: number, max: number): string {
  if (max <= 0) return "0%";
  return Math.round((v / max) * 100) + "%";
}

/** ISO "2026-07-05" -> "5 Juli" (tanpa tahun; untuk baris cicilan ringkas). */
export function fmtTanggalPendek(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${BULAN[Number(m[2]) - 1]}`;
}
