/**
 * ch09-s06 — THE BROWSER'S RegExp IN ITS BOOTH (serverCyan, cut in from the reading head; 20.75 s).
 *   L0912 "The browser's pattern-matcher, RegExp, on one core: eight to twenty-eight milliseconds a keystroke. The
 *          search: eleven to fifteen."
 *   L0913 "One pattern makes it try every way back: over two seconds. The program never goes back: eleven milliseconds."
 *
 * Planes: L2 the search hall's window wall (shared), fog A, L3 the reading head from s05 small in the haze at the far
 * left (its strip still feeding forward) and the search map behind the gauges (every bead stepping), fog B, L4 the two
 * dial gauges on posts, the pattern field, and the cut-paper BOOTH (a ticket kiosk: a mechanical paper worker, an
 * automaton, at a spool winder with ONE shuttle on ONE thread; a ten-second hourglass on its roof; a trapdoor in its
 * floor), L5 the hall floor's near edge (soft). No loom appears in the booth.
 *
 * TEACHES, word by word:
 *   0 -> 6.4     the camera crabs right from the reading head to the booth; 'browser's' (0.81): the booth is in frame,
 *                its worker winding one document after another onto one spool; the scope label sets in.
 *   6.70 keystroke  both gauges flick and settle in their ranges (shaded on their faces, readouts 11–15 ms and
 *                8–28 ms): the ranges overlap, neither always wins; the needles keep wavering per keystroke.
 *   11.16 pattern   the pattern ([a-z]+)+x is typed into the field; the program's needle settles at 11.0 ms and stays;
 *                in the booth the shuttle runs back and forth over the same short stretch, faster and faster, and the
 *                spool swells into a tangle; the hourglass turns and its sand runs; RegExp's needle sweeps past its
 *                scale to the stop and its readout climbs to 2.1 s ('over two seconds' 14.05). The equation replaces
 *                the scope label.
 *   17.75 eleven    the program's readout catches the light (11.0 ms, long settled); the map's beads step on.
 *   19.55 trapdoor  the last sand falls (the page's limit); the trapdoor opens a crack and shuts; the worker and its
 *                tangled spool go dark. Nobody falls.
 * Numbers only from the script (JS11, JS12, JS16, JS26). One accent at most: the booth's warm lamp is muted to the
 * mood's own light; no saturated colour.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, PUPPET_NEAR_BLACK, defineShot, drawTracked, hash1, legibleSize, measureTracked, mixLab, softPlate, textProbe, textRole, textSwap, withAlpha } from '../../../film';
import { MAP, drawSearchMap, mapView, patternField, searchHallWall } from '../sets/ch09-s03-searchMap';
import { clamp01, lerp, seg, sm, smr, twos } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch09-s06';

// ---------------------------------------------------------------- geometry (L4 rest px)
const FLOOR = 566;
const BOOTH = { x0: 806, x1: 1086, top: 262, win: { x0: 836, x1: 1056, y0: 302, y1: 528 }, slab: 500 } as const;
const HG = { x: 946, y: 196 } as const;
const GAUGE = { r: 82, y: 330 } as const;
const G_PROG = { x: 372, lo: 11, hi: 15, name: 'this program' } as const;
const G_RE = { x: 598, lo: 8, hi: 28, name: 'RegExp' } as const;
/** the dial's scale: 0..30 ms over 240 degrees, from lower left (150 deg) clockwise to lower right (30 deg) */
const SCALE_MAX = 30;
const A0 = (150 * Math.PI) / 180;
const SWEEP = (240 * Math.PI) / 180;
const angOf = (ms: number) => A0 + (ms / SCALE_MAX) * SWEEP;
/** the stop pin past the scale's end */
const STOP_MS = 34.5;
const WORKER = { x: 888, foot: BOOTH.slab } as const;
const RAIL = { x0: 938, x1: 1034, y: 452 } as const;
const SPOOL = { x: 1010, y: 388, r: 26 } as const;
const TRAP = { x0: 944, x1: 1014 } as const;

interface Beats {
  D: number;
  booth: number;
  dials: number;
  back: number;
  over: number;
  prog: number;
  trap: number;
}

