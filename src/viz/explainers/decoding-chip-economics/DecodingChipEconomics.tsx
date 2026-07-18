// Fresh from arXiv №3, chapter 5 — the economics.
// Paper: arXiv:2607.13068 "The Economics of AI Decoding Chips: Rebalancing
// Compute, Capacity, and Bandwidth for Efficient LLM Inference" (Yuan &
// Long). The argument: every mainstream GPU is compute-heavy and
// capacity-light, while decoding needs little compute and a lot of memory.
// Two metrics formalize it — F/B (the roofline ridge: can the compute even
// be fed) and F/S (how much compute you are forced to BUY per gigabyte of
// memory). The paper's rebalanced accelerator (28nm, PCIe, commodity DDR5,
// no HBM/CoWoS): an eight-chip card holds a 671B model for ~$19k; a 4U
// server serves 2 users at a deterministic 20.3 tok/s for ~$28k; sixteen
// users across eight 4U servers cost ~$224k — about two-thirds of ONE
// traditional eight-GPU node (≥$350k). All figures replotted from the paper;
// the cost-per-user division below is our own arithmetic on their numbers.
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
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The paper's numbers + our division (module scope).
// ---------------------------------------------------------------------------

const CARD_USD = 19_000; // eight-chip card, holds 671B
const SERVER_USD = 28_000; // 4U, 2 users @ 20.3 tok/s each
const SERVER_USERS = 2;
const TOKS = 20.3;
const FLEET_USD = 224_000; // eight 4U servers
const FLEET_USERS = 16;
const GPU_NODE_USD = 350_000; // traditional eight-GPU node, minimum

const PER_USER_REBAL = FLEET_USD / FLEET_USERS; // $14k / user
const FLEET_VS_NODE = Math.round((FLEET_USD / GPU_NODE_USD) * 100); // 64%

// the two knob-triangles: relative provisioning (normalized, illustrative of
// the paper's F/B and F/S argument — GPU: compute-heavy; rebalanced: memory-heavy)
const GPU_MIX = { compute: 1.0, bandwidth: 0.75, capacity: 0.18 };
const REBAL_MIX = { compute: 0.12, bandwidth: 0.3, capacity: 1.0 };

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const MIX_Y = 200;
const MIX_H = 150;
const BAR_W = 54;

const COST_Y = 430;

