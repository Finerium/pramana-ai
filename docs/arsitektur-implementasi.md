# Arsitektur Implementasi Pramana AI (Phase 0)

Dokumen ini adalah peta implementasi di dalam batas kontrak beku blueprint section 6. Ia tidak mengubah kontrak apa pun; ia menetapkan DI MANA setiap kontrak hidup di kode, bagaimana data mengalir, dan bagaimana invariant ditegakkan. Reviewer Gate 0 memvalidasi dokumen ini terhadap setiap kontrak section 6 dengan sitasi baris.

## 1. Peta folder konkret

```
app/
  (publik)/
    page.tsx                    rute /        landing statis (port bundle landing)
    layout.tsx                  milik unit g; import styles/tokens/landing.css
    login/layout.tsx            milik unit d; import token surface login (mobile default + varian persona F-09)
    login/page.tsx              rute /login   satu halaman login, redirect per role (U8, 6.10)
    daftar/layout.tsx           milik unit d; import styles/tokens/mobile.css
    daftar/page.tsx             rute /daftar  onboarding + kartu anggota (F11)
  (member)/
    beranda/page.tsx            rute /beranda (F02, F03: panel temuan dibuka dari beranda)
    uang/page.tsx               rute /uang    (F08)
    arus/page.tsx               rute /arus    (F09)
    suara/page.tsx              rute /suara   (F10)
    layout.tsx                  tab bar bawah 4 tab (U1) + import styles/tokens/mobile.css
  (gov)/
    pemerintah/page.tsx         rute /pemerintah (F07)
    pemerintah/koperasi/[id]/page.tsx  drill-down + live audit trigger (F12)
    layout.tsx                  import styles/tokens/dashboard.css
  (subjek)/
    pembukuan/page.tsx          rute /pembukuan  konsol simulasi pembukuan (F17, U12)
    layout.tsx                  import styles/tokens/subjek.css
  api/
    auth/login/route.ts         POST 6.3
    auth/logout/route.ts        POST 6.3
    onboarding/route.ts         POST 6.3
    member/summary/route.ts     GET  6.3
    member/verdict/route.ts     GET  6.3
    member/findings/route.ts    GET  6.3
    member/flow/route.ts        GET  6.3 (?periode=)
    member/voice/route.ts       GET  6.3
    findings/[id]/rat/route.ts  POST 6.3 (idempoten per pasangan)
    vote/route.ts               POST 6.3
    subjek/transaksi/route.ts   POST 6.3
    subjek/pinjaman/route.ts    POST 6.3
    subjek/rat/route.ts         POST 6.3
    subjek/recent/route.ts      GET  6.3
    gov/overview/route.ts       GET  6.3
    gov/koperasi/[id]/route.ts  GET  6.3
    gov/audit/run/route.ts      POST 6.3 (202 + polling)
    audit/[id]/status/route.ts  GET  6.3
    health/route.ts             GET  6.3 (sudah ada sejak Gate 0)
  layout.tsx                    root: lang="id", metadata
  globals.css                   Tailwind v4 + shadcn base
lib/
  contracts.ts                  SATU-SATUNYA sumber tipe domain: 6.1 + 6.3b verbatim (Zod)
  env.ts                        resolusi env 6.16 (DEMO_MODE default true; SESSION_SECRET fail-fast di production)
  api.ts                        envelope {ok,data}/{ok,error{code,message}}; kode error beku 6.3
  auth.ts                       iron-session; cookie "pramana_session" per 6.4; requireRole deny-by-default
  llm.ts                        chatJSON + runAudit per 6.4 (non-streaming, retry-1, LLMUnavailable, allSettled)
  audit/
    index.ts                    orkestrasi runAudit: snapshot -> 4 forensik -> adjudikator -> persist
    snapshot.ts                 pembangun snapshot 6.9 dari DB periode berjalan (maks 500 baris transaksi)
    verdict.ts                  aturan warna 6.1 server-side (menang atas usulan adjudikator)
  prompts/
    bersama.ts                  baris pembuka + aturan bersama 6.9
    konflik-kepentingan.ts      blok wilayah 6.9
    anomali-transaksi.ts        blok wilayah 6.9
    kesehatan-finansial.ts      blok wilayah 6.9
    kepatuhan-proses.ts         blok wilayah 6.9
    adjudikator.ts              prompt adjudikator 6.9
  registerGuard.ts              validator 6.5 sebelum persist (denylist + pola edukatif + "?")
  copy.ts                       SEMUA string UI: 6.15 verbatim + label per surface (F-03)
  facts.ts                      angka nasional + sumber + tanggal (ADR-12)
  logger.ts                     logger JSON terstruktur {level, requestId, code} (AC-OBS-01)
  rateLimit.ts                  sliding window in-memory /api/auth/login (AC-SEC-07, catatan 6.18)
  utils.ts                      cn() shadcn (sudah ada)
db/
  schema.ts                     Drizzle: tabel dan kolom beku 6.2, FK aktif, indeks hot-path (AC-DB-01)
  client.ts                     libSQL: TURSO_* di production, file:./dev.db di dev/test
  migrate.ts                    jalur migrasi drizzle-kit dari nol
components/
  ui/                           primitives shadcn (button sudah ada)
  member/  gov/  landing/  subjek/   komponen per surface (token surface masing-masing)
styles/tokens/
  mobile.css  dashboard.css  landing.css  subjek.css   port VERBATIM dari bundle (AC-UI-01)
scripts/
  seed/index.ts                 seed deterministik 6.7/6.7b (idempoten) + precompute audit_run seed
  seed/verify.ts                checksum + timing -> seed-verify.json (AC-SEED-01, AC-DEMO-02)
  fixtures/temuan-seed.ts       teks temuan beku AN-1..AN-6 (SUDAH DITULIS Phase 0, milik verifikasi)
  demo-hash.ts  perf-api.ts  audit-bench.ts  ci-clean.sh
  check-register.mjs  scan-secrets.mjs  check-readme.mjs  check-keputusan.mjs  check-env-example.mjs  check-tokens.mjs
tests/          suite milik verification workflow (fase 0/3-7); unit test modul co-located di lib/db/app
e2e/            spec Playwright milik verification workflow
deck/  deliverables/  docs/
```

