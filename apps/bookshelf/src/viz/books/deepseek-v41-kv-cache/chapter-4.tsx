// Replay Only the Recent Tail
//
// Backing: paper arXiv 2609.19969v1 — P1 §§2.1–2.2 (forty layers: twenty-layer causal encoder,
// twenty-layer decoder; decoder global memory from final encoder states) and P5 §§3.2.1–3.2.2,
// §6 (persistent-cache policy, separate encoder/decoder SWA bounded replay, approximate
// recovery, reported ≈1/8 persistent footprint vs DeepSeek-V4-Flash).
// Code anchors (checkout /tmp/deepseek-v41-flash-20260918-full @ dba1be0a40aa45a94ad051997016db3960a90277):
//   S1 Attention._window_kv / get_window_topk_idxs — ordinary local-window semantics;
//   S6 window_size = 128; S8 inference/README.md + Transformer.forward (1242–1272) — a readable
//   reference that iterates all backbone layers. The reference does NOT implement the paper's
//   prefill/replay scheduler, so no function name for it appears anywhere in this scene.
//
// Illustrative inputs: cached prefix 0…159 (token 143), uncached suffix 160…191, W = 128 →
// encoder replay [32,159], decoder replay [64,191]. The L×W braces are a long-history
// dependency schematic (theoretical replay widths, axis break) — not latency measurements.
// Evidence boundary: replayed states are approximate, never shown as equal to a full forward.
//
// Machine: the token tape becomes a time × layer dependency lattice with a movable replay
// boundary; the global rail is preserved while the local ring is refilled.
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
import { Brace } from '../../primitives';

const { ACCENT, SECONDARY, POSITIVE, WARM, NEGATIVE, MUTED, TEXT, PANEL, font } = colors;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const bump = (u: number): number => (u <= 0 || u >= 1 ? 0 : 4 * u * (1 - u));

export const CAPTIONS = [
  "The conversation returns. Its global memory survives, but the encoder's short-lived local cache is missing.",
  'Local dependencies spread backward across layers. Recovering every state exactly can require far more than one window of tokens.',
  'Bounded replay makes a deliberate approximation: replay only the most recent one hundred twenty-eight tokens of the cached prefix.',
  'Inside that replay, local attention cannot look behind the replay boundary. The missing dependencies stay missing.',
  'Replayed prefix tokens rebuild only local memory. Their cached global entries are reused, without recomputing or overwriting them.',
  'New suffix tokens then build both kinds of memory. Their states can depend on where the cache hit occurred.',
  "The decoder has its own replay: pass the prompt's final window of encoder outputs through the decoder layers.",
  "This rebuilds the decoder's local memory for generation. The reconstructed states are approximate, not identical to a full forward pass.",
  "Together with global compression, dropping local caches from persistent storage brings the reported persistent footprint to roughly one eighth of the earlier model's.",
  'Follow our token once more: build its cache, compress and share its global memory, reuse the search, then replay the recent tail when local state is missing.',
] as const;

// ---------------------------------------------------------------------------
// Module-scope data — replay intervals and local dependency masks.
// ---------------------------------------------------------------------------

export const W = 128;
const L = 40;
export const PREFIX = 160;
export const PROMPT = 192;
export const TOKEN = 143;
export const ENC_REPLAY: [number, number] = [PREFIX - W, PREFIX - 1]; // [32, 159]
export const DEC_REPLAY: [number, number] = [PROMPT - W, PROMPT - 1]; // [64, 191]
const S = ENC_REPLAY[0];

/** normal causal local attention: i-W+1 ≤ j ≤ i */
export const maskNormal = (i: number) => Array.from({ length: PROMPT }, (_, j) => j <= i && j >= Math.max(0, i - W + 1));
/** replay truncation: max(s, i-W+1) ≤ j ≤ i — never admits j < s */
export const maskReplay = (i: number) => Array.from({ length: PROMPT }, (_, j) => j <= i && j >= Math.max(S, i - W + 1));
const PROBE = 40;
export const MASK_NORMAL_40 = maskNormal(PROBE); // [0, 40]
export const MASK_REPLAY_40 = maskReplay(PROBE); // [32, 40]
export const EXACT_BUDGET = L * W; // 5120 — long-history schematic only
export const DEC_EXACT_BUDGET = (L / 2) * W; // 2560

