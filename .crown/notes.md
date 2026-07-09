# Orchestrator Notes — Pramana AI

## RESUME STATE (relaunch recon: baca ini duluan)
Phase 0 progress per 2026-07-09:
- DONE: recon (fresh) · 4 bundle verified+unzipped · blueprint 909 lines dibaca penuh · SEMUA token/README/prototype produksi 4 bundle dibaca penuh · design-inventory + flags F-01..F-08 ditulis · Task DAG gate 0-9 dibuat · .claude/ lengkap (settings + 5 hooks, unit test guard 8/8 PASS) · .crown/ init · git init + .gitignore · commit 33ffa09.
- BLOCKED-THEN-RESTARTED: hook wiring tidak bisa aktif mid-session (probe Write ke design-handoff tembus 3x, guard-invocations.log kosong, /hooks approval tidak propagate). Restart sesi = jalur aktivasi. SETELAH RESTART: (1) jalankan ulang PROBE (Write tool ke design-handoff/.probe → HARUS denied; cek .crown/guard-invocations.log terisi), (2) lanjut Phase 0 step 5: scaffold Next.js 16 + toolchain + frozen scripts 6.18 + /api/health + .env.example 6.16 → vercel link + deploy → step 6: architecture doc + adversarial ADR re-derivation → docs/keputusan-teknis.md → fresh reviewer → GATE 0 commit.
- Task DAG hidup di Claude Code Tasks (gate 0-9; #1 in_progress). Model rule: semua worker/subagent = Opus 4.8 max effort.

## Run log
- 2026-07-09: Phase 0 start. Fresh tree (no git, no checkpoints). 4 bundles verified OK + unzipped. Blueprint (909 lines) + semua token/README/prototype produksi dibaca penuh. Toolchain: node 25.6, pnpm 10.33, vercel=finerium, gh=Finerium, docker up.

## Reconciliation flags (design vs kontrak; kontrak menang untuk data, bundle menang untuk tampilan)
- F-01 Kas Mei: prototype mobile bar "47,2 jt"; kontrak 6.7b saldo akhir Mei = Rp 47.500.000. RESOLUSI: seed & UI pakai 47,5 jt (kontrak menang; data = kontrak). Chart bar tetap bentuk bundle.
- F-02 Tanggal "Tanggapan Pengurus" AN-2: mobile "24 JUNI 2026" vs dashboard "21 JUNI 2026". Kontrak tidak menetapkan. RESOLUSI: unify 24 Juni 2026 (precedence 6.19.6: mobile > landing > dashboard > subjek). Dicatat sebagai improvement di design-deviations.
- F-03 Label agen beda register per surface (mobile "Pemeriksa Transaksi/Kesehatan Keuangan..." vs dashboard "Anomali Transaksi/Kesehatan Finansial..."): DISENGAJA (register anggota vs gov), dua-duanya dipertahankan. Mapping ke AgentId enum 6.1 di lib/copy.ts (label per surface).
- F-04 Suara agregat: kontrak membekukan hanya AN-1=12. Prototype menampilkan AN-4=7, AN-2=5. RESOLUSI (latitude): seed pertanyaan_rat AN-4=7 anggota, AN-2=5 anggota agar UI == seed == bundle. IDs anggota deterministik.
- F-05 Script `check:tokens` dirujuk AC-UI-01 tapi tidak ada di daftar beku 6.18. RESOLUSI: tambahkan `check:tokens` ke package.json (bacaan paling defensible; 6.18 daftar minimum, AC butuh script itu).
- F-06 Verdict label copy ("Sehat"/"Perlu Perhatian"/"Perlu Dijelaskan") ada di prototype, README mobile menyebut "PLACEHOLDER menunggu kontrak copy". Kontrak 6.15 tidak memuat label ini. RESOLUSI: adopsi label prototype sebagai copy final di lib/copy.ts (satu-satunya sumber tertulis; konsisten mobile+landing chips "Hijau · Sehat" dst).
- F-07 Ringkasan verdict kuning/hijau di prototype mobile ("Ada beberapa hal..."/"Tidak ada hal...") ditandai README sebagai placeholder penulis. Dipakai hanya untuk live-run non-Sukamaju/hijau states; ringkasan merah Sukamaju TETAP fixture beku 6.7.
- F-08 Subjek anggotaOptions di prototype berisi 5 nama sampel (termasuk Budi Santoso yang pengurus). RESOLUSI: implementasi bind ke daftar anggota nyata dari DB (kontrak menang); visual select tetap.

## Latitude decisions (dicatat sambil jalan, konsolidasi ke docs/keputusan-teknis.md)
- L-01 Repo publik: commit design-handoff/ (oracle fixture AC-UI-01/02) + .crown/ (evidence+ai-usage, dirujuk DISCLOSURE); ignore .claude/ (R2), *.zip (redundan), prompt-orchestrator & env-prep (operator-internal), .crown/compact & worktrees (junk).
- L-02 Deny enforcement: PreToolUse hook match berbasis segmen path (berlaku juga di worktree), + Bash regex untuk redirect/rm/sed -i ke path terlindungi.
