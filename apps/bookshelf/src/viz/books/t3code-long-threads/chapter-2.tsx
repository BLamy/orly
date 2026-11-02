// Paging history with a cursor
// T3 Code: Long Threads · Chapter 2
//
// The machine: a tape of forty turns, newest at the bottom. The server packs a page
// by walking backward from the newest row (or from the cursor) and stops at the first
// limit it reaches: a count of user turns, a count of rows, or about a megabyte. The
// window on the tape is what the app holds; the cursor marks where the next page
// starts. Every page moves the same window; nothing else changes.
//
// BEATS (captions are fixed, narration order)
//  1 the first page: the newest ten turns sit inside the window; older turns wait unloaded
//  2 the packer walks backward from the newest row and stops at the turn limit
//  3 the three limits shown as meters: turns, rows, and about a megabyte
//  4 load earlier turns: the packer stops early when the next turn would pass a megabyte
//  5 the cursor is an opaque token naming the next row to read
//  6 the older rows merge in front of the window; a repeated row is rejected by its key
//  7 a search for older text widens the turn budget to reach its message
//  8 a long agent run folds its finished work rows into one row with its own cursor; opening it shows a skeleton, then the rows
//  9 a live event arrives; an event already applied is skipped by sequence number
// 10 the closing ladder of pages, with the tape dimmed to a whisper
//
// SOURCES (T3 Code repo, HEAD cc59f99e; paths are repo-relative)
//  apps/server/src/orchestration-v2/threadHistoryPaging.ts:9-20 page policy: ten user turns, 75 or 500 items, one megabyte
//  apps/server/src/orchestration-v2/threadHistoryPaging.ts:24 older pages read up to twenty user turns
//  apps/server/src/orchestration-v2/threadHistoryPaging.ts:307-378 selectOlderTimelinePage: walks from the newest row; stops at item, byte, and turn limits
//  apps/server/src/orchestration-v2/threadHistoryPaging.ts:419-450 targeted page widens to up to forty turns
//  apps/server/src/orchestration-v2/threadHistoryPaging.ts:119-175 cursor: versioned, base64url, sequence and row identity; 4096 characters at most
//  apps/server/src/orchestration-v2/threadHistoryPaging.ts:201-255 deferWorkHistoryRows: more than 150 deferrable rows fold into an anchor
//  apps/server/src/orchestration-v2/ProjectionStore.ts:2882-2915 user-turn anchors bound the newest window in SQL
//  apps/server/src/orchestration-v2/http.ts:244-275 history route validates the cursor, then reads a page
//  packages/client-runtime/src/state/threads.ts:664-819 loadEarlier: one page per request, merged and recorded
//  packages/client-runtime/src/state/threads.ts:749-757 keeps paging until a page holds a user turn (no target)
//  packages/client-runtime/src/state/threadHistoryMerge.ts:52-161 older rows prepended; keyed by source thread and item
//  packages/client-runtime/src/state/threads.ts:486 events at or below the applied sequence are skipped
//  apps/web/src/components/chat/MessagesTimeline.tsx:1376-1406 "Load earlier turns" control; loading text
//  apps/web/src/components/chat/MessagesTimeline.tsx:1582-1619 folded work loads by work anchor; skeleton; retry text
//  apps/web/src/components/chat/useThreadFindNavigation.ts:265-272 find loads earlier through the matched entry
import { Camera, Timeline, cameraInterp, colors, ease, CAMERA_HOME } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'A long thread arrives in pages. The first page is the newest slice, and everything older waits behind a cursor.',
  'The server builds a page by walking backward from the newest row. It stops at whichever limit it reaches first.',
  'Four limits apply. They cap your turns, the rows, the raw turns, and about a megabyte of data.',
  'Load earlier turns sends the cursor back. This page stops early, because the next turn would push it past a megabyte.',
  'The cursor is an opaque token. It records the snapshot sequence and which row is oldest on the page, and the app never looks inside.',
  'The rows from the page go in front of the rows already on screen. Each row is keyed by its source, so none shows twice.',
  'A search for older text asks for a page through that message. The server widens the turn budget, up to forty turns, to reach it.',
  'When one run holds more than one hundred fifty finished work rows, they fold into a single row with its own cursor.',
  'Opening the fold loads those rows through the work view, behind a loading skeleton. If that fails, a retry is offered.',
  'New events arrive on the live connection. Any event the app has already applied is skipped by its sequence number.',
  'So a long thread is a window with a cursor behind it. Each press walks the window backward by a bounded budget.',
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
const BODY_FILL = '#1b2a44';

