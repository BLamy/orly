/**
 * neural-net-history — THE DETECTIVE'S STUDY (shared set; STUDY LOCK: candleAmber in every era).
 * One room, one geography, five cameras. Every study visit renders the board, the candle shelf, the Wall
 * of Forecasts and the X-ray box from studyState (sets/studyState.ts) and animates only its own beat.
 *
 * GEOGRAPHY (L4 world = rest-screen px at CAMERA3_HOME, which is the BOARD camera):
 *   the Case Board         STUDY.board  — x 140…1140, y 30…650 (board units × 1)
 *   the X-ray chat box     STUDY.xray   — stands between the board and the Wall, bottom centre (1235, 650)
 *   the Wall of Forecasts  STUDY.wall   — x 1330…1919, y 70…517, W1 → W8 from the lamp outward
 *   the candle shelf       STUDY.shelf  — plank top y 950 beneath the board, x 60 → the window; candles
 *                                         270 px tall; the China-race candles at its right end by the window
 *   the study window       STUDY.window — a HOLE in the study wall at the far right (era sky beyond)
 *   the desk + lamp        L5 (near)    — the desk's end and the green-shaded banker's lamp at lower right
 *                                         (the lamp side: the hands enter here), the manila file on the desk.
 *                                         Near-plane parallax is strong: a camera that tilts DOWN to the shelf
 *                                         sees the desk edge rise into the bottom of frame (blurred), as a
 *                                         real low macro would.
 *
 * CAMERAS (staging.studyCameras): STUDY_CAMS.board (frontal medium), .insert(slot) (1–2 s pin inserts),
 * .shelf(x) (low macro along the rings), .wall(u) (lateral truck W1 → W8), .xray (square-on plate),
 * .full (THE FULL WIDE: only ch01-s05, ch12-s07, ch15-s08). FILE (top-down) is its own painter: fileDesk.
 *
 *   f.camera(cam);
 *   studyRoom(f, { key, cams, outside: { mood: 'winterBlue', kind: 'snow' } });   // L0 → fog B
 *   studyCase(f, { shot: 'ch05-s10', when: 'start', cams, … });                     // L4 + rim + practicals
 *   …your beat on top (hands, a card being pinned) in f.layer('L4' | 'L5', …)…
 *   studyNear(f, { key, cams });                                                     // L5 desk + lamp
 */
