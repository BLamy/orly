/**
 * ch04-s10 — NO GRID, ONLY A RANGE: THE LENS TRAIN (scene, candleAmber; cut on motion from the tag; 18.1 s).
 * L0420 "Promise only a range, and it must tell the tiniest difference from none. It magnifies by two to the hundred
 *        and forty-ninth."
 * L0421 "The faintest difference becomes a full bar. A sixteen-operation comparison, and four and a half gives ten.
 *        Correct."
 *
 * The camera follows the wire of a along the bench to its far end, where the lamp is lowered nearly to dark and only
 * the lenses glow (sets/ch04-s10-lenses). TEACHES, word by word (TE08, EX05, TE10; the scales are the runtime's):
 *   'difference'  out of the d = a − 4 box a hairline of copper light flickers at the edge of visibility (beat hairline)
 *   'magnifies'   it passes lens 1 (×2^14) and thickens; lenses 2-6 (×2^24 each) follow one per beat, each followed by
 *                 a stop that clips at the full-bar height; the brass dial winds to 2^149 (beat lenses). The beam's
 *                 thickness is drawn on the exponent (a log scale), so each lens visibly adds its power of two
 *   'faintest'    the seventh stage (the final ReGLU, ×2^15 inside a ramp) and the flip: the beam floods out as a solid
 *                 copper bar (beat bar)
 *   'sixteen'     the counter settles at 16 (the 16 operation pins under the train all lit); the card: 'a > 4 in 16
 *                 ops · 15 layers · bit 1' (beat sixteen)
 *   'ten'         the bar opens the 10 shutter fully and a 10 tile drops into the tray (beat ten). Hold on the bar.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { cam3Interp, cardInkAlpha, cardPaperAlpha, defineShot, FONT, mixLab, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { LAMP, benchRoom, heroTile, nearEdge, nearPost, postCard, tray, type RoomOpts } from '../sets/ch04-s06-bench';
import { GATE, gateBack, gateFront } from '../sets/ch04-s06-gate';
import { copperOf } from '../sets/narratorHands';
import { opsCounter } from '../sets/ch04-s08-grid';
import { EXP, LT, PIN_X, SCALES, TOTAL_EXP, lensTrain, opPins } from '../sets/ch04-s10-lenses';

const ID = 'ch04-s10';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

/** the select at the train's end: the gate (above the bar), its link rod, the tray */
const SEL = { SX: 1046, Y10: 262, Y12: 338, TX: 1136, TY: 486, TILE_S: 1.5 } as const;
const DIAL = { x: 150, y: 168, r: 50 };
const COUNTER = { x: 1120, y: 120 };
const sup = (n: number) => String(n).replace(/[0-9]/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]);

interface Beats {
  hairline: number;
  lenses: number;
  per: number;
  bar: number;
  sixteen: number;
  ten: number;
  /** when the front reaches k (k = 0..8) */
  at: number[];
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const hairline = T.beat('hairline');
    const lenses = T.beat('lenses');
    const bar = T.beat('bar');
    // one lens per beat from 'magnifies' to the seventh stage, then the flip lands on 'faintest'
    const per = (bar - 0.35 - lenses) / 6;
    const at = [hairline - 1.0, hairline + 0.15];
    for (let k = 2; k <= 7; k++) at.push(lenses + per * (k - 1));
    at.push(bar);
    const b: Beats = { hairline, lenses, per, bar, sixteen: T.beat('sixteen'), ten: T.beat('ten'), at };
    // cut on motion: trucking right along the wire of a, easing to rest at the train's start; then a slow drift with the
    // beam; a breath back on the bar; a push to the select for the ten
    const cam = tl.channel<Camera3>('cam', { x: 150, y: 378, z: 70, lens: 1 }, cam3Interp);
    tl.tween(cam, { x: 470, y: 372, z: 56, lens: 1 }, { at: 0, dur: hairline - 0.3, ease: ease.out });
    tl.tween(cam, { x: 600, y: 360, z: 24, lens: 1 }, { at: hairline - 0.3, dur: bar - hairline + 0.3, ease: ease.move });
    tl.tween(cam, { x: 640, y: 356, z: 10, lens: 1 }, { at: bar, dur: b.sixteen - bar, ease: ease.move });
    tl.tween(cam, { x: 860, y: 352, z: 150, lens: 1 }, { at: b.sixteen + 0.4, dur: b.ten + 0.2 - b.sixteen - 0.4, ease: ease.move });
    tl.tween(cam, { x: 876, y: 352, z: 168, lens: 1 }, { at: b.ten + 0.2, dur: D - b.ten - 0.2, ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b, D };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    f.camera(s.get(scene.cam));
    f.setMood('candleAmber');
    const room: RoomOpts = { key: ID, to: 'candleAmber', u: 1, sunX: 600, intensity: 0.42, pad: 420 };
    benchRoom(f, room);
    // the lamp lowered nearly to dark: a veil over the room behind the train
    f.layer('L3', (c) => {
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5);
      c.fillRect(-900, -400, 3200, 1600);
    });
    f.practical({ x: LAMP.x, y: LAMP.y, kind: 'lamp', seed: LAMP.seed, intensity: 0.14, radius: LAMP.radius, layer: 'L3' });
    f.fog({ yCenter: 520, height: 140, alpha: 0.08, drift: 8 });

