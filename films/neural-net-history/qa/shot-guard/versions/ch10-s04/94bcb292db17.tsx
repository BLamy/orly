/**
 * ch10-s04 — the Transformer: the scribe sets down his lamp and leaves; then every slip lights at once and threads
 * of light join every pair, and a banner inks THE TRANSFORMER and the paper's title and authors
 * (serverCyan; 19.8 s; a 1 s crossfade in from the cafe, with a tint crossfade duskRose → serverCyan, no dip).
 *
 * TEACHES self-attention against ch10-s01's slow reader. The hall camera that tracked in s01 now HOLDS STILL:
 * nothing needs to travel.
 *   'Drop'         the scribe bends, sets his lamp on the floor, turns and walks out of frame (2017 stamped)
 *   'keep'→'every' (critic round 1) a HELD dark beat, ~1.2 s: it starts on 'keep' (3.34), is fully dark through
 *                  'attention' (veil 0.85, windows 0.1; the s01 wicks die), the abandoned lamp's pool the only light,
 *                  and releases only with the single-step light-up on 'every'. The scribe stays PUPPET_NEAR_BLACK in it
 *                  (drawn after the rim pass, his ink not hazed while dark), rimmed only on the lamp side.
 *   'every'        (4.79) every slip down the WHOLE hall lights at the same instant (one step)
 *   'looks' →      threads shoot out from EVERY slip at once toward every other slip (all queries together), near and
 *   'other'        far: they meet mid-span by the end of 'every other' (~6.6), so every pair in the hall is joined.
 *                  Far pairs hang in nested loops under the far end of the line (sag grows with the pair's distance),
 *                  so the web reads all the way to the vanishing point. Every thread grows by the same fraction of its
 *                  own ARC LENGTH at every frame (so near and far are equally far along), with a bright tip. Thread brightness ← an attention weight: a toy
 *                  softmax over illustrative word vectors (each slip's row sums to 1), not a trained model.
 *   'all at once'  the brightness PEAK of the shot (rising from 'all', cresting just after 'once'), then the web
 *                  settles to a steady glow
 *   'Transformer'  a small parchment banner drops low over the floor (clear of the slips), THE TRANSFORMER on it
 *   'title'        beneath it, in the banner's own hand, ATTENTION IS ALL YOU NEED, then the eight authors in the
 *                  paper's order (Vaswani · Shazeer · Parmar · Uszkoreit · Jones · Gomez · Kaiser · Polosukhin);
 *                  the web glows through the result line and the hold; '2017' is lettered on the banner's foot
 *   hold           a very slow lens push (3%) on the web and banner; ONE shimmer wave runs the length of the hammock
 *                  on 'out-translated', then the web settles to a steady glow a second before the cut
 *   depth          a blurred L5 pew end in the bottom-left corner (the scribe walks out behind it); the far quarter of
 *                  the slip row is a step dimmer so the line never fuses into one smear at the vanishing point
 *   continuity     the wicks the s01 relay lit still glow as embers down the line when the shot opens; they go out
 *                  in the dip on 'reader' (the slow reader's light is gone before the new one comes)
 */
import { Timeline } from '../../../core';
import { CAMERA3_HOME, MOODS, defineShot, mixLab, withAlpha } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import type { PaintEnv, Pose } from '../../../film';
import { POSES, PUPPET_NEAR_BLACK, blendPose, pose, strideLength, walkPose, withLife } from '../../../film/silhouette/puppet';
import type { PuppetDrawOpts } from '../../../film';
import { FONT, drawTracked, legibleSize, measureTracked } from '../../../film/silhouette/type';
import { HALL, HALL_VP, HALL_WORDS, type HallCam, floorPoint, hallArch, hallHaze, hallSlip, handLamp, scribe, slipAt, slipScreen, wickFlame } from '../sets/ch10-s01-hall';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s04';
const L1 = 'L1009';
const L2 = 'L1024';
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

// ------------------------------------------------------------------------------------------------ the still camera
/** the scribe stands at slip 1, left of frame; the line recedes right to the vanishing point */
const SLIP0 = 2;
const SX = HALL.beamX + 70;
const SZ = slipAt(SLIP0).z - 40;
const CAM: HallCam = { x: SX + 930, y: 178, z: SZ - 940 };
/** every slip in the hall takes part: threads join EVERY pair, near and far */
const NT = HALL.N;
const VEIL = { id: 'veil', z: 1790, haze: 0, blur: 0 }; // slips joined by threads (the rest are a fringe of light in the haze)

