// Book scene — agent-browser-replay-tape, chapter 1: "Recorded, Not by Choice".
//
// ONE persistent object: a work-token running a gauntlet of launch checks,
// then landing in a launched browser with a permanent recording light. Grounded
// in agent-browser's src/browser.ts: requireReplayExecutablePath() throws a
// REPLAY_REQUIRED: -prefixed error (the boxed red banner is cli/src/output.rs's
// print_error_message, which special-cases that prefix) if the browser type
// isn't chromium, if Replay Chrome's runtime can't be resolved, or if it isn't
// installed for this platform (macOS arm64/x64, Linux x64 — Windows unsupported,
// told to run `agent-browser install`). Only after every gate passes does
// getReplayLaunchEnv() stamp RECORD_REPLAY_VERBOSE: '1' onto the launch — the
// recording is switched on before the page loads, not after.
import { CAMERA_HOME, Camera, Timeline, colors, ease, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { GauntletRail } from '../../agent';
import type { GauntletGate } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const RAIL = { x: 220, y: 300, w: 760 };
const BANNER = { x: 240, y: 440, w: 760 };
const BROWSER = { x: 460, y: 470, w: 360, h: 150 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_RAIL: CameraState = { x: 600, y: 300, k: 1.1 };
const CAM_BANNER: CameraState = { x: 620, y: 470, k: 1.08 };
const CAM_BROWSER: CameraState = { x: 640, y: 500, k: 1.14 };
const CAM_WIDE: CameraState = { x: 640, y: 400, k: 0.96 };

const GATES: { label: string }[] = [
  { label: 'browser === chromium' },
  { label: 'Replay Chrome resolves' },
  { label: 'installed for this platform' },
];

const BANNER_LINES = ['REPLAY_REQUIRED:', 'Replay Chrome is required to record every run.', 'Run: agent-browser install'];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const railU = tl.channel('railU', 0); // gauntlet reveal
  const g0 = tl.channel('g0', 0); // gate states, -1 fail .. 1 pass
  const g1 = tl.channel('g1', 0);
  const g2 = tl.channel('g2', 0);
  const tokenU = tl.channel('tokenU', -1); // token position, gate units
  const arcU = tl.channel('arcU', 0);
  const bannerU = tl.channel('bannerU', 0);
  const browserU = tl.channel('browserU', 0);
  const recDot = tl.channel('recDot', 0); // permanent recording light
  const envU = tl.channel('envU', 0);
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · the stakes — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Once an agent closes its browser, that session is gone — unless something caught it on the way out. Agent browser makes sure something always does.',
  });
  t = tl.hold(t, 0.6);

  /* — beat 2 · launch attempt, gates appear — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'Every launch runs a gauntlet first. Before any page loads, three checks decide whether this run is even allowed to start.',
  });
  tl.tween(cam, CAM_RAIL, { at: t - 5.0, dur: 1.4, ease: ease.move });
  tl.tween(railU, 1, { at: t - 4.4, dur: 1.2, ease: ease.draw });
  tl.tween(tokenU, 0, { at: t - 2.0, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 3 · gate 1: browser type — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'First: is this a chromium launch at all? Any other browser type fails here immediately — Replay only rides along with chromium.',
  });
  tl.tween(g0, 1, { at: t - 3.6, dur: 0.6, ease: ease.pop });
  tl.tween(tokenU, 1, { at: t - 3.4, dur: 1.0, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 4 · gate 2: resolves — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Second: can agent browser even resolve a Replay Chrome runtime on this machine? If it can not, the run stops right there.',
  });
  tl.tween(g1, 1, { at: t - 3.8, dur: 0.6, ease: ease.pop });
  tl.tween(tokenU, 2, { at: t - 3.6, dur: 1.0, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 5 · gate 3 fails, the bounce — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Third: is it actually installed for this platform — mac, or linux? Picture it missing. The token gets bounced, and a boxed error stops the whole run.',
  });
  tl.tween(g2, -1, { at: t - 4.6, dur: 0.5, ease: ease.pop });
  tl.tween(arcU, 1, { at: t - 4.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_BANNER, { at: t - 3.2, dur: 1.2, ease: ease.move });
  tl.tween(bannerU, 1, { at: t - 2.6, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* — beat 6 · a distinct kind of error — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'That box is not an ordinary command error. Its message is tagged, and it tells you exactly what to run: agent browser install.',
  });
  t = tl.hold(t, 0.6);

  /* — beat 7 · reset, the real run passes — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Now picture the machine that actually has it installed. Same three gates — and this time, every one of them opens.',
  });
  tl.tween(bannerU, 0, { at: t - 5.2, dur: 0.6, ease: ease.move });
  tl.tween(g2, 0, { at: t - 5.2, dur: 0.4, ease: ease.move });
  tl.tween(arcU, 0, { at: t - 4.8, dur: 0.1 });
  tl.tween(cam, CAM_RAIL, { at: t - 4.6, dur: 1.2, ease: ease.move });
  tl.tween(tokenU, 0, { at: t - 3.6, dur: 0.5, ease: ease.enter });
  tl.tween(g0, 1, { at: t - 3.2, dur: 0.4, ease: ease.pop });
  tl.tween(tokenU, 1, { at: t - 2.8, dur: 0.7, ease: ease.linear });
  tl.tween(g1, 1, { at: t - 2.1, dur: 0.4, ease: ease.pop });
  tl.tween(tokenU, 2, { at: t - 1.7, dur: 0.7, ease: ease.linear });
  tl.tween(g2, 1, { at: t - 1.0, dur: 0.4, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 8 · recording switched on before the page loads — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The moment it clears the last gate, the launch stamps a recording flag onto the browser environment. The tape is rolling before a single page loads.',
  });
  tl.tween(cam, CAM_BROWSER, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(browserU, 1, { at: t - 5.2, dur: 0.8, ease: ease.enter });
  tl.tween(envU, 1, { at: t - 3.4, dur: 0.8, ease: ease.enter });
  tl.tween(recDot, 1, { at: t - 2.4, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 9 · close: not optional — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'There is no flag to turn this off. For agent browser, being recorded is not a setting you choose — it is the price of admission.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.2, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: t - 4.2, dur: 1.0, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, cam, railU, g0, g1, g2, tokenU, arcU, bannerU, browserU, recDot, envU, dimU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The boxed REPLAY_REQUIRED banner — output.rs's print_error_message special case. */
