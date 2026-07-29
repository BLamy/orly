// Feeding the Tiles — layout, caches, fusion, and the dynamic switch.
//
// Backed by: doc/en/AMX.md ("AMX Tiling-aware Memory Layout": "expert weight
// matrices … pre-rearranged into Tile-friendly sub-matrices", "strictly align
// each sub-matrix's start address to 64 bytes"; "Cache-friendly AMX Kernel":
// column-wise tasks → row-wise L2 blocks → tile computation in registers;
// "MoE Operator Fusion and Dynamic Scheduling": Gate/Up fusion, work
// stealing; "KTransformers dynamically selects between AMX and AVX-512
// kernels … AMX during long prompt prefill (each expert handles more than 4
// tokens on average), decode dynamically switches to AVX-512") and
// kt-kernel/README.md (scripts/convert_cpu_weights.py --quant-method int8).
//
// ONE machine: the memory pyramid — DRAM at the bottom, L3, L2, L1 and tiles
// at the top. Weights get pre-arranged into tile-shaped bricks at load time,
// then a work window climbs the pyramid and computes in place; a scheduler
// strip shows fusion + work stealing; a mode needle flips AMX ↔ AVX-512.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — the pyramid and its tenants.
// ---------------------------------------------------------------------------

const TIERS = [
  { key: 'DRAM', sub: 'expert weights live here', y: 470, w: 900, color: colors.MUTED },
  { key: 'L3 (shared)', sub: 'input activations', y: 384, w: 700, color: colors.SECONDARY },
  { key: 'L2 (per core)', sub: 'one weight block + partials', y: 298, w: 500, color: colors.ACCENT },
  { key: 'L1 + tiles', sub: 'tmm registers', y: 212, w: 300, color: colors.POSITIVE },
] as const;
const TIER_H = 64;
const CX = 560;

// bricks: messy GGUF order → tile-aligned order
const BRICKS = 14;
const messyX = (k: number): number => CX - 420 + ((k * 137) % 840);
const neatX = (k: number): number => CX - 420 + k * 60;

const SCHED = { x: 1030, y: 180, w: 190 } as const;

