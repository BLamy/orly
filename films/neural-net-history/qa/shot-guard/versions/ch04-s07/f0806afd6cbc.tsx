/**
 * ch04-s07 — the Winter Map: a vast snowbound paper landscape at night under a pale moon, ridgelines layered
 * in haze, west at frame left and east at frame right; far apart across it, a few small near-black houses (a third
 * of a village's worth, so the land reads vast), and a dark near snowbank (L5) across the foot of the frame, so the
 * drift slides three planes against each other. The three lit windows are the only highlights, each with a halo.
 *   from the first frame  the camera drifts slowly east → west; each window lights (a glint) as its tag fades
 *                         in, east to west: FUKUSHIMA · TOKYO · 1979 (≈0.6 s), then AMARI · JAPAN · 1967 · a way
 *                         to train more than one layer (≈1.7 s; the drift all but stops on it, 2.0–2.6 s), then,
 *                         farthest west, HELSINKI · 1970 (on "Helsinki"), where the camera settles
 *   "clue"                a thread of light rises from the Helsinki window (0.6 s) and hangs in the sky, a small
 *                         bright knot at its end, unconnected (s08 lands it)
 *   "sat"                 the camera pushes in on the Helsinki cottage and through its window (the cottage itself
 *                         scales about its own pane, so there is only ever one window): the mullions pass the lens
 *                         as a cut-paper wipe and the room beyond fills the frame by "in" → the insert: a student
 *                         (generic, unnamed; near-black, rimmed toward the lamp) seated at a desk in profile; the top
 *                         sheet of a fanfold printout propped up off its pile, leaning back and turned to the lamp,
 *                         its tail spilling over the desk's edge; his pencil works down the FORTRAN-style lines under
 *                         the header ROUNDING ERRORS; on "rounding" the lamp's glint finds the header and runs down to
 *                         the backward loop (DO 20 K = N, 1, -1), where it rests, faint, to the end of the insert;
 *                         caption under the sheet: thesis: reverse-mode differentiation
 *   "warm"                back out through the same window (a quick wipe, ≈0.35 s) and on, back and up past the
 *                         map, to reveal large warm houses in the foreground (faded in once the camera is behind
 *                         them), their bright windows facing us (away from the map), people seated in them facing
 *                         us, their light and the houses' long shadows thrown across the snow toward us; nobody
 *                         turns. The thread still hangs.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerId, PaintEnv, Pose, PuppetSpec } from '../../../film';
import {
  LAYERS, MOODS, POSES, PUPPET_NEAR_BLACK, addPose, anglepoiseLamp, blendPose, bookshelfWall, chair, createPuppet, defineShot, fbm, layerXform, mixLab,
  moon, seatHeight, smoke, snow, softPlate, stars, textColor, toScreen, withAlpha, withLife,
} from '../../../film';
import type { ShotScene } from '../../../film';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { makeCanvas } from '../../../film/silhouette/atmosphere';
import { hash1 } from '../../../film/core/frame';
import { MAP, bigHouse, cottage, cottageChimney, printoutSheet, type CottageOpts, type Rect } from '../sets/ch04-s07-map';
import { camKeys, clamp01, compositeSub, glow, lerp, sm, subFrame, tq12 } from '../sets/ch04-s06-kit';

const ID = 'ch04-s07';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------ the map's ridges (smooth crests with a torn,
// deckled paper edge, so the houses can sit on them exactly)
type Ridge = { base: number; a: [number, number, number][] };
const RIDGES: Record<'L2' | 'L3' | 'L4', Ridge> = {
  L2: { base: 466, a: [[24, 210, 1], [12, 97, 2]] },
  L3: { base: 534, a: [[22, 260, 0.3], [10, 83, 1.7]] },
  L4: { base: 578, a: [[18, 300, 2.2], [8, 120, 0]] },
};
const ridgeY = (id: keyof typeof RIDGES, x: number) => {
  const r = RIDGES[id];
  let y = r.base;
  for (const [A, L, ph] of r.a) y += A * Math.sin(x / L + ph);
  return y + 3 * fbm(x / 40, 11);
};
/** the cut edge: the smooth crest plus a fine deckle (torn paper) */
const deckleY = (id: keyof typeof RIDGES, x: number) => ridgeY(id, x) + 1.3 * hash1(Math.floor(x / 3), id.charCodeAt(1)) + 0.7 * hash1(Math.floor(x / 7), 5);
const RX0 = -1800, RX1 = 3100;
const ridgeCache = new Map<string, Path2D>();
function ridgePathOf(id: keyof typeof RIDGES): Path2D {
  let p = ridgeCache.get(id);
  if (p) return p;
  p = new Path2D();
  p.moveTo(RX0, 1600);
  for (let x = RX0; x <= RX1; x += 3) p.lineTo(x, deckleY(id, x));
  p.lineTo(RX1, 1600);
  p.closePath();
  ridgeCache.set(id, p);
  return p;
}
const crestCache = new Map<string, Path2D>();
function crestOf(id: keyof typeof RIDGES): Path2D {
  let p = crestCache.get(id);
  if (p) return p;
  p = new Path2D();
  for (let x = RX0; x <= RX1; x += 3) (x === RX0 ? p.moveTo(x, deckleY(id, x)) : p.lineTo(x, deckleY(id, x)));
  crestCache.set(id, p);
  return p;
}

// houses on the crests. Only a third of the set's unlit houses stand (far apart: a vast land, not a village), cut in
// near-black ink so the three lit windows are the only highlights on the map
const DARK = MAP.dark.filter(([L, x]) => (L === 'L2' && x === 410) || (L === 'L3' && x === 1290) || (L === 'L4' && (x === 700 || x === -60)));
const INKK: Record<string, number> = { L2: 0.5, L3: 0.68, L4: 0.86 };
/** the layer's env with its ink pushed toward near-black and the moonlit roof snow dimmed a step (houses only) */
function inkEnv(env: PaintEnv, L: 'L2' | 'L3' | 'L4'): PaintEnv {
  const k = INKK[L];
  return {
    ...env,
    fill: (kind) => {
      const v = env.fill(kind);
      if (kind === 'ink' || kind === 'fg') return mixLab(v, PUPPET_NEAR_BLACK, k);
      if (kind === 'halo' || kind === 'core') return mixLab(v, env.fill('set'), 0.3);
      return v;
    },
  };
}
const HEL = { x: MAP.helsinki.x, y: ridgeY('L4', MAP.helsinki.x) + 4 };
const AMA = { x: MAP.amari.x, y: ridgeY('L3', MAP.amari.x) + 3 };
const TOK = { x: MAP.tokyo.x, y: ridgeY('L2', MAP.tokyo.x) + 3 };
/** Fukushima's cottage is on the far ridge: smaller and hazier */
const TS = 0.74;
/** the Helsinki cottage's scale and window (cottage geometry: wall top = y − 40s, window 16s × 19s, 11s below it) */
const HS = 1.15;
const HWIN: Rect = { x: HEL.x - 8 * HS, y: HEL.y - 40 * HS + 11 * HS, w: 16 * HS, h: 19 * HS };
const HWC = { x: HWIN.x + HWIN.w / 2, y: HWIN.y + HWIN.h / 2 };
/** the upper-left pane: the camera flies through it, so the cross-bars pass the lens to the right and below */
const PANE = { x: HWIN.x + HWIN.w * 0.25, y: HWIN.y + HWIN.h * 0.22 };
const HEL_OPTS = (k: number): CottageOpts => ({ x: HEL.x, y: HEL.y, s: HS, pitch: 1.1, chimney: 0.55, lit: Math.min(1.2, k) });
/** where the thread of light hangs in the sky */
const THREAD_END = { x: 404, y: 132 };

// ------------------------------------------------------------------ the insert (a 1970 graduate student; unnamed)
const STUDENT_SPEC: PuppetSpec = {
  id: 'ch04-s07-student', height: 318, build: 'slight', era: '1970s', wardrobe: 'sweaterVest', hair: 'shaggy', facialHair: 'none',
  glasses: 'heavy', hat: 'none', profile: { nose: 0.5, brow: 0.48, chin: 0.48, jaw: 0.45 }, prop: 'none', details: [],
};
const STUDENT = createPuppet(STUDENT_SPEC);
/**
 * seated in profile, facing right, leaning to the sheet: the far forearm rests on the desk, the near hand holds the
 * pencil at the sheet's margin, its point on the line he is reading (HI = the first code line, LO = the loop's end;
 * solved against the puppet's own arm so the hand lands on the line)
 */
