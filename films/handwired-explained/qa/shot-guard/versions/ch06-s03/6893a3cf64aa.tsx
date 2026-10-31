/**
 * ch06-s03 — SPRINGS WITHOUT LOOPS (plate, candleAmber; cut in; 26.50 s; one continuous shot, no cuts).
 *   L0607 "The windows move on springs, and springs need time."
 *   L0608 "One step multiplies two numbers, the window's distance from home and its speed: at rest, it comes out moving."
 *   L0609 "Three hundred steps is that multiplication, squared and squared again. JavaScript works it out ahead, as four
 *          numbers; the program applies them in fourteen operations, for any count."
 *
 * A wide parchment plate on the dark bench, lit by two hanging lamps (one over the rail and stamp, one over the ledger;
 * the plate darkens between their pools) with a low haze band at the near edge. The camera starts close on the window,
 * coil and stamp (the press is out of frame), then makes one long truck right after 'moving', through the press as it
 * folds, and settles on the host's ledger before the copy; the stamp has left frame by the end (no cropped numbers). The equation is pinned to the plate's top margin on a
 * slip that rides along with the camera, so it stays in frame.
 *
 * Numbers (SP02, SP03 with HandwiredOS's 650/45 matrix): one 4 ms step matrix [0.9896 0.00328 / −2.6 0.82];
 * (−300, 0) → (0.9896·−300, −2.6·−300) = (−296.88, 780); the window at 400 px, home at 700, is drawn at 403.12 px.
 *
 * TEACHES, word by word:
 *   (0-4)            the paper window on its rail at 400, its copper home pin at 700, the spring coil between; a small
 *                    4 ms escapement ticks evenly at the plate's corner (the host's clock)
 *   multiplies (4.90) the 2×2 BRASS STAMP drops in, its four numbers engraved on its face; the two input cards slide in
 *                    beside it, −300 and 0, and their names ink as they are said (distance from home · speed)
 *   at rest (9.4)    the cards slide under the stamp
 *   moving (10.77)   the stamp comes down with a clack; out come −296.88 and 780; under a brass loupe the window creeps
 *                    from 400 to 403.12 and its coil begins to move; the equation inks at the top margin
 *   squared (14.53)  the camera tracks right to the SQUARING PRESS: eight folds, each a heavier clack, each plate stamped
 *                    with its power (M², M⁴ … M²⁵⁶); then one plate marked M³⁰⁰
 *   JavaScript (16.77) the camera settles on the host's float64 LEDGER (beside a small clockwork: the host side); a
 *                    copper arc runs off M³⁰⁰ to it and it copies the four numbers onto four cards (each engraved with a
 *                    2×2 bracket, its own cell inked), which stay in its frames; copies slide into four pigeonholes
 *   fourteen (21.70) the OPERATION COUNTER reads 14, frozen, while its step dial spins 2 → 300; the label inks on a
 *                    pinned paper slip under the counter and dial
 *   stiff (24.19)    'stiffness 650' and 'damping 45' glow in the ledger; a dotted line from them stops short of the
 *                    loom (they never enter the network). Hold on the frozen counter, the dial still spinning.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { STRIP, cellX, pigeonStrip, toggleCard } from '../sets/ch03-s02-plate';
import { brassOf, cardPaper, clamp01, clockworkX, ease5, inkCol, lerp, lin, lw, paperSlip, plateSheet, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
import { copperOf } from '../sets/narratorHands';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s03';

// ------------------------------------------------------------------ layout (L4 rest px)
const PLATE = { x: -60, y: 36, w: 2240, h: 630 };
/** region A: the window on its rail (1 px of the page = 1 px here), its home pin, the coil; the loupe under it */
const RAIL = { y: 262, x400: 180, x700: 480 };
const WIN = { w: 70, h: 50 };
const LOUPE = { x: 226, y: 470, r: 74, mag: 14 };
const ESC = { x: 86, y: 196 };
/** the stamp and its cards */
const STAMP = { x: 760, y: 410, w: 252, h: 176 };
const IN_X = 588, OUT_X = 958;
const ROW = [372, 450];
/** region B: the squaring press; its folded plates in two rows of four, M³⁰⁰ under them; the counter by its crown */
const PRESS = { x: 1180, top: 250, bed: 520 };
const POW_ROW = { x: 1296, y: [422, 500], step: 100 };
const M300 = { x: 1440, y: 586 };
const COUNTER = { x: 1360, y: 196 };
/** region C: the host's ledger beside a small clockwork; the table; the loom stub */
const LEDGER = { x: 1690, y: 150, w: 232, h: 250 };
const HOST = { x: 2050, y: 372, r: 48 };
const TABLE_AT = { x: 1716, y: 500 };
const TS = 0.34;
const LOOM_STUB = { x: 2040, y: 150 };
const POWERS = [2, 4, 8, 16, 32, 64, 128, 256];
/** the two hanging lamps (L4 px): one over the window rail and stamp, one over the host's ledger */
const LAMPS = [
  { x: 640, y: 128, seed: 71 },
  { x: 1800, y: 92, seed: 73 },
];

interface Beats {
  D: number;
  stamp: number;
  press: number;
  fold: number;
  steps: number;
  counter: number;
  stiff: number;
  home: number;
  speed: number;
  rest: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      stamp: T.beat('stamp'),
      press: T.beat('press'),
      fold: T.beat('fold'),
      steps: T.beat('steps'),
      counter: T.beat('counter'),
      stiff: T.beat('stiff'),
      home: T.word('L0608', 'distance'),
      speed: T.word('L0608', 'speed'),
      rest: T.word('L0608', 'at'),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cm = cam(t, b);
    f.camera(cm);
    f.backlight({ intensity: 0.25, sunX: 640 });
    bench(f);
    f.layer('L4', (c, env) => {
      f.cached(`${ID}/plate/${env.mood.id}`, PLATE.w + 60, PLATE.h + 60, (cc) => {
        cc.translate(-PLATE.x + 30, -PLATE.y + 30);
        plateSheet(cc, env, PLATE, { x: 200, y: 60 });
        lightMap(cc, env);
      })(c, PLATE.x - 30, PLATE.y - 30);
      lampShades(c, env);
      escapement(c, env, t);
      windowRail(c, env, t, tq, b);
      stampAndCards(c, env, t, tq, b);
      squaringPress(c, env, t, tq, b);
      counter(c, env, t, b);
      ledgerAndTable(c, env, t, tq, b);
      equationSlip(c, env, t, b, cm);
    });
    f.rim({ x: 0, y: -1 });
    // the practical lamps: a warm pool on the stamp and rail, a second over the ledger (with a little flicker)
    for (const L of LAMPS) f.practical({ x: L.x, y: L.y + 30, kind: 'lamp', seed: L.seed, intensity: 0.75, radius: 120 });
    // a low haze band drifting along the plate's near edge, in front of the action plane
    f.fog({ yCenter: 640, height: 190, alpha: 0.16, drift: 6 });
    near(f);
  },
});

