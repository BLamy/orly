/**
 * ch15-s04 — the candle of now: the SCALE IS THE MAIN LEVER candle's wick is trimmed (tended, not snuffed); a
 * carpenter's folding ruler unfolds up the study wall below the Wall of Forecasts, doubling; then two stopwatches on
 * the desk show the trial that felt faster and ran slower. (candleAmber, the study; 21.67 s; in: cut.)
 *
 * CAMERA: SHELF (low macro on the scale candle) → a crane up and right to the ruler on the wall beneath the Wall's
 * far end, tilting up as it unfolds → on 'Yet' a pan down and left onto the desk by the lamp (two stopwatches).
 *   0.2       music only: the steady hands trim the wick with brass snuffer-scissors; the flame rises taller
 *   'candle'  a soft pool of light holds on the trimmed flame: the candle of now (no new candle, no new slot)
 *   'measure' the crane to the ruler; its label (METR's doubling, with its half-the-time threshold)
 *   'every' → 'long'  one section unfolds upward per doubling, at an even rhythm (a ×2 tick on each hinge): MINUTES,
 *             1 HOUR (brass pin · MAR 2025), 4 HOURS, 16 HOURS (brass pin · MAY 2026), then the last section reaches
 *             past the final tick and the sign UNRELIABLE ABOVE HERE swings
 *   'Yet'     the pan to the stopwatches, WITH TOOLS and WITHOUT; the trial's label; both hands sweep; the WITH TOOLS
 *             hand runs 19% further round the dial
 *   'felt'    a faint paper ghost hand fades up on the WITH TOOLS dial, stopping 20% short of where WITHOUT stopped
 *   'date'    the lamp's pool draws back a little from the stopwatches, as from an old exhibit
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { LAYERS, PUPPET_NEAR_BLACK, defineShot, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import { FONT } from '../../../film/silhouette/type';
import { hands } from '../cast';
import { handsEntry } from '../sets/narratorHands';
import { STUDY, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { shelfStateAt } from '../sets/studyState';
import { candleFlame } from '../sets/beliefCandle';
import { monotone } from '../sets/ch02-s05b-util';
import { clamp01, label15, lerp, pulse, screen, sm, tq12, win } from '../sets/ch15-s01-kit';

const ID = 'ch15-s04';
type C = CanvasRenderingContext2D;

// ===================================================================================================== geography
const V1 = shelfStateAt(ID, 'end');
const SX = candleX(V1, 'scale');
const SCALE_V = V1.find((v) => v.id === 'scale')!;
const FLAME = candleFlame({ x: SX, y: STUDY.shelf.y, view: SCALE_V, s: STUDY.shelf.s });
/** the folding ruler on the study wall under the Wall of Forecasts' far end (L4 world) */
const RULER = { x: 1836, base: 912, sec: 42, w: 32, n: 9 };
/** sections: 0 = MINUTES at the foot; each hinge above is one doubling (log scale) */
const TICKS: Record<number, string> = { 0: 'MINUTES', 4: '1 HOUR', 6: '4 HOURS', 8: '16 HOURS' };
const PINS: Record<number, string> = { 4: '1 HOUR · MAR 2025', 8: '16 HOURS · MAY 2026' };
/** the desk top plane (same depth as the near desk, but sharp: a rack focus onto the exhibit) */
const DESK: LayerSpec = { id: 'ch15DeskTop', z: 650, haze: 0, blur: 0 };
const WATCH = { y: STUDY.deskY - 2, r: 46, a: 1528, b: 1668 };

interface B {
  D: number;
  trim: number;
  candle: number;
  measure: number;
  every: number;
  long: number;
  yet: number;
  trial: number;
  felt: number;
  date: number;
  climbing: number;
  authors: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
  [k: string]: unknown;
}

