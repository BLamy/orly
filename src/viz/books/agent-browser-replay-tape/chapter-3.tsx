// Book scene — agent-browser-replay-tape, chapter 3: "The Retry Loop at Close".
//
// ONE persistent object: the LoopRing polling loop plus a single recording
// status badge that changes classification as the loop laps it. Grounded in
// cli/src/main.rs's auto_upload_replay(): on `agent-browser close`, it calls
// select_most_recent_recording() up to 6 times, 1 second apart, running
// `replayio list --json` (falling back to `npx -y replayio list --json`),
// classifying the most recent recording as NotFinished (recordingStatus !=
// "finished"), AlreadyUploaded (uploadStatus uploaded/uploading), or Ready.
// Only Ready breaks the loop and runs `replayio upload <id>` (falling back to
// `npx replayio upload <id>` if the binary isn't found). If nothing is Ready
// after 6 tries, auto_upload_replay reports a specific error (not finished /
// already uploaded / no recordings found) instead of doing nothing silently.
// README.md: "set REPLAY_API_KEY" for this to work unattended in CI.
import { CAMERA_HOME, Camera, Timeline, colors, ease, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { LoopRing } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const RING = { cx: 470, cy: 320, r: 150 };
const BADGE = { x: 780, y: 240, w: 340 };
const CMD = { x: 780, y: 420, w: 340 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_RING: CameraState = { x: 500, y: 320, k: 1.05 };
const CAM_BADGE: CameraState = { x: 760, y: 320, k: 1.1 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.94 };

const STOPS = [{ label: 'replayio list --json' }, { label: 'classify' }, { label: 'sleep 1s' }];

type Status = 'checking' | 'not-finished' | 'already-uploaded' | 'ready' | 'uploading' | 'uploaded';
const STATUS_COLOR: Record<Status, string> = {
  checking: colors.MUTED,
  'not-finished': colors.WARM,
  'already-uploaded': colors.SECONDARY,
  ready: colors.POSITIVE,
  uploading: colors.ACCENT,
  uploaded: colors.POSITIVE,
};
const STATUS_LABEL: Record<Status, string> = {
  checking: 'checking…',
  'not-finished': 'NotFinished — still writing',
  'already-uploaded': 'AlreadyUploaded',
  ready: 'Ready',
  uploading: 'uploading…',
  uploaded: 'uploaded',
};

/** attempt (0..5) -> status, matching a plausible auto_upload_replay() trace. */
const ATTEMPT_STATUS: Status[] = ['not-finished', 'not-finished', 'ready', 'ready', 'ready', 'ready'];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const lapU = tl.channel('lapU', 0); // laps, fractional
  const attemptN = tl.channel('attemptN', 0); // which attempt just landed, for badge text
  const badgeU = tl.channel('badgeU', 0);
  const cmdU = tl.channel('cmdU', 0);
  const uploadedU = tl.channel('uploadedU', 0);
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · close triggers it — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Closing the browser does not just end the run. Agent browser close kicks off a loop, checking whether the recording is ready to hand off.',
  });
  tl.tween(cam, CAM_RING, { at: t - 5.0, dur: 1.4, ease: ease.move });
  tl.tween(ringU, 1, { at: t - 4.6, dur: 1.2, ease: ease.draw });
  tl.tween(badgeU, 1, { at: t - 2.4, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 2 · attempt 1: not finished — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'It asks Replay what it has, up to six times, a second apart. The first answer: the recording is still being written.',
  });
  tl.tween(attemptN, 1, { at: t - 4.8, dur: 0.1 });
  tl.tween(lapU, 1, { at: t - 4.8, dur: 2.0, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 3 · attempt 2: still not finished — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'It does not give up. One second later it asks again — same question, same patience.',
  });
  tl.tween(attemptN, 2, { at: t - 4.6, dur: 0.1 });
  tl.tween(lapU, 2, { at: t - 4.6, dur: 2.0, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 4 · attempt 3: ready — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'On the third try, the recording finishes writing. The loop reclassifies it as ready, and stops polling right there.',
  });
  tl.tween(attemptN, 3, { at: t - 5.0, dur: 0.1 });
  tl.tween(lapU, 3, { at: t - 5.0, dur: 2.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 5 · upload — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Ready means one thing happens next: agent browser runs replayio upload with that recording’s id, sending the tape to Replay.',
  });
  tl.tween(cam, CAM_BADGE, { at: t - 5.2, dur: 1.3, ease: ease.move });
  tl.tween(cmdU, 1, { at: t - 4.0, dur: 0.7, ease: ease.enter });
  tl.tween(attemptN, 4, { at: t - 2.4, dur: 0.1 });
  t = tl.hold(t, 0.5);

  /* — beat 6 · uploaded, and CI note — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'For that to happen without anyone watching — in continuous integration — the environment just needs a Replay access key set.',
  });
  tl.tween(uploadedU, 1, { at: t - 5.4, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 7 · the honest failure path — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'And if none of the six tries ever comes back ready, agent browser does not shrug — it reports exactly why: still writing, already uploaded, or nothing found.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.6, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.7);

  /* — beat 8 · close — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'One recording, safely off the machine. But that is only one of the two witnesses agent browser can leave behind.',
  });
  tl.tween(dimU, 1, { at: t - 4.8, dur: 1.2, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, cam, ringU, lapU, attemptN, badgeU, cmdU, uploadedU, dimU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The recording's classification, as it's re-checked lap over lap. */
