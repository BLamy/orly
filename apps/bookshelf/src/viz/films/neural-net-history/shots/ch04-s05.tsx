/**
 * ch04-s05 — a single candle on a dark table, 1971–1972; two steady hands open PERCEPTRONS to a handwritten line
 * (winterBlue, slow crossfade in, 11.50 s). No water, no boat, no weather: nothing that dramatises the death.
 *
 * ONE PROJECTION: a true top-down view of the table. The candle is seen from above (its dish ring, the wax top, the
 * wick and a small halo of flame), the book lies flat in plan, and its front board turns over the spine toward the
 * lens (foreshortened, its free edge growing a little as it lifts), then lies open on the left.
 *
 *   open              a dark table lit by one small candle at the upper right (the only light). The PERCEPTRONS book
 *                     of s02, table-sized and closed, lies in its pool: the same cover (sets/ch04-s02-book proportions,
 *                     the title in the same Cormorant SC, a quarter of the way down, stamped pale). The camera eases in.
 *   'birthday' (3.42) date stamp 11 JULY 1971.
 *   'open' (7.09)     after the line, in silence: the narrator's two hands (the kit puppet, small) come up from the
 *                     bottom edge. The right hand takes the cover by its fore-edge only and turns it over the spine (on
 *                     twos), lets it fall open and withdraws; the left hand comes to rest, flat, on the right page's
 *                     lower-right corner and stays there. Neither crosses the text.
 *   'dedication'      on the front matter the handwritten line inks itself in, left to right over 1.2 s, in pen strokes
 *   (7.69)            (sets/ch04-s05-pen), the wet ink catching the candle's light just behind the nib: In memory of
 *                     Frank Rosenblatt. Beneath it, printed in italic: second printing, 1972. No pen, no writer.
 *   hold              on the page. The candle does not gutter; it simply burns (no smoke).
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, defineShot, dustMotes, legibleSize, mixLab, overscan, withAlpha } from '../../../film';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { fbm, hash1 } from '../../../film/core/frame';
import { hands } from '../cast';
import type { HandsPose } from '../sets/narratorHands';
import { clamp01, dateStamp, mixCam, sm, tq12, win } from '../sets/ch04-s01-kit';
import { TITLE, TITLE_FONT, TRACK_K, bookGeom } from '../sets/ch04-s02-book';
import { drawPen, penFront, penText } from '../sets/ch04-s05-pen';

const ID = 'ch04-s05';
type C = CanvasRenderingContext2D;

// the book in plan: closed, centred; spine on its left edge; the agreed proportions (w = 0.77 h)
const BH = 372;
const G = bookGeom(497, 360 + BH / 2, BH);
const W = G.w;
const SPINE = G.x;
const TOP = G.top;
const BOT = G.y;
const CY = (TOP + BOT) / 2;
// the candle, seen from above, at the upper right of the book
const CANDLE = { x: 918, y: 196 };
const WARM = { core: '#f5d998', halo: '#d9a35c', deep: '#af895d', hot: '#fff3d6' };
// the dedication on the right-hand page
const PEN = penText(['In memory of', 'Frank Rosenblatt']);
const XH = 16.5;
const DED = { x: SPINE + W / 2 + 4, y: TOP + 132, xh: XH, lead: XH * 3.05, center: true };
const PRINT_Y = DED.y + DED.lead + 52;

const C0: Camera3 = { x: 652, y: 352, z: 0, lens: 1 };
const C1: Camera3 = { x: 640, y: 352, z: 34, lens: 1 };
const C2: Camera3 = { x: 650, y: 338, z: 82, lens: 1 };
const CAMS = [C0, C1, C2];

interface Beats {
  D: number;
  birthday: number;
  open: number;
  ded: number;
  lineEnd: number;
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = { D: T.duration, birthday: T.beat('date'), open: T.beat('open'), ded: T.beat('dedication'), lineEnd: T.line('L0409').end };
    tl.hold(0, b.D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as Beats;
    let cam = mixCam(C0, C1, sm(t / b.open));
    cam = mixCam(cam, C2, win(t, b.open, b.D));
    f.camera(cam);
    f.backlight({ sunX: CANDLE.x, sunY: CANDLE.y, sunRadius: 380, intensity: 0.1 });

    // the turn of the board (on twos): taken at the fore-edge, over the spine, falling open
    const g0 = b.open - 0.1;
    const g1 = b.open + 0.55;
    const theta = Math.PI * sm((tq - g0) / (g1 - g0));
    const reveal = clamp01((t - b.ded) / 1.2);
    const flick = 1 + 0.07 * fbm(Math.floor(t * 24) / 24 * 9, 1971);

    f.layer('L4', (c, env) => {
      table(f, c, env);
      pool(c, flick);
      bookShadow(c, env, theta);
      pages(f, c, env, t, b, reveal);
      board(c, env, theta);
      candle(c, env, t, flick);
      hands.draw(c, handsAt(tq, b, theta), env);
    });
    f.rim({ x: 0.7, y: -0.7 });
    f.practical({ x: CANDLE.x, y: CANDLE.y, kind: 'lamp', seed: 1971, intensity: 0.75 * flick, radius: 60 });
    // the wet ink's glint riding just behind the nib (the candle's light on wet ink)
    const nib = reveal > 0 && reveal < 1 ? penFront(PEN, { ...DED, reveal }) : null;
    if (nib) f.layer('L4', (c) => glint(c, nib.x - XH * 0.6, nib.y));
    f.layer('L5', (c, env) => nearEdge(f, c, env));
    // L6: a few motes of dust hanging in the candlelight between the table and the lens, far out of focus
    f.layer('L6', (c, env) => dustMotes(c, { area: { x: 520, y: -40, w: 760, h: 520 }, count: 26, size: 3.2, brightness: 0.55, color: WARM.core, drift: { x: 2.2, y: -1.2 }, salt: 1971 }, env));

    dateStamp(f.c, f.mood, t, b.birthday - 0.05, b.lineEnd + 0.4, '11 JULY 1971');
  },
});

// ================================================================================================= hands
/** both arms come up from the BOTTOM edge (their entry points follow the hands along the bottom of the frame) */
function handsAt(tq: number, b: Beats, theta: number): HandsPose {
  const S = 0.62;
  const len = 118 * S;
  const out: HandsPose = { scale: S };
  const BELOW = 840;
  const in0 = b.lineEnd + 0.05;
  const grip = b.open - 0.1;
  const rel = b.open + 0.22; // the hand lets the board go just past upright; it falls open by itself
  const out0 = rel + 0.12;
  const out1 = rel + 1.1;
  const edge = (th: number) => ({ x: SPINE + W * Math.cos(th) + 4, y: CY + 60 });
  // right hand: up from below to the fore-edge, carries it to just past upright, lets go, withdraws downward
  if (tq > in0 && tq < out1) {
    let at: { x: number; y: number };
    let shape: 'pinch' | 'rest' = 'pinch';
    if (tq < grip) {
      const u = sm((tq - in0) / (grip - in0));
      const e = edge(0);
      at = { x: e.x, y: BELOW + (e.y - BELOW) * u };
    } else if (tq < rel) at = edge(theta);
    else if (tq < out0) at = edge(Math.min(theta, Math.PI * 0.58));
    else {
      const u = sm((tq - out0) / (out1 - out0));
      const e = edge(Math.PI * 0.58);
      at = { x: e.x, y: e.y + (BELOW - e.y) * u };
      shape = 'rest';
    }
    out.right = hands.reach({ x: at.x + 46, y: 900 }, at, shape, len, { bend: 0.05 });
  }
  // left hand: comes up with the right, and rests flat on the right page's lower-right corner, still
  const corner = { x: SPINE + W - 34, y: BOT - 20 };
  if (tq > in0 + 0.1) {
    const u = sm((tq - (in0 + 0.1)) / (grip + 0.3 - (in0 + 0.1)));
    const at = { x: corner.x, y: BELOW + (corner.y - BELOW) * u };
    out.left = hands.reach({ x: corner.x + 70, y: 900 }, at, 'flat', len, { bend: -0.05 });
  }
  return out;
}

