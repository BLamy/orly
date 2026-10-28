/**
 * ch08-s01 — THE QUIET MONTHS, on the Window Calendar (Device 2). winterBlue night, fadeBlack in; 8.17 s.
 *   L0801 "Six commits in July. In August, none."
 *   L0802 "The record doesn't say why. So we won't guess."
 *
 * The canonical black paper building (sets/windowCalendar: one lit pane per commit, one column per month, fixed grid
 * and placement) on the sharp action plane, against a cold moonlit haze: stars, the moon and a far hazed city (L1),
 * dark unlit neighbours (L2), a snowy parapet across the foot of frame (L5) and a bare winter branch at top right (L6).
 * June's 72 panes glow warm at the left (lit since ch03); the camera tracks slowly right at mid-height, dropping a
 * little, so August's sill settles in the lower third.
 *
 * TEACHES, word by word (pane = commit, exact counts):
 *   Six (1.10)     July's column: its six lit panes count on, one woodblock tap each (they are the bottom storey of
 *                  the canonical grid); the label JULY 2026 · 6 sets over the column
 *   August (2.84)  the camera arrives at August: every pane black glass; AUGUST 2026 · 0 sets over it
 *   none (3.20)    paper-cut snow begins to fall past the building and settles on August's sill in a thin white line
 *                  (and, later, faintly on its storey ledges)
 *   guess (6.76)   the haze thickens a little; the track has stopped. No figures, nothing implied about why.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import {
  FONT,
  LAYERS,
  cam3Interp,
  defineShot,
  drawTracked,
  hash1,
  legibleSize,
  mixLab,
  moon,
  skyline,
  stars,
  textProbe,
  textRole,
  toLayer,
  toScreen,
  withAlpha,
} from '../../../film';
import { CAL, COMMITS, paneRect, windowCalendar } from '../sets/windowCalendar';

type C2 = CanvasRenderingContext2D;
const ID = 'ch08-s01';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

/** camera for an action-plane scale k centred on world (x, y): dolly to k 1.2, lens beyond (as ch03-s01) */
function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}

// ---------------------------------------------------------------- geometry (action plane, rest px)
const BASE = { x: 640, y: 690 };
const P = CAL.pane + CAL.gap;
const COL_W = CAL.cols * P - CAL.gap;
const MAIN_W = 5 * COL_W + 4 * CAL.pier + 2 * CAL.pier;
const colX = (m: 'jun' | 'jul' | 'aug' | 'sep' | 'oct') => paneRect(m, 0, BASE).x;
const AUG_X = colX('aug');
const JUL_X = colX('jul');
/** the columns' foot (the base course) and the roof line */
const COL_FOOT = BASE.y - CAL.pier;
const ROOF = BASE.y - CAL.storeys * P - CAL.pier;

/** the track: June at the left edge → August centred, dropping a little; it stops before 'guess' */
const CAM_A = camK(546, 610, 3.9);
const CAM_B = camK(642, 624, 4.2);
const TRACK_END = 6.75;
/** progress: an ease that is already moving as the fade from black opens, and settles to a stop */
const trackU = (t: number) => {
  const u = clamp01(t / TRACK_END);
  return 1 - Math.pow(1 - u, 1.9) * (1 - 0.1 * u);
};
/** near planes, as custom depths (under this lens L5/L6 magnify 8-12x; these keep a 1.4x / 2.1x parallax) */
const NEAR5: LayerSpec = { id: 'n5', z: 760, haze: 0, blur: 4 };
const NEAR6: LayerSpec = { id: 'n6', z: 560, haze: 0, blur: 9 };

const CALL: LayerSpec = { id: 'cal', z: 1000, haze: 0.03, blur: 0 };

interface Beats {
  D: number;
  six: number;
  july: number;
  august: number;
  snow: number;
  guess: number;
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      six: T.word('L0801', 'Six'),
      july: T.beat('july'),
      august: T.beat('august'),
      snow: T.beat('snow'),
      guess: T.beat('guess'),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const t = f.t;
    const tq = twos(t);
    const cam = cam3Interp(CAM_A, CAM_B)(trackU(t));
    f.camera(cam);
    f.backlight({ sunX: 1010, sunY: 250, intensity: 0.8 });

