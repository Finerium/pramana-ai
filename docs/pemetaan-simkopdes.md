# Pemetaan Pramana AI ke Skema SIMKOPDES

Dokumen ini membuktikan kesiapan integrasi produksi: model data Pramana dipetakan ke kamus data resmi SIMKOPDES (`metadata_database_hackathon_final.xlsx`, 27 tabel + relasi PK/FK). Panitia menegaskan koneksi langsung ke basis data bersama TIDAK diwajibkan; Pramana mengadopsi BENTUK skema dan menyimpan datanya di Turso (libSQL, portabel ke Postgres). Alignment bersifat terukur dan JUJUR: yang sudah TERPASANG di kode dibedakan tegas dari yang bersifat TARGET integrasi.

Referensi silang: [docs/keputusan-teknis.md](keputusan-teknis.md) bagian Database.

## Prinsip alignment

1. **Nama tabel & primary key internal Pramana DIPERTAHANKAN** (skema beku blueprint 6.2: `kop-sukamaju`, `ang-sari`, `png-budi`, `trx-an1`). Alasan: (a) determinisme demo sakral, reseed dua siklus byte-identik; (b) stabilitas selektor e2e (`#tmn-an1`) dan deep-link (`?open=tmn-an1`); (c) bukti temuan beku pada fixture (`scripts/fixtures/temuan-seed.ts`) menunjuk `trx-an1`/`pj-an5` sehingga id sumber TIDAK boleh berubah tanpa merusak grounding audit seed. Mencerminkan 27 tabel penuh sengaja ditolak karena risiko regresi pada landasan waktu venue.
2. **Format identifier SIMKOPDES DITERAPKAN sebagai lapisan display-ref deterministik** (`lib/simkopdes.ts`, teruji `lib/simkopdes.test.ts` 9 kasus), memproyeksikan PK internal ke BENTUK resmi (`KOP-` + 12 hex, ref 16-hex, NIK tersamarkan, `kode_wilayah`) TANPA mengubah PK. Pada integrasi produksi, PK internal diarahkan ke ref SIMKOPDES asli sementara kontrak FORMAT sudah terpenuhi hari ini.
3. **Kosakata & field**: yang sudah ada di skema (provinsi/kabupaten/desa, ratStatus, vendorAlamat, saldoKas) dipetakan langsung; label tampilan (nama gerai resmi) diproyeksikan lewat helper; enum/field yang belum ada dicatat sebagai TARGET, bukan diklaim terpasang. Kontrak register Bahasa Indonesia (6.5/6.8/6.15) tetap utuh: tanpa istilah menuduh atau jargon di layar anggota.

## Format identifier: TERPASANG (lapisan display-ref)

`lib/simkopdes.ts` murni & deterministik (hash FNV-1a, tanpa crypto/Math.random) sehingga identik di server dan browser. Nilai contoh nyata (verifikasi: `lib/simkopdes.test.ts`):

| Bidang SIMKOPDES | Format                              | Fungsi                       | PK internal          | Display-ref        |
| ---------------- | ----------------------------------- | ---------------------------- | -------------------- | ------------------ |
| `koperasi_ref`   | `KOP-` + 12 hex                     | `koperasiRef(id)`            | `kop-sukamaju`       | `KOP-DEB181483DE2` |
| `anggota_ref`    | 16 hex                              | `anggotaRef(id)`             | `ang-sari`           | `C0F48E21A9113F1B` |
| `pengurus_ref`   | 16 hex                              | `pengurusRef(id)`            | `png-budi`           | `0CB3E2C306E538B7` |
| `nik` (masked)   | 2 awal + bintang + 2 akhir          | `maskNik(nik)`               | `3201456789012301`   | `32************01` |
| no HP (masked)   | `08******7890`                      | `maskTelepon(t)`             | `081234567890`       | `08******7890`     |
| `kode_wilayah`   | `PP.KK.CC.DDDD` (PP = BPS provinsi) | `kodeWilayah(prov,kab,desa)` | Sukamaju, Jawa Barat | `32.11.22.1439`    |

Konsumen display-ref: halaman detail koperasi pemerintah (`components/gov/DetailClient.tsx`) menampilkan `koperasi_ref · kode_wilayah` di header (TERPASANG); dasbor pemerintah (M3-3) dan layar anggota/subjek (M3-4) mengonsumsi helper yang sama. Kode BPS provinsi (`13` Sumbar, `14` Riau, `18` Lampung, `32` Jabar, `33` Jateng, `35` Jatim, `36` Banten, `51` Bali, `52` NTB, `63` Kalsel, `73` Sulsel) memuat seluruh provinsi seed.

## Kosakata enum