// ------------------------------------------------------------------ camera: stamp, then press, then the host side
/** close on the window, coil and stamp (L0607/L0608); after 'moving' one long truck right, easing through the press
 *  as it folds and settling on the host's ledger BEFORE the copy (cardsAt); then a slow push. The press is out of frame
 *  until the truck begins; at the end the stamp has left frame entirely. */
const CAM0 = { x: 540, y: 372, z: 150 };
const CAM1 = { x: 1600, y: 370, z: 90 };
const truckFrom = (b: Beats) => b.press + 0.65;
const truckTo = (b: Beats) => b.steps + 1.2;
function cam(t: number, b: Beats): Camera3 {
  const u = ease5((t - truckFrom(b)) / (truckTo(b) - truckFrom(b)));
  const x = lerp(CAM0.x, CAM1.x, u) + 12 * lin(t, 0, truckFrom(b)) * (1 - u);
  const z = lerp(CAM0.z, CAM1.z, u) - 70 * Math.sin(Math.PI * u) + 24 * lin(t, truckTo(b), b.D);
  return { x, y: lerp(CAM0.y, CAM1.y, u), z, lens: 1 };
}

/** the lamps' warm pools: the plate darkens away from them (baked into the plate) */
function lightMap(c: C2, env: PaintEnv) {
  const W = PLATE.w + 400, H = PLATE.h + 400;
  const tmp = document.createElement('canvas');
  const s = 0.25;
  tmp.width = Math.ceil(W * s);
  tmp.height = Math.ceil(H * s);
  const m = tmp.getContext('2d')!;
  m.scale(s, s);
  m.translate(-PLATE.x + 200, -PLATE.y + 200);
  m.fillStyle = withAlpha(shadowCol, 0.42);
  m.fillRect(PLATE.x - 200, PLATE.y - 200, W, H);
  m.globalCompositeOperation = 'destination-out';
  for (const [L, r] of [
    [LAMPS[0], 640],
    [LAMPS[1], 620],
  ] as const) {
    const g = m.createRadialGradient(L.x, L.y + 220, 30, L.x, L.y + 220, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.75)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = g;
    m.fillRect(PLATE.x - 200, PLATE.y - 200, W, H);
  }
  c.save();
  c.beginPath();
  c.rect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
  c.clip();
  c.drawImage(tmp, PLATE.x - 200, PLATE.y - 200, W, H);
  // a warm cast inside each pool
  for (const L of LAMPS) {
    const g = c.createRadialGradient(L.x, L.y + 200, 20, L.x, L.y + 200, 420);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.16));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(L.x - 420, L.y - 220, 840, 840);
  }
  c.restore();
}
/** two hanging lamp shades over the plate, cords running up out of frame */
function lampShades(c: C2, env: PaintEnv) {
  c.save();
  c.fillStyle = '#0b0d0b';
  for (const L of LAMPS) {
    c.fillRect(L.x - 1.2, -600, 2.4, L.y + 600 - 26);
    c.beginPath();
    c.moveTo(L.x - 44, L.y + 30);
    c.quadraticCurveTo(L.x - 30, L.y - 20, L.x - 10, L.y - 28);
    c.lineTo(L.x + 10, L.y - 28);
    c.quadraticCurveTo(L.x + 30, L.y - 20, L.x + 44, L.y + 30);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(brassOf(env, 0.5), 0.8);
    c.lineWidth = lw(c, 1.6);
    c.beginPath();
    c.moveTo(L.x - 44, L.y + 30);
    c.lineTo(L.x + 44, L.y + 30);
    c.stroke();
  }
  c.restore();
}

