/**
 * ch01-s02 — the Mark I Perceptron in the Cornell lab at night (labGreen, crossfade in).
 *
 * Opens on EXACTLY ch01-s01's last frame: MATCH_CAM, the shared NIGHT_LOOK exposure, the same desk, chair
 * and stool, the sleeping machine veiled in haze and the eye still glowing, so the crossfade is a
 * match-dissolve. Just after it the room's fluorescent tubes strike (two hung low enough to sit in the top
 * of the opening and plugboard framings), then a faint seeded flicker. One continuous camera move (a
 * monotone spline through word-anchored keys): a gentle push onto the eye; from "twenty" (#2) a truck
 * left → right that reaches the plugboard on "wires" and carries on, with a modest push (k 1.76 → 1.95, a
 * strip of backlit blinds always above the racks), to the first two dial racks by "motors"; a near-still
 * hold on the dials; then a ≈4.2 s pull-back from "Mark" that lands on "Frank" in the two-shot. The board and
 * racks open in s01's SLEEP look (shuttered near-black slabs, review round 3); each part WAKES on its word:
 *   "grid" (beat eye)       a shimmer wave runs down the lit cells row by row (≈0.6 s); the stimulus card's
 *                           lamp comes on dim with it; "400 light cells" on "four"; on "twenty … twenty" a
 *                           row, then a column, under measuring brackets; then the retina shows the card's bar
 *   "wires" (beat wires)    the plugboard wakes and a rim light runs along nine patch cords
 *   "racks"                 the three racks wake (their haze veil lifts over 1.4 s); on "dials" a band of
 *                           window light
 *   "motors" (beat dials)   eight knobs across the first two racks turn 30° on the twos (staggered 0.12 s),
 *                           each with its rim-lit motor housing running behind it and a rotation-blur arc
 *   Rosenblatt              already in the lab from the first frame, small and in silhouette, at work at
 *                           the patch board (facing it, re-seating cords on the twos, breathing). While the
 *                           board sleeps his ink IS the board's value (ink on ink: unseen, as in s01, which
 *                           never shows him); he comes up with the board's light and the window pocket behind
 *                           him as the truck finds him on "wires"
 *   "Perceptron"            the (unlettered) maker's plate catches the light; he stills, listening
 *   "Frank" (name)          (review round 4) the name card comes in as one unit NEAR THE EYE, inside the iris
 *                           aperture (the rule and name lead by 0.1 s, "psychologist" follows 0.3 s later); he
 *                           turns camera-LEFT out of the work, his near arm opening toward the eye on its stand
 *                           (PRESENT_EYE, a half step back), and holds the pose, breathing, to the cut; the
 *                           camera holds the two-shot (eye, man, machine) with a ≈3% settle
 *   the close               the kit's frame-centred iris into ch01-s03 closes between man and machine
 * Round-4 revision: contour-only figure (no interior seam strokes; tie knot, collar, cuff on the outline, a 13°
 * wrist bend), the board lit by the time he steps out (≈11.0 s); the eye stays dark from s01 and starts its
 * glow on "Its", lifting s01's extra night (SLEEP_DARK) with it.
 * Round-1 revision: Rosenblatt in true ink (rim crescent from f.rim only, dim cut-lines) against a local haze
 * pocket on the machine behind him; five cords take a travelling rim sweep on "wires"; one clean catenary in
 * the near plane; the grid labels gone by the end of "twenty"; the eye opens on s01's held glow (EYE_HELD).
 * Depth at the closest framing: a strip of backlit blinds above the racks and a loop of slack cable hanging
 * out of focus (near plane, blur 6) into the top-left corner.
 * Puppets on twos. The camera path is a monotone spline through word-anchored keys (re-voice safe).
 */
import { Timeline } from '../../../core';
import { FONT, actionScale, addPose, annotation, blendPose, defineShot, envelope, mixLab, nameCard, softPlate, withAlpha, withLife } from '../../../film';
import type { Camera3, Facing, LayerSpec, PaintEnv, Palette, Pose } from '../../../film';
import { POSES } from '../../../film/silhouette/puppet/poses';
import { DESK_LAMP, deskLampGlow, deskLampPool } from '../sets/ch01-s01-lamp';
import { ROSENBLATT_SCALE, ROSE_INK, ROSE_POSES, breath, rosenblattSuit } from '../sets/ch01-s02-rosenblatt';
import { labForeground, labHaze, labTubes, stoolSeatY } from '../sets/lab';
import { NIGHT_LOOK, hungTube, nightDesk, nightLab, nightVignette, tubeLevel } from '../sets/ch01-s01-nightlab';
import { EYE_HELD, SET_RIM, SLEEP, SLEEP_DARK, sleepDarken, LAB_CHAIR, LAB_DESK, LOW_TUBES, MATCH_CAM, MK, NEAR_FLOOR, NEAR_PLANE, N_KNOBS, REST_WEIGHTS, cellAt, drawMachine, eyeHeld, knobAngle, knobAt, nightBeam, nightCabinet } from '../sets/ch01-s02-machine';
import { cardFace, cardLamp } from '../sets/ch01-s01-eye';
import { nearChairBack } from '../sets/ch01-s01-near';
import { LAB } from '../sets/lab';

// ---------------------------------------------------------------- staging (L4 world, stage px)
const S = MK.S;
const EYE = MK.EYE;
const INST = MK.INST;
const ROSE_S = S * ROSENBLATT_SCALE;
/** he is already in the lab, at work at the patch board: in the gap between the board and the first rack,
 * facing the board (LEFT, toward the eye). The truck finds him on "wires"; on "Frank" he opens out of the
 * work into the present, his near arm and open hand out toward the eye, and the camera follows his gesture
 * onto the eye, so the iris into ch01-s03 closes on it (review round 1) */
