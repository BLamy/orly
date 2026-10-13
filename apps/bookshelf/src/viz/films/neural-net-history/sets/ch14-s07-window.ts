/**
 * neural-net-history — the window group's REFLECTION (ch14-s06's last seconds, ch14-s07): the right end of the
 * study's candle shelf as the study window's glass shows it over the strait, in the study's own candleAmber (STUDY
 * LOCK): the chokepoint candle burning (a four-ring sleeve), the blackened match lying flat beside it, the dark
 * two-ring stub of the one-to-three-years candle (the same order as ch14-s04b: chokepoint, match, behind), and the
 * new gap candle at the chokepoint's left, lit in ch14-s07 by the narrator's hand (in reflection).
 *
 *   windowReflection(f, { alpha, rise, lit, fed, strike, push, back })   composite it on the glass (L2 plane)
 *   reflAnchor(push)  the gap candle's base and the sheet's screen scale (for the tags that hang beside it)
 *   CAM_OPEN  the matched-cut camera (ch14-s06's last frame = ch14-s07's first)
 *   CAM_HOLD  ch14-s07's hold
 *
 * The reflection is SCREEN-LOCKED in the glass (it is in the window, not out on the water): placed and scaled in
 * screen px, then converted to the glass plane for the frame's camera. It is composited with ONE uniform alpha and a
 * 'screen' blend (sets/ch14-s05-strait reflection), so only the lit parts of the room show: no solid shapes standing in
 * the water, no second reflection on the water.
 *
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at 6 px per ring (270 px at
 * scale 1); the burned wax stays above the stub as a ghost sleeve whose length is the years the belief was held.
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { toLayer, toScreen } from '../../../film/core/multiplane';
import { makeCanvas } from '../../../film/silhouette/atmosphere';
import { hands } from '../cast';
import { shelfStateAt, type CandleView } from './studyState';
import { beliefCandle, candleFlame } from './beliefCandle';
import { lerp, reflection, sm } from './ch14-s05-strait';

type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

const V = shelfStateAt('ch14-s07', 'end');
const view = (id: string) => V.find((v) => v.id === id)!;
export const CHOKE: CandleView = view('chokepoint');
export const BEHIND: CandleView = view('behind');
const MATCH: CandleView = { ...view('match'), tag: '' };
export const GAP: CandleView = { ...view('gap'), tag: 'LIT 2025 · CONTESTED', rings: 0 };
const GAP_UNLIT: CandleView = { ...GAP, state: 'out', smoke: false };

/** matched cut: ch14-s06 ends and ch14-s07 opens on this frame (the jetty's end at left, open water to the right) */
export const CAM_OPEN: Camera3 = { x: 820, y: 416, z: 140, lens: 1 };
/** ch14-s07's hold: the jetty's end at left with the WASHINGTON page whole in frame, the right shore at right */
export const CAM_HOLD: Camera3 = { x: 1049, y: 392, z: 84, lens: 1 };

/** the sheet (sheet-local units): plank top at SH.plank; candles at scale SH.s */
export const SH = { w: 640, h: 430, plank: 330, s: 0.82 };
/** slots along the plank, in the ch14-s04b order: gap (new) · chokepoint · match (lying flat) · behind */
export const SX = { gap: 76, choke: 200, match: 268, behind: 340 };
const GAP_FLAME = candleFlame({ x: SX.gap, y: SH.plank, view: GAP, s: SH.s });
const CHOKE_FLAME = candleFlame({ x: SX.choke, y: SH.plank, view: CHOKE, s: SH.s });
/** the hand's entry in the glass (sheet-local): from the lower right, below the shelf */
const ENTRY = { R: { x: SX.gap + 210, y: SH.h + 60 }, L: { x: SX.gap + 260, y: SH.h + 120 } };

/** where the gap candle's base sits on screen, and how many screen px one sheet unit spans: at the hold (push 0) the
 *  shelf floats over the water with its candles crossing the horizon; pushed in (push 1) the new candle stands almost
 *  the frame's height, so its lettering reads (≥ 26 px at 1080p) */
const HOLD_BASE: P = { x: 468, y: 478 };
const PUSH_BASE: P = { x: 468, y: 606 };
const Q_HOLD = 1.08;
const Q_PUSH = 2.36;
export function reflAnchor(push: number): { base: P; q: number } {
  const u = sm(push);
  // the scale eases geometrically, so the push reads as an even dolly
  const q = Q_HOLD * Math.pow(Q_PUSH / Q_HOLD, u);
  return { base: { x: lerp(HOLD_BASE.x, PUSH_BASE.x, u), y: lerp(HOLD_BASE.y, PUSH_BASE.y, u) }, q };
}
/** the gap flame's screen point for a push (tags hang beside it, lit from it) */
export function gapFlameScreen(push: number): P {
  const { base, q } = reflAnchor(push);
  return { x: base.x + (GAP_FLAME.x - SX.gap) * q, y: base.y + (GAP_FLAME.y - SH.plank) * q };
}

