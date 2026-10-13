// One Response, Two Rulers
//
// Source code (official anonymous repository, Cross-Tokenizer-OPD):
//   kdflow/token_alignment.py — `_split_on_eos`, `_align_segment_1to1`
//     (whole-stream byte equality, then teacher_ends/student_ends boundary
//     scan, strict groups = one equal nonempty piece per side),
//     `align_byte_spans_1to1` (paired EOS appended separately),
//     `align_byte_span_batch_1to1` (each sample aligned independently).
//   kdflow/trainer/data_processor/rollout_data_processor.py — `_build_rollout_sample`.
// Paper evidence (arXiv 2610.08448v1):
//   §2.2–2.3 (one response, two tokenizations, strict 1:1 groups);
//   Table 1 — Qwen2.5-7B-Instruct → Llama-3.2-3B-Instruct: vocabulary
//   Jaccard 64.32%, strict student-token coverage 93.56% over steps 1–100.
//
// Machine: one illustrative response `We build models.` laid over two token
// rows. The rows slide onto a shared byte ruler, a sweep cursor discovers the
// common boundaries, and a strict gate locks only the one-to-one groups in
// green while the 2:1 group turns amber. The SAME tape then compresses to the
// top so the two measured denominators can be compared beneath it, and one
// strict position rises into the pair of prediction slots chapter 2 opens on.
// The token boundaries are a constructed partition example, not output of the
// named production tokenizers; the measured percentages come from Table 1 only.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Small pure helpers (local to this book)
// ---------------------------------------------------------------------------
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** 0→1 as beat i arrives (stays 1 afterwards). */
const on = (b: number, i: number): number => clamp01(b - (i - 1));
/** 1 during beats i…j, fading in at i and out as j+1 arrives. */
const win = (b: number, i: number, j: number): number => on(b, i) * (1 - clamp01(b - j));

