/**
 * neural-net-history — chapter 8 (ch08-s01 … ch08-s05) shared helpers, one animator's group.
 *
 *   huskyRGB(u, v)                 the husky photograph (one of ImageNet's thousand tiles) as a pure function of
 *                                  normalised (u, v) → [r, g, b] 0..1. Drawn, not sampled from any real photo.
 *   huskyCanvas(n, plane?)         an n × n pixel canvas of it (cached): plane 'rgb' | 'r' | 'g' | 'b' (one colour
 *                                  plane as a tinted tissue sheet). Draw it scaled with imageSmoothingEnabled=false
 *                                  for crisp pixels.
 *   huskyValue(n, i, j, plane)     the typed number of one pixel (0..1, 2 decimals)
 *   barCanvas(n)                   the Mark I eye's horizontal bar on a 20 × 20 retina (ch03), as cells
 *   tileArt(k, learned)            one 11 × 11 first-layer stencil tile: noise (learned = 0) → oriented stripe or
 *                                  colour blob (learned = 1); ILLUSTRATIVE (not the real AlexNet weights)
 *   LED_SCREEN                     where the green status LED sits on screen at the end of ch08-s02 and where
 *                                  the Mark I cell it dissolves into sits at the start of ch08-s03
 *   GREEN                          that LED's colour (the group's one saturated accent, motivated: a status LED)
 */
import { makeCanvas } from '../../../film/silhouette/atmosphere';
import { hash1 } from '../../../film/core/frame';

export { clamp01, sm, lerp, win, tq12 } from './ch02-s05b-util';
export { mixCam } from './ch03-s01-kit';

/** where ch08-s02's move leaves the lamp's circle on the tower window (and its green LED after the cut) */
export const LED_SCREEN = { x: 640, y: 340 } as const;
export const GREEN = '#9cf2a6';
export const GREEN_CORE = '#e2ffe4';

// ------------------------------------------------------------------------------------------------ noise
function vn2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const h = (i: number, j: number) => hash1(i * 7919 + j * 104729, seed);
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm2 = (x: number, y: number, seed: number) => 0.55 * vn2(x, y, seed) + 0.3 * vn2(x * 2.1, y * 2.1, seed + 7) + 0.15 * vn2(x * 4.3, y * 4.3, seed + 13);

// ------------------------------------------------------------------------------------------------ the husky
const sstep = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
/** signed "inside" of an ellipse: > 0 inside, soft edge of width w (normalised units) */
const ell = (u: number, v: number, cx: number, cy: number, rx: number, ry: number, w = 0.012) => {
  const d = Math.hypot((u - cx) / rx, (v - cy) / ry);
  return sstep(1 + w / Math.min(rx, ry), 1 - w / Math.min(rx, ry), d);
};
/** inside of a triangle (a, b, c), soft */
function tri(u: number, v: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number, w = 0.01) {
  const e = (px: number, py: number, qx: number, qy: number) => {
    const nx = qy - py, ny = px - qx;
    const L = Math.hypot(nx, ny);
    return ((u - px) * nx + (v - py) * ny) / L;
  };
  const s = Math.sign(e(ax, ay, bx, by) + e(bx, by, cx, cy) + e(cx, cy, ax, ay)) || 1;
  const d = Math.min(s * e(ax, ay, bx, by), s * e(bx, by, cx, cy), s * e(cx, cy, ax, ay));
  return sstep(-w, w, d);
}
type RGB = [number, number, number];
const mix3 = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/**
 * A husky in a snowy evening, photographed: head and chest in THREE-QUARTER view (the head turned to the viewer's
 * left), so the far eye and ear are foreshortened and the snout reaches past the cheek; the eyes are small, pale and
 * low-contrast (a photograph's eyes, not a painting's), the mouth closed. Pure function of (u, v) in [0, 1]².
 */