/** L3: the dark bench past the plate's edges (grain), L5: a near rule with ticks along the front edge (slides fastest) */
function bench(f: Frame) {
  f.layer('L3', (c, env) => {
    f.cached(`${ID}/bench/${env.mood.id}`, 3000, 1300, (cc) => {
      cc.translate(500, 300);
      cc.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.32);
      cc.fillRect(-500, -300, 3000, 1300);
      cc.strokeStyle = withAlpha(env.mood.set, 0.14);
      cc.lineWidth = 1.2;
      for (let i = 0; i < 28; i++) {
        const y = -260 + i * 46 + Math.sin(i * 2.1) * 8;
        cc.beginPath();
        cc.moveTo(-500, y);
        cc.bezierCurveTo(500, y + 10 * Math.sin(i), 1500, y - 12 * Math.cos(i * 1.3), 2500, y + 4);
        cc.stroke();
      }
      const g = cc.createRadialGradient(300, 80, 60, 700, 300, 2000);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.2));
      g.addColorStop(1, withAlpha(env.mood.fg, 0.4));
      cc.fillStyle = g;
      cc.fillRect(-500, -300, 3000, 1300);
    })(c, -500, -300);
  });
  f.fog({ yCenter: 700, height: 160, alpha: 0.08, drift: 6 });
}
function near(f: Frame) {
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/near/${env.mood.id}`, 3400, 220, (cc) => {
      cc.translate(600, -650);
      // a long brass-edged steel rule lying along the plate's front edge, and a pair of dividers at intervals
      cc.fillStyle = mixLab(env.mood.fg, env.mood.ink, 0.5);
      cc.fillRect(-600, 690, 3400, 160);
      cc.fillStyle = mixLab(brassOf(env, 0.1), env.mood.fg, 0.55);
      cc.fillRect(-600, 684, 3400, 10);
      cc.fillStyle = withAlpha(env.mood.fg, 0.9);
      for (let x = -600; x < 2800; x += 24) cc.fillRect(x, 684, 2, x % 120 === 0 ? 10 : 5);
      for (const dx of [140, 1240, 2300]) {
        cc.save();
        cc.translate(dx, 700);
        cc.fillStyle = env.mood.fg;
        cc.beginPath();
        cc.moveTo(-6, -60);
        cc.lineTo(6, -60);
        cc.lineTo(70, 40);
        cc.lineTo(62, 44);
        cc.lineTo(0, -40);
        cc.lineTo(-62, 44);
        cc.lineTo(-70, 40);
        cc.closePath();
        cc.fill();
        cc.beginPath();
        cc.arc(0, -62, 12, 0, Math.PI * 2);
        cc.fill();
        cc.restore();
      }
    })(c, -600, 650);
  });
}

// ------------------------------------------------------------------ the host's 4 ms escapement, ticking evenly
function escapement(c: C2, env: PaintEnv, t: number) {
  const ink = '#0b0d0b';
  const ph = (t * 2) % 1;
  const side = Math.floor(t * 2) % 2 === 0 ? 1 : -1;
  const rock = side * (0.16 - 0.32 * Math.min(1, ph * 3.2) * 0.5) * (ph < 0.3 ? Math.sin((ph / 0.3) * Math.PI * 0.5) : 1);
  c.save();
  // a little brass stand
  c.fillStyle = ink;
  c.fillRect(ESC.x - 3, ESC.y, 6, 70);
  c.fillRect(ESC.x - 26, ESC.y + 66, 52, 8);
  // the escape wheel (fine teeth), half hidden behind the anchor
  const wa = Math.floor(t * 2) * 0.21;
  c.translate(ESC.x, ESC.y + 34);
  c.rotate(wa);
  c.beginPath();
  for (let i = 0; i < 15; i++) {
    const a0 = (i / 15) * Math.PI * 2, a1 = ((i + 0.6) / 15) * Math.PI * 2;
    c.lineTo(Math.cos(a0) * 15, Math.sin(a0) * 15);
    c.lineTo(Math.cos(a1) * 22, Math.sin(a1) * 22);
  }
  c.closePath();
  c.fill();
  c.restore();
  c.save();
  c.translate(ESC.x, ESC.y);
  c.rotate(rock);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-28, 18);
  c.quadraticCurveTo(0, -10, 28, 18);
  c.lineTo(23, 22);
  c.quadraticCurveTo(0, -1, -23, 22);
  c.closePath();
  c.fill();
  c.fillStyle = brassOf(env, ph < 0.12 ? 0.9 : 0.2);
  c.beginPath();
  c.arc(0, 0, 4.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ------------------------------------------------------------------ region A: the window on its rail, the loupe
/** where the window's left edge is (page px): 400, creeping toward 403.12 after the press, the coil starting to move */
function winPos(t: number, b: Beats) {
  return 400 + 3.12 * ease5((t - (b.press + 0.08)) / 0.5);
}
const railX = (px: number) => RAIL.x400 + (px - 400) * ((RAIL.x700 - RAIL.x400) / 300);

function windowRail(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const ink = inkCol(env);
  const pos = winPos(t, b);
  const wx = railX(pos);
  c.save();
  // the rail, its ticks every 20 px of the page, labels at 400 and 700
  c.strokeStyle = ink;
  c.lineWidth = lw(c, 2.2);
  c.beginPath();
  c.moveTo(RAIL.x400 - 40, RAIL.y);
  c.lineTo(RAIL.x700 + 40, RAIL.y);
  c.stroke();
  c.lineWidth = lw(c, 1.1);
  c.beginPath();
  for (let p = 380; p <= 720; p += 20) {
    const x = railX(p);
    c.moveTo(x, RAIL.y);
    c.lineTo(x, RAIL.y + (p % 100 === 0 ? 12 : 6));
  }
  c.stroke();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 18px ${FONT.mono}`, 18);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.fillText('400', railX(400), RAIL.y + 16 + size);
    c.fillText('700', railX(700), RAIL.y + 16 + size);
  });
  // the copper home pin at 700
  const cu = copperOf(env, 0.3);
  c.fillStyle = cu;
  c.fillRect(railX(700) - 2.5, RAIL.y - 52, 5, 52);
  c.beginPath();
  c.arc(railX(700), RAIL.y - 54, 8, 0, Math.PI * 2);
  c.fill();
  // the spring coil from the window's right edge to the pin: twelve turns, trembling a little once it moves
  const x0 = wx + WIN.w, x1 = railX(700) - 6;
  const moving = seg(t, b.press, b.press + 0.4);
  const tremble = moving * Math.sin(tq * 9) * 1.8;
  c.strokeStyle = withAlpha(mixLab(brassOf(env, 0.2), ink, 0.35), 0.95);
  c.lineWidth = lw(c, 1.8);
  c.beginPath();
  const n = 12, y = RAIL.y - WIN.h / 2;
  c.moveTo(x0, y);
  for (let i = 0; i <= n * 2; i++) {
    const u = i / (n * 2);
    const xx = lerp(x0 + 8, x1 - 8, u);
    const yy = y + (i === 0 || i === n * 2 ? 0 : (i % 2 ? -11 : 11) + tremble * (i % 2 ? 1 : -1));
    c.lineTo(xx, yy);
  }
  c.lineTo(x1, y);
  c.stroke();
  c.restore();
  // the paper window: a small card with a title strip, its left edge at pos
  c.save();
  c.fillStyle = withAlpha(shadowCol, 0.3);
  c.fillRect(wx + 3, RAIL.y - WIN.h + 3, WIN.w, WIN.h);
  c.fillStyle = cardPaper(env);
  c.fillRect(wx, RAIL.y - WIN.h, WIN.w, WIN.h);
  c.fillStyle = withAlpha(ink, 0.85);
  c.fillRect(wx, RAIL.y - WIN.h, WIN.w, 9);
  c.strokeStyle = withAlpha(ink, 0.6);
  c.lineWidth = lw(c, 1.1);
  c.strokeRect(wx, RAIL.y - WIN.h, WIN.w, WIN.h);
  c.fillStyle = withAlpha(ink, 0.25);
  for (let k = 0; k < 3; k++) c.fillRect(wx + 8, RAIL.y - WIN.h + 17 + k * 8, WIN.w - 20 - k * 8, 3);
  c.restore();
  loupe(c, env, t, b, pos);
}

