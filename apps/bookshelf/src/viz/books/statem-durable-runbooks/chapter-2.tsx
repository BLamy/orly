// StateM, chapter 2 — "The Gate Before Goto"
//
// Grounding: arXiv:2608.15089 Sections 3.2-3.3 and Figure 2;
// henryqin1997/statem README.md "How it works"; design.md "Transition
// Transaction"; statem/core.py StatemRuntime.goto(), TransitionBlocked, and
// _run_dynamic_before_transfer(). The exact code runs pre-leave checks before
// out hooks, changes current only after blocking results pass, creates a new
// entry ID, and records goto or goto_blocked in history.
//
// Centerpiece: one transition token crosses the ordered goto protocol. A
// failed predicate physically returns it to execute while the state pointer
// stays fixed; repaired evidence lets the same request commit.
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

const RAIL_Y = 365;
const SOURCE_X = 105;
const TARGET_X = 1175;
const GATES = [
  { x: 260, top: 'before', bottom: 'transfer' },
  { x: 415, top: 'dynamic', bottom: 'checks' },
  { x: 570, top: 'edge', bottom: 'condition' },
  { x: 725, top: 'out', bottom: 'hook' },
  { x: 880, top: 'edge', bottom: 'hook' },
  { x: 1035, top: 'target', bottom: 'in_hook' },
] as const;