export function huskyRGB(u: number, v: number): RGB {
  // background: dark pines (upper) over snow (lower), out of focus, warm evening light from the left
  const fog = fbm2(u * 5, v * 5, 3);
  let col: RGB = mix3([0.2, 0.24, 0.27], [0.62, 0.64, 0.66], sstep(0.45, 0.85, v + (fog - 0.5) * 0.12));
  col = mix3(col, [0.78, 0.66, 0.52], 0.25 * sstep(0.6, 0, u) * sstep(0.9, 0.2, v));
  // bokeh: a few soft discs in the trees, kept to the sides of the frame
  for (let k = 0; k < 6; k++) {
    const bx = k % 2 ? 0.04 + 0.16 * hash1(k, 61) : 0.8 + 0.16 * hash1(k, 61), by = 0.05 + 0.3 * hash1(k, 62);
    const r = 0.025 + 0.025 * hash1(k, 63);
    col = mix3(col, [0.85, 0.74, 0.58], 0.28 * ell(u, v, bx, by, r, r, 0.02));
  }
  // chest (white ruff), shoulders (grey), turned with the head: the near shoulder (right) broader
  const shoulders = ell(u, v, 0.54, 1.02, 0.5, 0.36, 0.03);
  const chest = ell(u, v, 0.47, 1.0, 0.24, 0.3, 0.05);
  // head: the skull a little right of centre, the snout reaching left past the far cheek
  const skull = ell(u, v, 0.52, 0.46, 0.215, 0.215, 0.015);
  const snout = ell(u, v, 0.39, 0.6, 0.15, 0.1, 0.02);
  const jaw = ell(u, v, 0.48, 0.62, 0.15, 0.1, 0.02);
  const head = Math.max(skull, snout, jaw);
  // ears: the near ear (right) full, the far ear (left) foreshortened and set back
  const earN = tri(u, v, 0.74, 0.36, 0.7, 0.05, 0.58, 0.27, 0.008);
  const earF = tri(u, v, 0.33, 0.32, 0.37, 0.08, 0.45, 0.27, 0.008);
  const earInN = tri(u, v, 0.71, 0.3, 0.685, 0.12, 0.61, 0.27, 0.01);
  const earInF = tri(u, v, 0.36, 0.28, 0.38, 0.14, 0.43, 0.27, 0.01);
  const fur = fbm2(u * 38, v * 22, 9) - 0.5;
  const dark: RGB = [0.19 + fur * 0.08, 0.19 + fur * 0.08, 0.21 + fur * 0.08];
  const grey: RGB = [0.44 + fur * 0.1, 0.44 + fur * 0.1, 0.46 + fur * 0.1];
  const white: RGB = [0.86 + fur * 0.06, 0.85 + fur * 0.06, 0.83 + fur * 0.06];
  col = mix3(col, grey, shoulders);
  col = mix3(col, white, chest);
  const headAll = Math.max(head, earN, earF);
  col = mix3(col, dark, headAll);
  col = mix3(col, [0.56, 0.48, 0.46], 0.7 * Math.max(earInN, 0.8 * earInF));
  // the husky mask: the dark cap over the crown and down to the eyes, the face white below a soft line that runs
  // under the eyes; white 'spectacles' round each eye, a narrow forehead blaze
  const below = sstep(0.505, 0.575, v - 0.05 * (u - 0.5));
  const spect = Math.max(ell(u, v, 0.405, 0.478, 0.045, 0.032, 0.03), ell(u, v, 0.565, 0.476, 0.06, 0.036, 0.03));
  const blaze = ell(u, v, 0.478, 0.385, 0.018, 0.075, 0.025);
  const mask = Math.max(below, 0.85 * spect, 0.7 * blaze);
  col = mix3(col, white, 0.94 * mask * head);
  // form: the snout's bridge greys toward the nose, the jaw falls into shade, the near cheek turns away
  col = mix3(col, grey, 0.4 * head * ell(u, v, 0.37, 0.565, 0.11, 0.028, 0.03));
  col = mix3(col, grey, 0.45 * head * ell(u, v, 0.47, 0.685, 0.14, 0.04, 0.04));
  col = mix3(col, grey, 0.35 * head * sstep(0.62, 0.74, u) * sstep(0.45, 0.6, v));
  // eyes: small almonds, pale and low-contrast; the far eye narrower (foreshortened)
  const eyes: [number, number, number][] = [[0.405, 0.465, 0.024], [0.56, 0.462, 0.032]];
  for (const [ex, ey, rx] of eyes) {
    col = mix3(col, [0.2, 0.2, 0.21], 0.85 * ell(u, v, ex, ey, rx, 0.0135, 0.008));
    col = mix3(col, [0.48, 0.52, 0.55], 0.55 * ell(u, v, ex + 0.003, ey, rx * 0.55, 0.009, 0.006));
    col = mix3(col, [0.16, 0.16, 0.17], 0.7 * ell(u, v, ex + 0.004, ey, 0.006, 0.007, 0.004));
  }
  // nose at the snout's tip (left of centre), a closed mouth line running back under the near cheek
  col = mix3(col, [0.08, 0.08, 0.09], ell(u, v, 0.29, 0.585, 0.034, 0.026, 0.008));
  col = mix3(col, [0.42, 0.42, 0.44], 0.45 * ell(u, v, 0.282, 0.578, 0.01, 0.006, 0.005));
  const mouth = ell(u, v, 0.4, 0.655, 0.1, 0.006, 0.006) * sstep(0.28, 0.32, u);
  col = mix3(col, [0.22, 0.2, 0.2], 0.75 * mouth * head);
  // the dark cap reaches down past the eyes at the near side of the face
  col = mix3(col, dark, 0.65 * head * ell(u, v, 0.72, 0.5, 0.05, 0.12, 0.03));
  // warm key light from the upper left
  col = mix3(col, [1, 0.88, 0.7], 0.12 * sstep(0.8, 0.2, u) * headAll);
  return [Math.max(0, Math.min(1, col[0])), Math.max(0, Math.min(1, col[1])), Math.max(0, Math.min(1, col[2]))];
}

