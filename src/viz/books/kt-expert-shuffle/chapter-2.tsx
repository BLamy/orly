// Four Ways to Deal — the expert placement strategies.
//
// Backed by: doc/en/kt-kernel/experts-sched-Tutorial.md ("Expert Placement
// Strategies" table: uniform / frequency / front-loading / random, "Randomly
// selects experts with fixed seed (42)", "--init-expert-location: Path to
// activation statistics file (.pt) for frequency strategy") and
// kt-kernel/README.md (--kt-expert-placement-strategy guidelines).
//
// The SAME layers × experts grid from chapter one, now dealt four ways: the
// GPU mask recolors under each strategy while a strategy selector steps
// through the real flag values. One grid, four masks, one honest comparison.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The grid + the four masks, all precomputed.
// ---------------------------------------------------------------------------

const ROWS = 8;
const COLS = 16;
const BUDGET = 4; // GPU experts per layer (uniform budget = 32 total)
const rand = mulberry32(7); // same seed as chapter 1 → same heat wall
export const HEAT: number[][] = Array.from({ length: ROWS }, () => {
  const row = Array.from({ length: COLS }, () => 0.04 + rand() * 0.16);
  for (let h = 0; h < 3; h++) {
    const j = Math.floor(rand() * COLS);
    row[j] = Math.min(1, 0.55 + rand() * 0.45);
  }
  return row;
});

// masks[k][i][j] = true if (i,j) is on the GPU under strategy k
const TOTAL_GPU = ROWS * BUDGET;

// uniform: BUDGET evenly-spaced columns in every row
const maskUniform = HEAT.map((row) => row.map((_, j) => j % (COLS / BUDGET) === 0));
// frequency: top-BUDGET by heat per row (statistics-guided)
const maskFrequency = HEAT.map((row) => {
  const cut = [...row].sort((a, b) => b - a)[BUDGET - 1];
  return row.map((v) => v >= cut);
});
// front-loading: fill whole rows from layer 1 until the total budget is spent
const maskFront = HEAT.map((row, i) => row.map(() => i < TOTAL_GPU / COLS));
// random: fixed seed (the docs say seed 42)
const rand42 = mulberry32(42);
const maskRandom = HEAT.map((row) => {
  const picks = new Set<number>();
  while (picks.size < BUDGET) picks.add(Math.floor(rand42() * COLS));
  return row.map((_, j) => picks.has(j));
});

const STRATS = [
  { key: 'uniform', desc: 'evenly spread, no statistics needed (the default)', mask: maskUniform, color: colors.ACCENT },
  { key: 'frequency', desc: 'hottest experts first — needs activation statistics', mask: maskFrequency, color: colors.WARM },
  { key: 'front-loading', desc: 'fill whole layers from the first one onward', mask: maskFront, color: colors.SECONDARY },
  { key: 'random', desc: 'random picks, fixed seed 42 — the baseline', mask: maskRandom, color: colors.MUTED },
] as const;

// coverage score per strategy: how much of the heat its mask captures
const coverage = STRATS.map((st) => {
  let got = 0;
  let all = 0;
  for (let i = 0; i < ROWS; i++)
    for (let j = 0; j < COLS; j++) {
      all += HEAT[i][j];
      if (st.mask[i][j]) got += HEAT[i][j];
    }
  return got / all;
});

const GRID = { x: 300, y: 150, cell: 34, gap: 5 } as const;
const gridW = COLS * (GRID.cell + GRID.gap);
const gridH = ROWS * (GRID.cell + GRID.gap);

