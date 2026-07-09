# Blueprint: Pramana AI

## 0. Meta

Satu kalimat: Pramana AI adalah pengawas tata kelola koperasi desa berbasis AI multi-agent yang mengaudit koperasi atas nama anggotanya, memberi verdict hijau/kuning/merah beserta pertanyaan untuk Rapat Anggota Tahunan, dengan aplikasi mobile-first untuk anggota dan dasbor web untuk pemerintah.

Status: v1.0, locked, siap eksekusi Orchestrator. Tanggal: 7 Juli 2026.
Tim: Daulat (Ghaisan Khoirul Badruzaman, Kemal Ardian), Politeknik Negeri Bandung.
Konteks kompetisi: Hackathon Digital Cooperatives Expo 2026 (Kemenkop RI x PEBS FEB UI), Top 100, Offline Hackathon dan Pitching Day 10-11 Juli 2026 di Hotel Borobudur Jakarta, Awarding 12 Juli. Tema terkunci: Keterlibatan Masyarakat dalam Berkoperasi.

Cakupan dokumen: layer 1-8 penuh. Yang diserahkan ke Orchestrator pada planning time: layout file internal, pola implementasi di dalam komponen, micro-choice library (dalam batas dependency-hygiene), lebar fan-out per fase, dan detail implementasi tiap invariant. Yang TIDAK boleh direlitigasi Orchestrator: semua kontrak di section 6, semua ADR di section 5, scope edge di section 2, dan register copy di section 6.8.

Bahasa dokumen: prosa Bahasa Indonesia, seluruh kontrak/kode/perintah dalam English/code. Produk 100 persen berbahasa Indonesia.

Aturan gaya yang mengikat seluruh output tekstual produk dan dokumen turunannya: tanpa em dash, tanpa emoji, sapaan "Anda" bukan "kamu". Ini acceptance criteria (AC-COPY-01..03), bukan preferensi.

## 1. Vision dan Problem

Program Koperasi Desa Merah Putih menyalurkan plafon hingga Rp3 miliar ke lebih dari 83.000 koperasi. Pengawasannya rapuh: badan pengawas sering formalitas (ketua pengawas dijabat Kepala Desa ex-officio, anggota pengawas tetangga tanpa keahlian audit), baru sekitar 50.383 koperasi yang melaksanakan RAT per akhir Juni 2026, dan studi CELIOS memperkirakan risiko kebocoran sekitar Rp60 juta per unit per tahun. Anggota, pemilik sah koperasi, tidak punya alat untuk memahami ke mana dananya mengalir, apalagi mengawasinya.

Pramana AI membalik arah pengawasan: bukan alat untuk pengurus, melainkan pengawas yang bekerja untuk anggota. Empat agen forensik (Konflik Kepentingan, Anomali Transaksi, Kesehatan Finansial, Kepatuhan Proses) berjalan paralel membaca transaksi koperasi, satu Agen Adjudikator menyatukan temuan menjadi verdict hijau/kuning/merah plus daftar pertanyaan berbahasa awam. Prinsip yang dipegang mutlak: Pramana bertanya, tidak pernah menuduh. Temuan dapat diangkat anggota menjadi agenda RAT sehingga pengurus menjawab di depan umum; pemerintah memperoleh dasbor agregat nasional.

Nilai inti yang harus benar agar produk ini berarti: seorang anggota desa berliterasi finansial rendah, dalam waktu di bawah 60 detik sejak membuka aplikasi, memahami apakah koperasinya sehat dan apa yang harus ia tanyakan. Semua fitur lain adalah fondasi untuk momen itu.

Pengguna: (1) Anggota koperasi desa, pengalaman mobile-first, dilayani dan diberdayakan; (2) Pemerintah (Kemenkop/OJK), dasbor desktop, melihat agregat. Pengurus koperasi adalah subjek yang diaudit, bukan operator, dan tidak pernah memegang kendali; pengurus tidak pernah menjadi operator Pramana; kehadirannya dua: tanggapan tertulis seeded pada temuan, dan Konsol Simulasi Pembukuan (F17) yang secara eksplisit diframe sebagai sistem pembukuan koperasi, sumber data yang diawasi Pramana, bukan bagian produk Pramana untuk pengurus.

Mengapa sekarang: dana KDMP sedang mengalir, kritik publik soal risiko korupsi sedang panas, SIMKOPDES sudah menjadi backbone data, dan juri kompetisi adalah pemangku kepentingan yang paling ingin masalah ini terjawab.

## 2. Scope, Success, dan Constraints

### 2.1 In scope (must exist)

1. Aplikasi web responsif satu basis kode (Next.js), dua pengalaman: anggota (mobile-first, PWA installable) dan pemerintah (desktop dashboard).
2. Onboarding keanggotaan digital: daftar dengan data diri plus NIK (verifikasi tersimulasi deterministik), hasil kartu anggota digital.
3. Empat layar anggota sesuai konsep: Uang Anda; Koperasi Anda Sehat? (verdict); Yang Perlu Anda Tahu (temuan, tombol "Kenapa ini penting?", tombol "Tambahkan ke pertanyaan rapat"); Ke Mana Uang Koperasi Pergi (cerita visual arus dana bulanan). Plus Suara Anda (voting keputusan koperasi dan agregasi pertanyaan RAT).
4. Mesin audit: 4 agen forensik paralel + 1 Adjudikator, runtime MiniMax (model MiniMax-M2.7) via abstraksi provider OpenAI-compatible, output JSON tervalidasi Zod, verdict enum {hijau,kuning,merah}.
5. DEMO_MODE deterministik: hasil audit precomputed tersimpan di DB, demo tidak bergantung API live; jalur live-audit opsional dengan fallback otomatis ke cache.
6. Dasbor pemerintah: agregat 12 koperasi sintetis (1 detail penuh), distribusi verdict, tren temuan, drill-down ke koperasi detail.
7. Data sintetis realistis: 1 koperasi detail (unit usaha dari 7 gerai resmi KDMP) dengan >= 6 anomali tertanam yang terpetakan ke agen, ditambah 11 koperasi summary.
8. Auth multi-role sederhana: anggota, pemerintah, dua akun uji juri (juri-anggota, juri-pemerintah), seeded credentials.
9. Deliverables hackathon sebagai output build: repo publik siap-submit (README lengkap: instalasi, arsitektur, kredensial juri, disclosure AI), pitch deck source 10-12 slide plus render PDF, skrip video demo <= 3 menit, URL demo live di Vercel.
10. Kualitas produksi penuh per matriks 28 dimensi (section 8), tanpa penurunan mutu.
11. Landing page publik pada rute / sebagai wajah produk saat juri membuka URL: hero, statistik masalah, cara kerja, preview dua antarmuka, CTA ke login dan pendaftaran; statis tanpa panggilan API.
12. Konsol Simulasi Pembukuan (subjek) pada rute /pembukuan, role pengurus: mencatat transaksi (dengan vendor nama dan alamat), menyetujui pinjaman (plafon, dokumen, penyetuju, jatuh tempo), mengatur status RAT, dengan empat preset skenario; entri langsung masuk DB sehingga pemeriksaan live MiniMax membaca data baru sungguhan.

### 2.2 Explicitly OUT of scope (hard boundary, Orchestrator dilarang membangun ini)

1. Panel manajemen koperasi untuk pengurus di dalam produk Pramana (CRUD anggota, laporan, pengaturan). Yang in scope hanya Konsol Simulasi Pembukuan (F17), diframe sebagai sistem pembukuan koperasi sumber data, plus tanggapan pengurus seeded pada temuan.
2. Integrasi live ke SIMKOPDES atau API pemerintah mana pun. SIMKOPDES hanya referensi skema dan narasi; endpointnya SPA tanpa API publik.
3. Verifikasi NIK/KTP sungguhan ke Dukcapil. Verifikasi tersimulasi (NIK valid = 16 digit numerik), diberi label "simulasi purwarupa" di UI.
4. Push notification, SMS, WhatsApp. Notifikasi in-app saja.
5. Pembayaran/transfer uang nyata, top-up simpanan, pencairan pinjaman.
6. Multi-bahasa. Bahasa Indonesia saja (i18n dimensi 28: dinyatakan in-scope-single-locale; string terpusat, tanpa hardcode tersebar).
7. Self-host model on-premise. Itu narasi produksi di pitch, bukan implementasi MVP.
8. Native app (APK/iOS). PWA installable mencukupi ketentuan panitia (URL web/PWA).
9. Fitur admin CRUD koperasi/anggota melalui UI. Seed via script.
10. Mengubah konsep produk. Empat agen + adjudikator, empat layar satu alur, prinsip bertanya-bukan-menuduh, dan model tiga aktor adalah final. Scope creep = pelanggaran gate.

### 2.3 Success criteria (terukur)

- S1: Alur juri-anggota end-to-end (login -> verdict -> temuan Toko Berkah Rp15 juta -> kenapa penting -> tambah ke pertanyaan rapat -> Suara Anda menunjukkan agregasi >= 12 anggota) lulus e2e Playwright tanpa intervensi. (AC-E2E-01)
- S2: Alur juri-pemerintah (login -> overview 12 koperasi -> drill-down koperasi merah -> daftar temuan) lulus e2e. (AC-E2E-02)
- S3: DEMO_MODE menghasilkan output byte-identik pada dua run berturut (hash JSON verdict sama). (AC-DEMO-01)
- S4: Dengan LLM_API_KEY dikosongkan, seluruh alur juri tetap berfungsi dari cache. (AC-DEMO-03)
- S5: Live audit run (bila key tersedia) menghasilkan verdict valid-schema dalam <= 90 detik p95. (AC-LLM-04)
- S6: Checklist deliverables panitia lengkap dan terverifikasi mesin. (AC-DEL-01..07)
- S7: Seluruh gate 0-9 lulus dengan evidence manifest, Report.md jujur tertulis.
- S8: Loop subjek-ke-temuan lintas permukaan lulus e2e dengan LLM mock deterministik (AC-SUBJ-02), dan berfungsi live saat key tersedia.

### 2.4 Hard constraints

- C1 Waktu: build otonom dimulai 7-8 Juli 2026; submit final deliverables via portal SIMKOPDES sebelum batas sprint berakhir di venue 11 Juli; keterlambatan 1 detik menggugurkan. Konsekuensi: deploy-first (Gate 0 mensyaratkan URL live), tidak ada pekerjaan yang menunda deployability.
- C2 Aturan AI panitia: AI generatif hanya sebagai alat bantu teknis (coding assistance, debugging, riset, aset pelengkap); gagasan inti orisinal tim; disclosure wajib dan pemalsuan disclosure = diskualifikasi. Konsekuensi: file DISCLOSURE-AI.md dan section README wajib, log penggunaan di .crown/ai-usage.md, deck memuat slide disclosure. Gagasan inti (konsep watchdog, arsitektur agen, prinsip, tipologi) sudah orisinal dari tim dan terdokumentasi pra-build.
- C3 Legal defamasi: output yang menuduh individu adalah risiko hukum nyata. Konsekuensi: kontrak output adjudicator melarang kosakata vonis (section 6.5), diverifikasi test fixture.
- C4 Biaya runtime: anggaran API model untuk build+penjurian <= $25. MiniMax M-series bertarif $0.30/M input dan $1.20/M output (tier standar), sehingga 200 audit run jauh di bawah plafon.
- C5 Platform juri: demo dinilai dari URL live + akun uji; jaringan venue tidak bisa diandalkan. Konsekuensi: DEMO_MODE default true di deployment, video backup, seed idempoten.
- C6 Data pribadi: tidak ada data pribadi nyata di repo/DB; semua data sintetis; NIK sintetis tidak boleh valid-checksum milik orang nyata (gunakan prefix fiktif konsisten).
- C7 Bobot juri: Relevansi 25, Inovasi 20, Dampak 20, Kemudahan Implementasi 15, Kualitas Teknologi 15, Presentasi 5. Konsekuensi: kualitas data sintetis dan bahasa awam temuan adalah fitur kelas satu, bukan polish.
- C8 Register copy: seluruh teks UI dan output model memakai "Anda", tanpa em dash, tanpa emoji, tanpa jargon akuntansi di layar anggota. Hook lint menegakkan.

## 3. Product dan Features (prioritized, tied to core value)

Prioritas P0 = tanpa ini produk gagal; P1 = wajib ada untuk kualitas penuh; P2 = ada karena konsep menjanjikannya, boleh sederhana.