const READ_HI: Pose = { ...addPose(POSES.sit, { torso: 12, neck: 10, head: 12, shoulderF: 24, elbowF: 70, shoulderB: 4, elbowB: 4 }), handF: 'pinch', handB: 'palmDown' };
const READ_LO: Pose = { ...addPose(POSES.sit, { torso: 14, neck: 12, head: 16, shoulderF: 4, elbowF: 68, shoulderB: 4, elbowB: 4 }), handF: 'pinch', handB: 'palmDown' };
const INS = { scale: 2.3, x: 296, floor: 762, deskY: 548 };
const SEAT_H = seatHeight(STUDENT_SPEC, POSES.sit) * INS.scale;
/**
 * the top sheet of the fanfold: lifted off the pile and propped leaning back from its fold, its face turned a little
 * toward the lamp (right edge farther, top narrower). Sheet-canvas units (SW × SH) map onto this world quad.
 */
const SW = 680, SH = 440;
const SHEET_TYPE = { headerSize: 38, codeSize: 31, codeLead: 44, codeTop: 128 };
const QUAD = { TL: { x: 540, y: 192 }, TR: { x: 986, y: 212 }, BR: { x: 1016, y: 508 }, BL: { x: 470, y: 514 } };
/** the fanfold pile on the desk, under the sheet's fold */
const STACK = { x: 454, w: 584, h: 34 };
/** the lamp at the desk's right end, its head turned down toward the sheet */
const LAMP = { x: 1290, y: INS.deskY, s: 2.3, reach: 0.3, aim: -0.6, flip: true, lit: true, seed: 5 };

// the final pull-back camera and the foreground houses (L5)
const FINAL: Camera3 = { x: 600, y: 340, z: -700, lens: 1 };
const NEAR: Camera3 = { x: HWC.x + 6, y: HWC.y - 4, z: 760, lens: 1 };
const HOUSES = [
  { x: -430, y: 900, w: 520, h: 360, roof: 170, windows: 3, seed: 1 },
  { x: 650, y: 900, w: 600, h: 330, roof: 190, windows: 3, seed: 2 },
  { x: 1660, y: 900, w: 520, h: 350, roof: 170, windows: 3, seed: 3 },
];

interface B {
  tTok: number;
  tAma: number;
  tHel: number;
  thread: number;
  push0: number;
  cut1: number;
  pull0: number;
  wipeOut: number;
  land: number;
  rounding: number;
  thesis: number;
}
interface Scene extends ShotScene {
  b: B;
  D: number;
  mapCam: (t: number) => Camera3;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const push0 = T.word('L0412', 'sat') - 0.1;
    const cut1 = T.word('L0412', 'in#2');
    const pull0 = T.beat('warm');
    const b: B = {
      tTok: 0.6,
      tAma: 1.7,
      tHel: T.word('L0412', 'Helsinki') - 0.22,
      thread: T.word('L0412', 'clue') - 0.15,
      push0,
      cut1,
      pull0,
      // the wipe back out of the window is quick (≈0.35 s), so the pull-back never sits in a dark frame
      wipeOut: pull0 + 0.35,
      land: Math.min(D - 1.2, pull0 + 1.0),
      rounding: T.beat('rounding'),
      thesis: T.word('L0412', 'thesis'),
    };
    // the map: a slow east → west drift, all but stopping on Amari (2.0–2.6 s), settling on Helsinki
    const drift = camKeys([
      [0, 792, 350, 30],
      [1.95, 728, 353, 58],
      [2.6, 721, 354, 62],
      [b.tHel + 0.55, 590, 362, 100],
      [push0, 572, 366, 116],
    ]);
    const mapCam = (t: number): Camera3 => {
      if (t < push0) return drift(t);
      if (t < pull0) {
        // in on the cottage: a smooth push that lands on the window as the wipe completes
        const a = drift(push0);
        const u = sm(clamp01((t - push0) / (cut1 - push0)));
        const uz = Math.pow(clamp01((t - push0) / (cut1 - push0)), 1.6);
        return { x: lerp(a.x, NEAR.x, u), y: lerp(a.y, NEAR.y, u), z: lerp(a.z, NEAR.z, uz), lens: 1 };
      }
      // out of the window, back and up past the map: decelerating to the final wide by ≈ warm + 1.0
      const u = clamp01((t - pull0) / (b.land - pull0));
      const e = 1 - Math.pow(1 - u, 3);
      const ez = 1 - Math.pow(1 - u, 2.4);
      return { x: lerp(NEAR.x, FINAL.x, e), y: lerp(NEAR.y, FINAL.y, e), z: lerp(NEAR.z, FINAL.z, ez) + (t > b.land ? -8 * (t - b.land) : 0), lens: 1 };
    };
    tl.hold(0, D);
    return { tl, b, D, mapCam };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t >= b.cut1 && t < b.pull0) paintInsert(f, sc, t);
    else paintMap(f, sc, t);
  },
});

// =====================================================================================================
// THE MAP
// =====================================================================================================
/** a window's light: dark until its moment, up over 0.25 s with a glint (the celesta), then steady */
function winLight(t: number, at: number): number {
  const on = sm((t - at) / 0.25);
  const glint = Math.exp(-Math.max(0, t - at - 0.15) * 3.2) * sm((t - at) / 0.15);
  return on + 0.45 * glint;
}

/** how far through the window wipe we are (0 = the window at its natural size, 1 = the pane fills the frame) */
function wipeAt(sc: Scene, t: number): number {
  const b = sc.b;
  if (t >= b.push0 && t < b.cut1) {
    const u = clamp01((t - b.push0) / (b.cut1 - b.push0));
    return sm(clamp01((u - 0.12) / 0.88));
  }
  if (t >= b.pull0 && t < b.wipeOut) {
    const v = clamp01((t - b.pull0) / (b.wipeOut - b.pull0));
    return 1 - sm(v);
  }
  return 0;
}

