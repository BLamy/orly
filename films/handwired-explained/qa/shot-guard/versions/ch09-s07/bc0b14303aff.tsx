/**
 * ch09-s07 — TAG 9 IS REVIEWED AND STRUCK: the shortest thread in the film (serverCyan, cut in: an insert; 20.92 s).
 *   L0915 "The same day, a review found RegExp had one of eighteen cores."
 *   L0920 "With eight workers, RegExp keeps up, and wins after a pause, except on that one pattern."
 *   L0916 "That tag held for hours."
 *   L0917 "The lab, with good grace: “RegExp is fast.”"
 *
 * TAG-LINE STAGING, ch09 variant (THE CYAN GRAIN), continuing ch09-s03b: the copper line at 60 % inside the search
 * hall, the map's grain shimmering behind (sets/ch09-s03-searchMap), the Lifespan Rule along the bottom, the earlier
 * tags as the film left them (tagsAt). Far behind, small and hazy, the RegExp booth from s06 with its one spool winder.
 *
 * TEACHES, word by word:
 *   0 -> 1.9     tight on tag 9 as s03b left it: THE GPU IS THE FASTER ONE, its pencilled (for the highlighter half).
 *   1.92 review  the narrator's hands (lower left) flip the tag with a paper snap; the red pencil (frame right) writes on
 *                its back: 1 of 18 cores. The date stamp 13 OCTOBER 2026 · THE SAME DAY and the review label set in.
 *   6.09 workers far behind, the one booth opens out into eight side by side, eight spool winders running clean and fast,
 *                each on its own thread; the measurement label replaces the review label, both sides' numbers in the
 *                same light, neither lit as the winner.
 *   12.43 struck the hands turn the tag front again (by 11.1) and the pencil strikes it through once (a tight insert);
 *                its thread drops to the Lifespan Rule and runs to its measured lifespan, between an hour and a day (the
 *                shortest thread in the film); a hairline copper pointer marks its cut tip.
 *   13.86 hours  the camera eases down the thread to the ruler and holds: everything else on the line hangs far longer.
 *   18.50 fast   the red pencil is laid down beside the tag, unhurried; far behind, the eight spool winders glint once.
 *                Hold on the struck tag and its short thread.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { FONT, LAYERS, defineShot, legibleSize, mixLab, placeStamp, softPlate, textProbe, textRole, textSwap, toLayer, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { drawPencil, pencilRed } from '../sets/narratorHands';
import { LINE, RULE, SLOT_X, TAG, TAGS, drawLine, drawRule, drawTags, lifeX, lineYAt, lineYFor, tagAnchors, tagStrike, tagsAt, type TagState } from '../sets/tagLine';
import { MAP, drawSearchMap, mapView, searchHallWall } from '../sets/ch09-s03-searchMap';
import { clamp01, lerp, seg, sm, smr, twos } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch09-s07';

/** the ch09 line height (60 %), as an offset from the canonical line (everything on the line is drawn shifted) */
const DY = lineYFor(ID) - LINE.y;
const X9 = SLOT_X['9'];
const T9: TagState = { id: '9' };
const AN = tagAnchors(T9);
/** tag 9's centre on screen-rest coordinates (with the variant offset) */
const TAG9_C = { x: X9, y: AN.eye.y + DY + TAG.h / 2 };
/** as in s03b: tag 10 (and its knot card) nudged right so nothing hides tag 9; the nano card beside tag 10 */
const X10_NUDGE = 72;
const NANO_DX = 96;
/** the hand scale for this insert */
const HS = 0.5;
const LEN = 118 * HS;
const FLIP_AT = { x: AN.eye.x + 4, y: AN.eye.y + TAG.h * 0.78 - LEN * 0.25 };
const FLIP_D = 0.8;
const WRITE_D = 2.3;
const STRIKE_D = 1.1;
const REST_D = 1.7;
/** tag 9's measured lifespan (sets/tagLine registry: 09:01 to the review, the same day) */
const LIFE_X = lifeX(TAGS['9'].strands![0].days);
/** where the pencil is laid down: beside the tag on the line's side, point down */
const PENCIL_REST = { x: AN.eye.x + TAG.w * 0.66, y: AN.eye.y + TAG.h - 4 };
const PENCIL_REST_ANG = Math.PI * 0.5 + 0.28;

