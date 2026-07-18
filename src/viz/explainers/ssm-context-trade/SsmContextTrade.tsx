// Explained: State-Space Models — chapter 4: the long-context trade.
// Honest memory arithmetic for a 32-layer, d_model = 4096 transformer at
// fp16: the KV cache stores 2 (K and V) x 32 x 4096 x 2 bytes = 512 KiB per
// token, so 2 GiB at 4k, 16 GiB at 32k, 64 GiB at 128k context. A Mamba-2
// style SSM state (32 layers x d_inner 8192 x N = 128 x 2 bytes) is 64 MiB
// regardless of context — 1024x smaller at 128k. All numbers computed below;
// the trade (exact recall vs lossy compression) is stated honestly.
import { scaleLinear, scaleLog } from 'd3';
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

const LAYERS = 32;
const D_MODEL = 4096;
const BYTES = 2; // fp16

/** KV-cache bytes at context length T: K and V, every layer, every token. */
const kvBytes = (T: number): number => 2 * LAYERS * D_MODEL * T * BYTES;
const KV_PER_TOKEN = kvBytes(1); // 524288 B = 512 KiB
const KV_4K = kvBytes(4096); // 2.0 GiB
const KV_32K = kvBytes(32768); // 16 GiB
const KV_128K = kvBytes(131072); // 64 GiB

/** Mamba-2-style state: d_inner = 2 * d_model, N = 128 state dims per channel. */
const D_INNER = 2 * D_MODEL;
const N_STATE = 128;
const SSM_BYTES = LAYERS * D_INNER * N_STATE * BYTES; // 67108864 B = 64 MiB

const GiB = 2 ** 30;
const MiB = 2 ** 20;
const RATIO_128K = KV_128K / SSM_BYTES; // 1024

// sanity: keep the spoken numbers honest
// KV_PER_TOKEN / 1024 === 512 KiB; KV_4K / GiB === 2; KV_32K / GiB === 16;
// KV_128K / GiB === 64; SSM_BYTES / MiB === 64; RATIO_128K === 1024.

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const PLOT_X = scaleLog().base(2).domain([1024, 131072]).range([170, 700]);
const PLOT_Y = scaleLog().base(2).domain([16 * MiB, 128 * GiB]).range([560, 150]);

const BAR_X0 = 830;
const BAR_W = 96;
const BAR_GAP = 128;
const BAR_BASE = 560;
const BAR_SCALE = scaleLinear().domain([0, 70]).range([0, 380]); // GiB → px

const CAM_PLOT: CameraState = { x: 430, y: 360, k: 1.25 };
const CAM_BARS: CameraState = { x: 990, y: 360, k: 1.2 };

