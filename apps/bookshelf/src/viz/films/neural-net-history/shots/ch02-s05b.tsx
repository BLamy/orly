/**
 * ch02-s05b — Manchester, 1950, night: Turing at his lit window with a schoolroom bell and a child's slate;
 * then a pan right that whips past a near brick pier and lands on the Wall of Forecasts in the study, where
 * the hands pin his forecast slip in W1 (candleAmber throughout: the same amber lamp).
 *
 *   0.6  "Alan"        a slow push toward the lit window in the dark brick façade; MANCHESTER · 1950 types on
 *   "Turing"          name card; Turing (small, inside, at his desk) writes on the twos under an anglepoise lamp
 *   "stranger"        he stops writing and lifts his head
 *   "educate"         the schoolroom bell on the sill rocks once (a soft, decaying swing on the twos)
 *   "child"           a small paper-cut child's slate appears on the sill beside him
 *   "machine"         the camera pans right off the window; a near brick pier (L6, blurred) whips across the
 *                     lens and the frame lands, still trucking and decelerating, on the Wall beside the Case Board
 *   line end + .1     the hands enter from the lamp side and pin TURING · DUE 2000 · 3 in 10 fooled in W1 (nearest
 *                     the board); it hangs crisp and lamp-lit for the hold; W6's lower corner is just visible,
 *                     half-lit, at the right edge; the camera settles on the slip.
 *
 * Geography: the Manchester façade is its own small world (L1 skyline, L3 room seen through the window, L4
 * façade + sill); the study uses the shared sets (studyRoom / studyCase) and studyState ('start' + W1 by hand).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, Pose } from '../../../film';
import {
  LAYERS,
  anglepoiseLamp,
  bookshelfWall,
  defineShot,
  mixLab,
  nameCard,
  overscan,
  placeStamp,
  pose,
  skyline,
  stars,
  withAlpha,
  withLife,
  writingDesk,
  loopPose,
  blendPose,
  addPose,
  toLayer,
  toScreen,
  createPuppet,
  softPlate,
} from '../../../film';
import { cast, hands } from '../cast';
import { STUDY, studyCase, studyRoom } from '../sets/study';
import { drawSlip, slotLight, wallSlotAt, WALL_SLOTS } from '../sets/wallOfForecasts';
import { SLIPS } from '../sets/studyState';
import { handsEntry } from '../sets/narratorHands';
import { blurRect, lerp, monotone, sm, smearX, tq12, win } from '../sets/ch02-s05b-util';

const ID = 'ch02-s05b';

// ------------------------------------------------------------------ Manchester geography (rest-screen px)
const WIN = { x0: 412, x1: 628, y0: 148, y1: 498 }; // the lit sash window (a HOLE in the façade)
const SILL_Y = 500;
const FACADE_X1 = 1080; // the building's right edge; an alley and the far city beyond
const TURING = { x: 470, y: 548, s: 0.84 }; // seated, feet below the sill line (hidden by the wall)
const DESK = { x: 560, y: 548, s: 0.86 };
const BELL = { x: 432, y: SILL_Y }; // tucked against the left jamb, clear of Turing's back (it read as part of his figure)
const SLATE = { x: 596, y: SILL_Y };
/** the sill props, ~1.45x the first cut (with the push toward the sill they read about double on screen) */
const BELL_S = 2.15;
const SLATE_S = 1.9;
/** the swing: ±20° */
const BELL_AMP = (20 * Math.PI) / 180;
/** from 'program' to 'machine' the camera pushes ~15% toward the sill (z +100, trucking onto the props) */
const SILL_PUSH = { dz: 100, x: 520 };
/** the rule-ledger on the desk (L3), propped open, just above the sill line as seen through the window */
const LEDGER = { x: 566, y: 442 };
/** Turing, rumpled: the tweed blazer and messy hair of the cast, a touch stockier (his own outline) */
const P_TURING = createPuppet({ ...cast.turing.spec, id: 'turing-s05b', build: 'average' });

// ------------------------------------------------------------------ cameras
// Manchester: a slow push that lowers its eye a touch, so the L5 area railing keeps its tops in frame (depth)
const M0: Camera3 = { x: 600, y: 370, z: -60, lens: 1 };
const M1: Camera3 = { x: 548, y: 372, z: 240, lens: 1 };
const M_PAN = 330; // world px the Manchester camera trucks right before the cut
// the study: ONE pan (ease-in-out, ~2 s from "machine") — the Manchester half accelerates into the pier, the
// study half comes out of it still moving across the Case Board (WHO TAUGHT IT? at K, the chat box's slot at
// the output), SLOWS as it crosses the board's right edge, and lands on the Wall with the board's dark frame
// in the left ~12% and W6's half-lit corner at the right edge; then a very gentle push over the hold.
const S_BOARD: Camera3 = { x: 760, y: 318, z: 400, lens: 1 };
const S_SLOW: Camera3 = { x: 950, y: 312, z: 410, lens: 1 };
/** W1's centre, world (the slip is the subject of the reading hold: the camera lands near it and pushes in so
 *  its typed line clears the 22 px legibility floor about 0.7 s after it is pinned) */
const W1C = { x: STUDY.wall.x + WALL_SLOTS.W1.x * STUDY.wall.k, y: STUDY.wall.y + WALL_SLOTS.W1.y * STUDY.wall.k };
const S_LAND1: Camera3 = { x: W1C.x + 70, y: W1C.y + 34, z: 590, lens: 1 };
// (revised: the hold sits a little right and low of the slip, so W6's older slip shows one half-lit corner just
// inside the frame's right edge)
const S_READ: Camera3 = { x: W1C.x + 66, y: W1C.y + 38, z: 642, lens: 1 };
const S_HOLD: Camera3 = { x: W1C.x + 72, y: W1C.y + 42, z: 664, lens: 1 };
const M_CAMS: Camera3[] = [M0, M1, { ...M1, x: M1.x + M_PAN }];
const S_CAMS: Camera3[] = [S_BOARD, S_SLOW, S_LAND1, S_READ, S_HOLD];
/** the empty slots' bare pins sit in one row at W1's pin height (wall units) */
const EMPTY_ROW = WALL_SLOTS.W1.y - WALL_SLOTS.W1.h / 2 + 6;

