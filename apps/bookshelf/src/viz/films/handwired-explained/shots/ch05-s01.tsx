/**
 * ch05-s01 — THE GIANT MATMUL REVEALED AS A LOOM (scene, serverCyan; crossfade in from the ch04 X-ray desk; 18.17 s).
 *   L0501  "Now feed the program's operations into a loom, a hundred and thirty layers deep."
 *   L0501a "Each step drops into the first layer after the steps it needs."
 *   L0502  "Copper threads add. Indigo threads subtract. Most of it is empty air."
 *
 * The loom (sets/ch05-s01-loom3d): the REAL compiled HandwiredOS circuit (chenglou/handwired@257856e, sets/circuit.ts):
 * 130 thin upright frames, one per layer, each a flat at its own depth, receding diagonally from the near end post (the
 * 234 source cells) toward the far windows of a dark workshop (sets/ch05-s01-room). One thread per stored weight
 * (9,909), from the frame that made the value it reads to a knot on the face of the frame that reads it; copper adds,
 * indigo subtracts. One small ReLU ramp per gate on each frame's right stile, a detent wheel per boolean row under it.
 *
 * The builder ribbon of ch03-s02 (a paper band of operation tags, each pinned one column right of its deepest input:
 * the same illustrative toy list, its shape not the repo's own program) runs in from the left, over the end post's
 * roller and along the frames' heads, like warp thread. Its columns ARE the frames: column d drops into frame d-1.
 *
 * TEACHES, word by word:
 *   0.0              tight on the ribbon; it runs out of frame left
 *   ribbon (1.70)    the ribbon starts to feed right; the camera picks it up and follows
 *   loom (2.90)      the ribbon reaches the end post and runs into the loom along the frames' heads
 *   frames (3.94)    the camera pulls back and trucks: the long run of frames recedes; the end post's brass plate
 *                    130 LAYERS comes up, paper and lettering together, and catches the light (the only words on screen)
 *   loom (2.90)+     the ribbon stops with its deepest column just short of the post (no tag rides onto the heads);
 *                    the tags drop off by depth, a column every 0.12 s, pairs together, each onto the head rail of
 *                    its own frame (or just under it on two short strings): rows that step down and back, left to
 *                    right, frame by frame; tags of equal depth sit side by side on ONE rail (frames 0, 2, 5); one
 *                    ReGLU tag stays on the ribbon. Each frame's rail flashes as its tags land
 *   step (6.43)      the camera eases in on the near frames; the waiting ReGLU tag glows
 *   first (8.13)     frame 3, still empty, lights: the first frame after its inputs'
 *   layer (8.62)     it drops and slides in along its own row, under the seated rows (a clear lane)
 *   after/needs      faint threads draw from it BACK to its two inputs (9.2 → 10.4); then the two inputs, side by side
 *                    in frame 2, pulse together for 0.6 s: no thread between them; the tags settle into knots
 *   Copper (11.33)   copper threads (#c8794a) lift to full, indigo drops to a quarter, ~1.2 s
 *   Indigo (13.15)   the reverse (indigo #6f7fb8); then both settle at 60 %
 *   empty (16.34)    the camera pushes toward frame 4 and racks focus to it: its face lights as its whole matrix
 *                    (52 operations × 98 inputs it reads, one dim point per cell) with just 101 knots lit: a few
 *                    threads across a big field of dark air (a local vignette behind it; every other frame sinks).
 *                    The brass plate is gone by then: the shot ends on the sparse frame alone.
 * Near plane (L5): a spoked warp-beam flange cut from black card, lower right.
 * The loom never moves; haze drifts and the threads shimmer faintly, as if under tension.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, cam3Interp, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { OP_TAG, opTag, paperOf, plateInk, type OpKind } from '../sets/ch03-s02-plate';
import { LOOM, frameH, frameW, frameX, frameZ, loom3, project, scaleAt, screenSpace, type LoomRun } from '../sets/ch05-s01-loom3d';
import { loomRoom } from '../sets/ch05-s01-room';

type C2 = CanvasRenderingContext2D;
const ID = 'ch05-s01';
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

// ---------------------------------------------------------------- the ribbon's toy list (ch03-s02's, verbatim)
interface Op {
  kind: OpKind;
  ins: number[];
}
const OPS: Op[] = [
  { kind: 'sum', ins: [-1, -2] },
  { kind: 'sum', ins: [-3, -4] },
  { kind: 'ReGLU', ins: [0, 1] },
  { kind: 'boolean', ins: [2] },
  { kind: 'sum', ins: [2, -3] },
  { kind: 'ReGLU', ins: [3, 4] },
  { kind: 'sum', ins: [5, -1] },
  { kind: 'boolean', ins: [6] },
  { kind: 'sum', ins: [6, 4] },
  { kind: 'ReGLU', ins: [7, 8] },
];
/** depth = one column right of the deepest input (pins are depth 0); column d drops into frame d - 1 */
const DEPTH: number[] = [];
OPS.forEach((op, i) => (DEPTH[i] = 1 + Math.max(...op.ins.map((j) => (j < 0 ? 0 : DEPTH[j])))));
/** within a column: slot -1 / +1 for a pair (side by side), 0 alone */
const SLOT: number[] = OPS.map((_, i) => {
  const same = OPS.map((__, j) => j).filter((j) => DEPTH[j] === DEPTH[i]);
  return same.length < 2 ? 0 : same.indexOf(i) === 0 ? -1 : 1;
});
/** the held tag (ReGLU reading ops 3 and 4) and its two inputs */
const HELD = 5;
const PAIR = [3, 4];