const CONTEXTS = [4096, 32768, 131072];
const CTX_LABELS = ['4k', '32k', '128k'];

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  tokU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  kvLineU: ChannelRef<number>;
  ssmLineU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  ratioU: ChannelRef<number>;
  tradeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const tokU = tl.channel('tokU', 0);
  const plotU = tl.channel('plotU', 0);
  const kvLineU = tl.channel('kvLineU', 0);
  const ssmLineU = tl.channel('ssmLineU', 0);
  const barsU = tl.channel('barsU', 0);
  const ratioU = tl.channel('ratioU', 0);
  const tradeU = tl.channel('tradeU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the per-token bill
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Time to talk about the bill. Take a thirty two layer transformer with a model width of four thousand ninety six, running at sixteen bit precision.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(tokU, 1, { at: 1.2, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 7.1,
    dur: 6.0,
    text: 'Every token it reads leaves a key and a value in every layer. Multiply it out and each token costs half a megabyte of cache — permanently, for as long as the conversation lives.',
  });
  tl.hold(13.3, 0.6);

  // Beat 2 — the growth curve
  tl.caption({
    at: 13.9,
    dur: 5.6,
    text: 'Now stretch the context. At four thousand tokens the cache is two gigabytes. At thirty two thousand, sixteen gigabytes. At a hundred twenty eight thousand, sixty four.',
  });
  tl.tween(cam, CAM_PLOT, { at: 14.1, dur: 1.4, ease: ease.move });
  tl.tween(plotU, 1, { at: 14.5, dur: 1.2, ease: ease.draw });
  tl.tween(kvLineU, 1, { at: 15.7, dur: 3.6, ease: ease.linear });
  tl.caption({
    at: 20.1,
    dur: 5.4,
    text: 'That is for one user. A serving box has to hold one of these per conversation in the batch — the cache, not the weights, becomes what the machine is full of.',
  });
  tl.hold(25.7, 0.6);

  // Beat 3 — the flat line
  tl.caption({
    at: 26.3,
    dur: 6.0,
    text: 'Here is the same bill for a state-space model of the same scale. The state is thirty two layers of fixed matrices — sixty four megabytes. And that line does not move.',
  });
  tl.tween(ssmLineU, 1, { at: 26.9, dur: 2.6, ease: ease.draw });
  tl.caption({
    at: 32.7,
    dur: 5.2,
    text: 'Four thousand tokens of context: sixty four megabytes. A hundred twenty eight thousand: still sixty four. The memory is flat because the state never grows.',
  });
  tl.hold(38.1, 0.6);

  // Beat 4 — the bars and the ratio
  tl.caption({
    at: 38.7,
    dur: 5.4,
    text: 'Side by side at the longest context, the difference is a factor of one thousand twenty four. That entire gap is headroom: bigger batches, longer sessions, cheaper serving.',
  });
  tl.tween(cam, CAM_BARS, { at: 38.9, dur: 1.5, ease: ease.move });
  tl.tween(barsU, 1, { at: 39.7, dur: 1.4, ease: ease.draw });
  tl.tween(ratioU, 1, { at: 41.6, dur: 0.7, ease: ease.pop });
  tl.hold(44.3, 0.6);

  // Beat 5 — the honest trade
  tl.caption({
    at: 44.9,
    dur: 6.4,
    text: 'But say the trade out loud. The cache is expensive because it is exact — any token, however old, can be recalled perfectly. The state is cheap because it is lossy.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 45.1, dur: 1.5, ease: ease.move });
  tl.tween(tradeU, 1, { at: 46.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 51.5,
    dur: 5.8,
    text: 'You saw the loss measured in chapter one, and you saw gating fight it in chapter two. Sixty four gigabytes buys perfect recall; sixty four megabytes buys a good summary.',
  });
  tl.hold(57.5, 0.6);

  // Beat 6 — close
  tl.caption({
    at: 58.1,
    dur: 5.6,
    text: 'There is no free lunch here — only a price list. The interesting question is which conversations actually need the expensive kind of memory.',
  });
  tl.tween(dimU, 1, { at: 58.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 59.3, dur: 0.9, ease: ease.enter });
  tl.hold(63.9, 1.2);

  return { tl, cam, titleU, tokU, plotU, kvLineU, ssmLineU, barsU, ratioU, tradeU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/ssm-context-trade/overrides.json',
  slug: 'ssm-context-trade',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const fmtBytes = (b: number): string =>
  b >= GiB ? `${(b / GiB).toFixed(0)} GiB` : `${(b / MiB).toFixed(0)} MiB`;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const tokU = s.get(scene.tokU);
  const plotU = s.get(scene.plotU);
  const kvLineU = s.get(scene.kvLineU);
  const ssmLineU = s.get(scene.ssmLineU);
  const barsU = s.get(scene.barsU);
  const ratioU = s.get(scene.ratioU);
  const tradeU = s.get(scene.tradeU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const kvT = 1024 * Math.pow(131072 / 1024, Math.max(0.001, kvLineU));
  const ssmT = 1024 * Math.pow(131072 / 1024, Math.max(0.001, ssmLineU));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* model spec chip */}
          <g opacity={tokU}>
            <text x={170} y={92} fill={colors.TEXT} fontSize={17}>
              memory per conversation
            </text>
            <text x={170} y={114} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
              32 layers · d_model 4096 · fp16 · KV = 512 KiB / token
            </text>
          </g>

          {/* log-log plot */}
          <g opacity={plotU}>
            <Axes
              x={PLOT_X}
              y={PLOT_Y}
              reveal={plotU}
              xTicks={3}
              yTicks={3}
              xLabel="context length (tokens)"
              fontSize={10}
            />
            {plotU > 0 && (
              <>
                <FunctionPlot
                  x={PLOT_X}
                  y={PLOT_Y}
                  f={(T) => Math.max(16 * MiB, kvBytes(T))}
                  domain={[1024, kvT]}
                  samples={200}
                  reveal={1}
                  color={colors.NEGATIVE}
                  width={3}
                />
                {kvLineU > 0.05 && (
                  <>
                    <circle cx={PLOT_X(kvT)} cy={PLOT_Y(kvBytes(kvT))} r={5} fill={colors.NEGATIVE} />
                    <text
                      x={PLOT_X(kvT) + 10}
                      y={PLOT_Y(kvBytes(kvT)) - 8}
                      fill={colors.NEGATIVE}
                      fontSize={14}
                      fontFamily="monospace"
                    >
                      {fmtBytes(kvBytes(kvT))}
                    </text>
                  </>
                )}
              </>
            )}
            {ssmLineU > 0 && (
              <>
                <FunctionPlot
                  x={PLOT_X}
                  y={PLOT_Y}
                  f={() => SSM_BYTES}
                  domain={[1024, ssmT]}
                  samples={40}
                  reveal={1}
                  color={colors.POSITIVE}
                  width={3}
                />
                <text
                  x={PLOT_X(Math.min(ssmT, 90000))}
                  y={PLOT_Y(SSM_BYTES) + 24}
                  textAnchor="end"
                  fill={colors.POSITIVE}
                  fontSize={14}
                  fontFamily="monospace"
                >
                  64 MiB, flat
                </text>
              </>
            )}
            <text x={200} y={190} fill={colors.NEGATIVE} fontSize={14}>
              transformer KV cache
            </text>
            <text x={200} y={214} fill={colors.POSITIVE} fontSize={14} opacity={ssmLineU}>
              SSM state
            </text>
          </g>

          {/* bars at the three contexts */}
          <g opacity={barsU}>
            <text x={BAR_X0} y={130} fill={colors.TEXT} fontSize={16}>
              KV cache by context — and the state
            </text>
            {CONTEXTS.map((T, i) => {
              const h = BAR_SCALE(kvBytes(T) / GiB);
              return (
                <g key={T}>
                  <rect
                    x={BAR_X0 + i * BAR_GAP}
                    y={BAR_BASE - h * barsU}
                    width={BAR_W}
                    height={Math.max(1, h * barsU)}
                    rx={5}
                    fill={colors.NEGATIVE}
                    opacity={0.75}
                  />
                  <text
                    x={BAR_X0 + i * BAR_GAP + BAR_W / 2}
                    y={BAR_BASE - h * barsU - 10}
                    textAnchor="middle"
                    fill={colors.TEXT}
                    fontSize={14}
                    fontFamily="monospace"
                  >
                    {fmtBytes(kvBytes(T))}
                  </text>
                  <text
                    x={BAR_X0 + i * BAR_GAP + BAR_W / 2}
                    y={BAR_BASE + 20}
                    textAnchor="middle"
                    fill={colors.MUTED}
                    fontSize={13}
                  >
                    {CTX_LABELS[i]}
                  </text>
                </g>
              );
            })}
            {/* the SSM state bar — barely visible on this scale */}
            <rect
              x={BAR_X0 + 3 * BAR_GAP}
              y={BAR_BASE - Math.max(2, BAR_SCALE(SSM_BYTES / GiB)) * barsU}
              width={BAR_W}
              height={Math.max(2, BAR_SCALE(SSM_BYTES / GiB)) * barsU}
              rx={2}
              fill={colors.POSITIVE}
            />
            <text
              x={BAR_X0 + 3 * BAR_GAP + BAR_W / 2}
              y={BAR_BASE + 20}
              textAnchor="middle"
              fill={colors.POSITIVE}
              fontSize={13}
            >
              state
            </text>
            <text
              x={BAR_X0 + 3 * BAR_GAP + BAR_W / 2}
              y={BAR_BASE - 14}
              textAnchor="middle"
              fill={colors.POSITIVE}
              fontSize={13}
              fontFamily="monospace"
            >
              64 MiB
            </text>
          </g>
          {ratioU > 0 && (
            <g opacity={ratioU}>
              <text x={BAR_X0 + 170} y={250} textAnchor="middle" fill={colors.WARM} fontSize={30} fontWeight={700} fontFamily="monospace">
                {RATIO_128K.toFixed(0)}×
              </text>
              <text x={BAR_X0 + 170} y={276} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                smaller at 128k context
              </text>
            </g>
          )}

          {/* the trade, stated */}
          {tradeU > 0 && (
            <g opacity={tradeU}>
              <text x={170} y={620} fill={colors.MUTED} fontSize={14}>
                64 GiB buys exact recall of any token · 64 MiB buys a steerable summary — a price list, not a free lunch
              </text>
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The long-context trade
        </text>
      </g>
      <MathLabel
        tex="\text{KV} = 2 \cdot L \cdot d \cdot T \cdot 2\,\text{bytes}"
        x={760}
        y={44}
        fontSize={20}
        color={colors.SECONDARY}
        opacity={titleU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            A price list, not a free lunch.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Exact memory: 512 KiB per token, forever growing.
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Compressed memory: 64 MiB, flat — 1024× smaller at 128k.
          </text>
        </g>
      )}
    </>
  );
}

export function SsmContextTrade() {
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
