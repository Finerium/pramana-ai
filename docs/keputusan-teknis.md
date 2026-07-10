# Keputusan Teknis Pramana AI

Dokumen pertahanan teknis untuk tanya jawab juri (AC-DEL-08). Setiap keputusan diuji ulang secara adversarial pada Phase 0 terhadap alternatif yang material, bukan sekadar dikutip dari blueprint. Konstrain yang menimbang semua keputusan: empat bundle desain ber-token Tailwind yang wajib diport setia (AC-UI-01/02), satu basis kode untuk empat permukaan, demo dinilai juri dari URL live dengan jaringan venue yang tidak bisa diandalkan, dan landasan waktu pembangunan tiga hari.

## Bahasa dan Runtime

Keputusan: TypeScript strict di atas Node.js, satu bahasa untuk UI, API, mesin audit, seed, dan tooling verifikasi.

Alasan utama: produk ini adalah SATU aplikasi yang jantungnya antarmuka. Empat bundle Claude Design (anggota, pemerintah, landing, konsol subjek) berbentuk komponen React dengan token Tailwind; kebenaran visualnya adalah kontrak. Bahasa apa pun selain TypeScript memaksa penerjemahan bundle ke sistem template lain, yang berarti biaya porting dua kali dan risiko downgrade fidelity yang oleh kontrak 6.19 dihitung sebagai kegagalan gate. Satu bahasa juga berarti tipe domain tunggal (lib/contracts.ts, Zod) dipakai persis sama oleh route handler, mesin audit, seed, dan test, tanpa duplikasi skema lintas bahasa.

Alternatif yang dipertimbangkan:

- Python + FastAPI. Kuat untuk orkestrasi LLM dan tooling data, tetapi tidak menyelesaikan separuh produk yang lain: UI. Praktisnya menjadi dua aplikasi (FastAPI + frontend React terpisah), dua deploy, dua kontrak yang bisa saling hanyut, pada landasan tiga hari. Kebutuhan LLM produk ini tipis: lima panggilan HTTP OpenAI-compatible dengan validasi JSON; tidak ada pustaka Python yang dibutuhkan. Ditolak karena menggandakan permukaan integrasi tanpa manfaat material.
- Go. Keunggulan throughput dan ketahanan runtime tidak relevan pada skala demo (12 koperasi, ratusan baris transaksi, satu penulis). Ekosistem UI Go (templ, htmx) tidak dapat mengonsumsi bundle React ber-token; porting setia praktis mustahil. Ditolak.
- Node murni tanpa TypeScript. Kontrak 6.1 didefinisikan sebagai tipe TypeScript + Zod; melepas type checking membuang alat verifikasi kontrak paling murah yang ada. Ditolak.

Catatan pin versi: TypeScript dipin 5.9 (bukan 7.x) dan ESLint dipin 9 (bukan 10) karena rantai typescript-eslint dan plugin eslint-config-next belum mendukung major terbaru; toolchain yang membosankan dan kompatibel lebih berharga daripada angka versi pada proyek berumur tiga hari.

## Kerangka dan Arsitektur

Keputusan: Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, deploy Vercel; satu monorepo satu aplikasi; empat route group (publik, member, gov, subjek) dengan empat lapisan token ber-namespace; deploy-first sejak Gate 0.

Alasan utama: App Router memberi RSC untuk halaman baca-berat (dasbor, temuan) dan route handlers untuk kontrak API 6.3 di repo yang sama; Vercel memberi URL live dalam hitungan menit dan preview per push, yang oleh kompetisi memang dinilai (URL demo adalah deliverable wajib). Empat surface tetap satu basis kode dengan pemisahan register visual lewat empat file token yang diimpor oleh layout route group masing-masing, sesuai kontrak 6.19 yang melarang penyatuan token.

Alternatif yang dipertimbangkan:

- Remix atau SvelteKit. Kualitasnya tidak diragukan, tetapi bundle desain, template shadcn, dan kefasihan tooling agen pembangun berpusat di Next; pada landasan tiga hari, familiarity adalah fitur keandalan. Ditolak.
- FastAPI + SPA React terpisah (arsitektur dua layanan). Ditolak dengan alasan bahasa di atas plus biaya CORS, dua pipeline deploy, dan dua sumber kegagalan saat demo.
- Static site + serverless functions lepas. Kehilangan RSC dan kohesi kontrak; jumlah endpoint (19) membuat function lepas tanpa kerangka menjadi rawan drift. Ditolak.
- Microservices atau repo terpisah per surface. Menambah biaya integrasi tanpa nilai pada skala ini. Ditolak (ADR-09).