export interface WindowReflectionOpts {
  /** the reflection's ONE uniform strength (~0.35) */
  alpha: number;
  /** 0..1: how far below its place the reflection still sits (it rises into place) */
  rise: number;
  /** the gap candle's flame 0..1 (0 = not yet lit) */
  lit: number;
  /** the chokepoint flame's strength (1 = steady; > 1 = fed) */
  fed: number;
  /** strikeLight progress 0..1, or null when the hand is out of the glass */
  strike: number | null;
  /** 0..1 the push in on the reflection (ch14-s07, during L1417 and the tags) */
  push?: number;
  /** the pull back into the study 0..1 (the reflection shrinks with the window opening) */
  back?: number;
  cam: Camera3;
}

export function windowReflection(f: Frame, o: WindowReflectionOpts) {
  const pose = o.strike !== null ? hands.act('strikeLight', o.strike, { x: GAP_FLAME.x, y: GAP_FLAME.y + 6 }, { entry: ENTRY, scale: 0.62 }) : null;
  const flames: { x: number; y: number; k: number; seed: number }[] = [
    { x: CHOKE_FLAME.x, y: CHOKE_FLAME.y - 4, k: 1.05 * o.fed, seed: 22 },
    { x: GAP_FLAME.x, y: GAP_FLAME.y - 4, k: o.lit, seed: 25 },
  ];
  if (pose) {
    const mf = hands.flameAt(pose);
    if (mf && (pose.right?.lit ?? 0) > 0.01) flames.push({ x: mf.x, y: mf.y, k: Math.min(1.4, pose.right!.lit!), seed: 31 });
  }
  const back = sm(o.back ?? 0);
  const { base, q: q0 } = reflAnchor(o.push ?? 0);
  // the pull back shrinks the whole window (and what is in its glass) toward the frame's centre (windowFrame)
  const wk = lerp(1, 0.74, back);
  const wcx = 640, wcy = lerp(360, 340, back);
  const q = q0 * wk;
  const bx = wcx + (base.x - wcx) * wk, by = wcy + (base.y + 46 * o.rise * q0 - wcy) * wk;
  // sheet top-left on screen, then on the glass plane for this camera
  const s0 = { x: bx - SX.gap * q, y: by - SH.plank * q };
  const kG = toScreen(LAYERS.L2, o.cam, 0, 0).k;
  const w0 = toLayer(LAYERS.L2, o.cam, s0.x, s0.y);
  reflection(f, {
    x: w0.x,
    y: w0.y,
    w: SH.w,
    h: SH.h,
    scale: q / kG,
    res: Math.max(1, q),
    alpha: o.alpha,
    ripple: 2.6 - 1.2 * back,
    flames,
    draw: (c, env) => shelfSheet(c, env, o.lit, o.fed, pose),
  });
}

/** the right end of the study shelf as the glass shows it (sheet-local, candleAmber): the plank, the gap candle (lit
 *  by the hand's match), the burning chokepoint candle, the blackened match lying flat, the dark two-ring stub. Drawn
 *  for a 'screen' composite: what is lit shows, what is dark vanishes into the night outside. */
