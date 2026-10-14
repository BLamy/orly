/**
 * ch10-s07 — why halve? (serverCyan hall; 20.0 s; cut in from the worked example). The same plate under the same
 * lamp (warm pool, cool corners) widens into two panels, each with the same jug and three of s06's cups (same width;
 * the share etched under the rim, as s06 does). All shares are the real softmax:
 *
 *   LEFT  unscaled      scores 8 · 0 · −8     → 1.00 · 0.00 · 0.00   (all the light slams into one cup)
 *   RIGHT ÷ 8 = √64     scores 1 · 0 · −1     → 0.67 · 0.24 · 0.09   (it pours softly)
 *
 *   0                 exactly ch10-s06's last frame (slips with mirrors and notes, full cups and their words, meter)
 *   'Why'             all of it clears except s06's recipe line, which inks up, rises to the middle and grows: the
 *                     promise returned to; on 'halve' its '÷ √4' is circled in oxblood
 *   'cards'           the recipe shrinks away; UNSCALED and the divider ink in
 *   'sixty-four'      the card of sixty-four numbers STAMPS in and fills cell by cell (tick lengths = values)
 *   'scores'/'swing'  the left scores ink and rock wildly on twos, settling at 8 · 0 · −8
 *   'tips'            the left jug slams everything into the first cup (1.00 · 0.00 · 0.00 etched)
 *   'freezes'         a ≈ 4% push on the left panel; arrows wither to dots, frost crusts the rims; 'learning freezes'
 *   'Divide'/'eight'  the right scores are struck and rewritten 1 · 0 · −1
 *   'pours softly'    the right jug pours into all three cups; the arrows there live and move
 *   'eight'…          the formula inks along the bottom (raised clear of the caption band); √dₖ circled on 'square'
 *   'toy'             the right panel's card and struck scores leave; the toy plate slides into that corner with
 *                     the same recipe line, '÷ √4' circled with room to spare
 * Camera: s06's end camera, settling on the whole plate with a slow ≈ 2.5% drift in, one push on 'freezes'.
 * Depth: hazed hall, the plate (L4), near timber posts left and right (L5, blurred) through the whole shot.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { MOODS, defineShot, mixLab, withAlpha } from '../../../film';
import { hash1 } from '../../../film/silhouette/atmosphere';
import { glow, parchmentPlate } from '../../../film/silhouette/metaphors/kit';
import {
  INK,
  INK_FAINT,
  OXBLOOD,
  P,
  bankMeter,
  clamp01,
  glassCup,
  gradArrow,
  hallBackdrop,
  ink,
  inkCircle,
  jug,
  kMirror,
  lampShade,
  lampWash,
  lerp,
  lightStream,
  mirrorLoop,
  nearPost,
  plateCords,
  qLantern,
  slipWidth,
  sm,
  softmax,
  tq12,
  vNote,
  win,
  wordSlip,
} from '../sets/ch10-s06-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s07';
const CY = MOODS.serverCyan;
const LIGHT = mixLab(CY.halo, CY.core, 0.35);
const CORE = mixLab(CY.core, '#ffffff', 0.3);

const RAW = [8, 0, -8];
const SOFT = RAW.map((v) => v / 8);
const SH_L = softmax(RAW); // 1.00 0.00 0.00
const SH_R = softmax(SOFT); // 0.67 0.24 0.09
const fmt = (v: number) => (v < 0 ? `−${Math.abs(v)}` : String(v));

const PLATE = { x: 70, y: 34, w: 1140, h: 636 };
/** ch10-s06's plate (same plate, same seed): the shot opens on it and it widens into PLATE on 'Why' */
const PLATE0 = { x: 110, y: 30, w: 1060, h: 600 };
const S06 = { X: [372, 545, 718, 891], words: ['crossed', 'the', 'river', 'bank'], shares: [0.2, 0.07, 0.53, 0.2] };
const PANEL = [355, 925];
const CUPDX = 118;
/** the cups are ch10-s06's cups (same width; the share etched just under the rim, as s06 does) */
const CUP = { y: 440, h: 100, w: 76 };
const Y = { head: 100, card: 122, scores: 270, arrows: 486, formula: 582 };
/** the 64 numbers on a card: a seeded, fixed set of values in -1..1 */
const CARD = Array.from({ length: 64 }, (_, k) => hash1(k, 6401) * 2 - 1);

