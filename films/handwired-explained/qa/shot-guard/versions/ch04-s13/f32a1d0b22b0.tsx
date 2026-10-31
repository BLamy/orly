/**
 * ch04-s13 — WHAT EXACT MEANS (plate, parchment; cut on motion from the detent; 20.3 s).
 * L0425 "Each trick is exact. Against what? The thirty-two-bit calculation, not JavaScript's usual sixty-four-bit doubles."
 * L0426 "Fit columns in a window seventeen hundred and thirty-two pixels wide. Doubles fit seven; thirty-two-bit floats
 *        fall a hair short."
 *
 * Same plate as ch04-s12 (sets/ch04-s12-plate). It opens on that shot's last frame (the inked ruler and the result
 * line, the camera pushed in) and the ruler ROLLS UP into a tube that lifts out of frame, the result line fading with
 * it, as the camera eases back: the plate beneath is clear.
 *
 * TEACHES, word by word (every number COMPUTED: f = Math.fround, FP32; float64 in plain JS):
 *   'thirty-two-bit' / 'sixty-four-bit'  a strip of 32 ink cells, then a strip of 64 faint grey cells under it (the
 *                 code for the rest of the shot: ink = FP32, grey = float64); they clear before the window
 *   'what'        the definition sets in across the top third, 'exact = equal to the FP32 calculation,' and on 'not'
 *                 ' not float64'; it holds through the shot
 *   'seventeen'   a paper window 1,732 px wide (drawn at 0.46 scale, its 24 px margin hatched) with seven 244 px
 *                 column slots; a dimension line '1,732 px'; column cards drop into slots 1-6 one by one; the ledger
 *                 works the calculation in ink, the reciprocal's rounding first: 'f(1/244)', then 'f(f(1732 − 24) × …)'
 *   'seven'       the float64 tally (a faint grey bar) runs to the 7 mark; a faint grey ghost card stands in slot 7;
 *                 the ledger adds '· float64: 7'; a loupe opens on the 7 mark
 *   'thirty-two-bit floats' the FP32 tally (ink) runs out to the 7 mark …
 *   'hair'        … and stops a hair short (the loupe shows the gap); ' = 6.999999523162842' inks; the seventh card
 *                 hovers at the window's edge and does not enter; a slip under it: 'columns ≥ 7: 0'
 * Camera: eases back from ch04-s12's push (0-2.4 s), then a slow push (about 5 %) toward the hovering card and the
 * loupe from 'seven' to the end.
 *
 * Review r1: the dark 32-cell strip comes in on 'exact' (no dead air after the roll-up), each strip carries its label
 * ('FP32', 'float64'), the 64-cell strip lands on 'sixty-four-bit'; on 'hair' the FP32 result, the check slip and the
 * loupe's stop land together by 18.5 s; the slip is set large with its '0' the single copper accent; the window group
 * sits 80 px further right; every column card is probed.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { CAMERA3_HOME, cardPaperAlpha, cardProbe, defineShot, mixLab, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf } from '../sets/narratorHands';
import { COPPER_INK, INK, PLATE_INK, inkSegments, inkText, plateNear, plateRoom } from '../sets/ch04-s12-plate';

const ID = 'ch04-s13';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const f = Math.fround;

// ---------------------------------------------------------------- the calculation (computed)
const WIN_W = 1732, MARGIN = 24, COL = 244;
const RECIP = f(1 / COL);
const FP32 = f(f(WIN_W - MARGIN) * RECIP); // 6.999999523162842
const F64 = (WIN_W - MARGIN) / COL; // 7
const FITS32 = Math.floor(FP32); // 6
const FITS64 = Math.floor(F64); // 7
const CHECK = FP32 >= 7 ? 1 : 0; // columns ≥ 7 → 0
const commas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------- geometry (plate rest px)
const K = 0.46; // the window is drawn at 0.46 scale: 1,732 px → 797 stage px
const WX0 = 200;
const WX1 = WX0 + WIN_W * K;
const WY0 = 236, WY1 = 392;
const M_W = MARGIN * K;
const SLOT = COL * K;
const slotX = (k: number) => WX0 + M_W + k * SLOT; // left edge of slot k (0-based)
const TALLY_Y = 428;
const LOUPE = { x: 1150, y: 520, r: 86 };
/** ch04-s12's tail: its ruler (8,388,608 … 8,388,611 at 300 px a unit) and its result line (review r1: 60 px lower) */
const R12 = { ry: 382, rh: 124, unit: 300, v: 8388609.5, res: 570, camZ: 62 };

