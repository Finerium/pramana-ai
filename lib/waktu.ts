/**
 * Format tanggal/waktu WIB (Asia/Jakarta, UTC+7 tetap tanpa DST). timeZone
 * DIPATOK ke Asia/Jakarta supaya server (UTC) dan klien (zona apa pun) menghasil
 * string IDENTIK, jadi TIDAK ada hydration mismatch. Mengganti pemformatan lama
 * yang memakai timeZone "UTC": aksi larut malam WIB (mis. 01.42 WIB = 18.42 UTC
 * hari sebelumnya) dulu tampil mundur satu hari. Angka dipakai tabular-nums di
 * komponen. Sumber tunggal lintas empat surface.
 */
const TZ = "Asia/Jakarta";

/** "11 Juli 2026" (tanggal WIB). */
export function tanggalWIB(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
}

/** "YYYY-MM-DD" hari ini menurut WIB (batas atas validasi tanggal input). */
export function hariIniWIB(): string {
  // Locale en-CA menghasilkan format ISO YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** true bila string "YYYY-MM-DD" valid sebagai tanggal kalender nyata. */
export function tanggalIsoValid(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** "11 Juli 2026, 01.42 WIB" (tanggal + jam WIB, 24 jam). */
export function tanggalJamWIB(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(d);
  return `${tanggalWIB(iso)}, ${jam} WIB`;
}
