/**
 * neural-net-history — THE DARK ROOM, ch01 cut (ch01-s01; ch01-s03's first frames). serverCyan.
 *
 * A revision of the shared sets/darkRoom composition for the cold open (the shared set is left untouched
 * for ch12-s06). Same room, staged as paper theatre in depth:
 *   L1        the far city: a hazy rank of megacity towers under a deep-blue sky with a few stars
 *   CITY_NEAR a nearer, crisper rank of towers (its own plane, z 2700) with ~22 small lit windows
 *   L2        the back wall with the tall paned window as a HOLE (evenodd); mullions with rim hairlines
 *   L3        a low credenza and an unlit floor lamp against the far wall (hazed)
 *   L4        the desk, the laptop (lid angled toward the user: only a narrow, graded sliver of its face
 *             is visible, core at the top edge), the mug, the chair and the person (cast 'chat-user',
 *             strict right-facing profile, scale 1.3: ~45% of frame height) with head and shoulders
 *             against the lower window panes
 *   fog       a sheet at desk height and one on the floor, so the desk legs and chair base dissolve
 *   L5        a rubber plant at frame left (sets/ch01-s01-roomExtras roomPlant)
 *   L6        a heavy curtain edge at frame right, blurred
 * The laptop's face is the room's one practical: f.practical kind 'screen' + a local screen rim on the
 * face, chest and fingertips (screenRim).
 *
 *   room01(f, { key, cams, resolve, glow, pose, cursorOn })
 *   ROOM01                 geometry (L4 world = rest-screen px)
 *   ROOM01_POSES           rest / type poses for the person (the shot owns the timing)
 */
import type { Camera3, Frame, LayerSpec, PaintEnv, Pose } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, toLayer, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { skyline } from '../../../film/silhouette/architecture';
import { stars } from '../../../film/silhouette/nature';
import { chair } from '../../../film/silhouette/props';
import { POSES, PUPPET_NEAR_BLACK, seatHeight } from '../../../film/silhouette/puppet';
import { hash1, makeCanvas } from '../../../film/silhouette/atmosphere';
import { cast } from '../cast';
import { roomPlant } from './ch01-s01-roomExtras';

type C = CanvasRenderingContext2D;

/** the person's poses: hands resting low (forearm ~25° below horizontal) and at the keys */
export const ROOM01_POSES = {
  rest: {
    ...POSES.sit,
    angles: { ...POSES.sit.angles, torso: 4, shoulderF: 10, elbowF: 55, wristF: 6, shoulderB: 8, elbowB: 57, wristB: 6 },
    // palms down on the thighs (a 'relaxed' hand would pick up the cast's mug and read as a held book)
    handF: 'palmDown',
    handB: 'palmDown',
  } as Pose,
  type: POSES.type,
};

const PX = 664;
const PS = 1.3;
const FLOOR = 690;
const person = cast['chat-user'];

/** the keyboard: where the typing hand lands (measured from the puppet, so the desk fits the figure) */
const HAND = person.anchor({ x: PX, y: FLOOR, facing: 'right', pose: POSES.type, scale: PS }, 'handF');
const HEAD = person.anchor({ x: PX, y: FLOOR, facing: 'right', pose: POSES.type, scale: PS }, 'head');
const DESK_Y = Math.round(HAND.y + 7);
const HX = Math.round(HAND.x + 46); // the lid's hinge (a real laptop's size against the figure)

export const ROOM01 = {
  floorY: FLOOR,
  personX: PX,
  personScale: PS,
  deskY: DESK_Y,
  deskX0: PX + 20,
  deskX1: HX + 250,
  window: { x: 588, y: 40, w: 560, h: 492 },
  hinge: { x: HX, y: DESK_Y - 5 },
  /** the visible sliver of the screen's face (L4 world): BL, BR, TR, TL */
  face: [
    { x: HX - 25, y: DESK_Y - 6 },
    { x: HX - 1, y: DESK_Y - 7 },
    { x: HX + 10, y: DESK_Y - 74 },
    { x: HX - 15, y: DESK_Y - 70 },
  ],
  mugX: HX + 96,
  head: HEAD,
  hand: HAND,
} as const;

/** the face's centre and the cursor (low on the face, near the user) */
const F = ROOM01.face;
export const FACE_C = { x: (F[0].x + F[1].x + F[2].x + F[3].x) / 4, y: (F[0].y + F[1].y + F[2].y + F[3].y) / 4 };
/** the lid seen edge-on (L4 world): b = at the hinge, t = the top edge; it leans back, away from the user */
export const LID = { b: { x: HX - 1, y: DESK_Y - 5 }, t: { x: HX + 10, y: DESK_Y - 74 } } as const;
/** the text cursor: a 2 x 6 px tick of screen light just inside the lid's inner edge, a third of the way up from the
 *  hinge (where the panel's lit face would show it); the dark's pinprick and the room's blink are the same point */
export const ROOM01_CURSOR = (() => {
  const u = 0.3;
  const x = HX - 1 + 11 * u, y = DESK_Y - 5 - 69 * u;
  return { x: x - 4.6, y: y - 3, w: 2, h: 6 };
})();

/** the far-left furniture (rest-screen px): the hall doorway and the picture (L2), the credenza and lamp (L3) */
const DOOR = { x: 196, y: 196, w: 112 };
const PICTURE = { x: 404, y: 318, w: 118, h: 88 };
const CRED_X = 380;
const LAMP_X = 344;

/** the nearer city rank: its own plane between the far city and the wall */
export const CITY_NEAR: LayerSpec = { id: 'cityNear', z: 2700, haze: 0.42, blur: 1.6 };

const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);

