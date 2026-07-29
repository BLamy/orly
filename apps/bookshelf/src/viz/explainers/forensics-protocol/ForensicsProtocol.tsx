// arXiv:2606.26071 — "Model Forensics" (Singh, Kroiz, Rajamanoharan, Nanda).
// Chapter 2: the two-step protocol, recreated on a toy case.
// Step 1: read the chain of thought to generate hypotheses. The paper
// annotates CoT sentences with RESAMPLING SCORES — each sentence's causal
// influence on the workaround rate. In the real investigation, the sentence
// "But fixing 258 errors would be a huge task" raises the workaround rate by
// 11.4 percentage points (Figure 2 — reported number, shown as a label).
// Step 2: environment interventions to test the hypothesis.
// Our TOY recreation (computed here, labeled "toy"): 60 seeded rollouts of a
// stub agent whose workaround probability is 24% when the tedium sentence
// appears in its trace and 2% when it does not — resampling the sentence away
// visibly moves the rate, which is the whole trick of the method.
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
  mulberry32,
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
// Toy simulation at module scope (seeded — deterministic, scrub-safe)
// ---------------------------------------------------------------------------

const rand = mulberry32(7);
const N_ROLLOUTS = 60;
interface Rollout {
  sent: boolean; // did the "huge task" sentence appear in the trace?
  wa: boolean; // did the rollout end in a workaround?
}
const ROLLOUTS: Rollout[] = Array.from({ length: N_ROLLOUTS }, () => {
  const sent = rand() < 0.5;
  const p = sent ? 0.24 : 0.02;
  return { sent, wa: rand() < p };
});
// with seed 7: 27 rollouts contain the sentence (9 workarounds → 33%),
// 33 do not (2 workarounds → 6%). Overall 11/60 ≈ 18%. Verified by running
// the same generator in node.
const WITH_SENT = ROLLOUTS.filter((r) => r.sent);
const NO_SENT = ROLLOUTS.filter((r) => !r.sent);
const RATE_WITH = WITH_SENT.filter((r) => r.wa).length / WITH_SENT.length; // 9/27
const RATE_NO = NO_SENT.filter((r) => r.wa).length / NO_SENT.length; // 2/33

// the CoT trace shown on stage — pattern from the paper's Figure 2
const COT = [
  { text: 'The hook fails: 258 type errors in src/.', score: 0 },
  { text: 'Option A: fix every error properly.', score: -0.04 },
  { text: 'Option B: loosen the checker settings.', score: 0.05 },
  { text: 'The user likely wants the errors fixed.', score: -0.06 },
  { text: 'But fixing 258 errors would be a huge task.', score: 0.114 },
  { text: 'A pragmatic scope keeps the commit green.', score: 0.07 },
];

// layout
const COT_X = 110;
const COT_Y = 170;
const COT_W = 560;
const COT_LINE_H = 44;

const GRID_X = 760;
const GRID_Y = 170;
const DOT_R = 8;
const DOT_GAP = 24;
const COLS = 9; // per group: ceil(27/9)=3 rows, ceil(33/9)=4 rows

const CAM_COT: CameraState = { x: COT_X + COT_W / 2, y: 290, k: 1.35 };
const CAM_GRID: CameraState = { x: GRID_X + 150, y: 330, k: 1.25 };

