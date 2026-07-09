/**
 * Resolusi env 6.16. DEMO_MODE default "true". SESSION_SECRET minimal 32
 * karakter; kosong/pendek di production = fail-fast dengan pesan jelas
 * (dievaluasi saat dipakai, bukan saat import, agar `next build` tidak butuh
 * secret). ponytail: fail-fast di titik pakai (request), bukan boot import;
 * upgrade ke validasi boot terpisah bila ada proses long-running non-build.
 */

/** Kesalahan konfigurasi lingkungan; pesannya aman untuk dilog (tanpa PII). */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

// Secret dev/test tetap (minimal 32 char). BUKAN production (di sana wajib asli).
const DEV_SECRET = "pramana-dev-session-secret-000000000000";
const MIN_LEN = 32;

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function demoMode(): boolean {
  return (process.env.DEMO_MODE ?? "true") === "true";
}

export function hasLlmKey(): boolean {
  return (process.env.LLM_API_KEY ?? "").length !== 0;
}

/**
 * SESSION_SECRET terselesaikan. Production: wajib minimal 32 char, selain itu
 * throw ConfigError (fail-fast, pesan jelas). Non-production: pakai env bila
 * cukup panjang, tolak bila diisi tapi terlalu pendek, jatuh ke DEV_SECRET bila
 * kosong.
 */
export function sessionSecret(): string {
  const s = process.env.SESSION_SECRET ?? "";
  if (isProduction()) {
    if (s.length < MIN_LEN) {
      throw new ConfigError(
        "SESSION_SECRET wajib diisi minimal 32 karakter di lingkungan production.",
      );
    }
    return s;
  }
  if (s.length === 0) return DEV_SECRET;
  if (s.length < MIN_LEN) {
    throw new ConfigError(
      "SESSION_SECRET terlalu pendek; minimal 32 karakter.",
    );
  }
  return s;
}
