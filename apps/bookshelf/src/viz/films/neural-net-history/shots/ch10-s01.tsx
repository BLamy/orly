/**
 * ch10-s01 — the hall of word-slips: a scribe carries one lamp from slip to slip, in order, and the light he
 * passes on fades to a glow-worm down the line (duskRose; 8.4 s; fadeBlack in; opens chapter 10).
 *
 * TEACHES the recurrent reader (chapter 6's whisper made visible): a sentence is read one word at a time, the
 * only thing carried forward is the light handed from slip to slip, and it weakens at every hand-off.
 *   carried light   ← the hidden signal: ×0.87 at each hand-off (slip 10 ≈ 0.25; past slip 40 a bare ember)
 *   a wick's ember  ← what that slip still holds once the light has moved on
 *
 * Beats (shot-local, from the locked clock):
 *   0      from black: one lamp (the scribe's), the index tab drops (DEEP DIVE · Everything Looks at Everything);
 *          the 2.1 s head-hold is a slow push down the hall to the scribe while the windows come up
 *   0.3    a ghost of ch08's pierced stencil hangs in the haze above the hall and thins away (silent)
 *   'Another' 'nineteen' 'that' 'language'   the scribe's hand-offs: he walks on twos, raises the lamp, a spark
 *          leaps to the next slip's wick and it catches, a little dimmer each time; the camera tracks with him
 *   'candle'   a ledge of the candle shelf slides into the low foreground: LANGUAGE MUST BE READ IN ORDER, its
 *          ghost sleeve 17 rings (lit 1997), its own small candleAmber pool (STUDY LOCK practical)
 *   'pipe'     the protected pipe from ch06 glows at the candle's foot
 *   'read'     the scribe lifts the lamp: the flame leaves it and runs ahead on its own, wick to wick (on twos)
 *   'order'    the camera pulls back and rises: the line is dozens long and the carried light dwindles to a
 *          glow-worm far down it (beat 'fade'); it crawls on through the hold
 */
import { Timeline } from '../../../core';
import { MOODS, defineShot, mixLab, withAlpha } from '../../../film';
import type { PaintEnv, Pose } from '../../../film';
import { POSES, blendPose, pose, walkPose } from '../../../film/silhouette/puppet';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { indexTabLg } from '../sets/ch03-s01-indexTab';
import { beliefCandle, candleFlame, namedLabel } from '../sets/beliefCandle';
import { CANDLES, type CandleView } from '../sets/studyState';
import { HALL, HALL_VP, type HallCam, hallArch, hallHaze, hallSlip, handLamp, scribeDraw, slipAt, slipScreen, wickFlame } from '../sets/ch10-s01-hall';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s01';
const L = 'L1002';
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const smq = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** sine in-out: the gentlest start and landing for the long pull back */
const sio = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

const AMBER = MOODS.candleAmber;
/** the carried light keeps 87% at each hand-off: slip 10 holds ~0.25, slip 40 a bare ember (0.004) */
const DECAY = 0.87;
/** the scribe stands just short of the slip he lights, a little to the right of the line */
const SX = HALL.beamX + 72;
const standZ = (k: number) => slipAt(k).z - 46;
/** where he waits at the open (between slips 0 and 1: 'we' is already lit), and when the stencil ghost is gone */
const START_Z = standZ(1) - 84;
const GHOST_OUT = 1.6;
const fromZ = (k: number) => (k === 1 ? START_Z : standZ(k - 1));

/** the 1997 candle as this shot shows it (the script: still lit, a ghost sleeve about seventeen rings tall) */
const INORDER: CandleView = { ...CANDLES.find((c) => c.id === 'inorder')!, slot: 6, state: 'live', rings: 17, smoke: false };
const LEDGE = { x0: -60, x1: 560, y: 662, candleX: 150, s: 1.8 };
/** the naming card for this candle, driven here rather than by the film-wide rule: it holds 2.35–4.05 s and is gone
 *  by 4.45 s, before the scribe's track brings him under it; dated 'still burning' (it goes out in ch10-s13b) */