function paintMap(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.mapCam(t);
  f.camera(cam);
  const pulled = t >= b.pull0;
  const wipe = wipeAt(sc, t);
  f.backlight({ sunX: 1010, sunY: 250, sunRadius: 560, intensity: 0.4 });

  // L1: stars, the pale moon in the east, the far mountains; small slow snow
  f.layer('L1', (c, env) => {
    const night = c.createLinearGradient(0, -900, 0, 430);
    night.addColorStop(0, withAlpha(env.mood.fg, 0.88));
    night.addColorStop(0.55, withAlpha(env.mood.fg, 0.55));
    night.addColorStop(1, withAlpha(env.mood.fg, 0.1));
    c.fillStyle = night;
    c.fillRect(-2600, -900, 6400, 1330);
    stars(c, { x: -2600, y: -900, w: 6400, h: 1250, count: 340, seed: 7, twinkle: 0.25 }, env);
    moon(c, { x: 1010, y: 112, r: 22, phase: 0.1, halo: 0.8 }, env);
    // a deckled bank of snow cloud, cut from paper, its top edge silvered by the moon
    clouds(c, env);
    c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.35);
    c.fill(farRange());
    snow(c, { area: { x: -2400, y: -800, w: 6000, h: 1500 }, count: 260, salt: 71, fall: 18, wind: 6, size: 0.55, color: env.mood.core }, env);
  });
  // L2: the second ridge, a bare wood along its crest, two dark houses
  const kA = winLight(t, b.tAma), kT = winLight(t, b.tTok);
  f.layer('L2', (c, env) => {
    ridge(c, env, 'L2');
    woods(c, env, 'L2', 0.55);
    const ie = inkEnv(env, 'L2');
    for (const [L, x, sc0] of DARK) if (L === 'L2') cottage(c, darkOpts(x, ridgeY('L2', x) + 3, sc0), ie);
    litCottage(c, ie, { x: TOK.x, y: TOK.y, s: TS, pitch: 1.25, chimney: -0.5, lit: Math.min(1.2, kT) }, kT, 71, t);
  });
  // each lit window carries its own halo (a lamp behind the glass), so the three read across the whole map
  f.practical({ x: TOK.x, y: TOK.y - 20 * TS, kind: 'lamp', seed: 79, intensity: 0.95 * Math.min(1, kT), radius: 40, layer: 'L2' });
  f.fog({ yCenter: 0.6 * 720, height: 0.3 * 720, alpha: 0.1, drift: 5 });
  // L3: the far ridge with Amari's and Fukushima's windows (Japan, the east)
  f.layer('L3', (c, env) => {
    ridge(c, env, 'L3');
    woods(c, env, 'L3', 0.4);
    const ie = inkEnv(env, 'L3');
    for (const [L, x, sc0] of DARK) if (L === 'L3') cottage(c, darkOpts(x, ridgeY('L3', x) + 3, sc0), ie);
    litCottage(c, ie, { x: AMA.x, y: AMA.y, s: 1, pitch: 0.85, chimney: 0.6, lit: Math.min(1.2, kA) }, kA, 72, t);
    snow(c, { area: { x: -2000, y: -700, w: 5200, h: 1600 }, count: 150, salt: 73, fall: 30, wind: 9, size: 0.85, color: env.mood.core }, env);
  });
  f.practical({ x: AMA.x, y: AMA.y - 20, kind: 'lamp', seed: 67, intensity: 1.0 * Math.min(1, kA), radius: 40, layer: 'L3' });
  f.fog({ yCenter: 0.74 * 720, height: 0.18 * 720, alpha: 0.06, drift: 7 });
  // L4: the near ridge with the Helsinki cottage; the thread of light
  const kH = winLight(t, b.tHel);
  let env4: PaintEnv | null = null;
  f.layer('L4', (c, env) => {
    env4 = env;
    ridge(c, env, 'L4');
    const ie = inkEnv(env, 'L4');
    for (const [L, x, sc0] of DARK) if (L === 'L4') cottage(c, darkOpts(x, ridgeY('L4', x) + 4, sc0), ie);
    // while the window wipe runs, the Helsinki cottage is drawn ONLY by the wipe (one cottage, one window)
    if (wipe <= 0) litCottage(c, ie, HEL_OPTS(kH), kH, 73, t);
    // the thread: rises on "clue" (0.6 s) and hangs, unconnected
    const u = sm(clamp01((tq12(t) - b.thread) / 0.6));
    if (u > 0) thread(c, env, { x: HWC.x + 2, y: HWIN.y - 2 }, THREAD_END, u, 0.92 + 0.08 * Math.sin(t * 2.1), cam);
  });
  f.rim({ x: 0.7, y: -0.7 });
  f.practical({ x: HWC.x, y: HWC.y, kind: 'lamp', seed: 1970, intensity: 1.0 * Math.min(1, kH) * (1 - wipe), radius: 42, layer: 'L4' });

  // L5: near snow (only while the camera is well behind this plane), and after the pull-back the large warm
  // houses of the foreground, their bright windows facing us, away from the map
  // (on the pull-back the houses fade in only once the camera is well behind their plane, so it never passes
  // through a frame filled with their out-of-focus walls)
  // (they come in under the last of the wipe's wall, from ≈ warm + 0.1, so the frame never shows an empty floor)
  const nearK = pulled ? clamp01((420 - cam.z) / 240) * sm((t - (b.pull0 + 0.1)) / 0.18) : clamp01((420 - cam.z) / 260);
  if (nearK > 0) {
    f.layer('L5', (c, env) => {
      // on the map: a dark near snowbank across the foot of the frame (blurred by its plane), so the east → west
      // drift slides three planes against each other: this bank, the near ridge, the far ridges
      if (!pulled) {
        f.cached(`${ID}/L5/bank2/${env.mood.id}`, 2700, 500, (cc) => {
          cc.translate(700, -460);
          snowbank(cc, env);
        })(c, -700, 460);
      }
      c.save();
      c.globalAlpha *= nearK;
      if (pulled) foreground(c, env, t);
      snow(c, { area: { x: -1400, y: -700, w: 4200, h: 2200 }, count: 70, salt: 79, fall: 52, wind: 14, size: 1.5, color: env.mood.core }, env);
      c.restore();
    });
  }

  // the window wipe: the Helsinki cottage, scaled faster than the map behind it, until its upper-left pane fills
  // the frame; the room beyond shows through the panes and the cross-bars pass the lens
  if (wipe > 0 && env4) windowWipe(f, sc, t, cam, wipe, env4);

  // type: the window tags (screen-locked, following their windows), gone before the push
  const tagA = 1 - sm((t - b.push0) / 0.3);
  if (!pulled && tagA > 0) {
    const env = { t, mood: f.mood, seed: 47 };
    const pt = (L: LayerId, x: number, y: number) => toScreen(LAYERS[L], cam, x, y);
    const pT = pt('L2', TOK.x, TOK.y);
    const pA = pt('L3', AMA.x, AMA.y - 44);
    const pH = pt('L4', HEL.x, HEL.y - 80);
    // each tag sits clear of the roofs around it (lifted over the far ridge's houses), on its own soft plate
    tag(f.c, env, ['FUKUSHIMA · TOKYO · 1979'], pT.x, pT.y + 82, b.tTok, tagA);
    tag(f.c, env, ['AMARI · JAPAN · 1967', 'a way to train more than one layer'], pA.x, pA.y - 104, b.tAma, tagA, 0.3);
    // Helsinki's tag stands to the LEFT of its cottage: the thread rises up and to the right, so the two never cross
    tag(f.c, env, ['HELSINKI · 1970'], pH.x - 130, pH.y - 58, b.tHel, tagA);
  }
}

/** an unlit cottage with its own cut-paper character (roof pitch, chimney place, squat or tall), seeded by x */
function darkOpts(x: number, y: number, s: number): CottageOpts {
  const h = hash1(Math.round(x), 41), h2 = hash1(Math.round(x), 42);
  return { x, y, s, lit: 0, pitch: 1.05 + 0.32 * h, chimney: h2 > 0 ? 0.55 : -0.5, tall: 1 + 0.12 * hash1(Math.round(x), 43) };
}

/**
 * A lit cottage: its window's light spilling as a soft halo onto the snow below and in front, the cottage, and a
 * thin curl of chimney smoke silvered by the moon (the chimney draws once the window is lit).
 */
function litCottage(c: C, env: PaintEnv, o: CottageOpts, k: number, salt: number, t: number) {
  const s = o.s ?? 1;
  const kk = Math.min(1, k);
  if (kk > 0.01) {
    // the spill on the snow under and before the window (a flattened warm-pale pool)
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(o.x, o.y + 6 * s);
    c.scale(1, 0.32);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 58 * s);
    const col = mixLab(mixLab(env.mood.core, '#f4e3b8', 0.35), env.mood.halo, 0.3);
    g.addColorStop(0, withAlpha(col, 0.34 * kk));
    g.addColorStop(0.5, withAlpha(col, 0.12 * kk));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(-60 * s, -60 * s, 120 * s, 120 * s);
    c.restore();
  }
  cottage(c, o, env);
  if (kk > 0.01) {
    const ch = cottageChimney(o);
    smoke(c, { x: ch.x, y: ch.y, kind: 'candle', height: 58 * s, drift: -16 * s, intensity: 0.55 * kk, salt, color: mixLab(env.mood.haze, env.mood.core, 0.5) }, { ...env, t });
  }
}

/** L1: a long bank of cut-paper snow cloud above the far range, its deckled underside hazed, top lit by the moon */
const cloudCache = new Map<string, Path2D>();
function clouds(c: C, env: PaintEnv) {
  const bands: [number, number, number, number][] = [
    // y (the bank's base), thickness, lobe pitch, seed
    [222, 46, 150, 3],
    [268, 34, 110, 5],
  ];
  for (const [i, [y0, th, pitch, seed]] of bands.entries()) {
    const key = `cloud${i}`;
    let p = cloudCache.get(key);
    if (!p) {
      p = new Path2D();
      const X0 = -2600, X1 = 3800, STEP = 6;
      // the bank swells and thins along its length: each run where it has body is its OWN closed cut-out, tapering
      // to a point at both ends, and the sky between runs is truly empty (no sliver joins them, so nothing draws
      // a ruler line across the frame)
      const envAt = (x: number) => sm((fbm(x / 700, seed + 9) - 0.3) / 0.22);
      const runs: [number, number][] = [];
      let r0: number | null = null;
      for (let x = X0; x <= X1 + STEP; x += STEP) {
        const on = x <= X1 && envAt(x) > 0.03;
        if (on && r0 === null) r0 = x;
        else if (!on && r0 !== null) {
          if (x - r0 > 60) runs.push([r0, x - STEP]);
          r0 = null;
        }
      }
      for (const [a, z] of runs) {
        // a taper over the run's first and last stretch, so the ends are pointed, never cut square
        const taper = (x: number) => sm(Math.min(x - a, z - x) / 90);
        const k = (x: number) => envAt(x) * taper(x);
        p.moveTo(a, y0 + th);
        // the lumpy top: overlapping rounded lobes of seeded size
        for (let x = a; x <= z; x += STEP) {
          const lobe = Math.sqrt(Math.abs(Math.sin((x / pitch) * Math.PI + seed)));
          p.lineTo(x, y0 + th - k(x) * (th * (0.4 + 0.6 * lobe) + 8 * fbm(x / 40, seed)));
        }
        p.lineTo(z, y0 + th);
        // the underside, torn and gently wavy, closing to the point at each end
        for (let x = z; x >= a; x -= 3) {
          p.lineTo(x, y0 + th + k(x) * (2 + 1.6 * hash1(Math.floor(x / 3), seed) + 6 * Math.sin(x / 57 + seed)));
        }
        p.closePath();
      }
      cloudCache.set(key, p);
    }
    c.fillStyle = mixLab(env.fill('set'), env.fill('haze'), i === 0 ? 0.42 : 0.3);
    c.globalAlpha = i === 0 ? 0.55 : 0.7;
    c.fill(p);
    c.globalAlpha = 1;
    c.strokeStyle = withAlpha(mixLab(env.mood.core, env.mood.rim, 0.5), 0.16);
    c.lineWidth = 1.2;
    c.stroke(p);
  }
}

