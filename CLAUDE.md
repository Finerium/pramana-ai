# Pramana AI — panduan kerja repo

Pengawas tata kelola koperasi desa berbasis AI multi-agent. Next.js 16 App Router, React 19, TS strict, Tailwind v4, shadcn/ui, Drizzle + libSQL (Turso prod, SQLite dev), Vitest, Playwright, deploy Vercel.

## WAJIB BACA sebelum menulis kode
- `blueprint-pramana-ai.md` **section 6** (kontrak BEKU: tipe, skema DB, API, prompt, copy, env, scripts, porting) dan **section 8** (acceptance matrix = definisi selesai).
- `.crown/design-inventory.md` — peta empat bundle desain; `design-handoff/` adalah kebenaran visual (read-only, PORT jangan redesign, nol downgrade per 6.19).
- `.crown/notes.md` — flags rekonsiliasi (F-01..F-08) yang sudah diputuskan.

## Perintah kerja
- `pnpm dev` · `pnpm build` · `pnpm start`
- `pnpm typecheck` · `pnpm lint` · `pnpm lint:fix` · `pnpm test` · `pnpm e2e`
- `pnpm seed` (idempoten, deterministik) · `pnpm seed:verify` · `pnpm demo:hash`
- `pnpm deck:build` · `pnpm perf:api` · `pnpm audit:bench` · `pnpm ci:clean`
- `pnpm check-register` · `pnpm scan-secrets` · `pnpm check-readme` · `pnpm check-keputusan` · `pnpm check-env` · `pnpm check:tokens`

## Peta modul
- `lib/contracts.ts` — SATU-SATUNYA sumber tipe domain (Zod, 6.1 + 6.3b verbatim).
- `lib/llm.ts` — klien OpenAI-compatible MiniMax; chatJSON (Zod, retry-1, LLMUnavailable); TANPA provider fallback (cache satu-satunya jaring).
- `lib/audit/` — runAudit: 4 forensik paralel (allSettled) + adjudikator; warna dihitung ulang server-side (6.1 menang).
- `lib/prompts/` — prompt Bahasa Indonesia per agen (6.9); output JSON-only.
- `lib/registerGuard.ts` — validator 6.5 sebelum persist (denylist vonis + pola edukatif; pertanyaan_rat diakhiri "?").
- `lib/copy.ts` — SEMUA string UI (6.15 verbatim + label per-surface); `lib/facts.ts` — angka nasional + sumber+tanggal.
- `db/` — Drizzle schema (nama tabel/kolom beku 6.2), FK aktif, indeks hot-path.
- `app/(publik)` landing `/`; `app/(member)` /beranda /uang /arus /suara + /login /daftar; `app/(gov)` /pemerintah[/koperasi/[id]]; `app/(subjek)` /pembukuan; `app/api/*` route handlers 6.3 (envelope {ok,...}, error code beku).
- `scripts/seed/` — seed 6.7/6.7b; `scripts/fixtures/temuan-seed.ts` — teks temuan beku (BUKAN hasil LLM).
- `deck/` Marp; `deliverables/`; `docs/keputusan-teknis.md`.

## Aturan keras
1. Kontrak section 6 beku. Perubahan = stop-and-ask, bukan improvisasi.
2. Register copy (6.8): sapaan "Anda", TANPA em dash, TANPA emoji, layar anggota tanpa jargon (likuiditas/rasio/aktiva/NPL/CAR). Ditegakkan hook + check-register; pelanggaran = gate failure.
3. Pramana bertanya, tidak menuduh (6.5): denylist kosakata vonis pada output model; pertanyaan_rat wajib kalimat tanya.
4. Verdict = bentuk + label, tidak pernah warna saja. Warna verdict server-side dari aturan 6.1.
5. DILARANG hard-code warna di komponen; hanya token per-surface (empat namespace, jangan disatukan).
6. Query berbatas: daftar transaksi paginated max 50; agregasi via SQL, bukan load-all (AC-PERF-03).
7. DEMO_MODE=true default: alur juri 100 persen dari data seed; kegagalan model jatuh ke cache + banner.cache.
8. Worker/subagent DILARANG menulis: `.claude/`, `.git/`, `.env*`, `tests/`, `e2e/`, `scripts/fixtures/`, `design-handoff/`, `.crown/evidence/`, `.crown/progress.json`. Butuh perubahan di sana = salah paham tugas; surface, jangan edit.
9. Out of scope keras (2.2): panel manajemen pengurus, integrasi SIMKOPDES live, verifikasi Dukcapil nyata, push notif/SMS/WA, pembayaran nyata, multi-bahasa, on-premise, native app, admin CRUD UI, perubahan konsep produk.
10. Error envelope: sukses `{ok:true,data}`; gagal `{ok:false,error:{code,message}}`, code ∈ {UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION, LLM_UNAVAILABLE, INTERNAL}.

## Akun uji (seed, boleh dicetak — bukan rahasia)
juri.anggota@pramana.id / PramanaJuri2026 · juri.pemerintah@pramana.id / PramanaJuri2026 · sari@pramana.id / SariSukamaju1 · bendahara@pramana.id / PramanaBendahara2026
