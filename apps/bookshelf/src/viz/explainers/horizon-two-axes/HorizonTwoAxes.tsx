// arXiv:2606.30616 — "Scaling the Horizon, Not the Parameters: Reaching
// Trillion-Parameter Performance with a 35B Agent" (Agents-A1, June 2026).
// Chapter 1: the two competing scaling axes, and the reported scoreboard.
// Agents-A1 is a 35B Mixture-of-Experts agent; the paper compares it against
// trillion-class baselines (Kimi-K2.6, DeepSeek-V4-Pro, GPT-5.5). Reported
// numbers (replotted, not re-run): leads on SEAL-0 56.4, IFBench 80.6,
// HiPhO 46.4, FrontierScience-Olympiad 79.0, MolBench-Bind 56.8; trails on
// SciCode 44.3, HLE 47.6, BrowseComp 75.5.
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

// ---------------------------------------------------------------------------
// Reported benchmark table (paper's main comparison), replotted
// ---------------------------------------------------------------------------

const BENCH = [
  { name: 'SEAL-0', a1: 56.4, best: 55.0, bestOf: 'DeepSeek-V4-Pro', wins: true },
  { name: 'IFBench', a1: 80.6, best: 75.9, bestOf: 'GPT-5.5', wins: true },
  { name: 'HiPhO', a1: 46.4, best: 43.3, bestOf: 'GPT-5.5', wins: true },
  { name: 'FrontierSci-Oly', a1: 79.0, best: 78.0, bestOf: 'GPT-5.5', wins: true },
  { name: 'MolBench-Bind', a1: 56.8, best: 62.2, bestOf: 'GPT-5.5', wins: false },
  { name: 'SciCode', a1: 44.3, best: 56.1, bestOf: 'GPT-5.5', wins: false },
  { name: 'HLE (tools)', a1: 47.6, best: 54.0, bestOf: 'Kimi-K2.6', wins: false },
  { name: 'BrowseComp', a1: 75.5, best: 84.4, bestOf: 'GPT-5.5', wins: false },
];

// axes chart (left) — the two scaling directions
const AX_X = 140;
const AX_Y = 470;
const AX_W = 420;
const AX_H = 320;

// scoreboard (right)
const SB_X = 660;
const SB_Y = 140;
const SB_ROW_H = 52;
const SB_BAR_MAX = 260;