function farRange(): Path2D {
  let p = ridgeCache.get('far');
  if (p) return p;
  p = new Path2D();
  p.moveTo(RX0 * 1.5, 1600);
  for (let x = RX0 * 1.5; x <= RX1 * 1.5; x += 6) {
    const y = 400 - 70 * Math.abs(Math.sin(x / 330 + 0.6)) - 40 * Math.abs(Math.sin(x / 140)) - 14 * fbm(x / 60, 5);
    p.lineTo(x, y);
  }
  p.lineTo(RX1 * 1.5, 1600);
  p.closePath();
  ridgeCache.set('far', p);
  return p;
}

/** L5: the near snowbank, a near-black drift with a deckled, faintly moonlit lip and a few dry stalks */
function snowbank(c: C, env: PaintEnv) {
  const top = (x: number) => 608 + 16 * Math.sin(x / 190 + 0.8) + 9 * Math.sin(x / 67 + 2) + 4 * fbm(x / 23, 61);
  const p = new Path2D();
  p.moveTo(-700, 960);
  for (let x = -700; x <= 2000; x += 4) p.lineTo(x, top(x));
  p.lineTo(2000, 960);
  p.closePath();
  const ink = mixLab(env.fill('ink'), PUPPET_NEAR_BLACK, 0.8);
  c.fillStyle = ink;
  c.fill(p);
  c.save();
  c.clip(p);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.3);
  c.lineWidth = 2;
  c.beginPath();
  for (let x = -700; x <= 2000; x += 4) (x === -700 ? c.moveTo(x, top(x) + 1) : c.lineTo(x, top(x) + 1));
  c.stroke();
  c.restore();
  // dry stalks and a bare sapling poking out of the drift
  c.fillStyle = ink;
  for (let x = -640; x < 1960; x += 37) {
    const h = hash1(Math.round(x), 62);
    if (h < 0.25) continue;
    const y = top(x) + 3;
    const L = 14 + 26 * h;
    const lean = 6 * hash1(Math.round(x), 63);
    c.beginPath();
    c.moveTo(x - 1.2, y);
    c.lineTo(x + lean - 0.4, y - L);
    c.lineTo(x + lean + 0.4, y - L);
    c.lineTo(x + 1.2, y);
    c.closePath();
    c.fill();
  }
  for (const sx of [-320, 1180]) {
    const y = top(sx) + 4;
    c.beginPath();
    c.moveTo(sx - 2.5, y);
    c.lineTo(sx - 1, y - 110);
    c.lineTo(sx + 1, y - 110);
    c.lineTo(sx + 2.5, y);
    c.closePath();
    c.fill();
    for (const [dy, dx, len] of [[0.45, -1, 40], [0.6, 1, 34], [0.75, -1, 26], [0.85, 1, 20]] as const) {
      const by = y - 110 * dy;
      c.beginPath();
      c.moveTo(sx, by + 2);
      c.lineTo(sx + dx * len * 0.7, by - len * 0.7);
      c.lineTo(sx + dx * len * 0.7 + 1, by - len * 0.7 + 1.5);
      c.lineTo(sx + 1, by + 4);
      c.closePath();
      c.fill();
    }
  }
}

/** a moonlit snowfield cut from paper: bright at the deckled crest, sinking into blue shadow in the hollow below */
function ridge(c: C, env: PaintEnv, id: 'L2' | 'L3' | 'L4') {
  const m = env.mood;
  const crest = id === 'L4' ? mixLab(env.fill('halo'), env.fill('core'), 0.04) : id === 'L3' ? mixLab(env.fill('halo'), env.fill('haze'), 0.28) : mixLab(env.fill('halo'), env.fill('haze'), 0.55);
  // the hollows sink a step deeper plane by plane (L3's blue shadow is the darkest, so the near field and the
  // houses on it separate from it: depth, not one flat pale sheet)
  const hollow = id === 'L4' ? mixLab(env.fill('halo'), env.fill('set'), 0.84) : id === 'L3' ? mixLab(env.fill('haze'), env.fill('set'), 0.86) : mixLab(env.fill('haze'), env.fill('set'), 0.7);
  const top = RIDGES[id].base - 46;
  // short falls: each field drops from its lit lip into blue shadow before the next plane's lip, so the planes
  // stack as bright edges over dark hollows
  const g = c.createLinearGradient(0, top, 0, top + (id === 'L4' ? 130 : 84));
  g.addColorStop(0, crest);
  g.addColorStop(0.45, mixLab(crest, hollow, 0.45));
  g.addColorStop(1, hollow);
  c.fillStyle = g;
  c.fill(ridgePathOf(id));
  // the cut edge: a fine dark line under the deckle (the paper's thickness), and a bright lip on top
  c.save();
  c.translate(0, 1.6);
  c.strokeStyle = withAlpha(m.fg, 0.35);
  c.lineWidth = 1.4;
  c.stroke(crestOf(id));
  c.restore();
  c.strokeStyle = withAlpha(mixLab(m.core, m.rim, 0.5), 0.5);
  c.lineWidth = 1;
  c.stroke(crestOf(id));
}

/** sparse bare trees along a crest (seeded, memoised path) */
const woodCache = new Map<string, Path2D>();
function woods(c: C, env: PaintEnv, id: 'L2' | 'L3', density: number) {
  const key = `${id}/${density}`;
  let p = woodCache.get(key);
  if (!p) {
    p = new Path2D();
    for (let x = RX0; x < RX1; x += 22) {
      const h = fbm(x / 13, 31);
      if (h < 1 - density * 1.6) continue;
      const near = (Math.abs(x - MAP.helsinki.x) < 70 || Math.abs(x - MAP.amari.x) < 60 || Math.abs(x - MAP.tokyo.x) < 60);
      if (near) continue;
      const y = ridgeY(id, x) + 3;
      const th = 22 + 18 * (0.5 + 0.5 * Math.sin(x * 0.37));
      p.moveTo(x - 1.2, y);
      p.lineTo(x - 0.6, y - th);
      p.lineTo(x + 0.6, y - th);
      p.lineTo(x + 1.2, y);
      p.closePath();
      for (const [dx, dy, len] of [[-1, 0.55, 0.45], [1, 0.4, 0.5], [-1, 0.25, 0.35], [1, 0.75, 0.3]] as const) {
        const by = y - th * dy;
        p.moveTo(x, by);
        p.lineTo(x + dx * th * len * 0.6, by - th * len);
        p.lineTo(x + dx * th * len * 0.6 + 1, by - th * len + 1);
        p.lineTo(x + 1, by + 1.5);
        p.closePath();
      }
    }
    woodCache.set(key, p);
  }
  c.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.2);
  c.fill(p);
}

