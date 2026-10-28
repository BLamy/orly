/**
 * handwired-explained — ch08-s07 / ch08-s08: THE LAMPLIT DESK FROM CH03-S01's LIT PANE, now seen close in warm dawn.
 * Same furniture language as ch03-s01's room (an anglepoise at the left, a shelf of books, the logo-less laptop,
 * the author's two paper hands and the agent's paler single hand at one keyboard), but full frame and in true
 * multiplane depth:
 *
 *   L1  the dawn rooftops seen through the window (a far plane, hazed)
 *   L2  the back wall: a paned window (a HOLE: the dawn backlight shows through), a shelf of books, a framed print
 *   haze sheet (between the wall and the lamp: the window and the lamp separate) + the window's soft bloom
 *   L3  the anglepoise lamp and a stack of books at the desk's back edge (+ the lamp's practical, painted BEFORE L4)
 *   L4  the desk (its top seen from a little above keyboard height), the laptop with a foreshortened KEY DECK, the
 *       screen (faint illegible paper-strip lines that advance with the keystrokes) and its bloom, the hands
 *   L5  the desk's near edge (near-black, out of focus) at the bottom of frame
 *   L5  (ch08-s07 'film') the copper line strung across the top of frame between two posts, a few tags hanging from it,
 *       out of focus: the desk framed by the film's own device
 *
 *   import { deskBack, deskFront, deskNear, deskFrameLine, DESK, deskHandsPose } from '../sets/ch08-s07-desk';
 *   deskBack(f, { key, lamp });                                   // backlight → L1 → L2 → haze → L3 → lamp practical
 *   f.layer('L4', (c, env) => deskFront(c, env, { tq, hands: { rest, agentRim }, under: (c) => cards(c) }));
 *   deskNear(f);                                                  // L5 near desk edge
 *   f.layer('L5', (c, env) => deskFrameLine(c, env, { alpha }));
 *
 * THE HANDS (review r1 of ch08-s07): typing hands seen from behind and a little above, framed at the wrists. The
 * fingertips MEET the key deck (they never press on the screen), the fingers curl about 40° at the middle joint (an
 * arch: knuckle, joint, tip down on its key), and the spread is narrow (a typist's hand, not a raised palm). The
 * author's two hands type on twos (each dip a held drawing, seeded per hand: the hand drops a hair, one finger goes
 * down and its key catches the screen light); the agent's single hand, one paper sheet paler, ECHOES the author's right
 * hand one twos-step later (half a beat behind, readable). `rest` 0..1 carries all three hands off the keys to lie
 * FLAT on the desk beside the keyboard (heel down, fingers forward, foreshortened: wider than tall), at the same moment.
 * `agentRim` 0..1 ramps a 2.5-3 px cool rim along the agent hand's upper-left contour (the window's light); before
 * it, the agent hand carries only a 40 % paper-edge outline. Never on the author's hands. Neutral light throughout.
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toScreen } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hash1 } from '../../../film/core/frame';
import { copperOf, narratorHands as hands, type Pt } from './narratorHands';
import { drawLine } from './tagLine';

type C2 = CanvasRenderingContext2D;

/** the desk geometry (L4 rest px): the laptop's front edge centre and width */
export const DESK = { x: 640, y: 520, w: 470 } as const;
/** the key deck (L4 rest px): back edge at the screen's base, front edge nearer the camera */
export const DECK = { yb: DESK.y - DESK.w * 0.045, yf: DESK.y + 22, hb: DESK.w * 0.47, hf: DESK.w * 0.54 } as const;
/** the window hole in the back wall (L2 rest px) */
export const WIN = { x0: 838, x1: 1172, y0: 64, y1: 404 } as const;
/** the lamp's bulb (L3 rest px) */
export const LAMP_BULB = { x: 268, y: 360 } as const;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpP = (a: Pt, b: Pt, u: number): Pt => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
function lw(c: C2, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}

// ---------------------------------------------------------------- back planes
export interface DeskBackOpts {
  key: string;
  /** the lamp's intensity (0..1), default .55 (the dawn window is the brighter practical) */
  lamp?: number;
  /** backlight sun x (the dawn sits behind the window) */
  sunX?: number;
}
export function deskBack(f: Frame, o: DeskBackOpts) {
  f.backlight({ sunX: o.sunX ?? 1010, sunY: 300, intensity: 1 });
  f.layer('L1', (c, env) => {
    f.cached(`ch08desk/L1/${env.mood.id}`, 1400, 400, (cc) => {
      cc.translate(-60, -200);
      rooftops(cc, env);
    })(c, 60, 200);
  });
  f.layer('L2', (c, env) => {
    f.cached(`ch08desk/L2/${env.mood.id}`, 1900, 1100, (cc) => {
      cc.translate(320, 200);
      backWall(cc, env);
    })(c, -320, -200);
  });
  // the window's soft bloom on the wall around it (screen space, additive): the dawn is the brightest practical
  // after the screen
  windowBloom(f);
  // the haze sheet between the back wall and the lamp (a tall, soft one at the window's height)
  f.fog({ yCenter: 300, height: 420, alpha: 0.2, drift: 4 });
  f.fog({ yCenter: 440, height: 240, alpha: 0.12, drift: 6 });
  f.layer('L3', (c, env) => {
    f.cached(`ch08desk/L3/${env.mood.id}`, 1700, 500, (cc) => {
      cc.translate(200, -160);
      deskBackEdge(cc, env);
    })(c, -200, 160);
  });
  // the lamp sits behind the action plane: its light before L4, so the hands occlude it
  f.practical({ x: LAMP_BULB.x, y: LAMP_BULB.y, kind: 'lamp', seed: 81, intensity: o.lamp ?? 0.55, radius: 120, layer: 'L3' });
}