const CAM_GRID: CameraState = { x: 640, y: 320, k: 1.22 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  stratK: ChannelRef<number>; // 0..3 which strategy mask is live (lerped)
  selU: ChannelRef<number>; // selector rail
  statsU: ChannelRef<number>; // the .pt statistics chip (frequency only)
  scoreU: ChannelRef<number>; // captured-heat meter
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const stratK = tl.channel('stratK', 0);
  const selU = tl.channel('selU', 0);
  const statsU = tl.channel('statsU', 0);
  const scoreU = tl.channel('scoreU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · same wall, one question —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Same wall of experts, same budget of four seats per layer. The launch flag that decides who sits down is the placement strategy — and it ships four answers.',
  });
  tl.tween(gridU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_GRID, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(selU, 1, { at: 2.6, dur: 1.0, ease: ease.enter });
  tl.hold(6.5, 0.5);

  // — Beat 2 · uniform —
  tl.caption({
    at: 7.0,
    dur: 6.5,
    text: 'Uniform is the default: spread the seats evenly across every layer, no questions asked. It needs zero prior knowledge, and it never embarrasses you.',
  });
  tl.tween(scoreU, 1, { at: 8.0, dur: 0.8, ease: ease.enter });
  tl.hold(13.5, 0.5);

  // — Beat 3 · frequency —
  tl.caption({
    at: 14.0,
    dur: 7.0,
    text: 'Frequency plays favorites: give the seats to the experts your traffic actually hits. It needs receipts — an activation statistics file recorded from a previous run.',
  });
  tl.tween(stratK, 1, { at: 14.4, dur: 1.2, ease: ease.move });
  tl.tween(statsU, 1, { at: 16.4, dur: 0.8, ease: ease.enter });
  tl.hold(21.0, 0.5);

  // — Beat 4 · the coverage jump —
  tl.caption({
    at: 21.5,
    dur: 5.5,
    text: 'Watch the meter: with the same number of seats, frequency captures far more of the heat than an even spread ever could.',
  });
  tl.hold(27.0, 0.5);

  // — Beat 5 · front-loading —
  tl.caption({
    at: 27.5,
    dur: 6.0,
    text: 'Front loading fills whole layers from the first one onward — useful for testing and for workloads that hammer the early layers.',
  });
  tl.tween(statsU, 0, { at: 27.7, dur: 0.6, ease: ease.move });
  tl.tween(stratK, 2, { at: 27.9, dur: 1.2, ease: ease.move });
  tl.hold(33.5, 0.5);

  // — Beat 6 · random —
  tl.caption({
    at: 34.0,
    dur: 6.0,
    text: 'And random — seed forty two, always the same deal — exists so every other strategy has a baseline to beat. Honest experiments need a control group.',
  });
  tl.tween(stratK, 3, { at: 34.4, dur: 1.2, ease: ease.move });
  tl.hold(40.0, 0.5);

  // — Beat 7 · back to frequency, the winner —
  tl.caption({
    at: 40.5,
    dur: 6.5,
    text: 'On the project’s own benchmark, frequency wins whenever statistics exist — at eighty percent seat coverage it reports one hundred tokens per second against eighty for random.',
  });
  tl.tween(stratK, 1, { at: 40.9, dur: 1.4, ease: ease.move });
  tl.hold(46.5, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 47.0,
    dur: 7.0,
    text: 'But every one of these deals is struck at boot time, from yesterday’s statistics. What if the seating chart could change while the server runs? Hold that thought.',
  });
  tl.tween(cam, CAM_WIDE, { at: 47.2, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 47.9, dur: 1.3, ease: ease.move });
  tl.hold(53.5, 1.4);

  return { tl, cam, gridU, stratK, selU, statsU, scoreU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const stratK = s.get(scene.stratK);
  const selU = s.get(scene.selU);
  const statsU = s.get(scene.statsU);
  const scoreU = s.get(scene.scoreU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  const kLo = Math.min(3, Math.max(0, Math.floor(stratK)));
  const kHi = Math.min(3, kLo + 1);
  const kFrac = clamp01(stratK - kLo);
  // per-cell GPU membership, blended between neighboring strategies
  const memb = (i: number, j: number): number =>
    (STRATS[kLo].mask[i][j] ? 1 - kFrac : 0) + (STRATS[kHi].mask[i][j] ? kFrac : 0);
  const liveCoverage = coverage[kLo] * (1 - kFrac) + coverage[kHi] * kFrac;
  const liveColorK = kFrac < 0.5 ? kLo : kHi;
  const total = ROWS * COLS;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* strategy selector rail */}
          <g opacity={selU}>
            <text x={GRID.x - 4} y={84} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
              --kt-expert-placement-strategy
            </text>
            {STRATS.map((st, k) => {
              const on = clamp01(1 - Math.abs(stratK - k));
              return (
                <g key={st.key}>
                  <rect x={GRID.x - 4 + k * 158} y={94} width={146} height={30} rx={8} fill={on > 0.5 ? colors.PANEL : colors.BG} stroke={on > 0.5 ? st.color : colors.GRID} strokeWidth={on > 0.5 ? 1.6 : 1} />
                  <text x={GRID.x + 69 + k * 158} y={114} textAnchor="middle" fill={on > 0.5 ? st.color : colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
                    {st.key}
                  </text>
                </g>
              );
            })}
          </g>

          {/* the grid */}
          {HEAT.map((row, i) =>
            row.map((v, j) => {
              const cellIn = clamp01(gridU * total * 1.15 - (i * COLS + j));
              const m = memb(i, j);
              const x = GRID.x + j * (GRID.cell + GRID.gap);
              const y = GRID.y + i * (GRID.cell + GRID.gap);
              return (
                <g key={`${i}-${j}`} opacity={cellIn}>
                  <rect
                    x={x}
                    y={y}
                    width={GRID.cell}
                    height={GRID.cell}
                    rx={5}
                    fill={v > 0.5 ? colors.WARM : v > 0.25 ? colors.SECONDARY : colors.MUTED}
                    opacity={0.1 + 0.6 * v}
                  />
                  {m > 0.02 && (
                    <rect x={x} y={y} width={GRID.cell} height={GRID.cell} rx={5} fill="none" stroke={STRATS[liveColorK].color} strokeWidth={2} opacity={m} />
                  )}
                </g>
              );
            }),
          )}
          <g opacity={gridU}>
            <text x={GRID.x - 18} y={GRID.y + 10} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
              layers
            </text>
            <text x={GRID.x + gridW / 2} y={GRID.y + gridH + 18} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              outlined = seated on the GPU (budget: 4 per layer)
            </text>
          </g>

          {/* strategy description line */}
          <g opacity={selU}>
            <text x={GRID.x + gridW / 2} y={GRID.y + gridH + 44} textAnchor="middle" fill={STRATS[liveColorK].color} fontSize={12.5}>
              {STRATS[liveColorK].key}: {STRATS[liveColorK].desc}
            </text>
          </g>

          {/* stats-file chip (frequency) */}
          <g opacity={statsU}>
            <rect x={GRID.x + gridW + 22} y={GRID.y + 6} width={214} height={52} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.3} />
            <text x={GRID.x + gridW + 129} y={GRID.y + 28} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily="ui-monospace, monospace">
              --init-expert-location
            </text>
            <text x={GRID.x + gridW + 129} y={GRID.y + 46} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
              activation_stats.pt
            </text>
          </g>

          {/* coverage meter */}
          <g opacity={scoreU}>
            <rect x={GRID.x + gridW + 22} y={GRID.y + 78} width={214} height={84} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={GRID.x + gridW + 129} y={GRID.y + 100} textAnchor="middle" fill={colors.TEXT} fontSize={11.5}>
              heat captured on the card
            </text>
            <rect x={GRID.x + gridW + 42} y={GRID.y + 114} width={174} height={14} rx={5} fill={colors.BG} stroke={colors.GRID} />
            <rect x={GRID.x + gridW + 42} y={GRID.y + 114} width={174 * liveCoverage} height={14} rx={5} fill={STRATS[liveColorK].color} opacity={0.9} />
            <text x={GRID.x + gridW + 129} y={GRID.y + 150} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily="ui-monospace, monospace">
              {(liveCoverage * 100).toFixed(0)}%
            </text>
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={330} y={238} width={620} height={196} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            four deals, one flag
          </text>
          <text x={640} y={324} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            uniform when you know nothing · frequency when you have receipts
          </text>
          <text x={640} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            all of them decided at boot — next: a schedule that moves at runtime
          </text>
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            uniform · frequency · front-loading · random (seed 42)
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
