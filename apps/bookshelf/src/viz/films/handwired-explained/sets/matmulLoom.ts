/**
 * handwired-explained — THE MATMUL LOOM, drawn from the REAL compiled HandwiredOS circuit (sets/circuit.ts, the
 * export of chenglou/handwired@257856e). ch01-s04, ch05-s01..s07, ch06-s02, ch06-s12, ch07-s04, ch12-s02..s04.
 *
 * 130 thin upright frames, one per layer, each as tall as its layer's operation count (log-scaled so the
 * 401-operation first layer and the one-operation tail both read); between frames run fine threads, ONE PER STORED
 * WEIGHT (9,909), from the value a weight reads to the operation that reads it, copper for adding weights and indigo
 * for subtracting (the wallpaper's two colours, OS14); a small ReLU ramp glyph per ReGLU gate (2,776) and a toothed
 * detent wheel per boolean row (59) sit on the frames; the real 71-gate chain can be lit as one path.
 *
 *   import { matmulLoom, loomGeom } from '../sets/matmulLoom';
 *   f.layer('L4', (c, env) => matmulLoom(f, c, env, { x: 90, y: 160, w: 1100, h: 420, wave: u, key: 'ch05-s01' }));
 *   loomGeom(o).frameX(l), .valueY(v), .valuePt(v)   // place tags / glows / cameras on real frames and values
 *
 * Options: wave 0..1 (a forward wave of light across the frames, left to right), back 0..1 (a backward wave, right
 * to left: ch07-s04), chain 0..1 (the 71-gate chain lit progressively), frames 0..1 (how many frames are standing,
 * for a build), threads 0..1 (thread alpha), gates (show the gate fixtures), sparse (a single layer's lattice drawn
 * large: pass {layer, rect} to rack focus through one frame, ch05-s01 'empty'). Threads are baked with f.cached.
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { CIRCUIT, GATE_CHAIN, LAYER_START, OS_COLORS, TOTALS, layerOf } from './circuit';

export interface LoomOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0..1 forward wave position (frames light as it passes); undefined = no wave */
  wave?: number;
  /** 0..1 backward wave (right to left) */
  back?: number;
  /** 0..1 the real 71-gate chain lit along its path */
  chain?: number;
  /** 0..1 frames standing (a build left to right); default 1 */
  frames?: number;
  /** 0..1 thread visibility; default 1 */
  threads?: number;
  /** draw the ReLU ramps and detent wheels; default true */
  gates?: boolean;
  key?: string;
}

const NL = CIRCUIT.layers.length;
const MAXOPS = Math.max(...CIRCUIT.layers.map((l) => l.operations));
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function loomGeom(o: Pick<LoomOpts, 'x' | 'y' | 'w' | 'h'>) {
  const cy = o.y + o.h / 2;
  // column 0 is the source table (234 cells); columns 1..130 the layers
  const frameX = (l: number) => o.x + ((l + 1 + 0.5) / (NL + 1)) * o.w;
  const frameH = (l: number) => {
    const n = l < 0 ? TOTALS.sourceCells : CIRCUIT.layers[l].operations;
    return o.h * (0.14 + 0.86 * (Math.log(1 + n) / Math.log(1 + Math.max(MAXOPS, TOTALS.sourceCells))));
  };
  const valueY = (v: number) => {
    const l = layerOf(v);
    const n = l < 0 ? TOTALS.sourceCells : CIRCUIT.layers[l].operations;
    const r = l < 0 ? v : v - LAYER_START[l];
    const fh = frameH(l);
    return cy - fh / 2 + (fh * (r + 0.5)) / n;
  };
  return { cy, frameX, frameH, valueY, valuePt: (v: number) => ({ x: frameX(layerOf(v)), y: valueY(v) }) };
}

/** the threads (one per stored weight), baked */
function bakeThreads(c: CanvasRenderingContext2D, env: PaintEnv, o: LoomOpts, g: ReturnType<typeof loomGeom>) {
  const adds = mixLab(OS_COLORS.copper, env.mood.core, 0.35);
  const subs = mixLab(OS_COLORS.indigo, env.mood.rim, 0.35);
  c.lineWidth = Math.max(0.45, o.w / 2200);
  // threads of light: additive inside the bake, so many threads between the same frames build into a band
  c.globalCompositeOperation = 'lighter';
  for (const sign of [-1, 1]) {
    c.strokeStyle = withAlpha(sign > 0 ? adds : subs, 0.2);
    for (let i = 0; i < CIRCUIT.arcs.length; i++) {
      const a = CIRCUIT.arcs[i];
      if (a[2] !== sign) continue;
      const p0 = g.valuePt(a[0]);
      const p1 = g.valuePt(a[1]);
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      // a slight droop so long threads read as thread, not ruled line
      const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 + Math.min(18, Math.abs(p1.x - p0.x) * 0.04);
      c.quadraticCurveTo(mx, my, p1.x, p1.y);
      c.stroke();
    }
  }
}

