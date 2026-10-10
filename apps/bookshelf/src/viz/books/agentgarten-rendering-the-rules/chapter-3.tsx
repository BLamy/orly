// Rendering the Rules — Chapter 3: A bounded memory for a long stream
//
// Backing (AgentGarten, https://github.com/MirroS-Lab/AgentGarten @ 06bb4621deb9b380c34abb6dac42fe0b31eec2e3;
// local checkout verified at that commit):
//   wm/networks/cosmos3/streaming.py           StreamPolicy (block_frames=4, sink_frames=5, history_frames=44,
//                                              train_frames=61; capacity = sink + history = 49);
//                                              StreamPolicy.positions (TOP_ALIGNED: shift = max(0, next_frame
//                                              + block_frames − train_frames); sink keeps f < sink_frames);
//                                              Cosmos3Stream.start (prefill C0, record=True, reference=True),
//                                              denoise (record=False), commit (record=True → frame_ids, _trim),
//                                              _trim (keep range(sink) + the last capacity−sink frames; a
//                                              frame-major retain of both token kinds)
//   wm/networks/cosmos3/streaming_attention.py StreamAttentionCache
//   paper arxiv:2610.12374 §3.5, Appendix C; README inference loop
//
// Illustrative data: the bead schedule below is exact StreamPolicy arithmetic for the production
// defaults — at s=57 recent IDs 13…56 (positions 13…56); at s=61 recent IDs 17…60 → positions
// 13…56 and the active block 61…64 → 57…60; at s=65 recent IDs 21…64 → 13…56. It is policy
// arithmetic, not measured model output; the noisy "denoising states" and key angles are display
// only. Remapping rotary coordinates never rewinds the simulated world: frame IDs keep advancing.
//
// Machine: ONE train of frame beads on two calibrated rulers (true frame IDs above, rotary
// positions below). Five gold sink beads never move, 44 blue recent beads slide, a four-bead
// active block sits outside the budget until committed. Each bead carries paired R/G tokens, a
// key glyph that re-rotates with its position, and a value dot that only translates.
import type { ReactElement } from 'react';
// Standalone blog sections load these scenes without ChapterPlayer's math stylesheet.
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Brace } from '../../primitives';

const { ACCENT, SECONDARY, POSITIVE, WARM, NEGATIVE, MUTED, TEXT, PANEL, font } = colors;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

export const CAPTIONS = [
  'A live renderer cannot keep every earlier frame forever. The stream needs useful history without a growing memory bill.',
  'The stream starts by publishing one clean reference frame with its matching geometry and text context.',
  'Four latent frames form the next block. Denoising reads the completed history without adding unfinished predictions to it.',
  'Only a clean block is committed. Its image and geometry keys and values then become history for the next block.',
  'The default policy keeps five sink frames and forty-four recent frames. The current block sits outside that retained budget.',
  'When the budget fills, older recent frames leave together with their geometry tokens. The sink prefix remains in place.',
  "Beyond the training horizon, the next block's rotary coordinates stop advancing, while recent history shifts to precede it.",
  'Retained keys are rotated into their new coordinates. Values move without rotation, and geometry still follows the true simulation time.',
  'Geometry guides the frame, replay trains its history encoding, and a bounded cache carries that history forward as rendering continues.',
] as const;

// ---------------------------------------------------------------------------
// Module-scope data — the real StreamPolicy defaults and their exact arithmetic.
// ---------------------------------------------------------------------------

export const POLICY = { block_frames: 4, sink_frames: 5, history_frames: 44, train_frames: 61 } as const;
export const CAPACITY = POLICY.sink_frames + POLICY.history_frames; // 49
/** Stream states the scene steps through: next_frame s after each commit. */
export const S_LIST = [1, 5, 57, 61, 65, 69, 73] as const;
const MAX_F = 80;

