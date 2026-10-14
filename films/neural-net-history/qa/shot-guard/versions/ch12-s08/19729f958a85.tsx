/**
 * ch12-s08 — the stampede through ChatGPT's door (Dec 2022 – Mar 2023), then the study: the case looks solved,
 * and is not (serverCyan → candleAmber; 17.50 s; in: crossfade from the study, candleAmber → serverCyan under it).
 *
 *   FAÇADE  -0.5   low on the street at the foot of a tall dark façade: ChatGPT's door, open, full of cool light,
 *                  the chat-box glyph as its fanlight; 'door' brightens it
 *         'stampede' figure-scale cut-paper runners already streaming in from both sides (from ~2.6 s), rimmed by the
 *                  door's light, short shadows on the pavement; after the word the camera pulls back and tilts up the
 *                  whole façade (a quicker 1.7 s ease, done just before 'hundred'); neighbours (L3), mist at the
 *                  door (fog), a kerb railing and a lamp post (L5) give the wide frame its depth
 *         'hundred' hundreds of tiny windows (and the blocks either side) flicker on at once, then settle dim,
 *                  leaving four large windows dark; label '~100M monthly users, Jan 2023 · an estimate' (to 'scatter')
 *         'rival'  (1) 21 DEC 2022: a low-chroma ember lamp comes on at the end of a long corridor, under a CODE RED
 *                  sign with its typed tag 'reported'
 *         'running' (2) 23 JAN 2023: a plain ledger page; the entry types itself: MICROSOFT · MULTIBILLION
 *         leak     (3) 24 FEB: a lantern tagged META is handed through a hatch to a few researchers
 *         scatter  ... → 3 MAR 2023: copies of its light scatter across the city like sparks, landing as lights
 *         'Claude' (4) 14 MAR 2023: two equal lanterns light at the same instant in two neighbouring panes
 *                  every date stamp types itself under its window and STAYS until the dissolve; from 'rival' the
 *                  camera pushes in on the block of four (to 1.16), settling just after the twin lanterns
 *   STUDY  sitBack a 0.25 s dissolve home (round 4 ghost fix; serverCyan → candleAmber under it, eased): the board, the X-ray box glowing
 *                  in its frame; a hand comes up from the bottom edge through the gap below the case card, tilts
 *                  WHO TAUGHT IT? a little, as if closing, and sits back; the board holds
 *   WALL  notQuite one continuous eased truck from the board right along to the Wall of Forecasts (~2 s), past Coulom's
 *                  glinting slip; Hinton's 2017 slip sinks into the dark beyond the lamp; W6 ends a third in from the
 *                  right, cut by a crisp lamp-shadow edge with only its lower corner lit (chapter 13 opens on it);
 *                  still drifting right at the cut
 *
 * Accent: the cool light of the door and the windows (serverCyan practicals); the ember is low-chroma by rule.
 * Text: the estimate label and the four date stamps only (the props carry their own lettering).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, LAYERS, defineShot, drawTracked, hash1, mixLab, softPlate, toLayer, toScreen, withAlpha } from '../../../film';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { hands } from '../cast';
import { HAND_LEN } from '../sets/narratorHands';
import { STUDY, STUDY_CAMS, studyCase, studyNear, studyRoom, wallSlotWorld } from '../sets/study';
import { boardStateAt, wallStateAt } from '../sets/studyState';
import { WALL, WALL_SLOTS, drawSlip } from '../sets/wallOfForecasts';
import { paperTone } from '../sets/caseBoard';
import { frameOn, kOf, mixFrame } from '../sets/ch09-s03a-kit';
import { compositeSub, subFrame, sm, tq12, win, lerp, clamp01 } from '../sets/ch02-s05b-util';
import {
  DOOR, EMBER, FAC, TINY, WINS, cityL2, corridor, doorLight, facadeWall, handover, handoverLantern, l3Windows, lampPost,
  ledgeVeil, ledger, midL3, midL3Lights, railL5, runners, sillLight, skylineL1, stampAt, street, tinyWindows, twinLanterns,
  type HandoverTimes,
} from '../sets/ch12-s08-facade';

type C = CanvasRenderingContext2D;
const ID = 'ch12-s08';

// ------------------------------------------------------------------------------------------------ cameras
/** low on the street: the lit doorway and the pavement in the lower half, the stampede at figure size */
const CAM_A0 = frameOn({ x: 640, y: 664 }, { x: 640, y: 452 }, 1.9);
const CAM_A = frameOn({ x: 640, y: 668 }, { x: 640, y: 458 }, 2.0);
/** the whole façade: the four large windows, the door at its foot, the roofline low enough for the sky label */
const CAM_B = frameOn({ x: 640, y: 372 }, { x: 640, y: 395 }, 0.92);
const CAM_B2 = frameOn({ x: 640, y: 372 }, { x: 640, y: 392 }, 0.935);
/** the push onto the block of four: all four stamps and the door's head still in frame; (round 1) closer (1.16), so the
 *  props' own lettering (CODE RED, reported, the ledger line, META) reads at the legibility floor */
const CAM_C = frameOn({ x: 640, y: 392 }, { x: 640, y: 352 }, 1.16);
const FACADE_CAMS = [CAM_A0, CAM_A, CAM_B, CAM_B2, CAM_C];
/** the kerb railing (L5) sits at the bottom edge of the pushed-in frame */
const RAIL_Y = toLayer(LAYERS.L5, CAM_C, 640, 702).y;
const RAIL_GAP = { x0: 640 - 92, x1: 640 + 92 };

