/**
 * ch11-s05 — a smooth law, a city of weights, a new candle (candleAmber → serverCyan → candleAmber; 22.75 s; cut in).
 *
 * CAMERA: BOARD (the log-log sheet in the lamp's pool, the Wall's W4 at the right edge) → the sheet tilts back into a
 * night CITY (serverCyan) → a push into one lit window near the roofline → back out to the tallest roofline → a
 * MATCH CUT to the new candle's flame on the SHELF (candleAmber) → a crane up to the WALL (W4).
 *   lead-in    the hands pin a sheet of log-log paper on the board (both axes printed 'log scale' and named, round-1
 *              review: 'error ↓' over the plot, 'compute →' under it, so the flip to a rising skyline reads as
 *              intended; the x ticks span eight powers of ten). 2020 bottom-left
 *   'waiting'  the W4 slip (AlexNet's 'waiting' note, 2012) catches the lamp at the right edge of frame, its pin
 *              glinting, held through 'note' (round 3); only then does the push onto the log-log chart begin
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
 * ROUND-4 REVISE (critic): on 'lower' a pale amber GHOST of the paper's descending line hangs in the sky (L2, behind the
 *   towers) until 'G', so the rising roofline and the falling error line cross while the law is stated; the brass plate
 *   stays unlit dark texture until 'G' and lifts with the window snap (one-frame glint on its top edge); the ruled line
 *   holds as dark ink until the paper is visibly tipping; each tower is hand-cut (a 1-2 px seeded wobble on its edges,
 *   ≈8 % of windows dark until 'G'), the tallest crowned with a pierced cut-paper sunburst on a podium; the GPT push
 *   keeps that crown inside the top safe line; the shelf hold gains a far plane (the Wall's foot, in haze) and a faint
 *   lamp shaft; W6's upper-left corner catches the lamp; the Wall framing drops its top row clear of the top edge; the
 *   opening board sinks its cropped left column into the haze and lets the lamp's pool reach toward the Wall.
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down one
 * ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import type { FilmFrame } from '../../../film';
import { LAYERS, MOODS, defineShot, dustMotes, godRays, hash1, mixLab, overscan, paperTexture, skyline, stars, toLayer, toScreen, vnoise, withAlpha } from '../../../film';
import { FONT, cardProbe, legibleSize, textRole } from '../../../film/silhouette/type';
import { HAND_LEN, type Pt } from '../sets/narratorHands';
import { STUDY, candleX, studyCase, studyNear, studyRoom, wallSlotWorld } from '../sets/study';
import { shelfStateAt, wallStateAt } from '../sets/studyState';
import { drawSlip, slotLight } from '../sets/wallOfForecasts';
import { candleFlame, candleShelf } from '../sets/beliefCandle';
import { screenPass } from '../sets/ch06-s01-kit';
import { CARD19, CARD85, ch11Board, drawLineage, drawQuoteCard } from '../sets/ch11-s02-cards';
import { DEFAULT_POOL, caseBoard, poolAt } from '../sets/caseBoard';
import { bentArm, clamp01, compositeSub, lerp, mixCam, sm, softPlate, subFrame, tq12, win } from '../sets/ch11-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch11-s05';
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };

// ------------------------------------------------------------------------------------------------ the log-log sheet
/** pinned just below the GPT card at the head of C4 (clear of it), over the top margin of the two 2019/1985 cards */
/** round-2 revise: shorter and a touch wider, so it hangs clear of BOTH ch11-s02 cards below it (their tops at y 401:
 *  no orphaned lines of the Cyc quote under its edge) and clear of the GPT card above it */
const SHEET = { x: 1000, y: 316, w: 292, h: 176 };
/** the plot: a header line above it (the y axis: error ↓), decade numerals on both axes, the x axis label under it */
const PLOT = { x0: SHEET.x - SHEET.w / 2 + 30, x1: SHEET.x + SHEET.w / 2 - 14, y0: SHEET.y - SHEET.h / 2 + 30, y1: SHEET.y + SHEET.h / 2 - 44 };
const DEC_X = 8, DEC_Y = 3;
/** the ruled line: from upper left to lower right (a power law is straight on log-log axes) */
const LINE = { a: { x: PLOT.x0 + 8, y: PLOT.y0 + 10 }, b: { x: PLOT.x1 - 8, y: PLOT.y1 - 12 } };
const W4 = wallSlotWorld('W4');
/** round-3 review: a visible brass pin at the W4 slip's top centre, ABOVE its header line (the kit's glint star sat on
 *  'KRIZHEVSKY, SUTSKEVER & HINTON · 2012' and hid 'SUTSKEVER'): both W4 glints land on this pin, star arms ≤ 40 px */
const W4_PIN = { x: W4.x, y: W4.y - (96 * 0.95) / 2 + 1.2 };
/** round-3 review (teacher): the 2012 waiting-note card itself catches the lamp on 'waiting note', before the
 *  log-log chart takes the frame (the callback lands for the eye as well as the ear). Its own words, as pinned in
 *  ch08-s14 (studyState W4): */
const W4_TEXT = '…simply by waiting for faster GPUs and bigger datasets…';
const W4_SLIP = (() => {
  const v = wallStateAt('ch11-s05', 'start').find((s) => s.slot === 'W4')!;
  return { ...v, text: W4_TEXT };
})();
/** the slip's footprint (L4 world, the wall's k = 0.95) */
const W4_W = 128 * 0.95, W4_H = 96 * 0.95;

// ------------------------------------------------------------------------------------------------ shelf
const V0 = shelfStateAt(ID, 'start');
const V1 = shelfStateAt(ID, 'end');
const SX = candleX(V1, 'scale');
const SCALE_V = V1.find((v) => v.id === 'scale')!;
const FLAME = candleFlame({ x: SX, y: STUDY.shelf.y, view: SCALE_V, s: STUDY.shelf.s });

// ------------------------------------------------------------------------------------------------ cameras
/** round-2 revise: framed so the WHO TAUGHT IT? card (its right edge at x ≈ 725) is wholly OUT of frame left (no
 *  partial word), while the W4 slip and its pin stay in frame right for the 'waiting' glint */
const BOARD0: Camera3 = { x: 1236, y: 318, z: 230, lens: 1 };
/** round-3: the opening drift leans a touch TOWARD the W4 slip (right and in) while 'waiting note' is said */
const BOARD1: Camera3 = { x: 1252, y: 316, z: 264, lens: 1 };
/** the push in (≈1.6×) on the sheet, 3.0 → 5.5 s; the sheet a little left of centre so the pen hand reads whole */
const BOARD2: Camera3 = { x: 1040, y: 320, z: 535, lens: 1 };
const BOARD3: Camera3 = { x: 1040, y: 324, z: 560, lens: 1 };
/** the match cut: the city's roofline light and the candle flame land on the same screen point (high in frame, so
 *  the shelf framing tilts down past the chat box's foot) */
const CUT_PT = { x: 640, y: 150 };
/** round-2 revise: a LOW MACRO: ≈1.3× closer than the first cut (z 500) and dropped so the flame rides high in frame,
 *  the board's cropped cards and the cabinet gone above the top edge, the candles' long bodies filling the frame */
const SH_Z0 = 500;
const SHELF0: Camera3 = { x: FLAME.x, y: FLAME.y + (360 - CUT_PT.y) / (1000 / (1000 - SH_Z0)), z: SH_Z0, lens: 1 };
/** the L5 near candle's anchor: its art's top-left lands at screen (-30, 250) on the shelf's first frame */
const NEAR = (() => {
  const p = toLayer(LAYERS.L5, SHELF0, -30, 250);
  return { x: p.x, y: p.y, k: toScreen(LAYERS.L5, SHELF0, p.x, p.y).k };
})();
/** round-2 revise: the hold DRIFTS (a 3% push and a ≈40 px truck right, toward the Wall), so the crane continues a
 *  motion already under way instead of starting cold */
/** round-3 review: an eased 4 % push TOWARD the new candle over the hold (z 500 → 519 is k 2.00 → 2.08), drifting so the
 *  flame settles a little right of centre and the label beside it fills the frame's right side */
