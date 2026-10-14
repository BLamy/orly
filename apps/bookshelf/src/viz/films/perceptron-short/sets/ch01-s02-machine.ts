/**
 * perceptron-short — ch01-s01 / ch01-s02: the Mark I installation staged in the night lab, shared so
 * s01's dolly ENDS on exactly s02's opening framing (MATCH_CAM) and the crossfade is a match-dissolve.
 *
 *   MK                 staging constants (L4 world): INST, S, PX, EYE (face centre), PATCH, POTS (3), PLATE
 *   MATCH_CAM          the camera both shots share at the cut
 *   drawMachine(c, env, { cells, patch?, racks?, eyeLight?, card?, dim?, knobs?, cords?, plate?, sweep? })
 *       The installation, all grounded on the floor: the camera-box eye on its pedestal aimed at a
 *       stimulus card (ch01-s01-eye), the plugboard and THREE potentiometer racks (the kit's console is
 *       replaced by a third rack, so nothing on the action plane floats). `patch` 0..1 = how lit the
 *       plugboard face is; `racks` 0..1 = how far the rack housings are pushed toward true ink.
 *       `dim` { patch, racks } 0..1: the part is "asleep" (multiplied toward black) until the narration
 *       names it: s01 holds everything right of the eye near black, s02 wakes each part on its word.
 *       The potentiometers are always drawn as ROUND knob faces (the same knobs ch01-s03 goes inside);
 *       `knobs` = { weights (240, -1..1), glow? (240, 0..1 glint), trail? [i, a0, a1, alpha][] arc trails }.
 *       `cords` 0..1 per hero cord (9): a rim highlight running along that patch cord (wires beat).
 *       `motors` { on, t }: the drive motor under every knob (a small can hung below its shelf); `on` 0..1 per
 *       knob makes that can run (rim light, jitter, rolling armature stripes on the twos).
 *       `sleepRim` (with `dim.racks`): a faint window rim on every knob top of the sleeping racks.
 *       `plate` { lit, sweep }: the blank engraved maker's plate on the first rack's header (unlettered);
 *       `sweep` 0..1: a soft highlight band travelling left → right across the three racks.
 *   nightCabinet(f, { key, x?, glow?, dark? })  L3 open instrument rack between the left windows
 *   nightBeam(f, { key, wx, k })               L3 blind-slatted shaft of window light falling to the floor
 *   knobAt(i) / HERO_CORDS                      knob centres (160) and the hero cord beziers (world)
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { CM, withCutLight } from '../../../film/silhouette/props/_kit';
import { MARK_I_LAYOUT, perceptronPatchboard, perceptronPotRack, tubeRack } from '../../../film/silhouette/props';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { LAB } from './lab';
import { eyeCell, markIEye } from './ch01-s01-eye';
export { markIEyeGlint } from './ch01-s01-eye';

const S = 1.15; // real size: puppet scale = prop scale
const PX = CM * S;
const INST = { x: 900, y: LAB.floorY };
const at = (cm: number) => INST.x + cm * PX;
export const MK = {
  S,
  PX,
  INST,
  at,
  /** the eye's stand foot + face centre */
  EYE_AT: { x: at(MARK_I_LAYOUT.retina), y: INST.y, s: S },
  EYE: { x: at(MARK_I_LAYOUT.retina), y: INST.y - 150 * PX },
  PATCH: { x: at(MARK_I_LAYOUT.patch), top: INST.y - 168 * PX, bot: INST.y - 28 * PX, hw: 33 * PX },
  /** three racks: the kit's console position carries a third rack */
  POTS: [at(MARK_I_LAYOUT.pot1), at(MARK_I_LAYOUT.pot2), at(MARK_I_LAYOUT.console)],
  /** the maker's plate across the first rack's header (centre, size) */
  PLATE: { x: at(MARK_I_LAYOUT.pot1), y: INST.y - 176.6 * PX, w: 62 * PX, h: 10 * PX },
  RACK_TOP: INST.y - 186 * PX,
  /** round knob face radius (world px): 0.42 of the 8 cm column pitch */
  KNOB_R: 3.4 * PX,
};
export const cellAt = (r: number, c: number) => eyeCell(MK.EYE_AT, r * 20 + c);
/** what s01's single glint leaves on the eye's cells (row r, column c): the faintest even charge, below
 * s02's idle shimmer. s01 ends on it and s02 opens on it (the match-dissolve) */
export const eyeResidue = (r: number, c: number) => 0.05 + 0.03 * h01(r * 20 + c, 77);
/** the sleeping machine as s01 holds it and s02 opens on it (review rounds 1-3: stand, desk and racks held
 * below ≈15% luminance, so only the window, the blind shafts and the glint on "see" read, and s02 shows each
 * part for the first time): `dim` for the plugboard and the racks, a whisper of haze `veil` (more would LIFT
 * them toward the haze colour), the shuttered `faces` (almost no dial lattice through the shutter), no knob-top
 * rim, a faint window rim on the cabinet tops (their cut edge against the glass), and the eye's resting face
 * light. s02 wakes each part from exactly this on the word that names it */
// review round 4 (value hierarchy): sideRim 0.24 -> 0: the racks carry light on their window-facing TOPS only
export const SLEEP = { dim: 1, veil: 0.04, faces: 0.12, sleepRim: 0, topRim: 0.32, sideRim: 0, shutterDark: 0.55, eyeLight: 0.1 };
/** what s01's glint on "see" LEAVES on the eye, held through the s01 → s02 crossfade (review round 1: the grid
 * must not dim across the cut): every cell faintly lit, the raking face light up, and a small phosphor glow
 * (f.practical 'screen', seed 61, the s03 bookend's) so the eye reads as the night lab's one light source.
 * s01 ends on exactly this; s02 opens on it and builds its shimmer from here */
/** review round 4 (story, four rounds): in s01 the machine is a RUMOUR in the dark. After drawMachine, the whole
 * action plane (eye housing, stand, card post, board, racks) is pushed this far further toward black (a
 * source-atop pass on the L4 layer), so it measures under ≈12% luma against the window; only the blind shafts,
 * the fog and the single glint on "see" (markIEyeGlint, painted after the pass) read. s02 opens on exactly
 * this and lifts it as the eye wakes on "Its" */
export const SLEEP_DARK = 0.68;
/** push everything already drawn on this (L4) layer toward black by `a` (0..1), keeping its holes */
export function sleepDarken(c: CanvasRenderingContext2D, a: number) {
  if (a <= 0.002) return;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = `rgba(0,0,0,${Math.min(1, a).toFixed(4)})`;
  c.fillRect(0, 0, c.canvas.width, c.canvas.height);
  c.restore();
}
export const EYE_HELD = { light: 0.5, glow: 0.3, radius: 50, seed: 61 };
export const eyeHeld = (r: number, c: number) => 0.2 + 0.05 * h01(r * 20 + c, 77);
/** the continuous push across the s01 → s02 cut: action-plane scale velocity (k per second) at the cut.
 * s01 lands on MATCH_CAM moving at this rate and extrapolates past its end; s02 starts at it */
export const CUT_PUSH_K = 0.07;
export const N_KNOBS = 240;
/** world centre of potentiometer unit i (0..79 rack 1, 80..159 rack 2, 160..239 rack 3) */
export const knobAt = (i: number) => perceptronPotRack.knob({ x: MK.POTS[Math.min(2, Math.floor(i / 80))], y: INST.y, s: S }, i % 80);

/** s02 opens here and s01 ends here: the eye just left of centre against the middle window, one rack
 * and a half at right (pushed back into the haze while they sleep) */
