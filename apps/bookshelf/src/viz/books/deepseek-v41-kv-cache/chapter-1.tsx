// One Token, Two Memories
//
// Backing (checkout /tmp/deepseek-v41-flash-20260918-full @ dba1be0a40aa45a94ad051997016db3960a90277):
//   S1 inference/model.py:408 get_window_topk_idxs; Attention._window_kv (700–720, ring
//      overwrite at start_pos % win); Attention.forward (765–789: wq_a → q_norm → wq_b,
//      torch.cat of local + global entries and indices, sparse_attn).
//   S3 Indexer / Attention._compress_kv (compress_kv_cache, topk_idxs).
//   S5 SharedAttentionRuntime (shared_attn.compress_kv); S6 inference/config.json
//      (window_size = 128, 40 backbone layers, compress_ratios[0:2] = [0, 0]).
//   P1–P2 paper §§2.1–2.3.1 (local KV and main Q stay layer-local; global memory is shared).
//
// Illustrative inputs: one token at absolute position 143 (a position, not a tokenizer
// id); the sparse global reads in beat 6 are illustrative picks, not a checkpoint trace.
// Evidence boundary: scope is attention inside the broader block — nothing here claims
// embeddings feed attention without the surrounding transformations.
//
// Machine: an unfolded token tape bends into the 128-slot local ring (16 grouped
// sectors of eight) while a purple global rail stays stretched beyond it.
import {
  CAMERA_HOME,
  Camera,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const { ACCENT, SECONDARY, POSITIVE, WARM, MUTED, TEXT, PANEL, font } = colors;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

export const CAPTIONS = [
  'Follow one token. To help predict what comes next, it leaves a memory that later tokens can read.',
  "Each attention layer asks its own question, using a query built from that layer's current hidden state.",
  'Nearby history goes into a sliding window with room for one hundred twenty-eight positions.',
  'When the ring fills, the new token overwrites one old slot. The local memory stops growing.',
  'Older history can still matter. A separate global memory reaches beyond that moving window.',
  'The query reads selected global entries together with its local window in one sparse attention operation.',
  'The first two layers use only the window. Later layers add the global branch.',
  'Every layer keeps its own local window, even when several layers share their global memory.',
  'Our token now has two roles: nearby detail in the window, and a contribution to longer-lived memory.',
  "Keep the window small. Next, we'll shrink the global memory without giving every layer its own copy.",
] as const;

// ---------------------------------------------------------------------------
// Module-scope data — the real ring arithmetic (W = 128, slot = p % W).
// ---------------------------------------------------------------------------

export const W = 128;
export const TOKEN = 143;
export const TOKEN_SLOT = TOKEN % W; // 15
const N_LAYERS = 40;

/** RING_SNAPSHOTS[p][slot] = absolute position held after inserting p (-1 = empty). */
export const RING_SNAPSHOTS: number[][] = (() => {
  const out: number[][] = [];
  const ring = new Array<number>(W).fill(-1);
  for (let p = 0; p < 160; p++) {
    ring[p % W] = p;
    out.push(ring.slice());
  }
  return out;
})();
const BEFORE = RING_SNAPSHOTS[TOKEN - 1];
const AFTER = RING_SNAPSHOTS[TOKEN];
/** chronological → physical slot for the live window after inserting 143: [16 … 143]. */
export const CHRONO = Array.from({ length: W }, (_, c) => {
  const pos = TOKEN - W + 1 + c;
  return { pos, slot: pos % W };
});
export const LIVE_WINDOW: [number, number] = [CHRONO[0].pos, CHRONO[W - 1].pos]; // [16, 143]

// ---------------------------------------------------------------------------
// Layout. Captions own y ≥ 633; the machine lives in y = 170…510.
// ---------------------------------------------------------------------------

const RING = { x: 420, y: 330, r: 90 };
const SECTORS = 16;
const TAPE_X0 = 170;
const TAPE_DX = 32;
const sectorAngle = (i: number) => -90 + ((i + 0.5) * 360) / SECTORS;
const slotAngle = (slot: number) => -90 + ((slot + 0.5) * 360) / W;
const polar = (deg: number, r: number) => ({
  x: RING.x + r * Math.cos((deg * Math.PI) / 180),
  y: RING.y + r * Math.sin((deg * Math.PI) / 180),
});
const SECTOR_GEOM = Array.from({ length: SECTORS }, (_, i) => ({
  tape: { x: TAPE_X0 + TAPE_DX * i + TAPE_DX / 2, y: RING.y },
  ring: polar(sectorAngle(i), RING.r),
  rot: sectorAngle(i) + 90,
}));
const TOKEN_TAPE = { x: TAPE_X0 + TAPE_DX * SECTORS + 30, y: RING.y };
const TOKEN_HOVER = polar(slotAngle(TOKEN_SLOT), RING.r + 36);
const TOKEN_RING = polar(slotAngle(TOKEN_SLOT), RING.r);

// live-window arc: starts just after slot 15 and runs all the way round to slot 15
const ARC_R = RING.r + 20;
const ARC_PATH = (() => {
  const a0 = polar(slotAngle(TOKEN_SLOT + 1) - 1, ARC_R);
  const mid = polar(slotAngle(TOKEN_SLOT + 1) + 179, ARC_R);
  const a1 = polar(slotAngle(TOKEN_SLOT) + 1, ARC_R);
  return `M${a0.x},${a0.y} A${ARC_R},${ARC_R} 0 0 1 ${mid.x},${mid.y} A${ARC_R},${ARC_R} 0 0 1 ${a1.x},${a1.y}`;
})();

// expanded slots 8…23 (sectors 1 and 2)
const DETAIL = { x: 228, y: 436, w: 24, h: 22, first: 8, n: 16 };

// global rail, stretched beyond the ring
const RAIL = { x: 640, y: 318, w: 18, h: 24, dx: 20, n: 26 };
const RAIL_PROV = 24; // grouped cell carrying token 143's contribution
const railCx = (i: number) => RAIL.x + RAIL.dx * i + RAIL.w / 2;
const SPARSE_READS = [4, 9, 15, 22]; // illustrative global picks
const Q = { x: 820, y: 450 };
const COMB_LOCAL = `M${Q.x},${Q.y} C700,${Q.y} 600,410 ${RING.x + RING.r + 6},${RING.y + 14}`;
const COMB_GLOBAL = SPARSE_READS.map(
  (i) => `M${Q.x},${Q.y} C${Q.x},400 ${railCx(i)},410 ${railCx(i)},${RAIL.y + RAIL.h + 2}`,
);

const RULER = { x: 170, y: 500, dx: 24 };
const QUERY_STEPS = ['wq_a', 'q_norm', 'wq_b'];

// ---------------------------------------------------------------------------
// Timeline — ten fixed caption windows, 82 authored seconds.
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const n = (k: string, v = 0) => tl.channel(k, v);
  const to = (ch: ChannelRef<number>, v: number, at: number, dur = 0.6, e = ease.enter) =>
    tl.tween(ch, v, { at, dur, ease: e });
  const B = (i: number) => 0.5 + 8 * (i - 1);

  const tapeO = n('tapeO');
  const tokenO = n('tokenO');
  const tokenIn = n('tokenIn');
  const srcLbl = n('srcLbl');
  const chipTok = n('chipTok');
  const chipSlots = n('chipSlots');
  const chipSparse = n('chipSparse');
  const queryU = n('queryU');
  const queryO = n('queryO');
  const curlU = n('curlU');
  const winLbl = n('winLbl');
  const arcU = n('arcU');
  const arcO = n('arcO', 1);
  const detailO = n('detailO');
  const overU = n('overU');
  const modLbl = n('modLbl');
  const railU = n('railU');
  const railLbl = n('railLbl');
  const contrastLbl = n('contrastLbl');
  const combQ = n('combQ');
  const combU = n('combU');
  const combLbl = n('combLbl');
  const rulerU = n('rulerU');
  const rulerO = n('rulerO', 1);
  const tick01 = n('tick01');
  const fanU = n('fanU');
  const fanLbl = n('fanLbl');
  const provU = n('provU');
  const roleLbl = n('roleLbl');
  const takeO = n('takeO');

  CAPTIONS.forEach((text, i) => tl.caption({ at: B(i + 1), dur: 6.8, text }));

  // 1 — the gold token enters the tape
  to(tapeO, 1, 0.5);
  to(tokenO, 1, 1.0);
  to(tokenIn, 1, 1.2, 1.2, ease.move);
  to(srcLbl, 1, 2.6);
  to(chipTok, 1, 3.2);
  tl.hold(B(1) + 6.8, 1.2);

  // 2 — a query unfolds beside the same token
  to(srcLbl, 0.15, B(2));
  to(queryO, 1, B(2) + 0.4);
  to(queryU, 1, B(2) + 0.6, 3.0, ease.draw);
  tl.hold(B(2) + 6.8, 1.2);

  // 3 — the tape curls into the 128-slot ring
  to(queryO, 0, B(3));
  to(srcLbl, 0, B(3));
  tl.tween(cam, { x: 420, y: 330, k: 1.35 }, { at: B(3), dur: 1.2, ease: ease.move });
  to(curlU, 1, B(3) + 1.2, 1.4, ease.move);
  to(chipSlots, 1, B(3) + 2.0);
  to(winLbl, 1, B(3) + 2.8);
  to(arcU, 1, B(3) + 3.2, 1.2, ease.draw);
  tl.hold(B(3) + 6.8, 1.2);

  // 4 — slot 15: position 15 is overwritten by 143
  to(arcO, 0.15, B(4));
  to(winLbl, 0.15, B(4));
  to(detailO, 1, B(4) + 0.3);
  to(overU, 1, B(4) + 1.6, 1.0, ease.move);
  to(modLbl, 1, B(4) + 2.8);
  tl.hold(B(4) + 6.8, 1.2);

  // 5 — a separate global rail reaches past the window
  tl.tween(cam, CAMERA_HOME, { at: B(5), dur: 1.2, ease: ease.move });
  to(detailO, 0, B(5));
  to(modLbl, 0, B(5));
  to(railU, 1, B(5) + 1.2, 1.4, ease.draw);
  to(railLbl, 1, B(5) + 2.6);
  to(contrastLbl, 1, B(5) + 3.4);
  tl.hold(B(5) + 6.8, 1.2);

  // 6 — one read comb: local window + selected global entries
  tl.tween(cam, { x: 820, y: 330, k: 1.2 }, { at: B(6), dur: 1.2, ease: ease.move });
  to(contrastLbl, 0, B(6));
  to(combQ, 1, B(6) + 1.2);
  to(combU, 1, B(6) + 1.8, 1.2, ease.draw);
  to(chipSparse, 1, B(6) + 1.8);
  to(combLbl, 1, B(6) + 3.2);
  tl.hold(B(6) + 6.8, 1.2);

  // 7 — 40-tick layer ruler; layers 0 and 1 are window-only
  tl.tween(cam, CAMERA_HOME, { at: B(7), dur: 1.2, ease: ease.move });
  to(combU, 0, B(7));
  to(combQ, 0, B(7));
  to(combLbl, 0, B(7));
  to(chipSparse, 0, B(7));
  to(rulerU, 1, B(7) + 1.2, 1.2, ease.draw);
  to(tick01, 1, B(7) + 2.6);
  tl.hold(B(7) + 6.8, 1.2);

  // 8 — layer-local ring outlines fan out; the rail stays shared
  to(rulerO, 0.15, B(8));
  to(winLbl, 0, B(8));
  to(fanU, 1, B(8) + 0.5, 1.2, ease.move);
  to(fanLbl, 1, B(8) + 1.9);
  tl.hold(B(8) + 6.8, 1.2);

  // 9 — two roles for one token
  to(fanU, 0, B(9), 1.0, ease.move);
  to(fanLbl, 0, B(9));
  to(rulerO, 0, B(9));
  to(provU, 1, B(9) + 1.0, 1.2, ease.draw);
  to(roleLbl, 1, B(9) + 2.4);
  tl.hold(B(9) + 6.8, 1.2);

  // 10 — clean paired silhouette + takeaway
  to(roleLbl, 0, B(10));
  to(railLbl, 0.15, B(10));
  to(arcO, 0, B(10));
  to(chipTok, 0, B(10));
  to(chipSlots, 0, B(10));
  to(takeO, 1, B(10) + 1.5);
  tl.hold(B(10) + 6.8, 1.2);
  tl.hold(80.5, 1.5);

  return {
    tl, cam, tapeO, tokenO, tokenIn, srcLbl, chipTok, chipSlots, chipSparse, queryU, queryO,
    curlU, winLbl, arcU, arcO, detailO, overU, modLbl, railU, railLbl, contrastLbl, combQ,
    combU, combLbl, rulerU, rulerO, tick01, fanU, fanLbl, provU, roleLbl, takeO,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local SVG helpers
// ---------------------------------------------------------------------------

function Code({ x, y, text, o = 1, color = TEXT, size = 13, anchor = 'start' }: {
  x: number; y: number; text: string; o?: number; color?: string; size?: number;
  anchor?: 'start' | 'middle' | 'end';
}) {
  if (o <= 0) return null;
  return (
    <text x={x} y={y} fill={color} opacity={o} fontFamily={font.mono} fontSize={size} textAnchor={anchor}>
      {text}
    </text>
  );
}

function Note({ x, y, text, o = 1, color = MUTED, size = 13, anchor = 'start' }: {
  x: number; y: number; text: string; o?: number; color?: string; size?: number;
  anchor?: 'start' | 'middle' | 'end';
}) {
  if (o <= 0) return null;
  return (
    <text x={x} y={y} fill={color} opacity={o} fontFamily={font.ui} fontSize={size} textAnchor={anchor}>
      {text}
    </text>
  );
}

function Chip({ x, text, o, color = MUTED }: { x: number; text: string; o: number; color?: string }) {
  if (o <= 0) return null;
  const w = text.length * 6.7 + 18;
  return (
    <g opacity={o}>
      <rect x={x} y={88} width={w} height={24} rx={12} fill={PANEL} stroke={color} strokeOpacity={0.6} />
      <text x={x + w / 2} y={104} fill={color} fontFamily={font.mono} fontSize={11} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

function Takeaway({ text, o }: { text: string; o: number }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <rect x={340} y={541} width={600} height={48} rx={10} fill={PANEL} stroke={WARM} strokeOpacity={0.7} />
      <text x={640} y={571} fill={TEXT} fontFamily={font.ui} fontSize={20} fontWeight={600} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>) => s.get(ch);
  const curl = g(scene.curlU);
  const over = g(scene.overU);
  const tokenIn = g(scene.tokenIn);
  const railU = g(scene.railU);
  const combU = g(scene.combU);
  const fanU = g(scene.fanU);
  const provU = g(scene.provU);
  const queryU = g(scene.queryU);
  const rulerU = g(scene.rulerU);

  // token: enters the tape, hovers outside slot 15 once the ring forms, drops in on overwrite
  const tapeX = lerp(1180, TOKEN_TAPE.x, tokenIn);
  const hover = { x: lerp(tapeX, TOKEN_HOVER.x, curl), y: lerp(TOKEN_TAPE.y, TOKEN_HOVER.y, curl) };
  const tok = { x: lerp(hover.x, TOKEN_RING.x, over), y: lerp(hover.y, TOKEN_RING.y, over) };

  return (
    <g>
      <Camera {...g(scene.cam)}>
        {/* tape ⇄ ring: 16 grouped sectors of eight physical slots */}
        <g opacity={g(scene.tapeO)}>
          {SECTOR_GEOM.map((sg, i) => {
            const x = lerp(sg.tape.x, sg.ring.x, curl);
            const y = lerp(sg.tape.y, sg.ring.y, curl);
            const hot = i === 1 ? g(scene.detailO) : 0;
            return (
              <g key={i} transform={`translate(${x},${y}) rotate(${sg.rot * curl})`}>
                <rect x={-14} y={-8} width={28} height={16} rx={3} fill={ACCENT} fillOpacity={0.14 + 0.2 * hot}
                  stroke={ACCENT} strokeOpacity={0.75} />
              </g>
            );
          })}
        </g>
        <Code x={TAPE_X0} y={296} text="input_ids" o={g(scene.srcLbl)} color={MUTED} />
        <Code x={TAPE_X0} y={372} text="Transformer.forward" o={g(scene.srcLbl)} color={MUTED} />

        {/* layer-local ring outlines (beat 8) */}
        {fanU > 0 &&
          [1, 2, 3, 4].map((i) => (
            <circle key={i} cx={RING.x + 16 * i * fanU} cy={RING.y - 12 * i * fanU} r={RING.r} fill="none"
              stroke={ACCENT} strokeOpacity={0.55 - 0.08 * i} strokeDasharray="5 4" opacity={clamp01(fanU * 2)} />
          ))}
        <Code x={RING.x + 40} y={182} text="window_kv_cache — one per layer" o={g(scene.fanLbl)} color={ACCENT} anchor="middle" />

        {/* chronological live window arc */}
        <g opacity={g(scene.arcO)}>
          <path d={ARC_PATH} fill="none" stroke={ACCENT} strokeWidth={2} pathLength={1}
            strokeDasharray={1} strokeDashoffset={1 - g(scene.arcU)} opacity={g(scene.arcU) > 0 ? 1 : 0} />
        </g>
        <g opacity={g(scene.winLbl)}>
          <Code x={RING.x} y={RING.y - 8} text="window_size = 128" color={ACCENT} anchor="middle" />
          <Code x={RING.x} y={RING.y + 12} text="window_kv_cache" color={MUTED} size={12} anchor="middle" />
          <Note x={RING.x} y={RING.y + 32} text={`live window [${LIVE_WINDOW[0]}, ${LIVE_WINDOW[1]}]`} size={11} anchor="middle" />
        </g>

        {/* expanded slots 8…23 */}
        {g(scene.detailO) > 0 && (
          <g opacity={g(scene.detailO)}>
            {Array.from({ length: DETAIL.n }, (_, k) => {
              const slot = DETAIL.first + k;
              const isTok = slot === TOKEN_SLOT;
              const x = DETAIL.x + DETAIL.w * k;
              return (
                <g key={slot}>
                  <rect x={x + 1} y={DETAIL.y} width={DETAIL.w - 2} height={DETAIL.h} rx={3} fill={PANEL}
                    stroke={isTok ? WARM : ACCENT} strokeOpacity={isTok ? 0.4 + 0.6 * over : 0.5}
                    strokeWidth={isTok ? 1 + over : 1} />
                  {isTok ? (
                    <>
                      <text x={x + DETAIL.w / 2} y={DETAIL.y + 15} fill={MUTED} opacity={1 - over} fontSize={9}
                        fontFamily={font.mono} textAnchor="middle">{BEFORE[slot]}</text>
                      <text x={x + DETAIL.w / 2} y={DETAIL.y + 15} fill={WARM} opacity={over} fontSize={9}
                        fontFamily={font.mono} textAnchor="middle">{AFTER[slot]}</text>
                    </>
                  ) : (
                    <text x={x + DETAIL.w / 2} y={DETAIL.y + 15} fill={MUTED} fontSize={9} fontFamily={font.mono}
                      textAnchor="middle">{AFTER[slot]}</text>
                  )}
                </g>
              );
            })}
            <Note x={DETAIL.x} y={DETAIL.y - 6} text="slots 8…23, position held" size={10} />
          </g>
        )}
        <g opacity={g(scene.modLbl)}>
          <Code x={DETAIL.x + DETAIL.w * DETAIL.n + 12} y={DETAIL.y + 8} text="start_pos % win" color={WARM} size={12} />
          <Code x={DETAIL.x + DETAIL.w * DETAIL.n + 12} y={DETAIL.y + 24} text={`${TOKEN} % ${W} = ${TOKEN_SLOT}`} color={MUTED} size={11} />
        </g>

        {/* query construction (beat 2) */}
        {g(scene.queryO) > 0 && (
          <g opacity={g(scene.queryO)}>
            {QUERY_STEPS.map((name, i) => {
              const u = clamp01(queryU * 4 - i);
              const x = 800 + 110 * i;
              return (
                <g key={name} opacity={u}>
                  <line x1={x - 50} y1={330} x2={x - 8} y2={330} stroke={ACCENT} strokeOpacity={0.6} />
                  <rect x={x - 6} y={312} width={66} height={36} rx={6} fill={PANEL} stroke={ACCENT} strokeOpacity={0.7} />
                  <text x={x + 27} y={335} fill={TEXT} fontFamily={font.mono} fontSize={13} textAnchor="middle">{name}</text>
                </g>
              );
            })}
            <g opacity={clamp01(queryU * 4 - 3)}>
              <line x1={1086} y1={330} x2={1122} y2={330} stroke={ACCENT} strokeOpacity={0.6} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={i} x={1126} y={276 + 18 * i} width={16} height={16} rx={2} fill={ACCENT}
                  fillOpacity={0.25 + 0.12 * ((i * 5) % 4)} stroke={ACCENT} />
              ))}
              <Note x={1134} y={264} text="query q" color={ACCENT} anchor="middle" />
              <Note x={930} y={386} text="built from this layer's hidden state" anchor="middle" size={12} />
            </g>
          </g>
        )}

        {/* global rail */}
        {railU > 0 && (
          <g>
            {Array.from({ length: RAIL.n }, (_, i) => {
              const u = clamp01(railU * RAIL.n - i);
              const read = SPARSE_READS.includes(i) ? combU : 0;
              return (
                <rect key={i} x={RAIL.x + RAIL.dx * i} y={RAIL.y} width={RAIL.w} height={RAIL.h} rx={3}
                  fill={SECONDARY} fillOpacity={0.18 + 0.4 * read} stroke={read > 0 ? POSITIVE : SECONDARY}
                  strokeOpacity={0.8} opacity={u} />
              );
            })}
          </g>
        )}
        <Code x={RAIL.x} y={RAIL.y - 12} text="compress_kv_cache" o={g(scene.railLbl)} color={SECONDARY} />
        <Code x={RAIL.x + RAIL.dx * RAIL.n} y={RAIL.y - 12} text="shared_attn.compress_kv" o={g(scene.fanLbl)} color={SECONDARY} anchor="end" />
        <g opacity={g(scene.contrastLbl)}>
          <Note x={RING.x} y={478} text="local: overwritten, fixed size" color={ACCENT} anchor="middle" />
          <Note x={RAIL.x + (RAIL.dx * RAIL.n) / 2} y={372} text="global: retained beyond the window" color={SECONDARY} anchor="middle" />
        </g>

        {/* read comb (beat 6) */}
        {combU > 0 && (
          <g>
            <path d={COMB_LOCAL} fill="none" stroke={ACCENT} strokeWidth={2} pathLength={1} strokeDasharray={1}
              strokeDashoffset={1 - combU} />
            {COMB_GLOBAL.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={POSITIVE} strokeWidth={2} pathLength={1} strokeDasharray={1}
                strokeDashoffset={1 - combU} />
            ))}
          </g>
        )}
        {g(scene.combQ) > 0 && (
          <g opacity={g(scene.combQ)}>
            <circle cx={Q.x} cy={Q.y} r={10} fill={PANEL} stroke={ACCENT} strokeWidth={2} />
            <text x={Q.x} y={Q.y + 4} fill={ACCENT} fontFamily={font.mono} fontSize={11} textAnchor="middle">q</text>
          </g>
        )}
        <g opacity={g(scene.combLbl)}>
          <Code x={Q.x} y={Q.y + 34} text="sparse_attn" color={TEXT} anchor="middle" />
          <Code x={Q.x - 150} y={Q.y + 6} text="torch.cat" color={MUTED} anchor="end" />
          <Code x={1010} y={400} text="topk_idxs" color={POSITIVE} />
        </g>

        {/* 40-tick layer ruler (beat 7) */}
        {rulerU > 0 && (
          <g opacity={g(scene.rulerO)}>
            {Array.from({ length: N_LAYERS }, (_, i) => {
              const u = clamp01(rulerU * N_LAYERS - i);
              const local = i < 2;
              const hot = local ? g(scene.tick01) : 0;
              return (
                <line key={i} x1={RULER.x + RULER.dx * i} x2={RULER.x + RULER.dx * i} y1={RULER.y - 8 - 6 * hot}
                  y2={RULER.y + 8 + 6 * hot} stroke={local ? ACCENT : SECONDARY} strokeWidth={local ? 3 : 2}
                  strokeOpacity={local ? 1 : 0.55} opacity={u} />
              );
            })}
            <Note x={RULER.x} y={RULER.y + 34} text="layer 0" size={11} anchor="middle" />
            <Note x={RULER.x + RULER.dx * 39} y={RULER.y + 34} text="39" size={11} anchor="middle" />
            <g opacity={g(scene.tick01)}>
              <Code x={RULER.x - 6} y={RULER.y - 24} text="compress_ratios[0:2] = [0, 0]" color={ACCENT} />
              <Note x={RULER.x + RULER.dx * 2 + 6} y={RULER.y + 34} text="window only" color={ACCENT} size={11} />
              <Note x={RULER.x + RULER.dx * 20} y={RULER.y + 34} text="later layers: window + global branch" color={SECONDARY} size={11} anchor="middle" />
            </g>
          </g>
        )}

        {/* gold provenance on the rail (beat 9) */}
        {provU > 0 && (
          <path d={`M${railCx(RAIL_PROV) - 12},${RAIL.y - 3} A12,9 0 0 1 ${railCx(RAIL_PROV) + 12},${RAIL.y - 3}`}
            fill="none" stroke={WARM} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - provU} />
        )}
        <g opacity={g(scene.roleLbl)}>
          <Note x={RING.x} y={478} text="nearby detail — its window slot" color={WARM} anchor="middle" />
          <Note x={railCx(RAIL_PROV)} y={372} text="a contribution to longer-lived memory" color={WARM} anchor="end" />
        </g>

        {/* the throughline token */}
        <g opacity={g(scene.tokenO)}>
          <circle cx={tok.x} cy={tok.y} r={11} fill={PANEL} stroke={WARM} strokeWidth={2.5} />
          <text x={tok.x} y={tok.y + 3.5} fill={WARM} fontFamily={font.mono} fontSize={9} textAnchor="middle">{TOKEN}</text>
        </g>
      </Camera>

      {/* HUD — outside the camera transform */}
      <text x={48} y={64} fill={TEXT} fontFamily={font.ui} fontSize={24} fontWeight={600}>One Token, Two Memories</text>
      <Chip x={48} text="Illustrative token position: 143" o={g(scene.chipTok)} color={WARM} />
      <Chip x={300} text="128 slots; grouped display" o={g(scene.chipSlots)} color={ACCENT} />
      <Chip x={510} text="Illustrative sparse reads" o={g(scene.chipSparse)} color={POSITIVE} />
      <Takeaway text="Local window + shared global memory" o={g(scene.takeO)} />
    </g>
  );
}

export const vizScene = () => scene;