import type { Camera3, Frame, LayerSpec, MoodId, PaintEnv } from '../../../film/contracts';
import { CAMERA3_HOME, LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { bookshelfWall, skyline } from '../../../film/silhouette/architecture';
import { stars } from '../../../film/silhouette/nature';
import { snow } from '../../../film/silhouette/atmosphere';
import { bankersLamp } from '../../../film/silhouette/props';
import { hash1 } from '../../../film/core/frame';
import { BOARD, SLOTS, boardStateAt, shelfStateAt, wallStateAt, xrayBandsAt, type Moment, type SlotId } from './studyState';
import { caseBoard, DEFAULT_POOL, type BoardDraw, type Pool } from './caseBoard';
import { candleShelf, shelfFlames, shelfSlotX, type ShelfDraw } from './beliefCandle';
import { wallOfForecasts, WALL, WALL_SLOTS, type WallDraw } from './wallOfForecasts';
import { xrayColumn, xrayGlowAt, XRAY, type XrayDraw } from './xrayColumn';
import type { WallSlot } from './studyState';
import { studyNearOccluders } from './occluders';

export const STUDY = {
  board: { x: 140, y: 30, k: 1 },
  pool: { cx: 610, cy: 360, r: 600, k: 1 } as Pool,
  xray: { x: 1235, y: 650, s: 0.75 },
  wall: { x: 1330, y: 70, k: 0.95 },
  shelf: { x: 40, y: 950, s: 1, pitch: 92, windowGap: 70 },
  window: { x: 1990, y: 40, w: 300, h: 900 },
  /** the study wall's extent (L4 world) */
  wallRect: { x0: -700, x1: 2700, y0: -500, y1: 1300 },
  /** the banker's lamp on the desk (L5 world), lamp side = right; off-frame in the BOARD camera */
  lamp: { x: 1900, y: 1150, s: 3.2 },
  /** the desk top's front edge (L5 world): below the shelf in every study camera */
  deskY: 1150,
  /** the desk spans from here to the right (it does not hide the shelf) */
  deskX: 1240,
} as const;

/** the study wall sits just behind the board (a custom plane: almost no parallax against L4) */
export const STUDY_WALL: LayerSpec = { id: 'studyWall', z: 1070, haze: 0.05, blur: 0.4 };

const cam = (x: number, y: number, z: number, lens = 1): Camera3 => ({ x, y, z, lens });
/** the five study cameras (+ the reserved full wide) */
export const STUDY_CAMS = {
  /** BOARD: frontal, medium, the lamp's pool on the board */
  board: cam(640, 340, 0),
  /** a 1–2 s pin insert centred on a slot */
  insert(slot: SlotId, z = 470): Camera3 {
    const s = SLOTS[slot];
    return cam(STUDY.board.x + s.x * STUDY.board.k, STUDY.board.y + s.y * STUDY.board.k, z);
  },
  /** SHELF: a low macro along the candle rings, centred at shelf x */
  shelf(x: number, z = 420): Camera3 {
    return cam(x, STUDY.shelf.y - 150, z);
  },
  /** WALL: the lateral truck from the lamp outward, u 0 (W1) → 1 (W8) */
  wall(u: number, z = 380): Camera3 {
    const a = STUDY.wall.x + WALL_SLOTS.W1.x * STUDY.wall.k, b = STUDY.wall.x + WALL_SLOTS.W8.x * STUDY.wall.k;
    return cam(a + (b - a) * u, STUDY.wall.y + (WALL.h / 2) * STUDY.wall.k, z);
  },
  /** X-RAY: the chat box square-on, the room falling away */
  xray: cam(STUDY.xray.x, STUDY.xray.y - (XRAY.h / 2) * STUDY.xray.s, 470),
  /** THE FULL WIDE: board, shelf and Wall in one frame (ch01-s05, ch12-s07, ch15-s08 only) */
  full: cam(1080, 560, -760),
  /** the window over the strait (ch14) */
  window: cam(STUDY.window.x + STUDY.window.w / 2, 520, 160),
} as const;

/** shelf geometry for a shot (pass the views) */
export function studyShelf(views: ShelfDraw['views'], over?: Partial<ShelfDraw>): ShelfDraw {
  return { ...STUDY.shelf, views, ...over };
}
/** world x of a candle on the study shelf, by candle id */
export function candleX(views: ShelfDraw['views'], id: string): number {
  const v = views.find((q) => q.id === id);
  return v ? shelfSlotX({ ...STUDY.shelf, views }, v.slot) : STUDY.shelf.x;
}
/** world point of a board slot's centre / pin (for hands targets) */
export function slotWorld(slot: SlotId, which: 'centre' | 'pin' = 'centre') {
  const s = SLOTS[slot];
  const y = which === 'pin' ? s.y - s.h / 2 + 7 : s.y;
  return { x: STUDY.board.x + s.x * STUDY.board.k, y: STUDY.board.y + y * STUDY.board.k };
}
export function wallSlotWorld(slot: WallSlot) {
  const s = WALL_SLOTS[slot];
  return { x: STUDY.wall.x + s.x * STUDY.wall.k, y: STUDY.wall.y + s.y * STUDY.wall.k };
}

type C = CanvasRenderingContext2D;
const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void, res = 1) => {
  const opts = { res } as { blur?: number };
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  }, opts)(c, r.x, r.y);
};
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

