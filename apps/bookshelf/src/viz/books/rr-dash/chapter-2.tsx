// The Shape of a Recording
//
// Backed by: lib/ds.ts (stream layout: recordings/index latest-per-id with
// deleted tombstones; rec/<id>/{sources,hits,points,events,linetrace,stacks};
// linetrace/stacks CHUNKS ≤1000, readers flatten), lib/ingest.mjs
// (idempotency: replaceStream = delete + recreate rec/<id>/* on re-ingest;
// index append-only, readers take the LAST entry per id), lib/types.ts
// (RecordingMeta.deleted tombstone), and the real fixture bundle
// fixtures/sample-bundle (cachesim: hits 128 / 87 / 41 / 83 / 1 per line;
// points { sourceId: src-lru, line 41, event 5120, ticks 481937 }).
//
// TWO machines sharing a stage: the index fold (entries append down a log,
// a fold beam collapses latest-per-id, a tombstone hides a recording, and a
// re-upload flashes delete→recreate over the rec streams) and the
// centerpiece — a MatrixGrid heatmap of the fixture's real per-line hit
// counts, with a point chip pinning line 41 to event 5120.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MatrixGrid } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const LOG = { x: 70, y: 120, w: 350 };
const FOLD = { x: 70, y: 396 };
const REC = { x: 70, y: 490, w: 350 };
const GRID_POS = { x: 560, y: 150 };
const CHUNKS = { x: 560, y: 470, w: 620 };

const CAM_LOG: CameraState = { x: 300, y: 330, k: 1.3 };
const CAM_GRID: CameraState = { x: 810, y: 320, k: 1.22 };
const CAM_CHUNK: CameraState = { x: 860, y: 430, k: 1.24 };
const CAM_WIDE: CameraState = { x: 640, y: 352, k: 1.0 };

/* ------------------------------------------------------------------ data */
/** recordings/index entries, in append order (lib/ingest.mjs semantics). */
const ENTRIES = [
  { id: 'sample-cachesim-01', note: 'uploaded', tomb: false, shadowed: true },
  { id: 'trace-demo-0712', note: 'uploaded', tomb: false, shadowed: false },
  { id: 'sample-cachesim-01', note: 're-uploaded', tomb: false, shadowed: false },
  { id: 'trace-demo-0712', note: 'deleted: true', tomb: true, shadowed: false },
];

/** Real per-line hit counts from fixtures/sample-bundle/hits.json (src-main
 * left column, src-lru right), lines 28–44 of the fixture sources. */
const HIT_ROWS: { line: number; main: number; lru: number }[] = [
  { line: 28, main: 1, lru: 87 },
  { line: 29, main: 1, lru: 87 },
  { line: 30, main: 0, lru: 83 },
  { line: 31, main: 1, lru: 0 },
  { line: 32, main: 0, lru: 87 },
  { line: 33, main: 0, lru: 87 },
  { line: 34, main: 128, lru: 0 },
  { line: 35, main: 128, lru: 0 },
  { line: 36, main: 41, lru: 128 },
  { line: 37, main: 0, lru: 128 },
  { line: 38, main: 87, lru: 0 },
  { line: 39, main: 87, lru: 0 },
  { line: 41, main: 0, lru: 83 },
];
const MAX_HITS = 128;
/** log-scaled like the real gutter chips (SourceViewer HitChipMarker). */
const norm = (h: number) => (h <= 0 ? 0 : Math.log(h + 1) / Math.log(MAX_HITS + 1));
const GRID_VALUES = HIT_ROWS.map((r) => [norm(r.main), norm(r.lru)]);
const GRID_RAW = HIT_ROWS.map((r) => [r.main, r.lru]);
const ROW_LABELS = HIT_ROWS.map((r) => `L${r.line}`);
const CELL = 30;