const SH_Z1 = 519;
const SHELF1: Camera3 = { x: FLAME.x - 34 / (1000 / (1000 - SH_Z1)), y: FLAME.y + (360 - CUT_PT.y + 6) / (1000 / (1000 - SH_Z1)), z: SH_Z1, lens: 1 };
/** round-3 review: no crane (it was a 0.6 s whip over an empty wall): a straight CUT to the Wall on the wallW4 beat,
 *  then a slow 3 % push in, so the W4 glint lands at w4glint. Framed with W4 at left of centre, W6's half-lit corner to
 *  its right and the foot of W7 at the top right (z 640 → 651 is k 2.78 → 2.87) */
const W6 = wallSlotWorld('W6');
const W6_SLIP = wallStateAt('ch11-s05', 'end').find((s) => s.slot === 'W6')!;
/** round-4 critic: the framing drops ≈20 px (screen) so the top row's headers (ROSENBLATT · 1961, HINTON · SEPT 2017)
 *  clear the frame's top edge */
const WALL0: Camera3 = { x: W4.x + 58, y: W4.y - 72, z: 594, lens: 1 };
const WALL1: Camera3 = { x: W4.x + 54, y: W4.y - 70, z: 605, lens: 1 };
const STUDY_CAMS = [BOARD0, BOARD1, BOARD2, BOARD3, SHELF0, SHELF1, WALL0, WALL1];

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
/** round-4 critic: the plate sits on the tallest tower's PODIUM (a wider two-tier base), a little higher than before,
 *  so the GPT push can hold the cut-paper crown inside the top safe line AND read the plate above the bottom band */
const PODIUM = { x: TALL.x - 14, w: TALL.w + 28, h: 84 };
const PLATE = { x: TALL.x + TALL.w / 2, y: GROUND - 56 };
const CITY0: Camera3 = { x: 650, y: 372, z: -70, lens: 1 };
const CITY1: Camera3 = { x: 664, y: 352, z: -24, lens: 1 };
const CITY_W: Camera3 = { x: FEW_WIN.x, y: FEW_WIN.y, z: 760, lens: 1 };
/** on 'GPT' every window lights and the camera pushes in (≈6 %) toward the tower; round-4 critic: z 86 cropped the
 *  96-storey crown off the top from ≈10 s, so the push is shallower and framed higher: the crown's top lands at y ≈ 36,
 *  the plate's lettering above y ≈ 634 */
const CITY_P: Camera3 = { x: lerp(664, PLATE.x, 0.45), y: 316, z: 30, lens: 1 };
const CITY_CAMS = [CITY0, CITY1, CITY_P, CITY_CUT, { ...CITY_W, z: 400 }];
/** the L5 near rooftop's anchor: its art's top-left lands at screen (-60, 610) on the city's first frame (the bottom
 *  15% of the frame) */
const CITY_NEAR = (() => {
  const p = toLayer(LAYERS.L5, CITY0, -60, 492);
  return { x: p.x, y: p.y, k: toScreen(LAYERS.L5, CITY0, p.x, p.y).k };
})();
/** round-4 critic (teaching): the GHOST of the paper's descending ruled line, kept in the sky (L2, behind the towers) from
 *  'lower' to 'G': from upper left, over the short towers, down to lower right where it passes behind the tall ones, so
 *  the rising roofline (size) and the falling line (error) cross while the narrator says 'bigger models, lower error' */
const GHOST = (() => {
  const a = toLayer(LAYERS.L2, CITY1, 70, 118);
  const z = toLayer(LAYERS.L2, CITY1, 1060, 318);
  return { a, z, k: toScreen(LAYERS.L2, CITY1, a.x, a.y).k };
})();

// ------------------------------------------------------------------------------------------------ the shelf's far plane
/** round-4 critic: the right of the shelf hold was flat brown; the Wall of Forecasts' FOOT hangs there in the haze (its
 *  cork face and lower frame moulding, a far plane ≈30 % into the haze), authored in screen px at SHELF0 */
const SHELF_FAR = (() => {
  const a = toLayer(LAYERS.L2, SHELF0, 690, 90);
  const z = toLayer(LAYERS.L2, SHELF0, 1400, 740);
  return { a, z, k: toScreen(LAYERS.L2, SHELF0, a.x, a.y).k };
})();
/** the shelf hold's lamp shaft (screen px): from beyond the upper right, down-left across the candles' bodies */
const SHELF_BEAM = { x0: 1200, y0: -90, w0: 120, x1: 1200 - 1150 * 0.78, y1: -90 + 1150 * 0.63, w1: 250 };

interface B {
  D: number;
  pin: number;
  florence: number;
  /** 'waiting' → end of 'note': the W4 slip catches the lamp */
  wait0: number;
  wait1: number;
  pen0: number;
  rule0: number;
  law: number;
  tilt0: number;
  /** 'lower' (the ghost of the falling line rises 0.15 s before it) */
  lower: number;
  city: number;
  rise1: number;
  lights: number;
  push0: number;
  few: number;
  fill0: number;
  out0: number;
  cut: number;
  /** the straight cut from the shelf to the Wall (the wallW4 beat) */
  wallCut: number;
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
      wait0: T.word('L1110', 'waiting'),
      wait1: T.wordEnd('L1110', 'note'),
      pen0: law - 1.1,
      // round-2 revise: the stroke starts on 'predictable' and ends on 'law'
      rule0: T.word('L1110', 'predictable'),
      law,
      tilt0: T.word('L1110', 'bigger') - 0.14,
      lower: T.word('L1110', 'lower'),
      city: T.word('L1110', 'bigger') + 0.46,
      rise1: T.word('L1110', 'bigger') + 1.06,
      // every window lights on 'G' in a 2-frame snap (done the frame before the word)
      lights: T.word('L1110', 'G') - 0.04,
      push0: few - 0.95,
      few,
      fill0: T.word('L1110', 'untaught') - 0.9,
      out0: T.word('L1110', 'untaught') + 0.15,
      cut,
      wallCut: T.beat('wallW4'),
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
  // round-2 revise: a dark backing scrim, so the stamp never sits on a card's lettering
  softPlate(c, 92, 664, 420, 210, m.ink, 1.0 * A);
  softPlate(c, 96, 652, 260, 120, m.ink, 0.75 * A);
  // review round 4 (ghost-text audit: the GPT-2 card's 'OpenAI, 2019' foot read through the soft scrim beside '2020'
  // for 2.5 s): a solid ink tag right behind the stamp, so no card lettering shows under or beside it
  c.font = `500 ${size}px ${FONT.mono}`;
  const tw = c.measureText(text).width;
  c.globalAlpha = 0.94 * A;
  c.fillStyle = m.ink;
  c.beginPath();
  c.roundRect(34, 668 - size - 16, tw + 120, size + 32, 6);
  c.fill();
  c.globalAlpha = A;
  c.fillStyle = mixLab(m.core, '#ffffff', 0.35);
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
  // round-3 review: a little lower, the plate centred on the candle's upper third
  const x = fs.x + 58, y = fs.y + 96;
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
/**
 * Round-2 legibility hand-off: the case board's own lettering is SET DRESSING in this shot (the sheet on it is the
 * subject; the 1943 card's 'THE NET DOES NOT' only matched the narrator's "AlexNet's"), and the new candle's own
 * sleeve lettering is texture beside its hero label (which carries 'SCALE IS THE / MAIN LEVER' at 37 px cap). Both
 * are painted in their own L4 pass, before the case (so the stacking order is unchanged: board and shelf under the
 * Wall, the X-ray box and the hands), inside textRole(c, 'texture').
 */
function textureCase(f: Frame, when: 'start' | 'end', shelf: boolean) {
  f.layer('L4', (c, env) =>
    textRole(c, 'texture', () => {
      caseBoard(c, { ...STUDY.board, state: ch11Board(ID, when), pool: { ...DEFAULT_POOL, ...STUDY.pool, k: 1, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y } }, env);
      if (shelf) candleShelf(c, { ...STUDY.shelf, views: V1, drawFlames: false, over: { scale: { flame: 1 } }, named: {} }, env);
    }),
  );
}
const DATE_PX = 36;
const LABEL_PX = 36;
const SUB_PX = 26;

// ================================================================================================= BOARD
function boardCam(t: number, b: B): Camera3 {
  // round-3: hold the wide (sheet left, the W4 slip right) through 'waiting note'; the push onto the log-log chart
  // starts only once 'note' has been said, and lands as 'law' is ruled
  const p0 = b.wait1 + 0.05, p1 = b.law + 0.05;
  if (t < p0) return mixCam(BOARD0, BOARD1, sm(t / p0));
  if (t < p1) return mixCam(BOARD1, BOARD2, sm((t - p0) / (p1 - p0)));
  return mixCam(BOARD2, BOARD3, sm((t - p1) / (b.city + 0.4 - p1)));
}

/** the W4 slip's brass pin (L4 world, drawn over the kit's small pin head), and its glint: a soft glow and a four-point
 *  star whose arms stay ≤ 40 px at 1080p, the downward arm short so it never reaches the slip's header lettering */
function w4Pin(c: C, env: PaintEnv, glint: number, kL4: number) {
  const m = env.mood;
  const p = W4_PIN;
  const r = 3.8;
  c.save();
  c.fillStyle = withAlpha(m.fg, 0.45);
  c.beginPath();
  c.arc(p.x + 1.2, p.y + 1.6, r, 0, Math.PI * 2);
  c.fill();
  const brass = c.createRadialGradient(p.x - 1.4, p.y - 1.6, 0.4, p.x, p.y, r);
  brass.addColorStop(0, mixLab('#f3dca0', m.core, 0.3));
  brass.addColorStop(0.55, mixLab('#b88a3e', m.halo, 0.2));
  brass.addColorStop(1, mixLab('#6a4a1c', m.set, 0.3));
  c.fillStyle = brass;
  c.beginPath();
  c.arc(p.x, p.y, r, 0, Math.PI * 2);
  c.fill();
  if (glint > 0.01) {
    const arm = Math.min(14, 40 / (1.5 * Math.max(0.3, kL4))); // ≤ 40 px at 1080p
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, arm);
    g.addColorStop(0, withAlpha(mixLab(m.core, '#ffffff', 0.4), 0.85 * glint));
    g.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = g;
    c.fillRect(p.x - arm, p.y - arm, 2 * arm, 2 * arm);
    c.strokeStyle = withAlpha(mixLab(m.core, '#ffffff', 0.5), 0.85 * glint);
    c.lineWidth = Math.max(0.5, 1.4 / Math.max(0.3, kL4));
    c.beginPath();
    c.moveTo(p.x - arm * glint, p.y);
    c.lineTo(p.x + arm * glint, p.y);
    c.moveTo(p.x, p.y - arm * 0.8 * glint);
    c.lineTo(p.x, p.y + 3 * glint);
    c.stroke();
  }
  c.restore();
}

