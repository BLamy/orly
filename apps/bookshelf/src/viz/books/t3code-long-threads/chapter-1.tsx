// Opening from a saved copy
// T3 Code: Long Threads · Chapter 1
//
// The machine: an event ruler (one tick per thread event, oldest left, newest
// right) with a bookmark where the browser's saved copy ends. Opening a thread
// shows the saved rows at once, then either replays the short gap between the
// bookmark and the server's head, or, past the replay limit, swaps in one fresh
// window. The same ruler carries every path; only the bookmark and bracket move.
//
// BEATS (captions are fixed, narration order)
//  1 the saved copy sits on the ruler at its last sequence number
//  2 the copy lives in the browser's local database; an unreadable record is discarded
//  3 the saved rows paint at once; the status reads cached
//  4 the client asks only for events after the bookmark: a 14-event bracket
//  5 the replay lights the ticks, the newest row grows, the status goes live
//  6 an older bookmark: 166 events exceed the 128 limit, so one fresh window replaces the rows
//  7 no saved copy: a plain web request is cut at six seconds; the live connection delivers the window
//  8 the window is the newest ten turns, held to about a megabyte
//  9 thread switching shows the rows of the last sixteen threads while the next loads
// 10 the ladder recap; everything else dims to a whisper
//
// SOURCES (T3 Code repo, HEAD cc59f99e; paths are repo-relative)
//  packages/client-runtime/src/state/threads.ts:58-62 status "cached" when data exists without a live sync
//  packages/client-runtime/src/state/threads.ts:211-243 saved copy read first; cursor seeded from its sequence
//  packages/client-runtime/src/state/threads.ts:953-1008 no data: bounded snapshot over HTTP, else socket snapshot
//  packages/client-runtime/src/state/threads.ts:1011-1030 subscribe after the sequence number; acceptBoundedSnapshot flags
//  packages/client-runtime/src/state/boundedThreadSnapshotHttp.ts:18 six-second timeout; :31-37 query flags
//  apps/web/src/connection/storage.ts:43-47,360-362,814-844 browser database, thread store, key by environment and thread
//  packages/client-runtime/src/platform/threadCacheEncoding.ts:12,35-58 compact records; decode path
//  packages/client-runtime/src/platform/orchestrationCache.ts:14,32-37 schema version; unreadable records discarded
//  apps/server/src/ws.ts:962-1031 afterSequence path: replay when the gap is small, else snapshot
//  apps/server/src/orchestration-v2/ThreadStream.ts:18-23,100-118 replay limit 128 events, about 1 MiB; decideThreadResume
//  apps/server/src/orchestration-v2/threadHistoryPaging.ts:15-20 newest-window policy; ws.ts:919-926 userTurnLimit 10
//  apps/web/src/components/ChatView.logic.ts:345,367-407 sixteen remembered thread timelines; shown while loading
//  apps/web/src/components/chat/ThreadTimeline.tsx:44-49 resolveThreadSwitchTimeline reads the remembered rows
import { Camera, Timeline, cameraInterp, colors, ease, CAMERA_HOME } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'Opening a long thread should show something useful before the network answers. T3 Code starts from a copy it already has.',
  "That copy sits in the browser's local database. A record in a format the current code cannot read is thrown away.",
  'The saved rows show first. The status reads cached, so the server has not confirmed them yet.',
  'Next, the client asks only for the events after the saved sequence number. The request stays small, even for a long thread.',
  'Up to one hundred twenty-eight events, in about a megabyte, are replayed in order, just like live events.',
  'If the gap is larger than that, the server sends one fresh window instead of a long replay.',
  'With no saved copy, the client asks for the newest window over a plain web request, and gives up after six seconds.',
  'If that request fails, the live connection delivers the same window instead, so the thread still opens.',
  'That window holds your newest ten turns, kept to about a megabyte, so the first paint is never the whole history.',
  'Switching threads has a shortcut of its own. The app keeps the rows of the last sixteen threads, and shows them while the next one loads.',
  'So opening a thread climbs a ladder. Show the saved copy, replay a short gap, and fetch a fresh window only past the limit.',
] as const;