// ribbon geometry (world): a paper band above the frames' heads
const RIB_Y0 = 58, RIB_Y1 = 84;
const SP = 74; // column pitch on the horizontal run (world px at z0)
/** columns the ribbon still has to feed at the start, and where it stops: the deepest column just short of the post,
 *  so no tag ever rides onto the frames' heads (review r1: they bunched there) */
const FEED0 = 14, FEED1 = 7.4;
const TAG_S = 0.6;
const TAG_W = OP_TAG.w * TAG_S, TAG_H = OP_TAG.h * TAG_S;
/** a tag's flight from the ribbon to its seat (s) and the stagger between columns (review r1: about 0.12 s) */
const FLY = 0.6, STAGGER = 0.12;

/** where a tag hangs under the band (a pair at two string lengths, side by side in its column) */
const hangY = (i: number) => RIB_Y1 + (SLOT[i] === 0 ? 34 : SLOT[i] < 0 ? 22 : 50);

/** the top of frame l's head rail (world y) */
const railTop = (l: number) => LOOM.yc - frameH(l) / 2 - 2.6 * 1.8;
/** each receiving frame's row: a tag sits ON its own frame's head rail, or (where the row before it would overlap)
 *  hangs just under it on two short strings, so the rows step down and back, left to right, frame by frame */
const ROW_BOTTOM: number[] = [];
for (let l = 0; l <= 6; l++) ROW_BOTTOM[l] = Math.max(railTop(l), l ? ROW_BOTTOM[l - 1] + TAG_H + 5 : railTop(l));
/** a tag's seat (world): pairs side by side on one rail (a 14 px gap), singles a little right of the frame's centre */
function seatOf(i: number) {
  const l = DEPTH[i] - 1;
  const slot = SLOT[i];
  const x = frameX(l) + (slot === 0 ? 12 + l * 6 : slot * (TAG_W / 2 + 7) + l * 3);
  return { x, y: ROW_BOTTOM[l] - TAG_H / 2, z: frameZ(l) - 2, l, hang: ROW_BOTTOM[l] - railTop(l) };
}

/** a ribbon coordinate u (columns from the end post) to a world point on the band's centre line */
function ribbonPt(u: number, yy: number) {
  if (u <= 0) return { x: frameX(-1) + u * SP, y: yy, z: LOOM.z0 };
  const l = u - 1;
  return { x: frameX(-1) + (frameX(l) - frameX(-1)), y: yy, z: frameZ(l) };
}

// ---------------------------------------------------------------- camera
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
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });

interface Beats {
  D: number;
  ribbon: number;
  loom: number;
  frames: number;
  step: number;
  drops: number;
  first: number;
  layer: number;
  after: number;
  needs: number;
  copper: number;
  indigo: number;
  most: number;
  empty: number;
  /** the ribbon's feed window */
  feed0: number;
  feed1: number;
}