/** the thread of light: a 2–2.5 px core with a soft halo, drawn up from the window; a bright knot where it hangs */
function thread(c: C, env: PaintEnv, p: { x: number; y: number }, q: { x: number; y: number }, u: number, a: number, cam: Camera3) {
  const k = layerXform(LAYERS.L4, cam).k;
  const px = 1 / Math.max(0.6, k); // keep the line weights in screen px as the camera dollies
  const mx = (p.x + q.x) / 2 + 30, my = (p.y + q.y) / 2 + 26;
  const n = 36;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n * u; i++) {
    const s = i / n;
    pts.push({ x: (1 - s) * (1 - s) * p.x + 2 * (1 - s) * s * mx + s * s * q.x, y: (1 - s) * (1 - s) * p.y + 2 * (1 - s) * s * my + s * s * q.y });
  }
  if (pts.length < 2) return;
  const col = env.mood.core;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  for (const [lw, al] of [[20, 0.07], [10, 0.25], [2.4, 0.9]] as const) {
    c.strokeStyle = withAlpha(col, al * a);
    c.lineWidth = lw * px;
    c.beginPath();
    pts.forEach((pt, i) => (i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y)));
    c.stroke();
  }
  c.restore();
  const h = pts[pts.length - 1];
  // the head (rising) or the knot (hanging)
  glow(c, h.x, h.y, 14 * px, col, (u < 1 ? 0.8 : 0.55) * a);
  c.fillStyle = withAlpha(col, 0.95 * a);
  c.beginPath();
  c.arc(h.x, h.y, 2.8 * px, 0, Math.PI * 2);
  c.fill();
}

/** the warm foreground: the houses on their snowbank, their long shadows and their windows' light thrown toward us */
function foreground(c: C, env: PaintEnv, t: number) {
  const warm = mixLab(MOODS.candleAmber.core, env.mood.core, 0.25);
  const halo = mixLab(MOODS.candleAmber.halo, env.mood.halo, 0.35);
  const G = HOUSES[0].y;
  // the houses, cut off at the ground line
  c.save();
  c.beginPath();
  c.rect(-1400, -2000, 4400, 2000 + G);
  c.clip();
  const wins: { r: Rect; seed: number }[] = [];
  for (const h of HOUSES) bigHouse(c, h, env).forEach((r, i) => wins.push({ r, seed: h.seed * 7 + i }));
  for (const w of wins) warmWindow(c, env, w.r, warm, halo, w.seed, t);
  c.restore();
  // the snow they stand in (moonlit), darkening toward us
  const sg = c.createLinearGradient(0, G, 0, G + 260);
  sg.addColorStop(0, mixLab(env.fill('halo'), env.fill('set'), 0.3));
  sg.addColorStop(1, mixLab(env.fill('halo'), env.fill('fg'), 0.6));
  c.fillStyle = sg;
  c.fillRect(-1400, G, 4400, 900);
  for (const h of HOUSES) {
    // the house's long shadow, thrown toward us (the moon and the map behind it), widening as it comes
    c.fillStyle = withAlpha(env.mood.fg, 0.6);
    c.beginPath();
    c.moveTo(h.x - h.w / 2, G);
    c.lineTo(h.x + h.w / 2, G);
    c.lineTo(h.x + h.w * 0.66, G + 600);
    c.lineTo(h.x - h.w * 0.66, G + 600);
    c.closePath();
    c.fill();
  }
  // each lit window's light spilling out across the snow toward us, inside its house's shadow
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const { r } of wins) {
    const s0 = r.x + r.w / 2;
    const g = c.createLinearGradient(0, G, 0, G + 420);
    g.addColorStop(0, withAlpha(halo, 0.34));
    g.addColorStop(1, withAlpha(halo, 0));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(s0 - r.w * 0.45, G);
    c.lineTo(s0 + r.w * 0.45, G);
    c.lineTo(s0 + r.w * 0.95, G + 420);
    c.lineTo(s0 - r.w * 0.95, G + 420);
    c.closePath();
    c.fill();
  }
  c.restore();
  // the snowbank's lip along the houses' feet
  c.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.rim, 0.5), 0.35);
  c.fillRect(-1400, G - 1, 4400, 2);
}

function warmWindow(c: C, env: PaintEnv, r: Rect, warm: string, halo: string, seed: number, t: number) {
  c.fillStyle = warm;
  c.fillRect(r.x, r.y, r.w, r.h);
  const ink = env.fill('fg');
  // someone inside, seated at a table and facing us (away from the map), a lamp beside them; nobody turns
  if (seed % 3 !== 1) {
    const cx = r.x + r.w * (seed % 2 ? 0.36 : 0.64), cy = r.y + r.h;
    const s = r.w / 90;
    const breathe = 1 + 0.008 * Math.sin(t * 1.7 + seed);
    c.fillStyle = ink;
    // the table edge across the bottom of the window
    c.fillRect(r.x, cy - 16 * s, r.w, 16 * s);
    // shoulders and head, square to us
    c.beginPath();
    c.moveTo(cx - 30 * s, cy - 16 * s);
    c.bezierCurveTo(cx - 30 * s, cy - 50 * s * breathe, cx - 20 * s, cy - 56 * s * breathe, cx, cy - 57 * s * breathe);
    c.bezierCurveTo(cx + 20 * s, cy - 56 * s * breathe, cx + 30 * s, cy - 50 * s * breathe, cx + 30 * s, cy - 16 * s);
    c.closePath();
    c.fill();
    c.fillRect(cx - 6 * s, cy - 66 * s * breathe, 12 * s, 12 * s);
    c.beginPath();
    c.ellipse(cx, cy - 76 * s * breathe, 11 * s, 13.5 * s, 0, 0, Math.PI * 2);
    c.fill();
    // a small lamp on the table
    const lx = r.x + r.w * (seed % 2 ? 0.8 : 0.2);
    c.beginPath();
    c.moveTo(lx - 9 * s, cy - 40 * s);
    c.lineTo(lx + 9 * s, cy - 40 * s);
    c.lineTo(lx + 5 * s, cy - 52 * s);
    c.lineTo(lx - 5 * s, cy - 52 * s);
    c.closePath();
    c.fill();
    c.fillRect(lx - 1.5 * s, cy - 40 * s, 3 * s, 24 * s);
  }
  // glazing bars
  c.fillStyle = ink;
  c.fillRect(r.x + r.w / 2 - 3, r.y, 6, r.h * 0.6);
  c.fillRect(r.x, r.y + r.h * 0.38, r.w, 5);
  const k = 0.92 + 0.08 * fbm(t * 1.4, seed);
  glow(c, r.x + r.w / 2, r.y + r.h / 2, r.w * 1.5, halo, 0.3 * k);
}

function tag(c: C, env: { t: number; mood: PaintEnv['mood']; seed: number }, lines: string[], x: number, y: number, at: number, A0: number, extraPlate = 0) {
  const A = A0 * sm((env.t - at) / 0.28);
  if (A <= 0.01) return;
  const m = env.mood;
  c.save();
  // both lines at or above the legibility floor (22 px cap at 1080p): the italic gloss line is raised to it
  const base = lines.map((_, i) => (i === 0 ? `400 22px ${FONT.typewriter}` : `italic 400 20px ${FONT.text}`));
  const fonts = base.map((fo, i) => fo.replace(/\d+px/, `${legibleSize(c, fo, i === 0 ? 22 : 20)}px`));
  const widths = lines.map((l, i) => {
    c.font = fonts[i];
    return c.measureText(l).width;
  });
  const w = Math.max(...widths);
  const cx = Math.max(64 + w / 2, Math.min(1216 - w / 2, x));
  const lead = 28;
  c.globalAlpha = A;
  softPlate(c, cx, y + (lines.length - 1) * (lead / 2) - 7, w + 130, 58 + (lines.length - 1) * lead, m.ink, 0.62);
  if (extraPlate > 0) softPlate(c, cx, y + (lines.length - 1) * (lead / 2) - 7, w + 60, 40 + (lines.length - 1) * lead, m.ink, extraPlate);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  lines.forEach((l, i) => {
    c.font = fonts[i];
    c.fillStyle = i === 0 ? m.core : textColor(m);
    c.globalAlpha = A * (i === 0 ? 1 : 0.92);
    c.fillText(l, cx, y + i * lead);
  });
  c.restore();
}

