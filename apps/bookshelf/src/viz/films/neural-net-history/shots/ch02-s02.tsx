/**
 * ch02-s02 — the 1943 paper redrawn as paper lanterns on threads: a parchment plate in the lamp's pool
 * (candleAmber, plain cut in from the study: the camera's descent onto the desk continues the move).
 *
 * TEACHES the McCulloch–Pitts unit, every visual variable bound to the real rule:
 *   lit knot        ← an input of 1        bead of light ← that signal travelling its thread
 *   glow height     ← the summed input (one NOTCH per signal), tally marks count the arrivals
 *   ring (θ)        ← the threshold, cut at θ notches; the wick catches ONLY when the glow passes it,
 *                     and then all at once (never a half flame): all or nothing.
 * Beats, on the words:
 *   'forty-three' (stamp)  CHICAGO · 1943; the plate settles in the lamplight
 *   'switch' (oneIn)       input 1 lights, a bead runs in, the glow rises to just under the ring: an ember
 *   'All' (fire)           input 2 lights too: two signals, the glow passes the ring, the wick catches
 *   'nothing' (dark)       one input drops: the flame snaps dark
 *   'Enough' (threshold)   the ring brightens, θ appears, the rule writes in: fires if x₁ + x₂ ≥ θ;
 *                          the inputs replay and the wick catches on 'fired'
 *   'network'              pencil lanterns sketch the unit wired into a small network; a pulse on 'neural'
 *   'logic' − .46 (split)  the plate splits: AND (ring cut high, θ = 2) and OR (ring cut low, θ = 1)
 *   line end … 'or'        00, 10, 01, 11 play on both at once; truth tables build in ink; AND lights only
 *                          on 11, OR on 10, 01 and 11. The tables stay legible through the hold.
 */
import { Timeline } from '../../../core';
import { CAMERA3_HOME, LAYERS, defineShot, hash1, mixLab, placeStamp, withAlpha } from '../../../film';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { NOTCH, amberPlate, bead, deskTop, inkText, inputKnot, lanternShadow, paperAt, plateGlow, plateThread, ringFor, threadAt, thresholdLantern } from '../sets/ch02-s02-plate';
import { FONT, legibleSize } from '../../../film/silhouette/type';

type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const on = (t: number, a: number, b = Infinity) => (t >= a && t < b ? 1 : 0);

const DESK: LayerSpec = { id: 'desk', z: 1060, haze: 0.04, blur: 0.5 };
/** the far side of the desk: the rolltop's pigeonhole hood and the s01 lamp, seen only during the descent */
const HOOD: LayerSpec = { id: 'hood', z: 1250, haze: 0.12, blur: 1 };
const PLATE = { x: 92, y: 104, w: 1096, h: 514 };
/** a tighter pool than the plate: the parchment's corners fall off ~40% darker than its centre */
const POOL = { x: 690, y: 320, r: 560 };
const LAMP_AT = { x: 170, y: -250 };
/** the falloff rect: the plate and the desk around it, out past every camera's frame */
const FALL = { x: -260, y: -60, w: 1800, h: 860 };

// ------------------------------------------------------------------------------------------------ camera
// the descent: from the rolltop's hood and the lamp (top of frame) down onto the plate in the pool
const C0: Camera3 = { x: 640, y: 96, z: -430, lens: 1 };
const C1: Camera3 = { x: 652, y: 362, z: 40, lens: 1 };
const C2: Camera3 = { x: 690, y: 352, z: 110, lens: 1 };
// the pair: a ~12% push past the solo framing's step-back, so the two units and their tables fill the plate
const C3: Camera3 = { x: 660, y: 380, z: 134, lens: 1 };
const CAMS = [C0, C1, C2, C3];
function mixCam(a: Camera3, b: Camera3, u: number): Camera3 {
  // dolly via the action-plane scale (log), so the push feels even
  const sa = 1000 / (1000 - a.z), sb = 1000 / (1000 - b.z);
  const s = Math.exp(lerp(Math.log(sa), Math.log(sb), u));
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 1000 - 1000 / s, lens: 1 };
}

