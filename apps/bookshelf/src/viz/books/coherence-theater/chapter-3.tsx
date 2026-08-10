// Chapter 3 — When the Summary Becomes the Chart.
//
// Grounded in Section 6 (the eight propagation vectors, Table 1), Section 7
// (the healthcare summarization scenario), and Section 7.1 / Figure 2 (the
// reaction pathway). The paper's REAL Table 1 (figures/table1-vectors.png)
// opens the chapter as the taxonomy; then one fluent summary travels the
// scenario's six stops — source record → summary → handoff → policy input →
// dashboard metric → audit — collecting the named vector at each hop while a
// provenance meter drains. The paper's REAL Figure 2
// (figures/fig2-pathway.png) closes the chapter: the same journey, drawn by
// the paper as a reaction pathway.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Figure } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// The scenario's six stops, each with the vector the paper names there.
const STOPS = [
  { label: 'source record', vector: null, note: 'the real chart' },
  { label: 'summary', vector: 'incentive contagion', note: 'faster than the source' },
  { label: 'handoff', vector: 'authority amplification', note: 'copied into notes' },
  { label: 'policy input', vector: 'transitional artifact capture', note: 'workflows assume it' },
  { label: 'dashboard', vector: 'metric lock-in', note: 'adoption scored as success' },
  { label: 'audit', vector: 'recursive oversight capture', note: 'review reads the summary too' },
] as const;

// Journey geometry: a gentle left-to-right wave.
const SX = 150;
const EX = 1130;
const stopX = (i: number) => SX + (i * (EX - SX)) / (STOPS.length - 1);
const stopY = (i: number) => (i % 2 === 0 ? 396 : 312);

// Provenance: how much of the original record's grounding survives per stop.
const PROVENANCE = [1.0, 0.72, 0.5, 0.32, 0.18, 0.1];

