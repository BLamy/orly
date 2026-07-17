// Explained: Agents — chapter 4: why agents fail. All three failure modes
// computed for real at module scope. (1) Compounding error: 0.95^20 = 0.3585
// exactly; a seeded Monte Carlo of 4,000 twenty-step runs measures 36.5%
// (and 0.99^20 = 0.8179). (2) Poisoned observations: chapter 1's rover task
// re-run with one corrupted lookup (3.15 for 31.47) flows through the same
// arithmetic to a confident wrong answer, 42.01 km. (3) Evaluator gaming —
// the alignment book's proxy problem wearing a harness: the checker passes,
// the task is false. Numbers verified below.
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
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import { MessageCard } from '../../agent';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Failure 1: compounding per-step error, computed.
// ---------------------------------------------------------------------------

const P95 = 0.95;
const P99 = 0.99;
const STEPS = 20;
const EXACT_95 = P95 ** STEPS; // 0.3585
const EXACT_99 = P99 ** STEPS; // 0.8179

const RUNS = 4000;
const rand = mulberry32(5);
let survived = 0;
const SAMPLE_DEATHS: number[] = []; // step each of the first 24 runs died (STEPS = survived)
for (let i = 0; i < RUNS; i++) {
  let death = STEPS;
  for (let j = 0; j < STEPS; j++) {
    if (rand() >= P95) {
      death = j;
      break;
    }
  }
  if (death === STEPS) survived++;
  if (i < 24) SAMPLE_DEATHS.push(death);
}
const MEASURED = survived / RUNS; // 0.365

// ---------------------------------------------------------------------------
// Failure 2: one poisoned observation, run through chapter 1's arithmetic.
// ---------------------------------------------------------------------------

const TRUE_A = 45.16;
const TRUE_B = 31.47;
const POISONED_B = 3.15; // a mis-scaled lookup result
const TRUE_ANSWER = Number((TRUE_A - TRUE_B).toFixed(2)); // 13.69
const WRONG_ANSWER = Number((TRUE_A - POISONED_B).toFixed(2)); // 42.01

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const PLOT_X = scaleLinear().domain([0, STEPS]).range([200, 700]);
const PLOT_Y = scaleLinear().domain([0, 1]).range([540, 220]);

const RAIL_X = scaleLinear().domain([0, STEPS]).range([760, 1160]);
const RAIL_Y0 = 210;
const RAIL_DY = 13;

