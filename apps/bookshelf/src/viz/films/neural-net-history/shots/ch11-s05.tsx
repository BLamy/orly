/**
 * ch11-s05 — a smooth law, a city of weights, a new candle (candleAmber → serverCyan → candleAmber; 22.75 s; cut in).
 *
 * CAMERA: BOARD (the log-log sheet in the lamp's pool, the Wall's W4 at the right edge) → the sheet tilts back into a
 * night CITY (serverCyan) → a push into one lit window near the roofline → back out to the tallest roofline → a
 * MATCH CUT to the new candle's flame on the SHELF (candleAmber) → a crane up to the WALL (W4).
 *   lead-in    the hands pin a sheet of log-log paper on the board (both axes printed 'log scale' and named, round-1
 *              review: 'error ↓' over the plot, 'compute →' under it, so the flip to a rising skyline reads as
 *              intended; the x ticks span eight powers of ten). 2020 bottom-left
 *   'waiting'  the pin of the W4 slip (AlexNet's 'waiting' note, 2012) glints once at the right edge of frame
 *   'law'      the fountain pen rules ONE straight descending line: error falling as a power law as size rises
 *              (straight only because both axes are logarithmic)
 *   'bigger'   the paper tilts back (edge-on) and the ruled line becomes the roofline of a night skyline, rising left
 *              to right (candleAmber → serverCyan, 1.2 s, no dip); the towers rise on twos; the tallest has 96 storeys,
 *              one per layer of 2020's giant; each window a bank of weights
 *   'G'        every window lights at once; the brass plate at the tallest tower's foot catches the light:
 *              175 BILLION WEIGHTS
 *   'examples' one lit window near the roofline: three worked example strips hang (a word and its answer, twice
 *              over, then a third pair); a fourth fills itself in. Nothing in the tower is re-cut (no retraining)
 *   'candle'   the tallest tower's roofline light → match cut → the flame of SCALE IS THE MAIN LEVER on the shelf, its
 *              tag 2020, no sleeve, the flame on the top ring (serverCyan → candleAmber, 1 s, no dip)
 *   'wallW4'   music only: the crane up and right to the Wall; 'w4glint': the 2012 slip in W4 catches the light,
 *              its pin glints; W6's corner half-lit in shadow; W7 at the far end
 * ROUND-1 REVISE: no hand in the lead-in (the sheet is already pinned; the pen's entry at ≈4.7 s is the one hand move);
 *   on 'bigger' the sheet tilts back and turns over about its vertical axis, so the falling line swings round into a
 *   rising one, and ONE bright screen-locked stroke carries the ruled line onto the roofline (0.3 s board→city
 *   dissolve, the tint done by ≈7.55 s); on 'GPT' a ≈12% push toward the tower's foot reads the 175 BILLION WEIGHTS
 *   plate; the few-shot window is one of the tallest tower's own windows (clipped to the facade, framed, a transom
 *   and mullion); the shelf is framed with the new flame at ≈33% height on the frame's centre column (the match point),
 *   a 4.9% push toward it, the hero label (belief · 'lit 2020 · still burning' · 'contested, as of October 2026') on
 *   one soft plate beside the flame (the kit card is switched off here), the 2020 tag on the candle's base, and a
 *   blurred L5 shelf end; the crane lands close on W4 and dollies in over the last 0.6 s. Every teaching text passes
 *   the 22 px audit. (W2 is absent from the Wall by design: studyState takes the chess slip down in ch06-s07.)
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down one
 * ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, MOODS, defineShot, hash1, mixLab, overscan, skyline, stars, toLayer, toScreen, withAlpha } from '../../../film';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { HAND_LEN, type Pt } from '../sets/narratorHands';
import { STUDY, candleX, studyCase, studyNear, studyRoom, wallSlotWorld } from '../sets/study';
import { shelfStateAt } from '../sets/studyState';
import { candleFlame } from '../sets/beliefCandle';
import { screenPass } from '../sets/ch06-s01-kit';
import { CARD19, CARD85, ch11Board, drawLineage, drawQuoteCard } from '../sets/ch11-s02-cards';
import { DEFAULT_POOL, poolAt } from '../sets/caseBoard';
import { bentArm, clamp01, compositeSub, lerp, mixCam, sm, softPlate, subFrame, tq12, win } from '../sets/ch11-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch11-s05';
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };

// ------------------------------------------------------------------------------------------------ the log-log sheet
/** pinned just below the GPT card at the head of C4 (clear of it), over the top margin of the two 2019/1985 cards */
const SHEET = { x: 1000, y: 330, w: 276, h: 214 };
/** the plot: a header line above it (the y axis: error ↓) and a footer below it (the x axis: compute →) */
const PLOT = { x0: SHEET.x - SHEET.w / 2 + 18, x1: SHEET.x + SHEET.w / 2 - 16, y0: SHEET.y - SHEET.h / 2 + 34, y1: SHEET.y + SHEET.h / 2 - 32 };
const DEC_X = 8, DEC_Y = 3;
/** the ruled line: from upper left to lower right (a power law is straight on log-log axes) */
const LINE = { a: { x: PLOT.x0 + 10, y: PLOT.y0 + 22 }, b: { x: PLOT.x1 - 8, y: PLOT.y1 - 30 } };
const W4 = wallSlotWorld('W4');
const W4_PIN = { x: W4.x, y: W4.y - (96 * 0.95) / 2 + 6 };

// ------------------------------------------------------------------------------------------------ shelf
const V0 = shelfStateAt(ID, 'start');
const V1 = shelfStateAt(ID, 'end');
const SX = candleX(V1, 'scale');
const SCALE_V = V1.find((v) => v.id === 'scale')!;
const FLAME = candleFlame({ x: SX, y: STUDY.shelf.y, view: SCALE_V, s: STUDY.shelf.s });