    // ---------------- L1: stars, the moon and a far city in the cold haze
    f.layer('L1', (c, env) => {
      f.cached(`${ID}/L1/${env.mood.id}`, 2400, 1000, (cc) => {
        cc.translate(560, 200);
        stars(cc, { x: -560, y: -200, w: 2400, h: 560, count: 140, seed: 81, twinkle: 0 }, env);
        skyline(cc, { style: 'megacity', x0: -560, x1: 1840, y: 660, height: 140, seed: 808, lit: 0, ground: 200, role: 'set' }, env);
      })(c, -560, -200);
      moon(c, { x: MOON.x, y: MOON.y, r: 15, phase: 0.22, halo: 0.85 }, env);
    });
    // ---------------- L2: dark neighbours, every window unlit
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 1900, 760, (cc) => {
        cc.translate(310, -180);
        neighbours(cc, env);
      })(c, -310, 180);
    });
    f.fog('A');
    f.fog('B');

    // ---------------- the building (action plane)
    // July's six panes count on from 'Six', one tap each; June is lit throughout (it has been since ch03)
    const julyLit = t < b.six ? 0 : Math.min(6, 1 + Math.floor((tq - b.six) / 0.16 + 1e-6));
    f.layer(CALL, (c, env) => {
      plinth(f, c, env);
      windowCalendar(f, c, env, { x: BASE.x, y: BASE.y, fill: { jun: 1, jul: julyLit / COMMITS.jul }, snow: false, warm: 0.8, key: ID });
      // each July pane flashes as it counts on, then settles to the column's steady lamp
      for (let i = 0; i < julyLit; i++) {
        const at = b.six + i * 0.16;
        const k = Math.exp(-Math.max(0, t - at) * 3.2);
        if (k > 0.02) paneFlash(c, env, paneRect('jul', i, BASE), k);
      }
      // August: black glass, a cold sheen across it once the camera arrives (it reads as glass, not as a hole)
      glassSheen(c, env, win(t, b.august - 0.2, b.august + 0.8));
      // snow settling on August's sill, then (fainter) its ledges
      sillSnow(c, env, t, b);
      // the month labels over their columns (subject text: legible at this scale)
      monthLabel(c, env, 'JULY 2026 · 6', JUL_X + COL_W / 2, win(t, b.july - 0.05, b.july + 0.45), 'july');
      monthLabel(c, env, 'AUGUST 2026 · 0', AUG_X + COL_W / 2, win(t, b.august - 0.05, b.august + 0.45), 'august');
      // paper-cut snow falling past the building (nearer flakes, on twos)
      paperSnow(c, env, t, tq, b, 0);
    });
    f.rim({ x: 0.3, y: -1 });

    // the haze thickens a little on 'guess'
    const g = win(t, b.guess - 0.2, b.guess + 1.2);
    if (g > 0.003) f.fog({ yCenter: 420, height: 560, alpha: 0.13 * g, drift: 7 });

    // ---------------- near planes: a snowy parapet at the foot of frame and nearer snow; a bare branch at top right
    f.layer(NEAR5, (c, env) => {
      inMidScreen(c, NEAR5, () => {
        parapet(c, env);
        paperSnow(c, env, t, tq, b, 1);
      });
    });
    f.layer(NEAR6, (c, env) => inMidScreen(c, NEAR6, () => branch(c, env)));
  },
});

// ---------------------------------------------------------------- placements chosen on the mid-track frame
const CAM_MID = cam3Interp(CAM_A, CAM_B)(0.5);
const MOON = toLayer(LAYERS.L1, CAM_MID, 1050, 70);
/** draw in the mid-track frame's SCREEN px on a near layer (the art stays fixed in its world; parallax still applies) */
function inMidScreen(c: C2, layer: LayerSpec, fn: () => void) {
  const o = toLayer(layer, CAM_MID, 0, 0);
  const k = toScreen(layer, CAM_MID, 0, 0).k;
  c.save();
  c.translate(o.x, o.y);
  c.scale(1 / k, 1 / k);
  fn();
  c.restore();
}

// ---------------------------------------------------------------- painters
/** L2: dark neighbouring blocks to either side of the building, unlit; a water tank on one roof */
function neighbours(c: C2, env: PaintEnv) {
  c.fillStyle = env.fill('set');
  const blocks: [number, number, number][] = [
    [-300, 330, 300],
    [-10, 290, 170],
    [150, 360, 130],
    [260, 400, 120],
    [1000, 380, 130],
    [1120, 320, 160],
    [1270, 370, 150],
    [1410, 300, 200],
  ];
  for (const [x, top, w] of blocks) c.fillRect(x, top, w, 960 - top);
  c.fillRect(1160, 280, 60, 40);
  c.beginPath();
  c.moveTo(1156, 280);
  c.lineTo(1190, 258);
  c.lineTo(1224, 280);
  c.closePath();
  c.fill();
  // snow caps on the neighbours' parapets: the only light on them
  c.fillStyle = withAlpha(mixLab('#eef2f4', env.mood.rim, 0.45), 0.4);
  for (const [x, top, w] of blocks) c.fillRect(x, top - 1.5, w, 2.2);
}

