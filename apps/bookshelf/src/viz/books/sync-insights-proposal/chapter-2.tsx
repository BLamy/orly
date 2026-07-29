// Sync Engines Are Dataflow Graphs
//
// Chapter 2 of the sync-insights proposal. The claim: Zero (ZQL / incremental
// view maintenance) and ElectricSQL (shapes over Postgres logical replication)
// are incremental dataflow engines — a write becomes a diff, diffs flow
// through operators, the UI update is the OUTPUT of a delta, exactly like
// differential dataflow's (data, time, ±1) with frontiers. Centerpiece: ONE
// diff chip travels an operator graph that relabels itself Zero → Electric,
// with React's dispatch→render pipeline as a dimmed echo above — then rungs
// tie the two pipelines together, stage for stage. Ends on the gap: the
// engines compute all this causality and throw it away.
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
import { Connection, NodeBadge, Packet, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — React echo pipeline on top, the sync engine pipeline below.
// ---------------------------------------------------------------------------

const REACT_Y = 138;
const REACT_NODES = [
  { x: 190, label: 'dispatch' },
  { x: 470, label: 'reducer' },
  { x: 750, label: 'selectors' },
  { x: 1050, label: 'render' },
] as const;
const RW = 150;
const RH = 46;

const SYNC_Y = 402;
const SW = 140;
const SH = 56;
interface SyncNode {
  x: number;
  zero: [string, string];
  electric: [string, string];
}
const SYNC_NODES: SyncNode[] = [
  { x: 150, zero: ['write', 'CRUD mutation'], electric: ['Postgres', 'committed write'] },
  { x: 420, zero: ['filter', 'operator'], electric: ['decode', 'WAL'] },
  { x: 620, zero: ['join', 'operator'], electric: ['shape match', 'which clients?'] },
  { x: 820, zero: ['sort', 'operator'], electric: ['shape log', 'change stream'] },
  { x: 1090, zero: ['view', 'UI update'], electric: ['client', 'apply delta'] },
];

const ZONE = { x: 322, y: 336, w: 596, h: 132 } as const;

/** Per-hop diff labels — the visible transformation at each operator. */
const HOP_LABELS_ZERO = ['(+1 row)', '(+1 kept)', '(+1 joined)', '(delta)'];
const HOP_LABELS_ELECTRIC = ['(commit)', '(change)', '(shape hit)', '(delta)'];

const hopFrom = (i: number) => ({ x: SYNC_NODES[i].x + SW / 2, y: SYNC_Y });
const hopTo = (i: number) => ({ x: SYNC_NODES[i + 1].x - SW / 2, y: SYNC_Y });

/** Rungs tying React stages to sync stages (dispatch↔write … render↔view). */
const RUNGS = [0, 1, 2, 3].map((i) => ({
  from: { x: REACT_NODES[i].x, y: REACT_Y + RH / 2 },
  to: { x: SYNC_NODES[i === 3 ? 4 : i].x, y: SYNC_Y - SH / 2 },
}));

const TRIPLE = { x: 620, y: 262 } as const;
const FRONTIER_X0 = ZONE.x - 30;
const FRONTIER_X1 = ZONE.x + ZONE.w + 30;

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_SYNC: CameraState = { x: 620, y: 396, k: 1.3 };
const CAM_OPS: CameraState = { x: 620, y: 380, k: 1.5 };
const CAM_BOTH: CameraState = { x: 640, y: 290, k: 1.12 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  reactU: ChannelRef<number>;
  reactDim: ChannelRef<number>;
  syncU: ChannelRef<number>;
  zoneU: ChannelRef<number>;
  engineU: ChannelRef<number>; // 0 = Zero labels, 1 = Electric labels
  hops: ChannelRef<number>[]; // the diff walking, hop by hop (Zero pass)
  hops2: ChannelRef<number>[]; // the Electric pass of the SAME journey
  glow: ChannelRef<number>[]; // per-operator pulse as the diff lands
  tripleU: ChannelRef<number>;
  frontierU: ChannelRef<number>;
  frontierX: ChannelRef<number>;
  rungU: ChannelRef<number>;
  flowU: ChannelRef<number>; // steady diff traffic for the closing beats
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const reactU = tl.channel('reactU', 0);
  const reactDim = tl.channel('reactDim', 0);
  const syncU = tl.channel('syncU', 0);
  const zoneU = tl.channel('zoneU', 0);
  const engineU = tl.channel('engineU', 0);
  const hops = [0, 1, 2, 3].map((i) => tl.channel(`hop${i}`, 0));
  const hops2 = [0, 1, 2, 3].map((i) => tl.channel(`hop2x${i}`, 0));
  const glow = [0, 1, 2, 3, 4].map((i) => tl.channel(`glow${i}`, 0));
  const tripleU = tl.channel('tripleU', 0);
  const frontierU = tl.channel('frontierU', 0);
  const frontierX = tl.channel('frontierX', FRONTIER_X0);
  const rungU = tl.channel('rungU', 0);
  const flowU = tl.channel('flowU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  const pulse = (i: number, at: number) => {
    tl.tween(glow[i], 1, { at, dur: 0.25, ease: ease.enter });
    tl.tween(glow[i], 0, { at: at + 0.5, dur: 0.55, ease: ease.enter });
  };

  // — Beat 1 · the claim —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Second claim: the sync engines people are betting on are dataflow graphs on the inside. Not metaphorically — structurally.',
  });
  tl.tween(reactU, 1, { at: 0.7, dur: 1.2, ease: ease.enter });
  tl.tween(reactDim, 1, { at: 2.6, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_SYNC, { at: 2.8, dur: 1.5, ease: ease.move });
  tl.tween(syncU, 1, { at: 3.4, dur: 2.0, ease: ease.enter });
  tl.hold(7.0, 0.6);

  // — Beat 2 · Zero: queries compile to operator pipelines —
  tl.caption({
    at: 7.6,
    dur: 7.5,
    text: 'Take Zero. Every query compiles to a pipeline of operators — filter, join, sort — kept alive on the client as an incremental view.',
  });
  tl.tween(zoneU, 1, { at: 8.4, dur: 1.4, ease: ease.draw });
  tl.hold(15.1, 0.6);

  // — Beat 3 · a write becomes a diff —
  tl.caption({
    at: 15.7,
    dur: 7,
    text: "So a write doesn't trigger a re-run. It becomes a diff — this row, plus one — and the diff walks the pipeline, operator by operator.",
  });
  tl.tween(cam, CAM_OPS, { at: 15.9, dur: 1.4, ease: ease.move });
  pulse(0, 16.6);
  tl.tween(hops[0], 1, { at: 17.4, dur: 1.3, ease: ease.linear });
  pulse(1, 18.6);
  tl.tween(hops[1], 1, { at: 19.2, dur: 1.3, ease: ease.linear });
  pulse(2, 20.4);
  tl.hold(22.2, 0.5);

  // — Beat 4 · the output is a delta —
  tl.caption({
    at: 22.7,
    dur: 7,
    text: "Each operator transforms the diff and hands it on. What comes out the far end is not a query result. It's a delta the view applies.",
  });
  tl.tween(hops[2], 1, { at: 23.4, dur: 1.3, ease: ease.linear });
  pulse(3, 24.6);
  tl.tween(hops[3], 1, { at: 25.2, dur: 1.3, ease: ease.linear });
  pulse(4, 26.4);
  tl.tween(cam, CAM_SYNC, { at: 27.2, dur: 1.3, ease: ease.move });
  tl.hold(29.2, 0.5);

  // — Beat 5 · Electric: same shape, different names —
  tl.caption({
    at: 29.7,
    dur: 8,
    text: 'Electric is the same shape with different names. A write hits Postgres, logical replication turns it into a change, and shapes decide which clients that change flows to.',
  });
  tl.tween(engineU, 1, { at: 30.3, dur: 1.2, ease: ease.move });
  pulse(0, 32.0);
  tl.tween(hops2[0], 1, { at: 32.6, dur: 1.1, ease: ease.linear });
  pulse(1, 33.6);
  tl.tween(hops2[1], 1, { at: 34.0, dur: 1.1, ease: ease.linear });
  pulse(2, 35.0);
  tl.tween(hops2[2], 1, { at: 35.4, dur: 1.1, ease: ease.linear });
  pulse(3, 36.4);
  tl.tween(hops2[3], 1, { at: 36.8, dur: 1.1, ease: ease.linear });
  pulse(4, 37.8);
  tl.hold(38.2, 0.5);

  // — Beat 6 · differential dataflow's trick —
  tl.caption({
    at: 38.7,
    dur: 7.5,
    text: "If this looks familiar, it should. It's differential dataflow's whole trick: data, time, and a plus-or-minus-one diff, with frontiers deciding when an output is safe to commit.",
  });
  tl.tween(tripleU, 1, { at: 39.5, dur: 0.7, ease: ease.enter });
  tl.tween(frontierU, 1, { at: 41.4, dur: 0.5, ease: ease.enter });
  tl.tween(frontierX, FRONTIER_X1, { at: 41.8, dur: 3.0, ease: ease.move });
  tl.hold(46.7, 0.5);

  // — Beat 7 · side by side with React —
  tl.caption({
    at: 47.2,
    dur: 8,
    text: 'Now put it next to the pipeline we already instrumented. Dispatch to reducer to selectors to render. Write to diff to operators to view. Same graph, one layer down.',
  });
  tl.tween(cam, CAM_BOTH, { at: 47.4, dur: 1.6, ease: ease.move });
  tl.tween(reactDim, 0, { at: 47.8, dur: 1.0, ease: ease.move });
  tl.tween(tripleU, 0, { at: 47.8, dur: 0.6, ease: ease.enter });
  tl.tween(rungU, 1, { at: 49.4, dur: 2.2, ease: ease.draw });
  tl.hold(55.7, 0.5);

  // — Beat 8 · the engines already compute the causality —
  tl.caption({
    at: 56.2,
    dur: 7.5,
    text: "And here's the part that matters: the engines already compute all of this causality. Every hop, every diff, every frontier. Then they throw it away.",
  });
  tl.tween(flowU, 6, { at: 56.6, dur: 6.5, ease: ease.linear });
  tl.hold(64.2, 0.5);

  // — Beat 9 · nobody records it —
  tl.caption({
    at: 64.7,
    dur: 7.5,
    text: "Nobody records it. That internal structure is exactly as instrumentable as React's fiber tree — and today it is invisible.",
  });
  tl.tween(cam, CAM_WIDE, { at: 64.9, dur: 1.5, ease: ease.move });
  tl.tween(endDim, 1, { at: 65.6, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 67.2, dur: 1.0, ease: ease.enter });
  tl.hold(72.7, 1.5);

  return {
    tl,
    cam,
    reactU,
    reactDim,
    syncU,
    zoneU,
    engineU,
    hops,
    hops2,
    glow,
    tripleU,
    frontierU,
    frontierX,
    rungU,
    flowU,
    endDim,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const reactU = s.get(scene.reactU);
  const reactDim = s.get(scene.reactDim);
  const syncU = s.get(scene.syncU);
  const zoneU = s.get(scene.zoneU);
  const engineU = s.get(scene.engineU);
  const tripleU = s.get(scene.tripleU);
  const frontierU = s.get(scene.frontierU);
  const frontierX = s.get(scene.frontierX);
  const rungU = s.get(scene.rungU);
  const flowU = s.get(scene.flowU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const dim = 1 - endDim * 0.88;
  const reactOp = reactU * (1 - reactDim * 0.85); // echo fades to 0.15

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dim}>
          {/* React echo pipeline (the one he already instrumented) */}
          <g opacity={reactOp}>
            <text x={REACT_NODES[0].x - RW / 2} y={REACT_Y - 46} fill={colors.MUTED} fontSize={13} fontStyle="italic">
              React — already instrumented
            </text>
            {REACT_NODES.map((n, i) => (
              <NodeBadge key={n.label} x={n.x} y={REACT_Y} w={RW} h={RH} label={n.label} color={colors.SECONDARY} u={1} />
            ))}
            {[0, 1, 2].map((i) => (
              <Connection
                key={i}
                from={{ x: REACT_NODES[i].x + RW / 2, y: REACT_Y }}
                to={{ x: REACT_NODES[i + 1].x - RW / 2, y: REACT_Y }}
                u={1}
                color={colors.SECONDARY}
                arrow
              />
            ))}
          </g>

          {/* the operator zone — labels crossfade Zero ↔ Electric */}
          <Zone x={ZONE.x} y={ZONE.y} w={ZONE.w} h={ZONE.h} u={zoneU} color={colors.ACCENT} />
          <g opacity={zoneU * (1 - engineU)}>
            <text x={ZONE.x + 12} y={ZONE.y - 10} fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
              Zero · ZQL → IVM pipeline
            </text>
          </g>
          <g opacity={zoneU * engineU}>
            <text x={ZONE.x + 12} y={ZONE.y - 10} fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
              Electric · WAL → shapes
            </text>
          </g>

          {/* sync pipeline nodes — the SAME graph, relabeled per engine */}
          {SYNC_NODES.map((n, i) => {
            const u = clamp01(syncU * 6 - i);
            return (
              <g key={i}>
                <g opacity={1 - engineU}>
                  <NodeBadge x={n.x} y={SYNC_Y} w={SW} h={SH} label={n.zero[0]} sublabel={n.zero[1]} color={colors.ACCENT} u={u} glow={s.get(scene.glow[i])} />
                </g>
                <g opacity={engineU}>
                  <NodeBadge x={n.x} y={SYNC_Y} w={SW} h={SH} label={n.electric[0]} sublabel={n.electric[1]} color={colors.TEAL} u={u} glow={s.get(scene.glow[i])} />
                </g>
              </g>
            );
          })}
          {[0, 1, 2, 3].map((i) => (
            <Connection
              key={i}
              from={hopFrom(i)}
              to={hopTo(i)}
              u={clamp01(syncU * 5 - i - 0.5)}
              flow={flowU}
              color={colors.ACCENT}
              arrow
            />
          ))}

          {/* the diff — one persistent chip walking the pipeline, twice */}
          {[0, 1, 2, 3].map((i) => {
            const u = s.get(scene.hops[i]);
            return u > 0 && u < 1 ? (
              <Packet key={`z${i}`} from={hopFrom(i)} to={hopTo(i)} u={u} r={9} color={colors.WARM} label={HOP_LABELS_ZERO[i]} />
            ) : null;
          })}
          {[0, 1, 2, 3].map((i) => {
            const u = s.get(scene.hops2[i]);
            return u > 0 && u < 1 ? (
              <Packet key={`e${i}`} from={hopFrom(i)} to={hopTo(i)} u={u} r={9} color={colors.WARM} label={HOP_LABELS_ELECTRIC[i]} />
            ) : null;
          })}

          {/* the (data, time, ±1) triple + the frontier sweep */}
          <g opacity={tripleU}>
            <rect x={TRIPLE.x - 110} y={TRIPLE.y - 20} width={220} height={32} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={TRIPLE.x} y={TRIPLE.y + 2} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO}>
              (data, time, ±1)
            </text>
          </g>
          <g opacity={frontierU * tripleU}>
            <line x1={frontierX} y1={ZONE.y - 34} x2={frontierX} y2={ZONE.y + ZONE.h + 12} stroke={colors.WARM} strokeWidth={2} strokeDasharray="7 5" opacity={0.8} />
            <text x={frontierX} y={ZONE.y + ZONE.h + 30} textAnchor="middle" fill={colors.WARM} fontSize={12} fontStyle="italic">
              frontier
            </text>
          </g>

          {/* rungs: React stage ↔ sync stage, the same graph one layer down */}
          {RUNGS.map((r, i) => {
            const u = clamp01(rungU * 4.5 - i);
            if (u <= 0) return null;
            return (
              <line
                key={i}
                x1={r.from.x}
                y1={r.from.y}
                x2={r.from.x + (r.to.x - r.from.x) * u}
                y2={r.from.y + (r.to.y - r.from.y) * u}
                stroke={colors.POSITIVE}
                strokeWidth={1.6}
                strokeDasharray="4 5"
                opacity={0.55}
              />
            );
          })}
          <g opacity={clamp01(rungU * 2 - 1)}>
            <text x={54} y={272} fill={colors.POSITIVE} fontSize={13} fontStyle="italic">
              same graph,
            </text>
            <text x={54} y={292} fill={colors.POSITIVE} fontSize={13} fontStyle="italic">
              one layer down
            </text>
          </g>
        </g>

        {/* the close: computed causality, discarded */}
        <g opacity={endU}>
          <rect x={210} y={252} width={860} height={180} rx={16} fill={colors.BG} opacity={0.92} />
          <rect x={210} y={252} width={860} height={180} rx={16} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
            the engines already compute the causality
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16}>
            — and then they throw it away
          </text>
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
            ZQL · IVM · WAL · shapes · frontiers — none of it recorded
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
