// arXiv:2601.18089 — "LatentMoE" — Chapter 5: the honest ledger and close.
// What it gives up (reported): up to 6% per-GPU throughput reduction at high
// concurrency on H100 today; a standard MoE scaled to 1.35T params comes
// within ~9% of it (the win is real but bounded); shared experts and routing
// stay at full width (compression scope is partial); ablations reused
// baseline hyperparameters — tuning could shift numbers. Close: the paper's
// two axes — accuracy per FLOP and per parameter — are the serving-economics
// lens this shelf's earlier MoE-serving book arrived at from the systems
// side; here the architecture itself moves to meet it.
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

const CAVEATS = [
  { head: 'throughput dip', body: 'up to 6% per-GPU loss at high concurrency on today’s kernels', c: colors.WARM },
  { head: 'bounded win', body: 'a native MoE scaled to 1.35T params comes within ~9%', c: colors.WARM },
  { head: 'partial scope', body: 'shared experts and the router still run at full width d', c: colors.MUTED },
  { head: 'untuned', body: 'ablations reused baseline hyperparameters throughout', c: colors.MUTED },
];

const JOURNEY = [
  'ch1 · two serving regimes, one culprit: width',
  'ch2 · project down, run 4x more small experts, project up',
  'ch3 · the budget is units and routing choices, not width',
  'ch4 · wins every row at matched cost; 350B headroom at 1T',
];

const CAM_CAVEATS: CameraState = { x: 420, y: 330, k: 1.25 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  cavU: ChannelRef<number>;
  journeyU: ChannelRef<number>;
  axesU: ChannelRef<number>;
  bridgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const cavU = tl.channel('cavU', 0);
  const journeyU = tl.channel('journeyU', 0);
  const axesU = tl.channel('axesU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the costs
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Every architecture paper owes you its costs, and this one pays. On current kernels the latent design gives back up to six percent of per device throughput at high concurrency — the projections are extra work.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_CAVEATS, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(cavU, 0.5, { at: 1.6, dur: 2.2, ease: ease.linear });
  tl.caption({
    at: 6.7,
    dur: 5.8,
    text: 'And the win is bounded: brute forcing a standard mixture up to one point three five trillion parameters lands within about nine percent of it. The latent trick buys real headroom — not a different universe.',
  });
  tl.hold(12.5, 0.7);

  // Beat 2 — the remaining caveats
  tl.caption({
    at: 13.2,
    dur: 5.6,
    text: 'Two more honest lines: the shared experts and the router itself still run at full width, so the compression is partial. And every ablation reused the baselines hyperparameters — nobody has tuned this thing to its own shape yet.',
  });
  tl.tween(cavU, 1, { at: 14.2, dur: 2.0, ease: ease.linear });
  tl.hold(18.8, 0.7);

  // Beat 3 — recap
  tl.caption({
    at: 19.5,
    dur: 6.0,
    text: 'Retrace the book. Two serving regimes with one culprit: the hidden width. A funnel that runs four times as many experts in a quarter of the space. The proof that expressiveness lives in units and choices. And the receipts, at three scales.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 19.7, dur: 1.4, ease: ease.move });
  tl.tween(journeyU, 1, { at: 20.6, dur: 3.2, ease: ease.linear });
  tl.hold(25.5, 0.7);

  // Beat 4 — the two axes, and the shelf bridge
  tl.caption({
    at: 26.2,
    dur: 5.8,
    text: 'The deeper move is the scoreboard change. Not accuracy at any price — accuracy per unit of compute, and per parameter held in memory. Those are the axes a serving fleet actually bills you on.',
  });
  tl.tween(axesU, 1, { at: 27.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 32.4,
    dur: 5.4,
    text: 'Earlier on this shelf, the serving side reached the same conclusion from below: the memory wall and the network decide what a mixture costs. This paper answers from above — it moves the architecture to where the hardware already was.',
  });
  tl.tween(bridgeU, 1, { at: 33.6, dur: 0.9, ease: ease.enter });
  tl.hold(37.8, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 38.5,
    dur: 5.0,
    text: 'So the latent mixture earns its place the way everything on this shelf must: measured wins, named costs, and a scoreboard denominated in what you actually pay.',
  });
  tl.tween(dimU, 1, { at: 38.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 39.7, dur: 1.0, ease: ease.enter });
  tl.hold(43.5, 1.4);

  return { tl, cam, titleU, cavU, journeyU, axesU, bridgeU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/latentmoe-tradeoffs/overrides.json',
  slug: 'latentmoe-tradeoffs',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const cavU = s.get(scene.cavU);
  const journeyU = s.get(scene.journeyU);
  const axesU = s.get(scene.axesU);
  const bridgeU = s.get(scene.bridgeU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* caveat cards */}
          {CAVEATS.map((c, i) => {
            const u = clamp01(cavU * CAVEATS.length - i);
            if (u <= 0) return null;
            const y = 150 + i * 108;
            return (
              <g key={c.head} opacity={u * (1 - 0.8 * journeyU)}>
                <rect x={140} y={y} width={560} height={88} rx={12} fill={colors.PANEL} stroke={c.c} />
                <text x={164} y={y + 32} fill={c.c} fontSize={15} fontWeight={600}>
                  {c.head}
                </text>
                <text x={164} y={y + 62} fill={colors.TEXT} fontSize={13}>
                  {c.body}
                </text>
              </g>
            );
          })}
          {cavU > 0.2 && (
            <text x={140} y={132} fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={cavU * (1 - 0.8 * journeyU)}>
              reported limitations — the paper's own list
            </text>
          )}

          {/* recap */}
          {journeyU > 0 && (
            <g opacity={journeyU}>
              {JOURNEY.map((line, i) => {
                const u = clamp01(journeyU * JOURNEY.length - i);
                if (u <= 0) return null;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={300} cy={170 + i * 56} r={5} fill={colors.SECONDARY} />
                    {i < JOURNEY.length - 1 && (
                      <line x1={300} y1={176 + i * 56} x2={300} y2={220 + i * 56} stroke={colors.GRID} strokeWidth={1.5} />
                    )}
                    <text x={322} y={176 + i * 56} fill={colors.TEXT} fontSize={16}>
                      {line}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* the two axes chip */}
          {axesU > 0 && (
            <g opacity={axesU}>
              <rect x={320} y={430} width={640} height={52} rx={12} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={640} y={462} textAnchor="middle" fill={colors.WARM} fontSize={16} fontWeight={600} fontFamily={MONO}>
                the scoreboard: accuracy / FLOP · accuracy / parameter
              </text>
            </g>
          )}

          {/* bridge chip */}
          {bridgeU > 0 && (
            <g opacity={bridgeU}>
              <rect x={320} y={498} width={640} height={64} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={640} y={525} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontWeight={600}>
                the serving book met the memory wall from below —
              </text>
              <text x={640} y={548} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                this paper moves the architecture down to meet the hardware
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The honest ledger
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2601.18089 · limitations
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={225} width={860} height={200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Measured wins, named costs
          </text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            shrink what moves, multiply what chooses, stop at the ablation's
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            edge — and bill accuracy in FLOPs and parameters, like the fleet does
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            LatentMoE · arXiv:2601.18089
          </text>
        </g>
      )}
    </>
  );
}

export function LatentmoeTradeoffs() {
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