// ------------------------------------------------------------------------------------------------ the toy attention
/** illustrative word vectors (seeded), + a shared-word bond and a neighbour bond; softmax rows sum to 1 */
const ATT: number[][] = (() => {
  const d = 6;
  const vec = (w: string, salt: number) => {
    let h = 0;
    for (let i = 0; i < w.length; i++) h = (h * 31 + w.charCodeAt(i)) | 0;
    return Array.from({ length: d }, (_, k) => {
      const x = Math.sin((h + 977 * salt) * (k + 1) * 12.9898) * 43758.5453;
      return x - Math.floor(x) - 0.5;
    });
  };
  const words = Array.from({ length: NT }, (_, i) => HALL_WORDS[i % HALL_WORDS.length]);
  const Q = words.map((w) => vec(w, 1));
  const Kv = words.map((w) => vec(w, 2));
  const out: number[][] = [];
  for (let i = 0; i < NT; i++) {
    const row: number[] = [];
    for (let j = 0; j < NT; j++) {
      if (i === j) {
        row.push(-1e9);
        continue;
      }
      let s = 0;
      for (let k = 0; k < d; k++) s += Q[i][k] * Kv[j][k];
      s = (s / Math.sqrt(d)) * 9;
      if (words[i] === words[j]) s += 1.6;
      if (Math.abs(i - j) === 1) s += 0.9;
      // two illustrative long-range bonds in the near span, so pairs (not a net) read: crossed ↔ bank, the ↔ river
      const pair = (a: string, b: string) => (words[i] === a && words[j] === b) || (words[i] === b && words[j] === a);
      if (i < 6 && j < 6 && (pair('crossed', 'bank') || pair('the', 'river'))) s += 3.2;
      row.push(s);
    }
    const mx = Math.max(...row);
    const ex = row.map((v) => Math.exp(v - mx));
    const sum = ex.reduce((a, b) => a + b, 0);
    out.push(ex.map((v) => v / sum));
  }
  return out;
})();
/** pairs, strongest last (drawn on top) */
const PAIRS: { i: number; j: number; w: number }[] = (() => {
  const ps: { i: number; j: number; w: number }[] = [];
  for (let i = 0; i < NT; i++) for (let j = i + 1; j < NT; j++) ps.push({ i, j, w: (ATT[i][j] + ATT[j][i]) / 2 });
  return ps.sort((a, b) => a.w - b.w);
})();
const WMAX = Math.max(...PAIRS.map((p) => p.w));
/** the still camera never moves the slips (the hold's push is a lens zoom), so every thread's curve is fixed: bake
 *  its geometry once. Each thread hangs from the two slips' feet; its sag grows with its span on screen (so the far
 *  pairs hang in nested loops under the far end of the line instead of piling onto it) */
interface Thread {
  ax: number; ay: number; bx: number; by: number; mx: number; my: number;
  /** normalised weight 0..1 */
  w: number;
  /** base alpha (weight × depth × crowding) and width */
  a0: number;
  lw: number;
  /** the pair's middle index (for the shimmer wave) */
  mid: number;
  /** cumulative arc length at u = k / ARC_N (for equal-fraction growth) */
  arc: Float32Array;
}
const ARC_N = 16;
/** the bezier parameter at arc length `len` along a thread */
function arcU(th: Thread, len: number): number {
  const A = th.arc;
  if (len <= 0) return 0;
  if (len >= A[ARC_N]) return 1;
  let k = 0;
  while (k < ARC_N - 1 && A[k + 1] < len) k++;
  return (k + (len - A[k]) / Math.max(1e-6, A[k + 1] - A[k])) / ARC_N;
}
const THREADS: Thread[] = (() => {
  const S = Array.from({ length: NT }, (_, i) => slipScreen(CAM, i));
  return PAIRS.map((pr) => {
    const a = S[pr.i], b = S[pr.j];
    const w = pr.w / WMAX;
    const ax = a.x, ay = a.y + a.h * 0.98, bx = b.x, by = b.y + b.h * 0.98;
    const dx = Math.abs(bx - ax);
    const sNear = Math.max(a.s, b.s), sFar = Math.min(a.s, b.s);
    // near pairs: a sag that grows with screen span, capped by depth; far pairs: at least half their span + a few px
    const sag = Math.max(Math.min(14 + dx * 0.28, 150 * sNear + 10), 4 + dx * 0.52);
    const depth = 1 - hallHaze(Math.max(a.vz, b.vz));
    const fadeD = 0.5 + 0.5 * Math.max(0, depth);
    // crowding: the far slips bunch toward the vanishing point, so their threads overlap; additive light must stay a
    // web there, not a streak: thin them, but never below a visible floor
    const densK = 0.3 + 0.7 * Math.pow(clamp01(sFar / 0.32), 0.8);
    const span = Math.hypot(bx - ax, by - ay);
    const spanK = 0.45 + 0.55 * Math.pow(clamp01(span / 140), 0.8);
    const mx = (ax + bx) / 2, my = Math.max(ay, by) + sag;
    const arc = new Float32Array(ARC_N + 1);
    let px = ax, py = ay;
    for (let k = 1; k <= ARC_N; k++) {
      const u = k / ARC_N;
      const qx = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx;
      const qy = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * by;
      arc[k] = arc[k - 1] + Math.hypot(qx - px, qy - py);
      px = qx;
      py = qy;
    }
    return {
      ax, ay, bx, by,
      mx, my, arc,
      w,
      a0: (0.16 + 0.85 * Math.pow(w, 0.7)) * fadeD * densK * spanK,
      lw: Math.max(0.7, 0.55 + 2.6 * w * Math.sqrt((a.s + b.s) / 2)),
      mid: (pr.i + pr.j) / 2,
    };
  });
})();

// ------------------------------------------------------------------------------------------------ the scribe's exit
const CARRY: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 6, head: -4, shoulderF: 30, elbowF: 66, wristF: -6, shoulderB: -8, elbowB: 14 }, { handF: 'grip' });
const STOOP: Pose = pose({ hipF: 58, kneeF: -84, hipB: 36, kneeB: -70, torso: 26, neck: 10, head: 10, shoulderF: 26, elbowF: 6, wristF: 0, shoulderB: -6, elbowB: 18 }, { handF: 'grip' });
const STRIDE = strideLength(scribe.spec, 1);

