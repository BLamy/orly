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
import { LAYERS, PUPPET_NEAR_BLACK, defineShot, makeCanvas, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import { FONT, textRole } from '../../../film/silhouette/type';
import { hands } from '../cast';
import { handsEntry } from '../sets/narratorHands';
import { STUDY, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { SLOTS, boardStateAt, shelfStateAt } from '../sets/studyState';
import { WALL_SLOTS } from '../sets/wallOfForecasts';
import { DEFAULT_POOL, caseBoard } from '../sets/caseBoard';
import { candleFlame } from '../sets/beliefCandle';
import { monotone } from '../sets/ch02-s05b-util';
import { clamp01, label15, lerp, screen, sm, tq12, win } from '../sets/ch15-s01-kit';
import { RULER, drawFoldingRuler } from '../sets/ch15-s04-ruler';
import { XRAY, XRAY_GLYPH_WARM, XRAY_REST } from '../sets/xrayColumn';

const ID = 'ch15-s04';
type C = CanvasRenderingContext2D;

// ===================================================================================================== geography
const V1 = shelfStateAt(ID, 'end');
const SX = candleX(V1, 'scale');
const SCALE_V = V1.find((v) => v.id === 'scale')!;
const FLAME = candleFlame({ x: SX, y: STUDY.shelf.y, view: SCALE_V, s: STUDY.shelf.s });
/** the desk top plane (same depth as the near desk, but sharp: a rack focus onto the exhibit) */
const DESK: LayerSpec = { id: 'ch15DeskTop', z: 650, haze: 0, blur: 0 };
const WATCH = { y: STUDY.deskY - 2, r: 46, a: 1528, b: 1668 };

interface B {
  D: number;
  trim: number;
  candle: number;
  measure: number;
  every: number;
  /** the last section (16 HOURS pin) opens on 'twice'; the sign swings on 'long' */
  twice: number;
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
      twice: T.word('L1530', 'twice'),
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
    // 'measure': a TILT UP from the trimmed flame to the ruler beside the Wall. Review round 1 (composition): trucked
    // right ~200 px and pushed in ~12% so the ruler and its tick lettering sit on the centre-right third (the ruler at
    // x ~700, its labels running right to ~1030) and the hardware cabinet and the chat box fall off the frame's left;
    // as it unfolds it fills about 85% of the frame height
    const K2 = frameOnLayer(LAYERS.L4, { x: RULER.x, y: RULER.base }, { x: 702, y: 640 }, 1.46);
    const K3 = frameOnLayer(LAYERS.L4, { x: RULER.x, y: RULER.base }, { x: 694, y: 652 }, 1.49);
    // the stopwatches sit on the lower third, the trial label beneath them
    const K4 = frameOnLayer(DESK, { x: (WATCH.a + WATCH.b) / 2, y: WATCH.y - 60 }, { x: 640, y: 420 }, 2.15);
    const K5 = frameOnLayer(DESK, { x: (WATCH.a + WATCH.b) / 2 + 6, y: WATCH.y - 58 }, { x: 640, y: 422 }, 2.22);
    // the tilt runs from just before 'measure' for ~2.5 s; the ruler then holds while it unfolds (a slow drift);
    // the pan to the desk leaves after 'long' (the sign has swung) and lands about 'trial'. Going down to the
    // exhibit it trucks left first, then descends, so the camera never swings through the near desk lamp.
    const tUp0 = b.measure - 0.2, tUp1 = b.measure + 2.4;
    const tDn0 = b.long + 0.3, tDn1 = b.trial + 0.45;
    const fx = monotone([[0, K0.x], [tUp0, K1.x], [tUp1, K2.x], [tDn0, K3.x], [tDn0 + (tDn1 - tDn0) * 0.6, K4.x + (K3.x - K4.x) * 0.1], [tDn1, K4.x], [D, K5.x]]);
    const fy = monotone([[0, K0.y], [tUp0, K1.y], [tUp1, K2.y], [tDn0, K3.y], [tDn0 + (tDn1 - tDn0) * 0.35, K3.y + (K4.y - K3.y) * 0.06], [tDn1, K4.y], [D, K5.y]]);
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
    // ruler: an even pluck, one section every ~0.73 s from 'every' (section 1 open on 'every') to 'twice'
    // (section 8, with the 16 HOURS pin, open on 'twice'); the sign drops and swings on 'long'
    const unfold = (i: number) => {
      if (i === 0) return 1;
      const step = (b.twice - b.every) / 7;
      const done = b.every + (i - 1) * step;
      return sm(clamp01((tq - (done - 0.4)) / 0.4));
    };
    // 'out of date': from just before 'date' the lamp's pool draws back from the exhibit (radius and light ~30%)
    const pool = 1 - 0.3 * sm(clamp01((t - (b.date - 0.22)) / 1.2));

    studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'duskRose', kind: 'dusk' } });
    // the case board above the shelf (only its lowest cards graze the top of the opening frames): its pinned slips are
    // set texture here, not the subject (review round 2: the 1943 slip's 'TIME.' read as a label)
    f.layer('L4', (c, env) => {
      textRole(c, 'texture', () => {
        const pool = STUDY.pool;
        caseBoard(c, { ...STUDY.board, state: boardStateAt(ID, 'end'), pool: { ...DEFAULT_POOL, ...pool, cx: pool.cx - STUDY.board.x, cy: pool.cy - STUDY.board.y } }, env);
      });
      // review round 1: while the ruler is the subject the chat box's cyan is no accent (desaturated, ≤ 50 %)
      chatBoxMute(c, env, win(t, b.measure - 0.6, b.measure) * (1 - win(t, b.yet, b.yet + 0.6)));
    });
    studyCase(f, {
      shot: ID,
      when: 'end',
      key: ID,
      board: false,
      flames: false,
      // HAND-OFF (round 3): the X-ray cabinet subject rule through the study set, 5.5-12 s: the face rests at 60 %
      // (XRAY_REST), no slot lifts in this shot, desaturated; the glyph rows warm grey (XRAY_GLYPH_WARM, #cfc6b0)
      xray: { dim: XRAY_REST },
      extra: (c, env) => {
        xraySubjectTone(c);
        // the foot's lettering sets in on 'measure'; at the desk the lamp shade's shadow takes the wall's light
        const deskShade = win(t, b.yet + 0.4, b.trial + 0.6);
        drawFoldingRuler(c, env, { t, unfold, signAt: b.long, foot: win(t, b.measure, b.measure + 0.5), lit: 1 - deskShade });
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
        g.addColorStop(0, withAlpha(f.mood.fg, 0.9 * shade));
        g.addColorStop(0.55, withAlpha(f.mood.fg, 0.5 * shade));
        g.addColorStop(1, withAlpha(f.mood.fg, 0));
        c.fillStyle = g;
        c.fillRect(0, 0, 1280, 300);
      });
    }
    // review round 1: the Wall's KRIZHEVSKY slip beside the ruler sits back (haze ~40 %, ~1.5 px blur) from 'measure'
    // to 'Yet', so its lettering never competes with the ruler's
    const slipK = win(t, b.measure - 0.3, b.measure + 0.3) * (1 - win(t, b.yet - 0.2, b.yet + 0.4));
    if (slipK > 0.003) {
      const w4 = WALL_SLOTS.W4, k = STUDY.wall.k;
      const cx = STUDY.wall.x + w4.x * k, cy = STUDY.wall.y + w4.y * k;
      const a = toScreen(LAYERS.L4, cam, cx - (w4.w / 2) * k - 14, cy - (w4.h / 2) * k - 22);
      const z = toScreen(LAYERS.L4, cam, cx + (w4.w / 2) * k + 14, cy + (w4.h / 2) * k + 14);
      sitBack(f, a.x, a.y, z.x - a.x, z.y - a.y, 1.5 * slipK, mixLab(f.mood.set, f.mood.haze, 0.45), 0.4 * slipK);
    }
    // review round 1: behind the stopwatches the candle shelf drops a stop (blur ~1.5 px, haze 0.45), so its sleeves'
    // lettering never stands between the dials; the exhibit itself is painted sharp after it
    const dropK = win(t, b.yet - 0.5, b.yet + 0.3);
    if (dropK > 0.003) sitBack(f, 0, 0, 1280, 720, 1.5 * dropK, mixLab(f.mood.fg, f.mood.haze, 0.35), 0.45 * dropK);
    // the exhibit on the desk, sharp
    const showW = win(t, b.yet - 0.6, b.yet + 0.2);
    if (showW > 0) f.layer(DESK, (c, env) => {
      c.globalAlpha *= showW;
      drawWatches(c, env, t, b, pool);
    });
    screen(f, (c) => {
      const te = { t, mood: f.mood };
      // the ruler's label at the frame's lower left, on an evenly feathered plate (it sits over the board's foot)
      const ra = win(t, b.measure + 0.1, b.measure + 0.6) * (1 - win(t, b.long + 0.25, b.long + 0.75));
      if (ra > 0.003) evenPlate(c, 24, 548, 560, 82, f.mood.ink, 0.78 * ra);
      label15(c, { text: 'METR, Mar 2025 · doubles ≈ every 7 months', sub: 'task length that agents finish half the time', x: 44, y: 578, align: 'left', at: b.measure + 0.1, until: b.long + 0.25, size: 19 }, te);
      label15(c, { text: 'METR trial, July 2025 · 19% slower · felt 20% faster', x: 640, y: 604, at: b.yet + 0.35, size: 21 }, te);
    });
  },
});

