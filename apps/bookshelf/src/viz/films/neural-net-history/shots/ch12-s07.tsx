/**
 * ch12-s07 — the X-ray complete: all seven bands light at last, Rosenblatt's 1961 slip floats into the box's
 * light, the shears clue card is pinned, and the camera pulls back to THE FULL WIDE (candleAmber, STUDY LOCK;
 * 14.92 s, crossfade in from the lit city with the tint crossfading serverCyan → candleAmber, no dip).
 *
 *   X-RAY  0 → 5.9    square-on to the chat box (C4's right edge just in frame at left), the box a serverCyan
 *                     practical in the amber study. One slow, even tilt from its base to its top, wordless (band 1
 *                     already lit as the shot opens, so the crossfade lands on a readable element):
 *                     each band lights in order at an even pace (threshold lanterns, knobs, hidden layers and a
 *                     backward arrow, furnaces and a sea of text, threads, type sorts); the seam between 3 and
 *                     4 stays dark. Last, a pair of preference shears drops into the dark slot at the top and
 *                     clicks in (5.9) and lights. The bands carry no words and no dates.
 *          4.6        Rosenblatt's slip lifts off W3 (top right, out of frame) and floats down into the box's
 *                     light, arriving as the shears click in; its typed letters read over the glow, with the
 *                     small tag tied to its pin: 'a hunch, not a forecast · 1961'. No tick, no glint, no verdict.
 *   'door'            the camera has eased left: the hands pin the shears clue card into C4-b, beneath the type
 *                     sort in C4-a; a thread of light runs to it
 *   fullWide          the slip drifts back to W3 and the camera pulls back to THE FULL WIDE: board, candle shelf
 *                     and the Wall in one frame, the X-ray glowing at the board's output, every band lit; held still
 *                     to the cut.
 * TEXT RULE: the slip's own typed lettering (the verbatim quote) and its tag only.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { FONT, LAYERS, MOODS, defineShot, dustMotes, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import { bankersLamp } from '../../../film/silhouette/props/lights';
import { XRAY } from '../sets/xrayColumn';
import { hands } from '../cast';
import { STUDY, STUDY_CAMS, slotWorld, studyCase, studyNear, studyRoom, wallSlotWorld } from '../sets/study';
import { SLOTS, xrayBandsAt, type XrayState } from '../sets/studyState';
import { DEFAULT_POOL, cardIcon, drawCard, paperTone, poolAt } from '../sets/caseBoard';
import { WALL_SLOTS } from '../sets/wallOfForecasts';
import { lightThread } from '../sets/ch05-s07-kit';
import { lanternPair, openaiCard } from '../sets/ch12-s03-founding';
import { mixFrame } from '../sets/ch09-s03a-kit';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch02-s05b-util';

type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
const ID = 'ch12-s07';
const CYAN = MOODS.serverCyan;
const XS = STUDY.xray.s;

// ------------------------------------------------------------------------------------------------ geometry
/** band i (1-based) centre, L4 world (xrayColumn's bandRect, scaled) */
const bandY = (i: number) => {
  const seam = i >= 4 ? 10 : 0;
  const y1 = -22 - (i - 1) * 50 - seam;
  return STUDY.xray.y + (y1 - 23) * XS;
};
const BOXX = STUDY.xray.x;
const W3P = wallSlotWorld('W3');
const W3 = WALL_SLOTS.W3;
/** where the slip floats to: (round 1) 120 px further left, hovering over the box's glowing type sorts (its right half)
 *  so its right edge stays well inside the frame through the line; low enough that band 7's slot stays clear */
const SLIP_AT: Pt = { x: BOXX + 64, y: bandY(6) + 58 };
const SLIP_S = 1.6;

