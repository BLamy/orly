/**
 * ch02-s07 — Dartmouth, summer 1956, dusk (duskRose; a slow tint crossfade in from the study's candleAmber).
 *
 * Exterior: the white colonial hall with its cupola against a rose dusk over the green, elms at the edges,
 * fog low on the grass; the camera rises and pushes toward the lit top-floor windows and DISSOLVES inside.
 * Interior (one long room, left → right): a dictionary on a stand by the left window · the chalkboard with
 * McCarthy · the typed proposal page pinned beside it · the long table with papers, Minsky beside it · the
 * window bay with the small paper LANTERN hanging in it and, on its sill, a paper-cut of SNARC · the door,
 * where Widrow stands at the rim, half in shadow. The lantern is the divider between Minsky and Widrow.
 *
 *   L0215 start   DARTMOUTH · SUMMER 1956; rise to the top-floor windows; dissolve inside
 *   "name"        McCarthy chalks ARTIFICIAL / INTELLIGENCE (the letters appear exactly at his chalk, on the
 *                 twos); the proposal's dateline catches the light; label + name card
 *   "Minsky"      Minsky (facing the lantern, his machine) catches the light; name card
 *   "learning"    the SNARC paper-cut on the sill glows once
 *   "symbols"     Minsky turns his back on the lantern (a profile flip on a hold) and faces the chalkboard; the
 *                 board's symbols and branching rules catch the light; the lantern swings gently, still lit
 *   "suspect"     a one-beat push to the RULES emblem (key over a branching tree) chalked in the board's corner
 *   L0216         the camera trucks right and finds Widrow by the door ("Widrow": rim light, name card)
 *   "fell"        his verbatim words rise as a quote card (dated 2005) and stay through the hold
 *   "good"        he looks up at the swinging lantern; its light catches his browline glasses
 *   "downhill"    the lantern throws a faint misty-hill outline on the wall beside him: the front ridge is the
 *                 kit's real loss curve, and a bead of light takes real gradient-descent steps down it and
 *                 settles in the valley
 *   "Remember"    a soft in-shot iris closes on Widrow and the lantern together (never fully)
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, Pose, PuppetDrawOpts } from '../../../film';
import {
  FONT,
  LAYERS,
  POSES,
  addPose,
  annotation,
  blendPose,
  collegeHall,
  defineShot,
  descentPath,
  lossF,
  mixLab,
  nameCard,
  overscan,
  placeStamp,
  pose,
  quoteCard,
  toLayer,
  toScreen,
  tree,
  fogBank,
  chair,
  createPuppet,
  godRays,
  windowBeam,
  withAlpha,
  withLife,
  PUPPET_NEAR_BLACK,
  ZA,
  softPlate,
} from '../../../film';
import { cast } from '../cast';
import { cardIcon } from '../sets/caseBoard';
import { hash1 } from '../../../film/core/frame';
import { clamp01, compositeSub, lerp, monotone, ordered, sm, subFrame, tq12, win } from '../sets/ch02-s05b-util';

const ID = 'ch02-s07';
/** the dusk's rose (the sky and the window glass; never the lantern) */
const ROSE = '#c4878a';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------ this shot's three silhouettes (distinct outlines)
// McCarthy in his cardigan over a tie (the cast's), chalk in hand; Minsky shorter and stockier in rolled shirtsleeves
// and a loose tie, leaning in; young Widrow tall and slim in a jacket and tie with heavy frames. Widrow's wavy hair
// is trimmed ~15% (hairScale 0.85) and cut short at the nape (a second, short-haired copy below the ear line), so
// at this scale his head reads as a young man's and the collar and tie knot show.
const P_MCC = createPuppet({ ...cast.mccarthy.spec, id: 'mccarthy-s07', build: 'average', height: 326, details: ['vneck', 'buttons', 'tie', 'knitPocket'] });
const P_MIN = createPuppet({ ...cast.minsky.spec, id: 'minsky-s07', wardrobe: 'rolledSleeves', build: 'stocky', height: 298, details: ['placket', 'tie', 'shirtPocket', 'belt'] });
const WID_SPEC = { ...cast.widrow.spec, wardrobe: 'slimSuit', build: 'slight' as const, height: 336, glasses: 'heavy' as const, details: ['lapel', 'tie', 'buttons', 'shirtCuff'] };
const P_WID = createPuppet({ ...WID_SPEC, id: 'widrow-s07', signature: { ...cast.widrow.spec.signature, hairScale: 0.85 } });
const P_WID_NAPE = createPuppet({ ...WID_SPEC, id: 'widrow-s07-nape', hair: 'slicked', signature: { ...cast.widrow.spec.signature } });
/** Widrow's own plane (same depth as L4) drawn after the rim pass: he gets no rim until his reveal */
const WID_PLANE: LayerSpec = { id: 'L4wid', z: 1000, haze: 0.03, blur: 0 };

// ------------------------------------------------------------------ the room (L4 world, rest-screen px)
const FLOOR = 640;
/** McCarthy's rest spot once the name is up: just left of it, so nothing of the name is behind him */
const MCC = { x: 128, facing: 'right' as const };
const MIN = { x: 604 };
/** Widrow ends at x; until "good" he stands `step` px further right, by the door in its shadow. He stands a little
 *  left of the door's old mark (DOOR_MARK), so the wall behind his back is clear for the thrown hill */
const WID = { x: 986, step: 36 };
const DOOR_MARK = 1046;
/** hangs on a long cord from a ceiling hook above the frame (the pivot is in L4 with the lantern, always off the
 *  top edge, so the swing pivots about one fixed point at every camera) */
const LANTERN = { x: 806, top: -40, y: 372 };
const SILL = { x0: 712, x1: 930, y: 476 };
const SNARC = { x: 868, y: SILL.y };
/** the SNARC paper-cut: a squat chassis with a row of valves on top and three knobs on its face */
const SNARC_BOX = { w: 104, h: 30, tubes: 7 };
const SNARC_TUBE_X = (i: number) => SNARC.x - SNARC_BOX.w / 2 + 12 + (i * (SNARC_BOX.w - 24)) / (SNARC_BOX.tubes - 1);
/** chalkboard + proposal on the side wall plane L3 */
/** (hung low enough that McCarthy's chalk reaches its upper half, where the new name goes) */
const BOARD = { x0: 118, x1: 566, y0: 222, y1: 478 };
const PROPOSAL = { x: 590, y: 236, w: 66, h: 92 };
/** the RULES emblem, chalked in the board's lower-right corner (clear of the name and of the logic lines) */
const EMBLEM = { x: 532, y: 440 };
const EMBLEM_SIZE = 62;

/** reference camera for the back-wall layout (the room's main framing) */
const CAM_REF: Camera3 = { x: 640, y: 360, z: 180, lens: 1 };
const L2x = (sx: number) => toLayer(LAYERS.L2, CAM_REF, sx, 0).x;
const sxOf = (x4: number) => toScreen(LAYERS.L4, CAM_REF, x4, 0).x;
/** back-wall openings (L2): the lantern's window, a left window, the door behind Widrow */
const WINDOWS = [
  { cx: L2x(sxOf(LANTERN.x) + 10), w: 236, y0: 92, y1: 520 },
  { cx: L2x(sxOf(-40)), w: 200, y0: 92, y1: 520 },
];
/** the door stands just right of Widrow, leaving a plain stretch of wall between him and it (the hill's wall) */
const DOOR = { cx: L2x(sxOf(DOOR_MARK) + 300), w: 150, y0: 196, y1: 600 };
/** Widrow's own pool of shadow / warm wash (he stands at the rim, by the door) */
const WASH = { cx: L2x(sxOf(WID.x) + 40) };
const WALL_Y1 = 600; // the back wall meets the floor (L2)

// ------------------------------------------------------------------ cameras
/** the exterior's first framing: low on the green, the hall high in frame (the elm trunk and its low canopy close) */
const EXT0: Camera3 = { x: 700, y: 560, z: -140, lens: 1 };
/** the hall's four lit top-floor windows (L2 world): bays 9-12 of the 15-bay front. Each lit pane is the interior's
 *  lantern window (WINDOWS[0], a 236 x 428 opening with its 9-over-9 sash) drawn at PANE_Q scale, so when the push
 *  carries the right-hand pane onto that window the muntins line up and the camera goes through the glass */
const HALL = { x: 640, w: 860, bays: 15 };
const BAY_W = HALL.w / HALL.bays;
const WIN_OPEN = { w: 236, y0: 92, y1: 520 };
const PANE_H = 43.5;
const PANE_Q = PANE_H / (WIN_OPEN.y1 - WIN_OPEN.y0);
const PANE_Y0 = 336;
const LIT_BAYS = [9, 10, 11, 12];
const paneCx = (bay: number) => HALL.x - HALL.w / 2 + BAY_W * (bay + 0.5);
const GROUP_C = { x: (paneCx(9) + paneCx(12)) / 2, y: PANE_Y0 + PANE_H / 2 };
const TARGET_C = { x: paneCx(12), y: PANE_Y0 + PANE_H / 2 };
const LIT_WIN = GROUP_C;

type C3 = { t: number; x: number; y: number; z: number };

interface Beats {
  l1: number;
  name: number;
  artificial: number;
  intelligence: number;
  l1End: number;
  minsky: number;
  learning: number;
  symbols: number;
  rules: number;
  suspect: number;
  suspectEnd: number;
  l3: number;
  widrow: number;
  fell: number;
  good: number;
  downhill: number;
  wrongEnd: number;
  remember: number;
  sliding: number;
  wrong: number;
  rise: number;
  match: number;
  dissolve0: number;
  dissolve1: number;
}

