// arXiv:2606.30616 — "Scaling the Horizon, Not the Parameters" (Agents-A1).
// Chapter 2: the harness. The paper's infrastructure grows EXECUTABLE
// SOLUTION TREES: write_full_code opens a new root, patch_code spawns a
// child, execute_code captures stdout / exceptions / validation metrics /
// submission validity at every node, write_notes / read_notes give the agent
// persistent memory. Average trajectory 45K tokens (coding 48K, deep
// research 44K, general agentic 39K, science 37K, instruction following 3K).
// TOY recreation (ours, seeded, computed here): a 5-step task with per-step
// success 0.8. Single-shot: 64/200 rollouts succeed (32%). With a verifier
// and up to 3 patches per step: 192/200 (96%). Same model, longer horizon.
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
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Toy simulation at module scope (seed 11 — verified in node: single 32%,
// harness 96% over 200 rollouts)
// ---------------------------------------------------------------------------

const rand = mulberry32(11);
const N_RUNS = 200;
let singleWins = 0;
let harnessWins = 0;
for (let i = 0; i < N_RUNS; i++) {
  let ok = true;
  for (let st = 0; st < 5; st++) if (rand() >= 0.8) ok = false;
  if (ok) singleWins++;
  let ok2 = true;
  for (let st = 0; st < 5; st++) {
    let stepOk = false;
    for (let t = 0; t < 3; t++) {
      if (rand() < 0.8) { stepOk = true; break; }
    }
    if (!stepOk) { ok2 = false; break; }
  }
  if (ok2) harnessWins++;
}
const SINGLE_RATE = singleWins / N_RUNS; // 0.32
const HARNESS_RATE = harnessWins / N_RUNS; // 0.96

// the demo tree drawn on stage — one root, a failing child, a patched fix
interface TreeNode {
  id: string;
  x: number;
  y: number;
  parent?: string;
  op: string;
  result: 'ok' | 'fail' | 'metric';
  note: string;
}
const TREE: TreeNode[] = [
  { id: 'root', x: 250, y: 190, op: 'write_full_code', result: 'metric', note: 'val 0.61' },
  { id: 'c1', x: 170, y: 300, parent: 'root', op: 'patch_code', result: 'fail', note: 'exception' },
  { id: 'c2', x: 330, y: 300, parent: 'root', op: 'patch_code', result: 'metric', note: 'val 0.68' },
  { id: 'c3', x: 250, y: 410, parent: 'c2', op: 'patch_code', result: 'fail', note: 'val 0.63 ↓' },
  { id: 'c4', x: 410, y: 410, parent: 'c2', op: 'patch_code', result: 'ok', note: 'val 0.74 ✓' },
];

const TRAJ_LENS = [
  { domain: 'coding / ML engineering', kTok: 48 },
  { domain: 'deep research', kTok: 44 },
  { domain: 'general agentic', kTok: 39 },
  { domain: 'scientific reasoning', kTok: 37 },
  { domain: 'instruction following', kTok: 3 },
];

const CAM_TREE: CameraState = { x: 300, y: 300, k: 1.35 };
const CAM_BARS: CameraState = { x: 880, y: 300, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  treeU: ChannelRef<number>;
  bestU: ChannelRef<number>;
  notesU: ChannelRef<number>;
  toyU: ChannelRef<number>;
  runsU: ChannelRef<number>;
  ratesU: ChannelRef<number>;
  lensU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const treeU = tl.channel('treeU', 0);
  const bestU = tl.channel('bestU', 0);
  const notesU = tl.channel('notesU', 0);
  const toyU = tl.channel('toyU', 0);
  const runsU = tl.channel('runsU', 0);
  const ratesU = tl.channel('ratesU', 0);
  const lensU = tl.channel('lensU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the tree grows
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is what a long horizon physically is in this paper. The agent does not write one answer. It grows a tree of executable attempts — every node is real code that actually ran.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_TREE, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(treeU, 1, { at: 1.6, dur: 4.0, ease: ease.linear });
  tl.caption({
    at: 6.5,
    dur: 5.8,
    text: 'Writing fresh code opens a new root. Patching spawns a child. Executing captures the output, the exceptions, and a validation score at every node. The tree remembers everything a shorter run would forget.',
  });
  tl.hold(12.3, 0.6);

  // Beat 2 — the verifier picks
  tl.caption({
    at: 12.9,
    dur: 5.4,
    text: 'One branch throws an exception — dead end, recorded. Another lifts the validation score. Its child dips, so the agent backs up and patches again. The best verified node wins.',
  });
  tl.tween(bestU, 1, { at: 15.4, dur: 0.9, ease: ease.pop });
  tl.caption({
    at: 18.7,
    dur: 4.8,
    text: 'And a notes file rides along the whole way — the agent writes down what it learned and reads it back later, a memory that outlives any single attempt.',
  });
  tl.tween(notesU, 1, { at: 19.6, dur: 0.8, ease: ease.enter });
  tl.hold(23.5, 0.7);

  // Beat 3 — toy measurement
  tl.caption({
    at: 24.2,
    dur: 5.8,
    text: 'Does the loop itself buy anything? Measure it at toy scale. A five step task, eighty percent chance per step, two hundred seeded rollouts. One shot, no retries: about a third of the runs survive all five steps.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 24.4, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAM_BARS, { at: 25.9, dur: 1.2, ease: ease.move });
  tl.tween(toyU, 1, { at: 25.4, dur: 0.8, ease: ease.enter });
  tl.tween(runsU, 0.5, { at: 26.4, dur: 2.4, ease: ease.linear });
  tl.caption({
    at: 30.6,
    dur: 5.8,
    text: 'Now give the same per step skill a verifier and three patches per step. Ninety six percent. Nothing about the model got smarter — the harness converted retries plus verification into reliability.',
  });
  tl.tween(runsU, 1, { at: 31.4, dur: 2.4, ease: ease.linear });
  tl.tween(ratesU, 1, { at: 34.0, dur: 1.0, ease: ease.move });
  tl.hold(36.4, 0.7);

  // Beat 4 — what the real trajectories cost
  tl.caption({
    at: 37.1,
    dur: 6.0,
    text: 'The price is length. The papers real trajectories average forty five thousand tokens — forty eight thousand for engineering, forty four for deep research, and just three thousand where no tools are needed. Horizon is spent where verification exists.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 37.3, dur: 1.3, ease: ease.move });
  tl.tween(lensU, 1, { at: 38.4, dur: 2.4, ease: ease.linear });
  tl.hold(43.1, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 43.8,
    dur: 5.4,
    text: 'So a long horizon is not padding. It is a search structure with receipts: attempts, observations, verifier outcomes, notes. Next question — how does a thirty five billion parameter model learn to drive it?',
  });
  tl.tween(dimU, 1, { at: 44.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 45.0, dur: 1.0, ease: ease.enter });
  tl.hold(49.2, 1.2);

  return {
    tl, cam, titleU, treeU, bestU, notesU, toyU, runsU,
    ratesU, lensU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/horizon-solution-tree/overrides.json',
  slug: 'horizon-solution-tree',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const treeU = s.get(scene.treeU);
  const bestU = s.get(scene.bestU);
  const notesU = s.get(scene.notesU);
  const toyU = s.get(scene.toyU);
  const runsU = s.get(scene.runsU);
  const ratesU = s.get(scene.ratesU);
  const lensU = s.get(scene.lensU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const nodeById = (id: string) => TREE.find((n) => n.id === id)!;

  // toy dots: 10x20 grids, first half = single-shot, second = harness
  const singleShown = clamp01(runsU * 2);
  const harnessShown = clamp01(runsU * 2 - 1);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the solution tree */}
          {TREE.map((n, i) => {
            const u = clamp01(treeU * TREE.length - i);
            if (u <= 0) return null;
            const c = n.result === 'ok' ? colors.POSITIVE : n.result === 'fail' ? colors.NEGATIVE : colors.ACCENT;
            const isBest = n.id === 'c4';
            return (
              <g key={n.id} opacity={u}>
                {n.parent && (
                  <line
                    x1={nodeById(n.parent).x} y1={nodeById(n.parent).y + 24}
                    x2={n.x} y2={n.y - 24}
                    stroke={colors.GRID} strokeWidth={1.5}
                  />
                )}
                {isBest && bestU > 0 && (
                  <circle cx={n.x} cy={n.y} r={40 * bestU} fill={colors.POSITIVE} opacity={0.15 * bestU} />
                )}
                <rect x={n.x - 62} y={n.y - 24} width={124} height={48} rx={10}
                  fill={colors.PANEL} stroke={isBest && bestU > 0.4 ? colors.POSITIVE : colors.GRID}
                  strokeWidth={isBest && bestU > 0.4 ? 2 : 1} />
                <text x={n.x} y={n.y - 5} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>
                  {n.op}
                </text>
                <text x={n.x} y={n.y + 14} textAnchor="middle" fill={c} fontSize={11} fontFamily={MONO}>
                  {n.note}
                </text>
              </g>
            );
          })}
          {notesU > 0 && (
            <g opacity={notesU}>
              <rect x={440} y={150} width={190} height={78} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={456} y={176} fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>
                write_notes / read_notes
              </text>
              <text x={456} y={198} fill={colors.MUTED} fontSize={11}>
                “branch two direction good;
              </text>
              <text x={456} y={214} fill={colors.MUTED} fontSize={11}>
                avoid the c-three regression”
              </text>
            </g>
          )}

          {/* toy measurement */}
          {toyU > 0 && (
            <g opacity={toyU}>
              <text x={700} y={130} fill={colors.TEXT} fontSize={15}>
                toy harness · 200 seeded rollouts · 5 steps at p = 0.8
              </text>
              <text x={700} y={150} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                ours, toy scale — not the paper's benchmark
              </text>
              {/* single-shot grid */}
              <text x={700} y={186} fill={colors.MUTED} fontSize={13}>
                one shot
              </text>
              {Array.from({ length: 100 }, (_, i) => {
                const u = clamp01(singleShown * 100 - i);
                if (u <= 0) return null;
                // deterministic pattern matching the measured 32%: mark i%25<8 as wins
                const win = i % 25 < 8;
                return (
                  <rect key={i} x={700 + (i % 20) * 15} y={196 + Math.floor(i / 20) * 15}
                    width={11} height={11} rx={2}
                    fill={win ? colors.POSITIVE : colors.GRID} opacity={win ? 0.9 : 0.5} />
                );
              })}
              <text x={700} y={306} fill={colors.MUTED} fontSize={13}>
                tree + verifier, 3 patches per step
              </text>
              {Array.from({ length: 100 }, (_, i) => {
                const u = clamp01(harnessShown * 100 - i);
                if (u <= 0) return null;
                const win = i % 25 !== 24; // 96%
                return (
                  <rect key={i} x={700 + (i % 20) * 15} y={316 + Math.floor(i / 20) * 15}
                    width={11} height={11} rx={2}
                    fill={win ? colors.POSITIVE : colors.NEGATIVE} opacity={win ? 0.9 : 0.8} />
                );
              })}
              {ratesU > 0 && (
                <g opacity={ratesU}>
                  <text x={1015} y={240} fill={colors.WARM} fontSize={20} fontFamily={MONO}>
                    {(SINGLE_RATE * 100).toFixed(0)}%
                  </text>
                  <text x={1015} y={360} fill={colors.POSITIVE} fontSize={20} fontFamily={MONO}>
                    {(HARNESS_RATE * 100).toFixed(0)}%
                  </text>
                </g>
              )}
            </g>
          )}

          {/* trajectory lengths */}
          {lensU > 0 && (
            <g>
              <text x={120} y={508} fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={lensU}>
                reported mean trajectory length (tokens) — avg 45K
              </text>
              {TRAJ_LENS.map((d, i) => {
                const u = clamp01(lensU * TRAJ_LENS.length - i);
                if (u <= 0) return null;
                const w = (d.kTok / 50) * 380;
                return (
                  <g key={d.domain} opacity={u}>
                    <text x={318} y={532 + i * 22} textAnchor="end" fill={colors.TEXT} fontSize={12}>
                      {d.domain}
                    </text>
                    <rect x={330} y={522 + i * 22} width={Math.max(w, 3)} height={12} rx={3} fill={colors.ACCENT} opacity={0.7} />
                    <text x={338 + w} y={532 + i * 22} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                      {d.kTok}K
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The solution tree
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2606.30616 · harness
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Horizon is search with receipts
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            executable attempts, verifier outcomes, persistent notes —
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the same per-step skill, converted into reliability
          </text>
        </g>
      )}
    </>
  );
}

export function HorizonSolutionTree() {
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
