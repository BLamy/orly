/**
 * ch08-s06 / ch08-s09 — the 96 first-layer stencils (11 × 11 × 3), as glass tiles.
 *
 * ILLUSTRATIVE: the real AlexNet conv1 weights are not used. The learned state is procedural and shaped
 * like the paper's Fig. 3: the 48 kernels on GPU 1 (k 0..47) are largely colour-agnostic (grey oriented
 * stripes and edges at every angle, a few grey blobs), the 48 on GPU 2 (k 48..95) largely colour-specific
 * (soft colour-opponent blobs and low-frequency colour edges). The shots that show them carry an
 * ILLUSTRATIVE stamp.
 *
 *   TILE_N = 96, TILE_S = 11
 *   TOY_K                     a GPU-1 tile that is a clean vertical dark-to-light edge (like the hand-set
 *                             Sobel stencil of ch08-s04)
 *   tileAtlas(name)           a per-caller atlas (16 × 6 tiles of 11 × 11 px)
 *   atlas.update(key, state)  recompute the atlas when `key` changes; state(k) -> { u, seed, kind? }
 *                               u      0 = static (initial noise), 1 = learned
 *                               seed   the noise draw (a new run = a new seed); also re-draws the learned
 *                                      filter's details for ghost runs (kind and sort stay the same)
 *                               snow   0..1 extra seething of the static (television snow), on twos
 *   atlas.draw(c, k, x, y, size, rot?)  draw tile k centred at (x, y)
 */
import { hash1 } from '../../../film/silhouette/atmosphere';

export const TILE_N = 96;
export const TILE_S = 11;
const COLS = 16;
const ROWS = 6;

/** one learned filter: RGB values in -1..1, length 11*11*3 */
type Filt = Float32Array;