// ------------------------------------------------------------------ McCarthy's chalking (the letters sit at his chalk)
// The name is chalked LARGE across the board's upper half, two lines. A line ~330 px long is more than an arm can
// sweep, so McCarthy writes as people do at a board: his arm sweeps from up-and-back to out-front while he
// sidesteps along under it (little steps on the twos), then steps back to the start of the next line. His chalk
// (the hand, solved by IK at build time) is the reveal edge of the letters.
interface Sweep {
  /** hand height (L4 world y) while writing this line */
  hy: number;
  /** hand x relative to his body at the start / end of the sweep */
  dx0: number;
  dx1: number;
  /** body x at the start / end (the sidestep) */
  bx0: number;
  bx1: number;
  torso0: number;
  torso1: number;
}
const SWEEPS: Sweep[] = [
  { hy: 274, dx0: -36, dx1: 100, bx0: 200, bx1: 380, torso0: -12, torso1: 9 },
  { hy: 324, dx0: -40, dx1: 138, bx0: 196, bx1: 356, torso0: -10, torso1: 12 },
];
const WORDS = ['ARTIFICIAL', 'INTELLIGENCE'];
const SWEEP_N = 24;
/** per sweep, SWEEP_N + 1 solved arm angles (shoulderF, elbowF) along e = 0..1 */
let ARM_TABLE: [number, number][][] | null = null;
function chalkBase(sw: Sweep, e: number, sh: number, el: number): Pose {
  return pose(
    { hipF: 8, kneeF: -4, hipB: -6, kneeB: -1, torso: lerp(sw.torso0, sw.torso1, e), neck: 2, head: -12, shoulderF: sh, elbowF: el, wristF: 12, shoulderB: -6, elbowB: 20 },
    { handF: 'grip' },
  );
}
function solveArms(): [number, number][][] {
  if (ARM_TABLE) return ARM_TABLE;
  ARM_TABLE = SWEEPS.map((sw) => {
    const out: [number, number][] = [];
    let prev: [number, number] | null = null;
    for (let i = 0; i <= SWEEP_N; i++) {
      const e = i / SWEEP_N;
      const tx = lerp(sw.dx0, sw.dx1, e), ty = sw.hy;
      const cost = (sh: number, el: number) => {
        const a = P_MCC.anchor({ x: 0, y: FLOOR, facing: 'right', pose: chalkBase(sw, e, sh, el) }, 'handF');
        const d = (a.x + 4 - tx) ** 2 + (a.y - 4 - ty) ** 2;
        return d + (prev ? 0.03 * ((sh - prev[0]) ** 2 + (el - prev[1]) ** 2) : 0);
      };
      let best: [number, number] = prev ?? [140, 40];
      let bc = Infinity;
      for (let sh = 40; sh <= 196; sh += 6)
        for (let el = 0; el <= 128; el += 8) {
          const c = cost(sh, el);
          if (c < bc) {
            bc = c;
            best = [sh, el];
          }
        }
      const [s0, e0] = best;
      for (let sh = s0 - 6; sh <= s0 + 6; sh += 1.5)
        for (let el = Math.max(0, e0 - 8); el <= e0 + 8; el += 2) {
          const c = cost(sh, el);
          if (c < bc) {
            bc = c;
            best = [sh, el];
          }
        }
      out.push(best);
      prev = best;
    }
    return out;
  });
  return ARM_TABLE;
}
function chalkPose(i: number, e: number): Pose {
  const tab = solveArms()[i];
  const u = clamp01(e) * SWEEP_N;
  const k = Math.min(SWEEP_N - 1, Math.floor(u));
  const f = u - k;
  return chalkBase(SWEEPS[i], clamp01(e), lerp(tab[k][0], tab[k + 1][0], f), lerp(tab[k][1], tab[k + 1][1], f));
}
/** little sidesteps on the twos: a foot lifts every ~44 px of travel, alternating */
function stepping(p: Pose, dist: number): Pose {
  const ph = Math.abs(dist) / 44;
  const k = Math.floor(ph), fr = ph - k;
  const bump = Math.sin(Math.PI * fr);
  if (bump < 0.02 || Math.abs(dist) < 1) return p;
  return k % 2 === 0 ? addPose(p, { hipF: 14 * bump, kneeF: -18 * bump }) : addPose(p, { hipB: -12 * bump, kneeB: -16 * bump });
}
const MCC_LOOK: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -3, neck: 4, head: -8, shoulderF: 22, elbowF: 64, wristF: -10, shoulderB: -8, elbowB: 14 }, { handF: 'grip' });
const MCC_REST: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -3, neck: 5, head: -9, shoulderF: -4, elbowF: 26, wristF: 4, shoulderB: -10, elbowB: 18 }, { handF: 'grip' });
const MIN_FACE: Pose = addPose(POSES.listen, { torso: 7, neck: 10, head: 10, shoulderB: -10, elbowB: 30 });
const MIN_TURNED: Pose = pose({ hipF: 6, kneeF: -3, hipB: -5, kneeB: -1, torso: -3, neck: 6, head: -6, shoulderF: -20, elbowF: 46, wristF: 8, shoulderB: -22, elbowB: 52 }, { handF: 'fist', handB: 'fist' });
const MIN_RULE: Pose = pose({ hipF: 8, kneeF: -4, hipB: -5, kneeB: -1, torso: 2, neck: 2, head: -4, shoulderF: 100, elbowF: 6, wristF: -6, shoulderB: -16, elbowB: 40 }, { handF: 'point', handB: 'fist' });
const WID_STAND: Pose = pose({ hipF: 4, kneeF: -3, hipB: -4, kneeB: -1, torso: -1, neck: 8, head: -2, shoulderF: 2, elbowF: 18, wristF: 6, shoulderB: -6, elbowB: 16 });
const WID_LOOK: Pose = pose({ hipF: 4, kneeF: -3, hipB: -4, kneeB: -1, torso: -2, neck: 4, head: 6, shoulderF: 4, elbowF: 22, wristF: 6, shoulderB: -6, elbowB: 16 });

// ------------------------------------------------------------------ painters
/** head-local → world mapping for a puppet, from its 'head' (0, -0.55) and 'eye' (0.33, -0.5) anchors (head units) */
function headFrame(head: { x: number; y: number }, eye: { x: number; y: number }, facing: 'left' | 'right') {
  const sg = facing === 'left' ? -1 : 1;
  const ex = (eye.x - head.x) * sg, ey = eye.y - head.y;
  const hu = Math.hypot(ex, ey) / Math.hypot(0.33, 0.05);
  const th = Math.atan2(ey, ex) - Math.atan2(0.05, 0.33);
  const co = Math.cos(th), si = Math.sin(th);
  return (lx: number, ly: number) => {
    const dx = lx * hu, dy = (ly + 0.55) * hu;
    return { x: head.x + sg * (co * dx - si * dy), y: head.y + si * dx + co * dy };
  };
}

const bake = (f: Frame, c: C, key: string, r: { x: number; y: number; w: number; h: number }, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
const rk = (r: { x: number; y: number; w: number; h: number }) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

/** sash window bars (12 over 12) inside an opening */
function sashBars(cc: C, x0: number, w: number, y0: number, y1: number, ink: string) {
  cc.fillStyle = ink;
  const fr = 8;
  cc.fillRect(x0 - fr, y0 - fr, w + 2 * fr, fr);
  cc.fillRect(x0 - fr, y0, fr, y1 - y0);
  cc.fillRect(x0 + w, y0, fr, y1 - y0);
  for (const k of [1, 2]) cc.fillRect(x0 + (w * k) / 3 - 2, y0, 4, y1 - y0);
  const mid = (y0 + y1) / 2;
  cc.fillRect(x0, mid - 4, w, 8);
  for (const yy of [y0 + (mid - y0) / 3, y0 + ((mid - y0) * 2) / 3, mid + (y1 - mid) / 3, mid + ((y1 - mid) * 2) / 3]) cc.fillRect(x0, yy - 1.8, w, 3.6);
}

/** a lathe-turned post or spindle (vertical, centre x, from y0 to y1, half-width hw): beads, a vase and a ring */
function turned(cc: C, x: number, y0: number, y1: number, hw: number) {
  const L = y1 - y0;
  const prof: [number, number][] = [[0, 1.5], [0.04, 0.9], [0.08, 1.4], [0.12, 0.8], [0.3, 1.0], [0.42, 1.6], [0.5, 1.1], [0.56, 0.75], [0.62, 1.25], [0.66, 0.8], [0.9, 1.0], [0.96, 1.3], [1, 1.1]];
  cc.beginPath();
  prof.forEach(([u, w], i) => (i === 0 ? cc.moveTo(x - w * hw, y0 + u * L) : cc.lineTo(x - w * hw, y0 + u * L)));
  for (let i = prof.length - 1; i >= 0; i--) cc.lineTo(x + prof[i][1] * hw, y0 + prof[i][0] * L);
  cc.closePath();
  cc.fill();
}

function interiorL1(f: Frame, cams: Camera3[]) {
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, cams, 80);
    bake(f, c, `${ID}/inL1/${env.mood.id}/${rk(r)}`, r, (cc) => {
      // the green at dusk under the elms, seen through the windows
      cc.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.35);
      cc.fillRect(r.x, 560, r.w, r.y + r.h - 560);
      for (let i = 0; i < 9; i++) tree(cc, { x: r.x + 60 + i * (r.w / 8.5), y: 566, h: 300 + (i % 3) * 60, kind: 'elm', seed: 40 + i, leaves: 0.9, role: i % 2 ? 'set' : 'ink' }, env);
    });
  });
}

function backWall(f: Frame, cams: Camera3[]) {
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, cams, 60);
    bake(f, c, `${ID}/L2/${env.mood.id}/${rk(r)}`, r, (cc) => {
      const P = new Path2D();
      P.rect(r.x, r.y, r.w, WALL_Y1 - r.y);
      for (const w of WINDOWS) P.rect(w.cx - w.w / 2, w.y0, w.w, w.y1 - w.y0);
      P.rect(DOOR.cx - DOOR.w / 2, DOOR.y0, DOOR.w, DOOR.y1 - DOOR.y0);
      cc.fillStyle = env.fill('set');
      cc.fill(P, 'evenodd');
      cc.save();
      cc.clip(P, 'evenodd');
      // colonial panelling, cut as thin evenodd SLOTS (the reference's panel rectangles): a dark slot ring for each
      // raised panel with a hairline of light along its upper inner edge; tall panels between the openings above the
      // dado, low ones in the wainscot below it
      const clear = (x0: number, x1: number) =>
        WINDOWS.every((w) => x1 < w.cx - w.w / 2 - 22 || x0 > w.cx + w.w / 2 + 22) && (x1 < DOOR.cx - DOOR.w / 2 - 24 || x0 > DOOR.cx + DOOR.w / 2 + 24);
      const slotPanel = (x: number, y: number, w: number, h: number) => {
        const S = new Path2D();
        S.rect(x, y, w, h);
        S.rect(x + 3, y + 3, w - 6, h - 6);
        cc.fillStyle = withAlpha(env.mood.fg, 0.5);
        cc.fill(S, 'evenodd');
        cc.fillStyle = withAlpha(env.mood.rim, 0.11);
        cc.fillRect(x + 3, y + 3, w - 6, 1.2);
        cc.fillRect(x + 3, y + 3, 1.2, h - 6);
        // the raised field inside, a whisker lighter
        cc.fillStyle = withAlpha(env.mood.rim, 0.025);
        cc.fillRect(x + 12, y + 12, w - 24, h - 24);
        const I = new Path2D();
        I.rect(x + 12, y + 12, w - 24, h - 24);
        I.rect(x + 14, y + 14, w - 28, h - 28);
        cc.fillStyle = withAlpha(env.mood.fg, 0.3);
        cc.fill(I, 'evenodd');
      };
      for (let x = Math.floor(r.x / 130) * 130; x < r.x + r.w; x += 130) {
        slotPanel(x + 12, 478, 106, 106);
        if (clear(x + 12, x + 118)) slotPanel(x + 14, 148, 102, 288);
      }
      // dado rail: a lit top edge over a dark under-cut
      cc.fillStyle = withAlpha(env.mood.fg, 0.45);
      cc.fillRect(r.x, 458, r.w, 8);
      cc.fillStyle = withAlpha(env.mood.rim, 0.16);
      cc.fillRect(r.x, 457, r.w, 1.4);
      cc.fillStyle = withAlpha(env.mood.fg, 0.55);
      cc.fillRect(r.x, 466, r.w, 2.2);
      const top = cc.createLinearGradient(0, r.y, 0, 200);
      top.addColorStop(0, withAlpha(env.mood.fg, 0.6));
      top.addColorStop(1, withAlpha(env.mood.fg, 0));
      cc.fillStyle = top;
      cc.fillRect(r.x, r.y, r.w, 200 - r.y);
      // the cornice along the top of the wall: a stepped moulding with a dentil course and a lit lip
      cc.fillStyle = env.fill('ink');
      cc.fillRect(r.x, r.y, r.w, 38 - r.y);
      cc.fillRect(r.x, 38, r.w, 10);
      cc.fillStyle = withAlpha(env.mood.rim, 0.2);
      cc.fillRect(r.x, 48, r.w, 1.4);
      cc.fillStyle = env.fill('ink');
      for (let x = Math.floor(r.x / 14) * 14; x < r.x + r.w; x += 14) cc.fillRect(x, 50, 8, 9);
      cc.fillRect(r.x, 59, r.w, 4);
      cc.fillStyle = withAlpha(env.mood.rim, 0.12);
      cc.fillRect(r.x, 63, r.w, 1);
      cc.fillStyle = withAlpha(env.mood.fg, 0.4);
      cc.fillRect(r.x, 64, r.w, 6);
      cc.restore();
      for (const w of WINDOWS) sashBars(cc, w.cx - w.w / 2, w.w, w.y0, w.y1, env.fill('ink'));
      // window seats / sills (lit edge)
      for (const w of WINDOWS) {
        cc.fillStyle = env.fill('ink');
        cc.fillRect(w.cx - w.w / 2 - 16, w.y1, w.w + 32, 10);
        cc.fillStyle = withAlpha(env.mood.rim, 0.3);
        cc.fillRect(w.cx - w.w / 2 - 16, w.y1, w.w + 32, 1.2);
      }
      // the door: architrave and an open leaf; a dim corridor beyond (the opening shows L1 haze)
      cc.fillStyle = env.fill('ink');
      cc.fillRect(DOOR.cx - DOOR.w / 2 - 12, DOOR.y0 - 14, DOOR.w + 24, 14);
      cc.fillRect(DOOR.cx - DOOR.w / 2 - 12, DOOR.y0, 12, DOOR.y1 - DOOR.y0);
      cc.fillRect(DOOR.cx + DOOR.w / 2, DOOR.y0, 12, DOOR.y1 - DOOR.y0);
      cc.beginPath();
      cc.moveTo(DOOR.cx + DOOR.w / 2, DOOR.y0);
      cc.lineTo(DOOR.cx + DOOR.w / 2 - 34, DOOR.y0 + 18);
      cc.lineTo(DOOR.cx + DOOR.w / 2 - 34, DOOR.y1 + 10);
      cc.lineTo(DOOR.cx + DOOR.w / 2, DOOR.y1);
      cc.fill();
      // a dim corridor beyond the door (not the outdoors): a wall in half-light, a far doorframe
      cc.fillStyle = mixLab(env.mood.setHaze, env.mood.set, 0.25);
      cc.fillRect(DOOR.cx - DOOR.w / 2, DOOR.y0, DOOR.w, DOOR.y1 - DOOR.y0);
      const cg = cc.createLinearGradient(DOOR.cx - DOOR.w / 2, 0, DOOR.cx + DOOR.w / 2, 0);
      cg.addColorStop(0, withAlpha(env.mood.halo, 0.22));
      cg.addColorStop(1, withAlpha(env.mood.fg, 0.25));
      cc.fillStyle = cg;
      cc.fillRect(DOOR.cx - DOOR.w / 2, DOOR.y0, DOOR.w, DOOR.y1 - DOOR.y0);
      cc.fillStyle = withAlpha(env.mood.fg, 0.5);
      cc.fillRect(DOOR.cx - 20, DOOR.y0 + 60, 6, DOOR.y1 - DOOR.y0 - 60);
      // floor beyond the wall line
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.4);
      cc.fillRect(r.x, WALL_Y1, r.w, r.y + r.h - WALL_Y1);
    });
  });
}

