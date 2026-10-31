/**
 * neural-net-history — ch11 kit (one animator's group: ch11-s01, -s02, -s03, -s05, -s08).
 *
 *   canyon(c, P, o)                 the LIBRARY OF RAW TEXT: a one-point canyon of paper-cut bookshelves to the
 *                                   horizon, spines unlabelled (near: a wall of books; far: the long hanging pages
 *                                   of an encyclopedia). Drawn around a vanishing point (o.cx, o.cy) at scale o.s;
 *                                   colours from palette P (serverCyan). Pure geometry, cache it.
 *   libraryRoom(f, o)               the STUDY room (as studyRoom) but its window looks onto the library (serverCyan
 *                                   glow through the glass, STUDY LOCK: the only cyan besides the X-ray practical)
 *   paintLibrary(g, o)              the whole library scene as a frame painter (L0 → L5), for ch11-s01's push
 *                                   through the window and ch11-s02's window insert
 *   lanternMachine(c, env, o)       a small paper-cut automaton with a lantern head (walks on twos)
 *   coatHook / frockAt / overcoatAt the brass hook and the two coats (the ch07 frock re-cut into a long overcoat)
 *   bigTag(c, env, o)               a manila luggage tag with one or two mono lines (legible at a coat close-up)
 *   monoDate(c, m, t, at, text)     a 2018-era date stamp (IBM Plex Mono) typed on bottom-left, on a soft plate
 *   capLine(c, m, text, x, y, a)    a small mono caption on a soft ink plate (screen-locked)
 */
import type { Camera3, Frame, LayerSpec, MoodId, PaintEnv, Palette } from '../../../film';
import { LAYERS, MOODS, hash1, mixLab, overscan, withAlpha } from '../../../film';
import { bookshelfWall } from '../../../film/silhouette/architecture';
import { FONT } from '../../../film/silhouette/type';
import { STUDY, STUDY_WALL } from './study';
import { HAND_LEN, narratorHands, type Held, type HandShapeN, type HandsPose, type HeldDraw, type Pt } from './narratorHands';

export { clamp01, sm, lerp, win, tq12 } from './ch02-s05b-util';
export { subFrame, compositeSub, smearX } from './ch02-s05b-util';
export { mixCam, camPath } from './ch03-s01-kit';