const CAM_MIX: CameraState = { x: 500, y: 300, k: 1.2 };
const CAM_COST: CameraState = { x: 640, y: 440, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  mixU: ChannelRef<number>;
  morphU: ChannelRef<number>;
  metricU: ChannelRef<number>;
  costU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  perUserU: ChannelRef<number>;
  recapU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const mixU = tl.channel('mixU', 0);
  const morphU = tl.channel('morphU', 0);
  const metricU = tl.channel('metricU', 0);
  const costU = tl.channel('costU', 0);
  const fillU = tl.channel('fillU', 0);
  const perUserU = tl.channel('perUserU', 0);
  const recapU = tl.channel('recapU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the mismatch as a purchasing problem
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Chapter two showed decoding wasting ninety nine percent of a graphics card’s compute. The economics paper asks the obvious next question: then why are we paying for it?',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_MIX, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(mixU, 1, { at: 1.4, dur: 1.6, ease: ease.enter });
  tl.caption({
    at: 6.9,
    dur: 6.0,
    text: 'Its two metrics make the bundle visible. Operations per byte of bandwidth decides whether compute can even be fed. Operations per gigabyte of capacity is how much compute you are forced to buy just to get memory.',
  });
  tl.tween(metricU, 1, { at: 8.0, dur: 0.9, ease: ease.enter });
  tl.hold(12.9, 0.6);

  // Beat 2 — the rebalanced chip
  tl.caption({
    at: 13.5,
    dur: 6.2,
    text: 'So rebalance the recipe: far less compute, a deliberately slower and cheaper bus, and a mountain of commodity memory — no exotic packaging, no high bandwidth stacks, no leading edge silicon.',
  });
  tl.tween(morphU, 1, { at: 14.4, dur: 2.2, ease: ease.move });
  tl.caption({
    at: 20.0,
    dur: 5.4,
    text: 'The provisioning flips: the decode accelerator is mostly memory with a whisper of compute — which is exactly the shape of the workload it serves.',
  });
  tl.hold(25.4, 0.6);

  // Beat 3 — the price list
  tl.caption({
    at: 26.0,
    dur: 6.2,
    text: 'Now the price list, straight from the paper. One card of this design holds the entire six hundred seventy one billion parameter model for about nineteen thousand dollars. A server with two users streaming at twenty tokens per second: twenty eight thousand.',
  });
  tl.tween(cam, CAM_COST, { at: 26.3, dur: 1.4, ease: ease.move });
  tl.tween(costU, 1, { at: 27.2, dur: 1.0, ease: ease.enter });
  tl.tween(fillU, 1, { at: 28.4, dur: 2.6, ease: ease.move });
  tl.caption({
    at: 32.6,
    dur: 6.2,
    text: 'Sixteen users need about two hundred twenty four thousand dollars of this hardware — roughly two thirds the price of a single traditional eight card node, before that node serves anyone.',
  });
  tl.tween(perUserU, 1, { at: 34.6, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 39.2,
    dur: 5.2,
    text: 'Read the caveat too: these are the designers’ own projections for a proposed chip, at one deterministic speed, not a shipping benchmark. The argument is the shape of the curve, not the last digit.',
  });
  tl.hold(44.4, 0.6);

  // Beat 4 — recap of the triptych
  tl.caption({
    at: 45.0,
    dur: 6.2,
    text: 'Three papers, one budget. Waste fewer expert loads per guess. Put the experts where the queue will not form. And stop buying compute to get memory. Every one of them is fighting the same bill.',
  });
  tl.tween(recapU, 1, { at: 46.0, dur: 2.0, ease: ease.enter });
  tl.caption({
    at: 51.6,
    dur: 5.6,
    text: 'That bill decides who can afford to serve these models at all — and the cheaper each token gets, the more hands the giants end up in.',
  });
  tl.tween(closeU, 1, { at: 52.4, dur: 1.1, ease: ease.enter });
  tl.hold(57.4, 1.4);

  return { tl, cam, titleU, mixU, morphU, metricU, costU, fillU, perUserU, recapU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/decoding-chip-economics/overrides.json',
  slug: 'decoding-chip-economics',
};

const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function MixBars({ x, morph, u }: { x: number; morph: number; u: number }) {
  if (u <= 0) return null;
  const mix = {
    compute: lerp(GPU_MIX.compute, REBAL_MIX.compute, morph),
    bandwidth: lerp(GPU_MIX.bandwidth, REBAL_MIX.bandwidth, morph),
    capacity: lerp(GPU_MIX.capacity, REBAL_MIX.capacity, morph),
  };
  const entries = [
    { k: 'compute', v: mix.compute, c: colors.NEGATIVE },
    { k: 'bandwidth', v: mix.bandwidth, c: colors.ACCENT },
    { k: 'capacity', v: mix.capacity, c: colors.POSITIVE },
  ];
  return (
    <g opacity={u}>
      <text x={x} y={MIX_Y - 30} fill={colors.TEXT} fontSize={16}>
        {morph < 0.5 ? 'what a GPU bundles' : 'the rebalanced decode chip'}
      </text>
      {entries.map((e, i) => (
        <g key={e.k}>
          <rect
            x={x + i * (BAR_W + 46)}
            y={MIX_Y + MIX_H * (1 - e.v)}
            width={BAR_W}
            height={MIX_H * e.v}
            rx={6}
            fill={e.c}
            opacity={0.85}
          />
          <text x={x + i * (BAR_W + 46) + BAR_W / 2} y={MIX_Y + MIX_H + 22} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
            {e.k}
          </text>
        </g>
      ))}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const mixU = s.get(scene.mixU);
  const morphU = s.get(scene.morphU);
  const metricU = s.get(scene.metricU);
  const costU = s.get(scene.costU);
  const fillU = s.get(scene.fillU);
  const perUserU = s.get(scene.perUserU);
  const recapU = s.get(scene.recapU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;

  const costRows = [
    { label: 'one card · holds all 671B', usd: CARD_USD, c: colors.POSITIVE },
    { label: `4U server · ${SERVER_USERS} users @ ${TOKS} tok/s`, usd: SERVER_USD, c: colors.POSITIVE },
    { label: `${FLEET_USERS} users · eight 4U servers`, usd: FLEET_USD, c: colors.ACCENT },
    { label: 'one traditional 8-GPU node (min)', usd: GPU_NODE_USD, c: colors.NEGATIVE },
  ];
  const maxUsd = GPU_NODE_USD;

  const recapRows = [
    { text: 'fewer expert loads per guess — cost-aware drafting, up to 1.62×', c: colors.WARM },
    { text: 'experts placed before the queue forms — 11–55% latency cut', c: colors.ACCENT },
    { text: 'memory bought without the compute tax — 2/3 node price for 16 users', c: colors.POSITIVE },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <MixBars x={230} morph={morphU} u={mixU} />

          {metricU > 0 && (
            <g opacity={metricU}>
              <MathLabel tex="F/B:\ \mathrm{can\ compute\ be\ fed?}" x={700} y={MIX_Y + 20} anchor="start" fontSize={18} color={colors.ACCENT} opacity={metricU} />
              <MathLabel tex="F/S:\ \mathrm{compute\ bought\ per\ GB}" x={700} y={MIX_Y + 64} anchor="start" fontSize={18} color={colors.POSITIVE} opacity={metricU} />
              <text x={700} y={MIX_Y + 104} fill={colors.MUTED} fontSize={13}>
                decoding wants both small; a GPU sells both large
              </text>
            </g>
          )}

          {/* the price list */}
          {costU > 0 && (
            <g opacity={costU}>
              <text x={170} y={COST_Y - 16} fill={colors.TEXT} fontSize={16}>
                the paper’s price list (projected by its authors)
              </text>
              {costRows.map((r, i) => {
                const w = (r.usd / maxUsd) * 560 * fillU;
                return (
                  <g key={r.label}>
                    <text x={170} y={COST_Y + 18 + i * 44} fill={colors.MUTED} fontSize={13}>
                      {r.label}
                    </text>
                    <rect x={560} y={COST_Y + 6 + i * 44} width={w} height={16} rx={4} fill={r.c} opacity={0.85} />
                    <text x={566 + w} y={COST_Y + 19 + i * 44} fill={r.c} fontSize={13} fontFamily="monospace" opacity={fillU}>
                      ${Math.round(r.usd / 1000)}k
                    </text>
                  </g>
                );
              })}
              {perUserU > 0 && (
                <text x={170} y={COST_Y + 18 + 4 * 44} fill={colors.WARM} fontSize={14} fontFamily="monospace" opacity={perUserU}>
                  ${Math.round(PER_USER_REBAL / 1000)}k per user · fleet = {FLEET_VS_NODE}% of one GPU node
                </text>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The economics of decoding
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.13068 · F/B · F/S
        </text>
      </g>

      {/* recap overlay rides above the dimmed stage, below the close panel */}
      {recapU > 0 && closeU < 0.99 && (
        <g opacity={recapU * (1 - closeU)}>
          {recapRows.map((r, i) => {
            const u = clamp01(recapU * recapRows.length - i);
            if (u <= 0) return null;
            return (
              <g key={i} opacity={u}>
                <circle cx={90} cy={150 + i * 34} r={5} fill={r.c} />
                <text x={110} y={155 + i * 34} fill={colors.TEXT} fontSize={14}>
                  {r.text}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={230} width={880} height={200} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            The binding constraint is the bill.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Compute, capacity, bandwidth — serve the mixture by paying
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            only for the one your tokens actually consume.
          </text>
          <text x={640} y={402} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            arXiv:2607.12696 · 2607.08782 · 2607.13068
          </text>
        </g>
      )}
    </>
  );
}

export function DecodingChipEconomics() {
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