/** drop order: by depth, nearest column first (so no flying tag crosses one still hanging), pairs together */
const COLS_ORDER = [7, 6, 5, 3, 2, 1];
const dropAtOf = (b: Beats, i: number) =>
  i === HELD ? b.layer - 0.1 : b.loom + 0.12 + COLS_ORDER.indexOf(DEPTH[i]) * STAGGER + (SLOT[i] > 0 ? 0.04 : 0);

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      ribbon: T.beat('ribbon'),
      loom: T.beat('loom'),
      frames: T.beat('frames'),
      step: T.word('L0501a', 'step'),
      drops: T.word('L0501a', 'drops'),
      first: T.word('L0501a', 'first'),
      layer: T.beat('layer'),
      after: T.word('L0501a', 'after'),
      needs: T.word('L0501a', 'needs'),
      copper: T.beat('copper'),
      indigo: T.beat('indigo'),
      most: T.word('L0502', 'Most'),
      empty: T.beat('empty'),
      feed0: T.beat('ribbon') - 0.15,
      feed1: T.beat('loom') + 0.1,
    };
    const f4 = { x: frameX(4), z: frameZ(4) };
    const keys: Key[] = [
      { t: 0, cam: C(-150, 150, 330) },
      { t: b.loom + 0.2, cam: C(70, 182, 300) },
      // the reveal: truck right and tilt down while 'a hundred and thirty layers deep' is said; the run recedes
      { t: b.frames + 2.3, cam: C(330, 262, 170) },
      // ease in on the near frames for the drop rule: the held tag on the ribbon at left, the rows of seated tags right
      { t: b.layer - 0.4, cam: C(205, 236, 330) },
      { t: b.needs + 0.4, cam: C(214, 240, 342) },
      // ease back for the colours: the whole run's threads
      { t: b.indigo + 0.2, cam: C(430, 312, 140) },
      { t: b.most - 0.6, cam: C(440, 314, 150) },
      // push toward frame 4 for 'empty air'
      { t: b.empty + 1.0, cam: C(f4.x + 40, LOOM.yc - 6, 610) },
      { t: b.D + 0.4, cam: C(f4.x + 42, LOOM.yc - 6, 632) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(sc.keys, t);
    f.camera(cam);

    // ---- the ribbon's feed and the tags' state (on twos)
    const feed = FEED1 + (1 - smr((tq - b.feed0) / (b.feed1 - b.feed0))) * (FEED0 - FEED1);
    const tagState = OPS.map((op, i) => {
      const d = DEPTH[i];
      const u = d - feed;
      const dropAt = dropAtOf(b, i);
      const du = clamp01((tq - dropAt) / (i === HELD ? 0.75 : FLY));
      return { op, i, d, u, dropAt, du };
    });
    // the held tag glows from 'step'; its destination (frame 3, still empty) lights on 'first'; the threads back to its
    // two inputs draw on 'after … needs'; then the two inputs (side by side in frame 2) pulse together, no thread
    // between them
    const heldGlow = seg(t, b.step - 0.1, b.step + 0.35) * (1 - seg(t, b.needs + 0.7, b.needs + 1.3));
    const seatLit = seg(t, b.first - 0.15, b.first + 0.25) * (1 - seg(t, b.layer + 0.6, b.layer + 1.1));
    const threadsU = seg(t, b.after - 0.1, b.needs + 0.1);
    const pairGlow = seg(t, b.needs + 0.15, b.needs + 0.3) * (1 - seg(t, b.needs + 0.75, b.needs + 0.95));
    // after the rule is shown, the tags settle into the frames (they become knots on the faces)
    const tagFade = 1 - seg(t, b.needs + 1.0, b.copper + 0.35);
    // copper vs indigo: each family in its own hue; on its word it lifts to full while the other drops to a quarter,
    // for about 1.2 s; then both settle at 60 %
    const cu1 = seg(t, b.copper - 0.15, b.copper + 0.25) * (1 - seg(t, b.copper + 1.25, b.copper + 1.7));
    const iu1 = seg(t, b.indigo - 0.15, b.indigo + 0.25) * (1 - seg(t, b.indigo + 1.2, b.indigo + 1.65));
    const base = 0.5 + 0.1 * seg(t, b.copper + 1.25, b.copper + 1.7);
    const famC = base + (1 - base) * cu1 - (base - 0.25) * iu1;
    const famI = base + (1 - base) * iu1 - (base - 0.25) * cu1;
    const rack = seg(t, b.empty - 0.5, b.empty + 0.4);
    const lattice = seg(t, b.empty - 0.2, b.empty + 0.7);
    const focusZ = 1050 + (frameZ(4) - 1050) * rack;
    // each receiving frame's head rail flashes as its tags land
    const lit: Record<number, number> = {};
    for (const st of tagState) {
      if (st.du <= 0) continue;
      const l = st.d - 1;
      const land = st.dropAt + (st.i === HELD ? 0.75 : FLY);
      const v = seg(t, land - 0.1, land + 0.05) * (1 - seg(t, land + 0.35, land + 0.9)) * 0.55;
      lit[l] = Math.max(lit[l] ?? 0, v);
    }
    lit[3] = Math.max(lit[3] ?? 0, seatLit * 0.7);
    lit[4] = Math.max(lit[4] ?? 0, lattice * 0.5);

    loomRoom(f, cam, { key: ID, cams: sc.keys.map((k) => k.cam), sunX: 1080, tubes: 0.75 });

    loom3(
      f,
      {
        cam,
        tq,
        fam: { copper: famC, indigo: famI },
        focusZ,
        dof: 3.4 + rack * 1.2,
        maxBlur: 4.5 + rack * 2,
        lit,
        lattice: { frame: 4, u: lattice },
        vignette: { frame: 4, u: lattice },
        // rack: every other frame (and its threads) sinks as frame 4 takes the focus: its own few threads remain
        frameAlpha: (l) => (l === 4 ? 1 : 1 - rack * (l < 4 ? 0.8 : 0.72)),
        threads: 1,
      },
      {
        run: (c, env, r) => {
          if (r.frames.includes(-1)) {
            ribbon(c, env, cam, feed, tq);
            plate(c, env, cam, t, b);
          }
        },
        top: (c, env) => {
          // tags still on the ribbon (not yet dropped): drawn on the band
          for (const s of tagState) if (s.du <= 0) ribbonTag(c, env, cam, s, tq, s.i === HELD ? heldGlow : 0);
          // seated tags, far rows first, then any in flight on top
          if (tagFade > 0) {
            const seated = tagState.filter((s) => s.du >= 1).sort((p, q) => q.d - p.d);
            for (const s of seated) seatTag(c, env, cam, s, tq, tagFade, s.i === HELD ? heldGlow : PAIR.includes(s.i) ? pairGlow : 0, 1 - rack * 0.6);
            if (threadsU > 0) pairThreads(c, env, cam, threadsU, tagFade);
            for (const s of tagState) if (s.du > 0 && s.du < 1) flyTag(c, env, cam, s, feed, tq, s.i === HELD ? heldGlow : 0);
          }
        },
      },
    );
    f.rim({ x: 0.55, y: -0.8 });

    // L5: a warp beam's end, cut from black card, wound with thread, in the lower right corner (the near plane)
    f.layer('L5', (c, env) => {
      c.save();
      screenSpace(c, LAYERS.L5, cam);
      const px = 1225 - (cam.x - 200) * 0.14, py = 745 - (cam.y - 250) * 0.12 + (cam.z - 300) * 0.05;
      const R = 150;
      // a spoked flange wheel cut from black card (pierced: the room shows between its spokes) on a heavy upright
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.95);
      c.beginPath();
      c.arc(px, py, R, 0, Math.PI * 2);
      const N = 6, rot = 0.2;
      for (let k = 0; k < N; k++) {
        const a0 = rot + (k / N) * Math.PI * 2 + 0.17, a1 = rot + ((k + 1) / N) * Math.PI * 2 - 0.17;
        c.moveTo(px + Math.cos(a0) * 42, py + Math.sin(a0) * 42);
        c.arc(px, py, R - 20, a0, a1);
        c.arc(px, py, 42, a1, a0, true);
        c.closePath();
      }
      c.fill('evenodd');
      c.fillRect(px - 24, py + R - 30, 48, 400);
      c.fillRect(px - 90, py + R + 40, 180, 30);
      // the rim catching the key on the upper left only, and the axle boss
      c.strokeStyle = withAlpha(env.mood.rim, 0.45);
      c.lineWidth = 2;
      c.beginPath();
      c.arc(px, py, R - 1, Math.PI * 1.02, Math.PI * 1.6);
      c.stroke();
      c.strokeStyle = withAlpha(env.mood.rim, 0.22);
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(px, py, R - 21, Math.PI * 1.05, Math.PI * 1.55);
      c.stroke();
      c.fillStyle = withAlpha(mixLab(PUPPET_NEAR_BLACK, env.mood.rim, 0.12), 1);
      c.beginPath();
      c.arc(px, py, 16, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });
  },
});