/** the side-wall plane (L3): chalkboard, proposal page, dictionary stand, the long table */
function midground(f: Frame, cams: Camera3[], t: number, b: Beats, chalk: ChalkLayout) {
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, cams, 40);
    bake(f, c, `${ID}/L3/${env.mood.id}/${rk(r)}`, r, (cc) => {
      // floorboards
      const g = cc.createLinearGradient(0, 560, 0, r.y + r.h);
      g.addColorStop(0, mixLab(env.fill('set'), env.mood.haze, 0.2));
      g.addColorStop(1, mixLab(env.fill('set'), env.mood.fg, 0.6));
      cc.fillStyle = g;
      cc.fillRect(r.x, 560, r.w, r.y + r.h - 560);
      cc.strokeStyle = withAlpha(env.mood.fg, 0.35);
      for (let i = -20; i <= 30; i++) {
        cc.beginPath();
        cc.moveTo(640 + i * 50, 560);
        cc.lineTo(640 + i * 95, r.y + r.h);
        cc.stroke();
      }
      // chalkboard: frame + slate (lifted by the haze so the ink figures read against it)
      cc.fillStyle = env.fill('ink');
      cc.fillRect(BOARD.x0 - 9, BOARD.y0 - 9, BOARD.x1 - BOARD.x0 + 18, BOARD.y1 - BOARD.y0 + 18);
      const sl = cc.createLinearGradient(BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y1);
      sl.addColorStop(0, mixLab(env.mood.setHaze, env.mood.set, 0.35));
      sl.addColorStop(1, mixLab(env.mood.setHaze, env.mood.set, 0.15));
      cc.fillStyle = sl;
      cc.fillRect(BOARD.x0, BOARD.y0, BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0);
      // old erasures: chalk smudges
      for (let i = 0; i < 7; i++) {
        cc.fillStyle = withAlpha(env.mood.rim, 0.035);
        cc.beginPath();
        cc.ellipse(BOARD.x0 + 50 + i * 62, BOARD.y0 + 150 + (i % 3) * 30, 60, 22, -0.2, 0, Math.PI * 2);
        cc.fill();
      }
      cc.fillRect(BOARD.x0 - 12, BOARD.y1 + 6, BOARD.x1 - BOARD.x0 + 24, 7); // tray
      // the typed proposal page (its numbered topics too small to read)
      cc.fillStyle = mixLab(env.mood.halo, env.mood.setHaze, 0.45);
      cc.fillRect(PROPOSAL.x, PROPOSAL.y, PROPOSAL.w, PROPOSAL.h);
      cc.fillStyle = withAlpha(env.mood.ink, 0.45);
      for (let i = 0; i < 13; i++) cc.fillRect(PROPOSAL.x + 7 + (i % 4 === 0 ? 0 : 5), PROPOSAL.y + 22 + i * 5.2, PROPOSAL.w - 16 - ((i * 7) % 13), 1.3);
      cc.fillRect(PROPOSAL.x + 14, PROPOSAL.y + 9, PROPOSAL.w - 28, 2.2); // the heading
      // dictionary on a stand (left, by the window)
      cc.fillStyle = env.fill('ink');
      cc.fillRect(32, 476, 8, 84);
      cc.fillRect(14, 556, 44, 6);
      cc.beginPath();
      cc.moveTo(4, 476);
      cc.lineTo(72, 462);
      cc.lineTo(74, 470);
      cc.lineTo(6, 484);
      cc.fill();
      cc.beginPath();
      cc.moveTo(6, 470);
      cc.quadraticCurveTo(22, 456, 39, 462);
      cc.quadraticCurveTo(56, 450, 72, 456);
      cc.lineTo(72, 462);
      cc.lineTo(6, 476);
      cc.fill();
      // the long table with papers (behind Minsky)
      cc.fillRect(530, 510, 400, 12);
      for (const x of [548, 900]) cc.fillRect(x, 520, 9, 46);
      cc.fillRect(548, 540, 361, 5);
      cc.fillStyle = mixLab(env.mood.halo, env.mood.setHaze, 0.5);
      for (const [x, w, a] of [[566, 46, -0.05], [640, 38, 0.08], [720, 52, -0.02], [812, 40, 0.1]] as const) {
        cc.save();
        cc.translate(x, 509);
        cc.rotate(a * 0.2);
        cc.fillRect(0, -2.2, w, 2.2);
        cc.restore();
      }
      // chairs at the table
      cc.fillStyle = env.fill('ink');
      for (const x of [700, 820]) {
        // a Windsor-ish side chair: a turned back post with a finial, a crest rail, three turned spindles to the seat
        turned(cc, x + 2.5, 462, 562, 2.6);
        cc.fillRect(x - 26, 466, 31, 4); // crest rail (toward the camera's left, the chair seen three-quarter)
        for (let k = 0; k < 3; k++) turned(cc, x - 20 + k * 8, 470, 528, 1.3);
        cc.fillRect(x - 26, 528, 62, 5);
        turned(cc, x + 33.5, 530, 562, 2.4);
        turned(cc, x - 23, 530, 562, 2.2);
      }
    });
    // the chalk: symbols and branching rules (they catch the light on "symbols"), the RULES emblem, the new name
    // (once the camera has found Widrow the rules sink back to texture: dimmer than the half-legible middle)
    // (the formal symbols stay a step DIMMER than the new name: it is the headline of the line)
    const lit = 0.3 + 0.36 * win(t, b.symbols - 0.2, b.symbols + 0.8);
    // as the camera trucks on to Widrow the board leaves frame left: its chalk sinks to a ghost first, so no
    // half-cropped words ride the frame edge beside the quote card
    const gone = 1 - 0.95 * win(t, b.l3 + 0.5, b.widrow + 0.5);
    const glance = win(t, b.suspect - 0.3, b.suspect + 0.2) * (1 - win(t, b.suspect + 1.15, b.suspect + 1.75));
    if (glance > 0) {
      // the glance's iris-highlight: the slate around the emblem lifts ~15%
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(EMBLEM.x, EMBLEM.y, 6, EMBLEM.x, EMBLEM.y, 120);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.2 * glance));
      g.addColorStop(0.55, withAlpha(env.mood.halo, 0.09 * glance));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.beginPath();
      c.rect(BOARD.x0, BOARD.y0, BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0);
      c.clip();
      c.fillRect(EMBLEM.x - 120, EMBLEM.y - 120, 240, 240);
      c.restore();
    }
    c.save();
    c.globalAlpha *= gone;
    chalkWork(c, env, lit, glance);
    chalkName(f, c, env, t, chalk);
    c.restore();
    // the proposal's dateline catches the light on "name"
    const dl = win(t, b.name - 0.1, b.name + 0.5) * (1 - 0.55 * win(t, b.minsky, b.minsky + 1.5));
    if (dl > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(env.mood.core, 0.55 * dl);
      c.fillRect(PROPOSAL.x + 8, PROPOSAL.y + 15, PROPOSAL.w - 16, 2.4);
      const g = c.createRadialGradient(PROPOSAL.x + PROPOSAL.w / 2, PROPOSAL.y + 16, 2, PROPOSAL.x + PROPOSAL.w / 2, PROPOSAL.y + 16, 46);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.35 * dl));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(PROPOSAL.x - 40, PROPOSAL.y - 30, PROPOSAL.w + 80, 92);
      c.restore();
    }
  });
}

/** symbols and branching rules in chalk (static layout), the RULES emblem in the lower-right corner */
function chalkWork(c: C, env: PaintEnv, lit: number, emblem: number) {
  const chalk = (a: number) => withAlpha(chalkInk(env), a);
  c.save();
  c.strokeStyle = chalk(0.5 * lit);
  c.fillStyle = chalk(0.55 * lit);
  c.lineWidth = 1.6;
  c.lineCap = 'round';
  // a branching rule tree: IF … → THEN …
  const nodes: [number, number][] = [[218, 372], [172, 408], [264, 408], [148, 446], [194, 446], [244, 446], [288, 446]];
  const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
  c.beginPath();
  for (const [a, bb] of edges) {
    c.moveTo(nodes[a][0], nodes[a][1] + 6);
    c.lineTo(nodes[bb][0], nodes[bb][1] - 6);
  }
  c.stroke();
  for (const [x, y] of nodes) {
    c.beginPath();
    c.arc(x, y, 4, 0, Math.PI * 2);
    c.stroke();
  }
  // the rules themselves: chalked large enough to READ while the narration is about them ("symbols and rules",
  // where the camera frames the whole board: ~23 px cap at 1080p), dim texture again once the camera moves on
  c.font = `400 23px ${FONT.fell}`;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText('IF  A ∧ B  →  C', 316, 378);
  c.fillText('∀x  P(x) → Q(x)', 316, 408);
  c.fillText('¬Q  ∴  ¬P', 328, 438);
  c.restore();
  // the RULES emblem: a key over a branching tree (the Case Board's S1), chalked in the lower-right corner
  const ea = 0.3 + 0.7 * emblem;
  c.save();
  if (emblem > 0) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(EMBLEM.x, EMBLEM.y, 2, EMBLEM.x, EMBLEM.y, 60);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.32 * emblem));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(EMBLEM.x - 64, EMBLEM.y - 64, 128, 128);
    c.globalCompositeOperation = 'source-over';
  }
  c.globalAlpha *= Math.min(1, ea);
  cardIcon(c, 'key-tree', EMBLEM.x, EMBLEM.y, EMBLEM_SIZE, env, chalkInk(env));
  c.restore();
}

interface ChalkLayout {
  /** per line: L3-space start x, end x, baseline y, font size; and the write window [t0, t1] */
  lines: { x0: number; x1: number; y: number; size: number; t0: number; t1: number }[];
}

/** chalk is WHITE (not the lantern's amber): a pale grey-white touched by the room's light */
const chalkInk = (env: PaintEnv) => mixLab('#ebe7de', env.mood.rim, 0.22);

/** one chalked word, baked: a hand-lettered chalk stroke (IM Fell, as the board's formulas), each letter at its own
 *  slant and baseline, laid in three dry passes, then broken by the slate's grain (short skips where it missed) */