function windowBloom(f: Frame) {
  const c = f.c;
  const a = toScreen(LAYERS.L2, f.cam, WIN.x0, WIN.y0);
  const b = toScreen(LAYERS.L2, f.cam, WIN.x1, WIN.y1);
  const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
  const r = Math.max(b.x - a.x, b.y - a.y) * 0.95;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
  g.addColorStop(0, withAlpha(f.mood.halo, 0.16));
  g.addColorStop(0.5, withAlpha(f.mood.halo, 0.06));
  g.addColorStop(1, withAlpha(f.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  c.restore();
}

/** L1: a low run of dawn rooftops and chimney pots (only seen through the window) */
function rooftops(c: C2, env: PaintEnv) {
  c.fillStyle = env.fill('set');
  c.beginPath();
  c.moveTo(60, 600);
  let x = 60;
  let i = 0;
  while (x < 1460) {
    const w = 70 + 90 * (0.5 + 0.5 * hash1(i, 3));
    const h = 330 + 60 * (0.5 + 0.5 * hash1(i, 5));
    c.lineTo(x, h);
    if (hash1(i, 7) > 0.55) {
      c.lineTo(x + w * 0.5, h - 34);
      c.lineTo(x + w, h);
    } else {
      c.lineTo(x + w * 0.15, h);
      c.lineTo(x + w * 0.15, h - 6);
      c.lineTo(x + w, h - 6);
    }
    x += w;
    i++;
  }
  c.lineTo(1460, 600);
  c.closePath();
  c.fill();
  x = 60;
  i = 0;
  while (x < 1460) {
    const w = 70 + 90 * (0.5 + 0.5 * hash1(i, 3));
    const h = 330 + 60 * (0.5 + 0.5 * hash1(i, 5));
    if (hash1(i, 7) <= 0.55 && hash1(i, 13) > 0) c.fillRect(x + w * 0.6, h - 30, 10, 26);
    x += w;
    i++;
  }
  for (let k = 0; k < 9; k++) {
    c.fillStyle = withAlpha(env.mood.core, 0.35 + 0.2 * (0.5 + 0.5 * hash1(k, 17)));
    c.fillRect(100 + k * 150 + 40 * hash1(k, 19), 380 + 30 * hash1(k, 21), 5, 6);
  }
}

/** L2: the back wall with the window hole (evenodd), mullions, sill; a shelf of books at the left; a framed print */
function backWall(c: C2, env: PaintEnv) {
  // one step darker than before, so the window and the screen carry the light (review r1: depth and light)
  const wall = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.22);
  c.fillStyle = wall;
  c.beginPath();
  c.rect(-320, -200, 1900, 1100);
  c.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
  c.fill('evenodd');
  const g = c.createRadialGradient((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, 120, (WIN.x0 + WIN.x1) / 2, 260, 760);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.2));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.save();
  c.beginPath();
  c.rect(-320, -200, 1900, 1100);
  c.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
  c.clip('evenodd');
  c.fillStyle = g;
  c.fillRect(-320, -200, 1900, 1100);
  c.restore();
  const ink = mixLab(wall, env.mood.ink, 0.55);
  c.fillStyle = ink;
  const mx = (WIN.x0 + WIN.x1) / 2;
  c.fillRect(mx - 4, WIN.y0, 8, WIN.y1 - WIN.y0);
  for (const fy of [0.34, 0.67]) c.fillRect(WIN.x0, WIN.y0 + (WIN.y1 - WIN.y0) * fy - 3, WIN.x1 - WIN.x0, 6);
  c.fillRect(WIN.x0 - 14, WIN.y1, WIN.x1 - WIN.x0 + 28, 12);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(WIN.x0 - 14, WIN.y1 + 0.5);
  c.lineTo(WIN.x1 + 14, WIN.y1 + 0.5);
  c.stroke();
  const sx0 = 70, sx1 = 520, sy = 214;
  c.fillStyle = ink;
  c.fillRect(sx0, sy, sx1 - sx0, 7);
  let x = sx0 + 10;
  let i = 0;
  while (x < sx1 - 20) {
    const w = 9 + 9 * (0.5 + 0.5 * hash1(i, 31));
    const h = 44 + 30 * (0.5 + 0.5 * hash1(i, 33));
    if (hash1(i, 35) > 0.85) {
      c.save();
      c.translate(x, sy);
      c.rotate(0.28);
      c.fillRect(0, -h, w, h);
      c.restore();
      x += w + 16;
    } else {
      c.fillRect(x, sy - h, w, h);
      x += w + 1.5;
    }
    i++;
  }
  c.fillRect(sx0 + 30, sy + 6, 6, 26);
  c.fillRect(sx1 - 40, sy + 6, 6, 26);
  c.fillRect(560, 120, 120, 150);
  c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.set, 0.3), 0.45);
  c.fillRect(570, 130, 100, 130);
  c.fillStyle = withAlpha(env.mood.core, 0.1);
  c.beginPath();
  c.moveTo(570, 130);
  c.lineTo(640, 130);
  c.lineTo(570, 220);
  c.closePath();
  c.fill();
}

