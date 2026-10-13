/**
 * ch10-s04 — the Transformer: the scribe sets down his lamp and leaves; then every slip lights at once and threads
 * of light join every pair, and a banner inks THE TRANSFORMER and the paper's title and authors
 * (serverCyan; 19.8 s; a 1 s crossfade in from the cafe, with a tint crossfade duskRose → serverCyan, no dip).
 *
 * TEACHES self-attention against ch10-s01's slow reader. The hall camera that tracked in s01 now HOLDS STILL:
 * nothing needs to travel.
 *   'Drop'         the scribe bends, sets his lamp on the floor, turns and walks out of frame (2017 stamped)
 *   'attention'    a brief dip: the slips go dark, the abandoned lamp's small pool the only light
 *   'every'        every slip down the WHOLE hall lights at the same instant, and threads of light shoot between
 *                  EVERY pair at once
 *                  (all queries together). Thread brightness ← an attention weight: a toy softmax over illustrative
 *                  word vectors (each slip's row sums to 1), not a trained model.
 *   'Transformer'  a small parchment banner drops low over the floor (clear of the slips), THE TRANSFORMER on it
 *   'title'        beneath it, in the banner's own hand, ATTENTION IS ALL YOU NEED, then the eight authors in the
 *                  paper's order (Vaswani · Shazeer · Parmar · Uszkoreit · Jones · Gomez · Kaiser · Polosukhin);
 *                  the web glows through the result line and the hold; '2017' is lettered on the banner's foot
 *   hold           a very slow lens push (3%) on the web and banner while a shimmer wave runs through the threads
 *   continuity     the wicks the s01 relay lit still glow as embers down the line when the shot opens; they go out
 *                  on 'attention' (the slow reader's light is gone before the new one comes)
 */
import { Timeline } from '../../../core';
import { CAMERA3_HOME, MOODS, defineShot, mixLab, withAlpha } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import type { PaintEnv, Pose } from '../../../film';
import { POSES, blendPose, pose, strideLength, walkPose, withLife } from '../../../film/silhouette/puppet';
import { FONT, drawTracked, legibleSize, measureTracked } from '../../../film/silhouette/type';
import { HALL, HALL_VP, HALL_WORDS, type HallCam, floorPoint, hallArch, hallHaze, hallSlip, handLamp, scribe, scribeDraw, slipAt, slipScreen, wickFlame } from '../sets/ch10-s01-hall';

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

// ------------------------------------------------------------------------------------------------ the scribe's exit
const CARRY: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 6, head: -4, shoulderF: 30, elbowF: 66, wristF: -6, shoulderB: -8, elbowB: 14 }, { handF: 'grip' });
const STOOP: Pose = pose({ hipF: 58, kneeF: -84, hipB: 36, kneeB: -70, torso: 26, neck: 10, head: 10, shoulderF: 26, elbowF: 6, wristF: 0, shoulderB: -6, elbowB: 18 }, { handF: 'grip' });
const STRIDE = strideLength(scribe.spec, 1);

interface Plan {
  drop: number;
  release: number;
  turn: number;
  walk0: number;
  dark0: number;
  dark: number;
  /** 'every': every slip's paper and wick light at the same instant (one step on twos) */
  every: number;
  /** 'once': the threads shoot between every pair in a single 1/3 s step (with the score's full chord) */
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
      // a real dark beat on 'attention' (the old light goes out: windows and slips dark, the lamp's pool the only
      // light), then EVERY slip lights at once on 'every', and the threads join every pair on 'once'
      dark0: T.word(L1, 'attention') - 0.32,
      dark: T.word(L1, 'attention') - 0.02,
      every: T.word(L1, 'every'),
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

    // light states: the windows dim to dark for the held beat, and come back (cooler) with the web
    const darkK = sm((t - p.dark0) / (p.dark - p.dark0)) * (1 - (tq >= p.every ? 1 : 0));
    const allOn = tq >= p.every ? 1 : 0; // a single step, on the word
    const web = clamp01((t - p.once) / 0.33);
    // the hold's beat: one bright wave through the web on 'out-translated'
    const pulse = Math.exp(-Math.pow((t - (p.outT + 0.12)) / 0.38, 2));
    const glowK = allOn * (0.9 + 0.1 * pulse + 0.05 * Math.sin(t * 1.3));
    f.backlight({ sunX: HALL_VP.x - 30, sunY: HALL_VP.y - 10, intensity: lerp(1, 0.04, darkK) * (1 - 0.35 * allOn) });

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
    const veil = Math.max(0.9 * darkK, 0.3 * allOn);
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

