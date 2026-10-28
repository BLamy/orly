/**
 * ch07-s10 — THE REJECTED SHORTCUT (scene, duskRose; crossfade in; 10.88 s on the locked clock).
 *   L0719 "An early fix snapped the sketch to a grid, in ordinary code. Cheng turned it down: “the spirit of the
 *          gallery is to learn something.”"
 *
 * The light cools to dusk. A plain desk seen from behind its user: an evening window behind (left), a bookshelf (right),
 * an anglepoise lamp at the desk's far left corner reaching over the laptop. On the desk's far edge stands the gallery stage in miniature (the same
 * booth, small, its trestles on the desk line); nearer, a logo-less laptop (bezel, lid edge, a blank lit screen, a dark
 * keyboard deck) where Cheng's hands (cast author-hands, framed at the wrists, seen from behind) rest flat, fingers
 * curled over the keys, the screen's glow behind them: hands and stage share the frame as a pair. The miniature carries
 * a hand-drawn version of the Story sketch: every line of it 6-14 px off the preset's grid, each frame tilted a little
 * (an illustration), the edges of one line within one reach of each other, the photos fitted to it.
 *
 * TEACHES, word by word:
 *   fix (1.11)       a notched brass ruler slides in by itself along a paper groove at the stage's sill, from frame
 *                    right, engraved 'snap to grid · ordinary code' (no hand holds it; the first answer's author is not
 *                    shown); the photos dim so the sketch's ink reads over them
 *   snapped (1.68)   it presses up against the sketch: guide lines flash from its notches and in two frames (a hard
 *                    clack, no ease) all ten cut-paper rectangles (the sketch, not the photos) jump onto them: a perfect
 *                    grid in one stroke
 *   Cheng (4.47)     his right hand lifts from the keys, travels to the ruler and lies flat on its left end by 4.9
 *   spirit (6.05)    the hand lifts away, the ruler slides back out along its groove, and the sketch eases back to where
 *                    the hand drew it (0.8 s); his lamplit name card sets (attribution only: his words are spoken)
 *   slider (9.0)     a small paper slider, 'Misalignment penalty', rises beside the stage, set to 4 %; the photos drift
 *                    into line on their own, slowly (no code moves them: each line rests at the mean of where its
 *                    rectangles are drawn, as the gallery's README says; DG13): each edge moves at most what the
 *                    penalty's reach allows. The camera eases in toward the slider.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import {
  FONT,
  LAYERS,
  PUPPET_NEAR_BLACK,
  anglepoiseLamp,
  bookshelfWall,
  cam3Interp,
  defineShot,
  legibleSize,
  mixLab,
  nameCard,
  overscan,
  textProbe,
  textRole,
  withAlpha,
} from '../../../film';
import { hash1 } from '../../../film/core/frame';
import {
  GAL,
  PHOTO_BAKE,
  brassOf,
  galleryBooth,
  glowAt,
  photoArt,
  photoCard,
  px,
  seg,
  sketchFrame,
  stageRect,
  twos,
  type Booth,
  type GRect,
} from '../sets/ch07-s06-gallery';

type C2 = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
const ID = 'ch07-s10';

// ------------------------------------------------------------------ staging (L4 rest px)
/** the desk's far edge (the line the miniature stands on) */
const DESK_Y = 485;
/** the miniature: 300 px wide on the desk line, its trestles short (a model on a desk) */
const B10: Booth = { x: 690, y: 130, w: 300, ground: DESK_Y };
const GROOVE_Y = B10.y + B10.w * 0.8 + 2; // the screen's sill
const RULER = { len: B10.w + 64, h: 22, restX: B10.x - 32 };
/** the laptop: lid (bezel) and keyboard deck, seen from behind the typist */
const LID = { x: 326, y: 372, w: 288, h: 184 };
const DECK = { y0: LID.y + LID.h, y1: 672, x0: LID.x - 4, x1: LID.x + LID.w + 4, flare: 34 };
/** the anglepoise at the desk's far left corner (its foot just out of frame), reaching over toward the laptop */
const LAMP = { x: -14, y: DESK_Y, s: 5.4, reach: 0.75, aim: 0.25 };
const SLIDER = { x: 1068, y: 420, w: 110 };
const CAM_A: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
const CAM_B: Camera3 = { x: 770, y: 376, z: 112, lens: 1 };
const sine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)));
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

