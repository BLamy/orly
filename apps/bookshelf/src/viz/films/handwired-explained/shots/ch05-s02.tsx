/**
 * ch05-s02 — FUSION, PARTIAL, AND WHERE IT STOPS (scene, serverCyan; cut in; 21.96 s).
 *   L0503  "The README calls it "a giant matmul": a matrix multiplication, the sums graphics cards are built for."
 *   L0503a "Sums of sums are still sums, so some fold together. But a gate is a bend: nothing merges across one."
 *   L0503b "The longest chain of gates runs seventy-one deep."
 *
 * Inside the same loom as ch05-s01 (sets/ch05-s01-loom3d: the real compiled HandwiredOS circuit, one thread per stored
 * weight, every gate fixture on its own real row from sets/data/ch05-s02-gates.json). The camera rides along the loom's
 * length at frame height (a slow push on its axis), the frames sliding past in parallax. Review r1: the far wall is
 * held at its ch05-s01 value (a veil), the haze is measured from the camera and the fog runs at half density while we
 * ride inside, and the loom's threads never drop below half, so the loom still reads as woven while we travel.
 *
 * TEACHES, word by word:
 *   slip (0.3)       a parchment slip clipped to a near frame: “a giant matmul” — the README (the phrase only; the
 *                    line speaks it). Paper and ink come up together; it fades out before any part of it leaves the
 *                    safe area as the ride carries it left
 *   fold (11.63)     the HERO PLANE (sharp, frame centre, in front of the softened loom): three near frames, a sums'
 *                    frame and its readers' frame. Four bundles of copper threads run into small sum knots on the first.
 *                    On 'fold' ONE bundle (five threads) and its sum knot slide forward over 0.8 s along its thread and
 *                    merge into the reader's knot, which swells as it absorbs them (a small sum copied into its
 *                    reader); two bundles beside it stay stock-still (most stay). The status label inks
 *   together         the ReGLU pair: two bundles twist into one rope and their two knots become one
 *   But / gate       the camera trucks one frame on: a GATE FIXTURE stands on the next frame, darker and heavier, a
 *                    hinged ReLU ramp ( _/ ) with a shutter, about 150 px tall at 1080p, rim-lit
 *   bend (14.46)     the ramp bends up on its hinge
 *   nothing (15.53)  the bundle that just folded runs on toward the gate's reader and stops DEAD against the shutter:
 *                    a hard clack pose, a 2-frame recoil, then it stays visibly blocked through the line
 *   chain (18.13)    pull back to the whole loom: every frame that carries real gate rows wears a short dark rib up its
 *                    right stile, standing out along the length like a boat's ribs; a thin copper line runs rib to rib
 *                    along the frames' heads (no big swings), tracing the real longest chain of gates, one small brass
 *                    notch per gate, 71 in all (no numerals)
 * Text: the slip and the status label only.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, cam3Interp, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { LOOM, THREAD_HUE, frameW, frameX, frameZ, loom3, project } from '../sets/ch05-s01-loom3d';
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
const hash = (n: number) => {
  const x = Math.sin(n * 91.345 + 7.13) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- camera: riding the loom's axis, a hold, a pull back
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });
/** the camera's place on the axis (a fractional frame index) */
const rideCam = (f: number): Camera3 => C(LOOM.x0 + LOOM.dx * (f + 1) + 60, LOOM.yc - 6, LOOM.z0 + LOOM.dz * (f + 1) - 640);
const WIDE = C(700, 330, 0);
const HOLD = C(frameX(24) + 40, LOOM.yc - 6, frameZ(24) - 560);
/** the hero plane's truck (screen px) and the same move for the camera (world, at the hero plane's depth) */
const TRUCK_PX = 330;
const TRUCK_W = TRUCK_PX / (1000 / (frameZ(24) - HOLD.z));
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
  but: number;
  gate: number;
  bend: number;
  nothing: number;
  one: number;
  chain: number;
  seventy: number;
  /** hold → pull back */
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
      but: T.word('L0503a', 'But'),
      gate: T.word('L0503a', 'gate'),
      bend: T.word('L0503a', 'bend'),
      nothing: T.beat('stop'),
      one: T.word('L0503a', 'one'),
      chain: T.beat('chain'),
      seventy: T.word('L0503b', 'seventy-one'),
      ride1: T.word('L0503a', 'one') + 0.1,
      back1: T.beat('chain') + 1.9,
    };
    const keys: Key[] = [
      { t: 0, cam: rideCam(4) },
      { t: b.fold - 3.2, cam: rideCam(15.5) },
      { t: b.fold - 0.6, cam: HOLD },
      { t: b.but - 0.05, cam: C(HOLD.x + 3, HOLD.y, HOLD.z + 6) },
      { t: b.but + 1.05, cam: C(HOLD.x + 3 + TRUCK_W, HOLD.y, HOLD.z + 8) },
      { t: b.ride1, cam: C(HOLD.x + 5 + TRUCK_W, HOLD.y, HOLD.z + 14) },
      { t: b.back1, cam: WIDE },
      { t: b.D + 0.5, cam: C(WIDE.x + 6, WIDE.y, WIDE.z - 12) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(sc.keys, t);
    f.camera(cam);

    // the hero plane is up from just before the fold to the pull back; the loom behind softens (never below half)
    const hero = seg(t, b.fold - 1.6, b.fold - 0.5) * (1 - seg(t, b.ride1 + 0.1, b.ride1 + 0.9));
    const ribs = seg(t, b.chain - 0.4, b.chain + 0.8);
    const chain = smr((t - b.chain) / (b.seventy + 0.9 - b.chain));
    const wide = seg(t, b.ride1, b.back1);

    loomRoom(f, cam, { key: ID, cams: sc.keys.map((k) => k.cam), sunX: 1080, tubes: 0.75, veil: 0.32 * (1 - wide) + 0.1 * wide });
    loom3(
      f,
      {
        cam,
        tq,
        fam: { copper: 0.6, indigo: 0.6 },
        focusZ: hero > 0.01 ? frameZ(24) + 900 : cam.z + 700 + (1060 - (cam.z + 700)) * wide,
        dof: 3 + 2.5 * hero,
        maxBlur: 4.5 + 1.5 * hero,
        hazeShift: Math.max(0, cam.z - 300),
        fogScale: 0.5 + 0.5 * wide,
        frameAlpha: () => 1 - 0.4 * hero,
        ribs: ribs * 0.35,
        ribBars: ribs,
        chainTops: true,
        chain,
        threads: Math.max(0.5, 1 - 0.5 * hero) * (1 - ribs * 0.2),
      },
      {
        run: (c, env, r) => {
          if (r.frames.includes(10) && t < b.fold) slip(c, env, cam, t);
        },
        top: (c, env) => {
          if (hero > 0.01) {
            // the field behind the hero plane sinks (review r1: no pale wash while we hold inside the loom)
            const g = c.createRadialGradient(640, 400, 120, 640, 400, 900);
            const ink = mixLab(env.mood.ink, '#000000', 0.3);
            g.addColorStop(0, withAlpha(ink, 0.34 * hero));
            g.addColorStop(1, withAlpha(ink, 0.52 * hero));
            c.fillStyle = g;
            c.fillRect(-40, -40, 1360, 800);
            heroPlane(c, env, t, tq, b, hero);
          }
        },
      },
    );
    f.rim({ x: 0.55, y: -0.8 });

    // ---- the status label (screen-locked), from 'fold' to the end
    statusLabel(f.c, f.mood, t, b.fold + 0.15);
  },
});

