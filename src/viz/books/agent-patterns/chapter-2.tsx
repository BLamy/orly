// Map-Reduce: one worker per chunk
//
// Grounding: packages/agents-runtime/skills/designing-entities/references/
// patterns/map-reduce.md — split input into chunks, spawn one worker per
// chunk ALL AT ONCE (single spawn loop, no per-child await), track them in
// `children` {key, url, chunk}, ids `chunk-${i}-…-${spawnNum}` built from a
// monotonic spawnCounter (Date.now alone collides), status state machine
// idle → mapping → reducing → idle, results collected via Promise.all on
// later runFinished wakes. Worker count follows the INPUT (vs the fixed trio
// of manager-worker).
//
// Centerpiece: the document SHATTERS — sixteen text lines regroup into eight
// chunk cards; a burst of workers; results return OUT OF ORDER and sort
// themselves into a numbered grid before the reduce sweep merges them.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout + precomputed data
// ---------------------------------------------------------------------------

const PARENT = { x: 185, y: 290 } as const;

const PAGE = { x: 425, y: 288, w: 176, h: 256 } as const;
const rand = mulberry32(20260716);
const N_LINES = 16;
const N_CHUNKS = 8;
const LINE_W: number[] = Array.from({ length: N_LINES }, () => 96 + rand() * 62);

const CH_X = 630;
const CH_YS: number[] = Array.from({ length: N_CHUNKS }, (_, i) => 118 + i * 57);
const CH_W = 118;
const CH_H = 42;

/** line i: start position inside the page, end position inside chunk floor(i/2) */
function linePos(i: number, u: number): { x: number; y: number; w: number } {
  const sy = PAGE.y - PAGE.h / 2 + 16 + i * ((PAGE.h - 30) / (N_LINES - 1));
  const sx = PAGE.x - PAGE.w / 2 + 12;
  const c = Math.floor(i / 2);
  const ey = CH_YS[c] - 6 + (i % 2) * 12;
  const ex = CH_X - CH_W / 2 + 10;
  const ew = CH_W - 42;
  return {
    x: sx + (ex - sx) * u,
    y: sy + (ey - sy) * u - Math.sin(Math.PI * u) * 26,
    w: LINE_W[i] + (ew - LINE_W[i]) * u,
  };
}

const WK_X = 872;
const RS_X = 1108;
// arrival order — deliberately scrambled; rank[i] = when worker i's wake lands
const ARRIVAL: number[] = [4, 1, 6, 0, 7, 3, 5, 2];
const RANK: number[] = (() => {
  const r = new Array<number>(N_CHUNKS).fill(0);
  ARRIVAL.forEach((w, k) => (r[w] = k));
  return r;
})();

// status strip
const STATUS = ['idle', 'mapping', 'reducing'] as const;
const ST_X = [500, 640, 796];

// tape (consistent with chapter 1 — every pattern writes one)
const TAPE_Y = 556;
const TAPE_X0 = 168;

// camera marks
const CAM_SPLIT: CameraState = { x: 560, y: 330, k: 1.25 };
const CAM_GRID: CameraState = { x: 660, y: 345, k: 1.1 };

