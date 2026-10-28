/**
 * ch07-s04 — THE LOOM RUN BACKWARDS (scene, dawnGold; crossfade in from the shut valve; 9.4 s). ch05's matmul loom, the
 * same 130 frames from the real compiled HandwiredOS circuit (sets/ch05-s01-loom3d, sets/circuit: the export of the
 * clone pinned at 257856e), in the same dark workshop (sets/ch05-s01-room), now at dawn.
 *   L0709 "Almost every operation runs backwards by a rule like that: on the real arithmetic, not the rounding."
 *
 * TEACHES, word by word:
 *   0–2        the loom at rest, seen from its output end, its nearest frames black cut paper against the backlight
 *   'backwards' the light enters at the far (output) end and runs back frame by frame toward the source post: the
 *              THREADS carry it (inside a window of about three frames round the front every thread of those frames
 *              flares warm white-gold, copper passing it, indigo passing it in a cool, inverted tint); behind the
 *              front they settle dim. The camera tracks left and pulls back to show the scale. The slip: sums
 *   'rule'     valves: only while open. Two gate frames are framed large: a raised shutter the light passes under,
 *              and a closed one where it stops and pools against the dark plate
 *   'arithmetic' the front reaches the near end and pools into the source table's pigeonholes (a 4 × 3 cubby)
 *   'rounding' the camera has pushed in and settled beside frame 26's detent wheel (the nearest of the real boolean
 *              frames) and its red-edged stop tag, at the left third; the light halted just short of it; the slip's
 *              last line inks: rounding: no rule unless asked. Hold.
 * Note: the real backward pass walks the program's operations last to first; the frames stand in for that order.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { LAYERS, cam3Interp, cardProbe, defineShot, FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import {
  LOOM, arcSlots, frameH, frameW, frameX, frameZ, kindOf, layerRows, loom3, project, rowAt, scaleAt, screenSpace, slotEnds, slotSign,
} from '../sets/ch05-s01-loom3d';
import { LAYER_START } from '../sets/circuit';
import { loomRoom } from '../sets/ch05-s01-room';
import { pencilRed } from '../sets/narratorHands';

const ID = 'ch07-s04';
type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });
const NL = 130;

/** frames that hold boolean rows (detent wheels), with the row of their middle wheel: computed from the export */
const DETENTS: { l: number; row: number; n: number }[] = (() => {
  const out: { l: number; row: number; n: number }[] = [];
  for (let l = 0; l < NL; l++) {
    const rows: number[] = [];
    for (let r = 0; r < layerRows(l); r++) if (kindOf(LAYER_START[l] + r) === 2) rows.push(r);
    if (rows.length) out.push({ l, row: rows[Math.floor(rows.length / 2)], n: rows.length });
  }
  return out;
})();
/** the wheel the camera settles beside: the nearest one to the source end */
const SETTLE = DETENTS[0];
/** frames that hold ReGLU gates */
const GATED: boolean[] = Array.from({ length: NL }, (_, l) => {
  for (let r = 0; r < layerRows(l); r++) if (kindOf(LAYER_START[l] + r) === 1) return true;
  return false;
});
/** a real gate frame near l (and the middle row of its ReGLU gates) for the framed shutters */
function gateNear(l0: number) {
  for (let d = 0; d < NL; d++) {
    for (const l of [l0 - d, l0 + d]) {
      if (l < 0 || l >= NL || !GATED[l] || DETENTS.some((x) => x.l === l)) continue;
      const rows: number[] = [];
      for (let r = 0; r < layerRows(l); r++) if (kindOf(LAYER_START[l] + r) === 1) rows.push(r);
      return { l, row: rows[Math.floor(rows.length / 2)] };
    }
  }
  return { l: l0, row: 0 };
}
/** the raised shutter the light passes under, and the closed one where it stops */
const OPEN_G = gateNear(57);
const SHUT_G = gateNear(36);
/** the big detent wheel beside frame 26 (world) and its stop tag */
const WHEEL = {
  x: frameX(SETTLE.l) + frameW(SETTLE.l) / 2 + 80,
  y: rowAt(SETTLE.l, SETTLE.row),
  z: frameZ(SETTLE.l) - 6,
  r: 70,
};
/** the source table's pigeonholes: a 4 × 3 cubby across the end post (world) */
const CUBBY = { x: frameX(-1), y: LOOM.yc - 10, z: frameZ(-1) - 12, cw: 26, ch: 26, cols: 4, rows: 3 };

