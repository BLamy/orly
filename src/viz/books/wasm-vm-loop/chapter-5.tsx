// Why the Critic Beats a Reviewer
//
// Backed by: wasm-vm AGENTS.md — the verifier charter's active moves that a
// passive diff-reader cannot make: "RUN THE TASK'S OWN ATTACKS ... with your
// own seeds, never the worker's", chaos-mode recordings (rr record --chaos),
// the MOCK & ENV HUNT and the cold-clone rule ("works on the implementer's
// machine is a refutation, not an excuse"), the sabotage check ("break the
// implementation in a scratch branch and confirm the worker's tests actually
// go red"), and COVERAGE (unexecuted diff is unproven or dead).
//
// Centerpiece: a split stage. Left, a reviewer reading a diff — its verdict
// can only be a stamp on the story the diff tells. Right, the critic
// physically re-running the tape with its own inputs: chaos runs fan out,
// the cold clone strips the environment, sabotage flips tests red. The left
// side dims; the recap re-traces the whole journey as five small frames.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

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

/** Five chaos-mode recordings fanning out (rr record --chaos). */
const CHAOS_N = 5;

/** The recap frames — the journey, re-traced. */
const RECAP = [
  { label: 'the queue', sub: 'tasks/QUEUE.md' },
  { label: 'the gates', sub: 'fmt → clippy → tests → wasm32' },
  { label: 'the tape', sub: 'rr trace + guest trace' },
  { label: 'the attack', sub: 'falsify + audit coverage' },
  { label: 'the ratchet', sub: 'promoted tests compound' },
];
const RECAP_Y = 300;
const recapX = (i: number) => 640 + (i - 2) * 226;