// ------------------------------------------------------------------------------------------------ geometry
interface Unit {
  lx: number;
  ly: number;
  r: number;
  k1: { x: number; y: number };
  k2: { x: number; y: number };
}
// the hero unit: 25% larger and centred on the plate, so the threshold ring is the clear subject
// (1.2x the first cut, with the input knots pulled in to ~26% of the frame so the left of the plate is not bare)
const SOLO: Unit = { lx: 724, ly: 328, r: 120, k1: { x: 338, y: 204 }, k2: { x: 338, y: 452 } };
// the pair, 1.3x the first cut (r 62 → 80) and lifted so the lanterns sit in the upper half under their cords
const AND_U: Unit = { lx: 352, ly: 300, r: 80, k1: { x: 168, y: 222 }, k2: { x: 168, y: 382 } };
const OR_U: Unit = { lx: 880, ly: 300, r: 80, k1: { x: 696, y: 222 }, k2: { x: 696, y: 382 } };
/** the OR unit unfolds rightward from a hinge just left of its knots (a paper cut opened out), 0.5 s */
const OR_HINGE = OR_U.k1.x - 18;
const UNFOLD_AT = 0.2;
const UNFOLD_DUR = 0.5;
/** the truth tables stand this far right of their lantern (clear of the θ glyph) */
const TABLE_DX = 150;
function lerpUnit(a: Unit, b: Unit, u: number): Unit {
  const lp = (p: { x: number; y: number }, q: { x: number; y: number }) => ({ x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u) });
  return { lx: lerp(a.lx, b.lx, u), ly: lerp(a.ly, b.ly, u), r: lerp(a.r, b.r, u), k1: lp(a.k1, b.k1), k2: lp(a.k2, b.k2) };
}
/** where thread i enters the lantern (its lower left flank) */
const entry = (u: Unit, i: 0 | 1) => ({ x: u.lx - u.r * 0.62, y: u.ly + (i === 0 ? -0.12 : 0.42) * u.r });
const thr = (u: Unit, i: 0 | 1) => {
  const k = i === 0 ? u.k1 : u.k2;
  const e = entry(u, i);
  return { x0: k.x + 10, y0: k.y, x1: e.x, y1: e.y, sag: i === 0 ? 14 : 4 };
};

// ------------------------------------------------------------------------------------------------ the beats as a pure state machine
interface Beats {
  stamp: number;
  one: number;
  fire: number;
  dark: number;
  thr: number;
  fired: number;
  net1: number;
  network: number;
  neural: number;
  split: number;
  /** the split starts here (it lands by `logic`, ~0.07 s before the word) */
  s0: number;
  /** the network interlude ends: the hero's inputs drop and the sketch clears (~0.6 s before s0) */
  netOff: number;
  pats: number[];
  D: number;
}
const BEAD = 0.34;
/** the pattern phase: short flights, 0.65 s per pattern from ~15.1 s, so 11 lands ~17.1 s and the full tables hold to the cut */
const BEAD_P = 0.2;
const PAT_STEP = 0.65;
/** the split's length: it must be complete before 'logic' is spoken */
const SPLIT_DUR = 0.55;

/** one input's signal: lit from `at` (knot), bead travelling for BEAD s, arrived after */
interface Sig {
  at: number;
  off: number;
}
/** solo-phase signals per input */
function soloSigs(b: Beats): [Sig[], Sig[]] {
  return [
    [
      { at: b.one - 0.04, off: b.dark - 0.04 },
      { at: b.fired - BEAD - 0.05, off: b.netOff },
    ],
    [{ at: b.fire - BEAD - 0.05, off: b.netOff }],
  ];
}
const PATS: [number, number][] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];
/** pattern-phase: input i of pattern p */
function patSigs(b: Beats): [Sig[], Sig[]] {
  const out: [Sig[], Sig[]] = [[], []];
  b.pats.forEach((at, p) => {
    const end = p < 3 ? b.pats[p + 1] - 0.06 : Infinity;
    PATS[p].forEach((v, i) => {
      if (v) out[i].push({ at, off: end });
    });
  });
  return out;
}
/** knot lit 0/1, bead position u (or −1), arrived 0/1 for a list of signals at time tq */
function sigState(sigs: Sig[], tq: number, fly = BEAD) {
  for (const s of sigs) {
    if (tq >= s.at && tq < s.off) {
      const u = (tq - s.at) / fly;
      return { knot: 1, bead: u < 1 ? u : -1, arrived: u >= 1 ? 1 : 0, at: s.at, fly };
    }
  }
  return { knot: 0, bead: -1, arrived: 0, at: -1, fly };
}