/** the chat box's slot (board units → world), muted: its cyan pulled to grey and half its light taken */
function chatBoxMute(c: C, _env: PaintEnv, k: number) {
  if (k <= 0.003) return;
  const O = SLOTS.O;
  const x = STUDY.board.x + (O.x - O.w / 2 - 14) * STUDY.board.k, y = STUDY.board.y + (O.y - O.h / 2 - 14) * STUDY.board.k;
  const w = (O.w + 28) * STUDY.board.k, h = (O.h + 28) * STUDY.board.k;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = `rgba(128,128,128,${(0.85 * k).toFixed(3)})`;
  c.fillRect(x, y, w, h);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = `rgba(128,112,96,${(0.6 * k).toFixed(3)})`;
  c.fillRect(x, y, w, h);
  c.restore();
}

/** a screen region sits back: blurred by px and hazed toward col by alpha (one copy, device pixels) */
let sbx: HTMLCanvasElement | null = null;
function sitBack(f: Frame, x: number, y: number, w: number, h: number, px: number, col: string, alpha: number) {
  const s = f.pxScale;
  const X = Math.max(0, Math.floor(x * s)), Y = Math.max(0, Math.floor(y * s));
  const W = Math.min(f.c.canvas.width - X, Math.ceil(w * s)), H = Math.min(f.c.canvas.height - Y, Math.ceil(h * s));
  if (W <= 2 || H <= 2) return;
  if (!sbx || sbx.width < W || sbx.height < H) sbx = makeCanvas(Math.max(W, sbx?.width ?? 0), Math.max(H, sbx?.height ?? 0));
  const g = sbx.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'copy';
  g.filter = `blur(${(px * s).toFixed(2)}px)`;
  g.drawImage(f.c.canvas, X, Y, W, H, 0, 0, W, H);
  g.filter = 'none';
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = withAlpha(col, alpha);
  g.fillRect(0, 0, W, H);
  const c = f.c;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.drawImage(sbx, 0, 0, W, H, X, Y, W, H);
  c.restore();
}