export const MATCH_CAM: Camera3 = { x: MK.EYE.x + 4, y: MK.EYE.y + 24, z: 266, lens: 1.15 };
/** the sleeping plugboard and racks sit back in the air (a haze veil, ≈25% lighter than the eye) until named */
export const RACK_VEIL = 0.26;
/** the near plane both shots share at the cut: s01's desk end + lamp (nightDesk) and pushed-back chair, and
 * s02's stool with a coil of cable on it (z 780), so the match-dissolve has the same foreground */
export const LAB_DESK = { x: 150, w: 330, top: 482, lamp: { x: 262, h: 108 } };
export const LAB_CHAIR = { kind: 'chair', x: 90, s: 1.3, flip: true } as const;
/** s01/s02 near plane: z 780 → 700 (review round 2: faster parallax), softer; deep enough for the s02 push (cam z ≤ 566) */
/** how far the back-wall rack (nightCabinet, L3) is pushed toward the haze colour (review round 3: 8%;
 * review round 4: another 8%, so 16%) */
export const BACK_RACK_HAZE = 0.16;
/** the set's rim direction for f.rim() in every lab shot (review round 4): straight up, so the crescent lands on
 * window-facing TOP edges only (no side or bottom strokes on the racks); figures carry their own window-side
 * contour rim (puppet edgeRim) */
export const SET_RIM = { x: 0, y: -1 } as const;
/** the rack housings' value (review round 4, value hierarchy): ONE STEP lighter than the near-black figure
 * (PUPPET_NEAR_BLACK), 30% of the way (Lab) to the mood's set value. `racks` pushes the housings toward it
 * (it used to push them toward black, where they met the man's value and merged with him) */
export const rackInk = (env: PaintEnv) => mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.3);
/** device px per world px of the current transform, over device px per 1080p px: lineWidth = px / rimScale(c, env) */
const rimScale = (c: CanvasRenderingContext2D, env: PaintEnv) => {
  const T = c.getTransform();
  return Math.hypot(T.a, T.b) / ((env.pxScale || 1.5) / 1.5) || 1;
};
export const NEAR_PLANE = { id: 'labNear700', z: 700, haze: 0, blur: 2.6 };
export const NEAR_FLOOR = 724;
/** two fluorescent fixtures hung low (L3 world) so they sit in the top of the opening and plugboard
 * framings: cold in s01, struck in s02 */
export const LOW_TUBES = [
  { x: 700, y: 214 },
  { x: 1010, y: 236 },
];

const h01 = (i: number, s: number) => {
  let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s, 0xc2b2ae35);
  x ^= x >>> 15;
  x = Math.imul(x, 0x27d4eb2d);
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
};
/** the 240 potentiometers' resting settings (seeded spread, -0.45..0.45), identical in s01 and s02 */
export const REST_WEIGHTS = Float32Array.from({ length: N_KNOBS }, (_, i) => (h01(i, 31) - 0.5) * 0.9);

/** pointer angle of a knob for weight w (-1..1): ±135°, the kit's pot scale */
export const KNOB_SWEEP = Math.PI * 0.75;
export const knobAngle = (w: number) => -Math.PI / 2 + Math.max(-1, Math.min(1, w)) * KNOB_SWEEP;

/** nine hero patch cords on the plugboard face (world cubic beziers), long throws that sag under gravity */
export const HERO_CORDS: [number, number, number, number, number, number, number, number][] = (() => {
  const P = MK.PATCH;
  const L = P.x - P.hw + 4;
  const W = P.hw * 2 - 8;
  const T = P.top + 10;
  const H = P.bot - P.top - 30;
  // [ax, ay, bx, by] as fractions of the panel face, droop as a fraction of its height
  const spec: [number, number, number, number, number][] = [
    [0.08, 0.06, 0.62, 0.2, 0.22],
    [0.3, 0.12, 0.92, 0.1, 0.26],
    [0.85, 0.24, 0.12, 0.38, 0.2],
    [0.18, 0.4, 0.74, 0.46, 0.18],
    [0.55, 0.3, 0.95, 0.58, 0.16],
    [0.05, 0.56, 0.48, 0.62, 0.17],
    [0.9, 0.66, 0.28, 0.74, 0.14],
    [0.12, 0.8, 0.66, 0.84, 0.12],
    [0.4, 0.5, 0.82, 0.9, 0.12],
  ];
  return spec.map(([ax, ay, bx, by, d]) => {
    const a = { x: L + ax * W, y: T + ay * H };
    const b = { x: L + bx * W, y: T + by * H };
    const lo = Math.max(a.y, b.y) + d * H;
    const s1 = bx > ax ? 1 : -1;
    return [a.x, a.y, a.x + s1 * 6, lo, b.x - s1 * 6, lo, b.x, b.y];
  });
})();
export function cordPoint(k: number, u: number) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = HERO_CORDS[k];
  const v = 1 - u;
  return {
    x: v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3,
    y: v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3,
  };
}
const CORD_LEN = HERO_CORDS.map((_, k) => {
  let L = 0;
  let p = cordPoint(k, 0);
  for (let i = 1; i <= 24; i++) {
    const q = cordPoint(k, i / 24);
    L += Math.hypot(q.x - p.x, q.y - p.y);
    p = q;
  }
  return L;
});

export interface MachineOpts {
  cells?: ArrayLike<number>;
  /** plugboard face brightness 0 (set value) .. 1 (kit floodlit face) */
  patch?: number;
  /** push rack housings toward rackInk (one step above the near-black figure) 0..1 */
  racks?: number;
  eyeLight?: number;
  /** 0..1 the stimulus card's lamp */
  card?: number;
  /** 0..1 per part: multiplied toward black until the part is named */
  dim?: { patch?: number; racks?: number };
  /** the maker's plate: settled brightness of its engraving, and a light sweep position (−∞..0 before, 1.. after) */
  plate?: { lit: number; sweep: number };
  /** highlight band across the racks: 0 = at the first rack's left edge, 1 = past the third rack */
  sweep?: number;
  knobs?: { weights: ArrayLike<number>; glow?: ArrayLike<number>; trail?: [number, number, number, number][] };
  /** 0..1 per hero cord: the rim light running along it */
  cords?: ArrayLike<number>;
  /** asleep racks only: alpha (≈0.1–0.15) of a faint window rim on the top of every knob, so a grid of knob tops hints at the racks */
  sleepRim?: number;
  /** the motor behind each potentiometer: `on` 0..1 per knob (running: its drive gear shows behind the knob and turns), `t` the twos time */
  motors?: { on: ArrayLike<number>; t: number };
  /** 0..1 haze veil over the plugboard / rack housings (they sit back in the air while asleep) */
  veil?: { patch?: number; racks?: number };
  /** 0..1: how much of an ASLEEP face still shows through its shutter (the dial rows and the plugboard
   * perforations as faint cut-outs, so s01, s02 and the s03 bookend share one rack design). Default 0.6 */
  faces?: number;
  /** alpha of the window rim along every cabinet's cut top edge (a crescent facing the window). Default 0.5 */
  topRim?: number;
  /** 0..1: how far an ASLEEP part's shutter is pushed from the hazed ink toward black, so the shuttered face
   * sits at the housing's own value instead of reading as a lighter inset panel (s01 / s02 open). Default 0 */
  shutterDark?: number;
  /** RETIRED in review round 4 (racks carry rims on their tops only; every shot passes 0): alpha of a window rim
   * down each rack's side edges. Default 0 */
  sideRim?: number;
}

/** black at alpha a: drawn source-atop, it scales what is there by (1 − a) */
const darken = (a: number) => `rgba(0,0,0,${Math.max(0, Math.min(1, a)).toFixed(3)})`;