    const front = frontAt(t, b);
    const flood = win(t, b.bar, b.bar + 0.45);
    f.layer('L4', (c, env) => {
      dial(c, env, front, t, b);
      lensTrain(c, env, { style: 'lit', front, flick: flicker(t), flood, kick: kickAt(t, b) });
      opPins(c, env, { lit: pinsLit(front, flood), style: 'lit' });
      select(c, env, t, tq, b, flood);
      opsCounter(c, env, { value: 16, spin: win(t, b.sixteen - 0.9, b.sixteen), alpha: win(t, b.bar + 0.6, b.bar + 1.0), x: COUNTER.x, y: COUNTER.y, id: `${ID}/ops` });
      card(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // the lenses' glow on the room: a soft practical at each lit lens, the bar's flood at its end
    LT.LENS.forEach((x, i) => {
      const lit = clamp01((front - i - 0.85) / 0.15);
      if (lit > 0) f.practical({ x, y: LT.Y, kind: 'screen', seed: 60 + i, intensity: 0.22 + 0.1 * lit, radius: 70 });
    });
    if (flood > 0) f.practical({ x: LT.END - 20, y: LT.Y, kind: 'lamp', seed: 71, intensity: 0.45 * flood, radius: 150 });
    nearEdge(f, ID, room, -400, 1700);
    nearPost(f, ID, room, 1236);
  },
});

/** the beam's front (0..8) at t: the hairline creeps to lens 1 by 'difference', then one stage per beat */
function frontAt(t: number, b: Beats): number {
  const at = b.at;
  if (t < at[0]) return 0;
  for (let k = 0; k < at.length - 1; k++) {
    if (t < at[k + 1]) {
      // the hairline creeps; the stages are crossed in a quick, eased step each (on ones: it is light)
      if (k === 0) return clamp01((t - at[0]) / (at[1] - at[0]));
      const u = clamp01((t - at[k]) / Math.min(0.42, at[k + 1] - at[k]));
      return k + sm(u);
    }
  }
  return 8;
}
/** the hairline's flicker at the edge of visibility (seeded, on ones) */
function flicker(t: number): number {
  return 0.45 + 0.35 * Math.sin(t * 23.1) * Math.sin(t * 7.7 + 1.3) + 0.2 * Math.sin(t * 41.3);
}
function kickAt(t: number, b: Beats): number {
  let k = 0;
  for (let i = 1; i <= 6; i++) if (t >= b.at[i]) k = Math.exp(-(t - b.at[i]) * 5);
  return k;
}
/** operation pins lit: d with the hairline; two per lens + stop as the front passes; the ReGLU's two; the bit at the flood */
function pinsLit(front: number, flood: number): number {
  if (front <= 0) return 0;
  let n = 1;
  for (let i = 0; i < 6; i++) n += 2 * clamp01((front - i - 0.85) / 0.3);
  n += 2 * clamp01((front - 6.85) / 0.3);
  n += flood;
  return Math.min(PIN_X.length, n);
}

// ---------------------------------------------------------------- the dial: winds to 2^149
function dial(c: C, env: PaintEnv, front: number, t: number, b: Beats) {
  const { x, y, r } = DIAL;
  // how much of the 149 the lenses have added (exponent gained so far, interpolated across each stage)
  let gained = 0;
  for (let k = 1; k <= 7; k++) gained += SCALES[k - 1] * clamp01(front - k + 0.15 > 0 ? (front - (k - 0.15)) / 0.4 : 0);
  const u = clamp01(gained / TOTAL_EXP);
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
  // a black bracket to the window wall and the brass face
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x - 4, y + r - 4, 8, 120);
  const brass = mixLab(mixLab('#9a7438', env.mood.halo, 0.25), PUPPET_NEAR_BLACK, 0.25);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(x, y, r + 6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = brass;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  // ticks: one per stage's scale (cumulative: 14, 38, 62, 86, 110, 134, 149)
  c.strokeStyle = withAlpha('#1e1206', 0.8);
  c.lineWidth = 1.6;
  let acc = 0;
  c.beginPath();
  for (const s of [0, ...SCALES]) {
    acc += s;
    const a = a0 + (a1 - a0) * (acc / TOTAL_EXP);
    c.moveTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72);
    c.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92);
  }
  c.stroke();
  textRole(c, 'texture', () => {
    c.font = `600 ${14}px ${FONT.mono}`;
    c.fillStyle = withAlpha('#1e1206', 0.9);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(`2${sup(TOTAL_EXP)}`, x, y + r * 0.42);
    c.textAlign = 'left';
  });
  // the needle (on ones: it is the light's measure)
  const a = a0 + (a1 - a0) * u;
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 3.4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - Math.cos(a) * 8, y - Math.sin(a) * 8);
  c.lineTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86);
  c.stroke();
  c.lineCap = 'butt';
  c.fillStyle = copperOf(env, 0.5 + 0.4 * win(t, b.bar - 0.1, b.bar + 0.3));
  c.beginPath();
  c.arc(x, y, 4.5, 0, Math.PI * 2);
  c.fill();
  void EXP;
}