// ---------------------------------------------------------------- the near city rank (towers + lit windows)
interface Tower {
  x: number;
  w: number;
  top: number;
  crown: number;
}
interface Pane {
  x: number;
  y: number;
  /** 0 = cool (screen-lit), 1 = warm (a lamp) */
  warm: number;
  a: number;
}
function nearTowers(x0: number, x1: number): { towers: Tower[]; lit: { x: number; y: number }[]; panes: Pane[] } {
  const towers: Tower[] = [];
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = 38 + hash1(i, 71) * 70;
    const top = 250 + hash1(i, 72) * 210 - (Math.abs(x - 870) < 160 ? 70 : 0);
    towers.push({ x, w, top, crown: hash1(i, 73) });
    x += w + 4 + hash1(i, 74) * 22;
    i++;
  }
  // ~22 lit windows, seeded, on the towers that show through the glass
  const lit: { x: number; y: number }[] = [];
  for (let k = 0; lit.length < 22 && k < 400; k++) {
    const T = towers[Math.floor(hash1(k, 81) * towers.length)];
    if (T.x + T.w < 600 || T.x > 1140) continue;
    const col = Math.floor(hash1(k, 82) * Math.max(1, Math.floor((T.w - 8) / 9)));
    const row = Math.floor(hash1(k, 83) * 22);
    const wx = T.x + 6 + col * 9;
    const wy = T.top + 14 + row * 12;
    if (wy > 600) continue;
    lit.push({ x: wx, y: wy });
  }
  // two towers through the glass carry a cluster of lived-in panes (warm lamps and cool screens at
  // different strengths), so the backlight has a source; low chroma, the laptop stays the one accent
  const panes: Pane[] = [];
  const cands = towers.filter((T) => T.x > 690 && T.x + T.w < 1110 && T.w > 52).sort((a, b) => a.top - b.top);
  const picks = cands.slice(0, 2);
  picks.forEach((T, ti) => {
    const cols = Math.max(2, Math.floor((T.w - 8) / 9));
    const n = ti === 0 ? 8 : 6;
    for (let k = 0, made = 0; made < n && k < 120; k++) {
      const col = Math.floor(hash1(k, 91 + ti * 7) * cols);
      const row = 2 + Math.floor(hash1(k, 92 + ti * 7) * 18);
      const wx = T.x + 6 + col * 9;
      const wy = T.top + 14 + row * 12;
      if (wy > 590 || panes.some((q) => q.x === wx && q.y === wy)) continue;
      panes.push({ x: wx, y: wy, warm: hash1(k, 93 + ti * 7) < 0.45 ? 1 : 0, a: 0.45 + 0.55 * hash1(k, 94 + ti * 7) });
      made++;
    }
  });
  return { towers, lit, panes };
}
let NEAR: ReturnType<typeof nearTowers> | null = null;

// ---------------------------------------------------------------- the screen rim (a local crescent of screen light)
let RIM_CV: HTMLCanvasElement | null = null;
/** draws the person once more as a crescent of screen light on the edges facing the screen (1.5 px at 1080p),
 *  falling off from the screen and clipped ABOVE the desk top: the face, the chest and the fingertips catch it,
 *  the back and the legs never do */
function screenRim(c: C, env: PaintEnv, drawFigure: (cc: C) => void, k: number) {
  if (k <= 0.01) return;
  const W = c.canvas.width, H = c.canvas.height;
  if (!RIM_CV || RIM_CV.width !== W || RIM_CV.height !== H) RIM_CV = makeCanvas(W, H);
  const r = RIM_CV.getContext('2d')!;
  r.setTransform(1, 0, 0, 1, 0, 0);
  r.globalCompositeOperation = 'source-over';
  r.clearRect(0, 0, W, H);
  r.setTransform(c.getTransform());
  r.save();
  r.beginPath();
  r.rect(PX - 260, 0, FACE_C.x - PX + 300, DESK_Y - 1);
  r.clip();
  drawFigure(r);
  r.restore();
  r.globalCompositeOperation = 'source-in';
  const col = mixLab(env.mood.rim, env.mood.core, 0.55);
  const g = r.createRadialGradient(FACE_C.x - 10, FACE_C.y - 30, 10, FACE_C.x - 10, FACE_C.y - 30, 300);
  g.addColorStop(0, withAlpha(col, 1));
  g.addColorStop(0.55, withAlpha(col, 0.85));
  g.addColorStop(1, withAlpha(col, 0.25));
  r.fillStyle = g;
  r.fillRect(FACE_C.x - 340, FACE_C.y - 340, 680, 680);
  // cut away all but the crescent facing the screen (the copy shifted away from the light, i.e. left)
  r.globalCompositeOperation = 'destination-out';
  const m = c.getTransform();
  const off = 1.5 * (env.pxScale / 1.5);
  r.setTransform(m.a, m.b, m.c, m.d, m.e - off, m.f + off * 0.2);
  drawFigure(r);
  r.globalCompositeOperation = 'source-over';
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = Math.min(1, k);
  c.drawImage(RIM_CV, 0, 0);
  // a second, additive pass: the crescent glows (the face, chest and fingertips catch the screen)
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = Math.min(1, 0.6 * k);
  c.drawImage(RIM_CV, 0, 0);
  c.restore();
}

// ---------------------------------------------------------------- the figure's paper-cut signature
/** maps head-art units (chin at y 0, ear at x 0, the kit's head space) to L4 world at a pose, from the head and
 *  eye anchors (head = art (0, -0.55), eye = art (0.33, -0.5)) */
