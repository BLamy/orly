/**
 * neural-net-history — THE DARK ROOM for the return to the scene (ch12-s06): the exact composition of the cold
 * open (sets/ch01-s01-room, copied here so that shot stays untouched), plus what the return needs:
 *   flood        the city through the room's own window: small windows light one by one, then in a flood
 *                (per-frame lit windows on the near rank, behind the wall: no counter, no caption)
 *   extra        L4 drawing after the person (the chat box, its door, the slip)
 *   after        drawing after the rim pass (the warm light spilling from the open door)
 *
 *   room06(f, { key, cams, pose, glow, flood: { t, at, n1, d1, d2 }, extra, after })
 *   ROOM06 / FACE06    geometry (L4 world = rest-screen px), identical to ROOM01 / FACE_C
 */
import type { Camera3, Frame, LayerSpec, PaintEnv, Pose } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { skyline } from '../../../film/silhouette/architecture';
import { stars } from '../../../film/silhouette/nature';
import { chair } from '../../../film/silhouette/props';
import { POSES, seatHeight } from '../../../film/silhouette/puppet';
import { hash1, makeCanvas } from '../../../film/silhouette/atmosphere';
import { cast } from '../cast';
import { roomPlant } from './ch01-s01-roomExtras';
import { clamp01 } from './ch02-s05b-util';

type C = CanvasRenderingContext2D;

