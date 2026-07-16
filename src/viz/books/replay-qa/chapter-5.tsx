// Book scene — replay-qa, chapter 5: "Green Must Be Proven".
//
// The payoff chapter. A webhook arrives claiming the checkout bug is FIXED —
// and "fixed" is the expensive kind of claim, so it is recorded but not yet
// believed. The callback flips the bug's status, the journey re-queues (only
// once no other bugs on it are still open), and a FRESH run on a FRESH Replay
// recording walks the same path: at the moment that used to show a 500, the
// new tape shows a 200. That — not the webhook — is what green means. The
// finale pulls the camera wide and every run so far becomes a compounding
// coverage field: cells of the app heat up run over run, and every hot cell
// means "there is a recording in which this worked".
//
// Ground truth (~/Dev/loop-qa):
// - netlify/functions/lib/bugs.ts: webhookPayload() ships callback_url =
//   …/api/bug-fixed-webhook/{bug_id}.
// - netlify/functions/bug-fixed-webhook.ts: POST flips the bug to status
//   'fixed' via changeBugStatus, then triggerJourneyRetryIfReady(bugId).
// - netlify/functions/lib/journey-retry.ts: the journey re-runs only if the
//   project is active and NO bug on that journey version is still open;
//   then scheduleJourneyRun({ projectId, journeyId, goal }).
// - AppSpec.md: every run produces a Replay recording; bug status is
//   open/confirmed/fixed/dismissed; coverage grows "increasingly thorough
//   test coverage over time". Rediscovery of a fixed bug reopens it
//   (lib/bugs.ts duplicate handling).
import { CAMERA_HOME, Camera, Timeline, colors, ease, mulberry32 , cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MatrixGrid } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage is 1280×720; the caption strip owns y ≳ 630 — nothing lives there. */
const BUG = { x: 84, y: 96, w: 470 };
const QUEUE = { x: 84, y: 250, w: 470 };
const PATH_Y = 330;
const STEP_XS = [660, 812, 964, 1116];
const TAPE = { x: 620, y: 470, w: 540, h: 40 };
const GRID = { x: 292, y: 128, cell: 42, gap: 6, rows: 8, cols: 16 };

/* ------------------------------------------------------------------ data */
const JOURNEY_STEPS = ['browse', 'add to cart', 'checkout', 'pay'] as const;
/** the step whose moment used to fail — checkout */
const FIX_STEP = 2;

/** Compounding coverage: for each cell, the run index at which the agent
 *  first covered it. Seeded + biased so early runs cover the core journey
 *  band and later runs push outward — coverage visibly compounds. */
const N_RUNS = 12;
const FIRST_RUN: number[][] = (() => {
  const rand = mulberry32(7);
  const rows: number[][] = [];
  for (let i = 0; i < GRID.rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < GRID.cols; j++) {
      // distance from the "core journey" band (rows 3–4, left-to-mid columns)
      const d = Math.abs(i - 3.5) / 3.5 + Math.max(0, j - 4) / GRID.cols;
      row.push(Math.min(N_RUNS - 1, Math.floor(d * 7 + rand() * 5)));
    }
    rows.push(row);
  }
  return rows;
})();

/** Heat of a cell after `runs` runs: 0 until first covered, then deepens
 *  with every revisit. Pure, evaluated per frame (128 cells — cheap). */
const cellHeat = (i: number, j: number, runs: number) =>
  clamp01((runs - FIRST_RUN[i][j]) / 4);