/** the study, BOARD side: the case card left of centre, the X-ray box glowing in its frame at right */
const K_AT = { x: STUDY.board.x + 500 * STUDY.board.k, y: STUDY.board.y + 300 * STUDY.board.k };
const SB0 = frameOn(K_AT, { x: 500, y: 336 }, 1.0);
const SB1 = frameOn(K_AT, { x: 508, y: 340 }, 1.1);
/** the Wall: W6 a third in from the right at the cut (after the drift), Hinton's slip in the dark above right */
const W6_AT = wallSlotWorld('W6');
const DRIFT = 14; // world px of lateral drift along the Wall after the truck settles
/** (round 1) the end frame holds BOTH W6's half-lit corner and Hinton's 2017 slip (W7, above right), with Coulom's
 *  slip at left: ch13-s01 opens on this composition */
const WLE = frameOn({ x: W6_AT.x - DRIFT, y: W6_AT.y }, { x: 736, y: 506 }, 1.9);
const WL_FAR = { ...WLE, x: WLE.x + DRIFT };
const STUDY_CAMS_USED: Camera3[] = [SB0, SB1, WLE, WL_FAR, STUDY_CAMS.wall(0.5, 300)];
/** a blurred near shape for the Wall frames: the banker's lamp's shade edge, bottom right (L5) */
const SHADE_AT = toLayer(LAYERS.L5, WL_FAR, 930, 742);

const BOARD_END = boardStateAt(ID, 'end');
const WALL_END = wallStateAt(ID, 'end');
const K_DEF = BOARD_END.cards.find((c) => c.id === 'K')!;
const K_TILT = BOARD_END.kTilt; // −0.09 from this shot on (studyState)

// ------------------------------------------------------------------------------------------------ the sparks
interface Spark {
  /** target: a tiny window on the façade (L4) or a window on the neighbouring buildings either side (L3) */
  kind: 'tiny' | 'l3';
  idx: number;
  delay: number;
  flight: number;
  lift: number;
  /** a right-hand target: the spark climbs the left pier, leaps the roofline out of frame and drops in on the right,
   *  so it never crosses windows 1, 2 or 4 or their stamps */
  over: boolean;
}
const h01 = (i: number, s: number) => {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(s | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
};
const EMPTY = new Map<number, number>();
/** (round 5 review: the copies stayed over the left pier) the copies scatter across the whole street: two thirds
 *  to window 3's own neighbourhood (the façade's left pier and the neighbour to the left, on low arcs), a third
 *  over the roofline to the right pier and the neighbour to the right. Every target is checked to be in frame (and,
 *  for the neighbours, not hidden behind the façade) as the push settles; all have landed by ≈ 12.85 s */
function buildSparks(b: B): Spark[] {
  const out: Spark[] = [];
  const W3 = WINS[2];
  const pick = <T,>(pool: T[], n: number, seed: number, has: (p: T) => boolean, add: (p: T, k: number) => void) => {
    for (let k = 0; k < n && pool.length; k++) {
      const p = pool[Math.floor(h01(k, seed) * pool.length)];
      if (!has(p)) add(p, k);
    }
  };
  // left: the façade's left pier, beside window 3
  const left = TINY.map((w, i) => ({ w, i })).filter(({ w }) => w.x + w.w < W3.x - 6 && w.y > W3.y - 4 && w.y + w.h < W3.y + W3.h);
  pick(left, 18, 301, (p) => out.some((s) => s.kind === 'tiny' && s.idx === p.i), (p, k) =>
    out.push({ kind: 'tiny', idx: p.i, over: false, delay: 0.14 * h01(k, 302), flight: 0.42 + 0.2 * h01(k, 303), lift: 10 + 26 * h01(k, 304) }));
  // right: the façade's right pier, mid height
  const right = TINY.map((w, i) => ({ w, i })).filter(({ w }) => w.x >= 1020 && w.y > 170 && w.y < 540);
  pick(right, 8, 321, (p) => out.some((s) => s.kind === 'tiny' && s.idx === p.i), (p, k) =>
    out.push({ kind: 'tiny', idx: p.i, over: true, delay: 0.05 * h01(k, 322), flight: 0.6 + 0.08 * h01(k, 323), lift: 0 }));
  // the neighbours (L3), where they show past the façade both as the sparks land and at the end of the push
  const cams = [facadeCam(b, b.scatter + 0.75), CAM_C];
  const l3 = l3Windows(FACADE_CAMS)
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => !w.on && cams.every((cm) => {
      const p = toScreen(LAYERS.L3, cm, w.x + 7, w.y + 10);
      const q = toLayer(LAYERS.L4, cm, p.x, p.y);
      return p.x > 10 && p.x < 1270 && p.y > 100 && p.y < 590 && (q.x < FAC.x0 - 6 || q.x > FAC.x1 + 6);
    }));
  const has3 = (p: { i: number }) => out.some((s) => s.kind === 'l3' && s.idx === p.i);
  pick(l3.filter(({ w }) => w.side < 0), 7, 331, has3, (p, k) =>
    out.push({ kind: 'l3', idx: p.i, over: false, delay: 0.06 + 0.1 * h01(k, 332), flight: 0.5 + 0.12 * h01(k, 333), lift: 14 + 30 * h01(k, 334) }));
  pick(l3.filter(({ w }) => w.side > 0), 7, 341, has3, (p, k) =>
    out.push({ kind: 'l3', idx: p.i, over: true, delay: 0.06 * h01(k, 342), flight: 0.62 + 0.08 * h01(k, 343), lift: 0 }));
  return out;
}

