/**
 * Lapisan display-ref SIMKOPDES. Memproyeksikan primary key internal Pramana
 * yang stabil (kop-sukamaju, ang-sari, png-budi) ke BENTUK identifier kamus
 * data resmi SIMKOPDES (KOP-xxxx, 16-hex, NIK tersamarkan, kode_wilayah) secara
 * deterministik dan murni, TANPA mengubah PK. Alasan: PK internal dipertahankan
 * demi determinisme demo (reseed byte-identik) dan stabilitas selektor
 * e2e/deep-link (?open=tmn-an1); pada integrasi produksi PK diarahkan ke ref
 * SIMKOPDES asli sementara kontrak FORMAT ini sudah terpenuhi. Pemetaan lengkap:
 * docs/pemetaan-simkopdes.md.
 *
 * Hash FNV-1a murni (tanpa crypto) agar identik di server maupun browser dan
 * bebas Math.random/Date.now (kontrak determinisme seed).
 */

/** Hex deterministik sepanjang `len` dari string, kapital. */
function hashHex(input: string, len: number): string {
  let out = "";
  let salt = 0;
  while (out.length < len) {
    let h = (0x811c9dc5 ^ salt) >>> 0;
    const s = `${input}#${salt}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    out += h.toString(16).padStart(8, "0");
    salt++;
  }
  return out.slice(0, len).toUpperCase();
}

/** Digit desimal deterministik sepanjang `len` dari string. */
function hashDigits(input: string, len: number): string {
  const hex = hashHex(input, len * 2);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += (parseInt(hex[i * 2]! + hex[i * 2 + 1]!, 16) % 10).toString();
  }
  return out;
}

/** koperasi.id -> `KOP-` + 12 hex (SIMKOPDES koperasi_ref). */
export function koperasiRef(id: string): string {
  return `KOP-${hashHex(id, 12)}`;
}

/** anggota.id -> id unik 16 karakter (SIMKOPDES anggota_ref). */
export function anggotaRef(id: string): string {
  return hashHex(`anggota:${id}`, 16);
}

/** pengurus.id -> id unik 16 karakter (SIMKOPDES pengurus_ref). */
export function pengurusRef(id: string): string {
  return hashHex(`pengurus:${id}`, 16);
}

/** NIK -> dua digit awal + tengah bintang + dua digit akhir (32************01). */
export function maskNik(nik: string): string {
  if (nik.length <= 4) return nik;
  return nik.slice(0, 2) + "*".repeat(nik.length - 4) + nik.slice(-2);
}

/** No HP -> 08******7890 (dua awal + bintang + empat akhir). */
export function maskTelepon(telepon: string): string {
  if (telepon.length <= 6) return telepon;
  return (
    telepon.slice(0, 2) + "*".repeat(telepon.length - 6) + telepon.slice(-4)
  );
}

// Kode provinsi BPS (referensi_wilayah SIMKOPDES) untuk provinsi yang dipakai seed.
const KODE_PROVINSI: Record<string, string> = {
  "Sumatera Barat": "13",
  Riau: "14",
  Lampung: "18",
  "Jawa Barat": "32",
  "Jawa Tengah": "33",
  "Jawa Timur": "35",
  Banten: "36",
  Bali: "51",
  "Nusa Tenggara Barat": "52",
  "Kalimantan Selatan": "63",
  "Sulawesi Selatan": "73",
};

/**
 * kode_wilayah SIMKOPDES `PP.KK.CC.DDDD`: PP = kode BPS provinsi; KK (kabupaten),
 * CC (kecamatan), DDDD (desa) diturunkan deterministik. Proyeksi display; pada
 * integrasi produksi diganti kode wilayah resmi dari referensi_koperasi_wilayah.
 */
export function kodeWilayah(
  provinsi: string,
  kabupaten: string,
  desa: string,
): string {
  const pp = KODE_PROVINSI[provinsi] ?? "00";
  const kk = hashDigits(`kab:${provinsi}:${kabupaten}`, 2);
  const cc = hashDigits(`kec:${kabupaten}`, 2);
  const dddd = hashDigits(`desa:${kabupaten}:${desa}`, 4);
  return `${pp}.${kk}.${cc}.${dddd}`;
}

// Nama gerai resmi SIMKOPDES (referensi jenis gerai) per jenis unit usaha Pramana.
const LABEL_GERAI: Record<string, string> = {
  sembako: "Gerai Sembako Desa",
  simpan_pinjam: "Unit Simpan Pinjam",
  apotek: "Apotek Desa",
  klinik: "Gerai Klinik Desa",
  gudang: "Gerai Cold Storage",
  logistik: "Gerai Cold Chain",
  kantor: "Gerai Kantor Koperasi",
};

/** unit_usaha.jenis -> nama gerai resmi SIMKOPDES untuk tampilan. */
export function geraiLabel(jenis: string): string {
  return LABEL_GERAI[jenis] ?? jenis;
}
