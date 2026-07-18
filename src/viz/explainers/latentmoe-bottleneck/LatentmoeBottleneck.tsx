// arXiv:2601.18089 — "LatentMoE: Toward Optimal Accuracy per FLOP and
// Parameter in Mixture of Experts" (Elango et al., Jan 2026).
// Chapter 1: why serving MoE hurts, in the paper's two regimes.
// Latency-critical (small batch): memory-bandwidth bound — on GB200 an
// expert needs t_exp ≥ 1418 tokens to become compute-bound, while real
// per-expert batches sit in the hundreds. High-throughput (large batch):
// all-to-all token dispatch dominates — communication ≈ 9x the expert
// compute time in the paper's Qwen3-235B analysis. Reported numbers,
// replotted; not re-measured here.
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

// expert grid (left regime panel)
const EXP_COLS = 8;
const EXP_ROWS = 4;
const EXP_X = 150;
const EXP_Y = 200;
const EXP_S = 46;

// the arithmetic-intensity bar: tokens per expert vs the compute-bound line
const AI_X = 150;
const AI_Y = 470;
const AI_W = 480;
const T_NEEDED = 1418;
const T_TYPICAL = 250; // "hundreds" — representative marker

// throughput regime (right): comm vs compute bars
const CT_X = 760;
const CT_Y = 250;