/* ------------------------------------------------------------- cameras */
const CAM_BUG: CameraState = { x: 430, y: 300, k: 1.25 };
const CAM_RUN: CameraState = { x: 850, y: 380, k: 1.2 };
const CAM_MOMENT: CameraState = { x: STEP_XS[FIX_STEP], y: 400, k: 1.9 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const bugU = tl.channel('bugCard', 0);
  const postU = tl.channel('webhookPost', 0); // the POST packet flying in
  const fixedU = tl.channel('statusFlip', 0); // open → fixed chip morph
  const doubtU = tl.channel('claimNotProof', 0);
  const queueU = tl.channel('retryCheck', 0);
  const queueRows = tl.channel('retryRows', 0); // 0..2
  const gLeft = tl.channel('leftFade', 1);
  const pathU = tl.channel('journeyPath', 0); // rail draw-on
  const runU = tl.channel('runProgress', 0); // dot along the journey, 0..1
  const tapeU = tl.channel('freshTape', 0); // fresh recording grows with the run
  const insetU = tl.channel('momentInset', 0); // 200-where-the-500-lived
  const provenU = tl.channel('provenChip', 0);
  const gRun = tl.channel('runFade', 1);
  const gridU = tl.channel('coverageEnter', 0);
  const runsU = tl.channel('coverageRuns', 0); // 0..N_RUNS — THE compounding channel
  const counterU = tl.channel('runCounter', 0);
  const finaleU = tl.channel('finaleLine', 0);

  /* — beat 1 · the expensive claim arrives —————————————————————————— */
  let t = 0.5;
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'A webhook arrives: someone says the checkout bug is fixed. Notice what kind of claim that is. Fixed is the expensive kind — it gets recorded, but it does not get believed yet.',
  });
  tl.tween(cam, CAM_BUG, { at: t - 6.4, dur: 1.4, ease: ease.move });
  tl.tween(bugU, 1, { at: t - 6.2, dur: 0.7, ease: ease.enter });
  tl.tween(postU, 1, { at: t - 4.8, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.6);

  /* — beat 2 · status is a label, not evidence ———————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The callback flips the bug’s status to fixed. But a status is a label. Evidence is a recording — and there is no recording of this fix yet.',
  });
  tl.tween(fixedU, 1, { at: t - 5.2, dur: 0.7, ease: ease.pop });
  tl.tween(doubtU, 1, { at: t - 3.4, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 3 · the journey re-queues ————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'So the platform checks: is the project active, and is every other bug on this journey resolved? If so, the checkout journey is queued to run again — the claim has earned a test, not belief.',
  });
  tl.tween(queueU, 1, { at: t - 5.8, dur: 0.7, ease: ease.enter });
  tl.tween(queueRows, 2, { at: t - 5.0, dur: 1.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 4 · fresh run, fresh tape ————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'A fresh container spins up and a fresh run begins, with a brand-new Replay recording as its spine — because yesterday’s tape cannot prove today’s claim.',
  });
  tl.tween(gLeft, 0.15, { at: t - 5.6, dur: 0.9, ease: ease.move });
  tl.tween(cam, CAM_RUN, { at: t - 5.4, dur: 1.5, ease: ease.move });
  tl.tween(pathU, 1, { at: t - 4.2, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.5);

  /* — beat 5 · walking the same path ————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The agent walks the same journey, step by step: browse, add to cart, check out, pay — and every second of it lands on the new tape.',
  });
  tl.tween(runU, 1, { at: t - 5.8, dur: 4.6, ease: ease.linear });
  tl.tween(tapeU, 1, { at: t - 5.8, dur: 4.6, ease: ease.linear });
  t = tl.hold(t, 0.6);

  /* — beat 6 · the 200 where the 500 lived ——————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'And at the moment that used to fail, the new tape shows a two hundred where the five hundred lived. That — not the webhook — is what green means here.',
  });
  tl.tween(cam, CAM_MOMENT, { at: t - 6.2, dur: 1.5, ease: ease.move });
  tl.tween(insetU, 1, { at: t - 4.6, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* — beat 7 · or a reopening ————————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'If the fresh recording had shown the bug again, the fixed bug would have been reopened as a rediscovery — no arguing, just the tape. It didn’t. This fix has a recording behind it.',
  });
  tl.tween(provenU, 1, { at: t - 3.2, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 8 · pull back: the coverage field enters ———————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Now pull back — because every run so far has been part of something bigger than one bug.',
  });
  tl.tween(insetU, 0, { at: t - 5.4, dur: 0.6, ease: ease.move });
  tl.tween(gRun, 0, { at: t - 5.2, dur: 1.0, ease: ease.move });
  tl.tween(gLeft, 0, { at: t - 5.2, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: t - 5.0, dur: 1.8, ease: ease.move });
  tl.tween(gridU, 1, { at: t - 3.2, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 9 · coverage compounds ————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Each run explores a little more of the app — new pages, new journeys, new edge cases — and revisits what it already knows. Coverage compounds: run over run, the map fills in and deepens.',
  });
  tl.tween(runsU, N_RUNS, { at: t - 6.6, dur: 5.6, ease: ease.linear });
  tl.tween(counterU, 1, { at: t - 6.2, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 10 · what a hot cell means ————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'And every hot cell on that map means the same, precise thing. Not “we think this part works” — “there is a recording in which it worked”.',
  });
  t = tl.hold(t, 0.5);

  /* — beat 11 · the whole loop, closed ———————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'That is the whole loop. Broken is cheap to believe, so it gets checked. Works, fixed, green — those are the expensive claims, and every one of them ends the same way here: on tape.',
  });
  tl.tween(finaleU, 1, { at: t - 3.6, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 330, k: 1.02 }, { at: t - 3.6, dur: 2.4, ease: ease.move });
  tl.hold(t, 1.6);

  return {
    tl, cam, bugU, postU, fixedU, doubtU, queueU, queueRows, gLeft,
    pathU, runU, tapeU, insetU, provenU, gRun, gridU, runsU, counterU, finaleU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The bug card from chapter 4, with the incoming fixed claim. */
function BugCard({ u, post, fixed, doubt, proven, fade }: {
  u: number; post: number; fixed: number; doubt: number; proven: number; fade: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0 || fade <= 0.002) return null;
  const { x, y, w } = BUG;
  const p = clamp01(post);
  const f = clamp01(fixed);
  // the POST packet flies in from the right edge toward the card
  const px = x + w + 40 + (1 - p) * 320;
  return (
    <g opacity={fade}>
      <g transform={`translate(${x}, ${y + (1 - uu) * 12})`} opacity={uu}>
        <rect width={w} height={118} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
        <text x={18} y={28} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
          bug-002 · Checkout fails with 500 on payment
        </text>
        {/* status chip: open → fixed */}
        <rect x={18} y={44} width={64} height={24} rx={12} fill={f > 0.5 ? colors.POSITIVE : colors.WARM} opacity={0.2} />
        <text x={50} y={61} textAnchor="middle" fill={f > 0.5 ? colors.POSITIVE : colors.WARM} fontSize={11.5} fontWeight={700} fontFamily={mono}>
          {f > 0.5 ? 'fixed' : 'open'}
        </text>
        {clamp01(doubt) > 0 && (
          <text x={18} y={92} fill={colors.WARM} fontSize={12} fontWeight={700} fontFamily={mono} opacity={clamp01(doubt)}>
            claimed — no recording of the fix yet
          </text>
        )}
        {clamp01(proven) > 0 && (
          <g opacity={clamp01(proven)}>
            <rect x={94} y={44} width={78} height={24} rx={12} fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} />
            <text x={133} y={61} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontWeight={700} fontFamily={mono}>
              on tape
            </text>
          </g>
        )}
      </g>
      {p > 0.01 && p < 1 && (
        <circle cx={px} cy={y + 58} r={6} fill={colors.TEAL} opacity={0.95} />
      )}
      {p > 0.15 && (
        <text x={x + w + 12} y={y + 34} fill={colors.TEAL} fontSize={10.5} fontFamily={mono} opacity={Math.min(1, p * 2) * 0.9}>
          POST /api/bug-fixed-webhook/bug-002
        </text>
      )}
    </g>
  );
}