// ------------------------------------------------------------------ the hand-drawn sketch and where the photos settle
/**
 * Every LINE of the preset (the edges of one kind at one value) is drawn off the grid by 6-14 px, so the ruler's snap
 * moves whole lines visibly; inside a line each edge wobbles by at most ±2.9 px, so the edges of one line stay within
 * one reach of each other (the reach is 2 % of the stage at the slider's 4 %: 6 px here) and the penalty can pull them
 * together. Offsets in px at w = 300 (stage height 240); chosen so neighbouring rectangles never overlap and the gaps
 * come out uneven.
 */
const LINE_OFF: Record<string, number> = {
  // left edges
  'L0.036': -9, 'L0.273': -6, 'L0.51': 7, 'L0.656': 6, 'L0.747': 13,
  // right edges
  'R0.253': -11, 'R0.49': -8, 'R0.727': 12, 'R0.636': -7, 'R0.964': 7,
  // top edges
  'T0.045': 7, 'T0.3175': 9, 'T0.59': 8, 'T0.785': 13,
  // bottom edges
  'B0.2925': -6, 'B0.565': -7, 'B0.76': 11, 'B0.955': 6,
};
/** per-edge wobble inside its line (px): the bottom row's tops and bottoms set so one photo of the row moves ~4 px */
const JIT: Record<number, [number, number, number, number]> = {
  7: [1.5, -3.9, -1.2, 1.9],
  8: [-1.4, 1.9, 1.6, -3.9],
  9: [0.8, 1.9, -1.1, 1.9],
};
const edgeKey = (k: number, v: number) => `${'LTRB'[k]}${+v.toFixed(4)}`;
const DRAWN: GRect[] = GAL.targets.map((r, i) => {
  const e = [r[0], r[1], r[0] + r[2], r[1] + r[3]];
  const out = e.map((v, k) => {
    const jit = JIT[i]?.[k] ?? hash1(i * 4 + k, 23) * 2.6;
    const pxOff = (LINE_OFF[edgeKey(k, v)] ?? 0) + jit;
    return v + pxOff / (k % 2 === 0 ? B10.w : B10.w * 0.8);
  });
  return [out[0], out[1], out[2] - out[0], out[3] - out[1]];
});
/** each frame's hand-drawn tilt (radians, within ±1.5°) */
const TILT = GAL.targets.map((_, i) => hash1(i, 29) * 1.5 * (Math.PI / 180));
/** the photos after the penalty: every line of edges of one kind rests at the mean of where its rectangles are drawn */
const ALIGNED: GRect[] = (() => {
  const edges = (r: GRect) => [r[0], r[1], r[0] + r[2], r[1] + r[3]];
  const P = GAL.targets.map(edges);
  const D = DRAWN.map(edges);
  const out = D.map((e) => e.slice());
  for (let kind = 0; kind < 4; kind++) {
    const groups = new Map<string, number[]>();
    P.forEach((e, i) => {
      const key = e[kind].toFixed(4);
      groups.set(key, [...(groups.get(key) ?? []), i]);
    });
    for (const ids of groups.values()) {
      const m = ids.reduce((a, i) => a + D[i][kind], 0) / ids.length;
      for (const i of ids) out[i][kind] = m;
    }
  }
  return out.map((e) => [e[0], e[1], e[2] - e[0], e[3] - e[1]] as GRect);
})();
const lerpR = (a: GRect, b: GRect, u: number): GRect => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u];
/** the ruler's notches: the preset's column edges (the grid the snap forces) */
const NOTCH_X = Array.from(new Set(GAL.targets.flatMap((r) => [r[0], r[0] + r[2]]).map((v) => +v.toFixed(4)))).sort((a, b) => a - b);