/** L3: the anglepoise lamp (base on the desk's back edge) and a stack of books at the right */
function deskBackEdge(c: C2, env: PaintEnv) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.beginPath();
  c.ellipse(220, 506, 46, 10, 0, Math.PI, 0);
  c.fill();
  c.lineCap = 'round';
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(220, 500);
  c.lineTo(190, 400);
  c.lineTo(250, 318);
  c.stroke();
  c.save();
  c.translate(252, 318);
  c.rotate(0.7);
  c.beginPath();
  c.moveTo(-14, -10);
  c.lineTo(20, -12);
  c.lineTo(46, 36);
  c.lineTo(-34, 36);
  c.closePath();
  c.fill();
  c.restore();
  c.strokeStyle = withAlpha(env.mood.rim, 0.35);
  c.lineWidth = 1.2;
  c.beginPath();
  for (let k = 0; k <= 10; k++) {
    const u = k / 10;
    const x = lerp(214, 196, u) + (k % 2 ? 5 : -5);
    const y = lerp(486, 420, u);
    if (k === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.fillStyle = ink;
  const stack: [number, number, number][] = [[1040, 168, 22], [1052, 150, 18], [1036, 176, 20], [1060, 136, 16]];
  let y = 508;
  for (const [x, w, h] of stack) {
    y -= h;
    c.fillRect(x, y, w, h - 1.5);
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(1060, y + 0.5);
  c.lineTo(1196, y + 0.5);
  c.stroke();
  c.fillStyle = ink;
  c.fillRect(1230, 470, 34, 38);
  c.beginPath();
  c.arc(1268, 488, 9, -Math.PI / 2, Math.PI / 2);
  c.lineWidth = 5;
  c.strokeStyle = ink;
  c.stroke();
}

// ---------------------------------------------------------------- the action plane
export interface DeskHandsState {
  /** 0..1: all three hands carried off the keys to lie flat beside the keyboard */
  rest?: number;
  /** 0..1: the cool rim on the agent hand's upper-left contour */
  agentRim?: number;
  /** typing: author on (default true); agent on (default true) */
  typing?: boolean;
  /** override where each hand lies at rest (the centre of its fingertips, L4 rest px) */
  restAt?: { L?: Pt; R?: Pt; A?: Pt };
}
export interface DeskFrontOpts {
  tq: number;
  hands: DeskHandsState;
  /** the screen's brightness (0..1), default .85 */
  screen?: number;
  /** the screen's paper-strip lines: typing runs from..to (shot seconds); omit for a blank page */
  page?: { from: number; to: number };
  /** drawn on the desk under the hands (cards, a label strip) */
  under?: (c: C2, env: PaintEnv) => void;
  /** drawn over the hands (a stamp) */
  over?: (c: C2, env: PaintEnv) => void;
}

/** one typing hand: where its fingertips are, how it leans, which finger is down, how flat it lies */
export interface HandState {
  tip: Pt;
  lean: number;
  /** the finger that is down (0 index .. 3 little), or -1 */
  press: number;
  /** 1 while the hand is down on a keystroke (a held drawing) */
  dip: number;
  /** 0 typing (curled) → 1 lying flat on the desk */
  flat: number;
  /** +1: thumb toward +x (the LEFT hand); -1: the right hand */
  thumb: 1 | -1;
}

const K = DESK.w / 300;
/** home-row y (where the fingertips land) and the spacebar row */
const HOME_Y = lerp(DECK.yb, DECK.yf, 0.42);
const TYPE_X = { L: DESK.x - DESK.w * 0.2, R: DESK.x + DESK.w * 0.04, A: DESK.x + DESK.w * 0.27 };
const REST = { L: { x: DESK.x - DESK.w * 0.62, y: 598 }, R: { x: DESK.x + DESK.w * 0.56, y: 598 }, A: { x: DESK.x + DESK.w * 0.86, y: 604 } };

const dipAt = (step: number, salt: number) => {
  const h = Math.sin(step * 12.9898 + salt * 78.233) * 43758.5453;
  return h - Math.floor(h) > 0.45 ? 1 : 0;
};
const fingerAt = (step: number, salt: number) => Math.floor((hash1(step, salt * 7 + 3) + 1) * 2) % 4;

/** the hand poses at shot time tq (exported so a shot can anchor cards to them) */
export function deskHandsPose(tq: number, st: DeskHandsState) {
  const step = Math.floor(tq * 6);
  const r = sm(st.rest ?? 0);
  const typing = (st.typing ?? true) && r < 0.02;
  const dL = typing ? dipAt(step, 1) : 0;
  const dR = typing ? dipAt(step, 2) : 0;
  // the agent echoes the author's right hand one twos-step later (half a beat behind)
  const dA = typing ? dipAt(step - 1, 2) : 0;
  const lift = Math.sin(Math.PI * r) * DESK.w * 0.06;
  const restAt = { L: st.restAt?.L ?? REST.L, R: st.restAt?.R ?? REST.R, A: st.restAt?.A ?? REST.A };
  const mk = (x: number, rest: Pt, d: number, finger: number, leanT: number, leanR: number, thumb: 1 | -1, liftK = 1): HandState => {
    const tip = lerpP({ x, y: HOME_Y }, rest, r);
    tip.y -= lift * liftK;
    return { tip, lean: lerp(leanT, leanR, r), press: d ? finger : -1, dip: d, flat: r, thumb };
  };
  const L = mk(TYPE_X.L, restAt.L, dL, fingerAt(step, 1), 0.42, 0.75, 1);
  const R = mk(TYPE_X.R, restAt.R, dR, fingerAt(step, 2), -0.16, -0.62, -1);
  const A = mk(TYPE_X.A, restAt.A, dA, fingerAt(step - 1, 2), -0.46, -0.7, -1, 0.9);
  return { L, R, A, k: K };
}

/** how many keystrokes all three hands have made by tq (for the screen's lines) */
function keystrokes(tq: number, from: number, to: number) {
  const s0 = Math.floor(from * 6), s1 = Math.floor(Math.min(tq, to) * 6);
  let n = 0;
  for (let s = s0; s <= s1; s++) n += dipAt(s, 1) + dipAt(s, 2) + dipAt(s - 1, 2);
  return Math.max(0, n);
}

export function deskFront(c: C2, env: PaintEnv, o: DeskFrontOpts) {
  const { x, y, w } = DESK;
  const screen = o.screen ?? 0.85;
  // the desk: its top seen from a little above (a warm sheen near the far edge, falling to near-black toward us)
  const top = c.createLinearGradient(0, y - 2, 0, 760);
  top.addColorStop(0, mixLab(env.mood.ink, env.mood.halo, 0.2));
  top.addColorStop(0.07, mixLab(env.mood.ink, env.mood.halo, 0.07));
  top.addColorStop(0.5, mixLab(env.mood.ink, PUPPET_NEAR_BLACK, 0.45));
  top.addColorStop(1, PUPPET_NEAR_BLACK);
  c.fillStyle = top;
  c.fillRect(-500, y - 2, 2300, 900);
  // the lamp's pool on the desk, left of the laptop (additive, low)
  c.save();
  c.globalCompositeOperation = 'lighter';
  const pool = c.createRadialGradient(330, y + 8, 4, 330, y + 8, 240);
  pool.addColorStop(0, withAlpha(env.mood.halo, 0.16));
  pool.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = pool;
  c.save();
  c.translate(0, y + 8);
  c.scale(1, 0.32);
  c.translate(0, -(y + 8));
  c.fillRect(40, y - 300, 600, 600);
  c.restore();
  c.restore();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.45), 0.5);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-500, y - 1.5);
  c.lineTo(1800, y - 1.5);
  c.stroke();
  // the laptop's lid and screen (the kit's), then this set's own key deck over its edge-on base
  const scr = hands.deskScreen({ x, y, w, tq: o.tq });
  // the screen's soft bloom (behind the lid: a halo for the hands to stand against)
  c.save();
  c.globalCompositeOperation = 'lighter';
  const bl = c.createRadialGradient(scr.cx, scr.cy + scr.h * 0.1, scr.h * 0.35, scr.cx, scr.cy + scr.h * 0.1, scr.w * 0.85);
  bl.addColorStop(0, withAlpha(env.mood.core, 0.18 * screen));
  bl.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = bl;
  c.fillRect(scr.cx - scr.w, scr.cy - scr.w, scr.w * 2, scr.w * 2);
  c.restore();
  hands.deskHands(c, { x, y, w, tq: o.tq, author: 'off', agent: 'off', screen }, env);
  if (o.page) page(c, env, scr, o.tq, o.page, screen);
  const P = deskHandsPose(o.tq, o.hands);
  deck(c, env, screen, [P.L, P.R, P.A]);
  // the screen's soft wash on the desk and on the hands' backs (both alike: neutral light)
  c.save();
  c.globalCompositeOperation = 'lighter';
  const wash = c.createRadialGradient(scr.cx, scr.y + scr.h, 10, scr.cx, scr.y + scr.h, w * 0.75);
  wash.addColorStop(0, withAlpha(env.mood.halo, 0.16 * screen));
  wash.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = wash;
  c.fillRect(scr.cx - w, scr.y, 2 * w, w);
  c.restore();
  o.under?.(c, env);
  // the hands: the author's two (near-black), the agent's (one paper sheet paler)
  drawTypingHand(c, env, P.L, PUPPET_NEAR_BLACK, 'author');
  drawTypingHand(c, env, P.R, PUPPET_NEAR_BLACK, 'author');
  agentHand(c, env, P.A, clamp01(o.hands.agentRim ?? 0));
  o.over?.(c, env);
}