/** the W4 slip catching the lamp: up on 'waiting', held through 'note', easing off as the push leaves it */
function w4Lift(t: number, b: B): number {
  return win(t, b.wait0 - 0.12, b.wait0 + 0.3) * (1 - win(t, b.wait1 + 0.3, b.wait1 + 0.95));
}
/** the slip's screen rect under a camera (padded a little for its seeded tilt) */
function w4Rect(cam: Camera3) {
  const a = toScreen(LAYERS.L4, cam, W4.x - W4_W / 2 - 4, W4.y - W4_H / 2 - 4);
  const z = toScreen(LAYERS.L4, cam, W4.x + W4_W / 2 + 4, W4.y + W4_H / 2 + 4);
  return { x: a.x, y: a.y, w: z.x - a.x, h: z.y - a.y };
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
  textureCase(f, 'start', false);
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: false,
    wall: { glint: { W4: 0 } },
    extra: (c, env) => {
      drawLineage(c, env);
      // ch11-s02's two cards still hang below C4, whole (the sheet now clears their tops), but sunk into the
      // background plane: a touch soft and out of the lamp's sliver, so the sheet is the one sharp plane
      for (const g of [CARD19, CARD85]) drawQuoteCard(c, env, g, { light: poolAt(POOL, g.x - STUDY.board.x, g.y - STUDY.board.y) - 0.05, underline: 1, blur: 1.6 });
      // round-3 (teacher): on 'waiting note' the 2012 slip itself catches the lamp: re-laid over the wall's dim copy
      // with its paper lifted toward full light and its pin glinting
      const lift = w4Lift(t, b);
      if (lift > 0.01) {
        c.save();
        c.globalAlpha *= lift;
        drawSlip(c, W4_SLIP, { x: W4.x, y: W4.y, k: STUDY.wall.k, light: lerp(slotLight('W4'), 1, 0.85), glint: 0, pin: false }, env);
        // its brass pin above the header (the glint itself rides over the lamp's falloff in the screen pass)
        w4Pin(c, env, 0, toScreen(LAYERS.L4, cam, 0, 0).k);
        c.restore();
      }
      // the log-log sheet: already pinned (round-1 critic: no hand in the lead-in, so the pen's entry at ≈4.7 s is
      // the one motivated hand move), ruled on 'law', then on 'bigger' it tilts back AND turns over about its vertical
      // axis, so the falling line visibly becomes a rising one (the bright stroke is carried by the screen pass)
      const fl = flipAt(t, b);
      // round-4 critic: the payoff of 'smooth, predictable law' holds as DARK INK (the gleam is a brief pulse on 'law'
      // that settles low), and the sheet keeps its own ink until tilt0 + 0.2 s, when the match stroke takes it over
      const ink = t < b.tilt0 + 0.2 ? inkAt(tq, b) : 0;
      const gleam = win(t, b.law - 0.1, b.law + 0.35) * (1 - 0.8 * win(t, b.law + 0.45, b.law + 0.95));
      sheet(c, env, SHEET.x, SHEET.y, fl.sy, ink, gleam, fl.persp, fl.cos, win(t, b.tilt0 - 0.15, b.tilt0 + 0.15));
      // the pen rules the line: its nib travels ON the line, and the inked stroke ends exactly at the nib
      if (tq >= b.pen0 && tq < b.law + 0.7) pen(c, env, nibAt(tq, b));
    },
  });
  if (cam.z < 330) studyNear(f, { key: ID, cams: STUDY_CAMS.filter((q) => q.z < 330), file: true });
  // round-2 revise: a real SLIVER of lamp light on the sheet: a warm pool ≈700 px (1080p) across centred on it, and
  // everything outside falls ≈50% darker on a soft falloff, so the sheet is the one bright, sharp action plane
  screenPass(f, (c) => {
    const m = f.mood;
    const sp = toScreen(LAYERS.L4, cam, SHEET.x, SHEET.y + 6);
    const k = sp.k;
    const dim = c.createRadialGradient(sp.x, sp.y, 150 * k, sp.x, sp.y, 340 * k);
    dim.addColorStop(0, withAlpha(m.fg, 0));
    dim.addColorStop(0.55, withAlpha(m.fg, 0.32));
    dim.addColorStop(1, withAlpha(m.fg, 0.52));
    c.fillStyle = dim;
    // round-3: while the W4 slip catches the lamp ('waiting note') the falloff spares it, so it reads as lit paper
    const lift = w4Lift(t, b);
    const wr = w4Rect(cam);
    c.save();
    if (lift > 0.01) {
      c.beginPath();
      c.rect(-4, -4, 1288, 728);
      c.rect(wr.x, wr.y, wr.w, wr.h);
      c.clip('evenodd');
    }
    c.fillRect(-4, -4, 1288, 728);
    c.restore();
    // round-4 critic: the cropped C1/C2 column at the left edge ('ATA', 'RE', '012') sinks ≈30 % further into the haze,
    // so it reads as texture; the falloff is pinned to the board (world x 700 → 850), so it rides the push
    {
      const l0 = toScreen(LAYERS.L4, cam, 700, 0).x, l1 = toScreen(LAYERS.L4, cam, 850, 0).x;
      if (l1 > 0) {
        const lg = c.createLinearGradient(l0, 0, l1, 0);
        lg.addColorStop(0, withAlpha(mixLab(m.fg, m.haze, 0.3), 0.34));
        lg.addColorStop(1, withAlpha(mixLab(m.fg, m.haze, 0.3), 0));
        c.fillStyle = lg;
        c.fillRect(-4, -4, l1 + 4, 728);
      }
    }
    if (lift > 0.01) {
      c.save();
      c.globalAlpha = 1 - lift;
      c.fillRect(wr.x, wr.y, wr.w, wr.h);
      c.restore();
      // a warm raking sheen from the lamp side across the slip, and a soft halo around it
      c.save();
      c.globalCompositeOperation = 'lighter';
      const cx = wr.x + wr.w / 2, cy = wr.y + wr.h / 2;
      const sh = c.createRadialGradient(wr.x + wr.w * 0.2, wr.y + wr.h * 0.3, 4, cx, cy, wr.w * 0.95);
      sh.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.3), 0.2 * lift));
      sh.addColorStop(0.6, withAlpha(m.halo, 0.07 * lift));
      sh.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = sh;
      c.fillRect(cx - wr.w, cy - wr.w, 2 * wr.w, 2 * wr.w);
      c.restore();
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    const pool = c.createRadialGradient(sp.x, sp.y, 10, sp.x, sp.y, 200 * k);
    pool.addColorStop(0, withAlpha(m.halo, 0.1));
    pool.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = pool;
    c.fillRect(sp.x - 200 * k, sp.y - 200 * k, 400 * k, 400 * k);
    // round-4 critic: the lamp pool's falloff reaches across the empty wall between the rack and the Wall, a soft warm
    // path from the sheet toward W4 for the 'waiting' glint to travel along (it eases off as the push leaves the wide)
    {
      const pathK = 1 - 0.7 * win(t, b.wait1, b.law);
      const wc = { x: wr.x + wr.w / 2, y: wr.y + wr.h / 2 };
      const mx = lerp(sp.x, wc.x, 0.58), my = lerp(sp.y, wc.y, 0.58);
      const R = Math.hypot(wc.x - sp.x, wc.y - sp.y) * 0.62;
      c.save();
      c.translate(mx, my);
      c.rotate(Math.atan2(wc.y - sp.y, wc.x - sp.x));
      c.scale(1, 0.62);
      const pg = c.createRadialGradient(0, 0, 4, 0, 0, R);
      pg.addColorStop(0, withAlpha(mixLab(m.halo, m.set, 0.25), 0.12 * pathK));
      pg.addColorStop(0.6, withAlpha(m.halo, 0.05 * pathK));
      pg.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = pg;
      c.fillRect(-R, -R, 2 * R, 2 * R);
      c.restore();
    }
    // round-3 review: the lamp's pool rises on the W4 slip to ≈ 0.5 for 0.6 s around the 'waiting' glint, so the eye
    // finds the slip in the wide (it sits at the frame's right edge)
    const fp = win(t, b.florence - 0.3, b.florence - 0.1) * (1 - win(t, b.florence + 0.3, b.florence + 0.55));
    if (fp > 0.01) {
      const cx = wr.x + wr.w / 2, cy = wr.y + wr.h / 2, R = Math.max(wr.w, wr.h) * 1.15;
      const pg = c.createRadialGradient(cx, cy, R * 0.15, cx, cy, R);
      pg.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.35), 0.5 * fp));
      pg.addColorStop(0.55, withAlpha(m.halo, 0.2 * fp));
      pg.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = pg;
      c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    }
    // the W4 pin's glint on 'waiting' rides over the falloff (the slip itself is lifted out of it above)
    const g1 = Math.exp(-Math.pow((t - b.florence - 0.15) / 0.22, 2));
    if (g1 > 0.01) {
      const pp = toScreen(LAYERS.L4, cam, W4_PIN.x, W4_PIN.y);
      const gg = c.createRadialGradient(pp.x, pp.y, 1, pp.x, pp.y, 26);
      gg.addColorStop(0, withAlpha(mixLab(m.core, '#ffffff', 0.5), 0.9 * g1));
      gg.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = gg;
      c.fillRect(pp.x - 26, pp.y - 26, 52, 52);
      c.strokeStyle = withAlpha(mixLab(m.core, '#ffffff', 0.6), 0.8 * g1);
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(pp.x - 22 * g1, pp.y);
      c.lineTo(pp.x + 22 * g1, pp.y);
      c.moveTo(pp.x, pp.y - 15 * g1);
      c.lineTo(pp.x, pp.y + 15 * g1);
      c.stroke();
    }
    c.restore();
  });
}

