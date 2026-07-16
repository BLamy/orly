// Book scene — agent-browser-replay-tape, chapter 4: "A Witness You Can Just Watch".
//
// ONE persistent object: a growing filmstrip that becomes a file, then gets
// attached directly into a message — set against the Replay tape from
// chapters 1-3, pulled back at the end for the throughline recap. Grounded in
// skills/agent-browser/references/video-recording.md: `agent-browser record
// start ./demo.webm` / `record stop` (aliases `record restart`) captures a
// local WebM (VP8/VP9, default format) on disk — independent of Replay Chrome
// and its cloud upload — meant to be watched directly: attached to a PR,
// embedded in a chat response as proof a flow worked, wrapped in `trap
// cleanup EXIT` so `record stop` always runs even on failure.
import { CAMERA_HOME, Camera, Timeline, colors, ease, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MessageCard } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const CMDLOG = { x: 100, y: 110, w: 460 };
const STRIP = { x: 620, y: 140, w: 300, h: 190 };
const FILE = { x: 660, y: 400, w: 220 };
const MSG = { x: 940, y: 380, w: 260 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_CMD: CameraState = { x: 340, y: 260, k: 1.16 };
const CAM_STRIP: CameraState = { x: 770, y: 260, k: 1.1 };
const CAM_FILE: CameraState = { x: 770, y: 420, k: 1.14 };
const CAM_MSG: CameraState = { x: 900, y: 400, k: 1.1 };
const CAM_RECAP: CameraState = { x: 640, y: 360, k: 0.9 };

const CMDS = [
  'agent-browser record start ./demo.webm',
  'agent-browser open https://app.example.com',
  'agent-browser click @e1',
  'agent-browser wait 500',
  'agent-browser screenshot ./step2.png',
  'agent-browser record stop',
];

const N_FRAMES = 10;

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const cmdU = tl.channel('cmdU', 0);
  const cmdLine = tl.channel('cmdLine', 0);
  const stripU = tl.channel('stripU', 0);
  const framesU = tl.channel('framesU', 0); // 0..N_FRAMES
  const fileU = tl.channel('fileU', 0);
  const msgU = tl.channel('msgU', 0);
  const recapU = tl.channel('recapU', 0);
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · the second path — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'There is a second, entirely separate way agent browser can leave a witness — one built to be watched, not interrogated.',
  });
  tl.tween(cam, CAM_CMD, { at: t - 5.2, dur: 1.4, ease: ease.move });
  tl.tween(cmdU, 1, { at: t - 4.6, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 2 · record start — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'Record start takes a file name, no Replay account involved, and begins capturing the screen straight to disk.',
  });
  tl.tween(cmdLine, 1, { at: t - 4.8, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_STRIP, { at: t - 3.6, dur: 1.2, ease: ease.move });
  tl.tween(stripU, 1, { at: t - 3.2, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 3 · the run, frame by frame — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Every step the agent takes — opening the page, clicking, a deliberate pause — becomes another frame in the strip while the run plays out.',
  });
  tl.tween(cmdLine, 4, { at: t - 5.4, dur: 3.6, ease: ease.linear });
  tl.tween(framesU, N_FRAMES * 0.8, { at: t - 5.4, dur: 3.6, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 4 · record stop — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'Record stop closes it out, and what is left is an ordinary video file — the same web format any browser plays.',
  });
  tl.tween(cmdLine, 6, { at: t - 4.6, dur: 1.0, ease: ease.linear });
  tl.tween(framesU, N_FRAMES, { at: t - 4.6, dur: 1.0, ease: ease.linear });
  tl.tween(cam, CAM_FILE, { at: t - 3.2, dur: 1.2, ease: ease.move });
  tl.tween(fileU, 1, { at: t - 2.4, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 5 · attach it directly — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'That file is small enough, and plain enough, to attach directly — to a pull request, or to a chat response, as proof a flow actually worked.',
  });
  tl.tween(cam, CAM_MSG, { at: t - 5.4, dur: 1.4, ease: ease.move });
  tl.tween(msgU, 1, { at: t - 4.0, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 6 · the recap: two witnesses — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'So a run always leaves a witness now — sometimes two: a Replay recording built for a debugger to interrogate later, and a local video built for a person to just watch.',
  });
  tl.tween(cam, CAM_RECAP, { at: t - 5.8, dur: 1.6, ease: ease.move });
  tl.tween(recapU, 1, { at: t - 4.6, dur: 0.9, ease: ease.enter });
  tl.tween(dimU, 0.7, { at: t - 4.6, dur: 0.9, ease: ease.move });
  t = tl.hold(t, 0.8);

  /* — beat 7 · close — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'Neither one depends on anyone remembering what happened. The run remembers for you.',
  });
  tl.hold(t, 1.2);

  return { tl, cam, cmdU, cmdLine, stripU, framesU, fileU, msgU, recapU, dimU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The command log — record start/stop bracketing an ordinary agent-browser run. */
function CmdLog({ enter, line, dim }: { enter: number; line: number; dim: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const { x, y, w } = CMDLOG;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 12})`} opacity={e * (1 - 0.85 * clamp01(dim))}>
      <rect width={w} height={CMDS.length * 30 + 32} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={20} y={26} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        agent-browser session
      </text>
      {CMDS.map((c, i) => {
        const ru = clamp01(line - i);
        const isBoundary = i === 0 || i === CMDS.length - 1;
        return (
          <text
            key={i}
            x={20}
            y={52 + i * 30}
            fill={isBoundary ? colors.ACCENT : colors.TEXT}
            fontWeight={isBoundary ? 700 : 400}
            fontSize={13}
            fontFamily={mono}
            opacity={ru}
          >
            {c}
          </text>
        );
      })}
    </g>
  );
}

/** A filmstrip growing frame by frame — the WebM being written to disk. */
function FilmStrip({ enter, frames, dim }: { enter: number; frames: number; dim: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const { x, y, w, h } = STRIP;
  const cellW = (w - 20) / N_FRAMES;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 12})`} opacity={e * (1 - 0.85 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={16} y={-14} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        ./demo.webm — capturing
      </text>
      {Array.from({ length: N_FRAMES }, (_, i) => {
        const fu = clamp01(frames - i);
        if (fu <= 0) return null;
        return (
          <rect
            key={i}
            x={10 + i * cellW}
            y={16}
            width={cellW - 4}
            height={h - 32}
            rx={4}
            fill={colors.BG}
            stroke={colors.SECONDARY}
            strokeWidth={1.3}
            opacity={0.4 + 0.6 * fu}
          />
        );
      })}
    </g>
  );
}