function headFrame(pose: Pose) {
  const o = { x: PX, y: FLOOR, facing: 'right' as const, pose, scale: PS };
  const h = person.anchor(o, 'head');
  const e = person.anchor(o, 'eye');
  const bx = 0.33, by = 0.05;
  const hu = Math.hypot(e.x - h.x, e.y - h.y) / Math.hypot(bx, by);
  const a = Math.atan2(e.y - h.y, e.x - h.x) - Math.atan2(by, bx);
  const ca = Math.cos(a), sa = Math.sin(a);
  return (x: number, y: number): [number, number] => {
    const lx = x * hu, ly = (y + 0.55) * hu;
    return [h.x + lx * ca - ly * sa, h.y + lx * sa + ly * ca];
  };
}
/** a cut lock: a tapered curl from a base edge (b0 -> b1, inside the hair mass) out to a tip */
function lock(c: C, M: (x: number, y: number) => [number, number], b0: [number, number], tip: [number, number], b1: [number, number], bend: number) {
  const mx = (b0[0] + tip[0]) / 2, my = (b0[1] + tip[1]) / 2;
  const nx = -(tip[1] - b0[1]), ny = tip[0] - b0[0];
  c.moveTo(...M(...b0));
  c.quadraticCurveTo(...M(mx + nx * bend, my + ny * bend), ...M(...tip));
  const qx = (b1[0] + tip[0]) / 2, qy = (b1[1] + tip[1]) / 2;
  c.quadraticCurveTo(...M(qx + nx * bend * 0.6, qy + ny * bend * 0.6), ...M(...b1));
  c.closePath();
}
/** the user's signature in silhouette: three cut locks (a crown flick, a nape curl over the collar, a fringe
 *  lock over the brow), the quarter-zip's mock collar standing proud at the nape with a notch, and a ribbed sleeve
 *  cuff at the near wrist. Drawn in the figure's ink; with `rimK` the cuff seam and the fringe catch the screen */
function personSignature(c: C, env: PaintEnv, pose: Pose, rimK: number) {
  const M = headFrame(pose);
  c.save();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  // two crown locks swept BACK along the hair's flow (cut tips trailing behind the head, not upward)
  lock(c, M, [-0.22, -1.06], [-0.5, -1.02], [-0.34, -0.96], -0.16);
  lock(c, M, [-0.38, -0.92], [-0.6, -0.8], [-0.46, -0.76], -0.14);
  // the nape curl, flicking out over the collar
  lock(c, M, [-0.47, -0.6], [-0.6, -0.36], [-0.43, -0.4], -0.22);
  // a short fringe lock lying down over the brow
  lock(c, M, [0.2, -1.03], [0.37, -0.83], [0.3, -0.95], 0.1);
  c.fill();
  // the mock collar: a band standing proud of the neck at the nape, with a cut notch where it folds
  c.beginPath();
  c.moveTo(...M(-0.3, -0.18));
  c.lineTo(...M(-0.44, -0.08));
  c.lineTo(...M(-0.4, 0.0));
  c.lineTo(...M(-0.47, 0.06));
  c.lineTo(...M(-0.5, 0.3));
  c.lineTo(...M(-0.2, 0.32));
  c.closePath();
  c.fill();
  // the sleeve cuff at the near wrist: a ribbed band a touch wider than the sleeve
  const o = { x: PX, y: FLOOR, facing: 'right' as const, pose, scale: PS };
  // (anchors taken with non-holding shapes, so they follow the wrist and never jump to the mug's tip)
  const a = person.anchor({ ...o, pose: { ...pose, handF: 'typing' } }, 'handF');
  const b = person.anchor({ ...o, pose: { ...pose, handF: 'open' } }, 'handF');
  const ux0 = b.x - a.x, uy0 = b.y - a.y;
  const un = Math.hypot(ux0, uy0) || 1;
  const ux = ux0 / un, uy = uy0 / un;
  const Lh = un / 0.4; // hand length
  const wx = a.x - ux * 0.55 * Lh, wy = a.y - uy * 0.55 * Lh; // the wrist
  const nx = -uy, ny = ux;
  const hw = 0.36 * Lh; // the cuff's half-width
  const q = (along: number, side: number): [number, number] => [wx - ux * along + nx * side, wy - uy * along + ny * side];
  c.beginPath();
  c.moveTo(...q(-0.5, -hw * 0.92));
  c.lineTo(...q(0.42 * Lh, -hw * 1.08));
  c.lineTo(...q(0.42 * Lh, hw * 1.08));
  c.lineTo(...q(-0.5, hw * 0.92));
  c.closePath();
  c.fill();
  if (rimK > 0.02) {
    // the cuff's seam and its rib lines catch the screen (thin, on the near side only)
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55 * rimK);
    c.lineWidth = 1.1 / (env.pxScale / 1.5) / 1.5;
    c.beginPath();
    c.moveTo(...q(0.42 * Lh, -hw * 1.08));
    c.lineTo(...q(0.42 * Lh, hw * 0.4));
    c.moveTo(...q(0.2 * Lh, -hw * 1.0));
    c.lineTo(...q(0.2 * Lh, -hw * 0.2));
    c.stroke();
  }
  c.restore();
}