/** Turing's slip: the shared Wall data (one painter, one layout, in every shot that shows the Wall) */
const W1_SLIP = SLIPS.find((d) => d.slot === 'W1')!;
const W6_SLIP = SLIPS.find((d) => d.slot === 'W6')!;


/** seated at the desk, writing (pen hand on the page, far forearm resting) */
const SEAT_WRITE: Pose = pose(
  { hipF: 86, kneeF: -84, hipB: 82, kneeB: -80, torso: 12, neck: 6, head: 10, shoulderF: 58, elbowF: 74, wristF: 4, shoulderB: 44, elbowB: 84, wristB: -10 },
  { handF: 'grip', handB: 'palmDown' },
);
/** he stops writing and lifts his head (~9° more than the reading pose, pen off the page) */
const SEAT_LOOK: Pose = pose(
  { hipF: 86, kneeF: -84, hipB: 82, kneeB: -80, torso: -2, neck: -6, head: -14, shoulderF: 34, elbowF: 96, wristF: 10, shoulderB: 44, elbowB: 84, wristB: -10 },
  { handF: 'grip', handB: 'palmDown' },
);
/** on "program" he bends to the rule-ledger on the desk (head well down over it) */
const SEAT_LEDGER: Pose = pose(
  { hipF: 86, kneeF: -84, hipB: 82, kneeB: -80, torso: 16, neck: 12, head: 18, shoulderF: 50, elbowF: 70, wristF: 6, shoulderB: 44, elbowB: 84, wristB: -10 },
  { handF: 'relaxed', handB: 'palmDown' },
);
/** on "child" he turns down toward the slate on the sill, leaning to it */
const SEAT_SLATE: Pose = pose(
  { hipF: 86, kneeF: -84, hipB: 82, kneeB: -80, torso: 14, neck: 10, head: 16, shoulderF: 46, elbowF: 70, wristF: 8, shoulderB: 40, elbowB: 80, wristB: -10 },
  { handF: 'grip', handB: 'palmDown' },
);

interface Beats {
  program: number;
  grownUp: number;
  but: number;
  alan: number;
  turing: number;
  stranger: number;
  educate: number;
  child: number;
  machine: number;
  lineEnd: number;
  cut: number;
  pan0: number;
  land: number;
  pin0: number;
  pinDur: number;
  dur: number;
}

function mancCam(t: number, b: Beats): Camera3 {
  // slow push toward the window, then the pan right from "machine" (the ease-in half of the one pan)
  const u = sm(t / b.machine) * 0.85 + 0.15 * Math.min(1, t / b.machine);
  const base: Camera3 = { x: lerp(M0.x, M1.x, u), y: lerp(M0.y, M1.y, u), z: lerp(M0.z, M1.z, u), lens: 1 };
  // 'program' → 'machine': the push toward the sill, so the bell and the slate read as the subject
  const pu = sm((t - (b.program - 0.1)) / (b.machine - b.program + 0.1));
  base.z += SILL_PUSH.dz * pu;
  base.x = lerp(base.x, SILL_PUSH.x, pu);
  if (t > b.pan0) {
    const p = Math.min(1, (t - b.pan0) / (b.cut - b.pan0));
    base.x += M_PAN * p * p;
  }
  return base;
}
/** the study half of the pan: out of the pier still moving, slowing over the board's right edge, landing */
function makeStudyCam(b: Beats) {
  const keys: [number, Camera3][] = [
    [b.cut, S_BOARD],
    [b.cut + 0.3, { ...S_BOARD, x: 880, y: 314, z: 405 }],
    [b.cut + 0.6, { ...S_SLOW, z: 440 }],
    [b.land, S_LAND1],
    [b.land + 1.0, S_READ],
    [b.dur, S_HOLD],
  ];
  const X = monotone(keys.map(([t, c]) => [t, c.x]));
  const Y = monotone(keys.map(([t, c]) => [t, c.y]));
  const Z = monotone(keys.map(([t, c]) => [t, c.z]));
  return (t: number): Camera3 => ({ x: X(t), y: Y(t), z: Z(t), lens: 1 });
}

// ------------------------------------------------------------------ Manchester painters
type C = CanvasRenderingContext2D;
const bake = (f: Frame, c: C, key: string, r: { x: number; y: number; w: number; h: number }, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);

/** the window head: a shallow segmental arch */
function windowPath(p: Path2D, inset = 0) {
  const { x0, x1, y0, y1 } = WIN;
  p.moveTo(x0 + inset, y1 - inset);
  p.lineTo(x0 + inset, y0 + 26 + inset);
  p.quadraticCurveTo((x0 + x1) / 2, y0 - 6 + inset, x1 - inset, y0 + 26 + inset);
  p.lineTo(x1 - inset, y1 - inset);
  p.closePath();
}