/** a camera that puts a layer point p at screen point s at relative scale k */
function frameOnLayer(L: Pick<LayerSpec, 'z'>, p: { x: number; y: number }, s: { x: number; y: number }, k: number): Camera3 {
  const z = L.z - L.z / k;
  const sa = (1000 * k) / L.z;
  return { x: 640 + (640 + (p.x - 640) * k - s.x) / sa, y: 360 + (360 + (p.y - 360) * k - s.y) / sa, z, lens: 1 };
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      trim: T.beat('b1'),
      candle: T.beat('b1b'),
      measure: T.beat('b2'),
      every: T.word('L1530', 'every'),
      long: T.word('L1530', 'long'),
      yet: T.beat('b4'),
      trial: T.word('L1531', 'trial'),
      felt: T.beat('b6'),
      date: T.beat('b7'),
      climbing: T.word('L1530', 'climbing'),
      authors: T.word('L1531', 'authors'),
    };
    const K0 = frameOnLayer(LAYERS.L4, FLAME, { x: 640, y: 236 }, 1.7);
    const K1 = frameOnLayer(LAYERS.L4, FLAME, { x: 640, y: 250 }, 1.86);
    // the ruler framed to the right of the X-ray box (it stays wholly out of frame) with the study window beyond
    const K2 = frameOnLayer(LAYERS.L4, { x: RULER.x, y: RULER.base - 100 }, { x: 590, y: 420 }, 1.62);
    const K3 = frameOnLayer(LAYERS.L4, { x: RULER.x, y: RULER.base - RULER.sec * 5.4 }, { x: 600, y: 380 }, 1.3);
    // the stopwatches sit on the lower third, the trial label beneath them
    const K4 = frameOnLayer(DESK, { x: (WATCH.a + WATCH.b) / 2, y: WATCH.y - 60 }, { x: 640, y: 420 }, 2.15);
    const K5 = frameOnLayer(DESK, { x: (WATCH.a + WATCH.b) / 2 + 6, y: WATCH.y - 58 }, { x: 640, y: 422 }, 2.22);
    // slow grammar: the tilt eases from 'climbing' into 'every' (~3.5 s); the crane drifts up with the unfolding;
    // the pan to the desk leaves on 'long' and lands about 'trial'
    // the axes are staggered so the camera never swings through the near desk lamp: going up, it rises first and
    // trucks right once it is above the desk; going down to the exhibit, it trucks left first, then descends
    const tUp0 = b.climbing - 0.1, tUp1 = b.every + 0.1;
    const tDn0 = b.long - 0.25, tDn1 = b.trial + 0.45;
    const mid = (u: number) => tUp0 + (tUp1 - tUp0) * u;
    const fx = monotone([[0, K0.x], [tUp0, K1.x], [mid(0.35), K1.x + (K2.x - K1.x) * 0.08], [tUp1, K2.x], [tDn0, K3.x], [tDn0 + (tDn1 - tDn0) * 0.6, K4.x + (K3.x - K4.x) * 0.1], [tDn1, K4.x], [D, K5.x]]);
    const fy = monotone([[0, K0.y], [tUp0, K1.y], [mid(0.7), K2.y + (K1.y - K2.y) * 0.08], [tUp1, K2.y], [tDn0, K3.y], [tDn0 + (tDn1 - tDn0) * 0.35, K3.y + (K4.y - K3.y) * 0.06], [tDn1, K4.y], [D, K5.y]]);
    const fz = monotone([[0, K0.z], [tUp0, K1.z], [tUp1, K2.z], [tDn0, K3.z], [tDn1, K4.z], [D, K5.z]]);
    const cam = (t: number): Camera3 => ({ x: fx(t), y: fy(t), z: fz(t), lens: 1 });
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 40; i++) CAMS.push(cam((D * i) / 40));
    tl.hold(0, D);
    return { tl, b, cam, CAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);
    const tq = tq12(t);
    // the trim: reach in (0–.35), snip (.45), withdraw (.6–1) over 1.5 s from the beat
    const hu = clamp01((tq - b.trim) / 1.5);
    const snipped = hu >= 0.45;
    const tall = sm(clamp01((t - (b.trim + 0.7)) / 0.6));
    // ruler: sections unfold evenly from 'every' to 'long'
    const unfold = (i: number) => {
      if (i === 0) return 1;
      const step = (b.long - b.every) / 8;
      const at = b.every - 0.15 + (i - 1) * step;
      return sm(clamp01((tq - at) / 0.42));
    };
    // 'out of date': from 'authors' the lamp's pool draws back from the exhibit (down 40% over 1.5 s)
    const pool = 1 - 0.4 * win(t, b.authors, b.authors + 1.5);

    studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'duskRose', kind: 'dusk' } });
    studyCase(f, {
      shot: ID,
      when: 'end',
      key: ID,
      flames: false,
      extra: (c, env) => {
        drawRuler(c, env, t, b, unfold);
        // the hands and the snuffer-scissors at the wick
        if (hu > 0 && hu < 1) {
          const E = handsEntry(cam, 'L4');
          const wick = { x: FLAME.x + 4, y: FLAME.y + 8 };
          const out = { x: lerp(E.R.x, wick.x, 0.2), y: lerp(E.R.y, wick.y, 0.2) };
          let at = wick;
          if (hu < 0.35) at = { x: lerp(out.x, wick.x, sm(hu / 0.35)), y: lerp(out.y, wick.y, sm(hu / 0.35)) };
          else if (hu > 0.6) at = { x: lerp(wick.x, out.x, sm((hu - 0.6) / 0.4)), y: lerp(wick.y, out.y, sm((hu - 0.6) / 0.4)) };
          const arm = hands.reach(E.R, { x: at.x + 26, y: at.y + 14 }, 'pinch', 118 * 0.8, { bend: -0.2 });
          hands.draw(c, { right: arm, scale: 0.8 }, env);
          scissors(c, env, at.x, at.y, arm.angle + Math.PI, hu > 0.38 && hu < 0.5 ? 0.05 : 0.5);
        }
      },
    });
    // the live flames on the shelf; the scale flame flares up taller after the trim
    for (const v of V1) {
      if (v.state !== 'live' || v.kind === 'match') continue;
      const p = candleFlame({ x: candleX(V1, v.id), y: STUDY.shelf.y, view: v, s: STUDY.shelf.s });
      const hero = v.id === 'scale';
      const k = hero ? (snipped ? 1 + 0.35 * tall : 0.92) : 0.9;
      f.practical({ x: p.x, y: p.y + 2, kind: 'candle', seed: 300 + v.slot * 7, intensity: 0.9 * k, radius: hero ? 44 + 22 * tall : 40 });
    }
    // the candle of now: a soft pool holds on the trimmed flame (fades as the camera cranes away)
    const hold = win(t, b.candle - 0.2, b.candle + 0.6) * (1 - win(t, b.measure - 0.3, b.measure + 0.8));
    if (hold > 0.01) {
      const s = toScreen(LAYERS.L4, cam, FLAME.x, FLAME.y + 40);
      screen(f, (c) => {
        const g = c.createRadialGradient(s.x, s.y, 120, s.x, s.y, 760);
        g.addColorStop(0, withAlpha(f.mood.fg, 0));
        g.addColorStop(0.5, withAlpha(f.mood.fg, 0.32 * hold));
        g.addColorStop(1, withAlpha(f.mood.fg, 0.6 * hold));
        c.fillStyle = g;
        c.fillRect(0, 0, 1280, 720);
      });
    }
    studyNear(f, { key: ID, cams: sc.CAMS, file: true, lamp: pool });
    // at the desk, the lamp's shade throws the upper wall into shadow (the exhibit is the lit plane)
    const shade = win(t, b.yet + 0.4, b.trial + 0.6);
    if (shade > 0.01) {
      screen(f, (c) => {
        const g = c.createLinearGradient(0, 0, 0, 300);
        g.addColorStop(0, withAlpha(f.mood.fg, 0.78 * shade));
        g.addColorStop(0.55, withAlpha(f.mood.fg, 0.4 * shade));
        g.addColorStop(1, withAlpha(f.mood.fg, 0));
        c.fillStyle = g;
        c.fillRect(0, 0, 1280, 300);
      });
    }
    // the exhibit on the desk, sharp
    const showW = win(t, b.yet - 0.6, b.yet + 0.2);
    if (showW > 0) f.layer(DESK, (c, env) => {
      c.globalAlpha *= showW;
      drawWatches(c, env, t, b, pool);
    });
    screen(f, (c) => {
      const te = { t, mood: f.mood };
      // the ruler's label on a soft plate at the ruler's lower left, clear of the sign at its top
      label15(c, { text: 'METR, Mar 2025 · doubles ≈ every 7 months', sub: 'task length that agents finish half the time', x: 40, y: 500, align: 'left', at: b.measure + 0.1, until: b.long - 0.35, size: 19 }, te);
      label15(c, { text: 'METR trial, July 2025 · 19% slower · felt 20% faster', x: 640, y: 604, at: b.yet + 0.35, size: 21 }, te);
    });
  },
});