/** triggerJourneyRetryIfReady — the two preconditions, then the queue. */
function RetryPanel({ u, rows, fade }: { u: number; rows: number; fade: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || fade <= 0.002) return null;
  const { x, y, w } = QUEUE;
  const CHECKS = ['project active · journey approved', 'no other open bugs on this journey'];
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu * fade}>
      <rect width={w} height={116} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
      <text x={16} y={24} fill={colors.ACCENT} fontSize={12} fontWeight={700} fontFamily={mono}>
        triggerJourneyRetryIfReady(bug)
      </text>
      {CHECKS.map((c, i) => {
        const cu = clamp01(rows - i);
        if (cu <= 0) return null;
        return (
          <g key={i} opacity={cu}>
            <text x={20} y={48 + i * 22} fill={colors.POSITIVE} fontSize={12} fontFamily={mono}>✓</text>
            <text x={38} y={48 + i * 22} fill={colors.TEXT} fontSize={11.5} fontFamily={mono}>{c}</text>
          </g>
        );
      })}
      {rows > 1.6 && (
        <text x={16} y={102} fill={colors.SECONDARY} fontSize={11.5} fontWeight={700} fontFamily={mono} opacity={clamp01((rows - 1.6) / 0.4)}>
          → scheduleJourneyRun · journey: checkout
        </text>
      )}
    </g>
  );
}

