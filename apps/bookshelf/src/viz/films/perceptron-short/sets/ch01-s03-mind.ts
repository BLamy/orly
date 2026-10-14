/**
 * perceptron-short — ch01-s03: "inside the machine's mind", the shot's own staging of the perceptron
 * teaching machine. A REAL training record (the kit's perceptron: horizontal vs vertical bars;
 * w ← w + η·target·a on mistakes only), started from small seeded random dial settings
 * (sets/ch01-s03-mind-init.ts, |w| ≤ 0.6 in tenths) so every lit cell's dial visibly tugs the needle:
 *
 *   MIND_RUN = trainFromRandom({ seed: 911, wSeed: 13, steps: 120 })   (wiring seed 101, η = 1)
 *     try 1 hbar → VERTICAL ✗ (sum −3.0: the bias nudges the needle right, then the pulses step it
 *     left, 12° → −39°)   try 2 vbar → HORIZONTAL ✗ (2.8)   try 3 hbar → VERTICAL ✗ (−1.3)
 *     try 4 vbar → VERTICAL ✓ (−5.2)   try 5 hbar → HORIZONTAL ✓ (3.7)   (then R R R; held-out
 *     accuracy 0.70 after five, 0.95 after 120; verified offline). The shared PERCEPTRON_RUN is untouched.
 *
 * Staging:
 *   - the retina is a 20 × 20 grid in a brass-rimmed camera-box housing (the s01/s02 eye); the shown
 *     shape is bright and glowing. Between tries the old shape fades OUT (0.15 s) and the plate stays
 *     blank for a beat before the next fades IN, so two bars never overlap into a '+'
 *   - its threads run into a short PATCH TANGLE (a narrow plugboard echoing s02's) and cross there
 *     before reaching the dials (A-units), so it never reads as pixel-to-dial wiring
 *   - each dial's string to the response unit has thickness |w|; the dials start at small random settings
 *   - "tug": pulses run from each fired dial along its string INTO the response unit, and the needle
 *     steps by that dial's weight as each pulse arrives (the running total), then shivers as it settles
 *   - the response dial has a threshold mark at 12 o'clock; HORIZONTAL is right of it (total > 0),
 *     VERTICAL otherwise; the side that wins lights when the total settles
 *   - a wrong verdict: the needle shudders and the lantern's wick gutters out: an unlit, dark-amber paper
 *     lantern (no second hue; the shot's one accent stays the warm flare)
 *   - a nudge (mistakes only): the untouched dials dim, the nudged ones turn with thick pointers and
 *     thick arc arrows, their strings swell with a pulse running along each
 *   - the response lantern hangs on the dial's bracket arm: it flares warm on a right answer
 *
 *   mindMachine(c, { x, y, w, step, run?, reveal?, floorY?, headers?, lantern? }, env)
 *   mindGeo(o) -> { dial, lantern, retina, knobs }
 *   phaseOf(step) / needleOf(run, step)
 *
 * Step semantics (fractional tries): within try k, u = step − k:
 *   .00–.06 the previous shape fades out · .06–.09 blank · .09–.20 the new shape fades in ·
 *   .20–.30 the lit cells fire their threads into the dials · .30–.42 pulses run dial → response unit,
 *   the needle stepping with the running total · .42–.48 the needle settles on the total, the answer
 *   lights · .55–.65 verdict (shudder + cold wick on a wrong; flare on a right) · .68–.92 the dials turn
 *   (mistakes only) · .92–.95 the arc arrows fade · then holds.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { MFONT, clamp01, glow, label, paperLantern, ramp, smooth, thread, threadPoint, weightColor } from '../../../film/silhouette/metaphors/kit';
import { N_A, RETINA, TASK, TASK_NAMES } from '../../../film/silhouette/metaphors/perceptronMath';
import { trainFromRandom } from './ch01-s03-mind-init';

export type MindRun = ReturnType<typeof trainFromRandom>;
export const MIND_RUN = trainFromRandom({ seed: 911, wSeed: 13, steps: 120 });
/** index of the first correct presentation (3 for MIND_RUN) */
export const firstRight = (run: MindRun) => run.steps.findIndex((s) => !s.error);
/** pointer turn per unit of weight (rad): 40° */
const PER_W = (40 * Math.PI) / 180;
const MAX_ANG = Math.PI * 0.8;
/** needle sweep (rad) either side of the threshold mark */
const SWEEP = Math.PI * 0.42;

export interface MindOpts {
  x: number;
  y: number;
  w: number;
  step: number;
  reveal?: number;
  floorY?: number;
  /** per-header alpha (0..1), staged by the shot */
  headers?: { retina?: number; dials?: number; response?: number };
  /** the training record to show (default MIND_RUN) */
  run?: MindRun;
  /** override the response lantern: act (0..1 warm light), flare (0..1), cold (0..1 guttering wick) */
  lantern?: { act: number; flare: number; cold: number };
  /** 0..1: the shown image gives way to both learned shapes ghosted side by side (horizontal | vertical) */
  pair?: number;
  /** 0..1: the threshold mark brightens into an engraved line through the face, labelled 'threshold' */
  threshold?: number;
  /** a faint second needle (−1..1 of the sweep, + = HORIZONTAL) at alpha a: an earlier answer, for comparison
   * (with an optional small italic label along it, e.g. "try 1") */
  ghost?: { pos: number; a: number; label?: string };
  /** a faint ghost tick on the face at the CORRECT side (pos −1..1 of the sweep): the target the nudged
   * dials push toward */
  target?: { pos: number; a: number };
  /** 0..1: the answer is spent: the needle eases back to the threshold mark and the lit side goes dark */
  rest?: number;
  /** 0..1: the machine goes idle (the limit passage): the shown image and its live threads fade out, the
   * dials keep their learned settings but dim, so the plates carry the light */
  idle?: number;
  /** added to the needle position (−1..1 of the sweep, + = HORIZONTAL): a guess before the real swing (the
   * shot's twitch on "it guesses") */
  kick?: number;
  /** 0..1: the needle hovers at the threshold mark (trembling) instead of following the running total, while
   * the pulses are still arriving; released, it tips to the settled answer (try 4's "and then, quite suddenly") */
  hover?: number;
  /** 0..1 alpha of the gauge's VERTICAL / HORIZONTAL face labels (default 1): the shot fades them as the XOR
   * plate comes in over the gauge (review round 4: no 'TICAL' collision with the plate's caption) */
  faceLabels?: number;
}