interface Beats {
  ruler: number;
  snap: number;
  decline: number;
  card: number;
  slider: number;
  D: number;
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    // the slider rises at 9.0 (the line's last word ends at 9.07): its drift needs the time to be seen
    const b: Beats = { ruler: T.beat('ruler'), snap: T.beat('snap'), decline: T.beat('decline'), card: T.beat('card'), slider: Math.min(T.beat('slider'), 9.0), D: T.duration };
    const cam = tl.channel<Camera3>('cam', CAM_A, cam3Interp);
    tl.tween(cam, CAM_B, { at: b.slider - 0.5, dur: T.duration - (b.slider - 0.5), ease: sine });
    tl.hold(0, T.duration);
    return { tl, cam, b };
  },
  paint(f, s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(s.get(sc.cam));
    f.backlight({ sunX: 300, sunY: 400, sunRadius: 240, intensity: 0.85 });
    room(f);
    f.layer('L4', (c, env) => {
      desk(f, c, env);
      anglepoiseLamp(c, { x: LAMP.x, y: LAMP.y, s: LAMP.s, reach: LAMP.reach, aim: LAMP.aim, seed: 4 }, env);
      f.cached(`${ID}/booth/${env.mood.id}`, 520, 520, (cc) => {
        cc.translate(-(B10.x - 80), -(B10.y - 110));
        galleryBooth(cc, env, B10, 'back');
      })(c, B10.x - 80, B10.y - 110);
      miniature(f, c, env, t, b);
      f.cached(`${ID}/curtains/${env.mood.id}`, 380, 300, (cc) => {
        cc.translate(-(B10.x - 20), -(B10.y - 10));
        galleryBooth(cc, env, B10, 'front');
      })(c, B10.x - 20, B10.y - 10);
      groove(c, env);
      ruler(c, env, t, tq, b);
      slider(c, env, t, b);
      laptop(c, env);
      authorHands(c, env, t, tq, b);
    });
    f.rim({ x: -0.45, y: -1 });
    const bulb = anglepoiseLamp.anchors({ x: LAMP.x, y: LAMP.y, s: LAMP.s, reach: LAMP.reach, aim: LAMP.aim }).bulb;
    f.practical({ x: bulb.x, y: bulb.y, kind: 'lamp', seed: 101, intensity: 0.85, radius: 80 });
    near(f);
    // the name card: inked on 'spirit', held to ~9.8, at the left over the desk, clear of the hands
    nameCard(f.c, { name: 'Cheng Lou', role: "in the lab's gallery notes", x: 60, y: 488, at: b.card - 0.04, dur: 4.0, fade: 0.4 }, { t, mood: f.mood, seed: 710 });
  },
});

// ------------------------------------------------------------------ the room: an evening window, panelling, a shelf
const OS2 = overscan(LAYERS.L2, [CAM_A, CAM_B], 40);
function room(f: Frame) {
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/L2/${env.mood.id}`, OS2.w, OS2.h, (cc) => {
      cc.translate(-OS2.x, -OS2.y);
      const p = new Path2D();
      p.rect(OS2.x, OS2.y, OS2.w, OS2.h);
      // a tall sash window (a hole: the dusk shows through), four panes over four
      const W = { x: 110, y: 60, w: 330, h: 440 };
      const bar = 9;
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 2; k++) {
          const pw = (W.w - bar * 3) / 2, ph = (W.h - bar * 5) / 4;
          p.rect(W.x + bar + k * (pw + bar), W.y + bar + r * (ph + bar), pw, ph);
        }
      cc.fillStyle = env.fill('set');
      cc.fill(p, 'evenodd');
      cc.strokeStyle = withAlpha(env.mood.rim, 0.1);
      cc.lineWidth = 2;
      for (let i = 0; i < 3; i++) cc.strokeRect(540 + i * 230, 90, 190, 300);
    })(c, OS2.x, OS2.y);
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    f.cached(`${ID}/L3/${env.mood.id}`, 420, 560, (cc) => {
      cc.translate(-1080, -40);
      bookshelfWall(cc, { x: 1080, y: 40, w: 380, h: 520, bays: 2, shelves: 5, seed: 7, backTone: 0.3 }, env);
    })(c, 1080, 40);
  });
  f.fog('B');
}
const OS4 = overscan(LAYERS.L4, [CAM_A, CAM_B], 30);
function desk(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/desk/${env.mood.id}`, OS4.w, OS4.y + OS4.h - DESK_Y + 10, (cc) => {
    cc.translate(-OS4.x, -(DESK_Y - 10));
    // the desk top, seen from above and behind: lit toward its far edge, darker toward us
    const g = cc.createLinearGradient(0, DESK_Y, 0, OS4.y + OS4.h);
    g.addColorStop(0, mixLab(env.fill('set'), env.mood.halo, 0.12));
    g.addColorStop(0.5, mixLab(env.fill('ink'), env.fill('set'), 0.55));
    g.addColorStop(1, mixLab(env.fill('ink'), env.fill('set'), 0.3));
    cc.fillStyle = g;
    cc.fillRect(OS4.x, DESK_Y, OS4.w, OS4.y + OS4.h - DESK_Y);
    // a few long grain lines
    cc.strokeStyle = withAlpha(env.mood.ink, 0.18);
    cc.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const y = DESK_Y + 14 + i * i * 6;
      cc.beginPath();
      cc.moveTo(OS4.x, y);
      cc.bezierCurveTo(300, y + 3, 900, y - 4, OS4.x + OS4.w, y + 2);
      cc.stroke();
    }
    // the far edge, catching the window
    cc.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.rim, 0.4), 0.6);
    cc.fillRect(OS4.x, DESK_Y, OS4.w, 2.5);
  })(c, OS4.x, DESK_Y - 10);
}