interface Plan {
  drop: number;
  release: number;
  turn: number;
  walk0: number;
  /** the held dark beat: down from dip0 ('keep'), fully dark by dip1 (before 'attention'), released in one step on
   *  'every' */
  dip0: number;
  dip1: number;
  /** 'every': every slip's paper and wick light at the same instant (one step on twos) */
  every: number;
  /** threads shoot from every slip at once: grow0 → grow1 (they meet mid-span by the end of 'every other') */
  grow0: number;
  grow1: number;
  /** 'all' → 'once': the brightness peak */
  all: number;
  once: number;
  named: number;
  title: number;
  authors: number;
  outT: number;
  D: number;
}

function scribeAt(p: Plan, t: number): { x: number; pose: Pose; facing: 'left' | 'right'; lampInHand: number } {
  const tq = tq12(t);
  if (tq < p.drop) return { x: SX, pose: CARRY, facing: 'right', lampInHand: 1 };
  if (tq < p.release + 0.35) {
    const down = sm((tq - p.drop) / (p.release - p.drop));
    const up = sm((tq - p.release) / 0.35);
    return { x: SX, pose: blendPose(blendPose(CARRY, STOOP, down), POSES.stand, up), facing: 'right', lampInHand: tq < p.release ? 1 : 0 };
  }
  if (tq < p.walk0) return { x: SX, pose: POSES.stand, facing: tq < p.turn ? 'right' : 'left', lampInHand: 0 };
  // walking toward the left wall (screen left), on twos, planted-ish by distance
  const v = 205; // world px / s
  const dist = (tq - p.walk0) * v;
  const ph = dist / (2 * STRIDE);
  return { x: SX - dist, pose: walkPose(ph % 1), facing: 'left', lampInHand: 0 };

}

// ------------------------------------------------------------------------------------------------ banner
/** a hung parchment banner: on cords from the roof truss, deckled edges, a step darker than the lit threads */
/** (hung 30 px higher and 40 px left of the first cut: it overlaps the web's convergence, its foot clear of the
 *  bottom 12% band) */
const BAN = { cx: 896, top: 398, h1: 86 };
function bannerEdge(x0: number, x1: number, top: number, h: number, hem: boolean) {
  const P = new Path2D();
  const j = (k: number, salt: number) => (hash1(k, salt) - 0.5) * 3.2;
  P.moveTo(x0, top);
  for (let x = x0 + 12; x < x1; x += 12) P.lineTo(x, top + j(x, 3) * 0.4);
  P.lineTo(x1, top);
  for (let y = top + 10; y < top + h; y += 10) P.lineTo(x1 + j(y, 5), y);
  if (hem) {
    P.lineTo(x1, top + h);
    P.lineTo(x1 - 26, top + h - 12);
    P.lineTo(x1 - 52, top + h);
    for (let x = x1 - 64; x > x0 + 52; x -= 12) P.lineTo(x, top + h + j(x, 7));
    P.lineTo(x0 + 52, top + h);
    P.lineTo(x0 + 26, top + h - 12);
    P.lineTo(x0, top + h);
  } else {
    for (let x = x1; x > x0; x -= 12) P.lineTo(x, top + h + j(x, 7));
  }
  for (let y = top + h - 10; y > top; y -= 10) P.lineTo(x0 + j(y, 9), y);
  P.closePath();
  return P;
}
/** the banner's type, set at the legibility floor (22 px cap height at 1080p) and measured once */
interface BanType {
  name: string;
  nameSize: number;
  title: string;
  titleSize: number;
  auth: string;
  authSize: number;
  year: string;
  yearSize: number;
  x0: number;
  x1: number;
  h: number;
  rows: { name: number; rule: number; title: number; a1: number; a2: number; year: number };
}
let BT: BanType | null = null;
function banType(c: C): BanType {
  if (BT) return BT;
  c.save();
  c.textBaseline = 'alphabetic';
  const nameSize = Math.max(34, legibleSize(c, `600 10px ${FONT.display}`, 1));
  const titleSize = legibleSize(c, `600 10px ${FONT.sc}`, 1, 'attention is all you need');
  const authSize = legibleSize(c, `italic 400 10px ${FONT.text}`, 1);
  const yearSize = legibleSize(c, `500 10px ${FONT.mono}`, 1);
  const name = `600 ${nameSize}px ${FONT.display}`;
  const title = `600 ${titleSize}px ${FONT.sc}`;
  const auth = `italic 400 ${authSize}px ${FONT.text}`;
  const year = `500 ${yearSize}px ${FONT.mono}`;
  const wName = measureTracked(c, 'THE TRANSFORMER', { font: name, size: nameSize, tracking: 0.08 });
  const wTitle = measureTracked(c, 'attention is all you need', { font: title, size: titleSize, tracking: 0.06 });
  c.font = auth;
  const wAuth = Math.max(c.measureText('Vaswani · Shazeer · Parmar · Uszkoreit').width, c.measureText('Jones · Gomez · Kaiser · Polosukhin').width);
  c.restore();
  const W = Math.ceil(Math.max(wName, wTitle, wAuth) + 64);
  const rName = 16 + nameSize * 0.7 + 8;
  const rRule = rName + 13;
  const rTitle = rRule + 12 + titleSize * 0.62;
  const rA1 = rTitle + authSize * 1.42;
  const rA2 = rA1 + authSize * 1.18;
  const rYear = rA2 + yearSize * 1.3;
  BT = {
    name, nameSize, title, titleSize, auth, authSize, year, yearSize,
    x0: BAN.cx - W / 2,
    x1: BAN.cx + W / 2,
    h: Math.ceil(rYear + 16),
    rows: { name: rName, rule: rRule, title: rTitle, a1: rA1, a2: rA2, year: rYear },
  };
  return BT;
}
/**
 * The banner drops on long cords from the roof truss, LOW in the hall (over the floor, clear of the slips and
 * their threads). It never shows blank: on 'Transformer' its first fold drops with the name already inked on it
 * (the cloth reveals the lettering as it comes down); on 'title' it unrolls the rest of the way as the paper's
 * title inks itself, then the eight authors, then 2017.
 */