function facade(cc: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const brick = env.fill('set');
  const P = new Path2D();
  P.rect(r.x, 36, FACADE_X1 - r.x, r.y + r.h - 36);
  windowPath(P);
  // two dark neighbouring windows (glass, not holes: unlit rooms)
  cc.fillStyle = brick;
  cc.fill(P, 'evenodd');
  // brick courses + perpends: faint mortar cut-lines, darker toward the roof (the lamp is low)
  cc.save();
  cc.clip(P, 'evenodd');
  const g = cc.createLinearGradient(0, 36, 0, 760);
  g.addColorStop(0, withAlpha(env.mood.fg, 0.45));
  g.addColorStop(0.55, withAlpha(env.mood.fg, 0.05));
  g.addColorStop(1, withAlpha(env.mood.fg, 0.35));
  cc.fillStyle = g;
  cc.fillRect(r.x, 36, FACADE_X1 - r.x, r.y + r.h - 36);
  cc.strokeStyle = withAlpha(env.mood.rim, 0.055);
  cc.lineWidth = 1;
  cc.beginPath();
  for (let y = 44, row = 0; y < r.y + r.h; y += 11, row++) {
    cc.moveTo(r.x, y);
    cc.lineTo(FACADE_X1, y);
    for (let x = r.x + (row % 2 ? 0 : 13); x < FACADE_X1; x += 26) {
      cc.moveTo(x, y);
      cc.lineTo(x, y + 11);
    }
  }
  cc.stroke();
  // the window's warm spill on the brick around it (static part; the lamp flicker rides on the practical)
  const sp = cc.createRadialGradient(520, 330, 60, 520, 330, 420);
  sp.addColorStop(0, withAlpha(env.mood.halo, 0.2));
  sp.addColorStop(1, withAlpha(env.mood.halo, 0));
  cc.fillStyle = sp;
  cc.fillRect(100, 0, 900, 800);
  cc.restore();
  // dark windows: glass in fg with a faint sky reflection and bars
  for (const [x0, x1] of [[96, 268], [772, 944]] as const) {
    cc.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.25);
    cc.fillRect(x0, WIN.y0 + 20, x1 - x0, WIN.y1 - WIN.y0 - 20);
    const rg = cc.createLinearGradient(x0, WIN.y0, x1, WIN.y1);
    rg.addColorStop(0, withAlpha(env.mood.sky[2], 0.16));
    rg.addColorStop(0.5, withAlpha(env.mood.sky[2], 0.02));
    rg.addColorStop(1, withAlpha(env.mood.sky[2], 0.08));
    cc.fillStyle = rg;
    cc.fillRect(x0, WIN.y0 + 20, x1 - x0, WIN.y1 - WIN.y0 - 20);
    cc.fillStyle = env.fill('ink');
    for (const k of [1, 2]) cc.fillRect(x0 + ((x1 - x0) * k) / 3 - 2, WIN.y0 + 20, 4, WIN.y1 - WIN.y0 - 20);
    cc.fillRect(x0, (WIN.y0 + WIN.y1) / 2 + 8, x1 - x0, 6);
    // stone lintel + sill
    cc.fillStyle = mixLab(env.mood.setHaze, env.mood.set, 0.35);
    cc.fillRect(x0 - 12, WIN.y0 + 6, x1 - x0 + 24, 14);
    cc.fillRect(x0 - 14, WIN.y1, x1 - x0 + 28, 14);
  }
  // the lit window's frame: sash bars (ink), a stone surround, the sill
  cc.fillStyle = env.fill('ink');
  const bar = 4.5;
  const { x0, x1, y0, y1 } = WIN;
  const fr = new Path2D();
  windowPath(fr, -9);
  windowPath(fr, 0);
  cc.fill(fr, 'evenodd');
  for (const k of [1, 2]) cc.fillRect(x0 + ((x1 - x0) * k) / 3 - bar / 2, y0 + 6, bar, y1 - y0 - 6);
  const mid = (y0 + y1) / 2 + 14;
  cc.fillRect(x0, mid - 4, x1 - x0, 8); // meeting rail
  for (const yy of [y0 + 26 + (mid - y0 - 26) / 2, mid + (y1 - mid) / 3, mid + ((y1 - mid) * 2) / 3]) cc.fillRect(x0, yy - bar / 2, x1 - x0, bar);
  // stone surround: keystone + sill (lit edge on top)
  cc.fillStyle = mixLab(env.mood.setHaze, env.mood.set, 0.3);
  cc.beginPath();
  cc.moveTo((x0 + x1) / 2 - 16, y0 - 14);
  cc.lineTo((x0 + x1) / 2 + 16, y0 - 14);
  cc.lineTo((x0 + x1) / 2 + 11, y0 + 12);
  cc.lineTo((x0 + x1) / 2 - 11, y0 + 12);
  cc.closePath();
  cc.fill();
  cc.fillRect(x0 - 22, SILL_Y, x1 - x0 + 44, 16);
  cc.fillStyle = withAlpha(env.mood.rim, 0.5);
  cc.fillRect(x0 - 22, SILL_Y, x1 - x0 + 44, 1.6);
  // roof cornice + chimney stacks against the sky
  cc.fillStyle = env.fill('set');
  cc.fillRect(r.x, 22, FACADE_X1 - r.x + 14, 18);
  cc.fillStyle = mixLab(env.mood.set, env.mood.fg, 0.45);
  for (const [cx, w, h] of [[150, 44, 96], [690, 52, 120], [960, 40, 88]] as const) {
    cc.fillRect(cx - w / 2, 22 - h, w, h);
    cc.fillRect(cx - w / 2 - 5, 22 - h, w + 10, 9);
    for (let k = 0; k < 3; k++) cc.fillRect(cx - w / 2 + 6 + k * ((w - 16) / 2), 22 - h - 16, 8, 16);
  }
  // a drainpipe down the right edge
  cc.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.4);
  cc.fillRect(FACADE_X1 - 26, 30, 9, r.y + r.h);
  for (let y = 80; y < r.y + r.h; y += 120) cc.fillRect(FACADE_X1 - 29, y, 15, 6);
}

