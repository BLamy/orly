/**
 * neural-net-history — THE DEEP STACK (ch07-s02, reused in ch07-s04): the kit's lantern vocabulary stood on
 * end as a tall loom, four rows of paper lanterns, inputs at the BOTTOM, each row threaded on a taut cord
 * between two uprights and joined to the row above by weight strings.
 *
 * The numbers are real (an illustrative toy, as the narration frames it): a 6-5-4-3 stack trained GREEDILY,
 * one layer at a time, each layer a tied-weight autoencoder that learns to rebuild the row beneath it
 * (Hinton & Salakhutdinov's 2006 recipe in miniature). Trained once at module load, deterministically.
 *   STACK.acts       activations of every row for the shown input (bottom → top)
 *   STACK.recon[l]   row l's reconstruction of row l-1 (l = 1..3): what the "ghost" glow redraws
 *   STACK.randActs   the same stack with fresh random weights (ch07-s04: plain back-prop, no warm-up)
 *
 *   deepStack(c, { x, y, w, h, rows, ghost?, pulse?, acts?, frame?, alpha? }, env)
 *     rows[l]   0..1 how lit row l is (l = 0 input … 3 top)
 *     ghost[l]  0..1 progress of row l's "rebuild its input" echo (l = 1..3), literal (review ch07-s02 r1):
 *               0 → .4  a ghost COPY of row l-1's pattern (row l's reconstruction of it) travels DOWN the
 *                       strings from row l, knots running with it
 *               .4 → .75 it lands on row l-1 as dashed ghost lanterns; where ghost and real coincide the
 *                       lantern brightens softly (the rebuild matches its input)
 *               .75 → 1 the ghost fades
 *     neutral   0..1 the warm-up pattern drains to an even, neutral light (no echoes, every lantern alike)
 *     pulse     0..2 one fine-tuning pulse: 0 → 1 up the whole stack, 1 → 2 back down (≤ 0 / ≥ 2: none)
 *     frame     0..1 the loom's uprights and cords catch the light
 *   stackLayout(o) → { r, rows: [{ y, xs[] }] } unit centres (for cameras, digit feeds, labels)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { glow, knot, paperLantern, thread, threadPoint, weightColor, weightWidth } from '../../../film/silhouette/metaphors/kit';

type C = CanvasRenderingContext2D;
const sig = (x: number) => 1 / (1 + Math.exp(-x));
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};

// ------------------------------------------------------------------------------------------- the numbers
export const STACK_SIZES = [6, 5, 4, 3] as const;
/** eight 6-bit patterns (the toy "pictures") */
const DATA: number[][] = [
  [1, 0, 1, 1, 0, 1],
  [0, 1, 1, 0, 1, 0],
  [1, 1, 0, 0, 1, 1],
  [0, 0, 1, 1, 1, 0],
  [1, 0, 0, 1, 0, 1],
  [0, 1, 0, 1, 1, 0],
  [1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1],
];
function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
interface AE {
  W: number[][]; // out × in
  b: number[];
  c: number[];
}
const enc = (L: AE, x: number[]) => L.W.map((row, j) => sig(row.reduce((s, w, i) => s + w * x[i], L.b[j])));
const dec = (L: AE, h: number[]) => L.c.map((ci, i) => sig(L.W.reduce((s, row, j) => s + row[i] * h[j], ci)));

/** one tied-weight autoencoder layer, trained by plain SGD on cross-entropy */
function trainAE(xs: number[][], nOut: number, seed: number, epochs = 900, lr = 0.6): AE {
  const rnd = mulberry(seed);
  const nIn = xs[0].length;
  const L: AE = {
    W: Array.from({ length: nOut }, () => Array.from({ length: nIn }, () => (rnd() - 0.5) * 0.8)),
    b: new Array(nOut).fill(0),
    c: new Array(nIn).fill(0),
  };
  for (let e = 0; e < epochs; e++) {
    for (const x of xs) {
      const h = enc(L, x);
      const r = dec(L, h);
      const dr = r.map((v, i) => v - x[i]);
      const dh = h.map((hj, j) => L.W[j].reduce((s, w, i) => s + w * dr[i], 0) * hj * (1 - hj));
      for (let j = 0; j < nOut; j++) {
        for (let i = 0; i < nIn; i++) L.W[j][i] -= lr * (dh[j] * x[i] + h[j] * dr[i]);
        L.b[j] -= lr * dh[j];
      }
      for (let i = 0; i < nIn; i++) L.c[i] -= lr * dr[i];
    }
  }
  return L;
}