// =====================================================================================================
// THE ROOM: backlight + the view through the window (era sky) + the study wall (bookcase, panelling,
// the window hole, the lamp's warmth) + haze
// =====================================================================================================
export type OutsideKind = 'night' | 'city' | 'snow' | 'dusk' | 'dawn' | 'strait';
export interface StudyRoomOpts {
  key: string;
  cams: Camera3[];
  /** what the study window shows: the ERA's sky (STUDY LOCK: era colour enters only through practicals and the window) */
  outside?: { mood?: MoodId; kind?: OutsideKind; city?: number };
  /** lamp intensity 0..1 (the click in ch01-s04) */
  lamp?: number;
  /** fog A/B multipliers */
  fog?: number;
}

export function studyRoom(f: Frame, o: StudyRoomOpts) {
  const lamp = o.lamp ?? 1;
  const outMood = o.outside?.mood ?? 'winterBlue';
  const kind = o.outside?.kind ?? 'night';
  // L0: a low backlight (most of it is hidden by the study wall; it shows through the window)
  f.backlight({ sunX: STUDY.window.x + STUDY.window.w / 2, sunY: 520, sunRadius: 520, intensity: 0.6 });

  // L1: the view through the window, in the era's own palette
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 80);
    bake(f, c, `${o.key}/study/L1/${outMood}/${kind}/${o.outside?.city ?? 0.3}/${rk(r)}`, r, (cc) => {
      const P = MOODS[outMood];
      const sky = cc.createLinearGradient(0, r.y, 0, r.y + r.h);
      sky.addColorStop(0, P.sky[0]);
      sky.addColorStop(0.45, P.sky[1]);
      sky.addColorStop(0.72, P.sky[2]);
      sky.addColorStop(1, P.sky[3]);
      cc.fillStyle = sky;
      cc.fillRect(r.x, r.y, r.w, r.h);
      const oenv: PaintEnv = { ...env, mood: P, fill: (role) => mixLab((P as unknown as Record<string, string>)[role] ?? P.set, P.haze, 0.55) };
      if (kind === 'night' || kind === 'city' || kind === 'snow') stars(cc, { x: r.x, y: r.y, w: r.w, h: r.h * 0.5, count: 90, seed: 7, twinkle: 0 }, oenv);
      if (kind !== 'strait') skyline(cc, { style: 'chicago1940', x0: r.x, x1: r.x + r.w, y: 640, height: 260, seed: 19, lit: o.outside?.city ?? (kind === 'city' ? 0.4 : 0.18), ground: 400 }, oenv);
      else {
        // the strait: dark water below a far shore
        cc.fillStyle = mixLab(P.set, P.haze, 0.5);
        cc.fillRect(r.x, 560, r.w, r.y + r.h - 560);
      }
    });
  });

  // the study wall (just behind the board): panelling, a bookcase at left, the window HOLE at right,
  // a picture rail, the lamp's warm pool around the board; baked
  f.layer(STUDY_WALL, (c, env) => {
    const r = overscan(STUDY_WALL, o.cams, 60);
    bake(f, c, `${o.key}/study/wall/${env.mood.id}/${lamp.toFixed(2)}/${rk(r)}`, r, (cc) => {
      const W = STUDY.window;
      const wall = mixLab(env.fill('set'), env.mood.fg, 0.25);
      cc.fillStyle = wall;
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(W.x, W.y, W.w, W.h); // the window hole
      cc.fill('evenodd');
      // the lamp's pool warming the wall around the board and shelf
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
      // panelling: rails and stiles as cut-lines, a picture rail
      cc.strokeStyle = withAlpha(env.mood.rim, 0.1);
      cc.lineWidth = 1.4;
      for (let x = Math.floor(r.x / 240) * 240; x < r.x + r.w; x += 240) {
        cc.strokeRect(x + 14, 1080, 212, 180);
      }
      cc.fillStyle = withAlpha(env.mood.fg, 0.6);
      cc.fillRect(r.x, -18, r.w, 10);
      cc.fillRect(r.x, 1060, r.w, 12);
      cc.restore();
      // window frame and glazing bars (ink), sill
      cc.fillStyle = env.fill('ink');
      const bar = 9;
      cc.fillRect(W.x - 16, W.y - 16, W.w + 32, 16);
      cc.fillRect(W.x - 16, W.y, 16, W.h);
      cc.fillRect(W.x + W.w, W.y, 16, W.h);
      cc.fillRect(W.x - 30, W.y + W.h, W.w + 60, 22);
      for (let i = 1; i < 3; i++) cc.fillRect(W.x + (W.w * i) / 3 - bar / 2, W.y, bar, W.h);
      for (let j = 1; j < 6; j++) cc.fillRect(W.x, W.y + (W.h * j) / 6 - bar / 2, W.w, bar);
      cc.fillStyle = withAlpha(env.mood.rim, 0.3);
      cc.fillRect(W.x - 30, W.y + W.h, W.w + 60, 1.5);
      // a tall bookcase to the left of the board
      bookshelfWall(cc, { x: -660, y: -120, w: 620, h: 1180, bays: 3, seed: 43, gaps: 0.22, objects: true, backTone: 0.25 }, env);
    });
  });
  if (kind === 'snow') {
    // snow past the glass (winter is snow past the window, never a cooled lamp)
    f.layer('L1', (c, env) => {
      c.save();
      c.beginPath();
      c.rect(STUDY.window.x - 400, -400, STUDY.window.w + 1400, 1800);
      c.clip();
      snow(c, { area: { x: STUDY.window.x - 600, y: -300, w: 1600, h: 1500 }, count: 160, salt: 5, color: MOODS[outMood].core }, env);
      c.restore();
    });
  }
  f.fog({ yCenter: 0.6 * 720, height: 0.4 * 720, alpha: 0.16 * (o.fog ?? 1), drift: 6 });
}