export default defineShot({
  id: 'ch02-s02',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const logic = T.word('L0204', 'logic');
    const s0 = logic - 0.67;
    const b: Beats = {
      stamp: T.beat('stamp'),
      one: T.beat('oneIn'),
      fire: T.beat('fire'),
      dark: T.beat('dark'),
      thr: T.beat('threshold'),
      fired: T.word('L0204', 'fired'),
      net1: T.word('L0204', 'network'),
      network: T.word('L0204', 'network#2'),
      neural: T.word('L0204', 'neural'),
      split: T.beat('split'),
      s0,
      netOff: s0 - 0.6,
      // 00, 10, 01, 11 at 0.65 s apart from ~0.3 s after 'logic' (once the OR unit has unfolded and both captions
      // are down); 11 lands ~17.1 s and the full tables hold to the cut
      pats: [0, 1, 2, 3].map((i) => Math.min(logic + 0.32, D - 0.75 - BEAD_P - 3 * PAT_STEP) + i * PAT_STEP),
      D,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = twos(t);
    const b = scene.b;

    // camera: the descent onto the desk, a slow push on the single unit, a step back for the pair
    let cam: Camera3;
    const camBack = b.s0 - 0.45;
    if (t < 3.0) cam = mixCam(C0, C1, sm(t / 3.0));
    else if (t < camBack) cam = mixCam(C1, C2, sm((t - 3.0) / (camBack - 3.0)));
    else cam = mixCam(C2, C3, sm((t - camBack) / 1.15));
    f.camera(cam);
    f.backlight({ intensity: 0.2 });

    // the far side of the desk (the s01 study's rolltop hood and its lamp), then the desk top and its pool
    if (t < 3.4) {
      f.layer(HOOD, (c, env) => {
        f.cached(`ch02-s02/hood/${env.mood.id}`, 2400, 760, (cc) => {
          cc.translate(700, 620);
          rolltopHood(cc, env);
        })(c, -700, -620);
      });
      f.practical({ x: LAMP_AT.x, y: LAMP_AT.y + 20, kind: 'lamp', seed: 2021, intensity: 0.9, radius: 90, layer: 'L3' });
    }
    f.layer(DESK, (c, env) => {
      deskTop(f, c, { x: -900, y: -40, w: 3100, h: 1440 }, 'ch02-s02', env, POOL);
      // the desk's back edge (a moulded lip) where the hood rises
      f.cached(`ch02-s02/lip/${env.mood.id}`, 3100, 40, (cc) => {
        cc.fillStyle = env.fill('ink');
        cc.fillRect(0, 0, 3100, 16);
        cc.fillStyle = withAlpha(env.mood.rim, 0.25);
        cc.fillRect(0, 16, 3100, 2);
      })(c, -900, -56);
    });

    // split progress (on twos: paper is cut and slid, not morphed)
    const sp = sm((tq - b.s0) / SPLIT_DUR);
    const unitA = lerpUnit(SOLO, AND_U, sp);
    // the OR unit: unfolded out of the plate to the right once the hero has slid clear (never two cages overlapping)
    const unf = sm((tq - b.s0 - UNFOLD_AT) / UNFOLD_DUR);
    const orA = Math.min(1, unf * 2.2);

    f.layer('L4', (c, env) => {
      amberPlate(f, c, { ...PLATE, key: 'ch02-s02', pool: POOL, seed: 1943, texture: { lamp: { x: 260, y: 40 }, crease: 0.36 } }, env);
      // the lamp's falloff over the parchment and the desk around it: the frame's corners fall ~55-60% darker
      // than the centre of the pool (an oval pool, wider than tall, like a shaded desk lamp's)
      f.cached(`ch02-s02/falloff3/${env.mood.id}`, FALL.w, FALL.h, (cc) => {
        cc.translate(-FALL.x, -FALL.y);
        cc.translate(POOL.x, POOL.y);
        cc.scale(1.25, 0.86);
        const g = cc.createRadialGradient(0, 0, 90, 0, 0, 760);
        g.addColorStop(0, withAlpha(env.mood.fg, 0));
        g.addColorStop(0.3, withAlpha(env.mood.fg, 0.1));
        g.addColorStop(0.6, withAlpha(env.mood.fg, 0.46));
        g.addColorStop(0.85, withAlpha(env.mood.fg, 0.66));
        g.addColorStop(1, withAlpha(env.mood.fg, 0.74));
        cc.fillStyle = g;
        cc.fillRect(-2000, -2000, 4000, 4000);
      }, { blur: 0 })(c, FALL.x, FALL.y);
      // ---- pencil sketch: the unit wired into a small network ("Wire such cells into a network")
      const sk = 1 - sm((t - b.netOff) / 0.45);
      if (t > b.net1 - 0.3 && sk > 0.01) wireNetwork(c, env, sk, t, b);
      // ---- cast shadows of the hanging lanterns on the parchment (the desk lamp is above, behind and to the left):
      // a soft ambient pool plus the lantern's own silhouette thrown ~12 px down-right at 20%
      castShadow(c, env, unitA, 0.6);
      lanternShadow(c, { x: unitA.lx, y: unitA.ly, r: unitA.r, hang: 120, dx: 12, dy: 12, alpha: 0.2 }, env);
      if (orA > 0.001) {
        c.save();
        unfoldAt(c, unf);
        castShadow(c, env, OR_U, 0.6 * orA);
        lanternShadow(c, { x: OR_U.lx, y: OR_U.ly, r: OR_U.r, hang: 120, dx: 12, dy: 12, alpha: 0.2 * orA }, env);
        c.restore();
      }
      // ---- the solo unit, then the AND unit (same paper, slid left)
      const solo = t < b.s0;
      const [s1, s2] = solo ? soloSigs(b) : patSigs(b);
      const fly = solo ? BEAD : BEAD_P;
      const a1 = sigState(s1, tq, fly);
      const a2 = sigState(s2, tq, fly);
      // the unlit paper skin: the lamplit parchment tone, a little shadowed (the skin warms it ~15% toward core)
      const paper = mixLab(paperAt(env, 0.8), env.mood.set, 0.22);
      // during the network interlude the θ glyph steps up and right, clear of the outgoing threads
      const thAt = solo ? sm((t - (b.net1 - 0.45)) / 0.4) : 0;
      const theta = solo ? 2 : 2;
      // ---- the OR unit: a second paper cut that UNFOLDS to the right (hinged at its left) while the hero slides
      // left to become AND; while it opens its back (the shadowed side of the fold) shows, then it lies flat
      if (orA > 0.001) {
        const [o1, o2] = patSigs(b);
        c.save();
        c.globalAlpha *= orA;
        unfoldAt(c, unf);
        unitDraw(c, env, OR_U, sigState(o1, tq, BEAD_P), sigState(o2, tq, BEAD_P), { theta: 1, ring: ringFor(1), ringGlow: 0.35, thetaA: 1, tallyA: 0, scaleA: 0, seed: 2, paper: mixLab(paper, env.mood.fg, 0.5 * (1 - unf)) });
        c.restore();
        if (unf < 0.98) {
          // the fold's crease at the hinge, fading as the cut lies flat
          c.save();
          c.strokeStyle = withAlpha(env.mood.ink, 0.5 * (1 - unf) * orA);
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(OR_HINGE, 150);
          c.lineTo(OR_HINGE, 450);
          c.stroke();
          c.restore();
        }
      }
      unitDraw(c, env, unitA, a1, a2, {
        theta,
        ring: ringFor(theta),
        // on 'Enough' (threshold): the ring brightens from ~0.17 s before the word, θ is written with it
        ringGlow: solo ? sm((t - b.thr + 0.2) / 0.25) * (1 - 0.6 * sm((t - b.thr - 1.2) / 0.8)) : 0.35,
        thetaA: solo ? sm((t - b.thr + 0.15) / 0.35) : 1,
        tallyA: solo ? 1 - sm((t - (b.s0 - 0.5)) / 0.3) : 0,
        scaleA: solo ? 1 - sm((t - (b.net1 - 0.45)) / 0.4) : 0,
        seed: 1,
        paper,
        thetaAt: { dx: 30 * thAt, dy: -30 * thAt },
      });
      // ---- type: the rule (equation), captions, truth tables
      // the rule writes in with the ring: fully in by ~0.45 s after 'Enough'
      const eqA = sm((t - b.thr + 0.1) / 0.35);
      // for the pair, the rule rides up ~30 px to sit under the lanterns
      if (eqA > 0.01) equation(c, env, 640, 600 - 30 * sp, eqA, t - b.thr + 0.1);
      if (sp > 0.01) {
        // captions and tables print only once the cut paper has stopped sliding (no type over moving art)
        const capA = sm((t - b.s0 - SPLIT_DUR) / 0.35);
        const capB = sm((t - b.s0 - UNFOLD_AT - UNFOLD_DUR) / 0.3);
        inkText(c, 'AND · θ = 2', AND_U.lx, 494, { size: 33, font: FONT.sc, weight: 700, tracking: 1.4, alpha: capA, stroke: 1.1 }, env);
        inkText(c, 'OR · θ = 1', OR_U.lx, 494, { size: 33, font: FONT.sc, weight: 700, tracking: 1.4, alpha: capB, stroke: 1.1 }, env);
        truthTable(c, env, AND_U.lx + TABLE_DX, 226, 2, b, tq, capA);
        truthTable(c, env, OR_U.lx + TABLE_DX, 226, 1, b, tq, capB);
      }
    });

    // near plane (L5, heavily blurred): the s01 study's inkwell with a dip pen at the bottom-left corner and a
    // fountain pen lying across the bottom-right; they rise into frame as the camera descends
    f.layer('L5', (c, env) => {
      lampHaze(c, env, t);
      f.cached(`ch02-s02/L5v2/${env.mood.id}`, 1500, 420, (cc) => {
        cc.translate(60, -440);
        nearDesk(cc, env);
      })(c, -60, 440);
      // the corner of a book stack on the near desk edge, top right, sliding up and out as the camera descends
      // (a third plane for the descent: near books / plate / the far rolltop)
      if (t < 3.2) {
        f.cached(`ch02-s02/L5books/${env.mood.id}`, BOOKS.w, BOOKS.h, (cc) => {
          cc.translate(-BOOKS.x, -BOOKS.y);
          nearBooks(cc, env);
        })(c, BOOKS.x, BOOKS.y);
      }
    });

    // screen-locked: the date stamp (top left, over the desk, clear of the plate)
    placeStamp(f.c, { place: 'Chicago', date: '1943', year: 1943, x: 48, y: 64, at: b.stamp, dur: b.s0 - 0.3 - b.stamp, fade: 0.5 }, { t, mood: f.mood, seed: 3 });
    void CAMERA3_HOME;
    void LAYERS;
    void CAMS;
  },
});

