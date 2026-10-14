/**
 * ch08-s04 — one convolution, staged as a paper theatre: a pierced 3 × 3 tin stencil over a stitched digit, nine
 * holes weigh the light, the sum is inked, below zero goes dark, and the same stencil slides everywhere to fill a
 * wall of bright spots (candleAmber; 23.42 s; in: crossfade from the husky photograph).
 * A hand-set TOY (ILLUSTRATIVE tag from 'pierced' on): the Sobel-style vertical-edge weights −1 0 1 / −2 0 2 /
 * −1 0 1 on the kit's 14 × 14 digit '4'; every number on screen comes from convolve() (sets/ch08-s04-stencil).
 *
 *   'pierced'     the nine weights ink in beside the nine holes on the stencil itself
 *   'picture'     the stencil, its lamp behind it, lowers over the stroke's RIGHT edge; its beam reaches the wall
 *   'weighs'      push into the stencil: the nine holes glow one by one over the nine threads beneath
 *   'Add'         the camera eases back; a parchment plate inks the nine products, one per hole, in row order
 *                 (the middle column's weights are 0, so those terms are visibly 0): = −4
 *   'zero'        that wall cell stays dark: its own value reads −4 → 0
 *   'edge'        the stencil glides to the stroke's LEFT edge (row 10, column 7); the plate re-inks the worked
 *                 cell, max(0, …) = 3.88; on 'nearly four' the beam flares and the brightest spot on the wall lights
 *   'Slide'       the stencil returns to the first position and steps in raster order on twos, accelerating, each
 *                 wall cell lighting with its real rectified sum until the map glows: a bright bar wherever a
 *                 stroke has a left edge
 *   'convolution' the camera eases back: the stencil's shadow, faint, in every cell (the same nine weights
 *                 everywhere); hold on the finished wall
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { defineShot, withAlpha, mixLab, MOODS } from '../../../film';
import { label, MFONT, parchmentPlate, PARCH } from '../../../film/silhouette/metaphors/kit';
import { legibleSize, softPlate } from '../../../film/silhouette/type';
import { clamp01, lerp, mixCam, sm, tq12, win } from '../sets/ch08-s01-kit';
import { K, MAP, MAP_MAX, ON, PAD, POS_RELU, POS_WORKED, TC, WALL, WC, beam, cellOf, fmt, stencil, stencilXY, tapestry, terms, threadsUnder, wall, wallCell } from '../sets/ch08-s04-stencil';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s04';
const CA0: Camera3 = { x: 610, y: 352, z: 50, lens: 1 };
const CA1: Camera3 = { x: 580, y: 340, z: 110, lens: 1 };
const RELU = cellOf(POS_RELU);
const RC = { x: stencilXY(RELU.col, RELU.row).x + TC * 1.5, y: stencilXY(RELU.col, RELU.row).y + TC * 1.5 };
const CP: Camera3 = { x: RC.x + 24, y: RC.y + 6, z: 530, lens: 1 };
const CW: Camera3 = { x: 690, y: 336, z: 12, lens: 1 };
const CW2: Camera3 = { x: 676, y: 346, z: 52, lens: 1 };
const CS: Camera3 = { x: 650, y: 336, z: 24, lens: 1 };
/** on 'convolution': ease back (z −150) over 3 s, so the stencil's shadow tiling the wall reads as one pattern */
const CE: Camera3 = { x: 652, y: 344, z: -126, lens: 1 };
const NPOS = ON * ON;