// ================================================================================================= the table
/** the table top (cached, top-down): dark wood, long irregular grain, a few knots; no edges in frame */
function table(f: Frame, c: C, env: PaintEnv) {
  const r = overscan(LAYERS.L4, CAMS, 40);
  f.cached(`${ID}/table2/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    const base = mixLab(env.mood.set, env.mood.fg, 0.55);
    cc.fillStyle = base;
    cc.fillRect(r.x, r.y, r.w, r.h);
    // boards: three wide planks with soft seams (top-down, running left-right)
    cc.fillStyle = withAlpha(env.mood.fg, 0.55);
    for (const sy of [118, 404, 690]) cc.fillRect(r.x, sy, r.w, 2);
    // grain: long, wavering, low-contrast lines of varying weight (not stripes)
    for (let i = 0; i < 90; i++) {
      const y0 = r.y + (i / 90) * r.h + hash1(i, 3) * 6;
      const amp = 2 + 5 * ((hash1(i, 4) + 1) / 2);
      const fq = 0.004 + 0.004 * ((hash1(i, 5) + 1) / 2);
      cc.strokeStyle = withAlpha(i % 3 ? env.mood.fg : mixLab(env.mood.set, env.mood.setHaze, 0.3), i % 3 ? 0.22 : 0.12);
      cc.lineWidth = 0.6 + 1.1 * ((hash1(i, 6) + 1) / 2);
      cc.beginPath();
      for (let x = r.x; x <= r.x + r.w; x += 16) {
        const y = y0 + amp * Math.sin(x * fq + i) + 1.5 * Math.sin(x * fq * 3.1 + i * 2);
        x === r.x ? cc.moveTo(x, y) : cc.lineTo(x, y);
      }
      cc.stroke();
    }
    // two knots, grain eddying around them
    for (const [kx, ky] of [
      [250, 560],
      [1080, 470],
    ]) {
      cc.strokeStyle = withAlpha(env.mood.fg, 0.3);
      for (let k = 1; k <= 4; k++) {
        cc.lineWidth = 1;
        cc.beginPath();
        cc.ellipse(kx, ky, 6 + k * 7, 3 + k * 3, 0.05, 0, Math.PI * 2);
        cc.stroke();
      }
    }
  })(c, r.x, r.y);
}

/** the candle's warm pool on the table, and the dark falling away from it */
function pool(c: C, flick: number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(CANDLE.x, CANDLE.y, 10, CANDLE.x, CANDLE.y, 640);
  g.addColorStop(0, withAlpha(WARM.halo, 0.3 * flick));
  g.addColorStop(0.3, withAlpha(WARM.deep, 0.12 * flick));
  g.addColorStop(1, withAlpha(WARM.deep, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(CANDLE.x, CANDLE.y, 640, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** the book's soft shadow on the table, cast away from the candle (down-left); the lifted board's own shadow */
function bookShadow(c: C, env: PaintEnv, theta: number) {
  c.save();
  c.filter = `blur(${(8 * env.pxScale).toFixed(1)}px)`;
  c.fillStyle = withAlpha(env.mood.fg, 0.7);
  const open = sm(theta / Math.PI);
  const x0 = SPINE - W * open;
  c.fillRect(x0 - 12, TOP + 14, W + W * open + 4, BH + 4);
  c.restore();
}

// ================================================================================================= the book
const PAPER = '#e9dfca';
/** the page block (right) under the cover: the front-matter page with its edges; the dedication inks in; the
 *  printed caption beneath it */
function pages(f: Frame, c: C, env: PaintEnv, t: number, b: Beats, reveal: number) {
  const paper = mixLab(PAPER, env.mood.setHaze, 0.32);
  // page-block edges (thickness, seen just past the right and bottom edges)
  c.fillStyle = mixLab(paper, env.mood.set, 0.45);
  c.fillRect(SPINE + 2, TOP + 3, W + 3, BH + 3);
  c.strokeStyle = withAlpha(env.mood.fg, 0.35);
  c.lineWidth = 0.6;
  for (let i = 1; i <= 3; i++) {
    c.beginPath();
    c.moveTo(SPINE + W + i, TOP + 4);
    c.lineTo(SPINE + W + i, BOT + i);
    c.lineTo(SPINE + 4, BOT + i);
    c.stroke();
  }
  // the page, lit warm from the candle (upper right), falling off toward the spine and the bottom
  c.fillStyle = paper;
  c.fillRect(SPINE, TOP, W, BH);
  const g = c.createRadialGradient(CANDLE.x - 40, CANDLE.y, 30, CANDLE.x - 60, CANDLE.y + 40, 520);
  g.addColorStop(0, withAlpha(WARM.core, 0.36));
  g.addColorStop(0.5, withAlpha(WARM.halo, 0.12));
  g.addColorStop(1, withAlpha(env.mood.set, 0.32));
  c.fillStyle = g;
  c.fillRect(SPINE, TOP, W, BH);
  // the gutter: shade into the spine
  const gut = c.createLinearGradient(SPINE, 0, SPINE + 34, 0);
  gut.addColorStop(0, withAlpha(env.mood.fg, 0.35));
  gut.addColorStop(1, withAlpha(env.mood.fg, 0));
  c.fillStyle = gut;
  c.fillRect(SPINE, TOP, 34, BH);
  // a fine printed rule near the head of the page (front matter)
  c.fillStyle = withAlpha('#2a2018', 0.35);
  c.fillRect(SPINE + W / 2 - 22, TOP + 62, 44, 0.8);
  // the dedication, in pen, inking itself in
  const wet = 1 - win(t, b.ded + 1.2, b.ded + 2.0);
  if (reveal >= 1 && wet <= 0) {
    // written and dry: one cached bitmap for the hold (the strokes are thousands of short segments)
    f.cached(`${ID}/pen/${env.mood.id}`, Math.ceil(W), Math.ceil(BH), (cc) => {
      cc.translate(-SPINE, -TOP);
      drawPen(cc, PEN, { ...DED, reveal: 1, wet: 0 }, env, WARM);
    })(c, SPINE, TOP);
  } else if (reveal > 0) drawPen(c, PEN, { ...DED, reveal, wet }, env, WARM);
  // the printed caption beneath, in the book's italic
  const capA = win(t, b.ded + 1.25, b.ded + 1.85);
  if (capA > 0.01) {
    c.save();
    c.globalAlpha = capA;
    const font = (s: number) => `italic 400 ${s}px ${FONT.text}`;
    const size = legibleSize(c, font(15), 15);
    c.font = font(size);
    c.fillStyle = mixLab('#2a2018', env.mood.ink, 0.3);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText('second printing, 1972', SPINE + W / 2 + 4, PRINT_Y);
    c.restore();
  }
}

/** the front board, turning over the spine (top-down): its width foreshortens by cos θ and its free edge grows a
 *  little as it lifts toward the lens; outside (the cover) while θ < 90°, the endpaper inside once it is over */
function board(c: C, env: PaintEnv, theta: number) {
  const cs = Math.cos(theta);
  const lift = Math.sin(theta);
  const fx = SPINE + W * cs;
  const e = 1 + 0.14 * lift;
  const h0 = BH / 2 + 2;
  const h1 = (BH / 2 + 2) * e;
  // the lifted board's shadow on the page/table, thrown down-left away from the candle
  if (lift > 0.02) {
    c.save();
    c.filter = `blur(${(6 + 6 * lift).toFixed(1)}px)`;
    c.fillStyle = withAlpha(env.mood.fg, 0.4 * lift);
    c.beginPath();
    c.moveTo(SPINE, CY - h0);
    c.lineTo(fx - 26 * lift, CY - h1 + 20 * lift);
    c.lineTo(fx - 26 * lift, CY + h1 + 20 * lift);
    c.lineTo(SPINE, CY + h0);
    c.closePath();
    c.fill();
    c.restore();
  }
  const quad = () => {
    c.beginPath();
    c.moveTo(SPINE, CY - h0);
    c.lineTo(fx, CY - h1);
    c.lineTo(fx, CY + h1);
    c.lineTo(SPINE, CY + h0);
    c.closePath();
  };
  c.save();
  if (cs >= 0) {
    // the cover: dark cloth, the bevel rule, the title stamped pale in the agreed face and place
    quad();
    c.fillStyle = mixLab(env.mood.ink, env.mood.set, 0.35);
    c.fill();
    c.clip();
    // light on the cloth from the candle, stronger as it lifts toward it
    const lg = c.createLinearGradient(SPINE, 0, SPINE + W, 0);
    lg.addColorStop(0, withAlpha(WARM.deep, 0.04));
    lg.addColorStop(1, withAlpha(WARM.deep, 0.14 + 0.2 * lift));
    c.fillStyle = lg;
    c.fillRect(SPINE - 4, TOP - 40, W + 8, BH + 80);
    c.translate(SPINE, CY);
    c.scale(Math.max(0.001, cs), (e + 1) / 2);
    c.strokeStyle = withAlpha(env.mood.rim, 0.26);
    c.lineWidth = 1.2;
    const k = W / 330;
    c.strokeRect(16 * k, -BH / 2 + 16 * k, W - 32 * k, BH - 32 * k);
    c.font = TITLE_FONT(G.titleSize);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    (c as C & { letterSpacing: string }).letterSpacing = `${(W * TRACK_K).toFixed(2)}px`;
    c.fillStyle = withAlpha(mixLab(WARM.core, env.mood.rim, 0.45), 0.78);
    c.fillText(TITLE, W / 2, G.titleY - CY);
  } else {
    // the inside of the board: the endpaper, framed by the cloth's turn-in
    quad();
    c.fillStyle = mixLab(env.mood.ink, env.mood.set, 0.35);
    c.fill();
    const inset = 7;
    const fxi = fx + inset;
    c.beginPath();
    c.moveTo(SPINE - 2, CY - h0 + inset);
    c.lineTo(fxi, CY - h1 + inset);
    c.lineTo(fxi, CY + h1 - inset);
    c.lineTo(SPINE - 2, CY + h0 - inset);
    c.closePath();
    const ep = mixLab(mixLab(PAPER, env.mood.setHaze, 0.45), WARM.deep, 0.12);
    c.fillStyle = ep;
    c.fill();
    const sh = c.createLinearGradient(fx, 0, SPINE, 0);
    sh.addColorStop(0, withAlpha(env.mood.fg, 0.32));
    sh.addColorStop(0.8, withAlpha(env.mood.fg, 0.1));
    sh.addColorStop(1, withAlpha(env.mood.fg, 0.3));
    c.fillStyle = sh;
    c.fill();
  }
  c.restore();
  // the board's free edge catches the candle as it stands up
  if (lift > 0.05) {
    c.strokeStyle = withAlpha(WARM.core, 0.5 * lift);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(fx, CY - h1);
    c.lineTo(fx, CY + h1);
    c.stroke();
  }
}

// ================================================================================================= the candle
/** the candle from directly above: a low dish (a dark ring, its lip catching the flame), the wax top glowing
 *  translucent around the wick, and the flame seen end-on as a small bright halo */
function candle(c: C, env: PaintEnv, t: number, flick: number) {
  const { x, y } = CANDLE;
  c.save();
  // dish: a dark ring with a lit inner lip
  c.fillStyle = mixLab(env.mood.ink, env.mood.set, 0.3);
  c.beginPath();
  c.arc(x, y, 36, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(WARM.halo, 0.55);
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(x, y, 30, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(env.mood.rim, 0.3);
  c.lineWidth = 1;
  c.beginPath();
  c.arc(x, y, 36, Math.PI * 0.9, Math.PI * 1.6);
  c.stroke();
  // the wax top: pale, glowing from within near the wick
  const wg = c.createRadialGradient(x, y, 2, x, y, 15);
  wg.addColorStop(0, mixLab(WARM.core, WARM.hot, 0.5));
  wg.addColorStop(0.55, mixLab(WARM.halo, '#e8d6b0', 0.4));
  wg.addColorStop(1, mixLab('#d8c8a6', env.mood.set, 0.35));
  c.fillStyle = wg;
  c.beginPath();
  c.arc(x, y, 15, 0, Math.PI * 2);
  c.fill();
  // the flame end-on: a small hot oval leaning with the air, and its wick
  const sway = 0.8 * fbm(Math.floor(t * 24) / 24 * 3.1, 1976);
  c.globalCompositeOperation = 'lighter';
  const fg = c.createRadialGradient(x + sway, y - 1, 0, x + sway, y - 1, 10 * flick);
  fg.addColorStop(0, withAlpha(WARM.hot, 0.95));
  fg.addColorStop(0.45, withAlpha(WARM.core, 0.7));
  fg.addColorStop(1, withAlpha(WARM.halo, 0));
  c.fillStyle = fg;
  c.beginPath();
  c.ellipse(x + sway, y - 1, 10 * flick, 8 * flick, 0, 0, Math.PI * 2);
  c.fill();
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = withAlpha(env.mood.ink, 0.8);
  c.beginPath();
  c.arc(x + sway * 0.3, y, 1.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** the candle's light on the wet ink, riding just behind the nib's front */
function glint(c: C, x: number, y: number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, 16);
  g.addColorStop(0, withAlpha(WARM.core, 0.4));
  g.addColorStop(1, withAlpha(WARM.core, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, 16, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** the near plane (L5, out of focus): the dark edge of a folded cloth runner along the lower-left of the table */
function nearEdge(f: Frame, c: C, env: PaintEnv) {
  const r = overscan(LAYERS.L5, CAMS, 60);
  f.cached(
    `${ID}/near3/${env.mood.id}`,
    Math.ceil(r.w),
    260,
    (cc) => {
      cc.translate(-r.x, -560);
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.moveTo(r.x, 820);
      cc.lineTo(r.x, 640);
      cc.quadraticCurveTo(120, 650, 300, 704);
      cc.quadraticCurveTo(420, 740, 520, 820);
      cc.closePath();
      cc.fill();
      // its folded edge catches a little light
      cc.strokeStyle = withAlpha(mixLab(env.mood.rim, WARM.deep, 0.4), 0.3);
      cc.lineWidth = 3;
      cc.beginPath();
      cc.moveTo(r.x, 642);
      cc.quadraticCurveTo(120, 652, 300, 706);
      cc.stroke();
    },
    { blur: 6 },
  )(c, r.x, 560);
}