// ------------------------------------------------------------------ the laptop (from behind its user)
function laptop(c: C2, env: PaintEnv) {
  const ink = mixLab(PUPPET_NEAR_BLACK, env.fill('set'), 0.25);
  const deck = mixLab(PUPPET_NEAR_BLACK, env.fill('set'), 0.42);
  // the screen's glow: the practical behind the hands (blank light, no words)
  glowAt(c, LID.x + LID.w / 2, LID.y + LID.h * 0.6, LID.w * 0.75, mixLab(env.mood.core, env.mood.halo, 0.4), 0.28);
  // lid: bezel, the lit screen, the lid's top edge
  c.fillStyle = ink;
  c.beginPath();
  c.roundRect(LID.x, LID.y, LID.w, LID.h, 7);
  c.fill();
  const sx = LID.x + 11, sy = LID.y + 11, sw = LID.w - 22, sh = LID.h - 20;
  const g = c.createLinearGradient(0, sy, 0, sy + sh);
  g.addColorStop(0, mixLab(env.mood.set, env.mood.core, 0.48));
  g.addColorStop(0.7, mixLab(env.mood.set, env.mood.core, 0.6));
  g.addColorStop(1, mixLab(env.mood.set, env.mood.halo, 0.55));
  c.fillStyle = g;
  c.fillRect(sx, sy, sw, sh);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.75);
  c.lineWidth = px(c, 1.6);
  c.beginPath();
  c.moveTo(LID.x + 6, LID.y + 0.8);
  c.lineTo(LID.x + LID.w - 6, LID.y + 0.8);
  c.stroke();
  // the keyboard deck: a dark trapezoid widening toward us, rows of keys a breath lighter, a trackpad
  c.fillStyle = deck;
  c.beginPath();
  c.moveTo(DECK.x0, DECK.y0);
  c.lineTo(DECK.x1, DECK.y0);
  c.lineTo(DECK.x1 + DECK.flare, DECK.y1);
  c.lineTo(DECK.x0 - DECK.flare, DECK.y1);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(mixLab(deck, env.mood.halo, 0.2), 0.7);
  for (let r = 0; r < 5; r++) {
    const v = (r + 0.6) / 8;
    const y = DECK.y0 + 6 + v * (DECK.y1 - DECK.y0 - 10);
    const fl = DECK.flare * v;
    const x0 = DECK.x0 - fl + 14, x1 = DECK.x1 + fl - 14;
    const n = 13;
    const kw = (x1 - x0) / n;
    const kh = 5 + v * 4;
    for (let k = 0; k < n; k++) c.fillRect(x0 + k * kw + 1, y, kw - 2.5, kh);
  }
  const tpY = DECK.y0 + (DECK.y1 - DECK.y0) * 0.78;
  c.strokeStyle = withAlpha(mixLab(deck, env.mood.halo, 0.25), 0.6);
  c.lineWidth = px(c, 1.2);
  c.strokeRect(LID.x + LID.w / 2 - 44, tpY, 88, (DECK.y1 - tpY) - 4);
}

