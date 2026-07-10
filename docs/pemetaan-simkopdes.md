# Pemetaan Pramana AI ke Skema SIMKOPDES

Dokumen ini membuktikan kesiapan integrasi produksi: setiap tabel dan kolom Pramana dipetakan tabel demi tabel, kolom demi kolom, ke kamus data resmi SIMKOPDES (`metadata_database_hackathon_final.xlsx`, sheet Metadata 27 tabel + sheet Relasi PK/FK). Panitia menegaskan koneksi langsung ke basis data bersama TIDAK diwajibkan; Pramana mengadopsi BENTUK skema dan menyimpan datanya di Turso. Alignment ini bersifat ringan dan terukur: format identifier, kosakata enum, dan field bernilai tinggi yang menguatkan tipologi audit, tanpa mencerminkan seluruh 27 tabel.

Referensi silang: [docs/keputusan-teknis.md](keputusan-teknis.md) bagian Database.

## Prinsip alignment

1. Nama tabel Pramana (skema beku blueprint 6.2) DIPERTAHANKAN; SIMKOPDES dipetakan ke atasnya, bukan sebaliknya. Mencerminkan 27 tabel penuh sengaja ditolak karena risiko regresi pada landasan waktu venue.
2. Format identifier SIMKOPDES diadopsi verbatim pada baris seed tabel yang berpadanan SIMKOPDES (koperasi, anggota, pengurus, transaksi, pinjaman, simpanan). Tabel audit-native Pramana (audit_run, temuan, pertanyaan_rat, keputusan, vote, notifikasi) BUKAN tabel SIMKOPDES sehingga mempertahankan identifier internalnya; batas ini menjaga selektor test dan e2e stabil.
3. Kosakata enum align ke istilah SIMKOPDES bila Pramana punya padanan; kontrak register Bahasa Indonesia (6.5, 6.8, 6.15) tetap utuh, tanpa istilah menuduh atau jargon di layar anggota.
4. Determinisme demo sakral: identifier dibangkitkan dari RNG seeded tetap sehingga dua siklus reseed menghasilkan output byte-identik.

## Format identifier (verbatim SIMKOPDES)

| Bidang                | Format SIMKOPDES                       | Contoh              | Dipakai Pramana pada             |
| --------------------- | -------------------------------------- | ------------------- | -------------------------------- |
| `koperasi_ref`        | `KOP-` + 12 hex                        | `KOP-539EF09CDAAD`  | koperasi.id (12 baris)           |
| `anggota_ref`         | id unik 16 karakter                    | `A1B2C3D4E5F60718`  | anggota.id (30 baris)            |
| `pengurus_ref`        | id unik 16 karakter                    | `9F8E7D6C5B4A3021`  | pengurus.id (5 baris)            |
| `transaksi_sample_id` | id unik 16 karakter                    | (deterministik)     | transaksi.id                     |
| `simpanan_ref`        | id unik 19 karakter                    | (deterministik)     | simpanan.id                      |
| `nik` (masked)        | dua digit awal + akhir, tengah bintang | `32************01`  | anggota.nik, pengurus (tampilan) |
| `kode_wilayah`        | `PP.KK.CC.DDDD`                        | `32.01.01.2001`     | koperasi.kodeWilayah (baru)      |
| no HP (masked)        | `08******7890`                         | pengurus (tampilan) |

Catatan: pinjaman tidak punya padanan tabel SIMKOPDES tunggal (mendekati modal_koperasi/pengajuan_pembiayaan); id-nya deterministik gaya SIMKOPDES; dicatat sebagai konstruksi Pramana. NIK input onboarding tetap 16 digit numerik (kontrak 2.3), disimpan dan ditampilkan dalam bentuk masked SIMKOPDES.

## Kosakata enum

