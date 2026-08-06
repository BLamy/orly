// One Function Decides
//
// Backed by: crates/logic/lib.rs ("[`on_event`] is the only way behavioral
// state advances. The production executor and deterministic simulator both
// feed it events and perform the returned effects. No adapter may mutate
// [`State`] directly."), crates/celld/main.rs (one actor polls mailbox,
// timers, and in-flight effect futures together — monotonic lease ticks fence
// the node even when a storage operation remains hung), docs/testing.md
// (deterministic simulation of adversarial schedules; differential
// conformance against workerd on identical bytes).
//
// Machine: event chips stream from three sources into ONE on_event box; the
// effects it returns loop back around as completion events. A storage effect
// visibly hangs — and the lease tick still flows through and fences the node.
// Then the same box is lifted into a simulator frame and hammered with
// adversarial schedules. A recap constellation re-traces chapters one to four.
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
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const CORE = { x: 640, y: 330, w: 250, h: 120 };
const SOURCES = [
  { label: 'mailbox · requests', y: 190, color: colors.ACCENT },
  { label: 'timers · lease ticks', y: 330, color: colors.WARM },
  { label: 'effect completions', y: 470, color: colors.POSITIVE },
] as const;
const SRC_X = 165;
const FX_X = 1105;

const CAM_CORE: CameraState = { x: 640, y: 330, k: 1.14 };
const CAM_HANG: CameraState = { x: 800, y: 380, k: 1.24 };
const CAM_SIM: CameraState = { x: 640, y: 330, k: 0.98 };
const CAM_WIDE: CameraState = { ...CAMERA_HOME };

// The chips that flow during the main loop beats (start, lane, label).
const CHIPS = [
  { at: 0.0, lane: 0, label: 'Event::Request' },
  { at: 0.22, lane: 1, label: 'Timer tick' },
  { at: 0.44, lane: 2, label: 'CasOutcome' },
  { at: 0.62, lane: 0, label: 'Event::Request' },
  { at: 0.8, lane: 1, label: 'Timer tick' },
] as const;