function buildStack() {
  // greedy: train layer 1 on the data, layer 2 on layer 1's codes, layer 3 on layer 2's codes
  const layers: AE[] = [];
  let xs = DATA;
  for (let l = 1; l < STACK_SIZES.length; l++) {
    const L = trainAE(xs, STACK_SIZES[l], 2006 + l * 31);
    layers.push(L);
    xs = xs.map((x) => enc(L, x));
  }
  const show = DATA[0];
  const acts: number[][] = [show];
  for (const L of layers) acts.push(enc(L, acts[acts.length - 1]));
  const recon: number[][] = [[]];
  for (let l = 1; l < acts.length; l++) recon.push(dec(layers[l - 1], acts[l]));
  // the same shape with fresh random weights (no warm-up)
  const rnd = mulberry(2010);
  const rand: AE[] = layers.map((L) => ({ W: L.W.map((r) => r.map(() => (rnd() - 0.5) * 3.2)), b: L.b.map(() => (rnd() - 0.5)), c: L.c.slice() }));
  const randActs: number[][] = [show];
  for (const L of rand) randActs.push(enc(L, randActs[randActs.length - 1]));
  const W = layers.map((L) => L.W);
  const Wr = rand.map((L) => L.W);
  let wMax = 1e-6;
  for (const M of [...W, ...Wr]) for (const r of M) for (const w of r) wMax = Math.max(wMax, Math.abs(w));
  return { layers, acts, recon, W, Wr, randActs, wMax };
}
export const STACK = buildStack();

// ------------------------------------------------------------------------------------------- layout
export interface StackDraw {
  x: number;
  y: number;
  w: number;
  h: number;
  rows: number[];
  ghost?: number[];
  pulse?: number;
  acts?: number[][];
  /** use the random (un-warmed) weights for the strings */
  random?: boolean;
  frame?: number;
  alpha?: number;
  r?: number;
  /** 0..1 a short bloom over the whole stack (the fine-tuning wave arriving at the top) */
  bloom?: number;
  /** brightness gain of the fine-tune pulse (default 1) */
  pulseGain?: number;
  /** 0..1 the learned pattern drains to an even, neutral light */
  neutral?: number;
}
export interface StackLayout {
  r: number;
  rows: { y: number; xs: number[] }[];
  posts: [number, number];
  top: number;
  floor: number;
}
export function stackLayout(o: Pick<StackDraw, 'x' | 'y' | 'w' | 'h' | 'r'>): StackLayout {
  const n = STACK_SIZES.length;
  const r = o.r ?? Math.min((o.w - 40) / (6 * 3.1), o.h / (n * 3.6));
  const top = o.y + r * 2.4;
  const bot = o.y + o.h - r * 2.2;
  const rows = STACK_SIZES.map((k, l) => {
    const y = bot - (l / (n - 1)) * (bot - top);
    const span = Math.min(o.w - 70, (k - 1) * r * 3.1);
    const cx = o.x + o.w / 2;
    return { y, xs: Array.from({ length: k }, (_, i) => cx - span / 2 + (i / Math.max(1, k - 1)) * span) };
  });
  return { r, rows, posts: [o.x + 6, o.x + o.w - 6], top: o.y, floor: o.y + o.h };
}