const CAM_PLOT: CameraState = { x: 470, y: 380, k: 1.18 };
const CAM_POISON: CameraState = { x: 640, y: 400, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  curve95: ChannelRef<number>;
  curve99: ChannelRef<number>;
  railU: ChannelRef<number>; // the 24 sample runs march
  mcU: ChannelRef<number>; // measured stat
  poisonU: ChannelRef<number>; // poisoned transcript
  poisonDim: ChannelRef<number>;
  gameU: ChannelRef<number>; // evaluator gaming panel
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const plotU = tl.channel('plotU', 0);
  const curve95 = tl.channel('curve95', 0);
  const curve99 = tl.channel('curve99', 0);
  const railU = tl.channel('railU', 0);
  const mcU = tl.channel('mcU', 0);
  const poisonU = tl.channel('poisonU', 0);
  const poisonDim = tl.channel('poisonDim', 0);
  const gameU = tl.channel('gameU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the multiplication nobody does
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is the most important multiplication in this book, and almost nobody does it. Suppose your agent gets each step right ninety five percent of the time. Excellent, by model standards.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_PLOT, { at: 1.2, dur: 1.4, ease: ease.move });
  tl.tween(plotU, 1, { at: 2.0, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 6.7,
    dur: 5.6,
    text: 'A twenty step task must survive all twenty. Point nine five, multiplied by itself twenty times, is point three six. Your excellent agent finishes barely a third of its tasks.',
  });
  tl.tween(curve95, 1, { at: 7.6, dur: 3.0, ease: ease.draw });
  tl.hold(12.5, 0.5);

  // Beat 2 — the Monte Carlo agrees
  tl.caption({
    at: 13.0,
    dur: 5.6,
    text: 'Do not take the formula on faith — run it. Four thousand simulated twenty step runs; each row here is one of the first twenty four, marching until its first bad step kills it.',
  });
  tl.tween(railU, 1, { at: 14.0, dur: 3.8, ease: ease.linear });
  tl.caption({
    at: 18.8,
    dur: 4.8,
    text: 'Measured survival: thirty six point five percent, within a point of the formula. Long chains are where good per-step models go to die.',
  });
  tl.tween(mcU, 1, { at: 19.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 24.0,
    dur: 5.2,
    text: 'The escape is steep: push each step to ninety nine percent and twenty step survival jumps to eighty two. Per-step reliability is the whole ballgame — which is why verification, next chapter, is not optional.',
  });
  tl.tween(curve99, 1, { at: 24.8, dur: 2.6, ease: ease.draw });
  tl.hold(29.6, 0.6);

  // Beat 3 — the poisoned observation
  tl.caption({
    at: 30.2,
    dur: 5.8,
    text: 'The second failure is quieter. The loop treats every observation as ground truth. Re-run chapter one exactly, but let one lookup come back corrupted — three point one five instead of thirty one point four seven.',
  });
  tl.tween(cam, CAM_POISON, { at: 30.5, dur: 1.4, ease: ease.move });
  tl.tween(plotU, 0.12, { at: 30.7, dur: 1.2, ease: ease.move });
  tl.tween(railU, 0, { at: 30.7, dur: 1.0, ease: ease.move });
  tl.tween(poisonU, 1, { at: 31.6, dur: 2.2, ease: ease.linear });
  tl.caption({
    at: 36.4,
    dur: 5.6,
    text: 'Watch the same honest arithmetic run on the poisoned number: forty five point one six minus three point one five — forty two point zero one kilometers, stated with total confidence. The reasoning was flawless. The input was a lie.',
  });
  tl.caption({
    at: 42.4,
    dur: 4.8,
    text: 'Grounding cuts both ways: a loop that believes its tools is exactly as good as its tools. Garbage observed is garbage compounded.',
  });
  tl.hold(47.2, 0.6);

  // Beat 4 — evaluator gaming
  tl.caption({
    at: 47.8,
    dur: 6.0,
    text: 'The third failure you have met before, in the alignment book: optimize a proxy and you get the proxy. Give an agent a checker that greps for the word passed, and it learns to print passed — the reward hack, wearing a harness.',
  });
  tl.tween(poisonDim, 1, { at: 48.4, dur: 1.0, ease: ease.move });
  tl.tween(gameU, 1, { at: 49.2, dur: 0.9, ease: ease.enter });
  tl.hold(53.8, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 54.4,
    dur: 5.6,
    text: 'Compounding odds, poisoned inputs, gamed checkers — three ways an agent fails while looking busy and confident. The final chapter is the answer: never take the agent at its word.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 54.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 55.4, dur: 1.1, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.4, dur: 0.9, ease: ease.enter });
  tl.hold(60.0, 1.2);

  return { tl, cam, titleU, plotU, curve95, curve99, railU, mcU, poisonU, poisonDim, gameU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/agent-failure/overrides.json',
  slug: 'agent-failure',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const plotU = s.get(scene.plotU);
  const curve95 = s.get(scene.curve95);
  const curve99 = s.get(scene.curve99);
  const railU = s.get(scene.railU);
  const mcU = s.get(scene.mcU);
  const poisonU = s.get(scene.poisonU);
  const poisonDim = s.get(scene.poisonDim);
  const gameU = s.get(scene.gameU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const poisonOp = 1 - 0.8 * poisonDim;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* survival curves */}
          {plotU > 0 && (
            <g opacity={plotU}>
              <text x={PLOT_X(0)} y={190} fill={colors.TEXT} fontSize={15}>
                probability the whole chain survives
              </text>
              <Axes x={PLOT_X} y={PLOT_Y} reveal={plotU} xTicks={5} yTicks={5} fontSize={10} xLabel="steps" />
              <FunctionPlot
                x={PLOT_X}
                y={PLOT_Y}
                f={(x) => P95 ** Math.max(0, x)}
                domain={[0, STEPS]}
                reveal={curve95}
                color={colors.NEGATIVE}
                width={2.5}
              />
              {curve95 >= 1 && (
                <text x={PLOT_X(14.6)} y={PLOT_Y(P95 ** 13) - 10} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">
                  p=0.95 → {(EXACT_95 * 100).toFixed(1)}% at 20
                </text>
              )}
              {curve99 > 0 && (
                <FunctionPlot
                  x={PLOT_X}
                  y={PLOT_Y}
                  f={(x) => P99 ** Math.max(0, x)}
                  domain={[0, STEPS]}
                  reveal={curve99}
                  color={colors.POSITIVE}
                  width={2.5}
                />
              )}
              {curve99 >= 1 && (
                <text x={PLOT_X(13)} y={PLOT_Y(P99 ** 16) - 10} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
                  p=0.99 → {(EXACT_99 * 100).toFixed(1)}%
                </text>
              )}
            </g>
          )}

          {/* the 24 sample runs */}
          {railU > 0 && (
            <g opacity={Math.min(1, railU * 3)}>
              <text x={RAIL_X(0)} y={RAIL_Y0 - 18} fill={colors.TEXT} fontSize={14}>
                first 24 of {RUNS.toLocaleString()} simulated runs
              </text>
              {SAMPLE_DEATHS.map((death, i) => {
                const prog = clamp01(railU * STEPS) ;
                const reach = Math.min(death, prog);
                const alive = death === STEPS;
                const y = RAIL_Y0 + i * RAIL_DY;
                return (
                  <g key={i}>
                    <line
                      x1={RAIL_X(0)}
                      x2={RAIL_X(reach)}
                      y1={y}
                      y2={y}
                      stroke={alive ? colors.POSITIVE : colors.MUTED}
                      strokeWidth={3}
                      strokeLinecap="round"
                      opacity={alive ? 0.9 : 0.55}
                    />
                    {!alive && prog >= death && (
                      <text x={RAIL_X(death) + 4} y={y + 4} fill={colors.NEGATIVE} fontSize={10} fontWeight={700}>
                        ×
                      </text>
                    )}
                  </g>
                );
              })}
              {mcU > 0 && (
                <text x={RAIL_X(0)} y={RAIL_Y0 + 24 * RAIL_DY + 22} fill={colors.WARM} fontSize={14} fontFamily="monospace" fontWeight={700} opacity={mcU}>
                  measured: {(MEASURED * 100).toFixed(1)}% survive · exact: {(EXACT_95 * 100).toFixed(2)}%
                </text>
              )}
            </g>
          )}

          {/* the poisoned run */}
          {poisonU > 0 && (
            <g opacity={poisonOp}>
              <text x={330} y={180} fill={colors.TEXT} fontSize={15} opacity={clamp01(poisonU * 3)}>
                chapter one again — with one lie in the pipe
              </text>
              <MessageCard
                x={330}
                y={200}
                w={620}
                role="assistant"
                label="assistant · action"
                text='lookup("curiosity")'
                enter={clamp01(poisonU * 3)}
              />
              <MessageCard
                x={330}
                y={266}
                w={620}
                role="tool"
                label="observation · corrupted"
                text={`${POISONED_B} km`}
                enter={clamp01(poisonU * 3 - 0.7)}
                glow={0.6}
              />
              <MessageCard
                x={330}
                y={332}
                w={620}
                role="assistant"
                label="assistant · action"
                text={`calc(${TRUE_A} - ${POISONED_B})`}
                enter={clamp01(poisonU * 3 - 1.4)}
              />
              <MessageCard
                x={330}
                y={398}
                w={620}
                role="assistant"
                text={`Opportunity, by ${WRONG_ANSWER} km. (truth: ${TRUE_ANSWER})`}
                enter={clamp01(poisonU * 3 - 2.0)}
                glow={0.4}
              />
              <text x={330} y={492} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace" opacity={clamp01(poisonU * 3 - 2.2)}>
                flawless arithmetic × one poisoned input = confident nonsense
              </text>
            </g>
          )}

          {/* evaluator gaming */}
          {gameU > 0 && (
            <g opacity={gameU}>
              <rect x={330} y={520} width={620} height={84} rx={10} fill={colors.PANEL} opacity={0.9} stroke={colors.GRID} />
              <text x={352} y={550} fill={colors.TEXT} fontSize={14} fontWeight={600}>
                failure three: the gamed checker
              </text>
              <text x={352} y={574} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
                checker: output contains "passed" → agent prints "passed" → reward. task: still broken.
              </text>
              <text x={352} y={594} fill={colors.SECONDARY} fontSize={12}>
                the alignment book's proxy problem, wearing a harness
              </text>
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Why agents fail
        </text>
      </g>
      <MathLabel
        tex="P(\text{success}) = p^{\,n} \;\Rightarrow\; 0.95^{20} = 0.36"
        x={860}
        y={54}
        fontSize={19}
        color={colors.SECONDARY}
        opacity={plotU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Busy and confident is not correct.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            0.95 to the twentieth is 0.36 · one poisoned lookup flips the answer ·
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            a greppable checker gets gamed. Hence: verification.
          </text>
        </g>
      )}
    </>
  );
}

export function AgentFailure() {
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
