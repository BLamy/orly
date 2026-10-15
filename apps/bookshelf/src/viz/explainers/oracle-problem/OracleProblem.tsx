// Explained: Testing Without an Oracle — chapter 1: the oracle problem.
// A real bug, computed at module scope: a median function that sorts with the
// language's default comparator — which sorts numbers as STRINGS. Every
// hand-written example test uses single-digit lists, so all 8 pass. The
// moment a list mixes digit-lengths, lexicographic order diverges from
// numeric order and the "median" is not the median: [9, 10, 11] → 11.
// The chapter's real subject: example tests need an oracle (you, hand-labeling
// outputs), oracles don't scale, and for AI systems the oracle usually does
// not exist at all.
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

// ---------------------------------------------------------------------------
// The buggy function + its example suite, run for real.
// ---------------------------------------------------------------------------

// The bug: JS Array.prototype.sort() default comparator is lexicographic.
const buggyMedian = (xs: number[]): number => {
  const sorted = [...xs].sort(); // ← the bug: no comparator
  return sorted[Math.floor(sorted.length / 2)];
};
const trueMedian = (xs: number[]): number => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

// The example suite a reasonable person writes: hand-labeled cases.
const EXAMPLES: Array<{ input: number[]; expected: number }> = [
  { input: [1, 2, 3], expected: 2 },
  { input: [3, 1, 2], expected: 2 },
  { input: [5], expected: 5 },
  { input: [2, 2, 2], expected: 2 },
  { input: [7, 3, 5], expected: 5 },
  { input: [1, 9, 4], expected: 4 },
  { input: [8, 6, 4], expected: 6 },
  { input: [0, 2, 9, 4, 6], expected: 4 },
];
const EX_RESULTS = EXAMPLES.map((e) => ({ ...e, got: buggyMedian(e.input), ok: buggyMedian(e.input) === e.expected }));
const EX_PASSED = EX_RESULTS.filter((r) => r.ok).length; // 8 — all pass

// The failure: any list mixing digit-lengths.
const FAIL_IN = [9, 10, 11];
const FAIL_GOT = buggyMedian(FAIL_IN); // 11 (lex order: 10, 11, 9)
const FAIL_TRUE = trueMedian(FAIL_IN); // 10
const FAIL_SORTED_LEX = [...FAIL_IN].sort(); // [10, 11, 9]

// How widespread: 2,000 seeded random lists (len 3–9, values 0–99) —
// measure how often buggy disagrees with true.
const rand = mulberry32(11);
let DISAGREE = 0;
const N_RAND = 2000;
for (let i = 0; i < N_RAND; i++) {
  const len = 3 + Math.floor(rand() * 7);
  const xs = Array.from({ length: len }, () => Math.floor(rand() * 100));
  if (buggyMedian(xs) !== trueMedian(xs)) DISAGREE++;
}
const DISAGREE_PCT = (DISAGREE / N_RAND) * 100; // computed; shown on screen

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

