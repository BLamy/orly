/**
 * ch12-s07 — the X-ray complete: all seven bands light at last, Rosenblatt's 1961 slip floats into the box's
 * light, the shears clue card is pinned, and the camera pulls back to THE FULL WIDE (candleAmber, STUDY LOCK;
 * 14.92 s, crossfade in from the lit city with the tint crossfading serverCyan → candleAmber, no dip).
 *
 *   X-RAY  0 → 5.9    square-on to the chat box (C4's right edge just in frame at left), the box a serverCyan
 *                     practical in the amber study. (review r3, kit x-ray subject rule) the face rests at 60 %, desaturated,
 *                     and only the slot that is lighting lifts; the glyph rows ink in warm grey (#cfc6b0 at 70 %). A soft
 *                     additive cyan bloom ≈ 1.3× its width glows AROUND the box (kept off its face) and rakes the C4
 *                     cards and the hands.
 *                     One slow, even tilt from its base to its top, wordless; a near plane stays in frame through
 *                     it (desk lip + lamp at the start, then a drape edge at frame right), with haze and a faint
 *                     window shaft between box and wall. Each band lights in order at an even pace (threshold
 *                     lanterns, knobs, hidden layers and a backward arrow, furnaces and a sea of text, attention
 *                     threads drawn as arcs of light, type sorts); the seam between 3 and 4 stays dark. Last, a pair
 *                     of preference shears drops into the dark slot at the top and clicks in (5.9) and lights.
 *                     The bands carry no words and no dates.
 *          4.6        Rosenblatt's slip lifts off W3 (top right, out of frame) and floats down in the box's light,
 *                     to the RIGHT of the column, docking ≈ 0.35 s after the click (so the complete column holds
 *                     clean for a beat) with only its lower-left corner laid over band 6's type sorts and the box's
 *                     right edge; bands 1–5 and the shears stay clear. Its tag hangs beside it, right of the box:
 *                     'a hunch, not a forecast · 1961'. No tick, no glint, no verdict.
 *   'language' 10.4   the pull-back begins (ease-in), plateaus 10.95 → 11.35 around the pin on 'door' (11.04):
 *                     the hands reach in from frame LEFT (lower-left entry) and pin the shears clue card into C4-b,
 *                     beneath the type sort in C4-a; a thread of light runs to it
 *          11.35      the slip drifts back to W3 and the camera completes the pull-back to THE FULL WIDE by 12.45:
 *                     board, candle shelf and the Wall in one frame, the X-ray the brightest cool object (the window
 *                     is dimmed under it), every band lit; held still to the cut (≥ 2.45 s).
 * TEXT RULE: the slip's own typed lettering (the verbatim quote) and its tag only.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { FONT, LAYERS, MOODS, defineShot, dustMotes, godRays, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import { drapery } from '../sets/occluders';
import { bankersLamp } from '../../../film/silhouette/props/lights';
import { XRAY, XRAY_REST, xrayScreenFraction, XRAY_SUBJECT_FRACTION } from '../sets/xrayColumn';
import { hands } from '../cast';
import { STUDY, STUDY_CAMS, STUDY_WALL, slotWorld, studyCase, studyNear, studyRoom, wallSlotWorld } from '../sets/study';
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

/** (review r1) the slip docks to the RIGHT of the column: its left edge just over band 6's last type sorts and the box's
 *  right edge, its bottom at band 6's bottom, so bands 1–5 and the shears stay visible; scale 1.3 keeps its typed
 *  lines above the legibility floor in the READ framing */
const SLIP_S = 1.3;
const SLIP_W = W3.w * STUDY.wall.k * SLIP_S;
const SLIP_H = W3.h * STUDY.wall.k * SLIP_S;
const SLIP_AT: Pt = { x: BOXX + 60 + SLIP_W / 2, y: bandY(6) + 16 - SLIP_H / 2 };
/** the slip docks this long after the shears' click: the complete column holds clean for a beat first */
const SLIP_LAG = 0.35;

