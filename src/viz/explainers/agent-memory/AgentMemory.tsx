// Explained: Agents — chapter 3: memory and context. Real arithmetic at
// module scope: a 128,000-token window, a 1,200-token system prompt, and an
// average ReAct step of 490 tokens (thought 60 + action 30 + observation
// 400). The window fills at step 258. Worse, each step re-reads the whole
// history, so the cumulative prompt bill is quadratic: 2,594,500 tokens
// processed by step 100. Retrieval-as-memory (store observations outside,
// fetch top three ≈ 2,490 tokens/step) keeps the bill linear: 258,000 by
// step 100 — 10.1× cheaper, and the window never fills. Bridge to the
// retrieval book. All numbers computed below.
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
import { ContextBar } from '../../agent';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The context arithmetic, module scope.
// ---------------------------------------------------------------------------

const WINDOW = 128_000;
const SYS = 1_200;
const THOUGHT = 60;
const ACTION = 30;
const OBS = 400;
const STEP_TOKENS = THOUGHT + ACTION + OBS; // 490
const FILL_STEP = Math.floor((WINDOW - SYS) / STEP_TOKENS); // 258

// cumulative prompt tokens processed after n steps (the model re-reads
// everything each step): sum_{i=1..n} (SYS + STEP_TOKENS * i)
const cumTranscript = (n: number) => SYS * n + (STEP_TOKENS * n * (n + 1)) / 2;
const CUM_100 = cumTranscript(100); // 2,594,500

// retrieval-as-memory: context per step is constant — system + this step's
// thinking + top-3 retrieved observations
const RETRIEVED = 3;
const RETR_CTX = SYS + THOUGHT + ACTION + RETRIEVED * OBS; // 2,490
const cumRetrieval = (n: number) => (RETR_CTX + THOUGHT + ACTION) * n; // 2,580/step
const CUM_RETR_100 = cumRetrieval(100); // 258,000
const RATIO = CUM_100 / CUM_RETR_100; // 10.06

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const PLOT_X = scaleLinear().domain([0, 100]).range([220, 700]);
const PLOT_Y = scaleLinear().domain([0, 2_700_000]).range([560, 260]);

