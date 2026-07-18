// Hot and Cold — activation skew, and the GPU expert budget.
//
// Backed by: doc/en/kt-kernel/experts-sched-Tutorial.md ("--kt-num-gpu-experts:
// Number of GPU experts per MoE layer", "--kt-gpu-experts-ratio: Ratio of
// total experts to place on GPU (0.0-1.0)"), kt-kernel/README.md ("More GPU
// experts = lower latency but higher GPU memory usage (May cause OOM)",
// "'hot' experts run on GPU and 'cold' experts run on CPU").
//
// ONE machine: a layers × experts heat grid. Tokens rain through the router
// and the grid warms unevenly — a few cells glow, most stay cold. Then a
// budget line slices the warm minority onto the card. The grid is the
// persistent object for the whole book.
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
import { MatrixGrid } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The heat data — precomputed, seeded, skewed like real routing statistics.
// ---------------------------------------------------------------------------

const ROWS = 8; // MoE layers (stand-in; labels carry the real counts)
const COLS = 16; // experts per layer
const rand = mulberry32(7);
// Zipf-ish popularity per (layer, expert): a few heavy hitters per layer.
export const HEAT: number[][] = Array.from({ length: ROWS }, () => {
  const row = Array.from({ length: COLS }, () => 0.04 + rand() * 0.16);
  // 3 hot experts per layer at random columns
  for (let h = 0; h < 3; h++) {
    const j = Math.floor(rand() * COLS);
    row[j] = Math.min(1, 0.55 + rand() * 0.45);
  }
  return row;
});
// Rank threshold: value of the 4th-hottest cell per row (budget = 4/16).
const BUDGET = 4;
const rowCut: number[] = HEAT.map((row) => [...row].sort((a, b) => b - a)[BUDGET - 1]);
const isHot = (i: number, j: number): boolean => HEAT[i][j] >= rowCut[i];

const GRID = { x: 320, y: 130, cell: 34, gap: 5 } as const;
const gridW = COLS * (GRID.cell + GRID.gap);
const gridH = ROWS * (GRID.cell + GRID.gap);

// token rain columns (which expert each falling token hits, per wave)
const RAIN_N = 26;
const rain2 = mulberry32(11);
const RAIN = Array.from({ length: RAIN_N }, () => {
  // biased toward the hot columns of a random row
  const i = Math.floor(rain2() * ROWS);
  const hotCols = HEAT[i].map((v, j) => ({ v, j })).sort((a, b) => b.v - a.v);
  const pick = rain2() < 0.7 ? hotCols[Math.floor(rain2() * 3)].j : Math.floor(rain2() * COLS);
  return { i, j: pick, t: rain2() };
});