// ------------------------------------------------------------------------------------------------ painters
interface UnitStyle {
  theta: number;
  ring: number;
  ringGlow: number;
  thetaA: number;
  tallyA: number;
  /** the count scale beside the lantern (fades when the network is laid across where it stands) */
  scaleA: number;
  seed: number;
  paper?: string;
  thetaAt?: { dx: number; dy: number };
}
type SigS = ReturnType<typeof sigState>;
function unitDraw(c: C2, env: PaintEnv, u: Unit, a1: SigS, a2: SigS, st: UnitStyle) {
  const n = a1.arrived + a2.arrived;
  // the glow rises one notch per arrived signal (eased over ~0.25 s from the latest arrival)
  const lastArr = Math.max(a1.arrived ? a1.at + a1.fly : -9, a2.arrived ? a2.at + a2.fly : -9);
  const tq = twos(env.t);
  const rise = sm((tq - lastArr) / 0.25);
  const lvl = Math.max(0, (n - 1 + rise) * NOTCH) * (n > 0 ? 1 : 0);
  // all or nothing: the wick catches the instant the summed input reaches θ
  const fire = n >= st.theta ? 1 : 0;
  // threads + knots
  for (const i of [0, 1] as const) {
    const a = i === 0 ? a1 : a2;
    const o = thr(u, i);
    plateThread(c, { ...o, on: a.knot ? (a.bead >= 0 ? 0.25 : 0.7) : 0, w: 2.4 }, env);
    inputKnot(c, { x: (i === 0 ? u.k1 : u.k2).x, y: (i === 0 ? u.k1 : u.k2).y, on: a.knot, r: 11 }, env);
    if (a.bead >= 0) bead(c, threadAt(o, sm(a.bead)), 1, env, 6.5);
  }
  thresholdLantern(c, { x: u.lx, y: u.ly, r: u.r, level: fire ? 1 : lvl, ring: st.ring, ringGlow: st.ringGlow, fire, theta: st.thetaA, hang: 120, seed: st.seed, paper: st.paper, thetaAt: st.thetaAt, skin: true }, env);
  // the count of arrived signals lives only on the 1/2 scale beside the lantern (driven by the same arrival
  // signal as the glow, so it ticks the frame the bead lands)
  if (st.tallyA > 0.01 && st.scaleA > 0.01) {
    const arr = [a1, a2].filter((a) => a.arrived).map((a) => a.at + a.fly).sort((p, q) => p - q);
    countScale(c, env, u, n, arr.length ? arr[arr.length - 1] : -9, st.tallyA * st.scaleA);
  }
}