interface Beats {
  D: number;
  reverse: number;
  gates: number;
  docs: number;
  rounding: number;
}

/** the backward front: a frame index (129 → −1 between 'backwards' and 'arithmetic') */
function frontAt(t: number, b: Beats) {
  const runU = (t - b.reverse + 0.05) / (b.docs - b.reverse + 0.05);
  return { runU, front: runU <= 0 ? NL + 4 : NL - 1 - (NL + 0.2) * (1 - Math.pow(1 - clamp01(runU), 1.6)) };
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, reverse: T.beat('reverse'), gates: T.beat('gates'), docs: T.beat('docs'), rounding: T.beat('rounding') };
    // the settle: the wheel at the left third, ~94 px across (≈140 at 1080p)
    const sz = WHEEL.z - 1150;
    const sScale = 1000 / (WHEEL.z - sz);
    const settle = C(WHEEL.x + (640 - 390) / sScale, WHEEL.y - 24, sz);
    const keys: { t: number; cam: Camera3 }[] = [
      { t: 0, cam: C(1180, 330, 250) },
      { t: b.reverse - 0.2, cam: C(1070, 332, 240) },
      // track left and pull back to the whole loom: the light reaching the post and its pigeonholes
      { t: b.docs - 0.1, cam: C(820, 340, -200) },
      // push in on the key idea: beside the detent wheel
      { t: b.rounding + 0.7, cam: settle },
      { t: b.D + 0.3, cam: C(settle.x - 8, settle.y, settle.z + 26) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const keys = sc.keys as { t: number; cam: Camera3 }[];
    const t = f.t;
    const tq = q2(t);
    let cam = keys[keys.length - 1].cam;
    for (let i = 0; i < keys.length - 1; i++) {
      if (t < keys[i + 1].t) {
        const u = (t - keys[i].t) / (keys[i + 1].t - keys[i].t);
        cam = cam3Interp(keys[i].cam, keys[i + 1].cam)(i === 0 ? u : sm(u));
        break;
      }
    }
    f.camera(cam);

    const { runU, front } = frontAt(t, b);
    // frames the front has passed settle DIM (the wave is the brightest thing)
    const lit: Record<number, number> = {};
    if (runU > 0) {
      for (let l = 0; l < NL; l++) {
        if (l < front - 0.5) continue;
        lit[l] = 0.06 + 0.2 * Math.exp(-Math.max(0, l - front) / 3);
      }
    }
    // the push toward frame 26 dissolves the frames between it and the camera, and thins the threads crossing near
    const dolly = win(t, b.docs + 0.1, b.rounding + 0.7);
    const pool = win(t, b.docs - 0.15, b.docs + 0.8);

    // the wall and floor a step darker (value hierarchy: the near frames read as black cut paper)
    loomRoom(f, cam, { key: ID, cams: keys.map((k) => k.cam), sunX: 1000, tubes: 0.45, dim: 0.45 });

    const frameAlpha = (l: number) => (l < SETTLE.l ? 1 - 0.94 * dolly : 1);
    loom3(
      f,
      {
        cam,
        tq,
        fam: { copper: 0.42, indigo: 0.36 },
        focusZ: frameZ(SETTLE.l) * dolly + 1300 * (1 - dolly),
        dof: 3.2,
        maxBlur: 6,
        lit,
        frameAlpha,
        keepFrame: (l) => (l < SETTLE.l + 24 ? 1 - 0.55 * dolly : 1 - 0.25 * dolly),
        vignette: { frame: SETTLE.l, u: 0.7 * dolly },
        // fog B (and A) on the loom cut ~40 %
        fogScale: 0.45,
        threads: 1,
      },
      {
        // the nearest frames inked near-black over the loom's own ink (cut paper against the backlight)
        run: (c, env, r) => {
          for (const l of r.frames) inkFrame(c, env, cam, l, frameAlpha(l));
        },
        top: (c, env) => {
          // THE WAVE: the threads themselves carry the light, ±3 frames round the front
          if (runU > 0 && front > -1.5) wave(c, env, cam, front, tq);
          // the framed gates: a raised shutter the light passes under; a closed one where it stops
          const gA = win(t, b.gates - 0.7, b.gates - 0.2);
          if (gA > 0) {
            shutter(c, env, cam, OPEN_G, true, gA, front, t);
            shutter(c, env, cam, SHUT_G, false, gA, front, t);
          }
          // small stop tags at the other detent frames, once the front has passed them
          for (const d of DETENTS) {
            if (d.l === SETTLE.l || front > d.l) continue;
            stopTag(c, env, cam, d, clamp01((d.l - front) / 2.5), tq);
          }
          // the light pools into the source table's pigeonholes
          cubby(c, env, cam, pool, t);
          // frame 26's detent wheel and its stop tag; the light halted just short of it
          bigWheel(c, env, cam, clamp01((SETTLE.l + 1.5 - front) / 2), tq, win(t, b.rounding - 0.4, b.rounding + 0.3));
        },
      },
    );
    f.rim({ x: 0.55, y: -0.8 });

    // L5: the near plane, a warp beam's flange cut from black card at the lower right, soft
    f.layer('L5', (c, env) => {
      c.save();
      screenSpace(c, LAYERS.L5, cam);
      const px = 1180 - (cam.x - 800) * 0.1, py = 760 + (cam.z - 300) * 0.04;
      const R = 140;
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.95);
      c.beginPath();
      c.arc(px, py, R, 0, Math.PI * 2);
      for (let k = 0; k < 6; k++) {
        const a0 = 0.3 + (k / 6) * Math.PI * 2 + 0.17, a1 = 0.3 + ((k + 1) / 6) * Math.PI * 2 - 0.17;
        c.moveTo(px + Math.cos(a0) * 40, py + Math.sin(a0) * 40);
        c.arc(px, py, R - 20, a0, a1);
        c.arc(px, py, 40, a1, a0, true);
        c.closePath();
      }
      c.fill('evenodd');
      c.strokeStyle = withAlpha(env.mood.rim, 0.4);
      c.lineWidth = 2;
      c.beginPath();
      c.arc(px, py, R - 1, Math.PI * 1.05, Math.PI * 1.6);
      c.stroke();
      c.restore();
    });

    rulesSlip(f.c, f.mood, t, b);
  },
});

