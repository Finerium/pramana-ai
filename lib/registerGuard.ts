/**
 * Validator keluaran bahasa model sebelum persist (blueprint 6.5).
 * Pramana bertanya, tidak menuduh: denylist kata vonis dengan allowlist pola
 * edukatif (maksimum satu kemunculan), pertanyaan_rat wajib kalimat tanya,
 * larangan em dash, emoji, dan sapaan "kamu" (register 6.8).
 *
 * Dipakai lib/audit sebagai dua pass: pada temuan forensik (pra-adjudikator)
 * dan pada hasil tulis ulang adjudikator (sebelum persist).
 */

export interface TemuanTeks {
  judul: string;
  penjelasan_awam: string;
  kenapa_penting: string;
  pertanyaan_rat: string;
}

export type GuardResult = { ok: true } | { ok: false; alasan: string[] };

// Kata vonis (6.5), dicek sebagai kata utuh, case-insensitive.
const VONIS = [
  "korupsi",
  "mencuri",
  "maling",
  "penipuan",
  "menggelapkan",
  "pelaku",
] as const;

const RE_VONIS = new RegExp(`\\b(?:${VONIS.join("|")})\\b`, "giu");
// Pola edukatif yang diizinkan: "disebut <vonis>" atau "berisiko <vonis>".
const RE_EDUKATIF = new RegExp(
  `\\b(?:disebut|berisiko)\\s+(?:${VONIS.join("|")})\\b`,
  "giu",
);

// Larangan karakter dash panjang (figure/en/em/horizontal bar). "em dash" 6.8.
const RE_DASH = /[‒–—―]/;
// Emoji dan piktograf.
const RE_EMOJI = /\p{Extended_Pictographic}/u;
// Sapaan "kamu" sebagai kata utuh (tidak menjaring "kamus").
const RE_KAMU = /\bkamu\b/iu;

/** Larangan register 6.8 lintas semua field teks. */
function periksaRegister(teks: string): string[] {
  const alasan: string[] = [];
  if (RE_DASH.test(teks))
    alasan.push("mengandung em dash; gunakan tanda baca biasa");
  if (RE_EMOJI.test(teks)) alasan.push("mengandung emoji; hapus emoji");
  if (RE_KAMU.test(teks)) alasan.push("memakai sapaan 'kamu'; gunakan 'Anda'");
  return alasan;
}

/**
 * Denylist vonis (6.5): setiap kemunculan kata vonis wajib berada dalam pola
 * edukatif ("disebut ..." / "berisiko ..."), dan pola edukatif maksimum satu
 * kali. Kemunculan telanjang atau lebih dari satu edukatif ditolak.
 */
function periksaVonis(teks: string): string[] {
  const semua = teks.match(RE_VONIS) ?? [];
  if (semua.length === 0) return [];
  const edukatif = teks.match(RE_EDUKATIF) ?? [];
  if (semua.length !== edukatif.length) {
    return [
      "kata vonis dipakai sebagai pernyataan; tulis sebagai hal yang perlu dijelaskan, bukan tuduhan",
    ];
  }
  if (edukatif.length > 1) {
    return ["pola edukatif kata vonis hanya boleh muncul satu kali"];
  }
  return [];
}

/**
 * pertanyaan_rat wajib berbentuk kalimat tanya (diakhiri "?") dan bukan
 * vonis. ponytail: deteksi "kalimat perintah" bersandar pada syarat "?"
 * (kalimat tanya yang benar bukan perintah); jika perlu deteksi imperatif
 * eksplisit, tambahkan daftar kata perintah di sini.
 */
function periksaPertanyaan(teks: string): string[] {
  const alasan: string[] = [];
  if (!teks.trimEnd().endsWith("?")) {
    alasan.push("pertanyaan_rat harus berupa kalimat tanya yang diakhiri '?'");
  }
  return alasan;
}

/** Periksa satu temuan (judul, penjelasan_awam, kenapa_penting, pertanyaan_rat). */
export function periksaTemuan(t: TemuanTeks): GuardResult {
  const alasan = [
    ...periksaRegister(t.judul),
    ...periksaRegister(t.penjelasan_awam),
    ...periksaVonis(t.penjelasan_awam),
    ...periksaRegister(t.kenapa_penting),
    ...periksaVonis(t.kenapa_penting),
    ...periksaRegister(t.pertanyaan_rat),
    ...periksaVonis(t.pertanyaan_rat),
    ...periksaPertanyaan(t.pertanyaan_rat),
  ];
  return alasan.length === 0 ? { ok: true } : { ok: false, alasan };
}

/** Periksa ringkasan verdict (satu kalimat). */
export function periksaRingkasan(ringkasan: string): GuardResult {
  const alasan = [...periksaRegister(ringkasan), ...periksaVonis(ringkasan)];
  return alasan.length === 0 ? { ok: true } : { ok: false, alasan };
}
