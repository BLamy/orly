/**
 * ch04-s03 — THE SECOND RAMP AND THE LEVER (scene, parchment; cut from ch04-s02 on the same framing; 14.0 s).
 * L0405 "A second ramp wakes at five. Take it from the first."
 * L0406 "Nought up to four, one from five: a bit. Whole numbers sit on the corners: the whole trick, and the whole caveat."
 *
 * Same backlit workbench (sets/ch04-s02-workbench). Machine 1 completes.
 * TEACHES, word by word (every value COMPUTED with rampBench's FP32 maths):
 *   'second'   (beat second) board two rises behind board one in silhouette, its corner one step later at 5; the
 *              card swaps to max(0, a − 5) → 0 · 0 · 0 · 1 · 95; quick pale reading bars run along the five stops
 *              while the ledger's second row inks 0, 0, 0, 1, 95
 *   'Take'     (beat lever) the lever is tied to the boards (review r1): a dark string carries board one's height at the
 *              marble, a pale string board two's, level to the two ends of a short beam whose tilt is the difference
 *              (needle over a 0-1 scale): one string rises from 4, the other from 5, and the beam stops at 1;
 *              the ledger's third row inks the differences 0, 0, 1, 1, 1
 *   'Nought'   (beat path) the marble (already rolled back to 2) rolls 2 → 6; a copper pen above it draws its path in
 *              glowing copper through the haze: flat along 0 to 4, a straight climb from 4 to 5, flat along 1; the
 *              lever's needle follows it live; the card swaps to above4 = max(0, a − 4) − max(0, a − 5) = clamp(a − 4, 0, 1)
 *   'corners'  (beat corners) two copper rings drop onto the path's corners at 4 and 5; cut dots mark 2 3 4 5 6 on the
 *              flats and corners, never on the slope
 *   'caveat'   (beat caveat) the slope between 4 and 5 is hatched in red pencil (on the path and on board one). Hold.
 *   (r1)       both boards share one baseline (board two a step back, not raised); after 'Nought' the ledger steps
 *              back (paper ~85 %, warm-grey ink) so the copper path and the card lead
 * Camera: from ch04-s02's push-in, eases back over 2.9 s (the second board rises, the card held in the safe area),
 * then a slow push toward the path.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, cam3Interp, cardInkAlpha, defineShot, legibleSize, mixLab, textRole, textSwap, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf } from '../sets/narratorHands';
import { RB } from '../sets/rampBench';
import { HATCH, WB, WB_CAM, benchNear, benchRoom, benchTop, ledger, marble, numberRule, readingBar, rig } from '../sets/ch04-s02-workbench';

const ID = 'ch04-s03';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

/** the start (ch04-s02's end) and end framing (ch04-s04 cuts on motion from here) */
const CH04_S02_END: Camera3 = { ...WB_CAM.s02End };
const CH04_S03_WIDE: Camera3 = { ...WB_CAM.s03Wide };
const CH04_S03_END: Camera3 = { ...WB_CAM.s03End };

/** the path graph: height 0 at y0, height 1 at y0 − U (the boards' own slope, so the climb is parallel to them) */
const PATH = { y0: 372, a0: 2, a1: 6 } as const;
/** review r1: the lever reads the two boards: a dark string carries board one's height at the marble across to one end
 *  of a short beam, a pale string carries board two's to the other end; the beam's tilt IS the difference */
const LINK = { x0: 986, x1: 1104, scaleR: 40 } as const;
const pathY = (a: number) => PATH.y0 - RB.above4(a) * WB.U;