/** the sheet's tilt on 'bigger': it tips back about its foot (sy, persp), 6.40 → 7.05 s. Round-2 revise: NO turn about
 *  the vertical axis any more: the x axis keeps its sense ('compute →' stays readable on the tilting paper), so the
 *  roofline that rises out of it reads as 'further right = bigger' */
function flipAt(t: number, b: B): { sy: number; persp: number; cos: number; u: number } {
  const u = sm((t - b.tilt0) / 0.65);
  return { sy: 1 - 0.38 * u, persp: 0.6 * u, cos: 1, u };
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
  // round-4 critic: the ruled line holds as the sheet's own dark ink until tilt0 + 0.2 s; this stroke takes over there
  // (its ink edge lying exactly on the ruled line), and its light comes up only as the paper goes visibly edge-on
  if (t < b.tilt0 + 0.2 || t > b.rise1 + 1.2) return;
  const a = 1 - win(t, b.rise1 + 0.5, b.rise1 + 1.2);
  const lit = win(t, b.tilt0 + 0.3, b.tilt0 + 0.6);
  const bc = boardCam(t, b), cc = cityCam(t, b);
  // left stays left: the ruled line's START (a) becomes the first, lowest roof; its END (b) the tallest roof
  const p0 = toScreen(LAYERS.L4, bc, ...xy(sheetPt(LINE.a, t, b)));
  const p1 = toScreen(LAYERS.L4, bc, ...xy(sheetPt(LINE.b, t, b)));
  const q0 = toScreen(LAYERS.L4, cc, ROOF_A.x, ROOF_A.y);
  const q1 = toScreen(LAYERS.L4, cc, ROOF_Z.x, ROOF_Z.y);
  const u = sm((t - b.city + 0.05) / 0.5);
  const A = { x: lerp(p0.x, q0.x, u), y: lerp(p0.y, q0.y, u) };
  const Z = { x: lerp(p1.x, q1.x, u), y: lerp(p1.y, q1.y, u) };
  c.save();
  c.lineCap = 'round';
  c.globalAlpha = a;
  // on the paper the stroke keeps its ink edge (so it reads on the cream sheet); on the night sky it is pure light
  c.strokeStyle = withAlpha('#1d2236', (1 - 0.1 * lit) * (1 - u));
  c.lineWidth = 4.6;
  c.beginPath();
  c.moveTo(A.x, A.y);
  c.lineTo(Z.x, Z.y);
  c.stroke();
  if (lit <= 0.003) {
    c.restore();
    return;
  }
  for (const [lw, col, al] of [[9, m.core, 0.16], [4, m.core, 0.45], [2.2, mixLab(m.core, '#ffffff', 0.55), 1]] as const) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(col, al * lit);
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
  return clamp01((tq - b.rule0) / (b.law - b.rule0));
}
function nibAt(tq: number, b: B): Pt {
  const r0 = b.rule0;
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
/** '10' with a raised exponent, at (x, baseline y), centred or right-aligned */
function pow10(c: C, x: number, y: number, e: number, align: 'center' | 'right') {
  const big = `500 9.5px ${FONT.mono}`, small = `500 7px ${FONT.mono}`;
  const es = e < 0 ? `\u2212${-e}` : `${e}`;
  c.font = big;
  const w1 = c.measureText('10').width;
  c.font = small;
  const w2 = c.measureText(es).width;
  const x0 = align === 'center' ? x - (w1 + w2 + 0.6) / 2 : x - (w1 + w2 + 0.6);
  c.textAlign = 'left';
  c.font = big;
  c.fillText('10', x0, y);
  c.font = small;
  c.fillText(es, x0 + w1 + 0.6, y - 4.2);
}

function sheet(c: C, env: PaintEnv, cx: number, cy: number, sy: number, ink: number, gleam: number, persp = 0, flip = 1, axisLit = 0) {
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
    c.fillText('error (log scale)', PLOT.x0 - 16, PLOT.y0 - 9);
    c.textAlign = 'right';
    // round-2 revise: 'compute →' catches the lamp as the paper tips back, so the x axis's sense carries into the city
    if (axisLit > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(PLOT.x1 - 50, PLOT.y1 + 30, 4, PLOT.x1 - 50, PLOT.y1 + 30, 90);
      g.addColorStop(0, withAlpha(m.core, 0.4 * axisLit));
      g.addColorStop(1, withAlpha(m.core, 0));
      c.fillStyle = g;
      c.fillRect(PLOT.x1 - 140, PLOT.y1 + 14, 160, 30);
      c.restore();
    }
    c.fillText('model size (log scale) →', PLOT.x1 + 6, PLOT.y1 + 36);
    // round-2 revise: decade numerals on both axes, so 'eight powers of ten across' is SEEN (ticks are graph texture;
    // the axis names above carry the reading)
    textRole(c, 'texture', () => {
      c.fillStyle = withAlpha('#2a3d3a', 0.85);
      for (let d = 0; d <= DEC_X; d++) pow10(c, PLOT.x0 + (d / DEC_X) * W, PLOT.y1 + 13.5, d, 'center');
      for (let d = 0; d <= DEC_Y; d++) pow10(c, PLOT.x0 - 3, PLOT.y1 - (d / DEC_Y) * H + 3.5, d - DEC_Y, 'right');
    });
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
  // the pin: at the top right, clear of the y-axis lettering (round-3 review: at top centre it covered the 's' of
  // 'scale')
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.beginPath();
  c.arc(x0 + SHEET.w - 18, y0 + 7, 3.6, 0, Math.PI * 2);
  c.fill();
  cardProbe(c, 'ch11-s05/loglog', x0, y0, SHEET.w, SHEET.h, 1, 1);
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
  const all = win(t, b.lights - 0.085, b.lights);
  f.backlight({ sunX: 900, sunY: 560, sunRadius: 600, intensity: 0.7 });
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, CITY_CAMS, 60);
    f.cached(`${ID}/city/L1/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      stars(cc, { x: r.x, y: r.y, w: r.w, h: r.h * 0.45, count: 120, seed: 21, twinkle: 0 }, env);
      skyline(cc, { style: 'megacity', x0: r.x, x1: r.x + r.w, y: 560, height: 170, seed: 31, lit: 0.12, ground: 400 }, env);
    })(c, r.x, r.y);
  });
  // round-4 critic (teaching): the ghost of the paper's DESCENDING ruled line in the sky, pale amber ink at ≈25 %, up on
  // 'lower' and gone by 'G': size rising (the roofline), error falling (this line), crossing as the law is said
  const ghost = win(t, b.lower - 0.15, b.lower + 0.2) * (1 - win(t, b.lights - 0.45, b.lights));
  if (ghost > 0.004) {
    f.layer('L2', (c, env) => {
      const col = mixLab('#f0c88a', env.mood.haze, 0.2);
      const { a, z, k } = GHOST;
      c.save();
      c.lineCap = 'round';
      c.globalAlpha = ghost;
      // the ink line drawn on as a ruling would be (left to right over 0.35 s), a faint bloom under it
      const u = sm(clamp01((t - b.lower + 0.15) / 0.35));
      const zx = lerp(a.x, z.x, u), zy = lerp(a.y, z.y, u);
      for (const [lw, al] of [[11, 0.07], [3.2, 0.26]] as const) {
        c.strokeStyle = withAlpha(col, al);
        c.lineWidth = lw / k;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(zx, zy);
        c.stroke();
      }
      c.restore();
    });
  }
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
    // round-2 revise: the roofline GROWS left to right, the same way the x axis ran (further right = bigger)
    const rise = clamp01((tq - b.city + 0.3) / (b.rise1 - b.city + 0.3));
    TOWERS.forEach((tw, i) => {
      const local = clamp01(rise * 1.9 - (i / (TOWERS.length - 1)) * 0.9);
      const st = Math.round(tw.storeys * sm(local));
      if (st <= 0) return;
      // round-3 review (paper cut, not a bar chart): each cut-out stands a hair off true, ≤ 0.3°, about its foot (the
      // tallest stays plumb: its window and plate are framed closely)
      const tilt = i === TOWERS.length - 1 ? 0 : hash1(i, 13) * 0.3 * (Math.PI / 180);
      c.save();
      c.translate(tw.x + tw.w / 2, GROUND);
      c.rotate(tilt);
      c.translate(-(tw.x + tw.w / 2), -GROUND);
      tower(c, env, tw, st, all, i === TOWERS.length - 1, i >= TOWERS.length - 3);
      c.restore();
    });
    // (the ruled line over the rising roofs is the screen pass's single match stroke)
    // the brass plate at the tallest tower's foot: dark texture until 'G', then it catches the lamp with the windows
    plate(c, env, t, b);
    // the few-shot window, drawn large inside its frame when the camera is near it
    fewShot(c, env, t, b);
  });
  f.rim({ x: 0, y: -1 });
  // the spire's light (the match cut's point)
  f.practical({ x: SPIRE.x, y: SPIRE.y, kind: 'led', seed: 96, intensity: 0.4 + 0.6 * all, radius: 22 });
  // round-2 revise: a near rooftop (parapet, a water tank on its legs, a vent stack), soft across the bottom of the
  // frame, so the slow move slides three planes; the push into the window carries the camera past it
  // (as the camera pushes toward the plate and the window the roof slides down and out under the lens, so it never
  // covers the plate)
  if (cam.z < 200) {
    f.layer('L5', (c, env) => {
      const k = CITY_NEAR.k;
      const w = 1500 / k, h = 260 / k;
      f.cached(`${ID}/city/L5/${env.mood.id}`, Math.ceil(w) + 4, Math.ceil(h) + 4, (cc) => {
        cc.scale(1 / k, 1 / k);
        cc.fillStyle = env.fill('fg');
        // the parapet: a low wall with coping, stepping down at the right (its coping just over the towers' feet)
        cc.fillRect(0, 150, 820, 120);
        cc.fillRect(800, 162, 700, 108);
        cc.fillRect(-10, 138, 820, 16);
        cc.fillRect(800, 154, 700, 10);
        // the water tank on its legs (left third), a conical cap
        const tx = 110;
        cc.fillRect(tx, 40, 110, 80);
        cc.beginPath();
        cc.moveTo(tx - 8, 42);
        cc.lineTo(tx + 55, 0);
        cc.lineTo(tx + 118, 42);
        cc.closePath();
        cc.fill();
        for (const lx of [tx + 8, tx + 50, tx + 92]) cc.fillRect(lx, 118, 8, 34);
        cc.fillRect(tx - 4, 124, 118, 5);
        // a railing at the far right (clear of the brass plate)
        for (let x = 1290; x < 1500; x += 46) cc.fillRect(x, 124, 4, 40);
        cc.fillRect(1290, 122, 210, 4);
        // the city's cyan catching the coping's top edge
        cc.fillStyle = withAlpha(env.mood.rim, 0.45);
        cc.fillRect(-10, 137, 820, 2);
        cc.fillRect(800, 153, 700, 1.5);
        cc.fillRect(tx - 6, 40, 2, 80);
      }, { blur: 6 })(c, CITY_NEAR.x, CITY_NEAR.y + (Math.max(0, cam.z - CITY1.z) * 1.4) / CITY_NEAR.k);
      // round-3 review: a near parapet corner at the lower RIGHT (a chimney stack and a corbelled cornice), blurred, so
      // the city has a real foreground plane on both sides of the frame (clear of the brass plate, right of it)
      const kr = CITY_NEAR.k;
      const wr = 340 / kr, hr = 300 / kr;
      const at = toLayer(LAYERS.L5, CITY0, 985, 492);
      f.cached(`${ID}/city/L5r/${env.mood.id}`, Math.ceil(wr) + 4, Math.ceil(hr) + 4, (cc) => {
        cc.scale(1 / kr, 1 / kr);
        cc.fillStyle = mixLab(env.fill('fg'), '#000000', 0.2);
        // the cornice: a stepped ledge running off frame right, its corbels underneath
        cc.fillRect(40, 150, 300, 150);
        cc.fillRect(26, 138, 314, 14);
        cc.fillRect(18, 128, 322, 10);
        for (let x = 40; x < 340; x += 34) cc.fillRect(x, 152, 14, 12);
        // the chimney stack with two pots
        cc.fillRect(170, 36, 74, 104);
        cc.fillRect(162, 28, 90, 12);
        cc.fillRect(180, 6, 18, 24);
        cc.fillRect(216, 12, 18, 18);
        // the city's cyan rim on the windward edges
        cc.fillStyle = withAlpha(env.mood.rim, 0.42);
        cc.fillRect(18, 127, 322, 2);
        cc.fillRect(162, 27, 90, 2);
        cc.fillRect(169, 36, 2, 96);
      }, { blur: 6 })(c, at.x, at.y + (Math.max(0, cam.z - CITY1.z) * 1.4) / kr);
    });
  }
}

type Tower = { x: number; w: number; storeys: number; roof: number };
/** round-4 critic (paper cut, not a bar chart): a 1-2 px hand-cut wobble on each facade edge, smooth along the height,
 *  seeded per tower and side */
function wob(tw: Tower, side: number, r: number): number {
  // the three towers the camera pushes in on (≈4×) keep a finer cut, so the close frames read as paper, not jelly
  const amp = tw.x >= TOWERS[TOWERS.length - 3].x ? 0.7 : 1.5;
  return amp * (0.75 * vnoise(r / 9 + side * 37.3, ((tw.x * 7) | 0) + side * 101) + 0.25 * vnoise(r / 2.2 + side * 11.1, ((tw.x * 5) | 0) + side * 57));
}
/** the facade's left (side 0) or right (side 1) cut edge from the foot up to storey `st`, with the setbacks */
function edgePts(tw: Tower, st: number, inset: (r: number) => number, side: 0 | 1): [number, number][] {
  const pts: [number, number][] = [];
  const ex = (ins: number) => (side === 0 ? tw.x + ins : tw.x + tw.w - ins);
  for (let r = 0; r <= st; r++) {
    const y = GROUND - r * STOREY;
    const below = inset(Math.max(0, r - 1)), above = inset(Math.min(st - 1, r));
    const w = wob(tw, side, r);
    pts.push([ex(below) + w, y]);
    if (above !== below && r < st) pts.push([ex(above) + w, y]);
  }
  return pts;
}
function strokePts(c: C, pts: [number, number][]) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
}

function tower(c: C, env: PaintEnv, tw: Tower, st: number, all: number, tall: boolean, hero = false) {
  const m = env.mood;
  const top = GROUND - st * STOREY;
  const done = st === tw.storeys;
  // a setback: the top storeys step in (setback towers, and the tallest twice)
  const sb1 = tall ? Math.floor(tw.storeys * 0.72) : tw.roof === 0 ? Math.floor(tw.storeys * 0.8) : tw.storeys;
  const sb2 = tall ? Math.floor(tw.storeys * 0.9) : tw.storeys;
  const inset = (r: number) => (r >= sb2 ? tw.w * 0.24 : r >= sb1 ? tw.w * 0.12 : 0);
  c.fillStyle = env.fill('ink');
  if (tall) {
    // the PODIUM: a wider two-tier base the brass plate is mounted on
    const ph = Math.min(PODIUM.h, st * STOREY);
    c.fillRect(PODIUM.x, GROUND - ph, PODIUM.w, ph);
    if (st * STOREY > PODIUM.h + 8) c.fillRect(PODIUM.x + 6, GROUND - PODIUM.h - 8, PODIUM.w - 12, 8);
  }
  // the facade as ONE cut-paper silhouette: up the left edge, across the roof, down the right edge (each edge nicked)
  const L = edgePts(tw, st, inset, 0), R = edgePts(tw, st, inset, 1);
  c.beginPath();
  L.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
  c.closePath();
  c.fill();
  if (done) {
    const ins = inset(st - 1);
    const x0 = tw.x + ins, w = tw.w - 2 * ins, cx = tw.x + tw.w / 2;
    if (tall) {
      // round-4 critic: the match-cut anchor gets a CUT-PAPER CROWN: the stepped crown, a pointed sunburst arch pierced
      // with radial slots (the sky shows through), finials on the lower step's corners, and the mast with an orb and
      // its light at top - 52 (the match point)
      c.fillRect(x0 + 6, top - 10, w - 12, 10);
      c.fillRect(x0 + 14, top - 18, w - 28, 8);
      for (const fx of [x0 + 6, x0 + w - 6]) {
        c.beginPath();
        c.moveTo(fx - 3, top - 10);
        c.lineTo(fx, top - 19);
        c.lineTo(fx + 3, top - 10);
        c.fill();
      }
      const aw = (w - 28) / 2 + 3, ah = 24, ay = top - 18;
      c.beginPath();
      c.moveTo(cx - aw, ay);
      c.quadraticCurveTo(cx - aw * 0.98, ay - ah * 0.82, cx, ay - ah);
      c.quadraticCurveTo(cx + aw * 0.98, ay - ah * 0.82, cx + aw, ay);
      c.closePath();
      for (let i = 0; i < 5; i++) {
        const th = Math.PI + (Math.PI * (i + 1)) / 6;
        const re = 1 / Math.hypot(Math.cos(th) / aw, Math.sin(th) / ah);
        const r1 = 0.32 * re, r2 = 0.8 * re, da = 0.075;
        c.moveTo(cx + Math.cos(th - da * 0.4) * r1, ay - 1 + Math.sin(th - da * 0.4) * r1);
        c.lineTo(cx + Math.cos(th - da) * r2, ay - 1 + Math.sin(th - da) * r2);
        c.lineTo(cx + Math.cos(th + da) * r2, ay - 1 + Math.sin(th + da) * r2);
        c.lineTo(cx + Math.cos(th + da * 0.4) * r1, ay - 1 + Math.sin(th + da * 0.4) * r1);
        c.closePath();
      }
      c.fill('evenodd');
      c.fillRect(cx - 1.6, top - 52, 3.2, 12);
      c.beginPath();
      c.arc(cx, top - 44, 2.6, 0, Math.PI * 2);
      c.fill();
      // the lamp's warm edge on the arch's windward (left) curve
      c.strokeStyle = withAlpha(mixLab('#f0c88a', m.rim, 0.35), 0.6);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(cx - aw + 0.6, ay - 0.5);
      c.quadraticCurveTo(cx - aw * 0.98 + 0.6, ay - ah * 0.82 + 0.4, cx, ay - ah + 0.6);
      c.stroke();
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
  // round-2 revise (hero + its two neighbours): paper grain over the facade, and a 1.5-2 px cyan rim on the lit (left,
  // city-glow) cut edge
  if (hero) {
    c.save();
    c.beginPath();
    for (let r = 0; r < st; r++) c.rect(tw.x + inset(r), GROUND - (r + 1) * STOREY, tw.w - 2 * inset(r), STOREY + 0.5);
    c.clip();
    paperTexture(c, { x: tw.x - 4, y: top - 4, w: tw.w + 8, h: GROUND - top + 8 }, { alpha: 0.9, offset: { x: tw.x * 3, y: 0 } });
    c.restore();
    c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.4), 0.75);
    c.lineWidth = 1.7;
    c.save();
    c.translate(0.85, 0);
    strokePts(c, L);
    c.restore();
  }
  // windows: one row per storey (the tallest: 96 rows, one per layer), each a bank of weights; on 'G' all at once,
  // each pane at its own brightness (0.75-1.0) so the grid reads as lit rooms, not a pattern. Round-4 critic: the panes
  // are hand-cut (a seeded few tenths of a px off true), and ≈8 % of them per tower are DARK until 'G' (solid paper, no
  // glass glow), so the all-at-once light on 'G' visibly changes the pattern
  const lit = mixLab(m.halo, m.core, 0.35);
  const sx = (tw.x * 3) | 0;
  for (let r = 0; r < st; r++) {
    const ins = inset(r);
    const ww = tw.w - 2 * ins;
    const cols = Math.max(2, Math.floor((ww - 8) / 7));
    const cw = (ww - 8) / cols;
    const y = GROUND - (r + 1) * STOREY + 1.5;
    for (let k = 0; k < cols; k++) {
      const dark = hash1(r * 17 + k * 29 + sx, 6) > 0.84;
      const pre = dark ? 0 : hash1(r * 31 + k * 7 + sx, 3) > 0.82 ? 0.3 : 0.06;
      const h = hash1(r * 13 + k * 3 + sx, 4) * 0.5 + 0.5;
      const a = Math.max(pre, all * (0.72 + 0.28 * h * h));
      if (a <= 0.004) continue;
      const jx = 0.35 * hash1(r * 7 + k * 11 + sx, 8), jh = 0.4 * hash1(r * 5 + k * 13 + sx, 9);
      c.fillStyle = withAlpha(lit, a);
      c.fillRect(tw.x + ins + 4 + k * cw + 1 + jx, y, cw - 2.2, STOREY - 2.6 + jh);
    }
  }
  c.fillStyle = withAlpha(m.rim, hero ? 0.55 : 0.25);
  c.fillRect(tw.x + inset(st - 1), top, tw.w - 2 * inset(st - 1), hero ? 1.6 : 1);
  // round-3 review: a 1-2 px WARM rim on the windward (left) roof edges, the cut paper's edge catching the lamp the
  // sheet came from: along the roof's left half, down the facade's left (wobbled) edge a few storeys, and on each
  // setback ledge
  if (done) {
    const warm = withAlpha(mixLab('#f0c88a', m.rim, 0.35), 0.7);
    c.fillStyle = warm;
    const ins = inset(st - 1);
    c.fillRect(tw.x + ins, top - 0.4, (tw.w - 2 * ins) * 0.55, 1.5);
    c.strokeStyle = warm;
    c.lineWidth = 1.5;
    c.save();
    c.translate(0.35, 0);
    strokePts(c, L.filter(([, y]) => y <= top + Math.min(st, 10) * STOREY + 0.01));
    c.restore();
    for (let r = 1; r < st; r++) {
      if (inset(r) !== inset(r - 1)) c.fillRect(tw.x + inset(r - 1) + wob(tw, 0, r), GROUND - r * STOREY - 0.4, inset(r) - inset(r - 1) + 1, 1.4);
    }
  }
}

/** the brass plaque on the tallest tower's podium (prop lettering), well above the bottom safe band. Round-4 critic: it
 *  stays DARK until 'G' (unlit brass at ≈30 % value, its lettering texture under the read threshold) and catches the
 *  lamp over 0.25 s with the window snap, a one-frame glint running along its top edge */
function plate(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const x = PLATE.x, y = PLATE.y;
  const w = TALL.w + 20, h = 48;
  const lit = win(t, b.lights - 0.085, b.lights + 0.165);
  c.save();
  c.fillStyle = withAlpha(m.ink, 0.92);
  c.fillRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8);
  const unlit = mixLab(mixLab('#a8803e', m.set, 0.5), m.ink, 0.62);
  const brass = mixLab('#a8803e', m.set, 0.15);
  const face = mixLab(unlit, brass, lit);
  c.fillStyle = face;
  c.fillRect(x - w / 2, y - h / 2, w, h);
  c.strokeStyle = withAlpha(mixLab(m.core, face, 0.5), 0.12 + 0.68 * lit);
  c.lineWidth = 1.2;
  c.strokeRect(x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8);
  // the lettering: engraved, so in the dark it is only a faint texture a shade off the brass; it reads once lit
  const inkCol = mixLab(face, mixLab('#2a1d0c', m.ink, 0.2), 0.18 + 0.82 * lit);
  textRole(c, lit < 0.5 ? 'texture' : 'subject', () => {
    c.fillStyle = inkCol;
    c.font = `500 19px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('175 BILLION', x, y - 10);
    c.fillText('WEIGHTS', x, y + 12);
  });
  cardProbe(c, 'ch11-s05/plate', x - w / 2, y - h / 2, w, h, lit, lit);
  if (lit > 0) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    const p = 0.2 + 0.6 * lit;
    g.addColorStop(Math.max(0, p - 0.2), withAlpha(m.core, 0));
    g.addColorStop(p, withAlpha(m.core, 0.3 * lit));
    g.addColorStop(Math.min(1, p + 0.2), withAlpha(m.core, 0));
    c.fillStyle = g;
    c.fillRect(x - w / 2, y - h / 2, w, h);
    // the one-frame glint on the plate's top edge as it comes fully up
    const g0 = b.lights + 0.17;
    if (t >= g0 && t < g0 + 1 / 24) {
      const gx = x - w * 0.2;
      const rg = c.createRadialGradient(gx, y - h / 2, 0, gx, y - h / 2, 22);
      rg.addColorStop(0, withAlpha(mixLab(m.core, '#ffffff', 0.6), 0.9));
      rg.addColorStop(1, withAlpha(m.core, 0));
      c.fillStyle = rg;
      c.fillRect(gx - 22, y - h / 2 - 22, 44, 44);
      c.fillStyle = withAlpha(mixLab(m.core, '#ffffff', 0.5), 0.85);
      c.fillRect(x - w / 2, y - h / 2 - 0.6, w, 1.4);
    }
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
    cardProbe(c, `ch11-s05/strip${i}`, x0 + 5, sy, W - 10, SH, 1, 1);
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
  return win(t, b.cut + 0.35, b.cut + 0.85) * (1 - win(t, b.wallCut - 0.45, b.wallCut - 0.05));
}