/** the cabinet beside the ruler fills ~14 % of the frame here (under the kit's 25 % subject threshold), so the subject
 *  rule's tone is applied explicitly over its vellum window: chroma pulled down again and the light glyph strokes
 *  warmed toward warm grey (#cfc6b0), so it never reads as a cyan UI screen next to the warm ruler */
function xraySubjectTone(c: C) {
  const s = STUDY.xray.s;
  c.save();
  c.translate(STUDY.xray.x, STUDY.xray.y);
  c.scale(s, s);
  c.beginPath();
  c.rect(-XRAY.w / 2, -XRAY.h, XRAY.w, XRAY.h);
  c.clip();
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = 'rgba(128,128,128,0.55)';
  c.fillRect(-XRAY.w / 2, -XRAY.h, XRAY.w, XRAY.h);
  c.globalCompositeOperation = 'color';
  c.globalAlpha = 0.85;
  c.fillStyle = XRAY_GLYPH_WARM;
  c.fillRect(-XRAY.w / 2, -XRAY.h, XRAY.w, XRAY.h);
  c.restore();
}

/** an evenly feathered rounded plate (screen px): solid in the middle, soft at every edge (not a radial smudge) */
function evenPlate(c: C, x: number, y: number, w: number, h: number, ink: string, alpha: number) {
  c.save();
  c.filter = 'blur(10px)';
  c.fillStyle = withAlpha(ink, alpha);
  c.beginPath();
  c.roundRect(x + 10, y + 10, w - 20, h - 20, 10);
  c.fill();
  c.restore();
}

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
  // the WITHOUT hand's stop, copied as a faint tick onto the WITH TOOLS bezel once it has stopped: real hand >
  // WITHOUT mark > ghost hand, read on one dial
  const tStop = start + A_WITHOUT / speed;
  const mark = win(tq12(t), tStop + 0.15, tStop + 0.6);
  // the lamp's pool on the exhibit: full until 'date', then its radius and light draw back ~30% (an old exhibit)
  const pk = clamp01((pool - 0.7) / 0.3);
  // on 'date' the pool slides off the exhibit, up and right toward the lamp (as from an old exhibit)
  const cx = (WATCH.a + WATCH.b) / 2 + (1 - pk) * 150, cy = WATCH.y - 60 - (1 - pk) * 40;
  const R = 300 * (0.7 + 0.3 * pk);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const pg = c.createRadialGradient(cx, cy + 30, 10, cx, cy + 30, R);
  pg.addColorStop(0, withAlpha(m.halo, 0.2 * (0.7 + 0.3 * pk)));
  pg.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = pg;
  c.fillRect(cx - R, cy + 30 - R, 2 * R, 2 * R);
  c.restore();
  // a sharp sliver of desk top under them
  c.fillStyle = mixLab(m.set, m.fg, 0.35);
  c.fillRect(WATCH.a - 140, WATCH.y, WATCH.b - WATCH.a + 280, 6);
  c.fillStyle = withAlpha(m.rim, 0.35 * pool);
  c.fillRect(WATCH.a - 140, WATCH.y, WATCH.b - WATCH.a + 280, 1);
  watch(c, env, WATCH.a, 'WITHOUT', aWithout, 0, pk, 0);
  watch(c, env, WATCH.b, 'WITH TOOLS', aWith, ghost, pk, mark);
  // as the pool draws back, the shade closes in round the exhibit
  if (pk < 0.99) {
    const g = c.createRadialGradient(cx, cy + 20, R * 0.55, cx, cy + 20, R * 1.25);
    g.addColorStop(0, withAlpha(m.fg, 0));
    g.addColorStop(1, withAlpha(m.fg, 0.7 * (1 - pk)));
    c.fillStyle = g;
    c.fillRect(cx - 700, cy - 500, 1400, 1000);
  }
}

