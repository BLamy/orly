// Proving Training Data — chapter 4: A Score Must Track Reality.
//
// Grounded in src/distflow/benchmark.py, examples/run_benchmark.py,
// simple-evaluation/extract_score.py, and the paper abstract for arXiv
// 2607.20465. DataQualityEvaluatorBenchmark pairs each metric value with the
// matching downstream accuracy and returns Pearson/Spearman correlations plus
// a linear fit. The paper reports DAS as strongest cross-model in four of six
// domains and the only metric above r=0.70 in Math, Science, and Medical.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const PAIRS = [
  { label: 'dataflow', x: 730, y: 486, c: colors.ACCENT },
  { label: 'infinity-instruct', x: 815, y: 414, c: colors.SECONDARY },
  { label: 'openr1', x: 902, y: 354, c: colors.WARM },
  { label: 'candidate pool', x: 987, y: 270, c: colors.POSITIVE },
];
const DOMAINS = ['math', 'general', 'science', 'business', 'medicine', 'law'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const hypothesisU = tl.channel('hypothesisU', 0);
  const metricU = tl.channel('metricU', 0);
  const pairsU = tl.channel('pairsU', 0);
  const pearsonU = tl.channel('pearsonU', 0);
  const spearmanU = tl.channel('spearmanU', 0);
  const fitU = tl.channel('fitU', 0);
  const domainsU = tl.channel('domainsU', 0);
  const resultU = tl.channel('resultU', 0);
  const recapU = tl.channel('recapU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.7, text: 'A data-quality score is only a hypothesis. It becomes useful when high scores reliably travel with high downstream accuracy.' });
  tl.tween(hypothesisU, 1, { at: 0.9, dur: 1.3, ease: ease.enter });
  tl.tween(cam, { x: 410, y: 330, k: 1.16 }, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.hold(6.2, 0.5);

  tl.caption({ at: 6.7, dur: 5.5, text: 'The evaluator asks each metric to score every named dataset, one candidate pool at a time.' });
  tl.tween(metricU, 1, { at: 7.2, dur: 1.4, ease: ease.draw });
  tl.hold(12.2, 0.5);

  tl.caption({ at: 12.7, dur: 5.7, text: 'Each metric value is matched to the downstream accuracy stored under the same dataset name. The pair is the unit of evidence.' });
  tl.tween(pairsU, 1, { at: 13.2, dur: 1.8, ease: ease.move });
  tl.tween(cam, { x: 700, y: 340, k: 1.04 }, { at: 13.4, dur: 1.3, ease: ease.move });
  tl.hold(18.4, 0.5);

  tl.caption({ at: 18.9, dur: 5.4, text: 'Pearson correlation asks whether the points follow a straight-line relationship.' });
  tl.tween(pearsonU, 1, { at: 19.4, dur: 0.7, ease: ease.enter });
  tl.hold(24.3, 0.5);

  tl.caption({ at: 24.8, dur: 5.4, text: 'Spearman correlation ignores spacing and asks whether the ranking order agrees.' });
  tl.tween(spearmanU, 1, { at: 25.3, dur: 0.7, ease: ease.enter });
  tl.hold(30.2, 0.5);

  tl.caption({ at: 30.7, dur: 5.5, text: 'A linear fit adds slope and intercept, turning the cloud of pairs into a compact calibration story.' });
  tl.tween(fitU, 1, { at: 31.2, dur: 1.5, ease: ease.draw });
  tl.hold(36.2, 0.5);

  tl.caption({ at: 36.7, dur: 5.8, text: 'Across the six domains, the paper reports Distributional Alignment Score as the strongest cross-model correlation in four.' });
  tl.tween(domainsU, 1, { at: 37.2, dur: 1.5, ease: ease.enter });
  tl.tween(resultU, 1, { at: 39.2, dur: 0.7, ease: ease.pop });
  tl.hold(42.5, 0.5);

  tl.caption({ at: 43.0, dur: 5.9, text: 'It is also the only metric above point seven correlation in math, science, and medical data at the same time.' });
  tl.hold(48.9, 0.5);

  tl.caption({ at: 49.4, dur: 5.8, text: 'The whole journey now closes: construct the candidate, train on it, measure its distribution, and compare the prediction with reality.' });
  tl.tween(recapU, 1, { at: 49.9, dur: 2.1, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 52.0, dur: 1.3, ease: ease.move });
  tl.hold(55.2, 0.5);

  tl.caption({ at: 55.7, dur: 6.3, text: 'Data Prep Bench makes every preparation method answer to the same thing: what the trained model can actually do.' });
  tl.tween(dimU, 1, { at: 56.2, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 57.1, dur: 0.7, ease: ease.enter });
  tl.hold(62.0, 1.0);

  return { tl, cam, hypothesisU, metricU, pairsU, pearsonU, spearmanU, fitU, domainsU, resultU, recapU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);
  const pairsU = s.get(scene.pairsU);
  const fitU = s.get(scene.fitU);
  const recapU = s.get(scene.recapU);
  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={700}>A score must track reality</text>
          <text x={640} y={84} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>metrics.score(dataset) ↔ accuracys[dataset.name]</text>

          <g opacity={s.get(scene.hypothesisU)}>
            <rect x={98} y={152} width={352} height={386} rx={18} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={126} y={188} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>metrics_results_mapping</text>
            {PAIRS.map((p, i) => {
              const y = 234 + i * 70;
              const u = clamp01(s.get(scene.metricU) * 6 - i);
              return (
                <g key={p.label} opacity={u}>
                  <rect x={126} y={y - 23} width={296} height={46} rx={9} fill={colors.BG} stroke={p.c} strokeOpacity={0.7} />
                  <text x={146} y={y + 4} fill={colors.TEXT} fontSize={11} fontFamily={MONO}>{p.label}</text>
                  <text x={400} y={y + 4} textAnchor="end" fill={p.c} fontSize={10} fontFamily={MONO}>metric ↔ accuracy</text>
                </g>
              );
            })}
          </g>

          <g opacity={clamp01(pairsU * 2)}>
            <line x1={620} y1={536} x2={1060} y2={536} stroke={colors.MUTED} strokeWidth={1.5} />
            <line x1={620} y1={536} x2={620} y2={150} stroke={colors.MUTED} strokeWidth={1.5} />
            <text x={840} y={570} textAnchor="middle" fill={colors.MUTED} fontSize={11}>metric value</text>
            <text x={585} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={11} transform="rotate(-90 585 350)">downstream accuracy</text>
            <text x={620} y={130} fill={colors.MUTED} fontSize={9} fontFamily={MONO}>schematic pairing plane</text>

            {PAIRS.map((p, i) => {
              const u = clamp01(pairsU * 6 - i);
              const x0 = 402;
              const y0 = 234 + i * 70;
              const x = x0 + (p.x - x0) * u;
              const y = y0 + (p.y - y0) * u;
              return (
                <g key={p.label} transform={`translate(${x} ${y})`} opacity={u}>
                  <circle r={10} fill={p.c} />
                  <circle r={18} fill="none" stroke={p.c} opacity={0.28} />
                  {u > 0.9 && <text x={14} y={-10} fill={p.c} fontSize={9} fontFamily={MONO}>{p.label}</text>}
                </g>
              );
            })}

            {fitU > 0 && <line x1={690} y1={510} x2={1026} y2={218} stroke={colors.POSITIVE} strokeWidth={3} strokeDasharray={`${450 * fitU} 450`} />}
          </g>

          <MathLabel tex={'r=\\operatorname{corr}(m,a)'} x={820} y={112} fontSize={18} opacity={s.get(scene.pearsonU)} />
          <MathLabel tex={'\\rho=\\operatorname{corr}(\\operatorname{rank}m,\\operatorname{rank}a)'} x={820} y={142} fontSize={15} opacity={s.get(scene.spearmanU)} />
          <MathLabel tex={'a=\\beta_0+\\beta_1 m'} x={1010} y={590} fontSize={19} opacity={fitU} />

          {s.get(scene.domainsU) > 0 && (
            <g opacity={s.get(scene.domainsU)}>
              {DOMAINS.map((d, i) => (
                <g key={d} transform={`translate(${400 + i * 100} 610)`}>
                  <rect x={-44} y={-18} width={88} height={36} rx={9} fill={colors.PANEL} stroke={i === 0 || i === 2 || i === 4 ? colors.POSITIVE : colors.GRID} />
                  <text y={4} textAnchor="middle" fill={i === 0 || i === 2 || i === 4 ? colors.POSITIVE : colors.MUTED} fontSize={9} fontWeight={700}>{d}</text>
                </g>
              ))}
            </g>
          )}

          {s.get(scene.resultU) > 0 && (
            <g opacity={s.get(scene.resultU)} transform="translate(1025 570)">
              <rect x={-112} y={-48} width={224} height={96} rx={14} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={0} y={-15} textAnchor="middle" fill={colors.WARM} fontSize={22} fontWeight={800}>4 / 6</text>
              <text x={0} y={5} textAnchor="middle" fill={colors.MUTED} fontSize={10}>strongest cross-model</text>
              <text x={0} y={28} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily={MONO}>Math · Science · Medical &gt; 0.70</text>
            </g>
          )}

          {recapU > 0 && (
            <g opacity={recapU}>
              {[
                { x: 340, label: 'construct', c: colors.ACCENT },
                { x: 540, label: 'fine-tune', c: colors.SECONDARY },
                { x: 740, label: 'measure MMD', c: colors.WARM },
                { x: 940, label: 'correlate', c: colors.POSITIVE },
              ].map((n, i, arr) => (
                <g key={n.label}>
                  {i < arr.length - 1 && <line x1={n.x + 44} y1={330} x2={arr[i + 1].x - 44} y2={330} stroke={n.c} strokeWidth={2} opacity={0.7} />}
                  <circle cx={n.x} cy={330} r={44} fill={colors.PANEL} stroke={n.c} strokeWidth={2} />
                  <text x={n.x} y={335} textAnchor="middle" fill={n.c} fontSize={11} fontWeight={700}>{n.label}</text>
                </g>
              ))}
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={220} y={232} width={840} height={196} rx={20} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={750}>Training data answers to results</text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>construction → training → distribution → correlation</text>
          <text x={640} y={382} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>DataPrep-Bench · arXiv 2607.20465</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