// ---------------------------------------------------------------- the select: link rod, gate, the 10 tile, the tray
function select(c: C, env: PaintEnv, t: number, tq: number, b: Beats, flood: number) {
  // the bit opens the 10 shutter on 'ten' (12 stays shut)
  const open10 = win(tq, b.ten - 0.25, b.ten + 0.05);
  const gate = { x: SEL.SX, y10: SEL.Y10, y12: SEL.Y12, open10, open12: 0, lit: 0.35 + 0.5 * flood };
  // link rod from the bar's end up to the gate's foot
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(LT.END, LT.Y - LT.H / 2);
  c.lineTo(SEL.SX, SEL.Y12 + GATE.FOOT / 2);
  c.stroke();
  c.strokeStyle = withAlpha(copperOf(env, 0.6), 0.5 * flood);
  c.lineWidth = 1.2;
  c.stroke();
  tray(c, env, SEL.TX, SEL.TY, 120, 28, LT.FOOT);
  gateBack(c, env, gate);
  // the waiting tiles in each window; the 10 slides out when its panel lifts and drops into the tray
  const out = clamp01((t - (b.ten + 0.02)) / 0.3);
  const fallT = t - (b.ten + 0.32);
  let x10 = SEL.SX - 6 + out * 70;
  let y10: number = SEL.Y10;
  if (fallT > 0) {
    const G = 2600;
    const dur = Math.sqrt((2 * (SEL.TY - 5 - SEL.Y10)) / G);
    const u = clamp01(fallT / dur);
    x10 = lerp(SEL.SX + 64, SEL.TX, u);
    y10 = Math.min(SEL.TY - 5, SEL.Y10 + 0.5 * G * fallT * fallT);
  }
  const landed = fallT > Math.sqrt((2 * (SEL.TY - 5 - SEL.Y10)) / 2600);
  const glow = landed ? win(t, b.ten + 0.5, b.ten + 0.7) * (1 - 0.6 * win(t, b.ten + 1.2, b.ten + 2.2)) : 0;
  c.save();
  if (fallT <= 0) {
    c.beginPath();
    c.rect(SEL.SX - 60, 0, 400, 800);
    c.clip();
  }
  heroTile(c, env, x10, y10, '10', { s: SEL.TILE_S, glow });
  c.restore();
  c.save();
  c.beginPath();
  c.rect(SEL.SX - 60, 0, 120, 800);
  c.clip();
  heroTile(c, env, SEL.SX - 6, SEL.Y12, '12', { s: SEL.TILE_S });
  c.restore();
  gateFront(c, env, gate);
}

// ---------------------------------------------------------------- the card: the scales, then the count
function card(c: C, env: PaintEnv, t: number, b: Beats) {
  const ink0 = b.lenses;
  const paper = cardPaperAlpha(t, ink0);
  if (paper <= 0.001) return;
  const inkAt = (at: number) => win(t, at, at + 0.3);
  const hot = (at: number) => win(t, at, at + 0.3) * (1 - win(t, at + 1.4, at + 2.4));
  postCard(c, env, {
    id: `${ID}/card`,
    x: 330,
    y: 52,
    w: 600,
    h: 102,
    paper,
    swing: 0,
    clipTo: { x: 660, y: -80 },
    size: 22,
    lead: 34,
    lines: [
      {
        text: `×2${sup(14)} · ×2${sup(24)} ×5 · ×2${sup(15)}  =  2${sup(149)}`,
        ink: 1,
        segs: [
          { text: `×2${sup(14)}`, ink: cardInkAlpha(t, ink0) },
          { text: ` · ×2${sup(24)} ×5`, ink: inkAt(b.at[2] - 0.05) },
          { text: ` · ×2${sup(15)}`, ink: inkAt(b.at[7] - 0.05) },
          { text: `  =  2${sup(149)}`, ink: inkAt(b.bar - 0.05), hot: hot(b.bar) },
        ],
      },
      {
        text: 'a > 4 in 16 ops · 15 layers · bit 1 → 10',
        ink: inkAt(b.sixteen - 0.1),
        segs: [
          { text: 'a > 4 in 16 ops · 15 layers', ink: inkAt(b.sixteen - 0.1) },
          { text: ' · bit 1', ink: inkAt(b.sixteen + 0.7) },
          { text: ' → 10', ink: inkAt(b.ten - 0.05), hot: hot(b.ten) },
        ],
      },
    ],
  });
}
