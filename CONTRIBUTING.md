# Berkontribusi ke Pramana AI

Terima kasih atas minat Anda. Pramana AI adalah purwarupa hackathon dengan
kontrak dan acceptance criteria yang beku; kontribusi mengikuti disiplin berikut.

## Menyiapkan lingkungan

```bash
pnpm install
cp .env.example .env     # isi SESSION_SECRET minimal 32 karakter
pnpm seed
pnpm dev
```

Tanpa variabel TURSO_*, aplikasi memakai file SQLite lokal sehingga seluruh
test dan seed berjalan tanpa jaringan.

## Disiplin pengembangan

- Kontrak beku ada di `blueprint-pramana-ai.md` section 6. Perubahan pada tipe
  domain, skema database, kontrak API, prompt, atau copy adalah keputusan
  desain, bukan improvisasi.
- Register bahasa 6.8 mengikat seluruh teks produk: sapaan "Anda", tanpa em
  dash, tanpa emoji, layar anggota tanpa jargon akuntansi. Ditegakkan oleh
  `pnpm check-register`.
- Test-driven: tulis test yang gagal lebih dulu, lalu implementasi minimal.
- Warna verdict dihitung di server; komponen tidak pernah menetapkan warna dari
  sisi klien.
- Dilarang hard-code warna di komponen; hanya token per permukaan.

## Sebelum mengirim perubahan

Jalankan rantai verifikasi dan pastikan semua hijau:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm e2e
pnpm check-register
```

## Gaya commit

Gunakan pesan commit yang deskriptif dalam bentuk imperatif. Sertakan konteks
mengapa perubahan dibuat, bukan hanya apa yang diubah.

## Lisensi kontribusi

Dengan berkontribusi, Anda setuju bahwa kontribusi Anda dilisensikan di bawah
Lisensi MIT yang sama dengan proyek ini.