interface Beats {
  def: number;
  not: number;
  window: number;
  cards: number[];
  seven: number;
  fp32: number;
  hair: number;
  b32: number;
  b64: number;
  exact: number;
  /** the hair lands by here: result, slip and the loupe's stop together */
  land: number;
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const w = T.beat('window');
    const b: Beats = {
      def: T.beat('def'),
      not: T.word('L0425', 'not'),
      window: w,
      cards: [0, 1, 2, 3, 4, 5].map((k) => w + 0.5 + k * 0.42),
      seven: T.beat('seven'),
      fp32: T.word('L0426', 'floats'),
      hair: T.beat('hair'),
      b32: T.word('L0425', 'thirty-two-bit'),
      b64: T.word('L0425', 'sixty-four-bit'),
      exact: T.word('L0425', 'exact'),
      land: T.beat('hair') - 0.1,
    };
    tl.hold(0, D);
    return { tl, b, D };
  },
  paint(fr, _s, scene) {
    const t = fr.t;
    const tq = q2(t);
    const b = scene.b;
    const back = sm(t / 2.4);
    const push = win(t, b.seven - 0.3, scene.D);
    const cam: Camera3 = { ...CAMERA3_HOME, x: lerp(650, 640, back) + 90 * push, y: 360 + 40 * push, z: lerp(R12.camZ, 0, back) + 52 * push };
    fr.camera(cam);
    plateRoom(fr, { key: ID });
    fr.layer(PLATE_INK, (c, env) => {
      rollUp(c, env, t);
      definition(c, t, b);
      bitStrips(c, env, t, b);
      windowAndCards(c, env, t, tq, b);
      tally(c, env, t, b);
      loupe(c, env, t, b);
      ledger(c, t, b);
    });
    plateNear(fr, ID);
  },
});