// ------------------------------------------------------------------ Cheng's hands (author-hands), from behind
/**
 * One hand from behind, lying on keys: the forearm runs off the bottom edge, the back of the hand widens to the knuckle
 * line, four short fingers run forward and curl down over the keys (`curl` 0 = flat, 1 = curled), the thumb on the
 * inner side. Near-black; a thin warm rim where the screen's light catches the knuckles and fingertips.
 */
function backHand(c: C2, env: PaintEnv, wrist: Pt, ang: number, L: number, side: 1 | -1, curl: number) {
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const nx = -uy, ny = ux; // to the hand's right
  const at = (a: number, b: number): Pt => ({ x: wrist.x + ux * a * L + nx * b * L, y: wrist.y + uy * a * L + ny * b * L });
  const body = new Path2D();
  // forearm, running off the bottom edge
  const f0 = at(-3, -0.26), f1 = at(-3, 0.26);
  const w0 = at(0, -0.21), w1 = at(0, 0.21);
  body.moveTo(f0.x, f0.y);
  body.lineTo(w0.x, w0.y);
  body.lineTo(w1.x, w1.y);
  body.lineTo(f1.x, f1.y);
  body.closePath();
  // the back of the hand, foreshortened (it lies away from us): wrist → knuckle line
  const k0 = at(0.45, -0.27), k1 = at(0.45, 0.27);
  const m0 = at(0.22, -0.27), m1 = at(0.22, 0.27);
  body.moveTo(w0.x, w0.y);
  body.quadraticCurveTo(m0.x, m0.y, k0.x, k0.y);
  body.lineTo(k1.x, k1.y);
  body.quadraticCurveTo(m1.x, m1.y, w1.x, w1.y);
  body.closePath();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fill(body);
  // four fingers side by side, touching, running forward and curling down over the keys (shorter as they curl)
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineCap = 'round';
  const tips: Pt[] = [];
  const LEN = [0.19, 0.24, 0.23, 0.17];
  const order = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0]; // the little finger on the outer side
  for (let k = 0; k < 4; k++) {
    const off = -0.19 + k * 0.127;
    const len = LEN[order[k]] * (1 - 0.35 * curl);
    const a = at(0.42, off);
    const tip = { x: a.x + ux * len * L, y: a.y + uy * len * L };
    c.lineWidth = L * 0.13;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(tip.x, tip.y);
    c.stroke();
    tips.push(tip);
  }
  // the thumb, inner side (toward the other hand), tucked along the keys
  const tb = at(0.16, side * 0.22);
  const ta = ang + side * 0.75;
  c.lineWidth = L * 0.12;
  c.beginPath();
  c.moveTo(tb.x, tb.y);
  c.lineTo(tb.x + Math.cos(ta) * L * 0.24, tb.y + Math.sin(ta) * L * 0.24);
  c.stroke();
  // the rim: the fingertips catching the screen's light, a hairline between the fingers
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.65), 0.8);
  c.lineWidth = Math.max(px(c, 2), 1.1);
  for (const tp of tips) {
    c.beginPath();
    c.arc(tp.x, tp.y, L * 0.062, ang - 1.0, ang + 1.0);
    c.stroke();
  }
}
const lerpP = (a: Pt, b: Pt, u: number): Pt => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
function authorHands(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const step = Math.floor(tq * 6);
  const dip = (salt: number) => {
    const h = Math.sin(step * 12.9898 + salt * 78.233) * 43758.5453;
    return h - Math.floor(h) > 0.45 ? 1 : 0;
  };
  // typing pauses while the ruler acts (from 'fix' to 'Cheng') and is still after the decline (listening)
  const typing = (t > 0.2 && t < b.ruler - 0.1) || (t > b.card + 1.2 && t < b.slider - 0.3);
  const L = 150;
  // left hand: on the keys, the knuckles at y ~600, the wrist at the frame's bottom
  const dL = typing ? dip(1) : 0;
  backHand(c, env, { x: LID.x + 82, y: 668 + dL * 3 }, -Math.PI / 2 + 0.08, L, 1, typing ? 0.55 + 0.3 * dL : 0.45);
  // right hand: types; on 'Cheng' lifts and travels to the ruler's left end, lies flat on it by 4.9, holds to 'spirit',
  // then lifts away as the ruler withdraws and comes back to the keys
  const dR = typing ? dip(2) : 0;
  const keys = { wrist: { x: LID.x + 206, y: 668 + dR * 3 }, ang: -Math.PI / 2 - 0.08, L, curl: typing ? 0.55 + 0.3 * dR : 0.45 };
  // flat on the ruler's left end, fingers along it (smaller: it is further from us)
  const rulerTip = { x: RULER.restX + 46, y: GROOVE_Y + 8 };
  const rAng = -Math.PI / 2 + 0.7;
  const rL = 112;
  const onRuler = { wrist: { x: rulerTip.x - Math.cos(rAng) * rL * 0.66, y: rulerTip.y - Math.sin(rAng) * rL * 0.66 }, ang: rAng, L: rL, curl: 0 };
  const go = sine(seg(tq, b.decline - 0.02, b.decline + 0.42) * 1.0001);
  const back = sine(seg(tq, b.card + 0.02, b.card + 0.9));
  const u = go * (1 - back);
  const lift = Math.sin(Math.PI * u) * 60;
  const w = lerpP(keys.wrist, onRuler.wrist, u);
  backHand(c, env, { x: w.x, y: w.y - lift }, keys.ang + (onRuler.ang - keys.ang) * u, keys.L + (onRuler.L - keys.L) * u, -1, keys.curl * (1 - u));
}

