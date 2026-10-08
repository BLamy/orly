// More Coverage, Less Learning — PAPER EXPERIMENT
//
// Paper evidence (arXiv 2610.08448v1) — this chapter is the paper's span-MSE
// intervention, NOT a training mode of the released source. The released
// algorithm registry exposes strict and top-k byte-aligned variants only; no
// span-loss file or flag is named here because none exists in the repository.
//   §3.2, equations 7–9: observed token-path probabilities multiply along a
//     mismatch group's path; the span loss squares the difference of their logs;
//     L_λ = L_1:1 + λ·L_span, and every λ > 0 supervises all mismatch groups.
//   Table 11 — Qwen2.5-7B-Instruct → Llama-3.2-3B-Instruct, step 100, full-average
//     accuracy (%) over λ ∈ {0, .25, .5, .75, 1, 1.25, 1.5}:
//     32.86, 32.47, 32.36, 32.47, 31.69, 31.66, 31.84 (non-monotonic; all below λ = 0).
//   §3.2, Tables 11–13 — 3 model pairs, all 18 positive-weight settings lower the full average.
//   Table 6 / §5 — gradient diagnostics at strict-only checkpoints, Qwen→Llama:
//     step 0 cosine 0.030, span/strict norm ratio 0.294; step 100 cosine −0.021, ratio 1.942.
// Source code context (official repository): the same strict tape as chapter 1
//   (kdflow/token_alignment.py `_align_segment_1to1`) supplies the mismatch span.
//
// Machine: the amber ` build` span from chapter 1 feeds a span-probability
// meter (products → log sums → squared difference). One λ dial first fills the
// structural gap, then drives the x position on the measured Table 11 plot.
// Badges and a small gradient schematic sit to the right; the recap miniatures
// retrace tape → comb → dial under a single conclusion. Toy path probabilities
// are labelled illustrative; plot points are the paper's reported values.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Axes } from '../../primitives';
import { scaleLinear } from 'd3';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Small pure helpers (local to this book)
// ---------------------------------------------------------------------------
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const on = (b: number, i: number): number => clamp01(b - (i - 1));
const win = (b: number, i: number, j: number): number => on(b, i) * (1 - clamp01(b - j));

const INK = {
  student: '#38bdf8',
  teacher: colors.SECONDARY,
  strict: colors.POSITIVE,
  mismatch: colors.WARM,
  bad: colors.NEGATIVE,
  text: colors.TEXT,
  muted: colors.MUTED,
  faint: colors.ink.faint,
  panel: colors.PANEL,
  bg: colors.BG,
} as const;

function Txt({
  x, y, children, size = 16, fill = INK.text, opacity = 1, anchor = 'start', mono = false, weight = 400,
}: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string; opacity?: number;
  anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number;
}) {
  if (opacity <= 0.003) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={fill} opacity={opacity} textAnchor={anchor} fontWeight={weight}
      fontFamily={mono ? colors.font.mono : colors.font.ui}>
      {children}
    </text>
  );
}
const monoW = (text: string, size: number): number => text.length * size * 0.62;
function Chip({ x, y, text, color, opacity = 1, size = 17, anchor = 'middle' }: {
  x: number; y: number; text: string; color: string; opacity?: number; size?: number; anchor?: 'start' | 'middle' | 'end';
}) {
  if (opacity <= 0.003) return null;
  const w = monoW(text, size) + 20;
  const h = size + 14;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - h / 2} width={w} height={h} rx={6} fill={INK.panel} fillOpacity={0.92} stroke={color} strokeWidth={1.3} />
      <text x={left + w / 2} y={y + size * 0.36} fontSize={size} textAnchor="middle" fill={color} fontFamily={colors.font.mono}>{text}</text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Data (module scope)
// ---------------------------------------------------------------------------
// The chapter-1 tape (same constructed partition; byte offsets from UTF-8 lengths)
const ENC = new TextEncoder();
const byteLen = (p: string): number => ENC.encode(p).length;
const STUDENT_PIECES = ['We', ' build', ' models', '.'] as const;
const TEACHER_PIECES = ['We', ' bu', 'ild', ' models', '.'] as const;
interface Span { piece: string; start: number; end: number }
const spansOf = (pieces: readonly string[]): Span[] => {
  let c = 0;
  return pieces.map((piece) => { const start = c; c += byteLen(piece); return { piece, start, end: c }; });
};
const S_SPANS = spansOf(STUDENT_PIECES);
const T_SPANS = spansOf(TEACHER_PIECES);
const TOTAL_BYTES = S_SPANS[S_SPANS.length - 1].end; // 16
/** Groups between common boundaries (see chapter 1): [0,2) strict, [2,8) 2:1 mismatch, [8,15), [15,16) strict. */
const GROUPS = [
  { start: 0, end: 2, strict: true },
  { start: 2, end: 8, strict: false },
  { start: 8, end: 15, strict: true },
  { start: 15, end: 16, strict: true },
] as const;
const MISMATCH = GROUPS[1];
const N_GROUPS = GROUPS.length;
const N_STRICT = GROUPS.filter((g) => g.strict).length;

// Illustrative path probabilities (paper eq. 7): student one token, teacher two tokens
const Q_S_TOKENS = [0.25] as const; // ` build`
const Q_T_TOKENS = [0.5, 0.4] as const; // ` bu`, `ild`
const Q_S = Q_S_TOKENS.reduce((a, b) => a * b, 1); // 0.25
const Q_T = Q_T_TOKENS.reduce((a, b) => a * b, 1); // 0.20
const LOG_Q_S = Math.log(Q_S); // −1.3863
const LOG_Q_T_TERMS = Q_T_TOKENS.map((q) => Math.log(q)); // −0.6931, −0.9163
const LOG_Q_T = LOG_Q_T_TERMS.reduce((a, b) => a + b, 0); // −1.6094
const SPAN_DIFF = LOG_Q_S - LOG_Q_T; // 0.2231
const SPAN_MSE = SPAN_DIFF * SPAN_DIFF; // 0.04979

