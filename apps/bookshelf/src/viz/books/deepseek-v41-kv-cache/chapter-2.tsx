// Squeeze the Global Memory
//
// Backing (checkout /tmp/deepseek-v41-flash-20260918-full @ dba1be0a40aa45a94ad051997016db3960a90277):
//   S2 inference/model.py:429 Compressor.__init__/forward (wkv, wgate, score.softmax(dim=2),
//      kv_state / score_state for incomplete groups, ratio-one path self.norm(self.wkv(x))).
//   S3 Indexer (wk, k_norm from the pre-RoPE latent); Attention._compress_kv (739–763:
//      index first, then apply_rotary_emb + fp4_act_quant on the main latent).
//   S5/S6 kv_source_layers = [2, 8, 14, 20]; head_dim = 512; encoder sources ratio 2,
//      decoder source layer 20 ratio 1 (zero-based code indices).
//   S7 inference/kernel.py fp4_quant_kernel / fp4_act_quant (E2M1, in-place dequantized write-back).
//   P1–P2 paper §§2.1–2.3.1, Eq. 1 (CED); P4 §2.4.4 (E2M1 + one E4M3 scale per 16 channels,
//      indexer MXFP4, local SWA FP8, reported 890 bytes/token global footprint).
//
// Illustrative inputs (NOT a checkpoint trace): projected vectors A, B and gate logits
// ZA, ZB over 4 shown channels; a separate 16-channel post-RoPE vector with scale exactly 1.
// Evidence boundaries: the byte arithmetic is derived packed-format accounting for the
// global cache only (no SWA, partial-group buffers, alignment or TP replication); the
// reference code quantizes in place and keeps dequantized tensors. Ratio one is not pooling.
//
// Machine: the global rail becomes a channel-wise press — sequence pooling, fewer bits,
// layer sharing — three visibly distinct squeezes.
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

const { ACCENT, SECONDARY, POSITIVE, WARM, MUTED, TEXT, PANEL, font } = colors;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const peak = (d: number): number => clamp01(1 - Math.abs(d));

export const CAPTIONS = [
  'A long history gets expensive when every layer stores another copy. Watch three different kinds of shrinking.',
  "In the encoder, each completed pair of tokens becomes one memory entry, with learned weights choosing each channel's mixture.",
  'An unfinished pair waits. Our token completes the pair, and only then can its compressed entry appear.',
  "The indexer's key comes from this latent before rotation. The main cache is rotated and quantized afterward.",
  'Main memory stores four-bit values, with one scale for each sixteen channels. The local window stays at eight-bit precision.',
  'Sharing removes another kind of duplication: only four backbone layers produce the global caches that other layers read.',
  "The decoder's global memory comes from the encoder's final hidden states. Here, one token makes one entry, with no pair pooling.",
  "Count the packed values and their scales, including the indexer's keys. The global footprint comes to eight hundred ninety bytes per token.",
  "The reference code simulates quantization in place. Those packed byte counts describe the paper's storage format, not its allocated tensors.",
  "Our token's memory now occupies fewer entries, fewer bits, and fewer copies. Next, which entries should a query actually read?",
] as const;

// ---------------------------------------------------------------------------
// Module-scope math — illustrative inputs, real operations.
// ---------------------------------------------------------------------------

const A = [1, 2, 3, 4];
const Bv = [4, 3, 2, 1];
const ZA = [0, Math.log(3), 0, Math.log(3)];
const ZB = [Math.log(3), 0, Math.log(3), 0];
/** per-channel softmax over the two token positions */
export const WA = ZA.map((z, d) => Math.exp(z) / (Math.exp(z) + Math.exp(ZB[d]))); // [.25,.75,.25,.75]
export const WB = WA.map((w) => 1 - w);
export const POOLED = A.map((a, d) => WA[d] * a + WB[d] * Bv[d]); // [3.25,2.25,2.25,3.25]
const RMS = Math.sqrt(POOLED.reduce((acc, v) => acc + v * v, 0) / POOLED.length + 1e-20);
export const NORMED = POOLED.map((v) => v / RMS); // unit norm weights
export const GROUP = Math.floor(143 / 2); // token 142 opens group 71, token 143 completes it

