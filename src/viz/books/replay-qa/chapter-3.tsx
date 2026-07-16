// Book scene — replay-qa, chapter 3: "The Agent Reads the Tape".
//
// Bug discovery happens by interrogating the RECORDING, not by trusting the
// agent's memory of the run. The tape from chapter 2 returns as the
// persistent object; a warm playhead re-reads it end to end, and beneath it a
// MatrixGrid of moments × signals fills with heat as the playhead sweeps.
// One cell burns hotter than everything around it — the payment POST that
// came back 500 — the camera pushes into it, the moment gets a point link
// back into the tape, and only then does a bug crystallize.
//
// Grounded in replayio/loop-qa: AppSpec.md core loop step 2 ("The agent
// inspects the Replay recording and identifies bugs observed during the test
// run"; bugs link replay_recording_id + test_run_id) and scripts/seed-db.ts
// (bug-002 · critical · "Checkout fails with 500 error on payment
// submission", found on run-001, recording b5f2a3c1-7d4e-…, 240s run).
import { CAMERA_HOME, Camera, Timeline, colors, ease , cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MatrixGrid } from '../../primitives';
import { RecordingStrip, POINT_COLOR } from '../../agent';
import type { RecordingPoint, RecordingPointKind } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage 1280×720; the bottom ~12% (y ≳ 630) stays clear for captions. */
const TAPE = { x: 120, y: 140, w: 1040, h: 26 };
const MEMO = { x: 400, y: 250, w: 480, h: 110 };
const GRID = { x: 306, y: 268, cell: 56, gap: 5 };
const DETAIL = { x: 986, y: 300 };
const BUG_CARD = { x: 830, y: 470, w: 330, h: 118 };

const COLS = 12;
const ROWS = 4;
const ROW_LABELS = ['rrweb', 'network', 'console', 'exception'];
/** 12 slices of the 240-second run (seed-db: run-001 took 4m00s). */
const COL_LABELS = Array.from({ length: COLS }, (_, j) => `${j * 20}s`);

/** The hot cell: the payment POST that came back 500 (network, near the end). */
const HOT: [number, number] = [1, 10];

const CAM_GRID: CameraState = { x: 640, y: 380, k: 1.04 };
const CAM_HOT: CameraState = {
  x: GRID.x + HOT[1] * (GRID.cell + GRID.gap) + GRID.cell / 2,
  y: GRID.y + HOT[0] * (GRID.cell + GRID.gap) + GRID.cell / 2 + 30,
  k: 1.55,
};
const CAM_CLOSE: CameraState = { x: 640, y: 350, k: 0.98 };

/* ------------------------------------------------------------------ data */
/** The tape from chapter 2 — same session, same landmarks. */
const POINTS: RecordingPoint[] = [
  { at: 0.05, kind: 'render', label: 'load' },
  { at: 0.13, kind: 'network' },
  { at: 0.22, kind: 'render' },
  { at: 0.32, kind: 'interaction', label: 'add to cart' },
  { at: 0.4, kind: 'network' },
  { at: 0.47, kind: 'interaction', label: 'checkout' },
  { at: 0.55, kind: 'render' },
  { at: 0.63, kind: 'interaction' },
  { at: 0.7, kind: 'interaction' },
  { at: 0.79, kind: 'interaction', label: 'submit' },
  { at: 0.86, kind: 'network', label: 'POST' },
  { at: 0.92, kind: 'exception', label: '500' },
];

/**
 * Handcrafted activity heat, moments × signals, 0..1. The narrative lives in
 * the last columns: the payment POST (network, col 10) saturates, and the
 * exception row lights up right after it. Everything else is ordinary
 * traffic — page loads, clicks, renders.
 */
