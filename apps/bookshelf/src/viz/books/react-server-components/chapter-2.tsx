// Chapter 2 — Rows on a tape: Flight's wire format
//
// Grounding: packages/react-server/src/ReactFlightServer.js —
// serializeRowHeader (line ~3007): `id.toString(16) + ':' + tag`;
// emitModelChunk writes `id.toString(16) + ':' + json + '\n'` (model rows have
// no tag); nextChunkId++ assigns ids; emitImportChunk writes 'I' rows with
// [id, chunks, name] metadata (ReactFlightImportMetadata: ID=0, CHUNKS=1,
// NAME=2); emitTextChunk 'T' rows are `id:T<hexlen>,text`; emitErrorChunk 'E'
// rows carry {digest}; emitHintChunk ':H'; serializeReadableStream 'R'/'C'.
// Elements serialize as ["$", type, key, props]; '$L<hex>' = lazy reference,
// '$@<hex>' = promise (serializeLazyID / serializePromiseID); dedup via
// request.writtenObjects (WeakMap). Client side: processFullStringRow parses
// newline-framed rows as they arrive (ReactFlightClient.js).
//
// Centerpiece: THE TAPE — real rows write themselves one by one; a camera
// lens dissects row zero; reference arrows stitch the graph; a reading head
// shows the client consuming the tape while it is still being written.
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
const FS = 10.5; // row font size
const CW = FS * 0.602; // monospace advance width

// ---------------------------------------------------------------------------
// The tape: real Flight rows for the chapter-1 fixture tree.
// ---------------------------------------------------------------------------

const TAPE = { x: 128, y: 108, w: 800, h: 344 } as const;
const ROW_H = 50;
const PAD = 16;
const rowY = (i: number): number => TAPE.y + 44 + i * ROW_H;

interface FlightRow {
  full: string;
  /** highlighted reference tokens inside the row */
  refs: string[];
  late?: boolean;
}

const ROWS: FlightRow[] = [
  { full: '2:I["./src/Counter.js",["c3","chunk-c3.js"],"Counter"]', refs: [] },
  {
    full: '0:["$","div",null,{"children":[["$","h1",null,{"children":"Notes"}],["$","$L2",null,{"n":"$@5"}],"$L1"]}]',
    refs: ['"$L2"', '"$@5"', '"$L1"'],
  },
  { full: '1:["$","section",null,{"children":"$3"}]', refs: ['"$3"'] },
  { full: '3:T11,Hello from server', refs: [] },
  { full: '4:{"user":"seb"}', refs: [] },
  { full: '5:42', refs: [], late: true },
];
const N_EARLY = 5;

/** x of a substring inside a row (monospace). */
const tokX = (row: FlightRow, token: string): number =>
  TAPE.x + PAD + row.full.indexOf(token) * CW;
const tokW = (token: string): number => token.length * CW;

// where each reference points: token -> target row index
const REF_TARGETS: Array<{ row: number; token: string; target: number }> = [
  { row: 1, token: '"$L2"', target: 0 },
  { row: 1, token: '"$@5"', target: 5 },
  { row: 1, token: '"$L1"', target: 2 },
  { row: 2, token: '"$3"', target: 3 },
];

// tuple anatomy of row 0 (index 1): ["$","div",null,{...}]
const R1 = ROWS[1];
const TUPLE = [
  { token: '"$"', label: 'marker', color: colors.WARM },
  { token: '"div"', label: 'type', color: colors.ACCENT },
  { token: 'null', label: 'key', color: colors.MUTED },
  { token: '{"children"', label: 'props…', color: colors.POSITIVE },
] as const;

// the tag gallery
const TAGS = [
  { t: 'I', d: 'import — client code, by address' },
  { t: 'T', d: 'text — long strings, length-framed' },
  { t: 'E', d: 'error — a digest crosses, not the stack' },
  { t: 'H', d: 'hint — preload this, browser' },
  { t: 'R / C', d: 'stream open / close' },
] as const;