// ---------------------------------------------------------------------------
// Timeline (~62s, eight beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const parentLit = tl.channel('parentLit', 0);
  const docU = tl.channel('docU', 0); // the document enters
  const shatterU = tl.channel('shatterU', 0); // lines regroup into chunks
  const statusIdx = tl.channel('statusIdx', 0); // 0 idle · 1 mapping · 2 reducing
  const spawnU = tl.channel('spawnU', 0); // 8 workers bloom (staggered)
  const cntU = tl.channel('cntU', 0); // spawn counter 0→8
  const idChipU = tl.channel('idChipU', 0); // chunk-${i} id chip
  const rowsU = tl.channel('rowsU', 0); // 8 children rows stamp
  const wakeChipU = tl.channel('wakeChipU', 0);
  const arrU = tl.channel('arrU', 0); // out-of-order wake arrivals
  const reduceU = tl.channel('reduceU', 0); // grid compresses to one card
  const paChipU = tl.channel('paChipU', 0); // Promise.all chip
  const run2U = tl.channel('run2U', 0); // the four-chunk second run inset
  const idleCellU = tl.channel('idleCellU', 0); // status back to idle on tape
  const endU = tl.channel('endU', 0);

  // — beat 1 · the input owns the fan —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'The last machine had three named thinkers. This one gets a document and a question — and the right number of workers is written in the input, not in the code.',
  });
  tl.tween(parentLit, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(docU, 1, { at: 1.6, dur: 1.0, ease: ease.enter });
  tl.hold(7.1, 0.5);

  // — beat 2 · the shatter —
  tl.caption({
    at: 7.6,
    dur: 5.6,
    text: 'First, the split. The document shatters into eight chunks that can each be handled alone.',
  });
  tl.tween(cam, CAM_SPLIT, { at: 7.8, dur: 1.3, ease: ease.move });
  tl.tween(shatterU, 1, { at: 8.4, dur: 2.8, ease: ease.move });
  tl.hold(12.6, 0.6);

  // — beat 3 · map: a burst of spawns, a counter that only climbs —
  tl.caption({
    at: 13.2,
    dur: 7.4,
    text: 'The map step spawns one worker per chunk, all at once. Watch the counter: every child id carries a number that only counts up, so no two spawns can ever share a name.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 13.4, dur: 1.3, ease: ease.move });
  tl.tween(statusIdx, 1, { at: 13.8, dur: 0.4, ease: ease.move });
  tl.tween(spawnU, 1, { at: 14.4, dur: 2.6, ease: ease.linear });
  tl.tween(cntU, 1, { at: 14.4, dur: 2.6, ease: ease.linear });
  tl.tween(idChipU, 1, { at: 17.6, dur: 0.6, ease: ease.enter });
  tl.hold(20.0, 0.6);

  // — beat 4 · eight rows, then dark —
  tl.caption({
    at: 20.6,
    dur: 6.6,
    text: 'Eight spawns, eight rows on the tape, and the parent goes dark. The status it wrote says mapping — that one word is now the only live memory of the plan.',
  });
  tl.tween(rowsU, 1, { at: 21.0, dur: 2.2, ease: ease.linear });
  tl.tween(idChipU, 0, { at: 21.0, dur: 0.5, ease: ease.enter });
  tl.tween(wakeChipU, 1, { at: 23.4, dur: 0.6, ease: ease.enter });
  tl.tween(parentLit, 0.12, { at: 25.2, dur: 1.0, ease: ease.move });

  // — beat 5 · wakes land out of order —
  tl.caption({
    at: 27.8,
    dur: 7.0,
    text: 'Completions arrive as wakes, in whatever order the workers finish. Each result slots into place by its chunk index, so the order of arrival never matters.',
  });
  tl.tween(wakeChipU, 0, { at: 28.0, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_GRID, { at: 28.2, dur: 1.4, ease: ease.move });
  tl.tween(arrU, 1, { at: 28.8, dur: 5.4, ease: ease.linear });

  // — beat 6 · reduce —
  tl.caption({
    at: 35.4,
    dur: 6.2,
    text: "When the last wake lands, the status flips to reducing: collect every child's output in parallel and merge them into one result.",
  });
  tl.tween(statusIdx, 2, { at: 35.8, dur: 0.4, ease: ease.move });
  tl.tween(parentLit, 1, { at: 35.8, dur: 0.5, ease: ease.enter });
  tl.tween(paChipU, 1, { at: 36.4, dur: 0.6, ease: ease.enter });
  tl.tween(reduceU, 1, { at: 37.4, dur: 1.8, ease: ease.move });
  tl.hold(41.0, 0.6);

  // — beat 7 · the second run: same code, four chunks —
  tl.caption({
    at: 41.6,
    dur: 7.0,
    text: "Run it again with a four chunk input and the same code fans four ways — and the counter keeps climbing, so round two can't collide with round one.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.8, dur: 1.4, ease: ease.move });
  tl.tween(paChipU, 0, { at: 41.8, dur: 0.5, ease: ease.enter });
  tl.tween(run2U, 1, { at: 42.8, dur: 3.2, ease: ease.linear });

  // — beat 8 · name the shape —
  tl.caption({
    at: 49.4,
    dur: 6.8,
    text: "A worker count set by the data, a parallel map, a single reduce. When the chunks vary and the roles don't exist — that's map-reduce.",
  });
  tl.set(statusIdx, 0, 49.8);
  tl.tween(idleCellU, 1, { at: 50.2, dur: 0.5, ease: ease.pop });
  tl.tween(endU, 1, { at: 50.8, dur: 1.4, ease: ease.move });
  tl.hold(56.2, 1.8);

  return {
    tl,
    cam,
    parentLit,
    docU,
    shatterU,
    statusIdx,
    spawnU,
    cntU,
    idChipU,
    rowsU,
    wakeChipU,
    arrU,
    reduceU,
    paChipU,
    run2U,
    idleCellU,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, u }: { x: number; y: number; text: string; color: string; u: number }) {
  if (u <= 0.01) return null;
  const w = text.length * 7.4 + 24;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={y - 15} width={w} height={28} rx={8} fill={colors.BG} stroke={color} strokeOpacity={0.7} />
      <text x={x} y={y + 5} textAnchor="middle" fill={color} fontSize={12.5} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const parentLit = s.get(scene.parentLit);
  const docU = s.get(scene.docU);
  const shatterU = s.get(scene.shatterU);
  const statusIdx = s.get(scene.statusIdx);
  const spawnU = s.get(scene.spawnU);
  const cntU = s.get(scene.cntU);
  const idChipU = s.get(scene.idChipU);
  const rowsU = s.get(scene.rowsU);
  const wakeChipU = s.get(scene.wakeChipU);
  const arrU = s.get(scene.arrU);
  const reduceU = s.get(scene.reduceU);
  const paChipU = s.get(scene.paChipU);
  const run2U = s.get(scene.run2U);
  const idleCellU = s.get(scene.idleCellU);
  const endU = s.get(scene.endU);

  // per-worker arrival progress + the parent's wake pulses
  const arr = (i: number): number => win(arrU, N_CHUNKS, RANK[i], 1.6);
  let pulse = 0;
  for (let i = 0; i < N_CHUNKS; i++) {
    const u = arr(i);
    if (u > 0 && u < 1) pulse = Math.max(pulse, Math.sin(Math.PI * u) * 0.9);
  }
  const lit = Math.max(parentLit, pulse);

  const shown = Math.round(cntU * N_CHUNKS) + Math.round(clamp01(run2U * 1.15) * 4);
  const dim = 1 - 0.85 * endU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- status strip + counter ---------------- */}
        <g opacity={0.4 + 0.6 * dim}>
          {STATUS.map((st, i) => {
            const active = Math.abs(statusIdx - i) < 0.5;
            return (
              <g key={st}>
                <rect
                  x={ST_X[i] - 56}
                  y={44}
                  width={112}
                  height={30}
                  rx={9}
                  fill={active ? colors.PANEL : 'none'}
                  stroke={active ? colors.WARM : colors.GRID}
                  strokeWidth={active ? 1.8 : 1}
                />
                <text
                  x={ST_X[i]}
                  y={64}
                  textAnchor="middle"
                  fill={active ? colors.WARM : colors.MUTED}
                  fontSize={13.5}
                  fontFamily={MONO}
                >
                  {st}
                </text>
                {i < 2 && <text x={(ST_X[i] + ST_X[i + 1]) / 2} y={64} textAnchor="middle" fill={colors.GRID} fontSize={13}>→</text>}
              </g>
            );
          })}
          <text x={1210} y={64} textAnchor="end" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
            spawnCounter: <tspan fill={colors.WARM} fontWeight={700}>{shown}</tspan>
          </text>
          <text x={340} y={64} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            status
          </text>
        </g>

        {/* ---------------- parent ---------------- */}
        <g>
          {lit > 0.2 && (
            <rect x={PARENT.x - 95} y={PARENT.y - 47} width={190} height={94} rx={20} fill={colors.SECONDARY} opacity={0.16 * lit} />
          )}
          <rect
            x={PARENT.x - 88}
            y={PARENT.y - 40}
            width={176}
            height={80}
            rx={14}
            fill={colors.PANEL}
            stroke={colors.SECONDARY}
            strokeWidth={1.8}
            strokeOpacity={0.25 + 0.75 * lit}
          />
          <circle cx={PARENT.x - 70} cy={PARENT.y - 24} r={4.5} fill={colors.SECONDARY} opacity={0.25 + 0.75 * lit} />
          <text x={PARENT.x} y={PARENT.y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={600} opacity={0.45 + 0.55 * lit}>
            orchestrator
          </text>
          <text x={PARENT.x} y={PARENT.y + 19} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            map-reduce
          </text>
        </g>

        {/* ---------------- document → chunks ---------------- */}
        {docU > 0.01 && (
          <g opacity={docU * dim}>
            <rect
              x={PAGE.x - PAGE.w / 2}
              y={PAGE.y - PAGE.h / 2}
              width={PAGE.w}
              height={PAGE.h}
              rx={10}
              fill={colors.PANEL}
              stroke={colors.GRID}
              opacity={1 - shatterU}
            />
            <text
              x={PAGE.x}
              y={PAGE.y - PAGE.h / 2 - 12}
              textAnchor="middle"
              fill={colors.MUTED}
              fontSize={12}
              opacity={1 - shatterU}
            >
              the input document
            </text>
            {/* chunk cards fade in under their arriving lines */}
            {CH_YS.map((cy, c) => {
              const u = clamp01(win(shatterU, N_LINES, c * 2 + 1, 3));
              if (u <= 0) return null;
              return (
                <g key={c} opacity={u * (1 - 0.6 * reduceU)}>
                  <rect x={CH_X - CH_W / 2} y={cy - CH_H / 2} width={CH_W} height={CH_H} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} strokeOpacity={0.5} />
                  <text x={CH_X + CH_W / 2 - 8} y={cy + 4} textAnchor="end" fill={colors.ACCENT} fontSize={10.5} fontFamily={MONO}>
                    {c}
                  </text>
                </g>
              );
            })}
            {/* the sixteen lines */}
            {LINE_W.map((_, i) => {
              const u = win(shatterU, N_LINES, i, 3.2);
              const p = linePos(i, u);
              return <rect key={i} x={p.x} y={p.y} width={p.w} height={3.5} rx={1.5} fill={colors.MUTED} opacity={0.75} />;
            })}
          </g>
        )}

        {/* ---------------- workers ---------------- */}
        {CH_YS.map((cy, i) => {
          const u = win(spawnU, N_CHUNKS, i, 1.8);
          if (u <= 0) return null;
          const a = arr(i);
          const working = spawnU > 0.9 && a < 0.15;
          return (
            <g key={i} opacity={u * dim}>
              <line x1={CH_X + CH_W / 2} y1={cy} x2={WK_X - 62} y2={cy} stroke={colors.GRID} strokeWidth={1.2} />
              <rect
                x={WK_X - 60}
                y={cy - 20}
                width={120}
                height={40}
                rx={9}
                fill={colors.PANEL}
                stroke={colors.ACCENT}
                strokeOpacity={working ? 0.9 : 0.35}
              />
              <text x={WK_X} y={cy - 2} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} opacity={working ? 1 : 0.6}>
                worker
              </text>
              <text x={WK_X} y={cy + 12} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                chunk-{i}
              </text>
            </g>
          );
        })}

        {/* ---------------- results: out of order into a numbered grid ------- */}
        {CH_YS.map((cy, i) => {
          const a = arr(i);
          if (a <= 0) return null;
          const fly = clamp01(a * 1.25);
          // fly from the worker's right edge to slot i, then merge downward
          const x = WK_X + 66 + (RS_X - 55 - (WK_X + 66)) * fly;
          const y = cy - 16 + (288 - (cy - 16)) * reduceU;
          return (
            <g key={i} opacity={(0.4 + 0.6 * fly) * (1 - 0.55 * reduceU) * dim}>
              <rect x={x} y={y} width={110} height={32} rx={7} fill={colors.PANEL} stroke={colors.POSITIVE} strokeOpacity={0.6} />
              <text x={x + 55} y={y + 20} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>
                result[{i}]
              </text>
            </g>
          );
        })}
        {/* the merged summary */}
        {reduceU > 0.01 && (
          <g opacity={reduceU}>
            <rect x={RS_X - 62} y={272} width={150} height={96} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
            <text x={RS_X + 13} y={310} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={600}>
              one result
            </text>
            <text x={RS_X + 13} y={332} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              eight chunks, merged
            </text>
          </g>
        )}

        {/* ---------------- second run inset ---------------- */}
        {run2U > 0.01 && (
          <g opacity={clamp01(run2U * 3) * dim}>
            <rect x={350} y={150} width={286} height={200} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.4} />
            <text x={493} y={176} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
              second run — four chunks
            </text>
            {[0, 1, 2, 3].map((i) => {
              const u = win(clamp01(run2U * 1.15), 4, i, 1.6);
              if (u <= 0) return null;
              const y = 200 + i * 34;
              return (
                <g key={i} opacity={u}>
                  <rect x={378} y={y} width={70} height={24} rx={6} fill={colors.PANEL} stroke={colors.ACCENT} strokeOpacity={0.5} />
                  <line x1={452} y1={y + 12} x2={508} y2={y + 12} stroke={colors.GRID} strokeWidth={1.2} />
                  <rect x={510} y={y} width={70} height={24} rx={6} fill={colors.PANEL} stroke={colors.ACCENT} strokeOpacity={0.9} />
                  <text x={545} y={y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                    chunk-{i}
                  </text>
                </g>
              );
            })}
            <text x={493} y={336} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>
              ids 9…12 — no collision with round one
            </text>
          </g>
        )}

        {/* ---------------- chips ---------------- */}
        <Chip x={640} y={108} text={'id: chunk-${i}-…-${spawnNum}'} color={colors.ACCENT} u={idChipU} />
        <Chip x={640} y={TAPE_Y - 46} text={'wake: { on: "runFinished", includeResponse: true }'} color={colors.SECONDARY} u={wakeChipU} />
        <Chip x={940} y={110} text={'Promise.all(children)'} color={colors.POSITIVE} u={paChipU} />

        {/* ---------------- the stream tape ---------------- */}
        <g opacity={rowsU > 0.01 || statusIdx > 0.5 ? 1 : 0}>
          <text x={TAPE_X0} y={TAPE_Y - 12} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            the orchestrator&apos;s stream — append only
          </text>
          <line x1={TAPE_X0} y1={TAPE_Y + 46} x2={1130} y2={TAPE_Y + 46} stroke={colors.GRID} strokeWidth={2} />
          {/* status_update: mapping */}
          {statusIdx > 0.9 && (
            <g>
              <rect x={TAPE_X0} y={TAPE_Y} width={124} height={38} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.6} />
              <text x={TAPE_X0 + 62} y={TAPE_Y + 16} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily={MONO}>
                status_update
              </text>
              <text x={TAPE_X0 + 62} y={TAPE_Y + 30} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily={MONO}>
                mapping
              </text>
            </g>
          )}
          {/* eight children_insert cells */}
          {CH_YS.map((_, i) => {
            const u = win(rowsU, N_CHUNKS, i, 1.4);
            if (u <= 0) return null;
            const x = TAPE_X0 + 132 + i * 62;
            return (
              <g key={i} opacity={u} transform={`translate(0 ${6 * (1 - u)})`}>
                <rect x={x} y={TAPE_Y} width={56} height={38} rx={7} fill={colors.PANEL} stroke={colors.ACCENT} strokeOpacity={0.55} />
                <text x={x + 28} y={TAPE_Y + 16} textAnchor="middle" fill={colors.TEXT} fontSize={9} fontFamily={MONO}>
                  insert
                </text>
                <text x={x + 28} y={TAPE_Y + 30} textAnchor="middle" fill={colors.ACCENT} fontSize={9.5} fontFamily={MONO}>
                  ch {i}
                </text>
              </g>
            );
          })}
          {/* status_update: reducing */}
          {statusIdx > 1.9 && (
            <g>
              <rect x={TAPE_X0 + 636} y={TAPE_Y} width={124} height={38} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.6} />
              <text x={TAPE_X0 + 698} y={TAPE_Y + 16} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily={MONO}>
                status_update
              </text>
              <text x={TAPE_X0 + 698} y={TAPE_Y + 30} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily={MONO}>
                reducing
              </text>
            </g>
          )}
          {/* status_update: idle (closing) */}
          {idleCellU > 0.01 && (
            <g opacity={idleCellU}>
              <rect x={TAPE_X0 + 768} y={TAPE_Y} width={124} height={38} rx={7} fill={colors.PANEL} stroke={colors.POSITIVE} strokeOpacity={0.6} />
              <text x={TAPE_X0 + 830} y={TAPE_Y + 16} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily={MONO}>
                status_update
              </text>
              <text x={TAPE_X0 + 830} y={TAPE_Y + 30} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily={MONO}>
                idle
              </text>
            </g>
          )}
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
