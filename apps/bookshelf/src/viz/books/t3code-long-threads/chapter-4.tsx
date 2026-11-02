// Following the live end, and letting go
// T3 Code: Long Threads · Chapter 4
//
// The machine: a reader's viewport over a thread that is still streaming, and one
// mode lamp with three states. Following keeps the newest text in view. Scrolling away
// releases it and saves a place (a row and an offset). A new turn anchors near the top
// with empty space below it, and tool activity lets the anchor go and scrolls to the end.
// Older rows that load above a released reader leave what is on screen where it was.
//
// BEATS (captions are fixed, narration order)
//  1 following: the streaming reply grows, and a thread opens following at its end
//  2 a wheel gesture releases the follow; the view holds still while the reply grows below
//  3 the scroll-to-end pill appears after a short pause
//  4 load earlier turns adds three rows above; the saved row stays put (ghosts show the shift that did not happen)
//  5 the saved place: a row and an offset inside that row
//  6 a sent message anchors near the top, with empty space below for the reply
//  7 tool activity releases the anchor and the view scrolls to the end
//  8 the pill, pressed after a release, returns the view to the live end
//  9 a thread switch and its return restores the saved place before the first paint
// 10 the memory cards, then the closing diagram: scrolling away releases, reaching the end brings it back
//
// SOURCES (T3 Code repo, HEAD cc59f99e; paths are repo-relative)
//  apps/web/src/components/chat/useTimelineFollow.ts:168-214 following and released state per visit; pill shows after a 150 ms debounce
//  apps/web/src/components/chat/useTimelineFollow.ts:240-269 a navigation releases follow; queued scrolls cancelled
//  apps/web/src/components/chat/timelineViewport.ts:40-46,183-203 navigation sources: wheel, touch, keys, scrollbar, scroll events
//  apps/web/src/components/chat/timelineViewport.ts:211-245 follow states and transitions: navigated, reachedEnd, leftEnd, followEnd
//  apps/web/src/components/chat/useTimelineFollow.ts:273-298 a started run anchors its user message (observeTimelineRun)
//  apps/web/src/components/chat/useTimelineFollow.ts:394-448 anchor positioned near the top with a fixed offset
//  apps/web/src/components/chat/useTimelineFollow.ts:523-543 tool or reasoning activity releases the anchor and scrolls to the end
//  apps/web/src/components/ChatView.logic.ts:271-294 shouldReleaseTimelineAnchorForToolActivity
//  apps/web/src/components/chat/MessagesTimeline.tsx:819-836 anchored end space; maintainVisibleContentPosition for data and size
//  apps/web/src/components/chat/MessagesTimeline.tsx:899-926 saved place: row id, offset within the row, scroll offset, at end
//  apps/web/src/components/chat/timelineScrollAnchoring.ts:38,94-130 anchor offset 24; saved places capped at one hundred threads
//  apps/web/src/components/chat/useTimelinePositionRestore.ts:54-150 restore: scroll to the saved row and offset, settle, before paint
//  apps/web/src/components/chat/TimelineOverlays.tsx:26-55 "Scroll to end" button
//  packages/client-runtime/src/state/threadRetention.ts:1 resume state kept five minutes after a thread is left
import { Camera, Timeline, cameraInterp, colors, ease, CAMERA_HOME } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'While a reply streams in, the timeline is following. It keeps the newest text in view as each chunk arrives.',
  'A thread opens in following mode, unless you left it while reading older messages. Following is a state, not a fixed position.',
  'Scrolling up with the wheel, the arrow keys, the page keys, or the scrollbar releases the follow. The view stays where it is.',
  'The reply keeps growing below you, out of sight. A moment later, a scroll to end button appears to rejoin the live end.',
  'Load earlier turns adds rows above what you are reading. The visible content stays in place, so your spot does not jump.',
  'Your place is saved as a row plus an offset inside that row, so it survives height changes above and below it.',
  'Sending a message anchors it near the top when its run starts. Empty space below it gives the reply room to grow.',
  'When the agent starts running tools, the anchor lets go, and the list scrolls to the end to follow the work.',
  'Pressing the button after scrolling away re-arms following. The list glides back to the live edge.',
  'Switching threads and coming back restores the saved row before the first paint, so you land where you left off.',
  "The app keeps saved places for one hundred threads, and each thread's last state for five minutes after you leave.",
  'So following is a mode, not a scroll position. Scrolling away releases it, and reaching the end brings it back.',
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

