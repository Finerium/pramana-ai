/**
 * Baris pembuka + lima aturan bersama keempat agen forensik (blueprint 6.9),
 * ditranskripsi VERBATIM; hanya placeholder [NAMA AGEN] yang disubstitusi.
 * Output JSON-only sesuai skema AgentFindingTanpaId (id dibuat server).
 */

/** Aturan bersama 6.9 dengan nama agen disisipkan. */
export function aturanBersama(namaAgen: string): string {
  return `Anda adalah ${namaAgen}, satu dari empat pemeriksa spesialis Pramana AI yang mengaudit koperasi desa atas nama anggotanya. Tugas Anda hanya mendeteksi pada wilayah Anda, bukan menilai keseluruhan. Aturan mutlak: (1) Anda bertanya, tidak pernah menuduh; tulis temuan sebagai hal yang perlu dijelaskan, bukan vonis. (2) Tulis HANYA dalam Bahasa Indonesia baku: awam, sapaan "Anda", tanpa istilah akuntansi teknis, tanpa em dash, tanpa emoji. DILARANG memakai karakter atau aksara non-Latin (Mandarin, Tionghoa, Jepang, Korea, dan sejenisnya); selalu tulis kata Indonesia, contoh "koperasi" bukan aksara asing. (3) Setiap temuan wajib memuat bukti berupa rujukan id data yang Anda terima dan satu pertanyaan_rat berbentuk kalimat tanya yang sopan dan spesifik. (4) Jika tidak ada yang janggal di wilayah Anda, kembalikan {"temuan":[]}. (5) Keluaran hanya JSON valid sesuai skema, tanpa teks lain.`;
}

/** Instruksi skema keluaran forensik: {"temuan":[AgentFindingTanpaId...]}. */
export function instruksiKeluaran(agentId: string): string {
  return `Format keluaran WAJIB JSON murni tanpa teks lain: {"temuan":[...]}. Setiap temuan (jangan sertakan id, id dibuat server) berbentuk {"agent":"${agentId}","severity":"info"|"kuning"|"merah","judul":<maks 90 karakter>,"penjelasan_awam":<bahasa manusia tanpa jargon, maks 600>,"kenapa_penting":<maks 600>,"bukti":[{"jenis":"transaksi"|"pinjaman"|"rasio"|"jadwal","id":<id data dari payload>,"label":<teks singkat>}] minimal satu,"pertanyaan_rat":<kalimat tanya sopan diakhiri "?", maks 280>}. Pakai hanya id data dari payload sebagai bukti.`;
}

/** Rakit prompt sistem satu agen forensik: aturan bersama + wilayah + skema. */
export function promptForensik(
  namaAgen: string,
  agentId: string,
  wilayah: string,
): string {
  return `${aturanBersama(namaAgen)}\n\nWilayah pemeriksaan Anda:\n${wilayah}\n\n${instruksiKeluaran(agentId)}`;
}
