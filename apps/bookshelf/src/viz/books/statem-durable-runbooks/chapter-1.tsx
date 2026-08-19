// StateM, chapter 1 — "When the Trace Forgets"
//
// Grounding: arXiv:2608.15089 Sections 1 and 3.1-3.2 plus Figures 6-7;
// henryqin1997/statem README.md and design.md; statem/core.py
// StatemRuntime.start() and cur(). The paper frames control-signal dilution
// and mutable-state ambiguity as operational hypotheses. The code separates a
// versioned StatemSpec from per-run state containing current, current_entry_id,
// spec_hash, and history.
//
// Centerpiece: one append-only execution ribbon grows until several plausible
// "current" values compete. The same ribbon remains on stage while a durable
// runbook and runtime-state pointer restore one authoritative phase.
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

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const PHASES = ['plan', 'execute', 'verify', 'handoff'] as const;
const PHASE_X = [170, 480, 790, 1090];
const TOKEN_COLORS = [colors.MUTED, colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];
const TRACE = Array.from({ length: 52 }, (_, i) => ({
  x: 84 + i * 21.5,
  y: 430 + ((i * 17) % 5) * 18,
  w: i % 7 === 0 ? 18 : 13,
  color: TOKEN_COLORS[(i * 3 + Math.floor(i / 7)) % TOKEN_COLORS.length],
  plan: i < 4,
}));