function chalkWord(cc: C, env: PaintEnv, word: string, w: number, size: number, salt: number) {
  const ink = chalkInk(env);
  cc.save();
  cc.translate(10, size * 1.3);
  cc.rotate(-0.026);
  cc.font = `400 ${size}px ${FONT.fell}`;
  cc.textBaseline = 'alphabetic';
  cc.textAlign = 'left';
  // fit by letter SIZE, not by squashing (chalk letters keep their own proportions), a little extra tracking
  const nat0 = cc.measureText(word).width + (word.length - 1) * size * 0.08;
  const fs = nat0 > w ? (size * w) / nat0 : size;
  cc.font = `400 ${fs}px ${FONT.fell}`;
  const track = fs * 0.08;
  const natural = cc.measureText(word).width + (word.length - 1) * track;
  const sx = w / natural;
  let x = 0;
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const cw = (cc.measureText(ch).width + track) * sx;
    const wob = Math.sin(i * 1.9 + salt) * fs * 0.045 + hash1(i, salt) * fs * 0.035;
    cc.save();
    cc.translate(x + cw / 2 - (track * sx) / 2, wob);
    cc.rotate(hash1(i + 40, salt) * 0.05);
    cc.scale(1 + hash1(i + 60, salt) * 0.04, 1 + hash1(i + 80, salt) * 0.05);
    const hw = -cc.measureText(ch).width / 2;
    // two dry passes: the body, and a slightly offset second touch where the hand went over it
    // (the new name is chalked hard: brighter than the formal symbols below it)
    cc.fillStyle = withAlpha(ink, 0.94);
    cc.fillText(ch, hw, 0);
    cc.fillStyle = withAlpha(ink, 0.34);
    cc.fillText(ch, hw + 1.1, 0.6);
    cc.restore();
    x += cw;
  }
  // the grain: fine horizontal skips where the chalk missed the slate's tooth (broken, not eroded)
  cc.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 380; i++) {
    const gx = (hash1(i, salt + 7) * 0.5 + 0.5) * w;
    const gy = -fs * (hash1(i, salt + 9) * 0.5 + 0.5) * 0.95;
    cc.fillStyle = `rgba(0,0,0,${0.3 + 0.35 * (hash1(i, salt + 11) * 0.5 + 0.5)})`;
    cc.fillRect(gx, gy, 1.5 + 4 * (hash1(i, salt + 13) * 0.5 + 0.5), 0.7);
  }
  cc.restore();
}

/** ARTIFICIAL / INTELLIGENCE, revealed up to the chalk (the hand's own L3 position) */
function chalkName(f: Frame, c: C, env: PaintEnv, t: number, L: ChalkLayout) {
  const tq = tq12(t);
  // draw through the layer's raw context (not its tracking proxy): the frame's cached-bitmap shortcut for blurred
  // layers would otherwise skip this layer's clip (the reveal) and alpha (the fade-out)
  const raw = c.canvas.getContext('2d')!;
  L.lines.forEach((ln, i) => {
    const u = clamp01((tq - ln.t0) / (ln.t1 - ln.t0));
    if (u <= 0) return;
    const edge = ln.x0 + (ln.x1 - ln.x0) * u;
    const w = ln.x1 - ln.x0;
    const bx = ln.x0 - 10, by = ln.y - ln.size * 1.3;
    c.save();
    c.beginPath();
    c.rect(bx, by - 4, edge - bx, ln.size * 1.9 + 8);
    c.clip();
    f.cached(`${ID}/chalk4/${i}/${env.mood.id}/${Math.round(w)}/${Math.round(ln.size)}`, Math.ceil(w + 24), Math.ceil(ln.size * 1.9), (cc) => chalkWord(cc, env, WORDS[i], w, ln.size, 17 + i * 31))(raw, bx, by);
    c.restore();
  });
}

/** the small paper lantern (a wick inside, ribbed paper), swinging from its cord */
function lantern(c: C, env: PaintEnv, ang: number) {
  c.save();
  c.translate(LANTERN.x, LANTERN.top);
  c.rotate(ang);
  const L = LANTERN.y - LANTERN.top;
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(0, -60);
  c.lineTo(0, L - 36);
  c.stroke();
  // the cord's hook: a small wire loop above the cap
  c.lineWidth = 1.3;
  c.beginPath();
  c.ellipse(0, L - 36 + 2, 2.4, 3.2, 0, 0, Math.PI * 2);
  c.stroke();
  c.translate(0, L);
  // paper body (lit from within: halo paper with ink ribs), cap and base in ink
  const g = c.createRadialGradient(0, 2, 2, 0, 0, 30);
  g.addColorStop(0, mixLab(env.mood.core, env.mood.halo, 0.2));
  g.addColorStop(1, mixLab(env.mood.halo, env.mood.setHaze, 0.35));
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, 0, 20, 26, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(env.mood.ink, 0.55);
  c.lineWidth = 1.2;
  for (const rx of [7, 14]) {
    c.beginPath();
    c.ellipse(0, 0, rx, 25.5, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.fillStyle = env.fill('ink');
  c.fillRect(-9, -31, 18, 6);
  c.fillRect(-8, 25, 16, 5);
  c.fillRect(-1.5, -34, 3, 4);
  c.restore();
}
function lanternBody(ang: number) {
  const L = LANTERN.y - LANTERN.top;
  return { x: LANTERN.x - Math.sin(ang) * L, y: LANTERN.top + Math.cos(ang) * L };
}

/** the faint misty-hill outline thrown on the wall: the kit's real loss curve, a bead taking real GD steps */
/** the slice of the landscape: the WHOLE valley (global minimum x ≈ 1.96 near the middle), both slopes rising */
/** (from just past the left crest at x ≈ -1.8, so the bead starts at the TOP of the left slope and runs down into
 *  the valley at 1.96, with the far slope rising beyond it) */
const HILL_X = [-2.4, 5.0] as const;
/** real gradient-descent iterates from the left slope's top (lr 0.8): -1.5, -1.26, -0.95, -0.58, -0.15, 0.33, … 1.92 */
const DESCENT = descentPath(0.8, -1.5, 40);
/** the iterate (fractional) where the bead is halfway down (on "downhill"), and where it has settled (on "wrong") */
const K_MID = (() => {
  const mid = (DESCENT[0] + 1.96) / 2;
  for (let k = 0; k < DESCENT.length - 1; k++) if (DESCENT[k + 1] >= mid) return k + (mid - DESCENT[k]) / (DESCENT[k + 1] - DESCENT[k]);
  return 5;
})();
const K_SETTLE = 11;
const GHOSTS = [2, 4, 6, 8];
function hillProjection(c: C, env: PaintEnv, rect: { x: number; y: number; w: number; h: number }, a: number, step: number, sway: number, beadA = 1) {
  if (a <= 0) return;
  const X = (x: number) => rect.x + ((x - HILL_X[0]) / (HILL_X[1] - HILL_X[0])) * rect.w;
  const fmin = 0.05, fmax = Math.max(lossF(HILL_X[0]), lossF(HILL_X[1])) + 0.1;
  const Y = (x: number) => rect.y + rect.h - ((lossF(x) - fmin) / (fmax - fmin)) * rect.h * 0.8;
  c.save();
  // the projection rides with the lantern: as it swings, the thrown landscape slides with it
  c.translate(sway, 0);
  // contained: nothing of the projection leaves its patch of wall (soft at every edge)
  c.beginPath();
  c.rect(rect.x - 30, rect.y - rect.h * 0.5, rect.w + 60, rect.h * 1.6);
  c.clip();
  c.globalCompositeOperation = 'lighter';
  // the lantern's soft oval of light on the wall, the landscape seen inside it
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h * 0.6;
  c.save();
  c.translate(cx, cy);
  c.scale(1, 0.62);
  const glow = c.createRadialGradient(0, 0, 10, 0, 0, rect.w * 0.56);
  glow.addColorStop(0, withAlpha(env.mood.halo, 0.16 * a));
  glow.addColorStop(0.7, withAlpha(env.mood.halo, 0.07 * a));
  glow.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = glow;
  c.fillRect(-rect.w, -rect.w, rect.w * 2, rect.w * 2);
  c.restore();
  const N = 60;
  const xs = Array.from({ length: N + 1 }, (_, i) => HILL_X[0] + ((HILL_X[1] - HILL_X[0]) * i) / N);
  const bottom = rect.y + rect.h;
  // fills fade out at both ends (no hard edges where the projected light runs out)
  const hfade = (col: string, al: number) => {
    const g = c.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
    g.addColorStop(0, withAlpha(col, 0));
    g.addColorStop(0.05, withAlpha(col, al));
    g.addColorStop(0.9, withAlpha(col, al));
    g.addColorStop(1, withAlpha(col, 0));
    return g;
  };
  const ridge = (al: number, col: string, lift: number, wob: number, ph: number) => {
    c.fillStyle = hfade(col, al * a);
    c.beginPath();
    c.moveTo(X(xs[0]), bottom);
    for (const x of xs) c.lineTo(X(x), Y(x) - rect.h * lift - Math.sin(x * 1.3 + ph) * wob - Math.sin(x * 3.1 + ph) * wob * 0.35);
    c.lineTo(X(xs[N]), bottom);
    c.closePath();
    c.fill();
  };
  // three soft paper ridges, the back one hazier: misty hills, not a line
  ridge(0.2, mixLab(env.mood.halo, env.mood.haze, 0.6), 0.3, 7, 0.4);
  ridge(0.3, mixLab(env.mood.halo, env.mood.haze, 0.35), 0.14, 5, 2.1);
  ridge(0.5, mixLab(env.mood.halo, env.mood.rim, 0.25), 0, 0, 0); // the front ridge: the real loss curve
  // the front ridge's lit edge: the thrown OUTLINE of the hill, so the slope the bead rolls down reads at a glance
  c.strokeStyle = hfade(mixLab(env.mood.halo, env.mood.core, 0.35), 0.95 * a);
  c.lineWidth = 2.4;
  c.lineJoin = 'round';
  c.beginPath();
  xs.forEach((x, i) => (i ? c.lineTo(X(x), Y(x)) : c.moveTo(X(x), Y(x))));
  c.stroke();
  // mist pooling in the valleys
  const mist = c.createLinearGradient(0, rect.y + rect.h * 0.5, 0, bottom);
  mist.addColorStop(0, withAlpha(env.mood.haze, 0));
  mist.addColorStop(1, withAlpha(env.mood.haze, 0.16 * a));
  c.fillStyle = mist;
  c.beginPath();
  c.ellipse(rect.x + rect.w / 2, bottom, rect.w * 0.44, rect.h * 0.5, 0, Math.PI, 0);
  c.fill();
  // ghost beads at the gradient steps it has passed (every other iterate from the 5th): the steps visibly shrink
  // as the slope flattens toward the valley; each fades as the bead moves on (dim: the bead is the bright point)
  for (const gi of GHOSTS) {
    if (step < gi + 0.6 || beadA <= 0) continue;
    const gx = X(DESCENT[gi]), gy = Y(DESCENT[gi]) - 4;
    const age = Math.min(1, (step - gi) / 14);
    const ga = a * beadA * (0.45 - 0.25 * age);
    const gg = c.createRadialGradient(gx, gy, 0, gx, gy, 8);
    gg.addColorStop(0, withAlpha(env.mood.halo, 0.8 * ga));
    gg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gg;
    c.fillRect(gx - 8, gy - 8, 16, 16);
  }
  // the bead: real gradient-descent iterates, eased between steps (on the twos): the one bright point
  const k = Math.min(DESCENT.length - 1, Math.floor(step));
  const fr = Math.min(1, step - k);
  const xa = DESCENT[k], xb = DESCENT[Math.min(DESCENT.length - 1, k + 1)];
  const ex = fr * fr * (3 - 2 * fr);
  const bx = xa + (xb - xa) * ex;
  const px = X(bx), py = Y(bx) - 4;
  const bg = c.createRadialGradient(px, py, 0, px, py, 16);
  bg.addColorStop(0, withAlpha(env.mood.core, 1 * a * beadA));
  bg.addColorStop(0.3, withAlpha(env.mood.core, 0.55 * a * beadA));
  bg.addColorStop(1, withAlpha(env.mood.core, 0));
  c.fillStyle = bg;
  c.fillRect(px - 16, py - 16, 32, 32);
  c.restore();
}

/** SNARC's one glow on "learning": all seven valves light in a quick left-to-right ripple (0.35 s end to end) to a
 *  warm peak, hold 0.4 s together, then decay over 1.2 s */
const SNARC_RIPPLE = 0.35, SNARC_HOLD = 0.4, SNARC_DECAY = 1.2;
function snarcTube(t: number, b: Beats, i: number): number {
  const r0 = b.learning - 0.12;
  const t0 = r0 + (i * SNARC_RIPPLE) / (SNARC_BOX.tubes - 1);
  const peakEnd = r0 + SNARC_RIPPLE + SNARC_HOLD;
  return win(t, t0, t0 + 0.1) * (1 - 0.9 * win(t, peakEnd, peakEnd + SNARC_DECAY));
}
function snarcWave(t: number, b: Beats): { at: number; k: number } {
  let k = 0, at = 0, w = 0;
  for (let i = 0; i < SNARC_BOX.tubes; i++) {
    const v = snarcTube(t, b, i);
    k = Math.max(k, v);
    at += i * v;
    w += v;
  }
  return { at: w > 0 ? at / w : 3, k };
}
function snarc(c: C, env: PaintEnv, t: number, b: Beats) {
  const tq = tq12(t);
  const { w, h, tubes } = SNARC_BOX;
  const x0 = SNARC.x - w / 2, y1 = SNARC.y;
  c.save();
  // the chassis (ink), a lit top edge
  c.fillStyle = env.fill('ink');
  c.fillRect(x0, y1 - h, w, h);
  c.fillRect(x0 - 3, y1 - h - 3, w + 6, 4);
  // three round knobs on its face (ink discs with a lit pointer each)
  const warm = snarcWave(tq, b).k;
  for (let k = 0; k < 3; k++) {
    const kx = x0 + 22 + k * 30, ky = y1 - h / 2 + 1;
    // the dials warm with the valves (their faces catch the glow above them)
    c.fillStyle = mixLab(mixLab(env.mood.set, env.mood.fg, 0.2), env.mood.halo, 0.55 * warm);
    c.beginPath();
    c.arc(kx, ky, 7, 0, Math.PI * 2);
    c.fill();
    if (warm > 0.02) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const kg = c.createRadialGradient(kx, ky, 0, kx, ky, 13);
      kg.addColorStop(0, withAlpha(env.mood.halo, 0.4 * warm));
      kg.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = kg;
      c.fillRect(kx - 13, ky - 13, 26, 26);
      c.restore();
    }
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, warm), 0.55 + 0.4 * warm);
    c.lineWidth = 1.4;
    c.beginPath();
    const a = -Math.PI / 2 + (k - 1) * 0.7;
    c.moveTo(kx, ky);
    c.lineTo(kx + Math.cos(a) * 6, ky + Math.sin(a) * 6);
    c.stroke();
  }
  // the valves: glass envelopes (ink outline) standing on the chassis; each lit from inside as the glow passes
  for (let i = 0; i < tubes; i++) {
    const tx = SNARC_TUBE_X(i), base = y1 - h - 3;
    const v = snarcTube(tq, b, i);
    c.fillStyle = env.fill('ink');
    c.fillRect(tx - 5, base - 5, 10, 5); // socket
    c.beginPath();
    c.moveTo(tx - 4.5, base - 5);
    c.lineTo(tx - 4.5, base - 22);
    c.quadraticCurveTo(tx - 4.5, base - 28, tx, base - 29);
    c.quadraticCurveTo(tx + 4.5, base - 28, tx + 4.5, base - 22);
    c.lineTo(tx + 4.5, base - 5);
    c.closePath();
    c.fill();
    // the filament window: dark until lit
    const glow = 0.1 + 0.9 * v;
    c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, v), 0.25 + 0.75 * glow);
    c.beginPath();
    c.ellipse(tx, base - 15, 2.4, 8, 0, 0, Math.PI * 2);
    c.fill();
    if (v > 0.02) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(tx, base - 15, 0, tx, base - 15, 22);
      g.addColorStop(0, withAlpha(env.mood.core, 0.85 * v));
      g.addColorStop(0.35, withAlpha(env.mood.halo, 0.4 * v));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(tx - 22, base - 37, 44, 44);
      c.restore();
    }
  }
  c.restore();
}