const E2M1 = [0, 0.5, 1, 1.5, 2, 3, 4, 6];
const RAW16 = [0, 0.4, 0.9, 1.4, 2.1, 2.8, 4.2, 6, -0.4, -0.9, -1.4, -2.1, -2.8, -4.2, -6, 0];
export const QUANT16 = RAW16.map((v) => {
  const mag = E2M1.reduce((best, l) => (Math.abs(l - Math.abs(v)) < Math.abs(best - Math.abs(v)) ? l : best), 0);
  return v < 0 ? -mag : mag;
});

export const MAIN_BYTES = (512 * 4) / 8 + 512 / 16; // 288
export const INDEX_BYTES = (128 * 4) / 8 + 128 / 32; // 68
export const ENTRIES_PER_TOKEN = 3 / 2 + 1; // 2.5
export const TOTAL_BYTES = ENTRIES_PER_TOKEN * (MAIN_BYTES + INDEX_BYTES); // 890

const N_LAYERS = 40;
const KV_SOURCES = [2, 8, 14, 20];
/** each global-reading layer drawn toward the nearest source at or before it; 0–1 are window-only */
const OWNER_OF = Array.from({ length: N_LAYERS }, (_, i) => {
  let o = -1;
  for (const src of KV_SOURCES) if (src <= i) o = src;
  return o;
});

const fmt = (v: number) => (Math.round(v * 100) / 100).toString();

// ---------------------------------------------------------------------------
// Layout. Captions own y ≥ 633; every zoomed element stays above y ≈ 505.
// ---------------------------------------------------------------------------