interface B {
  D: number;
  why: number;
  halve: number;
  cards: number;
  sixty: number;
  scores: number;
  swing: number;
  jug: number;
  tips: number;
  learning: number;
  freezes: number;
  divide: number;
  eight: number;
  root: number;
  pours: number;
  softly: number;
  toy: number;
  halved: number;
  pourR: [number, number][];
}

/**
 * CAM_A = ch10-s06's end camera, so the cut is invisible; the plate widens to CAM_B and the camera then only drifts
 * (≈ 2.5% over the shot), with one push of ≈ 4% on the frozen left panel at 'freezes' (zoom about the left panel's
 * centre, so it stays put on screen while it grows), released before 'Divide'.
 */
const CAM_A: Camera3 = { x: 652, y: 316, z: 44, lens: 1 };
const CAM_B: Camera3 = { x: 640, y: 350, z: 8, lens: 1 };
const CAM_D: Camera3 = { x: 642, y: 346, z: 34, lens: 1 };
const CAM_F: Camera3 = { x: 627, y: 336, z: 60, lens: 1 };
const CAMS = [CAM_A, CAM_B, CAM_D, CAM_F];
const mixCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: 1 });
function camAt(t: number, b: B): Camera3 {
  // the plate widens on 'Why'; then a slow drift in over the whole shot
  let c = mixCam(CAM_A, CAM_B, sm(t / (b.why + 1.2)));
  const drift = sm((t - b.why - 1.2) / (b.D - b.why - 1.2));
  c = mixCam(c, CAM_D, drift);
  // the push on 'freezes': in over 0.7 s, held through the frost, out again by 'Divide'
  const push = win(t, b.freezes - 0.25, b.freezes + 0.45) * (1 - win(t, b.freezes + 0.95, b.divide + 0.35));
  return mixCam(c, { ...CAM_F, z: CAM_F.z + 26 * drift }, sm(push));
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const pours = T.word('L1017', 'pours');
    const p0 = pours - 0.15;
    const pourR: [number, number][] = [];
    let at = p0;
    for (let i = 0; i < 3; i++) {
      const d = Math.max(0.22, 1.25 * SH_R[i]);
      pourR.push([at, at + d]);
      at += d + 0.12;
    }
    const b: B = {
      D: T.duration,
      why: T.word('L1015', 'Why'),
      halve: T.word('L1015', 'halve'),
      cards: T.word('L1015', 'cards'),
      sixty: T.word('L1015', 'sixty-four'),
      scores: T.word('L1015', 'scores'),
      swing: T.word('L1015', 'swing'),
      jug: T.word('L1016', 'jug'),
      tips: T.beat('slam'),
      learning: T.word('L1016', 'learning'),
      freezes: T.beat('freeze'),
      divide: T.word('L1017', 'Divide'),
      eight: T.beat('soft'),
      root: T.word('L1017', 'square'),
      pours,
      softly: T.word('L1017', 'softly'),
      toy: T.beat('callback'),
      halved: T.word('L1017', 'halved'),
      pourR,
    };
    tl.hold(0, b.D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    f.camera(camAt(t, b));
    f.backlight({ sunX: 640, sunY: 430, sunRadius: 560, intensity: 0.75 });
    hallBackdrop(f, ID, CAMS, { beamY: -10, dim: 0.12 });
    f.layer('L4', (c, env) => {
      // the s06 plate widens into the two-panel plate on 'Why' (the same cached plate, stretched by transform)
      const u = sm(win(t, b.why - 0.1, b.why + 0.8));
      const r = { x: lerp(PLATE0.x, PLATE.x, u), y: lerp(PLATE0.y, PLATE.y, u), w: lerp(PLATE0.w, PLATE.w, u), h: lerp(PLATE0.h, PLATE.h, u) };
      plateCords(c, r, env, -400);
      c.save();
      c.translate(r.x, r.y);
      c.scale(r.w / PLATE0.w, r.h / PLATE0.h);
      parchmentPlate(c, { x: 0, y: 0, w: PLATE0.w, h: PLATE0.h, seed: 1006 }, env);
      c.restore();
      lampWash(c, r, 640, 1);
      ghostS06(c, t, b, env);
      promise(c, t, b);
      plate(c, t, b, env);
    });
    f.practical({ x: 640, y: 10, kind: 'lamp', seed: 1006, intensity: 0.72, radius: 64, layer: 'L4' });
    // (ch10-s06's lamp shade, hung just above frame: the lamp's light falls on the plate)
    lampShade(f, ID, CAMS, 640, -93);
    // the hall's near post on the right (L5, blurred), the same post that stands by ch10-s06's plate
    nearPost(f, ID, CAMS, 1215, -1, 40, 24, 30);
    nearPost(f, `${ID}-l`, CAMS, 26, 1, 40, 60, 150);
  },
});