const CAM_AXES: CameraState = { x: AX_X + AX_W / 2, y: AX_Y - AX_H / 2, k: 1.3 };
const CAM_BOARD: CameraState = { x: SB_X + 250, y: 340, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  axesU: ChannelRef<number>;
  paramU: ChannelRef<number>; // the "bigger model" arrow
  horizU: ChannelRef<number>; // the "longer horizon" arrow
  dotU: ChannelRef<number>; // Agents-A1 dot
  boardU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  winsU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const axesU = tl.channel('axesU', 0);
  const paramU = tl.channel('paramU', 0);
  const horizU = tl.channel('horizU', 0);
  const dotU = tl.channel('dotU', 0);
  const boardU = tl.channel('boardU', 0);
  const fillU = tl.channel('fillU', 0);
  const winsU = tl.channel('winsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the orthodoxy
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'For years the story of capable agents has had one axis: parameters. Want a smarter agent, buy a bigger model. A trillion weights beats thirty five billion — obviously.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_AXES, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(axesU, 1, { at: 1.4, dur: 1.4, ease: ease.draw });
  tl.tween(paramU, 1, { at: 3.2, dur: 1.2, ease: ease.move });
  tl.hold(5.9, 0.7);

  // Beat 2 — the second axis
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'This paper argues there is a second axis, mostly unspent: the horizon. How long a model can act — gathering knowledge, taking actions, reading observations, checking its work — before it commits to an answer.',
  });
  tl.tween(horizU, 1, { at: 7.6, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 12.9,
    dur: 5.2,
    text: 'Their bet is a thirty five billion parameter mixture of experts model, pushed hard along the horizon axis instead of the parameter axis. Average working trajectory: forty five thousand tokens.',
  });
  tl.tween(dotU, 1, { at: 14.2, dur: 0.9, ease: ease.pop });
  tl.hold(18.1, 0.7);

  // Beat 3 — the scoreboard (camera home before the right-side reveal)
  tl.caption({
    at: 18.8,
    dur: 5.6,
    text: 'Here is the reported scoreboard against trillion class models — the strongest baseline shown for each benchmark. These are the papers numbers, replotted, not rerun.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 19.0, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAM_BOARD, { at: 20.5, dur: 1.2, ease: ease.move });
  tl.tween(boardU, 1, { at: 20.0, dur: 2.8, ease: ease.linear });
  tl.tween(fillU, 1, { at: 22.6, dur: 1.8, ease: ease.move });
  tl.hold(24.9, 0.6);

  // Beat 4 — reading it honestly
  tl.caption({
    at: 25.5,
    dur: 6.0,
    text: 'On five of eight, the small agent wins: search, instruction following, physics olympiad, frontier science, molecular binding. On raw code synthesis, broad exams, and web browsing, the giants still hold the lead.',
  });
  tl.tween(winsU, 1, { at: 26.6, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 31.9,
    dur: 4.8,
    text: 'So the claim is not that size stopped mattering. It is narrower and more interesting: on long agentic tasks, horizon can buy what parameters were buying.',
  });
  tl.hold(36.7, 0.7);

  // Beat 5 — plan of the book
  tl.caption({
    at: 37.4,
    dur: 5.6,
    text: 'The rest of this book opens the machine. How the harness grows trees of executable attempts. How six specialist teachers get distilled into one small student. And exactly where the trick runs out.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 37.6, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 38.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 39.0, dur: 1.0, ease: ease.enter });
  tl.hold(43.0, 1.2);

  return {
    tl, cam, titleU, axesU, paramU, horizU, dotU,
    boardU, fillU, winsU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/horizon-two-axes/overrides.json',
  slug: 'horizon-two-axes',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const axesU = s.get(scene.axesU);
  const paramU = s.get(scene.paramU);
  const horizU = s.get(scene.horizU);
  const dotU = s.get(scene.dotU);
  const boardU = s.get(scene.boardU);
  const fillU = s.get(scene.fillU);
  const winsU = s.get(scene.winsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the two axes */}
          {axesU > 0 && (
            <g opacity={axesU}>
              <line x1={AX_X} y1={AX_Y} x2={AX_X} y2={AX_Y - AX_H * axesU} stroke={colors.GRID} strokeWidth={2} />
              <line x1={AX_X} y1={AX_Y} x2={AX_X + AX_W * axesU} y2={AX_Y} stroke={colors.GRID} strokeWidth={2} />
              <text x={AX_X - 14} y={AX_Y - AX_H - 14} fill={colors.MUTED} fontSize={13}>
                parameters
              </text>
              <text x={AX_X + AX_W + 6} y={AX_Y + 20} fill={colors.MUTED} fontSize={13}>
                horizon (tokens of acting)
              </text>
              {/* param axis arrow: the orthodoxy */}
              {paramU > 0 && (
                <g opacity={paramU}>
                  <line x1={AX_X + 40} y1={AX_Y - 30} x2={AX_X + 40} y2={AX_Y - 30 - 240 * paramU} stroke={colors.NEGATIVE} strokeWidth={3} />
                  <path d={`M${AX_X + 40},${AX_Y - 30 - 240 * paramU - 10} l-7,14 l14,0 z`} fill={colors.NEGATIVE} />
                  <text x={AX_X + 56} y={AX_Y - 250} fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                    ~1T weights
                  </text>
                  <text x={AX_X + 56} y={AX_Y - 60} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    35B
                  </text>
                </g>
              )}
              {/* horizon axis arrow: the paper's bet */}
              {horizU > 0 && (
                <g opacity={horizU}>
                  <line x1={AX_X + 70} y1={AX_Y - 40} x2={AX_X + 70 + 320 * horizU} y2={AX_Y - 40} stroke={colors.ACCENT} strokeWidth={3} />
                  <path d={`M${AX_X + 70 + 320 * horizU + 10},${AX_Y - 40} l-14,-7 l0,14 z`} fill={colors.ACCENT} />
                  <text x={AX_X + 190} y={AX_Y - 52} fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
                    45K-token trajectories
                  </text>
                </g>
              )}
              {dotU > 0 && (
                <g opacity={dotU}>
                  <circle cx={AX_X + 390} cy={AX_Y - 40} r={11} fill={colors.ACCENT} />
                  <text x={AX_X + 390} y={AX_Y - 62} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={600}>
                    Agents-A1 · 35B MoE
                  </text>
                </g>
              )}
            </g>
          )}

          {/* scoreboard */}
          {boardU > 0 && (
            <g>
              <text x={SB_X} y={SB_Y - 34} fill={colors.TEXT} fontSize={16} opacity={boardU}>
                35B agent vs strongest trillion-class baseline
              </text>
              <text x={SB_X} y={SB_Y - 14} fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={boardU}>
                reported — replotted, not re-run
              </text>
              {BENCH.map((b, i) => {
                const u = clamp01(boardU * BENCH.length - i);
                if (u <= 0) return null;
                const y = SB_Y + i * SB_ROW_H;
                const wa = (b.a1 / 90) * SB_BAR_MAX * fillU;
                const wb = (b.best / 90) * SB_BAR_MAX * fillU;
                const winHl = winsU * (b.wins ? 1 : 0.25);
                return (
                  <g key={b.name} opacity={u}>
                    <text x={SB_X + 130} y={y + 12} textAnchor="end" fill={colors.TEXT} fontSize={13}>
                      {b.name}
                    </text>
                    <rect x={SB_X + 145} y={y} width={Math.max(wa, 2)} height={14} rx={3}
                      fill={colors.ACCENT} opacity={0.5 + 0.45 * winHl} />
                    <rect x={SB_X + 145} y={y + 18} width={Math.max(wb, 2)} height={14} rx={3}
                      fill={colors.MUTED} opacity={0.45} />
                    <text x={SB_X + 152 + wa} y={y + 12} fill={colors.ACCENT} fontSize={11} fontFamily={MONO} opacity={fillU}>
                      {b.a1.toFixed(1)}
                    </text>
                    <text x={SB_X + 152 + wb} y={y + 30} fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={fillU}>
                      {b.best.toFixed(1)} · {b.bestOf}
                    </text>
                    {winsU > 0.4 && b.wins && (
                      <text x={SB_X + 118} y={y + 30} textAnchor="end" fill={colors.POSITIVE} fontSize={11} opacity={winsU}>
                        wins
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Scaling the horizon, not the parameters
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2606.30616
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            A second axis: how long you act, not how big you are
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            wins 5 of 8 reported benchmarks against trillion-class models —
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            and honestly trails on the other three
          </text>
          <text x={640} y={400} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            Scaling the Horizon · arXiv:2606.30616
          </text>
        </g>
      )}
    </>
  );
}

export function HorizonTwoAxes() {
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