const ROSE_AT = MK.PATCH.x + MK.PATCH.hw + 22;
/** s01 holds the machine this far toward black (the shared SLEEP look); each part wakes from here */
const ASLEEP = SLEEP.dim;
/** all framings use MATCH_CAM's lens; the dolly z sets the action-plane scale k */
const LENS = MATCH_CAM.lens;
const zFor = (k: number) => 1000 - (1000 * LENS) / k;
const K0 = actionScale(MATCH_CAM); // 1.4375
/** the framings the path's extremes visit (overscan for the baked set art and the tube practicals) */
const CAMS: Camera3[] = [
  MATCH_CAM,
  { x: 560, y: 356, z: zFor(1.72), lens: LENS },
  { x: 780, y: 392, z: zFor(1.76), lens: LENS },
  { x: 1012, y: 405, z: zFor(1.98), lens: LENS },
  { x: 730, y: 392, z: zFor(1.22), lens: LENS },
  { x: 690, y: 380, z: zFor(1.3), lens: LENS },
  { x: 524, y: 343, z: zFor(1.44), lens: LENS },
];
/** the pull-back from the dials: the whole machine on "psychologist" (WIDE), the two-shot on "Frank" (eye,
 * board, man, two racks: TWO), then the push along his gesture onto the eye (EYE_END), where the kit's iris
 * (centred on the frame) closes on the eye's retina at the cut */
const WIDE = { x: 730, y: 392, k: 1.22 };
const TWO = { x: 690, y: 380, k: 1.3 };
const EYE_END = { x: 524, y: 343, k: 1.44 };
/** the truck's x on "wires" (round-1 critic, framing: was 780). 60 px further right, so the camera box leaves
 * frame left during the fast middle of the truck instead of hanging half-cut at the edge after "wires" */
const TRUCK_W = 840;
/** the camera box's horizontal extent about EYE.x (world px), for the edge falloff during the truck */
const BOX_DX = 18;
const BOX_HW = 70;
/** round-1 critic (acting): on "Frank" a readable two-step on the twos. 1) the TURN (0.5 s): the hand comes
 * off the cords, torso and head open about 20° toward the camera and the eye (the chest widens a little in
 * silhouette, TURN_SX); 2) the PRESENT (0.5 s): the near arm opens out to the eye, open palm up (the kit's
 * 'present' hand), held, breathing, to the cut */
const TURNED: Pose = { ...addPose(POSES.stand, { hipF: 5, kneeF: -4, hipB: -3, kneeB: 2, torso: -6, neck: -1, head: -3, shoulderF: 18, elbowF: 58, wristF: 8, shoulderB: -8, elbowB: 16, wristB: 4 }), handF: 'relaxed' };
const PRESENT_OPEN: Pose = { ...addPose(POSES.present, { hipF: 4, kneeF: -2, hipB: -4, kneeB: 2, torso: -8, neck: -6, head: 5, shoulderF: 34, elbowF: -34, wristF: 2, shoulderB: -6, elbowB: 2 }), handF: 'open' };
const TURN_SX = 1.08;
/** review round 4: the two-shot held to the cut (a slow ≈3% settle), eye at left, the man at right */
const TWO_END = { x: 676, y: 374, k: 1.34 };
void EYE_END;

const NEAR: LayerSpec = NEAR_PLANE;
const NEAR_ITEMS = [
  { kind: 'stool', x: 640, s: 0.9 },
  { kind: 'coil', x: 634, s: 0.55, y: stoolSeatY(NEAR_FLOOR, 0.9) + 6 },
  { kind: 'stool', x: 1130, s: 1 },
  { kind: 'chair', x: 1840, s: 1 },
] as const;

const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
/** two fixtures hung lower than the room's others (L3 world), so their tubes sit in the top of the two-shot */
const TUBES = [640 + 165 + 330, 640 + 165 + 660];
const TUBE_Y = 150;
/** the room's tubes strike just after the match-dissolve (the lights come up), each with its own stutter,
 * then hold with a faint seeded flicker */
const STRIKE = 0.55;
const tubeAt = (t: number, k: number) => tubeLevel(t, { at: STRIKE + 0.18 * k, seed: 91 + k * 13 });
const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;
const h01 = (i: number, s: number) => {
  let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s, 0xc2b2ae35);
  x ^= x >>> 15;
  x = Math.imul(x, 0x27d4eb2d);
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
};

// ---------------------------------------------------------------- monotone cubic (Fritsch–Carlson)
type Keys = [number, number][];
/** keys must be strictly increasing in time; slope 0 at the first key (s01 lands at rest) */
function monotone(keys: Keys): (t: number) => number {
  const n = keys.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  const m: number[] = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  m[0] = 0;
  m[n - 1] = d[n - 2] ?? 0;
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0;
    while (t > keys[i + 1][0]) i++;
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    const h = t1 - t0;
    const u = (t - t0) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * m[i + 1];
  };
}
/** keep anchor times strictly increasing by at least `gap` (a crowded re-voice slides keys later) */
function ordered(keys: Keys, gap = 0.3, end = Infinity): Keys {
  const out: Keys = [];
  for (const [t, v] of keys) {
    const tt = out.length ? Math.max(t, out[out.length - 1][0] + gap) : t;
    if (tt <= end + 1e-6) out.push([tt, v]);
  }
  return out;
}

// ---------------------------------------------------------------- the motors: eight knobs across two racks
const TURN = (52 * Math.PI) / 180;
const DW = TURN / (Math.PI * 0.75); // weight change for a 52° pointer turn (knobAngle: 135° per unit)
/** round-1 critic: the motion must READ, so four knobs in ONE potentiometer column of the first rack
 * (rack·80 + row·8 + column: column 5, rows 2, 4, 5, 7), each turning a visible 52° on the twos, while the
 * camera pushes onto that column on "motors" and releases on "turned" */
const MOVERS = [8 * 2 + 5, 8 * 4 + 5, 8 * 5 + 5, 8 * 7 + 5];
const DIR = MOVERS.map((i) => (REST_WEIGHTS[i] > 0 ? -1 : 1)); // turn away from the end stop
const MOVE_DUR = 0.5;
const MOVER_STAGGER = 0.12;
/** the pushed-in framing on the turning column (world centre) */
const COL_X = knobAt(MOVERS[1]).x;
const COL_Y = (knobAt(MOVERS[0]).y + knobAt(MOVERS[3]).y) / 2;
/** the step out of the board's shadow: he waits (hidden, ink on the sleeping board's ink) this far left of
 * his work spot, and steps into the window gap as the board wakes */
const HIDE_DX = 42;
const MOTORS = new Float32Array(N_KNOBS);
const TRAIL_HOLD = 0.6;
const KW = new Float32Array(N_KNOBS);
const KGLOW = new Float32Array(N_KNOBS);
const CELLS = new Float32Array(400);
const CORDS = new Float32Array(9);

