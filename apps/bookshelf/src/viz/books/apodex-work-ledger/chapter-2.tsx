// Grounding: frontier_agent/components/agent_bus/bus.py;
// frontier_agent/components/agent_bus/spawn_guard.py; plugins/tools/assign_task.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const AGENTS = [
  { name: 'researcher', x: 930, y: 172, color: colors.ACCENT },
  { name: 'code-reader', x: 1100, y: 292, color: colors.SECONDARY },
  { name: 'verifier', x: 1035, y: 472, color: colors.POSITIVE },
  { name: 'publisher', x: 830, y: 520, color: colors.WARM },
];
const WORK = Array.from({ length: 8 }, (_, i) => ({ id: `t${i + 1}`, color: AGENTS[i % 4].color }));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const workP = tl.channel('work items', 0);
  const sessionsP = tl.channel('persistent sessions', 0);
  const precheckU = tl.channel('depth and token precheck', 0);
  const slotsU = tl.channel('semaphore slots', 0);
  const dispatchP = tl.channel('parallel dispatch', 0);
  const queueU = tl.channel('session fifo queue', 0);
  const failureU = tl.channel('failed worker', 0);
  const releaseP = tl.channel('slot release', 0);
  const capP = tl.channel('five task cap', 0);
  const close = tl.channel('bounded finish', 0);

  tl.caption({ at: 0.4, dur: 6.1, text: 'Once the board is ready, independent work items can leave the coordinator together.' });
  tl.tween(workP, 8, { at: 0.9, dur: 3.2, ease: ease.enter });

  tl.caption({ at: 6.9, dur: 6.2, text: 'Agent Team first registers persistent sessions, so each specialist can receive a serial stream of follow-up work.' });
  tl.tween(sessionsP, 4, { at: 7.6, dur: 2.4, ease: ease.enter });
  tl.tween(cam, { x: 944, y: 332, k: 1.12 }, { at: 9.7, dur: 1.2, ease: ease.move });

  tl.caption({ at: 13.5, dur: 6.4, text: 'Before any item runs, the spawn guard checks depth and reserves its estimated token budget.' });
  tl.tween(precheckU, 1, { at: 14.2, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 620, y: 330, k: 1.08 }, { at: 16.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 20.3, dur: 6.4, text: 'A semaphore then opens only the allowed number of parallel slots. Extra work queues instead of disappearing.' });
  tl.tween(slotsU, 1, { at: 21.0, dur: 1.0, ease: ease.pop });
  tl.tween(dispatchP, 4, { at: 22.2, dur: 3.0, ease: ease.linear });

  tl.caption({ at: 27.1, dur: 6.3, text: 'Four admitted items run at once, each carrying the same board lineage into a different specialist.' });
  tl.tween(dispatchP, 8, { at: 27.8, dur: 4.2, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 30.7, dur: 1.3, ease: ease.move });

  tl.caption({ at: 33.8, dur: 6.2, text: 'If a session is already busy, its next assignment waits first in, first out behind the current task.' });
  tl.tween(queueU, 1, { at: 34.5, dur: 1.1, ease: ease.enter });
  tl.tween(cam, { x: 910, y: 500, k: 1.14 }, { at: 36.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 40.4, dur: 6.4, text: 'A failed worker still returns its reservation in a finally block, so one exception cannot leak a slot.' });
  tl.tween(failureU, 1, { at: 41.1, dur: 0.55, ease: ease.pop });
  tl.tween(releaseP, 1, { at: 42.1, dur: 1.5, ease: ease.move });

  tl.caption({ at: 47.2, dur: 6.4, text: 'Persistent sessions stop accepting new assignments after five tasks, before stale history can dominate fresh work.' });
  tl.tween(capP, 5, { at: 47.9, dur: 2.8, ease: ease.enter });
  tl.tween(cam, { x: 1034, y: 305, k: 1.08 }, { at: 50.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 54.0, dur: 6.5, text: 'This is coordination scaling with limits: more work can proceed together, but depth, tokens, time, and parallelism remain finite.' });
  tl.tween(cam, CAMERA_HOME, { at: 53.6, dur: 1.0, ease: ease.move });
  tl.tween(close, 1, { at: 54.8, dur: 1.1, ease: ease.move });
  tl.hold(60.8, 1.0);

  return { tl, cam, workP, sessionsP, precheckU, slotsU, dispatchP, queueU, failureU, releaseP, capP, close };
}

const scene = buildScene();