const HEAT: number[][] = [
  // rrweb: busy at load and around page transitions
  [0.9, 0.5, 0.3, 0.45, 0.3, 0.55, 0.4, 0.3, 0.25, 0.3, 0.35, 0.2],
  // network: asset fetches, cart + checkout calls, then THE POST
  [0.6, 0.35, 0.1, 0.4, 0.3, 0.45, 0.15, 0.1, 0.1, 0.2, 1.0, 0.15],
  // console: quiet murmur throughout
  [0.2, 0.1, 0.05, 0.15, 0.1, 0.2, 0.1, 0.05, 0.1, 0.05, 0.3, 0.15],
  // exception: silent until the very end
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.15, 0.95],
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tapeR = tl.channel('tapeReveal', 0);
  const memoU = tl.channel('memoU', 0); // the agent's memory — then it fades
  const playU = tl.channel('playhead', 0); // THE read head; the grid fills from it
  const gridU = tl.channel('gridFrame', 0);
  const spotU = tl.channel('spotU', 0); // highlight ring on the hot cell
  const detailU = tl.channel('detailU', 0);
  const linkU = tl.channel('pointLink', 0);
  const bugU = tl.channel('bugCard', 0);
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · what's left of the run — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'The run is over. The browser is gone. What remains is the tape — and one question: what actually happened in there?',
  });
  tl.tween(tapeR, 1, { at: t - 5.0, dur: 2.6, ease: ease.draw });
  t = tl.hold(t, 0.6);

  /* — beat 2 · memory is not evidence — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The agent could just tell you what it remembers. But a memory of a run is a summary, and a summary is where the details go to die.',
  });
  tl.tween(memoU, 1, { at: t - 5.6, dur: 0.7, ease: ease.enter });
  tl.tween(memoU, 0, { at: t - 1.6, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 3 · re-read, moment by moment — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'So it does something stricter. It puts the tape back in the machine and re-reads the recording, moment by moment.',
  });
  tl.tween(cam, CAM_GRID, { at: t - 5.0, dur: 1.6, ease: ease.move });
  tl.tween(gridU, 1, { at: t - 3.4, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.4);

  /* — beat 4 · moments × signals — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Slice the session into moments, and sort what each one contains: changes to the page, network traffic, console output, errors.',
  });
  tl.tween(playU, 0.35, { at: t - 5.2, dur: 5.2, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 5 · the sweep — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'As the playhead sweeps, the grid fills with heat — where the app was busy, where it was quiet. Most of it is ordinary.',
  });
  tl.tween(playU, 0.8, { at: t - 5.0, dur: 5.0, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 6 · one cell burns — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Then, near the end of the tape: one network cell burning hotter than everything around it.',
  });
  tl.tween(playU, 1, { at: t - 5.2, dur: 3.0, ease: ease.linear });
  tl.tween(spotU, 1, { at: t - 2.2, dur: 0.7, ease: ease.pop });
  tl.tween(cam, CAM_HOT, { at: t - 2.0, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.6);

  /* — beat 7 · ask the recording, not the memory — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The agent asks the recording directly: what was this request, and what came back? A request to the payment endpoint. Status five hundred.',
  });
  tl.tween(detailU, 1, { at: t - 4.4, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 8 · the point link — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'That moment gets a point link — an address into the tape that a human can click, and land on the exact instant it happened.',
  });
  tl.tween(cam, CAM_CLOSE, { at: t - 5.2, dur: 1.6, ease: ease.move });
  tl.tween(linkU, 1, { at: t - 3.4, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 9 · only now, a bug — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Now, and only now, does it become a bug: critical — checkout fails with a five hundred on payment submission — anchored to that moment on the recording.',
  });
  tl.tween(bugU, 1, { at: t - 4.6, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 10 · close: no trust required — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Notice what was never needed: trust in the agent’s recollection. Every fact came off the tape. Next: what a finding carries with it when it leaves the system.',
  });
  tl.tween(dimU, 1, { at: t - 5.4, dur: 1.2, ease: ease.move });
  tl.tween(detailU, 0, { at: t - 5.4, dur: 0.8, ease: ease.move });
  tl.hold(t, 1.2);

  return { tl, cam, tapeR, memoU, playU, gridU, spotU, detailU, linkU, bugU, dimU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The agent's memory of the run — a vague summary, soon dismissed. */
function MemoryCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = MEMO;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="6 5" />
      <text x={20} y={30} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        agent memory
      </text>
      <text x={20} y={60} fill={colors.TEXT} fontSize={16} fontStyle="italic" opacity={0.85}>
        “Something seemed to go wrong near the end,
      </text>
      <text x={20} y={84} fill={colors.TEXT} fontSize={16} fontStyle="italic" opacity={0.85}>
        around checkout... I think.”
      </text>
    </g>
  );
}

/** The interrogation result — read off the tape, not recalled. */
function DetailLabel({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const lines = ['POST /api/payment', 'status: 500', 'body: {error: "Internal…"}'];
  return (
    <g transform={`translate(${DETAIL.x}, ${DETAIL.y + (1 - uu) * 8})`} opacity={uu}>
      <rect x={-12} y={-24} width={214} height={82} rx={9} fill={colors.BG} opacity={0.85} />
      <rect x={-12} y={-24} width={214} height={82} rx={9} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} />
      {lines.map((ln, i) => (
        <text key={ln} y={i * 22 - 4} fill={i === 1 ? colors.NEGATIVE : colors.TEXT} fontSize={12.5} fontFamily={mono} fontWeight={i === 1 ? 700 : 400}>
          {ln}
        </text>
      ))}
    </g>
  );
}

/** The bug crystallizes — seed-db's bug-002, verbatim fields. */
function BugCard({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = BUG_CARD;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 12})`} opacity={uu * (1 - 0.3 * dim)}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
      <text x={18} y={26} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        bugs
      </text>
      <text x={18} y={50} fill={colors.NEGATIVE} fontSize={13} fontWeight={800} fontFamily={mono}>
        bug-002 · severity: critical
      </text>
      <text x={18} y={74} fill={colors.TEXT} fontSize={12.5}>
        Checkout fails with 500 error on
      </text>
      <text x={18} y={92} fill={colors.TEXT} fontSize={12.5}>
        payment submission
      </text>
      <text x={18} y={110} fill={colors.SECONDARY} fontSize={10.5} fontFamily={mono}>
        replay_recording_id: b5f2a3c1… · test_run_id: run-001
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const play = clamp01(s.get(scene.playU));
  const gridU = clamp01(s.get(scene.gridU));
  const spot = clamp01(s.get(scene.spotU));

  return (
    <>
      {/* THE persistent object — the tape, now being re-read */}
      <RecordingStrip
        x={TAPE.x}
        y={TAPE.y}
        w={TAPE.w}
        h={TAPE.h}
        points={POINTS}
        reveal={s.get(scene.tapeR)}
        u={play}
        links={[{ at: 0.86, label: 'point @ 3m41s', pop: s.get(scene.linkU) }]}
        title="recording b5f2a3c1-7d4e… — run-001, re-read"
      />

      <MemoryCard u={s.get(scene.memoU)} />

      {/* moments × signals — fills column by column as the playhead passes */}
      {gridU > 0.002 && (
        <g opacity={gridU * (1 - 0.85 * dim)}>
          <MatrixGrid
            x={GRID.x}
            y={GRID.y}
            values={HEAT}
            cell={GRID.cell}
            gap={GRID.gap}
            cellU={(_i, j) => clamp01(play * (COLS + 2) - j)}
            rowLabels={ROW_LABELS}
            colLabels={COL_LABELS}
            emphasize={0.9}
            highlight={{ cell: HOT, color: colors.NEGATIVE, u: spot }}
            labelSize={11.5}
          />
          <text x={GRID.x} y={GRID.y - 34} fill={colors.MUTED} fontSize={12}>
            what each moment contains — signals × time
          </text>
        </g>
      )}

      <DetailLabel u={s.get(scene.detailU)} />
      <BugCard u={s.get(scene.bugU)} dim={dim} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
