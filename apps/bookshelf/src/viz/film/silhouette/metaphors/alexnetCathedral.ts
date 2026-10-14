/**
 * alexnetCathedral — AlexNet (Krizhevsky, Sutskever & Hinton, 2012) as a two-tower
 * cathedral façade: one tower per GPU, built from stacked volumes with the true layer
 * shapes, joined by bridges ONLY where the paper's layers talk across GPUs
 * (conv2 -> conv3, conv5 -> fc6, fc6 -> fc7, fc7 -> fc8). The input image is the rose
 * window at the base; fc8's 1000 classes are the crown that joins both towers.
 *   block face width  <- spatial size (55, 27, 13, 13, 13) ; block depth <- channels per GPU
 *   lit windows       <- the activation flow reaching that layer
 *   bridges           <- cross-GPU connections (light crosses only there)
 *
 *   alexnetCathedral(c, {
 *     x?, y?, w?, h?     box (default full stage); the ground line is the box bottom
 *     reveal?: number    0..1 the towers rise block by block, then bridges, then crown
 *     flow?: number      0..1 light rising from the rose window to the crown
 *     labels?: boolean   layer shapes set beside each tower
 *   }, env)
 *   alexnetResultPlate(c, {x, y, w, h, reveal}, env)  ILSVRC-2012 top-5 error bars
 *   ALEXNET, ALEXNET_TOP5 — the numbers (verify against the film's research bible)
 */