/** the screen's page: faint, illegible paper-strip lines (no words, no logos) that advance with the keystrokes */
function page(c: C2, env: PaintEnv, scr: { x: number; y: number; w: number; h: number }, tq: number, pg: { from: number; to: number }, screen: number) {
  const n = keystrokes(tq, pg.from, pg.to) * 2 + 46; // the page already has a few lines on it
  const mx = scr.x + 34, mw = scr.w - 68;
  const glyph = 5.2;
  const perRow = Math.floor(mw / glyph);
  const rowH = 15;
  const top = scr.y + 30;
  const rowsVis = Math.floor((scr.h - 54) / rowH);
  // lay out words (seeded lengths) into rows
  const rows: { x: number; w: number }[][] = [];
  let row: { x: number; w: number }[] = [];
  let col = 0;
  let used = 0;
  let wi = 0;
  let indent = 0;
  while (used < n) {
    const len = 2 + Math.floor((hash1(wi, 41) + 1) * 3.5);
    const take = Math.min(len, n - used);
    if (col + len > perRow - indent) {
      rows.push(row);
      row = [];
      col = 0;
      // every few rows a short paragraph break with an indent
      indent = hash1(rows.length, 43) > 0.55 ? 3 : 0;
      if (hash1(rows.length, 47) > 0.7) rows.push([]);
    }
    row.push({ x: (col + indent) * glyph, w: take * glyph - 1.4 });
    col += len + 1;
    used += take;
    wi++;
  }
  rows.push(row);
  const first = Math.max(0, rows.length - rowsVis);
  c.save();
  c.beginPath();
  c.rect(scr.x, scr.y, scr.w, scr.h);
  c.clip();
  c.fillStyle = withAlpha(mixLab('#2a1d14', env.mood.ink, 0.3), 0.24 * (0.4 + 0.6 * screen));
  for (let r = first; r < rows.length; r++) {
    const yy = top + (r - first) * rowH;
    for (const seg of rows[r]) c.fillRect(mx + seg.x, yy, seg.w, 3.2);
  }
  // the caret after the last word (steady: it does not blink on its own clock)
  const last = rows[rows.length - 1];
  const cx = mx + (last.length ? last[last.length - 1].x + last[last.length - 1].w + 3 : 0);
  c.fillStyle = withAlpha(mixLab('#2a1d14', env.mood.ink, 0.3), 0.4);
  c.fillRect(cx, top + (rows.length - 1 - first) * rowH - 3, 2, 9);
  c.restore();
}