/** action-plane scale k centred on (x, y): dolly to k 1.2, lens beyond (as s03b) */
function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}
/** log-uniform zoom between two framings; the centre tracks so the target point moves in a straight line */
function lerpCam(a: Camera3, z: Camera3, u: number): Camera3 {
  const ka = (1000 * a.lens) / (1000 - a.z), kz = (1000 * z.lens) / (1000 - z.z);
  const k = Math.exp(lerp(Math.log(ka), Math.log(kz), u));
  const f = Math.abs(1 / ka - 1 / kz) < 1e-9 ? u : (1 / ka - 1 / k) / (1 / ka - 1 / kz);
  return camK(lerp(a.x, z.x, f), lerp(a.y, z.y, f), k);
}
/** s03b's last framing (the insert on tag 9) */
const TIGHT = camK(X9 + 18, TAG9_C.y - 10, 3.64);
/** a little wider for the booths to open out behind */
const MID = camK(X9 + 60, TAG9_C.y - 40, 2.7);
/** the strike insert */
const STRIKE = camK(X9 + 4, TAG9_C.y + 2, 3.4);
/** down the thread to the ruler: tag 9, its short thread and the rule's start (an hour · a day) in one frame */
const WIDE = camK(535, 546, 1.55);
const WIDE1 = camK(538, 546, 1.6);

interface Beats {
  D: number;
  review: number;
  workers: number;
  struck: number;
  hours: number;
  grace: number;
  flip0: number;
  write0: number;
  unflip0: number;
  strike0: number;
  drop0: number;
  drop1: number;
  rest0: number;
}
function camAt(t: number, b: Beats): Camera3 {
  if (t < b.workers - 1.0) return lerpCam(TIGHT, camK(X9 + 20, TAG9_C.y - 6, 3.7), sm(t / (b.workers - 1.0)));
  const t1 = b.workers + 1.4;
  if (t < t1) return lerpCam(camK(X9 + 20, TAG9_C.y - 6, 3.7), MID, smr((t - b.workers + 1.0) / 2.4));
  const t2 = b.unflip0 - 0.5;
  if (t < t2) return lerpCam(MID, camK(X9 + 54, TAG9_C.y - 36, 2.8), sm((t - t1) / (t2 - t1)));
  const t3 = b.unflip0 + 0.6;
  if (t < t3) return lerpCam(camK(X9 + 54, TAG9_C.y - 36, 2.8), STRIKE, smr((t - t2) / (t3 - t2)));
  const t4 = b.hours - 0.25;
  if (t < t4) return STRIKE;
  const t5 = b.hours + 2.6;
  if (t < t5) return lerpCam(STRIKE, WIDE, smr((t - t4) / (t5 - t4)));
  return lerpCam(WIDE, WIDE1, sm((t - t5) / Math.max(0.1, b.D - t5)));
}

/** the faint map on the back plane (L3 rest px), as s03b */
const MAP_L3 = mapView(1060 / (MAP.cols * MAP.cw), (MAP.cols * MAP.cw) / 2, (MAP.rows * MAP.ch) / 2, { x: 650, y: 300 });
/** the far plane where the RegExp booth (then eight booths) stands, small and hazy */
const FAR: LayerSpec = { id: 'far', z: 5200, haze: 0.28, blur: 1.5 };
/** the booth row's base, placed where the insert sees it (frame upper right, under the label), and its scale: one
 *  booth reads ~70 x 90 px in the insert (sizes below are in those insert px) */