// ------------------------------------------------------------------------------------------------ cameras
const BOARD0: Camera3 = { x: 1150, y: 318, z: 230, lens: 1 };
const BOARD1: Camera3 = { x: 1130, y: 316, z: 250, lens: 1 };
/** the push in (≈1.6×) on the sheet, 3.0 → 5.5 s */
const BOARD2: Camera3 = { x: 1006, y: 334, z: 535, lens: 1 };
const BOARD3: Camera3 = { x: 1002, y: 342, z: 560, lens: 1 };
/** the match cut: the city's roofline light and the candle flame land on the same screen point (high in frame, so
 *  the shelf framing tilts down past the chat box's foot) */
const CUT_PT = { x: 640, y: 236 };
const SH_S = 1000 / (1000 - 350);
const SHELF0: Camera3 = { x: FLAME.x, y: FLAME.y + (360 - CUT_PT.y) / SH_S, z: 350, lens: 1 };
/** the L5 shelf-end occluder's anchor: its art's top-left lands at screen (860, 560) on the shelf's first frame */
const NEAR = (() => {
  const p = toLayer(LAYERS.L5, SHELF0, 880, 560);
  return { x: p.x, y: p.y, k: toScreen(LAYERS.L5, SHELF0, p.x, p.y).k };
})();
/** a slow 4.5% push toward the new flame over the hold (the flame stays on its screen point) */
const SHELF1: Camera3 = { x: FLAME.x, y: FLAME.y + (360 - CUT_PT.y) / (1000 / (1000 - 380)), z: 380, lens: 1 };
/** the crane lands close on W4 (its slip read at >= 22 px cap), then dollies in over the last 0.6 s */
const WALL0: Camera3 = { x: W4.x + 6, y: W4.y - 4, z: 692, lens: 1 };
const WALL1: Camera3 = { x: W4.x + 10, y: W4.y - 2, z: 728, lens: 1 };
const STUDY_CAMS = [BOARD0, BOARD1, BOARD2, BOARD3, SHELF0, SHELF1, WALL0, WALL1, { x: (SHELF1.x + WALL0.x) / 2, y: (SHELF1.y + WALL0.y) / 2, z: 260, lens: 1 }];

// ------------------------------------------------------------------------------------------------ the city
const GROUND = 620;
const STOREY = 6;
const TOWERS = (() => {
  const n = 15;
  const out: { x: number; w: number; storeys: number; roof: number }[] = [];
  let x = 96;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    // the roofline is the ruled line, flipped as the paper tilts over (a straight rise), up to 96 storeys
    const storeys = i === n - 1 ? 96 : Math.round(8 + 80 * u + 3 * hash1(i, 5));
    const w = 40 + 24 * (hash1(i, 7) * 0.5 + 0.5) + (i === n - 1 ? 62 : 0);
    // roof types: 0 setback · 1 water tank · 2 spire · 3 stepped crown (never two the same side by side)
    const roof = (i * 3 + Math.floor((hash1(i, 11) * 0.5 + 0.5) * 2)) % 4;
    out.push({ x, w, storeys, roof });
    x += w + 5 + 4 * (hash1(i, 9) * 0.5 + 0.5);
  }
  return out;
})();
const TALL = TOWERS[TOWERS.length - 1];
const SPIRE = { x: TALL.x + TALL.w / 2, y: GROUND - TALL.storeys * STOREY - 52 };
const CITY_CUT: Camera3 = { x: SPIRE.x, y: SPIRE.y + (360 - CUT_PT.y) / (1000 / (1000 - 300)), z: 300, lens: 1 };
/** the few-shot window: one of the tallest tower's own windows, centred in its facade below the first setback */
const FEW_WIN = { x: TALL.x + TALL.w / 2, y: GROUND - 62 * STOREY, w: Math.min(98, TALL.w - 20), h: 78 };
const PLATE = { x: TALL.x + TALL.w / 2, y: GROUND - 34 };
const CITY0: Camera3 = { x: 650, y: 372, z: -70, lens: 1 };
const CITY1: Camera3 = { x: 664, y: 352, z: -24, lens: 1 };
const CITY_W: Camera3 = { x: FEW_WIN.x, y: FEW_WIN.y, z: 760, lens: 1 };
/** on 'GPT' every window lights and the camera pushes in ≈12% toward the tower's foot (the brass plate) */
const CITY_P: Camera3 = { x: lerp(664, PLATE.x, 0.45), y: lerp(352, PLATE.y, 0.3), z: 86, lens: 1 };
const CITY_CAMS = [CITY0, CITY1, CITY_P, CITY_CUT, { ...CITY_W, z: 400 }];

interface B {
  D: number;
  pin: number;
  florence: number;
  pen0: number;
  law: number;
  tilt0: number;
  city: number;
  rise1: number;
  lights: number;
  push0: number;
  few: number;
  fill0: number;
  out0: number;
  cut: number;
  crane0: number;
  wall: number;
  glint: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const law = T.beat('ruled');
    const few = T.beat('fewShot');
    const cut = T.beat('candleLit');
    const b: B = {
      D,
      pin: 0,
      florence: T.beat('florence'),
      pen0: law - 1.1,
      law,
      tilt0: T.word('L1110', 'bigger') - 0.14,
      city: T.word('L1110', 'bigger') + 0.46,
      rise1: T.word('L1110', 'bigger') + 1.06,
      lights: T.beat('skyline'),
      push0: few - 0.95,
      few,
      fill0: T.word('L1110', 'untaught') - 0.9,
      out0: T.word('L1110', 'untaught') + 0.15,
      cut,
      crane0: T.beat('wallW4') - 0.5,
      wall: T.beat('w4glint') - 0.02,
      glint: T.beat('w4glint'),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    if (t < b.cut) {
      // a short dissolve (0.3 s) under the single match stroke: never a long half-and-half frame
      const dis = win(t, b.city - 0.05, b.city + 0.25);
      if (dis < 1) {
        paintBoard(f, t, b);
        if (dis > 0) compositeSub(f, subFrame(f, `${ID}/city`, 'serverCyan', (g) => paintCity(g, t, b)), dis);
      } else {
        f.setMood('serverCyan');
        paintCity(f, t, b);
      }
    } else paintShelfWall(f, t, b);
    screenPass(f, (c) => {
      dateStamp(c, f.mood, t, 0.3, '2020', b.tilt0 + 0.2);
      matchStroke(c, f.mood, t, b);
      if (t >= b.cut) heroLabel(c, f.mood, t, b);
    });
  },
});