const VIEW = { x: 330, y: 112, w: 400, h: 494 };
const COL = { x: 350, w: 360 };
const PAD = 120; // space above the first row, as in a list header
const ANCHOR_TOP_OFFSET = 24; // a sent message sits this far below the top edge

// The rows that exist before any load: three older rows wait above, eight rows follow.
const HIST = [
  { k: 'user', h: 46 },
  { k: 'agent', h: 110 },
  { k: 'user', h: 44 },
] as const;
const BASE = [
  { k: 'user', h: 46 },
  { k: 'agent', h: 118 },
  { k: 'user', h: 44 },
  { k: 'agent', h: 132 },
  { k: 'user', h: 46 },
  { k: 'agent', h: 104 },
  { k: 'user', h: 42 },
  { k: 'agent', h: 150 },
] as const;
const HIST_TOTAL = HIST.reduce((a, r) => a + r.h, 0); // 200
const BASE_TOTAL = BASE.reduce((a, r) => a + r.h, 0); // 682
const ANCHOR_BASE_INDEX = 3; // the agent row the reader is saved on
const ANCHOR_BASE_OFFSET = 14; // pixels into that row
const BASE_TOP = (i: number) => PAD + BASE.slice(0, i).reduce((a, r) => a + r.h, 0);

// The streamed reply: a linear growth so its height at any time is known at build time.
const REPLY_MIN = 40;
const REPLY_MAX = 420;
const STREAM_START = AT[0] + 0.6;
const STREAM_END = AT[3] + 2.4;
const streamFrac = (t: number) => Math.min(1, Math.max(0, (t - STREAM_START) / (STREAM_END - STREAM_START)));
const replyHeightAt = (t: number) => REPLY_MIN + (REPLY_MAX - REPLY_MIN) * streamFrac(t);

// The reader scrolls up to the saved row, and the released position is that row's top
// plus its offset. Computed once so the release does not jump.
const RELEASE_AT = AT[2] + 0.4;
const RELEASE_Y = PAD + BASE_TOTAL + replyHeightAt(RELEASE_AT) - VIEW.h;
const SAVED_Y = BASE_TOP(ANCHOR_BASE_INDEX) + ANCHOR_BASE_OFFSET;
// The content once every row is in: the follow position at the live end, and two saved places
// the reader scrolls to later (one before pressing the button, one before switching threads).
const FINAL_TOTAL = PAD + BASE_TOTAL + REPLY_MAX + 46 + 230 + 60;
const FOLLOW_END = FINAL_TOTAL - VIEW.h;
const SAVED_LATE = FOLLOW_END - 300;
const SAVED_SWITCH = FOLLOW_END - 240;

// The other thread, shown while switching: four rows of its own.
const OTHER = [
  { k: 'user', h: 58 },
  { k: 'agent', h: 96 },
  { k: 'user', h: 50 },
  { k: 'agent', h: 124 },
] as const;

const OTHER_ROWS = (() => {
  let top = 0;
  return OTHER.map((r, i) => {
    const row = { i, top, h: r.h };
    top += r.h + 10;
    return row;
  });
})();

const MODE_LABEL = ['released', 'following', 'anchored'] as const;
const MODE_COLOR = [colors.WARM, colors.POSITIVE, colors.SECONDARY] as const;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/* ----------------------------------------------------------------- helpers */
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