// the mini tree that stands up as rows land
const TREE = { x: 968, y: 150 } as const;
const TREE_NODES = [
  { name: 'div', row: 1, fx: 0.5, fy: 0 },
  { name: 'h1', row: 1, fx: 0.14, fy: 1 },
  { name: 'Counter', row: 0, fx: 0.55, fy: 1 },
  { name: 'section', row: 2, fx: 0.95, fy: 1 },
  { name: 'text', row: 3, fx: 0.95, fy: 2 },
] as const;
const treeXY = (n: { fx: number; fy: number }) => ({
  x: TREE.x + n.fx * 220,
  y: TREE.y + n.fy * 92,
});

// camera marks
const CAM_TAPE: CameraState = { x: 560, y: 300, k: 1.14 };
const CAM_ROW0: CameraState = { x: TAPE.x + 330, y: rowY(1) - 10, k: 2.0 };
const CAM_TUPLE: CameraState = { x: TAPE.x + 330, y: rowY(1) - 6, k: 1.85 };
const CAM_GRAPH: CameraState = { x: 700, y: 330, k: 1.02 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~101s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TAPE, cameraInterp);

  const tapeU = tl.channel('tapeU', 0); // tape panel + writer head
  const rowsU = tl.channel('rowsU', 0); // early rows type in
  const anatU = tl.channel('anatU', 0); // anatomy callouts on row 0
  const tupleU = tl.channel('tupleU', 0); // tuple brackets on row 0
  const refU = tl.channel('refU', 0); // reference arrows
  const treeU = tl.channel('treeU', 0); // mini tree stands up
  const impU = tl.channel('impU', 0); // import row spotlight
  const galU = tl.channel('galU', 0); // tag gallery
  const playU = tl.channel('playU', 0); // reading head sweep
  const lateU = tl.channel('lateU', 0); // row 5 lands late
  const dedupU = tl.channel('dedupU', 0); // shared-object beat
  const dimU = tl.channel('dimU', 0); // quiet stage
  const closeU = tl.channel('closeU', 0); // closing card

  // — beat 1 · the hook —
  tl.caption({
    at: 0.5,
    dur: 8.0,
    text: 'Crack open the response for a server components page and you will not find markup. You will find rows — one per line, each with an address. React calls this format Flight.',
  });
  tl.tween(tapeU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.hold(8.5, 0.5);

  // — beat 2 · the server writes —
  tl.caption({
    at: 9.0,
    dur: 8.0,
    text: 'The server writes this tape with a counter in one hand. Each row takes the next free number, printed in hex, then a colon, then a body. Row zero is the root of the page.',
  });
  tl.tween(rowsU, 1, { at: 9.4, dur: 6.2, ease: ease.linear });
  tl.hold(17.0, 0.5);

  // — beat 3 · anatomy under the lens —
  tl.caption({
    at: 17.5,
    dur: 8.6,
    text: 'Put row zero under the lens. An address. An optional one letter tag. A body that is one line of text. And a newline to close it — that newline is the entire framing protocol.',
  });
  tl.tween(cam, CAM_ROW0, { at: 17.7, dur: 1.5, ease: ease.move });
  tl.tween(anatU, 1, { at: 19.2, dur: 1.0, ease: ease.enter });
  tl.hold(26.1, 0.5);

  // — beat 4 · the element tuple —
  tl.caption({
    at: 26.6,
    dur: 8.0,
    text: 'And the body is barely a format at all. An element is an array of four: a dollar sign marker, a type, a key, and the props. That is a div, spelled as data.',
  });
  tl.tween(anatU, 0, { at: 26.8, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_TUPLE, { at: 26.9, dur: 1.0, ease: ease.move });
  tl.tween(tupleU, 1, { at: 27.6, dur: 1.6, ease: ease.enter });
  tl.hold(34.6, 0.5);

  // — beat 5 · dollar strings are addresses —
  tl.caption({
    at: 35.1,
    dur: 9.2,
    text: 'Strings that start with a dollar sign are addresses. Dollar L two means a lazy hole, filled by row two. Dollar at five means a promise, kept by row five. The tape is a graph, stitched by references.',
  });
  tl.tween(tupleU, 0, { at: 35.3, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_GRAPH, { at: 35.4, dur: 1.4, ease: ease.move });
  tl.tween(refU, 1, { at: 36.4, dur: 2.2, ease: ease.draw });
  tl.tween(treeU, 0.6, { at: 38.0, dur: 2.0, ease: ease.move });
  tl.hold(44.8, 0.5);

  // — beat 6 · the import row —
  tl.caption({
    at: 45.3,
    dur: 8.6,
    text: 'Row two is the sealed counter from chapter one, crossing as an import: a module address, the script files that hold it, and an export name. Code never rides this tape — only directions to code.',
  });
  tl.tween(impU, 1, { at: 45.7, dur: 0.9, ease: ease.enter });
  tl.hold(54.4, 0.5);

  // — beat 7 · the tag gallery —
  tl.caption({
    at: 54.9,
    dur: 8.2,
    text: 'A handful of letters covers the rest of the world. T carries long text. E carries an error as a digest. H tells the browser to preload something. R and C open and close whole streams.',
  });
  tl.tween(impU, 0, { at: 55.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_WIDE, { at: 55.2, dur: 1.2, ease: ease.move });
  tl.tween(galU, 1, { at: 55.9, dur: 1.8, ease: ease.enter });
  tl.hold(63.6, 0.5);

  // — beat 8 · streaming: read while writing —
  tl.caption({
    at: 64.1,
    dur: 8.6,
    text: 'Because rows frame themselves, the client never waits for the end of the tape. The tree stands up the moment row zero lands — and late rows drop into their holes as they arrive.',
  });
  tl.tween(galU, 0.15, { at: 64.3, dur: 0.6, ease: ease.enter });
  tl.tween(playU, 1, { at: 64.7, dur: 3.4, ease: ease.linear });
  tl.tween(treeU, 1, { at: 65.6, dur: 1.8, ease: ease.move });
  tl.tween(lateU, 1, { at: 69.4, dur: 1.6, ease: ease.move });
  tl.hold(72.9, 0.5);

  // — beat 9 · dedup —
  tl.caption({
    at: 73.4,
    dur: 8.0,
    text: 'One more trick: the server remembers every object it has already written. Share one object in two places and it crosses exactly once — every other mention is just its address.',
  });
  tl.tween(dedupU, 1, { at: 73.9, dur: 1.4, ease: ease.enter });
  tl.hold(81.6, 0.5);

  // — beat 10 · close —
  tl.caption({
    at: 82.1,
    dur: 9.0,
    text: 'So the tape can carry elements, text, promises, errors, even streams. What it cannot carry is the subject of the next chapter — the gate where every value is searched before it boards.',
  });
  tl.tween(dimU, 1, { at: 82.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 83.9, dur: 1.4, ease: ease.enter });
  tl.hold(90.6, 1.2);

  return {
    tl,
    cam,
    tapeU,
    rowsU,
    anatU,
    tupleU,
    refU,
    treeU,
    impU,
    galU,
    playU,
    lateU,
    dedupU,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const rowsU = s.get(scene.rowsU);
  const anatU = s.get(scene.anatU);
  const tupleU = s.get(scene.tupleU);
  const refU = s.get(scene.refU);
  const treeU = s.get(scene.treeU);
  const impU = s.get(scene.impU);
  const galU = s.get(scene.galU);
  const playU = s.get(scene.playU);
  const lateU = s.get(scene.lateU);
  const dedupU = s.get(scene.dedupU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.88 * dimU;

  /** typed-in fraction for early row i */
  const rowIn = (i: number): number => (ROWS[i].late ? lateU : win(rowsU, N_EARLY, i, 1.6));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={mainOp}>
          {/* tape panel */}
          <g opacity={tapeU}>
            <rect x={TAPE.x} y={TAPE.y} width={TAPE.w} height={TAPE.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
            <text x={TAPE.x + 16} y={TAPE.y + 24} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              response body — text/x-component
            </text>
            <text x={TAPE.x + TAPE.w - 16} y={TAPE.y + 24} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              ReactFlightServer.js
            </text>
          </g>

          {/* rows */}
          {ROWS.map((r, i) => {
            const u = rowIn(i);
            if (u <= 0) return null;
            const y = rowY(i);
            const chars = Math.round(r.full.length * clamp01(u * 1.15));
            const shown = r.full.slice(0, chars);
            const isImport = i === 0;
            const spot = isImport ? impU : 0;
            const anatDim = anatU > 0 && i !== 1 ? 1 - 0.8 * anatU : 1;
            const impDim = impU > 0 && !isImport ? 1 - 0.6 * impU : 1;
            return (
              <g key={i} opacity={anatDim * impDim}>
                <rect
                  x={TAPE.x + 8}
                  y={y - 16}
                  width={TAPE.w - 16}
                  height={34}
                  rx={7}
                  fill={colors.BG}
                  stroke={spot > 0.05 ? colors.WARM : colors.GRID}
                  strokeWidth={1 + spot}
                  opacity={0.85}
                />
                {/* row id colored */}
                <text x={TAPE.x + PAD} y={y + 5} fill={colors.WARM} fontSize={FS} fontFamily={MONO}>
                  {shown.slice(0, Math.min(chars, 2))}
                </text>
                {/* rest of the row */}
                {chars > 2 && (
                  <text x={TAPE.x + PAD + 2 * CW} y={y + 5} fill={colors.TEXT} fontSize={FS} fontFamily={MONO}>
                    {shown.slice(2)}
                  </text>
                )}
                {/* reference tokens re-inked in accent */}
                {u >= 1 &&
                  r.refs.map((tok) => (
                    <text key={tok} x={tokX(r, tok)} y={y + 5} fill={colors.ACCENT} fontSize={FS} fontFamily={MONO} fontWeight={700}>
                      {tok}
                    </text>
                  ))}
                {/* the newline glyph at the end of a finished row */}
                {u >= 1 && (
                  <text x={TAPE.x + PAD + r.full.length * CW + 5} y={y + 5} fill={colors.MUTED} fontSize={FS - 1} fontFamily={MONO} opacity={0.7}>
                    ⏎
                  </text>
                )}
              </g>
            );
          })}

          {/* writer head: rides down as rows appear */}
          {tapeU > 0.5 && rowsU < 1 && (
            <g opacity={0.9}>
              <rect x={TAPE.x - 36} y={rowY(Math.min(Math.floor(rowsU * N_EARLY), N_EARLY - 1)) - 12} width={26} height={24} rx={5} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={TAPE.x - 23} y={rowY(Math.min(Math.floor(rowsU * N_EARLY), N_EARLY - 1)) + 4} textAnchor="middle" fill={colors.WARM} fontSize={12}>
                ✎
              </text>
            </g>
          )}

          {/* anatomy callouts on row zero */}
          {anatU > 0.02 &&
            (() => {
              const y = rowY(1);
              const items = [
                { x: TAPE.x + PAD + 0.5 * CW, t: 'row id (hex)', c: colors.WARM, dy: -26 },
                { x: TAPE.x + PAD + 12 * CW, t: 'body — one line of text', c: colors.TEXT, dy: 26 },
                { x: TAPE.x + PAD + ROWS[1].full.length * CW + 8, t: 'newline ends the row', c: colors.MUTED, dy: -26 },
              ];
              return (
                <g opacity={anatU}>
                  {items.map((it) => (
                    <g key={it.t}>
                      <line x1={it.x} y1={y + (it.dy < 0 ? -14 : 8)} x2={it.x} y2={y + it.dy - (it.dy < 0 ? -4 : 8)} stroke={it.c} strokeWidth={1} opacity={0.7} />
                      <text x={it.x} y={y + it.dy} textAnchor={it.dy < 0 ? 'start' : 'middle'} fill={it.c} fontSize={8.5}>
                        {it.t}
                      </text>
                    </g>
                  ))}
                  {/* the tag callout points at the I on the row above */}
                  <g>
                    <line x1={TAPE.x + PAD + 2.5 * CW} y1={rowY(0) + 10} x2={TAPE.x + PAD + 8 * CW} y2={rowY(0) + 22} stroke={colors.SECONDARY} strokeWidth={1} opacity={0.7} />
                    <text x={TAPE.x + PAD + 9 * CW} y={rowY(0) + 26} fill={colors.SECONDARY} fontSize={8.5}>
                      optional tag — this one is I, an import
                    </text>
                  </g>
                  {/* serializeRowHeader chip */}
                  <g transform={`translate(${TAPE.x + 330},${y + 44})`}>
                    <rect x={-128} y={-11} width={256} height={22} rx={6} fill={colors.BG} stroke={colors.GRID} />
                    <text x={0} y={4} textAnchor="middle" fill={colors.MUTED} fontSize={8.5} fontFamily={MONO}>
                      {"serializeRowHeader: id.toString(16) + ':' + tag"}
                    </text>
                  </g>
                </g>
              );
            })()}

          {/* tuple brackets on row zero */}
          {tupleU > 0.02 &&
            (() => {
              const y = rowY(1);
              return (
                <g opacity={tupleU}>
                  {TUPLE.map((t, i) => {
                    const x = tokX(R1, t.token);
                    const w = t.token === '{"children"' ? 24 * CW : tokW(t.token);
                    const flip = i % 2 === 0 ? -1 : 1;
                    const ly = y + (flip < 0 ? -24 : 30);
                    return (
                      <g key={t.label}>
                        <rect x={x - 2} y={y - 13} width={w + 4} height={26} rx={4} fill="none" stroke={t.color} strokeWidth={1.2} opacity={0.85} />
                        <text x={x + w / 2} y={ly} textAnchor="middle" fill={t.color} fontSize={9} fontWeight={650}>
                          {t.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}

          {/* reference arrows: token -> target row */}
          {refU > 0.02 &&
            REF_TARGETS.map((rt, i) => {
              const u = win(refU, REF_TARGETS.length, i, 2.0);
              if (u <= 0) return null;
              const late = ROWS[rt.target].late;
              const targetIn = late ? lateU : 1;
              const x0 = tokX(ROWS[rt.row], rt.token) + tokW(rt.token) / 2;
              const y0 = rowY(rt.row) + 14;
              const x1 = TAPE.x + 30;
              const y1 = rowY(rt.target) - (rt.target > rt.row ? 18 : -18);
              const bendX = TAPE.x - 34;
              return (
                <g key={i} opacity={u * 0.9}>
                  <path
                    d={`M ${x0} ${y0} C ${x0} ${y0 + 26}, ${bendX} ${(y0 + y1) / 2}, ${x1} ${y1}`}
                    fill="none"
                    stroke={targetIn >= 1 ? colors.ACCENT : colors.MUTED}
                    strokeWidth={1.3}
                    strokeDasharray={targetIn >= 1 ? undefined : '3 4'}
                  />
                  <circle cx={x1} cy={y1} r={3} fill={targetIn >= 1 ? colors.ACCENT : colors.MUTED} />
                </g>
              );
            })}

          {/* mini tree standing up on the right */}
          {treeU > 0.02 && (
            <g>
              <text x={TREE.x + 110} y={TREE.y - 34} textAnchor="middle" fill={colors.MUTED} fontSize={12} opacity={clamp01(treeU * 2)}>
                what the client sees
              </text>
              {TREE_NODES.map((n, i) => {
                const u = win(treeU, TREE_NODES.length, i, 1.8);
                if (u <= 0) return null;
                const { x, y } = treeXY(n);
                const isCounter = n.name === 'Counter';
                const holeFilled = !isCounter || playU > 0.5;
                const parent = i === 0 ? null : i === 4 ? TREE_NODES[3] : TREE_NODES[0];
                return (
                  <g key={n.name} opacity={u}>
                    {parent && (
                      (() => {
                        const p = treeXY(parent);
                        return <line x1={p.x} y1={p.y + 13} x2={x} y2={y - 13} stroke={colors.GRID} strokeWidth={1.2} />;
                      })()
                    )}
                    <rect
                      x={x - 34}
                      y={y - 13}
                      width={68}
                      height={26}
                      rx={7}
                      fill={holeFilled ? colors.PANEL : 'none'}
                      stroke={isCounter ? colors.ACCENT : colors.SECONDARY}
                      strokeWidth={1.3}
                      strokeDasharray={holeFilled ? undefined : '4 4'}
                    />
                    <text x={x} y={y + 4} textAnchor="middle" fill={isCounter ? colors.ACCENT : colors.TEXT} fontSize={10.5} fontFamily={MONO}>
                      {n.name}
                    </text>
                    {/* the promise-fed prop pops when row 5 lands */}
                    {isCounter && lateU > 0.4 && (
                      <g opacity={clamp01((lateU - 0.4) / 0.6)}>
                        <rect x={x - 22} y={y + 18} width={44} height={18} rx={5} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.1} />
                        <text x={x} y={y + 31} textAnchor="middle" fill={colors.POSITIVE} fontSize={9.5} fontFamily={MONO}>
                          n = 42
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* import row metadata brackets */}
          {impU > 0.02 &&
            (() => {
              const r = ROWS[0];
              const y = rowY(0);
              const parts = [
                { token: '"./src/Counter.js"', label: 'module id', color: colors.WARM },
                { token: '["c3","chunk-c3.js"]', label: 'chunk files', color: colors.ACCENT },
                { token: '"Counter"', label: 'export name', color: colors.POSITIVE },
              ];
              return (
                <g opacity={impU}>
                  {parts.map((p) => {
                    const x = tokX(r, p.token);
                    const w = tokW(p.token);
                    return (
                      <g key={p.label}>
                        <rect x={x - 2} y={y - 13} width={w + 4} height={26} rx={4} fill="none" stroke={p.color} strokeWidth={1.2} opacity={0.9} />
                        <text x={x + w / 2} y={y - 22} textAnchor="middle" fill={p.color} fontSize={9.5} fontWeight={650}>
                          {p.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}

          {/* tag gallery */}
          {galU > 0.02 && (
            <g opacity={galU}>
              {TAGS.map((t, i) => {
                const u = win(galU, TAGS.length, i, 1.8);
                const y = 486 + 0; // single row of chips under the tape
                const x = 170 + i * 200;
                return (
                  <g key={t.t} opacity={u} transform={`translate(${x},${y + 8 * (1 - u)})`}>
                    <rect x={-24} y={-16} width={48} height={32} rx={8} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.3} />
                    <text x={0} y={6} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily={MONO} fontWeight={700}>
                      {t.t}
                    </text>
                    <text x={32} y={5} fill={colors.MUTED} fontSize={10.5}>
                      {t.d}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* the reading head sweeping the tape */}
          {playU > 0.02 && playU < 1 && (
            <g>
              <line
                x1={TAPE.x + 4}
                y1={rowY(0) - 22 + playU * (rowY(5) - rowY(0) + 30)}
                x2={TAPE.x + TAPE.w - 4}
                y2={rowY(0) - 22 + playU * (rowY(5) - rowY(0) + 30)}
                stroke={colors.POSITIVE}
                strokeWidth={1.6}
                opacity={0.8}
              />
              <text x={TAPE.x + TAPE.w - 8} y={rowY(0) - 28 + playU * (rowY(5) - rowY(0) + 30)} textAnchor="end" fill={colors.POSITIVE} fontSize={10}>
                client reads here
              </text>
            </g>
          )}

          {/* dedup: two mentions, one row */}
          {dedupU > 0.02 &&
            (() => {
              const target = { x: TAPE.x + 30, y: rowY(4) };
              const chips = [
                { x: TAPE.x + 520, y: rowY(1) - 34 },
                { x: TAPE.x + 620, y: rowY(2) - 30 },
              ];
              return (
                <g opacity={dedupU}>
                  {chips.map((c, i) => (
                    <g key={i}>
                      <rect x={c.x - 22} y={c.y - 12} width={44} height={22} rx={6} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.2} />
                      <text x={c.x} y={c.y + 4} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
                        "$4"
                      </text>
                      <path
                        d={`M ${c.x - 22} ${c.y} C ${c.x - 120} ${c.y + 20}, ${target.x + 120} ${target.y - 30}, ${target.x + 30} ${target.y - 14}`}
                        fill="none"
                        stroke={colors.WARM}
                        strokeWidth={1.1}
                        strokeDasharray="3 4"
                        opacity={0.8}
                      />
                    </g>
                  ))}
                  <text x={target.x + 200} y={target.y + 26} fill={colors.MUTED} fontSize={10}>
                    writtenObjects — written once, referenced forever
                  </text>
                </g>
              );
            })()}
        </g>

        {/* closing card */}
        {closeU > 0.02 && (
          <g opacity={closeU}>
            <rect x={280} y={220} width={720} height={190} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
            <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={700}>
              The tape carries descriptions — never code.
            </text>
            <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              elements · text · promises · errors · streams
            </text>
            <text x={640} y={374} textAnchor="middle" fill={colors.WARM} fontSize={14.5}>
              Next: the gate that decides what may board.
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
