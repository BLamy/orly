// Proof You Can Watch
//
// Backed by: replay.playwright.config.mjs (video: { mode: "on",
// size: { width: 1280, height: 720 } } — Playwright films every worker) and
// scripts/record-two-replays.mjs — findVideos() walks test-results for the
// .webm captures, then createSideBySideMp4() runs ffmpeg with
// "[0:v]scale=1280:720…[left];[1:v]…[right];[left][right]hstack=inputs=2[v]"
// to weld both films into one recordings/replay-<timestamp>.mp4.
//
// Machine: two film strips — Ada's capture and Linus's capture — playing in
// parallel, then physically sliding through the ffmpeg weld into ONE wide
// frame with a shared playhead sweeping both halves in sync. Payoff: two
// audiences — the deep interrogatable Replay recordings for the critic, one
// watchable film for the human.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const FILM_W = 400;
const FILM_H = 225; // 16:9
// apart → welded positions
const ADA_FROM = { x: 90, y: 150 };
const LINUS_FROM = { x: 790, y: 150 };
const WELD_Y = 200;
const ADA_TO = { x: 232, y: WELD_Y };
const LINUS_TO = { x: 232 + FILM_W + 4, y: WELD_Y };
const FFMPEG = { x: 640, y: 520 };
const CRITIC_TAPE = { x: 120, y: 560, w: 420, h: 18 };

const CAM_FILMS: CameraState = { x: 640, y: 280, k: 1.1 };
const CAM_FFMPEG: CameraState = { x: 640, y: 430, k: 1.18 };
const CAM_WELD: CameraState = { x: 640, y: 300, k: 1.08 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };

/** Sparse tape markers for the critic's half of the payoff. */
const TAPE_POINTS: RecordingPoint[] = [
  { at: 0.08, kind: 'interaction' },
  { at: 0.2, kind: 'network' },
  { at: 0.34, kind: 'render' },
  { at: 0.5, kind: 'interaction' },
  { at: 0.62, kind: 'network' },
  { at: 0.78, kind: 'render' },
  { at: 0.9, kind: 'network' },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const filmU = tl.channel('filmU', 0); // both strips enter
  const playU = tl.channel('playU', 0); // pre-weld parallel playback
  const ffmpegU = tl.channel('ffmpegU', 0); // the weld node
  const weldU = tl.channel('weldU', 0); // strips slide together
  const playheadU = tl.channel('playheadU', 0); // shared cursor over the welded frame
  const audienceU = tl.channel('audienceU', 0); // the two-audiences payoff
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  /* — beat 1 · the recordings are deep, not visible — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The two Replay recordings are the deep evidence — but you cannot glance at one. They are for interrogation, not for watching. So the loop also films itself.',
  });
  tl.tween(cam, CAM_FILMS, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 2 · playwright video: on — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The Playwright config turns video on for every worker, at the same twelve eighty by seven twenty frame. Two browsers, two films, shot simultaneously.',
  });
  tl.tween(filmU, 1, { at: t - 5.0, dur: 1.0, ease: ease.enter });
  tl.tween(playU, 0.5, { at: t - 3.6, dur: 3.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 3 · two halves of one event — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Watch them side by side and you realize they are two halves of one event. When Ada’s cursor hits send on the left, the message blooms on the right.',
  });
  tl.tween(playU, 1, { at: t - 5.2, dur: 4.6, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 4 · the weld — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'So the script hunts down both capture files and hands them to a video welder, with one instruction: scale each to the same height and stack them horizontally.',
  });
  tl.tween(cam, CAM_FFMPEG, { at: t - 5.4, dur: 1.4, ease: ease.move });
  tl.tween(ffmpegU, 1, { at: t - 4.6, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 5 · one wide frame — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The two films slide together into a single wide frame — Ada’s seat on the left, Linus’s on the right, sharing one clock.',
  });
  tl.tween(cam, CAM_WELD, { at: t - 5.2, dur: 1.6, ease: ease.move });
  tl.tween(weldU, 1, { at: t - 4.8, dur: 2.0, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 6 · the shared playhead — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Now one playhead sweeps both witnesses at once. Every claim from chapter two — the stagger, the crossing, the arrival — is something you can simply watch happen.',
  });
  tl.tween(playheadU, 1, { at: t - 5.2, dur: 4.8, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 7 · two audiences — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The loop now serves two audiences. The critic gets the recordings — every network hop and render, addressable to the millisecond. The human gets a film that takes thirty seconds to believe.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(audienceU, 1, { at: t - 4.8, dur: 1.4, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 8 · close — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'One is proof you can query. The other is proof you can watch. The earlier loop books ended by asking for exactly these two witnesses — here they are, produced by a single command.',
  });
  tl.tween(dimU, 1, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.2, dur: 0.7, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, filmU, playU, ffmpegU, weldU, playheadU, audienceU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** One filmed browser: sprocket-holed strip with a miniature chat replay. */
function FilmStrip({
  persona,
  from,
  to,
  weld,
  enter,
  play,
  playhead,
  dim,
}: {
  persona: 'Ada' | 'Linus';
  from: { x: number; y: number };
  to: { x: number; y: number };
  weld: number;
  enter: number;
  play: number;
  playhead: number;
  dim: number;
}) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const w = ease.move(clamp01(weld));
  const x = lerp(from.x, to.x, w);
  const y = lerp(from.y, to.y, w);
  const isAda = persona === 'Ada';
  // playback progress: parallel play pre-weld, shared playhead post-weld
  const p = clamp01(weld) > 0.98 ? Math.max(clamp01(playhead), clamp01(play)) : clamp01(play);
  const holes = 8;
  const msgN = Math.floor(p * 4.999); // 0..4 messages visible
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.85 * dim)}>
      <rect width={FILM_W} height={FILM_H} rx={6} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {/* sprocket holes */}
      {Array.from({ length: holes }, (_, i) => (
        <g key={i}>
          <rect x={14 + i * ((FILM_W - 28) / (holes - 1)) - 5} y={6} width={10} height={7} rx={2} fill={colors.BG} />
          <rect x={14 + i * ((FILM_W - 28) / (holes - 1)) - 5} y={FILM_H - 13} width={10} height={7} rx={2} fill={colors.BG} />
        </g>
      ))}
      {/* the filmed screen */}
      <rect x={16} y={22} width={FILM_W - 32} height={FILM_H - 44} rx={5} fill={colors.BG} opacity={0.7} />
      <text x={26} y={42} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        {isAda ? 'Ada Lovelace' : 'Linus Torvalds'} · room replay-…
      </text>
      {[0, 1, 2, 3].map((i) => {
        if (i >= msgN) return null;
        const mine = (i % 2 === 0) === isAda; // Ada sends 0 and 2
        return (
          <g key={i} transform={`translate(${26 + (mine ? 0 : 26)}, ${52 + i * 32})`}>
            <rect width={FILM_W - 84} height={24} rx={6} fill={mine ? colors.ACCENT : colors.SECONDARY} opacity={0.16} />
            <rect x={8} y={9} width={(FILM_W - 100) * (0.5 + 0.12 * ((i * 5) % 4))} height={6} rx={3} fill={mine ? colors.ACCENT : colors.SECONDARY} opacity={0.7} />
          </g>
        );
      })}
      {/* strip label */}
      <text x={16} y={FILM_H + 18} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        test-results/replay/…/{isAda ? 'ada' : 'linus'}…​.webm · 1280×720
      </text>
      {/* per-strip play cursor before the weld */}
      {clamp01(weld) < 0.98 && p > 0.01 && (
        <line x1={16 + (FILM_W - 32) * p} y1={22} x2={16 + (FILM_W - 32) * p} y2={FILM_H - 22} stroke={colors.WARM} strokeWidth={1.6} />
      )}
    </g>
  );
}