// ===================================================================================================== snuffer-scissors
function scissors(c: C, env: PaintEnv, x: number, y: number, ang: number, open: number) {
  const brass = mixLab(env.mood.rim, env.mood.halo, 0.5);
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.fillStyle = PUPPET_NEAR_BLACK;
  for (const s of [-1, 1]) {
    c.save();
    c.rotate(s * open * 0.25);
    c.fillRect(0, -1.6, 34, 3.2);
    c.beginPath();
    c.arc(38, s * 4, 5, 0, Math.PI * 2);
    c.arc(38, s * 4, 2.6, 0, Math.PI * 2, true);
    c.fill();
    c.restore();
  }
  // the little snuffer box on the blades
  c.fillRect(-4, -4, 10, 8);
  c.fillStyle = withAlpha(brass, 0.7);
  c.fillRect(-4, -4, 10, 1);
  c.restore();
}

// ===================================================================================================== the ruler
function drawRuler(c: C, env: PaintEnv, t: number, b: B, unfold: (i: number) => number) {
  const m = env.mood;
  const R = RULER;
  const card = PUPPET_NEAR_BLACK;
  const tickCol = mixLab(m.rim, '#f3e2bd', 0.35);
  // the nail at the foot
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.beginPath();
  c.arc(R.x, R.base - 6, 3.5, 0, Math.PI * 2);
  c.fill();
  // stacked sections: each swings up about its hinge at the top of the one below, in the wall's plane, like a
  // carpenter's folding ruler opening (folded = hanging back down over the section below; alternate sides)
  const brass = mixLab(m.halo, '#e8cf8f', 0.35);
  const hingeDot = (x: number, y: number) => {
    c.fillStyle = brass;
    c.beginPath();
    c.arc(x, y, 3.4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha('#fff6dc', 0.6);
    c.beginPath();
    c.arc(x - 0.9, y - 0.9, 1.2, 0, Math.PI * 2);
    c.fill();
  };
  let topY = R.base;
  for (let i = 0; i < R.n; i++) {
    const u = unfold(i);
    if (u <= 0) break;
    const hingeY = topY;
    const side = i % 2 ? 1 : -1;
    const ang = side * (1 - u) * Math.PI; // 0 = straight up; ±π = folded back down
    c.save();
    c.translate(R.x, hingeY);
    c.rotate(ang);
    c.fillStyle = card;
    c.fillRect(-R.w / 2, -R.sec, R.w, R.sec + 0.5);
    // paper-tone ticks along the left edge: ten minor, a major at the section's foot
    c.fillStyle = withAlpha(tickCol, 0.8);
    for (let k = 0; k < 10; k++) {
      const yy = -(k / 10) * R.sec;
      const w = k === 0 ? R.w * 0.62 : k === 5 ? R.w * 0.42 : R.w * 0.24;
      c.fillRect(-R.w / 2, yy - 0.6, w, 1.2);
    }
    if (i > 0) {
      c.font = `600 11px ${FONT.mono}`;
      c.textAlign = 'right';
      c.textBaseline = 'middle';
      c.fillStyle = withAlpha(tickCol, 0.7);
      c.fillText('×2', R.w / 2 - 3, -R.sec * 0.5);
    }
    // the brass hinge at this section's foot (and the next hinge at its top)
    hingeDot(0, 0);
    hingeDot(0, -R.sec);
    c.restore();
    topY = hingeY - R.sec * Math.cos(ang);
    if (u < 1) break;
  }
  // the date scale beside the ruler: one 7-month span per doubling (the even rhythm, shown not only spoken)
  {
    const open = (() => {
      let n = 0;
      for (let i = 1; i < R.n; i++) if (unfold(i) >= 0.98) n = i;
      return n;
    })();
    const dx = R.x + R.w / 2 + 6;
    c.fillStyle = withAlpha(tickCol, 0.55);
    c.fillRect(dx, R.base - open * R.sec, 1.2, open * R.sec);
    for (let i = 0; i <= open; i++) {
      const y = R.base - i * R.sec;
      c.fillStyle = withAlpha(tickCol, 0.8);
      c.fillRect(dx, y - 0.6, 7, 1.2);
      if (i < open) {
        c.font = `500 10.5px ${FONT.mono}`;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillStyle = withAlpha(tickCol, 0.62);
        c.fillText('7 mo', dx + 6, y - R.sec / 2);
      }
    }
  }
  // tick labels and the two brass pins (prop lettering, on the wall beside the ruler)
  for (const [k, txt] of Object.entries(TICKS)) {
    const i = Number(k);
    if (unfold(i) < 0.95 && i > 0) continue;
    const y = R.base - i * R.sec;
    const a = i === 0 ? 1 : win(t, 0, 1) * clamp01((unfold(i) - 0.95) * 20);
    c.save();
    c.globalAlpha *= a;
    c.fillStyle = withAlpha(tickCol, 0.9);
    c.fillRect(R.x - R.w / 2 - 12, y - 0.6, 12, 1.2);
    c.font = `500 15px ${FONT.mono}`;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    c.fillText(txt, R.x - R.w / 2 - 18, y);
    c.restore();
  }
  for (const [k, txt] of Object.entries(PINS)) {
    const i = Number(k);
    const u = clamp01((unfold(i) - 0.9) * 10);
    if (u <= 0) continue;
    const y = R.base - i * R.sec;
    const gl = pulse(t, 0, 0, 0) + 0;
    c.save();
    c.globalAlpha *= u;
    c.fillStyle = mixLab(m.halo, m.core, 0.3);
    c.beginPath();
    c.arc(R.x + R.w / 2 + 44, y, 4.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha('#ffffff', 0.5);
    c.beginPath();
    c.arc(R.x + R.w / 2 + 42.8, y - 1.3, 1.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(tickCol, 0.5);
    c.fillRect(R.x + R.w / 2 + 14, y - 0.5, 26, 1);
    c.font = `500 14px ${FONT.mono}`;
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillStyle = withAlpha(tickCol, 0.85);
    c.fillText(txt, R.x + R.w / 2 + 54, y);
    c.restore();
    void gl;
  }
  // the last section runs past 16 HOURS; the hand-lettered sign swings from it
  const last = unfold(R.n - 1);
  if (last > 0.6) {
    const y0 = R.base - (R.n - 1) * R.sec - R.sec * 0.6;
    const tt = t - (b.long - 0.1);
    const sw = tt > 0 ? 0.22 * Math.sin(tt * 4.2) * Math.exp(-tt * 0.9) : 0;
    c.save();
    c.globalAlpha *= clamp01((last - 0.6) * 3);
    c.translate(R.x - R.w / 2 - 2, y0 - 62);
    c.rotate(sw);
    c.strokeStyle = withAlpha(tickCol, 0.6);
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-14, 12);
    c.moveTo(0, 0);
    c.lineTo(-110, 12);
    c.stroke();
    c.translate(-124, -6);
    const paper = mixLab('#d9c39a', m.halo, 0.3);
    c.fillStyle = paper;
    c.fillRect(6, 18, 112, 34);
    c.fillStyle = withAlpha('#2a211b', 0.85);
    c.font = `italic 400 13px ${FONT.fell}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('UNRELIABLE', 62, 29);
    c.fillText('ABOVE HERE', 62, 43);
    c.restore();
  }
}

// ===================================================================================================== the stopwatches
/** WITHOUT stops at this angle (radians from 12 o'clock); WITH TOOLS runs 19% further; the ghost (felt) 20% short */
const A_WITHOUT = Math.PI * 1.32;
const A_WITH = A_WITHOUT * 1.19;
const A_FELT = A_WITHOUT * 0.8;

function drawWatches(c: C, env: PaintEnv, t: number, b: B, pool: number) {
  const m = env.mood;
  const start = b.trial - 0.1;
  const speed = (A_WITH * 1.0) / 2.6; // both hands run at the same rate; WITH TOOLS simply runs longer
  const run = Math.max(0, tq12(t) - start) * speed;
  const aWithout = Math.min(A_WITHOUT, run);
  const aWith = Math.min(A_WITH, run);
  const ghost = win(t, b.felt - 0.1, b.felt + 0.7);
  // a sharp sliver of desk top under them
  c.fillStyle = mixLab(m.set, m.fg, 0.35);
  c.fillRect(WATCH.a - 140, WATCH.y, WATCH.b - WATCH.a + 280, 6);
  c.fillStyle = withAlpha(m.rim, 0.35 * pool);
  c.fillRect(WATCH.a - 140, WATCH.y, WATCH.b - WATCH.a + 280, 1);
  watch(c, env, WATCH.a, 'WITHOUT', aWithout, 0, pool);
  watch(c, env, WATCH.b, 'WITH TOOLS', aWith, ghost, pool);
  // the lamp's pool drawing back: the exhibit settles into shade
  const back = 1 - pool;
  if (back > 0.01) {
    const cx = (WATCH.a + WATCH.b) / 2, cy = WATCH.y - 60;
    const g = c.createRadialGradient(cx, cy, 20, cx, cy, 260);
    g.addColorStop(0, withAlpha(m.fg, 0.55 * back / 0.4));
    g.addColorStop(1, withAlpha(m.fg, 0));
    c.fillStyle = g;
    c.fillRect(cx - 260, cy - 260, 520, 520);
  }
}

function watch(c: C, env: PaintEnv, x: number, name: string, ang: number, ghost: number, pool: number) {
  const m = env.mood;
  const r = WATCH.r;
  const cy = WATCH.y - 14 - r;
  const ink = PUPPET_NEAR_BLACK;
  const face = mixLab(mixLab('#e6d6b4', m.halo, 0.25), m.set, 0.25 + 0.35 * (1 - pool));
  // the stand foot, the case, the crown and the start button
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(x - 26, WATCH.y);
  c.lineTo(x - 12, cy + r - 2);
  c.lineTo(x + 12, cy + r - 2);
  c.lineTo(x + 26, WATCH.y);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(x, cy, r + 6, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - 6, cy - r - 18, 12, 14);
  c.fillRect(x - 10, cy - r - 24, 20, 7);
  c.save();
  c.translate(x, cy);
  c.rotate(-0.6);
  c.fillRect(-4, -r - 14, 8, 10);
  c.restore();
  // the brass bezel catching the lamp (from the right)
  c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), 0.8 * pool);
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(x, cy, r + 4, -Math.PI * 0.45, Math.PI * 0.25);
  c.stroke();
  // the dial
  c.fillStyle = face;
  c.beginPath();
  c.arc(x, cy, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha('#2a211b', 0.8);
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2;
    const L = k % 5 === 0 ? 7 : 3.5;
    c.save();
    c.translate(x, cy);
    c.rotate(a);
    c.fillRect(-0.6, -r + 3, 1.2, L);
    c.restore();
  }
  // the ghost hand (what they felt): translucent paper, shorter run
  if (ghost > 0.01) {
    c.save();
    c.globalAlpha *= 0.85 * ghost;
    c.translate(x, cy);
    c.rotate(A_FELT);
    c.fillStyle = mixLab('#fbf3df', m.halo, 0.2);
    c.beginPath();
    c.moveTo(-1.2, 4);
    c.lineTo(-1.2, -r + 17);
    c.lineTo(-4.4, -r + 17);
    c.lineTo(0, -r + 4);
    c.lineTo(4.4, -r + 17);
    c.lineTo(1.2, -r + 17);
    c.lineTo(1.2, 4);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha('#7a5a30', 0.6);
    c.lineWidth = 0.8;
    c.setLineDash([2, 2]);
    c.stroke();
    c.restore();
    // the gap between belief and fact: a faint arc from the ghost to the real hand
    c.save();
    c.strokeStyle = withAlpha('#7a5a30', 0.7 * ghost);
    c.lineWidth = 3;
    c.beginPath();
    c.arc(x, cy, r * 0.62, A_FELT - Math.PI / 2, ang - Math.PI / 2);
    c.stroke();
    c.restore();
  }
  // the real hand: a slim shaft ending in a heavy arrowhead at the pointer end; only a small disc behind the pivot
  c.save();
  c.translate(x, cy);
  c.rotate(ang);
  c.fillStyle = ink;
  c.fillRect(-1.1, -r + 15, 2.2, r - 7);
  c.beginPath();
  c.moveTo(0, -r + 3);
  c.lineTo(-4.6, -r + 17);
  c.lineTo(4.6, -r + 17);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(0, 0, 3.2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(0, 9, 2.2, 0, Math.PI * 2);
  c.fill();
  c.fillRect(-0.8, 0, 1.6, 9);
  c.restore();
  // the plaque beneath (prop lettering)
  c.fillStyle = mixLab(m.halo, m.set, 0.35 + 0.3 * (1 - pool));
  c.fillRect(x - 46, WATCH.y - 10, 92, 15);
  c.fillStyle = withAlpha('#1a1310', 0.9);
  c.font = `600 10.5px ${FONT.mono}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(name, x, WATCH.y - 2.5);
  void toLayer;
}
