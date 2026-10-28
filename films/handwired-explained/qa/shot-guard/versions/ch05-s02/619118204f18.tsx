/**
 * ch05-s02 — FUSION, PARTIAL, AND WHERE IT STOPS (scene, serverCyan; cut in; 21.96 s).
 *   L0503  "The README calls it "a giant matmul": a matrix multiplication, the sums graphics cards are built for."
 *   L0503a "Sums of sums are still sums, so some fold together. But a gate is a bend: nothing merges across one."
 *   L0503b "The longest chain of gates runs seventy-one deep."
 *
 * Inside the same loom as ch05-s01 (sets/ch05-s01-loom3d: the real compiled HandwiredOS circuit, one thread per stored
 * weight, every gate fixture on its own real row from sets/data/ch05-s02-gates.json). The camera rides along the loom's
 * length at frame height (a slow push on its axis), the frames sliding past in parallax.
 *
 * TEACHES, word by word:
 *   slip (0.3)       a parchment slip clipped to a near frame: “a giant matmul” — the README (the phrase only; the
 *                    line speaks it); the push carries it out of frame left by 'fold'
 *   fold (11.63)     fusion as the code does it, partial [CM05]: three real small SUMS in frame 23, each read by one
 *                    operation in frame 24, fold into their readers: their input threads slide forward onto the reader's
 *                    face (the sum is copied into its reader) and the sum's own thread fades; every other thread stays.
 *                    The status label inks: sparsity: built · fusion: partial · scheduling: parked
 *   gate (13.63)     a real ReGLU gate in frame 25 is drawn as its full fixture: a hinged ramp with a 0/1 shutter,
 *                    darker and heavier than the rest ("a gate is a bend": the ramp's hinge bends on 'bend')
 *   nothing (15.53)  the gate's own input bundle tries to slide on into its reader and stops dead against the ramp
 *   chain (18.13)    pull back to the whole loom: every gate fixture stands out like a rib; a thin copper line traces the
 *                    real longest chain of gates through the frames, a brass notch on each of its 71 gates (no numerals)
 * Text: the slip and the status label only.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, cam3Interp, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, softPlate, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { CIRCUIT, LAYER_START } from '../sets/circuit';
import { LOOM, frameW, frameX, frameZ, knotPt, loom3, project, rowAt, slotEnds, slotOf, type P3 } from '../sets/ch05-s01-loom3d';
import { loomRoom } from '../sets/ch05-s01-room';

type C2 = CanvasRenderingContext2D;
const ID = 'ch05-s02';
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const lerp3 = (a: P3, b: P3, u: number): P3 => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u });

// ---------------------------------------------------------------- the real fold and stop (from the export)
/** arcs into and out of each packed value */
const IN = new Map<number, number[]>();
const OUT = new Map<number, number[]>();
CIRCUIT.arcs.forEach((a, i) => {
  (IN.get(a[1]) ?? IN.set(a[1], []).get(a[1])!).push(i);
  (OUT.get(a[0]) ?? OUT.set(a[0], []).get(a[0])!).push(i);
});
/** three small sums in frame 23, each read by exactly one operation in frame 24 (sets/data: kind 0) */
const FOLD_SUMS = [1476, 1485, 1497];
/** a ReGLU gate in frame 25 (kind 1) read by an operation in frame 26 */
const GATE = 1618;
const FOLD_F = 23;
const GATE_F = 25;
interface FoldArc {
  slot: number;
  home: P3;
  dest: P3;
}
const FOLDS = FOLD_SUMS.map((v) => {
  const out = OUT.get(v)![0];
  const dest = knotPt(out); // the reader's knot for this sum, on frame 24's face
  const ins: FoldArc[] = IN.get(v)!.map((i) => ({ slot: slotOf(i), home: slotEnds(slotOf(i))[1], dest }));
  return { v, outSlot: slotOf(out), ins };
});
const GATE_OUT = OUT.get(GATE)![0];
const GATE_ROW = GATE - LAYER_START[GATE_F];
const GATE_IN: FoldArc[] = IN.get(GATE)!.map((i) => ({ slot: slotOf(i), home: slotEnds(slotOf(i))[1], dest: knotPt(GATE_OUT) }));
/** where the bundle meets the ramp: frame 25's right stile, at the gate's row */
const RAMP_AT: P3 = { x: frameX(GATE_F) + frameW(GATE_F) / 2 + 3, y: rowAt(GATE_F, GATE_ROW), z: frameZ(GATE_F) };

