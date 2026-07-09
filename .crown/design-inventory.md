# Design Inventory — Pramana AI (Phase 0)

Sumber: empat Code Handoff Bundle Claude Design, di-unzip ke `design-handoff/{mobile,dashboard,landing,subjek}/`.
Semua token file, README/HANDOFF, dan prototype produksi (`.dc.html`) dibaca penuh pada Phase 0.
Screenshot bundle = oracle review AC-UI-02. File arsip (v2, Keputusan Visual, Explorations, arsip/) TIDAK diport.

## 1. Empat sistem token ber-namespace (dipertahankan terpisah, kontrak 6.19 rule 1 & 6)

| Surface | Palet | Font | File token | Karakter |
|---|---|---|---|---|
| Member app | "Nila" | Geist 400-800 | `mobile/handoff/tokens.css` | Flat minimal; `--bg --surface --ink --muted --border --accent(-on)`; verdict `--hijau/--kuning/--merah` + `-on/-tint/-tint-ink`; `.tnum`; `.dark` class |
| Gov dashboard | "Porselen Hangat" / dark "Tepi Mesin" | Archivo (display) + Public Sans | `dashboard/pramana-tokens.css` | Neumorfik di surface/control SAJA; `--surface-fill --control-fill --well --row-hover`, shadow `--shadow-raised(-sm/-lg) --shadow-pressed(-sm)`, radius `--radius-panel/tile/field/chip`, verdict `--verdict-*` + `-surface` + `--verdict-on`; dark = gradasi+edge dibakar DI TOKEN (komponen tanpa `dark:` untuk shadow) |
| Landing | "Malam Jernih" | Plus Jakarta Sans + JetBrains Mono | `landing/tokens.css` | Nama Indonesia `--latar --permukaan --kartu --garis(-kuat) --tinta(-2/-3) --aksen(-kuat/-teks/-lembut)`; verdict + `color-mix` `-lembut`; `--bayang-kartu`; radius `-kartu/-pil`; theme = system-default + `.light/.dark` + localStorage `pramana-tema` (apply pre-paint) |
| Subjek console | "Merah Putih" | Spline Sans + Spline Sans Mono | `subjek/handoff/tokens.css` | Merah primary di netral putih; TANPA warna verdict (hanya `--color-sync/-pending/-danger` + soft); radius `-input/-card/-pill`; `.dark` class |

Aturan lintas-surface (semua bundle): dilarang hard-code warna di komponen; verdict = bentuk CSS + label, tidak pernah warna saja (hijau lingkaran, kuning segitiga, merah belah-ketupat/45°, info persegi); angka `tabular-nums`; format `Rp 15.000.000`; `prefers-reduced-motion` mematikan animasi; fokus keyboard terlihat.

## 2. Mobile bundle → fitur (prototype `Pramana App.dc.html`, 390x844, tahan 360-430; 30 screenshot)

