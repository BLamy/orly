// Search Once, Refine, Reuse
//
// Backing (checkout /tmp/deepseek-v41-flash-20260918-full @ dba1be0a40aa45a94ad051997016db3960a90277):
//   S3 inference/model.py:488 Indexer (Indexer.forward: full einsum score tensor, then masked_fill).
//   S4 inference/model.py:583 select_candidate_blocks (amax(dim=-1) block maxima, newest
//      reachable block pinned via scores.masked_fill(..., torch.inf), boolean candidate mask).
//   S5 is_kv_source / is_index_source membership; shared_attn.topk_idxs / shared_attn.candidates.
//   S6 inference/config.json: candidate_topk_blocks = 2048, candidate_block_size = 8,
//      index_topk = 512; layer schedule (zero-based): 0–1 SWA-only; 2, 8, 14, 20 Full;
//      24, 28, 32, 36 Reindex; all other backbone layers Reuse (draft layers excluded).
//   P2–P3 paper §§2.3–2.3.2, §4.2.1.
//
// Illustrative inputs: a 32-position domain (128…159), four blocks of eight, toy budget of
// two blocks and Top-4, and two untied toy score arrays — NOT checkpoint inference and NOT
// the released budgets. Evidence boundary: bounded later searches are the paper's deployment
// algorithm; the reference Indexer scores everything and then masks.
//
// Machine: the decoder memory rail becomes a score comb; block handles rise on maxima, a
// candidate stencil locks, and later query combs choose different teeth through it.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const { ACCENT, SECONDARY, POSITIVE, WARM, MUTED, TEXT, PANEL, TEAL, font } = colors;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

export const CAPTIONS = [
  "A smaller memory can still be costly to search. Our next query needs a useful selection from the token's growing history.",
  'A full layer creates the global memory and runs the indexer to choose entries for attention.',
  'A reindexing layer keeps that memory, but asks its own question and chooses a fresh selection.',
  'A reuse layer keeps both the memory and the latest selection. Its attention query and local window are still its own.',
  "The decoder's first full layer also scores blocks of eight positions, using each block's highest score.",
  'The reference implementation always keeps the newest reachable block, even when older blocks score higher.',
  'The published configuration keeps up to sixteen thousand three hundred eighty-four candidate positions. Later indexers choose five hundred twelve entries within that pool.',
  'The pool stays fixed for this query, while later reindexing layers can choose different entries from it.',
  "This bounds later searches in the paper's deployment design. The first search still scans the visible history; the reference scores everything before masking.",
  'Our token remains available through shared memory and reusable selections. What happens when a returning conversation has lost its local window?',
] as const;

// ---------------------------------------------------------------------------
// Module-scope data — toy scores, real selection logic.
// ---------------------------------------------------------------------------

const N = 32;
const BASE = 128;
const BLOCK = 8;
const N_BLOCKS = N / BLOCK;
const TOY_BLOCK_BUDGET = 2;
const TOY_TOPK = 4;
export const TOKEN = 143;

const withOverrides = (o: Record<number, number>) =>
  Array.from({ length: N }, (_, j) => (j in o ? o[j] : 0.01 * j));
export const SCORES_1 = withOverrides({ 15: 9.7, 7: 9.5, 14: 9.3, 6: 9.1, 23: 8.9 });
export const SCORES_2 = withOverrides({ 15: 10, 26: 9, 13: 8, 28: 7 });

const topK = (scores: number[], k: number, allowed?: boolean[]) =>
  scores
    .map((v, j) => ({ v: allowed && !allowed[j] ? -Infinity : v, j }))
    .sort((a, b) => b.v - a.v)
    .slice(0, k)
    .map((e) => e.j)
    .sort((a, b) => a - b);