/** the room inside (L3), drawn only inside the window aperture as seen from this layer */
function room(c: C, env: PaintEnv, f: Frame, t: number, b: Beats) {
  // the warm back wall + a bookcase + a framed picture
  bake(f, c, `${ID}/room/${env.mood.id}`, { x: 300, y: 80, w: 480, h: 560 }, (cc) => {
    const wall = cc.createRadialGradient(600, 300, 30, 600, 300, 380);
    wall.addColorStop(0, mixLab(env.mood.halo, env.mood.core, 0.25));
    wall.addColorStop(0.5, mixLab(env.mood.halo, env.mood.setHaze, 0.25));
    wall.addColorStop(1, mixLab(env.mood.setHaze, env.mood.set, 0.3));
    cc.fillStyle = wall;
    cc.fillRect(300, 80, 480, 560);
    bookshelfWall(cc, { x: 600, y: 130, w: 150, h: 470, bays: 1, shelves: 6, seed: 50, gaps: 0.2, backTone: 0.3 }, env);
    // a darker corner behind him: the lamp does not reach it
    const sh = cc.createLinearGradient(300, 0, 470, 0);
    sh.addColorStop(0, withAlpha(env.mood.set, 0.85));
    sh.addColorStop(1, withAlpha(env.mood.set, 0));
    cc.fillStyle = sh;
    cc.fillRect(300, 80, 170, 560);
    // a schoolroom wall clock (period object): ink case, a pale face, hour ticks, hands at ten to eleven
    const CX = 487, CY = 226;
    cc.fillStyle = env.fill('ink');
    cc.beginPath();
    cc.arc(CX, CY, 27, 0, Math.PI * 2);
    cc.fill();
    cc.fillRect(CX - 2, CY - 38, 4, 12); // the hanging bracket
    cc.fillStyle = mixLab(env.mood.halo, env.mood.setHaze, 0.45);
    cc.beginPath();
    cc.arc(CX, CY, 21, 0, Math.PI * 2);
    cc.fill();
    cc.strokeStyle = env.fill('ink');
    cc.lineCap = 'round';
    cc.lineWidth = 1.6;
    cc.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r0 = i % 3 === 0 ? 14.5 : 17;
      cc.moveTo(CX + Math.cos(a) * r0, CY + Math.sin(a) * r0);
      cc.lineTo(CX + Math.cos(a) * 19, CY + Math.sin(a) * 19);
    }
    cc.stroke();
    cc.lineWidth = 2.6;
    cc.beginPath();
    cc.moveTo(CX, CY);
    cc.lineTo(CX + Math.cos(-2.2) * 10, CY + Math.sin(-2.2) * 10); // hour (near eleven)
    cc.moveTo(CX, CY);
    cc.lineTo(CX + Math.cos(-0.52) * 16, CY + Math.sin(-0.52) * 16); // minute (ten to)
    cc.stroke();
  });
  writingDesk(c, { x: DESK.x, y: DESK.y, s: DESK.s }, env);
  anglepoiseLamp(c, { x: DESK.x + 40, y: DESK.y - 77 * DESK.s, s: 0.8, lit: true, reach: 0.55, seed: 7 }, env);
  // papers on the desk
  c.fillStyle = mixLab(env.mood.halo, env.mood.core, 0.35);
  c.fillRect(DESK.x - 30, DESK.y - 77 * DESK.s - 2.5, 34, 2.5);
  // the stiff rule-ledger propped open on the desk: on "program" its ruled grid catches the lamp, then dims
  ledger(c, env, t, b);
  // Turing, on the twos: writing until "stranger", then he looks up and holds
  const tq = tq12(t);
  const at = (q: number): Pose => {
    const up = sm((q - (b.stranger - 0.1)) / 0.42);
    const w = loopPose('write', SEAT_WRITE, q);
    let p = blendPose(w, SEAT_LOOK, up);
    // "program": he bends to the rule-ledger (the grown-up mind, programmed) and turns one stiff page on the twos
    const down = sm((q - (b.program - 0.15)) / 0.4) * (1 - sm((q - (b.but - 0.05)) / 0.35));
    p = blendPose(p, SEAT_LEDGER, down);
    const turnU = (q - (b.program + 0.62)) / 0.5;
    if (turnU > 0 && turnU < 1) {
      const k = Math.round(Math.sin(turnU * Math.PI) * 3) / 3; // three drawings out and back
      p = addPose(p, { shoulderF: 26 * k, elbowF: -30 * k, wristF: -12 * k });
    }
    // a small extra lift as the bell rings, then the turn to the slate on "child" (3 drawings on the twos)
    const ring = sm((q - b.educate) / 0.3) * (1 - sm((q - (b.child - 0.1)) / 0.25));
    const turn = Math.round(sm((q - (b.child - 0.08)) / 0.33) * 3) / 3;
    return blendPose(addPose(p, { head: -6 * ring, neck: -3 * ring }), SEAT_SLATE, turn);
  };
  const p = withLife({ ...at(tq), prev: at(tq - 1 / 12) }, tq, 11, 1.5);
  const o = { x: TURING.x, y: TURING.y, facing: 'right' as const, pose: p, scale: TURING.s };
  P_TURING.draw(c, o, env);
  // character: a hair tuft standing up at the crown (it lifts a touch with his head), on the twos
  const hd = P_TURING.anchor(o, 'head');
  c.fillStyle = env.fill('ink');
  c.save();
  c.translate(hd.x + 1, hd.y - 12);
  c.rotate(((p.angles.head ?? 0) * Math.PI) / 180);
  // one unruly lock lifting off the crown, swept back
  c.beginPath();
  c.moveTo(-5, 2);
  c.quadraticCurveTo(-4, -4, -9, -7);
  c.quadraticCurveTo(-2, -6, 2, -2);
  c.quadraticCurveTo(1, 0, 3, 2);
  c.closePath();
  c.fill();
  c.restore();
}