/** The finished file — an ordinary WebM, small and plain. */
function FileCard({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w } = FILE;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu * (1 - 0.85 * clamp01(dim))}>
      <rect width={w} height={92} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
      <text x={18} y={30} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        record stop →
      </text>
      <text x={18} y={56} fill={colors.TEXT} fontSize={15} fontWeight={700} fontFamily={mono}>
        demo.webm
      </text>
      <text x={18} y={78} fill={colors.SECONDARY} fontSize={12} fontFamily={mono}>
        VP8/VP9 · plays anywhere
      </text>
    </g>
  );
}

/** Two witnesses, side by side — the throughline recap. */
function Recap({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={uu * (1 - 0.3 * clamp01(dim))}>
      <g transform="translate(360, 300)">
        <rect width={260} height={110} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
        <text x={18} y={30} fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={mono}>
          Replay recording
        </text>
        <text x={18} y={56} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
          uploaded to the cloud
        </text>
        <text x={18} y={78} fill={colors.TEXT} fontSize={12.5}>
          for a debugger — any moment, later
        </text>
      </g>
      <g transform="translate(660, 300)">
        <rect width={260} height={110} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
        <text x={18} y={30} fill={colors.SECONDARY} fontSize={13} fontWeight={700} fontFamily={mono}>
          local WebM
        </text>
        <text x={18} y={56} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
          on disk, attach it anywhere
        </text>
        <text x={18} y={78} fill={colors.TEXT} fontSize={12.5}>
          for a person — watch it now
        </text>
      </g>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const recap = s.get(scene.recapU);
  return (
    <>
      <CmdLog enter={s.get(scene.cmdU) * (1 - recap)} line={s.get(scene.cmdLine)} dim={dim} />
      <FilmStrip enter={s.get(scene.stripU) * (1 - recap)} frames={s.get(scene.framesU)} dim={dim} />
      <FileCard u={s.get(scene.fileU) * (1 - recap)} dim={dim} />
      <MessageCard
        x={MSG.x}
        y={MSG.y}
        w={MSG.w}
        role="user"
        label="PR comment"
        text="Attaching demo.webm — reproduces the issue end to end."
        u={1}
        enter={s.get(scene.msgU) * (1 - recap)}
      />
      <Recap u={recap} dim={dim} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