// ---------------------------------------------------------------- the cut on motion: the ruler rolls up and away
function rollUp(c: C, env: PaintEnv, t: number) {
  const u = sm(t / 0.95); // rolled
  const lift = sm((t - 0.85) / 0.7); // the tube lifts away
  if (lift >= 1) return;
  const { ry, rh, unit, v } = R12;
  const visH = rh * (1 - u);
  const tubeY = ry + visH - lift * (ry + visH + 80);
  // the result line of ch04-s12 fades as the ruler goes
  const res = 1 - win(t, 0.05, 0.6);
  if (res > 0) inkText(c, '0.49999997 → 0   ·   0.5 → 8,388,609.5 → 8,388,610 → 1', 640, R12.res, { size: 29, align: 'center', alpha: res, role: 'texture' });
  if (visH > 0.5 && lift <= 0) {
    c.save();
    c.beginPath();
    c.rect(50, ry - 2, 1180, visH + 2);
    c.clip();
    c.fillStyle = mixLab('#f4ead5', env.mood.core, 0.15);
    c.fillRect(60, ry, 1160, rh);
    c.strokeStyle = withAlpha(INK, 0.85);
    c.lineWidth = 1.6;
    c.strokeRect(60, ry, 1160, rh);
    for (let n = 8388608; n <= 8388611; n++) {
      const x = 640 + (n - v) * unit;
      const len = rh * (n % 2 === 0 ? 0.44 : 0.36);
      c.fillStyle = INK;
      c.fillRect(x - 1.8, ry, 3.6, len);
      c.beginPath();
      if (n % 2 === 0) {
        c.arc(x, ry + len + 7, 7, 0, Math.PI * 2);
        c.fill();
      } else {
        c.strokeStyle = INK;
        c.lineWidth = 2.4;
        c.arc(x, ry + len + 7, 6, 0, Math.PI * 2);
        c.stroke();
      }
      inkText(c, commas(n), x, ry + rh - 16, { size: 27, align: 'center', alpha: 0.92, role: 'texture' });
    }
    c.restore();
  }
  // the tube: the rolled strip, a long cylinder with lit top and inked ends
  if (u > 0.02) {
    const r = 6 + 12 * u;
    c.save();
    c.globalAlpha *= 1 - sm((lift - 0.7) / 0.3);
    const g = c.createLinearGradient(0, tubeY - r, 0, tubeY + r);
    g.addColorStop(0, mixLab('#fbf3e2', env.mood.core, 0.3));
    g.addColorStop(0.5, '#e6d6b6');
    g.addColorStop(1, mixLab('#b39a72', INK, 0.25));
    c.fillStyle = g;
    c.fillRect(60, tubeY - r, 1160, 2 * r);
    c.strokeStyle = withAlpha(INK, 0.8);
    c.lineWidth = 1.4;
    c.strokeRect(60, tubeY - r, 1160, 2 * r);
    for (const x of [60, 1220]) {
      c.beginPath();
      c.ellipse(x, tubeY, 4, r, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }
}

// ---------------------------------------------------------------- the definition (top third, holds)
function definition(c: C, t: number, b: Beats) {
  const a1 = win(t, b.def - 0.05, b.def + 0.4);
  if (a1 <= 0) return;
  const a2 = win(t, b.not - 0.05, b.not + 0.35);
  inkSegments(c, [
    { text: 'exact', a: a1, color: mixLab(INK, COPPER_INK, 0.45) },
    { text: ' = equal to the FP32 calculation,', a: a1 },
    { text: ' not float64', a: a2 },
  ], 640, 150, { size: 40, font: 'serif', align: 'center', id: `${ID}/def` });
}

// ---------------------------------------------------------------- the two widths the narration names
/**
 * 'thirty-two-bit': a strip of 32 cells inks (the calculation exactness is measured against); 'sixty-four-bit': a strip
 * of 64 cells in faint grey under it (JavaScript's doubles). The same code carries on below: ink = FP32, grey = float64.
 * They clear as the window comes in.
 */
function bitStrips(c: C, env: PaintEnv, t: number, b: Beats) {
  const out = 1 - win(t, b.window - 0.9, b.window - 0.3);
  if (out <= 0) return;
  const cell = 13;
  const X0 = 300;
  const rows = [
    // the dark 32 strip opens the shot on 'exact' (the calculation exactness is measured against)
    { n: 32, at: b.exact, y: 296, ink: true, label: 'FP32' },
    // the pale 64 strip lands ON 'sixty-four-bit'
    { n: 64, at: b.b64 - 0.35, y: 340, ink: false, label: 'float64' },
  ];
  for (const r of rows) {
    const u = win(t, r.at - 0.1, r.at + 0.45);
    if (u <= 0) continue;
    const shown = Math.ceil(r.n * u);
    c.save();
    c.globalAlpha *= out;
    for (let i = 0; i < shown; i++) {
      const x = X0 + i * cell;
      if (r.ink) {
        c.fillStyle = INK;
        c.fillRect(x + 1, r.y, cell - 2, 24);
      } else {
        c.strokeStyle = withAlpha('#6f6a62', 0.9);
        c.lineWidth = 1.3;
        c.strokeRect(x + 1.5, r.y + 0.5, cell - 3, 23);
        c.fillStyle = withAlpha('#8c877e', 0.42);
        c.fillRect(x + 1.5, r.y + 0.5, cell - 3, 23);
      }
    }
    c.restore();
    // the strip's name, left of it (words from the script's own on-screen text)
    inkText(c, r.label, X0 - 18, r.y + 21, {
      size: 24,
      align: 'right',
      alpha: win(t, r.at - 0.1, r.at + 0.2) * out,
      color: r.ink ? INK : '#5f5a52',
      id: `${ID}/strip-${r.n}`,
    });
  }
  void env;
}

// ---------------------------------------------------------------- the paper window and its column cards
function windowAndCards(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const inAt = b.window - 0.1;
  const paper = cardPaperAlpha(t, inAt, 0.4);
  if (paper <= 0.001) return;
  const ink = win(t, inAt, inAt + 0.35);
  c.save();
  c.globalAlpha *= paper;
  // the window: paper, a title strip, an inked frame
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
  c.fillRect(WX0 + 4, WY0 + 5, WX1 - WX0, WY1 - WY0);
  c.fillStyle = mixLab('#fbf3e2', env.mood.core, 0.2);
  c.fillRect(WX0, WY0, WX1 - WX0, WY1 - WY0);
  c.fillStyle = withAlpha(INK, 0.82);
  c.fillRect(WX0, WY0, WX1 - WX0, 14);
  for (let i = 0; i < 3; i++) {
    c.fillStyle = mixLab('#fbf3e2', env.mood.core, 0.2);
    c.beginPath();
    c.arc(WX0 + 12 + i * 12, WY0 + 7, 3.2, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = INK;
  c.lineWidth = 1.6;
  c.strokeRect(WX0, WY0, WX1 - WX0, WY1 - WY0);
  // the 24 px margin, hatched
  c.save();
  c.beginPath();
  c.rect(WX0, WY0 + 14, M_W, WY1 - WY0 - 14);
  c.clip();
  c.strokeStyle = withAlpha(INK, 0.5);
  c.lineWidth = 1;
  c.beginPath();
  for (let y = WY0; y < WY1 + 20; y += 7) {
    c.moveTo(WX0, y);
    c.lineTo(WX0 + M_W, y - 8);
  }
  c.stroke();
  c.restore();
  // the seven slots, dotted
  c.strokeStyle = withAlpha(INK, 0.3);
  c.setLineDash([3, 4]);
  c.lineWidth = 1;
  for (let k = 1; k < 7; k++) {
    c.beginPath();
    c.moveTo(slotX(k), WY0 + 18);
    c.lineTo(slotX(k), WY1 - 4);
    c.stroke();
  }
  c.setLineDash([]);
  c.globalAlpha = 1;
  cardProbe(c, `${ID}/window`, WX0, WY0, WX1 - WX0, WY1 - WY0, paper, ink * paper);
  // the dimension line above: 1,732 px
  c.strokeStyle = withAlpha(INK, 0.75 * ink);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(WX0, WY0 - 14);
  c.lineTo(WX1, WY0 - 14);
  for (const [x, d] of [[WX0, 1], [WX1, -1]] as const) {
    c.moveTo(x, WY0 - 22);
    c.lineTo(x, WY0 - 6);
    c.moveTo(x, WY0 - 14);
    c.lineTo(x + d * 9, WY0 - 18);
    c.moveTo(x, WY0 - 14);
    c.lineTo(x + d * 9, WY0 - 10);
  }
  c.stroke();
  c.fillStyle = mixLab('#f4ead5', env.mood.core, 0.1);
  c.fillRect((WX0 + WX1) / 2 - 58, WY0 - 30, 116, 30);
  inkText(c, `${commas(WIN_W)} px`, (WX0 + WX1) / 2, WY0 - 8, { size: 22, align: 'center', alpha: ink, id: `${ID}/dim` });
  c.restore();
  // column cards drop into slots 1-6, one by one (a tick each)
  // (they slide in through the window's open right side, left to their slot, and settle with a tick)
  b.cards.forEach((at, k) => {
    if (tq < at) return;
    const u = clamp01((tq - at) / 0.36);
    const e = 1 - (1 - u) * (1 - u);
    const x = lerp(WX1 + 40, slotX(k) + 4, e);
    const settle = tq - at > 0.36 && tq - at < 0.36 + 1 / 12 ? 2 : 0;
    column(c, env, x + settle, WY0 + 20, SLOT - 8, WY1 - WY0 - 26, clamp01(u * 3), k);
  });
  // on 'seven': float64's seventh column, a faint grey ghost in slot 7
  const ghost = win(t, b.seven - 0.15, b.seven + 0.3);
  if (ghost > 0) {
    c.save();
    c.globalAlpha *= ghost * 0.55;
    c.strokeStyle = withAlpha('#6f6a62', 0.9);
    c.setLineDash([5, 4]);
    c.lineWidth = 1.6;
    c.strokeRect(slotX(6) + 4, WY0 + 20, SLOT - 8, WY1 - WY0 - 26);
    c.setLineDash([]);
    c.fillStyle = withAlpha('#8c877e', 0.25);
    c.fillRect(slotX(6) + 4, WY0 + 20, SLOT - 8, WY1 - WY0 - 26);
    c.restore();
  }
  // on 'hair': the seventh ink card hovers at the window's edge and does not enter; its slip reads 0
  const hv = win(t, b.land - 0.45, b.land);
  if (hv > 0) {
    const bob = Math.sin(tq * 3.1) * 3;
    const x = lerp(WX1 + 60, WX1 + 10, hv);
    const y = lerp(WY0 - 120, WY0 - 2, hv) + bob;
    c.save();
    c.translate(x + (SLOT - 8) / 2, y + 60);
    c.rotate(0.12);
    column(c, env, -(SLOT - 8) / 2, -60, SLOT - 8, WY1 - WY0 - 26, hv, 6);
    c.restore();
    // the check slip: inked with the result, by 18.5 s; set large, its '0' the shot's single copper accent
    const inkAt = b.land - 0.3;
    const sp = cardPaperAlpha(t, inkAt, 0.3);
    if (sp > 0.001) {
      const sa = win(t, inkAt, inkAt + 0.12);
      const size = 34; // about 1.6x the old 21 px (cap ≈ 36 px at 1080p)
      const label = 'columns ≥ 7: ';
      c.save();
      c.font = `500 ${size}px "IBM Plex Mono"`;
      const tw = c.measureText(label + String(CHECK)).width;
      c.restore();
      const w = tw + 32, h = size + 22;
      // beside the 7 mark, left of the loupe, between the tally and the ledger
      const sx = LOUPE.x - LOUPE.r - 28 - w, sy = TALLY_Y + 66;
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2 * sp);
      c.fillRect(sx + 3, sy + 4, w, h);
      c.fillStyle = withAlpha(mixLab('#fbf3e2', env.mood.core, 0.2), sp);
      c.fillRect(sx, sy, w, h);
      c.strokeStyle = withAlpha(INK, 0.6 * sp);
      c.lineWidth = 1;
      c.strokeRect(sx, sy, w, h);
      cardProbe(c, `${ID}/check`, sx, sy, w, h, sp, sa * sp);
      inkSegments(c, [
        { text: label, a: sa * sp },
        { text: String(CHECK), a: sa * sp, color: COPPER_INK },
      ], sx + 16, sy + h / 2 + size * 0.36, { size, id: `${ID}/check` });
    }
  }
}
/** a column card: paper, a few lines of ink (texture), its slot number in the corner */
function column(c: C, env: PaintEnv, x: number, y: number, w: number, h: number, a: number, k: number) {
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18);
  c.fillRect(x + 2, y + 3, w, h);
  c.fillStyle = mixLab('#efe0c0', env.mood.core, 0.15);
  c.fillRect(x, y, w, h);
  // the card carries its ruled lines with the paper (they arrive together)
  cardProbe(c, `${ID}/col${k}`, x, y, w, h, 1, 1);
  c.strokeStyle = withAlpha(INK, 0.8);
  c.lineWidth = 1.2;
  c.strokeRect(x, y, w, h);
  c.fillStyle = withAlpha(INK, 0.28);
  for (let i = 0; i < 6; i++) c.fillRect(x + 10, y + 18 + i * 16, w * (0.72 - ((i + k) % 3) * 0.14), 2);
  c.restore();
}

// ---------------------------------------------------------------- the tally under the window
const tallyX = (cols: number) => slotX(0) + cols * SLOT;
function tally(c: C, env: PaintEnv, t: number, b: Beats) {
  const a = win(t, b.window + 0.2, b.window + 0.6);
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = INK;
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(tallyX(0), TALLY_Y);
  c.lineTo(tallyX(7) + 6, TALLY_Y);
  for (let k = 0; k <= 7; k++) {
    c.moveTo(tallyX(k), TALLY_Y - 8);
    c.lineTo(tallyX(k), TALLY_Y + 8);
  }
  c.stroke();
  for (let k = 1; k <= 7; k++) inkText(c, String(k), tallyX(k), TALLY_Y + 30, { size: 18, align: 'center', role: 'texture', alpha: 0.85 });
  // float64 (faint grey) runs to 7 on 'seven'; FP32 (ink) runs out after it and stops at 6.999999523…
  const g64 = win(t, b.seven - 0.85, b.seven) * F64;
  const g32 = win(t, b.fp32 - 0.2, b.land) * FP32;
  if (g64 > 0) {
    c.fillStyle = withAlpha('#8c877e', 0.55);
    c.fillRect(tallyX(0), TALLY_Y - 15, tallyX(g64) - tallyX(0), 6);
  }
  if (g32 > 0) {
    c.fillStyle = INK;
    c.fillRect(tallyX(0), TALLY_Y - 6, tallyX(g32) - tallyX(0), 5);
  }
  c.restore();
  void env;
}

// ---------------------------------------------------------------- the loupe on the 7 mark
function loupe(c: C, env: PaintEnv, t: number, b: Beats) {
  const a = win(t, b.seven - 0.3, b.seven + 0.25);
  if (a <= 0) return;
  const { x, y, r } = LOUPE;
  const mx = tallyX(7), my = TALLY_Y;
  c.save();
  c.globalAlpha *= a;
  // the connector from the mark to the lens
  c.strokeStyle = withAlpha(INK, 0.55);
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(mx, my, 14, 0, Math.PI * 2);
  c.moveTo(mx + 13, my + 4);
  c.lineTo(x - r * 0.95, y - r * 0.3);
  c.stroke();
  // the lens: magnified paper around the 7 mark
  c.save();
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = mixLab('#fbf3e2', env.mood.core, 0.25);
  c.fillRect(x - r, y - r, 2 * r, 2 * r);
  // the 7 mark, thick at this magnification
  c.fillStyle = INK;
  c.fillRect(x - 3, y - 54, 6, 108);
  // float64's bar reaches it exactly
  const g64 = win(t, b.seven - 0.85, b.seven);
  if (g64 > 0) {
    c.fillStyle = withAlpha('#8c877e', 0.6);
    c.fillRect(x - r, y - 40, (r - 3) * clamp01(g64 * 3 - 2), 22);
  }
  // FP32's bar comes in from the left and stops a hair short of the mark (the gap, magnified: illustrative scale)
  const g32 = win(t, b.fp32 - 0.2, b.land);
  const gap = 14;
  if (g32 > 0) {
    const end = lerp(x - r - 10, x - 3 - gap, clamp01(g32 * 4 - 3));
    c.fillStyle = INK;
    c.fillRect(x - r - 10, y + 4, end - (x - r - 10), 20);
    if (g32 >= 1) {
      // the hair: a copper glint in the gap
      c.fillStyle = withAlpha(mixLab('#8c877e', INK, 0.3), 0.9 * win(t, b.land, b.land + 0.2));
      c.fillRect(end + 2, y + 2, gap - 4, 24);
      c.fillStyle = withAlpha(mixLab('#fbf3e2', env.mood.core, 0.25), 1);
      c.fillRect(end + 4, y + 4, gap - 8, 20);
    }
  }
  c.restore();
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 7;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(copperOf(env, 0.3), 0.7);
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(x, y, r - 4, Math.PI * 1.1, Math.PI * 1.6);
  c.stroke();
  // the handle
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 12;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x + r * 0.72, y + r * 0.72);
  c.lineTo(x + r * 1.15, y + r * 1.1);
  c.stroke();
  c.lineCap = 'butt';
  c.restore();
}

// ---------------------------------------------------------------- the ledger: the reciprocal's rounding first
function ledger(c: C, t: number, b: Beats) {
  const ink = (at: number) => win(t, at, at + 0.3);
  const segs = [
    { text: `f(f(${WIN_W} − ${MARGIN}) × `, a: ink(b.window + 1.4) },
    { text: `f(1/${COL})`, a: ink(b.window + 0.6), color: mixLab(INK, COPPER_INK, 0.5 * (1 - win(t, b.window + 2.5, b.window + 3.5))) },
    { text: ')', a: ink(b.window + 1.4) },
    { text: ` = ${FP32}`, a: ink(b.land - 0.3) },
    { text: `   ·   float64: ${FITS64}`, a: ink(b.seven - 0.05) },
  ];
  if (segs[1].a > 0) inkSegments(c, segs, 640, 604, { size: 24, align: 'center', id: `${ID}/ledger` });
  void FITS32;
}
