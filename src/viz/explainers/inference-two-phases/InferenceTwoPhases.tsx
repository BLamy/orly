// Explained: Inference — chapter 1: what serving actually costs. Honest
// arithmetic for a 7B-parameter model at fp16 (14 GB of weights) on an
// accelerator with 2 TB/s of memory bandwidth and 312 TFLOP/s of compute:
// decode must stream all 14 GB per token → 7 ms/token → 143 tokens/s per
// stream, while the compute roof would allow 14 GFLOPs/token → 22,286
// tokens/s. Single-stream decode uses ~0.6% of the compute — the memory
// wall. Prefill of a 2048-token prompt is one parallel pass ≈ 0.09 s;
// decoding 2048 tokens ≈ 14.3 s. All numbers computed below.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
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
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The arithmetic, module scope.
// ---------------------------------------------------------------------------

const PARAMS = 7e9;
const BYTES_FP16 = 2;
const WEIGHT_BYTES = PARAMS * BYTES_FP16; // 14 GB
const BW = 2e12; // 2 TB/s
const COMPUTE = 312e12; // 312 TFLOP/s fp16
const FLOPS_PER_TOK = 2 * PARAMS; // 14 GFLOPs

const DECODE_MS = (WEIGHT_BYTES / BW) * 1000; // 7 ms
const DECODE_TPS = 1000 / DECODE_MS; // ≈ 143
const COMPUTE_TPS = COMPUTE / FLOPS_PER_TOK; // ≈ 22286
const UTIL = DECODE_TPS / COMPUTE_TPS; // ≈ 0.0064

const PROMPT = 2048;
const PREFILL_S = (PROMPT * FLOPS_PER_TOK) / COMPUTE; // ≈ 0.092 s
const DECODE_2048_S = (PROMPT * DECODE_MS) / 1000; // ≈ 14.3 s

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const WEIGHTS_X = 180;
const WEIGHTS_Y = 180;
const WEIGHTS_W = 240;
const WEIGHTS_H = 300;

const BAR_X = scaleLinear().domain([0, 15]).range([180, 1120]);
const BAR_Y = 560;

const ROOF_X = scaleLinear().domain([0, 24000]).range([700, 1180]);

