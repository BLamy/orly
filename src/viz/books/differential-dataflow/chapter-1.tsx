// A Ledger of Changes
//
// Grounding: README.md background — a differential collection is a multiset
// of update triples (data, time, diff), and programs "respond to arbitrary
// changes to their initially empty input collections". The concrete edge
// story is examples/cursors.rs verbatim: at every round i the example inserts
// edges (i, i+1) and (i+1, i) and deletes (i-1, i); its printed trace shows
// per-edge histories like `1:(1, 2): [(0, +1), (1, -1)]` and the final graph
// {(2,1), (3,2), (3,4), (4,3)}.
//
// Centerpiece: SNAPSHOT vs LEDGER. Three full table copies stack up (heavy),
// then collapse into a tape of (data, time, diff) chips. A multiset bar rack
// is driven by a sweeping time cursor tau: every bar is the running sum of
// the diffs behind the cursor — swept forward, backward, and forward again.
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
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The cursors.rs update ledger — the exact insert/delete schedule of the
// example, in time order. diff +1 inserts an edge, -1 retracts it.
// ---------------------------------------------------------------------------

type Update = { edge: [number, number]; time: number; diff: 1 | -1 };

const LEDGER: Update[] = [
  { edge: [1, 2], time: 1, diff: 1 },
  { edge: [2, 1], time: 1, diff: 1 },
  { edge: [2, 3], time: 2, diff: 1 },
  { edge: [3, 2], time: 2, diff: 1 },
  { edge: [1, 2], time: 2, diff: -1 },
  { edge: [3, 4], time: 3, diff: 1 },
  { edge: [4, 3], time: 3, diff: 1 },
  { edge: [2, 3], time: 3, diff: -1 },
];

/** Distinct edges, in first-appearance order — the bar rack rows. */
const EDGES: Array<[number, number]> = [
  [1, 2],
  [2, 1],
  [2, 3],
  [3, 2],
  [3, 4],
  [4, 3],
];
const edgeKey = (e: [number, number]) => `${e[0]}→${e[1]}`;

/** Multiplicity of an edge at logical time tau (sum of diffs with time ≤ tau). */
function multAt(edge: [number, number], tau: number): number {
  let m = 0;
  for (const u of LEDGER) {
    if (u.edge[0] === edge[0] && u.edge[1] === edge[1] && u.time <= tau) m += u.diff;
  }
  return m;
}

/** Snapshot contents per round (which edges exist at time t) — for the cards. */
const SNAPSHOTS = [1, 2, 3].map((t) => EDGES.filter((e) => multAt(e, t) > 0));

// ---------------------------------------------------------------------------
// Layout. Stage 1280×720; bottom strip (y ≳ 630) is the CC pill's.
// ---------------------------------------------------------------------------

// beat 1 — the restless graph, node positions
const GNODES = [
  { id: 1, x: 490, y: 210 },
  { id: 2, x: 660, y: 150 },
  { id: 3, x: 810, y: 230 },
  { id: 4, x: 700, y: 320 },
];
const gnode = (id: number) => GNODES.find((n) => n.id === id)!;

// beat 2 — three stacked snapshot cards
const CARD_W = 224;
const CARD_H = 176;
const CARD_X = [320, 640, 960];
const CARD_Y = 300;

// beat 3 — the ledger tape
const TAPE_Y = 208;
const CHIP_W = 138;
const CHIP_H = 40;
const CHIP_GAP = 10;
const TAPE_X0 = 640 - (LEDGER.length * (CHIP_W + CHIP_GAP) - CHIP_GAP) / 2;
const chipX = (i: number) => TAPE_X0 + i * (CHIP_W + CHIP_GAP) + CHIP_W / 2;

// beat 4+ — the multiset bar rack
const RACK_Y = 540; // bar baseline
const BAR_W = 74;
const BAR_GAP = 58;
const RACK_X0 = 640 - (EDGES.length * (BAR_W + BAR_GAP) - BAR_GAP) / 2;
const barX = (i: number) => RACK_X0 + i * (BAR_W + BAR_GAP) + BAR_W / 2;
const BAR_H = 118; // height of multiplicity 1