/** first Full layer: its own Top-4 over everything visible — [134,135,142,143] */
export const TOPK_1 = topK(SCORES_1, TOY_TOPK);
/** block maxima (amax), newest reachable block pinned with +inf, budget of two blocks */
export const BLOCK_MAX = Array.from({ length: N_BLOCKS }, (_, b) =>
  Math.max(...SCORES_1.slice(b * BLOCK, (b + 1) * BLOCK)),
);
const NEWEST = N_BLOCKS - 1;
export const CAND_BLOCKS = BLOCK_MAX.map((v, b) => ({ v: b === NEWEST ? Infinity : v, b }))
  .sort((a, b) => b.v - a.v)
  .slice(0, TOY_BLOCK_BUDGET)
  .map((e) => e.b)
  .sort((a, b) => a - b); // [1, 3]
export const CANDIDATE = Array.from({ length: N }, (_, j) => CAND_BLOCKS.includes(Math.floor(j / BLOCK)));
/** Reindex layer: masked outside the fixed pool, then Top-4 — [141,143,154,156] */
export const TOPK_2 = topK(SCORES_2, TOY_TOPK, CANDIDATE);

const N_LAYERS = 40;
type Mode = 'SWA-only' | 'Full' | 'Reindex' | 'Reuse';
export const MODES: Mode[] = Array.from({ length: N_LAYERS }, (_, i) =>
  i < 2 ? 'SWA-only' : [2, 8, 14, 20].includes(i) ? 'Full' : [24, 28, 32, 36].includes(i) ? 'Reindex' : 'Reuse',
);
const MODE_COLOR: Record<Mode, string> = { 'SWA-only': MUTED, Full: SECONDARY, Reindex: POSITIVE, Reuse: '#5c6478' };

const PUBLISHED_POOL = 2048 * 8; // 16384

// ---------------------------------------------------------------------------
// Layout. Captions own y ≥ 633.
// ---------------------------------------------------------------------------