/** the laptop's key deck, foreshortened (a trapezoid from the screen's base to its near edge), with key rows;
 *  a key under a finger that is down catches the screen's light */
function deck(c: C2, env: PaintEnv, screen: number, hs: HandState[]) {
  const { x } = DESK;
  const { yb, yf, hb, hf } = DECK;
  const ink = PUPPET_NEAR_BLACK;
  c.save();
  c.fillStyle = mixLab(ink, env.mood.set, 0.16);
  c.beginPath();
  c.moveTo(x - hb, yb);
  c.lineTo(x + hb, yb);
  c.lineTo(x + hf, yf);
  c.lineTo(x - hf, yf);
  c.closePath();
  c.fill();
  // the screen's light falling on the deck, strongest at the back
  const g = c.createLinearGradient(0, yb, 0, yf);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.2 * screen));
  g.addColorStop(1, withAlpha(env.mood.halo, 0.03));
  c.fillStyle = g;
  c.fill();
  // the hinge line and the lid's lower edge
  c.fillStyle = ink;
  c.fillRect(x - hb, yb - 1, hb * 2, 3);
  // key rows (five), each key a small foreshortened cap catching the light on its top edge
  const rowsN = 5;
  const cap = mixLab(mixLab(ink, env.mood.set, 0.3), env.mood.halo, 0.12 * screen);
  for (let r = 0; r < rowsN; r++) {
    const v0 = 0.12 + r * 0.16, v1 = v0 + 0.115;
    const y0 = lerp(yb, yf, v0), y1 = lerp(yb, yf, v1);
    const half0 = lerp(hb, hf, v0) * 0.9, half1 = lerp(hb, hf, v1) * 0.9;
    if (r === rowsN - 1) {
      // the spacebar row: a long bar in the middle, short keys either side
      key(c, x - half0 * 0.36, x + half0 * 0.36, y0, y1, cap);
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
        const a = 0.42 + k * 0.19;
        key(c, x + s * half0 * a, x + s * half0 * (a + 0.15), y0, y1, cap);
      }
      continue;
    }
    const n = 13 - (r === 0 ? 0 : 1);
    for (let k = 0; k < n; k++) {
      const a = -1 + (2 * k) / n, b = a + (2 / n) * 0.84;
      key(c, x + a * half0, x + b * half0, y0, y1, cap, x + a * half1, x + b * half1);
    }
  }
  // the keys that are down catch the screen's light (one per dipping hand)
  c.globalCompositeOperation = 'lighter';
  for (const h of hs) {
    if (h.press < 0 || h.flat > 0.02) continue;
    const ft = fingerTips(h)[h.press];
    const kg = c.createRadialGradient(ft.x, ft.y + 1, 0, ft.x, ft.y + 1, 9 * K);
    kg.addColorStop(0, withAlpha(env.mood.core, 0.42 * screen));
    kg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = kg;
    c.fillRect(ft.x - 10 * K, ft.y - 9 * K, 20 * K, 20 * K);
  }
  c.globalCompositeOperation = 'source-over';
  // the deck's near lip catching the lamp
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(x - hf, yf - 0.5);
  c.lineTo(x + hf, yf - 0.5);
  c.stroke();
  c.fillStyle = ink;
  c.fillRect(x - hf, yf, hf * 2, 4);
  c.restore();
}
function key(c: C2, x0: number, x1: number, y0: number, y1: number, col: string, bx0 = x0, bx1 = x1) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y0);
  c.lineTo(bx1, y1);
  c.lineTo(bx0, y1);
  c.closePath();
  c.fill();
}