interface Beats {
  /** "Its": the eye's glow begins here (review round 4: s01 leaves it dark after the glint) */
  its: number;
  eye: number;
  four: number;
  row: number;
  col: number;
  card: number;
  bar: number;
  wires: number;
  racks: number;
  dialsWord: number;
  dials: number;
  turn: number;
  mark: number;
  l04: number;
  perceptron: number;
  psych: number;
  name: number;
  /** end of the second "twenty": the grid labels are gone by here (+0.2 s) */
  twentyEnd: number;
  rose: number;
  /** "Behind": both brackets hold to here */
  behind: number;
}
const moverStart = (b: Beats, k: number) => b.dials - 0.1 + k * MOVER_STAGGER;

/** the photocell grid: it opens on s01's lit glow; on "grid" a shimmer wave runs down it row by row (≈0.6 s);
 * then a row, a column → the card's bar */
function retinaCells(t: number, b: Beats): Float32Array {
  const tq = tq12(t);
  const wave = (tq - (b.eye - 0.12)) / 0.6; // the crest's row position (0 → 1 down the plate)
  const rowK = sm((tq - (b.row - 0.12)) / 0.25) * (1 - sm((tq - (b.behind - 0.1)) / 0.35));
  const colK = sm((tq - (b.col - 0.12)) / 0.25) * (1 - sm((tq - (b.behind - 0.1)) / 0.35));
  const allFade = 1 - 0.45 * sm((tq - (b.row - 0.3)) / 0.4);
  const barK = sm((tq - b.bar) / 0.5);
  for (let i = 0; i < 400; i++) {
    const r = Math.floor(i / 20);
    const c = i % 20;
    const idle = (0.08 + 0.06 * h01(i, Math.floor(tq * 3))) * sm((tq - (b.its - 0.05)) / 0.5);
    // review round 4: s01 leaves the grid dark after its glint; the glow begins on "Its"
    const carried = eyeHeld(r, c) * sm((tq - (b.its - 0.05)) / 0.5);
    const d = (wave * 1.2 - 0.1 - r / 19) / 0.09;
    const crest = 0.6 * Math.exp(-d * d) * (0.8 + 0.2 * h01(i, 5));
    const after = 0.1 * sm((wave * 1.2 - 0.1 - r / 19) / 0.2); // the rows it has crossed stay a little brighter
    const lit = (carried + after + crest) * allFade;
    let v = Math.max(idle, lit);
    // round-1 critic: count what the brackets measure, the TOP row under the row bracket and the LEFT column
    // beside the column bracket
    if (r === 0) v = Math.max(v, rowK);
    if (c === 0) v = Math.max(v, colK);
    // the card's printed bar, as the eye sees it (a horizontal bar across the middle rows)
    const inBar = r >= 8 && r <= 10 && c >= 4 && c <= 15;
    v = v * (1 - barK) + (inBar ? 0.95 : idle * 0.8) * barK;
    CELLS[i] = v;
  }
  return CELLS;
}

/** knob weights, glints and arc trails for the motors beat (on twos) */
function knobState(t: number, b: Beats) {
  const tq = tq12(t);
  KW.set(REST_WEIGHTS);
  KGLOW.fill(0);
  MOTORS.fill(0);
  const trail: [number, number, number, number][] = [];
  MOVERS.forEach((i, k) => {
    const u = (tq - moverStart(b, k)) / MOVE_DUR;
    if (u <= 0) return;
    const e = sm(Math.min(1, u));
    KW[i] = REST_WEIGHTS[i] + DIR[k] * DW * e;
    KGLOW[i] = u < 1 ? Math.sin(Math.PI * u) : 0;
    // its motor runs for the turn (a short spin-up and run-down either side), and stays faintly lit after
    MOTORS[i] = Math.max(0.35 * Math.min(1, u), Math.min(1, (u + 0.12) * 6, (1.12 - u) * 6));
    const fade = u < 1 ? 1 : 1 - (u - 1) * (MOVE_DUR / TRAIL_HOLD);
    if (fade > 0) trail.push([i, knobAngle(REST_WEIGHTS[i]), knobAngle(KW[i]), Math.min(1, u * 4) * fade]);
  });
  return { weights: KW, glow: KGLOW, trail, motors: { on: MOTORS, t: tq } };
}

