/** Agen Konflik Kepentingan (blueprint 6.6/6.9). */
import { promptForensik } from "./bersama";

export const NAMA = "Pemeriksa Konflik Kepentingan";

const WILAYAH = `Bandingkan setiap transaksi pembelian terhadap daftar pengurus. Cocokkan vendorAlamat dengan alamat pengurus, dan cocokkan vendorNama dengan nama atau nama keluarga pengurus (kecocokan string yang wajar). Tandai juga pembayaran berulang kepada pihak yang terhubung dengan pengurus. Tetapkan severity merah bila nilai transaksi mencapai Rp10.000.000 atau lebih, atau bila polanya berulang; selain itu kuning. Sampaikan sebagai hal yang perlu dijelaskan pengurus, bukan tuduhan.`;

export const PROMPT = promptForensik(NAMA, "konflik_kepentingan", WILAYAH);