/** the plinth the building stands on, and the dark street in front of it */
function plinth(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/plinth/${env.mood.id}`, 1400, 260, (cc) => {
    cc.translate(-(BASE.x - 700), -(BASE.y - 2));
    const ink = env.fill('ink');
    cc.fillStyle = mixLab(ink, env.mood.set, 0.22);
    cc.fillRect(BASE.x - 700, BASE.y + 96, 1400, 160);
    cc.fillStyle = ink;
    cc.fillRect(BASE.x - MAIN_W / 2 - 4, BASE.y - 2, MAIN_W + 8, 260);
    cc.strokeStyle = withAlpha(env.mood.rim, 0.07);
    cc.lineWidth = 0.6;
    for (let y = BASE.y + 22; y < BASE.y + 118; y += 18) {
      cc.beginPath();
      cc.moveTo(BASE.x - MAIN_W / 2, y);
      cc.lineTo(BASE.x + MAIN_W / 2, y);
      cc.stroke();
    }
  })(c, BASE.x - 700, BASE.y - 2);
}

/** a newly counted pane: a short warm flash with a tight bloom (additive) */
function paneFlash(c: C2, env: PaintEnv, r: { x: number; y: number; w: number; h: number }, k: number) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, 16);
  g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#f2c27a', 0.5), 0.55 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(cx - 16, cy - 16, 32, 32);
  c.restore();
}

/** August's black glass catches a faint cold sheen across its panes (a diagonal band, static) */
function glassSheen(c: C2, env: PaintEnv, a: number) {
  if (a <= 0.003) return;
  c.save();
  c.beginPath();
  for (let s = 0; s < CAL.storeys; s++) for (let k = 0; k < CAL.cols; k++) {
    const r = paneRect('aug', s * CAL.cols + k, BASE);
    c.rect(r.x, r.y, r.w, r.h);
  }
  c.clip();
  const g = c.createLinearGradient(AUG_X, ROOF, AUG_X + COL_W, COL_FOOT);
  g.addColorStop(0, withAlpha(env.mood.rim, 0));
  g.addColorStop(0.42, withAlpha(env.mood.rim, 0.1 * a));
  g.addColorStop(0.5, withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.16 * a));
  g.addColorStop(0.58, withAlpha(env.mood.rim, 0.1 * a));
  g.addColorStop(1, withAlpha(env.mood.rim, 0));
  c.fillStyle = g;
  c.fillRect(AUG_X - 2, ROOF, COL_W + 4, COL_FOOT - ROOF);
  c.restore();
}

/** snow settling: the sill line under August grows from the middle out from 'none'; its storey ledges follow faintly */
function sillSnow(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = win(t, b.snow + 0.35, b.snow + 2.6);
  if (u <= 0.003) return;
  const col = mixLab('#eef2f4', env.mood.rim, 0.3);
  const cx = AUG_X + COL_W / 2;
  const half = (COL_W / 2 + 3) * Math.min(1, u * 1.4);
  const th = 0.6 + 2.0 * u;
  c.save();
  c.fillStyle = withAlpha(col, 0.92);
  c.beginPath();
  c.moveTo(cx - half, COL_FOOT + 1.2);
  for (let k = 0; k <= 14; k++) {
    const x = cx - half + (2 * half * k) / 14;
    c.lineTo(x, COL_FOOT + 1.2 - th - 0.5 * th * Math.abs(Math.sin(k * 1.7)));
  }
  c.lineTo(cx + half, COL_FOOT + 1.2);
  c.closePath();
  c.fill();
  // the ledges: a breath of snow on every storey, fainter, later
  const l = win(t, b.snow + 1.6, b.snow + 3.8);
  if (l > 0.003) {
    c.fillStyle = withAlpha(col, 0.22 * l);
    for (let s = 1; s < CAL.storeys; s++) {
      const y = COL_FOOT - s * P + CAL.gap * 0.5;
      c.fillRect(AUG_X - 1, y - 0.9 * l, COL_W + 2, 0.9 * l + 0.2);
    }
  }
  c.restore();
}

/** a month's label set over its column (pale mono on the night, with a short leader to the roof) */
function monthLabel(c: C2, env: PaintEnv, text: string, x: number, a: number, id: string) {
  if (a <= 0.003) return;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 6.6px ${FONT.mono}`, 6.6, text);
    c.save();
    c.globalAlpha = a;
    c.fillStyle = mixLab(env.mood.core, env.mood.rim, 0.25);
    const y = ROOF - 20;
    const w = drawTracked(c, text, x, y, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.08, align: 'center' });
    c.fillRect(x - 0.3, y + 3, 0.6, ROOF - 12 - (y + 3));
    textProbe(c, `${ID}-${id}`, x - w / 2, y - size, w, size * 1.1, a);
    c.restore();
  });
}