const RAIL = { x: 170, dx: 23.5, n: 40, w: 21, h: 16, prov: 35 };
const COL = { a: 290, b: 370, m: 500, y: 240, dy: 38, w: 44, h: 34 };
const BITS = { x: 440, y: 290, dx: 35, h: 36 };
const TRACK = { x: 170, dx: 24, y0: 240, y1: 400 };
const trackX = (i: number) => TRACK.x + TRACK.dx * i;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const n = (k: string, v = 0) => tl.channel(k, v);
  const to = (ch: ChannelRef<number>, v: number, at: number, dur = 0.6, e = ease.enter) =>
    tl.tween(ch, v, { at, dur, ease: e });
  const B = (i: number) => 0.5 + 8 * (i - 1);

  const railO = n('railO');
  const railY = n('railY', 330);
  const axesO = n('axesO');
  const axisSel = n('axisSel', -1);
  const pressO = n('pressO');
  const pressLbl = n('pressLbl');
  const bO = n('bO', 1);
  const mergeU = n('mergeU');
  const normU = n('normU');
  const pendO = n('pendO');
  const formulaO = n('formulaO');
  const chipIll = n('chipIll');
  const idxO = n('idxO');
  const ribU = n('ribU');
  const mainU = n('mainU');
  const rotU = n('rotU');
  const bitsO = n('bitsO');
  const narrowU = n('narrowU');
  const scaleO = n('scaleO');
  const layersO = n('layersO');
  const tracksU = n('tracksU');
  const convU = n('convU');
  const decO = n('decO');
  const openU = n('openU');
  const chipCed = n('chipCed');
  const acctO = n('acctO');
  const acctU = n('acctU');
  const totalO = n('totalO');
  const chipAcct = n('chipAcct');
  const refO = n('refO');
  const takeO = n('takeO');

  CAPTIONS.forEach((text, i) => tl.caption({ at: B(i + 1), dur: 6.8, text }));

  // 1 — the rail gains three axes; one moves at a time
  to(railO, 1, 0.5);
  to(axesO, 1, 1.4);
  to(axisSel, 0, 2.0, 0.8, ease.move);
  to(axisSel, 1, 3.8, 0.8, ease.move);
  to(axisSel, 2, 5.6, 0.8, ease.move);
  tl.hold(B(1) + 6.8, 1.2);

  // 2 — tokens 142 / 143 merge channel by channel
  to(axesO, 0, B(2));
  tl.tween(cam, { x: 430, y: 325, k: 1.35 }, { at: B(2), dur: 1.2, ease: ease.move });
  to(railY, 490, B(2), 1.2, ease.move);
  to(pressO, 1, B(2) + 1.0);
  to(pressLbl, 1, B(2) + 1.4);
  to(chipIll, 1, B(2) + 1.4);
  to(mergeU, 1, B(2) + 2.6, 1.4, ease.move);
  to(formulaO, 1, B(2) + 3.0);
  to(normU, 1, B(2) + 4.4, 1.0, ease.move);
  tl.hold(B(2) + 6.8, 1.2);

  // 3 — reverse to the pending half-group, then complete it
  to(normU, 0, B(3), 0.6, ease.move);
  to(mergeU, 0, B(3) + 0.2, 1.0, ease.move);
  to(bO, 0, B(3) + 0.2);
  to(pendO, 1, B(3) + 1.2);
  to(bO, 1, B(3) + 3.4);
  to(pendO, 0, B(3) + 4.2);
  to(mergeU, 1, B(3) + 4.2, 1.2, ease.move);
  to(normU, 1, B(3) + 5.4, 0.9, ease.move);
  tl.hold(B(3) + 6.8, 1.2);

  // 4 — index key peels off before rotation; main latent is rotated + quantized after
  tl.tween(cam, { x: 690, y: 325, k: 1.25 }, { at: B(4), dur: 1.2, ease: ease.move });
  to(pressLbl, 0, B(4));
  to(idxO, 1, B(4) + 1.0);
  to(ribU, 1, B(4) + 1.4, 1.2, ease.draw);
  to(mainU, 1, B(4) + 3.2, 1.2, ease.draw);
  to(rotU, 1, B(4) + 3.6, 1.5, ease.move);
  tl.hold(B(4) + 6.8, 1.2);

  // 5 — sixteen channels narrow into eight bytes + one scale byte
  tl.tween(cam, { x: 720, y: 325, k: 1.3 }, { at: B(5), dur: 1.2, ease: ease.move });
  to(idxO, 0, B(5));
  to(pressO, 0, B(5));
  to(formulaO, 0, B(5));
  to(bitsO, 1, B(5) + 1.0);
  to(narrowU, 1, B(5) + 2.4, 1.4, ease.move);
  to(scaleO, 1, B(5) + 4.0);
  tl.hold(B(5) + 6.8, 1.2);

  // 6 — forty layer tracks converge on four owners
  tl.tween(cam, CAMERA_HOME, { at: B(6), dur: 1.2, ease: ease.move });
  to(bitsO, 0, B(6));
  to(chipIll, 0, B(6));
  to(layersO, 1, B(6) + 0.8);
  to(tracksU, 1, B(6) + 1.0, 1.2, ease.draw);
  to(convU, 1, B(6) + 2.6, 1.4, ease.move);
  tl.hold(B(6) + 6.8, 1.2);

  // 7 — decoder source: ratio one, no pooling
  tl.tween(cam, { x: 740, y: 330, k: 1.2 }, { at: B(7), dur: 1.2, ease: ease.move });
  to(layersO, 0.12, B(7));
  to(decO, 1, B(7) + 1.0);
  to(chipCed, 1, B(7) + 1.0);
  to(openU, 1, B(7) + 2.2, 1.5, ease.move);
  tl.hold(B(7) + 6.8, 1.2);

  // 8 — packed-format accounting
  tl.tween(cam, CAMERA_HOME, { at: B(8), dur: 1.2, ease: ease.move });
  to(decO, 0, B(8));
  to(chipCed, 0, B(8));
  to(layersO, 0, B(8) + 0.4);
  to(acctO, 1, B(8) + 1.0);
  to(chipAcct, 1, B(8) + 1.0);
  to(acctU, 1, B(8) + 1.2, 1.4, ease.move);
  to(totalO, 1, B(8) + 4.2, 0.5, ease.pop);
  tl.hold(B(8) + 6.8, 1.2);

  // 9 — reference annotation: in-place simulated quantization
  to(refO, 1, B(9) + 0.8);
  tl.hold(B(9) + 6.8, 1.2);

  // 10 — three axes collapse into one quiet rail
  to(refO, 0, B(10));
  to(acctO, 0, B(10));
  to(totalO, 0, B(10));
  to(chipAcct, 0, B(10));
  to(railY, 330, B(10) + 0.4, 1.2, ease.move);
  to(takeO, 1, B(10) + 2.0);
  tl.hold(B(10) + 6.8, 1.2);
  tl.hold(80.5, 1.5);

  return {
    tl, cam, railO, railY, axesO, axisSel, pressO, pressLbl, bO, mergeU, normU, pendO, formulaO,
    chipIll, idxO, ribU, mainU, rotU, bitsO, narrowU, scaleO, layersO, tracksU, convU, decO, openU,
    chipCed, acctO, acctU, totalO, chipAcct, refO, takeO,
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
      <rect x={340} y={541} width={600} height={48} rx={10} fill={PANEL} stroke={WARM} strokeOpacity={0.7} />
      <text x={640} y={571} fill={TEXT} fontFamily={font.ui} fontSize={20} fontWeight={600} textAnchor="middle">{text}</text>
    </g>
  );
}
function Box({ x, y, w, text, color = ACCENT }: { x: number; y: number; w: number; text: string; color?: string }) {
  return (
    <g>
      <rect x={x} y={y - 17} width={w} height={34} rx={6} fill={PANEL} stroke={color} strokeOpacity={0.75} />
      <text x={x + w / 2} y={y + 4} fill={TEXT} fontFamily={font.mono} fontSize={12} textAnchor="middle">{text}</text>
    </g>
  );
}
function drawn(u: number) {
  return { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp01(u), fill: 'none' } as const;
}