// ------------------------------------------------------------------ the miniature gallery
function miniature(f: Frame, c: C2, env: PaintEnv, t: number, b: Beats) {
  // the photos: fitted to the hand-drawn sketch; dimmed while the ruler is in (the sketch's ink reads over them);
  // after the slider they drift into line (ease over 1.4 s, on twos)
  const dim = 1 - 0.45 * seg(t, b.ruler - 0.05, b.ruler + 0.3) * (1 - seg(t, b.card + 0.4, b.card + 0.9));
  const drift = sine(seg(twos(t), b.slider + 0.2, b.D - 0.3));
  GAL.targets
    .map((_, i) => i)
    .sort((p, q) => GAL.targets[q][2] * GAL.targets[q][3] - GAL.targets[p][2] * GAL.targets[p][3])
    .forEach((i) => {
      const o = GAL.pairEnd[i];
      const art = f.cached(`ch07-s06/photo${o}/${env.mood.id}`, PHOTO_BAKE.w, PHOTO_BAKE.h, (cc) => photoArt(cc, env, o, PHOTO_BAKE.w, PHOTO_BAKE.h));
      photoCard(c, env, art, stageRect(B10, lerpR(DRAWN[i], ALIGNED[i], drift)), { shadow: 0.2, alpha: dim });
    });
  // the sketch: hand-drawn; clacked onto the grid in two frames by the ruler (no ease); eased back on 'spirit'
  const snapIn = clamp01((t - b.snap) / (2 / 24));
  const snap = snapIn * (1 - sine(seg(t, b.card, b.card + 0.8)));
  const slam = Math.max(0, 1 - Math.abs(twos(t) - (b.snap + 0.04)) / 0.1);
  GAL.targets.forEach((r, i) => {
    const R = stageRect(B10, lerpR(DRAWN[i], r, snap));
    const a = TILT[i] * (1 - snap);
    c.save();
    c.translate(R.x + R.w / 2, R.y + R.h / 2);
    c.rotate(a);
    sketchFrame(c, env, { x: -R.w / 2, y: -R.h / 2, w: R.w, h: R.h }, { seed: 30 + i, lift: 1 + slam * 5, weight: 1.15 });
    c.restore();
  });
}

