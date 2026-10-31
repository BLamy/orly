/**
 * ch07-s04 — THE LOOM RUN BACKWARDS (scene, dawnGold; crossfade in from the shut valve; 9.4 s). ch05's matmul loom, the
 * same 130 frames from the real compiled HandwiredOS circuit (sets/ch05-s01-loom3d, sets/circuit: the export of the
 * clone pinned at 257856e), in the same dark workshop (sets/ch05-s01-room), now at dawn.
 *   L0709 "Almost every operation runs backwards by a rule like that: on the real arithmetic, not the rounding."
 *
 * TEACHES, word by word:
 *   0–2        the loom at rest, seen from its output end; the camera begins a slow track right to left
 *   'backwards' a band of lantern light enters at the far (output) end and runs back frame by frame toward the source
 *              post; behind it every frame it has passed stays lit (each frame's threads warm, copper and indigo in
 *              their own hues); a paper slip sets the rules: sums: slope × weight
 *   'rule'     valves: only while open (the gate fixtures on the passing frames catch the light or stay dark)
 *              at each of the real frames that hold boolean rows (26, 62, 63, 66, 68, 80, 81, 115, 117: the 59 detent
 *              wheels) the light halts against a small red-edged stop tag hung on the wheels: no backward rule there
 *   'arithmetic' the band reaches the near end and pools in the source post's pigeonholes (the 234 cells)
 *   'rounding' the camera has settled beside frame 26's detent wheels and their stop tag; the slip's last line inks:
 *              rounding: no rule unless asked. Hold on the reversed loom, lit.
 * Note: the real backward pass walks the program's operations last to first; the frames stand in for that order.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { LAYERS, cam3Interp, cardProbe, defineShot, FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { LOOM, frameH, frameW, frameX, frameZ, kindOf, layerRows, loom3, project, rowAt, screenSpace } from '../sets/ch05-s01-loom3d';
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

/** frames that hold boolean rows (detent wheels), with the row of their first wheel: computed from the export */
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
/** frames that hold ReGLU gates (for the 'only while open' glint) */
const GATED: boolean[] = Array.from({ length: NL }, (_, l) => {
  for (let r = 0; r < layerRows(l); r++) if (kindOf(LAYER_START[l] + r) === 1) return true;
  return false;
});