/**
 * The paper-cut film's treatment of the photograph (review round 1): a backlit photographic PRINT, never a painting.
 * About 70 % desaturated toward a warm tungsten ramp (deep umber shadows → cream highlights), a touch of contrast and
 * a fine film grain (seeded per pixel), so the only saturated light in these shots stays the motivated one.
 */
function printGrade(c: RGB, i: number, j: number, n: number): RGB {
  const L = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  const Lc = Math.max(0, Math.min(1, (L - 0.5) * 1.12 + 0.5));
  const warm: RGB = [0.1 + 0.88 * Lc, 0.075 + 0.83 * Lc, 0.06 + 0.7 * Lc];
  const g = mix3(c, warm, 0.7);
  // film grain per pixel, plus a faint tonal blotch per 8 × 8 block (a compressed photograph's signature) at n ≥ 112
  const grain = (hash1(i * 7349 + j * 131 + n * 17, 997) - 0.5) * 0.07;
  const blk = n >= 112 ? (hash1(Math.floor(i / 8) * 97 + Math.floor(j / 8) * 13 + n, 998) - 0.5) * 0.03 : 0;
  const d = grain + blk;
  return [Math.max(0, Math.min(1, g[0] + d)), Math.max(0, Math.min(1, g[1] + d)), Math.max(0, Math.min(1, g[2] + d * 0.9))];
}

