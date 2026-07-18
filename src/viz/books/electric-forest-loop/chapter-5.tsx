// Why the Critic Beats a Reviewer
//
// Backed by: electric-forest .eforest/loop.md (the critic's job is to NOT
// take the builder at its word — falsify the evidence, check sufficiency,
// run the task's own attack angles with its own inputs, fuzz, sabotage a
// scratch worktree, "interrogate the cited Replay recording through the
// Replay MCP"; the builder's workshop: scratch probes in work/ [gitignored],
// durable artifacts in evidence/ [committed]; evidence = a deterministic
// event-log/digest run plus a Replay browser recording of the final happy
// run) and .claude/workflows/verify-task.js (the six parallel attack arms:
// falsify, coverage, mock-env-hunt, sabotage in a disposable worktree,
// own-attacks + fuzz, replay interrogation; then Cross-examine — "a
// refutation is also a claim" — before the judge's verdict).
//
// Centerpiece: a split stage. Left, a reviewer reading a diff — its verdict
// can only be a stamp on the story the diff tells. Right, the critic holding
// the actual session: a Replay recording a human can open and watch, swept
// end to end, then six attack arms fanning out against it. The left side
// dims; the recap re-traces the whole book as five small frames.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */

const LEFT = { x: 90, y: 110, w: 480, h: 420 } as const;
const RIGHT = { x: 710, y: 110, w: 480, h: 420 } as const;

const DIFF_LINES = [
  { sign: '+', w: 240 }, { sign: '+', w: 300 }, { sign: '-', w: 180 },
  { sign: '+', w: 270 }, { sign: ' ', w: 220 }, { sign: '+', w: 190 },
];

const TAPE_POINTS: RecordingPoint[] = [
  { at: 0.12, kind: 'interaction' },
  { at: 0.3, kind: 'network' },
  { at: 0.5, kind: 'render' },
  { at: 0.72, kind: 'exception' },
  { at: 0.9, kind: 'render' },
];

/** The six attack arms of verify-task.js, in its own order. */
const ARMS = [
  { label: 'falsify', sub: 'predict, then look — own inputs' },
  { label: 'coverage', sub: 'did every hunk run in the evidence?' },
  { label: 'mock & env hunt', sub: 'cold clone · scrubbed env' },
  { label: 'sabotage', sub: 'break it in a worktree — tests must go red' },
  { label: 'own attacks + fuzz', sub: 'malformed events · concurrent writers' },
  { label: 'replay interrogation', sub: 'through the Replay MCP' },
];

/** The recap frames — the book, re-traced. */
const RECAP = [
  { label: 'the claim', sub: 'evidence, not satisfaction' },
  { label: 'the workshop', sub: 'work/ scratch · evidence/ committed' },
  { label: 'the attack', sub: 'six arms, in parallel' },
  { label: 'the budget', sub: 'rounds of 3 · judge · cap 10' },
  { label: 'the verdict', sub: 'only the critic sets verified' },
];
const RECAP_Y = 300;
const recapX = (i: number) => 640 + (i - 2) * 226;

const CAM_LEFT: CameraState = { x: 330, y: 300, k: 1.28 };
const CAM_RIGHT: CameraState = { x: 950, y: 300, k: 1.28 };
const CAM_SPLIT: CameraState = { x: 640, y: 300, k: 1.05 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.0 };

