/**
 * ch08-s08b — the cathedral's two great halls in miniature, with dropout bound to a real (tiny) network.
 *
 * GEOGRAPHY (L4 world; axis x 640; the towers are L3 set pieces at x 150 and 1130):
 *   crown     fc8, the last hall: a beam at y 104 with 48 tiny lanterns (a thousand, in miniature), never snuffed
 *   fc7       a beam at y 236; 12 lanterns hang at y 288 (4,096 in the paper; 12 here)
 *   fc6       a beam at y 396; 12 lanterns hang at y 448
 *   stub      the top of the stencil courses (conv5's six lit windows, y 548–592) on a plinth (y 592–700) with the
 *             round picture window at (640, 648): the thumbnail of the example being shown. Never snuffed.
 *
 * THE NETWORK (real arithmetic, fixed seeded weights; ILLUSTRATIVE sizes):
 *   a0 (6, the stub, from the picture) → fc6 = relu(W1 a0 + b) ⊙ m6 → fc7 = relu(W2 fc6 + b) ⊙ m7 → fc8 = softmax(W3 fc7)
 *   m6, m7: dropout masks, p = 0.5, a fresh random half per example (seeded shuffle). No rescaling in training,
 *   as in the paper (its test-time outputs are halved instead). Lantern glow ← the unit's activation for the
 *   current example, normalised by that layer's maximum with no units dropped, so thinner nets burn dimmer.
 *
 *   EXAMPLES(times)                   the example schedule: picture, masks, forward activations per example
 *   focusPair(ex)                     a surviving fc7 lantern S and an fc6 neighbour N that is alive in ex-1 and
 *                                     snuffed in ex (for "no lantern could count on another")
 *   pos.fc6(i) / pos.fc7(i) / pos.fc8(i) / pos.stub(i)   unit centres (world px)
 *   towers(c, env)                    the two flanking towers (L3, static: cache it)
 *   beams(c, env)                     hall beams, the crown beam and the stub (L4 static: cache it)
 *   wisp(c, env, x, y, age, seed)     a curl of smoke rising from a snuffed lantern (age 0..1.4 s)
 *   tinyLantern(c, env, x, y, act)    one of the crown's small lanterns
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1, softSprite } from '../../../film/silhouette/atmosphere';
import { glow, softmax } from '../../../film/silhouette/metaphors/kit';

type C = CanvasRenderingContext2D;

export const N6 = 12;
export const N7 = 12;
export const N8 = 48;
export const NS = 6;
export const GEO = {
  axis: 640,
  towers: [150, 1130] as const,
  towerHW: 46,
  crownY: 118,
  fc7Y: 236,
  fc6Y: 396,
  hang: 52,
  r: 20,
  stubTop: 548,
  plinthTop: 592,
  ground: 700,
  win: { x: 640, y: 648, r: 34 },
  x0: 300,
  x1: 980,
};

const hallX = (i: number, n: number) => GEO.x0 + ((GEO.x1 - GEO.x0) * i) / (n - 1);
export const pos = {
  fc6: (i: number) => ({ x: hallX(i, N6), y: GEO.fc6Y + GEO.hang }),
  fc7: (i: number) => ({ x: hallX(i, N7), y: GEO.fc7Y + GEO.hang }),
  fc8: (i: number) => ({ x: 262 + ((1018 - 262) * i) / (N8 - 1), y: GEO.crownY + 15 }),
  stub: (i: number) => ({ x: 640 + (i - (NS - 1) / 2) * 44, y: GEO.stubTop + 20 }),
};

// ------------------------------------------------------------------------------------------------ the network
const W1 = Array.from({ length: N6 }, (_, j) => Array.from({ length: NS }, (_, i) => wgt(j * 31 + i, 811)));
const W2 = Array.from({ length: N7 }, (_, j) => Array.from({ length: N6 }, (_, i) => wgt(j * 37 + i, 821)));
const W3 = Array.from({ length: N8 }, (_, j) => Array.from({ length: N7 }, (_, i) => (hash1(j * 41 + i, 831) - 0.45) * 2.2));
function wgt(n: number, s: number): number {
  const mag = 0.2 + 0.8 * hash1(n, s);
  return hash1(n, s + 1) > 0.22 ? mag : -0.55 * mag;
}
export const WEIGHTS = { W1, W2, W3 };
const relu = (v: number) => (v > 0 ? v : 0);
const dot = (w: number[], a: number[]) => w.reduce((s, wi, i) => s + wi * a[i], 0);

/** a random half: seeded shuffle, the first n/2 are dropped (mask 0) */
function halfMask(n: number, seed: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(hash1(i, seed) * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const m = new Array(n).fill(1);
  for (let q = 0; q < n / 2; q++) m[idx[q]] = 0;
  return m;
}

export interface Example {
  /** fc6 switches at t, fc7 at t + STAGGER, fc8 at t + 2 STAGGER */
  t: number;
  pic: number;
  m6: number[];
  m7: number[];
  a0: number[];
  /** displayed glow 0..1 */
  g6: number[];
  g7: number[];
  g8: number[];
}
export const STAGGER = 0.2;

function forwardEx(pic: number, m6: number[] | null, m7: number[] | null) {
  const a0 = Array.from({ length: NS }, (_, i) => 0.45 + 0.55 * hash1(i * 13 + pic * 7, 851));
  const full6 = W1.map((w) => relu(dot(w, a0) + 0.05));
  const h6 = full6.map((v, i) => v * (m6 ? m6[i] : 1));
  const full7 = W2.map((w) => relu(dot(w, full6) + 0.05));
  const h7 = W2.map((w, i) => relu(dot(w, h6) + 0.05) * (m7 ? m7[i] : 1));
  const p8 = softmax(W3.map((w) => dot(w, h7) / Math.max(1e-6, Math.max(...full7))), 0.35);
  const mx6 = Math.max(...full6, 1e-6);
  const mx7 = Math.max(...full7, 1e-6);
  const mx8 = Math.max(...p8);
  return {
    a0,
    g6: h6.map((v) => (v > 0 ? 0.55 + 0.45 * Math.min(1, v / mx6) : 0)),
    g7: h7.map((v) => (v > 0 ? 0.55 + 0.45 * Math.min(1, v / mx7) : 0)),
    g8: p8.map((p) => 0.12 + 0.88 * Math.pow(p / mx8, 1.4)),
  };
}

/** example -1 (no masks, the picture already in the window) then one example per time in `times` */
export function makeExamples(times: number[], focusEx: number): { ex: Example[]; focus: { S: number; N: number } } {
  const build = (off: number) => {
    const ex: Example[] = [];
    const f0 = forwardEx(0, null, null);
    ex.push({ t: -10, pic: 0, m6: new Array(N6).fill(1), m7: new Array(N7).fill(1), ...f0 });
    times.forEach((t, k) => {
      const m6 = halfMask(N6, 1301 + k * 17 + (k === focusEx ? off : 0));
      const m7 = halfMask(N7, 1307 + k * 19 + (k === focusEx ? off : 0));
      ex.push({ t, pic: k + 1, m6, m7, ...forwardEx(k + 1, m6, m7) });
    });
    return ex;
  };
  // choose the focus example's masks so a lit fc7 lantern S keeps burning while its nearest fc6 lantern N, lit in
  // the example before, is snuffed (the seeds stay seeded: we only pick which seeded draw is used)
  for (let off = 0; off < 400; off += 1) {
    const ex = build(off);
    const A = ex[focusEx]; // the example before (index shifted by the leading example -1)
    const B = ex[focusEx + 1];
    let best: { S: number; N: number; d: number } | null = null;
    for (let s = 3; s < N7 - 3; s++) {
      if (!(A.g7[s] > 0.55 && B.g7[s] > 0.55)) continue;
      for (let n = 0; n < N6; n++) {
        if (!(A.g6[n] > 0 && B.m6[n] === 0)) continue;
        const d = Math.abs(pos.fc6(n).x - pos.fc7(s).x) + (W2[s][n] > 0.5 ? 0 : 200);
        if (!best || d < best.d) best = { S: s, N: n, d };
      }
    }
    if (best && best.d < 80) return { ex, focus: { S: best.S, N: best.N } };
  }
  return { ex: build(0), focus: { S: 6, N: 6 } };
}

// ------------------------------------------------------------------------------------------------ set pieces
/** the two flanking towers: tall dark shafts with lancet windows cut through (holes), pinnacles and buttresses */
export function towers(c: C, env: PaintEnv): void {
  // the cathedral's two towers as ch08-s05 draws them: a shaft in spire ink (one step lighter than the figure's
  // near-black), buttress steps, a column of lit lancet slits, and a pyramid spire between two corner pinnacles
  const m = env.mood;
  const ink = mixLab(m.ink, m.set, 0.16);
  for (const cx of GEO.towers) {
    const hw = GEO.towerHW;
    const x = cx - hw;
    const w = hw * 2;
    const top = 40;
    c.fillStyle = ink;
    c.fillRect(x, top, w, 900 - top);
    c.fillRect(x - 12, 300, w + 24, 12);
    c.fillRect(x - 18, 540, w + 36, 14);
    // the spire and its corner pinnacles (s05's tower top, scaled to this tower's width)
    c.beginPath();
    c.moveTo(x - 6, top);
    c.lineTo(cx, top - w * 1.4);
    c.lineTo(x + w + 6, top);
    c.closePath();
    c.fill();
    for (const px of [x - 3, x + w + 3]) {
      c.beginPath();
      c.moveTo(px - 8, top + 6);
      c.lineTo(px, top - 44);
      c.lineTo(px + 8, top + 6);
      c.closePath();
      c.fill();
    }
    // slits that catch the dawn (s05: halo at 0.35)
    c.fillStyle = withAlpha(m.halo, 0.35);
    for (const dx of [-22, 22])
      for (let y = 90; y < 700; y += 70) {
        const sx = cx + dx;
        c.beginPath();
        c.moveTo(sx - 7, y + 40);
        c.lineTo(sx - 7, y + 10);
        c.quadraticCurveTo(sx, y, sx + 7, y + 10);
        c.lineTo(sx + 7, y + 40);
        c.closePath();
        c.fill();
      }
  }
}

/** the hall beams, the crown beam and the stencil stub (static L4 art) */
export function beams(c: C, env: PaintEnv): void {
  const ink = env.fill('ink');
  const set = mixLab(env.fill('ink'), env.fill('set'), 0.35);
  const m = env.mood;
  const L = GEO.towers[0] + GEO.towerHW;
  const R = GEO.towers[1] - GEO.towerHW;
  const beam = (y: number, h: number) => {
    c.fillStyle = ink;
    c.fillRect(L, y - h / 2, R - L, h);
    c.fillRect(L, y + h / 2 + 2, R - L, 2);
    // brackets into the towers
    for (const [x, s] of [
      [L, 1],
      [R, -1],
    ] as const) {
      c.beginPath();
      c.moveTo(x, y + h / 2);
      c.lineTo(x, y + h / 2 + 30);
      c.quadraticCurveTo(x + s * 4, y + h / 2 + 6, x + s * 30, y + h / 2);
      c.closePath();
      c.fill();
    }
    c.strokeStyle = withAlpha(m.rim, 0.32);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(L, y - h / 2 + 0.5);
    c.lineTo(R, y - h / 2 + 0.5);
    c.stroke();
  };
  beam(GEO.crownY, 8);
  beam(GEO.fc7Y, 11);
  beam(GEO.fc6Y, 11);
  // cords for the hall lanterns
  c.strokeStyle = ink;
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i < N6; i++) {
    const p = pos.fc6(i);
    c.moveTo(p.x, GEO.fc6Y + 5);
    c.lineTo(p.x, p.y - GEO.r * 1.15);
  }
  for (let i = 0; i < N7; i++) {
    const p = pos.fc7(i);
    c.moveTo(p.x, GEO.fc7Y + 5);
    c.lineTo(p.x, p.y - GEO.r * 1.15);
  }
  for (let i = 0; i < N8; i++) {
    const p = pos.fc8(i);
    c.moveTo(p.x, GEO.crownY + 4);
    c.lineTo(p.x, p.y - 6);
  }
  c.stroke();
  // the stub: conv5 (the top stencil course, six lit windows) on a plinth with the round picture window
  const stub = new Path2D();
  stub.moveTo(470, GEO.ground + 200);
  stub.lineTo(470, GEO.plinthTop + 6);
  stub.lineTo(462, GEO.plinthTop);
  stub.lineTo(512, GEO.plinthTop);
  stub.lineTo(512, GEO.stubTop + 4);
  stub.lineTo(506, GEO.stubTop);
  stub.lineTo(774, GEO.stubTop);
  stub.lineTo(768, GEO.stubTop + 4);
  stub.lineTo(768, GEO.plinthTop);
  stub.lineTo(818, GEO.plinthTop);
  stub.lineTo(810, GEO.plinthTop + 6);
  stub.lineTo(810, GEO.ground + 200);
  stub.closePath();
  for (let i = 0; i < NS; i++) {
    const p = pos.stub(i);
    stub.moveTo(p.x - 8, p.y + 14);
    stub.lineTo(p.x - 8, p.y - 4);
    stub.quadraticCurveTo(p.x - 8, p.y - 14, p.x, p.y - 16);
    stub.quadraticCurveTo(p.x + 8, p.y - 14, p.x + 8, p.y - 4);
    stub.lineTo(p.x + 8, p.y + 14);
    stub.closePath();
  }
  const W = GEO.win;
  stub.moveTo(W.x + W.r + 9, W.y);
  stub.arc(W.x, W.y, W.r + 9, 0, Math.PI * 2);
  c.fillStyle = set;
  c.fill(stub, 'evenodd');
  // a few masonry joints on the plinth
  c.strokeStyle = withAlpha(m.rim, 0.12);
  c.lineWidth = 1;
  for (const y of [GEO.plinthTop + 30, GEO.plinthTop + 64]) {
    c.beginPath();
    c.moveTo(470, y);
    c.lineTo(W.x - W.r - 14, y);
    c.moveTo(W.x + W.r + 14, y);
    c.lineTo(810, y);
    c.stroke();
  }
  // the window's ring of tracery
  c.strokeStyle = ink;
  c.lineWidth = 5;
  c.beginPath();
  c.arc(W.x, W.y, W.r + 5, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(m.rim, 0.4);
  c.lineWidth = 1;
  c.beginPath();
  c.arc(W.x, W.y, W.r + 8.5, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  // the floor
  c.fillStyle = ink;
  c.fillRect(-400, GEO.ground, 2100, 300);
  c.fillStyle = withAlpha(m.rim, 0.22);
  c.fillRect(-400, GEO.ground, 2100, 1);
}

/** one of the crown's small lanterns */
export function tinyLantern(c: C, env: PaintEnv, x: number, y: number, act: number): void {
  const m = env.mood;
  const unlit = mixLab(env.fill('set'), m.ink, 0.35);
  if (act > 0.2) glow(c, x, y, 7 + 14 * act, m.halo, 0.32 * act);
  c.fillStyle = act > 0.02 ? mixLab(unlit, mixLab(m.halo, m.core, act), Math.min(1, 0.25 + act)) : unlit;
  c.beginPath();
  c.ellipse(x, y, 3.6, 5.6, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 0.9;
  c.stroke();
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 2.2, y - 6.6, 4.4, 1.6);
}

/** a curl of smoke rising from a snuffed wick (age in seconds, 0..1.6) */
export function wisp(c: C, env: PaintEnv, x: number, y: number, age: number, seed: number): void {
  if (age < 0 || age > 1.6) return;
  const spr = softSprite(mixLab(env.mood.haze, env.mood.halo, 0.45), 0.15);
  c.save();
  for (let i = 0; i < 4; i++) {
    const a = age - i * 0.09;
    if (a <= 0) continue;
    const u = a / 1.5;
    if (u >= 1) continue;
    const h = hash1(i, seed);
    const yy = y - 8 - 58 * Math.pow(u, 0.75);
    const xx = x + Math.sin(u * 5 + h * 6) * 6 * u + (h - 0.5) * 6 * u;
    const r = 4 + 13 * Math.sqrt(u);
    c.globalAlpha = 0.85 * (1 - u) * Math.min(1, u * 8);
    c.drawImage(spr, xx - r, yy - r, r * 2, r * 2);
  }
  c.restore();
  // the dying ember on the wick
  if (age < 0.6) glow(c, x, y + 2, 6, env.mood.core, 0.7 * (1 - age / 0.6));
}