Catatan penamaan: route group `(publik)` memuat `/`, `/login`, `/daftar`; template literal `app/(member)/...` mengikuti peta CLAUDE.md. Grup tidak mengubah URL.

## 2. Pemetaan kontrak 6.1 sampai 6.19 ke file implementasi

| Kontrak  | Isi                                                         | File implementasi                                                                                                 |
| -------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 6.1      | Tipe domain Zod + aturan warna                              | lib/contracts.ts; aturan warna di lib/audit/verdict.ts (server-side menang)                                       |
| 6.2      | Skema DB nama beku + invariant paginasi                     | db/schema.ts; paginasi di route handlers + query agregat                                                          |
| 6.3      | API envelope + 19 endpoint + role guard + redirect per role | app/api/**/route.ts; helper lib/api.ts; lib/auth.ts                                                               |
| 6.3b     | Tipe response gabungan + kategori arus kanonik              | lib/contracts.ts (bagian API); mapping kategori di lib/audit/snapshot.ts dan route flow                           |
| 6.4      | Kontrak LLM (chatJSON, runAudit, cache, polling, sesi)      | lib/llm.ts; lib/audit/index.ts; lib/auth.ts (cookie 6.4)                                                          |
| 6.5      | Validator bahasa sebelum persist                            | lib/registerGuard.ts, dipanggil di lib/audit/index.ts jalur persist                                               |
| 6.6      | Tipologi per agen                                           | lib/prompts/*.ts (deteksi) + scripts/seed (bahan) + tests                                                         |
| 6.7/6.7b | Seed sintetis + distribusi beku                             | scripts/seed/index.ts + scripts/fixtures/temuan-seed.ts                                                           |
| 6.8      | Register copy                                               | lib/copy.ts (satu permukaan) + scripts/check-register.mjs + hook PostToolUse                                      |
| 6.9      | Prompt kanonik per agen                                     | lib/prompts/*.ts                                                                                                  |
| 6.10     | Rute dan binding layar                                      | app/ sesuai peta folder di atas                                                                                   |
| 6.11     | Deck 12 slide H1 beku                                       | deck/pramana-deck.md (Phase 8)                                                                                    |
| 6.12     | README + DISCLOSURE-AI.md kanonik                           | README.md, DISCLOSURE-AI.md (Phase 8)                                                                             |
| 6.13     | .claude/ foundation                                         | .claude/settings.json + hooks (SUDAH AKTIF, probe lulus)                                                          |
| 6.14     | Manifest evidence + progress + commit grammar               | .crown/evidence/manifest-gate-N.json; ditulis main thread via marker gate                                         |
| 6.15     | Copy kanonik beku                                           | lib/copy.ts (verbatim)                                                                                            |
| 6.16     | Kontrak env                                                 | .env.example (SUDAH DITULIS, verbatim); lib/env.ts                                                                |
| 6.17     | Skrip video                                                 | deliverables/video-script.md (Phase 8)                                                                            |
| 6.18     | Script package.json nama beku + catatan health/rate-limit   | package.json (SUDAH DITULIS, 20 nama beku + check:tokens per F-05); lib/rateLimit.ts; app/api/health/route.ts     |
| 6.19     | Kontrak porting design handoff                              | styles/tokens/*.css (4 namespace verbatim) + components/{landing,member,gov,subjek} + .crown/design-deviations.md |

## 3. Alur data (teks)

Request masuk -> route handler `app/api/*` -> validasi input Zod (lib/contracts) di boundary -> cek sesi + role (lib/auth, deny-by-default) -> query Drizzle (db/) berbatas (LIMIT, agregasi SQL) -> respons envelope (lib/api) -> UI RSC/client membaca melalui fetch per binding 6.10 -> komponen per surface merender dengan token surface itu saja.

Jalur audit: POST /api/gov/audit/run -> lib/audit membangun snapshot 6.9 dari DB terkini (termasuk entri konsol subjek) -> 4 panggilan forensik paralel (Promise.allSettled, lib/llm.chatJSON, non-streaming) -> kumpul temuan sukses -> registerGuard pass pertama memvalidasi temuan forensik per 6.5 (retry korektif satu kali, drop bila tetap melanggar) sehingga adjudikator hanya menerima temuan tervalidasi (6.9) -> adjudikator menghapus duplikasi, menulis ulang register, dan mengurutkan -> registerGuard pass kedua pada teks HASIL TULIS ULANG adjudikator (6.5 "validator sebelum persist"; retry korektif satu kali ke adjudikator, temuan yang tetap melanggar didrop dan dicatat) -> lib/audit/verdict.ts menghitung ulang warna per aturan 6.1 pada himpunan temuan FINAL pasca-drop (usulan adjudikator hanya usulan; penyimpangan dicatat rawJson.metadata) -> persist audit_run + temuan (source="live") -> polling GET /api/audit/:id/status tiap 2 detik, klien menyerah 120 detik -> gagal: API mengembalikan run cache terakhir source="cache" + banner.cache; LLM_UNAVAILABLE hanya bila cache pun tidak ada.

Jalur demo (DEMO_MODE=true, default): UI membaca audit_run source="seed" hasil precompute seed; tidak ada panggilan model pada alur juri.

## 4. Invariant dan titik penegakan

| Invariant                                                                           | Titik penegakan                                                             | Verifikasi                       |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------- |
| Daftar transaksi paginated max 50; agregasi via SQL, bukan load-all                 | route handlers (LIMIT 50) + query agregat di lib/audit/snapshot.ts dan flow | AC-PERF-03 (fixture 5.000 baris) |
| Warna verdict dihitung server-side, adjudikator hanya usulan                        | lib/audit/verdict.ts setelah adjudikator, sebelum persist                   | AC-LLM-03 (fixture adversarial)  |
| Register 6.5/6.8 pada output model sebelum persist                                  | lib/registerGuard.ts di lib/audit persist path                              | AC-REG-01/02                     |
| Register copy UI (Anda, tanpa em dash, tanpa emoji, tanpa jargon layar anggota)     | lib/copy.ts terpusat + scripts/check-register.mjs + hook PostToolUse        | AC-COPY-01..03                   |
| DEMO_MODE default true; kegagalan model jatuh ke cache, tanpa provider kedua        | lib/env.ts + lib/llm.ts + lib/audit                                         | AC-DEMO-01..03, AC-LLM-05        |
| Envelope error beku 6 kode                                                          | lib/api.ts (satu-satunya cara route menjawab)                               | matrix supertest AC-SEC-01/02    |
| Role deny-by-default; subjek hanya pengurus                                         | lib/auth.ts requireRole dipanggil setiap route non-publik                   | AC-SEC-02, AC-SUBJ-03            |
| Dilarang hard-code warna; token per surface, empat namespace terpisah               | styles/tokens/*.css + scripts/check-tokens.mjs                              | AC-UI-01                         |
| Verdict = bentuk + label, bukan warna saja                                          | komponen verdict per surface (clip-path CSS per bundle)                     | AC-UI-02, AC-A11Y-01             |
| SESSION_SECRET kosong di production = boot gagal dengan pesan jelas                 | lib/env.ts fail-fast                                                        | AC-CFG-01                        |
| Sesi cookie httpOnly, secure production, sameSite lax, 7 hari, nama pramana_session | lib/auth.ts konfigurasi iron-session                                        | AC-SEC-06                        |
| Angka nasional hanya dari lib/facts.ts dengan sumber+tanggal                        | lib/facts.ts; landing dan deck mengimpornya                                 | AC-E2E-06                        |

## 5. Rencana partisi final (terhadap tabel pra-partisi section 9)

Diadopsi apa adanya, dengan penegasan batas kepemilikan file agar wave 2 bebas konflik merge:

| Unit                                     | Milik                                                                                                                                                         | Wave | Review        | Budget |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------- | ------ |
| a. data layer + seed + fixtures          | db/**, scripts/seed/**; MEMBACA scripts/fixtures/temuan-seed.ts (beku)                                                                                        | 1    | adversarial   | ~120k  |
| b. llm + audit + registerGuard + prompts | lib/llm.ts, lib/audit/**, lib/prompts/**, lib/registerGuard.ts, lib/contracts.ts, lib/copy.ts, lib/facts.ts                                                   | 1    | adversarial   | ~140k  |
| f. deliverables engine skeleton          | deck/ skeleton, scripts/check-*.mjs, scripts/demo-hash.ts, deliverables/ skeleton                                                                             | 1    | single-pass   | ~80k   |
| g. UI landing (port)                     | app/(publik)/page.tsx + layout.tsx, components/landing/**, styles/tokens/landing.css                                                                          | 1    | single-pass   | ~60k   |
| c. auth + API routes                     | lib/auth.ts, lib/api.ts, lib/env.ts, lib/logger.ts, lib/rateLimit.ts, app/api/**                                                                              | 2    | adversarial   | ~120k  |
| d. UI anggota (port) + PWA shell         | app/(member)/**, app/(publik)/login/** + daftar/** (nested layout, token mobile + varian F-09), components/member/**, styles/tokens/mobile.css, manifest + SW | 2    | single + spot | ~160k  |
| e. UI pemerintah (port)                  | app/(gov)/**, components/gov/**, styles/tokens/dashboard.css                                                                                                  | 2    | single + spot | ~100k  |
| h. UI konsol subjek (port)               | app/(subjek)/**, components/subjek/**, styles/tokens/subjek.css                                                                                               | 2    | single + spot | ~80k   |

Ketergantungan topologis: a sebelum c; b paralel a (b memiliki lib/contracts.ts yang dirujuk a untuk tipe; a memakai tipe DB Drizzle sendiri sehingga tidak saling tulis); c sebelum d/e/h (kontrak-stub boleh); g independen. lib/contracts.ts ditulis SEKALI oleh b pada awal wave 1 persis verbatim 6.1+6.3b sehingga konsumen lain hanya membaca. Kepemilikan file eksklusif per unit di atas adalah aturan merge: dua unit tidak pernah menulis file yang sama; integrasi lintas unit terjadi di Phase 2 oleh orchestrator.

Catatan dependensi: SEMUA dependency npm sudah dipasang pada Phase 0 (lihat bagian 6). Worker dilarang menjalankan pnpm add; kebutuhan dependency baru = surface ke orchestrator.

## 6. Library terpilih (latitude, satu baris alasan)

- next 16.2.10 + react 19.2.7: ADR-01, terkunci.
- typescript 5.9.3 (pin, bukan 7.x): kompatibilitas penuh typescript-eslint dan toolchain; TS7 native belum didukung rantai lint.
- eslint 9.39.4 (pin, bukan 10): rentang peer eslint-config-next dan plugin ekosistem.
- tailwindcss 4.3.2 + @tailwindcss/postcss: ADR-01; token bundle adalah CSS custom properties, cocok dengan @theme Tailwind v4.
- shadcn (CLI 4.13, @base-ui/react): ADR-01; primitives dipakai selektif, styling selalu dari token surface.
- drizzle-orm 0.45 + drizzle-kit 0.31 + @libsql/client 0.17: ADR-04; skema 6.2, FK aktif, EXPLAIN QUERY PLAN (AC-DB-01).
- zod 4.4: kontrak 6.1 verbatim; validasi boundary.
- iron-session 8: sesi cookie tersandatangani stateless per 6.4; tanpa OAuth (ADR-05).
- bcryptjs 3: hash bcrypt murni JS, nol binary native di serverless (AC-SEC-06).
- ulid 3: id temuan per 6.1.
- Font via next/font/google per surface: Geist (mobile), Archivo + Public Sans (dashboard), Plus Jakarta Sans + JetBrains Mono (landing), Spline Sans + Spline Sans Mono (subjek); self-hosted saat build, tanpa request runtime ke Google.
- TANPA chart library: seluruh grafik (bar kas, tren, diagram cara kerja) adalah CSS/markup persis seperti bundle; dependency chart = downgrade fidelity + beban bundle (AC-PERF-02).
- Logger: tulis tangan lib/logger.ts (JSON, level, requestId), sekitar 30 baris; pino berlebihan untuk kebutuhan AC-OBS-01.
- Rate limit: tulis tangan sliding window in-memory per catatan 6.18; keterbatasan serverless dicatat di Report.
- PWA: manifest tulis tangan + service worker minimal (shell + halaman terakhir, F14); next-pwa tidak dipakai (tidak selaras App Router terkini).
- @marp-team/marp-cli: dipasang Phase 8 saat deck dibangun (defer dependency berat).

## 7. Evaluasi ulang adversarial ADR-01..13

Hasil lengkap dengan alternatif dan alasan penolakan ada di docs/keputusan-teknis.md (dokumen pertahanan juri, AC-DEL-08). Ringkas: seluruh 13 ADR bertahan terhadap alternatif material (Python/FastAPI, Go, Postgres/Neon, NextAuth, provider LLM kedua, chart library, create-next-app); tidak ada yang perlu eskalasi stop-and-ask. Dua pin versi (TS 5.9, ESLint 9) adalah keputusan implementasi di dalam ADR-01, dicatat di sana.

## 8. Status penegakan fondasi (bukti Phase 0)

- Hooks aktif: probe 4 vektor ditolak (settings deny file tools; deny-guard bash; allowlist bash worker); bukti .crown/evidence/gate-0/hooks-probe.json.
- Bundle: 4/4 terverifikasi dan terinventaris (.crown/design-inventory.md); flags F-01..F-08 direkonsiliasi di .crown/notes.md.
- Scaffold: build, typecheck, lint, test hijau lokal; /api/health hidup.
- Fixture beku scripts/fixtures/temuan-seed.ts ditulis pada fase 0 (jendela tulis verifikasi) agar terkunci sebelum Phase 1.