interface B {
  D: number;
  kernel: number;
  hold: number;
  weigh: number;
  add: number;
  relu: number;
  worked: number;
  four: number;
  bright: number;
  slide: number;
  conv: number;
  full: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: B = {
      D: T.duration,
      kernel: T.beat('kernel'),
      hold: T.beat('hold'),
      weigh: T.beat('weigh'),
      add: T.beat('add'),
      relu: T.beat('relu'),
      worked: T.beat('worked'),
      four: T.word('L0808', 'four'),
      bright: T.word('L0808', 'bright'),
      slide: T.beat('slide'),
      conv: T.beat('conv'),
      full: T.beat('full'),
    };
    tl.hold(0, b.D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    const tq = tq12(t);
    f.camera(camAt(t, b));
    // a dark room: the stencil's candle and its beam are the light (the wall's spots read against it)
    f.backlight({ sunX: 700, sunY: 400, sunRadius: 460, intensity: 0.28 });
    theatreBack(f);
    // fog A: a haze sheet between the tapestry and the plaster wall, so the beam crosses air
    f.fog('A');
    const pos = positionAt(tq, b);
    const lift = 170 * (1 - sm((tq - b.hold + 0.35) / 0.8)) + 260 * sm((tq - b.full + 0.2) / 0.9);
    // the stencil's lamp, behind the plane of the plate (painted first so its halo never washes the stitches)
    const sp = stencilXY(pos.col, pos.row);
    f.practical({ x: sp.x + TC * 1.5, y: sp.y - lift - PAD - 31, kind: 'candle', seed: 841, intensity: 0.8, radius: 60 });
    f.layer('L4', (c, env) => {
      tapestry(c, env);
      // nine holes weigh the light: each hole and the thread beneath it glow in turn
      const hg = Array.from({ length: 9 }, (_, q) => {
        const a = b.weigh + 0.08 + q * 0.17;
        return win(t, a, a + 0.12) * (1 - win(t, a + 0.5, a + 0.8)) + 0.25 * win(t, b.weigh + 1.6, b.weigh + 1.9) * (1 - win(t, b.add + 0.2, b.add + 0.6));
      });
      threadsUnder(c, env, pos.col, pos.row, hg);
      wall(c, env, { lit: (q) => litAt(q, t, tq, b), ghost: (q) => ghostAt(q, t, b), mark: markAt(t, b) });
      // the beam: from 'picture' at the relu position (dark), at the worked position (flaring), then each step
      const idx = pos.idx;
      const val = Math.max(0, MAP[idx]) / MAP_MAX;
      const fireOn = win(t, b.hold + 0.5, b.hold + 0.9);
      const flare = idx === POS_WORKED && tq < b.slide ? 1 + 0.6 * win(t, b.four - 0.2, b.four + 0.3) * (1 - win(t, b.bright + 0.6, b.bright + 1.4)) : 1;
      const stepFire = tq >= b.slide ? 0.55 + 0.45 * (1 - (pos.frac ?? 0)) : 1;
      const glide = pos.gliding ? 0.25 : 1;
      if (lift < 1) beam(c, env, pos.col, pos.row, idx, idx === POS_WORKED && tq < b.slide ? val * win(t, b.four - 0.3, b.four + 0.2) : val, fireOn * glide * stepFire * Math.min(1.6, flare) * (t > b.full + 0.4 ? 1 - win(t, b.full + 0.4, b.full + 1.2) : 1));
      stencil(c, env, { col: pos.col, row: pos.row, lift, weights: win(t, b.kernel, b.kernel + 0.6), holeGlow: hg, fire: idx === POS_WORKED ? win(t, b.four - 0.2, b.four + 0.3) : 0 });
      reluCell(c, env, t, b);
      shadowTiling(c, env, t, b);
    });
    f.rim({ x: 0.2, y: -1 });
    f.layer('L5', (c, env) => {
      // a brass chamberstick on the near table corner at lower left (blurred, unlit, its stub below the digit's
      // bar): on the push into the stencil it drops out of frame, so the move reads as photographed
      c.fillStyle = env.fill('fg');
      const cx = 150;
      c.beginPath();
      c.ellipse(cx, 604, 46, 9, 0, 0, Math.PI * 2);
      c.fill();
      c.fillRect(cx - 9, 556, 18, 48);
      c.fillRect(cx - 17, 550, 34, 8);
      c.fillRect(cx - 7, 512, 14, 40);
      c.beginPath();
      c.arc(cx + 46, 590, 11, -Math.PI * 0.6, Math.PI * 0.6);
      c.lineWidth = 6;
      c.strokeStyle = env.fill('fg');
      c.stroke();
      c.fillStyle = withAlpha(env.mood.rim, 0.25);
      c.fillRect(cx - 17, 549, 34, 1.4);
      c.fillStyle = env.fill('fg');
      c.fillRect(-500, 610, cx + 560, 400);
      // the theatre's stage lip, footlight hoods (blurred), low in frame
      c.fillRect(-500, 676, 2300, 300);
      for (let x = -300; x < 1700; x += 210) {
        c.beginPath();
        c.ellipse(x, 678, 40, 14, 0, Math.PI, 0);
        c.fill();
      }
    });
    // the room's edges fall off ≈ 30 % (screen-locked), so the lit wall and the stencil carry the frame
    const c = f.c;
    c.save();
    c.globalCompositeOperation = 'multiply';
    const vg = c.createRadialGradient(640, 350, 260, 640, 360, 820);
    vg.addColorStop(0, '#ffffff');
    vg.addColorStop(1, '#a8a8a8');
    c.fillStyle = vg;
    c.fillRect(0, 0, 1280, 720);
    c.restore();
    // ---- type (screen-locked)
    illustrative(f, t, b);
    plate(f, t, b);
  },
});