/** "fires if  x₁ + x₂ ≥ θ": set in ink, revealed left to right like a pen stroke */
const EQ_SIZE = 39;
/** the rule's runs: [text, scale, subscript]; subscripts at 70% so they stay legible at 1080p */
const EQ_RUNS: [string, number, boolean][] = [
  ['fires if  x', 1, false],
  ['1', 0.7, true],
  [' + x', 1, false],
  ['2', 0.7, true],
  [' ≥ θ', 1, false],
];
function equation(c: C2, env: PaintEnv, x: number, y: number, a: number, dt: number) {
  c.save();
  const font = (k: number) => `italic 400 ${EQ_SIZE * k}px ${FONT.text}`;
  const widths = EQ_RUNS.map(([s, k]) => {
    c.font = font(k);
    return c.measureText(s).width;
  });
  const w = widths.reduce((p, q) => p + q, 0);
  const k = sm(dt / 0.5);
  c.beginPath();
  c.rect(x - w / 2 - 10, y - 56, (w + 20) * k, 90);
  c.clip();
  let cx = x - w / 2;
  EQ_RUNS.forEach(([s, kk, sub], i) => {
    inkText(c, s, cx, y + (sub ? EQ_SIZE * 0.22 : 0), { size: EQ_SIZE * kk, italic: true, alpha: a, align: 'left' }, env);
    cx += widths[i];
  });
  c.restore();
}

/** a truth table built row by row as the patterns play: x₁ x₂ → out (a lit dot when it fires). The digits are
 *  sized to the legibility floor (22 px cap at 1080p, measured through the camera) and the table scales with them. */
function truthTable(c: C2, env: PaintEnv, x: number, y: number, theta: number, b: Beats, tq: number, a: number) {
  if (a <= 0.01) return;
  const P = env.mood;
  const dz = legibleSize(c, `400 26px ${FONT.typewriter}`, 26) + 1.2;
  const k = dz / 26;
  const rowH = 40 * k;
  const cx = x + 30 * k, ox = x + 94 * k, rule = x + 70 * k, right = x + 116 * k;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = withAlpha(P.ink, 0.7);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(x - 6, y - 6);
  c.lineTo(right, y - 6);
  c.moveTo(rule, y - 6);
  c.lineTo(rule, y + rowH * 4 - 6);
  c.stroke();
  inkText(c, 'x₁  x₂', cx, y - 14, { size: 32 * k, italic: true, alpha: 0.95 }, env);
  // the output column's head: a small ink flame (it reads "fires")
  c.fillStyle = P.ink;
  c.beginPath();
  c.moveTo(ox, y - 36 * k);
  c.bezierCurveTo(ox + 8 * k, y - 25 * k, ox + 7 * k, y - 14 * k, ox, y - 12 * k);
  c.bezierCurveTo(ox - 7 * k, y - 14 * k, ox - 8 * k, y - 25 * k, ox, y - 36 * k);
  c.fill();
  for (let p = 0; p < 4; p++) {
    const at = b.pats[p];
    // the row is written the instant its signals land (the same test as the wick: the bead has arrived)
    if (tq < at + BEAD_P - 1e-6) break;
    const ry = y + 22 * k + p * rowH;
    const [x1, x2] = PATS[p];
    inkText(c, `${x1}   ${x2}`, cx, ry, { size: dz, font: FONT.typewriter }, env);
    const out = x1 + x2 >= theta ? 1 : 0;
    inkText(c, String(out), ox, ry, { size: dz, font: FONT.typewriter }, env);
    if (out) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const r = 18 * k;
      const g = c.createRadialGradient(ox, ry - 9 * k, 0, ox, ry - 9 * k, r);
      g.addColorStop(0, withAlpha(P.core, 0.9));
      g.addColorStop(1, withAlpha(P.halo, 0));
      c.fillStyle = g;
      c.fillRect(ox - r, ry - 9 * k - r, 2 * r, 2 * r);
      c.restore();
    }
  }
  c.restore();
}