| Screen | Blueprint | States di prototype | Catatan |
|---|---|---|---|
| Login | U8, F05 | default, gagal (login.err), busy "Memeriksa..." | Hint box "AKUN UJI JURI" + Isi otomatis; link Daftar |
| Daftar + kartu | F11, AC-E2E-03 | form, nikErr (onboard.nik.err), busy, sukses (kartu rise) | Kartu: nama, KDS-0031, koperasi, tanggal; "Verifikasi simulasi untuk purwarupa" |
| Beranda | F02, U3, F13 | normal/memuat/kosong/gagal(cache banner) x verdict merah/kuning/hijau | Kartu verdict full-bleed + ikon 58px + label (Perlu Dijelaskan/Perlu Perhatian/Sehat) + ringkasan + CTA putih; notif line (n=5); panel Pengawas (4 agen animasi run); shortcut Uang/RAT; Aktivitas Terbaru (chip "Diperiksa") |
| Temuan | F03, U4 | atas/aksi/gelap/memuat/kosong-hijau | Card per temuan: chip severity+ikon, agen, judul, penjelasan, BUKTI list, expand "Kenapa ini penting?", PERTANYAAN UNTUK RAPAT, tombol tambah → konfirmasi hijau (temuan.tambah.ok), blok TANGGAPAN PENGURUS (AN-2, "24 JUNI 2026") |
| Uang Anda | F08 | terang/gelap/kosong (+memuat/gagal) | Simpanan 52px count-up Rp 600.000; pokok/wajib/sukarela 100k/350k/150k; sisa pinjaman 1.2jt + progress 40% (diangsur 800k dari 2jt); cicilan 200k jatuh tempo 5 Juli |
| Arus Dana | F09, U5 | atas/sorotan/gelap | Kas 3 bulan bar (Apr 58, Mei 47.2*, Jun 36.5) + chip "Turun 37%"; masuk 57.2jt / keluar 68.2jt count-up; bar kategori kanonik; SEDANG DIPERIKSA PENGAWAS chips → anchor temuan |
| Suara Anda | F10, U6 | belum-vote/sudah-vote, voting-belum/sudah/gelap | Agregat: AN-1 12 (+1 anda), AN-4 7, AN-2 5 dgn "Termasuk pertanyaan Anda"; voting freezer Rp 8.500.000, 30-dot grid, 9 setuju/3 tidak, terkunci setelah pilih |
| Profil | — (pendukung) | default | Kartu anggota Sari KDS-0007; data diri (NIK masked); tema Sistem/Terang/Gelap; toggle notif; Hubungi Pengawas; Keluar; "Pramana purwarupa, v1.0" |
| Tab bar | U1 | — | Beranda, Uang Anda, Arus Dana, Suara Anda; ikon+kata; blur backdrop |

Label agen (register anggota): Pemeriksa Transaksi, Pemeriksa Konflik Kepentingan, Pemeriksa Kesehatan Keuangan, Pemeriksa Kepatuhan.
Fixture text lengkap AN-1..AN-6 (judul/penjelasan/kenapa/bukti/tanya/tanggapan) tertanam di prototype → jadi basis `scripts/fixtures/temuan-seed.ts`.
`Arah Visual.dc.html` = papan kontras terhitung (referensi AA, bukan layar produk).

## 3. Dashboard bundle → fitur (3 prototype produksi; 1440x900 tahan 1280; 41 screenshot; v2/Keputusan Visual = arsip)

| Screen | Blueprint | States | Catatan |
|---|---|---|---|
| Overview | F07, U7 | default/memuat/kosong/gagal | KPI 5 kartu (12/6/4/2/17, "tersebar di 7 koperasi"); bar distribusi berlabel (50/33.4/16.6%); tabel 12 baris sortable (default Verdict desc, tie-break temuan desc lalu nama asc, header pressed + caret); search nama+provinsi + empty state; row hover/click/Enter → detail; toggle tema; "Diperbarui 8 Juli 2026, 08.15 WIB" |
| Detail Koperasi | F07, F12 | halaman: default/memuat/kosong(Belum Diperiksa+CTA)/gagal; pemeriksaan: tersimpan/berjalan/langsung/gagal_langsung (copy beku 6.15 verbatim) | Profil Sukamaju + 4 chip unit; verdict Merah + ringkasan beku + "Pemeriksaan terakhir 30 Juni 2026 · 6 temuan"; tren 6 bulan (hijau hijau hijau kuning kuning merah, bentuk+label di tint); tabel 6 temuan sorted severity, AN-2 sub-row "TANGGAPAN PENGURUS · 21 JUNI 2026"*; tombol Jalankan Pemeriksaan (Ulang) → simulasi 5s |
| Login | U8, F05 | default/memuat/gagal | Kartu raised di atas lingkaran emboss; pill wells; hint "AKUN UJI JURI" juri.pemerintah + Isi otomatis; footer purwarupa |

Label agen (register gov): Konflik Kepentingan, Anomali Transaksi, Kesehatan Finansial, Kepatuhan Proses.