// ================================================================================================= CAMERA
function camAt(t: number, b: B): Camera3 {
  let c = mixCam(CA0, CA1, sm(t / (b.weigh - 0.4)));
  c = mixCam(c, CP, sm((t - b.weigh + 0.35) / 1.1));
  c = mixCam(c, CW, sm((t - b.add + 0.45) / 1.2));
  c = mixCam(c, CW2, sm((t - b.worked) / (b.slide - b.worked)));
  c = mixCam(c, CS, sm((t - b.slide + 0.3) / 1.2));
  return mixCam(c, CE, sm((t - b.conv + 0.1) / 3.0));
}

// ================================================================================================= THE STENCIL'S PATH
interface Pos {
  col: number;
  row: number;
  idx: number;
  gliding: boolean;
  frac?: number;
}
const posOf = (idx: number) => cellOf(idx);
/** raster index during the slide: accelerating (a quadratic ease-in), every cell visited, done just before 'full' */
function sweepIdx(tq: number, b: B): number {
  const s0 = b.slide + 0.45;
  const s1 = b.full - 0.25;
  const u = clamp01((tq - s0) / (s1 - s0));
  return Math.min(NPOS - 1, (NPOS - 1) * (0.35 * u + 0.65 * u * u));
}
function positionAt(tq: number, b: B): Pos {
  const A = posOf(POS_RELU), W = posOf(POS_WORKED), Z = posOf(0);
  if (tq < b.worked) return { ...A, idx: POS_RELU, gliding: false };
  if (tq < b.worked + 0.6) {
    const u = sm((tq - b.worked) / 0.6);
    return { col: lerp(A.col, W.col, u), row: lerp(A.row, W.row, u), idx: u < 0.5 ? POS_RELU : POS_WORKED, gliding: true };
  }
  if (tq < b.slide) return { ...W, idx: POS_WORKED, gliding: false };
  if (tq < b.slide + 0.45) {
    const u = sm((tq - b.slide) / 0.45);
    return { col: lerp(W.col, Z.col, u), row: lerp(W.row, Z.row, u), idx: 0, gliding: true };
  }
  const x = sweepIdx(tq, b);
  const i = Math.floor(x);
  return { ...posOf(i), idx: i, gliding: false, frac: x - i };
}

/** how lit a wall cell is (multiplies its real rectified value) */
function litAt(q: number, t: number, tq: number, b: B): number {
  let v = 0;
  if (q === POS_WORKED) v = win(t, b.four - 0.3, b.four + 0.3);
  if (tq >= b.slide + 0.45) {
    const x = sweepIdx(tq, b);
    if (q < x) v = 1;
    else if (q === Math.floor(x)) v = Math.max(v, sm((x - q) * 2));
  }
  return v;
}
/** the stencil's print stays in every cell it has stood over (raster order, behind the moving stencil); on
 *  'convolution' the rest are stamped in a quick raster wave ahead of it, so the same nine weights show everywhere */