const NAME_VIEW: CandleView = { ...INORDER, years: null };
const nameK = (p: { candle: number }, t: number) => {
  const a = p.candle - 0.15;
  return Math.min(sm((t - a) / 0.35), 1 - sm((t - 4.05) / 0.4));
};

/** reaching up to a wick: lamp hand high and forward, face lifted */
const REACH: Pose = pose({ hipF: 6, kneeF: -4, hipB: -5, kneeB: -1, torso: -4, neck: -8, head: -14, shoulderF: 142, elbowF: 18, wristF: -8, shoulderB: -12, elbowB: 18 }, { handF: 'grip' });
const CARRY: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 6, head: -4, shoulderF: 34, elbowF: 70, wristF: -6, shoulderB: -8, elbowB: 14 }, { handF: 'grip' });
const OFFER: Pose = pose({ hipF: 8, kneeF: -4, hipB: -6, kneeB: -1, torso: 3, neck: -2, head: -10, shoulderF: 112, elbowF: 8, wristF: -4, shoulderB: -14, elbowB: 18 }, { handF: 'grip' });

interface Plan {
  hand: number[]; // hand-off times for slips 1..4 (index = slip)
  walk: { k: number; a: number; b: number }[];
  read: number;
  order: number;
  candle: number;
  pipe: number;
  /** the pull back starts easing here ('with') */
  pull0: number;
  /** wick lit times for every slip (relay included) */
  lit: number[];
  relay0: number;
}

function makePlan(T: { word: (l: string, w: string) => number; beat: (n: string) => number; duration: number }): Plan {
  const hand = [-9, T.word(L, 'Another'), T.word(L, 'nineteen'), T.word(L, 'that'), T.word(L, 'language')];
  const walk: Plan['walk'] = [];
  for (let k = 1; k <= 4; k++) {
    // the first walk waits for the stencil ghost to thin away (gone by GHOST_OUT): until then he stands still and
    // only lifts his lamp; it is a short step up to slip 1 from where he stands
    const b = k === 1 ? hand[1] - 0.26 : hand[k] - 0.42;
    const prevFree = k === 1 ? GHOST_OUT : hand[k - 1] + 0.42;
    const a = Math.max(prevFree, b - 0.9);
    walk.push({ k, a, b });
  }
  const read = T.word(L, 'read');
  const order = T.word(L, 'order');
  const lit: number[] = [-9, ...hand.slice(1)];
  // the relay: from 'read' the flame leaves the lamp and runs ahead on its own, hop by hop, quickening to twos
  let t = read + 0.22;
  let dt = 0.2;
  for (let i = 5; i < HALL.N; i++) {
    lit[i] = t;
    dt = Math.max(1 / 12, dt * 0.88);
    t += dt;
  }
  return { hand, walk, read, order, candle: T.word(L, 'candle'), pipe: T.word(L, 'pipe'), pull0: T.word(L, 'with'), lit, relay0: read + 0.22 };
}

/** the scribe's place and pose at t (on twos) */
function scribeAt(p: Plan, t: number): { z: number; pose: Pose; lampK: number } {
  const tq = tq12(t);
  // which slip he is at
  let z = START_Z;
  let ps: Pose = REACH;
  let handoffs = 0;
  for (let k = 1; k <= 4; k++) if (tq >= p.hand[k]) handoffs = k;
  for (const w of p.walk) {
    if (tq >= w.b) z = standZ(w.k);
    else if (tq >= w.a) {
      const u = (tq - w.a) / (w.b - w.a);
      z = lerp(fromZ(w.k), standZ(w.k), u);
      ps = blendPose(walkPose(u), CARRY, 0.35);
      return { z, pose: ps, lampK: Math.pow(DECAY, handoffs) };
    }
  }
  // standing at slip k: reach before a hand-off, hold, lower, carry
  const k = Math.max(0, Math.min(4, handoffs + (p.walk.find((w) => tq >= w.b && tq < p.hand[w.k]) ? 1 : 0)));
  const h = k >= 1 ? p.hand[k] : -9;
  if (k === 0) {
    // waiting while the ghost thins: he holds still and only raises the lamp a little toward the dark
    ps = blendPose(CARRY, OFFER, 0.55 * sm((tq - 0.35) / 0.9));
  } else {
    const lead = k === 1 ? 0.26 : 0.42;
    const up = sm((tq - (h - lead)) / (k === 1 ? 0.2 : 0.3));
    const down = sm((tq - (h + 0.3)) / 0.3);
    ps = blendPose(blendPose(CARRY, REACH, up), CARRY, down);
  }
  // 'read': the offering lift toward the next slip; the lamp gives its flame away
  if (tq >= p.read - 0.3) {
    const up = sm((tq - (p.read - 0.3)) / 0.3);
    ps = blendPose(ps, OFFER, up);
  }
  let lampK = Math.pow(DECAY, handoffs);
  // once the flame has left it the scribe's own lamp is a low glow: the brightest light is ahead, then none
  lampK = lerp(lampK, 0.3, sm((tq - (p.relay0 - 0.1)) / 0.35));
  return { z, pose: ps, lampK };
}

