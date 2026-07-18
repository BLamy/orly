// Explained: Hybrid Attention — chapter 3: the ratio question. Real
// arithmetic at module scope for a 48-layer, 8-KV-head, 128-head-dim model in
// half precision at 128k context: KV cache is 192 KiB per token per full
// stack, so memory at context length T scales linearly with the attention
// fraction f — 24 GiB at f = 1, 12 GiB at one half, 3 GiB at one eighth,
// with a fixed ~42 MiB of recurrent state underneath. Published hybrid
// ratios (Nemotron-H ~8%, Granite 4.0-H ~10%, Jamba 1 of 8, MiniMax-Text-01
// 1 of 8, Zamba2 ~1 of 6, Kimi Linear 1 of 4) are replotted and honestly
// labeled "as reported" — the cluster sits at small f.
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
// Real arithmetic, module scope.
// ---------------------------------------------------------------------------

const LAYERS = 48;
const KV_HEADS = 8;
const HEAD_DIM = 128;
const BYTES = 2; // fp16
const T_CTX = 131072; // 128k

/** KV bytes per token if every layer were full attention. */
const KV_PER_TOK = 2 * KV_HEADS * HEAD_DIM * BYTES * LAYERS; // 196608 B = 192 KiB
/** Fixed recurrent state for the non-attention layers (d_state 128 × d_model 4096, fp16). */
const SSM_STATE_GIB = (128 * 4096 * 2 * LAYERS) / 2 ** 30; // ≈ 0.047 GiB — constant in T

/** Cache memory in GiB at 128k context, as a function of the attention fraction f. */
const memGiB = (f: number): number => (KV_PER_TOK * f * T_CTX) / 2 ** 30 + SSM_STATE_GIB * (1 - f);
// memGiB(1) ≈ 24.0, memGiB(0.5) ≈ 12.0, memGiB(1/8) ≈ 3.04, memGiB(0) ≈ 0.047

/** Attention FLOPs per generated token scale the same way: f · L · T reads. */
const readsPerTok = (f: number): number => f * LAYERS * T_CTX; // key-value reads

/** Published hybrid ratios — replotted from model cards and papers, 2024–26. */
const REPORTED: { name: string; f: number }[] = [
  { name: 'Nemotron-H', f: 0.08 },
  { name: 'Granite 4.0-H', f: 0.1 },
  { name: 'Jamba', f: 1 / 8 },
  { name: 'MiniMax-Text-01', f: 1 / 8 },
  { name: 'Zamba2', f: 1 / 6 },
  { name: 'Kimi Linear', f: 1 / 4 },
];

// ---------------------------------------------------------------------------
// Layout. Left: the 48-layer stack strip that re-tiles as f changes.
// Right: memory vs f line + the reported-ratio dots on the same axis.
// ---------------------------------------------------------------------------

const STACK_X0 = 130;
const STACK_Y0 = 130;
const STACK_COLS = 8;
const CELL_W = 46;
const CELL_H = 40;

const MEM_X = scaleLinear().domain([0, 1]).range([620, 1150]);
const MEM_Y = scaleLinear().domain([0, 26]).range([420, 130]);

const DOT_Y = 520; // reported-ratio axis band

const CAM_STACK: CameraState = { x: 340, y: 300, k: 1.3 };
const CAM_MEM: CameraState = { x: 880, y: 300, k: 1.3 };
const CAM_DOTS: CameraState = { x: 880, y: 460, k: 1.35 };