/** The welded result: one frame around both strips + the shared playhead. */
function WeldFrame({ weld, playhead, dim }: { weld: number; playhead: number; dim: number }) {
  const w = clamp01(weld);
  if (w < 0.98) return null;
  const x = ADA_TO.x - 10;
  const y = WELD_Y - 10;
  const width = FILM_W * 2 + 24;
  const height = FILM_H + 20;
  const p = clamp01(playhead);
  return (
    <g opacity={1 - 0.85 * clamp01(dim)}>
      <rect x={x} y={y} width={width} height={height} rx={9} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
      <text x={x} y={y - 12} fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
        recordings/replay-&lt;timestamp&gt;.mp4 — hstack=inputs=2
      </text>
      {p > 0.01 && (
        <g transform={`translate(${x + 10 + (width - 20) * p}, 0)`}>
          <line y1={y - 4} y2={y + height + 4} stroke={colors.WARM} strokeWidth={2} strokeLinecap="round" />
          <circle cy={y - 4} r={3.5} fill={colors.WARM} />
        </g>
      )}
    </g>
  );
}

function FfmpegNode({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${FFMPEG.x}, ${FFMPEG.y + (1 - uu) * 10})`} opacity={uu * (1 - 0.85 * clamp01(dim))}>
      <rect x={-260} y={-34} width={520} height={68} rx={11} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
      <text x={-240} y={-8} fill={colors.WARM} fontSize={13} fontFamily={MONO} fontWeight={700}>
        ffmpeg — createSideBySideMp4
      </text>
      <text x={-240} y={16} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        [0:v]scale=1280:720[left];[1:v]…[right];[left][right]hstack=inputs=2[v]
      </text>
    </g>
  );
}

/** The payoff: critic ← recordings, human ← film. */
function Audiences({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = clamp01(uu * 1.6);
  const b = clamp01(uu * 1.6 - 0.6);
  return (
    <g opacity={1 - 0.4 * clamp01(dim)}>
      <g opacity={a} transform={`translate(${CRITIC_TAPE.x}, ${CRITIC_TAPE.y - 44})`}>
        <text fill={colors.TEXT} fontSize={14} fontWeight={700}>
          for the critic
        </text>
        <text y={18} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
          app.replay.io — interrogate any moment
        </text>
      </g>
      <RecordingStrip
        x={CRITIC_TAPE.x}
        y={CRITIC_TAPE.y}
        w={CRITIC_TAPE.w}
        h={CRITIC_TAPE.h}
        points={TAPE_POINTS}
        reveal={a}
        u={b}
        title=""
      />
      <g opacity={b} transform={`translate(${760}, ${CRITIC_TAPE.y - 44})`}>
        <text fill={colors.TEXT} fontSize={14} fontWeight={700}>
          for the human
        </text>
        <text y={18} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
          one side-by-side film — press play
        </text>
        <g transform="translate(200, 34)">
          <circle r={16} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
          <path d="M -4 -7 l 11 7 l -11 7 Z" fill={colors.POSITIVE} />
        </g>
      </g>
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${120 + (1 - uu) * 12})`} opacity={uu}>
      <rect x={-330} y={-52} width={660} height={104} rx={14} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
      <text y={-10} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={700}>
        Proof you can query. Proof you can watch.
      </text>
      <text y={24} textAnchor="middle" fill={colors.MUTED} fontSize={14.5} fontFamily={MONO}>
        2 Replay recordings + recordings/replay-&lt;ts&gt;.mp4 — from one command
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const weld = s.get(scene.weldU);
  return (
    <>
      <FilmStrip
        persona="Ada"
        from={ADA_FROM}
        to={ADA_TO}
        weld={weld}
        enter={s.get(scene.filmU)}
        play={s.get(scene.playU)}
        playhead={s.get(scene.playheadU)}
        dim={dim}
      />
      <FilmStrip
        persona="Linus"
        from={LINUS_FROM}
        to={LINUS_TO}
        weld={weld}
        enter={clamp01(s.get(scene.filmU) * 1.3 - 0.3)}
        play={s.get(scene.playU)}
        playhead={s.get(scene.playheadU)}
        dim={dim}
      />
      <WeldFrame weld={weld} playhead={s.get(scene.playheadU)} dim={dim} />
      <FfmpegNode u={s.get(scene.ffmpegU) * (1 - clamp01(s.get(scene.audienceU) * 2))} dim={dim} />
      <Audiences u={s.get(scene.audienceU)} dim={dim} />
      <ClosingCard u={s.get(scene.closeU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