// ------------------------------------------------------------------------------------------------ cameras
/** square-on at the base: the box's bottom edge and stand sit ≈ 20% up from the frame bottom */
const TILT0: Camera3 = { x: BOXX, y: STUDY.xray.y + 18 - 216 / (1000 / (1000 - 560)), z: 560, lens: 1 };
const TILT1: Camera3 = { x: BOXX, y: bandY(7) + 18, z: 560, lens: 1 };
/** (round 1) the reading frames sit 50 px further left with the slip, so no Wall slip pokes in at top right */
const READ: Camera3 = { x: BOXX - 20, y: 468, z: 480, lens: 1 };
const READ2: Camera3 = { x: BOXX - 26, y: 466, z: 502, lens: 1 };
/** (round 1) the pull-back starts on 'sixty-one years on' and settles on THE FULL WIDE by ≈ 12.4 s (the pin on 'door'
 *  lands in a medium framing on the way); the wide then holds still ≥ 2.5 s */
const PB0 = 9.5;
const PB1 = 12.4;
/** the full wide, lifted a touch so the candle shelf and the Wall share the frame's weight with the desk */
const FULL: Camera3 = { ...STUDY_CAMS.full, y: STUDY_CAMS.full.y - 50 };
const CAMS = [TILT0, TILT1, READ, READ2, FULL, STUDY_CAMS.xray];
/** a near plane between the box and the lens (the desk's lip and the green-shaded lamp): it slides down out of frame
 *  as the camera tilts up the box, faster than the box (depth during the tilt) */
const NEAR_TILT: LayerSpec = { id: 'ch12s07near', z: 800, haze: 0, blur: 3 };
const LIP_Y = toLayer(NEAR_TILT, TILT0, 0, 628).y;
const LAMP_BASE = toLayer(NEAR_TILT, TILT0, 1190, 790);

const F1C = slotWorld('F1');
const NAIL1 = { x: F1C.x, y: F1C.y + SLOTS.F1.h / 2 + 6 };
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };
const PIN_DUR = 0.95;
/** the pin's u, with a quicker withdrawal after the press so the pinned card reads clear of the hand */
const pinWarp = (u: number) => (u < 0.6 ? u : 0.6 + (u - 0.6) * 1.8);