import type { PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { MFONT, PARCH, glow, label, parchmentPlate, ramp, smooth } from './kit';

// ---------------------------------------------------------------------------
// The numbers. VERIFY against films/<slug>/research (bible.md / claims.json) before
// using on screen. Shapes per Krizhevsky et al. 2012, Fig. 2 (the paper says 224x224
// input; 227x227 is the size that makes conv1's 11x11/stride-4 output exactly 55x55).
// ---------------------------------------------------------------------------
export interface AlexLayer {
  id: string;
  name: string;
  /** spatial side (conv) or 0 for fully connected */
  hw: number;
  /** total channels / units */
  c: number;
  /** per-GPU split (fc8 is shared: one entry) */
  split: number[];
  /** takes input from BOTH GPUs' previous layer (a bridge) */
  cross: boolean;
  note?: string;
}
export const ALEXNET = {
  input: { hw: 227, c: 3, note: '227 × 227 × 3 (paper text: 224)' },
  layers: [
    { id: 'conv1', name: 'conv1', hw: 55, c: 96, split: [48, 48], cross: false, note: '11×11, stride 4' },
    { id: 'conv2', name: 'conv2', hw: 27, c: 256, split: [128, 128], cross: false, note: '5×5' },
    { id: 'conv3', name: 'conv3', hw: 13, c: 384, split: [192, 192], cross: true, note: '3×3, from both GPUs' },
    { id: 'conv4', name: 'conv4', hw: 13, c: 384, split: [192, 192], cross: false, note: '3×3' },
    { id: 'conv5', name: 'conv5', hw: 13, c: 256, split: [128, 128], cross: false, note: '3×3' },
    { id: 'fc6', name: 'fc6', hw: 0, c: 4096, split: [2048, 2048], cross: true },
    { id: 'fc7', name: 'fc7', hw: 0, c: 4096, split: [2048, 2048], cross: true },
    { id: 'fc8', name: 'fc8', hw: 0, c: 1000, split: [1000], cross: true, note: '1000 classes' },
  ] as AlexLayer[],
} as const;
/** ILSVRC-2012 classification, top-5 test error (%). VERIFY against the research bible. */
export const ALEXNET_TOP5 = { alexnet: 15.3, runnerUp: 26.2, runnerUpName: 'runner-up (ISI)' } as const;

export interface AlexnetCathedralOpts {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  reveal?: number;
  flow?: number;
  labels?: boolean;
}

interface Block {
  li: number;
  gpu: number;
  x: number; // front-face left
  y: number; // front-face top
  fw: number; // face width
  fh: number; // face height
  d: number; // oblique depth
}

function layout(o: AlexnetCathedralOpts) {
  const X = o.x ?? 0;
  const Y = o.y ?? 0;
  const W = o.w ?? 1280;
  const H = o.h ?? 720;
  const s = H / 720;
  const ground = Y + H - 24 * s;
  const cx = X + W / 2;
  const gap = 205 * s; // tower axis distance from the centre
  const blocks: Block[] = [];
  let yTop = ground - 104 * s; // the base plinth houses the rose window
  const towerX = [cx - gap, cx + gap];
  const bridgesY: { li: number; y: number; x0: number; x1: number }[] = [];
  ALEXNET.layers.forEach((L, li) => {
    if (L.id === 'fc8') return;
    const fw = L.hw ? (30 + L.hw * 2.4) * s : 34 * s;
    const fh = L.hw ? (18 + L.hw * 1.05) * s : (L.c / 2048) * 42 * s;
    const d = L.hw ? (8 + L.split[0] * 0.1) * s : 10 * s;
    const bottom = yTop;
    yTop -= fh + 6 * s;
    const pair: Block[] = [];
    for (let gpu = 0; gpu < 2; gpu++) {
      const ax = towerX[gpu];
      const b = { li, gpu, x: ax - fw / 2, y: yTop, fw, fh, d };
      blocks.push(b);
      pair.push(b);
    }
    if (L.cross) bridgesY.push({ li, y: bottom - 2 * s, x0: pair[0].x + pair[0].fw + d * 0.8, x1: pair[1].x - d * 0.8 });
  });
  const crownY = yTop - 70 * s;
  {
    const top = blocks[blocks.length - 1];
    bridgesY.push({ li: 7, y: yTop - 4 * s, x0: blocks[blocks.length - 2].x + top.fw + top.d * 0.8, x1: top.x - top.d * 0.8 });
  }
  return { X, Y, W, H, s, ground, cx, towerX, blocks, bridgesY, crownY, topY: yTop };
}

export function alexnetCathedral(c: CanvasRenderingContext2D, o: AlexnetCathedralOpts, env: PaintEnv): void {
  const G = layout(o);
  const m = env.mood;
  const ink = env.fill('ink');
  const reveal = o.reveal ?? 1;
  const flow = o.flow ?? 0;
  const nL = ALEXNET.layers.length; // 8
  // flow position: 0 = rose window, layer li lit when flow >= (li + 1) / (nL + 1)
  const litOf = (li: number) => smooth(ramp(flow, (li + 0.6) / (nL + 1), (li + 1.2) / (nL + 1)));
  const builtOf = (li: number) => smooth(ramp(reveal, 0.08 + li * 0.075, 0.16 + li * 0.075));
  const s = G.s;

  // ---------------------------------------------------------------- plinth + rose window (input)
  const baseA = smooth(ramp(reveal, 0, 0.1));
  if (baseA > 0) {
    c.save();
    c.globalAlpha *= baseA;
    const bw = (G.towerX[1] - G.towerX[0]) + 240 * s;
    const bx = G.cx - bw / 2;
    const by = G.ground - 104 * s;
    // façade wall with a pointed portal
    const wall = new Path2D();
    wall.rect(bx, by, bw, 104 * s);
    // rose window hole
    const rr = 40 * s;
    const rx = G.cx;
    const ry = by + 50 * s;
    wall.moveTo(rx + rr, ry);
    wall.arc(rx, ry, rr, 0, Math.PI * 2);
    c.fillStyle = ink;
    c.fill(wall, 'evenodd');
    // tracery: 3 concentric rings (the 3 colour channels) + 12 spokes
    const inA = smooth(ramp(flow, 0, 0.08));
    glow(c, rx, ry, rr * 3.2, m.halo, 0.12 + 0.4 * inA);
    c.fillStyle = mixLab(m.halo, m.core, 0.3 + 0.7 * inA);
    c.globalAlpha *= 0.55 + 0.45 * inA;
    c.beginPath();
    c.arc(rx, ry, rr, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = baseA;
    c.strokeStyle = ink;
    c.lineWidth = 2.4 * s;
    for (const f of [0.33, 0.66]) {
      c.beginPath();
      c.arc(rx, ry, rr * f, 0, Math.PI * 2);
      c.stroke();
    }
    c.beginPath();
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      c.moveTo(rx + Math.cos(a) * rr * 0.33, ry + Math.sin(a) * rr * 0.33);
      c.lineTo(rx + Math.cos(a) * rr, ry + Math.sin(a) * rr);
    }
    c.stroke();
    c.lineWidth = 4 * s;
    c.beginPath();
    c.arc(rx, ry, rr, 0, Math.PI * 2);
    c.stroke();
    // blind arcade cut into the façade, and a lit portal under each tower (the two GPUs' doors)
    c.strokeStyle = withAlpha(m.rim, 0.14);
    c.lineWidth = 1;
    c.beginPath();
    const nA = 14;
    for (let k = 0; k < nA; k++) {
      const ax = bx + 14 * s + (k / nA) * (bw - 28 * s);
      const aw = (bw - 28 * s) / nA - 6 * s;
      if (Math.abs(ax + aw / 2 - rx) < rr * 1.5) continue;
      c.moveTo(ax, by + 92 * s);
      c.lineTo(ax, by + 40 * s);
      c.quadraticCurveTo(ax, by + 26 * s, ax + aw / 2, by + 20 * s);
      c.quadraticCurveTo(ax + aw, by + 26 * s, ax + aw, by + 40 * s);
      c.lineTo(ax + aw, by + 92 * s);
    }
    c.stroke();
    for (const tx of G.towerX) {
      const dw = 22 * s;
      const doorA = 0.25 + 0.75 * inA;
      const door = new Path2D();
      door.moveTo(tx - dw / 2, G.ground - 10 * s);
      door.lineTo(tx - dw / 2, by + 52 * s);
      door.quadraticCurveTo(tx - dw / 2, by + 36 * s, tx, by + 30 * s);
      door.quadraticCurveTo(tx + dw / 2, by + 36 * s, tx + dw / 2, by + 52 * s);
      door.lineTo(tx + dw / 2, G.ground - 10 * s);
      door.closePath();
      c.fillStyle = mixLab(m.halo, m.core, 0.4 * inA);
      c.globalAlpha = baseA * (0.35 + 0.5 * doorA);
      c.fill(door);
      c.globalAlpha = baseA;
      glow(c, tx, G.ground - 34 * s, 50 * s, m.halo, 0.18 * doorA);
    }
    // cornice and steps
    c.fillStyle = ink;
    c.fillRect(bx - 10 * s, by - 8 * s, bw + 20 * s, 9 * s);
    c.fillRect(bx - 20 * s, G.ground - 10 * s, bw + 40 * s, 10 * s);
    c.restore();
    if (o.labels)
      label(c, `input ${ALEXNET.input.hw} × ${ALEXNET.input.hw} × ${ALEXNET.input.c}`, G.cx, G.ground + 22 * s, {
        size: 18,
        italic: true,
        color: m.rim,
        align: 'center',
        alpha: baseA,
      });
  }

  // ---------------------------------------------------------------- bridges (cross-GPU)
  for (const b of G.bridgesY) {
    const bA = builtOf(b.li);
    if (bA <= 0) continue;
    const lit = litOf(b.li);
    const x0 = b.x0;
    const x1 = b.x1;
    const y = b.y;
    c.save();
    c.globalAlpha *= bA;
    // a flying bridge: deck, arch beneath, balustrade
    const p = new Path2D();
    p.moveTo(x0, y - 10 * s);
    p.lineTo(x1, y - 10 * s);
    p.lineTo(x1, y + 16 * s);
    p.quadraticCurveTo((x0 + x1) / 2, y - 6 * s, x0, y + 16 * s);
    p.closePath();
    // pierced spandrels: a roundel near each abutment
    for (const f of [0.07, 0.93]) {
      const hx = x0 + (x1 - x0) * f;
      const hr = 4.5 * s;
      p.moveTo(hx + hr, y + 4 * s);
      p.arc(hx, y + 4 * s, hr, 0, Math.PI * 2);
    }
    c.fillStyle = ink;
    c.fill(p, 'evenodd');
    // cusped drip-tracery hanging under the arch
    c.beginPath();
    const nC = Math.max(6, Math.round((x1 - x0) / (22 * s)));
    for (let k = 1; k < nC; k++) {
      const u = k / nC;
      const ax = x0 + (x1 - x0) * u;
      const ay = (1 - u) * (1 - u) * (y + 16 * s) + 2 * u * (1 - u) * (y - 6 * s) + u * u * (y + 16 * s);
      c.moveTo(ax - 4 * s, ay - 1);
      c.quadraticCurveTo(ax, ay + 9 * s, ax + 4 * s, ay - 1);
    }
    c.fill();
    // balusters
    c.fillRect(x0, y - 22 * s, x1 - x0, 3 * s);
    for (let x = x0 + 8 * s; x < x1 - 4 * s; x += 9 * s) c.fillRect(x, y - 20 * s, 3 * s, 10 * s);
    c.restore();
    // light crossing: an X of threads over the deck, only where the paper crosses GPUs
    if (lit > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(m.core, 0.55 * lit);
      c.lineWidth = 1.6 * s;
      c.beginPath();
      c.moveTo(x0 - 20 * s, y + 18 * s);
      c.quadraticCurveTo((x0 + x1) / 2, y - 40 * s, x1 + 20 * s, y - 26 * s);
      c.moveTo(x1 + 20 * s, y + 18 * s);
      c.quadraticCurveTo((x0 + x1) / 2, y - 40 * s, x0 - 20 * s, y - 26 * s);
      c.stroke();
      c.restore();
      glow(c, (x0 + x1) / 2, y - 14 * s, 60 * s, m.halo, 0.3 * lit);
    }
  }

  // ---------------------------------------------------------------- tower blocks
  for (const b of G.blocks) {
    const bA = builtOf(b.li);
    if (bA <= 0) continue;
    const L = ALEXNET.layers[b.li];
    const lit = litOf(b.li);
    const lift = (1 - bA) * 30 * s;
    const y = b.y - lift;
    // oblique side faces toward the centre aisle
    const dir = b.gpu === 0 ? 1 : -1;
    const dx = b.d * 0.8 * dir;
    const dy = -b.d * 0.45;
    c.save();
    c.globalAlpha *= bA;
    const fx = b.x;
    // top + side (set colour, lighter so the volume reads against the ink face)
    c.fillStyle = mixLab(env.fill('set'), m.ink, 0.25);
    c.beginPath();
    c.moveTo(fx, y);
    c.lineTo(fx + dx, y + dy);
    c.lineTo(fx + b.fw + dx, y + dy);
    c.lineTo(fx + b.fw, y);
    c.closePath();
    c.fill();
    const sideX = dir > 0 ? fx + b.fw : fx;
    c.fillStyle = mixLab(env.fill('set'), m.ink, 0.45);
    c.beginPath();
    c.moveTo(sideX, y);
    c.lineTo(sideX + dx, y + dy);
    c.lineTo(sideX + dx, y + b.fh + dy);
    c.lineTo(sideX, y + b.fh);
    c.closePath();
    c.fill();
    // channel slices on the side face (one line per ~16 channels per GPU)
    const nSl = Math.max(2, Math.round(L.split[0] / 16));
    c.strokeStyle = withAlpha(lit > 0.1 ? m.core : m.rim, 0.12 + 0.35 * lit);
    c.lineWidth = 0.7;
    c.beginPath();
    for (let k = 1; k < nSl; k++) {
      const u = k / nSl;
      c.moveTo(sideX + dx * u, y + dy * u);
      c.lineTo(sideX + dx * u, y + b.fh + dy * u);
    }
    c.stroke();
    // front face: ink, with lancet windows lit by the flow
    c.fillStyle = ink;
    c.fillRect(fx, y, b.fw, b.fh);
    const cols = L.hw ? Math.max(2, Math.round(b.fw / (9 * s))) : 1;
    const rows = L.hw ? Math.max(1, Math.round(b.fh / (16 * s))) : Math.max(1, Math.round(b.fh / (14 * s)));
    const pw = (b.fw - 6 * s) / cols;
    const ph = (b.fh - 6 * s) / rows;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const wx = fx + 3 * s + i * pw + pw * 0.22;
        const wy = y + 3 * s + j * ph + ph * 0.15;
        const ww = pw * 0.56;
        const wh = ph * 0.7;
        // deterministic per-window activation variety
        const hsh = Math.sin((b.li * 97 + b.gpu * 31 + i * 13 + j * 7) * 12.9898) * 43758.5453;
        const act = 0.35 + 0.65 * (hsh - Math.floor(hsh));
        const v = lit * act;
        c.fillStyle = v > 0.02 ? mixLab(mixLab(m.set, m.ink, 0.2), m.core, v) : mixLab(m.set, m.ink, 0.15);
        c.beginPath();
        c.moveTo(wx, wy + wh);
        c.lineTo(wx, wy + ww * 0.5);
        c.quadraticCurveTo(wx + ww / 2, wy - ww * 0.35, wx + ww, wy + ww * 0.5);
        c.lineTo(wx + ww, wy + wh);
        c.closePath();
        c.fill();
      }
    // a string course under each block
    c.fillStyle = ink;
    c.fillRect(fx - 4 * s, y + b.fh, b.fw + 8 * s, 4 * s);
    c.restore();
    if (lit > 0) glow(c, fx + b.fw / 2, y + b.fh / 2, Math.max(b.fw, b.fh) * 1.1, m.halo, 0.14 * lit);
    if (o.labels) {
      const shape = L.hw ? `${L.hw}×${L.hw}×${L.split[b.gpu]}` : `${L.split[b.gpu]}`;
      const lx = b.gpu === 0 ? fx - 16 * s : fx + b.fw + 16 * s;
      label(c, `${L.name}  ${shape}`, lx, y + b.fh / 2 + 6 * s, {
        size: 18,
        italic: false,
        font: MFONT.serif,
        color: lit > 0.5 ? m.core : m.rim,
        align: b.gpu === 0 ? 'right' : 'left',
        alpha: bA * 0.9,
      });
    }
  }

  // ---------------------------------------------------------------- crown (fc8, 1000 classes)
  const crA = builtOf(7);
  if (crA > 0) {
    const lit = litOf(7);
    const cy = G.topY - 10 * s;
    c.save();
    c.globalAlpha *= crA;
    c.fillStyle = ink;
    // pointed spire between the towers with 1000 "pinnacles" suggested as a comb
    c.beginPath();
    c.moveTo(G.cx - 70 * s, cy);
    c.lineTo(G.cx, cy - 92 * s);
    c.lineTo(G.cx + 70 * s, cy);
    c.closePath();
    c.fill();
    // finials on the towers
    for (const tx of G.towerX) {
      c.beginPath();
      c.moveTo(tx - 14 * s, G.topY);
      c.lineTo(tx, G.topY - 60 * s);
      c.lineTo(tx + 14 * s, G.topY);
      c.closePath();
      c.fill();
    }
    // the output window: a lancet lit by the final answer
    const v = lit;
    c.fillStyle = v > 0.02 ? mixLab(m.halo, m.core, v) : mixLab(m.set, m.ink, 0.15);
    c.beginPath();
    c.moveTo(G.cx - 12 * s, cy - 8 * s);
    c.lineTo(G.cx - 12 * s, cy - 44 * s);
    c.quadraticCurveTo(G.cx, cy - 70 * s, G.cx + 12 * s, cy - 44 * s);
    c.lineTo(G.cx + 12 * s, cy - 8 * s);
    c.closePath();
    c.fill();
    c.restore();
    if (v > 0) glow(c, G.cx, cy - 36 * s, 140 * s, m.core, 0.35 * v);
    if (o.labels) label(c, 'fc8 · 1000 classes', G.cx, cy - 104 * s, { size: 18, italic: true, color: v > 0.5 ? m.core : m.rim, align: 'center', alpha: crA });
  }
  if (o.labels) {
    const la = smooth(ramp(reveal, 0.1, 0.3));
    label(c, 'GPU 1', G.towerX[0], G.ground + 22 * s, { size: 18, font: MFONT.sc, weight: 600, color: m.rim, align: 'center', alpha: la, tracking: 2 });
    label(c, 'GPU 2', G.towerX[1], G.ground + 22 * s, { size: 18, font: MFONT.sc, weight: 600, color: m.rim, align: 'center', alpha: la, tracking: 2 });
  }
}

