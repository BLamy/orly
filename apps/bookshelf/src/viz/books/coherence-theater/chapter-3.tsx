// Chapter 3 — When the Summary Becomes the Chart.
//
// Grounded in Section 7 and Figure 2, the paper's healthcare summarization
// scenario. One fluent artifact travels from overloaded source record to
// handoff, policy, metric, and oversight. The provenance grid changes with
// the artifact instead of replacing it with a new diagram at each step.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MatrixGrid, Vec, pointAlong } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const PATH = [
  { x: 150, y: 358 },
  { x: 350, y: 250 },
  { x: 570, y: 358 },
  { x: 790, y: 250 },
  { x: 1010, y: 358 },
] as const;
const STAGES = ['source record', 'summary', 'handoff', 'policy input', 'audit proxy'] as const;
const COLS = ['raw', 'summary', 'handoff', 'policy', 'audit'];
const PROVENANCE = [
  [0.95, 0.72, 0.46, 0.28, 0.16],
  [0.18, 0.78, 0.86, 0.90, 0.94],
  [0.08, 0.30, 0.62, 0.84, 0.92],
  [0.06, 0.14, 0.31, 0.74, 0.97],
];
const ROWS = ['source', 'generated', 'authority', 'metric'];

const CAM_SOURCE: CameraState = { x: 340, y: 330, k: 1.16 };
const CAM_AUDIT: CameraState = { x: 860, y: 330, k: 1.16 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pathU = tl.channel('pathU', 0);
  const artifactU = tl.channel('artifactU', 1);
  const gridU = tl.channel('gridU', 0);
  const uncertaintyU = tl.channel('uncertaintyU', 0);
  const hardnessU = tl.channel('hardnessU', 0);
  const auditU = tl.channel('auditU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 0 — the scenario and its source.
  tl.caption({
    at: 0.1,
    dur: 6.4,
    text: 'The paper makes the mechanism concrete with a healthcare summary. A language model compresses an overloaded chart, and the first version is genuinely useful.',
  });
  tl.tween(gridU, 1, { at: 0.2, dur: 1.4, ease: ease.draw });
  tl.tween(pathU, 0.08, { at: 0.7, dur: 0.8, ease: ease.move });
  tl.hold(6.9, 0.6);

  // Beat 1 — convenience becomes default.
  tl.caption({
    at: 7.5,
    dur: 6.2,
    text: 'Reading the raw chart is slower, so time pressure turns the convenience into a default. The summary is no longer a layer on top of the record; it is the practical point of contact.',
  });
  tl.tween(cam, CAM_SOURCE, { at: 7.6, dur: 1.3, ease: ease.move });
  tl.tween(pathU, 0.27, { at: 8.1, dur: 2.2, ease: ease.linear });
  tl.tween(uncertaintyU, 0.4, { at: 9.2, dur: 0.7, ease: ease.enter });
  tl.hold(13.7, 0.6);

  // Beat 2 — refusal suppression.
  tl.caption({
    at: 14.3,
    dur: 6.2,
    text: 'Uncertainty creates friction. A summary that stops and asks for the source slows the workflow, while a plausible summary keeps throughput moving.',
  });
  tl.tween(pathU, 0.46, { at: 14.7, dur: 2.0, ease: ease.linear });
  tl.tween(uncertaintyU, 1, { at: 15.2, dur: 0.8, ease: ease.move });
  tl.hold(20.5, 0.6);

  // Beat 3 — the artifact gains authority.
  tl.caption({
    at: 21.1,
    dur: 6.4,
    text: 'Once the compression is copied into a handoff, it begins to function as institutional memory. Routing gives the artifact authority even though routing has not added evidence.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 21.3, dur: 1.3, ease: ease.move });
  tl.tween(pathU, 0.66, { at: 21.8, dur: 2.2, ease: ease.linear });
  tl.tween(hardnessU, 0.52, { at: 23.0, dur: 1.0, ease: ease.enter });
  tl.hold(27.5, 0.6);

  // Beat 4 — transitional capture.
  tl.caption({
    at: 28.1,
    dur: 6.3,
    text: 'The advisory layer then hardens into infrastructure. Scheduling, documentation, and training begin to assume the summary is the medium of coordination.',
  });
  tl.tween(pathU, 0.82, { at: 28.7, dur: 2.0, ease: ease.linear });
  tl.tween(hardnessU, 0.78, { at: 29.3, dur: 1.0, ease: ease.move });
  tl.hold(34.4, 0.6);

  // Beat 5 — metric lock-in.
  tl.caption({
    at: 35.0,
    dur: 6.3,
    text: 'Then adoption, turnaround time, and chart completion become the dashboard. A clinician who checks the source can now look inefficient beside one who accepts the compression.',
  });
  tl.tween(pathU, 0.97, { at: 35.5, dur: 2.0, ease: ease.linear });
  tl.tween(hardnessU, 0.94, { at: 36.1, dur: 1.0, ease: ease.move });
  tl.hold(41.9, 0.6);

  // Beat 6 — oversight joins the loop.
  tl.caption({
    at: 42.5,
    dur: 6.4,
    text: 'Finally, the audit uses the same summaries and dashboards to judge the deployment. The mechanism charged with detecting the distortion now inherits its baseline.',
  });
  tl.tween(cam, CAM_AUDIT, { at: 42.7, dur: 1.3, ease: ease.move });
  tl.tween(pathU, 1, { at: 43.2, dur: 1.3, ease: ease.move });
  tl.tween(auditU, 1, { at: 44.0, dur: 1.0, ease: ease.enter });
  tl.hold(48.9, 0.6);

  // Beat 7 — close on the reaction pathway.
  tl.caption({
    at: 49.5,
    dur: 6.6,
    text: 'No single villain is required. A fluent compression becomes default, then authority, then infrastructure, until legibility can substitute for correction.',
  });
  tl.tween(dimU, 1, { at: 49.8, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.0, dur: 0.9, ease: ease.enter });
  tl.hold(57.0, 1.0);

  return { tl, cam, pathU, artifactU, gridU, uncertaintyU, hardnessU, auditU, dimU, closeU };
}

const scene = buildScene();

function Artifact({ u, visible, uncertainty, hardness, audit }: { u: number; visible: number; uncertainty: number; hardness: number; audit: number }) {
  const point = pointAlong([...PATH], clamp01(u));
  const idx = Math.min(STAGES.length - 1, Math.floor(clamp01(u) * STAGES.length));
  const label = STAGES[idx];
  const cardColor = audit > 0.5 ? colors.NEGATIVE : hardness > 0.5 ? colors.WARM : colors.ACCENT;
  return (
    <g transform={`translate(${point.x} ${point.y})`} opacity={visible}>
      <circle r={52 + hardness * 18} fill={cardColor} opacity={0.11 + hardness * 0.12} />
      <rect x={-88} y={-34} width={176} height={68} rx={14} fill={colors.PANEL} stroke={cardColor} strokeWidth={2.5 + hardness * 1.5} />
      <text y={-5} textAnchor="middle" fill={cardColor} fontSize={12} fontFamily={MONO}>{label}</text>
      <text y={18} textAnchor="middle" fill={colors.TEXT} fontSize={11}>{hardness > 0.75 ? 'settled fact' : 'plausible summary'}</text>
      <g opacity={uncertainty} transform="translate(72 -28)">
        <circle r={16} fill={colors.NEGATIVE} />
        <text y={6} textAnchor="middle" fill={colors.BG} fontSize={18} fontWeight={800}>?</text>
      </g>
      <g opacity={clamp01(hardness * 1.2)} transform="translate(-70 34)">
        <rect x={-9} y={-8} width={18} height={15} rx={3} fill="none" stroke={colors.WARM} strokeWidth={2} />
        <path d="M-5 -8 V-13 Q0 -20 5 -13 V-8" fill="none" stroke={colors.WARM} strokeWidth={2} />
      </g>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const pathU = s.get(scene.pathU);
  const artifactU = s.get(scene.artifactU);
  const gridU = s.get(scene.gridU);
  const uncertainty = s.get(scene.uncertaintyU);
  const hardness = s.get(scene.hardnessU);
  const audit = s.get(scene.auditU);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const close = s.get(scene.closeU);
  const pathOpacity = dim * clamp01(gridU * 1.4);
  const matrixValues = PROVENANCE.map((row) => row.map((v) => lerp(v, v > 0.5 ? 1 : 0, clamp01(hardness * 0.35))));

  return (
    <>
      <rect width={STAGE_W} height={720} fill={colors.BG} />
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800} opacity={dim}>
        When the summary becomes the chart
      </text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={dim}>
        one artifact · five propagation stops · provenance under pressure
      </text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <rect x={150} y={102} width={1010} height={180} rx={24} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={180} y={136} fill={colors.TEXT} fontSize={16} fontWeight={700}>provenance ledger</text>
          <text x={180} y={158} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>what is source, what is generated, what is now treated as authority?</text>
          <MatrixGrid
            x={310}
            y={178}
            values={matrixValues}
            cell={42}
            gap={8}
            cellU={(i, j) => clamp01(gridU * 10 - (i * 2 + j) - 1)}
            fill={(v, i) => i === 0 ? colors.POSITIVE : i === 3 ? colors.NEGATIVE : colors.WARM}
            rowLabels={ROWS}
            colLabels={COLS}
            showValues={(v) => v.toFixed(1)}
            labelSize={11}
          />
          <g opacity={pathOpacity}>
            {PATH.slice(0, -1).map((a, i) => <Vec key={i} x1={a.x} y1={a.y} x2={PATH[i + 1].x} y2={PATH[i + 1].y} grow={1} color={i >= 2 ? colors.WARM : colors.ACCENT} width={3} />)}
          </g>
          {PATH.map((p, i) => (
            <g key={STAGES[i]} opacity={clamp01(gridU * 1.4)}>
              <circle cx={p.x} cy={p.y} r={9} fill={i >= 3 ? colors.WARM : colors.ACCENT} />
              <text x={p.x} y={p.y + 72} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>{STAGES[i]}</text>
            </g>
          ))}
          <Artifact u={pathU} visible={artifactU} uncertainty={uncertainty} hardness={hardness} audit={audit} />
          <MathLabel tex={'\text{artifact} \rightarrow \text{authority} \rightarrow \text{baseline}'} x={640} y={548} fontSize={19} color={colors.WARM} opacity={clamp01(hardness * 1.2)} />
        </g>
      </Camera>
      <g opacity={close}>
        <rect x={156} y={228} width={968} height={216} rx={28} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2.5} />
        <text x={640} y={290} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={800}>Legibility can become the carrier</text>
        <text x={640} y={338} textAnchor="middle" fill={colors.WARM} fontSize={19}>summary → memory → policy → metric → oversight</text>
        <text x={640} y={380} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>the object moves faster than its uncertainty</text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