// ------------------------------------------------------------------------------------------------ beats
interface B {
  D: number;
  door: number;
  pull0: number;
  pull1: number;
  push0: number;
  push1: number;
  hundred: number;
  w1: number;
  w2: number;
  w3: number;
  scatter: number;
  w4: number;
  ho: HandoverTimes;
  diss0: number;
  diss1: number;
  reach0: number;
  tilt0: number;
  tilt1: number;
  back0: number;
  back1: number;
  truck0: number;
  sparks: Spark[];
  copiesTiny: Map<number, number>;
  copiesL3: Map<number, number>;
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const sit = T.beat('sitBack');
    const leak = T.beat('leak');
    const scatter = T.beat('scatter');
    const hundred = T.beat('users');
    const ho: HandoverTimes = { in0: leak - 0.2, in1: leak + 0.3, take: leak + 0.5, out1: leak + 1.05 };
    const copiesTiny = new Map<number, number>();
    const copiesL3 = new Map<number, number>();
    // the pull-back waits until 'stampede' has been said, and lands just before 'hundred'
    const pull1 = hundred - 0.1;
    const pull0 = Math.max(T.wordEnd('L1219', 'stampede') + 0.15, pull1 - 1.75);
    const b: B = {
      D,
      door: T.word('L1219', 'door'),
      pull0,
      pull1,
      // (round 1) the push onto the block of four begins as the first window lights ('rival') and settles just after
      // the twin lanterns, a slow 4.5 s move that brings each window's lettering up to legible size as it lands
      push0: T.beat('codeRed') - 0.3,
      push1: T.beat('sameDay') + 0.5,
      hundred,
      w1: T.beat('codeRed'),
      w2: T.beat('investment'),
      w3: leak,
      scatter,
      w4: T.beat('sameDay'),
      ho,
      // home on 'sitBack': a short dissolve that lands as the hand arrives. Review round 4 (ghost-text audit: the 0.5 s
      // dissolve showed the façade's date stamps and ledger entry over the board's cards, both > 25 %, for 0.33 s): 0.25 s,
      // so the façade's words are gone four frames after the study passes 30 % (type kit rule)
      diss0: sit - 0.3,
      diss1: sit - 0.05,
      reach0: sit - 0.5,
      tilt0: sit - 0.02,
      tilt1: sit + 0.36,
      // (round 1) the hand is fully out of frame by ≈ 15.45 s, so 'looks solved' breathes before the truck
      back0: sit + 0.4,
      back1: sit + 0.8,
      // one continuous truck from the board to the Wall, carrying 'and is not', settled with time to hold the end frame
      truck0: T.beat('notQuite') - 0.24,
      sparks: [],
      copiesTiny,
      copiesL3,
    };
    b.sparks = buildSparks(b);
    for (const s of b.sparks) (s.kind === 'tiny' ? copiesTiny : copiesL3).set(s.idx, scatter + s.delay + s.flight);
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    if (t < b.diss0) {
      paintFacade(f, b, t);
    } else if (t < b.diss1) {
      const s = subFrame(f, `${ID}/study`, 'candleAmber', (g) => paintStudy(g, b, t));
      paintFacade(f, b, t);
      compositeSub(f, s, sm((t - b.diss0) / (b.diss1 - b.diss0)));
    } else {
      paintStudy(f, b, t);
    }
  },
});

// ================================================================================================ FAÇADE
/** hold low on the street through 'door' and 'stampede' (a slow push), then a quicker pull back and tilt up the whole
 *  façade, all in frame as 'a hundred million' lights it; a slight drift; then from the scatter a push onto the
 *  block of four that settles just after 'Claude' */
function facadeCam(b: B, t: number): Camera3 {
  if (t < b.pull0) return mixFrame(CAM_A0, CAM_A, sm((t + 0.5) / (b.pull0 + 0.5)));
  if (t < b.pull1) return mixFrame(CAM_A, CAM_B, ease3((t - b.pull0) / (b.pull1 - b.pull0)));
  if (t < b.push0) return mixFrame(CAM_B, CAM_B2, sm((t - b.pull1) / (b.push0 - b.pull1)));
  return mixFrame(CAM_B2, CAM_C, sm((t - b.push0) / (b.push1 - b.push0)));
}
const ease3 = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** a lamp coming on: two quick catches, then steady */
function catchOn(t: number, at: number) {
  const u = t - at;
  if (u < 0) return 0;
  if (u < 0.06) return 0.7;
  if (u < 0.12) return 0.12;
  if (u < 0.2) return 0.95;
  if (u < 0.25) return 0.45;
  return Math.min(1, 0.85 + u * 0.6);
}