const FAR_AT = toLayer(FAR, TIGHT, 1080, 238);
const FAR_S = 0.6 / toScreen(FAR, TIGHT, 0, 0).k;
const BOOTHS = { x: FAR_AT.x, y: FAR_AT.y, w: 118 * FAR_S, h: 150 * FAR_S, pitch: 132 * FAR_S } as const;
/** booth 0 is the original; the others open out to either side of it */
const BOOTH_SLOT = [0, -1, 1, -2, 2, -3, 3, 4];

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const review = T.beat('review');
    const struck = T.beat('struck');
    const grace = T.beat('grace');
    const strike0 = struck - 0.35 * STRIKE_D - 0.06;
    const b: Beats = {
      D: T.duration,
      review,
      workers: T.beat('workers'),
      struck,
      hours: T.beat('hours'),
      grace,
      flip0: review - 0.5 * FLIP_D,
      write0: review - 0.5 * FLIP_D + 0.62 * FLIP_D - 0.2,
      unflip0: strike0 - 0.75 * FLIP_D - 0.15,
      strike0,
      drop0: struck + 0.3,
      drop1: struck + 1.25,
      rest0: grace - 0.5 * REST_D,
    };
    const others = tagsAt(ID, 'start')
      .filter((st) => st.id !== '9')
      .map((st, i) => {
        const x = st.id === '10' ? SLOT_X['10'] + X10_NUDGE : st.id === 'nano' ? SLOT_X['10'] + X10_NUDGE + NANO_DX : st.x;
        return { ...st, x, swing: 0.02, phase: i * 1.31 };
      });
    // tag 9's thread lane on the rule's face (drawTags stacks the runs in drawing order; tag 9 is drawn last)
    let lane9 = 0;
    for (const st of others) {
      const d = TAGS[st.id];
      if (d.slack || d.kind === 'question' || d.kind === 'card' || !d.strands || st.drop === undefined) continue;
      lane9 += d.strands.length;
    }
    return { tl, b, others, lane9 };
  },
  paint(f, _s, sc) {
    const { b, others } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(t, b);
    f.camera(cam);
    f.backlight({ sunX: 700, sunY: 360, intensity: 0.85 });
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 1800, 900, (cc) => {
        cc.translate(260, 100);
        searchHallWall(cc, env);
      })(c, -260, -100);
    });
    const glint = Math.sin(Math.PI * clamp01((t - b.grace + 0.05) / 0.7));
    f.fog('A');
    f.layer('L3', (c, env) => {
      drawSearchMap(f, c, env, MAP_L3, { slot: Math.floor(Math.max(0, tq) * 4) % 513, matches: 1, sweepX: 99999, key: ID, alpha: 0.4 });
    });
    f.fog({ yCenter: 0.5 * 720, height: 0.5 * 720, alpha: 0.22, drift: 5 });
    // far behind (painted over the grain, under the last haze sheet): the RegExp booth, then eight
    f.layer(FAR, (c, env) => booths(c, env, t, tq, b, glint));
    f.fog({ yCenter: 300, height: 440, alpha: 0.15, drift: 8 });

    // ---- tag 9 on twos: flip, the pencil's write, flip back, the strike, the drop
    const E = entries(cam);
    const flipU = clamp01((tq - b.flip0) / FLIP_D);
    const unflipU = clamp01((tq - b.unflip0) / FLIP_D);
    const flipped = (u: number) => (u <= 0.38 ? 0 : u >= 0.62 ? 1 : (u - 0.38) / 0.24);
    const flip = unflipU > 0 ? 1 - flipped(unflipU) : flipped(flipU);
    const writeU = clamp01((tq - b.write0) / WRITE_D);
    const pw = writeU > 0 && writeU < 1 ? hands.pencil('write', writeU, { x: AN.eye.x, y: AN.eye.y + TAG.h * 0.48 }, { scale: HS, entry: E.pencil, writeW: TAG.w * 0.62 }) : null;
    const backInk = writeU >= 1 ? 1 : pw?.stroke ?? 0;
    const sk = tagStrike(T9);
    const strikeU = clamp01((tq - b.strike0) / STRIKE_D);
    const ps = strikeU > 0 && strikeU < 1 ? hands.pencil('strike', strikeU, sk.centre, { strikeW: sk.w, strikeAngle: sk.angle, scale: HS * 1.1, entry: E.pencil }) : null;
    const strike = strikeU >= 0.47 ? 1 : ps?.stroke ?? 0;
    const restU = clamp01((tq - b.rest0) / REST_D);
    const pr = restU > 0 && restU < 1 ? hands.pencil('rest', restU, PENCIL_REST, { scale: HS * 1.3, entry: E.pencil }) : null;
    const pencilDown = restU >= 0.5;
    const kick = (t0: number, k = 0.07) => (t > t0 ? k * Math.exp(-(t - t0) * 2.2) * Math.sin((t - t0) * 9) : 0);
    const st9: TagState = {
      id: '9',
      ink: 1,
      knotIn: 1,
      sub: '',
      flip,
      back: [],
      backInk: 0,
      strike,
      drop: seg(t, b.drop0, b.drop1),
      swing: 0.018 + kick(b.review) + kick(b.struck, 0.05) + kick(b.unflip0 + 0.5 * FLIP_D, 0.04),
      phase: 0.4,
      glow: 0.12,
      subject: true,
    };
    f.layer('L4', (c, env) => {
      c.save();
      c.translate(0, DY);
      drawLine(c, env, { glow: 0.55 });
      drawRule(c, env, { labels: 1 });
      drawTags(c, env, [...others, st9], { tq, pencil: 'none' });
      if (flip < 0.5) hedgeMark(c, env, st9, tq);
      else backText(c, env, st9, tq, backInk);
      threadGlow(c, env, t, b, sc.lane9);
      pointer(c, env, t, b);
      if (pencilDown) drawPencil(c, PENCIL_REST, PENCIL_REST_ANG, 64, env);
      if (flipU > 0 && flipU < 0.92) hands.draw(c, hands.act('flip', flipU, FLIP_AT, { scale: HS, entry: { R: E.R } }), env);
      if (unflipU > 0 && unflipU < 0.92) hands.draw(c, hands.act('flip', unflipU, FLIP_AT, { scale: HS, entry: { R: E.R } }), env);
      if (pw) hands.draw(c, pw, env);
      if (ps) hands.draw(c, ps, env);
      if (pr) hands.draw(c, pr, env);
      c.restore();
    });
    f.rim({ x: 0, y: -1 });
    placeStamp(f.c, { place: '13 October 2026', date: 'the same day', style: 'mono', x: 52, y: 64, at: b.review + 0.05, fade: 0.5 }, { t, mood: f.mood, seed: 971 });
    labels(f, t, b);
  },
});