function shelfCam(t: number, b: B): Camera3 {
  // the hold: an eased 4 % push toward the new candle from just after the flame is born, still easing as the shot cuts
  if (t < b.wallCut) return mixCam(SHELF0, SHELF1, sm(clamp01((t - b.cut - 0.4) / (b.wallCut - b.cut - 0.4))));
  // the Wall: cut in on wallW4, then a slow 3 % push in to the end (the W4 glint lands on w4glint)
  return mixCam(WALL0, WALL1, sm((t - b.wallCut) / (b.D - b.wallCut)));
}

function paintShelfWall(f: Frame, t: number, b: B) {
  const cam = shelfCam(t, b);
  f.camera(cam);
  const mu = win(t, b.cut, b.cut + 1.0);
  if (mu < 1) f.setMood('candleAmber', { from: 'serverCyan', u: mu });
  studyRoom(f, { key: ID, cams: STUDY_CAMS, outside: { mood: 'serverCyan', kind: 'city', city: 0.5 } });
  // round-4 critic: the shelf hold's far plane in its right half: the Wall of Forecasts' foot, soft in the haze (its cork
  // face, the frame's lower moulding with a warm top edge toward the flame, two pin heads), ≈30 % up out of the wall
  if (t < b.wallCut) {
    f.layer('L2', (c, env) => {
      const { a, z, k } = SHELF_FAR;
      const w = z.x - a.x, h = z.y - a.y;
      f.cached(`${ID}/shelfFar/${env.mood.id}`, Math.ceil(w) + 4, Math.ceil(h) + 4, (cc) => {
        // authored in screen px (710 × 650 at SHELF0), origin = screen (690, 90)
        cc.scale(1 / k, 1 / k);
        const m = env.mood;
        const dark = mixLab(env.fill('ink'), m.haze, 0.3);
        const warm = mixLab(m.halo, m.set, 0.3);
        // the Wall's cork face (behind the label: it deepens the plate's ground), its lower edge a hair off level
        cc.globalAlpha = 0.4;
        cc.fillStyle = dark;
        cc.beginPath();
        cc.moveTo(30, -10);
        cc.lineTo(720, -10);
        cc.lineTo(720, 322);
        cc.lineTo(30, 308);
        cc.closePath();
        cc.fill();
        // its lower frame moulding: a heavy band and a bead under it
        cc.globalAlpha = 0.55;
        cc.beginPath();
        cc.moveTo(18, 304);
        cc.lineTo(720, 318);
        cc.lineTo(720, 344);
        cc.lineTo(18, 330);
        cc.closePath();
        cc.fill();
        cc.fillRect(30, 338, 690, 5);
        cc.globalAlpha = 1;
        // the moulding's top edge catching the new flame from the left, fading to the right
        const eg = cc.createLinearGradient(18, 0, 720, 0);
        eg.addColorStop(0, withAlpha(warm, 0.8));
        eg.addColorStop(1, withAlpha(warm, 0.08));
        cc.strokeStyle = eg;
        cc.lineWidth = 2;
        cc.beginPath();
        cc.moveTo(18, 304.5);
        cc.lineTo(720, 318.5);
        cc.stroke();
        // two brass pin heads of the Wall's lowest row
        cc.fillStyle = withAlpha(mixLab(m.halo, m.set, 0.4), 0.5);
        for (const px of [250, 540]) {
          cc.beginPath();
          cc.arc(px, 262 + px * 0.02, 4.5, 0, Math.PI * 2);
          cc.fill();
        }
        // under it, the study wall's dado rail and two raised panels: lit top-left edges, shadowed bottom-right edges
        cc.fillStyle = withAlpha(dark, 0.45);
        cc.fillRect(0, 404, 720, 12);
        cc.fillStyle = withAlpha(warm, 0.32);
        cc.fillRect(0, 403, 720, 1.6);
        for (const [px, pw] of [[60, 270], [372, 270]] as const) {
          const py = 452, ph = 200;
          cc.fillStyle = withAlpha(dark, 0.3);
          cc.fillRect(px, py, pw, ph);
          cc.fillStyle = withAlpha(warm, 0.28);
          cc.fillRect(px, py, pw, 1.6);
          cc.fillRect(px, py, 1.6, ph);
          cc.fillStyle = withAlpha(dark, 0.6);
          cc.fillRect(px, py + ph - 2, pw, 2);
          cc.fillRect(px + pw - 2, py, 2, ph);
        }
      }, { blur: 3 })(c, a.x, a.y);
    });
  }
  const g2 = Math.exp(-Math.pow((t - b.glint - 0.1) / 0.28, 2));
  const wl = 0.95 * win(t, b.wall - 0.7, b.wall);
  textureCase(f, 'end', true);
  studyCase(f, {
    shot: ID,
    when: 'end',
    key: ID,
    board: false,
    flames: false,
    // the candle naming rule (kit): the label comes forward beside the flame, horizontal, with its date range
    // ('lit 2020 · still burning'), and its neighbours dim; held from the lighting to the crane, so the kit card is
    // the candle's label (no duplicate of our own); the script's 'contested, as of October 2026' is set beneath
    // the kit's naming card is off: this shot sets the hero label itself (heroLabel, sized to the legibility audit)
    shelf: false,
    wall: { glint: { W4: 0 } },
    extra: (c, env) => {
      drawLineage(c, env);
      for (const g of [CARD19, CARD85]) drawQuoteCard(c, env, g, { light: poolAt(POOL, g.x - STUDY.board.x, g.y - STUDY.board.y) + 0.2, underline: 1 });
      // the W4 slip re-laid over the kit's copy WITHOUT its small pin (which sat on the header line); the brass pin is
      // drawn above the header after the light
      if (t >= b.wallCut) drawSlip(c, W4_SLIP, { x: W4.x, y: W4.y, k: STUDY.wall.k, light: slotLight('W4'), glint: 0, pin: false }, env);
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
      // the W4 pin: brass, at the slip's top centre above its header; it glints on w4glint (the bookend)
      if (t >= b.wallCut) w4Pin(c, env, g2, toScreen(LAYERS.L4, cam, 0, 0).k);
      // W6's corner, half-lit in shadow (round-4 critic: it read as a blank dark card): from the cut, a 35 % lamp falloff
      // warms its UPPER-LEFT corner over about a quarter of the slip, so its paper edge and a sliver of its typed line
      // catch the light (texture: the words stay unreadable in the shadow beyond)
      const w6 = win(t, b.wallCut - 0.01, b.wallCut + 0.35);
      if (w6 > 0.01) {
        const sw = 116 * 0.95, sh = 76 * 0.95;
        const x0 = W6.x - sw / 2, y0 = W6.y - sh / 2;
        const R = Math.hypot(sw, sh) * 0.5;
        const shade = mixLab(env.mood.set, env.mood.fg, 0.25);
        c.save();
        // only the lit corner is re-laid (a disc about it), so the rest of the slip stays the kit's own shadowed paper
        c.beginPath();
        c.arc(x0, y0, R * 0.84, 0, Math.PI * 2);
        c.clip();
        c.globalAlpha *= w6;
        textRole(c, 'texture', () => drawSlip(c, W6_SLIP, { x: W6.x, y: W6.y, k: STUDY.wall.k, light: 0.35, glint: 0, pin: false }, env));
        // the falloff: full light at the corner, back to the slip's shadow by a quarter of the way in
        const fg = c.createRadialGradient(x0, y0, R * 0.12, x0, y0, R * 0.8);
        fg.addColorStop(0, withAlpha(shade, 0));
        fg.addColorStop(0.55, withAlpha(shade, 0.7));
        fg.addColorStop(1, withAlpha(shade, 1));
        c.save();
        c.beginPath();
        c.rect(x0 + 0.5, y0 + 0.5, sw - 1, sh - 1);
        c.clip();
        c.globalAlpha = 1;
        c.fillStyle = fg;
        c.fillRect(x0, y0, sw, sh);
        // the lamp's warmth on the corner
        c.globalCompositeOperation = 'lighter';
        const wg = c.createRadialGradient(x0, y0, 2, x0, y0, R * 0.5);
        wg.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.2), 0.22 * w6));
        wg.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = wg;
        c.fillRect(x0, y0, sw, sh);
        c.restore();
        // the paper's cut edge catching the lamp along the top and left
        c.strokeStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.3), 0.5);
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(x0 + sw * 0.42, y0 + 0.5);
        c.lineTo(x0 + 0.5, y0 + 0.5);
        c.lineTo(x0 + 0.5, y0 + sh * 0.5);
        c.stroke();
        c.restore();
      }
    },
  });
  const away = t >= b.wallCut ? 1 : 0;
  // L5 (round-2 revise): a near candle out of focus at the bottom-left, a dark cut-paper stub with its scored rings
  // catching a little of the new flame, and the shelf's near edge under it, so the macro has a foreground plane and
  // the drift and crane slide it against the candles and the Wall
  if (t < b.wallCut) {
    f.layer('L5', (c, env) => {
      const k = NEAR.k;
      const w = 420 / k, h = 520 / k;
      f.cached(`${ID}/L5candle/${env.mood.id}`, Math.ceil(w) + 4, Math.ceil(h) + 4, (cc) => {
        cc.scale(1 / k, 1 / k);
        // art origin = screen (-30, 250) on the shelf's first frame
        cc.fillStyle = env.fill('fg');
        // the stub: a tall wide candle body, its top cut level, a dark wick
        cc.fillRect(70, 60, 150, 470);
        cc.fillRect(143, 36, 4, 26);
        // the shelf's near lip under it
        cc.fillRect(0, 430, 420, 100);
        // scored rings catching the new flame on the right edge, and the lip's lit edge
        cc.fillStyle = withAlpha(env.mood.rim, 0.32);
        for (let y = 80; y < 430; y += 22) cc.fillRect(196, y, 24, 2);
        cc.fillStyle = withAlpha(env.mood.rim, 0.55);
        cc.fillRect(218, 60, 3, 370);
        cc.fillRect(0, 429, 420, 3);
      }, { blur: 9 })(c, NEAR.x, NEAR.y);
    });
  }
  // the new flame's falloff: the frame outside its pool sinks ≈40% darker while the shelf holds
  const fall = (1 - away) * win(t, b.cut, b.cut + 0.6);
  if (fall > 0.01) {
    screenPass(f, (c) => {
      const fs = toScreen(LAYERS.L4, cam, FLAME.x, FLAME.y);
      const g = c.createRadialGradient(fs.x + 60, fs.y + 90, 90, fs.x + 60, fs.y + 90, 700);
      g.addColorStop(0, withAlpha(f.mood.fg, 0));
      g.addColorStop(0.6, withAlpha(f.mood.fg, 0.38 * fall));
      g.addColorStop(1, withAlpha(f.mood.fg, 0.6 * fall));
      c.fillStyle = g;
      c.fillRect(-4, -4, 1288, 728);
      // the cabinet's foot and the board's last card edge above the flame sink into the dark
      const yb = Math.max(40, fs.y + 6);
      const top = c.createLinearGradient(0, 0, 0, yb);
      top.addColorStop(0, withAlpha(f.mood.fg, 0.9 * fall));
      top.addColorStop(0.6, withAlpha(f.mood.fg, 0.72 * fall));
      top.addColorStop(1, withAlpha(f.mood.fg, 0));
      c.fillStyle = top;
      c.fillRect(-4, -4, 1288, yb + 4);
      // round-4 critic: one faint lamp shaft from the upper right, down across the candles, its streaks drifting
      // through the music-only hold (soft, low: the new flame stays the one bright point)
      const benv = (f as FilmFrame).env('L4');
      godRays(c, { beams: [SHELF_BEAM], intensity: 0.32 * fall, streaks: 5, softness: 46, shimmer: 0.2, salt: 115 }, benv);
      dustMotes(c, { area: { x: -20, y: -20, w: 1320, h: 760 }, count: 70, beam: SHELF_BEAM, brightness: 0.3 * fall, size: 0.9, salt: 116 }, benv);
    });
  }
  // (the flames are lit AFTER the falloff passes, so the dark never dims a flame)
  // round-2 revise: the new flame is the brightest point in frame; its older neighbours burn lower while the shelf
  // holds (they come back up as the crane leaves for the Wall)
  for (const v of V1) {
    if (v.state !== 'live') continue;
    const p = candleFlame({ x: candleX(V1, v.id), y: STUDY.shelf.y, view: v, s: STUDY.shelf.s });
    const hero = v.id === 'scale';
    // the new flame flares as it is born from the roofline light, then settles
    const k = hero ? 1.15 + 0.6 * Math.exp(-(t - b.cut) * 3) : 0.5 + 0.4 * away;
    f.practical({ x: p.x, y: p.y + 2, kind: 'candle', seed: 300 + v.slot * 7, intensity: 0.9 * k, radius: hero ? 64 : 40 });
  }
  void V0;
  void softPlate;
  void MOODS;
}