export function shelfSheet(c: C, env0: PaintEnv, lit: number, fed: number, pose: ReturnType<typeof hands.act> | null) {
  const m = env0.mood;
  // in the glass the wax reads as a warm ghost (a step lighter than the room's ink), its lettering lamp-lit
  const wax = mixLab(m.ink, m.halo, 0.36);
  const env: PaintEnv = { ...env0, fill: (r) => (r === 'ink' ? wax : env0.fill(r)) };
  // the flames' warm pool on the study wall behind the candles (the candles stand dark against it)
  const pool = (x: number, y: number, r: number, a: number) => {
    const g = c.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, withAlpha(m.halo, 0.8 * a));
    g.addColorStop(0.45, withAlpha(m.halo, 0.32 * a));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  };
  pool(CHOKE_FLAME.x, CHOKE_FLAME.y + 50, 190, 0.8 * fed);
  if (lit > 0.01) pool(GAP_FLAME.x, GAP_FLAME.y + 50, 170, lit);
  const mf = pose ? hands.flameAt(pose) : null;
  if (mf && pose) pool(mf.x, mf.y, 110, Math.min(1, pose.right?.lit ?? 0));
  // the plank: only its lamp-lit front edge shows in the glass
  c.fillStyle = mixLab(m.ink, m.set, 0.5);
  c.fillRect(-20, SH.plank, SH.w + 40, 9);
  c.fillStyle = withAlpha(m.rim, 0.7);
  c.fillRect(-20, SH.plank - 0.8, SH.w + 40, 1.6);
  // a small brass saucer under each standing candle
  for (const x of [SX.gap, SX.choke, SX.behind]) {
    c.fillStyle = mixLab(m.set, m.halo, 0.5);
    c.beginPath();
    c.ellipse(x, SH.plank - 2, 21, 4.2, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(m.rim, 0.6);
    c.fillRect(x - 19, SH.plank - 5.6, 38, 1.1);
  }
  // candles: the new one's lettering full strength (the push makes it legible), the others a step back
  beliefCandle(c, { x: SX.choke, y: SH.plank, view: CHOKE, s: SH.s, flame: fed, letters: 0.85, seed: 22 }, env);
  beliefCandle(c, { x: SX.behind, y: SH.plank, view: BEHIND, s: SH.s, letters: 0.75, seed: 23 }, env);
  beliefCandle(c, { x: SX.match, y: SH.plank, view: MATCH, s: SH.s, seed: 24 }, env);
  beliefCandle(c, { x: SX.gap, y: SH.plank, view: lit > 0.02 ? GAP : GAP_UNLIT, s: SH.s, flame: lit > 0.02 ? lit : undefined, letters: 1, seed: 25 }, env);
  // the hand: ONLY the working hand, in clean profile: wrist and fingers holding the match, warm-lit on the near
  // edge by its own flame; the cuff and arm fall away into the dark (nothing else of the arm in the glass)
  if (pose?.right) {
    const am = MOODS.candleAmber;
    const lk = Math.min(1, pose.right.lit ?? 0);
    const handEnv: PaintEnv = {
      ...env0,
      mood: { ...m, rim: mixLab(am.rim, am.core, 0.5 + 0.4 * lk) },
      fill: (r) => (r === 'ink' ? mixLab(m.set, m.halo, 0.5 + 0.3 * lk) : env0.fill(r)),
    };
    const hc = handCanvas(c);
    hc.setTransform(c.getTransform());
    hands.draw(hc, { right: pose.right, scale: pose.scale }, handEnv);
    const w = pose.right.wrist;
    const ang = pose.right.angle;
    // keep the hand: fade along the forearm from just behind the wrist
    hc.save();
    hc.globalCompositeOperation = 'destination-in';
    const back = { x: w.x - Math.cos(ang) * 46, y: w.y - Math.sin(ang) * 46 };
    const g = hc.createLinearGradient(back.x, back.y, w.x + Math.cos(ang) * 6, w.y + Math.sin(ang) * 6);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    hc.fillStyle = g;
    hc.fillRect(-200, -200, SH.w + 400, SH.h + 400);
    hc.restore();
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(hc.canvas, 0, 0);
    c.restore();
  }
  // feather the sheet's edges so nothing ends on a hard line in the glass
  c.save();
  c.globalCompositeOperation = 'destination-in';
  const gx = c.createLinearGradient(0, 0, SH.w, 0);
  gx.addColorStop(0, 'rgba(0,0,0,0)');
  gx.addColorStop(0.06, 'rgba(0,0,0,1)');
  gx.addColorStop(0.62, 'rgba(0,0,0,1)');
  gx.addColorStop(0.9, 'rgba(0,0,0,0)');
  c.fillStyle = gx;
  c.fillRect(0, 0, SH.w, SH.h);
  const gy = c.createLinearGradient(0, 0, 0, SH.h);
  gy.addColorStop(0, 'rgba(0,0,0,0)');
  gy.addColorStop(0.1, 'rgba(0,0,0,1)');
  gy.addColorStop(0.86, 'rgba(0,0,0,1)');
  gy.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gy;
  c.fillRect(0, 0, SH.w, SH.h);
  c.restore();
}

let handCv: HTMLCanvasElement | null = null;
function handCanvas(c: C): CanvasRenderingContext2D {
  const w = c.canvas.width, h = c.canvas.height;
  if (!handCv || handCv.width !== w || handCv.height !== h) handCv = makeCanvas(w, h);
  const hc = handCv.getContext('2d') as CanvasRenderingContext2D;
  hc.setTransform(1, 0, 0, 1, 0, 0);
  hc.clearRect(0, 0, w, h);
  return hc;
}
