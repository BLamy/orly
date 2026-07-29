// The Re-Read Tax
//
// Grounding: README.md quickstart — `client.messages.create({ messages })`
// ships the FULL conversation on every call (the Messages interface is
// stateless); src/resources/messages/messages.ts `Usage.input_tokens` — every
// one of those tokens is billed input, every turn.
//
// Centerpiece: the transcript as a TAPE of tokens with a READ HEAD that must
// sweep the whole tape from cell zero on every request, an input-tokens
// odometer, and a per-turn staircase whose area is the (quadratic) bill.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { TokenStream } from '../../agent';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The tape. 6 turns: system = 8 cells, each user msg = 4, each reply = 5.
// One cell ≈ 250 tokens, so the six prompts are 3k, 5.25k, 7.5k … tokens.
// ---------------------------------------------------------------------------

const SYS_CELLS = 8;
const USER_CELLS = 4;
const ASST_CELLS = 5;
const TURNS = 6;
const TOKENS_PER_CELL = 250;

interface Cell {
  role: 'system' | 'user' | 'assistant';
  turn: number; // 0 = system prompt
}

const CELLS: Cell[] = (() => {
  const out: Cell[] = [];
  for (let i = 0; i < SYS_CELLS; i++) out.push({ role: 'system', turn: 0 });
  for (let t = 1; t <= TURNS; t++) {
    for (let i = 0; i < USER_CELLS; i++) out.push({ role: 'user', turn: t });
    for (let i = 0; i < ASST_CELLS; i++) out.push({ role: 'assistant', turn: t });
  }
  return out;
})();

/** prompt size (cells) at turn n — everything BEFORE reply n streams back */
const promptCells = (n: number): number => SYS_CELLS + n * USER_CELLS + (n - 1) * ASST_CELLS;
/** tape size (cells) after reply n lands */
const tapeAfter = (n: number): number => SYS_CELLS + n * (USER_CELLS + ASST_CELLS);

const PROMPTS = Array.from({ length: TURNS }, (_, i) => promptCells(i + 1)); // 12,21,30,39,48,57
// cumulative billed cells after each turn's sweep: 12, 33, 63, 102, 150, 207
const CUM = PROMPTS.reduce<number[]>((acc, p) => [...acc, (acc[acc.length - 1] ?? 0) + p], []);

const CELL_W = 15;
const CELL_PITCH = 16.5;
const CELL_H = 26;
const TAPE_X = 118;
const TAPE_Y = 262;
const cellX = (i: number): number => TAPE_X + i * CELL_PITCH;

const ROLE_FILL: Record<Cell['role'], string> = {
  system: colors.SECONDARY,
  user: colors.ACCENT,
  assistant: colors.POSITIVE,
};

// the montage covers turns 3..6; one unit of montageU = one full turn
const MONTAGE_TURNS = 4;
/** cells visible at montage phase p ∈ [0, 4]: appends happen inside each phase */
function montageCells(p: number): number {
  let n = tapeAfter(2); // 26 — where the montage picks up
  for (let k = 0; k < MONTAGE_TURNS; k++) {
    const f = clamp01(p - k);
    if (f <= 0) break;
    n += Math.round(USER_CELLS * clamp01(f / 0.12));
    n += Math.round(ASST_CELLS * clamp01((f - 0.86) / 0.12));
  }
  return n;
}
/** read-head cell position + activity during montage phase p */
function montageHead(p: number): { x: number; on: number } {
  const k = Math.min(MONTAGE_TURNS - 1, Math.floor(p));
  const f = p - k;
  const sweep = clamp01((f - 0.14) / 0.66); // sweep window inside the phase
  const on = f > 0.14 && f < 0.84 ? 1 : 0;
  return { x: promptCells(3 + k) * sweep, on };
}
/** billed cells as a pure function of the three sweep drivers */
function billedCells(s1: number, s2: number, p: number): number {
  let b = PROMPTS[0] * s1 + PROMPTS[1] * s2;
  for (let k = 0; k < MONTAGE_TURNS; k++) {
    const f = clamp01(p - k);
    b += PROMPTS[2 + k] * clamp01((f - 0.14) / 0.66);
  }
  return b;
}

// the staircase chart
const CHART = { x: 700, y: 356, w: 420, h: 224 } as const;
const BAR_MAX = PROMPTS[TURNS - 1];

// camera marks
const CAM_TAPE: CameraState = { x: 470, y: 300, k: 1.28 };
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_CHART: CameraState = { x: 800, y: 400, k: 1.25 };

