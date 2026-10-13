// The Student Chooses Sixteen
//
// Source code (official anonymous repository, Cross-Tokenizer-OPD):
//   kdflow/algorithms/simple_ctkd.py — `training_step`: shared-vocabulary
//     projection via `student_overlap_token_ids` / `teacher_overlap_token_ids`.
//   kdflow/algorithms/byte_align_ctkd.py — `ByteAlignCrossTokenizerKD`
//     (ByteLevel pairs keep the legacy token-string overlap mapping).
//   kdflow/algorithms/topk_byte_align_ctkd.py — `select_student_topk_logits`:
//     `torch.topk(student_logits, k)` then `teacher_logits.gather(-1, topk_indices)`;
//     `TopKByteAlignCrossTokenizerKD` validates and applies `ctkd_topk`.
//   kdflow/loss/reverse_kl_div.py — `compute_reverse_kl_div`: float32
//     log_softmax on both reduced logit rows, student-weighted log-ratio sum.
//   run/topk_byte_align_ctkd/qwen25_7b_to_llama32_3b_topk_byte_align_ctkd.sh —
//     `--ctkd_topk 16`, `--kd_loss_fn rkl`, `--kd_ratio 1.0` (config default is 128).
// Paper evidence (arXiv 2610.08448v1):
//   §3.3–4; Table 5 — at k = 16 the selected entries retain ≥ 93.54 % teacher
//   and ≥ 94.55 % student probability mass on average (before distillation,
//   raw full-vocabulary softmax, scorable strict positions, all three pairs);
//   Table 2 — Qwen→Llama full average: Base 26.96, Strict full 32.86, top-16 32.64.
//
// Machine: the strict position from chapter 1 opens into one paired
// probability comb (student teeth up, teacher teeth down, one column per
// vocabulary entry). A shared-vocabulary mask drops unpaired teeth, the
// student's ranking lights sixteen columns, one index rail gathers the same
// sixteen teacher columns, both rows renormalize on that support, and the
// reverse-KL contributions pour into a strip beneath. The toy logits are
// labelled illustrative; measured numbers live in a separately labelled inset.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Small pure helpers (local to this book)
// ---------------------------------------------------------------------------
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const on = (b: number, i: number): number => clamp01(b - (i - 1));
const win = (b: number, i: number, j: number): number => on(b, i) * (1 - clamp01(b - j));

const INK = {
  student: '#38bdf8',
  teacher: colors.SECONDARY,
  strict: colors.POSITIVE,
  mismatch: colors.WARM,
  bad: colors.NEGATIVE,
  text: colors.TEXT,
  muted: colors.MUTED,
  faint: colors.ink.faint,
  panel: colors.PANEL,
  bg: colors.BG,
} as const;

function Txt({
  x, y, children, size = 16, fill = INK.text, opacity = 1, anchor = 'start', mono = false, weight = 400,
}: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string; opacity?: number;
  anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number;
}) {
  if (opacity <= 0.003) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={fill} opacity={opacity} textAnchor={anchor} fontWeight={weight}
      fontFamily={mono ? colors.font.mono : colors.font.ui}>
      {children}
    </text>
  );
}

const monoW = (text: string, size: number): number => text.length * size * 0.62;
function Chip({ x, y, text, color, opacity = 1, size = 17, anchor = 'middle' }: {
  x: number; y: number; text: string; color: string; opacity?: number; size?: number; anchor?: 'start' | 'middle' | 'end';
}) {
  if (opacity <= 0.003) return null;
  const w = monoW(text, size) + 20;
  const h = size + 14;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - h / 2} width={w} height={h} rx={6} fill={INK.panel} fillOpacity={0.92} stroke={color} strokeWidth={1.3} />
      <text x={left + w / 2} y={y + size * 0.36} fontSize={size} textAnchor="middle" fill={color} fontFamily={colors.font.mono}>{text}</text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Illustrative data — sampled vocabulary display (module scope)