/** paint the loom (call inside a layer, normally L4; or L3 for the loom behind the line) */
export function matmulLoom(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, o: LoomOpts) {
  const g = loomGeom(o);
  const key = `hw-loom/${o.key ?? ''}/${env.mood.id}/${env.layer.id}/${o.x},${o.y},${o.w},${o.h}`;
  const pad = 40;
  const th = clamp01(o.threads ?? 1);
  if (th > 0) {
    c.save();
    c.globalAlpha = th;
    f.cached(`${key}/threads`, o.w + 2 * pad, o.h + 2 * pad, (cc) => {
      cc.translate(-o.x + pad, -o.y + pad);
      bakeThreads(cc, env, o, g);
    })(c, o.x - pad, o.y - pad);
    c.restore();
  }
  const up = Math.round(clamp01(o.frames ?? 1) * NL);
  // frames bake in 13 chunks of 10 so a build only re-bakes nothing (each chunk is static)
  for (let ch = 0; ch * 10 < up; ch++) {
    const l0 = ch * 10 - (ch === 0 ? 1 : 0), l1 = Math.min(up, ch * 10 + 10);
    if (l1 - (ch * 10) < 10 && l1 !== NL) {
      // partial chunk: draw live
      bakeFramesRange(c, env, o, g, Math.max(-1, l0), l1);
      continue;
    }
    f.cached(`${key}/frames${ch}`, o.w + 2 * pad, o.h + 2 * pad + 420, (cc) => {
      cc.translate(-o.x + pad, -o.y + pad);
      bakeFramesRange(cc, env, o, g, Math.max(-1, l0), l1);
    })(c, o.x - pad, o.y - pad);
  }
  // the light waves: frames near the wave front glow (additive)
  const glowAt = (u: number, dir: 1 | -1) => {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const wx = o.x + (dir > 0 ? u : 1 - u) * o.w;
    const gr = c.createLinearGradient(wx - o.w * 0.06, 0, wx + o.w * 0.02, 0);
    gr.addColorStop(0, withAlpha(env.mood.halo, 0));
    gr.addColorStop(0.75, withAlpha(env.mood.core, 0.32));
    gr.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = gr;
    c.fillRect(wx - o.w * 0.06, o.y - 10, o.w * 0.08, o.h + 20);
    // the frames the wave has passed keep a faint glow on their edges
    const fw = Math.max(1.4, (o.w / (NL + 1)) * 0.22);
    for (let l = -1; l < up; l++) {
      const x = g.frameX(l);
      const passed = dir > 0 ? x <= wx : x >= wx;
      if (!passed) continue;
      const d = Math.abs(x - wx) / o.w;
      const a = 0.12 + 0.5 * Math.max(0, 1 - d * 12);
      const h = g.frameH(l);
      c.fillStyle = withAlpha(env.mood.core, a * 0.6);
      c.fillRect(x - fw * 1.4, g.cy - h / 2 - 6, fw * 2.8, h + 12);
    }
    c.restore();
  };
  if (o.wave !== undefined) glowAt(clamp01(o.wave), 1);
  if (o.back !== undefined) glowAt(clamp01(o.back), -1);
  // the real 71-gate chain, lit along its path
  const chU = clamp01(o.chain ?? 0);
  if (chU > 0) {
    const pv = GATE_CHAIN.packedValues;
    const n = Math.max(1, Math.floor(chU * (pv.length - 1)));
    c.save();
    c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.25), 0.9);
    c.lineWidth = Math.max(1.4, o.w / 700);
    c.shadowColor = withAlpha(env.mood.core, 0.8);
    c.shadowBlur = 8;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = g.valuePt(pv[i]);
      if (i === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    }
    c.stroke();
    c.restore();
  }
}

function bakeFramesRange(c: CanvasRenderingContext2D, env: PaintEnv, o: LoomOpts, g: ReturnType<typeof loomGeom>, l0: number, l1: number) {
  // reuse bakeFrames' drawing for a range of layers
  const ink = env.fill('ink');
  const fw = Math.max(1.4, (o.w / (NL + 1)) * 0.22);
  for (let l = l0; l < l1; l++) {
    const x = g.frameX(l), h = g.frameH(l);
    // a thin upright LOOM FRAME: two stiles, a head rail and a foot rail, a few cross-heddles; open in between
    // so the backlight and the threads show through (a backlit paper lattice)
    const half = fw * 1.4;
    const top = g.cy - h / 2 - 6, bot = g.cy + h / 2 + 6;
    c.fillStyle = ink;
    c.fillRect(x - half, top, fw * 0.55, bot - top);
    c.fillRect(x + half - fw * 0.55, top, fw * 0.55, bot - top);
    c.fillRect(x - half - fw * 0.4, top - 2, half * 2 + fw * 0.8, 2.6);
    c.fillRect(x - half - fw * 0.4, bot - 0.6, half * 2 + fw * 0.8, 2.6);
    const heddles = Math.max(2, Math.round(h / 60));
    for (let k = 1; k < heddles; k++) c.fillRect(x - half, top + ((bot - top) * k) / heddles, half * 2, 0.8);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x - half - fw * 0.4, top - 2);
    c.lineTo(x + half + fw * 0.4, top - 2);
    c.stroke();
    if (o.gates !== false && l >= 0) {
      const L = CIRCUIT.layers[l];
      c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.set, 0.3), 0.45);
      c.lineWidth = 0.6;
      c.beginPath();
      for (let k = 0; k < L.reglu; k++) {
        const yy = g.cy - h / 2 + (h * (k + 0.5)) / Math.max(1, L.reglu);
        c.moveTo(x + fw, yy + 1.2);
        c.lineTo(x + fw + 1.4, yy + 1.2);
        c.lineTo(x + fw + 3, yy - 1.2);
      }
      c.stroke();
      for (let k = 0; k < L.boolean; k++) {
        const yy = g.cy + h / 2 + 10 + k * 7;
        c.fillStyle = ink;
        c.beginPath();
        c.arc(x, yy, 2.6, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = withAlpha(env.mood.rim, 0.5);
        c.lineWidth = 0.6;
        c.beginPath();
        for (let t = 0; t < 8; t++) {
          const a = (t / 8) * Math.PI * 2;
          c.moveTo(x + Math.cos(a) * 2.6, yy + Math.sin(a) * 2.6);
          c.lineTo(x + Math.cos(a) * 3.6, yy + Math.sin(a) * 3.6);
        }
        c.stroke();
      }
    }
  }
}