interface B {
  D: number;
  tilt: number;
  lights: number[];
  rosen: number;
  shears: number;
  door: number;
  wide: number;
  lineEnd: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const tilt = T.beat('tilt');
    const shears = T.beat('shears');
    // seven bands at an even pace (≈ 0.9 s apart), bottom to top, the last on the shears' click; (round 1) every band
    // starts at ≈ 20% and comes to full on its own chime, the first just as the crossfade completes
    const l0 = Math.max(tilt + 0.15, 0.45);
    const step = (shears - l0) / 6;
    const lights = Array.from({ length: 7 }, (_, i) => l0 + i * step);
    const b: B = {
      D,
      tilt,
      lights,
      rosen: T.beat('rosenblatt'),
      shears,
      door: T.beat('clueCard'),
      wide: PB1,
      lineEnd: T.line('L1217').end,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    const tq = tq12(t);
    const cam = camAt(b, t);
    f.camera(cam);
    f.setMood('candleAmber', { from: 'serverCyan', u: sm(t / 1.1) });
    studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'serverCyan', kind: 'city', city: 0.7 } });
    // (round 1) haze between the box and the wall, lit cold by the box (behind the action plane)
    boxHaze(f, b, t);
    const pinU = pinWarp((tq - (b.door - 0.45 * PIN_DUR)) / PIN_DUR);
    const placed = pinU >= 0.45;
    const xs = xrayState(b, t);
    const lit = xs.state.lit.filter(Boolean).length + (xs.reveal ? xs.reveal.u : 0);
    const light = 0.55 + 0.45 * (lit / 7);
    // the hand enters from the lower edge of the frame as it is at the pin (fixed in the world while the camera moves)
    const pinEntry = handsEntry2(camAt(b, b.door));
    studyCase(f, {
      shot: ID,
      when: placed ? 'end' : 'start',
      key: ID,
      board: { hide: ['C4-b', 'F1'] },
      wall: { hide: ['W3'] },
      xray: { light, state: xs.state, reveal: xs.reveal, slotGlint: xs.state.lit[6] ? 0 : 0.001 },
      extra: (c, env) => {
        // the founding row as ch09-s04 left it: OpenAI's card and its pair of lanterns on one nail
        openaiCard(c, env, F1C.x, F1C.y);
        lanternPair(c, env, NAIL1, 0.55);
        // band 7 before the click: a dark row with only the empty, shears-shaped hole; then the shears drop in
        bandLights(c, b, t);
        slotRow(c, env, b, t, xs);
        shearsDrop(c, env, b, t, tq);
        // the clue card: in the hand, then pinned in C4-b with its thread to the type sort
        const thread = clamp01((t - b.door - 0.25) / 0.6);
        if (thread > 0) lightThread(c, env, slotWorld('C4-b', 'pin'), slotWorld('C4-a', 'pin'), thread, 0.9, 20);
        if (placed) clueCard(c, env, slotWorld('C4-b'), 0.25 * win(t, b.door, b.door + 0.4) * (1 - win(t, b.door + 1.2, b.door + 2)));
        if (pinU > 0 && pinU < 1) {
          const pose = hands.act('pin', pinU, slotWorld('C4-b', 'pin'), { held: 'card', scale: 0.6, entry: pinEntry });
          hands.draw(c, pose, env, { heldDraw: (cc, at, _h, e) => clueCard(cc, e, { x: at.x, y: at.y + SLOTS['C4-b'].h / 2 - 7 }, 0) });
        }
      },
    });
    // (round 1) the box's light falls cold across the board cards at its left (and the hands as they pass)
    coldSpill(f, b, t);
    // the slip floats in the box's light (after the rim pass: paper lit from behind by the cyan glow)
    f.layer('L4', (c, env) => {
      const sp = slipAt(b, t, tq);
      rosenSlip(c, env, sp.p, sp.s, sp.rot, sp.glow);
      dustMotes(c, { area: { x: BOXX - 260, y: 300, w: 560, h: 380 }, count: 26, drift: { x: -2, y: -3 }, brightness: 0.35, salt: 1207 }, env);
    });
    nearTilt(f, t);
    studyNear(f, { key: ID, cams: CAMS, file: true });
    // the desk's top edge catches the green-shaded lamp: a rim and a soft falloff down its front (the wide)
    f.layer('L5', (c, env) => {
      const x0 = STUDY.deskX, y = STUDY.deskY;
      const lampCol = mixLab(env.mood.rim, '#a9c79a', 0.3);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(0, y, 0, y + 160);
      g.addColorStop(0, withAlpha(mixLab(env.mood.halo, '#a9c79a', 0.2), 0.14));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(x0, y, 1800, 160);
      const h = c.createLinearGradient(x0, 0, x0 + 1400, 0);
      h.addColorStop(0, withAlpha(lampCol, 0.25));
      h.addColorStop(0.45, withAlpha(lampCol, 0.6));
      h.addColorStop(1, withAlpha(lampCol, 0.2));
      c.fillStyle = h;
      c.fillRect(x0, y - 1.5, 1800, 3);
      c.restore();
    });
  },
});

// ================================================================================================ camera
function camAt(b: B, t: number): Camera3 {
  const end = b.lights[6] + 0.1;
  if (t < end) {
    // one slow, even tilt from the base to the top (the zoom held)
    const u = clamp01((t - b.tilt) / (end - b.tilt));
    const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
    return { ...TILT0, y: lerp(TILT0.y, TILT1.y, e) };
  }
  if (t < end + 1.2) return mixFrame(TILT1, READ, sm((t - end) / 1.2));
  if (t < PB0) return mixFrame(READ, READ2, sm((t - end - 1.2) / Math.max(0.5, PB0 - end - 1.2)));
  // THE FULL WIDE: one slow pull-back from the close-up (the pin lands mid-way, in a medium framing), then held still
  const u = ease.move(clamp01((t - PB0) / (PB1 - PB0)));
  return mixFrame(READ2, FULL, u);
}