/** the rule-ledger: a stiff open book propped on the desk, its ruled grid of rows and columns (no words) */
function ledger(c: C, env: PaintEnv, t: number, b: Beats) {
  // the grown-up mind, programmed: the rule-book catches the lamp on 'grown-up mind' and fades as the slate lands
  const lit = win(t, b.grownUp - 0.15, b.grownUp + 0.3) * (1 - win(t, b.child - 0.1, b.child + 0.35));
  const x = LEDGER.x, y = LEDGER.y;
  const tq = tq12(t);
  // the page that turns (three drawings on the twos), from the right leaf over to the left
  const turnU = (tq - (b.program + 0.62)) / 0.5;
  c.save();
  c.translate(x, y);
  // a thick, stiff rule-book (1.6x the first cut), its page block showing under the open leaves
  c.scale(1.6, 1.6);
  const paper = mixLab(env.mood.halo, env.mood.setHaze, 0.55 - 0.35 * lit);
  const leaf = (dir: number, ang: number) => {
    c.save();
    c.rotate(ang);
    c.fillStyle = paper;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(dir * 30, -4);
    c.lineTo(dir * 30, -26);
    c.lineTo(0, -24);
    c.closePath();
    c.fill();
    // the rules: an even ruled grid (rows and columns), a programmed table, no words
    c.strokeStyle = withAlpha(env.mood.ink, 0.3 + 0.4 * lit);
    c.lineWidth = 0.7;
    c.beginPath();
    for (let r = 1; r < 5; r++) {
      const yy = -24 + r * 4.4;
      c.moveTo(dir * 3, yy);
      c.lineTo(dir * 28, yy - 0.8);
    }
    for (const cx of [9, 16, 23]) {
      c.moveTo(dir * cx, -23.5);
      c.lineTo(dir * cx, -4);
    }
    c.stroke();
    c.restore();
  };
  // stiff boards behind (ink)
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(-34, -1);
  c.lineTo(0, 2);
  c.lineTo(34, -1);
  c.lineTo(34, -29);
  c.lineTo(0, -26);
  c.lineTo(-34, -29);
  c.closePath();
  c.fill();
  // the page block's thickness: a pale band under each leaf (a heavy book of rules)
  c.fillStyle = mixLab(env.mood.halo, env.mood.setHaze, 0.7);
  c.beginPath();
  c.moveTo(-33, -1);
  c.lineTo(0, 2);
  c.lineTo(33, -1);
  c.lineTo(33, 4);
  c.lineTo(0, 7);
  c.lineTo(-33, 4);
  c.closePath();
  c.fill();
  c.fillStyle = env.fill('ink');
  // a slim book-rest under it
  c.fillRect(-3, 6, 6, 8);
  c.fillRect(-14, 12, 28, 3);
  leaf(-1, -0.1);
  leaf(1, 0.1);
  if (turnU > 0 && turnU < 1) {
    const k = Math.round(turnU * 3) / 3;
    c.save();
    c.scale(Math.cos(k * Math.PI), 1);
    leaf(1, 0.1);
    c.restore();
  }
  if (lit > 0.01) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(0, -14, 2, 0, -14, 52);
    g.addColorStop(0, withAlpha(env.mood.core, 0.5 * lit));
    g.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(-52, -66, 104, 104);
  }
  c.restore();
}

/** the schoolroom hand-bell: turned handle + flared bell; rocks about its rim */
function bell(c: C, env: PaintEnv, rock: number, glint: number) {
  c.save();
  const pivot = rock >= 0 ? BELL.x + 16 * BELL_S : BELL.x - 16 * BELL_S; // the rim
  c.translate(pivot, BELL.y);
  c.rotate(rock);
  c.translate(-pivot, -BELL.y);
  c.translate(BELL.x, BELL.y);
  c.scale(BELL_S, BELL_S);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(-16, 0);
  c.quadraticCurveTo(-13, -4, -11, -10);
  c.quadraticCurveTo(-9, -24, -4, -27);
  c.lineTo(4, -27);
  c.quadraticCurveTo(9, -24, 11, -10);
  c.quadraticCurveTo(13, -4, 16, 0);
  c.closePath();
  c.fill();
  // collar + turned handle
  c.fillRect(-3, -31, 6, 5);
  c.beginPath();
  c.ellipse(0, -38, 4.2, 7, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(-2, -50, 4, 10);
  c.beginPath();
  c.arc(0, -52, 3.6, 0, Math.PI * 2);
  c.fill();
  // brass glint along the lip (lit by the room), flaring to a rim glint at each swing extreme
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, glint), 0.4 + 0.55 * glint);
  c.lineWidth = 1.2 + 1.1 * glint;
  c.beginPath();
  c.moveTo(-15, -1);
  c.quadraticCurveTo(-11, -12, -7, -22);
  c.stroke();
  if (glint > 0.05) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(-10, -12, 0, -10, -12, 16);
    g.addColorStop(0, withAlpha(env.mood.core, 0.9 * glint));
    g.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(-26, -28, 32, 32);
  }
  c.restore();
}

/** a child's slate in a wooden frame, leaning on the jamb; faint chalk letters */
function slate(c: C, env: PaintEnv, k: number, glint: number) {
  if (k <= 0) return;
  c.save();
  c.translate(SLATE.x, SLATE.y);
  c.rotate(-0.12);
  c.scale(SLATE_S, SLATE_S);
  const w = 46, h = 36;
  c.fillStyle = env.fill('ink');
  c.fillRect(-w / 2, -h, w, h);
  c.fillStyle = mixLab(env.mood.set, env.mood.fg, 0.4);
  c.fillRect(-w / 2 + 4, -h + 4, w - 8, h - 8);
  c.strokeStyle = withAlpha(env.mood.rim, 0.55);
  c.lineWidth = 1;
  c.beginPath();
  // a b c, and a ruled line (chalk)
  c.arc(-11, -20, 3.2, 0, Math.PI * 2);
  c.moveTo(-7.8, -23);
  c.lineTo(-7.8, -16.5);
  c.moveTo(-1, -27);
  c.lineTo(-1, -16.5);
  c.moveTo(2.2, -20);
  c.arc(2.2 + 0.1, -19.8, 3.2, Math.PI, Math.PI * 3);
  c.moveTo(14, -22.6);
  c.arc(11, -20, 3.2, -0.6, Math.PI * 1.65, true);
  c.moveTo(-16, -11);
  c.lineTo(16, -11);
  c.stroke();
  // a string loop at the top (a school slate)
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-6, -h);
  c.quadraticCurveTo(0, -h - 10, 6, -h);
  c.stroke();
  if (glint > 0.02) {
    // the lamp catches the slate's wet face as it lands (one brief glint)
    c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(-w / 2, -h, w / 2, 0);
    g.addColorStop(0.3, withAlpha(env.mood.core, 0));
    g.addColorStop(0.5, withAlpha(env.mood.core, 0.55 * glint));
    g.addColorStop(0.7, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(-w / 2 + 4, -h + 4, w - 8, h - 8);
    const r = c.createRadialGradient(-w / 2, -h, 0, -w / 2, -h, 26);
    r.addColorStop(0, withAlpha(env.mood.core, 0.8 * glint));
    r.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = r;
    c.fillRect(-w / 2 - 26, -h - 26, 52, 52);
  }
  c.restore();
}