// ---------------------------------------------------------------- the hero plane (screen px at rest; trucks left)
interface Pt {
  x: number;
  y: number;
}
const FR = { L: 460, R: 790, G: 1120 } as const;
const STILE = 62;
/** the bundles: their sum knots on the left frame and their readers on the right one */
const SB = { x: FR.L, y: 205 }, RB = { x: FR.R, y: 224 };
const SA = { x: FR.L, y: 340 }, RA = { x: FR.R, y: 352 };
const SE1 = { x: FR.L, y: 452 }, SE2 = { x: FR.L, y: 528 }, RE = { x: FR.R, y: 492 };
const SD = { x: FR.L, y: 612 }, RD = { x: FR.R, y: 600 };
/** the gate: shutter face, hinge, and the gate's own reader knot on the next frame */
const GATE = { face: FR.G - 110, y: RA.y, hingeX: FR.G - 96, top: RA.y - 50, bot: RA.y + 50, reader: { x: FR.G, y: RA.y } };

/** n input threads arriving from the left (earlier frames) to a knot */
function inputs(seed: number, n: number, to: Pt, spread: number, indigoEvery = 0) {
  return Array.from({ length: n }, (_, k) => ({
    from: { x: -40 - hash(seed + k) * 60, y: to.y + (k - (n - 1) / 2) * spread + (hash(seed * 3 + k) - 0.5) * 18 },
    indigo: indigoEvery > 0 && k % indigoEvery === indigoEvery - 1,
  }));
}
const IN_B = inputs(11, 4, SB, 22, 3);
const IN_A = inputs(23, 5, SA, 20);
const IN_E1 = inputs(37, 3, SE1, 16);
const IN_E2 = inputs(41, 3, SE2, 16, 3);
const IN_D = inputs(53, 4, SD, 20, 4);

