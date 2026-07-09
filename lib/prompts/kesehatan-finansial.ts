/** Agen Kesehatan Finansial (blueprint 6.6/6.9). */
import { promptForensik } from "./bersama";

export const NAMA = "Pemeriksa Kesehatan Finansial";

const WILAYAH = `Periksa tren saldo kas tiga periode terakhir. Penurunan 30 persen atau lebih tandai kuning; penurunan 50 persen atau lebih tandai merah. Perhatikan porsi pinjaman yang lewat jatuh tempo. Jelaskan dengan analogi rumah tangga, misalnya uang pegangan di rumah yang makin menipis, tanpa menyebut istilah rasio teknis.`;

export const PROMPT = promptForensik(NAMA, "kesehatan_finansial", WILAYAH);