/**
 * Paper-cut snow, falling from 'none': small irregular cut-paper flakes (5-7 sided, each turned a little), on twos.
 * band 0 = in front of the building (action plane), band 1 = near (L5, larger, blurred by the layer).
 */
function paperSnow(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, band: 0 | 1) {
  const on = win(t, b.snow - 0.1, b.snow + 0.9);
  if (on <= 0.003) return;
  // band 0 in action-plane world px around the columns; band 1 in the near layer's mid-frame screen px
  const N = band === 0 ? 90 : 26;
  const area = band === 0 ? { x: 470, y: 520, w: 300, h: 190 } : { x: -40, y: -60, w: 1360, h: 760 };
  const fall = band === 0 ? 11 : 70;
  const size = band === 0 ? 1.25 : 4.2;
  const dt = Math.max(0, tq - (b.snow - 0.6));
  const col = mixLab('#eef2f4', env.mood.rim, band === 0 ? 0.35 : 0.2);
  c.save();
  c.fillStyle = withAlpha(col, (band === 0 ? 0.85 : 0.6) * on);
  for (let i = 0; i < N; i++) {
    const s = 811 + band * 97 + i;
    const sp = fall * (0.7 + 0.6 * (hash1(i, s) * 0.5 + 0.5));
    // each flake starts above the area at its own height, so they arrive one by one
    const y0 = area.y - (hash1(i, s + 1) * 0.5 + 0.5) * area.h * 1.6;
    const yy = y0 + sp * dt;
    const y = area.y + ((((yy - area.y) % (area.h * 1.6)) + area.h * 1.6) % (area.h * 1.6)) - area.h * 0.3;
    if (yy < area.y - area.h * 0.3) continue;
    const x = area.x + (hash1(i, s + 2) * 0.5 + 0.5) * area.w + (band === 0 ? 2.5 : 14) * Math.sin(tq * 0.9 + i) + (band === 0 ? 1.2 : 6) * dt;
    const r = size * (0.8 + 0.6 * (hash1(i, s + 3) * 0.5 + 0.5));
    const n = 5 + (i % 3);
    const rot = i * 1.3 + tq * 0.6 * hash1(i, s + 4);
    c.beginPath();
    for (let k = 0; k < n; k++) {
      const a = rot + (k / n) * Math.PI * 2;
      const rr = r * (0.75 + 0.35 * (hash1(k, s + 5) * 0.5 + 0.5));
      if (k) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      else c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
  }
  c.restore();
}

/** near: a snowy parapet across the foot of frame (the roof we stand on), chimney pots at right (mid-frame px) */
function parapet(c: C2, env: PaintEnv) {
  c.fillStyle = mixLab(env.mood.fg, env.mood.ink, 0.5);
  c.beginPath();
  c.moveTo(-200, 668);
  c.lineTo(1500, 652);
  c.lineTo(1500, 1000);
  c.lineTo(-200, 1000);
  c.closePath();
  c.fill();
  c.fillRect(1090, 560, 46, 110);
  c.fillRect(1082, 550, 62, 13);
  c.fillRect(1150, 596, 36, 70);
  // snow along the parapet top and the pots' rims
  c.fillStyle = withAlpha(mixLab('#eef2f4', env.mood.rim, 0.4), 0.6);
  c.beginPath();
  c.moveTo(-200, 668);
  for (let k = 0; k <= 34; k++) c.lineTo(-200 + k * 50, 668 - (k * 16) / 34 - 4 - 2.5 * Math.abs(Math.sin(k * 1.9)));
  c.lineTo(1500, 656);
  c.closePath();
  c.fill();
  c.fillRect(1082, 547, 62, 4);
  c.fillRect(1150, 593, 36, 3.5);
}

/** near: a bare winter branch reaching in from the top right (mid-frame px) */
function branch(c: C2, env: PaintEnv) {
  c.strokeStyle = env.fill('fg');
  c.lineCap = 'round';
  const limb = (x: number, y: number, ang: number, len: number, w: number, depth: number, seed: number) => {
    if (depth <= 0 || w < 1.2) return;
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo((x + ex) / 2 + 14 * hash1(depth, seed), (y + ey) / 2 + 10, ex, ey);
    c.stroke();
    limb(ex, ey, ang + 0.38 + 0.2 * hash1(depth, seed + 1), len * 0.66, w * 0.6, depth - 1, seed + 3);
    limb(ex, ey, ang - 0.5 + 0.2 * hash1(depth, seed + 2), len * 0.58, w * 0.55, depth - 1, seed + 7);
  };
  limb(1420, -30, Math.PI * 0.86, 260, 30, 6, 5);
  limb(1400, 110, Math.PI * 1.0, 170, 16, 5, 19);
}