const CAM_LEFT: CameraState = { x: 330, y: 300, k: 1.28 };
const CAM_RIGHT: CameraState = { x: 950, y: 300, k: 1.28 };
const CAM_SPLIT: CameraState = { x: 640, y: 300, k: 1.05 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.0 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  leftU: ChannelRef<number>;
  eyeU: ChannelRef<number>;
  stampU: ChannelRef<number>;
  rightU: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  chaosU: ChannelRef<number>;
  cloneU: ChannelRef<number>;
  sabotageU: ChannelRef<number>;
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
  const chaosU = tl.channel('chaosU', 0);
  const cloneU = tl.channel('cloneU', 0);
  const sabotageU = tl.channel('sabotageU', 0);
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
    text: 'The reviewer cannot see the run. It cannot see the register that failed to sign extend, the buffer that grew unbounded, or the branch that never executed. None of that is in the text.',
  });
  tl.hold(21.5, 0.5);

  // — Beat 4 · the critic runs —
  tl.caption({
    at: 22.0,
    dur: 6.5,
    text: 'The critic starts from the other end. It does not read about the run — it holds the run, and replays it to any moment it likes.',
  });
  tl.tween(cam, CAM_RIGHT, { at: 22.2, dur: 1.4, ease: ease.move });
  tl.tween(rightU, 1, { at: 22.6, dur: 2.0, ease: ease.draw });
  tl.tween(sweepU, 1, { at: 25.0, dur: 3.0, ease: ease.linear });
  tl.hold(28.5, 0.5);

  // — Beat 5 · its own inputs —
  tl.caption({
    at: 29.0,
    dur: 7,
    text: 'Then it goes beyond the tape. It reruns the task with its own seeds, never the workers. For concurrency, it records under chaos mode five times, hunting for the interleaving that hangs.',
  });
  tl.tween(chaosU, 1, { at: 29.8, dur: 3.0, ease: ease.linear });
  tl.hold(36.0, 0.5);

  // — Beat 6 · cold clone + sabotage —
  tl.caption({
    at: 36.5,
    dur: 7.5,
    text: 'It strips the environment and reruns everything from a pristine clone — works on my machine is a refutation here, not an excuse. And once per task it breaks the code on purpose, to prove the tests can actually go red.',
  });
  tl.tween(cloneU, 1, { at: 37.2, dur: 1.6, ease: ease.draw });
  tl.tween(sabotageU, 1, { at: 40.4, dur: 1.6, ease: ease.linear });
  tl.hold(44.0, 0.5);

  // — Beat 7 · the verdict on review —
  tl.caption({
    at: 44.5,
    dur: 6.5,
    text: 'That is the whole argument. A passive reviewer grades the story of the change. An adversarial critic re-executes the change and tries to break it — and only one of those catches the edge case nobody wrote down.',
  });
  tl.tween(cam, CAM_SPLIT, { at: 44.7, dur: 1.5, ease: ease.move });
  tl.tween(leftDim, 1, { at: 46.2, dur: 1.4, ease: ease.move });
  tl.hold(51.0, 0.5);

  // — Beat 8 · recap —
  tl.caption({
    at: 51.5,
    dur: 8,
    text: 'So re-trace the loop. A queue hands out one task at a time. The worker clears its gates and records the final happy run. A fresh session attacks the tape, and a refutation sends the work back around.',
  });
  tl.tween(cam, CAM_WIDE, { at: 51.7, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 51.9, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 0.8, { at: 52.8, dur: 4.6, ease: ease.linear });
  tl.hold(59.5, 0.3);

  // — Beat 9 · the payoff —
  tl.caption({
    at: 59.8,
    dur: 7,
    text: 'Every verdict deposits new tests into the gates, so the machine gets harder to fool with every task it survives. Eighty seven verified so far — a whole emulator, built on runs you can replay, not stories you have to trust.',
  });
  tl.tween(recapU, 1, { at: 60.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 62.6, dur: 1.0, ease: ease.enter });
  tl.hold(66.8, 1.4);

  return {
    tl, cam, leftU, eyeU, stampU, rightU, sweepU, chaosU, cloneU,
    sabotageU, leftDim, dimU, recapU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const leftU = s.get(scene.leftU);
  const eyeU = s.get(scene.eyeU);
  const stampU = s.get(scene.stampU);
  const rightU = s.get(scene.rightU);
  const sweepU = s.get(scene.sweepU);
  const chaosU = s.get(scene.chaosU);
  const cloneU = s.get(scene.cloneU);
  const sabotageU = s.get(scene.sabotageU);
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
                re-runs the change — and tries to break it
              </text>
              <RecordingStrip
                x={RIGHT.x + 24}
                y={RIGHT.y + 80}
                w={RIGHT.w - 48}
                h={26}
                points={TAPE_POINTS}
                reveal={rightU}
                u={sweepU}
                title="rr replay — any moment, after the fact"
              />
              {/* chaos runs fan out */}
              {chaosU > 0 && (
                <g>
                  <text x={RIGHT.x + 24} y={RIGHT.y + 172} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                    rr record --chaos ×{CHAOS_N} · its own seeds
                  </text>
                  {Array.from({ length: CHAOS_N }, (_, i) => {
                    const u = clamp01(chaosU * (CHAOS_N + 1) - i);
                    if (u <= 0) return null;
                    const y = RIGHT.y + 188 + i * 16;
                    const bad = i === 3;
                    return (
                      <g key={i} opacity={u}>
                        <rect x={RIGHT.x + 24} y={y} width={(RIGHT.w - 48) * u} height={8} rx={4} fill={bad ? colors.NEGATIVE : colors.TEAL} opacity={bad ? 0.9 : 0.45} />
                        {bad && u > 0.9 && (
                          <text x={RIGHT.x + RIGHT.w - 24} y={y + 8} textAnchor="end" fill={colors.NEGATIVE} fontSize={9.5} fontFamily={MONO}>
                            divergence → finding
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}
              {/* cold clone */}
              {cloneU > 0 && (
                <g opacity={cloneU}>
                  <rect x={RIGHT.x + 24} y={RIGHT.y + 292} width={210} height={54} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.3} />
                  <text x={RIGHT.x + 36} y={RIGHT.y + 314} fill={colors.ACCENT} fontSize={11.5} fontWeight={700}>
                    cold clone
                  </text>
                  <text x={RIGHT.x + 36} y={RIGHT.y + 332} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
                    scratch dir · env scrubbed
                  </text>
                </g>
              )}
              {/* sabotage check */}
              {sabotageU > 0 && (
                <g opacity={Math.min(1, sabotageU * 2)}>
                  <rect x={RIGHT.x + 250} y={RIGHT.y + 292} width={206} height={54} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.3} />
                  <text x={RIGHT.x + 262} y={RIGHT.y + 314} fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700}>
                    sabotage check
                  </text>
                  <text x={RIGHT.x + 262} y={RIGHT.y + 332} fill={colors.MUTED} fontSize={10}>
                    break it — tests must go{' '}
                    <tspan fill={colors.NEGATIVE} fontWeight={700} opacity={clamp01(sabotageU * 2 - 1)}>
                      red
                    </tspan>
                  </text>
                </g>
              )}
              <text x={RIGHT.x + 24} y={RIGHT.y + RIGHT.h - 20} fill={colors.MUTED} fontSize={10.5} fontStyle="italic" opacity={cloneU}>
                verifier charter — AGENTS.md
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
            <rect x={310} y={420} width={660} height={120} rx={16} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
            <text x={640} y={470} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              runs you can replay, not stories you have to trust
            </text>
            <text x={640} y={502} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              87 / 228 verified · every claim survived an attack
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