const COMB = { x: 190, dx: 28, w: 24, y: 430, h: 16, unit: 15, stub: 10 };
const cx = (j: number) => COMB.x + COMB.dx * j + COMB.w / 2;
const blockX0 = (b: number) => COMB.x + COMB.dx * BLOCK * b;
const BLOCK_W = COMB.dx * BLOCK - (COMB.dx - COMB.w);
const RULER = { x: 170, dx: 20, y: 486 };
const layerX = (i: number) => RULER.x + RULER.dx * i;
const Q_HOME = { x: cx(31), y: 205 };
const Q_NEAR = { x: 640, y: 215 };
const EMPTY_RING = { x: 420, y: 300, r: 70 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const n = (k: string, v = 0) => tl.channel(k, v);
  const to = (ch: ChannelRef<number>, v: number, at: number, dur = 0.6, e = ease.enter) =>
    tl.tween(ch, v, { at, dur, ease: e });
  const B = (i: number) => 0.5 + 8 * (i - 1);

  const railO = n('railO');
  const combU = n('combU');
  const combO = n('combO', 1);
  const queryO = n('queryO');
  const queryNear = n('queryNear');
  const qColor = tl.channel<string>('qColor', ACCENT);
  const rulerO = n('rulerO');
  const layerPos = n('layerPos', 20);
  const stampU = n('stampU');
  const selO = n('selO');
  const selMix = n('selMix');
  const modeFull = n('modeFull');
  const modeRe = n('modeRe');
  const modeReuse = n('modeReuse');
  const scanU = n('scanU');
  const handleU = n('handleU');
  const handleO = n('handleO', 1);
  const blockLbl = n('blockLbl');
  const pinU = n('pinU');
  const candU = n('candU');
  const pubO = n('pubO');
  const chipPub = n('chipPub');
  const scoreMix = n('scoreMix');
  const poolLbl = n('poolLbl');
  const workO = n('workO');
  const ctxU = n('ctxU');
  const chipPaper = n('chipPaper');
  const ringO = n('ringO');
  const takeO = n('takeO');

  // Keep each line active through the player's post-seek settle window. The
  // narration cues are continuous, so a caption should not disappear in the
  // short authored hold before the next eight-second beat.
  CAPTIONS.forEach((text, i) => tl.caption({ at: B(i + 1), dur: 7.8, text }));

  // 1 — rail lifts into a (still unscored) comb
  to(railO, 1, 0.5);
  to(combU, 1, 1.6, 1.2, ease.move);
  to(queryO, 1, 3.0);
  tl.hold(B(1) + 6.8, 1.2);

  // 2 — Full: layer 20 stamps memory and selection
  tl.tween(cam, { x: 450, y: 325, k: 1.25 }, { at: B(2), dur: 1.2, ease: ease.move });
  to(queryNear, 1, B(2), 1.2, ease.move);
  to(rulerO, 1, B(2) + 0.8);
  to(modeFull, 1, B(2) + 1.6);
  to(stampU, 1, B(2) + 2.2, 0.5, ease.pop);
  to(stampU, 0, B(2) + 3.2, 0.8, ease.move);
  to(selO, 1, B(2) + 3.0);
  tl.hold(B(2) + 6.8, 1.2);

  // 3 — Reindex: layer 24 keeps memory, new query, fresh selection
  to(modeFull, 0, B(3));
  to(layerPos, 24, B(3) + 0.4, 1.0, ease.move);
  tl.tween(qColor, TEAL, { at: B(3) + 0.4, dur: 1.0, ease: ease.move });
  to(modeRe, 1, B(3) + 1.4);
  to(selMix, 1, B(3) + 2.2, 1.2, ease.move);
  tl.hold(B(3) + 6.8, 1.2);

  // 4 — Reuse: layer 25 inherits the selection; query + local window are its own
  to(modeRe, 0, B(4));
  to(layerPos, 25, B(4) + 0.4, 0.8, ease.move);
  tl.tween(qColor, '#f0abfc', { at: B(4) + 0.4, dur: 0.8, ease: ease.move });
  to(modeReuse, 1, B(4) + 1.4);
  tl.hold(B(4) + 6.8, 1.2);

  // 5 — back to layer 20: first scores, four block maxima
  tl.tween(cam, { x: 670, y: 335, k: 1.25 }, { at: B(5), dur: 1.2, ease: ease.move });
  to(modeReuse, 0, B(5));
  to(layerPos, 20, B(5), 1.0, ease.move);
  tl.tween(qColor, ACCENT, { at: B(5), dur: 1.0, ease: ease.move });
  to(queryNear, 0, B(5), 1.2, ease.move);
  to(selMix, 0, B(5), 1.0, ease.move);
  to(selO, 0.15, B(5));
  to(scanU, 1, B(5) + 1.3, 2.4, ease.linear);
  to(handleU, 1, B(5) + 3.8, 0.8);
  to(blockLbl, 1, B(5) + 4.4);
  tl.hold(B(5) + 6.8, 1.2);

  // 6 — newest reachable block is pinned, then the budget is filled
  to(blockLbl, 0, B(6));
  to(pinU, 1, B(6) + 0.8, 1.0, ease.move);
  to(candU, 1, B(6) + 3.2, 1.2, ease.draw);
  tl.hold(B(6) + 6.8, 1.2);

  // 7 — published sizes, kept apart from the toy stencil
  tl.tween(cam, CAMERA_HOME, { at: B(7), dur: 1.2, ease: ease.move });
  to(handleO, 0.15, B(7));
  to(pubO, 1, B(7) + 1.4);
  to(chipPub, 1, B(7) + 1.4);
  tl.hold(B(7) + 6.8, 1.2);

  // 8 — same pool, second scores, different teeth
  tl.tween(cam, { x: 670, y: 335, k: 1.2 }, { at: B(8), dur: 1.2, ease: ease.move });
  to(pubO, 0, B(8));
  to(handleO, 0, B(8));
  to(layerPos, 24, B(8) + 0.4, 1.0, ease.move);
  tl.tween(qColor, TEAL, { at: B(8) + 0.4, dur: 1.0, ease: ease.move });
  to(scoreMix, 1, B(8) + 1.6, 1.4, ease.move);
  to(selO, 1, B(8) + 1.6);
  to(selMix, 1, B(8) + 3.0, 1.2, ease.move);
  to(poolLbl, 1, B(8) + 3.4);
  tl.hold(B(8) + 6.8, 1.2);

  // 9 — work rulers: paper deployment algorithm vs the reference
  tl.tween(cam, CAMERA_HOME, { at: B(9), dur: 1.2, ease: ease.move });
  to(combO, 0.15, B(9));
  to(poolLbl, 0, B(9));
  to(queryO, 0, B(9));
  to(rulerO, 0, B(9));
  to(workO, 1, B(9) + 1.0);
  to(chipPaper, 1, B(9) + 1.0);
  to(ctxU, 1, B(9) + 1.6, 3.4, ease.linear);
  tl.hold(B(9) + 6.8, 1.2);

  // 10 — comb lies flat; the local ring is empty
  to(workO, 0, B(10));
  to(chipPaper, 0, B(10));
  to(chipPub, 0, B(10));
  to(candU, 0, B(10));
  to(combO, 1, B(10) + 0.4);
  to(combU, 0, B(10) + 0.4, 1.2, ease.move);
  to(ringO, 1, B(10) + 1.8);
  to(takeO, 1, B(10) + 2.6);
  tl.hold(B(10) + 6.8, 1.2);
  tl.hold(80.5, 1.5);

  return {
    tl, cam, railO, combU, combO, queryO, queryNear, qColor, rulerO, layerPos, stampU, selO, selMix,
    modeFull, modeRe, modeReuse, scanU, handleU, handleO, blockLbl, pinU, candU, pubO, chipPub,
    scoreMix, poolLbl, workO, ctxU, chipPaper, ringO, takeO,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local SVG helpers
// ---------------------------------------------------------------------------

type TextP = {
  x: number; y: number; text: string; o?: number; color?: string; size?: number;
  anchor?: 'start' | 'middle' | 'end';
};
function Code({ x, y, text, o = 1, color = TEXT, size = 13, anchor = 'start' }: TextP) {
  if (o <= 0) return null;
  return (
    <text x={x} y={y} fill={color} opacity={o} fontFamily={font.mono} fontSize={size} textAnchor={anchor}>{text}</text>
  );
}
function Note({ x, y, text, o = 1, color = MUTED, size = 13, anchor = 'start' }: TextP) {
  if (o <= 0) return null;
  return (
    <text x={x} y={y} fill={color} opacity={o} fontFamily={font.ui} fontSize={size} textAnchor={anchor}>{text}</text>
  );
}
function Chip({ x, y = 88, text, o, color = MUTED }: { x: number; y?: number; text: string; o: number; color?: string }) {
  if (o <= 0) return null;
  const w = text.length * 6.7 + 18;
  return (
    <g opacity={o}>
      <rect x={x} y={y} width={w} height={24} rx={12} fill={PANEL} stroke={color} strokeOpacity={0.6} />
      <text x={x + w / 2} y={y + 16} fill={color} fontFamily={font.mono} fontSize={11} textAnchor="middle">{text}</text>
    </g>
  );
}
function Takeaway({ text, o }: { text: string; o: number }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <rect x={340} y={541} width={600} height={48} rx={10} fill={PANEL} stroke={WARM} strokeOpacity={0.7} />
      <text x={640} y={571} fill={TEXT} fontFamily={font.ui} fontSize={20} fontWeight={600} textAnchor="middle">{text}</text>
    </g>
  );
}
function ModeCard({ o, mode, lines }: { o: number; mode: Mode; lines: string[] }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <rect x={120} y={186} width={250} height={28 + 18 * lines.length} rx={8} fill={PANEL} stroke={MODE_COLOR[mode]} strokeOpacity={0.8} />
      <text x={134} y={207} fill={mode === 'Reuse' ? TEXT : MODE_COLOR[mode]} fontFamily={font.ui} fontSize={15} fontWeight={700}>{mode}</text>
      {lines.map((l, i) => (
        <text key={l} x={134} y={226 + 18 * i} fill={TEXT} fontFamily={font.mono} fontSize={12}>{l}</text>
      ))}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>) => s.get(ch);
  const comb = g(scene.combU);
  const scan = g(scene.scanU);
  const mix = g(scene.scoreMix);
  const selO = g(scene.selO);
  const selMix = g(scene.selMix);
  const cand = g(scene.candU);
  const pin = g(scene.pinU);
  const near = g(scene.queryNear);
  const qColor = g(scene.qColor);
  const layerPos = g(scene.layerPos);
  const stamp = g(scene.stampU);
  const ctx = g(scene.ctxU);

  const q = { x: lerp(Q_HOME.x, Q_NEAR.x, near), y: lerp(Q_HOME.y, Q_NEAR.y, near) };
  const barH = (j: number) => {
    const scored = clamp01(scan * (N + 2) - j);
    const v = lerp(SCORES_1[j], SCORES_2[j], mix);
    return comb * lerp(COMB.stub, Math.max(COMB.stub * 0.4, v * COMB.unit), scored);
  };
  const w1 = 120 + 620 * ctx;
  const w2 = Math.min(w1, 330);

  return (
    <g>
      <Camera {...g(scene.cam)}>
        <g opacity={g(scene.combO)}>
          {/* candidate stencil — eligibility, dashed */}
          {cand > 0 &&
            CAND_BLOCKS.map((b) => (
              <rect key={b} x={blockX0(b) - 5} y={262} width={BLOCK_W + 10} height={COMB.y + COMB.h + 6 - 262} rx={8}
                fill={ACCENT} fillOpacity={0.05} stroke={ACCENT} strokeWidth={1.5} strokeDasharray="7 5"
                opacity={clamp01(cand * 1.5)} />
            ))}

          {/* rail cells + comb teeth */}
          <g opacity={g(scene.railO)}>
            {Array.from({ length: N }, (_, j) => {
              const pos = BASE + j;
              const masked = CANDIDATE[j] ? 0 : cand;
              const h = barH(j);
              return (
                <g key={j} opacity={1 - 0.7 * masked}>
                  <rect x={COMB.x + COMB.dx * j} y={COMB.y} width={COMB.w} height={COMB.h} rx={3} fill={SECONDARY}
                    fillOpacity={0.2 + 0.5 * stamp} stroke={pos === TOKEN ? WARM : SECONDARY}
                    strokeWidth={pos === TOKEN ? 2.5 : 1} strokeOpacity={0.85} />
                  {h > 0 && (
                    <rect x={cx(j) - 5} y={COMB.y - 3 - h} width={10} height={h} rx={2}
                      fill={masked > 0.5 ? MUTED : SECONDARY} fillOpacity={0.55} />
                  )}
                </g>
              );
            })}
            <Note x={COMB.x} y={COMB.y + 32} text={`${BASE}`} size={10} />
            <Note x={cx(15)} y={COMB.y + 32} text={`${TOKEN}`} size={10} color={WARM} anchor="middle" />
            <Note x={COMB.x + COMB.dx * N - 4} y={COMB.y + 32} text={`${BASE + N - 1}`} size={10} anchor="end" />
          </g>

          {/* selected reads — solid outlines + teeth to the query */}
          {selO > 0 &&
            [
              { set: TOPK_1, o: 1 - selMix },
              { set: TOPK_2, o: selMix },
            ].map(({ set, o }, k) =>
              o <= 0 ? null : (
                <g key={k} opacity={selO * o}>
                  {set.map((j) => (
                    <g key={j}>
                      <rect x={COMB.x + COMB.dx * j - 3} y={COMB.y - 3} width={COMB.w + 6} height={COMB.h + 6} rx={5}
                        fill="none" stroke={POSITIVE} strokeWidth={2.5} />
                      <line x1={cx(j)} y1={COMB.y - 6 - barH(j)} x2={q.x} y2={q.y + 12} stroke={POSITIVE}
                        strokeOpacity={0.55 * g(scene.queryO)} />
                    </g>
                  ))}
                </g>
              ),
            )}
          {selO > 0.5 && (
            <g opacity={g(scene.railO)}>
              <Code x={cx(17)} y={COMB.y + 32} size={11} color={POSITIVE} o={selO * (1 - selMix)}
                text={`topk_idxs = [${TOPK_1.map((j) => BASE + j).join(', ')}]`} />
              <Code x={cx(17)} y={COMB.y + 32} size={11} color={POSITIVE} o={selO * selMix}
                text={`topk_idxs = [${TOPK_2.map((j) => BASE + j).join(', ')}]`} />
            </g>
          )}

          {/* block handles */}
          {g(scene.handleU) > 0 && (
            <g opacity={g(scene.handleU) * g(scene.handleO)}>
              {BLOCK_MAX.map((m, b) => {
                const natural = COMB.y - 3 - m * COMB.unit - 14;
                const y = b === NEWEST ? lerp(natural, 232, pin) : natural;
                const chosen = CAND_BLOCKS.includes(b);
                const color = b === NEWEST && pin > 0 ? ACCENT : chosen && cand > 0 ? ACCENT : MUTED;
                return (
                  <g key={b}>
                    <path d={`M${blockX0(b)},${y + 8} v-8 h${BLOCK_W} v8`} fill="none" stroke={color} strokeWidth={2} />
                    {b === NEWEST ? (
                      <>
                        <Code x={blockX0(b) + BLOCK_W / 2} y={y - 8} text={m.toFixed(2)} size={11} color={MUTED} anchor="middle" o={1 - pin} />
                        <MathLabel tex={'+\\infty'} x={blockX0(b) + BLOCK_W / 2} y={y - 14} fontSize={16} color={ACCENT} opacity={pin} />
                      </>
                    ) : (
                      <Code x={blockX0(b) + BLOCK_W / 2} y={y - 8} text={m.toFixed(1)} size={11} color={color} anchor="middle" />
                    )}
                  </g>
                );
              })}
              <g opacity={g(scene.blockLbl)}>
                <Code x={COMB.x} y={196} text="select_candidate_blocks" color={TEXT} />
                <Code x={COMB.x} y={214} text="amax(dim=-1)" color={MUTED} size={12} />
              </g>
              <g opacity={pin}>
                <Code x={COMB.x} y={196} text="scores.masked_fill(..., torch.inf)" color={ACCENT} />
                <Note x={COMB.x} y={214} text="newest reachable block: always kept" size={12} />
              </g>
            </g>
          )}
          <g opacity={g(scene.poolLbl)}>
            <Code x={blockX0(1)} y={252} text="shared_attn.candidates" size={12} color={ACCENT} />
            <Code x={COMB.x} y={196} text="shared_attn.topk_idxs" color={POSITIVE} />
            <Note x={COMB.x} y={214} text="fixed pool · fresh Top-4 inside it" size={12} />
          </g>
        </g>

        {/* published sizes (beat 7) */}
        <g opacity={g(scene.pubO)}>
          <rect x={330} y={150} width={620} height={100} rx={10} fill={PANEL} stroke={MUTED} strokeOpacity={0.4} />
          <MathLabel tex={`2048 \\times 8 = ${PUBLISHED_POOL}`} x={640} y={184} fontSize={24} />
          <Code x={640} y={222} anchor="middle" size={12}
            text="candidate_topk_blocks = 2048 · candidate_block_size = 8 · index_topk = 512" />
          <Note x={640} y={240} text="published configuration — the comb below is a toy" size={11} anchor="middle" />
        </g>

        {/* the query */}
        {g(scene.queryO) > 0 && (
          <g opacity={g(scene.queryO)}>
            <circle cx={q.x} cy={q.y} r={12} fill={PANEL} stroke={qColor} strokeWidth={2.5} />
            <text x={q.x} y={q.y + 4} fill={qColor} fontFamily={font.mono} fontSize={11} textAnchor="middle">q</text>
            <Note x={q.x} y={q.y - 20} text={`query @ 159 · layer ${Math.round(layerPos)}`} size={11} color={qColor} anchor="middle" />
            <g opacity={g(scene.modeReuse)}>
              <circle cx={q.x + 58} cy={q.y} r={11} fill="none" stroke={qColor} strokeWidth={3} strokeDasharray="3 2" />
              <Code x={q.x + 76} y={q.y + 4} text="window_kv_cache" size={11} color={qColor} />
            </g>
          </g>
        )}

        {/* mode cards (beats 2–4) */}
        <ModeCard o={g(scene.modeFull)} mode="Full" lines={['is_kv_source', 'is_index_source']} />
        <ModeCard o={g(scene.modeRe)} mode="Reindex" lines={['Indexer.forward', 'memory: unchanged']} />
        <ModeCard o={g(scene.modeReuse)} mode="Reuse" lines={['shared_attn.topk_idxs', 'selection: unchanged']} />

        {/* 40-layer mode ruler */}
        {g(scene.rulerO) > 0 && (
          <g opacity={g(scene.rulerO)}>
            {MODES.map((m, i) => (
              <rect key={i} x={layerX(i) - 3} y={RULER.y - (m === 'Reuse' ? 5 : 8)} width={6} height={m === 'Reuse' ? 10 : 16}
                rx={2} fill={MODE_COLOR[m]} />
            ))}
            <path d={`M${layerX(layerPos) - 7},${RULER.y + 22} l7,-10 l7,10 z`} fill={TEXT} />
            <Note x={layerX(layerPos)} y={RULER.y + 36} text={`layer ${Math.round(layerPos)}`} size={11} color={TEXT} anchor="middle" />
            <Note x={layerX(0) - 6} y={RULER.y + 4} text="0" size={10} anchor="end" />
            <Note x={layerX(39) + 8} y={RULER.y + 4} text="39" size={10} />
          </g>
        )}

        {/* work rulers (beat 9) */}
        {g(scene.workO) > 0 && (
          <g opacity={g(scene.workO)}>
            <Note x={290} y={235} text="first search" anchor="end" color={TEXT} />
            <rect x={300} y={220} width={w1} height={20} rx={4} fill={SECONDARY} fillOpacity={0.45} stroke={SECONDARY} />
            <Note x={310 + w1} y={235} text="grows with visible history" size={12} />
            <Note x={290} y={295} text="later searches" anchor="end" color={TEXT} />
            <rect x={300} y={280} width={w2} height={20} rx={4} fill={ACCENT} fillOpacity={0.35} stroke={ACCENT} />
            <line x1={630} y1={270} x2={630} y2={310} stroke={ACCENT} strokeDasharray="4 3" opacity={w1 > 330 ? 1 : 0.3} />
            <Note x={640} y={295} text="plateaus at the candidate-pool bound" size={12} />
            <Note x={300} y={200} text="context length →" size={11} />
            <Chip x={300} y={330} text="einsum → masked_fill" o={1} color={MUTED} />
            <Note x={470} y={346} text="reference Indexer.forward: scores everything, then masks" size={12} />
          </g>
        )}

        {/* the local ring, empty (beat 10) */}
        {g(scene.ringO) > 0 && (
          <g opacity={g(scene.ringO)}>
            <circle cx={EMPTY_RING.x} cy={EMPTY_RING.y} r={EMPTY_RING.r} fill="none" stroke={ACCENT} strokeWidth={2} strokeDasharray="4 7" strokeOpacity={0.8} />
            <Note x={EMPTY_RING.x} y={EMPTY_RING.y + 4} text="local window: empty" size={12} color={ACCENT} anchor="middle" />
          </g>
        )}
      </Camera>

      {/* HUD — outside the camera transform */}
      <text x={48} y={64} fill={TEXT} fontFamily={font.ui} fontSize={24} fontWeight={600}>Search Once, Refine, Reuse</text>
      <Chip x={48} text="Illustrative domain: 32 positions; toy budget 2 blocks / Top-4" o={g(scene.railO) * (1 - g(scene.takeO))} color={WARM} />
      <Chip x={500} text="2048 blocks × 8 = 16384 candidates; index_topk = 512" o={g(scene.chipPub)} />
      <Chip x={882} text="Paper deployment algorithm" o={g(scene.chipPaper)} color={SECONDARY} />
      <Takeaway text="Shared memory; refreshed or reused indices" o={g(scene.takeO)} />
    </g>
  );
}

export const vizScene = () => scene;