// ---------------------------------------------------------------------------
const N_DISPLAY = 32; // display slots v1…v32 (real vocabularies are far larger)
const K = 16; // --ctkd_topk 16 in the example script
/** Display slots that exist on only one side (dropped by the overlap projection). */
const TEACHER_ONLY = new Set([2, 29]);
const STUDENT_ONLY = new Set([10, 23]);
const SHARED_SLOTS = Array.from({ length: N_DISPLAY }, (_, j) => j).filter((j) => !TEACHER_ONLY.has(j) && !STUDENT_ONLY.has(j));
const N_SHARED = SHARED_SLOTS.length; // 28
/** Student rank (0 = highest logit) of each shared slot, scrambled so the chosen columns scatter. */
const RANK_S = [5, 0, 19, 12, 2, 24, 8, 15, 1, 27, 21, 3, 10, 17, 6, 25, 13, 4, 20, 9, 26, 14, 7, 22, 11, 16, 23, 18] as const;
if (RANK_S.length !== N_SHARED || new Set(RANK_S).size !== N_SHARED || Math.max(...RANK_S) !== N_SHARED - 1) {
  throw new Error('chapter-2: RANK_S must be a permutation of 0..27');
}
/** Teacher rank: the student's order with nearby swaps, plus one far swap (student 9 ↔ 16). */
const RANK_SWAPS: Array<[number, number]> = [[0, 1], [4, 5], [11, 12], [20, 21], [9, 16]];
const RANK_T = RANK_S.map((r) => {
  for (const [a, b] of RANK_SWAPS) {
    if (r === a) return b;
    if (r === b) return a;
  }
  return r;
});
const STUDENT_STEP = -0.36;
const TEACHER_STEP = -0.32;

/** Per display slot: logits on each side (null when that side lacks the entry). */
const SLOT_LOGITS = Array.from({ length: N_DISPLAY }, (_, j) => {
  const si = SHARED_SLOTS.indexOf(j);
  if (si >= 0) return { s: STUDENT_STEP * RANK_S[si], t: TEACHER_STEP * RANK_T[si] };
  // one-sided entries sit at the bottom of their own side's ranking
  if (STUDENT_ONLY.has(j)) return { s: STUDENT_STEP * (N_SHARED + (j === 10 ? 0 : 1)), t: null };
  return { s: null, t: TEACHER_STEP * (N_SHARED + (j === 2 ? 0 : 1)) };
});

function softmax(logits: number[]): number[] {
  const m = Math.max(...logits);
  const ex = logits.map((z) => Math.exp(z - m));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}
/** Full (display) vocabulary softmax per side — the "raw" probabilities. */
const S_FULL_LOGITS = SLOT_LOGITS.map((l) => l.s).filter((z): z is number => z !== null);
const T_FULL_LOGITS = SLOT_LOGITS.map((l) => l.t).filter((z): z is number => z !== null);
const S_FULL_P = softmax(S_FULL_LOGITS);
const T_FULL_P = softmax(T_FULL_LOGITS);
const P_FULL = SLOT_LOGITS.map((l) => ({
  s: l.s === null ? 0 : S_FULL_P[S_FULL_LOGITS.indexOf(l.s)],
  t: l.t === null ? 0 : T_FULL_P[T_FULL_LOGITS.indexOf(l.t)],
}));

// select_student_topk_logits: torch.topk on the student's SHARED logits, gather teacher at those indices
const SHARED_S_LOGITS = SHARED_SLOTS.map((j) => SLOT_LOGITS[j].s as number);
const SHARED_T_LOGITS = SHARED_SLOTS.map((j) => SLOT_LOGITS[j].t as number);
const TOPK_INDICES = SHARED_S_LOGITS.map((z, i) => [z, i] as const).sort((a, b) => b[0] - a[0]).slice(0, K).map(([, i]) => i).sort((a, b) => a - b);
const SELECTED_SLOTS = TOPK_INDICES.map((i) => SHARED_SLOTS[i]); // display order
const S_TOPK_LOGITS = TOPK_INDICES.map((i) => SHARED_S_LOGITS[i]);
const T_TOPK_LOGITS = TOPK_INDICES.map((i) => SHARED_T_LOGITS[i]); // gather(-1, topk_indices)
// compute_reverse_kl_div: log_softmax both rows on the reduced support, student-weighted log ratio
const S_TOPK_P = softmax(S_TOPK_LOGITS);
const T_TOPK_P = softmax(T_TOPK_LOGITS);
const RKL_TERMS = S_TOPK_P.map((ps, i) => ps * (Math.log(ps) - Math.log(T_TOPK_P[i])));
const RKL = RKL_TERMS.reduce((a, b) => a + b, 0);
const RKL_MAX_ABS = Math.max(...RKL_TERMS.map((c) => Math.abs(c)));
/** The teacher's own 10th-highest shared entry (rank 9) is the student's 17th — gathered? no: not chosen. */
const UNCHOSEN_TEACHER_FAVOURITE = SHARED_SLOTS[RANK_T.indexOf(9)];
if (SELECTED_SLOTS.includes(UNCHOSEN_TEACHER_FAVOURITE)) throw new Error('chapter-2: the far swap must leave a teacher-preferred column unchosen');