// ---------------------------------------------------------------------------
// Layout. Captions own y ≥ 633; the recurrence formula is pinned in the HUD (y = 590, right of
// the zoomed tape labels — y = 550 would collide with the camera-transformed tape).
// ---------------------------------------------------------------------------

const X0 = 150;
const PX = 4.6;
const X = (p: number) => X0 + p * PX;
const TAPE_Y = 470;
const RAIL_Y = 196;
const LAT = { y0: 250, y1: 414, rows: 10, decRows: 20 };
const RING = { x: 1130, y: 330, r: 52 };
const BINS = 16;
const INSET = { x: 200, y: 262, dx: 14, first: 24, n: 24 };
const LOCKS = [20, 56, 92, 128];
const LANDMARKS = [
  { x: 330, label: 'build its cache' },
  { x: 530, label: 'compress + share' },
  { x: 730, label: 'reuse the search' },
  { x: 930, label: 'replay the tail' },
];
const RING_SEGS = Array.from({ length: 32 }, (_, k) => {
  const a0 = ((k + 0.15) / 32) * 2 * Math.PI - Math.PI / 2;
  const a1 = ((k + 0.85) / 32) * 2 * Math.PI - Math.PI / 2;
  return {
    x0: RING.x + RING.r * Math.cos(a0), y0: RING.y + RING.r * Math.sin(a0),
    x1: RING.x + RING.r * Math.cos(a1), y1: RING.y + RING.r * Math.sin(a1),
  };
});

