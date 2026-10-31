/**
 * handwired-explained — BOTH BRANCHES RUN (ch04-s04, ch04-s05): two endless belts on the backlit workbench, the 10
 * belt from the left and the 12 belt from the right, each through its own paper shutter, both feeding ONE output tray
 * at the centre. The shutters SCALE what they pass (the rule for the whole dive, TE01/TE10): a tile that passes a
 * shutter open by k comes out re-lettered v × k (computed in FP32 with rampBench's maths), squeezed flatter the more
 * shut the shutter is. A lever above the tray reads the bit and drives both shutters by rods: 10 open by bit,
 * 12 open by 1 − bit.
 *
 *   import { BELT, beltClock, beltRig, beltPhases } from '../sets/ch04-s04-belts';
 *   const u = beltClock.s04(t)  (or .s05(t))        one continuous belt clock across the cut, so every tile carries over
 *   beltRig(c, env, { u, sched, lever, rods, inf, tray })   draw in L4
 *
 * The belts' phases are SOLVED from the locked clock (timeline.json) so that, in ch04-s05, the overflowing tile reaches
 * the shut 10 shutter exactly on 'Nought' and a whole 12 lands in the tray on 'number'.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, legibleSize, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { RB } from './rampBench';
import { WB, lever as leverDraw } from './ch04-s02-workbench';
import timeline from '../timeline.json';

type C = CanvasRenderingContext2D;
type TlShot = { id: string; start: number; end: number; beats?: Record<string, number> };
const shots = (timeline as unknown as { shots: TlShot[] }).shots;
const S4 = shots.find((s) => s.id === 'ch04-s04')!;
const S5 = shots.find((s) => s.id === 'ch04-s05')!;
const D04 = S4.end - S4.start;

// ---------------------------------------------------------------- geometry (L4 rest px)
const V = 63; // belt speed at full run (px/s)
/** review r1: PITCH / V = 1.857 s between tiles, so one tile reaches each shutter on 'bit' and again on 'other' */
const PITCH = 117;
const TILE_S = 1.55;
const BELT_Y = 432; // the belts' top surface (tiles stand on it)
// review r1: the shutters stand at the belts' ends, right at the tray's mouth, so a tile that passes a shutter lands
// ~0.6 s later and the tray answers its beat at once
const L = { x0: 96, x1: 566, sh: 545 };
const R = { x0: 714, x1: 1184, sh: 735 };
const LEN = L.x1 - L.x0;
const FALL = 0.26; // seconds from the belt's end into the tray
const TRAY = { x0: 552, x1: 728, top: 468, floor: 500, slotL: 604, slotR: 676 };
const LEVER = { x: 640, y: 300, r: 50 };

export const BELT = { V, PITCH, BELT_Y, L, R, TRAY, LEVER, TILE_S, D04, BENCH: WB.BENCH } as const;

// ---------------------------------------------------------------- the belt clock and travel
/** belts come up to speed in ch04-s04 (from a crawl at the cut to full run by ~2 s), then run steadily */
const ACC = { a: 0.55, b: 2.05, r0: 0.12 };
export function travel(u: number): number {
  const { a, b, r0 } = ACC;
  const d = b - a;
  let G: number;
  if (u <= a) G = 0;
  else if (u >= b) G = d * 0.5 + (u - b);
  else {
    const x = (u - a) / d;
    G = d * (x * x * x - (x * x * x * x) / 2);
  }
  return V * (r0 * u + (1 - r0) * G);
}
/** the inverse of travel (bisection; travel is monotone) */
function when(p: number): number {
  let lo = -5;
  let hi = 40;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (travel(m) < p) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}
export const beltClock = { s04: (t: number) => t, s05: (t: number) => D04 + t };