Konsekuensi yang diterima secara sadar: keterikatan pada platform Vercel untuk hosting. Diterima karena migrasi keluar (next build jalan di Node server mana pun) tetap terbuka dan biaya ini tidak menyentuh jalur kritis kompetisi.

## Database dan Desain Skema

Keputusan: libSQL, yaitu Turso di production dan file SQLite lokal di dev/test, diakses lewat Drizzle ORM; skema mengikuti nama tabel dan kolom beku 6.2; foreign key aktif; indeks eksplisit untuk jalur query panas; migrasi bersih dari nol via drizzle-kit.

Alasan utama: filesystem Vercel bersifat sementara sehingga SQLite file murni tidak persist di production; Turso memberi kompatibilitas SQLite tanpa mengubah satu baris kode Drizzle. Yang sering diremehkan justru sisi dev/test: file SQLite lokal berarti seluruh suite test dan seed berjalan tanpa jaringan dan tanpa server database, sehingga reproducibility clean-checkout (AC-CFG-02) dan determinisme seed (AC-SEED-01) murah dipenuhi. Data demo bermuatan kecil dan satu penulis; karakteristik SQLite justru pas.

Desain fisik yang dipilih atas merit (wilayah latitude): foreign key ON, karena integritas relasi temuan-auditRun-koperasi adalah bagian cerita produk; indeks pada transaksi(koperasiId, tanggal) untuk daftar berhalaman dan agregasi bulanan, temuan(auditRunId) untuk render verdict, audit_run(koperasiId, periode) untuk tren, plus UNIQUE bawaan kontrak pada vote(keputusanId, anggotaId) dan pertanyaan_rat(temuanId, anggotaId) yang sekaligus menjadi penegak idempotensi di lapisan data; pembuktian lewat assertion EXPLAIN QUERY PLAN di test (AC-DB-01). Query daftar selalu LIMIT 50 dan agregasi dihitung di SQL, bukan memuat semua baris (AC-PERF-03).

Alternatif yang dipertimbangkan:

- Postgres (Neon atau Supabase). Lebih meyakinkan di atas kertas untuk skala produksi, tetapi menambah beban nyata pada tiga hari ini: dev/test butuh server berjalan atau container, test menjadi tergantung jaringan atau Docker, dan tidak ada satu pun kebutuhan fungsional produk (window function berat, concurrency tinggi, ekstensi) yang menuntutnya. Pada skala 12 koperasi dan ratusan transaksi, perbedaan kemampuannya tidak termanifestasi. Ditolak: biaya operasional naik, manfaat nol yang terukur.
- SQLite file di Vercel tanpa Turso. Tidak persist antar invocation. Ditolak.
- Prisma sebagai ORM. Lebih berat saat build dan runtime serverless; Drizzle lebih tipis dan dialek SQLite-nya matang. Ditolak.

Jalur produksi jangka panjang (narasi pitch, bukan implementasi MVP): skema 6.2 portabel ke Postgres bila integrasi SIMKOPDES menuntutnya; Drizzle mendukung keduanya. Data dan model Pramana sudah diselaraskan ke bentuk kamus data resmi SIMKOPDES (format identifier, kosakata enum, field bernilai tinggi) sehingga integrasi produksi tinggal mengarahkan koneksi, bukan menulis ulang model data; pemetaan tabel demi tabel ada di [docs/pemetaan-simkopdes.md](pemetaan-simkopdes.md).

## Model AI dan Arsitektur Agen