/** the date stamp (mono, after 1989), typed on at the bottom-left on twos, held, faded at `until` */
function dateStamp(c: C, m: PaintEnv['mood'], t: number, at: number, text: string, until: number) {
  const A = clamp01((t - at) / 0.15) * (1 - clamp01((t - (until - 0.5)) / 0.5));
  if (A <= 0.003) return;
  const shown = Math.max(0, Math.min(text.length, Math.floor((tq12(t) - at) * 12 + 1e-6) + 1));
  const size = Math.max(DATE_PX, legibleSize(c, `500 ${DATE_PX}px ${FONT.mono}`, DATE_PX));
  c.save();
  softPlate(c, 100, 652, 300, 130, m.ink, 0.55 * A);
  c.globalAlpha = A;
  c.fillStyle = mixLab(m.core, '#ffffff', 0.35);
  c.font = `500 ${size}px ${FONT.mono}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(text.slice(0, shown), 48, 668);
  c.globalAlpha = A * 0.6;
  c.fillRect(48, 668 - size - 6, 0.8 * size * 2.6 * clamp01((t - at - 0.3) / 0.6), 0.8);
  c.restore();
}

/**
 * The new candle's label (round-1 critic: the kit card measured 15.3 px cap and sat jammed in the top-right corner):
 * set beside the flame on one soft plate, the belief in its era's face over 'lit 2020 · still burning', and the
 * script's 'contested, as of October 2026' beneath; the year tag itself stays on the candle's base (the kit's).
 */
function heroLabel(c: C, m: PaintEnv['mood'], t: number, b: B) {
  const la = nameK(t, b);
  if (la <= 0.003) return;
  const fs = toScreen(LAYERS.L4, shelfCam(t, b), FLAME.x, FLAME.y);
  const x = fs.x + 58, y = fs.y + 40;
  const big = Math.max(LABEL_PX, legibleSize(c, `500 ${LABEL_PX}px ${FONT.mono}`, LABEL_PX));
  const sub = Math.max(SUB_PX, legibleSize(c, `italic 400 ${SUB_PX}px ${FONT.text}`, SUB_PX));
  const lines: [string, string, string][] = [
    ['SCALE IS THE', `500 ${big}px ${FONT.mono}`, mixLab(m.core, '#ffffff', 0.4)],
    ['MAIN LEVER', `500 ${big}px ${FONT.mono}`, mixLab(m.core, '#ffffff', 0.4)],
    ['lit 2020 · still burning', `italic 400 ${sub}px ${FONT.text}`, mixLab(m.halo, '#ffffff', 0.3)],
    ['contested, as of October 2026', `italic 400 ${sub}px ${FONT.text}`, mixLab(m.halo, '#ffffff', 0.3)],
  ];
  const lh = [big * 1.12, big * 1.3, sub * 1.3, sub * 1.3];
  c.save();
  let w = 0;
  for (const [tx, font] of lines) {
    c.font = font;
    w = Math.max(w, c.measureText(tx).width);
  }
  const H = lh.reduce((a, v) => a + v, 0);
  softPlate(c, x + w / 2, y + H / 2 - big * 0.6, w + 110, H + 70, m.ink, 0.66 * la);
  c.globalAlpha = la;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  let yy = y;
  lines.forEach(([tx, font, col], i) => {
    // the 'contested' line arrives a beat after the name
    if (i === 3) c.globalAlpha = la * win(t, b.cut + 1.0, b.cut + 1.6);
    c.font = font;
    c.fillStyle = col;
    c.fillText(tx, x, yy);
    yy += lh[i];
  });
  c.restore();
}
const DATE_PX = 36;
const LABEL_PX = 36;
const SUB_PX = 26;

// ================================================================================================= BOARD
function boardCam(t: number, b: B): Camera3 {
  if (t < 3.0) return mixCam(BOARD0, BOARD1, sm(t / 3.0));
  if (t < 5.5) return mixCam(BOARD1, BOARD2, sm((t - 3.0) / 2.5));
  return mixCam(BOARD2, BOARD3, sm((t - 5.5) / (b.city + 0.4 - 5.5)));
}

function paintBoard(f: Frame, t: number, b: B) {
  const cam = boardCam(t, b);
  f.camera(cam);
  // candleAmber → serverCyan in 1.1 s, done by ≈7.55 s
  const mu = win(t, b.tilt0 + 0.05, b.tilt0 + 1.15);
  if (mu > 0) f.setMood('serverCyan', { from: 'candleAmber', u: mu });
  const tq = tq12(t);
  studyRoom(f, { key: ID, cams: STUDY_CAMS, outside: { mood: 'serverCyan', kind: 'city', city: 0.5 } });
  const g1 = Math.exp(-Math.pow((t - b.florence - 0.15) / 0.22, 2));
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: { state: ch11Board(ID, 'start') },
    wall: { glint: { W4: g1 } },
    extra: (c, env) => {
      drawLineage(c, env);
      // ch11-s02's two cards still hang below C4
      for (const g of [CARD19, CARD85]) drawQuoteCard(c, env, g, { light: poolAt(POOL, g.x - STUDY.board.x, g.y - STUDY.board.y) + 0.2, underline: 1 });
      // the log-log sheet: already pinned (round-1 critic: no hand in the lead-in, so the pen's entry at ≈4.7 s is
      // the one motivated hand move), ruled on 'law', then on 'bigger' it tilts back AND turns over about its vertical
      // axis, so the falling line visibly becomes a rising one (the bright stroke is carried by the screen pass)
      const fl = flipAt(t, b);
      const ink = t < b.tilt0 ? inkAt(tq, b) : 0;
      sheet(c, env, SHEET.x, SHEET.y, fl.sy, ink, win(t, b.law - 0.1, b.law + 0.5), fl.persp, fl.cos);
      // the pen rules the line: its nib travels ON the line, and the inked stroke ends exactly at the nib
      if (tq >= b.pen0 && tq < b.law + 0.7) pen(c, env, nibAt(tq, b));
    },
  });
  if (cam.z < 330) studyNear(f, { key: ID, cams: STUDY_CAMS.filter((q) => q.z < 330), file: true });
}

/** the sheet's turn on 'bigger': tilt back (sy, persp) and a half turn about its vertical axis (cos), 6.40 → 7.05 s */
function flipAt(t: number, b: B): { sy: number; persp: number; cos: number; u: number } {
  const u = sm((t - b.tilt0) / 0.65);
  return { sy: 1 - 0.38 * u, persp: 0.6 * u, cos: Math.cos(Math.PI * u), u };
}
/** a sheet point (L4 world) after the sheet's tilt + turn transform (mirrors sheet()) */
function sheetPt(p: Pt, t: number, b: B): Pt {
  const fl = flipAt(t, b);
  const lx = p.x - SHEET.x, ly = p.y - SHEET.y;
  const fx = Math.abs(fl.cos) < 0.02 ? 0.02 * Math.sign(fl.cos || 1) : fl.cos;
  return { x: SHEET.x + fx * (1 - 0.08 * fl.persp) * lx - 0.18 * fl.persp * ly, y: SHEET.y + SHEET.h * 0.5 * (1 - fl.sy) + fl.sy * ly };
}
/** the city's roofline stroke ends (L4 world): from the first roof to the tallest roof */
const ROOF_A = { x: TOWERS[0].x, y: GROUND - TOWERS[0].storeys * STOREY };
const ROOF_Z = { x: TALL.x + TALL.w, y: GROUND - TALL.storeys * STOREY };
/**
 * THE MATCH (round-1 critic): one bright ruled stroke carried through the whole move, screen-locked so it never
 * doubles: from 'bigger' it rides the turning sheet (its falling line visibly swinging round into a rising one), then
 * glides onto the city's roofline as the board gives way to the night, and sinks into the rooftops once they rise.
 */
function matchStroke(c: C, m: PaintEnv['mood'], t: number, b: B) {
  if (t < b.tilt0 || t > b.rise1 + 1.2) return;
  const a = 1 - win(t, b.rise1 + 0.5, b.rise1 + 1.2);
  const bc = boardCam(t, b), cc = cityCam(t, b);
  // the turned sheet's low end is the ruled line's END (b), its high end the START (a)
  const p0 = toScreen(LAYERS.L4, bc, ...xy(sheetPt(LINE.b, t, b)));
  const p1 = toScreen(LAYERS.L4, bc, ...xy(sheetPt(LINE.a, t, b)));
  const q0 = toScreen(LAYERS.L4, cc, ROOF_A.x, ROOF_A.y);
  const q1 = toScreen(LAYERS.L4, cc, ROOF_Z.x, ROOF_Z.y);
  const u = sm((t - b.city + 0.05) / 0.5);
  const A = { x: lerp(p0.x, q0.x, u), y: lerp(p0.y, q0.y, u) };
  const Z = { x: lerp(p1.x, q1.x, u), y: lerp(p1.y, q1.y, u) };
  c.save();
  c.lineCap = 'round';
  c.globalAlpha = a;
  // on the paper the stroke keeps its ink edge (so it reads on the cream sheet); on the night sky it is pure light
  c.strokeStyle = withAlpha('#1d2236', 0.9 * (1 - u));
  c.lineWidth = 4.2;
  c.beginPath();
  c.moveTo(A.x, A.y);
  c.lineTo(Z.x, Z.y);
  c.stroke();
  for (const [lw, col, al] of [[9, m.core, 0.16], [4, m.core, 0.45], [2.2, mixLab(m.core, '#ffffff', 0.55), 1]] as const) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(col, al);
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(A.x, A.y);
    c.lineTo(Z.x, Z.y);
    c.stroke();
  }
  c.restore();
}
const xy = (p: Pt): [number, number] => [p.x, p.y];

/** the ruling's progress 0..1 (shared by the ink and the nib, so the stroke always ends at the nib) */
function inkAt(tq: number, b: B): number {
  return clamp01((tq - (b.law - 0.8)) / 0.8);
}
function nibAt(tq: number, b: B): Pt {
  const r0 = b.law - 0.8;
  if (tq < r0) {
    const u = sm((tq - b.pen0) / (r0 - b.pen0));
    return { x: lerp(LINE.a.x + 90, LINE.a.x, u), y: lerp(LINE.a.y + 150, LINE.a.y, u) };
  }
  if (tq < b.law) {
    const u = inkAt(tq, b);
    return { x: lerp(LINE.a.x, LINE.b.x, u), y: lerp(LINE.a.y, LINE.b.y, u) };
  }
  const u = sm((tq - b.law) / 0.7);
  return { x: LINE.b.x + 90 * u, y: LINE.b.y + 150 * u };
}

/** a fountain pen with its nib exactly at `nib`, held by a hand with a bent arm entering from below right */
function pen(c: C, env: PaintEnv, nib: Pt) {
  const m = env.mood;
  const ang = -1.05; // the pen's axis, nib → cap (up and to the right)
  const ax = Math.cos(ang), ay = Math.sin(ang);
  const L = 74;
  const nx = -ay, ny = ax;
  c.save();
  // the barrel: a fat lacquered body (clearly a pen, never mistaken for the inked stroke), a lit edge, a brass band
  c.fillStyle = mixLab(env.fill('ink'), m.set, 0.18);
  c.beginPath();
  c.moveTo(nib.x + ax * 12 + nx * 4.2, nib.y + ay * 12 + ny * 4.2);
  c.lineTo(nib.x + ax * L + nx * 6, nib.y + ay * L + ny * 6);
  c.lineTo(nib.x + ax * L - nx * 6, nib.y + ay * L - ny * 6);
  c.lineTo(nib.x + ax * 12 - nx * 4.2, nib.y + ay * 12 - ny * 4.2);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.6);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(nib.x + ax * 14 - nx * 4, nib.y + ay * 14 - ny * 4);
  c.lineTo(nib.x + ax * L - nx * 5.6, nib.y + ay * L - ny * 5.6);
  c.stroke();
  c.fillStyle = mixLab(m.halo, '#a8803e', 0.4);
  c.beginPath();
  c.moveTo(nib.x + ax * 16 + nx * 4.6, nib.y + ay * 16 + ny * 4.6);
  c.lineTo(nib.x + ax * 20 + nx * 4.8, nib.y + ay * 20 + ny * 4.8);
  c.lineTo(nib.x + ax * 20 - nx * 4.8, nib.y + ay * 20 - ny * 4.8);
  c.lineTo(nib.x + ax * 16 - nx * 4.6, nib.y + ay * 16 - ny * 4.6);
  c.closePath();
  c.fill();
  // the nib: a brass point to the paper
  c.fillStyle = mixLab(m.halo, m.set, 0.2);
  c.beginPath();
  c.moveTo(nib.x, nib.y);
  c.lineTo(nib.x + ax * 13 + nx * 4, nib.y + ay * 13 + ny * 4);
  c.lineTo(nib.x + ax * 13 - nx * 4, nib.y + ay * 13 - ny * 4);
  c.closePath();
  c.fill();
  c.restore();
  // the hand grips the barrel a third of the way up
  const grip = { x: nib.x + ax * 34, y: nib.y + ay * 34 };
  bentArm(c, env, { shoulder: { x: grip.x + 620, y: grip.y + 760 }, elbow: { x: grip.x + 150, y: grip.y + 150 }, at: grip, shape: 'grip', len: HAND_LEN * 0.62 });
}

/** the sheet of log-log paper at (cx, cy) (centre), scaleY sy (1 → 0: tilting back), the line inked to `ink` */
function sheet(c: C, env: PaintEnv, cx: number, cy: number, sy: number, ink: number, gleam: number, persp = 0, flip = 1) {
  const m = env.mood;
  c.save();
  c.translate(cx, cy + SHEET.h * 0.5 * (1 - sy));
  // tilting back about its foot: flatten in y, and a skew stands in for the receding top edge; `flip` (cos of the turn
  // about the vertical axis) mirrors it left-right: below 0 we see the paper's back, the grid showing through
  const fx = Math.abs(flip) < 0.02 ? 0.02 * Math.sign(flip || 1) : flip;
  c.transform(fx * (1 - 0.08 * persp), 0, -0.18 * persp, Math.max(0.01, sy), 0, 0);
  const back = flip < 0;
  c.translate(-SHEET.x, -SHEET.y);
  const x0 = SHEET.x - SHEET.w / 2, y0 = SHEET.y - SHEET.h / 2;
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(x0 + 4, y0 + 5, SHEET.w, SHEET.h);
  const light = poolAt(POOL, SHEET.x - STUDY.board.x, SHEET.y - STUDY.board.y) + 0.35;
  c.fillStyle = mixLab(mixLab('#d9d4bd', m.set, 0.5), mixLab('#efe9d2', m.halo, 0.2), Math.min(1, light));
  c.fillRect(x0, y0, SHEET.w, SHEET.h);
  if (back) {
    // the back of the sheet: a shade darker, the grid only a ghost through the paper
    c.fillStyle = withAlpha(m.set, 0.28);
    c.fillRect(x0, y0, SHEET.w, SHEET.h);
    c.globalAlpha *= 0.35;
  }
  // the log grid: bold decade lines, fine lines at 2…9 within each decade
  const grid = '#3f6f6a';
  const W = PLOT.x1 - PLOT.x0, H = PLOT.y1 - PLOT.y0;
  c.lineWidth = 0.5;
  for (let d = 0; d < DEC_X; d++) {
    for (let k = 1; k < 10; k++) {
      const x = PLOT.x0 + ((d + Math.log10(k)) / DEC_X) * W;
      c.strokeStyle = withAlpha(grid, k === 1 ? 0.85 : 0.5);
      c.lineWidth = k === 1 ? 1.1 : 0.6;
      c.beginPath();
      c.moveTo(x, PLOT.y0);
      c.lineTo(x, PLOT.y1);
      c.stroke();
    }
  }
  for (let d = 0; d < DEC_Y; d++) {
    for (let k = 1; k < 10; k++) {
      const y = PLOT.y1 - ((d + Math.log10(k)) / DEC_Y) * H;
      c.strokeStyle = withAlpha(grid, k === 1 ? 0.85 : 0.5);
      c.lineWidth = k === 1 ? 1.1 : 0.6;
      c.beginPath();
      c.moveTo(PLOT.x0, y);
      c.lineTo(PLOT.x1, y);
      c.stroke();
    }
  }
  c.strokeStyle = withAlpha(grid, 0.9);
  c.lineWidth = 1.1;
  c.strokeRect(PLOT.x0, PLOT.y0, W, H);
  // printed axis lettering, horizontal (so the arrows keep their sense): the y axis over the plot, the x axis under it;
  // both axes log scale. 13 px at L4 is ≈ 29 px cap height at 1080p from the push-in (BOARD2/3), where it is read
  // (round-1 critic: 13 px measured 17.5 px cap; 17 px clears the 22 px floor at the push-in)
  if (!back) {
    c.fillStyle = withAlpha('#2a3d3a', 0.92);
    c.font = `500 17px ${FONT.mono}`;
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.fillText('error ↓ (log scale)', PLOT.x0 - 4, PLOT.y0 - 9);
    c.textAlign = 'right';
    c.fillText('(log scale) compute →', PLOT.x1 + 6, PLOT.y1 + 24);
  }
  // the ruled line (fountain-pen ink), drawn under the nib
  if (ink > 0) {
    c.strokeStyle = '#1d2236';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(LINE.a.x, LINE.a.y);
    c.lineTo(lerp(LINE.a.x, LINE.b.x, ink), lerp(LINE.a.y, LINE.b.y, ink));
    c.stroke();
    if (gleam > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(m.core, 0.35 * gleam);
      c.lineWidth = 7;
      c.stroke();
      c.restore();
    }
  }
  // the pin
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.beginPath();
  c.arc(SHEET.x, y0 + 7, 3.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ================================================================================================= CITY
function cityCam(t: number, b: B): Camera3 {
  const g0 = b.lights - 0.1;
  if (t < g0) return mixCam(CITY0, CITY1, sm((t - b.city + 0.4) / (g0 - b.city + 0.4)));
  if (t < b.push0) return mixCam(CITY1, CITY_P, sm((t - g0) / (b.push0 - g0)));
  if (t < b.out0) return mixCam(CITY_P, CITY_W, (u => u * u * (3 - 2 * u))(clamp01((t - b.push0) / 1.0)));
  return mixCam(CITY_W, CITY_CUT, sm((t - b.out0) / 0.9));
}

function paintCity(f: Frame, t: number, b: B) {
  const cam = cityCam(t, b);
  f.camera(cam);
  const tq = tq12(t);
  const all = win(t, b.lights - 0.04, b.lights + 0.1);
  f.backlight({ sunX: 900, sunY: 560, sunRadius: 600, intensity: 0.7 });
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, CITY_CAMS, 60);
    f.cached(`${ID}/city/L1/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      stars(cc, { x: r.x, y: r.y, w: r.w, h: r.h * 0.45, count: 120, seed: 21, twinkle: 0 }, env);
      skyline(cc, { style: 'megacity', x0: r.x, x1: r.x + r.w, y: 560, height: 170, seed: 31, lit: 0.12, ground: 400 }, env);
    })(c, r.x, r.y);
  });
  f.fog({ yCenter: 0.62 * 720, height: 0.4 * 720, alpha: 0.24, drift: 6 });
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, CITY_CAMS, 60);
    f.cached(`${ID}/city/L3/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      skyline(cc, { style: 'megacity', x0: r.x, x1: r.x + r.w, y: GROUND + 20, height: 230, seed: 77, lit: 0.06, ground: 300 }, env);
    })(c, r.x, r.y);
  });
  f.fog('B');
  f.layer('L4', (c, env) => {
    const r = overscan(LAYERS.L4, CITY_CAMS, 40);
    c.fillStyle = env.fill('ink');
    c.fillRect(r.x, GROUND, r.w, r.y + r.h - GROUND);
    // the towers rise on twos (6.7 → 7.6 s) to meet the ruled line, which ends lying ON the rooftops, then sinks into them
    const rise = clamp01((tq - b.city + 0.3) / (b.rise1 - b.city + 0.3));
    TOWERS.forEach((tw, i) => {
      const local = clamp01(rise * 1.5 - (i / TOWERS.length) * 0.5);
      const st = Math.round(tw.storeys * sm(local));
      if (st <= 0) return;
      tower(c, env, tw, st, all, i === TOWERS.length - 1);
    });
    // (the ruled line over the rising roofs is the screen pass's single match stroke)
    // the brass plate at the tallest tower's foot
    plate(c, env, all);
    // the few-shot window, drawn large inside its frame when the camera is near it
    fewShot(c, env, t, b);
  });
  f.rim({ x: 0, y: -1 });
  // the spire's light (the match cut's point)
  f.practical({ x: SPIRE.x, y: SPIRE.y, kind: 'led', seed: 96, intensity: 0.4 + 0.6 * all, radius: 22 });
}

function tower(c: C, env: PaintEnv, tw: { x: number; w: number; storeys: number; roof: number }, st: number, all: number, tall: boolean) {
  const m = env.mood;
  const top = GROUND - st * STOREY;
  const done = st === tw.storeys;
  // a setback: the top storeys step in (setback towers, and the tallest twice)
  const sb1 = tall ? Math.floor(tw.storeys * 0.72) : tw.roof === 0 ? Math.floor(tw.storeys * 0.8) : tw.storeys;
  const sb2 = tall ? Math.floor(tw.storeys * 0.9) : tw.storeys;
  const inset = (r: number) => (r >= sb2 ? tw.w * 0.24 : r >= sb1 ? tw.w * 0.12 : 0);
  c.fillStyle = env.fill('ink');
  for (let r = 0; r < st; r += 1) {
    const ins = inset(r);
    if (r === 0 || inset(r) !== inset(r - 1)) {
      // draw from this row to the next change as one block
      let r2 = r;
      while (r2 < st && inset(r2) === ins) r2++;
      c.fillRect(tw.x + ins, GROUND - r2 * STOREY, tw.w - 2 * ins, (r2 - r) * STOREY);
    }
  }
  if (done) {
    const ins = inset(st - 1);
    const x0 = tw.x + ins, w = tw.w - 2 * ins, cx = tw.x + tw.w / 2;
    if (tall) {
      // a stepped crown and a tall mast with its light
      c.fillRect(x0 + 6, top - 10, w - 12, 10);
      c.fillRect(x0 + 14, top - 18, w - 28, 8);
      c.fillRect(cx - 2, top - 52, 4, 34);
    } else if (tw.roof === 1) {
      // a water tank on legs
      const tx = x0 + w * 0.55;
      c.fillRect(tx, top - 15, 12, 10);
      c.beginPath();
      c.moveTo(tx - 1, top - 15);
      c.lineTo(tx + 6, top - 20);
      c.lineTo(tx + 13, top - 15);
      c.fill();
      c.fillRect(tx + 1, top - 5, 2, 5);
      c.fillRect(tx + 9, top - 5, 2, 5);
    } else if (tw.roof === 2) {
      // a spire
      c.beginPath();
      c.moveTo(cx - w * 0.22, top);
      c.lineTo(cx, top - 26 - w * 0.3);
      c.lineTo(cx + w * 0.22, top);
      c.fill();
    } else if (tw.roof === 3) {
      // a stepped crown
      c.fillRect(x0 + w * 0.15, top - 7, w * 0.7, 7);
      c.fillRect(x0 + w * 0.3, top - 13, w * 0.4, 6);
    } else {
      c.fillRect(x0 + w * 0.3, top - 9, w * 0.4, 9);
      c.fillRect(x0 + w * 0.48, top - 22, 2, 13);
    }
  }
  // windows: one row per storey (the tallest: 96 rows, one per layer), each a bank of weights; on 'G' all at once
  const lit = mixLab(m.halo, m.core, 0.35);
  for (let r = 0; r < st; r++) {
    const ins = inset(r);
    const ww = tw.w - 2 * ins;
    const cols = Math.max(2, Math.floor((ww - 8) / 7));
    const cw = (ww - 8) / cols;
    const y = GROUND - (r + 1) * STOREY + 1.5;
    for (let k = 0; k < cols; k++) {
      const pre = hash1(r * 31 + k * 7 + tw.x, 3) > 0.82 ? 0.3 : 0.05;
      const a = Math.max(pre, all * (0.8 + 0.2 * (hash1(r * 13 + k + tw.x, 4) * 0.5 + 0.5)));
      c.fillStyle = withAlpha(lit, a);
      c.fillRect(tw.x + ins + 4 + k * cw + 1, y, cw - 2.2, STOREY - 2.6);
    }
  }
  c.fillStyle = withAlpha(m.rim, 0.25);
  c.fillRect(tw.x + inset(st - 1), top, tw.w - 2 * inset(st - 1), 1);
}

/** the brass plaque on the tallest tower's base (prop lettering), well above the bottom safe band */
function plate(c: C, env: PaintEnv, all: number) {
  const m = env.mood;
  const x = PLATE.x, y = PLATE.y;
  const w = TALL.w + 24, h = 52;
  c.save();
  c.fillStyle = withAlpha(m.ink, 0.9);
  c.fillRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8);
  c.fillStyle = mixLab('#a8803e', m.set, 0.45 - 0.3 * all);
  c.fillRect(x - w / 2, y - h / 2, w, h);
  c.strokeStyle = withAlpha(m.core, 0.3 + 0.5 * all);
  c.lineWidth = 1.2;
  c.strokeRect(x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8);
  c.fillStyle = mixLab('#2a1d0c', m.ink, 0.2);
  c.font = `500 19px ${FONT.mono}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('175 BILLION', x, y - 10);
  c.fillText('WEIGHTS', x, y + 12);
  if (all > 0) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    const p = 0.2 + 0.6 * all;
    g.addColorStop(Math.max(0, p - 0.2), withAlpha(m.core, 0));
    g.addColorStop(p, withAlpha(m.core, 0.3 * all));
    g.addColorStop(Math.min(1, p + 0.2), withAlpha(m.core, 0));
    c.fillStyle = g;
    c.fillRect(x - w / 2, y - h / 2, w, h);
  }
  c.restore();
}