function banner(c: C, env: PaintEnv, p: Plan, t: number, web: number) {
  const tq = tq12(t);
  const B = banType(c);
  const m = env.mood;
  const P = MOODS.parchment;
  const { top } = BAN;
  const { x0, x1 } = B;
  // the cords: from the rod's ends up to the roof truss (they show just before the cloth drops)
  const cordA = sm((tq - (p.named - 0.75)) / 0.3);
  if (cordA <= 0) return;
  c.save();
  c.globalAlpha *= cordA;
  c.strokeStyle = mixLab(m.fg, m.set, 0.15);
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(x0 + 24, top - 4);
  c.lineTo(x0 + 60, -30);
  c.moveTo(x1 - 24, top - 4);
  c.lineTo(x1 - 60, -30);
  c.stroke();
  c.restore();
  // stage 1: the first fold, name already on it (named − 0.3 → named + 0.12); stage 2: the rest, on 'title'
  const u1 = sm((tq - (p.named - 0.3)) / 0.42);
  // stage 2: the title's fold, on 'title'; stage 3: the authors' fold, just before their names ink
  const h2 = B.rows.title + B.titleSize * 0.5;
  const u2 = sm((tq - (p.title - 0.15)) / 0.4);
  const u3 = sm((tq - (p.authors - 0.4)) / 0.45);
  const h = BAN.h1 * u1 + (h2 - BAN.h1) * u2 + (B.h - h2) * u3;
  if (h <= 0.5) {
    c.fillStyle = mixLab(m.fg, m.set, 0.25);
    c.fillRect(x0 - 12, top - 6, x1 - x0 + 24, 9);
    return;
  }
  // one step darker than the threads: shadowed parchment, warmed a little by the web
  const paper = mixLab(mixLab(mixLab(P.sky[1], m.haze, 0.5), m.setHaze, 0.42), m.core, 0.06 * web);
  const edge = bannerEdge(x0, x1, top, h, u3 > 0.97);
  c.save();
  c.translate(-7, 9);
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fill(edge);
  c.restore();
  c.fillStyle = paper;
  c.fill(edge);
  const g = c.createLinearGradient(0, top, 0, top + h);
  g.addColorStop(0, withAlpha(m.fg, 0.2));
  g.addColorStop(0.45, withAlpha(m.fg, 0.03));
  g.addColorStop(1, withAlpha(m.core, 0.07 * web));
  c.save();
  c.clip(edge);
  c.fillStyle = g;
  c.fillRect(x0 - 10, top, x1 - x0 + 20, h + 10);
  c.strokeStyle = withAlpha(m.fg, 0.08);
  c.lineWidth = 0.7;
  c.beginPath();
  for (let k = 0; k < 70; k++) {
    const fx = x0 + hash1(k, 31) * (x1 - x0), fy = top + hash1(k, 37) * B.h;
    if (fy > top + h) continue;
    c.moveTo(fx, fy);
    c.lineTo(fx + 4 + hash1(k, 41) * 8, fy + (hash1(k, 43) - 0.5) * 2);
  }
  c.stroke();

  // the lettering, inside the cloth (so the drop reveals it)
  const ink = mixLab(P.ink, m.ink, 0.25);
  const cx = BAN.cx;
  const R = B.rows;
  c.fillStyle = ink;
  c.textBaseline = 'alphabetic';
  drawTracked(c, 'THE TRANSFORMER', cx, top + R.name, { font: B.name, size: B.nameSize, tracking: 0.08, align: 'center' });
  c.fillRect(cx - 120, top + R.rule, 240, 1.2);
  c.beginPath();
  c.moveTo(cx, top + R.rule - 5);
  c.lineTo(cx + 5, top + R.rule + 0.6);
  c.lineTo(cx, top + R.rule + 6);
  c.lineTo(cx - 5, top + R.rule + 0.6);
  c.closePath();
  c.fill();
  // inking: a ragged wipe left → right (on twos)
  const inked = (y: number, hh: number, at: number, dur: number, draw: () => void) => {
    const u = clamp01((tq - at) / dur);
    if (u <= 0) return;
    c.save();
    c.beginPath();
    const xr = x0 + 20 + (x1 - x0 - 40) * u;
    c.moveTo(x0, y - hh);
    c.lineTo(xr, y - hh);
    for (let k = 0; k <= 6; k++) c.lineTo(xr + Math.sin(k * 2.3 + at) * 5, y - hh + ((k + 1) * hh * 2) / 7);
    c.lineTo(x0, y + hh);
    c.closePath();
    c.clip();
    draw();
    c.restore();
  };
  inked(top + R.title - B.titleSize * 0.25, B.titleSize * 0.7, p.title + 0.2, 0.9, () => {
    drawTracked(c, 'attention is all you need', cx, top + R.title, { font: B.title, size: B.titleSize, tracking: 0.06, align: 'center' });
  });
  inked(top + (R.a1 + R.a2) / 2 - B.authSize * 0.35, B.authSize * 1.3, p.authors, 1.5, () => {
    c.font = B.auth;
    c.textAlign = 'center';
    c.fillText('Vaswani · Shazeer · Parmar · Uszkoreit', cx, top + R.a1);
    c.fillText('Jones · Gomez · Kaiser · Polosukhin', cx, top + R.a2);
  });
  inked(top + R.year - B.yearSize * 0.35, B.yearSize * 0.7, p.authors + 0.9, 0.5, () => {
    const yw = measureTracked(c, '2017', { font: B.year, size: B.yearSize, tracking: 0.14 });
    c.fillRect(cx - yw / 2 - 40, top + R.year - B.yearSize * 0.35, 28, 1);
    c.fillRect(cx + yw / 2 + 12, top + R.year - B.yearSize * 0.35, 28, 1);
    drawTracked(c, '2017', cx, top + R.year, { font: B.year, size: B.yearSize, tracking: 0.14, align: 'center' });
  });
  c.restore();
  c.strokeStyle = withAlpha(mixLab(P.ink, m.fg, 0.3), 0.55);
  c.lineWidth = 1.1;
  c.stroke(edge);
  // the rod
  c.fillStyle = mixLab(m.fg, m.set, 0.25);
  c.fillRect(x0 - 12, top - 6, x1 - x0 + 24, 9);
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(x0 - 12, top - 6, x1 - x0 + 24, 1.2);
}

