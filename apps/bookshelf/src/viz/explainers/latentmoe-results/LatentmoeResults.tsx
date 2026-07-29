// arXiv:2601.18089 — "LatentMoE" — Chapter 4: the receipts, replotted.
// 95B total / 8B active transformer, 300B tokens (reported):
//   MMLU Pro: baseline 29.26 · ℓ-MoE_acc 34.91 · ℓ-MoE_eff 34.75
//   MMLU: 58.95 / 62.23 / 61.06 · Code: 40.33 / 41.50 / 40.68
//   Math: 64.39 / 64.88 / 63.61 · Commonsense: 74.32 / 75.18 / 73.72
// ℓ-MoE_eff matches with ~34% fewer active params (5.62B vs 8.47B).
// 73B hybrid Mamba-Attention, 1T tokens: +4.6 MMLU Pro, +2 MMLU.
// Trillion-scale projection (Kimi-K2-style): ~350B fewer params at matched
// accuracy → 1.24x–3.46x serving speedup across the throughput-latency
// Pareto frontier. Architecture adopted by Nemotron-3 Super/Ultra.
import {
  CAMERA_HOME,
  Camera,
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
import overrides from './overrides.json';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const BENCH = [
  { name: 'MMLU Pro', base: 29.26, acc: 34.91 },
  { name: 'MMLU', base: 58.95, acc: 62.23 },
  { name: 'Code', base: 40.33, acc: 41.5 },
  { name: 'Math', base: 64.39, acc: 64.88 },
  { name: 'Commonsense', base: 74.32, acc: 75.18 },
];

const CH_X = 250;
const CH_Y = 160;
const ROW_H = 62;
const BAR_MAX = 560;

const CAM_TABLE: CameraState = { x: 620, y: 300, k: 1.2 };
const CAM_SCALE: CameraState = { x: 700, y: 480, k: 1.25 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  rowsU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  effU: ChannelRef<number>;
  hybridU: ChannelRef<number>;
  trillU: ChannelRef<number>;
  adoptU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const fillU = tl.channel('fillU', 0);
  const effU = tl.channel('effU', 0);
  const hybridU = tl.channel('hybridU', 0);
  const trillU = tl.channel('trillU', 0);
  const adoptU = tl.channel('adoptU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — matched-budget comparison
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Now the receipts. A ninety five billion parameter model, trained three hundred billion tokens, against a standard mixture at the exact same parameter and compute budget. These are the papers numbers, replotted.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_TABLE, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(rowsU, 1, { at: 1.6, dur: 2.8, ease: ease.linear });
  tl.tween(fillU, 1, { at: 4.2, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 6.9,
    dur: 5.6,
    text: 'The latent design wins every row. The headline is the hardest benchmark: professional level knowledge jumps almost six points, from twenty nine to thirty five — at identical cost.',
  });
  tl.hold(12.5, 0.7);

  // Beat 2 — the efficiency variant
  tl.caption({
    at: 13.2,
    dur: 5.6,
    text: 'And there is a second dial. Tune the same architecture for efficiency instead of accuracy, and it matches the baseline while activating a third fewer parameters per token — five point six billion instead of eight and a half.',
  });
  tl.tween(effU, 1, { at: 14.4, dur: 1.0, ease: ease.enter });
  tl.hold(18.8, 0.7);

  // Beat 3 — generalization
  tl.caption({
    at: 19.5,
    dur: 5.6,
    text: 'Does it survive contact with other architectures? On a seventy three billion parameter hybrid state space and attention model, trained a full trillion tokens with untouched hyperparameters: four and a half points of professional knowledge, two points of general knowledge.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 19.7, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAM_SCALE, { at: 21.2, dur: 1.2, ease: ease.move });
  tl.tween(hybridU, 1, { at: 20.7, dur: 1.0, ease: ease.enter });
  tl.hold(25.1, 0.7);

  // Beat 4 — trillion-scale projection
  tl.caption({
    at: 25.8,
    dur: 6.0,
    text: 'Projected to trillion parameter scale, the arithmetic gets loud: matching a standard trillion parameter mixture takes roughly three hundred fifty billion fewer parameters — which turns into a serving speedup between one point two and three and a half fold across the whole latency throughput frontier.',
  });
  tl.tween(trillU, 1, { at: 27.0, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 32.1,
    dur: 4.6,
    text: 'And this is not a lab curiosity — the architecture already ships inside a major production model family. The receipts left the paper.',
  });
  tl.tween(adoptU, 1, { at: 33.2, dur: 0.9, ease: ease.enter });
  tl.hold(36.7, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 37.4,
    dur: 4.6,
    text: 'Better accuracy at matched cost, matched accuracy at lower cost, and it transfers across model families and scales. One honest question remains: what does it give up?',
  });
  tl.tween(cam, CAMERA_HOME, { at: 37.6, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 38.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 39.1, dur: 1.0, ease: ease.enter });
  tl.hold(42.0, 1.2);

  return { tl, cam, titleU, rowsU, fillU, effU, hybridU, trillU, adoptU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/latentmoe-results/overrides.json',
  slug: 'latentmoe-results',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const rowsU = s.get(scene.rowsU);
  const fillU = s.get(scene.fillU);
  const effU = s.get(scene.effU);
  const hybridU = s.get(scene.hybridU);
  const trillU = s.get(scene.trillU);
  const adoptU = s.get(scene.adoptU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <text x={CH_X} y={CH_Y - 36} fill={colors.TEXT} fontSize={16} opacity={rowsU}>
            95B / 8B-active · 300B tokens · matched budget
          </text>
          <text x={CH_X + 430} y={CH_Y - 36} fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={rowsU}>
            reported — replotted, not re-run
          </text>
          {BENCH.map((b, i) => {
            const u = clamp01(rowsU * BENCH.length - i);
            if (u <= 0) return null;
            const y = CH_Y + i * ROW_H;
            const wb = (b.base / 80) * BAR_MAX * fillU;
            const wa = (b.acc / 80) * BAR_MAX * fillU;
            return (
              <g key={b.name} opacity={u}>
                <text x={CH_X - 14} y={y + 18} textAnchor="end" fill={colors.TEXT} fontSize={14}>
                  {b.name}
                </text>
                <rect x={CH_X} y={y} width={Math.max(wb, 2)} height={15} rx={3} fill={colors.MUTED} opacity={0.5} />
                <text x={CH_X + wb + 8} y={y + 12} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                  {b.base.toFixed(2)} baseline
                </text>
                <rect x={CH_X} y={y + 19} width={Math.max(wa, 2)} height={15} rx={3} fill={colors.POSITIVE} opacity={0.85} />
                <text x={CH_X + wa + 8} y={y + 31} fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>
                  {b.acc.toFixed(2)} ℓ-MoE_acc
                </text>
              </g>
            );
          })}

          {/* efficiency variant chip */}
          {effU > 0 && (
            <g opacity={effU}>
              <rect x={890} y={CH_Y + 10} width={310} height={96} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={912} y={CH_Y + 40} fill={colors.ACCENT} fontSize={14} fontWeight={600} fontFamily={MONO}>
                ℓ-MoE_eff
              </text>
              <text x={912} y={CH_Y + 66} fill={colors.TEXT} fontSize={13}>
                matches baseline accuracy with
              </text>
              <text x={912} y={CH_Y + 88} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                5.62B vs 8.47B active (−34%)
              </text>
            </g>
          )}

          {/* scale panel */}
          {hybridU > 0 && (
            <g opacity={hybridU}>
              <rect x={330} y={510} width={360} height={92} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={352} y={540} fill={colors.SECONDARY} fontSize={14} fontWeight={600}>
                73B hybrid Mamba + attention · 1T tokens
              </text>
              <text x={352} y={566} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                MMLU Pro +4.6 · MMLU +2.0
              </text>
              <text x={352} y={588} fill={colors.MUTED} fontSize={12}>
                identical hyperparameters
              </text>
            </g>
          )}
          {trillU > 0 && (
            <g opacity={trillU}>
              <rect x={720} y={510} width={420} height={92} rx={12} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={742} y={540} fill={colors.WARM} fontSize={14} fontWeight={600}>
                trillion-scale projection
              </text>
              <text x={742} y={566} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                ~350B fewer params at matched accuracy
              </text>
              <text x={742} y={588} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                1.24x–3.46x serving speedup (Pareto)
              </text>
            </g>
          )}
          {adoptU > 0 && (
            <text x={640} y={640 - 12} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={adoptU}>
              adopted in the Nemotron-3 Super and Ultra production models
            </text>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The receipts
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2601.18089 · results
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Wins every row at matched cost
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            or matches at a third fewer active parameters — and the
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            projection says 350 billion parameters of headroom at 1T scale
          </text>
        </g>
      )}
    </>
  );
}

export function LatentmoeResults() {
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