// ---------------------------------------------------------------- the typing hand (seen from behind, a little above)
// hand-local px at K = 1: origin = the centre of the fingertips, +y toward the camera (down the screen); the whole
// hand is rotated by `lean` about the fingertips (so the tips stay planted while the forearm swings)
type HandGeo = { tips: Pt[]; joints: Pt[]; knuckles: Pt[]; back: Pt[]; thumb: [Pt, Pt, Pt]; wrist: [Pt, Pt]; elbow: [Pt, Pt] };
const FW = [9.6, 10.2, 9.8, 8.6];
function geo(h: HandState): HandGeo {
  const s = h.thumb;
  const f = sm(h.flat);
  // typing (seen from behind and a little above): the back of the hand is the big shape, sloping away from the
  // camera up to the knuckle ridge; the fingers run on AWAY from us and curl DOWN onto the keys, so they show only as
  // short, foreshortened arches above the knuckles (joint highest, tip a hair lower, landing on its key). Flat: the
  // fingers lie straight forward on the desk, the whole hand foreshortened (wider than tall), heel down.
  const tipT = [{ x: 14, y: 0 }, { x: 5, y: -1.5 }, { x: -5, y: -0.5 }, { x: -14, y: 2.5 }];
  const tipF = [{ x: 16, y: -3 }, { x: 5.4, y: -4.2 }, { x: -5.4, y: -3.6 }, { x: -16, y: -1.2 }];
  const knT = [{ x: 15.5, y: 12 }, { x: 5.4, y: 10.5 }, { x: -5.4, y: 11 }, { x: -15, y: 13.5 }];
  const knF = [{ x: 17, y: 5 }, { x: 6, y: 4 }, { x: -6, y: 4.4 }, { x: -17, y: 6 }];
  const tips: Pt[] = [], joints: Pt[] = [], knuckles: Pt[] = [];
  for (let i = 0; i < 4; i++) {
    const down = h.press === i ? 2.4 : 0;
    const t = { x: s * lerp(tipT[i].x, tipF[i].x, f), y: lerp(tipT[i].y + down, tipF[i].y, f) };
    const k = { x: s * lerp(knT[i].x, knF[i].x, f), y: lerp(knT[i].y + down * 0.3, knF[i].y, f) };
    // the middle joint: the top of the arch while typing (about 40° of curl down to the tip); straight when flat
    const mid = { x: lerp(k.x, t.x, 0.55), y: lerp(k.y, t.y, 0.55) };
    const arch = (1 - f) * (5.2 - (h.press === i ? 1.2 : 0));
    joints.push({ x: mid.x, y: mid.y - arch });
    tips.push(t);
    knuckles.push(k);
  }
  const wy = lerp(50, 19, f);
  const back: Pt[] = [
    { x: s * 22, y: lerp(15, 7, f) },
    { x: s * 11, y: lerp(9.5, 3.5, f) },
    { x: 0, y: lerp(8.5, 3, f) },
    { x: -s * 11, y: lerp(10, 4, f) },
    { x: -s * 21.5, y: lerp(16.5, 8, f) },
    { x: -s * 20, y: lerp(34, 15, f) },
    { x: -s * 16, y: wy },
    { x: s * 16, y: wy },
    { x: s * 23, y: lerp(32, 14, f) },
  ];
  // the thumb runs inward along the spacebar (nearly level), its tip just in front of the home row
  const thumb: [Pt, Pt, Pt] = [
    { x: s * 17, y: lerp(34, 14, f) },
    { x: s * lerp(25, 25, f), y: lerp(27, 10, f) },
    { x: s * lerp(26, 29, f), y: lerp(19, 6.5, f) },
  ];
  const wrist: [Pt, Pt] = [{ x: -s * 16, y: wy }, { x: s * 16, y: wy }];
  const elbow: [Pt, Pt] = [{ x: -s * 24, y: wy + 300 }, { x: s * 24, y: wy + 300 }];
  return { tips, joints, knuckles, back, thumb, wrist, elbow };
}
function toWorld(h: HandState, p: Pt): Pt {
  const dip = h.dip ? 1.4 : 0;
  const c = Math.cos(h.lean), s = Math.sin(h.lean);
  const x = p.x * K, y = (p.y + dip * (p.y > 0 ? 1 : 0.4)) * K;
  return { x: h.tip.x + x * c - y * s, y: h.tip.y + x * s + y * c };
}
/** world positions of the four fingertips (for a key's light, a card's corner) */
export function fingerTips(h: HandState): Pt[] {
  return geo(h).tips.map((p) => toWorld(h, p));
}
function capsuleTo(p: Path2D, a: Pt, b: Pt, w0: number, w1: number) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const ang = Math.atan2(dy, dx);
  p.moveTo(a.x + (nx * w0) / 2, a.y + (ny * w0) / 2);
  p.lineTo(b.x + (nx * w1) / 2, b.y + (ny * w1) / 2);
  p.arc(b.x, b.y, w1 / 2, ang + Math.PI / 2, ang - Math.PI / 2, true);
  p.lineTo(a.x - (nx * w0) / 2, a.y - (ny * w0) / 2);
  p.arc(a.x, a.y, w0 / 2, ang - Math.PI / 2, ang + Math.PI / 2, true);
  p.closePath();
}
/** the hand's parts as separate Path2Ds (filled one by one, so overlaps never cancel) */
function handPaths(h: HandState): Path2D[] {
  const g = geo(h);
  const W = (p: Pt) => toWorld(h, p);
  const out: Path2D[] = [];
  // forearm (wrist to off frame)
  const fa = new Path2D();
  const w0 = W(g.wrist[0]), w1 = W(g.wrist[1]), e1 = W(g.elbow[1]), e0 = W(g.elbow[0]);
  fa.moveTo(w0.x, w0.y);
  fa.lineTo(w1.x, w1.y);
  fa.lineTo(e1.x, e1.y);
  fa.lineTo(e0.x, e0.y);
  fa.closePath();
  out.push(fa);
  // the back of the hand: a soft blob through the knuckle bumps and the wrist
  const bk = new Path2D();
  const pts = g.back.map(W);
  const n = pts.length;
  const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const m0 = mid(pts[n - 1], pts[0]);
  bk.moveTo(m0.x, m0.y);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    bk.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y);
  }
  bk.closePath();
  out.push(bk);
  // fingers: knuckle → joint → tip, two capsules each
  for (let i = 0; i < 4; i++) {
    const p = new Path2D();
    capsuleTo(p, W(g.knuckles[i]), W(g.joints[i]), FW[i] * K, FW[i] * 0.93 * K);
    out.push(p);
    const q = new Path2D();
    capsuleTo(q, W(g.joints[i]), W(g.tips[i]), FW[i] * 0.93 * K, FW[i] * 0.8 * K);
    out.push(q);
  }
  const th = new Path2D();
  capsuleTo(th, W(g.thumb[0]), W(g.thumb[1]), 10.5 * K, 9.5 * K);
  out.push(th);
  const th2 = new Path2D();
  capsuleTo(th2, W(g.thumb[1]), W(g.thumb[2]), 9.5 * K, 8.2 * K);
  out.push(th2);
  return out;
}
function fillHand(c: C2, h: HandState, col: string) {
  c.fillStyle = col;
  for (const p of handPaths(h)) c.fill(p);
}
/** draw the hand's silhouette offset (device px) in a colour, the hand itself NOT drawn: an edge light where it
 *  sticks out past the hand drawn over it afterwards */