const mod = (a: number, n: number) => ((a % n) + n) % n;
// phase solve: the overflow tile passes the 10 shutter on ch04-s05's 'times' ('Nought')
const U_INF = D04 + (S5.beats?.times ?? 6.916);
const PH_L = mod(L.sh - L.x0 - travel(U_INF), PITCH);
const J_INF = Math.round((travel(U_INF) + PH_L - (L.sh - L.x0)) / PITCH);
// review r1: a 12 (squeezed to 0 by the shut shutter) lands 0.5 s after ch04-s04's 'bit'; with PITCH the next lands
// 0.4 s after 'other' as a whole 12, and a later whole 12 lands in ch04-s05 just before 'number'
const B4s = S4.beats?.shutters ?? 4.989;
const PH_R = mod(LEN - travel(B4s + 0.5 - FALL), PITCH);
const U_12 = (() => {
  let tt = 0;
  for (let j = 0; j < 40; j++) {
    const land = when(LEN + j * PITCH - PH_R) + FALL;
    if (land < D04 + (S5.beats?.nan ?? 10.051)) tt = land;
  }
  return tt;
})();
export const beltPhases = { PH_L, PH_R, J_INF, U_INF, U_12 };

// ---------------------------------------------------------------- the shared schedule (ch04-s04 → ch04-s05)
const B4 = { shutters: S4.beats?.shutters ?? 4.989, swap: S4.beats?.swap ?? 6.939 };
/** the marble on the ramps (belt clock): from 6 (ch04-s03's end) it rolls to 5 and sits; on 'other' it rolls to 3.
 *  The roll starts 0.44 s before 'other' so the lever's 5 → 4 crossing (the swap) is done before the 12 tile at
 *  u ≈ 6.95 reaches its shutter: that tile passes whole. */
export const SWAP_ROLL: [number, number] = [B4.swap - 0.62, B4.swap - 0.02];
export function marbleA(u: number): number {
  if (u < 0.9) return 6;
  if (u < 1.9) return 6 - sm((u - 0.9) / 1.0);
  if (u < SWAP_ROLL[0]) return 5;
  const k = clamp01((u - SWAP_ROLL[0]) / (SWAP_ROLL[1] - SWAP_ROLL[0]));
  return 5 - 2 * (1 - (1 - k) * (1 - k));
}
/** the shutters drop onto the belts as the rods reach them, just before 'bit' */
export const LOWER: [number, number] = [B4.shutters - 0.38, B4.shutters - 0.1];
/** review r1: the tray is lidded until the bit acts (a whole 10 beside a whole 12 would read as 22), and tipped out
 *  on the swap so it answers 0 | 12 at once */
export const LID: [number, number] = [B4.shutters - 0.12, B4.shutters + 0.16];
export const TIP = B4.swap - 0.06;
export const SCHED: Sched = {
  lowered: (u) => sm((u - LOWER[0]) / (LOWER[1] - LOWER[0])),
  bit: (u) => RB.above4(marbleA(u)),
  lid: (u) => sm((u - LID[0]) / (LID[1] - LID[0])),
  tip: TIP,
};

// ---------------------------------------------------------------- the schedule a shot passes
export interface Sched {
  /** 0..1: the shutters are lowered onto the belts (raised = inactive, everything passes whole) */
  lowered(u: number): number;
  /** the select bit at belt-clock u (10 open by bit, 12 by 1 − bit) */
  bit(u: number): number;
  /** 0 = the tray's lid is on (nothing landed before it opens is ever shown), 1 = open */
  lid?(u: number): number;
  /** belt-clock time the tray is tipped out (tiles landed before it drop away) */
  tip?: number;
}
function openAt(sched: Sched, side: 'l' | 'r', u: number): number {
  if (sched.lowered(u) < 0.5) return 1;
  const b = Math.fround(Math.max(0, Math.min(1, sched.bit(u))));
  return side === 'l' ? b : Math.fround(1 - b);
}

export interface InfOpts {
  /** belt-clock time the 10 tile overflows to infinity (it swells, then turns into the ∞ card) */
  overflowU: number;
  /** the shut shutter's 'times nought' ink mark 0..1 */
  mark: number;
}
export interface TrayFx {
  /** grey sand level 0..1 */
  sand: number;
  /** the NaN stamp 0..1 */
  stamp: number;
  /** the stamp's press-in scale (1 = at rest) */
  pop?: number;
}
export interface RigOpts {
  u: number;
  sched: Sched;
  /** the lever (readout) above the tray: show 0..1 and the a it reads */
  lever: { show: number; a: number };
  /** the rods from the lever to the shutters, drawn 0..1 */
  rods: number;
  inf?: InfOpts;
  tray?: TrayFx;
  /** the shutter swap clack (a 1-frame jolt), 0..1 */
  clack?: number;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const rimOf = (env: PaintEnv, a = 0.85) => withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), a);