/** few-shot pairs: plain word → answer strips (opposites); the fourth completes the pattern by itself */
const FEW = [
  ['hot', 'cold'],
  ['up', 'down'],
  ['big', 'small'],
  ['fast', 'slow'],
] as const;
/**
 * The few-shot window: as the camera pushes into one lit window near the roofline, the window opens up into a
 * close view: three worked strips (a word and its answer) hang; on the fourth, the answer sets itself letter by
 * letter. Nothing in the tower is re-cut.
 */
function fewShot(c: C, env: PaintEnv, t: number, b: B) {
  const show = win(t, b.push0 + 0.45, b.push0 + 0.95) * (1 - win(t, b.out0 + 0.05, b.out0 + 0.45));
  if (show <= 0.01) return;
  const m = env.mood;
  const tq = tq12(t);
  const W = FEW_WIN.w, H = FEW_WIN.h;
  const x0 = FEW_WIN.x - W / 2, y0 = FEW_WIN.y - H / 2;
  c.save();
  // one of the tower's own windows: clipped to the facade, set in a deep ink frame with a sill
  c.beginPath();
  c.rect(TALL.x, y0 - 20, TALL.w, H + 40);
  c.clip();
  c.globalAlpha *= show;
  c.fillStyle = env.fill('ink');
  c.fillRect(x0 - 6, y0 - 6, W + 12, H + 14);
  const g = c.createLinearGradient(0, y0, 0, y0 + H);
  g.addColorStop(0, mixLab(m.halo, m.core, 0.5));
  g.addColorStop(1, mixLab(m.halo, m.set, 0.2));
  c.fillStyle = g;
  c.fillRect(x0, y0, W, H);
  // the transom and its mullion: the upper lights, the strips hang from the transom bar
  const TR = 10;
  c.fillStyle = env.fill('ink');
  c.fillRect(x0, y0 + TR, W, 2.2);
  c.fillRect(x0 + W / 2 - 1.1, y0, 2.2, TR);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(x0 - 6, y0 + H + 6, W + 12, 1.2);
  // (round-1 critic: 6.2 px measured 17.3 px cap; 8.6 px clears the 22 px floor at the push-in)
  c.font = `500 9px ${FONT.mono}`;
  c.textBaseline = 'middle';
  const SH = 13, PITCH = (H - TR - 6) / 4;
  for (let i = 0; i < 4; i++) {
    const sy = y0 + TR + 5 + i * PITCH;
    const appear = i < 3 ? win(t, b.few - 0.35 + i * 0.25, b.few - 0.1 + i * 0.25) : win(t, b.few + 0.6, b.few + 0.9);
    if (appear <= 0) continue;
    c.save();
    c.globalAlpha *= appear;
    c.translate(0, (1 - appear) * -3);
    c.strokeStyle = env.fill('ink');
    c.lineWidth = 0.35;
    c.beginPath();
    c.moveTo(x0 + 14, sy - 3);
    c.lineTo(x0 + 14, sy);
    c.moveTo(x0 + W - 14, sy - 3);
    c.lineTo(x0 + W - 14, sy);
    c.stroke();
    c.fillStyle = mixLab('#efe9d2', m.halo, 0.15);
    c.fillRect(x0 + 5, sy, W - 10, SH);
    const [w1, w2] = FEW[i];
    c.fillStyle = '#1d2236';
    c.textAlign = 'right';
    c.fillText(w1, x0 + W / 2 - 8, sy + SH / 2 + 0.4);
    c.textAlign = 'center';
    c.fillText('→', x0 + W / 2, sy + SH / 2 + 0.2);
    c.textAlign = 'left';
    const n = i < 3 ? w2.length : Math.floor(w2.length * clamp01((tq - b.fill0) / 0.6) + 1e-6);
    c.fillText(w2.slice(0, n), x0 + W / 2 + 8, sy + SH / 2 + 0.4);
    if (i === 3 && n < w2.length) {
      c.strokeStyle = withAlpha('#1d2236', 0.45);
      c.lineWidth = 0.3;
      c.setLineDash([1, 1]);
      c.strokeRect(x0 + W / 2 + 7, sy + 2, 26, SH - 4);
      c.setLineDash([]);
    }
    if (i === 3 && tq >= b.fill0 && tq < b.fill0 + 1.2) {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(m.core, 0.4 * (1 - clamp01((tq - b.fill0 - 0.6) / 0.6)));
      c.fillRect(x0 + W / 2 + 5, sy, 30, SH);
    }
    c.restore();
  }
  c.restore();
}