// ================================================================================================ the X-ray
function xrayState(b: B, t: number): { state: XrayState; reveal?: { band: number; u: number } } {
  const base = xrayBandsAt(ID, 'start');
  // (round 1) band 7 snaps in with the shears' click (0.2 s), the others come up over 0.5 s
  const dur = (i: number) => (i === 6 ? 0.2 : 0.5);
  const lit = b.lights.map((L, i) => t >= L + dur(i));
  let reveal: { band: number; u: number } | undefined;
  for (let i = 0; i < 7; i++) {
    if (t >= b.lights[i] && t < b.lights[i] + dur(i)) reveal = { band: i + 1, u: (t - b.lights[i]) / dur(i) };
  }
  return { state: { ...base, lit, lightsThisShot: 7, slotGlint: !lit[6], complete: lit.every(Boolean) }, reveal };
}

/** band 7's row (box-local rect, as in xrayColumn) */
const BAND7 = { x: -230 / 2 + 18, y: -22 - 300 - 10 - 50 + 6, w: 230 - 36, h: 42 };
/** before the shears click in, band 7 is a dark row holding only an empty, shears-shaped hole (as in ch12-s01) */
function slotRow(c: C, env: PaintEnv, b: B, t: number, xs: { state: XrayState; reveal?: { band: number; u: number } }) {
  if (xs.state.lit[6]) return;
  const r7 = xs.reveal && xs.reveal.band === 7 ? xs.reveal.u : 0;
  const a = 1 - r7;
  if (a <= 0.01) return;
  c.save();
  c.translate(BOXX, STUDY.xray.y);
  c.scale(XS, XS);
  c.globalAlpha *= a;
  c.fillStyle = withAlpha(mixLab(CYAN.ink, '#000000', 0.2), 0.74);
  c.fillRect(BAND7.x - 1, BAND7.y - 1, BAND7.w + 2, BAND7.h + 2);
  c.strokeStyle = withAlpha(mixLab(CYAN.rim, CYAN.set, 0.4), 0.22);
  c.lineWidth = 1.2;
  c.strokeRect(BAND7.x, BAND7.y, BAND7.w, BAND7.h);
  // the hole: a shade darker than the row, its rim barely catching the band light below
  cardIcon(c, 'shears', 0, BAND7.y + BAND7.h / 2, 46, env, withAlpha(mixLab(CYAN.ink, '#000000', 0.45), 0.9));
  c.globalCompositeOperation = 'lighter';
  cardIcon(c, 'shears', 0, BAND7.y + BAND7.h / 2 + 0.8, 46, env, withAlpha(CYAN.halo, 0.05));
  c.restore();
  void b;
  void t;
}

/** the preference shears: drop from above the box into the slot (≈ 0.5 s, on twos) and click in, with a 2-frame
 *  flash along their outline on the click */
