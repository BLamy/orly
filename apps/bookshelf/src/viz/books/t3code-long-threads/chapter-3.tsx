// Mounting only the rows you can see
// T3 Code: Long Threads · Chapter 3
//
// The machine: a column of sixty rows with real heights the list does not know yet.
// Every row starts as an estimate of ninety pixels. A row that enters the mount window
// is measured, and its card grows or shrinks to its true height, so the rows below
// slide. A jump corrects against the measured layout until the target holds still.
// Rows far from the viewport keep only a remembered height; the first and last
// messages, and any playing audio, stay mounted as pinned tabs.
//
// BEATS (captions are fixed, narration order)
//  1 every row is an estimate of ninety pixels; the screen holds a few solid cards
//  2 scrolling mounts rows; each one measures and its card takes its true height
//  3 a jump to row thirty lands on the estimate, then corrects to the measured layout
//  4 the estimate per kind of row (user, short reply, long reply) moves to its average
//  5 the first and last messages are pinned; their tabs stay at the viewport edges
//  6 a row whose audio is playing stays pinned while the viewport is far away from it
//  7 the minimap marks the user turns on screen and refreshes as the list scrolls
//  8 the content width is watched by a resize observer; streamed chunks do not read layout
//  9 the closing legend: solid is mounted, pinned is held, dotted is a remembered height
//
// SOURCES (T3 Code repo, HEAD cc59f99e; paths are repo-relative; the list library is LegendList 3.3.5)
//  apps/web/src/components/chat/MessagesTimeline.tsx:1307-1320 LegendList with keys, item types, estimatedItemSize 90
//  apps/web/src/components/chat/MessagesTimeline.tsx:1412-1420 getItemType: kind, role, and length bucket; the averages by type
//  apps/web/src/components/chat/MessagesTimeline.tsx:786-799 first and last messages, citation, fullscreen, playing audio always rendered
//  apps/web/src/components/chat/MessagesTimeline.tsx:885 comment: the list recycles row containers before React commits their positions
//  apps/web/src/components/chat/MessagesTimeline.tsx:945-950 item size changes schedule a minimap refresh
//  apps/web/src/components/chat/MessagesTimeline.tsx:976-989 lane width watched with a resize observer, not per content frame
//  apps/web/src/components/chat/useTimelinePositionRestore.ts:6-43 settleListScroll: estimates corrected until stable, 60 frames at most
//  apps/web/src/components/chat/timelineMinimapItems.ts:17-35 minimap items are user messages
//  apps/web/src/components/chat/MessagesTimeline.tsx:838-890 minimap reads visible range; per-strip inView flags; animation frame
//  packages/client-runtime/src/work-log/scrollAnchor.ts:1-33 scroll anchor: binary search over measured row positions
//  patches/@legendapp__list@3.3.5.patch:793,796 library defaults: drawDistance 250, estimatedItemSize 100 (the timeline sets 90)
import { Camera, Timeline, cameraInterp, colors, ease, mulberry32, CAMERA_HOME } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'A thread can hold hundreds of rows, but the screen shows only a few. So the timeline mounts only the rows near the viewport.',
  'The timeline uses a virtual list library. Before it has measured anything, it assumes every row is ninety pixels tall.',
  'As a row mounts, the list measures its real height, and the rows below slide to their true places.',
  'Estimates can be wrong, so a restore corrects against the real layout, frame by frame, until the position holds still.',
  'Estimates are averaged per kind of row. A user message, a short reply, and a long reply each keep their own average.',
  'A few rows are pinned on purpose. The first and last messages stay mounted, so screen readers can jump to either end.',
  'A row whose audio is playing is pinned too, so it stays mounted while its clip plays.',
  'The minimap beside the list marks which user turns are on screen, refreshed on the next frame after each scroll.',
  'The width of the content lane is watched with a resize observer, not re-read on every streamed chunk.',
  'So the list mounts the rows near the screen, plus a few pinned ones. Every other row is only a remembered height.',
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

const ROWS = 60;
const EST = 90; // the list's estimate before any row is measured
const VIEW = { x: 120, y: 112, w: 440, h: 494 };
const COLUMN = { x: 150, w: 380 };
const MOUNT_MARGIN = 160; // rows this far outside the viewport stay mounted
const PIN_LAST = ROWS - 1;
const AUDIO_ROW = 41;
const TARGET_ROW = 30;
const MEASURED_AT_JUMP = 18; // rows measured before the jump, so the estimate is wrong