const CAM_BAR: CameraState = { x: 640, y: 240, k: 1.2 };
const CAM_PLOT: CameraState = { x: 500, y: 420, k: 1.18 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  barU: ChannelRef<number>;
  stepN: ChannelRef<number>; // agent step count driving the bar fill
  warnU: ChannelRef<number>;
  plotU: ChannelRef<number>; // axes + quadratic curve
  quadSweep: ChannelRef<number>;
  linSweep: ChannelRef<number>; // retrieval curve
  retrBarU: ChannelRef<number>; // the flat retrieval context bar
  ratioU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const barU = tl.channel('barU', 0);
  const stepN = tl.channel('stepN', 0);
  const warnU = tl.channel('warnU', 0);
  const plotU = tl.channel('plotU', 0);
  const quadSweep = tl.channel('quadSweep', 0);
  const linSweep = tl.channel('linSweep', 0);
  const retrBarU = tl.channel('retrBarU', 0);
  const ratioU = tl.channel('ratioU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the window is the memory
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'An agent has exactly one working memory: the context window. Every thought, every action, every tool result lives there — or it does not exist for the model at all.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_BAR, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(barU, 1, { at: 1.6, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 6.7,
    dur: 5.6,
    text: 'Do the arithmetic for a long-running agent. A hundred twenty eight thousand token window. A twelve hundred token system prompt. And each loop step deposits about four hundred ninety tokens — mostly the tool observations.',
  });
  tl.tween(stepN, 60, { at: 7.6, dur: 4.4, ease: ease.linear });
  tl.hold(12.5, 0.5);

  // Beat 2 — it fills
  tl.caption({
    at: 13.0,
    dur: 5.4,
    text: 'At that rate the window is full at step two hundred fifty eight. Not a rare failure — an arithmetic certainty for any agent that works longer than an afternoon.',
  });
  tl.tween(stepN, 258, { at: 13.8, dur: 3.6, ease: ease.linear });
  tl.tween(warnU, 1, { at: 16.6, dur: 0.8, ease: ease.enter });
  tl.hold(18.6, 0.6);

  // Beat 3 — the quadratic bill
  tl.caption({
    at: 19.2,
    dur: 6.0,
    text: 'And the window is the gentle problem. The vicious one is cost: each step re-reads the entire history. Step ten re-reads nine steps; step a hundred re-reads ninety nine. The total bill grows with the square.',
  });
  tl.tween(cam, CAM_PLOT, { at: 19.5, dur: 1.5, ease: ease.move });
  tl.tween(plotU, 1, { at: 20.4, dur: 1.3, ease: ease.draw });
  tl.tween(quadSweep, 1, { at: 21.8, dur: 3.2, ease: ease.linear });
  tl.caption({
    at: 25.6,
    dur: 5.2,
    text: 'By step one hundred, this agent has pushed about two point six million prompt tokens through the model — to hold a transcript of fifty thousand. The past is being repurchased on every step.',
  });
  tl.hold(30.8, 0.6);

  // Beat 4 — retrieval as memory
  tl.caption({
    at: 31.4,
    dur: 6.0,
    text: 'The fix is the retrieval book, worn as a memory. Move old observations out of the window into a store, embed them, and each step fetches only the three most relevant — about twenty five hundred tokens of context, every step, forever.',
  });
  tl.tween(retrBarU, 1, { at: 32.6, dur: 1.2, ease: ease.enter });
  tl.tween(linSweep, 1, { at: 34.0, dur: 2.8, ease: ease.linear });
  tl.caption({
    at: 37.8,
    dur: 5.6,
    text: 'Same hundred steps, measured: two hundred fifty eight thousand cumulative tokens instead of two point six million. Ten times cheaper — and the window never fills, because the transcript stopped living in it.',
  });
  tl.tween(ratioU, 1, { at: 39.0, dur: 0.9, ease: ease.enter });
  tl.hold(43.4, 0.6);

  // Beat 5 — the trade, honestly
  tl.caption({
    at: 44.0,
    dur: 5.8,
    text: 'The trade is real: retrieval is a guess about relevance. Keep everything and you pay quadratically for perfect recall; retrieve and you pay linearly for a memory that can miss. Every production agent lives somewhere on that line.',
  });
  tl.hold(49.8, 0.6);

  // Beat 6 — close
  tl.caption({
    at: 50.4,
    dur: 5.4,
    text: 'Memory decides how long an agent can work. The next chapter is about something harsher — how often twenty good steps in a row actually happens.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 51.3, dur: 1.1, ease: ease.move });
  tl.tween(closeU, 1, { at: 52.3, dur: 0.9, ease: ease.enter });
  tl.hold(55.8, 1.2);

  return { tl, cam, titleU, barU, stepN, warnU, plotU, quadSweep, linSweep, retrBarU, ratioU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/agent-memory/overrides.json',
  slug: 'agent-memory',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const barU = s.get(scene.barU);
  const stepN = s.get(scene.stepN);
  const warnU = s.get(scene.warnU);
  const plotU = s.get(scene.plotU);
  const quadSweep = s.get(scene.quadSweep);
  const linSweep = s.get(scene.linSweep);
  const retrBarU = s.get(scene.retrBarU);
  const ratioU = s.get(scene.ratioU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const n = Math.floor(stepN);
  const transcriptTokens = Math.min(WINDOW - SYS, n * STEP_TOKENS);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the filling window */}
          {barU > 0 && (
            <g>
              <ContextBar
                x={220}
                y={150}
                w={840}
                capacity={WINDOW}
                reveal={barU}
                warn={warnU}
                title="the context window — 128,000 tokens"
                segments={[
                  { label: 'system', value: SYS, color: colors.SECONDARY },
                  { label: 'transcript', value: transcriptTokens, color: colors.ACCENT },
                ]}
              />
              <text x={220} y={222} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                step {n} · {STEP_TOKENS} tokens per step (thought {THOUGHT} + action {ACTION} + observation {OBS})
              </text>
              {warnU > 0 && (
                <text x={220} y={246} fill={colors.NEGATIVE} fontSize={14} fontFamily="monospace" fontWeight={700} opacity={warnU}>
                  full at step {FILL_STEP} — an arithmetic certainty
                </text>
              )}
            </g>
          )}

          {/* the retrieval bar */}
          {retrBarU > 0 && (
            <g opacity={retrBarU}>
              <ContextBar
                x={720}
                y={300}
                w={380}
                capacity={WINDOW}
                reveal={retrBarU}
                title="with retrieval — flat, forever"
                segments={[
                  { label: 'system', value: SYS, color: colors.SECONDARY },
                  { label: 'this step', value: THOUGHT + ACTION, color: colors.ACCENT },
                  { label: 'top-3 recalled', value: RETRIEVED * OBS, color: colors.POSITIVE },
                ]}
              />
              <text x={720} y={372} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
                {RETR_CTX.toLocaleString()} tokens per step, at step 10 or step 10,000
              </text>
            </g>
          )}

          {/* the cumulative-cost plot */}
          {plotU > 0 && (
            <g>
              <text x={PLOT_X(0)} y={236} fill={colors.TEXT} fontSize={15}>
                cumulative prompt tokens processed
              </text>
              <Axes x={PLOT_X} y={PLOT_Y} reveal={plotU} xTicks={5} yTicks={4} fontSize={10} xLabel="agent step" />
              <FunctionPlot
                x={PLOT_X}
                y={PLOT_Y}
                f={(x) => cumTranscript(Math.max(0, x))}
                domain={[0, 100]}
                reveal={quadSweep}
                color={colors.NEGATIVE}
                width={2.5}
              />
              {quadSweep >= 1 && (
                <text x={PLOT_X(64)} y={PLOT_Y(cumTranscript(70))} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">
                  keep everything: {(CUM_100 / 1e6).toFixed(2)}M by step 100
                </text>
              )}
              {linSweep > 0 && (
                <FunctionPlot
                  x={PLOT_X}
                  y={PLOT_Y}
                  f={(x) => cumRetrieval(Math.max(0, x))}
                  domain={[0, 100]}
                  reveal={linSweep}
                  color={colors.POSITIVE}
                  width={2.5}
                />
              )}
              {linSweep >= 1 && (
                <text x={PLOT_X(60)} y={PLOT_Y(cumRetrieval(60)) - 14} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
                  retrieve top-3: {(CUM_RETR_100 / 1e3).toFixed(0)}k by step 100
                </text>
              )}
              {ratioU > 0 && (
                <text x={PLOT_X(2)} y={610} fill={colors.WARM} fontSize={15} fontFamily="monospace" fontWeight={700} opacity={ratioU}>
                  {RATIO.toFixed(1)}× cheaper — and the window never fills
                </text>
              )}
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The past is repurchased every step
        </text>
      </g>
      <MathLabel
        tex="\text{cost}(n) = \sum_{i=1}^{n}(s + k\,i) \sim \tfrac{k}{2}n^2"
        x={880}
        y={54}
        fontSize={19}
        color={colors.SECONDARY}
        opacity={plotU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Memory is a budget, not a gift.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Full at step 258 · 2.6M tokens repurchased by step 100 —
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            or retrieval at 10× cheaper, paying with occasional misses.
          </text>
        </g>
      )}
    </>
  );
}

export function AgentMemory() {
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