const CAM_GRID: CameraState = { x: 640, y: 300, k: 1.25 };
const CAM_ROW: CameraState = { x: 640, y: 230, k: 1.7 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  rainU: ChannelRef<number>;
  heatU: ChannelRef<number>;
  skewU: ChannelRef<number>;
  budgetU: ChannelRef<number>;
  liftU: ChannelRef<number>;
  vramU: ChannelRef<number>;
  ratioU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0); // grid cells enter
  const rainU = tl.channel('rainU', 0); // token rain sweep
  const heatU = tl.channel('heatU', 0); // heat values fade in as rain lands
  const skewU = tl.channel('skewU', 0); // hot-cell emphasis / cold dimming
  const budgetU = tl.channel('budgetU', 0); // budget chip + per-row cut marks
  const liftU = tl.channel('liftU', 0); // hot cells lift into the GPU band
  const vramU = tl.channel('vramU', 0); // VRAM meter reacting to the budget
  const ratioU = tl.channel('ratioU', 0); // the ratio-flag alternative chip
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the grid —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Lay a mixture of experts model flat: one row per layer, one cell per expert. Two hundred fifty six columns in the big models — here, a legible sixteen.',
  });
  tl.tween(gridU, 1, { at: 0.7, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAM_GRID, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the rain —
  tl.caption({
    at: 7.0,
    dur: 6.5,
    text: 'Now serve real traffic and watch where the router actually sends tokens. Every request rains hits across the grid — and the rain is not even close to uniform.',
  });
  tl.tween(rainU, 1, { at: 7.4, dur: 3.6, ease: ease.linear });
  tl.tween(heatU, 1, { at: 8.0, dur: 3.4, ease: ease.linear });
  tl.hold(13.5, 0.5);

  // — Beat 3 · the skew —
  tl.caption({
    at: 14.0,
    dur: 6.5,
    text: 'A handful of experts in every layer soak up most of the traffic. The rest barely wake up all day. Routing statistics are skewed, and that skew is money.',
  });
  tl.tween(skewU, 1, { at: 14.5, dur: 1.4, ease: ease.move });
  tl.hold(20.5, 0.5);

  // — Beat 4 · the budget —
  tl.caption({
    at: 21.0,
    dur: 7.0,
    text: 'Because the card can hold a budget of experts per layer — a flag says how many. Everything above the line earns video memory; everything below stays in system memory.',
  });
  tl.tween(cam, CAM_ROW, { at: 21.2, dur: 1.4, ease: ease.move });
  tl.tween(budgetU, 1, { at: 22.2, dur: 1.0, ease: ease.enter });
  tl.hold(27.5, 0.5);

  // — Beat 5 · the lift —
  tl.caption({
    at: 28.0,
    dur: 6.5,
    text: 'Set the budget to four per layer and the four hottest cells of every row lift onto the card. The cold majority stays put — and stays cheap.',
  });
  tl.tween(cam, CAM_WIDE, { at: 28.2, dur: 1.4, ease: ease.move });
  tl.tween(liftU, 1, { at: 29.0, dur: 2.4, ease: ease.move });
  tl.hold(34.0, 0.5);

  // — Beat 6 · the meter —
  tl.caption({
    at: 34.5,
    dur: 7.0,
    text: 'The trade is written on the meter: more experts on the card means lower latency and more video memory burned — push too far and the server dies out of memory at boot.',
  });
  tl.tween(vramU, 1, { at: 35.1, dur: 1.6, ease: ease.move });
  tl.hold(41.0, 0.5);

  // — Beat 7 · the ratio flag —
  tl.caption({
    at: 41.5,
    dur: 6.0,
    text: 'You can also budget globally: a ratio flag takes a fraction — ten percent of all experts across all layers — and overrides the per-layer count.',
  });
  tl.tween(ratioU, 1, { at: 42.2, dur: 0.8, ease: ease.enter });
  tl.hold(47.0, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 47.5,
    dur: 7.0,
    text: 'So the budget decides how many seats the card offers. The harder question — which experts deserve them — is a strategy, and there are four. That is the next chapter.',
  });
  tl.tween(closeU, 1, { at: 48.3, dur: 1.3, ease: ease.move });
  tl.hold(54.0, 1.4);

  return { tl, cam, gridU, rainU, heatU, skewU, budgetU, liftU, vramU, ratioU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const rainU = s.get(scene.rainU);
  const heatU = s.get(scene.heatU);
  const skewU = s.get(scene.skewU);
  const budgetU = s.get(scene.budgetU);
  const liftU = s.get(scene.liftU);
  const vramU = s.get(scene.vramU);
  const ratioU = s.get(scene.ratioU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  const total = ROWS * COLS;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* GPU band above the grid, revealed with the lift */}
          <g opacity={liftU}>
            <rect x={GRID.x - 14} y={62} width={gridW + 22} height={44} rx={10} fill="none" stroke={colors.ACCENT} strokeWidth={1.4} strokeDasharray="6 4" />
            <text x={GRID.x - 2} y={54} fill={colors.ACCENT} fontSize={11.5}>
              on the card · 4 experts × every layer
            </text>
          </g>

          {/* the heat grid — hot cells slide up into the band as liftU grows */}
          {HEAT.map((row, i) =>
            row.map((v, j) => {
              const cellIn = clamp01(gridU * total * 1.15 - (i * COLS + j)) ;
              const hot = isHot(i, j);
              const heat = heatU * v;
              const x = GRID.x + j * (GRID.cell + GRID.gap);
              const homeY = GRID.y + i * (GRID.cell + GRID.gap);
              // hot cells lift toward the band, keeping column, compressing rows
              const liftY = hot ? homeY - (homeY - 70) * liftU : homeY;
              const dimCold = !hot ? skewU * 0.55 + liftU * 0.15 : 0;
              const c = heat > 0.5 ? colors.WARM : heat > 0.25 ? colors.SECONDARY : colors.MUTED;
              return (
                <rect
                  key={`${i}-${j}`}
                  x={x}
                  y={liftY}
                  width={GRID.cell}
                  height={GRID.cell * (hot ? 1 - liftU * 0.5 : 1)}
                  rx={5}
                  fill={c}
                  opacity={cellIn * (0.12 + 0.78 * heat) * (1 - dimCold)}
                  stroke={hot && (skewU > 0.3 || liftU > 0.1) ? colors.WARM : 'none'}
                  strokeWidth={1.2}
                />
              );
            }),
          )}

          {/* row/col labels */}
          <g opacity={gridU}>
            <text x={GRID.x - 20} y={GRID.y + 8} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
              layer 1
            </text>
            <text x={GRID.x - 20} y={GRID.y + gridH - 22} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
              layer 58
            </text>
            <text x={GRID.x + gridW / 2} y={GRID.y + gridH + 18} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} opacity={1 - liftU * 0.6}>
              experts → (256 per layer in DeepSeek-V3; 16 shown)
            </text>
          </g>

          {/* token rain */}
          {rainU > 0 && rainU < 1 &&
            RAIN.map((r, k) => {
              const u = clamp01(rainU * 1.3 - r.t * 0.3);
              if (u <= 0 || u >= 1) return null;
              const x = GRID.x + r.j * (GRID.cell + GRID.gap) + GRID.cell / 2;
              const yTop = 40;
              const yHit = GRID.y + r.i * (GRID.cell + GRID.gap) + GRID.cell / 2;
              return <circle key={k} cx={x} cy={yTop + (yHit - yTop) * u} r={4} fill={colors.WARM} opacity={0.8 * (1 - u * 0.5)} />;
            })}

          {/* budget chip + per-row cut ticks */}
          <g opacity={budgetU}>
            <rect x={GRID.x + gridW + 26} y={GRID.y + 10} width={200} height={58} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.3} />
            <text x={GRID.x + gridW + 126} y={GRID.y + 34} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="ui-monospace, monospace">
              --kt-num-gpu-experts 4
            </text>
            <text x={GRID.x + gridW + 126} y={GRID.y + 54} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
              per MoE layer
            </text>
          </g>

          {/* VRAM meter */}
          <g opacity={vramU}>
            <rect x={GRID.x + gridW + 26} y={GRID.y + 96} width={200} height={94} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={GRID.x + gridW + 126} y={GRID.y + 118} textAnchor="middle" fill={colors.TEXT} fontSize={11.5}>
              video memory
            </text>
            <rect x={GRID.x + gridW + 46} y={GRID.y + 132} width={160} height={13} rx={5} fill={colors.BG} stroke={colors.GRID} />
            <rect x={GRID.x + gridW + 46} y={GRID.y + 132} width={160 * (0.45 + 0.3 * liftU)} height={13} rx={5} fill={colors.ACCENT} opacity={0.85} />
            <text x={GRID.x + gridW + 126} y={GRID.y + 168} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
              more experts → lower latency,
            </text>
            <text x={GRID.x + gridW + 126} y={GRID.y + 181} textAnchor="middle" fill={colors.NEGATIVE} fontSize={9.5}>
              too many → OOM at boot
            </text>
          </g>

          {/* ratio flag chip */}
          <g opacity={ratioU}>
            <rect x={GRID.x - 14} y={GRID.y + gridH + 34} width={gridW + 22} height={32} rx={9} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.2} />
            <text x={GRID.x + gridW / 2} y={GRID.y + gridH + 55} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontFamily="ui-monospace, monospace">
              --kt-gpu-experts-ratio 0.1   (10% of all experts, overrides the per-layer count)
            </text>
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={340} y={238} width={600} height={190} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            the budget is set. who gets the seats?
          </text>
          <text x={640} y={324} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            routing is skewed — a few experts carry most tokens
          </text>
          <text x={640} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            the card seats a chosen few; four strategies pick them
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            --kt-num-gpu-experts · --kt-gpu-experts-ratio
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