/** the person's poses: hands resting low (forearm ~25° below horizontal) and at the keys */
export const ROOM06_POSES = {
  rest: {
    ...POSES.sit,
    angles: { ...POSES.sit.angles, torso: 4, shoulderF: 10, elbowF: 55, wristF: 6, shoulderB: 8, elbowB: 57, wristB: 6 },
    handF: 'relaxed',
    handB: 'relaxed',
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

export const ROOM06 = {
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
const F = ROOM06.face;
export const FACE06 = { x: (F[0].x + F[1].x + F[2].x + F[3].x) / 4, y: (F[0].y + F[1].y + F[2].y + F[3].y) / 4 };
const ROOM06_CURSOR = { x: F[0].x + 7, y: F[0].y - 16, w: 2.4, h: 7 };

/** the nearer city rank: its own plane between the far city and the wall */
export const CITY_NEAR06: LayerSpec = { id: 'cityNear06', z: 2700, haze: 0.42, blur: 1.6 };

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
function nearTowers(x0: number, x1: number): { towers: Tower[]; lit: { x: number; y: number }[] } {
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
  return { towers, lit };
}
let NEAR: ReturnType<typeof nearTowers> | null = null;

// ---------------------------------------------------------------- the screen rim (a local crescent of screen light)
let RIM_CV: HTMLCanvasElement | null = null;
/** draws the person once more as a crescent of screen light on the edges facing the screen, falling off */
function screenRim(c: C, env: PaintEnv, drawFigure: (cc: C) => void, k: number) {
  if (k <= 0.01) return;
  const W = c.canvas.width, H = c.canvas.height;
  if (!RIM_CV || RIM_CV.width !== W || RIM_CV.height !== H) RIM_CV = makeCanvas(W, H);
  const r = RIM_CV.getContext('2d')!;
  r.setTransform(1, 0, 0, 1, 0, 0);
  r.globalCompositeOperation = 'source-over';
  r.clearRect(0, 0, W, H);
  r.setTransform(c.getTransform());
  drawFigure(r);
  r.globalCompositeOperation = 'source-in';
  const col = mixLab(env.mood.rim, env.mood.core, 0.55);
  const g = r.createRadialGradient(FACE06.x - 20, FACE06.y, 10, FACE06.x - 20, FACE06.y, 360);
  g.addColorStop(0, withAlpha(col, 1));
  g.addColorStop(0.5, withAlpha(col, 0.85));
  g.addColorStop(1, withAlpha(col, 0.1));
  r.fillStyle = g;
  r.fillRect(FACE06.x - 340, FACE06.y - 340, 680, 680);
  // cut away all but the crescent facing the screen (the copy shifted away from the light, i.e. left)
  r.globalCompositeOperation = 'destination-out';
  const m = c.getTransform();
  const off = 2.0 * env.pxScale;
  r.setTransform(m.a, m.b, m.c, m.d, m.e - off, m.f + off * 0.15);
  drawFigure(r);
  r.globalCompositeOperation = 'source-over';
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = Math.min(1, k);
  c.drawImage(RIM_CV, 0, 0);
  // a second, additive pass: the crescent glows (the face, chest and fingertips catch the screen)
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = Math.min(1, 0.55 * k);
  c.drawImage(RIM_CV, 0, 0);
  c.restore();
}

export interface Room06Opts {
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
  /** draw the cursor on the face */
  cursorOn?: boolean;
  /** draw the near layers (plant, curtain) */
  near?: boolean;
  /** the city flood: windows light one by one from `at` (n1 of them over d1 s), then the rest over d2 s */
  flood?: { t: number; at: number; n1?: number; d1?: number; d2?: number };
  /** L4 drawing after the person */
  extra?: (c: C, env: PaintEnv) => void;
  /** drawing after the rim pass and the screen practical, before the near layers */
  after?: (f: Frame) => void;
}

export function room06(f: Frame, o: Room06Opts) {
  const R = o.resolve ?? 1;
  const FG = o.fog ?? R;
  const LT = o.light ?? R;
  const glow = o.glow ?? 1;
  const Wn = ROOM06.window;
  f.backlight({ sunX: Wn.x + Wn.w * 0.55, sunY: 470, sunRadius: 520, intensity: 0.9 * R });

  // L1: the far city, hazy, under a deep-blue sky
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 60);
    bake(f, c, `${o.key}/r06/L1/${env.mood.id}/${rk(r)}`, r, (cc) => {
      stars(cc, { x: r.x, y: r.y, w: r.w, h: 300, count: 60, seed: 26, twinkle: 0 }, env);
      skyline(cc, { style: 'megacity', x0: r.x, x1: r.x + r.w, y: 560, height: 330, seed: 2026, lit: 0.05, ground: 400 }, env);
    });
  });
  // the near rank: crisper towers, a scatter of small lit windows (the city s03 flies over)
  f.layer(CITY_NEAR06, (c, env) => {
    const r = overscan(CITY_NEAR06, o.cams, 60);
    if (!NEAR) NEAR = nearTowers(r.x - 40, r.x + r.w + 40);
    const N = NEAR;
    bake(f, c, `${o.key}/r06/near/${env.mood.id}/${rk(r)}`, r, (cc) => {
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
    });
    if (o.flood) floodWindows(c, env, N, o.flood);
  });
  // L2: the back wall with the tall paned window HOLE; mullions as ink bars with rim hairlines
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    bake(f, c, `${o.key}/r06/L2/${env.mood.id}/${rk(r)}`, r, (cc) => {
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
      cc.fillStyle = ink;
      const bar = 7;
      const cols = 4, rows = 5;
      for (let i = 1; i < cols; i++) cc.fillRect(W.x + (W.w * i) / cols - bar / 2, W.y, bar, W.h);
      for (let j = 1; j < rows; j++) cc.fillRect(W.x, W.y + (W.h * j) / rows - bar / 2, W.w, bar);
      cc.fillRect(W.x - 12, W.y - 12, W.w + 24, 13); // head
      cc.fillRect(W.x - 12, W.y, 12, W.h); // jambs
      cc.fillRect(W.x + W.w, W.y, 12, W.h);
      cc.fillRect(W.x - 22, W.y + W.h, W.w + 44, 14); // sill
      // rim hairlines on the mullions' window-facing edges
      cc.strokeStyle = withAlpha(env.mood.rim, 0.34);
      cc.lineWidth = 1;
      for (let i = 1; i < cols; i++) {
        const x = W.x + (W.w * i) / cols - bar / 2;
        cc.beginPath();
        cc.moveTo(x, W.y);
        cc.lineTo(x, W.y + W.h);
        cc.stroke();
      }
      for (let j = 1; j < rows; j++) {
        const y = W.y + (W.h * j) / rows + bar / 2;
        cc.beginPath();
        cc.moveTo(W.x, y);
        cc.lineTo(W.x + W.w, y);
        cc.stroke();
      }
      cc.strokeStyle = withAlpha(env.mood.rim, 0.22);
      cc.beginPath();
      cc.moveTo(W.x - 22, W.y + W.h);
      cc.lineTo(W.x + W.w + 22, W.y + W.h);
      cc.stroke();
    });
  });
  f.fog({ yCenter: 520, height: 300, alpha: 0.2 * FG, drift: -6 });
  // L3: a low credenza with books and an unlit floor lamp against the far wall (left of the window)
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, o.cams, 40);
    bake(f, c, `${o.key}/r06/L3/${env.mood.id}/${rk(r)}`, r, (cc) => {
      const fill = mixLab(env.fill('set'), env.mood.fg, 0.45);
      cc.fillStyle = fill;
      cc.fillRect(170, 520, 330, 96);
      cc.fillRect(182, 616, 8, 14);
      cc.fillRect(480, 616, 8, 14);
      // a row of spines and a leaning pair (plain silhouettes)
      let bx = 196;
      for (let i = 0; i < 11; i++) {
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
      cc.fillRect(400, 506, 70, 14);
      cc.fillRect(406, 494, 58, 12);
      // the floor lamp: a thin stem and a drum shade, unlit
      cc.fillStyle = fill;
      cc.fillRect(536, 300, 4, 330);
      cc.beginPath();
      cc.moveTo(512, 300);
      cc.lineTo(564, 300);
      cc.lineTo(556, 262);
      cc.lineTo(520, 262);
      cc.closePath();
      cc.fill();
      cc.fillRect(522, 626, 32, 5);
    });
  });
  f.fog({ yCenter: 640, height: 150, alpha: 0.12 * FG, drift: -9 });
  // fog lying at desk height across the floor: BEHIND the action plane, so the figure, desk and chair stay ink
  f.fog({ yCenter: 560, height: 170, alpha: 0.22 * FG, drift: -7 });

  // L4: the desk, the laptop, the mug, the chair, the person
  const P = ROOM06;
  const drawPerson = (cc: C, env: PaintEnv) => person.draw(cc, { x: PX, y: FLOOR, facing: 'right', pose: o.pose, scale: PS, cutLines: false }, env);
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
    const B = P.face[0];
    c.beginPath();
    c.moveTo(HX - 84, P.deskY);
    c.lineTo(HX + 6, P.deskY);
    c.lineTo(HX + 4, P.deskY - 5);
    c.lineTo(HX - 81, P.deskY - 4);
    c.closePath();
    c.fill();
    // the lid's back (ink): a thin slab behind the face
    const Fc = P.face;
    c.beginPath();
    c.moveTo(Fc[1].x - 2, Fc[1].y + 2);
    c.lineTo(Fc[1].x + 6, Fc[1].y + 1);
    c.lineTo(Fc[2].x + 7, Fc[2].y - 1);
    c.lineTo(Fc[3].x - 3, Fc[3].y - 4);
    c.lineTo(B.x - 4, B.y + 2);
    c.closePath();
    c.fill();
    // the face: graded, the core at the top edge falling toward the hinge
    if (glow > 0.01) {
      const top = { x: (Fc[2].x + Fc[3].x) / 2, y: (Fc[2].y + Fc[3].y) / 2 };
      const bot = { x: (Fc[0].x + Fc[1].x) / 2, y: (Fc[0].y + Fc[1].y) / 2 };
      const g = c.createLinearGradient(top.x, top.y, bot.x, bot.y);
      const m = env.mood;
      g.addColorStop(0, withAlpha(m.core, 0.95 * glow));
      g.addColorStop(0.12, withAlpha(mixLab(m.halo, m.rim, 0.45), 0.85 * glow));
      g.addColorStop(0.5, withAlpha(mixLab(m.halo, m.set, 0.55), 0.7 * glow));
      g.addColorStop(1, withAlpha(mixLab(m.set, m.ink, 0.45), 0.9));
      c.fillStyle = g;
      c.beginPath();
      // inset 2.4 px for the bezel
      const ins = (p: { x: number; y: number }, q: { x: number; y: number }, k: number) => ({ x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k });
      const cx = FACE06.x, cy = FACE06.y;
      Fc.forEach((p, i) => {
        const q = ins(p, { x: cx, y: cy }, 0.1);
        if (i === 0) c.moveTo(q.x, q.y);
        else c.lineTo(q.x, q.y);
      });
      c.closePath();
      c.fill();
      // the keyboard deck catches the face's light along its top edge
      c.fillStyle = withAlpha(m.rim, 0.45 * glow);
      c.fillRect(HX - 81, P.deskY - 5, 84, 1.2);
    }
    if (o.cursorOn) {
      const Cc = ROOM06_CURSOR;
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
      const g = c.createRadialGradient(FACE06.x - 10, P.deskY - 4, 4, FACE06.x - 10, P.deskY - 4, 200);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.3 * kw));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(FACE06.x - 230, P.deskY - 200, 440, 210);
      c.restore();
    }
    // the chair (seat matched to the figure) and the person
    chair(c, { x: PX - 36, y: FLOOR, s: CHAIR_S, style: 'swivel', view: 'side' }, env);
    drawPerson(c, env);
    o.extra?.(c, env);
    c.restore();
  });
  f.rim({ x: 1, y: -0.15 });
  // the screen: the one practical, spilling over the desk, the mug and the figure
  const k = glow * LT;
  if (k > 0.01) {
    f.practical({ x: FACE06.x - 2, y: FACE06.y + 4, kind: 'screen', seed: 7, intensity: 0.32 * k, radius: 34 });
    f.layer('L4', (c, env) => {
      screenRim(c, env, (cc) => drawPerson(cc, env), k);
    });
  }
  o.after?.(f);
  // only the floor itself, below the feet, takes a breath of ground fog
  f.fog({ yCenter: 724, height: 70, alpha: 0.16 * FG, drift: -4 });
  if (o.near !== false) {
    roomPlant(f, { key: o.key, cams: o.cams, x: 70, floor: 790, alpha: 1 });
    // L6: a heavy curtain edge at frame right
    f.layer('L6', (c, env) => {
      const r = overscan(LAYERS.L6, o.cams, 40);
      bake(f, c, `${o.key}/r06/L6/${env.mood.id}/${rk(r)}`, r, (cc) => {
        cc.fillStyle = env.fill('fg');
        const x0 = 1176;
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

/** chair scale so its seat meets the figure's thighs */
const CHAIR_S = (() => {
  const seat = seatHeight(person.spec, POSES.type) * PS;
  const a = chair.anchors({ x: 0, y: 0, s: 1, style: 'swivel', view: 'side' }).seat;
  const h = -a.y;
  return h > 1 ? Math.max(0.8, Math.min(1.8, seat / h)) : PS;
})();

// ---------------------------------------------------------------- the flood (ch12-s06)
interface FloodWin {
  x: number;
  y: number;
  /** order 0..1 (seeded) */
  k: number;
}
let FLOOD: FloodWin[] | null = null;
/** every window cell on the near rank's towers that shows through the glass, in a seeded lighting order */
function floodList(N: { towers: Tower[]; lit: { x: number; y: number }[] }): FloodWin[] {
  if (FLOOD) return FLOOD;
  const out: FloodWin[] = [];
  let i = 0;
  for (const T of N.towers) {
    if (T.x + T.w < 520 || T.x > 1220) continue;
    for (let y = T.top + 14; y < 600; y += 12) {
      for (let x = T.x + 6; x < T.x + T.w - 6; x += 9) {
        i++;
        if (hash1(i, 501) < 0.07) continue; // a few stay dark even in the flood
        // a gentle bias: the windows nearest the middle of the glass light first
        const mid = Math.abs(x - 860) / 400;
        out.push({ x, y, k: Math.min(0.999, 0.75 * hash1(i, 502) + 0.25 * mid) });
      }
    }
  }
  out.sort((a, b) => a.k - b.k);
  FLOOD = out;
  return out;
}
function floodWindows(c: C, env: PaintEnv, N: { towers: Tower[]; lit: { x: number; y: number }[] }, o: NonNullable<Room06Opts['flood']>) {
  const list = floodList(N);
  const n1 = o.n1 ?? 14;
  const d1 = o.d1 ?? 1.1;
  const d2 = o.d2 ?? 1.4;
  const dt = o.t - o.at;
  if (dt <= 0) return;
  // one by one (n1 over d1), then the flood (the rest over d2, accelerating)
  let n: number;
  if (dt < d1) n = Math.floor((dt / d1) * n1);
  else n = n1 + Math.floor((list.length - n1) * Math.pow(clamp01((dt - d1) / d2), 1.6));
  n = Math.min(list.length, n);
  const m = env.mood;
  c.fillStyle = withAlpha(m.halo, 0.2);
  for (let i = 0; i < n; i++) c.fillRect(list[i].x - 2, list[i].y - 2, 7, 8);
  c.fillStyle = mixLab(m.core, m.halo, 0.2);
  for (let i = 0; i < n; i++) {
    // the newest few flare a little as they come on
    const fresh = i > n - 4 && dt < d1 + 0.2;
    if (fresh) {
      c.fillStyle = m.core;
      c.fillRect(list[i].x - 0.5, list[i].y - 0.5, 4, 5);
      c.fillStyle = mixLab(m.core, m.halo, 0.2);
    } else c.fillRect(list[i].x, list[i].y, 3, 4);
  }
  // (round 1) 'one by one' must read: each of the first n1 windows FLARES as it comes on (a small bloom, 0.6 s)
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < Math.min(n, n1); i++) {
    const age = dt - ((i + 1) * d1) / n1;
    if (age < 0 || age > 0.6) continue;
    const a = 1 - age / 0.6;
    const W = list[i];
    const g = c.createRadialGradient(W.x + 1.5, W.y + 2, 0, W.x + 1.5, W.y + 2, 13);
    g.addColorStop(0, withAlpha(m.core, 0.75 * a));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(W.x - 12, W.y - 11, 27, 27);
    c.fillStyle = withAlpha(m.core, 0.9 * a);
    c.fillRect(W.x - 1, W.y - 1, 5, 6);
  }
  c.restore();
}