const CAM_WEIGHTS: CameraState = { x: 420, y: 330, k: 1.3 };
const CAM_BARS: CameraState = { x: 640, y: 500, k: 1.2 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  weightsU: ChannelRef<number>;
  streamU: ChannelRef<number>; // repeated weight-streaming sweeps
  costU: ChannelRef<number>;
  roofU: ChannelRef<number>;
  utilU: ChannelRef<number>;
  phaseU: ChannelRef<number>;
  barU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const weightsU = tl.channel('weightsU', 0);
  const streamU = tl.channel('streamU', 0);
  const costU = tl.channel('costU', 0);
  const roofU = tl.channel('roofU', 0);
  const utilU = tl.channel('utilU', 0);
  const phaseU = tl.channel('phaseU', 0);
  const barU = tl.channel('barU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the naive picture
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'A new book, about an unglamorous question: once a model is trained, what does it actually cost to answer you? Start with the object doing the answering.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_WEIGHTS, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(weightsU, 1, { at: 1.2, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 6.7,
    dur: 5.6,
    text: 'Seven billion parameters at sixteen bits is fourteen gigabytes of weights. To produce one token, the chip must touch essentially all of them, once.',
  });
  tl.tween(streamU, 1, { at: 7.4, dur: 4.5, ease: ease.linear });
  tl.hold(12.5, 0.6);

  // Beat 2 — the memory wall
  tl.caption({
    at: 13.1,
    dur: 6.2,
    text: 'Here is the number that shapes everything downstream. Memory feeds the chip at two terabytes per second. Fourteen gigabytes per token means seven milliseconds per token — one hundred forty three tokens per second, and no more.',
  });
  tl.tween(costU, 1, { at: 14.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 19.7,
    dur: 6.2,
    text: 'Meanwhile the arithmetic units could process over twenty two thousand tokens per second. Generating one stream at a time uses less than one percent of the compute you paid for. That is the memory wall.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 19.9, dur: 1.5, ease: ease.move });
  tl.tween(roofU, 1, { at: 20.7, dur: 1.1, ease: ease.draw });
  tl.tween(utilU, 1, { at: 23.4, dur: 0.9, ease: ease.pop });
  tl.hold(26.1, 0.7);

  // Beat 3 — the two phases
  tl.caption({
    at: 26.8,
    dur: 6.0,
    text: 'Now the crucial split. Serving has two phases, and they live on opposite sides of that wall. Reading your prompt — prefill — processes every prompt token in parallel, in one pass.',
  });
  tl.tween(cam, CAM_BARS, { at: 27.0, dur: 1.5, ease: ease.move });
  tl.tween(phaseU, 1, { at: 27.8, dur: 1.0, ease: ease.enter });
  tl.tween(barU, 1, { at: 30.2, dur: 4.5, ease: ease.linear });
  tl.caption({
    at: 33.2,
    dur: 6.0,
    text: 'A two thousand token prompt costs about nine hundredths of a second — compute does the work, the weights stream once. Prefill is compute bound.',
  });
  tl.caption({
    at: 39.6,
    dur: 6.2,
    text: 'Generating is the opposite. Each output token needs the full fourteen gigabyte sweep, one token at a time. The same two thousand tokens out takes about fourteen seconds — one hundred fifty times longer than reading them in.',
  });
  tl.hold(46.0, 0.7);

  // Beat 4 — the thesis
  tl.caption({
    at: 46.7,
    dur: 6.0,
    text: 'So the bill for serving is really a bandwidth bill, and the whole discipline of inference is one project: get more useful tokens out of every pass over the weights.',
  });
  tl.tween(dimU, 1, { at: 47.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 53.1,
    dur: 4.8,
    text: 'Caching, batching, speculation, compression — every chapter ahead is an attack on those seven milliseconds.',
  });
  tl.hold(58.1, 1.2);

  return { tl, cam, titleU, weightsU, streamU, costU, roofU, utilU, phaseU, barU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/inference-two-phases/overrides.json',
  slug: 'inference-two-phases',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const weightsU = s.get(scene.weightsU);
  const streamU = s.get(scene.streamU);
  const costU = s.get(scene.costU);
  const roofU = s.get(scene.roofU);
  const utilU = s.get(scene.utilU);
  const phaseU = s.get(scene.phaseU);
  const barU = s.get(scene.barU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // streaming sweep: 3 passes of a read head over the weight block
  const sweep = (streamU * 3) % 1;
  const tokDone = Math.floor(streamU * 3);

  // phase bars: prefill tiny, decode long (log-ish visual truth: linear at scale 15s)
  const prefillW = BAR_X(PREFILL_S) - BAR_X(0);
  const decodeW = (BAR_X(DECODE_2048_S) - BAR_X(0)) * barU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the weight block */}
          <g opacity={weightsU}>
            <text x={WEIGHTS_X} y={WEIGHTS_Y - 30} fill={colors.TEXT} fontSize={18}>
              the weights
            </text>
            <text x={WEIGHTS_X} y={WEIGHTS_Y - 8} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
              7B params · fp16 · 14 GB
            </text>
            <rect x={WEIGHTS_X} y={WEIGHTS_Y} width={WEIGHTS_W} height={WEIGHTS_H} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
            {Array.from({ length: 12 }, (_, i) => (
              <rect
                key={i}
                x={WEIGHTS_X + 14}
                y={WEIGHTS_Y + 14 + i * 23}
                width={WEIGHTS_W - 28}
                height={16}
                rx={3}
                fill={colors.SECONDARY}
                opacity={0.18 + 0.03 * (i % 3)}
              />
            ))}
            {/* the read head sweeping all weights per token */}
            {streamU > 0 && streamU < 1 && (
              <rect
                x={WEIGHTS_X + 6}
                y={WEIGHTS_Y + 6 + sweep * (WEIGHTS_H - 30)}
                width={WEIGHTS_W - 12}
                height={18}
                rx={4}
                fill={colors.ACCENT}
                opacity={0.75}
              />
            )}
            <text x={WEIGHTS_X + WEIGHTS_W / 2} y={WEIGHTS_Y + WEIGHTS_H + 28} textAnchor="middle" fill={colors.ACCENT} fontSize={14} opacity={streamU > 0 ? 1 : 0}>
              one full sweep = one token{tokDone > 0 ? ` · tokens out: ${Math.min(3, tokDone)}` : ''}
            </text>
          </g>

          {/* the per-token cost */}
          {costU > 0 && (
            <g opacity={costU}>
              <text x={520} y={210} fill={colors.TEXT} fontSize={16}>
                the decode budget
              </text>
              <text x={520} y={244} fill={colors.WARM} fontSize={22} fontFamily="monospace" fontWeight={700}>
                14 GB ÷ 2 TB/s = {DECODE_MS.toFixed(0)} ms
              </text>
              <text x={520} y={276} fill={colors.MUTED} fontSize={14}>
                → {DECODE_TPS.toFixed(0)} tokens per second, per stream
              </text>
            </g>
          )}

          {/* the compute roof comparison */}
          {roofU > 0 && (
            <g opacity={roofU}>
              <text x={700} y={330} fill={colors.TEXT} fontSize={15}>
                what the silicon could do vs what one stream gets
              </text>
              <Axes x={ROOF_X} y={scaleLinear().domain([0, 1]).range([420, 420])} reveal={0} xTicks={0} yTicks={0} fontSize={10} />
              <rect x={ROOF_X(0)} y={352} width={(ROOF_X(COMPUTE_TPS) - ROOF_X(0)) * roofU} height={22} rx={4} fill={colors.POSITIVE} opacity={0.5} />
              <text x={ROOF_X(COMPUTE_TPS)} y={347} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                compute roof ≈ {Math.round(COMPUTE_TPS).toLocaleString()} tok/s
              </text>
              <rect x={ROOF_X(0)} y={392} width={Math.max(2, ROOF_X(DECODE_TPS) - ROOF_X(0))} height={22} rx={4} fill={colors.NEGATIVE} />
              <text x={ROOF_X(DECODE_TPS) + 10} y={408} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                decode, one stream: {DECODE_TPS.toFixed(0)} tok/s
              </text>
              {utilU > 0 && (
                <text x={700} y={452} fill={colors.WARM} fontSize={16} fontWeight={600} opacity={utilU}>
                  utilization: {(UTIL * 100).toFixed(1)} percent — the memory wall
                </text>
              )}
            </g>
          )}

          {/* the two-phase bars */}
          {phaseU > 0 && (
            <g opacity={phaseU}>
              <text x={180} y={BAR_Y - 44} fill={colors.TEXT} fontSize={16}>
                the same 2048 tokens, in and out
              </text>
              <rect x={BAR_X(0)} y={BAR_Y - 20} width={Math.max(3, prefillW)} height={20} rx={3} fill={colors.POSITIVE} />
              <text x={BAR_X(0) + 12} y={BAR_Y - 5} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                prefill {PREFILL_S.toFixed(2)} s (parallel)
              </text>
              <rect x={BAR_X(0)} y={BAR_Y + 12} width={Math.max(3, decodeW)} height={20} rx={3} fill={colors.NEGATIVE} opacity={0.85} />
              <text x={BAR_X(0) + Math.max(3, decodeW) + 10} y={BAR_Y + 27} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                decode {(DECODE_2048_S * barU).toFixed(1)} s (one at a time)
              </text>
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          What serving actually costs
        </text>
      </g>
      <MathLabel
        tex="t_{\text{decode}} \approx \frac{\text{weight bytes}}{\text{bandwidth}}"
        x={880}
        y={54}
        fontSize={20}
        color={colors.SECONDARY}
        opacity={costU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Serving is a bandwidth bill.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            7 ms per token, 0.6% compute used, prefill 150× faster
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            than decode. Every trick ahead attacks those 7 ms.
          </text>
        </g>
      )}
    </>
  );
}

export function InferenceTwoPhases() {
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