/** StreamPolicy.positions, TOP_ALIGNED. */
export const rotaryPos = (f: number, s: number): number => {
  const shift = Math.max(0, s + POLICY.block_frames - POLICY.train_frames);
  return f < POLICY.sink_frames ? f : f - shift;
};
/** Cosmos3Stream._trim: which committed frames survive at next_frame = s. */
export const retainedIds = (s: number): number[] => {
  const all = Array.from({ length: s }, (_, f) => f);
  if (s <= CAPACITY) return all;
  return [...all.slice(0, POLICY.sink_frames), ...all.slice(s - (CAPACITY - POLICY.sink_frames))];
};

interface Place { slot: number; present: number; pos: number; current: boolean }
/** Where frame f sits when the stream's next_frame is s (slot ≥ 49 = the active block area). */
function place(f: number, s: number): Place {
  const pos = rotaryPos(f, s);
  if (f >= s + POLICY.block_frames) return { slot: CAPACITY + (f - s), present: 0, pos, current: false };
  if (f >= s) return { slot: CAPACITY + (f - s), present: 1, pos, current: true };
  if (f < POLICY.sink_frames) return { slot: f, present: 1, pos, current: false };
  const lo = Math.max(POLICY.sink_frames, s - POLICY.history_frames);
  const slot = POLICY.sink_frames + (f - lo);
  return { slot, present: f >= lo ? 1 : 0, pos, current: false };
}
/** PLACES[k][f] for every state and frame — precomputed, sampled purely. */
const PLACES: Place[][] = S_LIST.map((s) => Array.from({ length: MAX_F }, (_, f) => place(f, s)));

/** Which frame occupies a slot at state s (for ruler labels); −1 = empty. */
function frameAtSlot(slot: number, s: number): number {
  if (slot >= CAPACITY) return s + (slot - CAPACITY);
  if (slot < POLICY.sink_frames) return slot < s ? slot : -1;
  const lo = Math.max(POLICY.sink_frames, s - POLICY.history_frames);
  const f = lo + (slot - POLICY.sink_frames);
  return f < s ? f : -1;
}

const rand = mulberry32(7);
const JITTER = Array.from({ length: MAX_F }, () => ({ dy: (rand() - 0.5) * 2, dx: (rand() - 0.5) * 2 }));
const keyAngle = (pos: number) => pos * 23; // illustrative rotary phase per position

// ---------------------------------------------------------------------------
// Layout. Tape at y = 330; rulers at 268 / 392; braces and labels within y ≤ 580.
// ---------------------------------------------------------------------------

const X0 = 90;
const SP = 19;
const GAP = 34;
const TAPE_Y = 330;
const BEAD_W = 14;
const BEAD_H = 26;
const slotX = (slot: number) =>
  slot < CAPACITY ? X0 + slot * SP : X0 + CAPACITY * SP + GAP + (slot - CAPACITY) * SP;
const TRAY = { x0: X0 - 8, x1: slotX(CAPACITY - 1) + BEAD_W + 8 };
const CUR = { x0: slotX(CAPACITY) - 8, x1: slotX(CAPACITY + 3) + BEAD_W + 8 };
const RULER_UP = TAPE_Y - 62;
const RULER_DN = TAPE_Y + 62;
const LABEL_SLOTS = [0, 4, 5, 12, 20, 28, 36, 44, 48, 49, 52];
const TRAIN_N = 70;