/* ---------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const mode = tl.channel('mode', 1); // 0 released, 1 following, 2 anchored
  const prevMode = tl.channel('prevMode', 1);
  const glideU = tl.channel('glideU', 1); // the view glides from the previous mode's scroll
  const relY = tl.channel('relY', RELEASE_Y); // the released scroll, in content pixels
  const streamU = tl.channel('streamU', 0); // the reply grows
  const prepU = tl.channel('prepU', 0); // three older rows load above
  const sentU = tl.channel('sentU', 0); // the sent user message appears
  const reply2U = tl.channel('reply2U', 0); // the anchored reply grows
  const toolU = tl.channel('toolU', 0); // the tool card appears
  const pillU = tl.channel('pillU', 0); // the scroll-to-end pill
  const ghostU = tl.channel('ghostU', 0); // the un-compensated ghosts, for contrast
  const threadU = tl.channel('threadU', 0); // 0 this thread, 1 the other thread
  const memU = tl.channel('memU', 0); // the memory cards
  const closeU = tl.channel('closeU', 0); // the closing diagram
  const dimU = tl.channel('dimU', 0); // the closing dim
  const gesture = tl.channel<string>('gesture', 'streaming');

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  // BEAT 1 — the reply streams in while the view follows the end
  let b = AT[0];
  tl.tween(streamU, 1, { at: STREAM_START, dur: STREAM_END - STREAM_START, ease: ease.linear });

  // BEAT 2 — the thread opens following
  b = AT[1];
  tl.set(gesture, 'opened at the end', b + 0.2);

  // BEAT 3 — a wheel gesture releases the follow; the view holds, then scrolls up to the saved row
  b = AT[2];
  tl.set(mode, 0, RELEASE_AT);
  tl.set(prevMode, 1, RELEASE_AT);
  tl.set(glideU, 1, RELEASE_AT);
  tl.set(gesture, 'wheel up', RELEASE_AT);
  tl.tween(relY, SAVED_Y, { at: RELEASE_AT + 0.4, dur: 1.4, ease: ease.move });

  // BEAT 4 — the pill appears after a short pause
  b = AT[3];
  tl.tween(pillU, 1, { at: b + 0.8, dur: 0.6, ease: ease.enter });
  tl.set(gesture, 'reply growing below', b + 0.2);

  // BEAT 5 — three rows load above; the saved row stays put; ghosts show the shift that did not happen
  b = AT[4];
  tl.set(gesture, 'load earlier turns', b + 0.2);
  tl.tween(prepU, 1, { at: b + 0.5, dur: 1.6, ease: ease.move });
  tl.tween(ghostU, 1, { at: b + 0.5, dur: 0.4, ease: ease.enter });
  tl.tween(ghostU, 0, { at: b + 2.4, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 530, y: 360, k: 1.06 }, { at: b + 0.3, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: b + 3.4, dur: 1.4, ease: ease.move });

  // BEAT 6 — the saved place: a row plus an offset
  b = AT[5];
  tl.set(gesture, 'saved place', b + 0.1);

  // BEAT 7 — a sent message anchors near the top; the reply grows into the end space
  b = AT[6];
  tl.set(gesture, 'send', b + 0.1);
  tl.tween(sentU, 1, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.set(mode, 2, b + 0.8);
  tl.set(prevMode, 0, b + 0.8);
  tl.set(glideU, 0, b + 0.8);
  tl.tween(glideU, 1, { at: b + 0.8, dur: 1.2, ease: ease.move });
  tl.tween(reply2U, 1, { at: b + 1.2, dur: 6.0, ease: ease.linear });
  tl.tween(pillU, 0, { at: b + 0.2, dur: 0.4, ease: ease.enter });

  // BEAT 8 — tool activity releases the anchor; the view scrolls to the end
  b = AT[7];
  tl.set(gesture, 'tool activity', b + 0.1);
  tl.tween(toolU, 1, { at: b + 0.2, dur: 0.6, ease: ease.pop });
  tl.set(mode, 1, b + 0.6);
  tl.set(prevMode, 2, b + 0.6);
  tl.set(glideU, 0, b + 0.6);
  tl.tween(glideU, 1, { at: b + 0.6, dur: 1.4, ease: ease.move });

  // BEAT 9 — scroll away, then the pill re-arms the follow
  b = AT[8];
  tl.set(gesture, 'scrolled away', b + 0.1);
  tl.set(mode, 0, b + 0.6);
  tl.set(prevMode, 1, b + 0.6);
  tl.set(glideU, 1, b + 0.6);
  tl.set(relY, FOLLOW_END, b + 0.6);
  tl.tween(relY, SAVED_LATE, { at: b + 0.8, dur: 1.4, ease: ease.move });
  tl.tween(pillU, 1, { at: b + 1.0, dur: 0.5, ease: ease.enter });
  tl.set(gesture, 'pill pressed', b + 3.6);
  tl.set(mode, 1, b + 3.8);
  tl.set(prevMode, 0, b + 3.8);
  tl.set(glideU, 0, b + 3.8);
  tl.tween(glideU, 1, { at: b + 3.8, dur: 1.2, ease: ease.move });
  tl.tween(pillU, 0, { at: b + 3.8, dur: 0.4, ease: ease.enter });

  // BEAT 10 — switch threads and come back; the saved place is restored
  b = AT[9];
  tl.set(gesture, 'scrolled away again', b + 0.1);
  tl.set(mode, 0, b + 0.3);
  tl.set(prevMode, 1, b + 0.3);
  tl.set(glideU, 1, b + 0.3);
  tl.set(relY, FOLLOW_END, b + 0.3);
  tl.tween(relY, SAVED_SWITCH, { at: b + 0.3, dur: 1.0, ease: ease.move });
  tl.set(gesture, 'switch thread', b + 1.4);
  tl.set(threadU, 1, b + 1.6);
  tl.set(threadU, 0, b + 4.0);
  tl.set(gesture, 'restored before paint', b + 4.0);

  // BEAT 11 — the memory cards
  b = AT[10];
  tl.tween(memU, 1, { at: b + 0.3, dur: 1.2, ease: ease.enter });

  // BEAT 12 — the closing diagram; the stage goes quiet under it
  b = AT[11];
  tl.tween(dimU, 1, { at: b + 0.1, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: b + 1.0, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: b + 0.1, dur: 1.0, ease: ease.move });

  return {
    tl,
    cam,
    mode,
    prevMode,
    glideU,
    relY,
    streamU,
    prepU,
    sentU,
    reply2U,
    toolU,
    pillU,
    ghostU,
    threadU,
    memU,
    closeU,
    dimU,
    gesture,
  };
}

const scene = buildScene();

/* ------------------------------------------------------------------ render */
type RowShape = { id: string; kind: 'user' | 'agent' | 'tool' | 'space'; top: number; h: number; label: string };

