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
import { MOODS, makeEnv, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { textRole } from '../../../film/silhouette/type';
import { toLayer, toScreen } from '../../../film/core/multiplane';
import { makeCanvas } from '../../../film/silhouette/atmosphere';
import { hands } from '../cast';
import { shelfStateAt, type CandleView } from './studyState';
import { beliefCandle, candleFlame, namedLabel } from './beliefCandle';
import { lerp, reflection, sm } from './ch14-s05-strait';
import { inkHand } from './ch14-s02-inkhand';

type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

const V = shelfStateAt('ch14-s07', 'end');
const view = (id: string) => V.find((v) => v.id === id)!;
export const CHOKE: CandleView = view('chokepoint');
export const BEHIND: CandleView = view('behind');
export const MATCH: CandleView = { ...view('match'), tag: '' };
export const GAP: CandleView = { ...view('gap'), tag: 'LIT 2025 · CONTESTED', rings: 0 };
const GAP_UNLIT: CandleView = { ...GAP, state: 'out', smoke: false };

/** matched cut: ch14-s06 ends and ch14-s07 opens on this frame (the jetty's end at left, open water to the right) */
export const CAM_OPEN: Camera3 = { x: 830, y: 416, z: 140, lens: 1 };
/** ch14-s07's hold: the jetty's end at left (the pages have left the frame: review r1, clean edges), the right shore
 *  at right */
export const CAM_HOLD: Camera3 = { x: 1112, y: 392, z: 84, lens: 1 };

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
// round 4 (ch14-s07 critic): pushed in, the new candle stands 30 px further right, so the estimate tags (hung at its
// left, already at the frame's left edge) keep a clear gap from its column
const PUSH_BASE: P = { x: 498, y: 606 };
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

/** the sheet's top-left on screen (stage px) and its screen px per sheet unit, for a push / pull back / rise */
export function sheetOnScreen(o: { push?: number; back?: number; rise?: number }): { x: number; y: number; q: number } {
  const back = sm(o.back ?? 0);
  const { base, q: q0 } = reflAnchor(o.push ?? 0);
  // the pull back shrinks the whole window (and what is in its glass) toward the frame's centre (windowFrame)
  const wk = lerp(1, 0.74, back);
  const wcx = 640, wcy = lerp(360, 340, back);
  const q = q0 * wk;
  const bx = wcx + (base.x - wcx) * wk, by = wcy + (base.y + 46 * (o.rise ?? 0) * q0 - wcy) * wk;
  return { x: bx - SX.gap * q, y: by - SH.plank * q, q };
}
/** the gap candle's base on screen (stage px) and its screen scale (the warm streak on the water hangs below it) */
export function gapBaseScreen(o: { push?: number; back?: number; rise?: number }): { x: number; y: number; q: number } {
  const s0 = sheetOnScreen(o);
  return { x: s0.x + SX.gap * s0.q, y: s0.y + SH.plank * s0.q, q: s0.q };
}
/** the NAMING RULE's horizontal label for the new candle, placed beside its flame IN THE GLASS (screen-locked; the
 *  in-sheet auto label would land at the offscreen sheet's coordinates). Its date line reads "lit 2025 · still burning"
 *  (the base tag carries CONTESTED). Call from the shot's paint with k 0..1. */
export function gapNamedLabel(f: Frame, o: { push?: number; back?: number; rise?: number; k: number }) {
  if (o.k <= 0.001) return;
  const s0 = sheetOnScreen(o);
  const c = f.c;
  const px = f.pxScale;
  const env = makeEnv({ mood: 'candleAmber', layer: 'L4', t: f.t, pxScale: px, seed: 1417, frame: f.frame });
  c.save();
  c.setTransform(s0.q * px, 0, 0, s0.q * px, s0.x * px, s0.y * px);
  // round 4: break as 'THE GAP IS MONTHS, / NOT YEARS' (a no-break space keeps NOT YEARS together)
  namedLabel(c, { x: SX.gap, y: SH.plank, view: { ...GAP, text: 'THE GAP IS MONTHS, NOT\u00a0YEARS', tag: '2025' }, s: SH.s, named: o.k }, env);
  c.restore();
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
  /** the match's brief bloom as it catches (ch14-s07 'candle') 0..1 */
  flare?: number;
  /** the screen band the far skylines occupy: the reflected columns thin to `k` there (review r1) */
  skyBand?: { y0: number; y1: number; k: number };
  cam: Camera3;
  /** round 4 (ch14-s07): the hand is NOT drawn in the screen-blended sheet (where ink vanishes); the shot paints it with
   *  reflHand as an ink silhouette with a candleAmber rim */
  handOverlay?: boolean;
  /** 0..1: the chokepoint candle's sleeve ring hairlines raised (its years held, seen beside the new candle) */
  ringsK?: number;
  /** round 4 (ch14-s07 only): the new taper in warm wax (GAP_WAX) with a 1.5 px candleAmber rim on its lit side, and
   *  the halo behind it 20 % darker, so it reads as a new candle and not a pale column */
  warmGap?: boolean;
  /** round 5 (ch14-s07 only): the four candles are NOT drawn in the screen-blended sheet; the shot paints them itself
   *  as ONE source-over plane at one alpha (gap, chokepoint, match, behind), so no candle is a ghost beside another.
   *  The sheet keeps the plank, saucers, the flames' wall pools and their glows. ch14-s06 does not pass it. */
  overlay?: boolean;
}

/** round 4 (ch14-s07): the new gap taper's wax */
export const GAP_WAX = '#e3cfa2';

/** the strikeLight pose for a progress (null when out of the glass) */
function strikePose(strike: number | null) {
  return strike !== null ? hands.act('strikeLight', strike, { x: GAP_FLAME.x, y: GAP_FLAME.y + 6 }, { entry: ENTRY, scale: 0.62 }) : null;
}

/** round 4: the hand in the glass as an INK silhouette (≈ the reflection's alpha) cut out by a candleAmber rim, drawn
 *  source-over on screen in the sheet's own placement, its forearm falling away behind the wrist */
export function reflHand(f: Frame, o: { strike: number | null; push?: number; back?: number; rise?: number; alpha: number }) {
  const pose = strikePose(o.strike);
  if (!pose?.right) return;
  const s0 = sheetOnScreen(o);
  const px = f.pxScale;
  const c = f.c;
  const hc = handCanvas(c);
  hc.setTransform(s0.q * px, 0, 0, s0.q * px, s0.x * px, s0.y * px);
  const env = makeEnv({ mood: 'candleAmber', layer: 'L4', t: f.t, pxScale: px * s0.q, seed: 1417, frame: f.frame });
  inkHand(hc, { right: pose.right, scale: pose.scale }, env, { lit: Math.min(1, pose.right.lit ?? 0), rimPx: 1.5 });
  const w = pose.right.wrist;
  const ang = pose.right.angle;
  hc.save();
  hc.globalCompositeOperation = 'destination-in';
  const back = { x: w.x - Math.cos(ang) * 60, y: w.y - Math.sin(ang) * 60 };
  const g = hc.createLinearGradient(back.x, back.y, w.x + Math.cos(ang) * 4, w.y + Math.sin(ang) * 4);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  hc.fillStyle = g;
  hc.fillRect(-400, -400, SH.w + 800, SH.h + 800);
  hc.restore();
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = Math.min(1, o.alpha);
  c.drawImage(hc.canvas, 0, 0);
  c.restore();
}

export function windowReflection(f: Frame, o: WindowReflectionOpts) {
  const pose = strikePose(o.strike);
  // the new taper reads at once: round 3 (art) doubles its flame's glow radius again (2 → 4 × the other candles'),
  // with a tight hot core of its own so the flame is the brightest point in the glass
  const flames: { x: number; y: number; k: number; seed: number; r?: number }[] = [
    { x: CHOKE_FLAME.x, y: CHOKE_FLAME.y - 4, k: 1.05 * o.fed, seed: 22 },
    // round 4 (warmGap): the fog halo behind the new taper ~20 % darker, so its warm wax stands against it
    { x: GAP_FLAME.x, y: GAP_FLAME.y - 4, k: (o.warmGap ? 0.72 : 0.9) * o.lit, seed: 25, r: 4 },
    { x: GAP_FLAME.x, y: GAP_FLAME.y - 3, k: 1.25 * o.lit, seed: 26, r: 0.45 },
  ];
  if (pose) {
    const mf = hands.flameAt(pose);
    if (mf && (pose.right?.lit ?? 0) > 0.01) flames.push({ x: mf.x, y: mf.y, k: Math.min(1.4, pose.right!.lit!), seed: 31 });
    // the strike: a clear, brief bloom as the match catches
    if (mf && (o.flare ?? 0) > 0.01) flames.push({ x: mf.x, y: mf.y, k: 1.3 * (o.flare ?? 0), seed: 33, r: 2.6 });
  }
  const back = sm(o.back ?? 0);
  // sheet top-left on screen, then on the glass plane for this camera
  const s0 = sheetOnScreen(o);
  const q = s0.q;
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
    bandAlpha: o.skyBand
      ? (yW: number) => {
          const sy = toScreen(LAYERS.L2, o.cam, 0, yW).y;
          const b = o.skyBand!;
          const inBand = sm((sy - (b.y0 - 30)) / 40) * (1 - sm((sy - b.y1) / 30));
          return 1 - (1 - b.k) * inBand;
        }
      : undefined,
    draw: (c, env) => shelfSheet(c, env, o.lit, o.fed, pose, { hand: !o.handOverlay, ringsK: o.ringsK ?? 0, warmGap: o.warmGap, overlay: o.overlay }),
  });
}