/** Which layers are attention at fraction f: spread evenly through the stack. */
const isAttn = (layer: number, f: number): boolean => {
  if (f >= 0.999) return true;
  if (f <= 0.001) return false;
  const period = 1 / f;
  return Math.floor((layer + 0.5) / period) !== Math.floor((layer - 0.5) / period);
};

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  stackU: ChannelRef<number>;
  frac: ChannelRef<number>;
  memU: ChannelRef<number>;
  memSweep: ChannelRef<number>;
  dotsU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const stackU = tl.channel('stackU', 0);
  const frac = tl.channel('frac', 1);
  const memU = tl.channel('memU', 0);
  const memSweep = tl.channel('memSweep', 0);
  const dotsU = tl.channel('dotsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the dial
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Here is a forty eight layer model, every layer full attention. A hybrid designer holds one dial: what fraction of these layers keeps the exact, growing cache?',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_STACK, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(stackU, 1, { at: 1.2, dur: 1.6, ease: ease.enter });
  tl.hold(6.3, 0.5);

  // Beat 2 — turn the dial
  tl.caption({
    at: 6.8,
    dur: 6.0,
    text: 'Turn it down. Half the layers. A quarter. One in eight. The blue attention layers thin out, spread evenly through the stack, and everything else becomes fixed-state recurrence.',
  });
  tl.tween(frac, 0.5, { at: 7.2, dur: 1.2, ease: ease.move });
  tl.tween(frac, 0.25, { at: 8.9, dur: 1.2, ease: ease.move });
  tl.tween(frac, 1 / 8, { at: 10.6, dur: 1.2, ease: ease.move });
  tl.hold(12.8, 0.6);

  // Beat 3 — the memory line
  tl.caption({
    at: 13.4,
    dur: 6.0,
    text: 'The bill tracks the dial exactly. At one hundred twenty eight thousand tokens of context, this stack pays four kilobytes of cache per token, per attention layer.',
  });
  tl.tween(cam, CAM_MEM, { at: 13.6, dur: 1.5, ease: ease.move });
  tl.tween(memU, 1, { at: 14.6, dur: 1.3, ease: ease.draw });
  tl.caption({
    at: 19.8,
    dur: 6.2,
    text: 'All attention: twenty four gigabytes of cache for one sequence. Half: twelve. One layer in eight: three gigabytes — plus a recurrent state that costs about forty megabytes no matter how long the context grows.',
  });
  tl.tween(memSweep, 1, { at: 20.2, dur: 5.0, ease: ease.move });
  tl.hold(26.4, 0.7);

  // Beat 4 — compute scales the same way
  tl.caption({
    at: 27.1,
    dur: 5.6,
    text: 'Compute follows the same line: every attention layer re-reads the whole cache for every new token, so cutting the fraction cuts the context bill by the same factor.',
  });
  tl.hold(33.1, 0.6);

  // Beat 5 — what did the field actually pick?
  tl.caption({
    at: 33.7,
    dur: 6.0,
    text: 'So where did production hybrids actually set the dial? Here are six published ratios, plotted as reported in their papers and model cards.',
  });
  tl.tween(cam, CAM_DOTS, { at: 33.9, dur: 1.5, ease: ease.move });
  tl.tween(dotsU, 1, { at: 34.9, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 40.1,
    dur: 6.2,
    text: 'They cluster hard at the low end: roughly one attention layer in every four to twelve. Nobody ships half and half — the quality you need from exact recall apparently arrives with the first few spotlight layers.',
  });
  tl.hold(46.5, 0.7);

  // Beat 6 — close
  tl.caption({
    at: 47.2,
    dur: 5.6,
    text: 'That is the shape of the deal: memory and compute fall in a straight line as you remove attention, while the needle-finding ability falls off a cliff only near zero.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 47.4, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 48.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 49.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 53.4,
    dur: 5.0,
    text: 'But a ratio is not the whole design. The same one-in-eight budget can be spent early in the stack or late — and that placement turns out to matter.',
  });
  tl.hold(58.6, 1.2);

  return { tl, cam, titleU, stackU, frac, memU, memSweep, dotsU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/hybrid-ratio/overrides.json',
  slug: 'hybrid-ratio',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const stackU = s.get(scene.stackU);
  const frac = s.get(scene.frac);
  const memU = s.get(scene.memU);
  const memSweep = s.get(scene.memSweep);
  const dotsU = s.get(scene.dotsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const nAttn = Math.max(0, Math.round(frac * LAYERS));
  // sweep runs f from 1 down to 0 along the drawn line
  const sweepF = 1 - memSweep * (1 - 1 / 8);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the layer stack — a whisper once the camera moves to the charts */}
          <g opacity={stackU * (1 - 0.75 * memU)}>
            <text x={STACK_X0} y={STACK_Y0 - 28} fill={colors.TEXT} fontSize={18}>
              48 layers — blue keeps a cache
            </text>
            {Array.from({ length: LAYERS }, (_, i) => {
              const attn = isAttn(i, frac);
              const row = Math.floor(i / STACK_COLS);
              const col = i % STACK_COLS;
              return (
                <g key={i}>
                  <rect
                    x={STACK_X0 + col * (CELL_W + 6)}
                    y={STACK_Y0 + row * (CELL_H + 7)}
                    width={CELL_W}
                    height={CELL_H}
                    rx={5}
                    fill={attn ? colors.ACCENT : colors.PANEL}
                    opacity={attn ? 0.9 : 0.75}
                    stroke={attn ? colors.ACCENT : colors.GRID}
                    strokeWidth={attn ? 1.4 : 0.8}
                  />
                  <text
                    x={STACK_X0 + col * (CELL_W + 6) + CELL_W / 2}
                    y={STACK_Y0 + row * (CELL_H + 7) + CELL_H / 2 + 4}
                    textAnchor="middle"
                    fill={attn ? colors.BG : colors.MUTED}
                    fontSize={10}
                    fontFamily="monospace"
                  >
                    {attn ? 'attn' : 'ssm'}
                  </text>
                </g>
              );
            })}
            <text x={STACK_X0} y={STACK_Y0 + 6 * (CELL_H + 7) + 24} fill={colors.SECONDARY} fontSize={15}>
              {nAttn} of {LAYERS} layers are full attention — f = {frac.toFixed(2)}
            </text>
          </g>

          {/* memory vs fraction */}
          {memU > 0 && (
            <g opacity={memU}>
              <text x={620} y={100} fill={colors.TEXT} fontSize={17}>
                cache memory at 128k context
              </text>
              <text x={620} y={122} fill={colors.MUTED} fontSize={12}>
                48 layers · 8 KV heads · head dim 128 · fp16
              </text>
              <Axes x={MEM_X} y={MEM_Y} reveal={memU} xTicks={4} yTicks={4} xLabel="attention fraction f" yLabel="GiB" fontSize={11} />
              <FunctionPlot
                x={MEM_X}
                y={MEM_Y}
                f={memGiB}
                domain={[0, 1]}
                samples={100}
                reveal={memU}
                color={colors.ACCENT}
                width={2.6}
              />
              {memSweep > 0.02 && (
                <>
                  <circle cx={MEM_X(sweepF)} cy={MEM_Y(memGiB(sweepF))} r={6} fill={colors.WARM} />
                  <text
                    x={MEM_X(sweepF) + 12}
                    y={MEM_Y(memGiB(sweepF)) - 10}
                    fill={colors.WARM}
                    fontSize={14}
                    fontWeight={600}
                  >
                    {memGiB(sweepF).toFixed(1)} GiB
                  </text>
                </>
              )}
              <MathLabel
                tex="\text{mem}(f) \approx f \cdot L \cdot T \cdot 4\,\text{KiB}/\!\text{layer-token}"
                x={790}
                y={168}
                fontSize={14}
                color={colors.MUTED}
                opacity={memU}
              />
            </g>
          )}

          {/* reported ratios */}
          {dotsU > 0 && (
            <g opacity={dotsU}>
              <text x={620} y={DOT_Y - 46} fill={colors.TEXT} fontSize={16}>
                published hybrids, as reported
              </text>
              <line x1={MEM_X(0)} y1={DOT_Y} x2={MEM_X(1)} y2={DOT_Y} stroke={colors.GRID} strokeWidth={1.2} />
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <g key={v}>
                  <line x1={MEM_X(v)} y1={DOT_Y - 4} x2={MEM_X(v)} y2={DOT_Y + 4} stroke={colors.GRID} />
                  <text x={MEM_X(v)} y={DOT_Y + 22} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                    {v}
                  </text>
                </g>
              ))}
              {REPORTED.map((m, i) => (
                <g key={m.name}>
                  <circle cx={MEM_X(m.f)} cy={DOT_Y} r={6} fill={colors.WARM} opacity={0.9} />
                  <text
                    x={MEM_X(m.f) + (i % 2 === 0 ? 0 : 0)}
                    y={DOT_Y - 14 - (i % 3) * 16}
                    textAnchor="middle"
                    fill={colors.MUTED}
                    fontSize={11}
                  >
                    {m.name}
                  </text>
                  <line
                    x1={MEM_X(m.f)}
                    y1={DOT_Y - 8}
                    x2={MEM_X(m.f)}
                    y2={DOT_Y - 10 - (i % 3) * 16}
                    stroke={colors.GRID}
                    strokeWidth={0.8}
                  />
                </g>
              ))}
              <text x={MEM_X(0.62)} y={DOT_Y + 44} fill={colors.SECONDARY} fontSize={13}>
                the whole cluster lives below one quarter
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The ratio question
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={220} width={840} height={200} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Cost falls in a line; recall falls off a cliff.
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Production hybrids report one attention layer per four to twelve —
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            three gigabytes of cache where a pure transformer pays twenty four.
          </text>
        </g>
      )}
    </>
  );
}

export function HybridRatio() {
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