/** The content for this thread at the given channel values, from the top of the list down. */
function contentRows(v: {
  stream: number;
  prep: number;
  sent: number;
  reply2: number;
  tool: number;
  mode: number;
}): { rows: RowShape[]; total: number; sentTop: number } {
  const rows: RowShape[] = [];
  let y = PAD;
  const push = (id: string, kind: RowShape['kind'], h: number, label: string) => {
    rows.push({ id, kind, top: y, h, label });
    y += h;
  };
  for (let i = 0; i < HIST.length; i += 1) push(`hist${i}`, HIST[i]!.k as RowShape['kind'], HIST[i]!.h * v.prep, `older ${i + 1}`);
  // The older rows are prepended above the base rows, so the base rows sit below them.
  for (let i = 0; i < BASE.length; i += 1) push(`base${i}`, BASE[i]!.k as RowShape['kind'], BASE[i]!.h, `row ${i + 1}`);
  push('reply1', 'agent', REPLY_MIN + (REPLY_MAX - REPLY_MIN) * v.stream, 'streaming reply');
  const sentTop = y;
  if (v.sent > 0.001) push('sent', 'user', 46 * v.sent, 'sent message');
  if (v.sent > 0.001 && v.reply2 > 0.001) push('reply2', 'agent', lerp(30, 230, v.reply2), 'anchored reply');
  if (v.tool > 0.001) push('tool', 'tool', 60 * v.tool, 'tool activity');
  // In the anchored mode the view has empty space below the new turn, so the reply has room.
  let total = y;
  if (v.mode === 2 && v.sent > 0.001) {
    const space = Math.max(0, VIEW.h - ANCHOR_TOP_OFFSET - (y - sentTop));
    rows.push({ id: 'space', kind: 'space', top: y, h: space, label: 'anchored end space' });
    total = y + space;
  }
  return { rows, total, sentTop };
}