/** "Wire such cells into a network": three more lanterns cut in full ink to the right of the hero, threaded to it;
 *  on 'neural' its light runs on through them (beads hero → h1, h2 → o), each wick catching as a bead lands,
 *  so 'network' is SHOWN before the split */
const NET = { h1: { x: 1010, y: 222 }, h2: { x: 1010, y: 440 }, o: { x: 1128, y: 331 }, r: 38 };
function wireNetwork(c: C2, env: PaintEnv, a: number, t: number, b: Beats) {
  const tq = twos(t);
  // the paper cells are laid in from the first 'network', in full ink by the second
  const lay = (i: number) => sm((tq - (b.net1 - 0.2) - i * 0.28) / Math.max(0.3, b.network - b.net1 - 0.7));
  // the outgoing threads leave the lantern's right rim BELOW the threshold ring, clear of the θ glyph
  const hero = { x: SOLO.lx + SOLO.r * 0.74, y: SOLO.ly + 40 };
  const toH1 = { x0: hero.x, y0: hero.y, x1: NET.h1.x - NET.r * 0.7, y1: NET.h1.y + 22, sag: 8 };
  const toH2 = { x0: hero.x, y0: hero.y + 26, x1: NET.h2.x - NET.r * 0.75, y1: NET.h2.y - 6, sag: 4 };
  const h1o = { x0: NET.h1.x + NET.r * 0.75, y0: NET.h1.y + 8, x1: NET.o.x - NET.r * 0.75, y1: NET.o.y - 8, sag: 4 };
  const h2o = { x0: NET.h2.x + NET.r * 0.75, y0: NET.h2.y - 8, x1: NET.o.x - NET.r * 0.75, y1: NET.o.y + 8, sag: 2 };
  // the pulse: out of the hero on 'neural', landing on the second 'network'; then on to the output
  const fly1 = Math.max(0.25, b.network - b.neural);
  const u1 = (tq - b.neural) / fly1;
  const u2 = (tq - (b.network + 0.1)) / 0.36;
  // downstream cells only burn while the hero feeds them: when its inputs drop (split − 0.2) they go dark
  // a frame or two after it, in order (hidden layer, then output), before the sketch is cleared away
  const parentOff = b.netOff;
  const lit1 = u1 >= 1 && tq < parentOff + 0.04 ? 1 : 0;
  const lit2 = u2 >= 1 && tq < parentOff + 0.07 ? 1 : 0;
  const feed1 = u1 > 0 && tq < parentOff + 0.04 ? 0.6 : 0;
  const feed2 = u2 > 0 && tq < parentOff + 0.07 ? 0.6 : 0;
  c.save();
  c.globalAlpha *= a;
  for (const [o, i, on] of [[toH1, 0, feed1], [toH2, 0, feed1], [h1o, 1, feed2], [h2o, 1, feed2]] as const) {
    plateThread(c, { ...o, w: 2, draw: lay(i), on }, env);
  }
  for (const [p, i, f] of [[NET.h1, 0, lit1], [NET.h2, 0.5, lit1], [NET.o, 1.2, lit2]] as const) {
    lanternShadow(c, { x: p.x, y: p.y, r: NET.r, hang: 46, dx: 8, dy: 8, alpha: 0.18 * lay(i) }, env);
    thresholdLantern(c, { x: p.x, y: p.y, r: NET.r, level: 0, fire: f, alpha: lay(i), hang: 46, seed: 7 + i * 3, skin: true, paper: mixLab(paperAt(env, 0.8), env.mood.set, 0.22) }, env);
  }
  if (u1 > 0 && u1 < 1) {
    bead(c, threadAt(toH1, sm(u1)), 1, env, 5);
    bead(c, threadAt(toH2, sm(u1)), 1, env, 5);
  }
  if (u2 > 0 && u2 < 1) {
    bead(c, threadAt(h1o, sm(u2)), 1, env, 5);
    bead(c, threadAt(h2o, sm(u2)), 1, env, 5);
  }
  c.restore();
}

/** a small ink rule beside the lantern: ticks 1 and 2 at the glow heights one and two signals reach, a lit
 *  pointer at the current count; the θ ring sits just under tick 2, so the rule reads "fires at 2" */