// Measured values (paper)
const MASS_TEACHER_MIN = 93.54; // Table 5, k = 16, minimum over the three pairs
const MASS_STUDENT_MIN = 94.55;
const ACC_BASE = 26.96; // Table 2, Qwen2.5-7B-Instruct → Llama-3.2-3B-Instruct, full average
const ACC_STRICT_FULL = 32.86;
const ACC_TOP16 = 32.64;
const GAIN_RETAINED = ((ACC_TOP16 - ACC_BASE) / (ACC_STRICT_FULL - ACC_BASE)) * 100; // 96.27…

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const COMB = { x0: 120, x1: 1040, yS: 330, yT: 372, hMax: 118, pMax: 0.31 } as const;
const pitch = (n: number): number => (COMB.x1 - COMB.x0) / n;
const colX = (n: number, i: number): number => COMB.x0 + pitch(n) / 2 + i * pitch(n);
const barH = (p: number): number => (COMB.hMax * p) / COMB.pMax;
const STRIP_Y = 524; // reverse-KL contribution strip centre (strip + notes stay above y 575)
const STRIP_SCALE = 28 / RKL_MAX_ABS;
const INSET = { x: 120, y: 112, w: 1040, h: 200 } as const; // below the source line (y 90)
const SOURCE_Y = 90;
const AXIS2 = { x0: 400, x1: 1000, lo: 26.5, hi: 33.1 } as const;
const axis2X = (v: number): number => AXIS2.x0 + ((v - AXIS2.lo) / (AXIS2.hi - AXIS2.lo)) * (AXIS2.x1 - AXIS2.x0);
const SLOT = { x: 640, yS: 268, yT: 408, w: 300, h: 60 } as const; // chapter-1 endpoint reprise

// ---------------------------------------------------------------------------
// Narration contract — ten fixed captions, at = 0.6 + 7.7·i, dur 6.8, hold → 78 s
// ---------------------------------------------------------------------------
const CAPTIONS = [
  'At a strict position, both models predict what comes next. Their vocabularies still need a shared set of entries to compare.',
  'The implementation gathers corresponding vocabulary entries into matching columns. Each column now refers to the same candidate on both sides.',
  'Then the student picks its sixteen highest scoring shared entries. The teacher is evaluated on those exact same choices.',
  'The teacher does not pick a second list. Its scores are gathered using the indices chosen by the student.',
  'Both rows are normalized again over the selected entries. Each row now sums to one inside this smaller comparison.',
  "Reverse Kullback Leibler divergence weights the log probability differences by the student's probabilities.",
  'Before training, the paper measures how much original probability sits on these selected entries, before that normalization.',
  'Across the three studied pairs, sixteen student choices retain at least ninety-three point five four percent of teacher probability, on average.',
  'Training with those sixteen entries preserves at least ninety-six percent of the improvement achieved by the full shared vocabulary.',
  "Sixteen is the example script's setting, not a universal optimum. The result is that a compact comparison can preserve most of the measured gain.",
] as const;
const CAPTION_AT = (i: number): number => 0.6 + 7.7 * i;
const CAPTION_DUR = 6.8;
const CHAPTER_DUR = 78;

const SOURCES = [
  'simple_ctkd.py `training_step` · paper §2.3',
  'simple_ctkd.py · byte_align_ctkd.py — student_overlap_token_ids / teacher_overlap_token_ids',
  'topk_byte_align_ctkd.py `select_student_topk_logits` — torch.topk(student_logits, k)',
  'topk_byte_align_ctkd.py — teacher_logits.gather(-1, topk_indices)',
  'reverse_kl_div.py — torch.log_softmax(…, dtype=torch.float32) on the reduced rows',
  'reverse_kl_div.py `compute_reverse_kl_div` — (student_probs * (student_log_probs − teacher_log_probs)).sum(-1)',
  'paper §4 · Table 5 — probability-mass probe before distillation',
  'paper Table 5 — k = 16, mean over scorable strict positions, three pairs',
  'paper Table 2 — Qwen2.5-7B-Instruct → Llama-3.2-3B-Instruct, full-average accuracy (%)',
  'run/topk_byte_align_ctkd/qwen25_7b_to_llama32_3b_topk_byte_align_ctkd.sh · ctkd_topk default 128',
] as const;