function WorkBead({ x, y, label, color, opacity = 1 }: { x: number; y: number; label: string; color: string; opacity?: number }) {
  return <g opacity={opacity}>
    <circle cx={x} cy={y} r="17" fill={color} />
    <text x={x} y={y + 5} textAnchor="middle" fill="#08101e" fontSize="12" fontWeight="900">{label}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const dispatch = s.get(scene.dispatchP);
  const workP = s.get(scene.workP);
  const sessionsP = s.get(scene.sessionsP);
  const slotsU = s.get(scene.slotsU);
  const release = s.get(scene.releaseP);
  const failure = s.get(scene.failureU) * (1 - release);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="66" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="800">Fan out through a finite gate</text>

      <g>
        <text x="112" y="134" fill={colors.WARM} fontSize="15" fontWeight="700">board work items</text>
        {WORK.map((item, i) => {
          const u = clamp01(workP - i);
          const lane = i % 4;
          const travel = clamp01(dispatch - i);
          const sx = 112 + (i % 2) * 54;
          const sy = 178 + Math.floor(i / 2) * 76;
          const tx = 640 + Math.cos(-Math.PI / 2 + lane * Math.PI / 2) * 84;
          const ty = 326 + Math.sin(-Math.PI / 2 + lane * Math.PI / 2) * 84;
          const agent = AGENTS[lane];
          const second = clamp01((travel - 0.45) / 0.55);
          const x = travel < 0.5 ? sx + (tx - sx) * travel * 2 : tx + (agent.x - tx) * second;
          const y = travel < 0.5 ? sy + (ty - sy) * travel * 2 : ty + (agent.y - ty) * second;
          return <WorkBead key={item.id} x={x} y={y} label={item.id} color={item.color} opacity={u} />;
        })}
      </g>

      <g opacity={s.get(scene.precheckU)}>
        <circle cx="640" cy="326" r="128" fill="none" stroke={colors.WARM} strokeWidth="3" strokeDasharray="10 9" />
        <text x="640" y="161" textAnchor="middle" fill={colors.WARM} fontSize="15" fontFamily={colors.font.mono}>SpawnGuard.pre_check()</text>
        <text x="640" y="184" textAnchor="middle" fill={colors.MUTED} fontSize="13">depth · reserved tokens</text>
      </g>

      <g opacity={slotsU}>
        <circle cx="640" cy="326" r="92" fill="#0d1526" stroke={colors.ACCENT} strokeWidth="5" />
        <circle cx="640" cy="326" r="42" fill="#111c31" stroke={colors.GRID} strokeWidth="3" />
        {AGENTS.map((a, i) => {
          const angle = -Math.PI / 2 + i * Math.PI / 2;
          const x = 640 + Math.cos(angle) * 72;
          const y = 326 + Math.sin(angle) * 72;
          return <g key={a.name}>
            <circle cx={x} cy={y} r="20" fill={failure > 0 && i === 1 ? colors.NEGATIVE : a.color} opacity="0.95" />
            <text x={x} y={y + 5} textAnchor="middle" fill="#07101d" fontSize="13" fontWeight="900">{failure > 0 && i === 1 ? '×' : i + 1}</text>
          </g>;
        })}
        <text x="640" y="332" textAnchor="middle" fill={colors.TEXT} fontSize="14" fontWeight="800">4 slots</text>
        <text x="640" y="447" textAnchor="middle" fill={colors.ACCENT} fontSize="14" fontFamily={colors.font.mono}>acquire_slot()</text>
      </g>

      {AGENTS.map((agent, i) => {
        const u = clamp01(sessionsP - i);
        return <g key={agent.name} opacity={u} transform={`translate(${(1 - u) * 48} 0)`}>
          <rect x={agent.x - 74} y={agent.y - 34} width="148" height="68" rx="20" fill="#111827" stroke={failure > 0 && i === 1 ? colors.NEGATIVE : agent.color} strokeWidth="3" />
          <text x={agent.x} y={agent.y - 3} textAnchor="middle" fill={agent.color} fontSize="15" fontWeight="800">{agent.name}</text>
          <text x={agent.x} y={agent.y + 21} textAnchor="middle" fill={colors.MUTED} fontSize="12">persistent session</text>
        </g>;
      })}

      <g opacity={s.get(scene.queueU)}>
        <path d="M764 538 H1012" stroke={colors.GRID} strokeWidth="8" strokeLinecap="round" />
        <text x="888" y="590" textAnchor="middle" fill={colors.MUTED} fontSize="14">pending_tasks · FIFO</text>
        <WorkBead x={846} y={538} label="t7" color={colors.POSITIVE} />
        <WorkBead x={912} y={538} label="t8" color={colors.WARM} />
      </g>

      <g opacity={release}>
        <path d="M1100 258 C1040 180 850 125 708 240" fill="none" stroke={colors.POSITIVE} strokeWidth="5" strokeDasharray={`${Math.max(1, release * 430)} 450`} />
        <text x="897" y="128" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>finally: release(job_id)</text>
      </g>

      <g opacity={clamp01(s.get(scene.capP))}>
        <text x="980" y="88" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>MAX_TASKS_PER_SESSION = 5</text>
        {Array.from({ length: 5 }, (_, i) => {
          const u = clamp01(s.get(scene.capP) - i);
          return <rect key={i} x={850 + i * 54} y="102" width="42" height="18" rx="9" fill={u > 0 ? colors.WARM : colors.GRID} opacity={0.35 + 0.65 * u} />;
        })}
      </g>
    </g>

    <g opacity={close}>
      <rect x="206" y="142" width="868" height="386" rx="40" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <text x="640" y="214" textAnchor="middle" fill={colors.TEXT} fontSize="38" fontWeight="850">parallel does not mean unbounded</text>
      {['depth', 'tokens', 'time', 'slots'].map((label, i) => <g key={label} transform={`translate(${382 + i * 172} 350)`}>
        <circle r="56" fill="#111827" stroke={[colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.WARM][i]} strokeWidth="4" />
        <text y="6" textAnchor="middle" fill={colors.TEXT} fontSize="18" fontWeight="800">{label}</text>
      </g>)}
      <text x="640" y="462" textAnchor="middle" fill={colors.MUTED} fontSize="22">every reservation has a gate and a return path</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