function shearsDrop(c: C, env: PaintEnv, b: B, t: number, tq: number) {
  const t0 = b.shears - 0.5;
  const yTop = STUDY.xray.y - 420 * XS - 90;
  if (tq >= t0 && t < b.shears + 0.05) {
    const u = clamp01((tq - t0) / 0.5);
    const y = lerp(yTop, bandY(7), u * u);
    c.save();
    c.translate(BOXX, y);
    c.scale(XS, XS);
    cardIcon(c, 'shears', 0, 0, 46, env, mixLab(CYAN.ink, CYAN.set, 0.2));
    c.globalCompositeOperation = 'lighter';
    cardIcon(c, 'shears', -0.8, -0.8, 47, env, withAlpha(CYAN.core, 0.35));
    c.restore();
  }
  // (round 1) landed: solid in the slot from the click until band 7's own light has taken over
  if (t >= b.shears && t < b.shears + 0.45) {
    c.save();
    c.translate(BOXX, bandY(7));
    c.scale(XS, XS);
    c.globalAlpha *= 1 - sm((t - b.shears - 0.2) / 0.25);
    cardIcon(c, 'shears', 0, 0, 46, env, mixLab(CYAN.ink, '#000000', 0.15));
    c.restore();
  }
  // the snap's single cold EDGE-GLINT along the shears' outline, as in ch12-s01's opening (the chapter's bookends)
  const gk = Math.max(0, 1 - Math.abs(t - b.shears - 0.12) / 0.32);
  if (gk > 0 && t >= b.shears) {
    c.save();
    c.translate(BOXX, bandY(7));
    c.scale(XS, XS);
    c.globalCompositeOperation = 'lighter';
    for (const [dx, dy] of [[-1.2, -1.2], [1.2, -0.6], [0, 1.2]] as const) cardIcon(c, 'shears', dx, dy, 48, env, withAlpha(CYAN.core, 0.9 * gk));
    const sx = -18 + 36 * sm((t - b.shears + 0.05) / 0.4);
    const sg = c.createRadialGradient(sx, -8 + sx * 0.25, 0, sx, -8 + sx * 0.25, 12);
    sg.addColorStop(0, withAlpha(CYAN.core, 0.9 * gk));
    sg.addColorStop(1, withAlpha(CYAN.core, 0));
    c.fillStyle = sg;
    c.fillRect(sx - 12, -20 + sx * 0.25, 24, 24);
    c.restore();
  }
  // the click: two frames of light along the shears' outline
  if (t >= b.shears && t < b.shears + 0.085) {
    c.save();
    c.translate(BOXX, bandY(7));
    c.scale(XS, XS);
    c.globalCompositeOperation = 'lighter';
    for (const [dx, dy] of [[-1.5, -1.5], [1.5, -0.8], [0, 1.5], [-1, 1]] as const) cardIcon(c, 'shears', dx, dy, 50, env, withAlpha(CYAN.core, 0.85));
    const g = c.createRadialGradient(0, 0, 2, 0, 0, 70);
    g.addColorStop(0, withAlpha(CYAN.core, 0.5));
    g.addColorStop(1, withAlpha(CYAN.halo, 0));
    c.fillStyle = g;
    c.fillRect(-70, -70, 140, 140);
    c.restore();
  }
}

// ================================================================================================ round 1: light and depth
/** box-local rect of band i (1-based), as xrayColumn lays them out (the seam between 3 and 4 is 10 units) */
function bandRect(i: number) {
  const seam = i >= 4 ? 10 : 0;
  const y1 = -XRAY.pad - (i - 1) * XRAY.band - seam;
  return { x: -XRAY.w / 2 + 18, y: y1 - XRAY.band + 6, w: XRAY.w - 36, h: XRAY.band - 8 };
}
/** the bands build bottom to top: each waits at ≈ 20% value and comes to full on its own chime with a short bloom;
 *  the seam between bands 3 and 4 is kept visibly dark */
function bandLights(c: C, b: B, t: number) {
  c.save();
  c.translate(BOXX, STUDY.xray.y);
  c.scale(XS, XS);
  const dark = mixLab(CYAN.ink, '#000000', 0.25);
  for (let i = 1; i <= 6; i++) {
    const r = bandRect(i);
    const L = b.lights[i - 1];
    const d = 0.76 * (1 - sm((t - L) / 0.2));
    if (d > 0.01) {
      c.fillStyle = withAlpha(dark, d);
      c.fillRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
    }
    const age = t - L;
    if (age >= 0 && age < 0.75) {
      const k = age < 0.08 ? age / 0.08 : 1 - (age - 0.08) / 0.67;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(CYAN.core, 0.4 * k);
      c.fillRect(r.x, r.y, r.w, r.h);
      const g = c.createRadialGradient(0, r.y + r.h / 2, 10, 0, r.y + r.h / 2, r.w * 0.85);
      g.addColorStop(0, withAlpha(CYAN.halo, 0.3 * k));
      g.addColorStop(1, withAlpha(CYAN.halo, 0));
      c.fillStyle = g;
      c.fillRect(-r.w, r.y - r.w * 0.6, 2 * r.w, r.h + r.w * 1.2);
      c.restore();
    }
  }
  // the seam
  const r3 = bandRect(3), r4 = bandRect(4);
  c.fillStyle = withAlpha(mixLab(CYAN.ink, '#000000', 0.45), 0.88);
  c.fillRect(-XRAY.w / 2 + 8, r4.y + r4.h + 1, XRAY.w - 16, r3.y - (r4.y + r4.h) - 2);
  c.restore();
}

