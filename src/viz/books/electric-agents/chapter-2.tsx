// One Stream, Twenty Projections
//
// Backing files: docs/agents/reference/built-in-collections.md (the 20
// runtime-managed collections, event types run/step/text_delta/tool_call/
// inbox/state:{name}, ToolCall status lifecycle started → args_complete →
// executing → completed, `key` as primary key), docs/streams/durable-state.md
// (typed change events routed by type + key), and the 0.6 blog's stack
// section (Durable Streams → StreamDB → TanStack DB, "each layer is a view
// of the one below it").
//
// Centerpiece: the projection rake. Typed events land on the tape in order;
// StreamDB rakes them into typed tables below. One tool call's FOUR events
// (same key, rising offsets) land on the SAME row, flipping its status cell
// in place. Finale: wipe every table, sweep a replay head down the tape, and
// watch the rows rebuild — the tables never held the truth.
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
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The tape and its events — real event types from entity-schema.ts.
// ---------------------------------------------------------------------------

const TAPE = { y: 200, x0: 130, x1: 1150 } as const;
const SLOT = (i: number): number => 180 + i * 72;

type Fam = 'run' | 'step' | 'text_delta' | 'tool_call' | 'inbox' | 'state';
const FAM_COLOR: Record<Fam, string> = {
  run: colors.SECONDARY,
  step: colors.SECONDARY,
  text_delta: colors.ACCENT,
  tool_call: colors.WARM,
  inbox: colors.POSITIVE,
  state: '#f472b6',
};

// tcStage: which of the four tool_call lifecycle events this tick is (0..3)
const EVENTS: { fam: Fam; label?: string; tcStage?: number }[] = [
  { fam: 'run', label: 'run' },
  { fam: 'step', label: 'step' },
  { fam: 'text_delta', label: 'text_delta' },
  { fam: 'text_delta' },
  { fam: 'tool_call', label: 'tool_call', tcStage: 0 },
  { fam: 'tool_call', tcStage: 1 },
  { fam: 'inbox', label: 'inbox' },
  { fam: 'tool_call', tcStage: 2 },
  { fam: 'state', label: 'state:notes' },
  { fam: 'tool_call', tcStage: 3 },
  { fam: 'text_delta' },
  { fam: 'run' },
];

const TC_SLOTS = [4, 5, 7, 9]; // tape indices of the four tool_call events
const TC_STATUS = ['started', 'args_complete', 'executing', 'completed'] as const;

// ---- the three projection tables ----
const T_TOOL = { x: 130, y: 400, w: 440, h: 148 } as const;
const T_MSG = { x: 610, y: 400, w: 280, h: 148 } as const;
const T_NOTE = { x: 930, y: 400, w: 220, h: 148 } as const;

// the 20 built-in collections, verbatim from the reference
const TWENTY = [
  'runs', 'steps', 'texts', 'textDeltas', 'toolCalls',
  'reasoning', 'reasoningDeltas', 'errors', 'inbox', 'wakes',
  'entityCreated', 'entityStopped', 'signals', 'childStatus', 'tags',
  'slashCommands', 'manifests', 'contextInserted', 'contextRemoved', 'replayWatermarks',
] as const;