function thread(c: C2, p0: Pt, p1: Pt, col: string, a: number, lw: number, twist?: { amp: number; phase: number }) {
  if (a <= 0.003) return;
  c.strokeStyle = withAlpha(col, a);
  c.lineWidth = lw;
  c.beginPath();
  const N = twist ? 28 : 1;
  const mx = (p0.x + p1.x) / 2;
  for (let i = 0; i <= N; i++) {
    const u = N === 1 ? i : i / N;
    // a cubic with horizontal tangents
    const x = (1 - u) ** 3 * p0.x + 3 * (1 - u) ** 2 * u * mx + 3 * (1 - u) * u * u * mx + u ** 3 * p1.x;
    let y = (1 - u) ** 3 * p0.y + 3 * (1 - u) ** 2 * u * p0.y + 3 * (1 - u) * u * u * p1.y + u ** 3 * p1.y;
    if (twist && u > 0.45) y += twist.amp * Math.sin((u - 0.45) * Math.PI * 7 + twist.phase) * Math.sin(((u - 0.45) / 0.55) * Math.PI);
    if (i === 0) c.moveTo(x, y);
    else if (N === 1) c.bezierCurveTo(mx, p0.y, mx, p1.y, p1.x, p1.y);
    else c.lineTo(x, y);
  }
  c.stroke();
}
function knot(c: C2, env: PaintEnv, p: Pt, r: number, a: number, glow = 0) {
  if (a <= 0.003) return;
  if (glow > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const R = r * 5;
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
    g.addColorStop(0, withAlpha('#ffc890', 0.5 * glow * a));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
    c.restore();
  }
  c.fillStyle = withAlpha(mixLab(THREAD_HUE.copper, '#ffe0b8', 0.3 + 0.3 * glow), a);
  c.beginPath();
  c.arc(p.x, p.y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85 * a);
  c.lineWidth = 1.4;
  c.stroke();
}
const lerp = (a: Pt, b: Pt, u: number): Pt => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });

function heroPlane(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, A: number) {
  const tx = -TRUCK_PX * smr((t - (b.but - 0.05)) / 1.1);
  const cop = THREAD_HUE.copper, ind = THREAD_HUE.indigo;
  c.save();
  c.translate(tx, 0);
  c.globalAlpha = A;
  // ---- the three frames of the hero plane: heavy dark uprights, head rails, rim on the key side (upper right)
  for (const X of [FR.L, FR.R, FR.G]) {
    if (X + STILE + tx < -40 || X - STILE + tx > 1320) continue;
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.fillRect(X - STILE - 7, 118, 7, 620);
    c.fillRect(X + STILE, 118, 7, 620);
    c.fillRect(X - STILE - 12, 110, 2 * STILE + 24, 9);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.35), 0.75);
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(X - STILE - 12, 110);
    c.lineTo(X + STILE + 12, 110);
    c.moveTo(X + STILE + 7, 119);
    c.lineTo(X + STILE + 7, 738);
    c.moveTo(X - STILE, 119);
    c.lineTo(X - STILE, 738);
    c.stroke();
  }
  c.lineCap = 'round';
  const others = 1 - 0.6 * seg(t, b.gate - 0.2, b.gate + 0.4);
  // ---- the two still bundles (most stay)
  for (const [ins, S, R] of [
    [IN_B, SB, RB],
    [IN_D, SD, RD],
  ] as const) {
    for (const i of ins) thread(c, i.from, S, i.indigo ? ind : cop, 0.9 * others, 2.2);
    thread(c, S, R, cop, 0.9 * others, 2.2);
    knot(c, env, S, 7.5, others);
    knot(c, env, R, 9.5, others);
  }
  // ---- the fold: bundle A and its sum knot slide forward along their thread and merge into the reader's knot
  const fu = smr((t - (b.fold - 0.08)) / 0.8);
  const merged = seg(fu, 0.86, 1);
  // after the truck, the folded bundle runs on at the gate and stops dead against its shutter (on twos)
  const hitAt = b.nothing;
  const run0 = hitAt - 0.6;
  const ru = clamp01((tq - run0) / (hitAt - run0));
  const contact = GATE.face - 15; // the knot's centre (radius ~14.5 once swollen) when it touches the shutter
  let rx = RA.x + (contact - RA.x) * ru * ru;
  let squash = 0;
  if (tq >= hitAt) {
    const k = Math.round((tq - hitAt) * 12); // frames on twos since the hit
    rx = k === 0 ? contact : k <= 2 ? contact - 9 + (k - 1) * 3 : contact - 2;
    squash = k === 0 ? 0.35 : k <= 2 ? 0.12 : 0;
  }
  const blocked = seg(t, hitAt - 0.05, hitAt + 0.05);
  const slideOn = tq >= run0;
  const sA = lerp(SA, RA, fu);
  const headA = slideOn ? { x: rx, y: RA.y } : RA;
  // its five threads: into the moving sum knot, then (merged) straight into the reader
  const hot = mixLab(cop, '#ffc890', 0.35);
  for (const i of IN_A) thread(c, i.from, merged > 0.5 ? headA : sA, hot, 1, 2.6);
  if (merged < 1) thread(c, sA, RA, hot, 1 - merged, 2.6);
  if (merged < 1) knot(c, env, sA, 8, 1 - merged, 0.7 * seg(t, b.fold - 0.2, b.fold + 0.2));
  // the reader swells as it absorbs them (and keeps its larger size)
  const swell = merged * (1 + 0.6 * Math.exp(-Math.max(0, t - (b.fold + 0.72)) * 5));
  const flash = merged * Math.exp(-Math.max(0, t - (b.fold + 0.72)) * 3);
  // ---- the gate's reader and the thread the bundle tries to run on (from 'gate')
  const g = seg(t, b.gate - 0.15, b.gate + 0.45);
  if (g > 0) {
    thread(c, headA, GATE.reader, cop, 0.6 * g, 2);
    knot(c, env, GATE.reader, 9.5, g);
  }
  c.save();
  if (squash > 0) {
    c.translate(headA.x, headA.y);
    c.scale(1 - squash, 1 + squash * 0.6);
    c.translate(-headA.x, -headA.y);
  }
  knot(c, env, headA, 9.5 + 5 * swell, 1, 0.9 * flash + 0.7 * blocked * (1 - seg(t, b.ride1, b.ride1 + 0.6)));
  c.restore();
  // ---- the ReGLU pair: two bundles twist into one rope; their two knots become one
  const tw = smr((t - (b.together + 0.45)) / 0.9);
  const mid = { x: FR.L, y: (SE1.y + SE2.y) / 2 };
  const e1 = lerp(SE1, mid, tw), e2 = lerp(SE2, mid, tw);
  for (const i of IN_E1) thread(c, i.from, e1, cop, 0.95 * others, 2.2, { amp: 16 * tw, phase: 0 });
  for (const i of IN_E2) thread(c, i.from, e2, i.indigo ? ind : cop, 0.95 * others, 2.2, { amp: 16 * tw, phase: Math.PI });
  thread(c, e1, RE, cop, 0.95 * others, 2.2);
  thread(c, e2, RE, cop, 0.95 * others * (1 - tw), 2.2);
  knot(c, env, e2, 7.5, others * (1 - seg(tw, 0.85, 1)));
  knot(c, env, e1, 7.5 + 2.5 * tw, others, 0.6 * tw * (1 - seg(t, b.gate - 0.3, b.gate + 0.3)));
  knot(c, env, RE, 9.5, others);
  // ---- the gate fixture (from 'gate'), heavier and darker than the frames; the ramp bends on 'bend'
  if (g > 0) gateFixture(c, env, g, seg(t, b.bend - 0.1, b.bend + 0.45), blocked, tq, t - hitAt);
  c.restore();
}