// Recap constellation: the four preceding machines, miniaturized.
const RECAP = [
  { x: 320, y: 210, color: colors.ACCENT, title: 'one cell, one thread', sub: 'interleave only at await' },
  { x: 960, y: 210, color: colors.TEAL, title: 'the bucket coordinates', sub: 'one atomic write to own' },
  { x: 320, y: 470, color: colors.POSITIVE, title: 'durable before acknowledged', sub: 'ticket → upload → gate' },
  { x: 960, y: 470, color: colors.WARM, title: 'the wake calendar', sub: 'no alarm is ever lost' },
] as const;

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  bugsU: ChannelRef<number>;
  coreU: ChannelRef<number>;
  lanesU: ChannelRef<number>;
  flowU: ChannelRef<number>;
  loopU: ChannelRef<number>;
  hangU: ChannelRef<number>;
  fenceU: ChannelRef<number>;
  simU: ChannelRef<number>;
  simRunU: ChannelRef<number>;
  confU: ChannelRef<number>;
  recapU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CORE, cameraInterp);
  const bugsU = tl.channel('bugsU', 0); // the three nanosecond-window bugs
  const coreU = tl.channel('coreU', 0); // on_event box
  const lanesU = tl.channel('lanesU', 0); // the three source lanes
  const flowU = tl.channel('flowU', 0); // chips flowing through
  const loopU = tl.channel('loopU', 0); // effects loop back as events
  const hangU = tl.channel('hangU', 0); // a storage effect hangs
  const fenceU = tl.channel('fenceU', 0); // the lease tick still fences
  const simU = tl.channel('simU', 0); // simulator frame lifts in
  const simRunU = tl.channel('simRunU', 0); // adversarial schedules hammer
  const confU = tl.channel('confU', 0); // workerd differential panel
  const recapU = tl.channel('recapU', 0); // constellation
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · where the bugs live —
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 7.6,
    text: 'The dangerous bugs live in the coordination: a crash in the middle of a handoff, a lease renewal racing a takeover, an alarm firing against a half restored cell.',
  });
  tl.tween(bugsU, 1, { at: t - 7.0, dur: 2.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 2 · nanosecond windows —
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Those windows are nanoseconds wide, and they open rarely. A test cannot sit and wait for one.',
  });
  t = tl.hold(t, 0.5);

  // — Beat 3 · one pure function —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'So celld routes every behavioral decision through one pure function. State advances only through on event. No adapter may mutate it directly.',
  });
  tl.tween(bugsU, 0, { at: t - 6.6, dur: 0.8, ease: ease.move });
  tl.tween(coreU, 1, { at: t - 5.8, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 4 · one actor, three sources —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'One actor serializes everything. The mailbox, the timers, and the in-flight effects are polled together, in a single loop.',
  });
  tl.tween(lanesU, 1, { at: t - 6.0, dur: 1.8, ease: ease.draw });
  tl.tween(flowU, 0.5, { at: t - 3.8, dur: 3.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 5 · effects loop back —
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The function returns effects. Adapters perform them and send the completions back as new events. The loop closes.',
  });
  tl.tween(flowU, 1, { at: t - 5.6, dur: 3.0, ease: ease.linear });
  tl.tween(loopU, 1, { at: t - 5.0, dur: 2.6, ease: ease.draw });
  t = tl.hold(t, 0.5);

  // — Beat 6 · a hung effect cannot stop the clock —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Even a hung storage operation cannot stop the clock. The lease tick still reaches the core, and the core can still fence the node.',
  });
  tl.tween(cam, CAM_HANG, { at: t - 6.5, dur: 1.3, ease: ease.move });
  tl.tween(hangU, 1, { at: t - 5.8, dur: 1.6, ease: ease.move });
  tl.tween(fenceU, 1, { at: t - 3.6, dur: 2.4, ease: ease.linear });
  t = tl.hold(t, 0.6);

  // — Beat 7 · the simulator —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'And because the core is pure, a simulator can drive the very same function through adversarial schedules, and replay any failure it finds, deterministically.',
  });
  tl.tween(cam, CAM_SIM, { at: t - 6.5, dur: 1.4, ease: ease.move });
  tl.tween(hangU, 0, { at: t - 6.2, dur: 0.8, ease: ease.move });
  tl.tween(simU, 1, { at: t - 5.6, dur: 1.2, ease: ease.enter });
  tl.tween(simRunU, 1, { at: t - 4.2, dur: 3.6, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 8 · differential conformance —
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'Compatibility gets the same treatment: every program runs twice, once on Cloudflare’s own runtime and once on celld, on identical bytes. The two outputs must be equal.',
  });
  tl.tween(confU, 1, { at: t - 6.6, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.6);

  // — Beat 9 · recap —
  t = tl.caption({
    at: t,
    dur: 8.0,
    text: 'So retrace the journey: one thread per cell, one atomic write to own it, durable before acknowledged, a calendar in the bucket — and one function deciding all of it.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 7.5, dur: 1.5, ease: ease.move });
  tl.tween(simU, 0, { at: t - 7.2, dur: 0.8, ease: ease.move });
  tl.tween(confU, 0, { at: t - 7.2, dur: 0.8, ease: ease.move });
  tl.tween(dimU, 0.6, { at: t - 7.0, dur: 1.0, ease: ease.move });
  tl.tween(recapU, 1, { at: t - 6.4, dur: 3.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 10 · close —
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Self hosted durable objects, coordinated by a bucket, decided by one function. That is celld.',
  });
  tl.tween(dimU, 1, { at: t - 5.2, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.2, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return {
    tl, cam, bugsU, coreU, lanesU, flowU, loopU, hangU, fenceU, simU,
    simRunU, confU, recapU, dimU, closeU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */
function BugWindows({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const bugs = [
    'crash mid-handoff',
    'renewal races takeover',
    'alarm vs half-restored cell',
  ];
  return (
    <g opacity={uu}>
      {bugs.map((b, i) => {
        const p = clamp01(uu * 3 - i * 0.6);
        if (p <= 0) return null;
        const x = 340 + i * 300;
        return (
          <g key={b} transform={`translate(${x}, ${300 + (1 - p) * 10})`} opacity={p}>
            <rect x={-125} y={-40} width={250} height={80} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.6} />
            <text y={-8} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>
              {b}
            </text>
            <text y={18} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
              window: nanoseconds · opens rarely
            </text>
          </g>
        );
      })}
    </g>
  );
}

function CoreBox({ u, fence, dim }: { u: number; fence: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const fenced = fence > 0.75;
  return (
    <g transform={`translate(${CORE.x}, ${CORE.y})`} opacity={(1 - 0.85 * dim) * uu}>
      <rect
        x={-CORE.w / 2}
        y={-CORE.h / 2}
        width={CORE.w}
        height={CORE.h}
        rx={16}
        fill={colors.PANEL}
        stroke={fenced ? colors.NEGATIVE : colors.SECONDARY}
        strokeWidth={2.2}
      />
      <text y={-24} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={750}>
        the decision core
      </text>
      <text y={2} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily={MONO}>
        on_event(state, event) → effects
      </text>
      <text y={26} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
        celld-logic · pure · no clock, no network
      </text>
      {fenced && (
        <text y={50} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO}>
          decision: StopCause — fence this node
        </text>
      )}
    </g>
  );
}

function Lanes({ u, flow, hang, fence, dim }: { u: number; flow: number; hang: number; fence: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const coreLeft = CORE.x - CORE.w / 2;
  return (
    <g opacity={1 - 0.85 * dim}>
      {SOURCES.map((srcDef, lane) => {
        const p = clamp01(uu * 3 - lane * 0.6);
        if (p <= 0) return null;
        return (
          <g key={srcDef.label} opacity={p}>
            <text x={SRC_X} y={srcDef.y - 20} fill={srcDef.color} fontSize={11.5} fontFamily={MONO}>
              {srcDef.label}
            </text>
            <line
              x1={SRC_X}
              y1={srcDef.y}
              x2={SRC_X + (coreLeft - 30 - SRC_X) * p}
              y2={srcDef.y}
              stroke={colors.GRID}
              strokeWidth={1.6}
              strokeDasharray="2 5"
            />
            <path
              d={`M ${coreLeft - 30} ${srcDef.y} L ${coreLeft - 6} ${CORE.y + (srcDef.y - CORE.y) * 0.25}`}
              fill="none"
              stroke={colors.GRID}
              strokeWidth={1.6}
              opacity={p}
            />
          </g>
        );
      })}
      {/* flowing chips */}
      {CHIPS.map((chip, i) => {
        const p = clamp01((flow - chip.at) / 0.3);
        if (p <= 0 || p >= 1) return null;
        const srcDef = SOURCES[chip.lane];
        // hang beat: chips of lane 2 (completions) freeze at 0.5 while hang is on
        const frozen = hang > 0.3 && chip.lane === 2;
        const pp = frozen ? Math.min(p, 0.45) : p;
        const x = SRC_X + 40 + (coreLeft - 20 - SRC_X - 40) * pp;
        const y = srcDef.y + (CORE.y - srcDef.y) * clamp01((pp - 0.75) * 4);
        return (
          <g key={i} transform={`translate(${x}, ${y})`} opacity={Math.min(1, p * 4)}>
            <rect x={-52} y={-12} width={104} height={24} rx={12} fill={colors.BG} stroke={srcDef.color} strokeWidth={1.4} />
            <text y={4} textAnchor="middle" fill={srcDef.color} fontSize={9.5} fontFamily={MONO}>
              {chip.label}
            </text>
          </g>
        );
      })}
      {/* the fence tick rides lane 1 during the hang */}
      {fence > 0 && fence < 0.9 && (
        <g transform={`translate(${SRC_X + 40 + (coreLeft - 20 - SRC_X - 40) * ease.linear(clamp01(fence / 0.75))}, ${SOURCES[1].y})`}>
          <rect x={-56} y={-13} width={112} height={26} rx={13} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.8} />
          <text y={4} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily={MONO}>
            NodeLeaseFence
          </text>
        </g>
      )}
    </g>
  );
}

function EffectLoop({ u, hang, dim }: { u: number; hang: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const coreRight = CORE.x + CORE.w / 2;
  const hu = clamp01(hang);
  // loop path: core -> right -> down -> back to completions lane
  const d = `M ${coreRight} ${CORE.y} L ${FX_X} ${CORE.y} L ${FX_X} ${SOURCES[2].y + 40} L ${SRC_X + 60} ${SOURCES[2].y + 40} L ${SRC_X + 60} ${SOURCES[2].y + 12}`;
  const len = (FX_X - coreRight) + (SOURCES[2].y + 40 - CORE.y) + (FX_X - SRC_X - 60) + 28;
  return (
    <g opacity={1 - 0.85 * dim}>
      <path d={d} fill="none" stroke={colors.GRID} strokeWidth={1.6} strokeDasharray={`${len * uu} ${len}`} opacity={0.8} />
      <text x={FX_X - 8} y={CORE.y - 14} textAnchor="end" fill={colors.POSITIVE} fontSize={11} fontFamily={MONO} opacity={uu}>
        effects: cas write · start runtime · arm timer
      </text>
      {uu > 0.9 && (
        <text x={FX_X - 8} y={SOURCES[2].y + 62} textAnchor="end" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
          completions come back through the mailbox — the loop closes
        </text>
      )}
      {/* the hung effect */}
      {hu > 0 && (
        <g transform={`translate(${FX_X}, ${CORE.y + 90})`} opacity={hu}>
          <rect x={-108} y={-18} width={216} height={36} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.8} strokeDasharray="5 4" />
          <text y={-64} opacity={0} />
          <text y={5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO}>
            storage op · hung · still awaited
          </text>
        </g>
      )}
    </g>
  );
}

function SimFrame({ u, run, conf, dim }: { u: number; run: number; conf: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const schedules = ['crash @ publish', 'partition @ renew', 'alarm @ restore', 'delay every cas'];
  return (
    <g opacity={(1 - 0.85 * dim) * uu}>
      <rect x={150} y={110} width={980} height={470} rx={20} fill="none" stroke={colors.WARM} strokeWidth={2} strokeDasharray="10 8" />
      <text x={170} y={140} fill={colors.WARM} fontSize={13.5} fontWeight={700}>
        deterministic simulator — same core, fake world
      </text>
      {schedules.map((sched, i) => {
        const p = clamp01(run * 4.4 - i);
        if (p <= 0) return null;
        const done = p >= 1;
        return (
          <g key={sched} transform={`translate(${205}, ${180 + i * 34})`} opacity={Math.min(1, p * 2)}>
            <rect x={0} y={-14} width={220} height={26} rx={8} fill={colors.PANEL} stroke={done ? colors.POSITIVE : colors.WARM} strokeWidth={1.3} />
            <text x={10} y={4} fill={done ? colors.POSITIVE : colors.WARM} fontSize={10} fontFamily={MONO}>
              {sched} {done ? '· invariants hold' : '· running'}
            </text>
          </g>
        );
      })}
      {conf > 0 && (
        <g transform={`translate(895, 250)`} opacity={conf}>
          <rect x={-190} y={-56} width={380} height={128} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
          <text y={-28} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontWeight={700}>
            differential conformance
          </text>
          <text y={-4} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
            same program · identical bytes
          </text>
          <text x={-90} y={24} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>
            workerd → out A
          </text>
          <text x={95} y={24} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>
            celld → out B
          </text>
          <text y={48} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
            A must equal B
          </text>
        </g>
      )}
    </g>
  );
}

function RecapConstellation({ u, close }: { u: number; close: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={uu * (1 - 0.88 * clamp01(close))}>
      {RECAP.map((r, i) => {
        const p = clamp01(uu * 4.4 - i * 0.85);
        if (p <= 0) return null;
        return (
          <g key={r.title} transform={`translate(${r.x}, ${r.y + (1 - p) * 12})`} opacity={p}>
            <line
              x1={0}
              y1={0}
              x2={(CORE.x - r.x) * 0.62}
              y2={(CORE.y - r.y) * 0.62}
              stroke={colors.GRID}
              strokeWidth={1.2}
              strokeDasharray="3 6"
              opacity={0.7}
            />
            <circle r={58} fill={colors.PANEL} stroke={r.color} strokeWidth={1.8} />
            <text y={-4} textAnchor="middle" fill={r.color} fontSize={11} fontWeight={700}>
              {r.title}
            </text>
            <text y={16} textAnchor="middle" fill={colors.MUTED} fontSize={8.5} fontFamily={MONO}>
              {r.sub}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${330 + (1 - uu) * 14})`} opacity={uu}>
      <rect x={-350} y={-88} width={700} height={176} rx={18} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.7} />
      <text y={-40} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={750}>
        One function decides.
      </text>
      <text y={-2} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily={MONO}>
        on_event — production and simulation feed the same core
      </text>
      <text y={30} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
        self-hosted Durable Objects · coordinated by your bucket
      </text>
      <text y={61} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
        celld · Deno Land · Apache-2.0
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const sim = clamp01(s.get(scene.simU));
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <BugWindows u={s.get(scene.bugsU)} />
        <Lanes
          u={s.get(scene.lanesU) * (1 - sim * 0.85)}
          flow={s.get(scene.flowU)}
          hang={s.get(scene.hangU)}
          fence={s.get(scene.fenceU)}
          dim={dim}
        />
        <EffectLoop u={s.get(scene.loopU) * (1 - sim * 0.85)} hang={s.get(scene.hangU)} dim={dim} />
        <CoreBox u={s.get(scene.coreU)} fence={s.get(scene.fenceU)} dim={Math.max(dim, clamp01(s.get(scene.recapU)) * 0.4)} />
        <SimFrame u={sim} run={s.get(scene.simRunU)} conf={s.get(scene.confU)} dim={dim} />
        <RecapConstellation u={s.get(scene.recapU)} close={s.get(scene.closeU)} />
        <ClosingCard u={s.get(scene.closeU)} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