const CAM_PYR: CameraState = { x: 560, y: 350, k: 1.22 };
const CAM_TOP: CameraState = { x: 560, y: 250, k: 1.55 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pyrU: ChannelRef<number>;
  brickU: ChannelRef<number>; // bricks appear (messy)
  sortU: ChannelRef<number>; // messy → tile-aligned
  climbU: ChannelRef<number>; // the work window climbs
  holdU: ChannelRef<number>; // "computes in place" pulse
  onceU: ChannelRef<number>; // "DRAM touched once" stamp
  fuseU: ChannelRef<number>; // gate/up fusion strip
  stealU: ChannelRef<number>; // work stealing hand-off
  modeU: ChannelRef<number>; // AMX ↔ AVX-512 needle (0 prefill, 1 decode)
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pyrU = tl.channel('pyrU', 0);
  const brickU = tl.channel('brickU', 0);
  const sortU = tl.channel('sortU', 0);
  const climbU = tl.channel('climbU', 0);
  const holdU = tl.channel('holdU', 0);
  const onceU = tl.channel('onceU', 0);
  const fuseU = tl.channel('fuseU', 0);
  const stealU = tl.channel('stealU', 0);
  const modeU = tl.channel('modeU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the pyramid —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Between main memory and those tile registers stands the cache pyramid — each floor smaller, closer, and roughly ten times faster than the one below.',
  });
  tl.tween(pyrU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_PYR, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the messy bricks —
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'Expert weights arrive from disk in file order — fine for storage, terrible for tiles. Feeding tiles from scattered memory means cache misses that erase the whole speedup.',
  });
  tl.tween(brickU, 1, { at: 7.4, dur: 1.8, ease: ease.enter });
  tl.hold(13.0, 0.5);

  // — Beat 3 · the rearrangement —
  tl.caption({
    at: 13.5,
    dur: 6.5,
    text: 'So at load time the kernel rearranges every expert into tile-shaped bricks, each aligned to a sixty four byte cache line, laid out in exactly the order the compute will read them.',
  });
  tl.tween(sortU, 1, { at: 13.9, dur: 2.4, ease: ease.move });
  tl.hold(20.0, 0.5);

  // — Beat 4 · the climb —
  tl.caption({
    at: 20.5,
    dur: 6.5,
    text: 'At inference time, work climbs the pyramid: a column of the expert becomes a task, a block of that column moves into the per core cache, and its tiles go up to the registers.',
  });
  tl.tween(climbU, 1, { at: 20.9, dur: 3.0, ease: ease.linear });
  tl.hold(27.0, 0.5);

  // — Beat 5 · compute in place —
  tl.caption({
    at: 27.5,
    dur: 6.5,
    text: 'And there it stays. The block is sized so inputs, weights, and partial results all fit one floor up from main memory — every weight visits slow memory exactly once.',
  });
  tl.tween(cam, CAM_TOP, { at: 27.7, dur: 1.4, ease: ease.move });
  tl.tween(holdU, 1, { at: 28.5, dur: 1.6, ease: ease.move });
  tl.tween(onceU, 1, { at: 31.4, dur: 0.6, ease: ease.pop });
  tl.hold(33.5, 0.5);

  // — Beat 6 · fusion and stealing —
  tl.caption({
    at: 34.0,
    dur: 7.0,
    text: 'Above the cores, the scheduler fuses the gate and up projections of every expert in a layer into two big tasks, splits them fine, and lets idle threads steal work from busy ones.',
  });
  tl.tween(cam, CAM_WIDE, { at: 34.2, dur: 1.4, ease: ease.move });
  tl.tween(fuseU, 1, { at: 35.2, dur: 1.2, ease: ease.enter });
  tl.tween(stealU, 1, { at: 37.2, dur: 1.6, ease: ease.linear });
  tl.hold(41.5, 0.5);

  // — Beat 7 · the switch —
  tl.caption({
    at: 42.0,
    dur: 7.0,
    text: 'One last trick: tiles hate small work. When decoding one token at a time, the kernel switches itself to the vector unit, and back to tiles when a long prompt gives each expert four or more tokens.',
  });
  tl.tween(modeU, 1, { at: 43.0, dur: 1.4, ease: ease.move });
  tl.hold(48.5, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 49.0,
    dur: 6.0,
    text: 'Layout, locality, fusion, theft, and a mode switch — none of it exotic, all of it compounding. The receipts for all this care come due in the next chapter.',
  });
  tl.tween(closeU, 1, { at: 49.8, dur: 1.3, ease: ease.move });
  tl.hold(55.0, 1.4);

  return { tl, cam, pyrU, brickU, sortU, climbU, holdU, onceU, fuseU, stealU, modeU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pyrU = s.get(scene.pyrU);
  const brickU = s.get(scene.brickU);
  const sortU = s.get(scene.sortU);
  const climbU = s.get(scene.climbU);
  const holdU = s.get(scene.holdU);
  const onceU = s.get(scene.onceU);
  const fuseU = s.get(scene.fuseU);
  const stealU = s.get(scene.stealU);
  const modeU = s.get(scene.modeU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  // the climbing work window: DRAM → L3 → L2 → tiles
  const climbTier = climbU * 3; // 0..3

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* pyramid */}
          {TIERS.map((t, i) => {
            const u = clamp01(pyrU * TIERS.length - (TIERS.length - 1 - i));
            return (
              <g key={t.key} opacity={u}>
                <rect x={CX - t.w / 2} y={t.y} width={t.w} height={TIER_H} rx={11} fill={colors.PANEL} stroke={t.color} strokeWidth={1.3} opacity={0.9} />
                <text x={CX - t.w / 2 + 16} y={t.y + 26} fill={t.color} fontSize={12.5} fontFamily="ui-monospace, monospace">
                  {t.key}
                </text>
                <text x={CX - t.w / 2 + 16} y={t.y + 46} fill={colors.MUTED} fontSize={10.5}>
                  {t.sub}
                </text>
              </g>
            );
          })}

          {/* bricks in DRAM: messy → tile-aligned */}
          {Array.from({ length: BRICKS }, (_, k) => {
            const u = clamp01(brickU * BRICKS * 1.3 - k);
            const x = messyX(k) + (neatX(k) - messyX(k)) * sortU;
            return (
              <g key={k} opacity={u}>
                <rect x={x} y={TIERS[0].y + 40} width={sortU > 0.5 ? 48 : 34 + ((k * 29) % 26)} height={16} rx={4} fill={colors.WARM} opacity={0.35 + 0.5 * sortU} stroke={sortU > 0.7 ? colors.WARM : 'none'} strokeWidth={0.8} />
              </g>
            );
          })}
          <g opacity={sortU}>
            <text x={CX + 452} y={TIERS[0].y + 30} textAnchor="end" fill={colors.WARM} fontSize={10.5} fontFamily="ui-monospace, monospace">
              tile-aligned · 64-byte starts
            </text>
          </g>
          <g opacity={brickU * (1 - sortU)}>
            <text x={CX + 452} y={TIERS[0].y + 30} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
              file order (as loaded)
            </text>
          </g>

          {/* the climbing work window */}
          {climbU > 0.01 && (
            <g>
              {(() => {
                const ti = Math.min(3, climbTier);
                const lo = Math.floor(ti);
                const hi = Math.min(3, lo + 1);
                const f = ti - lo;
                const y = TIERS[lo].y * (1 - f) + TIERS[hi].y * f;
                return (
                  <rect x={CX - 70} y={y + 8} width={140} height={TIER_H - 16} rx={9} fill="none" stroke={colors.TEXT} strokeWidth={2} strokeDasharray="7 5" opacity={0.9} />
                );
              })()}
            </g>
          )}
          <g opacity={holdU}>
            <text x={CX} y={TIERS[3].y - 14} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5}>
              computes in place — partials never leave L2
            </text>
          </g>
          <g opacity={onceU}>
            <rect x={CX - 130} y={548} width={260} height={30} rx={8} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.3} />
            <text x={CX} y={568} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5}>
              DRAM touched once per weight
            </text>
          </g>

          {/* scheduler strip */}
          <g opacity={fuseU}>
            <rect x={SCHED.x} y={SCHED.y} width={SCHED.w} height={230} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.2} />
            <text x={SCHED.x + SCHED.w / 2} y={SCHED.y + 24} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5}>
              dynamic scheduler
            </text>
            <text x={SCHED.x + SCHED.w / 2} y={SCHED.y + 48} textAnchor="middle" fill={colors.TEXT} fontSize={10.5}>
              Gate + Up fused
            </text>
            <text x={SCHED.x + SCHED.w / 2} y={SCHED.y + 64} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
              all experts → 2 tasks / layer
            </text>
            {/* two thread bars: one finishes, steals from the other */}
            {[0, 1].map((th) => {
              const full = th === 0 ? 0.55 : 1;
              const done = th === 0 ? clamp01(stealU * 1.6) : clamp01(stealU * 1.1);
              return (
                <g key={th}>
                  <rect x={SCHED.x + 20} y={SCHED.y + 90 + th * 44} width={SCHED.w - 40} height={14} rx={5} fill={colors.BG} stroke={colors.GRID} />
                  <rect x={SCHED.x + 20} y={SCHED.y + 90 + th * 44} width={(SCHED.w - 40) * full * done} height={14} rx={5} fill={colors.SECONDARY} opacity={0.85} />
                  <text x={SCHED.x + 20} y={SCHED.y + 84 + th * 44} fill={colors.MUTED} fontSize={9}>
                    thread {th + 1}
                  </text>
                </g>
              );
            })}
            <g opacity={clamp01(stealU * 2 - 1)}>
              <text x={SCHED.x + SCHED.w / 2} y={SCHED.y + 196} textAnchor="middle" fill={colors.WARM} fontSize={10}>
                idle thread steals sub-tasks
              </text>
            </g>
          </g>

          {/* mode needle */}
          <g opacity={modeU > 0 ? 1 : 0}>
            <rect x={120} y={124} width={330} height={54} rx={11} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} opacity={Math.min(1, modeU * 4)} />
            <text x={150} y={146} fill={colors.POSITIVE} fontSize={11.5} opacity={1 - modeU * 0.6}>
              AMX · prefill (≥ 4 tokens/expert)
            </text>
            <text x={150} y={166} fill={colors.ACCENT} fontSize={11.5} opacity={0.4 + modeU * 0.6}>
              AVX-512 · decode (1 token)
            </text>
            <circle cx={134} cy={142 + modeU * 20} r={4.5} fill={colors.WARM} opacity={Math.min(1, modeU * 4)} />
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={340} y={238} width={600} height={182} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            the tiles get fed, not just built
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            tile-aligned bricks · in-cache blocks · fused tasks · work stealing
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            and the honest switch: tiles for prefill, vectors for decode
          </text>
          <text x={640} y={394} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            scripts/convert_cpu_weights.py --quant-method int8
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