// ---------------------------------------------------------------------------
// Timeline — nine fixed caption windows (0.5 + 8i, dur 8; the last 7.5 so it ends at 72), 72 authored seconds.
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const n = (k: string, v = 0) => tl.channel(k, v);
  const to = (ch: ChannelRef<number>, v: number, at: number, dur = 0.6, e = ease.enter) =>
    tl.tween(ch, v, { at, dur, ease: e });
  const B = (i: number) => 0.5 + 8 * (i - 1);

  const trainO = n('trainO'); // beat 1: the unbounded train
  const trainU = n('trainU');
  const trayU = n('trayU'); // bounded tray + rulers draw-on
  const beadO = n('beadO'); // the retained beads
  const curO = n('curO'); // the active block
  const phase = n('phase'); // index into S_LIST (fractional = mid-commit)
  const noiseLvl = n('noiseLvl'); // denoising state of the active block
  const startLbl = n('startLbl');
  const legendO = n('legendO');
  const denoiseLbl = n('denoiseLbl');
  const countO = n('countO');
  const commitLbl = n('commitLbl');
  const ffLbl = n('ffLbl');
  const braceU = n('braceU');
  const capLbl = n('capLbl');
  const trimLbl = n('trimLbl');
  const rulerLblO = n('rulerLblO');
  const horizonLbl = n('horizonLbl');
  const rotLbl = n('rotLbl');
  const badgeO = n('badgeO');
  const finalO = n('finalO');
  const chipO = n('chipO');

  CAPTIONS.forEach((text, i) => tl.caption({ at: B(i + 1), dur: i < 8 ? 8 : 7.5, text }));

  // 1 — the train grows toward the edge; the camera follows, then the tray is revealed
  to(trainO, 1, 0.5, 0.6);
  to(chipO, 1, 0.8);
  to(trainU, 1, 0.8, 3.2, ease.linear);
  tl.tween(cam, { x: 780, y: 330, k: 1.18 }, { at: 1.4, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 4.2, dur: 1.4, ease: ease.move });
  to(trainO, 0, 4.6, 1.0, ease.move);
  to(trayU, 1, 4.8, 1.4, ease.draw);
  tl.hold(B(1) + 7, 0.8);

  // 2 — s = 1: the clean reference bead enters at the permanent left end
  tl.tween(cam, { x: 330, y: 330, k: 1.6 }, { at: B(2), dur: 1.2, ease: ease.move });
  to(beadO, 1, B(2) + 0.6, 0.8);
  to(startLbl, 1, B(2) + 1.8);
  to(legendO, 1, B(2) + 2.8);
  tl.hold(B(2) + 7, 0.8);

  // 3 — the active block glows outside the cache; sampled denoising states
  to(startLbl, 0, B(3));
  to(legendO, 0, B(3)); // fully hidden: beats 3–4 put their own labels in this band
  // whole tray stays in view (reference at the left end, active block at the right), slight push right
  tl.tween(cam, { x: 620, y: 330, k: 1.1 }, { at: B(3), dur: 1.3, ease: ease.move });
  to(curO, 1, B(3) + 0.6, 0.8);
  tl.set(noiseLvl, 1, B(3) + 0.6);
  tl.set(noiseLvl, 0.65, B(3) + 2.0);
  tl.set(noiseLvl, 0.35, B(3) + 3.2);
  tl.set(noiseLvl, 0.12, B(3) + 4.4);
  to(countO, 1, B(3) + 1.4);
  to(denoiseLbl, 1, B(3) + 1.8);
  tl.hold(B(3) + 7, 0.8);

  // 4 — commit: the clean block slides into the tape (s: 1 → 5)
  to(denoiseLbl, 0, B(4));
  tl.set(noiseLvl, 0, B(4));
  tl.tween(cam, { x: 640, y: 330, k: 1.1 }, { at: B(4), dur: 1.3, ease: ease.move });
  to(phase, 1, B(4) + 0.8, 1.5, ease.move);
  to(commitLbl, 1, B(4) + 2.6);
  tl.hold(B(4) + 7, 0.8);

  // 5 — fast-forward to s = 57; the full 5 + 44 + 4 view with braces
  to(commitLbl, 0, B(5));
  tl.tween(cam, CAMERA_HOME, { at: B(5), dur: 1.2, ease: ease.move });
  to(beadO, 0.12, B(5) + 0.2, 0.4, ease.move);
  to(countO, 0, B(5) + 0.2, 0.4); // the braces + capacity formula carry the count from here on
  to(ffLbl, 1, B(5) + 0.2, 0.3);
  tl.set(phase, 2, B(5) + 0.7);
  to(beadO, 1, B(5) + 0.8, 0.7, ease.move);
  to(ffLbl, 0, B(5) + 2.2, 0.5);
  to(braceU, 1, B(5) + 1.6, 1.2, ease.draw);
  to(capLbl, 1, B(5) + 3.0);
  tl.hold(B(5) + 7, 0.8);

  // 6 — s: 57 → 61: the four oldest recent beads leave; the sink never moves
  to(capLbl, 0.15, B(6));
  to(phase, 3, B(6) + 1.0, 1.7, ease.move);
  to(trimLbl, 1, B(6) + 2.9);
  tl.hold(B(6) + 7, 0.8);

  // 7 — two-ruler close-up: s: 61 → 65; rotary start stays at 57
  to(trimLbl, 0, B(7));
  to(capLbl, 0, B(7));
  to(braceU, 0, B(7), 0.6);
  tl.tween(cam, { x: 860, y: 344, k: 1.4 }, { at: B(7), dur: 1.3, ease: ease.move });
  to(rulerLblO, 1, B(7) + 0.6);
  to(horizonLbl, 1, B(7) + 1.2);
  to(phase, 4, B(7) + 2.4, 1.7, ease.move);
  tl.hold(B(7) + 7, 0.8);

  // 8 — close on the boundary: keys re-rotate, values translate, content IDs keep counting
  to(horizonLbl, 0, B(8));
  tl.tween(cam, { x: 925, y: 338, k: 1.5 }, { at: B(8), dur: 1.3, ease: ease.move });
  to(badgeO, 1, B(8) + 1.0);
  to(phase, 5, B(8) + 1.8, 1.7, ease.move);
  to(rotLbl, 1, B(8) + 3.0);
  tl.hold(B(8) + 7, 0.8);

  // 9 — home; one more commit under three quiet mechanism labels
  to(rotLbl, 0, B(9));
  to(badgeO, 0, B(9));
  to(rulerLblO, 0.15, B(9));
  tl.tween(cam, CAMERA_HOME, { at: B(9), dur: 1.4, ease: ease.move });
  to(finalO, 1, B(9) + 1.4, 0.8);
  to(phase, 6, B(9) + 2.6, 1.7, ease.move);
  tl.hold(B(9) + 7, 0.5); // ends at 72.0

  return {
    tl, cam, trainO, trainU, trayU, beadO, curO, phase, noiseLvl, startLbl, legendO, denoiseLbl, countO,
    commitLbl, ffLbl, braceU, capLbl, trimLbl, rulerLblO, horizonLbl, rotLbl, badgeO, finalO, chipO,
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

/** One frame bead: R token (top) + G token (bottom), a rotating key glyph and a value dot. */
function Bead({ x, y, o, sink, current, angle, noise }: {
  x: number; y: number; o: number; sink: boolean; current: boolean; angle: number; noise: number;
}) {
  if (o <= 0) return null;
  const stroke = sink ? WARM : current ? POSITIVE : ACCENT;
  const cx = x + BEAD_W / 2;
  const ry = y + 7; // R token center
  return (
    <g opacity={o}>
      {current && <rect x={x - 3} y={y - 3} width={BEAD_W + 6} height={BEAD_H + 6} rx={5} fill={POSITIVE} opacity={0.18} />}
      <rect x={x} y={y} width={BEAD_W} height={12} rx={2.5} fill={ACCENT} fillOpacity={lerp(0.55, 0.15, noise)} stroke={stroke} strokeWidth={sink ? 1.6 : 1} />
      <rect x={x} y={y + 14} width={BEAD_W} height={12} rx={2.5} fill={SECONDARY} fillOpacity={0.55} stroke={stroke} strokeWidth={sink ? 1.6 : 1} />
      {noise > 0 && (
        <>
          <line x1={x + 2} y1={y + 10} x2={x + 6} y2={y + 2} stroke={NEGATIVE} strokeOpacity={noise} />
          <line x1={x + 7} y1={y + 11} x2={x + 12} y2={y + 2} stroke={NEGATIVE} strokeOpacity={noise} />
        </>
      )}
      {/* key glyph: orientation = rotary position */}
      <line x1={cx - 5} y1={ry} x2={cx + 5} y2={ry} stroke={TEXT} strokeWidth={1.6} strokeLinecap="round"
        transform={`rotate(${angle} ${cx} ${ry})`} opacity={0.9} />
      {/* value dot: moves, never rotates */}
      <circle cx={cx} cy={y + 20} r={2.4} fill={TEXT} opacity={0.9} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>) => s.get(ch);
  const trainO = g(scene.trainO);
  const trainU = g(scene.trainU);
  const trayU = g(scene.trayU);
  const beadO = g(scene.beadO);
  const curO = g(scene.curO);
  const phase = g(scene.phase);
  const noiseLvl = g(scene.noiseLvl);
  const braceU = g(scene.braceU);
  const rulerLblO = g(scene.rulerLblO);
  const badgeO = g(scene.badgeO);

  const k0 = Math.min(S_LIST.length - 1, Math.floor(phase));
  const k1 = Math.min(S_LIST.length - 1, k0 + 1);
  const frac = clamp01(phase - k0);
  const sNow = S_LIST[frac < 0.5 ? k0 : k1]; // labels switch at the midpoint of a commit
  const sFrom = S_LIST[k0];
  const sTo = S_LIST[k1];
  const retainedCount = Math.min(sNow, CAPACITY);

  // ---- the bead train, every frame a pure function of (phase, noiseLvl) ----
  const beads: ReactElement[] = [];
  for (let f = 0; f < MAX_F; f++) {
    const a = PLACES[k0][f];
    const b = PLACES[k1][f];
    if (a.present === 0 && b.present === 0) continue;
    const x = lerp(slotX(a.slot), slotX(b.slot), frac);
    const present = lerp(a.present, b.present, frac);
    const current = frac < 0.5 ? a.current : b.current;
    const sink = f < POLICY.sink_frames;
    const angle = lerp(keyAngle(a.pos), keyAngle(b.pos), frac);
    const noise = current ? noiseLvl : 0;
    const jit = current ? JITTER[f] : { dx: 0, dy: 0 };
    const vis = current ? curO : beadO;
    beads.push(
      <Bead key={f} x={x + jit.dx * 4 * noise} y={TAPE_Y - BEAD_H / 2 + jit.dy * 6 * noise} o={present * vis}
        sink={sink} current={current} angle={angle} noise={noise} />,
    );
  }

  // ruler labels (true IDs above, rotary positions below) at the labelled slots
  const diverged = sNow + POLICY.block_frames > POLICY.train_frames;

  return (
    <g>
      <Camera {...g(scene.cam)}>
        {/* ---------------- beat 1: the unbounded train ---------------- */}
        {trainO > 0 && (
          <g opacity={trainO}>
            {Array.from({ length: TRAIN_N }, (_, i) => {
              const x = 60 + i * SP + trainU * 420;
              const fade = clamp01((1240 - x) / 80) * clamp01(trainU * TRAIN_N * 1.3 - i);
              return (
                <rect key={i} x={x} y={TAPE_Y - BEAD_H / 2} width={BEAD_W} height={BEAD_H} rx={3} fill={ACCENT}
                  fillOpacity={0.35} stroke={ACCENT} opacity={fade} />
              );
            })}
            <Note x={640} y={TAPE_Y - 60} text="every frame kept forever → memory grows with the stream" color={NEGATIVE} size={14} anchor="middle" />
          </g>
        )}

        {/* ---------------- the bounded tray + the two rulers ---------------- */}
        {trayU > 0 && (
          <g>
            <rect x={TRAY.x0} y={TAPE_Y - 26} width={(TRAY.x1 - TRAY.x0) * trayU} height={52} rx={10} fill={PANEL} stroke={MUTED} strokeOpacity={0.6} />
            <rect x={CUR.x0} y={TAPE_Y - 26} width={CUR.x1 - CUR.x0} height={52} rx={10} fill="none" stroke={POSITIVE} strokeOpacity={0.6 * clamp01(trayU * 3 - 2)} strokeDasharray="5 4" />
            {/* rulers */}
            <line x1={TRAY.x0} y1={RULER_UP} x2={lerp(TRAY.x0, CUR.x1, trayU)} y2={RULER_UP} stroke={MUTED} strokeOpacity={0.7} />
            <line x1={TRAY.x0} y1={RULER_DN} x2={lerp(TRAY.x0, CUR.x1, trayU)} y2={RULER_DN} stroke={MUTED} strokeOpacity={0.7} />
            {/* ruler names sit at the right end (visible in every close-up), clear of the tick numbers */}
            <Code x={CUR.x1} y={RULER_UP + 18} text="true simulation frame ID · frame_ids" color={MUTED} size={11} anchor="end" o={clamp01(trayU * 2 - 1)} />
            <Code x={CUR.x1} y={RULER_DN + 32} text="rotary position · StreamPolicy.positions (TOP_ALIGNED)" color={MUTED} size={11} anchor="end" o={clamp01(trayU * 2 - 1)} />
            {LABEL_SLOTS.map((slot) => {
              const f = frameAtSlot(slot, sNow);
              const x = slotX(slot) + BEAD_W / 2;
              const shown = f >= 0 && (slot < CAPACITY ? beadO : curO) > 0.3;
              const pos = f >= 0 ? rotaryPos(f, sNow) : 0;
              const differs = shown && pos !== f;
              return (
                <g key={slot} opacity={clamp01(trayU * 3 - 2)}>
                  <line x1={x} y1={RULER_UP - 4} x2={x} y2={RULER_UP + 4} stroke={MUTED} />
                  <line x1={x} y1={RULER_DN - 4} x2={x} y2={RULER_DN + 4} stroke={MUTED} />
                  {shown && (
                    <>
                      <Code x={x} y={RULER_UP - 8 + (slot === 4 || slot === 48 || slot === 52 ? 0 : 0)} text={`${f}`} color={slot >= CAPACITY ? POSITIVE : TEXT} size={10} anchor="middle"
                        o={0.4 + 0.6 * rulerLblO} />
                      <Code x={x} y={RULER_DN + 14} text={`${pos}`} color={differs ? WARM : TEXT} size={10} anchor="middle" o={0.4 + 0.6 * rulerLblO} />
                    </>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* the train of beads */}
        {beads}

        {/* ---------------- beat 2 ---------------- */}
        <g opacity={g(scene.startLbl)}>
          <Code x={X0} y={TAPE_Y - 112} text="Cosmos3Stream.start(anchor, condition)  · record=True, reference=True" color={POSITIVE} size={12} />
          <Note x={X0 + BEAD_W / 2} y={TAPE_Y + 48} text="C0" color={WARM} size={12} anchor="middle" />
          <Note x={X0 + 30} y={TAPE_Y + 48} text="frame 0 — permanent left end" size={11} />
        </g>
        <g opacity={g(scene.legendO)}>
          {/* legend rows sit between the start() line and the upper ruler, right of the "0" tick label */}
          <rect x={X0 + 240} y={TAPE_Y - 100} width={BEAD_W} height={12} rx={2.5} fill={ACCENT} fillOpacity={0.55} stroke={ACCENT} />
          <Code x={X0 + 260} y={TAPE_Y - 90} text="R  image tokens (K/V)" color={ACCENT} size={11} />
          <rect x={X0 + 240} y={TAPE_Y - 84} width={BEAD_W} height={12} rx={2.5} fill={SECONDARY} fillOpacity={0.55} stroke={SECONDARY} />
          <Code x={X0 + 260} y={TAPE_Y - 74} text="G  geometry tokens (K/V) — one unit per frame" color={SECONDARY} size={11} />
          <rect x={X0 - 8} y={TAPE_Y + 100} width={150} height={24} rx={6} fill={PANEL} stroke={MUTED} strokeOpacity={0.5} />
          <Code x={X0 + 67} y={TAPE_Y + 116} text="text context · separate" color={MUTED} size={10} anchor="middle" />
        </g>

        {/* ---------------- beat 3 ---------------- */}
        <g opacity={g(scene.denoiseLbl)}>
          <Code x={CUR.x0 - 20} y={TAPE_Y - 98} text="denoise(noisy, sigma, condition) · record=False" color={POSITIVE} size={12} anchor="end" />
          <Note x={CUR.x0 - 20} y={TAPE_Y - 80} text="reads the completed history; writes nothing into it" size={11} anchor="end" />
          <Note x={CUR.x1} y={TAPE_Y + 48} text="4 latent frames · outside the cache" color={POSITIVE} size={11} anchor="end" />
        </g>
        <g opacity={g(scene.countO)}>
          <rect x={CUR.x1 - 150} y={TAPE_Y + 60} width={150} height={24} rx={6} fill={PANEL} stroke={ACCENT} strokeOpacity={0.6} />
          <Code x={CUR.x1 - 75} y={TAPE_Y + 76} text={`retained frames: ${retainedCount}`} color={ACCENT} size={10} anchor="middle" />
        </g>

        {/* ---------------- beat 4 ---------------- */}
        <g opacity={g(scene.commitLbl)}>
          <Code x={X0} y={TAPE_Y - 84} text="commit(clean, condition) · record=True → frame_ids += 1…4; _trim" color={ACCENT} size={12} />
          <Note x={X0} y={TAPE_Y + 48} text="R and G keys/values of the clean block become history for the next block" size={11} />
        </g>

        {/* ---------------- beat 5 ---------------- */}
        <Note x={640} y={TAPE_Y - 84} text="… thirteen more commits · next_frame s = 57" color={MUTED} size={13} anchor="middle" o={g(scene.ffLbl)} />
        {braceU > 0 && (
          <g>
            {/* shallow braces so their labels end above the lower ruler line (y = 392) */}
            <Brace x0={slotX(0)} x1={slotX(4) + BEAD_W} y={TAPE_Y + 28} depth={9} below u={braceU} color={WARM} label="sink · 5" fontSize={11} />
            <Brace x0={slotX(5)} x1={slotX(48) + BEAD_W} y={TAPE_Y + 28} depth={9} below u={braceU} color={ACCENT} label="recent · 44" fontSize={11} />
            <Brace x0={slotX(49)} x1={slotX(52) + BEAD_W} y={TAPE_Y + 28} depth={9} below u={braceU} color={POSITIVE} label="current · 4" fontSize={11} />
          </g>
        )}
        <g opacity={g(scene.capLbl)}>
          <MathLabel tex={'\\text{capacity} = \\text{sink\\_frames} + \\text{history\\_frames} = 5 + 44 = 49'} x={X0} y={TAPE_Y + 118} fontSize={15} color={TEXT}
            anchor="start" boxWidth={620} />
          <Code x={X0} y={TAPE_Y + 152} text="StreamPolicy(block_frames=4, sink_frames=5, history_frames=44, train_frames=61)" color={MUTED} size={11} />
          <Note x={CUR.x1} y={TAPE_Y + 122} text="current block: outside the retained budget" color={POSITIVE} size={11} anchor="end" />
        </g>

        {/* ---------------- beat 6 ---------------- */}
        <g opacity={g(scene.trimLbl)}>
          <Code x={X0} y={TAPE_Y - 84} text={`_trim: kept = range(5) + range(${sNow - 44}, ${sNow}) · frame-major retain of R and G together`} color={ACCENT} size={12} />
          <Note x={slotX(5)} y={TAPE_Y + 48} text={`oldest recent (${sNow - 48}…${sNow - 45}) left with their geometry tokens`} color={NEGATIVE} size={11} />
          <Note x={slotX(0)} y={TAPE_Y - 40} text="sink stays" color={WARM} size={11} />
        </g>

        {/* ---------------- beat 7 ---------------- */}
        <g opacity={g(scene.horizonLbl)}>
          <MathLabel tex={'p_{\\text{start}} = \\min(s,\\; H - b),\\qquad H = 61,\\; b = 4'} x={700} y={TAPE_Y + 118} fontSize={15} color={TEXT}
            anchor="start" boxWidth={420} />
          <Code x={700} y={TAPE_Y + 152} text="shift = max(0, next_frame + block_frames − train_frames)" color={MUTED} size={11} />
          <Code x={700} y={TAPE_Y - 110} text={`true start s: ${sNow}`} color={TEXT} size={12} />
          <Code x={700} y={TAPE_Y - 92} text={`rotary start: ${Math.min(sNow, POLICY.train_frames - POLICY.block_frames)}`} color={diverged ? WARM : TEXT} size={12} />
          <Note x={900} y={TAPE_Y - 110} text="57 → 61 → 65" size={11} />
          <Note x={900} y={TAPE_Y - 92} text="57 → 57 → 57" color={WARM} size={11} />
          <Note x={slotX(5)} y={TAPE_Y + 48} text={diverged ? `recent IDs ${sNow - 44}…${sNow - 1} → positions 13…56` : 'positions = frame IDs until the horizon'} color={WARM} size={11} />
        </g>

        {/* ---------------- beat 8 ---------------- */}
        <g opacity={badgeO}>
          {/* badges sit clear of both rulers' tick numbers: above the upper ruler, below the lower one */}
          <rect x={CUR.x0 - 2} y={TAPE_Y - 126} width={CUR.x1 - CUR.x0 + 4} height={22} rx={6} fill={PANEL} stroke={POSITIVE} strokeOpacity={0.8} />
          <Code x={(CUR.x0 + CUR.x1) / 2} y={TAPE_Y - 111} text={`content: frames ${sNow}…${sNow + 3}`} color={POSITIVE} size={9} anchor="middle" />
          <rect x={CUR.x0 - 2} y={TAPE_Y + 104} width={CUR.x1 - CUR.x0 + 4} height={22} rx={6} fill={PANEL} stroke={WARM} strokeOpacity={0.8} />
          <Code x={(CUR.x0 + CUR.x1) / 2} y={TAPE_Y + 119} text={`positions ${rotaryPos(sNow, sNow)}…${rotaryPos(sNow + 3, sNow)}`} color={WARM} size={9} anchor="middle" />
        </g>
        <g opacity={g(scene.rotLbl)}>
          <Note x={slotX(40)} y={TAPE_Y - 56} text="keys: re-rotated to new coordinates (glyph turns)" color={TEXT} size={10} />
          <Note x={slotX(40)} y={TAPE_Y + 56} text="values: translated, never rotated (dot slides)" color={TEXT} size={10} />
          <Note x={CUR.x1} y={TAPE_Y + 146} text="geometry content follows the true frame ID — the world does not rewind" color={POSITIVE} size={10} anchor="end" />
        </g>

        {/* ---------------- beat 9 ---------------- */}
        {g(scene.finalO) > 0 && (
          <g opacity={g(scene.finalO)}>
            <rect x={160} y={470} width={290} height={34} rx={8} fill={PANEL} stroke={SECONDARY} strokeOpacity={0.7} />
            <Code x={305} y={492} text="geometry → what the frame depicts" color={SECONDARY} size={11} anchor="middle" />
            <rect x={495} y={470} width={290} height={34} rx={8} fill={PANEL} stroke={NEGATIVE} strokeOpacity={0.7} />
            <Code x={640} y={492} text="replay → trains the history encoding" color={NEGATIVE} size={11} anchor="middle" />
            <rect x={830} y={470} width={290} height={34} rx={8} fill={PANEL} stroke={ACCENT} strokeOpacity={0.7} />
            <Code x={975} y={492} text="bounded cache → carries it forward" color={ACCENT} size={11} anchor="middle" />
            <Note x={640} y={540} text="5 sink + 44 recent + 4 current, rendering continues · no promise of perfect consistency" size={12} anchor="middle" />
          </g>
        )}
      </Camera>

      {/* HUD — outside the camera transform */}
      <text x={48} y={64} fill={TEXT} fontFamily={font.ui} fontSize={24} fontWeight={600}>A bounded memory for a long stream</text>
      <Chip x={48} text="Illustrative values; no model inference" o={g(scene.chipO)} color={WARM} />
      <Chip x={330} text="exact StreamPolicy arithmetic · defaults" o={g(scene.chipO)} color={MUTED} />
    </g>
  );
}

export const vizScene = () => scene;
