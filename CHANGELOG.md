# Changelog

Seluruh perubahan penting proyek ini dicatat di berkas ini. Format mengikuti
[Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan proyek menganut
[Semantic Versioning](https://semver.org/lang/id/).

## [1.0.0] - 2026-07-10

Rilis purwarupa pertama untuk Hackathon Digital Cooperatives Expo 2026.

### Ditambahkan

- Mesin audit multi-agent: empat agen forensik paralel (Konflik Kepentingan,
  Anomali Transaksi, Kesehatan Finansial, Kepatuhan Proses) plus adjudikator,
  dengan aturan warna verdict yang dihitung ulang di server.
- Aplikasi anggota mobile-first (PWA): beranda verdict, temuan dengan penjelasan
  awam dan pertanyaan RAT, uang Anda, arus dana, suara Anda.
- Dasbor pemerintah: agregat 12 koperasi, distribusi verdict, drill-down detail,
  pemeriksaan ulang langsung dengan fallback cache.
- Konsol Simulasi Pembukuan (subjek): pencatatan transaksi dan pinjaman yang
  menjadi sumber data audit langsung.
- Landing page publik statis dengan statistik nasional bersumber dan cara kerja.
- Onboarding keanggotaan digital dengan verifikasi NIK tersimulasi.
- DEMO_MODE deterministik: seluruh alur juri dari data seed, byte-identik antar
  run, tidak bergantung jaringan atau API model.
- Validator bahasa (registerGuard): menegakkan prinsip bertanya bukan menuduh.
- Seed deterministik idempoten dengan enam anomali tertanam.

### Keamanan

- Sesi cookie tersandatangani, tiga role dengan deny-by-default, hash bcrypt,
  rate limit login, validasi Zod di seluruh boundary, scoping anti-IDOR pada
  aksi konsol dan pengangkatan temuan.