/** the gate fixture on the next frame's left stile: a mounting plate, a hinged ReLU ramp ( _/ ) and a hanging shutter */
function gateFixture(c: C2, env: PaintEnv, a: number, bend: number, hit: number, tq: number, since: number) {
  const ink = PUPPET_NEAR_BLACK;
  const rim = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.45), 0.9);
  const X = FR.G - STILE - 7; // the stile's left face
  c.save();
  c.globalAlpha *= a;
  // rises into place
  c.translate(0, (1 - a) * 30);
  // mounting plate on the stile
  c.fillStyle = ink;
  c.fillRect(X - 12, GATE.top - 8, 12, GATE.bot - GATE.top + 34);
  // the ramp: a flat plate to the hinge, then the ramp rising after it (flat → bent on 'bend')
  const hx = GATE.hingeX - 40, hy = GATE.bot + 18;
  const ang = -(0.08 + 1.0 * bend);
  c.fillRect(hx - 64, hy - 4, 64, 8);
  c.save();
  c.translate(hx, hy);
  c.rotate(ang);
  c.fillRect(0, -4.5, 84, 9);
  c.strokeStyle = rim;
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(4, -4.5);
  c.lineTo(84, -4.5);
  c.stroke();
  c.restore();
  c.strokeStyle = rim;
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(hx - 64, hy - 4);
  c.lineTo(hx - 3, hy - 4);
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  c.arc(hx, hy, 7, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = rim;
  c.beginPath();
  c.arc(hx, hy, 7, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  // the shutter: a heavy door hanging from a pin at its top, closed across the thread's path; it shudders on the hit
  const sh = since >= 0 ? 0.09 * Math.exp(-since * 9) * Math.cos(since * 60) : 0;
  c.save();
  c.translate(GATE.face + 7, GATE.top);
  c.rotate(sh);
  c.fillStyle = ink;
  c.fillRect(-7, 0, 14, GATE.bot - GATE.top);
  c.strokeStyle = rim;
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(7, 2);
  c.lineTo(7, GATE.bot - GATE.top);
  c.moveTo(-7, 0);
  c.lineTo(7, 0);
  c.stroke();
  c.restore();
  // the pin and its bracket to the plate
  c.fillStyle = ink;
  c.fillRect(GATE.face, GATE.top - 10, X - GATE.face, 8);
  c.beginPath();
  c.arc(GATE.face + 7, GATE.top, 5, 0, Math.PI * 2);
  c.fill();
  // the dead stop: a hard cold flash at the shutter's face
  if (hit > 0.02 && since >= 0) {
    c.globalCompositeOperation = 'lighter';
    const r = 34;
    const k = Math.exp(-since * 4) * 0.7 + 0.3;
    const gg = c.createRadialGradient(GATE.face, GATE.y, 0, GATE.face, GATE.y, r);
    gg.addColorStop(0, withAlpha(env.mood.core, 0.5 * hit * k));
    gg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gg;
    c.fillRect(GATE.face - r, GATE.y - r, 2 * r, 2 * r);
  }
  c.restore();
  void tq;
}

/** the README's phrase on a parchment slip clipped to frame 10's left stile. Paper and ink come up together by 0.3;
 *  it fades out before any part of it leaves the 5 % safe area (the ride carries it left) */
function slip(c: C2, env: PaintEnv, cam: Camera3, t: number) {
  const at = project({ x: frameX(10) - frameW(10) / 2 - 4, y: 214, z: frameZ(10) - 3 }, cam);
  if (at.x < -400 || at.x > 1500) return;
  const s = at.s;
  const w = 168 * s, h = 70 * s;
  const x = at.x - w + 8 * s, y = at.y;
  const safe = clamp01((x - 64 - 8) / 70);
  const a = seg(t, 0, 0.22) * sm(safe);
  if (a <= 0.01) return;
  const paper = a, ink = a;
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
  c.globalAlpha = 1;
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
    const x = 1196 - tw, y = 62;
    c.fillStyle = withAlpha(mixLab(mood.ink, mood.fg, 0.4), 0.72 * a);
    c.beginPath();
    c.roundRect(x - 18, y - size * 1.05, tw + 36, size * 1.55, 6);
    c.fill();
    c.globalAlpha = a;
    c.fillStyle = mixLab(mood.core, '#ffffff', 0.15);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText(text, x, y);
    textProbe(c, `${ID}-status`, x, y - size, tw, size * 1.2, a);
  });
  c.restore();
}