// ================================================================================================= SHELF + WALL
/** how strongly the new candle is being named (the kit's naming card): from the lighting to the crane */
function nameK(t: number, b: B): number {
  return win(t, b.cut + 0.35, b.cut + 0.85) * (1 - win(t, b.crane0 - 0.1, b.crane0 + 0.35));
}

function shelfCam(t: number, b: B): Camera3 {
  if (t < b.crane0) return mixCam(SHELF0, SHELF1, sm((t - b.cut - 1.2) / (b.crane0 - b.cut - 1.2)));
  if (t < b.wall) {
    // a slow start (cubic in-out over 1.5 s)
    const x = clamp01((t - b.crane0) / (b.wall - b.crane0));
    const u = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const m = mixCam(SHELF1, WALL0, u);
    return { ...m, z: m.z - 110 * Math.sin(Math.PI * u) };
  }
  return mixCam(WALL0, WALL1, sm((t - b.wall) / (b.D - b.wall)));
}

function paintShelfWall(f: Frame, t: number, b: B) {
  const cam = shelfCam(t, b);
  f.camera(cam);
  const mu = win(t, b.cut, b.cut + 1.0);
  if (mu < 1) f.setMood('candleAmber', { from: 'serverCyan', u: mu });
  studyRoom(f, { key: ID, cams: STUDY_CAMS, outside: { mood: 'serverCyan', kind: 'city', city: 0.5 } });
  const g2 = Math.exp(-Math.pow((t - b.glint - 0.1) / 0.28, 2));
  const wl = 0.95 * win(t, b.wall - 0.7, b.wall);
  studyCase(f, {
    shot: ID,
    when: 'end',
    key: ID,
    board: { state: ch11Board(ID, 'end') },
    flames: false,
    // the candle naming rule (kit): the label comes forward beside the flame, horizontal, with its date range
    // ('lit 2020 · still burning'), and its neighbours dim; held from the lighting to the crane, so the kit card is
    // the candle's label (no duplicate of our own); the script's 'contested, as of October 2026' is set beneath
    // the kit's naming card is off: this shot sets the hero label itself (heroLabel, sized to the legibility audit)
    shelf: { over: { scale: { flame: 1 } }, named: {} },
    wall: { glint: { W4: g2 } },
    extra: (c, env) => {
      drawLineage(c, env);
      for (const g of [CARD19, CARD85]) drawQuoteCard(c, env, g, { light: poolAt(POOL, g.x - STUDY.board.x, g.y - STUDY.board.y) + 0.2, underline: 1 });
      // the W4 slip catches the light fully as the camera arrives
      if (wl > 0.01) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        // a raking fill from the lamp side: the slip lit like the board's best card
        const gg = c.createRadialGradient(W4.x - 10, W4.y + 6, 8, W4.x, W4.y, 150);
        gg.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.3), 0.55 * wl));
        gg.addColorStop(0.5, withAlpha(env.mood.halo, 0.22 * wl));
        gg.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = gg;
        c.fillRect(W4.x - 150, W4.y - 150, 300, 300);
        c.restore();
      }
      void W4_PIN;
    },
  });
  for (const v of V1) {
    if (v.state !== 'live') continue;
    const p = candleFlame({ x: candleX(V1, v.id), y: STUDY.shelf.y, view: v, s: STUDY.shelf.s });
    const hero = v.id === 'scale';
    // the new flame flares as it is born from the roofline light, then settles
    const k = hero ? 1 + 0.6 * Math.exp(-(t - b.cut) * 3) : 1;
    f.practical({ x: p.x, y: p.y + 2, kind: 'candle', seed: 300 + v.slot * 7, intensity: 0.9 * k, radius: hero ? 52 : 40 });
  }
  // L5: the near end of the shelf plank and its scrolled bracket, soft in the foreground (lower right), so the push
  // and the crane slide a third plane against the candles and the wall
  f.layer('L5', (c, env) => {
    const k = NEAR.k;
    const w = 440 / k, h = 300 / k;
    f.cached(`${ID}/L5shelf/${env.mood.id}`, Math.ceil(w) + 4, Math.ceil(h) + 4, (cc) => {
      cc.scale(1 / k, 1 / k);
      // the shelf's near end, swinging toward the lens: its plank a dark wedge rising out of the lower-right corner,
      // its scalloped apron and lamp-lit lip echoing the shelf behind it (art origin = screen (860, 560))
      const lip = (x: number) => 150 - (x / 420) * 110;
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.moveTo(0, lip(0));
      cc.lineTo(420, lip(420));
      cc.lineTo(420, 300);
      cc.lineTo(0, 300);
      cc.closePath();
      cc.fill();
      // the apron's scallops hanging under the plank's front
      cc.beginPath();
      for (let x = 0; x < 420; x += 34) {
        const y = lip(x) + 30;
        cc.moveTo(x, y);
        cc.quadraticCurveTo(x + 17, y + 26 - (x / 420) * 10, x + 34, lip(x + 34) + 30);
      }
      cc.lineTo(420, 300);
      cc.lineTo(0, 300);
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.55);
      cc.lineWidth = 2.5;
      cc.beginPath();
      cc.moveTo(0, lip(0));
      cc.lineTo(420, lip(420));
      cc.stroke();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.2);
      cc.lineWidth = 1.5;
      cc.beginPath();
      cc.moveTo(0, lip(0) + 28);
      cc.lineTo(420, lip(420) + 28);
      cc.stroke();
    }, { blur: 7 })(c, NEAR.x, NEAR.y);
  });
  void V0;
  void softPlate;
  void MOODS;
}
