// The Critic Attacks
//
// Backed by: electric-forest AGENTS.md (Critic charter: predict then verify,
// coverage — hold the recording against the diff, mock & env hunt, run the
// task's own attacks with your own inputs, fuzz parsers/offsets/merge logic/
// concurrent writers, sabotage-check tests in a scratch worktree, every
// finding cites a point) and .claude/workflows/verify-task.js (the charter as
// a multi-agent attack: parallel critics — falsify / coverage / mock-env-hunt
// / sabotage (isolation: worktree) / attack-angles+fuzz / replay-critic via
// the Replay MCP; finding kinds include sabotage-survived and fuzz-crash;
// VERDICT: verified | refuted | needs-evidence).
//
// ONE persistent object: the recording tape from chapter 2 — now on the
// critic's bench. Attack arms fan out in parallel; the read head sweeps the
// tape; the diff is held against it hunk by hunk; a sabotage worktree proves
// the tests can go red; the verdict lands with a citation.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { DiffLanes, RecordingStrip } from '../../agent';
import type { DiffHunk, RecordingLink, RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const CRITIC = { x: 640, y: 96 };
const ARMS = [
  { label: 'falsify', color: colors.NEGATIVE },
  { label: 'coverage', color: colors.WARM },
  { label: 'mock-env-hunt', color: colors.SECONDARY },
  { label: 'sabotage', color: colors.NEGATIVE },
  { label: 'fuzz', color: colors.TEAL },
  { label: 'replay-critic', color: colors.ACCENT },
];
const ARM_SPREAD = 900;
const ARM_Y = 196;
const armX = (i: number) => CRITIC.x - ARM_SPREAD / 2 + (ARM_SPREAD / (ARMS.length - 1)) * i;

const TAPE = { x: 160, y: 300, w: 960, h: 28 };
const LANES = { x: 240, y: 400, w: 800 };
const WORKTREE = { x: 330, y: 260, w: 620, h: 260 };
const VERDICT = { x: 320, y: 300, w: 640, h: 150 };

const CAM_CRITIC: CameraState = { x: 640, y: 170, k: 1.3 };
const CAM_TAPE: CameraState = { x: 640, y: 310, k: 1.25 };
const CAM_LANES: CameraState = { x: 640, y: 460, k: 1.25 };
const CAM_TREE: CameraState = { x: 640, y: 390, k: 1.25 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 1.0 };

const POINTS: RecordingPoint[] = [
  { at: 0.1, kind: 'interaction', label: 'setup' },
  { at: 0.26, kind: 'network' },
  { at: 0.44, kind: 'interaction', label: 'the merge' },
  { at: 0.58, kind: 'render' },
  { at: 0.74, kind: 'network' },
  { at: 0.9, kind: 'render', label: 'digest shown' },
];

/** Sufficiency audit rows — E1-T09-flavored hunks (streamfs merge work). */
const HUNKS: { label: string; kind: DiffHunk['kind']; hits: number }[] = [
  { label: 'streamfs/src/merge.ts — ff guard', kind: 'executed', hits: 12 },
  { label: 'streamfs/src/merge.ts — refusal path', kind: 'needs-proof', hits: 0 },
  { label: 'client/src/adapter.ts — retry shim', kind: 'dead', hits: 0 },
  { label: 'streamfs/src/types.ts — event types', kind: 'waived', hits: 0 },
];

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  criticU: ChannelRef<number>;
  armsU: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  predU: ChannelRef<number>; // prediction card, before looking
  sweepU: ChannelRef<number>;
  linkPop: ChannelRef<number>;
  tapeDim: ChannelRef<number>;
  lanesU: ChannelRef<number>;
  hitsU: ChannelRef<number>;
  classU: ChannelRef<number>;
  lanesDim: ChannelRef<number>;
  treeU: ChannelRef<number>; // sabotage worktree
  mutU: ChannelRef<number>; // the injected mutation
  redU: ChannelRef<number>; // tests go red (good!)
  greenBadU: ChannelRef<number>; // ...or stay green (finding)
  fuzzU: ChannelRef<number>;
  treeDim: ChannelRef<number>;
  verdictU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const criticU = tl.channel('criticU', 0);
  const armsU = tl.channel('armsU', 0);
  const tapeU = tl.channel('tapeU', 0);
  const predU = tl.channel('predU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const linkPop = tl.channel('linkPop', 0);
  const tapeDim = tl.channel('tapeDim', 0);
  const lanesU = tl.channel('lanesU', 0);
  const hitsU = tl.channel('hitsU', 0);
  const classU = tl.channel('classU', 0);
  const lanesDim = tl.channel('lanesDim', 0);
  const treeU = tl.channel('treeU', 0);
  const mutU = tl.channel('mutU', 0);
  const redU = tl.channel('redU', 0);
  const greenBadU = tl.channel('greenBadU', 0);
  const fuzzU = tl.channel('fuzzU', 0);
  const treeDim = tl.channel('treeDim', 0);
  const verdictU = tl.channel('verdictU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · a fresh session —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Now the claim meets its adversary. The critic is a brand new session with no memory of writing the code — it read the spec, the diff, and the claim, and it wants to refute all three.',
  });
  tl.tween(cam, CAM_CRITIC, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(criticU, 1, { at: 1.2, dur: 0.8, ease: ease.enter });
  tl.hold(7.0, 0.6);

  // — Beat 2 · parallel attack arms —
  tl.caption({
    at: 7.6,
    dur: 7,
    text: 'And it does not attack alone. The verification workflow fans out parallel critics: one to falsify, one to audit coverage, one to hunt mocks, one to sabotage, one to fuzz, one to interrogate the recording.',
  });
  tl.tween(armsU, 1, { at: 8.0, dur: 2.8, ease: ease.draw });
  tl.hold(14.6, 0.6);

  // — Beat 3 · predict before looking —
  tl.caption({
    at: 15.2,
    dur: 7,
    text: 'The falsifier plays by one discipline: predict, then verify. For every acceptance criterion it writes down what the program state must be at a specific moment — before it looks.',
  });
  tl.tween(cam, CAM_TAPE, { at: 15.4, dur: 1.4, ease: ease.move });
  tl.tween(tapeU, 1, { at: 16.0, dur: 1.4, ease: ease.draw });
  tl.tween(predU, 1, { at: 17.8, dur: 0.8, ease: ease.enter });
  tl.hold(22.2, 0.6);

  // — Beat 4 · interrogate the recording —
  tl.caption({
    at: 22.8,
    dur: 7.5,
    text: 'Then it interrogates the recording — not a rerun that might behave differently, the actual session the builder cited. It jumps to any moment, evaluates expressions there, and reads the console and network around it.',
  });
  tl.tween(sweepU, 1, { at: 23.4, dur: 5.0, ease: ease.linear });
  tl.tween(linkPop, 1, { at: 28.0, dur: 0.6, ease: ease.pop });
  tl.hold(30.9, 0.6);

  // — Beat 5 · sufficiency: diff vs recording —
  tl.caption({
    at: 31.5,
    dur: 7,
    text: 'The second direction of attack is sufficiency. Hold the diff against the recording, hunk by hunk, and ask the embarrassing question: did this changed line ever actually run?',
  });
  tl.tween(predU, 0, { at: 31.7, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_LANES, { at: 31.8, dur: 1.4, ease: ease.move });
  tl.tween(lanesU, 1, { at: 32.5, dur: 2.2, ease: ease.draw });
  tl.tween(hitsU, 1, { at: 35.0, dur: 2.4, ease: ease.linear });
  tl.hold(38.9, 0.5);

  // — Beat 6 · classify every hunk —
  tl.caption({
    at: 39.4,
    dur: 7,
    text: 'Every hunk gets a verdict. Executed is fine. Never ran means prove it or lose it: unexercised code is either unproven — record a run that reaches it — or dead, and dead code gets deleted.',
  });
  tl.tween(classU, 1, { at: 39.8, dur: 2.6, ease: ease.draw });
  tl.hold(46.7, 0.6);

  // — Beat 7 · sabotage the worktree —
  tl.caption({
    at: 47.3,
    dur: 7.5,
    text: 'Then the nastiest trick in the book: sabotage. In a disposable copy of the repository, the critic deliberately breaks the implementation — inverts a condition, drops an event — and watches the tests.',
  });
  tl.tween(lanesDim, 1, { at: 47.5, dur: 0.9, ease: ease.move });
  tl.tween(tapeDim, 1, { at: 47.5, dur: 0.9, ease: ease.move });
  tl.tween(cam, CAM_TREE, { at: 47.7, dur: 1.4, ease: ease.move });
  tl.tween(treeU, 1, { at: 48.4, dur: 1.2, ease: ease.enter });
  tl.tween(mutU, 1, { at: 51.4, dur: 0.9, ease: ease.pop });
  tl.hold(55.0, 0.5);

  // — Beat 8 · red is the good outcome —
  tl.caption({
    at: 55.5,
    dur: 7,
    text: 'If the tests go red, good — they actually guard the behavior. If they stay green under sabotage, that is a finding in itself: a test suite that cannot fail cannot protect anything.',
  });
  tl.tween(redU, 1, { at: 56.2, dur: 0.7, ease: ease.pop });
  tl.tween(greenBadU, 1, { at: 59.4, dur: 0.8, ease: ease.enter });
  tl.hold(62.7, 0.5);

  // — Beat 9 · fuzz with your own inputs —
  tl.caption({
    at: 63.2,
    dur: 7,
    text: 'The critic also reruns the task’s own attack list with its own inputs, never the builder’s, and fuzzes whatever parses or merges: malformed events, out of order appends, concurrent writers, truncated streams.',
  });
  tl.tween(fuzzU, 1, { at: 63.8, dur: 4.4, ease: ease.linear });
  tl.hold(70.4, 0.6);

  // — Beat 10 · the verdict —
  tl.caption({
    at: 71.0,
    dur: 7,
    text: 'Every surviving finding is itself cross-examined, and then the verdict lands: verified, refuted, or needs evidence. Refutations come with citations — a point in the recording, an offset in the log — never vibes.',
  });
  tl.tween(treeDim, 1, { at: 71.2, dur: 0.9, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 71.3, dur: 1.4, ease: ease.move });
  tl.tween(verdictU, 1, { at: 72.2, dur: 1.0, ease: ease.enter });
  tl.hold(77.6, 0.5);

  // — Beat 11 · close —
  tl.caption({
    at: 78.1,
    dur: 5.5,
    text: 'A passive reviewer could only have read the story. The critic ran it, bent it, broke it on purpose, and demanded the recording account for every changed line.',
  });
  tl.tween(endDim, 1, { at: 78.4, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 79.2, dur: 0.9, ease: ease.enter });
  tl.hold(83.4, 1.2);

  return {
    tl, cam, criticU, armsU, tapeU, predU, sweepU, linkPop, tapeDim,
    lanesU, hitsU, classU, lanesDim, treeU, mutU, redU, greenBadU, fuzzU,
    treeDim, verdictU, endDim, endU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const criticU = s.get(scene.criticU);
  const armsU = s.get(scene.armsU);
  const tapeU = s.get(scene.tapeU);
  const predU = s.get(scene.predU);
  const sweepU = s.get(scene.sweepU);
  const linkPop = s.get(scene.linkPop);
  const tapeDim = s.get(scene.tapeDim);
  const lanesU = s.get(scene.lanesU);
  const hitsU = s.get(scene.hitsU);
  const classU = s.get(scene.classU);
  const lanesDim = s.get(scene.lanesDim);
  const treeU = s.get(scene.treeU);
  const mutU = s.get(scene.mutU);
  const redU = s.get(scene.redU);
  const greenBadU = s.get(scene.greenBadU);
  const fuzzU = s.get(scene.fuzzU);
  const treeDim = s.get(scene.treeDim);
  const verdictU = s.get(scene.verdictU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const worldOp = 1 - 0.85 * endDim;
  const links: RecordingLink[] = [{ at: 0.9, label: 'evaluated here', pop: linkPop }];

  const hunks: DiffHunk[] = HUNKS.map((h, i) => ({
    label: h.label,
    kind: h.kind,
    hits: h.hits * clamp01(hitsU * 2 - i * 0.3),
    u: clamp01(lanesU * (HUNKS.length + 1) - i),
    classU: clamp01(classU * (HUNKS.length + 1) - i),
  }));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the critic ---- */}
          {criticU > 0 && (
            <g opacity={criticU}>
              <circle cx={CRITIC.x} cy={CRITIC.y} r={28} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
              <circle cx={CRITIC.x} cy={CRITIC.y - 6} r={7.5} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
              <path d={`M ${CRITIC.x - 13} ${CRITIC.y + 15} q 13 -17 26 0`} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={CRITIC.x + 42} y={CRITIC.y - 2} fill={colors.TEXT} fontSize={14} fontWeight={700}>
                the critic
              </text>
              <text x={CRITIC.x + 42} y={CRITIC.y + 16} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                fresh session · goal: refute
              </text>
            </g>
          )}

          {/* ---- the parallel attack arms ---- */}
          {armsU > 0 &&
            ARMS.map((arm, i) => {
              const u = clamp01(armsU * (ARMS.length + 1.5) - i);
              if (u <= 0) return null;
              const ax = armX(i);
              return (
                <g key={arm.label} opacity={u}>
                  <line
                    x1={CRITIC.x}
                    y1={CRITIC.y + 30}
                    x2={CRITIC.x + (ax - CRITIC.x) * u}
                    y2={CRITIC.y + 30 + (ARM_Y - 16 - CRITIC.y - 30) * u}
                    stroke={arm.color}
                    strokeWidth={1.4}
                    opacity={0.55}
                  />
                  <rect x={ax - 62} y={ARM_Y - 14} width={124} height={28} rx={14} fill={colors.PANEL} stroke={arm.color} strokeWidth={1.5} />
                  <text x={ax} y={ARM_Y + 4.5} textAnchor="middle" fill={arm.color} fontSize={11.5} fontFamily={MONO} fontWeight={700}>
                    {arm.label}
                  </text>
                </g>
              );
            })}

          {/* ---- the recording under interrogation ---- */}
          <RecordingStrip
            x={TAPE.x}
            y={TAPE.y}
            w={TAPE.w}
            h={TAPE.h}
            points={POINTS}
            u={sweepU}
            reveal={tapeU}
            links={links}
            title="the builder’s recording — the session under oath"
            dim={tapeDim}
          />

          {/* ---- the prediction card ---- */}
          {predU > 0 && (
            <g opacity={predU * (1 - tapeDim)} transform={`translate(0 ${(1 - predU) * 10})`}>
              <rect x={TAPE.x} y={TAPE.y + 62} width={430} height={58} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
              <text x={TAPE.x + 14} y={TAPE.y + 84} fill={colors.WARM} fontSize={11.5} fontFamily={MONO} fontWeight={700}>
                prediction — written before looking
              </text>
              <text x={TAPE.x + 14} y={TAPE.y + 104} fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
                “target digest equals source digest at merge”
              </text>
            </g>
          )}

          {/* ---- the sufficiency lanes ---- */}
          {lanesU > 0 && (
            <DiffLanes x={LANES.x} y={LANES.y} w={LANES.w} hunks={hunks} title="the diff held against the recording" dim={lanesDim} />
          )}

          {/* ---- the sabotage worktree ---- */}
          {treeU > 0 && (
            <g opacity={treeU * (1 - 0.85 * treeDim)}>
              <rect x={WORKTREE.x} y={WORKTREE.y} width={WORKTREE.w} height={WORKTREE.h} rx={14} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.6} strokeDasharray="8 6" />
              <text x={WORKTREE.x + 18} y={WORKTREE.y + 28} fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO} fontWeight={700}>
                scratch worktree — disposable
              </text>
              <text x={WORKTREE.x + WORKTREE.w - 18} y={WORKTREE.y + 28} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                verify-task · sabotage · isolation: worktree
              </text>
              {/* the mutation */}
              <g transform={`translate(${WORKTREE.x + 40} ${WORKTREE.y + 62})`}>
                <rect width={330} height={64} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={14} y={26} fill={mutU > 0.3 ? colors.MUTED : colors.TEXT} fontSize={12.5} fontFamily={MONO} textDecoration={mutU > 0.3 ? 'line-through' : undefined}>
                  if (target.head === forkPoint)
                </text>
                {mutU > 0.3 && (
                  <text x={14} y={50} fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO} opacity={mutU}>
                    if (target.head !== forkPoint)
                  </text>
                )}
                {mutU > 0.5 && (
                  <text x={344} y={40} fill={colors.NEGATIVE} fontSize={11} fontStyle="italic" opacity={mutU}>
                    ← condition inverted
                  </text>
                )}
              </g>
              {/* tests react */}
              {redU > 0 && (
                <g transform={`translate(${WORKTREE.x + 40} ${WORKTREE.y + 156})`} opacity={redU}>
                  <rect width={240} height={44} rx={10} fill={colors.NEGATIVE} opacity={0.14} />
                  <rect width={240} height={44} rx={10} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} />
                  <text x={16} y={27} fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO} fontWeight={700}>
                    tests: 3 failed ✓ good
                  </text>
                </g>
              )}
              {greenBadU > 0 && (
                <g transform={`translate(${WORKTREE.x + 310} ${WORKTREE.y + 156})`} opacity={greenBadU}>
                  <rect width={270} height={44} rx={10} fill="none" stroke={colors.WARM} strokeWidth={1.6} />
                  <text x={16} y={19} fill={colors.WARM} fontSize={11.5} fontFamily={MONO} fontWeight={700}>
                    still green? → finding:
                  </text>
                  <text x={16} y={36} fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
                    sabotage-survived
                  </text>
                </g>
              )}
              {/* fuzz volley */}
              {fuzzU > 0 &&
                ['malformed event', 'out-of-order append', 'concurrent writers', 'truncated stream'].map((f, i) => {
                  const u = clamp01(fuzzU * 5 - i * 0.9);
                  if (u <= 0) return null;
                  const fx = WORKTREE.x + WORKTREE.w - 30 - u * 180;
                  const fy = WORKTREE.y + 70 + i * 34;
                  return (
                    <g key={f} opacity={Math.min(1, u * 2.5)}>
                      <circle cx={fx} cy={fy} r={4.5} fill={colors.TEAL} />
                      <text x={fx + 12} y={fy + 4} fill={colors.TEAL} fontSize={10.5} fontFamily={MONO} opacity={0.9}>
                        {f}
                      </text>
                    </g>
                  );
                })}
            </g>
          )}

          {/* ---- the verdict ---- */}
          {verdictU > 0 && (
            <g opacity={verdictU} transform={`translate(0 ${(1 - verdictU) * 14})`}>
              <rect x={VERDICT.x} y={VERDICT.y} width={VERDICT.w} height={VERDICT.h} rx={14} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.8} />
              <text x={VERDICT.x + 22} y={VERDICT.y + 34} fill={colors.NEGATIVE} fontSize={16} fontFamily={MONO} fontWeight={800}>
                VERDICT: refuted
              </text>
              <text x={VERDICT.x + 22} y={VERDICT.y + 64} fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
                • refusal path never executed in the recorded run
              </text>
              <text x={VERDICT.x + 22} y={VERDICT.y + 86} fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
                • citation: recording point + log offset …4821
              </text>
              <text x={VERDICT.x + 22} y={VERDICT.y + 112} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                demand: record a run that merges past an advanced target
              </text>
              <text x={VERDICT.x + VERDICT.w - 22} y={VERDICT.y + 34} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                verified | refuted | needs-evidence
              </text>
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={310} y={266} width={660} height={120} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={314} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              a review reads the story — an attack tests it
            </text>
            <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              falsify · cover · hunt · sabotage · fuzz · interrogate
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