interface Geo {
  s: number;
  rx: number;
  ry: number;
  cell: number;
  kx: number;
  ky: number;
  kp: number;
  kr: number;
  dx: number;
  dy: number;
  dr: number;
  /** the patch tangle panel */
  px0: number;
  px1: number;
  py0: number;
  py1: number;
}
function geo(o: Pick<MindOpts, 'x' | 'y' | 'w'>): Geo {
  const s = o.w / 1280;
  const kx = o.x + 548 * s;
  const ky = o.y + 196 * s;
  const kp = 41 * s;
  return {
    s,
    rx: o.x + 52 * s,
    ry: o.y + 180 * s,
    cell: 15 * s,
    kx,
    ky,
    kp,
    kr: 14.5 * s,
    dx: o.x + 1062 * s,
    dy: o.y + 372 * s,
    dr: 158 * s,
    px0: o.x + 412 * s,
    px1: o.x + 482 * s,
    py0: ky - kp * 0.6,
    py1: ky + kp * 7.6,
  };
}
const knobPos = (g: Geo, i: number) => ({ x: g.kx + (i % 8) * g.kp, y: g.ky + Math.floor(i / 8) * g.kp });
const cellPos = (g: Geo, k: number) => ({ x: g.rx + ((k % RETINA) + 0.5) * g.cell, y: g.ry + (Math.floor(k / RETINA) + 0.5) * g.cell });
const lanternOf = (g: Geo) => ({ x: g.dx + g.dr * 0.7, y: g.dy + g.dr * 0.8, r: 57 * g.s });

export function mindGeo(o: Pick<MindOpts, 'x' | 'y' | 'w'>) {
  const g = geo(o);
  const RS = g.cell * RETINA;
  return {
    dial: { x: g.dx, y: g.dy, r: g.dr },
    lantern: lanternOf(g),
    retina: { x: g.rx, y: g.ry, size: RS },
    knobs: { x: g.kx - g.kp * 0.75, y: g.ky - g.kp * 0.8, w: g.kp * 8.5, h: g.kp * 8.5 },
  };
}

// ---------------------------------------------------------------- phases
export function phaseOf(step: number, run: MindRun = MIND_RUN) {
  const N = run.steps.length;
  const sc = Math.max(0, Math.min(N - 1e-6, step));
  const k = Math.floor(sc);
  return { k, u: sc - k, st: run.steps[k], prev: k > 0 ? run.steps[k - 1] : null };
}
/** needle position (−1..1 of the sweep; + = HORIZONTAL side) for a running total */
const needleFor = (sum: number) => Math.sign(sum) * 0.92 * Math.pow(Math.min(1, Math.abs(sum) / 8), 0.6);
/** the order in which the fired dials' pulses reach the response unit (seeded, stable) */
function arrival(i: number) {
  let x = Math.imul(i ^ 0x5bd1e995, 0x27d4eb2d);
  x ^= x >>> 15;
  return 0.12 + 0.76 * ((x >>> 0) / 4294967296);
}
/** running total as the pulses arrive (u in the .30–.42 band), the bias counted first */
function runningSum(st: MindRun['steps'][number], v: number) {
  let s = st.wBefore[N_A] * clamp01(v / 0.12);
  for (let i = 0; i < N_A; i++) if (st.a[i]) s += st.wBefore[i] * smooth(clamp01((v - arrival(i)) / 0.1));
  return s;
}
/** the needle at this step (also used by the shot for the shudder glint) */
export const needleAt = (sum: number) => needleFor(sum);
export function needleOf(run: MindRun, step: number): number {
  const { u, st, prev } = phaseOf(step, run);
  const prevPos = prev ? needleFor(prev.sum) : 0;
  if (u < 0.3) return prevPos * (1 - smooth(ramp(u, 0, 0.2)));
  if (u < 0.42) return needleFor(runningSum(st, ramp(u, 0.3, 0.42)));
  const settle = ramp(u, 0.42, 0.48);
  const k = 1.6;
  const v = settle - 1;
  const over = settle >= 1 ? 1 : 1 + (k + 1) * v * v * v + k * v * v;
  const end = needleFor(st.sum);
  const from = needleFor(runningSum(st, 1));
  let n = from + (end - from) * over;
  // the settling shiver: the total is in, the needle trembles once before the answer lights
  if (u < 0.47) n += 0.035 * Math.sin((u - 0.42) * 420) * (1 - ramp(u, 0.42, 0.47));
  // a wrong verdict: the needle shudders where it landed (a visible "no"), then settles
  if (st.error && u >= 0.55 && u < 0.64) n += 0.075 * Math.sin((u - 0.55) * 190) * (1 - ramp(u, 0.55, 0.64));
  return n;
}

