// Fresh from arXiv №3, chapter 4 — placing the experts.
// Paper: arXiv:2607.08782 "Director: Accelerating Distributed MoE Serving
// via Online Proactive Expert Placement" (INFOCOM 2026). Director predicts
// which experts incoming requests will activate (a lightweight cascaded
// predictor or a low-bit replica), migrates experts with near-zero downtime
// during compute-bound phases, and re-optimizes placement online with a
// relaxation-based (1+eps) approximation. The cluster below is a real toy:
// 8 experts with a skewed request mix on 4 servers, each an M/M/1 queue
// (service rate 12 req/s), waits computed as W = 1/(mu - lambda). The naive
// placement co-locates the two hottest experts and pays 0.545 s mean wait;
// the optimized placement pairs hot with cold and pays 0.187 s. The paper
// reports 11-55% end-to-end latency reduction on real MoE deployments
// (Mistral, DeepSeek, Qwen) — replotted, not re-run.
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
// The queueing arithmetic (module scope).
// ---------------------------------------------------------------------------

const MU = 12; // req/s each server can serve
// skewed expert popularity, total 18 req/s
const RATES = [7.2, 3.6, 1.8, 1.8, 0.9, 0.9, 0.9, 0.9];
const TOTAL = RATES.reduce((a, b) => a + b, 0); // 18

// placements: server -> expert indices (2 experts per server)
const NAIVE: number[][] = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
];
const OPT: number[][] = [
  [0, 7],
  [1, 2],
  [3, 4],
  [5, 6],
];

const serverLoad = (placement: number[][]): number[] =>
  placement.map((exps) => exps.reduce((a, e) => a + RATES[e], 0));
/** M/M/1 mean wait, W = 1 / (mu - lambda); Infinity when overloaded. */
const wait = (lambda: number): number => (lambda >= MU ? Infinity : 1 / (MU - lambda));
/** traffic-weighted mean wait across servers */
const meanWait = (placement: number[][]): number => {
  const loads = serverLoad(placement);
  return loads.reduce((a, l) => a + l * wait(l), 0) / TOTAL;
};

const LOAD_NAIVE = serverLoad(NAIVE); // [10.8, 3.6, 1.8, 1.8]
const LOAD_OPT = serverLoad(OPT); // [8.1, 5.4, 3.6, 0.9]... computed
const W_NAIVE = meanWait(NAIVE); // 0.545 s
const W_OPT = meanWait(OPT); // 0.187 s
const REDUCTION = Math.round((1 - W_OPT / W_NAIVE) * 100);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const SRV_X = (i: number): number => 170 + i * 250;
const SRV_Y = 220;
const SRV_W = 200;
const SRV_H = 130;