/** the frame's lower-left (narrator) and lower-right (pencil) entries, in the line's shifted L4 coordinates */
function entries(cam: Camera3) {
  const at = (sx: number, sy: number) => {
    const p = toLayer(LAYERS.L4, cam, sx, sy);
    return { x: p.x, y: p.y - DY };
  };
  return { R: at(-140, 780), pencil: at(1180, 900) };
}

/**
 * The pencilled qualifier on tag 9's front, as s03b drew it (inked, underscored): '(for the highlighter half)',
 * wrapped onto two lines inside the paper with a margin, in the tag's own frame (eyelet, swing, turn).
 */
const QUAL = ['(for the', 'highlighter half)'];
function hedgeMark(c: C2, env: PaintEnv, st: TagState, tq: number) {
  const swing = (st.swing ?? 0.025) * Math.sin(tq * 1.7 + (st.phase ?? 0));
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * clamp01(st.flip ?? 0))));
  const eye = { x: X9, y: AN.eye.y };
  c.save();
  c.translate(eye.x, eye.y);
  c.rotate(swing);
  c.scale(sx, 1);
  const fsF = 9.6;
  c.font = `${fsF}px ${FONT.fell}`;
  const lines = wrapCount(c, TAGS['9'].front, TAG.w * 0.84);
  let y = 26 + fsF * 0.8 + lines * fsF * 1.12 + fsF * 0.4 - 0.5;
  let fs = 7.4;
  c.font = `italic ${fs}px ${FONT.text}`;
  const widest = Math.max(...QUAL.map((l) => c.measureText(l).width));
  fs = Math.min(fs, (fs * (TAG.w - 2 * 4.2)) / widest);
  const pencil = mixLab('#3a3a38', env.mood.ink, 0.3);
  textRole(c, 'subject', () => {
    c.font = `italic ${fs.toFixed(2)}px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(pencil, 0.9);
    QUAL.forEach((l, i) => c.fillText(l, 0, y + i * fs * 1.08));
  });
  const wq = Math.max(...QUAL.map((l) => c.measureText(l).width));
  textProbe(c, `${ID}-qual`, -wq / 2, y - fs, wq, fs * 2.2, 0.9);
  y += fs * 1.08;
  const w = c.measureText(QUAL[1]).width;
  c.strokeStyle = withAlpha(pencil, 0.55);
  c.lineWidth = 0.9;
  c.lineCap = 'round';
  c.beginPath();
  const x0 = -w / 2, x1 = w / 2, yu = y + 2;
  c.moveTo(x0, yu);
  for (let k = 1; k <= 12; k++) c.lineTo(x0 + ((x1 - x0) * k) / 12, yu + Math.sin(k * 1.9) * 0.3);
  c.stroke();
  c.restore();
}
/** the review on tag 9's back, in red pencil, written as the pencil moves (drawn in the tag's frame, reading the
 *  right way round once the tag is turned) */
function backText(c: C2, env: PaintEnv, st: TagState, tq: number, ink: number) {
  if (ink <= 0) return;
  const swing = (st.swing ?? 0.025) * Math.sin(tq * 1.7 + (st.phase ?? 0));
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * clamp01(st.flip ?? 0))));
  c.save();
  c.translate(X9, AN.eye.y);
  c.rotate(swing);
  c.scale(sx, 1);
  textRole(c, 'subject', () => {
    const fs = 10.6;
    c.font = `italic ${fs}px ${FONT.fell}`;
    c.fillStyle = pencilRed(env, 0.95);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const lines = ['1 of 18', 'cores'];
    let budget = Math.ceil(lines.reduce((n, l) => n + l.length, 0) * clamp01(ink));
    lines.forEach((l, i) => {
      if (budget <= 0) return;
      const tw = c.measureText(l).width;
      c.fillText(l.slice(0, budget), -tw / 2, 34 + fs * 0.8 + i * fs * 1.2);
      textProbe(c, `${ID}-back-${i}`, -tw / 2, 34 + i * fs * 1.2, tw, fs, ink);
      budget -= l.length;
    });
  });
  c.restore();
}

/** tag 9's thread, lit for a moment as it lands (then a quiet glow): its drop and its short run on the rule */
function threadGlow(c: C2, env: PaintEnv, t: number, b: Beats, lane: number) {
  const g = 0.75 * seg(t, b.drop1 - 0.2, b.drop1 + 0.05) * (1 - seg(t, b.drop1 + 1.6, b.drop1 + 2.4)) + 0.32 * seg(t, b.drop1 + 1.6, b.drop1 + 2.4);
  if (g <= 0.01 || t < b.drop1 - 0.2) return;
  const bot = { x: X9, y: AN.bottom.y };
  const ry = RULE.y + 5 + lane * 2.6;
  const R = 10;
  const m = c.getTransform();
  const px = 1 / (Math.hypot(m.a, m.b) || 1);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  c.strokeStyle = withAlpha(mixLab(env.mood.core, env.mood.rim, 0.3), 0.55 * g);
  c.lineWidth = Math.max(2.6 * px, 1.4);
  c.beginPath();
  c.moveTo(bot.x, bot.y + 4);
  c.lineTo(bot.x, ry - R);
  c.quadraticCurveTo(bot.x, ry, bot.x - R, ry);
  c.lineTo(LIFE_X, ry);
  c.stroke();
  c.restore();
}

function wrapCount(c: C2, text: string, maxW: number): number {
  let n = 1, line = '';
  for (const w of text.split(' ')) {
    const tryL = line ? `${line} ${w}` : w;
    if (c.measureText(tryL).width > maxW && line) {
      n++;
      line = w;
    } else line = tryL;
  }
  return n;
}

/** a hairline copper pointer over tag 9's cut tip on the rule (between an hour and a day), once the thread lands */
function pointer(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.drop1 - 0.05, b.drop1 + 0.4);
  if (a <= 0.01) return;
  const x = LIFE_X;
  const y = RULE.y - 4;
  const m = c.getTransform();
  const px = 1 / (Math.hypot(m.a, m.b) || 1);
  c.save();
  c.globalAlpha *= a;
  const cu = mixLab(mixLab('#c27a43', env.mood.halo, 0.12), '#ffd9a8', 0.35);
  c.strokeStyle = cu;
  c.lineWidth = Math.max(1.2 * px, 0.6);
  c.beginPath();
  c.moveTo(x, y - 34);
  c.lineTo(x, y - 6);
  c.stroke();
  c.fillStyle = cu;
  c.beginPath();
  c.moveTo(x, y - 1);
  c.lineTo(x - 3.2, y - 7);
  c.lineTo(x + 3.2, y - 7);
  c.closePath();
  c.fill();
  // a small glow at the tip as it lands
  const fl = Math.exp(-Math.max(0, t - b.drop1) * 1.5);
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, RULE.y + 6, 0, x, RULE.y + 6, 18);
  g.addColorStop(0, withAlpha(cu, 0.55 * fl));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - 18, RULE.y - 12, 36, 36);
  c.restore();
}

/**
 * The far plane: the RegExp booth from s06 (small, hazy: a kiosk with a lit window, a spool winder and one shuttle,
 * the hourglass on its roof). On 'workers' the one booth opens out into eight side by side (they slide out from
 * behind it), each with its own spool winder running clean and fast on its own thread. On 'fast' all eight windows
 * glint once.
 */
function booths(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, glint: number) {
  const open = smr((t - b.workers + 0.1) / 1.3);
  const n = 8;
  const ink = env.fill('ink');
  const lit = mixLab(mixLab('#dfe9e4', env.mood.rim, 0.5), env.mood.haze, 0.25);
  for (let k = n - 1; k >= 0; k--) {
    // booth 0 stays (the original); the others slide out to its left and right
    const x = BOOTHS.x + BOOTH_SLOT[k] * BOOTHS.pitch * open;
    const a = k === 0 ? 1 : clamp01(open * 1.6);
    if (a <= 0.01) continue;
    const y = BOOTHS.y;
    const w = BOOTHS.w, h = BOOTHS.h;
    c.save();
    c.globalAlpha *= a;
    // the body with its window hole, the peaked roof, the hourglass
    const body = new Path2D();
    body.rect(x - w / 2, y - h, w, h);
    body.rect(x - w * 0.38, y - h * 0.84, w * 0.76, h * 0.62);
    c.fillStyle = ink;
    c.fill(body, 'evenodd');
    const S = FAR_S;
    c.beginPath();
    c.moveTo(x - w / 2 - 10 * S, y - h + 2 * S);
    c.lineTo(x, y - h - 24 * S);
    c.lineTo(x + w / 2 + 10 * S, y - h + 2 * S);
    c.closePath();
    c.fill();
    c.fillRect(x - 6 * S, y - h - 44 * S, 12 * S, 20 * S);
    // the window: lit paper, a worker and one spool winder (the shuttle running clean and fast, on twos)
    const wx0 = x - w * 0.38, wy0 = y - h * 0.84, ww = w * 0.76, wh = h * 0.62;
    c.fillStyle = mixLab(lit, '#ffffff', 0.35 * glint);
    c.fillRect(wx0, wy0, ww, wh);
    c.fillStyle = ink;
    c.fillRect(wx0 + ww * 0.12, wy0 + wh * 0.32, ww * 0.16, wh * 0.68);
    c.beginPath();
    c.arc(wx0 + ww * 0.2, wy0 + wh * 0.24, ww * 0.08, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(wx0 + ww * 0.74, wy0 + wh * 0.42, ww * 0.12, 0, Math.PI * 2);
    c.lineWidth = 3 * S;
    c.strokeStyle = ink;
    c.stroke();
    const speed = k === 0 && open < 0.05 ? 1.3 : 2.6;
    const sxp = wx0 + ww * (0.55 + 0.17 * Math.sin(tq * speed * Math.PI * 2 + k * 0.9));
    c.fillRect(sxp - 6 * S, wy0 + wh * 0.72, 12 * S, 5 * S);
    c.strokeStyle = withAlpha(ink, 0.7);
    c.lineWidth = 1.5 * S;
    c.beginPath();
    c.moveTo(sxp, wy0 + wh * 0.72);
    c.lineTo(wx0 + ww * 0.74, wy0 + wh * 0.42);
    c.stroke();
    c.restore();
  }
  // the glint on 'fast': a soft lift over the row of windows
  if (glint > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const span = 7 * BOOTHS.pitch * open + BOOTHS.w;
    const cx = BOOTHS.x + 0.5 * BOOTHS.pitch * open, cy = BOOTHS.y - BOOTHS.h * 0.55;
    const g = c.createRadialGradient(cx, cy, 10, cx, cy, span * 0.6);
    g.addColorStop(0, withAlpha(env.mood.core, 0.22 * glint));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(cx - span, cy - span, 2 * span, 2 * span);
    c.restore();
  }
}

/** the review label (review -> workers), then the measurement label (workers ->), top right, never both at once */
function labels(f: Frame, t: number, b: Beats) {
  const sw = textSwap(t, b.workers + 0.1, 0.35);
  const a1 = seg(t, b.review + 0.05, b.review + 0.4) * sw.out;
  const a2 = sw.in;
  const block = (lines: string[], a: number, id: string) => {
    if (a <= 0.01) return;
    const c = f.c;
    textRole(c, 'subject', () => {
      c.save();
      const size = legibleSize(c, `italic 500 24px ${FONT.text}`, 24);
      c.font = `italic 500 ${size}px ${FONT.text}`;
      const ws = lines.map((l) => c.measureText(l).width);
      const W = Math.max(...ws);
      const R = 1216;
      const lh = size * 1.3;
      const y0 = 70;
      c.globalAlpha = a;
      softPlate(c, R - W / 2, y0 - size * 0.35 + ((lines.length - 1) * lh) / 2, W + 130, lines.length * lh + 50, f.mood.ink, 0.6);
      c.fillStyle = mixLab('#e6eeea', f.mood.core, 0.2);
      c.textAlign = 'right';
      c.textBaseline = 'alphabetic';
      lines.forEach((l, i) => {
        c.fillText(l, R, y0 + i * lh);
        textProbe(c, `${id}-${i}`, R - ws[i], y0 + i * lh - size, ws[i], size * 1.2, a);
      });
      c.restore();
    });
  };
  block(['a review, the same day · 1 of 18 cores'], a1, `${ID}-review`);
  block(['RegExp in 8 workers: 1.9–6.7 ms', 'GPU: 4.5–5.2 ms back to back, 2–8× as long after a pause'], a2, `${ID}-measure`);
}

