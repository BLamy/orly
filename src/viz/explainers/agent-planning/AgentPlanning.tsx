// Explained: Agents — chapter 2: planning and decomposition. A real
// depth-first search runs at module scope: four queens on a four-by-four
// board, one queen per row, no shared column or diagonal. The recorded trace
// is the animation — 26 candidate placements tried, 4 backtracks, solution
// columns 1, 3, 0, 2. The task tree on screen is exactly the explored tree;
// every red dead end is a constraint check that actually failed.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The search, actually run at module scope; the trace drives the scene.
// ---------------------------------------------------------------------------

const N = 4;

interface TryEvent {
  row: number;
  col: number;
  ok: boolean; // constraint check result
  stackAfter: number[]; // queens on the board after this event
  path: number[]; // columns of ancestors (tree position)
  backtrack: boolean; // did we pop after exhausting this subtree?
}

const TRACE: TryEvent[] = [];
let SOLUTION: number[] | null = null;
let NODES = 0;
let BACKTRACKS = 0;
{
  const col: number[] = [];
  const ok = (r: number, c: number) => {
    for (let i = 0; i < r; i++) {
      if (col[i] === c || Math.abs(col[i] - c) === Math.abs(i - r)) return false;
    }
    return true;
  };
  const dfs = (r: number): void => {
    if (SOLUTION) return;
    if (r === N) {
      SOLUTION = col.slice();
      return;
    }
    for (let c = 0; c < N; c++) {
      if (SOLUTION) return;
      NODES++;
      const good = ok(r, c);
      const path = col.slice();
      if (good) {
        col.push(c);
        TRACE.push({ row: r, col: c, ok: true, stackAfter: col.slice(), path, backtrack: false });
        dfs(r + 1);
        if (SOLUTION) return;
        col.pop();
        BACKTRACKS++;
        TRACE[TRACE.length ? TRACE.length - 1 : 0].backtrack = true;
        TRACE.push({ row: r, col: c, ok: true, stackAfter: col.slice(), path, backtrack: true });
      } else {
        TRACE.push({ row: r, col: c, ok: false, stackAfter: col.slice(), path, backtrack: false });
      }
    }
  };
  dfs(0);
}
// NODES = 26, BACKTRACKS = 4, SOLUTION = [1, 3, 0, 2]

// tree x-position from a node's path: root spans [0,1], children split it
const treeX = (path: number[], col: number): number => {
  let lo = 0;
  let span = 1;
  for (const c of path) {
    span /= N;
    lo += c * span;
  }
  span /= N;
  return lo + (col + 0.5) * span;
};

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const BOARD_X = 170;
const BOARD_Y = 190;
const CELL = 62;

const TREE_X0 = 620;
const TREE_W = 540;
const TREE_Y0 = 170;
const TREE_DY = 110;