export interface Room01Opts {
  key: string;
  cams: Camera3[];
  /** 0..1 the backlight (window + city) coming up: the first stage of the reveal */
  resolve?: number;
  /** 0..1 the fog sheets (second stage) */
  fog?: number;
  /** 0..1 the screen's light on the room and the figure's rim (third stage) */
  light?: number;
  /** 0..1 screen brightness */
  glow?: number;
  /** the person's pose this frame (on twos; the shot adds life) */
  pose: Pose;
  /** 0..1 the 'wonder' lift: the screen a step brighter, a visible cyan wash on the desk top and the hands */
  boost?: number;
  /** 0..1 the screen as the hero practical: 0 = a modest glow, 1 = the bible's full practical spec */
  hero?: number;
  /** draw the near-right occluder (an armchair back, L5) */
  nearRight?: boolean;
  /** draw the cursor on the face */
  cursorOn?: boolean;
  /** draw the near layers (plant, curtain) */
  near?: boolean;
  /** 0..1 the screen-side contour rim on the person (face, chest, fingertips) */
  screenRimK?: number;
  /** 0..1 the 'wonder' step: the screen's light on the face up ~15% */
  faceGlow?: number;
  /** the near plant's x (L5 world) and the curtain's leading edge (L6 world) */
  plantX?: number;
  curtainX?: number;
}