const REC_STREAMS = ['sources', 'hits', 'points', 'events', 'linetrace', 'stacks'];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const logU = tl.channel('logU', 0); // 0..4 entries appended
  const foldU = tl.channel('foldU', 0); // fold beam sweeps + result card
  const tombU = tl.channel('tombU', 0);
  const recU = tl.channel('recU', 0); // rec/<id>/* rows enter
  const wipeU = tl.channel('wipeU', 0); // delete→recreate flash
  const gridP = tl.channel('gridP', 0); // heat cells landing
  const hotU = tl.channel('hotU', 0); // highlight the 128 loop
  const pointU = tl.channel('pointU', 0); // event/ticks chip
  const chunkU = tl.channel('chunkU', 0); // chunk cards enter
  const flattenU = tl.channel('flattenU', 0); // chunks flatten to one tape
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  /* — beat 1 · setup — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'One recording, seven streams. This chapter is about their shape — because the shape is what makes the whole dashboard cheap to build.',
  });
  tl.tween(cam, CAM_LOG, { at: t - 4.6, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 2 · the index is append-only — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Start with the index. It is append only: every upload appends one metadata entry, and nobody ever edits an old one.',
  });
  tl.tween(logU, 3, { at: t - 5.0, dur: 3.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 3 · the fold — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Readers fold it: for each recording id, the latest entry wins. Upload the same recording twice and the fresh entry simply shadows the stale one.',
  });
  tl.tween(foldU, 1, { at: t - 4.8, dur: 1.8, ease: ease.draw });
  t = tl.hold(t, 0.5);

  /* — beat 4 · tombstones — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Deletion is the same trick. A tombstone — an entry whose deleted flag is true — is appended, and the fold hides that recording. Nothing is ever destroyed.',
  });
  tl.tween(logU, 4, { at: t - 5.2, dur: 0.8, ease: ease.move });
  tl.tween(tombU, 1, { at: t - 3.8, dur: 1.0, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 5 · idempotency for the data — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'For the recording data itself, idempotency is blunter: on re-upload, each per recording stream is deleted and recreated from scratch, then the fresh index entry lands.',
  });
  tl.tween(recU, 1, { at: t - 5.4, dur: 1.0, ease: ease.enter });
  tl.tween(wipeU, 1, { at: t - 3.6, dur: 2.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 6 · the hits stream — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Now the payload. The hits stream answers one question per message: this source line ran this many times.',
  });
  tl.tween(cam, CAM_GRID, { at: t - 5.0, dur: 1.6, ease: ease.move });
  tl.tween(gridP, 1, { at: t - 3.6, dur: 3.4, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 7 · real numbers — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'These are real counts from a recorded cache simulator: the main loop ran a hundred and twenty eight times, one branch forty one times, the other eighty seven. Ground truth, taken from the execution itself.',
  });
  tl.tween(hotU, 1, { at: t - 5.2, dur: 0.8, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 8 · points — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The points stream pins each line to its first execution: a global event number and a tick count. That pair is an address in time — hold on to it, chapter four spends it.',
  });
  tl.tween(pointU, 1, { at: t - 4.8, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 9 · chunks flatten — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The line trace and the sampled stacks are too long for single messages, so they ship as chunks of up to a thousand entries. Reading them back is just flattening.',
  });
  tl.tween(cam, CAM_CHUNK, { at: t - 5.4, dur: 1.4, ease: ease.move });
  tl.tween(chunkU, 1, { at: t - 4.6, dur: 1.2, ease: ease.enter });
  tl.tween(flattenU, 1, { at: t - 2.8, dur: 2.0, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 10 · close — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Append only logs, a last-writer-wins fold, and a handful of streams per recording. That is the entire storage engine — and it is enough to stream a trace in live, which is next.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.6, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: t - 5.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.0, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.2);

  return { tl, cam, logU, foldU, tombU, recU, wipeU, gridP, hotU, pointU, chunkU, flattenU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The recordings/index log — appended entries + the fold result. */
