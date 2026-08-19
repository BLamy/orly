// StateM, chapter 3 — "Crash, Resume, Rebind"
//
// Grounding: arXiv:2608.15089 Sections 3.4-3.5; henryqin1997/statem
// design.md runtime-state and recovery sections; statem/core.py start(),
// _load_runtime(), _read_active(), _write_state(), prompt(), compact_prompt();
// integrations/hooks/statem_stop_hook.py. The code stores one state.json per
// run, writes through a temporary file and replace, refreshes spec path/hash on
// resume, appends a resume event, and exposes cur/history recovery commands.
//
// Centerpiece: a versioned runbook stencil creates independent per-run ledgers.
// A simulated context crash erases only the transient trace cloud. The active
// pointer, ledger cells, and history remain and re-anchor the same run.
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
const PHASES = ['plan', 'execute', 'review', 'handoff'] as const;
const PHASE_X = [205, 465, 725, 985];
const CONTEXT_LINES = Array.from({ length: 26 }, (_, i) => ({
  x: 140 + ((i * 97) % 950),
  y: 510 + ((i * 31) % 4) * 22,
  w: 36 + ((i * 19) % 74),
  color: [colors.MUTED, colors.ACCENT, colors.SECONDARY, colors.WARM][i % 4],
}));

const CAM_LEDGER: CameraState = { x: 640, y: 340, k: 1.08 };
const CAM_RESUME: CameraState = { x: 640, y: 360, k: 1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  stencilU: ChannelRef<number>;
  ledgersU: ChannelRef<number>;
  runPhase: ChannelRef<number>;
  historyU: ChannelRef<number>;
  contextU: ChannelRef<number>;
  crashU: ChannelRef<number>;
  activeU: ChannelRef<number>;
  resumeU: ChannelRef<number>;
  curU: ChannelRef<number>;
  hookU: ChannelRef<number>;
  stopU: ChannelRef<number>;
  scopeU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stencilU = tl.channel('stencilU', 0);
  const ledgersU = tl.channel('ledgersU', 0);
  const runPhase = tl.channel('runPhase', 0);
  const historyU = tl.channel('historyU', 0);
  const contextU = tl.channel('contextU', 0);
  const crashU = tl.channel('crashU', 0);
  const activeU = tl.channel('activeU', 0);
  const resumeU = tl.channel('resumeU', 0);
  const curU = tl.channel('curU', 0);
  const hookU = tl.channel('hookU', 0);
  const stopU = tl.channel('stopU', 0);
  const scopeU = tl.channel('scopeU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({
    at: 0.4,
    dur: 6.5,
    text: 'The runbook is reusable control logic. Each execution gets its own mutable ledger, so two agents can share the graph without sharing progress.',
  });
  tl.tween(cam, CAM_LEDGER, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(stencilU, 1, { at: 0.8, dur: 1.8, ease: ease.draw });
  tl.tween(ledgersU, 2, { at: 2.0, dur: 1.6, ease: ease.enter });
  tl.hold(6.9, 0.6);

  tl.caption({
    at: 7.5,
    dur: 6.4,
    text: 'As one run advances, every phase receives a fresh entry. The current pointer moves, while hook results and transition events accumulate behind it.',
  });
  tl.tween(runPhase, 2, { at: 8.0, dur: 3.4, ease: ease.move });
  tl.tween(historyU, 8, { at: 8.0, dur: 3.8, ease: ease.linear });
  tl.tween(activeU, 1, { at: 9.0, dur: 0.8, ease: ease.enter });
  tl.hold(13.9, 0.6);

  tl.caption({
    at: 14.5,
    dur: 6.4,
    text: 'The terminal trace keeps growing too. It is useful evidence, but it is a bad place to hide the only copy of the run’s position.',
  });
  tl.tween(contextU, 1, { at: 14.8, dur: 4.2, ease: ease.linear });
  tl.tween(historyU, 12, { at: 15.0, dur: 3.8, ease: ease.linear });
  tl.hold(20.9, 0.6);

  tl.caption({
    at: 21.5,
    dur: 6.0,
    text: 'Now the process restarts, or the model context is compacted. The transient trace disappears, but the runbook and per-run ledger do not.',
  });
  tl.tween(crashU, 1, { at: 21.8, dur: 0.8, ease: ease.pop });
  tl.tween(contextU, 0, { at: 22.2, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 23.6, dur: 1.3, ease: ease.move });
  tl.hold(27.5, 0.6);

  tl.caption({
    at: 28.1,
    dur: 6.4,
    text: 'Starting with the same run identifier reloads the specification, refreshes its path and identity, and appends a resume event.',
  });
  tl.tween(cam, CAM_RESUME, { at: 28.3, dur: 1.4, ease: ease.move });
  tl.tween(resumeU, 1, { at: 28.8, dur: 1.2, ease: ease.enter });
  tl.tween(historyU, 13, { at: 31.0, dur: 0.6, ease: ease.pop });
  tl.hold(34.5, 0.6);

  tl.caption({
    at: 35.1,
    dur: 6.5,
    text: 'A current-state query restores the active prompt, pending checks, and legal next states. Recent history restores the path that led here.',
  });
  tl.tween(crashU, 0, { at: 34.7, dur: 0.6, ease: ease.move });
  tl.tween(curU, 1, { at: 35.5, dur: 1.0, ease: ease.enter });
  tl.hold(41.6, 0.6);

  tl.caption({
    at: 42.2,
    dur: 6.3,
    text: 'The phase entry hook can then reload compact durable context. It reactivates what was persisted without pretending to recover hidden model thoughts.',
  });
  tl.tween(hookU, 1, { at: 42.6, dur: 1.3, ease: ease.draw });
  tl.tween(crashU, 0, { at: 43.8, dur: 1.0, ease: ease.move });
  tl.hold(48.5, 0.6);

  tl.caption({
    at: 49.1,
    dur: 6.4,
    text: 'A host stop hook uses the same record. Terminal or explicitly blocked runs may stop; unfinished runs return their phase and obligations to the agent.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 49.3, dur: 1.4, ease: ease.move });
  tl.tween(stopU, 1, { at: 49.8, dur: 1.4, ease: ease.enter });
  tl.hold(55.5, 0.6);

  tl.caption({
    at: 56.1,
    dur: 6.8,
    text: 'Recovery has a precise boundary. The runtime restores recorded control state, not work that was never saved and not arbitrary effects outside the runtime.',
  });
  tl.tween(scopeU, 1, { at: 56.5, dur: 1.2, ease: ease.enter });
  tl.hold(62.9, 0.6);

  tl.caption({
    at: 63.5,
    dur: 7.0,
    text: 'The ledger survives because it is deliberately small: current phase, evidence, and history. Enough to resume the run without asking the trace to remember everything.',
  });
  tl.tween(endDim, 1, { at: 63.8, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 64.8, dur: 0.9, ease: ease.enter });
  tl.hold(70.5, 1.2);

  return { tl, cam, stencilU, ledgersU, runPhase, historyU, contextU, crashU, activeU, resumeU, curU, hookU, stopU, scopeU, endDim, endU };
}

const scene = buildScene();

function RunbookStencil({ u, dim }: { u: number; dim: number }) {
  return (
    <g opacity={u * dim}>
      {PHASES.slice(0, -1).map((_, i) => <line key={i} x1={PHASE_X[i] + 54} y1={125} x2={PHASE_X[i + 1] - 54} y2={125} stroke={colors.GRID} strokeWidth={2} />)}
      {PHASES.map((phase, i) => (
        <g key={phase} opacity={clamp01(u * 5 - i)}>
          <rect x={PHASE_X[i] - 54} y={101} width={108} height={48} rx={10} fill="none" stroke={colors.SECONDARY} strokeWidth={1.4} strokeDasharray="5 5" />
          <text x={PHASE_X[i]} y={130} textAnchor="middle" fill={colors.SECONDARY} fontFamily={MONO} fontSize={12}>{phase}</text>
        </g>
      ))}
      <text x={100} y={72} fill={colors.MUTED} fontSize={12} letterSpacing="0.12em">STATIC SPEC · SHARED AND VERSIONED</text>
    </g>
  );
}

function LedgerLane({ y, label, u, phase, active, historyU, dim }: { y: number; label: string; u: number; phase: number; active: boolean; historyU: number; dim: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u * dim} transform={`translate(0 ${lerp(18, 0, u)})`}>
      <text x={86} y={y + 6} fill={active ? colors.ACCENT : colors.MUTED} fontFamily={MONO} fontSize={13}>{label}</text>
      <line x1={155} y1={y} x2={1050} y2={y} stroke={colors.GRID} strokeWidth={2} />
      {PHASES.map((phaseName, i) => {
        const reached = i <= Math.round(phase);
        const current = i === Math.round(phase);
        return (
          <g key={phaseName}>
            <rect x={PHASE_X[i] - 46} y={y - 25} width={92} height={50} rx={10} fill={reached ? colors.PANEL : colors.BG} stroke={current ? colors.ACCENT : reached ? colors.POSITIVE : colors.GRID} strokeWidth={current ? 2.4 : 1.2} opacity={reached ? 1 : 0.35} />
            <text x={PHASE_X[i]} y={y + 5} textAnchor="middle" fill={current ? colors.ACCENT : reached ? colors.TEXT : colors.MUTED} fontFamily={MONO} fontSize={11}>{phaseName}</text>
            {reached && <text x={PHASE_X[i]} y={y + 42} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={9}>{`entry-${i + 1}${active ? 'a' : 'b'}`}</text>}
          </g>
        );
      })}
      {active && (
        <g>
          {Array.from({ length: 13 }, (_, i) => {
            const eu = clamp01(historyU - i);
            return <rect key={i} x={165 + i * 19} y={y + 64} width={12} height={8} rx={2} fill={i === 12 ? colors.POSITIVE : colors.MUTED} opacity={eu * 0.8} />;
          })}
          <text x={165} y={y + 92} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>history events</text>
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const stencilU = s.get(scene.stencilU);
  const ledgersU = s.get(scene.ledgersU);
  const runPhase = s.get(scene.runPhase);
  const historyU = s.get(scene.historyU);
  const contextU = s.get(scene.contextU);
  const crashU = s.get(scene.crashU);
  const activeU = s.get(scene.activeU);
  const resumeU = s.get(scene.resumeU);
  const curU = s.get(scene.curU);
  const hookU = s.get(scene.hookU);
  const stopU = s.get(scene.stopU);
  const scopeU = s.get(scene.scopeU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);
  const dim = 1 - endDim * 0.9;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <RunbookStencil u={stencilU} dim={dim} />
        <LedgerLane y={260} label="run-a7" u={clamp01(ledgersU)} phase={runPhase} active historyU={historyU} dim={dim} />
        <LedgerLane y={405} label="run-b2" u={clamp01(ledgersU - 1)} phase={0} active={false} historyU={0} dim={dim} />

        {activeU > 0 && (
          <g opacity={activeU * dim}>
            <path d="M 1080 230 L 1145 260 L 1080 290" fill="none" stroke={colors.ACCENT} strokeWidth={3} />
            <text x={1160} y={255} fill={colors.ACCENT} fontFamily={MONO} fontSize={12}>active_run</text>
            <text x={1160} y={273} fill={colors.TEXT} fontFamily={MONO} fontSize={12}>run-a7</text>
          </g>
        )}

        <g opacity={contextU * dim}>
          {CONTEXT_LINES.map((line, i) => <rect key={i} x={line.x} y={line.y} width={line.w} height={9} rx={3} fill={line.color} opacity={0.25 + (i % 3) * 0.14} />)}
          <text x={100} y={488} fill={colors.MUTED} fontSize={11} letterSpacing="0.1em">TRANSIENT TERMINAL AND MODEL CONTEXT</text>
        </g>

        {crashU > 0.05 && (
          <g opacity={clamp01(crashU) * dim}>
            <path d="M 620 475 L 655 520 L 632 550 L 688 610" fill="none" stroke={colors.NEGATIVE} strokeWidth={5} strokeLinecap="round" />
            <text x={710} y={540} fill={colors.NEGATIVE} fontSize={17} fontWeight={700}>context lost</text>
          </g>
        )}

        {resumeU > 0 && (
          <g opacity={resumeU * dim} transform={`translate(0 ${lerp(12, 0, resumeU)})`}>
            <rect x={700} y={425} width={490} height={70} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
            <text x={725} y={453} fill={colors.POSITIVE} fontFamily={MONO} fontSize={12}>statem start runbook.yaml --run-id run-a7</text>
            <text x={725} y={479} fill={colors.TEXT} fontFamily={MONO} fontSize={11}>refresh spec identity · append resume event · current ← review</text>
          </g>
        )}

        {curU > 0 && (
          <g opacity={curU * dim}>
            <rect x={90} y={425} width={490} height={70} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
            <text x={115} y={453} fill={colors.ACCENT} fontFamily={MONO} fontSize={12}>statem cur · statem history</text>
            <text x={115} y={479} fill={colors.TEXT} fontSize={11}>prompt · pending checks · legal next states · recent history</text>
          </g>
        )}

        {hookU > 0 && (
          <g opacity={hookU * dim}>
            <path d="M 725 245 C 725 205, 985 205, 985 245" fill="none" stroke={colors.WARM} strokeWidth={3} strokeDasharray="7 6" />
            <text x={855} y={197} textAnchor="middle" fill={colors.WARM} fontFamily={MONO} fontSize={12}>in_hook · reload progress.md</text>
          </g>
        )}

        {stopU > 0 && (
          <g opacity={stopU * dim}>
            <rect x={430} y={486} width={420} height={108} rx={54} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
            <circle cx={484} cy={540} r={28} fill={colors.NEGATIVE} opacity={0.85} />
            <text x={484} y={546} textAnchor="middle" fill={colors.BG} fontWeight={800} fontSize={16}>STOP</text>
            <path d="M 525 540 L 710 540" stroke={colors.GRID} strokeWidth={3} />
            <path d="M 690 530 L 710 540 L 690 550" fill="none" stroke={colors.GRID} strokeWidth={3} />
            <text x={735} y={526} fill={colors.ACCENT} fontFamily={MONO} fontSize={12}>review</text>
            <text x={735} y={549} fill={colors.TEXT} fontSize={12}>unfinished</text>
            <text x={735} y={571} fill={colors.POSITIVE} fontSize={12}>continue the run</text>
          </g>
        )}

        {scopeU > 0 && (
          <g opacity={scopeU * dim}>
            <rect x={110} y={480} width={470} height={116} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} />
            <text x={135} y={514} fill={colors.POSITIVE} fontSize={14}>RECORDED CONTROL STATE</text>
            <text x={135} y={546} fill={colors.TEXT} fontSize={12}>current · entries · results · history</text>
            <rect x={700} y={480} width={470} height={116} rx={14} fill={colors.PANEL} stroke={colors.NEGATIVE} />
            <text x={725} y={514} fill={colors.NEGATIVE} fontSize={14}>NOT RECOVERED AUTOMATICALLY</text>
            <text x={725} y={546} fill={colors.TEXT} fontSize={12}>unsaved work · hidden context · external side effects</text>
          </g>
        )}

        {endU > 0 && (
          <g opacity={endU}>
            <rect x={255} y={210} width={770} height={270} rx={24} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.6} />
            <text x={640} y={286} textAnchor="middle" fill={colors.ACCENT} fontSize={23} fontWeight={700}>A SMALL LEDGER SURVIVES THE LONG RUN</text>
            <text x={640} y={340} textAnchor="middle" fill={colors.TEXT} fontSize={18}>current phase · evidence · recent history</text>
            <line x1={430} y1={375} x2={850} y2={375} stroke={colors.GRID} />
            <text x={640} y={416} textAnchor="middle" fill={colors.POSITIVE} fontSize={17}>enough to resume without reconstructing everything</text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