// Caption timing: each caption's start and length follow its word count, the same
// rule the other books use, so the silent scrub paces like the narration.
function captionDur(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(5, Math.round((words / 2.5 + 1.1) * 10) / 10);
}
function captionPlan(texts: readonly string[], start = 0.4, gap = 0.5) {
  const at: number[] = [];
  const dur: number[] = [];
  let t = start;
  for (const text of texts) {
    const d = captionDur(text);
    at.push(Math.round(t * 100) / 100);
    dur.push(d);
    t += d + gap;
  }
  return { at, dur, end: t };
}
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;

/* ----------------------------------------------------------------- layout */
const MONO = colors.font.mono;
const SANS = colors.font.ui;
const PANEL_FILL = '#0d1321';
const PANEL_EDGE = '#24314b';
const CARD_FILL = '#0b1324';
const TRACK = '#131c30';

const RULER = { x0: 90, sx: 5.5, y: 520, max: 200 };
const eX = (e: number) => RULER.x0 + e * RULER.sx;

const WARM_BOOK = 182; // the saved copy ends here (case A)
const HEAD = 196; // the server's newest sequence number
const STALE_BOOK = 30; // an older saved copy (case B)
const REPLAY_LIMIT = 128;

const THREAD_PANEL = { x: 60, y: 104, w: 440, h: 352 };
const SERVER_PANEL = { x: 780, y: 104, w: 440, h: 352 };
const CARD = { x: 80, w: 400, h: 24, pitch: 29, y0: 138 };
const CARDS = 10;

// Precomputed at module scope so every frame is a pure function of the channels.
// Bar widths stay inside the card: the reply bar starts 190 px in, and the newest
// row's growth adds at most 60 px more.
const USER_W: number[] = [60, 84, 52, 96, 70, 88, 56, 78, 100, 64];
const COPY_W: number[] = [70, 112, 58, 120, 84, 102, 66, 96, 118, 78];
const FRESH_W: number[] = [96, 58, 118, 74, 66, 110, 90, 54, 104, 124];
const GROW_NEWEST = 60;
const TICKS = Array.from({ length: RULER.max + 1 }, (_, e) => e);

const CAM_RUN: CameraState = { x: 640, y: 380, k: 1.06 };

/* ----------------------------------------------------------------- helpers */
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

function Txt({
  x,
  y,
  text,
  size = 14,
  color = colors.TEXT,
  mono = false,
  weight = 500,
  anchor = 'start',
  u = 1,
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  mono?: boolean;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  u?: number;
}) {
  if (u <= 0.002) return null;
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize={size}
      fontFamily={mono ? MONO : SANS}
      fontWeight={weight}
      textAnchor={anchor}
      opacity={clamp01(u)}
    >
      {text}
    </text>
  );
}