// ---------------------------------------------------------------- camera
const CAM_A: Camera3 = { x: 268, y: 372, z: 40, lens: 1 };
const CAM_B: Camera3 = { x: 640, y: 372, z: 60, lens: 1 };
const CAM_C: Camera3 = { x: 790, y: 372, z: 150, lens: 1 };
const CAM_D: Camera3 = { x: 650, y: 368, z: 76, lens: 1 };
const CAM_E: Camera3 = { x: 700, y: 370, z: 104, lens: 1 };
function camAt(t: number, b: Beats): Camera3 {
  const mix = (a: Camera3, z: Camera3, u: number): Camera3 => ({ x: lerp(a.x, z.x, u), y: lerp(a.y, z.y, u), z: lerp(a.z, z.z, u), lens: 1 });
  // the crab: a long, near-constant-speed truck with short eases (~6 % of frame width a second at most)
  const crab = (u: number) => {
    const e = 0.16;
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    const v = 1 / (1 - e);
    if (u < e) return (v * u * u) / (2 * e);
    if (u > 1 - e) return 1 - (v * (1 - u) * (1 - u)) / (2 * e);
    return v * (u - e / 2);
  };
  if (t < 6.3) return mix(CAM_A, CAM_B, crab(t / 6.3));
  if (t < b.back - 0.2) return CAM_B;
  if (t < b.back + 2.4) return mix(CAM_B, CAM_C, smr((t - b.back + 0.2) / 2.6));
  if (t < b.prog - 1.6) return CAM_C;
  if (t < b.prog + 0.2) return mix(CAM_C, CAM_D, smr((t - b.prog + 1.6) / 1.8));
  return mix(CAM_D, CAM_E, sm((t - b.prog - 0.2) / Math.max(0.1, b.D - b.prog - 0.2)));
}

/** the map behind the gauges (L3 rest px): left of the booth, its beads stepping in unison */
const MAP_L3 = mapView(640 / (MAP.cols * MAP.cw), (MAP.cols * MAP.cw) / 2, (MAP.rows * MAP.ch) / 2, { x: 470, y: 330 });

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      booth: T.beat('booth'),
      dials: T.beat('dials'),
      back: T.beat('backtrack'),
      over: T.word('L0913', 'over'),
      prog: T.beat('program'),
      trap: T.beat('trapdoor'),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(t, b);
    f.camera(cam);
    f.backlight({ sunX: 760, sunY: 360, intensity: 0.85 });
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 1800, 900, (cc) => {
        cc.translate(260, 100);
        searchHallWall(cc, env);
      })(c, -260, -100);
    });
    f.fog('A');
    const progLit = seg(t, b.prog - 0.1, b.prog + 0.3) * (1 - 0.5 * seg(t, b.prog + 1.2, b.prog + 2.2));
    f.layer('L3', (c, env) => {
      drawSearchMap(f, c, env, MAP_L3, {
        slot: Math.floor(Math.max(0, tq) * 4) % 513,
        matches: 1,
        sweepX: 99999,
        key: ID,
        alpha: 0.4,
        lockstep: { phase: Math.floor(tq * 12 + 1e-6), alpha: 0.25 + 0.45 * progLit },
      });
      headFar(c, env, tq);
      // the hall floor at the far plane
      c.fillStyle = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.3);
      c.fillRect(-400, 560, 2200, 400);
    });
    f.fog('B');

    const dark = seg(t, b.trap + 0.05, b.trap + 0.5);
    // the booth's lamp: behind the action plane's front face (inside the booth), dims as the worker is ended
    f.layer('L4', (c, env) => {
      floorL4(f, c, env);
      boothInterior(c, env, t, tq, b, dark);
      boothShell(f, c, env, t, b);
      hourglass(c, env, t, b);
      gauge(c, env, G_PROG, progNeedle(t, tq, b), progReadout(t, b), seg(t, b.dials - 0.05, b.dials + 0.35), progLit);
      gauge(c, env, G_RE, reNeedle(t, tq, b), reReadout(t, b), seg(t, b.dials - 0.05, b.dials + 0.35), 0);
      const typed = (twos(t) - (b.back - 0.25)) * 14;
      const text = t < b.back - 0.25 ? 'error' : '([a-z]+)+x';
      patternField(c, env, {
        x: 486,
        y: 168,
        w: 270,
        text,
        shown: t < b.back - 0.25 ? 99 : typed,
        alpha: seg(t, 1.0, 1.6),
        size: legibleSize(c, `500 21px ${FONT.mono}`, 21),
        t,
        key: ID,
        caret: t > b.back - 0.3 && t < b.back + 1.4,
      });
    });
    f.rim({ x: 0, y: -1 });
    if (dark < 1) f.practical({ x: 946, y: 318, kind: 'lamp', seed: 961, intensity: 0.42 * (1 - dark), radius: 70, layer: 'L4' });
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 2600, 400, (cc) => {
        cc.translate(700, -600);
        cc.fillStyle = PUPPET_NEAR_BLACK;
        cc.beginPath();
        cc.moveTo(-700, 640);
        cc.quadraticCurveTo(600, 622, 1900, 636);
        cc.lineTo(1900, 1000);
        cc.lineTo(-700, 1000);
        cc.closePath();
        cc.fill();
        cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.25);
        cc.lineWidth = 2;
        cc.beginPath();
        cc.moveTo(-700, 640);
        cc.quadraticCurveTo(600, 622, 1900, 636);
        cc.stroke();
      })(c, -700, 600);
    });
    labels(f, t, b);
  },
});