function ghostAt(q: number, t: number, b: B): number {
  const tq = tq12(t);
  let v = 0;
  if (tq >= b.slide + 0.45 && q < sweepIdx(tq, b)) v = 1;
  const a = b.conv + 0.05 + (q / (NPOS - 1)) * 1.2;
  v = Math.max(v, win(t, a, a + 0.2));
  // a little brighter as it is named, then settled for the hold
  return v * (0.22 + 0.06 * win(t, b.conv - 0.1, b.conv + 0.3) * (1 - win(t, b.conv + 1.4, b.full + 0.8)));
}
function markAt(t: number, b: B) {
  if (t < b.relu - 0.6) return undefined;
  if (t < b.worked) return { idx: POS_RELU, k: win(t, b.relu - 0.6, b.relu - 0.2) };
  if (t < b.slide) return { idx: POS_WORKED, k: win(t, b.worked + 0.6, b.worked + 1) };
  return undefined;
}

// ================================================================================================= THE WALL CELL'S OWN VALUE
/** the shuttered position's wall cell shows its own value: −4 (dim, cool) flashes in the cell, then on 'zero' it
 *  becomes 0 and the cell stays dark (below zero counts as zero). No tag, no leader: the cell is the readout. */
function reluCell(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.relu - 0.5, b.relu - 0.25) * (1 - win(t, b.worked - 0.3, b.worked + 0.05));
  if (a <= 0.003) return;
  const w = wallCell(POS_RELU);
  const z = win(t, b.relu - 0.05, b.relu + 0.15);
  const cool = mixLab(env.mood.rim, '#a9bdd0', 0.6);
  c.save();
  c.globalAlpha = a;
  // the cell, lifted a little out of the wall (a dark tile 1.6 cells wide so the figure is legible)
  const R = WC * 0.8;
  c.fillStyle = withAlpha('#0c0a08', 0.9);
  c.fillRect(w.x - R, w.y - R * 0.86, 2 * R, 1.72 * R);
  c.strokeStyle = withAlpha(z < 0.5 ? cool : env.mood.rim, 0.55);
  c.lineWidth = 1;
  c.strokeRect(w.x - R + 0.5, w.y - R * 0.86 + 0.5, 2 * R - 1, 1.72 * R - 1);
  c.restore();
  label(c, '−4', w.x, w.y + 6, { size: 17.5, font: MFONT.mono, weight: 500, color: cool, align: 'center', alpha: a * (1 - z) * 0.85 });
  label(c, '0', w.x, w.y + 6, { size: 17.5, font: MFONT.mono, weight: 500, color: mixLab(env.mood.rim, env.mood.fg, 0.35), align: 'center', alpha: a * z });
}

// ================================================================================================= THE SHADOW TILING
/**
 * On 'convolution': the one stencil's shadow, faint, tiled across the whole wall (its 3 × 3 plate, pierced holes as
 * warm dots sized by weight, shutters as cool slits), rippling in from the top-left in raster order: the same nine
 * weights at every position.
 */
function shadowTiling(c: C, env: PaintEnv, t: number, b: B) {
  const base = win(t, b.conv - 0.15, b.conv + 0.6);
  if (base <= 0.003) return;
  const m = env.mood;
  const cool = MOODS.winterBlue.rim;
  const S = WC * 3;
  c.save();
  for (let bj = 0; bj < 4; bj++)
    for (let bi = 0; bi < 4; bi++) {
      const d = (bj * 4 + bi) / 15;
      const a = base * win(t, b.conv - 0.15 + d * 0.9, b.conv + 0.25 + d * 0.9);
      if (a <= 0.003) continue;
      const x0 = WALL.x + bi * S, y0 = WALL.y + bj * S;
      c.globalAlpha = 0.11 * a;
      c.fillStyle = '#000';
      c.fillRect(x0 + 1, y0 + 1, S - 2, S - 2);
      c.globalAlpha = 0.3 * a;
      c.strokeStyle = m.rim;
      c.lineWidth = 0.8;
      c.strokeRect(x0 + 1.5, y0 + 1.5, S - 3, S - 3);
      for (let h = 0; h < 9; h++) {
        const kw = K[h];
        if (kw === 0) continue;
        const cx = x0 + ((h % 3) + 0.5) * WC, cy = y0 + (Math.floor(h / 3) + 0.5) * WC;
        c.globalAlpha = 0.36 * a;
        if (kw > 0) {
          c.fillStyle = m.core;
          c.beginPath();
          c.arc(cx, cy, 1.6 + 1.3 * kw, 0, Math.PI * 2);
          c.fill();
        } else {
          c.fillStyle = cool;
          c.fillRect(cx - 1.5 - 1.2 * -kw, cy - 0.8, 3 + 2.4 * -kw, 1.6);
        }
      }
    }
  c.restore();
}