// ---------------------------------------------------------------- the ribbon (screen px)
function bandQuad(cam: Camera3, u0: number, u1: number) {
  const a0 = project(ribbonPt(u0, RIB_Y0), cam), a1 = project(ribbonPt(u0, RIB_Y1), cam);
  const b0 = project(ribbonPt(u1, RIB_Y0), cam), b1 = project(ribbonPt(u1, RIB_Y1), cam);
  return [a0, b0, b1, a1];
}
function ribbon(c: C2, env: PaintEnv, cam: Camera3, feed: number, tq: number) {
  const paper = paperOf(env);
  const ink = plateInk(env);
  // the horizontal run (u from -30 to 0) and the run along the frames' heads (0 → 9)
  const segs: [number, number][] = [[-30, 0]];
  for (let u = 0; u < 9; u += 0.5) segs.push([u, u + 0.5]);
  for (const [u0, u1] of segs) {
    const q = bandQuad(cam, u0, u1);
    const zMid = ribbonPt((u0 + u1) / 2, 0).z;
    c.fillStyle = mixLab(mixLab(paper, env.mood.set, 0.62), env.mood.haze, Math.max(0, (zMid - 1000) / 3600) * 0.6);
    c.beginPath();
    c.moveTo(q[0].x, q[0].y);
    q.slice(1).forEach((p) => c.lineTo(p.x, p.y));
    c.closePath();
    c.fill();
  }
  // the band's lit top edge and its faint column rules (a column = a dependency depth = a frame)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.75);
  c.lineWidth = 1.2;
  c.beginPath();
  const top0 = project(ribbonPt(-30, RIB_Y0), cam);
  c.moveTo(top0.x, top0.y);
  for (let u = 0; u <= 9; u += 0.5) {
    const p = project(ribbonPt(u, RIB_Y0), cam);
    c.lineTo(p.x, p.y);
  }
  c.stroke();
  c.strokeStyle = withAlpha(ink, 0.22);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let k = -16; k <= 9; k++) {
    // rules ride with the paper: at ribbon coordinate k - feed (+0.5: between columns)
    const u = k + 0.5 - (feed % 1);
    if (u < -30 || u > 9) continue;
    const p = project(ribbonPt(u, RIB_Y0 + 4), cam), q = project(ribbonPt(u, RIB_Y1 - 4), cam);
    c.moveTo(p.x, p.y);
    c.lineTo(q.x, q.y);
  }
  c.stroke();
  // the end post's roller the band passes over
  const r = project({ x: frameX(-1), y: RIB_Y1 + 10, z: LOOM.z0 - 4 }, cam);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.ellipse(r.x, r.y, 9 * r.s, 9 * r.s, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(env.mood.rim, 0.6);
  c.lineWidth = 1;
  c.beginPath();
  c.arc(r.x, r.y, 9 * r.s, Math.PI * 1.1, Math.PI * 1.7);
  c.stroke();
  void tq;
}