function StatusBadge({ u, attempt, uploaded, dim }: { u: number; attempt: number; uploaded: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const idx = Math.max(0, Math.min(ATTEMPT_STATUS.length - 1, Math.round(attempt) - 1));
  const status: Status = uploaded > 0.5 ? 'uploaded' : attempt <= 0 ? 'checking' : ATTEMPT_STATUS[idx];
  const color = STATUS_COLOR[status];
  const { x, y, w } = BADGE;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={uu * (1 - 0.85 * clamp01(dim))}>
      <rect width={w} height={104} rx={12} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
      <text x={20} y={30} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        select_most_recent_recording()
      </text>
      <text x={20} y={58} fill={colors.TEXT} fontSize={16} fontWeight={700} fontFamily={mono}>
        attempt {Math.max(1, Math.round(attempt))} / 6
      </text>
      <text x={20} y={84} fill={color} fontSize={14.5} fontWeight={700} fontFamily={mono}>
        {STATUS_LABEL[status]}
      </text>
    </g>
  );
}

/** The upload command that runs once the badge reads Ready. */
function UploadCmd({ u, uploaded, dim }: { u: number; uploaded: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const up = clamp01(uploaded);
  const { x, y, w } = CMD;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu * (1 - 0.85 * clamp01(dim))}>
      <rect width={w} height={92} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={18} y={28} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        agent-browser close
      </text>
      <text x={18} y={54} fill={colors.ACCENT} fontSize={14} fontWeight={700} fontFamily={mono}>
        replayio upload &lt;id&gt;
      </text>
      {up > 0 && (
        <text x={18} y={78} fill={colors.POSITIVE} fontSize={12.5} fontWeight={700} fontFamily={mono} opacity={up}>
          ✓ uploaded to Replay
        </text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <LoopRing
        cx={RING.cx}
        cy={RING.cy}
        r={RING.r}
        stops={STOPS}
        u={s.get(scene.lapU)}
        reveal={s.get(scene.ringU)}
        dim={dim}
      />
      <StatusBadge u={s.get(scene.badgeU)} attempt={s.get(scene.attemptN)} uploaded={s.get(scene.uploadedU)} dim={dim} />
      <UploadCmd u={s.get(scene.cmdU)} uploaded={s.get(scene.uploadedU)} dim={dim} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