// ------------------------------------------------------------------------------------------------ camera
/** the hall camera looks a little LEFT of the hall axis (the axis recedes to a VP right of centre) */
const YAW_FWD = { x: -Math.sin(HALL.yaw), z: Math.cos(HALL.yaw) };
/** the pull back eases in from 'with' (5.1 s) so most of the reveal lands on 'order' and is still settling at the
 *  fade (sine in-out over 4.5 s: ~0.75 on 'order', ~0.97 at the last frame) */
const PULL_DUR = 4.5;
const pullU = (p: Plan, t: number) => sio((t - p.pull0) / PULL_DUR);
function camAt(p: Plan, t: number): HallCam {
  // track: the eye ~985 behind and ~520 right of the scribe's mark, easing from slip 0 to slip 4
  const zA = standZ(0), zB = standZ(4);
  const u = smq((t + 0.8) / (p.hand[4] + 0.9));
  const sz = lerp(zA, zB, u);
  // (the eye sits a little left of the old mark so the scribe stands clear of the candle-naming card at frame left)
  let x = SX + 465;
  // the head-hold (2.1 s of music before the first word): a slow push down the hall toward the scribe, settling
  // as he makes his first hand-off on 'Another'
  const hold = 1 - sio((t + 0.4) / (p.hand[1] + 0.6));
  let z = sz - 985 - 210 * hold;
  let y = 200 - 26 * hold;
  // the pull back: from 'with' to the last frame (4.5 s, sine in-out), back along the view and rising, so the
  // far end comes into view by height rather than by distance (a reveal, never a crash zoom)
  const v = pullU(p, t);
  const D = 1100 * v;
  x = Math.min(1040, x - YAW_FWD.x * D);
  z += -YAW_FWD.z * D;
  y = lerp(200, 60, v);
  return { x, y, z };
}

/** the light carried by slip i's wick at t: catches at lit[i] at full carried strength, settles to an ember */
function wickK(p: Plan, i: number, t: number): number {
  const at = p.lit[i];
  if (at === undefined || t < at) return 0;
  const L0 = Math.pow(DECAY, i);
  const age = t - at;
  const catchK = sm(age / 0.12);
  // a lit wick settles to a steady glow of what it was handed (so the line shades from bright to a spark)
  const ember = 0.6 + 0.4 * Math.exp(-age / (i >= 5 ? 0.45 : 1.3));
  return L0 * catchK * ember;
}