function watch(c: C, env: PaintEnv, x: number, name: string, ang: number, ghost: number, pool: number, mark: number) {
  const m = env.mood;
  const r = WATCH.r;
  const cy = WATCH.y - 14 - r;
  const ink = PUPPET_NEAR_BLACK;
  // review round 1 (light): the dial is lit by the lamp at the upper right: its lit side grades toward the halo, its
  // far side a stop darker; as the pool slides off on 'date' the whole face falls toward the far side's value
  const base = mixLab(mixLab('#d9c8a4', m.halo, 0.2), m.set, 0.3);
  const lit = mixLab(base, m.halo, 0.12 + 0.18 * pool);
  const far = mixLab(base, m.fg, 0.5);
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
  // the brass bezel: a rim along its top (the lamp is above), brightest toward the lamp at the upper right
  c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), 0.35 + 0.5 * pool);
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(x, cy, r + 4, -Math.PI * 0.62, Math.PI * 0.12);
  c.stroke();
  c.strokeStyle = withAlpha(m.rim, 0.3 + 0.25 * pool);
  c.lineWidth = 1.1;
  c.beginPath();
  c.arc(x, cy, r + 5.5, -Math.PI * 0.95, -Math.PI * 0.6);
  c.stroke();
  c.beginPath();
  c.arc(x - 10, cy - r - 21, 9, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  // the dial, graded from the lamp side (upper right) to the far side
  const fg = c.createLinearGradient(x + r * 0.7, cy - r * 0.7, x - r * 0.7, cy + r * 0.7);
  fg.addColorStop(0, lit);
  fg.addColorStop(0.45, mixLab(lit, far, 0.35));
  fg.addColorStop(1, far);
  c.fillStyle = fg;
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
  // the WITHOUT stop, copied onto this dial (review round 1: twice as long and in the WITHOUT hand's own ink, so
  // 'ran further than without' reads at a glance: real hand > this mark > ghost hand)
  if (mark > 0.01) {
    c.save();
    c.translate(x, cy);
    c.rotate(A_WITHOUT);
    c.fillStyle = withAlpha(ink, 0.95 * mark);
    c.fillRect(-1.6, -r - 4, 3.2, 26);
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
