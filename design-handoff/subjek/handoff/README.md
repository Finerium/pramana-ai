# Konsol Simulasi Pembukuan (Subjek) — Handoff

Surface 4 of 4 for Pramana AI. This is the **cooperative's own bookkeeping system**, the data source that Pramana watches. It is **not** part of Pramana's product for the board. The demo job: the treasurer (bendahara Budi Santoso) records a suspicious entry here, and the AI catches it live on the government and member surfaces.

Header copy is locked and verbatim: title **"Simulasi Pembukuan Koperasi"**, subtitle **"Sumber data yang diawasi Pramana"**.

- **Route:** `/pembukuan` · **Role:** `pengurus` (deny-by-default for anggota/pemerintah)
- **Canvas:** desktop 1440, layout holds from 1024
- **Themes:** light + dark, token-based (see `tokens.css`)
- **Source of truth for behaviour:** `blueprint-pramana-ai.md` §6.3 (API), §6.15 (copy), §6.19 (fidelity)

---

## 1. Locked stack (do not relitigate — ADR-01)

| Concern | Choice |
|---|---|
| Framework | **Next.js 16**, App Router, React 19, TypeScript strict |
| Styling | **Tailwind v4** (`@theme inline`), tokens from `tokens.css` |
| Components | **shadcn/ui** |
| Forms | Real forms. Post to app APIs at implementation; keep the validation states shown here |
| Locale | Bahasa Indonesia only |

Forms map to the frozen API contract (§6.3), envelope `{ ok, data | error }`:

| Form | Endpoint | Input type (§6.3b) |
|---|---|---|
| Catat Transaksi | `POST /api/subjek/transaksi` | `SubjekTransaksiInput` → `{ transaksiId, saldoKasBaru }` |
| Persetujuan Pinjaman | `POST /api/subjek/pinjaman` | `SubjekPinjamanInput` → `{ pinjamanId }` |
| Status RAT | `POST /api/subjek/rat` | `{ status, tanggal? }` → `{ ratStatus }` |
| Daftar entri + saldo | `GET /api/subjek/recent` | `{ saldoKas, transaksi[10], pinjaman[5], ratStatus }` |
| Login | `POST /api/auth/login` | `{ email, password }` → `{ role, redirectTo }` |

---

## 2. Design tokens — RULE: no hard-coded color

All color, radius, and font values live in **`tokens.css`** as OKLCH custom properties under `:root` and `.dark`, re-exposed to Tailwind via `@theme inline`. In components use only token utilities (`bg-surface`, `text-ink`, `border-border`, `bg-primary`, `text-on-primary`, `font-mono`, `rounded-card`...). **Never** write a hex, rgb, or literal oklch in a component.

- **Identity:** Merah Putih — one confident red (`--color-primary`) on clean white/paper neutrals. Restrained, not a flag banner.
- **Verdict colors are absent here.** Hijau/kuning/merah belong to Pramana's surfaces. This console's only status colors are **sync** (`--color-sync`, connected/synced) and **pending** (`--color-pending`, awaiting sync), plus **danger** (`--color-danger`) for form validation.
- Dark theme is a full sibling set, not a filter. Toggle by adding/removing `.dark` on `<html>`.

### Typography (Google Fonts)

- **Spline Sans** — UI, labels, body (`--font-sans`)
- **Spline Sans Mono** — all money figures and dates, with `font-variant-numeric: tabular-nums` (`--font-mono`)

Money format is fixed: `Rp 15.000.000` (id-ID grouping, space after `Rp`). Amount inputs accept **raw digits without dots**; a live echo shows the parsed value ("Terbaca: Rp 15.000.000").

---

## 3. Screens & states

Per-state reference renders are in `../screenshots/` (light and dark).

States covered: **default · memuat (loading) · sukses inline · gagal validasi · kosong (empty)**.

- `konsol-default` — console, forms empty, list seeded
- `konsol-validasi` — inline field errors (submit with empty required fields)
- `konsol-preset` — a preset has filled the form; quiet note explains what it demonstrates
- `konsol-memuat` — submit in progress (button spinner, disabled)
- `konsol-sukses` — inline success + saldo kas updated + new entry prepended
- `konsol-dark` — dark theme
- `daftar-terisi` / `daftar-kosong` — recent-entries list and its empty state
- `login-default` / `login-error` — login with test-account hint box and error state

---

## 4. Form field inventory (every field + type)

### Catat Transaksi → `SubjekTransaksiInput`