/** each potentiometer's drive motor: a small can hung under the shelf below its knob (world px, from the knob centre) */
const CAN = { y0: 5.5 * PX, h: 4.4 * PX, hw: 2.5 * PX };
const CANS = (() => {
  const p = new Path2D();
  const rim = new Path2D();
  for (let i = 0; i < N_KNOBS; i++) {
    const q = knobAt(i);
    p.roundRect(q.x - CAN.hw, q.y + CAN.y0, CAN.hw * 2, CAN.h, 0.8 * PX);
    // the shaft up to the shelf
    p.rect(q.x - 0.35 * PX, q.y + 3.6 * PX, 0.7 * PX, CAN.y0 - 3.4 * PX);
    rim.moveTo(q.x - CAN.hw + 0.6 * PX, q.y + CAN.y0 + 0.4);
    rim.lineTo(q.x + CAN.hw - 0.6 * PX, q.y + CAN.y0 + 0.4);
  }
  return { p, rim };
})();

/** every potentiometer's drive motor: a small ink can under its shelf (static; a running one shows its gear) */
function drawMotors(c: CanvasRenderingContext2D, env: PaintEnv) {
  const mood = env.mood;
  c.save();
  c.fillStyle = mixLab(env.fill('ink'), mood.set, 0.1);
  c.fill(CANS.p);
  c.strokeStyle = withAlpha(mood.rim, 0.22);
  c.lineWidth = 0.8;
  c.stroke(CANS.rim);
  c.restore();
}

/** a running motor behind its knob: a round ink housing a little proud of the knob's skirt, its rim lit on
 * the window side while it runs, and a short rotation-blur arc (rim colour) sweeping round it on the twos.
 * Drawn before the knob faces. */
function drawGears(c: CanvasRenderingContext2D, env: PaintEnv, m: NonNullable<MachineOpts['motors']>, weights: ArrayLike<number>) {
  const mood = env.mood;
  const R = MK.KNOB_R;
  const ink = env.fill('ink');
  for (let i = 0; i < N_KNOBS; i++) {
    const on = m.on[i] ?? 0;
    if (on <= 0.01) continue;
    const q = knobAt(i);
    const rh = R * 1.55;
    c.save();
    c.globalAlpha = Math.min(1, on * 1.3);
    // the housing
    c.fillStyle = ink;
    c.beginPath();
    c.arc(q.x, q.y, rh, 0, Math.PI * 2);
    c.fill();
    // its window-side rim (upper left), brightening while the motor runs
    c.strokeStyle = withAlpha(mood.rim, 0.85 * on);
    c.lineWidth = 1.3;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(q.x, q.y, rh - 0.6, Math.PI * 1.02, Math.PI * 1.62);
    c.stroke();
    // the rotation blur: a short arc that runs round the housing (turning with the knob's own travel)
    const a = knobAngle(weights[i] ?? 0) * 2.2 + m.t * 9;
    for (let k = 0; k < 6; k++) {
      c.strokeStyle = withAlpha(mood.rim, 0.6 * on * (1 - k / 6));
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(q.x, q.y, rh + 1.6, a - (k + 1) * 0.16, a - k * 0.16);
      c.stroke();
    }
    c.restore();
  }
}

function drawKnobs(c: CanvasRenderingContext2D, env: PaintEnv, k: NonNullable<MachineOpts['knobs']>) {
  const R = MK.KNOB_R;
  const ink = env.fill('ink');
  const faces = new Path2D();
  const rings = new Path2D();
  const ringsLow = new Path2D();
  const ptr = new Path2D();
  for (let i = 0; i < N_KNOBS; i++) {
    const p = knobAt(i);
    faces.moveTo(p.x + R * 1.18, p.y);
    faces.arc(p.x, p.y, R * 1.18, 0, Math.PI * 2); // the dark skirt hides the kit's motor can
    rings.moveTo(p.x + Math.cos(Math.PI * 1.08) * R, p.y + Math.sin(Math.PI * 1.08) * R);
    rings.arc(p.x, p.y, R, Math.PI * 1.08, Math.PI * 1.92);
    ringsLow.moveTo(p.x + Math.cos(Math.PI * 0.02) * R, p.y + Math.sin(Math.PI * 0.02) * R);
    ringsLow.arc(p.x, p.y, R, Math.PI * 0.02, Math.PI * 0.98);
    const a = knobAngle(k.weights[i] ?? 0);
    ptr.moveTo(p.x + Math.cos(a) * R * 0.15, p.y + Math.sin(a) * R * 0.15);
    ptr.lineTo(p.x + Math.cos(a) * R * 0.86, p.y + Math.sin(a) * R * 0.86);
  }
  c.save();
  c.fillStyle = ink;
  c.fill(faces);
  // rings catch the window light on their upper (window-facing) arc only; the lower arc stays nearly ink
  c.strokeStyle = withAlpha(env.mood.rim, 0.42);
  c.lineWidth = 0.9;
  c.stroke(rings);
  c.strokeStyle = withAlpha(env.fill('ink'), 0.78);
  c.lineWidth = 1.3;
  c.stroke(ringsLow);
  c.strokeStyle = withAlpha(env.mood.rim, 0.85);
  c.lineWidth = 1.5;
  c.lineCap = 'round';
  c.stroke(ptr);
  // glints and arc trails: the motors turning (additive, the shot's one moving accent)
  c.globalCompositeOperation = 'lighter';
  if (k.glow)
    for (let i = 0; i < N_KNOBS; i++) {
      const g = k.glow[i] ?? 0;
      if (g <= 0.01) continue;
      const p = knobAt(i);
      // a tight glint (≈ the skirt), so the pointer and the arc arrow stay readable through it
      const gr = R * 1.9;
      const rg = c.createRadialGradient(p.x, p.y, R * 0.9, p.x, p.y, gr);
      rg.addColorStop(0, withAlpha(env.mood.core, 0.4 * g));
      rg.addColorStop(1, withAlpha(env.mood.core, 0));
      c.fillStyle = rg;
      c.fillRect(p.x - gr, p.y - gr, gr * 2, gr * 2);
    }
  for (const [i, a0, a1, al] of k.trail ?? []) {
    if (al <= 0.01) continue;
    const p = knobAt(i);
    const ra = R * 1.2;
    // a rotation-blur wedge from the old setting to the new one, brightest at the leading edge
    const n = 8;
    for (let s = 0; s < n; s++) {
      const u0 = s / n;
      const u1 = (s + 1) / n;
      c.strokeStyle = withAlpha(env.mood.rim, 0.75 * al * (0.25 + 0.75 * u1));
      c.lineWidth = 2.2;
      c.beginPath();
      const b0 = a0 + (a1 - a0) * u0;
      const b1 = a0 + (a1 - a0) * u1;
      c.arc(p.x, p.y, ra, Math.min(b0, b1), Math.max(b0, b1));
      c.stroke();
    }
  }
  c.restore();
  // the turning pointers, bright while they move (over the glint)
  if (k.glow) {
    c.save();
    c.strokeStyle = withAlpha(env.mood.core, 0.95);
    c.lineWidth = 2;
    c.lineCap = 'round';
    for (let i = 0; i < N_KNOBS; i++) {
      const g = k.glow[i] ?? 0;
      if (g <= 0.05) continue;
      const p = knobAt(i);
      const a = knobAngle(k.weights[i] ?? 0);
      c.globalAlpha = Math.min(1, g * 1.4);
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + Math.cos(a) * R * 0.95, p.y + Math.sin(a) * R * 0.95);
      c.stroke();
    }
    c.restore();
  }
}

