// Why writing an answer takes steps
//
// Book 2 "One Read, Many Decisions", chapter 1 — ESTABLISHED MECHANISM,
// illustrative animation. Sources: native engine run_naive_generation (one
// prefill call, then one cached model call per generated token); charter —
// Qwen foundation invariants. Pieces are SCHEMATIC, not real Qwen tokenization;
// the work ribbon is unscaled — nothing here is a measurement.
//
// ONE persistent mechanism: a single token tape with the decoder cache hanging
// directly beneath it on the SAME d3 band scale (one cache column per piece).
// A model window first stretches over the whole input (prefill fills every
// input column layer by layer, in one pass), then narrows to one cell and
// steps along the output; every step adds exactly one new cache column and
// reaches back into the columns already there. The same tape is then re-read
// three ways: decisions vs syntax, reused vs new, and under a grammar mask.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 the fictional note; two fields with fixed permitted answers
//  2 note → pieces; prefill in one pass; the first output pieces appear
//  3 each new piece reaches back into everything before it — steps accumulate
//  4 two pieces carry decisions; eight only spell structure
//  5 the ordinary decoder cache: kept, not reread
//  6 replay: one new column per step — the sequence still advances
//  7 a grammar masks each step's vocabulary; the step count is unchanged
//  8 syntax fades; two decision slots remain — the question for the book
import { linkVertical, range, scaleBand, scaleLinear } from 'd3';
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  Cell, Chip, DECISION, DECISION_IDX, FIELDS, Label, NOTE_PIECES, NOTE_TEXT, OUT_PIECES, Panel, ROLE, StatusTag,
  captionPlan, clamp01, hash01, heatColor, stepThrough,
} from './shared/rlcd-kit';
import type { FieldSpec } from './shared/rlcd-kit';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'Imagine a short support note. We want to classify its topic and its urgency, using a fixed set of possible answers for each field.',
  'A conventional language model first processes the input, then generates an answer a token at a time. Tokens are pieces of text, not necessarily whole words.',
  'Each generated token becomes part of the context for what comes next. That creates a sequence of model steps along the output tape.',
  'Some tokens express the actual decisions. Others spell field names, quotation marks, or the punctuation that makes the answer a valid data object.',
  'A normal decoder already caches earlier computation. The comparison is not between remembering everything and rereading the entire prompt from scratch on every token.',
  'Even with that cache, the next output token usually depends on the output that came before it. The sequence still has to advance.',
  'A grammar can restrict the output to valid structure. That helps formatting, but it does not by itself turn the decoder into parallel field selection.',
  'Our question is more specific: if we already know the fields and the permitted answers, which parts of this writing process can we replace with decisions?',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;

/* ---------------------------------------------------------------- layout */
const N_IN = NOTE_PIECES.length; // 13
const N_OUT = OUT_PIECES.length; // 10
const N = N_IN + N_OUT;
const LAYERS = 6;
const X = scaleBand<number>().domain(range(N)).range([53, 1227]).paddingInner(0.08);
const STEP = X.step();
const BW = X.bandwidth();
const colX = (p: number): number => 53 + p * STEP; // continuous position on the same scale
const TAPE = { y: 232, h: 46 };
const CACHE = { y: 356, row: 22 };
const CACHE_BOTTOM = CACHE.y + LAYERS * CACHE.row;
const OUT_X = colX(N_IN);

const CAM_NOTE: CameraState = { x: 400, y: 150, k: 1.3 };
const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };
const CAM_PUSH: CameraState = { x: 640, y: 315, k: 1.04 };

// the new piece reaches back into every cached column before it
const vlink = linkVertical<{ source: [number, number]; target: [number, number] }, [number, number]>();
const REACH = range(N_OUT).map((n) =>
  range(N_IN + n).map((c) => vlink({ source: [X(N_IN + n)! + BW / 2, TAPE.y + TAPE.h + 4], target: [X(c)! + BW / 2, CACHE.y - 3] }) ?? ''),
);

