// The Model That Doesn't Fit — the heterogeneous bet.
//
// Backed by: README.md ("efficient inference and fine-tuning of large language
// models through CPU-GPU heterogeneous computing"), kt-kernel/README.md /
// doc/en/kt-kernel/kt-kernel_intro.md ("'hot' experts run on GPU and 'cold'
// experts run on CPU"), doc/en/AMX.md (DeepSeek-V3 418 tokens/s on Xeon 4 +
// RTX 4090, reported), doc/en/SFT/KTransformers-Fine-Tuning_User-Guide.md
// (671B FP16 ≈ 1400 GB theoretical footprint).
//
// ONE machine: the model as a wall of weight blocks (attention rows + expert
// rows), a 24 GB graphics-card vault on the left, a big system-RAM shelf on
// the right. We try to pour the whole wall into the vault, watch it overflow,
// notice how few experts light per token, then split the wall across the two
// memories — the picture the whole series lives in.
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
import { Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — the weight wall (center), GPU vault (left), RAM shelf (right).
// ---------------------------------------------------------------------------

// The wall: 6 visible "layers", each = 1 attention block + 8 expert blocks.
// (DeepSeek-V3 has 61 layers, 58 of them MoE with 256 routed experts — the
// wall is a legible stand-in; real counts go on the label chips.)
const LAYERS = 6;
const EXPERTS = 8;
const WALL = { x: 447, y: 128, cw: 44, ch: 34, gx: 6, gy: 10 } as const;
const wallX = (j: number): number => WALL.x + j * (WALL.cw + WALL.gx);
const wallY = (i: number): number => WALL.y + i * (WALL.ch + WALL.gy);

const GPU = { x: 60, y: 128, w: 230, h: 340 } as const;
const RAM = { x: 1000, y: 128, w: 230, h: 340 } as const;

// Where blocks land after the split (slot grids inside each zone).
const gpuSlot = (k: number): { x: number; y: number } => ({
  x: GPU.x + 36 + (k % 4) * 42,
  y: GPU.y + 66 + Math.floor(k / 4) * 40,
});
const ramSlot = (k: number): { x: number; y: number } => ({
  x: RAM.x + 30 + (k % 5) * 36,
  y: RAM.y + 66 + Math.floor(k / 5) * 34,
});

// Which experts fire for the demo token (2 of 8 per layer, deterministic).
const FIRED: ReadonlyArray<readonly [number, number]> = [
  [0, 2], [0, 6], [1, 1], [1, 4], [2, 0], [2, 7], [3, 3], [3, 5], [4, 2], [4, 4], [5, 1], [5, 6],
];
const isFired = (i: number, j: number): boolean => FIRED.some(([a, b]) => a === i && b === j);

// "Hot" experts (kept on GPU after the split): first 2 columns of each layer.
const HOT_COLS = 2;

const CAM_GPU: CameraState = { x: 240, y: 300, k: 1.5 };
const CAM_WALL: CameraState = { x: 640, y: 300, k: 1.3 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  wallU: ChannelRef<number>;
  sizeU: ChannelRef<number>;
  gpuU: ChannelRef<number>;
  pourU: ChannelRef<number>;
  spillU: ChannelRef<number>;
  tokenU: ChannelRef<number>;
  fireU: ChannelRef<number>;
  ramU: ChannelRef<number>;
  splitU: ChannelRef<number>;
  kernelU: ChannelRef<number>;
  perfU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const wallU = tl.channel('wallU', 0); // the weight wall fills in
  const sizeU = tl.channel('sizeU', 0); // the "~671 GB" size chip
  const gpuU = tl.channel('gpuU', 0); // the graphics-card vault
  const pourU = tl.channel('pourU', 0); // the doomed pour into the vault
  const spillU = tl.channel('spillU', 0); // overflow flash
  const tokenU = tl.channel('tokenU', 0); // one token sweeps down the wall
  const fireU = tl.channel('fireU', 0); // fired experts stay lit, rest dim
  const ramU = tl.channel('ramU', 0); // the system-RAM shelf
  const splitU = tl.channel('splitU', 0); // the heterogeneous split
  const kernelU = tl.channel('kernelU', 0); // kt-kernel chip on the CPU side
  const perfU = tl.channel('perfU', 0); // reported-throughput chip
  const closeU = tl.channel('closeU', 0); // closing panel

  // — Beat 1 · the wall —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'This is what an open frontier model looks like as memory: a wall of weights. Deepseek V three is six hundred seventy one billion parameters of it.',
  });
  tl.tween(wallU, 1, { at: 0.7, dur: 2.2, ease: ease.draw });
  tl.tween(sizeU, 1, { at: 4.2, dur: 0.5, ease: ease.pop });
  tl.hold(7.0, 0.6);

  // — Beat 2 · the vault —
  tl.caption({
    at: 7.6,
    dur: 6.0,
    text: 'And this is the machine you actually own: one consumer graphics card with twenty four gigabytes of memory on it.',
  });
  tl.tween(gpuU, 1, { at: 8.0, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_GPU, { at: 8.4, dur: 1.3, ease: ease.move });
  tl.hold(13.6, 0.5);

  // — Beat 3 · the pour fails —
  tl.caption({
    at: 14.1,
    dur: 7.0,
    text: 'Try to load the model and the arithmetic ends the conversation. The weights need hundreds of gigabytes; the card holds twenty four. It does not fit. It is not close.',
  });
  tl.tween(pourU, 1, { at: 14.5, dur: 2.6, ease: ease.linear });
  tl.tween(spillU, 1, { at: 17.4, dur: 0.6, ease: ease.pop });
  tl.hold(21.1, 0.6);

  // — Beat 4 · the sparsity observation —
  tl.caption({
    at: 21.7,
    dur: 7.0,
    text: 'But watch what the model does with all that memory. It is a mixture of experts: for any one token, the router wakes only a handful of experts per layer.',
  });
  tl.tween(cam, CAM_WALL, { at: 21.9, dur: 1.4, ease: ease.move });
  tl.tween(spillU, 0, { at: 21.9, dur: 0.8, ease: ease.move });
  tl.tween(pourU, 0, { at: 21.9, dur: 0.8, ease: ease.move });
  tl.tween(tokenU, 1, { at: 23.4, dur: 3.2, ease: ease.linear });
  tl.hold(28.7, 0.5);

  // — Beat 5 · most of the wall is asleep —
  tl.caption({
    at: 29.2,
    dur: 6.0,
    text: 'Everything else just sits there. Most of the wall is cold storage that happens to be priced like compute.',
  });
  tl.tween(fireU, 1, { at: 29.6, dur: 1.2, ease: ease.move });
  tl.hold(35.2, 0.5);

  // — Beat 6 · the bet —
  tl.caption({
    at: 35.7,
    dur: 7.0,
    text: 'K Transformers makes the heterogeneous bet: keep the always-hot path on the graphics card, and let the cold experts live where memory is cheap — beside the processor.',
  });
  tl.tween(cam, CAM_WIDE, { at: 35.9, dur: 1.4, ease: ease.move });
  tl.tween(ramU, 1, { at: 37.2, dur: 1.0, ease: ease.enter });
  tl.hold(42.7, 0.5);

  // — Beat 7 · the split —
  tl.caption({
    at: 43.2,
    dur: 7.5,
    text: 'So the wall splits. Attention, routers, and a few busy experts move onto the card. The long tail of experts — most of the model — settles into system memory.',
  });
  tl.tween(splitU, 1, { at: 43.6, dur: 3.0, ease: ease.move });
  tl.hold(50.7, 0.5);

  // — Beat 8 · kt-kernel —
  tl.caption({
    at: 51.2,
    dur: 7.0,
    text: 'The processor side is not an afterthought. A dedicated kernel library runs those experts with vector and matrix instructions, aware of every memory channel the box has.',
  });
  tl.tween(kernelU, 1, { at: 51.8, dur: 0.9, ease: ease.enter });
  tl.hold(58.2, 0.5);

  // — Beat 9 · the reported payoff —
  tl.caption({
    at: 58.7,
    dur: 6.5,
    text: 'The project reports Deepseek V three running at four hundred eighteen tokens per second end to end on one server processor and one consumer card.',
  });
  tl.tween(perfU, 1, { at: 59.5, dur: 0.5, ease: ease.pop });
  tl.hold(65.2, 0.5);

  // — Beat 10 · close —
  tl.caption({
    at: 65.7,
    dur: 7.5,
    text: 'Two memories, one model, a kernel that makes the cheap half fast. This book boots that server and sends it a first request; the rest of the series opens the machinery.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 65.9, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 66.9, dur: 1.3, ease: ease.move });
  tl.hold(73.2, 1.4);

  return { tl, cam, wallU, sizeU, gpuU, pourU, spillU, tokenU, fireU, ramU, splitU, kernelU, perfU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Block({ x, y, w, h, color, u, dim, lit }: { x: number; y: number; w: number; h: number; color: string; u: number; dim: number; lit: number }) {
  if (u <= 0.01) return null;
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={5}
      fill={color}
      opacity={u * (0.28 + 0.62 * lit) * (1 - dim * 0.82)}
      stroke={lit > 0.5 ? colors.WARM : 'none'}
      strokeWidth={lit > 0.5 ? 1.4 : 0}
    />
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const wallU = s.get(scene.wallU);
  const sizeU = s.get(scene.sizeU);
  const gpuU = s.get(scene.gpuU);
  const pourU = s.get(scene.pourU);
  const spillU = s.get(scene.spillU);
  const tokenU = s.get(scene.tokenU);
  const fireU = s.get(scene.fireU);
  const ramU = s.get(scene.ramU);
  const splitU = s.get(scene.splitU);
  const kernelU = s.get(scene.kernelU);
  const perfU = s.get(scene.perfU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  // token sweep: which layer row the token is currently crossing
  const sweepRow = tokenU * LAYERS;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- GPU vault ---- */}
          <Zone x={GPU.x} y={GPU.y} w={GPU.w} h={GPU.h} label="graphics card · 24 GB" kind="group" u={gpuU} color={colors.ACCENT} />
          <g opacity={gpuU}>
            {/* VRAM gauge */}
            <rect x={GPU.x + 22} y={GPU.y + GPU.h - 46} width={GPU.w - 44} height={14} rx={5} fill={colors.BG} stroke={colors.GRID} />
            <rect
              x={GPU.x + 22}
              y={GPU.y + GPU.h - 46}
              width={(GPU.w - 44) * clamp01(pourU * 3 + splitU * 0.72)}
              height={14}
              rx={5}
              fill={spillU > 0.3 ? colors.NEGATIVE : colors.ACCENT}
              opacity={0.85}
            />
            <text x={GPU.x + GPU.w / 2} y={GPU.y + GPU.h - 56} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              VRAM
            </text>
          </g>
          {/* overflow flash */}
          <g opacity={spillU}>
            <text x={GPU.x + GPU.w / 2} y={GPU.y + 40} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={600}>
              out of memory
            </text>
            <text x={GPU.x + GPU.w / 2} y={GPU.y + 60} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11}>
              ~671 GB into 24 GB
            </text>
          </g>

          {/* ---- RAM shelf ---- */}
          <Zone x={RAM.x} y={RAM.y} w={RAM.w} h={RAM.h} label="system RAM · 512 GB+" kind="group" u={ramU} color={colors.POSITIVE} />
          <g opacity={ramU * kernelU}>
            <rect x={RAM.x + 34} y={RAM.y + RAM.h - 52} width={RAM.w - 68} height={26} rx={7} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.3} />
            <text x={RAM.x + RAM.w / 2} y={RAM.y + RAM.h - 35} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily="ui-monospace, monospace">
              kt-kernel · KTMoEWrapper
            </text>
          </g>

          {/* ---- the weight wall ---- */}
          {Array.from({ length: LAYERS }, (_, i) => {
            const rowU = clamp01(wallU * LAYERS * 1.2 - i);
            // token sweep glow for this row
            const rowGlow = tokenU > 0 ? clamp01(1.6 - Math.abs(sweepRow - (i + 0.5)) * 1.6) : 0;
            return (
              <g key={i}>
                {/* attention block (col -1) */}
                {(() => {
                  const home = { x: wallX(0) - 62, y: wallY(i) };
                  const dest = gpuSlot(i);
                  const x = home.x + (dest.x - home.x) * splitU;
                  const y = home.y + (dest.y - home.y) * splitU;
                  return (
                    <Block
                      x={x}
                      y={y}
                      w={WALL.cw}
                      h={WALL.ch}
                      color={colors.ACCENT}
                      u={rowU}
                      dim={0}
                      lit={rowGlow}
                    />
                  );
                })()}
                {/* expert blocks */}
                {Array.from({ length: EXPERTS }, (_, j) => {
                  const fired = isFired(i, j);
                  const hot = j < HOT_COLS;
                  const home = { x: wallX(j), y: wallY(i) };
                  const dest = hot ? gpuSlot(LAYERS + i * HOT_COLS + j) : ramSlot(i * (EXPERTS - HOT_COLS) + (j - HOT_COLS));
                  const x = home.x + (dest.x - home.x) * splitU;
                  const y = home.y + (dest.y - home.y) * splitU;
                  // pour phase: pre-split, blocks lean toward the vault and bounce
                  const pour = splitU < 0.02 ? clamp01(pourU * 2 - (i * EXPERTS + j) / (LAYERS * EXPERTS)) : 0;
                  const px = x - pour * 40 * (1 - spillU);
                  const lit = fired ? Math.max(rowGlow, fireU) : 0;
                  const dim = fireU * (fired ? 0 : 0.75) * (1 - splitU * 0.6);
                  return (
                    <Block
                      key={j}
                      x={px}
                      y={y}
                      w={WALL.cw}
                      h={WALL.ch}
                      color={hot ? colors.WARM : colors.SECONDARY}
                      u={rowU}
                      dim={dim}
                      lit={lit}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* wall caption chips */}
          <g opacity={wallU * (1 - splitU)}>
            <text x={wallX(0) - 62} y={WALL.y - 18} fill={colors.ACCENT} fontSize={11.5}>
              attention
            </text>
            <text x={wallX(3)} y={WALL.y - 18} fill={colors.SECONDARY} fontSize={11.5}>
              routed experts · 256 per layer
            </text>
          </g>
          <g opacity={sizeU * (1 - splitU)}>
            <rect x={520} y={418} width={244} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.3} />
            <text x={642} y={438} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily="ui-monospace, monospace">
              DeepSeek-V3 · 671B params
            </text>
          </g>

          {/* the demo token */}
          {tokenU > 0.01 && tokenU < 1 && (
            <g>
              <circle cx={wallX(EXPERTS - 1) + 96} cy={wallY(0) + sweepRow * (WALL.ch + WALL.gy)} r={9} fill={colors.WARM} />
              <text x={wallX(EXPERTS - 1) + 96} y={wallY(0) + sweepRow * (WALL.ch + WALL.gy) - 16} textAnchor="middle" fill={colors.WARM} fontSize={11}>
                one token
              </text>
            </g>
          )}

          {/* split-era labels */}
          <g opacity={splitU}>
            <text x={GPU.x + GPU.w / 2} y={GPU.y + 40} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} opacity={1 - spillU}>
              attention · routers · hot experts
            </text>
            <text x={RAM.x + RAM.w / 2} y={RAM.y + 40} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5}>
              cold experts
            </text>
          </g>

          {/* reported perf chip */}
          <g opacity={perfU}>
            <rect x={472} y={498} width={336} height={54} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
            <text x={640} y={520} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
              418 tokens/s end-to-end · reported
            </text>
            <text x={640} y={540} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              DeepSeek-V3 · Xeon 4 CPU + RTX 4090 (doc/en/AMX.md)
            </text>
          </g>
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={310} y={210} width={660} height={240} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={256} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the heterogeneous bet
          </text>
          {[
            ['on the card', 'attention, routers,\nhot experts', colors.ACCENT],
            ['in system RAM', 'the long tail\nof cold experts', colors.POSITIVE],
            ['in between', 'kt-kernel makes\nthe cheap half fast', colors.WARM],
          ].map(([head, sub, c], i) => (
            <g key={head}>
              <rect x={348 + i * 200} y={288} width={184} height={98} rx={10} fill={colors.BG} stroke={c} strokeWidth={1.4} />
              <text x={440 + i * 200} y={320} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
                {head}
              </text>
              {String(sub).split('\n').map((line, k) => (
                <text key={k} x={440 + i * 200} y={344 + k * 15} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                  {line}
                </text>
              ))}
            </g>
          ))}
          <text x={640} y={428} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            kvcache-ai/ktransformers · kt-kernel
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