/** the near occluder (critic round 1, depth): the carved END of a hall pew in the bottom-left corner, blurred on L5
 *  at ~60% value, its seat and back running out of frame; a poppyhead finial and a pierced quatrefoil (evenodd) */
function pewEnd(c: C, env: PaintEnv) {
  const m = env.mood;
  const ink = mixLab(m.fg, m.set, 0.12);
  const P = new Path2D();
  // the bench end: a square board with a moulded cap, a rolled arm-scroll at its top front corner
  P.moveTo(-40, 760);
  P.lineTo(-40, 500);
  P.lineTo(78, 500);
  P.bezierCurveTo(104, 500, 116, 512, 116, 528);
  P.bezierCurveTo(116, 546, 98, 552, 90, 542);
  P.bezierCurveTo(84, 534, 92, 524, 100, 530);
  P.lineTo(100, 548);
  P.lineTo(104, 760);
  P.closePath();
  // the cap moulding
  P.rect(-40, 490, 112, 10);
  // a pierced quatrefoil and a lancet slot (evenodd holes)
  const qx = 34, qy = 590, r = 12;
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const cx = qx + Math.cos(a) * r * 1.4, cy = qy + Math.sin(a) * r * 1.4;
    P.moveTo(cx + r, cy);
    P.arc(cx, cy, r, 0, Math.PI * 2);
  }
  P.moveTo(26, 700);
  P.lineTo(26, 650);
  P.quadraticCurveTo(34, 632, 42, 650);
  P.lineTo(42, 700);
  P.closePath();
  c.fillStyle = ink;
  c.fill(P, 'evenodd');
  c.fill(new Path2D('M -40 530 h 20 v 230 h -20 Z'));
  // a thin top light on the cap and the scroll (window side)
  c.strokeStyle = withAlpha(m.rim, 0.25);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-40, 490);
  c.lineTo(72, 490);
  c.moveTo(78, 500);
  c.bezierCurveTo(104, 500, 116, 512, 116, 528);
  c.stroke();
}

