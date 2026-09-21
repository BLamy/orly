// What the evidence supports
//
// Backing (Nandakishor M, arXiv:2510.01237v1, user-supplied four-page PDF; no repository):
//   p.3 Table I  — F1: baseline 0.61, SelfCheckGPT 0.76, RAG Always 0.80, proposed 0.82;
//                  relative cost 1.0 / 4.2 / 2.8 / 1.6; proposed false-positive rate 0.09.
//   p.3 Table II — ablation F1: semantic 0.76, convergence 0.69, learned 0.72, combined 0.82.
//   p.2–3        — SmolLM2-360M-Instruct; 72 confidence-training examples
//                  (33 high, 27 low, 12 medium); 30 epochs.
//   p.3–4        — benchmarks named: Natural Questions, TriviaQA, HotpotQA. Evaluation
//                  sizes, per-benchmark results and uncertainty intervals are NOT given;
//                  limitations: reference-model bias, fixed thresholds, larger-model transfer.
//
// Every bar is an author-reported number (tagged 'Paper-reported'); nothing here was
// reproduced, so there are no error bars and no synthetic confusion matrix. Costs are the
// paper's RELATIVE units (baseline = 1×), not dollars; the two percentages in beat 5 are
// computed from those units at module scope. The 72 dots are the confidence-TRAINING set,
// never the evaluation sample. The recap bead scores (beat 9) are illustrative.
//
// Machine: one persistent four-bar chart — F1 → ablation → relative cost — whose bars then
// fold into the 72-example grid.
import {
  Camera,
  MathLabel,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import {
  ActivationRibbon,
  InstrumentGlyphs,
  LAYERS,
  Label,
  Note,
  ROUTES,
  RouteRail,
  Tag,
  clamp01,
  lerp,
  railGeom,
  routeIndex,
  seg,
} from './shared/machines';

const { ACCENT, SECONDARY, WARM, NEGATIVE, TEAL, MUTED, TEXT, PANEL, font, ink } = colors;

export const CAPTIONS = [
  'The paper reports an improvement in the F one score, from zero point six one for its baseline to zero point eight two for the combined method.',
  'Using all three clues also outperforms each clue alone in its ablation table. Semantic alignment is the strongest individual signal there.',
  'Those are reported results, not a guarantee. The proposed method still has a nonzero false-positive rate of zero point zero nine.',
  'The cost comparison needs a named baseline. The reported relative costs are one point six for this method and two point eight for always using retrieval.',
  'That is about forty-three percent lower than always using retrieval, but sixty percent higher than the basic baseline.',
  'The experiment uses a three-hundred-sixty-million-parameter model. Its confidence-training set contains just seventy-two examples.',
  'The paper names three question-answering benchmarks, but does not give their evaluation sizes, per-benchmark breakdowns, or uncertainty intervals.',
  'Reference-model bias, fixed thresholds, and transfer to larger models remain limitations. Confidence needs testing where the system will actually run.',
  "The useful idea is concrete: inspect the question's internal signals, and spend more help where confidence is low. The evidence for reliability still has to follow.",
] as const;

// ---------------------------------------------------------------------------
// Paper-reported numbers (module scope; nothing else is plotted)
// ---------------------------------------------------------------------------

export const F1 = [0.61, 0.76, 0.8, 0.82];
export const ABLATION_F1 = [0.76, 0.69, 0.72, 0.82];
export const REL_COST = [1.0, 4.2, 2.8, 1.6];
export const FALSE_POSITIVE = 0.09;
const METHODS = ['Baseline', 'SelfCheckGPT', 'Always RAG', 'Proposed'];
const SIGNALS = ['Semantic', 'Convergence', 'Learned', 'Combined'];

// beat 5 — percentages computed from the relative costs, not asserted
export const PCT_BELOW_RAG = Math.round(((REL_COST[2] - REL_COST[3]) / REL_COST[2]) * 100); // 43
export const PCT_ABOVE_BASE = Math.round(((REL_COST[3] - REL_COST[0]) / REL_COST[0]) * 100); // 60

const GROUPS = [
  { n: 33, name: 'high confidence', color: TEAL },
  { n: 27, name: 'low confidence', color: NEGATIVE },
  { n: 12, name: 'medium confidence', color: WARM },
];
export const N_TRAIN = GROUPS.reduce((a, b) => a + b.n, 0); // 72

const BENCHMARKS = ['Natural Questions', 'TriviaQA', 'HotpotQA'];
const MISSING = ['evaluation size', 'per-benchmark result', 'uncertainty interval'];
const LIMITS = ['reference-model bias', 'fixed thresholds', 'transfer to larger models'];

// ---------------------------------------------------------------------------
// Layout. Captions own y ≥ 633.
// ---------------------------------------------------------------------------

const CH = { x0: 200, x1: 900, base: 480, top: 130, barW: 96 };
const BAR_CX = [290, 470, 650, 830];
const H = CH.base - CH.top;
const UNIT_TICKS = [0, 0.25, 0.5, 0.75, 1];
const COST_TICKS = [0, 1, 2, 3, 4];
const SIDE_X = 960;

// 72 dots: start stacked inside the four bars, end in three labeled blocks
const PITCH = 24;
const BLOCK_X = [250, 480, 710];
const BLOCK_Y = 236;
const DOTS = (() => {
  const out: { from: { x: number; y: number }; to: { x: number; y: number }; color: string; i: number }[] = [];
  let i = 0;
  GROUPS.forEach((grp, b) => {
    for (let k = 0; k < grp.n; k++, i++) {
      const bar = i % 4;
      const level = Math.floor(i / 4);
      out.push({
        i,
        color: grp.color,
        from: { x: BAR_CX[bar] - 12 + (level % 2) * 24, y: CH.base - 16 - Math.floor(level / 2) * 22 },
        to: { x: BLOCK_X[b] + (k % 6) * PITCH + PITCH / 2, y: BLOCK_Y + Math.floor(k / 6) * PITCH + PITCH / 2 },
      });
    }
  });
  return out;
})();
const SCOPE = { x: 222, y: 168, w: 670, h: 268 };
const TABLE = { x: 250, y: 458, cols: [580, 750, 920], rowH: 38 };

// recap
const RIB = { x: 110, y: 300, w: 300, h: 70 };
const GLYPH = { x: 500, y: 217 };
const RAIL = railGeom(770, 290, 420, 130);
const RECAP_FROM = 0.85;
const RECAP_TO = 0.45;

// ---------------------------------------------------------------------------
// Timeline — nine fixed captions, ≈ 87 authored seconds.
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 550, y: 315, k: 1.2 }, cameraInterp);
  const n = (k: string, v = 0) => tl.channel(k, v);
  const to = (ch: ChannelRef<number>, v: number, at: number, dur = 0.7, e = ease.enter) =>
    tl.tween(ch, v, { at, dur, ease: e });
  const look = (c: CameraState, at: number, dur = 1.5) => tl.tween(cam, c, { at, dur, ease: ease.move });
  const B = (i: number) => 0.5 + 9.6 * (i - 1);
  const DUR = 8.4;

  const axesU = n('axesU');
  const chartO = n('chartO', 1);
  const vals = tl.channel<number[]>('vals', [0, 0, 0, 0]);
  const emph = tl.channel<number[]>('emph', [1, 1, 1, 1]);
  const axisMax = n('axisMax', 1);
  const costU = n('costU');
  const ablU = n('ablU');
  const fpO = n('fpO');
  const fpU = n('fpU');
  const cmpA = n('cmpA');
  const cmpB = n('cmpB');
  const foldU = n('foldU');
  const dotsO = n('dotsO');
  const gridLbl = n('gridLbl');
  const tableU = n('tableU');
  const tableO = n('tableO', 1);
  const scopeU = n('scopeU');
  const limitsU = n('limitsU');
  const recapO = n('recapO');
  const recapLit = n('recapLit');
  const glyphU = n('glyphU');
  const railU = n('railU');
  const beadO = n('beadO');
  const score = n('score', RECAP_FROM);
  const pktU = n('pktU', -1);

  CAPTIONS.forEach((text, i) => tl.caption({ at: B(i + 1), dur: DUR, text }));

  // 1 — four paper-reported F1 bars rise on a fixed 0…1 axis
  to(axesU, 1, 0.6, 1.4, ease.draw);
  tl.tween(vals, F1, { at: 1.8, dur: 1.6, ease: ease.move });
  tl.tween(emph, [1, 0.35, 0.35, 1], { at: 5.0, dur: 0.8, ease: ease.enter });
  tl.hold(B(1) + DUR, 1.2);

  // 2 — the SAME bars morph into the ablation table; the combined bar does not move
  tl.tween(emph, [1, 1, 1, 1], { at: B(2), dur: 0.6, ease: ease.enter });
  to(ablU, 1, B(2) + 0.4, 1.0);
  tl.tween(vals, ABLATION_F1, { at: B(2) + 0.6, dur: 1.5, ease: ease.move });
  tl.tween(emph, [1, 0.35, 0.35, 0.35], { at: B(2) + 5.0, dur: 0.8, ease: ease.enter });
  tl.hold(B(2) + DUR, 1.2);

  // 3 — keep the combined bar; a separate small metric: false-positive rate 0.09
  tl.tween(emph, [0.15, 0.15, 0.15, 1], { at: B(3), dur: 0.8, ease: ease.enter });
  look({ x: 700, y: 315, k: 1.15 }, B(3));
  to(fpO, 1, B(3) + 1.6);
  to(fpU, 1, B(3) + 2.2, 1.2, ease.move);
  tl.hold(B(3) + DUR, 1.2);

  // 4 — morph to relative cost: the axis rescales to 0…4.5, method labels return
  to(fpO, 0, B(4), 0.5);
  look({ x: 560, y: 315, k: 1.2 }, B(4));
  tl.tween(emph, [1, 1, 1, 1], { at: B(4), dur: 0.6, ease: ease.enter });
  to(ablU, 0, B(4) + 0.4, 1.0);
  to(costU, 1, B(4) + 0.6, 1.5, ease.move);
  to(axisMax, 4.5, B(4) + 0.6, 1.5, ease.move);
  tl.tween(vals, REL_COST, { at: B(4) + 0.6, dur: 1.5, ease: ease.move });
  tl.tween(emph, [0.35, 0.35, 1, 1], { at: B(4) + 4.6, dur: 0.8, ease: ease.enter });
  tl.hold(B(4) + DUR, 1.2);

  // 5 — two comparisons, one at a time: vs always-RAG, then vs the baseline
  look({ x: 680, y: 315, k: 1.15 }, B(5));
  tl.tween(emph, [0.15, 0.15, 1, 1], { at: B(5), dur: 0.6, ease: ease.enter });
  to(cmpA, 1, B(5) + 0.8, 1.0, ease.draw);
  to(cmpA, 0.15, B(5) + 4.4, 0.6);
  tl.tween(emph, [1, 0.15, 0.15, 1], { at: B(5) + 4.4, dur: 0.8, ease: ease.enter });
  to(cmpB, 1, B(5) + 5.0, 1.0, ease.draw);
  tl.hold(B(5) + DUR, 1.2);

  // 6 — the bars fold into the 72-example training grid (33 / 27 / 12)
  to(cmpA, 0, B(6), 0.5);
  to(cmpB, 0, B(6), 0.5);
  look({ x: 570, y: 320, k: 1.3 }, B(6));
  to(dotsO, 1, B(6) + 0.4);
  to(chartO, 0, B(6) + 0.8, 1.0);
  to(foldU, 1, B(6) + 1.2, 2.6, ease.move);
  to(gridLbl, 1, B(6) + 3.8);
  tl.hold(B(6) + DUR, 1.2);

  // 7 — three named benchmarks, nine blank fields
  to(dotsO, 0.3, B(7));
  to(gridLbl, 0.3, B(7));
  look({ x: 625, y: 470, k: 1.35 }, B(7));
  to(tableU, 1, B(7) + 1.2, 3.0, ease.linear);
  tl.hold(B(7) + DUR, 1.2);

  // 8 — the grid stays faint inside a scope boundary; three limitations sit outside it
  to(tableO, 0, B(8), 0.6);
  to(dotsO, 0.15, B(8));
  to(gridLbl, 0, B(8));
  look({ x: 660, y: 300, k: 1.2 }, B(8));
  to(scopeU, 1, B(8) + 1.0, 1.4, ease.draw);
  to(limitsU, 1, B(8) + 2.6, 2.4, ease.linear);
  tl.hold(B(8) + DUR, 1.2);

  // 9 — the chart is gone entirely: ribbon → three instruments → four-route rail
  to(dotsO, 0, B(9), 0.6);
  to(scopeU, 0, B(9), 0.6);
  to(limitsU, 0, B(9), 0.6);
  look({ x: 650, y: 335, k: 1.12 }, B(9));
  to(recapO, 1, B(9) + 0.8);
  to(recapLit, LAYERS, B(9) + 1.0, 1.6, ease.linear);
  to(glyphU, 1, B(9) + 2.4, 1.8, ease.linear);
  to(railU, 1, B(9) + 3.6, 1.2, ease.draw);
  to(beadO, 1, B(9) + 4.6);
  to(score, RECAP_TO, B(9) + 5.2, 1.4, ease.move);
  tl.set(pktU, 0, B(9) + 6.8);
  to(pktU, 1, B(9) + 6.8, 1.4, ease.linear);
  tl.hold(B(9) + DUR, 1.6);

  return {
    tl, cam, axesU, chartO, vals, emph, axisMax, costU, ablU, fpO, fpU, cmpA, cmpB, foldU, dotsO,
    gridLbl, tableU, tableO, scopeU, limitsU, recapO, recapLit, glyphU, railU, beadO, score, pktU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state
// ---------------------------------------------------------------------------

function CostCompare({ a, b, o, x, tex, note }: { a: number; b: number; o: number; x: number; tex: string; note: string }) {
  if (o <= 0) return null;
  const ya = CH.base - (REL_COST[a] / 4.5) * H;
  const yb = CH.base - (REL_COST[b] / 4.5) * H;
  return (
    <g opacity={o}>
      <line x1={BAR_CX[a]} y1={ya} x2={x + 14} y2={ya} stroke={TEXT} strokeWidth={1} strokeDasharray="4 4" />
      <line x1={x - 14} y1={yb} x2={BAR_CX[b]} y2={yb} stroke={TEXT} strokeWidth={1} strokeDasharray="4 4" />
      <line x1={x} y1={ya} x2={x} y2={yb} stroke={WARM} strokeWidth={2} />
      <path d={`M${x - 5},${yb + (ya < yb ? -7 : 7)} L${x},${yb} L${x + 5},${yb + (ya < yb ? -7 : 7)}`} fill="none" stroke={WARM} strokeWidth={2} />
      <MathLabel tex={tex} x={SIDE_X} y={ya < yb ? 250 : 380} fontSize={18} anchor="start" boxWidth={300} />
      <Label x={SIDE_X} y={(ya < yb ? 250 : 380) + 36} text={note} size={12} color={WARM} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>) => s.get(ch);
  const vals = g(scene.vals);
  const emph = g(scene.emph);
  const axisMax = g(scene.axisMax);
  const costU = g(scene.costU);
  const ablU = g(scene.ablU);
  const axesU = g(scene.axesU);
  const chartO = g(scene.chartO);
  const foldU = g(scene.foldU);
  const dotsO = g(scene.dotsO);
  const gridLbl = g(scene.gridLbl);
  const tableU = g(scene.tableU);
  const scopeU = g(scene.scopeU);
  const limitsU = g(scene.limitsU);
  const recapO = g(scene.recapO);
  const score = g(scene.score);
  const pktU = g(scene.pktU);
  const yOf = (v: number) => CH.base - (v / axisMax) * H;
  const isCost = costU > 0.5;

  return (
    <g>
      <Camera {...g(scene.cam)}>
        {/* the persistent chart */}
        {chartO > 0 ? (
          <g opacity={chartO}>
            <line x1={CH.x0} y1={CH.base} x2={lerp(CH.x0, CH.x1, axesU)} y2={CH.base} stroke={ink.axis} strokeWidth={1.4} />
            <line x1={CH.x0} y1={CH.base} x2={CH.x0} y2={lerp(CH.base, CH.top - 10, axesU)} stroke={ink.axis} strokeWidth={1.4} />
            {[{ ticks: UNIT_TICKS, o: 1 - costU }, { ticks: COST_TICKS, o: costU }].map((set, k) =>
              set.ticks.map((v) => {
                const y = yOf(v);
                if (y < CH.top - 12 || set.o <= 0) return null;
                return (
                  <g key={`${k}-${v}`} opacity={set.o * axesU}>
                    <line x1={CH.x0} y1={y} x2={CH.x1} y2={y} stroke={ink.grid} strokeWidth={1} />
                    <Label x={CH.x0 - 10} y={y + 4} text={k === 1 ? `${v}×` : v.toFixed(2)} anchor="end" size={11} />
                  </g>
                );
              }),
            )}
            {/* metric title crossfade: F1 → ablation F1 → relative cost */}
            <Note x={CH.x0} y={CH.top - 38} text="F1 score" size={18} weight={600} o={axesU * (1 - ablU) * (1 - costU)} />
            <Note x={CH.x0} y={CH.top - 38} text="F1 score · ablation, one signal at a time" size={18} weight={600} o={ablU * (1 - costU)} />
            <Note x={CH.x0} y={CH.top - 38} text="Relative cost · baseline = 1×" size={18} weight={600} o={costU} />
            <Tag x={CH.x1} y={CH.top - 38} text="Paper-reported" anchor="end" size={11} o={axesU} />
            <Label x={CH.x1} y={CH.top - 16} text={isCost ? 'Table I · relative units, not dollars' : ablU > 0.5 ? 'Table II' : 'Table I'}
              anchor="end" size={10} o={axesU} />

            {BAR_CX.map((cx, i) => {
              const h = Math.max(0, (vals[i] / axisMax) * H);
              const hero = i === 3;
              return (
                <g key={i} opacity={emph[i]}>
                  <rect x={cx - CH.barW / 2} y={CH.base - h} width={CH.barW} height={h} rx={4}
                    fill={hero ? WARM : SECONDARY} fillOpacity={hero ? 0.9 : 0.55} />
                  <text x={cx} y={CH.base - h - 10} fill={TEXT} fontFamily={font.mono} fontSize={15} textAnchor="middle"
                    opacity={clamp01(h / 40)}>
                    {isCost ? `${vals[i].toFixed(1)}×` : vals[i].toFixed(2)}
                  </text>
                  <Note x={cx} y={CH.base + 24} text={METHODS[i]} anchor="middle" size={13} color={hero ? TEXT : MUTED} o={axesU * (1 - ablU)} />
                  <Note x={cx} y={CH.base + 24} text={SIGNALS[i]} anchor="middle" size={13} color={hero ? TEXT : MUTED} o={ablU} />
                </g>
              );
            })}

            {/* beat 3 — one separate reported metric; no synthetic confusion matrix */}
            <g opacity={g(scene.fpO)}>
              <Note x={SIDE_X} y={236} text="false-positive rate" size={15} color={MUTED} />
              <text x={SIDE_X} y={288} fill={NEGATIVE} fontFamily={font.mono} fontSize={44}>{FALSE_POSITIVE.toFixed(2)}</text>
              <rect x={SIDE_X} y={312} width={260} height={8} rx={4} fill={ink.faint} />
              <rect x={SIDE_X} y={312} width={260 * FALSE_POSITIVE * g(scene.fpU)} height={8} rx={4} fill={NEGATIVE} />
              <Label x={SIDE_X} y={338} text="0" size={10} />
              <Label x={SIDE_X + 260} y={338} text="1" size={10} anchor="end" />
              <Label x={SIDE_X} y={366} text="proposed method · nonzero" size={11} color={TEXT} />
              <Tag x={SIDE_X} y={396} text="Paper-reported" size={10} />
            </g>

            {/* beat 5 — percentages derived from the reported relative costs */}
            <CostCompare a={2} b={3} o={g(scene.cmpA)} x={740}
              tex={`\\dfrac{2.8-1.6}{2.8}\\approx ${PCT_BELOW_RAG}\\%`} note="lower than always-RAG" />
            <CostCompare a={0} b={3} o={g(scene.cmpB)} x={560}
              tex={`\\dfrac{1.6-1.0}{1.0}= ${PCT_ABOVE_BASE}\\%`} note="higher than the baseline" />
          </g>
        ) : null}

        {/* beat 6 — 72 training examples, folded out of the bars */}
        {dotsO > 0 ? (
          <g opacity={dotsO}>
            {DOTS.map((d) => {
              const u = seg(foldU, 0.3 * (d.i / N_TRAIN), 0.7 + 0.3 * (d.i / N_TRAIN));
              const e = u * u * (3 - 2 * u);
              return <circle key={d.i} cx={lerp(d.from.x, d.to.x, e)} cy={lerp(d.from.y, d.to.y, e)} r={7.5} fill={d.color} fillOpacity={0.9} />;
            })}
          </g>
        ) : null}
        <g opacity={gridLbl}>
          <Note x={BLOCK_X[0]} y={196} text={`${N_TRAIN} confidence-training examples`} size={18} weight={600} />
          <Tag x={BLOCK_X[2] + 6 * PITCH} y={196} text="Paper-reported" anchor="end" size={11} />
          {GROUPS.map((grp, b) => (
            <Label key={grp.name} x={BLOCK_X[b]} y={BLOCK_Y + 6 * PITCH + 20} text={`${grp.n} ${grp.name}`} size={12} color={grp.color} />
          ))}
          <Label x={BLOCK_X[0]} y={BLOCK_Y + 6 * PITCH + 44} text="local model: SmolLM2-360M-Instruct · training set, not the evaluation sample"
            size={11} color={TEXT} />
        </g>

        {/* beat 7 — named benchmarks, blank fields */}
        {tableU > 0 ? (
          <g opacity={g(scene.tableO)}>
            {MISSING.map((m, c) => (
              <Label key={m} x={TABLE.cols[c]} y={TABLE.y} text={m} anchor="middle" size={11} o={seg(tableU, 0, 0.15)} />
            ))}
            {BENCHMARKS.map((name, r) => {
              const y = TABLE.y + 34 + r * TABLE.rowH;
              return (
                <g key={name} opacity={seg(tableU, r * 0.25, r * 0.25 + 0.2)}>
                  <Note x={TABLE.x} y={y + 5} text={name} size={15} />
                  {TABLE.cols.map((cx, c) => (
                    <g key={c} opacity={seg(tableU, r * 0.25 + 0.1 + c * 0.08, r * 0.25 + 0.3 + c * 0.08)}>
                      <rect x={cx - 66} y={y - 13} width={132} height={26} rx={5} fill="none" stroke={MUTED} strokeOpacity={0.7} strokeDasharray="4 4" />
                      <Label x={cx} y={y + 4} text="— not reported" anchor="middle" size={10} />
                    </g>
                  ))}
                </g>
              );
            })}
          </g>
        ) : null}

        {/* beat 8 — scope boundary with three limitations outside it */}
        {scopeU > 0 ? (
          <g>
            <rect x={SCOPE.x} y={SCOPE.y} width={SCOPE.w} height={SCOPE.h} rx={14} fill="none" stroke={TEXT} strokeWidth={1.6}
              strokeDasharray="8 6" opacity={0.9 * clamp01(scopeU)} />
            <Label x={SCOPE.x + 16} y={SCOPE.y + 26} text="what the paper tested: one 360M model · 72 training examples" size={12}
              color={TEXT} o={seg(scopeU, 0.6, 1)} />
            {LIMITS.map((lim, i) => {
              const u = seg(limitsU, i / 3, (i + 0.6) / 3) * clamp01(scopeU);
              const y = 236 + i * 64;
              return (
                <g key={lim} opacity={u}>
                  <line x1={SCOPE.x + SCOPE.w} y1={y} x2={SCOPE.x + SCOPE.w + 34} y2={y} stroke={MUTED} strokeWidth={1.2} />
                  <circle cx={SCOPE.x + SCOPE.w + 34} cy={y} r={3} fill={MUTED} />
                  <Note x={SCOPE.x + SCOPE.w + 46} y={y + 5} text={lim} size={15} />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* beat 9 — recap machine; the chart is fully gone */}
        {recapO > 0 ? (
          <g opacity={recapO}>
            <ActivationRibbon {...RIB} lit={g(scene.recapLit)} color={ACCENT} />
            <Label x={RIB.x} y={RIB.y + RIB.h + 26} text="the question's internal signals" size={11} />
            {[0, 1, 2].map((i) => {
              const gy = GLYPH.y + i * 86 + 32;
              const u = seg(g(scene.glyphU), i / 3, (i + 1) / 3);
              return (
                <g key={i} opacity={0.2 + 0.6 * u}>
                  <path d={`M${RIB.x + RIB.w + 8},${RIB.y + RIB.h / 2} C${460},${RIB.y + RIB.h / 2} ${450},${gy} ${GLYPH.x},${gy}`}
                    fill="none" stroke={MUTED} strokeWidth={1.3} />
                  <path d={`M${GLYPH.x + 128},${gy} C${690},${gy} ${680},${RAIL.y} ${RAIL.x - 8},${RAIL.y}`}
                    fill="none" stroke={MUTED} strokeWidth={1.3} opacity={g(scene.railU)} />
                </g>
              );
            })}
            <InstrumentGlyphs x={GLYPH.x} y={GLYPH.y} u={g(scene.glyphU)} />
            <RouteRail geom={RAIL} reveal={g(scene.railU)} trackU={seg(g(scene.railU), 0.4, 1)} score={score} beadO={g(scene.beadO)}
              whisper={1} size={10} stationLabels beadLabel={`C = ${score.toFixed(2)}`} />
            <Tag x={RAIL.x + RAIL.w} y={RAIL.y - 52} text="Illustrative score" anchor="end" size={10} o={g(scene.beadO)} />
            <Label x={RAIL.x + RAIL.w} y={RAIL.y + RAIL.trackH + 50} text="lower confidence → more help" anchor="end" size={11}
              color={TEXT} o={g(scene.beadO)} />
            {pktU >= 0 ? (() => {
              const p = RAIL.tracks[routeIndex(score)].point(clamp01(pktU));
              return <circle cx={p.x} cy={p.y} r={5} fill={WARM} />;
            })() : null}
          </g>
        ) : null}
      </Camera>
    </g>
  );
}

export const vizScene = () => scene;
