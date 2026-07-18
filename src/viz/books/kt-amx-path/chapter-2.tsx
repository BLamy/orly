// Tiles That Multiply — what Intel AMX actually computes.
//
// Backed by: doc/en/AMX.md ("Each CPU core contains 8 dedicated registers
// (tmm0–tmm7), with each register capable of holding up to 16 rows × 64
// bytes", the instruction table LDTILECFG / TILELOADD / TDPBSSD / TDPBF16PS,
// "AMX can perform the multiplication of two 16×64 sub-matrices (32,768
// multiply/add operations) with a single instruction in 16 CPU cycles,
// enabling each core to complete 2048 multiply/add operations per cycle — 8
// times the performance of AVX-512. On an Intel Xeon 4 CPU, a single core can
// theoretically provide 4 TOPS").
//
// ONE machine: a single CPU core in cross-section. Two tiles load as small
// matrices, one instruction fires, and a shower of multiply-accumulates
// condenses into the result tile — then the counter compares one instruction
// against the vector-unit grind.
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
import { MatrixGrid } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Data — small stand-in matrices (the labels carry the real 16×64 shape).
// ---------------------------------------------------------------------------

const N = 6; // rendered tile is 6×6 (legible); real tiles are 16 rows × 64 B
const seedA = (i: number, j: number): number => 0.25 + 0.7 * Math.abs(Math.sin(i * 2.7 + j * 1.3));
const seedB = (i: number, j: number): number => 0.25 + 0.7 * Math.abs(Math.sin(i * 1.9 + j * 2.1 + 4));
const A: number[][] = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => seedA(i, j)));
const B: number[][] = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => seedB(i, j)));
// C = A·B normalized 0..1
const Craw = A.map((row, i) => row.map((_, j) => A[i].reduce((acc, _, k) => acc + A[i][k] * B[k][j], 0)));
const cMax = Math.max(...Craw.flat());
const C: number[][] = Craw.map((r) => r.map((v) => v / cMax));

const TILE_A = { x: 250, y: 180 } as const;
const TILE_B = { x: 250, y: 400 } as const;
const TILE_C = { x: 760, y: 290 } as const;
const CELL = 26;
const GAP = 3;
const tileW = N * (CELL + GAP);

const REGS = ['tmm0', 'tmm1', 'tmm2', 'tmm3', 'tmm4', 'tmm5', 'tmm6', 'tmm7'];

