// Chapter 5 — The Intervention Test.
//
// Grounded in Section 10 (what the regime is NOT), Section 11 (regime
// conditions, the five-question intervention test, and Table 2's boundary
// cases). The centerpiece is the paper's question five run as an actual
// experiment, twice: inject one principled correction into the same workflow
// ring. Below threshold the pulse travels the loop and revises the record.
// Under the regime, the same pulse is documented, overridden, and returned
// through the same workflow as policy — absorbed as distortion recirculating
// into authority (Table 2's final row). The REAL Table 2
// (figures/table2-boundary.png, cropped from page 17 of the PDF) grounds the
// verdicts.
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

// Section 11.2's five questions, tightened for the rail.
const QUESTIONS = [
  'Are correction channels usable, or present in name only?',
  'Does refusal or dissent carry disproportionate local cost?',
  'Do outputs gain authority by routing, not verification?',
  'Do evaluators rely on signals the system already shaped?',
  'Would a principled correction be absorbed?',
] as const;

// The workflow ring both experiments run on.
const RING = [
  { label: 'flawed output' },
  { label: 'workflow' },
  { label: 'review' },
  { label: 'policy' },
] as const;
const ringPos = (cx: number, i: number) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / RING.length;
  return { x: cx + 128 * Math.cos(a), y: 300 + 118 * Math.sin(a) };
};

const HEALTHY_CX = 400;
const REGIME_CX = 928;

