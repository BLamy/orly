// Chapter 1 — The Tape
//
// Grounding: electric.ax /docs/streams.md — "A stream is a URL-addressable,
// append-only, durable sequence of bytes"; offsets are opaque, lexicographically
// sortable tokens; reads return Stream-Next-Offset; sentinels "-1" (start) and
// "now" (tail). The wire-vs-tape framing is the docs' own pitch: "SSE drops on
// a refresh… Resuming means re-running the request and re-billing the LLM"
// (electric.ax /streams.md).
//
// Centerpiece: THE TAPE — an append-only cell strip that keeps growing while a
// reader dies and resumes at its bookmarked offset. The wire world (a snapping
// SSE connection) plays first as the disaster the tape fixes.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
/** stagger window: item i of n, entrance span in items */
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Wire world — client ← streaming wire ← model provider.
// ---------------------------------------------------------------------------
const CLIENT = { x: 220, y: 200 } as const;
const SERVER = { x: 1060, y: 200 } as const;
const WIRE_Y = 200;
const WIRE_X0 = CLIENT.x + 62;
const WIRE_X1 = SERVER.x - 62;
const CUT_X = 640; // where the wire snaps

const N_TOKENS = 12;
/** token i position along the wire for flow phase p (server → client) */
function tokenX(p: number, i: number): number {
  const u = p * (N_TOKENS + 3) - i; // staggered launch
  return WIRE_X1 - clamp01(u / 3) * (WIRE_X1 - WIRE_X0);
}

// ---------------------------------------------------------------------------
// The tape — append-only cells with opaque offset ticks.
// ---------------------------------------------------------------------------
const TAPE_Y = 430;
const CELL_W = 36;
const CELL_H = 46;
const TAPE_X0 = 148;
const N_LIVE = 27; // total cells ever appended
const KILL_IDX = 9; // reader's bookmark when it dies
const DEAD_END = 20; // cells appended while the reader is away
const cellX = (i: number): number => TAPE_X0 + i * CELL_W;

// opaque-but-sortable offset tokens (docs' 01JQXK5V00 style), one per tick
const TICKS: Array<{ i: number; label: string }> = [
  { i: 0, label: '01JQXK2A00' },
  { i: 5, label: '01JQXK4M00' },
  { i: KILL_IDX, label: '01JQXK5V00' },
  { i: 14, label: '01JQXK7C00' },
  { i: DEAD_END, label: '01JQXK9T00' },
  { i: 25, label: '01JQXKBH00' },
];

const CAM_WIRE: CameraState = { x: 640, y: 250, k: 1.12 };
const CAM_TAPE: CameraState = { x: 640, y: 400, k: 1.16 };
const CAM_CURSOR: CameraState = { x: 560, y: 430, k: 1.34 };

