// A Swarm Is a Population
//
// Herding the Swarm — chapter 1. D3/SVG scene authored by Claude Opus 5.5. Requested model `claude-opus-5-5`; actual:
// `claude-opus-5-5` (this session's model id). Planned by Claude Opus 5.5 by user override of the Astra-planning
// default (.orly-work/visual-plan.md, chapter 1). The thirteen captions are the fixed narration; claim ids live in
// public/generated/herding-the-swarm/sources.json.
//
// Sources:
//   C3   https://code.claude.com/docs/en/sub-agents  (nesting up to three layers below the main conversation;
//        CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1 turns it off)
//   C10  https://genai.owasp.org/llmrisk/llm062025-excessive-agency/  (minimum permissions; human approval)
//   the rest is the book's own operating guidance, marked `inferred` in sources.json
//
// Schematic versus measured: the tree, the 16-agent budget, the four lanes and every fuel ring are illustrative.
// The only external fact on stage is the subagent depth default (three layers) and its off switch.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import {
  AGENT, AGENT_DIM, BOARD, DANGER, DialRow, FAINT, Habitat, Label, MONO, MUTED, OK, PANEL, Panel, TEXT, TitleChip,
  UI, WALL, clamp01, lerp, lerp2, seg, timing,
} from './shared/kit';
import type { V2 } from './shared/kit';

// ---------------------------------------------------------------------------
// Fixed narration
// ---------------------------------------------------------------------------

const CAPTIONS = [
  /* c0 */ 'One agent can launch a helper, and that helper can launch another. Let that run for a while and you no longer have a tool. You have a population.',
  /* c1 */ 'Populations answer to a handful of pressures: who may reproduce, how crowded it gets, how much food there is, how long anyone lives, who survives, and where they can roam.',
  /* c2 */ 'Start with reproduction. Spawning should happen in one place, through an orchestrator, with a hard limit on how deep the family tree can grow.',
  /* c3 */ 'Claude Code works this way. By default a subagent can spawn its own subagents up to three layers below the main conversation, and one setting turns nesting off entirely.',
  /* c4 */ 'Then give each task a spawn budget before it starts, so a runaway branch hits a ceiling instead of your invoice.',
  /* c5 */ 'Next is density. A hard concurrency limit, enforced by a queue rather than a polite request in a prompt, decides how many agents run at once.',
  /* c6 */ 'Crowding matters per resource too. One agent per worktree, or per file, keeps two workers from overwriting each other.',
  /* c7 */ 'Food is the budget: tokens, money and time. Each agent gets a ration, and the whole swarm gets a pool, because fifty agents each spending a full ration is still fifty rations.',
  /* c8 */ 'Then lifespan. A timeout ends the agent that is stuck, and short lives keep context from piling up. Do one task, report, and exit.',
  /* c9 */ 'Selection decides whose work is kept. It gets the last chapter to itself, because whatever survives your filter is what you end up breeding.',
  /* c10 */ 'Habitat is where they can go. Isolate each agent, give its credentials the minimum it needs, and have a person approve any high-impact action.',
  /* c11 */ 'Last, keep a kill switch that stops every agent at once, and test it, so you know it works before the day you need it.',
  /* c12 */ 'Six dials, then: reproduction, density, food, lifespan, selection and habitat. Next, a real swarm where most of them were left open.',
];
const { T, DUR, END } = timing(CAPTIONS);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const HAB = { x: 120, y: 112, w: 1040, h: 496 };

