# Pramana AI · Dasbor Pengawasan Kemenkop · Bundle Handoff Desain

Bundle ini adalah sumber kebenaran visual untuk dasbor pemerintah Pramana AI.
Perilaku dan data mengikuti kontrak blueprint (section 6); tampilan mengikuti bundle ini.
Downgrade visual dalam bentuk apa pun adalah pelanggaran gate. Improvement hanya satu arah, ke atas, dan dicatat.

## Isi bundle

| Berkas | Isi |
| --- | --- |
| `pramana-tokens.css` | Token OKLCH di `:root` dan `.dark` plus pemetaan Tailwind v4 `@theme inline`. Satu-satunya sumber warna, bayangan, radius, dan font. |
| `Dasbor - Overview.dc.html` | Layar Overview nasional. Sumber markup dan interaksi. |
| `Dasbor - Detail Koperasi.dc.html` | Layar detail koperasi (kop-sukamaju). |
| `Dasbor - Login.dc.html` | Layar masuk. |
| `screenshots/` | Screenshot per layar, per state, per tema. Acuan review fidelity. |
| `Dasbor Pemerintah - Keputusan Visual.dc.html` | Papan keputusan tahap eksplorasi. Arsip, bukan layar produk. |

## Kunci stack (tidak dinegosiasikan)

- Next.js 16 App Router, React 19, TypeScript strict.
- Tailwind v4. Tempel isi `pramana-tokens.css` ke `app/globals.css`; blok `@theme inline` memetakan token ke utility (`bg-background`, `text-verdict-merah`, `shadow-raised`, `rounded-panel`, `font-display`).
- shadcn/ui untuk primitives; restyle komponen memakai token ini, jangan memakai tema default shadcn.
- Tema gelap = class `dark` pada `<html>` (strategi class).
- Font dari Google Fonts: Archivo (600, 700, 800) dan Public Sans (400, 500, 600, 700).

## Aturan keras

1. DILARANG hard-coded hex, rgb, atau oklch di komponen. Semua warna lewat `var(--token)` atau utility hasil `@theme`. Nilai di luar token adalah cacat review.
2. Verdict tidak pernah dikomunikasikan lewat warna saja. Setiap indikator verdict = bentuk + teks label:
   hijau = lingkaran, kuning = segitiga, merah = belah ketupat, info = persegi.
   Bentuk digambar dengan `clip-path` (lihat markup), bukan ikon font.
3. Neumorfisme hanya untuk permukaan dan kontrol. Teks, angka, garis chart, dan isi tabel selalu tinta datar kontras tinggi. Tidak ada teks emboss.
4. Seluruh copy Bahasa Indonesia, sapaan "Anda", tanpa em dash, tanpa emoji. String state kunci (banner, audit, login) sudah beku di blueprint 6.15 dan dipakai verbatim di layar ini.
5. `prefers-reduced-motion` dihormati: semua animasi (pulse skeleton, spinner, bar berjalan) mati otomatis. Pertahankan blok media query tersebut.
6. Angka selalu `font-variant-numeric: tabular-nums`.

## Resep permukaan neumorfik

Tema terang (bayangan ganda klasik):

- Panel terangkat: `background: var(--surface-fill); box-shadow: var(--shadow-raised); border-top: 1px solid var(--edge-top)` (tepi transparan di terang, jangan dihapus agar tidak terjadi layout shift saat ganti tema).
- Kontrol tenggelam (input, chip, banner): `background: var(--well); box-shadow: var(--shadow-pressed);` versi kecil memakai `--shadow-pressed-sm`. Tambahkan `border-bottom: 1px solid var(--edge-bottom-well)`.
- Dekorasi: lingkaran emboss (raised di luar, pressed di dalam), hanya pada login.

Tema gelap, resep terkunci "Tepi Mesin" (1e):

- Cahaya digambar sebagai tepi, bukan blur: `--surface-fill` menjadi gradasi 180deg (terang 0.305 ke 0.262 pada 32 persen teratas), `--edge-top` menjadi `oklch(1 0 0 / 0.16)`, bayangan tunggal jatuh `--shadow-raised: 0 14px 28px oklch(0 0 0 / 0.5)`.
- Kontrol tenggelam gelap: inset atas saja (`--shadow-pressed`) plus `--edge-bottom-well` sebagai tepi bawah terang.
- Karena semua resep hidup di token, komponen TIDAK berubah antar tema; jangan menulis kondisi `dark:` untuk bayangan atau gradasi ini.

## Tipografi

- Judul, label KPI, header kolom: Archivo. H1 27px/800, judul panel 13.5 sampai 15px/700, label caps 10 sampai 10.5px/700 dengan letter-spacing 0.11 sampai 0.15em.
- Teks, tabel, angka: Public Sans. Isi tabel 12.5 sampai 13.5px, angka KPI 34px/700 tabular.
- Jangan memakai Inter, Roboto, atau font lain.