// Precomputed at module scope from a fixed seed: each row's kind and its true height.
const rand = mulberry32(7);
type Kind = 'user' | 'short' | 'long';
const KIND: Kind[] = Array.from({ length: ROWS }, (_, i) => {
  if (i % 3 === 0) return 'user';
  return rand() < 0.45 ? 'short' : 'long';
});
const TRUE_H: number[] = KIND.map((k) => {
  const u = rand();
  if (k === 'user') return Math.round(44 + u * 22);
  if (k === 'short') return Math.round(70 + u * 40);
  return Math.round(120 + u * 50);
});
// Text bars per row, so each card shows lines that suit its height.
const LINE_W: number[][] = Array.from({ length: ROWS }, () => [rand(), rand(), rand(), rand(), rand()]);

function averageOf(kind: Kind): number {
  const hs = TRUE_H.filter((_, i) => KIND[i] === kind);
  return Math.round(hs.reduce((a, b) => a + b, 0) / hs.length);
}
const AVG: Record<Kind, number> = { user: averageOf('user'), short: averageOf('short'), long: averageOf('long') };

// Positions that the scene needs as constants: the jump lands on EST_TARGET (estimates
// for the unmeasured rows), and the corrected position is TRUE_TARGET.
const sumTo = (n: number) => TRUE_H.slice(0, n).reduce((a, b) => a + b, 0);
const EST_TARGET = sumTo(MEASURED_AT_JUMP) + (TARGET_ROW - MEASURED_AT_JUMP) * EST;
const TRUE_TARGET = sumTo(TARGET_ROW);
const TRUE_TOP_20 = sumTo(20);
const TRUE_TOP_35 = sumTo(35);

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/** Heights and tops for the current measured frontier. Pure: a function of `measured`. */
function layout(measured: number): { h: number[]; top: number[]; total: number } {
  const h = TRUE_H.map((t, i) => lerp(EST, t, clamp01(measured - i)));
  const top: number[] = [];
  let y = 0;
  for (let i = 0; i < ROWS; i += 1) {
    top.push(y);
    y += h[i]!;
  }
  return { h, top, total: y };
}

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

const KIND_COLOR: Record<Kind, string> = { user: colors.ACCENT, short: colors.MUTED, long: colors.SECONDARY };