const CAM_GRAPH: CameraState = { x: 650, y: 245, k: 1.5 };
const CAM_TAPE: CameraState = { x: 640, y: 330, k: 1.06 };

// tau mapping for the playhead: logical time 0..3.4 across the tape
const tauToX = (tau: number) => {
  // playhead slides across chips in ledger order; chip i covers tau in
  // [time_i - 1 + frac, ...] — simpler: linear in tau over [0, 3.4]
  return TAPE_X0 - 24 + (tau / 3.4) * (LEDGER.length * (CHIP_W + CHIP_GAP) + 24);
};
/** logical tau at which chip i has "happened" for the playhead sweep */
const chipTau = (i: number) => ((chipX(i) + CHIP_W / 2 - TAPE_X0 + 24) / (LEDGER.length * (CHIP_W + CHIP_GAP) + 24)) * 3.4;

/** Bar height source during the sweep: sum of diffs of chips the playhead
 *  has crossed — bars tick exactly when the cursor crosses an entry. */
function multSwept(edge: [number, number], tau: number): number {
  let m = 0;
  for (let j = 0; j < LEDGER.length; j++) {
    const u = LEDGER[j];
    if (u.edge[0] === edge[0] && u.edge[1] === edge[1] && chipTau(j) <= tau) m += u.diff;
  }
  return m;
}