/** a tag's place on the band (world) */
const onRibbon = (i: number, u: number) => ({ ...ribbonPt(u, hangY(i)), z: LOOM.z0 - 1 });

/** a tag on the band (before it drops) */
function ribbonTag(c: C2, env: PaintEnv, cam: Camera3, s: { i: number; d: number; u: number }, tq: number, glow: number) {
  if (s.u < -30 || s.u > 0.2) return;
  const p = project(onRibbon(s.i, s.u), cam);
  if (p.x < -80 || p.x > 1360) return;
  const top = project(ribbonPt(s.u, RIB_Y1), cam);
  const sc = TAG_S * p.s;
  // the tag's short string from the band's lower edge
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.8);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(top.x, top.y);
  c.lineTo(p.x - 47 * sc, p.y - 22 * sc * 0.5);
  c.stroke();
  opTag(c, env, { x: p.x, y: p.y, kind: OPS[s.i].kind, scale: sc, glow: glow * 0.9, nod: 0.03 * Math.sin(tq * 2 + s.i) });
  if (glow > 0.02) tagHalo(c, env, p.x, p.y, sc, glow);
}

/** a tag in flight from the band to its seat. Ordinary tags arc over; the held tag drops first and then slides in
 *  along its own row, under the rows already seated (a clear lane: it never crosses a seated tag) */