// ---------------------------------------------------------------- camera: riding the loom's axis, then a pull back
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });
/** the camera's place on the axis (a fractional frame index) */
const rideCam = (f: number): Camera3 => C(LOOM.x0 + LOOM.dx * (f + 1) + 60, LOOM.yc - 6, LOOM.z0 + LOOM.dz * (f + 1) - 640);
const WIDE = C(700, 330, 0);
interface Key {
  t: number;
  cam: Camera3;
}
function camAt(keys: Key[], t: number): Camera3 {
  if (t <= keys[0].t) return keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) return cam3Interp(a.cam, b.cam)(smr((t - a.t) / (b.t - a.t)));
  }
  return keys[keys.length - 1].cam;
}

interface Beats {
  D: number;
  fold: number;
  together: number;
  gate: number;
  bend: number;
  nothing: number;
  one: number;
  chain: number;
  seventy: number;
  /** ride → pull back */
  ride1: number;
  back1: number;
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      fold: T.beat('fuse'),
      together: T.word('L0503a', 'together'),
      gate: T.word('L0503a', 'gate'),
      bend: T.word('L0503a', 'bend'),
      nothing: T.beat('stop'),
      one: T.word('L0503a', 'one'),
      chain: T.beat('chain'),
      seventy: T.word('L0503b', 'seventy-one'),
      ride1: T.word('L0503a', 'one') + 0.1,
      back1: T.beat('chain') + 1.9,
    };
    const foldAim = { x: frameX(FOLD_F) + 26, y: rowAt(FOLD_F, 10) + 40, z: frameZ(FOLD_F) - 540 };
    const keys: Key[] = [
      { t: 0, cam: rideCam(4) },
      { t: b.fold - 3.2, cam: rideCam(15.5) },
      { t: b.fold + 0.2, cam: C(foldAim.x, foldAim.y, foldAim.z) },
      { t: b.together + 0.6, cam: C(foldAim.x + 6, foldAim.y + 6, foldAim.z + 12) },
      { t: b.nothing - 0.3, cam: C(RAMP_AT.x - 14, RAMP_AT.y - 24, frameZ(GATE_F) - 470) },
      { t: b.ride1, cam: C(RAMP_AT.x - 10, RAMP_AT.y - 22, frameZ(GATE_F) - 455) },
      { t: b.back1, cam: WIDE },
      { t: b.D + 0.5, cam: C(WIDE.x + 6, WIDE.y, WIDE.z - 12) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    // the ride along the axis, easing in on the fold, then on the gate, then the pull back to the whole loom
    const cam = camAt(sc.keys, t);
    f.camera(cam);

    // ---- the fold (on twos), the stop, the chain
    const foldU = smr((tq - (b.fold - 0.1)) / 1.5);
    const foldHi = seg(t, b.fold - 0.2, b.fold + 0.3) * (1 - 0.6 * seg(t, b.together + 1.2, b.gate));
    // the gate's bundle: slides on from just before 'nothing', hits the ramp on 'nothing', jolts, holds, then settles home
    const push = smr((tq - (b.nothing - 0.55)) / 0.55);
    const jolt = tq > b.nothing ? 0.12 * Math.exp(-(tq - b.nothing) * 7) * Math.cos((tq - b.nothing) * 26) : 0;
    const settle = smr((tq - (b.ride1 + 0.6)) / 1.2);
    const stopU = Math.max(0, push * (1 - settle) - Math.abs(jolt) * (1 - settle));
    const stopHi = seg(t, b.nothing - 0.5, b.nothing) * (1 - seg(t, b.ride1 + 0.6, b.ride1 + 1.6));
    const fixture = seg(t, b.gate - 0.3, b.gate + 0.4) * (1 - seg(t, b.chain - 0.6, b.chain + 0.4));
    const bend = seg(t, b.bend - 0.1, b.bend + 0.5);
    const ribs = seg(t, b.chain - 0.4, b.chain + 0.8);
    const chain = smr((t - b.chain) / (b.seventy + 0.9 - b.chain));

    const move = new Map<number, { to?: P3; a?: number; hi?: number }>();
    for (const fd of FOLDS) {
      for (const a of fd.ins) move.set(a.slot, { to: lerp3(a.home, a.dest, foldU), hi: foldHi });
      move.set(fd.outSlot, { a: 1 - foldU, hi: foldHi * 0.5 });
    }
    for (const a of GATE_IN) {
      // toward the reader, but never past the ramp
      const reach = lerp3(a.home, RAMP_AT, stopU);
      move.set(a.slot, { to: reach, hi: stopHi });
    }

    loomRoom(f, cam, { key: ID, cams: sc.keys.map((k) => k.cam), sunX: 1080, tubes: 0.75 });
    loom3(
      f,
      {
        cam,
        tq,
        focusZ: t < b.fold - 1 ? cam.z + 700 : t < b.ride1 ? cam.z + 520 : cam.z + 520 + (1060 - (cam.z + 520)) * smr((t - b.ride1) / (b.back1 - b.ride1)),
        dof: 3,
        maxBlur: 4.5,
        ribs,
        chain,
        move,
        lit: { [FOLD_F]: foldHi * 0.35, [GATE_F]: stopHi * 0.4 },
        // the other threads step back while a bundle folds or stops, so the lit ones read
        threads: (1 - 0.5 * seg(t, b.fold - 0.4, b.fold + 0.2) * (1 - seg(t, b.ride1, b.ride1 + 1))) * (1 - ribs * 0.25),
      },
      {
        run: (c, env, r) => {
          if (r.frames.includes(10)) slip(c, env, cam, t, b);
          if (r.frames.includes(GATE_F) && fixture > 0.01) gateFixture(c, env, cam, fixture, bend, stopHi, tq);
        },
      },
    );
    f.rim({ x: 0.55, y: -0.8 });

    // ---- the status label (screen-locked), from 'fold' to the end
    statusLabel(f.c, f.mood, t, b.fold + 0.15);
  },
});

