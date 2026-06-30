// Deterministic, seeded pseudo-random number generator (mulberry32) plus
// sampling helpers. Seeding everything from a fixed seed makes the entire
// synthetic dataset — and therefore the demo — fully reproducible.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private next: () => number;

  constructor(seed: number) {
    this.next = mulberry32(seed);
  }

  /** Uniform float in [min, max). */
  float(min = 0, max = 1): number {
    return min + (max - min) * this.next();
  }

  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }

  /** Bernoulli trial — true with probability p. */
  bool(p = 0.5): boolean {
    return this.next() < p;
  }

  /** 1 with probability p, else 0. */
  bernoulli(p: number): 0 | 1 {
    return this.next() < p ? 1 : 0;
  }

  /** Pick a random element from a non-empty array. */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Standard-normal sample (Box–Muller), scaled to mean/sd. */
  normal(mean = 0, sd = 1): number {
    const u = Math.max(this.next(), 1e-9);
    const v = this.next();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + sd * z;
  }

  /** Log-normal sample with a given median and log-space sigma. */
  lognormal(median: number, sigma: number): number {
    return median * Math.exp(this.normal(0, sigma));
  }

  /** Clamp helper. */
  static clamp(x: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, x));
  }
}