// ------------------------------------------------------------------ the exterior (painted into a sub-frame)
function paintExterior(g: Frame, t: number, cam: Camera3, moodU: number, swell: number, cams: Camera3[], focus = 0) {
  g.camera(cam);
  g.setMood('duskRose', { from: 'candleAmber', u: moodU });
  // the near planes are behind the camera once the push has passed them (it dollies past L5 and toward L3)
  const nearA = 1 - sm((cam.z - 300) / 140);
  g.backlight({ sunX: 760, sunY: 470, sunRadius: 600, intensity: 1 });
  g.layer('L1', (c, env) => {
    // the rose dusk: rose over the upper 60% of the sky, warming to amber at the horizon behind the hall
    const rose = mixLab(mixLab(env.mood.sky[2], env.mood.rim, 0.3), ROSE, 0.6);
    const amber = mixLab(env.mood.halo, env.mood.core, 0.35);
    const rg = c.createLinearGradient(0, -260, 0, 600);
    rg.addColorStop(0, withAlpha(rose, 0.42));
    rg.addColorStop(0.6, withAlpha(rose, 0.36));
    rg.addColorStop(0.78, withAlpha(mixLab(rose, amber, 0.5), 0.3));
    rg.addColorStop(1, withAlpha(amber, 0.42));
    c.fillStyle = rg;
    c.fillRect(-1400, -400, 4200, 1000);
    const r = overscan(LAYERS.L1, cams, 80);
    bake(g, c, `${ID}/exL1/${env.mood.id}/${rk(r)}`, r, (cc) => {
      cc.fillStyle = env.fill('set');
      cc.beginPath();
      cc.moveTo(r.x, 560);
      for (let x = r.x; x <= r.x + r.w; x += 40) cc.lineTo(x, 520 + Math.sin(x * 0.006) * 14 + Math.sin(x * 0.017) * 6);
      cc.lineTo(r.x + r.w, r.y + r.h);
      cc.lineTo(r.x, r.y + r.h);
      cc.fill();
    });
  });
  g.fog({ yCenter: 520, height: 220, alpha: 0.26, drift: 5 });
  g.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, cams, 60);
    bake(g, c, `${ID}/exL2c/${env.mood.id}/${rk(r)}`, r, (cc) => {
      // the white colonial hall at dusk, BACKLIT: against the rose sky its face falls to the set value (two steps
      // under the sky, no haze lift), so it reads as a silhouette and the lit top-floor panes are the brightest shapes
      const hallEnv: PaintEnv = env;
      collegeHall(cc, { x: 640, y: 560, w: 860, h: 250, floors: 3, bays: 15, cupola: true, lit: 0.22, seed: 1956 }, hallEnv);
      // a soft shadow side (the light is behind the hall): its lower storey settles into the mist
      cc.save();
      cc.globalCompositeOperation = 'source-atop';
      const sh = cc.createLinearGradient(0, 310, 0, 560);
      sh.addColorStop(0, withAlpha(env.mood.set, 0));
      sh.addColorStop(1, withAlpha(env.mood.set, 0.28));
      cc.fillStyle = sh;
      cc.fillRect(r.x, 200, r.w, 400);
      cc.restore();
      // the green in front
      cc.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.25);
      cc.fillRect(r.x - 400, 556, r.w + 800, r.y + r.h - 556 + 200);
    });
  });
  // the four lit top-floor windows, drawn live (crisp at any push): warm glass with the interior window's own sash,
  // at PANE_Q scale; their glow swells as we push toward them (we dissolve through their light)
  g.layer('L2', (c, env) => {
    const glass = mixLab(env.mood.core, env.mood.halo, 0.25);
    for (const bay of LIT_BAYS) {
      // as the camera commits to the right-hand pane, the others' lamps go down (one window to go through)
      const on = bay === LIT_BAYS[LIT_BAYS.length - 1] ? 1 : 1 - 0.85 * focus;
      const x0 = paneCx(bay) - (WIN_OPEN.w * PANE_Q) / 2;
      c.save();
      c.translate(x0, PANE_Y0);
      c.scale(PANE_Q, PANE_Q);
      const h = WIN_OPEN.y1 - WIN_OPEN.y0;
      const gg = c.createLinearGradient(0, 0, 0, h);
      gg.addColorStop(0, withAlpha(glass, 0.9 * on));
      gg.addColorStop(1, withAlpha(mixLab(glass, env.mood.halo, 0.5), 0.95 * on));
      c.fillStyle = gg;
      c.fillRect(0, 0, WIN_OPEN.w, h);
      sashBars(c, 0, WIN_OPEN.w, 0, h, env.fill('ink'));
      c.restore();
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    const R = 110 + 50 * swell;
    const gr = c.createRadialGradient(LIT_WIN.x, LIT_WIN.y, 4, LIT_WIN.x, LIT_WIN.y, R);
    gr.addColorStop(0, withAlpha(env.mood.core, 0.12 + 0.12 * swell));
    gr.addColorStop(0.4, withAlpha(env.mood.halo, 0.08 + 0.08 * swell));
    gr.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gr;
    c.fillRect(LIT_WIN.x - R, LIT_WIN.y - R, 2 * R, 2 * R);
    c.restore();
  });
  g.fog({ yCenter: 590, height: 130, alpha: 0.32, drift: 7 });
  g.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, cams, 60);
    bake(g, c, `${ID}/exL3/${env.mood.id}/${rk(r)}`, r, (cc) => {
      tree(cc, { x: 40, y: 640, h: 560, kind: 'elm', seed: 7, leaves: 1, role: 'ink' }, env);
      tree(cc, { x: 1250, y: 650, h: 600, kind: 'elm', seed: 12, leaves: 1, role: 'ink' }, env);
      // the green: a hazed lawn rising toward the hall (no flat band), darkening toward the near edge
      const gg = cc.createLinearGradient(0, 600, 0, r.y + r.h);
      gg.addColorStop(0, mixLab(env.fill('set'), env.mood.haze, 0.3));
      gg.addColorStop(0.35, mixLab(env.fill('set'), env.mood.haze, 0.12));
      gg.addColorStop(1, mixLab(env.fill('set'), env.mood.fg, 0.35));
      cc.fillStyle = gg;
      cc.beginPath();
      cc.moveTo(r.x, 640);
      for (let x = r.x; x <= r.x + r.w; x += 30) cc.lineTo(x, 636 + Math.sin(x * 0.004) * 8 + Math.sin(x * 0.013 + 1) * 3);
      cc.lineTo(r.x + r.w, r.y + r.h);
      cc.lineTo(r.x, r.y + r.h);
      cc.closePath();
      cc.fill();
    });
  });
  // low ground fog lying on the green: a soft billowing band (the rise passes over it)
  g.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, cams, 60);
    fogBank(c, { y: 664, height: 70, density: 0.62, speed: 5, x0: r.x, x1: r.x + r.w, softness: 22, salt: 56 }, env);
  });
  g.fog({ yCenter: 610, height: 90, alpha: 0.3, drift: 6 });
  if (nearA > 0)
    g.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, cams.slice(0, 3), 40);
      c.save();
      c.globalAlpha *= nearA;
      bake(g, c, `${ID}/exL5d/${env.mood.id}/${rk(r)}`, r, (cc) => {
        // the near elm (blurred): a rough trunk at the left edge, leaning a little, and a low canopy over the upper
        // left with an irregular, leafy edge; no hedge, no post
        cc.fillStyle = env.fill('fg');
        const base = r.y + r.h, top = -260;
        const edge = (side: number, u: number) => {
          const y = lerp(base, top, u);
          const w = lerp(80, 46, u);
          const wob = Math.sin(u * 23 + side) * 3 + Math.sin(u * 61 + side * 2) * 1.6 + hash1(Math.round(u * 80), 9 + side) * 1.8;
          return { x: 130 + u * 46 + side * (w + wob), y };
        };
        cc.beginPath();
        const N = 40;
        for (let i = 0; i <= N; i++) {
          const q = edge(-1, i / N);
          if (i === 0) cc.moveTo(q.x - 30, q.y);
          else cc.lineTo(q.x, q.y);
        }
        for (let i = N; i >= 0; i--) {
          const q = edge(1, i / N);
          cc.lineTo(i === 0 ? q.x + 34 : q.x, q.y);
        }
        cc.closePath();
        cc.fill();
        // a limb leaving the trunk to the right and up into the low canopy
        cc.beginPath();
        cc.moveTo(160, 170);
        cc.quadraticCurveTo(240, 90, 330, 50);
        cc.lineTo(338, 66);
        cc.quadraticCurveTo(255, 110, 178, 222);
        cc.closePath();
        cc.fill();
        // the low canopy: overlapping leaf clumps with a scalloped lower edge
        for (let i = 0; i < 26; i++) {
          const u = i / 25;
          const cx = lerp(-80, 420, u) + hash1(i, 31) * 24;
          const cy = lerp(-20, 70, Math.sin(u * Math.PI) * 0.8 + u * 0.3) + hash1(i, 32) * 20;
          const rr = 44 + 28 * (hash1(i, 33) * 0.5 + 0.5) * (1 - 0.45 * u);
          cc.beginPath();
          cc.arc(cx, cy, rr, 0, Math.PI * 2);
          cc.fill();
          for (let k = 0; k < 4; k++) {
            const a = Math.PI * (0.15 + 0.7 * (k / 3)) + hash1(i * 7 + k, 34) * 0.3;
            cc.beginPath();
            cc.arc(cx + Math.cos(a) * rr * 0.95, cy + Math.sin(a) * rr * 0.95, rr * (0.22 + 0.12 * (hash1(i * 5 + k, 35) * 0.5 + 0.5)), 0, Math.PI * 2);
            cc.fill();
          }
        }
      });
      c.restore();
    });
  void t;
}