function paintFacade(f: Frame, b: B, t: number) {
  const cam = facadeCam(b, t);
  const zoom = kOf(cam);
  f.camera(cam);
  // the crossfade in from the study: candleAmber → serverCyan under it (quantised: the static layers rebake per step)
  const mu = Math.round(sm((t + 0.5) / 1.0) * 10) / 10;
  if (mu < 1) f.setMood('serverCyan', { from: 'candleAmber', u: mu });
  else f.setMood('serverCyan');
  const tq = tq12(t);
  f.backlight({ sunX: 640, sunY: 470, sunRadius: 560, intensity: 0.42 });
  f.layer('L1', (c, env) => skylineL1(f, c, env, ID, FACADE_CAMS));
  f.layer('L2', (c, env) => cityL2(f, c, env, ID, FACADE_CAMS, t, b.hundred - 0.08, EMPTY));
  f.fog({ yCenter: 0.62 * 720, height: 0.42 * 720, alpha: 0.2, drift: 6 });
  // the neighbours: their windows join the users' flicker on 'hundred' and settle dim; the copies land there too
  f.layer('L3', (c, env) => {
    midL3(f, c, env, ID, FACADE_CAMS);
    midL3Lights(c, env, FACADE_CAMS, t, b.hundred - 0.08, b.copiesL3);
  });
  // fog B: a haze band at door height between the neighbours and the façade
  const doorY = toScreen(LAYERS.L4, cam, 640, DOOR.y + DOOR.h * 0.6).y;
  f.fog({ yCenter: doorY - 30 * zoom, height: 200 * zoom, alpha: 0.24, drift: 8 });

  // the windows' light levels
  const k1 = catchOn(t, b.w1 - 0.06);
  const k2 = sm((t - (b.w2 - 0.1)) / 0.25);
  const k3 = sm((t - (b.ho.in0 + 0.05)) / 0.3);
  const k4 = t >= b.w4 - 0.04 ? 1 : 0;
  const flare4 = k4 * (1 - sm((t - b.w4) / 0.9));
  const doorK = 0.72 + 0.28 * win(t, b.door - 0.1, b.door + 0.4);
  const typed2 = Math.max(0, (tq - (b.w2 + 0.22)) * 20);

  f.layer('L4', (c, env) => {
    street(c, env);
    // the four large windows' interiors (behind the wall's holes)
    const inWin = (i: number, draw: () => void) => {
      const w = WINS[i];
      c.save();
      c.translate(w.x, w.y);
      c.beginPath();
      c.rect(0, 0, w.w, w.h);
      c.clip();
      draw();
      c.restore();
    };
    inWin(0, () => corridor(c, env, WINS[0], k1, t));
    inWin(1, () => ledger(c, env, WINS[1], k2, typed2));
    inWin(2, () => handover(c, env, WINS[2], k3, b.ho, tq));
    c.save();
    c.translate(WINS[3].x, WINS[3].y);
    twinLanterns(c, env, WINS[3], k4, flare4, tq);
    c.restore();
    facadeWall(f, c, env, ID);
    // (round 5 review) the three full-width cut-lines ease in after the crossfade, not as scan lines over the study
    ledgeVeil(c, env, 1 - sm((t - 0.1) / 0.6));
    tinyWindows(c, env, t, b.hundred - 0.08, b.copiesTiny);
    // each lit window spills light onto the wall around it and throws a soft sill-light down the wall below
    const spill = (i: number, k: number, col: string) => {
      if (k <= 0.01) return;
      const w = WINS[i];
      glow(c, w.x + w.w / 2, w.y + w.h / 2, 300, col, 0.14 * k);
      sillLight(c, w, k, col);
    };
    spill(0, k1, EMBER.halo);
    spill(1, k2, env.mood.halo);
    spill(2, k3, env.mood.halo);
    spill(3, k4, env.mood.halo);
    doorLight(c, env, doorK, t);
    runners(c, env, tq, doorK);
    // the copies: sparks from the lantern in window 3, across the façade and the city
    sparks(c, env, b, t, cam);
  });
  f.rim({ x: 0, y: -1 });
  f.practical({ x: DOOR.x + DOOR.w / 2, y: DOOR.y + DOOR.h * 0.45, kind: 'screen', seed: 1281, intensity: 0.55 * doorK, radius: 46 });
  // a thin mist across the façade's foot, at door height (in front of the action plane, kept low so the runners stay sharp)
  f.fog({ yCenter: doorY + 18 * zoom, height: 90 * zoom, alpha: 0.13, drift: 11 });
  // L5: the lamp post, and the kerb railing once the frame is wide (it would fill the low street frame)
  const railA = clamp01((1.5 - zoom) / 0.25);
  f.layer('L5', (c, env) => {
    lampPost(f, c, env, ID, LAYERS.L5);
    if (railA > 0.01) {
      c.save();
      c.globalAlpha *= railA;
      railL5(f, c, env, ID, [CAM_B, CAM_C], RAIL_Y, RAIL_GAP);
      c.restore();
    }
  });

  // ---------------------------------------------------------------- type
  const c = f.c;
  // the one estimate label, on the sky above the roofline (inside title safe)
  const la = win(t, b.hundred - 0.05, b.hundred + 0.35) * (1 - win(t, b.scatter - 0.3, b.scatter + 0.1));
  if (la > 0) {
    c.save();
    c.globalAlpha = la;
    // (round 1) at the floor: 22 px Plex Mono ≈ 23 px cap height at 1080p, on a denser soft plate so it holds over the
    // cornice's brick and windows
    softPlate(c, 640, 70, 760, 58, '#03080b', 0.88);
    c.fillStyle = mixLab('#eef3f3', f.mood.core, 0.2);
    drawTracked(c, '~100M monthly users, Jan 2023 · an estimate', 640, 78, { font: `500 22px ${FONT.mono}`, size: 22, tracking: 0.02, align: 'center' });
    c.restore();
  }
  // the date stamps: each types itself under its window and stays; (round 5 review) the stamps leave 0.1 s ahead of the
  // sitBack dissolve (the dissolve itself unchanged), so no date ghosts over the board
  const sa = 1 - sm((t - (b.diss0 - 0.1)) / 0.1);
  if (sa <= 0) return;
  c.save();
  c.globalAlpha *= sa;
  stamp(f, cam, WINS[0], '21 DEC 2022', b.w1 + 0.1, t);
  stamp(f, cam, WINS[1], '23 JAN 2023', b.w2 + 0.1, t);
  stamp(f, cam, WINS[2], '24 FEB', b.w3 + 0.08, t, { tail: ' → 3 MAR 2023', at2: b.scatter + 0.05 });
  // (review r1: typed at 18 cps it was whole only ≈ 0.65 s before the dissolve) the last stamp is PRESSED whole on the
  // twin lanterns' beat, one strike with a small ink spread, so all four stamps read together for ≈ 1.2 s before the cut
  stamp(f, cam, WINS[3], '14 MAR 2023', b.w4, t, undefined, true);
  c.restore();
}