// =====================================================================================================
// THE CASE: board, X-ray box, Wall of Forecasts, candle shelf (L4) from studyState, then rim + practicals
// =====================================================================================================
export interface StudyCaseOpts {
  shot: string;
  when?: Moment;
  /** cache key salt (the shot id) */
  key?: string;
  board?: Partial<BoardDraw> | false;
  shelf?: Partial<ShelfDraw> | false;
  wall?: Partial<WallDraw> | false;
  xray?: Partial<XrayDraw> | false;
  lamp?: number;
  /** extra L4 drawing after the case (a card in a hand, a puppet) */
  extra?: (c: CanvasRenderingContext2D, env: PaintEnv) => void;
  /** add the candle-flame practicals (default true) */
  flames?: boolean;
  /** add the lamp practical (default true) */
  lampLight?: boolean;
  /** rim direction toward the lamp (default from lower right) */
  rimDir?: { x: number; y: number };
}

export function studyCase(f: Frame, o: StudyCaseOpts) {
  const when = o.when ?? 'start';
  const lamp = o.lamp ?? 1;
  const pool: Pool = { ...STUDY.pool, k: lamp };
  const shelfViews = shelfStateAt(o.shot, when);
  const shelf: ShelfDraw | null = o.shelf === false ? null : { ...STUDY.shelf, views: shelfViews, drawFlames: false, ...(o.shelf ?? {}) };
  f.layer('L4', (c, env) => {
    if (o.board !== false) {
      const st = o.board?.state ?? boardStateAt(o.shot, when);
      caseBoard(c, { ...STUDY.board, state: st, pool: { ...DEFAULT_POOL, ...pool, cx: pool.cx - STUDY.board.x, cy: pool.cy - STUDY.board.y }, ...(o.board ?? {}) }, env);
    }
    if (o.wall !== false) {
      wallOfForecasts(c, { ...STUDY.wall, slips: wallStateAt(o.shot, when), light: lamp, ...(o.wall ?? {}) }, env);
    }
    if (o.xray !== false && (o.xray || xrayBandsAt(o.shot, when).lit.some(Boolean))) {
      xrayColumn(c, { ...STUDY.xray, state: xrayBandsAt(o.shot, when), ...(o.xray ?? {}) }, env);
    }
    if (shelf) candleShelf(c, shelf, env);
    o.extra?.(c, env);
  });
  f.rim(o.rimDir ?? { x: 0.55, y: 0.8 });
  // practicals: candle flames on the shelf, the X-ray box's cyan glow, the lamp
  if (shelf && o.flames !== false) {
    for (const fl of shelfFlames(shelf)) f.practical({ x: fl.x, y: fl.y + 6, kind: 'candle', seed: fl.seed, intensity: 0.9, radius: 40 });
  }
  if (o.xray !== false && (o.xray || xrayBandsAt(o.shot, when).lit.some(Boolean))) {
    const g = xrayGlowAt({ ...STUDY.xray, ...(o.xray ?? {}) });
    const L = (o.xray && o.xray.light) ?? 1;
    f.layer('L4', (c) => {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const C = MOODS.serverCyan;
      const R = 340;
      const gr = c.createRadialGradient(g.x, g.y, 20, g.x, g.y, R);
      gr.addColorStop(0, withAlpha(C.halo, 0.2 * L));
      gr.addColorStop(0.5, withAlpha(C.halo, 0.07 * L));
      gr.addColorStop(1, withAlpha(C.halo, 0));
      c.fillStyle = gr;
      c.fillRect(g.x - R, g.y - R, 2 * R, 2 * R);
      c.restore();
    });
  }
}