/** a frame re-inked near-black, fading in with its nearness (the ~20 nearest frames are full black cut paper) */
function inkFrame(c: C2, env: PaintEnv, cam: Camera3, l: number, fa: number) {
  if (l < 0 || fa <= 0.01) return;
  const s = scaleAt(frameZ(l), cam);
  const a = clamp01((s - 0.42) / 0.3) * fa;
  if (a <= 0.01) return;
  const X = frameX(l), w = frameW(l), h = frameH(l);
  const cx = 640 + (X - cam.x) * s;
  const half = (w / 2) * s;
  if (cx + half < -40 || cx - half > 1320) return;
  const top = 360 + (LOOM.yc - h / 2 - cam.y) * s;
  const bot = 360 + (LOOM.yc + h / 2 - cam.y) * s;
  const floor = 360 + (LOOM.floor - cam.y) * s;
  const sw = Math.max(0.7, 2.6 * s);
  c.save();
  c.globalAlpha = a;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.rect(cx - half - sw, top - sw, sw, floor - top + sw);
  c.rect(cx + half, top - sw, sw, floor - top + sw);
  c.rect(cx - half - sw * 1.6, top - sw * 1.8, 2 * half + sw * 3.2, sw * 1.3);
  c.rect(cx - half - sw, bot, 2 * half + sw * 2, sw);
  c.rect(cx - half, bot + (floor - bot) * 0.55, 2 * half, Math.max(0.5, sw * 0.6));
  c.fill();
  // the backlight on the head rail's top edge only
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.6);
  c.lineWidth = Math.max(0.5, 1.1 * s);
  c.beginPath();
  c.moveTo(cx - half - sw * 1.6, top - sw * 1.8);
  c.lineTo(cx + half + sw * 1.6, top - sw * 1.8);
  c.stroke();
  c.restore();
}

