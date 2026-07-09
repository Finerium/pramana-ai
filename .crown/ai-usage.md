# Log Penggunaan AI per Fase — bahan DISCLOSURE-AI.md (C2)

Format: satu baris per fase; apa yang dibantu AI generatif.

- Pra-build: gagasan inti, arsitektur agen, tipologi, dan seluruh keputusan produk adalah karya asli Tim Daulat (terdokumentasi di blueprint-pramana-ai.md v1.0, locked 7 Juli 2026); Claude Design dipakai tim untuk memproduksi empat bundle desain visual di bawah arahan tim.
- Phase 0 (foundation): Claude Opus 4.8 via Claude Code — inventaris bundle desain, penulisan guard rails (.claude/), scaffold proyek, dokumen arsitektur implementasi, dan re-derivasi adversarial ADR sebagai draf docs/keputusan-teknis.md; seluruhnya menurut spesifikasi blueprint tim.
- Phase 0 (relaunch, penyelesaian): Claude Opus 4.8 via Claude Code — verifikasi probe guard rails, scaffold Next.js 16 + toolchain penuh, ekstraksi fixture temuan beku dari bundle desain, deploy skeleton ke Vercel, dan finalisasi dokumen arsitektur + keputusan teknis; review kontrak oleh subagen fresh-context.
- Phase 1 (build): Claude Opus 4.8 via Claude Code — implementer per modul di worktree terisolasi (data+seed, llm+audit+guard+prompts, auth+API, empat UI porting bundle, deliverables engine) dengan disiplin TDD; review dua tahap fresh-context (kepatuhan spek lalu kualitas) untuk tiap modul; seluruhnya menurut kontrak beku tim.
- Phase 2 (integrasi): Claude Opus 4.8 via Claude Code — wiring UI ke API nyata, varian login per persona, normalisasi bentuk respons, smoke tiga role.
- Phase 3 (verifikasi): Claude Opus 4.8 via Claude Code — penulisan suite e2e Playwright dengan mock LLM deterministik, grading fidelity visual empat permukaan terhadap screenshot bundle, loop perbaikan; MiniMax-M2.7 tidak dipakai pada jalur ini (mock deterministik).
- Phase 5-6 (perf, keamanan): Claude Opus 4.8 via Claude Code — bench performa, audit keamanan independen fresh-context, perbaikan temuan.
- Phase 7 (demo-proofing + UAT): Claude Opus 4.8 via Claude Code — self-UAT tiga persona mengoperasikan URL live seperti juri, menemukan dan menutup cacat; MiniMax-M2.7 sebagai runtime audit langsung (fallback cache saat kuota habis).
- Phase 8-9 (deliverables, deploy): Claude Opus 4.8 via Claude Code — README, deck, dokumentasi, deploy produksi, dan Report; MiniMax-M2.7 tetap sebagai mesin runtime produk pada purwarupa live.