/** schematic dependency cone: each layer down widens the reach by one window-step */
const conePath = (leftClip: number) => {
  const apex = X(PREFIX - 1);
  const pts: string[] = [`${apex},${LAT.y0}`];
  for (let r = 0; r <= LAT.rows; r++) {
    const y = LAT.y0 + ((LAT.y1 - LAT.y0) * r) / LAT.rows;
    pts.push(`${Math.max(leftClip, apex - 74 * (r + 1))},${y}`);
  }
  pts.push(`${apex},${LAT.y1}`);
  return `M${pts.join(' L')} Z`;
};
const CONE_FULL = conePath(X0);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const n = (k: string, v = 0) => tl.channel(k, v);
  const to = (ch: ChannelRef<number>, v: number, at: number, dur = 0.6, e = ease.enter) =>
    tl.tween(ch, v, { at, dur, ease: e });
  const B = (i: number) => 0.5 + 8 * (i - 1);

  const baseO = n('baseO');
  const titleLbl = n('titleLbl');
  const latO = n('latO');
  const coneU = n('coneU');
  const schemO = n('schemO');
  const brU = n('brU');
  const brShift = n('brShift');
  const cropU = n('cropU');
  const brLbl = n('brLbl');
  const probeO = n('probeO');
  const formulaO = n('formulaO');
  const sweepU = n('sweepU');
  const lockO = n('lockO');
  const ringFill = n('ringFill');
  const ringLbl = n('ringLbl');
  const sufU = n('sufU');
  const sufLbl = n('sufLbl');
  const decU = n('decU');
  const decLbl = n('decLbl');
  const approxO = n('approxO');
  const storeO = n('storeO');
  const lmO = n('lmO');
  const lmU = n('lmU');
  const takeO = n('takeO');

  CAPTIONS.forEach((text, i) => tl.caption({ at: B(i + 1), dur: 6.8, text }));

  // 1 — rail intact, ring empty
  to(baseO, 1, 0.5);
  to(titleLbl, 1, 2.0);
  tl.hold(B(1) + 6.8, 1.2);

  // 2 — dependency lattice + long-history schematic
  tl.tween(cam, { x: 600, y: 330, k: 1.15 }, { at: B(2), dur: 1.2, ease: ease.move });
  to(titleLbl, 0, B(2));
  to(latO, 1, B(2) + 0.6);
  to(coneU, 1, B(2) + 1.2, 1.6, ease.draw);
  to(schemO, 1, B(2) + 3.0);
  tl.hold(B(2) + 6.8, 1.2);

  // 3 — bracket sweeps to [32, 159]; the cone is cropped
  tl.tween(cam, { x: 520, y: 325, k: 1.3 }, { at: B(3), dur: 1.2, ease: ease.move });
  to(schemO, 0.15, B(3));
  to(brU, 1, B(3) + 1.2, 1.4, ease.move);
  to(cropU, 1, B(3) + 2.8, 1.2, ease.move);
  to(brLbl, 1, B(3) + 3.0);
  tl.hold(B(3) + 6.8, 1.2);

  // 4 — at i = 40 the mask stops at the boundary
  to(schemO, 0, B(4));
  to(probeO, 1, B(4) + 0.6);
  to(formulaO, 1, B(4) + 1.6);
  tl.hold(B(4) + 6.8, 1.2);

  // 5 — replay refills the local ring; global entries stay locked
  tl.tween(cam, CAMERA_HOME, { at: B(5), dur: 1.2, ease: ease.move });
  to(probeO, 0, B(5));
  to(formulaO, 0, B(5));
  to(latO, 0.15, B(5));
  to(lockO, 1, B(5) + 1.0);
  to(sweepU, 1, B(5) + 1.6, 3.2, ease.linear);
  to(ringFill, 1, B(5) + 1.6, 3.2, ease.linear);
  to(ringLbl, 1, B(5) + 1.6);
  tl.hold(B(5) + 6.8, 1.2);

  // 6 — suffix 160…191 writes both memories
  to(lockO, 0.3, B(6));
  to(sufU, 1, B(6) + 1.0, 3.2, ease.linear);
  to(sufLbl, 1, B(6) + 1.0);
  tl.hold(B(6) + 6.8, 1.2);

  // 7 — decoder replay: bracket moves to the whole prompt's tail
  tl.tween(cam, { x: 820, y: 325, k: 1.2 }, { at: B(7), dur: 1.2, ease: ease.move });
  to(sufLbl, 0, B(7));
  to(ringLbl, 0, B(7));
  to(lockO, 0, B(7));
  to(ringFill, 0, B(7), 0.8, ease.move);
  to(latO, 1, B(7) + 0.6);
  to(decU, 1, B(7) + 0.8, 1.0, ease.move);
  to(brShift, 1, B(7) + 1.6, 1.4, ease.move);
  to(decLbl, 1, B(7) + 3.0);
  tl.hold(B(7) + 6.8, 1.2);

  // 8 — decoder ring refills, dashed: approximate, not exact
  to(latO, 0.1, B(8));
  to(ringFill, 1, B(8) + 0.8, 2.6, ease.linear);
  to(approxO, 1, B(8) + 2.4);
  tl.hold(B(8) + 6.8, 1.2);

  // 9 — persistent storage excludes SWA (paper-reported ≈1/8)
  tl.tween(cam, CAMERA_HOME, { at: B(9), dur: 1.2, ease: ease.move });
  to(decLbl, 0, B(9));
  to(approxO, 0, B(9));
  to(brLbl, 0, B(9));
  to(latO, 0, B(9));
  to(storeO, 1, B(9) + 1.2);
  tl.hold(B(9) + 6.8, 1.2);

  // 10 — four landmarks on the same tape, then a clean end card
  to(storeO, 0, B(10));
  to(lmO, 1, B(10) + 0.4);
  to(lmU, 4, B(10) + 0.8, 4.0, ease.linear);
  to(lmO, 0, B(10) + 5.4);
  to(brU, 0, B(10) + 5.4);
  to(takeO, 1, B(10) + 5.6);
  tl.hold(B(10) + 6.8, 1.2);
  tl.hold(80.5, 1.5);

  return {
    tl, cam, baseO, titleLbl, latO, coneU, schemO, brU, brShift, cropU, brLbl, probeO, formulaO,
    sweepU, lockO, ringFill, ringLbl, sufU, sufLbl, decU, decLbl, approxO, storeO, lmO, lmU, takeO,
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
function Chip({ x, text, o, color = MUTED }: { x: number; text: string; o: number; color?: string }) {
  if (o <= 0) return null;
  const w = text.length * 6.7 + 18;
  return (
    <g opacity={o}>
      <rect x={x} y={88} width={w} height={24} rx={12} fill={PANEL} stroke={color} strokeOpacity={0.6} />
      <text x={x + w / 2} y={104} fill={color} fontFamily={font.mono} fontSize={11} textAnchor="middle">{text}</text>
    </g>
  );
}
function Takeaway({ text, o }: { text: string; o: number }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <rect x={250} y={541} width={780} height={48} rx={10} fill={PANEL} stroke={WARM} strokeOpacity={0.7} />
      <text x={640} y={571} fill={TEXT} fontFamily={font.ui} fontSize={19} fontWeight={600} textAnchor="middle">{text}</text>
    </g>
  );
}
function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 4},${y} v-4 a4,4 0 0 1 8,0 v4`} fill="none" stroke={TEXT} strokeWidth={1.5} />
      <rect x={x - 6} y={y} width={12} height={9} rx={2} fill={TEXT} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>) => s.get(ch);
  const brU = g(scene.brU);
  const shift = g(scene.brShift);
  const crop = g(scene.cropU);
  const sweep = g(scene.sweepU);
  const suf = g(scene.sufU);
  const dec = g(scene.decU);
  const fill = g(scene.ringFill);
  const lm = g(scene.lmU);
  const lat = g(scene.latO);

  // replay bracket: sweeps open onto [32,159], later slides to [64,191]
  const b0 = lerp(ENC_REPLAY[0], DEC_REPLAY[0], shift);
  const b1 = lerp(ENC_REPLAY[1], DEC_REPLAY[1], shift);
  const brRight = X(b1 + 1);
  const brLeft = lerp(brRight, X(b0), brU);
  const sufEnd = lerp(PREFIX, PROMPT, suf);
  const sweepX = suf > 0 ? X(sufEnd) : X(lerp(ENC_REPLAY[0], PREFIX, sweep));
  const sweeping = (sweep > 0 && sweep < 1) || (suf > 0 && suf < 1);
  const rows = Math.round(lerp(LAT.rows, LAT.decRows, dec));
  const tokenX = X(TOKEN);

  return (
    <g>
      <Camera {...g(scene.cam)}>
        <g opacity={g(scene.baseO)}>
          {/* cached global rail — prefix entries never change during replay */}
          <rect x={X(0)} y={RAIL_Y - 8} width={X(PREFIX) - X(0)} height={16} rx={4} fill={SECONDARY} fillOpacity={0.25} stroke={SECONDARY} strokeOpacity={0.85} />
          <path d={`M${X(TOKEN) - 10},${RAIL_Y - 11} a10,8 0 0 1 20,0`} fill="none" stroke={WARM} strokeWidth={2.5} />
          <Note x={X(0)} y={RAIL_Y - 16} text="global memory — cached" size={11} color={SECONDARY} />
          {suf > 0 && (
            <g>
              <rect x={X(PREFIX) + 2} y={RAIL_Y - 8} width={Math.max(0, X(sufEnd) - X(PREFIX) - 2)} height={16} rx={4} fill={SECONDARY} fillOpacity={0.45} stroke={SECONDARY} />
              <circle cx={X(sufEnd)} cy={RAIL_Y} r={6 + 8 * bump(suf)} fill="none" stroke={SECONDARY} strokeWidth={2} opacity={bump(suf)} />
            </g>
          )}
          {g(scene.lockO) > 0 && (
            <g opacity={g(scene.lockO)}>
              {LOCKS.map((p) => <Lock key={p} x={X(p)} y={RAIL_Y - 5} />)}
              <Note x={X(0)} y={RAIL_Y + 28} text="cached global KV: read only during prefix replay" size={12} color={TEXT} />
            </g>
          )}

          {/* token tape */}
          <rect x={X(0)} y={TAPE_Y - 7} width={X(PREFIX) - X(0)} height={14} rx={3} fill={MUTED} fillOpacity={0.18} stroke={MUTED} strokeOpacity={0.6} />
          {suf > 0 && (
            <rect x={X(PREFIX) + 2} y={TAPE_Y - 7} width={Math.max(0, X(sufEnd) - X(PREFIX) - 2)} height={14} rx={3} fill={ACCENT} fillOpacity={0.3} stroke={ACCENT} />
          )}
          <Note x={X(0)} y={TAPE_Y + 26} text="0" size={10} anchor="middle" />
          <Note x={X(PREFIX)} y={TAPE_Y + 26} text="160" size={10} anchor="middle" />
          <Note x={X(PROMPT)} y={TAPE_Y + 26} text="192" size={10} anchor="middle" o={clamp01(suf * 4)} />
          <Note x={X(70)} y={TAPE_Y + 40} text="cached prefix 0…159" size={11} anchor="middle" />

          {/* local ring */}
          <circle cx={RING.x} cy={RING.y} r={RING.r} fill="none" stroke={ACCENT} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="3 8" />
          {/* refilled slots are dashed outlines: approximate states, never equality marks */}
          {RING_SEGS.map((sg, k) =>
            k / RING_SEGS.length < fill ? (
              <line key={k} x1={sg.x0} y1={sg.y0} x2={sg.x1} y2={sg.y1} stroke={ACCENT} strokeWidth={7} strokeOpacity={0.85} />
            ) : null,
          )}
          <Note x={RING.x} y={RING.y - 2} text="local" size={11} color={ACCENT} anchor="middle" />
          <Note x={RING.x} y={RING.y + 13} text={fill > 0.02 ? 'approx.' : 'empty'} size={11} color={ACCENT} anchor="middle" />
          <Note x={RING.x} y={RING.y + RING.r + 28} text="rebuilt local memory" size={11} anchor="middle" o={g(scene.ringLbl)} />
        </g>
        <Code x={X(0)} y={330} text="Encoder SWA Bounded Replay" size={20} color={TEXT} o={g(scene.titleLbl)} />

        {/* dependency lattice */}
        {lat > 0 && (
          <g opacity={lat}>
            {Array.from({ length: rows + 1 }, (_, r) => {
              const y = LAT.y0 + ((LAT.y1 - LAT.y0) * r) / rows;
              return <line key={r} x1={X(0)} x2={X(dec > 0.5 ? PROMPT : PREFIX)} y1={y} y2={y} stroke={dec > 0.5 ? POSITIVE : MUTED} strokeOpacity={0.3} />;
            })}
            <g opacity={1 - dec}>
              <clipPath id="ds41-cone-crop">
                <rect x={lerp(X0, X(S), crop)} y={LAT.y0 - 2} width={1200} height={LAT.y1 - LAT.y0 + 4} />
              </clipPath>
              <path d={CONE_FULL} fill={NEGATIVE} fillOpacity={0.07} stroke="none" />
              <g clipPath="url(#ds41-cone-crop)">
                <path d={CONE_FULL} fill={ACCENT} fillOpacity={0.16} stroke={ACCENT} strokeOpacity={0.8} pathLength={1}
                  strokeDasharray={1} strokeDashoffset={1 - g(scene.coneU)} />
              </g>
              <Note x={X(PREFIX) + 8} y={LAT.y0 + 4} text="top layer" size={10} />
              <Note x={X(PREFIX) + 8} y={LAT.y1 + 4} text="layer 0" size={10} />
            </g>
            <g opacity={dec * g(scene.decLbl)}>
              <Note x={X(PROMPT) + 8} y={LAT.y0 + 60} text="20 decoder" size={10} color={POSITIVE} />
              <Note x={X(PROMPT) + 8} y={LAT.y0 + 74} text="layers" size={10} color={POSITIVE} />
            </g>
          </g>
        )}

        {/* long-history dependency schematic (beat 2) */}
        {g(scene.schemO) > 0 && (
          <g opacity={g(scene.schemO)}>
            <Brace x0={X(S)} x1={X(PREFIX)} y={LAT.y1 + 5} label="W = 128" fontSize={12} color={ACCENT} depth={8} />
            <Brace x0={X0 + 26} x1={X(PREFIX)} y={LAT.y0 - 8} below={false} label="L × W = 40 × 128 = 5120 positions" fontSize={12} color={NEGATIVE} depth={10} />
            <path d={`M${X0 + 4},${LAT.y0 - 22} l8,-10 M${X0 + 14},${LAT.y0 - 22} l8,-10`} stroke={NEGATIVE} strokeWidth={2} />
            <Note x={X0} y={LAT.y0 - 36} text="axis break" size={10} color={NEGATIVE} />
          </g>
        )}

        {/* replay bracket + boundary */}
        {brU > 0 && (
          <g opacity={clamp01(brU * 3)}>
            <path d={`M${brLeft},${TAPE_Y - 16} v-6 H${brRight} v6 M${brLeft},${TAPE_Y + 16} v-4 M${brRight},${TAPE_Y + 16} v-4`} fill="none" stroke={WARM} strokeWidth={2} />
            <rect x={brLeft} y={TAPE_Y - 7} width={brRight - brLeft} height={14} fill={WARM} fillOpacity={0.12} />
            {Array.from({ length: BINS - 1 }, (_, k) => {
              const x = brLeft + ((brRight - brLeft) * (k + 1)) / BINS;
              return <line key={k} x1={x} x2={x} y1={TAPE_Y - 7} y2={TAPE_Y + 7} stroke={WARM} strokeOpacity={0.5} />;
            })}
            <line x1={brLeft} x2={brLeft} y1={RAIL_Y + 14} y2={TAPE_Y + 12} stroke={NEGATIVE} strokeWidth={2} strokeDasharray="6 5" opacity={clamp01(brU * 2 - 1) * (1 - g(scene.storeO)) * (1 - g(scene.lmO))} />
            <g opacity={g(scene.brLbl)}>
              <Code x={brLeft + 6} y={TAPE_Y - 28} size={11} color={WARM}
                text={`replay [${Math.round(b0)}, ${Math.round(b1)}] · window_size = 128`} />
              <Code x={brLeft - 6} y={TAPE_Y + 26} size={11} color={NEGATIVE} anchor="end" text={`s = ${Math.round(b0)}`} />
            </g>
          </g>
        )}

        {/* boundary inset at i = 40 (beat 4) — straight from the precomputed masks */}
        {g(scene.probeO) > 0 && (
          <g opacity={g(scene.probeO)}>
            <rect x={INSET.x - 10} y={INSET.y - 40} width={INSET.dx * INSET.n + 20} height={84} rx={8} fill={PANEL} stroke={MUTED} strokeOpacity={0.4} />
            <Note x={INSET.x} y={INSET.y - 22} text="query i = 40 — positions 24…47" size={11} color={TEXT} />
            {Array.from({ length: INSET.n }, (_, k) => {
              const j = INSET.first + k;
              const normal = MASK_NORMAL_40[j];
              const replay = MASK_REPLAY_40[j];
              const lost = normal && !replay;
              return (
                <g key={j}>
                  <rect x={INSET.x + INSET.dx * k + 1} y={INSET.y - 10} width={INSET.dx - 2} height={18} rx={2}
                    fill={replay ? ACCENT : lost ? NEGATIVE : MUTED} fillOpacity={replay ? 0.5 : lost ? 0.18 : 0.08}
                    stroke={replay ? ACCENT : lost ? NEGATIVE : MUTED} strokeOpacity={0.7} strokeDasharray={lost ? '3 2' : undefined} />
                  {lost && <path d={`M${INSET.x + INSET.dx * k + 3},${INSET.y - 7} l8,12`} stroke={NEGATIVE} strokeWidth={1.5} />}
                </g>
              );
            })}
            <line x1={INSET.x + INSET.dx * (S - INSET.first)} x2={INSET.x + INSET.dx * (S - INSET.first)} y1={INSET.y - 16} y2={INSET.y + 14}
              stroke={NEGATIVE} strokeWidth={2} strokeDasharray="4 3" />
            <Note x={INSET.x} y={INSET.y + 30} text="0…31 missing" size={10} color={NEGATIVE} />
            <Note x={INSET.x + INSET.dx * 9} y={INSET.y + 30} text="32…40 readable" size={10} color={ACCENT} />
            <Note x={INSET.x + INSET.dx * 17.5} y={INSET.y + 30} text="future (causal)" size={10} />
            <line x1={X(PROBE)} x2={X(PROBE)} y1={INSET.y + 44} y2={TAPE_Y - 8} stroke={ACCENT} strokeOpacity={0.6} strokeDasharray="2 4" />
          </g>
        )}

        {/* replay sweep */}
        {sweeping && (
          <line x1={sweepX} x2={sweepX} y1={RAIL_Y + 12} y2={TAPE_Y + 10} stroke={suf > 0 ? ACCENT : WARM} strokeWidth={2.5} />
        )}
        {sweeping && (
          <circle cx={RING.x} cy={RING.y} r={RING.r + 10} fill="none" stroke={ACCENT} strokeWidth={2} opacity={0.5} />
        )}
        <g opacity={g(scene.sufLbl)}>
          <Code x={X(PROMPT) + 10} y={TAPE_Y - 22} text="uncached suffix" size={12} color={ACCENT} />
          <Note x={X(PROMPT) + 10} y={TAPE_Y - 6} text="writes local + global" size={11} />
          <Code x={X(96)} y={TAPE_Y - 48} text="approximate prefix state" size={12} color={NEGATIVE} anchor="middle" />
        </g>
        <g opacity={g(scene.decLbl)}>
          <Code x={X(64)} y={RAIL_Y + 34} text="Decoder SWA Bounded Replay" size={14} color={TEXT} />
          <Code x={X(128)} y={TAPE_Y + 44} text="final encoder hidden states" size={12} color={POSITIVE} anchor="middle" />
          <MathLabel tex={'(L/2)\\times W = 2560 \\;\\text{vs}\\; 128'} x={X(64) + 430} y={RAIL_Y + 30} fontSize={14} anchor="start" color={MUTED} />
        </g>
        <g opacity={g(scene.approxO)}>
          <MathLabel tex={'\\text{approximate} \\neq \\text{exact}'} x={RING.x - 20} y={RING.y + RING.r + 34} fontSize={18} color={NEGATIVE} />
        </g>

        {/* persistent storage ribbon (beat 9) */}
        {g(scene.storeO) > 0 && (
          <g opacity={g(scene.storeO)}>
            <rect x={X(0) - 14} y={RAIL_Y - 34} width={X(PROMPT) - X(0) + 28} height={84} rx={10} fill="none" stroke={SECONDARY} strokeWidth={2} />
            <Note x={X(0)} y={RAIL_Y + 36} text="persistent storage: compressed global memory only" size={12} color={TEXT} />
            <rect x={330} y={290} width={560} height={96} rx={10} fill={PANEL} stroke={MUTED} strokeOpacity={0.4} />
            <rect x={360} y={312} width={400} height={12} rx={3} fill={MUTED} fillOpacity={0.35} />
            <rect x={360} y={338} width={50} height={12} rx={3} fill={SECONDARY} />
            <Note x={770} y={323} text="DeepSeek-V4-Flash" size={11} />
            <Note x={420} y={349} text="this model" size={11} color={SECONDARY} />
            <Code x={360} y={374} text="≈1/8 of DeepSeek-V4-Flash; paper-reported" size={12} />
            <rect x={994} y={510} width={236} height={24} rx={12} fill={PANEL} stroke={ACCENT} strokeOpacity={0.6} strokeDasharray="4 3" />
            <Code x={1112} y={526} text="short-lived encoder SWA: host memory" size={10} color={ACCENT} anchor="middle" />
          </g>
        )}

        {/* recap landmarks (beat 10) */}
        {g(scene.lmO) > 0 && (
          <g opacity={g(scene.lmO)}>
            {LANDMARKS.map((m, i) => {
              const lit = clamp01(lm - i) * (1 - 0.6 * clamp01(lm - i - 1));
              const c = [ACCENT, SECONDARY, POSITIVE, WARM][i];
              return (
                <g key={m.label} opacity={0.2 + 0.8 * lit}>
                  <circle cx={m.x} cy={340} r={26} fill={PANEL} stroke={c} strokeWidth={2} />
                  {i === 0 && <circle cx={m.x} cy={340} r={13} fill="none" stroke={c} strokeWidth={4} strokeDasharray="4 2" />}
                  {i === 1 && <path d={`M${m.x - 14},332 h28 M${m.x - 8},340 h16 M${m.x - 4},348 h8`} stroke={c} strokeWidth={3} />}
                  {i === 2 && <path d={`M${m.x - 14},350 v-8 M${m.x - 5},350 v-20 M${m.x + 4},350 v-6 M${m.x + 13},350 v-16`} stroke={c} strokeWidth={3} />}
                  {i === 3 && <path d={`M${m.x - 14},348 v-8 h28 v8`} fill="none" stroke={c} strokeWidth={3} />}
                  <Note x={m.x} y={388} text={m.label} size={12} color={TEXT} anchor="middle" />
                  <line x1={m.x} x2={m.x} y1={400} y2={TAPE_Y - 12} stroke={c} strokeOpacity={0.4} strokeDasharray="2 4" />
                </g>
              );
            })}
            <circle cx={lerp(LANDMARKS[0].x, LANDMARKS[3].x, clamp01((lm - 1) / 3))} cy={296} r={6} fill={WARM} />
          </g>
        )}

        {/* the throughline token, on the cached prefix */}
        <g opacity={g(scene.baseO)}>
          <circle cx={tokenX} cy={TAPE_Y} r={9} fill={PANEL} stroke={WARM} strokeWidth={2.5} />
          <Code x={tokenX} y={TAPE_Y - 14} text={`${TOKEN}`} size={10} color={WARM} anchor="middle" />
        </g>
      </Camera>

      {/* HUD — outside the camera transform */}
      <text x={48} y={64} fill={TEXT} fontFamily={font.ui} fontSize={24} fontWeight={600}>Replay Only the Recent Tail</text>
      <Chip x={48} text="Paper §3.2.2 — deployment path; approximate states" o={g(scene.baseO)} color={NEGATIVE} />
      <Chip x={420} text="Long-history dependency schematic" o={Math.min(1, g(scene.schemO) * 1.2)} />
      <MathLabel tex={'\\max(s,\\; i-W+1) \\;\\le\\; j \\;\\le\\; i'} x={930} y={590} fontSize={20} opacity={g(scene.formulaO)} />
      <Takeaway text="Preserve global memory. Rebuild recent local state approximately." o={g(scene.takeO)} />
    </g>
  );
}

export const vizScene = () => scene;