/** lit-band fraction 0..1 */
const litFrac = (b: B, t: number) => b.lights.reduce((n, L) => n + sm((t - L) / 0.3), 0) / 7;

/** haze between the box and the wall, lit cold by the box (behind the action plane) */
function boxHaze(f: Frame, b: B, t: number) {
  const k = 0.35 + 0.65 * litFrac(b, t);
  f.fog({ yCenter: 470, height: 280, alpha: 0.1, drift: 4 });
  f.layer('L3', (c) => {
    const sc = toScreen(LAYERS.L4, f.cam, BOXX, STUDY.xray.y - (XRAY.h / 2) * XS);
    const p = toLayer(LAYERS.L3, f.cam, sc.x, sc.y);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(p.x, p.y, 30, p.x, p.y, 460);
    g.addColorStop(0, withAlpha(CYAN.halo, 0.16 * k));
    g.addColorStop(0.5, withAlpha(CYAN.halo, 0.06 * k));
    g.addColorStop(1, withAlpha(CYAN.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - 460, p.y - 460, 920, 920);
    c.restore();
  });
}

/** the box's cold light across the board cards at its left (the brief: 'its light falling cold across the board and
 *  the hands') */
function coldSpill(f: Frame, b: B, t: number) {
  const k = litFrac(b, t);
  if (k <= 0.01) return;
  f.layer('L4', (c) => {
    const x0 = BOXX - (XRAY.w / 2) * XS;
    const cy = STUDY.xray.y - (XRAY.h / 2) * XS;
    c.save();
    c.beginPath();
    c.rect(x0 - 900, cy - 700, 900 - 6, 1400);
    c.clip();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x0, cy, 20, x0, cy, 560);
    g.addColorStop(0, withAlpha(CYAN.halo, 0.2 * k));
    g.addColorStop(0.45, withAlpha(CYAN.halo, 0.08 * k));
    g.addColorStop(1, withAlpha(CYAN.halo, 0));
    c.fillStyle = g;
    c.fillRect(x0 - 600, cy - 600, 1200, 1200);
    c.restore();
  });
}

/** the near plane during the tilt: the desk's lip and the green-shaded lamp, blurred, sliding down out of frame */
function nearTilt(f: Frame, t: number) {
  if (t > 4.5) return;
  const S = 1.45;
  const bulb = bankersLamp.anchors({ x: LAMP_BASE.x, y: LAMP_BASE.y, s: S }).bulb;
  f.layer(NEAR_TILT, (c, env) => {
    c.fillStyle = env.fill('fg');
    c.fillRect(LAMP_BASE.x - 3000, LIP_Y, 6000, 900);
    c.fillStyle = withAlpha(mixLab(env.mood.rim, '#a9c79a', 0.3), 0.45);
    c.fillRect(LAMP_BASE.x - 3000, LIP_Y - 1, 6000, 2);
    bankersLamp(c, { x: LAMP_BASE.x, y: LAMP_BASE.y, s: S, lit: true, seed: 1213 }, env);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(bulb.x, bulb.y + 6, 2, bulb.x, bulb.y + 6, 120);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.35));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(bulb.x - 120, bulb.y - 114, 240, 240);
    c.restore();
  });
}

