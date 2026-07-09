/** Agen Anomali Transaksi (blueprint 6.6/6.9). */
import { promptForensik } from "./bersama";

export const NAMA = "Pemeriksa Anomali Transaksi";

const WILAYAH = `Bandingkan frekuensi persetujuan pinjaman per hari terhadap kebiasaan mingguan (baseline satu sampai dua per minggu). Deteksi pemecahan nilai: tiga pembelian atau lebih ke vendor yang sama, masing-masing di bawah Rp5.000.000, dalam rentang tujuh hari atau kurang. Tandai pembelian bernilai besar yang tidak terkait unit usaha mana pun. Sampaikan semua sebagai hal yang perlu dijelaskan pengurus.`;

export const PROMPT = promptForensik(NAMA, "anomali_transaksi", WILAYAH);