// Paper Table 11 — Qwen2.5-7B-Instruct → Llama-3.2-3B-Instruct, step 100, full average (%)
const LAMBDAS = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5] as const;
const FULL_AVG = [32.86, 32.47, 32.36, 32.47, 31.69, 31.66, 31.84] as const;
const BASELINE = FULL_AVG[0];
const FINAL = FULL_AVG[FULL_AVG.length - 1];
const DELTA_PP = FINAL - BASELINE; // −1.02
// Paper Table 6 — Qwen→Llama, strict-only checkpoints
const GRAD = [
  { step: 0, cos: 0.03, ratio: 0.294 },
  { step: 100, cos: -0.021, ratio: 1.942 },
] as const;
const gradDir = (cos: number): { dx: number; dy: number } => ({ dx: cos, dy: -Math.sqrt(1 - cos * cos) });

/** Piecewise-linear reading of the plotted path at weight λ (display only; points are the data). */
function pathValue(lam: number): number {
  for (let i = 1; i < LAMBDAS.length; i++) {
    if (lam <= LAMBDAS[i]) {
      const u = (lam - LAMBDAS[i - 1]) / (LAMBDAS[i] - LAMBDAS[i - 1]);
      return lerp(FULL_AVG[i - 1], FULL_AVG[i], u);
    }
  }
  return FINAL;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
// tape sits under the source line (y 90) and stays below y 100 through every camera move
const TAPE = { x0: 120, x1: 700, yS: 150, yT: 214, ruler: 182, h: 30 } as const;
const SOURCE_Y = 90;
const PXB = (TAPE.x1 - TAPE.x0) / TOTAL_BYTES;
const tx = (b: number): number => TAPE.x0 + b * PXB;

// span meter (beats 1–3): bars grow right from METER.x0
// meter ends (≈ x 910 for the log-sum label) stay left of the dial's tick labels (x ≥ 938)
const METER = { x0: 300, lin: 520, log: 130, yS: 330, yT1: 400, yT2: 440, yP: 480 } as const;
const linW = (q: number): number => q * METER.lin;
const logW = (logq: number): number => -logq * METER.log;

// λ dial
const DIAL = { cx: 1040, cy: 340, r: 72, max: 1.5 } as const;
const dialAngle = (lam: number): number => Math.PI - (lam / DIAL.max) * Math.PI;
const dialPt = (lam: number, r: number): { x: number; y: number } => ({
  x: DIAL.cx + r * Math.cos(dialAngle(lam)),
  y: DIAL.cy - r * Math.sin(dialAngle(lam)),
});

// measured plot (beats 4–8)
const PLOT = { x0: 210, x1: 740, y0: 495, y1: 270 } as const; // axis labels + source chip end above y 550
const X = scaleLinear().domain([0, 1.5]).range([PLOT.x0, PLOT.x1]);
const Y = scaleLinear().domain([31.2, 33.1]).range([PLOT.y0, PLOT.y1]);

// gradient schematic (beat 8)
const GRAD_PANEL = { x: 780, y: 400, w: 400, h: 145, unit: 40 } as const; // right edge 1180, bottom 545
const BADGE_X = 1060;

// recap miniatures (beat 9)
const RECAP_Y = 330;
const RECAP_COMB_RANKS = [5, 0, 12, 2, 8, 15, 1, 3, 10, 6, 13, 4, 9, 14, 7, 11] as const;
const RECAP_COMB_H = RECAP_COMB_RANKS.map((r) => 60 * Math.exp(-0.36 * r));

// ---------------------------------------------------------------------------
// Narration contract — ten fixed captions, at = 0.6 + 8.2·i, dur 7.2, hold → 83 s
// ---------------------------------------------------------------------------
const CAPTIONS = [
  'What if we supervise the groups that strict matching skips? The paper tests an extra loss on those mismatched spans.',
  'Each side assigns a probability to its observed token path. For several tokens, those probabilities multiply along the path.',
  'Taking logarithms turns the products into sums. The added loss squares the difference between the two span log probabilities.',
  'A weight controls how much this span loss contributes alongside strict supervision. Any positive weight fills every remaining structural gap.',
  'But filling the gaps does not guarantee a better student. The paper measures downstream accuracy while sweeping that weight.',
  'For Qwen to Llama, the full average starts at thirty-two point eight six percent with no added span loss.',
  'Every tested positive weight finishes below that baseline. At a weight of one and a half, the score is thirty-one point eight four percent.',
  'Across all three model pairs, all eighteen positive weight settings lower the full average. That finding applies to this span loss and these experiments.',
  'Gradient measurements suggest a reason: the span signal points weakly alongside the strict signal, while its relative size grows during training.',
  'Follow the response: align matching byte spans, compare shared predictions, then judge added supervision by learning. More coverage alone is not the goal.',
] as const;
const CAPTION_AT = (i: number): number => 0.6 + 8.2 * i;
const CAPTION_DUR = 7.2;
const CHAPTER_DUR = 83;

const SOURCES = [
  'paper §3.2, equation 8 · tape groups from token_alignment.py `_align_segment_1to1`',
  'paper equation 7 — observed token-path probabilities multiply',
  'paper equation 8 — squared difference of span log-probabilities',
  'paper equation 9 — L_λ = L_1:1 + λ·L_span · every λ > 0 supervises all mismatch groups',
  'paper §3.2 · Table 11 — Qwen2.5-7B-Instruct → Llama-3.2-3B-Instruct · step 100',
  'paper Table 11 · λ = 0 is the Strict full baseline, 32.86',
  'paper Table 11 · λ = 1.5 → 31.84 · points are reported values, segments only connect them',
  'paper §3.2 · Tables 11–13 — three pairs, 18 positive-weight settings',
  'paper §5 · Table 6 — strict-only checkpoints, medians over replay units',
  'paper §§2–5 · released source: strict and top-k byte-aligned algorithms',
] as const;

function narrate(tl: Timeline): ChannelRef<number> {
  const beat = tl.channel('beat', -1);
  CAPTIONS.forEach((text, i) => {
    tl.caption({ at: CAPTION_AT(i), dur: CAPTION_DUR, text });
    tl.tween(beat, i, { at: CAPTION_AT(i), dur: 0.6, ease: ease.enter });
  });
  tl.hold(CHAPTER_DUR - 1, 1);
  return beat;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = narrate(tl);
  const tapeU = tl.channel('tapeU', 0); // the chapter-1 tape returns (quiet)
  const spanU = tl.channel('spanU', 0); // amber span emphasis
  const pathS = tl.channel('pathS', 0); // student path meter
  const pathT = tl.channel('pathT', 0); // teacher factor meters
  const lightU = tl.channel('lightU', 0); // light travels the teacher path once
  const prodU = tl.channel('prodU', 0); // product meter
  const logU = tl.channel('logU', 0); // products → log sums (bars morph)
  const diffU = tl.channel('diffU', 0); // difference bracket
  const sqU = tl.channel('sqU', 0); // squared value
  const dialU = tl.channel('dialU', 0); // dial enters
  const lam = tl.channel('lam', 0); // the weight λ (drives gap fill AND plot cursor)
  const meterO = tl.channel('meterO', 1); // meter details → whisper → gone
  const plotU = tl.channel('plotU', 0); // axes draw on
  const baseU = tl.channel('baseU', 0); // baseline line
  const tagsU = tl.channel('tagsU', 0); // final 31.84 / Δ labels
  const badgeU = tl.channel('badgeU', 0); // three badges
  const gradU = tl.channel('gradU', 0); // gradient schematic
  const hideU = tl.channel('hideU', 0); // everything older → 0
  const recapU = tl.channel('recapU', 0); // three miniatures
  const endU = tl.channel('endU', 0); // conclusion

  // BEAT 0 — the skipped span returns
  let t = CAPTION_AT(0);
  tl.tween(tapeU, 1, { at: t + 0.2, dur: 1.4, ease: ease.draw });
  tl.tween(spanU, 1, { at: t + 2.0, dur: 0.8, ease: ease.pop });

  // BEAT 1 — path probabilities multiply
  t = CAPTION_AT(1);
  tl.tween(cam, { x: 600, y: 360, k: 1.1 }, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(pathS, 1, { at: t + 0.6, dur: 1.0, ease: ease.move });
  tl.tween(pathT, 1, { at: t + 1.8, dur: 1.2, ease: ease.move });
  tl.tween(lightU, 1, { at: t + 3.2, dur: 1.6, ease: ease.linear });
  tl.tween(prodU, 1, { at: t + 4.9, dur: 0.8, ease: ease.move });

  // BEAT 2 — logs: products become sums; square the difference
  t = CAPTION_AT(2);
  tl.tween(logU, 1, { at: t + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(diffU, 1, { at: t + 2.6, dur: 0.8, ease: ease.enter });
  tl.tween(sqU, 1, { at: t + 4.0, dur: 0.6, ease: ease.pop });

  // BEAT 3 — the weight fills the gap
  t = CAPTION_AT(3);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(dialU, 1, { at: t + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(lam, 0.25, { at: t + 1.6, dur: 1.2, ease: ease.move });

  // BEAT 4 — same dial, now a plot cursor
  t = CAPTION_AT(4);
  tl.tween(meterO, 0.1, { at: t + 0.1, dur: 0.8, ease: ease.enter });
  tl.tween(meterO, 0, { at: t + 1.1, dur: 0.6, ease: ease.enter });
  tl.tween(lam, 0, { at: t + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(plotU, 1, { at: t + 1.6, dur: 1.6, ease: ease.draw });

  // BEAT 5 — the baseline
  t = CAPTION_AT(5);
  tl.tween(cam, { x: 600, y: 400, k: 1.06 }, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(baseU, 1, { at: t + 0.8, dur: 1.4, ease: ease.draw });

  // BEAT 6 — the sweep
  t = CAPTION_AT(6);
  tl.tween(lam, DIAL.max, { at: t + 0.3, dur: 2.4, ease: ease.linear });
  tl.tween(tagsU, 1, { at: t + 2.8, dur: 0.5, ease: ease.enter }); // 31.84 is on screen before the caption's midpoint

  // BEAT 7 — three pairs, eighteen settings
  t = CAPTION_AT(7);
  tl.tween(cam, CAMERA_HOME, { at: t + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(badgeU, 1, { at: t + 1.2, dur: 1.4, ease: ease.linear });

  // BEAT 8 — gradient schematic
  t = CAPTION_AT(8);
  tl.tween(gradU, 1, { at: t + 0.9, dur: 1.4, ease: ease.draw });

  // BEAT 9 — recap, clean
  t = CAPTION_AT(9);
  tl.tween(hideU, 1, { at: t + 0.1, dur: 0.9, ease: ease.enter });
  tl.tween(recapU, 1, { at: t + 1.0, dur: 1.4, ease: ease.move });
  tl.tween(endU, 1, { at: t + 2.8, dur: 0.6, ease: ease.enter });

  return {
    tl, cam, beat, tapeU, spanU, pathS, pathT, lightU, prodU, logU, diffU, sqU, dialU, lam, meterO,
    plotU, baseU, tagsU, badgeU, gradU, hideU, recapU, endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local renderers
// ---------------------------------------------------------------------------
function TapeChip({ x, w, y, piece, color, opacity = 1, fillOpacity = 0.14, size = 18 }: {
  x: number; w: number; y: number; piece: string; color: string; opacity?: number; fillOpacity?: number; size?: number;
}) {
  if (opacity <= 0.003) return null;
  const lead = piece.startsWith(' ') ? '␣' : '';
  const body = lead ? piece.slice(1) : piece;
  return (
    <g opacity={opacity}>
      <rect x={x + 2} y={y - TAPE.h / 2} width={w - 4} height={TAPE.h} rx={5} fill={color} fillOpacity={fillOpacity} stroke={color} strokeWidth={1.3} />
      <text x={x + w / 2} y={y + size * 0.36} fontSize={size} textAnchor="middle" fontFamily={colors.font.mono} fill={color}>
        {lead && <tspan fill={INK.muted} opacity={0.75}>{lead}</tspan>}
        <tspan>{body}</tspan>
      </text>
    </g>
  );
}

/** The λ dial — a semicircular gauge, needle at the sampled λ. */
function Dial({ lam, opacity, cx = DIAL.cx, cy = DIAL.cy, r = DIAL.r, labels = true }: {
  lam: number; opacity: number; cx?: number; cy?: number; r?: number; labels?: boolean;
}) {
  if (opacity <= 0.003) return null;
  const arc = (a0: number, a1: number, rr: number): string => {
    const p0 = { x: cx + rr * Math.cos(a0), y: cy - rr * Math.sin(a0) };
    const p1 = { x: cx + rr * Math.cos(a1), y: cy - rr * Math.sin(a1) };
    return `M ${p0.x} ${p0.y} A ${rr} ${rr} 0 0 1 ${p1.x} ${p1.y}`;
  };
  const a = dialAngle(lam);
  const needle = { x: cx + (r - 10) * Math.cos(a), y: cy - (r - 10) * Math.sin(a) };
  const ticks = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5];
  return (
    <g opacity={opacity}>
      <path d={arc(Math.PI, 0, r)} fill="none" stroke={colors.ink.axis} strokeWidth={6} />
      {lam > 0.002 && <path d={arc(Math.PI, a, r)} fill="none" stroke={INK.teacher} strokeWidth={6} />}
      {ticks.map((v) => {
        const p0 = { x: cx + (r + 6) * Math.cos(dialAngle(v)), y: cy - (r + 6) * Math.sin(dialAngle(v)) };
        const p1 = { x: cx + (r + 14) * Math.cos(dialAngle(v)), y: cy - (r + 14) * Math.sin(dialAngle(v)) };
        const pl = { x: cx + (r + 30) * Math.cos(dialAngle(v)), y: cy - (r + 30) * Math.sin(dialAngle(v)) };
        return (
          <g key={v}>
            <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={INK.muted} strokeWidth={1.5} />
            {labels && (v === 0 || v === 0.5 || v === 1 || v === 1.5) && (
              <Txt x={pl.x} y={pl.y + 5} size={15} anchor="middle" mono fill={INK.muted}>{String(v)}</Txt>
            )}
          </g>
        );
      })}
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={INK.text} strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill={INK.text} />
      {labels && (
        <Txt x={cx} y={cy + 34} size={22} anchor="middle" mono fill={INK.teacher} weight={600}>{`λ = ${lam.toFixed(2)}`}</Txt>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const tape = s.get(scene.tapeU);
  const span = s.get(scene.spanU);
  const pS = s.get(scene.pathS);
  const pT = s.get(scene.pathT);
  const light = s.get(scene.lightU);
  const prod = s.get(scene.prodU);
  const logu = s.get(scene.logU);
  const diff = s.get(scene.diffU);
  const sq = s.get(scene.sqU);
  const dial = s.get(scene.dialU);
  const lam = s.get(scene.lam);
  const meterO = s.get(scene.meterO);
  const plot = s.get(scene.plotU);
  const base = s.get(scene.baseU);
  const tags = s.get(scene.tagsU);
  const badge = s.get(scene.badgeU);
  const grad = s.get(scene.gradU);
  const hide = s.get(scene.hideU);
  const recap = s.get(scene.recapU);
  const end = s.get(scene.endU);

  const keep = 1 - hide; // older layers vanish entirely before the recap
  const fill = clamp01(lam / 0.25); // any positive weight supervises the mismatch group
  const groupsSupervised = N_STRICT + (lam > 0.002 ? N_GROUPS - N_STRICT : 0);

  // meter geometry — closed-form in logu
  const sW = lerp(linW(Q_S), logW(LOG_Q_S), logu);
  const t1W = lerp(linW(Q_T_TOKENS[0]), logW(LOG_Q_T_TERMS[0]), logu);
  const t2W = lerp(linW(Q_T_TOKENS[1]), logW(LOG_Q_T_TERMS[1]), logu);
  const t2X = lerp(METER.x0, METER.x0 + t1W, logu); // second factor slides end-to-end
  const t2Y = lerp(METER.yT2, METER.yT1, logu);
  const tEnd = METER.x0 + t1W + t2W; // log-sum end
  const sEnd = METER.x0 + sW;
  // light along the teacher path (linear mode only)
  const lightPt = light < 0.5
    ? { x: METER.x0 + linW(Q_T_TOKENS[0]) * (light / 0.5), y: METER.yT1 }
    : { x: METER.x0 + linW(Q_T_TOKENS[1]) * ((light - 0.5) / 0.5), y: METER.yT2 };

  // plot cursor
  const curX = X(lam);
  const curY = Y(pathValue(lam));
  const sweepPts = LAMBDAS.map((l, i) => ({ x: X(l), y: Y(FULL_AVG[i]), seen: lam >= l - 0.001 }));
  const pathD = (() => {
    const pts = sweepPts.filter((p) => p.seen).map((p) => `${p.x},${p.y}`);
    if (lam < DIAL.max - 0.001) pts.push(`${curX},${curY}`);
    return pts.length ? `M ${pts.join(' L ')}` : '';
  })();

  return (
    <g>
      <defs>
        <pattern id="ctk3-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke={INK.mismatch} strokeWidth="3" opacity="0.45" />
        </pattern>
      </defs>
      <Camera {...s.get(scene.cam)}>
        {/* ----------------------------------------- the tape (quiet context; gone entirely once the plot owns the chart area) */}
        <g opacity={clamp01(tape * 3) * keep * (1 - clamp01(plot * 2))}>
          <line x1={TAPE.x0} y1={TAPE.ruler} x2={lerp(TAPE.x0, TAPE.x1, tape)} y2={TAPE.ruler} stroke={colors.ink.axis} strokeWidth={1.5} />
          <Txt x={TAPE.x0 - 10} y={TAPE.yS + 6} size={16} anchor="end" fill={INK.student} weight={600}>student</Txt>
          <Txt x={TAPE.x0 - 10} y={TAPE.yT + 6} size={16} anchor="end" fill={INK.teacher} weight={600}>teacher</Txt>
          {S_SPANS.map((sp, i) => {
            const inMis = sp.start >= MISMATCH.start && sp.end <= MISMATCH.end;
            return <TapeChip key={`s${i}`} x={tx(sp.start)} w={(sp.end - sp.start) * PXB} y={TAPE.yS} piece={sp.piece}
              color={inMis ? (fill > 0.5 ? INK.teacher : INK.mismatch) : INK.student}
              opacity={clamp01(tape * 5 - i) * (inMis ? 1 : 0.45)} fillOpacity={inMis ? lerp(0.16, 0.38, fill) : 0.1} />;
          })}
          {T_SPANS.map((sp, i) => {
            const inMis = sp.start >= MISMATCH.start && sp.end <= MISMATCH.end;
            return <TapeChip key={`t${i}`} x={tx(sp.start)} w={(sp.end - sp.start) * PXB} y={TAPE.yT} piece={sp.piece}
              color={INK.teacher}
              opacity={clamp01(tape * 5 - i) * (inMis ? 1 : 0.45)} fillOpacity={inMis ? lerp(0.16, 0.38, fill) : 0.1} />;
          })}
          {/* group markers on the ruler: strict green dots, the mismatch gap hatched amber → supervised purple */}
          {GROUPS.map((g, i) => {
            const x0 = tx(g.start), x1 = tx(g.end);
            if (g.strict) {
              return (
                <g key={i} opacity={0.6}>
                  <line x1={(x0 + x1) / 2} y1={TAPE.yS + TAPE.h / 2} x2={(x0 + x1) / 2} y2={TAPE.yT - TAPE.h / 2} stroke={INK.strict} strokeWidth={2} />
                  <circle cx={(x0 + x1) / 2} cy={TAPE.ruler} r={5} fill={INK.strict} />
                </g>
              );
            }
            const sc = 1 + 0.08 * Math.sin(Math.PI * span) * (1 - on(b, 1));
            return (
              <g key={i} transform={`translate(${(x0 + x1) / 2}, ${TAPE.ruler}) scale(${sc}) translate(${-(x0 + x1) / 2}, ${-TAPE.ruler})`} opacity={span}>
                <rect x={x0 + 2} y={TAPE.yS + TAPE.h / 2 + 2} width={x1 - x0 - 4} height={TAPE.yT - TAPE.yS - TAPE.h - 4} fill="url(#ctk3-hatch)" opacity={1 - fill} />
                <rect x={x0 + 2} y={TAPE.yS + TAPE.h / 2 + 2} width={x1 - x0 - 4} height={TAPE.yT - TAPE.yS - TAPE.h - 4} fill={INK.teacher} opacity={0.35 * fill} />
                <rect x={x0 + 2} y={TAPE.yS + TAPE.h / 2 + 2} width={x1 - x0 - 4} height={TAPE.yT - TAPE.yS - TAPE.h - 4} fill="none"
                  stroke={fill > 0.5 ? INK.teacher : INK.mismatch} strokeWidth={1.5} strokeDasharray={fill > 0.5 ? undefined : '6 4'} />
              </g>
            );
          })}
          <Txt x={tx(MISMATCH.start)} y={TAPE.yT + TAPE.h / 2 + 24} size={16} fill={fill > 0.5 ? INK.teacher : INK.mismatch} opacity={span}>
            {fill > 0.5 ? 'mismatch group · span-supervised' : 'mismatch group · no strict loss'}
          </Txt>
          <Txt x={tx(MISMATCH.start)} y={TAPE.yT + TAPE.h / 2 + 44} size={16} mono fill={INK.muted} opacity={on(b, 3) * dial}>
            {`supervised ${groupsSupervised}/${N_GROUPS} groups · ${Math.round((groupsSupervised / N_GROUPS) * 100)}% structural (toy tape)`}
          </Txt>
        </g>
        <Chip x={TAPE.x1 + 16} y={TAPE.ruler} text="paper eq. 8 · span log-probability MSE" color={INK.mismatch} size={16} anchor="start" opacity={win(b, 0, 2) * span * keep} />

        {/* ----------------------------------------- span meter (beats 1–3) */}
        <g opacity={meterO * keep}>
          <g opacity={clamp01(pS * 3)}>
            <Txt x={METER.x0 - 16} y={METER.yS + 7} size={20} anchor="end" fill={INK.student} weight={600}>student path</Txt>
            <rect x={METER.x0} y={METER.yS - 14} width={sW * pS} height={28} rx={4} fill={INK.student} opacity={0.8} />
            <Txt x={METER.x0 + sW * pS + 12} y={METER.yS + 7} size={20} mono fill={INK.student} opacity={clamp01(pS * 2 - 1)}>
              {logu < 0.5 ? `q_S = ${Q_S.toFixed(2)}  (␣build)` : `−log q_S = ${(-LOG_Q_S).toFixed(3)}`}
            </Txt>
          </g>
          <g opacity={clamp01(pT * 3)}>
            <Txt x={METER.x0 - 16} y={METER.yT1 + 7} size={20} anchor="end" fill={INK.teacher} weight={600}>teacher path</Txt>
            <rect x={METER.x0} y={METER.yT1 - 14} width={t1W * pT} height={28} rx={4} fill={INK.teacher} opacity={0.8} />
            <rect x={t2X} y={t2Y - 14} width={t2W * pT} height={28} rx={4} fill={INK.teacher} opacity={0.55} />
            <Txt x={METER.x0 + t1W * pT + 12} y={METER.yT1 + 7} size={20} mono fill={INK.teacher} opacity={clamp01(pT * 2 - 1) * (1 - logu)}>
              {`${Q_T_TOKENS[0].toFixed(1)}  (␣bu)`}
            </Txt>
            <Txt x={METER.x0 + t2W * pT + 12} y={METER.yT2 + 7} size={20} mono fill={INK.teacher} opacity={clamp01(pT * 2 - 1) * (1 - logu)}>
              {`${Q_T_TOKENS[1].toFixed(1)}  (ild)`}
            </Txt>
            <Txt x={tEnd + 12} y={METER.yT1 + 7} size={18} mono fill={INK.teacher} opacity={clamp01(logu * 2 - 1)}>
              {`−log q_T = ${(-LOG_Q_T_TERMS[0]).toFixed(3)} + ${(-LOG_Q_T_TERMS[1]).toFixed(3)} = ${(-LOG_Q_T).toFixed(3)}`}
            </Txt>
            {/* one light along the teacher path */}
            {light > 0.003 && light < 0.997 && logu < 0.01 && (
              <circle cx={lightPt.x} cy={lightPt.y} r={9} fill={INK.text} opacity={0.9} />
            )}
          </g>
          <g opacity={prod * (1 - logu)}>
            <Txt x={METER.x0 - 16} y={METER.yP + 7} size={20} anchor="end" fill={INK.teacher} weight={600}>product</Txt>
            <rect x={METER.x0} y={METER.yP - 14} width={linW(Q_T) * prod} height={28} rx={4} fill={INK.teacher} opacity={0.9} />
            <Txt x={METER.x0 + linW(Q_T) + 12} y={METER.yP + 7} size={20} mono fill={INK.teacher}>
              {`q_T = ${Q_T_TOKENS[0].toFixed(1)} × ${Q_T_TOKENS[1].toFixed(1)} = ${Q_T.toFixed(2)}`}
            </Txt>
          </g>
          <Txt x={METER.x0} y={METER.yS - 40} size={16} fill={INK.muted} opacity={clamp01(pS * 3)}>
            {logu < 0.5 ? 'Illustrative path probabilities · bar length = probability of the observed token path' : 'Illustrative path probabilities · bar length = −log q'}
          </Txt>
          <MathLabel tex={'q_T^{(r)}=\\prod_{j\\in S_r^{T}}\\pi_T(v_j\\mid x,v_{<j})'} x={760} y={METER.yP + 62} fontSize={24} boxWidth={520} opacity={win(b, 1, 1) * clamp01(pT * 2)} />
          {/* beat 2 — the difference and its square */}
          <g opacity={diff}>
            <line x1={sEnd} y1={METER.yS + 16} x2={sEnd} y2={METER.yT1 - 16} stroke={INK.text} strokeWidth={1.5} strokeDasharray="4 3" />
            <line x1={tEnd} y1={METER.yS + 16} x2={tEnd} y2={METER.yT1 - 16} stroke={INK.text} strokeWidth={1.5} strokeDasharray="4 3" />
            <line x1={sEnd} y1={(METER.yS + METER.yT1) / 2} x2={tEnd} y2={(METER.yS + METER.yT1) / 2} stroke={INK.mismatch} strokeWidth={3} />
            <Txt x={tEnd + 12} y={(METER.yS + METER.yT1) / 2 + 6} size={18} mono fill={INK.mismatch}>
              {`difference ${SPAN_DIFF.toFixed(4)}`}
            </Txt>
          </g>
          <MathLabel tex={'\\left(\\log q_S^{(r)}-\\log q_T^{(r)}\\right)^2'} x={640} y={METER.yP + 6} fontSize={28} boxWidth={420} opacity={win(b, 2, 3) * diff} />
          <Txt x={870} y={METER.yP + 12} size={28} mono fill={INK.mismatch} weight={600} opacity={sq}>
            {`= ${SPAN_MSE.toFixed(5)}`}
          </Txt>
          <Txt x={METER.x0} y={METER.yP + 54} size={16} fill={INK.muted} opacity={win(b, 2, 3) * sq}>
            observed path likelihoods, not a normalized distribution over all spans · paper uses q_θ for the student
          </Txt>
        </g>

        {/* ----------------------------------------- the λ dial (beats 3–8) */}
        <Dial lam={lam} opacity={dial * keep} />
        <MathLabel tex={'\\mathcal{L}_{\\lambda}=\\mathcal{L}_{1:1}+\\lambda\\,\\mathcal{L}_{\\mathrm{span}}'} x={DIAL.cx} y={DIAL.cy - DIAL.r - 62}
          fontSize={26} boxWidth={340} opacity={dial * keep} />
        <Txt x={DIAL.cx} y={DIAL.cy + 62} size={16} anchor="middle" fill={INK.muted} opacity={win(b, 3, 3) * clamp01(lam * 8)}>
          any λ &gt; 0 supervises every mismatch group
        </Txt>
        <Txt x={DIAL.cx} y={DIAL.cy + 62} size={16} anchor="middle" fill={INK.muted} opacity={win(b, 4, 6) * plot * keep}>
          the dial now sets the plot position
        </Txt>

        {/* ----------------------------------------- the measured plot (beats 4–8) */}
        <g opacity={clamp01(plot * 3) * keep}>
          <Axes x={X} y={Y} reveal={plot} xTicks={6} yTicks={5} fontSize={15} />
          <Txt x={PLOT.x0 - 12} y={PLOT.y1 - 24} size={18} fill={INK.text} weight={600} opacity={clamp01(plot * 2 - 1)}>Full-average accuracy (%)</Txt>
          {/* x-axis title inside the plot's lower-right corner; the Table 11 chip alone owns the row under the axis */}
          <Txt x={PLOT.x1 - 6} y={PLOT.y0 - 12} size={18} anchor="end" fill={INK.text} weight={600} opacity={clamp01(plot * 2 - 1)}>span-MSE weight λ</Txt>
          <Chip x={PLOT.x0} y={PLOT.y0 + 40} text="Paper Table 11 · Qwen→Llama · step 100" color={INK.mismatch} size={15} anchor="start" opacity={clamp01(plot * 2 - 1)} />
          <Txt x={PLOT.x0 + 8} y={PLOT.y1 + 2} size={13} fill={INK.muted} opacity={clamp01(plot * 2 - 1)}>
            full = mean of the Math and Code domain means
          </Txt>
          {/* baseline */}
          <g opacity={base}>
            <line x1={X(0)} y1={Y(BASELINE)} x2={lerp(X(0), X(1.5), base)} y2={Y(BASELINE)} stroke={INK.strict} strokeWidth={2} strokeDasharray="7 5" />
            <Txt x={X(1.5) + 10} y={Y(BASELINE) + 6} size={18} fill={INK.strict} weight={600} opacity={clamp01(base * 2 - 1)}>
              {`Strict full ${BASELINE.toFixed(2)}`}
            </Txt>
            <Txt x={X(0) + 12} y={Y(BASELINE) + 22} size={16} mono fill={INK.strict} opacity={clamp01(base * 2 - 1)}>
              {`λ = 0 · ${BASELINE.toFixed(2)}%`}
            </Txt>
          </g>
          {/* cursor + path + points */}
          <g opacity={on(b, 5)}>
            <line x1={curX} y1={PLOT.y0} x2={curX} y2={PLOT.y1} stroke={INK.teacher} strokeWidth={1.2} strokeDasharray="3 4" opacity={0.7} />
            {pathD && <path d={pathD} fill="none" stroke={INK.teacher} strokeWidth={2.5} strokeLinejoin="round" />}
            {sweepPts.map((p, i) => (
              <g key={i} opacity={p.seen ? 1 : 0}>
                <circle cx={p.x} cy={p.y} r={6.5} fill={i === 0 ? INK.strict : INK.teacher} stroke={INK.bg} strokeWidth={2} />
                {i > 0 && (
                  <Txt x={p.x} y={p.y + (FULL_AVG[i] < FULL_AVG[i - 1] ? 26 : -16)} size={14} anchor="middle" mono fill={INK.muted} opacity={i === LAMBDAS.length - 1 ? 0 : 1}>
                    {FULL_AVG[i].toFixed(2)}
                  </Txt>
                )}
              </g>
            ))}
            {/* endpoint labels step aside while the gradient panel owns the right-hand area (beat 8) */}
            <g opacity={tags * (1 - on(b, 8))}>
              <Txt x={X(1.5) + 10} y={Y(FINAL) + 6} size={18} fill={INK.teacher} weight={600}>{`λ = 1.5 → ${FINAL.toFixed(2)}`}</Txt>
              <Txt x={X(1.5) + 10} y={Y(FINAL) + 30} size={16} mono fill={INK.bad}>{`Δ ${DELTA_PP.toFixed(2)} pp vs baseline`}</Txt>
            </g>
            <Txt x={PLOT.x0 + 8} y={PLOT.y1 + 20} size={13} fill={INK.muted} opacity={tags}>7 reported points · segments only connect them · not monotonic</Txt>
          </g>
        </g>

        {/* ----------------------------------------- badges (beat 7) */}
        <g opacity={keep}>
          {[
            { text: '3 model pairs', color: INK.text },
            { text: '18/18 positive weights lower', color: INK.bad },
            { text: 'span log-probability MSE', color: INK.mismatch },
          ].map((bd, i) => (
            <Chip key={bd.text} x={BADGE_X} y={440 + i * 44} text={bd.text} color={bd.color} size={16}
              opacity={clamp01(badge * 3 - i) * win(b, 7, 7)} />
          ))}
          <Txt x={BADGE_X} y={566} size={14} anchor="middle" fill={INK.muted} opacity={clamp01(badge * 3 - 2) * win(b, 7, 7)}>
            Tables 11–13 · not a verdict on every mismatch objective
          </Txt>
        </g>

        {/* ----------------------------------------- gradient schematic (beat 8) */}
        {grad > 0.003 && (
          <g opacity={on(b, 8) * clamp01(grad * 2) * keep}>
            <rect x={GRAD_PANEL.x} y={GRAD_PANEL.y} width={GRAD_PANEL.w} height={GRAD_PANEL.h} rx={8} fill={INK.panel} fillOpacity={0.9} stroke={colors.ink.axis} />
            {/* two short title lines; two compact columns (arrows at the left edge of each, stats to their right) */}
            <Txt x={GRAD_PANEL.x + 12} y={GRAD_PANEL.y + 18} size={12} mono fill={INK.mismatch}>
              schematic from reported summaries · Table 6
            </Txt>
            <Txt x={GRAD_PANEL.x + 12} y={GRAD_PANEL.y + 34} size={12} mono fill={INK.mismatch}>
              strict-only checkpoints
            </Txt>
            {GRAD.map((g, i) => {
              const ox = GRAD_PANEL.x + 15 + i * 190; // column origin: 795, 985
              const ax = ox + 20; // arrow origin
              const oy = GRAD_PANEL.y + GRAD_PANEL.h - 16;
              const d = gradDir(g.cos);
              const L = g.ratio * GRAD_PANEL.unit * grad;
              const strictL = GRAD_PANEL.unit * grad;
              const endX = ax + d.dx * L;
              const endY = oy + d.dy * L;
              // a tall span vector reaches the stats column (step/cos/ratio text starts at y+58);
              // its label then sits to the LEFT of the endpoint so it never touches those headings
              const labelLeft = endY < GRAD_PANEL.y + 100;
              return (
                <g key={g.step}>
                  <Txt x={ox + 36} y={GRAD_PANEL.y + 58} size={14} mono fill={INK.text}>{`step ${g.step}`}</Txt>
                  <Txt x={ox + 36} y={GRAD_PANEL.y + 76} size={12} mono fill={INK.muted}>{`cos ${g.cos.toFixed(3)}`}</Txt>
                  <Txt x={ox + 36} y={GRAD_PANEL.y + 92} size={12} mono fill={INK.muted}>{`‖span‖/‖strict‖ ${g.ratio.toFixed(3)}`}</Txt>
                  <line x1={ax} y1={oy} x2={ax + strictL} y2={oy} stroke={INK.strict} strokeWidth={3} strokeLinecap="round" />
                  <polygon points={`${ax + strictL},${oy} ${ax + strictL - 9},${oy - 5} ${ax + strictL - 9},${oy + 5}`} fill={INK.strict} />
                  <line x1={ax} y1={oy} x2={endX} y2={endY} stroke={INK.mismatch} strokeWidth={3} strokeLinecap="round" />
                  <circle cx={endX} cy={endY} r={4} fill={INK.mismatch} />
                  <Txt x={ax + strictL + 14} y={oy + 5} size={13} fill={INK.strict}>strict</Txt>
                  <Txt x={labelLeft ? endX - 10 : endX + 10} y={endY + 4} size={13} fill={INK.mismatch} anchor={labelLeft ? 'end' : 'start'}>span</Txt>
                </g>
              );
            })}
          </g>
        )}

        {/* ----------------------------------------- recap (beat 9) */}
        {recap > 0.003 && (
          <g opacity={recap}>
            {/* tape miniature */}
            <g transform={`translate(${300 - 150}, ${RECAP_Y})`}>
              {[0, 2, 8, 15, 16].map((bb, i, arr) => i < arr.length - 1 && (
                <g key={bb}>
                  <rect x={(bb / 16) * 300} y={-24} width={((arr[i + 1] - bb) / 16) * 300 - 3} height={20} rx={3} fill={INK.student} opacity={bb === 2 ? 0.25 : 0.7} />
                  <rect x={(bb / 16) * 300} y={4} width={((arr[i + 1] - bb) / 16) * 300 - 3} height={20} rx={3} fill={INK.teacher} opacity={bb === 2 ? 0.25 : 0.7} />
                  {bb !== 2 && <circle cx={((bb + arr[i + 1]) / 32) * 300} cy={0} r={4} fill={INK.strict} />}
                </g>
              ))}
              <rect x={(2 / 16) * 300} y={-24} width={(6 / 16) * 300 - 3} height={48} fill="url(#ctk3-hatch)" opacity={0.6} />
            </g>
            <Txt x={300} y={RECAP_Y + 62} size={20} anchor="middle" fill={INK.text}>align matching byte spans</Txt>
            {/* comb miniature */}
            <g transform={`translate(${640 - 150}, ${RECAP_Y})`}>
              <line x1={0} y1={0} x2={300} y2={0} stroke={colors.ink.axis} />
              {RECAP_COMB_H.map((h, i) => (
                <g key={i}>
                  <rect x={i * 18.75 + 3} y={-h} width={12} height={h} rx={2} fill={INK.student} opacity={0.85} />
                  <rect x={i * 18.75 + 3} y={2} width={12} height={h * 0.9} rx={2} fill={INK.teacher} opacity={0.85} />
                </g>
              ))}
            </g>
            <Txt x={640} y={RECAP_Y + 62} size={20} anchor="middle" fill={INK.text}>compare sixteen shared predictions</Txt>
            {/* dial miniature */}
            <Dial lam={0} opacity={1} cx={980} cy={RECAP_Y + 10} r={40} labels={false} />
            <Txt x={980} y={RECAP_Y + 62} size={20} anchor="middle" fill={INK.text}>judge added supervision by learning</Txt>
          </g>
        )}
        <Txt x={640} y={500} size={36} anchor="middle" weight={700} opacity={end}>
          Measure learning, not coverage alone
        </Txt>
      </Camera>

      {/* ----------------------------------------- screen-fixed overlays */}
      <Txt x={90} y={65} size={26} weight={600}>More Coverage, Less Learning</Txt>
      <g>
        <rect x={1004} y={44} width={186} height={30} rx={6} fill={INK.mismatch} fillOpacity={0.16} stroke={INK.mismatch} strokeWidth={1.4} />
        <Txt x={1097} y={65} size={16} anchor="middle" mono fill={INK.mismatch} weight={700}>PAPER EXPERIMENT</Txt>
      </g>
      <Txt x={990} y={65} size={14} anchor="end" fill={INK.muted}>span loss is the paper's intervention, not a released training mode</Txt>
      {/* one source note at a time: clean cut at each beat midpoint (no crossfade) */}
      <Txt x={90} y={SOURCE_Y} size={15} fill={INK.muted} mono opacity={0.9}>
        {SOURCES[Math.min(SOURCES.length - 1, Math.max(0, Math.round(b)))]}
      </Txt>
    </g>
  );
}

export const vizScene = () => scene;