/** the right end of the study shelf as the glass shows it (sheet-local, candleAmber): the plank, the gap candle (lit
 *  by the hand's match), the burning chokepoint candle, the blackened match lying flat, the dark two-ring stub. Drawn
 *  for a 'screen' composite: what is lit shows, what is dark vanishes into the night outside. */
export function shelfSheet(c: C, env0: PaintEnv, lit: number, fed: number, pose: ReturnType<typeof hands.act> | null, opt: { hand?: boolean; ringsK?: number; warmGap?: boolean; overlay?: boolean } = {}) {
  const m = env0.mood;
  // in the glass the wax reads as a warm ghost (a step lighter than the room's ink), its lettering lamp-lit
  // review r1: a step darker than before (0.36), so the reflected bodies stop washing the frame as pale columns
  const wax = mixLab(m.ink, m.halo, 0.22);
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
  // round 4 (warmGap): the halo behind the new taper 20 % darker, so its warm wax stands against it
  if (lit > 0.01) pool(GAP_FLAME.x, GAP_FLAME.y + 50, 170, (opt.warmGap ? 0.8 : 1) * lit);
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
  // candles: the new one's lettering full strength, the others a step back. The vertical lettering is TEXTURE here
  // (the candle-clock's rule: what the viewer reads is the horizontal named label, gapNamedLabel, at 26 px); the
  // in-sheet auto label is off (named: 0), since it would land at the offscreen sheet's coordinates
  if (!opt.overlay) textRole(c, 'texture', () => {
    // review r1: the vertical lettering ≤ 0.25 (the gap label card names the new candle)
    beliefCandle(c, { x: SX.choke, y: SH.plank, view: CHOKE, s: SH.s, flame: fed, letters: 0.22, seed: 22, named: 0 }, env);
    beliefCandle(c, { x: SX.behind, y: SH.plank, view: BEHIND, s: SH.s, letters: 0.2, seed: 23, named: 0 }, env);
    beliefCandle(c, { x: SX.match, y: SH.plank, view: MATCH, s: SH.s, seed: 24, named: 0 }, env);
    beliefCandle(c, { x: SX.gap, y: SH.plank, view: lit > 0.02 ? GAP : GAP_UNLIT, s: SH.s, flame: lit > 0.02 ? lit : undefined, letters: 0.25, seed: 25, named: 0 }, env);
  });
  // round 3 (art): the new taper is not a pale ghost: once lit its own flame warms its wax, brightest under the flame
  // and falling off down the column, so in the glass it reads as a lit candle body (warm), not a grey shaft
  if (opt.overlay) {
    // round 5: the shot paints the candles (ch14-s07 shelfOverlay)
  } else if (lit > 0.02 && opt.warmGap) {
    // round 4: warm wax (GAP_WAX), lit from its own flame down the column, and a 1.5 px candleAmber rim on its lit
    // (right, chokepoint-facing) side, so it reads as a new taper, not a pale column
    const w = 38 * SH.s;
    const top = GAP_FLAME.y + 6 * SH.s;
    const am = MOODS.candleAmber;
    const g = c.createLinearGradient(0, top, 0, SH.plank);
    g.addColorStop(0, withAlpha(mixLab(GAP_WAX, am.core, 0.25), 0.9 * lit));
    g.addColorStop(0.2, withAlpha(GAP_WAX, 0.78 * lit));
    g.addColorStop(1, withAlpha(mixLab(GAP_WAX, am.halo, 0.45), 0.55 * lit));
    c.fillStyle = g;
    c.fillRect(SX.gap - w / 2 + 1.5, top, w - 3, SH.plank - top - 1);
    // the shadow side (left) a step darker, so the column has a body
    const gs = c.createLinearGradient(SX.gap - w / 2, 0, SX.gap + w / 2, 0);
    gs.addColorStop(0, withAlpha(mixLab(GAP_WAX, am.ink, 0.55), 0.55 * lit));
    gs.addColorStop(0.45, withAlpha(mixLab(GAP_WAX, am.ink, 0.55), 0));
    c.fillStyle = gs;
    c.fillRect(SX.gap - w / 2 + 1.5, top, w - 3, SH.plank - top - 1);
    // the 1.5 px candleAmber rim on the lit side, and the wax's lip under the flame
    c.fillStyle = withAlpha(am.rim, 0.95 * lit);
    c.fillRect(SX.gap + w / 2 - 1.5 - 1.5, top, 1.5, SH.plank - top - 1);
    c.fillStyle = withAlpha(mixLab(am.core, am.rim, 0.3), 0.7 * lit);
    c.fillRect(SX.gap - w / 2 + 1.5, top - 1, w - 3, 2);
  } else if (lit > 0.02) {
    const w = 38 * SH.s;
    const top = GAP_FLAME.y + 6 * SH.s;
    const g = c.createLinearGradient(0, top, 0, SH.plank);
    g.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.35), 0.78 * lit));
    g.addColorStop(0.18, withAlpha(m.halo, 0.5 * lit));
    g.addColorStop(1, withAlpha(m.halo, 0.16 * lit));
    c.fillStyle = g;
    c.fillRect(SX.gap - w / 2 + 1.5, top, w - 3, SH.plank - top - 1);
    // the flame-side edge of the wax a touch brighter (a candle's translucent lip)
    c.fillStyle = withAlpha(m.core, 0.55 * lit);
    c.fillRect(SX.gap - w / 2 + 1.5, top - 1, w - 3, 2.2);
  }
  // the hand: ONLY the working hand, in clean profile: wrist and fingers holding the match, warm-lit on the near
  // edge by its own flame; the cuff and arm fall away into the dark (nothing else of the arm in the glass)
  // round 4: the chokepoint candle's sleeve, its ring hairlines raised (≈ 0.5) so the years held are seen
  const rk = opt.overlay ? 0 : opt.ringsK ?? 0;
  if (rk > 0.01) {
    const w = 38 * SH.s;
    const top = SH.plank - 45 * 6 * SH.s;
    const n = Math.round(CHOKE.rings ?? 0);
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.5 * rk);
    for (let i = 0; i <= n; i++) c.fillRect(SX.choke - w / 2, top + i * 6 * SH.s - 0.6, w, 1.2);
    c.fillRect(SX.choke - w / 2, top, 1.1, n * 6 * SH.s);
    c.fillRect(SX.choke + w / 2 - 1.1, top, 1.1, n * 6 * SH.s);
  }
  if (pose?.right && opt.hand !== false) {
    const am = MOODS.candleAmber;
    const lk = Math.min(1, pose.right.lit ?? 0);
    // review r1 (the REFLECTION RULE): the hand is INK in the glass (it occludes the warm pool behind it, so it reads
    // as a dark hand), cut out by a candleAmber rim at about 35 %, a little warmer once its match is lit
    const handEnv: PaintEnv = {
      ...env0,
      mood: { ...m, rim: mixLab(mixLab(m.ink, am.rim, 0.62), am.core, 0.25 * lk) },
      fill: (r) => (r === 'ink' ? mixLab(m.ink, m.set, 0.12) : env0.fill(r)),
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
