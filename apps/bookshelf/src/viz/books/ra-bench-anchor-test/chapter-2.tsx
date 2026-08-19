// The Anchor Test — chapter 2: Count each source once.
// Grounded in scripts/evaluate_predictions.py and EVALUATION.md. The
// persistent object is one prediction row as it is validated, paired by
// norm_clip_id, scored inside its source, and finally averaged source-equally.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const SOURCES = [
  ['Hailuo', 1830], ['HappyHorse', 1787], ['Kling', 1790], ['LTX', 1830], ['Omni', 1830],
  ['Runway', 1805], ['Seedance', 1524], ['Wan dyn.', 1830], ['Wan light.', 1830],
] as const;
const METRICS = [72, 54, 68, 61, 76, 58, 64, 70, 66];

function RowCard({ x, y, u, bad }: { x: number; y: number; u: number; bad?: boolean }) {
  const p = clamp01(u); if (p <= 0.002) return null;
  const c = bad ? colors.NEGATIVE : colors.ACCENT;
  return <g transform={`translate(${x} ${y})`} opacity={p}>
    <rect x={-244} y={-42} width={488} height={84} rx={14} fill={colors.PANEL} stroke={c} strokeWidth={1.7} />
    <text x={-218} y={-14} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>item_id</text>
    <text x={-218} y={12} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>source::norm_clip_id</text>
    <text x={55} y={-14} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>fake_score</text>
    <text x={55} y={12} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>0.891</text>
    <text x={152} y={-14} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>prediction</text>
    <text x={152} y={12} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>generated</text>
  </g>;
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rowU = tl.channel('rowU', 0);
  const gateU = tl.channel('gateU', 0);
  const rejectU = tl.channel('rejectU', 0);
  const pairU = tl.channel('pairU', 0);
  const countsU = tl.channel('countsU', 0);
  const poolLean = tl.channel('poolLean', 0);
  const sourceMetricsU = tl.channel('sourceMetricsU', 0);
  const meanU = tl.channel('meanU', 0);
  const coverageU = tl.channel('coverageU', 0);
  const stageDim = tl.channel('stageDim', 0);
  const payoffU = tl.channel('payoffU', 0);

  tl.caption({ at: 0.3, dur: 5.2, text: 'Evaluation begins with a prediction row, not a chart: identity, score, and decision.' });
  tl.tween(rowU, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 226, k: 1.18 }, { at: 1.5, dur: 1.2, ease: ease.move });
  tl.caption({ at: 5.9, dur: 5.6, text: 'The reference evaluator rejects duplicate identities, missing outputs, and non-finite scores.' });
  tl.tween(gateU, 1, { at: 6.3, dur: 0.7, ease: ease.enter });
  tl.tween(rejectU, 1, { at: 8.0, dur: 0.6, ease: ease.pop });
  tl.tween(rejectU, 0, { at: 10.0, dur: 0.8, ease: ease.move });

  tl.caption({ at: 11.9, dur: 5.1, text: 'A valid generated row pairs with the real anchor carrying the same normalized clip identity.' });
  tl.tween(pairU, 1, { at: 12.3, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 16.0, dur: 1.2, ease: ease.move });
  tl.caption({ at: 17.5, dur: 5.4, text: 'But the nine sources returned different numbers of clips. A pooled score would let larger sources pull harder.' });
  tl.tween(countsU, 1, { at: 18.0, dur: 1.5, ease: ease.draw });
  tl.tween(poolLean, 1, { at: 20.1, dur: 1.2, ease: ease.move });

  tl.caption({ at: 23.5, dur: 5.6, text: 'So the evaluator computes every metric separately inside each generation source.' });
  tl.tween(sourceMetricsU, 1, { at: 24.0, dur: 2.0, ease: ease.enter });
  tl.caption({ at: 29.6, dur: 5.3, text: 'Then it takes the arithmetic mean of nine source-level results. One source, one vote.' });
  tl.tween(meanU, 1, { at: 30.1, dur: 1.6, ease: ease.draw });

  tl.caption({ at: 35.3, dur: 6.0, text: 'Public-media coverage uses eleven thousand five hundred seventy-nine reproducible pairs. Full coverage uses all sixteen thousand fifty-six.' });
  tl.tween(coverageU, 1, { at: 35.8, dur: 0.8, ease: ease.enter });
  tl.caption({ at: 41.8, dur: 6.1, text: 'Coverage may change the rows, but source-equal aggregation keeps the comparison from becoming a popularity contest.' });
  tl.tween(stageDim, 1, { at: 42.2, dur: 1.0, ease: ease.move });
  tl.tween(payoffU, 1, { at: 43.0, dur: 0.7, ease: ease.enter });
  tl.hold(48.2, 1.0);
  return { tl, cam, rowU, gateU, rejectU, pairU, countsU, poolLean, sourceMetricsU, meanU, coverageU, stageDim, payoffU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const dim = 1 - s.get(scene.stageDim) * 0.88;
  return <Camera {...s.get(scene.cam)}>
    <g opacity={dim}>
      <RowCard x={640} y={185} u={s.get(scene.rowU)} />
      <g opacity={s.get(scene.gateU)}>
        <rect x={498} y={265} width={284} height={44} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} />
        <text x={640} y={293} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>read_predictions()</text>
      </g>
      <g opacity={s.get(scene.rejectU)} transform={`translate(${830 + s.get(scene.rejectU) * 60} 285)`}>
        <rect x={-88} y={-22} width={176} height={44} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} />
        <text y={5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>duplicate item_id</text>
      </g>
      <g opacity={s.get(scene.pairU) * (1 - s.get(scene.countsU) * 0.65)}>
        <path d="M640 310 C640 352 466 352 466 397" fill="none" stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="6 5" />
        <path d="M640 310 C640 352 814 352 814 397" fill="none" stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="6 5" />
        <rect x={342} y={398} width={248} height={52} rx={13} fill={colors.PANEL} stroke={colors.ACCENT} />
        <rect x={690} y={398} width={248} height={52} rx={13} fill={colors.PANEL} stroke={colors.POSITIVE} />
        <text x={466} y={430} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>generated::norm_clip_id</text>
        <text x={814} y={430} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>real::norm_clip_id</text>
      </g>
      {SOURCES.map(([name, count], i) => {
        const x = 116 + i * 132;
        const u = s.get(scene.countsU);
        const h = (count / 1830) * 70 * u;
        const metricH = (METRICS[i] / 80) * 70 * s.get(scene.sourceMetricsU);
        return <g key={name}>
          <rect x={x - 34} y={500 - h} width={28} height={h} rx={5} fill={colors.MUTED} opacity={0.4 * u} />
          <rect x={x + 6} y={500 - metricH} width={28} height={metricH} rx={5} fill={colors.ACCENT} opacity={s.get(scene.sourceMetricsU)} />
          <text x={x} y={519} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily={MONO} opacity={Math.max(u, s.get(scene.sourceMetricsU))}>{name}</text>
          <text x={x - 20} y={422} textAnchor="middle" fill={colors.MUTED} fontSize={9} opacity={u}>{count}</text>
        </g>;
      })}
      <g opacity={s.get(scene.poolLean)} transform={`translate(${640 + s.get(scene.poolLean) * 34} 412) rotate(${s.get(scene.poolLean) * 6})`}>
        <line x1={-210} y1={0} x2={210} y2={0} stroke={colors.NEGATIVE} strokeWidth={5} strokeLinecap="round" />
        <text y={-16} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14}>pooled clips lean toward larger sources</text>
      </g>
      <g opacity={s.get(scene.meanU)}>
        <path d="M105 454 L105 430 L1175 430 L1175 454" fill="none" stroke={colors.WARM} strokeWidth={2} />
        <rect x={516} y={385} width={248} height={54} rx={15} fill={colors.PANEL} stroke={colors.WARM} />
        <text x={640} y={418} textAnchor="middle" fill={colors.WARM} fontSize={17} fontFamily={MONO}>mean(source metrics)</text>
      </g>
      <g opacity={s.get(scene.coverageU)}>
        <rect x={194} y={70} width={892} height={66} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} />
        <text x={238} y={110} fill={colors.TEXT} fontSize={17}><tspan fill={colors.SECONDARY}>public-media</tspan> 11,579 pairs</text>
        <text x={742} y={110} fill={colors.TEXT} fontSize={17}><tspan fill={colors.WARM}>full</tspan> 16,056 pairs</text>
      </g>
    </g>
    {s.get(scene.payoffU) > 0 && <g opacity={s.get(scene.payoffU)}>
      <rect x={256} y={238} width={768} height={196} rx={24} fill="#0a0e1a" stroke={colors.WARM} strokeWidth={2} />
      <text x={640} y={304} textAnchor="middle" fill={colors.MUTED} fontSize={15} letterSpacing="0.15em">SOURCE-EQUAL AGGREGATION</text>
      <text x={640} y={360} textAnchor="middle" fill={colors.WARM} fontSize={39} fontWeight={750}>one source, one vote</text>
      <text x={640} y={401} textAnchor="middle" fill={colors.TEXT} fontSize={17}>metrics first · arithmetic mean second</text>
    </g>}
  </Camera>;
}
export const vizScene = () => scene;