/** one value cell with its gate-weight bar */
function ValueCell({ x, y, v, w, color, o }: { x: number; y: number; v: number; w: number | null; color: string; o: number }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <rect x={x - COL.w / 2} y={y} width={COL.w} height={COL.h} rx={4} fill={PANEL} stroke={color} strokeOpacity={0.8} />
      <text x={x} y={y + 16} fill={TEXT} fontFamily={font.mono} fontSize={12} textAnchor="middle">{fmt(v)}</text>
      {w !== null && (
        <>
          <rect x={x - 18} y={y + 23} width={36} height={5} rx={2} fill={color} fillOpacity={0.15} />
          <rect x={x - 18} y={y + 23} width={36 * w} height={5} rx={2} fill={color} />
        </>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>) => s.get(ch);
  const railY = g(scene.railY);
  const axisSel = g(scene.axisSel);
  const merge = g(scene.mergeU);
  const norm = g(scene.normU);
  const bO = g(scene.bO);
  const narrow = g(scene.narrowU);
  const conv = g(scene.convU);
  const open = g(scene.openU);
  const acctU = g(scene.acctU);
  const rot = g(scene.rotU);

  const aX = lerp(COL.a, COL.m, merge);
  const bX = lerp(COL.b, COL.m, merge);
  const srcO = clamp01(1.6 - merge * 2);
  const latO = clamp01(merge * 2.5 - 1.5);
  const axisO = (i: number) => 0.25 + 0.75 * peak(axisSel - i);

  // decoder split (beat 7): the pair entry travels right, then opens into two entries
  const travel = clamp01(open * 2);
  const split = clamp01(open * 2 - 1);
  const pairX = lerp(520, 820, travel);

  return (
    <g>
      <Camera {...g(scene.cam)}>
        {/* the persistent global rail */}
        <g opacity={g(scene.railO)}>
          {Array.from({ length: RAIL.n }, (_, i) => (
            <rect key={i} x={RAIL.x + RAIL.dx * i} y={railY - RAIL.h / 2} width={RAIL.w} height={RAIL.h} rx={3}
              fill={SECONDARY} fillOpacity={0.2} stroke={SECONDARY} strokeOpacity={0.75} />
          ))}
          <path d={`M${RAIL.x + RAIL.dx * RAIL.prov - 1},${railY - 11} a11.5,9 0 0 1 23,0`} fill="none" stroke={WARM} strokeWidth={2.5} />
        </g>

        {/* beat 1 — three axes */}
        {g(scene.axesO) > 0 && (
          <g opacity={g(scene.axesO)}>
            <g opacity={axisO(0)}>
              <line x1={170} y1={372} x2={1100} y2={372} stroke={SECONDARY} strokeWidth={2} />
              <path d="M1100,366 l12,6 l-12,6 z" fill={SECONDARY} />
              <Note x={640} y={396} text="tokens — sequence length" color={SECONDARY} anchor="middle" />
            </g>
            <g opacity={axisO(1)}>
              {[1, 2, 3].map((k) => (
                <rect key={k} x={170} y={322 - 26 * k} width={RAIL.dx * RAIL.n - 2.5} height={RAIL.h} rx={3} fill="none"
                  stroke={ACCENT} strokeOpacity={0.55 - 0.12 * k} />
              ))}
              <line x1={148} y1={340} x2={148} y2={240} stroke={ACCENT} strokeWidth={2} />
              <path d="M142,240 l6,-12 l6,12 z" fill={ACCENT} />
              <Note x={170} y={222} text="channels — bits per value" color={ACCENT} />
            </g>
            <g opacity={axisO(2)}>
              {[1, 2, 3].map((k) => (
                <line key={k} x1={170 + 22 * k} y1={352 + 22 * k + 50} x2={1110 + 22 * k - 60} y2={352 + 22 * k + 50}
                  stroke={POSITIVE} strokeOpacity={0.6 - 0.13 * k} strokeWidth={2} strokeDasharray="6 5" />
              ))}
              <line x1={1090} y1={412} x2={1150} y2={472} stroke={POSITIVE} strokeWidth={2} />
              <path d="M1150,472 l-12,-4 l8,-8 z" fill={POSITIVE} />
              <Note x={1150} y={496} text="layers — copies" color={POSITIVE} anchor="end" />
            </g>
          </g>
        )}

        {/* beats 2–4 — the channel-wise press */}
        {g(scene.pressO) > 0 && (
          <g opacity={g(scene.pressO)}>
            {A.map((a, d) => (
              <g key={d}>
                <ValueCell x={aX} y={COL.y + COL.dy * d} v={a} w={WA[d]} color={SECONDARY} o={srcO} />
                <ValueCell x={bX} y={COL.y + COL.dy * d} v={Bv[d]} w={WB[d]} color={WARM} o={srcO * bO} />
                <ValueCell x={COL.m} y={COL.y + COL.dy * d} v={lerp(POOLED[d], NORMED[d], norm)} w={null} color={SECONDARY} o={latO} />
              </g>
            ))}
            <Code x={aX} y={232} text="142" size={11} color={MUTED} anchor="middle" o={srcO} />
            <Code x={bX} y={232} text="143" size={11} color={WARM} anchor="middle" o={srcO * bO} />
            <g opacity={latO}>
              <path d={`M${COL.m - 20},236 a20,10 0 0 1 40,0`} fill="none" stroke={WARM} strokeWidth={2} />
              <Note x={COL.m} y={408} text={`entry for group ${GROUP}`} size={11} color={SECONDARY} anchor="middle" />
              <Note x={COL.m} y={424} text="pooled" size={11} anchor="middle" o={1 - norm} />
              <Note x={COL.m} y={424} text="pooled, then RMSNorm" size={11} anchor="middle" o={norm} />
            </g>
            {/* pending half-group */}
            <g opacity={g(scene.pendO)}>
              <rect x={COL.a - 34} y={COL.y - 26} width={68} height={COL.dy * 4 + 32} rx={8} fill="none" stroke={MUTED} strokeDasharray="5 4" />
              <Code x={COL.a + 44} y={COL.y + 60} text="kv_state" size={12} color={MUTED} />
              <Code x={COL.a + 44} y={COL.y + 78} text="score_state" size={12} color={MUTED} />
              <Code x={COL.a + 44} y={COL.y + 104} text="compress_ratio = 2" size={12} color={SECONDARY} />
              <rect x={COL.m - COL.w / 2} y={COL.y} width={COL.w} height={COL.dy * 3 + COL.h} rx={4} fill="none" stroke={MUTED} strokeOpacity={0.6} strokeDasharray="4 4" />
              <Note x={COL.m} y={408} text="no entry yet" size={11} anchor="middle" />
            </g>
            <g opacity={g(scene.pressLbl)}>
              <Code x={268} y={196} text="Compressor.forward" color={TEXT} />
              <Code x={268} y={212} text="wkv → values · wgate → score.softmax(dim=2) → bars" size={10.5} color={MUTED} />
            </g>
          </g>
        )}

        {/* beat 4 — index key before rotation; main latent after */}
        {g(scene.idxO) > 0 && (
          <g opacity={g(scene.idxO)}>
            <path d="M524,290 C570,290 570,236 622,236 L890,236" stroke={POSITIVE} strokeWidth={2} {...drawn(g(scene.ribU))} />
            <g opacity={clamp01(g(scene.ribU) * 3 - 1)}>
              <Box x={622} y={236} w={96} text="Indexer.wk" color={POSITIVE} />
              <Box x={748} y={236} w={72} text="k_norm" color={POSITIVE} />
            </g>
            <g opacity={clamp01(g(scene.ribU) * 3 - 2)}>
              <Note x={900} y={240} text="index K — unrotated latent" color={POSITIVE} size={12} />
              <Note x={600} y={204} text="① first" color={POSITIVE} size={12} />
            </g>
            <path d="M524,350 C570,350 590,384 652,384 L960,384" stroke={SECONDARY} strokeWidth={2} {...drawn(g(scene.mainU))} />
            <g opacity={clamp01(g(scene.mainU) * 3 - 0.5)}>
              <circle cx={680} cy={384} r={24} fill={PANEL} stroke={SECONDARY} strokeWidth={2} />
              <line x1={680} y1={384} x2={680 + 20 * Math.sin(rot * 5.2)} y2={384 - 20 * Math.cos(rot * 5.2)} stroke={SECONDARY} strokeWidth={3} strokeLinecap="round" />
              <Code x={680} y={428} text="apply_rotary_emb" size={12} color={SECONDARY} anchor="middle" />
              <Box x={790} y={384} w={118} text="fp4_act_quant" color={SECONDARY} />
              <Note x={970} y={388} text="main cache entry" color={SECONDARY} size={12} />
              <Note x={600} y={452} text="② afterward" color={SECONDARY} size={12} />
            </g>
          </g>
        )}

        {/* beat 5 — precision */}
        {g(scene.bitsO) > 0 && (
          <g opacity={g(scene.bitsO)}>
            {RAW16.map((raw, i) => {
              const x = BITS.x + lerp(BITS.dx, BITS.dx / 2, narrow) * i;
              const w = lerp(BITS.dx - 2, BITS.dx / 2 - 1.5, narrow);
              const ty = BITS.y - 8 - (i % 2) * 12;
              return (
                <g key={i}>
                  <rect x={x} y={BITS.y} width={w} height={BITS.h} rx={2} fill={SECONDARY} fillOpacity={0.22} stroke={SECONDARY} strokeOpacity={0.8} />
                  <text x={x + w / 2} y={ty} fill={MUTED} opacity={1 - narrow} fontFamily={font.mono} fontSize={9} textAnchor="middle">{raw}</text>
                  <text x={x + w / 2} y={ty} fill={TEXT} opacity={narrow} fontFamily={font.mono} fontSize={8} textAnchor="middle">{QUANT16[i]}</text>
                </g>
              );
            })}
            {/* byte boundaries once packed */}
            {Array.from({ length: 8 }, (_, b) => (
              <rect key={b} x={BITS.x + BITS.dx * b - 1} y={BITS.y - 3} width={BITS.dx} height={BITS.h + 6} rx={4} fill="none"
                stroke={TEXT} strokeOpacity={0.5} opacity={clamp01(narrow * 3 - 2)} />
            ))}
            <g opacity={g(scene.scaleO)}>
              <rect x={BITS.x + BITS.dx * 8 + 10} y={BITS.y - 3} width={BITS.dx} height={BITS.h + 6} rx={4} fill={POSITIVE} fillOpacity={0.2} stroke={POSITIVE} />
              <text x={BITS.x + BITS.dx * 8.5 + 10} y={BITS.y + 22} fill={TEXT} fontFamily={font.mono} fontSize={11} textAnchor="middle">×1</text>
              <Code x={BITS.x + BITS.dx * 8.5 + 10} y={BITS.y + 62} text="E4M3" size={12} color={POSITIVE} anchor="middle" />
              <Note x={BITS.x + BITS.dx * 8.5 + 10} y={BITS.y + 78} text="1 scale byte" size={10} anchor="middle" />
              <Note x={BITS.x} y={BITS.y + 118} text="8 value bytes + 1 scale byte per 16 channels" size={12} color={TEXT} />
            </g>
            <Code x={BITS.x} y={BITS.y - 44} text="E2M1" size={13} color={SECONDARY} />
            <Note x={BITS.x + 46} y={BITS.y - 44} text="4-bit values" size={11} o={narrow} />
            <Brace x0={BITS.x} x1={BITS.x + lerp(BITS.dx, BITS.dx / 2, narrow) * 16} y={BITS.y + BITS.h + 8} label="block_size = 16" fontSize={12} color={MUTED} />
            <circle cx={330} cy={308} r={30} fill="none" stroke={ACCENT} strokeWidth={5} strokeOpacity={0.7} />
            <Code x={330} y={312} text="FP8" size={12} color={ACCENT} anchor="middle" />
            <Code x={330} y={360} text="FP8 SWA" size={12} color={ACCENT} anchor="middle" />
            <Note x={330} y={376} text="local window: 8-bit" size={10} anchor="middle" />
          </g>
        )}

        {/* beats 6–7 — layer sharing */}
        {g(scene.layersO) > 0 && (
          <g opacity={g(scene.layersO)}>
            {OWNER_OF.map((owner, i) => {
              const u = clamp01(g(scene.tracksU) * N_LAYERS - i);
              const x = trackX(i);
              const isOwner = KV_SOURCES.includes(i);
              const xe = owner < 0 ? x : lerp(x, trackX(owner), conv);
              return (
                <g key={i} opacity={u}>
                  <rect x={x - 4} y={TRACK.y0 - 14} width={8} height={14} rx={2} fill={owner < 0 ? MUTED : isOwner ? SECONDARY : PANEL}
                    stroke={owner < 0 ? MUTED : SECONDARY} strokeOpacity={0.8} />
                  {owner >= 0 && (
                    <path d={`M${x},${TRACK.y0} C${x},${TRACK.y0 + 80} ${xe},${TRACK.y1 - 80} ${xe},${TRACK.y1}`} fill="none"
                      stroke={SECONDARY} strokeOpacity={isOwner ? 0.9 : 0.4} strokeWidth={isOwner ? 2 : 1} />
                  )}
                </g>
              );
            })}
            {KV_SOURCES.map((src) => (
              <g key={src} opacity={clamp01(conv * 2 - 0.6)}>
                <rect x={trackX(src) - 16} y={TRACK.y1} width={32} height={24} rx={5} fill={SECONDARY} fillOpacity={0.3} stroke={SECONDARY} />
                <text x={trackX(src)} y={TRACK.y1 + 16} fill={TEXT} fontFamily={font.mono} fontSize={12} textAnchor="middle">{src}</text>
              </g>
            ))}
            <Code x={TRACK.x - 4} y={200} text="kv_source_layers = [2, 8, 14, 20]" color={SECONDARY} />
            <Note x={trackX(39)} y={200} text="40 backbone layers, zero-based" size={11} anchor="end" />
            <Note x={trackX(0) + 12} y={TRACK.y0 + 22} text="0–1: window only" size={10} anchor="middle" />
          </g>
        )}

        {/* beat 7 — ratio one */}
        {g(scene.decO) > 0 && (
          <g opacity={g(scene.decO)}>
            <rect x={450} y={226} width={560} height={210} rx={10} fill={PANEL} fillOpacity={0.92} stroke={MUTED} strokeOpacity={0.3} />
            {/* encoder pair */}
            {[0, 1].map((k) => (
              <g key={k}>
                <rect x={492 + 40 * k} y={258} width={34} height={26} rx={4} fill={PANEL} stroke={k ? WARM : MUTED} strokeWidth={k ? 2 : 1} />
                <text x={509 + 40 * k} y={275} fill={k ? WARM : MUTED} fontFamily={font.mono} fontSize={10} textAnchor="middle">{142 + k}</text>
                <line x1={509 + 40 * k} y1={286} x2={529} y2={344} stroke={SECONDARY} strokeOpacity={0.6} />
              </g>
            ))}
            <rect x={512} y={346} width={34} height={26} rx={4} fill={SECONDARY} fillOpacity={0.3} stroke={SECONDARY} />
            <Code x={529} y={396} text="compress_ratio = 2" size={11} color={MUTED} anchor="middle" />
            <Note x={529} y={412} text="encoder sources 2, 8, 14" size={10} anchor="middle" />
            {/* decoder: the pair entry opens into two */}
            {[0, 1].map((k) => {
              const x = pairX + (k ? 20 : -20) * split;
              return (
                <g key={k} opacity={travel}>
                  <rect x={803 + 40 * k - 20} y={258} width={34} height={26} rx={4} fill={PANEL} stroke={k ? WARM : MUTED} strokeWidth={k ? 2 : 1} opacity={split} />
                  <text x={800 + 40 * k} y={275} fill={k ? WARM : MUTED} fontFamily={font.mono} fontSize={10} textAnchor="middle" opacity={split}>{142 + k}</text>
                  <line x1={800 + 40 * k} y1={286} x2={800 + 40 * k} y2={344} stroke={SECONDARY} strokeOpacity={0.6} opacity={split} />
                  <rect x={x - 17} y={346} width={34} height={26} rx={4} fill={SECONDARY} fillOpacity={0.3}
                    stroke={k && split > 0.5 ? WARM : SECONDARY} strokeWidth={k && split > 0.5 ? 2 : 1} />
                </g>
              );
            })}
            <g opacity={split}>
              <Code x={820} y={396} text="compress_ratio = 1" size={11} color={SECONDARY} anchor="middle" />
              <Code x={820} y={412} text="self.norm(self.wkv(x))" size={11} color={TEXT} anchor="middle" />
              <Note x={820} y={246} text="decoder source 20 — final encoder hidden states" size={10} anchor="middle" />
            </g>
          </g>
        )}

        {/* beats 8–9 — derived packed-format accounting */}
        {g(scene.acctO) > 0 && (
          <g opacity={g(scene.acctO)}>
            <rect x={300} y={230} width={MAIN_BYTES * acctU} height={28} rx={4} fill={SECONDARY} fillOpacity={0.35} stroke={SECONDARY} />
            <rect x={300 + MAIN_BYTES + 10} y={230} width={INDEX_BYTES * acctU} height={28} rx={4} fill={POSITIVE} fillOpacity={0.3} stroke={POSITIVE} />
            <Note x={300} y={278} text={`main entry ${MAIN_BYTES} B`} color={SECONDARY} size={12} />
            <Note x={300 + MAIN_BYTES + 10} y={278} text={`indexer ${INDEX_BYTES} B`} color={POSITIVE} size={12} />
            <MathLabel tex={'512\\cdot\\tfrac{4}{8} + \\tfrac{512}{16} = 288'} x={300} y={322} fontSize={18} anchor="start" opacity={clamp01(acctU * 3 - 1)} />
            <MathLabel tex={'128\\cdot\\tfrac{4}{8} + \\tfrac{128}{32} = 68'} x={300} y={362} fontSize={18} anchor="start" opacity={clamp01(acctU * 3 - 1.5)} />
            <MathLabel tex={'\\tfrac{3}{2} + 1 = 2.5\\ \\text{entries per token}'} x={300} y={402} fontSize={18} anchor="start" opacity={clamp01(acctU * 3 - 2)} />
            <g opacity={g(scene.totalO)}>
              <MathLabel tex={'2.5 \\times (288 + 68)'} x={900} y={300} fontSize={22} />
              <text x={900} y={362} fill={TEXT} fontFamily={font.ui} fontSize={34} fontWeight={700} textAnchor="middle">{TOTAL_BYTES} bytes/token</text>
            </g>
            <g opacity={g(scene.refO)}>
              <rect x={720} y={392} width={360} height={52} rx={8} fill={PANEL} stroke={MUTED} strokeOpacity={0.6} strokeDasharray="5 4" />
              <Code x={900} y={414} text="inplace=True → dequantized values" size={12.5} anchor="middle" />
              <Note x={900} y={432} text="reference code: fp4_act_quant simulates the format" size={11} anchor="middle" />
            </g>
          </g>
        )}
      </Camera>

      {/* HUD — outside the camera transform */}
      <text x={48} y={64} fill={TEXT} fontFamily={font.ui} fontSize={24} fontWeight={600}>Squeeze the Global Memory</text>
      <Chip x={48} text="4 shown channels; actual head_dim = 512" o={g(scene.chipIll)} />
      <Chip x={340} text="Illustrative projections and gates" o={g(scene.chipIll)} color={WARM} />
      <Chip x={48} text="CED: Paper §2.2, Eq. 1" o={g(scene.chipCed)} color={SECONDARY} />
      <Chip x={48} text="Derived packed-format accounting; global cache only" o={g(scene.chipAcct)} color={SECONDARY} />
      <MathLabel tex={'c_d = \\mathrm{RMSNorm}\\Big(\\sum_t \\mathrm{softmax}_t(z_{t,d})\\, v_{t,d}\\Big)'} x={930} y={140} fontSize={20} opacity={g(scene.formulaO)} />
      <Takeaway text="Sequence × precision × layer sharing" o={g(scene.takeO)} />
    </g>
  );
}

export const vizScene = () => scene;