function IndexLog({ logU, foldU, tombU, dim }: { logU: number; foldU: number; tombU: number; dim: number }) {
  const n = clamp01(logU / ENTRIES.length) * ENTRIES.length;
  if (n <= 0) return null;
  const f = clamp01(foldU);
  const tb = clamp01(tombU);
  return (
    <g opacity={1 - 0.85 * dim}>
      <text x={LOG.x} y={LOG.y - 14} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        recordings/index · append-only
      </text>
      {ENTRIES.map((e, i) => {
        const eu = clamp01(n - i);
        if (eu <= 0) return null;
        const shadow = e.shadowed ? f : 0; // fold dims the stale entry
        const tombed = e.tomb ? tb : 0;
        const y = LOG.y + i * 58;
        return (
          <g key={i} transform={`translate(${LOG.x}, ${y + (1 - eu) * 10})`} opacity={eu * (1 - 0.6 * shadow)}>
            <rect
              width={LOG.w}
              height={46}
              rx={9}
              fill={colors.PANEL}
              stroke={e.tomb ? colors.NEGATIVE : colors.GRID}
              strokeWidth={1.4}
            />
            <text x={14} y={20} fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>
              {e.id}
            </text>
            <text x={14} y={37} fill={e.tomb ? colors.NEGATIVE : colors.MUTED} fontSize={11} fontFamily={mono}>
              {e.note}
            </text>
            {shadow > 0.3 && (
              <line x1={10} y1={23} x2={LOG.w - 10} y2={23} stroke={colors.MUTED} strokeWidth={1.6} opacity={shadow} />
            )}
            {tombed > 0.3 && (
              <text x={LOG.w - 14} y={29} textAnchor="end" fill={colors.NEGATIVE} fontSize={11} fontFamily={mono} opacity={tombed}>
                ⌫ hidden by fold
              </text>
            )}
          </g>
        );
      })}
      {/* the fold result card */}
      {f > 0 && (
        <g transform={`translate(${FOLD.x}, ${FOLD.y + (1 - f) * 10})`} opacity={f}>
          <path
            d={`M ${LOG.w / 2} -18 l 0 10 m -6 -6 l 6 6 l 6 -6`}
            stroke={colors.WARM}
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
          />
          <rect width={LOG.w} height={40} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
          <text x={14} y={25} fill={colors.WARM} fontSize={12} fontFamily={mono}>
            fold: latest per id wins
          </text>
        </g>
      )}
    </g>
  );
}