function flyTag(c: C2, env: PaintEnv, cam: Camera3, s: { i: number; d: number; u: number; du: number }, feed: number, tq: number, glow: number) {
  const u0 = DEPTH[s.i] - feed;
  const a = onRibbon(s.i, u0);
  const z = seatOf(s.i);
  const u = s.du;
  let w: { x: number; y: number; z: number };
  if (s.i === HELD) {
    const ey = sm(u / 0.42), ex = smr((u - 0.12) / 0.88);
    w = { x: a.x + (z.x - a.x) * ex, y: a.y + (z.y - a.y) * ey, z: a.z + (z.z - a.z) * ex };
  } else {
    const e = smr(u);
    w = { x: a.x + (z.x - a.x) * e, y: a.y + (z.y - a.y) * e - 34 * Math.sin(Math.PI * e), z: a.z + (z.z - a.z) * e };
  }
  const p = project(w, cam);
  const sc = TAG_S * p.s;
  opTag(c, env, { x: p.x, y: p.y, kind: OPS[s.i].kind, scale: sc, glow: glow * 0.9, nod: 0.1 * Math.sin(u * Math.PI) * (s.i % 2 ? 1 : -1) });
  if (glow > 0.02) tagHalo(c, env, p.x, p.y, sc, glow);
  void tq;
}

/** a seated tag on its frame's head rail (or hanging just under it on two short strings) */
function seatTag(c: C2, env: PaintEnv, cam: Camera3, s: { i: number; d: number; du: number; dropAt: number }, tq: number, fade: number, glow: number, a: number) {
  if (fade <= 0) return;
  const w = seatOf(s.i);
  const p = project(w, cam);
  const sc = TAG_S * p.s;
  const settle = clamp01((tq - (s.dropAt + (s.i === HELD ? 0.75 : FLY))) / 0.4);
  const nod = 0.05 * (1 - settle) * Math.sin(settle * 9) + 0.012 * Math.sin(tq * 1.3 + s.i);
  c.save();
  c.globalAlpha = fade * a;
  if (w.hang > 1.5) {
    // two short strings up to the rail
    const rt = project({ x: w.x, y: railTop(w.l) + 2, z: w.z }, cam);
    c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.75);
    c.lineWidth = 0.9;
    c.beginPath();
    for (const k of [-0.3, 0.3]) {
      c.moveTo(p.x + k * TAG_W * p.s, rt.y);
      c.lineTo(p.x + k * TAG_W * p.s, p.y - (TAG_H / 2) * p.s + 1);
    }
    c.stroke();
  }
  opTag(c, env, { x: p.x, y: p.y, kind: OPS[s.i].kind, scale: sc, glow, nod });
  c.restore();
  if (glow > 0.02) tagHalo(c, env, p.x, p.y, sc, glow * fade);
}

function tagHalo(c: C2, env: PaintEnv, x: number, y: number, sc: number, glow: number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  const r = 64 * sc;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(env.mood.core, 0.3 * glow));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
}