// ---------------------------------------------------------------- the needles and readouts
/** a seeded per-keystroke value inside [lo, hi] (a new keystroke every ~0.45 s, on twos) */
function wobble(tq: number, lo: number, hi: number, salt: number) {
  const k = Math.floor(tq / 0.45);
  const a = 0.5 + 0.5 * hash1(k, salt), z = 0.5 + 0.5 * hash1(k + 1, salt);
  const u = sm(clamp01((tq / 0.45 - k) * 3));
  return lo + (hi - lo) * lerp(a, z, u);
}
/** the flick on 'keystroke': up past the range's top, then down into it */
function flick(t: number, b: Beats, lo: number, hi: number, live: number) {
  const u = (t - b.dials + 0.05) / 0.6;
  if (u <= 0) return 0;
  if (u < 0.45) return (hi + 3) * smr(u / 0.45);
  if (u < 1) return lerp(hi + 3, live, smr((u - 0.45) / 0.55));
  return live;
}
function progNeedle(t: number, tq: number, b: Beats) {
  const live = wobble(tq, G_PROG.lo, G_PROG.hi, 17);
  if (t < b.back + 0.1) return flick(t, b, G_PROG.lo, G_PROG.hi, live);
  // on the new pattern it simply reads 11.0 and stops there
  return lerp(live, 11.0, smr((t - b.back - 0.1) / 0.35));
}
function reNeedle(t: number, tq: number, b: Beats) {
  const live = wobble(tq, G_RE.lo, G_RE.hi, 29);
  if (t < b.back + 0.3) return flick(t, b, G_RE.lo, G_RE.hi, live);
  // sweeps round past its scale to the stop pin and trembles there
  const u = smr((t - b.back - 0.3) / 1.6);
  const tremble = u >= 1 ? 0.35 * Math.sin(tq * 31) : 0;
  return lerp(live, STOP_MS, u) + tremble;
}
const progReadout = (t: number, b: Beats) => (t < b.dials ? '' : t < b.back + 0.4 ? '11–15 ms' : '11.0 ms');
function reReadout(t: number, b: Beats) {
  if (t < b.dials) return '';
  if (t < b.back + 0.3) return '8–28 ms';
  // climbs, exponentially, to 2.1 s just as 'over two seconds' is said
  const u = clamp01((t - b.back - 0.3) / (b.over + 0.5 - b.back - 0.3));
  const v = 28 * Math.pow(2100 / 28, u);
  return v < 1000 ? `${Math.round(v)} ms` : `${(Math.floor(v / 100) / 10).toFixed(1)} s`;
}

// ---------------------------------------------------------------- painters
const brass = (env: PaintEnv, k = 0) => mixLab(mixLab('#a8823e', env.mood.halo, 0.32), mixLab(env.mood.core, '#f3dfae', 0.5), k);
const facePaper = (env: PaintEnv) => mixLab(mixLab('#e3ebe6', env.mood.rim, 0.4), env.mood.haze, 0.12);
const faceInk = (env: PaintEnv) => mixLab('#18211f', env.mood.ink, 0.3);
const setInk = (env: PaintEnv) => mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.35);
function lw(c: C2, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}

/** L3: the reading head from s05, small in the haze at the far left, its strip feeding forward (rightward) */
function headFar(c: C2, env: PaintEnv, tq: number) {
  const ink = env.fill('ink');
  const x = 70, y0 = 330, y1 = 560;
  c.fillStyle = ink;
  c.fillRect(x - 40, y0, 8, y1 - y0);
  c.fillRect(x + 32, y0, 8, y1 - y0);
  c.fillRect(x - 50, y0 - 12, 100, 12);
  // the ratchet
  c.save();
  c.translate(x + 64, y0 - 6);
  c.rotate(Math.floor(tq * 12) * ((Math.PI * 2) / 24));
  c.beginPath();
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 1) / 24) * Math.PI * 2;
    c.lineTo(Math.cos(a0) * 22, Math.sin(a0) * 22);
    c.lineTo(Math.cos(a1 - 0.03) * 27, Math.sin(a1 - 0.03) * 27);
  }
  c.closePath();
  c.fillStyle = mixLab(brass(env, 0), env.mood.haze, 0.35);
  c.fill();
  c.restore();
  // the strip: a pale band through the head, its cells ticking right one per tick
  const sy = 430;
  c.fillStyle = mixLab(facePaper(env), env.mood.haze, 0.3);
  c.fillRect(-500, sy, 840, 34);
  c.fillStyle = withAlpha(faceInk(env), 0.25);
  const off = (Math.floor(tq * 12) % 2) * 20;
  for (let k = -26; k < 18; k++) c.fillRect(k * 20 + off - 0.5, sy, 1, 34);
  // the strip ends in the haze to the right (fades)
  const g = c.createLinearGradient(220, 0, 340, 0);
  g.addColorStop(0, withAlpha(env.mood.haze, 0));
  g.addColorStop(1, env.mood.haze);
  c.fillStyle = g;
  c.fillRect(220, sy - 2, 122, 38);
}

