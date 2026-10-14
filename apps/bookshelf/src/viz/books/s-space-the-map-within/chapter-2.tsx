// Move the map, test the answer
//
// Sources (S-Space, arXiv 2610.13527; github.com/MirroS-Lab/S-Space @ fbb0940):
//   paper Appendix C.3 Eq. 11 — h' = h + V(VᵀV)⁻¹(c' − c); preserves the component
//     orthogonal to span(V); keeps unedited readout coordinates fixed
//   sspace/experiments/intervention/spatial_causality/spatial_jacobian/spatial_causality.py
//     coordinate_right_inverse (F = Vᵀ, B = Fᵀ(FFᵀ)⁻¹, rank-three check)
//     CoordinateEditHook._hook (relative_swap: target[0] += α(c₁ − c₀); common shift;
//       one post-block prefill intervention; projects again to verify the target; disarms)
//   paper Table 7 — Molmo2-ER, layer 17, 800 EmbSpatial examples: answer retention
//     (same answer as unedited; NOT accuracy) for swap vs matched random edits, α = 0..6
//
// Machine: the chapter-1 horizontal map (apple, cup, margin bracket) is coupled
// to one hidden ribbon and two outputs: the coordinate readout and the generated
// answer. A coordinate slider moves the apple; the right inverse turns that
// request into a hidden delta (with a visible second-cell correction); the edit
// is re-projected and checked; a common shift keeps the margin; a swap reverses
// it; then the toy map shrinks into a corner and the measured Table 7 curves
// take the stage. Toy numbers are the plan's illustrative four-cell example.
import type { ReactNode } from 'react';
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Brace, Vec } from '../../primitives';

// ---------------------------------------------------------------------------
// Tiny pure kit (local; no shared edits)
// ---------------------------------------------------------------------------
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const fmt = (v: number, d = 1): string => {
  const r = Number(v.toFixed(d));
  return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toFixed(d);
};
const fmtPlain = (v: number, d = 1): string => {
  const r = Number(v.toFixed(d));
  return (r < 0 ? '−' : '') + Math.abs(r).toFixed(d);
};

const INK = {
  apple: '#fb7185',
  cup: '#38bdf8',
  hx: colors.WARM,
  vy: colors.SECONDARY,
  dz: colors.POSITIVE,
  random: '#8da2be',
  text: colors.TEXT,
  muted: colors.MUTED,
  faint: colors.ink.faint,
  panel: colors.PANEL,
  bg: colors.BG,
} as const;

const BEAT_EVERY = 8;
const CAPTION_DUR = 8;
const CHAPTER_DUR = 74;
const beatAt = (i: number): number => 0.4 + BEAT_EVERY * i;

function narrate(tl: Timeline, lines: readonly string[]): ChannelRef<number> {
  const beat = tl.channel('beat', -1);
  lines.forEach((text, i) => {
    tl.caption({ at: beatAt(i), dur: CAPTION_DUR, text });
    tl.tween(beat, i, { at: beatAt(i), dur: 0.6, ease: ease.enter });
  });
  tl.hold(CHAPTER_DUR - 1, 1);
  return beat;
}
const on = (b: number, i: number): number => clamp01(b - (i - 1));
const win = (b: number, i: number, j: number): number => on(b, i) * (1 - clamp01(b - j));