// ------------------------------------------------------------------ the groove and the ruler
function groove(c: C2, env: PaintEnv) {
  c.fillStyle = mixLab(env.fill('set'), env.mood.halo, 0.25);
  c.fillRect(RULER.restX - 24, GROOVE_Y, 1400, RULER.h + 7);
  c.strokeStyle = withAlpha(env.mood.ink, 0.6);
  c.lineWidth = px(c, 1.2);
  c.beginPath();
  c.moveTo(RULER.restX - 24, GROOVE_Y + RULER.h + 5);
  c.lineTo(RULER.restX + 1400, GROOVE_Y + RULER.h + 5);
  c.stroke();
}
function rulerX(t: number, b: Beats) {
  const tq = twos(t);
  const inU = seg(tq, b.ruler - 0.05, b.snap - 0.04);
  const outU = seg(tq, b.card + 0.1, b.card + 0.85);
  return RULER.restX + (1 - inU) * 760 + outU * 760;
}
function ruler(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const x = rulerX(t, b);
  if (x > 1500) return;
  // it presses up into the sketch on 'snapped' (a short lift and drop)
  const press = Math.max(0, 1 - Math.abs(tq - (b.snap + 0.08)) / 0.12);
  const y = GROOVE_Y + 3 - press * 5;
  const brass = (k: number) => mixLab(brassOf(env, k), '#fff3d6', 0.1);
  const g = c.createLinearGradient(0, y, 0, y + RULER.h);
  g.addColorStop(0, brass(0.8));
  g.addColorStop(0.5, brass(0.3));
  g.addColorStop(1, mixLab(brassOf(env, 0), '#2a1d14', 0.4));
  c.fillStyle = g;
  // the body with its notched top edge: a tooth at every column edge of the grid
  const p = new Path2D();
  p.moveTo(x, y + RULER.h);
  p.lineTo(x, y);
  const nx = NOTCH_X.map((fx) => B10.x + fx * B10.w);
  for (const n of nx) {
    p.lineTo(n - 4, y);
    p.lineTo(n, y - 8);
    p.lineTo(n + 4, y);
  }
  p.lineTo(x + RULER.len, y);
  p.lineTo(x + RULER.len, y + RULER.h);
  p.closePath();
  c.save();
  c.translate(x - RULER.restX, 0);
  c.fill(p);
  c.strokeStyle = withAlpha('#2a1d14', 0.6);
  c.lineWidth = px(c, 1);
  c.stroke(p);
  c.restore();
  // fine graduations
  c.strokeStyle = withAlpha('#2a1d14', 0.45);
  c.lineWidth = px(c, 1);
  for (let i = 0; i < 34; i++) {
    const gx = x + 8 + i * 10;
    c.beginPath();
    c.moveTo(gx, y + RULER.h - 1);
    c.lineTo(gx, y + RULER.h - (i % 5 === 0 ? 7 : 4));
    c.stroke();
  }
  // the engraving: cut letters, a pale 1 px underlay so they read on the brass
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 600 17px ${FONT.text}`, 17);
    c.font = `italic 600 ${size}px ${FONT.text}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const text = 'snap to grid · ordinary code';
    const tx = x + 74, ty = y + RULER.h - 6;
    c.fillStyle = withAlpha('#fff6e0', 0.7);
    c.fillText(text, tx + px(c, 0.8), ty + px(c, 1));
    c.fillStyle = mixLab('#2a1d14', '#000000', 0.2);
    c.fillText(text, tx, ty);
    const w = c.measureText(text).width;
    textProbe(c, `${ID}-ruler`, tx, ty - size, w, size * 1.2, 1);
  });
  // on the press: guide lines flash up the screen from each notch
  const flash = Math.max(0, 1 - Math.abs(tq - (b.snap + 0.12)) / 0.3);
  if (flash > 0 && x < RULER.restX + 2) {
    c.save();
    c.strokeStyle = withAlpha(mixLab(brassOf(env, 1), '#fff6e0', 0.4), 0.7 * flash);
    c.lineWidth = px(c, 1.4);
    for (const fx of NOTCH_X) {
      const gx = B10.x + fx * B10.w;
      c.beginPath();
      c.moveTo(gx, y - 8);
      c.lineTo(gx, B10.y);
      c.stroke();
    }
    c.restore();
  }
}

