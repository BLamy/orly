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
 *                    130 LAYERS catches the light (the only words on screen)
 *   ~4.4             the tags drop off the ribbon into the frames by depth, all at once: tags of equal depth fall into
 *                    the SAME frame, side by side (frames 0, 2 and 5 take two each); one ReGLU tag stays on the ribbon
 *   step (6.43)      the camera eases in on the near frames; the waiting ReGLU tag glows
 *   drops (7.29)     the two tags it reads, side by side in frame 2, glow together: no thread between them
 *   layer (8.62)     it drops into frame 3, the first frame after theirs
 *   after/needs      two threads draw from the two tags into it (9.2 → 10.4); then the tags settle into knots
 *   Copper (11.33)   every copper thread catches the rim
 *   Indigo (13.15)   every indigo thread catches the rim
 *   empty (16.34)    the camera pushes toward frame 4 and racks focus to it: its face lights as its whole matrix
 *                    (52 operations × 98 inputs it reads, one dim point per cell) with just 101 knots lit: a few
 *                    threads across a big field of dark air
 * The loom never moves; haze drifts and the threads shimmer faintly, as if under tension.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, cam3Interp, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { opTag, paperOf, plateInk, type OpKind } from '../sets/ch03-s02-plate';
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
const RIB_Y0 = 64, RIB_Y1 = 132;
const SP = 74; // column pitch on the horizontal run (world px at z0)
const FEED0 = 8; // columns the ribbon still has to feed at the start
const TAG_S = 0.42;
/** a tag's resting row in its frame (world y): a descending cascade by depth */
const rowOf = (i: number) => 262 + (DEPTH[i] - 1) * 38;

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
  /** the tags' drop window (all but the held one) */
  drop0: number;
}

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
      layer: T.beat('layer'),
      after: T.word('L0501a', 'after'),
      needs: T.word('L0501a', 'needs'),
      copper: T.beat('copper'),
      indigo: T.beat('indigo'),
      most: T.word('L0502', 'Most'),
      empty: T.beat('empty'),
      feed0: T.beat('ribbon') - 0.15,
      feed1: T.beat('frames') + 0.2,
      drop0: T.beat('frames') + 0.35,
    };
    const f4 = { x: frameX(4), z: frameZ(4) };
    const keys: Key[] = [
      { t: 0, cam: C(-150, 196, 330) },
      { t: b.loom + 0.2, cam: C(90, 222, 300) },
      // the reveal: pull back and truck while 'a hundred and thirty layers deep' is said
      { t: b.frames + 3.4, cam: C(470, 300, 30) },
      // ease in on the near frames for the drop rule
      { t: b.layer + 1.6, cam: C(300, 304, 205) },
      { t: b.most - 0.4, cam: C(330, 308, 245) },
      // push toward frame 4 for 'empty air'
      { t: b.empty + 1.1, cam: C(f4.x + 6, LOOM.yc - 4, 520) },
      { t: b.D + 0.4, cam: C(f4.x + 8, LOOM.yc - 4, 548) },
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
    const feed = (1 - smr((tq - b.feed0) / (b.feed1 - b.feed0))) * FEED0;
    const tagState = OPS.map((op, i) => {
      const d = DEPTH[i];
      const u = d - feed;
      // drop: all but the held tag fall from frames+0.35, staggered a little by column; the held one on 'layer'
      const dropAt = i === HELD ? b.layer - 0.12 : b.drop0 + (d - 1) * 0.11 + (SLOT[i] > 0 ? 0.05 : 0);
      const du = clamp01((tq - dropAt) / 0.5);
      return { op, i, d, u, dropAt, du };
    });
    // the pair glow, the held tag's glow, the two threads
    const pairGlow = seg(t, b.drops - 0.15, b.drops + 0.3) * (1 - seg(t, b.needs + 0.9, b.needs + 1.7));
    const heldGlow = seg(t, b.step - 0.1, b.step + 0.35) * (1 - seg(t, b.needs + 0.9, b.needs + 1.7));
    const threadsU = seg(t, b.after - 0.1, b.needs + 0.2);
    // after the rule is shown, the tags settle into the frames (they become knots on the faces)
    const tagFade = 1 - seg(t, b.needs + 1.1, b.copper + 0.2);
    // the loom's own teaching channels
    const copperU = seg(t, b.copper - 0.15, b.copper + 0.6) * (1 - 0.55 * seg(t, b.indigo - 0.2, b.indigo + 0.6));
    const indigoU = seg(t, b.indigo - 0.15, b.indigo + 0.6) * (1 - 0.6 * seg(t, b.most - 0.2, b.most + 0.6));
    const rack = seg(t, b.empty - 0.5, b.empty + 0.4);
    const lattice = seg(t, b.empty - 0.2, b.empty + 0.7);
    const focusZ = 1050 + (frameZ(4) - 1050) * rack;

    loomRoom(f, cam, { key: ID, cams: sc.keys.map((k) => k.cam), sunX: 1080, tubes: 0.75 });

    loom3(
      f,
      {
        cam,
        tq,
        copper: copperU,
        indigo: indigoU,
        focusZ,
        dof: 3.4 + rack * 1.2,
        maxBlur: 4.5 + rack * 2,
        lit: { 2: pairGlow * 0.6, 3: seg(t, b.layer, b.layer + 0.4) * (1 - seg(t, b.needs + 0.9, b.needs + 1.7)) * 0.6, 4: lattice * 0.5 },
        lattice: { frame: 4, u: lattice },
        // rack: the other frames dim a little as frame 4 takes the focus
        frameAlpha: (l) => (l === 4 ? 1 : 1 - rack * (l < 4 ? 0.45 : 0.35)),
        threads: 1,
      },
      {
        run: (c, env, r) => {
          if (r.frames.includes(-1)) {
            ribbon(c, env, cam, feed, tq);
            plate(c, env, cam, t, b);
          }
          // tags inside their frames' runs (so the frames in front of them blur and occlude correctly)
          for (const s of tagState) {
            if (s.du <= 0) continue;
            if (!r.frames.includes(s.d - 1)) continue;
            dropTag(c, env, cam, s, tq, tagFade, s.i === HELD ? heldGlow : PAIR.includes(s.i) ? pairGlow : 0, 1 - rack * 0.6);
          }
        },
        top: (c, env) => {
          // tags still on the ribbon (not yet dropped): drawn on the band
          for (const s of tagState) if (s.du <= 0) ribbonTag(c, env, cam, s, tq, s.i === HELD ? heldGlow : 0);
          if (threadsU > 0 && tagFade > 0) pairThreads(c, env, cam, threadsU, tagFade, tagState);
        },
      },
    );
    f.rim({ x: 0.55, y: -0.8 });

    // L5: the ribbon's supply bobbin, soft at the lower left of the opening (it slides off as the camera trucks)
    f.layer('L5', (c, env) => {
      const at = { x: -330, y: 560 };
      c.fillStyle = env.fill('fg');
      c.beginPath();
      c.ellipse(at.x, at.y, 70, 150, 0, 0, Math.PI * 2);
      c.rect(at.x - 18, at.y + 120, 36, 300);
      c.fill();
      c.strokeStyle = withAlpha(env.mood.rim, 0.35);
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(at.x, at.y, 70, 150, 0, -Math.PI * 0.9, -Math.PI * 0.35);
      c.stroke();
      // the band leaving the bobbin up toward the ribbon's run
      c.fillStyle = withAlpha(mixLab(paperOf(env), env.mood.fg, 0.55), 0.9);
      c.beginPath();
      c.moveTo(at.x + 40, at.y - 140);
      c.lineTo(at.x + 300, 150);
      c.lineTo(at.x + 300, 205);
      c.lineTo(at.x + 64, at.y - 90);
      c.closePath();
      c.fill();
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
    c.fillStyle = mixLab(mixLab(paper, env.mood.set, 0.12), env.mood.haze, Math.max(0, (zMid - 1000) / 3600) * 0.6);
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
  for (let k = -12; k <= 9; k++) {
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
  c.arc(r.x, r.y, 9 * r.s, Math.PI * 1.1 + tq * 0.0, Math.PI * 1.7);
  c.stroke();
  void tq;
}

/** a tag on the band (before it drops) */
function ribbonTag(c: C2, env: PaintEnv, cam: Camera3, s: { i: number; d: number; u: number }, tq: number, glow: number) {
  if (s.u < -30 || s.u > 9) return;
  const slot = SLOT[s.i];
  const yy = slot === 0 ? (RIB_Y0 + RIB_Y1) / 2 : slot < 0 ? RIB_Y0 + 19 : RIB_Y1 - 15;
  const p = project(ribbonPt(s.u, yy - 4), cam);
  if (p.x < -80 || p.x > 1360) return;
  const sc = TAG_S * p.s;
  opTag(c, env, { x: p.x, y: p.y + 22 * sc * 0.5, kind: OPS[s.i].kind, scale: sc, glow: glow * 0.9, nod: 0.03 * Math.sin(tq * 2 + s.i) });
}

/** a dropped tag, falling from the band into its frame (frame d-1), then hanging on the frame's face */
function tagWorld(s: { i: number; d: number; du: number }) {
  const l = s.d - 1;
  const slot = SLOT[s.i];
  const x = frameX(l) + slot * frameW(l) * 0.24;
  const yTop = slot === 0 ? (RIB_Y0 + RIB_Y1) / 2 : slot < 0 ? RIB_Y0 + 19 : RIB_Y1 - 15;
  // gravity-ish ease with a small settle
  const u = s.du;
  const fall = u < 0.8 ? (u / 0.8) * (u / 0.8) : 1 + 0.04 * Math.sin(((u - 0.8) / 0.2) * Math.PI);
  const y = yTop + (rowOf(s.i) - yTop) * fall;
  return { x, y, z: frameZ(l) - 2 };
}
function dropTag(c: C2, env: PaintEnv, cam: Camera3, s: { i: number; d: number; du: number }, tq: number, fade: number, glow: number, a: number) {
  if (fade <= 0) return;
  const w = tagWorld(s);
  const p = project(w, cam);
  const sc = TAG_S * p.s;
  const swing = s.du < 1 ? 0.12 * (1 - s.du) : 0.035 * Math.sin(tq * 1.7 + s.i) * Math.exp(-(tq - 4) * 0.2);
  c.save();
  c.globalAlpha = fade * a;
  // the tag lands as a knot: a small flash as it fades into the face
  opTag(c, env, { x: p.x, y: p.y, kind: OPS[s.i].kind, scale: sc, glow, nod: swing });
  c.restore();
  if (glow > 0.02) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const r = 60 * sc;
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, withAlpha(env.mood.core, 0.32 * glow * fade));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
    c.restore();
  }
}

/** the two threads from the pair (frame 2) into the held ReGLU (frame 3), drawn as they are named */
function pairThreads(c: C2, env: PaintEnv, cam: Camera3, u: number, fade: number, st: { i: number; d: number; du: number }[]) {
  const held = st[HELD];
  if (held.du < 0.8) return;
  const to = project(tagWorld(held), cam);
  const sc = TAG_S * to.s;
  const end = { x: to.x - 50 * sc, y: to.y + 22 * sc * 0.5 - 22 * sc * 0.5 };
  c.save();
  c.lineCap = 'round';
  PAIR.forEach((pi, k) => {
    const from = project(tagWorld(st[pi]), cam);
    const fs = TAG_S * from.s;
    const p0 = { x: from.x + 53 * fs, y: from.y - 22 * fs * 0.5 + 22 * fs * 0.5 };
    const v = clamp01(u * 1.25 - k * 0.25);
    if (v <= 0) return;
    c.strokeStyle = withAlpha(mixLab(env.mood.core, '#e9b48a', 0.35), 0.9 * fade);
    c.lineWidth = 1.5;
    c.beginPath();
    const N = 16;
    for (let n = 0; n <= N; n++) {
      const tt = (n / N) * v;
      const x = p0.x + (end.x - p0.x) * tt;
      const y = p0.y + (end.y - p0.y) * tt + Math.sin(tt * Math.PI) * 10;
      if (n === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  });
  c.restore();
}

/** the brass plate on the end post: 130 LAYERS (the only words on screen); a glint runs across it on 'frames' */
function plate(c: C2, env: PaintEnv, cam: Camera3, t: number, b: Beats) {
  const p = project({ x: frameX(-1) + 2, y: 486, z: LOOM.z0 - 8 }, cam);
  if (p.x < -200 || p.x > 1480) return;
  const s = p.s;
  const w = 128 * s, h = 40 * s;
  const brass = mixLab('#a8844a', env.mood.halo, 0.22);
  c.save();
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
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 ${(19 * s).toFixed(2)}px ${FONT.sc}`, 19 * s, '130 LAYERS');
    c.font = `600 ${size.toFixed(2)}px ${FONT.sc}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = mixLab('#2a1d10', env.mood.ink, 0.3);
    c.fillText('130 LAYERS', p.x, p.y + 1.5 * s);
    const tw = c.measureText('130 LAYERS').width;
    textProbe(c, `${ID}-plate`, p.x - tw / 2, p.y - size / 2, tw, size, 1);
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
    gg.addColorStop(0.5, withAlpha(env.mood.core, 0.55 * Math.sin(gu * Math.PI)));
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