// ================================================================================================ the slip
interface SlipPose {
  p: Pt;
  s: number;
  rot: number;
  glow: number;
}
function slipAt(b: B, t: number, tq: number): SlipPose {
  const home: SlipPose = { p: W3P, s: 1, rot: 0, glow: 0 };
  const a0 = b.rosen, a1 = b.shears;
  const r0 = b.door + 0.3, r1 = r0 + 1.0;
  if (tq < a0) return home;
  const there: SlipPose = { p: SLIP_AT, s: SLIP_S, rot: -0.035 + 0.008 * Math.sin(t * 0.9), glow: 1 };
  if (tq < a1) {
    // lifts off its pin and floats down in a soft S toward the light (on twos: paper)
    const u = sm((tq - a0) / (a1 - a0));
    const sway = 0.08 * Math.sin(u * Math.PI * 2);
    return {
      p: { x: lerp(home.p.x, there.p.x, u) + 30 * Math.sin(u * Math.PI), y: lerp(home.p.y, there.p.y, u) },
      s: lerp(1, SLIP_S, u),
      rot: lerp(0, there.rot, u) + sway,
      glow: u,
    };
  }
  if (tq < r0) return there;
  if (tq < r1) {
    const u = sm((tq - r0) / (r1 - r0));
    return { p: { x: lerp(there.p.x, home.p.x, u), y: lerp(there.p.y, home.p.y, u) - 30 * Math.sin(u * Math.PI) }, s: lerp(SLIP_S, 1, u), rot: lerp(there.rot, 0, u) + 0.05 * Math.sin(u * Math.PI), glow: 1 - u };
  }
  return home;
}