| Field | Control | Type / values | Required |
|---|---|---|---|
| `jenis` | select | enum: `pembelian`, `penjualan`, `setoran_simpanan`, `penarikan_simpanan`, `pencairan_pinjaman`, `angsuran`, `gaji`, `operasional` (default `pembelian`) | yes |
| `jumlah` | text (numeric) | integer rupiah, raw digits, `> 0` | yes |
| `tanggal` | date | ISO `yyyy-mm-dd` | yes |
| `unitUsahaId` | select | enum: `sembako`, `simpan_pinjam`, `apotek`, `gudang` | yes when `jenis = pembelian` |
| `vendorNama` | text | string | yes when `jenis = pembelian` (field shown only then) |
| `vendorAlamat` | text | string | yes when `jenis = pembelian` (field shown only then) |
| `anggotaId` | select | member id | optional |
| `deskripsi` | textarea | string | yes |

`arah` (masuk/keluar) is derived from `jenis` and drives the live saldo kas: masuk = setoran_simpanan, penjualan, angsuran; keluar = pembelian, penarikan_simpanan, pencairan_pinjaman, gaji, operasional.

### Persetujuan Pinjaman → `SubjekPinjamanInput`

| Field | Control | Type / values | Required |
|---|---|---|---|
| `anggotaId` | select | member id | yes |
| `disetujuiOleh` | select | jabatan enum: `ketua`, `wakil`, `sekretaris`, `bendahara`, `pengawas` | yes |
| `pokok` | text (numeric) | integer rupiah, `> 0` | yes |
| `cicilanBulanan` | text (numeric) | integer rupiah, `> 0` | yes |
| `jatuhTempoBerikut` | date | ISO date | yes |
| `dokumenLengkap` | toggle | boolean (default `false`) | — |

Policy plafon per anggota = Rp 10.000.000 (synthetic cooperative policy, not a regulation claim). Over-plafon + `dokumenLengkap = false` is what Pramana's kepatuhan agent can flag.

### Status RAT → `{ status, tanggal? }`

| Field | Control | Type / values | Required |
|---|---|---|---|
| `status` | toggle | enum: `belum`, `terlaksana` | yes |
| `tanggal` | date | ISO date | yes when `status = terlaksana` |

### Login → `POST /api/auth/login`

| Field | Control | Type | Required |
|---|---|---|---|
| `email` | email | string | yes |
| `password` | password | string | yes |

Test account (hint box + autofill): `bendahara@pramana.id` / `PramanaBendahara2026`. On error: `login.err` = "Email atau kata sandi belum tepat. Silakan coba lagi." (§6.15).

---

## 5. Behaviour notes

- **Saldo kas is always visible** in the header and updates after each recorded transaction (by `arah`). A brief highlight marks the change.
- **Sync loop:** a new entry appears as "Menunggu sinkron" (pending) then flips to "Tersinkron" (synced) — the visible seam of data flowing into Pramana. Header carries the locked `subjek.sync` chip "Tersinkron ke Pramana".
- **Presets fill, never submit** (§U12). Four buttons with locked labels; a filled preset shows a quiet note of what it demonstrates. They map one-per-agent to typology §6.6:
  1. "Isi contoh: pembelian ke alamat pengurus" — konflik kepentingan (vendor address == pengurus address; seeds AN-1: Toko Berkah Rp 15.000.000, Jl. Melati No. 12)
  2. "Isi contoh: pemecahan pembelian" — anomali transaksi (split purchase < Rp 5.000.000)
  3. "Isi contoh: pinjaman lampaui plafon tanpa dokumen" — kepatuhan proses (fills the loan form)
  4. "Isi contoh: pengeluaran menguras kas" — kesehatan finansial (large outflow)
- **Empty state** (`kosong`) is defined for both transaksi and pinjaman lists.

---

## 6. Copy register (§6.8) & accessibility

- Bahasa Indonesia, sapaan **"Anda"**, **no em dash**, **no emoji**. Validation messages in plain language. Header/subtitle/sync/preset labels are verbatim-locked; do not rewrite.
- WCAG **AA**: text ≥ 4.5:1, UI ≥ 3:1. Visible keyboard focus via `:focus-visible` (uses `--color-ring`). Touch targets ≥ 44px. `prefers-reduced-motion` disables transitions/spinner motion.
- All figures use tabular lining numerals (`font-variant-numeric: tabular-nums`).

---

## 7. Files

- `../Konsol Pembukuan.dc.html` — reference design (interactive, both themes, all states)
- `tokens.css` — OKLCH `:root` + `.dark` + Tailwind v4 `@theme inline`
- `../screenshots/` — per-state renders
