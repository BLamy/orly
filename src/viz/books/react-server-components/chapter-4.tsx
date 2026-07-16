// Chapter 4 — Chunks that wake up: reassembly in the browser
//
// Grounding: packages/react-client/src/ReactFlightClient.js —
// chunk status constants (lines ~150): PENDING, BLOCKED, RESOLVED_MODEL,
// RESOLVED_MODULE, INITIALIZED = 'fulfilled', ERRORED = 'rejected';
// ReactPromise subclasses Promise.prototype ("we get other methods like
// .catch"); resolveModel stores raw row text (createResolvedModelChunk) and
// initializeModelChunk parses lazily on first read (readChunk is the _init of
// a REACT_LAZY_TYPE wrapper — createLazyChunkWrapper); resolveModule →
// preloadModule ("we preload all modules as early as possible since it's
// likely that we'll need them") → requireModule(chunk.value) at first read;
// processFullStringRow dispatches 'I'→resolveModule, 'T'→resolveText,
// 'E'→resolveErrorModel. Errors cross as {digest} in prod.
//
// Centerpiece: THE CHUNK TABLE — one cell per row id, each a promise-like
// state machine flipping pending → resolved → fulfilled in sync with the
// arriving tape, while the page assembles from the cells.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const TAPE = { x: 44, y: 128, w: 296, h: 332 } as const;
const tapeRowY = (i: number): number => TAPE.y + 40 + i * 41;
const CELL = { x0: 396, y: 142, w: 100, h: 82, dx: 116 } as const;
const cellX = (i: number): number => CELL.x0 + i * CELL.dx;
const BROWSER = { x: 452, y: 306, w: 480, h: 296 } as const;
const DL = { x: 1006, y: 306, w: 218 } as const;

const TAPE_ROWS = [
  { id: '2', txt: '2:I["./src/Counter.js",…]' },
  { id: '0', txt: '0:["$","div",null,{…}]' },
  { id: '1', txt: '1:["$","section",null,{…}]' },
  { id: '3', txt: '3:T11,Hello from server' },
  { id: '4', txt: '4:{"user":"seb"}' },
  { id: '5', txt: '5:42' },
  { id: '6', txt: '6:E{"digest":"1f8a"}' },
] as const;

const LEGEND = [
  { t: 'pending', c: colors.MUTED },
  { t: 'resolved_model', c: colors.ACCENT },
  { t: 'resolved_module', c: colors.SECONDARY },
  { t: "'fulfilled'", c: colors.POSITIVE },
  { t: "'rejected'", c: colors.NEGATIVE },
] as const;