/** L4 floor: the hall floor the posts and booth stand on */
function floorL4(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/floor/${env.mood.id}`, 2400, 200, (cc) => {
    cc.translate(600, -FLOOR);
    cc.fillStyle = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.55);
    cc.fillRect(-600, FLOOR, 2400, 200);
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.4);
    cc.lineWidth = 1.5;
    cc.beginPath();
    cc.moveTo(-600, FLOOR);
    cc.lineTo(1800, FLOOR);
    cc.stroke();
  })(c, -600, FLOOR);
}

/** the booth's inside (seen through its ticket window): a lit back wall, the slab floor with its trapdoor, the
 *  automaton worker, the spool winder, its one shuttle on one thread */
function boothInterior(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, dark: number) {
  const W = BOOTH.win;
  const lit = 1 - dark;
  // back wall: pale paper lit by the booth's lamp (falls to the set colour when the worker is ended)
  const g = c.createRadialGradient(946, 330, 10, 946, 360, 220);
  g.addColorStop(0, mixLab(mixLab(facePaper(env), env.mood.set, 0.25), env.mood.set, 0.85 * dark));
  g.addColorStop(1, mixLab(mixLab(env.mood.setHaze, env.mood.set, 0.3), env.mood.set, 0.7 * dark));
  c.fillStyle = g;
  c.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
  // the shuttle's motion: calm, then (on the new pattern) back and forth over the same short stretch, faster and faster
  const tangleU = clamp01((tq - b.back - 0.15) / 3.2);
  const calmPh = tq * 1.15 * Math.PI * 2;
  let phase = calmPh;
  let amp = (RAIL.x1 - RAIL.x0) * 0.42;
  if (t > b.back + 0.15) {
    const s = Math.min(tq, b.trap + 0.05) - (b.back + 0.15);
    // frequency 1.15 -> 3.4 Hz over 3 s (on twos; past ~4 Hz it would alias)
    const f0 = 1.15, f1 = 3.4, T3 = 3;
    const ph = s < T3 ? f0 * s + ((f1 - f0) * s * s) / (2 * T3) : f0 * T3 + ((f1 - f0) * T3) / 2 + f1 * (s - T3);
    phase = (b.back + 0.15) * 1.15 * Math.PI * 2 + ph * Math.PI * 2;
    amp = lerp(amp, 11, smr(tangleU));
  }
  const cxRail = lerp((RAIL.x0 + RAIL.x1) / 2, RAIL.x0 + 30, smr(tangleU));
  const sx = cxRail + amp * Math.sin(phase);
  // the slab floor (with the trapdoor between worker and winder)
  const ink = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.15 * lit);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(W.x0, BOOTH.slab + 9, W.x1 - W.x0, W.y1 - BOOTH.slab - 9);
  c.fillStyle = ink;
  c.fillRect(W.x0, BOOTH.slab, TRAP.x0 - W.x0, 9);
  c.fillRect(TRAP.x1, BOOTH.slab, W.x1 - TRAP.x1, 9);
  // the trapdoor: hinged at its left end, opens a crack and shuts
  const open = Math.sin(Math.PI * clamp01((t - b.trap) / 0.6)) * 0.42;
  c.save();
  c.translate(TRAP.x0, BOOTH.slab);
  c.rotate(open);
  c.fillRect(0, 0, TRAP.x1 - TRAP.x0, 9);
  c.restore();
  if (open > 0.01) {
    // the dark below the crack
    c.fillStyle = withAlpha('#000000', 0.9);
    c.beginPath();
    c.moveTo(TRAP.x0, BOOTH.slab + 9);
    c.lineTo(TRAP.x1, BOOTH.slab + 9);
    c.lineTo(TRAP.x0 + Math.cos(open) * (TRAP.x1 - TRAP.x0), BOOTH.slab + Math.sin(open) * (TRAP.x1 - TRAP.x0));
    c.closePath();
    c.fill();
  }
  // the winder's stand and the spool
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(SPOOL.x - 3, SPOOL.y, 6, BOOTH.slab - SPOOL.y);
  c.fillRect(RAIL.x0, RAIL.y, RAIL.x1 - RAIL.x0, 3);
  c.fillRect(RAIL.x0 - 2, RAIL.y, 4, BOOTH.slab - RAIL.y);
  c.fillRect(RAIL.x1 - 2, RAIL.y, 4, BOOTH.slab - RAIL.y);
  // the supply cone (documents' thread) on the slab at the left of the rail
  c.beginPath();
  c.moveTo(RAIL.x0 + 6, BOOTH.slab);
  c.lineTo(RAIL.x0 + 14, BOOTH.slab - 26);
  c.lineTo(RAIL.x0 + 22, BOOTH.slab);
  c.closePath();
  c.fill();
  const threadC = withAlpha(mixLab(facePaper(env), env.mood.core, 0.3), 0.9 * (0.4 + 0.6 * lit));
  // ONE thread: cone -> shuttle -> spool
  c.strokeStyle = threadC;
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  c.moveTo(RAIL.x0 + 14, BOOTH.slab - 26);
  c.lineTo(sx, RAIL.y - 4);
  c.lineTo(SPOOL.x, SPOOL.y + SPOOL.r * 0.6);
  c.stroke();
  // the spool: flanges, its wound thread (one document after another), swelling into a tangle
  const wound = 9 + 4 * clamp01(t / b.back);
  const spin = tq * 6;
  c.save();
  c.translate(SPOOL.x, SPOOL.y);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-SPOOL.r - 2, -3, 2 * SPOOL.r + 4, 6);
  c.beginPath();
  c.arc(0, 0, wound, 0, Math.PI * 2);
  c.fillStyle = mixLab(threadC, env.mood.set, 0.3);
  c.fill();
  // neat winding rings (before the tangle)
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
  c.lineWidth = lw(c, 0.8);
  for (let r = 4; r < wound; r += 3) {
    c.beginPath();
    c.arc(0, 0, r, spin, spin + Math.PI * 1.6);
    c.stroke();
  }
  // flanges (seen face-on: rings with spokes)
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = lw(c, 2.2);
  c.beginPath();
  c.arc(0, 0, SPOOL.r, 0, Math.PI * 2);
  c.stroke();
  for (let i = 0; i < 4; i++) {
    const a = spin + (i * Math.PI) / 2;
    c.beginPath();
    c.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
    c.lineTo(Math.cos(a) * SPOOL.r, Math.sin(a) * SPOOL.r);
    c.stroke();
  }
  // the tangle: loops over loops, growing (seeded, on twos)
  const nT = Math.floor(46 * smr(tangleU));
  if (nT > 0) {
    c.strokeStyle = withAlpha(mixLab(threadC, env.mood.set, 0.15), 0.85 * (0.45 + 0.55 * lit));
    c.lineWidth = lw(c, 1.1);
    const R = SPOOL.r * (0.7 + 1.1 * smr(tangleU));
    const jig = Math.floor(tq * 12) % 3;
    for (let i = 0; i < nT; i++) {
      const a = (hash1(i, 71) + 1) * Math.PI + jig * 0.04;
      const rr = R * (0.45 + 0.55 * (0.5 + 0.5 * hash1(i, 73)));
      const ex = rr * (0.5 + 0.5 * (0.5 + 0.5 * hash1(i, 75)));
      c.beginPath();
      c.ellipse(Math.cos(a) * rr * 0.35, Math.sin(a) * rr * 0.35, ex, rr * 0.55, a, 0, Math.PI * 2);
      c.stroke();
    }
  }
  c.restore();
  // the shuttle: a small paper boat with a pale bobbin, on the rail
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(sx - 13, RAIL.y);
  c.quadraticCurveTo(sx, RAIL.y - 13, sx + 13, RAIL.y);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(facePaper(env), 0.8 * (0.5 + 0.5 * lit));
  c.fillRect(sx - 4, RAIL.y - 7, 8, 3);
  // the worker: an automaton (a mechanical paper figure on a pedestal, riveted joints), its arm on the shuttle
  automaton(c, env, sx, tq, lit);
  // when the page ends it, the booth goes dark: a veil over the interior
  if (dark > 0) {
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.72 * dark);
    c.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
  }
}

/** the automaton: pedestal, a cylinder body, a round head on a neck rod, one jointed arm reaching the shuttle */
function automaton(c: C2, env: PaintEnv, sx: number, tq: number, lit: number) {
  const x = WORKER.x, y = WORKER.foot;
  const ink = PUPPET_NEAR_BLACK;
  c.fillStyle = ink;
  // pedestal
  c.fillRect(x - 16, y - 12, 32, 12);
  c.fillRect(x - 6, y - 40, 12, 30);
  // body: a tapered cylinder with a waist band
  const nod = 0.04 * Math.sin(tq * 4.3);
  c.save();
  c.translate(x, y - 40);
  c.rotate(nod);
  c.beginPath();
  c.moveTo(-16, 0);
  c.lineTo(-19, -62);
  c.quadraticCurveTo(0, -72, 19, -62);
  c.lineTo(16, 0);
  c.closePath();
  c.fill();
  // neck rod and head
  c.fillRect(-2.5, -82, 5, 14);
  c.beginPath();
  c.arc(2, -94, 14, 0, Math.PI * 2);
  c.fill();
  // cut-lines: a seam round the head, the waist band, rivets (light through)
  const cut = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55 * (0.4 + 0.6 * lit));
  c.strokeStyle = cut;
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.arc(2, -94, 9, -Math.PI * 0.9, -Math.PI * 0.1);
  c.moveTo(-17, -30);
  c.lineTo(17, -30);
  c.stroke();
  c.fillStyle = cut;
  for (const [rx, ry] of [[-10, -50], [10, -50], [-10, -12], [10, -12]]) {
    c.beginPath();
    c.arc(rx, ry, 1.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // the arm: shoulder -> elbow -> hand on the shuttle (two rigid paper segments, a riveted elbow)
  const sh = { x: x + 14, y: y - 92 };
  const hand = { x: sx - 2, y: RAIL.y - 10 };
  const L1 = 40, L2 = 44;
  const dx = hand.x - sh.x, dy = hand.y - sh.y;
  const d = Math.min(L1 + L2 - 1, Math.hypot(dx, dy));
  const a = Math.atan2(dy, dx);
  const cosE = clamp01((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const e = a - Math.acos(cosE);
  const el = { x: sh.x + Math.cos(e) * L1, y: sh.y + Math.sin(e) * L1 };
  const hd = { x: el.x + ((hand.x - el.x) / Math.hypot(hand.x - el.x, hand.y - el.y)) * L2, y: el.y + ((hand.y - el.y) / Math.hypot(hand.x - el.x, hand.y - el.y)) * L2 };
  c.strokeStyle = ink;
  c.lineCap = 'round';
  c.lineWidth = 8;
  c.beginPath();
  c.moveTo(sh.x, sh.y);
  c.lineTo(el.x, el.y);
  c.stroke();
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(el.x, el.y);
  c.lineTo(hd.x, hd.y);
  c.stroke();
  c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.6 * (0.4 + 0.6 * lit));
  c.beginPath();
  c.arc(el.x, el.y, 1.8, 0, Math.PI * 2);
  c.fill();
}

/** the booth's shell: a cut-paper kiosk with its ticket window (a hole), a peaked roof with a pierced valance */
function boothShell(f: Frame, c: C2, env: PaintEnv, t: number, b: Beats) {
  f.cached(`${ID}/booth/${env.mood.id}`, 360, 420, (cc) => {
    cc.translate(-BOOTH.x0 + 40, -BOOTH.top + 90);
    const ink = setInk(env);
    const W = BOOTH.win;
    const body = new Path2D();
    body.rect(BOOTH.x0, BOOTH.top, BOOTH.x1 - BOOTH.x0, FLOOR - BOOTH.top);
    body.rect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    cc.fillStyle = ink;
    cc.fill(body, 'evenodd');
    // panel lines on the lower front
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.set, 0.4), 0.22);
    cc.lineWidth = 1.2;
    cc.strokeRect(BOOTH.x0 + 12, W.y1 + 8, BOOTH.x1 - BOOTH.x0 - 24, FLOOR - W.y1 - 16);
    // the window's sill and frame
    cc.fillStyle = mixLab(ink, PUPPET_NEAR_BLACK, 0.4);
    cc.fillRect(W.x0 - 8, W.y1, W.x1 - W.x0 + 16, 8);
    // the roof: a shallow peak with eaves, over a pierced valance (a row of round holes, backlight through)
    const roof = new Path2D();
    roof.moveTo(BOOTH.x0 - 24, BOOTH.top + 4);
    roof.lineTo((BOOTH.x0 + BOOTH.x1) / 2, BOOTH.top - 46);
    roof.lineTo(BOOTH.x1 + 24, BOOTH.top + 4);
    roof.closePath();
    cc.fill(roof);
    const val = new Path2D();
    val.rect(BOOTH.x0 - 18, BOOTH.top + 2, BOOTH.x1 - BOOTH.x0 + 36, 16);
    for (let x = BOOTH.x0 - 8; x < BOOTH.x1 + 14; x += 16) {
      val.moveTo(x + 3.2, BOOTH.top + 10);
      val.arc(x, BOOTH.top + 10, 3.2, 0, Math.PI * 2);
    }
    cc.fill(val, 'evenodd');
    // the scalloped lower edge of the valance
    cc.beginPath();
    for (let x = BOOTH.x0 - 18; x < BOOTH.x1 + 18; x += 16) {
      cc.moveTo(x, BOOTH.top + 18);
      cc.arc(x + 8, BOOTH.top + 18, 8, Math.PI, 0, true);
    }
    cc.fill();
    // top rims (light from above)
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
    cc.lineWidth = 1.6;
    cc.beginPath();
    cc.moveTo(BOOTH.x0 - 24, BOOTH.top + 4);
    cc.lineTo((BOOTH.x0 + BOOTH.x1) / 2, BOOTH.top - 46);
    cc.lineTo(BOOTH.x1 + 24, BOOTH.top + 4);
    cc.stroke();
  })(c, BOOTH.x0 - 40, BOOTH.top - 90);
  void t;
  void b;
}

/** the ten-second hourglass on the roof: turns on the new pattern and its sand runs until the trapdoor */
function hourglass(c: C2, env: PaintEnv, t: number, b: Beats) {
  const turnU = smr((t - b.back - 0.1) / 0.55);
  const run = clamp01((t - (b.back + 0.7)) / (b.trap - (b.back + 0.7)));
  c.save();
  c.translate(HG.x, HG.y);
  // its stand on the roof's peak
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-4, 30, 8, 22);
  c.fillRect(-30, 46, 60, 8);
  c.rotate(Math.PI * turnU);
  const H = 32, Wd = 22;
  const bulb = (dir: 1 | -1) => {
    const p = new Path2D();
    p.moveTo(-Wd, dir * H);
    p.bezierCurveTo(-Wd, dir * H * 0.45, -3, dir * 6, -2.5, 0);
    p.lineTo(2.5, 0);
    p.bezierCurveTo(3, dir * 6, Wd, dir * H * 0.45, Wd, dir * H);
    p.closePath();
    return p;
  };
  const glass = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.2), 0.3);
  const sand = mixLab(mixLab('#c9b48a', env.mood.halo, 0.35), env.mood.rim, 0.15);
  // the sand: before the turn, all of it lies in the lower bulb (it ran out long ago); after, it falls from the top
  const top = turnU < 1 ? 0 : 1 - run;
  const bot = turnU < 1 ? 1 : run;
  // in the glass's own frame (+y = currently down after the turn)
  for (const dir of [-1, 1] as const) {
    c.fillStyle = glass;
    c.fill(bulb(dir));
    c.save();
    c.clip(bulb(dir));
    c.fillStyle = sand;
    // which bulb is 'up' in the world: before the turn +1 is down; after the half turn -1 is down
    const isDown = turnU < 0.5 ? dir === 1 : dir === -1;
    const amt = isDown ? bot : top;
    if (amt > 0.01) {
      if (isDown) {
        const h = H * Math.sqrt(amt) * 0.85;
        c.fillRect(-Wd, dir > 0 ? H - h : -H, 2 * Wd, h);
      } else {
        const h = H * amt * 0.85;
        c.fillRect(-Wd, dir > 0 ? 0 : -h, 2 * Wd, h);
      }
    }
    c.restore();
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = lw(c, 1.6);
    c.stroke(bulb(dir));
  }
  // the falling stream (world-down, while running)
  if (turnU >= 1 && run > 0 && run < 1) {
    c.strokeStyle = sand;
    c.lineWidth = lw(c, 1.4);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -H * 0.9 + H * 0.8 * Math.sqrt(run) * 0.9 + 4);
    c.stroke();
  }
  // the frame: two plates and three posts
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-Wd - 6, -H - 6, 2 * Wd + 12, 6);
  c.fillRect(-Wd - 6, H, 2 * Wd + 12, 6);
  c.fillRect(-Wd - 5, -H, 3, 2 * H);
  c.fillRect(Wd + 2, -H, 3, 2 * H);
  c.restore();
  // its brass plate: '10 s' (screen-upright, on the stand)
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `600 18px ${FONT.mono}`, 18);
    c.font = `600 ${size}px ${FONT.mono}`;
    const tw = c.measureText('10 s').width;
    const px = HG.x + 44, py = HG.y + 24;
    c.fillStyle = brass(env, 0.1);
    c.fillRect(px - 6, py - size * 0.95, tw + 12, size * 1.25);
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.fillRect(px - 30, py - size * 0.4, 24, 2.5);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = faceInk(env);
    c.fillText('10 s', px, py);
    textProbe(c, `${ID}-10s`, px, py - size * 0.8, tw, size, 1);
    c.restore();
  });
}

/** a dial gauge on a post: a pale face (0..30 ms over 240 degrees), its range band, the needle, a readout window, and
 *  its name on a paper tag below */
function gauge(c: C2, env: PaintEnv, g: { x: number; lo: number; hi: number; name: string }, ms: number, readout: string, bandA: number, glint: number) {
  const { r, y } = GAUGE;
  const x = g.x;
  // the post and foot
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x - 5, y + r, 10, FLOOR - y - r);
  c.fillRect(x - 26, FLOOR - 8, 52, 8);
  // bezel and face
  c.fillStyle = brass(env, 0);
  c.beginPath();
  c.arc(x, y, r + 7, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = facePaper(env);
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  // the range band (a shaded arc), on 'keystroke'
  if (bandA > 0.01) {
    c.strokeStyle = withAlpha(mixLab(env.mood.halo, env.mood.set, 0.25), 0.55 * bandA);
    c.lineWidth = 11;
    c.beginPath();
    c.arc(x, y, r - 14, angOf(g.lo), angOf(g.hi));
    c.stroke();
  }
  // ticks: every ms, longer every 5, labels every 10
  c.strokeStyle = faceInk(env);
  for (let k = 0; k <= SCALE_MAX; k++) {
    const a = angOf(k);
    const L = k % 10 === 0 ? 11 : k % 5 === 0 ? 7 : 4;
    c.lineWidth = lw(c, k % 5 === 0 ? 1.6 : 1);
    c.beginPath();
    c.moveTo(x + Math.cos(a) * (r - 3), y + Math.sin(a) * (r - 3));
    c.lineTo(x + Math.cos(a) * (r - 3 - L), y + Math.sin(a) * (r - 3 - L));
    c.stroke();
  }
  // the stop pin past the end of the scale
  const sa = angOf(STOP_MS + 0.6);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(x + Math.cos(sa) * (r - 9), y + Math.sin(sa) * (r - 9), 2.6, 0, Math.PI * 2);
  c.fill();
  textRole(c, 'texture', () => {
    c.font = `500 13px ${FONT.mono}`;
    c.fillStyle = withAlpha(faceInk(env), 0.8);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const k of [0, 10, 20, 30]) {
      const a = angOf(k);
      c.fillText(String(k), x + Math.cos(a) * (r - 25), y + Math.sin(a) * (r - 25));
    }
    c.fillText('ms', x, y - r * 0.42);
  });
  // the readout window under the hub
  const size = legibleSize(c, `600 22px ${FONT.mono}`, 22);
  const rw = 128, rh = size + 10;
  const ry = y + r * 0.34;
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.25);
  c.fillRect(x - rw / 2, ry, rw, rh);
  if (readout) {
    textRole(c, 'subject', () => {
      c.save();
      c.font = `600 ${size}px ${FONT.mono}`;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillStyle = mixLab(mixLab('#e6eeea', env.mood.core, 0.35), '#ffffff', 0.4 * glint);
      c.fillText(readout, x, ry + rh - 7);
      textProbe(c, `${ID}-${g.name}-readout`, x - rw / 2, ry, rw, rh, 1);
      c.restore();
    });
    if (glint > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gg = c.createRadialGradient(x, ry + rh / 2, 2, x, ry + rh / 2, 70);
      gg.addColorStop(0, withAlpha(env.mood.core, 0.35 * glint));
      gg.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = gg;
      c.fillRect(x - 70, ry + rh / 2 - 70, 140, 140);
      c.restore();
    }
  }
  // the needle (ink, tapered) and its hub
  const a = angOf(ms);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.beginPath();
  c.moveTo(-12, -2.6);
  c.lineTo(r - 8, -0.6);
  c.lineTo(r - 8, 0.6);
  c.lineTo(-12, 2.6);
  c.closePath();
  c.fill();
  c.restore();
  c.beginPath();
  c.arc(x, y, 6, 0, Math.PI * 2);
  c.fill();
  // glass glint on the face (top-left)
  c.strokeStyle = withAlpha('#ffffff', 0.18);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.arc(x, y, r - 4, -Math.PI * 0.85, -Math.PI * 0.6);
  c.stroke();
  // the name tag on the post
  textRole(c, 'subject', () => {
    c.save();
    const s2 = legibleSize(c, `italic 500 22px ${FONT.text}`, 22);
    c.font = `italic 500 ${s2}px ${FONT.text}`;
    const tw = c.measureText(g.name).width;
    const ty = y + r + 40;
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
    c.fillRect(x - tw / 2 - 10 + 2, ty - s2 - 2, tw + 20, s2 + 14);
    c.fillStyle = mixLab(facePaper(env), env.mood.core, 0.1);
    c.fillRect(x - tw / 2 - 10, ty - s2 - 4, tw + 20, s2 + 14);
    c.fillStyle = faceInk(env);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText(g.name, x, ty + 2);
    textProbe(c, `${ID}-${g.name}-name`, x - tw / 2, ty - s2 * 0.8, tw, s2, 1);
    c.restore();
  });
}

/** the scope label (booth -> backtrack), then the equation (backtrack ->), in the lower band, never both */
function labels(f: Frame, t: number, b: Beats) {
  const sw = textSwap(t, b.back + 0.15, 0.35);
  const a1 = seg(t, b.booth - 0.1, b.booth + 0.3) * sw.out;
  const a2 = sw.in;
  const one = (text: string, a: number, id: string, mono: boolean) => {
    if (a <= 0.01) return;
    const c = f.c;
    textRole(c, 'subject', () => {
      c.save();
      const base = mono ? `500 21px ${FONT.mono}` : `italic 500 24px ${FONT.text}`;
      const size = legibleSize(c, base, mono ? 21 : 24);
      const o = { font: mono ? `500 ${size}px ${FONT.mono}` : `italic 500 ${size}px ${FONT.text}`, size, tracking: mono ? 0.02 : 0.015, align: 'left' as const };
      const w = measureTracked(c, text, o);
      const x0 = 72;
      c.globalAlpha = a;
      softPlate(c, x0 + w / 2, 606, w + 130, size + 56, f.mood.ink, 0.6);
      c.fillStyle = mixLab('#e6eeea', f.mood.core, 0.2);
      drawTracked(c, text, x0, 614, o);
      textProbe(c, id, x0, 614 - size, w, size * 1.2, a);
      c.restore();
    });
  };
  one('Chrome 155 · 100,000 documents · per keystroke · RegExp on one thread', a1, `${ID}-scope`, false);
  one('([a-z]+)+x : RegExp 2.1 s · this program 11.0 ms', a2, `${ID}-eq`, true);
}