function ReplayRequiredBanner({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w } = BANNER;
  const lineH = 30;
  const h = BANNER_LINES.length * lineH + 32;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu}>
      <rect width={w} height={h} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
      {BANNER_LINES.map((line, i) => (
        <text
          key={i}
          x={22}
          y={30 + i * lineH}
          fill={i === 0 ? colors.NEGATIVE : colors.TEXT}
          fontWeight={i === 0 ? 700 : 400}
          fontSize={14}
          fontFamily={mono}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** The launched browser — an env stamp and a recording light that never turns off. */
function LaunchedBrowser({ enter, envU, rec, dim }: { enter: number; envU: number; rec: number; dim: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const { x, y, w, h } = BROWSER;
  const ev = clamp01(envU);
  const r = clamp01(rec);
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 12})`} opacity={e * (1 - 0.85 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <rect x={14} y={12} width={w - 28} height={26} rx={13} fill={colors.BG} opacity={0.6} />
      {r > 0 && (
        <g>
          <circle cx={30} cy={25} r={5.5} fill={colors.NEGATIVE} opacity={0.35 * r} />
          <circle cx={30} cy={25} r={3.5} fill={colors.NEGATIVE} opacity={r} />
        </g>
      )}
      <text x={44} y={30} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
        chromium (Replay Chrome)
      </text>
      <g opacity={ev}>
        <text x={20} y={70} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
          launch env
        </text>
        <rect x={18} y={80} width={w - 36} height={30} rx={7} fill={colors.ACCENT} opacity={0.14} />
        <text x={28} y={100} fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={mono}>
          RECORD_REPLAY_VERBOSE: '1'
        </text>
      </g>
      {r > 0 && (
        <text x={20} y={h - 16} fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700} fontFamily={mono} opacity={r}>
          ● recording
        </text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const gates: GauntletGate[] = [
    { label: GATES[0].label, state: s.get(scene.g0) },
    { label: GATES[1].label, state: s.get(scene.g1) },
    { label: GATES[2].label, state: s.get(scene.g2) },
  ];
  return (
    <>
      <GauntletRail
        x={RAIL.x}
        y={RAIL.y}
        w={RAIL.w}
        gates={gates}
        u={s.get(scene.tokenU)}
        reveal={s.get(scene.railU)}
        arcU={s.get(scene.arcU)}
        arcFrom={2}
        dim={dim}
      />
      <ReplayRequiredBanner u={s.get(scene.bannerU)} />
      <LaunchedBrowser enter={s.get(scene.browserU)} envU={s.get(scene.envU)} rec={s.get(scene.recDot)} dim={dim} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
