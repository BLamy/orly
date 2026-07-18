// Fresh from arXiv №3, chapter 2 — why serving a mixture of experts is hard.
// Grounded in arXiv:2607.13068 (decoding is compute-light and memory-heavy;
// "every mainstream GPU is built compute-heavy and capacity-light") with the
// model shape from the EcoSpec/Director papers (DeepSeek V3-class: 671B total,
// ~37B active). ALL the arithmetic below is computed at module scope from
// public hardware numbers (H100 SXM: 989 TFLOP/s dense BF16, 3.35 TB/s HBM3,
// 80 GB): the roofline ridge (~295 FLOP/byte), decode's arithmetic intensity
// (~2 FLOP/byte at batch 1 with 8-bit weights), the bandwidth-bound token
// rate (3.35 TB/s / 37 GB ≈ 90 tokens/s), the resulting compute utilization
// (≈0.68%), and the capacity gap (671 GB of weights vs 80 GB per GPU ⇒ 9+
// GPUs before you serve a single user).
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
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
// The arithmetic (module scope, from public numbers).
// ---------------------------------------------------------------------------

const PEAK_FLOPS = 989e12; // H100 SXM dense BF16, FLOP/s
const BW = 3.35e12; // HBM3 bytes/s
const HBM_GB = 80;
const RIDGE = PEAK_FLOPS / BW; // ≈ 295.2 FLOP/byte

const TOTAL_GB = 671; // 8-bit weights, 671B params
const ACTIVE_GB = 37; // active per token

// decode: ~2 FLOPs per weight byte read (multiply + add per 8-bit param)
const intensityAt = (batch: number): number => 2 * batch;
// attainable FLOP/s on the roofline at intensity i
const roofline = (i: number): number => Math.min(PEAK_FLOPS, BW * i);

const TOKS_PER_S = BW / (ACTIVE_GB * 1e9); // ≈ 90.5 tokens/s, bandwidth bound
const UTIL_PCT = ((roofline(intensityAt(1)) / PEAK_FLOPS) * 100).toFixed(2); // 0.68%
const GPUS_NEEDED = Math.ceil(TOTAL_GB / HBM_GB); // 9
const BATCH_AT_RIDGE = Math.round(RIDGE / 2); // ≈ 148

// roofline plot in log10 space
const LOG_I_MIN = 0;
const LOG_I_MAX = 3;
const logFlops = (logI: number): number => Math.log10(roofline(10 ** logI));
const PLOT_X = scaleLinear().domain([LOG_I_MIN, LOG_I_MAX]).range([200, 780]);
const PLOT_Y = scaleLinear().domain([11.5, 15.3]).range([560, 170]);