/** the light dividing along every thread of the frames round the front (copper warm white-gold, indigo cool) */
function wave(c: C2, env: PaintEnv, cam: Camera3, front: number, tq: number) {
  const warm = mixLab('#fff1c8', env.mood.core, 0.25);
  const cool = mixLab('#c8d8ff', '#ffffff', 0.15);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  const l0 = Math.max(0, Math.floor(front - 0.5)), l1 = Math.min(NL - 1, Math.ceil(front + 3.5));
  for (let l = l0; l <= l1; l++) {
    const d = l - front;
    // the leading edge rises over half a frame; behind it the glow falls off across ~3 frames
    const I = d < 0 ? clamp01((d + 0.5) * 2) : Math.exp(-d / 1.4) * (0.94 + 0.06 * Math.sin(tq * 9 + l));
    if (I < 0.03) continue;
    const [k0, k1] = arcSlots(l);
    for (const sign of [1, -1]) {
      const path = new Path2D();
      let n = 0;
      let lwSum = 0;
      for (let k = k0; k < k1; k++) {
        if (slotSign(k) !== sign) continue;
        const [A, B] = slotEnds(k);
        const s0 = scaleAt(A.z, cam), s1 = scaleAt(B.z, cam);
        const x0 = 640 + (A.x - cam.x) * s0, y0 = 360 + (A.y - cam.y) * s0;
        const x1 = 640 + (B.x - cam.x) * s1, y1 = 360 + (B.y - cam.y) * s1;
        if (Math.max(x0, x1) < -20 || Math.min(x0, x1) > 1300) continue;
        const len = Math.abs(x1 - x0) + Math.abs(y1 - y0);
        path.moveTo(x0, y0);
        path.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + Math.min(14, len * 0.045), x1, y1);
        lwSum += (s0 + s1) / 2;
        n++;
      }
      if (!n) continue;
      const lw = Math.max(0.7, Math.min(1.8, 0.9 * (lwSum / n)));
      const col = sign > 0 ? warm : cool;
      const k = sign > 0 ? 1 : 0.7;
      c.strokeStyle = withAlpha(col, 0.22 * I * k);
      c.lineWidth = lw * 4;
      c.stroke(path);
      c.strokeStyle = withAlpha(col, 0.9 * I * k);
      c.lineWidth = lw;
      c.stroke(path);
    }
    // the frame itself catches the front: its stiles flare
    if (I > 0.5) {
      const p = project({ x: frameX(l), y: LOOM.yc, z: frameZ(l) }, cam);
      const h = frameH(l) * p.s;
      const half = (frameW(l) / 2) * p.s;
      c.strokeStyle = withAlpha(warm, 0.5 * (I - 0.5));
      c.lineWidth = Math.max(1, 2 * p.s);
      c.beginPath();
      c.moveTo(p.x - half, p.y - h / 2);
      c.lineTo(p.x - half, p.y + h / 2);
      c.moveTo(p.x + half, p.y - h / 2);
      c.lineTo(p.x + half, p.y + h / 2);
      c.stroke();
    }
  }
  c.restore();
}

/** a world point on gate row y at the right stile of frame l (fractional l interpolates) */
function rowPt(l: number, y: number) {
  const a = Math.max(-1, Math.floor(l)), b = Math.min(NL - 1, a + 1), u = l - a;
  const xa = frameX(a) + frameW(a) / 2 + 6, xb = frameX(b) + frameW(b) / 2 + 6;
  return { x: xa + (xb - xa) * u, y, z: frameZ(a) + (frameZ(b) - frameZ(a)) * u - 4 };
}

/**
 * A ReGLU shutter framed large on gate frame g.l at its gate row: open (the plate raised in its rails; the light runs
 * under it and on) or closed (the plate down; the light stops against it and pools on its right face)
 */