const TURNS = 40; // index 0 is the newest turn; index 39 the oldest
const TAPE = { x: 340, w: 260, bottom: 606, gap: 2 };
// Loaded counts after each page: the first page is ten turns; each later page extends it.
const LOADED = [10, 17, 39, 40] as const;
const FOLD_TURN = 5; // a long agent run inside the first page
const BIG_TURN = 17; // one turn carries a large tool output
const TARGET_TURN = 38; // the message a search finds, far back in history
const ROWS_PER_TURN = 14; // illustrative row count per turn

// Bytes per turn, in mebibytes. Precomputed; the big turn alone would overflow a page
// that already holds seven turns, and the last search page fits under one megabyte.
const BYTES: number[] = Array.from({ length: TURNS }, (_, i) => {
  if (i < 10) return 0.06;
  if (i < 17) return 0.05;
  if (i === BIG_TURN) return 0.7;
  if (i <= TARGET_TURN) return 0.012;
  return 0.04;
});
// Block height follows bytes, so the big turn reads as big. Pitch adds the gap.
const HEIGHT: number[] = BYTES.map((b) => 6 + 80 * b);
// Y coordinates: the bottom edge of each block, and its top edge.
const Y_BOTTOM: number[] = [];
const Y_TOP: number[] = [];
{
  let y = TAPE.bottom;
  for (let i = 0; i < TURNS; i += 1) {
    Y_BOTTOM.push(y);
    Y_TOP.push(y - HEIGHT[i]!);
    y = y - HEIGHT[i]! - TAPE.gap;
  }
}

// The four packing passes, each the candidate turns it walks, in order from the cursor.
const PAGE_ONE = Array.from({ length: 10 }, (_, i) => i); // turns 0..9
const PAGE_TWO = Array.from({ length: 8 }, (_, i) => 10 + i); // turns 10..17; 17 is rejected
const PAGE_SEARCH = Array.from({ length: TARGET_TURN - BIG_TURN + 1 }, (_, i) => BIG_TURN + i); // 17..38
const PAGE_LAST = [39];
const PASSES = [PAGE_ONE, PAGE_TWO, PAGE_SEARCH, PAGE_LAST];

const CAM_HOME: CameraState = CAMERA_HOME;

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

// A budget meter. `ghost` is the cost of the row that would have been taken next; the
// red stretch shows how far it would have reached past the current value.
function Meter({
  x,
  y,
  w,
  label,
  value,
  limit,
  unit,
  color,
  ghost = 0,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  value: number;
  limit: number;
  unit: string;
  color: string;
  ghost?: number;
}) {
  const frac = clamp01(value / limit);
  const ghostFrac = clamp01((value + ghost) / limit) - frac;
  return (
    <g>
      <Txt x={x} y={y - 8} text={label} size={13} mono color={colors.MUTED} />
      <Txt x={x + w} y={y - 8} text={unit} size={13} mono anchor="end" color={colors.MUTED} />
      <rect x={x} y={y} width={w} height={14} rx={5} fill={TRACK} />
      <rect x={x} y={y} width={w * frac} height={14} rx={5} fill={color} opacity={0.9} />
      {ghostFrac > 0 && (
        <rect x={x + w * frac} y={y} width={w * ghostFrac} height={14} rx={5} fill={colors.NEGATIVE} opacity={0.55} />
      )}
      <line x1={x + w} y1={y - 4} x2={x + w} y2={y + 18} stroke={colors.NEGATIVE} strokeWidth={1.4} strokeDasharray="3 3" />
    </g>
  );
}

