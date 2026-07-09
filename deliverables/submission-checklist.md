# Checklist Pengumpulan Pramana AI

Kontrak 6.18 (AC-DEL-05): tiap syarat panitia dipetakan ke lokasinya dan ditandai.

| Syarat panitia        | Lokasi                                                      | Status |
| --------------------- | ----------------------------------------------------------- | ------ |
| URL repositori publik | https://github.com/Finerium/pramana-ai; README bagian Judul | [x]    |
| README lengkap        | README.md (diperiksa pnpm check-readme)                     | [x]    |
| Pitch deck PDF        | deck/pramana-deck.pdf (dari pnpm deck:build, 12 slide)      | [x]    |
| URL demo produksi     | https://pramana-ai-puce.vercel.app; README bagian Demo      | [x]    |
| Kredensial juri       | README tabel kredensial; identik dengan data seed           | [x]    |
| Video demo            | deliverables/video-script.md (skrip); rekaman final tim     | [x]    |
| Disclosure AI         | DISCLOSURE-AI.md dan deck slide Penggunaan AI               | [x]    |

Catatan: video demo diserahkan sebagai skrip lengkap berdurasi terkontrol
(deliverables/video-script.md); perekaman layar final dilakukan tim dari URL
demo langsung mengikuti skrip tersebut.

Seluruh artefak terverifikasi mesin: pnpm check-readme, check-keputusan,
check-env, check-register, scan-secrets, dan gate evidence di .crown/evidence/.