/** faint threads drawn BACK from the held ReGLU (frame 3) to each of its two inputs (side by side in frame 2) */
function pairThreads(c: C2, env: PaintEnv, cam: Camera3, u: number, fade: number) {
  const to = project(seatOf(HELD), cam);
  const end = { x: to.x - (TAG_W / 2) * to.s, y: to.y };
  c.save();
  c.lineCap = 'round';
  PAIR.forEach((pi, k) => {
    const from = project(seatOf(pi), cam);
    const p0 = { x: from.x + (k === 0 ? 0 : -(TAG_W / 4)) * from.s, y: from.y + (TAG_H / 2) * from.s };
    const v = clamp01(u * 1.25 - k * 0.25);
    if (v <= 0) return;
    c.strokeStyle = withAlpha(mixLab(env.mood.core, '#e9b48a', 0.35), 0.7 * fade);
    c.lineWidth = 1.3;
    c.beginPath();
    const N = 16;
    for (let n = 0; n <= N; n++) {
      // drawn from the reader back to the input
      const tt = (n / N) * v;
      const x = end.x + (p0.x - end.x) * tt;
      const y = end.y + (p0.y - end.y) * tt + Math.sin(tt * Math.PI) * 8;
      if (n === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  });
  c.restore();
}

/** the brass plate on the end post: 130 LAYERS (the only words on screen); a glint runs across it on 'frames' */
function plate(c: C2, env: PaintEnv, cam: Camera3, t: number, b: Beats) {
  // review r1: the plate and its lettering come up TOGETHER on 'hundred' (never a blank brass card), and the plate is
  // gone before the final rack drifts it out of frame (the shot ends on the sparse frame alone)
  const pa = seg(t, b.frames - 0.2, b.frames + 0.25) * (1 - seg(t, b.empty - 0.75, b.empty + 0.15));
  if (pa <= 0.002) return;
  const p = project({ x: frameX(-1) - 78, y: 318, z: LOOM.z0 - 8 }, cam);
  if (p.x < -200 || p.x > 1480) return;
  const s = p.s;
  const w = 128 * s, h = 40 * s;
  const brass = mixLab('#a8844a', env.mood.halo, 0.22);
  c.save();
  c.globalAlpha = pa;
  // two brass screws and the plate
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5);
  c.fillRect(p.x - w / 2 + 2 * s, p.y - h / 2 + 3 * s, w, h);
  const g = c.createLinearGradient(p.x - w / 2, p.y - h / 2, p.x + w / 2, p.y + h / 2);
  g.addColorStop(0, mixLab(brass, env.mood.core, 0.25));
  g.addColorStop(1, mixLab(brass, env.mood.set, 0.35));
  c.fillStyle = g;
  c.fillRect(p.x - w / 2, p.y - h / 2, w, h);
  c.strokeStyle = withAlpha(mixLab(brass, PUPPET_NEAR_BLACK, 0.5), 0.9);
  c.lineWidth = Math.max(0.8, 1.2 * s);
  c.strokeRect(p.x - w / 2 + 3 * s, p.y - h / 2 + 3 * s, w - 6 * s, h - 6 * s);
  // its bracket to the post
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(p.x + w / 2, p.y - 3 * s, 14 * s, 6 * s);
  // the lettering is inked with the plate (globalAlpha carries the plate's fade)
  const ink = 1;
  cardProbe(c, `${ID}-plate-card`, p.x - w / 2, p.y - h / 2, w, h, pa, pa);
  if (ink > 0) textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 ${(19 * s).toFixed(2)}px ${FONT.sc}`, 19 * s, '130 LAYERS');
    c.font = `600 ${size.toFixed(2)}px ${FONT.sc}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = withAlpha(mixLab('#2a1d10', env.mood.ink, 0.3), ink);
    c.fillText('130 LAYERS', p.x, p.y + 1.5 * s);
    const tw = c.measureText('130 LAYERS').width;
    textProbe(c, `${ID}-plate`, p.x - tw / 2, p.y - size / 2, tw, size, pa);
  });
  // the glint on 'frames'
  const gu = (t - (b.frames - 0.1)) / 1.1;
  if (gu > 0 && gu < 1) {
    c.save();
    c.beginPath();
    c.rect(p.x - w / 2, p.y - h / 2, w, h);
    c.clip();
    c.globalCompositeOperation = 'lighter';
    const gx = p.x - w / 2 - w * 0.3 + gu * w * 1.6;
    const gg = c.createLinearGradient(gx - w * 0.18, 0, gx + w * 0.18, 0);
    gg.addColorStop(0, withAlpha(env.mood.core, 0));
    gg.addColorStop(0.5, withAlpha(env.mood.core, 0.55 * pa * Math.sin(gu * Math.PI)));
    gg.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = gg;
    c.fillRect(p.x - w / 2, p.y - h / 2, w, h);
    c.restore();
  }
  c.restore();
}

void LAYERS;
void frameH;
void scaleAt;
void screenSpace;
export type { LoomRun };