// ------------------------------------------------------------------ shot
export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = {
      l1: T.line('L0215').start,
      name: T.beat('name'),
      artificial: T.word('L0215', 'artificial'),
      intelligence: T.word('L0215', 'intelligence'),
      l1End: T.line('L0215').end,
      minsky: T.beat('minsky'),
      learning: T.beat('snarc'),
      symbols: T.beat('symbols'),
      rules: T.word('L0215b', 'rules'),
      suspect: T.beat('suspect'),
      suspectEnd: T.line('L0215b').end,
      l3: T.line('L0216').start,
      widrow: T.beat('widrow'),
      fell: T.beat('quoteUp'),
      good: T.beat('taken'),
      downhill: T.beat('downhill'),
      wrongEnd: T.line('L0216').end,
      remember: T.beat('remember'),
      sliding: T.word('L0216', 'sliding'),
      wrong: T.word('L0216', 'wrong'),
      // the exterior: the push-and-rise carries the four lit windows to frame centre by `rise`; then the right-hand
      // pane is carried onto the interior's lantern window (muntins on muntins) by `match`, under a 0.9 s dissolve
      rise: Math.max(1.9, T.beat('name') - 0.52),
      match: Math.max(2.45, T.beat('name') + 0.03),
      dissolve0: Math.max(1.9, T.beat('name') - 0.52),
      dissolve1: Math.max(2.8, T.beat('name') + 0.38),
    };
    const D = T.duration;
    // interior camera: a monotone path through word-anchored keys
    const keys: C3[] = [
      { t: b.dissolve0, x: 412, y: 330, z: 40 },
      { t: b.l1End, x: 452, y: 340, z: 118 },
      { t: b.learning, x: 610, y: 346, z: 168 },
      { t: b.symbols + 0.6, x: 586, y: 350, z: 196 },
      { t: b.suspect + 0.1, x: 562, y: 354, z: 214 },
      { t: Math.max(b.suspectEnd + 0.4, b.suspect + 1.5), x: 572, y: 354, z: 226 },
      { t: b.widrow + 0.9, x: 870, y: 352, z: 236 },
      { t: b.downhill, x: 846, y: 350, z: 280 },
      { t: b.remember, x: 846, y: 352, z: 312 },
      { t: D, x: 846, y: 354, z: 338 },
    ];
    const ok = ordered(keys.map((k) => [k.t, k.x] as [number, number]), 0.4).map(([tt], i) => ({ ...keys[i], t: tt }));
    const camX = monotone(ok.map((k) => [k.t, k.x]));
    const camY = monotone(ok.map((k) => [k.t, k.y]));
    const camZ = monotone(ok.map((k) => [k.t, k.z]));
    const camBase = (t: number): Camera3 => ({ x: camX(t), y: camY(t), z: camZ(t), lens: 1 });
    // "suspect": the glance that gives the RULES card a face — a ~17% push centred on the emblem (in on the word,
    // a 0.5 s hold, eased back by +1.2 s) while the chalk emblem brightens to full
    // (in from 12.3 to 13.1, a 0.4 s hold at ~1.3x with the emblem near frame centre, eased back by 14.0)
    // (round 2: a real camera beat — 0.6 s in to ~1.2x with the emblem near centre, a 0.8 s hold, 0.6 s back)
    const gIn0 = b.suspect - 0.3, gIn1 = gIn0 + 0.6, gOut0 = gIn1 + 0.8, gOut1 = gOut0 + 0.6;
    const camAt = (t: number): Camera3 => {
      const c0 = camBase(t);
      const g = sm((t - gIn0) / (gIn1 - gIn0)) * (1 - sm((t - gOut0) / (gOut1 - gOut0)));
      if (g <= 0) return c0;
      // the push: 20% more scale on the action plane
      const zPush = 1000 - (1000 - c0.z) / 1.2;
      const cz: Camera3 = { ...c0, z: lerp(c0.z, zPush, g) };
      // the centring: shift so the emblem moves toward frame centre (by ~85%), measured at the pushed camera
      const es = toScreen(LAYERS.L3, cz, EMBLEM.x, EMBLEM.y);
      const e1 = toScreen(LAYERS.L3, { ...cz, x: cz.x + 1, y: cz.y + 1 }, EMBLEM.x, EMBLEM.y);
      const kx = es.x - e1.x || 1, ky = es.y - e1.y || 1;
      return { ...cz, x: cz.x + ((es.x - 640) / kx) * 0.9 * g, y: cz.y + ((es.y - 372) / ky) * 0.9 * g };
    };
    const CAMS = [...ok.map((k) => camAt(k.t)), camAt(b.dissolve0), camAt(b.suspect + 0.8)];

    // the exterior camera: from the low framing, a push-and-rise (dolly + a little lens) that brings the four lit
    // windows to frame centre at ~2.6x by `rise`, then on through the right-hand pane until it IS the interior's
    // lantern window (same place, same size, its sash on the window's sash) at `match`
    const WIN0C = { x: WINDOWS[0].cx, y: (WIN_OPEN.y0 + WIN_OPEN.y1) / 2 };
    const kL2 = (cam: Camera3) => toScreen(LAYERS.L2, cam, 0, 0).k;
    const kMatch = (t: number) => kL2(camAt(t)) / PANE_Q;
    const winC = (t: number) => toScreen(LAYERS.L2, camAt(t), WIN0C.x, WIN0C.y);
    const k0 = kL2(EXT0);
    const S0 = toScreen(LAYERS.L2, EXT0, GROUP_C.x, GROUP_C.y);
    const extZ = monotone([[0, EXT0.z], [0.6, -120], [b.rise, 480]]);
    const lnKfree = monotone([[0, Math.log(k0)], [0.6, Math.log(k0 * 1.02)], [b.rise, Math.log(k0 * 2.6)], [b.match, Math.log(kMatch(b.match))]]);
    const extCamAt = (t: number): Camera3 => {
      const w = sm((t - b.rise) / (b.match - b.rise));
      const u = sm((t - 0.6) / (b.rise - 0.6));
      const k = Math.exp(w > 0 ? lerp(lnKfree(t), Math.log(kMatch(Math.min(t, b.dissolve1))), w) : lnKfree(t));
      // up to `rise` the group's centre is steered to frame centre; after it, the right-hand pane is steered in SCREEN
      // space from where the free push would carry it onto the interior window's centre (a straight, short path)
      let P: { x: number; y: number }, S: { x: number; y: number };
      if (w <= 0) {
        P = GROUP_C;
        S = { x: lerp(S0.x, 640, u), y: lerp(S0.y, 360, u) };
      } else {
        const wc = winC(Math.min(t, b.dissolve1));
        const free = { x: 640 + (TARGET_C.x - GROUP_C.x) * k, y: 360 + (TARGET_C.y - GROUP_C.y) * k };
        P = TARGET_C;
        S = { x: lerp(free.x, wc.x, w), y: lerp(free.y, wc.y, w) };
      }
      const z = extZ(t);
      const lens = (k * (LAYERS.L2.z - z)) / LAYERS.L2.z;
      const s2 = (k * ZA) / LAYERS.L2.z;
      return { x: 640 + (640 + (P.x - 640) * k - S.x) / s2, y: 360 + (360 + (P.y - 360) * k - S.y) / s2, z, lens };
    };
    const EXT_CAMS = [extCamAt(0), extCamAt(0.6), extCamAt((0.6 + b.rise) / 2), extCamAt(b.rise)];

    // the chalked name, two large lines across the board's upper half; each line runs exactly under McCarthy's
    // chalk (his body's sidestep plus his arm's sweep), laid out from the camera at the middle of its writing
    const tw = [
      { t0: b.name + 0.06, t1: b.intelligence - 0.22 },
      { t0: b.intelligence + 0.36, t1: Math.min(b.minsky - 0.2, b.intelligence + 1.6) },
    ];
    const bodyX = (i: number, e: number) => lerp(SWEEPS[i].bx0, SWEEPS[i].bx1, clamp01(e));
    const chalk: ChalkLayout = { lines: [] };
    SWEEPS.forEach((_sw, i) => {
      const camMid = camAt((tw[i].t0 + tw[i].t1) / 2);
      const hand = (e: number) => {
        const a = P_MCC.anchor({ x: bodyX(i, e), y: FLOOR, facing: 'right', pose: chalkPose(i, e) }, 'handF');
        const s = toScreen(LAYERS.L4, camMid, a.x + 4, a.y - 4);
        return toLayer(LAYERS.L3, camMid, s.x, s.y);
      };
      const h0 = hand(0), h1 = hand(1);
      const size = 46;
      chalk.lines.push({ x0: h0.x, x1: h1.x, y: (h0.y + h1.y) / 2 + size * 0.33, size, ...tw[i] });
    });
    // the hill projection: on the wall just right of Widrow (as framed at "Remember"), under the quote card
    const cR = camAt(b.remember);
    // 1.8× the first sketch, on the plain wall between Widrow and the door, below the quote card
    // (round 2: Widrow now stands ~60 px further left, so the whole hill is on clear wall behind his back)
    const pA = toLayer(LAYERS.L2, cR, 930, 368), pB = toLayer(LAYERS.L2, cR, 1262, 556);
    const hillRect = { x: pA.x, y: pA.y, w: pB.x - pA.x, h: pB.y - pA.y };
    // L5 near pieces placed from the cameras that frame them: a chair back at lower-left while we watch the board
    // (McCarthy's and Minsky's beats), another chair at lower-left once we have trucked right to the door
    const nearA = toLayer(LAYERS.L5, camAt(b.minsky), 70, 540);
    const nearB = toLayer(LAYERS.L5, camAt(b.good), 60, 548);
    tl.hold(0, D);
    return { tl, b, dur: D, camAt, CAMS, chalk, tw, hillRect, nearA, nearB, extCamAt, EXT_CAMS, bodyX };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b;
    const tq = tq12(t);
    const moodU = sm(t / 1.5);
    const dissolve = win(t, b.dissolve0, b.dissolve1);
    // exterior camera: the push-and-rise to the lit windows, then through the right-hand pane (see build)
    const swell = win(t, b.rise - 1.2, b.rise);
    const extCam = scene.extCamAt(t);

    if (t < b.dissolve0) {
      paintExterior(f, t, extCam, moodU, swell, scene.EXT_CAMS, win(t, b.rise - 0.1, b.match - 0.15));
      placeStamp(f.c, { place: 'Dartmouth', date: 'summer 1956', year: 1956, at: b.l1, dur: b.name + 1.6 - b.l1, fade: 0.5 }, { t, mood: f.mood, seed: 56 });
      return;
    }
    const ext = dissolve < 1 ? subFrame(f, `${ID}/ext`, 'duskRose', (g) => paintExterior(g, t, extCam, moodU, swell, scene.EXT_CAMS, win(t, b.rise - 0.1, b.match - 0.15))) : null;

    const cam = scene.camAt(t);
    f.camera(cam);
    f.setMood('duskRose', { from: 'candleAmber', u: moodU });
    const CAMS = scene.CAMS;
    f.backlight({ sunX: 760, sunY: 430, sunRadius: 560, intensity: 1.12 });
    f.layer('L1', (c, env) => {
      // the glass reads hotter: a dusk glow behind the panes (L1 is only seen through the window holes)
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(0, -200, 0, 620);
      // ROSE glass (the dusk outside), so the lantern is the one warm amber practical against it
      const roseGlass = mixLab(mixLab(env.mood.halo, env.mood.rim, 0.5), ROSE, 0.55);
      g.addColorStop(0, withAlpha(roseGlass, 0.2));
      g.addColorStop(0.62, withAlpha(roseGlass, 0.6));
      g.addColorStop(1, withAlpha(mixLab(env.mood.halo, ROSE, 0.4), 0.2));
      c.fillStyle = g;
      c.fillRect(-1600, -400, 4400, 1200);
      c.restore();
    });
    // the elms on the green over the glow: dark shapes against the bright glass (tree shadows in the panes)
    interiorL1(f, CAMS);
    backWall(f, CAMS);
    f.fog({ yCenter: 430, height: 300, alpha: 0.2, drift: 5 });
    midground(f, CAMS, t, b, scene.chalk);
    // two soft window beams laid across the floor (L3), from the lantern's bay and the left window
    f.layer('L3', (c, env) => {
      const beams = WINDOWS.map((w) => {
        const a = toLayer(LAYERS.L3, CAM_REF, toScreen(LAYERS.L2, CAM_REF, w.cx - w.w / 2, 0).x, 0).x;
        const z = toLayer(LAYERS.L3, CAM_REF, toScreen(LAYERS.L2, CAM_REF, w.cx + w.w / 2, 0).x, 0).x;
        return windowBeam({ x: a, y: 470, w: z - a, h: 120 }, { x: -0.55, y: 1 }, 380, 1.5);
      });
      godRays(c, { beams, intensity: 0.32, streaks: 3, shimmer: 0.08, mullions: 2, softness: 26, salt: 9 }, env);
    });
    f.fog('B');

    // ---- the lantern's swing (from "symbols", when Minsky turns from it): gentle, slowly decaying, on the twos
    const sdt = tq - (b.symbols + 0.04);
    // (the long cord's pendulum: ~26 px of travel at the lantern, a 3.1 s period)
    const swing = sdt > 0 ? 0.065 * Math.sin(sdt * 2.02) * (0.55 + 0.45 * Math.exp(-sdt * 0.12)) * Math.min(1, sdt * 7) : 0;
    const lb = lanternBody(swing);

    // Widrow's reveal: until his word the door side is in true shadow; on "Widrow" only his rim comes up (he stands
    // by the door, half in shadow); on "good" he steps into the lantern's light (the wall behind him warms, his
    // cut-lines come up) — one step on the twos, toward the lantern
    const reveal = win(t, b.widrow - 0.3, b.widrow + 0.2);
    const lit = win(t, b.good - 0.25, b.good + 0.45);
    const stepU = sm((tq - (b.good - 0.3)) / 0.5);
    const widX = WID.x + WID.step * (1 - stepU);

    // the misty hills thrown on the wall beside him (L2: the wall), from "downhill"
    // (round 2: full strength BEFORE the bead starts on "sliding", so the slope is there to slide down)
    const bead0 = b.sliding - 0.25;
    const hillA = win(t, bead0 - 0.55, bead0 + 0.05) * (1 - 0.3 * win(t, b.remember + 1.5, b.remember + 2.5));
    f.layer('L2', (c, env) => {
      // the lantern's swinging pool on the wall between the window and the door
      const ls = toScreen(LAYERS.L4, f.cam, lb.x, lb.y);
      const lw = toLayer(LAYERS.L2, f.cam, ls.x, ls.y);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const R = 260;
      const g = c.createRadialGradient(lw.x + 60, lw.y + 30, 10, lw.x + 60, lw.y + 30, R);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.1 + 0.08 * reveal));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(lw.x + 60 - R, lw.y + 30 - R, 2 * R, 2 * R);
      c.restore();
      // the door side: a shadow over the door and the wall around it before the reveal, a warm wash after
      const dc = WASH.cx, dy = (DOOR.y0 + DOOR.y1) / 2;
      const shade = 1 - 0.3 * reveal - 0.7 * lit;
      if (shade > 0) {
        const R = 300;
        const sh = c.createRadialGradient(dc, dy, 40, dc, dy, R);
        sh.addColorStop(0, withAlpha(env.mood.fg, 0.8 * shade));
        sh.addColorStop(0.6, withAlpha(env.mood.fg, 0.62 * shade));
        sh.addColorStop(1, withAlpha(env.mood.fg, 0));
        c.fillStyle = sh;
        c.fillRect(dc - R, dy - R, 2 * R, 2 * R);
      }
      if (lit > 0) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        const R = 240;
        const wg = c.createRadialGradient(dc - 40, dy - 20, 10, dc - 40, dy - 20, R);
        wg.addColorStop(0, withAlpha(env.mood.halo, 0.22 * lit));
        wg.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = wg;
        c.fillRect(dc - 40 - R, dy - 20 - R, 2 * R, 2 * R);
        c.restore();
      }
      // the bead takes the first dozen real gradient-descent steps (~0.14 s each, on the twos) through "toward
      // less wrong", then rests in the valley (the later iterates barely move)
      // the bead: at the top of the left slope on "sliding", halfway down on "downhill", settled in the valley on
      // "wrong" (real iterates, eased on the twos; the steps shrink as the slope flattens)
      const u1 = clamp01((tq - bead0) / (b.downhill - bead0));
      const u2 = clamp01((tq - b.downhill) / (b.wrong - b.downhill));
      const step = tq < b.downhill ? K_MID * u1 ** 1.25 : K_MID + (K_SETTLE - K_MID) * (1 - (1 - u2) ** 1.6) + Math.max(0, tq - b.wrong) * 0.8;
      const beadA = win(t, bead0 - 0.1, bead0 + 0.12);
      hillProjection(c, env, scene.hillRect, hillA, Math.min(step, DESCENT.length - 1.01), (lb.x - LANTERN.x) * 0.77, beadA);
    });

    f.layer('L4', (c, env) => {
      // the window bay's sill (in the action plane) with SNARC on it
      c.fillStyle = env.fill('ink');
      c.fillRect(SILL.x0, SILL.y, SILL.x1 - SILL.x0, 12);
      for (const bx of [SILL.x0 + 22, SILL.x1 - 26]) {
        c.beginPath();
        c.moveTo(bx, SILL.y + 12);
        c.lineTo(bx + 5, SILL.y + 12);
        c.lineTo(bx + 5, SILL.y + 52);
        c.quadraticCurveTo(bx + 2, SILL.y + 24, bx - 18, SILL.y + 12);
        c.fill();
      }
      c.fillStyle = withAlpha(env.mood.rim, 0.4);
      c.fillRect(SILL.x0, SILL.y, SILL.x1 - SILL.x0, 1.2);
      snarc(c, env, t, b);
      // the floor of the action plane (dark boards)
      c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.3);
      c.fillRect(-600, FLOOR + 2, 2600, 400);
      lantern(c, env, swing);

      // McCarthy: at the board, he chalks the name in two long sweeps, sidestepping along under his chalk (on the
      // twos), steps back to the start of the second line between them, and after it walks back to the left of the
      // board so the whole name stands clear
      const [w1, w2] = scene.tw;
      const back0 = w2.t1 + 0.25, back1 = back0 + 1.15;
      const mccAt = (q: number): { x: number; p: Pose } => {
        if (q < w1.t0) {
          const lift = sm((q - (w1.t0 - 0.5)) / 0.45);
          return { x: SWEEPS[0].bx0, p: blendPose(MCC_LOOK, chalkPose(0, 0), lift) };
        }
        if (q < w1.t1) {
          const e = (q - w1.t0) / (w1.t1 - w1.t0);
          const x = scene.bodyX(0, e);
          return { x, p: stepping(chalkPose(0, e), x - SWEEPS[0].bx0) };
        }
        if (q < w2.t0) {
          // the step back to the start of the next line (two quick steps, the arm coming down and up again)
          const u = sm((q - w1.t1) / (w2.t0 - w1.t1));
          const x = lerp(SWEEPS[0].bx1, SWEEPS[1].bx0, u);
          const arm = blendPose(chalkPose(0, 1), chalkPose(1, 0), u);
          const dip = Math.sin(Math.PI * u);
          return { x, p: stepping(addPose(arm, { shoulderF: -40 * dip, elbowF: 30 * dip }), SWEEPS[0].bx1 - x) };
        }
        if (q < w2.t1) {
          const e = (q - w2.t0) / (w2.t1 - w2.t0);
          const x = scene.bodyX(1, e);
          return { x, p: stepping(chalkPose(1, e), x - SWEEPS[1].bx0) };
        }
        // done: the arm comes down, he walks back to the left of the board and looks at the name
        const ua = sm((q - w2.t1) / 0.4);
        const uw = sm((q - back0) / (back1 - back0));
        const x = lerp(SWEEPS[1].bx1, MCC.x, uw);
        const p = blendPose(chalkPose(1, 1), MCC_REST, ua);
        return { x, p: uw > 0 && uw < 1 ? stepping(p, SWEEPS[1].bx1 - x) : p };
      };
      const writing = (q: number) => (q > w1.t0 && q < w1.t1) || (q > w2.t0 && q < w2.t1);
      const ms = mccAt(tq);
      const jitter = writing(tq) ? { wristF: (Math.floor(tq * 12) % 3) * 3 - 3 } : {};
      const mp = withLife({ ...addPose(ms.p, jitter), prev: mccAt(tq - 1 / 12).p }, tq, 21, 1.5);
      // (walking back to the left he faces left; at the board he faces it)
      const mFacing: 'left' | 'right' = tq > back0 + 0.05 && tq < back1 - 0.05 ? 'left' : 'right';
      const mo: PuppetDrawOpts = { x: ms.x, y: FLOOR, facing: mFacing, pose: mp, ink: PUPPET_NEAR_BLACK, light: { x: 1, y: -0.35, floor: 0.15 } };
      P_MCC.draw(c, mo, env);
      // the chalk stick in his fingers
      const ha = P_MCC.anchor(mo, 'handF');
      c.fillStyle = chalkInk(env);
      c.save();
      c.translate(ha.x, ha.y);
      c.rotate(-0.6);
      c.fillRect(0, -1.6, 9, 3.2);
      c.restore();

      // Minsky: leaning toward his learning machine (the lantern, SNARC); on "symbols" he turns his back on it as a
      // true paper-cut flip: the old profile HOLDS through symbols - 0.11, one three-quarter drawing (the cut-out
      // narrowed to 70%, never a sliver) for one drawing on the twos, then the mirrored profile, which settles from
      // the turned stance into the pointing one
      const flip0 = b.symbols - 0.1, flip1 = flip0 + 1 / 12;
      const minAt = (q: number): Pose => {
        if (q < flip1) return blendPose(MIN_FACE, addPose(MIN_FACE, { head: 6, neck: 4 }), sm((q - b.learning + 0.2) / 0.5));
        const u = sm((q - flip1) / 0.42);
        const p = blendPose(addPose(MIN_FACE, { head: 6, neck: 4, torso: -4 }), MIN_TURNED, u);
        return blendPose(p, MIN_RULE, sm((q - (b.rules - 0.1)) / 0.5) * (1 - sm((q - (b.suspectEnd + 0.4)) / 0.6)));
      };
      const np = withLife({ ...minAt(tq), prev: minAt(tq - 1 / 12) }, tq, 33, 1.6);
      const isTurned = tq >= flip1;
      const threeQ = tq >= flip0 && tq < flip1;
      c.save();
      c.translate(MIN.x, 0);
      c.scale((isTurned ? -1 : 1) * (threeQ ? 0.7 : 1), 1);
      c.translate(-MIN.x, 0);
      P_MIN.draw(c, { x: MIN.x, y: FLOOR, facing: 'right', pose: np, ink: PUPPET_NEAR_BLACK, light: { x: isTurned ? -1 : 1, y: -0.4, floor: 0.15 } }, env);
      c.restore();

    });
    f.rim({ x: 0.35, y: -0.9 });
    // Widrow by the door, at the rim, on his own plane after the rim pass. Until his word he stands in the door's
    // shadow at the SET's value (one step above ink, no rim, no cut-lines): a shape you only find once you are
    // told. From widrow - 0.3 his edge rim and the lantern's light on his side come up over 0.5 s, landing on
    // "Widrow" with the name card. On "good" he looks up at the lantern and its light catches his glasses.
    f.layer(WID_PLANE, (c, env) => {
      const widAt = (q: number): Pose => {
        const p = blendPose(WID_STAND, WID_LOOK, sm((q - (b.good - 0.35)) / 0.45));
        // the step: the front knee lifts and lands as he moves toward the lantern
        const u = sm((q - (b.good - 0.3)) / 0.5), bump = Math.sin(Math.PI * u);
        return bump > 0.01 ? addPose(p, { hipF: 16 * bump, kneeF: -20 * bump, hipB: -6 * bump, torso: 2 * bump }) : p;
      };
      const wp = withLife({ ...widAt(tq), prev: widAt(tq - 1 / 12) }, tq, 45, 1.5);
      const shadowInk = mixLab(env.fill('set'), env.mood.fg, 0.78);
      const ink = reveal >= 1 ? PUPPET_NEAR_BLACK : mixLab(shadowInk, PUPPET_NEAR_BLACK, reveal);
      // toward the lantern (up and to his left)
      const toL = { x: lb.x - widX, y: lb.y - (FLOOR - 300) };
      const nL = Math.hypot(toL.x, toL.y) || 1;
      const wo: PuppetDrawOpts = {
        x: widX,
        y: FLOOR,
        facing: 'left',
        pose: wp,
        ink,
        cutLines: lit > 0.5,
        light: { x: toL.x / nL, y: toL.y / nL, floor: 0.1 + 0.15 * (1 - lit) },
        edgeRim: { x: toL.x / nL, y: toL.y / nL - 0.3, px: 1.8, alpha: 0.85 * reveal },
      };
      // in the shadow his lenses catch nothing either (the kit lights a lens with the rim colour)
      const wenv: PaintEnv = reveal >= 1 ? env : { ...env, fill: (role) => (role === 'rim' ? mixLab(ink, env.fill('rim'), reveal) : env.fill(role)) };
      // the nape: a short-haired copy everywhere, then the trimmed waves above the ear line only
      P_WID_NAPE.draw(c, wo, wenv);
      const hd = P_WID.anchor(wo, 'head'), ey = P_WID.anchor(wo, 'eye');
      const H = headFrame(hd, ey, 'left');
      c.save();
      c.beginPath();
      const q = [H(-3, -3), H(3, -3), H(3, -0.43), H(-3, -0.43)];
      c.moveTo(q[0].x, q[0].y);
      for (const v of q.slice(1)) c.lineTo(v.x, v.y);
      c.closePath();
      c.clip();
      P_WID.draw(c, wo, wenv);
      c.restore();
      // the heavy frames read in profile: a 2 px gap of wall light between the lens and the brow, and between the
      // lens's back edge and the eye socket (after the reveal, when there is light to see it by)
      if (lit > 0) {
        c.save();
        c.strokeStyle = withAlpha(mixLab(env.mood.halo, env.mood.rim, 0.5), 0.75 * lit);
        c.lineWidth = 1.4;
        c.lineCap = 'round';
        const g0 = H(0.35, -0.566), g1 = H(0.45, -0.566);
        const s0 = H(0.334, -0.53), s1 = H(0.334, -0.44);
        c.beginPath();
        c.moveTo(g0.x, g0.y);
        c.lineTo(g1.x, g1.y);
        c.moveTo(s0.x, s0.y);
        c.lineTo(s1.x, s1.y);
        c.stroke();
        c.restore();
      }
      // "good": the lantern catches the lens rim that faces it — a 1 px hot stroke for 0.6 s
      const hot = win(t, b.good - 0.06, b.good + 0.08) * (1 - win(t, b.good + 0.4, b.good + 0.6));
      if (hot > 0) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = withAlpha(env.mood.core, 0.95 * hot);
        c.lineWidth = 1;
        const r0 = H(0.444, -0.545), r1 = H(0.444, -0.445), r2 = H(0.42, -0.432);
        c.beginPath();
        c.moveTo(r0.x, r0.y);
        c.lineTo(r1.x, r1.y);
        c.lineTo(r2.x, r2.y);
        c.stroke();
        c.restore();
      }
      const lensC = H(0.392, -0.49);
      (scene as unknown as { _eye?: { x: number; y: number } })._eye = lensC;
    });
    // L5: near, blurred ink: a ladder-back chair at lower-left (the board half), the long table's near end at
    // lower-left once we truck right to the door (the near plane slides past fastest: depth)
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, CAMS, 40);
      const nearPieces = (cc: C, p: { x: number; y: number }, flip: number) => {
        // a ladder-back chair seen side-on: two uprights, three slats, finials, the seat edge
        const cx = p.x, top = p.y;
        // turned uprights (beads and a vase) with finials, three shaped slats between them
        turned(cc, cx + 6, top, top + 640, 7);
        turned(cc, cx + 74 * flip + 6, top + 12, top + 652, 7);
        for (let k = 0; k < 3; k++) {
          const sy = top + 22 + k * 36, sx0 = Math.min(cx, cx + 74 * flip);
          cc.beginPath();
          cc.moveTo(sx0, sy + 2);
          cc.quadraticCurveTo(sx0 + 43, sy - 5, sx0 + 86, sy + 2);
          cc.lineTo(sx0 + 86, sy + 12);
          cc.quadraticCurveTo(sx0 + 43, sy + 6, sx0, sy + 12);
          cc.closePath();
          cc.fill();
        }
        cc.beginPath();
        cc.arc(cx + 6, top - 4, 8, 0, Math.PI * 2);
        cc.arc(cx + 74 * flip + 6, top + 8, 8, 0, Math.PI * 2);
        cc.fill();
        cc.fillRect(Math.min(cx, cx + 74 * flip) - 30, top + 160, 150, 15);
      };
      bake(f, c, `${ID}/L5d/${env.mood.id}/${rk(r)}`, { x: r.x, y: 300, w: r.w, h: 900 }, (cc) => {
        cc.fillStyle = PUPPET_NEAR_BLACK;
        nearPieces(cc, scene.nearA, 1);
        nearPieces(cc, scene.nearB, 1);
      });
    });
    // the floor and the lower wall fall toward ink at the frame's lower edge and corners (depth, contrast)
    {
      const c = f.c;
      c.save();
      const g = c.createLinearGradient(0, 430, 0, 720);
      g.addColorStop(0, withAlpha(f.mood.fg, 0));
      g.addColorStop(1, withAlpha(f.mood.fg, 0.55));
      c.fillStyle = g;
      c.fillRect(0, 430, 1280, 290);
      // the ceiling band: the room falls into shadow above the cornice (the window heads stay lit below it)
      const top = c.createLinearGradient(0, 0, 0, 120);
      top.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.82));
      top.addColorStop(0.55, withAlpha(PUPPET_NEAR_BLACK, 0.45));
      top.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
      c.fillStyle = top;
      c.fillRect(0, 0, 1280, 120);
      for (const [x0, x1] of [[0, 300], [1280, 980]] as const) {
        const e = c.createLinearGradient(x0, 0, x1, 0);
        e.addColorStop(0, withAlpha(f.mood.fg, 0.38));
        e.addColorStop(1, withAlpha(f.mood.fg, 0));
        c.fillStyle = e;
        c.fillRect(Math.min(x0, x1), 300, 300, 420);
      }
      c.restore();
    }

    // practicals: the lantern (the one warm light inside), SNARC's tubes, the glint on Widrow's glasses
    f.practical({ x: lb.x, y: lb.y, kind: 'candle', seed: 1956, intensity: 0.85, radius: 64 });
    // SNARC's tubes warm the sill as the glow passes along them (a soft, low practical riding with the wave)
    const sw = snarcWave(t, b);
    if (sw.k > 0.01) f.practical({ x: SNARC_TUBE_X(sw.at), y: SNARC.y - SNARC_BOX.h - 12, kind: 'tube', seed: 51, intensity: 0.8 * sw.k, radius: 52 });
    const eye = (scene as unknown as { _eye?: { x: number; y: number } })._eye;
    const glint = win(t, b.good - 0.18, b.good + 0.04) * (0.5 + 0.5 * Math.exp(-Math.max(0, tq - b.good) / 0.7)) * (1 - 0.5 * win(t, b.remember + 1.2, b.remember + 2.4));
    if (eye && glint > 0.02) f.practical({ x: eye.x - 2, y: eye.y, kind: 'led', seed: 77, intensity: 0.9 * glint, radius: 18 });
    // ---- the in-shot iris on Widrow and the lantern ("Remember"): a soft oval holding both, its surround ~45% darker
    // 0.9 s after the word, never closing
    const ir = win(t, b.remember - 0.1, b.remember + 0.9);
    if (ir > 0) {
      const ws = toScreen(LAYERS.L4, f.cam, WID.x, 430);
      const ls = toScreen(LAYERS.L4, f.cam, lb.x, lb.y);
      const cx = (ws.x + ls.x) / 2 + 20, cy = (ws.y + ls.y) / 2 + 10;
      const rx = Math.abs(ws.x - ls.x) / 2 + 250;
      const ry = 300;
      const c = f.c;
      c.save();
      c.translate(cx, cy);
      c.scale(rx / ry, 1);
      const g = c.createRadialGradient(0, 0, ry * lerp(1.6, 0.62, ir), 0, 0, ry * lerp(2.4, 1.15, ir));
      g.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0));
      g.addColorStop(0.55, withAlpha(PUPPET_NEAR_BLACK, 0.45 * ir));
      g.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0.62 * ir));
      c.fillStyle = g;
      c.fillRect(-cx * (ry / rx) - 40, -cy - 40, (1400 * ry) / rx, 820);
      c.restore();
    }

    if (ext) compositeSub(f, ext, 1 - dissolve);

    // ---- type
    const tenv = { t, mood: f.mood, seed: 57 };
    placeStamp(f.c, { place: 'Dartmouth', date: 'summer 1956', year: 1956, at: b.l1, dur: b.name + 1.6 - b.l1, fade: 0.5 }, tenv);
    // name cards beside their subjects' feet (screen x at each card's mid-time, so the type does not drift)
    const feetX = (x4: number, at: number) => toScreen(LAYERS.L4, scene.camAt(at), x4, FLOOR).x;
    const mccAt = b.name + 0.15, mccDur = Math.min(3.4, b.minsky - b.name - 0.2);
    nameCard(f.c, { name: 'John McCarthy', role: 'named the field', at: mccAt, dur: mccDur, x: Math.max(56, Math.min(560, feetX(MCC.x, mccAt + mccDur / 2) + 40)), y: 600 }, tenv);
    // the label: the name, and when it was first written (the proposal's dateline)
    const pd = toScreen(LAYERS.L3, f.cam, PROPOSAL.x + PROPOSAL.w / 2, PROPOSAL.y + 16);
    annotation(f.c, { text: 'ARTIFICIAL INTELLIGENCE', sub: 'named in the proposal, August 1955', x: pd.x, y: pd.y, tx: pd.x + 150, ty: 92, at: b.name + 0.5, dur: b.symbols - b.name - 0.6, size: 21 }, tenv);
    const minDur = Math.min(3.6, b.symbols + 0.6 - b.minsky);
    nameCard(f.c, { name: 'Marvin Minsky', role: 'built SNARC, 1951', at: b.minsky - 0.05, dur: minDur, x: Math.max(56, Math.min(900, feetX(MIN.x, b.minsky + minDur / 2) + 46)), y: 600 }, tenv);
    // (gone between quoteUp + 0.1 and + 0.5: one Widrow name on screen at a time, the quote's attribution takes over)
    const widAt0 = b.widrow - 0.3, widDur = b.fell + 0.5 - widAt0;
    nameCard(f.c, { name: 'Bernard Widrow', role: 'engineer', at: widAt0, dur: widDur, fade: 0.4, align: 'right', x: Math.min(1224, feetX(WID.x + WID.step, widAt0 + widDur / 2) + 90), y: 600 }, tenv);
    // the quote sits on the dark wall right of the window frame, on its own soft dark plate (cream italic never
    // over the bright panes)
    const qx = 1036, qy = 150;
    const qA = clamp01((t - (b.fell - 0.05)) / 0.6);
    if (qA > 0) {
      f.c.save();
      f.c.globalAlpha = qA;
      softPlate(f.c, qx, qy + 6, 520, 250, f.mood.ink, 0.35);
      softPlate(f.c, qx, qy - 10, 420, 150, f.mood.ink, 0.3);
      f.c.restore();
    }
    quoteCard(f.c, { quote: 'I was so taken by this that I never got over it.', speaker: 'Bernard Widrow', source: 'recalling it in 2005', x: qx, y: qy, width: 380, size: 25, maxChars: 30, at: b.fell - 0.05 }, tenv);
  },
});