/** the wipe through the Helsinki window: the cottage in screen space, scaled about its upper-left pane */
function windowWipe(f: Frame, sc: Scene, t: number, cam: Camera3, e: number, env: PaintEnv) {
  const m4 = layerXform(LAYERS.L4, cam);
  const nat = { x: PANE.x * m4.k + m4.tx, y: PANE.y * m4.k + m4.ty };
  const KF = 175;
  const K = Math.exp(lerp(Math.log(m4.k), Math.log(KF), e));
  const C0 = { x: lerp(nat.x, 640, e), y: lerp(nat.y, 360, e) };
  const c = f.c;
  const toS = (x: number, y: number) => ({ x: (x - PANE.x) * K + C0.x, y: (y - PANE.y) * K + C0.y });
  // the room beyond, seen through the four panes
  const room = subFrame(f, `${ID}/room`, 'winterBlue', (g) => paintInsert(g, sc, t));
  const a = toS(HWIN.x, HWIN.y), bb = toS(HWIN.x + HWIN.w, HWIN.y + HWIN.h);
  const showRoom = sm((bb.x - a.x - 70) / 260);
  // the cottage itself (wall, roof, chimney, the glazing bars) as the near cut-out sweeping past the lens. It is the
  // SAME cottage the map drew (the map leaves it out while the wipe runs), scaled about its own pane from the pane's
  // own screen point, so it never doubles; as it nears the lens it falls out of focus (soft dark shapes, no mattes)
  const defocus = clamp01((K - 22) / 90);
  const ie = inkEnv(env, 'L4');
  c.save();
  if (defocus > 0.02) c.filter = `blur(${(22 * defocus * f.pxScale).toFixed(1)}px)`;
  c.transform(K, 0, 0, K, C0.x - PANE.x * K, C0.y - PANE.y * K);
  const ink = ie.fill('ink');
  const s = HS;
  const w = 64 * s, h = 40 * s;
  const x0 = HEL.x - w / 2, y0 = HEL.y - h;
  // the wall's surround beyond the cottage (so the mattes read as a wall close up), faded in as the window grows
  const wallA = 0.92 * sm((K / m4.k - 1.4) / 2.5);
  if (wallA > 0.01) {
    const wall = new Path2D();
    wall.rect(x0 - 400, y0 - 400, w + 800, h + 800);
    wall.rect(HWIN.x, HWIN.y, HWIN.w, HWIN.h);
    c.globalAlpha = wallA;
    c.fillStyle = ink;
    c.fill(wall, 'evenodd');
    c.globalAlpha = 1;
  }
  cottage(c, HEL_OPTS(1), ie);
  c.restore();
  // the room beyond, through the window (over the lit pane, under the bars)
  if (showRoom > 0) {
    c.save();
    c.beginPath();
    c.rect(a.x, a.y, bb.x - a.x, bb.y - a.y);
    c.clip();
    compositeSub(f, room, showRoom);
    c.restore();
  }
  c.save();
  if (defocus > 0.02) c.filter = `blur(${(22 * defocus * f.pxScale).toFixed(1)}px)`;
  c.transform(K, 0, 0, K, C0.x - PANE.x * K, C0.y - PANE.y * K);
  // the room's light spilling soft onto the wall round the opening, once the wall is near
  if (wallA > 0.05) {
    const cx = HWIN.x + HWIN.w / 2, cy = HWIN.y + HWIN.h / 2;
    const sp = c.createRadialGradient(cx, cy, HWIN.w * 0.45, cx, cy, HWIN.w * 1.6);
    sp.addColorStop(0, withAlpha(env.mood.halo, 0.36 * wallA));
    sp.addColorStop(0.5, withAlpha(env.mood.halo, 0.1 * wallA));
    sp.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = sp;
    c.fillRect(cx - HWIN.w * 2, cy - HWIN.w * 2, HWIN.w * 4, HWIN.w * 4);
    c.restore();
    // the casing: a cut-paper frame round the opening, its sill catching the moon
    c.fillStyle = mixLab(ink, env.mood.set, 0.25);
    const cw = 1.6 * s;
    c.fillRect(HWIN.x - cw, HWIN.y - cw, HWIN.w + 2 * cw, cw);
    c.fillRect(HWIN.x - cw, HWIN.y, cw, HWIN.h);
    c.fillRect(HWIN.x + HWIN.w, HWIN.y, cw, HWIN.h);
    c.fillRect(HWIN.x - cw * 1.6, HWIN.y + HWIN.h, HWIN.w + cw * 3.2, cw * 1.2);
    c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.35 * wallA);
    c.fillRect(HWIN.x - cw * 1.6, HWIN.y + HWIN.h, HWIN.w + cw * 3.2, 0.18 * s);
  }
  // the glazing bars (cut paper), their room-side edges lit by the lamp inside
  c.fillStyle = ink;
  c.fillRect(HEL.x - 0.8 * s, HWIN.y, 1.6 * s, HWIN.h);
  c.fillRect(HWIN.x, HWIN.y + HWIN.h * 0.45, HWIN.w, 1.6 * s);
  c.fillStyle = withAlpha(env.mood.halo, 0.35 * defocus);
  c.fillRect(HEL.x - 0.8 * s - 0.12 * s, HWIN.y, 0.12 * s, HWIN.h);
  c.fillRect(HEL.x + 0.8 * s, HWIN.y, 0.12 * s, HWIN.h);
  c.fillRect(HWIN.x, HWIN.y + HWIN.h * 0.45 + 1.6 * s, HWIN.w, 0.12 * s);
  c.restore();
  // a capped bloom of the window's light (never white): at most ≈55% of the halo, with a vignette kept
  const bloom = 0.55 * Math.sin(Math.PI * Math.min(1, e * 1.25)) * (1 - e);
  if (bloom > 0.01) {
    const g = c.createRadialGradient(640, 360, 60, 640, 360, 820);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.55 * bloom));
    g.addColorStop(0.6, withAlpha(env.mood.halo, 0.25 * bloom));
    g.addColorStop(1, withAlpha(env.mood.ink, 0.25 * bloom));
    c.save();
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = g;
    c.fillRect(-40, -40, 1360, 800);
    c.restore();
  }
}