function drawCords(c: CanvasRenderingContext2D, env: PaintEnv, lit: ArrayLike<number> | undefined) {
  c.save();
  c.lineCap = 'round';
  // the hero cords themselves: heavier ink cables over the tangle
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 2.2;
  c.beginPath();
  for (const [x0, y0, x1, y1, x2, y2, x3, y3] of HERO_CORDS) {
    c.moveTo(x0, y0);
    c.bezierCurveTo(x1, y1, x2, y2, x3, y3);
  }
  c.stroke();
  if (lit) {
    // a rim light SWEEPS along the cord: a lit segment (≈30% of its length) travels the catenary as u runs
    // 0 → 1, brightest at its leading end, then the cord rests faintly lit along its top (no glints)
    HERO_CORDS.forEach(([x0, y0, x1, y1, x2, y2, x3, y3], k) => {
      const u = lit[k] ?? 0;
      if (u <= 0.002) return;
      const L = CORD_LEN[k];
      const path = new Path2D();
      path.moveTo(x0, y0 - 0.9);
      path.bezierCurveTo(x1, y1 - 0.9, x2, y2 - 0.9, x3, y3 - 0.9);
      // the resting rim, coming up behind the sweep
      const rest = Math.min(1, Math.max(0, (u - 0.3) / 0.7));
      if (rest > 0) {
        c.setLineDash([]);
        c.strokeStyle = withAlpha(env.mood.rim, 0.32 * rest);
        c.lineWidth = 1.2;
        c.stroke(path);
      }
      if (u < 1.35) {
        const head = Math.min(1.35, u * 1.3);
        const seg = 0.3;
        for (let j = 0; j < 4; j++) {
          // the segment in four bands, dimmer toward its tail
          const s0 = head - seg * ((j + 1) / 4);
          const s1 = head - seg * (j / 4);
          const a0 = Math.max(0, s0);
          const a1 = Math.min(1, s1);
          if (a1 <= a0) continue;
          c.setLineDash([(a1 - a0) * L, L * 3]);
          c.lineDashOffset = -a0 * L;
          c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.35), 0.9 * (1 - j * 0.22));
          c.lineWidth = 1.8;
          c.stroke(path);
        }
        c.lineDashOffset = 0;
      }
    });
    c.setLineDash([]);
  }
  c.restore();
}

/**
 * The windows are behind and above the machine: cut-lines and louvres catch light only in the top band
 * of each cabinet and fade to nothing by about mid-height; the vertical door seams that hug the side
 * edges are not drawn at all (side 0), so no cabinet carries an all-round outline. The window-facing
 * SIDE edge comes from each shot's own f.rim() direction (review round 2, lab set craft).
 * Local units (cm, y up negative) of each Mark I sub-unit.
 */
export const MACHINE_CUT_LIGHT = { a: { x: 0, y: -196 }, b: { x: 0, y: -84 }, floor: 0, side: 0 as const };

// ---------------------------------------------------------------- cut-paper craft (L4 world)
const W = (xcm: number, ycm: number) => ({ x: at(xcm), y: INST.y + ycm * PX });
/** each cabinet is cut differently: its own louvre counts (top block, kick block); the plugboard rolls on casters */
const CAB = [
  { id: 'patch', x: MARK_I_LAYOUT.patch, w: 78, h: 186, louvres: true, top: 4, kick: 3, casters: true },
  { id: 'pot1', x: MARK_I_LAYOUT.pot1, w: 70, h: 186, louvres: true, top: 6, kick: 4, casters: false },
  { id: 'pot2', x: MARK_I_LAYOUT.pot2, w: 70, h: 186, louvres: true, top: 9, kick: 2, casters: false },
  { id: 'pot3', x: MARK_I_LAYOUT.console, w: 70, h: 186, louvres: true, top: 3, kick: 5, casters: false },
] as const;
const jit = (i: number, s: number) => h01(i, s) * 2 - 1;