/** The fresh run: journey steps, a traveling dot, and the growing new tape. */
function FreshRun({ path, run, tape, inset, fade }: {
  path: number; run: number; tape: number; inset: number; fade: number;
}) {
  const pu = clamp01(path);
  if (pu <= 0 || fade <= 0.002) return null;
  const r = clamp01(run);
  const x0 = STEP_XS[0] - 60;
  const x1 = STEP_XS[STEP_XS.length - 1];
  const dotX = x0 + (x1 - x0) * r;
  const iu = clamp01(inset);
  return (
    <g opacity={fade}>
      {/* the journey rail */}
      <line x1={x0} y1={PATH_Y} x2={x0 + (x1 - x0) * pu} y2={PATH_Y} stroke={colors.GRID} strokeWidth={2} />
      {STEP_XS.map((sx, i) => {
        const su = clamp01(pu * STEP_XS.length - i);
        if (su <= 0) return null;
        const passed = r > 0 && dotX >= sx - 1;
        return (
          <g key={i} opacity={su}>
            <circle cx={sx} cy={PATH_Y} r={9} fill={passed ? colors.POSITIVE : colors.PANEL} stroke={passed ? colors.POSITIVE : colors.MUTED} strokeWidth={1.6} opacity={passed ? 0.9 : 1} />
            {passed && (
              <text x={sx} y={PATH_Y + 4.5} textAnchor="middle" fill={colors.BG} fontSize={11} fontWeight={800}>✓</text>
            )}
            <text x={sx} y={PATH_Y - 20} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={mono}>
              {JOURNEY_STEPS[i]}
            </text>
          </g>
        );
      })}
      {r > 0 && r < 1 && <circle cx={dotX} cy={PATH_Y} r={6.5} fill={colors.ACCENT} />}

      {/* the fresh tape, growing in lockstep with the run */}
      {clamp01(tape) > 0 && (
        <g>
          <rect x={TAPE.x} y={TAPE.y} width={TAPE.w * clamp01(tape)} height={TAPE.h} rx={7} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
          <text x={TAPE.x} y={TAPE.y - 8} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
            fresh recording · rec-9c1d… (run-005)
          </text>
          {Array.from({ length: 12 }, (_, i) => {
            const hx = TAPE.x + 16 + i * 44;
            if (hx > TAPE.x + TAPE.w * clamp01(tape) - 12) return null;
            return <rect key={i} x={hx} y={TAPE.y + 4} width={7} height={4} rx={2} fill={colors.BG} opacity={0.8} />;
          })}
        </g>
      )}

      {/* the interrogated moment: 200 where the 500 lived */}
      {iu > 0 && (
        <g transform={`translate(${STEP_XS[FIX_STEP]}, ${PATH_Y + 34 + (1 - iu) * 8})`} opacity={iu}>
          <line x1={0} y1={-24} x2={0} y2={-2} stroke={colors.POSITIVE} strokeWidth={1.2} />
          <rect x={-150} y={0} width={300} height={58} rx={8} fill={colors.BG} opacity={0.94} />
          <rect x={-150} y={0} width={300} height={58} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={1.4} />
          <text x={-134} y={22} fill={colors.TEXT} fontSize={11} fontFamily={mono}>
            POST /api/checkout
          </text>
          <text x={-134} y={44} fill={colors.POSITIVE} fontSize={11.5} fontWeight={800} fontFamily={mono}>
            ← 200 OK
          </text>
          <text x={56} y={44} fill={colors.NEGATIVE} fontSize={10.5} fontFamily={mono} opacity={0.55} textDecoration="line-through">
            was 500
          </text>
        </g>
      )}
    </g>
  );
}