/** a brass loupe hung under the window's edge: inside it the rail magnified ×12 (ticks every page px, 398-408) */
function loupe(c: C2, env: PaintEnv, t: number, b: Beats, pos: number) {
  const a = seg(t, b.rest - 0.2, b.rest + 0.4);
  if (a <= 0) return;
  const ink = inkCol(env);
  const L = LOUPE;
  c.save();
  c.globalAlpha = a;
  // the lead line from the window's edge down to the loupe
  c.strokeStyle = withAlpha(ink, 0.45);
  c.setLineDash([3, 4]);
  c.lineWidth = lw(c, 1.1);
  c.beginPath();
  c.moveTo(railX(400), RAIL.y + 2);
  c.lineTo(L.x, L.y - L.r);
  c.stroke();
  c.setLineDash([]);
  // the lens: a pale disc, ticks, and the window's edge as a dark block from its left
  c.save();
  c.beginPath();
  c.arc(L.x, L.y, L.r, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = mixLab(cardPaper(env), '#ffffff', 0.15);
  c.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
  const px = (p: number) => L.x + (p - 401.6) * L.mag;
  c.fillStyle = withAlpha(ink, 0.8);
  c.fillRect(L.x - L.r, L.y + 10, L.r * 2, 2);
  for (let p = 396; p <= 408; p++) c.fillRect(px(p) - 0.8, L.y + 10, 1.6, p % 5 === 0 ? 16 : 9);
  // the window's paper edge
  c.fillStyle = cardPaper(env);
  c.strokeStyle = ink;
  c.lineWidth = lw(c, 1.6);
  c.fillStyle = withAlpha(ink, 0.18);
  c.fillRect(px(pos), L.y - L.r, L.r * 3, L.r + 8);
  c.beginPath();
  c.moveTo(px(pos), L.y - L.r);
  c.lineTo(px(pos), L.y + 10);
  c.stroke();
  // where it was: a faint copper hairline at 400
  c.strokeStyle = withAlpha(copperOf(env, 0.5), 0.8);
  c.beginPath();
  c.moveTo(px(400), L.y - L.r);
  c.lineTo(px(400), L.y + 10);
  c.stroke();
  c.restore();
  // the brass ring and handle
  c.strokeStyle = brassOf(env, 0.3);
  c.lineWidth = lw(c, 5);
  c.beginPath();
  c.arc(L.x, L.y, L.r, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = '#0b0d0b';
  c.save();
  c.translate(L.x, L.y);
  c.rotate(0.75);
  c.fillRect(L.r + 2, -6, 64, 12);
  c.restore();
  c.restore();
  // its readout: 400 → 403.12, under the lens
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 20px ${FONT.mono}`, 20);
    c.save();
    c.globalAlpha = a;
    c.font = `500 ${size}px ${FONT.mono}`;
    c.fillStyle = ink;
    c.textAlign = 'center';
    const s = pos < 400.01 ? '400 px' : `${pos.toFixed(2)} px`;
    c.fillText(s, L.x, L.y + L.r + size + 8);
    const w = c.measureText('403.12 px').width;
    textProbe(c, `${ID}-loupe`, L.x - w / 2, L.y + L.r + 8, w, size * 1.25, a);
    c.restore();
  });
}

// ------------------------------------------------------------------ the brass stamp and its cards
function stampAndCards(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const drop = ease5((tq - (b.stamp - 0.1)) / 0.45);
  if (drop <= 0) return;
  const clack = seg(tq, b.press - 0.16, b.press) * (1 - seg(tq, b.press + 0.08, b.press + 0.35));
  const sy = STAMP.y - (1 - drop) * 260 + clack * 14;
  // input cards: in beside the stamp, labels inked on their words, slide under on 'at rest'
  const inA = seg(tq, b.stamp + 0.25, b.stamp + 0.6);
  const under = ease5((tq - (b.rest + 0.1)) / 0.6);
  const inX = lerp(IN_X, STAMP.x - 30, under);
  const inVis = 1 - seg(tq, b.rest + 0.45, b.rest + 0.7);
  if (inA > 0 && inVis > 0) {
    numCard(c, env, inX, ROW[0], '−300', inA * inVis, `${ID}-in0`);
    numCard(c, env, inX, ROW[1], '0', inA * inVis, `${ID}-in1`);
  }
  const lbl = (s: string, y: number, at: number, id: string) => {
    const a = seg(t, at - 0.1, at + 0.3) * (1 - seg(tq, b.rest + 0.1, b.rest + 0.4));
    if (a <= 0) return;
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `italic 500 24px ${FONT.text}`, 24);
      c.save();
      c.globalAlpha = a;
      c.font = `italic 500 ${size}px ${FONT.text}`;
      c.fillStyle = inkCol(env);
      c.textAlign = 'right';
      c.fillText(s, IN_X - 64, y + size * 0.35);
      const w = c.measureText(s).width;
      textProbe(c, id, IN_X - 64 - w, y - size * 0.65, w, size * 1.25, a);
      c.restore();
    });
  };
  lbl('distance from home', ROW[0], b.home, `${ID}-lhome`);
  lbl('speed', ROW[1], b.speed, `${ID}-lspeed`);
  // output cards: out to the right after the clack
  const outU = ease5((tq - (b.press + 0.12)) / 0.55);
  if (outU > 0) {
    const ox = lerp(STAMP.x + 40, OUT_X, outU);
    const glow = seg(t, b.press + 0.6, b.press + 0.8) * (1 - seg(t, b.press + 1.2, b.press + 2.4));
    numCard(c, env, ox, ROW[0], '−296.88', clamp01(outU * 3), `${ID}-out0`, glow);
    numCard(c, env, ox, ROW[1], '780', clamp01(outU * 3), `${ID}-out1`, glow);
  }
  // the stamp itself (drawn over the cards that slide under it)
  c.save();
  c.globalAlpha = clamp01(drop * 2);
  brassBlock(c, env, STAMP.x, sy, STAMP.w, STAMP.h, clack);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 22px ${FONT.mono}`, 22);
    c.font = `600 ${size}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = mixLab('#3a2614', '#1d140d', 0.5);
    const cells = [
      ['0.9896', '0.00328'],
      ['−2.6', '0.82'],
    ];
    cells.forEach((row, r) =>
      row.forEach((s, k) => {
        const x = STAMP.x + (k === 0 ? -50 : 54);
        const y = sy + (r === 0 ? -28 : 30);
        c.fillText(s, x, y);
      }),
    );
    textProbe(c, `${ID}-stamp`, STAMP.x - 100, sy - 46, 200, 96, clamp01(drop * 2));
    // engraved bracket marks
    c.strokeStyle = mixLab('#3a2614', '#1d140d', 0.5);
    c.lineWidth = lw(c, 2);
    c.beginPath();
    for (const s of [-1, 1]) {
      const bx = STAMP.x + s * 104;
      c.moveTo(bx - s * 8, sy - 54);
      c.lineTo(bx, sy - 54);
      c.lineTo(bx, sy + 54);
      c.lineTo(bx - s * 8, sy + 54);
    }
    c.stroke();
  });
  c.restore();
  // the clack: a little dust of light at the stamp's foot
  if (clack > 0.4) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(env.mood.core, 0.25 * clack);
    c.fillRect(STAMP.x - STAMP.w / 2 - 10, sy + STAMP.h / 2 - 4, STAMP.w + 20, 6);
    c.restore();
  }
}
/** a brass block with a bevel: the stamp's face */
function brassBlock(c: C2, env: PaintEnv, x: number, y: number, w: number, h: number, hot = 0) {
  c.fillStyle = withAlpha(shadowCol, 0.4);
  c.fillRect(x - w / 2 + 6, y - h / 2 + 9, w, h);
  const g = c.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
  g.addColorStop(0, mixLab(brassOf(env, 0.7 + hot * 0.3), '#fff0c8', 0.2));
  g.addColorStop(0.5, brassOf(env, 0.3 + hot * 0.3));
  g.addColorStop(1, mixLab(brassOf(env, 0), '#2a1d14', 0.45));
  c.fillStyle = g;
  c.fillRect(x - w / 2, y - h / 2, w, h);
  c.strokeStyle = mixLab(brassOf(env, 0), '#2a1d14', 0.5);
  c.lineWidth = lw(c, 2);
  c.strokeRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12);
  // the stamp's handle above
  c.fillStyle = '#0b0d0b';
  c.fillRect(x - 12, y - h / 2 - 54, 24, 54);
  c.beginPath();
  c.ellipse(x, y - h / 2 - 60, 30, 13, 0, 0, Math.PI * 2);
  c.fill();
}
/** a paper number card (centre x, y) */
function numCard(c: C2, env: PaintEnv, x: number, y: number, s: string, a: number, id: string, glow = 0) {
  if (a <= 0.01) return;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 24px ${FONT.mono}`, 24);
    c.save();
    c.font = `600 ${size}px ${FONT.mono}`;
    const w = Math.max(84, c.measureText(s).width + 26), h = size * 1.9;
    c.globalAlpha = a;
    c.fillStyle = withAlpha(shadowCol, 0.3);
    c.fillRect(x - w / 2 + 3, y - h / 2 + 4, w, h);
    c.fillStyle = cardPaper(env);
    c.fillRect(x - w / 2, y - h / 2, w, h);
    c.strokeStyle = glow > 0 ? withAlpha(copperOf(env, 0.6), 0.5 + 0.5 * glow) : withAlpha(inkCol(env), 0.5);
    c.lineWidth = lw(c, glow > 0 ? 2.2 : 1);
    c.strokeRect(x - w / 2, y - h / 2, w, h);
    cardProbe(c, id, x - w / 2, y - h / 2, w, h, a, a);
    c.fillStyle = inkCol(env);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(s, x, y + 1);
    textProbe(c, `${id}-t`, x - w / 2, y - h / 2, w, h, a);
    c.restore();
  });
}