function stamp(f: Frame, cam: Camera3, w: (typeof WINS)[number], text: string, at: number, t: number, more?: { tail: string; at2: number }, press = false) {
  if (t < at) return;
  const tq = tq12(t);
  const cps = 18;
  const n1 = press ? text.length : Math.min(text.length, Math.floor((tq - at) * cps + 1e-6));
  const n2 = more && t >= more.at2 ? Math.min(more.tail.length, Math.floor((tq - more.at2) * cps + 1e-6)) : 0;
  const shown = text.slice(0, Math.max(0, n1)) + (more ? more.tail.slice(0, Math.max(0, n2)) : '');
  const full = text + (more ? more.tail : '');
  const p0 = stampAt(w);
  const p = toScreen(LAYERS.L4, cam, p0.x, p0.y);
  const c = f.c;
  c.save();
  // (round 1) at the floor: 22 px Plex Mono ≈ 23 px cap height at 1080p
  const size = 22;
  const font = `500 ${size}px ${FONT.mono}`;
  c.font = font;
  c.letterSpacing = `${0.08 * size}px`;
  const wFull = c.measureText(full).width;
  c.letterSpacing = '0px';
  softPlate(c, p.x, p.y - 7, wFull + 70, 44, '#03080b', 0.55 * (press ? 1 : win(t, at - 0.05, at + 0.25)));
  c.fillStyle = mixLab('#e6edee', f.mood.core, 0.22);
  if (press) {
    // the strike: the ink lands a hair heavy and spread, then settles to the type's own weight within ≈ 0.2 s
    const u = clamp01((t - at) / 0.2);
    if (u < 1) {
      c.save();
      c.shadowColor = withAlpha(mixLab('#e6edee', f.mood.core, 0.22), 0.6 * (1 - u));
      c.shadowBlur = 5 * (1 - u) * f.pxScale;
      drawTracked(c, shown, p.x - wFull / 2, p.y, { font, size, tracking: 0.08 });
      c.restore();
    }
  }
  // left-aligned from where the full text would start, so typing never shifts the letters already set
  drawTracked(c, shown, p.x - wFull / 2, p.y, { font, size, tracking: 0.08 });
  // a typed cursor while typing
  const typing = n1 < text.length || (more && t >= more.at2 && n2 < more.tail.length);
  if (typing) {
    c.font = font;
    c.letterSpacing = `${0.08 * size}px`;
    const ws = c.measureText(shown).width;
    c.letterSpacing = '0px';
    c.fillRect(p.x - wFull / 2 + ws + 1, p.y - size * 0.75, 2, size * 0.85);
  }
  c.restore();
}

/** sparks: the META lantern gathers a flare, then bursts: each spark flies to a tiny window on the façade (L4) or a
 *  window on the neighbouring buildings (L3), where it lands as a light that stays */
function sparks(c: C, env: PaintEnv, b: B, t: number, cam: Camera3) {
  if (t < b.scatter - 0.45) return;
  const L = handoverLantern(b.ho, tq12(t));
  const sx = WINS[2].x + L.x, sy = WINS[2].y + L.y;
  const m = env.mood;
  // the gathering flare (0.4 s), then the burst
  const gather = win(t, b.scatter - 0.42, b.scatter - 0.02);
  const fl = gather * (1 - win(t, b.scatter + 0.1, b.scatter + 0.8));
  if (fl > 0) {
    glow(c, sx, sy, 130, m.halo, 0.5 * fl);
    glow(c, sx, sy, 34, mixLab(m.core, '#ffffff', 0.3), 0.85 * fl);
  }
  if (t < b.scatter) return;
  // every spark is gone by ≈ 12.9 s, so the twin lanterns' 'same instant, equal size' beat reads clean
  const fade = 1 - sm((t - (b.w4 - 0.42)) / 0.26);
  if (fade <= 0) return;
  const l3 = l3Windows(FACADE_CAMS);
  const q2 = (p0: { x: number; y: number }, k: { x: number; y: number }, p1: { x: number; y: number }, e: number) => {
    const a = (1 - e) * (1 - e), bb = 2 * (1 - e) * e, cc = e * e;
    return { x: a * p0.x + bb * k.x + cc * p1.x, y: a * p0.y + bb * k.y + cc * p1.y };
  };
  /** the over-the-roof leap: up the left pier and out of frame (0-0.42), unseen over the roof, then down onto the
   *  target from above (0.56-1) */
  const RISE = 0.42, DROP = 0.56;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha *= fade;
  c.lineCap = 'round';
  for (const s of b.sparks) {
    const u = (t - b.scatter - s.delay) / s.flight;
    if (u <= 0 || u >= 1) continue;
    let tx: number, ty: number;
    if (s.kind === 'tiny') {
      const w = TINY[s.idx];
      tx = w.x + w.w / 2;
      ty = w.y + w.h / 2;
    } else {
      const w = l3[s.idx];
      const sp = toScreen(LAYERS.L3, cam, w.x + 7, w.y + 10);
      const lp = toLayer(LAYERS.L4, cam, sp.x, sp.y);
      tx = lp.x;
      ty = lp.y;
    }
    const at = (v: number): { x: number; y: number } | null => {
      if (!s.over) {
        const e = 1 - Math.pow(1 - v, 1.6);
        return q2({ x: sx, y: sy }, { x: (sx + tx) / 2 + (tx - sx) * 0.1, y: Math.min(sy, ty) - s.lift }, { x: tx, y: ty }, e);
      }
      if (v < RISE) {
        const e = Math.pow(v / RISE, 1.25);
        return q2({ x: sx, y: sy }, { x: 186, y: sy + 4 }, { x: 206, y: -60 }, e);
      }
      if (v < DROP) return null;
      const e = 1 - Math.pow(1 - (v - DROP) / (1 - DROP), 1.6);
      return q2({ x: tx - 34, y: -60 }, { x: tx - 8, y: (ty - 60) / 2 }, { x: tx, y: ty }, e);
    };
    const p = at(u);
    if (!p) continue;
    const a = Math.min(1, u * 6) * (0.7 + 0.3 * (1 - u));
    // the trail: two segments, fading back along the path
    // (the leap over the roof is fast: its trail is kept to the low arcs' length)
    const d1 = s.over ? 0.014 : 0.03, d2 = s.over ? 0.03 : 0.065;
    const q1 = at(Math.max(0, u - d1)), qq = at(Math.max(0, u - d2));
    if (q1 && qq) {
      c.strokeStyle = withAlpha(mixLab(m.core, m.halo, 0.25), 0.3 * a);
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(qq.x, qq.y);
      c.lineTo(q1.x, q1.y);
      c.stroke();
    }
    if (q1) {
      c.strokeStyle = withAlpha(mixLab(m.core, m.halo, 0.2), 0.65 * a);
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(q1.x, q1.y);
      c.lineTo(p.x, p.y);
      c.stroke();
    }
    glow(c, p.x, p.y, 22, m.halo, 0.7 * a);
    c.fillStyle = withAlpha(mixLab(m.core, '#ffffff', 0.35), a);
    c.beginPath();
    c.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ================================================================================================ STUDY: board → Wall
const TRUCK = 1.55;
const smoother = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (6 * x - 15) + 10);
};
/** the study camera: a slight push on the board through the hands' beat, a hold, then ONE continuous eased truck
 *  right along to the Wall (~1.8 s) that hands over to a slow lateral drift still moving at the cut */