// ------------------------------------------------------------------ the slider (Misalignment penalty, 4 %)
function slider(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(twos(t), b.slider - 0.05, b.slider + 0.45);
  if (u <= 0) return;
  const y = SLIDER.y + (1 - u) * 110;
  c.save();
  c.beginPath();
  c.rect(SLIDER.x - 70, 0, SLIDER.w + 150, DESK_Y);
  c.clip();
  // a paper card on a stand
  const card = { x: SLIDER.x - 52, y: y - 50, w: SLIDER.w + 104, h: 88 };
  c.fillStyle = withAlpha('#2a1d14', 0.3);
  c.fillRect(card.x + 4, card.y + 5, card.w, card.h);
  c.fillStyle = mixLab(mixLab('#f4e8cb', env.mood.halo, 0.25), env.mood.core, 0.15);
  c.fillRect(card.x, card.y, card.w, card.h);
  c.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.3);
  c.fillRect(card.x + card.w / 2 - 4, card.y + card.h, 8, DESK_Y - (card.y + card.h));
  // track from off to 8 %, the knob at 4 % (the middle)
  const tx0 = SLIDER.x, tx1 = SLIDER.x + SLIDER.w, ty = y + 12;
  c.strokeStyle = mixLab('#2a1d14', env.mood.ink, 0.3);
  c.lineWidth = px(c, 2.4);
  c.beginPath();
  c.moveTo(tx0, ty);
  c.lineTo(tx1, ty);
  c.stroke();
  const kx = tx0 + SLIDER.w * 0.5;
  c.fillStyle = brassOf(env, 0.5);
  c.beginPath();
  c.arc(kx, ty, 7, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha('#2a1d14', 0.7);
  c.lineWidth = px(c, 1.2);
  c.stroke();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 500 18px ${FONT.text}`, 18);
    c.font = `italic 500 ${size}px ${FONT.text}`;
    c.fillStyle = mixLab('#2a1d14', env.mood.ink, 0.3);
    c.textAlign = 'center';
    c.fillText('Misalignment penalty', card.x + card.w / 2, card.y + size + 6);
    const w = c.measureText('Misalignment penalty').width;
    textProbe(c, `${ID}-slider`, card.x + card.w / 2 - w / 2, card.y + 6, w, size * 1.2, u);
    c.fillText('4%', kx, ty + size + 6);
  });
  c.restore();
}

// ------------------------------------------------------------------ near plane (L5): the desk's near lip and a mug
const OS5 = overscan(LAYERS.L5, [CAM_A, CAM_B], 20);
function near(f: Frame) {
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/L5/${env.mood.id}`, OS5.w, 300, (cc) => {
      cc.translate(-OS5.x, -(OS5.y + OS5.h - 300));
      cc.fillStyle = env.fill('fg');
      const x0 = OS5.x, y1 = OS5.y + OS5.h;
      // the desk's near lip at the lower left, out of the hands' way
      cc.beginPath();
      cc.moveTo(x0 - 20, y1 - 30);
      cc.quadraticCurveTo(x0 + 160, y1 - 38, 250, y1 - 32);
      cc.lineTo(262, y1 + 20);
      cc.lineTo(x0 - 20, y1 + 20);
      cc.closePath();
      cc.fill();
      // a mug at the lower right, its handle toward the lamp
      const mx = 1150, my = y1 - 10;
      cc.beginPath();
      cc.roundRect(mx - 46, my - 120, 92, 140, 10);
      cc.fill();
      cc.lineWidth = 16;
      cc.strokeStyle = env.fill('fg');
      cc.beginPath();
      cc.arc(mx + 54, my - 66, 26, -Math.PI / 2, Math.PI / 2);
      cc.stroke();
    })(c, OS5.x, OS5.y + OS5.h - 300);
  });
}