/** Rosenblatt's W3 slip: who-line, the sentence typed, and the small tag tied to its pin (prop lettering) */
function rosenSlip(c: C, env: PaintEnv, p: Pt, s: number, rot: number, glow: number) {
  const k = STUDY.wall.k * s;
  const w = W3.w * k, h = W3.h * k;
  const m = env.mood;
  // the paper: lamp-lit on the Wall; backlit by the box's cyan glow when it floats in its light
  let paper = paperTone(env, 0.8);
  paper = mixLab(paper, mixLab(CYAN.core, '#f4efe2', 0.55), 0.35 * glow);
  const ink = mixLab(m.ink, paper, 0.1);
  c.save();
  c.translate(p.x, p.y);
  c.rotate(rot);
  // contact shadow (on the Wall) → a soft drop when floating
  c.fillStyle = withAlpha(m.fg, 0.3 * (1 - glow) + 0.18 * glow);
  c.fillRect(-w / 2 + 2 * k + 6 * glow, -h / 2 + 3 * k + 10 * glow, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  if (glow > 0.01) {
    // the box's light through the paper's left edge (it is lit from the box side)
    const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, withAlpha(CYAN.halo, 0.32 * glow));
    g.addColorStop(0.6, withAlpha(CYAN.halo, 0));
    c.fillStyle = g;
    c.fillRect(-w / 2, -h / 2, w, h);
  }
  // who-line and rule
  c.fillStyle = ink;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.font = `400 ${9.2 * k}px ${FONT.typewriter}`;
  c.fillText('ROSENBLATT · 1961', -w / 2 + 7 * k, -h / 2 + 14 * k);
  c.fillRect(-w / 2 + 7 * k, -h / 2 + 20 * k, w - 14 * k, 0.7 * k);
  // the sentence, typed
  const lines = ['“Linguistic capability,', 'related to perceptual', 'experience, is of the', 'essence…”'];
  c.font = `400 ${9.6 * k}px ${FONT.typewriter}`;
  lines.forEach((ln, i) => c.fillText(ln, -w / 2 + 8 * k, -h / 2 + (33 + i * 13.5) * k));
  // the pin
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.beginPath();
  c.arc(0, -h / 2 + 6 * k, 4 * k, 0, Math.PI * 2);
  c.fill();
  // the small typed tag tied to its pin: 'a hunch, not a forecast · 1961'. On the Wall it hangs up-right of the pin,
  // small (texture); (round 1) floating in the box's light it is READ, so its string runs down the slip's right edge
  // and the tag hangs beneath the slip, set above the legibility floor
  const TAG = 'a hunch, not a forecast · 1961';
  if (glow < 0.5) {
    c.save();
    c.globalAlpha *= 1 - glow * 2;
    c.translate(4 * k, -h / 2 + 6 * k);
    c.rotate(0.12 + 0.03 * Math.sin(rot * 20));
    c.strokeStyle = withAlpha(ink, 0.7);
    c.lineWidth = 0.6 * k;
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(14 * k, -6 * k, 26 * k, -12 * k);
    c.stroke();
    c.translate(26 * k, -12 * k);
    c.font = `400 ${5.6 * k}px ${FONT.typewriter}`;
    const tw = c.measureText(TAG).width + 8 * k;
    c.fillStyle = mixLab(paper, m.halo, 0.2);
    c.fillRect(0, -5 * k, tw, 10 * k);
    c.strokeStyle = withAlpha(ink, 0.3);
    c.strokeRect(0, -5 * k, tw, 10 * k);
    c.fillStyle = withAlpha(ink, 0.9);
    c.fillText(TAG, 4 * k, 0.4 * k);
    c.restore();
  }
  if (glow > 0.5) {
    const g2 = (glow - 0.5) * 2;
    // (round 1) 7.8k Special Elite ≈ 25 px cap height at 1080p in the READ framing (cap ratio 0.69): it carries the
    // shot's fairness point. The font string names a fallback family so the legibility audit measures this face afresh
    // on the alphabetic baseline (its cache otherwise holds the ratio measured on a 'middle' baseline, ≈ 0.7× short)
    const fs = 7.8 * k;
    c.save();
    c.globalAlpha *= g2;
    c.textBaseline = 'alphabetic';
    c.font = `400 ${fs}px ${FONT.typewriter}, monospace`;
    const tw = c.measureText(TAG).width + 12 * k;
    const th = fs * 1.55;
    const tx = w / 2 - tw + 2 * k, ty = h / 2 + 8 * k;
    // the string: from the pin, round the slip's right edge, down to the tag's punched corner
    c.strokeStyle = withAlpha(ink, 0.65);
    c.lineWidth = 0.6 * k;
    c.beginPath();
    c.moveTo(4 * k, -h / 2 + 6 * k);
    c.quadraticCurveTo(w / 2 + 5 * k, -h / 2 + 4 * k, w / 2 + 3 * k, 0);
    c.lineTo(tx + tw - 5 * k, ty + 3 * k);
    c.stroke();
    c.rotate(-0.015);
    c.fillStyle = withAlpha(m.fg, 0.25);
    c.fillRect(tx + 2 * k, ty + 3 * k, tw, th);
    c.fillStyle = mixLab(mixLab(paper, m.halo, 0.2), '#f4efe2', 0.25);
    c.fillRect(tx, ty, tw, th);
    c.strokeStyle = withAlpha(ink, 0.3);
    c.lineWidth = 0.5 * k;
    c.strokeRect(tx, ty, tw, th);
    c.fillStyle = withAlpha(mixLab(ink, '#14100c', 0.4), 0.92);
    c.textBaseline = 'alphabetic';
    c.fillText(TAG, tx + 6 * k, ty + fs * 1.1);
    c.restore();
  }
  c.restore();
}

// ================================================================================================ the clue card
function clueCard(c: C, env: PaintEnv, p: Pt, glow: number) {
  const s = SLOTS['C4-b'];
  drawCard(c, s, { x: p.x, y: p.y, k: STUDY.board.k, light: poolAt(POOL, s.x, s.y) + glow, lit: glow > 0.05 }, env);
}
/** the pin hand enters from below the column (never across the glowing box at frame right) */
function handsEntry2(cam: Camera3) {
  // from the lower edge, right of the card and left of the box: the forearm never covers the card it pins
  const R = toLayer(LAYERS.L4, cam, 640, 1000);
  const L = toLayer(LAYERS.L4, cam, 120, 1020);
  return { R, L };
}
