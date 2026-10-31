// Three rulers inside a token
//
// Sources (S-Space, arXiv 2610.13527; github.com/MirroS-Lab/S-Space @ fbb0940):
//   paper §2 Eq. 1–4 (answer contrast, gradient pair, mean then normalize, c = Vᵀh, margin)
//   sspace/core/extraction/execution.py — LayerwiseFixedContrastGradient.extract
//     (endpoint logit difference, autograd, (gradient_query − gradient_reference)/2)
//   sspace/core/extraction/merge.py — _unit_axes (global mean, THEN L2 normalize),
//     _project_object_states; merge_completed_shards sums original + swapped shards
//   sspace/core/artifacts/artifacts.py — NEGATIVE (left, above, far) / POSITIVE (right, below, close)
//
// Machine: two colored activation ribbons (apple, cup) sit under a toy picture.
// A horizontal answer gauge pulls sensitivity arrows out of the ribbons; the
// gradient pair cancels cell by cell into one direction; illustrative arrows
// average into a mean and only then stretch to unit length; three rulers slot
// under the ribbons; real dot products accumulate into coordinate readouts; the
// readouts land on a horizontal map and the margin bracket reads "right".
// The four-cell activations are a teaching compression (labelled on stage).
import type { ReactNode } from 'react';
// Standalone blog sections load these scenes without ChapterPlayer's math stylesheet.
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
  apple: '#fb7185', // coral
  cup: '#38bdf8', // cyan
  hx: colors.WARM, // horizontal
  vy: colors.SECONDARY, // vertical
  dz: colors.POSITIVE, // depth
  text: colors.TEXT,
  muted: '#aebdd2', // a step brighter than MUTED so secondary labels stay legible on the panels
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
function Chip({ x, y, text, color = INK.muted, opacity = 1, size = 12, anchor = 'middle' }: {
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

// ---------------------------------------------------------------------------
// Data — illustrative four-dimensional example from the plan (NOT empirical)
// ---------------------------------------------------------------------------
const H_APPLE = [1.5, -0.5, 0.8, 1.2] as const;
const H_CUP = [-0.5, 0.5, -0.2, -0.8] as const;
const VX = [1, 0, 0, 0] as const;
const VY = [0.6, 0.8, 0, 0] as const;
const VZ = [0, 0, 1, 0] as const;
const RULERS = [
  { key: 'x', v: VX, color: INK.hx, tex: 'v_x', pos: 'right', neg: 'left' },
  { key: 'y', v: VY, color: INK.vy, tex: 'v_y', pos: 'below', neg: 'above' },
  { key: 'z', v: VZ, color: INK.dz, tex: 'v_z', pos: 'close', neg: 'far' },
] as const;
const dot = (a: readonly number[], b: readonly number[]): number => a.reduce((s, ai, i) => s + ai * b[i], 0);
const C_APPLE = RULERS.map((r) => dot(H_APPLE, r.v)); // (1.5, 0.5, 0.8)
const C_CUP = RULERS.map((r) => dot(H_CUP, r.v)); // (−0.5, 0.1, −0.2)
const MARGIN_X = C_APPLE[0] - C_CUP[0]; // +2.0

// partial sums per ruler per object: partial[k][j] = Σ_{i<j} h_i v_i (j = 0..4)
const partials = (h: readonly number[]): number[][] =>
  RULERS.map((r) => {
    const out = [0];
    let acc = 0;
    for (let i = 0; i < 4; i++) {
      acc += h[i] * r.v[i];
      out.push(acc);
    }
    return out;
  });
const PART_APPLE = partials(H_APPLE);
const PART_CUP = partials(H_CUP);

/**
 * Accumulated dot product shown for ruler k while the sweep is at `step`
 * (0..12; four cells per ruler). The in-ruler progress is clamped to [0, 4],
 * NOT [0, 1], so every cell's product is added before the sum settles.
 */
const readoutAt = (part: number[][], k: number, step: number): number => {
  const u = Math.max(0, Math.min(4, step - k * 4));
  const j = Math.floor(u);
  const f = u - j;
  const seq = part[k];
  return j >= 4 ? seq[4] : lerp(seq[j], seq[Math.min(4, j + 1)], f);
};
// sanity (module scope): the sweep must land on the exact Vᵀh coordinates
const EXPECT_APPLE = [1.5, 0.5, 0.8];
const EXPECT_CUP = [-0.5, 0.1, -0.2];
const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;
[0, 1, 2].forEach((k) => {
  if (!near(C_APPLE[k], EXPECT_APPLE[k]) || !near(C_CUP[k], EXPECT_CUP[k])) throw new Error(`S-Space readout mismatch on ruler ${k}`);
  if (!near(readoutAt(PART_APPLE, k, 12), C_APPLE[k]) || !near(readoutAt(PART_CUP, k, 12), C_CUP[k])) throw new Error(`S-Space readout sweep never settles on ruler ${k}`);
  // halfway through a ruler the display must be the partial sum, not the full value
  if (!near(readoutAt(PART_APPLE, k, k * 4 + 2), PART_APPLE[k][2])) throw new Error(`S-Space readout partial sum wrong on ruler ${k}`);
});
if (!near(readoutAt(PART_APPLE, 1, 8), 0.6 * 1.5 + 0.8 * -0.5)) throw new Error('S-Space readout: v_y sum must include the second cell');

// illustrative gradient pair (plan): (g_q − g_r)/2 = (1, 0, 0, 0)
const G_Q = [1.2, 0.3, -0.2, 0.1] as const;
const G_R = [-0.8, 0.3, -0.2, 0.1] as const;
const G_DIFF = G_Q.map((q, i) => (q - G_R[i]) / 2); // (1, 0, 0, 0)

// illustrative per-example difference arrows (2-D projection on cells 0,1); they
// average to (0.8, 0), whose unit vector is v_x = (1, 0)
const SAMPLES = [
  { x: 1.0, y: 0.3, tag: 'example' },
  { x: 0.8, y: -0.25, tag: 'template' },
  { x: 1.3, y: 0.1, tag: 'swapped' },
  { x: 0.6, y: -0.15, tag: 'example' },
  { x: 0.3, y: 0.0, tag: 'original' },
] as const;
const MEAN = {
  x: SAMPLES.reduce((s, p) => s + p.x, 0) / SAMPLES.length,
  y: SAMPLES.reduce((s, p) => s + p.y, 0) / SAMPLES.length,
};
const MEAN_LEN = Math.hypot(MEAN.x, MEAN.y); // 0.8
const UNIT = { x: MEAN.x / MEAN_LEN, y: MEAN.y / MEAN_LEN }; // (1, 0)

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
// picture frame: big at the start, small top-left once the ribbons unfold
const PIC_BIG = { x: 340, y: 92, w: 600, h: 210 } as const;
const PIC_SMALL = { x: 70, y: 96, w: 270, h: 120 } as const;
const CUP_F = { u: (440 - PIC_BIG.x) / PIC_BIG.w, v: 0.52 } as const;
const APPLE_F = { u: (790 - PIC_BIG.x) / PIC_BIG.w, v: 0.5 } as const;

// ribbon station
const RIB = { x0: 430, w: 62, gap: 6, h: 42 } as const;
const ROW_APPLE = 300;
const ROW_CUP = 370;
const cellX = (i: number): number => RIB.x0 + i * (RIB.w + RIB.gap);
const RIB_RIGHT = cellX(3) + RIB.w; // 698

// gradient panel (right)
const GP = { x0: 790, w: 54, gap: 6, h: 36 } as const;
const gpX = (i: number): number => GP.x0 + i * (GP.w + GP.gap);
const ROW_GQ = 300;
const ROW_GR = 370;
const ROW_GD = 445;

// gauge (top right)
const GAUGE = { x0: 800, x1: 1200, y: 150 } as const;

// mean-then-normalize sketch (bottom left)
const SK = { ox: 150, oy: 468, scale: 130 } as const;

// rulers under the ribbons
const RULER_Y = [458, 504, 550] as const;
const RUL_H = 34;

// basis inset (right, replaces gradient panel)
const BASIS = { ox: 980, oy: 400, scale: 70 } as const;

// sample-arrow tags: a column past the longest arrow, rows in the tips' top-to-bottom
// order so each dashed leader runs down or up to its own row without crossing another
const TAG_X = SK.ox + 1.3 * SK.scale + 40;
const TAG_Y0 = 428;
const TAG_GAP = 18;
const TAG_ORDER = SAMPLES.map((_, i) => i).sort((a, b) => SAMPLES[b].y - SAMPLES[a].y);
const TAG_RANK = SAMPLES.map((_, i) => TAG_ORDER.indexOf(i));

// readout column (right of the ribbons)
const READ = { label: 760, x0: 830, w: 80, step: 92, head: ROW_APPLE - 44, axes: ROW_APPLE - 23 } as const;
const readX = (k: number): number => READ.x0 + k * READ.step;

// coordinate map (right, under the readouts)
const MAP = { x0: 840, x1: 1180, line: 452 } as const; // number line −1..2
const mapX = (c: number): number => lerp(MAP.x0, MAP.x1, (c + 1) / 3);

const CAPTIONS = [
  'A model can name the apple and the cup. Where does it keep the fact that one sits to the right of the other?',
  "The researchers look inside each object's token, where a long vector mixes location with many other features.",
  "First, compare the model's scores for right and left. Ask which changes to the hidden vectors would increase that difference.",
  'The query and reference play opposite roles. Subtract their gradients and divide by two to isolate their opposing spatial influence.',
  'Average those differences across examples, wordings, and swapped object orders. Then normalize the average into one stable direction.',
  'Repeat for vertical position and distance. The result is three readout directions, fixed for this model and layer.',
  "Now a forward pass is enough. Dot each object's hidden vector with the three directions to read its coordinates.",
  "Subtract the cup's horizontal coordinate from the apple's. A positive margin reads as right, without asking the model to say the answer.",
  'These coordinates are a readable internal map. They are not distances in meters, and each axis is tied to the chosen model and layer.',
] as const;

const NOTES = [
  'paper §1 · toy picture, not a paper figure',
  'paper §2 · h ∈ ℝ^d_model, four cells shown',
  'execution.py · LayerwiseFixedContrastGradient.extract',
  'execution.py · (grad_query − grad_reference) / 2',
  'merge.py · _unit_axes: mean, then L2 normalize',
  'artifacts.py · positive endpoints right / below / close',
  'merge.py · _project_object_states · paper Eq. 3',
  'paper Eq. 4 · margin m = c_q − c_r',
  'paper §2 · readout, not metric reconstruction',
] as const;

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = narrate(tl, CAPTIONS);
  const picU = tl.channel('picU', 0); // 0 = draw-on
  const relU = tl.channel('relU', 0); // rightward comparison bracket
  const shrinkU = tl.channel('shrinkU', 0); // picture → small inset
  const unfoldU = tl.channel('unfoldU', 0); // tokens → 4 cells
  const gaugeU = tl.channel('gaugeU', 0);
  const sensU = tl.channel('sensU', 0); // sensitivity arrows
  const gradU = tl.channel('gradU', 0); // gradient pair rows
  const cancelU = tl.channel('cancelU', 0); // cell-by-cell cancellation (0..4)
  const sketchU = tl.channel('sketchU', 0); // sample arrows
  const meanU = tl.channel('meanU', 0); // mean arrow
  const normU = tl.channel('normU', 0); // stretch to unit length
  const gradO = tl.channel('gradO', 1); // gradient panel opacity
  const sketchO = tl.channel('sketchO', 1);
  const rulerU = tl.channel('rulerU', 0); // three rulers slot in (0..3)
  const basisU = tl.channel('basisU', 0);
  const lockU = tl.channel('lockU', 0);
  const dotU = tl.channel('dotU', 0); // 0..12 dot-product steps
  const mapU = tl.channel('mapU', 0);
  const marginU = tl.channel('marginU', 0);
  const badgeU = tl.channel('badgeU', 0);
  const ribO = tl.channel('ribO', 1);
  const readO = tl.channel('readO', 1); // readout column opacity (outlives the ribbons)
  const picO = tl.channel('picO', 1); // picture inset opacity (parked while the camera moves)
  const closeU = tl.channel('closeU', 0);

  // BEAT 0 — picture, tokens, the rightward relation; camera drifts to the tokens
  tl.tween(picU, 1, { at: 0.5, dur: 1.2, ease: ease.draw });
  tl.tween(relU, 1, { at: 2.4, dur: 1.0, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 300, k: 1.18 }, { at: 4.2, dur: 1.5, ease: ease.move });

  // BEAT 1 — tokens unfold into ribbons; picture shrinks to the corner
  let t = beatAt(1);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(shrinkU, 1, { at: t + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(unfoldU, 1, { at: t + 1.4, dur: 1.4, ease: ease.move });

  // BEAT 2 — the answer gauge and two sensitivity arrows
  t = beatAt(2);
  tl.tween(gaugeU, 1, { at: t + 0.3, dur: 1.2, ease: ease.draw });
  tl.tween(sensU, 1, { at: t + 1.8, dur: 1.4, ease: ease.draw });

  // BEAT 3 — the gradient pair cancels cell by cell
  t = beatAt(3);
  tl.tween(sensU, 0.25, { at: t, dur: 0.8, ease: ease.enter });
  tl.tween(gradU, 1, { at: t + 0.3, dur: 1.0, ease: ease.enter });
  tl.tween(cancelU, 4, { at: t + 2.0, dur: 3.2, ease: ease.linear });

  // BEAT 4 — mean, THEN normalize. The gauge and the picture inset are done:
  // park them before the camera leans toward the sketch so nothing is clipped.
  t = beatAt(4);
  tl.tween(gaugeU, 0, { at: t - 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(sensU, 0, { at: t - 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(picO, 0, { at: t - 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(cam, { x: 600, y: 410, k: 1.1 }, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(sketchU, 1, { at: t + 0.3, dur: 1.6, ease: ease.linear });
  tl.tween(meanU, 1, { at: t + 2.4, dur: 1.2, ease: ease.move });
  tl.tween(normU, 1, { at: t + 4.6, dur: 1.2, ease: ease.move });

  // BEAT 5 — three rulers slot under the ribbons; basis inset
  t = beatAt(5);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(gradO, 0, { at: t, dur: 0.8, ease: ease.enter });
  tl.tween(sketchO, 0, { at: t + 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(rulerU, 3, { at: t + 0.6, dur: 2.4, ease: ease.linear });
  tl.tween(basisU, 1, { at: t + 3.4, dur: 1.0, ease: ease.enter });

  // BEAT 6 — forward pass: the basis sketch yields its spot to the readouts
  t = beatAt(6);
  tl.tween(basisU, 0, { at: t - 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(lockU, 1, { at: t + 0.2, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: 720, y: 420, k: 1.1 }, { at: t - 0.2, dur: 1.2, ease: ease.move });
  tl.tween(dotU, 12, { at: t + 1.0, dur: 3.6, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: t + 4.6, dur: 1.4, ease: ease.move });
  tl.tween(mapU, 1, { at: t + 5.0, dur: 1.4, ease: ease.draw });

  // BEAT 7 — ribbons whisper; the camera leans on readouts + map; margin bracket
  t = beatAt(7);
  tl.tween(ribO, 0.1, { at: t - 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, { x: 980, y: 412, k: 1.2 }, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(marginU, 1, { at: t + 1.0, dur: 1.4, ease: ease.move });
  tl.tween(badgeU, 1, { at: t + 3.2, dur: 0.5, ease: ease.pop });

  // BEAT 8 — readouts whisper too; the map stays; picture returns; opaque takeaway
  t = beatAt(8);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(readO, 0.1, { at: t + 0.2, dur: 1.0, ease: ease.enter });
  tl.tween(picO, 1, { at: t + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(closeU, 1, { at: t + 1.8, dur: 0.6, ease: ease.enter });

  return {
    tl, cam, beat, picU, relU, shrinkU, unfoldU, gaugeU, sensU, gradU, cancelU, sketchU, meanU, normU,
    gradO, sketchO, rulerU, basisU, lockU, dotU, mapU, marginU, badgeU, ribO, readO, picO, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local renderers
// ---------------------------------------------------------------------------
function Apple({ x, y, r, opacity = 1 }: { x: number; y: number; r: number; opacity?: number }) {
  if (opacity <= 0.003) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={INK.apple} />
      <path d={`M${x},${y - r} q${r * 0.25},${-r * 0.5} ${r * 0.6},${-r * 0.45}`} stroke={INK.dz} strokeWidth={r * 0.14} fill="none" strokeLinecap="round" />
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

/** One activation ribbon: a token chip that unfolds into four cells. */
function Ribbon({ y, h, color, name, unfold, opacity, highlightCell, cellTint }: {
  y: number; h: readonly number[]; color: string; name: string; unfold: number; opacity: number;
  highlightCell: number; cellTint: number;
}) {
  if (opacity <= 0.003) return null;
  return (
    <g opacity={opacity}>
      <Txt x={RIB.x0 - 14} y={y + 5} size={14} anchor="end" fill={color} weight={600}>{name}</Txt>
      {h.map((v, i) => {
        const u = clamp01(unfold * 4 - i * 0.6);
        const x = lerp(RIB.x0, cellX(i), u);
        const w = lerp(RIB.w * 1.4, RIB.w, u);
        const hot = clamp01(1 - Math.abs(highlightCell - i)) * cellTint;
        return (
          <g key={i} opacity={i === 0 ? 1 : u}>
            <rect x={x} y={y - RIB.h / 2} width={w} height={RIB.h} rx={6} fill={color}
              fillOpacity={0.16 + 0.5 * Math.min(1, Math.abs(v) / 1.5) * u + 0.3 * hot}
              stroke={color} strokeOpacity={0.5 + 0.5 * hot} strokeWidth={1 + hot} />
            <Txt x={x + w / 2} y={y + 5} size={14} anchor="middle" mono fill={INK.text} opacity={u}>{fmtPlain(v)}</Txt>
            {i === 0 && <Txt x={x + w / 2} y={y + 5} size={14} anchor="middle" mono fill={color} opacity={1 - clamp01(u * 2)}>{name}</Txt>}
          </g>
        );
      })}
    </g>
  );
}

/** A gradient row with four cells; column i shows `fade` once cancelled. */
function GradRow({ y, g, label, color, opacity, cancel, isDiff }: {
  y: number; g: readonly number[]; label: string; color: string; opacity: number; cancel: number; isDiff?: boolean;
}) {
  if (opacity <= 0.003) return null;
  return (
    <g opacity={opacity}>
      <Txt x={GP.x0 - 10} y={y + 5} size={13} anchor="end" fill={color} mono>{label}</Txt>
      {g.map((v, i) => {
        const done = clamp01(cancel - i);
        const shared = i > 0; // columns 1..3 are equal between q and r
        const dim = isDiff ? 0 : done * (shared ? 0.65 : 0);
        return (
          <g key={i} opacity={isDiff ? done : 1}>
            <rect x={gpX(i)} y={y - GP.h / 2} width={GP.w} height={GP.h} rx={5} fill={color}
              fillOpacity={(0.12 + 0.45 * Math.min(1, Math.abs(v))) * (1 - dim)} stroke={color} strokeOpacity={0.6 - 0.4 * dim} />
            <Txt x={gpX(i) + GP.w / 2} y={y + 5} size={13} anchor="middle" mono fill={INK.text} opacity={1 - 0.6 * dim}>{fmtPlain(v)}</Txt>
            {!isDiff && shared && done > 0 && (
              <line x1={gpX(i) + 6} y1={y + GP.h / 2 - 6} x2={gpX(i) + GP.w - 6} y2={y - GP.h / 2 + 6} stroke={INK.muted} strokeWidth={1.4} opacity={done} />
            )}
          </g>
        );
      })}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const pic = s.get(scene.picU);
  const rel = s.get(scene.relU);
  const shrink = s.get(scene.shrinkU);
  const unfold = s.get(scene.unfoldU);
  const gauge = s.get(scene.gaugeU);
  const sens = s.get(scene.sensU);
  const grad = s.get(scene.gradU) * s.get(scene.gradO);
  const cancel = s.get(scene.cancelU);
  const sketch = s.get(scene.sketchU);
  const mean = s.get(scene.meanU);
  const norm = s.get(scene.normU);
  const sketchO = s.get(scene.sketchO);
  const ruler = s.get(scene.rulerU);
  const basis = s.get(scene.basisU);
  const lock = s.get(scene.lockU);
  const dotP = s.get(scene.dotU);
  const map = s.get(scene.mapU);
  const margin = s.get(scene.marginU);
  const badge = s.get(scene.badgeU);
  const ribO = s.get(scene.ribO);
  const readO = s.get(scene.readO);
  const picO = s.get(scene.picO);
  const close = s.get(scene.closeU);

  // picture geometry (big → small)
  const P = {
    x: lerp(PIC_BIG.x, PIC_SMALL.x, shrink), y: lerp(PIC_BIG.y, PIC_SMALL.y, shrink),
    w: lerp(PIC_BIG.w, PIC_SMALL.w, shrink), h: lerp(PIC_BIG.h, PIC_SMALL.h, shrink),
  };
  const cupX = P.x + CUP_F.u * P.w;
  const cupY = P.y + CUP_F.v * P.h;
  const appleX = P.x + APPLE_F.u * P.w;
  const appleY = P.y + APPLE_F.v * P.h;
  const objR = lerp(30, 14, shrink);

  // token chips under the big picture before they unfold
  const tokO = pic * (1 - clamp01(shrink * 2));

  // dot-product step: k = ruler index, j = cell index
  const step = Math.min(12, dotP);
  const curRuler = Math.min(2, Math.floor(step / 4));
  const curCell = step - curRuler * 4;
  const hotCell = step >= 12 ? -2 : curCell; // highlight sweeps across the cell being multiplied
  const readout = (part: number[][], k: number): number => readoutAt(part, k, step);
  const dotLive = clamp01(dotP / 0.5);

  const gaugeNeedle = lerp(0.5, 0.78, gauge); // illustrative tilt toward "right"

  return (
    <g>
      <Camera {...s.get(scene.cam)}>
        {/* ---- picture frame + objects (parked while the camera roams) ---- */}
        {/* everything but the closing panel fades to a faint backdrop before the panel lands */}
        <g opacity={1 - 0.85 * close}>
        <g opacity={pic * picO}>
          <rect x={P.x} y={P.y} width={P.w * pic} height={P.h} rx={10} fill={INK.panel} stroke={colors.GRID} />
          <Cup x={cupX} y={cupY} r={objR} opacity={clamp01(pic * 3 - 1)} />
          <Apple x={appleX} y={appleY} r={objR} opacity={clamp01(pic * 3 - 2)} />
          <Txt x={P.x + 10} y={P.y + P.h - 8} size={12} fill={INK.muted}>toy picture · apple right of cup</Txt>
          {/* rightward relation bracket */}
          <Vec x1={cupX + objR + 12} y1={lerp(cupY - 46, cupY - 24, shrink)} x2={appleX - objR - 12} y2={lerp(appleY - 46, appleY - 24, shrink)}
            grow={rel} color={INK.hx} width={2.4} head={9} opacity={1 - 0.5 * shrink} />
          <Txt x={(cupX + appleX) / 2} y={lerp(cupY - 56, cupY - 32, shrink)} size={lerp(14, 10, shrink)} anchor="middle" fill={INK.hx} opacity={rel}>
            right of
          </Txt>
        </g>

        {/* token chips (pre-unfold) */}
        <Chip x={440} y={345} text="cup" color={INK.cup} size={14} opacity={tokO} />
        <Chip x={790} y={345} text="apple" color={INK.apple} size={14} opacity={tokO} />
        <Txt x={640} y={395} size={13} anchor="middle" fill={INK.muted} opacity={tokO * rel}>object-name tokens · where is “right of” stored?</Txt>

        {/* ---- ribbons ---- */}
        <g opacity={ribO}>
          <Ribbon y={ROW_APPLE} h={H_APPLE} color={INK.apple} name="apple" unfold={unfold} opacity={clamp01(shrink * 2)}
            highlightCell={hotCell} cellTint={dotLive * (1 - clamp01(step - 11.5))} />
          <Ribbon y={ROW_CUP} h={H_CUP} color={INK.cup} name="cup" unfold={unfold} opacity={clamp01(shrink * 2)}
            highlightCell={hotCell} cellTint={dotLive * (1 - clamp01(step - 11.5))} />
          <Txt x={RIB.x0} y={READ.head} size={12} fill={INK.muted} opacity={unfold}>Illustrative activations · 4 displayed dimensions</Txt>
          <MathLabel tex={'h \\in \\mathbb{R}^{d_{\\text{model}}}'} x={RIB.x0 - 14} y={READ.head} fontSize={15} anchor="end" boxWidth={110} color={INK.muted} opacity={unfold} />
        </g>

        {/* ---- answer gauge + sensitivity arrows ---- */}
        <g opacity={gauge}>
          <Txt x={(GAUGE.x0 + GAUGE.x1) / 2} y={GAUGE.y - 34} size={14} anchor="middle" fill={INK.hx} weight={600}>horizontal answer score</Txt>
          <MathLabel tex={'s_x = \\text{logit}(\\text{right}) - \\text{logit}(\\text{left})'} x={(GAUGE.x0 + GAUGE.x1) / 2} y={GAUGE.y - 8} fontSize={16} boxWidth={420} />
          <line x1={GAUGE.x0} y1={GAUGE.y + 18} x2={GAUGE.x1} y2={GAUGE.y + 18} stroke={colors.ink.axis} strokeWidth={2} />
          <line x1={lerp(GAUGE.x0, GAUGE.x1, gauge)} y1={GAUGE.y + 18} x2={lerp(GAUGE.x0, GAUGE.x1, gauge)} y2={GAUGE.y + 18} stroke={INK.hx} strokeWidth={3} />
          {/* end labels sit above the axis so the sensitivity arrows never cross them */}
          <Txt x={GAUGE.x0} y={GAUGE.y + 10} size={12} fill={INK.muted}>left (−)</Txt>
          <Txt x={GAUGE.x1} y={GAUGE.y + 10} size={12} anchor="end" fill={INK.muted}>right (+)</Txt>
          <line x1={(GAUGE.x0 + GAUGE.x1) / 2} y1={GAUGE.y + 10} x2={(GAUGE.x0 + GAUGE.x1) / 2} y2={GAUGE.y + 26} stroke={INK.muted} />
          <circle cx={lerp(GAUGE.x0, GAUGE.x1, gaugeNeedle)} cy={GAUGE.y + 18} r={8} fill={INK.hx} />
          <Txt x={lerp(GAUGE.x0, GAUGE.x1, gaugeNeedle)} y={GAUGE.y + 58} size={13} anchor="middle" fill={INK.hx} opacity={gauge}>which hidden changes raise this?</Txt>
        </g>
        {/* sensitivity arrows: from each ribbon's right edge up toward the gauge */}
        <Vec x1={RIB_RIGHT + 10} y1={ROW_APPLE} x2={GAUGE.x0 + 40} y2={GAUGE.y + 40} grow={sens} color={INK.apple} width={2.2} head={9} opacity={clamp01(sens * 3)} />
        <Vec x1={RIB_RIGHT + 10} y1={ROW_CUP} x2={GAUGE.x0 + 60} y2={GAUGE.y + 48} grow={sens} color={INK.cup} width={2.2} head={9} opacity={clamp01(sens * 3)} />
        <Txt x={800} y={ROW_CUP - 34} size={13} fill={INK.muted} opacity={clamp01(sens * 2 - 1) * (1 - on(b, 3))}>gradient of the score</Txt>
        <Chip x={RIB_RIGHT + 10} y={ROW_CUP + 40} text="LayerwiseFixedContrastGradient.extract" color={INK.muted} anchor="start" opacity={win(b, 2, 3) * clamp01(sens * 3)} />

        {/* ---- gradient pair cancellation ---- */}
        <g opacity={grad}>
          <Txt x={GP.x0} y={ROW_GQ - 36} size={12} fill={INK.muted}>gradient pair · score gradients, query and reference</Txt>
          <GradRow y={ROW_GQ} g={G_Q} label="g_q" color={INK.apple} opacity={1} cancel={cancel} />
          <GradRow y={ROW_GR} g={G_R} label="g_r" color={INK.cup} opacity={1} cancel={cancel} />
          <MathLabel tex={'\\tfrac{1}{2}(g_q - g_r)'} x={GP.x0 - 10} y={ROW_GD} fontSize={15} anchor="end" boxWidth={120} color={INK.hx} opacity={clamp01(cancel)} />
          <GradRow y={ROW_GD} g={G_DIFF} label="" color={INK.hx} opacity={1} cancel={cancel} isDiff />
          <Txt x={gpX(1)} y={ROW_GD + 40} size={12} fill={INK.muted} opacity={clamp01(cancel - 1)}>shared components cancel</Txt>
          <Txt x={gpX(0) + GP.w / 2} y={ROW_GD + 40} size={12} anchor="middle" fill={INK.hx} opacity={clamp01(cancel)}>opposing</Txt>
        </g>

        {/* ---- mean THEN normalize sketch ---- */}
        <g opacity={sketchO}>
          <Txt x={SK.ox - 90} y={SK.oy - 112} size={13} fill={INK.muted} opacity={clamp01(sketch * 3)}>per-example differences</Txt>
          <Txt x={SK.ox - 90} y={SK.oy + 108} size={12} fill={INK.muted} opacity={clamp01(sketch * 3)}>examples · templates · original + swapped</Txt>
          {SAMPLES.map((p, i) => {
            const g = clamp01(sketch * SAMPLES.length - i);
            const faded = 1 - 0.75 * mean;
            const tipX = SK.ox + p.x * SK.scale;
            const tipY = SK.oy - p.y * SK.scale;
            const rowY = TAG_Y0 + TAG_GAP * TAG_RANK[i];
            return (
              <g key={i}>
                <g opacity={g * faded}>
                  <Vec x1={SK.ox} y1={SK.oy} x2={tipX} y2={tipY} grow={g} color={INK.hx} width={1.6} head={7} opacity={0.75} />
                </g>
                <line x1={tipX + 5} y1={tipY} x2={TAG_X - 6} y2={rowY} stroke={INK.muted} strokeWidth={1} strokeDasharray="2 3" opacity={g * 0.6} />
                <Txt x={TAG_X} y={rowY + 4} size={12} fill={INK.text} opacity={g * (1 - 0.3 * mean)}>{p.tag}</Txt>
              </g>
            );
          })}
          {/* the mean arrow, then its stretch to unit length */}
          <Vec x1={SK.ox} y1={SK.oy} x2={SK.ox + lerp(MEAN.x, UNIT.x, norm) * SK.scale} y2={SK.oy - lerp(MEAN.y, UNIT.y, norm) * SK.scale}
            grow={mean} color={INK.hx} width={3.4} head={11} opacity={mean} />
          <circle cx={SK.ox} cy={SK.oy} r={3} fill={INK.muted} opacity={clamp01(sketch * 3)} />
          <Txt x={SK.ox - 90} y={SK.oy + 84} size={13} fill={INK.hx} opacity={mean * (1 - norm)}>{`mean · length ${MEAN_LEN.toFixed(1)}`}</Txt>
          <Txt x={SK.ox - 90} y={SK.oy + 84} size={13} fill={INK.hx} opacity={norm}>normalized · length 1.0</Txt>
          <MathLabel tex={'v_x = \\dfrac{\\bar g}{\\lVert \\bar g \\rVert}'} x={SK.ox + 150} y={SK.oy - 60} fontSize={16} boxWidth={160} color={INK.hx} opacity={norm} />
          <Chip x={SK.ox - 90} y={SK.oy + 130} text="_unit_axes: mean, then L2 normalize" color={INK.muted} size={12} anchor="start" opacity={clamp01(mean * 2)} />
        </g>

        {/* ---- three rulers under the ribbons ---- */}
        <g opacity={ribO}>
          {RULERS.map((r, k) => {
            const u = clamp01(ruler - k);
            if (u <= 0.003) return null;
            const y = lerp(RULER_Y[k] + 40, RULER_Y[k], u);
            const hotK = curRuler === k && step < 12 ? 1 : 0;
            return (
              <g key={r.key} opacity={u}>
                <MathLabel tex={r.tex} x={RIB.x0 - 14} y={y} fontSize={16} anchor="end" boxWidth={60} color={r.color} />
                {r.v.map((v, i) => {
                  const hot = hotK * clamp01(1 - Math.abs(hotCell - i)) * dotLive;
                  return (
                    <g key={i}>
                      <rect x={cellX(i)} y={y - RUL_H / 2} width={RIB.w} height={RUL_H} rx={5} fill={r.color}
                        fillOpacity={0.1 + 0.4 * v + 0.3 * hot} stroke={r.color} strokeOpacity={0.5 + 0.5 * hot} strokeWidth={1 + hot} />
                      <Txt x={cellX(i) + RIB.w / 2} y={y + 5} size={13} anchor="middle" mono fill={INK.text}>{fmtPlain(v)}</Txt>
                    </g>
                  );
                })}
                <Txt x={RIB_RIGHT + 12} y={y + 4} size={12} fill={r.color}>{`+ ${r.pos} · − ${r.neg}`}</Txt>
              </g>
            );
          })}
          <Txt x={RIB.x0} y={RULER_Y[0] - 30} size={12} fill={INK.muted} opacity={clamp01(ruler)}>implementation signs: right / below / close</Txt>
          <Txt x={RIB.x0} y={RULER_Y[2] + 46} size={12} fill={INK.muted} opacity={clamp01(ruler - 2)}>each ruler is one readout direction: v · h gives one coordinate</Txt>
          <Chip x={RIB_RIGHT + 40} y={RULER_Y[0] - 34} text="axes fixed" color={INK.muted} anchor="start" opacity={lock} />
        </g>

        {/* ---- basis inset (not drawn as perpendicular) ---- */}
        <g opacity={basis}>
          <MathLabel tex={'V = [\\,v_x\\; v_y\\; v_z\\,]'} x={BASIS.ox + 60} y={BASIS.oy - 120} fontSize={18} boxWidth={260} />
          <Txt x={BASIS.ox + 60} y={BASIS.oy - 92} size={12} anchor="middle" fill={INK.muted}>normalized independently · not orthogonalized</Txt>
          <circle cx={BASIS.ox} cy={BASIS.oy} r={3} fill={INK.muted} />
          <Vec x1={BASIS.ox} y1={BASIS.oy} x2={BASIS.ox + VX[0] * BASIS.scale} y2={BASIS.oy - VX[1] * BASIS.scale} grow={basis} color={INK.hx} width={2.6} label="vₓ" labelSize={14} />
          <Vec x1={BASIS.ox} y1={BASIS.oy} x2={BASIS.ox + VY[0] * BASIS.scale} y2={BASIS.oy - VY[1] * BASIS.scale} grow={basis} color={INK.vy} width={2.6} label="v_y" labelSize={14} />
          <Vec x1={BASIS.ox} y1={BASIS.oy} x2={BASIS.ox - 0.5 * BASIS.scale} y2={BASIS.oy - 0.35 * BASIS.scale} grow={basis} color={INK.dz} width={2.6} label="v_z" labelSize={14} />
          <Txt x={BASIS.ox + 60} y={BASIS.oy + 60} size={12} anchor="middle" fill={INK.muted}>symbolic sketch of the four-cell example</Txt>
        </g>

        {/* ---- coordinate readouts (accumulating dot products) ---- */}
        <g opacity={dotLive * readO}>
          <Txt x={READ.x0} y={READ.head} size={12} fill={INK.muted}>readout coordinates</Txt>
          <MathLabel tex={'c = V^{\\top} h'} x={readX(2) + READ.w / 2} y={READ.head} fontSize={16} boxWidth={120} opacity={clamp01(step - 3)} />
          {RULERS.map((r, k) => (
            <Txt key={r.key} x={readX(k) + READ.w / 2} y={READ.axes} size={12} anchor="middle" fill={r.color}>{r.key}</Txt>
          ))}
          {[{ name: 'apple', color: INK.apple, part: PART_APPLE, y: ROW_APPLE }, { name: 'cup', color: INK.cup, part: PART_CUP, y: ROW_CUP }].map((o) => (
            <g key={o.name}>
              <Txt x={READ.label} y={o.y + 5} size={13} fill={o.color} weight={600}>{o.name}</Txt>
              {RULERS.map((r, k) => {
                const started = clamp01(step - k * 4 + 1);
                return (
                  <g key={r.key} opacity={started}>
                    <rect x={readX(k)} y={o.y - 18} width={READ.w} height={36} rx={6} fill={r.color} fillOpacity={0.14} stroke={r.color} strokeOpacity={0.6} />
                    <Txt x={readX(k) + READ.w / 2} y={o.y + 5} size={14} anchor="middle" mono fill={INK.text}>{fmt(readout(o.part, k))}</Txt>
                  </g>
                );
              })}
            </g>
          ))}
          <Txt x={READ.label} y={ROW_CUP + 28} size={12} fill={INK.muted} opacity={clamp01(step - 11)}>forward pass only · no gradients</Txt>
        </g>

        {/* ---- the horizontal map (number line) ---- */}
        <g opacity={map}>
          <Txt x={MAP.x0} y={MAP.line - 36} size={13} fill={INK.hx} weight={600}>horizontal readout · margin = apple − cup</Txt>
          <line x1={MAP.x0} y1={MAP.line} x2={lerp(MAP.x0, MAP.x1, map)} y2={MAP.line} stroke={colors.ink.axis} strokeWidth={2} />
          {[-1, 0, 1, 2].map((c) => (
            <g key={c}>
              <line x1={mapX(c)} y1={MAP.line - 6} x2={mapX(c)} y2={MAP.line + 6} stroke={colors.ink.axis} />
              <Txt x={mapX(c)} y={MAP.line + 22} size={12} anchor="middle" fill={INK.muted}>{fmtPlain(c, 0)}</Txt>
            </g>
          ))}
          <Txt x={MAP.x0 - 14} y={MAP.line + 22} size={12} anchor="end" fill={INK.muted}>left (−)</Txt>
          <Txt x={MAP.x1 + 14} y={MAP.line + 22} size={12} fill={INK.muted}>right (+)</Txt>
          <Cup x={mapX(C_CUP[0])} y={MAP.line} r={11} opacity={clamp01(map * 2 - 1)} />
          <Apple x={mapX(C_APPLE[0])} y={MAP.line} r={11} opacity={clamp01(map * 2 - 1)} />
          <Txt x={mapX(C_CUP[0])} y={MAP.line - 18} size={12} anchor="middle" mono fill={INK.cup}>{fmt(C_CUP[0])}</Txt>
          <Txt x={mapX(C_APPLE[0])} y={MAP.line - 18} size={12} anchor="middle" mono fill={INK.apple}>{fmt(C_APPLE[0])}</Txt>
          {/* margin bracket, equation, decision badge, formula — each on its own row */}
          <Brace x0={mapX(C_CUP[0])} x1={mapX(C_APPLE[0])} y={MAP.line + 46} u={margin} color={INK.hx} opacity={margin} />
          <Txt x={(mapX(C_CUP[0]) + mapX(C_APPLE[0])) / 2} y={MAP.line + 80} size={15} anchor="middle" mono fill={INK.hx} opacity={margin}>
            {`${fmt(C_APPLE[0])} − (${fmt(C_CUP[0])}) = ${fmt(lerp(0, MARGIN_X, margin))}`}
          </Txt>
          <MathLabel tex={'m_x = v_x^{\\top}(h_q - h_r)'} x={MAP.x0} y={MAP.line + 106} fontSize={14} anchor="start" boxWidth={180} color={INK.hx} opacity={margin} />
          <g opacity={badge}>
            <rect x={MAP.x1 - 70} y={MAP.line + 60} width={92} height={30} rx={8} fill={INK.hx} fillOpacity={0.2} stroke={INK.hx} />
            <Txt x={MAP.x1 - 24} y={MAP.line + 80} size={14} anchor="middle" weight={700} fill={INK.hx}>RIGHT</Txt>
            <Txt x={MAP.x1 + 22} y={MAP.line + 106} size={12} anchor="end" fill={INK.muted}>readout, not text</Txt>
          </g>
        </g>

        </g>

        {/* ---- quiet close ---- */}
        <Field x={80} y={300} w={560} h={120} opacity={close}>
          <Txt x={360} y={352} size={25} weight={600} anchor="middle">Fixed directions · continuous readout</Txt>
          <Txt x={360} y={388} size={13} anchor="middle" fill={INK.muted}>image-relative coordinates · model and layer specific · not meters</Txt>
        </Field>
      </Camera>

      {/* screen-fixed overlays */}
      <g>
        <Txt x={70} y={54} size={12} fill={INK.muted} spacing={1.6} weight={600}>CHAPTER 1</Txt>
        <Txt x={164} y={54} size={16} weight={600}>Three rulers inside a token</Txt>
      </g>
      {NOTES.map((note, i) => (
        <Txt key={i} x={1210} y={578} size={12} anchor="end" fill={INK.muted} opacity={0.85 * clamp01(1 - Math.abs(b - i) * 1.6)}>
          {`Source: ${note}`}
        </Txt>
      ))}
    </g>
  );
}

export const vizScene = () => scene;