/**
 * A belt tile (rampBench's paper tile, re-cut for the belts): a shut shutter squeezes it to 60 % of its height and
 * re-letters it, and its numeral stays above the legibility floor however flat the tile is.
 */
function tile(c: C, env: PaintEnv, x: number, y: number, label: string, o: { s?: number; flat?: number; glow?: number; subject?: boolean } = {}) {
  const s = o.s ?? 1;
  const flat = clamp01(o.flat ?? 0);
  const w = 34 * s, h = 26 * s * (1 - flat * 0.4);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
  c.fillRect(x - w / 2 + 2 * s, y - h + 2 * s, w, h);
  c.fillStyle = mixLab(mixLab(flat > 0.5 ? '#d9c79f' : '#e6d3a8', env.mood.halo, 0.3), env.mood.core, (o.glow ?? 0) * 0.5);
  c.fillRect(x - w / 2, y - h, w, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6 + 0.4 * (o.glow ?? 0));
  c.lineWidth = 1.4;
  c.strokeRect(x - w / 2, y - h, w, h);
  textRole(c, o.subject === false ? 'texture' : 'subject', () => {
    const size = legibleSize(c, `${(15 * s).toFixed(1)}px ${FONT.typewriter}`, 15 * s);
    c.fillStyle = '#1d140d';
    c.font = `${(size * (1 - flat * 0.06)).toFixed(1)}px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, x, y - h / 2 + 1);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
  });
}

// ---------------------------------------------------------------- the rig
export function beltRig(c: C, env: PaintEnv, o: RigOpts) {
  const P = travel(o.u);
  const lowered = o.sched.lowered(o.u);
  // the stands: legs from the belts and the tray down to the bench
  c.fillStyle = PUPPET_NEAR_BLACK;
  for (const x of [L.x0 + 20, (L.x0 + L.x1) / 2, L.x1 - 30, R.x0 + 30, (R.x0 + R.x1) / 2, R.x1 - 20]) c.fillRect(x - 4, BELT_Y + 8, 8, WB.BENCH - BELT_Y - 8);
  c.fillRect(TRAY.x0 + 40, TRAY.floor, 10, WB.BENCH - TRAY.floor);
  c.fillRect(TRAY.x1 - 50, TRAY.floor, 10, WB.BENCH - TRAY.floor);
  c.fillRect(TRAY.x0 + 30, WB.BENCH - 6, TRAY.x1 - TRAY.x0 - 60, 6);
  // the lever and its rods (behind the shutters' frames)
  if (o.lever.show > 0) leverDraw(c, env, o.lever.show, o.lever.a, { x: LEVER.x, y: LEVER.y, r: LEVER.r, foot: TRAY.top - 4 });
  if (o.rods > 0) rods(c, env, o.rods, lowered);
  // tray back
  trayBack(c, env);
  // tiles: on the belts, falling, in the tray
  const inTray: { x: number; label: string; sink: number; flat: number; kind: 'tile' | 'inf' | 'puff' }[] = [];
  beltTiles(c, env, 'l', P, o, inTray);
  beltTiles(c, env, 'r', P, o, inTray);
  // the tray's contents (clipped to the trough: a sinking tile goes down into it, never out of its floor), the grey
  // sand over them, the front lip
  c.save();
  c.beginPath();
  c.rect(TRAY.x0 + 8, TRAY.top - 120, TRAY.x1 - TRAY.x0 - 16, TRAY.floor - 2 - (TRAY.top - 120));
  c.clip();
  for (const tt of inTray) {
    if (tt.kind !== 'tile') continue;
    c.save();
    c.globalAlpha *= 1 - sm((tt.sink - 0.55) / 0.45);
    tile(c, env, tt.x, TRAY.floor - 2 + tt.sink * 30, tt.label, { s: TILE_S, flat: tt.flat, subject: true });
    c.restore();
  }
  c.restore();
  if (o.tray && o.tray.sand > 0) sand(c, env, o.tray);
  trayFront(c, env);
  const lid = o.sched.lid ? o.sched.lid(o.u) : 1;
  if (lid < 1) trayLid(c, env, lid);
  // the belts' bodies and rollers over the tiles' feet
  beltBody(c, env, L.x0, L.x1, P, 1);
  beltBody(c, env, R.x0, R.x1, P, -1);
  // the shutters (in front of the tiles that pass through them)
  shutter(c, env, L.sh, openAt(o.sched, 'l', o.u), lowered, o.clack ?? 0, o.inf?.mark ?? 0);
  shutter(c, env, R.sh, openAt(o.sched, 'r', o.u), lowered, o.clack ?? 0, 0);
}

function beltBody(c: C, env: PaintEnv, x0: number, x1: number, P: number, dir: 1 | -1) {
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.roundRect(x0 - 6, BELT_Y, x1 - x0 + 12, 12, 6);
  c.fill();
  for (const rx of [x0, x1]) {
    c.beginPath();
    c.arc(rx, BELT_Y + 6, 9, 0, Math.PI * 2);
    c.fill();
  }
  // the belt's cleats slide with it (the only cue the belt itself moves)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.45);
  c.lineWidth = 1.2;
  c.beginPath();
  const step = 18;
  const off = mod(P * dir, step);
  for (let x = x0 + off; x < x1; x += step) {
    c.moveTo(x, BELT_Y + 1.5);
    c.lineTo(x + 6, BELT_Y + 1.5);
  }
  c.stroke();
  c.strokeStyle = rimOf(env, 0.55);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(x0, BELT_Y);
  c.lineTo(x1, BELT_Y);
  c.stroke();
}

function beltTiles(c: C, env: PaintEnv, side: 'l' | 'r', P: number, o: RigOpts, inTray: { x: number; label: string; sink: number; flat: number; kind: 'tile' | 'inf' | 'puff' }[]) {
  const ph = side === 'l' ? PH_L : PH_R;
  const v = side === 'l' ? 10 : 12;
  const shDist = side === 'l' ? L.sh - L.x0 : R.x1 - R.sh;
  const xAt = (d: number) => (side === 'l' ? L.x0 + d : R.x1 - d);
  const slot = side === 'l' ? TRAY.slotL : TRAY.slotR;
  const endX = side === 'l' ? L.x1 : R.x0;
  // tiles j with distance d = P + ph − j·PITCH in [−PITCH, LEN + fall + 2 pitches]
  const jMax = Math.floor((P + ph) / PITCH);
  const landed: { j: number; d: number }[] = [];
  for (let j = jMax; j >= jMax - 8; j--) {
    const d = P + ph - j * PITCH;
    if (d < 0) continue;
    const isInf = side === 'l' && o.inf && j === J_INF;
    // the label: v × (the shutter's opening when this tile passed it)
    let open = 1;
    let passed = d >= shDist;
    if (passed) open = openAt(o.sched, side, when(shDist + j * PITCH - ph));
    const label = RB.fmt(Math.fround(v * open));
    const flat = passed ? 1 - open : 0;
    if (d <= LEN) {
      const x = xAt(d);
      if (isInf) infTile(c, env, x, BELT_Y, o.u, o.inf!, passed, d - shDist);
      else tile(c, env, x, BELT_Y, label, { s: TILE_S, flat, subject: true });
      continue;
    }
    // past the end: falling (FALL s), then in the tray
    const tEnd = when(LEN + j * PITCH - ph);
    const since = o.u - tEnd;
    if (since < FALL) {
      const k = since / FALL;
      const x = endX + (slot - endX) * k;
      const y = BELT_Y + (TRAY.floor - 2 - BELT_Y) * k * k;
      if (isInf) puff(c, env, x, y - 10, 1, o.u);
      else {
        c.save();
        c.translate(x, y);
        c.rotate((side === 'l' ? 1 : -1) * Math.sin(k * Math.PI) * 0.25);
        tile(c, env, 0, 0, label, { s: TILE_S, flat, subject: true });
        c.restore();
      }
    } else landed.push({ j, d });
    void label;
  }
  // in the tray: the newest landed tile sits; the one before it sinks away as the newest lands
  landed.sort((a, b) => a.j - b.j); // larger j = later
  const newest = landed[landed.length - 1];
  for (const it of landed) {
    const tEnd = when(LEN + it.j * PITCH - ph) + FALL;
    // under the lid: never shown
    if (o.sched.lid && o.sched.lid(tEnd) < 0.5) continue;
    const later = landed.find((x) => x.j === it.j + 1);
    let sink = 0;
    if (later) sink = clamp01((o.u - (when(LEN + later.j * PITCH - ph) + FALL)) / 0.45);
    else if (it !== newest) sink = 1;
    // tipped out on the swap
    if (o.sched.tip !== undefined && tEnd < o.sched.tip) sink = Math.max(sink, clamp01((o.u - o.sched.tip) / 0.28));
    if (sink >= 1) continue;
    const passedOpen = openAt(o.sched, side, when(shDist + it.j * PITCH - ph));
    const isInf = side === 'l' && o.inf && it.j === J_INF;
    if (isInf) {
      // the puff settles into the tray as grey dust (the shot fills the sand)
      if (o.u - tEnd < 0.8) puff(c, env, slot, TRAY.floor - 14, 1 - (o.u - tEnd) / 0.8, o.u);
      continue;
    }
    // a 12 that lands in the grey sand sinks into it
    const sandSink = o.tray && o.tray.sand > 0.6 && tEnd > U_INF ? clamp01((o.u - Math.max(tEnd, U_INF + 1.6)) / 1.2) * 0.75 : 0;
    inTray.push({ x: slot, label: RB.fmt(Math.fround(v * passedOpen)), sink: Math.max(sink, sandSink), flat: 1 - passedOpen, kind: 'tile' });
  }
}

/** the 10 that overflows: swells past its card, then is cut as a black ∞ (a lemniscate of black card) */
function infTile(c: C, env: PaintEnv, x: number, y: number, u: number, o: InfOpts, passed: boolean, past: number) {
  const k = sm((u - o.overflowU + 0.2) / 0.5);
  if (k <= 0) {
    tile(c, env, x, y, '10', { s: TILE_S, subject: true });
    return;
  }
  if (passed) {
    // through the shut shutter it is not zeroed: it slips out as a grey puff
    const ex = clamp01(past / 30);
    if (ex < 1) infShape(c, env, x, y, 1 - ex);
    puff(c, env, x, y - 14, ex, u);
    return;
  }
  if (k < 0.5) {
    // the swell: the 10 grows past its card
    c.save();
    c.translate(x, y);
    c.scale(1 + k * 0.7, 1 + k * 0.7);
    tile(c, env, 0, 0, '10', { s: TILE_S, subject: true, glow: k * 1.5 });
    c.restore();
    return;
  }
  infShape(c, env, x, y, 1);
}
function infShape(c: C, env: PaintEnv, x: number, y: number, a: number) {
  c.save();
  c.globalAlpha *= a;
  // review r1: the ∞ rides as a TILE: a thin pale card behind the black-card lemniscate
  const tw = 34 * TILE_S, th = 26 * TILE_S;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
  c.fillRect(x - tw / 2 + 3, y - th + 3, tw, th);
  c.fillStyle = mixLab(mixLab('#ece0c2', env.mood.halo, 0.3), env.mood.core, 0.15);
  c.fillRect(x - tw / 2, y - th, tw, th);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.7);
  c.lineWidth = 1.4;
  c.strokeRect(x - tw / 2, y - th, tw, th);
  const w = 21, h = 12;
  const cy = y - th / 2;
  c.lineWidth = 5.5;
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  for (let i = 0; i <= 64; i++) {
    const th = (i / 64) * Math.PI * 2;
    const d = 1 + Math.sin(th) ** 2;
    const px = x + (w * Math.cos(th)) / d;
    const py = cy + (h * Math.sin(th) * Math.cos(th)) / d * 1.6;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.stroke();
  c.restore();
}
/** a grey puff (seeded, drifting dots on ones) */
function puff(c: C, env: PaintEnv, x: number, y: number, k: number, u: number) {
  if (k <= 0) return;
  const grey = mixLab('#8b8780', env.mood.haze, 0.25);
  c.save();
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39996;
    const r = 4 + (i % 5) * 3.2 + Math.sin(u * 3 + i) * 1.5;
    const px = x + Math.cos(a) * r * 1.4;
    const py = y + Math.sin(a) * r * 0.8 - (i % 3) * 2;
    c.fillStyle = withAlpha(grey, 0.32 * k);
    c.beginPath();
    c.arc(px, py, 5 + (i % 4) * 1.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function rods(c: C, env: PaintEnv, u: number, lowered: number) {
  const hub = { x: LEVER.x, y: LEVER.y + 34 };
  const drop = (1 - lowered) * -54;
  const ends = [
    { x: L.sh, y: BELT_Y - 82 + drop },
    { x: R.sh, y: BELT_Y - 82 + drop },
  ];
  c.save();
  c.lineCap = 'round';
  for (const e of ends) {
    const x = hub.x + (e.x - hub.x) * sm(u);
    const y = hub.y + (e.y - hub.y) * sm(u);
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(hub.x, hub.y);
    c.lineTo(x, y);
    c.stroke();
    c.strokeStyle = rimOf(env, 0.45);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(hub.x, hub.y - 1.4);
    c.lineTo(x, y - 1.4);
    c.stroke();
  }
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(hub.x, hub.y, 6, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** a paper shutter over a belt: a black frame; the paper panel's lower edge sits at the height the tile may keep */
function shutter(c: C, env: PaintEnv, x: number, open: number, lowered: number, clack: number, mark: number) {
  const lift = (1 - sm(lowered)) * -54;
  const jolt = clack > 0 ? Math.sin(clack * Math.PI) * 2.5 : 0;
  const top = BELT_Y - 82 + lift;
  const tileH = 26 * TILE_S;
  c.save();
  c.translate(0, jolt);
  const ink = PUPPET_NEAR_BLACK;
  // the panel: its lower edge at the belt + (8 + tileH·open) above it (flat when shut)
  // review r1: open = the panel fully raised above the tile; shut = the panel down on the belt with a heavy ink presser
  const gapH = 5 + (tileH + 8) * open;
  const panelBottom = BELT_Y - gapH + (1 - sm(lowered)) * -54;
  const PW = 22; // half-width of the panel
  const shut = (1 - open) * sm(lowered);
  c.fillStyle = mixLab(mixLab('#e6d3a8', env.mood.halo, 0.25), env.mood.set, 0.25);
  c.fillRect(x - PW, top + 8, 2 * PW, Math.max(0, panelBottom - top - 8));
  c.strokeStyle = withAlpha(mixLab('#2a1d12', env.mood.ink, 0.2), 0.3);
  c.lineWidth = 1;
  for (let yy = top + 16; yy < panelBottom - 16; yy += 9) {
    c.beginPath();
    c.moveTo(x - PW + 3, yy);
    c.lineTo(x + PW - 3, yy);
    c.stroke();
  }
  // the panel's lower edge (a black presser that squeezes the tiles): a thin bar when open, a heavy ink block when shut
  const presserH = 5 + 11 * shut;
  c.fillStyle = ink;
  c.fillRect(x - PW - 1, panelBottom - presserH + 1, 2 * PW + 2, presserH);
  // the frame: two posts and a head
  c.fillRect(x - PW - 6, top, 6, BELT_Y - top + (lowered > 0.5 ? 12 : 0));
  c.fillRect(x + PW, top, 6, BELT_Y - top + (lowered > 0.5 ? 12 : 0));
  c.fillRect(x - PW - 10, top - 6, 2 * PW + 20, 10);
  c.strokeStyle = rimOf(env, 0.75);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x - PW - 10, top - 6);
  c.lineTo(x + PW + 10, top - 6);
  c.stroke();
  // the 'times nought' ink mark across a shut panel (ch04-s05): a ruled ink line, then ×0 lettered large in dark ink
  if (mark > 0) {
    c.strokeStyle = withAlpha('#1a120b', 0.9 * mark);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - PW - 14, top + 22);
    c.lineTo(x - PW - 14 + (2 * PW + 28) * sm(mark * 1.4), top + 19);
    c.stroke();
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `700 24px ${FONT.mono}`, 24, '×0');
      c.font = `700 ${size}px ${FONT.mono}`;
      c.fillStyle = withAlpha('#140e09', 0.95 * sm((mark - 0.3) / 0.5));
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const my = (top + 26 + panelBottom - presserH) / 2 + 4;
      c.fillText('×0', x, my);
      textProbe(c, 'ch04-belts-x0', x - PW, my - size / 2, 2 * PW, size, sm((mark - 0.3) / 0.5));
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
    });
  }
  c.restore();
}

/** the tray's lid (review r1): a black card panel across the tray's mouth that lifts away as the bit acts */
function trayLid(c: C, env: PaintEnv, open: number) {
  const k = sm(open);
  const lift = k * 70;
  c.save();
  c.globalAlpha *= 1 - sm((open - 0.55) / 0.45);
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.08);
  const y0 = TRAY.top - 14 - lift;
  c.fillRect(TRAY.x0 + 2, y0, TRAY.x1 - TRAY.x0 - 4, TRAY.floor - 6 - (TRAY.top - 14));
  c.strokeStyle = rimOf(env, 0.8);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(TRAY.x0 + 2, y0);
  c.lineTo(TRAY.x1 - 2, y0);
  c.stroke();
  // a small brass ring to lift it by
  c.strokeStyle = withAlpha(mixLab('#b8893e', env.mood.halo, 0.3), 0.8);
  c.lineWidth = 2;
  c.beginPath();
  c.arc((TRAY.x0 + TRAY.x1) / 2, y0 + 12, 5, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

function trayBack(c: C, env: PaintEnv) {
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.2);
  c.fillRect(TRAY.x0 + 6, TRAY.top - 6, TRAY.x1 - TRAY.x0 - 12, TRAY.floor - TRAY.top + 6);
}
function trayFront(c: C, env: PaintEnv) {
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(TRAY.x0, TRAY.top);
  c.lineTo(TRAY.x0 + 10, TRAY.floor + 6);
  c.lineTo(TRAY.x1 - 10, TRAY.floor + 6);
  c.lineTo(TRAY.x1, TRAY.top);
  c.lineTo(TRAY.x1 - 8, TRAY.top);
  c.lineTo(TRAY.x1 - 14, TRAY.floor - 10);
  c.lineTo(TRAY.x0 + 14, TRAY.floor - 10);
  c.lineTo(TRAY.x0 + 8, TRAY.top);
  c.closePath();
  c.fill();
  c.fillRect(TRAY.x0 + 10, TRAY.floor - 12, TRAY.x1 - TRAY.x0 - 20, 18);
  c.strokeStyle = rimOf(env, 0.8);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(TRAY.x0, TRAY.top);
  c.lineTo(TRAY.x0 + 8, TRAY.top);
  c.moveTo(TRAY.x1 - 8, TRAY.top);
  c.lineTo(TRAY.x1, TRAY.top);
  c.stroke();
}
/** the grey sand heaping in the tray, stamped NaN */
function sand(c: C, env: PaintEnv, o: TrayFx) {
  const lvl = sm(o.sand);
  const grey = mixLab('#7f7b74', env.mood.haze, 0.2);
  const topY = TRAY.floor - 6 - 54 * lvl;
  c.save();
  c.fillStyle = grey;
  c.beginPath();
  c.moveTo(TRAY.x0 + 10, TRAY.floor);
  c.lineTo(TRAY.x0 + 10, Math.min(TRAY.floor, topY + 22));
  c.quadraticCurveTo((TRAY.x0 + TRAY.x1) / 2, topY - 20 * lvl, TRAY.x1 - 10, Math.min(TRAY.floor, topY + 22));
  c.lineTo(TRAY.x1 - 10, TRAY.floor);
  c.closePath();
  c.fill();
  // grain: a few darker and lighter specks
  for (let i = 0; i < 60; i++) {
    const x = TRAY.x0 + 16 + ((i * 37) % (TRAY.x1 - TRAY.x0 - 32));
    const y = TRAY.floor - 4 - ((i * 53) % 40) * lvl;
    c.fillStyle = withAlpha(i % 2 ? '#5d5a55' : '#b4b0a8', 0.35 * lvl);
    c.fillRect(x, y, 1.6, 1.6);
  }
  if (o.stamp > 0) {
    // review r1: stamped in the film's near-black ink, large, pressed in with a 2-frame scale pop
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `800 38px ${FONT.mono}`, 38, 'NaN');
      c.font = `800 ${size}px ${FONT.mono}`;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      const cx = (TRAY.x0 + TRAY.x1) / 2;
      const y = Math.min(TRAY.floor - 4, topY + 34);
      const pop = o.pop ?? 1;
      c.save();
      c.translate(cx, y - size * 0.35);
      c.scale(pop, pop);
      c.translate(-cx, -(y - size * 0.35));
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.95 * sm(o.stamp));
      c.fillText('NaN', cx, y);
      c.restore();
      textProbe(c, 'ch04-belts-nan', cx - 50, y - size, 100, size, sm(o.stamp));
      c.textAlign = 'left';
    });
  }
  c.restore();
}