export function Render({ s }: { s: SceneState }) {
  const g = (ch: ChannelRef<number>) => s.get(ch);
  const mode = Math.round(g(scene.mode));
  const prevMode = Math.round(g(scene.prevMode));
  const glideU = clamp01(g(scene.glideU));
  const relY = g(scene.relY);
  const stream = clamp01(g(scene.streamU));
  const prep = clamp01(g(scene.prepU));
  const sent = clamp01(g(scene.sentU));
  const reply2 = clamp01(g(scene.reply2U));
  const tool = clamp01(g(scene.toolU));
  const pillU = clamp01(g(scene.pillU));
  const ghostU = clamp01(g(scene.ghostU));
  const threadU = Math.round(g(scene.threadU));
  const memU = clamp01(g(scene.memU));
  const closeU = clamp01(g(scene.closeU));
  const dimU = clamp01(g(scene.dimU));
  const gesture = s.get(scene.gesture);
  const keep = 1 - 0.86 * dimU;

  const content = contentRows({ stream, prep, sent, reply2, tool, mode });
  const total = content.total;
  const sentTop = content.sentTop;
  // Each mode's scroll: released holds its channel plus the prepend compensation; following
  // sits on the end; anchored sits a fixed distance under the new turn.
  const scrollOf = (m: number): number => {
    if (m === 0) return relY + HIST_TOTAL * prep;
    if (m === 2) return sent > 0.001 ? Math.max(0, sentTop - ANCHOR_TOP_OFFSET) : Math.max(0, total - VIEW.h);
    return Math.max(0, total - VIEW.h);
  };
  const scroll = lerp(scrollOf(prevMode), scrollOf(mode), glideU);
  const distanceFromEnd = total - (scroll + VIEW.h);
  const clipId = 'ch4-viewport-clip';
  const other = threadU === 1;

  // the saved place: which row is at the top edge, and how far into it
  const savedRow = content.rows.find((r) => r.kind !== 'space' && r.h > 0.5 && r.top <= scroll && r.top + r.h > scroll);
  const savedName = savedRow ? savedRow.label.replace('streaming ', '') : 'top of list';
  const savedLabel = savedRow ? `${savedName} + ${Math.round(scroll - savedRow.top)} px` : savedName;
  const modeLabel = MODE_LABEL[mode] ?? 'following';
  const modeColor = MODE_COLOR[mode] ?? colors.POSITIVE;

  return (
    <Camera {...s.get(scene.cam)}>
      <defs>
        <clipPath id={clipId}>
          <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} rx={10} />
        </clipPath>
      </defs>

      {/* header */}
      <g opacity={keep}>
        <Txt x={60} y={62} text="following the live end" size={22} weight={700} />
        <Txt x={60} y={86} text="a reader's place, a streaming reply, and one mode lamp" size={14} mono color={colors.MUTED} />
      </g>

      {/* the reader's panel: the mode lamp, the saved place, and the last gesture */}
      <g opacity={keep}>
        <rect x={60} y={112} width={240} height={494} rx={14} fill={PANEL_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <Txt x={80} y={140} text="mode" size={13} mono color={colors.MUTED} />
        <rect x={80} y={152} width={200} height={40} rx={10} fill={CARD_FILL} stroke={modeColor} strokeWidth={1.6} />
        <Txt x={180} y={178} text={modeLabel} size={18} weight={700} mono anchor="middle" color={modeColor} />
        <Txt x={80} y={230} text="saved place" size={13} mono color={colors.MUTED} />
        <Txt x={80} y={254} text={savedLabel} size={15} mono color={colors.TEXT} u={mode === 0 ? 1 : 0.5} />
        <Txt x={80} y={300} text="last gesture" size={13} mono color={colors.MUTED} />
        <Txt x={80} y={324} text={gesture} size={15} mono color={colors.ACCENT} />
        <Txt x={80} y={380} text="distance from the end" size={13} mono color={colors.MUTED} />
        <Txt x={80} y={404} text={`${Math.max(0, Math.round(distanceFromEnd))} px`} size={15} mono color={colors.TEXT} />
        <Txt x={80} y={460} text="one lamp, three states:" size={13} mono color={colors.MUTED} />
        <Txt x={80} y={482} text="following, released, anchored" size={12} mono color={colors.MUTED} />
      </g>

      {/* the viewport: the list, clipped */}
      <g opacity={keep}>
        <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} rx={10} fill={PANEL_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <g clipPath={`url(#${clipId})`}>
          {other ? (
            <g>
              {OTHER_ROWS.map((r) => (
                <g key={r.i}>
                  <rect x={COL.x} y={VIEW.y + 20 + r.top} width={COL.w} height={r.h} rx={8} fill={CARD_FILL} stroke={colors.POSITIVE} strokeWidth={1.2} />
                  <Txt x={COL.x + 10} y={VIEW.y + 36 + r.top} text={`other thread · ${r.i + 1}`} size={11.5} mono color={colors.POSITIVE} />
                </g>
              ))}
            </g>
          ) : (
            <g>
              {content.rows.map((r) => {
                const y = VIEW.y + r.top - scroll;
                if (r.kind === 'space') {
                  return (
                    <rect key={r.id} x={COL.x} y={y} width={COL.w} height={Math.max(0, r.h)} rx={6} fill="none" stroke={colors.SECONDARY} strokeWidth={1} strokeDasharray="5 5" opacity={0.6} />
                  );
                }
                const color = r.kind === 'user' ? colors.ACCENT : r.kind === 'tool' ? colors.WARM : colors.SECONDARY;
                const lines = Math.max(1, Math.floor((r.h - 20) / 14));
                return (
                  <g key={r.id} opacity={r.h > 0.5 ? 1 : 0}>
                    <rect x={COL.x} y={y + 2} width={COL.w} height={Math.max(0, r.h - 4)} rx={7} fill={CARD_FILL} stroke={color} strokeWidth={1.2} opacity={0.95} />
                    <Txt x={COL.x + 10} y={y + 16} text={r.label} size={11.5} mono color={color} />
                    {Array.from({ length: Math.min(lines, 6) }, (_, k) => (
                      <rect key={k} x={COL.x + 10} y={y + 24 + k * 14} width={(COL.w - 40) * (0.4 + 0.5 * ((k * 37 + r.top) % 7) / 7)} height={6} rx={3} fill={color} opacity={0.4} />
                    ))}
                  </g>
                );
              })}
              {/* the un-compensated ghosts: where the base rows would have gone without the anchor */}
              {prep > 0.01 &&
                content.rows
                  .filter((r) => r.id.startsWith('base'))
                  .map((r) => {
                    const ghostY = VIEW.y + r.top - (scroll - HIST_TOTAL * prep);
                    if (ghostY > VIEW.y + VIEW.h || ghostY + r.h < VIEW.y) return null;
                    return (
                      <rect
                        key={`ghost-${r.id}`}
                        x={COL.x}
                        y={ghostY}
                        width={COL.w}
                        height={r.h}
                        rx={7}
                        fill="none"
                        stroke={colors.WARM}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        opacity={0.35 * ghostU}
                      />
                    );
                  })}
            </g>
          )}
          {/* the saved-place line at the top edge, where the reader was */}
          {!other && (
            <g opacity={mode === 0 ? 1 : 0.45}>
              <line x1={VIEW.x} y1={VIEW.y + 1} x2={VIEW.x + VIEW.w} y2={VIEW.y + 1} stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="6 4" />
            </g>
          )}
        </g>
        {/* the loaded-above label, and the pill */}
        {!other && (
          <Txt x={VIEW.x + 10} y={VIEW.y + 16} text="3 older turns loaded above; nothing on screen moved" size={11.5} mono color={colors.WARM} u={ghostU} />
        )}
        {!other && (
          <g opacity={clamp01(pillU) * (mode === 0 ? 1 : 0)}>
            <rect x={VIEW.x + 110} y={VIEW.y + VIEW.h - 40} width={180} height={28} rx={14} fill={CARD_FILL} stroke={colors.ACCENT} strokeWidth={1.3} />
            <Txt x={VIEW.x + 200} y={VIEW.y + VIEW.h - 22} text="Scroll to end" size={13} mono anchor="middle" color={colors.ACCENT} />
          </g>
        )}
        {other && <Txt x={VIEW.x + 10} y={VIEW.y + 16} text="thread B · its own place" size={11.5} mono color={colors.POSITIVE} />}
      </g>

      {/* the right panel: the content length, the memory cards, and then the diagram */}
      <g opacity={keep}>
        <rect x={760} y={112} width={460} height={494} rx={14} fill={PANEL_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <Txt x={784} y={140} text="content length, and the window on it" size={13} mono color={colors.MUTED} />
        <rect x={784} y={156} width={412} height={14} rx={5} fill={TRACK} />
        <rect x={784} y={156} width={412 * clamp01(total / 1200)} height={14} rx={5} fill={colors.ACCENT} opacity={0.35} />
        <rect x={784 + 412 * clamp01(Math.max(0, scroll) / 1200)} y={152} width={412 * clamp01(VIEW.h / 1200)} height={22} rx={5} fill="none" stroke={colors.ACCENT} strokeWidth={1.4} />
        <Txt x={784} y={198} text={`total ${Math.round(total)} px`} size={13} mono color={colors.MUTED} />
        <Txt x={1196} y={198} text={`window at ${Math.round(scroll)} px`} size={13} mono anchor="end" color={colors.MUTED} />
        <g opacity={clamp01(memU)}>
          <rect x={784} y={236} width={412} height={100} rx={12} fill={CARD_FILL} stroke={colors.ACCENT} strokeWidth={1.2} />
          <Txt x={806} y={266} text="saved places" size={14} mono color={colors.MUTED} />
          <Txt x={806} y={302} text="up to one hundred threads" size={22} weight={700} color={colors.TEXT} />
          <rect x={784} y={354} width={412} height={100} rx={12} fill={CARD_FILL} stroke={colors.POSITIVE} strokeWidth={1.2} />
          <Txt x={806} y={384} text="last state in memory" size={14} mono color={colors.MUTED} />
          <Txt x={806} y={420} text="five minutes after you leave" size={22} weight={700} color={colors.TEXT} />
        </g>
      </g>

      {/* the closing diagram: an opaque panel, drawn last */}
      <g opacity={clamp01(closeU)}>
        <rect x={300} y={160} width={680} height={330} rx={16} fill={CARD_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <Txt x={330} y={196} text="the states" size={14} mono color={colors.MUTED} />
        <rect x={340} y={250} width={190} height={58} rx={12} fill={PANEL_FILL} stroke={colors.POSITIVE} strokeWidth={1.8} />
        <Txt x={435} y={286} text="following" size={20} weight={700} mono anchor="middle" color={colors.POSITIVE} />
        <rect x={750} y={250} width={190} height={58} rx={12} fill={PANEL_FILL} stroke={colors.WARM} strokeWidth={1.8} />
        <Txt x={845} y={286} text="released" size={20} weight={700} mono anchor="middle" color={colors.WARM} />
        <rect x={545} y={392} width={190} height={58} rx={12} fill={PANEL_FILL} stroke={colors.SECONDARY} strokeWidth={1.8} />
        <Txt x={640} y={428} text="anchored" size={20} weight={700} mono anchor="middle" color={colors.SECONDARY} />
        {/* scroll away and reach the end: the two directions between following and released */}
        <line x1={530} y1={270} x2={745} y2={270} stroke={colors.WARM} strokeWidth={1.6} />
        <path d="M745 270 L735 264 L735 276 Z" fill={colors.WARM} />
        <Txt x={638} y={262} text="scroll away" size={13} mono anchor="middle" color={colors.MUTED} />
        <line x1={745} y1={292} x2={535} y2={292} stroke={colors.POSITIVE} strokeWidth={1.6} />
        <path d="M535 292 L545 286 L545 298 Z" fill={colors.POSITIVE} />
        <Txt x={638} y={312} text="reach the end" size={13} mono anchor="middle" color={colors.MUTED} />
        {/* send: from following into anchored; tool activity: from anchored back to following */}
        <line x1={420} y1={310} x2={560} y2={398} stroke={colors.SECONDARY} strokeWidth={1.6} />
        <path d="M560 398 L548 396 L554 386 Z" fill={colors.SECONDARY} />
        <Txt x={468} y={370} text="send" size={13} mono anchor="end" color={colors.MUTED} />
        <line x1={620} y1={392} x2={470} y2={312} stroke={colors.POSITIVE} strokeWidth={1.4} strokeDasharray="5 4" />
        <path d="M470 312 L482 314 L476 324 Z" fill={colors.POSITIVE} />
        <Txt x={690} y={372} text="tool activity" size={13} mono color={colors.MUTED} />
      </g>
    </Camera>
  );
}

export const vizScene = () => scene;