function shutter(c: C2, env: PaintEnv, cam: Camera3, g: { l: number; row: number }, open: boolean, a: number, front: number, t: number) {
  const Y = rowAt(g.l, g.row);
  const P = rowPt(g.l, Y);
  const p = project(P, cam);
  if (p.x < -80 || p.x > 1360) return;
  const s = p.s;
  const W = 34 * s, H = 120 * s;
  const lift = open ? 132 * s : 0;
  c.save();
  c.globalAlpha = a;
  // the rails and lintel
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(p.x - W / 2 - 5 * s, p.y - 200 * s, 4 * s, 270 * s);
  c.fillRect(p.x + W / 2 + 1 * s, p.y - 200 * s, 4 * s, 270 * s);
  c.fillRect(p.x - W / 2 - 9 * s, p.y - 204 * s, W + 18 * s, 6 * s);
  // the plate
  const py0 = p.y - H / 2 - lift;
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.18);
  c.fillRect(p.x - W / 2, py0, W, H);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.7);
  c.lineWidth = Math.max(0.8, 1.4 * s);
  c.beginPath();
  c.moveTo(p.x - W / 2, py0);
  c.lineTo(p.x + W / 2, py0);
  c.stroke();
  c.restore();
  // the light along the row: from three frames upstream (right) toward the shutter, as the front arrives
  const reach = g.l + 3 - front; // how far the front has come along this stretch (frames)
  if (reach <= 0) return;
  const hot = mixLab('#fff1c8', env.mood.core, 0.2);
  const end = open ? Math.max(g.l - 3, front) : g.l + 0.12;
  const from = g.l + 3;
  const N = 14;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const l = from + (Math.max(end, Math.min(from, front)) - from) * (i / N);
    pts.push(project(rowPt(l, Y), cam));
  }
  for (const [lw, al] of [[9 * s, 0.22], [3 * s, 0.9]] as const) {
    c.strokeStyle = withAlpha(hot, al * a);
    c.lineWidth = Math.max(1, lw);
    c.beginPath();
    pts.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
    c.stroke();
  }
  if (!open && front <= g.l + 0.6) {
    // stopped cold: the light pools against the plate's right face, nothing beyond
    const pu = clamp01((g.l + 0.6 - front) / 1.2) * a * (0.92 + 0.08 * Math.sin(t * 7));
    const r = 26 * s + 4;
    const gx = p.x + W / 2 + 4 * s;
    const rg = c.createRadialGradient(gx, p.y, 0, gx, p.y, r * 1.8);
    rg.addColorStop(0, withAlpha('#fff6dc', 0.85 * pu));
    rg.addColorStop(0.35, withAlpha(env.mood.core, 0.45 * pu));
    rg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = rg;
    c.fillRect(gx - r * 1.8, p.y - r * 1.8, r * 3.6, r * 3.6);
  }
  c.restore();
  if (!open) {
    // the dark plate stays in front of its own pool's left half
    c.save();
    c.globalAlpha = a;
    c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.18);
    c.fillRect(p.x - W / 2, p.y - H / 2, W, H);
    c.restore();
  }
}

/** a small red-edged paper stop tag hung on a frame's detent wheels, with the light halted against it */
function stopTag(c: C2, env: PaintEnv, cam: Camera3, d: { l: number; row: number; n: number }, u: number, tq: number) {
  const X = frameX(d.l) + frameW(d.l) / 2 + 9;
  const p = project({ x: X, y: rowAt(d.l, d.row), z: frameZ(d.l) }, cam);
  if (p.x < -60 || p.x > 1340) return;
  const s = p.s;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const r = 20 * s + 3;
  const g = c.createRadialGradient(p.x - 6 * s, p.y, 0, p.x - 6 * s, p.y, r);
  g.addColorStop(0, withAlpha(env.mood.core, 0.55 * u));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(p.x - 6 * s - r, p.y - r, 2 * r, 2 * r);
  c.restore();
  drawTag(c, env, p.x + 4 * s, p.y - 4 * s, s, (1 - u) * 0.6 + 0.04 * Math.sin(tq * 2.3 + d.l), clamp01(u * 2), 0);
}

function drawTag(c: C2, env: PaintEnv, x: number, y: number, s: number, rot: number, alpha: number, focus: number) {
  const tw = 24 * s, th = 32 * s;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.globalAlpha = alpha;
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.9);
  c.lineWidth = Math.max(0.6, 0.9 * s);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 9 * s);
  c.stroke();
  c.fillStyle = mixLab(mixLab('#cfb07a', env.mood.halo, 0.3), env.mood.core, 0.15);
  c.fillRect(-tw / 2, 9 * s, tw, th);
  c.strokeStyle = pencilRed(env, 0.95);
  c.lineWidth = Math.max(1.2, 2.8 * s);
  c.strokeRect(-tw / 2, 9 * s, tw, th);
  c.beginPath();
  c.moveTo(-tw * 0.3, 9 * s + th * 0.5);
  c.lineTo(tw * 0.3, 9 * s + th * 0.5);
  c.stroke();
  if (focus > 0.01) {
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.6 * focus);
    c.lineWidth = Math.max(0.8, 1.2 * s);
    c.strokeRect(-tw / 2 - 2 * s, 5 * s, tw + 4 * s, th + 4 * s);
  }
  c.restore();
}