/** a fine measuring bracket with end ticks and a small-caps count, drawn on (screen space) */
function bracket(
  c: CanvasRenderingContext2D,
  m: Palette,
  t: number,
  o: { x0: number; y0: number; x1: number; y1: number; at: number; until: number; label: string; side: 'top' | 'left' },
) {
  const A = envelope(t, o.at, o.until - o.at, 0.3);
  if (A <= 0) return;
  const g = sm((t - o.at) / 0.45);
  const ex = o.x0 + (o.x1 - o.x0) * g;
  const ey = o.y0 + (o.y1 - o.y0) * g;
  const nx = o.side === 'top' ? 0 : -1;
  const ny = o.side === 'top' ? -1 : 0;
  c.save();
  c.globalAlpha = A;
  const lx = (o.x0 + o.x1) / 2 + nx * 34;
  const ly = (o.y0 + o.y1) / 2 + ny * 28;
  softPlate(c, lx, ly, 110, 74, m.ink, 0.8);
  c.strokeStyle = withAlpha(m.core, 0.95);
  c.lineWidth = 3.2;
  c.beginPath();
  c.moveTo(o.x0 + nx * 8, o.y0 + ny * 8);
  c.lineTo(o.x0, o.y0);
  c.lineTo(ex, ey);
  if (g >= 1) c.lineTo(o.x1 + nx * 8, o.y1 + ny * 8);
  c.stroke();
  c.globalAlpha = A * sm((t - o.at - 0.2) / 0.3);
  c.fillStyle = m.core;
  c.font = `600 33px ${FONT.sc}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(o.label, lx, ly);
  c.restore();
}

// ---------------------------------------------------------------- Rosenblatt (poses: sets/ch01-s02-rosenblatt)
interface Rose {
  x: number;
  facing: Facing;
  pose: Pose & { prev?: Pose };
  /** horizontal squash through the turn (1 = flat to camera; the flip happens edge-on) */
  sx: number;
}
/** the turn on "Frank": edge-on at its middle (the flip), on the twos */
const TURN_DUR = 0.42;
void TURN_DUR;
/** the half step back off the board as he opens to the eye on "Frank" (world px) */
const STEP_BACK = 9;
/** the shot's key (the hot window, up and to the left): his cut-lines and his own contour rim (the kit's
 * edgeRim) share it, so only his window-facing side catches light (no full outline). Review round 4: floor 0,
 * and the SET is rimmed on its tops only (f.rim(SET_RIM)), so the racks carry no side strokes */
const ROSE_KEY = { x: -0.5, y: -0.85, floor: 0 };

export default defineShot({
  id: 'ch01-s02',
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = {
      its: T.word('L0102', 'Its'),
      eye: T.beat('eye'),
      four: T.word('L0102', 'four'),
      row: T.word('L0102', 'twenty'),
      col: T.word('L0102', 'twenty#2'),
      card: T.wordEnd('L0102', -1) - 0.1,
      bar: T.wordEnd('L0102', -1) + 0.35,
      wires: T.beat('wires'),
      racks: T.word('L0103', 'racks'),
      dialsWord: T.word('L0103', 'dials'),
      dials: T.beat('dials'),
      turn: T.word('L0103', -1),
      mark: T.word('L0104', 'Mark'),
      l04: T.line('L0104').start,
      perceptron: T.word('L0104', 'perceptron'),
      psych: T.word('L0104', 'psychologist'),
      name: T.beat('name'),
      twentyEnd: T.wordEnd('L0102', 'twenty#2'),
      rose: T.word('L0104', 'Rosenblatt'),
      behind: T.word('L0103', 'Behind'),
    };
    const D = T.duration;
    // camera keys (world centre x/y and action-plane scale k), each anchored to the word it serves: one
    // continuous move. A gentle push onto the eye; the truck starts on "twenty" (#2), reaches the plugboard
    // on "wires" and carries on to the first two dial racks by "motors" with a modest push (k ≤ 2, so a strip
    // of backlit blinds stays above the racks); a near-still hold on the turning dials; then the pull-back
    // starts on "Mark" and lands on "Frank" in the two-shot (eye, man, plate, racks), then a last slow settle
    const tW = b.wires;
    const tM = b.dials;
    const tF = b.name;
    // from "Mark" the pull-back reveals the whole machine by "psychologist", settles into the two-shot on
    // "Frank", then follows his presenting arm onto the eye: the iris (kit, frame-centred, closing from D −
    // 0.6 s) lands on the eye's retina
    const tE = D - 0.08;
    // round-1 critic: from the racks to the pull-back the camera stays at k ≤ 1.85 (a strip of backlit blind
    // above the bank), except a short push of ≈14% onto the turning column on "motors", released on "turned"
    const tP = tM - 0.15;
    const tPush = b.turn + 0.12;
    const tRel = b.turn + 0.95;
    // review round 4: from "Frank" the camera HOLDS the two-shot (eye on its stand, the man presenting it) to the
    // cut, a slow settle of ≈3% only, so the frame-centred iris into ch01-s03 closes between man and machine
    void tE;
    const camX = monotone(ordered([[0, MATCH_CAM.x], [b.row, 560], [b.col, 568], [tW, TRUCK_W], [tP, 1000], [tPush, COL_X], [tRel, 1006], [b.mark, 1012], [b.psych, WIDE.x], [tF, TWO.x], [D, TWO_END.x]], 0.3, D));
    const camY = monotone(ordered([[0, MATCH_CAM.y], [b.row, 360], [b.col, 362], [tW, 392], [tP, 400], [tPush, COL_Y], [tRel, 402], [b.mark, 402], [b.psych, WIDE.y], [tF, TWO.y], [D, TWO_END.y]], 0.3, D));
    const camK = monotone(ordered([[0, K0], [b.row, 1.72], [b.col, 1.72], [tW, 1.76], [tP, 1.84], [tPush, 2.1], [tRel, 1.85], [b.mark, 1.85], [b.psych, WIDE.k], [tF, TWO.k], [D, TWO_END.k]], 0.3, D));

    // Rosenblatt (review round 3 blocking): already in the lab from the first frame, small and in silhouette,
    // at work at the patch board facing it (LEFT); every ≈1.7 s his hand re-seats a cord (a small reach and
    // return of the forearm, on the twos). He stands in the dark of the sleeping board, so he is not seen until
    // the board wakes and the truck finds him on "wires". On "Perceptron" he stills, listening. On "Frank" he
    // TURNS (edge-on at the middle of the turn, so the flip reads as a turn) to face the racks and presents the
    // maker's plate on the first rack's header with his near arm, head level, his eyeline along the racks to
    // the meter panel; then holds, breathing, through the push onto the eye
    const { WORK } = ROSE_POSES;
    // round-1 critic: the turn starts 0.2 s before "Frank"; the present follows as the name lands
    const tTurn = b.name - 0.2;
    const tPresent = tTurn + 0.55;
    const workAt = (q: number): Pose => {
      const still = sm((q - (b.perceptron - 0.2)) / 0.5);
      const ph = (q / 1.7) % 1;
      const plug = Math.sin(Math.PI * Math.min(1, ph / 0.45)) * (ph < 0.45 ? 1 : 0) * (1 - still);
      // round-1 critic: the arm opened 10° from the torso, so the forearm and hand read against the board
      return addPose(WORK, { elbowF: -10 * plug, shoulderF: 10 + 4 * plug, head: -2 * still });
    };
    // review round 4 (story, showrunner at 22.4 s): on "Frank" he turns camera-LEFT, out of the work at the
    // board and toward his machine: the head lifts off the cords, the chest opens to the camera and the near arm
    // opens out toward the eye on its stand (PRESENT_EYE), a little overshoot and settle, then he HOLDS the pose,
    // breathing, to the cut (never reaching away to the far rack)
    const turnK = (q: number) => sm((q - tTurn) / 0.5);
    const presentK = (q: number) => {
      const pu = (q - tPresent) / 0.5;
      return pu <= 0 ? 0 : pu >= 1 ? 1 : 1 - Math.pow(1 - pu, 3);
    };
    const at = (q: number): Pose => {
      const e1 = turnK(q);
      const e2 = presentK(q);
      // a little overshoot and settle on the open hand
      const over = Math.sin(Math.PI * Math.min(1, Math.max(0, (q - tPresent - 0.35) / 0.6)));
      let base = workAt(q);
      if (e1 > 0) base = blendPose(base, TURNED, e1);
      if (e2 > 0) base = addPose(blendPose(base, PRESENT_OPEN, e2), { shoulderF: 4 * over, wristF: -4 * over });
      return addPose(base, breath(q, 3, 1));
    };
    const rose = (t: number): Rose => {
      const tq = tq12(t);
      const facing: Facing = 'left';
      // the chest opens toward the camera through the turn (a slight widening of the cut-out)
      const sx = 1 + (TURN_SX - 1) * turnK(tq);
      // the turn carries a half step back off the board (on the twos, a small knee dip), opening the space
      // between his hand and the eye
      const st = sm((tq - tTurn) / 0.5);
      const stDip = Math.sin(Math.PI * st);
      // round-1 critic: until the board wakes he waits a step to the left, wholly inside the sleeping board's
      // silhouette (ink on ink: no head or shoulder poking past its edge into the window gap); as the board's
      // light comes up he steps out into the gap (on the twos, a small knee dip), so the truck finds a man
      const su = sm((tq - (b.wires - 1.05)) / 0.75);
      const dip = Math.sin(Math.PI * su);
      // hidden, his near arm hangs (it would reach past the board's far edge); it rises to the cords as he steps
      const armDown = 1 - sm((tq - (b.wires - 0.75)) / 0.6);
      const lower = (q: number) => addPose(at(q), { shoulderF: -50 * armDown, elbowF: -48 * armDown, wristF: 6 * armDown });
      const pose = addPose(lower(tq), { kneeF: -10 * dip - 6 * stDip, hipF: 7 * dip + 4 * stDip, kneeB: 6 * dip + 3 * stDip });
      const prev = lower(tq - 1 / 12);
      return { x: ROSE_AT - HIDE_DX * (1 - su) + STEP_BACK * st, facing, sx, pose: { ...pose, prev } };
    };
    const showRose = -1; // he is in the lab from the first frame
    tl.hold(0, D);
    // the pull-back's last stretch: the action plane's ink deepens into the two-shot
    const tR = b.psych;
    return { tl, b, dur: D, camX, camY, camK, rose, showRose, tR };
  },
  paint(f, s, scene) {
    void s;
    const t = f.t;
    const b = scene.b;
    const k = scene.camK(t);
    const cam: Camera3 = { x: scene.camX(t), y: scene.camY(t), z: zFor(k), lens: LENS };
    f.camera(cam);
    // s01's exposure exactly (NIGHT_LOOK), held: the crossfade is a true match-dissolve. The room's tubes
    // strike just after it; the hot spot slides right with the truck
    const NL = NIGHT_LOOK;
    const tubes = [tubeAt(t, 0), tubeAt(t, 1)];
    const tubesLit = 0.75 * Math.max(tubes[0], tubes[1]);
    nightLab(f, {
      key: 'ch01-s02',
      cams: CAMS,
      light: NL.light,
      // s01's sun (on the glass right behind the eye) at the cut, sliding right with the truck
      sunX: 640 + (MK.EYE.x - cam.x) * k + (820 - 640 - (MK.EYE.x - cam.x) * k) * sm((t - b.col) / 4),
      sunRadius: NL.sunRadius,
      hot: NL.hot,
      focus: NL.focus,
      tubesLit,
      blinds: NL.blinds,
      fog: NL.fog,
      glass: NL.glass,
      floorDark: NL.floorDark,
      wall: NL.wall,
      air: () => {
        labHaze(f, { key: 'ch01-s02', cams: CAMS, hot: 640, k: 0.75 * NL.light });
        f.fog({ yCenter: 430, height: 170, alpha: 0.15, drift: 6 });
      },
      mid: () => {
        nightCabinet(f, { key: 'ch01-s02', dark: 0.7 });
        nightBeam(f, { key: 'ch01-s02', wx: 640, k: 0.8 * NL.light * (1 - 0.6 * sm((t - b.wires) / 3)) });
        f.layer('L3', (c, env) => {
          LOW_TUBES.forEach((p, k) => hungTube(c, env, { x: p.x, y: p.y, lit: tubes[k] }));
        });
      },
    });

    const cells = retinaCells(t, b);
    // the eye keeps s01's glow through the cut (EYE_HELD), and comes fully up with the shimmer on "eye"
    const L = EYE_HELD.light * sm((t - (b.its - 0.05)) / 0.5) + (1 - EYE_HELD.light) * sm((t - (b.eye - 0.2)) / 0.9);
    // its own phosphor glow: s01's held level at the cut, a lift with the shimmer, then the steady glow the
    // iris closes on
    const eyeGlow = EYE_HELD.glow * sm((t - (b.its - 0.05)) / 0.6) + 0.14 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - (b.eye - 0.1)) / 1.2))) + 0.06 * sm((t - b.name) / 1.2);
    // each part wakes from s01's near-black on the word that names it
    const wake = (at: number, dur: number) => ASLEEP * (1 - sm((t - at) / dur));
    // s01's extra night (SLEEP_DARK) lifts as the eye wakes on "Its" (the match-dissolve opens on it)
    const night = SLEEP_DARK * (1 - sm((t - (b.its - 0.1)) / 0.9));
    // the plugboard wakes and the cord light starts BEFORE "wires", so the light is running on the word;
    // the racks (their faces already faintly showing) wake slowly from "racks", while they are in frame
    // review round 4 (art): the board is lit by the time he steps out of its shadow (≈11.0 s), so he is first
    // seen against the lit patch board, not against its dark
    const dim = { patch: wake(b.wires - 1.3, 0.9), racks: wake(b.racks - 0.05, 1.4) };
    // asleep parts sit back in the air as in s01; the veil lifts as each wakes
    const veil = { patch: SLEEP.veil * (dim.patch / ASLEEP), racks: SLEEP.veil * (dim.racks / ASLEEP) };
    // how awake the board is (0 asleep → 1): the window pocket behind the man and his cut-lines come up with
    // it, so he stays in the board's dark until the truck finds him on "wires"
    const boardAwake = 1 - dim.patch / ASLEEP;
    const topRim = SLEEP.topRim + (0.5 - SLEEP.topRim) * (1 - dim.racks / ASLEEP);
    const patch = 0.12 + 0.25 * sm((t - (b.wires - 0.5)) / 0.5);
    // "wires": a rim light sweeps along five of the hero cords (a lit segment travelling the catenary over
    // 0.6 s, staggered), then each rests faintly lit (no glints or sparkles: review round 1)
    CORDS.fill(0);
    [0, 2, 4, 6, 8].forEach((i, j) => (CORDS[i] = Math.max(0, (t - (b.wires - 0.3 + j * 0.1)) / 0.6)));
    const knobs = knobState(t, b);
    // the stimulus card's lamp comes on dim WITH the eye on "grid" (one source pair, the shape being shown)
    const card = 0.4 * sm((tq12(t) - (b.eye - 0.1)) / 0.35);
    // the soft highlight across the racks on "dials" (0 → 1 over 1.1 s)
    const sweep = (t - (b.dialsWord - 0.15)) / 1.1;
    // the maker's plate catches the light on "Perceptron": a glint crosses it, the engraving settles lit
    const plateK = sm((t - (b.perceptron - 0.1)) / 0.5);
    const plate = { lit: 0.1 * sm((t - (b.racks - 0.2)) / 0.6) + 0.85 * plateK, sweep: (t - (b.perceptron - 0.15)) / 0.75 };
    const rose = scene.rose(t);
    // value: in the two-shot the action plane's ink goes ~25% darker, so the man and the racks snap off the glass
    const inkPush = 0.12 + 0.18 * sm((t - (scene.tR - 1.2)) / 1.6);

    // two fluorescent fixtures hung lower on their rods (L3), in the top of the wide two-shot; a slow seeded flicker
    f.layer('L3', (c, env) => {
      for (const [k, x] of TUBES.entries()) {
        c.fillStyle = env.fill('ink');
        c.fillRect(x - 60, -200, 2.4, TUBE_Y - 4 + 200);
        c.fillRect(x + 58, -200, 2.4, TUBE_Y - 4 + 200);
        c.fillRect(x - LAB.tubeLen / 2, TUBE_Y - 6, LAB.tubeLen, 8);
        const fl = tubeAt(t, k + 2);
        c.fillStyle = mixLab(env.fill('ink'), env.mood.core, 0.35 + 0.55 * fl);
        c.fillRect(x - LAB.tubeLen / 2 + 6, TUBE_Y + 2, LAB.tubeLen - 12, 3);
      }
    });

    // the L3 fluorescent practicals glow BEHIND the action plane (review round 4, value hierarchy): painted
    // before L4, so the racks and the man occlude their halos instead of being washed by them (painted after,
    // the low tubes lifted his head from near-black to about Y 30)
    if (tubesLit > 0.01) labTubes(f, { cams: CAMS, intensity: 0.32 * tubesLit, radius: 76 });
    LOW_TUBES.forEach((p, k) => {
      if (tubes[k] > 0.01) f.practical({ x: p.x, y: p.y + 9, kind: 'tube', seed: 480 + k * 5, intensity: 0.42 * tubes[k], radius: 70, layer: 'L3' });
    });
    TUBES.forEach((x, k) => f.practical({ x, y: TUBE_Y + 4, kind: 'tube', seed: 470 + k * 5, intensity: 0.34 * tubeAt(t, k + 2), radius: 70, layer: 'L3' }));

    f.layer('L4', (cc, env0) => {
      const darkInk = inkPush > 0.002 ? mixLab(env0.fill('ink'), '#000000', inkPush) : '';
      const env: PaintEnv = darkInk ? { ...env0, fill: (r) => (r === 'ink' ? darkInk : env0.fill(r)) } : env0;
      const c = cc;
      // the window light raking down onto the eye from the upper right (it receives, never emits)
      if (L > 0.002) {
        const fx = EYE.x;
        const fy = EYE.y;
        const sx = fx + 560;
        const sy = fy - 420;
        c.save();
        c.globalCompositeOperation = 'screen';
        for (const [w0, w1, a] of [
          [230, 120, 0.06],
          [170, 92, 0.08],
          [110, 70, 0.1],
        ] as const) {
          const g = c.createLinearGradient(sx, sy, fx, fy);
          g.addColorStop(0, withAlpha(env.mood.halo, 0));
          g.addColorStop(0.55, withAlpha(env.mood.halo, a * 0.6 * L));
          g.addColorStop(1, withAlpha(env.mood.halo, a * L));
          c.fillStyle = g;
          const ang = Math.atan2(fy - sy, fx - sx) + Math.PI / 2;
          const nx = Math.cos(ang);
          const ny = Math.sin(ang);
          c.beginPath();
          c.moveTo(sx + (nx * w0) / 2, sy + (ny * w0) / 2);
          c.lineTo(fx + (nx * w1) / 2, fy + (ny * w1) / 2);
          c.lineTo(fx - (nx * w1) / 2, fy - (ny * w1) / 2);
          c.lineTo(sx - (nx * w0) / 2, sy - (ny * w0) / 2);
          c.closePath();
          c.fill();
        }
        c.restore();
      }
      // Rosenblatt (on twos, breathing) in front of the machine, in true INK (bible §10.2, review round 1). The
      // window light falling through the gap between the board and the first rack hangs as a soft pocket of
      // haze on the machine BEHIND him (a local fog sheet between the racks and the man), so his profile cuts
      // off a lifted ground; his only light is the kit's rim crescent (f.rim below) and a few dim cut-lines
      drawMachine(c, env, { cells, patch, racks: 1, eyeLight: L, card, dim, veil, faces: SLEEP.faces, shutterDark: SLEEP.shutterDark, topRim, sideRim: SLEEP.sideRim * (dim.racks / ASLEEP), knobs, motors: knobs.motors, cords: CORDS, plate, sweep });
      {
        const hx = ROSE_AT - 10;
        const hy = INST.y - 250 * MK.PX * 0.55;
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.translate(hx, hy);
        c.scale(1, 1.9);
        const R = 150;
        const g = c.createRadialGradient(0, 0, 10, 0, 0, R);
        const hz = env.fill('haze');
        g.addColorStop(0, withAlpha(hz, 0.42 * boardAwake));
        g.addColorStop(0.5, withAlpha(hz, 0.26 * boardAwake));
        g.addColorStop(1, withAlpha(hz, 0));
        c.fillStyle = g;
        c.fillRect(-R, -R, 2 * R, 2 * R);
        c.restore();
      }
      // round-1 critic (pacing): the bank recedes, a little more haze over the second rack and more over the
      // third, so the three racks step back into the air instead of reading as one flat wallpaper
      c.save();
      c.globalCompositeOperation = 'source-atop';
      MK.POTS.forEach((x, r) => {
        if (r === 0) return;
        c.fillStyle = withAlpha(env.fill('haze'), r === 1 ? 0.045 : 0.09);
        c.fillRect(x - 40 * MK.PX, INST.y - 240 * MK.PX, 80 * MK.PX, 250 * MK.PX);
      });
      c.restore();
      const pose = withLife(rose.pose, env.tq, 1958, 1.5);
      // round-1 critic: his raised forearm must not merge with the cable tangle: a soft pocket of window haze
      // on the board right behind the hand and forearm (the board is lifted there, he stays true ink)
      if (boardAwake > 0.01 && rose.facing === 'left') {
        const ro = { x: rose.x, y: INST.y, facing: rose.facing, pose, scale: ROSE_S };
        const hand = rosenblattSuit.anchor(ro, 'handF');
        const head = rosenblattSuit.anchor(ro, 'head');
        const mx = hand.x + (head.x - hand.x) * 0.35;
        const my = hand.y + (head.y - hand.y) * 0.2;
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.translate(mx, my);
        c.rotate(Math.atan2(head.y - hand.y, head.x - hand.x));
        c.scale(1.9, 1);
        const R = 34;
        const g = c.createRadialGradient(0, 0, 4, 0, 0, R);
        const hz = env.fill('haze');
        g.addColorStop(0, withAlpha(hz, 0.34 * boardAwake));
        g.addColorStop(0.6, withAlpha(hz, 0.16 * boardAwake));
        g.addColorStop(1, withAlpha(hz, 0));
        c.fillStyle = g;
        c.fillRect(-R, -R, 2 * R, 2 * R);
        c.restore();
      }
      // round-1 critic (ghost): while the board sleeps he is NOT drawn at all (a flat ink figure over the board's
      // faint louvres read as a translucent man inside the cabinet). He is seen only as the board's light comes up
      // behind him: his presence follows the board's wake, so the silhouette appears as its ground lights
      const awakeK = sm(Math.min(1, boardAwake * 1.6));
      if (t >= scene.showRose && awakeK > 0.01) {
        // his cut-lines catch the window only once the board behind him is awake (before, he is ink in the dark)
        // round-1 critic (puppet): at this scale the lapel, pen-pocket, hem and cuff cut-lines read, and the window
        // side carries his own 1.5 px edge rim at near full strength
        const rimMix = 0.12 + 0.88 * (1 - boardAwake);
        // he settles to the near-black figure fill (ROSE_INK, review round 4: the darkest shape in frame, a step
        // below the racks) as the board's light comes up behind him on "wires"
        const manInk = mixLab(mixLab(env0.fill('ink'), '#000000', SLEEP.shutterDark), ROSE_INK, awakeK);
        const cutEnv: PaintEnv = { ...env0, fill: (r) => (r === 'rim' ? mixLab(env0.mood.rim, env0.fill('ink'), rimMix) : env0.fill(r)) };
        c.save();
        c.globalAlpha = awakeK;
        if (rose.sx !== 1) {
          c.translate(rose.x, 0);
          c.scale(rose.sx, 1);
          c.translate(-rose.x, 0);
        }
        // review round 4 (art, close-ups at 11-15 s): no interior seam strokes; the detail lives on the outline
        // (hair mass, collar, tie knot, cuff break, forearm taper, the wrist's bend) and the window-side edge rim
        rosenblattSuit.draw(c, { x: rose.x, y: INST.y, facing: rose.facing, pose, scale: ROSE_S, cutLines: true, light: ROSE_KEY, ink: manInk, edgeRim: { x: ROSE_KEY.x, y: ROSE_KEY.y, px: 1.5, alpha: 0.85 } }, cutEnv);
        c.restore();
      }
      sleepDarken(c, night);
      // what the eye looks at: a faint wedge of the card's light thrown across to the photocell face
      if (card > 0.01) {
        const cf = cardFace(MK.EYE_AT);
        const half = 10 * MK.PX;
        const eh = 18 * MK.PX;
        const ex = EYE.x - 18 * MK.PX;
        c.save();
        c.globalCompositeOperation = 'screen';
        const g = c.createLinearGradient(cf.x, 0, ex, 0);
        g.addColorStop(0, withAlpha(env.mood.halo, 0.07 * card));
        g.addColorStop(1, withAlpha(env.mood.halo, 0.025 * card));
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(cf.x + 4, cf.y - half);
        c.lineTo(ex, EYE.y - eh);
        c.lineTo(ex, EYE.y + eh);
        c.lineTo(cf.x + 4, cf.y + half);
        c.closePath();
        c.fill();
        c.restore();
      }
    });
    // the set's rim on window-facing tops only (review round 4); the man's window-side (upper-left) edge is his own
    // contour rim, cut by the kit along ROSE_KEY
    f.rim(SET_RIM);

    f.practical({ x: EYE.x, y: EYE.y, kind: 'screen', seed: EYE_HELD.seed, intensity: eyeGlow, radius: EYE_HELD.radius, layer: 'L4' });
    if (card > 0.01) {
      const lp = cardLamp(MK.EYE_AT);
      f.practical({ x: lp.x, y: lp.y, kind: 'lamp', seed: 19, intensity: 0.5 * card, radius: 18, layer: 'L4' });
    }
    // s01's desk end, lamp and chair (the cut's shared foreground; they leave frame left as the truck starts)
    const desk = nightDesk(f, { key: 'ch01-s01', ...LAB_DESK });
    // s01's dim desk lamp (round-1 critic), carried through the match-dissolve; it leaves frame left with the truck
    deskLampGlow(f, cam, desk.bulb, DESK_LAMP);
    labForeground(f, { key: 'ch01-s01', cams: CAMS, floor: 760, items: [LAB_CHAIR] });
    // near plane (z 780: the dolly goes deep, so a farther foreground than the kit's L5)
    labForeground(f, { key: 'ch01-s02', cams: CAMS, plane: NEAR, floor: NEAR_FLOOR, items: NEAR_ITEMS });
    // s01's L5 chair back in the lower-right corner (the match-dissolve's foreground); the push carries it out
    // of the corner and it racks away before the truck
    nearChairBack(f, { key: 'ch01-s02', alpha: 1 - sm((t - 0.9) / 1.4) });
    nightVignette(f, 0.95 - 0.05 * sm((t - 2) / 4));
    deskLampPool(f, cam, desk.bulb, DESK_LAMP);
    // round-1 critic (framing): while the truck carries the camera box across the left frame edge (out on the
    // way to the racks, back in on the pull-back) the edge falls off into shadow, so the box exits (and enters)
    // into darkness instead of hanging half-cut against the lit window. Tied to the box's own screen position:
    // nothing when it is wholly in or wholly out of frame
    {
      const bl = 640 + (EYE.x + BOX_DX - BOX_HW - cam.x) * k;
      const br = 640 + (EYE.x + BOX_DX + BOX_HW - cam.x) * k;
      const cut = sm((-bl + 24) / 70) * sm((br + 30) / 70);
      if (cut > 0.003) {
        const c = f.c;
        const w = Math.max(80, br + 90);
        const g = c.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, withAlpha(f.mood.fg, 0.82 * cut));
        g.addColorStop(0.55, withAlpha(f.mood.fg, 0.45 * cut));
        g.addColorStop(1, withAlpha(f.mood.fg, 0));
        c.save();
        c.fillStyle = g;
        c.fillRect(0, 0, w, 720);
        c.restore();
      }
    }

    // screen-locked type
    const c = f.c;
    const env = { t, mood: f.mood, seed: 12 };
    const sx = (x: number) => 640 + (x - cam.x) * k;
    const sy = (y: number) => 360 + (y - cam.y) * k;
    const c00 = cellAt(0, 0);
    const c019 = cellAt(0, 19);
    const c190 = cellAt(19, 0);
    const half = (cellAt(0, 1).x - c00.x) / 2;
    const gL = sx(c00.x - half);
    const gR = sx(c019.x + half);
    const gT = sy(Math.min(c00.y, c019.y) - half);
    const gB = sy(c190.y + half);
    // review round 1: the grid's labels are GONE by the end of the second "twenty" (+0.2 s), before
    // "Behind" and before the truck sets off, so each beat is clean
    const gone = b.twentyEnd + 0.2;
    // "400 light cells": right of the grid, on a plate centred on the text's own bounds
    const size = 34;
    const lab = { x: gR + 70, y: (gT + gB) / 2 - 26 };
    const A = envelope(t, b.four - 0.15, gone - (b.four - 0.15), 0.3);
    if (A > 0) {
      c.save();
      c.font = `500 ${size}px ${FONT.text}`;
      const tw = c.measureText('400 light cells').width;
      c.globalAlpha = A;
      softPlate(c, lab.x + 4 + tw / 2, lab.y - size * 0.3, tw * 1.45, 78, f.mood.ink, 0.85);
      c.restore();
    }
    annotation(c, { text: '400 light cells', x: gR + 6, y: (gT + gB) / 2, tx: lab.x, ty: lab.y, at: b.four - 0.15, dur: gone - (b.four - 0.15), fade: 0.3, size }, env);
    // "twenty by twenty": a bracket above the top row (clear of the carry handle), then down the left side
    // round-1 critic: both brackets (2× stroke, core colour, 33 px counts) hold until "Behind", over the lit top
    // row and left column they measure
    const bGone = b.behind + 0.15;
    bracket(c, f.mood, t, { x0: gL, y0: gT - 50, x1: gR, y1: gT - 50, at: b.row - 0.12, until: bGone, label: '20', side: 'top' });
    bracket(c, f.mood, t, { x0: gL - 22, y0: gT, x1: gL - 22, y1: gB, at: b.col - 0.12, until: bGone, label: '20', side: 'left' });

    // the name card (review round 3): name and role come in as ONE unit on "Frank" (the rule and the name lead by
    // 0.1 s, "psychologist" follows 0.3 s later; never the role before the name), on the dark floor band at the
    // lower left (screen-locked, on a soft feathered plate, never over the dial lattice); it holds until the iris
    // round-1 critic (sync): the card leads "Frank" by 0.25 s and stays fully up THROUGH the iris (never faded
    // out ahead of it): the closing aperture takes it last, ≈17.45-17.6 s, so it reads for ≈2.2 s
    const nAt = b.name - 0.25;
    // round-1 critic: gone (17.0 → 17.3 s) before the iris into ch01-s03 can clip it
    // review round 4: the card sits NEAR THE EYE (inside the iris aperture, ≤ 520 px from the frame centre), so
    // the iris (from 22.4 s) closes around it; it fades 22.28 → 22.58, before the aperture's edge reaches it
    const nEnd = scene.dur + 0.9;
    const PA = envelope(t, nAt, nEnd - nAt, 0.3);
    if (PA > 0) {
      const NX = 150;
      const NY = 476;
      c.save();
      c.globalAlpha = PA;
      softPlate(c, NX + 170, NY + 14, 520, 190, f.mood.ink, 0.9);
      softPlate(c, NX + 150, NY + 12, 380, 120, f.mood.ink, 0.55);
      c.restore();
      c.save();
      c.translate(NX, NY);
      c.scale(1.15, 1.15);
      c.translate(-NX, -NY);
      nameCard(c, { name: 'Frank Rosenblatt', role: '', x: NX, y: NY, at: nAt, dur: nEnd - nAt, fade: 0.3, plate: false }, env);
      // the role line, 0.3 s after the name (set larger than the kit's and in the palette's core)
      const RA = PA * sm((t - (nAt + 0.3)) / 0.35);
      if (RA > 0) {
        c.globalAlpha = RA;
        c.fillStyle = f.mood.core;
        c.font = `italic 500 28px ${FONT.text}`;
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.fillText('psychologist', NX, NY + 11 + 28 + 8);
      }
      c.restore();
      // as the name is spoken, it brightens a touch (a soft lift on "Frank")
      const lift = 0.35 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - (b.name - 0.1)) / 0.9)));
      if (lift > 0.01) {
        c.save();
        c.globalAlpha = PA * lift;
        c.globalCompositeOperation = 'lighter';
        softPlate(c, NX + 130, NY - 8, 380, 60, f.mood.halo, 0.18);
        c.restore();
      }
    }
  },
});