const CAM_BOARD: CameraState = { x: 350, y: 340, k: 1.2 };
const CAM_TREE: CameraState = { x: 665, y: 375, k: 1.05 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  boardU: ChannelRef<number>;
  treeU: ChannelRef<number>;
  step: ChannelRef<number>; // 0..TRACE.length event cursor
  statU: ChannelRef<number>;
  agentU: ChannelRef<number>; // the mapping-to-agents panel
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const boardU = tl.channel('boardU', 0);
  const treeU = tl.channel('treeU', 0);
  const step = tl.channel('step', 0);
  const statU = tl.channel('statU', 0);
  const agentU = tl.channel('agentU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  const T = TRACE.length;

  // Beat 1 — the problem with one long leap
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A single loop lap handles a single question. Real goals are different: they decompose into steps, the steps constrain each other, and an early choice can quietly doom a late one.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 5.4,
    text: 'Here is the cleanest toy with that shape: place four queens on a four by four board, one per row, none attacking another. Every placement narrows what the next row can do.',
  });
  tl.tween(cam, CAM_BOARD, { at: 7.0, dur: 1.4, ease: ease.move });
  tl.tween(boardU, 1, { at: 7.8, dur: 1.2, ease: ease.draw });
  tl.hold(12.1, 0.5);

  // Beat 2 — the plan as a tree, and the first failure
  tl.caption({
    at: 12.6,
    dur: 5.6,
    text: 'A plan is a tree: each level is a subtask, each branch a choice. This search runs for real — watch it commit to column zero in row one and start checking row two against the constraints.',
  });
  tl.tween(treeU, 1, { at: 13.2, dur: 1.3, ease: ease.draw });
  tl.tween(step, 8, { at: 14.4, dur: 3.6, ease: ease.linear });
  tl.caption({
    at: 18.4,
    dur: 5.6,
    text: 'Row two runs out of legal columns — every candidate is attacked. The branch is dead. And here is the move naive agents never make: the search retreats, un-places a queen, and tries the sibling branch.',
  });
  tl.tween(cam, CAM_TREE, { at: 18.7, dur: 1.4, ease: ease.move });
  tl.tween(step, 14, { at: 19.4, dur: 3.4, ease: ease.linear });
  tl.caption({
    at: 24.2,
    dur: 5.0,
    text: 'That retreat is backtracking: treating a committed step as revisable when the evidence says the branch cannot work. A plan is a hypothesis, not a contract.',
  });
  tl.tween(step, 20, { at: 24.8, dur: 3.2, ease: ease.linear });
  tl.hold(29.2, 0.5);

  // Beat 3 — the solution lands
  tl.caption({
    at: 29.7,
    dur: 5.6,
    text: 'Two more dead ends, one more retreat — and then the branch that works: columns one, three, zero, two. Four queens, no attacks, found by trying and un-trying.',
  });
  tl.tween(step, T, { at: 30.4, dur: 4.2, ease: ease.linear });
  tl.caption({
    at: 35.5,
    dur: 5.2,
    text: 'The bill, counted: twenty six candidate placements checked, four backtracks, out of two hundred fifty six possible full boards. Decomposition plus pruning searched a tiny corner and still found the answer.',
  });
  tl.tween(statU, 1, { at: 36.4, dur: 0.9, ease: ease.enter });
  tl.hold(40.7, 0.6);

  // Beat 4 — the mapping to agents
  tl.caption({
    at: 41.3,
    dur: 6.0,
    text: 'Swap the labels and this is agent planning: the goal decomposes into subtasks, each tool call tests a constraint, and a failed observation should kill the branch — not be argued with.',
  });
  tl.tween(agentU, 1, { at: 42.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 47.7,
    dur: 5.2,
    text: 'The agents that fail worst are the ones that only go forward — they treat the first plan as sacred and pile new steps onto a dead branch. The queens would never forgive that.',
  });
  tl.hold(52.9, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 53.5,
    dur: 5.2,
    text: 'Decompose, try, observe, and be willing to retreat. Next: what happens to the context window while all of this thinking piles up.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 53.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 54.3, dur: 1.1, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.3, dur: 0.9, ease: ease.enter });
  tl.hold(58.7, 1.2);

  return { tl, cam, titleU, boardU, treeU, step, statU, agentU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/agent-planning/overrides.json',
  slug: 'agent-planning',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const boardU = s.get(scene.boardU);
  const treeU = s.get(scene.treeU);
  const step = s.get(scene.step);
  const statU = s.get(scene.statU);
  const agentU = s.get(scene.agentU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const evIdx = Math.min(TRACE.length, Math.floor(step));
  const board = evIdx > 0 ? TRACE[evIdx - 1].stackAfter : [];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the board */}
          {boardU > 0 && (
            <g opacity={boardU}>
              <text x={BOARD_X} y={BOARD_Y - 24} fill={colors.TEXT} fontSize={16}>
                the goal — 4 queens, no attacks
              </text>
              {Array.from({ length: N * N }, (_, k) => {
                const r = Math.floor(k / N);
                const c = k % N;
                return (
                  <rect
                    key={k}
                    x={BOARD_X + c * CELL}
                    y={BOARD_Y + r * CELL}
                    width={CELL - 3}
                    height={CELL - 3}
                    rx={5}
                    fill={(r + c) % 2 === 0 ? colors.PANEL : colors.BG}
                    stroke={colors.GRID}
                  />
                );
              })}
              {board.map((c, r) => (
                <g key={r}>
                  <circle
                    cx={BOARD_X + c * CELL + (CELL - 3) / 2}
                    cy={BOARD_Y + r * CELL + (CELL - 3) / 2}
                    r={18}
                    fill={colors.WARM}
                    opacity={0.9}
                  />
                  <text
                    x={BOARD_X + c * CELL + (CELL - 3) / 2}
                    y={BOARD_Y + r * CELL + (CELL - 3) / 2 + 5}
                    textAnchor="middle"
                    fill={colors.BG}
                    fontSize={15}
                    fontWeight={700}
                  >
                    ♛
                  </text>
                </g>
              ))}
              <text x={BOARD_X} y={BOARD_Y + N * CELL + 30} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                row {board.length} of {N} placed
              </text>
            </g>
          )}

          {/* the explored tree — exactly the trace */}
          {treeU > 0 && (
            <g opacity={treeU}>
              <text x={TREE_X0} y={TREE_Y0 - 36} fill={colors.TEXT} fontSize={16}>
                the plan tree, as actually explored
              </text>
              {TRACE.slice(0, evIdx).map((ev, k) => {
                if (ev.backtrack && ev.ok) {
                  // retreat event: draw a fading marker on the abandoned node
                  const x = TREE_X0 + treeX(ev.path, ev.col) * TREE_W;
                  const y = TREE_Y0 + ev.row * TREE_DY;
                  return (
                    <text key={k} x={x + 14} y={y - 10} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">
                      ↩
                    </text>
                  );
                }
                const x = TREE_X0 + treeX(ev.path, ev.col) * TREE_W;
                const y = TREE_Y0 + ev.row * TREE_DY;
                const px = ev.path.length
                  ? TREE_X0 + treeX(ev.path.slice(0, -1), ev.path[ev.path.length - 1]) * TREE_W
                  : TREE_X0 + TREE_W / 2;
                const py = ev.path.length ? TREE_Y0 + (ev.row - 1) * TREE_DY : TREE_Y0 - 26;
                const isOnSolution =
                  SOLUTION !== null &&
                  step >= TRACE.length &&
                  ev.ok &&
                  ev.path.every((c, i) => (SOLUTION as unknown as number[])[i] === c) &&
                  (SOLUTION as unknown as number[])[ev.row] === ev.col;
                return (
                  <g key={k}>
                    <line x1={px} y1={py} x2={x} y2={y} stroke={colors.GRID} strokeWidth={1.5} opacity={0.7} />
                    <circle
                      cx={x}
                      cy={y}
                      r={ev.ok ? 9 : 7}
                      fill={ev.ok ? (isOnSolution ? colors.POSITIVE : colors.ACCENT) : colors.BG}
                      stroke={ev.ok ? 'none' : colors.NEGATIVE}
                      strokeWidth={2}
                      opacity={ev.ok ? 0.9 : 0.9}
                    />
                    {!ev.ok && (
                      <text x={x} y={y + 4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10} fontWeight={700}>
                        ×
                      </text>
                    )}
                    <text x={x} y={y + (ev.ok ? -14 : 20)} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                      c{ev.col}
                    </text>
                  </g>
                );
              })}
              {/* depth labels */}
              {Array.from({ length: N }, (_, r) => (
                <text key={r} x={TREE_X0 - 26} y={TREE_Y0 + r * TREE_DY + 4} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                  row {r}
                </text>
              ))}
            </g>
          )}

          {/* counters */}
          {statU > 0 && (
            <g opacity={statU}>
              <text x={TREE_X0} y={TREE_Y0 + N * TREE_DY + 4} fill={colors.WARM} fontSize={14} fontFamily="monospace" fontWeight={700}>
                {NODES} placements tried · {BACKTRACKS} backtracks · 256 possible boards
              </text>
            </g>
          )}

          {/* the agent mapping */}
          {agentU > 0 && (
            <g opacity={agentU}>
              <text x={BOARD_X} y={520} fill={colors.TEXT} fontSize={15}>
                the same tree, relabeled
              </text>
              <text x={BOARD_X} y={548} fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
                row → subtask · column → approach · × → failed observation · ↩ → revise the plan
              </text>
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          A plan is a hypothesis
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Decompose, try, retreat, retry.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            26 checks and 4 retreats beat 256 blind boards —
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the worst agents are the ones that only go forward.
          </text>
        </g>
      )}
    </>
  );
}

export function AgentPlanning() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