// camera marks
const CAM_TAPE: CameraState = { x: 640, y: 240, k: 1.3 };
const CAM_TOOL: CameraState = { x: 420, y: 380, k: 1.42 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tapeU: ChannelRef<number>;
  landU: ChannelRef<number>;
  tablesU: ChannelRef<number>;
  rakeU: ChannelRef<number>;
  tcU: ChannelRef<number>;
  msgU: ChannelRef<number>;
  noteU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  stackU: ChannelRef<number>;
  uiU: ChannelRef<number>;
  wipeU: ChannelRef<number>;
  replayU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TAPE, cameraInterp);
  const tapeU = tl.channel('tapeU', 0);
  const landU = tl.channel('landU', 0);
  const tablesU = tl.channel('tablesU', 0);
  const rakeU = tl.channel('rakeU', 0);
  const tcU = tl.channel('tcU', 0);
  const msgU = tl.channel('msgU', 0);
  const noteU = tl.channel('noteU', 0);
  const gridU = tl.channel('gridU', 0);
  const stackU = tl.channel('stackU', 0);
  const uiU = tl.channel('uiU', 0);
  const wipeU = tl.channel('wipeU', 0);
  const replayU = tl.channel('replayU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · what lands on the tape —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'Chapter one made a promise: everything the agent is lives on one stream. So what actually lands there while an agent works?',
  });
  tl.tween(tapeU, 1, { at: 0.6, dur: 1.4, ease: ease.draw });

  // — Beat 2 · the run appends —
  tl.caption({
    at: 6.9,
    dur: 6.8,
    text: 'Watch one run. The runtime appends typed events as the agent operates: a run opens, a step calls the model, and text streams out, delta by delta.',
  });
  tl.tween(landU, 0.5, { at: 7.4, dur: 4.6, ease: ease.linear });

  // — Beat 3 · tools, messages, state — same tape —
  tl.caption({
    at: 14.1,
    dur: 6.8,
    text: "A tool call joins them, a message arrives in the inbox, and the entity's own custom state rides along — ordinary events on the very same tape.",
  });
  tl.tween(landU, 1, { at: 14.5, dur: 4.8, ease: ease.linear });
  tl.hold(21.1, 0.5);

  // — Beat 4 · raw logs aren't ergonomic —
  tl.caption({
    at: 21.6,
    dur: 6,
    text: "But a raw log isn't ergonomic. You don't want to scan events — you want tables. The runs. The messages. The tool calls. Typed, current, queryable.",
  });
  tl.tween(cam, CAM_WIDE, { at: 21.8, dur: 1.5, ease: ease.move });
  tl.tween(tablesU, 1, { at: 22.6, dur: 1.4, ease: ease.enter });

  // — Beat 5 · StreamDB routes by type and key —
  tl.caption({
    at: 28.0,
    dur: 6.6,
    text: 'That is Stream DB. It projects collections over the stream: every event carries a type and a key, and those two fields route it to a collection, and to a row.',
  });
  tl.tween(rakeU, 1, { at: 28.6, dur: 2.4, ease: ease.move });
  tl.hold(35.0, 0.5);

  // — Beat 6 · one tool call, event one —
  tl.caption({
    at: 35.5,
    dur: 6,
    text: 'Follow one tool call through. The model starts a web search — the first event inserts a row, with status started.',
  });
  tl.tween(cam, CAM_TOOL, { at: 35.7, dur: 1.5, ease: ease.move });
  tl.tween(tcU, 1, { at: 36.5, dur: 1.6, ease: ease.move });

  // — Beat 7 · three more events, same key —
  tl.caption({
    at: 41.9,
    dur: 7,
    text: 'Arguments finish streaming, execution begins, the result returns. Three more events with the same key — so they land on the same row, flipping its status each time.',
  });
  tl.tween(tcU, 2, { at: 42.3, dur: 1.4, ease: ease.move });
  tl.tween(tcU, 3, { at: 44.3, dur: 1.4, ease: ease.move });
  tl.tween(tcU, 4, { at: 46.3, dur: 1.6, ease: ease.move });
  tl.hold(49.4, 0.5);

  // — Beat 8 · the trick generalizes —
  tl.caption({
    at: 49.9,
    dur: 5.8,
    text: 'That is the trick everywhere: a lifecycle on the stream becomes a row that updates in place. The log stays append-only; the table stays current.',
  });

  // — Beat 9 · messages and state too —
  tl.caption({
    at: 56.2,
    dur: 6.6,
    text: 'Messages and state work identically. An inbox event becomes a message row. Your own collections, declared on the entity definition, become state rows.',
  });
  tl.tween(cam, CAM_WIDE, { at: 56.4, dur: 1.5, ease: ease.move });
  tl.tween(msgU, 1, { at: 57.0, dur: 1.4, ease: ease.move });
  tl.tween(noteU, 1, { at: 59.0, dur: 1.4, ease: ease.move });
  tl.hold(63.3, 0.5);

  // — Beat 10 · twenty for free —
  tl.caption({
    at: 63.8,
    dur: 6.2,
    text: 'Twenty built-in collections come free with every entity: runs, steps, texts, tool calls, errors, wakes, signals, child status, and more.',
  });
  tl.tween(gridU, 1, { at: 64.4, dur: 2.8, ease: ease.move });
  tl.hold(70.5, 0.5);

  // — Beat 11 · the layer stack —
  tl.caption({
    at: 71.0,
    dur: 7,
    text: 'Stack the layers: the durable stream at the base, typed collections over it, and live queries on top, feeding interfaces and agent context. Each layer is a view of the one below.',
  });
  tl.tween(gridU, 0, { at: 71.2, dur: 0.8, ease: ease.move });
  tl.tween(stackU, 1, { at: 71.8, dur: 1.8, ease: ease.move });
  tl.tween(uiU, 1, { at: 73.6, dur: 1.4, ease: ease.enter });
  tl.hold(78.5, 0.5);

  // — Beat 12 · the replay payoff —
  tl.caption({
    at: 79.0,
    dur: 8.4,
    text: 'And none of those tables hold the truth. Wipe them all, replay the stream, and every row comes back. Hold that thought — chapter four cashes it in.',
  });
  tl.tween(wipeU, 1, { at: 79.6, dur: 1.0, ease: ease.move });
  tl.tween(replayU, 1, { at: 81.2, dur: 3.6, ease: ease.linear });
  tl.tween(closeU, 1, { at: 85.4, dur: 0.8, ease: ease.enter });
  tl.hold(88.4, 1.4);

  return { tl, cam, tapeU, landU, tablesU, rakeU, tcU, msgU, noteU, gridU, stackU, uiU, wipeU, replayU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers — every panel is a pure function of the sampled channels.
// ---------------------------------------------------------------------------

function TablePanel({ box, title, u }: {
  box: { x: number; y: number; w: number; h: number };
  title: string;
  u: number;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={box.x + 14} y={box.y + 24} fill={colors.TEXT} fontSize={13} fontFamily={mono} fontWeight={700}>
        {title}
      </text>
      <line x1={box.x + 10} y1={box.y + 34} x2={box.x + box.w - 10} y2={box.y + 34} stroke={colors.GRID} strokeWidth={1} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const landU = s.get(scene.landU);
  const tablesU = s.get(scene.tablesU);
  const rakeU = s.get(scene.rakeU);
  const tcU = s.get(scene.tcU);
  const msgU = s.get(scene.msgU);
  const noteU = s.get(scene.noteU);
  const gridU = s.get(scene.gridU);
  const stackU = s.get(scene.stackU);
  const uiU = s.get(scene.uiU);
  const wipeU = s.get(scene.wipeU);
  const replayU = s.get(scene.replayU);
  const closeU = s.get(scene.closeU);

  // rows survive the wipe only once the replay head has passed their source
  const replayX = TAPE.x0 + (TAPE.x1 - TAPE.x0) * replayU;
  const alive = (slotIdx: number): number => {
    const base = 1 - wipeU;
    const rebuilt = replayU > 0 ? clamp01((replayX - SLOT(slotIdx)) / 40) : 0;
    return Math.max(base, rebuilt);
  };

  // tool-call row state, driven by tcU (0..4) and the replay
  const tcStage = Math.min(4, Math.floor(tcU + 0.2)); // 0 = no row yet
  const statusIdx = wipeU > 0.5 && replayU > 0
    ? Math.max(0, Math.min(3, TC_SLOTS.filter((sl) => replayX > SLOT(sl)).length - 1))
    : tcStage - 1;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the tape ---- */}
        <line x1={TAPE.x0} y1={TAPE.y} x2={TAPE.x0 + (TAPE.x1 - TAPE.x0) * tapeU} y2={TAPE.y} stroke={colors.GRID} strokeWidth={2} />
        <text x={TAPE.x0} y={TAPE.y - 46} fill={colors.MUTED} fontSize={12} opacity={tapeU}>
          the entity&apos;s durable stream
        </text>
        {tapeU > 0.95 && (
          <text x={TAPE.x1} y={TAPE.y + 24} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
            offsets →
          </text>
        )}

        {/* events land in order — one landU channel drives every entrance */}
        {EVENTS.map((e, i) => {
          const u = clamp01(landU * 13 - i);
          if (u <= 0) return null;
          const x = SLOT(i);
          const y = TAPE.y - 26 + 26 * u;
          return (
            <g key={i} opacity={u}>
              <rect x={x - 9} y={y - 12} width={18} height={24} rx={3} fill={FAM_COLOR[e.fam]} opacity={0.55 + 0.45 * u} />
              {e.label && (
                <text x={x} y={TAPE.y - 22} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={mono}>
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {/* rake lines: type+key routing, from event families to their tables */}
        {rakeU > 0 && (
          <g opacity={rakeU * 0.75 * (1 - stackU * 0.85)}>
            {[
              { from: SLOT(4), to: T_TOOL.x + T_TOOL.w / 2, c: FAM_COLOR.tool_call },
              { from: SLOT(6), to: T_MSG.x + T_MSG.w / 2, c: FAM_COLOR.inbox },
              { from: SLOT(8), to: T_NOTE.x + T_NOTE.w / 2, c: FAM_COLOR.state },
            ].map((r, k) => (
              <path
                key={k}
                d={`M ${r.from} ${TAPE.y + 14} C ${r.from} ${TAPE.y + 90}, ${r.to} ${T_TOOL.y - 70}, ${r.to} ${T_TOOL.y - 6}`}
                fill="none"
                stroke={r.c}
                strokeWidth={1.4}
                strokeDasharray="4 5"
                opacity={0.8}
              />
            ))}
            <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
              routed by event type + key
            </text>
          </g>
        )}

        {/* ---- projection tables ---- */}
        <TablePanel box={T_TOOL} title="toolCalls" u={tablesU} />
        <TablePanel box={T_MSG} title="inbox" u={tablesU} />
        <TablePanel box={T_NOTE} title="state: notes" u={tablesU} />

        {/* toolCalls — the one row, updated in place */}
        {tablesU > 0 && (tcStage > 0 || (wipeU > 0 && replayU > 0)) && (() => {
          const rowU = Math.max(clamp01(tcU), 0) * alive(TC_SLOTS[0]);
          if (rowU <= 0 || statusIdx < 0) return null;
          const st = TC_STATUS[Math.min(statusIdx, 3)];
          const stColor = st === 'completed' ? colors.POSITIVE : colors.WARM;
          return (
            <g opacity={rowU}>
              <rect x={T_TOOL.x + 10} y={T_TOOL.y + 46} width={T_TOOL.w - 20} height={30} rx={5} fill={colors.BG} stroke={colors.GRID} />
              <text x={T_TOOL.x + 20} y={T_TOOL.y + 66} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
                key tc_01
              </text>
              <text x={T_TOOL.x + 110} y={T_TOOL.y + 66} fill={colors.TEXT} fontSize={11} fontFamily={mono}>
                web_search
              </text>
              <rect x={T_TOOL.x + 218} y={T_TOOL.y + 50} width={124} height={21} rx={10} fill={colors.BG} stroke={stColor} strokeWidth={1.2} />
              <text x={T_TOOL.x + 280} y={T_TOOL.y + 65} textAnchor="middle" fill={stColor} fontSize={10.5} fontFamily={mono}>
                {st}
              </text>
              <text x={T_TOOL.x + T_TOOL.w - 18} y={T_TOOL.y + 66} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={mono} opacity={st === 'completed' ? 1 : 0.25}>
                {st === 'completed' ? '1.2 s' : '…'}
              </text>
              {/* column hint */}
              <text x={T_TOOL.x + 14} y={T_TOOL.y + 100} fill={colors.MUTED} fontSize={10} opacity={0.8}>
                four events · same key · one row
              </text>
            </g>
          );
        })()}

        {/* the flying tool_call events (copies drop from tape to the row) */}
        {TC_SLOTS.map((slotIdx, k) => {
          const u = clamp01(tcU - k);
          if (u <= 0 || u >= 1) return null;
          const x0 = SLOT(slotIdx);
          const y0 = TAPE.y;
          const x1 = T_TOOL.x + 280;
          const y1 = T_TOOL.y + 60;
          const x = x0 + (x1 - x0) * u;
          const y = y0 + (y1 - y0) * (u * u * (3 - 2 * u));
          return <rect key={k} x={x - 8} y={y - 10} width={16} height={20} rx={3} fill={FAM_COLOR.tool_call} opacity={0.9} />;
        })}

        {/* inbox row */}
        {(() => {
          const u = msgU * alive(6);
          if (u <= 0) return null;
          return (
            <g opacity={u}>
              <rect x={T_MSG.x + 10} y={T_MSG.y + 46} width={T_MSG.w - 20} height={30} rx={5} fill={colors.BG} stroke={colors.GRID} />
              <text x={T_MSG.x + 20} y={T_MSG.y + 66} fill={FAM_COLOR.inbox} fontSize={11} fontFamily={mono}>
                from /horton/main
              </text>
              <text x={T_MSG.x + 14} y={T_MSG.y + 100} fill={colors.MUTED} fontSize={10} opacity={0.8}>
                one inbox event → one message row
              </text>
            </g>
          );
        })()}

        {/* custom state row */}
        {(() => {
          const u = noteU * alive(8);
          if (u <= 0) return null;
          return (
            <g opacity={u}>
              <rect x={T_NOTE.x + 10} y={T_NOTE.y + 46} width={T_NOTE.w - 20} height={30} rx={5} fill={colors.BG} stroke={colors.GRID} />
              <text x={T_NOTE.x + 20} y={T_NOTE.y + 66} fill={FAM_COLOR.state} fontSize={11} fontFamily={mono}>
                notes · plan v2
              </text>
              <text x={T_NOTE.x + 14} y={T_NOTE.y + 100} fill={colors.MUTED} fontSize={10} opacity={0.8}>
                declared in state
              </text>
            </g>
          );
        })()}

        {/* ---- the twenty-collection grid ---- */}
        {gridU > 0 && (
          <g opacity={gridU}>
            <rect x={200} y={252} width={880} height={124} rx={12} fill={colors.BG} stroke={colors.GRID} opacity={0.92} />
            {TWENTY.map((name, i) => {
              const u = clamp01(gridU * 24 - i);
              const col = i % 5;
              const row = Math.floor(i / 5);
              return (
                <text
                  key={name}
                  x={250 + col * 172}
                  y={282 + row * 26}
                  fill={i === 4 || i === 8 || i === 0 ? colors.WARM : colors.MUTED}
                  fontSize={11.5}
                  fontFamily={mono}
                  opacity={u}
                >
                  {name}
                </text>
              );
            })}
          </g>
        )}

        {/* ---- the layer stack ---- */}
        {stackU > 0 && (
          <g opacity={stackU}>
            {[
              { label: 'live queries — TanStack DB', y: 268, c: colors.POSITIVE },
              { label: 'typed collections — StreamDB', y: 306, c: colors.WARM },
              { label: 'the durable stream', y: 344, c: colors.ACCENT },
            ].map((l, i) => (
              <g key={l.label} opacity={clamp01(stackU * 3 - (2 - i))}>
                <rect x={420} y={l.y} width={440} height={30} rx={6} fill={colors.PANEL} stroke={l.c} strokeWidth={1.2} />
                <text x={640} y={l.y + 20} textAnchor="middle" fill={l.c} fontSize={13}>
                  {l.label}
                </text>
              </g>
            ))}
            <text x={900} y={330} fill={colors.MUTED} fontSize={11} fontStyle="italic" opacity={clamp01(stackU * 2 - 1)}>
              each layer: a view of the one below
            </text>
          </g>
        )}

        {/* mini timeline UI fed by the top layer */}
        {uiU > 0 && (
          <g opacity={uiU * (1 - wipeU * 0.9 + (replayU > 0.96 ? 1 : 0))}>
            <rect x={905} y={252} width={200 } height={124} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={919} y={274} fill={colors.MUTED} fontSize={10.5}>
              the chat timeline — a query
            </text>
            {[0, 1, 2].map((r) => (
              <rect key={r} x={919} y={286 + r * 26} width={r === 1 ? 120 : 168} height={16} rx={8} fill={r === 1 ? colors.ACCENT : colors.GRID} opacity={r === 1 ? 0.5 : 0.6} />
            ))}
          </g>
        )}

        {/* ---- the replay head ---- */}
        {replayU > 0 && replayU < 1 && (
          <g>
            <line x1={replayX} y1={TAPE.y - 40} x2={replayX} y2={TAPE.y + 40} stroke={colors.TEAL} strokeWidth={2.5} />
            <path d={`M ${replayX - 8} ${TAPE.y - 48} L ${replayX + 8} ${TAPE.y - 48} L ${replayX} ${TAPE.y - 36} Z`} fill={colors.TEAL} />
            <text x={replayX} y={TAPE.y - 58} textAnchor="middle" fill={colors.TEAL} fontSize={11.5}>
              replay
            </text>
          </g>
        )}
      </Camera>

      {/* closing chip */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={390} y={566} width={500} height={44} rx={22} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.4} />
          <text x={640} y={594} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
            wipe the tables · replay the stream · they come back
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
