// Book scene — agent-browser-replay-tape, chapter 2: "What the Tape Is Made Of".
//
// ONE persistent object: the RecordingStrip tape, growing beneath a live
// command console as the agent drives agent-browser's own CLI vocabulary
// (skills/agent-browser/references/commands.md: open, snapshot -i, click,
// fill, press). Every command the agent issues throws an event onto the
// tape as the browser executes it — reusing replay-qa/chapter-2's flight-arc
// pattern, re-grounded in agent-browser's command set rather than a scripted
// browser journey. RECORD_ALL_CONTENT / RECORD_REPLAY_VERBOSE (src/browser.ts)
// is what makes every one of these observable, not just the visible ones.
import { CAMERA_HOME, Camera, Timeline, colors, ease, mulberry32, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ParticleCloud } from '../../primitives';
import type { ParticlePoint } from '../../primitives';
import { RecordingStrip, POINT_COLOR } from '../../agent';
import type { RecordingPoint, RecordingPointKind } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const CONSOLE = { x: 100, y: 96, w: 560, h: 330 };
const TAPE = { x: 100, y: 540, w: 1080, h: 24 };
const LEGEND = { x: 100, y: 478 };

const CAM_CONSOLE: CameraState = { x: 380, y: 262, k: 1.24 };
const CAM_TAPE: CameraState = { x: 640, y: 432, k: 1.12 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };

/* ------------------------------------------------------------------ data */
/** agent-browser's own command vocabulary, in a plausible run order. */
interface Cmd {
  emit: number;
  cmd: string;
  kind: RecordingPointKind;
  at: number;
  label?: string;
}
const rand = mulberry32(11);
const CMDS: Cmd[] = (() => {
  const spec: [number, string, RecordingPointKind, string?][] = [
    [0.03, 'agent-browser open https://app.example.com', 'network', 'load'],
    [0.09, 'render: DOM snapshot', 'render'],
    [0.16, 'agent-browser snapshot -i', 'render'],
    [0.24, 'agent-browser click @e1', 'interaction', 'click'],
    [0.3, 'render: DOM snapshot', 'render'],
    [0.37, 'agent-browser fill @e2 "search term"', 'interaction'],
    [0.44, 'render: DOM snapshot', 'render'],
    [0.5, 'agent-browser press Enter', 'interaction'],
    [0.57, 'agent-browser open https://app.example.com/results', 'network'],
    [0.63, 'render: DOM snapshot', 'render'],
    [0.7, 'agent-browser get text @e5', 'render'],
    [0.78, 'agent-browser click @e7', 'interaction'],
    [0.85, 'network: request failed', 'exception', 'error'],
    [0.92, 'render: DOM snapshot', 'render'],
  ];
  return spec.map(([emit, cmd, kind, label]) => ({ emit, cmd, kind, label, at: 0.03 + emit * 0.93 }));
})();

const POINTS: RecordingPoint[] = CMDS.map((c) => ({ at: c.at, kind: c.kind, label: c.label }));