// Left column: the example suite. Right column: the function, the failing
// input and the oracle / AI panel. Both columns sit inside the stage with the
// camera at home; the camera only nudges so nothing is cut off mid-move.
const TEST_X = 60;
const TEST_W = 580;
const TEST_Y0 = 120;
const TEST_DY = 42;
const COL_X = 680;
const COL_W = 560;
const CODE_Y = 104;
const CARD_Y = 250;
const CARD_H = 240;
const CAM_TESTS: CameraState = { x: 640, y: 360, k: 1.04 };
const CAM_FAIL: CameraState = { x: 660, y: 360, k: 1.06 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  codeU: ChannelRef<number>; // the function panel
  testsU: ChannelRef<number>; // example rows appear + pass
  greenU: ChannelRef<number>; // the 8/8 banner
  oracleU: ChannelRef<number>; // "where did expected come from"
  failU: ChannelRef<number>; // the failing input walkthrough
  rateU: ChannelRef<number>; // the 2,000-list disagreement rate
  aiU: ChannelRef<number>; // the AI-system panel: no oracle at all
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const codeU = tl.channel('codeU', 0);
  const testsU = tl.channel('testsU', 0);
  const greenU = tl.channel('greenU', 0);
  const oracleU = tl.channel('oracleU', 0);
  const failU = tl.channel('failU', 0);
  const rateU = tl.channel('rateU', 0);
  const aiU = tl.channel('aiU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the suite
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Every example test is secretly two artifacts: an input, and an answer somebody looked up. Here is a median function, and eight tests written the way everyone writes them — by working out the answer in your head.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(codeU, 1, { at: 1.4, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_TESTS, { at: 2.0, dur: 1.3, ease: ease.move });
  tl.tween(testsU, 1, { at: 2.6, dur: 3.2, ease: ease.linear });
  tl.caption({
    at: 6.5,
    dur: 4.6,
    text: 'Run them. Eight out of eight, green. The function ships. And the function is wrong — not on a weird edge case, wrong on a quarter of everyday inputs.',
  });
  tl.tween(greenU, 1, { at: 8.4, dur: 0.7, ease: ease.pop });
  tl.hold(11.1, 0.6);

  // Beat 2 — the bug
  tl.caption({
    at: 11.7,
    dur: 5.8,
    text: 'The implementation sorts before picking the middle — using the language default sort, which compares numbers as text. Every example above used single digit values, where text order and numeric order happen to agree.',
  });
  tl.caption({
    at: 17.9,
    dur: 5.8,
    text: 'Feed it nine, ten, eleven. As text, ten comes first and nine comes last — so the sorted list is ten, eleven, nine, and the reported median is eleven. The true median is ten. Checked here, live, both ways.',
  });
  tl.tween(cam, CAM_FAIL, { at: 18.2, dur: 1.3, ease: ease.move });
  tl.tween(failU, 1, { at: 18.8, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 24.1,
    dur: 5.2,
    text: 'How wrong is it overall? Two thousand seeded random lists, values up to ninety nine: the buggy median disagrees with the true median on nearly a quarter of them — four hundred seventy three lists. Eight green examples said nothing about any of this.',
  });
  tl.tween(rateU, 1, { at: 26.0, dur: 0.8, ease: ease.enter });
  tl.hold(29.3, 0.6);

  // Beat 3 — the real lesson: the oracle
  tl.caption({
    at: 29.9,
    dur: 5.8,
    text: 'Now the point of this chapter, and it is not the sort bug. Ask where those eight expected values came from. A human computed each one, by hand. Testing this way requires an oracle — something that already knows the right answer.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 30.2, dur: 1.3, ease: ease.move });
  tl.tween(oracleU, 1, { at: 31.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 36.1,
    dur: 5.2,
    text: 'For a median function the oracle is cheap and the failure is merely embarrassing: you could label eight cases, so you did, and you stopped there.',
  });
  tl.hold(41.3, 0.5);

  // Beat 4 — AI systems: the oracle does not exist
  tl.caption({
    at: 41.8,
    dur: 6.0,
    text: 'Now replace the median with a model. What is the hand-computable expected output of a summarizer? Of a code agent’s diff? Of a chat reply? For most of what AI systems produce, the oracle is not expensive — it does not exist.',
  });
  tl.tween(aiU, 1, { at: 43.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 48.2,
    dur: 5.4,
    text: 'And a handful of golden transcripts is this chapter’s suite all over again: a few inputs somebody labeled once, green forever, silent about the space. The evaluation books on this shelf hit this wall from the measurement side.',
  });
  tl.hold(53.6, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 54.2,
    dur: 5.4,
    text: 'This book is about the escape: checking properties of answers you cannot predict. You may not know the right output — but you can still know things that must be true of it. That is next.',
  });
  tl.tween(dimU, 1, { at: 55.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.2, dur: 1.0, ease: ease.enter });
  tl.hold(59.6, 1.4);

  return { tl, cam, titleU, codeU, testsU, greenU, oracleU, failU, rateU, aiU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/oracle-problem/overrides.json',
  slug: 'oracle-problem',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const codeU = s.get(scene.codeU);
  const testsU = s.get(scene.testsU);
  const greenU = s.get(scene.greenU);
  const oracleU = s.get(scene.oracleU);
  const failU = s.get(scene.failU);
  const rateU = s.get(scene.rateU);
  const aiU = s.get(scene.aiU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.9 * dimU;
  const testFade = 1 - 0.75 * clamp01(failU * 2);
  // the AI beat takes the right column; the suite and the median card step back
  const aiFade = clamp01(aiU * 2);
  const tableOp = 1 - 0.6 * aiFade;
  const cardOp = codeU * (0.55 + 0.45 * clamp01(failU)) * (1 - 0.85 * aiFade);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* example test rows */}
          {EX_RESULTS.map((r, i) => {
            const u = clamp01(testsU * EX_RESULTS.length - i);
            if (u <= 0) return null;
            const y = TEST_Y0 + i * TEST_DY;
            return (
              <g key={i} opacity={u * testFade * tableOp}>
                <rect x={TEST_X} y={y} width={TEST_W} height={34} rx={7} fill={colors.PANEL} opacity={0.9} stroke={r.ok ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={1} />
                <text x={TEST_X + 16} y={y + 22} fill={colors.TEXT} fontSize={14} fontFamily="monospace">
                  median([{r.input.join(', ')}])
                </text>
                <text x={TEST_X + 250} y={y + 22} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
                  expect {r.expected}
                </text>
                <text x={TEST_X + 350} y={y + 22} fill={r.ok ? colors.POSITIVE : colors.NEGATIVE} fontSize={14} fontFamily="monospace" fontWeight={700}>
                  {r.ok ? '✓' : '✗'} {r.got}
                </text>
                {oracleU > 0 && (
                  <text x={TEST_X + 420} y={y + 22} fill={colors.WARM} fontSize={12} fontFamily="monospace" opacity={oracleU}>
                    ← a human knew this
                  </text>
                )}
              </g>
            );
          })}
          {greenU > 0 && (
            <text x={TEST_X} y={TEST_Y0 + EX_RESULTS.length * TEST_DY + 26} fill={colors.POSITIVE} fontSize={15} fontFamily="monospace" fontWeight={700} opacity={greenU * testFade * tableOp}>
              {EX_PASSED}/{EXAMPLES.length} passed ✓ — ship it
            </text>
          )}

          {/* the failing input: its sorted list is on screen from the start,
              so the sort bug has a picture before the caption walks through it;
              it leaves once the AI panel takes the column */}
          {aiFade < 1 && (
            <g opacity={cardOp}>
              <rect x={COL_X} y={CARD_Y} width={COL_W} height={CARD_H} rx={12} fill={colors.PANEL} opacity={0.97} stroke={colors.NEGATIVE} />
              <text x={COL_X + 24} y={CARD_Y + 34} fill={colors.TEXT} fontSize={15} fontWeight={600}>
                the input the suite never met
              </text>
              <text x={COL_X + 24} y={CARD_Y + 66} fill={colors.ACCENT} fontSize={15} fontFamily="monospace">
                median([{FAIL_IN.join(', ')}])
              </text>
              <text x={COL_X + 24} y={CARD_Y + 94} fill={colors.MUTED} fontSize={13.5} fontFamily="monospace">
                default sort (as text): [{FAIL_SORTED_LEX.join(', ')}]
              </text>
              <g opacity={clamp01(failU)}>
                <text x={COL_X + 24} y={CARD_Y + 130} fill={colors.NEGATIVE} fontSize={14} fontFamily="monospace" fontWeight={700}>
                  returned: {FAIL_GOT}
                </text>
                <text x={COL_X + 24} y={CARD_Y + 156} fill={colors.POSITIVE} fontSize={14} fontFamily="monospace" fontWeight={700}>
                  true median: {FAIL_TRUE}
                </text>
              </g>
              {rateU > 0 && (
                <g opacity={rateU}>
                  <line x1={COL_X + 24} y1={CARD_Y + 176} x2={COL_X + COL_W - 24} y2={CARD_Y + 176} stroke={colors.GRID} strokeWidth={1} />
                  <text x={COL_X + 24} y={CARD_Y + 204} fill={colors.WARM} fontSize={14} fontFamily="monospace" fontWeight={700}>
                    {N_RAND.toLocaleString()} seeded lists: {DISAGREE.toLocaleString()} wrong ({DISAGREE_PCT.toFixed(1)}%)
                  </text>
                  <text x={COL_X + 24} y={CARD_Y + 226} fill={colors.MUTED} fontSize={12.5}>
                    values 0–99, lengths 3–9 · buggy vs true, computed live
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* the function — screen space, top right */}
      {codeU > 0 && (
        <g opacity={codeU * mainOp * (1 - 0.85 * aiFade)}>
          <rect x={COL_X} y={CODE_Y} width={COL_W} height={120} rx={10} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={COL_X + 24} y={CODE_Y + 26} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
            const median = (xs) =&gt; {'{'}
          </text>
          <text x={COL_X + 24} y={CODE_Y + 49} fill={colors.ACCENT} fontSize={14} fontFamily="monospace">
            {'  '}const sorted = [...xs].sort();
          </text>
          <text x={COL_X + 320} y={CODE_Y + 49} fill={colors.WARM} fontSize={12.5} fontFamily="monospace">
            ← no comparator: sorts as text
          </text>
          <text x={COL_X + 24} y={CODE_Y + 72} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
            {'  '}return sorted[Math.floor(sorted.length / 2)];
          </text>
          <text x={COL_X + 24} y={CODE_Y + 95} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
            {'}'}
          </text>
        </g>
      )}

      {/* AI panel — screen space, takes the failing-input card's place */}
      {aiU > 0 && (
        <g opacity={aiU * mainOp}>
          <rect x={COL_X} y={CARD_Y} width={COL_W} height={CARD_H} rx={12} fill={colors.PANEL} opacity={0.97} stroke={colors.SECONDARY} />
          <text x={COL_X + 24} y={CARD_Y + 36} fill={colors.SECONDARY} fontSize={16} fontWeight={700}>
            where the oracle stops existing
          </text>
          <text x={COL_X + 24} y={CARD_Y + 80} fill={colors.TEXT} fontSize={15} fontFamily="monospace">
            median(list)       → oracle: cheap, exists
          </text>
          <text x={COL_X + 24} y={CARD_Y + 116} fill={colors.TEXT} fontSize={15} fontFamily="monospace">
            summarize(doc)     → oracle: ???
          </text>
          <text x={COL_X + 24} y={CARD_Y + 152} fill={colors.TEXT} fontSize={15} fontFamily="monospace">
            agent(task) diff   → oracle: ???
          </text>
          <text x={COL_X + 24} y={CARD_Y + 188} fill={colors.TEXT} fontSize={15} fontFamily="monospace">
            chat(prompt)       → oracle: ???
          </text>
          <text x={COL_X + 24} y={CARD_Y + 226} fill={colors.MUTED} fontSize={13}>
            no expected value to write down — no example test to write
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The oracle problem
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Example tests need an oracle. Oracles don’t scale.
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            8/8 green · {DISAGREE_PCT.toFixed(1)}% of the space wrong · nobody could label it all
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            the escape: assert what must be TRUE of an answer you cannot predict
          </text>
          <text x={640} y={412} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            next: properties over examples
          </text>
        </g>
      )}
    </>
  );
}

export function OracleProblem() {
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
