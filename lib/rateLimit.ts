/**
 * Rate limit login sederhana (AC-SEC-07, catatan 6.18): sliding window in-memory
 * per IP. Lima kegagalan dalam 60 detik membuat permintaan ke-6 ditolak (429).
 * ponytail: in-memory PER INSTANCE; di serverless tiap instance punya map
 * sendiri sehingga batas efektif melonggar saat scale-out. Cukup untuk kelas
 * demo; upgrade = store bersama (mis. Redis/Upstash) berkunci per IP.
 */
const WINDOW_MS = 60_000;
const LIMIT = 5;

const hits = new Map<string, number[]>();

function recent(ip: string, now: number): number[] {
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.set(ip, arr);
  return arr;
}

/** true bila IP sudah mencapai batas gagal dalam window (blokir permintaan ke-6). */
export function tooManyLogins(ip: string, now: number = Date.now()): boolean {
  return recent(ip, now).length >= LIMIT;
}

/** Catat satu kegagalan login untuk IP. */
export function recordLoginFailure(ip: string, now: number = Date.now()): void {
  const arr = recent(ip, now);
  arr.push(now);
  hits.set(ip, arr);
}

/** Reset seluruh state (khusus test). */
export function resetRateLimit(): void {
  hits.clear();
}

/** IP klien dari header proxy; fallback "unknown". */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