const CAM_CLUSTER: CameraState = { x: 640, y: 300, k: 1.12 };
const CAM_S1: CameraState = { x: 290, y: 280, k: 1.6 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  clusterU: ChannelRef<number>;
  flowU: ChannelRef<number>;
  hotU: ChannelRef<number>;
  waitU: ChannelRef<number>;
  predU: ChannelRef<number>;
  migU: ChannelRef<number>;
  afterU: ChannelRef<number>;
  paperU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const clusterU = tl.channel('clusterU', 0);
  const flowU = tl.channel('flowU', 0);
  const hotU = tl.channel('hotU', 0);
  const waitU = tl.channel('waitU', 0);
  const predU = tl.channel('predU', 0);
  const migU = tl.channel('migU', 0);
  const afterU = tl.channel('afterU', 0);
  const paperU = tl.channel('paperU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the cluster
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'When the model outgrows one machine, the experts scatter across a cluster — here, eight experts on four servers, two apiece. Requests arrive and queue at whichever server owns their expert.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_CLUSTER, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(clusterU, 1, { at: 1.2, dur: 1.8, ease: ease.enter });
  tl.tween(flowU, 1, { at: 3.2, dur: 2.2, ease: ease.linear });
  tl.hold(6.1, 0.5);

  // Beat 2 — the hot spot
  tl.caption({
    at: 6.6,
    dur: 6.2,
    text: 'Routing is skewed — remember chapter one. Expert one alone draws seven point two requests per second, and it shares a server with the second hottest. That server carries ten point eight against a capacity of twelve.',
  });
  tl.tween(cam, CAM_S1, { at: 7.0, dur: 1.4, ease: ease.move });
  tl.tween(hotU, 1, { at: 8.0, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 13.0,
    dur: 6.0,
    text: 'Queueing arithmetic is merciless near capacity: the wait is one over capacity minus load. That server waits over eight tenths of a second while its neighbors sit at a tenth. The cluster average: over half a second.',
  });
  tl.tween(waitU, 1, { at: 14.2, dur: 1.2, ease: ease.enter });
  tl.hold(19.0, 0.6);

  // Beat 3 — Director's move
  tl.caption({
    at: 19.6,
    dur: 6.2,
    text: 'The director system refuses to wait for the damage. A lightweight predictor forecasts which experts the incoming requests will call, an optimizer recomputes the placement, and migrations run during compute bound phases, when the network is free.',
  });
  tl.tween(cam, CAM_CLUSTER, { at: 19.9, dur: 1.4, ease: ease.move });
  tl.tween(predU, 1, { at: 21.0, dur: 1.0, ease: ease.enter });
  tl.tween(migU, 1, { at: 23.4, dur: 2.0, ease: ease.move });
  tl.caption({
    at: 26.4,
    dur: 5.6,
    text: 'The move itself is unglamorous: pair the hottest expert with the coldest, and spread the middle. Watch the same eighteen requests per second land on the new layout.',
  });
  tl.tween(afterU, 1, { at: 27.8, dur: 1.6, ease: ease.move });
  tl.hold(32.0, 0.6);

  // Beat 4 — the payoff, computed
  tl.caption({
    at: 32.6,
    dur: 6.0,
    text: 'Same servers, same traffic, same experts. Mean wait drops from zero point five four seconds to zero point one nine — a sixty six percent cut in our toy, purely from where the weights sit.',
  });
  tl.caption({
    at: 38.8,
    dur: 5.6,
    text: 'The real system reports eleven to fifty five percent lower end to end latency on production scale mixtures — smaller than our cartoon, because real clusters are already half smart. The direction is the same.',
  });
  tl.tween(paperU, 1, { at: 39.8, dur: 0.9, ease: ease.enter });
  tl.hold(44.4, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 45.0,
    dur: 5.4,
    text: 'So the second lever is geography: predict the routing, move the experts before the queue forms. The last lever is the strangest — change the silicon itself.',
  });
  tl.tween(closeU, 1, { at: 45.8, dur: 1.0, ease: ease.enter });
  tl.hold(50.4, 1.2);

  return { tl, cam, titleU, clusterU, flowU, hotU, waitU, predU, migU, afterU, paperU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/expert-placement/overrides.json',
  slug: 'expert-placement',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// expert chip home positions per placement
function chipPos(placement: number[][], e: number): { x: number; y: number } {
  for (let s = 0; s < placement.length; s++) {
    const k = placement[s].indexOf(e);
    if (k >= 0) return { x: SRV_X(s) + 18 + k * 92, y: SRV_Y + 58 };
  }
  return { x: 0, y: 0 };
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const clusterU = s.get(scene.clusterU);
  const flowU = s.get(scene.flowU);
  const hotU = s.get(scene.hotU);
  const waitU = s.get(scene.waitU);
  const predU = s.get(scene.predU);
  const migU = s.get(scene.migU);
  const afterU = s.get(scene.afterU);
  const paperU = s.get(scene.paperU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;
  const loads = LOAD_NAIVE.map((l, i) => lerp(l, LOAD_OPT[i], afterU));
  const waits = loads.map((l) => wait(l));
  const meanW = lerp(W_NAIVE, W_OPT, afterU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* servers */}
          {Array.from({ length: 4 }, (_, i) => {
            const u = clamp01(clusterU * 4 - i);
            if (u <= 0) return null;
            const overload = loads[i] > 9;
            return (
              <g key={i} opacity={u}>
                <rect
                  x={SRV_X(i)}
                  y={SRV_Y}
                  width={SRV_W}
                  height={SRV_H}
                  rx={12}
                  fill={colors.PANEL}
                  stroke={hotU > 0 && overload ? colors.NEGATIVE : colors.GRID}
                  strokeWidth={hotU > 0 && overload ? 2.5 : 1.5}
                />
                <text x={SRV_X(i) + 14} y={SRV_Y + 26} fill={colors.TEXT} fontSize={14}>
                  server {i + 1}
                </text>
                <text x={SRV_X(i) + SRV_W - 14} y={SRV_Y + 26} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                  μ = {MU}/s
                </text>
                {/* load bar */}
                <rect x={SRV_X(i) + 14} y={SRV_Y + 96} width={SRV_W - 28} height={10} rx={3} fill={colors.BG} stroke={colors.GRID} />
                <rect
                  x={SRV_X(i) + 14}
                  y={SRV_Y + 96}
                  width={(SRV_W - 28) * Math.min(1, loads[i] / MU) * flowU}
                  height={10}
                  rx={3}
                  fill={loads[i] > 9 ? colors.NEGATIVE : colors.POSITIVE}
                  opacity={0.85}
                />
                <text x={SRV_X(i) + 14} y={SRV_Y + 122} fill={colors.MUTED} fontSize={11} fontFamily="monospace" opacity={flowU}>
                  λ = {loads[i].toFixed(1)}/s
                </text>
                {waitU > 0 && (
                  <text x={SRV_X(i) + SRV_W - 14} y={SRV_Y + 122} textAnchor="end" fill={waits[i] > 0.3 ? colors.NEGATIVE : colors.POSITIVE} fontSize={11} fontFamily="monospace" opacity={waitU}>
                    wait {Number.isFinite(waits[i]) ? waits[i].toFixed(2) : '∞'} s
                  </text>
                )}
              </g>
            );
          })}

          {/* expert chips, migrating between placements */}
          {RATES.map((r, e) => {
            const from = chipPos(NAIVE, e);
            const to = chipPos(OPT, e);
            const x = lerp(from.x, to.x, afterU);
            const y = lerp(from.y, to.y, afterU) - (from.x !== to.x ? Math.sin(Math.PI * afterU) * 46 : 0);
            const hot = e === 0;
            return (
              <g key={e} opacity={clusterU}>
                <rect x={x} y={y - 16} width={84} height={26} rx={6} fill={hot && hotU > 0 ? colors.NEGATIVE : colors.ACCENT} opacity={0.28 + 0.5 * (r / RATES[0])} />
                <text x={x + 42} y={y + 2} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily="monospace">
                  e{e + 1} · {r}/s
                </text>
              </g>
            );
          })}

          {/* predictor chip */}
          {predU > 0 && (
            <g opacity={predU}>
              <rect x={510} y={120} width={260} height={34} rx={9} fill={colors.PANEL} stroke={colors.TEAL} />
              <text x={640} y={142} textAnchor="middle" fill={colors.TEAL} fontSize={13}>
                predictor → optimizer → migrate
              </text>
            </g>
          )}

          {/* mean wait readout */}
          {waitU > 0 && (
            <g opacity={waitU}>
              <text x={170} y={430} fill={colors.TEXT} fontSize={16}>
                traffic-weighted mean wait
              </text>
              <rect x={430} y={414} width={W_NAIVE * 600} height={20} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={430} y={414} width={meanW * 600} height={20} rx={5} fill={meanW > 0.3 ? colors.NEGATIVE : colors.POSITIVE} opacity={0.85} />
              <text x={438 + W_NAIVE * 600} y={429} fill={colors.TEXT} fontSize={14} fontFamily="monospace">
                {meanW.toFixed(3)} s
              </text>
              {afterU > 0.95 && (
                <text x={170} y={462} fill={colors.POSITIVE} fontSize={14} fontFamily="monospace">
                  {W_NAIVE.toFixed(3)} s → {W_OPT.toFixed(3)} s (−{REDUCTION}%) in this toy
                </text>
              )}
              {paperU > 0 && (
                <text x={170} y={490} fill={colors.MUTED} fontSize={13} fontFamily="monospace" opacity={paperU}>
                  Director, reported: 11–55% lower end-to-end latency (Mistral, DeepSeek, Qwen)
                </text>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Placing the experts
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.08782 · M/M/1 waits, computed
        </text>
      </g>
      <MathLabel
        tex="W = \frac{1}{\mu - \lambda}"
        x={1120}
        y={80}
        fontSize={22}
        color={colors.WARM}
        opacity={s.get(scene.waitU) * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Latency is geography.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Predict the routing, move the experts in the quiet phases,
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            and the same hardware answers in a third of the time.
          </text>
        </g>
      )}
    </>
  );
}

export function ExpertPlacement() {
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