// Phase A — the lineage tree, depth bands 0..4
const DEPTH_Y = [168, 262, 356, 450, 548];
const ROOT: V2 = [640, DEPTH_Y[0]];
interface TNode { id: number; depth: number; parent: number; p: V2; born: number; blocked: 'depth' | 'budget' | null }
const BUDGET = 16;
const TREE: TNode[] = (() => {
  // children per node by depth; x spread computed per depth row
  const kids = [3, 2, 2, 2];
  const rows: number[][] = [[0]];
  const out: TNode[] = [{ id: 0, depth: 0, parent: -1, p: ROOT, born: 0, blocked: null }];
  for (let d = 1; d <= 4; d++) {
    const row: number[] = [];
    for (const par of rows[d - 1]) {
      const n = d === 4 ? 1 : kids[d - 1];
      // depth 3 only grows from the first five depth-2 nodes, to keep the bottom legible
      if (d === 3 && row.length >= 10) break;
      if (d === 4 && row.length >= 6) break;
      for (let k = 0; k < n; k++) {
        const id = out.length;
        out.push({ id, depth: d, parent: par, p: [0, DEPTH_Y[d]], born: 0, blocked: null });
        row.push(id);
      }
    }
    rows.push(row);
  }
  // x layout: evenly spaced per row inside the habitat, slightly narrower for shallow rows
  rows.forEach((row, d) => {
    const span = [0, 420, 700, 860, 760][d];
    row.forEach((id, k) => {
      const x = row.length === 1 ? 640 : 640 - span / 2 + (span * k) / (row.length - 1);
      out[id].p = [x, DEPTH_Y[d]];
    });
  });
  // birth order = breadth first; depth 4 buds are withheld; the last live ones past the budget are withheld too
  let live = 0;
  out.forEach((n, i) => {
    n.born = i;
    if (n.depth === 4) n.blocked = 'depth';
    else if (live >= BUDGET) n.blocked = 'budget';
    else live++;
  });
  return out;
})();
const LIVE = TREE.filter((n) => !n.blocked);
const N_TREE = TREE.length;

// Phase B — queue and lanes
const LANES = 4;
const LANE_Y = [214, 318, 422, 526];
const LANE_X0 = 470;
const LANE_X1 = 1000;
const QUEUE_P = (q: number): V2 => [200 + (q % 2) * 44, 210 + Math.floor(q / 2) * 47];
const SLOT = 3.2; // flow units per wave
const STUCK = 9; // the agent that hangs and is timed out
interface Run { lane: number; start: number; len: number; spend: number }
const RUNS: Run[] = (() => {
  const r = mulberry32(2611);
  return LIVE.map((_, i) => {
    const len = 2.3 + r() * 0.6;
    return { lane: i % LANES, start: Math.floor(i / LANES) * SLOT + (i % LANES) * 0.18, len, spend: 0.55 + r() * 0.35 };
  });
})();
const FLOW_MAX = Math.floor((LIVE.length - 1) / LANES) * SLOT + 4.6;
const POOL_TOTAL = RUNS.reduce((a, r) => a + r.spend, 0);
// the next batch: arrives in the habitat beat with a fresh pool, and is frozen mid-lane by the kill switch
const BATCH2: Run[] = Array.from({ length: 8 }, (_, k) => ({ lane: k % LANES, start: Math.floor(k / LANES) * 2.5 + (k % LANES) * 0.22, len: 2.4, spend: 0.7 }));
const POOL2 = BATCH2.reduce((a, r) => a + r.spend, 0);
const KEPT = [true, true, false, true, true, true, false, true, true, true, true, false, true, true, true, true];