function narrate(tl: Timeline): ChannelRef<number> {
  const beat = tl.channel('beat', -1);
  CAPTIONS.forEach((text, i) => {
    tl.caption({ at: CAPTION_AT(i), dur: CAPTION_DUR, text });
    tl.tween(beat, i, { at: CAPTION_AT(i), dur: 0.6, ease: ease.enter });
  });
  tl.hold(CHAPTER_DUR - 1, 1);
  return beat;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = narrate(tl);
  const slotU = tl.channel('slotU', 0); // chapter-1 slot pair reprise
  const combU = tl.channel('combU', 0); // full comb fades up (teeth stagger)
  const maskU = tl.channel('maskU', 0); // unpaired teeth drop; shared columns re-pack
  const selectU = tl.channel('selectU', 0); // sixteen student teeth illuminate
  const railU = tl.channel('railU', 0); // index rail student → teacher
  const normU = tl.channel('normU', 0); // spread to 16 columns + renormalized heights
  const rklU = tl.channel('rklU', 0); // contributions pour in, column by column
  const insetU = tl.channel('insetU', 0); // paper-data inset slides in
  const massU = tl.channel('massU', 0); // Table 5 bars
  const tab2U = tl.channel('tab2U', 0); // Table 2 number line
  const fadeU = tl.channel('fadeU', 0); // inset + strip → whisper
  const endU = tl.channel('endU', 0); // final script labels

  // BEAT 0 — the strict position opens into a comb
  let t = CAPTION_AT(0);
  tl.tween(slotU, 1, { at: t + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(slotU, 0, { at: t + 2.2, dur: 0.9, ease: ease.move });
  tl.tween(combU, 1, { at: t + 2.4, dur: 2.2, ease: ease.linear });

  // BEAT 1 — shared-vocabulary projection
  t = CAPTION_AT(1);
  tl.tween(maskU, 1, { at: t + 0.8, dur: 1.4, ease: ease.move });

  // BEAT 2 — the student picks sixteen
  // (no camera zoom: the student/teacher row labels at x ≈ 40 must stay visible)
  t = CAPTION_AT(2);
  tl.tween(selectU, 1, { at: t + 0.6, dur: 1.8, ease: ease.linear });

  // BEAT 3 — one index rail, no second list
  t = CAPTION_AT(3);
  tl.tween(railU, 1, { at: t + 0.5, dur: 1.2, ease: ease.draw });

  // BEAT 4 — renormalize on the chosen support
  t = CAPTION_AT(4);
  tl.tween(normU, 1, { at: t + 0.4, dur: 1.4, ease: ease.move });

  // BEAT 5 — reverse KL contributions
  t = CAPTION_AT(5);
  tl.tween(rklU, 1, { at: t + 0.8, dur: 2.4, ease: ease.linear });

  // BEAT 6 — the measured inset (raw mass, before renormalization)
  t = CAPTION_AT(6);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(insetU, 1, { at: t + 0.7, dur: 1.2, ease: ease.move });

  // BEAT 7 — ≥ 93.54 % teacher mass
  t = CAPTION_AT(7);
  tl.tween(massU, 1, { at: t + 0.5, dur: 1.6, ease: ease.draw });

  // BEAT 8 — gain retention (Table 2)
  t = CAPTION_AT(8);
  tl.tween(tab2U, 1, { at: t + 0.8, dur: 1.6, ease: ease.draw });

  // BEAT 9 — clean sixteen-tooth comb with the script flags
  t = CAPTION_AT(9);
  tl.tween(fadeU, 1, { at: t + 0.1, dur: 0.9, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 380, k: 1.02 }, { at: t + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(endU, 1, { at: t + 1.4, dur: 0.6, ease: ease.enter });

  return { tl, cam, beat, slotU, combU, maskU, selectU, railU, normU, rklU, insetU, massU, tab2U, fadeU, endU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const slot = s.get(scene.slotU);
  const comb = s.get(scene.combU);
  const mask = s.get(scene.maskU);
  const sel = s.get(scene.selectU);
  const rail = s.get(scene.railU);
  const norm = s.get(scene.normU);
  const rkl = s.get(scene.rklU);
  const inset = s.get(scene.insetU);
  const mass = s.get(scene.massU);
  const tab2 = s.get(scene.tab2U);
  const fade = s.get(scene.fadeU);
  const end = s.get(scene.endU);

  const barW = lerp(lerp(18, 22, mask), 36, norm);
  const sumS = S_TOPK_P.reduce((a, c) => a + c, 0);
  const sumT = T_TOPK_P.reduce((a, c) => a + c, 0);

  // each column's geometry is closed-form in (mask, norm, sel)
  const columns = Array.from({ length: N_DISPLAY }, (_, j) => {
    const si = SHARED_SLOTS.indexOf(j);
    const ki = SELECTED_SLOTS.indexOf(j);
    const xA = colX(N_DISPLAY, j);
    const xB = si >= 0 ? colX(N_SHARED, si) : xA;
    const xShared = lerp(xA, xB, mask);
    const x = ki >= 0 ? lerp(xShared, colX(K, ki), norm) : xShared;
    const enter = clamp01(comb * (N_DISPLAY + 4) - j - 1);
    const unpaired = si < 0;
    let o = enter;
    if (unpaired) o *= lerp(1, 0.12, mask) * (1 - norm);
    else if (ki < 0) o *= lerp(1, 0.22, sel) * (1 - norm);
    const hS = ki >= 0 ? lerp(barH(P_FULL[j].s), barH(S_TOPK_P[ki]), norm) : barH(P_FULL[j].s);
    const hT = ki >= 0 ? lerp(barH(P_FULL[j].t), barH(T_TOPK_P[ki]), norm) : barH(P_FULL[j].t);
    return { j, si, ki, x, o, hS, hT, unpaired };
  });

  const insetY = lerp(-INSET.h - 40, INSET.y, inset);
  const insetO = clamp01(inset * 2) * (1 - fade); // fully gone once the final beat arrives
  const combDim = lerp(1, 0.18, insetO); // the comb yields while the measured tables are foreground

  return (
    <g>
      <Camera {...s.get(scene.cam)}>
        {/* ------------------------------ beat 0: the chapter-1 endpoint */}
        {slot > 0.003 && (
          <g opacity={slot}>
            <rect x={SLOT.x - SLOT.w / 2} y={SLOT.yS - SLOT.h / 2} width={SLOT.w} height={SLOT.h} rx={8} fill={INK.student} fillOpacity={0.14} stroke={INK.student} strokeWidth={1.8} />
            <rect x={SLOT.x - SLOT.w / 2} y={SLOT.yT - SLOT.h / 2} width={SLOT.w} height={SLOT.h} rx={8} fill={INK.teacher} fillOpacity={0.14} stroke={INK.teacher} strokeWidth={1.8} />
            <line x1={SLOT.x} y1={SLOT.yS + SLOT.h / 2} x2={SLOT.x} y2={SLOT.yT - SLOT.h / 2} stroke={INK.strict} strokeWidth={3} />
            <circle cx={SLOT.x} cy={(SLOT.yS + SLOT.yT) / 2} r={7} fill={INK.strict} />
            <Txt x={SLOT.x} y={SLOT.yS + 8} size={22} anchor="middle" mono fill={INK.student}>student: next token ?</Txt>
            <Txt x={SLOT.x} y={SLOT.yT + 8} size={22} anchor="middle" mono fill={INK.teacher}>teacher: next token ?</Txt>
          </g>
        )}

        {/* ------------------------------ the comb (persistent) */}
        <g opacity={clamp01(comb * 4) * combDim}>
          <line x1={COMB.x0} y1={COMB.yS} x2={COMB.x1} y2={COMB.yS} stroke={colors.ink.axis} strokeWidth={1.5} />
          <line x1={COMB.x0} y1={COMB.yT} x2={COMB.x1} y2={COMB.yT} stroke={colors.ink.axis} strokeWidth={1.5} />
          <Txt x={COMB.x0 - 10} y={COMB.yS - 40} size={20} anchor="end" fill={INK.student} weight={600}>student</Txt>
          <Txt x={COMB.x0 - 10} y={COMB.yT + 54} size={20} anchor="end" fill={INK.teacher} weight={600}>teacher</Txt>
        </g>
        {columns.map((c) => {
          if (c.o <= 0.003) return null;
          const isSel = c.ki >= 0;
          const sGlow = isSel ? lerp(0.55, 1, sel) : 0.55;
          const tGlow = isSel ? lerp(0.55, 1, clamp01(sel * 2 - 0.6)) : 0.55;
          const hasS = SLOT_LOGITS[c.j].s !== null;
          const hasT = SLOT_LOGITS[c.j].t !== null;
          return (
            <g key={c.j} opacity={c.o * combDim}>
              {hasS ? (
                <rect x={c.x - barW / 2} y={COMB.yS - c.hS} width={barW} height={c.hS} rx={3} fill={INK.student} opacity={sGlow} />
              ) : (
                <rect x={c.x - barW / 2} y={COMB.yS - 22} width={barW} height={22} rx={3} fill="none" stroke={INK.student} strokeDasharray="3 3" opacity={0.6} />
              )}
              {hasT ? (
                <rect x={c.x - barW / 2} y={COMB.yT} width={barW} height={c.hT} rx={3} fill={INK.teacher} opacity={tGlow} />
              ) : (
                <rect x={c.x - barW / 2} y={COMB.yT} width={barW} height={22} rx={3} fill="none" stroke={INK.teacher} strokeDasharray="3 3" opacity={0.6} />
              )}
              <Txt x={c.x} y={COMB.yS + 26} size={15} anchor="middle" mono fill={isSel ? INK.text : INK.muted}>{`v${c.j + 1}`}</Txt>
              {c.unpaired && (
                <Txt x={c.x} y={COMB.yS + 26} size={18} anchor="middle" fill={INK.bad} opacity={mask * 2}>×</Txt>
              )}
              {/* student rank badge on the chosen sixteen */}
              {isSel && (
                <Txt x={c.x} y={COMB.yS - c.hS - 8} size={14} anchor="middle" mono fill={INK.student}
                  opacity={clamp01(sel * 3 - 1) * win(b, 2, 4)}>
                  {`#${RANK_S[c.si] + 1}`}
                </Txt>
              )}
              {/* the index rail: student column → same teacher column */}
              {isSel && rail > 0.003 && (
                <line x1={c.x} y1={COMB.yS - c.hS} x2={c.x} y2={lerp(COMB.yS - c.hS, COMB.yT + c.hT, rail)}
                  stroke={INK.strict} strokeWidth={1.4} opacity={0.5 * (1 - fade)} />
              )}
              {/* reverse-KL contribution beneath */}
              {isSel && rkl > 0.003 && (() => {
                const u = clamp01(rkl * K - c.ki);
                const v = RKL_TERMS[c.ki] * STRIP_SCALE * u;
                return (
                  <g opacity={clamp01(u * 2) * (1 - fade)}>
                    <rect x={c.x - barW / 2} y={v >= 0 ? STRIP_Y - v : STRIP_Y} width={barW} height={Math.abs(v)} rx={2}
                      fill={v >= 0 ? INK.strict : INK.bad} opacity={0.85} />
                    <line x1={c.x} y1={COMB.yT + c.hT} x2={c.x} y2={lerp(COMB.yT + c.hT, STRIP_Y, u)} stroke={INK.student} strokeWidth={1} opacity={0.3} />
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* the teacher's own favourite that the student did not choose */}
        {(() => {
          const c = columns[UNCHOSEN_TEACHER_FAVOURITE];
          const o = win(b, 3, 3) * (1 - norm) * clamp01(rail * 2);
          if (o <= 0.003) return null;
          return (
            <g opacity={o}>
              <rect x={c.x - barW / 2 - 5} y={COMB.yT - 4} width={barW + 10} height={c.hT + 8} rx={5} fill="none" stroke={INK.teacher} strokeWidth={1.4} strokeDasharray="5 3" />
              <Txt x={c.x} y={COMB.yT + c.hT + 24} size={16} anchor="middle" fill={INK.teacher}>teacher's 10th-highest</Txt>
              <Txt x={c.x} y={COMB.yT + c.hT + 44} size={16} anchor="middle" fill={INK.muted}>student rank 17 · not gathered</Txt>
            </g>
          );
        })()}

        {/* beat 1–3 code chips */}
        <Chip x={COMB.x0} y={COMB.yS - COMB.hMax - 42} text="student_overlap_token_ids" color={INK.student} size={16} anchor="start" opacity={win(b, 1, 3) * mask} />
        <Chip x={COMB.x0} y={COMB.yT + COMB.hMax + 60} text="teacher_overlap_token_ids" color={INK.teacher} size={16} anchor="start" opacity={win(b, 1, 3) * mask} />
        <Txt x={620} y={160} size={22} anchor="middle" fill={INK.student} weight={600} opacity={win(b, 2, 3) * clamp01(sel * 3)}>
          {`torch.topk(student shared logits, k = ${K})`}
        </Txt>
        <Chip x={620} y={196} text="select_student_topk_logits" color={INK.student} opacity={win(b, 2, 3) * clamp01(sel * 3)} />
        <Chip x={680} y={COMB.yT + COMB.hMax + 60} text="teacher_logits.gather(-1, topk_indices)" color={INK.strict} opacity={win(b, 3, 3) * clamp01(rail * 3)} />

        {/* beat 4 — renormalization */}
        <MathLabel tex={'p_S(v)=\\frac{e^{z_S(v)}}{\\sum_{u\\in K}e^{z_S(u)}},\\qquad p_T(v)=\\frac{e^{z_T(v)}}{\\sum_{u\\in K}e^{z_T(u)}}'} x={510} y={160}
          fontSize={26} boxWidth={740} opacity={win(b, 4, 4) * clamp01(norm * 3)} />
        {/* badges sit beneath the fixed header (y 65) and right of the math box (ends x ≈ 880) */}
        <Chip x={1180} y={118} text="log_softmax · dtype float32" color={INK.text} size={14} anchor="end" opacity={win(b, 4, 5) * clamp01(norm * 3)} />
        <Chip x={1180} y={152} text={`Renormalized support · K = ${K}`} color={INK.strict} size={14} anchor="end" opacity={win(b, 4, 5) * clamp01(norm * 3)} />
        <Txt x={COMB.x1 + 14} y={COMB.yS - 10} size={20} mono fill={INK.student} opacity={on(b, 4) * clamp01(norm * 2 - 1) * (1 - fade)}>
          {`Σ = ${sumS.toFixed(3)}`}
        </Txt>
        <Txt x={COMB.x1 + 14} y={COMB.yT + 24} size={20} mono fill={INK.teacher} opacity={on(b, 4) * clamp01(norm * 2 - 1) * (1 - fade)}>
          {`Σ = ${sumT.toFixed(3)}`}
        </Txt>

        {/* beat 5 — reverse KL */}
        <MathLabel tex={'D_{KL}(p_S\\Vert p_T)=\\sum_{v\\in K}p_S(v)\\log\\frac{p_S(v)}{p_T(v)}'} x={510} y={160}
          fontSize={28} boxWidth={700} opacity={win(b, 5, 5)} />
        <g opacity={clamp01(rkl * 4) * (1 - fade) * combDim}>
          <line x1={COMB.x0} y1={STRIP_Y} x2={COMB.x1} y2={STRIP_Y} stroke={colors.ink.axis} strokeWidth={1.2} />
          <Txt x={COMB.x0 - 10} y={STRIP_Y + 5} size={16} anchor="end" fill={INK.muted}>terms</Txt>
          <Txt x={COMB.x1 + 14} y={STRIP_Y - 6} size={18} mono fill={INK.text} opacity={clamp01(rkl * 2 - 1)}>rkl_div =</Txt>
          <Txt x={COMB.x1 + 14} y={STRIP_Y + 20} size={24} mono fill={INK.strict} weight={600} opacity={clamp01(rkl * 2 - 1)}>
            {RKL.toFixed(4)}
          </Txt>
          <Txt x={COMB.x0} y={STRIP_Y + 44} size={15} fill={INK.muted} opacity={win(b, 5, 5)}>
            green terms positive, rose terms negative · the sum is never negative
          </Txt>
        </g>

        {/* ------------------------------ paper-data inset (beats 6–9) */}
        {inset > 0.003 && (
          <g opacity={insetO}>
            <rect x={INSET.x} y={insetY} width={INSET.w} height={INSET.h} rx={10} fill={INK.panel} fillOpacity={0.96} stroke={colors.ink.axis} />
            <Txt x={INSET.x + 18} y={insetY + 24} size={16} mono fill={INK.mismatch} opacity={win(b, 6, 7)}>
              PAPER DATA · Table 5 · before distillation · raw full-vocabulary mass
            </Txt>
            <Txt x={INSET.x + 18} y={insetY + 24} size={16} mono fill={INK.mismatch} opacity={on(b, 8)}>
              PAPER DATA · Table 2 · Qwen2.5-7B-Instruct → Llama-3.2-3B-Instruct · full-average accuracy (%)
            </Txt>
            {/* beat 6 explainer, beat 7 bars */}
            <g opacity={win(b, 6, 7)}>
              <Txt x={INSET.x + 18} y={insetY + 60} size={18} fill={INK.muted} opacity={1 - clamp01(mass * 3)}>
                original softmax probabilities, summed over the sixteen student-selected entries,
              </Txt>
              <Txt x={INSET.x + 18} y={insetY + 86} size={18} fill={INK.muted} opacity={1 - clamp01(mass * 3)}>
                measured on student responses sampled before training — no renormalization yet
              </Txt>
              <g opacity={clamp01(mass * 3)}>
                <Txt x={INSET.x + 18} y={insetY + 66} size={22} fill={INK.teacher} weight={600}>teacher mass retained</Txt>
                <rect x={AXIS2.x0} y={insetY + 50} width={AXIS2.x1 - AXIS2.x0} height={24} rx={5} fill={INK.bg} stroke={colors.ink.axis} />
                <rect x={AXIS2.x0} y={insetY + 50} width={(AXIS2.x1 - AXIS2.x0) * (MASS_TEACHER_MIN / 100) * mass} height={24} rx={5} fill={INK.teacher} opacity={0.85} />
                <Txt x={AXIS2.x1 + 14} y={insetY + 69} size={24} weight={700} fill={INK.teacher} opacity={clamp01(mass * 2 - 1)}>{`≥ ${MASS_TEACHER_MIN.toFixed(2)}%`}</Txt>
                <Txt x={INSET.x + 18} y={insetY + 106} size={20} fill={INK.student} opacity={0.8}>student mass retained</Txt>
                <rect x={AXIS2.x0} y={insetY + 90} width={AXIS2.x1 - AXIS2.x0} height={18} rx={4} fill={INK.bg} stroke={colors.ink.axis} />
                <rect x={AXIS2.x0} y={insetY + 90} width={(AXIS2.x1 - AXIS2.x0) * (MASS_STUDENT_MIN / 100) * mass} height={18} rx={4} fill={INK.student} opacity={0.6} />
                <Txt x={AXIS2.x1 + 14} y={insetY + 106} size={20} weight={600} fill={INK.student} opacity={0.8 * clamp01(mass * 2 - 1)}>{`≥ ${MASS_STUDENT_MIN.toFixed(2)}%`}</Txt>
                <Txt x={INSET.x + 18} y={insetY + 136} size={16} mono fill={INK.muted}>
                  mean over scorable strict positions · min of 3 pairs at k = 16 · not a per-token guarantee
                </Txt>
              </g>
            </g>
            {/* beat 8 — Table 2 number line (heading row 24 · markers 64/88 · axis 110 · ticks 132 · formula 164 · summary 188) */}
            <g opacity={on(b, 8) * clamp01(tab2 * 3)}>
              <line x1={AXIS2.x0} y1={insetY + 110} x2={lerp(AXIS2.x0, AXIS2.x1, clamp01(tab2 * 1.5))} y2={insetY + 110} stroke={colors.ink.axis} strokeWidth={2} />
              {[27, 28, 29, 30, 31, 32, 33].map((v) => (
                <g key={v} opacity={clamp01(tab2 * 1.5 - (v - AXIS2.lo) / (AXIS2.hi - AXIS2.lo))}>
                  <line x1={axis2X(v)} y1={insetY + 106} x2={axis2X(v)} y2={insetY + 114} stroke={colors.ink.axis} />
                  <Txt x={axis2X(v)} y={insetY + 132} size={14} anchor="middle" mono fill={INK.muted}>{String(v)}</Txt>
                </g>
              ))}
              {[
                { v: ACC_BASE, label: 'Base', color: INK.muted, dy: -22 },
                { v: ACC_TOP16, label: 'top-16', color: INK.student, dy: -22 },
                { v: ACC_STRICT_FULL, label: 'Strict full', color: INK.strict, dy: -46 },
              ].map((m) => (
                <g key={m.label} opacity={clamp01(tab2 * 1.5 - (m.v - AXIS2.lo) / (AXIS2.hi - AXIS2.lo))}>
                  <circle cx={axis2X(m.v)} cy={insetY + 110} r={7} fill={m.color} />
                  <Txt x={axis2X(m.v)} y={insetY + 110 + m.dy} size={18} anchor="middle" fill={m.color} weight={600}>
                    {`${m.label} ${m.v.toFixed(2)}`}
                  </Txt>
                </g>
              ))}
              <Txt x={INSET.x + 18} y={insetY + 94} size={18} fill={INK.muted}>full-average</Txt>
              <Txt x={INSET.x + 18} y={insetY + 116} size={18} fill={INK.muted}>accuracy (%)</Txt>
              <Txt x={INSET.x + 18} y={insetY + 164} size={18} mono fill={INK.text} opacity={clamp01(tab2 * 2 - 1)}>
                {`(${ACC_TOP16.toFixed(2)} − ${ACC_BASE.toFixed(2)}) / (${ACC_STRICT_FULL.toFixed(2)} − ${ACC_BASE.toFixed(2)}) = ${GAIN_RETAINED.toFixed(2)}% of the gain retained`}
              </Txt>
              <Txt x={INSET.x + 18} y={insetY + 188} size={16} fill={INK.strict} opacity={clamp01(tab2 * 2 - 1)}>
                across the three pairs: at least 96%
              </Txt>
            </g>
          </g>
        )}

        {/* ------------------------------ beat 9: the script's settings */}
        <g opacity={end}>
          <Chip x={480} y={STRIP_Y - 4} text="--ctkd_topk 16" color={INK.student} size={22} />
          <Chip x={760} y={STRIP_Y - 4} text="--kd_loss_fn rkl" color={INK.strict} size={22} />
          <Txt x={620} y={STRIP_Y + 40} size={18} anchor="middle" fill={INK.muted}>
            example script setting · the ctkd_topk default is 128 · a compact comparison that keeps most of the measured gain
          </Txt>
        </g>
      </Camera>

      {/* ------------------------------ screen-fixed overlays */}
      <Txt x={90} y={65} size={26} weight={600}>The Student Chooses Sixteen</Txt>
      <Txt x={1190} y={65} size={16} anchor="end" fill={INK.muted} opacity={clamp01(comb * 3)}>
        Illustrative logits · sampled vocabulary display (v1…v32), not observed model logits
      </Txt>
      {/* one source note at a time: clean cut at each beat midpoint (no crossfade) */}
      <Txt x={90} y={SOURCE_Y} size={15} fill={INK.muted} mono opacity={0.9}>
        {SOURCES[Math.min(SOURCES.length - 1, Math.max(0, Math.round(b)))]}
      </Txt>
    </g>
  );
}

export const vizScene = () => scene;
