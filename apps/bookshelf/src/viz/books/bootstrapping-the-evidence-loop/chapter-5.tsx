// Every Epic Widens the Net
//
// Backed by: slack-clone/AGENTS.md (ticket evidence is narrow; an epic capstone
// combines a fresh exploration, a full regression pass, terminal Replay
// recording ids, and reproducible Durable Stream digests), loop-qa
// netlify/functions/mcp.ts (the public MCP surface has no run-all tool), and
// netlify/functions/lib/tasks.ts queueJourneyTasksForProject (queues only
// eligible never-run, repaired, or infrastructure-failed journey versions —
// not every already-passing journey). The current full-QA path uses that
// eligibility sweep, so forcing an epic-wide regression requires explicit
// list -> retrigger -> wait orchestration, or a future first-class suite API.
//
// ONE persistent object: the regression matrix. Ticket-level evidence lights
// a narrow diagonal through named journeys. A fresh exploration spirals around
// the same matrix, adding two rows and refreshing journey versions. Then every
// standing row fans into the exact epic-head column. The matrix survives the
// critic gate and ends larger than it began.
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
import { MatrixGrid } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const MATRIX = { x: 342, y: 126, cell: 43, gap: 9 };
const PITCH = MATRIX.cell + MATRIX.gap;
const ROWS = [
  'sign in',
  'send message',
  'edit message',
  '@mention agent',
  'cancel run',
  'private channel',
  'reconnect',
  'audit trail',
] as const;
const COLS = ['T-01', 'T-02', 'T-03', 'T-04', 'EXPLORE', 'EPIC HEAD'] as const;

// Each tuple is [row, column]. Ticket work lights only the journey it owns.
const TICKET_CELLS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [1, 0],
  [2, 1],
  [3, 2],
  [4, 2],
  [5, 3],
];

// Exploration refreshes two known journeys and discovers two new ones.
const EXPLORE_CELLS: ReadonlyArray<readonly [number, number]> = [
  [0, 4],
  [3, 4],
  [6, 4],
  [7, 4],
];

const EMPTY_VALUES = ROWS.map(() => COLS.map(() => 0));
const ACTIVE_VALUES = ROWS.map((_, row) =>
  COLS.map((_, col) => {
    if (col === COLS.length - 1) return 1;
    if (EXPLORE_CELLS.some(([r, c]) => r === row && c === col)) return 0.72;
    if (TICKET_CELLS.some(([r, c]) => r === row && c === col)) return 0.5;
    return 0;
  }),
);

const GATE = { x: 1035, y: 334, r: 72 };
const PROOF = { x: 785, y: 205 };

const CAM_TICKET: CameraState = { x: 500, y: 330, k: 1.18 };
const CAM_EXPLORE: CameraState = { x: 530, y: 330, k: 1.08 };
const CAM_LIMIT: CameraState = { x: 690, y: 330, k: 1.06 };
const CAM_GATE: CameraState = { x: 770, y: 340, k: 1.08 };
const CAM_WIDE: CameraState = { x: 640, y: 350, k: 1.0 };