/** The compounding coverage field — heat deepens run over run. */
function CoverageField({ enter, runs, counter, finale }: {
  enter: number; runs: number; counter: number; finale: number;
}) {
  const eu = clamp01(enter);
  if (eu <= 0) return null;
  const values = FIRST_RUN.map((row, i) => row.map((_, j) => cellHeat(i, j, runs)));
  const gridW = GRID.cols * (GRID.cell + GRID.gap);
  const gridB = GRID.y + GRID.rows * (GRID.cell + GRID.gap);
  const cx = GRID.x + gridW / 2;
  const runCount = Math.max(1, Math.min(N_RUNS, Math.floor(runs) + 1));
  return (
    <g opacity={eu}>
      <text x={cx} y={GRID.y - 34} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={mono}>
        Acme Store · pages × journeys
      </text>
      <MatrixGrid
        x={GRID.x}
        y={GRID.y}
        values={values}
        cell={GRID.cell}
        gap={GRID.gap}
        cellU={(i, j) => clamp01(runs - FIRST_RUN[i][j] + 1)}
      />
      {clamp01(counter) > 0 && (
        <text x={cx} y={gridB + 26} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontWeight={700} fontFamily={mono} opacity={clamp01(counter)}>
          run {runCount} · {runCount} recordings
        </text>
      )}
      {clamp01(finale) > 0 && (
        <g opacity={clamp01(finale)}>
          <rect x={cx - 250} y={gridB + 42} width={500} height={36} rx={18} fill={colors.BG} opacity={0.92} />
          <text x={cx} y={gridB + 66} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={700}>
            Every expensive claim ends on tape.
          </text>
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const gLeft = s.get(scene.gLeft);
  const gRun = s.get(scene.gRun);
  return (
    <Camera {...s.get(scene.cam)}>
      <BugCard
        u={s.get(scene.bugU)}
        post={s.get(scene.postU)}
        fixed={s.get(scene.fixedU)}
        doubt={s.get(scene.doubtU)}
        proven={s.get(scene.provenU)}
        fade={gLeft}
      />
      <RetryPanel u={s.get(scene.queueU)} rows={s.get(scene.queueRows)} fade={gLeft} />
      <FreshRun
        path={s.get(scene.pathU)}
        run={s.get(scene.runU)}
        tape={s.get(scene.tapeU)}
        inset={s.get(scene.insetU)}
        fade={gRun}
      />
      <CoverageField
        enter={s.get(scene.gridU)}
        runs={s.get(scene.runsU)}
        counter={s.get(scene.counterU)}
        finale={s.get(scene.finaleU)}
      />
    </Camera>
  );
}
export const vizScene = () => scene;