function Panel({ x, y, w, h, title }: { x: number; y: number; w: number; h: number; title: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={PANEL_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
      <Txt x={x + 18} y={y + 26} text={title} size={14} mono color={colors.MUTED} />
    </g>
  );
}

/* ---------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const status = tl.channel<string>('status', 'empty');
  const bookU = tl.channel('bookU', 0); // the warm bookmark appears
  const rulerU = tl.channel('rulerU', 0); // the ruler draws on
  const dbU = tl.channel('dbU', 0); // the browser database appears
  const recU = tl.channel('recU', 0); // the saved record travels into the thread panel
  const recFadeU = tl.channel('recFadeU', 1); // the record settles into the rows and fades
  const discU = tl.channel('discU', 0); // the unreadable record is discarded
  const oldFadeU = tl.channel('oldFadeU', 1); // the discarded record fades once the rows paint
  const rowsU = tl.channel('rowsU', 0); // the thread panel shows its cards
  const brktU = tl.channel('brktU', 0); // the replay bracket appears
  const replayU = tl.channel('replayU', 0); // the replayed ticks light up
  const growU = tl.channel('growU', 0); // the newest row grows during replay
  const caseAU = tl.channel('caseAU', 1); // the warm case stays on the ruler
  const caseBU = tl.channel('caseBU', 0); // the stale case appears
  const snapU = tl.channel('snapU', 0); // rows crossfade to the fresh window
  const coldU = tl.channel('coldU', 0); // no saved copy: the bookmark cases give way
  const reqU = tl.channel('reqU', 0); // the plain web request travels
  const failU = tl.channel('failU', 0); // the request is cut at six seconds
  const sockU = tl.channel('sockU', 0); // the live connection delivers the window
  const memU = tl.channel('memU', 0); // the sixteen-thread memory tray appears
  const hiU = tl.channel('hiU', 0); // one tray slot is highlighted while loading
  const gaugeU = tl.channel('gaugeU', 0); // the window size gauge fills
  const rungU = tl.channel('rungU', 0); // the ladder rungs appear in turn
  const dimU = tl.channel('dimU', 0); // everything but the ladder fades

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  // BEAT 1 — the saved copy sits on the ruler
  let b = AT[0];
  tl.tween(rulerU, 1, { at: b + 0.2, dur: 1.2, ease: ease.draw });
  tl.tween(bookU, 1, { at: b + 1.6, dur: 0.8, ease: ease.enter });

  // BEAT 2 — the browser database, the record, and the discarded record
  b = AT[1];
  tl.tween(dbU, 1, { at: b + 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(recU, 1, { at: b + 1.6, dur: 1.4, ease: ease.move });
  tl.tween(discU, 1, { at: b + 4.2, dur: 1.2, ease: ease.pop });

  // BEAT 3 — the saved record settles and the old one fades; the saved rows paint at once
  b = AT[2];
  tl.set(status, 'cached', b + 0.1);
  tl.tween(recFadeU, 0, { at: b + 0.3, dur: 1.0, ease: ease.enter });
  tl.tween(oldFadeU, 0, { at: b + 0.3, dur: 1.0, ease: ease.enter });
  tl.tween(rowsU, 1, { at: b + 0.3, dur: 2.2, ease: ease.enter });

  // BEAT 4 — ask only for the events after the bookmark
  b = AT[3];
  tl.tween(cam, CAM_RUN, { at: b + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(brktU, 1, { at: b + 0.6, dur: 1.0, ease: ease.enter });

  // BEAT 5 — the replay lights the ticks; the newest row grows; status goes live
  b = AT[4];
  tl.set(status, 'synchronizing', b + 0.1);
  tl.tween(replayU, 1, { at: b + 0.4, dur: 3.2, ease: ease.linear });
  tl.tween(growU, 1, { at: b + 1.6, dur: 2.0, ease: ease.move });
  tl.set(status, 'live', b + 4.6);

  // BEAT 6 — an older bookmark: over the limit, so one fresh window replaces the rows
  b = AT[5];
  tl.tween(caseAU, 0, { at: b + 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(caseBU, 1, { at: b + 0.6, dur: 1.2, ease: ease.enter });
  tl.set(status, 'synchronizing', b + 1.2);
  tl.tween(snapU, 1, { at: b + 3.0, dur: 1.4, ease: ease.move });
  tl.set(status, 'live', b + 5.2);

  // BEAT 7 — no saved copy: the plain web request
  b = AT[6];
  tl.tween(caseBU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(coldU, 1, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(rowsU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.set(status, 'empty', b + 0.1);
  tl.tween(cam, CAMERA_HOME, { at: b + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(reqU, 0.9, { at: b + 1.4, dur: 3.2, ease: ease.linear });

  // BEAT 8 — the request is cut at six seconds; the live connection delivers the window
  b = AT[7];
  tl.tween(failU, 1, { at: b + 0.2, dur: 0.6, ease: ease.pop });
  tl.set(status, 'synchronizing', b + 1.0);
  tl.tween(sockU, 1, { at: b + 1.2, dur: 2.4, ease: ease.linear });
  tl.tween(rowsU, 1, { at: b + 3.4, dur: 1.6, ease: ease.enter });
  tl.set(status, 'live', b + 4.4);

  // BEAT 9 — the newest ten turns, held to about a megabyte
  b = AT[8];
  tl.tween(gaugeU, 1, { at: b + 0.6, dur: 2.4, ease: ease.move });

  // BEAT 10 — the memory tray and the one shown while the next thread loads
  b = AT[9];
  tl.tween(memU, 1, { at: b + 0.2, dur: 1.4, ease: ease.enter });
  tl.tween(hiU, 1, { at: b + 2.0, dur: 1.0, ease: ease.enter });

  // BEAT 11 — the ladder recap; the stage goes quiet under it
  b = AT[10];
  tl.tween(dimU, 1, { at: b + 0.1, dur: 1.0, ease: ease.move });
  tl.tween(rungU, 1, { at: b + 1.0, dur: 3.0, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: b + 0.1, dur: 1.2, ease: ease.move });

  return {
    tl,
    cam,
    status,
    bookU,
    rulerU,
    dbU,
    recU,
    recFadeU,
    discU,
    oldFadeU,
    rowsU,
    brktU,
    replayU,
    growU,
    caseAU,
    caseBU,
    snapU,
    coldU,
    reqU,
    failU,
    sockU,
    memU,
    hiU,
    gaugeU,
    rungU,
    dimU,
  };
}

const scene = buildScene();

/* ------------------------------------------------------------------ render */
export function Render({ s }: { s: SceneState }) {
  const g = (ch: ChannelRef<number>) => s.get(ch);
  const status = s.get(scene.status);
  const bookU = g(scene.bookU);
  const rulerU = g(scene.rulerU);
  const dbU = g(scene.dbU);
  const recU = g(scene.recU);
  const recFadeU = g(scene.recFadeU);
  const discU = g(scene.discU);
  const oldFadeU = g(scene.oldFadeU);
  const rowsU = g(scene.rowsU);
  const brktU = g(scene.brktU);
  const replayU = g(scene.replayU);
  const growU = g(scene.growU);
  const caseAU = g(scene.caseAU);
  const caseBU = g(scene.caseBU);
  const snapU = g(scene.snapU);
  const coldU = g(scene.coldU);
  const reqU = g(scene.reqU);
  const failU = g(scene.failU);
  const sockU = g(scene.sockU);
  const memU = g(scene.memU);
  const hiU = g(scene.hiU);
  const gaugeU = g(scene.gaugeU);
  const rungU = g(scene.rungU);
  const dimU = g(scene.dimU);
  const keep = 1 - 0.88 * clamp01(dimU);
  const warmOn = clamp01(brktU) * caseAU * (1 - clamp01(coldU));
  const staleOn = clamp01(caseBU) * (1 - clamp01(coldU));

  const statusColor = status === 'live' ? colors.POSITIVE : status === 'synchronizing' ? colors.WARM : colors.MUTED;
  // The gap in events: case A replays 14; case B is 166, over the 128 limit.
  const gapA = HEAD - WARM_BOOK;
  const gapB = HEAD - STALE_BOOK;
  const gaugeFill = clamp01(lerp(gapA / REPLAY_LIMIT, 1, caseBU)) * 404;
  const gaugeColor = caseBU > 0.5 ? colors.NEGATIVE : colors.ACCENT;
  const newestY = CARD.y0 + (CARDS - 1) * CARD.pitch;

  return (
    <Camera {...s.get(scene.cam)}>
      {/* header and status */}
      <g opacity={keep}>
        <Txt x={60} y={62} text="opening a thread" size={22} weight={700} />
        <Txt x={60} y={86} text="saved copy, replay, or fresh window" size={14} mono color={colors.MUTED} u={rulerU} />
        <rect x={1076} y={36} width={144} height={30} rx={15} fill={CARD_FILL} stroke={statusColor} strokeWidth={1.4} />
        <Txt x={1148} y={56} text={status} size={14} mono anchor="middle" color={statusColor} weight={700} />
      </g>

      {/* the browser database and the discarded record */}
      <g opacity={keep * clamp01(dbU)}>
        <g transform="translate(640 122)">
          <rect x={-68} y={0} width={136} height={46} fill={CARD_FILL} />
          <line x1={-68} y1={0} x2={-68} y2={46} stroke={colors.ACCENT} strokeWidth={1.4} />
          <line x1={68} y1={0} x2={68} y2={46} stroke={colors.ACCENT} strokeWidth={1.4} />
          <path d="M-68 46 A68 12 0 0 0 68 46" fill="none" stroke={colors.ACCENT} strokeWidth={1.4} />
          <ellipse cx={0} cy={0} rx={68} ry={12} fill={CARD_FILL} stroke={colors.ACCENT} strokeWidth={1.4} />
          <Txt x={0} y={-22} text="browser thread store" size={13} mono anchor="middle" color={colors.MUTED} />
        </g>
        <g opacity={clamp01(discU) * clamp01(oldFadeU)} transform="translate(574 180)">
          <rect x={0} y={0} width={132} height={24} rx={6} fill="#14101a" stroke={colors.NEGATIVE} strokeWidth={1.2} strokeDasharray="4 3" />
          <Txt x={66} y={16} text="older format" size={12.5} mono anchor="middle" color={colors.MUTED} />
          <Txt x={66} y={44} text="discarded" size={13} mono anchor="middle" color={colors.NEGATIVE} u={clamp01((discU - 0.4) * 2)} />
        </g>
      </g>

      {/* the thread panel: the saved rows, then the fresh window */}
      <g opacity={keep}>
        <Panel x={THREAD_PANEL.x} y={THREAD_PANEL.y} w={THREAD_PANEL.w} h={THREAD_PANEL.h} title="thread view" />
        <Txt x={480} y={130} text="remembered rows, shown while loading" size={12} mono anchor="end" color={colors.ACCENT} u={hiU} />
        {Array.from({ length: CARDS }, (_, i) => {
          const u = clamp01(rowsU * (CARDS + 2) - i);
          const y = CARD.y0 + i * CARD.pitch;
          const newest = i === CARDS - 1;
          const grow = newest ? GROW_NEWEST * clamp01(growU) * (1 - clamp01(snapU)) : 0;
          const reply = lerp(COPY_W[i]!, FRESH_W[i]!, clamp01(snapU)) + grow;
          return (
            <g key={i} opacity={u}>
              <rect
                x={CARD.x}
                y={y}
                width={CARD.w}
                height={CARD.h}
                rx={6}
                fill={CARD_FILL}
                stroke={newest && growU > 0.01 ? colors.POSITIVE : PANEL_EDGE}
                strokeWidth={1.1}
              />
              <Txt x={CARD.x + 10} y={y + 16} text={`turn ${i + 1}`} size={12} mono color={colors.MUTED} />
              <rect x={CARD.x + 70} y={y + 8} width={USER_W[i]!} height={8} rx={4} fill={colors.ACCENT} opacity={0.85} />
              <rect x={CARD.x + 190} y={y + 8} width={reply} height={8} rx={4} fill={colors.SECONDARY} opacity={0.7} />
            </g>
          );
        })}
        <Txt x={CARD.x + CARD.w - 8} y={newestY + 16} text="newest" size={12} mono anchor="end" color={colors.POSITIVE} u={growU * rowsU} />
        {/* the newest-ten-turns gauge, inside the panel */}
        <g opacity={clamp01(gaugeU * 1.5) * clamp01(rowsU)}>
          <rect x={CARD.x} y={434} width={400} height={6} rx={3} fill={TRACK} />
          <rect x={CARD.x} y={434} width={360 * clamp01(gaugeU)} height={6} rx={3} fill={colors.ACCENT} opacity={0.8} />
          <Txt x={CARD.x} y={450} text="newest ten turns, about a megabyte" size={12.5} mono color={colors.MUTED} />
        </g>
      </g>

      {/* the server panel: the event decision, the window, and the memory tray */}
      <g opacity={keep}>
        <Panel x={SERVER_PANEL.x} y={SERVER_PANEL.y} w={SERVER_PANEL.w} h={SERVER_PANEL.h} title="server" />
        <Txt x={798} y={178} text={`head ${HEAD}`} size={30} mono weight={700} />
        <g opacity={clamp01(warmOn + staleOn)}>
          <Txt x={798} y={216} text="events after the bookmark" size={14} color={colors.MUTED} />
          <rect x={798} y={240} width={404} height={22} rx={6} fill={TRACK} />
          <rect x={798} y={240} width={gaugeFill} height={22} rx={6} fill={gaugeColor} opacity={0.9} />
          <line x1={1202} y1={234} x2={1202} y2={268} stroke={colors.NEGATIVE} strokeWidth={1.6} strokeDasharray="3 3" />
          <Txt x={1202} y={284} text={`limit ${REPLAY_LIMIT}`} size={12.5} mono anchor="end" color={colors.NEGATIVE} />
          <Txt x={798} y={284} text={caseBU > 0.5 ? `${gapB} of ${REPLAY_LIMIT}` : `${gapA} of ${REPLAY_LIMIT}`} size={14} mono color={gaugeColor} />
          <Txt x={798} y={334} text="replay in order" size={18} weight={700} color={colors.ACCENT} u={warmOn * (1 - caseBU)} />
          <Txt x={798} y={334} text="over the limit, send a fresh window" size={18} weight={700} color={colors.NEGATIVE} u={staleOn} />
          <Txt x={798} y={362} text="same path as live events" size={13} mono color={colors.MUTED} u={warmOn * (1 - caseBU)} />
        </g>
        <Txt x={798} y={334} text="newest ten turns, one window" size={18} weight={700} color={colors.ACCENT} u={clamp01(coldU) * clamp01(sockU)} />
        <g opacity={clamp01(memU)}>
          <Txt x={798} y={400} text="rows kept for the last sixteen threads" size={13} mono color={colors.MUTED} />
          {Array.from({ length: 16 }, (_, k) => {
            const hi = k === 5 ? clamp01(hiU) : 0;
            return (
              <rect
                key={k}
                x={798 + (k % 8) * 52}
                y={412 + Math.floor(k / 8) * 22}
                width={44}
                height={16}
                rx={4}
                fill={hi > 0 ? '#0e2a3d' : CARD_FILL}
                stroke={hi > 0 ? colors.ACCENT : PANEL_EDGE}
                strokeWidth={hi > 0 ? 1.6 : 1}
              />
            );
          })}
        </g>
      </g>

      {/* the cold path: the plain web request, cut at six seconds, then the live connection */}
      <g opacity={keep}>
        <Txt x={640} y={292} text="plain web request" size={13} mono anchor="middle" color={colors.MUTED} u={reqU} />
        <line x1={504} y1={310} x2={776} y2={310} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <rect x={504} y={316} width={272 * clamp01(reqU)} height={5} rx={2} fill={colors.ACCENT} opacity={0.35} />
        <circle cx={504 + 272 * clamp01(reqU)} cy={310} r={6} fill={colors.ACCENT} opacity={clamp01(reqU * 6) * (1 - clamp01(failU))} />
        <g opacity={clamp01(failU)}>
          <line x1={626} y1={298} x2={654} y2={322} stroke={colors.NEGATIVE} strokeWidth={2.4} />
          <line x1={654} y1={298} x2={626} y2={322} stroke={colors.NEGATIVE} strokeWidth={2.4} />
          <Txt x={640} y={346} text="six seconds, cut" size={13} mono anchor="middle" color={colors.NEGATIVE} />
        </g>
        <Txt x={640} y={392} text="live connection" size={13} mono anchor="middle" color={colors.MUTED} u={sockU} />
        <line x1={504} y1={408} x2={776} y2={408} stroke={PANEL_EDGE} strokeWidth={1.2} opacity={clamp01(sockU * 4)} />
        <circle
          cx={776 - 272 * clamp01(sockU)}
          cy={408}
          r={6}
          fill={colors.POSITIVE}
          opacity={clamp01(sockU * 6) * (1 - clamp01((sockU - 0.94) * 16))}
        />
      </g>

      {/* the event ruler: one tick per event, with the bookmarks, brackets and the head */}
      <g opacity={keep * (1 - 0.7 * clamp01(coldU))}>
        <line
          x1={RULER.x0}
          y1={RULER.y}
          x2={RULER.x0 + RULER.max * RULER.sx}
          y2={RULER.y}
          stroke={PANEL_EDGE}
          strokeWidth={1.4}
          opacity={clamp01(rulerU)}
        />
        {TICKS.map((e) => {
          const k = e - (WARM_BOOK + 1);
          const inWarm = e > WARM_BOOK && e <= HEAD;
          const lit = inWarm ? clamp01(replayU * 14 - k) : 0;
          const inStale = e > STALE_BOOK && e <= HEAD;
          const over = e > STALE_BOOK + REPLAY_LIMIT;
          const staleTick = inStale && caseBU > 0.01;
          const color = staleTick ? (over ? colors.NEGATIVE : colors.ACCENT) : lit > 0 ? colors.ACCENT : colors.MUTED;
          const base = e <= WARM_BOOK ? 0.35 : 0.2;
          const op = staleTick ? clamp01(rulerU) * caseBU : clamp01(rulerU) * (lit > 0 ? 0.9 : base);
          return (
            <line
              key={e}
              x1={eX(e)}
              y1={RULER.y - 8}
              x2={eX(e)}
              y2={RULER.y + 8}
              stroke={color}
              strokeWidth={e === HEAD ? 2.4 : 1.2}
              opacity={op}
            />
          );
        })}
        {/* case A: the warm bookmark and the 14-event bracket */}
        <g opacity={clamp01(caseAU)}>
          <g opacity={clamp01(bookU)}>
            <path d={`M${eX(WARM_BOOK)} 500 L${eX(WARM_BOOK) - 6} 490 L${eX(WARM_BOOK) + 6} 490 Z`} fill={colors.ACCENT} />
            <Txt x={eX(WARM_BOOK) - 10} y={486} text="snapshotSequence 182" size={12.5} mono anchor="end" color={colors.ACCENT} />
          </g>
          <g opacity={clamp01(brktU)}>
            <line x1={eX(WARM_BOOK)} y1={552} x2={eX(HEAD)} y2={552} stroke={colors.ACCENT} strokeWidth={1.6} />
            <line x1={eX(WARM_BOOK)} y1={546} x2={eX(WARM_BOOK)} y2={558} stroke={colors.ACCENT} strokeWidth={1.6} />
            <line x1={eX(HEAD)} y1={546} x2={eX(HEAD)} y2={558} stroke={colors.ACCENT} strokeWidth={1.6} />
            <Txt x={eX(HEAD)} y={578} text="afterSequence 182, 14 events" size={13} mono anchor="end" color={colors.ACCENT} />
          </g>
        </g>
        {/* case B: the older bookmark, the bracket split at the 128 limit */}
        <g opacity={clamp01(caseBU)}>
          <path d={`M${eX(STALE_BOOK)} 500 L${eX(STALE_BOOK) - 6} 490 L${eX(STALE_BOOK) + 6} 490 Z`} fill={colors.WARM} />
          <Txt x={eX(STALE_BOOK) + 10} y={486} text="older copy at 30" size={12.5} mono color={colors.WARM} />
          <line x1={eX(STALE_BOOK)} y1={552} x2={eX(STALE_BOOK + REPLAY_LIMIT)} y2={552} stroke={colors.ACCENT} strokeWidth={1.6} />
          <line x1={eX(STALE_BOOK + REPLAY_LIMIT)} y1={552} x2={eX(HEAD)} y2={552} stroke={colors.NEGATIVE} strokeWidth={1.6} />
          <line
            x1={eX(STALE_BOOK + REPLAY_LIMIT)}
            y1={440}
            x2={eX(STALE_BOOK + REPLAY_LIMIT)}
            y2={540}
            stroke={colors.NEGATIVE}
            strokeWidth={1.4}
            strokeDasharray="4 4"
          />
          <Txt x={eX(STALE_BOOK + REPLAY_LIMIT)} y={598} text="limit 128 events" size={13} mono anchor="middle" color={colors.NEGATIVE} />
          <Txt x={eX(HEAD)} y={578} text="166 events, over the limit" size={13} mono anchor="end" color={colors.NEGATIVE} />
        </g>
        <Txt x={eX(HEAD)} y={486} text={`head ${HEAD}`} size={12.5} mono anchor="end" color={colors.MUTED} u={rulerU} />
        <Txt x={RULER.x0} y={544} text="older events" size={12} mono color={colors.MUTED} u={rulerU} />
      </g>

      {/* the saved record travels above the thread panel into its first row slot */}
      <g
        transform={`translate(${lerp(606, 262, recU)} ${lerp(134, 110, recU)})`}
        opacity={keep * clamp01(recU * 3) * clamp01(recFadeU)}
      >
        <rect x={0} y={0} width={170} height={24} rx={6} fill={CARD_FILL} stroke={colors.ACCENT} strokeWidth={1.4} />
        <Txt x={85} y={16} text="environment:thread" size={12.5} mono anchor="middle" color={colors.ACCENT} />
      </g>

      {/* the ladder recap, on an opaque panel so the closing frame stays clean */}
      <g opacity={clamp01(rungU * 4)}>
        <rect x={300} y={178} width={680} height={262} rx={16} fill={CARD_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <Txt x={330} y={214} text="the ladder" size={14} mono color={colors.MUTED} />
        {[
          { label: '1  show the saved copy', color: colors.ACCENT },
          { label: '2  replay a short gap', color: colors.POSITIVE },
          { label: '3  fresh window, only past the limit', color: colors.WARM },
        ].map((rung, i) => (
          <g
            key={rung.label}
            opacity={clamp01(rungU * 3 - i)}
            transform={`translate(0 ${(1 - clamp01(rungU * 3 - i)) * 6})`}
          >
            <rect x={340} y={236 + i * 58} width={600} height={44} rx={10} fill={PANEL_FILL} stroke={rung.color} strokeWidth={1.6} />
            <Txt x={362} y={264 + i * 58} text={rung.label} size={18} weight={700} color={rung.color} />
          </g>
        ))}
      </g>
    </Camera>
  );
}

export const vizScene = () => scene;