// ------------------------------------------------------------------------------------------------ the ledge
function ledge(c: C, env: PaintEnv, dx: number, t: number, pipeK: number, light: number, named: number, glint: number) {
  const m = env.mood;
  const { x0, x1, y } = LEDGE;
  c.save();
  c.translate(dx, 0);
  // the plank (a dark shelf end with a moulded lip), lit along its top by the candle
  const ink = mixLab(m.fg, m.set, 0.18);
  c.fillStyle = ink;
  c.fillRect(x0, y, x1 - x0, 30);
  c.fillRect(x0, y + 30, x1 - x0 - 14, 90);
  c.beginPath();
  c.moveTo(x1, y);
  c.quadraticCurveTo(x1 + 10, y + 14, x1, y + 30);
  c.lineTo(x1 - 14, y + 30);
  c.lineTo(x1 - 14, y);
  c.fill();
  const lip = c.createLinearGradient(x0, 0, x1, 0);
  lip.addColorStop(0, withAlpha(AMBER.rim, 0));
  lip.addColorStop(0.3, withAlpha(AMBER.rim, 0.55 * light));
  lip.addColorStop(0.75, withAlpha(AMBER.rim, 0.25 * light));
  lip.addColorStop(1, withAlpha(AMBER.rim, 0));
  c.fillStyle = lip;
  c.fillRect(x0, y - 0.5, x1 - x0, 1.8);
  // the candle: LANGUAGE MUST BE READ IN ORDER, ghost sleeve 17 rings, still lit
  const env2 = { ...env, mood: { ...m, rim: mixLab(m.rim, AMBER.rim, 0.6), halo: AMBER.halo, core: AMBER.core } } as PaintEnv;
  beliefCandle(c, { x: LEDGE.candleX, y, view: INORDER, s: LEDGE.s, letters: 0, drawFlame: false, seed: 1997, named: 0 }, env2);
  if (named > 0.001) namedLabel(c, { x: LEDGE.candleX, y, view: NAME_VIEW, s: LEDGE.s, named }, env2);
  // the lettering, legible: two columns of small caps rising up the stub (the belief, in its era's mono face)
  const stubTop = y - (270 - 17 * 6) * LEDGE.s;
  c.save();
  c.translate(LEDGE.candleX, y - 14);
  c.rotate(-Math.PI / 2);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  const csz = legibleSize(c, `600 21px ${FONT.mono}`, 21);
  c.font = `600 ${csz}px ${FONT.mono}`;
  c.fillStyle = withAlpha(mixLab(AMBER.rim, AMBER.core, 0.45), 0.7 + 0.3 * light);
  (c as C & { letterSpacing: string }).letterSpacing = '0.4px';
  c.fillText('LANGUAGE MUST BE', 0, -csz * 0.2);
  c.fillText('READ IN ORDER', 0, csz * 0.95);
  (c as C & { letterSpacing: string }).letterSpacing = '0px';
  c.restore();
  // the protected pipe from ch06, lying at the candle's foot: a translucent paper tube between two ink edges, ringed
  // end caps, and its × 1.0 self-loop arching over it (the same marks as ch06-s06, at prop scale)
  // (1.5x the first cut, so it reads as chapter 6's long-memory unit rather than a dial)
  const px = LEDGE.candleX + 122, py = y - 34, PL = 225, PR = 18;
  const paper = mixLab(mixLab(m.setHaze, AMBER.halo, 0.45), AMBER.core, 0.55 * pipeK);
  c.fillStyle = withAlpha(paper, 0.82);
  c.fillRect(px, py - PR, PL, PR * 2);
  // the lit core along the tube (it glows from within on 'pipe')
  const lg = c.createLinearGradient(0, py - PR, 0, py + PR);
  lg.addColorStop(0, withAlpha(AMBER.core, 0));
  lg.addColorStop(0.45, withAlpha(AMBER.core, 0.45 * pipeK));
  lg.addColorStop(1, withAlpha(AMBER.core, 0));
  c.fillStyle = lg;
  c.fillRect(px, py - PR, PL, PR * 2);
  c.fillStyle = ink;
  c.fillRect(px, py - PR - 1.5, PL, 3);
  c.fillRect(px, py + PR - 1.5, PL, 3);
  // end caps: ink collars with a rim line
  for (const ex of [px - 6, px + PL - 4]) {
    c.fillStyle = ink;
    c.fillRect(ex, py - PR - 7, 14, PR * 2 + 14);
    c.fillStyle = withAlpha(AMBER.rim, 0.35 + 0.3 * light);
    c.fillRect(ex, py - PR - 7, 14, 1.6);
  }
  // the glint: a short bright run along the inside of the tube on 'pipe' (the protected signal passing through)
  if (glint > 0 && glint < 1) {
    const gx = px + 6 + (PL - 12) * glint;
    const op = c.globalCompositeOperation;
    c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(gx, py, 0, gx, py, 46);
    gg.addColorStop(0, withAlpha(AMBER.core, 0.85 * Math.sin(Math.PI * glint)));
    gg.addColorStop(0.3, withAlpha(AMBER.halo, 0.35 * Math.sin(Math.PI * glint)));
    gg.addColorStop(1, withAlpha(AMBER.halo, 0));
    c.save();
    c.beginPath();
    c.rect(px, py - PR + 1.5, PL, PR * 2 - 3);
    c.clip();
    c.fillStyle = gg;
    c.fillRect(gx - 46, py - 46, 92, 92);
    c.restore();
    c.globalCompositeOperation = op;
  }
  // the self-loop: a paper band arching up off the tube and back into it, with its arrowhead
  const lx = px + PL * 0.42, ly = py - PR - 2, R = 28;
  c.lineCap = 'butt';
  c.strokeStyle = ink;
  c.lineWidth = 13;
  c.beginPath();
  c.arc(lx, ly, R, Math.PI * 1.02, Math.PI * 1.98);
  c.stroke();
  c.strokeStyle = paper;
  c.lineWidth = 7;
  c.beginPath();
  c.arc(lx, ly, R, Math.PI * 1.04, Math.PI * 1.96);
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(lx + R - 12, ly - 4);
  c.lineTo(lx + R + 12, ly - 4);
  c.lineTo(lx + R, ly + 10);
  c.closePath();
  c.fill();
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = `500 ${legibleSize(c, `500 19px ${FONT.mono}`, 19)}px ${FONT.mono}`;
  c.fillStyle = withAlpha(mixLab(AMBER.rim, AMBER.core, 0.4), Math.max(0.62, (0.55 + 0.45 * pipeK) * light));
  c.fillText('× 1.0', lx + R + 14, ly - 8);
  c.restore();
  if (pipeK > 0.01) {
    const op = c.globalCompositeOperation;
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(px + PL / 2 + dx, py, 0, px + PL / 2 + dx, py, 160);
    g.addColorStop(0, withAlpha(AMBER.core, 0.28 * pipeK));
    g.addColorStop(0.4, withAlpha(AMBER.halo, 0.18 * pipeK));
    g.addColorStop(1, withAlpha(AMBER.halo, 0));
    c.fillStyle = g;
    c.fillRect(px + dx - 40, py - 160, PL + 80, 320);
    c.globalCompositeOperation = op;
  }
  return { flame: { ...candleFlame({ x: LEDGE.candleX + dx, y, view: INORDER, s: LEDGE.s }) }, stubTop };
}