const INK = {
  student: '#38bdf8', // blue — student
  teacher: colors.SECONDARY, // purple — teacher
  strict: colors.POSITIVE, // green — strict 1:1
  mismatch: colors.WARM, // amber — skipped group
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

// ---------------------------------------------------------------------------
// Data — the illustrative response and its two partitions (module scope)
// ---------------------------------------------------------------------------
const RESPONSE = 'We build models.';
const STUDENT_PIECES = ['We', ' build', ' models', '.'] as const;
const TEACHER_PIECES = ['We', ' bu', 'ild', ' models', '.'] as const;
/** Equal-length ghost used by beat 2: same byte count, different final byte. */
const TEACHER_GHOST_LAST = '!';

const ENC = new TextEncoder();
const byteLen = (piece: string): number => ENC.encode(piece).length;
const bytesOf = (pieces: readonly string[]): string => Array.from(ENC.encode(pieces.join(''))).join(',');

const TOTAL_BYTES = byteLen(RESPONSE); // 16
if (STUDENT_PIECES.join('') !== RESPONSE || TEACHER_PIECES.join('') !== RESPONSE) {
  throw new Error('chapter-1: token partitions must reconstruct the response');
}

interface Span { piece: string; start: number; end: number }
function spansOf(pieces: readonly string[]): Span[] {
  let cursor = 0;
  return pieces.map((piece) => {
    const start = cursor;
    cursor += byteLen(piece);
    return { piece, start, end: cursor };
  });
}
const S_SPANS = spansOf(STUDENT_PIECES);
const T_SPANS = spansOf(TEACHER_PIECES);

interface Group { start: number; end: number; t: number[]; s: number[]; strict: boolean }
/**
 * TypeScript port of `_align_segment_1to1` that also reports the groups it
 * walks over (the Python returns only the strict index pairs). Same rule set:
 * whole-stream byte equality first, then common boundaries close groups, and a
 * group is strict only when it holds exactly one equal, nonempty piece per side.
 */
function alignGroups(teacher: readonly string[], student: readonly string[]): { groups: Group[]; equal: boolean } {
  if (bytesOf(teacher) !== bytesOf(student)) return { groups: [], equal: false };
  const tEnds = spansOf(teacher).map((sp) => sp.end);
  const sEnds = spansOf(student).map((sp) => sp.end);
  const groups: Group[] = [];
  let ti = 0, si = 0, tgs = 0, sgs = 0;
  while (ti < tEnds.length && si < sEnds.length) {
    const te = tEnds[ti], se = sEnds[si];
    if (te < se) { ti++; continue; }
    if (te > se) { si++; continue; }
    const start = tgs === 0 ? 0 : tEnds[tgs - 1];
    const t: number[] = [], s: number[] = [];
    for (let k = tgs; k <= ti; k++) t.push(k);
    for (let k = sgs; k <= si; k++) s.push(k);
    const strict = t.length === 1 && s.length === 1 && teacher[ti] === student[si] && teacher[ti].length > 0;
    groups.push({ start, end: te, t, s, strict });
    ti++; si++; tgs = ti; sgs = si;
  }
  return { groups, equal: true };
}
const ALIGN = alignGroups(TEACHER_PIECES, STUDENT_PIECES);
const GROUPS = ALIGN.groups;
// expected strict pairs teacher/student (0,0), (3,2), (4,3); [2,8) is 2:1 and skipped
const STRICT_PAIRS = GROUPS.filter((g) => g.strict).map((g) => [g.t[0], g.s[0]] as const); // [[0,0],[3,2],[4,3]]
if (STRICT_PAIRS.length !== 3 || GROUPS.length !== 4) throw new Error('chapter-1: unexpected alignment of the toy partition');
// equal length, different final byte → the aligner returns no content pairs
if (alignGroups([...TEACHER_PIECES.slice(0, -1), TEACHER_GHOST_LAST], STUDENT_PIECES).equal) {
  throw new Error('chapter-1: ghost partition must be rejected');
}
const MISMATCH = GROUPS.find((g) => !g.strict) ?? GROUPS[1];
const RISE_GROUP = GROUPS.find((g) => g.strict && g.start >= 8) ?? GROUPS[0]; // ` models`

// Measured values — paper Table 1 (Qwen2.5-7B-Instruct → Llama-3.2-3B-Instruct)
const JACCARD_PCT = 64.32;
const COVERAGE_PCT = 93.56;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const RULER = { x0: 170, x1: 1110, y: 340 } as const;
const PX = (RULER.x1 - RULER.x0) / TOTAL_BYTES; // 58.75 px per byte
const bx = (b: number): number => RULER.x0 + b * PX;
const ROW = { student: 262, teacher: 418, h: 46 } as const;
const CHIP_FONT = 22;
const monoW = (text: string, size: number): number => text.length * size * 0.62;

/** Loose (pre-ruler) layout: chips sized by character count, centred. */
function looseLayout(spans: Span[]): Array<{ x: number; w: number }> {
  const gap = 16;
  const widths = spans.map((sp) => monoW(sp.piece, CHIP_FONT) + 28);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
  let x = 640 - total / 2;
  return widths.map((w) => {
    const out = { x, w };
    x += w + gap;
    return out;
  });
}
const S_LOOSE = looseLayout(S_SPANS);
const T_LOOSE = looseLayout(T_SPANS);
const rulerLayout = (sp: Span): { x: number; w: number } => ({ x: bx(sp.start) + 3, w: (sp.end - sp.start) * PX - 6 });

const EOS_X = RULER.x1 + 62;
const SAMPLE2_Y = 516;
const GROUP_LABEL_Y = ROW.teacher + ROW.h / 2 + 28; // group labels sit below the teacher chips
const SOURCE_Y = 90; // source line lives under the title; y ≥ 575 is reserved for captions
const NOTE_Y = RULER.y - 118; // ruler description + code label, above the student row

// Tape compression (beats 7–9): scale about the ruler centre, then lift.
const COMPRESS_K = 0.64;
const COMPRESS_DY = -128;
const cmp = (x: number, y: number, c: number): { x: number; y: number } => ({
  x: 640 + (x - 640) * lerp(1, COMPRESS_K, c),
  y: RULER.y + (y - RULER.y) * lerp(1, COMPRESS_K, c) + lerp(0, COMPRESS_DY, c),
});

// Measured bars (beats 7–8)
const BAR = { x0: 170, x1: 1010, h: 30 } as const;
const BAR_COV_Y = 340;
const BAR_JAC_Y = 450;
const barW = (pct: number, u: number): number => (BAR.x1 - BAR.x0) * (pct / 100) * u;

// Final slots (beat 9)
const SLOT = { x: 640, yS: 268, yT: 408, w: 300, h: 60 } as const;

// ---------------------------------------------------------------------------
// Narration contract — ten fixed captions, at = 0.6 + 7.5·i, dur 6.6, hold → 76 s
// ---------------------------------------------------------------------------
const CAPTIONS = [
  'The student writes a response. Its teacher must judge that same text, even when the two models cut it into different tokens.',
  'Put both tokenizations on one byte ruler. Now their boundaries describe positions in the same response.',
  'First, the code checks that both rows reconstruct exactly the same bytes. Equal length alone would pair unrelated text.',
  'A boundary shared by both rows closes a group. One token on each side makes that group a strict match.',
  'Here, one student token faces two teacher tokens. They cover the same text, but this group receives no strict loss.',
  'The next shared token lines up again. A mismatch does not prevent the remaining response from contributing.',
  "End markers are paired separately when both are present. Each sample starts a fresh ruler, so alignment cannot cross between responses.",
  "In the paper's Qwen to Llama run, strict groups cover about ninety-four percent of student tokens.",
  'The vocabularies overlap much less by a simple set count. Counting dictionary entries does not tell you which tokens the student actually uses.',
  'That gives us reliable places to compare predictions. Next, we choose which possible next tokens belong in each comparison.',
] as const;
const CAPTION_AT = (i: number): number => 0.6 + 7.5 * i;
const CAPTION_DUR = 6.6;
const CHAPTER_DUR = 76;

const SOURCES = [
  'paper §2.2–2.3 · rollout_data_processor.py `_build_rollout_sample`',
  'kdflow/token_alignment.py `align_byte_spans_1to1`',
  'token_alignment.py `_align_segment_1to1` — early return on byte mismatch',
  'token_alignment.py — teacher_ends / student_ends boundary loop',
  'token_alignment.py — teacher_group_size == 1 and student_group_size == 1',
  'token_alignment.py — group_start resets after each common boundary',
  'token_alignment.py `_split_on_eos` · `align_byte_span_batch_1to1`',
  'paper Table 1 · Qwen2.5-7B-Instruct → Llama-3.2-3B-Instruct · steps 1–100',
  'paper Table 1 · static vocabulary Jaccard vs strict student-token coverage',
  'paper §2.3 · position alignment precedes vocabulary support',
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
  const typeS = tl.channel('typeS', 0); // student row types on
  const typeT = tl.channel('typeT', 0); // teacher row types on
  const rulerU = tl.channel('rulerU', 0); // loose chips → byte-proportional
  const axisU = tl.channel('axisU', 0); // ruler ticks draw on
  const scanU = tl.channel('scanU', 0); // twin equality scan
  const ghostU = tl.channel('ghostU', 0); // `!` ghost on the teacher's last piece
  const okU = tl.channel('okU', 0); // byte equality confirmed
  const sweepB = tl.channel('sweepB', 0); // cursor position in bytes 0..16
  const eosU = tl.channel('eosU', 0); // paired end markers
  const sample2U = tl.channel('sample2U', 0); // the next sample's fresh ruler
  const compressU = tl.channel('compressU', 0); // tape to the upper half
  const barCov = tl.channel('barCov', 0); // 93.56 % bar
  const barJac = tl.channel('barJac', 0); // 64.32 % bar
  const fadeU = tl.channel('fadeU', 0); // competing content → whisper
  const riseU = tl.channel('riseU', 0); // one strict pair rises into slots
  const endU = tl.channel('endU', 0); // endpoint label

  // BEAT 0 — the response, cut two ways
  let t = CAPTION_AT(0);
  tl.tween(typeS, 1, { at: t + 0.3, dur: 2.0, ease: ease.linear });
  tl.tween(typeT, 1, { at: t + 2.4, dur: 2.2, ease: ease.linear });

  // BEAT 1 — one byte ruler
  t = CAPTION_AT(1);
  tl.tween(rulerU, 1, { at: t + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(axisU, 1, { at: t + 1.0, dur: 1.4, ease: ease.draw });

  // BEAT 2 — whole-stream byte equality; the equal-length ghost is rejected
  t = CAPTION_AT(2);
  tl.tween(scanU, 1, { at: t + 0.3, dur: 1.6, ease: ease.linear });
  tl.tween(ghostU, 1, { at: t + 2.4, dur: 0.5, ease: ease.enter });
  tl.tween(ghostU, 0, { at: t + 4.7, dur: 0.6, ease: ease.enter });
  tl.tween(okU, 1, { at: t + 5.6, dur: 0.5, ease: ease.pop });

  // BEAT 3 — first common boundary, first strict lock
  // (no camera zoom here: the full tape, row labels and EOS chips must stay inside x 60..1220)
  t = CAPTION_AT(3);
  tl.tween(sweepB, 2, { at: t + 0.9, dur: 1.6, ease: ease.linear });

  // BEAT 4 — the 2:1 group gets no strict loss
  t = CAPTION_AT(4);
  tl.tween(sweepB, 8, { at: t + 0.6, dur: 2.4, ease: ease.linear });

  // BEAT 5 — later strict groups still contribute
  t = CAPTION_AT(5);
  tl.tween(sweepB, 15, { at: t + 0.4, dur: 2.2, ease: ease.linear });
  tl.tween(sweepB, TOTAL_BYTES, { at: t + 3.3, dur: 0.7, ease: ease.linear });

  // BEAT 6 — EOS pairs separately; the next sample starts at byte zero
  t = CAPTION_AT(6);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(eosU, 1, { at: t + 1.0, dur: 1.0, ease: ease.enter });
  tl.tween(sample2U, 1, { at: t + 3.0, dur: 1.2, ease: ease.draw });

  // BEAT 7 — the tape compresses; measured coverage bar
  t = CAPTION_AT(7);
  tl.tween(sample2U, 0, { at: t, dur: 0.6, ease: ease.enter });
  tl.tween(compressU, 1, { at: t + 0.1, dur: 1.0, ease: ease.move });
  tl.tween(barCov, 1, { at: t + 0.8, dur: 1.2, ease: ease.draw });

  // BEAT 8 — a different denominator
  t = CAPTION_AT(8);
  tl.tween(barJac, 1, { at: t + 0.6, dur: 1.6, ease: ease.draw });

  // BEAT 9 — one strict position becomes two prediction slots
  t = CAPTION_AT(9);
  tl.tween(fadeU, 1, { at: t + 0.1, dur: 0.9, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.05 }, { at: t + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(riseU, 1, { at: t + 0.7, dur: 1.4, ease: ease.move });
  tl.tween(endU, 1, { at: t + 2.5, dur: 0.6, ease: ease.enter });

  return {
    tl, cam, beat, typeS, typeT, rulerU, axisU, scanU, ghostU, okU, sweepB, eosU, sample2U,
    compressU, barCov, barJac, fadeU, riseU, endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local renderers
// ---------------------------------------------------------------------------

/** A token chip; leading spaces render as a subdued ␣ glyph at real width. */
function TokenChip({
  x, y, w, piece, color, opacity, ghost,
}: { x: number; y: number; w: number; piece: string; color: string; opacity: number; ghost?: string }) {
  if (opacity <= 0.003) return null;
  const lead = piece.startsWith(' ') ? '␣' : '';
  const body = lead ? piece.slice(1) : piece;
  const shown = ghost ?? body;
  const fill = ghost ? INK.bad : color;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y - ROW.h / 2} width={w} height={ROW.h} rx={7} fill={fill} fillOpacity={0.14}
        stroke={fill} strokeWidth={1.6} />
      <text x={x + w / 2} y={y + CHIP_FONT * 0.36} fontSize={CHIP_FONT} textAnchor="middle" fontFamily={colors.font.mono} fill={fill}>
        {lead && <tspan fill={INK.muted} opacity={0.75}>{lead}</tspan>}
        <tspan>{shown}</tspan>
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const typeS = s.get(scene.typeS);
  const typeT = s.get(scene.typeT);
  const ruler = s.get(scene.rulerU);
  const axis = s.get(scene.axisU);
  const scan = s.get(scene.scanU);
  const ghost = s.get(scene.ghostU);
  const ok = s.get(scene.okU);
  const sweep = s.get(scene.sweepB);
  const eos = s.get(scene.eosU);
  const sample2 = s.get(scene.sample2U);
  const c = s.get(scene.compressU);
  const barCov = s.get(scene.barCov);
  const barJac = s.get(scene.barJac);
  const fade = s.get(scene.fadeU);
  const rise = s.get(scene.riseU);
  const end = s.get(scene.endU);

  const k = lerp(1, COMPRESS_K, c);
  const tapeTransform = `translate(640, ${RULER.y + lerp(0, COMPRESS_DY, c)}) scale(${k}) translate(-640, ${-RULER.y})`;
  const tapeO = lerp(1, 0.12, fade);
  const sweepX = bx(sweep);
  const sweeping = win(b, 3, 5) * clamp01(sweep * 4) * (1 - clamp01((sweep - TOTAL_BYTES + 0.3) / 0.3));

  const chipAt = (loose: { x: number; w: number }, sp: Span) => {
    const r = rulerLayout(sp);
    return { x: lerp(loose.x, r.x, ruler), w: lerp(loose.w, r.w, ruler) };
  };

  // group progress, all closed-form in the sweep position
  const braceU = (g: Group): number => clamp01((sweep - g.start) / (g.end - g.start));
  const lockU = (g: Group): number => clamp01((sweep - g.end + 0.5) * 2);

  // the rising strict pair (beat 9): compressed tape coordinates → centre slots
  const riseS = cmp(bx(RISE_GROUP.start) + 3, ROW.student, 1);
  const riseT = cmp(bx(RISE_GROUP.start) + 3, ROW.teacher, 1);
  const riseW0 = ((RISE_GROUP.end - RISE_GROUP.start) * PX - 6) * COMPRESS_K;
  const slotS = { x: lerp(riseS.x, SLOT.x - SLOT.w / 2, rise), y: lerp(riseS.y, SLOT.yS, rise), w: lerp(riseW0, SLOT.w, rise) };
  const slotT = { x: lerp(riseT.x, SLOT.x - SLOT.w / 2, rise), y: lerp(riseT.y, SLOT.yT, rise), w: lerp(riseW0, SLOT.w, rise) };

  return (
    <g>
      <defs>
        <pattern id="ctk1-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke={INK.mismatch} strokeWidth="3" opacity="0.45" />
        </pattern>
      </defs>
      <Camera {...s.get(scene.cam)}>
        {/* ----------------------------------------------------- the tape */}
        <g transform={tapeTransform} opacity={tapeO}>
          {/* shared byte ruler */}
          <g opacity={axis}>
            <line x1={RULER.x0} y1={RULER.y} x2={lerp(RULER.x0, RULER.x1, clamp01(axis * 1.3))} y2={RULER.y}
              stroke={colors.ink.axis} strokeWidth={2} />
            {Array.from({ length: TOTAL_BYTES + 1 }, (_, i) => (
              <g key={i} opacity={clamp01(axis * (TOTAL_BYTES + 3) - i - 1)}>
                <line x1={bx(i)} y1={RULER.y - 5} x2={bx(i)} y2={RULER.y + 5} stroke={colors.ink.axis} strokeWidth={1.4} />
                <Txt x={bx(i)} y={RULER.y + (i % 2 === 0 ? 22 : -12)} size={16} anchor="middle" fill={INK.muted} mono>
                  {String(i)}
                </Txt>
              </g>
            ))}
            <Txt x={RULER.x0} y={NOTE_Y} size={18} fill={INK.muted} opacity={win(b, 1, 2) * (1 - c)}>
              byte ruler · UTF-8 offsets of the same response
            </Txt>
          </g>

          {/* row labels */}
          <Txt x={lerp(S_LOOSE[0].x, RULER.x0, ruler) - 14} y={ROW.student + 7} size={20} anchor="end" fill={INK.student} weight={600} opacity={clamp01(typeS * 3)}>
            student
          </Txt>
          <Txt x={lerp(T_LOOSE[0].x, RULER.x0, ruler) - 14} y={ROW.teacher + 7} size={20} anchor="end" fill={INK.teacher} weight={600} opacity={clamp01(typeT * 3)}>
            teacher
          </Txt>

          {/* student chips */}
          {S_SPANS.map((sp, i) => {
            const o = clamp01(typeS * S_SPANS.length - i);
            const p = chipAt(S_LOOSE[i], sp);
            const hide = fade * (RISE_GROUP.s[0] === i ? 1 : 0);
            return <TokenChip key={`s${i}`} x={p.x} y={ROW.student} w={p.w} piece={sp.piece} color={INK.student} opacity={o * (1 - hide)} />;
          })}
          {/* teacher chips (last piece becomes the `!` ghost in beat 2) */}
          {T_SPANS.map((sp, i) => {
            const o = clamp01(typeT * T_SPANS.length - i);
            const p = chipAt(T_LOOSE[i], sp);
            const isLast = i === T_SPANS.length - 1;
            const hide = fade * (RISE_GROUP.t[0] === i ? 1 : 0);
            return (
              <TokenChip key={`t${i}`} x={p.x} y={ROW.teacher} w={p.w} piece={sp.piece} color={INK.teacher}
                opacity={o * (1 - hide)} ghost={isLast && ghost > 0.5 ? TEACHER_GHOST_LAST : undefined} />
            );
          })}

          {/* beat 2 — twin equality scan */}
          {scan > 0 && scan < 1 && (
            <g opacity={win(b, 2, 2)}>
              <rect x={lerp(RULER.x0, RULER.x1, scan) - 10} y={ROW.student - ROW.h / 2 - 6} width={20} height={ROW.teacher - ROW.student + ROW.h + 12}
                fill={INK.text} opacity={0.18} />
              <line x1={lerp(RULER.x0, RULER.x1, scan)} y1={ROW.student - ROW.h / 2 - 6} x2={lerp(RULER.x0, RULER.x1, scan)} y2={ROW.teacher + ROW.h / 2 + 6}
                stroke={INK.text} strokeWidth={2} />
            </g>
          )}
          <g opacity={win(b, 2, 2)}>
            <Txt x={640} y={ROW.teacher + ROW.h / 2 + 40} size={22} anchor="middle" fill={ghost > 0.5 ? INK.bad : INK.text} mono opacity={clamp01(scan * 3) * (1 - ok)}>
              {ghost > 0.5
                ? `b"".join(teacher) != b"".join(student)  →  return [], []`
                : `b"".join(teacher_pieces) == b"".join(student_pieces)`}
            </Txt>
            <Txt x={640} y={ROW.teacher + ROW.h / 2 + 72} size={18} anchor="middle" fill={INK.bad} opacity={ghost}>
              {`same length, ${TOTAL_BYTES} bytes each — but the final byte differs: rejected, no content pairs`}
            </Txt>
            <Txt x={640} y={ROW.teacher + ROW.h / 2 + 40} size={24} anchor="middle" fill={INK.strict} weight={600} opacity={ok}>
              {`${TOTAL_BYTES} bytes  =  ${TOTAL_BYTES} bytes  ✓  same response`}
            </Txt>
          </g>

          {/* beats 3–5 — groups between common boundaries */}
          {GROUPS.map((g, gi) => {
            const bu = braceU(g);
            const lu = lockU(g);
            if (bu <= 0) return null;
            const x0 = bx(g.start), x1 = bx(g.end);
            const yTop = ROW.student + ROW.h / 2 + 4;
            const yBot = ROW.teacher - ROW.h / 2 - 4;
            const color = g.strict ? INK.strict : INK.mismatch;
            const mid = (x0 + x1) / 2;
            return (
              <g key={gi}>
                {/* group brace: grows along the ruler as the cursor passes */}
                <rect x={x0} y={RULER.y - 3} width={(x1 - x0) * bu} height={6} fill={color} opacity={0.55} />
                {/* common boundary line */}
                <line x1={x1} y1={yTop} x2={x1} y2={yBot} stroke={color} strokeWidth={2} strokeDasharray={g.strict ? undefined : '6 4'} opacity={lu * 0.9} />
                {g.strict ? (
                  <g opacity={lu}>
                    <line x1={mid} y1={yTop} x2={mid} y2={lerp(yTop, yBot, lu)} stroke={INK.strict} strokeWidth={3} />
                    <circle cx={mid} cy={RULER.y} r={7} fill={INK.strict} />
                    <Txt x={mid} y={GROUP_LABEL_Y} size={17} anchor="middle" fill={INK.strict} mono opacity={1 - c}>
                      {`(${g.t[0]}, ${g.s[0]})`}
                    </Txt>
                  </g>
                ) : (
                  <g opacity={lu}>
                    <rect x={x0 + 2} y={yTop} width={x1 - x0 - 4} height={yBot - yTop} fill="url(#ctk1-hatch)" />
                    <rect x={x0 + 2} y={yTop} width={x1 - x0 - 4} height={yBot - yTop} fill="none" stroke={INK.mismatch} strokeWidth={1.5} strokeDasharray="6 4" />
                    <Txt x={mid} y={GROUP_LABEL_Y} size={17} anchor="middle" fill={INK.mismatch} mono opacity={1 - c}>
                      {`teacher ${g.t.length} : student ${g.s.length} — skipped`}
                    </Txt>
                  </g>
                )}
              </g>
            );
          })}

          {/* sweep cursor */}
          {sweeping > 0.003 && (
            <g opacity={sweeping}>
              <line x1={sweepX} y1={ROW.student - ROW.h / 2 - 14} x2={sweepX} y2={ROW.teacher + ROW.h / 2 + 14} stroke={INK.text} strokeWidth={2} />
              <polygon points={`${sweepX - 7},${ROW.student - ROW.h / 2 - 26} ${sweepX + 7},${ROW.student - ROW.h / 2 - 26} ${sweepX},${ROW.student - ROW.h / 2 - 14}`} fill={INK.text} />
              <Txt x={sweepX} y={ROW.student - ROW.h / 2 - 34} size={16} anchor="middle" fill={INK.muted} mono>
                {`byte ${Math.round(sweep)}`}
              </Txt>
            </g>
          )}

          {/* beat 6 — paired EOS outside the byte ruler */}
          <g opacity={eos * (1 - c * 0.7)}>
            {[ROW.student, ROW.teacher].map((y, i) => (
              <g key={i}>
                <rect x={EOS_X - 40} y={y - 20} width={80} height={40} rx={20} fill={INK.panel} stroke={i === 0 ? INK.student : INK.teacher} strokeWidth={1.6} />
                <Txt x={EOS_X} y={y + 6} size={17} anchor="middle" mono fill={i === 0 ? INK.student : INK.teacher}>eos</Txt>
              </g>
            ))}
            <line x1={EOS_X} y1={ROW.student + 20} x2={EOS_X} y2={lerp(ROW.student + 20, ROW.teacher - 20, eos)} stroke={INK.strict} strokeWidth={3} />
            <Txt x={EOS_X} y={ROW.teacher + 46} size={16} anchor="middle" fill={INK.strict} mono opacity={1 - c}>paired</Txt>
          </g>
          <Txt x={1190} y={ROW.student - ROW.h / 2 - 60} size={16} anchor="end" fill={INK.muted} mono opacity={eos * (1 - c)}>
            {`EOS is not on the byte ruler · _split_on_eos`}
          </Txt>

          {/* beat 6 — the next sample's ruler starts at zero again */}
          <g opacity={sample2}>
            <line x1={RULER.x0} y1={SAMPLE2_Y} x2={lerp(RULER.x0, RULER.x0 + 520, sample2)} y2={SAMPLE2_Y} stroke={colors.ink.axis} strokeWidth={2} />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <line key={i} x1={bx(i)} y1={SAMPLE2_Y - 5} x2={bx(i)} y2={SAMPLE2_Y + 5} stroke={colors.ink.axis} strokeWidth={1.4}
                opacity={clamp01(sample2 * 10 - i)} />
            ))}
            <Txt x={RULER.x0} y={SAMPLE2_Y - 12} size={16} mono fill={INK.muted}>0</Txt>
            <Txt x={RULER.x0 + 60} y={SAMPLE2_Y - 14} size={18} fill={INK.muted}>
              next sample · byte coordinate reset to 0 · aligned independently
            </Txt>
            <Txt x={RULER.x0 + 540} y={SAMPLE2_Y + 6} size={16} mono fill={INK.muted}>align_byte_span_batch_1to1</Txt>
            <line x1={RULER.x0 - 30} y1={ROW.teacher + ROW.h / 2 + 8} x2={RULER.x0 - 30} y2={SAMPLE2_Y - 8} stroke={INK.muted} strokeWidth={1.2} strokeDasharray="3 5" />
          </g>
        </g>

        {/* code label for the ruler (sits in tape space but not scaled) */}
        <Txt x={cmp(RULER.x1, NOTE_Y, c).x} y={cmp(RULER.x1, NOTE_Y, c).y} size={18} anchor="end" mono fill={INK.student} opacity={on(b, 1) * (1 - fade)}>
          align_byte_spans_1to1
        </Txt>

        {/* ------------------------------------------- measured bars (7–8) */}
        <g opacity={1 - fade}>
          <g opacity={clamp01(barCov * 3)}>
            <Txt x={BAR.x0} y={BAR_COV_Y - 22} size={22} weight={600} fill={INK.strict}>
              Strict student-token coverage
            </Txt>
            <Txt x={BAR.x1 + 8} y={BAR_COV_Y - 22} size={16} anchor="end" fill={INK.muted} mono>Paper Table 1 · steps 1–100</Txt>
            <rect x={BAR.x0} y={BAR_COV_Y} width={BAR.x1 - BAR.x0} height={BAR.h} rx={6} fill={INK.panel} stroke={colors.ink.axis} />
            <rect x={BAR.x0} y={BAR_COV_Y} width={barW(COVERAGE_PCT, barCov)} height={BAR.h} rx={6} fill={INK.strict} opacity={0.85} />
            <Txt x={BAR.x1 + 16} y={BAR_COV_Y + 23} size={26} weight={700} fill={INK.strict} opacity={clamp01(barCov * 2 - 1)}>
              {`${COVERAGE_PCT.toFixed(2)}%`}
            </Txt>
            <Txt x={BAR.x0} y={BAR_COV_Y + BAR.h + 24} size={18} fill={INK.muted}>
              denominator: student tokens generated during training · Qwen2.5-7B-Instruct → Llama-3.2-3B-Instruct
            </Txt>
          </g>
          <g opacity={clamp01(barJac * 3)}>
            <Txt x={BAR.x0} y={BAR_JAC_Y - 22} size={22} weight={600} fill={INK.teacher}>
              Vocabulary Jaccard overlap
            </Txt>
            <Txt x={BAR.x1 + 8} y={BAR_JAC_Y - 22} size={16} anchor="end" fill={INK.muted} mono>Paper Table 1 · static vocabularies</Txt>
            <rect x={BAR.x0} y={BAR_JAC_Y} width={BAR.x1 - BAR.x0} height={BAR.h} rx={6} fill={INK.panel} stroke={colors.ink.axis} />
            <rect x={BAR.x0} y={BAR_JAC_Y} width={barW(JACCARD_PCT, barJac)} height={BAR.h} rx={6} fill={INK.teacher} opacity={0.85} />
            <Txt x={BAR.x1 + 16} y={BAR_JAC_Y + 23} size={26} weight={700} fill={INK.teacher} opacity={clamp01(barJac * 2 - 1)}>
              {`${JACCARD_PCT.toFixed(2)}%`}
            </Txt>
            <Txt x={BAR.x0} y={BAR_JAC_Y + BAR.h + 24} size={18} fill={INK.muted}>
              denominator: dictionary entries in the union of both vocabularies — a different quantity, not a stacked total
            </Txt>
          </g>
        </g>

        {/* ------------------------------------------- beat 9: two slots */}
        {rise > 0.003 && (
          <g>
            <rect x={slotS.x} y={slotS.y - lerp(ROW.h * COMPRESS_K, SLOT.h, rise) / 2} width={slotS.w} height={lerp(ROW.h * COMPRESS_K, SLOT.h, rise)} rx={8}
              fill={INK.student} fillOpacity={0.14} stroke={INK.student} strokeWidth={1.8} />
            <rect x={slotT.x} y={slotT.y - lerp(ROW.h * COMPRESS_K, SLOT.h, rise) / 2} width={slotT.w} height={lerp(ROW.h * COMPRESS_K, SLOT.h, rise)} rx={8}
              fill={INK.teacher} fillOpacity={0.14} stroke={INK.teacher} strokeWidth={1.8} />
            <line x1={SLOT.x} y1={SLOT.yS + SLOT.h / 2} x2={SLOT.x} y2={SLOT.yT - SLOT.h / 2} stroke={INK.strict} strokeWidth={3} opacity={clamp01(rise * 2 - 1)} />
            <circle cx={SLOT.x} cy={(SLOT.yS + SLOT.yT) / 2} r={7} fill={INK.strict} opacity={clamp01(rise * 2 - 1)} />
            <Txt x={SLOT.x} y={slotS.y + 8} size={22} anchor="middle" mono fill={INK.student} opacity={clamp01(rise * 2 - 1)}>
              student: next token ?
            </Txt>
            <Txt x={SLOT.x} y={slotT.y + 8} size={22} anchor="middle" mono fill={INK.teacher} opacity={clamp01(rise * 2 - 1)}>
              teacher: next token ?
            </Txt>
            <Txt x={SLOT.x + SLOT.w / 2 + 18} y={(SLOT.yS + SLOT.yT) / 2 + 6} size={18} fill={INK.strict} opacity={clamp01(rise * 2 - 1)}>
              {`strict position · after "${RESPONSE.slice(0, RISE_GROUP.start)}"`}
            </Txt>
          </g>
        )}
        <Txt x={640} y={520} size={26} anchor="middle" weight={600} opacity={end}>
          Position alignment → vocabulary support
        </Txt>
      </Camera>

      {/* ------------------------------------------- screen-fixed overlays */}
      <Txt x={90} y={65} size={26} weight={600}>One Response, Two Rulers</Txt>
      <Txt x={1190} y={65} size={16} anchor="end" fill={INK.muted} opacity={clamp01(typeS * 3) * (1 - fade)}>
        Illustrative token boundaries · constructed example, not named production tokenizers
      </Txt>
      <Txt x={1190} y={BAR_COV_Y - 46} size={16} anchor="end" fill={INK.muted} opacity={win(b, 7, 8)}>
        Measured values are from the paper, not from this toy tape
      </Txt>
      {/* one source note at a time: clean cut at each beat midpoint (no crossfade) */}
      <Txt x={90} y={SOURCE_Y} size={15} fill={INK.muted} mono opacity={0.9}>
        {SOURCES[Math.min(SOURCES.length - 1, Math.max(0, Math.round(b)))]}
      </Txt>
    </g>
  );
}

export const vizScene = () => scene;
