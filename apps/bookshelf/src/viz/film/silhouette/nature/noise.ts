/**
 * Deterministic 1-D noise for terrain, drift and wobble (no Math.random).
 *
 *   noise1(x, seed)                  smooth value noise in [-1, 1]
 *   fbm1(x, seed, octaves?, gain?, lacunarity?)   fractal sum in about [-1, 1]
 *   ridged1(x, seed, octaves?)       ridged fbm in [0, 1] (sharp crests for mountains)
 */
import { hash01 } from '../architecture/common';

export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash01(i, seed) * 2 - 1;
  const b = hash01(i + 1, seed) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

export function fbm1(x: number, seed = 0, octaves = 5, gain = 0.5, lacunarity = 2.03): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise1(fx, seed + o * 101);
    norm += amp;
    amp *= gain;
    fx *= lacunarity;
  }
  return sum / norm;
}

export function ridged1(x: number, seed = 0, octaves = 5): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(noise1(fx, seed + o * 57));
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    fx *= 2.1;
  }
  return sum / norm;
}
