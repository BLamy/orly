// Book scene — codex-app-server, chapter 4: "Many Windows, One Engine".
//
// ONE persistent object: the ENGINE, outliving every window. Grounded in
// codex-rs/app-server/src/message_processor.rs (per-connection session state;
// notifications fan out to subscribed connections), README.md (initialize
// capabilities.optOutNotificationMethods; thread/unsubscribe; thread/closed;
// codex app-server generate-ts / generate-json-schema), and
// request_processors/thread_lifecycle.rs (THREAD_UNLOADING_DELAY =
// Duration::from_secs(30 * 60): a thread unloads only after 30 minutes with
// no subscribers and no activity — then emits thread/closed).
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { TimerArc } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const ENGINE = { x: 880, y: 200, w: 330, h: 300 };
const THREAD_BUBBLE = { x: 905, y: 300, w: 280, h: 110 };
const WINDOWS = [
  { x: 90, y: 130, label: 'editor extension', sub: 'codex_vscode' },
  { x: 90, y: 290, label: 'terminal app', sub: 'your CLI front end' },
  { x: 90, y: 450, label: 'your app', sub: 'anything that speaks the wire' },
];
const WIN_W = 260;
const WIN_H = 110;
const TIMER = { cx: 1045, cy: 355, r: 34 };
const RECAP = { x: 210, y: 150, w: 560, rowH: 52 };
const GENTS = { x: 250, y: 430, w: 480, h: 74 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_WIDE: CameraState = { x: 640, y: 350, k: 0.98 };
const CAM_ENGINE: CameraState = { x: 950, y: 350, k: 1.16 };
const CAM_WINDOWS: CameraState = { x: 400, y: 350, k: 1.06 };
const CAM_TIMER: CameraState = { x: 1000, y: 355, k: 1.3 };
const CAM_RECAP: CameraState = { x: 560, y: 330, k: 1.06 };

const RECAP_ROWS = [
  { head: 'a handshake opens the wire', tail: 'initialize → initialized', color: colors.ACCENT },
  { head: 'threads hold turns hold items', tail: 'item/started → deltas → item/completed', color: colors.POSITIVE },
  { head: 'approvals flow backward', tail: 'requestApproval → decision', color: colors.SECONDARY },
  { head: 'the engine outlives every window', tail: 'unload after 30 min idle → thread/closed', color: colors.WARM },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const engineU = tl.channel('engineU', 0);
  const winsU = tl.channel('winsU', 0); // three windows, staggered
  const wiresU = tl.channel('wiresU', 0);
  const fanU = tl.channel('fanU', 0); // one delta, three deliveries
  const filterU = tl.channel('filterU', 0); // opt-out filter on window 2
  const fan2U = tl.channel('fan2U', 0); // second fan-out; middle absorbed
  const w1Gone = tl.channel('w1Gone', 0); // editor window closes
  const w2Gone = tl.channel('w2Gone', 0);
  const w3Gone = tl.channel('w3Gone', 0);
  const timerU = tl.channel('timerU', 0); // 30-minute unload arc
  const timerOn = tl.channel('timerOn', 0);
  const unloadU = tl.channel('unloadU', 0); // thread bubble → disk
  const resumeU = tl.channel('resumeU', 0); // a new window resumes it
  const stageDim = tl.channel('stageDim', 0);
  const recapU = tl.channel('recapU', 0);
  const genU = tl.channel('genU', 0); // generate-ts chip
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · not owned by any window — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'One more inversion: the engine does not belong to any window. Several clients can hold connections to the same app server at once — same threads, same stream.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 6.2, dur: 1.2, ease: ease.move });
  tl.tween(engineU, 1, { at: t - 6.0, dur: 0.8, ease: ease.enter });
  tl.tween(winsU, 1, { at: t - 5.2, dur: 1.8, ease: ease.enter });
  tl.tween(wiresU, 1, { at: t - 3.4, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.5);

  /* — beat 2 · fan-out — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'When a turn streams, every connection subscribed to that thread receives the same notifications. Three windows, one delta, three deliveries.',
  });
  tl.tween(fanU, 1, { at: t - 4.4, dur: 1.8, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 3 · opt-out — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Connections can also trim what they receive. At initialize time, a client can opt out of specific methods — the chatty agent message deltas, say — and the engine skips it for that connection only.',
  });
  tl.tween(cam, CAM_WINDOWS, { at: t - 6.2, dur: 1.3, ease: ease.move });
  tl.tween(filterU, 1, { at: t - 5.0, dur: 0.7, ease: ease.enter });
  tl.tween(fan2U, 1, { at: t - 3.8, dur: 1.8, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 4 · windows come and go — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Windows come and go. Closing one does not touch the thread — unsubscribing just removes that connection from the audience.',
  });
  tl.tween(w1Gone, 1, { at: t - 3.8, dur: 0.7, ease: ease.move });
  tl.tween(w2Gone, 1, { at: t - 2.6, dur: 0.7, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 5 · the quiet clock — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'And when the last subscriber leaves, the engine still does not kill the conversation. It starts a quiet clock instead.',
  });
  tl.tween(w3Gone, 1, { at: t - 4.8, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_TIMER, { at: t - 4.2, dur: 1.4, ease: ease.move });
  tl.tween(timerOn, 1, { at: t - 2.8, dur: 0.5, ease: ease.enter });
  t = tl.hold(t, 0.3);

  /* — beat 6 · thirty minutes, then unload — */
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Only after thirty minutes with no subscribers and no activity does the thread unload from memory, with a closed notification for anyone who cares. The transcript stays on disk, ready to resume.',
  });
  tl.tween(timerU, 1, { at: t - 6.4, dur: 3.2, ease: ease.linear });
  tl.tween(unloadU, 1, { at: t - 2.6, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 7 · resume from anywhere — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Resume it tomorrow — from a different window entirely — and the whole history comes back with it.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.2, dur: 1.4, ease: ease.move });
  tl.tween(resumeU, 1, { at: t - 3.4, dur: 1.0, ease: ease.enter });
  tl.tween(unloadU, 0, { at: t - 2.4, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 8 · the recap — */
  t = tl.caption({
    at: t,
    dur: 7.4,
    text: 'So, the whole machine: a handshake opens the wire, threads hold turns hold items, deltas stream forward, approvals flow backward — and the engine outlives every window.',
  });
  tl.tween(stageDim, 1, { at: t - 7.0, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_RECAP, { at: t - 6.8, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 1, { at: t - 5.6, dur: 3.0, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 9 · typed bindings — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The protocol even ships its own client kit: one command generates typed bindings that match your exact build of Codex, so your interface compiles against the truth.',
  });
  tl.tween(genU, 1, { at: t - 4.4, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 10 · close — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The official extension is just one face on this engine. The wire is documented, typed, and waiting — bring your own window.',
  });
  tl.tween(dimU, 0.3, { at: t - 2.4, dur: 1.2, ease: ease.move });
  tl.hold(t, 1.0);

  return {
    tl, cam, engineU, winsU, wiresU, fanU, filterU, fan2U, w1Gone, w2Gone, w3Gone,
    timerU, timerOn, unloadU, resumeU, stageDim, recapU, genU, dimU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

function ClientWindow({ x, y, label, sub, u, gone, filter, dim }: {
  x: number; y: number; label: string; sub: string; u: number; gone: number; filter: number; dim: number;
}) {
  const e = clamp01(u) * (1 - clamp01(gone));
  if (e <= 0) return null;
  return (
    <g transform={`translate(${x - (1 - e) * 20}, ${y})`} opacity={e * (1 - 0.75 * clamp01(dim))}>
      <rect width={WIN_W} height={WIN_H} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <circle cx={16} cy={16} r={4} fill={colors.NEGATIVE} opacity={0.7} />
      <circle cx={30} cy={16} r={4} fill={colors.WARM} opacity={0.7} />
      <circle cx={44} cy={16} r={4} fill={colors.POSITIVE} opacity={0.7} />
      <text x={16} y={48} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>{label}</text>
      <text x={16} y={68} fill={colors.MUTED} fontSize={11} fontFamily={mono}>{sub}</text>
      {clamp01(filter) > 0 && (
        <g opacity={clamp01(filter)}>
          <rect x={12} y={78} width={WIN_W - 24} height={22} rx={6} fill={colors.NEGATIVE} opacity={0.14} />
          <text x={20} y={93} fill={colors.NEGATIVE} fontSize={10} fontFamily={mono}>
            optOut: item/agentMessage/delta
          </text>
        </g>
      )}
    </g>
  );
}

/** A notification packet fanning from the engine to window i. */
function FanPacket({ u, winIndex, absorbed, gone }: { u: number; winIndex: number; absorbed?: boolean; gone: number }) {
  const p = clamp01(u);
  if (p <= 0 || p >= 1 || clamp01(gone) > 0.3) return null;
  const from = { x: ENGINE.x, y: ENGINE.y + ENGINE.h / 2 };
  const to = { x: WINDOWS[winIndex].x + WIN_W + 8, y: WINDOWS[winIndex].y + WIN_H / 2 };
  // absorbed packets die at the filter, 75% of the way
  const cut = absorbed ? 0.75 : 1;
  const q = Math.min(p, cut);
  const x = lerp(from.x, to.x, q);
  const y = lerp(from.y, to.y, q);
  const fade = absorbed && p > 0.62 ? clamp01((cut - p) / 0.13) : p > 0.88 ? (1 - p) / 0.12 : 1;
  if (fade <= 0) return null;
  return (
    <g opacity={fade}>
      <circle cx={x} cy={y} r={7} fill={colors.POSITIVE} opacity={0.9} />
      <circle cx={x} cy={y} r={12} fill="none" stroke={colors.POSITIVE} strokeWidth={1} opacity={0.4} />
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = Math.max(clamp01(s.get(scene.stageDim)), clamp01(s.get(scene.dimU)));
  const engineU = clamp01(s.get(scene.engineU));
  const wiresU = clamp01(s.get(scene.wiresU));
  const winsU = s.get(scene.winsU);
  const gone = [clamp01(s.get(scene.w1Gone)), clamp01(s.get(scene.w2Gone)), clamp01(s.get(scene.w3Gone))];
  const timerOn = clamp01(s.get(scene.timerOn));
  const timerU = clamp01(s.get(scene.timerU));
  const unloadU = clamp01(s.get(scene.unloadU));
  const resumeU = clamp01(s.get(scene.resumeU));
  const recapU = clamp01(s.get(scene.recapU));
  const genU = clamp01(s.get(scene.genU));
  const finalDim = clamp01(s.get(scene.dimU));

  return (
    <>
      {/* wires */}
      {wiresU > 0 &&
        WINDOWS.map((w, i) => {
          const alive = 1 - gone[i] * 0.9;
          const resAlive = i === 2 && resumeU > 0 ? 1 : alive;
          return (
            <line
              key={i}
              x1={w.x + WIN_W}
              y1={w.y + WIN_H / 2}
              x2={ENGINE.x}
              y2={ENGINE.y + ENGINE.h / 2}
              stroke={colors.GRID}
              strokeWidth={2.5}
              opacity={wiresU * resAlive * (1 - 0.7 * dim)}
            />
          );
        })}

      {/* windows */}
      {WINDOWS.map((w, i) => (
        <ClientWindow
          key={w.label}
          x={w.x}
          y={w.y}
          label={w.label}
          sub={w.sub}
          u={clamp01(winsU * 3 - i)}
          gone={i === 2 && resumeU > 0 ? 1 - resumeU : gone[i]}
          filter={i === 1 ? s.get(scene.filterU) : 0}
          dim={dim}
        />
      ))}

      {/* the engine */}
      {engineU > 0 && (
        <g transform={`translate(${ENGINE.x}, ${ENGINE.y})`} opacity={engineU * (1 - 0.45 * dim)}>
          <rect width={ENGINE.w} height={ENGINE.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={18} y={30} fill={colors.TEXT} fontSize={15} fontWeight={700} fontFamily={mono}>codex app-server</text>
          <text x={18} y={52} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>one engine · every window</text>
          {/* the loaded thread */}
          <g transform={`translate(${THREAD_BUBBLE.x - ENGINE.x}, ${THREAD_BUBBLE.y - ENGINE.y})`}>
            <rect
              width={THREAD_BUBBLE.w}
              height={THREAD_BUBBLE.h}
              rx={10}
              fill={colors.BG}
              stroke={unloadU > 0.5 ? colors.GRID : colors.SECONDARY}
              strokeWidth={1.5}
              strokeDasharray={unloadU > 0.5 ? '5 4' : undefined}
              opacity={1 - 0.45 * unloadU}
            />
            <text x={14} y={24} fill={unloadU > 0.5 ? colors.MUTED : colors.SECONDARY} fontSize={11.5} fontWeight={700} fontFamily={mono} opacity={1 - 0.3 * unloadU}>
              {unloadU > 0.5 ? 'thread — on disk (rollout)' : 'thread thr_0aa4 — loaded'}
            </text>
            <text x={14} y={46} fill={colors.MUTED} fontSize={10.5} fontFamily={mono} opacity={1 - 0.5 * unloadU}>
              {unloadU > 0.5 ? 'thread/closed emitted' : 'subscribers stream turn events'}
            </text>
            {unloadU <= 0.5 && (
              <text x={14} y={THREAD_BUBBLE.h - 14} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
                THREAD_UNLOADING_DELAY: 30 * 60
              </text>
            )}
          </g>
        </g>
      )}

      {/* fan-outs */}
      {[0, 1, 2].map((i) => (
        <FanPacket key={`f1-${i}`} u={s.get(scene.fanU)} winIndex={i} gone={gone[i]} />
      ))}
      {[0, 1, 2].map((i) => (
        <FanPacket key={`f2-${i}`} u={s.get(scene.fan2U)} winIndex={i} absorbed={i === 1} gone={gone[i]} />
      ))}

      {/* the 30-minute clock */}
      {timerOn > 0 && unloadU < 0.6 && (
        <g opacity={timerOn * (1 - 0.5 * dim)}>
          <TimerArc cx={TIMER.cx} cy={TIMER.cy} r={TIMER.r} u={timerU} color={colors.WARM} />
          <text x={TIMER.cx} y={TIMER.cy + TIMER.r + 22} fill={colors.WARM} fontSize={11.5} fontFamily={mono} textAnchor="middle">
            {timerU >= 1 ? 'idle 30:00 → unload' : 'no subscribers · no activity'}
          </text>
        </g>
      )}

      {/* recap rows */}
      {recapU > 0 && (
        <g opacity={1 - 0.85 * finalDim}>
          {RECAP_ROWS.map((row, i) => {
            const ru = clamp01(recapU * 4 - i);
            if (ru <= 0) return null;
            return (
              <g key={i} transform={`translate(${RECAP.x}, ${RECAP.y + i * RECAP.rowH + (1 - ru) * 10})`} opacity={ru}>
                <rect width={RECAP.w} height={RECAP.rowH - 10} rx={9} fill={colors.PANEL} stroke={row.color} strokeWidth={1.5} />
                <text x={16} y={26} fill={colors.TEXT} fontSize={13} fontWeight={600}>{row.head}</text>
                <text x={RECAP.w - 16} y={26} fill={row.color} fontSize={11} fontFamily={mono} textAnchor="end">{row.tail}</text>
              </g>
            );
          })}
        </g>
      )}

      {/* generate-ts chip */}
      {genU > 0 && (
        <g transform={`translate(${GENTS.x}, ${GENTS.y + (1 - genU) * 10})`} opacity={genU * (1 - 0.7 * finalDim)}>
          <rect width={GENTS.w} height={GENTS.h} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={18} y={30} fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={mono}>
            codex app-server generate-ts
          </text>
          <text x={18} y={54} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
            typed bindings for the exact build you run against
          </text>
        </g>
      )}
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