const CAM_TABLE: CameraState = { x: 400, y: 330, k: 1.2 };
const CAM_EARLY: CameraState = { x: 400, y: 360, k: 1.22 };
const CAM_LATE: CameraState = { x: 900, y: 360, k: 1.22 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tableU: ChannelRef<number>;
  laneU: ChannelRef<number>;
  travelU: ChannelRef<number>;
  refusalU: ChannelRef<number>;
  figU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tableU = tl.channel('tableU', 0);
  const laneU = tl.channel('laneU', 0);
  const travelU = tl.channel('travelU', 0);
  const refusalU = tl.channel('refusalU', 0);
  const figU = tl.channel('figU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 0 — the taxonomy, from the paper itself.
  tl.caption({
    at: 0.1,
    dur: 6.8,
    text: 'The paper names eight ways degraded conditions move — its first table, shown here exactly as printed. Some vectors produce distortion, some move it, some conceal it, and some suppress the repair. The names matter less than watching them compose.',
  });
  tl.tween(tableU, 1, { at: 0.2, dur: 1.3, ease: ease.enter });
  tl.tween(cam, CAM_TABLE, { at: 0.4, dur: 1.4, ease: ease.move });
  tl.hold(7.3, 0.6);

  // Beat 1 — the scenario.
  tl.caption({
    at: 7.9,
    dur: 6.8,
    text: 'So the paper runs a worked scenario. A hospital adds a language model that summarizes patient records. The justification is honest: clinicians are overloaded, records are long, and the summaries genuinely help. It is framed as advisory — a layer on top of the real chart.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 8.1, dur: 1.4, ease: ease.move });
  tl.tween(tableU, 0.12, { at: 8.1, dur: 0.9, ease: ease.move });
  tl.tween(laneU, 1, { at: 8.7, dur: 1.8, ease: ease.draw });
  tl.hold(14.9, 0.6);

  // Beat 2 — stop one: convenience becomes default.
  tl.caption({
    at: 15.5,
    dur: 6.6,
    text: 'Propagation begins when the summary becomes the practical point of contact. Reading the raw chart is slower, so time pressure turns convenience into default. That is incentive contagion — and evaluators judging the system by readability and uptake train it further the same way.',
  });
  tl.tween(cam, CAM_EARLY, { at: 15.7, dur: 1.4, ease: ease.move });
  tl.tween(travelU, 0.2, { at: 16.1, dur: 2.2, ease: ease.move });
  tl.hold(22.3, 0.6);

  // Beat 3 — refusal suppression.
  tl.caption({
    at: 22.9,
    dur: 6.8,
    text: 'Then the system learns not to say no. A summary that answers insufficient confidence creates friction; a plausible one keeps throughput moving. The pathway that slows the workflow is punished implicitly, even when it is epistemically the right one. Premature coherence becomes the rewarded policy.',
  });
  tl.tween(refusalU, 1, { at: 23.4, dur: 1.4, ease: ease.enter });
  tl.hold(29.9, 0.6);

  // Beat 4 — authority amplification.
  tl.caption({
    at: 30.5,
    dur: 6.6,
    text: 'Next the summary is copied into notes, cited in handoffs, relied on by supervisors who never open the raw source. Routing gives the artifact authority that no additional evidence ever earned. A generated compression is now a routed fact, functioning as institutional memory.',
  });
  tl.tween(refusalU, 0.25, { at: 30.6, dur: 0.8, ease: ease.move });
  tl.tween(travelU, 0.45, { at: 31.0, dur: 2.4, ease: ease.move });
  tl.hold(36.9, 0.6);

  // Beat 5 — transitional capture.
  tl.caption({
    at: 37.5,
    dur: 6.6,
    text: 'The advisory layer stops being treated as provisional. Scheduling assumes it. Documentation standards refer to it. New staff are trained on the summary workflow rather than on primary-record discipline. A temporary relief mechanism hardens into the medium of coordination — with no exit condition.',
  });
  tl.tween(travelU, 0.65, { at: 38.0, dur: 2.2, ease: ease.move });
  tl.hold(43.9, 0.6);

  // Beat 6 — metric lock-in.
  tl.caption({
    at: 44.5,
    dur: 6.6,
    text: 'Then the dashboard arrives: summary adoption, turnaround time, chart completion. The clinician who spends time checking the underlying record now looks inefficient beside a colleague who accepts the summary. The dashboard need not command distortion to make distortion locally rational.',
  });
  tl.tween(cam, CAM_LATE, { at: 44.7, dur: 1.4, ease: ease.move });
  tl.tween(travelU, 0.84, { at: 45.1, dur: 2.2, ease: ease.move });
  tl.hold(50.9, 0.6);

  // Beat 7 — oversight joins the loop.
  tl.caption({
    at: 51.5,
    dur: 6.8,
    text: 'Finally the audit team assesses the deployment — using the same summarization layer and the same dashboards. The conditions that generated the distortion now shape the mechanism charged with detecting it. The system may even look safer than before. What improved is the smoothness with which unverified narrative moves.',
  });
  tl.tween(travelU, 1, { at: 52.0, dur: 2.0, ease: ease.move });
  tl.hold(58.1, 0.6);

  // Beat 8 — the paper's own Figure 2.
  tl.caption({
    at: 58.7,
    dur: 6.8,
    text: 'The paper draws that whole journey as a reaction pathway — activating conditions in, intermediate products forming, a more stable compound settling out. Here is that figure, straight from the page. Note what it needs: no villain, no bad model, and no single metric error anywhere in it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 58.9, dur: 1.4, ease: ease.move });
  tl.tween(figU, 1, { at: 59.5, dur: 1.4, ease: ease.enter });
  tl.hold(64.9, 0.6);

  // Beat 9 — close.
  tl.caption({
    at: 65.5,
    dur: 6.2,
    text: 'One fluent compression became default, then authority, then infrastructure, then the measure of success, then the eyes of its own auditor. That is what propagation means. The next chapter asks where, exactly, the point of no return sits.',
  });
  tl.tween(dimU, 1, { at: 65.8, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 66.9, dur: 0.9, ease: ease.enter });
  tl.hold(71.9, 1.2);

  return { tl, cam, tableU, laneU, travelU, refusalU, figU, dimU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const tableU = s.get(scene.tableU);
  const laneU = s.get(scene.laneU);
  const travelU = s.get(scene.travelU);
  const refusalU = s.get(scene.refusalU);
  const figU = s.get(scene.figU);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const close = s.get(scene.closeU);

  // artifact position along the stop chain
  const t = clamp01(travelU) * (STOPS.length - 1);
  const seg = Math.min(STOPS.length - 2, Math.floor(t));
  const su = t - seg;
  const ax = lerp(stopX(seg), stopX(seg + 1), su);
  const ay = lerp(stopY(seg), stopY(seg + 1), su);
  const reached = Math.round(t);
  const provenance = lerp(PROVENANCE[seg], PROVENANCE[Math.min(seg + 1, 5)], su);
  const hardened = travelU > 0.55;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800} opacity={dim}>
        When the summary becomes the chart
      </text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={dim}>
        the healthcare scenario · one artifact, six stops, eight vectors
      </text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          {/* ---- the paper's real Table 1 ---- */}
          <Figure
            src="/generated/coherence-theater/figures/table1-vectors.png"
            x={130}
            y={110}
            w={560}
            h={342}
            reveal={tableU}
            opacity={tableU}
            caption="paper Table 1 · propagation vectors by primary function"
          />

          {/* ---- the journey ---- */}
          <g opacity={laneU * (1 - figU * 0.8)}>
            <rect x={110} y={214} width={1060} height={382} rx={24} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={146} y={250} fill={colors.TEXT} fontSize={16} fontWeight={700}>
              the scenario
            </text>
            <text x={146} y={272} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              a record summarizer, introduced honestly, framed as advisory
            </text>

            {/* the chain */}
            {STOPS.slice(0, -1).map((_, i) => {
              const done = travelU * (STOPS.length - 1) >= i + 0.98;
              return (
                <line
                  key={i}
                  x1={stopX(i)}
                  y1={stopY(i)}
                  x2={stopX(i + 1)}
                  y2={stopY(i + 1)}
                  stroke={done ? colors.WARM : colors.GRID}
                  strokeWidth={done ? 3 : 2}
                  opacity={done ? 0.85 : 0.5}
                />
              );
            })}
            {STOPS.map((stop, i) => {
              const arrived = travelU * (STOPS.length - 1) >= i - 0.02;
              const color = i === 0 ? colors.POSITIVE : i >= 4 ? colors.NEGATIVE : colors.WARM;
              return (
                <g key={stop.label}>
                  <circle cx={stopX(i)} cy={stopY(i)} r={arrived ? 10 : 7} fill={arrived ? color : colors.GRID} />
                  <text x={stopX(i)} y={stopY(i) + (i % 2 === 0 ? 34 : -46)} textAnchor="middle" fill={arrived ? colors.TEXT : colors.MUTED} fontSize={12.5} fontFamily={MONO} fontWeight={arrived ? 700 : 400}>
                    {stop.label}
                  </text>
                  <text x={stopX(i)} y={stopY(i) + (i % 2 === 0 ? 52 : -28)} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} opacity={arrived ? 0.9 : 0.4}>
                    {stop.note}
                  </text>
                  {/* the vector stamp, once the artifact has passed */}
                  {stop.vector && arrived && (
                    <g opacity={clamp01((travelU * (STOPS.length - 1) - i + 0.02) * 3)}>
                      <rect x={stopX(i) - 86} y={stopY(i) + (i % 2 === 0 ? 62 : -100)} width={172} height={26} rx={7} fill={colors.BG} stroke={i >= 4 ? colors.NEGATIVE : colors.WARM} strokeWidth={1.4} />
                      <text x={stopX(i)} y={stopY(i) + (i % 2 === 0 ? 79 : -83)} textAnchor="middle" fill={i >= 4 ? colors.NEGATIVE : colors.WARM} fontSize={10} fontFamily={MONO}>
                        {stop.vector}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* the artifact */}
            {travelU > 0.01 && (
              <g transform={`translate(${ax} ${ay - 58})`}>
                <rect x={-74} y={-28} width={148} height={52} rx={11} fill={colors.PANEL} stroke={hardened ? colors.NEGATIVE : colors.ACCENT} strokeWidth={2.5 + (hardened ? 1.5 : 0)} />
                <text y={-6} textAnchor="middle" fill={hardened ? colors.NEGATIVE : colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
                  the summary
                </text>
                <text y={14} textAnchor="middle" fill={colors.TEXT} fontSize={10.5}>
                  {hardened ? 'treated as settled fact' : 'plausible · helpful'}
                </text>
              </g>
            )}

            {/* refusal suppression, at the summary stop */}
            {refusalU > 0.05 && (
              <g opacity={refusalU}>
                <rect x={stopX(1) - 108} y={stopY(1) + 88} width={216} height={48} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.6} />
                <text x={stopX(1)} y={stopY(1) + 108} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO}>
                  “insufficient confidence” → friction
                </text>
                <text x={stopX(1)} y={stopY(1) + 126} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                  plausible answer → throughput · refusal is suppressed
                </text>
              </g>
            )}

            {/* the provenance meter */}
            <g opacity={clamp01(travelU * 6)}>
              <text x={146} y={566} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                grounding in the source record
              </text>
              <rect x={420} y={554} width={430} height={16} rx={8} fill="#101827" stroke={colors.GRID} />
              <rect x={420} y={554} width={430 * provenance} height={16} rx={8} fill={provenance > 0.45 ? colors.POSITIVE : colors.NEGATIVE} opacity={0.85} />
              <text x={866} y={567} fill={provenance > 0.45 ? colors.POSITIVE : colors.NEGATIVE} fontSize={12} fontFamily={MONO}>
                {Math.round(provenance * 100)}%
              </text>
              {reached >= 5 && (
                <text x={1134} y={567} textAnchor="end" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
                  the audit reads this too
                </text>
              )}
            </g>
          </g>

          {/* ---- the paper's real Figure 2 ---- */}
          <Figure
            src="/generated/coherence-theater/figures/fig2-pathway.png"
            x={396}
            y={92}
            w={420}
            h={506}
            reveal={figU}
            opacity={figU}
            caption="paper Figure 2 · illustrative reaction pathway"
          />
        </g>
      </Camera>
      <g opacity={close}>
        <rect x={158} y={228} width={964} height={220} rx={28} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2.5} />
        <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={33} fontWeight={800}>
          No villain required
        </text>
        <text x={640} y={338} textAnchor="middle" fill={colors.WARM} fontSize={18}>
          default → authority → infrastructure → metric → auditor
        </text>
        <text x={640} y={380} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
          the artifact moves faster than its uncertainty · next: the threshold
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