// ------------------------------------------------------------------ region B: the squaring press
const foldAt = (b: Beats, i: number) => b.fold + i * 0.27;
function squaringPress(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const ink = '#0b0d0b';
  // which fold is under way: the platen comes down once per fold
  let platen = 0;
  for (let i = 0; i < POWERS.length; i++) {
    const at = foldAt(b, i);
    platen = Math.max(platen, seg(tq, at - 0.12, at) * (1 - seg(tq, at + 0.04, at + 0.15)));
  }
  const p = PRESS;
  c.save();
  c.fillStyle = ink;
  // two columns, a crown, a screw with a cross handle, the platen, the bed
  c.fillRect(p.x - 86, p.top, 18, p.bed - p.top + 20);
  c.fillRect(p.x + 68, p.top, 18, p.bed - p.top + 20);
  c.fillRect(p.x - 104, p.top - 26, 208, 30);
  c.fillRect(p.x - 7, p.top - 96, 14, 80);
  c.fillRect(p.x - 70, p.top - 96, 140, 10);
  for (const s of [-1, 1]) {
    c.beginPath();
    c.arc(p.x + s * 70, p.top - 91, 11, 0, Math.PI * 2);
    c.fill();
  }
  const py = p.top + 70 + platen * 120;
  c.fillRect(p.x - 6, p.top, 12, py - p.top);
  c.fillRect(p.x - 64, py, 128, 26);
  c.fillRect(p.x - 104, p.bed, 208, 22);
  c.strokeStyle = withAlpha(brassOf(env, platen), 0.6 + 0.4 * platen);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.moveTo(p.x - 64, py + 26);
  c.lineTo(p.x + 64, py + 26);
  c.moveTo(p.x - 104, p.bed);
  c.lineTo(p.x + 104, p.bed);
  c.stroke();
  c.restore();
  // the plate under the press (the stamp's face, folding), visible from just before the first fold
  const show = seg(t, b.fold - 0.6, b.fold - 0.2);
  if (show > 0) {
    let k = -1;
    for (let i = 0; i < POWERS.length; i++) if (tq >= foldAt(b, i)) k = i;
    const label = k < 0 ? 1 : POWERS[k];
    if (t < foldAt(b, POWERS.length - 1) + 0.25) powPlate(c, env, p.x, p.bed - 22, label, show, `${ID}-under`, k >= 0 ? 0.6 : 0, 0.82);
  }
  // the folded plates, each slid out to the right as it is pressed: two rows of four
  for (let i = 0; i < POWERS.length; i++) {
    const at = foldAt(b, i) + 0.06;
    const u = ease5((tq - at) / 0.24);
    if (u <= 0) continue;
    const x = lerp(p.x + 40, POW_ROW.x + (i % 4) * POW_ROW.step, u);
    const y = lerp(p.bed - 22, POW_ROW.y[i < 4 ? 0 : 1], u);
    const glow = seg(t, at + 0.1, at + 0.2) * (1 - seg(t, at + 0.4, at + 1.2));
    powPlate(c, env, x, y, POWERS[i], 1, `${ID}-p${i}`, glow, 0.8);
  }
  // M³⁰⁰: the last plate, larger, copper-edged, under the rows
  const lastAt = foldAt(b, POWERS.length - 1) + 0.3;
  const u = ease5((tq - lastAt) / 0.35);
  if (u > 0) {
    const glow = seg(t, lastAt + 0.2, lastAt + 0.4) * (1 - 0.6 * seg(t, lastAt + 0.8, lastAt + 2));
    powPlate(c, env, lerp(p.x + 40, M300.x, u), lerp(p.bed - 22, M300.y, u), 300, clamp01(u * 3), `${ID}-m300`, glow, 1.1);
  }
}
/** a small brass plate stamped M with its power (M drawn, power raised and smaller) */
function powPlate(c: C2, env: PaintEnv, x: number, y: number, pow: number, a: number, id: string, glow: number, s: number) {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  textRole(c, 'subject', () => {
    const big = legibleSize(c, `600 30px ${FONT.display}`, 30 * Math.max(0.8, s));
    const small = legibleSize(c, `600 18px ${FONT.mono}`, 18 * Math.max(0.8, s));
    c.font = `600 ${big}px ${FONT.display}`;
    const wm0 = c.measureText('M').width;
    c.font = `600 ${small}px ${FONT.mono}`;
    const wp0 = pow === 1 ? 0 : c.measureText(String(pow)).width;
    const w = Math.max(64 * s, wm0 + wp0 + 26), h = Math.max(56 * s, big * 1.5);
    brassBlockSmall(c, env, x, y, w, h, glow);
    c.fillStyle = mixLab('#3a2614', '#1d140d', 0.5);
    c.textBaseline = 'alphabetic';
    c.font = `600 ${big}px ${FONT.display}`;
    const wm = c.measureText('M').width;
    c.font = `600 ${small}px ${FONT.mono}`;
    const ps = pow === 1 ? '' : String(pow);
    const wp = c.measureText(ps).width;
    const x0 = x - (wm + wp + 2) / 2;
    c.font = `600 ${big}px ${FONT.display}`;
    c.textAlign = 'left';
    c.fillText('M', x0, y + big * 0.32);
    c.font = `600 ${small}px ${FONT.mono}`;
    c.fillText(ps, x0 + wm + 2, y - big * 0.12);
    textProbe(c, id, x - w / 2, y - h / 2, w, h, a);
  });
  c.restore();
}
function brassBlockSmall(c: C2, env: PaintEnv, x: number, y: number, w: number, h: number, glow: number) {
  c.fillStyle = withAlpha(shadowCol, 0.35);
  c.fillRect(x - w / 2 + 3, y - h / 2 + 5, w, h);
  const g = c.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
  g.addColorStop(0, mixLab(brassOf(env, 0.7 + glow * 0.3), '#fff0c8', 0.2));
  g.addColorStop(1, mixLab(brassOf(env, glow * 0.3), '#2a1d14', 0.35));
  c.fillStyle = g;
  c.fillRect(x - w / 2, y - h / 2, w, h);
  c.strokeStyle = glow > 0 ? withAlpha(copperOf(env, 0.8), 0.6 + 0.4 * glow) : mixLab(brassOf(env, 0), '#2a1d14', 0.5);
  c.lineWidth = lw(c, glow > 0 ? 2.4 : 1.4);
  c.strokeRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6);
}