// ---------------------------------------------------------------------------
// Timeline — ~78s, 12 captions.
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIRE, cameraInterp);

  const wireU = tl.channel('wireU', 0); // wire world enters
  const flowU = tl.channel('flowU', 0); // tokens stream along the wire
  const cutU = tl.channel('cutU', 0); // the snap
  const fallU = tl.channel('fallU', 0); // in-flight tokens fall and die
  const retryU = tl.channel('retryU', 0); // restart-from-zero flow
  const rebillU = tl.channel('rebillU', 0); // "re-run · re-billed" chip
  const wireOutU = tl.channel('wireOutU', 0); // wire world fades to a whisper

  const tapeU = tl.channel('tapeU', 0); // tape rail + URL chip
  const growU = tl.channel('growU', 0); // cells 0..13 append
  const ticksU = tl.channel('ticksU', 0); // offset ticks label in
  const cursorIdx = tl.channel('cursorIdx', -1.2); // reader position (cells)
  const cursorOn = tl.channel('cursorOn', 0); // reader visible
  const bookU = tl.channel('bookU', 0); // Stream-Next-Offset chip
  const deadU = tl.channel('deadU', 0); // reader dead (grays out)
  const grow2U = tl.channel('grow2U', 0); // cells 14..19 append while dead
  const resumeU = tl.channel('resumeU', 0); // resume pop + catch-up glow
  const grow3U = tl.channel('grow3U', 0); // cells 20..26 append live
  const sentU = tl.channel('sentU', 0); // sentinel ghost cursors
  const mapU = tl.channel('mapU', 0); // the three-ghost payoff map
  const quietU = tl.channel('quietU', 0); // closing: dim everything but tape

  // — beat 1 · the wire —
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: "Here's the problem this whole platform starts from. A model is streaming you an answer, and your connection is a wire.",
  });
  tl.tween(wireU, 1, { at: 0.7, dur: 0.8, ease: ease.enter });
  tl.tween(flowU, 0.62, { at: 1.6, dur: 4.6, ease: ease.linear });

  // — beat 2 · the snap —
  tl.caption({
    at: 6.6,
    dur: 5.6,
    text: 'Kill the tab, drop the network, and the wire snaps. Whatever was in flight is just gone.',
  });
  tl.tween(cam, { x: 640, y: 210, k: 1.3 }, { at: 6.8, dur: 1.0, ease: ease.move });
  tl.tween(cutU, 1, { at: 7.6, dur: 0.5, ease: ease.pop });
  tl.tween(fallU, 1, { at: 7.9, dur: 1.6, ease: ease.move });

  // — beat 3 · start over, pay again —
  tl.caption({
    at: 12.6,
    dur: 6.4,
    text: 'Reconnect, and the only move is to start over: re-run the request, re-generate every token, and pay for all of it again.',
  });
  tl.tween(cutU, 0, { at: 13.0, dur: 0.6, ease: ease.enter });
  tl.tween(retryU, 1, { at: 13.6, dur: 3.6, ease: ease.linear });
  tl.tween(rebillU, 1, { at: 16.2, dur: 0.5, ease: ease.pop });

  // — beat 4 · the tape enters —
  tl.caption({
    at: 19.6,
    dur: 6.4,
    text: "Electric's answer is to stop streaming over a wire and start appending to a tape. A durable stream is an append-only tape that lives at a URL.",
  });
  tl.tween(wireOutU, 1, { at: 19.8, dur: 1.0, ease: ease.enter });
  tl.tween(rebillU, 0, { at: 19.8, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_TAPE, { at: 20.0, dur: 1.4, ease: ease.move });
  tl.tween(tapeU, 1, { at: 20.8, dur: 1.2, ease: ease.draw });
  tl.tween(growU, 0.5, { at: 22.2, dur: 3.4, ease: ease.linear });

  // — beat 5 · offsets —
  tl.caption({
    at: 26.6,
    dur: 6.0,
    text: 'Every write lands at an offset. Offsets are opaque tokens, but they always sort in order, so any position on the tape has a name.',
  });
  tl.tween(ticksU, 1, { at: 27.2, dur: 2.2, ease: ease.linear });
  tl.tween(growU, 1, { at: 27.0, dur: 4.6, ease: ease.linear });

  // — beat 6 · the reader plays the tape —
  tl.caption({
    at: 33.2,
    dur: 6.0,
    text: "Readers don't tap the wire; they play the tape. Every read returns the next offset, which is the bookmark for the read after that.",
  });
  tl.tween(cam, CAM_CURSOR, { at: 33.4, dur: 1.2, ease: ease.move });
  tl.tween(cursorOn, 1, { at: 33.8, dur: 0.5, ease: ease.enter });
  tl.tween(cursorIdx, KILL_IDX, { at: 34.4, dur: 4.0, ease: ease.linear });
  tl.tween(bookU, 1, { at: 35.2, dur: 0.6, ease: ease.enter });

  // — beat 7 · the reader dies; the tape doesn't care —
  tl.caption({
    at: 39.8,
    dur: 6.2,
    text: 'Now run the same disaster. The reader dies mid stream, and nothing upstream cares. The producer keeps appending; the tape keeps growing.',
  });
  tl.tween(deadU, 1, { at: 40.6, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_TAPE, { at: 41.0, dur: 1.2, ease: ease.move });
  tl.tween(grow2U, 1, { at: 41.6, dur: 3.8, ease: ease.linear });

  // — beat 8 · resume at the bookmark —
  tl.caption({
    at: 46.6,
    dur: 6.4,
    text: 'The reader comes back, hands over its last bookmark, and resumes exactly where it left off. Catch up at your own pace, then ride the live edge.',
  });
  tl.tween(deadU, 0, { at: 47.2, dur: 0.5, ease: ease.enter });
  tl.tween(resumeU, 1, { at: 47.2, dur: 0.6, ease: ease.pop });
  tl.tween(cursorIdx, DEAD_END, { at: 48.2, dur: 2.2, ease: ease.move });
  tl.tween(grow3U, 1, { at: 50.6, dur: 2.6, ease: ease.linear });
  tl.tween(cursorIdx, N_LIVE - 1, { at: 50.6, dur: 2.6, ease: ease.linear });

  // — beat 9 · sentinels —
  tl.caption({
    at: 53.8,
    dur: 6.2,
    text: 'Two special offsets round it out: minus one means play me everything from the start, and now means skip to the tail and only show me what lands next.',
  });
  tl.tween(sentU, 1, { at: 54.6, dur: 1.0, ease: ease.enter });

  // — beat 10 · the quiet claim —
  tl.caption({
    at: 60.6,
    dur: 4.8,
    text: "That's the whole primitive: durable, ordered, resumable, over plain web requests. It doesn't sound like much.",
  });
  tl.tween(sentU, 0, { at: 61.2, dur: 0.8, ease: ease.enter });
  tl.tween(bookU, 0, { at: 61.2, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 61.0, dur: 1.5, ease: ease.move });

  // — beat 11 · the map —
  tl.caption({
    at: 66.0,
    dur: 5.6,
    text: 'But this book is about what that one primitive can carry. A model response. A database. A shared filesystem.',
  });
  tl.tween(quietU, 1, { at: 66.0, dur: 0.8, ease: ease.enter });
  tl.tween(mapU, 1, { at: 66.4, dur: 2.4, ease: ease.linear });

  // — beat 12 · recap —
  tl.caption({
    at: 72.2,
    dur: 5.2,
    text: "Four building blocks, one tape. Let's build them.",
  });
  tl.hold(77.4, 1.2);

  return {
    tl,
    cam,
    wireU,
    flowU,
    cutU,
    fallU,
    retryU,
    rebillU,
    wireOutU,
    tapeU,
    growU,
    ticksU,
    cursorIdx,
    cursorOn,
    bookU,
    deadU,
    grow2U,
    resumeU,
    grow3U,
    sentU,
    mapU,
    quietU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** how many cells exist at this frame (append-only, three growth phases) */
function cellCount(growU: number, grow2U: number, grow3U: number): number {
  return 14 * growU + (DEAD_END - 14) * grow2U + (N_LIVE - DEAD_END) * grow3U;
}

const MAP_GHOSTS = [
  { x: 340, label: 'a response body', chip: 'ch 2 · Durable Proxy', kind: 'wave' },
  { x: 640, label: 'a database', chip: 'ch 3–4 · State & StreamDB', kind: 'grid' },
  { x: 940, label: 'a file tree', chip: 'ch 5 · StreamFS', kind: 'tree' },
] as const;

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const wireU = s.get(scene.wireU);
  const flowU = s.get(scene.flowU);
  const cutU = s.get(scene.cutU);
  const fallU = s.get(scene.fallU);
  const retryU = s.get(scene.retryU);
  const rebillU = s.get(scene.rebillU);
  const wireOutU = s.get(scene.wireOutU);
  const tapeU = s.get(scene.tapeU);
  const growU = s.get(scene.growU);
  const ticksU = s.get(scene.ticksU);
  const cursorIdx = s.get(scene.cursorIdx);
  const cursorOn = s.get(scene.cursorOn);
  const bookU = s.get(scene.bookU);
  const deadU = s.get(scene.deadU);
  const grow2U = s.get(scene.grow2U);
  const resumeU = s.get(scene.resumeU);
  const grow3U = s.get(scene.grow3U);
  const sentU = s.get(scene.sentU);
  const mapU = s.get(scene.mapU);
  const quietU = s.get(scene.quietU);

  const wireWorldOp = wireU * (1 - wireOutU * 0.94); // fades to a whisper
  const gap = cutU * 34; // snap gap around CUT_X
  const nCells = cellCount(growU, grow2U, grow3U);
  const liveEdge = cellX(nCells) - CELL_W / 2 + 16;
  const cursorX = cellX(Math.max(cursorIdx, -1.2)) + CELL_W / 2;
  const cursorOp = cursorOn * (1 - deadU * 0.75);
  const tapeOp = 1 - quietU * 0.0; // tape stays the hero in the finale

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= wire world ================= */}
        {wireWorldOp > 0.01 && (
          <g opacity={wireWorldOp}>
            <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="browser" label="client" sublabel="your tab" u={wireU} dim={fallU * 0.5 * (1 - retryU)} />
            <ServiceNode x={SERVER.x} y={SERVER.y} kind="external" label="model provider" sublabel="streaming tokens" u={wireU} />
            {/* the wire: two halves so it can snap */}
            <line x1={WIRE_X0} y1={WIRE_Y} x2={CUT_X - gap} y2={WIRE_Y + cutU * 10} stroke={colors.GRID} strokeWidth={2.5} />
            <line x1={CUT_X + gap} y1={WIRE_Y - cutU * 6} x2={WIRE_X1} y2={WIRE_Y} stroke={colors.GRID} strokeWidth={2.5} />
            {cutU > 0.05 && (
              <text x={CUT_X} y={WIRE_Y - 26} textAnchor="middle" fill={colors.NEGATIVE} fontSize={22} opacity={cutU * (1 - retryU)}>
                ⚡
              </text>
            )}
            {/* tokens in flight (first pass) */}
            {Array.from({ length: N_TOKENS }, (_, i) => {
              const x = tokenX(flowU, i);
              if (x >= WIRE_X1 - 2) return null;
              const dead = fallU > 0.01;
              const dy = dead ? fallU * fallU * 150 : 0;
              const op = dead ? Math.max(0, 1 - fallU * 1.15) : 0.95;
              if (op <= 0.01) return null;
              return <circle key={`t${i}`} cx={x} cy={WIRE_Y + dy} r={6} fill={colors.ACCENT} opacity={op} />;
            })}
            {/* retry pass — same tokens, regenerated from zero */}
            {retryU > 0.01 &&
              Array.from({ length: N_TOKENS }, (_, i) => {
                const x = tokenX(retryU * 0.62, i);
                if (x >= WIRE_X1 - 2) return null;
                return <circle key={`r${i}`} cx={x} cy={WIRE_Y} r={6} fill={colors.WARM} opacity={0.95} />;
              })}
            {/* re-billed chip */}
            <g opacity={rebillU}>
              <rect x={520} y={264} width={240} height={38} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} />
              <text x={640} y={288} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={600}>
                re-run · re-generated · re-billed
              </text>
            </g>
          </g>
        )}

        {/* ================= the tape ================= */}
        {tapeU > 0.01 && (
          <g opacity={tapeOp}>
            {/* URL chip */}
            <g opacity={tapeU * (1 - quietU * 0.5)}>
              <rect x={470} y={332} width={340} height={32} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={640} y={353} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
                POST /v1/stream/hello
              </text>
            </g>
            {/* rail */}
            <line
              x1={TAPE_X0 - 14}
              y1={TAPE_Y + CELL_H / 2 + 8}
              x2={TAPE_X0 + (cellX(N_LIVE) - TAPE_X0) * tapeU + 10}
              y2={TAPE_Y + CELL_H / 2 + 8}
              stroke={colors.GRID}
              strokeWidth={2}
            />
            {/* cells */}
            {Array.from({ length: N_LIVE }, (_, i) => {
              const u = clamp01(nCells - i);
              if (u <= 0.01) return null;
              const fresh = clamp01(1 - (nCells - i - 1) / 2); // newest glows
              const caught = resumeU > 0 && i > KILL_IDX && i <= cursorIdx ? 1 : 0;
              return (
                <rect
                  key={i}
                  x={cellX(i)}
                  y={TAPE_Y - CELL_H / 2 + (1 - u) * -18}
                  width={CELL_W - 5}
                  height={CELL_H}
                  rx={6}
                  fill={colors.PANEL}
                  stroke={caught ? colors.POSITIVE : fresh > 0.4 ? colors.ACCENT : colors.GRID}
                  strokeWidth={fresh > 0.4 ? 2 : 1.2}
                  opacity={0.35 + 0.65 * u}
                />
              );
            })}
            {/* write head at the growing edge */}
            <g opacity={tapeU}>
              <path
                d={`M${liveEdge} ${TAPE_Y - CELL_H / 2 - 20} l -8 -12 l 16 0 z`}
                fill={colors.ACCENT}
              />
              <text x={liveEdge} y={TAPE_Y - CELL_H / 2 - 38} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontFamily={MONO}>
                append
              </text>
            </g>
            {/* offset ticks */}
            {TICKS.map(({ i, label }, k) => {
              const u = win(ticksU, TICKS.length, k, 2) * clamp01(nCells - i);
              if (u <= 0.01) return null;
              const x = cellX(i) + (CELL_W - 5) / 2;
              return (
                <g key={label} opacity={u * (1 - quietU * 0.55)}>
                  <line x1={x} y1={TAPE_Y + CELL_H / 2 + 8} x2={x} y2={TAPE_Y + CELL_H / 2 + 16} stroke={colors.MUTED} strokeWidth={1.5} />
                  <text x={x} y={TAPE_Y + CELL_H / 2 + 32} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                    {label}
                  </text>
                </g>
              );
            })}
            {/* reader cursor */}
            {cursorOp > 0.01 && (
              <g opacity={cursorOp * (1 - quietU * 0.85)}>
                {resumeU > 0.01 && resumeU < 1 && (
                  <circle cx={cursorX} cy={TAPE_Y + CELL_H / 2 + 52} r={16 + 14 * (1 - resumeU)} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={1 - resumeU} />
                )}
                <path
                  d={`M${cursorX} ${TAPE_Y + CELL_H / 2 + 44} l -9 14 l 18 0 z`}
                  fill={deadU > 0.3 ? colors.MUTED : colors.POSITIVE}
                />
                <text
                  x={cursorX}
                  y={TAPE_Y + CELL_H / 2 + 76}
                  textAnchor="middle"
                  fill={deadU > 0.3 ? colors.MUTED : colors.POSITIVE}
                  fontSize={12.5}
                  fontWeight={600}
                >
                  {deadU > 0.3 ? 'reader (gone)' : 'reader'}
                </text>
              </g>
            )}
            {/* Stream-Next-Offset bookmark chip rides with the cursor */}
            {bookU > 0.01 && (
              <g opacity={bookU * cursorOp * (1 - quietU * 0.85)}>
                <rect x={Math.min(cursorX, 950) - 118} y={TAPE_Y - CELL_H / 2 - 74} width={236} height={30} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
                <text x={Math.min(cursorX, 950)} y={TAPE_Y - CELL_H / 2 - 54} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                  Stream-Next-Offset: 01JQXK5V00
                </text>
              </g>
            )}
            {/* sentinels */}
            {sentU > 0.01 && (
              <g opacity={sentU}>
                {[
                  { x: cellX(0) + CELL_W / 2, label: 'offset=-1', sub: 'from the start' },
                  { x: liveEdge, label: 'offset=now', sub: 'tail only' },
                ].map((g0) => (
                  <g key={g0.label}>
                    <path d={`M${g0.x} ${TAPE_Y - CELL_H / 2 - 16} l -8 -13 l 16 0 z`} fill="none" stroke={colors.SECONDARY} strokeWidth={2} />
                    <text x={g0.x} y={TAPE_Y - CELL_H / 2 - 40} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily={MONO}>
                      {g0.label}
                    </text>
                    <text x={g0.x} y={TAPE_Y - CELL_H / 2 - 58} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontStyle="italic">
                      {g0.sub}
                    </text>
                  </g>
                ))}
              </g>
            )}
          </g>
        )}

        {/* ================= the payoff map ================= */}
        {mapU > 0.01 && (
          <g>
            {MAP_GHOSTS.map((gh, k) => {
              const u = win(mapU, 3, k, 1.4);
              if (u <= 0.01) return null;
              const y = 170;
              return (
                <g key={gh.label} opacity={u}>
                  <rect x={gh.x - 108} y={y - 66} width={216} height={132} rx={14} fill={colors.PANEL} stroke={colors.GRID} opacity={0.9} />
                  {gh.kind === 'wave' && (
                    <g stroke={colors.ACCENT} strokeWidth={2.5} fill="none" opacity={0.85}>
                      <path d={`M${gh.x - 76} ${y - 26} q 20 -12 40 0 t 40 0 t 40 0 t 32 0`} />
                      <path d={`M${gh.x - 76} ${y - 4} q 20 -12 40 0 t 40 0 t 40 0`} />
                      <path d={`M${gh.x - 76} ${y + 18} q 20 -12 40 0 t 40 0`} />
                    </g>
                  )}
                  {gh.kind === 'grid' && (
                    <g fill={colors.SECONDARY} opacity={0.85}>
                      {[0, 1, 2].map((c) =>
                        [0, 1].map((r) => (
                          <rect key={`${c}${r}`} x={gh.x - 62 + c * 44} y={y - 32 + r * 30} width={36} height={22} rx={4} />
                        ))
                      )}
                    </g>
                  )}
                  {gh.kind === 'tree' && (
                    <g stroke={colors.POSITIVE} strokeWidth={2} fill={colors.POSITIVE} opacity={0.85}>
                      <circle cx={gh.x} cy={y - 34} r={7} />
                      <circle cx={gh.x - 44} cy={y + 8} r={7} />
                      <circle cx={gh.x + 44} cy={y + 8} r={7} />
                      <line x1={gh.x - 4} y1={y - 28} x2={gh.x - 40} y2={y + 2} />
                      <line x1={gh.x + 4} y1={y - 28} x2={gh.x + 40} y2={y + 2} />
                    </g>
                  )}
                  <text x={gh.x} y={y + 46} textAnchor="middle" fill={colors.TEXT} fontSize={14.5} fontWeight={600}>
                    {gh.label}
                  </text>
                  <text x={gh.x} y={y - 78} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    {gh.chip}
                  </text>
                  {/* each ghost is fed by the tape */}
                  <line x1={gh.x} y1={y + 66} x2={gh.x} y2={TAPE_Y - CELL_H / 2 - 14} stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="2 6" />
                </g>
              );
            })}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