| Konsep             | SIMKOPDES                                                                            | Pramana sebelum                     | Pramana sesudah                                       |
| ------------------ | ------------------------------------------------------------------------------------ | ----------------------------------- | ----------------------------------------------------- |
| Status keanggotaan | Approved; Requested                                                                  | (implisit aktif)                    | anggota.statusKeanggotaan Approved/Requested          |
| Status pengurus    | PENGURUS; PENGAWAS                                                                   | jabatan enum                        | pengurus.status PENGURUS/PENGAWAS (jabatan tetap)     |
| Status RAT         | Verified; Reported; Drafted; Rejected                                                | belum/terlaksana                    | koperasi.statusRat align + tahap_rat 6..9             |
| Nama bank          | BRI; BNI; Mandiri; BSI                                                               | (tak ada)                           | akun bank koperasi (field baru bila dipakai)          |
| Jenis gerai        | Apotek Desa; Gerai Cold Storage/Cold Chain; Gerai Kantor Koperasi; Gerai Klinik Desa | sembako/simpan_pinjam/apotek/gudang | unit_usaha.jenis diselaraskan ke daftar resmi + label |
| Jenis kelamin      | LAKI-LAKI; PEREMPUAN                                                                 | (tak ada)                           | anggota/pengurus jenisKelamin                         |
| Status simpanan    | UNPAID; PAID                                                                         | (saldo)                             | simpanan periode + status                             |

## Field bernilai tinggi ditambahkan (menguatkan tipologi audit 6.6)

- `pengurus.alamat` (SIMKOPDES pengurus_koperasi.alamat): dipakai agen Konflik Kepentingan untuk mencocokkan vendorAlamat transaksi. AN-1 bergantung padanya. Sudah ada di Pramana; format alamat diselaraskan.
- `koperasi.statusRat` + `tahapRat` + `tanggalRat` (rat_koperasi.status_rat/tahap_rat/tanggal_rat): agen Kepatuhan Proses (AN-6, status RAT belum terlaksana).
- `koperasi.laporanPosisiKeuangan` / `laporanHasilUsaha` (JSON, rat_koperasi.laporan_*): input tambahan agen Kesehatan Finansial (aset, pendapatan, SHU).
- transaksi `vendorNama` / `vendorAlamat` (barang_masuk_produk pemasok, transaksi_penjualan): agen Anomali Transaksi + Konflik Kepentingan. Sudah ada; nilai diselaraskan.
- `koperasi.kodeWilayah` (referensi_koperasi_wilayah / referensi_wilayah): identitas wilayah administrasi resmi untuk agregasi dasbor pemerintah.

## Tabel SIMKOPDES yang sengaja DI LUAR LINGKUP (dan alasannya)

Tabel murni administratif yang tidak menyentuh tipologi audit forensik tidak dicerminkan: `pengajuan_domain`, `kbli_koperasi`, `pengajuan_kemitraan`, `pengajuan_pembiayaan` (sebagian dipetakan konseptual ke pinjaman), `dokumen_koperasi`, `referensi_dokumen_koperasi`, `pengajuan_rekening_bank`, `referensi_komoditas_desa`, `referensi_profil_desa`, `karyawan_koperasi`, `aset_koperasi`, `produk_koperasi`, `inventaris_produk`, `barang_masuk_produk`, `barang_keluar_produk`. Alasan: light alignment melindungi setiap acceptance criterion yang sudah lulus; menambahkan tabel yang tidak dibaca audit menaikkan risiko regresi tanpa nilai pitch. Koneksi ke server Postgres bersama panitia juga di luar lingkup: produk berjalan lokal di Turso yang SQLite-compatible dan portabel ke Postgres bila integrasi produksi menuntutnya.

## Ringkasan untuk juri

Pramana AI menyimpan datanya dalam bentuk yang sudah berbicara bahasa SIMKOPDES: identifier `KOP-`, `anggota_ref`, NIK tersamarkan, dan `kode_wilayah` resmi; kosakata status RAT, keanggotaan, pengurus, bank, dan gerai mengikuti kamus data; serta field yang menyalakan empat agen forensik dipetakan langsung ke kolom SIMKOPDES. Ini membuktikan bahwa saat integrasi produksi tiba, Pramana tinggal mengarahkan koneksi, bukan menulis ulang model data.