/** frame 26's detent wheel, large (boolean rounding), its red-edged stop tag, and the light halted just short of it */
function bigWheel(c: C2, env: PaintEnv, cam: Camera3, halted: number, tq: number, focus: number) {
  const p = project(WHEEL, cam);
  if (p.x < -200 || p.x > 1480) return;
  const s = p.s;
  const R = WHEEL.r * s;
  // the light that came along the row from the right stops just short of the tag: a short bright run and a pool
  if (halted > 0) {
    const hot = mixLab('#fff1c8', env.mood.core, 0.2);
    const stopX = p.x + R + 58 * s;
    const q0 = project({ x: WHEEL.x + 420, y: WHEEL.y, z: WHEEL.z + 150 }, cam);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    for (const [lw, al] of [[10 * s, 0.2], [3 * s, 0.85]] as const) {
      c.strokeStyle = withAlpha(hot, al * halted);
      c.lineWidth = Math.max(1, lw);
      c.beginPath();
      c.moveTo(q0.x, q0.y);
      c.lineTo(stopX, p.y);
      c.stroke();
    }
    const r = 34 * s;
    const rg = c.createRadialGradient(stopX, p.y, 0, stopX, p.y, r * 1.6);
    rg.addColorStop(0, withAlpha('#fff6dc', 0.8 * halted * (0.94 + 0.06 * Math.sin(tq * 6))));
    rg.addColorStop(0.35, withAlpha(env.mood.core, 0.4 * halted));
    rg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = rg;
    c.fillRect(stopX - r * 1.6, p.y - r * 1.6, r * 3.2, r * 3.2);
    c.restore();
  }
  // the wheel: black card, toothed, a hub and spokes cut through (the backlight shows in the holes)
  c.save();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  const teeth = 14;
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? R : R * 0.86;
    const x = p.x + Math.cos(a) * rr, y = p.y + Math.sin(a) * rr;
    if (i) c.lineTo(x, y);
    else c.moveTo(x, y);
  }
  c.closePath();
  for (let k = 0; k < 5; k++) {
    const a0 = (k / 5) * Math.PI * 2 + 0.2, a1 = ((k + 1) / 5) * Math.PI * 2 - 0.2;
    c.moveTo(p.x + Math.cos(a0) * R * 0.28, p.y + Math.sin(a0) * R * 0.28);
    c.arc(p.x, p.y, R * 0.66, a0, a1);
    c.arc(p.x, p.y, R * 0.28, a1, a0, true);
    c.closePath();
  }
  c.fill('evenodd');
  // its pawl (the detent) at the top, and a rim on the window side
  c.beginPath();
  c.moveTo(p.x - R * 0.1, p.y - R * 1.25);
  c.lineTo(p.x + R * 0.12, p.y - R * 1.25);
  c.lineTo(p.x, p.y - R * 0.86);
  c.closePath();
  c.fill();
  c.fillRect(p.x - R * 0.5, p.y - R * 1.32, R * 0.9, Math.max(1.5, 4 * s));
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.75);
  c.lineWidth = Math.max(1, 1.8 * s);
  c.beginPath();
  c.arc(p.x, p.y, R, Math.PI * 1.1, Math.PI * 1.75);
  c.stroke();
  // the axle to the frame's stile
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(p.x - R - 80 * s, p.y - 2.5 * s, 80 * s, 5 * s);
  c.restore();
  // the stop tag on the wheel's right, large (it hangs where the light stopped)
  drawTag(c, env, p.x + R + 26 * s, p.y - 18 * s, s * 1.75, -0.06 + 0.03 * Math.sin(tq * 2.1), 1, focus);
}