// beat 7 — an illustrative vocabulary strip, masked differently at every position
const VOCAB = 32;
const VX = scaleBand<number>().domain(range(VOCAB)).range([OUT_X, 1227]).paddingInner(0.3);
const VH = scaleLinear([0, 1], [8, 58]);
const V_BASE = 206;
const CHOICE_BARS = [5, 14, 23];
const permitted = (i: number, pos: number): boolean => (DECISION.has(pos) ? CHOICE_BARS.includes(i) : (i * 7 + pos * 5) % 6 < 2);

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_NOTE, cameraInterp);
  const noteU = tl.channel('noteU', 0);
  const fieldsU = tl.channel('fieldsU', 0);
  const tapeU = tl.channel('tapeU', 0);
  const inLblU = tl.channel('inLblU', 0);
  const outLblU = tl.channel('outLblU', 0);
  const winU = tl.channel('winU', 0);
  const winPos = tl.channel('winPos', 0);
  const winW = tl.channel('winW', N_IN);
  const cacheU = tl.channel('cacheU', 0);
  const prefillU = tl.channel('prefillU', 0);
  const genU = tl.channel('genU', 0);
  const reachU = tl.channel('reachU', 0);
  const decU = tl.channel('decU', 0);
  const decTagU = tl.channel('decTagU', 0);
  const synU = tl.channel('synU', 0);
  const sumU = tl.channel('sumU', 0);
  const tapeDim = tl.channel('tapeDim', 1);
  const cacheHiU = tl.channel('cacheHiU', 0);
  const notU = tl.channel('notU', 0);
  const scanU = tl.channel('scanU', 0);
  const scanHiU = tl.channel('scanHiU', 0);
  const gramU = tl.channel('gramU', 0);
  const gramPos = tl.channel('gramPos', 0);
  const synDim = tl.channel('synDim', 1);
  const closeU = tl.channel('closeU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · the note, then the fixed answers — */
  let b = AT[0];
  tl.tween(noteU, 1, { at: b + 0.3, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 3.6, dur: 1.6, ease: ease.move });
  tl.tween(fieldsU, 1, { at: b + 5.0, dur: 1.4, ease: ease.enter });

  /* — beat 2 · pieces; prefill in one pass; generation begins — */
  b = AT[1];
  tl.tween(noteU, 0.4, { at: b + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(fieldsU, 0.4, { at: b + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(tapeU, 1, { at: b + 0.4, dur: 2.0, ease: ease.linear });
  tl.tween(inLblU, 1, { at: b + 1.8, dur: 0.6, ease: ease.enter });
  tl.tween(winU, 1, { at: b + 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(cacheU, 1, { at: b + 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(prefillU, 1, { at: b + 3.4, dur: 2.2, ease: ease.linear });
  tl.tween(winW, 1, { at: b + 6.0, dur: 0.9, ease: ease.move });
  tl.tween(winPos, N_IN, { at: b + 6.0, dur: 0.9, ease: ease.move });
  tl.tween(outLblU, 1, { at: b + 6.6, dur: 0.6, ease: ease.enter });
  tl.tween(genU, 3, { at: b + 7.2, dur: 3.3, ease: ease.linear });
  stepThrough(tl, winPos, N_IN + 1, 2, b + 7.2 + 1.1 - 0.35, 1.1);

  /* — beat 3 · every new piece reaches back; steps accumulate — */
  b = AT[2];
  tl.tween(cam, CAM_PUSH, { at: b + 0.1, dur: 1.2, ease: ease.move });
  tl.tween(reachU, 1, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.tween(genU, N_OUT, { at: b + 0.9, dur: 7.7, ease: ease.linear });
  stepThrough(tl, winPos, N_IN + 3, 7, b + 0.9 - 0.35, 1.1);

  /* — beat 4 · decisions vs structure — */
  b = AT[3];
  tl.tween(reachU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(winU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(outLblU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cacheU, 0.3, { at: b + 0.2, dur: 0.7, ease: ease.move });
  tl.tween(decU, 1, { at: b + 0.9, dur: 0.7, ease: ease.pop });
  tl.tween(decTagU, 1, { at: b + 1.3, dur: 0.5, ease: ease.enter });
  tl.tween(synU, 1, { at: b + 3.6, dur: 0.8, ease: ease.enter });
  tl.tween(sumU, 1, { at: b + 6.4, dur: 0.6, ease: ease.enter });

  /* — beat 5 · the ordinary cache — */
  b = AT[4];
  tl.tween(cam, CAM_HOME, { at: b + 0.1, dur: 1.2, ease: ease.move });
  tl.tween(sumU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(decTagU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(tapeDim, 0.45, { at: b + 0.3, dur: 0.7, ease: ease.move });
  tl.tween(cacheU, 1, { at: b + 0.3, dur: 0.7, ease: ease.move });
  tl.tween(cacheHiU, 1, { at: b + 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(notU, 1, { at: b + 5.2, dur: 0.6, ease: ease.pop });

  /* — beat 6 · replay: reused columns, one new column per step — */
  b = AT[5];
  tl.tween(notU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cacheHiU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(tapeDim, 1, { at: b + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(winPos, N_IN, { at: b + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(winU, 1, { at: b + 0.5, dur: 0.5, ease: ease.enter });
  tl.tween(scanHiU, 1, { at: b + 0.7, dur: 0.5, ease: ease.enter });
  tl.tween(scanU, N_OUT - 0.01, { at: b + 1.2, dur: 7.0, ease: ease.linear });
  stepThrough(tl, winPos, N_IN + 1, 9, b + 1.2 + 0.7 - 0.28, 0.7);

  /* — beat 7 · a grammar restricts each step, not the number of steps — */
  b = AT[6];
  tl.tween(scanHiU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cacheU, 0.25, { at: b + 0.2, dur: 0.7, ease: ease.move });
  tl.tween(winPos, N_IN, { at: b + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(gramU, 1, { at: b + 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(gramPos, N_OUT - 0.01, { at: b + 2.2, dur: 7.0, ease: ease.linear });
  stepThrough(tl, winPos, N_IN + 1, 9, b + 2.2 + 0.7 - 0.28, 0.7);

  /* — beat 8 · what could become decisions? — */
  b = AT[7];
  tl.tween(gramU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(winU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cacheU, 0, { at: b + 0.1, dur: 0.8, ease: ease.enter });
  tl.tween(synDim, 0.15, { at: b + 0.8, dur: 0.9, ease: ease.move });
  tl.tween(closeU, 1, { at: b + 1.8, dur: 0.9, ease: ease.enter });
  tl.hold(PLAN.end, 1.0);

  return {
    tl, cam, noteU, fieldsU, tapeU, inLblU, outLblU, winU, winPos, winW, cacheU, prefillU, genU, reachU, decU, decTagU,
    synU, sumU, tapeDim, cacheHiU, notU, scanU, scanHiU, gramU, gramPos, synDim, closeU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------- local subcomponents */
function FieldCard({ x, y, w, field, u }: { x: number; y: number; w: number; field: FieldSpec; u: number }) {
  if (u <= 0.002) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={u}>
      <rect width={w} height={68} rx={10} fill="#0d1321" stroke="#2a3754" />
      <text x={14} y={24} fill={colors.TEXT} fontSize={16} fontWeight={650}>
        {field.name}
      </text>
      <text x={w - 14} y={24} textAnchor="end" fill={colors.MUTED} fontSize={12}>
        permitted answers
      </text>
      {field.choices.map((c, i) => (
        <text key={c} x={14 + i * ((w - 28) / 3)} y={52} fill={ROLE.MODEL} fontSize={15} fontFamily={colors.font.mono}>
          {c}
        </text>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const tapeU = s.get(scene.tapeU);
  const genU = s.get(scene.genU);
  const prefillU = s.get(scene.prefillU);
  const cacheU = s.get(scene.cacheU);
  const reachU = s.get(scene.reachU);
  const decU = s.get(scene.decU);
  const synU = s.get(scene.synU);
  const synDim = s.get(scene.synDim);
  const tapeDim = s.get(scene.tapeDim);
  const winU = s.get(scene.winU);
  const winPos = s.get(scene.winPos);
  const winW = s.get(scene.winW);
  const scanHiU = s.get(scene.scanHiU);
  const gramU = s.get(scene.gramU);
  const closeU = s.get(scene.closeU);
  const noteU = s.get(scene.noteU);
  const fieldsU = s.get(scene.fieldsU);

  const cur = Math.min(N_OUT - 1, Math.floor(genU)); // newest generated piece
  const scan = Math.floor(s.get(scene.scanU));
  const gpos = Math.floor(s.get(scene.gramPos));
  const outVis = (i: number) => clamp01((genU - i) * 3);
  const winX = colX(winPos) - 5;
  const winWidth = winW * STEP - (STEP - BW) + 10;
  const prefilling = winW > 1.5;
  const stepNo = Math.round(winPos) - N_IN + 1;

  return (
    <Camera {...s.get(scene.cam)}>
      {/* the fictional note and its two fields */}
      {noteU > 0.002 && (
        <g opacity={noteU}>
          <rect x={53} y={50} width={590} height={68} rx={10} fill="#0d1321" stroke={ROLE.OBSERVE} strokeWidth={1.3} />
          <text x={69} y={74} fill={ROLE.OBSERVE} fontSize={12} fontFamily={colors.font.mono} letterSpacing={1}>
            SUPPORT NOTE · fictional
          </text>
          <text x={69} y={102} fill={colors.TEXT} fontSize={18}>
            “{NOTE_TEXT}”
          </text>
        </g>
      )}
      <FieldCard x={670} y={50} w={270} field={FIELDS[0]} u={clamp01(fieldsU * 2)} />
      <FieldCard x={957} y={50} w={270} field={FIELDS[1]} u={clamp01(fieldsU * 2 - 0.8)} />

      {/* span labels */}
      <Label x={53} y={218} text="INPUT · the note as 13 pieces" u={s.get(scene.inLblU) * tapeDim} size={15} color={ROLE.OBSERVE} />
      <Label x={53} y={198} text="schematic pieces · not real tokenization" u={s.get(scene.inLblU) * tapeDim * (1 - closeU)} size={13} color={ROLE.PENDING} mono />
      <Label x={1227} y={218} anchor="end" text="OUTPUT · one piece per model step" u={s.get(scene.outLblU)} size={15} color={ROLE.MODEL} />

      {/* the decoder cache: one column per piece, on the tape's own scale */}
      {cacheU > 0.002 && (
        <g opacity={cacheU}>
          {range(N).map((c) =>
            range(LAYERS).map((l) => {
              const u = c < N_IN ? clamp01(prefillU * LAYERS - l) : clamp01((genU - (c - N_IN)) * 3 - l * 0.25);
              if (u <= 0.002) return null;
              return <rect key={`${c}-${l}`} x={X(c)!} y={CACHE.y + l * CACHE.row} width={BW} height={CACHE.row - 3} rx={3} fill={heatColor(0.25 + 0.75 * hash01(c, l))} opacity={u} />;
            }),
          )}
          {/* prefill sweeps all input columns at once, layer by layer */}
          {prefillU > 0.002 && prefillU < 0.998 && (
            <line x1={48} x2={colX(N_IN) - 2} y1={CACHE.y + prefillU * LAYERS * CACHE.row} y2={CACHE.y + prefillU * LAYERS * CACHE.row} stroke={colors.TEXT} strokeWidth={2} opacity={0.8} />
          )}
          <Label x={53} y={CACHE_BOTTOM + 22} text="decoder cache · keys and values kept for every position (schematic layers)" size={15} color={ROLE.MODEL} />
        </g>
      )}

      {/* beat 3 — the newest piece reaches back into every column before it */}
      {reachU > 0.002 &&
        REACH[cur].map((d, c) => (
          <path key={c} d={d} fill="none" stroke={c < N_IN ? ROLE.OBSERVE : ROLE.MODEL} strokeWidth={1.3} opacity={reachU * clamp01((genU - cur) * 3) * 0.6} />
        ))}
      <Label x={53} y={160} text={`step ${cur + 1}: reads ${N_IN + cur} cached positions, adds one`} u={reachU} size={15} />

      {/* the tape */}
      <g opacity={tapeDim}>
        {NOTE_PIECES.map((p, i) => (
          <Cell key={i} x={X(i)!} y={TAPE.y} w={BW} h={TAPE.h} text={p} u={clamp01(tapeU * (N_IN + 2) - i)} tone={ROLE.OBSERVE} fill="#0b1a2b" />
        ))}
      </g>
      {OUT_PIECES.map((p, i) => {
        const dec = DECISION.has(i);
        return (
          <g key={i} opacity={(dec ? 1 : synDim) * (dec ? 1 : tapeDim)} transform={`translate(0 ${dec ? -10 * decU : 0})`}>
            <Cell x={X(N_IN + i)!} y={TAPE.y} w={BW} h={TAPE.h} text={p} u={outVis(i)} tone={dec && decU > 0.5 ? ROLE.CHECKED : ROLE.MODEL} dashed={!dec && synU > 0.5} strong={dec ? decU : 0} />
          </g>
        );
      })}

      {/* beat 4 — decisions vs structure */}
      {DECISION_IDX.map((i) => (
        <Chip key={i} x={X(N_IN + i)! + BW / 2} y={196} anchor="middle" text="◆ decision" color={ROLE.CHECKED} fill="#062a1e" u={s.get(scene.decTagU)} />
      ))}
      <Label x={OUT_X} y={318} text="┄ dashed: field names, quotes, punctuation — structure only" u={synU * s.get(scene.decTagU)} size={15} color={colors.MUTED} />
      <Label x={OUT_X} y={160} text="2 of 10 pieces carry the decisions" u={s.get(scene.sumU)} size={20} weight={700} />

      {/* the model window: wide for prefill, one cell wide for every output step */}
      {winU > 0.002 && (
        <g opacity={winU}>
          <rect x={winX} y={TAPE.y - 6} width={winWidth} height={TAPE.h + 12} rx={9} fill={ROLE.MODEL} fillOpacity={0.08} stroke={ROLE.MODEL} strokeWidth={2.4} />
          <Label
            x={Math.min(1150, Math.max(140, winX + winWidth / 2))}
            y={prefilling ? 306 : 196}
            anchor="middle"
            text={prefilling ? 'model · prefill: the whole input in one pass' : `model · step ${stepNo} of ${N_OUT}`}
            u={(1 - gramU) * clamp01(Math.abs(winW - 1.5) * 2) * (prefilling ? 1 : 1 - s.get(scene.decTagU))}
            size={15}
            color={ROLE.MODEL}
            weight={650}
          />
        </g>
      )}

      {/* beat 5 — an ordinary decoder already keeps this */}
      <g opacity={s.get(scene.cacheHiU)}>
        <rect x={46} y={CACHE.y - 8} width={1188} height={LAYERS * CACHE.row + 12} rx={10} fill="none" stroke={ROLE.MODEL} strokeWidth={2} />
        <Label x={53} y={322} text="✓ ordinary generation already reuses this cache" size={18} weight={650} />
      </g>
      <Chip x={1227} y={316} anchor="end" text="✕ not: reread the whole prompt for every piece" color={ROLE.INVALID} fill="#2a0c14" size={14} u={s.get(scene.notU)} />

      {/* beat 6 — reused columns vs the single new one */}
      {scanHiU > 0.002 && (
        <g opacity={scanHiU}>
          <path d={`M53 328V320H${X(N_IN + scan - 1)! + BW}V328`} fill="none" stroke={ROLE.CHECKED} strokeWidth={2} />
          <Label x={53} y={311} text="✓ reused from cache" size={15} color={ROLE.CHECKED} />
          <rect x={X(N_IN + scan)! - 3} y={CACHE.y - 5} width={BW + 6} height={LAYERS * CACHE.row + 6} rx={6} fill="none" stroke={ROLE.PENDING} strokeWidth={2.4} strokeDasharray="6 4" />
          <Label x={Math.min(1227, X(N_IN + scan)! + BW + 3)} y={348} anchor="end" text="new this step ▾" size={14} color={ROLE.PENDING} />
          {range(1, N_OUT).map((i) => (
            <path key={i} d={`M${X(N_IN + i)! - 7} ${TAPE.y + TAPE.h + 12}l6 5l-6 5`} fill="none" stroke={colors.TEXT} strokeWidth={2} opacity={i <= scan ? 0.9 : 0.12} />
          ))}
          {range(N_OUT).map((i) => (
            <rect key={i} x={OUT_X + i * 30} y={528} width={24} height={14} rx={3} fill={i <= scan ? ROLE.MODEL : 'none'} stroke={ROLE.MODEL} strokeWidth={1.2} />
          ))}
          {/* under the strip, left-aligned with it — beside it the text ran past the stage's right edge */}
          <Label x={OUT_X} y={562} text="sequential steps · unscaled, not timed" size={14} color={colors.MUTED} />
        </g>
      )}

      {/* beat 7 — a grammar masks the vocabulary at each step */}
      {gramU > 0.002 && (
        <g opacity={gramU}>
          <Label x={OUT_X} y={140} text={`grammar at step ${gpos + 1}: only valid pieces stay`} size={16} weight={650} />
          {range(VOCAB).map((i) => {
            const ok = permitted(i, gpos);
            const h = VH(hash01(i, gpos + 40));
            return (
              <g key={i}>
                <rect x={VX(i)!} y={V_BASE - h} width={VX.bandwidth()} height={h} rx={2} fill={ok ? ROLE.MODEL : 'none'} stroke={ok ? ROLE.MODEL : colors.MUTED} strokeWidth={1} strokeDasharray={ok ? undefined : '2 2'} opacity={ok ? 1 : 0.35} />
                {ok && <circle cx={VX(i)! + VX.bandwidth() / 2} cy={V_BASE + 8} r={2.6} fill={ROLE.CHECKED} />}
              </g>
            );
          })}
          <Label x={53} y={320} text="valid structure ✓ — still one step per piece" size={18} weight={650} />
          <StatusTag x={53} y={540} kind="CURRENT" text="browser prototype: grammar-constrained generation" />
          <Label x={OUT_X} y={318} text="● permitted   ┄ masked · illustrative scores" size={13} color={colors.MUTED} mono />
        </g>
      )}

      {/* beat 8 — the two decisions, waiting to be asked directly */}
      <Panel x={170} y={350} w={940} h={206} u={closeU} stroke={ROLE.CHECKED}>
        {FIELDS.map((f, k) => {
          const px = 210 + k * 450;
          return (
            <g key={f.name}>
              <rect x={px} y={386} width={410} height={84} rx={10} fill="#062a1e" stroke={ROLE.CHECKED} strokeWidth={1.4} strokeDasharray="7 5" />
              <text x={px + 18} y={416} fill={colors.TEXT} fontSize={18} fontWeight={700}>
                {f.name} = ?
              </text>
              <text x={px + 18} y={448} fill={ROLE.MODEL} fontSize={16} fontFamily={colors.font.mono}>
                {f.choices.join('  ·  ')}
              </text>
            </g>
          );
        })}
        <text x={640} y={518} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={750}>
          Known fields, permitted answers: which steps can become decisions?
        </text>
      </Panel>
      {closeU > 0.002 &&
        DECISION_IDX.map((i, k) => (
          <path key={i} d={vlink({ source: [X(N_IN + i)! + BW / 2, TAPE.y + TAPE.h - 8], target: [415 + k * 450, 386] }) ?? ''} fill="none" stroke={ROLE.CHECKED} strokeWidth={2} pathLength={1} strokeDasharray={`${clamp01(closeU * 1.6 - 0.6)} 1`} />
        ))}
    </Camera>
  );
}

export const vizScene = () => scene;