function gauss(seed: number, i: number): number {
  // Box–Muller from two hashed uniforms (deterministic)
  const u1 = Math.max(1e-6, hash1(i * 2 + 1, seed));
  const u2 = hash1(i * 2 + 2, seed);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** the k-th learned filter for a run variant `v` (v = 0 is the canonical mosaic) */
function learnedFilter(k: number, v: number): Filt {
  const f = new Float32Array(TILE_S * TILE_S * 3);
  const S = 7000 + k * 31 + v * 7919;
  const r = (i: number) => hash1(i, S);
  const c0 = (TILE_S - 1) / 2;
  const grey = k < 48;
  if (k === TOY_K) {
    // a clean vertical edge, dark on the left, light on the right (the shape of the toy stencil)
    for (let y = 0; y < TILE_S; y++)
      for (let x = 0; x < TILE_S; x++) {
        const dx = x - c0 - 0.3;
        const dy = y - c0;
        const env = Math.exp(-(dy * dy) / (2 * 3.6 * 3.6) - (dx * dx) / (2 * 3.2 * 3.2));
        const val = Math.tanh(dx * 0.85) * env * 0.95;
        const i = (y * TILE_S + x) * 3;
        f[i] = f[i + 1] = f[i + 2] = val;
      }
    return f;
  }
  if (grey) {
    const blob = r(1) < 0.12;
    // orientations spread across every angle (the paper's "edges at every angle")
    const theta = ((k * 0.618034) % 1) * Math.PI + (r(2) - 0.5) * 0.3;
    const freq = 0.11 + 0.2 * r(3);
    const sigma = 1.9 + 1.8 * r(4);
    const phase = r(5) < 0.5 ? Math.PI / 2 : r(6) * Math.PI * 2;
    const amp = 0.7 + 0.3 * r(7);
    const ox = (r(8) - 0.5) * 2.4;
    const oy = (r(9) - 0.5) * 2.4;
    const ct = Math.cos(theta);
    const st = Math.sin(theta);
    for (let y = 0; y < TILE_S; y++)
      for (let x = 0; x < TILE_S; x++) {
        const dx = x - c0 - ox;
        const dy = y - c0 - oy;
        let val: number;
        if (blob) {
          const rr = dx * dx + dy * dy;
          val = (Math.exp(-rr / (2 * 1.6 * 1.6)) - 0.55 * Math.exp(-rr / (2 * 3.6 * 3.6))) * (r(10) < 0.5 ? 1.6 : -1.6);
        } else {
          const along = dx * ct + dy * st;
          const env = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
          val = amp * env * Math.cos(2 * Math.PI * freq * along + phase);
        }
        const i = (y * TILE_S + x) * 3;
        f[i] = f[i + 1] = f[i + 2] = val;
      }
    return f;
  }
  // colour-specific: opponent axes (red–green, blue–yellow, and mixtures), low frequency
  const axes: [number, number, number][] = [
    [0.75, -0.62, -0.1],
    [-0.42, -0.36, 0.85],
    [0.35, 0.62, -0.75],
    [-0.7, 0.5, 0.35],
    [0.6, 0.15, -0.7],
  ];
  const a = axes[Math.floor(r(11) * axes.length)];
  const kindR = r(12);
  const sigma = 2.2 + 1.6 * r(13);
  const ox = (r(14) - 0.5) * 3;
  const oy = (r(15) - 0.5) * 3;
  const theta = r(16) * Math.PI;
  const sign = r(17) < 0.5 ? -1 : 1;
  const lum = (r(18) - 0.5) * 0.35;
  for (let y = 0; y < TILE_S; y++)
    for (let x = 0; x < TILE_S; x++) {
      const dx = x - c0 - ox;
      const dy = y - c0 - oy;
      const rr = dx * dx + dy * dy;
      let s: number;
      if (kindR < 0.45) s = Math.exp(-rr / (2 * sigma * sigma)) * 1.1; // a soft colour blob
      else if (kindR < 0.75) s = Math.tanh((dx * Math.cos(theta) + dy * Math.sin(theta)) * 0.5) * Math.exp(-rr / (2 * 4.2 * 4.2)); // a soft colour edge
      else s = (Math.exp(-rr / (2 * 1.7 * 1.7)) - 0.6 * Math.exp(-rr / (2 * 3.8 * 3.8))) * 1.5; // colour centre-surround
      s *= sign;
      const i = (y * TILE_S + x) * 3;
      f[i] = s * a[0] + lum * s;
      f[i + 1] = s * a[1] + lum * s;
      f[i + 2] = s * a[2] + lum * s;
    }
  return f;
}

/** the GPU-1 tile that is a clean vertical edge (its slot is the left end of the middle row) */
export const TOY_K = 24;

const LEARNED = new Map<string, Filt>();
function learned(k: number, v: number): Filt {
  const key = `${k}|${v}`;
  let f = LEARNED.get(key);
  if (!f) {
    f = learnedFilter(k, v);
    LEARNED.set(key, f);
  }
  return f;
}

export interface TileState {
  u: number;
  seed: number;
  /** learned-variant (ghost runs learn different, same-kind filters) */
  variant?: number;
  /** 0..1 television-snow seething (a time-varying noise layered on the static) */
  snow?: number;
  /** a 0..1 lift in brightness (a passing bead's tug, a highlight) */
  lift?: number;
}

export interface TileAtlas {
  update(key: string, state: (k: number) => TileState, snowTick?: number): void;
  draw(c: CanvasRenderingContext2D, k: number, x: number, y: number, size: number, rot?: number): void;
  canvas: HTMLCanvasElement;
}

const ATLASES = new Map<string, TileAtlas>();
const SAT = 0.4;
const px = [0, 0, 0];
/** the light the glass passes: a warm-neutral white, slightly tinted by the mood's core */
export function tileAtlas(name: string, tint: [number, number, number] = [1, 0.97, 0.9], sat = SAT): TileAtlas {
  const hit = ATLASES.get(name);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = COLS * TILE_S;
  cv.height = ROWS * TILE_S;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(cv.width, cv.height);
  let last = '';
  const atlas: TileAtlas = {
    canvas: cv,
    update(key, state, snowTick = 0) {
      if (key === last) return;
      last = key;
      const d = img.data;
      for (let k = 0; k < TILE_N; k++) {
        const st = state(k);
        const u = Math.max(0, Math.min(1, st.u));
        const L = learned(k, st.variant ?? 0);
        const snow = st.snow ?? 0;
        const lift = st.lift ?? 0;
        const tx = (k % COLS) * TILE_S;
        const ty = Math.floor(k / COLS) * TILE_S;
        // the learned filter shows its structure at full contrast; noise is grey speckle with a little chroma
        for (let p = 0; p < TILE_S * TILE_S; p++) {
          const n0 = gauss(st.seed * 977 + k * 13, p) * 0.62;
          const nc = gauss(st.seed * 977 + k * 13 + 5, p) * 0.09;
          const ns = snow > 0 ? gauss(snowTick * 131 + k * 17, p) * 0.5 * snow : 0;
          const i = ((ty + Math.floor(p / TILE_S)) * cv.width + tx + (p % TILE_S)) * 4;
          let mean = 0;
          for (let ch = 0; ch < 3; ch++) {
            const noise = n0 + (ch === 0 ? nc : ch === 2 ? -nc : 0) + ns;
            const v = (1 - u) * noise + u * L[p * 3 + ch] * 0.95;
            px[ch] = v;
            mean += v / 3;
          }
          for (let ch = 0; ch < 3; ch++) {
            // keep colour soft (bible: chroma stays low outside practicals)
            const v = mean + (px[ch] - mean) * sat;
            const lv = Math.max(0, Math.min(1, 0.5 + 0.5 * v)) * (1 + 0.35 * lift);
            d[i + ch] = Math.max(0, Math.min(255, Math.round(255 * lv * tint[ch])));
          }
          d[i + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    },
    draw(c, k, x, y, size, rot = 0) {
      const sx = (k % COLS) * TILE_S;
      const sy = Math.floor(k / COLS) * TILE_S;
      c.save();
      c.translate(x, y);
      if (rot) c.rotate(rot);
      c.imageSmoothingEnabled = true;
      c.drawImage(cv, sx, sy, TILE_S, TILE_S, -size / 2, -size / 2, size, size);
      c.restore();
    },
  };
  ATLASES.set(name, atlas);
  return atlas;
}
