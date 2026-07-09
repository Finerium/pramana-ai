# Pernyataan Penggunaan AI Generatif

Gagasan inti Pramana AI, yaitu konsep pengawas forensik multi-agent yang mengaudit koperasi
atas nama anggota dengan prinsip bertanya bukan menuduh, arsitektur empat agen pemeriksa plus
satu adjudikator, model tiga aktor (anggota dilayani, pemerintah mengawasi agregat, pengurus
sebagai pihak yang diaudit), serta seluruh keputusan produk dan narasi, adalah hasil pemikiran
asli Tim Daulat dan telah terdokumentasi sebelum pembangunan.

AI generatif digunakan sebagai alat bantu teknis sesuai ketentuan panitia:

1. Claude Opus 4.8 melalui Claude Code sebagai asisten implementasi kode, debugging,
   penulisan boilerplate, dan penyusunan dokumentasi teknis, di bawah spesifikasi dan
   arahan tim.
2. MiniMax (model MiniMax-M2.7) sebagai mesin runtime produk untuk menjalankan agen pemeriksa
   pada purwarupa; ini adalah komponen produk, setara pemakaian layanan API lainnya.
3. Riset pendukung dan perapian tata bahasa.
   Rincian per tahap tercatat pada .crown/ai-usage.md di repositori ini.

## Bagian karya yang dibantu AI

- Implementasi kode: seluruh kode aplikasi ditulis dengan bantuan Claude Opus 4.8 melalui
  Claude Code, mengikuti kontrak dan spesifikasi beku yang dirancang tim (blueprint section 6).
- Dokumentasi teknis: README, dokumen keputusan teknis, dan skrip verifikasi disusun dengan
  bantuan AI di bawah arahan tim.
- Runtime produk: agen pemeriksa dan adjudikator dijalankan oleh MiniMax-M2.7 saat audit
  langsung; pada mode demo, hasil berasal dari data seed deterministik tanpa panggilan model.

## Bagian yang murni karya tim

- Konsep produk, arsitektur agen, tipologi deteksi per agen, prinsip bertanya bukan menuduh,
  model tiga aktor, dan seluruh keputusan desain produk.
- Kurasi data sintetis, skenario demo, dan narasi pitch.

Referensi rinci per tahap pembangunan: [.crown/ai-usage.md](.crown/ai-usage.md).