function paintManchester(f: Frame, b: Beats) {
  const t = f.t;
  const cams = M_CAMS;
  f.backlight({ sunX: 1180, sunY: 470, sunRadius: 520, intensity: 0.55 });
  // L1: the far city of chimneys under a night veil
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, cams, 60);
    bake(f, c, `${ID}/L1/${env.mood.id}`, r, (cc) => {
      const veil = cc.createLinearGradient(0, r.y, 0, 560);
      veil.addColorStop(0, withAlpha(env.mood.fg, 0.72));
      veil.addColorStop(0.6, withAlpha(env.mood.fg, 0.3));
      veil.addColorStop(1, withAlpha(env.mood.fg, 0));
      cc.fillStyle = veil;
      cc.fillRect(r.x, r.y, r.w, 560 - r.y);
      stars(cc, { x: r.x, y: r.y, w: r.w, h: 260 - r.y, count: 40, seed: 1950, twinkle: 0 }, env);
      skyline(cc, { style: 'chicago1940', x0: r.x, x1: r.x + r.w, y: 600, height: 230, seed: 61, lit: 0.12, ground: 300 }, env);
    });
  });
  f.fog({ yCenter: 520, height: 260, alpha: 0.18, drift: 5 });
  // L3: the room, seen only through the window (clip to the aperture as seen in this layer)
  f.layer('L3', (c, env) => {
    const ap = toLayerRect(f, LAYERS.L3, LAYERS.L4, WIN.x0 - 12, WIN.y0 - 12, WIN.x1 + 12, SILL_Y + 6);
    c.save();
    c.beginPath();
    c.rect(ap.x0, ap.y0, ap.x1 - ap.x0, ap.y1 - ap.y0);
    c.clip();
    room(c, env, f, t, b);
    c.restore();
  });
  // the desk lamp inside (behind the glass): a warm practical
  f.practical({ x: DESK.x + 52, y: DESK.y - 77 * DESK.s - 74, kind: 'lamp', seed: 19, intensity: 0.7, radius: 60, layer: 'L3' });
  f.layer('L4', (c, env) => {
    const r = overscan(LAYERS.L4, cams, 60);
    bake(f, c, `${ID}/facade/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)}`, r, (cc) => facade(cc, env, r));
    // glass sheen over the aperture (a pane between us and the room)
    const g = c.createLinearGradient(WIN.x0, WIN.y0, WIN.x1, WIN.y1);
    g.addColorStop(0, withAlpha(env.mood.rim, 0.06));
    g.addColorStop(0.45, withAlpha(env.mood.rim, 0));
    g.addColorStop(0.62, withAlpha(env.mood.rim, 0.07));
    g.addColorStop(1, withAlpha(env.mood.rim, 0));
    c.fillStyle = g;
    const P = new Path2D();
    windowPath(P);
    c.fill(P);
    // the bell gives ONE clear swing on "educate" (on the twos): out to +12°, over to −12° and home in 0.6 s,
    // then a small after-ring that dies away; a rim glint at each extreme
    const tq = tq12(t);
    const dt = tq - (b.educate - 0.04);
    const ph = dt * ((2 * Math.PI) / 0.6);
    const amp = dt <= 0 ? 0 : dt < 0.6 ? BELL_AMP : 0.07 * Math.exp(-(dt - 0.6) * 3);
    const rock = dt > 0 ? amp * Math.sin(ph) : 0;
    // the brass lip flares at the top of each swing (a brief additive glint)
    bell(c, env, rock, dt > 0 ? Math.min(1, (amp / BELL_AMP) * (0.25 + 0.75 * Math.abs(Math.sin(ph)) ** 8) * 1.3) : 0);
    // the slate POPS onto the sill on "child" (full size at once, a paper cut-out set down): it drops 4 px and
    // settles on the twos, with a 0.15 s lamp glint
    const sdt = tq - (b.child - 0.05);
    const sk = sdt >= 0 ? 1 : 0;
    const settle = sdt < 0 ? 0 : sdt < 1 / 12 ? -4 : sdt < 2 / 12 ? 1.2 : sdt < 3 / 12 ? -0.6 : 0;
    const sg = win(t, b.child + 0.1, b.child + 0.17) * (1 - win(t, b.child + 0.25, b.child + 0.4));
    c.save();
    c.translate(0, settle);
    slate(c, env, sk, sg);
    c.restore();
    // the window's warm spill falling on the sill and the brick below it
    c.save();
    c.globalCompositeOperation = 'lighter';
    const sp = c.createLinearGradient(0, SILL_Y, 0, SILL_Y + 190);
    sp.addColorStop(0, withAlpha(env.mood.halo, 0.18));
    sp.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = sp;
    c.beginPath();
    c.moveTo(WIN.x0 - 18, SILL_Y);
    c.lineTo(WIN.x1 + 18, SILL_Y);
    c.lineTo(WIN.x1 + 120, SILL_Y + 190);
    c.lineTo(WIN.x0 - 120, SILL_Y + 190);
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha(env.mood.halo, 0.2);
    c.fillRect(WIN.x0 - 22, SILL_Y + 1.6, WIN.x1 - WIN.x0 + 44, 6);
    c.restore();
  });
  f.rim({ x: -0.3, y: -1 });
  // fog B at railing height (between the façade and the near railing)
  f.fog({ yCenter: 600, height: 170, alpha: 0.16, drift: 7 });
  // L5: iron area railings along the pavement, out of focus; their tops stay in frame through the push (depth)
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 40);
    const Y = 507;
    bake(f, c, `${ID}/L5b/${env.mood.id}/${Math.round(r.x)}`, { x: r.x, y: Y - 10, w: r.w, h: 640 }, (cc) => {
      cc.fillStyle = env.fill('fg');
      cc.fillRect(r.x, Y + 44, r.w, 10);
      cc.fillRect(r.x, Y + 142, r.w, 12);
      cc.fillRect(r.x, Y + 330, r.w, 400);
      for (let x = Math.floor(r.x / 34) * 34; x < r.x + r.w; x += 34) {
        cc.fillRect(x - 3, Y + 22, 6, 480);
        cc.beginPath();
        cc.moveTo(x - 7, Y + 24);
        cc.lineTo(x, Y);
        cc.lineTo(x + 7, Y + 24);
        cc.fill();
      }
    });
  });
}