// ---------------------------------------------------------------------------
// Timeline (~78s, seven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_GRAPH, cameraInterp);

  const graphU = tl.channel('graphU', 0); // restless graph draw-on
  const churnU = tl.channel('churnU', 0); // edge churn 0..3 (rounds replay)
  const graphDim = tl.channel('graphDim', 0);

  const snapU = tl.channel('snapU', 0); // three cards cascade in
  const snapDim = tl.channel('snapDim', 0); // cards give way to the tape

  const tapeU = tl.channel('tapeU', 0); // chips cascade
  const tripleU = tl.channel('tripleU', 0); // (data, time, diff) header
  const rackU = tl.channel('rackU', 0); // bar rack scaffold

  const tau = tl.channel('tau', 0); // THE time cursor (logical 0..3.4)
  const headU = tl.channel('headU', 0); // playhead visibility

  const cancelU = tl.channel('cancelU', 0); // the (1,2) pair links + grays
  const closeU = tl.channel('closeU', 0); // closing panel
  const stageDim = tl.channel('stageDim', 0); // everything fades under close

  // — beat 1 · a graph that will not sit still —
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is a collection that will not sit still: the edges of a graph. Every round, some edges arrive and some are taken away.',
  });
  tl.tween(graphU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(churnU, 3, { at: 2.0, dur: 3.6, ease: ease.linear });

  // — beat 2 · snapshot-thinking: full copies —
  tl.caption({
    at: 7.0,
    dur: 6.6,
    text: 'One way to track it is to keep a full copy of the collection at every moment. Three rounds, three whole tables — and almost every row is a duplicate of the last.',
  });
  tl.tween(cam, CAM_TAPE, { at: 7.2, dur: 1.3, ease: ease.move });
  tl.tween(graphDim, 1, { at: 7.2, dur: 0.8, ease: ease.move });
  tl.tween(snapU, 3, { at: 8.0, dur: 2.6, ease: ease.enter });

  // — beat 3 · the reframe: the ledger —
  tl.caption({
    at: 14.4,
    dur: 6.4,
    text: 'Differential dataflow throws the copies away and keeps a ledger. Each entry is one small fact: the data, the time it happened, and a diff.',
  });
  tl.tween(snapDim, 1, { at: 14.8, dur: 1.0, ease: ease.move });
  tl.tween(tripleU, 1, { at: 15.6, dur: 0.6, ease: ease.enter });
  tl.tween(tapeU, 1, { at: 16.0, dur: 2.8, ease: ease.enter });
  tl.caption({
    at: 21.4,
    dur: 5.6,
    text: 'A diff of plus one means the record appeared. Minus one means it went away. That is the entire vocabulary of change.',
  });

  // — beat 4 · the multiset —
  tl.caption({
    at: 27.8,
    dur: 6.2,
    text: 'The collection itself is a multiset: every edge has a multiplicity — the running sum of its diffs. Draw one bar per edge.',
  });
  tl.tween(rackU, 1, { at: 28.6, dur: 1.6, ease: ease.enter });

  // — beat 5 · sweep tau forward —
  tl.caption({
    at: 34.6,
    dur: 7.0,
    text: 'Now sweep time forward and let the ledger replay. Every time the cursor crosses an entry, one bar ticks up or down — the state at any moment is just a sum.',
  });
  tl.tween(headU, 1, { at: 34.8, dur: 0.5, ease: ease.enter });
  tl.tween(tau, 3.4, { at: 35.4, dur: 6.4, ease: ease.linear });

  // — beat 6 · run history backwards —
  tl.caption({
    at: 42.4,
    dur: 6.2,
    text: 'And history runs backwards, too. Nothing was overwritten, only appended — so any moment is recoverable by summing a little less of the tape.',
  });
  tl.tween(tau, 1.0, { at: 43.2, dur: 3.0, ease: ease.move });
  tl.tween(tau, 3.4, { at: 47.0, dur: 2.2, ease: ease.move });

  // — beat 7 · cancellation —
  tl.caption({
    at: 49.4,
    dur: 7.2,
    text: 'Watch the edge from one to two: born at time one, retracted at time two. Plus one and minus one sum to nothing — so consolidation can quietly drop the pair.',
  });
  tl.tween(cancelU, 1, { at: 50.6, dur: 1.4, ease: ease.draw });
  tl.hold(56.6, 0.6);

  // — beat 8 · close —
  tl.caption({
    at: 57.6,
    dur: 7.4,
    text: 'That is the first move of differential dataflow: stop storing states and start storing differences. A collection is the running sum of its changes.',
  });
  tl.tween(stageDim, 1, { at: 57.8, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 58.6, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 57.8, dur: 1.4, ease: ease.move });
  tl.hold(64.2, 1.2);

  return {
    tl,
    cam,
    graphU,
    churnU,
    graphDim,
    snapU,
    snapDim,
    tapeU,
    tripleU,
    rackU,
    tau,
    headU,
    cancelU,
    closeU,
    stageDim,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** Edge visibility during the churn replay: exists at churn time c. */
function edgeAlpha(e: [number, number], c: number): number {
  // fade in at insert time, fade out at retract time (if any)
  let a = 0;
  for (const u of LEDGER) {
    if (u.edge[0] !== e[0] || u.edge[1] !== e[1]) continue;
    if (u.diff > 0) a += clamp01((c - u.time + 0.4) / 0.4);
    else a -= clamp01((c - u.time + 0.4) / 0.4);
  }
  return clamp01(a);
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const graphU = s.get(scene.graphU);
  const churnU = s.get(scene.churnU);
  const graphDim = s.get(scene.graphDim);
  const snapU = s.get(scene.snapU);
  const snapDim = s.get(scene.snapDim);
  const tapeU = s.get(scene.tapeU);
  const tripleU = s.get(scene.tripleU);
  const rackU = s.get(scene.rackU);
  const tau = s.get(scene.tau);
  const headU = s.get(scene.headU);
  const cancelU = s.get(scene.cancelU);
  const closeU = s.get(scene.closeU);
  const stageDim = s.get(scene.stageDim);

  const stageOp = 1 - 0.85 * stageDim;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageOp}>
          {/* ---------------- beat 1: the restless graph ---------------- */}
          {graphU > 0.01 && graphDim < 0.99 && (
            <g opacity={graphU * (1 - graphDim)}>
              {EDGES.map((e, i) => {
                const a = edgeAlpha(e, churnU);
                if (a <= 0.01) return null;
                const p = gnode(e[0]);
                const q = gnode(e[1]);
                // offset parallel edges (1→2 vs 2→1) slightly
                const dx = q.x - p.x;
                const dy = q.y - p.y;
                const len = Math.hypot(dx, dy) || 1;
                const ox = (-dy / len) * 7;
                const oy = (dx / len) * 7;
                return (
                  <g key={i} opacity={a}>
                    <line
                      x1={p.x + ox}
                      y1={p.y + oy}
                      x2={q.x + ox}
                      y2={q.y + oy}
                      stroke={colors.ACCENT}
                      strokeWidth={2.5}
                      markerEnd="url(#dd1-arrow)"
                    />
                  </g>
                );
              })}
              {GNODES.map((n) => (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={20} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={2} />
                  <text x={n.x} y={n.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
                    {n.id}
                  </text>
                </g>
              ))}
              <text x={650} y={392} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
                round {Math.min(3, Math.floor(churnU + 0.001))} — edges in, edges out
              </text>
            </g>
          )}

          {/* ---------------- beat 2: three full snapshots ---------------- */}
          {snapU > 0.01 && snapDim < 0.99 && (
            <g opacity={1 - snapDim}>
              {SNAPSHOTS.map((rows, c) => {
                const u = win(snapU / 3, 3, c, 1.2);
                if (u <= 0.01) return null;
                const x = CARD_X[c];
                const y = CARD_Y + (1 - u) * 40;
                return (
                  <g key={c} opacity={u}>
                    <rect x={x - CARD_W / 2} y={y - 24} width={CARD_W} height={CARD_H} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
                    <text x={x} y={y} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                      collection at time {c + 1}
                    </text>
                    {rows.map((e, r) => (
                      <text key={r} x={x} y={y + 26 + r * 24} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                        ({e[0]}, {e[1]})
                      </text>
                    ))}
                    <text x={x} y={y + CARD_H - 34} textAnchor="middle" fill={colors.WARM} fontSize={12} fontStyle="italic">
                      full copy #{c + 1}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ---------------- beat 3: the ledger tape ---------------- */}
          {tripleU > 0.01 && (
            <text x={640} y={140} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontFamily={MONO} opacity={tripleU * stageOp}>
              (data, time, diff)
            </text>
          )}
          {tapeU > 0.01 && (
            <g>
              {LEDGER.map((u, i) => {
                const cu = win(tapeU, LEDGER.length, i, 3);
                if (cu <= 0.01) return null;
                const x = chipX(i);
                const y = TAPE_Y + (1 - cu) * -26;
                const pos = u.diff > 0;
                const isCancelPair = u.edge[0] === 1 && u.edge[1] === 2;
                const grayed = cancelU > 0.6 && isCancelPair ? 0.35 : 1;
                return (
                  <g key={i} opacity={cu * grayed}>
                    <rect
                      x={x - CHIP_W / 2}
                      y={y - CHIP_H / 2}
                      width={CHIP_W}
                      height={CHIP_H}
                      rx={9}
                      fill={colors.PANEL}
                      stroke={pos ? colors.POSITIVE : colors.NEGATIVE}
                      strokeWidth={1.5}
                    />
                    <text x={x} y={y + 5} textAnchor="middle" fill={pos ? colors.POSITIVE : colors.NEGATIVE} fontSize={13.5} fontFamily={MONO}>
                      (({u.edge[0]},{u.edge[1]}), t={u.time}, {pos ? '+1' : '−1'})
                    </text>
                  </g>
                );
              })}
              {/* cancellation link between the two (1,2) chips */}
              {cancelU > 0.01 && (
                <g opacity={clamp01(cancelU * 1.5)}>
                  <path
                    d={`M${chipX(0)} ${TAPE_Y - CHIP_H / 2 - 6} C ${chipX(0)} ${TAPE_Y - 64}, ${chipX(4)} ${TAPE_Y - 64}, ${chipX(4)} ${TAPE_Y - CHIP_H / 2 - 6}`}
                    fill="none"
                    stroke={colors.WARM}
                    strokeWidth={2}
                    strokeDasharray="4 5"
                  />
                  <text x={(chipX(0) + chipX(4)) / 2} y={TAPE_Y - 74} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                    +1 − 1 = 0 · consolidate
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---------------- beat 4+: the multiset bar rack ---------------- */}
          {rackU > 0.01 && (
            <g opacity={rackU}>
              <line x1={RACK_X0 - 40} y1={RACK_Y} x2={RACK_X0 + EDGES.length * (BAR_W + BAR_GAP) - BAR_GAP + 40} y2={RACK_Y} stroke={colors.GRID} strokeWidth={2} />
              <text x={RACK_X0 - 52} y={RACK_Y - BAR_H + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                ×1
              </text>
              <text x={RACK_X0 - 52} y={RACK_Y + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                ×0
              </text>
              {EDGES.map((e, i) => {
                const m = multSwept(e, tau);
                const h = m * BAR_H;
                const x = barX(i);
                const dead = cancelU > 0.6 && e[0] === 1 && e[1] === 2;
                // flash when a chip for this edge was just crossed
                let flash = 0;
                let flashPos = true;
                for (let j = 0; j < LEDGER.length; j++) {
                  const u = LEDGER[j];
                  if (u.edge[0] !== e[0] || u.edge[1] !== e[1]) continue;
                  const d = tau - chipTau(j);
                  if (d > 0 && d < 0.28) {
                    flash = 1 - d / 0.28;
                    flashPos = u.diff > 0;
                  }
                }
                return (
                  <g key={i} opacity={dead ? 0.4 : 1}>
                    <rect
                      x={x - BAR_W / 2}
                      y={RACK_Y - h}
                      width={BAR_W}
                      height={Math.max(0.001, h)}
                      rx={6}
                      fill={colors.ACCENT}
                      opacity={0.28 + 0.62 * clamp01(m)}
                    />
                    {flash > 0 && (
                      <rect
                        x={x - BAR_W / 2 - 4}
                        y={RACK_Y - Math.max(h, BAR_H * 0.18) - 4}
                        width={BAR_W + 8}
                        height={Math.max(h, BAR_H * 0.18) + 8}
                        rx={8}
                        fill="none"
                        stroke={flashPos ? colors.POSITIVE : colors.NEGATIVE}
                        strokeWidth={2.5}
                        opacity={flash}
                      />
                    )}
                    <text x={x} y={RACK_Y + 22} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                      {edgeKey(e)}
                    </text>
                    <text x={x} y={RACK_Y - h - 8} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                      {m}
                    </text>
                  </g>
                );
              })}
              {/* the tau playhead riding the tape */}
              {headU > 0.01 && (
                <g opacity={headU}>
                  <line x1={tauToX(tau)} y1={TAPE_Y - 34} x2={tauToX(tau)} y2={RACK_Y - BAR_H - 28} stroke={colors.WARM} strokeWidth={2} strokeDasharray="5 5" />
                  <text x={tauToX(tau)} y={TAPE_Y - 42} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO}>
                    τ = {tau.toFixed(1)}
                  </text>
                </g>
              )}
            </g>
          )}
        </g>

        {/* ---------------- closing panel ---------------- */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={240} y={252} width={800} height={190} rx={16} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={318} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={650}>
              A collection is the running sum
            </text>
            <text x={640} y={354} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={650}>
              of its differences.
            </text>
            <text x={640} y={402} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
              multiset of (data, time, diff)
            </text>
          </g>
        )}
      </Camera>
      <defs>
        <marker id="dd1-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill={colors.ACCENT} />
        </marker>
      </defs>
    </>
  );
}

export const vizScene = () => scene;
