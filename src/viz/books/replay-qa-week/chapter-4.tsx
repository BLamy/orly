// Thursday: It Reads Your Pull Requests — the GitHub integration, from the
// user's side. A branch railway is the persistent object: a pull request
// forks off main, gets its own temporary preview of the app (a mini field of
// moments the agent walks), the verdict lands back on the pull request as a
// green check, and the branch merges. Below, the staging lane gets the
// deeper nightly walk. Last line: "And on Friday, we ship."
// Grounded in ~/Dev/loop-qa/docs/github-app/overview.md (PR opened → new
// version → QA task → Check Run + PR comment; deployed_url previews;
// requireApproval gating merges) — kept non-technical in the spoken lines.
import { Timeline, Camera, CAMERA_HOME, colors, ease, cameraInterp, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720, bottom y≳630 clear —————

const MAIN_Y = 380; // the main-branch rail
const PR_Y = 210; // the pull-request branch rail
const FORK_X = 300;
const MERGE_X = 1040;
const STAGE_LANE = { x: 150, y: 520, w: 980 };

const PREVIEW = { x: 560, y: 60, w: 300, h: 116 }; // the PR's temporary app copy
// mini field of moments inside the preview card
const rand = mulberry32(41);
const MINI = Array.from({ length: 60 }, () => ({
  x: PREVIEW.x + 18 + rand() * (PREVIEW.w - 36),
  y: PREVIEW.y + 34 + rand() * (PREVIEW.h - 52),
  o: 0.25 + rand() * 0.3,
}));
// the walk order lights mini dots left-to-right with jitter
const MINI_ORDER = MINI.map((d, i) => ({ i, k: d.x + rand() * 60 })).sort((a, b) => a.k - b.k).map((d) => d.i);
const MINI_RANK = MINI.map((_, i) => MINI_ORDER.indexOf(i));

// staging lane dots — the deeper nightly walk
const SRAND = mulberry32(7);
const STAGE_DOTS = Array.from({ length: 46 }, (_, i) => ({
  x: STAGE_LANE.x + 24 + (i / 46) * (STAGE_LANE.w - 48),
  y: STAGE_LANE.y + 26 + SRAND() * 36,
}));

const CAM_PR: CameraState = { x: 560, y: 240, k: 1.28 };
const CAM_CHECK: CameraState = { x: 950, y: 250, k: 1.5 };
const CAM_STAGE: CameraState = { x: 640, y: 460, k: 1.16 };
const CAM_WIDE: CameraState = { x: 640, y: 350, k: 0.94 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const railU = tl.channel('railU', 0); // main rail draw-on
  const forkU = tl.channel('forkU', 0); // PR branch draw-on
  const prCardU = tl.channel('prCardU', 0);
  const previewU = tl.channel('previewU', 0);
  const walkU = tl.channel('walkU', 0); // mini field lights up
  const commentU = tl.channel('commentU', 0); // results land on the PR
  const checkU = tl.channel('checkU', 0); // the green check
  const catchU = tl.channel('catchU', 0); // the red moment caught pre-merge
  const mergeU = tl.channel('mergeU', 0); // branch slides into main
  const stageU = tl.channel('stageU', 0); // staging lane
  const stageWalkU = tl.channel('stageWalkU', 0);
  const moonU = tl.channel('moonU', 0);
  const dimU = tl.channel('dimU', 0);
  const shipU = tl.channel('shipU', 0);

  // BEAT 0 — a pull request opens
  tl.caption({ at: 0.3, dur: 5.5, text: "Thursday is for the change you haven't shipped yet. Someone on your team opens a pull request — a proposed change, waiting for a thumbs up." });
  tl.tween(railU, 1, { at: 0.5, dur: 1.3, ease: ease.draw });
  tl.tween(forkU, 1, { at: 2.0, dur: 1.2, ease: ease.draw });
  tl.tween(prCardU, 1, { at: 3.2, dur: 0.7, ease: ease.enter });
  tl.hold(5.8, 0.8);

  // BEAT 1 — the app watches the repo
  tl.caption({ at: 6.9, dur: 5, text: 'Replay QA watches the repository. The moment that request opens, it treats the change as a brand new version of your app.' });
  tl.tween(cam, CAM_PR, { at: 7.1, dur: 1.6, ease: ease.move });
  tl.hold(11.9, 0.7);

  // BEAT 2 — a temporary preview
  tl.caption({ at: 12.8, dur: 5, text: 'The change gets its own temporary copy of the app — a preview, standing at its own address.' });
  tl.tween(previewU, 1, { at: 13.2, dur: 0.9, ease: ease.enter });
  tl.hold(17.8, 0.7);

  // BEAT 3 — the agent walks the preview
  tl.caption({ at: 18.7, dur: 5.5, text: 'And the agent walks that preview the way it walks everything else: a real browser, real clicks, and a movie of the whole visit.' });
  tl.tween(walkU, 1, { at: 19.0, dur: 4.6, ease: ease.linear });
  tl.hold(24.2, 0.7);

  // BEAT 4 — results land on the pull request
  tl.caption({ at: 25.1, dur: 5, text: 'The results come back to the pull request itself: a comment with what it walked, what it found, and the tape.' });
  tl.tween(commentU, 1, { at: 25.5, dur: 0.8, ease: ease.enter });
  tl.hold(30.1, 0.7);

  // BEAT 5 — the check next to the merge button
  tl.caption({ at: 31.0, dur: 5.5, text: "There's also a check right next to the merge button. Green means the walk passed — and if you like, merging can simply wait for that green." });
  tl.tween(cam, CAM_CHECK, { at: 31.2, dur: 1.5, ease: ease.move });
  tl.tween(checkU, 1, { at: 33.0, dur: 0.5, ease: ease.pop });
  tl.hold(36.5, 0.7);

  // BEAT 6 — caught while it's still a proposal
  tl.caption({ at: 37.4, dur: 5.5, text: 'So a bad change gets caught while it is still a proposal — on its preview, with its own movie — before it ever touches the version people use.' });
  tl.tween(catchU, 1, { at: 37.8, dur: 0.6, ease: ease.pop });
  tl.tween(catchU, 0, { at: 41.4, dur: 0.9, ease: ease.move });
  tl.tween(mergeU, 1, { at: 42.0, dur: 1.0, ease: ease.move });
  tl.hold(42.9, 0.7);

  // BEAT 7 — staging, nightly
  tl.caption({ at: 43.8, dur: 5.5, text: 'Your staging copy gets the same treatment on a schedule: the deeper walks, the long paths, every night while nobody is watching.' });
  tl.tween(cam, CAM_STAGE, { at: 44.0, dur: 1.6, ease: ease.move });
  tl.tween(stageU, 1, { at: 44.6, dur: 0.9, ease: ease.draw });
  tl.tween(moonU, 1, { at: 45.4, dur: 0.8, ease: ease.enter });
  tl.tween(stageWalkU, 1, { at: 45.8, dur: 3.2, ease: ease.linear });
  tl.hold(49.3, 0.7);

  // BEAT 8 — Thursday evening: green everywhere, movies attached
  tl.caption({ at: 50.2, dur: 5.5, text: 'By Thursday evening the change is green on its preview, green on staging, and every one of those greens carries its movie with it.' });
  tl.tween(cam, CAM_WIDE, { at: 50.4, dur: 1.8, ease: ease.move });
  tl.hold(55.7, 0.6);

  // BEAT 9 — the close
  tl.caption({ at: 56.5, dur: 4, text: 'And on Friday, we ship.' });
  tl.tween(dimU, 1, { at: 56.7, dur: 1.0, ease: ease.move });
  tl.tween(shipU, 1, { at: 57.5, dur: 0.7, ease: ease.enter });
  tl.hold(60.2, 1.2);

  return { tl, cam, railU, forkU, prCardU, previewU, walkU, commentU, checkU, catchU, mergeU, stageU, stageWalkU, moonU, dimU, shipU };
}

const scene = buildScene();

// ————— pure subcomponents —————

function Rail({ u, y, x0, x1, color, dash, fade }: { u: number; y: number; x0: number; x1: number; color: string; dash?: string; fade: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return <line x1={x0} y1={y} x2={x0 + (x1 - x0) * uu} y2={y} stroke={color} strokeWidth={3} strokeDasharray={dash} opacity={0.8 * fade} strokeLinecap="round" />;
}

/** The PR branch: fork arc up from main, run, and (on mergeU) an arc back. */
function BranchRail({ forkU, mergeU, fade }: { forkU: number; mergeU: number; fade: number }) {
  const fu = clamp01(forkU);
  if (fu <= 0) return null;
  const runX = FORK_X + 80 + (MERGE_X - FORK_X - 160) * fu;
  return (
    <g opacity={fade}>
      <path d={`M ${FORK_X} ${MAIN_Y} C ${FORK_X + 40} ${MAIN_Y}, ${FORK_X + 40} ${PR_Y}, ${FORK_X + 80} ${PR_Y}`} fill="none" stroke={colors.SECONDARY} strokeWidth={3} opacity={0.85} />
      <line x1={FORK_X + 80} y1={PR_Y} x2={runX} y2={PR_Y} stroke={colors.SECONDARY} strokeWidth={3} />
      {clamp01(mergeU) > 0 && (
        <path
          d={`M ${MERGE_X - 80} ${PR_Y} C ${MERGE_X - 40} ${PR_Y}, ${MERGE_X - 40} ${MAIN_Y}, ${MERGE_X} ${MAIN_Y}`}
          fill="none"
          stroke={colors.POSITIVE}
          strokeWidth={3}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - clamp01(mergeU)}
        />
      )}
    </g>
  );
}

function PrCard({ u, comment, check, catchP, fade }: { u: number; comment: number; check: number; catchP: number; fade: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const x = 920;
  const y = PR_Y - 64;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 10})`} opacity={e * fade}>
      <rect width={250} height={128} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={16} y={26} fontSize={12.5} fill={colors.TEXT} fontWeight={600}>
        pull request — “new checkout”
      </text>
      <text x={16} y={46} fontSize={11} fill={colors.MUTED} fontFamily={mono}>
        proposed change · awaiting review
      </text>
      {clamp01(comment) > 0 && (
        <g opacity={clamp01(comment)}>
          <rect x={12} y={58} width={226} height={30} rx={7} fill="rgba(148,163,184,0.08)" />
          <text x={20} y={77} fontSize={10.5} fill={colors.MUTED}>
            🤖 walked 6 paths · report + the tape
          </text>
        </g>
      )}
      {clamp01(check) > 0 && (
        <g opacity={clamp01(check)} transform={`translate(16, ${100})`}>
          <circle cx={7} cy={0} r={7} fill={colors.POSITIVE} />
          <text x={20} y={4} fontSize={11.5} fill={colors.POSITIVE} fontWeight={700}>
            Replay QA — passed
          </text>
        </g>
      )}
      {clamp01(catchP) > 0 && (
        <g opacity={clamp01(catchP)} transform="translate(16, 100)">
          <circle cx={7} cy={0} r={7} fill={colors.NEGATIVE} />
          <text x={20} y={4} fontSize={11.5} fill={colors.NEGATIVE} fontWeight={700}>
            caught on the preview — see the movie
          </text>
        </g>
      )}
    </g>
  );
}

/** The PR's temporary preview copy: a mini field the agent lights up. */
function PreviewCard({ u, walk, fade }: { u: number; walk: number; fade: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const w = clamp01(walk);
  return (
    <g opacity={e * fade}>
      <rect x={PREVIEW.x} y={PREVIEW.y} width={PREVIEW.w} height={PREVIEW.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} strokeDasharray="7 5" />
      <text x={PREVIEW.x + 14} y={PREVIEW.y + 22} fontSize={11.5} fill={colors.SECONDARY} fontFamily={mono}>
        preview — this change only
      </text>
      {MINI.map((d, i) => {
        const lit = clamp01(w * MINI.length - MINI_RANK[i]);
        return <circle key={i} cx={d.x} cy={d.y} r={2.4} fill={lit > 0 ? colors.TEAL : colors.MUTED} opacity={lit > 0 ? 0.4 + 0.6 * lit : d.o * 0.5} />;
      })}
      <path d={`M ${PREVIEW.x + PREVIEW.w / 2} ${PREVIEW.y + PREVIEW.h} C ${PREVIEW.x + PREVIEW.w / 2} ${PR_Y - 40}, ${640} ${PR_Y - 30}, ${660} ${PR_Y - 4}`} fill="none" stroke={colors.SECONDARY} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.5} />
    </g>
  );
}

function StagingLane({ u, walk, moon, fade }: { u: number; walk: number; moon: number; fade: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const w = clamp01(walk);
  return (
    <g opacity={e * fade}>
      <rect x={STAGE_LANE.x} y={STAGE_LANE.y} width={STAGE_LANE.w} height={78} rx={12} fill="rgba(13,19,33,0.6)" stroke={colors.GRID} strokeWidth={1.4} />
      <text x={STAGE_LANE.x + 14} y={STAGE_LANE.y + 20} fontSize={11.5} fill={colors.MUTED} fontFamily={mono}>
        staging — every night, the deep walk
      </text>
      {clamp01(moon) > 0 && (
        <text x={STAGE_LANE.x + STAGE_LANE.w - 26} y={STAGE_LANE.y + 24} fontSize={16} opacity={clamp01(moon)}>
          🌙
        </text>
      )}
      {STAGE_DOTS.map((d, i) => {
        const lit = clamp01(w * STAGE_DOTS.length - i);
        return <circle key={i} cx={d.x} cy={d.y} r={2.6} fill={lit > 0 ? colors.TEAL : colors.MUTED} opacity={lit > 0 ? 0.35 + 0.65 * lit : 0.2} />;
      })}
    </g>
  );
}

// ————— render —————

export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const fade = 1 - 0.88 * dim;
  const shipU = clamp01(s.get(scene.shipU));
  return (
    <>
      <Camera {...s.get(scene.cam)}>
        <g opacity={fade}>
          <text x={130} y={MAIN_Y - 14} fontSize={11.5} fill={colors.MUTED} fontFamily={mono}>
            main — the version people use
          </text>
        </g>
        <Rail u={s.get(scene.railU)} y={MAIN_Y} x0={120} x1={1160} color={colors.ACCENT} fade={fade} />
        <BranchRail forkU={s.get(scene.forkU)} mergeU={s.get(scene.mergeU)} fade={fade} />
        <PrCard u={s.get(scene.prCardU)} comment={s.get(scene.commentU)} check={s.get(scene.checkU)} catchP={s.get(scene.catchU)} fade={fade} />
        <PreviewCard u={s.get(scene.previewU)} walk={s.get(scene.walkU)} fade={fade} />
        <StagingLane u={s.get(scene.stageU)} walk={s.get(scene.stageWalkU)} moon={s.get(scene.moonU)} fade={fade} />
      </Camera>
      {/* the close — a quiet stage and one line */}
      {shipU > 0 && (
        <g opacity={shipU}>
          <rect x={0} y={0} width={1280} height={720} fill="rgba(10,14,26,0.82)" />
          <text x={640} y={340} textAnchor="middle" fill={colors.TEXT} fontSize={40} fontWeight={700}>
            And on Friday, we ship.
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