/** rect in `to` layer coords that covers the rect (x0..x1, y0..y1) of `from` layer, for the current camera */
function toLayerRect(f: Frame, to: LayerSpec, from: LayerSpec, x0: number, y0: number, x1: number, y1: number) {
  const a = toScreen(from, f.cam, x0, y0);
  const z = toScreen(from, f.cam, x1, y1);
  const A = toLayer(to, f.cam, a.x, a.y);
  const Z = toLayer(to, f.cam, z.x, z.y);
  return { x0: A.x, y0: A.y, x1: Z.x, y1: Z.y };
}

// ------------------------------------------------------------------ the near pier (occluder) for the whip
/** a narrow brick pier (≤ half the frame) lifted off black, its lit arris leading; the pan reads past both sides */
const PIER_W = 520;
function pier(f: Frame, x: number) {
  const w = PIER_W + 80;
  f.cached(`${ID}/pier4/${f.mood.id}`, w, 900, (cc) => {
    cc.translate(40, 0);
    const g = cc.createLinearGradient(0, 0, PIER_W, 0);
    g.addColorStop(0, mixLab(f.mood.fg, f.mood.set, 0.85));
    g.addColorStop(0.25, mixLab(f.mood.fg, f.mood.set, 0.72));
    g.addColorStop(1, mixLab(f.mood.fg, f.mood.set, 0.66));
    cc.fillStyle = g;
    cc.fillRect(0, 0, PIER_W, 900);
    // brick courses that read through the blur
    cc.strokeStyle = withAlpha(f.mood.setHaze, 0.35);
    cc.lineWidth = 2;
    for (let y = 10; y < 900; y += 34) {
      cc.beginPath();
      cc.moveTo(0, y);
      cc.lineTo(PIER_W, y);
      cc.stroke();
    }
    // the lit arris on the leading (left) edge, warm from the window
    cc.fillStyle = withAlpha(f.mood.rim, 0.32);
    cc.fillRect(0, 0, 8, 900);
    const sp = cc.createLinearGradient(0, 0, 120, 0);
    sp.addColorStop(0, withAlpha(f.mood.halo, 0.25));
    sp.addColorStop(1, withAlpha(f.mood.halo, 0));
    cc.fillStyle = sp;
    cc.fillRect(0, 0, 120, 900);
  }, { blur: 14 })(f.c, x - 40, -90);
}

/** the study hold: the lamp pools on the slip; the rest of the Wall and the board's edge fall into shadow,
 *  except one stray of lamp light that finds W6's lower corner at the frame's right edge */