/** the README's phrase on a parchment slip clipped to frame 10's left stile */
function slip(c: C2, env: PaintEnv, cam: Camera3, t: number, b: Beats) {
  const out = 1 - seg(t, b.fold, b.fold + 0.3);
  const inkAt = 0.25;
  const ink = cardInkAlpha(t, inkAt) * out;
  const paper = Math.min(cardPaperAlpha(t, inkAt), 1) * out;
  if (paper <= 0.01) return;
  const at = project({ x: frameX(10) - frameW(10) / 2 - 4, y: 214, z: frameZ(10) - 3 }, cam);
  if (at.x < -400 || at.x > 1500) return;
  const s = at.s;
  const w = 168 * s, h = 70 * s;
  const x = at.x - w + 8 * s, y = at.y;
  c.save();
  c.translate(x + w, y);
  c.rotate(-0.035);
  c.translate(-(x + w), -y);
  c.globalAlpha = paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x + 3 * s, y + 4 * s, w, h);
  c.fillStyle = mixLab(mixLab('#efe2c2', env.mood.halo, 0.25), env.mood.haze, 0.12);
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha('#2a1d14', 0.35);
  c.lineWidth = 1;
  c.strokeRect(x, y, w, h);
  // the brass clip on the stile
  c.fillStyle = mixLab('#a8844a', env.mood.halo, 0.25);
  c.fillRect(x + w - 12 * s, y - 6 * s, 14 * s, 14 * s);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 500 ${(21 * s).toFixed(2)}px ${FONT.text}`, 21 * s, '“a giant matmul”');
    c.font = `italic 500 ${size.toFixed(2)}px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(mixLab('#2a1d14', env.mood.ink, 0.2), ink);
    c.fillText('“a giant matmul”', x + w / 2, y + h * 0.48);
    const as = legibleSize(c, `600 ${(15 * s).toFixed(2)}px ${FONT.sc}`, 15 * s, '— the README');
    c.font = `600 ${as.toFixed(2)}px ${FONT.sc}`;
    c.fillStyle = withAlpha(mixLab('#2a1d14', env.mood.ink, 0.2), ink * 0.85);
    c.fillText('— the README', x + w / 2, y + h * 0.82);
    textProbe(c, `${ID}-slip`, x + 6, y + 4, w - 12, h - 8, ink);
  });
  cardProbe(c, `${ID}-slip-card`, x, y, w, h, paper, ink);
  c.restore();
}