function studyCam(b: B, t: number): { cam: Camera3; e: number } {
  const SBt = mixFrame(SB0, SB1, sm((t - b.diss0) / (b.truck0 - b.diss0)));
  if (t <= b.truck0) return { cam: SBt, e: 0 };
  const e = smoother((t - b.truck0) / TRUCK);
  const cam = mixFrame(SB1, WLE, e);
  // the drift along the Wall: eases in under the end of the truck, then constant to the cut
  const tau = t - (b.truck0 + 0.95);
  const v = DRIFT / Math.max(0.4, b.D - (b.truck0 + 0.95) - 0.3);
  const dx = tau <= 0 ? 0 : tau < 0.6 ? (v * tau * tau) / 1.2 : v * (tau - 0.3);
  return { cam: { ...cam, x: cam.x + dx }, e };
}

function paintStudy(g: Frame, b: B, t: number) {
  const { cam, e } = studyCam(b, t);
  g.camera(cam);
  // the tint crossfades from the façade's serverCyan to the study's candleAmber as the board comes into view (eased,
  // fine steps, so the grey middle passes quickly)
  const mu = Math.round(smoother((t - b.diss0) / 0.75) * 24) / 24;
  if (mu < 1) g.setMood('candleAmber', { from: 'serverCyan', u: mu });
  else g.setMood('candleAmber');
  studyRoom(g, { key: ID, cams: STUDY_CAMS_USED, outside: { mood: 'winterBlue', kind: 'night' } });
  const tq = tq12(t);
  const tilt = cardTilt(b, tq);
  // Coulom's pin catches the light as the camera passes it
  const g5 = win(e, 0.55, 0.75) * (1 - win(e, 0.9, 1.0) * 0.6);
  studyCase(g, {
    shot: ID,
    when: 'end',
    key: ID,
    board: { state: { ...BOARD_END, kTilt: tilt } },
    wall: { hide: ['W6', 'W7'], glint: { W5: 0.75 * g5 } },
    extra: (c, env) => drawHands(c, env, b, tq, cam, tilt),
  });
  // the far end of the Wall, beyond the lamp's reach (world-anchored, so it rides the truck)
  g.layer('L4', (c, env) => wallShade(c, env, e));
  studyNear(g, { key: ID, cams: STUDY_CAMS_USED, file: true });
  // the lamp shade's edge, near and soft, in the Wall frames
  if (e > 0.2) g.layer('L5', (c, env) => lampShade(c, env));
}

/** (round 1) the case card tilts a visible ≈ 7.7° under the finger, then settles at ≈ 6° (on twos) */
const K_PEAK = -0.135;
const K_SET = Math.min(K_TILT, -0.105);
function cardTilt(b: B, tq: number): number {
  if (tq <= b.tilt0) return 0;
  if (tq < b.tilt1) return K_PEAK * sm((tq - b.tilt0) / (b.tilt1 - b.tilt0));
  if (tq < b.back0) return K_PEAK;
  const r = tq - b.back0;
  return K_SET + (K_PEAK - K_SET) * Math.exp(-r * 5) * Math.cos(r * 13);
}

// ------------------------------------------------------------------------------------------------ the hand
/** a hand up from the bottom edge, through the gap below the case card, to its lower-right corner: nudge it a little
 *  askew, then withdraw back down out of frame */
