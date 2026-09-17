// Ask together, assemble in code
//
// Book 2 "One Read, Many Decisions", chapter 3 — INTENDED RLCD CONTRACT.
// Sources: native engine run_parallel_generation (field suffixes stacked into
// one traced "suffix_batch" call); schema StructuredSchema.compile_parallel_metadata
// (unequal suffixes right-padded into suffixes_batch; per-field candidate
// tokens); charter — Qwen foundation invariants 2–6. All scores are ILLUSTRATIVE
// ranking scores, not probabilities; the selected urgency is a selection under
// a policy, not a verified ground truth. Pieces are schematic.
//
// ONE persistent mechanism: a two-row query matrix. It is squared off with a
// masked PAD cell, travels through the model window as ONE batch, re-emerges
// as two rows of next-piece scores, is masked down to the permitted choices,
// and the winning bars themselves fly into a typed object whose structure is
// written by code. The same two rows finally carry the independence test.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 two question rows on one trunk enter the model together — one call
//  2 unequal lengths: PAD is masked, positions continue from the context
//  3 one sweep; scores emerge per row; the vocabulary outside the choices dims
//  4 a named policy selects; harder choices are flagged for the next chapter
//  5 code writes names, punctuation, exact labels; the values drop in
//  6 model selects · code constructs — eight structure pieces never generated
//  7 independence: neither row sees the other's new answer
//  8 a real dependency must be represented — closing on a cleared panel
import { range, scaleBand, scaleLinear } from 'd3';
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Cell, Chip, DECISION, FIELDS, Label, MONO, OUT_PIECES, Panel, ROLE, StatusTag, captionPlan, clamp01, hash01, heatColor, lerp } from './shared/rlcd-kit';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'The next stage places the field questions in a real model batch. Several rows travel through the model together, instead of becoming unrelated chat requests.',
  'Those rows may have different lengths. Padding, attention masks, and token positions must preserve what each branch is actually allowed to see.',
  'At a decision position, the model produces scores over possible next tokens. The engine examines the permitted choices under an explicit scoring rule.',
  'For a simple unambiguous choice, that may be enough to select a value. Some choices require more work, which we will examine next.',
  'Once the decisions are available, ordinary code builds the output object. It supplies the field names, punctuation, exact labels, and actual boolean values.',
  'That is the central change: model computation selects values, while software constructs the structure around them. The model need not type that structure into existence.',
  "Parallel fields only make sense when their decisions can use the same context without depending on each other's newly selected answer.",
  'If choosing one field changes what another field is allowed to mean, we must represent that dependency instead of pretending the questions are independent.',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;

/* ---------------------------------------------------------------- layout */
const ROWS = [
  { pieces: ['"', 'topic', '":', '"'], y: 160 },
  { pieces: ['"', 'urg', 'ency', '":', '"'], y: 236 },
];
const COLS = 5;
const MAT = { x: 175, step: 60, w: 56, h: 44 };
const MAT_RIGHT = MAT.x + COLS * MAT.step - 4;
const WIN = { x: 520, y: 140, w: 170, h: 180 };
const VOCAB = 30;
const VX = scaleBand<number>().domain(range(VOCAB)).range([740, 1190]).paddingInner(0.3);
const VH = scaleLinear([0, 1], [0, 62]);
const CHOICE_BARS = [4, 13, 22];
const BASE = [210, 320];
const SCORES = [
  [0.3, 0.86, 0.22],
  [0.18, 0.52, 0.74],
];
const barScore = (row: number, i: number): number => {
  const c = CHOICE_BARS.indexOf(i);
  return c >= 0 ? SCORES[row][c] : 0.12 + 0.8 * hash01(i, row + 5);
};

const OBJ = { x: 300, y: 385, w: 600, h: 162, codeX: 352, ch: 10.8 };
const LINE_Y = [436, 464, 492, 520];
const SLOTS = [
  { x: OBJ.codeX + 9 * OBJ.ch, y: LINE_Y[1] },
  { x: OBJ.codeX + 11 * OBJ.ch, y: LINE_Y[2] },
];
const TAPE = { x: 175, y: 338, step: 52, w: 48, h: 32 };