/** the source table's pigeonholes (a 4 × 3 cubby across the end post): the light pools into the cells in turn */
function cubby(c: C2, env: PaintEnv, cam: Camera3, u: number, t: number) {
  const K = CUBBY;
  const p = project(K, cam);
  if (p.x < -200 || p.x > 1480) return;
  const s = p.s;
  const W = K.cols * K.cw * s, H = K.rows * K.ch * s;
  const x0 = p.x - W / 2, y0 = p.y - H / 2;
  const bw = Math.max(1.2, 3.2 * s);
  // the cells' backs: dark card (the light pools into them)
  c.fillStyle = withAlpha(mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.3), 0.85);
  c.fillRect(x0, y0, W, H);
  // the light in the cells (behind the dividers)
  if (u > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let r = 0; r < K.rows; r++) {
      for (let k = 0; k < K.cols; k++) {
        const i = r * K.cols + (K.cols - 1 - k); // from the right (where the light arrives), row by row
        const a = clamp01(u * 1.7 - (i / (K.cols * K.rows)) * 0.7);
        if (a <= 0) continue;
        const cx = x0 + (k + 0.5) * K.cw * s, cy = y0 + (r + 0.5) * K.ch * s;
        const g = c.createRadialGradient(cx, cy + 4 * s, 0, cx, cy, K.cw * s * 0.75);
        g.addColorStop(0, withAlpha('#fff3d2', 0.9 * a * (0.94 + 0.06 * Math.sin(t * 5 + i))));
        g.addColorStop(1, withAlpha(env.mood.core, 0.12 * a));
        c.fillStyle = g;
        c.fillRect(cx - (K.cw * s) / 2, cy - (K.ch * s) / 2, K.cw * s, K.ch * s);
      }
    }
    // a soft spill round the cubby
    const sg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, W);
    sg.addColorStop(0, withAlpha(env.mood.core, 0.25 * u));
    sg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = sg;
    c.fillRect(p.x - W, p.y - W, 2 * W, 2 * W);
    c.restore();
  }
  // the cubby's black card frame and dividers
  c.save();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.rect(x0 - bw, y0 - bw, W + 2 * bw, bw);
  c.rect(x0 - bw, y0 + H, W + 2 * bw, bw);
  for (let k = 0; k <= K.cols; k++) c.rect(x0 + k * K.cw * s - bw / 2, y0, bw, H);
  for (let r = 1; r < K.rows; r++) c.rect(x0, y0 + r * K.ch * s - bw / 2, W, bw);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.7);
  c.lineWidth = Math.max(0.8, 1.4 * s);
  c.beginPath();
  c.moveTo(x0 - bw, y0 - bw);
  c.lineTo(x0 + W + bw, y0 - bw);
  c.stroke();
  c.restore();
}

/** the three rules on a typed slip, top right (screen-locked; the paper never shows without its first line) */
function rulesSlip(c: C2, mood: PaintEnv['mood'], t: number, b: Beats) {
  const lines: { text: string; at: number }[] = [
    { text: 'sums: slope × weight', at: b.reverse + 0.1 },
    { text: 'valves: only while open', at: b.gates + 0.05 },
    { text: 'rounding: no rule unless asked', at: b.rounding - 0.1 },
  ];
  const a0 = win(t, lines[0].at - 0.15, lines[0].at + 0.15);
  if (a0 <= 0.003) return;
  c.save();
  const size = legibleSize(c, `500 21px ${FONT.mono}`, 21);
  c.font = `500 ${size}px ${FONT.mono}`;
  const tw = Math.max(...lines.map((l) => c.measureText(l.text).width));
  const w = tw + 40, lh = size * 1.45, h = lh * 3 + 26;
  const x = 1220 - w, y = 34;
  c.globalAlpha = a0;
  c.fillStyle = withAlpha('#1a120a', 0.3);
  c.fillRect(x + 4, y + 6, w, h);
  c.fillStyle = mixLab('#f4ead2', mood.core, 0.18);
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha('#2a1d14', 0.35);
  c.lineWidth = 1;
  c.strokeRect(x, y, w, h);
  c.globalAlpha = 1;
  textRole(c, 'subject', () => {
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    lines.forEach((l, i) => {
      const a = win(t, l.at - 0.15, l.at + 0.15) * a0;
      if (a <= 0.003) return;
      const [head, rest] = l.text.split(': ');
      c.fillStyle = withAlpha('#7a3a1c', a);
      c.fillText(`${head}:`, x + 20, y + 14 + lh * (i + 0.8));
      const hw = c.measureText(`${head}: `).width;
      c.fillStyle = withAlpha('#21170f', a);
      c.fillText(rest, x + 20 + hw, y + 14 + lh * (i + 0.8));
      textProbe(c, `${ID}-rule${i}`, x + 20, y + 14 + lh * i, tw, lh, a);
    });
  });
  cardProbe(c, `${ID}-slip`, x, y, w, h, a0, a0);
  c.restore();
}