/** rec/<id>/* rows with the delete→recreate wipe. */
function RecStreams({ u, wipe, dim }: { u: number; wipe: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const wp = clamp01(wipe);
  return (
    <g transform={`translate(${REC.x}, ${REC.y})`} opacity={e * (1 - 0.85 * dim)}>
      <text y={-10} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        rec/sample-cachesim-01/* · delete + recreate
      </text>
      {REC_STREAMS.map((name, i) => {
        // each row wipes (shrinks to zero) then refills, staggered
        const w = clamp01(wp * 8 - i);
        const width = w < 0.5 ? 1 - w * 2 : (w - 0.5) * 2;
        return (
          <g key={name} transform={`translate(${i * 58}, 0)`}>
            <rect width={52} height={30} rx={6} fill={colors.BG} stroke={colors.GRID} strokeWidth={1} />
            <rect x={3} y={3} width={46 * (wp > 0 ? width : 1)} height={24} rx={4} fill={colors.ACCENT} opacity={0.35} />
            <text x={26} y={48} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={mono}>
              {name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The point chip: fixture line 41's first execution address. */
function PointChip({ u }: { u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  // line 41 is the last row, lru column (col 1)
  const row = HIT_ROWS.length - 1;
  const cx = GRID_POS.x + 44 + 1 * (CELL + 3) + CELL / 2;
  const cy = GRID_POS.y + row * (CELL + 3) + CELL / 2;
  return (
    <g opacity={e}>
      <circle cx={cx} cy={cy} r={CELL * 0.75} fill="none" stroke={colors.WARM} strokeWidth={1.8} opacity={0.9} />
      <line x1={cx + CELL * 0.75} y1={cy} x2={cx + 74} y2={cy} stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="3 3" />
      <g transform={`translate(${cx + 78}, ${cy - 26 + (1 - e) * 8})`}>
        <rect width={230} height={52} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
        <text x={12} y={21} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
          rec/…/points · line 41
        </text>
        <text x={12} y={40} fill={colors.WARM} fontSize={12.5} fontFamily={mono}>
          event 5120 · ticks 481991
        </text>
      </g>
    </g>
  );
}

/** linetrace chunks flattening into one tape. */
function ChunkRibbon({ u, flatten, dim }: { u: number; flatten: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const f = ease.move(clamp01(flatten));
  const n = 5;
  const cw = 96;
  return (
    <g transform={`translate(${CHUNKS.x}, ${CHUNKS.y})`} opacity={e * (1 - 0.85 * dim)}>
      <text y={-14} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        rec/…/linetrace · chunks of ≤1000 → flat()
      </text>
      {Array.from({ length: n }, (_, i) => {
        const cu = clamp01(e * (n + 1) - i);
        // scattered card → its slot on one continuous tape
        const x0 = i * (cw + 18);
        const y0 = (i % 2 === 0 ? 0 : 26) + 8;
        const x1 = i * (cw + 2);
        const y1 = 44;
        const x = x0 + (x1 - x0) * f;
        const y = y0 + (y1 - y0) * f;
        return (
          <g key={i} transform={`translate(${x}, ${y})`} opacity={cu}>
            <rect width={cw} height={22} rx={f > 0.9 ? 2 : 6} fill={colors.ACCENT} opacity={0.3} />
            <rect width={cw} height={22} rx={f > 0.9 ? 2 : 6} fill="none" stroke={colors.ACCENT} strokeWidth={1.3} />
            <text x={cw / 2} y={15} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily={mono}>
              {i < n - 1 ? '1000 entries' : '…'}
            </text>
          </g>
        );
      })}
      {f > 0.9 && (
        <text x={(n * (cw + 2)) / 2} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={mono} opacity={(f - 0.9) * 10}>
          one seq-ordered linetrace · readers flatten
        </text>
      )}
    </g>
  );
}

/** Closing card. */
function CloseCard({ u }: { u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g transform={`translate(640, ${310 + (1 - e) * 10})`} opacity={e}>
      <rect x={-340} y={-56} width={680} height={112} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text y={-12} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
        the whole storage engine
      </text>
      <text y={24} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={mono}>
        append-only index · latest-per-id fold · tombstones · chunked streams
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const gp = s.get(scene.gridP);
  const total = HIT_ROWS.length * 2;
  const hot = clamp01(s.get(scene.hotU));
  return (
    <Camera {...s.get(scene.cam)}>
      <IndexLog logU={s.get(scene.logU)} foldU={s.get(scene.foldU)} tombU={s.get(scene.tombU)} dim={dim} />
      <RecStreams u={s.get(scene.recU)} wipe={s.get(scene.wipeU)} dim={dim} />
      {gp > 0 && (
        <g opacity={1 - 0.85 * dim}>
          <text x={GRID_POS.x} y={GRID_POS.y - 18} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
            rec/…/hits · {'{ sourceId, line, hits }'}
          </text>
          <MatrixGrid
            x={GRID_POS.x + 44}
            y={GRID_POS.y}
            values={GRID_VALUES}
            cell={CELL}
            gap={3}
            cellU={(i, j) => clamp01(gp * (total + 2) - (i * 2 + j))}
            rowLabels={ROW_LABELS}
            colLabels={['main.rs', 'lru.rs']}
            showValues={false}
            highlight={hot > 0 ? { cell: [6, 0], color: colors.WARM, u: hot } : undefined}
          />
          {/* raw hit counts over the cells, entering with the heat */}
          {HIT_ROWS.map((r, i) =>
            [r.main, r.lru].map((h, j) => {
              const cu = clamp01(gp * (total + 2) - (i * 2 + j));
              if (h <= 0 || cu <= 0) return null;
              return (
                <text
                  key={`${i}-${j}`}
                  x={GRID_POS.x + 44 + j * (CELL + 3) + CELL / 2}
                  y={GRID_POS.y + i * (CELL + 3) + CELL / 2 + 4}
                  textAnchor="middle"
                  fill={norm(h) > 0.75 ? colors.BG : colors.TEXT}
                  fontSize={10.5}
                  fontFamily={mono}
                  opacity={cu}
                >
                  {GRID_RAW[i][j]}
                </text>
              );
            })
          )}
        </g>
      )}
      <PointChip u={s.get(scene.pointU) * (1 - 0.9 * dim)} />
      <ChunkRibbon u={s.get(scene.chunkU)} flatten={s.get(scene.flattenU)} dim={dim} />
      <CloseCard u={s.get(scene.closeU)} />
    </Camera>
  );
}
export const vizScene = () => scene;