/** paths in world px, built once */
const CRAFT = (() => {
  const slits = new Path2D(); // louvre slits punched through (the window light shows through)
  const nicks = new Path2D(); // hand-cut irregularity: tiny bites out of the top and side edges
  const feet = new Path2D(); // levelling feet / casters (ink)
  const wheels = new Path2D(); // caster wheels (ink, rim on their top arc)
  const wheelRim = new Path2D();
  const trim = new Path2D(); // uneven cut-paper cornice strips on the cabinet tops
  const trimTop = new Path2D(); // the cornice's cut upper edge alone (the window rim runs along it)
  const louvreBands = new Path2D(); // the kit's own (identical) louvre lines, inked over before re-cutting
  // review round 3: the kit rack's lifted back plate showed as a thin light band between the housing and the
  // outer knob column on EVERY side, so each rack read as outlined. The bay's outer margins are inked (the open
  // grid between the knobs stays); the only light on a housing edge is the window-facing rim (cornice + f.rim)
  const bayFrame = new Path2D();
  CAB.forEach((cb, ci) => {
    const hw = cb.w / 2;
    if (cb.id !== 'patch') {
      // kit rack (perceptron.ts POT): bay x ±31.5, y -170..-24; outer knob cans reach ±30.4, rows -165.1..-28.9
      const box = (x0: number, y0: number, x1: number, y1: number) => {
        const a = W(cb.x + x0, y0);
        const b = W(cb.x + x1, y1);
        bayFrame.rect(a.x, a.y, b.x - a.x, b.y - a.y);
      };
      box(-31.8, -170.4, -30.2, -23.6); // left margin
      box(30.2, -170.4, 31.8, -23.6); // right margin
      box(-31.8, -170.4, 31.8, -165.4); // under the header
      box(-31.8, -28.6, 31.8, -23.6); // above the kick
    }
    if (cb.louvres) {
      let a = W(cb.x - hw + 6.5, -cb.h + 5.6);
      let b = W(cb.x + hw - 6.5, -cb.h + 17.8);
      louvreBands.rect(a.x, a.y, b.x - a.x, b.y - a.y);
      a = W(cb.x - hw + 8.5, -17.4);
      b = W(cb.x + hw - 8.5, -8.6);
      louvreBands.rect(a.x, a.y, b.x - a.x, b.y - a.y);
      // top block: `top` slits spread over the same band (more slits = finer pitch); its width varies too
      const inset = 9 + (cb.top > 6 ? -1.5 : cb.top < 5 ? 3 : 0);
      for (let i = 0; i < cb.top; i++) {
        const y = -cb.h + 6.6 + (cb.top > 1 ? (i * 10) / (cb.top - 1) : 5) - 0.4;
        const p0 = W(cb.x - hw + inset + 0.6 * jit(i, ci * 7 + 1), y);
        const p1 = W(cb.x + hw - inset + 0.6 * jit(i, ci * 7 + 2), y + (cb.top > 6 ? 0.6 : 0.8));
        slits.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
      }
      for (let i = 0; i < cb.kick; i++) {
        const y = -16.4 + (cb.kick > 1 ? (i * 6) / (cb.kick - 1) : 3);
        const p0 = W(cb.x - hw + 11 + (cb.kick < 3 ? 6 : 0), y);
        const p1 = W(cb.x + hw - 11 - (cb.kick < 3 ? 6 : 0), y + 0.75);
        slits.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
      }
    }
    // cornice: a strip a little proud of the top, its upper edge cut by hand (not ruler-straight)
    const n = 14;
    const p0 = W(cb.x - hw - 1.2, -cb.h + 0.6);
    trim.moveTo(p0.x, p0.y);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const q = W(cb.x - hw - 1.2 + (cb.w + 2.4) * u, -cb.h - 1.6 - 0.55 * Math.abs(jit(i, ci * 13 + 5)));
      trim.lineTo(q.x, q.y);
      // review round 4: the rim runs along the cut TOP only (it no longer turns down the left corner: no side stroke)
      if (i === 0) trimTop.moveTo(q.x, q.y + 0.6);
      else trimTop.lineTo(q.x, q.y + 0.6);
    }
    const p1 = W(cb.x + hw + 1.2, -cb.h + 0.6);
    trim.lineTo(p1.x, p1.y);
    trim.closePath();
    // nicks along the top and both sides
    for (let i = 0; i < 9; i++) {
      const u = (i + 0.5 + 0.35 * jit(i, ci * 17 + 3)) / 9;
      const d = 0.35 + 0.45 * h01(i, ci * 17 + 4);
      const xc = cb.x - hw + cb.w * u;
      const a = W(xc - d, -cb.h - 1.65);
      const b = W(xc + d * 0.7, -cb.h - 1.65);
      const m = W(xc + 0.2 * jit(i, ci), -cb.h - 1.65 + d * 1.3);
      nicks.moveTo(a.x, a.y);
      nicks.lineTo(m.x, m.y);
      nicks.lineTo(b.x, b.y);
      nicks.closePath();
    }
    for (const side of [-1, 1])
      for (let i = 0; i < 5; i++) {
        const y = -cb.h + 22 + (cb.h - 40) * ((i + 0.5 + 0.3 * jit(i, ci * 31 + side)) / 5);
        const d = 0.3 + 0.35 * h01(i, ci * 31 + side + 9);
        const a = W(cb.x + side * (hw + 0.1), y - d * 1.4);
        const m = W(cb.x + side * (hw - d), y);
        const b = W(cb.x + side * (hw + 0.1), y + d * 1.2);
        nicks.moveTo(a.x, a.y);
        nicks.lineTo(m.x, m.y);
        nicks.lineTo(b.x, b.y);
        nicks.closePath();
      }
    // feet: levelling pads proud of the plinth, or (the plugboard, which was wheeled in) caster wheels
    if (cb.casters) {
      for (const side of [-1, 1]) {
        const x0 = cb.x + side * (hw - 6);
        // a swivel fork under the plinth, the wheel trailing a little behind its kingpin
        const f0 = W(x0 - 2.2, -6.2);
        const f1 = W(x0 + 2.6, -2.4);
        feet.rect(f0.x, f0.y, f1.x - f0.x, f1.y - f0.y);
        const wc = W(x0 + 1.2 * side, -2.7);
        const r = 2.7 * PX;
        wheels.moveTo(wc.x + r, wc.y);
        wheels.arc(wc.x, wc.y, r, 0, Math.PI * 2);
        wheelRim.moveTo(wc.x + Math.cos(Math.PI * 1.15) * r, wc.y + Math.sin(Math.PI * 1.15) * r);
        wheelRim.arc(wc.x, wc.y, r, Math.PI * 1.15, Math.PI * 1.85);
      }
      return;
    }
    for (const side of [-1, 1]) {
      const x0 = cb.x + side * (hw - 3);
      const pts = [W(x0 - 4.5, -5), W(x0 + 4.5, -5), W(x0 + 6, -0.8), W(x0 + 6.4, 0), W(x0 - 6.4, 0), W(x0 - 6, -0.8)];
      feet.moveTo(pts[0].x, pts[0].y);
      for (const q of pts.slice(1)) feet.lineTo(q.x, q.y);
      feet.closePath();
    }
  });
  // cable bundles over the rack tops: patchboard -> pot1 -> pot2 -> pot3, dropping down its back
  const pb = CAB[0];
  const p1 = CAB[1];
  const p2 = CAB[2];
  const p3 = CAB[3];
  const bundles: { path: Path2D; w: number }[] = [];
  for (let k = 0; k < 4; k++) {
    const dy = -k * 1.25 + 0.4 * jit(k, 71);
    const top = (cb: (typeof CAB)[number]) => -cb.h - 1.7 + dy - 0.9;
    const path = new Path2D();
    const P0 = W(pb.x + pb.w / 2 - 12 + k * 2, top(pb));
    path.moveTo(P0.x, P0.y);
    // a hump over the gap patch -> pot1
    const g1 = (pb.x + pb.w / 2 + (p1.x - p1.w / 2)) / 2;
    let q = W(g1, top(p1) - 7 - k * 1.1);
    let e = W(p1.x - p1.w / 2 + 6, top(p1));
    path.quadraticCurveTo(q.x, q.y, e.x, e.y);
    // lying along pot1's top with a slight lift where it crosses the louvre strip
    q = W(p1.x, top(p1) - 1.1);
    e = W(p1.x + p1.w / 2 - 4, top(p1));
    path.quadraticCurveTo(q.x, q.y, e.x, e.y);
    const g2 = (p1.x + p1.w / 2 + (p2.x - p2.w / 2)) / 2;
    q = W(g2, top(p2) - 4 - k * 0.8);
    e = W(p2.x - p2.w / 2 + 5, top(p2));
    path.quadraticCurveTo(q.x, q.y, e.x, e.y);
    q = W(p2.x + 6, top(p2) - 0.8);
    e = W(p2.x + p2.w / 2 - 2, top(p2));
    path.quadraticCurveTo(q.x, q.y, e.x, e.y);
    const g3 = (p2.x + p2.w / 2 + (p3.x - p3.w / 2)) / 2;
    q = W(g3, top(p3) - 5 - k * 0.9);
    e = W(p3.x - p3.w / 2 + 5, top(p3));
    path.quadraticCurveTo(q.x, q.y, e.x, e.y);
    q = W(p3.x + 4, top(p3) - 0.9);
    e = W(p3.x + p3.w / 2 - 10 - k * 2, top(p3));
    path.quadraticCurveTo(q.x, q.y, e.x, e.y);
    // the drop: over the back edge of the last rack, out of sight behind it
    const c1 = W(p3.x + p3.w / 2 - 2 - k, top(p3) - 3);
    const e2 = W(p3.x + p3.w / 2 - 1 - k * 1.5, top(p3) + 2);
    path.quadraticCurveTo(c1.x, c1.y, e2.x, e2.y);
    bundles.push({ path, w: (1.5 + 0.35 * k) * PX });
  }
  // the hand-cut detail on the racks: two cables of the bundle slip off the top of the last rack and
  // hang over its front-right corner in a loose loop, tied off against the side
  const drape: { path: Path2D; w: number }[] = [];
  for (let k = 0; k < 2; k++) {
    const path = new Path2D();
    const top = -p3.h - 1.7 - k * 1.2;
    const s0 = W(p3.x + p3.w / 2 - 14 + k * 3, top);
    path.moveTo(s0.x, s0.y);
    let c1 = W(p3.x + p3.w / 2 - 2, top - 2.2 - k * 0.6);
    let e = W(p3.x + p3.w / 2 + 2.4 + k * 1.1, top + 4);
    path.quadraticCurveTo(c1.x, c1.y, e.x, e.y); // over the corner
    c1 = W(p3.x + p3.w / 2 + 6 + k * 2.2, -p3.h + 30 + k * 6);
    e = W(p3.x + p3.w / 2 + 3.2 + k * 1.4, -p3.h + 52 + k * 7); // the loop's low point
    path.quadraticCurveTo(c1.x, c1.y, e.x, e.y);
    c1 = W(p3.x + p3.w / 2 + 0.2 + k * 0.6, -p3.h + 60 + k * 4);
    e = W(p3.x + p3.w / 2 + 1, -p3.h + 34 + k * 2); // back up to the tie on the side
    path.quadraticCurveTo(c1.x, c1.y, e.x, e.y);
    drape.push({ path, w: (1.3 + 0.3 * k) * PX });
  }
  const dt0 = W(p3.x + p3.w / 2 - 0.4, -p3.h + 31.5);
  const dt1 = W(p3.x + p3.w / 2 + 3.2, -p3.h + 33.2);
  const drapeTie = new Path2D();
  drapeTie.rect(dt0.x, dt0.y, dt1.x - dt0.x, dt1.y - dt0.y);
  // cable ties: short bands across the bundle
  const ties = new Path2D();
  for (const [x, cb] of [
    [p1.x - 12, p1],
    [p1.x + 20, p1],
    [p2.x - 6, p2],
    [p2.x + 26, p2],
    [p3.x - 14, p3],
  ] as const) {
    const a = W(x - 0.8, -cb.h - 7.4);
    const b = W(x + 0.8, -cb.h - 1.2);
    ties.rect(a.x, a.y, b.x - a.x, b.y - a.y);
  }
  return { slits, nicks, feet, wheels, wheelRim, trim, trimTop, bundles, ties, louvreBands, drape, drapeTie, bayFrame };
})();