Keputusan: satu model, satu provider: MiniMax-M2.7 via endpoint OpenAI-compatible (base https://api.minimax.io/v1) untuk keempat agen forensik dan adjudikator; peran dibedakan lewat prompt, bukan model; panggilan non-streaming; output JSON tervalidasi Zod dengan satu retry korektif; TANPA provider fallback, jaring pengaman satu-satunya adalah cache hasil audit di DB.

Alasan utama: arsitektur produk ini adalah empat pemeriksa spesialis paralel (Promise.allSettled) plus satu adjudikator, masing-masing dengan wilayah deteksi 6.6 dan register bahasa 6.5 yang ketat; nilai produk ada di desain prompt dan validasi, bukan di keragaman model. Satu provider berarti satu kontrak error, satu jalur billing, satu permukaan rahasia. MiniMax dipilih oleh tim atas ketersediaan kredit dan tarif M-series yang rendah; non-streaming dipilih karena stream M2.x dapat membocorkan reasoning ke output, sedangkan output kontrak wajib JSON murni.

Dua penegakan server-side yang tidak dinegosiasikan: warna verdict dihitung ulang server dari aturan 6.1 (usulan adjudikator hanya usulan, AC-LLM-03), dan registerGuard menyaring kosakata vonis sebelum persist (risiko hukum defamasi C3, AC-REG-01). Kegagalan model apa pun jatuh ke hasil tersimpan bertanda source cache plus banner, bukan ke provider kedua.

Alternatif yang dipertimbangkan:

- Multi-provider dengan fallback (misal MiniMax lalu OpenAI). Menggandakan kontrak, rahasia, dan mode gagal; dan pada saat demo justru menambah cara demo bisa aneh (jawaban dua model berbeda gaya). Kegagalan provider sudah tertangani lebih deterministik oleh cache. Ditolak.
- Kerangka agen (LangChain, AI SDK agents, dsb). Kebutuhan riil: lima panggilan HTTP dengan skema JSON tetap dan satu retry. Kerangka menambah lapisan abstraksi dan dependensi untuk masalah yang selesai dengan satu klien tipis (lib/llm.ts). Ditolak.
- Model berbeda per peran (forensik kecil, adjudikator besar). Menambah dua kontrak perilaku dan dua tarif tanpa bukti perlunya; register dan kualitas ditegakkan validator, bukan ukuran model. Ditolak.
- Menjalankan model open-weight on-premise. Benar sebagai roadmap kepatuhan UU PDP untuk produksi dan disebut di pitch, tetapi bukan pekerjaan MVP tiga hari. Ditunda eksplisit (out of scope 2.2).

## Keamanan

Keputusan: sesi cookie tersandatangani iron-session (httpOnly, secure di production, sameSite lax, umur 7 hari, nama pramana_session), password bcryptjs, tiga role dengan deny-by-default di setiap route non-publik, validasi Zod di seluruh boundary input, rate limit login sliding window in-memory, tanpa PII nyata di seluruh sistem, dan rahasia hanya lewat environment.

Alasan utama: kebutuhan riil auth produk ini adalah pemisahan tiga role dan akun uji juri yang seeded; ini kelas masalah cookie tersandatangani, bukan kelas masalah OAuth. Semakin kecil permukaan auth, semakin kecil peluang demo gagal karena redirect pihak ketiga. Data seluruhnya sintetis (C6) sehingga risiko data pribadi ditutup di desain, bukan di mitigasi.

Alternatif yang dipertimbangkan:

- NextAuth (Auth.js) atau Clerk. Membawa alur OAuth, halaman bawaan, dan ketergantungan konfigurasi eksternal yang tidak dibutuhkan tiga akun seeded; Clerk menambah layanan pihak ketiga pada jalur login juri. Ditolak.
- argon2. Secara kriptografis lebih kuat, tetapi paketnya binary native yang menjadi titik rapuh pada build serverless; bcryptjs murni JS, nol dependensi native, dan memadai untuk kredensial demo seeded (cost factor didokumentasikan). AC-SEC-06 menerima keduanya. Ditolak demi keandalan deploy.
- Rate limit berbasis store eksternal (Upstash). Menambah layanan eksternal untuk kebutuhan yang oleh catatan 6.18 secara eksplisit diterima sebagai in-memory kelas demo; keterbatasan per-instance serverless dicatat jujur di Report. Ditolak.

Postur rahasia: .env di-deny-read/write untuk seluruh agen pembangun termasuk orchestrator (hook + settings); .env tidak ikut upload deploy (.vercelignore); env production diatur lewat vercel env; scan rahasia mencakup riwayat git (AC-SEC-04).

SESSION_SECRET dan boot 6.16: kontrak menuntut boot gagal bila SESSION_SECRET kosong di production. Model serverless Vercel tidak punya proses boot yang berlangsung lama, sehingga validasi ditegakkan fail-fast pada pemakaian pertama sessionSecret() (login dan getSession): ConfigError berpesan jelas di-log tanpa PII, sementara klien menerima INTERNAL generik. Properti keamanan 6.16 tetap terjaga penuh, yakni production tidak pernah menandatangani sesi dengan secret kosong atau kurang dari 32 karakter, dan jalur build tidak membutuhkan secret sama sekali. Alternatif berupa assertion boot terpisah di luar jalur import dipertimbangkan; pada model serverless ia tidak menambah keamanan namun menambah permukaan dan risiko build, maka ditolak untuk saat ini dan dicatat sebagai jalur upgrade bila kelak ada proses long-running non-build.

## Mode Demo dan Keandalan

Keputusan: DEMO_MODE=true sebagai default deployment. Seed menanam hasil audit lengkap (verdict merah Sukamaju dengan temuan AN-1 sampai AN-6 dari fixture beku scripts/fixtures/temuan-seed.ts, riwayat enam periode, 11 koperasi ringkas) sehingga seluruh alur juri berjalan 100 persen dari database tanpa satu pun panggilan model. Live audit tetap tersedia sebagai bukti mesin nyata: trigger dari dasbor pemerintah menulis run baru bertanda live; kegagalannya jatuh otomatis ke hasil tersimpan dengan banner sumber data.

Alasan utama: mode gagal nomor satu demo hackathon adalah ketergantungan pada jaringan dan API live di venue (C5). Dengan precompute saat seed, demo bersifat byte-identik antar-run (AC-DEMO-01), bisa direset di bawah 60 detik (AC-DEMO-02), dan tetap utuh dengan API key dikosongkan (AC-DEMO-03). Determinisme juga yang membuat fixture test bisa membaca teks temuan persis.

Alternatif yang dipertimbangkan:

- Selalu live audit saat demo. Menempatkan nasib demo pada jaringan venue dan uptime provider; satu timeout membuat juri menatap spinner. Ditolak sebagai default; tetap ada sebagai aksi eksplisit.
- Mock server model saat demo. Membohongi juri soal apa yang nyata; juga lebih rapuh daripada membaca DB. Ditolak; mock deterministik hanya dipakai di suite test lintas permukaan (AC-SUBJ-02) dan diberi label jelas sebagai test.
- Rekaman video saja tanpa aplikasi live. Tidak memenuhi syarat URL live panitia; video tetap dibuat sebagai cadangan (6.17). Ditolak sebagai jalur utama.

## Keputusan pendukung

- Pitch deck lewat Marp markdown yang dirender ke PDF: konten deck menjadi machine-checkable (jumlah slide, heading wajib, AC-DEL-02/03) dan mudah disunting manusia; alternatif desain manual (Figma, PowerPoint) tidak bisa digate mesin. Polish visual manusia tetap terbuka setelahnya.
- Seluruh string UI terpusat di lib/copy.ts dan seluruh angka nasional di lib/facts.ts dengan sumber dan tanggal: register 6.8 dan kejujuran statistik ditegakkan pada satu permukaan oleh hook dan checker, bukan konvensi.
- Kepemilikan .claude/ oleh orchestrator (ADR-07) dieksekusi pada sesi fondasi; hooks aktif dibuktikan probe empat vektor pada Gate 0, dan sesudah Phase 0 setiap perubahan .claude/ adalah peristiwa stop-and-ask.
- Model pembangun (Claude Opus 4.8, ultracode) adalah keputusan operator (ADR-06), dicatat sebagai given.
- Tanpa library chart: seluruh grafik di keempat bundle digambar dengan CSS dan markup; memasang chart library berarti mengganti visual yang dikontrak dengan interpretasi library (downgrade) sekaligus membebani bundle (AC-PERF-02).

## Ringkasan sikap

Tidak ada pilihan terkunci yang gagal dipertahankan terhadap alternatif material; tidak ada eskalasi stop-and-ask yang diperlukan dari evaluasi ulang ini. Bila ada satu kalimat untuk juri: setiap komponen dipilih agar demo tidak bisa gagal dan agar empat desain yang sudah dikunci sampai ke layar tanpa penurunan, oleh tim yang punya tiga hari dan satu kesempatan presentasi.