interface Beats {
  second: number;
  twoCells: number[];
  lever: number;
  leverCells: number[];
  back: [number, number];
  path: number;
  /** marble a-keys for the 2 → 6 roll */
  roll: [number, number][];
  corners: number;
  dots: number[];
  caveat: number;
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const second = T.beat('second');
    const lever = T.beat('lever');
    const path = T.beat('path');
    const corners = T.beat('corners');
    const b: Beats = {
      second,
      twoCells: [0, 1, 2, 3, 4].map((i) => second + 0.55 + i * 0.26),
      lever,
      leverCells: [0, 1, 2, 3, 4].map((i) => lever + 0.3 + i * 0.22),
      back: [lever + 0.95, path - 0.08],
      path,
      roll: [
        [path, 2],
        [T.word('L0406', 'four') + 0.2, 4],
        [T.word('L0406', 'five') + 0.08, 5],
        [T.word('L0406', 'bit') + 0.1, 6],
      ],
      corners,
      dots: [0, 1, 2, 3, 4].map((i) => corners + 0.35 + i * 0.2),
      caveat: T.beat('caveat'),
    };
    // review r1: from ch04-s02's push-in, ease back to reveal the second board rising, then a slow push toward the path
    const cam = tl.channel<Camera3>('cam', CH04_S02_END, cam3Interp);
    tl.tween(cam, CH04_S03_WIDE, { at: 0.1, dur: 2.9, ease: ease.move });
    tl.tween(cam, CH04_S03_END, { at: 3.2, dur: D - 3.4, ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b, D };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    f.camera(s.get(scene.cam));
    benchRoom(f, { key: ID, lamp: 0.5 });

    const a = marbleA(tq, b);
    const two = win(tq, b.second - 0.15, b.second + 0.85);
    const leverIn = win(tq, b.lever - 0.3, b.lever + 0.35);
    // review r1: the caveat hatch is laid stroke by stroke in 0.4 s from caveat − 0.15
    const hatchU = clamp01((t - (b.caveat - 0.15)) / 0.4);
    const dim = win(t, b.path + 0.3, b.path + 1.1);

    f.layer('L4', (c, env) => {
      f.cached(`ch04wb/bench/${env.mood.id}`, 2400, 700, (cc) => {
        cc.translate(500, -WB.BY + 20);
        benchTop(cc, env);
      })(c, -500, WB.BY - 20);
      numberRule(c, env, { show: 1, far: 1 });
      rig(c, env, { two, lever: 0, hatch: hatchU });
      // board two's quick readings along the five stops (pale bars), as its ledger row inks
      b.twoCells.forEach((tc, i) => {
        const on = win(t, tc - 0.12, tc) * (1 - win(t, tc + 0.18, tc + 0.4));
        if (on > 0) readingBar(c, env, 1, WB.STOPS[i], win(t, tc - 0.12, tc + 0.1), on, 10);
      });
      ledger(c, env, {
        id: `${ID}-ledger`,
        paper: 1,
        head: 1,
        rows: [
          { kind: 'ramp4', cells: [1, 1, 1, 1, 1] },
          { kind: 'ramp5', cells: b.twoCells.map((tc) => win(t, tc, tc + 0.22)) },
          { kind: 'lever', cells: b.leverCells.map((tc) => win(t, tc, tc + 0.22)) },
        ],
        col: null,
        dim,
      });
      // the lever: the linkage on the two boards at the marble (drawn over the boards, under the path)
      linkage(c, env, a, leverIn);
      // the copper path, its pen, its plumb line to the marble, the rings and the dots
      copperPath(c, env, t, a, b);
      marble(c, env, WB.xOf(a), WB.BY - WB.MARBLE_R, WB.MARBLE_R, (WB.xOf(a) - WB.xOf(4)) / WB.MARBLE_R);
    });
    f.rim({ x: 0, y: -1 });

    // the card: max(0, a − 4) → (second) max(0, a − 5) row → (path) the clamp formula; no ghost text
    const sw1 = textSwap(t, b.second);
    const sw2 = textSwap(t, b.path);
    benchNear(f, {
      key: ID,
      card: {
        id: `${ID}-card`,
        paper: 1,
        width: 0,
        keepIn: true,
        texts: [
          { lines: ['max(0, a − 4)'], ink: sw1.out },
          { lines: ['max(0, a − 5)', '→ 0 · 0 · 0 · 1 · 95'], ink: Math.min(sw1.in, sw2.out) },
          { lines: ['above4 =', 'max(0, a − 4) − max(0, a − 5)', '= clamp(a − 4, 0, 1)'], ink: sw2.in },
        ],
      },
    });
    void cardInkAlpha;
  },
});

// ---------------------------------------------------------------- the marble (pure, on twos)
function marbleA(tq: number, b: Beats): number {
  if (tq < b.back[0]) return 4;
  if (tq < b.path) return lerp(4, 2, sm((tq - b.back[0]) / (b.back[1] - b.back[0])));
  const k = b.roll;
  for (let i = 0; i < k.length - 1; i++) {
    const [t0, a0] = k[i];
    const [t1, a1] = k[i + 1];
    if (tq < t1) {
      const u = (tq - t0) / (t1 - t0);
      // a steady roll with soft ends at the first and last key only
      const e = i === 0 ? u * u * (2 - u) * 0.5 + u * 0.5 : i === k.length - 2 ? 1 - (1 - u) * (1 - u) * 0.5 - (1 - u) * 0.5 : u;
      return lerp(a0, a1, clamp01(e));
    }
  }
  return k[k.length - 1][1];
}