const CAM_LEFT: CameraState = { x: 420, y: 250, k: 1.25 };
const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };
const CAM_OBJ: CameraState = { x: 640, y: 400, k: 1.1 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_LEFT, cameraInterp);
  const matU = tl.channel('matU', 0);
  const winU = tl.channel('winU', 0);
  const batchU = tl.channel('batchU', 0);
  const notChatU = tl.channel('notChatU', 0);
  const padU = tl.channel('padU', 0);
  const stripU = tl.channel('stripU', 0);
  const fenceU = tl.channel('fenceU', 0);
  const posNoteU = tl.channel('posNoteU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const barsU = tl.channel('barsU', 0);
  const maskU = tl.channel('maskU', 0);
  const policyU = tl.channel('policyU', 0);
  const pick0 = tl.channel('pick topic', 0);
  const pick1 = tl.channel('pick urgency', 0);
  const moreU = tl.channel('moreU', 0);
  const objU = tl.channel('objU', 0);
  const codeU = tl.channel('codeU', 0);
  const drop0 = tl.channel('drop topic', 0);
  const drop1 = tl.channel('drop urgency', 0);
  const legendU = tl.channel('legendU', 0);
  const splitU = tl.channel('splitU', 0);
  const tapeU = tl.channel('tapeU', 0);
  const strikeU = tl.channel('strikeU', 0);
  const indepU = tl.channel('indepU', 0);
  const depU = tl.channel('depU', 0);
  const closeU = tl.channel('closeU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · a real batch — */
  let b = AT[0];
  tl.tween(matU, 1, { at: b + 0.3, dur: 1.8, ease: ease.linear });
  tl.tween(winU, 1, { at: b + 2.4, dur: 0.7, ease: ease.enter });
  tl.tween(batchU, 1, { at: b + 4.2, dur: 2.2, ease: ease.move });
  tl.tween(notChatU, 1, { at: b + 7.6, dur: 0.5, ease: ease.pop });

  /* — beat 2 · padding, masks, positions — */
  b = AT[1];
  tl.tween(notChatU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(padU, 1, { at: b + 0.8, dur: 0.7, ease: ease.pop });
  tl.tween(stripU, 1, { at: b + 2.6, dur: 1.6, ease: ease.linear });
  tl.tween(fenceU, 1, { at: b + 5.4, dur: 0.8, ease: ease.draw });
  tl.tween(posNoteU, 1, { at: b + 7.0, dur: 0.6, ease: ease.enter });

  /* — beat 3 · scores; permitted choices under an explicit rule — */
  b = AT[2];
  tl.tween(posNoteU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(fenceU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(sweepU, 1, { at: b + 0.8, dur: 1.6, ease: ease.linear });
  tl.tween(barsU, 1, { at: b + 2.0, dur: 1.5, ease: ease.enter });
  tl.tween(maskU, 1, { at: b + 5.0, dur: 1.1, ease: ease.move });
  tl.tween(policyU, 1, { at: b + 7.4, dur: 0.6, ease: ease.enter });

  /* — beat 4 · select; flag the harder cases — */
  b = AT[3];
  tl.tween(pick0, 1, { at: b + 0.7, dur: 0.5, ease: ease.pop });
  tl.tween(pick1, 1, { at: b + 2.2, dur: 0.5, ease: ease.pop });
  tl.tween(moreU, 1, { at: b + 5.2, dur: 0.6, ease: ease.enter });

  /* — beat 5 · ordinary code builds the object — */
  b = AT[4];
  tl.tween(moreU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_OBJ, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(objU, 1, { at: b + 0.9, dur: 0.7, ease: ease.enter });
  tl.tween(codeU, 1, { at: b + 1.6, dur: 2.8, ease: ease.linear });
  tl.tween(drop0, 1, { at: b + 4.8, dur: 1.2, ease: ease.move });
  tl.tween(drop1, 1, { at: b + 6.2, dur: 1.2, ease: ease.move });
  tl.tween(legendU, 1, { at: b + 7.8, dur: 0.7, ease: ease.enter });

  /* — beat 6 · the central change — */
  b = AT[5];
  tl.tween(policyU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(splitU, 1, { at: b + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(tapeU, 1, { at: b + 5.0, dur: 1.2, ease: ease.linear });
  tl.tween(strikeU, 1, { at: b + 6.6, dur: 1.2, ease: ease.linear });

  /* — beat 7 · independence — */
  b = AT[6];
  tl.tween(tapeU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(splitU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(indepU, 1, { at: b + 1.6, dur: 1.2, ease: ease.draw });

  /* — beat 8 · a real dependency is represented, not ignored — */
  b = AT[7];
  tl.tween(depU, 1, { at: b + 0.8, dur: 1.0, ease: ease.move });
  tl.tween(objU, 0, { at: b + 5.6, dur: 0.7, ease: ease.enter });
  tl.tween(legendU, 0, { at: b + 5.6, dur: 0.7, ease: ease.enter });
  tl.tween(closeU, 1, { at: b + 6.4, dur: 0.9, ease: ease.enter });
  tl.hold(PLAN.end, 1.0);

  return {
    tl, cam, matU, winU, batchU, notChatU, padU, stripU, fenceU, posNoteU, sweepU, barsU, maskU, policyU, pick0, pick1, moreU,
    objU, codeU, drop0, drop1, legendU, splitU, tapeU, strikeU, indepU, depU, closeU,
  };
}

const scene = buildScene();

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const matU = s.get(scene.matU);
  const winU = s.get(scene.winU);
  const batchU = s.get(scene.batchU);
  const padU = s.get(scene.padU);
  const stripU = s.get(scene.stripU);
  const fenceU = s.get(scene.fenceU);
  const sweepU = s.get(scene.sweepU);
  const barsU = s.get(scene.barsU);
  const maskU = s.get(scene.maskU);
  const picks = [s.get(scene.pick0), s.get(scene.pick1)];
  const drops = [s.get(scene.drop0), s.get(scene.drop1)];
  const objU = s.get(scene.objU);
  const codeU = s.get(scene.codeU);
  const legendU = s.get(scene.legendU);
  const splitU = s.get(scene.splitU);
  const tapeU = s.get(scene.tapeU);
  const strikeU = s.get(scene.strikeU);
  const indepU = s.get(scene.indepU);
  const depU = s.get(scene.depU);
  const closeU = s.get(scene.closeU);

  const codeO = (k: number) => clamp01(codeU * 5 - k);
  const linkColor = depU > 0.5 ? ROLE.PENDING : ROLE.INVALID;

  return (
    <Camera {...s.get(scene.cam)}>
      {/* the shared trunk both rows stand on */}
      <g opacity={clamp01(matU * 3)}>
        {range(6).map((l) => (
          <rect key={l} x={90} y={160 + l * 24} width={60} height={20} rx={3} fill={heatColor(0.35 + 0.6 * hash01(l, 2))} />
        ))}
        <Label x={120} y={150} anchor="middle" text="shared" size={13} color={ROLE.MODEL} mono />
        <Label x={120} y={318} anchor="middle" text="state" size={13} color={ROLE.MODEL} mono />
        {ROWS.map((r) => (
          <line key={r.y} x1={150} x2={MAT.x - 2} y1={r.y + MAT.h / 2} y2={r.y + MAT.h / 2} stroke={ROLE.MODEL} strokeWidth={2.4} />
        ))}
      </g>

      {/* THE QUERY MATRIX — two field questions, one batch */}
      {ROWS.map((r, k) => (
        <g key={k}>
          <Label x={MAT.x} y={k === 0 ? 150 : 322} text={`row ${k} · ${FIELDS[k].name} question · ${r.pieces.length} pieces`} u={clamp01(matU * 3 - k)} size={15} weight={650} />
          {r.pieces.map((p, i) => (
            <Cell key={i} x={MAT.x + i * MAT.step} y={r.y} w={MAT.w} h={MAT.h} text={p} size={13} u={clamp01(matU * 6 - k * 2 - i * 0.5)} />
          ))}
          {range(COLS).map((i) => {
            const real = i < r.pieces.length;
            const u = real ? clamp01(stripU * 6 - i) : padU;
            return <Label key={i} x={MAT.x + i * MAT.step + MAT.w / 2} y={r.y + MAT.h + 15} anchor="middle" text={real ? `✓ p+${i}` : '∅ mask'} u={u} size={12} color={real ? ROLE.CHECKED : ROLE.INVALID} mono />;
          })}
        </g>
      ))}
      {/* the PAD cell squares the batch — hatched, masked, never attended */}
      {padU > 0.002 && (
        <g opacity={padU} transform={`translate(${MAT.x + 4 * MAT.step} ${ROWS[0].y})`}>
          <rect width={MAT.w} height={MAT.h} rx={6} fill="#1a0d12" stroke={ROLE.INVALID} strokeWidth={1.5} strokeDasharray="4 3" />
          <path d="M6 38L38 6M22 38L50 10M6 22L22 6" stroke={ROLE.INVALID} strokeWidth={1} opacity={0.5} />
          <text x={MAT.w / 2} y={27} textAnchor="middle" fill={ROLE.INVALID} fontSize={13} fontFamily={MONO}>
            PAD
          </text>
        </g>
      )}
      {fenceU > 0.002 && (
        <g opacity={fenceU}>
          <path d={`M${MAT.x - 4} ${ROWS[0].y - 5}H${MAT.x + 4 * MAT.step - 6}V${ROWS[0].y + MAT.h + 22}H${MAT.x - 4}Z`} fill="none" stroke={ROLE.CHECKED} strokeWidth={2} pathLength={1} strokeDasharray={`${fenceU} 1`} />
          <Label x={MAT.x} y={134} text="row 0 sees: shared state + own 4 pieces" size={13} color={ROLE.CHECKED} mono />
        </g>
      )}
      <Label x={MAT.x} y={350} text="p = length of the shared context · positions continue from it" u={s.get(scene.posNoteU)} size={14} color={colors.MUTED} />
      <Chip x={MAT.x} y={364} text="✕ not: two unrelated chat requests" color={ROLE.INVALID} fill="#2a0c14" size={14} u={s.get(scene.notChatU)} />

      {/* the model window — rows enter together, one sweep serves both */}
      {winU > 0.002 && (
        <g opacity={winU}>
          <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={12} fill={ROLE.MODEL} fillOpacity={0.07} stroke={ROLE.MODEL} strokeWidth={2.4} />
          {range(6).map((l) => (
            <line key={l} x1={WIN.x + 22 + l * 25} x2={WIN.x + 22 + l * 25} y1={WIN.y + 14} y2={WIN.y + WIN.h - 14} stroke={ROLE.MODEL} strokeWidth={1.2} opacity={0.35} />
          ))}
          <Label x={WIN.x + WIN.w / 2} y={128} anchor="middle" text="model · one batched call" size={16} color={ROLE.MODEL} weight={650} />
          {sweepU > 0.002 && sweepU < 0.998 && <rect x={WIN.x + 6 + sweepU * (WIN.w - 22)} y={WIN.y + 8} width={10} height={WIN.h - 16} rx={5} fill={colors.TEXT} opacity={0.8} />}
        </g>
      )}
      {batchU > 0.002 &&
        ROWS.map((r, k) => (
          <rect key={k} x={lerp(MAT.x, WIN.x + 14, batchU)} y={r.y + 4} width={lerp(MAT_RIGHT - MAT.x, WIN.w - 28, batchU)} height={MAT.h - 8} rx={8} fill={ROLE.MODEL} opacity={0.2 + 0.35 * batchU * (1 - 0.6 * sweepU)} />
        ))}

      {/* next-piece scores per row; everything outside the permitted choices dims */}
      <Label x={740} y={120} text="illustrative ranking scores · not probabilities" u={barsU} size={13} color={ROLE.PENDING} mono />
      {barsU > 0.002 &&
        ROWS.map((_, k) => (
          <g key={k}>
            <line x1={736} x2={1190} y1={BASE[k]} y2={BASE[k]} stroke={colors.MUTED} strokeWidth={1} opacity={0.6 * barsU} />
            {range(VOCAB).map((i) => {
              const c = CHOICE_BARS.indexOf(i);
              const ok = c >= 0;
              const h = VH(barScore(k, i)) * clamp01(barsU * 1.6 - (i / VOCAB) * 0.6);
              const chosen = ok && c === FIELDS[k].pick;
              const flown = chosen ? drops[k] : 0;
              return (
                <g key={i} opacity={ok ? 1 - 0.7 * flown : 1 - 0.8 * maskU}>
                  <rect x={VX(i)!} y={BASE[k] - h} width={VX.bandwidth()} height={h} rx={2} fill={ok ? ROLE.MODEL : '#4b4580'} stroke={chosen && picks[k] > 0.5 ? ROLE.CHECKED : 'none'} strokeWidth={2.4} />
                  {ok && <Label x={VX(i)! + VX.bandwidth() / 2} y={BASE[k] + 18} anchor="middle" text={FIELDS[k].choices[c]} u={maskU} size={13} mono color={chosen && picks[k] > 0.5 ? ROLE.CHECKED : colors.TEXT} />}
                  {chosen && <Label x={VX(i)! + VX.bandwidth() / 2} y={BASE[k] - h - 8} anchor="middle" text="✓" u={picks[k]} size={17} color={ROLE.CHECKED} weight={800} />}
                </g>
              );
            })}
          </g>
        ))}
      <Chip x={740} y={362} text="policy: highest permitted score" color={ROLE.MODEL} u={s.get(scene.policyU)} />
      <Chip x={740} y={398} text="? longer or colliding answers → more work" color={ROLE.PENDING} fill="#1a1405" dashed u={s.get(scene.moreU)} />

      {/* the typed object: structure by code, values by selection */}
      {objU > 0.002 && (
        <g opacity={objU}>
          <rect x={OBJ.x} y={OBJ.y} width={OBJ.w} height={OBJ.h} rx={12} fill="#0d1321" stroke={ROLE.OBSERVE} strokeWidth={1.5 + splitU} />
          <Label x={OBJ.x + 18} y={OBJ.y + 24} text="output object · assembled by ordinary code" size={14} color={ROLE.OBSERVE} />
          {[
            { t: '{', x: OBJ.x + 30, y: LINE_Y[0], k: 0 },
            { t: '"topic": ', x: OBJ.codeX, y: LINE_Y[1], k: 1 },
            { t: ',', x: SLOTS[0].x + 8 * OBJ.ch, y: LINE_Y[1], k: 2 },
            { t: '"urgency": ', x: OBJ.codeX, y: LINE_Y[2], k: 3 },
            { t: '}', x: OBJ.x + 30, y: LINE_Y[3], k: 4 },
          ].map((p) => (
            <text key={p.k} x={p.x} y={p.y} fill={ROLE.OBSERVE} fontSize={18} fontFamily={MONO} opacity={codeO(p.k)}>
              {p.t}
            </text>
          ))}
          {SLOTS.map((sl, k) => {
            const label = `"${FIELDS[k].choices[FIELDS[k].pick]}"`;
            const w = label.length * OBJ.ch;
            const landed = clamp01(drops[k] * 5 - 4);
            return (
              <g key={k}>
                <rect x={sl.x - 3} y={sl.y - 19} width={w + 6} height={25} rx={4} fill="none" stroke={ROLE.CHECKED} strokeWidth={1.2 + splitU} strokeDasharray={landed > 0.5 ? undefined : '4 3'} opacity={codeO(k * 2 + 1)} />
                <text x={sl.x} y={sl.y} fill={ROLE.CHECKED} fontSize={18} fontFamily={MONO} fontWeight={700} opacity={landed}>
                  {label}
                </text>
              </g>
            );
          })}
        </g>
      )}
      {/* the winning bars fly into their slots */}
      {drops.map((d, k) => {
        if (d <= 0.002 || d >= 0.998) return null;
        const bi = CHOICE_BARS[FIELDS[k].pick];
        const p0 = { x: VX(bi)! + VX.bandwidth() / 2, y: BASE[k] - 30 };
        const p2 = { x: SLOTS[k].x + 40, y: SLOTS[k].y - 6 };
        const p1 = { x: (p0.x + p2.x) / 2, y: p0.y + 30 };
        const q = (a: number, m: number, z: number) => (1 - d) * (1 - d) * a + 2 * (1 - d) * d * m + d * d * z;
        return <Chip key={k} x={q(p0.x, p1.x, p2.x)} y={q(p0.y, p1.y, p2.y)} anchor="middle" text={`◆ ${FIELDS[k].choices[FIELDS[k].pick]}`} color={ROLE.CHECKED} fill="#062a1e" size={14} />;
      })}
      {legendU > 0.002 && (
        <g opacity={legendU}>
          <Label x={930} y={428} text="code writes" size={16} color={ROLE.OBSERVE} weight={700} />
          <Label x={930} y={450} text="names · punctuation" size={14} />
          <Label x={930} y={470} text="the exact enum label" size={14} />
          <Label x={930} y={490} text="booleans: real true / false" size={14} />
          <Label x={930} y={522} text="◆ model selects" size={16} color={ROLE.CHECKED} weight={700} />
          <Label x={930} y={543} text="which permitted choice" size={14} />
        </g>
      )}

      {/* beat 6 — chapter 1's tape, with the structure pieces never generated */}
      {tapeU > 0.002 && (
        <g opacity={tapeU}>
          {OUT_PIECES.map((p, i) => {
            const dec = DECISION.has(i);
            const su = dec ? 0 : clamp01(strikeU * 12 - i);
            return (
              <g key={i} opacity={clamp01(tapeU * 12 - i) * (1 - 0.6 * su)}>
                <Cell x={TAPE.x + i * TAPE.step} y={TAPE.y} w={TAPE.w} h={TAPE.h} text={p} size={11.5} tone={dec ? ROLE.CHECKED : ROLE.MODEL} dashed={!dec} strong={dec ? 1 : 0} />
                {su > 0.002 && <line x1={TAPE.x + i * TAPE.step + 4} x2={TAPE.x + i * TAPE.step + 4 + (TAPE.w - 8) * su} y1={TAPE.y + TAPE.h / 2} y2={TAPE.y + TAPE.h / 2} stroke={ROLE.INVALID} strokeWidth={2.4} />}
              </g>
            );
          })}
          <Label x={TAPE.x + 10 * TAPE.step + 8} y={TAPE.y + 21} text="✕ structure pieces: never generated here" u={clamp01(strikeU * 2 - 1)} size={15} weight={650} />
        </g>
      )}

      {/* beats 7–8 — is there a link between the rows' NEW answers? */}
      {indepU > 0.002 && (
        <g opacity={1 - closeU}>
          <path d={`M${MAT_RIGHT + 6} ${ROWS[0].y + 22}C${MAT_RIGHT + 44} ${ROWS[0].y + 30},${MAT_RIGHT + 44} ${ROWS[1].y + 14},${MAT_RIGHT + 8} ${ROWS[1].y + 22}`} fill="none" stroke={linkColor} strokeWidth={2.6} strokeDasharray={depU > 0.5 ? undefined : '6 5'} opacity={clamp01(indepU * 2)} />
          {depU > 0.5 ? (
            <path d={`M${MAT_RIGHT + 4} ${ROWS[1].y + 22}l12 -9l2 13Z`} fill={ROLE.PENDING} />
          ) : (
            <Label x={MAT_RIGHT + 35} y={ROWS[0].y + 66} anchor="middle" text="✕" size={22} color={ROLE.INVALID} weight={800} />
          )}
          <Label x={MAT.x} y={352} text="✓ independent: neither row sees the other's new answer" u={clamp01(indepU * 2 - 1) * (1 - depU)} size={15} color={ROLE.CHECKED} weight={650} />
          <Label x={MAT.x} y={352} text="? if topic changed what urgency may mean: a real dependency" u={depU} size={15} color={ROLE.PENDING} weight={650} />
          <Label x={MAT.x} y={374} text="→ represent it: ask in order, or choose jointly" u={clamp01(depU * 2 - 1)} size={15} />
        </g>
      )}
      <StatusTag x={740} y={362} kind="INTENDED" text="contract, not yet the browser demo" u={clamp01(indepU * 2 - 1) * (1 - closeU)} />

      <Panel x={250} y={392} w={780} h={150} u={closeU} stroke={ROLE.PENDING}>
        <text x={640} y={456} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={750}>
          Batch only what is truly independent.
        </text>
        <text x={640} y={494} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
          A real dependency gets represented — never assumed away.
        </text>
      </Panel>
    </Camera>
  );
}

export const vizScene = () => scene;
