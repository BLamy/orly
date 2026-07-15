// Book scene — replay-qa, chapter 5: "Inside the Loop".
// One stage, 7 beats: createTask() enqueues work and pokes the one spawner
// (beat 0), the spawner steals a pre-warmed container from the pool and tops
// it back up (beat 1), allocation binds that container to one project for
// life (beat 2), claimNextTask() hands it ONLY its own project's tasks —
// FOR UPDATE SKIP LOCKED (beat 3), the container drives the app and records
// the whole run (beat 4), findings land as bugs with the recording attached
// (beat 5), and the closer re-queues the loop end to end (beat 6).
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, NodeBadge, Packet, ServiceNode, Zone } from '../../primitives';
import { RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

const CALLERS = [
  { x: 130, y: 80, label: 'journey resolve' },
  { x: 130, y: 150, label: 'exploration' },
];
const QUEUE = { x: 250, y: 300 };
const SPAWNER = { x: 590, y: 110 };
const POOL = { x: 430, y: 220, w: 330, h: 210 };
// 3×2 grid of warm containers inside the pool
const CELL = 52;
const POOL_POS = Array.from({ length: 6 }, (_, i) => ({
  x: POOL.x + 62 + (i % 3) * 105,
  y: POOL.y + 70 + Math.floor(i / 3) * 90,
}));
const STOLEN = 5; // the pool slot the spawner steals
const WORKER = { x: 950, y: 330 };
const APP = { x: 1150, y: 130 };
const STRIP = { x: 690, y: 545, w: 510, h: 26 };
const BUG = { x: 250, y: 545 };

const POINTS: RecordingPoint[] = [
  { at: 0.08, kind: 'interaction' },
  { at: 0.18, kind: 'network' },
  { at: 0.28, kind: 'render' },
  { at: 0.4, kind: 'interaction' },
  { at: 0.52, kind: 'network' },
  { at: 0.64, kind: 'exception', label: 'crash' },
  { at: 0.76, kind: 'render' },
  { at: 0.88, kind: 'interaction' },
];

// task chips waiting in the queue: project A (this worker's) and project B
const TASK_A = { x: QUEUE.x + 88, y: QUEUE.y - 26 };
const TASK_B = { x: QUEUE.x + 88, y: QUEUE.y + 26 };

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const callerU = CALLERS.map((_, i) => tl.channel(`caller${i}U`, 0));
  const queueU = tl.channel('queueU', 0);
  const enqueueU = tl.channel('enqueueU', 0);
  const taskAU = tl.channel('taskAU', 0);
  const taskBU = tl.channel('taskBU', 0);
  const triggerU = tl.channel('triggerU', 0);
  const spawnerU = tl.channel('spawnerU', 0);

  const poolU = tl.channel('poolU', 0);
  const cellU = tl.channel('cellU', 0);
  const stealU = tl.channel('stealU', 0);
  const topupU = tl.channel('topupU', 0);
  const stealChipU = tl.channel('stealChipU', 0);

  const bindChipU = tl.channel('bindChipU', 0);
  const bindNoteU = tl.channel('bindNoteU', 0);

  const claimAU = tl.channel('claimAU', 0);
  const claimBU = tl.channel('claimBU', 0);
  const skipChipU = tl.channel('skipChipU', 0);

  const appU = tl.channel('appU', 0);
  const driveU = tl.channel('driveU', 0);
  const driveFlow = tl.channel('driveFlow', 0);
  const stripU = tl.channel('stripU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const promptChipU = tl.channel('promptChipU', 0);

  const excPop = tl.channel('excPop', 0);
  const bugPktU = tl.channel('bugPktU', 0);
  const bugU = tl.channel('bugU', 0);
  const dropNoteU = tl.channel('dropNoteU', 0);

  const requeueU = tl.channel('requeueU', 0);
  const requeueFlow = tl.channel('requeueFlow', 0);
  const recapU = tl.channel('recapU', 0);

  // BEAT 0 — every piece of work becomes a queued task; every enqueue pokes the spawner
  tl.caption({ at: 0.4, dur: 4.5, text: 'Every piece of work becomes a task — and every enqueue pokes the spawner.' });
  CALLERS.forEach((_, i) => tl.tween(callerU[i], 1, { at: 0.6 + i * 0.25, dur: 0.6, ease: ease.enter }));
  tl.tween(queueU, 1, { at: 1.3, dur: 0.6, ease: ease.enter });
  tl.tween(enqueueU, 1, { at: 2.2, dur: 1.4, ease: ease.linear });
  tl.tween(taskAU, 1, { at: 3.6, dur: 0.5, ease: ease.pop });
  tl.tween(taskBU, 1, { at: 4.2, dur: 0.5, ease: ease.pop });
  tl.tween(spawnerU, 1, { at: 4.9, dur: 0.6, ease: ease.enter });
  tl.tween(triggerU, 1, { at: 5.7, dur: 1.4, ease: ease.linear });
  tl.hold(8.2, 1.0);

  // BEAT 1 — steal a pre-warmed container; top the pool back up
  tl.caption({ at: 9.2, dur: 4.5, text: 'The spawner steals a pre-warmed container — then tops the pool back up.' });
  tl.tween(poolU, 1, { at: 9.5, dur: 1.0, ease: ease.draw });
  tl.tween(cellU, 1, { at: 10.5, dur: 1.4, ease: ease.linear });
  tl.tween(stealU, 1, { at: 12.4, dur: 1.3, ease: ease.move });
  tl.tween(stealChipU, 1, { at: 13.0, dur: 0.6, ease: ease.enter });
  tl.tween(topupU, 1, { at: 14.4, dur: 0.8, ease: ease.enter });
  tl.hold(17.2, 0.8);

  // BEAT 2 — bound to one project, once, for life
  tl.caption({ at: 18.2, dur: 4.5, text: 'Allocation binds the container to one project — once, for life.' });
  tl.tween(bindChipU, 1, { at: 18.8, dur: 0.5, ease: ease.pop });
  tl.tween(bindNoteU, 1, { at: 20.2, dur: 0.6, ease: ease.enter });
  tl.hold(26.2, 0.8);

  // BEAT 3 — project-scoped dispatch: prj_A passes, prj_B bounces
  tl.caption({ at: 27.2, dur: 4.5, text: 'claimNextTask() is project-scoped: only prj_A tasks reach this worker.' });
  tl.tween(claimAU, 1, { at: 27.8, dur: 1.8, ease: ease.linear });
  tl.tween(claimBU, 1, { at: 30.2, dur: 2.4, ease: ease.linear });
  tl.tween(skipChipU, 1, { at: 31.2, dur: 0.5, ease: ease.pop });
  tl.hold(35.2, 1.0);

  // BEAT 4 — drive the app; record the entire run
  tl.caption({ at: 36.2, dur: 4.5, text: 'The container drives your app and records the whole run — app.replay.io.' });
  tl.tween(appU, 1, { at: 36.5, dur: 0.6, ease: ease.enter });
  tl.tween(driveU, 1, { at: 37.3, dur: 1.0, ease: ease.draw });
  tl.tween(promptChipU, 1, { at: 38.0, dur: 0.5, ease: ease.pop });
  tl.tween(driveFlow, 3, { at: 38.3, dur: 5.5, ease: ease.linear });
  tl.tween(stripU, 1, { at: 38.6, dur: 1.2, ease: ease.draw });
  tl.tween(sweepU, 0.9, { at: 40.0, dur: 3.4, ease: ease.linear });
  tl.hold(43.6, 1.0);

  // BEAT 5 — bugs carry the recording; a dead recording never ships
  tl.caption({ at: 44.6, dur: 4.5, text: 'Findings become bugs with the recording attached — never a dead link.' });
  tl.tween(excPop, 1, { at: 45.0, dur: 0.5, ease: ease.pop });
  tl.tween(bugPktU, 1, { at: 45.8, dur: 1.4, ease: ease.linear });
  tl.tween(bugU, 1, { at: 47.2, dur: 0.6, ease: ease.enter });
  tl.tween(dropNoteU, 1, { at: 48.4, dur: 0.6, ease: ease.enter });
  tl.hold(52.0, 1.0);

  // BEAT 6 — the engine keeps turning: resolve re-queues the journey
  tl.caption({ at: 53.0, dur: 5.0, text: 'Task → warm container → drive, record, file bugs — re-queue on resolve.' });
  tl.tween(requeueU, 1, { at: 53.4, dur: 1.2, ease: ease.draw });
  tl.tween(requeueFlow, 3, { at: 54.6, dur: 6.5, ease: ease.linear });
  tl.tween(recapU, 1, { at: 55.6, dur: 0.6, ease: ease.enter });
  tl.hold(61.8, 1.2);

  return {
    tl,
    callerU, queueU, enqueueU, taskAU, taskBU, triggerU, spawnerU,
    poolU, cellU, stealU, topupU, stealChipU,
    bindChipU, bindNoteU,
    claimAU, claimBU, skipChipU,
    appU, driveU, driveFlow, stripU, sweepU, promptChipU,
    excPop, bugPktU, bugU, dropNoteU,
    requeueU, requeueFlow, recapU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

function Chip({ x, y, text, u, color, filled = false }: { x: number; y: number; text: string; u: number; color: string; filled?: boolean }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * 6.9 + 22;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * -6})`} opacity={uu}>
      <rect x={-w / 2} y={-12} width={w} height={24} rx={12} fill={filled ? color : colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fill={filled ? colors.BG : color} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** One container square — warm (grey) until bound to a project (tinted). */
function Container({ x, y, u, tint, label }: { x: number; y: number; u: number; tint: number; label?: string }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const t = clamp01(tint);
  const stroke = t > 0.5 ? colors.ACCENT : colors.MUTED;
  return (
    <g transform={`translate(${x}, ${y}) scale(${0.7 + 0.3 * uu})`} opacity={uu}>
      <rect x={-CELL / 2} y={-CELL / 2} width={CELL} height={CELL} rx={10} fill={colors.PANEL} stroke={stroke} strokeWidth={2} />
      <rect x={-CELL / 2 + 8} y={-CELL / 2 + 8} width={CELL - 16} height={10} rx={3} fill={stroke} opacity={0.25 + 0.45 * t} />
      <rect x={-CELL / 2 + 8} y={-CELL / 2 + 24} width={CELL - 16} height={10} rx={3} fill={stroke} opacity={0.15 + 0.35 * t} />
      {label && (
        <text y={CELL / 2 + 18} textAnchor="middle" fill={t > 0.5 ? colors.ACCENT : colors.MUTED} fontSize={11.5} fontFamily={mono}>
          {label}
        </text>
      )}
    </g>
  );
}

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  const cellProgress = s.get(scene.cellU);
  const stealU = clamp01(s.get(scene.stealU));
  const stolen = {
    x: lerp(POOL_POS[STOLEN].x, WORKER.x, stealU),
    y: lerp(POOL_POS[STOLEN].y, WORKER.y, stealU),
  };

  // prj_B's claim attempt: out 40% of the way, then bounced straight back
  const bU = clamp01(s.get(scene.claimBU));
  const bReach = bU <= 0.5 ? (bU / 0.5) * 0.4 : 0.4 * (1 - (bU - 0.5) / 0.5);
  const bPos = {
    x: lerp(TASK_B.x, WORKER.x - 60, bReach),
    y: lerp(TASK_B.y, WORKER.y + 30, bReach),
  };

  return (
    <>
      {/* work arrives: createTask() → tasks, then poke the spawner */}
      {CALLERS.map((c, i) => (
        <g key={c.label}>
          <NodeBadge x={c.x} y={c.y} w={175} h={40} label={c.label} color={colors.MUTED} u={s.get(scene.callerU[i])} labelSize={13} />
          <Packet
            from={{ x: c.x + 40, y: c.y + 22 }}
            to={{ x: QUEUE.x - 20, y: QUEUE.y - 40 }}
            u={s.get(scene.enqueueU)}
            color={colors.ACCENT}
            label={i === 0 ? 'createTask()' : undefined}
          />
        </g>
      ))}
      <ServiceNode {...QUEUE} kind="queue" label="tasks" sublabel="queued work" u={s.get(scene.queueU)} />
      <Chip x={TASK_A.x} y={TASK_A.y} text="task · prj_A" u={s.get(scene.taskAU) * (1 - clamp01(s.get(scene.claimAU)) * 3)} color={colors.ACCENT} />
      <Chip x={TASK_B.x} y={TASK_B.y} text="task · prj_B" u={s.get(scene.taskBU) * (1 - bU)} color={colors.WARM} />
      <Packet
        from={{ x: QUEUE.x + 30, y: QUEUE.y - 44 }}
        to={{ x: SPAWNER.x - 165, y: SPAWNER.y + 72 }}
        u={s.get(scene.triggerU)}
        color={colors.SECONDARY}
        label="triggerSpawnForProject()"
      />
      <ServiceNode {...SPAWNER} w={265} kind="fn" label="spawn-workers-background" sublabel="the only spawner" u={s.get(scene.spawnerU)} />

      {/* the warm pool — steal one, top it back up */}
      <Zone {...POOL} label="warm pool · POOL_SIZE = 6" kind="group" u={s.get(scene.poolU)} />
      {POOL_POS.map((p, i) => {
        if (i === STOLEN) return null;
        return <Container key={i} x={p.x} y={p.y} u={clamp01(cellProgress * 6 - i)} tint={0} />;
      })}
      <Container x={POOL_POS[STOLEN].x} y={POOL_POS[STOLEN].y} u={s.get(scene.topupU)} tint={0} label="topped up" />
      <Chip x={SPAWNER.x + 40} y={SPAWNER.y + 64} text="stealPoolContainer() — or spawn a new Fly worker" u={s.get(scene.stealChipU)} color={colors.SECONDARY} />

      {/* the stolen container becomes THE worker — bound for life */}
      <Container x={stolen.x} y={stolen.y} u={clamp01(cellProgress * 6 - STOLEN)} tint={stealU} label={stealU >= 1 ? 'worker' : undefined} />
      <Chip x={WORKER.x} y={WORKER.y - 52} text="project_id = prj_A · pool → worker · for life" u={s.get(scene.bindChipU)} color={colors.ACCENT} filled />
      <Chip x={WORKER.x} y={WORKER.y + 62} text="no cross-project recording, auth, or session bleed" u={s.get(scene.bindNoteU)} color={colors.MUTED} />

      {/* project-scoped dispatch: prj_A passes, prj_B is skipped */}
      <Packet from={{ x: TASK_A.x, y: TASK_A.y }} to={{ x: WORKER.x - 40, y: WORKER.y - 10 }} u={s.get(scene.claimAU)} color={colors.ACCENT} label="claimNextTask()" />
      {bU > 0.01 && bU < 0.99 && <Chip x={bPos.x} y={bPos.y} text="task · prj_B" u={1} color={colors.WARM} />}
      <Chip x={(QUEUE.x + WORKER.x) / 2} y={WORKER.y + 140} text="FOR UPDATE SKIP LOCKED — not your project, not your task" u={s.get(scene.skipChipU)} color={colors.NEGATIVE} />

      {/* drive the app; capture the whole run as a recording */}
      <ServiceNode {...APP} kind="browser" label="your app" u={s.get(scene.appU)} />
      <Connection
        from={{ x: WORKER.x + 20, y: WORKER.y - 34 }}
        to={{ x: APP.x - 50, y: APP.y + 40 }}
        u={s.get(scene.driveU)}
        flow={s.get(scene.driveFlow)}
        label="drives"
      />
      <Chip x={WORKER.x + 60} y={WORKER.y - 120} text="buildQAPrompt / buildExplorationPrompt" u={s.get(scene.promptChipU)} color={colors.TEAL} />
      <RecordingStrip
        x={STRIP.x}
        y={STRIP.y}
        w={STRIP.w}
        h={STRIP.h}
        points={POINTS}
        u={s.get(scene.sweepU)}
        reveal={s.get(scene.stripU)}
        links={[{ at: 0.64, label: 'app.replay.io/recording/…', pop: s.get(scene.excPop) }]}
        title="the run, recorded end to end"
      />

      {/* the finding ships as a bug — with the recording attached */}
      <Packet
        from={{ x: STRIP.x + 0.64 * STRIP.w, y: STRIP.y - 8 }}
        to={{ x: BUG.x + 165, y: BUG.y }}
        u={s.get(scene.bugPktU)}
        color={colors.NEGATIVE}
        label="createBug()"
      />
      <NodeBadge {...BUG} w={330} h={54} label="bug — crash at checkout" sublabel="replay_recording_id ✓ attached" color={colors.NEGATIVE} u={s.get(scene.bugU)} />
      <Chip x={BUG.x} y={BUG.y + 46} text="unusable recording → dropped, never a dead link" u={s.get(scene.dropNoteU)} color={colors.MUTED} />

      {/* the closer: resolve re-queues the journey — the engine keeps turning */}
      <Connection
        from={{ x: BUG.x - 168, y: BUG.y }}
        to={{ x: QUEUE.x - 66, y: QUEUE.y + 10 }}
        via={[{ x: 60, y: BUG.y }, { x: 60, y: QUEUE.y + 10 }]}
        u={s.get(scene.requeueU)}
        flow={s.get(scene.requeueFlow)}
        color={colors.TEAL}
        dashed
      />
      <Chip x={215} y={432} text="journey-retry.ts → re-queue" u={s.get(scene.requeueU)} color={colors.TEAL} />
      <g opacity={clamp01(s.get(scene.recapU))}>
        <text x={660} y={638} textAnchor="middle" fill={colors.TEXT} fontSize={16.5} fontWeight={700} fontFamily={mono}>
          task → warm container (one project, for life) → drive · record · file bugs → re-queue
        </text>
      </g>
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/replay-qa/chapter-5', beat: i }
export const vizScene = () => scene;