// ------------------------------------------------------------------ the operation counter and its step dial
function counter(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.steps + 1.6, b.steps + 2.2);
  if (a <= 0) return;
  const ink = '#0b0d0b';
  const spin = Math.max(0, t - (b.steps + 2.6));
  // the dial: 2 → 300 in 2.4 s, then round again, and again (the counter never moves)
  const cyc = 2.4;
  const ph = (spin % cyc) / cyc;
  const n = spin > 0 ? Math.round(2 + 298 * ease5(ph)) : 2;
  c.save();
  c.globalAlpha = a;
  // the counter box: a brass-edged black case with one paper window reading 14
  const C = COUNTER;
  c.fillStyle = ink;
  c.fillRect(C.x - 70, C.y - 44, 140, 88);
  c.strokeStyle = brassOf(env, 0.3);
  c.lineWidth = lw(c, 2);
  c.strokeRect(C.x - 64, C.y - 38, 128, 76);
  c.fillStyle = cardPaper(env);
  c.fillRect(C.x - 46, C.y - 28, 92, 56);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 40px ${FONT.mono}`, 40);
    c.font = `600 ${size}px ${FONT.mono}`;
    c.fillStyle = inkCol(env);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('14', C.x, C.y + 2);
    textProbe(c, `${ID}-ctr`, C.x - 46, C.y - 28, 92, 56, a);
  });
  // the step dial beside it: a ring with ticks, a needle, the step count under it
  const dx = C.x + 140, dy = C.y;
  c.fillStyle = ink;
  c.beginPath();
  c.arc(dx, dy, 46, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = cardPaper(env);
  c.beginPath();
  c.arc(dx, dy, 38, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = inkCol(env);
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  for (let k = 0; k < 30; k++) {
    const aa = (k / 30) * Math.PI * 2;
    c.moveTo(dx + Math.cos(aa) * 32, dy + Math.sin(aa) * 32);
    c.lineTo(dx + Math.cos(aa) * 37, dy + Math.sin(aa) * 37);
  }
  c.stroke();
  const na = -Math.PI / 2 + ((n - 2) / 298) * Math.PI * 2 * 0.95;
  c.strokeStyle = copperOf(env, 0.5);
  c.lineWidth = lw(c, 3);
  c.beginPath();
  c.moveTo(dx, dy);
  c.lineTo(dx + Math.cos(na) * 30, dy + Math.sin(na) * 30);
  c.stroke();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 20px ${FONT.mono}`, 20);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.fillStyle = inkCol(env);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const s = `${n} steps`;
    c.fillText(s, dx, dy + 46 + size + 2);
    textProbe(c, `${ID}-dial`, dx - 65, dy + 48, 130, size * 1.25, a);
  });
  c.restore();
  // the label, on 'fourteen': a pinned paper slip under the counter and its dial, clear of the plate rows
  paperSlip(c, env, { lines: ['14 operations · 3 layers', 'any step count'], x: C.x + 70, y: C.y + 92, t, inkAt: b.counter - 0.05, id: `${ID}-ctrlabel`, size: 25, pin: true });
}