function studyLight(f: Frame, b: Beats, cam: Camera3) {
  const t = f.t;
  const k = win(t, b.land - 0.7, b.land + 0.9);
  if (k <= 0) return;
  const c = f.c;
  const ctr = { x: STUDY.wall.x + WALL_SLOTS.W1.x * STUDY.wall.k, y: STUDY.wall.y + WALL_SLOTS.W1.y * STUDY.wall.k };
  const p = toScreen(LAYERS.L4, cam, ctr.x, ctr.y);
  // the board's right edge at screen-left: soft (out of the lamp's focus) and in shadow
  const bx = toScreen(LAYERS.L4, cam, 1160, 0).x;
  if (bx > 0) blurRect(f, 0, 0, Math.min(1280, bx), 720, 2.2, k);
  c.save();
  const lg = c.createLinearGradient(0, 0, Math.max(60, bx + 40), 0);
  lg.addColorStop(0, withAlpha(f.mood.fg, 0.5 * k));
  lg.addColorStop(1, withAlpha(f.mood.fg, 0));
  c.fillStyle = lg;
  c.fillRect(0, 0, Math.max(60, bx + 40), 720);
  // the rest of the Wall drops well into shadow, radially away from the slip (the slip is the one lit plane)
  const R0 = 125 * p.k, R1 = 820;
  const g = c.createRadialGradient(p.x, p.y, R0, p.x, p.y, R1);
  g.addColorStop(0, withAlpha(f.mood.fg, 0));
  g.addColorStop(0.3, withAlpha(f.mood.fg, 0.38 * k));
  g.addColorStop(1, withAlpha(f.mood.fg, 0.68 * k));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  // and a warm pool of lamp light on the slip itself
  c.globalCompositeOperation = 'lighter';
  const w = c.createRadialGradient(p.x, p.y, 10, p.x, p.y, 120 * p.k);
  w.addColorStop(0, withAlpha(f.mood.halo, 0.15 * k));
  w.addColorStop(1, withAlpha(f.mood.halo, 0));
  c.fillStyle = w;
  c.fillRect(p.x - 120 * p.k, p.y - 120 * p.k, 240 * p.k, 240 * p.k);
  // W6: only its upper-left corner catches a stray of the lamp (half-lit), just inside the right edge
  const s6 = WALL_SLOTS.W6;
  const corner = toScreen(LAYERS.L4, cam, STUDY.wall.x + (s6.x - s6.w / 2 + 8) * STUDY.wall.k, STUDY.wall.y + (s6.y - s6.h / 2 + 8) * STUDY.wall.k);
  const r6 = 46 * p.k;
  const g6 = c.createRadialGradient(corner.x, corner.y, 0, corner.x, corner.y, r6);
  g6.addColorStop(0, withAlpha(f.mood.halo, 0.3 * k));
  g6.addColorStop(1, withAlpha(f.mood.halo, 0));
  c.fillStyle = g6;
  c.fillRect(corner.x - r6, corner.y - r6, 2 * r6, 2 * r6);
  c.restore();
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const lineEnd = T.line('L0212').end;
    const b: Beats = {
      alan: T.line('L0212').start,
      turing: T.beat('turing'),
      stranger: T.word('L0212', 'stranger'),
      program: T.word('L0212', 'program'),
      grownUp: T.word('L0212', 'grown-up'),
      but: T.word('L0212', 'but'),
      educate: T.beat('educated'),
      child: T.beat('child'),
      machine: T.beat('pan'),
      lineEnd,
      // one ~1.6 s pan: it is already moving ON "machine", cuts behind the pier mid-move, lands on the Wall
      pan0: T.beat('pan') - 0.1,
      cut: T.beat('pan') + 0.62,
      land: T.beat('pan') + 1.62,
      // the hand is already reaching as the Wall settles: the pin lands with the camera (~9.35 s), and the hand is
      // out by ~9.85 s so the clean slip holds ~3 s
      pin0: T.beat('pan') + 1.62 - 0.45 * 1.15,
      pinDur: 1.15,
      dur: T.duration,
    };
    tl.hold(0, T.duration);
    return { tl, b, dur: T.duration, studyCam: makeStudyCam(b) };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b;
    const study = t >= b.cut;

    if (!study) {
      f.camera(mancCam(t, b));
      paintManchester(f, b);
    } else {
      const cam = scene.studyCam(t);
      f.camera(cam);
      studyRoom(f, { key: ID, cams: S_CAMS, outside: { mood: 'candleAmber', kind: 'city' } });
      const pinPt = wallSlotAt(STUDY.wall, 'W1');
      const u = (tq12(t) - b.pin0) / b.pinDur;
      const entry = handsEntry(cam, 'L4');
      const hp = u > 0 && u < 1 ? hands.act('pin', u, pinPt, { held: 'slip', scale: 0.82, entry }) : null;
      const sz = WALL_SLOTS.W1;
      const k = STUDY.wall.k;
      studyCase(f, {
        shot: ID,
        when: 'start',
        key: ID,
        shelf: false,
        wall: { hide: ['W1', 'W6'], emptyRow: EMPTY_ROW },
        lampLight: true,
        extra: (c, env) => {
          const light = slotLight('W1');
          // W6: the older slip in shadow, one corner just inside the frame's right edge (~15% value): a quiet
          // promise of later forecasts
          {
            const s6 = WALL_SLOTS.W6;
            drawSlip(c, W6_SLIP, { x: STUDY.wall.x + s6.x * k, y: STUDY.wall.y + s6.y * k, k, light: 0.2 }, env);
          }
          const placed = u >= 0.45;
          if (placed) {
            const ctr = { x: STUDY.wall.x + sz.x * k, y: STUDY.wall.y + sz.y * k };
            // the slip settles from the press: a tiny swing about its pin (on the twos), then hangs still
            const dt = tq12(t) - (b.pin0 + 0.45 * b.pinDur);
            const sway = dt > 0 ? 0.035 * Math.exp(-dt * 2.4) * Math.sin(dt * 9) : 0;
            c.save();
            c.translate(pinPt.x, pinPt.y);
            c.rotate(sway);
            c.translate(-pinPt.x, -pinPt.y);
            drawSlip(c, W1_SLIP, { x: ctr.x, y: ctr.y, k, light }, env);
            c.restore();
          }
          if (hp) {
            hands.draw(c, hp, env, {
              heldDraw: (cc, at, _held, e) => drawSlip(cc, W1_SLIP, { x: at.x, y: at.y + (sz.h / 2 - 6) * k, k, light, pin: false }, e),
            });
          }
        },
      });
      studyLight(f, b, cam);
    }

    // ---------------------------------------------------------------- the whip: motion smear at the pan's peak,
    // and a narrow pier crossing the lens (never more than half the frame) to carry the cut
    const blurPx = 4.8 * Math.exp(-(((t - b.cut) / 0.24) ** 2));
    smearX(f, blurPx);
    const p0 = b.cut - 0.36, p1 = b.cut + 0.34;
    if (t > p0 && t < p1) {
      const u = (t - p0) / (p1 - p0);
      const e = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
      pier(f, lerp(1330, -PIER_W - 60, e));
    }

    // ---------------------------------------------------------------- type (screen-locked)
    const tenv = { t, mood: f.mood, seed: 52 };
    placeStamp(f.c, { place: 'Manchester', date: '1950', year: 1950, at: b.alan + 0.15, dur: b.machine - b.alan - 0.1, fade: 0.45 }, tenv);
    // the name card sits above the railing spikes on its own dark plate (contrast lifted)
    const nA = win(t, b.turing - 0.1, b.turing + 0.3) * (1 - win(t, b.turing + 3.1, b.turing + 3.5));
    if (nA > 0) {
      f.c.save();
      f.c.globalAlpha = nA;
      softPlate(f.c, 980, 484, 420, 150, f.mood.ink, 0.62);
      f.c.restore();
    }
    nameCard(f.c, { name: 'Alan Turing', role: 'mathematician', at: b.turing - 0.1, dur: 3.6, x: 880, y: 474 }, tenv);
  },
});