export function room01(f: Frame, o: Room01Opts) {
  const R = o.resolve ?? 1;
  const FG = o.fog ?? R;
  const LT = o.light ?? R;
  const glow = o.glow ?? 1;
  const BO = o.boost ?? 0;
  const Wn = ROOM01.window;
  // the glass is a back plane, not the key: held ~12 L* under the old level so the laptop leads the eye
  f.backlight({ sunX: Wn.x + Wn.w * 0.55, sunY: 470, sunRadius: 460, intensity: 0.5 * R });

  // L1: the far city, hazy, under a deep-blue sky
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 60);
    bake(f, c, `${o.key}/r01/L1/${env.mood.id}/${rk(r)}`, r, (cc) => {
      stars(cc, { x: r.x, y: r.y, w: r.w, h: 300, count: 60, seed: 26, twinkle: 0 }, env);
      // the city's light dome: a soft haze glow low over the glass (the backlight's source)
      const cxg = Wn.x + Wn.w * 0.55;
      const dome = cc.createRadialGradient(cxg, 600, 20, cxg, 600, 520);
      dome.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.sky[2], 0.4), 0.28));
      dome.addColorStop(0.45, withAlpha(mixLab(env.mood.halo, env.mood.sky[2], 0.6), 0.1));
      dome.addColorStop(1, withAlpha(env.mood.sky[2], 0));
      cc.fillStyle = dome;
      cc.fillRect(r.x, r.y, r.w, r.h);
      skyline(cc, { style: 'megacity', x0: r.x, x1: r.x + r.w, y: 560, height: 330, seed: 2026, lit: 0.05, ground: 400 }, env);
      // haze lying between the far towers (a band over their feet)
      const hz = cc.createLinearGradient(0, 330, 0, 600);
      hz.addColorStop(0, withAlpha(env.mood.haze, 0));
      hz.addColorStop(0.7, withAlpha(env.mood.haze, 0.15));
      hz.addColorStop(1, withAlpha(env.mood.haze, 0.2));
      cc.fillStyle = hz;
      cc.fillRect(r.x, 330, r.w, 270);
    });
  });
  // the near rank: crisper towers, a scatter of small lit windows (the city s03 flies over)
  f.layer(CITY_NEAR, (c, env) => {
    const r = overscan(CITY_NEAR, o.cams, 60);
    if (!NEAR) NEAR = nearTowers(r.x - 40, r.x + r.w + 40);
    const N = NEAR;
    bake(f, c, `${o.key}/r01/near/${env.mood.id}/${rk(r)}`, r, (cc) => {
      cc.fillStyle = mixLab(env.fill('set'), env.mood.sky[1], 0.25);
      for (const T of N.towers) {
        cc.fillRect(T.x, T.top, T.w, 720 - T.top);
        if (T.crown < 0.3) cc.fillRect(T.x + T.w * 0.2, T.top - 12, T.w * 0.6, 13);
        else if (T.crown < 0.45) {
          cc.beginPath();
          cc.moveTo(T.x, T.top + 1);
          cc.lineTo(T.x + T.w / 2, T.top - T.w * 0.5);
          cc.lineTo(T.x + T.w, T.top + 1);
          cc.fill();
        } else if (T.crown < 0.55) cc.fillRect(T.x + T.w / 2 - 1, T.top - 34, 2, 35);
      }
      // dim unlit window grid (shape only)
      cc.fillStyle = withAlpha(env.mood.sky[2], 0.08);
      for (const T of N.towers) for (let y = T.top + 14; y < 600; y += 12) for (let x = T.x + 6; x < T.x + T.w - 6; x += 9) cc.fillRect(x, y, 3, 4);
      // the lit ones: core-coloured 3 x 4 px with a breath of halo
      for (const L of N.lit) {
        cc.fillStyle = withAlpha(env.mood.halo, 0.22);
        cc.fillRect(L.x - 2, L.y - 2, 7, 8);
        cc.fillStyle = mixLab(env.mood.core, env.mood.halo, 0.2);
        cc.fillRect(L.x, L.y, 3, 4);
      }
      // the lived-in cluster: warm lamp panes (desaturated toward the set) and cool screen panes
      const warmC = mixLab('#d9b27a', env.mood.set, 0.38);
      const coolC = mixLab(env.mood.core, env.mood.halo, 0.45);
      for (const P of N.panes) {
        const col = P.warm ? warmC : coolC;
        cc.fillStyle = withAlpha(col, 0.16 * P.a);
        cc.fillRect(P.x - 3, P.y - 3, 9, 10);
        cc.fillStyle = withAlpha(col, 0.5 + 0.45 * P.a);
        cc.fillRect(P.x, P.y, 3, 4);
      }
    });
  });
  // L2: the back wall with the tall paned window HOLE; mullions as ink bars with rim hairlines
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    bake(f, c, `${o.key}/r01/L2/${env.mood.id}/${rk(r)}`, r, (cc) => {
      const W = Wn;
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.7);
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(W.x, W.y, W.w, W.h);
      cc.fill('evenodd');
      // the floor (a step darker) below the skirting
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.86);
      cc.fillRect(r.x, 612, r.w, r.y + r.h - 612);
      cc.fillStyle = withAlpha(env.mood.rim, 0.08);
      cc.fillRect(r.x, 612, r.w, 1);
      const ink = env.fill('ink');
      // the doorway to the hall (left): a dark opening, the door ajar, a thin warm-grey sliver of hall light
      // down its latch side and a faint wedge of it on the floor (the room's far left now has a plane to read)
      {
        const D = DOOR;
        cc.fillStyle = mixLab(ink, env.mood.fg, 0.55);
        cc.fillRect(D.x, D.y, D.w, 612 - D.y);
        const hall = mixLab(env.mood.haze, '#a39a8b', 0.62);
        const sl = cc.createLinearGradient(0, D.y, 0, 612);
        sl.addColorStop(0, withAlpha(hall, 0.18));
        sl.addColorStop(0.5, withAlpha(hall, 0.42));
        sl.addColorStop(1, withAlpha(hall, 0.5));
        cc.fillStyle = sl;
        cc.fillRect(D.x + D.w - 9, D.y + 4, 4, 612 - D.y - 4);
        // the wedge on the floor, fanning toward the viewer
        cc.beginPath();
        cc.moveTo(D.x + D.w - 9, 612);
        cc.lineTo(D.x + D.w - 5, 612);
        cc.lineTo(D.x + D.w + 30, r.y + r.h);
        cc.lineTo(D.x + D.w - 4, r.y + r.h);
        cc.closePath();
        const wg = cc.createLinearGradient(0, 612, 0, 720);
        wg.addColorStop(0, withAlpha(hall, 0.22));
        wg.addColorStop(1, withAlpha(hall, 0));
        cc.fillStyle = wg;
        cc.fill();
        // the architrave (ink) with a hairline of window light on its head
        cc.fillStyle = ink;
        cc.fillRect(D.x - 12, D.y - 12, D.w + 24, 12);
        cc.fillRect(D.x - 12, D.y, 10, 612 - D.y);
        cc.fillRect(D.x + D.w + 2, D.y, 10, 612 - D.y);
        // the door leaf, ajar into the room's dark (a narrow ink slab)
        cc.fillRect(D.x + 2, D.y + 2, D.w - 16, 612 - D.y - 2);
        cc.fillStyle = withAlpha(env.mood.rim, 0.22);
        cc.fillRect(D.x - 12, D.y - 12, D.w + 24, 1.2);
      }
      // a framed picture above the credenza: an ink frame whose glass sits at the wall's own value (it must never
      // read as a second screen: the laptop is the room's one practical), with a single 1 px glint on its top edge
      {
        const P = PICTURE;
        cc.fillStyle = ink;
        cc.fillRect(P.x, P.y, P.w, P.h);
        cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.78);
        cc.fillRect(P.x + 9, P.y + 9, P.w - 18, P.h - 18);
        cc.fillStyle = withAlpha(env.mood.rim, 0.2);
        cc.fillRect(P.x + 9, P.y + 9, P.w - 18, 0.8);
      }
      // the window's light falling below the sill: a soft wash on the wall and a pool on the floor, so the
      // chair and the legs (L4, ink) cut against light rather than against a dark wall (bible §10.2)
      {
        const cx = W.x + W.w * 0.5;
        const sy = W.y + W.h + 14;
        cc.save();
        cc.beginPath();
        cc.rect(W.x - 200, sy, W.w + 400, 612 - sy);
        cc.clip();
        cc.translate(cx, sy);
        cc.scale(W.w * 0.66, 150);
        const wash = cc.createRadialGradient(0, 0, 0, 0, 0, 1);
        wash.addColorStop(0, withAlpha(mixLab(env.mood.haze, env.mood.sky[2], 0.45), 0.66));
        wash.addColorStop(0.55, withAlpha(env.mood.haze, 0.4));
        wash.addColorStop(1, withAlpha(env.mood.haze, 0));
        cc.fillStyle = wash;
        cc.fillRect(-1.2, 0, 2.4, 1.2);
        cc.restore();
        // the pool on the floor below the glass, fanning toward the viewer
        const pool = cc.createRadialGradient(cx, 612, 10, cx, 612, 420);
        pool.addColorStop(0, withAlpha(env.mood.haze, 0.42));
        pool.addColorStop(0.5, withAlpha(env.mood.haze, 0.2));
        pool.addColorStop(1, withAlpha(env.mood.haze, 0));
        cc.fillStyle = pool;
        cc.save();
        cc.beginPath();
        cc.rect(r.x, 612, r.w, r.y + r.h - 612);
        cc.clip();
        cc.translate(cx, 612);
        cc.scale(1, 0.32);
        cc.translate(-cx, -612);
        cc.fillRect(cx - 430, 612, 860, 430);
        cc.restore();
      }
      // the glass itself: a cool dark film over the hole (night glass holds some of the room's dark), so the
      // window sits ~12 L* under the laptop's light and stops being the largest bright shape in frame
      {
        const gt = cc.createLinearGradient(0, W.y, 0, W.y + W.h);
        gt.addColorStop(0, withAlpha(env.mood.fg, 0.36));
        gt.addColorStop(0.6, withAlpha(env.mood.fg, 0.24));
        gt.addColorStop(1, withAlpha(env.mood.fg, 0.18));
        cc.fillStyle = gt;
        cc.fillRect(W.x, W.y, W.w, W.h);
      }
      // the window: THREE tall lights with a transom and one mid rail; slim mullions (4.5 stage px ≈ 7 px at
      // 1080p) whose top edges carry a 1 px rim hairline (mullions as rim hairlines, not a cage)
      cc.fillStyle = ink;
      const bar = 4.5;
      const cols = 3;
      const rails = [0.2, 0.62];
      for (let i = 1; i < cols; i++) cc.fillRect(W.x + (W.w * i) / cols - bar / 2, W.y, bar, W.h);
      for (const u of rails) cc.fillRect(W.x, W.y + W.h * u - bar / 2, W.w, bar);
      cc.fillRect(W.x - 12, W.y - 12, W.w + 24, 13); // head
      cc.fillRect(W.x - 12, W.y, 12, W.h); // jambs
      cc.fillRect(W.x + W.w, W.y, 12, W.h);
      cc.fillRect(W.x - 22, W.y + W.h, W.w + 44, 14); // sill
      // rim hairlines: along the TOP edge of each rail and the sill (full), a fainter one down each mullion's
      // window-facing side
      cc.fillStyle = withAlpha(env.mood.rim, 0.42);
      for (const u of rails) cc.fillRect(W.x, W.y + W.h * u - bar / 2, W.w, 1);
      cc.fillRect(W.x - 22, W.y + W.h, W.w + 44, 1);
      cc.fillStyle = withAlpha(env.mood.rim, 0.16);
      for (let i = 1; i < cols; i++) cc.fillRect(W.x + (W.w * i) / cols - bar / 2, W.y, 1, W.h);
    });
  });
  f.fog({ yCenter: 520, height: 300, alpha: 0.13 * FG, drift: -6 });
  // L3: a low credenza with books and an unlit floor lamp against the far wall (left of the window)
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, o.cams, 40);
    bake(f, c, `${o.key}/r01/L3/${env.mood.id}/${rk(r)}`, r, (cc) => {
      const fill = mixLab(env.fill('set'), env.mood.fg, 0.45);
      cc.fillStyle = fill;
      const CX = CRED_X;
      cc.fillRect(CX, 520, 196, 96);
      cc.fillRect(CX + 12, 616, 8, 14);
      cc.fillRect(CX + 176, 616, 8, 14);
      // a row of spines and a leaning pair (plain silhouettes)
      let bx = CX + 18;
      for (let i = 0; i < 7; i++) {
        const bw = 9 + hash1(i, 91) * 9, bh = 34 + hash1(i, 92) * 30;
        cc.fillRect(bx, 520 - bh, bw, bh);
        bx += bw + 1.5;
      }
      cc.save();
      cc.translate(bx + 6, 520);
      cc.rotate(0.32);
      cc.fillRect(0, -54, 12, 54);
      cc.fillRect(13, -48, 10, 48);
      cc.restore();
      cc.fillRect(CX + 128, 506, 54, 14);
      cc.fillRect(CX + 132, 494, 46, 12);
      // the top edges catch the window light (tops only)
      cc.fillStyle = withAlpha(env.mood.rim, 0.2);
      cc.fillRect(CX, 520, 196, 1.2);
      cc.fillRect(CX + 128, 494, 46, 1.2);
      // the floor lamp, between the doorway and the credenza: a thin stem and a drum shade, unlit
      cc.fillStyle = fill;
      const LX = LAMP_X;
      cc.fillRect(LX - 2, 300, 4, 330);
      cc.beginPath();
      cc.moveTo(LX - 26, 300);
      cc.lineTo(LX + 26, 300);
      cc.lineTo(LX + 18, 262);
      cc.lineTo(LX - 18, 262);
      cc.closePath();
      cc.fill();
      cc.fillRect(LX - 16, 626, 32, 5);
      cc.fillStyle = withAlpha(env.mood.rim, 0.16);
      cc.fillRect(LX - 18, 262, 36, 1.2);
    });
  });
  // fog B: a low sheet BELOW the desk top (centred ~0.8H), behind the action plane: it sits behind the shins
  // and the chair base and stays off the torso, so the figure's upper body cuts against the dark wall
  f.fog({ yCenter: 598, height: 104, alpha: 0.24 * FG, drift: -9 });

  // L4: the desk, the laptop, the mug, the chair (the set), then the person on its own pass
  const P = ROOM01;
  const rimK = Math.max(0, Math.min(1, o.screenRimK ?? 0));
  /** toward the screen from the head: the figure's one key direction */
  const toScr = { x: FACE_C.x - HEAD.x, y: FACE_C.y - HEAD.y + 40 };
  const fig = { x: PX, y: FLOOR, facing: 'right' as const, pose: o.pose, scale: PS };
  /** the figure as a flat mask (the rim pass) or as the action plane: near-black (the darkest shape in frame),
   *  its cut-lines lit only on the screen side, plus its paper-cut signature (hair locks, collar, cuff) */
  const drawPerson = (cc: C, env: PaintEnv, lit = false) => {
    person.draw(cc, { ...fig, ink: PUPPET_NEAR_BLACK, cutLines: lit && rimK > 0.02, ...(lit ? { light: { x: toScr.x, y: toScr.y, floor: 0 } } : {}) }, env);
    personSignature(cc, env, o.pose, lit ? rimK : 0);
  };
  f.layer('L4', (c, env) => {
    c.save();
    const ink = env.fill('ink');
    c.fillStyle = ink;
    // the desk: a slim slab on two legs with a back rail
    c.fillRect(P.deskX0, P.deskY, P.deskX1 - P.deskX0, 9);
    c.fillRect(P.deskX0 + 18, P.deskY + 9, 8, FLOOR - P.deskY - 9);
    c.fillRect(P.deskX1 - 26, P.deskY + 9, 8, FLOOR - P.deskY - 9);
    c.fillRect(P.deskX0 + 18, P.deskY + 120, P.deskX1 - P.deskX0 - 36, 4);
    // the laptop base (keyboard deck seen almost edge-on) and the lid
    c.beginPath();
    c.moveTo(HX - 84, P.deskY);
    c.lineTo(HX + 6, P.deskY);
    c.lineTo(HX + 4, P.deskY - 5);
    c.lineTo(HX - 81, P.deskY - 4);
    c.closePath();
    c.fill();
    // the lid, seen EDGE-ON from our side: a thin ink slab leaning back from the hinge. Its screen faces the
    // user (left), so we never see the panel itself; only its light, a hairline on the slab's inner edge and a
    // fan of glow spilling LEFT over the keys, the hands, the chest and the face
    const L = LID;
    const m = env.mood;
    if (glow > 0.01) {
      // the spill: a soft additive pool of screen light lying LEFT of the panel (toward the user's hands, chest
      // and face); centred off the lid so almost nothing falls behind it
      c.save();
      c.globalCompositeOperation = 'lighter';
      const mx = (L.t.x + L.b.x) / 2 - 22, my = (L.t.y + L.b.y) / 2 + 8;
      c.translate(mx, my);
      c.scale(1, 0.8);
      const fan = c.createRadialGradient(0, 0, 0, 0, 0, 72);
      fan.addColorStop(0, withAlpha(m.halo, 0.22 * glow));
      fan.addColorStop(0.45, withAlpha(m.halo, 0.08 * glow));
      fan.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = fan;
      c.fillRect(-72, -72, 144, 144);
      c.restore();
    }
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(L.b.x - 2.6, L.b.y + 1);
    c.lineTo(L.b.x + 2.8, L.b.y + 1);
    c.lineTo(L.t.x + 2.6, L.t.y + 0.5);
    c.lineTo(L.t.x - 1.6, L.t.y - 1.2);
    c.closePath();
    c.fill();
    if (glow > 0.01) {
      // the panel's light catching the slab's inner edge: a hairline brightest near the top
      const hl = c.createLinearGradient(L.t.x, L.t.y, L.b.x, L.b.y);
      hl.addColorStop(0, withAlpha(m.core, 0.95 * glow));
      hl.addColorStop(0.6, withAlpha(mixLab(m.core, m.halo, 0.5), 0.75 * glow));
      hl.addColorStop(1, withAlpha(m.halo, 0.4 * glow));
      c.strokeStyle = hl;
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(L.t.x - 2, L.t.y);
      c.lineTo(L.b.x - 3, L.b.y);
      c.stroke();
      // the keyboard deck catches the screen's light along its top edge
      c.fillStyle = withAlpha(m.rim, 0.5 * glow);
      c.fillRect(HX - 81, P.deskY - 5, 84, 1.2);
    }
    if (o.cursorOn) {
      const Cc = ROOM01_CURSOR;
      c.fillStyle = env.mood.core;
      c.fillRect(Cc.x, Cc.y, Cc.w, Cc.h);
    }
    // the mug
    c.fillStyle = ink;
    c.fillRect(P.mugX, P.deskY - 40, 30, 40);
    c.lineWidth = 6;
    c.strokeStyle = ink;
    c.beginPath();
    c.arc(P.mugX + 34, P.deskY - 21, 10, -Math.PI / 2, Math.PI / 2);
    c.stroke();
    // the screen's soft wash on the desk top and the mug's flank: under the figure, so the figure stays ink
    const kw = glow * LT;
    if (kw > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(FACE_C.x - 10, P.deskY - 4, 4, FACE_C.x - 10, P.deskY - 4, 110);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.28 * kw));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(FACE_C.x - 130, P.deskY - 110, 250, 116);
      c.restore();
    }
    // the chair (seat matched to the figure)
    chair(c, { x: PX - 36, y: FLOOR, s: CHAIR_S, style: 'swivel', view: 'side' }, env);
    c.restore();
  });
  // the set's rim: TOPS only (desk top, chair back, mug lip), so nothing carries side or bottom strokes
  f.rim({ x: 0.2, y: -1 });
  // the screen: the key practical. Painted BEFORE the figure, so its halo lifts the air round the head and the
  // hands and the figure cuts against it, instead of the halo washing the figure itself
  const k = glow * LT;
  const H = Math.max(0, Math.min(1, o.hero ?? 0));
  if (k > 0.01) screenLight(f, k * (0.42 + 0.58 * H), 30 + 10 * H);
  f.layer('L4', (c, env) => {
    drawPerson(c, env, true);
    if (k > 0.01) {
      // the crescent of screen light on the face, chest and fingertips (above the desk top only: the back and
      // the legs stay ink)
      // (no broad pool on the face or torso: the 1.5 px crescent alone carries the screen on the ink figure)
      screenRim(c, env, (cc) => drawPerson(cc, env), k * Math.max(rimK, 0.35));
    }
  });
  // only the floor itself, below the feet, takes a breath of ground fog
  f.fog({ yCenter: 724, height: 70, alpha: 0.16 * FG, drift: -4 });
  if (o.near !== false) {
    roomPlant(f, { key: o.key, cams: o.cams, x: o.plantX ?? 70, floor: 790, alpha: 1, lift: 0.3 });
    if (o.nearRight) nearArmchair(f, o.key, o.cams[0]);
    // L6: a heavy curtain edge at frame right
    f.layer('L6', (c, env) => {
      const r = overscan(LAYERS.L6, o.cams, 40);
      bake(f, c, `${o.key}/r01/L6/${env.mood.id}/${o.curtainX ?? 1176}/${rk(r)}`, r, (cc) => {
        cc.fillStyle = env.fill('fg');
        const x0 = o.curtainX ?? 1176;
        cc.beginPath();
        cc.moveTo(x0 + 30, r.y - 10);
        for (let y = r.y; y <= r.y + r.h + 10; y += 40) cc.lineTo(x0 + 14 * Math.sin(y * 0.011) + (y > 560 ? (y - 560) * 0.08 : 0), y);
        cc.lineTo(r.x + r.w + 10, r.y + r.h + 10);
        cc.lineTo(r.x + r.w + 10, r.y - 10);
        cc.closePath();
        cc.fill();
        // one fold catching the window light
        cc.strokeStyle = withAlpha(env.mood.rim, 0.12);
        cc.lineWidth = 3;
        cc.beginPath();
        cc.moveTo(x0 + 46, r.y);
        cc.lineTo(x0 + 52, r.y + r.h);
        cc.stroke();
      });
    });
  }
}