function drawHands(c: C, env: PaintEnv, b: B, tq: number, cam: Camera3, tilt: number) {
  if (tq < b.reach0 || tq > b.back1 + 0.05) return;
  const scale = 0.7;
  const len = HAND_LEN * scale;
  // the card's lower-right corner, following the tilt (the card turns about its centre); the touch sits a little in
  // from the corner along the bottom edge, so the fingers stay clear of the 2012 card beside it
  const hw = (K_DEF.w / 2) * STUDY.board.k, hh = (K_DEF.h / 2) * STUDY.board.k;
  const corner = (th: number) => ({ x: K_AT.x + hw * Math.cos(th) - hh * Math.sin(th) - 46, y: K_AT.y + hw * Math.sin(th) + hh * Math.cos(th) - 4 });
  const touch = corner(tilt);
  const ts = toScreen(LAYERS.L4, cam, touch.x, touch.y);
  // the sleeve enters from the bottom edge, a little left of the corner (the gap between the card columns)
  let E = toLayer(LAYERS.L4, cam, ts.x - 72, 900);
  const below = toLayer(LAYERS.L4, cam, ts.x - 52, 800);
  const approach = { x: touch.x - 14, y: touch.y + 46 };
  let at: { x: number; y: number };
  let shape: 'rest' | 'press' | 'open' = 'open';
  if (tq < b.tilt0 - 0.14) {
    const u = sm((tq - b.reach0) / (b.tilt0 - 0.14 - b.reach0));
    at = { x: lerp(below.x, approach.x, u), y: lerp(below.y, approach.y, u) };
  } else if (tq < b.tilt0) {
    const u = sm((tq - b.tilt0 + 0.14) / 0.14);
    at = { x: lerp(approach.x, touch.x, u), y: lerp(approach.y, touch.y, u) };
    shape = 'press';
  } else if (tq < b.back0) {
    at = touch;
    shape = 'press';
  } else {
    // sit back: the hand lets go and the whole arm slides back down out of frame (rigid, so no elbow folds up into
    // the picture); fully gone by back1
    const u = sm((tq - b.back0) / (b.back1 - b.back0));
    const drop = toLayer(LAYERS.L4, cam, ts.x, ts.y + 760).y - touch.y;
    at = { x: touch.x - 10 * u, y: touch.y + drop * u };
    E = { x: E.x - 10 * u, y: E.y + drop * u };
    shape = u < 0.35 ? 'open' : 'rest';
  }
  const arm = hands.reach(E, at, shape, len, { bend: -0.36 });
  hands.draw(c, { right: arm, scale }, env);
}