// ---------------------------------------------------------------- wiring (retina → tangle → dials)
const h01 = (i: number, s: number) => {
  let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s, 0xc2b2ae35);
  x ^= x >>> 15;
  x = Math.imul(x, 0x27d4eb2d);
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
};
/** each A-unit's jack pair on the patch panel: an IN jack at the left, an OUT jack at the right */
function jacks(g: Geo, i: number) {
  const yIn = g.py0 + (g.py1 - g.py0) * (0.04 + 0.92 * h01(i, 41));
  const yOut = knobPos(g, i).y + (h01(i, 43) - 0.5) * g.kp * 0.5;
  return { a: { x: g.px0 + 9 * g.s, y: yIn }, b: { x: g.px1 - 9 * g.s, y: yOut } };
}
function wirePath(g: Geo, i: number, k: number, p: Path2D) {
  const a = cellPos(g, k);
  const J = jacks(g, i);
  const mx = (a.x + J.a.x) / 2;
  p.moveTo(a.x, a.y);
  p.bezierCurveTo(mx, a.y, mx, J.a.y, J.a.x, J.a.y);
}
/** the patch cord inside the panel (in jack → out jack, sagging and crossing its neighbours) */
function cordPath(g: Geo, i: number, p: Path2D) {
  const J = jacks(g, i);
  const sag = (10 + 16 * h01(i, 47)) * g.s;
  p.moveTo(J.a.x, J.a.y);
  p.bezierCurveTo(J.a.x + 18 * g.s, J.a.y + sag, J.b.x - 18 * g.s, J.b.y + sag, J.b.x, J.b.y);
}
/** from the out jack to the dial */
function leadPath(g: Geo, i: number, p: Path2D) {
  const J = jacks(g, i);
  const b = knobPos(g, i);
  const mx = (J.b.x + b.x - g.kr) / 2;
  p.moveTo(J.b.x, J.b.y);
  p.bezierCurveTo(mx, J.b.y, mx, b.y, b.x - g.kr, b.y);
}
/** the two shapes it learned, side by side: a horizontal bar (left half) | a vertical bar (right half) */
const PAIR = (() => {
  const px = new Uint8Array(RETINA * RETINA);
  for (let r = 0; r < RETINA; r++)
    for (let c = 0; c < RETINA; c++) {
      const h = r >= 9 && r <= 10 && c >= 2 && c <= 7;
      const v = c >= 14 && c <= 15 && r >= 6 && r <= 13;
      px[r * RETINA + c] = h || v ? 1 : 0;
    }
  return px;
})();
const STATIC = new Map<string, { wires: Path2D; cords: Path2D; leads: Path2D; jackDots: Path2D }>();
const knobAng = (w: number) => -Math.PI / 2 + Math.max(-MAX_ANG, Math.min(MAX_ANG, w * PER_W));