    // the s01 relay's wicks, still glowing as embers (brighter near, a spark far down); out on 'attention'
    const emberK = 1 - sm((t - p.dark0) / Math.max(0.3, p.dark - p.dark0));
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
        const ownD = Math.max(0.3, 1 - hallHaze(S.vz) * 0.95);
        hallSlip(c, CAM, env, i, { lit: atLamp, own: glowK * (i < NT ? 1 : 0.6) * ownD, dim: darkK, textScale: 1.45, swing: Math.sin(tq * 0.9 + i * 1.7) * 0.012 });
      }
      // every wick relights on 'every', with its slip (the same step), brighter near, a point far down the line
      if (allOn > 0) {
        for (let i = HALL.N - 1; i >= 0; i--) {
          const S = slipScreen(CAM, i);
          if ((S.vz <= 2400) !== near) continue;
          const k = 0.75 * Math.max(0.15, 1 - hallHaze(S.vz)) * (0.94 + 0.06 * Math.sin(tq * 5 + i));
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
          const a = 0.2 * glowK * dk * dk * dk;
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

      // THE WEB: every pair at once; brightness and width ← the pair's attention weight
      if (web > 0) {
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';
        const S = Array.from({ length: NT }, (_, i) => slipScreen(CAM, i));
        // the hold's shimmer: a slow wave of brightness travelling down the line (alpha 0.6 → 0.9)
        const shimOn = sm((t - (p.authors + 0.5)) / 1.2);
        for (const pr of PAIRS) {
          const a = S[pr.i], b = S[pr.j];
          const w = pr.w / WMAX;
          const ax = a.x, ay = a.y + a.h * 0.98, bx = b.x, by = b.y + b.h * 0.98;
          const dx = bx - ax;
          // a sag that grows with screen span but is capped by depth, so the far end never funnels into one streak
          const sNear = Math.max(a.s, b.s);
          const sag = Math.min(14 + Math.abs(dx) * 0.28, 150 * sNear + 10);
          const mx = (ax + bx) / 2, my = Math.max(ay, by) + sag;
          // threads fade with depth like the slips (by their deeper end)
          const depth = 1 - hallHaze(Math.max(a.vz, b.vz));
          const fadeD = 0.42 + 0.58 * Math.max(0, depth);
          const mid = (pr.i + pr.j) / 2;
          const shim0 = lerp(1, 0.6 + 0.3 * (0.5 + 0.5 * Math.sin((t - p.authors) * 1.6 - mid * 0.45)), shimOn);
          // the 'out-translated' wave: a bright front running down the line from the near slips
          const front = (t - (p.outT - 0.1)) * 40;
          const wave = pulse > 0.01 ? 0.9 * Math.exp(-Math.pow((mid - front) / 6, 2)) * Math.min(1, pulse * 3) : 0;
          const shim = shim0 + wave;
          // the thread shoots out from both ends at once (a single step: 1/3 s)
          // short threads between two far slips are dimmed by their screen span, so the dozens that meet near the
          // vanishing point stay a fine web instead of piling into one hot streak
          const span = Math.hypot(bx - ax, by - ay);
          const spanK = 0.18 + 0.82 * Math.pow(clamp01(span / 140), 0.8);
          // and every thread is thinned toward its far end by how crowded the line is there on screen (slips
          // shrink and bunch toward the vanishing point, so their threads overlap): additive light stays a web
          const densK = 0.16 + 0.84 * Math.pow(clamp01(Math.min(a.s, b.s) / 0.32), 0.75);
          const al = (0.13 + 0.9 * Math.pow(w, 0.7)) * web * (glowK / 0.95) * fadeD * shim * spanK * densK;
          if (al < 0.006) continue;
          c.strokeStyle = withAlpha(w > 0.45 ? env.mood.core : env.mood.rim, Math.min(1, al));
          c.lineWidth = 0.5 + 2.6 * w * Math.sqrt((a.s + b.s) / 2);
          c.beginPath();
          if (web >= 1) {
            c.moveTo(ax, ay);
            c.quadraticCurveTo(mx, my, bx, by);
          } else {
            // partial: from each end toward the middle
            const qx = (u: number) => (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx;
            const qy = (u: number) => (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * by;
            const n = 8;
            c.moveTo(ax, ay);
            for (let k = 1; k <= n; k++) c.lineTo(qx((k / n) * web * 0.5), qy((k / n) * web * 0.5));
            c.moveTo(bx, by);
            for (let k = 1; k <= n; k++) c.lineTo(qx(1 - (k / n) * web * 0.5), qy(1 - (k / n) * web * 0.5));
          }
          c.stroke();
        }
        c.globalCompositeOperation = op;
      }

      // the abandoned lamp (on the floor once released) and its pool
      const lampOnFloor = !sc.lampInHand;
      const sd = scribeDraw(c, CAM, env, { x: sc.x, z: SZ, pose: withLife(sc.pose, tq, 5), facing: sc.facing, light: { x: 0.6, y: -0.8 } });
      const lk = 0.82 * (1 - 0.4 * allOn);
      if (sd && sc.lampInHand) {
        handLamp(c, env, sd.hand.x, sd.hand.y, sd.q.s, lk, t, warm);
      } else if (lampOnFloor) {
        handLamp(c, env, lampPt.x, lampPt.y - 31 * lampS * 1.25, lampS * 1.25, lk, t, warm);
      }
      // the lamp's pool on the floor
      const pk = lk * (0.6 + 0.4 * darkK);
      const px = lampOnFloor ? lampPt.x : sd ? sd.hand.x : lampPt.x;
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

    dateStamp(f.c, '2017', p.drop, 3.6, t, f.mood);
  },
});