// ------------------------------------------------------------------ region C: the host's ledger, the table, the loom
function ledgerAndTable(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const ink = inkCol(env);
  const L = LEDGER;
  // the host: a small clockwork beside the ledger, its escapement ticking with the plate's corner one
  clockworkX(c, env, { x: HOST.x, y: HOST.y, r: HOST.r, esc: t * 2, crank: 0.25, lit: 0.4, frame: true });
  // the ledger page: header, two parameter lines, four empty card frames
  c.save();
  c.fillStyle = withAlpha(shadowCol, 0.3);
  c.fillRect(L.x + 5, L.y + 7, L.w, L.h);
  c.fillStyle = mixLab(cardPaper(env), '#efe1bf', 0.4);
  c.fillRect(L.x, L.y, L.w, L.h);
  c.strokeStyle = withAlpha(ink, 0.45);
  c.lineWidth = lw(c, 1);
  c.strokeRect(L.x, L.y, L.w, L.h);
  c.beginPath();
  for (let k = 0; k < 7; k++) {
    c.moveTo(L.x + 14, L.y + 64 + k * 26);
    c.lineTo(L.x + L.w - 14, L.y + 64 + k * 26);
  }
  c.strokeStyle = withAlpha(ink, 0.12);
  c.stroke();
  c.restore();
  const glow = seg(t, b.stiff - 0.1, b.stiff + 0.3) * (1 - 0.5 * seg(t, b.stiff + 1.4, b.stiff + 2.4));
  textRole(c, 'subject', () => {
    c.save();
    const hs = legibleSize(c, `600 22px ${FONT.mono}`, 22);
    c.font = `600 ${hs}px ${FONT.mono}`;
    c.fillStyle = ink;
    c.textAlign = 'left';
    c.fillText('float64', L.x + 16, L.y + 34);
    textProbe(c, `${ID}-f64`, L.x + 16, L.y + 34 - hs, 100, hs * 1.2, 1);
    const ps = legibleSize(c, `500 20px ${FONT.mono}`, 20);
    c.font = `500 ${ps}px ${FONT.mono}`;
    const lines = ['stiffness 650', 'damping 45'];
    lines.forEach((s, i) => {
      const y = L.y + 80 + i * 34;
      if (glow > 0) {
        c.save();
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffd27a', 0.4), 0.8 * glow);
        c.fillRect(L.x + 10, y - ps - 2, L.w - 20, ps + 10);
        c.restore();
      }
      c.fillStyle = glow > 0.05 ? mixLab(ink, '#7a3410', 0.4 * glow) : ink;
      c.fillText(s, L.x + 16, y);
      textProbe(c, `${ID}-led${i}`, L.x + 16, y - ps, c.measureText(s).width, ps * 1.2, 1);
    });
    c.restore();
  });
  // four card frames where the host copies M³⁰⁰'s four numbers: the copy starts once the camera has settled on the
  // ledger (cardsAt); a copper arc runs off M³⁰⁰ to the first frame; each frame KEEPS its filled card, and a copy of
  // each flies on into the source table
  const cardsAt = b.steps + 1.6;
  copyArc(c, env, t, cardsAt);
  for (let k = 0; k < 4; k++) {
    const cx = L.x + 40 + k * 52, cy = L.y + 172;
    c.save();
    c.strokeStyle = withAlpha(ink, 0.4);
    c.setLineDash([3, 3]);
    c.lineWidth = lw(c, 1);
    c.strokeRect(cx - 18, cy, 36, 46);
    c.restore();
    const appear = seg(tq, cardsAt + 0.35 + k * 0.18, cardsAt + 0.35 + k * 0.18 + 0.2);
    if (appear > 0) matrixCard(c, env, cx, cy, appear, k);
    const go = ease5((tq - (cardsAt + 1.5 + k * 0.15)) / 0.7);
    if (go > 0 && go < 1) {
      const to = tableCell(11 + k);
      const x = lerp(cx, to.x, go), y = lerp(cy, to.y - 6, go) - 40 * Math.sin(Math.PI * go);
      matrixCard(c, env, x, y, 1, k);
    }
  }
  // the source table: its 20 pigeonholes, small; the four spring cards land in 11-14
  c.save();
  c.translate(TABLE_AT.x, TABLE_AT.y);
  c.scale(TS, TS);
  c.translate(-STRIP.x, -STRIP.y);
  pigeonStrip(c, env, {});
  for (let i = 0; i < STRIP.n; i++) {
    const isSpring = i >= 11 && i <= 14;
    const land = cardsAt + 1.5 + (i - 11) * 0.15 + 0.7;
    if (isSpring && tq < land) continue;
    toggleCard(c, env, i, { flag: 0, subject: false, glow: isSpring ? seg(t, land, land + 0.1) * (1 - seg(t, land + 0.6, land + 1.6)) : 0 });
  }
  c.restore();
  // the loom's stub at the plate's right (ink frames), and the dotted line that stops short of it
  c.save();
  c.fillStyle = ink;
  for (let k = 0; k < 6; k++) {
    const x = LOOM_STUB.x + k * 18, h = 80 + 40 * Math.abs(Math.sin(k * 1.7));
    c.fillRect(x, LOOM_STUB.y + 60 - h / 2, 3, h);
    c.fillRect(x + 9, LOOM_STUB.y + 60 - h / 2, 3, h);
    c.fillRect(x - 2, LOOM_STUB.y + 60 - h / 2 - 3, 16, 3);
  }
  c.restore();
  const da = seg(t, b.stiff + 0.1, b.stiff + 0.9);
  if (da > 0) {
    const x0 = L.x + L.w + 6, y0 = L.y + 88;
    const x1 = LOOM_STUB.x - 34;
    c.save();
    c.strokeStyle = copperOf(env, 0.6);
    c.lineWidth = lw(c, 3);
    c.setLineDash([6, 7]);
    c.beginPath();
    c.moveTo(x0, y0);
    const xe = lerp(x0, x1, da);
    c.quadraticCurveTo((x0 + xe) / 2, y0 + 14 * da, xe, y0 - 18 * da);
    c.stroke();
    c.setLineDash([]);
    // the end: a small bar, stopped short of the loom
    if (da > 0.95) {
      c.lineWidth = lw(c, 3.5);
      c.beginPath();
      c.moveTo(xe, y0 - 30);
      c.lineTo(xe, y0 - 6);
      c.stroke();
    }
    c.restore();
  }
}
const tableCell = (i: number) => ({ x: TABLE_AT.x + (cellX(i) - STRIP.x) * TS, y: TABLE_AT.y });
/** one of M³⁰⁰'s four numbers as a card (centre x, top y): engraved with a tiny 2×2 bracket, its own cell (k: 0 top-left,
 *  1 top-right, 2 bottom-left, 3 bottom-right) inked solid, the other three hollow */