const CAM_PLAN: CameraState = { x: 640, y: 285, k: 1.08 };
const CAM_TRACE: CameraState = { x: 720, y: 465, k: 1.2 };
const CAM_SPLIT: CameraState = { x: 640, y: 330, k: 1.02 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  planU: ChannelRef<number>;
  traceU: ChannelRef<number>;
  planDim: ChannelRef<number>;
  ambigU: ChannelRef<number>;
  graphU: ChannelRef<number>;
  stateU: ChannelRef<number>;
  splitU: ChannelRef<number>;
  pointer: ChannelRef<number>;
  curU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const planU = tl.channel('planU', 0);
  const traceU = tl.channel('traceU', 0);
  const planDim = tl.channel('planDim', 0);
  const ambigU = tl.channel('ambigU', 0);
  const graphU = tl.channel('graphU', 0);
  const stateU = tl.channel('stateU', 0);
  const splitU = tl.channel('splitU', 0);
  const pointer = tl.channel('pointer', 0);
  const curU = tl.channel('curU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({
    at: 0.4,
    dur: 6.4,
    text: 'A long run often begins with a perfectly good plan: prepare, execute, verify, then hand off the finished work.',
  });
  tl.tween(cam, CAM_PLAN, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(planU, 1, { at: 0.8, dur: 2.0, ease: ease.draw });
  tl.hold(6.8, 0.7);

  tl.caption({
    at: 7.5,
    dur: 6.7,
    text: 'Then execution begins. Commands, observations, retries, and repairs keep appending, while the compact plan becomes a thinner and thinner thread.',
  });
  tl.tween(traceU, 30, { at: 7.9, dur: 5.0, ease: ease.linear });
  tl.tween(planDim, 0.65, { at: 9.2, dur: 3.8, ease: ease.move });
  tl.hold(14.2, 0.6);

  tl.caption({
    at: 14.8,
    dur: 6.8,
    text: 'Loops make the problem sharper. Several versions of progress now sit in the trace, and each one once looked current.',
  });
  tl.tween(traceU, TRACE.length, { at: 15.2, dur: 4.6, ease: ease.linear });
  tl.tween(ambigU, 1, { at: 18.2, dur: 1.1, ease: ease.enter });
  tl.hold(21.6, 0.6);

  tl.caption({
    at: 22.2,
    dur: 6.3,
    text: 'To answer what happens next, the agent must reconstruct mutable state from an append-only history. That reconstruction can drift.',
  });
  tl.tween(cam, CAM_TRACE, { at: 22.4, dur: 1.5, ease: ease.move });
  tl.tween(ambigU, 1.35, { at: 23.2, dur: 2.2, ease: ease.move });
  tl.hold(28.5, 0.6);

  tl.caption({
    at: 29.1,
    dur: 6.5,
    text: 'The runtime moves procedural truth out of that growing trace. A shared runbook names the phases and the only legal transitions between them.',
  });
  tl.tween(cam, CAM_SPLIT, { at: 29.3, dur: 1.4, ease: ease.move });
  tl.tween(graphU, 1, { at: 29.8, dur: 2.0, ease: ease.draw });
  tl.tween(ambigU, 0.25, { at: 31.0, dur: 1.0, ease: ease.move });
  tl.hold(35.6, 0.6);

  tl.caption({
    at: 36.2,
    dur: 6.8,
    text: 'The versioned runbook stays static. Each execution keeps a separate record of its current phase, entry, specification identity, and history.',
  });
  tl.tween(splitU, 1, { at: 36.5, dur: 1.2, ease: ease.enter });
  tl.tween(stateU, 1, { at: 37.2, dur: 1.2, ease: ease.enter });
  tl.hold(43.0, 0.6);

  tl.caption({
    at: 43.6,
    dur: 6.5,
    text: 'When the run advances, one pointer moves. The old terminal noise remains noisy, but it no longer decides where the work is.',
  });
  tl.tween(pointer, 1, { at: 44.4, dur: 1.5, ease: ease.move });
  tl.tween(curU, 1, { at: 46.2, dur: 0.8, ease: ease.pop });
  tl.hold(50.1, 0.6);

  tl.caption({
    at: 50.7,
    dur: 6.7,
    text: 'A current-state query returns the active prompt, exit checks, and legal next edges directly. The run no longer has to remember its own place.',
  });
  tl.tween(curU, 1.4, { at: 51.2, dur: 2.0, ease: ease.move });
  tl.hold(57.4, 0.7);

  tl.caption({
    at: 58.1,
    dur: 7.0,
    text: 'That is the first scaling move: keep the model free inside a phase, while a durable record owns the run’s position and obligations.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 58.3, dur: 1.4, ease: ease.move });
  tl.tween(endDim, 1, { at: 58.7, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 59.8, dur: 0.9, ease: ease.enter });
  tl.hold(65.1, 1.2);

  return { tl, cam, planU, traceU, planDim, ambigU, graphU, stateU, splitU, pointer, curU, endDim, endU };
}

const scene = buildScene();

function PhaseGraph({ u, pointer, dim }: { u: number; pointer: number; dim: number }) {
  return (
    <g opacity={u * dim}>
      {PHASES.slice(0, -1).map((_, i) => {
        const edgeU = clamp01(u * 5 - (i + 1));
        return (
          <g key={`edge-${i}`} opacity={edgeU}>
            <line x1={PHASE_X[i] + 68} y1={170} x2={PHASE_X[i + 1] - 68} y2={170} stroke={colors.GRID} strokeWidth={2} />
            <path d={`M ${PHASE_X[i + 1] - 78} 164 L ${PHASE_X[i + 1] - 68} 170 L ${PHASE_X[i + 1] - 78} 176`} fill="none" stroke={colors.GRID} strokeWidth={2} />
          </g>
        );
      })}
      {PHASES.map((phase, i) => {
        const nodeU = clamp01(u * 5 - i * 0.8);
        const active = i === (pointer < 0.5 ? 1 : 2);
        return (
          <g key={phase} opacity={nodeU} transform={`translate(0 ${lerp(-12, 0, nodeU)})`}>
            <rect x={PHASE_X[i] - 68} y={142} width={136} height={56} rx={12} fill={colors.PANEL} stroke={active ? colors.ACCENT : colors.GRID} strokeWidth={active ? 2.4 : 1.2} />
            <text x={PHASE_X[i]} y={176} textAnchor="middle" fill={active ? colors.ACCENT : colors.TEXT} fontFamily={MONO} fontSize={15}>{phase}</text>
          </g>
        );
      })}
      <text x={82} y={115} fill={colors.MUTED} fontSize={12} letterSpacing="0.12em">VERSIONED RUNBOOK · runbook.yaml</text>
    </g>
  );
}

function RuntimeCard({ u, pointer, curU, dim }: { u: number; pointer: number; curU: number; dim: number }) {
  if (u <= 0.002) return null;
  const phase = pointer < 0.5 ? 'execute' : 'verify';
  const entry = pointer < 0.5 ? 'entry-e3a1' : 'entry-f902';
  const pop = 1 + Math.sin(curU * Math.PI) * 0.025;
  return (
    <g opacity={u * dim} transform={`translate(0 ${lerp(16, 0, u)}) scale(${pop})`}>
      <rect x={385} y={238} width={510} height={142} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={412} y={268} fill={colors.MUTED} fontSize={11} letterSpacing="0.11em">PER-RUN STATE · .statem/runs/demo/state.json</text>
      <text x={420} y={306} fill={colors.MUTED} fontFamily={MONO} fontSize={14}>current</text>
      <text x={610} y={306} fill={colors.ACCENT} fontFamily={MONO} fontSize={17}>{phase}</text>
      <text x={420} y={334} fill={colors.MUTED} fontFamily={MONO} fontSize={14}>current_entry_id</text>
      <text x={610} y={334} fill={colors.SECONDARY} fontFamily={MONO} fontSize={14}>{entry}</text>
      <text x={420} y={362} fill={colors.MUTED} fontFamily={MONO} fontSize={14}>history</text>
      <text x={610} y={362} fill={colors.POSITIVE} fontFamily={MONO} fontSize={14}>{pointer < 0.5 ? '12 events' : '13 events'}</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const planU = s.get(scene.planU);
  const traceU = s.get(scene.traceU);
  const planDim = s.get(scene.planDim);
  const ambigU = s.get(scene.ambigU);
  const graphU = s.get(scene.graphU);
  const stateU = s.get(scene.stateU);
  const pointer = s.get(scene.pointer);
  const curU = s.get(scene.curU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);
  const dim = 1 - endDim * 0.9;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          {graphU < 0.01 && (
            <g opacity={planU * (1 - planDim * 0.72)}>
              {PHASES.slice(0, -1).map((_, i) => (
                <line key={i} x1={PHASE_X[i] + 70} y1={190} x2={PHASE_X[i + 1] - 70} y2={190} stroke={colors.GRID} strokeWidth={2} />
              ))}
              {PHASES.map((phase, i) => (
                <g key={phase} opacity={clamp01(planU * 5 - i)}>
                  <rect x={PHASE_X[i] - 70} y={160} width={140} height={60} rx={12} fill={colors.PANEL} stroke={i === 0 ? colors.ACCENT : colors.GRID} strokeWidth={1.5} />
                  <text x={PHASE_X[i]} y={196} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={15}>{phase}</text>
                </g>
              ))}
              <text x={84} y={122} fill={colors.MUTED} fontSize={12} letterSpacing="0.12em">THE PLAN</text>
            </g>
          )}

          <g>
            <line x1={76} y1={515} x2={1205} y2={515} stroke={colors.GRID} strokeWidth={1} opacity={0.5} />
            {TRACE.map((token, i) => {
              const u = clamp01(traceU - i);
              if (u <= 0) return null;
              const tokenDim = token.plan ? 1 - planDim * 0.72 : 1;
              return <rect key={i} x={token.x} y={token.y} width={token.w} height={12} rx={3} fill={token.color} opacity={u * tokenDim * 0.78} />;
            })}
            <text x={84} y={404} fill={colors.MUTED} fontSize={12} letterSpacing="0.12em" opacity={clamp01(traceU / 8)}>APPEND-ONLY EXECUTION TRACE</text>
          </g>

          {ambigU > 0 && (
            <g opacity={clamp01(ambigU)}>
              {['execute?', 'repair?', 'verify?'].map((label, i) => (
                <g key={label} transform={`translate(${500 + i * 145} ${568 + (i % 2) * 10}) scale(${0.9 + 0.1 * clamp01(ambigU)})`}>
                  <rect x={-56} y={-17} width={112} height={34} rx={17} fill={colors.PANEL} stroke={i === 1 ? colors.WARM : colors.NEGATIVE} strokeWidth={1.2} />
                  <text y={5} textAnchor="middle" fill={i === 1 ? colors.WARM : colors.NEGATIVE} fontFamily={MONO} fontSize={13}>{label}</text>
                </g>
              ))}
            </g>
          )}
        </g>

        <PhaseGraph u={graphU} pointer={pointer} dim={dim} />
        <RuntimeCard u={stateU} pointer={pointer} curU={curU} dim={dim} />
        {s.get(scene.splitU) > 0 && (
          <text x={640} y={410} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={s.get(scene.splitU) * dim}>shared definition above · private execution record below</text>
        )}

        {curU > 0.05 && (
          <g opacity={clamp01(curU) * dim}>
            <rect x={930} y={248} width={245} height={124} rx={14} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.4} />
            <text x={952} y={275} fill={colors.POSITIVE} fontFamily={MONO} fontSize={14}>statem cur --json</text>
            <text x={952} y={307} fill={colors.TEXT} fontSize={13}>prompt · verify the candidate</text>
            <text x={952} y={333} fill={colors.TEXT} fontSize={13}>before_transfer · 2 checks</text>
            <text x={952} y={359} fill={colors.TEXT} fontSize={13}>next · handoff or repair</text>
          </g>
        )}

        {endU > 0 && (
          <g opacity={endU}>
            <rect x={250} y={215} width={780} height={250} rx={24} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.6} />
            <text x={640} y={290} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>THE RUN HAS AN AUTHORITATIVE PLACE</text>
            <text x={640} y={338} textAnchor="middle" fill={colors.TEXT} fontSize={18}>broad autonomy inside the phase</text>
            <line x1={470} y1={370} x2={810} y2={370} stroke={colors.GRID} />
            <text x={640} y={407} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>durable state at the boundary</text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
