// Explained: Inference — chapter 5: shrinking the weights themselves —
// serve-time quantization and distillation (the serve-side view; the
// training-side story is the fine-tuning book). Real math at module scope:
// a genuine block-wise int4 quantizer (block 64, absmax scale) run over 4096
// seeded gaussian weights measures 10.8% relative RMS error per weight; the
// same quantizer applied to a smooth weight slice draws the staircase on
// screen. Bandwidth arithmetic from chapter 1: 14 GB fp16 → 143 tok/s,
// int8 7 GB → 286, int4 3.5 GB → 571; a distilled 1.5B student at fp16 is
// 3 GB → 667. All computed below.
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
  gaussian,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import { FunctionPlot } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The quantizer, module scope — the SAME function measures error and draws.
// ---------------------------------------------------------------------------

const BLOCK = 64;
const quantizeInt4 = (w: number[]): number[] => {
  const out: number[] = [];
  for (let b = 0; b < w.length; b += BLOCK) {
    const blk = w.slice(b, b + BLOCK);
    const amax = Math.max(...blk.map(Math.abs));
    const scale = amax / 7 || 1;
    for (const v of blk) {
      const q = Math.max(-8, Math.min(7, Math.round(v / scale)));
      out.push(q * scale);
    }
  }
  return out;
};

// measured error on 4096 gaussian weights (seed 3)
const rand = mulberry32(3);
const g = gaussian(rand);
const W = Array.from({ length: 4096 }, () => g() * 0.02);
const WQ = quantizeInt4(W);
let err2 = 0;
let w2 = 0;
for (let i = 0; i < W.length; i++) {
  err2 += (W[i] - WQ[i]) ** 2;
  w2 += W[i] * W[i];
}
const REL_RMS = Math.sqrt(err2 / w2); // 0.108

// the on-screen slice: a smooth weight profile, quantized by the same code
const SLICE_N = 256;
const sliceF = (x: number) =>
  0.6 * Math.sin(x * 2.1) + 0.3 * Math.sin(x * 5.7 + 1.2) + 0.15 * Math.sin(x * 11.3 + 0.4);
const SLICE = Array.from({ length: SLICE_N }, (_, i) => sliceF((i / (SLICE_N - 1)) * 6 - 3));
const SLICE_Q = quantizeInt4(SLICE);
const sliceQF = (x: number) => {
  const i = Math.max(0, Math.min(SLICE_N - 1, Math.round(((x + 3) / 6) * (SLICE_N - 1))));
  return SLICE_Q[i];
};

// ---------------------------------------------------------------------------
// The bandwidth ladder (chapter 1's arithmetic, re-applied).
// ---------------------------------------------------------------------------

const BW = 2000; // GB/s
const LADDER = [
  { label: 'fp16 · 7B', gb: 14, color: colors.SECONDARY },
  { label: 'int8 · 7B', gb: 7, color: colors.ACCENT },
  { label: 'int4 · 7B', gb: 3.5, color: colors.POSITIVE },
  { label: 'fp16 · 1.5B student', gb: 3, color: colors.WARM },
].map((r) => ({ ...r, tps: BW / r.gb })); // 143 / 286 / 571 / 667

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const PLOT_X = scaleLinear().domain([-3, 3]).range([180, 700]);
const PLOT_Y = scaleLinear().domain([-1.2, 1.2]).range([440, 160]);

const BAR_X = scaleLinear().domain([0, 700]).range([180, 1120]);
const BAR_Y0 = 500;
const BAR_H = 24;