/* ---------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const stage = tl.channel('stage', 0); // which LOADED count the window shows (0..3)
  const pass = tl.channel('pass', 0); // which packing pass is running (0..3)
  const scanU = tl.channel('scanU', 1); // the packer's sweep through its candidates; the first page starts complete
  const mergeU = tl.channel('mergeU', 1); // the newest page slides into the window
  const cursorU = tl.channel('cursorU', 1); // the cursor token's highlight
  const dupU = tl.channel('dupU', 0); // a repeated row is rejected by its key
  const findU = tl.channel('findU', 0); // the search chip and its target
  const foldU = tl.channel('foldU', 0); // the folded work chip appears
  const skelU = tl.channel('skelU', 0); // the loading skeleton over the fold
  const openU = tl.channel('openU', 0); // the fold opens into its rows
  const liveU = tl.channel('liveU', 0); // the tape shifts up for a live turn
  const packetU = tl.channel('packetU', 0); // a live packet travels in and bounces
  const dimU = tl.channel('dimU', 0); // the closing dim

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  // BEAT 1 — the first page is in place from the start: stage 0, ten turns loaded.
  let b = AT[0];
  tl.tween(cam, CAM_HOME, { at: b, dur: 0.1, ease: ease.linear });

  // BEAT 2 — the packer walks backward from the newest row and stops at the turn limit.
  b = AT[1];
  tl.set(pass, 0, b + 0.2);
  tl.set(scanU, 0, b + 0.2);
  tl.tween(scanU, 1, { at: b + 0.6, dur: 3.0, ease: ease.linear });

  // BEAT 3 — the three meters; the byte meter pulses once to show it has room.
  b = AT[2];
  tl.tween(cam, { x: 640, y: 380, k: 1.04 }, { at: b + 0.1, dur: 1.2, ease: ease.move });

  // BEAT 4 — load earlier turns: the second pass stops before the big turn.
  b = AT[3];
  tl.set(pass, 1, b + 0.2);
  tl.set(scanU, 0, b + 0.2);
  tl.tween(scanU, 1, { at: b + 0.8, dur: 3.2, ease: ease.linear });
  tl.set(stage, 1, b + 4.2);
  tl.set(mergeU, 0, b + 4.2);
  tl.tween(mergeU, 1, { at: b + 4.3, dur: 0.9, ease: ease.move });
  tl.tween(cam, CAM_HOME, { at: b + 4.6, dur: 1.2, ease: ease.move });

  // BEAT 5 — the cursor token is highlighted as the next row to read.
  b = AT[4];
  tl.tween(cursorU, 0.4, { at: b + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(cursorU, 1, { at: b + 1.6, dur: 0.8, ease: ease.enter });

  // BEAT 6 — the merge: the rows from page two sit in front; a repeated row bounces.
  b = AT[5];
  tl.tween(dupU, 1, { at: b + 1.2, dur: 1.2, ease: ease.linear });
  tl.tween(dupU, 0, { at: AT[6] + 0.1, dur: 0.6, ease: ease.enter });

  // BEAT 7 — the search widens the turn budget and loads down to the match.
  b = AT[6];
  tl.tween(findU, 1, { at: b + 0.2, dur: 0.8, ease: ease.enter });
  tl.set(pass, 2, b + 1.2);
  tl.set(scanU, 0, b + 1.2);
  tl.tween(scanU, 1, { at: b + 1.6, dur: 3.4, ease: ease.linear });
  tl.set(stage, 2, b + 5.2);
  tl.set(mergeU, 0, b + 5.2);
  tl.tween(mergeU, 1, { at: b + 5.3, dur: 0.9, ease: ease.move });

  // BEAT 8 — a folded work row appears inside the first long run.
  b = AT[7];
  tl.tween(foldU, 1, { at: b + 0.3, dur: 1.0, ease: ease.pop });

  // BEAT 9 — opening the fold: a skeleton, then the rows.
  b = AT[8];
  tl.tween(skelU, 1, { at: b + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(skelU, 0, { at: b + 1.8, dur: 0.6, ease: ease.enter });
  tl.tween(openU, 1, { at: b + 1.9, dur: 1.4, ease: ease.move });

  // BEAT 10 — a live turn arrives at the bottom; a repeated event bounces off.
  b = AT[9];
  tl.tween(openU, 0, { at: b + 0.0, dur: 0.5, ease: ease.enter });
  tl.tween(foldU, 0, { at: b + 0.0, dur: 0.5, ease: ease.enter });
  tl.tween(liveU, 1, { at: b + 0.4, dur: 0.9, ease: ease.move });
  tl.tween(packetU, 1, { at: b + 1.6, dur: 2.2, ease: ease.linear });

  // BEAT 11 — the last page loads, the control goes, and the stage goes quiet.
  b = AT[10];
  tl.set(pass, 3, b + 0.2);
  tl.set(scanU, 0, b + 0.2);
  tl.tween(scanU, 1, { at: b + 0.5, dur: 1.2, ease: ease.linear });
  tl.set(stage, 3, b + 1.8);
  tl.tween(dimU, 1, { at: b + 2.0, dur: 1.2, ease: ease.move });

  return {
    tl,
    cam,
    stage,
    pass,
    scanU,
    mergeU,
    cursorU,
    dupU,
    findU,
    foldU,
    skelU,
    openU,
    liveU,
    packetU,
    dimU,
  };
}

const scene = buildScene();

/* ------------------------------------------------------------------ render */
export function Render({ s }: { s: SceneState }) {
  const g = (ch: ChannelRef<number>) => s.get(ch);
  const stage = Math.round(g(scene.stage));
  const pass = Math.round(g(scene.pass));
  const scanU = g(scene.scanU);
  const mergeU = g(scene.mergeU);
  const cursorU = g(scene.cursorU);
  const dupU = g(scene.dupU);
  const findU = g(scene.findU);
  const foldU = g(scene.foldU);
  const skelU = g(scene.skelU);
  const openU = g(scene.openU);
  const liveU = g(scene.liveU);
  const packetU = g(scene.packetU);
  const dimU = g(scene.dimU);
  const keep = 1 - 0.85 * clamp01(dimU);

  // The packing pass in progress: how many candidates it has walked, and what it kept.
  const candidates = PASSES[pass] ?? PAGE_ONE;
  const walked = Math.min(candidates.length, Math.floor(clamp01(scanU) * candidates.length + 0.0001));
  // The second pass rejects the big turn: taking it would pass one megabyte. Everything
  // else walked is kept, and the rejected cost is drawn as a ghost on the bytes meter.
  const rejectedWalked = pass === 1 && walked >= candidates.length;
  const kept = candidates.slice(0, walked).filter((i) => !(pass === 1 && i === BIG_TURN));
  const keptBytes = kept.reduce((sum, i) => sum + BYTES[i]!, 0);
  const ghostBytes = rejectedWalked ? BYTES[BIG_TURN]! : 0;
  const limitTurns = pass === 2 ? 22 : pass === 1 || pass === 3 ? 20 : 10;
  const rowsHere = kept.length * ROWS_PER_TURN;

  // Loaded turns: the window before and after the latest page, blended by the merge.
  const loadedBefore = LOADED[Math.max(0, stage - 1)] ?? LOADED[0];
  const loadedNow = LOADED[Math.min(stage, LOADED.length - 1)] ?? LOADED[0];
  const topOf = (count: number) => (count <= 0 ? TAPE.bottom : Y_TOP[count - 1]!);
  const windowTop = lerp(topOf(loadedBefore), topOf(loadedNow), clamp01(mergeU));
  const hasMore = stage < 3;
  const scanY = candidates.length > 0 ? lerp(Y_BOTTOM[candidates[0]!]!, Y_TOP[candidates[candidates.length - 1]!]!, clamp01(scanU)) : TAPE.bottom;

  return (
    <Camera {...s.get(scene.cam)}>
      {/* header */}
      <g opacity={keep}>
        <Txt x={60} y={62} text="paging a long history" size={22} weight={700} />
        <Txt x={60} y={86} text="a window over the newest turns, widened by a cursor" size={14} mono color={colors.MUTED} />
      </g>

      {/* the tape: forty turns, newest at the bottom */}
      <g opacity={keep * (1 - 0.7 * clamp01(dimU)) } transform={`translate(0 ${-14 * clamp01(liveU)})`}>
        {Array.from({ length: TURNS }, (_, i) => {
          const loaded = i < loadedNow;
          const onPass = candidates.includes(i) && walked > 0 && (candidates.indexOf(i) < walked);
          const rejectedHere = pass === 1 && i === BIG_TURN && walked >= candidates.length;
          const fill = i === BIG_TURN ? colors.WARM : BODY_FILL;
          const fade = loaded ? 1 : 0.6;
          const flash = onPass ? 1 : 0;
          const x = TAPE.x;
          const y = Y_TOP[i]!;
          const h = HEIGHT[i]!;
          // the newest page's rows slide down from above as the merge plays
          const slide = loaded && i >= loadedBefore && i < loadedNow ? (1 - clamp01(mergeU)) * -26 : 0;
          return (
            <g key={i} transform={`translate(0 ${slide})`} opacity={fade}>
              <rect
                x={x}
                y={y}
                width={TAPE.w}
                height={h}
                rx={3}
                fill={loaded ? fill : 'none'}
                stroke={loaded ? (flash ? colors.ACCENT : PANEL_EDGE) : PANEL_EDGE}
                strokeWidth={flash ? 1.8 : 1}
                strokeDasharray={loaded ? undefined : '4 4'}
                opacity={loaded ? (flash ? 0.95 : 0.8) : 0.6}
              />
              {loaded && (
                <rect x={x} y={y} width={3} height={h} rx={1} fill={colors.ACCENT} opacity={0.7} />
              )}
              {rejectedHere && (
                <g opacity={clamp01(scanU * 4 - 2)}>
                  <rect x={x - 6} y={y - 4} width={TAPE.w + 12} height={h + 8} rx={5} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
                </g>
              )}
            </g>
          );
        })}
        {/* the fold on turn five: finished work rows folded into one row with a cursor */}
        {(() => {
          const y = Y_TOP[FOLD_TURN]!;
          return (
            <g opacity={clamp01(foldU) * (1 - clamp01(openU))}>
              <line x1={TAPE.x - 14} y1={y} x2={TAPE.x - 14} y2={Y_BOTTOM[FOLD_TURN]!} stroke={colors.SECONDARY} strokeWidth={2} />
              <rect x={96} y={y - 8} width={222} height={24} rx={7} fill={CARD_FILL} stroke={colors.SECONDARY} strokeWidth={1.4} />
              <Txt x={107} y={y + 9} text="work · 160 rows folded" size={13} mono color={colors.SECONDARY} />
            </g>
          );
        })()}
        {/* the window frame and the cursor at its top edge */}
        <rect
          x={TAPE.x - 14}
          y={windowTop - 6}
          width={TAPE.w + 28}
          height={TAPE.bottom - windowTop + 12}
          rx={12}
          fill="none"
          stroke={colors.ACCENT}
          strokeWidth={1.6}
          opacity={0.9}
        />
        <Txt x={TAPE.x} y={124} text="older history, not loaded" size={12} mono color={colors.MUTED} u={hasMore ? 1 : 0} />
      </g>

      {/* the cursor pill and the load control, at the window's top edge */}
      <g opacity={keep}>
        <g opacity={clamp01(hasMore ? 1 : 0)}>
          <rect x={96} y={windowTop + 32} width={222} height={28} rx={14} fill={CARD_FILL} stroke={colors.ACCENT} strokeWidth={1.3} />
          <Txt x={207} y={windowTop + 51} text="Load earlier turns" size={13} mono anchor="middle" color={colors.ACCENT} />
        </g>
        <g opacity={clamp01(cursorU) * clamp01(hasMore ? 1 : 0.3)}>
          <rect x={96} y={windowTop - 14} width={222} height={38} rx={9} fill={CARD_FILL} stroke={colors.TEXT} strokeWidth={1} opacity={0.9} />
          <Txt x={106} y={windowTop + 3} text="historyCursor" size={12.5} mono color={colors.TEXT} />
          <Txt x={106} y={windowTop + 19} text={stage === 0 ? 'eyJ2IjoxLCJzZXEiOjQx' : stage === 1 ? 'eyJ2IjoxLCJzZXEiOjQ2' : 'eyJ2IjoxLCJzZXEiOjUx'} size={11} mono color={colors.MUTED} />
        </g>
      </g>

      {/* the page budget: three meters that stop the packer */}
      <g opacity={keep}>
        <rect x={660} y={112} width={560} height={300} rx={14} fill={PANEL_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <Txt x={684} y={142} text={`page budget · pass ${pass === 0 ? 'one' : pass === 1 ? 'two' : pass === 2 ? 'search' : 'last'}`} size={14} mono color={colors.MUTED} />
        <Meter
          x={684}
          y={180}
          w={512}
          label="user turns on this page"
          value={kept.length}
          limit={limitTurns}
          unit={`limit ${limitTurns}${pass === 2 ? ', widened' : ''}`}
          color={colors.ACCENT}
        />
        <Meter x={684} y={240} w={512} label="rows (illustrative)" value={rowsHere} limit={500} unit="limit 500" color={colors.SECONDARY} />
        <Meter
          x={684}
          y={300}
          w={512}
          label="encoded bytes on this page (illustrative sizes)"
          value={keptBytes}
          limit={1}
          unit="limit 1 MiB"
          color={rejectedWalked ? colors.WARM : colors.POSITIVE}
          ghost={ghostBytes}
        />
        <Txt
          x={684}
          y={364}
          text={
            pass === 0
              ? 'stopped by the turn limit at ten'
              : pass === 1
                ? rejectedWalked
                  ? 'stopped by bytes: turn 17 would pass one megabyte'
                  : 'walking back from the cursor'
                : pass === 2
                  ? 'stopped at the search target, turn 38'
                  : 'start of history: no more pages'
          }
          size={16}
          weight={700}
          color={pass === 1 && rejectedWalked ? colors.NEGATIVE : colors.ACCENT}
          u={clamp01(scanU) > 0.98 ? 1 : clamp01(scanU) * 0.6}
        />
      </g>

      {/* the packer's sweep line */}
      <g opacity={keep * clamp01(scanU * 8) * (1 - clamp01(scanU - 0.999) * 1000)}>
        <line x1={TAPE.x - 22} y1={scanY} x2={TAPE.x + TAPE.w + 22} y2={scanY} stroke={colors.ACCENT} strokeWidth={2} />
        <circle cx={TAPE.x - 22} cy={scanY} r={4} fill={colors.ACCENT} />
      </g>

      {/* the repeated row: a second copy of turn twelve arrives and is rejected by key */}
      <g opacity={keep * clamp01(dupU) * (1 - clamp01((dupU - 0.85) * 6.6))} transform={`translate(${lerp(1000, TAPE.x + 40, clamp01(dupU))} ${Y_TOP[12]! + 4})`}>
        <rect x={0} y={0} width={190} height={22} rx={6} fill={CARD_FILL} stroke={colors.NEGATIVE} strokeWidth={1.3} strokeDasharray="4 3" />
        <Txt x={10} y={15} text="turn 12, same key" size={12.5} mono color={colors.NEGATIVE} />
      </g>
      <Txt x={TAPE.x + TAPE.w + 26} y={Y_TOP[12]! + 19} text="kept once" size={12.5} mono color={colors.POSITIVE} u={clamp01((dupU - 0.85) * 6.6)} />

      {/* the search: the chip, and the target turn outlined */}
      <g opacity={keep * clamp01(findU)}>
        <rect x={660} y={440} width={560} height={34} rx={10} fill={CARD_FILL} stroke={colors.SECONDARY} strokeWidth={1.3} />
        <Txt x={680} y={462} text={`find: a phrase in turn 38 · throughEntryId, widened budget`} size={13.5} mono color={colors.SECONDARY} />
        <rect x={TAPE.x - 12} y={Y_TOP[TARGET_TURN]! - 4} width={TAPE.w + 24} height={HEIGHT[TARGET_TURN]! + 8} rx={4} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} strokeDasharray="5 3" />
      </g>

      {/* the open fold, with its loading skeleton and then its rows */}
      <g opacity={keep * clamp01(skelU + openU)}>
        <rect x={TAPE.x - 4} y={Y_TOP[FOLD_TURN]! - 220} width={TAPE.w + 8} height={206} rx={10} fill={CARD_FILL} stroke={colors.SECONDARY} strokeWidth={1.4} opacity={clamp01(skelU + openU)} />
        <Txt x={TAPE.x + 10} y={Y_TOP[FOLD_TURN]! - 196} text="work history" size={12.5} mono color={colors.SECONDARY} u={clamp01(skelU + openU)} />
        <g opacity={clamp01(skelU) * (1 - clamp01(openU * 2))}>
          {[0, 1, 2].map((k) => (
            <rect key={k} x={TAPE.x + 10} y={Y_TOP[FOLD_TURN]! - 176 + k * 26} width={TAPE.w - 20 - k * 40} height={10} rx={4} fill={colors.SECONDARY} opacity={0.25 + 0.15 * clamp01(Math.sin(k) + 0.5)} />
          ))}
          <Txt x={TAPE.x + 10} y={Y_TOP[FOLD_TURN]! - 26} text="loading work history" size={12} mono color={colors.MUTED} />
        </g>
        <g opacity={clamp01(openU)}>
          {Array.from({ length: 160 }, (_, k) => {
            const col = k % 32;
            const row = Math.floor(k / 32);
            return <rect key={k} x={TAPE.x + 8 + col * 7.6} y={Y_TOP[FOLD_TURN]! - 178 + row * 9} width={5.6} height={5.6} rx={1} fill={colors.SECONDARY} opacity={0.75} />;
          })}
        </g>
      </g>

      {/* the live event: it lands at the bottom; a repeated event bounces off */}
      <g opacity={keep}>
        <g opacity={clamp01(liveU)}>
          <rect x={TAPE.x} y={TAPE.bottom + 6} width={TAPE.w} height={14} rx={4} fill={colors.POSITIVE} opacity={0.85} />
          <Txt x={TAPE.x + 8} y={TAPE.bottom + 17} text="sequence 2091, the new turn" size={11} mono color="#06231a" weight={700} />
        </g>
        <g opacity={clamp01(packetU * 6) * (1 - clamp01((packetU - 0.82) * 5.5))} transform={`translate(${lerp(1200, 690, clamp01(packetU))} 540)`}>
          <rect x={0} y={0} width={150} height={24} rx={6} fill={CARD_FILL} stroke={colors.ACCENT} strokeWidth={1.3} />
          <Txt x={10} y={16} text="sequence 2088" size={12.5} mono color={colors.ACCENT} />
        </g>
        <Txt x={660} y={560} text="already applied, skipped" size={13} mono color={colors.NEGATIVE} u={clamp01((packetU - 0.82) * 5.5)} />
      </g>

      {/* the closing ladder of pages; everything else has dimmed */}
      <g opacity={clamp01(dimU * 2 - 1)}>
        <rect x={300} y={160} width={680} height={300} rx={16} fill={CARD_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <Txt x={330} y={196} text="the pages" size={14} mono color={colors.MUTED} />
        {[
          { label: '1  the newest ten turns', color: colors.ACCENT },
          { label: '2  seven turns, stopped by bytes', color: colors.WARM },
          { label: '3  twenty-two turns, widened to reach turn 38', color: colors.SECONDARY },
          { label: '4  one turn, then the start of history', color: colors.POSITIVE },
        ].map((rung, i) => (
          <g key={rung.label} opacity={clamp01(dimU * 4 - 1.5 - i * 0.5)}>
            <rect x={340} y={218 + i * 56} width={600} height={42} rx={10} fill={PANEL_FILL} stroke={rung.color} strokeWidth={1.6} />
            <Txt x={362} y={246 + i * 56} text={rung.label} size={17} weight={700} color={rung.color} />
          </g>
        ))}
      </g>
    </Camera>
  );
}

export const vizScene = () => scene;