// A single path wraps the persistent catalog. It is deliberately not a
// network edge: this is exploration widening the known surface before its
// discoveries settle into journey versions.
const EXPLORATION_SPIRAL = [
  'M 286 560',
  'C 190 470 214 170 450 86',
  'C 716 -8 870 146 802 366',
  'C 744 554 486 604 312 476',
  'C 188 384 250 190 438 148',
  'C 620 108 742 224 690 378',
  'C 652 490 490 506 388 420',
].join(' ');
const SPIRAL_LENGTH = 1940;

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  matrixU: ChannelRef<number>;
  ticketU: ChannelRef<number>;
  narrowU: ChannelRef<number>;
  explorationU: ChannelRef<number>;
  refreshU: ChannelRef<number>;
  limitationU: ChannelRef<number>;
  enumerateU: ChannelRef<number>;
  fanoutU: ChannelRef<number>;
  headU: ChannelRef<number>;
  terminalU: ChannelRef<number>;
  recordingsU: ChannelRef<number>;
  digestsU: ChannelRef<number>;
  criticU: ChannelRef<number>;
  gateOpenU: ChannelRef<number>;
  growU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const matrixU = tl.channel('matrixU', 0);
  const ticketU = tl.channel('ticketU', 0);
  const narrowU = tl.channel('narrowU', 0);
  const explorationU = tl.channel('explorationU', 0);
  const refreshU = tl.channel('refreshU', 0);
  const limitationU = tl.channel('limitationU', 0);
  const enumerateU = tl.channel('enumerateU', 0);
  const fanoutU = tl.channel('fanoutU', 0);
  const headU = tl.channel('headU', 0);
  const terminalU = tl.channel('terminalU', 0);
  const recordingsU = tl.channel('recordingsU', 0);
  const digestsU = tl.channel('digestsU', 0);
  const criticU = tl.channel('criticU', 0);
  const gateOpenU = tl.channel('gateOpenU', 0);
  const growU = tl.channel('growU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · ticket evidence is deliberately narrow —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'A ticket should prove what it changed. One narrow journey, one exact head, one recording the critic can interrogate.',
  });
  tl.tween(cam, CAM_TICKET, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(matrixU, 1, { at: 1.0, dur: 1.6, ease: ease.draw });
  tl.tween(ticketU, 1, { at: 2.4, dur: 0.7, ease: ease.pop });
  tl.tween(narrowU, 1, { at: 3.2, dur: 0.7, ease: ease.enter });
  tl.hold(7.0, 0.6);

  // — Beat 2 · the catalog accumulates across tickets —
  tl.caption({
    at: 7.6,
    dur: 7,
    text: 'The next ticket proves a different promise. Sign in, send, edit, mention, cancel, keep a private channel private. The catalog grows one earned path at a time.',
  });
  tl.tween(ticketU, TICKET_CELLS.length, { at: 8.1, dur: 5.2, ease: ease.linear });
  tl.tween(narrowU, 0, { at: 9.0, dur: 0.8, ease: ease.move });
  tl.hold(14.6, 0.6);

  // — Beat 3 · an epic is wider than its tickets —
  tl.caption({
    at: 15.2,
    dur: 6.5,
    text: 'An epic has a different duty. The pieces may pass alone and still fail when they meet, so the capstone must widen the net.',
  });
  tl.tween(cam, CAM_EXPLORE, { at: 15.4, dur: 1.4, ease: ease.move });
  tl.hold(21.7, 0.6);

  // — Beat 4 · fresh exploration widens and refreshes the catalog —
  tl.caption({
    at: 22.3,
    dur: 8,
    text: 'First, run a fresh exploration against the exact epic head. It reaches beyond the known map, discovers reconnect and audit flows, and refreshes the journeys whose behavior changed.',
  });
  tl.tween(explorationU, 1, { at: 22.6, dur: 5.2, ease: ease.draw });
  tl.tween(refreshU, 1, { at: 26.7, dur: 1.1, ease: ease.pop });
  tl.hold(30.3, 0.6);

  // — Beat 5 · name the missing run-all shortcut honestly —
  tl.caption({
    at: 30.9,
    dur: 8,
    text: 'Then comes the important missing shortcut. Replay QA has no public Model Context Protocol run-all tool today, and the current full-QA path does not force every passing journey to run again.',
  });
  tl.tween(cam, CAM_LIMIT, { at: 31.1, dur: 1.4, ease: ease.move });
  tl.tween(limitationU, 1, { at: 32.0, dur: 1.0, ease: ease.enter });
  tl.hold(38.9, 0.6);

  // — Beat 6 · the ordinary queue is eligibility, not full regression —
  tl.caption({
    at: 39.5,
    dur: 7.5,
    text: 'The ordinary queue schedules eligible work: a journey never run, repaired after a bug, or recovering from infrastructure failure. Green journeys are intentionally skipped.',
  });
  tl.hold(47.0, 0.6);

  // — Beat 7 · explicit enumeration makes the epic suite —
  tl.caption({
    at: 47.6,
    dur: 7.5,
    text: 'So the epic driver is explicit: list every standing journey, retrigger every one, pin them to the epic head, and wait. A future suite endpoint could make that one operation.',
  });
  tl.tween(limitationU, 0.18, { at: 47.8, dur: 0.9, ease: ease.move });
  tl.tween(enumerateU, 1, { at: 48.4, dur: 1.2, ease: ease.draw });
  tl.tween(headU, 1, { at: 49.2, dur: 0.7, ease: ease.pop });
  tl.tween(fanoutU, 1, { at: 50.0, dur: 4.2, ease: ease.linear });
  tl.hold(55.1, 0.6);

  // — Beat 8 · completion means more than green cells —
  tl.caption({
    at: 55.7,
    dur: 8,
    text: 'Every run must reach a terminal state and attach its recording identifier. On the stream side, every final digest must rebuild from the cited offsets at that same head.',
  });
  tl.tween(cam, CAM_GATE, { at: 55.9, dur: 1.4, ease: ease.move });
  tl.tween(terminalU, 1, { at: 57.0, dur: 1.2, ease: ease.enter });
  tl.tween(recordingsU, 1, { at: 59.1, dur: 1.2, ease: ease.enter });
  tl.tween(digestsU, 1, { at: 61.2, dur: 1.2, ease: ease.enter });
  tl.hold(63.7, 0.6);

  // — Beat 9 · only the critic opens the gate —
  tl.caption({
    at: 64.3,
    dur: 7.5,
    text: 'Only then does the critic take the gate: recordings for the browser claims, stream digests for the event-sourced state, and independent attacks across the composed epic.',
  });
  tl.tween(criticU, 1, { at: 64.7, dur: 1.2, ease: ease.enter });
  tl.tween(gateOpenU, 1, { at: 68.6, dur: 0.7, ease: ease.pop });
  tl.hold(71.8, 0.6);

  // — Beat 10 · verified means the next loop starts with more memory —
  tl.caption({
    at: 72.4,
    dur: 7,
    text: 'A refutation returns with a recording point, an event offset, and a failing journey. Verification leaves the next epic a larger catalog than this one inherited.',
  });
  tl.tween(cam, CAM_WIDE, { at: 72.6, dur: 1.5, ease: ease.move });
  tl.tween(growU, 1, { at: 73.7, dur: 1.4, ease: ease.pop });
  tl.hold(79.4, 0.6);

  // — Beat 11 · close —
  tl.caption({
    at: 80.0,
    dur: 6.5,
    text: 'Initialize once. Explore to discover. Regress to remember. Criticize to trust.',
  });
  tl.tween(endDim, 1, { at: 80.3, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 81.2, dur: 0.9, ease: ease.enter });
  tl.hold(86.5, 1.2);

  return {
    tl,
    cam,
    matrixU,
    ticketU,
    narrowU,
    explorationU,
    refreshU,
    limitationU,
    enumerateU,
    fanoutU,
    headU,
    terminalU,
    recordingsU,
    digestsU,
    criticU,
    gateOpenU,
    growU,
    endDim,
    endU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */
function tupleIndex(
  cells: ReadonlyArray<readonly [number, number]>,
  row: number,
  col: number,
): number {
  return cells.findIndex(([r, c]) => r === row && c === col);
}

function latestSourceColumn(row: number): number {
  const explored = EXPLORE_CELLS.find(([r]) => r === row);
  if (explored) return explored[1];
  return TICKET_CELLS.find(([r]) => r === row)?.[1] ?? 0;
}

function cellCenter(row: number, col: number): { x: number; y: number } {
  return {
    x: MATRIX.x + col * PITCH + MATRIX.cell / 2,
    y: MATRIX.y + row * PITCH + MATRIX.cell / 2,
  };
}

function EvidenceRequirement({
  y,
  label,
  detail,
  u,
}: {
  y: number;
  label: string;
  detail: string;
  u: number;
}) {
  if (u <= 0) return null;
  const pop = clamp01(u);
  return (
    <g opacity={pop} transform={`translate(${(1 - pop) * 16} 0)`}>
      <circle cx={PROOF.x} cy={y} r={9} fill={colors.POSITIVE} opacity={0.2 + 0.8 * pop} />
      <path
        d={`M ${PROOF.x - 4} ${y} l 3 3 l 6 -7`}
        fill="none"
        stroke={colors.POSITIVE}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x={PROOF.x + 18} y={y - 2} fill={colors.TEXT} fontSize={13} fontWeight={700}>
        {label}
      </text>
      <text x={PROOF.x + 18} y={y + 15} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        {detail}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const matrixU = s.get(scene.matrixU);
  const ticketU = s.get(scene.ticketU);
  const narrowU = s.get(scene.narrowU);
  const explorationU = s.get(scene.explorationU);
  const refreshU = s.get(scene.refreshU);
  const limitationU = s.get(scene.limitationU);
  const enumerateU = s.get(scene.enumerateU);
  const fanoutU = s.get(scene.fanoutU);
  const headU = s.get(scene.headU);
  const terminalU = s.get(scene.terminalU);
  const recordingsU = s.get(scene.recordingsU);
  const digestsU = s.get(scene.digestsU);
  const criticU = s.get(scene.criticU);
  const gateOpenU = s.get(scene.gateOpenU);
  const growU = s.get(scene.growU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const proofComplete = Math.min(terminalU, recordingsU, digestsU);
  const matrixScale = 1 + 0.035 * growU;
  const matrixCenterX = MATRIX.x + ((COLS.length - 1) * PITCH + MATRIX.cell) / 2;
  const matrixCenterY = MATRIX.y + ((ROWS.length - 1) * PITCH + MATRIX.cell) / 2;
  const worldOpacity = 1 - 0.86 * endDim;

  const scaffoldU = (row: number, col: number) => {
    let u = clamp01(matrixU * 2.2 - row * 0.08 - col * 0.05);
    if (row >= 6) u = Math.min(u, clamp01(explorationU * 2.2 - (row - 6) * 0.35));
    if (col === 4) u = Math.min(u, clamp01(explorationU * 1.8));
    if (col === 5) u = Math.min(u, clamp01(enumerateU * 1.8));
    return u;
  };

  const activeU = (row: number, col: number) => {
    if (col === 5) return clamp01(fanoutU * 1.45 - row * 0.065);
    const ticketIndex = tupleIndex(TICKET_CELLS, row, col);
    if (ticketIndex >= 0) return clamp01(ticketU - ticketIndex);
    const explorationIndex = tupleIndex(EXPLORE_CELLS, row, col);
    if (explorationIndex >= 0) return clamp01(explorationU * 4.2 - explorationIndex * 0.72 - 0.7);
    return 0;
  };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOpacity}>
          {/* The matrix persists through every beat and expands after the gate. */}
          <g
            transform={`translate(${matrixCenterX} ${matrixCenterY}) scale(${matrixScale}) translate(${-matrixCenterX} ${-matrixCenterY})`}
          >
            <text x={MATRIX.x - 168} y={88} fill={colors.TEXT} fontSize={22} fontWeight={750} opacity={matrixU}>
              regression catalog
            </text>
            <text x={MATRIX.x - 168} y={108} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO} opacity={matrixU}>
              named journey × exact code head
            </text>

            <MatrixGrid
              x={MATRIX.x}
              y={MATRIX.y}
              values={EMPTY_VALUES}
              cell={MATRIX.cell}
              gap={MATRIX.gap}
              rowLabels={[...ROWS]}
              colLabels={[...COLS]}
              labelSize={11.5}
              cellU={scaffoldU}
              fill={() => '#151c2d'}
              opacity={0.85}
            />

            <MatrixGrid
              x={MATRIX.x}
              y={MATRIX.y}
              values={ACTIVE_VALUES}
              cell={MATRIX.cell}
              gap={MATRIX.gap}
              cellU={activeU}
              fill={(_, row, col) => {
                if (col === 5) return proofComplete > 0.95 ? colors.POSITIVE : colors.WARM;
                if (col === 4) return colors.SECONDARY;
                return colors.ACCENT;
              }}
            />

            {/* The first ticket gets a deliberately narrow spotlight. */}
            {narrowU > 0 && (() => {
              const p = cellCenter(0, 0);
              return (
                <g opacity={narrowU}>
                  <circle cx={p.x} cy={p.y} r={30 + 5 * narrowU} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
                  <path d={`M ${p.x + 28} ${p.y - 18} Q ${p.x + 78} ${p.y - 62} ${p.x + 128} ${p.y - 46}`} fill="none" stroke={colors.WARM} strokeWidth={1.7} />
                  <text x={p.x + 134} y={p.y - 49} fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                    ticket claim
                  </text>
                </g>
              );
            })()}

            {/* Exploration wraps the catalog, then settles into version cells. */}
            {explorationU > 0 && (
              <g opacity={0.16 + 0.84 * explorationU}>
                <path
                  d={EXPLORATION_SPIRAL}
                  fill="none"
                  stroke={colors.SECONDARY}
                  strokeWidth={2.3}
                  strokeLinecap="round"
                  strokeDasharray={SPIRAL_LENGTH}
                  strokeDashoffset={SPIRAL_LENGTH * (1 - explorationU)}
                />
                <text x={232} y={578} fill={colors.SECONDARY} fontSize={11.5} fontFamily={MONO}>
                  fresh exploration · same epic head
                </text>
              </g>
            )}

            {/* Version chips show that exploration updates definitions, not just executions. */}
            {EXPLORE_CELLS.map(([row, col], index) => {
              const p = cellCenter(row, col);
              const u = clamp01(refreshU * 2.5 - index * 0.32);
              if (u <= 0) return null;
              const version = row < 6 ? 'v2' : 'v1';
              return (
                <g key={`version-${row}`} opacity={u} transform={`translate(${p.x + 15} ${p.y - 17}) scale(${0.75 + 0.25 * u})`}>
                  <circle r={10} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.5} />
                  <text y={3.3} textAnchor="middle" fill={colors.SECONDARY} fontSize={8.5} fontWeight={750} fontFamily={MONO}>
                    {version}
                  </text>
                </g>
              );
            })}

            {/* Explicit enumeration sends every standing row to one exact head. */}
            {enumerateU > 0 && ROWS.map((_, row) => {
              const source = cellCenter(row, latestSourceColumn(row));
              const target = cellCenter(row, 5);
              const u = clamp01(fanoutU * 1.45 - row * 0.065);
              const x = source.x + (target.x - source.x) * u;
              return (
                <g key={`fanout-${row}`} opacity={enumerateU}>
                  <line
                    x1={source.x + MATRIX.cell / 2}
                    y1={source.y}
                    x2={target.x - MATRIX.cell / 2}
                    y2={target.y}
                    stroke={colors.WARM}
                    strokeWidth={1.4}
                    strokeDasharray="4 5"
                    opacity={0.22 + 0.45 * u}
                  />
                  {u > 0 && u < 0.98 && <circle cx={x} cy={source.y} r={4.4} fill={colors.WARM} />}
                </g>
              );
            })}

            {/* Terminal proof marks appear only when all three evidence rails agree. */}
            {ROWS.map((_, row) => {
              const p = cellCenter(row, 5);
              const u = clamp01(proofComplete * 1.7 - row * 0.07);
              if (u <= 0) return null;
              return (
                <text key={`proof-${row}`} x={p.x} y={p.y + 5} textAnchor="middle" fill="#06140f" fontSize={18} fontWeight={900} opacity={u}>
                  ✓
                </text>
              );
            })}

            {headU > 0 && (
              <g opacity={headU}>
                <path
                  d={`M ${cellCenter(0, 5).x - 26} 91 h 52`}
                  stroke={colors.WARM}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <text x={cellCenter(0, 5).x} y={72} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>
                  exact epic head
                </text>
              </g>
            )}
          </g>

          {/* The missing shortcut stays beside the catalog, never over it. */}
          {limitationU > 0 && (
            <g opacity={limitationU} transform={`translate(${(1 - limitationU) * 18} 0)`}>
              <path d="M 752 112 h 438" stroke={colors.NEGATIVE} strokeWidth={1.3} opacity={0.45} />
              <text x={770} y={141} fill={colors.NEGATIVE} fontSize={12} fontWeight={750}>
                no public MCP run-all today
              </text>
              <text x={770} y={164} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                full-qa → eligible work, not forced reruns
              </text>
              <text x={770} y={184} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                queue → never-run · repaired · infra-failed
              </text>
              {enumerateU > 0 && (
                <text x={770} y={211} fill={colors.WARM} fontSize={10.5} fontWeight={700} fontFamily={MONO} opacity={enumerateU}>
                  list → retrigger each → await terminal
                </text>
              )}
            </g>
          )}

          {/* Three independent requirements feed the critic gate. */}
          <EvidenceRequirement y={PROOF.y + 66} label="terminal runs" detail="8 / 8 terminal" u={terminalU} />
          <EvidenceRequirement y={PROOF.y + 118} label="recording ids" detail="8 / 8 attached" u={recordingsU} />
          <EvidenceRequirement y={PROOF.y + 170} label="stream digests" detail="8 / 8 rebuilt" u={digestsU} />

          {/* Circular critic gate: closed while evidence is partial, open only after all rails. */}
          {criticU > 0 && (
            <g opacity={criticU}>
              <circle
                cx={GATE.x}
                cy={GATE.y}
                r={GATE.r}
                fill={colors.PANEL}
                stroke={gateOpenU > 0.5 ? colors.POSITIVE : colors.NEGATIVE}
                strokeWidth={3}
              />
              <circle cx={GATE.x} cy={GATE.y - 14} r={10} fill="none" stroke={colors.TEXT} strokeWidth={2} />
              <path
                d={`M ${GATE.x - 18} ${GATE.y + 16} q 18 -22 36 0`}
                fill="none"
                stroke={colors.TEXT}
                strokeWidth={2}
              />
              <text x={GATE.x} y={GATE.y + 47} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={750}>
                critic gate
              </text>
              <text x={GATE.x} y={GATE.y + 65} textAnchor="middle" fill={gateOpenU > 0.5 ? colors.POSITIVE : colors.NEGATIVE} fontSize={10.5} fontFamily={MONO}>
                {gateOpenU > 0.5 ? 'verified · catalog promoted' : 'attacking composed epic'}
              </text>
              {gateOpenU > 0 && (
                <g opacity={gateOpenU}>
                  <circle cx={GATE.x + 51} cy={GATE.y - 50} r={17} fill={colors.POSITIVE} />
                  <path d={`M ${GATE.x + 43} ${GATE.y - 50} l 6 6 l 11 -13`} fill="none" stroke="#06140f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
            </g>
          )}

          {/* The payoff names the compounding memory without replacing the matrix. */}
          {growU > 0 && (
            <g opacity={growU}>
              <text x={640} y={598} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontWeight={750}>
                six inherited journeys → eight standing journeys · refreshed versions · one verified epic head
              </text>
              <text x={640} y={619} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                the next loop begins with more memory than this one inherited
              </text>
            </g>
          )}
        </g>

        {/* Clean ending: prior content is dimmed behind an opaque recap panel. */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={205} y={235} width={870} height={210} rx={24} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.2} />
            <text x={640} y={294} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              EVERY EPIC WIDENS THE NET
            </text>
            <text x={640} y={342} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={780}>
              Initialize once. Explore to discover.
            </text>
            <text x={640} y={382} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={780}>
              Regress to remember. Criticize to trust.
            </text>
            <path d="M 408 412 H 872" stroke={colors.POSITIVE} strokeWidth={2.4} strokeLinecap="round" />
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