const CAM_TILES: CameraState = { x: 560, y: 330, k: 1.3 };
const CAM_C: CameraState = { x: 800, y: 350, k: 1.5 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  coreU: ChannelRef<number>;
  regsU: ChannelRef<number>;
  loadA: ChannelRef<number>;
  loadB: ChannelRef<number>;
  fireU: ChannelRef<number>; // the TDPBSSD spark sweep
  accU: ChannelRef<number>; // C fills in
  countU: ChannelRef<number>; // the 32,768-ops counter
  cmpU: ChannelRef<number>; // vs AVX-512 bar duel
  topsU: ChannelRef<number>; // 4 TOPS chip
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const coreU = tl.channel('coreU', 0);
  const regsU = tl.channel('regsU', 0);
  const loadA = tl.channel('loadA', 0);
  const loadB = tl.channel('loadB', 0);
  const fireU = tl.channel('fireU', 0);
  const accU = tl.channel('accU', 0);
  const countU = tl.channel('countU', 0);
  const cmpU = tl.channel('cmpU', 0);
  const topsU = tl.channel('topsU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · inside one core —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Zoom into a single core of a recent server processor and you find something unusual: eight private registers, each big enough to hold a small two dimensional matrix.',
  });
  tl.tween(coreU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_TILES, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(regsU, 1, { at: 2.4, dur: 1.6, ease: ease.enter });
  tl.hold(6.5, 0.5);

  // — Beat 2 · these are the tiles —
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'These are the tiles of the Advanced Matrix Extensions. Each one holds up to sixteen rows of sixty four bytes — a sub-matrix, parked inside the register file.',
  });
  tl.hold(13.0, 0.5);

  // — Beat 3 · load —
  tl.caption({
    at: 13.5,
    dur: 6.0,
    text: 'A load instruction pulls one sub-matrix of activations into tile zero, and one sub-matrix of expert weights into tile one. Two loads, two little grids of numbers.',
  });
  tl.tween(loadA, 1, { at: 13.9, dur: 1.6, ease: ease.linear });
  tl.tween(loadB, 1, { at: 15.7, dur: 1.6, ease: ease.linear });
  tl.hold(19.5, 0.5);

  // — Beat 4 · one instruction —
  tl.caption({
    at: 20.0,
    dur: 6.5,
    text: 'Then one instruction fires — a tile dot product — and the hardware multiplies the two grids against each other, accumulating straight into a third tile.',
  });
  tl.tween(fireU, 1, { at: 20.6, dur: 2.2, ease: ease.linear });
  tl.tween(accU, 1, { at: 21.4, dur: 2.6, ease: ease.linear });
  tl.tween(cam, CAM_C, { at: 22.2, dur: 1.4, ease: ease.move });
  tl.hold(26.5, 0.5);

  // — Beat 5 · the count —
  tl.caption({
    at: 27.0,
    dur: 6.5,
    text: 'Count what just happened: thirty two thousand seven hundred sixty eight multiply and add operations, in sixteen processor cycles, from a single instruction.',
  });
  tl.tween(countU, 1, { at: 27.6, dur: 1.8, ease: ease.move });
  tl.hold(33.5, 0.5);

  // — Beat 6 · versus the vector unit —
  tl.caption({
    at: 34.0,
    dur: 6.5,
    text: 'That is two thousand forty eight operations per cycle — eight times what the wide vector unit on the same core can manage. Same silicon, different shape of work.',
  });
  tl.tween(cam, CAM_WIDE, { at: 34.2, dur: 1.4, ease: ease.move });
  tl.tween(cmpU, 1, { at: 35.0, dur: 1.6, ease: ease.move });
  tl.hold(40.5, 0.5);

  // — Beat 7 · per-core budget —
  tl.caption({
    at: 41.0,
    dur: 5.5,
    text: 'Add it up and one core theoretically offers four trillion integer operations per second. Multiply by sixty four cores and the processor stops looking like the slow half.',
  });
  tl.tween(topsU, 1, { at: 41.8, dur: 0.7, ease: ease.pop });
  tl.hold(46.5, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 47.0,
    dur: 6.5,
    text: 'But raw tiles only pay off if data arrives exactly when and where they want it. Feeding them — that is the real engineering, and the next chapter.',
  });
  tl.tween(closeU, 1, { at: 47.8, dur: 1.3, ease: ease.move });
  tl.hold(53.5, 1.4);

  return { tl, cam, coreU, regsU, loadA, loadB, fireU, accU, countU, cmpU, topsU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const coreU = s.get(scene.coreU);
  const regsU = s.get(scene.regsU);
  const loadA = s.get(scene.loadA);
  const loadB = s.get(scene.loadB);
  const fireU = s.get(scene.fireU);
  const accU = s.get(scene.accU);
  const countU = s.get(scene.countU);
  const cmpU = s.get(scene.cmpU);
  const topsU = s.get(scene.topsU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  const ops = Math.round(countU * 32768);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* core boundary */}
          <g opacity={coreU}>
            <rect x={120} y={90} width={1040} height={470} rx={18} fill="none" stroke={colors.GRID} strokeWidth={1.4} />
            <text x={148} y={120} fill={colors.MUTED} fontSize={12.5}>
              one CPU core · Sapphire Rapids (Xeon 4th gen)
            </text>
          </g>

          {/* register rail */}
          <g opacity={regsU}>
            {REGS.map((r, i) => {
              const u = clamp01(regsU * REGS.length - i);
              const used = i <= 2;
              return (
                <g key={r} opacity={u}>
                  <rect x={148 + i * 62} y={140} width={54} height={26} rx={6} fill={used ? colors.PANEL : colors.BG} stroke={used ? colors.ACCENT : colors.GRID} strokeWidth={used ? 1.4 : 0.9} />
                  <text x={175 + i * 62} y={158} textAnchor="middle" fill={used ? colors.ACCENT : colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
                    {r}
                  </text>
                </g>
              );
            })}
            <text x={660} y={158} fill={colors.MUTED} fontSize={10.5}>
              8 tile registers · 16 rows × 64 bytes each · TILECFG
            </text>
          </g>

          {/* tile A (activations) */}
          <g opacity={loadA}>
            <MatrixGrid x={TILE_A.x} y={TILE_A.y} values={A} cell={CELL} gap={GAP} cellU={(i, j) => clamp01(loadA * N * N * 1.3 - (i * N + j))} />
            <text x={TILE_A.x} y={TILE_A.y - 12} fill={colors.ACCENT} fontSize={11.5} fontFamily="ui-monospace, monospace">
              tmm0 ← TILELOADD activations
            </text>
          </g>
          {/* tile B (weights) */}
          <g opacity={loadB}>
            <MatrixGrid x={TILE_B.x} y={TILE_B.y} values={B} cell={CELL} gap={GAP} cellU={(i, j) => clamp01(loadB * N * N * 1.3 - (i * N + j))} />
            <text x={TILE_B.x} y={TILE_B.y - 12} fill={colors.SECONDARY} fontSize={11.5} fontFamily="ui-monospace, monospace">
              tmm1 ← TILELOADD expert weights
            </text>
          </g>

          {/* the instruction spark */}
          {fireU > 0 && fireU < 1 && (
            <g>
              {[TILE_A, TILE_B].map((t, k) => (
                <line
                  key={k}
                  x1={t.x + tileW}
                  y1={t.y + tileW / 2}
                  x2={t.x + tileW + (TILE_C.x - t.x - tileW) * fireU}
                  y2={t.y + tileW / 2 + (TILE_C.y + tileW / 2 - t.y - tileW / 2) * fireU}
                  stroke={colors.WARM}
                  strokeWidth={2.5}
                  opacity={0.9}
                  strokeLinecap="round"
                />
              ))}
            </g>
          )}
          <g opacity={fireU}>
            <rect x={520} y={272} width={170} height={34} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={605} y={294} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily="ui-monospace, monospace">
              TDPBSSD tmm2
            </text>
          </g>

          {/* tile C (accumulator) */}
          <g opacity={accU > 0 ? 1 : 0}>
            <MatrixGrid x={TILE_C.x} y={TILE_C.y} values={C} cell={CELL} gap={GAP} cellU={(i, j) => clamp01(accU * N * N * 1.3 - (i * N + j))} emphasize={0.75} />
            <text x={TILE_C.x} y={TILE_C.y - 12} fill={colors.POSITIVE} fontSize={11.5} fontFamily="ui-monospace, monospace" opacity={Math.min(1, accU * 3)}>
              tmm2 += tmm0 × tmm1
            </text>
          </g>

          {/* ops counter */}
          <g opacity={countU > 0 ? 1 : 0}>
            <rect x={TILE_C.x - 10} y={TILE_C.y + tileW + 22} width={230} height={54} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.3} opacity={Math.min(1, countU * 3)} />
            <text x={TILE_C.x + 105} y={TILE_C.y + tileW + 46} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily="ui-monospace, monospace" opacity={Math.min(1, countU * 3)}>
              {ops.toLocaleString('en-US')} mul-adds
            </text>
            <text x={TILE_C.x + 105} y={TILE_C.y + tileW + 66} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} opacity={Math.min(1, countU * 3)}>
              1 instruction · 16 cycles
            </text>
          </g>

          {/* AVX-512 duel */}
          <g opacity={cmpU}>
            <text x={200} y={506} fill={colors.TEXT} fontSize={12}>
              ops per cycle, one core:
            </text>
            <rect x={400} y={490} width={cmpU * 512 * 0.9} height={16} rx={5} fill={colors.POSITIVE} opacity={0.9} />
            <text x={400 + cmpU * 512 * 0.9 + 8} y={503} fill={colors.POSITIVE} fontSize={11.5} fontFamily="ui-monospace, monospace">
              AMX · 2048
            </text>
            <rect x={400} y={516} width={cmpU * 64 * 0.9} height={16} rx={5} fill={colors.MUTED} opacity={0.8} />
            <text x={400 + cmpU * 64 * 0.9 + 8} y={529} fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
              AVX-512 · 256 (int8)
            </text>
          </g>
          <g opacity={topsU}>
            <rect x={920} y={492} width={220} height={44} rx={10} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
            <text x={1030} y={512} textAnchor="middle" fill={colors.WARM} fontSize={13}>
              ≈ 4 TOPS per core
            </text>
            <text x={1030} y={528} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
              theoretical · Xeon 4 · int8
            </text>
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={340} y={238} width={600} height={182} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            matrices in the register file
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            8 tiles · 32,768 mul-adds per instruction · 8× the vector unit
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            next: feeding the tiles without touching main memory
          </text>
          <text x={640} y={394} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            LDTILECFG · TILELOADD · TDPBSSD · TDPBF16PS · TILESTORED
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