/** ILSVRC-2012 result plate: two inked bars on parchment, the winning bar lit. */
export function alexnetResultPlate(c: CanvasRenderingContext2D, o: { x: number; y: number; w: number; h: number; reveal?: number }, env: PaintEnv): void {
  const r = o.reveal ?? 1;
  parchmentPlate(c, { x: o.x, y: o.y, w: o.w, h: o.h, seed: 2012, alpha: smooth(ramp(r, 0, 0.25)) }, env);
  const ink = PARCH.ink;
  const tA = smooth(ramp(r, 0.15, 0.4));
  label(c, 'ImageNet challenge, 2012', o.x + o.w / 2, o.y + 70, { size: 30, font: MFONT.display, weight: 600, color: ink, align: 'center', alpha: tA });
  label(c, 'top-5 error on the test set (lower is better)', o.x + o.w / 2, o.y + 100, { size: 19, italic: true, color: ink, align: 'center', alpha: tA * 0.8 });
  const bx = o.x + 70;
  const bw = o.w - 140;
  const scale = bw / 30; // 0..30 %
  const rows = [
    { name: 'AlexNet (SuperVision)', v: ALEXNET_TOP5.alexnet, win: true },
    { name: ALEXNET_TOP5.runnerUpName, v: ALEXNET_TOP5.runnerUp, win: false },
  ];
  rows.forEach((row, i) => {
    const y = o.y + 150 + i * 92;
    const u = smooth(ramp(r, 0.35 + i * 0.15, 0.7 + i * 0.15));
    label(c, row.name, bx, y, { size: 21, color: ink, alpha: tA });
    const len = row.v * scale * u;
    c.save();
    c.globalAlpha *= tA;
    if (row.win) {
      glow(c, bx + len / 2, y + 26, Math.max(40, len * 0.6), PARCH.halo, 0.35 * u);
      c.fillStyle = mixLab(PARCH.halo, PARCH.ink, 0.15);
    } else c.fillStyle = withAlpha(ink, 0.82);
    c.fillRect(bx, y + 12, len, 28);
    // hatching on the runner-up bar (engraving texture)
    if (!row.win) {
      c.strokeStyle = withAlpha(PARCH.haze, 0.35);
      c.lineWidth = 1;
      c.beginPath();
      for (let x = bx + 4; x < bx + len; x += 6) {
        c.moveTo(x, y + 40);
        c.lineTo(x + 8, y + 12);
      }
      c.stroke();
    }
    c.restore();
    label(c, `${row.v.toFixed(1)}%`, bx + len + 12, y + 34, { size: 24, weight: 500, color: ink, alpha: u });
  });
  // axis ticks
  c.save();
  c.globalAlpha *= tA * 0.6;
  c.strokeStyle = ink;
  c.lineWidth = 0.8;
  const ay = o.y + o.h - 70;
  c.beginPath();
  c.moveTo(bx, ay);
  c.lineTo(bx + bw, ay);
  for (let v = 0; v <= 30; v += 5) {
    c.moveTo(bx + v * scale, ay);
    c.lineTo(bx + v * scale, ay + 6);
  }
  c.stroke();
  c.restore();
  for (let v = 0; v <= 30; v += 10) label(c, `${v}%`, bx + v * scale, ay + 26, { size: 17, color: ink, align: 'center', alpha: tA * 0.7 });
}