const PIX = new Map<number, Float32Array>();
/** n × n × 3 pixel values (pixel centres, print-graded), cached */
export function huskyPixels(n: number): Float32Array {
  let p = PIX.get(n);
  if (p) return p;
  p = new Float32Array(n * n * 3);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const c = printGrade(huskyRGB((i + 0.5) / n, (j + 0.5) / n), i, j, n);
      p.set(c, (j * n + i) * 3);
    }
  PIX.set(n, p);
  return p;
}
export type Plane = 'rgb' | 'r' | 'g' | 'b';
/** the tissue tints of the three colour planes: muted (paper dyed, not neon; saturation ≤ 0.45) */
export const PLANE_TINT: Record<'r' | 'g' | 'b', RGB> = { r: [0.88, 0.58, 0.5], g: [0.6, 0.8, 0.6], b: [0.52, 0.64, 0.88] };
const CANV = new Map<string, HTMLCanvasElement>();
export function huskyCanvas(n: number, plane: Plane = 'rgb'): HTMLCanvasElement {
  const key = `${n}|${plane}`;
  let cv = CANV.get(key);
  if (cv) return cv;
  cv = makeCanvas(n, n);
  const g = cv.getContext('2d')!;
  const img = g.createImageData(n, n);
  const p = huskyPixels(n);
  const ch = plane === 'r' ? 0 : plane === 'g' ? 1 : plane === 'b' ? 2 : -1;
  for (let q = 0; q < n * n; q++) {
    let r: number, gg: number, b: number;
    if (ch < 0) [r, gg, b] = [p[q * 3], p[q * 3 + 1], p[q * 3 + 2]];
    else {
      const val = p[q * 3 + ch];
      const tint = PLANE_TINT[plane as 'r' | 'g' | 'b'];
      // one plane: the channel's value as light through a dyed tissue (dark where the value is low)
      r = 0.05 + tint[0] * val * 0.95;
      gg = 0.05 + tint[1] * val * 0.95;
      b = 0.05 + tint[2] * val * 0.95;
    }
    img.data[q * 4] = Math.round(r * 255);
    img.data[q * 4 + 1] = Math.round(gg * 255);
    img.data[q * 4 + 2] = Math.round(b * 255);
    img.data[q * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  CANV.set(key, cv);
  return cv;
}
/** the typed value of pixel (i, j) in a plane (0..1) */
export function huskyValue(n: number, i: number, j: number, plane: 'r' | 'g' | 'b'): number {
  const p = huskyPixels(n);
  const ch = plane === 'r' ? 0 : plane === 'g' ? 1 : 2;
  return p[(j * n + i) * 3 + ch];
}

/** the Mark I eye's horizontal bar on the 20 × 20 retina (0/1 per cell) */
export const BAR20: number[] = Array.from({ length: 400 }, (_, q) => {
  const i = q % 20, j = Math.floor(q / 20);
  return j >= 9 && j <= 10 && i >= 3 && i <= 16 ? 1 : 0;
});

// ------------------------------------------------------------------------------------------------ tiles
/**
 * One 11 × 11 first-layer stencil tile (ILLUSTRATIVE): `learned` 0 = television snow, 1 = an oriented grey stripe
 * (half the tiles) or a soft colour blob (the other half), the look of AlexNet's published first-layer mosaic.
 * Returns 121 RGB triples 0..1.
 */
export function tileArt(k: number, learned: number): RGB[] {
  const out: RGB[] = [];
  const colour = k % 2 === 1;
  const ang = hash1(k, 301) * Math.PI;
  const freq = 0.55 + 0.6 * hash1(k, 302);
  const ph = hash1(k, 303) * Math.PI * 2;
  const hue = hash1(k, 304);
  const ca: RGB = [0.5 + 0.45 * Math.cos(hue * 6.28), 0.5 + 0.45 * Math.cos(hue * 6.28 - 2.1), 0.5 + 0.45 * Math.cos(hue * 6.28 + 2.1)];
  for (let j = 0; j < 11; j++)
    for (let i = 0; i < 11; i++) {
      const n = hash1(k * 131 + j * 11 + i, 305);
      const snow: RGB = [n, n, n];
      const x = (i - 5) / 5, y = (j - 5) / 5;
      const env = Math.exp(-(x * x + y * y) * 1.1);
      let lv: RGB;
      if (!colour) {
        const s = Math.cos((x * Math.cos(ang) + y * Math.sin(ang)) * freq * 5 + ph);
        const g = 0.5 + 0.48 * s * env;
        lv = [g, g, g];
      } else {
        const b = Math.exp(-((x - 0.25 * Math.cos(ph)) ** 2 + (y - 0.25 * Math.sin(ph)) ** 2) * 2.2);
        lv = [0.5 + (ca[0] - 0.5) * b * 0.9, 0.5 + (ca[1] - 0.5) * b * 0.9, 0.5 + (ca[2] - 0.5) * b * 0.9];
      }
      out.push(mix3(snow, lv, learned));
    }
  return out;
}