/* -------------------------------------------------------------- timeline */

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  leftU: ChannelRef<number>;
  eyeU: ChannelRef<number>;
  stampU: ChannelRef<number>;
  rightU: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  armsU: ChannelRef<number>;
  findU: ChannelRef<number>; // a finding lands, cited to a point
  xcheckU: ChannelRef<number>; // cross-examination chip
  leftDim: ChannelRef<number>;
  dimU: ChannelRef<number>;
  recapU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const leftU = tl.channel('leftU', 0);
  const eyeU = tl.channel('eyeU', 0); // reading sweep down the diff
  const stampU = tl.channel('stampU', 0);
  const rightU = tl.channel('rightU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const armsU = tl.channel('armsU', 0);
  const findU = tl.channel('findU', 0);
  const xcheckU = tl.channel('xcheckU', 0);
  const leftDim = tl.channel('leftDim', 0);
  const dimU = tl.channel('dimU', 0);
  const recapU = tl.channel('recapU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the obvious alternative —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'There is an obvious cheaper design: just ask a second model to review the code. So put the two side by side and watch what each one can actually do.',
  });
  tl.tween(cam, CAM_LEFT, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(leftU, 1, { at: 0.9, dur: 2.0, ease: ease.draw });
  tl.hold(7.0, 0.5);

  // — Beat 2 · the reviewer reads a story —
  tl.caption({
    at: 7.5,
    dur: 7,
    text: 'A reviewer reads the diff. But a diff is a story the author tells about the change — and reading a story, however carefully, you can only agree or disagree with it.',
  });
  tl.tween(eyeU, 1, { at: 8.1, dur: 3.6, ease: ease.linear });
  tl.tween(stampU, 1, { at: 12.2, dur: 0.7, ease: ease.pop });
  tl.hold(14.5, 0.5);

  // — Beat 3 · what it cannot see —
  tl.caption({
    at: 15.0,
    dur: 6.5,
    text: 'The reviewer cannot see the run. It cannot see the hunk the evidence never exercised, the test feeding on its own golden values, or the stream server left warm from development. None of that is in the text.',
  });
  tl.hold(21.5, 0.5);

  // — Beat 4 · the critic holds the session —
  tl.caption({
    at: 22.0,
    dur: 7.5,
    text: 'The critic starts from the other end: it holds the session itself. The builder’s claim cites a Replay recording of the final happy run — a recording a human can open and simply watch, traveling back and forth through time.',
  });
  tl.tween(cam, CAM_RIGHT, { at: 22.2, dur: 1.4, ease: ease.move });
  tl.tween(rightU, 1, { at: 22.6, dur: 2.0, ease: ease.draw });
  tl.tween(sweepU, 1, { at: 25.2, dur: 3.4, ease: ease.linear });
  tl.hold(29.5, 0.5);

  // — Beat 5 · and interrogates it —
  tl.caption({
    at: 30.0,
    dur: 6.5,
    text: 'The critic does the same thing programmatically, interrogating that recording through the Replay tools — exceptions, network, console, any moment after the fact — alongside the deterministic event logs and digests on the stream side.',
  });
  tl.hold(36.5, 0.5);

  // — Beat 6 · the six arms —
  tl.caption({
    at: 37.0,
    dur: 8,
    text: 'Then six attack arms fan out in parallel. Falsify with its own inputs. Audit whether every changed hunk actually ran. Hunt mocks and environment, from a cold clone. Sabotage the code in a scratch worktree to prove the tests can go red. Run the task’s own attacks, and fuzz. And interrogate the recording.',
  });
  tl.tween(armsU, 1, { at: 37.6, dur: 4.4, ease: ease.draw });
  tl.tween(findU, 1, { at: 42.6, dur: 0.8, ease: ease.pop });
  tl.hold(45.5, 0.5);

  // — Beat 7 · even findings get attacked —
  tl.caption({
    at: 46.0,
    dur: 6.5,
    text: 'And because a refutation is also a claim, every finding is cross-examined by yet another skeptic before it reaches the judge. Nothing in this loop — not even the criticism — gets taken on faith.',
  });
  tl.tween(xcheckU, 1, { at: 46.8, dur: 1.0, ease: ease.enter });
  tl.hold(52.5, 0.5);

  // — Beat 8 · the verdict on review —
  tl.caption({
    at: 53.0,
    dur: 6.5,
    text: 'That is the whole argument. A passive reviewer grades the story of the change. An adversarial critic re-executes the change and tries to break it — and only one of those catches the defect the diff never mentions.',
  });
  tl.tween(cam, CAM_SPLIT, { at: 53.2, dur: 1.5, ease: ease.move });
  tl.tween(leftDim, 1, { at: 54.7, dur: 1.4, ease: ease.move });
  tl.hold(59.5, 0.5);

  // — Beat 9 · recap —
  tl.caption({
    at: 60.0,
    dur: 8,
    text: 'So re-trace the loop. A claim must arrive tethered to evidence. The builder makes that evidence in its workshop — scratch work gitignored, durable artifacts committed. The critic attacks it from six directions, the budget keeps the rework honest, and only the critic can say verified.',
  });
  tl.tween(cam, CAM_WIDE, { at: 60.2, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 60.4, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 1, { at: 61.3, dur: 4.6, ease: ease.linear });
  tl.hold(68.0, 0.4);

  // — Beat 10 · the payoff —
  tl.caption({
    at: 68.4,
    dur: 6.5,
    text: 'Believe a bug report for free. Make it works pay its way — with a session anyone can open, watch, and interrogate. That is the electric forest loop, and it is why an adversary catches what a reader cannot.',
  });
  tl.tween(closeU, 1, { at: 69.4, dur: 1.0, ease: ease.enter });
  tl.hold(74.4, 1.4);

  return {
    tl, cam, leftU, eyeU, stampU, rightU, sweepU, armsU, findU,
    xcheckU, leftDim, dimU, recapU, closeU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const leftU = s.get(scene.leftU);
  const eyeU = s.get(scene.eyeU);
  const stampU = s.get(scene.stampU);
  const rightU = s.get(scene.rightU);
  const sweepU = s.get(scene.sweepU);
  const armsU = s.get(scene.armsU);
  const findU = s.get(scene.findU);
  const xcheckU = s.get(scene.xcheckU);
  const leftDim = s.get(scene.leftDim);
  const dimU = s.get(scene.dimU);
  const recapU = s.get(scene.recapU);
  const closeU = s.get(scene.closeU);

  const worldOp = 1 - 0.88 * dimU;
  const eyeY = LEFT.y + 96 + eyeU * (DIFF_LINES.length - 1) * 30;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- LEFT: the passive reviewer ---- */}
          {leftU > 0 && (
            <g opacity={Math.min(1, leftU * 2) * (1 - 0.8 * leftDim)}>
              <rect x={LEFT.x} y={LEFT.y} width={LEFT.w} height={LEFT.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={LEFT.x + 20} y={LEFT.y + 34} fill={colors.TEXT} fontSize={15} fontWeight={700}>
                passive review
              </text>
              <text x={LEFT.x + 20} y={LEFT.y + 56} fill={colors.MUTED} fontSize={11.5}>
                reads the diff — the story of the change
              </text>
              {DIFF_LINES.map((l, i) => {
                const u = clamp01(leftU * (DIFF_LINES.length + 1) - i);
                if (u <= 0) return null;
                const y = LEFT.y + 90 + i * 30;
                const c = l.sign === '+' ? colors.POSITIVE : l.sign === '-' ? colors.NEGATIVE : colors.MUTED;
                return (
                  <g key={i} opacity={u * 0.9}>
                    <text x={LEFT.x + 24} y={y + 10} fill={c} fontSize={13} fontFamily={MONO}>
                      {l.sign}
                    </text>
                    <rect x={LEFT.x + 44} y={y} width={l.w * u} height={12} rx={6} fill={c} opacity={0.35} />
                  </g>
                );
              })}
              {/* the reading eye */}
              {eyeU > 0 && eyeU < 1 && (
                <g transform={`translate(${LEFT.x + LEFT.w - 60} ${eyeY})`}>
                  <ellipse rx={16} ry={9} fill="none" stroke={colors.ACCENT} strokeWidth={1.6} />
                  <circle r={4} fill={colors.ACCENT} />
                </g>
              )}
              {stampU > 0 && (
                <g opacity={stampU} transform={`translate(${LEFT.x + LEFT.w / 2} ${LEFT.y + LEFT.h - 62}) rotate(-8)`}>
                  <rect x={-110} y={-22} width={220} height={44} rx={9} fill="none" stroke={colors.WARM} strokeWidth={2} />
                  <text y={-1} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={700}>
                    “looks good to me”
                  </text>
                  <text y={16} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
                    agree / disagree — with the story
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---- RIGHT: the adversarial critic ---- */}
          {rightU > 0 && (
            <g opacity={Math.min(1, rightU * 2)}>
              <rect x={RIGHT.x} y={RIGHT.y} width={RIGHT.w} height={RIGHT.h} rx={14} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.4} />
              <text x={RIGHT.x + 20} y={RIGHT.y + 34} fill={colors.TEXT} fontSize={15} fontWeight={700}>
                adversarial verification
              </text>
              <text x={RIGHT.x + 20} y={RIGHT.y + 56} fill={colors.MUTED} fontSize={11.5}>
                holds the session — and tries to break the claim
              </text>
              <RecordingStrip
                x={RIGHT.x + 24}
                y={RIGHT.y + 80}
                w={RIGHT.w - 48}
                h={26}
                points={TAPE_POINTS}
                reveal={rightU}
                u={sweepU}
                title="Replay recording — watch it, or query it, at any moment"
              />
              <text x={RIGHT.x + 24} y={RIGHT.y + 138} fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={sweepU > 0.2 ? 1 : 0}>
                + durable-stream event logs · digests (the deterministic layer)
              </text>
              {/* the six attack arms */}
              {armsU > 0 &&
                ARMS.map((a, i) => {
                  const u = clamp01(armsU * (ARMS.length + 1.5) - i);
                  if (u <= 0) return null;
                  const col = i % 2;
                  const row = Math.floor(i / 2);
                  const x = RIGHT.x + 24 + col * 222;
                  const y = RIGHT.y + 156 + row * 62;
                  return (
                    <g key={a.label} opacity={u} transform={`translate(0 ${(1 - u) * 8})`}>
                      <rect x={x} y={y} width={210} height={52} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.2} opacity={0.9} />
                      <text x={x + 12} y={y + 21} fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700}>
                        {a.label}
                      </text>
                      <text x={x + 12} y={y + 38} fill={colors.MUTED} fontSize={9} fontFamily={MONO}>
                        {a.sub}
                      </text>
                    </g>
                  );
                })}
              {/* a finding lands, cited */}
              {findU > 0 && (
                <g opacity={findU} transform={`translate(${RIGHT.x + 24} ${RIGHT.y + RIGHT.h - 52})`}>
                  <rect width={RIGHT.w - 48} height={30} rx={8} fill={colors.PANEL} stroke={xcheckU > 0.5 ? colors.POSITIVE : colors.WARM} strokeWidth={1.4} />
                  <text x={12} y={19} fill={xcheckU > 0.5 ? colors.POSITIVE : colors.WARM} fontSize={10.5} fontFamily={MONO}>
                    {xcheckU > 0.5 ? 'finding survived cross-examination → the judge' : 'finding: prediction · observed · citation — a point anyone can jump to'}
                  </text>
                </g>
              )}
              <text x={RIGHT.x + 24} y={RIGHT.y + RIGHT.h - 8} fill={colors.MUTED} fontSize={10} fontStyle="italic" opacity={armsU > 0.9 ? 0.9 : 0}>
                verify-task — six arms, then cross-examine, then the verdict
              </text>
            </g>
          )}
        </g>

        {/* ---- recap frames ---- */}
        {recapU > 0 && (
          <g>
            {RECAP.map((r, i) => {
              const u = clamp01(recapU * (RECAP.length + 1.2) - i);
              if (u <= 0) return null;
              const x = recapX(i);
              return (
                <g key={r.label} opacity={u} transform={`translate(0 ${(1 - u) * 16})`}>
                  <rect x={x - 100} y={RECAP_Y - 44} width={200} height={88} rx={12} fill={colors.PANEL} stroke={i === RECAP.length - 1 && recapU > 0.95 ? colors.POSITIVE : colors.GRID} strokeWidth={i === RECAP.length - 1 && recapU > 0.95 ? 1.8 : 1} />
                  <text x={x} y={RECAP_Y - 12} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700}>
                    {r.label}
                  </text>
                  <text x={x} y={RECAP_Y + 12} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
                    {r.sub}
                  </text>
                  {i < RECAP.length - 1 && u > 0.9 && (
                    <path d={`M ${x + 104} ${RECAP_Y} l 14 0 m -5 -5 l 5 5 l -5 5`} stroke={colors.MUTED} strokeWidth={1.6} fill="none" opacity={(u - 0.9) * 10} />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={300} y={420} width={680} height={120} rx={16} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
            <text x={640} y={470} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              believe “broken” for free · make “works” pay its way
            </text>
            <text x={640} y={502} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              a session anyone can open, watch, and interrogate
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