// ------------------------------------------------------------------------------------------------ the Wall's far end
const WK = STUDY.wall.k;
const PANEL = { x: STUDY.wall.x - 6 * WK, y: STUDY.wall.y - 10 * WK, w: (WALL.w + 12) * WK, h: (WALL.h + 18) * WK };
const slotRect = (id: 'W6' | 'W7') => {
  const s = WALL_SLOTS[id];
  return { x: STUDY.wall.x + s.x * WK, y: STUDY.wall.y + s.y * WK, w: s.w * WK, h: s.h * WK, rot: hash1(['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].indexOf(id), 23) * 0.04 };
};
const W6R = slotRect('W6');
const W7R = slotRect('W7');
/** the lamp-shadow edge across W6 (world): from its left edge, 38% up, down to its bottom edge, 30% in */
const EDGE_P = { x: W6R.x - W6R.w / 2, y: W6R.y + W6R.h / 2 - 0.62 * W6R.h };
const EDGE_Q = { x: W6R.x - W6R.w / 2 + 0.3 * W6R.w, y: W6R.y + W6R.h / 2 };

function wallShade(c: C, env: PaintEnv, e: number) {
  const m = env.mood;
  farDark(c, env, e);
  // Hinton's 2017 slip, drawn dim: unvisited, at the far end
  const w7 = WALL_END.find((v) => v.slot === 'W7')!;
  // (round 1) dim, beyond the lamp, but still identifiable as Hinton's slip (its who-line can be made out)
  drawSlip(c, w7, { x: W7R.x, y: W7R.y, k: WK, light: 0.24 }, env);
  c.save();
  c.translate(W7R.x, W7R.y);
  c.rotate(W7R.rot);
  c.fillStyle = withAlpha(mixLab(m.set, m.fg, 0.35), 0.34);
  c.fillRect(-W7R.w / 2 - 2, -W7R.h / 2 - 2, W7R.w + 4, W7R.h + 4);
  c.restore();
  // the lamp's reach ends steeply past Coulom's slip: the far end sinks about two stops
  c.save();
  c.beginPath();
  c.rect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
  c.clip();
  const cx = STUDY.wall.x + 248 * WK, cy = STUDY.wall.y + 190 * WK;
  const r = c.createRadialGradient(cx, cy, 0, cx, cy, 300);
  r.addColorStop(0, withAlpha(m.fg, 0));
  r.addColorStop(0.5, withAlpha(m.fg, 0));
  r.addColorStop(0.62, withAlpha(m.fg, 0.4));
  r.addColorStop(0.76, withAlpha(m.fg, 0.58));
  r.addColorStop(1, withAlpha(m.fg, 0.86));
  c.fillStyle = r;
  c.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
  // the crisp lamp-shadow edge: everything right of the line through W6 sits in the shade's shadow (its top fades
  // out between the rows, so the line reads only where it cuts the lower row)
  const dx = EDGE_Q.x - EDGE_P.x, dy = EDGE_Q.y - EDGE_P.y;
  const n = Math.hypot(dx, dy);
  const ux = dx / n, uy = dy / n;
  const a = { x: EDGE_P.x - ux * 22, y: EDGE_P.y - uy * 22 };
  const z = { x: EDGE_Q.x + ux * 400, y: EDGE_Q.y + uy * 400 };
  const sg = c.createLinearGradient(0, a.y - 14, 0, a.y + 40);
  sg.addColorStop(0, withAlpha(m.fg, 0));
  sg.addColorStop(1, withAlpha(m.fg, 0.55));
  c.fillStyle = sg;
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(z.x, z.y);
  c.lineTo(PANEL.x + PANEL.w + 40, z.y);
  c.lineTo(PANEL.x + PANEL.w + 40, a.y - 14);
  c.lineTo(a.x + 20, a.y - 14);
  c.closePath();
  c.fill();
  c.restore();
  // W6: the slip in shadow, only the triangle of its lower-left corner below the edge lit; its type unreadable
  c.save();
  c.translate(W6R.x, W6R.y);
  c.rotate(W6R.rot);
  const w = W6R.w, h = W6R.h;
  c.fillStyle = withAlpha(m.fg, 0.3);
  c.fillRect(-w / 2 + 2 * WK, -h / 2 + 3 * WK, w, h);
  c.fillStyle = mixLab(mixLab(m.set, m.fg, 0.25), m.fg, 0.35);
  c.fillRect(-w / 2, -h / 2, w, h);
  // a ghost of type in the shadow (texture only)
  c.fillStyle = withAlpha(m.fg, 0.35);
  for (let i = 0; i < 3; i++) c.fillRect(-w * 0.36, -h * 0.18 + i * h * 0.17, w * (0.72 - i * 0.12), 1.4);
  // the lit corner (in slip-local coordinates; the edge rotates with the slip)
  const P = { x: -w / 2, y: h / 2 - 0.62 * h }, Q = { x: -w / 2 + 0.3 * w, y: h / 2 };
  c.beginPath();
  c.moveTo(P.x, P.y);
  c.lineTo(Q.x, Q.y);
  c.lineTo(-w / 2, h / 2);
  c.closePath();
  c.save();
  c.clip();
  const lg = c.createLinearGradient(-w / 2, h / 2, -w / 2 + 0.2 * w, h / 2 - 0.35 * h);
  lg.addColorStop(0, paperTone(env, 0.75));
  lg.addColorStop(1, paperTone(env, 0.5));
  c.fillStyle = lg;
  c.fillRect(-w / 2, -h / 2, w, h);
  // the ends of two typed lines in the lit corner: marks, not words
  c.fillStyle = withAlpha(m.ink, 0.45);
  c.fillRect(-w / 2 + 0.07 * w, h / 2 - 0.3 * h, 0.3 * w, 1.6);
  c.fillRect(-w / 2 + 0.07 * w, h / 2 - 0.15 * h, 0.22 * w, 1.6);
  c.restore();
  // the crisp edge itself catches a hair of light
  c.strokeStyle = withAlpha(m.rim, 0.35);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(P.x, P.y);
  c.lineTo(Q.x, Q.y);
  c.stroke();
  // the pin, dark
  c.fillStyle = mixLab(m.halo, m.fg, 0.75);
  c.beginPath();
  c.arc(0, -h / 2 + 6 * WK, 4 * WK, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** (round 5 review: flat grey-mauve room showed past the panel's edges in the end frames) the room beyond the lamp's
 *  reach is dark: a near-black falloff from the panel's right edge (feathered over ≈ 120 px) to the frame edge, and
 *  on the left, above the X-ray cabinet, as the truck passes it (world-anchored, so it rides the truck) */
const XRAY_TOP = 650 - 420 * 0.75;
function farDark(c: C, env: PaintEnv, e: number) {
  const ink = mixLab(env.mood.fg, '#050403', 0.55);
  const kR = sm((e - 0.45) / 0.4);
  if (kR > 0.01) {
    const R = PANEL.x + PANEL.w;
    const g = c.createLinearGradient(R - 6, 0, R + 120, 0);
    g.addColorStop(0, withAlpha(ink, 0));
    g.addColorStop(0.07, withAlpha(ink, 0.78 * kR));
    g.addColorStop(1, withAlpha(ink, 0.97 * kR));
    c.fillStyle = g;
    c.fillRect(R - 6, PANEL.y - 700, 126, PANEL.h + 1400);
    c.fillStyle = withAlpha(ink, 0.97 * kR);
    c.fillRect(R + 120, PANEL.y - 700, 1600, PANEL.h + 1400);
  }
  const kL = sm((e - 0.6) / 0.3);
  if (kL > 0.01) {
    const L = PANEL.x;
    const top = PANEL.y - 700, bot = XRAY_TOP + 6;
    c.save();
    c.beginPath();
    c.rect(L - 700, top, 718, bot - top);
    c.clip();
    const g = c.createLinearGradient(L - 140, 0, L + 18, 0);
    g.addColorStop(0, withAlpha(ink, 0.95 * kL));
    g.addColorStop(0.85, withAlpha(ink, 0.8 * kL));
    g.addColorStop(1, withAlpha(ink, 0));
    c.fillStyle = g;
    c.fillRect(L - 700, top, 718, bot - 40 - top);
    // feathered down into the cabinet's top so there is no hard horizontal
    for (let i = 0; i < 8; i++) {
      c.globalAlpha = 1 - (i + 0.5) / 8;
      c.fillRect(L - 700, bot - 40 + i * 5, 718, 5);
    }
    c.restore();
  }
}

/** the banker's lamp's shade, very near: a dark dome edging into the bottom right of the Wall frames (L5, blurred),
 *  its rolled rim catching the bulb's light */
function lampShade(c: C, env: PaintEnv) {
  const m = env.mood;
  const x = SHADE_AT.x, y = SHADE_AT.y;
  c.fillStyle = env.fill('fg');
  c.beginPath();
  c.ellipse(x, y, 40, 18, -0.1, Math.PI, Math.PI * 2);
  c.lineTo(x + 50, y + 60);
  c.lineTo(x - 50, y + 60);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 0.9;
  c.beginPath();
  c.ellipse(x, y, 40, 18, -0.1, Math.PI * 1.08, Math.PI * 1.7);
  c.stroke();
}