type C = CanvasRenderingContext2D;
type R = { x: number; y: number; w: number; h: number };
const rk = (r: R) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
const bake = (f: Frame, c: C, key: string, r: R, paint: (cc: C) => void, blur?: number) =>
  f.cached(`${key}/${rk(r)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  }, blur ? { blur } : undefined)(c, r.x, r.y);

// =====================================================================================================
// THE CANYON (library of raw text)
// =====================================================================================================
export interface CanyonOpts {
  cx: number;
  cy: number;
  s: number;
  /** depth where books give way to the encyclopedia's long pages */
  pagesFrom?: number;
  seed?: number;
  /** draw the floor */
  floor?: boolean;
}
const Z0 = 0.42, Z1 = 13;
export function canyon(c: C, P: Palette, o: CanyonOpts) {
  const { cx, cy, s } = o;
  const seed = o.seed ?? 11;
  const ZP = o.pagesFrom ?? 4.6;
  const XW = 430; // lateral half-width of the aisle
  const YF = 300; // floor
  const YT = -760; // top of the stacks
  const SH = 118; // shelf pitch
  const X = (lat: number, z: number) => cx + (lat * s) / z;
  const Y = (h: number, z: number) => cy + (h * s) / z;
  const NB = 14;
  const tone = (z: number) => Math.min(1, Math.max(0, Math.log(z / Z0) / Math.log(Z1 / Z0)));
  const bandCol = (b: number, kind: 'book' | 'back' | 'page' | 'board') => {
    const u = b / (NB - 1);
    // near faces in set ink (one step lighter than the machines); the haze and the vanishing backlight carry the
    // brightness into depth (review round 1: "pale shelves read as flat vector illustration")
    const uu = u * u * (3 - 2 * u);
    if (kind === 'book') return mixLab(mixLab(P.ink, P.set, 0.55), P.sky[2], 0.03 + 0.8 * uu);
    if (kind === 'board') return mixLab(P.fg, P.sky[2], 0.02 + 0.78 * uu);
    if (kind === 'back') return mixLab(mixLab(P.set, P.fg, 0.4), P.sky[3], 0.08 + 0.8 * uu);
    return mixLab(mixLab(P.rim, P.haze, 0.45), P.sky[3], 0.3 + 0.55 * u);
  };
  for (const side of [-1, 1]) {
    const lat = side * XW;
    // the wall plane behind the books (a lighter back so the spines read), to the far end
    const back = c.createLinearGradient(X(lat, Z0), 0, X(lat, Z1), 0);
    back.addColorStop(0, bandCol(0, 'back'));
    back.addColorStop(1, bandCol(NB - 1, 'back'));
    c.fillStyle = back;
    c.beginPath();
    c.moveTo(X(lat, Z0), Y(YT, Z0));
    c.lineTo(X(lat, Z1), Y(YT, Z1));
    c.lineTo(X(lat, Z1), Y(YF, Z1));
    c.lineTo(X(lat, Z0), Y(YF, Z0));
    c.closePath();
    c.fill();
    // books, batched by depth band
    const paths = Array.from({ length: NB }, () => new Path2D());
    const pages = Array.from({ length: NB }, () => new Path2D());
    const boards = Array.from({ length: NB }, () => new Path2D());
    for (let row = 0; row < 9; row++) {
      const yb = YF - 40 - row * SH; // shelf board (books stand on it)
      if (yb - SH < YT - 10) break;
      let z = Z0;
      let i = 0;
      while (z < ZP) {
        i++;
        const r1 = hash1(i * 13 + row * 977 + side * 31, seed);
        const r2 = hash1(i * 7 + row * 311 + side * 17, seed + 1);
        const dz = (0.02 + 0.016 * (r1 * 0.5 + 0.5)) * Math.min(1, 0.55 + z * 0.25);
        if (r2 > 0.86) {
          z += dz * 1.4; // a gap
          continue;
        }
        const h = SH * (0.6 + 0.3 * (r2 * 0.5 + 0.5));
        const z2 = z + dz * 0.92;
        const b = Math.min(NB - 1, Math.floor(tone(z) * NB));
        const p = paths[b];
        p.moveTo(X(lat, z), Y(yb - h, z));
        p.lineTo(X(lat, z2), Y(yb - h, z2));
        p.lineTo(X(lat, z2), Y(yb, z2));
        p.lineTo(X(lat, z), Y(yb, z));
        p.closePath();
        z += dz;
      }
      // the shelf board, the whole run
      for (let b = 0; b < NB; b++) {
        const za = Z0 * Math.pow(Z1 / Z0, b / NB), zb = Z0 * Math.pow(Z1 / Z0, (b + 1) / NB);
        if (za > ZP) break;
        const zz = Math.min(zb, ZP);
        const q = boards[b];
        q.moveTo(X(lat, za), Y(yb, za));
        q.lineTo(X(lat, zz), Y(yb, zz));
        q.lineTo(X(lat, zz), Y(yb + 9, zz));
        q.lineTo(X(lat, za), Y(yb + 9, za));
        q.closePath();
      }
    }
    // the far section: long pages hanging floor to top (the encyclopedia), thin sheets with gaps
    let z = ZP;
    let k = 0;
    while (z < Z1) {
      k++;
      const r = hash1(k * 19 + side * 7, seed + 3);
      const dz = 0.05 + 0.03 * (r * 0.5 + 0.5);
      const z2 = z + dz * 0.7;
      const top = YT + 30 + 26 * (hash1(k, seed + 4) * 0.5 + 0.5);
      const bot = YF - 30 - 60 * (hash1(k, seed + 5) * 0.5 + 0.5);
      const b = Math.min(NB - 1, Math.floor(tone(z) * NB));
      const p = pages[b];
      p.moveTo(X(lat, z), Y(top, z));
      p.lineTo(X(lat, z2), Y(top, z2));
      p.lineTo(X(lat, z2), Y(bot, z2));
      p.lineTo(X(lat, z), Y(bot + 8, z));
      p.closePath();
      z += dz;
    }
    for (let b = 0; b < NB; b++) {
      c.fillStyle = bandCol(b, 'book');
      c.fill(paths[b]);
      c.fillStyle = bandCol(b, 'board');
      c.fill(boards[b]);
      c.fillStyle = withAlpha(bandCol(b, 'page'), 0.85);
      c.fill(pages[b]);
    }
    // the stack top: an uneven crest of piled books against the sky
    c.fillStyle = bandCol(2, 'board');
    c.beginPath();
    c.moveTo(X(lat, Z0), Y(YT, Z0));
    for (let j = 0; j <= 60; j++) {
      const zz = Z0 * Math.pow(Z1 / Z0, j / 60);
      const bump = 26 * (hash1(j, seed + 9) * 0.5 + 0.5);
      c.lineTo(X(lat, zz), Y(YT - bump, zz));
    }
    c.lineTo(X(lat, Z1), Y(YT, Z1));
    c.closePath();
    c.fill();
  }
  if (o.floor !== false) {
    // the floor of the aisle: dark boards, a pale runner of backlight along its centre
    c.fillStyle = mixLab(P.fg, P.set, 0.4);
    c.beginPath();
    c.moveTo(X(-XW, Z0), Y(YF, Z0));
    c.lineTo(X(-XW, Z1), Y(YF, Z1));
    c.lineTo(X(XW, Z1), Y(YF, Z1));
    c.lineTo(X(XW, Z0), Y(YF, Z0));
    c.closePath();
    c.fill();
    const g = c.createLinearGradient(0, Y(YF, Z1), 0, Y(YF, Z0 * 2));
    g.addColorStop(0, withAlpha(P.sky[3], 0.28));
    g.addColorStop(1, withAlpha(P.sky[2], 0));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(X(-90, Z0 * 2), Y(YF, Z0 * 2));
    c.lineTo(X(-60, Z1), Y(YF, Z1));
    c.lineTo(X(60, Z1), Y(YF, Z1));
    c.lineTo(X(90, Z0 * 2), Y(YF, Z0 * 2));
    c.closePath();
    c.fill();
  }
}

// =====================================================================================================
// THE STUDY ROOM with the library in the window
// =====================================================================================================
/** the library's vanishing point in the study's L1 world (behind the window at x 1990…2290) */
export const LIBV = { x: 2140, y: 500 } as const;
/** a camera square-on to the study window (its library glow) */
export const WINDOW_CAM: Camera3 = { x: STUDY.window.x + STUDY.window.w / 2, y: 470, z: 160, lens: 1 };

export interface LibraryRoomOpts {
  key: string;
  cams: Camera3[];
  lamp?: number;
  fog?: number;
  /** extra brightness of the window's cyan (a beat glances at it) */
  windowGlow?: number;
  /** draw the library canyon on a nearer, crisper plane (a window glance where the shelves are the hero) */
  crisp?: boolean;
  /** extra warm ambient on the wall around the window (0..1; 1 ≈ +25 % exposure near the glass) */
  ambient?: number;
}
/** the plane the library is drawn on for a crisp window glance (behind the study wall, little haze, little blur) */
export const LIB_WINDOW: LayerSpec = { id: 'libWindow', z: 2300, haze: 0.22, blur: 0.5 };
export function libraryRoom(f: Frame, o: LibraryRoomOpts) {
  const lamp = o.lamp ?? 1;
  f.backlight({ sunX: STUDY.window.x + STUDY.window.w / 2, sunY: 520, sunRadius: 520, intensity: 0.6 });
  const W = STUDY.window;
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 80);
    bake(f, c, `${o.key}/libroom/L1/${rk(r)}`, r, (cc) => {
      const P = MOODS.serverCyan;
      const sky = cc.createLinearGradient(0, r.y, 0, r.y + r.h);
      sky.addColorStop(0, P.sky[0]);
      sky.addColorStop(0.45, P.sky[1]);
      sky.addColorStop(0.7, P.sky[3]);
      sky.addColorStop(1, P.sky[2]);
      cc.fillStyle = sky;
      cc.fillRect(r.x, r.y, r.w, r.h);
      // the window centre in L1 world at the window camera: the library runs away from the glass
      if (!o.crisp) {
        cc.save();
        cc.globalAlpha = 0.95;
        canyon(cc, mixPal(P, 0.18), { cx: LIBV.x, cy: LIBV.y, s: 1, seed: 11 });
        cc.restore();
      }
      void env;
    });
    if ((o.windowGlow ?? 0) > 0) {
      const g = c.createRadialGradient(LIBV.x, LIBV.y, 10, LIBV.x, LIBV.y, 520);
      g.addColorStop(0, withAlpha(MOODS.serverCyan.halo, 0.35 * (o.windowGlow ?? 0)));
      g.addColorStop(1, withAlpha(MOODS.serverCyan.halo, 0));
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = g;
      c.fillRect(LIBV.x - 520, LIBV.y - 520, 1040, 1040);
      c.restore();
    }
  });
  if (o.crisp) {
    f.layer(LIB_WINDOW, (c) => {
      const r = overscan(LIB_WINDOW, o.cams, 80);
      bake(f, c, `${o.key}/libroom/crisp/${rk(r)}`, r, (cc) => canyon(cc, mixPal(MOODS.serverCyan, 0.06), { cx: LIBV.x, cy: LIBV.y, s: 1, seed: 11 }));
    });
    // haze between the glass and the shelves
    f.fog({ yCenter: 0.55 * 720, height: 0.5 * 720, alpha: 0.12, drift: 5 });
  }
  f.layer(STUDY_WALL, (c, env) => {
    const r = overscan(STUDY_WALL, o.cams, 60);
    bake(f, c, `${o.key}/libroom/wall/${env.mood.id}/${lamp.toFixed(2)}`, r, (cc) => {
      const wall = mixLab(env.fill('set'), env.mood.fg, 0.25);
      cc.fillStyle = wall;
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(W.x, W.y, W.w, W.h);
      cc.fill('evenodd');
      const pool = cc.createRadialGradient(780, 420, 40, 780, 420, 1250);
      pool.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.25), 0.85 * lamp));
      pool.addColorStop(0.5, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.12), 0.45 * lamp));
      pool.addColorStop(1, withAlpha(wall, 0));
      cc.save();
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(W.x, W.y, W.w, W.h);
      cc.clip('evenodd');
      cc.fillStyle = pool;
      cc.fillRect(r.x, r.y, r.w, r.h);
      // the window's cyan spill on the wall around it (era colour only through the glass)
      const sp = cc.createRadialGradient(W.x + W.w / 2, W.y + W.h * 0.55, 60, W.x + W.w / 2, W.y + W.h * 0.55, 620);
      sp.addColorStop(0, withAlpha(MOODS.serverCyan.halo, 0.16));
      sp.addColorStop(1, withAlpha(MOODS.serverCyan.halo, 0));
      cc.fillStyle = sp;
      cc.fillRect(W.x - 700, W.y - 300, W.w + 1400, W.h + 600);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.1);
      cc.lineWidth = 1.4;
      for (let x = Math.floor(r.x / 240) * 240; x < r.x + r.w; x += 240) cc.strokeRect(x + 14, 1080, 212, 180);
      cc.fillStyle = withAlpha(env.mood.fg, 0.6);
      cc.fillRect(r.x, -18, r.w, 10);
      cc.fillRect(r.x, 1060, r.w, 12);
      cc.restore();
      cc.fillStyle = env.fill('ink');
      const bar = 9;
      cc.fillRect(W.x - 16, W.y - 16, W.w + 32, 16);
      cc.fillRect(W.x - 16, W.y, 16, W.h);
      cc.fillRect(W.x + W.w, W.y, 16, W.h);
      cc.fillRect(W.x - 30, W.y + W.h, W.w + 60, 22);
      for (let i = 1; i < 3; i++) cc.fillRect(W.x + (W.w * i) / 3 - bar / 2, W.y, bar, W.h);
      for (let j = 1; j < 6; j++) cc.fillRect(W.x, W.y + (W.h * j) / 6 - bar / 2, W.w, bar);
      cc.fillStyle = withAlpha(MOODS.serverCyan.rim, 0.35);
      cc.fillRect(W.x - 16, W.y - 16, 1.5, W.h + 16);
      cc.fillRect(W.x - 30, W.y + W.h, W.w + 60, 1.5);
      bookshelfWall(cc, { x: -660, y: -120, w: 620, h: 1180, bays: 3, seed: 43, gaps: 0.22, objects: true, backTone: 0.25 }, env);
    });
  });
  const amb = o.ambient ?? 0;
  if (amb > 0) {
    // the study's lamp-lit exposure carried to the window wall (a warm wash, not a fade)
    f.layer(STUDY_WALL, (c, env) => {
      c.save();
      c.globalCompositeOperation = 'screen';
      const cx = W.x + W.w / 2 - 260, cy = W.y + W.h * 0.55;
      const g = c.createRadialGradient(cx, cy, 60, cx, cy, 1100);
      g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.45), 0.34 * amb));
      g.addColorStop(0.6, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.3), 0.18 * amb));
      g.addColorStop(1, withAlpha(env.mood.set, 0));
      c.fillStyle = g;
      c.fillRect(cx - 1100, cy - 1100, 2200, 2200);
      c.restore();
    });
  }
  f.fog({ yCenter: 0.6 * 720, height: 0.4 * 720, alpha: 0.16 * (o.fog ?? 1), drift: 6 });
}

/** a palette nudged toward its haze (the view through glass) */
function mixPal(P: Palette, u: number): Palette {
  const m = (k: keyof Palette) => mixLab(P[k] as string, P.haze, u);
  return { ...P, ink: m('ink'), set: m('set'), fg: m('fg'), setHaze: m('setHaze') };
}

// =====================================================================================================
// THE LIBRARY as a whole scene (serverCyan)
// =====================================================================================================
export interface LibraryPaint {
  key: string;
  cam: Camera3;
  cams: Camera3[];
  t: number;
  /** draw the action plane (machines, slug lines) */
  action?: (c: C, env: PaintEnv) => void;
  /** practical lights after the rim (the machines' lanterns) */
  lights?: (g: Frame) => void;
  /** the windows' shelves glance: no tag on any shelf (ch11-s02 just shows the canyon) */
  near?: boolean;
  /** a blurred near shelf-end at frame left (L5 world x of its right edge), sliding with the drift */
  edgeX?: number;
}
export function paintLibrary(g: Frame, o: LibraryPaint) {
  g.camera(o.cam);
  g.backlight({ sunX: 640, sunY: 372, sunRadius: 420, intensity: 1.1 });
  g.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 60);
    bake(g, c, `${o.key}/lib/L1/${env.mood.id}`, r, (cc) => {
      // far pages hanging at the vanishing end, a thin forest of pale sheets
      for (let i = 0; i < 120; i++) {
        const x = 560 + (i / 119) * 160 + hash1(i, 3) * 3;
        const top = 300 + 6 * hash1(i, 4);
        const bot = 400 - 8 * (hash1(i, 5) * 0.5 + 0.5);
        cc.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.sky[3], 0.6), 0.25 + 0.15 * (hash1(i, 6) * 0.5 + 0.5));
        if (Math.abs(x - 640) > 34) cc.fillRect(x, top, 0.8, bot - top);
      }
    });
  });
  g.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    bake(g, c, `${o.key}/lib/L2b/${env.mood.id}`, r, (cc) => canyon(cc, env.mood, { cx: 640, cy: 372, s: 1, seed: 11 }));
    // the vanishing-point backlight: the far end of the canyon glows through the haze
    c.save();
    c.globalCompositeOperation = 'lighter';
    const vg = c.createRadialGradient(640, 372, 8, 640, 372, 360);
    vg.addColorStop(0, withAlpha(env.mood.halo, 0.42));
    vg.addColorStop(0.35, withAlpha(env.mood.halo, 0.14));
    vg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = vg;
    c.fillRect(280, 12, 720, 720);
    c.restore();
  });
  g.fog({ yCenter: 0.56 * 720, height: 0.42 * 720, alpha: 0.24, drift: 7 });
  g.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, o.cams, 60);
    bake(g, c, `${o.key}/lib/L3b/${env.mood.id}`, r, (cc) => {
      // two nearer stack-ends framing the aisle (end-on bookcases, unlabelled spines), in set ink: one step lighter
      // than the machines, the spines only just separating from the boards; a cool edge toward the aisle
      bookshelfWall(cc, { x: r.x - 40, y: 40, w: 240 - (r.x - 40) + 20, h: 640, bays: 1, shelves: 6, seed: 61, gaps: 0.12, objects: false, backTone: 0.12 }, env);
      bookshelfWall(cc, { x: 1060, y: 40, w: r.x + r.w - 1060 + 40, h: 640, bays: 1, shelves: 6, seed: 67, gaps: 0.12, objects: false, backTone: 0.12 }, env);
      cc.save();
      cc.globalCompositeOperation = 'source-atop';
      const set = mixLab(env.mood.ink, env.mood.set, 0.45);
      for (const [x0, x1] of [[r.x - 40, 260], [1040, r.x + r.w + 40]] as const) {
        const towardAisle = x0 < 640 ? x1 : x0;
        const gr = cc.createLinearGradient(towardAisle, 0, x0 < 640 ? x0 : x1, 0);
        gr.addColorStop(0, withAlpha(set, 0.62));
        gr.addColorStop(0.25, withAlpha(set, 0.8));
        gr.addColorStop(1, withAlpha(set, 0.88));
        cc.fillStyle = gr;
        cc.fillRect(x0, -100, x1 - x0, 900);
      }
      cc.restore();
      // the edge toward the aisle catches the vanishing backlight
      cc.fillStyle = withAlpha(env.mood.rim, 0.35);
      cc.fillRect(258, 40, 1.6, 640);
      cc.fillRect(1060, 40, 1.6, 640);
    });
  });
  g.fog('B');
  g.layer('L4', (c, env) => {
    // the walkway ledge the machines cross: a long low reading-desk rail in the aisle
    const r = overscan(LAYERS.L4, o.cams, 40);
    c.fillStyle = env.fill('ink');
    c.fillRect(r.x, 606, r.w, r.y + r.h - 606);
    c.fillStyle = withAlpha(env.mood.rim, 0.3);
    c.fillRect(r.x, 606, r.w, 1.4);
    o.action?.(c, env);
  });
  g.rim({ x: 0, y: -1 });
  o.lights?.(g);
  if (o.edgeX !== undefined) {
    const ex = o.edgeX;
    g.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, o.cams, 40);
      bake(g, c, `${o.key}/lib/L5edge/${env.mood.id}/${Math.round(ex)}`, r, (cc) => {
        // a near stack-end at frame left: its upright, shelf lips and a few spines, out of focus
        const ink = mixLab(env.mood.ink, '#000000', 0.15);
        cc.fillStyle = ink;
        cc.fillRect(r.x - 10, -300, ex - (r.x - 10), 1400);
        for (let j = 0; j < 10; j++) {
          const y = -60 + j * 110;
          cc.fillRect(ex - 4, y, 46, 12);
          for (let q = 0; q < 3; q++) cc.fillRect(ex + 2 + q * 11, y - 46 - 26 * (hash1(j * 3 + q, 71) * 0.5 + 0.5), 8, 46 + 26 * (hash1(j * 3 + q, 71) * 0.5 + 0.5));
        }
        cc.fillStyle = withAlpha(env.mood.rim, 0.28);
        cc.fillRect(ex - 1, -300, 2, 1400);
      }, 5);
    });
  }
  if (o.near !== false) {
    g.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, o.cams, 40);
      bake(g, c, `${o.key}/lib/L5/${env.mood.id}`, r, (cc) => {
        // a near stack's edge at frame left, out of focus
        cc.fillStyle = env.fill('fg');
        cc.fillRect(r.x - 10, -200, 110 - r.x, 1200);
        for (let j = 0; j < 9; j++) cc.fillRect(90, -40 + j * 96, 40, 8);
      }, 4);
    });
  }
}

// =====================================================================================================
// LANTERN MACHINES
// =====================================================================================================
export interface MachineOpts {
  x: number;
  /** feet line */
  y: number;
  facing: 1 | -1;
  /** twos time for the walk */
  tq: number;
  /** walking 0..1 (0 = standing) */
  walk: number;
  s?: number;
  /** lantern brightness 0..1 */
  lit?: number;
  /** beams: 'forward' (GPT) | 'both' (BERT) | 'none' (use beamTo) */
  beams: 'forward' | 'both' | 'none';
  /** beams aimed at points (world): soft cones from the lantern that land on each point */
  beamTo?: { x: number; y: number; a?: number }[];
  /** 'writer' (GPT: one arm forward with a setting stylus) | 'reader' (BERT: both arms out) */
  variant?: 'writer' | 'reader';
  /** seconds per step (default 0.45) */
  stride?: number;
  /** beam reach in px */
  reach?: number;
  ink?: string;
}
/** returns the lantern centre (world) */
export function lanternMachine(c: C, env: PaintEnv, o: MachineOpts): { x: number; y: number } {
  const s = o.s ?? 1;
  const m = env.mood;
  const ink = o.ink ?? env.fill('ink');
  const ph = (o.tq / (o.stride ?? 0.45)) % 1; // one step per stride, posed on twos
  const step = o.walk * Math.sin(ph * Math.PI * 2);
  c.save();
  c.translate(o.x, o.y);
  c.scale(s * o.facing, s);
  // legs: two jointed paper legs (rigid parts rotate), feet planted alternately
  c.fillStyle = ink;
  for (const [sg, a] of [[1, step], [-1, -step]] as const) {
    c.save();
    c.translate(sg * 7, -50);
    c.rotate(0.32 * a);
    c.fillRect(-3, 0, 6, 27);
    c.beginPath();
    c.arc(0, 26, 3.6, 0, Math.PI * 2);
    c.fill();
    c.translate(0, 26);
    c.rotate(-0.3 * Math.max(0, a * sg));
    c.fillRect(-2.6, 0, 5.2, 22);
    c.fillRect(-4, 21, 15, 4);
    c.restore();
  }
  // body: a small round-shouldered cabinet with a crank and a reading arm, then the lantern on a neck
  const bob = o.walk * Math.abs(Math.sin(ph * Math.PI * 2)) * 1.5;
  c.translate(0, -bob);
  c.beginPath();
  c.roundRect(-20, -84, 40, 38, 9);
  c.fill();
  c.fillRect(-3.5, -96, 7, 14);
  if (o.variant === 'reader') {
    // both arms held out, palms open, as if feeling the words on either side
    for (const sg of [1, -1]) {
      c.save();
      c.translate(sg * 18, -74);
      c.rotate(sg * 0.5);
      c.fillRect(sg > 0 ? 0 : -24, -2, 24, 4);
      c.translate(sg * 24, 0);
      c.rotate(sg * 0.5);
      c.fillRect(sg > 0 ? 0 : -12, -1.6, 12, 3.2);
      c.beginPath();
      c.arc(sg * 13, 0, 3.4, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  } else {
    c.fillRect(-27, -76, 8, 3); // crank
    c.beginPath();
    c.arc(-28, -74, 3, 0, Math.PI * 2);
    c.fill();
    // the setting arm, reaching forward and down to the line of type, a stylus at its end
    c.save();
    c.translate(16, -70);
    c.rotate(0.9 + 0.12 * Math.sin(ph * Math.PI * 2));
    c.fillRect(0, -2, 26, 4);
    c.translate(26, 0);
    c.rotate(0.6);
    c.fillRect(0, -1.6, 14, 3.2);
    c.fillRect(12, -0.8, 12, 1.6);
    c.restore();
  }
  // cut-lines on the cabinet (a door seam, rivets)
  c.strokeStyle = withAlpha(m.rim, 0.28);
  c.lineWidth = 1;
  c.strokeRect(-12, -78, 24, 24);
  // the lantern: hood, cage with glazing bars (holes show the light), base
  const lit = o.lit ?? 1;
  const L = { x: 0, y: -116 };
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-16, -130);
  c.lineTo(0, -142);
  c.lineTo(16, -130);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(0, -146, 3.4, 0, Math.PI * 2);
  c.fill();
  c.fillRect(-15, -102, 30, 7);
  c.translate(0, -18);
  // glass (lit)
  c.fillStyle = mixLab(m.halo, m.core, 0.35 * lit);
  c.globalAlpha *= 0.35 + 0.65 * lit;
  c.fillRect(-11, -112, 22, 28);
  c.globalAlpha = 1;
  c.fillStyle = ink;
  c.fillRect(-12, -113, 3, 30);
  c.fillRect(9, -113, 3, 30);
  c.fillRect(-1.2, -112, 2.4, 28);
  c.restore();
  // beams (additive): a soft cone out of the lantern along the shelf line
  const lx = o.x + L.x * s * o.facing, ly = o.y + (L.y - bob) * s;
  const reach = (o.reach ?? 160) * s;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const dirs = o.beams === 'both' ? [1, -1] : o.beams === 'none' ? [] : [o.facing];
  for (const p of o.beamTo ?? []) {
    const a = p.a ?? 1;
    if (a <= 0.003) continue;
    const g = c.createLinearGradient(lx, ly, p.x, p.y);
    g.addColorStop(0, withAlpha(m.halo, 0.4 * lit * a));
    g.addColorStop(1, withAlpha(m.core, 0.22 * lit * a));
    c.fillStyle = g;
    const ang = Math.atan2(p.y - ly, p.x - lx);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    c.beginPath();
    c.moveTo(lx + nx * 3 * s, ly + ny * 3 * s);
    c.lineTo(p.x + nx * 14 * s, p.y + ny * 14 * s);
    c.lineTo(p.x - nx * 14 * s, p.y - ny * 14 * s);
    c.lineTo(lx - nx * 3 * s, ly - ny * 3 * s);
    c.closePath();
    c.fill();
  }
  for (const d of dirs) {
    const g = c.createLinearGradient(lx, 0, lx + d * reach, 0);
    g.addColorStop(0, withAlpha(m.halo, 0.32 * lit));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(lx + d * 8 * s, ly - 6 * s);
    c.lineTo(lx + d * reach, ly + 40 * s);
    c.lineTo(lx + d * reach, ly + 92 * s);
    c.lineTo(lx + d * 8 * s, ly + 8 * s);
    c.closePath();
    c.fill();
  }
  c.restore();
  return { x: lx, y: ly };
}

/** a little cast type slug with an abstract face (no legible letters: the text is raw, the point is the slot) */
export function miniSlug(c: C, env: PaintEnv, x: number, y: number, w: number, h: number, lit: number, blank = false, seed = 0) {
  const m = env.mood;
  if (blank) {
    c.save();
    c.strokeStyle = withAlpha(m.core, 0.55);
    c.setLineDash([3, 3]);
    c.lineWidth = 1;
    c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    c.restore();
    return;
  }
  c.fillStyle = mixLab(env.fill('ink'), m.set, 0.35);
  c.fillRect(x, y, w, h);
  c.fillStyle = withAlpha(m.rim, 0.3 + 0.4 * lit);
  c.fillRect(x, y, w, 1.4);
  // the face: two or three short strokes (abstract type)
  c.fillStyle = withAlpha(mixLab(m.rim, m.core, lit), 0.35 + 0.6 * lit);
  const n = 2 + ((seed * 7) % 2);
  for (let i = 0; i < n; i++) {
    const hh = h * (0.25 + 0.3 * (hash1(seed * 3 + i, 5) * 0.5 + 0.5));
    c.fillRect(x + 2 + (i * (w - 4)) / n, y + h * 0.18 + (h * 0.5 - hh) / 2, Math.max(1.2, (w - 6) / n - 1.5), hh);
  }
}

// =====================================================================================================
// THE COAT HOOK and the two coats
// =====================================================================================================
export const HOOK = { x: 1206, y: 96 } as const;
export function coatHook(c: C, env: PaintEnv, light = 0.5) {
  const m = env.mood;
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.fillRect(HOOK.x - 5, HOOK.y - 24, 10, 22);
  c.strokeStyle = mixLab(m.halo, m.set, 0.25);
  c.lineWidth = 3.2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(HOOK.x, HOOK.y - 8);
  c.quadraticCurveTo(HOOK.x + 2, HOOK.y + 6, HOOK.x + 9, HOOK.y + 2);
  c.stroke();
  c.fillStyle = withAlpha(m.core, 0.35 * light);
  c.fillRect(HOOK.x - 4, HOOK.y - 22, 2, 18);
}

/** the coat outline as a polygon: frock (m 0) → modern overcoat (m 1); the same point count so the re-cut can be
 *  drawn on twos as 2–3 in-between drawings. The overcoat's hem is 40% longer, the tails are gone (one straight
 *  vent), the shoulders square. */
const FROCK: [number, number][] = [[-4, 2], [-14, 12], [-34, 15], [-46, 30], [-44, 96], [-36, 104], [-52, 210], [-8, 214], [-2, 186], [4, 214], [46, 208], [32, 104], [38, 96], [40, 30], [34, 15], [10, 12], [4, 2]];
const OVER: [number, number][] = [[-4, 2], [-16, 5], [-34, 17], [-54, 26], [-54, 96], [-52, 110], [-60, 300], [-6, 302], [0, 268], [6, 302], [60, 300], [50, 110], [52, 96], [52, 26], [34, 17], [16, 5], [4, 2]];
/** the overcoat's new skirt line (local px, from the left waist down round the hem to the right waist): the snip runs along it */
export const NEW_HEM: [number, number][] = OVER.slice(5, 12);
/** the frock's old skirt below the waist seam (local px): the piece that falls away */
export const OLD_SKIRT: [number, number][] = [[-36, 104], [-52, 210], [-8, 214], [-2, 186], [4, 214], [46, 208], [32, 104]];
export function coatPath(x: number, y: number, m: number): Path2D {
  const p = new Path2D();
  FROCK.forEach(([fx, fy], i) => {
    const [ox, oy] = OVER[i];
    const px = x + fx + (ox - fx) * m, py = y + fy + (oy - fy) * m;
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  });
  p.closePath();
  return p;
}
/** back-compat names */
export const frockPath = (x: number, y: number) => coatPath(x, y, 0);
export const overcoatPath = (x: number, y: number) => coatPath(x, y, 1);
export interface CoatDrawOpts {
  x: number;
  y: number;
  sway: number;
  /** 0 frock … 1 overcoat (the shot steps it on twos) */
  m: number;
  /** 0..1 the new outline traced in light (the re-cut's first drawing) */
  trace?: number;
  light: number;
  dust?: number;
}
const L = (a: number, b: number, u: number) => a + (b - a) * u;
/** draws the coat; returns the near cuff point (where the tag is tied) in world */
export function coatAt(c: C, env: PaintEnv, o: CoatDrawOpts): { x: number; y: number } {
  const m = env.mood;
  const ink = env.fill('ink');
  const { x, y } = o;
  const k = Math.max(0, Math.min(1, o.m));
  c.save();
  c.translate(x, y);
  c.rotate(o.sway);
  c.translate(-x, -y);
  // the loop
  c.strokeStyle = ink;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(x, y - 3, 4, Math.PI, 0);
  c.stroke();
  c.fillStyle = ink;
  c.fill(coatPath(x, y, k));
  // the near sleeve (frock: curved, to 168; overcoat: straight, to 204)
  const sl = new Path2D();
  sl.moveTo(x + L(-46, -54, k), y + L(30, 28, k));
  sl.quadraticCurveTo(x + L(-54, -60, k), y + L(80, 110, k), x + L(-40, -60, k), y + L(168, 204, k));
  sl.lineTo(x + L(-22, -38, k), y + L(170, 206, k));
  sl.quadraticCurveTo(x + L(-30, -36, k), y + L(100, 120, k), x + L(-30, -34, k), y + L(44, 42, k));
  sl.closePath();
  c.fillStyle = mixLab(ink, m.set, 0.12);
  c.fill(sl);
  // cut-lines (≤ 8)
  c.strokeStyle = withAlpha(m.rim, 0.3 + 0.22 * o.light);
  c.lineWidth = 1.2;
  c.beginPath();
  if (k > 0.5) {
    // the modern notch lapels: collar to notch, notch to the roll line, the front edge, a pocket, the cuff
    for (const sg of [-1, 1]) {
      c.moveTo(x + sg * 14, y + 6);
      c.lineTo(x + sg * 26, y + 30);
      c.lineTo(x + sg * 18, y + 34); // the notch
      c.lineTo(x + sg * 30, y + 40);
      c.lineTo(x + sg * 4, y + 118);
    }
    c.moveTo(x + 4, y + 118);
    c.lineTo(x + 6, y + 298);
    c.moveTo(x + 18, y + 176);
    c.lineTo(x + 42, y + 176);
    c.moveTo(x - 59, y + 192);
    c.lineTo(x - 39, y + 194);
  } else {
    c.moveTo(x - 10, y + 14);
    c.lineTo(x - 2, y + 70);
    c.moveTo(x - 36, y + 104);
    c.lineTo(x + 32, y + 104);
    c.moveTo(x - 41, y + 160);
    c.lineTo(x - 23, y + 162);
  }
  c.stroke();
  c.fillStyle = withAlpha(m.rim, 0.4 * (0.5 + o.light));
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(k > 0.5 ? x + 12 : x + 2, (k > 0.5 ? y + 132 : y + 60) + i * (k > 0.5 ? 34 : 15), 1.9, 0, Math.PI * 2);
    c.fill();
  }
  if (k < 0.5 && (o.dust ?? 1) > 0) {
    c.fillStyle = withAlpha(m.haze, 0.22 * (o.dust ?? 1));
    for (let i = 0; i < 26; i++) c.fillRect(x - 40 + (0.5 + 0.5 * hash1(i, 3)) * 78, y + 16 + (0.5 + 0.5 * hash1(i, 4)) * 22, 1.4, 1.4);
  }
  // the re-cut: the new outline traced in light
  if ((o.trace ?? 0) > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(m.core, 0.8 * (o.trace ?? 0));
    c.lineWidth = 1.8;
    c.setLineDash([7, 4]);
    c.stroke(coatPath(x, y, 1));
    c.restore();
  }
  c.restore();
  const cuff = { x: x + L(-31, -49, k), y: y + L(168, 205, k) };
  const a = o.sway;
  return { x: x + (cuff.x - x) * Math.cos(a) - (cuff.y - y) * Math.sin(a), y: y + (cuff.x - x) * Math.sin(a) + (cuff.y - y) * Math.cos(a) };
}

// =====================================================================================================
// A BENT ARM: the narrator's forearm with an elbow, so a long reach never reads as a rigid pole
// =====================================================================================================
export interface BentArmOpts {
  /** off-frame shoulder point (layer px) */
  shoulder: Pt;
  /** the elbow (layer px), in frame or just off it */
  elbow: Pt;
  /** where the held object / fingertip socket lands */
  at: Pt;
  shape: HandShapeN;
  /** hand length (px) */
  len: number;
  held?: Held;
  side?: 'right' | 'left';
  bend?: number;
  heldDraw?: HeldDraw['heldDraw'];
}
export function bentArm(c: C, env: PaintEnv, o: BentArmOpts) {
  const arm = narratorHands.reach(o.elbow, o.at, o.shape, o.len, { held: o.held ?? 'none', bend: o.bend ?? 0 });
  const ink = env.fill('ink');
  const w = o.len * 0.7;
  // the upper arm (tweed, a capsule from the elbow back to the shoulder)
  const dx = o.shoulder.x - o.elbow.x, dy = o.shoulder.y - o.elbow.y;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  c.save();
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(o.elbow.x + (nx * w) / 2, o.elbow.y + (ny * w) / 2);
  c.lineTo(o.shoulder.x + (nx * w * 1.15) / 2, o.shoulder.y + (ny * w * 1.15) / 2);
  c.lineTo(o.shoulder.x - (nx * w * 1.15) / 2, o.shoulder.y - (ny * w * 1.15) / 2);
  c.lineTo(o.elbow.x - (nx * w) / 2, o.elbow.y - (ny * w) / 2);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(o.elbow.x, o.elbow.y, w / 2, 0, Math.PI * 2);
  c.fill();
  // the lit upper edge (the edge facing up-screen)
  const up = ny < 0 ? 1 : -1;
  c.strokeStyle = withAlpha(env.mood.rim, 0.5);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(o.elbow.x + (up * nx * w) / 2, o.elbow.y + (up * ny * w) / 2);
  c.lineTo(o.shoulder.x + (up * nx * w * 1.15) / 2, o.shoulder.y + (up * ny * w * 1.15) / 2);
  c.stroke();
  c.restore();
  // the forearm, clipped at the elbow (its sleeve otherwise runs on off frame)
  const fx = Math.cos(arm.angle), fy = Math.sin(arm.angle);
  const B = 4000;
  c.save();
  c.beginPath();
  const ex = o.elbow.x, ey = o.elbow.y;
  c.moveTo(ex - fy * B, ey + fx * B);
  c.lineTo(ex + fy * B, ey - fx * B);
  c.lineTo(ex + fy * B + fx * B, ey - fx * B + fy * B);
  c.lineTo(ex - fy * B + fx * B, ey + fx * B + fy * B);
  c.closePath();
  c.clip();
  const pose = { [o.side ?? 'right']: arm, scale: o.len / HAND_LEN } as HandsPose;
  narratorHands.draw(c, pose, env, o.heldDraw ? { heldDraw: o.heldDraw } : undefined);
  c.restore();
  return arm;
}

/**
 * Draw a hands.act() pose's working (right) hand with a bent arm entering from below: the socket stays where
 * the action puts it, but the sleeve breaks at an elbow just below the target and the upper arm drops off the
 * frame's bottom edge (so no long straight forearm crosses the picture).
 *   elbowDrop / shoulderDrop: how far below the socket the elbow and shoulder sit (layer px)
 */
export function pinArm(c: C, env: PaintEnv, pose: HandsPose, o: { heldDraw?: HeldDraw['heldDraw']; elbow?: Pt; shoulder?: Pt; lean?: number } = {}) {
  const a = pose.right;
  if (!a) return;
  const len = HAND_LEN * (pose.scale ?? 1);
  const s = narratorHands.socket(pose, 'right');
  if (!s) return;
  const lean = o.lean ?? 1;
  // the forearm rises almost straight up from an elbow below the target; the upper arm breaks away to the lower right
  const elbow = o.elbow ?? { x: s.x + 18 * lean, y: s.y + len * 2.1 };
  const shoulder = o.shoulder ?? { x: elbow.x + 520 * lean, y: elbow.y + 640 };
  bentArm(c, env, { shoulder, elbow, at: s, shape: a.shape, len, held: a.held, bend: a.bend, heldDraw: o.heldDraw });
}

// =====================================================================================================
// TAGS, STAMPS, CAPTIONS
// =====================================================================================================
export interface BigTagOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  len?: number;
  lines: string[];
  size: number;
  font?: string;
  light?: number;
  /** 0..1 horizontal flip (turning over): scaleX = cos(pi*flip) */
  flip?: number;
  /** 0..1 a stamp's fresh-ink flash */
  fresh?: number;
}
export function bigTag(c: C, env: PaintEnv, o: BigTagOpts) {
  const m = env.mood;
  const len = o.len ?? 12;
  const light = o.light ?? 0.8;
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, len);
  c.stroke();
  const sx = Math.cos(Math.PI * (o.flip ?? 0));
  c.translate(0, len);
  c.scale(Math.max(0.04, Math.abs(sx)), 1);
  const { w, h } = o;
  const paper = mixLab(mixLab(m.halo, '#b08a52', 0.3), m.rim, 0.25 + 0.35 * light);
  const n = Math.min(14, h * 0.3);
  const tag = (dx: number, dy: number) => {
    c.beginPath();
    c.moveTo(dx - w / 2 + n, dy);
    c.lineTo(dx + w / 2 - n, dy);
    c.lineTo(dx + w / 2, dy + n);
    c.lineTo(dx + w / 2, dy + h);
    c.lineTo(dx - w / 2, dy + h);
    c.lineTo(dx - w / 2, dy + n);
    c.closePath();
  };
  c.fillStyle = withAlpha(m.fg, 0.32);
  tag(2, 2);
  c.fill();
  c.fillStyle = paper;
  tag(0, 0);
  c.fill();
  c.fillStyle = withAlpha(m.fg, 0.6);
  c.beginPath();
  c.arc(0, n * 0.7, 2.4, 0, Math.PI * 2);
  c.fill();
  if (Math.abs(sx) > 0.05 && o.lines.length) {
    c.font = o.font ?? `500 ${o.size}px ${FONT.mono}`; // 500: a preloaded face (600 would fall back)
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const ink = '#1d2236';
    const fresh = o.fresh ?? 0;
    c.fillStyle = mixLab(ink, '#3a2a6a', 0.4 * fresh);
    const top = n + (h - n) / 2 - ((o.lines.length - 1) * o.size * 1.25) / 2;
    o.lines.forEach((l, i) => {
      const tw = c.measureText(l).width;
      const sc = Math.min(1, (w * 0.88) / tw);
      c.save();
      c.translate(0, top + i * o.size * 1.25);
      c.scale(sc, 1);
      c.fillText(l, 0, 0);
      c.restore();
    });
  }
  c.restore();
}

/** soft ink plate */
export function softPlate(c: C, x: number, y: number, w: number, h: number, col: string, a: number) {
  if (a <= 0.003) return;
  const g = c.createRadialGradient(x, y, 4, x, y, Math.max(w, h) / 2);
  g.addColorStop(0, withAlpha(col, a));
  g.addColorStop(0.6, withAlpha(col, a * 0.6));
  g.addColorStop(1, withAlpha(col, 0));
  c.save();
  c.translate(x, y);
  c.scale(1, h / Math.max(w, h));
  c.translate(-x, -y);
  c.fillStyle = g;
  c.fillRect(x - Math.max(w, h) / 2, y - Math.max(w, h) / 2, Math.max(w, h), Math.max(w, h));
  c.restore();
}

/** a mono date stamp typed on at the bottom-left (on twos), held, faded at `until` */
export function monoDate(c: C, m: Palette, t: number, at: number, text: string, until = Infinity) {
  const A = Math.min(1, Math.max(0, (t - at) / 0.15)) * (1 - Math.min(1, Math.max(0, (t - (until - 0.5)) / 0.5)));
  if (A <= 0.003) return;
  const tq = Math.floor(t * 12 + 1e-9) / 12;
  const shown = Math.max(0, Math.min(text.length, Math.floor((tq - at) * 12 + 1e-6) + 1));
  c.save();
  softPlate(c, 92, 664, 280, 110, m.ink, 0.5 * A);
  c.globalAlpha = A;
  c.fillStyle = mixLab(m.core, '#ffffff', 0.35);
  c.font = `500 24px ${FONT.mono}`;
  (c as C & { letterSpacing: string }).letterSpacing = '2px';
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(text.slice(0, shown), 48, 672);
  c.globalAlpha = A * 0.6;
  c.fillRect(48, 646, 66 * Math.min(1, Math.max(0, (t - at - 0.3) / 0.6)), 0.8);
  c.fillRect(48, 642, 0.8, 8);
  c.restore();
}

/** a small mono caption on a soft plate (screen-locked) */
export function capLine(c: C, m: Palette, text: string, x: number, y: number, a: number, o: { size?: number; align?: CanvasTextAlign; italic?: boolean; font?: string; color?: string } = {}) {
  if (a <= 0.003) return;
  const size = o.size ?? 22;
  c.save();
  c.font = o.font ?? `${o.italic ? 'italic ' : ''}500 ${size}px ${FONT.mono}`;
  (c as C & { letterSpacing: string }).letterSpacing = '1px';
  const w = c.measureText(text).width;
  const al = o.align ?? 'center';
  const cx = al === 'center' ? x : al === 'left' ? x + w / 2 : x - w / 2;
  softPlate(c, cx, y - size * 0.35, w + 120, size * 3.4, m.ink, 0.62 * a);
  c.globalAlpha = a;
  c.fillStyle = o.color ?? mixLab(m.core, '#ffffff', 0.3);
  c.textAlign = al;
  c.textBaseline = 'alphabetic';
  c.fillText(text, x, y);
  c.restore();
}

export type { MoodId };