| Konsep             | SIMKOPDES                                                                            | Status di Pramana                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jenis gerai        | Apotek Desa; Gerai Cold Storage/Cold Chain; Gerai Kantor Koperasi; Gerai Klinik Desa | TERPASANG sebagai label tampilan via `geraiLabel(jenis)` (mis. `apotek`->"Apotek Desa", `gudang`->"Gerai Cold Storage"); enum DB `unit_usaha.jenis` dipertahankan agar AC lulus |
| Status keanggotaan | Approved; Requested                                                                  | TARGET: seed saat ini menganggap anggota aktif; kolom status ditambah saat modul onboarding produksi                                                                            |
| Status pengurus    | PENGURUS; PENGAWAS                                                                   | KONSEPTUAL: `pengurus.jabatan` memuat `pengawas`; klasifikasi PENGURUS/PENGAWAS diturunkan dari jabatan                                                                         |
| Status RAT         | Verified; Reported; Drafted; Rejected + tahap 6..9                                   | KONSEPTUAL: `koperasi.ratStatus` (belum/terlaksana) + `ratTanggal` memetakan status inti; tahap granular = target                                                               |
| Nama bank          | BRI; BNI; Mandiri; BSI (002/008/009/451)                                             | TARGET: rekening bank koperasi di luar lingkup audit forensik saat ini                                                                                                          |
| Jenis kelamin      | LAKI-LAKI; PEREMPUAN                                                                 | TARGET: tidak dibaca agen forensik; ditambah bila profil anggota produksi menuntut                                                                                              |
| Status simpanan    | UNPAID; PAID                                                                         | KONSEPTUAL: `simpanan.saldo` memodelkan posisi; status periodik = target                                                                                                        |

## Field yang MENYALAKAN audit (sudah ada di skema 6.2)

- `pengurus.alamat` (SIMKOPDES `pengurus_koperasi.alamat`): dipakai agen Konflik Kepentingan mencocokkan `vendorAlamat` transaksi. **AN-1 bergantung padanya** (Toko Berkah beralamat sama dengan bendahara Budi). Sudah ada.
- `transaksi.vendorNama` / `vendorAlamat` (`barang_masuk_produk`/`transaksi_penjualan`): agen Anomali Transaksi + Konflik Kepentingan. Sudah ada.
- `koperasi.ratStatus` + `ratTanggal` (`rat_koperasi.status_rat`/`tanggal_rat`): agen Kepatuhan Proses (AN-6 status RAT belum terlaksana). Sudah ada.
- `koperasi.saldoKas` + tren `saldoKasPerBulan` (turunan): agen Kesehatan Finansial (AN-4 penurunan kas). Sudah ada; memetakan konsep `laporan_posisi_keuangan`/`laporan_hasil_usaha` secara ringkas (adopsi JSON penuh = target integrasi).
- `koperasi.provinsi`/`kabupaten`/`desa`: agregasi dasbor pemerintah + basis `kode_wilayah`. Sudah ada.

## Tabel SIMKOPDES sengaja DI LUAR LINGKUP (dan alasannya)

Tabel murni administratif yang tidak menyentuh tipologi audit forensik tidak dicerminkan: `pengajuan_domain`, `kbli_koperasi`, `pengajuan_kemitraan`, `pengajuan_pembiayaan` (mendekati konsep pinjaman), `dokumen_koperasi`, `referensi_dokumen_koperasi`, `pengajuan_rekening_bank`, `referensi_komoditas_desa`, `referensi_profil_desa`, `karyawan_koperasi`, `aset_koperasi`, `produk_koperasi`, `inventaris_produk`, `barang_masuk_produk`, `barang_keluar_produk`. Alasan: light alignment melindungi setiap acceptance criterion yang sudah lulus; menambah tabel yang tidak dibaca audit menaikkan risiko regresi tanpa nilai pitch. Koneksi ke server Postgres bersama panitia juga di luar lingkup: produk berjalan di Turso (SQLite-compatible, portabel ke Postgres saat integrasi produksi menuntut).

## Ringkasan untuk juri

Data Pramana sudah **berbicara bahasa SIMKOPDES**: identifier `KOP-`, `anggota_ref`/`pengurus_ref` 16-hex, NIK tersamarkan `32************01`, dan `kode_wilayah` resmi ditampilkan sebagai lapisan deterministik yang teruji hari ini; kosakata gerai mengikuti kamus data; field yang menyalakan empat agen forensik sudah tersedia di skema. Yang belum terpasang dicatat jujur sebagai target integrasi. Saat integrasi produksi tiba, Pramana tinggal mengarahkan primary key ke ref SIMKOPDES asli, bukan menulis ulang model data atau kontrak format.
