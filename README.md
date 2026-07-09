# Pramana AI

[![Lisensi MIT](https://img.shields.io/badge/lisensi-MIT-black)](LICENSE) [![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org) [![Demo langsung](https://img.shields.io/badge/demo-langsung-brightgreen)](https://pramana-ai-puce.vercel.app)

Pengawas tata kelola koperasi desa berbasis AI multi-agent. Pramana mengaudit koperasi atas nama anggotanya, memberi verdict hijau, kuning, atau merah beserta pertanyaan siap pakai untuk Rapat Anggota Tahunan. Prinsipnya mutlak: Pramana bertanya, tidak menuduh.

## Ringkasan produk

Program Koperasi Desa Merah Putih menyalurkan plafon besar ke lebih dari 83.000 koperasi, tetapi pengawasannya rapuh dan anggota tidak punya alat untuk memahami ke mana dananya mengalir. Pramana membalik arah pengawasan: empat agen forensik (Konflik Kepentingan, Anomali Transaksi, Kesehatan Finansial, Kepatuhan Proses) berjalan paralel membaca transaksi koperasi, lalu satu Agen Adjudikator menyatukan temuan menjadi verdict dan daftar pertanyaan berbahasa awam.

Produk memiliki empat permukaan dalam satu basis kode:

- Aplikasi anggota (mobile-first, PWA): verdict, temuan, uang Anda, arus dana, suara Anda.
- Dasbor pemerintah (desktop): agregat nasional, distribusi verdict, drill-down per koperasi.
- Landing page publik: wajah produk, statistik masalah, cara kerja.
- Konsol Simulasi Pembukuan (subjek): sistem pembukuan koperasi yang menjadi sumber data yang diawasi Pramana.

Nilai inti yang dijaga: seorang anggota desa, dalam waktu di bawah 60 detik sejak membuka aplikasi, memahami apakah koperasinya sehat dan apa yang harus ia tanyakan.

## Demo

URL demo langsung: https://pramana-ai-puce.vercel.app

DEMO_MODE aktif secara default. Seluruh alur penjurian berjalan 100 persen dari data seed deterministik, sehingga demo tidak pernah bergantung pada jaringan atau API model saat penjurian. Jalur audit langsung tetap tersedia sebagai bukti mesin nyata; bila model tidak terjangkau, hasil jatuh ke cache tersimpan dengan banner sumber data.

Akun uji juri (seeded, bukan rahasia):

| Peran                     | Email                      | Kata sandi           | Masuk ke    |
| ------------------------- | -------------------------- | -------------------- | ----------- |
| Juri anggota              | juri.anggota@pramana.id    | PramanaJuri2026      | /beranda    |
| Juri pemerintah           | juri.pemerintah@pramana.id | PramanaJuri2026      | /pemerintah |
| Persona anggota           | sari@pramana.id            | SariSukamaju1        | /beranda    |
| Bendahara (konsol subjek) | bendahara@pramana.id       | PramanaBendahara2026 | /pembukuan  |

Halaman masuk memuat tombol Isi otomatis untuk setiap akun uji. Varian visual login per persona tersedia lewat /login, /login?as=pemerintah, dan /login?as=bendahara.

## Arsitektur

Diagram teks alur audit:

```
Snapshot data koperasi (transaksi, pinjaman, pengurus, saldo kas)
        |
        v
  +-----+-----+-----+-----+        (empat agen forensik, paralel)
  |     |     |     |
 Konflik Anomali Kesehatan Kepatuhan
Kepentingan Transaksi Finansial Proses
  |     |     |     |
  +-----+--+--+-----+
           |
           v
     Adjudikator  (menghapus duplikasi, menulis ulang bahasa awam, mengurutkan)
           |
           v
   Aturan warna server-side (6.1)  ->  Verdict {hijau|kuning|merah} + pertanyaan RAT
           |
           v
     Persist audit_run + temuan  ->  UI empat permukaan
```

Empat agen forensik dan adjudikator dijalankan oleh satu model runtime (MiniMax-M2.7 via endpoint OpenAI-compatible), dibedakan lewat prompt, bukan model berbeda. Warna verdict selalu dihitung ulang di server dari aturan tetap; usulan model hanya usulan. Validator bahasa (registerGuard) menolak kosakata vonis sebelum hasil disimpan.

Stack: Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui, Drizzle ORM di atas libSQL (Turso di production, SQLite file di dev dan test), Vitest, Playwright, deploy Vercel.

Struktur folder ringkas:

```
app/(publik)     landing, login, daftar
app/(member)     beranda, uang, arus, suara, profil
app/(gov)        pemerintah, pemerintah/koperasi/[id]
app/(subjek)     pembukuan (konsol simulasi)
app/api          route handlers (kontrak API)
lib/contracts    tipe domain (Zod), sumber tunggal
lib/llm          klien model, chatJSON, runAudit
lib/audit        orkestrasi audit, snapshot, aturan warna
lib/prompts      prompt Bahasa Indonesia per agen
lib/registerGuard validator bahasa sebelum persist
lib/copy         seluruh string UI terpusat
db               skema Drizzle, klien libSQL
scripts/seed     seed deterministik + precompute audit
styles/tokens    empat lapisan token desain per permukaan
```

## Menjalankan secara lokal

Prasyarat: Node.js 20 ke atas dan pnpm.

```bash
# 1. Salin environment
cp .env.example .env        # dev tanpa TURSO_* memakai SQLite file lokal ./dev.db
# isi SESSION_SECRET minimal 32 karakter acak

# 2. Pasang dependency
pnpm install

# 3. Seed data demo (deterministik, idempoten)
pnpm seed

# 4. Jalankan
pnpm dev                    # http://localhost:3000
```

Untuk build produksi lokal: `pnpm build` lalu `pnpm start`. Tanpa TURSO_DATABASE_URL, aplikasi memakai file SQLite lokal sehingga seluruh test dan seed berjalan tanpa jaringan.

## Perintah

```bash
pnpm dev            # server pengembangan
pnpm build          # build produksi
pnpm start          # jalankan build produksi
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint + prettier
pnpm test           # vitest (unit + integrasi) dengan coverage
pnpm e2e            # playwright (journey, mock LLM deterministik)
pnpm seed           # seed data demo
pnpm seed:verify    # checksum + timing seed
pnpm demo:hash      # bukti determinisme (dua run, hash sama)
pnpm deck:build     # render pitch deck Marp ke PDF
pnpm check-register # penegakan register bahasa 6.8
pnpm scan-secrets   # pindai rahasia (tree + riwayat git)
pnpm ci:clean       # verifikasi checkout bersih end-to-end
```

## Keputusan teknis

Setiap keputusan teknis diuji terhadap alternatif yang material (Python/FastAPI, Go, Postgres, multi-provider) dan dapat dipertahankan di hadapan juri. Ringkasnya: satu bahasa (TypeScript) karena jantung produk adalah antarmuka yang diport dari empat bundle desain; libSQL/Turso karena filesystem serverless ephemeral dan dev/test bebas jaringan; satu model satu provider karena nilai ada di desain prompt bukan keragaman model; DEMO_MODE default karena demo yang tidak pernah gagal adalah fitur. Uraian lengkap dengan alternatif dan alasan penolakan ada di [docs/keputusan-teknis.md](docs/keputusan-teknis.md) dan kontrak beku ada di [blueprint-pramana-ai.md](blueprint-pramana-ai.md) section 6.

## Disclosure AI

Gagasan inti Pramana AI adalah karya asli Tim Daulat dan terdokumentasi sebelum pembangunan. AI generatif dipakai sebagai alat bantu teknis: Claude Opus 4.8 via Claude Code untuk implementasi kode, debugging, dan dokumentasi; MiniMax-M2.7 sebagai mesin runtime produk yang menjalankan agen pemeriksa. Pernyataan lengkap ada di [DISCLOSURE-AI.md](DISCLOSURE-AI.md), rincian per tahap ada di [.crown/ai-usage.md](.crown/ai-usage.md).

## Lisensi

MIT. Lihat [LICENSE](LICENSE). Seluruh data dalam repositori ini bersifat sintetis; tidak ada data pribadi nyata.