## 4. Landing bundle → fitur (`Pramana Landing.dc.html`; kunci 1440 & 390; 34 screenshot; Explorations = arsip)

Sections (urut): sticky nav (brand+AI badge, toggle tema 3-state, CTA anggota) → Hero (badge shapes, H1 tagline, sub, 2 CTA + daftar link + landing.juri mono) → Preview produk (phone 270px + laptop frame, mini-UI stand-in DIGANTI screenshot e2e asli via next/image saat implementasi) + captions → 01·MASALAH (H2 "Dananya sudah mengalir. Pengawasannya belum." + 3 stat: 83.383 / 50.383 / Rp60 juta + sumber mono) → Wawasan (permukaan band, 2 kalimat) → 02·CARA KERJA (H2 "Pramana bertanya, tidak menuduh."; diagram P1-P4 → adjudikator → 3 chip verdict; self-draw ~2.3s sekali; pulseDot) → 03·FITUR INTI (4 kartu) → Footer (tim Daulat, ajang, slot repo URL, ghost wordmark PRAMANA, legal line sintetis).
Breakpoint: container query 899px (boleh jadi viewport media query); nav CTA hilang <519px. Reveal: fade+rise 26px 800ms sekali. Reduced-motion = statis penuh. CTA: anggota/pemerintah → /login, daftar → /daftar.

## 5. Subjek bundle → fitur (`Konsol Pembukuan.dc.html`; 1440 tahan 1024; 11 screenshot; Palet dan Tipografi = papan referensi)

| Area | Blueprint | Detail |
|---|---|---|
| Header | U12, 6.15 | redbar 3px; emblem merah-putih; "Simulasi Pembukuan Koperasi" + tag "Mode simulasi" + sub beku; saldo kas mono 30px (mulai 36.500.000, pulse saat berubah); chip subjek.sync; toggle tema; Keluar |
| Catat Transaksi | F17, 6.3b | jenis (8 opsi: Pembelian/Penjualan/Setoran simpanan/Penarikan simpanan/Pencairan pinjaman/Angsuran/Gaji/Operasional); jumlah raw-digit + prefix Rp + echo "Terbaca: Rp X" + helper; tanggal; unit usaha (4); vendor nama+alamat HANYA saat pembelian (wajib); anggota opsional; deskripsi wajib; validasi awam per field (border+bg danger); sukses inline; tombol subjek.simpan + Bersihkan; arah derived: masuk={setoran_simpanan,penjualan,angsuran}, keluar=sisanya |
| Persetujuan Pinjaman | F17, 6.3b | anggota; disetujui oleh (jabatan 5); pokok; cicilan; jatuh tempo; toggle dokumenLengkap; desc "Plafon kebijakan koperasi Rp 10.000.000 per anggota."; tombol subjek.pinjaman.simpan |
| Preset skenario | 6.15, 6.6 | 4 tombol label beku; MENGISI form + note "Contoh", TIDAK submit. Payload persis: (1) konflik: pembelian 15000000, 2026-06-14, sembako, Toko Berkah, Jl. Melati No. 12, Sukamaju; (2) pecah: pembelian 4900000, 2026-06-22, CV Sumber Rejeki; (3) plafon: rudi, 12000000, 1000000, 2026-07-20, bendahara, dok=false; (4) kas: operasional 20000000, 2026-06-25 |
| Status RAT | F17 | Tahun 2026; toggle belum/terlaksana + tanggal saat terlaksana; "Perbarui status RAT"; sukses inline |
| Daftar Entri Terakhir | F17 | 10 transaksi + 5 pinjaman; chip sync "Menunggu sinkron"→"Tersinkron" (~1.5s); segmented Terisi/Kosong; empty states keduanya |
| Login | U12 | kicker+judul "Masuk sebagai bendahara"; hint subjek.login.hint bendahara@pramana.id + Isi otomatis; login.err; footer sintetis |

## 6. Rekonsiliasi & flags → lihat `.crown/notes.md` (F-01..F-06) dan `.crown/design-deviations.md`.