// camera marks
const CAM_OPEN: CameraState = { x: 600, y: 340, k: 1.06 };
const CAM_TABLE: CameraState = { x: 720, y: 240, k: 1.22 };
const CAM_BROWSER: CameraState = { x: 692, y: 400, k: 1.24 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~99s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);

  const tapeU = tl.channel('tapeU', 0); // tape panel + browser frame
  const tableU = tl.channel('tableU', 0); // chunk table + legend
  const rowsAU = tl.channel('rowsAU', 0); // rows 2 and 0 land
  const readU = tl.channel('readU', 0); // root read: page stands up with holes
  const rowsBU = tl.channel('rowsBU', 0); // rows 1, 3, 4 land
  const dlU = tl.channel('dlU', 0); // chunk download bar
  const reqU = tl.channel('reqU', 0); // requireModule: Counter mounts
  const p5U = tl.channel('p5U', 0); // late promise row 5
  const errU = tl.channel('errU', 0); // E row → rejected cell
  const linkU = tl.channel('linkU', 0); // recap threads
  const closeU = tl.channel('closeU', 0); // closing line

  // — beat 1 · the stream arrives mid-flight —
  tl.caption({
    at: 0.5,
    dur: 7.4,
    text: 'The tape from chapter two now pours into the browser — and the browser does not wait for the end. The moment the first bytes arrive, React starts building.',
  });
  tl.tween(tapeU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.hold(7.9, 0.5);

  // — beat 2 · a table of promises —
  tl.caption({
    at: 8.4,
    dur: 8.2,
    text: 'For every address on the tape, the client keeps a cell. React calls them chunks, and each one is a real promise with a few extra states. The whole page is a table of promises being kept.',
  });
  tl.tween(cam, CAM_TABLE, { at: 8.6, dur: 1.3, ease: ease.move });
  tl.tween(tableU, 1, { at: 9.0, dur: 2.0, ease: ease.enter });
  tl.hold(16.6, 0.5);

  // — beat 3 · rows land as raw text —
  tl.caption({
    at: 17.1,
    dur: 8.2,
    text: 'When a row lands, its cell stores the raw text — a state called resolved model. Nothing is parsed yet. A cell only does the work of becoming a value when somebody reads it.',
  });
  tl.tween(rowsAU, 1, { at: 17.5, dur: 2.6, ease: ease.linear });
  tl.hold(25.3, 0.5);

  // — beat 4 · the page stands up, with holes —
  tl.caption({
    at: 25.8,
    dur: 8.4,
    text: 'React reads cell zero and the page stands up — with holes. The lazy references from chapter two become genuine suspense points: each hole shows a fallback until its cell settles.',
  });
  tl.tween(cam, CAM_BROWSER, { at: 26.0, dur: 1.4, ease: ease.move });
  tl.tween(readU, 1, { at: 26.6, dur: 1.8, ease: ease.move });
  tl.hold(34.2, 0.5);

  // — beat 5 · a corner of the page pops in —
  tl.caption({
    at: 34.7,
    dur: 7.6,
    text: 'Rows keep landing. The section row arrives, its cell settles, and that corner of the page simply pops in. No refetch, no special reconciliation — just a promise resolving.',
  });
  tl.tween(rowsBU, 1, { at: 35.1, dur: 3.4, ease: ease.linear });
  tl.hold(42.3, 0.5);

  // — beat 6 · the import cell preloads —
  tl.caption({
    at: 42.8,
    dur: 8.2,
    text: "The import cell is busier. The instant its row landed, React began downloading the counter's script files — it preloads every module as early as possible, betting it will need them.",
  });
  tl.tween(cam, CAM_WIDE, { at: 43.0, dur: 1.3, ease: ease.move });
  tl.tween(dlU, 1, { at: 43.6, dur: 4.6, ease: ease.linear });
  tl.hold(51.0, 0.5);

  // — beat 7 · the reference becomes a function —
  tl.caption({
    at: 51.5,
    dur: 8.2,
    text: 'When the script arrives, the reference finally becomes a function — the real counter — and it mounts alive. State, clicks, effects: everything a server component had to give up.',
  });
  tl.tween(reqU, 1, { at: 52.1, dur: 2.2, ease: ease.move });
  tl.hold(59.7, 0.5);

  // — beat 8 · the tape keeps its promise —
  tl.caption({
    at: 60.2,
    dur: 7.8,
    text: "Remember the promise that boarded as dollar at five? Its row arrives last, its cell settles, and the value threads into the counter's props. The tape kept its promise.",
  });
  tl.tween(p5U, 1, { at: 60.8, dur: 2.2, ease: ease.move });
  tl.hold(68.0, 0.5);

  // — beat 9 · when the server fails —
  tl.caption({
    at: 68.5,
    dur: 9.0,
    text: 'And when the server fails? An E row lands, the cell rejects, and the nearest error boundary catches it — carrying a digest that points at the server logs, not a stack trace for the world.',
  });
  tl.tween(errU, 1, { at: 69.1, dur: 2.0, ease: ease.move });
  tl.hold(77.5, 0.5);

  // — beat 10 · recap —
  tl.caption({
    at: 78.0,
    dur: 9.4,
    text: 'Step back. Every row found its cell, and every cell fed its patch of the page. A description crossed the wire and woke up as an interface. One direction remains — the trip back.',
  });
  tl.tween(linkU, 1, { at: 78.6, dur: 2.4, ease: ease.draw });
  tl.tween(closeU, 1, { at: 81.4, dur: 1.4, ease: ease.enter });
  tl.hold(87.4, 1.2);

  return { tl, cam, tapeU, tableU, rowsAU, readU, rowsBU, dlU, reqU, p5U, errU, linkU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

interface CellView {
  stroke: string;
  label: string;
  filled: boolean;
  dash: boolean;
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const tableU = s.get(scene.tableU);
  const rowsAU = s.get(scene.rowsAU);
  const readU = s.get(scene.readU);
  const rowsBU = s.get(scene.rowsBU);
  const dlU = s.get(scene.dlU);
  const reqU = s.get(scene.reqU);
  const p5U = s.get(scene.p5U);
  const errU = s.get(scene.errU);
  const linkU = s.get(scene.linkU);
  const closeU = s.get(scene.closeU);

  // which tape rows have landed (drives both tape + cells)
  const landed: number[] = [
    win(rowsAU, 2, 0, 1.4), // row id 2 (import)
    win(rowsAU, 2, 1, 1.4), // row id 0 (root)
    win(rowsBU, 3, 0, 1.4), // row 1
    win(rowsBU, 3, 1, 1.4), // row 3
    win(rowsBU, 3, 2, 1.4), // row 4
    p5U, // row 5
    errU, // row 6
  ];

  const pendingCell: CellView = { stroke: colors.GRID, label: 'pending', filled: false, dash: true };
  const cells: CellView[] = [
    // cell 0 — root model
    landed[1] >= 1
      ? readU > 0.4
        ? { stroke: colors.POSITIVE, label: "'fulfilled'", filled: true, dash: false }
        : { stroke: colors.ACCENT, label: 'resolved_model', filled: false, dash: false }
      : pendingCell,
    // cell 1 — section
    landed[2] >= 1
      ? rowsBU > 0.9
        ? { stroke: colors.POSITIVE, label: "'fulfilled'", filled: true, dash: false }
        : { stroke: colors.ACCENT, label: 'resolved_model', filled: false, dash: false }
      : pendingCell,
    // cell 2 — the import
    landed[0] >= 1
      ? reqU > 0.6
        ? { stroke: colors.POSITIVE, label: "'fulfilled'", filled: true, dash: false }
        : dlU >= 1
          ? { stroke: colors.SECONDARY, label: 'resolved_module', filled: false, dash: false }
          : { stroke: colors.SECONDARY, label: 'blocked — loading', filled: false, dash: true }
      : pendingCell,
    // cell 3 — text
    landed[3] >= 1 ? { stroke: colors.POSITIVE, label: "'fulfilled'", filled: true, dash: false } : pendingCell,
    // cell 4 — shared object
    landed[4] >= 1 ? { stroke: colors.POSITIVE, label: "'fulfilled'", filled: true, dash: false } : pendingCell,
    // cell 5 — the promise
    p5U >= 1 ? { stroke: colors.POSITIVE, label: "'fulfilled'", filled: true, dash: false } : pendingCell,
    // cell 6 — the error
    errU >= 1 ? { stroke: colors.NEGATIVE, label: "'rejected'", filled: true, dash: false } : pendingCell,
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* tape panel */}
        <g opacity={tapeU}>
          <rect x={TAPE.x} y={TAPE.y} width={TAPE.w} height={TAPE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
          <text x={TAPE.x + 14} y={TAPE.y + 22} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
            the tape, arriving
          </text>
          {TAPE_ROWS.map((r, i) => {
            const u = landed[i];
            if (u <= 0) return null;
            return (
              <g key={r.id} opacity={clamp01(u * 1.4)}>
                <rect x={TAPE.x + 10} y={tapeRowY(i) - 14} width={TAPE.w - 20} height={30} rx={6} fill={colors.BG} stroke={i === 6 && errU > 0.5 ? colors.NEGATIVE : colors.GRID} opacity={0.9} />
                <text x={TAPE.x + 20} y={tapeRowY(i) + 5} fill={i === 6 ? colors.NEGATIVE : colors.TEXT} fontSize={9.5} fontFamily={MONO}>
                  {r.txt.slice(0, Math.round(r.txt.length * clamp01(u * 1.2)))}
                </text>
              </g>
            );
          })}
        </g>

        {/* chunk table */}
        <g opacity={tableU}>
          <text x={cellX(0)} y={CELL.y - 22} fill={colors.MUTED} fontSize={12}>
            the chunk table — one promise-like cell per row id
          </text>
          <text x={cellX(6) + CELL.w} y={CELL.y - 22} textAnchor="end" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
            ReactFlightClient.js
          </text>
          {cells.map((c, i) => {
            const u = win(tableU, cells.length, i, 2.0);
            if (u <= 0) return null;
            const x = cellX(i);
            return (
              <g key={i} opacity={u}>
                <rect
                  x={x}
                  y={CELL.y}
                  width={CELL.w}
                  height={CELL.h}
                  rx={10}
                  fill={c.filled ? colors.PANEL : 'none'}
                  stroke={c.stroke}
                  strokeWidth={c.filled ? 1.8 : 1.2}
                  strokeDasharray={c.dash ? '5 4' : undefined}
                />
                <text x={x + CELL.w / 2} y={CELL.y + 34} textAnchor="middle" fill={c.stroke} fontSize={20} fontFamily={MONO} fontWeight={700}>
                  {i}
                </text>
                <text x={x + CELL.w / 2} y={CELL.y + 58} textAnchor="middle" fill={c.stroke} fontSize={8.5} fontFamily={MONO}>
                  {c.label}
                </text>
              </g>
            );
          })}
          {/* legend */}
          <g opacity={clamp01(tableU * 1.2) * 0.95}>
            {LEGEND.map((l, i) => (
              <g key={l.t}>
                <circle cx={402 + i * 168} cy={CELL.y + CELL.h + 26} r={4} fill={l.c} />
                <text x={412 + i * 168} y={CELL.y + CELL.h + 30} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                  {l.t}
                </text>
              </g>
            ))}
          </g>
          <text x={cellX(0)} y={CELL.y + CELL.h + 50} fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={tableU * 0.9}>
            ReactPromise — "We subclass Promise.prototype so that we get other methods like .catch"
          </text>
        </g>

        {/* browser frame */}
        <g opacity={tapeU}>
          <rect x={BROWSER.x} y={BROWSER.y} width={BROWSER.w} height={BROWSER.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
          <rect x={BROWSER.x} y={BROWSER.y} width={BROWSER.w} height={30} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={BROWSER.x + 18 + i * 16} cy={BROWSER.y + 15} r={4.5} fill={colors.GRID} />
          ))}
          <text x={BROWSER.x + BROWSER.w / 2} y={BROWSER.y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
            the page, assembling
          </text>

          {/* h1 — appears when root is read */}
          {readU > 0.05 && (
            <text x={BROWSER.x + 34} y={BROWSER.y + 74} fill={colors.TEXT} fontSize={22} fontWeight={700} opacity={readU}>
              Notes
            </text>
          )}

          {/* Counter slot: dashed hole with spinner → live button */}
          {readU > 0.15 &&
            (() => {
              const x = BROWSER.x + 34;
              const y = BROWSER.y + 104;
              const mounted = reqU > 0.7;
              return (
                <g opacity={clamp01((readU - 0.15) / 0.6)}>
                  <rect x={x} y={y} width={190} height={54} rx={10} fill={mounted ? colors.BG : 'none'} stroke={mounted ? colors.ACCENT : colors.GRID} strokeWidth={mounted ? 1.8 : 1.2} strokeDasharray={mounted ? undefined : '6 5'} />
                  {!mounted ? (
                    <>
                      <circle cx={x + 95} cy={y + 27} r={9} fill="none" stroke={colors.MUTED} strokeWidth={2} strokeDasharray="10 32" transform={`rotate(${dlU * 540 + readU * 120} ${x + 95} ${y + 27})`} />
                      <text x={x + 95} y={y + 70} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                        Suspense fallback
                      </text>
                    </>
                  ) : (
                    <>
                      <text x={x + 95} y={y + 33} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily={MONO} fontWeight={650}>
                        {p5U >= 1 ? 'Count: 42' : 'Count: 0'}
                      </text>
                      {reqU > 0.85 && reqU < 1 && <circle cx={x + 95} cy={y + 27} r={12 + 40 * ((reqU - 0.85) / 0.15)} fill="none" stroke={colors.ACCENT} strokeWidth={1.6 * (1 - (reqU - 0.85) / 0.15)} opacity={1 - (reqU - 0.85) / 0.15} />}
                    </>
                  )}
                </g>
              );
            })()}

          {/* section: hole → text pops in */}
          {readU > 0.3 &&
            (() => {
              const x = BROWSER.x + 34;
              const y = BROWSER.y + 190;
              const on = rowsBU > 0.9;
              return (
                <g opacity={clamp01((readU - 0.3) / 0.6)}>
                  <rect x={x} y={y} width={BROWSER.w - 68} height={64} rx={10} fill={on ? colors.BG : 'none'} stroke={on ? colors.SECONDARY : colors.GRID} strokeWidth={1.3} strokeDasharray={on ? undefined : '6 5'} />
                  {on && (
                    <g opacity={clamp01((rowsBU - 0.9) / 0.1)}>
                      <text x={x + 20} y={y + 27} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                        section
                      </text>
                      <text x={x + 20} y={y + 48} fill={colors.TEXT} fontSize={14}>
                        Hello from server
                      </text>
                    </g>
                  )}
                </g>
              );
            })()}

          {/* error toast */}
          {errU > 0.5 && (
            <g opacity={clamp01((errU - 0.5) / 0.5)}>
              <rect x={BROWSER.x + 260} y={BROWSER.y + 110} width={196} height={48} rx={9} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.4} />
              <text x={BROWSER.x + 274} y={BROWSER.y + 130} fill={colors.NEGATIVE} fontSize={10.5} fontWeight={650}>
                error boundary caught it
              </text>
              <text x={BROWSER.x + 274} y={BROWSER.y + 147} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                digest: "1f8a" — see server logs
              </text>
            </g>
          )}
        </g>

        {/* download bar */}
        {dlU > 0.02 && reqU < 0.95 && (
          <g opacity={clamp01(dlU * 3) * (1 - clamp01((reqU - 0.7) / 0.25))}>
            <text x={DL.x} y={DL.y + 6} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              chunk-c3.js
            </text>
            <rect x={DL.x} y={DL.y + 14} width={DL.w} height={12} rx={6} fill={colors.BG} stroke={colors.GRID} />
            <rect x={DL.x + 2} y={DL.y + 16} width={(DL.w - 4) * dlU} height={8} rx={4} fill={colors.SECONDARY} opacity={0.9} />
            <text x={DL.x} y={DL.y + 46} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
              {dlU >= 1 ? 'loaded — requireModule on first read' : 'preloadModule — fetching early'}
            </text>
          </g>
        )}

        {/* n = 42 thread from cell 5 into the counter */}
        {p5U > 0.3 && reqU > 0.7 && (
          <path
            d={`M ${cellX(5) + CELL.w / 2} ${CELL.y + CELL.h} C ${cellX(5) + 40} ${CELL.y + 160}, ${BROWSER.x + 260} ${BROWSER.y + 80}, ${BROWSER.x + 226} ${BROWSER.y + 128}`}
            fill="none"
            stroke={colors.POSITIVE}
            strokeWidth={1.4}
            strokeDasharray="4 4"
            opacity={clamp01((p5U - 0.3) / 0.5) * 0.85}
          />
        )}

        {/* recap threads: row → cell → page */}
        {linkU > 0.02 &&
          ([
            { row: 1, cell: 0, tx: BROWSER.x + 70, ty: BROWSER.y + 66 },
            { row: 0, cell: 2, tx: BROWSER.x + 129, ty: BROWSER.y + 131 },
            { row: 3, cell: 3, tx: BROWSER.x + 120, ty: BROWSER.y + 238 },
          ] as const).map((l, i) => {
            const u = win(linkU, 3, i, 1.8);
            if (u <= 0) return null;
            const x0 = TAPE.x + TAPE.w - 10;
            const y0 = tapeRowY(l.row);
            const x1 = cellX(l.cell) + CELL.w / 2;
            const y1 = CELL.y + CELL.h;
            return (
              <g key={i} opacity={u * 0.75}>
                <path d={`M ${x0} ${y0} C ${x0 + 60} ${y0}, ${x1 - 80} ${CELL.y + 40}, ${x1 - CELL.w / 2} ${CELL.y + 40}`} fill="none" stroke={colors.WARM} strokeWidth={1.2} />
                <path d={`M ${x1} ${y1} C ${x1} ${y1 + 40}, ${l.tx} ${l.ty - 40}, ${l.tx} ${l.ty}`} fill="none" stroke={colors.WARM} strokeWidth={1.2} />
              </g>
            );
          })}

        {/* closing line */}
        {closeU > 0.02 && (
          <g opacity={closeU}>
            <rect x={330} y={52} width={620} height={44} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={640} y={80} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={650}>
              A description crossed the wire — and woke up as an interface.
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