// ---------------------------------------------------------------- the copper path
function copperPath(c: C, env: PaintEnv, t: number, a: number, b: Beats) {
  if (t < b.path - 0.25) return;
  const show = win(t, b.path - 0.25, b.path + 0.1);
  const drawn = t < b.path ? PATH.a0 : Math.max(PATH.a0, a);
  const x = (v: number) => WB.xOf(v);
  const pts: [number, number][] = [];
  const knots = [PATH.a0, 4, 5, PATH.a1].filter((v) => v < drawn);
  for (const v of knots) pts.push([x(v), pathY(v)]);
  pts.push([x(drawn), pathY(drawn)]);
  c.save();
  c.globalAlpha *= show;
  // the 0 and 1 levels: faint ink guides with their numerals at the left (what the flats are)
  c.strokeStyle = withAlpha(mixLab('#22180f', env.mood.ink, 0.25), 0.28);
  c.lineWidth = 1;
  c.setLineDash([3, 5]);
  c.beginPath();
  for (const h of [0, 1]) {
    c.moveTo(x(PATH.a0) - 6, PATH.y0 - h * WB.U);
    c.lineTo(x(PATH.a1) + 6, PATH.y0 - h * WB.U);
  }
  c.stroke();
  c.setLineDash([]);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 21px ${FONT.mono}`, 21);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.fillStyle = withAlpha(mixLab('#22180f', env.mood.ink, 0.25), 0.9);
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    c.fillText('0', x(PATH.a0) - 14, PATH.y0);
    c.fillText('1', x(PATH.a0) - 14, PATH.y0 - WB.U);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
  });
  // the path: a near-black underlay, then glowing copper
  const stroke = (w: number, col: string) => {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.beginPath();
    pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
    c.stroke();
  };
  stroke(7.5, withAlpha(PUPPET_NEAR_BLACK, 0.9));
  c.save();
  c.shadowColor = withAlpha(mixLab(copperOf(env, 1), env.mood.core, 0.4), 0.8);
  c.shadowBlur = 10;
  stroke(4.2, copperOf(env, 0.75));
  c.restore();
  stroke(1.2, withAlpha(mixLab(copperOf(env, 1), '#fff4dc', 0.4), 0.9));
  // the red pencil hatch on the slope (4 → 5) at 'caveat'
  // review r1: the WHOLE copper slope from 4 to 5 is hatched, 9 strokes at 45° (2 px, muted brick #8a3b2e at 75 %),
  // laid one by one in 0.4 s from caveat − 0.15; desaturated so the copper stays the one accent
  const hatchU = clamp01((t - (b.caveat - 0.15)) / 0.4);
  if (hatchU > 0) {
    c.strokeStyle = withAlpha(HATCH.col, HATCH.alpha);
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    const n = HATCH.n;
    for (let i = 0; i < n; i++) {
      const k = clamp01(hatchU * n - i);
      if (k <= 0) break;
      const v = 4 + (i + 0.5) / n;
      const px = x(v), py = pathY(v);
      c.moveTo(px - 10, py - 10);
      c.lineTo(px - 10 + 20 * k, py - 10 + 20 * k);
    }
    c.stroke();
  }
  // the pen and its plumb line down to the marble (while it rolls)
  const penOn = t < b.roll[b.roll.length - 1][0] + 0.6 ? 1 : 1 - win(t, b.roll[b.roll.length - 1][0] + 0.6, b.roll[b.roll.length - 1][0] + 1.2);
  if (penOn > 0 && t >= b.path - 0.2) {
    const px = x(drawn), py = pathY(drawn);
    c.save();
    c.globalAlpha *= penOn;
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.2), 0.55);
    c.setLineDash([3, 4]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(px, py + 8);
    c.lineTo(px, WB.BY - 2 * WB.MARBLE_R);
    c.stroke();
    c.setLineDash([]);
    const g = c.createRadialGradient(px, py, 1, px, py, 22);
    g.addColorStop(0, withAlpha(mixLab(copperOf(env, 1), env.mood.core, 0.6), 0.9));
    g.addColorStop(1, withAlpha(copperOf(env, 0.6), 0));
    c.fillStyle = g;
    c.fillRect(px - 24, py - 24, 48, 48);
    c.restore();
  }
  // the copper rings on the corners (drop and settle on twos)
  [4, 5].forEach((v, i) => {
    const at = b.corners - 0.2 + i * 0.22;
    const u = q2(t) - at;
    if (u < 0) return;
    const fall = u < 0.3 ? (1 - (u / 0.3) ** 2) * 46 : u < 0.42 ? Math.sin(((u - 0.3) / 0.12) * Math.PI) * 4 : 0;
    const px = x(v), py = pathY(v) - fall;
    c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.9);
    c.lineWidth = 6;
    c.beginPath();
    c.arc(px, py, 11, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = copperOf(env, 0.85);
    c.lineWidth = 3.4;
    c.stroke();
  });
  // the cut dots at the whole numbers: on the flats and the corners, never on the slope
  [2, 3, 4, 5, 6].forEach((v, i) => {
    const k = win(t, b.dots[i] - 0.1, b.dots[i] + 0.1);
    if (k <= 0) return;
    const px = x(v), py = pathY(v);
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, k);
    c.beginPath();
    c.arc(px, py, 5.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(mixLab('#fff1d2', env.mood.core, 0.3), k);
    c.beginPath();
    c.arc(px, py, 2.4, 0, Math.PI * 2);
    c.fill();
  });
  c.restore();
}

// ---------------------------------------------------------------- the lever (review r1): strings from the two boards
/**
 * Two strings ride with the marble: a dark one leaves board one's surface at the marble's x, a pale one (one value step
 * back, like its board) leaves board two's; each runs level to one end of a short black beam right of the boards, so
 * the beam's ends sit at the two heights and its tilt is exactly their difference: level from 2 to 4 (both boards
 * flat), tipping as board one alone climbs from 4 to 5, then holding its tilt from 5 on as both rise together. A needle
 * stands square on the beam over a small 0-to-1 scale (the same dial language as the lever above the tray in ch04-s04).
 */
function linkage(c: C, env: PaintEnv, a: number, show: number) {
  if (show <= 0) return;
  const xm = WB.xOf(a);
  const y1 = WB.boardTop(0, a);
  const y2 = WB.boardTop(1, a);
  const A = { x: LINK.x0, y: y1 };
  const B = { x: LINK.x1, y: y2 };
  const C0 = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const th = Math.atan2(B.y - A.y, B.x - A.x);
  const th1 = Math.atan2(WB.U, LINK.x1 - LINK.x0);
  const ink = PUPPET_NEAR_BLACK;
  const pale = mixLab(ink, env.mood.set, 0.38);
  const rim = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.75);
  c.save();
  c.globalAlpha *= sm(show);
  c.lineCap = 'round';
  // the strings: drawn on from the marble's x toward the beam as the lever arrives
  const reach = sm(show);
  const string = (y: number, x1: number, col: string, w: number) => {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.setLineDash([7, 4]);
    c.beginPath();
    c.moveTo(xm, y);
    c.lineTo(xm + (x1 - xm) * reach, y);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = col;
    c.beginPath();
    c.arc(xm, y, 5, 0, Math.PI * 2);
    c.fill();
  };
  string(y2, B.x, pale, 2.2);
  string(y1, A.x, ink, 2.4);
  c.translate(0, (1 - sm(show)) * 26);
  // the 0-to-1 scale, square to the level (it rides with the beam's centre)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.85);
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(C0.x, C0.y, LINK.scaleR, -Math.PI / 2, -Math.PI / 2 + th1);
  for (const q of [-Math.PI / 2, -Math.PI / 2 + th1]) {
    c.moveTo(C0.x + Math.cos(q) * (LINK.scaleR - 6), C0.y + Math.sin(q) * (LINK.scaleR - 6));
    c.lineTo(C0.x + Math.cos(q) * (LINK.scaleR + 6), C0.y + Math.sin(q) * (LINK.scaleR + 6));
  }
  c.stroke();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 21px ${FONT.mono}`, 21);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.2), 0.95);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const qs: [number, string][] = [[-Math.PI / 2, '0'], [-Math.PI / 2 + th1, '1']];
    for (const [q, l] of qs) c.fillText(l, C0.x + Math.cos(q) * (LINK.scaleR + 18), C0.y + Math.sin(q) * (LINK.scaleR + 18));
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
  });
  // the beam (a little proud of both string ends)
  const ext = 12;
  const ux = Math.cos(th), uy = Math.sin(th);
  c.strokeStyle = ink;
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(A.x - ux * ext, A.y - uy * ext);
  c.lineTo(B.x + ux * ext, B.y + uy * ext);
  c.stroke();
  c.strokeStyle = rim;
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(A.x - ux * ext, A.y - uy * ext - 3.2);
  c.lineTo(B.x + ux * ext, B.y + uy * ext - 3.2);
  c.stroke();
  // the needle, square to the beam
  const nq = th - Math.PI / 2;
  c.strokeStyle = ink;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(C0.x, C0.y);
  c.lineTo(C0.x + Math.cos(nq) * (LINK.scaleR + 3), C0.y + Math.sin(nq) * (LINK.scaleR + 3));
  c.stroke();
  for (const [p, col] of [[A, ink], [B, pale], [C0, ink]] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(p.x, p.y, 5, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = copperOf(env, 0.3);
  c.beginPath();
  c.arc(C0.x, C0.y, 1.8, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