// ---------------------------------------------------------------- the screen as a practical (edge-on)
/** the practical's three additive layers (bible §2.5: outer r = 260/70·R at α 0.16·I, inner r = R at
 *  α 0.35·I) centred just in front of the panel, and, instead of a round hot core, a narrow core lying ALONG
 *  the panel's face (an edge-on screen has no disc of light, only its lit plane) */
function screenLight(f: Frame, I: number, R: number) {
  f.layer('L4', (c, env) => {
    const m = env.mood;
    const halo = mixLab(m.halo, m.rim, 0.55);
    const core = mixLab(m.core, m.rim, 0.4);
    const cx = LID.b.x + (LID.t.x - LID.b.x) * 0.5 - 12, cy = LID.b.y + (LID.t.y - LID.b.y) * 0.5;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const glow = (r: number, col: string, a: number) => {
      if (a <= 0.002) return;
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, withAlpha(col, a));
      g.addColorStop(0.3, withAlpha(col, a * 0.62));
      g.addColorStop(0.65, withAlpha(col, a * 0.22));
      g.addColorStop(1, withAlpha(col, 0));
      c.fillStyle = g;
      c.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    };
    glow(R + 56, halo, 0.14 * I);
    glow(R, halo, 0.35 * I);
    // the core: a thin ellipse of light along the panel's face
    const ang = Math.atan2(LID.t.y - LID.b.y, LID.t.x - LID.b.x);
    const len = Math.hypot(LID.t.x - LID.b.x, LID.t.y - LID.b.y);
    c.translate((LID.t.x + LID.b.x) / 2 - 5, (LID.t.y + LID.b.y) / 2);
    c.rotate(ang);
    c.scale(1, 0.16);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, len * 0.55);
    g.addColorStop(0, withAlpha(core, 0.6 * I));
    g.addColorStop(0.6, withAlpha(core, 0.25 * I));
    g.addColorStop(1, withAlpha(core, 0));
    c.fillStyle = g;
    c.fillRect(-len, -len, 2 * len, 2 * len);
    c.restore();
  });
}