// ------------------------------------------------------------------------------------------------ the stencil ghost
/** ch08's pierced tin stencil (the vertical-edge kernel: round holes cut for +1 +2 +1, closed shutters for −1 −2 −1,
 *  plain tin for 0, a short candle standing behind its top edge), hung high in the haze over the hall (y ≈ 120–220)
 *  as a memory. A true cut-paper SILHOUETTE: one dark plate with its holes cut evenodd, so the haze and the far
 *  windows show through them; no drawn grid. `a` is its presence 0..1 (thins away by GHOST_OUT). */
// (it hangs in front of the near window's bright panes so it reads as a silhouette, its holes showing the light)
const GH = { cx: 436, cy: 176, TC: 30, PAD: 11 };
function stencilGhost(c: C, env: PaintEnv, a: number, t: number) {
  if (a <= 0.004) return;
  const m = env.mood;
  const { TC, PAD } = GH;
  const F = TC * 3;
  const cx = GH.cx, cy = GH.cy - 6 * t; // it drifts up a little as it thins
  const x0 = cx - F / 2, y0 = cy - F / 2;
  const K = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  // hazed ink: one step lighter than the hall's near ink (it hangs deep in the haze), never as dark as the scribe
  const ink = mixLab(mixLab(m.fg, m.set, 0.2), m.haze, 0.18);
  c.save();
  c.globalAlpha *= 0.8 * a;
  c.fillStyle = ink;
  // two fine chains up into the roof dark
  for (const chx of [x0 + 7, x0 + F - 7]) {
    for (let yy = y0 - PAD - 6; yy > -30; yy -= 7) c.fillRect(chx - 1, yy - 4, 2, 4.5);
  }
  // the short candle standing on a bracket behind the plate's top edge
  const top = y0 - PAD;
  c.fillRect(cx - 7, top - 22, 14, 23);
  c.fillRect(cx - 14, top - 3, 28, 3);
  // the plate, with a notched (cut-paper) border, holes cut evenodd for the positive weights
  const plate = new Path2D();
  const X0 = x0 - PAD, Y0 = y0 - PAD, W = F + PAD * 2;
  plate.moveTo(X0 + 4, Y0);
  plate.lineTo(X0 + W - 4, Y0);
  plate.lineTo(X0 + W, Y0 + 4);
  plate.lineTo(X0 + W, Y0 + W - 4);
  plate.lineTo(X0 + W - 4, Y0 + W);
  plate.lineTo(X0 + 4, Y0 + W);
  plate.lineTo(X0, Y0 + W - 4);
  plate.lineTo(X0, Y0 + 4);
  plate.closePath();
  K.forEach((w, q) => {
    if (w <= 0) return;
    const i = q % 3, j = Math.floor(q / 3);
    const rr = TC * 0.13 * w + 3;
    const hx = x0 + i * TC + TC / 2, hy = y0 + j * TC + TC / 2;
    plate.moveTo(hx + rr, hy);
    plate.arc(hx, hy, rr, 0, Math.PI * 2);
  });
  c.fill(plate, 'evenodd');
  // the closed shutters: a hairline circle and bar pressed into the tin (rim-lit, faint)
  c.strokeStyle = withAlpha(m.rim, 0.32);
  c.lineWidth = 1;
  K.forEach((w, q) => {
    if (w >= 0) return;
    const i = q % 3, j = Math.floor(q / 3);
    const rr = TC * 0.13 * -w + 3;
    const hx = x0 + i * TC + TC / 2, hy = y0 + j * TC + TC / 2;
    c.beginPath();
    c.arc(hx, hy, rr, 0, Math.PI * 2);
    c.moveTo(hx - rr * 0.7, hy);
    c.lineTo(hx + rr * 0.7, hy);
    c.stroke();
  });
  // a rim along the plate's top edge only (the light is behind and above)
  c.fillStyle = withAlpha(m.rim, 0.4);
  c.fillRect(X0 + 4, Y0, W - 8, 1.2);
  c.restore();
  // the candle's flame and the light through the holes (additive, soft; it reads through the cut-outs)
  const op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  const glow = (x: number, y: number, r: number, col: string, al: number) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(col, al));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  };
  K.forEach((w, q) => {
    if (w <= 0) return;
    const i = q % 3, j = Math.floor(q / 3);
    glow(x0 + i * TC + TC / 2, y0 + j * TC + TC / 2, 9 + 5 * w, m.core, 0.35 * a);
  });
  glow(cx, top - 30, 34, m.halo, 0.28 * a);
  glow(cx, top - 30, 8, m.core, 0.55 * a);
  c.globalCompositeOperation = op;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = m.core;
  c.beginPath();
  c.moveTo(cx, top - 38);
  c.quadraticCurveTo(cx + 4, top - 30, cx, top - 23);
  c.quadraticCurveTo(cx - 4, top - 30, cx, top - 38);
  c.fill();
  c.restore();
}