interface Beats {
  D: number;
  reverse: number;
  gates: number;
  docs: number;
  rounding: number;
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, reverse: T.beat('reverse'), gates: T.beat('gates'), docs: T.beat('docs'), rounding: T.beat('rounding') };
    const sx = frameX(SETTLE.l), sz = frameZ(SETTLE.l);
    const keys: { t: number; cam: Camera3 }[] = [
      { t: 0, cam: C(1180, 330, 250) },
      { t: b.reverse - 0.2, cam: C(1070, 332, 240) },
      { t: b.docs + 0.2, cam: C(520, 338, 170) },
      { t: b.rounding + 0.2, cam: C(sx + 110, rowAt(SETTLE.l, SETTLE.row) - 30, sz - 1060) },
      { t: b.D + 0.3, cam: C(sx + 100, rowAt(SETTLE.l, SETTLE.row) - 30, sz - 1010) },
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

    // ---- the backward band: frame index of its front (129 → −1 between 'backwards' and 'arithmetic')
    const runU = (t - b.reverse + 0.05) / (b.docs - b.reverse + 0.05);
    const front = runU <= 0 ? NL + 4 : NL - 1 - (NL + 0.2) * (1 - Math.pow(1 - clamp01(runU), 1.6));
    const lit: Record<number, number> = {};
    if (runU > 0) {
      for (let l = 0; l < NL; l++) {
        if (l < front - 0.5) continue;
        const behind = l - front;
        lit[l] = 0.3 + 0.7 * Math.exp(-Math.max(0, behind) / 3.5);
      }
    }
    // the dolly toward frame 26 sinks the frames between it and the camera
    const dolly = win(t, b.docs + 0.2, b.rounding + 0.2);
    const pool = win(t, b.docs - 0.15, b.docs + 0.45);

    loomRoom(f, cam, { key: ID, cams: keys.map((k) => k.cam), sunX: 1000, tubes: 0.55 });

    loom3(
      f,
      {
        cam,
        tq,
        fam: { copper: 0.55 + 0.35 * clamp01(runU), indigo: 0.5 + 0.3 * clamp01(runU) },
        focusZ: frameZ(SETTLE.l) * dolly + 1300 * (1 - dolly),
        dof: 3.2,
        maxBlur: 5,
        lit,
        frameAlpha: (l) => (l < SETTLE.l ? 1 - 0.94 * dolly : 1),
        vignette: { frame: SETTLE.l, u: 0.7 * dolly },
        fogScale: 0.75,
        threads: 1,
      },
      {
        top: (c, env) => {
          // the lantern band at the front
          if (runU > 0 && runU < 1.02) band(c, env, cam, Math.max(-1, front), t);
          // the stop tags at the detent wheels, once the band has passed them
          for (const d of DETENTS) {
            if (front > d.l) continue;
            const u = clamp01((d.l - front) / 2.5);
            stopTag(c, env, cam, d, u, tq, d.l === SETTLE.l ? win(t, b.rounding - 0.3, b.rounding + 0.2) : 0);
          }
          // the gate fixtures on passing frames: a glint for the open ones (most), none for the shut
          if (runU > 0 && runU < 1) gateGlints(c, env, cam, front);
          if (pool > 0) postPool(c, env, cam, pool, t);
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

/** the lantern band: a soft vertical sheet of light across the frame at the front, and a hot lantern at its middle */
function band(c: C2, env: PaintEnv, cam: Camera3, front: number, t: number) {
  const l = front;
  const p = project({ x: frameX(l), y: LOOM.yc, z: frameZ(l) }, cam);
  const h = frameH(Math.max(-1, Math.round(l))) * p.s;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const w = 60 * p.s + 30;
  const g = c.createLinearGradient(p.x - w, 0, p.x + w, 0);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.5, withAlpha(env.mood.core, 0.32));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(p.x - w, p.y - h * 0.6, 2 * w, h * 1.2);
  const r = Math.max(14, 46 * p.s) * (1 + 0.05 * Math.sin(t * 13));
  const rg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.4);
  rg.addColorStop(0, withAlpha('#fff6d8', 0.9));
  rg.addColorStop(0.2, withAlpha(env.mood.core, 0.6));
  rg.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = rg;
  c.fillRect(p.x - r * 2.4, p.y - r * 2.4, r * 4.8, r * 4.8);
  c.restore();
}

/** a small red-edged paper stop tag hung on the frame's detent wheels, with the light halted against it */
function stopTag(c: C2, env: PaintEnv, cam: Camera3, d: { l: number; row: number; n: number }, u: number, tq: number, focus: number) {
  const X = frameX(d.l) + frameW(d.l) / 2 + 9;
  const p = project({ x: X, y: rowAt(d.l, d.row), z: frameZ(d.l) }, cam);
  if (p.x < -60 || p.x > 1340) return;
  const s = p.s;
  // the halted light: a small glow pressed against the wheels (it goes no further on this path)
  c.save();
  c.globalCompositeOperation = 'lighter';
  const r = 20 * s + 3;
  const g = c.createRadialGradient(p.x - 6 * s, p.y, 0, p.x - 6 * s, p.y, r);
  g.addColorStop(0, withAlpha(env.mood.core, 0.55 * u));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(p.x - 6 * s - r, p.y - r, 2 * r, 2 * r);
  c.restore();
  // the tag swings in on its string (on twos)
  const sw = (1 - u) * 0.6 + 0.04 * Math.sin(tq * 2.3 + d.l);
  const tw = 24 * s, th = 32 * s;
  c.save();
  c.translate(p.x + 4 * s, p.y - 4 * s);
  c.rotate(sw);
  c.globalAlpha = clamp01(u * 2);
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.9);
  c.lineWidth = Math.max(0.6, 0.9 * s);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 9 * s);
  c.stroke();
  c.fillStyle = mixLab(mixLab('#cfb07a', env.mood.halo, 0.3), env.mood.core, 0.15);
  c.fillRect(-tw / 2, 9 * s, tw, th);
  c.strokeStyle = pencilRed(env, 0.95);
  c.lineWidth = Math.max(0.8, 1.8 * s);
  c.strokeRect(-tw / 2, 9 * s, tw, th);
  // a short red bar across it: stop
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

/** a glint on the gated frames the band is passing: the ramps of open valves let it through */
function gateGlints(c: C2, env: PaintEnv, cam: Camera3, front: number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let l = Math.max(0, Math.floor(front)); l < Math.min(NL, front + 6); l++) {
    if (!GATED[l]) continue;
    const k = Math.exp(-(l - front) / 2);
    const X = frameX(l) + frameW(l) / 2 + 4;
    const n = layerRows(l);
    for (let r = 0; r < n; r += Math.max(1, Math.floor(n / 14))) {
      if (kindOf(LAYER_START[l] + r) !== 1) continue;
      // a deterministic few stay shut (dark): the light stops there
      if (((LAYER_START[l] + r) * 2654435761) % 7 === 0) continue;
      const p = project({ x: X, y: rowAt(l, r), z: frameZ(l) }, cam);
      const rr = Math.max(1.5, 4 * p.s);
      c.fillStyle = withAlpha(env.mood.core, 0.6 * k);
      c.fillRect(p.x - rr, p.y - rr * 0.5, rr * 2, rr);
    }
  }
  c.restore();
}

/** the light pooling in the source post's pigeonholes */
function postPool(c: C2, env: PaintEnv, cam: Camera3, u: number, t: number) {
  const p = project({ x: frameX(-1), y: LOOM.yc, z: frameZ(-1) }, cam);
  if (p.x < -200 || p.x > 1480) return;
  const h = frameH(-1) * p.s;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const w = 26 * p.s + 10;
  const g = c.createLinearGradient(p.x - w, 0, p.x + w, 0);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.5, withAlpha(env.mood.core, 0.45 * u * (0.92 + 0.08 * Math.sin(t * 5))));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(p.x - w, p.y - h * 0.5, 2 * w, h);
  // the cells catch it, one by one down the column
  const n = 39;
  for (let i = 0; i < n; i++) {
    const a = clamp01(u * 1.6 - (i / n) * 0.6);
    if (a <= 0) continue;
    const yy = p.y - h * 0.45 + (h * 0.9 * (i + 0.5)) / n;
    c.fillStyle = withAlpha('#fff3cf', 0.7 * a);
    c.fillRect(p.x + 4 * p.s, yy, Math.max(0.8, 3 * p.s), Math.max(0.8, 2.2 * p.s));
  }
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