function matrixCard(c: C2, env: PaintEnv, x: number, y: number, a: number, k: number) {
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = withAlpha(shadowCol, 0.3);
  c.fillRect(x - 16, y + 3, 34, 44);
  c.fillStyle = cardPaper(env);
  c.fillRect(x - 18, y, 36, 46);
  c.strokeStyle = withAlpha(copperOf(env, 0.5), 0.8);
  c.lineWidth = lw(c, 1.6);
  c.strokeRect(x - 18, y, 36, 46);
  const ink = inkCol(env);
  // the bracket
  c.strokeStyle = withAlpha(ink, 0.85);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  for (const s of [-1, 1]) {
    const bx = x + s * 12;
    c.moveTo(bx - s * 4, y + 10);
    c.lineTo(bx, y + 10);
    c.lineTo(bx, y + 36);
    c.lineTo(bx - s * 4, y + 36);
  }
  c.stroke();
  ;[
    [-5, -6],
    [5, -6],
    [-5, 6],
    [5, 6],
  ].forEach(([dx, dy], i) => {
    c.beginPath();
    c.arc(x + dx, y + 23 + dy, 3, 0, Math.PI * 2);
    if (i === k) {
      c.fillStyle = mixLab(ink, copperOf(env, 0.6), 0.45);
      c.fill();
    } else {
      c.strokeStyle = withAlpha(ink, 0.6);
      c.lineWidth = lw(c, 1);
      c.stroke();
    }
  });
  c.restore();
}
/** the copy: a copper arc drawn off the M³⁰⁰ plate up to the ledger's first card frame, then fading */
function copyArc(c: C2, env: PaintEnv, t: number, at: number) {
  const draw = seg(t, at - 0.3, at + 0.45);
  const a = 1 - seg(t, at + 1.6, at + 2.6);
  if (draw <= 0 || a <= 0) return;
  const x0 = M300.x + 44, y0 = M300.y - 6;
  const x1 = LEDGER.x + 40, y1 = LEDGER.y + 230;
  const cx = x1 - 20, cy = y0 + 10;
  c.save();
  c.globalAlpha = a;
  c.strokeStyle = copperOf(env, 0.7);
  c.lineWidth = lw(c, 2.6);
  c.lineCap = 'round';
  c.beginPath();
  const N = 28;
  for (let i = 0; i <= N * draw; i++) {
    const u = i / N;
    const px = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * x1;
    const py = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cy + u * u * y1;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.stroke();
  // the arrowhead into the frame once it arrives
  if (draw > 0.97) {
    c.fillStyle = copperOf(env, 0.7);
    c.beginPath();
    c.moveTo(x1, y1 - 2);
    c.lineTo(x1 - 8, y1 + 12);
    c.lineTo(x1 + 8, y1 + 12);
    c.closePath();
    c.fill();
  }
  c.restore();
}

// ------------------------------------------------------------------ the equation, pinned at the top margin
function equationSlip(c: C2, env: PaintEnv, t: number, b: Beats, cm: Camera3) {
  const inkAt = b.press + 0.35;
  const paper = cardPaperAlpha(t, inkAt);
  if (paper <= 0) return;
  const ink = cardInkAlpha(t, inkAt);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 22px ${FONT.mono}`, 22);
    c.save();
    c.font = `500 ${size}px ${FONT.mono}`;
    const l1 = 'one 4 ms step: (−300, 0) → (−296.88, 780)';
    const l2 = 'window 400 → 403.12 px';
    const w = Math.max(c.measureText(l1).width, c.measureText(l2).width) + 44;
    const h = size * 3.1;
    // pinned at the frame's top-left: the slip's rest position is a fixed screen point, mapped into the plate's layer
    const k = 1000 / (1000 - cm.z);
    const x = cm.x + (70 - 640) / k, y = cm.y + (44 - 360) / k;
    const camX = x + w / 2;
    c.globalAlpha = paper;
    c.fillStyle = withAlpha(shadowCol, 0.3);
    c.fillRect(x + 4, y + 5, w, h);
    c.fillStyle = mixLab(cardPaper(env), '#ffffff', 0.1);
    c.fillRect(x, y, w, h);
    c.strokeStyle = withAlpha(inkCol(env), 0.45);
    c.lineWidth = lw(c, 1);
    c.strokeRect(x, y, w, h);
    cardProbe(c, `${ID}-eq`, x, y, w, h, paper, ink);
    // two brass pins
    c.fillStyle = brassOf(env, 0.4);
    for (const px of [x + 12, x + w - 12]) {
      c.beginPath();
      c.arc(px, y + 10, 4, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = ink;
    c.fillStyle = inkCol(env);
    c.textAlign = 'center';
    c.fillText(l1, camX, y + size * 1.35);
    c.fillText(l2, camX, y + size * 2.6);
    void lin;
    textProbe(c, `${ID}-eq1`, x, y + size * 0.35, w, size * 1.25, ink);
    textProbe(c, `${ID}-eq2`, x, y + size * 1.6, w, size * 1.25, ink);
    c.restore();
  });
}
void hash1;