function edgeLight(c: C2, h: HandState, col: string, dx: number, dy: number, blur = 0.6) {
  const m = c.getTransform();
  const sx = Math.hypot(m.a, m.b) || 1;
  const OFF = 8000;
  c.save();
  c.shadowColor = col;
  c.shadowBlur = blur;
  c.shadowOffsetX = OFF + dx;
  c.shadowOffsetY = dy;
  c.translate(-OFF / sx, 0);
  fillHand(c, h, '#000000');
  c.restore();
}
/** one hand: author ink; a faint warm line along the knuckles where the screen's light grazes them */
function drawTypingHand(c: C2, env: PaintEnv, h: HandState, ink: string, _who: 'author') {
  const warm = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.55), 0.55 * (1 - h.flat * 0.5));
  edgeLight(c, h, warm, 0, -1.6, 0.8);
  fillHand(c, h, ink);
}

/**
 * The agent's hand, one paper sheet paler: a 40 % paper-edge outline always (all round, 1 px), and on its beat a
 * 2.5-3 px COOL rim along the upper-left contour (the window's light), rim 0..1.
 */
function agentHand(c: C2, env: PaintEnv, h: HandState, rim: number) {
  const pale = mixLab(PUPPET_NEAR_BLACK, mixLab(env.mood.set, '#7a6a58', 0.4), 0.3);
  const edge = withAlpha(mixLab('#d8ccb8', env.mood.halo, 0.25), 0.4);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) edgeLight(c, h, edge, dx, dy, 0.4);
  if (rim > 0.01) {
    const cool = withAlpha(mixLab('#cfe2f2', env.mood.rim, 0.25), 0.8 * rim);
    edgeLight(c, h, cool, -2, -2, 0.7);
    edgeLight(c, h, withAlpha(mixLab('#cfe2f2', env.mood.rim, 0.25), 0.45 * rim), -2.8, -1, 0.9);
  }
  fillHand(c, h, pale);
}

