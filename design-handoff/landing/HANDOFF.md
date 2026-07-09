# Pramana AI — Landing Page · Code Handoff

Wajah publik Pramana AI pada rute `/`. Audiens pertama: juri hackathon yang membuka URL demo. Halaman statis, tanpa panggilan API.

## Stack (TERKUNCI, jangan diganti)

- Next.js 16 App Router, React 19, TypeScript strict
- Tailwind v4 (`@theme inline`), shadcn/ui
- Deploy Vercel

## File di bundle ini

| File | Isi |
| --- | --- |
| `Pramana Landing.dc.html` | Desain hidup: sumber kebenaran layout, hirarki, copy, motion, kedua tema |
| `tokens.css` | Token OKLCH `:root` + `.dark` + media fallback sistem + mapping `@theme inline` |
| `screenshots/` | Acuan render per seksi, 4 set: `1440-terang/`, `1440-gelap/`, `390-terang/`, `390-gelap/` |
| `Pramana Landing Explorations.dc.html` | Papan keputusan token (arsip, bukan untuk diport) |

### Indeks screenshot

Set 1440 (8 file, dirender pada lebar 1440 lalu diskala ke lebar bingkai): 01 hero, 02 preview produk (duo device), 03 masalah, 04 wawasan, 05 cara kerja, 06 diagram bawah + chip verdict, 07 fitur inti, 08 footer. Set 390 (9 file, lebar asli 390, halaman di tengah bingkai): 01 hero, 02 preview (phone), 03 preview (laptop), 04 masalah, 05 wawasan, 06 cara kerja, 07 adjudikator + chip, 08 fitur, 09 footer. DC hidup adalah sumber kebenaran bila screenshot dan DC berbeda (artefak render capture seperti bayangan kartu yang tampak kasar bukan bagian desain).

## Aturan token (keras)

1. **Dilarang hard-code warna** (hex, rgb, hsl, oklch literal) di komponen. Semua warna lewat token `tokens.css`. Sarankan lint rule / grep gate di CI: `oklch(|#[0-9a-f]|rgb(` di luar `tokens.css` = gagal.
2. Token diport **verbatim**. Perubahan nilai hanya sebagai improvement terdokumentasi.
3. Verdict hijau/kuning/merah adalah token semantik. Selalu dirender **ikon bentuk + label**, tidak pernah warna saja: hijau = lingkaran, kuning = segitiga, merah = belah ketupat.

## Tema

- Default **ikut sistem**: tanpa kelas di `<html>`, `@media (prefers-color-scheme)` menang.
- Toggle menulis kelas eksplisit `light` / `dark` di `<html>` dan menyimpan pilihan di `localStorage` key `pramana-tema` (nilai: `terang` | `gelap` | `sistem`; `sistem` = hapus kedua kelas).
- Terapkan sebelum paint (inline script di `<head>`) agar tidak flash.
- Toggle di nav: pill berlabel Sistem / Terang / Gelap, ikon lingkaran (kosong = terang, penuh = gelap, setengah = sistem).

## Tipografi

- `Plus Jakarta Sans` 400/500/600/700/800 via `next/font/google`, `display: swap`.
- `JetBrains Mono` 400/500/600 untuk eyebrow, caption sumber, dan baris juri.
- Skala fluid memakai `clamp()`; nilai persis ada di DC. Hero: `clamp(38px, 6.6vw, 96px)/1.04`, tracking -0.035em. H2 seksi: `clamp(30px, 4.4vw, 54px)`, tracking -0.03em.
- Angka statistik memakai `font-variant-numeric: tabular-nums`.

## Breakpoint

- Desain dikunci di **1440** dan **390**; keduanya harus persis seperti screenshot.
- DC memakai container query dengan ambang **899px** (device stack, diagram pindah ke spine vertikal, grid footer 1 kolom, CTA hero jadi kolom). Di Next.js boleh diganti media query viewport dengan ambang sama.
- Grid statistik dan fitur memakai `auto-fit minmax`, tidak butuh breakpoint tambahan.

## Rute CTA (link biasa, bukan button handler)

| Elemen | Tujuan |
| --- | --- |
| "Masuk sebagai Anggota" (nav + hero) | `/login` |
| "Masuk sebagai Pemerintah" | `/login` |
| "Daftar sebagai Anggota Baru" | `/daftar` |
| "Repositori proyek" (footer) | slot URL repo, isi saat submit |

## Konten

- Seluruh copy di DC sudah final dan mengikuti register produk: sapaan "Anda", tanpa em dash, tanpa emoji, tanpa jargon akuntansi. Jangan menulis ulang.
- Angka statistik dan sumbernya dirender dari `lib/facts.ts` (83.383; ~50.383; ~Rp60 juta CELIOS). String CTA/tagline/juri dari `lib/copy.ts`. Jangan hardcode di JSX.
- Layar di dalam device frame adalah **mini-UI stand-in**; ganti dengan screenshot e2e asli saat aplikasi jadi (aset `next/image`, bukan iframe).

## Motion (hemat, hormati reduced motion)

- Scroll reveal: fade + rise 26px, 800ms `cubic-bezier(.22,.61,.21,1)`, threshold ~0.12, hanya elemen di bawah viewport awal. Sekali jalan, tidak berulang.
- Momen khas (sekali per kunjungan): diagram Cara kerja menggambar dirinya. Urutan: kartu pemeriksa stagger 90ms -> garis vertikal scaleY -> garis kolektor scaleX -> garis tengah -> kartu Adjudikator -> garis akhir -> chip verdict stagger 110ms. Total sekitar 2.3 detik.
- `prefers-reduced-motion: reduce` = semua konten tampil statis penuh (jangan hanya mempercepat).
- Dot Adjudikator: `pulseDot` 2.4s infinite (mati otomatis saat reduced motion).

## Aksesibilitas (gate)

- WCAG AA: teks 4.5:1, UI 3:1. Token sudah disetel AA per tema; jangan menurunkan kontras saat styling.
- Fokus keyboard terlihat: `outline: 2px solid var(--cincin); outline-offset: 3px` pada semua link/button.
- Target sentuh >= 44px pada CTA.
- Verdict: bentuk + label, bukan warna saja (lihat Aturan token no. 3).
- Elemen dekoratif (glow, garis diagram, ghost wordmark, spine) diberi `aria-hidden="true"`.

## Ikon dan bentuk

Tanpa icon library. Semua tanda adalah bentuk CSS murni (lingkaran, segitiga border-trick, belah ketupat rotate 45deg, batang bar). Port apa adanya.