## Aksesibilitas (WCAG AA, sudah diverifikasi pada token)

- Teks di atas latar dan permukaan: kontras minimal 4.5:1 (tinta 13.4:1, sekunder 6.3:1, ketiga tinta verdict 4.9 sampai 6.6:1 terang dan 6.0+:1 gelap, teks tombol primer 6.5+:1).
- Elemen UI dan chart minimal 3:1. Hairline tabel bersifat suplemen (baris juga dipisah spasi), boleh di bawah 3:1.
- Focus ring: `outline: 2px solid var(--ring); outline-offset: 2px` pada semua elemen interaktif via `:focus-visible`. Jangan dihilangkan.
- Target klik utama minimal 44px tinggi (tombol primer, input, baris tabel 52px).
- Istilah teknis boleh di dasbor pemerintah dengan tooltip (contoh: RAT memakai `title` atau `abbr`).

## Layar, state, dan peta screenshot

Ukuran desain 1440x900, layout wajib bertahan mulai 1280px (konten `max-width: 1440px`, `min-width: 1240px`, padding 48px). Setiap layar punya dua tema; nama berkas `screenshots/<layar>-<tema>-<state>.png`.

### Overview (`Dasbor - Overview.dc.html`)

State: `default`, `memuat` (skeleton pulse + spinner), `kosong` (KPI nol + panel kosong + Muat Ulang), `gagal` (banner merah + Coba Lagi + KPI strip).
Isi default: KPI 12 koperasi, 6 hijau, 4 kuning, 2 merah, 17 temuan terbuka; bar distribusi verdict berlabel; tabel 12 koperasi sortable (Koperasi, Provinsi, Verdict, Temuan).
Interaksi: sort per kolom (header aktif tampil pressed + caret arah, default Verdict menurun dengan tie-break jumlah temuan lalu nama); pencarian menyaring nama dan provinsi (state hasil kosong tersedia); hover baris `--row-hover`; klik atau Enter pada baris membuka detail; toggle tema.

### Detail Koperasi (`Dasbor - Detail Koperasi.dc.html`)

State halaman: `default`, `memuat`, `kosong` (belum pernah diperiksa: chip Belum Diperiksa, CTA Jalankan Pemeriksaan), `gagal`.
State pemeriksaan (banner sumber + tombol): `tersimpan` ("Hasil pemeriksaan tersimpan", ikon persegi), `berjalan` (copy beku "Pengawas sedang memeriksa. Ini memerlukan waktu kurang dari dua menit." + bar indeterminate + spinner pada tombol), `langsung` (copy beku "Hasil pemeriksaan langsung, baru saja dijalankan.", titik aksen), `gagal_langsung` (copy beku "Pemeriksaan langsung gagal. Menampilkan hasil tersimpan terakhir.", belah ketupat merah).
Isi default: profil Sukamaju (unit usaha sebagai chip tenggelam), verdict Merah + ringkasan beku, tren 6 bulan (hijau, hijau, hijau, kuning, kuning, merah; sel = bentuk + label di atas tint verdict), tabel 6 temuan AN-1 sampai AN-6 terurut tingkat, baris AN-2 membawa sub-baris "Tanggapan Pengurus".
Interaksi: tombol "Jalankan Pemeriksaan Ulang" menjalankan simulasi 5 detik lalu berakhir `langsung`, atau `gagal_langsung` bila prop `simulasiGagal` aktif.
Screenshot tambahan `detail-<tema>-temuan-bawah.png` menampilkan baris temuan bagian bawah.

### Login (`Dasbor - Login.dc.html`)

State: `default`, `memuat` ("Memeriksa..."), `gagal` (copy beku "Email atau kata sandi belum tepat. Silakan coba lagi.").
Isi: kartu terangkat di atas lingkaran emboss dekoratif, email + kata sandi (sumur pill), hint box tenggelam "AKUN UJI JURI" berisi `juri.pemerintah@pramana.id / PramanaJuri2026` dengan aksi "Isi otomatis".
Interaksi: submit kredensial juri yang benar mengalihkan ke Overview; salah menampilkan state gagal.

## Catatan implementasi

- Ketiga berkas `.dc.html` bisa dibuka langsung di browser untuk inspeksi interaksi; state dan tema bisa dipaksa lewat panel Tweaks (props `tema`, `mode`, `pemeriksaan`, `simulasiGagal`).
- Data pada layar ini identik dengan seed blueprint 6.7 dan 6.7b (12 koperasi, KPI 6/4/2, 17 temuan, tren Sukamaju, temuan AN-1 sampai AN-6, tanggapan pengurus AN-2). Jangan mengarang data lain.
- Screenshot diambil dengan zoom kecil agar seluruh lebar 1440 terlihat; proporsi komponen mengikuti berkas sumber, bukan piksel screenshot.