- F01 P0 Mesin Audit Multi-Agent. 4 agen forensik paralel + adjudicator; input snapshot data koperasi; output Verdict JSON valid. Nilai: inilah Pengawas.
- F02 P0 Layar "Koperasi Anda Sehat?". Verdict warna + satu kalimat ringkasan + jumlah temuan. Nilai: momen 60 detik.
- F03 P0 Layar "Yang Perlu Anda Tahu". Daftar temuan berbahasa awam; per temuan: judul, penjelasan, "Kenapa ini penting?" (expand), bukti (transaksi terkait), tombol "Tambahkan ke pertanyaan rapat"; satu temuan menampilkan Tanggapan Pengurus (seeded). Nilai: jantung produk.
- F04 P0 DEMO_MODE deterministik + fallback cache. Nilai: demo tidak pernah gagal.
- F05 P0 Auth multi-role + akun juri seeded. Nilai: syarat penjurian.
- F06 P0 Seed data sintetis dengan anomali tertanam (section 6.7). Nilai: tanpa ini agen tidak menemukan apa-apa.
- F07 P0 Dasbor pemerintah: overview agregat, distribusi verdict, tabel koperasi, drill-down. Nilai: pengguna kedua, cerita nasional.
- F08 P1 Layar "Uang Anda": simpanan (pokok+wajib+sukarela), sisa pinjaman, cicilan berikutnya (nominal+tanggal). Nilai: utilitas harian, fondasi kepercayaan.
- F09 P1 Layar "Ke Mana Uang Koperasi Pergi": ringkasan arus kas bulanan (masuk/keluar per kategori) sebagai cerita visual sederhana; sorotan aliran yang terkait temuan aktif. Nilai: transparansi yang membuat temuan bisa diperiksa sendiri.
- F10 P1 Suara Anda: (a) agregasi pertanyaan RAT ("N anggota menanyakan hal yang sama") dari keranjang seluruh anggota; (b) voting keputusan koperasi (seed: "Pembelian freezer untuk gerai sembako, Rp8.500.000", pilihan Setuju/Tidak Setuju, hasil sementara terlihat setelah memilih). Nilai: partisipasi yang mengubah RAT dari seremoni menjadi pengawasan.
- F11 P1 Onboarding keanggotaan digital: form data diri + NIK, verifikasi tersimulasi, kartu anggota digital (nama, nomor anggota, QR placeholder). Nilai: kemudahan keanggotaan digital sesuai tema.
- F12 P1 Live audit trigger di dasbor pemerintah ("Jalankan Pemeriksaan Ulang") dengan status berjalan, fallback otomatis ke cache saat gagal, banner kecil sumber hasil (cache vs live). Nilai: bukti mesin nyata saat pitch.
- F13 P1 Notifikasi in-app sederhana: badge "Pengawas menemukan N hal yang sebaiknya Anda tanyakan bulan ini" di home anggota. Nilai: hook keterlibatan dari konsep.
- F14 P2 PWA: manifest, ikon, installable, offline shell untuk halaman terakhir dibuka (best-effort, bukan offline penuh). Nilai: klaim PWA di deliverable jujur.
- F15 P0 Deliverables engine: README, DISCLOSURE-AI.md, docs/keputusan-teknis.md (pertahanan teknis untuk tanya jawab juri), pitch-deck source (Marp markdown) + PDF render, skrip video, kredensial juri terdokumentasi. Nilai: syarat lolos, gate fail-closed.
- F17 P0 Konsol Simulasi Pembukuan (subjek), rute /pembukuan, role pengurus: form catat transaksi (jenis, jumlah, tanggal, unit usaha, vendor nama dan alamat, deskripsi, anggota opsional), form persetujuan pinjaman (anggota, pokok, cicilan, jatuh tempo, disetujui oleh, toggle dokumen lengkap), panel status RAT, empat preset skenario satu per agen, daftar entri terakhir, saldo kas hidup, indikator tersinkron. Nilai: demo berubah dari tur data mati menjadi loop sebab-akibat yang disaksikan juri, dan sumber semua tipologi 6.6 bisa disimulasikan.
- F16 P1 Landing page publik pada rute /: hero dengan tagline dan CTA persona, tiga statistik masalah dari lib/facts.ts, penjelasan cara kerja empat pemeriksa plus adjudikator, preview kedua antarmuka dalam device frame, footer tim; sepenuhnya statis tanpa panggilan API. Nilai: kesan pertama juri dan gerbang alur pitching.

## 4. UX dan Interaction (functional truth; visual truth milik design handoff)

Aturan porting: blueprint ini memiliki kebenaran fungsional dan arsitektural; EMPAT bundle Claude Design (pramana-ai_mobile.zip untuk aplikasi anggota, pramana-ai_dashboard.zip untuk dasbor pemerintah, pramana-ai_landing-page.zip untuk landing page, pramana-ai_dashboard-subjek.zip untuk konsol pembukuan subjek) memiliki kebenaran visual dan interaksi, dan statusnya INPUT WAJIB sekaligus lantai kualitas, bukan referensi. Orchestrator tidak mendesain UI dari nol; ia mem-PORT hasil Claude Design: token diadopsi verbatim, setiap layar direkonstruksi setia terhadap screenshot bundle (struktur, hirarki, komposisi, kedua tema), perilaku diimplementasikan dari kontrak blueprint. Downgrade diam-diam (menyederhanakan layout, mengganti komponen desain dengan versi generik, menghapus state, menurunkan polish) adalah pelanggaran gate. Perubahan hanya sah satu arah, ke atas: improvement terdokumentasi per kontrak 6.19. Jika salah satu bundle absen atau korup saat Phase 0, Orchestrator STOP and ask; tidak ada jalur desain interim. Konflik (field/layar/state yang ada di design tapi tidak ada di kontrak, atau sebaliknya) DIBENDERAI, tidak dipilih diam-diam.

Persyaratan interaksi yang mengikat (apa yang UI harus LAKUKAN):

- U1 Anggota mobile-first 360-430 px; navigasi bawah 4 tab: Beranda (verdict), Uang Anda, Arus Dana, Suara Anda. Temuan dibuka dari Beranda.
- U2 Aksesibilitas literasi rendah: angka nominal ukuran besar, ikon berdampingan kata, touch target >= 44 px, kontras memenuhi WCAG AA, satu gagasan per layar.
- U3 Verdict screen: warna dominan (hijau/kuning/merah), satu kalimat ringkasan, CTA tunggal "Lihat yang perlu Anda tahu".
- U4 Temuan: bahasa awam tanpa jargon; setiap temuan merah/kuning menampilkan >= 1 pertanyaan siap-pakai untuk RAT; aksi "Tambahkan ke pertanyaan rapat" memberi konfirmasi visual dan menaikkan agregat di Suara Anda.
- U5 Arus Dana: total masuk, total keluar, breakdown kategori, dan penanda visual pada aliran yang sedang diperiksa Pengawas (link ke temuan).
- U6 Suara Anda: daftar pertanyaan agregat terurut jumlah penanya; voting card dengan status sudah/belum memilih; hasil sementara setelah memilih.
- U7 Dasbor pemerintah desktop >= 1280 px: KPI atas (jumlah koperasi, persentase hijau/kuning/merah, temuan terbuka), tabel koperasi sortable, halaman detail koperasi berisi verdict, temuan, dan tren.
- U8 Login: satu halaman, kredensial, arah redirect per role; kredensial juri tercetak di README dan halaman login (hint box kecil "Akun uji juri"), keputusan sadar demi kemudahan penjurian.
- U9 Empty/error states didefinisikan untuk: belum ada audit run, API gagal (tampilkan cache + banner), data kosong.
- U10 Seluruh copy mengikuti register section 6.8.
- U11 Landing page responsif 390-1440 pada kedua tema; CTA jelas menuju /login (persona anggota dan pemerintah) dan /daftar; statistik hanya dari lib/facts.ts beserta sumber; tanpa panggilan API agar demo-proof.
- U12 Konsol subjek desktop 1440 tahan mulai 1024, kedua tema; header wajib berlabel "Simulasi Pembukuan Koperasi" dengan subjudul "Sumber data yang diawasi Pramana"; saldo kas selalu terlihat dan berubah setelah entri; validasi form berbahasa awam; preset mengisi form, tidak auto-submit.

## 5. Architecture dan Technical Decisions

Bentuk sistem: satu aplikasi Next.js (App Router) full-stack di Vercel. Komponen dan tanggung jawab:

1. Web app (RSC + client components): dua area route group, (member) dan (gov), satu login.
2. API layer (route handlers): kontrak section 6.3; validasi Zod di boundary; error format standar.
3. Audit engine (lib/audit): orkestrasi 4+1 panggilan model, mapping snapshot data -> prompt, validasi output, persist AuditRun+Findings.
4. LLM provider abstraction (lib/llm): satu OpenAI-compatible client ke MiniMax (base https://api.minimax.io/v1, model MiniMax-M2.7); tanpa provider fallback; timeout, retry-once-on-invalid-JSON, Promise.allSettled paralel. Panggilan non-streaming agar reasoning tidak bocor ke output.
5. Data layer: Drizzle ORM di atas libSQL (Turso) untuk production/preview; file SQLite lokal untuk dev/test. Skema section 6.2.
6. Seed engine (scripts/seed): generator deterministik (seed RNG tetap) yang menanam anomali kontraktual section 6.7; idempoten.
7. Demo controller: env DEMO_MODE; precompute audit hasil saat seed; live trigger menulis run baru bertanda source=live.
8. Deliverables engine (scripts/deliverables): render deck Marp -> PDF, validasi checklist panitia, generate ringkasan kredensial.

ADR (final, tidak direlitigasi):

- ADR-01 Stack: Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui, deploy Vercel. Alasan: kecepatan tertinggi dengan kualitas produksi dan ekosistem komponen; konsensus stack 2026. Alternatif (Remix, SvelteKit) ditolak demi familiaritas tooling agen dan template shadcn.
- ADR-02 Model runtime: MiniMax-M2.7 (satu model, satu provider) untuk KEEMPAT agen forensik DAN Adjudicator, via api.minimax.io (OpenAI-compatible, base https://api.minimax.io/v1). Tidak ada provider fallback; kegagalan panggilan model jatuh ke hasil cache (bukan ke provider lain). Alasan: keputusan tim (ketersediaan kredit MiniMax), satu provider menyederhanakan kontrak dan operasi, M-series bertarif rendah dan berkonteks panjang. Catatan teknis: panggilan audit non-streaming dan thinking tidak dibiarkan implisit, karena stream MiniMax M2.x dapat membocorkan reasoning_content ke output. Peran forensik vs adjudikator dibedakan lewat prompt, bukan lewat model berbeda. Routing via env, bukan kode.
- ADR-03 DEMO_MODE precomputed adalah perilaku default deployment. Alasan: kesalahan fatal hackathon nomor satu adalah demo bergantung network/API live; hasil audit disimpan di DB saat seed sehingga juri tidak pernah melihat spinner kosong. Live audit tetap ada sebagai bukti mesin.
- ADR-04 Database: Turso (libSQL) production, SQLite file dev. Alasan: Vercel serverless filesystem ephemeral sehingga SQLite lokal tidak persist; Turso memberi SQLite-compatible tanpa ubah kode Drizzle. Alternatif Neon/Supabase ditolak: overhead Postgres tidak dibutuhkan skala demo.
- ADR-05 Auth: credentials seeded + session cookie tersandatangani (iron-session atau setara), tiga role. Alasan: auth kompleks adalah titik rapuh demo; kebutuhan riil hanya pemisahan role dan akun juri. OAuth out of scope.
- ADR-06 Model Orchestrator build: Claude Opus 4.8, ultracode. Alasan: keputusan operator; stabilitas terverifikasi untuk run otonom panjang; Fable 5 punya riwayat suspend-restore dan classifier fallback sehingga tidak dipakai untuk run ini. Launch line di prompt orchestrator memakai --model opus.
- ADR-07 Kepemilikan .claude/: Orchestrator menulis SELURUH .claude/ (settings, hooks, rules, agents jika perlu, CLAUDE.md) pada Phase 0. Alasan: directive operator; koreksi atas asumsi foundation-turn manusia di metode lama. Konsekuensi jujur: pada versi Claude Code saat ini write ke .claude/settings dan hooks dapat memunculkan approval prompt meski bypass; operator hadir saat launch dan meng-approve prompt awal tersebut sekali, setelah itu run berjalan otonom dan PreToolUse deny yang sudah aktif melindungi sisa run. Jika platform ternyata tidak mem-prompt, lebih baik. Worker/subagent tetap hard-deny menulis .claude/, .git/, .env, test, evidence.
- ADR-08 Deploy-first: proyek terhubung Vercel dan URL live sejak Gate 0; setiap gate berikutnya menjaga deployability (build hijau = deploy preview hijau). Alasan: membunuh integrasi/deploy last-minute; URL adalah deliverable wajib.
- ADR-09 Monorepo tunggal, satu app. Alasan: dua UI satu basis kode responsif sesuai konsep; memisah repo menambah biaya integrasi tanpa nilai.
- ADR-10 Pitch deck via Marp (markdown -> PDF) sebagai source-of-truth konten; polish visual manusia opsional setelahnya. Alasan: deck adalah deliverable bergate; markdown membuatnya machine-checkable (jumlah slide, slide wajib) dan mudah diedit Ghaisan.
- ADR-11 Copy governance: seluruh string UI terpusat di lib/copy.ts (atau modul setara) agar hook lint register (Anda/em dash/jargon) bekerja pada satu permukaan; output model dilewatkan validator kosakata yang sama sebelum persist.
- ADR-12 Angka nasional di UI/deck memakai konstanta lib/facts.ts dengan sumber dan tanggal (83.383 koperasi per 29 Juni 2026; ~50.383 telah RAT; risiko ~Rp60 juta/unit/tahun versi CELIOS), agar bisa diperbarui satu tempat dan pitch tetap jujur soal sumber.
- ADR-13 Porting desain, bukan authoring desain: dua bundle Claude Design adalah input wajib dan lantai kualitas visual; Orchestrator dilarang membangun UI dari nol atau menurunkan mutu bundle, dan hanya boleh menaikkannya lewat improvement terdokumentasi (kontrak 6.19). Alasan: directive operator; pemisahan tanggung jawab yang disengaja antara Claude Design (visual) dan Orchestrator (implementasi). Konsekuensi: launch mensyaratkan keempat zip ada.

Kedalaman keputusan, bukan formalitas: setiap ADR di atas adalah hasil trade-off nyata dan harus bisa dipertahankan di depan juri yang bertanya kenapa bukan Python, kenapa bukan Golang, kenapa bukan Postgres. Orchestrator pada Phase 0 menguji ulang ADR-01 sampai ADR-13 dari prinsip pertama secara adversarial, minimal membandingkan stack terkunci terhadap Python/FastAPI dan Go serta libSQL/Turso terhadap Postgres untuk konstrain produk ini (empat bundle desain ber-token Tailwind, satu basis kode, demo juri, landasan waktu tiga hari), lalu menuliskan hasilnya ke docs/keputusan-teknis.md lengkap dengan alternatif yang dipertimbangkan dan alasan penolakannya. Jika sebuah pilihan terkunci ternyata tidak bisa dijustifikasi jujur terhadap alternatif yang material lebih baik, jalurnya STOP and ask dengan kasus tertulis, bukan kepatuhan diam-diam dan bukan deviasi diam-diam. Wilayah latitude diputuskan atas dasar merit dan didokumentasikan sambil jalan: desain fisik database (foreign key aktif, indeks untuk pola query panas, strategi migrasi), bentuk query, dan pemilihan library dalam batas dependency-hygiene.

<contracts>

## 6. Interface Contracts (FROZEN)

Semua yang ada di section ini beku. Dua agen yang membangun secara independen terhadap kontrak ini harus menghasilkan kode yang kompatibel. Perubahan apa pun = stop-and-ask, dicatat di Report.

### 6.1 Domain types (TypeScript + Zod, file: lib/contracts.ts, satu-satunya sumber tipe domain)

```ts
export const AgentId = z.enum([
  "konflik_kepentingan",
  "anomali_transaksi",
  "kesehatan_finansial",
  "kepatuhan_proses",
]);

export const Severity = z.enum(["info", "kuning", "merah"]);
export const VerdictColor = z.enum(["hijau", "kuning", "merah"]);
export const AuditSource = z.enum(["seed", "live", "cache"]);

export const EvidenceRef = z.object({
  jenis: z.enum(["transaksi", "pinjaman", "rasio", "jadwal"]),
  id: z.string(),            // id baris terkait di DB
  label: z.string(),         // teks singkat manusiawi, mis. "Pembelian Rp15.000.000 ke Toko Berkah, 14 Juni 2026"
});

export const AgentFinding = z.object({
  id: z.string(),                        // ULID
  agent: AgentId,
  severity: Severity,
  judul: z.string().max(90),
  penjelasan_awam: z.string().max(600),  // bahasa manusia, tanpa jargon
  kenapa_penting: z.string().max(600),
  bukti: z.array(EvidenceRef).min(1),
  pertanyaan_rat: z.string().max(280),   // WAJIB berbentuk kalimat tanya, diakhiri "?"
});

export const Verdict = z.object({
  warna: VerdictColor,
  ringkasan: z.string().max(200),        // satu kalimat
  temuan: z.array(AgentFinding),
});

export const AuditRun = z.object({
  id: z.string(),
  koperasiId: z.string(),
  periode: z.string(),                   // "2026-06"
  source: AuditSource,
  verdict: Verdict,
  dibuatPada: z.string(),                // ISO datetime
  durasiMs: z.number().int().nonnegative(),
});
```

Aturan derivasi warna (deterministik, diimplementasikan di adjudicator DAN divalidasi server-side, server-side menang):
merah jika ada >= 1 temuan severity merah; kuning jika ada >= 1 temuan kuning tanpa merah; hijau jika tidak ada temuan kuning/merah. Temuan info tidak mengubah warna.
Verdict warna kuning/merah WAJIB memiliki >= 1 temuan dengan pertanyaan_rat terisi.

### 6.2 Database schema (Drizzle, libSQL; nama tabel dan kolom beku, tipe internal Drizzle bebas)

```
users(id, email UNIQUE, passwordHash, role ENUM('anggota','pemerintah','pengurus'), anggotaId NULL, pengurusId NULL, createdAt)
koperasi(id, nama, desa, kabupaten, provinsi, isDetailSeeded BOOL, saldoKas INT, ratStatus ENUM('belum','terlaksana'), ratTanggal NULL, dibentukPada)
unit_usaha(id, koperasiId FK, nama, jenis ENUM('sembako','simpan_pinjam','apotek','klinik','gudang','logistik','kantor'))
pengurus(id, koperasiId FK, nama, jabatan ENUM('ketua','wakil','sekretaris','bendahara','pengawas'), alamat)
anggota(id, koperasiId FK, nama, nik CHAR(16), noAnggota UNIQUE, alamat, bergabungPada)
simpanan(id, anggotaId FK, jenis ENUM('pokok','wajib','sukarela'), saldo INT)
pinjaman(id, anggotaId FK, pokok INT, sisa INT, cicilanBulanan INT, jatuhTempoBerikut DATE,
         disetujuiPada DATETIME, disetujuiOleh FK pengurus, dokumenLengkap BOOL)
transaksi(id, koperasiId FK, unitUsahaId FK NULL, tanggal DATE, jenis ENUM('setoran_simpanan','penarikan_simpanan',
         'pencairan_pinjaman','angsuran','pembelian','penjualan','gaji','operasional','shu'),
         arah ENUM('masuk','keluar'), jumlah INT, deskripsi, vendorNama NULL, vendorAlamat NULL, anggotaId NULL FK)
audit_run(id, koperasiId FK, periode, source, verdictWarna, ringkasan, durasiMs, rawJson TEXT, dibuatPada)
temuan(id, auditRunId FK, agent, severity, judul, penjelasanAwam, kenapaPenting, pertanyaanRat, buktiJson TEXT,
       tanggapanPengurus TEXT NULL)
pertanyaan_rat(id, temuanId FK, anggotaId FK, ditambahkanPada, UNIQUE(temuanId, anggotaId))
keputusan(id, koperasiId FK, judul, deskripsi, nominal INT NULL, status ENUM('terbuka','ditutup'), dibukaPada)
vote(id, keputusanId FK, anggotaId FK, pilihan ENUM('setuju','tidak'), UNIQUE(keputusanId, anggotaId))
notifikasi(id, anggotaId FK, teks, dibacaPada NULL, dibuatPada)
```

Invariant data (frozen): tidak ada query tanpa batas; endpoint daftar transaksi paginated max 50/halaman; agregasi bulanan dihitung query agregat, bukan load-all (pelajaran MedWatch, AC-PERF-03).

### 6.3 API contract (Next.js route handlers; JSON; semua response memakai envelope)

Envelope sukses: `{ ok: true, data: <payload> }`. Envelope gagal: `{ ok: false, error: { code: string, message: string } }` dengan HTTP status sesuai. Kode error beku: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `LLM_UNAVAILABLE`, `INTERNAL`.

```
POST /api/auth/login        body {email, password}            -> {role, redirectTo}
POST /api/auth/logout                                          -> {loggedOut: true}
POST /api/onboarding        body {nama, nik, alamat, email, password} -> {anggotaId, noAnggota, kartu: {nama, noAnggota}}
GET  /api/member/summary    (role anggota)                    -> {uangAnda: {totalSimpanan, sisaPinjaman, cicilanBerikut:{jumlah, tanggal}}, notifikasiBelumDibaca}
GET  /api/member/verdict    (role anggota)                    -> {auditRun: AuditRun ringkas, sumber: AuditSource}
GET  /api/member/findings   (role anggota)                    -> {temuan: AgentFinding[], sudahDitambahkan: string[]}
POST /api/findings/:id/rat  (role anggota)                    -> {agregat: number}   // idempoten per (temuan, anggota)
GET  /api/member/flow?periode=2026-06 (role anggota)          -> {masuk:[{kategori,jumlah}], keluar:[{kategori,jumlah}], sorotan:[{transaksiId, temuanId}]}
GET  /api/member/voice      (role anggota)                    -> {pertanyaanAgregat:[{temuanId, judul, jumlahAnggota}], keputusan:[{...,sudahMemilih, hasil?}]}
POST /api/vote              body {keputusanId, pilihan}       -> {hasil:{setuju, tidak}}
POST /api/subjek/transaksi  (role pengurus) body SubjekTransaksiInput -> {transaksiId, saldoKasBaru}
POST /api/subjek/pinjaman   (role pengurus) body SubjekPinjamanInput  -> {pinjamanId}
POST /api/subjek/rat        (role pengurus) body {status, tanggal?}   -> {ratStatus}
GET  /api/subjek/recent     (role pengurus)                   -> {saldoKas, transaksi:[10 terakhir], pinjaman:[5 terakhir], ratStatus}
GET  /api/gov/overview      (role pemerintah)                 -> {kpi:{jumlahKoperasi, hijau, kuning, merah, temuanTerbuka}, koperasi:[{id,nama,provinsi,verdictWarna,temuanCount}]}
GET  /api/gov/koperasi/:id  (role pemerintah)                 -> {profil, auditRun, temuan[], tren:[{periode, warna}]}
POST /api/gov/audit/run     body {koperasiId} (role pemerintah) -> 202 {auditRunId, status:"berjalan"} lalu polling
GET  /api/audit/:id/status                                     -> {status:"berjalan"|"selesai"|"gagal_langsung", auditRun?}
GET  /api/health                                               -> {ok, db:"up", llm:"up"|"down"|"unset", demoMode:boolean, version}
```

Semua route role-guarded deny-by-default; anggota tidak bisa memanggil /api/gov/*, dan sebaliknya; /api/subjek/* hanya pengurus (AC-SEC-02, AC-SUBJ-03). Redirect login per role: anggota ke /beranda, pemerintah ke /pemerintah, pengurus ke /pembukuan.

### 6.3b Tipe response endpoint gabungan (frozen, lib/contracts.ts bagian API)

```ts
export type GovOverview = {
  kpi: { jumlahKoperasi: number; hijau: number; kuning: number; merah: number; temuanTerbuka: number };
  koperasi: Array<{ id: string; nama: string; provinsi: string;
    verdictWarna: "hijau" | "kuning" | "merah"; temuanCount: number }>;
};

export type FlowResp = {
  periode: string; totalMasuk: number; totalKeluar: number;
  masuk: Array<{ kategori: string; jumlah: number }>;
  keluar: Array<{ kategori: string; jumlah: number }>;
  sorotan: Array<{ transaksiId: string; temuanId: string; label: string }>;
};

export type VoiceResp = {
  pertanyaanAgregat: Array<{ temuanId: string; judul: string; jumlahAnggota: number }>;
  keputusan: Array<{ id: string; judul: string; deskripsi: string; nominal: number | null;
    status: "terbuka" | "ditutup"; sudahMemilih: boolean;
    hasil: { setuju: number; tidak: number } | null }>;   // hasil null sebelum anggota memilih
};

export type MemberSummary = {
  uangAnda: { totalSimpanan: number; sisaPinjaman: number;
    cicilanBerikut: { jumlah: number; tanggal: string } | null };
  notifikasiBelumDibaca: number;
};

export type VerdictResp = {
  auditRunId: string; periode: string; source: "seed" | "live" | "cache";
  warna: "hijau" | "kuning" | "merah"; ringkasan: string;
  jumlahTemuan: { merah: number; kuning: number; info: number };
};

export type OnboardResp = {
  anggotaId: string; noAnggota: string;
  kartu: { nama: string; noAnggota: string; koperasi: string; bergabungPada: string };
};

export type SubjekTransaksiInput = {
  jenis: "pembelian" | "penjualan" | "setoran_simpanan" | "penarikan_simpanan" |
    "pencairan_pinjaman" | "angsuran" | "gaji" | "operasional";
  jumlah: number; tanggal: string; unitUsahaId?: string;
  vendorNama?: string; vendorAlamat?: string; deskripsi: string; anggotaId?: string;
};

export type SubjekPinjamanInput = {
  anggotaId: string; pokok: number; cicilanBulanan: number; jatuhTempoBerikut: string;
  disetujuiOleh: string; dokumenLengkap: boolean;
};
```

Kategori kanonik arus dana (frozen): masuk = ["Setoran simpanan", "Angsuran pinjaman", "Penjualan gerai", "Lainnya"]; keluar = ["Pembelian stok", "Pencairan pinjaman", "Gaji dan honor", "Operasional", "Lainnya"]. Mapping jenis transaksi ke kategori: setoran_simpanan -> Setoran simpanan; angsuran -> Angsuran pinjaman; penjualan -> Penjualan gerai; pembelian -> Pembelian stok; pencairan_pinjaman -> Pencairan pinjaman; gaji -> Gaji dan honor; operasional -> Operasional; shu dan penarikan_simpanan -> Lainnya (mengikuti kolom arah).

### 6.4 LLM provider contract (lib/llm.ts)

```
Env: LLM_BASE_URL (default "https://api.minimax.io/v1"), LLM_API_KEY, LLM_MODEL (default "MiniMax-M2.7"),
     DEMO_MODE ("true" default di production).
Perilaku beku:
- chatJSON({model, system, user, schema, timeoutMs=30000}): panggil response_format JSON; validasi Zod;
  jika invalid, retry sekali dengan pesan korektif; jika tetap invalid atau timeout, throw LLMUnavailable.
- runAudit(koperasiSnapshot): Promise.allSettled 4 panggilan forensik (LLM_MODEL, prompt per agen) -> kumpulkan temuan sukses;
  jika >= 1 agen gagal, catat agen gagal di rawJson.metadata; panggilan adjudicator (LLM_MODEL yang sama, prompt adjudikator)
  menerima temuan + snapshot ringkas, mengembalikan Verdict; server memvalidasi ulang aturan warna 6.1.
- Tidak ada provider fallback. Panggilan yang melempar network/5xx/429 setelah retry korektif dianggap gagal.
- Kegagalan model -> API mengembalikan cache terakhir dengan source:"cache" dan error LLM_UNAVAILABLE
  hanya bila cache pun tidak ada. Cache adalah satu-satunya jaring pengaman (bukan provider kedua).
- Prompt agen tersimpan sebagai file di lib/prompts/*.ts, berbahasa Indonesia, memuat aturan register 6.8,
  daftar tipologi per agen (6.6), dan instruksi output-JSON-only sesuai schema.
- Snapshot runAudit dibangun dari keadaan DB terkini periode berjalan (termasuk entri Konsol
  Subjek), sehingga pemeriksaan live membaca data baru sungguhan; hasil live disimpan sebagai
  audit_run source="live" terbaru.
- Polling live audit: klien memanggil GET /api/audit/:id/status tiap 2 detik; server menandai "selesai"
  saat verdict tersimpan; klien menyerah setelah 120 detik dan menampilkan audit.gagal + hasil cache.
- Sesi: cookie httpOnly, secure di production, sameSite lax, umur 7 hari, nama "pramana_session",
  payload {userId, role, anggotaId?} ditandatangani SESSION_SECRET.
```

### 6.5 Kontrak keluaran bahasa (validator sebelum persist, lib/registerGuard.ts)

- pertanyaan_rat harus diakhiri "?" dan tidak boleh kalimat perintah/vonis.
- Kata terlarang dalam penjelasan_awam/kenapa_penting/ringkasan (case-insensitive, sebagai pernyataan): "korupsi", "mencuri", "maling", "penipuan", "menggelapkan", "pelaku". Diizinkan hanya dalam frasa edukatif berpola "disebut ..." atau "berisiko ..." maksimum satu kemunculan; implementasi: regex denylist dengan allowlist pola, temuan yang melanggar ditolak dan retry korektif satu kali, jika tetap melanggar temuan didrop dan dicatat.
- Larangan karakter: em dash, emoji. Larangan kata sapaan "kamu". (AC-COPY-01..03)

### 6.6 Kontrak tipologi per agen (apa yang tiap agen WAJIB mampu deteksi pada seed)

- Agen Konflik Kepentingan: kecocokan vendorAlamat dengan alamat pengurus; kecocokan vendorNama dengan nama keluarga pengurus (heuristik string); pengurus sebagai penerima pembayaran berulang.
- Agen Anomali Transaksi: lonjakan frekuensi persetujuan pinjaman per hari vs baseline; split purchase (>= 3 pembelian ke vendor sama, masing-masing di bawah Rp5.000.000, dalam <= 7 hari); pembelian nilai besar tanpa unit usaha terkait.
- Agen Kesehatan Finansial: tren saldo kas 3 bulan; rasio angsuran macet (pinjaman lewat jatuh tempo / total); rasio likuiditas sederhana; framing rasio mengikuti semangat Permenkop (CAR/NPL disebut dengan bahasa awam).
- Agen Kepatuhan Proses: pinjaman dengan dokumenLengkap=false; pinjaman melebihi plafon per anggota (Rp10.000.000 pada seed); persetujuan oleh jabatan yang tidak berwenang; status RAT periode berjalan.

### 6.7 Kontrak data sintetis (scripts/seed, RNG seeded konstan, idempoten)

Koperasi detail: "Koperasi Desa Merah Putih Sukamaju" (id: kop-sukamaju), Kab. Bandung, Jawa Barat. Unit usaha: gerai sembako, unit simpan pinjam, apotek desa, gudang. 30 anggota (termasuk persona "Sari Rahayu" dan akun juri-anggota), 5 pengurus (bendahara: "Budi Santoso", alamat "Jl. Melati No. 12, Sukamaju"), pengawas ketua = Kepala Desa. Transaksi 6 bulan (Jan-Jun 2026), 320-450 baris, distribusi realistis per unit usaha.

Anomali tertanam (WAJIB ada persis, id transaksi stabil, jadi fixture test):

- AN-1 (konflik, merah): pembelian Rp15.000.000 tanggal 2026-06-14 ke "Toko Berkah", vendorAlamat == alamat bendahara Budi Santoso. Ini temuan kunci demo.
- AN-2 (anomali, kuning): 5 pinjaman disetujui pada 2026-06-20, total Rp30.000.000, baseline 1-2/minggu.
- AN-3 (anomali, kuning): split purchase 3 x Rp4.900.000 ke "CV Sumber Rejeki" dalam 5 hari (Jun 2026).
- AN-4 (finansial, kuning): saldo kas turun >= 35 persen dari April ke Juni.
- AN-5 (kepatuhan, kuning): 1 pinjaman Rp12.000.000 (di atas plafon 10 juta) dengan dokumenLengkap=false.
- AN-6 (kepatuhan, info): RAT 2026 berstatus belum dilaksanakan.

Seed sosial: 12 anggota (termasuk juri-anggota setelah aksi) sudah menambahkan temuan AN-1 ke pertanyaan RAT; 1 keputusan voting freezer terbuka dengan 9 setuju, 3 tidak; temuan AN-2 memiliki tanggapanPengurus seeded ("Kelima pinjaman merupakan program musim tanam yang disetujui rapat pengurus 18 Juni, dokumen tersedia di kantor koperasi.").

Precompute: seed menjalankan pipeline audit dalam mode deterministic-fixture (tanpa API): temuan AN-1..AN-6 ditulis sebagai audit_run source="seed" dengan verdict "merah" dan ringkasan tetap: "Kas koperasi menurun dan ada satu pembelian besar yang perlu dijelaskan pengurus." Teks temuan seed adalah fixture tetap tertulis di scripts/fixtures/temuan-seed.ts (bukan hasil LLM), sehingga demo 100 persen deterministik; live run kemudian bisa menambah run baru di atasnya.

11 koperasi summary: nama/provinsi bervariasi, verdict distribusi 6 hijau, 4 kuning, 2 merah (termasuk Sukamaju), temuanCount konsisten.

Audit run historis (frozen, untuk tren dasbor pemerintah): kop-sukamaju memiliki 6 audit_run source="seed", satu per periode Jan-Jun 2026, dengan warna berurutan hijau, hijau, hijau, kuning, kuning, merah; hanya run Juni yang membawa temuan AN-1..AN-6, run sebelumnya membawa 0-1 temuan info generik. 11 koperasi summary masing-masing memiliki 1 audit_run periode Jun 2026 sesuai verdict tabel 6.7b. Endpoint tren mengembalikan apa adanya yang ada.

Skema id stabil (frozen, dipakai fixture test AC-SEED-02): transaksi anomali memakai id tetap trx-an1, trx-an2-1..trx-an2-5 (pencairan) dan pj-an2-1..pj-an2-5 (baris pinjaman), trx-an3-1..trx-an3-3, pinjaman AN-5 pj-an5; entitas inti kop-sukamaju, ang-sari (persona), ang-juri (akun juri-anggota), png-budi (bendahara). Baris non-anomali boleh ULID acak-seeded.

Notifikasi seeded: 1 notifikasi belum dibaca untuk ang-juri dan ang-sari berbunyi notif.template dengan n=5 (jumlah temuan kuning+merah pada run Juni). Badge beranda membaca angka ini.

Akun seeded (beku, dicetak di README):
- juri.anggota@pramana.id / PramanaJuri2026 (role anggota, terikat anggota di Sukamaju dengan simpanan Rp600.000, sisa pinjaman Rp1.200.000, cicilan Rp200.000 tanggal 5)
- juri.pemerintah@pramana.id / PramanaJuri2026 (role pemerintah)
- sari@pramana.id / SariSukamaju1 (persona cadangan)
- bendahara@pramana.id / PramanaBendahara2026 (role pengurus, terikat png-budi Budi Santoso, untuk Konsol Simulasi Pembukuan)

### 6.7b Distribusi seed (angka frozen, dipakai fixture dan test)

Target baris transaksi per bulan (rentang inklusif): Jan 55-65, Feb 55-65, Mar 60-70, Apr 60-70, Mei 55-65, Jun 70-85. Komposisi tiap bulan: setoran_simpanan 30 (satu per anggota), angsuran 12-18, penjualan 8-14, pembelian 4-8, pencairan_pinjaman 1-3 (khusus Juni memuat 5 pinjaman AN-2 pada tanggal yang sama), gaji 5 (satu per pengurus), operasional 2-4.

Saldo kas akhir bulan (Rp): Jan 52.000.000, Feb 54.500.000, Mar 56.000.000, Apr 58.000.000, Mei 47.500.000, Jun 36.500.000. Penurunan Apr ke Jun 37 persen memicu AN-4.

Simpanan per anggota: pokok Rp100.000 flat; wajib Rp50.000 dikali bulan keanggotaan; sukarela 0 sampai 500.000 acak-seeded. Buku pinjaman: 9 pinjaman aktif (termasuk milik persona Sari Rahayu sisa Rp1.200.000 cicilan Rp200.000 jatuh tempo tanggal 5, pinjaman AN-5 Rp12.000.000, dan lima pinjaman AN-2 masing-masing Rp6.000.000), 2 lunas, 1 lewat jatuh tempo lebih dari 30 hari sebagai bahan agen kesehatan finansial.

Daftar 12 koperasi (id, nama, provinsi, verdict, temuanCount), frozen untuk dasbor pemerintah:

```
kop-sukamaju      Koperasi Desa Merah Putih Sukamaju       Jawa Barat        merah   6   (detail penuh)
kop-lembahsari    Koperasi Desa Merah Putih Lembah Sari    Sumatera Barat    merah   4
kop-cempakawangi  Koperasi Desa Merah Putih Cempaka Wangi  Lampung           kuning  2
kop-wanasaba      Koperasi Desa Merah Putih Wanasaba       Nusa Tenggara Barat kuning 2
kop-batulicin     Koperasi Desa Merah Putih Batulicin      Kalimantan Selatan kuning 1
kop-airmolek      Koperasi Desa Merah Putih Air Molek      Riau              kuning  1
kop-mekarsari     Koperasi Desa Merah Putih Mekarsari      Jawa Barat        hijau   0
kop-tirtayasa     Koperasi Desa Merah Putih Tirtayasa      Banten            hijau   0
kop-argomulyo     Koperasi Desa Merah Putih Argomulyo      Jawa Tengah       hijau   0
kop-sidodadi      Koperasi Desa Merah Putih Sidodadi       Jawa Timur        hijau   1 (info)
kop-karangasem    Koperasi Desa Merah Putih Karangasem     Bali              hijau   0
kop-mattirowalie  Koperasi Desa Merah Putih Mattiro Walie  Sulawesi Selatan  hijau   0
```

KPI dasbor yang harus konsisten dengan tabel ini: 12 koperasi, 6 hijau, 4 kuning, 2 merah, temuanTerbuka 17.

### 6.8 Kontrak register copy (berlaku untuk UI, output model, README, deck)

Sapaan "Anda". Tanpa em dash. Tanpa emoji. Layar anggota tanpa istilah: "likuiditas", "rasio", "aktiva", "NPL", "CAR" (dasbor pemerintah boleh memakai istilah teknis dengan tooltip). Nada: tenang, faktual, tidak menakut-nakuti. Nama produk selalu "Pramana AI" atau "Pramana"; kata "Pengawas" (kapital) merujuk mesin audit di copy anggota.

### 6.9 Kontrak prompt agen (lib/prompts/*, system prompt kanonik, Bahasa Indonesia)

Setiap prompt forensik menerima payload user berupa JSON snapshot: `{koperasi:{nama,saldoKasPerBulan:[{periode,saldo}]}, pengurus:[{nama,jabatan,alamat}], transaksi:[...maks 500 baris periode berjalan...], pinjaman:[...], plafonPerAnggota, statusRat}`. Output WAJIB JSON murni: `{"temuan":[AgentFindingTanpaId...]}` (id dibuat server). Baris pembuka dan aturan bersama untuk KEEMPAT agen forensik (frozen, boleh diparafrase tipis oleh Orchestrator tanpa mengubah makna):

```
Anda adalah [NAMA AGEN], satu dari empat pemeriksa spesialis Pramana AI yang mengaudit
koperasi desa atas nama anggotanya. Tugas Anda hanya mendeteksi pada wilayah Anda, bukan
menilai keseluruhan. Aturan mutlak: (1) Anda bertanya, tidak pernah menuduh; tulis temuan
sebagai hal yang perlu dijelaskan, bukan vonis. (2) Bahasa Indonesia awam, sapaan "Anda",
tanpa istilah akuntansi teknis, tanpa em dash, tanpa emoji. (3) Setiap temuan wajib memuat
bukti berupa rujukan id data yang Anda terima dan satu pertanyaan_rat berbentuk kalimat
tanya yang sopan dan spesifik. (4) Jika tidak ada yang janggal di wilayah Anda, kembalikan
{"temuan":[]}. (5) Keluaran hanya JSON valid sesuai skema, tanpa teks lain.
```

Blok wilayah per agen (frozen sebagai daftar deteksi, redaksi bebas):

- konflik_kepentingan: cocokkan vendorAlamat dan vendorNama transaksi pembelian terhadap alamat dan nama pengurus; tandai pembayaran berulang ke pihak yang terhubung pengurus; severity merah bila nilai >= Rp10.000.000 atau berulang, selain itu kuning.
- anomali_transaksi: bandingkan frekuensi persetujuan pinjaman harian terhadap baseline mingguan; deteksi >= 3 pembelian ke vendor sama masing-masing < Rp5.000.000 dalam <= 7 hari (indikasi pemecahan nilai); pembelian besar tanpa unit usaha terkait.
- kesehatan_finansial: tren saldo kas 3 periode (turun >= 30 persen = kuning, >= 50 persen = merah); porsi pinjaman lewat jatuh tempo; jelaskan dengan analogi rumah tangga, bukan rasio bernama.
- kepatuhan_proses: pinjaman dokumenLengkap=false; pinjaman melebihi plafonPerAnggota; persetujuan oleh jabatan bukan pemutus; statusRat belum terlaksana (severity info kecuali lewat batas tahun, maka kuning).

Prompt Adjudikator (frozen intent): menerima seluruh temuan tervalidasi + ringkasan snapshot; tugasnya (1) menghapus duplikasi antar agen, (2) menulis ulang setiap temuan agar konsisten register 6.8, (3) menyusun ringkasan satu kalimat yang menyebut maksimal dua hal terpenting, (4) mengusulkan warna sesuai aturan 6.1 (server tetap menghitung ulang), (5) mengurutkan temuan dari paling perlu ditanyakan. Output JSON `{"warna":..., "ringkasan":..., "temuan":[...]}`.

### 6.10 Kontrak rute dan binding layar (paths frozen)

```
/                         publik   -> landing page statis (konten lib/facts.ts + lib/copy.ts); CTA ke /login dan /daftar; tanpa panggilan API
/login                    publik   -> POST /api/auth/login; hint box akun juri
/daftar                   publik   -> POST /api/onboarding; sukses -> tampil kartu anggota -> /beranda
/beranda        (anggota) -> GET /api/member/verdict + /api/member/summary(notif badge)
                             elemen: kartu verdict warna penuh, ringkasan, CTA "Lihat yang perlu Anda tahu",
                             badge notifikasi teks F13
/uang           (anggota) -> GET /api/member/summary
                             elemen: totalSimpanan besar, sisaPinjaman, cicilanBerikut (jumlah+tanggal)
/beranda -> panel temuan  -> GET /api/member/findings; item: judul, severity chip, expand kenapa_penting,
                             daftar bukti (label), tombol "Tambahkan ke pertanyaan rapat"
                             -> POST /api/findings/:id/rat; tanggapanPengurus dirender bila ada
/arus           (anggota) -> GET /api/member/flow?periode=2026-06
                             elemen: total masuk, total keluar, bar per kategori, chip sorotan -> anchor temuan
/suara          (anggota) -> GET /api/member/voice; list agregat "N anggota menanyakan hal yang sama";
                             kartu keputusan -> POST /api/vote; hasil tampil setelah memilih
/pembukuan      (pengurus)   -> GET /api/subjek/recent; form POST /api/subjek/transaksi, /api/subjek/pinjaman,
                             /api/subjek/rat; header subjek.header + subjek.sub; saldo kas hidup; empat preset;
                             daftar entri terakhir; indikator subjek.sync
/pemerintah     (pemerintah) -> GET /api/gov/overview; KPI, donut distribusi verdict, tabel sortable
/pemerintah/koperasi/[id]    -> GET /api/gov/koperasi/:id; profil, verdict, tren periode, tabel temuan,
                             tombol "Jalankan Pemeriksaan Ulang" -> POST /api/gov/audit/run -> polling status;
                             banner sumber hasil: "Hasil pemeriksaan tersimpan" vs "Hasil pemeriksaan langsung"
Navigasi anggota: tab bawah Beranda | Uang Anda | Arus Dana | Suara Anda. Logout di menu profil.
```

### 6.11 Kontrak isi pitch deck (deck/pramana-deck.md, Marp, 12 slide, heading H1 per slide frozen)

1. "Pramana AI" : tagline "Pengawas koperasi desa, di genggaman setiap anggota"; Tim Daulat, Politeknik Negeri Bandung; tema Keterlibatan Masyarakat dalam Berkoperasi.
2. "Masalah" : Rp3 miliar x 83.383 koperasi; baru ~50.383 RAT; risiko ~Rp60 juta/unit/tahun (CELIOS); pengawas formalitas. Sumber+tanggal di footnote.
3. "Wawasan" : anggota adalah pemilik sah tanpa alat; aplikasi lain melayani pengurus sehingga strukturalnya tidak mungkin mengawasi pengurus.
4. "Solusi" : Pengawas AI yang bekerja untuk anggota; verdict hijau/kuning/merah; prinsip "bertanya, bukan menuduh".
5. "Cara Kerja" : diagram 4 agen paralel -> Adjudikator -> verdict + pertanyaan RAT; sebutan tipologi nyata per agen.
6. "Demo: Temuan" : screenshot e2e asli layar temuan AN-1 (Toko Berkah Rp15 juta, alamat sama dengan rumah bendahara).
7. "Demo: Dari Temuan ke Rapat" : screenshot Suara Anda, "12 anggota menanyakan hal yang sama"; narasi RAT berubah dari seremoni menjadi pengawasan.
8. "Dua Antarmuka" : screenshot beranda anggota (mobile) + dasbor pemerintah (desktop); satu basis kode.
9. "Dampak" : anggota berdaya, pengurus jujur terbukti bersih, pemerintah melihat peta kesehatan mingguan; angka jangkauan.
10. "Implementasi" : menumpang data SIMKOPDES (integrasi fase produksi), stack ringan, DEMO_MODE anti-gagal; roadmap dua fase: API MiniMax sekarang, on-premise model open-weight sesuai UU PDP untuk produksi.
11. "Penggunaan AI (Disclosure)" : gagasan inti orisinal tim; AI sebagai alat implementasi (Claude Opus 4.8 via Claude Code) dan mesin runtime produk (MiniMax-M2.7); rujuk DISCLOSURE-AI.md.
12. "Penutup" : URL demo, kredensial juri, repo, ajakan.

### 6.12 Kontrak README dan teks kanonik DISCLOSURE-AI.md

README urutan section (AC-REP-01 memeriksa heading ini): Judul+badge; Ringkasan produk; Demo (URL, tabel kredensial juri, catatan DEMO_MODE); Arsitektur (diagram teks 4 agen + adjudicator, stack, struktur folder ringkas); Menjalankan secara lokal (prasyarat, .env dari .env.example, pnpm i, pnpm seed, pnpm dev); Perintah (test, e2e, deck:build, seed); Keputusan teknis (ringkas, tautan docs/keputusan-teknis.md dan blueprint); Disclosure AI (ringkasan + tautan DISCLOSURE-AI.md); Lisensi.

DISCLOSURE-AI.md teks kanonik (boleh ditambah, tidak boleh dikurangi maknanya):

```
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
```

### 6.13 Spesifikasi .claude/ yang ditulis Orchestrator pada Phase 0 (ADR-07)

settings (project .claude/settings.json), permissions deny yang berlaku untuk worker/subagent (main thread dikecualikan by role resolution):

```
deny write+read: .env, .env.*, secrets/**
deny write: .git/**, .claude/**, tests/**, e2e/**, .crown/evidence/**, .crown/progress.json,
            scripts/fixtures/**, design-handoff/**  (fixtures dan bundle desain adalah oracle, hanya verification workflow + main thread)
deny bash: "git push --force*", "git reset --hard*", "rm -rf *", "drop table*", "vercel rm*"
allow bash toolchain: pnpm *, node *, npx playwright *, npx marp *, git add/commit/status/log/diff, vercel deploy/pull/env pull
```

hooks (event -> perintah -> tujuan):

```
PreToolUse   matcher tools Write|Edit|Bash -> node .claude/hooks/deny-guard.mjs   -> tegakkan deny di atas, exit 2 saat melanggar
PostToolUse  matcher Write|Edit pada **/*.{ts,tsx,md} -> pnpm lint:fix --silent && node scripts/check-register.mjs --changed -> format + register scan
Stop         -> pnpm typecheck && pnpm test --silent   -> agen tidak berhenti dengan kerja merah (recursion guard dihormati, max 3 blok beruntun lalu surface)
SubagentStop -> sama dengan Stop, scope worktree
PreCompact   -> node .claude/hooks/snapshot.mjs        -> snapshot .crown/notes.md + pointer kontrak ke .crown/compact/
SessionStart -> node .claude/hooks/inject.mjs          -> re-inject pointer blueprint section 6 + status gate terakhir
```

CLAUDE.md outline (< 150 baris): perintah kerja (dev, test, e2e, seed, deck:build, ci:clean); peta modul (lib/contracts, lib/llm, lib/audit, lib/registerGuard, app/(public) landing, app/(member), app/(gov), app/(subjek) konsol, scripts/seed, deck/); pointer WAJIB BACA: blueprint-pramana-ai.md section 6 dan 8; larangan keras: daftar out-of-scope 2.2, jangan sentuh scripts/fixtures dan tests (worker), register copy 6.8; konvensi error envelope; catatan DEMO_MODE.

.crown/ layout: progress.json (schema 6.14), notes.md, ai-usage.md, evidence/ (per-gate), compact/.

### 6.14 Format evidence manifest, progress.json, dan grammar commit

Evidence manifest per fase: .crown/evidence/manifest-gate-N.json:

```
{"gate": 3, "entries": [
  {"id":"AC-E2E-01","check":"pnpm e2e --grep member.journey","expect":"exit 0","artifact":".crown/evidence/e2e/member/"},
  ...satu entri per AC yang digate...
]}
```

Gate evaluator membaca manifest, menjalankan atau memverifikasi artifact tiap entri, menulis .crown/evidence/gate-N-result.json {id, pass, note}. Entri tanpa artifact valid = fail.

progress.json: `{"project":"pramana-ai","gates":{"0":{"passed":true,"commit":"<sha>","at":"ISO"},...},"spendNote":"...","lastPhase":N}`.

Commit grammar: `checkpoint(gate-N): <ringkas>` untuk gate; `wave(phase-1.K): <modul>` untuk wave; tag akhir `v1.0.0`.

### 6.15 Copy kanonik state kunci (lib/copy.ts, string beku)

```
banner.cache      = "Menampilkan hasil pemeriksaan tersimpan. Pemeriksaan langsung sedang tidak tersedia."
banner.live       = "Hasil pemeriksaan langsung, baru saja dijalankan."
verdict.cta       = "Lihat yang perlu Anda tahu"
notif.template    = "Pengawas menemukan {n} hal yang sebaiknya Anda tanyakan kepada pengurus bulan ini."
temuan.tambah     = "Tambahkan ke pertanyaan rapat"
temuan.tambah.ok  = "Tersimpan. Pertanyaan ini akan dibawa ke Rapat Anggota Tahunan."
temuan.kenapa     = "Kenapa ini penting?"
onboard.nik.err   = "Nomor NIK harus 16 angka. Silakan periksa kembali KTP Anda."
onboard.sukses    = "Selamat, Anda resmi menjadi anggota. Ini kartu anggota digital Anda."
login.err         = "Email atau kata sandi belum tepat. Silakan coba lagi."
audit.jalan       = "Pengawas sedang memeriksa. Ini memerlukan waktu kurang dari dua menit."
audit.gagal       = "Pemeriksaan langsung gagal. Menampilkan hasil tersimpan terakhir."
kosong.temuan     = "Tidak ada hal yang perlu ditanyakan bulan ini. Koperasi Anda dalam keadaan baik."
verifikasi.label  = "Verifikasi simulasi untuk purwarupa"
landing.tagline   = "Pengawas koperasi desa, di genggaman setiap anggota"
landing.cta.anggota    = "Masuk sebagai Anggota"
landing.cta.pemerintah = "Masuk sebagai Pemerintah"
landing.cta.daftar     = "Daftar sebagai Anggota Baru"
landing.juri      = "Akun uji untuk juri tersedia di halaman masuk."
subjek.header     = "Simulasi Pembukuan Koperasi"
subjek.sub        = "Sumber data yang diawasi Pramana"
subjek.sync       = "Tersinkron ke Pramana"
subjek.simpan     = "Catat Transaksi"
subjek.pinjaman.simpan = "Setujui Pinjaman"
subjek.preset.konflik  = "Isi contoh: pembelian ke alamat pengurus"
subjek.preset.pecah    = "Isi contoh: pemecahan pembelian"
subjek.preset.plafon   = "Isi contoh: pinjaman lampaui plafon tanpa dokumen"
subjek.preset.kas      = "Isi contoh: pengeluaran menguras kas"
subjek.login.hint = "Akun uji bendahara"
```

### 6.16 Kontrak environment (.env.example kanonik, cocok dengan env-prep)

```
# Runtime model: MiniMax (OpenAI-compatible), satu-satunya provider, tanpa fallback
LLM_BASE_URL=https://api.minimax.io/v1
LLM_API_KEY=
LLM_MODEL=MiniMax-M2.7

# Mode demo deterministik. true = verdict dari data seed, live audit tetap tersedia manual.
DEMO_MODE=true

# Database. Kosongkan keduanya di dev untuk memakai file lokal ./dev.db.
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Session signing, wajib >= 32 karakter acak. App fail-fast bila kosong di production.
SESSION_SECRET=

# Remote git PUBLIK (repo pramana-ai). gh sudah authorized, push memicu deploy Vercel.
GIT_REMOTE_URL=https://github.com/Finerium/pramana-ai.git
```

Aturan frozen: dev tanpa TURSO_* memakai SQLite file lokal; production tanpa TURSO_* adalah kondisi STOP-and-ask (Q3); SESSION_SECRET kosong di production membuat boot gagal dengan pesan jelas; tidak ada variabel lain yang boleh ditambahkan tanpa masuk .env.example (AC-CFG-01).

### 6.17 Kontrak skenario video demo (deliverables/video-script.md, total <= 180 detik)

```
Scene 1  (20 s) Masalah: angka nasional lib/facts.ts, satu kalimat premis "anggota tidak punya alat".
Scene 2  (25 s) Login juri-anggota, beranda verdict merah, bacakan ringkasan.
Scene 3  (35 s) Temuan AN-1 Toko Berkah, buka "Kenapa ini penting?", tunjukkan bukti.
Scene 4  (25 s) Tambahkan ke pertanyaan rapat, pindah ke Suara Anda, agregasi 12 -> 13 anggota.
Scene 5  (15 s) Arus dana bulanan, sorotan aliran Rp15 juta ke temuan.
Scene 6  (35 s) Loop langsung: konsol subjek mencatat pembelian ke alamat pengurus, dasbor pemerintah menekan Jalankan Pemeriksaan Ulang, temuan baru muncul (banner cache bila offline).
Scene 7  (25 s) Penutup: prinsip bertanya bukan menuduh, roadmap dua fase, URL demo + kredensial juri,
               satu kalimat disclosure AI.
```

Narasi per scene ditulis penuh oleh Orchestrator mengikuti register 6.8; durasi per scene boleh bergeser <= 5 detik selama total <= 180.

### 6.18 Kontrak script package.json (nama beku, dirujuk AC, hooks, dan manifest)

```
dev            next dev
build          next build
start          next start
typecheck      tsc --noEmit
lint           eslint . --max-warnings 0
lint:fix       eslint . --fix && prettier --write .
test           vitest run --coverage
e2e            playwright test
seed           tsx scripts/seed/index.ts
seed:verify    tsx scripts/seed/verify.ts        (checksum tabel + timing, tulis seed-verify.json)
demo:hash      tsx scripts/demo-hash.ts          (2x fetch verdict+findings, banding sha256)
perf:api       tsx scripts/perf-api.ts           (50 req/endpoint kunci, tulis perf-api.json)
audit:bench    tsx scripts/audit-bench.ts        (5 live run bila key ada, p95)
deck:build     marp deck/pramana-deck.md --pdf --allow-local-files -o deck/pramana-deck.pdf
check-register node scripts/check-register.mjs
scan-secrets   node scripts/scan-secrets.mjs
check-readme   node scripts/check-readme.mjs
check-keputusan node scripts/check-keputusan.mjs
check-env      node scripts/check-env-example.mjs
ci:clean       bash scripts/ci-clean.sh          (worktree bersih: install frozen, build, test, e2e smoke)
```

Catatan implementasi yang mengikat: /api/health field llm bernilai "unset" bila LLM_API_KEY kosong, "up" bila probe ringan terakhir sukses, "down" selainnya; rate limit login boleh in-memory sliding window per instance (kelas demo, keterbatasan serverless dicatat di Report), yang penting AC-SEC-07 lulus pada test lokal.

### 6.19 Kontrak porting design handoff (FROZEN)

Input wajib: empat arsip di root proyek saat launch, nama persis pramana-ai_mobile.zip (aplikasi anggota), pramana-ai_dashboard.zip (dasbor pemerintah), pramana-ai_landing-page.zip (landing page), dan pramana-ai_dashboard-subjek.zip (konsol pembukuan subjek), hasil ekspor Code Handoff Bundle Claude Design. Phase 0 memverifikasi keempatnya, meng-unzip ke design-handoff/mobile/, design-handoff/dashboard/, design-handoff/landing/, dan design-handoff/subjek/, lalu menulis inventaris ke .crown/design-inventory.md (pemetaan tiap layar bundle ke fitur F01-F15, daftar token, state yang tercakup, catatan README bundle). Salah satu absen atau korup = STOP and ask. design-handoff/ read-only bagi worker (oracle, setara fixtures).

Aturan fidelity:
1. Setiap permukaan memiliki token set sendiri yang diport verbatim ke lapisan token ber-namespace terpisah (mobile palet Nila/Geist; dashboard Porselen Hangat/Archivo+Public Sans dengan sistem neumorfik; landing Malam Jernih/Plus Jakarta Sans+JetBrains Mono; subjek dengan token set register keempat dari bundle-nya). Keempatnya TIDAK disatukan menjadi satu file token global dan TIDAK diganti nama agar seragam; masing-masing di-import route group-nya sendiri. Deviasi nilai hanya sah sebagai improvement terdokumentasi. Lihat Appendix A prompt Orchestrator untuk nama variabel persis.
2. Setiap layar adalah rekonstruksi layar bundle, bukan interpretasi ulang; screenshot bundle adalah acuan review, di kedua tema.
3. Downgrade dilarang dan merupakan pelanggaran gate: penyederhanaan layout, komponen generik pengganti komponen desain, state yang hilang, polish yang turun.
4. Improvement diizinkan dan didorong: perbaikan kontras demi AA, penambahan state yang bundle lewatkan, unifikasi token antar bundle, ketangguhan responsif, micro-interaction tambahan yang sejalan karakter. Setiap improvement dicatat satu baris di .crown/design-deviations.md dan dirangkum di Report.
5. Konflik bundle vs kontrak section 6: perilaku dan data mengikuti kontrak (kontrak menang), tampilan mengikuti bundle (bundle menang); tidak menciptakan kontrak baru demi mockup.
6. Perbedaan token antar bundle (nama variabel, font, nilai verdict) adalah disengaja karena tiga register visual berbeda (flat, neumorfik, marketing) dan DIPERTAHANKAN, bukan dipaksa seragam; catat sekali di .crown/design-deviations.md sebagai keputusan. Hanya bila satu komponen benar-benar dipakai lintas permukaan dan butuh satu nilai, pilih dengan urutan prioritas mobile, lalu landing, lalu dashboard, lalu dashboard-subjek.
7. README bundle yang menyarankan stack berbeda diabaikan; ADR-01 menang.

</contracts>

## 7. Data Sources dan External Dependencies

- MiniMax API (satu-satunya runtime): endpoint OpenAI-compatible base https://api.minimax.io/v1; model MiniMax-M2.7; tarif M-series $0.30/M input dan $1.20/M output tier standar; membutuhkan LLM_API_KEY. Tidak ada endpoint /models (model di-hardcode, tidak masalah). Panggilan audit non-streaming agar reasoning MiniMax M2.x tidak bocor. Risiko: kredit habis atau rate limit; mitigasi: DEMO_MODE membuat seluruh alur juri tidak bergantung model, dan kegagalan live jatuh ke cache. Akun dibuat dan di-top-up operator SEBELUM launch.
- Turso (libSQL): database production; free tier memadai; butuh TURSO_DATABASE_URL + TURSO_AUTH_TOKEN; dev memakai file lokal sehingga test tidak butuh jaringan.
- Vercel: hosting + preview deploy; Vercel CLI sudah terhubung dan GitHub CLI (gh) sudah authorized sehingga push ke remote publik memicu deploy otomatis; deploy adalah precondition Gate 0 dan Gate 9. Repo publik bernama pramana-ai.
- SIMKOPDES (referensi, BUKAN dependency runtime): endpoint /pers/* adalah dashboard SPA tanpa API publik; dipakai hanya sebagai referensi skema kolom dan angka nasional; tidak ada panggilan runtime ke domain simkopdes.go.id. Folder aset Drive panitia dibuka manual oleh operator bila relevan; ketiadaannya tidak memblokir apa pun.
- Fakta nasional (lib/facts.ts): 83.383 koperasi (Simkopdes via Katadata, 29 Juni 2026), ~50.383 telah RAT, risiko kebocoran ~Rp60 juta/unit/tahun (CELIOS), 7 jenis gerai resmi KDMP (Inpres 9/2025). Setiap angka menyimpan sumber+tanggal.
- Tidak ada data pribadi nyata; seluruh data sintetis (C6).

<acceptance_criteria>

## 8. Acceptance Criteria (verification matrix, evidence fail-closed)

Format entri: ID | kriteria | check command / test id | expected | artifact path. Semua artifact evidence ditulis ke .crown/evidence/. Gate memparse manifest fail-closed: entri hilang/rusak = gagal.

### 8.0 Perilaku inti dalam Given/When/Then (normatif, diikat ke AC)

- B1 (AC-E2E-01): Given juri.anggota login pada DEMO_MODE, When membuka /beranda, Then kartu verdict merah tampil dengan ringkasan persis fixture seed dan CTA verdict.cta. When membuka temuan AN-1 lalu menekan "Kenapa ini penting?", Then paragraf edukasi konflik kepentingan tampil tanpa satu pun kata denylist 6.5. When menekan "Tambahkan ke pertanyaan rapat", Then konfirmasi temuan.tambah.ok tampil dan agregat AN-1 pada /suara berubah dari 12 menjadi 13.
- B2 (AC-E2E-04): Given juri.anggota belum memilih, When memilih Setuju pada keputusan freezer, Then hasil menjadi 10 setuju 3 tidak dan pilihan terkunci. When POST /api/vote diulang, Then respons 200 idempoten dan hasil tidak berubah.
- B3 (AC-E2E-03): Given pengunjung /daftar, When NIK 15 digit dikirim, Then error onboard.nik.err tampil tanpa membuat akun. When NIK 16 digit valid dikirim, Then kartu anggota digital tampil (nama, noAnggota baru) dan sesi anggota aktif.
- B4 (AC-DEMO-03): Given kedua API key model kosong, When seluruh journey B1 dijalankan, Then nol network call keluar ke provider model (di-assert via mock/log fetch) dan seluruh layar tampil dari data seed.
- B5 (AC-LLM-05): Given DEMO_MODE=false dan model MiniMax dipaksa gagal (mock 500), When pemerintah menekan "Jalankan Pemeriksaan Ulang", Then status akhir "gagal_langsung", UI menampilkan banner.cache, dan verdict yang tampil adalah run seed terakhir.
- B6 (AC-LLM-03): Given mock adjudicator mengembalikan warna hijau padahal ada temuan merah, When pipeline selesai, Then server menetapkan warna merah (aturan 6.1 menang) dan penyimpangan tercatat di rawJson.metadata.
- B7 (AC-SEC-02): Given sesi juri.anggota, When GET /api/gov/overview, Then 403 FORBIDDEN envelope. Given sesi juri.pemerintah, When POST /api/vote, Then 403.
- B8 (AC-PERF-03): Given fixture 5.000 transaksi, When daftar transaksi halaman pertama diminta, Then maksimal 50 baris kembali dan tidak ada query select tanpa LIMIT pada log query.

### 8.1 Build, type, lint, unit (Gate 1)

- AC-BLD-01 | pnpm build sukses tanpa error | `pnpm build` | exit 0 | .crown/evidence/build.log
- AC-TYP-01 | TypeScript strict, nol error, nol `any` di lib/contracts, lib/audit, lib/llm | `pnpm typecheck` + `grep -rn ": any" lib/contracts.ts lib/audit lib/llm` | exit 0; grep kosong | .crown/evidence/typecheck.log
- AC-LNT-01 | ESLint + Prettier bersih | `pnpm lint` | exit 0, 0 warning | .crown/evidence/lint.log
- AC-UNI-01 | Unit test hijau; coverage global >= 70 persen, lib/contracts+lib/audit+lib/registerGuard = 100 persen branch pada aturan warna, denylist, plafon | `pnpm test -- --coverage` | pass; threshold terpenuhi | .crown/evidence/coverage/
- AC-SEED-01 | Seed idempoten: dua kali `pnpm seed` menghasilkan row-count dan checksum tabel identik | `pnpm seed && pnpm seed && pnpm run seed:verify` | checksum sama | .crown/evidence/seed-verify.json
- AC-SEED-02 | Semua anomali AN-1..AN-6 eksis persis di data seed (fixture test membaca DB) | vitest `seed.anomalies.test.ts` | 6/6 pass | .crown/evidence/junit-seed.xml
- AC-DB-01 | Desain fisik DB nyata: foreign key aktif, indeks menutupi pola query panas (transaksi per koperasi+tanggal, temuan per auditRun, agregasi flow per periode, keunikan vote dan pertanyaan_rat per pasangan), migrasi bersih dari nol; diverifikasi lewat introspeksi schema plus assertion EXPLAIN QUERY PLAN bahwa query daftar dan agregasi memakai indeks | vitest `db.design.test.ts` | pass | .crown/evidence/junit-db.xml

### 8.2 Mesin audit dan bahasa (Gate 1 dan 3)

- AC-LLM-01 | chatJSON memvalidasi Zod, retry sekali pada JSON invalid, throw LLMUnavailable setelahnya (mock provider) | vitest `llm.contract.test.ts` | pass | .crown/evidence/junit-llm.xml
- AC-LLM-02 | runAudit dengan fixture deterministik menemukan AN-1 sebagai temuan agent=konflik_kepentingan severity=merah yang menyebut Toko Berkah dan kecocokan alamat | vitest `audit.an1.test.ts` | pass | idem
- AC-LLM-03 | Aturan warna 6.1 ditegakkan server-side meski adjudicator salah label (fixture adversarial) | vitest `verdict.rules.test.ts` | pass | idem
- AC-LLM-04 | Live audit (bila key tersedia di env test manual) selesai <= 90 detik p95 dari 5 run; jika key absen, kriteria ini ditandai HUMAN-GATED di Report, bukan silently passed | script `pnpm audit:bench` | p95 <= 90000 ms atau HUMAN-GATED | .crown/evidence/audit-bench.json
- AC-LLM-05 | Kegagalan model MiniMax mengembalikan cache dengan source="cache" dan banner UI (tidak ada provider kedua yang dicoba) | vitest + Playwright `fallback.cache.spec.ts` | pass | .crown/evidence/e2e/
- AC-REG-01 | registerGuard menolak output dengan kata vonis di luar pola edukatif, menerima fixture sah | vitest `registerGuard.test.ts` (>= 12 fixture) | pass | .crown/evidence/junit-reg.xml
- AC-REG-02 | Setiap temuan kuning/merah punya pertanyaan_rat diakhiri "?" | vitest properti pada seed + hasil live | pass | idem

### 8.3 Alur produk end-to-end (Gate 3)

- AC-E2E-01 | Alur Bu Sari/juri-anggota lengkap (login -> verdict merah -> temuan AN-1 -> kenapa penting -> tambah ke pertanyaan rapat -> Suara Anda agregat >= 12 dan bertambah 1 setelah aksi) | Playwright `member.journey.spec.ts` | pass + screenshot tiap layar | .crown/evidence/e2e/member/
- AC-E2E-02 | Alur juri-pemerintah (login -> KPI -> sort tabel -> drill-down Sukamaju -> lihat temuan + tanggapan pengurus AN-2) | Playwright `gov.journey.spec.ts` | pass + screenshot | .crown/evidence/e2e/gov/
- AC-E2E-03 | Onboarding: daftar anggota baru NIK 16 digit -> kartu digital tampil; NIK < 16 digit ditolak dengan pesan awam | Playwright `onboarding.spec.ts` | pass | idem
- AC-E2E-04 | Voting: memilih pada keputusan freezer mengubah hasil dan mengunci pilihan (idempoten) | Playwright `vote.spec.ts` | pass | idem
- AC-E2E-05 | Login salah password memberi error awam tanpa membocorkan detail | Playwright | pass | idem
- AC-E2E-06 | Landing: rute / render di 390 dan 1280+, kedua tema; CTA anggota dan pemerintah menuju /login, CTA daftar menuju /daftar; statistik identik konstanta lib/facts.ts; nol panggilan API keluar | Playwright `landing.spec.ts` | pass | idem
- AC-DEMO-01 | Determinisme: pada state seed segar (segera setelah pnpm seed), dua kali GET /api/member/verdict + /findings pada DEMO_MODE menghasilkan JSON hash identik | script `pnpm demo:hash` (jalankan 2x, bandingkan sha256) | hash sama | .crown/evidence/demo-hash.txt
- AC-DEMO-02 | Reset cepat: `pnpm seed` mengembalikan state demo dalam <= 60 detik | timing di seed-verify | <= 60000 ms | .crown/evidence/seed-verify.json
- AC-DEMO-03 | Dengan LLM_API_KEY kosong, seluruh AC-E2E-01/02 tetap pass dan nol panggilan keluar ke MiniMax | Playwright env-stripped run | pass | .crown/evidence/e2e-nollm/

### 8.4 Copy dan aksesibilitas (Gate 3)

- AC-COPY-01 | Nol em dash dan nol emoji di seluruh string UI, seed fixture, README, deck source | `node scripts/check-register.mjs` (scan lib/copy.ts, fixtures, README.md, deck/) | 0 pelanggaran | .crown/evidence/register-scan.txt
- AC-COPY-02 | Nol kata "kamu" sebagai sapaan di permukaan yang sama | idem | 0 | idem
- AC-COPY-03 | Layar anggota bebas jargon terlarang 6.8 | idem (scan copy member) | 0 | idem
- AC-A11Y-01 | axe-core otomatis pada 5 layar kunci (login, verdict, temuan, arus dana, gov overview): nol pelanggaran serious/critical | Playwright + axe | 0 | .crown/evidence/a11y/
- AC-A11Y-02 | Touch target aksi utama >= 44 px; teks nominal anggota >= 24 px | assertion CSS di e2e | pass | idem

### 8.5 Performa dan resource (Gate 5)

- AC-PERF-01 | p95 API non-LLM <= 500 ms pada dataset seed (50 request/endpoint kunci, lokal production build) | script `pnpm perf:api` | p95 <= 500 ms | .crown/evidence/perf-api.json
- AC-PERF-02 | Halaman anggota Beranda: JS bundle first-load <= 250 kB gzip (nilai next build) | parse output `pnpm build` | <= 250 kB | .crown/evidence/build.log
- AC-PERF-03 | Daftar transaksi paginated max 50; endpoint flow memakai agregasi SQL; fixture 5.000 transaksi tidak pernah dimuat penuh (assert jumlah row hasil query) | vitest `bounded.query.test.ts` dengan seed besar sementara | pass | .crown/evidence/junit-perf.xml
- AC-PERF-04 | Timeout+retry: panggilan LLM punya timeout 30 s dan tidak ada retry tak berbatas (max 1 korektif, tanpa provider fallback) | vitest fault-injection | pass | idem
- AC-PERF-05 | Graceful degradation LLM down sudah dicakup AC-LLM-05/AC-DEMO-03 (referensi, bukan cek ganda) | n/a | n/a | n/a

### 8.6 Security (Gate 6)

- AC-SEC-01 | Semua route non-publik menolak tanpa sesi (401) | vitest supertest matrix seluruh route | pass | .crown/evidence/junit-sec.xml
- AC-SEC-02 | Role isolation: anggota -> /api/gov/* = 403; pemerintah -> aksi anggota (vote, rat) = 403 | idem | pass | idem
- AC-SEC-03 | Seluruh input eksternal tervalidasi Zod di boundary; fixture injeksi (SQLi string, XSS payload di nama) tersimpan ter-escape dan ter-render aman | vitest + e2e assertion | pass | idem
- AC-SEC-04 | Tidak ada secret di repo/riwayat: scan pola key (sk-, AIza, ghp_, TURSO_AUTH nilai) di working tree dan `git log -p` | `node scripts/scan-secrets.mjs` | 0 temuan | .crown/evidence/secret-scan.txt
- AC-SEC-05 | `pnpm audit --prod` nol high/critical (atau severity-overrides terdokumentasi dengan alasan di Report, default: tidak ada) | `pnpm audit --prod` | 0 high/critical | .crown/evidence/depaudit.txt
- AC-SEC-06 | Password di-hash (argon2/bcrypt), session cookie httpOnly+secure+sameSite, tidak ada PII di log | vitest + grep logger | pass | .crown/evidence/junit-sec.xml
- AC-SEC-07 | Rate limit sederhana pada /api/auth/login (>= 5 gagal/menit/IP -> 429) | vitest | pass | idem

### 8.7 Observability, resilience, config (Gate 3)

- AC-OBS-01 | Logger terstruktur JSON dengan level dan requestId; error API selalu ter-log dengan code | vitest snapshot logger | pass | .crown/evidence/junit-obs.xml
- AC-OBS-02 | /api/health melaporkan db, llm, demoMode, version nyata | e2e | pass | .crown/evidence/e2e/
- AC-RES-01 | Tidak ada unhandled rejection pada seluruh suite e2e (listener assert) | Playwright config | 0 | idem
- AC-CFG-01 | Semua konfigurasi via env; .env.example lengkap dan cocok dengan env-prep; tidak ada nilai hardcoded | `node scripts/check-env-example.mjs` | pass | .crown/evidence/env-check.txt
- AC-CFG-02 | Clean checkout + `pnpm i --frozen-lockfile && pnpm build && pnpm test` hijau (reproducible, dijalankan di worktree bersih) | script `pnpm ci:clean` | exit 0 | .crown/evidence/ci-clean.log

### 8.8 PWA (Gate 3)

- AC-PWA-01 | manifest.webmanifest valid (name, icons 192/512, display standalone, lang id); terpasang di layout | lighthouse/manifest lint | pass | .crown/evidence/pwa.txt
- AC-PWA-02 | Service worker meng-cache shell dan halaman terakhir; offline menampilkan shell + pesan luring, bukan error putih | Playwright offline emulation | pass | .crown/evidence/e2e/

### 8.9 Repo hygiene dan deliverables hackathon (Gate 8)

- AC-REP-01 | README.md memuat: deskripsi, arsitektur (diagram teks + penjelasan agen), panduan instalasi lokal langkah demi langkah, cara seed, cara jalan, URL demo, tabel kredensial juri, section Disclosure AI, lisensi | checklist parser `node scripts/check-readme.mjs` | semua section ada | .crown/evidence/readme-check.txt
- AC-REP-02 | LICENSE (MIT), CHANGELOG.md, CONTRIBUTING.md ada; versi package.json 1.0.0; tag v1.0.0 dibuat di Gate 9 | file exists + git tag | pass | .crown/evidence/repo-check.txt
- AC-REP-03 | .gitignore mencakup .env*, .crown/worktrees, node_modules, evidence build lokal; tidak ada file .env terlanjur commit di history | scan | pass | .crown/evidence/secret-scan.txt
- AC-DEL-01 | DISCLOSURE-AI.md ada, memuat: pernyataan gagasan inti orisinal tim, perangkat AI yang dipakai (Claude Opus 4.8 via Claude Code untuk implementasi; MiniMax-M2.7 sebagai runtime produk), bagian karya yang dibantu AI, dan referensi .crown/ai-usage.md | checklist parser | pass | .crown/evidence/deliverables.json
- AC-DEL-02 | Pitch deck: deck/pramana-deck.md (Marp) 10-12 slide dengan slide wajib: judul+tim, masalah (angka nasional), insight, solusi, arsitektur agen, demo (3 screenshot e2e asli), dua antarmuka, dampak+skala, implementasi+roadmap dua fase, disclosure AI, penutup+kredensial | parser hitung slide + heading wajib | 10-12 slide, semua heading ada | deck/pramana-deck.md
- AC-DEL-03 | deck/pramana-deck.pdf ter-render dari source via marp-cli, <= 12 halaman | `pnpm deck:build` | exit 0; halaman <= 12 | deck/pramana-deck.pdf
- AC-DEL-04 | Skrip video demo <= 3 menit: deliverables/video-script.md berisi scene, durasi per scene (total <= 180 s), dan narasi | parser durasi | total <= 180 | deliverables/video-script.md
- AC-DEL-05 | deliverables/submission-checklist.md memetakan tiap syarat panitia (repo URL, README, deck PDF, URL demo, kredensial juri, video opsional, disclosure) ke lokasinya, semua tercentang | parser | semua checked | deliverables/submission-checklist.md
- AC-DEL-06 | Kredensial juri di README identik dengan seed (test membandingkan) | vitest | pass | .crown/evidence/junit-del.xml
- AC-DEL-07 | URL produksi tercantum di README dan health-check-nya hijau | curl saat Gate 9 | 200 + ok:true | .crown/evidence/deploy-smoke.txt
- AC-DEL-08 | docs/keputusan-teknis.md ada dengan heading wajib: Bahasa dan Runtime; Kerangka dan Arsitektur; Database dan Desain Skema; Model AI dan Arsitektur Agen; Keamanan; Mode Demo dan Keandalan; setiap bagian memuat subbagian alternatif yang dipertimbangkan beserta alasan penolakan (Gate 8) | `node scripts/check-keputusan.mjs` | semua heading dan subbagian ada | .crown/evidence/deliverables.json

### 8.10 Deploy (Gate 9)

- AC-DEP-01 | Vercel production deploy sukses dari commit ter-tag | `vercel --prod` exit 0 | pass | .crown/evidence/deploy.log
- AC-DEP-02 | Smoke live: GET {URL}/api/health -> ok:true, demoMode:true; login juri-anggota via Playwright terhadap URL live -> verdict tampil | Playwright base URL live | pass | .crown/evidence/deploy-smoke.txt
- AC-DEP-03 | DEMO_MODE=true di env production; live audit trigger tetap berfungsi bila key tersedia, fallback cache bila tidak | manual-scriptable check | pass | idem

### 8.11 Fidelity desain dan self-UAT (Gate 1, 3, 7)

- AC-UI-01 | Token bundle terport verbatim: skrip membandingkan nilai token design-handoff/*/ terhadap token layer aplikasi; nol drift tak terdokumentasi (yang terdokumentasi harus dirujuk .crown/design-deviations.md) | `pnpm check:tokens` | 0 undocumented drift | .crown/evidence/token-fidelity.json
- AC-UI-02 | Fidelity per layar: reviewer fresh-context membandingkan screenshot Playwright tiap layar (ketiga permukaan: landing, anggota, pemerintah; kedua tema) terhadap screenshot bundle; tiap perbedaan diklasifikasi match/improve/downgrade; nol downgrade | manifest review per layar | 0 downgrade | .crown/evidence/design-fidelity/
- AC-UI-03 | Full-click coverage: setiap elemen interaktif pada setiap layar diklik/dieksekusi via Playwright; nol console error, nol kontrol mati, tiap aksi menghasilkan respons terdefinisi | `pnpm e2e --grep clicksweep` | pass | .crown/evidence/e2e/clicksweep/
- AC-UAT-01 | Self-UAT persona juri-anggota: agen fresh-context mengoperasikan URL deploy preview sebagai anggota, menjelajah semua layar dan mencoba semua fitur, menulis temuan; loop perbaikan sampai dua pass bersih berturut-turut | log UAT + manifest | 2 clean pass beruntun | .crown/evidence/uat-anggota/
- AC-UAT-02 | Self-UAT persona juri-pemerintah, cakupan setara | idem | 2 clean pass beruntun | .crown/evidence/uat-pemerintah/
- AC-UAT-03 | Self-UAT persona bendahara: operasikan konsol subjek penuh (semua form, empat preset, RAT) di URL preview | idem | 2 clean pass beruntun | .crown/evidence/uat-bendahara/
- AC-SUBJ-01 | Konsol subjek e2e: login bendahara, preset konflik mengisi form, Catat Transaksi, entri muncul di daftar terakhir dan saldo kas berubah sesuai arah dan jumlah | Playwright `subjek.console.spec.ts` | pass | .crown/evidence/e2e/subjek/
- AC-SUBJ-02 | Loop lintas permukaan dengan LLM mock deterministik: entri preset konsol, pemerintah menjalankan Pemeriksaan Ulang, audit_run live baru memuat temuan yang merujuk transaksi baru, temuan tampil di detail pemerintah dan daftar temuan anggota | Playwright `cross.loop.spec.ts` + mock provider | pass | idem
- AC-SUBJ-03 | Role guard subjek: anggota dan pemerintah ke /api/subjek/* = 403; pengurus ke /api/gov/* dan /api/vote = 403 | vitest matrix | pass | .crown/evidence/junit-sec.xml
- AC-SUBJ-04 | Empat preset menghasilkan payload yang persis memicu tipologi 6.6 agennya masing-masing (diuji terhadap aturan deteksi, bukan LLM) | vitest `subjek.presets.test.ts` | pass | .crown/evidence/junit-subjek.xml

Dimensi 28-matrix yang dinyatakan tidak berlaku: semver publik multi-release (proyek satu rilis v1.0.0, dicatat), i18n multi-locale (single locale id, string tetap terpusat), CI/CD pipeline eksternal (digantikan `pnpm ci:clean` di worktree bersih + hooks; GitHub Actions opsional ditinggalkan demi waktu, dicatat di Report). Semua dimensi lain tercakup entri di atas.

</acceptance_criteria>

## 9. Build Approach dan Test Strategy (fase-gate teradaptasi)

Model eksekusi: Orchestrator = phase conductor. Setiap fase paralel adalah satu dynamic workflow (ultracode) dengan gate sebagai completion goal eksplisit + token budget; evidence manifest ditulis sebelum fan-out; gate parse fail-closed; commit `checkpoint(gate-N): ...` + update .crown/progress.json setiap gate lulus; resume-via-recon berlaku. Wave cap 16 concurrent (deteksi efektif saat runtime), worktree isolation untuk semua penulis kode, worker hard-deny menulis .claude/, .git/, .env*, test, design-handoff/, .crown/evidence, progress. Mesin: operator memberi izin penuh atas kapasitas MacBook M2 Pro, termasuk Docker dan layanan background; belanjakan di tempat yang membeli kualitas atau kecepatan sambil menjaga mesin tetap responsif untuk build-nya sendiri. Lingkungan siap: Vercel CLI terhubung, gh authorized dengan auto-deploy on push, Docker menyala, Kaggle CLI tersedia; seluruh commit, push, dan deploy diserahkan penuh ke Orchestrator. Reviewer density per spine: adversarial wajib pada kontrak (lib/contracts, lib/llm, lib/audit, route handlers), security-sensitive (auth, registerGuard), seed engine, dan verifikasi akhir; single-pass untuk leaf UI presentasional.

Adaptasi yang membedakan run ini dari spine standar (keputusan terkunci):

1. Deploy-first di Gate 0: skeleton Next.js + health endpoint live di Vercel sebelum fan-out apa pun.
2. Fase 7 baru: Demo-Proofing, gate deterministik sendiri, karena demo yang tidak pernah gagal adalah fitur produk (C5).
3. Fase 8 diperluas: repo hygiene digabung deliverables hackathon bergate mesin (AC-DEL-*).
4. Register copy dan larangan tuduhan ditegakkan hook + validator, bukan konvensi.
5. Tasks DAG diaktifkan (CLAUDE_CODE_ENABLE_TASKS) sebagai lapisan anti-false-done lintas context window, melengkapi progress.json.

Pra-partisi modul dan wave (unit, isi, dependensi, wave, densitas review, budget token per workflow):

```
a  data-layer + seed + fixtures     schema Drizzle, seed engine, fixtures AN     -            wave 1  adversarial   ~120k
b  llm + audit + registerGuard      lib/llm, lib/prompts, lib/audit, guard       kontrak 6.1  wave 1  adversarial   ~140k
f  deliverables engine              deck source, README skeleton, video, checker -            wave 1  single-pass   ~80k
g  UI landing (porting bundle)      rekonstruksi landing page dari bundle        -            wave 1  single-pass   ~60k
h  UI konsol subjek (porting)       rekonstruksi konsol dari bundle subjek       c (stub ok)  wave 2  single+spot   ~80k
c  auth + API routes                session, seluruh route handlers 6.3          a            wave 2  adversarial   ~120k
d  UI anggota (porting bundle)      rekonstruksi layar bundle mobile + PWA               c (stub ok)  wave 2  single+spot   ~160k
e  UI pemerintah (porting bundle)   rekonstruksi layar bundle dashboard               c (stub ok)  wave 2  single+spot   ~100k
Verifikasi Phase 3 (loop)                                                                     ~200k
Hardening perf / security / demo-proofing                                                     ~80k each
```

Wave 1 = a, b, f, g; wave 2 = c, d, e, h. Dua wave jauh di bawah cap 16 concurrent, jadi Orchestrator boleh memecah d menjadi sub-unit per layar bila menguntungkan; angka budget adalah pagar per-workflow yang dicatat di manifest, bukan countdown dalam konteks.

Spine:

- Phase 0, Foundation (Orchestrator sendiri, sequential). Recon git; verifikasi pramana-ai_mobile.zip, pramana-ai_dashboard.zip, pramana-ai_landing-page.zip, dan pramana-ai_dashboard-subjek.zip ada di root (absen/korup = STOP and ask), unzip ke design-handoff/mobile, design-handoff/dashboard, design-handoff/landing, dan design-handoff/subjek, tulis .crown/design-inventory.md; baca blueprint ini + keempat bundle penuh; rekonsiliasi per section 4 dan 6.19 + flag. Tulis SELURUH .claude/ (ADR-07): settings (deny worker terhadap kontrol plane, allowlist toolchain), hooks (PreToolUse deny set; PostToolUse lint+format+register-scan pada file copy/fixtures; Stop/SubagentStop menjalankan `pnpm typecheck && pnpm test` dengan recursion guard; PreCompact snapshot .crown/notes.md + pointer kontrak; SessionStart re-inject pointer), CLAUDE.md < 150 baris (perintah kerja, peta modul, pointer kontrak, larangan scope 2.2), rules path-scoped. Init .crown/{progress.json,notes.md,ai-usage.md,evidence/}. Scaffold Next.js 16 + toolchain, health endpoint, hubungkan Vercel, deploy pertama. Tulis implementation-architecture doc (layout modul konkret di dalam kontrak); reviewer fresh-context memvalidasi terhadap setiap kontrak section 6 dan invariant. Isi wajib dokumen itu (checklist review Gate 0): peta folder konkret; pemetaan setiap kontrak 6.1-6.17 ke file implementasinya; alur data teks (request -> route -> lib -> DB -> UI); daftar invariant (paginasi 50, warna server-side, register guard, DEMO_MODE) dengan titik penegakannya; rencana partisi final terhadap tabel pra-partisi; daftar library terpilih dengan satu baris alasan; hasil evaluasi ulang adversarial ADR-01..13 terhadap alternatif (minimal Python/FastAPI, Go, dan Postgres) yang menjadi benih docs/keputusan-teknis.md. GATE 0 (hard): hooks aktif terverifikasi (probe write-and-revert), keempat bundle terinventaris, URL Vercel live 200, arsitektur review lulus. Commit.
- Phase 1, Build (workflow, fan-out). Partisi by kontrak menjadi modul: (a) data layer + seed engine + fixtures anomali; (b) lib/llm + lib/audit + prompts + registerGuard; (c) auth + API routes; (d) UI anggota (5 layar + onboarding + PWA shell); (e) UI pemerintah; (f) deliverables engine (deck source, README skeleton, skrip video); (g) UI landing page (porting bundle landing, statis, tanpa dependensi API); (h) UI konsol subjek (porting bundle dashboard-subjek). Topological: a sebelum c; b paralel a; d/e/h setelah c kontrak-stub; g independen. Tiap modul: implementer di worktree + dokumen modulnya + unit test sesuai AC. GATE 1: AC-BLD-01, AC-TYP-01, AC-LNT-01, AC-UNI-01, AC-SEED-01/02, AC-DB-01, AC-LLM-01/02/03, AC-REG-01/02, AC-UI-01 lulus. Commit per wave + gate.
- Phase 2, Integration (Orchestrator, sequential). Wiring UI ke API nyata, session, notifikasi badge, sorotan arus-dana-ke-temuan. GATE 2: app build + boot + smoke lokal login dua role. Commit.
- Phase 3, Verify and repair (satu looping workflow). Fan verifikasi seluruh matrix section 8 (kecuali 8.5, 8.6, 8.9, 8.10, dan AC-UAT yang bergate belakangan namun boleh dicicil); fresh-context reviewer, grounded-claims verbatim; fixer di worktree dalam loop; perubahan foundational memicu re-run seluruh matrix. GATE 3 (hard, sentral): semua AC section 8.2-8.4, 8.7, 8.8, plus AC-UI-02, AC-UI-03, dan AC-SUBJ-01/02/03/04 lulus dengan evidence. Commit.
- Phase 4, Root-cause escalation (conditional workflow). Hanya bila kegagalan resisten; hipotesis independen; panel verifier/refuter; kembali ke Gate 3.
- Phase 5, Hardening performa (workflow). Profil; AC-PERF-01..04. GATE 5 (hard). Commit.
- Phase 6, Hardening security (workflow). AC-SEC-01..07; temuan diverifikasi independen. GATE 6 (hard): nol high/critical terbuka. Commit.
- Phase 7, Demo-Proofing (workflow, BARU). Jalankan AC-DEMO-01..03 penuh; e2e ulang dengan env LLM dikosongkan; latihan reset (`pnpm seed`) dan verifikasi <= 60 s; hasilkan 3+ screenshot e2e kanonik untuk deck; verifikasi banner cache/live; lalu self-UAT loop tiga persona (juri-anggota, juri-pemerintah, bendahara) terhadap URL deploy preview: jelajah semua layar, coba semua fitur dan elemen interaktif seperti manusia, temuan diperbaiki dalam loop sampai dua pass bersih berturut-turut per persona. GATE 7 (hard): AC-DEMO-01..03 + AC-UAT-01/02/03 + screenshot artifact ada. Commit.
- Phase 8, Repo dan Deliverables (workflow). README penuh, DISCLOSURE-AI.md, docs/keputusan-teknis.md, CHANGELOG, CONTRIBUTING, LICENSE, deck build PDF, video-script, submission-checklist. GATE 8 (hard): seluruh AC-REP-*, AC-DEL-01..06, dan AC-DEL-08. Commit.
- Phase 9, Deploy final dan honest Report (Orchestrator, sequential). Precondition: vercel CLI terautentikasi (jika tidak: STOP and ask). Deploy production, AC-DEP-01..03 + AC-DEL-07, tag v1.0.0, grounded-claims audit, tulis Report.md dengan struktur wajib: (1) pernyataan jarak ke ceiling 99 persen dalam satu paragraf jujur; (2) tabel verified per AC id dengan path evidence; (3) daftar broken/unfinished/unverified yang spesifik; (4) deviasi dari blueprint beserta alasan satu baris; (5) daftar HUMAN-GATED (push repo publik TIDAK termasuk karena remote dan gh sudah siap; minimal: AC-LLM-04 bila key absen); (6) catatan spend kualitatif dari progress.json; (7) rekomendasi pass berikutnya untuk run Mode 3 di venue. GATE 9 (hard). Commit + tag.

Tabel paranoia spesifik proyek (penutupan yang diadaptasi dari tabel metode):

```
K1/K2 stall (rate limit, crash)      commit per gate + per wave; recon re-verifikasi gate terakhir sebelum lanjut
K5 gate tidak bisa lulus              max 4 iterasi per gate tanpa progres -> STOP, tulis Report dengan blocker
K7 kredensial deploy absen            precheck vercel whoami di Phase 0 dan Phase 9; STOP and ask bila gagal
ADR-07 prompt .claude/ awal           operator hadir saat launch dan approve; bila prompt menggantung tanpa operator,
                                      emit file yang dibutuhkan ke stdout + STOP, jangan build tanpa hooks aktif
F1 selesai palsu                      manifest fail-closed per gate; Tasks DAG; loop-until-pass
F2 self-review bias                   penulis tidak pernah menandatangani kodenya; reviewer fresh-context
F3 drift pasca compaction             PreCompact snapshot + SessionStart inject pointer kontrak + CLAUDE.md re-inject
F4/F14 test/evidence digodok worker   deny hook pada tests/**, e2e/**, scripts/fixtures/**, .crown/evidence/**, progress
F5 checkpoint bohong                  recon menjalankan ulang cek gate terakhir, rollback bila gagal
F6 regresi diam-diam                  perubahan schema/kontrak/shared -> re-run seluruh matrix section 8
F7 design vs kontrak                  reconcile-and-flag; tidak menciptakan kontrak baru untuk mencocokkan mockup
F12 cacat internal blueprint          surface di Report + jalan di bacaan paling defensible, jangan diam-diam
F15 countdown token                   tidak pernah menampilkan sisa token; catatan spend hanya di progress/notes
A1 query tanpa batas                  paginasi 50 frozen + fixture 5.000 baris di Gate 5
R2 secret/.claude bocor ke repo       gitignore sejak init + secret scan riwayat di Gate 6 dan 8
PJ1 network venue mati                DEMO_MODE default + AC-DEMO-03 + skrip video backup
PJ2 output model menuduh              registerGuard sebelum persist + fixture adversarial AC-REG-01
PJ3 MiniMax tidak terjangkau          kegagalan model jatuh ke cache (source=cache, banner.cache); DEMO_MODE bikin alur juri tak bergantung model
PJ4 downgrade visual diam-diam        AC-UI-02 klasifikasi match/improve/downgrade per layar + .crown/design-deviations.md
```

Discretionary workflows diizinkan bila layak compute (misal micro-interaction tambahan di atas bundle yang sejalan karakter, tercatat sebagai improvement 6.19, tanpa menyentuh kontrak).

Test strategy: unit (vitest) untuk kontrak/aturan/guard; integration (vitest + supertest) untuk route matrix; e2e (Playwright, project mobile viewport untuk member dan desktop untuk gov) untuk journeys; property test ringan untuk registerGuard; fixture adversarial untuk verdict rules; bench script untuk perf; axe untuk a11y. Test dimiliki verification workflow; worker dilarang menulisnya (F4/F14).

Durabilitas: commit per gate + per wave; .crown/progress.json + notes.md; PreCompact snapshot; relaunch recon re-verifikasi gate terakhir sebelum lanjut. AI-usage logging: setiap fase menambah baris ringkas ke .crown/ai-usage.md (fase, apa yang dibantu AI) sebagai bahan disclosure C2.

Run kedua (di venue, 10-11 Juli) diperlakukan sebagai Mode 3: input blueprint ini + Report.md run pertama; fokus polish, improvement visual lanjutan di atas bundle (per 6.19), dan submission; tidak membangun ulang yang sudah verified.

## 10. Open Questions dan Assumptions (default yang diasumsikan Orchestrator)

- Q1 Bundle desain absen atau korup saat Phase 0? STOP and ask. Tidak ada jalur desain interim; keempat zip adalah prasyarat launch dan operator memastikannya sebelum menjalankan.
- Q2 MiniMax account gagal top-up atau kredit habis? Tidak ada provider fallback; build tetap jalan penuh via DEMO_MODE (seluruh alur juri deterministik dari seed) dan AC-LLM-04 (live bench) menjadi HUMAN-GATED. Live audit trigger akan menampilkan banner.cache.
- Q3 Turso credentials absen di .env saat deploy? STOP and ask (kelas kredensial deploy). Dev/test tetap jalan file SQLite.
- Q4 Nama koperasi/persona? Default sesuai 6.7; boleh diganti operator via satu konstanta seed, bukan hardcode tersebar.
- Q5 GitHub repo publik? GIT_REMOTE_URL sudah diisi (repo publik pramana-ai) dan gh sudah terautentikasi, jadi Orchestrator init git lokal, membuat repo publik bila belum ada (via gh), dan push di Gate 8/9; push memicu deploy Vercel otomatis. Ini aksi otonom, bukan HUMAN-GATED. Bila suatu saat GIT_REMOTE_URL kosong, barulah push menjadi HUMAN-GATED.
- Q6 Batas plafon pinjaman per anggota untuk deteksi AN-5? Default Rp10.000.000 (konstanta seed), disebut sebagai kebijakan koperasi sintetis, bukan klaim regulasi.

## 11. Traceability (vision -> feature -> kontrak -> AC)

- Momen 60 detik anggota paham -> F02, F03 -> 6.1, 6.5, 6.8 -> AC-E2E-01, AC-REG-01/02, AC-COPY-01..03, AC-A11Y-01/02
- Pengawas multi-agent -> F01, F12 -> 6.1, 6.4, 6.6 -> AC-LLM-01..05, AC-DEMO-01
- Bertanya bukan menuduh -> F03 -> 6.5 -> AC-REG-01, AC-REG-02, C3
- Transparansi arus dana -> F09 -> 6.2, 6.3 -> AC-E2E-01, AC-PERF-03
- Partisipasi RAT dan voting -> F10 -> 6.2, 6.3 -> AC-E2E-01, AC-E2E-04
- Keanggotaan digital -> F11 -> 6.3 -> AC-E2E-03
- Dua pengguna, pengurus diaudit -> F07, seed tanggapan -> 6.2, 6.3 role guard -> AC-E2E-02, AC-SEC-02
- Demo tidak pernah gagal -> F04 -> 6.4, ADR-03 -> AC-DEMO-01..03, AC-LLM-05
- Syarat panitia -> F15 -> ADR-10, C1, C2 -> AC-DEL-01..07, AC-REP-01..03
- Landing page pitching -> F16 -> 6.10, 6.15, 6.19 -> AC-E2E-06, AC-UI-01..03 -> Gate 1, 3
- Loop input subjek dan bukti mesin nyata -> F17 -> 6.2, 6.3, 6.4, 6.19 -> AC-SUBJ-01..04, AC-UAT-03 -> Gate 3, 7
- Fidelity desain dan UAT mandiri -> section 4, 6.19 -> AC-UI-01..03, AC-UAT-01/02 -> Gate 1, 3, 7
- Kualitas produksi -> semua -> section 8 penuh -> Gate 1,3,5,6,7,8,9


## 12. Arah Desain untuk /designer-v1 (input rantai berikutnya, bukan kontrak visual)

Rasa: sederhana, minimalis, terasa mahal; kepercayaan adalah produknya, jadi kerapian adalah fitur. Dua register visual dari satu sistem token: anggota hangat-minimal dengan akomodasi literasi rendah (angka besar, ikon berdampingan kata, target sentuh lapang, kontras tinggi, satu gagasan per layar); pemerintah lebih padat data, terasa instrumen serius. Warna verdict adalah bahasa inti (hijau/kuning/merah) dan harus memiliki token semantik sendiri, bukan warna dekoratif. Gerak halus dan hemat. Surfaces yang wajib didesain: login, onboarding+kartu anggota, beranda verdict, panel temuan (dengan expand kenapa penting dan bukti), uang Anda, arus dana, suara Anda (agregat+voting), gov overview, gov detail koperasi, empty/error states 6.15. Seluruh copy final sudah dikunci di 6.8 dan 6.15; desain tidak menulis ulang copy. Handoff bundle disimpan operator ke folder proyek; rekonsiliasi per section 4.

Catatan status: ketiga bundle Claude Design sudah jadi dan diverifikasi isinya (mobile palet Nila/Geist; dashboard Porselen Hangat/Archivo+Public Sans neumorfik; landing Malam Jernih/Plus Jakarta Sans+JetBrains Mono), masuk sebagai pramana-ai_mobile.zip, pramana-ai_dashboard.zip, dan pramana-ai_landing-page.zip. Inventaris presisi ada di Appendix A prompt Orchestrator; diperlakukan per kontrak 6.19. Bundle keempat (konsol subjek) menyusul dari sesi keempat sebagai pramana-ai_dashboard-subjek.zip dan diinventaris Phase 0 dengan perlakuan sama.