// ---------------------------------------------------------------------------
// Timeline (~74s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TAPE, cameraInterp);

  const cardU = tl.channel('cardU', 0); // the create-request chip
  const cellsN = tl.channel('cellsN', 0); // visible cells, turns 1–2
  const sweep1 = tl.channel('sweep1', 0); // turn-1 head sweep 0..1
  const sweep2 = tl.channel('sweep2', 0); // turn-2 head sweep 0..1
  const stream1 = tl.channel('stream1', 0); // reply-1 token stream
  const stream2 = tl.channel('stream2', 0); // reply-2 token stream
  const montageU = tl.channel('montageU', 0); // turns 3..6, one unit each
  const odoU = tl.channel('odoU', 0); // odometer visibility
  const sysU = tl.channel('sysU', 0); // system-prefix spotlight
  const chartU = tl.channel('chartU', 0); // staircase panel
  const barsU = tl.channel('barsU', 0); // bars staggered draw
  const areaU = tl.channel('areaU', 0); // area fill under the staircase
  const dimU = tl.channel('dimU', 0); // machine fades for the close
  const closeU = tl.channel('closeU', 0); // closing card
  const teaseU = tl.channel('teaseU', 0); // the shelf glyph tease

  // — beat 1 · the stateless secret —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Here is an expensive secret about talking to a language model: the conversation you are having does not live on the server. It lives inside your next request.',
  });
  tl.tween(cardU, 1, { at: 0.7, dur: 0.7, ease: ease.enter });
  tl.tween(cellsN, SYS_CELLS, { at: 2.6, dur: 1.0, ease: ease.move });
  tl.hold(6.7, 0.5);

  // — beat 2 · the whole transcript ships —
  tl.caption({
    at: 7.2,
    dur: 6.4,
    text: 'Every call ships the entire transcript — the system prompt and every message so far — and the model reads all of it, token by token, before it says anything new.',
  });
  tl.tween(cellsN, promptCells(1), { at: 7.8, dur: 0.8, ease: ease.move });
  tl.tween(odoU, 1, { at: 10.4, dur: 0.6, ease: ease.enter });

  // — beat 3 · turn one: sweep, then the reply streams back —
  tl.caption({
    at: 14.2,
    dur: 6.2,
    text: 'Watch turn one. The transcript flattens into a tape of tokens, a read head sweeps the whole tape, and only then does the reply stream back.',
  });
  tl.tween(sweep1, 1, { at: 14.8, dur: 2.6, ease: ease.linear });
  tl.tween(stream1, 1, { at: 17.8, dur: 1.8, ease: ease.linear });
  tl.tween(cellsN, tapeAfter(1), { at: 19.0, dur: 0.6, ease: ease.enter });
  tl.hold(20.4, 0.4);

  // — beat 4 · turn two re-reads everything —
  tl.caption({
    at: 21.0,
    dur: 6.4,
    text: 'Turn two appends your new message — and then re-reads everything. The tokens it read a moment ago go back through the model again, at full price.',
  });
  tl.tween(cellsN, promptCells(2), { at: 21.4, dur: 0.6, ease: ease.enter });
  tl.tween(sweep2, 1, { at: 22.4, dur: 3.0, ease: ease.linear });
  tl.tween(stream2, 1, { at: 25.8, dur: 1.6, ease: ease.linear });
  tl.tween(cellsN, tapeAfter(2), { at: 26.8, dur: 0.6, ease: ease.enter });

  // — beat 5 · stateless by design —
  tl.caption({
    at: 28.2,
    dur: 5.4,
    text: 'The Messages interface is stateless by design. So turn after turn, the same opening tokens go back through the same machinery.',
  });
  tl.tween(cam, CAM_WIDE, { at: 28.6, dur: 1.5, ease: ease.move });
  tl.hold(33.6, 0.4);

  // — beat 6 · the montage: turns three to six —
  tl.caption({
    at: 34.2,
    dur: 6.8,
    text: 'By turn six the head is sweeping a tape that is mostly history. Almost everything under it has been processed before — most of this bill is deja vu.',
  });
  tl.tween(montageU, MONTAGE_TURNS, { at: 34.6, dur: 11.5, ease: ease.linear });

  // — beat 7 · the system prompt, read six times —
  tl.caption({
    at: 47.0,
    dur: 6.0,
    text: 'Look at the system prompt alone. Six turns, six full reads of the exact same tokens. Nothing about them ever changed.',
  });
  tl.tween(sysU, 1, { at: 47.6, dur: 0.8, ease: ease.pop });

  // — beat 8 · the staircase —
  tl.caption({
    at: 53.6,
    dur: 6.2,
    text: 'Plot each turn of input and you get a staircase. The bill is the area under it — it grows with the square of the length of the conversation.',
  });
  tl.tween(cam, CAM_CHART, { at: 53.8, dur: 1.4, ease: ease.move });
  tl.tween(chartU, 1, { at: 54.0, dur: 0.9, ease: ease.draw });
  tl.tween(barsU, 1, { at: 54.8, dur: 2.2, ease: ease.move });
  tl.tween(areaU, 1, { at: 57.4, dur: 1.4, ease: ease.draw });

  // — beat 9 · name the tax —
  tl.caption({
    at: 60.4,
    dur: 5.4,
    text: 'That is the re-read tax. Long conversations do not get linearly expensive. They get quadratically expensive.',
  });
  tl.hold(65.8, 0.6);

  // — beat 10 · the tease —
  tl.caption({
    at: 66.8,
    dur: 6.6,
    text: 'Unless someone saved the work of reading that prefix, and simply picked it up where it left off. That is prompt caching — and it is next.',
  });
  tl.tween(cam, CAM_WIDE, { at: 67.0, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 67.0, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 68.2, dur: 0.8, ease: ease.enter });
  tl.tween(teaseU, 1, { at: 70.2, dur: 1.2, ease: ease.draw });
  tl.hold(73.4, 1.4);

  return {
    tl,
    cam,
    cardU,
    cellsN,
    sweep1,
    sweep2,
    stream1,
    stream2,
    montageU,
    odoU,
    sysU,
    chartU,
    barsU,
    areaU,
    dimU,
    closeU,
    teaseU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cardU = s.get(scene.cardU);
  const cellsN = s.get(scene.cellsN);
  const sweep1 = s.get(scene.sweep1);
  const sweep2 = s.get(scene.sweep2);
  const stream1 = s.get(scene.stream1);
  const stream2 = s.get(scene.stream2);
  const montageU = s.get(scene.montageU);
  const odoU = s.get(scene.odoU);
  const sysU = s.get(scene.sysU);
  const chartU = s.get(scene.chartU);
  const barsU = s.get(scene.barsU);
  const areaU = s.get(scene.areaU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);
  const teaseU = s.get(scene.teaseU);

  const machineOp = 1 - 0.88 * dimU;
  const nVisible = Math.max(cellsN, montageCells(montageU));

  // the read head: whichever sweep is live drives it
  const mh = montageHead(montageU);
  let headCell = -1;
  let headOn = 0;
  if (sweep1 > 0 && sweep1 < 1) {
    headCell = PROMPTS[0] * sweep1;
    headOn = 1;
  } else if (sweep2 > 0 && sweep2 < 1) {
    headCell = PROMPTS[1] * sweep2;
    headOn = 1;
  } else if (montageU > 0 && montageU < MONTAGE_TURNS && mh.on) {
    headCell = mh.x;
    headOn = 1;
  }

  const billed = billedCells(sweep1, sweep2, montageU) * TOKENS_PER_CELL;
  const turnNo = Math.min(TURNS, montageU > 0 ? 3 + Math.floor(montageU - 1e-6) : sweep2 > 0 ? 2 : 1);

  // reply streams: turn 1/2 explicit, montage phases derived
  const streams: { u: number; n: number }[] = [];
  if (stream1 > 0 && stream1 < 1) streams.push({ u: stream1, n: promptCells(1) });
  if (stream2 > 0 && stream2 < 1) streams.push({ u: stream2, n: promptCells(2) });
  for (let k = 0; k < MONTAGE_TURNS; k++) {
    const f = montageU - k;
    if (f > 0.84 && f < 1) streams.push({ u: (f - 0.84) / 0.16, n: promptCells(3 + k) });
  }

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the request chip — this is what actually crosses the wire */}
        <g opacity={cardU * machineOp}>
          <rect x={TAPE_X} y={128} width={430} height={64} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={TAPE_X + 18} y={154} fill={colors.MUTED} fontSize={12}>
            one request — the whole conversation, every time
          </text>
          <text x={TAPE_X + 18} y={177} fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>
            client.messages.create({'{'} messages: [ …all of it ] {'}'})
          </text>
        </g>

        {/* the odometer */}
        <g opacity={odoU * machineOp}>
          <text x={1120} y={158} textAnchor="end" fill={billed > 40000 ? colors.NEGATIVE : colors.TEXT} fontSize={34} fontFamily={MONO} fontWeight={600}>
            {Math.round(billed).toLocaleString('en-US')}
          </text>
          <text x={1120} y={180} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            usage.input_tokens — billed
          </text>
          <text x={1120} y={200} textAnchor="end" fill={colors.MUTED} fontSize={12}>
            turn {turnNo} of {TURNS}
          </text>
        </g>

        {/* the tape */}
        <g opacity={machineOp}>
          {CELLS.map((c, i) => {
            const vis = clamp01(nVisible - i);
            if (vis <= 0) return null;
            // glow when the head has just passed this cell
            const d = headOn ? headCell - i : -1;
            const glow = d > 0 ? Math.exp(-d * d * 0.02) : 0;
            const spotlight = c.role === 'system' ? sysU : 0;
            return (
              <rect
                key={i}
                x={cellX(i)}
                y={TAPE_Y - (glow * 3 + spotlight * 3)}
                width={CELL_W}
                height={CELL_H + (glow * 6 + spotlight * 6)}
                rx={3}
                fill={ROLE_FILL[c.role]}
                opacity={vis * (0.38 + 0.55 * Math.max(glow, spotlight))}
                stroke={spotlight > 0.4 ? colors.WARM : 'none'}
                strokeWidth={1.2}
              />
            );
          })}

          {/* role legend under the tape */}
          <g opacity={clamp01(cellsN / SYS_CELLS) * 0.9}>
            {(
              [
                ['system', 'system prompt'],
                ['user', 'user turns'],
                ['assistant', 'model replies'],
              ] as const
            ).map(([role, label], i) => (
              <g key={role} transform={`translate(${TAPE_X + i * 150}, ${TAPE_Y + 52})`}>
                <rect width={10} height={10} rx={2} fill={ROLE_FILL[role]} opacity={0.7} />
                <text x={16} y={9} fill={colors.MUTED} fontSize={11.5}>
                  {label}
                </text>
              </g>
            ))}
          </g>

          {/* the read head */}
          {headOn > 0 && headCell >= 0 && (
            <g>
              <rect x={cellX(headCell) - 2} y={TAPE_Y - 16} width={5} height={CELL_H + 32} rx={2} fill={colors.WARM} />
              <text x={cellX(headCell) + 2} y={TAPE_Y - 24} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>
                read
              </text>
            </g>
          )}

          {/* the ×6 tally over the system prefix */}
          <g opacity={sysU}>
            <rect x={cellX(0)} y={TAPE_Y - 58} width={SYS_CELLS * CELL_PITCH - 2} height={26} rx={8} fill={colors.BG} stroke={colors.WARM} />
            <text x={cellX(0) + (SYS_CELLS * CELL_PITCH) / 2} y={TAPE_Y - 40} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
              same bytes — read 6 times
            </text>
          </g>

          {/* reply token streams: from the head end, arcing back onto the tape */}
          {streams.map((st, i) => (
            <TokenStream
              key={i}
              from={{ x: cellX(st.n) + 60, y: TAPE_Y - 70 }}
              to={{ x: cellX(st.n) + 40, y: TAPE_Y + CELL_H / 2 }}
              u={st.u}
              count={8}
              color={colors.POSITIVE}
              seed={11 + i}
            />
          ))}
        </g>

        {/* the staircase: input per turn, area = the bill */}
        <g opacity={chartU * machineOp}>
          <rect x={CHART.x} y={CHART.y} width={CHART.w} height={CHART.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={CHART.x + 18} y={CHART.y + 26} fill={colors.TEXT} fontSize={14} fontWeight={600}>
            input tokens per turn
          </text>
          {PROMPTS.map((p, i) => {
            const u = clamp01(barsU * (TURNS + 1.5) - i * 1.0);
            if (u <= 0) return null;
            const bw = (CHART.w - 60) / TURNS;
            const bh = (p / BAR_MAX) * (CHART.h - 70) * u;
            return (
              <g key={i}>
                <rect
                  x={CHART.x + 24 + i * bw}
                  y={CHART.y + CHART.h - 24 - bh}
                  width={bw - 8}
                  height={bh}
                  rx={4}
                  fill={colors.ACCENT}
                  opacity={0.35 + 0.45 * areaU}
                />
                <text
                  x={CHART.x + 24 + i * bw + (bw - 8) / 2}
                  y={CHART.y + CHART.h - 8}
                  textAnchor="middle"
                  fill={colors.MUTED}
                  fontSize={10.5}
                  fontFamily={MONO}
                >
                  {(p * TOKENS_PER_CELL / 1000).toFixed(1)}k
                </text>
              </g>
            );
          })}
          <MathLabel
            tex={'\\text{bill} \\;\\propto\\; n^2'}
            x={CHART.x + CHART.w - 118}
            y={CHART.y + 44}
            fontSize={20}
            color={colors.WARM}
            opacity={areaU}
          />
        </g>

        {/* closing card + the cache-shelf tease */}
        <g opacity={closeU}>
          <rect x={300} y={230} width={680} height={190} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={600}>
            Every turn re-buys the whole transcript.
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            What if the provider kept its place in the tape?
          </text>
          {/* the shelf glyph: a stored prefix with a little fuse arc */}
          <g opacity={teaseU} transform="translate(560, 352)">
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={i * 18} y={0} width={14} height={22} rx={3} fill={colors.SECONDARY} opacity={0.75} />
            ))}
            <circle cx={124} cy={11} r={12} fill="none" stroke={colors.WARM} strokeWidth={2.5} strokeDasharray="56 20" />
          </g>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