const CAM_EXPERTS: CameraState = { x: EXP_X + (EXP_COLS * EXP_S) / 2, y: 330, k: 1.3 };
const CAM_COMM: CameraState = { x: 940, y: 330, k: 1.25 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  tokU: ChannelRef<number>; // tokens scatter to experts
  starveU: ChannelRef<number>;
  aiU: ChannelRef<number>;
  commU: ChannelRef<number>;
  ratioU: ChannelRef<number>;
  axesU: ChannelRef<number>; // the two-axis goal
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const gridU = tl.channel('gridU', 0);
  const tokU = tl.channel('tokU', 0);
  const starveU = tl.channel('starveU', 0);
  const aiU = tl.channel('aiU', 0);
  const commU = tl.channel('commU', 0);
  const ratioU = tl.channel('ratioU', 0);
  const axesU = tl.channel('axesU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the promise of MoE
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'A mixture of experts is a beautiful bargain: keep hundreds of experts in memory, wake only a handful per token. Huge capacity, small compute. The catch is that the bargain is priced in the wrong currency.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_EXPERTS, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(gridU, 1, { at: 1.6, dur: 2.4, ease: ease.linear });
  tl.tween(tokU, 1, { at: 4.0, dur: 1.6, ease: ease.linear });
  tl.hold(6.1, 0.7);

  // Beat 2 — regime 1: starved experts
  tl.caption({
    at: 6.8,
    dur: 6.0,
    text: 'Regime one: interactive serving, small batches. Each token wakes a few experts, so every expert sees only a trickle of tokens — but its full weight matrix must still be hauled from memory. The experts starve.',
  });
  tl.tween(starveU, 1, { at: 8.2, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 13.1,
    dur: 5.8,
    text: 'The paper puts a number on it. On current hardware an expert needs about fourteen hundred tokens per pass before compute catches up with the memory traffic. Typical serving gives it a few hundred. Bandwidth bound, always.',
  });
  tl.tween(aiU, 1, { at: 14.4, dur: 1.6, ease: ease.move });
  tl.hold(18.9, 0.7);

  // Beat 3 — regime 2: all-to-all
  tl.caption({
    at: 19.6,
    dur: 6.0,
    text: 'Regime two: throughput serving, huge batches. Now the experts are fed — but tokens must be shipped across the machine to whichever expert owns them and shipped back. All to all, twice per layer.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 19.8, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAM_COMM, { at: 21.3, dur: 1.2, ease: ease.move });
  tl.tween(commU, 1, { at: 20.8, dur: 1.8, ease: ease.enter });
  tl.caption({
    at: 26.0,
    dur: 5.4,
    text: 'In the papers analysis of a two hundred thirty five billion parameter deployment, that shipping takes about nine times longer than the expert math it delivers. The network, not the arithmetic, is the machine.',
  });
  tl.tween(ratioU, 1, { at: 27.2, dur: 1.6, ease: ease.move });
  tl.hold(31.4, 0.7);

  // Beat 4 — the reframe
  tl.caption({
    at: 32.1,
    dur: 5.8,
    text: 'Both bottlenecks scale with the same thing: the width of what moves — weights hauled per expert, bytes shipped per token. So this paper asks the pointed question: is that width actually earning its keep?',
  });
  tl.tween(cam, CAMERA_HOME, { at: 32.3, dur: 1.3, ease: ease.move });
  tl.tween(axesU, 1, { at: 33.4, dur: 1.0, ease: ease.enter });
  tl.hold(37.9, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 38.6,
    dur: 5.0,
    text: 'Their answer is an architecture that shrinks the room the experts work in without shrinking what they can express. That trick — and its receipts — is the rest of this book.',
  });
  tl.tween(dimU, 1, { at: 38.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 39.8, dur: 1.0, ease: ease.enter });
  tl.hold(43.6, 1.2);

  return { tl, cam, titleU, gridU, tokU, starveU, aiU, commU, ratioU, axesU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/latentmoe-bottleneck/overrides.json',
  slug: 'latentmoe-bottleneck',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const gridU = s.get(scene.gridU);
  const tokU = s.get(scene.tokU);
  const starveU = s.get(scene.starveU);
  const aiU = s.get(scene.aiU);
  const commU = s.get(scene.commU);
  const ratioU = s.get(scene.ratioU);
  const axesU = s.get(scene.axesU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const N_EXP = EXP_COLS * EXP_ROWS;
  // which experts are "active" (a fixed sparse set)
  const active = new Set([2, 9, 13, 20, 27, 30]);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* expert grid */}
          {Array.from({ length: N_EXP }, (_, i) => {
            const u = clamp01(gridU * N_EXP - i);
            if (u <= 0) return null;
            const x = EXP_X + (i % EXP_COLS) * EXP_S;
            const y = EXP_Y + Math.floor(i / EXP_COLS) * EXP_S;
            const isActive = active.has(i) && tokU > 0.3;
            const starved = starveU > 0 && isActive;
            return (
              <g key={i} opacity={u}>
                <rect x={x} y={y} width={EXP_S - 8} height={EXP_S - 8} rx={7}
                  fill={isActive ? colors.ACCENT : colors.PANEL}
                  opacity={isActive ? 0.5 + 0.3 * tokU : 0.7}
                  stroke={starved ? colors.WARM : colors.GRID}
                  strokeWidth={starved ? 2 : 1} />
                {isActive && (
                  <circle cx={x + (EXP_S - 8) / 2} cy={y + (EXP_S - 8) / 2} r={4 * tokU} fill={colors.TEXT} opacity={0.8} />
                )}
              </g>
            );
          })}
          {gridU > 0.9 && (
            <text x={EXP_X} y={EXP_Y - 18} fill={colors.MUTED} fontSize={13} opacity={gridU}>
              experts in memory — few wake per token
            </text>
          )}
          {starveU > 0 && (
            <text x={EXP_X} y={EXP_Y + EXP_ROWS * EXP_S + 24} fill={colors.WARM} fontSize={13} opacity={starveU}>
              full weights hauled · a trickle of tokens each
            </text>
          )}

          {/* arithmetic intensity bar */}
          {aiU > 0 && (
            <g opacity={aiU}>
              <text x={AI_X} y={AI_Y - 14} fill={colors.TEXT} fontSize={13}>
                tokens per expert per pass — reported threshold, replotted
              </text>
              <rect x={AI_X} y={AI_Y} width={AI_W} height={20} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={AI_X} y={AI_Y} width={(T_TYPICAL / 1600) * AI_W * aiU} height={20} rx={5} fill={colors.NEGATIVE} opacity={0.7} />
              <line x1={AI_X + (T_NEEDED / 1600) * AI_W} y1={AI_Y - 8} x2={AI_X + (T_NEEDED / 1600) * AI_W} y2={AI_Y + 28} stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="4 3" />
              <text x={AI_X + (T_NEEDED / 1600) * AI_W} y={AI_Y + 44} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                compute-bound at ≥ 1418
              </text>
              <text x={AI_X + (T_TYPICAL / 1600) * AI_W + 8} y={AI_Y + 15} fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>
                typical: a few hundred
              </text>
            </g>
          )}

          {/* comm vs compute */}
          {commU > 0 && (
            <g opacity={commU}>
              <text x={CT_X} y={CT_Y - 30} fill={colors.TEXT} fontSize={15}>
                throughput regime · time per MoE layer
              </text>
              <text x={CT_X} y={CT_Y - 10} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                paper's Qwen3-235B analysis — reported, replotted
              </text>
              <text x={CT_X} y={CT_Y + 34} fill={colors.TEXT} fontSize={13}>
                expert compute
              </text>
              <rect x={CT_X + 150} y={CT_Y + 20} width={44 * ratioU + 4} height={18} rx={4} fill={colors.ACCENT} opacity={0.8} />
              <text x={CT_X} y={CT_Y + 74} fill={colors.TEXT} fontSize={13}>
                all-to-all dispatch
              </text>
              <rect x={CT_X + 150} y={CT_Y + 60} width={(44 * ratioU + 4) * 9} height={18} rx={4} fill={colors.NEGATIVE} opacity={0.8} />
              {ratioU > 0.8 && (
                <text x={CT_X + 150 + 44 * 9 + 16} y={CT_Y + 74} fill={colors.NEGATIVE} fontSize={15} fontFamily={MONO} opacity={ratioU}>
                  ≈ 9x
                </text>
              )}
            </g>
          )}

          {/* the paper's two axes */}
          {axesU > 0 && (
            <g opacity={axesU}>
              <rect x={330} y={560} width={620} height={46} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={640} y={589} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} fontWeight={600}>
                the goal: accuracy per FLOP · accuracy per parameter
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The width you pay for
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2601.18089
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Both bottlenecks are the hidden width
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            starved experts haul full-width weights; all-to-all ships
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            full-width tokens — so shrink the room the experts work in
          </text>
          <text x={640} y={400} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            LatentMoE · arXiv:2601.18089
          </text>
        </g>
      )}
    </>
  );
}

export function LatentmoeBottleneck() {
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