function dateStamp(c: C, text: string, at: number, dur: number, t: number, m: { core: string; ink: string }) {
  const A = sm((t - at) / 0.5) * (1 - sm((t - at - dur) / 0.6));
  if (A <= 0) return;
  c.save();
  c.textBaseline = 'alphabetic';
  const size = legibleSize(c, `500 19px ${FONT.mono}`, 19);
  // a soft ink plate for legibility
  const g = c.createRadialGradient(96, 664, 0, 96, 664, 150);
  g.addColorStop(0, withAlpha(m.ink, 0.5 * A));
  g.addColorStop(1, withAlpha(m.ink, 0));
  c.fillStyle = g;
  c.fillRect(-60, 560, 320, 200);
  c.globalAlpha = A;
  c.fillStyle = mixLab('#efe3cf', m.core, 0.2);
  const w = drawTracked(c, text, 52, 672, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.12, align: 'left' });
  c.globalAlpha = A * 0.6;
  c.fillRect(52, 672 - size - 10, w * sm((t - at - 0.2) / 0.7), 0.8);
  c.fillRect(52, 672 - size - 14, 0.8, 8);
  c.restore();
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const drop = T.word(L1, 'Drop');
    const plan: Plan = {
      drop,
      release: drop + 0.38,
      turn: drop + 0.62,
      walk0: drop + 0.7,
      // (critic round 1) the dark beat is HELD: it starts on 'keep', is fully dark through 'attention' and releases
      // only with the single-step light-up on 'every'; threads then grow from every slip through 'looks at every
      // other', and 'all at once' is the brightness peak
      dip0: T.word(L1, 'keep') - 0.04,
      dip1: T.word(L1, 'keep') + 0.3,
      every: T.word(L1, 'every'),
      grow0: T.word(L1, 'looks') - 0.12,
      grow1: T.wordEnd(L1, 'other') + 0.05,
      all: T.word(L1, 'all'),
      once: T.word(L1, 'once'),
      named: T.word(L1, 'Transformer'),
      title: T.word(L2, 'title'),
      authors: T.word(L2, 'Need') + 0.55,
      outT: T.word(L2, 'out-translated'),
      D: T.duration,
    };
    return { tl, plan };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const p = scene.plan as Plan;

    // the tint crossfade: duskRose → serverCyan over the crossfade, fully cyan before the line
    // the hold breathes: a very slow lens push (3%, no parallax, so the slips stay on their beam) from the
    // authors' line to the end
    const pushU = sm((t - (p.authors + 0.8)) / Math.max(1, p.D - (p.authors + 0.8)));
    f.camera({ ...CAMERA3_HOME, lens: 1 + 0.03 * pushU });
    const tint = sm((t + 0.35) / 1.55);
    if (tint < 1) f.setMood('serverCyan', { from: 'duskRose', u: tint });

    // light states: the held dark beat ('keep' → 'every'), then every slip lights at once on 'every' (the same step)
    const allOn = tq >= p.every ? 1 : 0; // a single step, on the word
    const darkK = allOn ? 0 : sm((t - p.dip0) / (p.dip1 - p.dip0));
    // the threads grow from every slip at once (0 → 1: they meet mid-span by the end of 'every other')
    const web = clamp01((t - p.grow0) / (p.grow1 - p.grow0));
    // 'all at once': the shot's brightness peak (rising from 'all', cresting just after 'once', settling over ~1.5 s)
    const crest = p.once + 0.12;
    const peak = t < crest ? sm((t - (p.all - 0.12)) / (crest - (p.all - 0.12))) : Math.exp(-Math.pow((t - crest) / 1.15, 2));
    // the hold's beat: ONE bright wave runs the length of the hammock on 'out-translated' (~2 s, near → far), then
    // the web settles to a steady glow a second before the cut (no breathing, no shimmer)
    const WAVE0 = p.outT - 0.1, WAVE_D = 2.0;
    const pulse = sm((t - WAVE0) / 0.3) * (1 - sm((t - (WAVE0 + WAVE_D - 0.3)) / 0.4));
    const settle = 1 - sm((t - (p.D - 2.3)) / 1.3);
    const glowK = allOn * (0.62 + 0.26 * web + 0.5 * peak + 0.08 * pulse + 0.04 * Math.sin(t * 1.3) * settle);
    // the windows: back a step lower after the dip (the hall waits), cooler under the web, swelling with its peak
    const base = 1 - 0.22 * sm((t - p.dip1) / 0.3);
    f.backlight({ sunX: HALL_VP.x - 30, sunY: HALL_VP.y - 10, intensity: lerp(base, 0.1, darkK) * (1 - allOn * (0.35 - 0.45 * peak)) });

    // the hall (static camera: baked once per mood, blended through the tint crossfade)
    f.layer('L2', (c, env) => {
      const bakeFor = (moodId: 'duskRose' | 'serverCyan') =>
        f.cached(`${ID}/hall/${moodId}`, 1280, 720, (cc) => hallArch(cc, CAM, { ...env, mood: MOODS[moodId] } as PaintEnv, {}));
      bakeFor('serverCyan')(c, 0, 0);
      if (tint < 1) {
        c.save();
        c.globalAlpha = 1 - tint;
        bakeFor('duskRose')(c, 0, 0);
        c.restore();
      }
    });
    // the dark beat (and the dimmer hall behind the web), on an unblurred sheet just in front of the walls
    // (after the dip the hall waits a shade dimmer; under the web it is dimmer still, lifting at the peak)
    const veil = Math.max(0.85 * darkK, 0.16 * sm((t - p.dip1) / 0.3), allOn * (0.3 - 0.16 * peak));
    if (veil > 0) {
      f.layer(VEIL, (c, env) => {
        c.fillStyle = withAlpha(env.mood.fg, veil);
        c.fillRect(-20, -20, 1320, 760);
      });
    }
    f.fog({ yCenter: 470, height: 520, alpha: 0.3 * (1 - 0.8 * darkK), drift: 6 });

    const light = { halo: f.mood.halo, core: f.mood.core };
    // the abandoned lamp keeps the old reader's warm amber: the shot's one counter-accent to the cool web
    const AMB = MOODS.candleAmber;
    const warm = { halo: AMB.halo, core: AMB.core };
    const sc = scribeAt(p, t);
    const lampPt = floorPoint(CAM, SX + 34, SZ - 30);
    const lampS = lampPt.s;
    // the scribe (as the hall set's scribeDraw, but VALUE-KEPT in the dark beat: his ink is not hazed toward the hall
    // while it is dark, so he stays the darkest shape, and once the lamp is down only its side catches a rim)
    const sq = floorPoint(CAM, sc.x, SZ);
    const sh = hallHaze(sq.vz);
    const lampSide = { x: 0.85, y: 0.5 };
    const keyDir = sc.lampInHand ? { x: 0.6, y: -0.8 } : lampSide;
    const sOpts: PuppetDrawOpts = {
      x: sq.x,
      y: sq.y,
      facing: sc.facing,
      pose: withLife(sc.pose, tq, 5),
      scale: sq.s,
      ink: mixLab(PUPPET_NEAR_BLACK, f.mood.haze, sh * 0.85 * (1 - darkK)),
      light: { ...keyDir, floor: 0.15 * (1 - darkK) },
      edgeRim: { ...keyDir, px: 1.5, alpha: 0.55 * (1 - sh) },
    };
    const sHand = scribe.anchor(sOpts, 'handF');

    // the s01 relay's wicks, still glowing as embers (brighter near, a spark far down); out on 'attention'
    const emberK = 1 - sm((t - p.dip0) / 0.22);
    const embers = (c: C, near: boolean) => {
      if (emberK <= 0.003) return;
      for (let i = 22; i >= 0; i--) {
        const S = slipScreen(CAM, i);
        if ((S.vz <= 2400) !== near) continue;
        const k = 0.95 * Math.pow(0.87, i) * emberK * (0.92 + 0.08 * Math.sin(tq * 5 + i));
        wickFlame(c, S.wick.x, S.wick.y - 4 * S.s, S.s, k, t, i * 7 + 3, light, i === 22 ? 0.4 * emberK : 0);
      }
    };
    const drawSlips = (c: C, env: PaintEnv, near: boolean) => {
      for (let i = HALL.N - 1; i >= 0; i--) {
        const S = slipScreen(CAM, i);
        if ((S.vz <= 2400) !== near) continue;
        const atLamp = !near ? 0 : i <= SLIP0 + 1 && sc.lampInHand ? 0.5 : 0;
        // the far slips glow less (hazed), so the line never fuses into one bright streak at the vanishing point
        // and the far quarter of the row drops a further step (~10% in value) so it never smears at the vanishing point
        const farQ = 1 - 0.16 * sm((i - HALL.N * 0.7) / (HALL.N * 0.12));
        const ownD = Math.max(0.3, 1 - hallHaze(S.vz) * 0.95) * farQ;
        hallSlip(c, CAM, env, i, { lit: atLamp, own: glowK * (i < NT ? 1 : 0.6) * ownD, dim: darkK, textScale: 1.45, swing: Math.sin(tq * 0.9 + i * 1.7) * 0.012 });
      }
      // every wick relights on 'every', with its slip (the same step), brighter near, a point far down the line
      if (allOn > 0) {
        for (let i = HALL.N - 1; i >= 0; i--) {
          const S = slipScreen(CAM, i);
          if ((S.vz <= 2400) !== near) continue;
          const k = 0.75 * Math.max(0.15, 1 - hallHaze(S.vz)) * (0.94 + 0.06 * Math.sin(tq * 5 + i)) * (1 - 0.3 * sm((i - HALL.N * 0.7) / (HALL.N * 0.12)));
          wickFlame(c, S.wick.x, S.wick.y - 4 * S.s, S.s, k, t, i * 7 + 3, light, 0);
        }
      }
    };

    f.layer('L3', (c, env) => {
      drawSlips(c, env, false);
      embers(c, false);
    });
    f.fog({ yCenter: 600, height: 300, alpha: 0.12 * (1 - 0.8 * darkK), drift: 10 });

    f.layer('L4', (c, env) => {
      // each lit slip glows: a soft halo behind it (drawn before the paper so the slip silhouettes in its own light)
      if (glowK > 0) {
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        for (let i = HALL.N - 1; i >= 0; i--) {
          const S = slipScreen(CAM, i);
          // no minimum radius and a steep depth falloff: dozens of far halos must not stack into a streak
          const r = 92 * S.s;
          const dk = 1 - hallHaze(S.vz);
          const a = 0.2 * glowK * dk * dk * dk * (1 - 0.3 * sm((i - HALL.N * 0.7) / (HALL.N * 0.12)));
          if (r < 2 || a < 0.004) continue;
          const g = c.createRadialGradient(S.x, S.y + S.h / 2, 0, S.x, S.y + S.h / 2, r);
          g.addColorStop(0, withAlpha(env.mood.core, a));
          g.addColorStop(1, withAlpha(env.mood.halo, 0));
          c.fillStyle = g;
          c.fillRect(S.x - r, S.y + S.h / 2 - r, 2 * r, 2 * r);
        }
        c.globalCompositeOperation = op;
      }
      drawSlips(c, env, true);
      embers(c, true);

      // THE WEB: threads shoot out from every slip at once and meet mid-span; brightness and width ← the pair's
      // attention weight. Batched by (colour, alpha, width) so ~1900 threads cost a few dozen strokes.
      if (web > 0) {
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';
        // a faint breathing shimmer after the authors, gone before the one wave (so the wave is the hold's event)
        const shimOn = sm((t - (p.authors + 0.5)) / 1.2) * (1 - sm((t - (WAVE0 - 0.5)) / 0.5));
        // the 'out-translated' wave: a bright front running ONCE the length of the line, near → far, over WAVE_D
        const front = ((t - WAVE0) / WAVE_D) * (NT + 10) - 5;
        const lightK = (glowK / 0.88) * (0.7 + 0.3 * web) * (1 + 0.75 * peak);
        const buckets = new Map<string, { path: Path2D; a: number; lw: number; core: boolean }>();
        // while they travel, each thread's leading tip burns brighter (light shooting out of every slip at once)
        const tips = new Map<number, Path2D>();
        // every thread is the SAME fraction of its own arc length along at every frame (each end grows to the
        // middle): fast out of the slip, slowing as they meet
        const gu = (1 - Math.pow(1 - web, 2)) * 0.5;
        for (const th of THREADS) {
          const shim0 = lerp(1, 0.86 + 0.1 * Math.sin((t - p.authors) * 1.6 - th.mid * 0.45), shimOn);
          const wave = pulse > 0.01 ? 1.7 * Math.exp(-Math.pow((th.mid - front) / 6, 2)) * pulse : 0;
          const al = th.a0 * lightK * (shim0 + wave);
          const aq = Math.min(wave > 0.05 ? 34 : 24, Math.round(al * 40));
          if (aq <= 0) continue;
          const core = th.w > 0.45;
          const wq = Math.round(th.lw * 3);
          const key = `${core ? 1 : 0}|${aq}|${wq}`;
          let bk = buckets.get(key);
          if (!bk) buckets.set(key, (bk = { path: new Path2D(), a: aq / 40, lw: wq / 3, core }));
          const P = bk.path;
          if (web >= 1) {
            P.moveTo(th.ax, th.ay);
            P.quadraticCurveTo(th.mx, th.my, th.bx, th.by);
          } else {
            // partial: from each end toward the middle (both ends at once: every slip looks out at the same time)
            const qx = (u: number) => (1 - u) * (1 - u) * th.ax + 2 * (1 - u) * u * th.mx + u * u * th.bx;
            const qy = (u: number) => (1 - u) * (1 - u) * th.ay + 2 * (1 - u) * u * th.my + u * u * th.by;
            const L = th.arc[ARC_N];
            const n = 6;
            P.moveTo(th.ax, th.ay);
            for (let k = 1; k <= n; k++) {
              const u = arcU(th, (k / n) * gu * L);
              P.lineTo(qx(u), qy(u));
            }
            P.moveTo(th.bx, th.by);
            for (let k = 1; k <= n; k++) {
              const u = arcU(th, L - (k / n) * gu * L);
              P.lineTo(qx(u), qy(u));
            }
            // the burning tips have a floor, so the far slips visibly shoot their threads at the same frame too
            const tq2 = Math.min(24, Math.round(Math.min(1, Math.max(0.3, al * 2.4)) * 24));
            if (tq2 > 1) {
              let tp = tips.get(tq2);
              if (!tp) tips.set(tq2, (tp = new Path2D()));
              const ua = arcU(th, gu * 0.8 * L), ub = arcU(th, gu * L);
              const va = arcU(th, L - gu * 0.8 * L), vb = arcU(th, L - gu * L);
              tp.moveTo(qx(ua), qy(ua));
              tp.lineTo(qx(ub), qy(ub));
              tp.moveTo(qx(va), qy(va));
              tp.lineTo(qx(vb), qy(vb));
            }
          }
        }
        for (const bk of buckets.values()) {
          c.strokeStyle = withAlpha(bk.core ? env.mood.core : env.mood.rim, Math.min(1, bk.a));
          c.lineWidth = bk.lw;
          c.stroke(bk.path);
        }
        if (web < 1) {
          const tipK = 0.6 * (1 - sm((web - 0.7) / 0.3));
          c.lineWidth = 1.3;
          for (const [q, tp] of tips) {
            c.strokeStyle = withAlpha(env.mood.core, (q / 24) * tipK);
            c.stroke(tp);
          }
        }
        c.globalCompositeOperation = op;
      }

      // the abandoned lamp (on the floor once released) and its pool (the scribe himself is drawn after the rim pass)
      const lampOnFloor = !sc.lampInHand;
      const lk = 0.82 * (1 - 0.4 * allOn);
      if (lampOnFloor) handLamp(c, env, lampPt.x, lampPt.y - 31 * lampS * 1.25, lampS * 1.25, lk, t, warm);
      // the lamp's pool on the floor
      const pk = lk * (0.6 + 0.4 * darkK);
      const px = lampOnFloor ? lampPt.x : sHand.x;
      const op = c.globalCompositeOperation;
      c.globalCompositeOperation = 'lighter';
      c.save();
      c.translate(px, lampPt.y);
      c.scale(1, 0.18);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 380 * lampS);
      g.addColorStop(0, withAlpha(AMB.halo, 0.42 * pk));
      g.addColorStop(1, withAlpha(AMB.halo, 0));
      c.fillStyle = g;
      c.fillRect(-380 * lampS, -380 * lampS, 760 * lampS, 760 * lampS);
      c.restore();
      c.globalCompositeOperation = op;
    });
    f.rim({ x: 0.3, y: -1 });


    f.layer('L4', (c, env) => {
      // the scribe, after the rim pass: near-black, rimmed only on his own key side (the lamp, once it is down)
      if (sq.vz > 130 && sq.x > -200) {
        scribe.draw(c, sOpts, env);
        if (sc.lampInHand) handLamp(c, env, sHand.x, sHand.y, sq.s, 0.82, t, warm);
      }
      // once every line has inked, the banner is static: bake it
      if (t > p.authors + 1.7) {
        const tt = p.authors + 1.8;
        const B = banType(c);
        const bx = Math.floor(B.x0 - 40), bw = Math.ceil(B.x1 - B.x0 + 80);
        f.cached(`${ID}/banner4/${env.mood.id}`, bw, 720, (cc) => {
          cc.translate(-bx, 0);
          banner(cc, env, p, tt, 1);
        })(c, bx, 0);
      } else banner(c, env, p, t, web);
    });

    // the near plane: a pew end in the bottom-left corner (the scribe walks out behind it)
    f.layer('L5', (c, env) => {
      const bakePew = (moodId: 'duskRose' | 'serverCyan') =>
        f.cached(`${ID}/pew/${moodId}`, 220, 400, (cc) => {
          cc.translate(40, -400);
          pewEnd(cc, { ...env, mood: MOODS[moodId] } as PaintEnv);
        });
      bakePew('serverCyan')(c, -40, 400);
      if (tint < 1) {
        c.save();
        c.globalAlpha = 1 - tint;
        bakePew('duskRose')(c, -40, 400);
        c.restore();
      }
    });

    dateStamp(f.c, '2017', p.drop, 3.6, t, f.mood);
  },
});