// =====================================================================================================
// THE NEAR PLANE: the desk edge, the green-shaded banker's lamp (lamp side = lower right), the file
// =====================================================================================================
export interface StudyNearOpts {
  key: string;
  cams: Camera3[];
  lamp?: number;
  /** show the manila file on the desk (it stays at frame right after ch01-s04) */
  file?: boolean;
  /** show the desk + lamp (default true) */
  desk?: boolean;
  /** the shared near occluders on L6 (drape, pelmet, chair back; sets/occluders.ts): false = off, or pick parts */
  occluders?: false | { chair?: boolean; drape?: boolean; valance?: boolean };
}
export function studyNear(f: Frame, o: StudyNearOpts) {
  const lamp = o.lamp ?? 1;
  // the shared near plane (review round 1): drape, pelmet and chair back on L6, softest and fastest in parallax
  const near = () => {
    if (o.occluders !== false) studyNearOccluders(f, { key: o.key, cams: o.cams, ...(typeof o.occluders === 'object' ? o.occluders : {}) });
  };
  if (o.desk === false) return near();
  // the lamp light itself, at the bulb (L5)
  const L = STUDY.lamp;
  const bulb = bankersLamp.anchors({ x: L.x, y: L.y, s: L.s }).bulb;
  if (lamp > 0) f.practical({ x: bulb.x, y: bulb.y + 6, kind: 'lamp', seed: 41, intensity: 0.7 * lamp, radius: 60, layer: 'L5' });
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, o.cams, 40);
    bake(f, c, `${o.key}/study/L5/${env.mood.id}/${o.file ? 1 : 0}/${rk(r)}`, r, (cc) => {
      // the desk: a dark slab across the bottom with a moulded edge, rim-lit along its top
      cc.fillStyle = env.fill('fg');
      cc.fillRect(STUDY.deskX, STUDY.deskY, r.x + r.w - STUDY.deskX, r.y + r.h - STUDY.deskY + 10);
      cc.fillStyle = withAlpha(env.mood.rim, 0.28);
      cc.fillRect(STUDY.deskX, STUDY.deskY - 1, r.x + r.w - STUDY.deskX, 2);
      if (o.file) {
        // the manila file at frame right, edge-on: a slim folder with a tab
        cc.fillStyle = env.fill('ink');
        cc.fillRect(2060, STUDY.deskY - 14, 210, 14);
        cc.fillRect(2070, STUDY.deskY - 20, 46, 7);
        cc.fillStyle = withAlpha(env.mood.rim, 0.3);
        cc.fillRect(2060, STUDY.deskY - 14, 210, 1.2);
      }
    });
    bankersLamp(c, { x: L.x, y: L.y, s: L.s, lit: lamp > 0.05, seed: 41 }, env);
  });
  near();
}