// ---------------------------------------------------------------- L5: the desk's near edge
/** the desk's near edge (L5, near-black, out of focus): a band across the bottom of frame */
export function deskNear(f: Frame, o: { y?: number } = {}) {
  const y = o.y ?? 708;
  f.layer('L5', (c) => {
    f.cached(`ch08desk/L5near`, 2400, 400, (cc) => {
      cc.translate(600, -y);
      cc.fillStyle = PUPPET_NEAR_BLACK;
      cc.beginPath();
      cc.moveTo(-600, y + 14);
      cc.quadraticCurveTo(640, y - 6, 1800, y + 10);
      cc.lineTo(1800, y + 400);
      cc.lineTo(-600, y + 400);
      cc.closePath();
      cc.fill();
    })(c, -600, y);
  });
}

// ---------------------------------------------------------------- the near frame: the copper line and its tags
export interface FrameLineOpts {
  /** 0..1 presence */
  alpha?: number;
  /** the tags' swing phase time (twos) */
  tq: number;
}
/** L5 rest geometry of the framing line */
export const FRAME_LINE = { x0: 64, x1: 1216, y: 74 } as const;
const FRAME_TAGS: { x: number; struck?: boolean; strokes?: boolean }[] = [
  { x: 212, struck: true },
  { x: 342 },
  { x: 470, struck: true },
  { x: 846, strokes: true },
  { x: 990 },
  { x: 1104, struck: true },
];
/** the copper line strung across the top of frame between two posts, with a few manila tags hanging from it (draw in
 *  L5: out of focus; no readable words, just the device: fronts with ink lines, red strikes on struck ones) */
export function deskFrameLine(c: C2, env: PaintEnv, o: FrameLineOpts) {
  const a = clamp01(o.alpha ?? 1);
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha = a;
  drawLine(c, env, { x0: FRAME_LINE.x0, x1: FRAME_LINE.x1, y: FRAME_LINE.y, sag: 8, glow: 0.7, posts: 'post' });
  const manila = mixLab(mixLab('#cfb07a', env.mood.halo, 0.32), env.mood.core, 0.1);
  for (let i = 0; i < FRAME_TAGS.length; i++) {
    const tg = FRAME_TAGS[i];
    const u = (tg.x - FRAME_LINE.x0) / (FRAME_LINE.x1 - FRAME_LINE.x0);
    const ky = FRAME_LINE.y + 8 * 4 * u * (1 - u);
    const sw = 0.03 * Math.sin(o.tq * 1.7 + i * 1.3);
    c.save();
    c.translate(tg.x, ky);
    c.rotate(sw);
    c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.85);
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-3, 0);
    c.lineTo(0, 22);
    c.lineTo(3, 0);
    c.stroke();
    const tw = 54, th = 78;
    c.fillStyle = manila;
    c.beginPath();
    c.moveTo(-tw / 2 + 10, 22);
    c.lineTo(tw / 2 - 10, 22);
    c.lineTo(tw / 2, 32);
    c.lineTo(tw / 2, 22 + th);
    c.lineTo(-tw / 2, 22 + th);
    c.lineTo(-tw / 2, 32);
    c.closePath();
    c.fill();
    c.fillStyle = mixLab(manila, '#5a3a1a', 0.5);
    c.beginPath();
    c.arc(0, 30, 3.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha('#2a1d14', 0.4);
    for (let l = 0; l < 3; l++) c.fillRect(-tw / 2 + 9, 48 + l * 11, tw - 18 - (l % 2) * 10, 2.2);
    if (tg.struck) {
      c.strokeStyle = withAlpha('#a4402e', 0.85);
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-tw / 2 + 4, 22 + th * 0.82);
      c.lineTo(tw / 2 - 4, 22 + th * 0.3);
      c.stroke();
    }
    c.restore();
  }
  c.restore();
  void copperOf;
}