/* ---------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const scrollA = tl.channel('scrollA', 0); // the viewport's scroll, in the list's own coordinates
  const settleU = tl.channel('settleU', 0); // the correction from the estimated to the measured target
  const measured = tl.channel('measured', 0); // how many rows have measured so far (a frontier)
  const estU = tl.channel('estU', 0); // the per-kind estimates move to their averages
  const pinU = tl.channel('pinU', 0); // the first and last pins appear
  const audioU = tl.channel('audioU', 0); // the audio pin appears
  const chunksU = tl.channel('chunksU', 0); // streamed chunks arrive; layout reads stay put
  const resizeU = tl.channel('resizeU', 0); // the one resize that reads layout
  const legendU = tl.channel('legendU', 0); // the closing legend
  const dimU = tl.channel('dimU', 0); // the closing dim

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  // BEAT 1 — the estimates; the viewport starts at the top
  let b = AT[0];
  tl.tween(scrollA, 0, { at: b, dur: 0.1, ease: ease.linear });

  // BEAT 2 — scrolling mounts rows; each one measures as it enters the window
  b = AT[1];
  tl.tween(scrollA, 1500, { at: b + 0.6, dur: 6.0, ease: ease.move });
  tl.tween(measured, MEASURED_AT_JUMP, { at: b + 0.6, dur: 6.0, ease: ease.linear });

  // BEAT 3 — jump to row thirty: the estimate, then the correction to the measured layout
  b = AT[2];
  tl.set(scrollA, EST_TARGET, b + 0.3);
  b = AT[3];
  tl.tween(measured, TARGET_ROW, { at: b + 0.3, dur: 2.2, ease: ease.linear });
  tl.tween(settleU, 1, { at: b + 0.6, dur: 2.2, ease: ease.move });
  tl.set(scrollA, TRUE_TARGET, b + 3.0);
  tl.set(settleU, 0, b + 3.0);

  // BEAT 4 — the estimate per kind moves to its average
  b = AT[4];
  tl.tween(estU, 1, { at: b + 0.5, dur: 2.2, ease: ease.move });

  // BEAT 5 — the first and last pins appear at the viewport edges
  b = AT[5];
  tl.tween(pinU, 1, { at: b + 0.3, dur: 0.8, ease: ease.enter });

  // BEAT 6 — the viewport moves far from the playing audio row; its pin appears
  b = AT[6];
  tl.tween(scrollA, TRUE_TOP_20, { at: b + 0.4, dur: 2.2, ease: ease.move });
  tl.tween(audioU, 1, { at: b + 2.6, dur: 0.8, ease: ease.enter });

  // BEAT 7 — the minimap follows the scroll
  b = AT[7];
  tl.tween(scrollA, TRUE_TOP_35, { at: b + 0.4, dur: 3.2, ease: ease.move });

  // BEAT 8 — streamed chunks arrive; one resize reads the layout
  b = AT[8];
  tl.tween(resizeU, 1, { at: b + 0.3, dur: 0.6, ease: ease.pop });
  tl.tween(chunksU, 1, { at: b + 1.0, dur: 4.0, ease: ease.linear });

  // BEAT 9 — the closing legend; the stage goes quiet under it
  b = AT[9];
  tl.tween(dimU, 1, { at: b + 0.1, dur: 1.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 380, k: 1.05 }, { at: b + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(legendU, 1, { at: b + 1.2, dur: 1.2, ease: ease.enter });

  return { tl, cam, scrollA, settleU, measured, estU, pinU, audioU, chunksU, resizeU, legendU, dimU };
}

const scene = buildScene();

/* ------------------------------------------------------------------ render */
export function Render({ s }: { s: SceneState }) {
  const g = (ch: ChannelRef<number>) => s.get(ch);
  const measured = g(scene.measured);
  const scrollA = g(scene.scrollA);
  const settleU = g(scene.settleU);
  const estU = g(scene.estU);
  const pinU = g(scene.pinU);
  const audioU = g(scene.audioU);
  const chunksU = g(scene.chunksU);
  const resizeU = g(scene.resizeU);
  const legendU = g(scene.legendU);
  const dimU = g(scene.dimU);
  const keep = 1 - 0.86 * clamp01(dimU);

  // The viewport's scroll: the jump's estimate settles onto the measured target.
  const scroll = scrollA + clamp01(settleU) * (TRUE_TARGET - EST_TARGET);
  const { h, top, total } = layout(measured);
  const clipId = 'ch3-viewport-clip';
  const pinnedRows = [0, PIN_LAST];
  const mountedRows = (i: number) => {
    const t = top[i]!;
    const bottom = t + h[i]!;
    const inWindow = bottom >= scroll - MOUNT_MARGIN && t <= scroll + VIEW.h + MOUNT_MARGIN;
    return inWindow || pinnedRows.includes(i) || (i === AUDIO_ROW && audioU > 0.5);
  };

  const thumbH = Math.max(24, (VIEW.h * VIEW.h) / total);
  const thumbY = VIEW.y + (scroll / total) * (VIEW.h - thumbH);
  const visibleLo = scroll;
  const visibleHi = scroll + VIEW.h;

  return (
    <Camera {...s.get(scene.cam)}>
      <defs>
        <clipPath id={clipId}>
          <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} rx={10} />
        </clipPath>
      </defs>

      {/* header */}
      <g opacity={keep}>
        <Txt x={60} y={62} text="mounting only what you can see" size={22} weight={700} />
        <Txt x={60} y={86} text="sixty rows, a viewport, and the rows that remember a height" size={14} mono color={colors.MUTED} />
      </g>

      {/* the viewport: mounted rows are solid, remembered heights are dotted */}
      <g opacity={keep}>
        <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} rx={10} fill={PANEL_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <g clipPath={`url(#${clipId})`}>
          {Array.from({ length: ROWS }, (_, i) => {
            const y = VIEW.y + top[i]! - scroll;
            const hh = h[i]!;
            if (y > VIEW.y + VIEW.h + 4 || y + hh < VIEW.y - 4) return null;
            const mounted = mountedRows(i);
            const col = KIND_COLOR[KIND[i]!];
            if (!mounted) {
              return (
                <rect
                  key={i}
                  x={COLUMN.x}
                  y={y}
                  width={COLUMN.w}
                  height={hh}
                  rx={6}
                  fill="none"
                  stroke={colors.MUTED}
                  strokeWidth={1}
                  strokeDasharray="3 4"
                  opacity={0.22}
                />
              );
            }
            const lines = Math.max(1, Math.floor((hh - 22) / 14));
            return (
              <g key={i}>
                <rect x={COLUMN.x} y={y + 2} width={COLUMN.w} height={hh - 4} rx={6} fill={CARD_FILL} stroke={col} strokeWidth={1.3} opacity={0.95} />
                <Txt x={COLUMN.x + 10} y={y + 17} text={`${KIND[i] === 'user' ? 'you' : 'agent'} · ${i + 1}`} size={11.5} mono color={col} />
                {Array.from({ length: Math.min(lines, 5) }, (_, k) => (
                  <rect
                    key={k}
                    x={COLUMN.x + 10}
                    y={y + 26 + k * 14}
                    width={(COLUMN.w - 40) * (0.35 + 0.65 * LINE_W[i]![k % 5]!)}
                    height={6}
                    rx={3}
                    fill={col}
                    opacity={0.45}
                  />
                ))}
                {(i === 0 || i === PIN_LAST) && (
                  <Txt x={COLUMN.x + COLUMN.w - 10} y={y + 17} text="pinned" size={11} mono anchor="end" color={colors.WARM} u={pinU} />
                )}
                {i === AUDIO_ROW && (
                  <Txt x={COLUMN.x + COLUMN.w - 10} y={y + 17} text="audio playing" size={11} mono anchor="end" color={colors.POSITIVE} u={audioU} />
                )}
              </g>
            );
          })}
        </g>
        {/* the pinned tabs at the viewport edges */}
        {scroll > top[0]! + 1 && (
          <g opacity={clamp01(pinU)}>
            <rect x={VIEW.x + 10} y={VIEW.y + 8} width={170} height={24} rx={7} fill={CARD_FILL} stroke={colors.WARM} strokeWidth={1.2} />
            <Txt x={VIEW.x + 20} y={VIEW.y + 24} text="first message · pinned" size={11.5} mono color={colors.WARM} />
          </g>
        )}
        {top[PIN_LAST]! > visibleHi && (
          <g opacity={clamp01(pinU)}>
            <rect x={VIEW.x + 10} y={VIEW.y + VIEW.h - 34} width={170} height={24} rx={7} fill={CARD_FILL} stroke={colors.WARM} strokeWidth={1.2} />
            <Txt x={VIEW.x + 20} y={VIEW.y + VIEW.h - 18} text="last message · pinned" size={11.5} mono color={colors.WARM} />
          </g>
        )}
        {top[AUDIO_ROW]! > visibleHi && (
          <g opacity={clamp01(audioU)}>
            <rect x={VIEW.x + 186} y={VIEW.y + VIEW.h - 34} width={210} height={24} rx={7} fill={CARD_FILL} stroke={colors.POSITIVE} strokeWidth={1.2} />
            <Txt x={VIEW.x + 196} y={VIEW.y + VIEW.h - 18} text="audio playing · pinned" size={11.5} mono color={colors.POSITIVE} />
          </g>
        )}
        {top[AUDIO_ROW]! + h[AUDIO_ROW]! < visibleLo && (
          <g opacity={clamp01(audioU)}>
            <rect x={VIEW.x + 186} y={VIEW.y + 8} width={210} height={24} rx={7} fill={CARD_FILL} stroke={colors.POSITIVE} strokeWidth={1.2} />
            <Txt x={VIEW.x + 196} y={VIEW.y + 24} text="audio playing · pinned" size={11.5} mono color={colors.POSITIVE} />
          </g>
        )}
      </g>

      {/* the scrollbar: its thumb follows the measured total height */}
      <g opacity={keep}>
        <rect x={VIEW.x + VIEW.w + 6} y={VIEW.y} width={6} height={VIEW.h} rx={3} fill={TRACK} />
        <rect x={VIEW.x + VIEW.w + 6} y={thumbY} width={6} height={thumbH} rx={3} fill={colors.MUTED} opacity={0.6} />
        <Txt x={VIEW.x + VIEW.w + 6} y={VIEW.y + VIEW.h + 18} text={`${Math.round(total)} px`} size={11} mono color={colors.MUTED} />
      </g>

      {/* the minimap: one mark per user turn, lit when it is on screen */}
      <g opacity={keep}>
        <rect x={604} y={VIEW.y} width={14} height={VIEW.h} rx={5} fill={TRACK} />
        <rect x={604} y={VIEW.y + (visibleLo / total) * VIEW.h} width={14} height={(VIEW.h * VIEW.h) / total} rx={5} fill="none" stroke={colors.ACCENT} strokeWidth={1.2} />
        {KIND.map((k, i) => {
          if (k !== 'user') return null;
          const yy = VIEW.y + (top[i]! / total) * VIEW.h;
          const on = top[i]! + h[i]! > visibleLo && top[i]! < visibleHi;
          return <rect key={i} x={607} y={yy} width={8} height={3} rx={1} fill={on ? colors.ACCENT : colors.MUTED} opacity={on ? 1 : 0.5} />;
        })}
      </g>

      {/* per-kind estimates: the bars move from ninety pixels to each kind's average */}
      <g opacity={keep}>
        <rect x={660} y={112} width={560} height={290} rx={14} fill={PANEL_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <Txt x={684} y={142} text="estimate per kind of row, in pixels" size={14} mono color={colors.MUTED} />
        {(['user', 'short', 'long'] as Kind[]).map((k, i) => {
          const y = 178 + i * 74;
          const est = EST;
          const value = lerp(est, AVG[k], clamp01(estU));
          const label = k === 'user' ? 'user message' : k === 'short' ? 'short reply' : 'long reply';
          return (
            <g key={k}>
              <Txt x={684} y={y} text={label} size={15} weight={600} color={KIND_COLOR[k]} />
              <Txt x={1196} y={y} text={`${Math.round(value)} px`} size={15} mono anchor="end" color={colors.TEXT} />
              <rect x={684} y={y + 12} width={512} height={18} rx={6} fill={TRACK} />
              <rect x={684} y={y + 12} width={(512 * value) / 200} height={18} rx={6} fill={KIND_COLOR[k]} opacity={0.85} />
              <line x1={684 + (512 * est) / 200} y1={y + 6} x2={684 + (512 * est) / 200} y2={y + 36} stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="3 3" />
              <Txt x={684 + (512 * est) / 200 + 6} y={y + 40} text="estimate 90" size={11.5} mono color={colors.WARM} u={1 - clamp01(estU) * 0.5} />
            </g>
          );
        })}
      </g>

      {/* the layout reads: streamed chunks do not read layout; one resize does */}
      <g opacity={keep}>
        <rect x={660} y={424} width={560} height={150} rx={14} fill={PANEL_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <Txt x={684} y={454} text="streamed chunks" size={14} mono color={colors.MUTED} />
        <Txt x={1196} y={454} text={`${Math.round(clamp01(chunksU) * 12)}`} size={22} mono weight={700} anchor="end" color={colors.TEXT} />
        <Txt x={684} y={500} text="layout reads, from the resize observer" size={14} mono color={colors.MUTED} />
        <Txt x={1196} y={500} text="1" size={22} mono weight={700} anchor="end" color={colors.POSITIVE} />
        <rect x={684} y={520} width={512 * clamp01(chunksU)} height={6} rx={3} fill={colors.ACCENT} opacity={0.7} />
        <rect x={684} y={520} width={512} height={6} rx={3} fill={TRACK} opacity={0.6} />
        <Txt x={684} y={552} text="a chunk does not read layout; the lane width does" size={13} mono color={colors.MUTED} />
        <rect x={VIEW.x + VIEW.w - 8} y={VIEW.y + 6} width={4} height={VIEW.h - 12} rx={2} fill={colors.POSITIVE} opacity={clamp01(resizeU * 1.5) * (1 - clamp01(resizeU - 0.6) * 2)} />
      </g>

      {/* the closing legend; everything else has dimmed */}
      <g opacity={clamp01(legendU)}>
        <rect x={300} y={206} width={680} height={252} rx={16} fill={CARD_FILL} stroke={PANEL_EDGE} strokeWidth={1.2} />
        <Txt x={330} y={242} text="the legend" size={14} mono color={colors.MUTED} />
        <rect x={340} y={262} width={28} height={22} rx={5} fill={CARD_FILL} stroke={colors.ACCENT} strokeWidth={1.4} />
        <Txt x={382} y={278} text="solid: mounted, rendered, measured" size={17} weight={600} color={colors.TEXT} />
        <rect x={340} y={300} width={28} height={22} rx={5} fill={CARD_FILL} stroke={colors.WARM} strokeWidth={1.4} />
        <Txt x={382} y={316} text="pinned: first, last, and playing audio" size={17} weight={600} color={colors.TEXT} />
        <rect x={340} y={338} width={28} height={22} rx={5} fill="none" stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="3 3" />
        <Txt x={382} y={354} text="dotted: unmounted, a remembered height" size={17} weight={600} color={colors.TEXT} />
        <Txt x={340} y={400} text="estimates stay estimates until a row mounts" size={15} mono color={colors.MUTED} />
      </g>
    </Camera>
  );
}

export const vizScene = () => scene;