// =====================================================================================================
// FILE (top-down on the desk): the manila folder, a slip folding into it
// =====================================================================================================
export interface FileDeskOpts {
  /** folder centre (screen px; this camera is a flat top-down plate) */
  x?: number;
  y?: number;
  /** 0 = flap shut … 1 = flap open */
  open?: number;
  /** slips already filed (their edges show) */
  filed?: number;
  lamp?: number;
}
/** a top-down desk with the manila file: draw inside f.layer('L4') with CAMERA3_HOME */
export function fileDesk(c: CanvasRenderingContext2D, o: FileDeskOpts, env: PaintEnv) {
  const x = o.x ?? 700, y = o.y ?? 400;
  const lamp = o.lamp ?? 1;
  // the desk top: dark wood under the lamp's pool, grain as faint cut-lines
  c.fillStyle = mixLab(env.mood.set, env.mood.fg, 0.3);
  c.fillRect(-200, -200, 1680, 1120);
  const g = c.createRadialGradient(x - 60, y - 40, 30, x - 60, y - 40, 720);
  g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.5), 0.95 * lamp));
  g.addColorStop(0.6, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.2), 0.5 * lamp));
  g.addColorStop(1, withAlpha(env.mood.set, 0));
  c.fillStyle = g;
  c.fillRect(-200, -200, 1680, 1120);
  c.strokeStyle = withAlpha(env.mood.fg, 0.25);
  c.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const yy = -40 + i * 31 + hash1(i, 3) * 6;
    c.beginPath();
    c.moveTo(-200, yy);
    c.bezierCurveTo(300, yy + hash1(i, 4) * 14, 900, yy - hash1(i, 5) * 14, 1480, yy);
    c.stroke();
  }
  // the folder: back cover, filed slips' edges, the front flap (opening upward from the spine at the bottom)
  const W = 420, H = 300;
  const manila = mixLab(env.mood.halo, '#b08a52', 0.35);
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.fillRect(x - W / 2 + 8, y - H / 2 + 10, W, H);
  c.fillStyle = mixLab(manila, env.mood.set, 0.25);
  c.fillRect(x - W / 2, y - H / 2, W, H);
  c.fillRect(x - W / 2 + 30, y - H / 2 - 22, 110, 24); // tab
  for (let i = 0; i < (o.filed ?? 0); i++) {
    c.fillStyle = mixLab(env.mood.rim, env.mood.halo, 0.4);
    c.fillRect(x - W / 2 + 20 + i * 6, y - H / 2 + 16 + i * 4, W - 50, 6);
  }
  const op = Math.max(0, Math.min(1, o.open ?? 0));
  const fh = H * (1 - op * 1.6);
  c.fillStyle = manila;
  if (fh > 0) c.fillRect(x - W / 2, y + H / 2 - fh, W, fh);
  else {
    c.fillStyle = mixLab(manila, env.mood.rim, 0.15);
    c.fillRect(x - W / 2, y + H / 2, W, -fh * 0.6);
  }
  c.fillStyle = withAlpha(env.mood.rim, 0.35);
  c.fillRect(x - W / 2, y + H / 2 - Math.max(0, fh), W, 1.2);
}

/** convenience: the camera keyframes a shot passes as `cams` for full overscan */
export const STUDY_ALL_CAMS: Camera3[] = [CAMERA3_HOME, STUDY_CAMS.board, STUDY_CAMS.full, STUDY_CAMS.xray, STUDY_CAMS.wall(0), STUDY_CAMS.wall(1), STUDY_CAMS.shelf(200), STUDY_CAMS.shelf(1800)];
export { BOARD, SLOTS };