/** the gate's full fixture: a hinged ReLU ramp with a 0/1 shutter, darker and heavier, on frame 25's right stile */
function gateFixture(c: C2, env: PaintEnv, cam: Camera3, a: number, bend: number, hit: number, tq: number) {
  const p = project(RAMP_AT, cam);
  const s = p.s;
  const L = 34 * s;
  c.save();
  c.globalAlpha = a;
  c.translate(p.x + 2 * s, p.y);
  // the hinge plate (flat), the hinge pin, and the ramp rising after it (its angle bends on 'bend')
  const ang = -(0.18 + 0.5 * bend);
  const ink = PUPPET_NEAR_BLACK;
  c.fillStyle = ink;
  c.fillRect(0, -2.2 * s, L * 0.5, 4.4 * s);
  c.beginPath();
  c.arc(L * 0.5, 0, 4 * s, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.translate(L * 0.5, 0);
  c.rotate(ang);
  c.fillRect(0, -2.6 * s, L * 0.75, 5.2 * s);
  c.restore();
  // the shutter: a small paper door at the hinge, open (1) while the ramp rises
  const sh = 0.4 + 0.6 * bend;
  c.fillStyle = mixLab(mixLab('#e8d6ab', env.mood.halo, 0.3), env.mood.set, 0.35);
  c.fillRect(L * 0.5 - 5 * s, -14 * s, 10 * s * sh, 9 * s);
  c.strokeStyle = withAlpha(ink, 0.9);
  c.lineWidth = Math.max(0.8, 1.1 * s);
  c.strokeRect(L * 0.5 - 5 * s, -14 * s, 10 * s, 9 * s);
  // the rim on its top edges
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.8);
  c.lineWidth = Math.max(0.8, 1.2 * s);
  c.beginPath();
  c.moveTo(0, -2.2 * s);
  c.lineTo(L * 0.5, -2.2 * s);
  c.stroke();
  // the dead stop: a hard flash at the hinge
  if (hit > 0.02) {
    c.globalCompositeOperation = 'lighter';
    const r = 26 * s;
    const g = c.createRadialGradient(L * 0.5, 0, 0, L * 0.5, 0, r);
    g.addColorStop(0, withAlpha(env.mood.core, 0.55 * hit * (0.85 + 0.15 * Math.sin(tq * 9))));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(L * 0.5 - r, -r, 2 * r, 2 * r);
  }
  c.restore();
}

/** the code's own status of the README's GPU techniques [CM05], small, top right, from 'fold' to the end */
function statusLabel(c: C2, mood: PaintEnv['mood'], t: number, at: number) {
  const a = seg(t, at, at + 0.35);
  if (a <= 0) return;
  const text = 'sparsity: built · fusion: partial · scheduling: parked';
  c.save();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `400 21px ${FONT.mono}`, 21, text);
    c.font = `400 ${size.toFixed(2)}px ${FONT.mono}`;
    const tw = c.measureText(text).width;
    const x = 1238 - tw, y = 58;
    softPlate(c, x + tw / 2, y - size * 0.32, tw + 56, size * 2.4, mixLab(mood.ink, mood.fg, 0.4), 0.82 * a);
    c.globalAlpha = a;
    c.fillStyle = mixLab(mood.core, '#ffffff', 0.15);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText(text, x, y);
    textProbe(c, `${ID}-status`, x, y - size, tw, size * 1.2, a);
  });
  c.restore();
}