/** cut-paper detail on the machine (after the kit art, before the value / sleep passes). */
function machineCraft(c: CanvasRenderingContext2D, env: PaintEnv) {
  const ink = env.fill('ink');
  c.save();
  c.fillStyle = ink;
  c.fill(CRAFT.louvreBands); // the kit's identical louvres go; each cabinet's own count is punched below
  c.fill(CRAFT.bayFrame); // no light band inside the housings (it read as an all-round outline)
  c.fill(CRAFT.trim);
  c.fill(CRAFT.feet);
  c.fill(CRAFT.wheels);
  // bundles: ink cables, heavier ones first; a rim only along the topmost run (it faces the windows)
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = ink;
  for (const b of CRAFT.bundles) {
    c.lineWidth = b.w;
    c.stroke(b.path);
  }
  c.fill(CRAFT.ties);
  for (const d of CRAFT.drape) {
    c.lineWidth = d.w;
    c.stroke(d.path);
  }
  c.fill(CRAFT.drapeTie);
  const topRun = CRAFT.bundles[CRAFT.bundles.length - 1];
  c.save();
  c.translate(0, -topRun.w * 0.42);
  c.strokeStyle = withAlpha(env.mood.rim, 0.34);
  c.lineWidth = 0.9;
  c.stroke(topRun.path);
  c.restore();
  // the drape catches the window only where it rolls over the corner
  c.save();
  c.beginPath();
  const cr = W(MARK_I_LAYOUT.console + 35 - 16, -186 - 8);
  c.rect(cr.x, cr.y, 26 * PX, 9 * PX);
  c.clip();
  c.translate(0, -0.5 * PX);
  c.strokeStyle = withAlpha(env.mood.rim, 0.32);
  c.lineWidth = 0.9;
  for (const d of CRAFT.drape) c.stroke(d.path);
  c.restore();
  c.strokeStyle = withAlpha(env.mood.rim, 0.3);
  c.lineWidth = 1;
  c.stroke(CRAFT.wheelRim);
  // punch: louvre slits and edge nicks become real holes (the backlit room shows through)
  c.globalCompositeOperation = 'destination-out';
  c.fill(CRAFT.slits);
  c.fill(CRAFT.nicks);
  c.restore();
}

export function drawMachine(c: CanvasRenderingContext2D, env: PaintEnv, o: MachineOpts) {
  withCutLight(MACHINE_CUT_LIGHT, () => {
    perceptronPatchboard(c, { x: MK.PATCH.x, y: INST.y, s: S, seed: 3 }, env);
    MK.POTS.forEach((x, r) => perceptronPotRack(c, { x, y: INST.y, s: S, seed: 6 + r }, env));
  });
  machineCraft(c, env);
  // value pass: push the plugboard face and the rack housings toward black. source-atop only darkens
  // what is already drawn (a multiply would paint its grey into the transparent gaps around the cabinets)
  const patch = o.patch ?? 1;
  const racks = o.racks ?? 0;
  c.save();
  c.globalCompositeOperation = 'source-atop';
  if (patch < 1) {
    c.fillStyle = darken(0.58 * (1 - patch));
    const P = MK.PATCH;
    c.fillRect(P.x - P.hw - 2, P.top - 2, P.hw * 2 + 4, P.bot - P.top + 4);
  }
  if (racks > 0) {
    c.fillStyle = withAlpha(rackInk(env), 0.8 * racks);
    for (const x of MK.POTS) c.fillRect(x - 35 * PX, MK.INST.y - 186 * PX, 70 * PX, 186 * PX);
  }
  c.restore();
  drawCords(c, env, o.cords);
  if (o.knobs) drawMotors(c, env);
  if (o.knobs && o.motors) drawGears(c, env, o.motors, o.knobs.weights);
  if (o.knobs) drawKnobs(c, env, o.knobs);
  if (o.sweep !== undefined) rackSweep(c, env, o.sweep);
  drawPlate(c, env, o.plate ?? { lit: 0, sweep: -1 });
  rackFaces(c, env);
  // asleep parts: pushed toward black (the knobs, cords and lamps with them), their faces still faintly
  // showing through (the dial rows and the perforations as low cut-outs)
  const d = o.dim;
  const faces = Math.max(0, Math.min(1, o.faces ?? 0.6));
  if (d) {
    c.save();
    c.globalCompositeOperation = 'source-atop';
    const P = MK.PATCH;
    if ((d.patch ?? 0) > 0.002) {
      c.fillStyle = darken(d.patch! * (1 - 0.3 * faces));
      c.fillRect(P.x - 40 * PX, MK.INST.y - 230 * PX, 80 * PX, 240 * PX);
    }
    if ((d.racks ?? 0) > 0.002) {
      c.fillStyle = darken(d.racks! * (1 - 0.3 * faces));
      for (const x of MK.POTS) c.fillRect(x - 37 * PX, MK.INST.y - 230 * PX, 74 * PX, 240 * PX);
    }
    c.restore();
    // asleep faces are also SOLID: the pierced rack and plugboard faces are shuttered with ink, so no
    // knob grid or cord tangle shows against the window until the part is named
    c.save();
    c.fillStyle = (o.shutterDark ?? 0) > 0.002 ? mixLab(env.fill('ink'), '#000000', o.shutterDark!) : env.fill('ink');
    if ((d.patch ?? 0) > 0.002) {
      // the plugboard's perforations are dense: it keeps more of its shutter (a darker panel, the tangle faint)
      c.globalAlpha = Math.min(1, d.patch! * 1.08) * (1 - 0.55 * faces);
      c.fillRect(P.x - 33 * PX, MK.INST.y - 172 * PX, 66 * PX, 148 * PX);
    }
    if ((d.racks ?? 0) > 0.002) {
      c.globalAlpha = Math.min(1, d.racks! * 1.08) * (1 - faces);
      for (const x of MK.POTS) c.fillRect(x - 30 * PX, MK.INST.y - 172 * PX, 60 * PX, 150 * PX);
      // review round 3: the housing sides and kick outside the shutter stayed a step lighter than the shuttered
      // face, so every sleeping rack read as outlined. Same value there (source-atop keeps the punched slits
      // and the gaps between racks); the header, which faces the windows, keeps its light
      c.globalCompositeOperation = 'source-atop';
      for (const x of MK.POTS) {
        c.fillRect(x - 35.8 * PX, MK.INST.y - 172 * PX, 5.8 * PX, 172 * PX);
        c.fillRect(x + 30 * PX, MK.INST.y - 172 * PX, 5.8 * PX, 172 * PX);
        c.fillRect(x - 30 * PX, MK.INST.y - 22 * PX, 60 * PX, 22 * PX);
      }
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
    // the window rim still finds the knob tops of the sleeping racks: a faint grid that hints at s02
    if ((o.sleepRim ?? 0) > 0.002 && (d.racks ?? 0) > 0.002) {
      const R = MK.KNOB_R;
      const tops = new Path2D();
      for (let i = 0; i < N_KNOBS; i++) {
        const p = knobAt(i);
        tops.moveTo(p.x + Math.cos(Math.PI * 1.18) * R, p.y + Math.sin(Math.PI * 1.18) * R);
        tops.arc(p.x, p.y, R, Math.PI * 1.18, Math.PI * 1.82);
      }
      c.save();
      c.strokeStyle = withAlpha(env.mood.rim, o.sleepRim!);
      c.lineWidth = 1;
      c.stroke(tops);
      c.restore();
    }
  }
  // asleep racks sit back in the air: a haze veil over their housings (the eye stays the sharp ink plane)
  const vp = o.veil?.patch ?? 0;
  const vr = o.veil?.racks ?? 0;
  if (vp > 0.002 || vr > 0.002) {
    c.save();
    c.globalCompositeOperation = 'source-atop';
    const hz = env.fill('haze');
    if (vp > 0.002) {
      c.fillStyle = withAlpha(hz, Math.min(1, vp));
      c.fillRect(MK.PATCH.x - 44 * PX, MK.INST.y - 240 * PX, 88 * PX, 250 * PX);
    }
    if (vr > 0.002) {
      c.fillStyle = withAlpha(hz, Math.min(1, vr));
      for (const x of MK.POTS) c.fillRect(x - 40 * PX, MK.INST.y - 240 * PX, 80 * PX, 250 * PX);
    }
    c.restore();
  }
  // the window rim along every cabinet's cut top edge (it faces the backlit windows), after the sleep passes
  const tr = o.topRim ?? 0.5;
  if (tr > 0.002) {
    c.save();
    c.lineJoin = 'round';
    c.lineCap = 'round';
    // review round 4: 1-2 px on screen whatever the camera's push (was 3 + 1.1 world px, up to ~6 px in close-up)
    const k = rimScale(c, env);
    c.strokeStyle = withAlpha(env.mood.rim, tr * 0.3);
    c.lineWidth = 2 / k;
    c.stroke(CRAFT.trimTop);
    c.strokeStyle = withAlpha(env.mood.rim, tr);
    c.lineWidth = 1.1 / k;
    c.stroke(CRAFT.trimTop);
    c.restore();
  }
  const sr = o.sideRim ?? 0;
  if (sr > 0.002) {
    c.save();
    c.lineCap = 'round';
    const y0 = MK.INST.y - 184 * PX;
    const y1 = MK.INST.y - 8 * PX;
    for (const x of MK.POTS) {
      for (const [dx, a] of [[-35 * PX + 0.6, 1], [35 * PX - 0.6, 0.4]] as const) {
        // brightest at the top (nearest the window band), dying out toward the floor
        const g = c.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, withAlpha(env.mood.rim, sr * a));
        g.addColorStop(0.55, withAlpha(env.mood.rim, sr * a * 0.55));
        g.addColorStop(1, withAlpha(env.mood.rim, 0));
        c.strokeStyle = g;
        c.lineWidth = 2.6;
        c.globalAlpha = 0.35;
        c.beginPath();
        c.moveTo(x + dx, y0);
        c.lineTo(x + dx, y1);
        c.stroke();
        c.lineWidth = 1;
        c.globalAlpha = 1;
        c.stroke();
      }
    }
    c.restore();
  }
  markIEye(c, { ...MK.EYE_AT, cells: o.cells, light: o.eyeLight, card: o.card }, env);
}