// ------------------------------------------------------------------------------------------- draw
export function deepStack(c: C, o: StackDraw, env: PaintEnv) {
  const A = o.alpha ?? 1;
  if (A <= 0.003) return;
  const m = env.mood;
  const ink = env.fill('ink');
  const lay = stackLayout(o);
  const { r } = lay;
  const acts = o.acts ?? (o.random ? STACK.randActs : STACK.acts);
  const Ws = o.random ? STACK.Wr : STACK.W;
  const frame = clamp01(o.frame ?? 1);
  const pulse = o.pulse ?? -1;
  const rowsLit = o.rows;
  const neutral = clamp01(o.neutral ?? 0);
  const ghost = o.ghost ?? [];
  const nRows = STACK_SIZES.length;
  // the pulse's position in row units (0 bottom … 3 top)
  const pulseRow = pulse <= 0 || pulse >= 2 ? -9 : pulse < 1 ? pulse * (nRows - 1) : (2 - pulse) * (nRows - 1);
  const gain = o.pulseGain ?? 1;
  const pulseAt = (l: number) => (pulseRow < -1 ? 0 : gain * Math.exp(-Math.pow((l - pulseRow) * 1.6, 2)));

  c.save();
  c.globalAlpha *= A;

  // --- the loom: two uprights on feet, a top beam, a taut cord per row (ink, rim-lit on the lamp side)
  c.fillStyle = ink;
  const [p0, p1] = lay.posts;
  for (const px of [p0, p1]) {
    c.fillRect(px - 4, lay.top, 8, lay.floor - lay.top);
    c.fillRect(px - 16, lay.floor - 6, 32, 6);
    c.beginPath();
    c.arc(px, lay.top - 4, 7, 0, Math.PI * 2);
    c.fill();
  }
  c.fillRect(p0 - 10, lay.top + 2, p1 - p0 + 20, 8);
  if (frame > 0.01) {
    c.fillStyle = withAlpha(m.rim, 0.35 * frame);
    c.fillRect(p0 - 4, lay.top, 1.2, lay.floor - lay.top);
    c.fillRect(p1 - 4, lay.top, 1.2, lay.floor - lay.top);
    c.fillRect(p0 - 10, lay.top + 2, p1 - p0 + 20, 1.2);
  }
  c.strokeStyle = withAlpha(ink, 0.9);
  c.lineWidth = 1.4;
  c.beginPath();
  for (const row of lay.rows) {
    c.moveTo(p0, row.y - r * 1.25);
    c.lineTo(p1, row.y - r * 1.25);
  }
  c.stroke();

  // --- weight strings between row l (below) and l+1 (above)
  for (let l = 0; l < nRows - 1; l++) {
    const W = Ws[l];
    const lo = lay.rows[l], hi = lay.rows[l + 1];
    const lit = Math.min(rowsLit[l] ?? 0, rowsLit[l + 1] ?? 0) * (1 - 0.45 * neutral);
    const pl = Math.max(pulseAt(l), pulseAt(l + 1));
    for (let j = 0; j < hi.xs.length; j++) {
      for (let i = 0; i < lo.xs.length; i++) {
        const w = W[j][i];
        const T = { x0: lo.xs[i], y0: lo.y - r * 1.05, x1: hi.xs[j], y1: hi.y + r * 1.0, sag: 0 };
        thread(c, { ...T, w: weightWidth(w, STACK.wMax) * 0.75, color: mixLab(weightColor(m, w), m.core, 0.3 * lit + 0.4 * pl), alpha: 0.1 + 0.5 * lit + 0.35 * pl }, env);
        // the rebuild echo: a knot running DOWN the string from row l+1 to row l
        const g = ghost[l + 1] ?? 0;
        if (g > 0 && g < 0.42) {
          const u = sm(g / 0.4);
          const p = threadPoint(T, 1 - u);
          knot(c, p.x, p.y, 1.8 + 2 * Math.min(1, Math.abs(w) / 4), 0.3 * Math.sin(Math.PI * Math.min(1, g / 0.4)), env);
        }
        // the fine-tune pulse travelling along the strings
        if (pulseRow > -1) {
          const dir = pulse < 1 ? 1 : -1;
          const rel = pulseRow - l; // 0..1 inside this gap
          if (rel > 0 && rel < 1) {
            const p = threadPoint(T, dir > 0 ? rel : rel);
            knot(c, p.x, p.y, 2 + 2.4 * Math.min(1, Math.abs(w) / 4), 0.5, env);
          }
        }
      }
    }
  }

  // --- lanterns (glow ← activation × how lit the row is)
  for (let l = 0; l < nRows; l++) {
    const row = lay.rows[l];
    const lit = clamp01(rowsLit[l] ?? 0);
    const pl = pulseAt(l);
    for (let i = 0; i < row.xs.length; i++) {
      const a = acts[l][i] + (0.5 - acts[l][i]) * neutral;
      const act = lit * (0.12 + 0.88 * a) + 0.6 * pl;
      paperLantern(c, { x: row.xs[i], y: row.y, r, act: Math.min(1, act), flare: pl, hang: r * 0.25, tassel: l === 0, halo: 0.55 }, env);
    }
  }

  // --- the rebuild echo (literal): a ghost copy of row l-1's pattern, as row l rebuilds it, travels DOWN the
  // strings and lands on row l-1; where it matches the real pattern the lantern brightens
  for (let l = 1; l < nRows; l++) {
    const g = ghost[l] ?? 0;
    if (g <= 0 || g >= 1) continue;
    const lo = lay.rows[l - 1], hi = lay.rows[l];
    const rec = STACK.recon[l];
    const real = acts[l - 1];
    const down = sm(g / 0.4); // 0 at row l → 1 landed on row l-1
    const k = sm(g / 0.08) * (1 - sm((g - 0.76) / 0.24));
    const land = sm((g - 0.36) / 0.1) * (1 - sm((g - 0.76) / 0.24)); // the coincidence
    const cxHi = (hi.xs[0] + hi.xs[hi.xs.length - 1]) / 2;
    const spanHi = hi.xs[hi.xs.length - 1] - hi.xs[0];
    const spanLo = lo.xs[lo.xs.length - 1] - lo.xs[0];
    const squeeze = spanHi / Math.max(1, spanLo);
    c.save();
    for (let i = 0; i < lo.xs.length; i++) {
      const v = clamp01(rec[i] ?? 0);
      // start compressed into row l's span, end on row l-1's lantern
      const x0 = cxHi + (lo.xs[i] - cxHi) * squeeze;
      const x = x0 + (lo.xs[i] - x0) * down;
      const y = hi.y + (lo.y - hi.y) * down;
      const rr = r * (1.3 + 0.25 * v);
      // ghost lantern: a dark keyline, a bright dashed ring, a glow ∝ the rebuilt value (on/off reads)
      c.setLineDash([]);
      c.lineWidth = 4;
      c.strokeStyle = withAlpha(m.ink, 0.5 * k);
      c.beginPath();
      c.ellipse(x, y, rr, rr * 1.12, 0, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([5, 3.5]);
      c.lineWidth = 2.4;
      c.strokeStyle = withAlpha(mixLab(m.core, '#ffffff', 0.35), (0.35 + 0.65 * v) * k);
      c.beginPath();
      c.ellipse(x, y, rr, rr * 1.12, 0, 0, Math.PI * 2);
      c.stroke();
      if (v > 0.5) {
        c.setLineDash([]);
        c.fillStyle = withAlpha(mixLab(m.core, '#ffffff', 0.25), 0.55 * (v - 0.5) * 2 * k);
        c.beginPath();
        c.ellipse(x, y, rr * 0.42, rr * 0.5, 0, 0, Math.PI * 2);
        c.fill();
      }
      glow(c, x, y, r * 2.8, m.core, (0.1 + 0.6 * v) * k);
      // landed: ghost and real coincide → a soft brightening on the matching (lit) lanterns
      if (land > 0.01) {
        const match = (1 - Math.abs(v - (real[i] ?? 0))) * (0.25 + 0.75 * (real[i] ?? 0));
        glow(c, lo.xs[i], lo.y, r * 4.2, m.halo, 0.55 * match * land);
        glow(c, lo.xs[i], lo.y, r * 2, m.core, 0.7 * match * land);
      }
    }
    c.restore();
  }
  // --- the bloom: the whole stack flares once, softly
  const bl = clamp01(o.bloom ?? 0);
  if (bl > 0.01) {
    for (let l = 0; l < nRows; l++) for (const x of lay.rows[l].xs) glow(c, x, lay.rows[l].y, r * 3.4, m.core, 0.42 * bl);
  }
  c.restore();
}
