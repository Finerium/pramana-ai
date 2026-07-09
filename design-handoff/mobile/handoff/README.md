# Pramana AI, Handoff Desain Aplikasi Anggota

Bundle ini adalah sumber kebenaran visual untuk implementasi. Kebenaran fungsional dan kontrak ada di `blueprint-pramana-ai.md` (section 6 beku). Jika ada konflik antara desain dan kontrak, tandai dan tanyakan, jangan memilih diam diam.

## Stack terkunci (tidak dinegosiasikan)

- Next.js 16 App Router, React 19, TypeScript strict
- Tailwind v4 dengan `@theme inline`
- shadcn/ui sebagai basis komponen, di-retheme lewat token
- Font: Geist (Google Fonts), muat lewat `next/font`, subset latin, weight 400 sampai 800

## Token (LOCKED: palet "Nila" + huruf Geist)

- File: `tokens.css`. Berisi OKLCH custom properties di `:root` dan `.dark` plus mapping `@theme inline`.
- DILARANG hard-code warna hex/oklch di komponen. Selalu `var(--...)` atau kelas Tailwind hasil mapping (`bg-surface`, `text-ink`, `text-muted`, `border-border`, `bg-accent`, `bg-hijau`, `text-hijau-on`, `bg-kuning-tint`, dst).
- Verdict adalah bahasa inti: `--hijau`, `--kuning`, `--merah` dengan pasangan `-on`, `-tint`, `-tint-ink`. Jangan pakai warna verdict untuk dekorasi lain.
- Verdict tidak pernah warna saja: selalu bentuk + kata. Hijau = lingkaran centang, kuning = segitiga seru, merah = kotak silang, catatan (info) = belah ketupat.
- Angka rupiah selalu tabular lining: `font-variant-numeric: tabular-nums lining-nums` (kelas `.tnum`). Format "Rp 600.000" (spasi setelah Rp, titik ribuan).

## Referensi visual hidup

- `../Pramana App.dc.html` adalah prototipe interaktif 390x844 (tahan 360 sampai 430). Buka untuk melihat semua layar, state, dan tema.
- Kontrol skenario: tema (terang/gelap), verdict (merah/kuning/hijau), kondisi (normal/memuat/kosong/gagal), mulaiDari.
- Screenshot per state ada di `screenshots/`.

## Peta layar ke fitur blueprint

- Login -> U8, F05. Hint box "Akun uji juri" tampil di halaman login (keputusan sadar).
- Daftar + kartu anggota -> F11, AC-E2E-03. NIK 16 digit, error `onboard.nik.err`, sukses menampilkan kartu (nama, KDS-xxxx, koperasi, tanggal) dengan animasi rise singkat.
- Beranda (verdict) -> F02, U3. Warna verdict dominan penuh, satu kalimat ringkasan, CTA tunggal `verdict.cta`, baris notifikasi `notif.template` (F13).
- Temuan -> F03, U4. Chip severity, expand "Kenapa ini penting?", bukti, tombol tambah ke rapat dengan konfirmasi `temuan.tambah.ok`, blok tanggapan pengurus (AN-2 seeded).
- Uang Anda -> F08. Total simpanan besar, rincian pokok/wajib/sukarela, sisa pinjaman + progres, cicilan berikutnya (nominal + tanggal).
- Arus Dana -> F09, U5. Total masuk/keluar, bar kategori kanonik 6.3b, sorotan "Sedang diperiksa Pengawas" menaut ke temuan.
- Suara Anda -> F10, U6. Agregasi "N anggota menanyakan hal yang sama" (bertambah setelah aksi tambah), kartu voting terkunci setelah memilih, hasil tampil setelah memilih.
- Tab bar 4 tab: Beranda, Uang Anda, Arus Dana, Suara Anda. Ikon selalu berdampingan kata.

## State wajib per layar (semua ada di prototipe)

- default (normal), memuat (skeleton pulse), kosong (empty copy), gagal (konten cache + banner `banner.cache`, sesuai U9: error bukan layar mati), sukses (konfirmasi inline).

## Copy

- Seluruh string dari `lib/copy.ts` blueprint 6.15 dipakai verbatim. Jangan menulis ulang.
- Register 6.8: sapaan "Anda", tanpa em dash, tanpa emoji, tanpa jargon akuntansi di layar anggota.
- Label verdict masih PLACEHOLDER menunggu kontrak copy: Sehat, Perlu Perhatian, Perlu Dijelaskan.
- Ringkasan verdict kuning dan hijau di prototipe adalah placeholder saya, bukan kontrak.

## Aksesibilitas (WCAG AA, diverifikasi pada token)

- Kontras teks minimal 4,5:1, komponen UI 3:1. Pasangan token pada `tokens.css` sudah lolos (lihat papan `../Arah Visual.dc.html` untuk rasio terhitung).
- Touch target minimal 44x44 px. Tombol utama 52 sampai 56 px.
- Fokus keyboard terlihat: outline 3px `var(--accent)`.
- `prefers-reduced-motion: reduce` mematikan semua animasi.
- Nominal anggota minimal 24 px pada angka utama; body minimal 13 px.
- Error dan konfirmasi memakai `role="alert"` / `role="status"`.

## Angka contoh yang terkunci di prototipe

- Simpanan Rp 600.000 (pokok 100.000, wajib 350.000, sukarela 150.000), sisa pinjaman Rp 1.200.000, cicilan Rp 200.000 jatuh tempo tanggal 5.
- Arus Juni 2026: masuk Rp 57.200.000, keluar Rp 68.200.000, kas berkurang Rp 11.000.000 (konsisten saldo kas 6.7b).
- Temuan AN-1 sampai AN-6 sesuai fixture 6.7, agregasi 12 anggota pada AN-1, voting freezer 9 setuju 3 tidak sebelum aksi juri.