/** ch10-s06's end state on the plate at the cut (so the cut is invisible): its slips (bank tinted) with s05's mirrors,
 *  sealed notes and bank's lantern, the full etched cups with their words and messages, the stamped ILLUSTRATIVE tag,
 *  the faint recipe line and the meter. Everything fades on 'Why' except the recipe line: see promise(). */
const S06L = { slipY: 112, railY: 66, cupY: 500, cupH: 100, half: 534, word: 566 };
function ghostS06(c: C, t: number, b: B, env: PaintEnv) {
  const a = 1 - win(t, b.why - 0.2, b.why + 0.45);
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = INK;
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(S06.X[0] - 130, S06L.railY);
  c.lineTo(S06.X[3] + 26, S06L.railY);
  c.stroke();
  c.fillStyle = INK;
  for (const x of [S06.X[0] - 130, S06.X[3] + 26]) {
    c.beginPath();
    c.arc(x, S06L.railY, 4.5, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  const names = ['action', '', 'water', 'money'];
  for (let i = 0; i < 4; i++) {
    const w = slipWidth(S06.words[i], 30);
    const mx = S06.X[i] - w / 2 - 32;
    const my = S06L.slipY + 44;
    c.save();
    c.globalAlpha *= a;
    c.strokeStyle = mixLab(INK, P.sky[1], 0.15);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(mx, S06L.railY);
    c.lineTo(mx, my - mirrorLoop(1.5));
    c.stroke();
    c.restore();
    kMirror(c, mx, my, 0, 1.5, a, INK, env);
    wordSlip(c, { x: S06.X[i], y: S06L.slipY, cord: 44, text: S06.words[i], size: 30, h: 60, alpha: a, tint: i === 3 ? 1 : 0, lit: i === 3 ? 0.3 : 0 });
    const nx = S06.X[i] + w / 2 - 20;
    c.save();
    c.globalAlpha *= a;
    c.strokeStyle = mixLab(INK, P.sky[1], 0.15);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(nx, S06L.slipY + 54);
    c.lineTo(nx, S06L.slipY + 80 - 10.5);
    c.stroke();
    c.restore();
    vNote(c, nx, S06L.slipY + 80, 0.62, a, 0.03, env);
    glassCup(c, { x: S06.X[i], y: S06L.cupY, w: 72, h: S06L.cupH, level: S06.shares[i] / 0.8, light: LIGHT, core: CORE, alpha: a, etch: S06.shares[i].toFixed(2), etchSize: 22, etchY: 0.82, etchLegible: true });
    if (names[i]) ink(c, names[i], S06.X[i], S06L.half, { italic: true, size: 24, align: 'center', color: mixLab(INK, P.sky[1], 0.3), alpha: a, legible: true });
    // (s06 leaves river's word faintly lit under its cup)
    if (i === 2) glow(c, S06.X[i], S06L.word - 9, 52, P.halo, 0.2 * a);
    ink(c, S06.words[i], S06.X[i], S06L.word, { size: 26, weight: i === 2 ? 600 : 500, align: 'center', color: INK, alpha: a * (i === 2 ? 0.89 : 0.82), legible: true });
  }
  {
    const tx = PLATE0.x + PLATE0.w - 44;
    const tw = ink(c, 'ILLUSTRATIVE', tx, S06L.word, { font: 'sc', size: 20, weight: 600, tracking: 2.5, align: 'right', color: mixLab(INK, P.sky[1], 0.3), alpha: a, legible: true });
    c.save();
    c.globalAlpha *= a * 0.55;
    c.strokeStyle = mixLab(INK, P.sky[1], 0.3);
    c.lineWidth = 1.2;
    c.strokeRect(tx - tw - 10, S06L.word - 24, tw + 18, 33);
    c.restore();
  }
  // bank's lantern on its wire arm (s06's end state: risen, lit)
  const bw = slipWidth('bank', 30);
  const lx = S06.X[3] + bw / 2 + 17;
  const ly = 96;
  const ax = S06.X[3] + bw / 2 - 3;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = INK;
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(ax, 115);
  c.lineTo(ax, ly - 26);
  c.quadraticCurveTo(ax, ly - 32, ax + 6, ly - 32);
  c.lineTo(lx, ly - 32);
  c.stroke();
  c.restore();
  qLantern(c, lx, ly, 0.95, env, 1.3, a);
  bankMeter(c, 984, 238, a, 1, [
    ['water', S06.shares[2]],
    ['action', S06.shares[0]],
    ['money', S06.shares[3]],
  ]);
}

/**
 * The promise returned to: ch10-s06's recipe line (faint at the cut, where s06 left it) inks up to full strength on
 * 'Why', rises and grows to the middle of the plate; on 'halve' its '÷ √4' is circled in oxblood; on 'cards' it
 * shrinks away toward the top-right corner (where it comes back as the toy plate on 'toy').
 */
/**
 * ch10-s06's recipe line set in three pieces with clear gaps, so a circle round '÷ √4' (drawn `circ` 0..1) never
 * touches the 2 before it or the arrow after it. Centred on x.
 */
function recipeLine(c: C, x: number, y: number, size: number, a: number, circ: number, open = 1) {
  const L = '2 · 0 · 4 · 2';
  const M = '÷ √4';
  const R = '→   1 · 0 · 2 · 1';
  const o = { italic: true, size, color: INK, alpha: 0 } as const;
  const wl = ink(c, L, 0, 0, o);
  const wm = ink(c, M, 0, 0, o);
  const wr = ink(c, R, 0, 0, o);
  // open 0 = ch10-s06's own spacing (three spaces), 1 = room for the circle
  const gap = lerp(ink(c, '   ', 0, 0, o), size * 1.25, open);
  const x0 = x - (wl + wm + wr + 2 * gap) / 2;
  ink(c, L, x0, y, { ...o, alpha: a });
  ink(c, M, x0 + wl + gap, y, { ...o, alpha: a });
  ink(c, R, x0 + wl + wm + 2 * gap, y, { ...o, alpha: a });
  if (circ > 0.003) {
    c.save();
    c.globalAlpha *= Math.min(1, a * 1.5);
    inkCircle(c, x0 + wl + gap + wm / 2, y - size * 0.3, wm / 2 + size * 0.55, size * 0.74, circ, OXBLOOD, Math.max(1.8, size * 0.055));
    c.restore();
  }
}
function promise(c: C, t: number, b: B) {
  const up = sm(win(t, b.why - 0.1, b.why + 0.6));
  const away = sm(win(t, b.cards - 0.1, b.cards + 0.5));
  const a = lerp(0.22, 1, up) * (1 - away);
  if (a <= 0.003) return;
  const x = lerp(lerp((S06.X[0] + S06.X[3]) / 2, 640, up), 1010, away);
  const y = lerp(lerp(280, 300, up), 160, away);
  const size = lerp(lerp(28, 44, up), 24, away);
  recipeLine(c, x, y, size, a, win(t, b.halve - 0.1, b.halve + 0.45) * (1 - away), up);
}

// ================================================================================================= the plate
function plate(c: C, t: number, b: B, _env: PaintEnv) {
  const tq = tq12(t);
  // ---------------------------------------------------------------- the divider and the panel heads
  const div = win(t, b.cards - 0.1, b.cards + 0.8);
  if (div > 0) {
    c.save();
    c.strokeStyle = withAlpha(INK, 0.55);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(640, PLATE.y + 40);
    c.lineTo(640, PLATE.y + 40 + (Y.formula - 46 - PLATE.y - 40) * div);
    c.stroke();
    c.restore();
  }
  const HEAD = mixLab(INK, P.sky[1], 0.2);
  ink(c, 'UNSCALED', PANEL[0], Y.head, { font: 'sc', size: 30, weight: 600, tracking: 3, align: 'center', color: HEAD, alpha: win(t, b.cards - 0.1, b.cards + 0.4) });
  ink(c, '÷ 8   ( 8 = √64 )', PANEL[1], Y.head + 2, { size: 32, weight: 500, align: 'center', color: HEAD, alpha: win(t, b.divide - 0.1, b.divide + 0.5) });

  for (let side = 0; side < 2; side++) {
    const cx = PANEL[side];
    const right = side === 1;
    // ---------------------------------------------------------------- a card of sixty-four numbers
    // the left card STAMPS in on 'sixty-four' (a quick drop from 1.18× with a hard landing), filling as it lands; the
    // right panel's card leaves entirely as the toy plate slides into that corner
    const cardIn = right ? win(t, b.divide - 0.4, b.divide + 0.1) : win(t, b.sixty - 0.18, b.sixty - 0.02);
    const stamp = right ? 1 : lerp(1.18, 1, sm(win(tq, b.sixty - 0.18, b.sixty + 0.02)));
    const cells = right ? 1 : clamp01((tq - b.sixty + 0.05) / 0.55);
    const cardFade = right ? 1 - win(t, b.toy - 0.6, b.toy - 0.15) : 1;
    c.save();
    c.translate(cx - 124, Y.card + 46);
    c.scale(stamp, stamp);
    c.translate(-(cx - 124), -(Y.card + 46));
    card(c, cx - 170, Y.card, cardIn * cardFade, cells);
    c.restore();
    const NOTE = mixLab(INK, P.sky[1], 0.3);
    ink(c, '64 numbers', cx - 62, Y.card + 40, { italic: true, size: 27, color: NOTE, alpha: cardIn * cardFade * win(t, b.sixty + 0.05, b.sixty + 0.4), legible: true });
    ink(c, 'on every card', cx - 62, Y.card + 72, { italic: true, size: 27, color: NOTE, alpha: cardIn * cardFade * win(t, b.sixty + 0.2, b.sixty + 0.6), legible: true });

    // ---------------------------------------------------------------- the scores
    const sA = right ? win(t, b.divide - 0.2, b.divide + 0.3) : win(t, b.scores - 0.1, b.scores + 0.3);
    if (sA > 0) {
      for (let i = 0; i < 3; i++) {
        const x = cx - CUPDX + i * CUPDX;
        // swing wildly: on twos the left numbers jump between big values, settling on their own
        // 'swing wildly': the same 8 · 0 · −8 from the start (the values never change); on 'swing' the big ones rock
        // hard on twos, pulled far from 0 like a pendulum, and settle
        const txt = fmt(RAW[i]);
        let dy = 0;
        let rock = 0;
        if (!right) {
          const env = win(t, b.swing - 0.15, b.swing + 0.05) * (1 - win(t, b.swing + 0.6, b.swing + 1.5));
          const k = Math.floor(tq * 12);
          const amp = RAW[i] === 0 ? 0.25 : 1;
          dy = (hash1(k * 3 + i, 5151) - 0.5) * 14 * env * amp;
          rock = Math.sin(tq * 15 + i * 2.1) * 0.22 * env * amp;
        }
        const struck = right ? win(t, b.eight - 0.5, b.eight - 0.2) : 0;
        const rewritten = right ? win(t, b.eight - 0.15, b.eight + 0.25) : 0;
        {
          c.save();
          c.translate(x, Y.scores - 24);
          c.rotate(rock);
          c.translate(-x, -(Y.scores - 24));
          ink(c, txt, x, Y.scores - 12 + dy - (right ? 26 * rewritten : 0), {
            font: 'mono',
            size: right ? lerp(40, 26, rewritten) : 40,
            weight: 600,
            align: 'center',
            alpha: sA * (right ? lerp(1, 0.55, rewritten) * (1 - win(t, b.toy - 0.7, b.toy - 0.3)) : 1),
            color: right && rewritten > 0 ? mixLab(INK, P.sky[2], 0.35 * rewritten) : INK,
          });
          c.restore();
        }
        if (struck > 0) {
          c.save();
          c.globalAlpha *= 1 - win(t, b.toy - 0.7, b.toy - 0.3);
          c.strokeStyle = OXBLOOD;
          c.lineWidth = 2.4;
          c.lineCap = 'round';
          const yy = Y.scores - 24 - 26 * rewritten;
          c.beginPath();
          c.moveTo(x - 22, yy + 4);
          c.lineTo(x - 22 + 44 * struck, yy - 6);
          c.stroke();
          c.restore();
        }
        if (rewritten > 0) ink(c, fmt(SOFT[i]), x, Y.scores + 22, { font: 'mono', size: 40, weight: 600, align: 'center', alpha: rewritten, draw: rewritten });
        if (i < 2) ink(c, '·', x + CUPDX / 2, Y.scores - 14, { size: 30, align: 'center', color: INK_FAINT, alpha: sA * 0.7 });
      }
    }

    // ---------------------------------------------------------------- cups, arrows, frost
    const cupsA = right ? win(t, b.divide - 0.2, b.divide + 0.4) : win(t, b.scores, b.scores + 0.6);
    for (let i = 0; i < 3; i++) {
      const x = cx - CUPDX + i * CUPDX;
      let level = 0;
      let etchA = 0;
      if (!right) {
        const slam = clamp01((t - b.tips - 0.05) / 0.3);
        level = 0.95 * SH_L[i] * sm(slam);
        etchA = win(t, b.tips + 0.4, b.tips + 0.8);
      } else {
        const [a0, a1] = b.pourR[i];
        level = 0.95 * SH_R[i] * sm(clamp01((t - a0 - 0.08) / (a1 - a0)));
        etchA = win(t, b.pourR[i][1], b.pourR[i][1] + 0.4);
      }
      const frost = right ? 0 : win(t, b.freezes - 0.15, b.freezes + 0.6);
      glassCup(c, {
        x,
        y: CUP.y,
        w: CUP.w,
        h: CUP.h,
        level,
        light: frost > 0 ? mixLab(LIGHT, '#dfeff2', 0.5 * frost) : LIGHT,
        core: CORE,
        alpha: cupsA,
        etch: (right ? SH_R[i] : SH_L[i]).toFixed(2),
        etchAlpha: etchA,
        etchSize: 22,
        etchY: 0.82,
        etchLegible: true,
        frost,
        chill: frost,
        glowK: right ? 1 : 1 - 0.6 * frost,
      });
      // the learning arrows: alive (oscillating) or withered
      const live = right ? win(t, b.softly - 0.2, b.softly + 0.5) : 1 - win(t, b.learning, b.freezes + 0.3);
      const aA = cupsA * (right ? live : Math.max(live, 0));
      if (aA > 0.01) {
        for (let k = 0; k < 3; k++) {
          const ax = x - 20 + k * 20;
          const ph = tq * (2.4 + 0.5 * k) + i * 1.7 + k * 2.1;
          const len = (30 + 12 * Math.sin(ph)) * (right ? 1 : 0.4 + 0.6 * live) * (k === 1 ? -1 : 1);
          // alive and moving: after 'pours' the right panel's arrows bob slowly (on twos)
          const bob = right ? 4 * Math.sin(tq * 2.2 + k * 1.9 + i) * win(t, b.pours, b.pours + 0.6) : 0;
          gradArrow(c, ax, Y.arrows + 10 + bob + (len < 0 ? -44 : 0), len, aA * 0.9, OXBLOOD, 1.8);
        }
      }
      if (!right) {
        // the withered stubs: three small dots where the arrows were
        const dead = win(t, b.freezes - 0.2, b.freezes + 0.4) * cupsA;
        if (dead > 0) {
          c.save();
          c.fillStyle = withAlpha(OXBLOOD, 0.4 * dead);
          for (let k = 0; k < 3; k++) {
            c.beginPath();
            c.arc(x - 20 + k * 20, Y.arrows - 4, 2.8, 0, Math.PI * 2);
            c.fill();
          }
          c.restore();
        }
      }
    }
    // 'learning freezes' is L1016's punchline: large, in the oxblood thread colour
    ink(c, right ? 'learning flows' : 'learning freezes', cx, Y.arrows + 44, {
      italic: true,
      size: right ? 28 : 31,
      weight: right ? 500 : 600,
      align: 'center',
      color: OXBLOOD,
      alpha: right ? win(t, b.softly, b.softly + 0.5) : win(t, b.freezes, b.freezes + 0.5),
      legible: true,
    });

    // ---------------------------------------------------------------- the jug
    if (!right) {
      const a = win(tq, b.jug - 0.35, b.jug) * (1 - win(tq, b.tips + 1.0, b.tips + 1.5));
      const tilt = 0.1 + 1.25 * sm((tq - b.tips + 0.04) / 0.16) - 1.1 * sm((tq - b.tips - 0.55) / 0.3);
      const flow = win(t, b.tips, b.tips + 0.06) * (1 - win(t, b.tips + 0.38, b.tips + 0.5));
      jugAt(c, cx - CUPDX, tilt, a, flow, 0, 9);
    } else {
      const a = win(tq, b.pours - 0.7, b.pours - 0.3) * (1 - win(tq, b.pourR[2][1] + 0.4, b.pourR[2][1] + 0.9));
      let tx = cx - CUPDX;
      let tilt = 0.1;
      let pouring = -1;
      for (let i = 0; i < 3; i++) {
        const [a0, a1] = b.pourR[i];
        const prevEnd = i ? b.pourR[i - 1][1] : b.pours - 0.3;
        if (tq >= prevEnd) tx = lerp(i ? cx - CUPDX + (i - 1) * CUPDX : cx - CUPDX, cx - CUPDX + i * CUPDX, sm((tq - prevEnd) / Math.max(0.1, a0 - prevEnd)));
        if (tq >= a0 - 0.08 && tq <= a1 + 0.05) pouring = i;
      }
      if (pouring >= 0) {
        const [a0, a1] = b.pourR[pouring];
        tilt = 0.1 + 0.85 * (sm((tq - a0 + 0.08) / 0.16) - sm((tq - a1) / 0.16));
      }
      const flow = pouring >= 0 ? win(t, b.pourR[pouring][0], b.pourR[pouring][0] + 0.1) * (1 - win(t, b.pourR[pouring][1] - 0.05, b.pourR[pouring][1] + 0.08)) : 0;
      jugAt(c, tx, tilt, a, flow, pouring >= 0 ? SH_R[pouring] : 0, 0, pouring >= 0 ? tx : 0);
    }
  }

  // ---------------------------------------------------------------- the formula along the bottom
  const fA = win(t, b.eight + 0.2, b.eight + 1.4);
  if (fA > 0) formula(c, 640, Y.formula, fA, win(t, b.root - 0.1, b.root + 0.6));

  // ---------------------------------------------------------------- the toy plate slides in at the corner
  // (into the right panel's top corner, which its own 64-number card has just left)
  const toyA = win(t, b.toy - 0.45, b.toy + 0.15);
  if (toyA > 0) {
    const TW = 420;
    const x = lerp(PLATE.x + PLATE.w + 40, PLATE.x + PLATE.w - TW - 22, sm(toyA));
    const y = Y.card - 4;
    c.save();
    c.globalAlpha *= Math.min(1, toyA * 2);
    c.shadowColor = 'rgba(0,0,0,0.35)';
    c.shadowBlur = 10;
    c.shadowOffsetY = 3;
    c.fillStyle = mixLab(P.sky[1], P.halo, 0.12);
    c.fillRect(x, y, TW, 104);
    c.shadowColor = 'transparent';
    c.strokeStyle = withAlpha(INK, 0.6);
    c.lineWidth = 1;
    c.strokeRect(x + 6, y + 6, TW - 12, 92);
    c.restore();
    ink(c, 'our toy · 4 numbers', x + TW / 2, y + 34, { italic: true, size: 24, align: 'center', color: mixLab(INK, P.sky[1], 0.3), alpha: toyA, legible: true });
    recipeLine(c, x + TW / 2, y + 78, 24, toyA, win(t, b.toy + 0.3, b.toy + 0.9));
  }
}

/** a card of 64 numbers: an 8 × 8 grid of ticks whose length is the value; `cells` 0..1 fills it */
function card(c: C, x: number, y: number, a: number, cells: number) {
  if (a <= 0.003) return;
  const S = 92;
  const cell = S / 8;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = mixLab(P.sky[1], P.halo, 0.12);
  c.fillRect(x, y, S, S);
  c.strokeStyle = withAlpha(INK, 0.7);
  c.lineWidth = 1.1;
  c.strokeRect(x, y, S, S);
  const n = Math.floor(cells * 64 + 1e-6);
  c.lineWidth = 1.6;
  for (let k = 0; k < n; k++) {
    const r = Math.floor(k / 8);
    const q = k % 8;
    const v = CARD[k];
    const cx = x + (q + 0.5) * cell;
    const cy = y + (r + 0.5) * cell;
    c.strokeStyle = v >= 0 ? INK : OXBLOOD;
    c.beginPath();
    c.moveTo(cx - cell * 0.42 * Math.abs(v), cy);
    c.lineTo(cx + cell * 0.42 * Math.abs(v), cy);
    c.stroke();
  }
  c.restore();
}

/** place the jug so its lip sits above cup-x `x`, tilt, alpha; stream of light into the cup below while `flow` */
function jugAt(c: C, x: number, tilt: number, a: number, flow: number, share: number, slamW = 0, _sx = 0) {
  if (a <= 0.003) return;
  const S = 1.05;
  const lipY = CUP.y - CUP.h - 24;
  const l0 = jug(c, 0, 0, tilt, S, LIGHT, CORE, 0, 0);
  const lip = jug(c, x + 2 - l0.lipX, lipY - l0.lipY, tilt, S, LIGHT, CORE, 0.9 - 0.5 * share, a);
  if (flow > 0.01) {
    const w = slamW || 2 + 9 * share;
    lightStream(c, [{ x: lip.lipX, y: lip.lipY }, { x: lip.lipX - 3, y: lip.lipY + 12 }, { x: x - 2, y: CUP.y - 8 }], w, LIGHT, CORE, flow * a);
  }
}

/** Attention(Q, K, V) = softmax( QKᵀ / √dₖ ) V — set piece by piece (manual super/subscripts), √dₖ circled */
function formula(c: C, cx: number, y: number, a: number, circ: number) {
  const size = 34;
  type Seg = { s: string; dy?: number; sz?: number; italic?: boolean };
  const segs: Seg[] = [
    { s: 'Attention(', italic: false },
    { s: 'Q', italic: true },
    { s: ', ', italic: false },
    { s: 'K', italic: true },
    { s: ', ', italic: false },
    { s: 'V', italic: true },
    { s: ')  =  softmax( ', italic: false },
    { s: 'QK', italic: true },
    { s: 'T', italic: true, dy: -14, sz: 21 },
    { s: '  /  ', italic: false },
    { s: '√', italic: false },
    { s: 'd', italic: true },
    { s: 'k', italic: true, dy: 8, sz: 21 },
    { s: '  )  ', italic: false },
    { s: 'V', italic: true },
  ];
  c.save();
  const fontOf = (g: Seg) => `${g.italic ? 'italic ' : ''}500 ${g.sz ?? size}px "EB Garamond"`;
  const widths = segs.map((g) => {
    c.font = fontOf(g);
    return c.measureText(g.s).width;
  });
  const total = widths.reduce((p, q) => p + q, 0);
  let x = cx - total / 2;
  let rootX0 = 0;
  let rootX1 = 0;
  c.globalAlpha *= a;
  c.fillStyle = INK;
  c.textAlign = 'left';
  // draw left → right as the pen writes
  const reveal = cx - total / 2 + (total + 20) * a;
  segs.forEach((g, i) => {
    if (g.s === '√') rootX0 = x;
    if (i === 12) rootX1 = x + widths[i];
    if (x < reveal) {
      c.font = fontOf(g);
      c.fillText(g.s, x, y + (g.dy ?? 0));
    }
    x += widths[i];
  });
  c.restore();
  inkCircle(c, (rootX0 + rootX1) / 2, y - 10, (rootX1 - rootX0) / 2 + 7, 26, circ);
}