// cameras
const CAM_ROOT: CameraState = { x: 640, y: 250, k: 1.32 };
const CAM_TREE: CameraState = { x: 640, y: 360, k: 1.0 };
const CAM_LANES: CameraState = { x: 640, y: 360, k: 1.0 };
const CAM_WALL: CameraState = { x: 640, y: 360, k: 0.96 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  habU: ChannelRef<number>;
  grow: ChannelRef<number>; // nodes born so far (0..N_TREE)
  previewU: ChannelRef<number>;
  bandsU: ChannelRef<number>;
  depthNote: ChannelRef<number>;
  budgetU: ChannelRef<number>;
  collapse: ChannelRef<number>;
  flow: ChannelRef<number>;
  flow2: ChannelRef<number>;
  batchU: ChannelRef<number>;
  laneU: ChannelRef<number>;
  lockU: ChannelRef<number>;
  fuelU: ChannelRef<number>;
  stuckU: ChannelRef<number>;
  gateU: ChannelRef<number>;
  wallU: ChannelRef<number>;
  killU: ChannelRef<number>;
  fadeU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const habU = tl.channel('habU', 0);
  const grow = tl.channel('grow', 0);
  const previewU = tl.channel('previewU', 0);
  const bandsU = tl.channel('bandsU', 0);
  const depthNote = tl.channel('depthNote', 0);
  const budgetU = tl.channel('budgetU', 0);
  const collapse = tl.channel('collapse', 0);
  const flow = tl.channel('flow', 0);
  const flow2 = tl.channel('flow2', 0);
  const batchU = tl.channel('batchU', 0);
  const laneU = tl.channel('laneU', 0);
  const lockU = tl.channel('lockU', 0);
  const fuelU = tl.channel('fuelU', 0);
  const stuckU = tl.channel('stuckU', 0);
  const gateU = tl.channel('gateU', 0);
  const wallU = tl.channel('wallU', 0);
  const killU = tl.channel('killU', 0);
  const fadeU = tl.channel('fadeU', 0);
  const closeU = tl.channel('closeU', 0);

  // each line holds until the next starts, so the caption never blinks off between lines
  CAPTIONS.forEach((text, i) => tl.caption({ at: T[i], dur: i < CAPTIONS.length - 1 ? T[i + 1] - T[i] : DUR[i], text }));

  // C0 — one agent, then its helpers: push in on the root, let the first generations appear
  tl.tween(titleU, 1, { at: 0.3, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_ROOT, { at: 0.4, dur: 1.4, ease: ease.move });
  tl.tween(grow, 1, { at: 0.9, dur: 0.6, ease: ease.enter });
  tl.tween(grow, 4, { at: 2.6, dur: 1.6, ease: ease.linear });
  tl.tween(grow, 10, { at: 4.6, dur: 2.6, ease: ease.linear });
  tl.tween(cam, CAM_TREE, { at: 5.0, dur: 1.6, ease: ease.move });
  tl.tween(habU, 1, { at: T[0] + DUR[0] - 2.2, dur: 1.4, ease: ease.draw });
  tl.hold(T[0] + DUR[0], 0.6);

  // C1 — the six pressures, previewed on a panel over the paused tree
  tl.tween(previewU, 1, { at: T[1] + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(previewU, 0, { at: T[1] + DUR[1] - 0.4, dur: 0.6, ease: ease.move });

  // C2 — reproduction: depth bands draw in; the tree keeps growing to depth 3
  tl.tween(bandsU, 1, { at: T[2] + 0.4, dur: 1.2, ease: ease.draw });
  tl.tween(grow, 16, { at: T[2] + 2.0, dur: 3.6, ease: ease.linear });

  // C3 — the depth cap: depth-4 buds try and are withheld
  tl.tween(grow, N_TREE, { at: T[3] + 0.6, dur: 3.2, ease: ease.linear });
  tl.tween(depthNote, 1, { at: T[3] + 3.4, dur: 0.7, ease: ease.enter });

  // C4 — the spawn budget: the counter caps, the over-budget buds go hollow
  tl.tween(budgetU, 1, { at: T[4] + 0.4, dur: 1.4, ease: ease.move });
  tl.hold(T[4] + DUR[4] - 0.8, 0.6);

  // C5 — density: the tree collapses into a queue and four lanes; the first wave runs
  tl.tween(depthNote, 0, { at: T[5], dur: 0.5, ease: ease.move });
  tl.tween(collapse, 1, { at: T[5] + 0.2, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAM_LANES, { at: T[5] + 0.2, dur: 1.6, ease: ease.move });
  tl.tween(laneU, 1, { at: T[5] + 1.2, dur: 1.2, ease: ease.draw });
  tl.tween(flow, 1.6, { at: T[5] + 2.6, dur: DUR[5] - 2.0, ease: ease.linear });

  // C6 — one agent per worktree: locks on each lane
  tl.tween(lockU, 1, { at: T[6] + 0.8, dur: 0.7, ease: ease.pop });
  tl.tween(flow, 3.0, { at: T[6], dur: DUR[6] + 0.7, ease: ease.linear });

  // C7 — food: rations and the swarm pool
  tl.tween(fuelU, 1, { at: T[7] + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(flow, 6.6, { at: T[7], dur: DUR[7] + 0.7, ease: ease.linear });

  // C8 — lifespan: one agent hangs, its timeout runs out
  tl.tween(stuckU, 1, { at: T[8] + 0.4, dur: DUR[8] - 1.0, ease: ease.linear });
  tl.tween(flow, 9.4, { at: T[8], dur: DUR[8] + 0.7, ease: ease.linear });

  // C9 — selection: outputs reach a gate; some are kept
  tl.tween(gateU, 1, { at: T[9] + 0.3, dur: 0.8, ease: ease.enter });
  tl.tween(flow, FLOW_MAX, { at: T[9], dur: DUR[9] + 0.7, ease: ease.linear });

  // C10 — habitat: the wall thickens, keys are scoped, a door asks a person
  tl.tween(cam, CAM_WALL, { at: T[10], dur: 1.2, ease: ease.move });
  tl.tween(wallU, 1, { at: T[10] + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(batchU, 1, { at: T[10] + 1.6, dur: 0.8, ease: ease.enter });
  tl.tween(flow2, 3.5, { at: T[10] + 2.4, dur: T[11] + 1.6 - (T[10] + 2.4), ease: ease.linear });

  // C11 — the kill switch flips; everything stops
  tl.tween(killU, 1, { at: T[11] + 1.6, dur: 0.7, ease: ease.move });

  // C12 — clean close: the stage fades to a whisper; the six dials, all set, on an opaque panel
  tl.tween(fadeU, 1, { at: T[12], dur: 1.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: T[12], dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: T[12] + 0.6, dur: 1.4, ease: ease.enter });
  tl.hold(END - 0.8, 0.8);

  return { tl, cam, titleU, habU, grow, previewU, bandsU, depthNote, budgetU, collapse, flow, flow2, batchU, laneU, lockU, fuelU, stuckU, gateU, wallU, killU, fadeU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

/** Where live agent i is at flow `f`: queued, running in its lane, or gone. */
function runState(i: number, f: number, stuck: number) {
  const r = RUNS[i];
  const isStuck = i === STUCK;
  const len = isStuck ? 6.0 : r.len;
  const u = (f - r.start) / len;
  // queue index: how many earlier agents are still waiting determines nothing visually; each keeps its slot
  if (u <= 0) {
    // queued agents close ranks as the ones ahead of them start
    const started = RUNS.reduce((a, rr) => a + (f > rr.start ? 1 : 0), 0);
    return { phase: 'queued' as const, u: 0, p: QUEUE_P(i - started) };
  }
  const laneY = LANE_Y[r.lane];
  if (isStuck) {
    // the stuck agent stops a third of the way down its lane; the timeout removes it
    const x = lerp(LANE_X0, LANE_X1, Math.min(clamp01(u * 2.2), 0.34));
    return { phase: stuck >= 1 ? ('timedout' as const) : ('running' as const), u, p: [x, laneY] as V2 };
  }
  if (u >= 1) return { phase: 'done' as const, u: 1, p: [LANE_X1, laneY] as V2, since: f - (r.start + len) };
  return { phase: 'running' as const, u, p: [lerp(LANE_X0, LANE_X1, u), laneY] as V2 };
}

function Key({ x, y, u }: { x: number; y: number; u: number }) {
  if (u <= 0.01) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${0.6 + 0.4 * u})`} opacity={u}>
      <circle cx={-6} r={5} fill="none" stroke={BOARD} strokeWidth={2} />
      <path d="M-1,0 H10 M6,0 V4 M9,0 V3" stroke={BOARD} strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Lock({ x, y, u, color = WALL }: { x: number; y: number; u: number; color?: string }) {
  if (u <= 0.01) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${u})`}>
      <path d="M-5,-2 V-6 A5,5 0 0 1 5,-6 V-2" fill="none" stroke={color} strokeWidth={2} />
      <rect x={-7} y={-2} width={14} height={11} rx={2} fill={color} />
    </g>
  );
}

function Person({ x, y, u }: { x: number; y: number; u: number }) {
  if (u <= 0.01) return null;
  return (
    <g transform={`translate(${x},${y})`} opacity={u}>
      <circle cy={-14} r={7} fill={TEXT} />
      <path d="M-11,10 Q-11,-4 0,-4 Q11,-4 11,10 Z" fill={TEXT} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>) => s.get(ch);
  const cam = s.get(scene.cam);
  const grow = v(scene.grow);
  const collapse = v(scene.collapse);
  const flow = v(scene.flow);
  const fuelU = v(scene.fuelU);
  const stuck = v(scene.stuckU);
  const gateU = v(scene.gateU);
  const wallU = v(scene.wallU);
  const killU = v(scene.killU);
  const fade = v(scene.fadeU);
  const closeU = v(scene.closeU);
  const budgetU = v(scene.budgetU);
  const bandsU = v(scene.bandsU);
  const laneU = v(scene.laneU);
  const lockU = v(scene.lockU);

  const stageOp = 1 - 0.9 * fade; // ≤ 0.1 under the closing panel
  const treeOp = 1 - collapse;

  // counters
  const born = TREE.filter((n) => n.born < grow - 0.5);
  const liveBorn = born.filter((n) => !n.blocked).length;
  let running = 0;
  let queued = 0;
  let spent = 0;
  LIVE.forEach((_, i) => {
    const st = runState(i, flow, stuck);
    if (st.phase === 'queued') queued++;
    if (st.phase === 'running') running++;
    const r = RUNS[i];
    spent += r.spend * clamp01(st.u);
  });
  const flow2 = v(scene.flow2);
  const batchU = v(scene.batchU);
  let spent2 = 0;
  const b2 = BATCH2.map((r, k) => {
    const u = (flow2 - r.start) / r.len;
    spent2 += r.spend * clamp01(u);
    if (u <= 0) {
      const started = BATCH2.reduce((a, rr) => a + (flow2 > rr.start ? 1 : 0), 0);
      return { p: QUEUE_P(k - started), u: 0, live: true };
    }
    return { p: [lerp(LANE_X0, LANE_X1, clamp01(u)), LANE_Y[r.lane]] as V2, u: clamp01(u), live: u < 1 };
  });
  if (batchU > 0.01) {
    running = b2.filter((b) => b.u > 0 && b.live).length;
    queued = b2.filter((b) => b.u === 0).length;
  }
  const pool = batchU > 0.01 ? lerp(1 - spent / POOL_TOTAL, 1 - spent2 / POOL2, batchU) : 1 - spent / POOL_TOTAL;

  return (
    <>
      <Camera {...cam}>
        <g opacity={stageOp}>
          <Habitat x={HAB.x} y={HAB.y} w={HAB.w} h={HAB.h} draw={v(scene.habU)} weight={lerp(1.6, 6, wallU)} label="HABITAT" />

          {/* ---------- Phase A: the lineage tree ---------- */}
          {treeOp > 0.01 && (
            <g opacity={treeOp}>
              {/* depth bands */}
              {bandsU > 0.01 &&
                DEPTH_Y.slice(1).map((y, d) => {
                  const capped = d + 1 === 4;
                  return (
                    <g key={y} opacity={bandsU}>
                      <line x1={HAB.x + 30} x2={lerp(HAB.x + 30, HAB.x + HAB.w - 30, bandsU)} y1={y + 26} y2={y + 26} stroke={capped ? DANGER : FAINT} strokeWidth={1.2} strokeDasharray="4 6" />
                      <text x={HAB.x + 34} y={y + 4} fill={capped ? DANGER : MUTED} fontFamily={MONO} fontSize={12}>
                        {capped ? 'depth 4 · withheld' : `depth ${d + 1}`}
                      </text>
                    </g>
                  );
                })}
              {/* edges */}
              {TREE.map((n) => {
                if (n.parent < 0) return null;
                const u = clamp01(grow - n.born);
                if (u <= 0) return null;
                const pp = TREE[n.parent].p;
                const tip = lerp2(pp, n.p, n.blocked === 'depth' ? Math.min(u, 0.55) : u);
                const col = n.blocked === 'depth' ? DANGER : n.blocked === 'budget' ? lerp(0, 1, budgetU) > 0.5 ? FAINT : AGENT_DIM : AGENT_DIM;
                return <line key={`e${n.id}`} x1={pp[0]} y1={pp[1]} x2={tip[0]} y2={tip[1]} stroke={col} strokeWidth={1.6} strokeDasharray={n.blocked === 'depth' ? '3 4' : undefined} />;
              })}
              {/* nodes */}
              {TREE.map((n) => {
                const u = clamp01(grow - n.born);
                if (u <= 0) return null;
                if (n.blocked === 'depth') {
                  const tip = lerp2(TREE[n.parent].p, n.p, 0.55);
                  const xs = clamp01((u - 0.5) * 2);
                  return (
                    <g key={n.id} transform={`translate(${tip[0]},${tip[1]})`} opacity={xs}>
                      <path d="M-6,-6 L6,6 M6,-6 L-6,6" stroke={DANGER} strokeWidth={2.4} strokeLinecap="round" />
                    </g>
                  );
                }
                const hollow = n.blocked === 'budget' ? budgetU : 0;
                return (
                  <g key={n.id} transform={`translate(${n.p[0]},${n.p[1]}) scale(${0.4 + 0.6 * u})`} opacity={u}>
                    <circle r={n.depth === 0 ? 10 : 7.5} fill={lerp(0, 1, hollow) > 0.5 ? PANEL : AGENT} stroke={hollow > 0.01 ? MUTED : 'none'} strokeWidth={1.6} strokeDasharray={hollow > 0.5 ? '2 3' : undefined} />
                  </g>
                );
              })}
              <Label x={ROOT[0] + 22} y={ROOT[1] - 14} text="orchestrator" anchor="start" size={13} color={MUTED} opacity={clamp01(grow) * (1 - bandsU * 0.3)} />
              {/* C3 note */}
              <g opacity={v(scene.depthNote)}>
                <rect x={810} y={128} width={330} height={60} rx={10} fill={PANEL} stroke={FAINT} />
                <text x={826} y={152} fill={TEXT} fontFamily={UI} fontSize={14}>Claude Code: nesting up to 3 layers deep</text>
                <text x={826} y={174} fill={MUTED} fontFamily={MONO} fontSize={11.5}>CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1</text>
              </g>
              {/* C4 budget counter */}
              <g opacity={budgetU}>
                <rect x={140} y={128} width={210} height={58} rx={10} fill={PANEL} stroke={FAINT} />
                <text x={156} y={152} fill={MUTED} fontFamily={MONO} fontSize={12}>spawn budget</text>
                <text x={156} y={176} fill={liveBorn >= BUDGET ? BOARD : TEXT} fontFamily={MONO} fontSize={18} fontWeight={600}>
                  {Math.min(liveBorn, BUDGET)} / {BUDGET}
                </text>
              </g>
            </g>
          )}

          {/* ---------- Phase B: queue + lanes ---------- */}
          {laneU > 0.01 && (
            <g opacity={laneU}>
              <text x={198} y={186} fill={MUTED} fontFamily={MONO} fontSize={12}>queue</text>
              {LANE_Y.map((y, k) => (
                <g key={y}>
                  <line x1={LANE_X0 - 30} x2={lerp(LANE_X0 - 30, LANE_X1 + 30, laneU)} y1={y} y2={y} stroke={FAINT} strokeWidth={20} strokeLinecap="round" opacity={0.55} />
                  <text x={LANE_X0 - 40} y={y - 18} fill={MUTED} fontFamily={MONO} fontSize={11.5}>{`worktree ${'abcd'[k]}`}</text>
                  <Lock x={LANE_X0 - 56} y={y + 2} u={lockU} />
                  <Key x={LANE_X0 + 90} y={y - 22} u={wallU} />
                </g>
              ))}
              <text x={LANE_X0 + 106} y={LANE_Y[0] - 40} fill={BOARD} fontFamily={MONO} fontSize={11.5} opacity={wallU}>scoped keys</text>
              {/* concurrency readout */}
              <rect x={146} y={126} width={232} height={34} rx={8} fill={PANEL} stroke={FAINT} />
              <text x={160} y={148} fill={TEXT} fontFamily={MONO} fontSize={13}>
                {`running ${running}/${LANES} · queued ${queued}`}
              </text>
              {/* swarm pool */}
              <g opacity={fuelU}>
                <text x={LANE_X0 - 14} y={147} textAnchor="end" fill={MUTED} fontFamily={MONO} fontSize={11.5}>swarm pool</text>
                <rect x={LANE_X0} y={136} width={430} height={14} rx={6} fill={FAINT} />
                <rect x={LANE_X0} y={136} width={430 * clamp01(pool)} height={14} rx={6} fill={pool < 0.25 ? DANGER : WALL} />
              </g>
              {/* selection gate */}
              <g opacity={gateU}>
                <rect x={1036} y={186} width={10} height={352} rx={4} fill={OK} opacity={0.6} />
                <text x={1041} y={176} textAnchor="middle" fill={OK} fontFamily={MONO} fontSize={11.5}>filter</text>
              </g>
              {/* approval door at the bottom wall */}
              <g opacity={wallU}>
                <rect x={600} y={HAB.y + HAB.h - 10} width={80} height={20} rx={4} fill={PANEL} stroke={BOARD} strokeWidth={2} />
                <Lock x={640} y={HAB.y + HAB.h - 1} u={wallU} color={BOARD} />
                <Person x={720} y={HAB.y + HAB.h + 2} u={wallU} />
                <text x={600} y={HAB.y + HAB.h - 18} fill={BOARD} fontFamily={MONO} fontSize={11.5}>high-impact: approve</text>
              </g>
            </g>
          )}

          {/* ---------- the population (persistent) ---------- */}
          {LIVE.map((n, i) => {
            const st = runState(i, flow, stuck);
            const tp = n.p;
            const bornU = clamp01(grow - n.born);
            if (bornU <= 0) return null;
            if (collapse < 0.001) return null; // tree draws its own nodes until the collapse starts
            const p = collapse < 1 ? lerp2(tp, QUEUE_P(i), collapse) : st.p;
            let op = 1;
            let color = AGENT;
            if (st.phase === 'done') op = clamp01(1 - (st.since ?? 0) / 0.45);
            if (st.phase === 'timedout') op = 0;
            if (i === STUCK && st.phase === 'running' && stuck > 0.6) color = DANGER;
            color = killU > 0.5 ? MUTED : color;
            const fuel = st.phase === 'queued' ? 1 : 1 - RUNS[i].spend * clamp01(st.u) * (i === STUCK ? 1.6 : 1);
            return (
              <g key={n.id} opacity={op}>
                <circle cx={p[0]} cy={p[1]} r={7.5} fill={color} />
                {fuelU > 0.01 && collapse >= 1 && (
                  <g opacity={fuelU}>
                    <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={FAINT} strokeWidth={2} />
                    <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={fuel < 0.3 ? DANGER : WALL} strokeWidth={2} pathLength={1} strokeDasharray={`${clamp01(fuel)} 1`} transform={`rotate(-90 ${p[0]} ${p[1]})`} />
                  </g>
                )}
                {i === STUCK && st.phase === 'running' && stuck > 0.01 && (
                  <g>
                    <circle cx={p[0]} cy={p[1]} r={20} fill="none" stroke={DANGER} strokeWidth={2} pathLength={1} strokeDasharray={`${1 - stuck} 1`} transform={`rotate(-90 ${p[0]} ${p[1]})`} />
                    <text x={p[0]} y={p[1] - 28} textAnchor="middle" fill={DANGER} fontFamily={MONO} fontSize={11.5}>timeout</text>
                  </g>
                )}
              </g>
            );
          })}
          {/* the next batch, frozen by the kill switch */}
          {batchU > 0.01 &&
            b2.map((b, k) => (
              <g key={`b2${k}`} opacity={batchU * (b.live ? 1 : 0)}>
                <circle cx={b.p[0]} cy={b.p[1]} r={7.5} fill={killU > 0.5 ? MUTED : AGENT} />
                <circle cx={b.p[0]} cy={b.p[1]} r={12} fill="none" stroke={FAINT} strokeWidth={2} />
                <circle cx={b.p[0]} cy={b.p[1]} r={12} fill="none" stroke={killU > 0.5 ? MUTED : WALL} strokeWidth={2} pathLength={1} strokeDasharray={`${clamp01(1 - BATCH2[k].spend * b.u)} 1`} transform={`rotate(-90 ${b.p[0]} ${b.p[1]})`} />
                {killU > 0.5 && <path d={`M${b.p[0] - 4},${b.p[1] - 4} V${b.p[1] + 4} M${b.p[0] + 4},${b.p[1] - 4} V${b.p[1] + 4}`} stroke={PANEL} strokeWidth={2.4} opacity={seg(killU, 0.5, 1)} />}
              </g>
            ))}
          {/* outputs through the gate: kept ones continue, rejected ones drop */}
          {gateU > 0.01 &&
            LIVE.map((_, i) => {
              const st = runState(i, flow, stuck);
              if (st.phase !== 'done') return null;
              const since = st.since ?? 0;
              const k = clamp01(since / 1.2);
              const y = LANE_Y[RUNS[i].lane];
              const kept = KEPT[i];
              const x = lerp(LANE_X1 + 14, 1112, k);
              const yy = kept ? y : y + 40 * k * k;
              return <rect key={`o${i}`} x={x - 5} y={yy - 5} width={10} height={10} rx={2} fill={kept ? OK : DANGER} opacity={(kept ? 1 : 1 - k) * gateU} />;
            })}

          {/* kill switch */}
          {v(scene.wallU) > 0.5 && (
            <g transform="translate(1100,138)" opacity={clamp01((v(scene.wallU) - 0.5) * 2)}>
              <rect x={-36} y={-16} width={72} height={32} rx={16} fill={killU > 0.5 ? DANGER : FAINT} />
              <circle cx={lerp(-20, 20, killU)} cy={0} r={12} fill={TEXT} />
              <text x={-44} y={5} textAnchor="end" fill={killU > 0.5 ? DANGER : MUTED} fontFamily={MONO} fontSize={12}>kill switch</text>
              <text x={0} y={36} textAnchor="middle" fill={OK} fontFamily={MONO} fontSize={11.5} opacity={seg(killU, 0.6, 1)}>tested ✓</text>
            </g>
          )}
        </g>

        {/* C1 preview panel: the six pressures */}
        {v(scene.previewU) > 0.01 && (
          <g opacity={v(scene.previewU)}>
            <Panel x={150} y={270} w={980} h={200} opacity={0.96} />
            <DialRow cx={640} y={340} u={v(scene.previewU)} states={['off', 'off', 'off', 'off', 'off', 'off']} />
          </g>
        )}
      </Camera>

      <TitleChip kicker="HERDING THE SWARM · 1" title="A Swarm Is a Population" opacity={v(scene.titleU) * (1 - closeU)} />

      {/* closing frame */}
      {closeU > 0.01 && (
        <g opacity={closeU}>
          <Panel x={110} y={150} w={1060} h={380} opacity={0.97} />
          <Label x={640} y={214} text="Six dials for a population of agents" size={24} weight={600} />
          <DialRow cx={640} y={318} u={closeU} states={['set', 'set', 'set', 'set', 'set', 'set']} />
          <Label x={640} y={478} text="Next: a real swarm where most of them were left open." size={16} color={MUTED} italic opacity={seg(closeU, 0.6, 1)} />
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
