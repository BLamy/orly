// Book scene — builder-critic-loop, chapter 4: "The Loop That Compounds".
// Zoom out from one task to the machine: evidence has two layers of time
// travel (the Replay recording and the durable stream's own event log,
// replayed to SHA-256 state digests), digest bisect binary-searches the
// first diverging offset, and the whole doctrine is runnable —
// work-queue.js composes implement-task.js and verify-task.js, honors the
// rework budget and thrash detection, flips invalid_loop loudly, and every
// verified task deposits promoted artifacts into the front gates. The loop
// runs on the very streams the repo is building. Full circle.
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, ServiceNode } from '../../primitives';
import { EventLane, GauntletRail, RecordingStrip } from '../../agent';
import type { LaneEvent, RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------- layout at module scope — 1280×720, bottom ~12% clear */

const STRIP = { x: 70, y: 120, w: 500 };
const LANE = { x1: 70, y1: 300, x2: 500, y2: 300 };
const DIGEST = { x: 570, y: 300 };
const POINTS: RecordingPoint[] = [
  { at: 0.12, kind: 'interaction', label: 'session' },
  { at: 0.38, kind: 'network', label: 'requests' },
  { at: 0.62, kind: 'render', label: 'paints' },
  { at: 0.85, kind: 'exception', label: '' },
];
const LANE_EVENTS: LaneEvent[] = [
  { label: 'set 0', kind: 'message', at: 0 },
  { label: 'increment', kind: 'tool', at: 0.22 },
  { label: 'increment', kind: 'tool', at: 0.44 },
  { label: 'push v24', kind: 'queue', at: 0.66 },
];

// the bisect grid: two 26-event logs, byte-identical until index 18
const BISECT = { x: 700, y: 132, w: 500, cell: 17, rows: { a: 0, b: 60 } };
const N_EVENTS = 26;
const DIVERGE_AT = 18;
// binary-search probe schedule (index, matches) — precomputed, deterministic
const PROBES: { idx: number; match: boolean }[] = [
  { idx: 13, match: true },
  { idx: 19, match: false },
  { idx: 16, match: true },
  { idx: 18, match: false },
  { idx: 17, match: true },
];

const WQ = { x: 190, y: 170 };
const IMPL = { x: 570, y: 170 };
const VERIFY = { x: 950, y: 170 };
const ATTACKERS = ['falsify ×2', 'coverage', 'mock hunt', 'sabotage', 'replay-critic'];
const PROJ = { x: 150, y: 372, w: 470, h: 130 };

const RAIL = { x: 170, y: 560, w: 940 };
const GATE_LABELS = ['fmt + lint', 'typecheck', 'tests', 'build', 'record', 'verify'];
const DEPOSIT_GATE = 2;

/* -------------------------------------------------------------- timeline */

export function buildScene() {
  const tl = new Timeline();

  // beat 0 — two layers of time travel
  const stripR = tl.channel('stripReveal', 0);
  const laneR = tl.channel('laneReveal', 0);
  const laneU = tl.channel('laneClock', 0);
  const digU = tl.channel('digestChip', 0);
  const layerU = tl.channel('layerLabels', 0);
  const gA = tl.channel('layersFade', 1);

  // beat 1 — digest bisect
  const gridU = tl.channel('bisectGrid', 0);
  const probeU = tl.channel('bisectProbes', 0);
  const divU = tl.channel('divergePop', 0);

  // beat 2 — the runnable loop
  const wqU = tl.channel('workQueueU', 0);
  const implU = tl.channel('implementU', 0);
  const verU = tl.channel('verifyU', 0);
  const c1U = tl.channel('conn1', 0);
  const c2U = tl.channel('conn2', 0);
  const flowU = tl.channel('connFlow', 0);
  const atkU = tl.channel('attackerChips', 0);
  const xU = tl.channel('crossExamine', 0);
  const gB = tl.channel('loopFade', 1);

  // beat 3 — rework budget + thrash
  const reworkU = tl.channel('reworkArc', 0);
  const retryU = tl.channel('retryChip', 0);
  const thrashU = tl.channel('thrashChip', 0);

  // beat 4 — invalid_loop, loudly
  const projE = tl.channel('projectEnter', 0);
  const flipU = tl.channel('statusFlip', 0);
  const humanU = tl.channel('humanNote', 0);

  // beat 5 — stricter every lap; full circle
  const railR = tl.channel('railReveal', 0);
  const tokU = tl.channel('railToken', -1);
  const gates = GATE_LABELS.map((_, i) => tl.channel(`gate${i}`, 0));
  const depU = tl.channel('deposit', 0);
  const circleU = tl.channel('fullCircle', 0);

  /* beat 0 — the recording, and the log the product writes about itself */
  let t = 0.4;
  t = tl.caption({ at: t, dur: 6.0, text: 'Two layers of time travel: the recording, and the stream’s own event log.' });
  tl.tween(stripR, 1, { at: t - 5.6, dur: 1.2, ease: ease.draw });
  tl.tween(laneR, 1, { at: t - 4.6, dur: 1.0, ease: ease.draw });
  tl.tween(laneU, 1.4, { at: t - 3.8, dur: 3.2, ease: ease.linear });
  tl.tween(layerU, 1, { at: t - 3.4, dur: 0.6, ease: ease.enter });
  tl.tween(digU, 1, { at: t - 1.6, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.7);

  /* beat 1 — ef bisect: the stream-layer whowrote */
  t = tl.caption({ at: t, dur: 6.4, text: 'Digest bisect binary-searches the first offset where two logs diverge.' });
  tl.tween(gridU, 1, { at: t - 6.0, dur: 1.4, ease: ease.enter });
  tl.tween(probeU, PROBES.length, { at: t - 4.4, dur: 3.0, ease: ease.linear });
  tl.tween(divU, 1, { at: t - 1.2, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.8);

  /* beat 2 — the doctrine is runnable */
  t = tl.caption({ at: t, dur: 6.4, text: 'work-queue.js composes implement-task and verify-task — the doctrine, runnable.' });
  tl.tween(gA, 0.1, { at: t - 6.2, dur: 0.8, ease: ease.move });
  tl.tween(wqU, 1, { at: t - 5.4, dur: 0.6, ease: ease.enter });
  tl.tween(implU, 1, { at: t - 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(verU, 1, { at: t - 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(c1U, 1, { at: t - 4.2, dur: 1.0, ease: ease.draw });
  tl.tween(c2U, 1, { at: t - 3.6, dur: 1.0, ease: ease.draw });
  tl.tween(flowU, 1, { at: t - 2.8, dur: 1.6, ease: ease.linear });
  tl.tween(atkU, ATTACKERS.length, { at: t - 2.4, dur: 1.8, ease: ease.enter });
  tl.tween(xU, 1, { at: t - 0.6, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.8);

  /* beat 3 — rework with the report; thrash means stop */
  t = tl.caption({ at: t, dur: 6.2, text: 'Refuted → rework with the report, twice at most. Identical findings = thrash.' });
  tl.tween(reworkU, 1, { at: t - 5.6, dur: 1.2, ease: ease.move });
  tl.tween(retryU, 1, { at: t - 4.2, dur: 0.5, ease: ease.pop });
  tl.tween(thrashU, 1, { at: t - 2.4, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.7);

  /* beat 4 — the loud stop */
  t = tl.caption({ at: t, dur: 5.8, text: 'invalid_loop: reason recorded, committed — a human takes over.' });
  tl.tween(projE, 1, { at: t - 5.4, dur: 0.6, ease: ease.enter });
  tl.tween(flipU, 1, { at: t - 4.2, dur: 0.6, ease: ease.pop });
  tl.tween(humanU, 1, { at: t - 2.6, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* beat 5 — deposits make every lap harder to fool; full circle */
  t = tl.caption({ at: t, dur: 6.6, text: 'Every verified task makes the gauntlet stricter. The loop runs on the product.' });
  tl.tween(gB, 0.16, { at: t - 6.4, dur: 0.8, ease: ease.move });
  tl.tween(railR, 1, { at: t - 5.8, dur: 1.3, ease: ease.draw });
  tl.set(tokU, 0, t - 4.4);
  tl.tween(tokU, GATE_LABELS.length - 1, { at: t - 4.3, dur: 3.2, ease: ease.linear });
  for (let i = 0; i < GATE_LABELS.length; i++) {
    tl.tween(gates[i], 1, { at: t - 4.3 + (i * 3.2) / (GATE_LABELS.length - 1), dur: 0.4, ease: ease.pop });
  }
  tl.tween(depU, 1, { at: t - 4.3 + (DEPOSIT_GATE * 3.2) / (GATE_LABELS.length - 1) + 0.3, dur: 0.5, ease: ease.pop });
  tl.tween(circleU, 1, { at: t - 0.6, dur: 0.7, ease: ease.enter });
  tl.hold(t, 1.8);

  return {
    tl,
    stripR, laneR, laneU, digU, layerU, gA,
    gridU, probeU, divU,
    wqU, implU, verU, c1U, c2U, flowU, atkU, xU, gB,
    reworkU, retryU, thrashU,
    projE, flipU, humanU,
    railR, tokU, gates, depU, circleU,
  };
}

const scene = buildScene();

/* ------------------------------------------- local subcomponents (pure) */

function Chip({ x, y, text, u, color, size = 12 }: { x: number; y: number; text: string; u: number; color: string; size?: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * size * 0.62 + 22;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * -6})`} opacity={uu}>
      <rect x={-w / 2} y={-13} width={w} height={26} rx={13} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fill={color} fontSize={size} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** Two event logs, byte-identical until DIVERGE_AT; probes bracket the split. */
function BisectGrid({ u, probes, div, dim }: { u: number; probes: number; div: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, cell, rows } = BISECT;
  const gap = (w - N_EVENTS * cell) / (N_EVENTS - 1) + cell;
  const alpha = uu * (1 - 0.9 * clamp01(dim));
  return (
    <g opacity={alpha}>
      <text x={x} y={y - 16} fill={colors.MUTED} fontSize={12}>
        ef bisect a.jsonl b.jsonl — state digests, probed
      </text>
      {(['a', 'b'] as const).map((row) => (
        <g key={row} transform={`translate(0, ${y + rows[row]})`}>
          <text x={x - 14} y={cell - 4} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={mono}>
            {row}
          </text>
          {Array.from({ length: N_EVENTS }, (_, i) => {
            const on = clamp01(uu * N_EVENTS - i);
            const diverged = row === 'b' && i >= DIVERGE_AT;
            return (
              <rect
                key={i}
                x={x + i * gap}
                y={0}
                width={cell}
                height={cell}
                rx={3}
                fill={diverged ? colors.NEGATIVE : colors.ACCENT}
                opacity={on * (diverged ? 0.85 : 0.45)}
              />
            );
          })}
        </g>
      ))}
      {PROBES.map((p, i) => {
        const pu = clamp01(probes - i);
        if (pu <= 0) return null;
        const px = x + p.idx * gap + cell / 2;
        return (
          <g key={i} opacity={pu}>
            <line x1={px} y1={y - 6} x2={px} y2={y + rows.b + cell + 6} stroke={p.match ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="3 3" />
            <text x={px} y={y + rows.b + cell + 22} textAnchor="middle" fill={p.match ? colors.POSITIVE : colors.NEGATIVE} fontSize={13} fontFamily={mono}>
              {p.match ? '=' : '≠'}
            </text>
          </g>
        );
      })}
      {div > 0 && (
        <Chip x={x + w / 2} y={y + rows.b + cell + 52} text="first divergence: offset 009000 · exit 1" u={div} color={colors.NEGATIVE} size={12} />
      )}
    </g>
  );
}

/* --------------------------------- render (pure function of SceneState) */

export function Render({ s }: { s: SceneState }) {
  const gA = clamp01(s.get(scene.gA));
  const gB = clamp01(s.get(scene.gB));
  const layer = clamp01(s.get(scene.layerU));
  const rework = clamp01(s.get(scene.reworkU));
  const flip = clamp01(s.get(scene.flipU));
  const atkN = s.get(scene.atkU);

  // rework arc: verify → implement, dipping below the spine
  const q = 1 - rework;
  const arcX = q * q * VERIFY.x + 2 * q * rework * ((VERIFY.x + IMPL.x) / 2) + rework * rework * IMPL.x;
  const arcY = q * q * (VERIFY.y + 40) + 2 * q * rework * (VERIFY.y + 130) + rework * rework * (IMPL.y + 40);

  return (
    <>
      {/* ——— beats 0–1: the two evidence layers + digest bisect ——— */}
      <g opacity={gA}>
        <RecordingStrip x={STRIP.x} y={STRIP.y} w={STRIP.w} points={POINTS} reveal={s.get(scene.stripR)} u={0} title="browser layer — the Replay recording" />
        <EventLane
          x1={LANE.x1} y1={LANE.y1} x2={LANE.x2} y2={LANE.y2}
          u={s.get(scene.laneU)}
          events={LANE_EVENTS}
          reveal={s.get(scene.laneR)}
          fromLabel="dispatch"
          toLabel="stream"
        />
        {layer > 0 && (
          <text x={LANE.x1} y={LANE.y1 - 40} fill={colors.MUTED} fontSize={12} opacity={layer}>
            stream layer — every mutation, append-only, offset-addressed
          </text>
        )}
        <Chip x={DIGEST.x + 40} y={DIGEST.y} text="ef replay --digest → 4f21…" u={s.get(scene.digU)} color={colors.TEAL} size={11.5} />
      </g>
      <BisectGrid u={s.get(scene.gridU)} probes={s.get(scene.probeU)} div={s.get(scene.divU)} dim={1 - gA} />

      {/* ——— beats 2–4: work-queue.js runs the gauntlet ——— */}
      <g opacity={gB < 1 ? 0.16 + 0.84 * gB : 1}>
        <ServiceNode {...WQ} kind="lb" label="work-queue.js" sublabel="the loop, looped" u={s.get(scene.wqU)} />
        <ServiceNode {...IMPL} kind="fn" label="implement-task.js" sublabel="builder protocol" u={s.get(scene.implU)} />
        <ServiceNode {...VERIFY} kind="fn" label="verify-task.js" sublabel="parallel critics" u={s.get(scene.verU)} />
        <Connection from={{ x: WQ.x + 70, y: WQ.y }} to={{ x: IMPL.x - 74, y: IMPL.y }} u={s.get(scene.c1U)} flow={s.get(scene.flowU)} label="next task" />
        <Connection from={{ x: IMPL.x + 74, y: IMPL.y }} to={{ x: VERIFY.x - 70, y: VERIFY.y }} u={s.get(scene.c2U)} flow={s.get(scene.flowU)} label="claim + evidence" />
        {ATTACKERS.map((a, i) => (
          <Chip key={a} x={VERIFY.x - 180 + i * 92} y={VERIFY.y + 78} text={a} u={clamp01(atkN - i)} color={colors.NEGATIVE} size={10.5} />
        ))}
        <Chip x={VERIFY.x} y={VERIFY.y + 116} text="every finding cross-examined → judge" u={s.get(scene.xU)} color={colors.SECONDARY} size={11} />

        {/* beat 3 — the rework arc and the thrash detector */}
        {rework > 0 && rework < 1 && (
          <path
            d={`M ${VERIFY.x} ${VERIFY.y + 40} Q ${(VERIFY.x + IMPL.x) / 2} ${VERIFY.y + 130} ${IMPL.x} ${IMPL.y + 40}`}
            fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} strokeDasharray="6 5" opacity={0.8}
          />
        )}
        {rework > 0 && rework < 1 && <circle cx={arcX} cy={arcY} r={7} fill={colors.NEGATIVE} />}
        <Chip x={(VERIFY.x + IMPL.x) / 2} y={VERIFY.y + 152} text="refuted → rework 1/2 — report attached" u={s.get(scene.retryU)} color={colors.NEGATIVE} size={11} />
        <Chip x={(VERIFY.x + IMPL.x) / 2} y={VERIFY.y + 190} text="same finding set twice = not converging" u={s.get(scene.thrashU)} color={colors.WARM} size={11} />

        {/* beat 4 — project.json flips, loudly */}
        {clamp01(s.get(scene.projE)) > 0 && (
          <g transform={`translate(${PROJ.x}, ${PROJ.y})`} opacity={clamp01(s.get(scene.projE))}>
            <rect width={PROJ.w} height={PROJ.h} rx={12} fill={colors.PANEL} stroke={flip > 0 ? colors.NEGATIVE : colors.GRID} strokeWidth={flip > 0 ? 2.2 : 1.5} />
            <text x={16} y={26} fill={colors.TEXT} fontSize={14} fontWeight={700} fontFamily={mono}>
              .eforest/project.json
            </text>
            <text x={16} y={56} fill={flip > 0.5 ? colors.NEGATIVE : colors.POSITIVE} fontSize={13} fontFamily={mono}>
              {flip > 0.5 ? '"status": "invalid_loop"' : '"status": "building"'}
            </text>
            <text x={16} y={82} fill={colors.MUTED} fontSize={12} fontFamily={mono} opacity={flip}>
              "statusReason": "E0-T12 refuted twice — same findings"
            </text>
            <text x={16} y={110} fill={colors.NEGATIVE} fontSize={12.5} fontStyle="italic" opacity={clamp01(s.get(scene.humanU))}>
              routing around it is itself a refutation of the loop
            </text>
          </g>
        )}
      </g>

      {/* ——— beat 5: the gauntlet, stricter every lap ——— */}
      <GauntletRail
        x={RAIL.x} y={RAIL.y} w={RAIL.w}
        gates={GATE_LABELS.map((label, i) => ({ label, state: s.get(scene.gates[i]) }))}
        reveal={s.get(scene.railR)}
        u={s.get(scene.tokU)}
        deposit={{ gate: DEPOSIT_GATE, label: '+1 promoted test', u: s.get(scene.depU) }}
        tokenColor={colors.SECONDARY}
      />
      {clamp01(s.get(scene.circleU)) > 0 && (
        <text x={640} y={RAIL.y + 54} textAnchor="middle" fill={colors.SECONDARY} fontSize={13.5} fontStyle="italic" opacity={clamp01(s.get(scene.circleU))}>
          the product — durable, replayable streams — is the evidence layer the loop runs on. full circle.
        </text>
      )}
    </>
  );
}

// registry adapter — steps embed this via viz { scene: 'books/builder-critic-loop/chapter-4', beat: i }
export const vizScene = () => scene;