const CAM_FAIL: CameraState = { x: 415, y: 365, k: 1.55 };
const CAM_COMMIT: CameraState = { x: 930, y: 360, k: 1.22 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  nodesU: ChannelRef<number>;
  railU: ChannelRef<number>;
  gatesU: ChannelRef<number>;
  tokenX: ChannelRef<number>;
  failU: ChannelRef<number>;
  blockedU: ChannelRef<number>;
  repairU: ChannelRef<number>;
  passedU: ChannelRef<number>;
  persistU: ChannelRef<number>;
  commitU: ChannelRef<number>;
  entryU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const nodesU = tl.channel('nodesU', 0);
  const railU = tl.channel('railU', 0);
  const gatesU = tl.channel('gatesU', 0);
  const tokenX = tl.channel('tokenX', SOURCE_X);
  const failU = tl.channel('failU', 0);
  const blockedU = tl.channel('blockedU', 0);
  const repairU = tl.channel('repairU', 0);
  const passedU = tl.channel('passedU', 0);
  const persistU = tl.channel('persistU', 0);
  const commitU = tl.channel('commitU', 0);
  const entryU = tl.channel('entryU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({
    at: 0.4,
    dur: 6.2,
    text: 'Inside execute, the agent can reason and work freely. Crossing into verify is different: the run must request a legal transition.',
  });
  tl.tween(nodesU, 1, { at: 0.7, dur: 1.2, ease: ease.enter });
  tl.tween(railU, 1, { at: 1.4, dur: 1.5, ease: ease.draw });
  tl.hold(6.6, 0.6);

  tl.caption({
    at: 7.2,
    dur: 6.3,
    text: 'The transition request enters an ordered protocol. Static checks, current-entry checks, and the edge condition all run before the source state can be left.',
  });
  tl.tween(gatesU, 6, { at: 7.6, dur: 3.0, ease: ease.enter });
  tl.tween(tokenX, 390, { at: 9.0, dur: 2.0, ease: ease.linear });
  tl.hold(13.5, 0.6);

  tl.caption({
    at: 14.1,
    dur: 5.9,
    text: 'Here, a host-evaluated predicate asks for fresh evidence. The file is missing, so the gate closes.',
  });
  tl.tween(cam, CAM_FAIL, { at: 14.3, dur: 1.3, ease: ease.move });
  tl.tween(tokenX, 405, { at: 14.6, dur: 0.8, ease: ease.linear });
  tl.tween(failU, 1, { at: 15.2, dur: 0.45, ease: ease.pop });
  tl.hold(20.0, 0.6);

  tl.caption({
    at: 20.6,
    dur: 6.3,
    text: 'The token recoils. The run stays in execute with the same entry, and the failed attempt becomes a visible blocked event in history.',
  });
  tl.tween(tokenX, SOURCE_X, { at: 20.9, dur: 1.4, ease: ease.move });
  tl.tween(blockedU, 1, { at: 21.6, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 23.2, dur: 1.3, ease: ease.move });
  tl.hold(26.9, 0.6);

  tl.caption({
    at: 27.5,
    dur: 6.0,
    text: 'Repair changes the evidence, not the rule. The missing receipt is written, and the same transition can be tried again.',
  });
  tl.tween(repairU, 1, { at: 28.0, dur: 1.0, ease: ease.pop });
  tl.tween(failU, 0, { at: 29.2, dur: 0.8, ease: ease.move });
  tl.tween(tokenX, 600, { at: 30.0, dur: 3.0, ease: ease.linear });
  tl.tween(passedU, 3, { at: 30.0, dur: 3.0, ease: ease.linear });
  tl.hold(33.5, 0.6);

  tl.caption({
    at: 34.1,
    dur: 6.5,
    text: 'After the pre-leave gates pass, the out hook persists progress and the edge hook prepares the transfer. These steps still happen before commit.',
  });
  tl.tween(tokenX, 910, { at: 34.5, dur: 3.2, ease: ease.linear });
  tl.tween(passedU, 5, { at: 34.5, dur: 3.2, ease: ease.linear });
  tl.tween(persistU, 1, { at: 36.0, dur: 1.0, ease: ease.enter });
  tl.hold(40.6, 0.6);

  tl.caption({
    at: 41.2,
    dur: 6.2,
    text: 'Only now does the current phase flip to verify. A new target entry is created, and its entry hook refreshes the next phase’s context.',
  });
  tl.tween(cam, CAM_COMMIT, { at: 41.4, dur: 1.3, ease: ease.move });
  tl.tween(tokenX, TARGET_X, { at: 42.0, dur: 2.4, ease: ease.linear });
  tl.tween(passedU, 6, { at: 42.0, dur: 1.4, ease: ease.linear });
  tl.tween(commitU, 1, { at: 44.0, dur: 0.55, ease: ease.pop });
  tl.tween(entryU, 1, { at: 44.8, dur: 0.8, ease: ease.enter });
  tl.hold(47.4, 0.6);

  tl.caption({
    at: 48.0,
    dur: 6.5,
    text: 'The runtime calls this checked, logged, and recoverable. It delays its own state commit, but it cannot roll back arbitrary external side effects.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 48.2, dur: 1.4, ease: ease.move });
  tl.tween(persistU, 1.35, { at: 49.0, dur: 1.6, ease: ease.move });
  tl.hold(54.5, 0.6);

  tl.caption({
    at: 55.1,
    dur: 7.0,
    text: 'The important asymmetry is simple: a bug report is cheap to inspect, but a claim that the work is ready must cross the evidence gate.',
  });
  tl.tween(endDim, 1, { at: 55.4, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 56.4, dur: 0.9, ease: ease.enter });
  tl.hold(62.1, 1.2);

  return { tl, cam, nodesU, railU, gatesU, tokenX, failU, blockedU, repairU, passedU, persistU, commitU, entryU, endDim, endU };
}

const scene = buildScene();

function StateNode({ x, label, active, u }: { x: number; label: string; active: boolean; u: number }) {
  return (
    <g opacity={u}>
      <rect x={x - 70} y={76} width={140} height={58} rx={13} fill={colors.PANEL} stroke={active ? colors.ACCENT : colors.GRID} strokeWidth={active ? 2.2 : 1.2} />
      <text x={x} y={111} textAnchor="middle" fill={active ? colors.ACCENT : colors.TEXT} fontFamily={MONO} fontSize={15}>{label}</text>
    </g>
  );
}

function Gate({ gate, u, passed, failed }: { gate: (typeof GATES)[number]; u: number; passed: boolean; failed: boolean }) {
  if (u <= 0.002) return null;
  const color = failed ? colors.NEGATIVE : passed ? colors.POSITIVE : colors.MUTED;
  return (
    <g opacity={u} transform={`translate(0 ${lerp(-12, 0, u)})`}>
      <line x1={gate.x} y1={RAIL_Y - 82} x2={gate.x} y2={RAIL_Y + 82} stroke={color} strokeWidth={failed ? 5 : 3} />
      <rect x={gate.x - 55} y={RAIL_Y - 130} width={110} height={48} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={gate.x} y={RAIL_Y - 111} textAnchor="middle" fill={color} fontFamily={MONO} fontSize={11}>{gate.top}</text>
      <text x={gate.x} y={RAIL_Y - 96} textAnchor="middle" fill={color} fontFamily={MONO} fontSize={11}>{gate.bottom}</text>
      <circle cx={gate.x} cy={RAIL_Y + 106} r={7} fill={color} opacity={passed || failed ? 1 : 0.25} />
      {failed && <path d={`M ${gate.x - 22} ${RAIL_Y - 22} L ${gate.x + 22} ${RAIL_Y + 22} M ${gate.x + 22} ${RAIL_Y - 22} L ${gate.x - 22} ${RAIL_Y + 22}`} stroke={colors.NEGATIVE} strokeWidth={5} strokeLinecap="round" />}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const nodesU = s.get(scene.nodesU);
  const railU = s.get(scene.railU);
  const gatesU = s.get(scene.gatesU);
  const tokenX = s.get(scene.tokenX);
  const failU = s.get(scene.failU);
  const blockedU = s.get(scene.blockedU);
  const repairU = s.get(scene.repairU);
  const passedU = s.get(scene.passedU);
  const persistU = s.get(scene.persistU);
  const commitU = s.get(scene.commitU);
  const entryU = s.get(scene.entryU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);
  const dim = 1 - endDim * 0.9;
  const committed = commitU > 0.45;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <StateNode x={SOURCE_X} label="execute" active={!committed} u={nodesU} />
          <StateNode x={TARGET_X} label="verify" active={committed} u={nodesU} />
          <text x={SOURCE_X} y={160} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={12}>entry-e3a1</text>
          {entryU > 0 && <text x={TARGET_X} y={160} textAnchor="middle" fill={colors.SECONDARY} fontFamily={MONO} fontSize={12} opacity={entryU}>entry-f902 · new</text>}

          <line x1={SOURCE_X} y1={RAIL_Y} x2={lerp(SOURCE_X, TARGET_X, railU)} y2={RAIL_Y} stroke={colors.GRID} strokeWidth={4} strokeLinecap="round" />
          {GATES.map((gate, i) => (
            <Gate key={gate.x} gate={gate} u={clamp01(gatesU - i)} passed={passedU > i + 0.7} failed={i === 1 && failU > 0.3} />
          ))}

          {nodesU > 0 && (
            <g transform={`translate(${tokenX} ${RAIL_Y})`}>
              <circle r={16 + failU * 2} fill={failU > 0.3 ? colors.NEGATIVE : committed ? colors.POSITIVE : colors.ACCENT} />
              <circle r={25} fill="none" stroke={failU > 0.3 ? colors.NEGATIVE : colors.ACCENT} strokeWidth={2} opacity={0.35 + 0.35 * Math.sin(tokenX * 0.04)} />
              <text y={42} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={12}>goto verify</text>
            </g>
          )}

          {blockedU > 0 && (
            <g opacity={blockedU}>
              <rect x={70} y={500} width={325} height={80} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} />
              <text x={94} y={530} fill={colors.NEGATIVE} fontFamily={MONO} fontSize={13}>history += goto_blocked</text>
              <text x={94} y={557} fill={colors.MUTED} fontFamily={MONO} fontSize={12}>current: execute · entry-e3a1</text>
            </g>
          )}

          {repairU > 0 && (
            <g opacity={repairU} transform={`translate(0 ${lerp(10, 0, repairU)})`}>
              <rect x={438} y={500} width={300} height={80} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={462} y={530} fill={colors.POSITIVE} fontFamily={MONO} fontSize={13}>evidence/receipt.json</text>
              <text x={462} y={557} fill={colors.TEXT} fontFamily={MONO} fontSize={12}>exists: true · non_empty: true</text>
            </g>
          )}

          {persistU > 0 && (
            <g opacity={clamp01(persistU)}>
              <rect x={790} y={500} width={402} height={80} rx={12} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={814} y={530} fill={colors.WARM} fontFamily={MONO} fontSize={13}>out_hook → progress receipt</text>
              <text x={814} y={557} fill={colors.MUTED} fontFamily={MONO} fontSize={12}>external effects require explicit retry or compensation</text>
            </g>
          )}
        </g>

        {endU > 0 && (
          <g opacity={endU}>
            <rect x={245} y={210} width={790} height={270} rx={24} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.6} />
            <text x={640} y={287} textAnchor="middle" fill={colors.POSITIVE} fontSize={23} fontWeight={700}>READY IS THE EXPENSIVE CLAIM</text>
            <text x={640} y={341} textAnchor="middle" fill={colors.TEXT} fontSize={18}>check evidence before the state moves</text>
            <line x1={435} y1={374} x2={845} y2={374} stroke={colors.GRID} />
            <text x={640} y={414} textAnchor="middle" fill={colors.MUTED} fontSize={16}>failed checks stay repairable in the source phase</text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