/** the near-black framing pillar at frame right (L5): a fluted shaft with a plinth and a capital, cut-paper flat */
function nearPillar(c: C, env: PaintEnv, dx: number) {
  const ink = env.fill('fg');
  const x = 1184 + dx;
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(x + 8, -20);
  c.lineTo(x + 8, 34);
  c.lineTo(x - 10, 46);
  c.lineTo(x - 10, 64);
  c.lineTo(x + 6, 72);
  c.lineTo(x + 6, 612);
  c.lineTo(x - 8, 624);
  c.lineTo(x - 14, 650);
  c.lineTo(x - 14, 740);
  c.lineTo(x + 140, 740);
  c.lineTo(x + 140, -20);
  c.closePath();
  c.fill();
  // flutes: two hairline cuts down the shaft, catching the window light
  c.strokeStyle = withAlpha(env.mood.rim, 0.16);
  c.lineWidth = 1.2;
  c.beginPath();
  for (const fx of [22, 38]) {
    c.moveTo(x + fx, 84);
    c.lineTo(x + fx, 600);
  }
  c.stroke();
  c.strokeStyle = withAlpha(env.mood.rim, 0.32);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(x + 6, 72);
  c.lineTo(x + 6, 612);
  c.stroke();
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const plan = makePlan(T);
    tl.hold(0, T.duration);
    return { tl, plan, D: T.duration, fade: T.beat('fade') };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const p = scene.plan as Plan;
    const cam = camAt(p, t);
    const sc = scribeAt(p, t);
    const tq = tq12(t);

    // from black: the windows come up after the lamp
    // and dim a little as the carried light runs away down the line (the dusk deepens; the glow-worm must read)
    const dusk = 1 - 0.3 * pullU(p, t);
    const dawn = (0.25 + 0.75 * sm((t + 0.2) / 2.4)) * dusk;
    f.backlight({ sunX: HALL_VP.x - 40, sunY: HALL_VP.y - 10, intensity: dawn });

    // relay: each slip's wick, and the travelling spark between hops
    const wk: number[] = [];
    for (let i = 0; i < HALL.N; i++) wk[i] = wickK(p, i, t);
    let front = -1;
    for (let i = 0; i < HALL.N; i++) if (p.lit[i] !== undefined && tq >= p.lit[i]) front = i;

    const light = { halo: f.mood.halo, core: f.mood.core };
    const split = 2600;

    f.layer('L2', (c, env) => {
      hallArch(c, cam, env, { dark: (1 - dusk) * 1.2, bloom: 0.85 * (0.3 + 0.7 * sm((t + 0.2) / 2.4)) });
      // the ghost of ch08's stencil: in at 0.3, thinning away over 1.5 s from 0.9
    });
    // fog sheets that run off the bottom of the frame (the presets end in a soft edge across the bare floor)
    f.fog({ yCenter: 470, height: 520, alpha: 0.3, drift: 6 });

    const drawSlips = (c: C, env: PaintEnv, near: boolean) => {
      for (let i = HALL.N - 1; i >= 0; i--) {
        const S = slipScreen(cam, i);
        if ((S.vz <= split) !== near) continue;
        const k = wk[i];
        // lamp light on a slip: from its own wick, and from the scribe's lamp when he stands at it
        const atScribe = Math.abs(slipAt(i).z - sc.z) < 140 ? 0.85 * sc.lampK : 0;
        const lit = Math.min(1, Math.max(k * 1.1, atScribe));
        hallSlip(c, cam, env, i, { lit, swing: Math.sin(tq * 0.9 + i * 1.7) * 0.012 });
      }
      for (let i = HALL.N - 1; i >= 0; i--) {
        const S = slipScreen(cam, i);
        if ((S.vz <= split) !== near || wk[i] <= 0.004) continue;
        // the relay's leading flame stays a readable point of light however dim it gets (the glow-worm)
        const vis = i === front && i >= 5 ? 0.5 : 0;
        wickFlame(c, S.wick.x, S.wick.y - 4 * S.s, S.s, wk[i], t, i * 7 + 3, light, vis);
      }
    };

    f.layer('L3', (c, env) => {
      drawSlips(c, env, false);
      // the ghost of ch08's stencil: in by 0.5, thinning to nothing by GHOST_OUT (1.6 s); the scribe waits for it
      const ga = sm((t - 0.1) / 0.4) * (1 - sm((t - 0.8) / (GHOST_OUT - 0.8)));
      stencilGhost(c, env, ga, Math.max(0, t));
    });
    f.fog({ yCenter: 600, height: 300, alpha: 0.12, drift: 10 });

    let candleFlamePt: { x: number; y: number } | null = null;
    const slide = sm((tq - (p.candle - 0.05)) / 0.55);
    const ledgeDx = lerp(-460, 0, slide);
    // the pipe's glow starts at 'pipe' − 0.2 and peaks on the word (a small overshoot, then a steady glow); the glint
    // runs along the tube from the word
    const pipeK = Math.min(1.15, sm((t - (p.pipe - 0.2)) / 0.2) * (1 + 0.15 * (1 - sm((t - p.pipe) / 0.6))));
    const glint = (t - (p.pipe - 0.05)) / 0.6;

    f.layer('L4', (c, env) => {
      drawSlips(c, env, true);
      // the lamp's pool on the floor at his feet
      const fp = slipScreen(cam, 0); // (ensures cache warm; unused)
      void fp;
      const sd = scribeDraw(c, cam, env, { x: SX, z: sc.z, pose: sc.pose, facing: 'right', light: { x: -1, y: -0.4 } });
      if (sd) {
        const s = sd.q.s;
        const lk = sc.lampK;
        // floor pool
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        c.save();
        c.translate(sd.q.x + 20 * s, sd.q.y);
        c.scale(1, 0.16);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 260 * s);
        g.addColorStop(0, withAlpha(f.mood.halo, 0.2 * lk));
        g.addColorStop(1, withAlpha(f.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(-260 * s, -260 * s, 520 * s, 520 * s);
        c.restore();
        c.globalCompositeOperation = op;
        handLamp(c, env, sd.hand.x, sd.hand.y, s, lk, t, light);
        // the hand-off spark: from the lamp flame to the next wick
        const from = { x: sd.hand.x, y: sd.hand.y + 20 * s };
        for (let k = 1; k <= 5; k++) {
          const at = k <= 4 ? p.hand[k] : p.relay0;
          const u = (tq - (at - 0.17)) / 0.17;
          if (u < 0 || u > 1) continue;
          const W = slipScreen(cam, k).wick;
          const x = lerp(from.x, W.x, u), y = lerp(from.y, W.y, u) - Math.sin(u * Math.PI) * 26 * s;
          wickFlame(c, x, y, s * 0.6, Math.pow(DECAY, k), t, 900 + k, light, 0.7);
        }
      }
      // relay sparks between hops (wick i-1 → wick i)
      for (let i = 6; i < HALL.N; i++) {
        const a = p.lit[i - 1], b = p.lit[i];
        if (tq < a || tq >= b) continue;
        const u = (tq - a) / (b - a);
        const A = slipScreen(cam, i - 1).wick, B = slipScreen(cam, i).wick;
        const s = lerp(slipScreen(cam, i - 1).s, slipScreen(cam, i).s, u);
        wickFlame(c, lerp(A.x, B.x, u), lerp(A.y, B.y, u) - Math.sin(u * Math.PI) * 18 * s, s * 0.7, Math.pow(DECAY, i), t, 500 + i, light, 0.75);
      }
      // the ledge slides in on 'candle' (low foreground); its flame is a small candleAmber practical
      if (slide > 0) {
        const r = ledge(c, env, ledgeDx, t, pipeK, slide, nameK(p, t), glint);
        candleFlamePt = r.flame;
      }
    });
    f.rim({ x: -0.55, y: -0.83 });
    if (candleFlamePt) {
      const fp = candleFlamePt as { x: number; y: number };
      f.layer('L4', (c) => wickFlame(c, fp.x, fp.y + 6, LEDGE.s * 1.05, slide, t, 1997, { halo: AMBER.halo, core: AMBER.core }));
    }

    // the near-black framing pillar (L5): drifts a touch right as the camera pulls back past it
    f.layer('L5', (c, env) => nearPillar(c, env, 46 * pullU(p, t)));

    // screen-locked: the chapter's index tab
    // (the chapter-size tab: 24 px cap height at 1080p, no letter-spacing; the tab widens to fit)
    indexTabLg(f.c, { title: 'DEEP DIVE · Everything Looks at Everything', at: 0.1, hold: 2.5, baseline: 52, cap: 24 }, { t, mood: f.mood });
    void hallHaze;
  },
});
