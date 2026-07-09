/**
 * RNG deterministik untuk seed (mulberry32). WAJIB dipakai alih-alih Math.random
 * agar seed idempoten + reproducible (6.7). Seed konstan diberikan pemanggil.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bilangan bulat inklusif [min, max]. */
export function intBetween(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pilih satu elemen deterministik. */
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/**
 * Pecah `total` menjadi `n` bagian bulat yang menjumlah PERSIS total, tiap bagian
 * >= minEach (positif). Deterministik lewat rng. Dipakai membagi total penjualan
 * bulanan (penyeimbang saldo) menjadi beberapa baris yang tampak wajar.
 */
export function splitAmount(
  rng: () => number,
  total: number,
  n: number,
  minEach = 1000,
): number[] {
  const parts: number[] = [];
  let remaining = total;
  for (let i = 0; i < n - 1; i++) {
    const slotsLeft = n - i;
    const avg = remaining / slotsLeft;
    const maxThis = remaining - minEach * (slotsLeft - 1);
    let v = Math.round(avg * (0.7 + 0.6 * rng()));
    v = Math.max(minEach, Math.min(v, maxThis));
    parts.push(v);
    remaining -= v;
  }
  parts.push(remaining);
  return parts;
}