export function mindMachine(c: CanvasRenderingContext2D, o: MindOpts, env: PaintEnv): void {
  const g = geo(o);
  const RUN = o.run ?? MIND_RUN;
  const m = env.mood;
  const ink = env.fill('ink');
  const reveal = o.reveal ?? 1;
  const idle = smooth(clamp01(o.idle ?? 0));
  const { k, u, st, prev } = phaseOf(o.step, RUN);
  void k;
  const fireU = smooth(ramp(u, 0.2, 0.3));
  const tugU = ramp(u, 0.3, 0.42);
  const answered = u >= 0.47;
  const verdictU = smooth(ramp(u, 0.55, 0.65));
  const turnU = st.error ? smooth(ramp(u, 0.68, 0.92)) : 0;
  const nudging = st.error && u >= 0.66 && u < 0.95;
  // a nudge in progress: everything the rule does NOT touch steps back to half value
  const focus = st.error ? smooth(ramp(u, 0.6, 0.68)) * (1 - smooth(ramp(u, 0.95, 0.995))) : 0;
  const w = new Float32Array(N_A + 1);
  for (let i = 0; i <= N_A; i++) w[i] = st.wBefore[i] + (st.wAfter[i] - st.wBefore[i]) * turnU;
  const H = o.headers ?? {};
  const rv = (a: number, b: number) => smooth(ramp(reveal, a, b));
  const floorY = o.floorY ?? o.y + 600 * g.s;
  const RS = g.cell * RETINA;
  const brass = mixLab(m.rim, m.core, 0.3);
  const lan = lanternOf(g);
  const key = `${g.rx},${g.ry},${g.s}`;
  let S = STATIC.get(key);
  if (!S) {
    const wires = new Path2D();
    const cords = new Path2D();
    const leads = new Path2D();
    const jackDots = new Path2D();
    RUN.units.forEach((un, i) => {
      un.cells.forEach((cc) => wirePath(g, i, cc, wires));
      cordPath(g, i, cords);
      leadPath(g, i, leads);
      const J = jacks(g, i);
      for (const q of [J.a, J.b]) {
        jackDots.moveTo(q.x + 2.2 * g.s, q.y);
        jackDots.arc(q.x, q.y, 2.2 * g.s, 0, Math.PI * 2);
      }
    });
    S = { wires, cords, leads, jackDots };
    STATIC.set(key, S);
  }

  // ---------------------------------------------------------------- stands
  const standA = rv(0, 0.3);
  if (standA > 0) {
    c.save();
    c.globalAlpha *= standA;
    c.fillStyle = ink;
    c.strokeStyle = ink;
    // the retina's pedestal: a column on a weighted base (the s02 eye's), not a tripod
    const cx = g.rx + RS * 0.5;
    c.fillRect(cx - 7 * g.s, g.ry + RS + 18 * g.s, 14 * g.s, floorY - (g.ry + RS + 18 * g.s));
    c.fillRect(cx - 10 * g.s, floorY - 120 * g.s, 20 * g.s, 12 * g.s);
    c.beginPath();
    c.moveTo(cx - 64 * g.s, floorY);
    c.lineTo(cx - 46 * g.s, floorY - 18 * g.s);
    c.lineTo(cx + 46 * g.s, floorY - 18 * g.s);
    c.lineTo(cx + 64 * g.s, floorY);
    c.closePath();
    c.fill();
    c.fillRect(cx - 26 * g.s, g.ry + RS + 18 * g.s, 52 * g.s, 9 * g.s);
    // the patch panel: a narrow upright frame between the retina and the dials
    c.fillRect(g.px0 - 6 * g.s, g.py0 - 14 * g.s, 6 * g.s, floorY - g.py0 + 14 * g.s);
    c.fillRect(g.px1, g.py0 - 14 * g.s, 6 * g.s, floorY - g.py0 + 14 * g.s);
    c.fillRect(g.px0 - 10 * g.s, g.py0 - 18 * g.s, g.px1 - g.px0 + 20 * g.s, 8 * g.s);
    c.fillRect(g.px0 - 6 * g.s, floorY - 40 * g.s, g.px1 - g.px0 + 12 * g.s, 7 * g.s);
    // the dial rack frame
    const kx0 = g.kx - g.kp * 0.75;
    const kx1 = g.kx + g.kp * 7.75;
    const ky0 = g.ky - g.kp * 0.8;
    const ky1 = g.ky + g.kp * 7.7;
    c.fillRect(kx0 - 8 * g.s, ky0 - 14 * g.s, 9 * g.s, floorY - ky0 + 14 * g.s);
    c.fillRect(kx1 - 1 * g.s, ky0 - 14 * g.s, 9 * g.s, floorY - ky0 + 14 * g.s);
    c.fillRect(kx0 - 14 * g.s, ky0 - 14 * g.s, kx1 - kx0 + 28 * g.s, 10 * g.s);
    c.fillRect(kx0 - 8 * g.s, ky1, kx1 - kx0 + 16 * g.s, 8 * g.s);
    c.fillRect(kx0 - 8 * g.s, floorY - 40 * g.s, kx1 - kx0 + 16 * g.s, 8 * g.s);
    for (const px of [kx0 - 3.5 * g.s, kx1 + 3.5 * g.s]) {
      c.beginPath();
      c.arc(px, ky0 - 20 * g.s, 6 * g.s, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = withAlpha(m.rim, 0.5);
    for (let i = 0; i <= 8; i++) {
      const x = kx0 + ((kx1 - kx0) * i) / 8;
      c.beginPath();
      c.arc(x, ky0 - 9 * g.s, 1.6 * g.s, 0, Math.PI * 2);
      c.arc(x, ky1 + 4 * g.s, 1.6 * g.s, 0, Math.PI * 2);
      c.fill();
    }
    // dial column, plinth, and the bracket arm the response lantern hangs from
    c.fillStyle = ink;
    c.fillRect(g.dx - 7 * g.s, g.dy, 14 * g.s, floorY - g.dy);
    c.fillRect(g.dx - 34 * g.s, floorY - 12 * g.s, 68 * g.s, 12 * g.s);
    c.fillRect(g.dx - 22 * g.s, floorY - 20 * g.s, 44 * g.s, 8 * g.s);
    c.lineWidth = 5 * g.s;
    c.beginPath();
    c.moveTo(g.dx, g.dy + g.dr * 0.3);
    c.quadraticCurveTo(lan.x - g.dr * 0.2, g.dy + g.dr * 0.2, lan.x, g.dy + g.dr * 0.26);
    c.stroke();
    c.restore();
  }

  // ---------------------------------------------------------------- retina in its camera-box housing
  const plateA = rv(0, 0.25);
  if (plateA > 0) {
    c.save();
    c.globalAlpha *= plateA;
    const P = 20 * g.s;
    c.fillStyle = ink;
    c.beginPath();
    c.roundRect(g.rx - P, g.ry - P, RS + 2 * P, RS + 2 * P, 6 * g.s);
    c.fill();
    // carry handle on top (the s02 eye's)
    c.lineWidth = 7 * g.s;
    c.strokeStyle = ink;
    c.beginPath();
    c.moveTo(g.rx + RS * 0.38, g.ry - P);
    c.lineTo(g.rx + RS * 0.38, g.ry - P - 16 * g.s);
    c.quadraticCurveTo(g.rx + RS * 0.5, g.ry - P - 26 * g.s, g.rx + RS * 0.62, g.ry - P - 16 * g.s);
    c.lineTo(g.rx + RS * 0.62, g.ry - P);
    c.stroke();
    c.strokeStyle = withAlpha(brass, 0.45);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(g.rx + RS * 0.38 - 3.5 * g.s, g.ry - P - 16 * g.s);
    c.quadraticCurveTo(g.rx + RS * 0.5, g.ry - P - 30 * g.s, g.rx + RS * 0.62 + 3.5 * g.s, g.ry - P - 16 * g.s);
    c.stroke();
    // brass bezel + screws
    c.strokeStyle = withAlpha(brass, 0.75);
    c.lineWidth = 2.2 * g.s;
    c.beginPath();
    c.roundRect(g.rx - 7 * g.s, g.ry - 7 * g.s, RS + 14 * g.s, RS + 14 * g.s, 3 * g.s);
    c.stroke();
    c.fillStyle = withAlpha(brass, 0.7);
    for (const [x, y] of [
      [g.rx - P + 7 * g.s, g.ry - P + 7 * g.s],
      [g.rx + RS + P - 7 * g.s, g.ry - P + 7 * g.s],
      [g.rx - P + 7 * g.s, g.ry + RS + P - 7 * g.s],
      [g.rx + RS + P - 7 * g.s, g.ry + RS + P - 7 * g.s],
    ]) {
      c.beginPath();
      c.arc(x, y, 2.4 * g.s, 0, Math.PI * 2);
      c.fill();
    }
    // unlit lenses: dim cells with a faint rim, so the plate reads as a 20 × 20 grid at phone size
    const lens = new Path2D();
    for (let j = 0; j < RETINA * RETINA; j++) {
      const p = cellPos(g, j);
      lens.moveTo(p.x + g.cell * 0.4, p.y);
      lens.arc(p.x, p.y, g.cell * 0.4, 0, Math.PI * 2);
    }
    c.fillStyle = mixLab(m.ink, m.core, 0.17);
    c.fill(lens);
    c.strokeStyle = withAlpha(m.rim, 0.2);
    c.lineWidth = 0.7;
    c.stroke(lens);
    // the image: the previous one fades OUT, the plate rests blank, then the new one fades IN
    const drawImg = (px: Uint8Array, a: number) => {
      if (a <= 0.01) return;
      const lit = new Path2D();
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (let j = 0; j < px.length; j++) {
        if (!px[j]) continue;
        const p = cellPos(g, j);
        lit.moveTo(p.x + g.cell * 0.47, p.y);
        lit.arc(p.x, p.y, g.cell * 0.47, 0, Math.PI * 2);
        sx += p.x;
        sy += p.y;
        n++;
      }
      c.globalAlpha = plateA * a;
      if (n) glow(c, sx / n, sy / n, g.cell * 7, m.halo, 0.5);
      c.fillStyle = m.core;
      c.fill(lit);
    };
    const pair = o.pair ?? 0;
    if (prev) drawImg(prev.img.px, (1 - smooth(ramp(u, 0, 0.06))) * (1 - pair));
    drawImg(st.img.px, smooth(ramp(u, 0.09, 0.2)) * (1 + 0.25 * Math.sin(Math.PI * fireU)) * (1 - pair) * (1 - idle));
    if (pair > 0.01) {
      drawImg(PAIR, 0.6 * pair);
      // a hairline divides the two halves of the plate
      c.globalAlpha = plateA * pair * 0.5;
      c.fillStyle = m.rim;
      c.fillRect(g.rx + RS / 2 - 0.5, g.ry + g.cell * 2, 1, RS - g.cell * 4);
    }
    c.globalAlpha = plateA;
    glow(c, g.rx + RS / 2, g.ry + RS / 2, RS * 0.7, m.halo, 0.16);
    c.restore();
    label(c, 'RETINA · 20 × 20', g.rx + RS / 2, g.ry - 62 * g.s, { size: 20, font: MFONT.type, weight: 400, color: m.rim, align: 'center', alpha: plateA * (H.retina ?? 1), tracking: 2.5, shadow: withAlpha(m.ink, 0.9) });
  }

  // ---------------------------------------------------------------- wires: retina → patch tangle → dials
  const wireA = rv(0.2, 0.5);
  if (wireA > 0) {
    c.save();
    c.globalAlpha *= wireA * 0.16;
    c.strokeStyle = mixLab(m.set, m.rim, 0.25);
    c.lineWidth = 0.5;
    c.stroke(S.wires);
    c.globalAlpha = wireA * 0.3;
    c.lineWidth = 0.8;
    c.stroke(S.cords);
    c.globalAlpha = wireA * 0.18;
    c.lineWidth = 0.6;
    c.stroke(S.leads);
    c.globalAlpha = wireA * 0.7;
    c.fillStyle = mixLab(m.set, m.rim, 0.45);
    c.fill(S.jackDots);
    c.restore();
    if (fireU > 0) {
      // the lit cells fire: their threads light, through the tangle, to the dials they feed
      const live = new Path2D();
      const liveC = new Path2D();
      RUN.units.forEach((un, i) => {
        if (!st.a[i]) return;
        un.cells.forEach((cc, kk) => {
          if (st.img.px[cc] && un.sign[kk] > 0) wirePath(g, i, cc, live);
        });
        cordPath(g, i, liveC);
        leadPath(g, i, liveC);
      });
      const fade = 1 - 0.6 * smooth(ramp(u, 0.5, 0.66));
      c.save();
      c.globalAlpha *= fireU * 0.85 * wireA * fade * (1 - idle);
      c.strokeStyle = mixLab(m.rim, m.core, 0.5);
      c.lineWidth = 1;
      c.stroke(live);
      c.lineWidth = 1.3;
      c.stroke(liveC);
      c.restore();
    }
  }

  // ---------------------------------------------------------------- strings A → R (thickness = |w|)
  // the strings into the response unit come in only once its dial is up (review round 1: never threads
  // converging on an empty point)
  const strA = rv(0.62, 0.9);
  const hub = { x: g.dx - g.dr * 0.9, y: g.dy - g.dr * 0.12 };
  if (strA > 0) {
    const pulses: { x: number; y: number; a: number; r: number }[] = [];
    for (let i = 0; i < N_A; i++) {
      const p = knobPos(g, i);
      const on = st.a[i] ? fireU : 0;
      const wi = w[i];
      const touched = st.error && st.a[i];
      const geom = { x0: p.x + g.kr, y0: p.y, x1: hub.x, y1: hub.y, sag: (14 * g.s) / (1 + Math.abs(wi) * 0.3) };
      // the tug: a pulse runs from each fired dial INTO the response unit
      if (st.a[i] && tugU > 0 && tugU < 1) {
        const v = clamp01((tugU - (arrival(i) - 0.14)) / 0.14);
        if (v > 0 && v < 1) pulses.push({ ...threadPoint(geom, v), a: Math.sin(Math.PI * v), r: 8 });
      }
      if (Math.abs(wi) < 0.01 && on <= 0) continue;
      const nudged = touched ? turnU : 0;
      const bright = touched ? Math.sin(Math.PI * turnU) : 0;
      thread(
        c,
        {
          ...geom,
          w: Math.min(4.6, 0.9 + 1.5 * Math.abs(wi) + 1.4 * bright),
          color: wi === 0 ? withAlpha(m.rim, 0.8) : weightColor(m, wi),
          alpha: strA * (1 - 0.55 * idle) * (touched ? 1 : 1 - 0.6 * focus) * Math.min(1, 0.28 + 0.12 * Math.abs(wi) + 0.45 * on + 0.3 * nudged + 0.4 * bright),
        },
        env,
      );
      // the nudge: a bright pulse running along the swelling string, dial → response unit
      if (touched && turnU > 0 && turnU < 1) pulses.push({ ...threadPoint(geom, turnU), a: Math.sin(Math.PI * turnU), r: 11 });
    }
    for (const q of pulses) glow(c, q.x, q.y, q.r * g.s, m.core, 0.9 * q.a * strA);
    // the hub catches each arriving tug
    if (tugU > 0 && tugU < 1) glow(c, hub.x, hub.y, 16 * g.s, m.core, 0.35 * Math.sin(Math.PI * tugU) * strA);
  }

  // ---------------------------------------------------------------- knobs (A-units): the weights as dials
  const knA = rv(0.3, 0.6);
  if (knA > 0) {
    c.save();
    c.globalAlpha *= knA;
    for (let i = 0; i < N_A; i++) {
      const p = knobPos(g, i);
      const fired = st.a[i] ? fireU * (1 - 0.5 * smooth(ramp(u, 0.5, 0.66))) * (1 - idle) : 0;
      const ang = knobAng(w[i]);
      const moving = st.error && st.a[i];
      const turning = moving ? turnU * (1 - turnU) * 4 : 0;
      // nudging dials: pointers and arcs at double weight for the whole nudge
      const thick = moving && nudging ? 1 : 0;
      const kA = moving ? 1 : 1 - 0.6 * focus;
      c.globalAlpha = knA * (1 - 0.35 * idle) * (moving ? 1 : 1 - 0.45 * focus);
      c.fillStyle = ink;
      c.beginPath();
      c.arc(p.x, p.y, g.kr, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = knA * kA;
      c.strokeStyle = withAlpha(m.rim, 0.3 + 0.5 * turning);
      c.lineWidth = 0.8;
      c.beginPath();
      for (let t = -4; t <= 4; t++) {
        const a = -Math.PI / 2 + (t / 4) * MAX_ANG;
        c.moveTo(p.x + Math.cos(a) * g.kr * 1.05, p.y + Math.sin(a) * g.kr * 1.05);
        c.lineTo(p.x + Math.cos(a) * g.kr * 1.3, p.y + Math.sin(a) * g.kr * 1.3);
      }
      c.stroke();
      if (fired > 0) glow(c, p.x, p.y, g.kr * 2.2, m.halo, 0.4 * fired);
      if (turning > 0) glow(c, p.x, p.y, g.kr * 3.2, m.core, 0.55 * turning);
      c.fillStyle = mixLab(mixLab(m.set, m.ink, 0.2), m.core, fired * 0.9);
      c.beginPath();
      c.arc(p.x, p.y, g.kr * 0.42, 0, Math.PI * 2);
      c.fill();
      // the nudge's sweep: a translucent wedge from the old setting to the new one, under the pointer
      if (moving && u >= 0.68) {
        const wA = smooth(ramp(u, 0.68, 0.72)) * (1 - smooth(ramp(u, 0.925, 0.95)));
        const a0 = knobAng(st.wBefore[i]);
        const a1 = knobAng(w[i]);
        if (wA > 0 && Math.abs(a1 - a0) > 0.02) {
          c.fillStyle = withAlpha(m.core, 0.42 * wA);
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.arc(p.x, p.y, g.kr * 0.96, Math.min(a0, a1), Math.max(a0, a1));
          c.closePath();
          c.fill();
          // the old setting, a faint tick it swept away from
          c.strokeStyle = withAlpha(m.rim, 0.55 * wA);
          c.lineWidth = 1.2 * g.s;
          c.beginPath();
          c.moveTo(p.x + Math.cos(a0) * g.kr * 0.4, p.y + Math.sin(a0) * g.kr * 0.4);
          c.lineTo(p.x + Math.cos(a0) * g.kr * 0.96, p.y + Math.sin(a0) * g.kr * 0.96);
          c.stroke();
        }
      }
      // pointer
      c.strokeStyle = moving && nudging ? mixLab(weightColor(m, w[i] || 1), m.core, 0.45) : w[i] === 0 ? withAlpha(m.rim, 0.45) : weightColor(m, w[i]);
      c.lineWidth = (2.2 + 2.6 * thick) * g.s;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(p.x + Math.cos(ang) * g.kr * (0.5 - 0.3 * thick), p.y + Math.sin(ang) * g.kr * (0.5 - 0.3 * thick));
      c.lineTo(p.x + Math.cos(ang) * g.kr * 0.98, p.y + Math.sin(ang) * g.kr * 0.98);
      c.stroke();
      // the turn, as an arc arrow outside the skirt (old angle → new angle), thick
      if (moving && u >= 0.68) {
        const arcA = smooth(ramp(u, 0.68, 0.72)) * (1 - smooth(ramp(u, 0.925, 0.95)));
        if (arcA > 0) {
          const a0 = knobAng(st.wBefore[i]);
          const a1 = knobAng(w[i]);
          const R = g.kr * 1.72;
          const dir = Math.sign(st.wAfter[i] - st.wBefore[i]) || 1;
          c.strokeStyle = withAlpha(m.core, 0.95 * arcA);
          c.lineWidth = 3.4 * g.s;
          c.beginPath();
          c.arc(p.x, p.y, R, Math.min(a0, a1), Math.max(a0, a1));
          c.stroke();
          if (Math.abs(a1 - a0) > 0.15) {
            const hx = p.x + Math.cos(a1) * R;
            const hy = p.y + Math.sin(a1) * R;
            const tx = -Math.sin(a1) * dir;
            const ty = Math.cos(a1) * dir;
            const hs = 8.5 * g.s;
            c.fillStyle = withAlpha(m.core, 0.95 * arcA);
            c.beginPath();
            c.moveTo(hx + tx * hs, hy + ty * hs);
            c.lineTo(hx - tx * hs * 0.4 + Math.cos(a1) * hs * 0.75, hy - ty * hs * 0.4 + Math.sin(a1) * hs * 0.75);
            c.lineTo(hx - tx * hs * 0.4 - Math.cos(a1) * hs * 0.75, hy - ty * hs * 0.4 - Math.sin(a1) * hs * 0.75);
            c.closePath();
            c.fill();
          }
        }
      }
    }
    c.restore();
    label(c, 'WEIGHTS · DIALS', g.kx + g.kp * 3.5, g.ry - 62 * g.s, { size: 20, font: MFONT.type, weight: 400, color: m.rim, align: 'center', alpha: knA * (H.dials ?? 1), tracking: 2.5, shadow: withAlpha(m.ink, 0.9) });
  }

  // ---------------------------------------------------------------- response dial: threshold mark + needle
  const dA = rv(0.45, 0.75);
  if (dA > 0) {
    const R = g.dr;
    const rest = smooth(clamp01(o.rest ?? 0));
    const hov = clamp01(o.hover ?? 0);
    const raw = needleOf(RUN, o.step);
    // hovering: just short of the mark on the side it is heading, trembling
    const hn = Math.sign(needleAt(st.sum) || 1) * (0.05 + 0.035 * Math.sin(u * 900)) ;
    const needle = ((raw * (1 - hov) + hn * hov) + (o.kick ?? 0)) * (1 - rest);
    c.save();
    c.globalAlpha *= dA;
    c.fillStyle = ink;
    c.beginPath();
    c.arc(g.dx, g.dy, R * 1.08, Math.PI, 0);
    c.lineTo(g.dx + R * 1.08, g.dy + R * 0.18);
    c.lineTo(g.dx - R * 1.08, g.dy + R * 0.18);
    c.closePath();
    c.fill();
    // a dim parchment face: the lantern, not the dial, is the warm answer
    const face = c.createRadialGradient(g.dx, g.dy, R * 0.1, g.dx, g.dy, R);
    face.addColorStop(0, withAlpha(m.core, 0.42));
    face.addColorStop(1, withAlpha(m.halo, 0.28));
    c.fillStyle = face;
    c.beginPath();
    c.arc(g.dx, g.dy, R * 0.96, Math.PI, 0);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(m.ink, 0.8);
    c.lineWidth = 1;
    for (let t = -10; t <= 10; t++) {
      if (t === 0) continue;
      const a = -Math.PI / 2 + (t / 10) * SWEEP;
      const r0 = R * (t % 5 === 0 ? 0.74 : 0.82);
      c.beginPath();
      c.moveTo(g.dx + Math.cos(a) * r0, g.dy + Math.sin(a) * r0);
      c.lineTo(g.dx + Math.cos(a) * R * 0.9, g.dy + Math.sin(a) * R * 0.9);
      c.stroke();
    }
    // the threshold mark at 12 o'clock: a heavier line and a small inked notch
    c.lineWidth = 2.6 * g.s;
    c.beginPath();
    c.moveTo(g.dx, g.dy - R * 0.62);
    c.lineTo(g.dx, g.dy - R * 0.95);
    c.stroke();
    c.fillStyle = withAlpha(m.ink, 0.9);
    c.beginPath();
    c.moveTo(g.dx - 7 * g.s, g.dy - R * 1.0);
    c.lineTo(g.dx + 7 * g.s, g.dy - R * 1.0);
    c.lineTo(g.dx, g.dy - R * 0.9);
    c.closePath();
    c.fill();
    // teaching the decision: the threshold mark becomes an engraved line through the face, labelled
    const thr = clamp01(o.threshold ?? 0);
    if (thr > 0.003) {
      c.save();
      c.globalAlpha *= thr;
      glow(c, g.dx, g.dy - R * 0.6, R * 0.45, m.halo, 0.22);
      c.strokeStyle = withAlpha(m.ink, 0.85);
      c.lineWidth = 3.2 * g.s;
      c.beginPath();
      c.moveTo(g.dx, g.dy - R * 0.14);
      c.lineTo(g.dx, g.dy - R * 0.95);
      c.stroke();
      c.strokeStyle = withAlpha(m.core, 0.9);
      c.lineWidth = 1.1 * g.s;
      c.beginPath();
      c.moveTo(g.dx + 1.6 * g.s, g.dy - R * 0.16);
      c.lineTo(g.dx + 1.6 * g.s, g.dy - R * 0.93);
      c.stroke();
      c.restore();
      label(c, 'THRESHOLD', g.dx, g.dy - R * 1.085, { size: 24, font: MFONT.sc, weight: 600, tracking: 2, color: m.core, align: 'center', alpha: thr, shadow: withAlpha(m.ink, 0.95) });
    }
    const fs = 20; // ≥ 30 px at 1080 on the widest framing (review round 1)
    // the side the total landed on lights once it settles (total > 0 → HORIZONTAL)
    const side = answered && rest < 0.5 ? st.out : 0;
    const fl = clamp01(o.faceLabels ?? 1);
    if (fl > 0.003) {
      label(c, TASK_NAMES[TASK[1]].toUpperCase(), g.dx - R * 0.6, g.dy + R * 0.12, { size: fs, font: MFONT.sc, weight: 600, color: side < 0 ? m.core : m.rim, align: 'center', tracking: 1.5, alpha: (side < 0 ? 1 : 0.55) * fl });
      label(c, TASK_NAMES[TASK[0]].toUpperCase(), g.dx + R * 0.6, g.dy + R * 0.12, { size: fs, font: MFONT.sc, weight: 600, color: side > 0 ? m.core : m.rim, align: 'center', tracking: 1.5, alpha: (side > 0 ? 1 : 0.55) * fl });
    }
    if (o.target && o.target.a > 0.003) {
      // the target: a short warm tick just inside the rim, with a soft glow, on the side the answer should be
      const ta = -Math.PI / 2 + o.target.pos * SWEEP;
      const cx = Math.cos(ta);
      const cy = Math.sin(ta);
      c.save();
      c.globalAlpha *= o.target.a;
      glow(c, g.dx + cx * R * 0.82, g.dy + cy * R * 0.82, R * 0.16, m.halo, 0.35);
      c.strokeStyle = withAlpha(m.core, 0.85);
      c.lineWidth = 3 * g.s;
      c.lineCap = 'round';
      c.setLineDash([4 * g.s, 3.5 * g.s]);
      c.beginPath();
      c.moveTo(g.dx + cx * R * 0.6, g.dy + cy * R * 0.6);
      c.lineTo(g.dx + cx * R * 0.93, g.dy + cy * R * 0.93);
      c.stroke();
      c.restore();
    }
    if (o.ghost && o.ghost.a > 0.003) {
      const ga = -Math.PI / 2 + o.ghost.pos * SWEEP;
      c.save();
      c.globalAlpha *= o.ghost.a;
      c.strokeStyle = withAlpha(m.ink, 0.7);
      c.lineWidth = 2.8 * g.s;
      c.lineCap = 'round';
      c.setLineDash([6 * g.s, 5 * g.s]);
      c.beginPath();
      c.moveTo(g.dx, g.dy);
      c.lineTo(g.dx + Math.cos(ga) * R * 0.86, g.dy + Math.sin(ga) * R * 0.86);
      c.stroke();
      c.restore();
      if (o.ghost.label) {
        // along the ghost, on its outer side
        const side = o.ghost.pos >= 0 ? 1 : -1;
        const lx = g.dx + Math.cos(ga) * R * 0.56 + -Math.sin(ga) * 15 * g.s * side;
        const ly = g.dy + Math.sin(ga) * R * 0.56 + Math.cos(ga) * 15 * g.s * side - 4 * g.s;
        label(c, o.ghost.label, lx, ly, { size: 18, font: MFONT.sc, weight: 600, color: m.ink, align: 'center', alpha: o.ghost.a * 0.9 });
      }
    }
    const na = -Math.PI / 2 + needle * SWEEP;
    c.strokeStyle = ink;
    c.lineWidth = 3.4 * g.s;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(g.dx, g.dy);
    c.lineTo(g.dx + Math.cos(na) * R * 0.88, g.dy + Math.sin(na) * R * 0.88);
    c.stroke();
    c.fillStyle = ink;
    c.beginPath();
    c.arc(g.dx, g.dy, 9 * g.s, 0, Math.PI * 2);
    c.fill();
    c.restore();
    // the response lantern: a large paper lantern on the dial's bracket arm
    c.save();
    c.globalAlpha *= dA;
    c.strokeStyle = ink;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(lan.x, g.dy + g.dr * 0.26);
    c.lineTo(lan.x, lan.y - lan.r * 1.15);
    c.stroke();
    c.restore();
    // wrong: the wick catches for a moment and gutters out cold; right: it flares warm
    const gutter = st.error ? 0.42 * Math.sin(Math.PI * smooth(ramp(u, 0.52, 0.66))) + 0.04 * verdictU : 0;
    const L = o.lantern ?? { act: st.error ? gutter : verdictU, flare: st.error ? 0 : verdictU, cold: st.error ? verdictU * (1 - smooth(ramp(u, 0.92, 1))) : 0 };
    paperLantern(c, { x: lan.x, y: lan.y, r: lan.r, act: L.act, flare: L.flare, tassel: true, alpha: dA }, env);
    if (L.cold > 0.01) {
      // the guttered wick: the paper goes unlit, a dark amber (same hue as the flare, no light in it)
      c.save();
      c.globalAlpha *= dA * L.cold * 0.7;
      c.fillStyle = mixLab(m.ink, m.set, 0.4);
      c.beginPath();
      c.ellipse(lan.x, lan.y, lan.r * 0.78, lan.r * 0.95, 0, 0, Math.PI * 2);
      c.fill();
      // the wick's last dull ember
      c.globalAlpha = dA * L.cold * 0.6;
      glow(c, lan.x, lan.y + lan.r * 0.25, lan.r * 0.22, mixLab(m.rim, m.ink, 0.45), 0.35);
      c.restore();
    }
    label(c, 'RESPONSE UNIT', g.dx, g.dy - R * 1.32, { size: 21, font: MFONT.sc, weight: 600, color: m.rim, align: 'center', alpha: dA * (H.response ?? 1) * (1 - 0.45 * thr), tracking: 2.5, shadow: withAlpha(m.ink, 0.9) });
  }
}