function countScale(c: C2, env: PaintEnv, u: Unit, n: number, lastArr: number, alpha: number) {
  const P = env.mood;
  const H = u.r * 1.1;
  const yAt = (k: number) => u.ly + H - k * NOTCH * 2 * H;
  const x = u.lx + u.r * 1.62;
  const tq = twos(env.t);
  c.save();
  c.globalAlpha *= alpha;
  c.strokeStyle = P.ink;
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(x, yAt(0));
  c.lineTo(x, yAt(2.35));
  for (const k of [0, 1, 2]) {
    c.moveTo(x - 9, yAt(k));
    c.lineTo(x + 9, yAt(k));
  }
  c.stroke();
  for (const k of [1, 2]) inkText(c, String(k), x + 30, yAt(k) + 12, { size: 36, font: FONT.typewriter }, env);
  // the notch the count has reached lights (a scored mark on the scale), and the pointer snaps to it on the
  // frame the bead lands (the same arrival as the glow)
  for (const k of [1, 2]) {
    if (n >= k) {
      c.strokeStyle = P.ink;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x - 12, yAt(k));
      c.lineTo(x + 12, yAt(k));
      c.stroke();
    }
  }
  if (n > 0) {
    // snaps (paper is slid, not morphed): the same frame the wick reads the sum
    const py = yAt(Math.min(2, n));
    const fl = 1 - sm((tq - lastArr) / 0.6);
    if (fl > 0.01) plateGlow(c, x - 16, py, 26, P.core, 0.7 * fl);
    c.fillStyle = P.ink;
    c.beginPath();
    c.moveTo(x - 6, py);
    c.lineTo(x - 22, py - 8);
    c.lineTo(x - 22, py + 8);
    c.closePath();
    c.fill();
  }
  c.restore();
}

/** a faint drift of lamp haze across the plate: four large soft veils, slow (6-10 px/s), lit warmest nearest the
 *  lamp; low enough that the type under them stays crisp */
