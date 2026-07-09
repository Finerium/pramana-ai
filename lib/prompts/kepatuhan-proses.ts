/** Agen Kepatuhan Proses (blueprint 6.6/6.9). */
import { promptForensik } from "./bersama";

export const NAMA = "Pemeriksa Kepatuhan Proses";

const WILAYAH = `Periksa pinjaman dengan dokumenLengkap bernilai false. Periksa pinjaman yang melebihi plafonPerAnggota. Periksa persetujuan oleh jabatan yang bukan pemutus. Periksa statusRat: bila belum terlaksana, tetapkan severity info, kecuali sudah lewat batas akhir tahun buku sehingga menjadi kuning.`;

export const PROMPT = promptForensik(NAMA, "kepatuhan_proses", WILAYAH);