function Txt({
  x, y, children, size = 13, fill = INK.text, opacity = 1, anchor = 'start', mono = false, weight = 400, spacing,
}: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string; opacity?: number;
  anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number; spacing?: number;
}) {
  if (opacity <= 0.003) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={fill} opacity={opacity} textAnchor={anchor} fontWeight={weight}
      letterSpacing={spacing} fontFamily={mono ? colors.font.mono : colors.font.ui}>
      {children}
    </text>
  );
}
const monoW = (text: string, size: number): number => text.length * size * 0.602;
function Chip({ x, y, text, color = INK.muted, opacity = 1, size = 11, anchor = 'middle' }: {
  x: number; y: number; text: string; color?: string; opacity?: number; size?: number; anchor?: 'start' | 'middle' | 'end';
}) {
  if (opacity <= 0.003) return null;
  const w = monoW(text, size) + 16;
  const h = size + 10;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - h / 2} width={w} height={h} rx={5} fill={INK.panel} fillOpacity={0.92} stroke={color} strokeWidth={1.1} />
      <text x={left + w / 2} y={y + size * 0.36} fontSize={size} textAnchor="middle" fill={color} fontFamily={colors.font.mono}>{text}</text>
    </g>
  );
}
function Field({ x, y, w, h, opacity, children }: { x: number; y: number; w: number; h: number; opacity: number; children?: ReactNode }) {
  if (opacity <= 0.003) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={INK.bg} />
      <rect x={x} y={y} width={w} height={h} rx={12} fill={INK.panel} stroke={colors.GRID} />
      {children}
    </g>
  );
}
function Apple({ x, y, r, opacity = 1 }: { x: number; y: number; r: number; opacity?: number }) {
  if (opacity <= 0.003) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={INK.apple} />
      <line x1={x} y1={y - r} x2={x} y2={y - r * 1.35} stroke="#6b4b2b" strokeWidth={r * 0.1} strokeLinecap="round" />
    </g>
  );
}
function Cup({ x, y, r, opacity = 1 }: { x: number; y: number; r: number; opacity?: number }) {
  if (opacity <= 0.003) return null;
  const w = r * 1.5;
  const h = r * 1.6;
  return (
    <g opacity={opacity}>
      <path d={`M${x - w / 2},${y - h / 2} h${w} v${h * 0.72} q0,${h * 0.28} ${-w * 0.35},${h * 0.28} h${-w * 0.3} q${-w * 0.35},0 ${-w * 0.35},${-h * 0.28} z`} fill={INK.cup} />
      <path d={`M${x + w / 2},${y - h * 0.25} q${r * 0.7},0 ${r * 0.7},${r * 0.45} q0,${r * 0.45} ${-r * 0.7},${r * 0.45}`} stroke={INK.cup} strokeWidth={r * 0.18} fill="none" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Data — illustrative four-cell example (plan); real right-inverse arithmetic
// ---------------------------------------------------------------------------
const H_APPLE = [1.5, -0.5, 0.8, 1.2] as const;
const VX = [1, 0, 0, 0] as const;
const VY = [0.6, 0.8, 0, 0] as const;
const VZ = [0, 0, 1, 0] as const;
const V = [VX, VY, VZ] as const; // columns of V (each a 4-vector)
const dot = (a: readonly number[], b: readonly number[]): number => a.reduce((s, ai, i) => s + ai * b[i], 0);
const project = (h: readonly number[]): number[] => V.map((v) => dot(v, h));
const C_APPLE = project(H_APPLE); // (1.5, 0.5, 0.8)
const C_CUP_X = -0.5; // cup horizontal coordinate (chapter 1)
const MARGIN = C_APPLE[0] - C_CUP_X; // +2.0

// Gram matrix VᵀV and its inverse (3×3, closed form)
const GRAM = V.map((a) => V.map((b) => dot(a, b)));
function inv3(m: number[][]): number[][] {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}
const GRAM_INV = inv3(GRAM);
const DELTA_C = [-2, 0, 0] as const; // requested coordinate change (x only)
const C_TARGET = C_APPLE.map((c, k) => c + DELTA_C[k]); // (−0.5, 0.5, 0.8)
const COEF = GRAM_INV.map((row) => dot(row, DELTA_C)); // (VᵀV)⁻¹Δc = (−3.125, 1.875, 0)
const DELTA_H = [0, 1, 2, 3].map((i) => V.reduce((s, v, k) => s + v[i] * COEF[k], 0)); // (−2, 1.5, 0, 0)
const H_EDIT = H_APPLE.map((h, i) => h + DELTA_H[i]); // (−0.5, 1.0, 0.8, 1.2)
const C_EDIT = project(H_EDIT); // (−0.5, 0.5, 0.8) — target reached
const TARGET_ERR = Math.max(...C_EDIT.map((c, k) => Math.abs(c - C_TARGET[k])));

// Table 7 (Molmo2-ER, layer 17, 800 EmbSpatial) — answer retention %, α = 0..6
const ALPHAS = [0, 1, 2, 3, 4, 5, 6] as const;
const SWAP = [100, 98.71, 85.66, 59.82, 51.16, 45.87, 43.93] as const;
const RANDOM = [100, 100, 99.91, 99.91, 99.87, 99.83, 99.83] as const;
const BETA = 1.0; // common shift

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const RUL = { x0: 200, x1: 900, y: 185, lo: -1, hi: 3 } as const;
const rx = (c: number): number => lerp(RUL.x0, RUL.x1, (c - RUL.lo) / (RUL.hi - RUL.lo));
const OUT = { x: 960, w: 270 } as const;

const RIB = { x0: 440, w: 62, gap: 6, h: 40 } as const;
const cellX = (i: number): number => RIB.x0 + i * (RIB.w + RIB.gap);
const ROW_H = 330;
const ROW_DH = 400;
const ROW_HE = 470;

const COORD = { x: 100, y: 322 } as const;
const BASIS = { ox: 240, oy: 560, scale: 72 } as const;

const PLOT = { x0: 470, x1: 1110, y0: 130, y1: 490 } as const;
const px = (a: number): number => lerp(PLOT.x0, PLOT.x1, a / 6);
const py = (pct: number): number => lerp(PLOT.y1, PLOT.y0, pct / 100);
const INSET = { s: 0.34, tx: 4, ty: 88 } as const; // the toy machine shrinks here

const CAPTIONS = [
  'Reading a map does not prove that the model uses it. A stronger test changes the map and checks the answer.',
  'Choose a new horizontal coordinate for the apple, while keeping its vertical and distance coordinates fixed.',
  'The readout directions need not be perpendicular. A right inverse turns the requested coordinate change into a precise hidden-state change.',
  'The edit preserves the hidden component outside the spatial subspace. The code projects again to check that the requested coordinates were reached.',
  'Move both objects by the same amount, and their relative margin stays the same. That gives the experiment a useful control.',
  "Exchange their horizontal coordinates, and the readout margin reverses. But the model's spoken answer need not flip at that first swap.",
  'The paper measures this difference by increasing the swap strength and counting answers that stay unchanged.',
  'At the strongest reported swap, about forty-four percent of answers remain unchanged. Equally sized random edits retain almost all of them.',
  'The contrast supports a causal role for these spatial directions. It does not make every edit reliable or leave every other answer untouched.',
] as const;

const NOTES = [
  'paper §3.2 · readout vs. generated answer',
  'spatial_causality.py · CoordinateEditHook target coordinates',
  'spatial_causality.py · coordinate_right_inverse · Eq. 11',
  'spatial_causality.py · _hook re-projects achieved coordinates',
  'CoordinateEditHook mode relative_common_shift',
  'CoordinateEditHook mode relative_swap',
  'paper Table 7 · Molmo2-ER L17 · 800 EmbSpatial',
  'paper Table 7 · retention ≠ accuracy',
  'paper §3.2, Appendix C.3',
] as const;

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = narrate(tl, CAPTIONS);
  const rulerU = tl.channel('rulerU', 0);
  const outU = tl.channel('outU', 0);
  const appleX = tl.channel('appleX', C_APPLE[0]); // apple's horizontal coordinate on the map
  const cupX = tl.channel('cupX', C_CUP_X);
  const coordU = tl.channel('coordU', 0); // coordinate column
  const lockU = tl.channel('lockU', 0);
  const targetU = tl.channel('targetU', 0);
  const ribU = tl.channel('ribU', 0);
  const basisU = tl.channel('basisU', 0);
  const formulaU = tl.channel('formulaU', 0);
  const deltaU = tl.channel('deltaU', 0); // Δh row fills (0..4)
  const editU = tl.channel('editU', 0); // h' row (0..4)
  const checkU = tl.channel('checkU', 0); // re-projection + check
  const editO = tl.channel('editO', 1); // the whole edit block
  const shiftB = tl.channel('shiftB', 0); // common shift β (0..1)
  const shiftU = tl.channel('shiftU', 0);
  const alpha = tl.channel('alpha', 0); // swap strength
  const swapU = tl.channel('swapU', 0);
  const insetU = tl.channel('insetU', 0); // toy machine → corner
  const plotU = tl.channel('plotU', 0);
  const traceU = tl.channel('traceU', 0); // 0..6 along α
  const pinU = tl.channel('pinU', 0);
  const noteU = tl.channel('noteU', 0); // α = 1 annotation
  const dimU = tl.channel('dimU', 0); // final dim
  const closeU = tl.channel('closeU', 0);

  // BEAT 0 — the familiar ruler; two separate outputs, answer unresolved
  tl.tween(rulerU, 1, { at: 0.5, dur: 1.2, ease: ease.draw });
  tl.tween(outU, 1, { at: 2.6, dur: 1.0, ease: ease.enter });

  // BEAT 1 — choose a new horizontal coordinate; y and z locked
  let t = beatAt(1);
  tl.tween(cam, { x: 660, y: 350, k: 1.02 }, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(coordU, 1, { at: t + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(lockU, 1, { at: t + 1.4, dur: 0.5, ease: ease.pop });
  tl.tween(appleX, C_TARGET[0], { at: t + 2.4, dur: 1.6, ease: ease.move });
  tl.tween(targetU, 1, { at: t + 4.2, dur: 0.6, ease: ease.enter });

  // BEAT 2 — right inverse: the hidden delta, with a visible y correction
  t = beatAt(2);
  tl.tween(cam, { x: 640, y: 350, k: 1.02 }, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(ribU, 1, { at: t + 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(basisU, 1, { at: t + 0.6, dur: 1.0, ease: ease.draw });
  tl.tween(formulaU, 1, { at: t + 2.0, dur: 0.8, ease: ease.enter });
  tl.tween(deltaU, 4, { at: t + 3.6, dur: 2.0, ease: ease.linear });

  // BEAT 3 — apply, re-project, check
  t = beatAt(3);
  tl.tween(editU, 4, { at: t + 0.4, dur: 1.8, ease: ease.linear });
  tl.tween(formulaU, 0, { at: t + 2.4, dur: 0.6, ease: ease.enter });
  tl.tween(checkU, 1, { at: t + 3.0, dur: 1.4, ease: ease.move });

  // BEAT 4 — reset; common shift keeps the margin
  t = beatAt(4);
  tl.tween(cam, { x: 660, y: 350, k: 1.02 }, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(editO, 0, { at: t - 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(coordU, 0, { at: t - 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(basisU, 0, { at: t - 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(appleX, C_APPLE[0], { at: t + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(shiftU, 1, { at: t + 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(shiftB, BETA, { at: t + 2.2, dur: 1.6, ease: ease.move });

  // BEAT 5 — reset; swap α 0 → 1 reverses the margin; answer badge stays open
  t = beatAt(5);
  tl.tween(shiftB, 0, { at: t - 0.2, dur: 0.8, ease: ease.move });
  tl.tween(shiftU, 0, { at: t - 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(swapU, 1, { at: t + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(alpha, 1, { at: t + 1.6, dur: 2.6, ease: ease.move });

  // BEAT 6 — the toy slides into a corner; Table 7 takes the stage
  t = beatAt(6);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(insetU, 1, { at: t + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(plotU, 1, { at: t + 1.4, dur: 1.4, ease: ease.draw });
  tl.tween(traceU, 6, { at: t + 3.0, dur: 3.6, ease: ease.linear });

  // BEAT 7 — pin the α = 6 endpoints; annotate α = 1
  t = beatAt(7);
  tl.tween(cam, { x: 790, y: 350, k: 1.08 }, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(pinU, 1, { at: t + 0.6, dur: 0.6, ease: ease.pop });
  tl.tween(noteU, 1, { at: t + 3.4, dur: 0.8, ease: ease.enter });

  // BEAT 8 — machinery whispers; endpoint comparison and takeaway
  t = beatAt(8);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: t + 0.2, dur: 1.0, ease: ease.enter });
  tl.tween(closeU, 1, { at: t + 1.8, dur: 0.6, ease: ease.enter });

  return {
    tl, cam, beat, rulerU, outU, appleX, cupX, coordU, lockU, targetU, ribU, basisU, formulaU, deltaU, editU,
    checkU, editO, shiftB, shiftU, alpha, swapU, insetU, plotU, traceU, pinU, noteU, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local renderers
// ---------------------------------------------------------------------------
function CellRow({ y, vals, color, label, fill, opacity, hotCells, tint }: {
  y: number; vals: readonly number[]; color: string; label: string; fill: number; opacity: number; hotCells?: number; tint?: string;
}) {
  if (opacity <= 0.003) return null;
  return (
    <g opacity={opacity}>
      <MathLabel tex={label} x={RIB.x0 - 14} y={y} fontSize={16} anchor="end" boxWidth={90} color={color} />
      {vals.map((v, i) => {
        const u = clamp01(fill - i);
        const hot = hotCells !== undefined && i < hotCells ? 1 : 0;
        return (
          <g key={i} opacity={u}>
            <rect x={cellX(i)} y={y - RIB.h / 2} width={RIB.w} height={RIB.h} rx={6} fill={tint && hot ? tint : color}
              fillOpacity={0.14 + 0.45 * Math.min(1, Math.abs(v) / 2)} stroke={tint && hot ? tint : color} strokeOpacity={0.6} />
            <Txt x={cellX(i) + RIB.w / 2} y={y + 5} size={14} anchor="middle" mono fill={INK.text}>{fmtPlain(v)}</Txt>
          </g>
        );
      })}
    </g>
  );
}

/** Polyline through (α, pct) points, drawn up to α = u (linear between table rows). */
function tracePath(vals: readonly number[], u: number): string {
  const n = Math.min(6, u);
  const pts: string[] = [];
  const j = Math.floor(n);
  for (let k = 0; k <= j; k++) pts.push(`${px(k)},${py(vals[k])}`);
  if (j < 6 && n > j) {
    const f = n - j;
    pts.push(`${px(n)},${py(lerp(vals[j], vals[j + 1], f))}`);
  }
  return pts.length > 1 ? `M${pts.join(' L')}` : '';
}
const valueAt = (vals: readonly number[], u: number): number => {
  const n = Math.min(6, Math.max(0, u));
  const j = Math.floor(n);
  return j >= 6 ? vals[6] : lerp(vals[j], vals[j + 1], n - j);
};

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const ruler = s.get(scene.rulerU);
  const out = s.get(scene.outU);
  const beta = s.get(scene.shiftB);
  const alpha = s.get(scene.alpha);
  // map coordinates: base positions, plus common shift, plus swap interpolation
  const aBase = s.get(scene.appleX);
  const cBase = s.get(scene.cupX);
  const aX = lerp(aBase, cBase, alpha) + beta;
  const cX = lerp(cBase, aBase, alpha) + beta;
  const m = aX - cX;
  const coord = s.get(scene.coordU);
  const lock = s.get(scene.lockU);
  const target = s.get(scene.targetU);
  const rib = s.get(scene.ribU) * s.get(scene.editO);
  const basis = s.get(scene.basisU);
  const formula = s.get(scene.formulaU) * s.get(scene.editO);
  const delta = s.get(scene.deltaU);
  const edit = s.get(scene.editU);
  const check = s.get(scene.checkU);
  const shiftU = s.get(scene.shiftU);
  const swapU = s.get(scene.swapU);
  const inset = s.get(scene.insetU);
  const plot = s.get(scene.plotU);
  const trace = s.get(scene.traceU);
  const pin = s.get(scene.pinU);
  const note = s.get(scene.noteU);
  const dim = s.get(scene.dimU);
  const close = s.get(scene.closeU);

  const isc = lerp(1, INSET.s, inset);
  const itx = lerp(0, INSET.tx, inset);
  const ity = lerp(0, INSET.ty, inset);
  const machineO = lerp(1, 0.12, dim) * (1 - 0.9 * clamp01(b - 6));
  const plotO = plot * lerp(1, 0.12, dim);
  // machine labels fade out as the toy map becomes a corner thumbnail (shapes stay)
  const tagO = clamp01((1 - inset) * 3);

  const marginColor = m >= 0 ? INK.hx : INK.cup;
  const marginWord = m > 0.05 ? 'right' : m < -0.05 ? 'left' : 'tie';

  return (
    <g>
      <Camera {...s.get(scene.cam)}>
        {/* ---- the toy machine: ruler + outputs (shrinks into the corner at beat 6) ---- */}
        <g transform={`translate(${itx}, ${ity}) scale(${isc})`} opacity={machineO}>
          <g opacity={ruler}>
            <Txt x={RUL.x0} y={RUL.y - 62} size={14} fill={INK.hx} weight={600} opacity={tagO}>horizontal readout coordinate</Txt>
            <line x1={RUL.x0} y1={RUL.y} x2={lerp(RUL.x0, RUL.x1, ruler)} y2={RUL.y} stroke={colors.ink.axis} strokeWidth={2} />
            {[-1, 0, 1, 2, 3].map((c) => (
              <g key={c} opacity={clamp01(ruler * 5 - (c + 1))}>
                <line x1={rx(c)} y1={RUL.y - 6} x2={rx(c)} y2={RUL.y + 6} stroke={colors.ink.axis} />
                <Txt x={rx(c)} y={RUL.y + 24} size={12} anchor="middle" fill={INK.muted} opacity={tagO}>{fmtPlain(c, 0)}</Txt>
              </g>
            ))}
            <Txt x={RUL.x0} y={RUL.y + 42} size={12} fill={INK.muted} opacity={tagO}>left (−)</Txt>
            <Txt x={RUL.x1} y={RUL.y + 42} size={12} anchor="end" fill={INK.muted} opacity={tagO}>right (+)</Txt>
            {/* objects: apple rides above the line, cup below, so a crossing stays legible */}
            <line x1={rx(aX)} y1={RUL.y - 30} x2={rx(aX)} y2={RUL.y} stroke={INK.apple} strokeWidth={1.2} opacity={0.6} />
            <line x1={rx(cX)} y1={RUL.y + 30} x2={rx(cX)} y2={RUL.y} stroke={INK.cup} strokeWidth={1.2} opacity={0.6} />
            <Apple x={rx(aX)} y={RUL.y - 40} r={12} opacity={clamp01(ruler * 2 - 1)} />
            <Cup x={rx(cX)} y={RUL.y + 44} r={11} opacity={clamp01(ruler * 2 - 1)} />
            <Txt x={rx(aX) + 18} y={RUL.y - 36} size={14} mono fill={INK.apple} opacity={tagO}>{fmt(aX)}</Txt>
            <Txt x={rx(cX) + 18} y={RUL.y + 48} size={14} mono fill={INK.cup} opacity={tagO}>{fmt(cX)}</Txt>
            {/* margin bracket (always between the two current positions) */}
            <Brace x0={Math.min(rx(aX), rx(cX))} x1={Math.max(rx(aX), rx(cX))} y={RUL.y + 68} u={ruler} color={marginColor} opacity={0.9} />
            <Txt x={(rx(aX) + rx(cX)) / 2} y={RUL.y + 102} size={14} anchor="middle" mono fill={marginColor} opacity={tagO}>
              {`m = ${fmt(aX)} − (${fmt(cX)}) = ${fmt(m)}`}
            </Txt>
          </g>

          {/* outputs: coordinate readout vs generated answer */}
          <g opacity={out}>
            <rect x={OUT.x} y={118} width={OUT.w} height={54} rx={8} fill={INK.panel} stroke={marginColor} strokeOpacity={0.8} />
            <Txt x={OUT.x + 12} y={138} size={12} fill={INK.muted} opacity={tagO}>coordinate readout</Txt>
            <Txt x={OUT.x + 12} y={161} size={16} mono fill={marginColor} opacity={tagO}>{`m = ${fmt(m)} → ${marginWord}`}</Txt>
            <rect x={OUT.x} y={186} width={OUT.w} height={54} rx={8} fill={INK.panel} stroke={INK.muted} strokeDasharray="5 4" />
            <Txt x={OUT.x + 12} y={206} size={12} fill={INK.muted} opacity={tagO}>generated answer</Txt>
            <Txt x={OUT.x + 12} y={229} size={16} fill={INK.text} opacity={tagO}>?  measured separately</Txt>
            <Txt x={OUT.x} y={262} size={12} fill={INK.muted} opacity={swapU * tagO}>coordinate flip ≠ guaranteed answer flip</Txt>
          </g>

          {/* common-shift readout */}
          <g opacity={shiftU}>
            <Txt x={RUL.x0} y={RUL.y + 136} size={14} fill={INK.muted} opacity={tagO}>{`common shift  β = ${fmtPlain(beta, 2)}  (both objects)`}</Txt>
            <MathLabel tex={"m' = (c_q + \\beta) - (c_r + \\beta) = m"} x={RUL.x0 + 420} y={RUL.y + 132} fontSize={16} boxWidth={360} color={INK.hx} opacity={tagO} />
            <Chip x={RUL.x1} y={RUL.y + 160} text="same margin · relative_common_shift" color={INK.muted} anchor="end" opacity={clamp01(beta * 3) * tagO} />
          </g>
          {/* swap readout */}
          <g opacity={swapU}>
            <Txt x={RUL.x0} y={RUL.y + 136} size={14} fill={INK.muted} opacity={tagO}>{`swap strength  α = ${fmtPlain(alpha, 2)}`}</Txt>
            <MathLabel tex={"c_q' = c_q + \\alpha\\,(c_r - c_q),\\quad c_r' = c_r + \\alpha\\,(c_q - c_r)"} x={RUL.x0 + 420} y={RUL.y + 132} fontSize={15} boxWidth={520} color={INK.hx} opacity={tagO} />
            <Chip x={RUL.x1} y={RUL.y + 160} text="relative_swap · α = 1 exchanges the coordinates" color={INK.muted} anchor="end" opacity={clamp01(alpha * 3) * tagO} />
            <Txt x={rx(0.5 + beta)} y={RUL.y + 86} size={12} anchor="middle" fill={INK.muted} opacity={clamp01(1 - Math.abs(alpha - 0.5) * 6) * tagO}>α = 0.5 · both at +0.5</Txt>
          </g>
        </g>

        {/* ---- coordinate column (beat 1): x moves, y and z locked ---- */}
        <g opacity={coord}>
          <Txt x={COORD.x} y={COORD.y} size={12} fill={INK.muted}>apple coordinates · illustrative target</Txt>
          {[
            { k: 'x', color: INK.hx, v: aX, locked: false },
            { k: 'y', color: INK.vy, v: C_APPLE[1], locked: true },
            { k: 'z', color: INK.dz, v: C_APPLE[2], locked: true },
          ].map((row, i) => (
            <g key={row.k}>
              <rect x={COORD.x} y={COORD.y + 14 + i * 36} width={150} height={30} rx={6} fill={row.color} fillOpacity={0.14} stroke={row.color} strokeOpacity={0.6} />
              <Txt x={COORD.x + 12} y={COORD.y + 34 + i * 36} size={14} fill={row.color} weight={600}>{row.k}</Txt>
              <Txt x={COORD.x + 80} y={COORD.y + 34 + i * 36} size={14} anchor="middle" mono fill={INK.text}>{fmt(row.v)}</Txt>
              {row.locked && (
                <g opacity={lock}>
                  <rect x={COORD.x + 120} y={COORD.y + 22 + i * 36} width={14} height={11} rx={2} fill={row.color} />
                  <path d={`M${COORD.x + 123},${COORD.y + 22 + i * 36} v-4 a4,4 0 0 1 8,0 v4`} stroke={row.color} strokeWidth={1.6} fill="none" />
                </g>
              )}
            </g>
          ))}
          <MathLabel tex={'\\Delta c = (-2,\\; 0,\\; 0)'} x={COORD.x} y={COORD.y + 150} fontSize={16} anchor="start" boxWidth={200} color={INK.hx} opacity={target} />
        </g>

        {/* ---- hidden ribbon block: h, Δh, h' ---- */}
        <g opacity={rib}>
          <Txt x={RIB.x0} y={ROW_H - 38} size={11} fill={INK.muted}>Illustrative activations · 4 displayed dimensions</Txt>
          <CellRow y={ROW_H} vals={H_APPLE} color={INK.apple} label={'h'} fill={4} opacity={1} />
          <CellRow y={ROW_DH} vals={DELTA_H} color={INK.hx} label={'\\Delta h'} fill={delta} opacity={1} />
          <Txt x={cellX(1)} y={ROW_DH + 36} size={12} anchor="start" fill={INK.vy} opacity={clamp01(delta - 1.5)}>h₂ correction</Txt>
          <Txt x={cellX(0) + RIB.w / 2} y={ROW_DH + 36} size={12} anchor="middle" fill={INK.hx} opacity={clamp01(delta - 0.5)}>x request</Txt>
          <CellRow y={ROW_HE} vals={H_EDIT} color={INK.apple} label={"h'"} fill={edit} opacity={1} />
          <Txt x={cellX(3) + RIB.w / 2} y={ROW_HE + 36} size={12} anchor="middle" fill={INK.muted} opacity={clamp01(edit - 3.5)}>unchanged · outside span(V)</Txt>
          <Vec x1={cellX(1) + RIB.w / 2} y1={ROW_DH + 42} x2={cellX(1) + RIB.w / 2} y2={ROW_HE - RIB.h / 2 - 4} grow={clamp01(edit)} color={INK.muted} width={1.4} head={7} opacity={0.6} />
          <MathLabel tex={"h' = h + \\Delta h"} x={RIB.x0} y={ROW_HE + 60} fontSize={14} anchor="start" boxWidth={180} color={INK.muted} opacity={clamp01(edit - 3.5)} />
        </g>

        {/* ---- nonorthogonal basis inset (beat 2) ---- */}
        <g opacity={basis}>
          <circle cx={BASIS.ox} cy={BASIS.oy} r={3} fill={INK.muted} />
          <Vec x1={BASIS.ox} y1={BASIS.oy} x2={BASIS.ox + VX[0] * BASIS.scale * 1.4} y2={BASIS.oy - VX[1] * BASIS.scale * 1.4} grow={basis} color={INK.hx} width={2.6} label="vₓ" labelSize={14} />
          <Vec x1={BASIS.ox} y1={BASIS.oy} x2={BASIS.ox + VY[0] * BASIS.scale * 1.4} y2={BASIS.oy - VY[1] * BASIS.scale * 1.4} grow={basis} color={INK.vy} width={2.6} label="v_y" labelSize={14} />
          <path d={`M${BASIS.ox + 28},${BASIS.oy} A28,28 0 0 0 ${BASIS.ox + 28 * VY[0]},${BASIS.oy - 28 * VY[1]}`} stroke={INK.muted} fill="none" strokeWidth={1.2} />
          <Txt x={BASIS.ox + 40} y={BASIS.oy - 10} size={12} fill={INK.muted}>≠ 90°</Txt>
          <Txt x={BASIS.ox - 70} y={BASIS.oy + 30} size={12} fill={INK.muted}>not perpendicular · naive VΔc would miss</Txt>
        </g>

        {/* ---- formulas (right) ---- */}
        <g opacity={formula} style={{ display: formula <= 0.003 ? 'none' : undefined }}>
          <MathLabel tex={'B = V\\,(V^{\\top}V)^{-1}'} x={960} y={300} fontSize={19} boxWidth={360} />
          <Txt x={960} y={326} size={12} anchor="middle" fill={INK.muted}>right inverse · rank three required</Txt>
          <MathLabel tex={'\\Delta h = B\\,\\Delta c'} x={960} y={360} fontSize={19} boxWidth={360} color={INK.hx} />
          <Txt x={960} y={392} size={12} anchor="middle" mono fill={INK.muted} opacity={clamp01(delta)}>
            {`(VᵀV)⁻¹Δc = (${fmtPlain(COEF[0], 3)}, ${fmtPlain(COEF[1], 3)}, ${fmtPlain(COEF[2], 0)})`}
          </Txt>
          <Txt x={960} y={414} size={12} anchor="middle" mono fill={INK.hx} opacity={clamp01(delta - 3)}>
            {`Δh = (${DELTA_H.map((v) => fmtPlain(v)).join(', ')})`}
          </Txt>
          <Chip x={960} y={444} text="coordinate_right_inverse" color={INK.muted} opacity={win(b, 2, 2)} />
        </g>

        {/* ---- re-projection check (beat 3) ---- */}
        <g opacity={check * s.get(scene.editO)} style={{ display: check * s.get(scene.editO) <= 0.003 ? 'none' : undefined }}>
          <MathLabel tex={"c' = V^{\\top} h'"} x={960} y={300} fontSize={19} boxWidth={360} opacity={check} />
          <Txt x={960} y={336} size={14} anchor="middle" mono fill={INK.text}>
            {`c' = (${C_EDIT.map((v) => fmt(v)).join(', ')})`}
          </Txt>
          <Txt x={960} y={360} size={12} anchor="middle" mono fill={INK.muted}>
            {`target (${C_TARGET.map((v) => fmt(v)).join(', ')})`}
          </Txt>
          <g opacity={clamp01(check * 2 - 1)}>
            <rect x={870} y={378} width={180} height={30} rx={8} fill={INK.dz} fillOpacity={0.18} stroke={INK.dz} />
            <Txt x={960} y={398} size={13} anchor="middle" weight={600} fill={INK.dz}>{TARGET_ERR < 1e-9 ? 'target reached ✓' : `target reached · err ${TARGET_ERR.toExponential(1)}`}</Txt>
            <Txt x={960} y={430} size={12} anchor="middle" fill={INK.muted}>toy arithmetic check · not a semantic guarantee</Txt>
          </g>
          <Chip x={960} y={458} text="CoordinateEditHook._hook" color={INK.muted} />
        </g>

        {/* ---- Table 7 retention plot ---- */}
        <g opacity={plotO}>
          <Txt x={PLOT.x0} y={PLOT.y0 - 22} size={14} weight={600}>answer retention vs edit strength</Txt>
          <Txt x={PLOT.x1} y={PLOT.y0 - 22} size={12} anchor="end" fill={INK.muted}>Table 7 · Molmo2-ER L17 · 800 EmbSpatial examples</Txt>
          {[0, 25, 50, 75, 100].map((p) => (
            <g key={p}>
              <line x1={PLOT.x0} y1={py(p)} x2={lerp(PLOT.x0, PLOT.x1, plot)} y2={py(p)} stroke={colors.GRID} />
              <Txt x={PLOT.x0 - 10} y={py(p) + 4} size={12} anchor="end" fill={INK.muted}>{`${p}%`}</Txt>
            </g>
          ))}
          {ALPHAS.map((a) => (
            <g key={a} opacity={clamp01(plot * 7 - a)}>
              <line x1={px(a)} y1={PLOT.y1} x2={px(a)} y2={PLOT.y1 + 6} stroke={colors.ink.axis} />
              <Txt x={px(a)} y={PLOT.y1 + 22} size={12} anchor="middle" fill={INK.muted}>{a}</Txt>
            </g>
          ))}
          <line x1={PLOT.x0} y1={PLOT.y1} x2={lerp(PLOT.x0, PLOT.x1, plot)} y2={PLOT.y1} stroke={colors.ink.axis} strokeWidth={1.5} />
          <line x1={PLOT.x0} y1={PLOT.y1} x2={PLOT.x0} y2={lerp(PLOT.y1, PLOT.y0, plot)} stroke={colors.ink.axis} strokeWidth={1.5} />
          <Txt x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT.y1 + 42} size={12} anchor="middle" fill={INK.muted}>swap strength α (random edits matched in size)</Txt>
          <Txt x={PLOT.x0 + 10} y={PLOT.y0 - 6} size={12} anchor="start" fill={INK.muted}>same answer as unedited</Txt>
          {/* curves */}
          <path d={tracePath(RANDOM, trace)} stroke={INK.random} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={tracePath(SWAP, trace)} stroke={INK.hx} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {ALPHAS.map((a) => (
            <g key={a} opacity={clamp01((trace - a) * 4 + 1)}>
              <circle cx={px(a)} cy={py(SWAP[a])} r={4} fill={INK.hx} />
              <circle cx={px(a)} cy={py(RANDOM[a])} r={4} fill={INK.random} />
            </g>
          ))}
          {/* moving heads while tracing */}
          <g opacity={clamp01(trace * 4) * (1 - clamp01((trace - 5.9) * 10))}>
            <Txt x={px(trace) + 10} y={py(valueAt(SWAP, trace)) + 5} size={12} mono fill={INK.hx}>{`${valueAt(SWAP, trace).toFixed(2)}%`}</Txt>
            <Txt x={px(trace) + 10} y={py(valueAt(RANDOM, trace)) - 8} size={12} mono fill={INK.random}>{`${valueAt(RANDOM, trace).toFixed(2)}%`}</Txt>
          </g>
          <Txt x={px(3) + 8} y={py(SWAP[3]) - 14} size={12} fill={INK.hx} opacity={clamp01(trace - 3)}>swap</Txt>
          <Txt x={px(3) + 8} y={py(RANDOM[3]) + 18} size={12} fill={INK.random} opacity={clamp01(trace - 3)}>random · matched size</Txt>
        </g>

        {/* ---- pinned endpoints (stay crisp through the close) ---- */}
        <g opacity={pin * plot}>
          <circle cx={px(6)} cy={py(SWAP[6])} r={7} fill="none" stroke={INK.hx} strokeWidth={2} />
          <circle cx={px(6)} cy={py(RANDOM[6])} r={7} fill="none" stroke={INK.random} strokeWidth={2} />
          <Txt x={px(6) + 16} y={py(SWAP[6]) + 8} size={22} mono weight={600} fill={INK.hx}>{`${SWAP[6].toFixed(2)}%`}</Txt>
          <Txt x={px(6) + 16} y={py(RANDOM[6]) + 8} size={22} mono weight={600} fill={INK.random}>{`${RANDOM[6].toFixed(2)}%`}</Txt>
          <Txt x={px(6) + 16} y={py(SWAP[6]) + 28} size={12} fill={INK.muted}>answer retention · α = 6</Txt>
          <Txt x={px(6) + 16} y={py(RANDOM[6]) + 28} size={12} fill={INK.muted}>random · α = 6</Txt>
        </g>
        <g opacity={note * plotO}>
          <circle cx={px(1)} cy={py(SWAP[1])} r={7} fill="none" stroke={INK.hx} strokeWidth={1.6} />
          <line x1={px(1)} y1={py(SWAP[1]) + 8} x2={px(1)} y2={py(SWAP[1]) + 48} stroke={INK.hx} strokeWidth={1} opacity={0.6} />
          <Txt x={px(1)} y={py(SWAP[1]) + 66} size={20} anchor="middle" mono fill={INK.hx}>{`${SWAP[1].toFixed(2)}%`}</Txt>
          <Txt x={px(1) + 10} y={py(SWAP[1]) + 84} size={12} anchor="middle" fill={INK.muted}>still retained at the exact swap (α = 1)</Txt>
        </g>

        {/* ---- retention bars at α = 6 (the 44% figure, on screen) ---- */}
        <g opacity={pin * plotO * (1 - close)}>
          <Txt x={200} y={300} size={14} weight={600}>retained at α = 6</Txt>
          {[
            { label: 'swap', pct: SWAP[6], color: INK.hx, y: 336 },
            { label: 'random · matched size', pct: RANDOM[6], color: INK.random, y: 386 },
          ].map((bar) => (
            <g key={bar.label}>
              <Txt x={200} y={bar.y} size={12} fill={bar.color}>{bar.label}</Txt>
              <Txt x={410} y={bar.y} size={14} anchor="end" mono weight={600} fill={bar.color}>{`${bar.pct.toFixed(2)}%`}</Txt>
              <rect x={200} y={bar.y + 8} width={210} height={18} rx={4} fill={colors.GRID} opacity={0.6} />
              <rect x={200} y={bar.y + 8} width={210 * (bar.pct / 100) * pin} height={18} rx={4} fill={bar.color} />
            </g>
          ))}
        </g>

        {/* ---- quiet close ---- */}
        <Field x={70} y={250} w={560} h={130} opacity={close}>
          <Txt x={350} y={300} size={25} weight={600} anchor="middle">Spatial edits selectively influence answers</Txt>
          <Txt x={350} y={332} size={12.5} anchor="middle" fill={INK.muted}>measured: Table 7 · Molmo2-ER L17 · 800 EmbSpatial · answer retention, not accuracy</Txt>
          <Txt x={350} y={356} size={12.5} anchor="middle" fill={INK.muted}>no guarantee for every edit, or for every other answer</Txt>
        </Field>
      </Camera>

      {/* screen-fixed overlays */}
      <g>
        <Txt x={70} y={54} size={12} fill={INK.muted} spacing={1.6} weight={600}>CHAPTER 2</Txt>
        <Txt x={164} y={54} size={16} weight={600}>Move the map, test the answer</Txt>
      </g>
      {NOTES.map((n, i) => (
        <Txt key={i} x={1210} y={578} size={12} anchor="end" fill={INK.muted} opacity={0.85 * clamp01(1 - Math.abs(b - i) * 1.6)}>
          {`Source: ${n}`}
        </Txt>
      ))}
    </g>
  );
}

export const vizScene = () => scene;