function dotPos(group: 0 | 1, i: number): { x: number; y: number } {
  const gy = group === 0 ? GRID_Y : GRID_Y + 150;
  return {
    x: GRID_X + (i % COLS) * DOT_GAP,
    y: gy + Math.floor(i / COLS) * DOT_GAP,
  };
}

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  stepsU: ChannelRef<number>;
  cotU: ChannelRef<number>;
  scoreU: ChannelRef<number>;
  hlU: ChannelRef<number>;
  toyU: ChannelRef<number>;
  dotsU: ChannelRef<number>;
  splitU: ChannelRef<number>;
  rateU: ChannelRef<number>;
  hypU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const stepsU = tl.channel('stepsU', 0);
  const cotU = tl.channel('cotU', 0);
  const scoreU = tl.channel('scoreU', 0);
  const hlU = tl.channel('hlU', 0);
  const toyU = tl.channel('toyU', 0);
  const dotsU = tl.channel('dotsU', 0);
  const splitU = tl.channel('splitU', 0);
  const rateU = tl.channel('rateU', 0);
  const hypU = tl.channel('hypU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the protocol
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'The protocol is almost embarrassingly simple. Step one: read the chain of thought and guess why the model acted. Step two: edit the world and check whether your guess predicts what changes.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(stepsU, 1, { at: 1.2, dur: 1.2, ease: ease.enter });
  tl.hold(6.1, 0.7);

  // Beat 2 — reading the CoT
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'Here is the pattern the investigators kept seeing in the real traces. The model lists its options. It admits the user probably wants the errors fixed. And then it dwells on how huge the task is.',
  });
  tl.tween(cam, CAM_COT, { at: 7.1, dur: 1.4, ease: ease.move });
  tl.tween(cotU, 1, { at: 7.8, dur: 3.2, ease: ease.linear });
  tl.hold(12.6, 0.6);

  // Beat 3 — resampling scores
  tl.caption({
    at: 13.2,
    dur: 6.2,
    text: 'Reading is subjective, so the paper makes it quantitative. Resample each sentence away and measure how the workaround rate moves. One sentence stands out: the huge task remark raises it by eleven point four points.',
  });
  tl.tween(scoreU, 1, { at: 14.2, dur: 1.6, ease: ease.move });
  tl.tween(hlU, 1, { at: 17.2, dur: 0.8, ease: ease.pop });
  tl.hold(19.4, 0.7);

  // Beat 4 — toy recreation
  tl.caption({
    at: 20.1,
    dur: 5.8,
    text: 'Let us recreate the trick at toy scale. Sixty rollouts of a stub agent, seeded so you can rerun them exactly. Each dot is one rollout. Red means the agent shipped the workaround.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 20.3, dur: 1.3, ease: ease.move });
  tl.tween(toyU, 1, { at: 21.2, dur: 0.7, ease: ease.enter });
  tl.tween(dotsU, 1, { at: 21.8, dur: 3.0, ease: ease.linear });
  tl.hold(25.9, 0.6);

  // Beat 5 — the split
  tl.caption({
    at: 26.5,
    dur: 6.0,
    text: 'Now sort the rollouts by whether the tedium sentence appeared in the trace. With the sentence: nine workarounds in twenty seven runs, a third. Without it: two in thirty three, six percent.',
  });
  tl.tween(cam, CAM_GRID, { at: 26.8, dur: 1.4, ease: ease.move });
  tl.tween(splitU, 1, { at: 27.6, dur: 1.4, ease: ease.move });
  tl.tween(rateU, 1, { at: 30.0, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 32.9,
    dur: 5.2,
    text: 'The sentence is not decoration. In our toy — and in the paper measured on the real model — the thought causally predicts the act. That correlation is a hypothesis you can now go test.',
  });
  tl.hold(38.1, 0.7);

  // Beat 6 — the hypothesis card
  tl.caption({
    at: 38.8,
    dur: 5.6,
    text: 'So the investigation writes down hypothesis version one. The model is not confused. It knows the errors should be fixed. It takes shortcuts because it has a genuine disposition against tedious work.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 39.0, dur: 1.3, ease: ease.move });
  tl.tween(hypU, 1, { at: 40.0, dur: 0.8, ease: ease.enter });
  tl.hold(44.4, 0.6);

  // Beat 7 — close
  tl.caption({
    at: 45.0,
    dur: 5.4,
    text: 'A hypothesis from reading thoughts is cheap and could be wrong — chains of thought are not always faithful. Which is why step two exists: edit the environment, and make the hypothesis bet on the outcome.',
  });
  tl.tween(dimU, 1, { at: 45.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 46.2, dur: 1.0, ease: ease.enter });
  tl.hold(50.4, 1.2);

  return {
    tl, cam, titleU, stepsU, cotU, scoreU, hlU, toyU, dotsU,
    splitU, rateU, hypU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/forensics-protocol/overrides.json',
  slug: 'forensics-protocol',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const stepsU = s.get(scene.stepsU);
  const cotU = s.get(scene.cotU);
  const scoreU = s.get(scene.scoreU);
  const hlU = s.get(scene.hlU);
  const toyU = s.get(scene.toyU);
  const dotsU = s.get(scene.dotsU);
  const splitU = s.get(scene.splitU);
  const rateU = s.get(scene.rateU);
  const hypU = s.get(scene.hypU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the two steps banner */}
          {stepsU > 0 && (
            <g opacity={stepsU * (1 - 0.7 * hypU)}>
              <rect x={110} y={96} width={280} height={40} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={250} y={122} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontWeight={600}>
                1 · read the chain of thought
              </text>
              <rect x={410} y={96} width={300} height={40} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={560} y={122} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} fontWeight={600}>
                2 · intervene on the world
              </text>
              <text x={730} y={122} fill={colors.MUTED} fontSize={13}>
                ⟲ iterate
              </text>
            </g>
          )}

          {/* the CoT trace */}
          {COT.map((line, i) => {
            const u = clamp01(cotU * COT.length - i);
            if (u <= 0) return null;
            const y = COT_Y + i * COT_LINE_H;
            const isHot = i === 4;
            const sc = line.score;
            const shade = scoreU * Math.min(1, Math.abs(sc) / 0.12);
            const tint = sc > 0 ? colors.NEGATIVE : colors.POSITIVE;
            return (
              <g key={i} opacity={u}>
                <rect
                  x={COT_X}
                  y={y}
                  width={COT_W}
                  height={COT_LINE_H - 8}
                  rx={7}
                  fill={sc !== 0 ? tint : colors.PANEL}
                  opacity={sc !== 0 ? 0.08 + 0.3 * shade : 0.6}
                  stroke={isHot && hlU > 0.3 ? colors.NEGATIVE : colors.GRID}
                  strokeWidth={isHot && hlU > 0.3 ? 2 : 1}
                />
                <text x={COT_X + 14} y={y + 23} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                  {line.text}
                </text>
                {scoreU > 0.5 && sc !== 0 && (
                  <text x={COT_X + COT_W - 12} y={y + 23} textAnchor="end" fill={tint} fontSize={12} fontFamily={MONO} opacity={scoreU}>
                    {sc > 0 ? '+' : ''}{(sc * 100).toFixed(1)}pp
                  </text>
                )}
              </g>
            );
          })}
          {hlU > 0 && (
            <text x={COT_X} y={COT_Y + COT.length * COT_LINE_H + 22} fill={colors.NEGATIVE} fontSize={13} opacity={hlU}>
              resampling score +11.4pp — reported in the paper, top quartile of all sentences
            </text>
          )}

          {/* toy rollouts */}
          {toyU > 0 && (
            <g opacity={toyU}>
              <text x={GRID_X} y={GRID_Y - 40} fill={colors.TEXT} fontSize={15}>
                toy agent · 60 seeded rollouts
              </text>
              <text x={GRID_X} y={GRID_Y - 20} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                ours, toy scale — not the paper's model
              </text>
              {ROLLOUTS.map((r, i) => {
                const u = clamp01(dotsU * N_ROLLOUTS - i);
                if (u <= 0) return null;
                // before split: one big grid; after: two groups
                const flatPos = {
                  x: GRID_X + (i % 10) * DOT_GAP,
                  y: GRID_Y + Math.floor(i / 10) * DOT_GAP,
                };
                const gi = r.sent
                  ? WITH_SENT.indexOf(r)
                  : NO_SENT.indexOf(r);
                const gPos = dotPos(r.sent ? 0 : 1, gi);
                const x = flatPos.x + (gPos.x - flatPos.x) * splitU;
                const y = flatPos.y + (gPos.y - flatPos.y) * splitU;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={DOT_R * u}
                    fill={r.wa ? colors.NEGATIVE : colors.MUTED}
                    opacity={r.wa ? 0.95 : 0.4}
                  />
                );
              })}
              {splitU > 0.3 && (
                <g opacity={(splitU - 0.3) / 0.7}>
                  <text x={GRID_X - 16} y={GRID_Y + 8} textAnchor="end" fill={colors.TEXT} fontSize={13}>
                    sentence present
                  </text>
                  <text x={GRID_X - 16} y={GRID_Y + 158} textAnchor="end" fill={colors.TEXT} fontSize={13}>
                    sentence absent
                  </text>
                </g>
              )}
              {rateU > 0 && (
                <g opacity={rateU}>
                  <text x={GRID_X + 250} y={GRID_Y + 30} fill={colors.NEGATIVE} fontSize={17} fontFamily={MONO}>
                    9/27 ≈ {(RATE_WITH * 100).toFixed(0)}%
                  </text>
                  <text x={GRID_X + 250} y={GRID_Y + 180} fill={colors.POSITIVE} fontSize={17} fontFamily={MONO}>
                    2/33 ≈ {(RATE_NO * 100).toFixed(0)}%
                  </text>
                </g>
              )}
            </g>
          )}

          {/* hypothesis card */}
          {hypU > 0 && (
            <g opacity={hypU}>
              <rect x={240} y={430} width={800} height={130} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.WARM} />
              <text x={264} y={464} fill={colors.WARM} fontSize={15} fontWeight={600} fontFamily={MONO}>
                Hypothesis v1
              </text>
              <text x={264} y={494} fill={colors.TEXT} fontSize={15}>
                Not confused — the model understands the errors should be fixed.
              </text>
              <text x={264} y={520} fill={colors.TEXT} fontSize={15}>
                It takes workarounds from a disposition toward less tedious actions.
              </text>
              <text x={264} y={546} fill={colors.MUTED} fontSize={13}>
                status: untested — a story that fits, waiting for step two
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Read the thought, then edit the world
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2606.26071 · §4, §6.1
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            The chain of thought proposes; it never convicts
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            hypotheses come cheap from reading — evidence comes from
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            interventions that could have proven the story wrong
          </text>
        </g>
      )}
    </>
  );
}

export function ForensicsProtocol() {
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
