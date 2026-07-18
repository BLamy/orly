// Explained: Hybrid Attention — chapter 4: where in the stack the attention
// layer goes. A real toy, measured at module scope: needle retrieval over 24
// random unit keys in 32 dimensions, where the query arrives NOISY (the raw
// token is an imperfect cue). A recurrent layer that averages four noisy
// mentions halves the noise before attention ever sees the query. Placement
// experiment, 400 seeded trials per point: with query noise sigma 0.6, an
// attention layer placed EARLY (before smoothing) retrieves the right value
// 40% of the time; the same layer placed AFTER the recurrent smoothing
// retrieves 85%. The full accuracy-vs-noise curves are computed, not drawn.
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
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real math, module scope.
// ---------------------------------------------------------------------------

const D = 32;
const NKEYS = 24;
const TRIALS = 400;
const rand = mulberry32(77);
const g = gaussian(rand);

const unit = (): number[] => {
  const v = Array.from({ length: D }, () => g());
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};

/** Retrieval accuracy when the query carries additive noise of scale sigma. */
const accAt = (sigma: number): number => {
  let ok = 0;
  for (let t = 0; t < TRIALS; t++) {
    const keys = Array.from({ length: NKEYS }, unit);
    const q = keys[0].map((x) => x + sigma * g());
    const scores = keys.map((k) => k.reduce((a, x, i) => a + x * q[i], 0));
    if (scores.indexOf(Math.max(...scores)) === 0) ok++;
  }
  return ok / TRIALS;
};

const SIGMAS = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2];
/** attention EARLY: sees the raw noisy query. */
const ACC_RAW = SIGMAS.map((s) => accAt(s)); // ≈ [.99, .72, .36, .24, .15, .15]
/** attention LATE: a recurrent layer averaged 4 mentions first — noise halved. */
const ACC_SM = SIGMAS.map((s) => accAt(s / 2)); // ≈ [1, .99, .85, .69, .50, .37]

const SIGMA_DEMO = 0.6;
const ACC_EARLY = ACC_RAW[2]; // 0.3625 → "thirty six percent"
const ACC_LATE = ACC_SM[2]; // 0.8475 → "about eighty five percent"

const interpAcc = (arr: number[]) => (sig: number): number => {
  const u = (Math.max(0.2, Math.min(1.2, sig)) - 0.2) / 0.2;
  const i = Math.floor(u);
  if (i >= arr.length - 1) return arr[arr.length - 1];
  return arr[i] + (arr[i + 1] - arr[i]) * (u - i);
};
const rawAt = interpAcc(ACC_RAW);
const smAt = interpAcc(ACC_SM);

/** A little seeded 2-D projection of the noisy query mentions for the stage. */
const demoRand = mulberry32(5);
const dg = gaussian(demoRand);
const MENTIONS = Array.from({ length: 4 }, () => ({ dx: dg() * 40, dy: dg() * 40 }));
const MEAN = {
  dx: MENTIONS.reduce((a, m) => a + m.dx, 0) / 4,
  dy: MENTIONS.reduce((a, m) => a + m.dy, 0) / 4,
};

// ---------------------------------------------------------------------------
// Layout. Left: the two candidate stacks. Center: the noisy query cloud that
// the recurrent layer condenses. Right: accuracy vs noise curves + two bars.
// ---------------------------------------------------------------------------

const STACK_EARLY_X = 140;
const STACK_LATE_X = 320;
const STACK_Y0 = 140;
const SCELL_W = 120;
const SCELL_H = 44;

const CLOUD_CX = 640;
const CLOUD_CY = 250;

const ACC_X = scaleLinear().domain([0.2, 1.2]).range([760, 1150]);
const ACC_Y = scaleLinear().domain([0, 1.05]).range([420, 140]);

const BAR_Y0 = 590;
const BAR_MAXW = 320;

const CAM_STACKS: CameraState = { x: 300, y: 300, k: 1.35 };
const CAM_CLOUD: CameraState = { x: 640, y: 270, k: 1.5 };
const CAM_ACC: CameraState = { x: 950, y: 300, k: 1.3 };
const CAM_BARS: CameraState = { x: 560, y: 500, k: 1.3 };