function lampHaze(c: C2, env: PaintEnv, t: number) {
  const P = env.mood;
  c.save();
  c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++) {
    const x = 160 + i * 330 + ((t * (6 + i * 1.5) + hash1(i, 41) * 300) % 600) - 200;
    const y = 180 + 110 * hash1(i, 43) + 26 * Math.sin(t * 0.21 + i * 1.7);
    const r = 260 + 80 * hash1(i, 47);
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.07 * (1 - 0.15 * i);
    g.addColorStop(0, withAlpha(mixLab(P.haze, P.halo, 0.35), a));
    g.addColorStop(0.6, withAlpha(P.haze, a * 0.4));
    g.addColorStop(1, withAlpha(P.haze, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.restore();
}

/** the OR unit's unfold: a horizontal scale about the hinge (on twos, via the caller's tq) */
function unfoldAt(c: C2, u: number) {
  c.translate(OR_HINGE, 0);
  c.scale(Math.max(0.001, u), 1);
  c.translate(-OR_HINGE, 0);
}

/** L5 near books (layer px): at the descent's first camera (k ≈ 0.6) they land in the frame's top-right corner */
const BOOKS = { x: 1130, y: -820, w: 1100, h: 560 };
function nearBooks(c: C2, env: PaintEnv) {
  const P = env.mood;
  // two closed volumes, the top one turned a little, seen end-on from the corner: spines and page blocks
  c.save();
  c.translate(1240, -380);
  c.rotate(-0.12);
  c.fillStyle = P.fg;
  c.beginPath();
  c.roundRect(0, -170, 900, 170, 10);
  c.fill();
  // page block edge (a lighter band between the boards), catching the lamp a little
  c.fillStyle = mixLab(P.fg, P.rim, 0.16);
  c.fillRect(14, -150, 880, 22);
  c.strokeStyle = withAlpha(P.rim, 0.28);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(4, -168);
  c.lineTo(4, -4);
  c.lineTo(890, -4);
  c.stroke();
  c.restore();
  c.save();
  c.translate(1330, -550);
  c.rotate(0.05);
  c.fillStyle = P.fg;
  c.beginPath();
  c.roundRect(0, -150, 820, 150, 10);
  c.fill();
  c.strokeStyle = withAlpha(P.rim, 0.22);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(4, -148);
  c.lineTo(4, -4);
  c.lineTo(810, -4);
  c.stroke();
  c.restore();
}

/** a soft shadow of a hanging lantern on the parchment, thrown away from the lamp above */
function castShadow(c: C2, env: PaintEnv, u: Unit, a: number) {
  if (a <= 0.01) return;
  const dx = u.lx - POOL.x, dy = u.ly - POOL.y + 90;
  const L = Math.hypot(dx, dy) || 1;
  const sx = u.lx + (dx / L) * u.r * 0.34, sy = u.ly + (dy / L) * u.r * 0.34 + u.r * 0.12;
  c.save();
  c.globalAlpha *= a;
  c.translate(sx, sy);
  c.scale(0.9, 1.15);
  const g = c.createRadialGradient(0, 0, u.r * 0.25, 0, 0, u.r * 1.3);
  g.addColorStop(0, withAlpha(env.mood.fg, 0.34));
  g.addColorStop(0.55, withAlpha(env.mood.fg, 0.18));
  g.addColorStop(1, withAlpha(env.mood.fg, 0));
  c.fillStyle = g;
  c.fillRect(-u.r * 1.4, -u.r * 1.4, u.r * 2.8, u.r * 2.8);
  c.restore();
}

/** the far side of the s01 study's desk: the rolltop's tambour and pigeonholes, the pleated lamp shade at left */
function rolltopHood(c: C2, env: PaintEnv) {
  const P = env.mood;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(-700, -620, 2400, 700);
  // tambour slats (rim cut-lines)
  c.strokeStyle = withAlpha(P.rim, 0.14);
  c.lineWidth = 1.2;
  c.beginPath();
  for (let y = -610; y < -540; y += 9) {
    c.moveTo(-160, y);
    c.lineTo(1480, y);
  }
  c.stroke();
  // pigeonholes: dim cells, papers and letters standing in them, lit a little by the lamp
  const cellW = 104, cellH = 92;
  for (let r = 0; r < 4; r++) {
    for (let k = 0; k < 15; k++) {
      const x = -150 + k * (cellW + 8), y = -520 + r * (cellH + 8);
      const near = Math.max(0, 1 - Math.hypot(x + 50 - LAMP_AT.x, y - LAMP_AT.y) / 900);
      c.fillStyle = mixLab(P.set, P.halo, 0.12 + 0.3 * near);
      c.fillRect(x, y, cellW, cellH);
      const h = hash1(r * 31 + k, 77);
      if (h > -0.3) {
        c.fillStyle = mixLab(P.set, P.rim, 0.25 + 0.3 * near);
        const pw = 30 + (h + 1) * 24;
        c.fillRect(x + 8 + (h + 1) * 10, y + cellH - 46 - (h + 1) * 14, pw, 46 + (h + 1) * 14);
        c.fillStyle = ink;
        c.fillRect(x + 8 + (h + 1) * 10 + pw, y + cellH - 40, 3, 40);
      }
    }
  }
  // the lamp (the study's pleated standard-lamp shade), lit from within
  const lx = LAMP_AT.x, ly = LAMP_AT.y;
  const sh = new Path2D();
  sh.moveTo(lx - 62, ly - 70);
  sh.lineTo(lx + 62, ly - 70);
  sh.lineTo(lx + 108, ly + 60);
  sh.lineTo(lx - 108, ly + 60);
  sh.closePath();
  const g = c.createLinearGradient(0, ly - 70, 0, ly + 60);
  g.addColorStop(0, mixLab(P.halo, P.set, 0.35));
  g.addColorStop(1, mixLab(P.halo, P.core, 0.4));
  c.fillStyle = g;
  c.fill(sh);
  c.strokeStyle = withAlpha(P.ink, 0.45);
  c.lineWidth = 1.4;
  c.beginPath();
  for (let i = -4; i <= 4; i++) {
    c.moveTo(lx + i * 14, ly - 70);
    c.lineTo(lx + i * 25, ly + 60);
  }
  c.stroke();
  c.fillStyle = ink;
  c.fillRect(lx - 112, ly + 56, 224, 7);
  c.fillRect(lx - 64, ly - 75, 128, 6);
  c.fillRect(lx - 6, ly + 63, 12, 400);
}

/** L5 near-desk objects (world coords, translated by the caller): an inkwell with a dip pen; a fountain pen */
function nearDesk(c: C2, env: PaintEnv) {
  const P = env.mood;
  c.fillStyle = P.fg;
  // inkwell: a squat square bottle with shoulders and a neck
  const ix = 166, iy = 640;
  c.beginPath();
  c.roundRect(ix - 64, iy - 46, 128, 92, 14);
  c.fill();
  c.beginPath();
  c.moveTo(ix - 52, iy - 46);
  c.quadraticCurveTo(ix - 40, iy - 66, ix - 22, iy - 70);
  c.lineTo(ix + 22, iy - 70);
  c.quadraticCurveTo(ix + 40, iy - 66, ix + 52, iy - 46);
  c.closePath();
  c.fill();
  c.fillRect(ix - 20, iy - 92, 40, 24);
  // the dip pen leaning out of it
  c.save();
  c.translate(ix + 4, iy - 80);
  c.rotate(0.5);
  c.beginPath();
  c.roundRect(-5, -190, 10, 200, 5);
  c.fill();
  c.restore();
  // lamp rim on the bottle's upper-left shoulder
  c.strokeStyle = withAlpha(P.rim, 0.28);
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(ix - 60, iy - 30);
  c.quadraticCurveTo(ix - 46, iy - 62, ix - 22, iy - 70);
  c.stroke();
  // the fountain pen, lying diagonally across the bottom-right corner
  c.save();
  c.translate(1118, 650);
  c.rotate(-0.42);
  c.fillStyle = P.fg;
  c.beginPath();
  c.roundRect(-210, -12, 300, 24, 12);
  c.fill();
  c.beginPath();
  c.moveTo(90, -10);
  c.lineTo(156, 0);
  c.lineTo(90, 10);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(P.rim, 0.24);
  c.fillRect(-210, -12, 300, 2.5);
  c.restore();
}