// ================================================================================================= TYPE
function illustrative(f: Frame, t: number, b: B) {
  // it steps aside while the camera is pushed into the stencil (the lit stitches fill the bottom of frame then)
  // it steps aside for the push into the stencil and while the parchment plate holds the bottom of frame (the plate
  // is the text then); it returns for the slide and the hold
  const away = Math.max(win(t, b.weigh - 0.45, b.weigh - 0.1), 0) * (1 - win(t, b.slide - 0.1, b.slide + 0.4));
  const a = win(t, b.kernel + 0.1, b.kernel + 0.7) * (1 - away);
  if (a <= 0.003) return;
  const c = f.c;
  c.save();
  c.globalAlpha = a;
  // on a soft plate, above the bottom 12 % (the lower line's baseline at 86 % of frame)
  softPlate(c, 320, 606, 740, 112, f.mood.ink, 0.72);
  c.fillStyle = withAlpha(mixLab(f.mood.fg, f.mood.ink, 0.5), 0.72);
  c.shadowColor = withAlpha(f.mood.fg, 0.7);
  c.shadowBlur = 18;
  c.beginPath();
  c.roundRect(30, 566, 620, 76, 10);
  c.fill();
  c.restore();
  const col = mixLab('#efe3cf', f.mood.core, 0.2);
  // at the legibility floor (22 px cap height at 1080p); the second baseline stays above the bottom 12 %
  const size = legibleSize(c, `italic 400 20px ${MFONT.serif}`, 20);
  label(c, 'ILLUSTRATIVE · a toy stencil, set by hand', 48, 626 - size * 1.3, { size, font: MFONT.serif, italic: true, color: col, align: 'left', alpha: a * 0.95 });
  label(c, 'AlexNet’s first-layer stencils: 11 × 11 × 3, in colour, learned', 48, 626, { size, font: MFONT.serif, italic: true, color: col, align: 'left', alpha: a * 0.88 });
}