const CAM_RAIL: CameraState = { x: 640, y: 560, k: 1.25 };
const CAM_HEALTHY: CameraState = { x: 420, y: 320, k: 1.28 };
const CAM_REGIME: CameraState = { x: 910, y: 320, k: 1.28 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ringsU: ChannelRef<number>;
  railU: ChannelRef<number>;
  focusRow: ChannelRef<number>;
  focusU: ChannelRef<number>;
  healthyU: ChannelRef<number>;
  regimeU: ChannelRef<number>;
  tableU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringsU = tl.channel('ringsU', 0);
  const railU = tl.channel('railU', 0);
  const focusRow = tl.channel('focusRow', -1);
  const focusU = tl.channel('focusU', 0);
  const healthyU = tl.channel('healthyU', 0);
  const regimeU = tl.channel('regimeU', 0);
  const tableU = tl.channel('tableU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  const focus = (row: number, at: number) => {
    tl.tween(focusU, 0, { at, dur: 0.35, ease: ease.move });
    tl.tween(focusRow, row, { at: at + 0.35, dur: 0.3, ease: ease.move });
    tl.tween(focusU, 1, { at: at + 0.65, dur: 0.5, ease: ease.enter });
  };

  // Beat 0 — the diagnosis stays narrow.
  tl.caption({
    at: 0.1,
    dur: 6.8,
    text: 'The paper is strict about what its diagnosis is not. Ordinary error, ordinary bias, hierarchy, a hallucinating model, an over-optimized metric — each can exist in a system that still corrects itself. None of them, alone, is the regime. The regime is what remains when correction has been priced out.',
  });
  tl.tween(ringsU, 1, { at: 0.3, dur: 1.6, ease: ease.draw });
  tl.hold(7.3, 0.6);

  // Beat 1 — the five questions.
  tl.caption({
    at: 7.9,
    dur: 7.0,
    text: 'So it offers a field test — five questions about the system as operated, not as chartered. Are the correction channels usable in practice? Does dissent carry disproportionate local cost? Do outputs gain authority merely by being routed? Are the evaluators reading signals the system already shaped?',
  });
  tl.tween(cam, CAM_RAIL, { at: 8.1, dur: 1.4, ease: ease.move });
  tl.tween(railU, 1, { at: 8.5, dur: 1.6, ease: ease.draw });
  focus(0, 9.4);
  focus(2, 12.0);
  tl.hold(15.1, 0.6);

  // Beat 2 — question five is an experiment.
  tl.caption({
    at: 15.7,
    dur: 6.6,
    text: 'The fifth question is the sharp one, because it is an experiment you can actually run. Inject one principled correction and watch what the system does with it. Everything the paper built — forces, vectors, thresholds — cashes out in that single observation.',
  });
  focus(4, 16.0);
  tl.hold(22.5, 0.6);

  // Beat 3 — the healthy run.
  tl.caption({
    at: 23.1,
    dur: 7.0,
    text: 'Run it below threshold first. A flawed output is challenged. The challenge travels the workflow, review actually engages the source, the record is revised, and the correction propagates to everything downstream of it. Distortion was present — and the system metabolized it. That is Table two’s first row: correction remains live and scalable.',
  });
  tl.tween(cam, CAM_HEALTHY, { at: 23.3, dur: 1.4, ease: ease.move });
  tl.tween(focusU, 0, { at: 23.3, dur: 0.5, ease: ease.move });
  tl.tween(healthyU, 1, { at: 23.9, dur: 4.6, ease: ease.move });
  tl.hold(30.7, 0.6);

  // Beat 4 — the regime run.
  tl.caption({
    at: 31.3,
    dur: 7.4,
    text: 'Now the same experiment under the regime. The correction is received politely. It is documented. Then it is overridden — and the override travels the same workflow the correction could not, coming back around as policy. The intervention did not fail to arrive; it was absorbed, and the absorption made the fiction stronger.',
  });
  tl.tween(cam, CAM_REGIME, { at: 31.5, dur: 1.4, ease: ease.move });
  tl.tween(regimeU, 1, { at: 32.1, dur: 4.8, ease: ease.move });
  tl.hold(39.3, 0.6);

  // Beat 5 — the boundary table, from the paper.
  tl.caption({
    at: 39.9,
    dur: 7.0,
    text: 'The paper tabulates the boundary in its second table, shown here exactly as printed. Challenged and corrected: below threshold. Biased but with protected dissent: below threshold. Dashboard gaming with intact escalation: transitional. But an unchallenged fluent summary, an audit certifying its own proxies, a correction returned as policy — those are the regime.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 40.1, dur: 1.4, ease: ease.move });
  tl.tween(tableU, 1, { at: 40.7, dur: 1.4, ease: ease.enter });
  tl.hold(47.5, 0.6);

  // Beat 6 — the operational reading.
  tl.caption({
    at: 48.1,
    dur: 6.6,
    text: 'The whole framework compresses into one sentence: the regime emerges when distorted outputs acquire authority and persist faster than the system can revise them. Not when people err, not when models hallucinate — when revision loses the race, structurally, every time.',
  });
  tl.tween(tableU, 0.25, { at: 48.4, dur: 0.9, ease: ease.move });
  tl.hold(54.9, 0.6);

  // Beat 7 — close the book.
  tl.caption({
    at: 55.5,
    dur: 6.8,
    text: 'Which leaves the discipline this book set out to learn. Do not ask whether a system looks coherent — under the regime, looking coherent is what it does best. Ask whether someone inside it can still make a correction travel. If the answer is no, the show is already running.',
  });
  tl.tween(dimU, 1, { at: 55.9, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 57.0, dur: 0.9, ease: ease.enter });
  tl.hold(63.1, 1.4);

  return { tl, cam, ringsU, railU, focusRow, focusU, healthyU, regimeU, tableU, dimU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function WorkflowRing({
  cx,
  title,
  reveal,
  runU,
  regime,
}: {
  cx: number;
  title: string;
  reveal: number;
  runU: number;
  regime: boolean;
}) {
  // pulse travels node 0 → 1 → 2 → 3 → back to 0
  const t = clamp01(runU) * RING.length;
  const seg = Math.min(RING.length - 1, Math.floor(t));
  const su = t - seg;
  const a = ringPos(cx, seg);
  const b = ringPos(cx, (seg + 1) % RING.length);
  const pulse = { x: lerp(a.x, b.x, su), y: lerp(a.y, b.y, su) };
  const done = runU > 0.96;
  const accent = regime ? colors.NEGATIVE : colors.POSITIVE;
  return (
    <g opacity={reveal}>
      <rect x={cx - 250} y={128} width={500} height={392} rx={24} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={cx - 226} y={162} fill={colors.TEXT} fontSize={15.5} fontWeight={700}>
        {title}
      </text>
      {/* ring edges */}
      {RING.map((_, i) => {
        const p = ringPos(cx, i);
        const n = ringPos(cx, (i + 1) % RING.length);
        const travelled = t >= i + 1;
        return (
          <line
            key={i}
            x1={p.x}
            y1={p.y}
            x2={n.x}
            y2={n.y}
            stroke={travelled ? accent : colors.GRID}
            strokeWidth={travelled ? 3 : 1.6}
            opacity={travelled ? 0.85 : 0.6}
          />
        );
      })}
      {/* ring nodes */}
      {RING.map((node, i) => {
        const p = ringPos(cx, i);
        const visited = t >= i || done;
        const fixed = !regime && done && i === 0;
        return (
          <g key={node.label}>
            <circle cx={p.x} cy={p.y} r={30} fill={colors.BG} stroke={visited ? accent : colors.GRID} strokeWidth={visited ? 2.4 : 1.4} />
            <text x={p.x} y={p.y - 38} textAnchor="middle" fill={visited ? colors.TEXT : colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              {fixed ? 'revised record' : node.label}
            </text>
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={15}>
              {i === 0 ? (fixed ? '✓' : regime && done ? '✕' : '△') : ''}
            </text>
          </g>
        );
      })}
      {/* the injected correction pulse */}
      {runU > 0.02 && !done && <circle cx={pulse.x} cy={pulse.y} r={8} fill={accent} />}
      {runU > 0.02 && !done && (
        <text x={pulse.x} y={pulse.y - 14} textAnchor="middle" fill={accent} fontSize={10.5} fontFamily={MONO}>
          {regime && t > 2 ? 'the override' : 'the correction'}
        </text>
      )}
      {/* verdict */}
      {done && (
        <g>
          <rect x={cx - 210} y={448} width={420} height={52} rx={12} fill={colors.BG} stroke={accent} strokeWidth={2} />
          <text x={cx} y={470} textAnchor="middle" fill={accent} fontSize={12.5} fontFamily={MONO} fontWeight={700}>
            {regime ? 'absorbed — returned as policy' : 'propagated — record revised'}
          </text>
          <text x={cx} y={490} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            {regime ? 'distortion recirculates into authority' : 'correction remains live and scalable'}
          </text>
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const ringsU = s.get(scene.ringsU);
  const railU = s.get(scene.railU);
  const row = Math.round(s.get(scene.focusRow));
  const focusU = s.get(scene.focusU);
  const healthyU = s.get(scene.healthyU);
  const regimeU = s.get(scene.regimeU);
  const tableU = s.get(scene.tableU);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const close = s.get(scene.closeU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800} opacity={dim}>
        The intervention test
      </text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={dim}>
        inject one principled correction · watch what the system does with it
      </text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          {/* ---- the two experiment rigs (the off-camera rig dims while the
                    camera is parked on the other, so no half-clipped labels) ---- */}
          <g opacity={1 - tableU * 0.8}>
            <WorkflowRing
              cx={HEALTHY_CX}
              title="below threshold"
              reveal={ringsU * (1 - 0.85 * clamp01(regimeU * 4) * (1 - tableU))}
              runU={healthyU}
              regime={false}
            />
            <WorkflowRing cx={REGIME_CX} title="under the regime" reveal={clamp01(ringsU * 1.2 - 0.15)} runU={regimeU} regime />
          </g>

          {/* ---- the five-question rail ---- */}
          {railU > 0 && (
            <g opacity={railU * (1 - tableU * 0.8) * (1 - clamp01(Math.max(healthyU, regimeU) * 4) * (1 - tableU))}>
              <rect x={170} y={540} width={940} height={158} rx={18} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={200} y={568} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
                the field test
              </text>
              {QUESTIONS.map((q, i) => {
                const active = i === row && focusU > 0.05;
                const y = 590 + i * 21;
                return (
                  <g key={q} opacity={clamp01(railU * 6 - i)}>
                    <circle cx={210} cy={y - 4} r={5} fill={i === 4 ? colors.WARM : colors.ACCENT} />
                    <text x={226} y={y} fill={active ? colors.WARM : colors.TEXT} fontSize={11.5} fontWeight={active ? 700 : 400}>
                      {i + 1}. {q}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ---- the paper's real Table 2 ---- */}
          <Figure
            src="/generated/coherence-theater/figures/table2-boundary.png"
            x={278}
            y={130}
            w={724}
            h={442}
            reveal={tableU}
            opacity={tableU}
            caption="paper Table 2 · boundary cases: observed configurations"
          />
        </g>
      </Camera>
      <g opacity={close}>
        <rect x={154} y={224} width={972} height={230} rx={28} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2.5} />
        <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={33} fontWeight={800}>
          Ask whether correction can still travel
        </text>
        <text x={640} y={334} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>
          propagated and revised — below threshold
        </text>
        <text x={640} y={370} textAnchor="middle" fill={colors.NEGATIVE} fontSize={18}>
          absorbed and returned as policy — the show is already running
        </text>
        <text x={640} y={412} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
          a coherent surface is not a readiness test
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
