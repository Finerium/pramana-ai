#!/usr/bin/env bash
# scripts/ci-clean.sh (pnpm ci:clean) - AC-CFG-02.
# Reproducible clean-checkout gate: install --frozen-lockfile, build, test, and a
# smoke e2e run inside a throwaway git worktree cut from HEAD, then tear it down.
# Playwright smoke is skipped with a clear note when browsers are not installed.
# Writes ci-clean.log and exits non-zero if any required step fails.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel)"
LOG="$ROOT/ci-clean.log"
WT="${TMPDIR:-/tmp}/pramana-ci-clean-$$-$(date +%s)"

: >"$LOG"
say() { echo "$@" | tee -a "$LOG"; }

cleanup() {
  git -C "$ROOT" worktree remove --force "$WT" >/dev/null 2>&1 || true
  rm -rf "$WT" >/dev/null 2>&1 || true
}
trap cleanup EXIT

say "ci-clean: menyiapkan worktree bersih dari HEAD -> $WT"
if ! git -C "$ROOT" worktree add --detach "$WT" HEAD >>"$LOG" 2>&1; then
  say "GAGAL: git worktree add"
  exit 1
fi

cd "$WT" || { say "GAGAL: cd worktree"; exit 1; }

rc=0
step() {
  local name="$1"
  shift
  say "== $name =="
  if "$@" >>"$LOG" 2>&1; then
    say "OK: $name"
  else
    say "GAGAL: $name"
    rc=1
  fi
}

step "install (frozen-lockfile)" pnpm install --frozen-lockfile --prefer-offline
step "build" pnpm build
step "test" pnpm test

say "== e2e smoke =="
BROWSERS="${PLAYWRIGHT_BROWSERS_PATH:-}"
if [ -n "$BROWSERS" ] && [ -d "$BROWSERS" ]; then
  HAVE_BROWSERS=1
elif [ -d "$HOME/Library/Caches/ms-playwright" ] || [ -d "$HOME/.cache/ms-playwright" ]; then
  HAVE_BROWSERS=1
else
  HAVE_BROWSERS=0
fi
if [ "$HAVE_BROWSERS" = "1" ]; then
  if pnpm e2e --grep @smoke >>"$LOG" 2>&1; then
    say "OK: e2e smoke"
  else
    say "GAGAL: e2e smoke"
    rc=1
  fi
else
  say "LEWATI: e2e smoke (browser Playwright belum terpasang; jalankan npx playwright install)"
fi

say "ci-clean: selesai rc=$rc. Ringkasan penuh di $LOG"
exit "$rc"