const CAM_PLOT: CameraState = { x: 440, y: 300, k: 1.25 };
const CAM_BARS: CameraState = { x: 640, y: 500, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  curveU: ChannelRef<number>; // fp16 curve draws
  quantU: ChannelRef<number>; // morph to the staircase
  errU: ChannelRef<number>; // measured error readout
  ladder: ChannelRef<number>; // 0..4 bars grow in sequence
  distillU: ChannelRef<number>; // student framing
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const curveU = tl.channel('curveU', 0);
  const quantU = tl.channel('quantU', 0);
  const errU = tl.channel('errU', 0);
  const ladder = tl.channel('ladder', 0);
  const distillU = tl.channel('distillU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the last lever
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Every trick so far accepted the fourteen gigabytes and worked around them. The last lever is blunter: make the weights smaller, and every single pass gets faster.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 5.4,
    text: 'Quantization stores each weight in fewer bits. Here is a real slice of a weight profile at sixteen bit precision — a smooth curve of small numbers.',
  });
  tl.tween(cam, CAM_PLOT, { at: 6.8, dur: 1.4, ease: ease.move });
  tl.tween(curveU, 1, { at: 7.6, dur: 1.5, ease: ease.draw });
  tl.hold(12.0, 0.5);

  // Beat 2 — the staircase, computed
  tl.caption({
    at: 12.5,
    dur: 6.0,
    text: 'Now squeeze it to four bits: sixteen levels per block of sixty four weights, each block scaled to its own largest value. The curve becomes a staircase — this staircase is the actual output of that quantizer.',
  });
  tl.tween(quantU, 1, { at: 13.8, dur: 1.8, ease: ease.move });
  tl.caption({
    at: 18.9,
    dur: 6.0,
    text: 'Run the same quantizer over four thousand real gaussian weights and measure the damage: about eleven percent relative error per weight. Networks are strangely forgiving of it — accuracy typically drops far less than the error suggests, but it is not free.',
  });
  tl.tween(errU, 1, { at: 20.2, dur: 0.9, ease: ease.enter });
  tl.hold(24.9, 0.6);

  // Beat 3 — the bandwidth ladder
  tl.caption({
    at: 25.5,
    dur: 5.8,
    text: 'Now cash it in against chapter one. Half the bytes is double the decode speed — this is the memory wall working for you. Sixteen bits: one hundred forty three tokens per second.',
  });
  tl.tween(cam, CAM_BARS, { at: 25.8, dur: 1.5, ease: ease.move });
  tl.tween(ladder, 1, { at: 27.3, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 31.5,
    dur: 5.2,
    text: 'Eight bits: seven gigabytes, two hundred eighty six tokens per second. Four bits: three and a half gigabytes, five hundred seventy one. Same model, same chip, four times the speed.',
  });
  tl.tween(ladder, 3, { at: 32.2, dur: 2.6, ease: ease.draw });
  tl.hold(36.7, 0.6);

  // Beat 4 — distillation
  tl.caption({
    at: 37.3,
    dur: 6.0,
    text: 'The other compression does not shrink the numbers — it shrinks the network. Distillation trains a small student to imitate the big model; the fine-tuning book covers the training side. At serve time, a student is just a smaller bill.',
  });
  tl.tween(ladder, 4, { at: 38.8, dur: 1.2, ease: ease.draw });
  tl.tween(distillU, 1, { at: 40.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 43.7,
    dur: 5.6,
    text: 'A one and a half billion parameter student at full precision is three gigabytes — six hundred sixty seven tokens per second. The catch moved: quantization risks precision, distillation risks capability. You choose which loss you can afford.',
  });
  tl.hold(49.3, 0.6);

  // Beat 5 — the book's recap
  tl.caption({
    at: 49.9,
    dur: 6.2,
    text: 'Step back across the book. Serving is a bandwidth bill: the cache stops you repaying the past, batching packs strangers into one sweep, speculation banks several tokens per pass, and compression shrinks the sweep itself.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.1, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 51.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 52.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 56.5,
    dur: 4.6,
    text: 'Four attacks on seven milliseconds — that is the whole discipline of inference, and you have now seen each one run.',
  });
  tl.hold(61.1, 1.2);

  return { tl, cam, titleU, curveU, quantU, errU, ladder, distillU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/inference-compression/overrides.json',
  slug: 'inference-compression',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const curveU = s.get(scene.curveU);
  const quantU = s.get(scene.quantU);
  const errU = s.get(scene.errU);
  const ladder = s.get(scene.ladder);
  const distillU = s.get(scene.distillU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the weight slice */}
          {curveU > 0 && (
            <g>
              <text x={PLOT_X(-3)} y={130} fill={colors.TEXT} fontSize={16}>
                one slice of the weights
              </text>
              <text x={PLOT_X(-3)} y={152} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                fp16 (smooth) → int4, block 64, absmax scale (staircase)
              </text>
              {/* fp16 ghost stays for comparison once quantized */}
              <FunctionPlot
                x={PLOT_X}
                y={PLOT_Y}
                f={sliceF}
                domain={[-3, 3]}
                samples={SLICE_N}
                reveal={curveU}
                color={colors.SECONDARY}
                width={2}
                opacity={quantU > 0 ? 0.35 : 1}
              />
              {quantU > 0 && (
                <FunctionPlot
                  x={PLOT_X}
                  y={PLOT_Y}
                  f={sliceQF}
                  domain={[-3, 3]}
                  samples={SLICE_N}
                  reveal={1}
                  morph={{ from: sliceF, u: quantU }}
                  color={colors.POSITIVE}
                  width={2.5}
                />
              )}
              {errU > 0 && (
                <g opacity={errU}>
                  <text x={PLOT_X(-3)} y={490} fill={colors.WARM} fontSize={15} fontFamily="monospace" fontWeight={700}>
                    measured on 4,096 weights: {(REL_RMS * 100).toFixed(1)}% relative error
                  </text>
                  <text x={PLOT_X(-3)} y={514} fill={colors.MUTED} fontSize={13}>
                    16 levels per block, each block scaled to its own max
                  </text>
                </g>
              )}
            </g>
          )}

          {/* the bandwidth ladder */}
          {ladder > 0 && (
            <g>
              <text x={BAR_X(0)} y={BAR_Y0 - 20} fill={colors.TEXT} fontSize={16}>
                decode speed at 2 terabytes per second
              </text>
              {LADDER.map((row, i) => {
                const u = clamp01(ladder - i);
                if (u <= 0) return null;
                const w = (BAR_X(row.tps) - BAR_X(0)) * u;
                const y = BAR_Y0 + i * (BAR_H + 10);
                return (
                  <g key={i} opacity={i === 3 ? Math.max(u, distillU) : u}>
                    <rect x={BAR_X(0)} y={y} width={Math.max(2, w)} height={BAR_H} rx={4} fill={row.color} opacity={0.8} />
                    <text x={BAR_X(0) + 8} y={y + 17} fill={colors.BG} fontSize={12} fontFamily="monospace" fontWeight={700}>
                      {row.label} · {row.gb} GB
                    </text>
                    <text x={BAR_X(0) + Math.max(2, w) + 10} y={y + 17} fill={row.color} fontSize={13} fontFamily="monospace">
                      {row.tps.toFixed(0)} tok/s
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Shrink the sweep itself
        </text>
      </g>
      <MathLabel
        tex="t_{\text{decode}} \propto \text{weight bytes}"
        x={960}
        y={54}
        fontSize={20}
        color={colors.SECONDARY}
        opacity={curveU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={220} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Four attacks on seven milliseconds.
          </text>
          <text x={640} y={316} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Cache the past · batch the strangers · speculate forward ·
          </text>
          <text x={640} y={342} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            compress the sweep — 143 to 667 tokens per second,
          </text>
          <text x={640} y={368} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            all from the same bandwidth arithmetic.
          </text>
        </g>
      )}
    </>
  );
}

export function InferenceCompression() {
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