// ---------------------------------------------------------------- the near-right occluder (L5)
/** the back and wing of an armchair close to the lens at frame right, blurred by L5: the shot's near plane,
 *  sliding out past the lens during the push-in. Authored in screen terms at the rest camera `cam0`. */
function nearArmchair(f: Frame, key: string, cam0: Camera3) {
  f.layer('L5', (c, env) => {
    const P = (sx: number, sy: number) => toLayer(LAYERS.L5, cam0, sx, sy);
    const a = P(960, 500), b = P(1420, 860);
    const bx = a.x - 20, by = a.y - 20, bw = b.x - a.x + 40, bh = b.y - a.y + 40;
    f.cached(`${key}/r01/armchair/${env.mood.id}/${Math.round(bx)},${Math.round(by)}`, Math.ceil(bw), Math.ceil(bh), (cc) => {
      cc.translate(-bx, -by);
      // one step LIGHTER than the near-black figure (the figure stays the darkest shape in frame)
      const ink = mixLab(env.fill('ink'), env.mood.set, 0.3);
      cc.fillStyle = ink;
      const q = (sx: number, sy: number) => {
        const p = P(sx, sy);
        return [p.x, p.y] as const;
      };
      cc.beginPath();
      cc.moveTo(...q(1000, 860));
      cc.lineTo(...q(1004, 620));
      // the wing: a soft scroll rising at the left of the back
      cc.bezierCurveTo(...q(1002, 570), ...q(1018, 540), ...q(1050, 534));
      cc.bezierCurveTo(...q(1072, 531), ...q(1080, 548), ...q(1084, 564));
      // the back's rounded top running off frame right
      cc.bezierCurveTo(...q(1140, 540), ...q(1250, 528), ...q(1420, 534));
      cc.lineTo(...q(1420, 860));
      cc.closePath();
      cc.fill();
      // the top edge of the back catches the window: a faint hairline (L5 is blurred, so it reads as a sheen)
      cc.strokeStyle = withAlpha(env.mood.rim, 0.14);
      cc.lineWidth = 2;
      cc.beginPath();
      cc.moveTo(...q(1086, 562));
      cc.bezierCurveTo(...q(1140, 540), ...q(1250, 529), ...q(1420, 535));
      cc.stroke();
    })(c, bx, by);
  });
}

/** chair scale so its seat meets the figure's thighs */
const CHAIR_S = (() => {
  const seat = seatHeight(person.spec, POSES.type) * PS;
  const a = chair.anchors({ x: 0, y: 0, s: 1, style: 'swivel', view: 'side' }).seat;
  const h = -a.y;
  return h > 1 ? Math.max(0.8, Math.min(1.8, seat / h)) : PS;
})();