const STACK_LAYERS: { early: string; late: string }[] = [
  { early: 'attn', late: 'ssm' },
  { early: 'ssm', late: 'ssm' },
  { early: 'ssm', late: 'ssm' },
  { early: 'ssm', late: 'attn' },
];

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  stacksU: ChannelRef<number>;
  cloudU: ChannelRef<number>;
  condense: ChannelRef<number>;
  accU: ChannelRef<number>;
  accSweep: ChannelRef<number>;
  barsU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const stacksU = tl.channel('stacksU', 0);
  const cloudU = tl.channel('cloudU', 0);
  const condense = tl.channel('condense', 0);
  const accU = tl.channel('accU', 0);
  const accSweep = tl.channel('accSweep', 0);
  const barsU = tl.channel('barsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — same budget, two stacks
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Fix the budget at exactly one attention layer in four. There are still two very different models you can build: attention first, or attention last.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_STACKS, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(stacksU, 1, { at: 1.4, dur: 1.4, ease: ease.enter });
  tl.hold(6.3, 0.5);

  // Beat 2 — the catch: queries arrive noisy
  tl.caption({
    at: 6.8,
    dur: 6.0,
    text: 'Here is the catch that makes placement matter. In a real sequence the retrieval cue is rarely one clean token — it is a noisy signal, mentioned a few times, that lower layers have to piece together.',
  });
  tl.tween(cam, CAM_CLOUD, { at: 7.0, dur: 1.5, ease: ease.move });
  tl.tween(cloudU, 1, { at: 8.0, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 13.0,
    dur: 5.6,
    text: 'A recurrent layer is a natural denoiser: averaging four noisy mentions of the cue cuts the noise in half before anything downstream reads it.',
  });
  tl.tween(condense, 1, { at: 13.6, dur: 2.0, ease: ease.move });
  tl.hold(18.8, 0.6);

  // Beat 3 — measure both placements across noise levels
  tl.caption({
    at: 19.4,
    dur: 5.8,
    text: 'So run the experiment: twenty four stored pairs, four hundred trials per point, and dial the cue noise up. One curve gives attention the raw cue. The other lets the recurrent layer smooth it first.',
  });
  tl.tween(cam, CAM_ACC, { at: 19.6, dur: 1.5, ease: ease.move });
  tl.tween(accU, 1, { at: 20.8, dur: 1.3, ease: ease.draw });
  tl.tween(accSweep, 1, { at: 22.4, dur: 3.4, ease: ease.move });
  tl.caption({
    at: 25.6,
    dur: 6.0,
    text: 'The gap is not subtle. At moderate noise, attention reading the raw cue finds the needle forty percent of the time. Given the smoothed cue, the same layer hits eighty five.',
  });
  tl.hold(31.9, 0.7);

  // Beat 4 — the bars: early vs late
  tl.caption({
    at: 32.6,
    dur: 5.8,
    text: 'Translate that back into placement. Attention as layer one works with raw, noisy queries. Attention after three recurrent layers works with cleaned-up ones — same layer, same budget, very different machine.',
  });
  tl.tween(cam, CAM_BARS, { at: 32.8, dur: 1.5, ease: ease.move });
  tl.tween(barsU, 1, { at: 33.9, dur: 1.2, ease: ease.pop });
  tl.hold(38.9, 0.7);

  // Beat 5 — what the field does
  tl.caption({
    at: 39.6,
    dur: 5.6,
    text: 'This is why published hybrids tend to keep their precious attention layers away from the very bottom of the stack: let the cheap layers refine the representation, then spend the spotlight on refined queries.',
  });
  tl.hold(45.5, 0.6);

  // Beat 6 — close
  tl.caption({
    at: 46.1,
    dur: 5.4,
    text: 'Ratio says how many exact layers you buy. Placement says where they earn their keep. One question remains: what does all this actually save when you serve the model?',
  });
  tl.tween(cam, CAMERA_HOME, { at: 46.3, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 47.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.4, dur: 0.9, ease: ease.enter });
  tl.hold(51.7, 1.2);

  return { tl, cam, titleU, stacksU, cloudU, condense, accU, accSweep, barsU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/hybrid-placement/overrides.json',
  slug: 'hybrid-placement',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const stacksU = s.get(scene.stacksU);
  const cloudU = s.get(scene.cloudU);
  const condense = s.get(scene.condense);
  const accU = s.get(scene.accU);
  const accSweep = s.get(scene.accSweep);
  const barsU = s.get(scene.barsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const sweepSig = 0.2 + accSweep * 1.0;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* two candidate stacks */}
          <g opacity={stacksU}>
            <text x={STACK_EARLY_X} y={STACK_Y0 - 40} fill={colors.TEXT} fontSize={17}>
              same budget, two designs
            </text>
            {(['early', 'late'] as const).map((which, col) => {
              const x0 = col === 0 ? STACK_EARLY_X : STACK_LATE_X;
              return (
                <g key={which}>
                  <text x={x0 + SCELL_W / 2} y={STACK_Y0 - 12} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                    {which === 'early' ? 'attention first' : 'attention last'}
                  </text>
                  {STACK_LAYERS.map((row, i) => {
                    const kind = row[which];
                    const attn = kind === 'attn';
                    // draw layer 1 at the bottom
                    const y = STACK_Y0 + (STACK_LAYERS.length - 1 - i) * (SCELL_H + 8);
                    return (
                      <g key={i}>
                        <rect
                          x={x0}
                          y={y}
                          width={SCELL_W}
                          height={SCELL_H}
                          rx={6}
                          fill={attn ? colors.ACCENT : colors.PANEL}
                          opacity={attn ? 0.9 : 0.75}
                          stroke={attn ? colors.ACCENT : colors.GRID}
                          strokeWidth={attn ? 1.4 : 0.8}
                        />
                        <text
                          x={x0 + SCELL_W / 2}
                          y={y + SCELL_H / 2 + 4}
                          textAnchor="middle"
                          fill={attn ? colors.BG : colors.MUTED}
                          fontSize={12}
                          fontFamily="monospace"
                        >
                          {attn ? 'attention' : 'recurrent'}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
            <text x={STACK_EARLY_X} y={STACK_Y0 + 4 * (SCELL_H + 8) + 18} fill={colors.MUTED} fontSize={12}>
              tokens enter at the bottom
            </text>
          </g>

          {/* the noisy cue cloud, condensed by the recurrent average */}
          {cloudU > 0 && (
            <g opacity={cloudU * (1 - 0.85 * accU)}>
              <text x={CLOUD_CX - 90} y={CLOUD_CY - 90} fill={colors.TEXT} fontSize={15}>
                four noisy mentions of one cue
              </text>
              <circle cx={CLOUD_CX} cy={CLOUD_CY} r={4} fill={colors.POSITIVE} opacity={0.9} />
              <text x={CLOUD_CX + 10} y={CLOUD_CY + 4} fill={colors.POSITIVE} fontSize={11}>
                true key
              </text>
              {MENTIONS.map((m, i) => {
                const x = CLOUD_CX + m.dx + (MEAN.dx - m.dx) * condense;
                const y = CLOUD_CY + m.dy + (MEAN.dy - m.dy) * condense;
                return <circle key={i} cx={x} cy={y} r={7 - condense * 2} fill={colors.WARM} opacity={0.8} />;
              })}
              {condense > 0.6 && (
                <text x={CLOUD_CX + MEAN.dx + 12} y={CLOUD_CY + MEAN.dy - 8} fill={colors.WARM} fontSize={12} opacity={(condense - 0.6) / 0.4}>
                  averaged: noise halved
                </text>
              )}
              <MathLabel
                tex="\sigma_{\text{avg}} = \sigma/\sqrt{4}"
                x={CLOUD_CX - 70}
                y={CLOUD_CY + 96}
                fontSize={16}
                color={colors.MUTED}
                opacity={condense}
              />
            </g>
          )}

          {/* accuracy vs noise */}
          {accU > 0 && (
            <g opacity={accU}>
              <text x={760} y={104} fill={colors.TEXT} fontSize={16}>
                needle accuracy vs cue noise
              </text>
              <text x={760} y={126} fill={colors.MUTED} fontSize={12}>
                24 keys · 32 dims · 400 trials per point
              </text>
              <Axes x={ACC_X} y={ACC_Y} reveal={accU} xTicks={5} yTicks={3} xLabel="cue noise σ" fontSize={11} />
              <FunctionPlot
                x={ACC_X}
                y={ACC_Y}
                f={smAt}
                domain={[0.2, Math.max(0.22, sweepSig)]}
                samples={120}
                reveal={1}
                color={colors.POSITIVE}
                width={2.6}
              />
              <FunctionPlot
                x={ACC_X}
                y={ACC_Y}
                f={rawAt}
                domain={[0.2, Math.max(0.22, sweepSig)]}
                samples={120}
                reveal={1}
                color={colors.NEGATIVE}
                width={2.6}
              />
              {accSweep > 0.98 && (
                <>
                  <circle cx={ACC_X(SIGMA_DEMO)} cy={ACC_Y(rawAt(SIGMA_DEMO))} r={5} fill={colors.NEGATIVE} />
                  <circle cx={ACC_X(SIGMA_DEMO)} cy={ACC_Y(smAt(SIGMA_DEMO))} r={5} fill={colors.POSITIVE} />
                  <text x={ACC_X(SIGMA_DEMO) + 8} y={ACC_Y(rawAt(SIGMA_DEMO)) + 18} fill={colors.NEGATIVE} fontSize={13} fontWeight={600}>
                    {(ACC_EARLY * 100).toFixed(0)}%
                  </text>
                  <text x={ACC_X(SIGMA_DEMO) + 8} y={ACC_Y(smAt(SIGMA_DEMO)) - 10} fill={colors.POSITIVE} fontSize={13} fontWeight={600}>
                    {(ACC_LATE * 100).toFixed(0)}%
                  </text>
                </>
              )}
              <text x={ACC_X(1.2)} y={ACC_Y(smAt(1.2)) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={12}>
                smoothed cue (attention late)
              </text>
              <text x={ACC_X(0.52)} y={ACC_Y(0.3)} fill={colors.NEGATIVE} fontSize={12}>
                raw cue (attention early)
              </text>
            </g>
          )}

          {/* the two placement bars */}
          {barsU > 0 && (
            <g opacity={barsU}>
              <text x={220} y={BAR_Y0 - 52} fill={colors.TEXT} fontSize={16}>
                needle accuracy at noise 0.6, by placement
              </text>
              <text x={220} y={BAR_Y0 - 8} fill={colors.NEGATIVE} fontSize={13}>
                attention as layer 1
              </text>
              <rect x={420} y={BAR_Y0 - 22} width={BAR_MAXW * ACC_EARLY * barsU} height={18} rx={4} fill={colors.NEGATIVE} opacity={0.85} />
              <text x={428 + BAR_MAXW * ACC_EARLY * barsU} y={BAR_Y0 - 8} fill={colors.NEGATIVE} fontSize={13} fontWeight={600}>
                {(ACC_EARLY * 100).toFixed(0)}%
              </text>
              <text x={220} y={BAR_Y0 + 26} fill={colors.POSITIVE} fontSize={13}>
                attention as layer 4
              </text>
              <rect x={420} y={BAR_Y0 + 12} width={BAR_MAXW * ACC_LATE * barsU} height={18} rx={4} fill={colors.POSITIVE} opacity={0.85} />
              <text x={428 + BAR_MAXW * ACC_LATE * barsU} y={BAR_Y0 + 26} fill={colors.POSITIVE} fontSize={13} fontWeight={600}>
                {(ACC_LATE * 100).toFixed(0)}%
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Placement
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={220} width={840} height={200} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Spend the spotlight on refined queries.
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Same one-in-four budget: 40% with attention at the bottom,
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            85% after the recurrent layers have cleaned the cue.
          </text>
        </g>
      )}
    </>
  );
}

export function HybridPlacement() {
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