// =====================================================================================================
// THE INSERT: through the Helsinki window
// =====================================================================================================
function paintInsert(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  // a slow 3% push over the hold
  const u = sm(clamp01((t - b.push0) / (b.wipeOut - b.push0)));
  const cam: Camera3 = { x: lerp(636, 664, u), y: lerp(360, 350, u), z: lerp(0, 30, u), lens: 1 };
  f.camera(cam);
  const tq = tq12(t);
  f.backlight({ sunX: 170, sunY: 210, sunRadius: 360, intensity: 0.12 });
  // L1: the night through the room's own window, upper left: the map's night value (it is night out there), a
  // faint far ridge, and a few motes of snow
  f.layer('L1', (c, env) => {
    const night = c.createLinearGradient(0, -100, 0, 700);
    night.addColorStop(0, mixLab(env.mood.fg, env.mood.ink, 0.35));
    night.addColorStop(1, mixLab(env.mood.fg, env.mood.set, 0.3));
    c.fillStyle = night;
    c.fillRect(-400, -400, 1400, 1400);
    c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.5);
    c.beginPath();
    c.moveTo(-400, 700);
    for (let x = -400; x <= 1000; x += 20) c.lineTo(x, 470 - 40 * Math.abs(Math.sin(x / 160)) - 12 * fbm(x / 50, 3));
    c.lineTo(1000, 700);
    c.closePath();
    c.fill();
    snow(c, { area: { x: -300, y: -300, w: 900, h: 900 }, count: 26, salt: 83, fall: 24, wind: 8, size: 0.9, color: env.mood.core }, env);
  });
  // L2: the back wall: a window hole at upper left, a bookcase at right (baked)
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/ins/L2b/${env.mood.id}`, 1800, 1100, (cc) => {
      cc.translate(260, 200);
      const wall = mixLab(env.fill('set'), env.mood.fg, 0.45);
      const W = { x: 60, y: 96, w: 290, h: 330 };
      cc.fillStyle = wall;
      cc.beginPath();
      cc.rect(-260, -200, 1800, 1100);
      cc.rect(W.x, W.y, W.w, W.h);
      cc.fill('evenodd');
      cc.fillStyle = env.fill('ink');
      cc.fillRect(W.x - 12, W.y - 12, W.w + 24, 12);
      cc.fillRect(W.x - 12, W.y, 12, W.h);
      cc.fillRect(W.x + W.w, W.y, 12, W.h);
      cc.fillRect(W.x - 22, W.y + W.h, W.w + 44, 14);
      cc.fillRect(W.x + W.w / 2 - 4, W.y, 8, W.h);
      for (let j = 1; j < 3; j++) cc.fillRect(W.x, W.y + (W.h * j) / 3 - 4, W.w, 8);
      bookshelfWall(cc, { x: 1000, y: 20, w: 420, h: 520, bays: 2, seed: 61, gaps: 0.3, objects: false, backTone: 0.2 }, env);
    })(c, -260, -200);
  });
  f.fog({ yCenter: 0.5 * 720, height: 0.5 * 720, alpha: 0.14, drift: 4 });
  // L4: the student at the desk, the top sheet rising from its fanfold pile in the lamp light, the lamp
  const sheetFoot = { x: (QUAD.BL.x + QUAD.BR.x) / 2, y: INS.deskY };
  f.layer('L4', (c, env) => {
    const m = env.mood;
    const flick = 0.94 + 0.06 * fbm(t * 6, 19);
    // the chair and the student, seated in profile facing the sheet; the pencil works down the lines (on twos)
    const pen = clamp01((tq - (b.cut1 + 0.2)) / (b.pull0 - b.cut1 - 0.4));
    const lineK = Math.floor(pen * 4 + 1e-6) / 4 + 0.08 * Math.sin(tq * 9) * (pen < 1 ? 1 : 0);
    const ps = withLife({ ...blendPose(READ_HI, READ_LO, clamp01(lineK)) }, tq, 1970, 1);
    const cs = SEAT_H / Math.max(1, -chair.anchors({ x: 0, y: 0 }).seat.y);
    // the fanfold pile, and the top sheet propped up off it, leaning back and turned to the lamp (beyond him)
    fanfold(c, env, 'pile');
    drawSheet(c, sheetCanvas(f, env), env, flick);
    chair(c, { x: INS.x - 6 - 2 * cs, y: INS.floor, s: cs, style: 'wooden', view: 'side' }, env);
    // the darkest shape in the frame: near-black, cut out by a fine rim on the side facing the lamp
    const o = {
      x: INS.x, y: INS.floor, facing: 'right' as const, pose: ps, scale: INS.scale, ink: PUPPET_NEAR_BLACK,
      light: { x: 1, y: -0.4, floor: 0.2 }, edgeRim: { x: 1, y: -0.35, px: 1.5, alpha: 0.75 },
    };
    STUDENT.draw(c, o, env);
    const hand = STUDENT.anchor(o, 'handF');
    // on "rounding" the lamp finds the header, then its glint runs on down to the loop that counts BACKWARDS
    // (DO 20 K = N, 1, -1) and rests there, faint, to the end of the insert (the rhyme for "reverse-mode")
    const hd = sm((t - (b.rounding - 0.15)) / 0.4);
    const run = sm((t - (b.rounding + 0.35)) / 0.45);
    const out = 1 - 0.55 * sm((t - (b.rounding + 1.75)) / 0.5);
    if (hd * out > 0.01) {
      const yHead = 24 + SHEET_TYPE.headerSize * 0.62, yLoop = SHEET_TYPE.codeTop + SHEET_TYPE.codeLead - 10;
      const ly = yHead + (yLoop - yHead) * run;
      // the band hugs the typed text it lights: the header (u 44 → ≈ 386), then the loop line, indented six
      // columns (u ≈ 148 → ≈ 483); its soft ends stay inside the text column, never out in the margin
      const u0 = lerp(36, 136, run), u1 = lerp(400, 500, run);
      const v0 = ly - 20, v1 = ly + 16;
      const P = [sheetPt(u0, v0), sheetPt(u1, v0), sheetPt(u1, v1), sheetPt(u0, v1)];
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(P[0].x, 0, P[1].x, 0);
      const al = 0.36 * hd * out;
      g.addColorStop(0, withAlpha(m.halo, 0));
      g.addColorStop(0.04, withAlpha(m.halo, al));
      g.addColorStop(0.94, withAlpha(m.halo, al));
      g.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = g;
      c.beginPath();
      P.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
      c.closePath();
      c.fill();
      c.restore();
      glow(c, P[0].x + 60, (P[0].y + P[3].y) / 2, 44, m.halo, 0.14 * hd * out);
    }
    // the pencil in his near hand, its point on the line he is reading (down the loop, on twos)
    const lineY = SHEET_TYPE.codeTop + clamp01(lineK) * 2.4 * SHEET_TYPE.codeLead - 8;
    const tip = sheetPt(40, lineY - 6);
    const dx = tip.x - hand.x, dy = tip.y - hand.y, L = Math.max(1, Math.hypot(dx, dy));
    // the point ON the paper: the pencil runs from the fist to the line (a pencil's length at most)
    const len = Math.min(64, L);
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = 3.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(hand.x - (dx / L) * 10, hand.y - (dy / L) * 10);
    c.lineTo(hand.x + (dx / L) * len, hand.y + (dy / L) * len);
    c.stroke();
    // the desk: a lit top edge, the dark front, the fanfold's tail spilling over it
    c.fillStyle = env.fill('ink');
    c.fillRect(-300, INS.deskY, 2000, 600);
    c.fillStyle = withAlpha(m.rim, 0.32);
    c.fillRect(-300, INS.deskY, 2000, 1.6);
    fanfold(c, env, 'spill');
    // the anglepoise at the desk's right end, its head turned down onto the sheet
    anglepoiseLamp(c, LAMP, env);
  });
  f.rim({ x: 0.9, y: -0.4 });
  const bulb = anglepoiseLamp.anchors(LAMP);
  f.practical({ x: bulb.bulb.x, y: bulb.bulb.y, kind: 'lamp', seed: 1971, intensity: 0.9, radius: 70 });
  // the caption, centred under the sheet on a soft plate, with a short vertical leader
  const at = b.thesis - 0.25;
  const A = sm((t - at) / 0.45) * (1 - sm((t - (b.pull0 + 0.05)) / 0.3));
  if (A > 0) {
    const c = f.c;
    const p = toScreen(LAYERS.L4, cam, sheetFoot.x, sheetFoot.y);
    const text = 'thesis: reverse-mode differentiation';
    c.save();
    // a caption to be read: sized to the legibility floor (≥ 22 px cap at 1080p, through the camera)
    c.font = `italic 500 ${legibleSize(c, `italic 500 26px ${FONT.text}`, 26)}px ${FONT.text}`;
    const w = c.measureText(text).width;
    const ty = Math.min(616, p.y + 62);
    c.globalAlpha = A;
    softPlate(c, p.x, ty - 9, w + 120, 64, f.mood.ink, 0.6);
    c.strokeStyle = withAlpha(mixLab(f.mood.rim, f.mood.core, 0.5), 0.85);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(p.x, p.y + 8);
    c.lineTo(p.x, p.y + 8 + 24 * sm((t - at) / 0.3));
    c.stroke();
    c.fillStyle = textColor(f.mood);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText(text, p.x, ty);
    c.restore();
  }
}

/** the projective map of the sheet (canvas units u ∈ [0, SW], v ∈ [0, SH]) onto QUAD (world) */
const HOMO = (() => {
  const { TL: p0, TR: p1, BR: p2, BL: p3 } = QUAD;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dy1 = p1.y - p2.y, dy2 = p3.y - p2.y;
  const sx = p0.x - p1.x + p2.x - p3.x, sy = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  return {
    a: p1.x - p0.x + g * p1.x, b: p3.x - p0.x + h * p3.x, c: p0.x,
    d: p1.y - p0.y + g * p1.y, e: p3.y - p0.y + h * p3.y, f: p0.y, g, h,
  };
})();
function sheetPt(u: number, v: number): { x: number; y: number } {
  const U = u / SW, V = v / SH, H = HOMO;
  const w = H.g * U + H.h * V + 1;
  return { x: (H.a * U + H.b * V + H.c) / w, y: (H.d * U + H.e * V + H.f) / w };
}
const QB = (() => {
  const xs = [QUAD.TL.x, QUAD.TR.x, QUAD.BR.x, QUAD.BL.x], ys = [QUAD.TL.y, QUAD.TR.y, QUAD.BR.y, QUAD.BL.y];
  const x = Math.floor(Math.min(...xs)) - 4, y = Math.floor(Math.min(...ys)) - 4;
  return { x, y, w: Math.ceil(Math.max(...xs)) + 4 - x, h: Math.ceil(Math.max(...ys)) + 4 - y };
})();
function quadPath(): Path2D {
  const p = new Path2D();
  p.moveTo(QUAD.TL.x, QUAD.TL.y);
  p.lineTo(QUAD.TR.x, QUAD.TR.y);
  p.lineTo(QUAD.BR.x, QUAD.BR.y);
  p.lineTo(QUAD.BL.x, QUAD.BL.y);
  p.closePath();
  return p;
}

/**
 * the top sheet, painted once per mood and warped once onto its quad (a fine triangle mesh, each cell an affine
 * piece of the projective map), into a bitmap covering the quad's bounds; the lamp flicker is applied when drawn
 */
const sheetCanvases = new Map<string, HTMLCanvasElement>();
function sheetCanvas(f: Frame, env: PaintEnv): HTMLCanvasElement {
  const px = f.pxScale;
  const key = `${env.mood.id}/${px}`;
  let out = sheetCanvases.get(key);
  if (out) return out;
  const src = makeCanvas(Math.ceil(SW * px), Math.ceil(SH * px));
  const g = src.getContext('2d')!;
  g.scale(px, px);
  printoutSheet(g, { x: 0, y: 0, w: SW, h: SH, light: 0.92, rot: 0, ...SHEET_TYPE }, env);
  out = makeCanvas(Math.ceil(QB.w * px), Math.ceil(QB.h * px));
  const o = out.getContext('2d')!;
  const NU = 16, NV = 12;
  const dst = (u: number, v: number) => {
    const p = sheetPt(u, v);
    return { x: (p.x - QB.x) * px, y: (p.y - QB.y) * px };
  };
  const tri = (s0: number[], s1: number[], s2: number[]) => {
    const d0 = dst(s0[0], s0[1]), d1 = dst(s1[0], s1[1]), d2 = dst(s2[0], s2[1]);
    const [x0, y0, x1, y1, x2, y2] = [s0[0] * px, s0[1] * px, s1[0] * px, s1[1] * px, s2[0] * px, s2[1] * px];
    const den = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
    const A = (d0.x * (y1 - y2) + d1.x * (y2 - y0) + d2.x * (y0 - y1)) / den;
    const Cx = (d0.x * (x2 - x1) + d1.x * (x0 - x2) + d2.x * (x1 - x0)) / den;
    const E = (d0.x * (x1 * y2 - x2 * y1) + d1.x * (x2 * y0 - x0 * y2) + d2.x * (x0 * y1 - x1 * y0)) / den;
    const B = (d0.y * (y1 - y2) + d1.y * (y2 - y0) + d2.y * (y0 - y1)) / den;
    const D = (d0.y * (x2 - x1) + d1.y * (x0 - x2) + d2.y * (x1 - x0)) / den;
    const F = (d0.y * (x1 * y2 - x2 * y1) + d1.y * (x2 * y0 - x0 * y2) + d2.y * (x0 * y1 - x1 * y0)) / den;
    // clip to the destination triangle, pushed out 0.7 px from its centroid (no seams between cells)
    const cx = (d0.x + d1.x + d2.x) / 3, cy = (d0.y + d1.y + d2.y) / 3;
    const grow = (p: { x: number; y: number }) => {
      const l = Math.hypot(p.x - cx, p.y - cy) || 1;
      return { x: p.x + ((p.x - cx) / l) * 0.7, y: p.y + ((p.y - cy) / l) * 0.7 };
    };
    const [q0, q1, q2] = [grow(d0), grow(d1), grow(d2)];
    o.save();
    o.beginPath();
    o.moveTo(q0.x, q0.y);
    o.lineTo(q1.x, q1.y);
    o.lineTo(q2.x, q2.y);
    o.closePath();
    o.clip();
    o.setTransform(A, B, Cx, D, E, F);
    o.drawImage(src, 0, 0);
    o.restore();
  };
  for (let j = 0; j < NV; j++) {
    for (let i = 0; i < NU; i++) {
      const u0 = (i / NU) * SW, u1 = ((i + 1) / NU) * SW, v0 = (j / NV) * SH, v1 = ((j + 1) / NV) * SH;
      tri([u0, v0], [u1, v0], [u1, v1]);
      tri([u0, v0], [u1, v1], [u0, v1]);
    }
  }
  sheetCanvases.set(key, out);
  if (sheetCanvases.size > 6) sheetCanvases.delete(sheetCanvases.keys().next().value as string);
  return out;
}
/** draw the warped sheet, shaded away from the lamp (its left end in the room's dark) with the lamp's flicker */
function drawSheet(c: C, cv: HTMLCanvasElement, env: PaintEnv, light: number) {
  const m = env.mood;
  // the contact shadow the leaning sheet throws back onto the pile and the desk, away from the lamp
  c.fillStyle = withAlpha(m.ink, 0.35);
  c.beginPath();
  c.moveTo(QUAD.BL.x - 4, QUAD.BL.y);
  c.lineTo(QUAD.BR.x, QUAD.BR.y);
  c.lineTo(QUAD.BR.x - 60, QUAD.BR.y + 6);
  c.lineTo(QUAD.BL.x - 70, QUAD.BL.y + 8);
  c.closePath();
  c.fill();
  c.drawImage(cv, QB.x, QB.y, QB.w, QB.h);
  const q = quadPath();
  const g = c.createLinearGradient(QUAD.BL.x, 0, QUAD.BR.x, 0);
  g.addColorStop(0, withAlpha(m.ink, 0.3 + (1 - light) * 0.5));
  g.addColorStop(0.55, withAlpha(m.ink, 0.06 + (1 - light) * 0.5));
  g.addColorStop(1, withAlpha(m.ink, (1 - light) * 0.5));
  c.fillStyle = g;
  c.fill(q);
  // the fold along its foot and the top edge catching the lamp
  c.strokeStyle = withAlpha(mixLab(m.core, m.rim, 0.5), 0.45);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(QUAD.TL.x, QUAD.TL.y);
  c.lineTo(QUAD.TR.x, QUAD.TR.y);
  c.stroke();
}
/** the fanfold pile under the sheet, and its tail spilling over the desk's front edge in folds */
function fanfold(c: C, env: PaintEnv, part: 'pile' | 'spill') {
  const m = env.mood;
  const paperDim = mixLab(mixLab(m.set, m.setHaze, 0.5), m.core, 0.3);
  if (part === 'pile') {
    for (let i = 0; i < 8; i++) {
      const y = INS.deskY - (i + 1) * (STACK.h / 8);
      const off = (i % 2 ? 6 : -4) + 2 * hash1(i, 5);
      c.fillStyle = mixLab(paperDim, m.fg, 0.3 - 0.03 * i);
      c.fillRect(STACK.x + off, y, STACK.w, STACK.h / 8 + 0.5);
      c.fillStyle = withAlpha(mixLab(m.core, m.rim, 0.5), 0.22 + 0.04 * i);
      c.fillRect(STACK.x + off + (i % 2 ? STACK.w - 16 : 0), y, 16, 1.4);
      c.fillStyle = withAlpha(m.fg, 0.45);
      c.fillRect(STACK.x + off, y + STACK.h / 8 - 0.8, STACK.w, 0.8);
    }
    return;
  }
  // the tail: three panels zig-zagging down the desk's front, toward us, in the shadow under the desk top
  const X0 = 1036, W = 128;
  const folds = [
    [INS.deskY, 0, 0],
    [INS.deskY + 58, -16, 12],
    [INS.deskY + 112, 6, -6],
    [INS.deskY + 190, -10, 8],
  ];
  for (let i = 0; i < folds.length - 1; i++) {
    const [ya, xa, sa] = folds[i], [yb, xb, sb] = folds[i + 1];
    const lit = i % 2 ? 0.18 : 0.34;
    c.fillStyle = mixLab(mixLab(paperDim, m.fg, 0.66), m.core, lit * 0.3);
    c.beginPath();
    c.moveTo(X0 + xa, ya + sa * 0.2);
    c.lineTo(X0 + xa + W, ya - sa * 0.2);
    c.lineTo(X0 + xb + W, yb - sb * 0.2);
    c.lineTo(X0 + xb, yb + sb * 0.2);
    c.closePath();
    c.fill();
    // sprocket holes down both edges
    c.fillStyle = withAlpha(m.ink, 0.6);
    for (let k = 1; k < 4; k++) {
      const u = k / 4;
      const y = ya + (yb - ya) * u;
      const x = X0 + xa + (xb - xa) * u;
      c.fillRect(x + 4, y - 1.2, 3, 3);
      c.fillRect(x + W - 7, y - 1.2, 3, 3);
    }
    // the fold edge catching the lamp
    c.fillStyle = withAlpha(mixLab(m.core, m.rim, 0.5), 0.35);
    c.fillRect(X0 + xb, yb - 1, W, 1.6);
  }
}