/**
 * The rack faces are not three copies (review round 2): the rightmost rack carries a meter panel across
 * its head (NMAH 334414: "rightmost a panel of meters"), covering its top two knob rows; the middle rack
 * ends in a jack field with a few short patch cords, covering its bottom two rows. The first rack keeps
 * every knob (s02's movers live there). Drawn after the knobs, before the sleep passes.
 */
function rackFaces(c: CanvasRenderingContext2D, env: PaintEnv) {
  const m = env.mood;
  const ink = env.fill('ink');
  c.save();
  // meter panel (rack 3)
  {
    const x = MK.POTS[2];
    const a = W(MARK_I_LAYOUT.console - 31, -171);
    const b = W(MARK_I_LAYOUT.console + 31, -139.5);
    c.fillStyle = ink;
    c.beginPath();
    c.roundRect(a.x, a.y, b.x - a.x, b.y - a.y, 1.2 * PX);
    c.fill();
    c.fillStyle = withAlpha(inkLiftLocal(env, 0.22), 1);
    c.fillRect(a.x + 1.2 * PX, a.y + 1.2 * PX, b.x - a.x - 2.4 * PX, b.y - a.y - 2.4 * PX);
    const face = mixLab(m.haze, m.rim, 0.45);
    for (let i = 0; i < 3; i++) {
      const cx = x + (i - 1) * 19 * PX;
      const cy = a.y + 14.5 * PX;
      const r = 7.2 * PX;
      c.fillStyle = ink;
      c.beginPath();
      c.arc(cx, cy, r + 1 * PX, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = withAlpha(face, 0.78);
      c.beginPath();
      c.arc(cx, cy, r, Math.PI, 0); // a half-moon dial face
      c.lineTo(cx + r, cy + 2 * PX);
      c.lineTo(cx - r, cy + 2 * PX);
      c.closePath();
      c.fill();
      c.strokeStyle = withAlpha(ink, 0.75);
      c.lineWidth = 0.35 * PX;
      c.beginPath();
      c.arc(cx, cy + 1 * PX, r * 0.72, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
      const v = [0.32, 0.55, 0.41][i];
      const ang = Math.PI * (1.15 + 0.7 * v);
      c.lineWidth = 0.5 * PX;
      c.beginPath();
      c.moveTo(cx, cy + 1.6 * PX);
      c.lineTo(cx + Math.cos(ang) * r * 0.9, cy + 1.6 * PX + Math.sin(ang) * r * 0.9);
      c.stroke();
      // two small toggles under each meter
      c.fillStyle = withAlpha(m.rim, 0.24);
      for (const dx of [-3.2, 3.2]) c.fillRect(cx + dx * PX - 0.4 * PX, cy + 6 * PX, 0.8 * PX, 2.4 * PX);
    }
    // the panel's top edge alone catches the window
    c.fillStyle = withAlpha(m.rim, 0.3);
    c.fillRect(a.x + 1 * PX, a.y, b.x - a.x - 2 * PX, 0.9);
  }
  // jack field (rack 2's lower end)
  {
    const a = W(MARK_I_LAYOUT.pot2 - 31, -54);
    const b = W(MARK_I_LAYOUT.pot2 + 31, -26.5);
    c.fillStyle = ink;
    c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    c.fillStyle = withAlpha(inkLiftLocal(env, 0.3), 1);
    c.fillRect(a.x + 1.4 * PX, a.y + 1.4 * PX, b.x - a.x - 2.8 * PX, b.y - a.y - 2.8 * PX);
    const jacks = new Path2D();
    const at2 = (k: number, row: number) => W(MARK_I_LAYOUT.pot2 - 25 + k * (50 / 11), -49 + row * 8.5);
    for (let row = 0; row < 3; row++)
      for (let k = 0; k < 12; k++) {
        const q = at2(k, row);
        jacks.moveTo(q.x + 1.05 * PX, q.y);
        jacks.arc(q.x, q.y, 1.05 * PX, 0, Math.PI * 2);
      }
    c.fillStyle = ink;
    c.fill(jacks);
    c.strokeStyle = withAlpha(m.rim, 0.2);
    c.lineWidth = 0.7;
    c.stroke(jacks);
    // four short cords, plug to plug, sagging
    c.strokeStyle = ink;
    c.lineCap = 'round';
    c.lineWidth = 0.9 * PX;
    for (const [k0, r0, k1, r1, d] of [
      [1, 0, 4, 1, 7],
      [3, 0, 9, 2, 9],
      [6, 1, 7, 2, 5],
      [10, 0, 2, 2, 11],
    ] as const) {
      const p0 = at2(k0, r0);
      const p1 = at2(k1, r1);
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      c.quadraticCurveTo((p0.x + p1.x) / 2, Math.max(p0.y, p1.y) + d * PX, p1.x, p1.y);
      c.stroke();
    }
    c.fillStyle = withAlpha(m.rim, 0.26);
    c.fillRect(a.x + 1 * PX, a.y, b.x - a.x - 2 * PX, 0.9);
  }
  c.restore();
}

/** a soft band of window light travelling across the three rack faces (additive, clipped to the racks) */
function rackSweep(c: CanvasRenderingContext2D, env: PaintEnv, u: number) {
  if (u <= -0.2 || u >= 1.2) return;
  const x0 = MK.POTS[0] - 40 * PX;
  const x1 = MK.POTS[2] + 40 * PX;
  const cx = x0 + (x1 - x0) * u;
  const top = MK.RACK_TOP;
  const bot = INST.y - 8 * PX;
  const fade = Math.min(1, (u + 0.2) / 0.25, (1.2 - u) / 0.25);
  c.save();
  c.beginPath();
  for (const x of MK.POTS) c.rect(x - 35 * PX, top, 70 * PX, bot - top);
  c.clip();
  c.globalCompositeOperation = 'lighter';
  // a slanted band (the blind light's angle), soft both sides
  const W2 = 70 * PX;
  const g = c.createLinearGradient(cx - W2, top, cx + W2 * 0.6, bot);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.42, withAlpha(env.mood.halo, 0.2 * fade));
  g.addColorStop(0.52, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), 0.3 * fade));
  g.addColorStop(0.62, withAlpha(env.mood.halo, 0.2 * fade));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(cx - W2 * 2, top, W2 * 4, bot - top);
  c.restore();
}