const CAM_ROOF: CameraState = { x: 500, y: 360, k: 1.15 };
const CAM_CAP: CameraState = { x: 880, y: 330, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  roofU: ChannelRef<number>;
  ridgeU: ChannelRef<number>;
  pointU: ChannelRef<number>;
  batchU: ChannelRef<number>;
  statU: ChannelRef<number>;
  capU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const roofU = tl.channel('roofU', 0);
  const ridgeU = tl.channel('ridgeU', 0);
  const pointU = tl.channel('pointU', 0);
  const batchU = tl.channel('batchU', 0);
  const statU = tl.channel('statU', 0);
  const capU = tl.channel('capU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the roofline
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Every accelerator has a roofline: how fast it can compute, against how much work each byte from memory carries. The flat roof is the compute limit; the slanted wall is the bandwidth limit.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_ROOF, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(roofU, 1, { at: 1.2, dur: 1.8, ease: ease.draw });
  tl.caption({
    at: 6.7,
    dur: 5.4,
    text: 'On a flagship graphics card the corner sits near three hundred operations per byte. Below that line, the expensive compute sits idle, waiting on memory.',
  });
  tl.tween(ridgeU, 1, { at: 7.6, dur: 0.9, ease: ease.enter });
  tl.hold(12.1, 0.5);

  // Beat 2 — where decoding lives
  tl.caption({
    at: 12.6,
    dur: 6.2,
    text: 'Now place decoding on this map. Generating one token for one user reads every active weight once and does roughly two operations per byte read. Two — against a corner at three hundred.',
  });
  tl.tween(pointU, 1, { at: 13.6, dur: 0.9, ease: ease.pop });
  tl.caption({
    at: 19.0,
    dur: 6.0,
    text: 'Run the numbers. Thirty seven gigabytes of active experts per token, three point three five terabytes per second of bandwidth: about ninety tokens per second, while ninety nine point three percent of the compute does nothing.',
  });
  tl.tween(statU, 1, { at: 20.2, dur: 1.0, ease: ease.enter });
  tl.hold(25.0, 0.6);

  // Beat 3 — batching climbs the wall
  tl.caption({
    at: 25.6,
    dur: 5.8,
    text: 'The classic escape is batching: serve many users at once and each byte gets reused. But you need about a hundred and fifty simultaneous streams before this chip is even half honest about its compute.',
  });
  tl.tween(batchU, 1, { at: 26.6, dur: 3.2, ease: ease.move });
  tl.hold(31.4, 0.6);

  // Beat 4 — the capacity gap
  tl.caption({
    at: 32.0,
    dur: 6.0,
    text: 'And the mixture of experts adds its own insult: the token only touched five percent of the model, but all six hundred seventy one gigabytes must live in fast memory, because the router might call any expert next.',
  });
  tl.tween(cam, CAM_CAP, { at: 32.3, dur: 1.4, ease: ease.move });
  tl.tween(capU, 1, { at: 33.2, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 38.2,
    dur: 5.4,
    text: 'At eighty gigabytes per card, that is nine cards of capacity before the first user is served — bought mostly for their memory, not their idle compute.',
  });
  tl.hold(43.6, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 44.2,
    dur: 5.6,
    text: 'That is the memory wall these three papers attack from three directions: waste fewer expert loads, place the experts better, or change what a decoding chip even is.',
  });
  tl.tween(closeU, 1, { at: 45.0, dur: 1.0, ease: ease.enter });
  tl.hold(49.8, 1.2);

  return { tl, cam, titleU, roofU, ridgeU, pointU, batchU, statU, capU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/moe-memory-wall/overrides.json',
  slug: 'moe-memory-wall',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const roofU = s.get(scene.roofU);
  const ridgeU = s.get(scene.ridgeU);
  const pointU = s.get(scene.pointU);
  const batchU = s.get(scene.batchU);
  const statU = s.get(scene.statU);
  const capU = s.get(scene.capU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;

  // the decode point slides up the wall as batch grows 1 -> ridge batch
  const batch = 1 + (BATCH_AT_RIDGE - 1) * batchU;
  const logI = Math.log10(intensityAt(batch));
  const px = PLOT_X(logI);
  const py = PLOT_Y(Math.log10(roofline(intensityAt(batch))));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* roofline */}
          {roofU > 0 && (
            <g opacity={roofU}>
              <Axes
                x={PLOT_X}
                y={PLOT_Y}
                reveal={roofU}
                xTicks={3}
                yTicks={3}
                xLabel="operations per byte (log)"
                yLabel="attained speed (log)"
                fontSize={11}
              />
              <FunctionPlot x={PLOT_X} y={PLOT_Y} f={logFlops} domain={[LOG_I_MIN, LOG_I_MAX]} samples={200} reveal={roofU} color={colors.SECONDARY} width={3} />
              {ridgeU > 0 && (
                <g opacity={ridgeU}>
                  <line
                    x1={PLOT_X(Math.log10(RIDGE))}
                    y1={PLOT_Y(11.6)}
                    x2={PLOT_X(Math.log10(RIDGE))}
                    y2={PLOT_Y(Math.log10(PEAK_FLOPS))}
                    stroke={colors.MUTED}
                    strokeDasharray="5 4"
                  />
                  <text x={PLOT_X(Math.log10(RIDGE)) + 8} y={PLOT_Y(12.1)} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                    ridge ≈ {Math.round(RIDGE)} FLOP/B
                  </text>
                </g>
              )}
              {pointU > 0 && (
                <g opacity={pointU}>
                  <circle cx={px} cy={py} r={8} fill={colors.WARM} />
                  <circle cx={px} cy={py} r={14} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={0.5} />
                  <text x={px + 18} y={py - 10} fill={colors.WARM} fontSize={13} fontFamily="monospace">
                    decode · batch {Math.round(batch)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* computed stats */}
          {statU > 0 && (
            <g opacity={statU}>
              <rect x={840} y={180} width={330} height={168} rx={12} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
              <text x={866} y={214} fill={colors.TEXT} fontSize={14}>
                batch 1, computed:
              </text>
              <text x={866} y={244} fill={colors.WARM} fontSize={14} fontFamily="monospace">
                {TOKS_PER_S.toFixed(0)} tokens/s (bandwidth bound)
              </text>
              <text x={866} y={274} fill={colors.WARM} fontSize={14} fontFamily="monospace">
                compute used: {UTIL_PCT}%
              </text>
              <text x={866} y={304} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                3.35 TB/s ÷ 37 GB per token
              </text>
              <text x={866} y={330} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                ridge needs batch ≈ {BATCH_AT_RIDGE}
              </text>
            </g>
          )}

          {/* capacity gap */}
          {capU > 0 && (
            <g opacity={capU}>
              <text x={840} y={400} fill={colors.TEXT} fontSize={15}>
                the capacity gap
              </text>
              <rect x={840} y={414} width={340 * capU} height={22} rx={5} fill={colors.NEGATIVE} opacity={0.75} />
              <text x={846} y={430} fill={colors.BG} fontSize={12} fontFamily="monospace" fontWeight={700}>
                weights: {TOTAL_GB} GB
              </text>
              <rect x={840} y={444} width={340 * (HBM_GB / TOTAL_GB)} height={22} rx={5} fill={colors.ACCENT} opacity={0.9} />
              <text x={890} y={460} fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
                one card: {HBM_GB} GB
              </text>
              <text x={840} y={496} fill={colors.WARM} fontSize={14} fontFamily="monospace">
                ⇒ {GPUS_NEEDED} cards before user #1
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The memory wall
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.13068 · roofline, computed
        </text>
      </g>
      <MathLabel
        tex="\mathrm{tokens/s} \le \frac{\mathrm{bandwidth}}{\mathrm{active\ bytes}}"
        x={1020}
        y={92}
        fontSize={20}
        color={colors.WARM}
        opacity={statU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Decoding buys compute and uses memory.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Ninety tokens a second, 0.68% compute utilization, nine cards
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            of capacity — the mismatch every chapter from here attacks.
          </text>
        </g>
      )}
    </>
  );
}

export function MoeMemoryWall() {
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