const LEGEND_ROWS: { kind: RecordingPointKind; label: string }[] = [
  { kind: 'interaction', label: 'clicks, fills, key presses' },
  { kind: 'network', label: 'navigations & requests' },
  { kind: 'render', label: 'DOM snapshots' },
  { kind: 'exception', label: 'failures' },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const consoleE = tl.channel('consoleE', 0);
  const runP = tl.channel('runP', 0); // console line reveal + tape reveal, one clock
  const legendU = tl.channel('legendU', 0);
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · the console — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'This is what an agent actually sends: one command line at a time — open, snapshot, click, fill.',
  });
  tl.tween(consoleE, 1, { at: t - 4.8, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_CONSOLE, { at: t - 4.4, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 2 · tape appears — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'Look at the bottom of the frame. Every one of those commands is about to throw an event onto a tape as it runs.',
  });
  tl.tween(cam, CAM_TAPE, { at: t - 3.4, dur: 1.4, ease: ease.move });
  tl.tween(legendU, 1, { at: t - 4.2, dur: 1.0, ease: ease.enter });
  tl.tween(runP, 0.14, { at: t - 4.6, dur: 3.2, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 3 · navigation + snapshot — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Opening the page and snapshotting the accessibility tree both land on the tape — a navigation, then a full render.',
  });
  tl.tween(runP, 0.35, { at: t - 5.2, dur: 5.2, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 4 · interactions — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'A click, a fill, a key press — each one is its own point, timestamped, sitting right next to the render it caused.',
  });
  tl.tween(runP, 0.58, { at: t - 5.2, dur: 5.2, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 5 · a second navigation, then a failure — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The agent moves to a results page, reads some text, clicks again — and this time a request fails outright.',
  });
  tl.tween(runP, 0.94, { at: t - 5.4, dur: 5.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 6 · nothing was hand-picked — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Nobody chose which of those to keep. Interactions, navigations, renders, and the one failure all land the same way, automatically.',
  });
  tl.tween(runP, 1, { at: t - 5.4, dur: 1.0, ease: ease.linear });
  tl.tween(cam, CAM_WIDE, { at: t - 3.0, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.6);

  /* — beat 7 · close: this is one run's worth — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'This tape is one run, start to finish. What happens to it depends on how the run ends — and that is next.',
  });
  tl.tween(dimU, 1, { at: t - 5.2, dur: 1.2, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, cam, consoleE, runP, legendU, dimU };
}

const scene = buildScene();

/* -------------------------------------------- per-frame particle compute */
const FLIGHT = 0.06;

const PTS: ParticlePoint[] = CMDS.map(() => ({ x: 0, y: 0, r: 3, alpha: 0, color: colors.MUTED }));
const OUT: ParticlePoint[] = [];

function computeParticles(s: SceneState): ParticlePoint[] {
  const p = s.get(scene.runP);
  OUT.length = 0;
  if (p <= 0) return OUT;
  for (let i = 0; i < CMDS.length; i++) {
    const c = CMDS[i];
    const u = (p - c.emit) / FLIGHT;
    if (u <= 0 || u >= 1) continue;
    const uu = ease.move(clamp01(u));
    const fx = CONSOLE.x + CONSOLE.w - 24;
    const fy = CONSOLE.y + 44 + i * 20;
    const tx = TAPE.x + c.at * TAPE.w;
    const ty = TAPE.y + TAPE.h / 2;
    const mx = (fx + tx) / 2 + 30;
    const my = Math.min(fy, ty) - 50;
    const a = 1 - uu;
    const pt = PTS[i];
    pt.x = a * a * fx + 2 * a * uu * mx + uu * uu * tx;
    pt.y = a * a * fy + 2 * a * uu * my + uu * uu * ty;
    pt.r = c.kind === 'exception' ? 4.5 : 3;
    pt.color = POINT_COLOR[c.kind];
    pt.alpha = Math.min(1, u * 6);
    OUT.push(pt);
  }
  return OUT;
}

/* -------------------------------------------------- local subcomponents */

/** The command console — agent-browser's own CLI, one line revealed per emitted event. */
function Console({ enter, runP, dim }: { enter: number; runP: number; dim: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const { x, y, w, h } = CONSOLE;
  const shown = CMDS.filter((c) => runP >= c.emit).length;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.85 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <rect x={14} y={12} width={w - 28} height={26} rx={13} fill={colors.BG} opacity={0.6} />
      <circle cx={30} cy={25} r={4} fill={colors.ACCENT} opacity={0.9} />
      <text x={44} y={30} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        agent-browser session
      </text>
      {CMDS.slice(0, shown).map((c, i) => {
        const rowU = clamp01((runP - c.emit) * 20);
        return (
          <text
            key={i}
            x={20}
            y={62 + i * 20}
            fill={c.kind === 'exception' ? colors.NEGATIVE : colors.TEXT}
            fontSize={12.5}
            fontFamily={mono}
            opacity={rowU}
          >
            {c.cmd}
          </text>
        );
      })}
    </g>
  );
}

/** What the tape is made of — agent-browser's own signal families. */
function Legend({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${LEGEND.x}, ${LEGEND.y})`} opacity={uu * (1 - 0.6 * dim)}>
      {LEGEND_ROWS.map((r, i) => {
        const ru = clamp01(uu * 5 - i);
        return (
          <g key={r.kind} transform={`translate(${i * 260}, 0)`} opacity={ru}>
            <circle cx={6} cy={-4} r={5} fill={POINT_COLOR[r.kind]} />
            <text x={18} y={0} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
              {r.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const runP = s.get(scene.runP);
  return (
    <>
      <Console enter={s.get(scene.consoleE)} runP={runP} dim={dim} />
      <Legend u={s.get(scene.legendU)} dim={dim} />

      <ParticleCloud state={s} compute={computeParticles} />

      <RecordingStrip
        x={TAPE.x}
        y={TAPE.y}
        w={TAPE.w}
        h={TAPE.h}
        points={POINTS}
        reveal={runP}
        title="the tape — every command, as agent-browser runs it"
        dim={dim}
      />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