/** the maker's plate on the first rack's header: dark brass, an engraved border, NO lettering; `sweep` runs a glint across */
function drawPlate(c: CanvasRenderingContext2D, env: PaintEnv, o: { lit: number; sweep: number }) {
  const P = MK.PLATE;
  const m = env.mood;
  const x = P.x - P.w / 2;
  const y = P.y - P.h / 2;
  c.save();
  c.fillStyle = inkLiftLocal(env, 0.16);
  c.beginPath();
  c.roundRect(x, y, P.w, P.h, 1.6);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.3 + 0.4 * o.lit);
  c.lineWidth = 0.9;
  c.stroke();
  for (const sx of [x + 4, x + P.w - 4]) {
    c.fillStyle = withAlpha(m.rim, 0.35 + 0.3 * o.lit);
    c.beginPath();
    c.arc(sx, P.y, 1.2, 0, Math.PI * 2);
    c.fill();
  }
  // UNLETTERED (review round 1: no lettering on the real Mark I is confirmed by the research bible): an
  // engraved double border inside the plate, which catches the light as the lettering would have
  c.strokeStyle = withAlpha(env.fill('ink'), 0.85);
  c.lineWidth = 0.9;
  c.beginPath();
  c.roundRect(x + 7, y + 2.2, P.w - 14, P.h - 4.4, 1);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.4), 0.06 + 0.6 * o.lit);
  c.lineWidth = 0.7;
  c.beginPath();
  c.roundRect(x + 7, y + 2.9, P.w - 14, P.h - 4.4, 1);
  c.stroke();
  // the glint: a narrow bright band crossing the plate
  if (o.sweep > -0.3 && o.sweep < 1.3) {
    c.beginPath();
    c.roundRect(x, y, P.w, P.h, 1.6);
    c.clip();
    c.globalCompositeOperation = 'lighter';
    const gx = x + P.w * o.sweep;
    const g = c.createLinearGradient(gx - 22, y, gx + 10, y + P.h);
    g.addColorStop(0, withAlpha(m.core, 0));
    g.addColorStop(0.5, withAlpha(m.core, 0.75));
    g.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = g;
    c.fillRect(x, y, P.w, P.h);
  }
  c.restore();
}
const inkLiftLocal = (env: PaintEnv, u: number) => mixLab(env.fill('ink'), env.mood.set, u);

/** L3: an open instrument rack between the left-hand windows (unlit tubes; glow optional); `dark` 0..1 pushes it toward ink */
export function nightCabinet(f: Frame, o: { key: string; x?: number; glow?: number; dark?: number; haze?: number }) {
  const x = o.x ?? 150;
  const dark = o.dark ?? 0;
  // review round 3: the back-wall rack sits further back in the air than the machine (≈8% toward the haze
  // colour), so the three planes separate on value: near-black foreground, ink machine, hazed back wall
  const haze = o.haze ?? BACK_RACK_HAZE;
  f.layer('L3', (c, env) => {
    const art = (cc: CanvasRenderingContext2D) => {
      tubeRack(cc, { x, y: 640, s: 1.02, glow: o.glow ?? 0, seed: 9 }, env);
      // a stool tucked beside it
      cc.fillStyle = env.fill('ink');
      const sx = x + 74;
      cc.fillRect(sx - 22, 560, 44, 6);
      cc.fillRect(sx - 19, 566, 4, 74);
      cc.fillRect(sx + 15, 566, 4, 74);
      cc.fillRect(sx - 17, 606, 34, 3);
    };
    if ((dark <= 0 && haze <= 0) || (o.glow ?? 0) > 0) {
      art(c);
      return;
    }
    // baked once: the rack and stool, then everything pushed toward ink and into the haze (source-atop keeps the holes)
    const r = { x: x - 90, y: 260, w: 220, h: 400 };
    f.cached(`${o.key}/nightCabinet/${env.mood.id}/${x}/${dark}/${haze}`, r.w, r.h, (cc) => {
      cc.translate(-r.x, -r.y);
      art(cc);
      cc.globalCompositeOperation = 'source-atop';
      cc.fillStyle = withAlpha(env.fill('ink'), dark);
      cc.fillRect(r.x, r.y, r.w, r.h);
      if (haze > 0) {
        cc.fillStyle = withAlpha(env.fill('haze'), haze);
        cc.fillRect(r.x, r.y, r.w, r.h);
      }
    })(c, r.x, r.y);
  });
}

/** L3: a shaft of window light from the window centred at `wx` (L2 world) falling to the floor, slatted by the blinds */
export function nightBeam(f: Frame, o: { key: string; wx: number; k: number }) {
  if (o.k <= 0.002) return;
  f.layer('L3', (c, env) => {
    const x0 = o.wx - 150;
    const y0 = LAB.winTop + LAB.winH * 0.36;
    const bake = f.cached(`${o.key}/nightBeam/${env.mood.id}/${o.wx}`, 760, 560, (cc) => {
      cc.translate(-(x0 - 380), -(y0 - 20));
      const top = { a: o.wx - LAB.winW * 0.42, b: o.wx + LAB.winW * 0.42, y: y0 };
      const bot = { a: o.wx - 300, b: o.wx + 100, y: y0 + 520 };
      const col = mixLab(env.mood.halo, env.mood.core, 0.35);
      const g = cc.createLinearGradient(0, top.y, 0, bot.y);
      g.addColorStop(0, withAlpha(col, 0.5));
      g.addColorStop(0.6, withAlpha(col, 0.22));
      g.addColorStop(1, withAlpha(col, 0));
      cc.fillStyle = g;
      const N = 11; // slats: bright bands with gaps
      for (let i = 0; i < N; i++) {
        const u0 = i / N + 0.012;
        const u1 = (i + 1) / N - 0.012;
        const lerp = (p: number, q: number, u: number) => p + (q - p) * u;
        // bands run along the beam (one per slat gap), fanning from the window to the floor
        cc.beginPath();
        cc.moveTo(lerp(top.a, top.b, u0), top.y);
        cc.lineTo(lerp(top.a, top.b, u1), top.y);
        cc.lineTo(lerp(bot.a, bot.b, u1), bot.y);
        cc.lineTo(lerp(bot.a, bot.b, u0), bot.y);
        cc.closePath();
        cc.fill();
      }
    }, { blur: 9 });
    c.save();
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = Math.min(1, o.k);
    bake(c, x0 - 380, y0 - 20);
    c.restore();
  });
}