// ------------------------------------------------------------------------------------------------ cameras
/** square-on at the base: the box's bottom edge and stand sit ≈ 20% up from the frame bottom */
const TILT0: Camera3 = { x: BOXX, y: STUDY.xray.y + 18 - 216 / (1000 / (1000 - 560)), z: 560, lens: 1 };
const TILT1: Camera3 = { x: BOXX, y: bandY(7) + 18, z: 560, lens: 1 };
/** (round 1) the reading frames sit 50 px further left with the slip, so no Wall slip pokes in at top right */
const READ: Camera3 = { x: BOXX - 20, y: 468, z: 480, lens: 1 };
const READ2: Camera3 = { x: BOXX - 26, y: 466, z: 502, lens: 1 };
/** (review r1) the pull-back starts on 'language' (10.4) with an ease-in, PLATEAUS (still) around the pin on 'door'
 *  (10.95 → 11.35) so the pin reads as a placed action, then completes to THE FULL WIDE by 12.45; held still ≥ 2.45 s */
const PB0 = 10.4;
const PB_A = 10.95;
const PB_B = 11.35;
const PB1 = 12.45;
/** how far along the pull-back the plateau sits (a medium framing: C4-b well inside frame left) */
const PB_MID = 0.2;
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
    // (round 2) no murky opening: band 1's lamp is already warming as the crossfade lands (full by ≈ 0.4 s), so the
    // tilt starts framed on the lit lower slot; the others follow at an even pace to the shears' click
    const l0 = -0.1;
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
    // (round 2) the tint crossfade rides the picture crossfade (−0.5 → +0.45 s): amber by the time the cut is clear
    f.setMood('candleAmber', { from: 'serverCyan', u: sm((t + 0.5) / 0.95) });
    studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'serverCyan', kind: 'city', city: 0.7 } });
    // (review r1) the window's night blue is held a stop down, so the X-ray is the brightest cool object in the wide
    windowDim(f);
    // (round 1) haze between the box and the wall, lit cold by the box (behind the action plane)
    boxHaze(f, b, t);
    const pinU = pinWarp((tq - (b.door - 0.45 * PIN_DUR)) / PIN_DUR);
    const placed = pinU >= 0.45;
    const xs = xrayState(b, t);
    const lit = xs.state.lit.filter(Boolean).length + (xs.reveal ? xs.reveal.u : 0);
    // (review r1) the box is a glowing practical, not washed paper: overall glow 0.75 → 1 as the bands fill
    const light = 0.75 + 0.25 * (lit / 7);
    // the hand enters from the lower edge of the frame as it is at the pin (fixed in the world while the camera moves)
    const pinEntry = handsEntry2(camAt(b, b.door));
    studyCase(f, {
      shot: ID,
      when: placed ? 'end' : 'start',
      key: ID,
      board: { hide: ['C4-b', 'F1'] },
      wall: { hide: ['W3'] },
      // (review r3 hand-off) the face rests at 60 % (XRAY_REST) and only the slot that is lighting lifts to full
      xray: { light, state: xs.state, reveal: xs.reveal, slotGlint: xs.state.lit[6] ? 0 : 0.001, dim: faceDim(b, t) },
      extra: (c, env) => {
        // the founding row as ch09-s04 left it: OpenAI's card and its pair of lanterns on one nail
        openaiCard(c, env, F1C.x, F1C.y);
        lanternPair(c, env, NAIL1, 0.55);
        // band 7 before the click: a dark row with only the empty, shears-shaped hole; then the shears drop in
        bandLights(c, b, t);
        faceGlow(c, b, t);
        attentionArcs(c, b, t);
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
    // (review r1) the box as a glowing practical: a soft additive cyan bloom ≈ 1.3× its width
    boxBloom(f, b, t);
    // the slip floats in the box's light (after the rim pass: paper lit from behind by the cyan glow)
    f.layer('L4', (c, env) => {
      const sp = slipAt(b, t, tq);
      rosenSlip(c, env, sp.p, sp.s, sp.rot, sp.glow);
      dustMotes(c, { area: { x: BOXX - 260, y: 300, w: 560, h: 380 }, count: 26, drift: { x: -2, y: -3 }, brightness: 0.35, salt: 1207 }, env);
    });
    nearTilt(f, t);
    nearDrape(f, t);
    closeVignette(f, t);
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
  // THE FULL WIDE (review r1): an ease-in start on 'language', a still plateau around the pin on 'door', then the rest
  // of the pull-back in one eased move; held still from PB1 to the cut
  const u = PB_MID * sm((t - PB0) / (PB_A - PB0)) + (1 - PB_MID) * ease.move(clamp01((t - PB_B) / (PB1 - PB_B)));
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

/** the lighting slot's lift 0..1: rises over the band's reveal and eases back over ≈ 0.45 s, so the column breathes
 *  up on each chime; after the shears' click it holds for the slip's arrival, then settles before the pin on 'door' */
function lightingLift(b: B, t: number): number {
  let k = 0;
  b.lights.forEach((L, i) => {
    const dur = i === 6 ? 0.2 : 0.5;
    if (t < L) return;
    if (t < L + dur) k = Math.max(k, sm((t - L) / dur));
    else if (i < 6) k = Math.max(k, Math.exp(-(t - L - dur) / 0.45));
    else k = Math.max(k, t < L + dur + 0.9 ? 1 : Math.exp(-(t - L - dur - 0.9) / 0.9));
  });
  return k;
}
/** (review r3 hand-off: kit x-ray subject rule) the face brightness: rests at 60 % (XRAY_REST); only the slot that is
 *  lighting lifts to full (the kit applies the lift to that slot alone when the cabinet is the subject) */
function faceDim(b: B, t: number): number {
  return XRAY_REST + (1 - XRAY_REST) * lightingLift(b, t);
}
/** the bloom's breathing (a practical's glow around the box, not its face): 0.8 → 1 on each chime */
function bloomBreath(b: B, t: number): number {
  return 0.8 + 0.2 * lightingLift(b, t);
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
      // (review r3) the lighting slot's flash in the warm, desaturated tone of the kit's subject rule
      c.fillStyle = withAlpha(mixLab(CYAN.core, '#cfc6b0', 0.6), 0.3 * k);
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

/** (review r1) direct-to-stage planes for true additive / multiply light (an unblurred custom plane draws straight on
 *  the frame, unlike L4's scratch): the bloom and the cold spill share L4's depth, the window dim the study wall's */
const LIGHT_L4: LayerSpec = { id: 'ch12s07light', z: LAYERS.L4.z, haze: 0, blur: 0 };
const WALL_DIM: LayerSpec = { id: 'ch12s07wallDim', z: STUDY_WALL.z, haze: 0, blur: 0 };
const GLOW = { x: BOXX, y: STUDY.xray.y - (XRAY.h / 2) * XS };
/** the box's outer width (frame included), world px */
const BOX_W = (XRAY.w + 28) * XS;

/** haze between the box and the wall, lit cold by the box (behind the action plane); (review r1) a stop brighter,
 *  with a faint cool shaft from the window side raking down across the wall behind the box */
function boxHaze(f: Frame, b: B, t: number) {
  const k = 0.45 + 0.55 * litFrac(b, t);
  f.fog({ yCenter: 470, height: 320, alpha: 0.17, drift: 4 });
  f.layer('L3', (c, env) => {
    godRays(c, { beams: [{ x0: 1820, y0: -160, w0: 150, x1: 1010, y1: 900, w1: 430 }], intensity: 0.3, color: mixLab(CYAN.halo, env.mood.haze, 0.45), streaks: 5, shimmer: 0.08, softness: 40, salt: 1207 }, env);
    const sc = toScreen(LAYERS.L4, f.cam, GLOW.x, GLOW.y);
    const p = toLayer(LAYERS.L3, f.cam, sc.x, sc.y);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(p.x, p.y, 30, p.x, p.y, 480);
    g.addColorStop(0, withAlpha(CYAN.halo, 0.2 * k));
    g.addColorStop(0.5, withAlpha(CYAN.halo, 0.06 * k));
    g.addColorStop(1, withAlpha(CYAN.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - 480, p.y - 480, 960, 960);
    c.restore();
  });
}

/** the box's cold light across the board cards at its left (the brief: 'its light falling cold across the board and
 *  the hands'); (review r1) truly additive and stronger, so it visibly rakes the C4 cards and the pinning arm */
function coldSpill(f: Frame, b: B, t: number) {
  const k = litFrac(b, t);
  if (k <= 0.01) return;
  f.layer(LIGHT_L4, (c) => {
    const x0 = BOXX - (XRAY.w / 2 + 14) * XS;
    const cy = GLOW.y;
    c.save();
    c.beginPath();
    c.rect(x0 - 1000, cy - 800, 1000, 1600);
    c.clip();
    c.globalCompositeOperation = 'lighter';
    const R = 640;
    const g = c.createRadialGradient(x0, cy, 20, x0, cy, R);
    g.addColorStop(0, withAlpha(CYAN.halo, 0.2 * k));
    g.addColorStop(0.45, withAlpha(CYAN.halo, 0.08 * k));
    g.addColorStop(1, withAlpha(CYAN.halo, 0));
    c.fillStyle = g;
    c.translate(x0, cy);
    c.scale(1, 0.8);
    c.translate(-x0, -cy);
    c.fillRect(x0 - R, cy - R, 2 * R, 2 * R);
    c.restore();
  });
}

/** (review r1) the box as a glowing serverCyan practical: a soft additive bloom ≈ 1.3× its width (taller than wide,
 *  like the box), following the face's breathing; the brightest cool object in every framing */
function boxBloom(f: Frame, b: B, t: number) {
  const k = (0.55 + 0.45 * litFrac(b, t)) * bloomBreath(b, t);
  // (review r3: kit x-ray subject rule) while the cabinet is the subject its face is the 60 % paper the kit paints:
  // the bloom glows around the box and is kept off its face (no additive cyan wash over the bands)
  const subject = xrayScreenFraction(f.cam, { x: BOXX, y: STUDY.xray.y, s: XS }) > XRAY_SUBJECT_FRACTION * 0.8;
  f.layer(LIGHT_L4, (c) => {
    const R = 1.3 * BOX_W;
    c.save();
    if (subject) {
      const fw = (XRAY.w / 2) * XS, fh = XRAY.h * XS;
      c.beginPath();
      c.rect(GLOW.x - 4 * R, GLOW.y - 4 * R, 8 * R, 8 * R);
      c.rect(BOXX - fw, STUDY.xray.y - fh, 2 * fw, fh);
      c.clip('evenodd');
    }
    c.globalCompositeOperation = 'lighter';
    c.translate(GLOW.x, GLOW.y);
    c.scale(1, 1.55);
    const col = mixLab(mixLab(CYAN.halo, CYAN.core, 0.25), '#cfc6b0', 0.2);
    const g = c.createRadialGradient(0, 0, 8, 0, 0, R);
    g.addColorStop(0, withAlpha(col, 0.25 * k));
    g.addColorStop(0.38, withAlpha(col, 0.2 * k));
    g.addColorStop(0.55, withAlpha(col, 0.07 * k));
    g.addColorStop(0.8, withAlpha(col, 0.015 * k));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(-R, -R, 2 * R, 2 * R);
    c.restore();
  });
}

/** (review r1) in the close framings a soft dark vignette pulls the frame's edges down, so the glowing box and the slip
 *  are the one lit plane; it lifts away through the pull-back (the wide carries its own dark) */
function closeVignette(f: Frame, t: number) {
  const a = 0.42 * (1 - sm((t - PB_B) / (PB1 - PB_B)));
  if (a <= 0.01) return;
  f.layer(LIGHT_L4, (c) => {
    const p0 = toLayer(LIGHT_L4, f.cam, 0, 0), p1 = toLayer(LIGHT_L4, f.cam, 1280, 720);
    const cx = (p0.x + p1.x) / 2, cy = (p0.y + p1.y) / 2;
    const rw = (p1.x - p0.x) / 2, rh = (p1.y - p0.y) / 2;
    c.save();
    c.translate(cx, cy);
    c.scale(rw, rh);
    const g = c.createRadialGradient(0.08, -0.05, 0.45, 0.08, -0.05, 1.45);
    g.addColorStop(0, 'rgba(8,6,4,0)');
    g.addColorStop(0.55, `rgba(8,6,4,${(0.55 * a).toFixed(3)})`);
    g.addColorStop(1, `rgba(8,6,4,${a.toFixed(3)})`);
    c.fillStyle = g;
    c.fillRect(-1.05, -1.05, 2.1, 2.1);
    c.restore();
  });
}

/** (review r1) the window's night blue a stop down (multiply over the hole in the study wall) */
function windowDim(f: Frame) {
  const W = STUDY.window;
  f.layer(WALL_DIM, (c) => {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = 'rgb(128,124,120)';
    c.fillRect(W.x - 4, W.y - 4, W.w + 8, W.h + 8);
    c.restore();
  });
}

/** (review r1) the lit vellum glows: an additive cyan-white lift over each lit band (its lamp behind the paper), so the
 *  face reads as a light source rather than grey-teal paper */
function faceGlow(c: C, b: B, t: number) {
  const fd = faceDim(b, t);
  // review round 3 (kit rule: the cabinet is the subject here): only the slot that is lighting lifts, and in a
  // desaturated, warmed tone (no longer a cyan-white wash over every lit band). The lighting slot is the latest band
  // whose lamp has started; its lift is gone before the next band starts (no overlapping tails)
  let i = 0;
  for (let j = 1; j <= 7; j++) if (t >= b.lights[j - 1]) i = j;
  if (!i) return;
  const L0 = b.lights[i - 1];
  const next = i < 7 ? b.lights[i] : Infinity;
  const dur = i === 7 ? 0.2 : 0.5;
  const tail = i === 7 ? 0.9 : 0.25;
  const u = (t < L0 + dur ? sm((t - L0) / dur) : Math.exp(-(t - L0 - dur) / tail)) * (1 - sm((t - (next - 0.12)) / 0.12));
  if (u <= 0.01) return;
  c.save();
  c.translate(BOXX, STUDY.xray.y);
  c.scale(XS, XS);
  c.globalCompositeOperation = 'lighter';
  const col = mixLab(CYAN.core, '#cfc6b0', 0.6);
  {
    const r = bandRect(i);
    const g = c.createRadialGradient(0, r.y + r.h / 2, 4, 0, r.y + r.h / 2, r.w * 0.62);
    g.addColorStop(0, withAlpha(col, 0.26 * u * fd));
    g.addColorStop(1, withAlpha(col, 0.07 * u * fd));
    c.fillStyle = g;
    c.fillRect(r.x, r.y, r.w, r.h);
  }
  c.restore();
}

/** (review r1) band 5's attention threads as ARCS of light between token dots (the column's own glyph reads as dashes
 *  at medium and wide scale) */
function attentionArcs(c: C, b: B, t: number) {
  const u = sm((t - b.lights[4]) / 0.5);
  if (u <= 0.01) return;
  const r = bandRect(5);
  const n = 6;
  const xs = Array.from({ length: n }, (_, j) => r.x + 14 + (j * (r.w - 28)) / (n - 1));
  const base = r.y + r.h - 8;
  const pairs: [number, number, number][] = [[0, 2, 0.55], [1, 4, 0.8], [2, 5, 0.7], [0, 5, 1]];
  // review round 3: glyph rows ink in warm grey (#cfc6b0 at 70 %), not near-white
  const col = '#cfc6b0';
  c.save();
  c.translate(BOXX, STUDY.xray.y);
  c.scale(XS, XS);
  c.globalCompositeOperation = 'source-over'; // review round 3: warm-grey ink, not an additive near-white
  c.lineCap = 'round';
  for (const [a, z, hk] of pairs) {
    const hgt = (r.h - 14) * hk;
    const path = new Path2D();
    path.moveTo(xs[a], base);
    path.bezierCurveTo(xs[a] + 6, base - hgt * 1.3, xs[z] - 6, base - hgt * 1.3, xs[z], base);
    c.strokeStyle = withAlpha(mixLab(CYAN.halo, col, 0.6), 0.12 * u);
    c.lineWidth = 6;
    c.stroke(path);
    c.strokeStyle = withAlpha(col, 0.7 * u);
    c.lineWidth = 2.2;
    c.stroke(path);
  }
  // the token dots the threads join
  c.fillStyle = withAlpha(col, 0.7 * u);
  for (const x of xs) {
    c.beginPath();
    c.arc(x, base, 2.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
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

/** (review r1) a second near plane that stays in frame through the tilt: a heavy drape edge at frame right (the study's
 *  window drapery), on a plane between the lens and the box. At TILT0 only its tasselled hem shows, above the lamp; as
 *  the camera tilts up it slides down faster than the box and holds the frame's right edge through the READ framing,
 *  then thins away at the start of the pull-back */
const NEAR_DRAPE: LayerSpec = { id: 'ch12s07drape', z: 880, haze: 0, blur: 5 };
const DR_X = toLayer(NEAR_DRAPE, TILT0, 1300, 0).x;
const DR_TOP = toLayer(NEAR_DRAPE, TILT1, 0, -120).y;
const DR_BOT = toLayer(NEAR_DRAPE, TILT0, 0, 330).y;
function nearDrape(f: Frame, t: number) {
  const a = 1 - sm((t - PB0) / 0.6);
  if (a <= 0.01) return;
  f.layer(NEAR_DRAPE, (c, env) => {
    const pad = 80;
    const x0 = DR_X - 140, y0 = DR_TOP - pad;
    const w = 220, h = DR_BOT - DR_TOP + 2 * pad;
    const draw = f.cached(`${ID}/drape/${env.mood.id}/${Math.round(x0)},${Math.round(y0)}`, w, Math.ceil(h), (cc) => {
      cc.translate(-x0, -y0);
      drapery(cc, { x: DR_X, top: DR_TOP - 40, bottom: DR_BOT, w: 52, side: 'right', folds: 5, tieback: DR_TOP + (DR_BOT - DR_TOP) * 0.7, seed: 1207 }, env);
    });
    c.save();
    c.globalAlpha *= a;
    draw(c, x0, y0);
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
  const a0 = b.rosen, a1 = b.shears + SLIP_LAG;
  const r0 = b.door + 0.3, r1 = r0 + 1.0;
  if (tq < a0) return home;
  const there: SlipPose = { p: SLIP_AT, s: SLIP_S, rot: -0.035 + 0.008 * Math.sin(t * 0.9), glow: 1 };
  if (tq < a1) {
    // lifts off its pin and floats down in a soft S toward the light (on twos: paper)
    const u = sm((tq - a0) / (a1 - a0));
    const sway = 0.08 * Math.sin(u * Math.PI * 2);
    return {
      p: { x: lerp(home.p.x, there.p.x, u) + 40 * Math.sin(u * Math.PI), y: lerp(home.p.y, there.p.y, u) },
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
    // (review r1) floating beside the box the tag is READ: three short typed lines on a tag hung from the slip's lower
    // right, wholly right of the box (it never covers a band). 9.2k Special Elite ≈ 24 px cap height at 1080p in the
    // READ framing (cap ratio 0.69). The font string names a fallback family so the legibility audit measures this face
    // afresh on the alphabetic baseline
    const fs = 9.2 * k;
    const TAG_LINES = ['a hunch,', 'not a forecast', '· 1961'];
    c.save();
    c.globalAlpha *= g2;
    c.textBaseline = 'alphabetic';
    c.font = `400 ${fs}px ${FONT.typewriter}, monospace`;
    const tw = Math.max(...TAG_LINES.map((l) => c.measureText(l).width)) + 12 * k;
    const lh = fs * 1.18;
    const th = lh * TAG_LINES.length + fs * 0.5;
    const tx = w / 2 - tw + 6 * k, ty = h / 2 + 7 * k;
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
    TAG_LINES.forEach((ln, i) => c.fillText(ln, tx + 6 * k, ty + fs * 1.05 + i * lh));
    c.restore();
  }
  c.restore();
}

// ================================================================================================ the clue card
function clueCard(c: C, env: PaintEnv, p: Pt, glow: number) {
  const s = SLOTS['C4-b'];
  drawCard(c, s, { x: p.x, y: p.y, k: STUDY.board.k, light: poolAt(POOL, s.x, s.y) + glow, lit: glow > 0.05 }, env);
}
/** (review r1) the pin hand reaches in at frame LEFT, from the lower-left corner: a short reach that crosses only the
 *  end of the candle shelf, never the glowing box */
function handsEntry2(cam: Camera3) {
  const R = toLayer(LAYERS.L4, cam, -90, 860);
  const L = toLayer(LAYERS.L4, cam, -140, 980);
  return { R, L };
}
