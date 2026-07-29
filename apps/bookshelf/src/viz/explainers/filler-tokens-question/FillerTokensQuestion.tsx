// arXiv:2607.03502 — "Reading Between the Dots: Decoding Hidden Computation
// across Filler Tokens" (Brauer, Mayrink Verdun, Marks, July 2026).
// Chapter 1: the question. If a model emits content-free tokens (dots,
// counting) between question and answer and its accuracy RISES, something is
// being computed in those positions — with no visible reasoning to read.
// The uplift bars are the paper's reported numbers (DeepSeek V3, k fillers):
//   one-fact addition 54% -> 72% · letter position 61% -> 70%
//   system of equations 31% -> 61% · two-fact addition 21% -> 24%
// Replotted as published results, not re-measured here.
import {
  CAMERA_HOME,
  Camera,
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
// The prompt, verbatim in structure from the paper (Section 2's setup):
// [question] [k filler tokens] Answer:
// ---------------------------------------------------------------------------

const QUESTION = ['What', 'is', 'the', 'atomic', 'number', 'of', 'silicon', 'plus', '62?'];
const N_DOTS = 10;
const ANSWER = '76'; // silicon = 14; 14 + 62 = 76

// the paper's reported behavioral uplift (Table in Section 3; DeepSeek V3
// except where noted)
const UPLIFT = [
  { task: 'one fact addition', without: 54, with: 72 },
  { task: 'system of equations', without: 31, with: 61 },
  { task: 'letter position', without: 61, with: 70 },
  { task: 'two fact addition', without: 21, with: 24 },
];

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const TOK_Y = 250;
const TOK_H = 34;
const Q_X = 80;
const TOK_GAP = 6;
// widths per question token (rough mono estimate)
const qWidths = QUESTION.map((w) => 16 + w.length * 10);
const qXs: number[] = [];
{
  let x = Q_X;
  for (const w of qWidths) {
    qXs.push(x);
    x += w + TOK_GAP;
  }
}
const DOTS_X0 = qXs[qXs.length - 1] + qWidths[qWidths.length - 1] + 24;
const DOT_W = 22;
const ANS_X = DOTS_X0 + N_DOTS * (DOT_W + 4) + 24;

const BARS_Y = 430;
const BAR_H = 18;
const BAR_MAX = 320;

const CAM_PROMPT: CameraState = { x: 640, y: 260, k: 1.3 };
const CAM_DOTS: CameraState = { x: DOTS_X0 + 120, y: 250, k: 2.0 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  qU: ChannelRef<number>;
  dotsU: ChannelRef<number>;
  ansU: ChannelRef<number>;
  glowU: ChannelRef<number>;
  qmarkU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const qU = tl.channel('qU', 0);
  const dotsU = tl.channel('dotsU', 0);
  const ansU = tl.channel('ansU', 0);
  const glowU = tl.channel('glowU', 0);
  const qmarkU = tl.channel('qmarkU', 0);
  const barsU = tl.channel('barsU', 0);
  const fillU = tl.channel('fillU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the odd prompt
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Here is a strange experiment. Ask a model a question — but before it answers, make it emit a row of dots. Just dots. They carry no information at all.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_PROMPT, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(qU, 1, { at: 1.0, dur: 2.2, ease: ease.enter });
  tl.tween(dotsU, 1, { at: 3.4, dur: 2.0, ease: ease.linear });
  tl.tween(ansU, 1, { at: 5.6, dur: 0.7, ease: ease.enter });
  tl.hold(6.3, 0.6);

  // Beat 2 — the uplift
  tl.caption({
    at: 6.9,
    dur: 5.8,
    text: 'If the dots were truly inert, accuracy should not move. It moves. Here are the numbers the paper reports on a frontier open weights model.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.tween(barsU, 1, { at: 8.2, dur: 1.0, ease: ease.enter });
  tl.tween(fillU, 1, { at: 9.4, dur: 2.4, ease: ease.move });
  tl.caption({
    at: 13.1,
    dur: 6.2,
    text: 'On fact retrieval plus arithmetic, accuracy jumps from fifty four to seventy two percent. On small systems of equations, it nearly doubles — from thirty one to sixty one.',
  });
  tl.hold(19.3, 0.7);

  // Beat 3 — the question
  tl.caption({
    at: 20.0,
    dur: 5.8,
    text: 'So the model is doing useful work somewhere. Not in the words — the dots are identical, interchangeable, content free. The work must be happening in the hidden states behind them.',
  });
  tl.tween(cam, CAM_DOTS, { at: 20.3, dur: 1.6, ease: ease.move });
  tl.tween(glowU, 1, { at: 21.4, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 26.2,
    dur: 5.6,
    text: 'That should bother you. A reasoning trace you can read is oversight. Computation smeared invisibly across ten dot positions is not — unless someone can decode it.',
  });
  tl.tween(qmarkU, 1, { at: 27.4, dur: 0.9, ease: ease.enter });
  tl.hold(31.8, 0.7);

  // Beat 4 — the plan of the book
  tl.caption({
    at: 32.5,
    dur: 6.0,
    text: 'This paper asks the sharp version of the question: is hidden computation that defeats behavioral oversight still readable from the internal trace? And it answers by building the decoder.',
  });
  tl.tween(dimU, 1, { at: 32.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 33.8, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 38.9,
    dur: 5.2,
    text: 'First we will build a tiny transformer where filler computation is visible by construction. Then we will point the same instruments at the real thing.',
  });
  tl.hold(44.1, 1.2);

  return { tl, cam, titleU, qU, dotsU, ansU, glowU, qmarkU, barsU, fillU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/filler-tokens-question/overrides.json',
  slug: 'filler-tokens-question',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const qU = s.get(scene.qU);
  const dotsU = s.get(scene.dotsU);
  const ansU = s.get(scene.ansU);
  const glowU = s.get(scene.glowU);
  const qmarkU = s.get(scene.qmarkU);
  const barsU = s.get(scene.barsU);
  const fillU = s.get(scene.fillU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the prompt */}
          {QUESTION.map((w, i) => {
            const u = clamp01(qU * QUESTION.length - i);
            if (u <= 0) return null;
            return (
              <g key={i} opacity={u}>
                <rect x={qXs[i]} y={TOK_Y} width={qWidths[i]} height={TOK_H} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={qXs[i] + qWidths[i] / 2} y={TOK_Y + 22} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily="monospace">
                  {w}
                </text>
              </g>
            );
          })}
          {Array.from({ length: N_DOTS }, (_, i) => {
            const u = clamp01(dotsU * N_DOTS - i);
            if (u <= 0) return null;
            const x = DOTS_X0 + i * (DOT_W + 4);
            return (
              <g key={i} opacity={u}>
                {glowU > 0 && (
                  <rect
                    x={x - 3}
                    y={TOK_Y - 3}
                    width={DOT_W + 6}
                    height={TOK_H + 6}
                    rx={8}
                    fill={colors.WARM}
                    opacity={0.22 * glowU * (0.6 + 0.4 * Math.sin(i * 1.7))}
                  />
                )}
                <rect x={x} y={TOK_Y} width={DOT_W} height={TOK_H} rx={6} fill={colors.PANEL} stroke={glowU > 0.5 ? colors.WARM : colors.GRID} />
                <text x={x + DOT_W / 2} y={TOK_Y + 23} textAnchor="middle" fill={colors.MUTED} fontSize={17} fontFamily="monospace">
                  .
                </text>
              </g>
            );
          })}
          <g opacity={ansU}>
            <rect x={ANS_X} y={TOK_Y} width={110} height={TOK_H} rx={6} fill={colors.PANEL} stroke={colors.ACCENT} />
            <text x={ANS_X + 55} y={TOK_Y + 22} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily="monospace">
              Answer: {ANSWER}
            </text>
          </g>
          {glowU > 0 && (
            <text x={DOTS_X0 + (N_DOTS * (DOT_W + 4)) / 2} y={TOK_Y - 28} textAnchor="middle" fill={colors.WARM} fontSize={14} opacity={glowU}>
              same token, ten times — whatever varies is hidden
            </text>
          )}
          {qmarkU > 0 && (
            <text x={DOTS_X0 + (N_DOTS * (DOT_W + 4)) / 2} y={TOK_Y + 74} textAnchor="middle" fill={colors.WARM} fontSize={19} fontWeight={600} opacity={qmarkU}>
              what is computed here?
            </text>
          )}

          {/* the reported uplift */}
          {barsU > 0 && (
            <g opacity={barsU}>
              <text x={Q_X} y={BARS_Y - 36} fill={colors.TEXT} fontSize={16}>
                accuracy without fillers → with fillers
              </text>
              <text x={Q_X} y={BARS_Y - 16} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                reported in the paper (DeepSeek V3) — replotted, not re-run
              </text>
              {UPLIFT.map((r, i) => {
                const y = BARS_Y + i * 44;
                const w0 = (r.without / 100) * BAR_MAX;
                const w1 = (r.with / 100) * BAR_MAX * fillU + w0 * (1 - fillU);
                return (
                  <g key={r.task}>
                    <text x={Q_X} y={y + 13} fill={colors.MUTED} fontSize={13}>
                      {r.task}
                    </text>
                    <rect x={Q_X + 210} y={y} width={w0} height={BAR_H} rx={4} fill={colors.MUTED} opacity={0.45} />
                    <rect x={Q_X + 210} y={y} width={Math.max(0, w1 - w0)} height={BAR_H} rx={0} fill={colors.POSITIVE} opacity={0.85} transform={`translate(${w0},0)`} />
                    <text x={Q_X + 210 + w0 - 6} y={y + 14} textAnchor="end" fill={colors.BG} fontSize={11} fontFamily="monospace">
                      {r.without}
                    </text>
                    <text x={Q_X + 214 + w1} y={y + 14} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace" opacity={fillU}>
                      {r.with}%
                    </text>
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
          Reading between the dots
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.03502
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            The dots do work. Can we read it?
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Hidden computation defeats behavioral oversight —
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the paper asks whether the internal trace still tells the truth.
          </text>
          <text x={640} y={400} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            Reading Between the Dots · arXiv:2607.03502
          </text>
        </g>
      )}
    </>
  );
}

export function FillerTokensQuestion() {
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