/** the parchment plate: nine products in row order (laid out as the stencil's 3 × 3), then the sum */
function plate(f: Frame, t: number, b: B) {
  const showA = win(t, b.add - 0.12, b.add + 0.2) * (1 - win(t, b.slide - 0.5, b.slide - 0.1));
  if (showA <= 0.003) return;
  const worked = t >= b.worked + 0.05;
  const idx = worked ? POS_WORKED : POS_RELU;
  // the first product inks as the plate fades up (never a blank parchment)
  const t0 = worked ? b.worked + 0.1 : b.add - 0.2;
  const tt = terms(idx);
  const sum = tt.reduce((s, [w, x]) => s + w * x, 0);
  const c = f.c;
  // the type at the legibility floor; the plate is sized from it (the 'max(0, ' prefix is always reserved, so the
  // plate does not jump when the worked cell replaces the shuttered one) and kept inside the right safe edge
  const size = legibleSize(c, `500 20px ${MFONT.mono}`, 20);
  c.save();
  c.font = `500 ${size}px ${MFONT.mono}`;
  const cw0 = c.measureText('0').width;
  c.restore();
  const w = Math.round(cw0 * (7 + 33 + 4.8) + 60);
  const rowH = Math.round(size * 1.55);
  const h = Math.round(46 + 2 * rowH + size * 2.4);
  // in the dead middle of the frame, below the wall and right of the stencil (never over a wall cell)
  const x0 = Math.round(708 - w / 2), y0 = 600 - h;
  // the swap: the plate turns over (fades) for the worked cell
  const swap = worked ? win(t, b.worked - 0.05, b.worked + 0.2) : 1;
  const out = !worked ? 1 - win(t, b.worked - 0.25, b.worked - 0.05) : 1;
  c.save();
  c.globalAlpha = showA * Math.min(swap, out);
  parchmentPlate(c, { x: x0, y: y0, w, h, seed: worked ? 87 : 86, ornament: false }, { pxScale: c.getTransform().a || 1 } as PaintEnv);
  const ink = PARCH.ink;
  c.font = `500 ${size}px ${MFONT.mono}`;
  c.textBaseline = 'alphabetic';
  const cw = c.measureText('0').width;
  // columns: "max(0, " prefix (worked only), then three terms per row
  const pre = worked ? 'max(0, ' : '';
  const termW = 11 * cw;
  const gx = x0 + 30 + pre.length * cw;
  const tq = tq12(t);
  for (let q = 0; q < 9; q++) {
    const appear = clamp01((tq - t0 - q * 0.1) / 0.1);
    if (appear <= 0) continue;
    const [kw, xv] = tt[q];
    const i = q % 3, j = Math.floor(q / 3);
    const s = `(${fmt(kw)})(${fmt(xv)})`;
    const yy = y0 + 46 + j * rowH;
    const xx = gx + i * (termW + 2.4 * cw);
    c.globalAlpha = showA * Math.min(swap, out) * appear * (kw === 0 ? 0.62 : 1);
    c.fillStyle = ink;
    c.fillText(s, xx, yy);
    c.globalAlpha = showA * Math.min(swap, out) * appear;
    if (i > 0) c.fillText('+', xx - 1.7 * cw, yy);
    else if (j > 0) c.fillText('+', xx - 1.7 * cw, yy);
  }
  if (worked) {
    c.globalAlpha = showA * swap * clamp01((tq - t0) / 0.1);
    c.fillStyle = ink;
    c.fillText(pre, x0 + 30, y0 + 46);
  }
  // the sum
  const sa = clamp01((tq - t0 - 1.0) / 0.15);
  if (sa > 0) {
    c.globalAlpha = showA * Math.min(swap, out) * sa;
    c.fillStyle = ink;
    const res = worked ? `) = ${fmt(Math.max(0, sum))}` : `= ${fmt(sum)}`;
    c.font = `600 ${size + 2}px ${MFONT.mono}`;
    c.textAlign = 'right';
    c.fillText(res, x0 + w - 28, y0 + h - 22);
    c.textAlign = 'left';
  }
  c.restore();
}

// ================================================================================================= THE THEATRE
function theatreBack(f: Frame) {
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/L2/${env.mood.id}`, 2600, 1700, (g) => {
      g.translate(700, 500);
      const wallC = mixLab(env.fill('set'), env.mood.fg, 0.3);
      // the backcloth: a dark wall with a broad lit arch (the stage's own light)
      g.fillStyle = wallC;
      g.fillRect(-700, -500, 2600, 1700);
      const arch = new Path2D();
      arch.moveTo(150, 640);
      arch.lineTo(150, 150);
      arch.quadraticCurveTo(150, -40, 640, -60);
      arch.quadraticCurveTo(1130, -40, 1130, 150);
      arch.lineTo(1130, 640);
      arch.closePath();
      const gr = g.createRadialGradient(660, 380, 40, 660, 380, 700);
      gr.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.25), 0.8));
      gr.addColorStop(1, withAlpha(wallC, 0));
      g.fillStyle = gr;
      g.fill(arch);
      g.strokeStyle = withAlpha(env.mood.rim, 0.12);
      g.lineWidth = 2;
      g.stroke(arch);
    })(c, -700, -500);
  });
  f.layer('L3', (c, env) => {
    // the theatre's wings: two flats at the sides, a valance along the top
    c.fillStyle = env.fill('ink');
    c.fillRect(-420, -300, 420, 1300);
    c.fillRect(1280, -300, 420, 1300);
    c.beginPath();
    c.moveTo(-420, -300);
    c.lineTo(1700, -300);
    c.lineTo(1700, 20);
    for (let x = 1700; x >= -420; x -= 60) c.quadraticCurveTo(x - 30, 46, x - 60, 20);
    c.closePath();
    c.fill();
  });
}
