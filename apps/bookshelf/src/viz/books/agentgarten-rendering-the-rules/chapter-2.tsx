// Rendering the Rules — Chapter 2: Replay restores the history gradient
//
// Backing (AgentGarten, https://github.com/MirroS-Lab/AgentGarten @ 06bb4621deb9b380c34abb6dac42fe0b31eec2e3;
// local checkout verified at that commit):
//   wm/models/dmd.py                     module docstring (Pass 1 rolls out without grad; Pass 2 is one
//                                        teacher-forcing forward over [C0, (x_t, x0)...]); _rollout
//                                        (@torch.no_grad, records noisy + clean blocks); _student_loss
//                                        (forward_ar(..., clean=rollout.clean), x0 = rf_x0(...),
//                                        dmd_loss, gan_gradient, metrics/student/sgf_recovery_max_abs);
//                                        _student_targets
//   wm/networks/cosmos3/network.py       forward_ar (chunks [C0, U_b, Z_b, ...], stride 2 under teacher
//                                        forcing; geometry embedded per chunk so GEMM row counts match
//                                        the cached rollout); run_layers
//   wm/networks/cosmos3/attention.py     BlockCausalAttention (prefix = anchor + visible history; the
//                                        last chunk of a block becomes history); _attend_block
//   paper arxiv:2610.12374 §3.4.2, Appendix A.4
//
// Illustrative data: a 3-block strip (each block = 4 latent frames) and an exact Boolean toy
// attention adjacency derived from BlockCausalAttention's loop. No model error value, no measured
// divergence and no claim that this run reproduces anything bitwise: the diagnostic name
// sgf_recovery_max_abs is shown without a value. Discriminator R1/R2 regularization is out of scope.
//
// Machine: ONE filmstrip (reference + three blocks, each leaving a noisy U tile and a clean Z
// tile) unfolds into a block-level attention stencil, a replay tracing is laid exactly over it,
// a later loss sends a rose highlight backward that reaches the history encodings and visibly
// stops at the detached recorded latent, and the stencil folds back into the strip.
import type { ReactElement } from 'react';
// Standalone blog sections load these scenes without ChapterPlayer's math stylesheet.
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const { ACCENT, SECONDARY, POSITIVE, WARM, NEGATIVE, MUTED, TEXT, PANEL, TEAL, font } = colors;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

export const CAPTIONS = [
  'A later frame depends on how earlier frames were encoded. Training only the next prediction can miss that history-writing step.',
  "The first pass generates blocks without keeping a gradient graph. It records each block's final noisy input and clean output.",
  'A second pass reads those recorded inputs again. The recorded frames stay fixed, but their history encodings are rebuilt with gradients.',
  'Each block has a noisy query and a clean publication. Later queries can read earlier publications, but never future blocks.',
  'Matching an attention mask is not enough. Different call shapes and reduction orders can change floating-point results.',
  "Replay preserves blockwise attention calls, key and value order, and projection grouping to match the rollout's execution.",
  'A loss on a later prediction now reaches the parameters that encoded earlier history. It still stops at the recorded frame itself.',
  "Both distribution matching and the generator's adversarial loss act on this replayed prediction, without retaining the sampling trajectory.",
  'The frame stays fixed as evidence, while the way the model remembers it can improve. That learned history must also fit into a live stream.',
] as const;

// ---------------------------------------------------------------------------
// Module-scope data — the teacher-forcing chunk order and its exact Boolean stencil.
// ---------------------------------------------------------------------------

export const N_BLOCKS = 3;
export const BLOCK_FRAMES = 4;
type ChunkKind = 'ref' | 'U' | 'Z';
interface Chunk { id: string; kind: ChunkKind; block: number }
/** forward_ar with clean=rollout.clean: [C0, U1, Z1, U2, Z2, U3, Z3]. */
export const CHUNKS: Chunk[] = [
  { id: 'C0', kind: 'ref', block: 0 },
  ...Array.from({ length: N_BLOCKS }, (_, b) => [
    { id: `U${b + 1}`, kind: 'U' as ChunkKind, block: b + 1 },
    { id: `Z${b + 1}`, kind: 'Z' as ChunkKind, block: b + 1 },
  ]).flat(),
];
/** Columns = text context + every chunk's keys; rows = every chunk's queries. */
export const COLS = ['text', ...CHUNKS.map((c) => c.id)];
/** BlockCausalAttention: prefix = [anchor, *visible history]; history = earlier blocks' LAST chunk (Z). */
export function visible(row: Chunk, col: number): boolean {
  if (col === 0) return true; // text keys reach every query
  const key = CHUNKS[col - 1];
  if (key.id === row.id) return true; // own chunk
  if (key.kind === 'ref') return true; // the anchor is always in the prefix
  return key.kind === 'Z' && key.block < row.block; // earlier publications only
}
export const ADJ: boolean[][] = CHUNKS.map((row) => COLS.map((_, c) => visible(row, c)));
const Q_LAST = CHUNKS.length - 2; // row index of U3 — the last noisy query
const Z1_COL = COLS.indexOf('Z1');
const Z2_COL = COLS.indexOf('Z2');

// ---------------------------------------------------------------------------
// Layout. Filmstrip at y ≈ 300; stencil in the same band; y ≥ 630 clear.
// ---------------------------------------------------------------------------

const FILM_Y = 300; // clean (Z) row
const U_Y = 232; // noisy (U) row
const KV_Y = 346; // history-encoding marks under each Z tile
const C0_X = 150;
const TILE = 40;
const blockX0 = (b: number) => 300 + (b - 1) * 260;
const frameX = (b: number, f: number) => blockX0(b) + f * (TILE + 4);
const blockCx = (b: number) => blockX0(b) + (4 * (TILE + 4) - 4) / 2;

const ST = { x: 480, y: 190, cell: 40 };
const colX = (c: number) => ST.x + c * ST.cell + ST.cell / 2;
const rowY = (r: number) => ST.y + r * ST.cell + ST.cell / 2;
const HEADER_Y = ST.y - 30;
const OUT_X = ST.x + COLS.length * ST.cell + 26; // output lane right of the stencil
// Stencil framing: header tiles (stage y ≈ 146) must land below the HUD chips (screen y 112) and the
// two-line label stack (stage y ≈ 534) above the captions (screen y 630) → k = 1.1 around y ≈ 330.
const CAM_STENCIL: CameraState = { x: 660, y: 330, k: 1.1 };
const CAM_CALLS: CameraState = { x: 680, y: 330, k: 1.1 };
const CAM_BOUNDARY: CameraState = { x: 620, y: 331, k: 1.1 }; // pans toward Z1 for the backward path
const CAM_LOSS: CameraState = { x: 700, y: 330, k: 1.1 };
const LBL_Y = rowY(CHUNKS.length - 1) + ST.cell / 2 + 46; // beat-label stack under the stencil

/** Where each filmstrip tile goes when the strip folds into the stencil header. */
function headerTarget(c: Chunk, f: number) {
  const col = COLS.indexOf(c.id);
  return { x: colX(col) - 11 + (f - 1.5) * 2.2, y: HEADER_Y - 11 + (f - 1.5) * 2.2 };
}

/** Backward highlight: U3's output → along row U3 → up column Z1 → the Z1 header (detached). */
const BACK_PATH = (() => {
  const y = rowY(Q_LAST);
  return `M${OUT_X},${y} L${colX(Z2_COL)},${y} L${colX(Z1_COL)},${y} L${colX(Z1_COL)},${HEADER_Y + 18}`;
})();

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

  const filmO = n('filmO');
  const depU = n('depU'); // beat 1 dependency arc
  const depLbl = n('depLbl');
  const rollU = n('rollU'); // 0→3: blocks generated, leaving U and Z tiles
  const rollLbl = n('rollLbl');
  const laneO = n('laneO'); // "no gradient graph" lane
  const replayU = n('replayU'); // second-pass tracing draw-on
  const kvU = n('kvU'); // history encodings relight
  const detachO = n('detachO');
  const replayLbl = n('replayLbl');
  const foldU = n('foldU'); // filmstrip → stencil
  const stencilU = n('stencilU');
  const scanU = n('scanU'); // U3 row scan
  const scanLbl = n('scanLbl');
  const diffU = n('diffU'); // call-group outlines diverge
  const diffLbl = n('diffLbl');
  const alignU = n('alignU'); // replay outline snaps over the original
  const alignLbl = n('alignLbl');
  const backU = n('backU'); // backward rose highlight
  const stopU = n('stopU'); // stop bar at the detached latent
  const backLbl = n('backLbl');
  const lossU = n('lossU'); // two loss pointers
  const lossLbl = n('lossLbl');
  const stencilO = n('stencilO', 1);
  const takeO = n('takeO');
  const chipO = n('chipO');

  CAPTIONS.forEach((text, i) => tl.caption({ at: B(i + 1), dur: i < 8 ? 8 : 7.5, text }));

  // 1 — the later block reads earlier encodings; push along the dependency
  to(filmO, 1, 0.5, 0.8);
  to(chipO, 1, 1.0);
  to(depU, 1, 1.6, 1.4, ease.draw);
  tl.tween(cam, { x: 520, y: 300, k: 1.3 }, { at: 1.8, dur: 1.4, ease: ease.move });
  to(depLbl, 1, 3.6);
  tl.hold(B(1) + 7, 0.8);

  // 2 — pass 1: blocks roll out with no grad, leaving U and Z tiles
  to(depU, 0, B(2), 0.6);
  to(depLbl, 0, B(2));
  tl.tween(cam, CAMERA_HOME, { at: B(2), dur: 1.2, ease: ease.move });
  to(rollU, 3, B(2) + 0.8, 3.6, ease.linear);
  to(laneO, 1, B(2) + 1.2);
  to(rollLbl, 1, B(2) + 2.0);
  tl.hold(B(2) + 7, 0.8);

  // 3 — pass 2: the replay tracing enters; encodings relight; detach marks
  to(rollLbl, 0, B(3));
  to(laneO, 0.15, B(3));
  to(replayU, 1, B(3) + 0.4, 1.6, ease.draw);
  to(kvU, 1, B(3) + 1.8, 1.0, ease.move);
  to(detachO, 1, B(3) + 2.8);
  to(replayLbl, 1, B(3) + 3.2);
  tl.hold(B(3) + 7, 0.8);

  // 4 — unfold into the Boolean stencil; scan the latest query row
  to(replayLbl, 0, B(4));
  to(laneO, 0, B(4));
  to(detachO, 0, B(4));
  tl.tween(cam, CAM_STENCIL, { at: B(4) + 0.6, dur: 1.4, ease: ease.move });
  to(foldU, 1, B(4) + 0.2, 1.4, ease.move);
  to(stencilU, 1, B(4) + 1.4, 1.6, ease.linear);
  to(scanU, 1, B(4) + 3.2, 2.2, ease.linear);
  to(scanLbl, 1, B(4) + 3.6);
  tl.hold(B(4) + 7, 0.8);

  // 5 — two identical masks, differing call groupings
  to(scanLbl, 0, B(5));
  to(scanU, 0, B(5), 0.4);
  tl.tween(cam, CAM_CALLS, { at: B(5), dur: 1.2, ease: ease.move });
  to(diffU, 1, B(5) + 1.0, 1.0, ease.move);
  to(diffLbl, 1, B(5) + 2.4);
  tl.hold(B(5) + 7, 0.8);

  // 6 — replay outline aligns over the original block calls
  to(diffLbl, 0, B(6));
  to(alignU, 1, B(6) + 0.6, 1.3, ease.move);
  to(alignLbl, 1, B(6) + 2.4);
  tl.hold(B(6) + 7, 0.8);

  // 7 — backward highlight from the last output to Z1's encoding, stopped at the latent
  to(alignLbl, 0, B(7));
  to(alignU, 0, B(7), 0.6);
  to(diffU, 0, B(7), 0.6);
  to(backU, 1, B(7) + 0.4, 1.8, ease.draw);
  tl.tween(cam, CAM_BOUNDARY, { at: B(7) + 1.6, dur: 1.4, ease: ease.move });
  to(stopU, 1, B(7) + 2.4, 0.5, ease.pop);
  to(backLbl, 1, B(7) + 3.2);
  tl.hold(B(7) + 7, 0.8);

  // 8 — two loss pointers meet the replayed prediction
  to(backLbl, 0, B(8));
  tl.tween(cam, CAM_LOSS, { at: B(8), dur: 1.3, ease: ease.move });
  to(lossU, 1, B(8) + 1.2, 1.2, ease.move);
  to(lossLbl, 1, B(8) + 2.6);
  tl.hold(B(8) + 7, 0.8);

  // 9 — fold back; fixed latents, trainable encodings
  to(lossLbl, 0, B(9));
  to(lossU, 0, B(9), 0.6);
  to(backU, 0, B(9), 0.6);
  to(stopU, 0, B(9), 0.6);
  tl.tween(cam, CAMERA_HOME, { at: B(9), dur: 1.3, ease: ease.move });
  to(stencilO, 0, B(9) + 0.2, 1.0, ease.move);
  to(foldU, 0, B(9) + 0.4, 1.4, ease.move);
  to(takeO, 1, B(9) + 2.6, 0.8);
  tl.hold(B(9) + 7, 0.5); // ends at 72.0

  return {
    tl, cam, filmO, depU, depLbl, rollU, rollLbl, laneO, replayU, kvU, detachO, replayLbl, foldU,
    stencilU, scanU, scanLbl, diffU, diffLbl, alignU, alignLbl, backU, stopU, backLbl, lossU, lossLbl,
    stencilO, takeO, chipO,
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

/** A noisy latent tile: hatched; a clean one: solid. Position/size are lerped by the caller. */
function Tile({ x, y, size, kind, o = 1, glow = 0 }: { x: number; y: number; size: number; kind: ChunkKind; o?: number; glow?: number }) {
  if (o <= 0) return null;
  const stroke = kind === 'ref' ? POSITIVE : kind === 'U' ? NEGATIVE : ACCENT;
  return (
    <g opacity={o}>
      {glow > 0 && <rect x={x - 4} y={y - 4} width={size + 8} height={size + 8} rx={7} fill={SECONDARY} opacity={0.35 * glow} />}
      <rect x={x} y={y} width={size} height={size} rx={4} fill={PANEL} stroke={stroke} strokeWidth={1.5}
        strokeDasharray={kind === 'U' ? '3 2' : undefined} fillOpacity={1} />
      {kind === 'U' ? (
        <>
          <line x1={x + 4} y1={y + size - 4} x2={x + size - 4} y2={y + 4} stroke={NEGATIVE} strokeOpacity={0.5} />
          <line x1={x + 4} y1={y + size / 2} x2={x + size / 2} y2={y + 4} stroke={NEGATIVE} strokeOpacity={0.5} />
          <line x1={x + size / 2} y1={y + size - 4} x2={x + size - 4} y2={y + size / 2} stroke={NEGATIVE} strokeOpacity={0.5} />
        </>
      ) : (
        <rect x={x + 5} y={y + 5} width={size - 10} height={size - 10} rx={2} fill={stroke} fillOpacity={0.35} />
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>) => s.get(ch);
  const filmO = g(scene.filmO);
  const rollU = g(scene.rollU);
  const replayU = g(scene.replayU);
  const kvU = g(scene.kvU);
  const foldU = g(scene.foldU);
  const stencilU = g(scene.stencilU);
  const scanU = g(scene.scanU);
  const diffU = g(scene.diffU);
  const alignU = g(scene.alignU);
  const backU = g(scene.backU);
  const stopU = g(scene.stopU);
  const lossU = g(scene.lossU);
  const stencilO = g(scene.stencilO);
  const depU = g(scene.depU);

  const tileSize = lerp(TILE, 22, foldU);
  const strip: ReactElement[] = [];

  // ---- the persistent filmstrip (also the stencil's column headers when folded) ----
  // C0
  {
    const tgt = headerTarget(CHUNKS[0], 1.5);
    strip.push(
      <Tile key="c0" x={lerp(C0_X, tgt.x, foldU)} y={lerp(FILM_Y - TILE / 2, tgt.y, foldU)} size={tileSize} kind="ref" o={filmO} />,
    );
  }
  for (let b = 1; b <= N_BLOCKS; b++) {
    const bornZ = clamp01(rollU - (b - 1)); // block b appears as rollU passes b−1
    const kvHot = kvU * (1 - foldU * 0.3);
    for (let f = 0; f < BLOCK_FRAMES; f++) {
      const u = clamp01(bornZ * 4 - f);
      const fx = frameX(b, f);
      const zT = headerTarget(CHUNKS[2 * b], f);
      const uT = headerTarget(CHUNKS[2 * b - 1], f);
      // clean Z tile — the strip's frames; beat 2 re-reads them as pass 1's recorded clean outputs
      strip.push(
        <Tile key={`z${b}${f}`} x={lerp(fx, zT.x, foldU)} y={lerp(FILM_Y - TILE / 2, zT.y, foldU)} size={tileSize} kind="Z" o={filmO}
          glow={rollU > 0 && rollU < 3 ? clamp01(1 - Math.abs(rollU - (b - 1) - f / 4) * 3) : 0} />,
      );
      // noisy U tile appears only once pass 1 records it
      strip.push(
        <Tile key={`u${b}${f}`} x={lerp(fx, uT.x, foldU)} y={lerp(U_Y - TILE / 2, uT.y, foldU)} size={tileSize} kind="U" o={filmO * u * (rollU > 0 ? 1 : 0)} />,
      );
      // history-encoding marks (K/V) under each clean tile — relit by the replay
      if (foldU < 1) {
        strip.push(
          <g key={`kv${b}${f}`} opacity={filmO * u * (1 - foldU) * (rollU > 0 ? 1 : 0)}>
            <line x1={fx + 8} y1={KV_Y} x2={fx + TILE - 8} y2={KV_Y} stroke={kvHot > 0 ? SECONDARY : MUTED} strokeWidth={lerp(1.5, 3, kvHot)} strokeOpacity={lerp(0.4, 1, kvHot)} />
            <line x1={fx + 8} y1={KV_Y + 6} x2={fx + TILE - 8} y2={KV_Y + 6} stroke={kvHot > 0 ? SECONDARY : MUTED} strokeWidth={lerp(1.5, 3, kvHot)} strokeOpacity={lerp(0.4, 1, kvHot)} />
          </g>,
        );
      }
    }
  }

  // beat-7 path progress helpers
  const scanCol = scanU * COLS.length; // column being scanned on the U3 row
  const stencilCells: ReactElement[] = [];
  if (stencilU > 0) {
    CHUNKS.forEach((row, r) => {
      COLS.forEach((_, c) => {
        const k = r * COLS.length + c;
        const u = clamp01(stencilU * CHUNKS.length * COLS.length * 1.1 - k);
        const on = ADJ[r][c];
        const isQ = r === Q_LAST;
        const scanned = isQ && scanU > 0 ? clamp01(scanCol - c) : 0;
        const future = isQ && scanU > 0 && !on && c > 0;
        // backward highlight lights the cells U3 reads from Z1/Z2 as the path passes
        const backHit = isQ && on && (c === Z1_COL || c === Z2_COL) ? clamp01(backU * 2.2 - (c === Z2_COL ? 0.3 : 0.9)) : 0;
        const fill = on ? (row.kind === 'U' ? ACCENT : SECONDARY) : PANEL;
        stencilCells.push(
          <rect key={k} x={colX(c) - ST.cell / 2 + 2} y={rowY(r) - ST.cell / 2 + 2} width={ST.cell - 4} height={ST.cell - 4} rx={5}
            fill={backHit > 0 ? NEGATIVE : fill} fillOpacity={on ? lerp(0.28, 0.75, Math.max(scanned, backHit)) : future && scanned > 0 ? 0.9 : 0.5}
            stroke={future && scanned > 0 ? NEGATIVE : on ? fill : MUTED} strokeOpacity={future && scanned > 0 ? 0.9 : on ? 0.7 : 0.25}
            opacity={u} />,
        );
      });
    });
  }

  return (
    <g>
      <Camera {...g(scene.cam)}>
        {/* ---------------- beat 1: dependency arc from block 3 back to block 1's encoding ---------------- */}
        {depU > 0 && foldU < 1 && (
          <g opacity={(1 - foldU) * clamp01(depU * 3)}>
            <path d={`M${blockCx(3)},${FILM_Y - TILE / 2 - 6} C${blockCx(3)},150 ${blockCx(1)},150 ${blockCx(1)},${FILM_Y - TILE / 2 - 6}`}
              fill="none" stroke={WARM} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - depU} />
            <circle cx={blockCx(1)} cy={FILM_Y - TILE / 2 - 6} r={5} fill={WARM} opacity={clamp01(depU * 4 - 3)} />
          </g>
        )}
        <g opacity={g(scene.depLbl)}>
          <Note x={blockCx(3)} y={U_Y - 40} text="block 3 reads…" color={WARM} size={13} anchor="middle" />
          <Note x={blockCx(1)} y={U_Y - 40} text="…how block 1 was encoded" color={WARM} size={13} anchor="middle" />
          <Note x={C0_X + TILE / 2} y={FILM_Y + 40} text="C0 reference" size={11} anchor="middle" />
          <Note x={640} y={FILM_Y + 92} text="next-prediction loss alone never asks about this step" size={12} anchor="middle" />
        </g>

        {/* ---------------- beat 2 labels + the absent gradient lane ---------------- */}
        <g opacity={g(scene.laneO)}>
          <line x1={C0_X} y1={430} x2={1100} y2={430} stroke={MUTED} strokeOpacity={0.4} strokeDasharray="3 7" />
          <Note x={C0_X} y={452} text="gradient lane — empty: pass 1 keeps no graph" size={11} />
        </g>
        <g opacity={g(scene.rollLbl)}>
          <Code x={C0_X} y={U_Y - 48} text="@torch.no_grad()  _rollout" color={NEGATIVE} size={12} />
          <Code x={C0_X} y={U_Y - 32} text="noisy_blocks.append(current)  →  U_b  (final noisy input)" color={MUTED} size={11} />
          <Code x={C0_X} y={FILM_Y + 72} text="clean_blocks.append(clean)  →  Z_b  (clean output, committed)" color={MUTED} size={11} />
          <Note x={1100} y={U_Y} text="U" color={NEGATIVE} anchor="end" />
          <Note x={1100} y={FILM_Y + 4} text="Z" color={ACCENT} anchor="end" />
        </g>

        {/* ---------------- beat 3: replay tracing over the same tiles ---------------- */}
        {replayU > 0 && foldU < 1 && (
          <g opacity={1 - foldU}>
            <rect x={C0_X - 12} y={U_Y - TILE / 2 - 12} width={blockX0(3) + 4 * (TILE + 4) - C0_X + 20} height={FILM_Y - U_Y + TILE + 24}
              rx={12} fill="none" stroke={SECONDARY} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - replayU} />
            <Code x={C0_X - 12} y={U_Y - TILE / 2 - 22} text="pass 2 · forward_ar(anchor, rollout.noisy, …, clean=rollout.clean)" color={SECONDARY} size={12} o={clamp01(replayU * 3 - 1.5)} />
          </g>
        )}
        <g opacity={g(scene.detachO) * (1 - foldU)}>
          {[1, 2, 3].map((b) => (
            <g key={b}>
              <line x1={blockX0(b) - 7} y1={FILM_Y - TILE / 2 - 2} x2={blockX0(b) - 7} y2={FILM_Y + TILE / 2 + 2} stroke={NEGATIVE} strokeWidth={3} />
              <Code x={blockX0(b) - 7} y={FILM_Y + TILE / 2 + 16} text="detached" color={NEGATIVE} size={9} anchor="middle" />
            </g>
          ))}
        </g>
        <g opacity={g(scene.replayLbl)}>
          <Note x={C0_X} y={KV_Y + 36} text="recorded latents: fixed" color={NEGATIVE} size={12} />
          <Note x={C0_X + 190} y={KV_Y + 36} text="history encodings (K/V): recomputed with gradients" color={SECONDARY} size={12} />
          <Code x={C0_X} y={KV_Y + 56} text="geometry embedded per chunk → same GEMM row counts as the cached rollout" color={MUTED} size={10} />
        </g>

        {/* ---------------- the stencil ---------------- */}
        {stencilU > 0 && stencilO > 0 && (
          <g opacity={stencilO}>
            {stencilCells}
            {/* row labels */}
            {CHUNKS.map((row, r) => (
              <Code key={row.id} x={ST.x - 14} y={rowY(r) + 4} text={row.id} color={row.kind === 'U' ? NEGATIVE : row.kind === 'Z' ? ACCENT : POSITIVE}
                size={12} anchor="end" o={clamp01(stencilU * 3)} />
            ))}
            <Note x={ST.x - 14} y={ST.y - 6} text="queries ↓" size={10} anchor="end" o={clamp01(stencilU * 3)} />
            <Code x={colX(0)} y={HEADER_Y + 4} text="text" color={MUTED} size={11} anchor="middle" o={clamp01(stencilU * 3)} />
            <Note x={colX(COLS.length - 1) + 30} y={HEADER_Y + 4} text="← keys" size={10} anchor="start" o={clamp01(stencilU * 3)} />
            {/* U / Z row stripes */}
            {CHUNKS.map((row, r) =>
              row.kind === 'U' ? (
                <Note key={`t${r}`} x={OUT_X + 12} y={rowY(r) + 4} text="noisy query" color={NEGATIVE} size={10} o={clamp01(stencilU * 3) * (1 - lossU)} />
              ) : row.kind === 'Z' ? (
                <Note key={`t${r}`} x={OUT_X + 12} y={rowY(r) + 4} text="clean publication" color={ACCENT} size={10} o={clamp01(stencilU * 3) * (1 - lossU)} />
              ) : null,
            )}
            <Note x={ST.x} y={rowY(CHUNKS.length - 1) + ST.cell / 2 + 18} text="3-block illustration; each block = 4 latent frames · exact Boolean toy adjacency" size={11} />

            {/* beat 4 scan */}
            {scanU > 0 && (
              <g>
                <rect x={ST.x} y={rowY(Q_LAST) - ST.cell / 2} width={Math.min(COLS.length, scanCol) * ST.cell} height={ST.cell} rx={6} fill="none" stroke={WARM} strokeWidth={2} />
              </g>
            )}
            <g opacity={g(scene.scanLbl)}>
              <Note x={ST.x} y={LBL_Y} text="U3 reads: text, C0, Z1, Z2, its own chunk — never Z3, never a future block" color={WARM} size={12} />
            </g>

            {/* beat 5–6: call-grouping outlines (rollout vs replay) */}
            {diffU > 0 && (
              <g opacity={diffU}>
                {[1, 2, 3].map((b) => {
                  const rU = 2 * b - 1;
                  const rZ = 2 * b;
                  const off = 14 * (1 - alignU);
                  return (
                    <g key={b}>
                      {/* rollout: one call per query chunk with its prefix */}
                      <rect x={ST.x - 4} y={rowY(rU) - ST.cell / 2 - 2} width={COLS.length * ST.cell + 8} height={ST.cell + 4} rx={7}
                        fill="none" stroke={WARM} strokeWidth={1.5} strokeDasharray="5 4" />
                      {/* replay: the same prefix, U_b and Z_b attended as the block's two chunks — shown offset until aligned */}
                      <rect x={ST.x - 4 + off} y={rowY(rU) - ST.cell / 2 - 2 - off * 0.5} width={COLS.length * ST.cell + 8} height={2 * ST.cell + 4} rx={7}
                        fill="none" stroke={SECONDARY} strokeWidth={1.5} />
                      <Code x={ST.x - 4 + off} y={rowY(rZ) + ST.cell / 2 - 6 - off * 0.5} text={alignU > 0.5 ? `block ${b}: same prefix, same K/V order` : `block ${b}`}
                        color={SECONDARY} size={9} o={alignU > 0.5 ? alignU : 0.8} />
                    </g>
                  );
                })}
              </g>
            )}
            <g opacity={g(scene.diffLbl)}>
              <Note x={ST.x} y={LBL_Y} text="same visibility mask (both outlines)" color={TEXT} size={12} />
              <Note x={ST.x} y={LBL_Y + 18} text="different call shapes / reduction order → different floating-point sums — schematic, no measured divergence" color={MUTED} size={11} />
            </g>
            <g opacity={g(scene.alignLbl)}>
              <Code x={ST.x} y={LBL_Y} text="BlockCausalAttention · _attend_block(query, prefix, key, value)" color={SECONDARY} size={12} />
              <Note x={ST.x} y={LBL_Y + 18} text="blockwise calls · key/value order · projection grouping — same execution structure" color={TEXT} size={11} />
              <Code x={OUT_X + 12} y={rowY(0) + 4} text="metrics/student/sgf_recovery_max_abs" color={MUTED} size={9} />
              <Note x={OUT_X + 12} y={rowY(0) + 18} text="(diagnostic; no value claimed here)" size={9} />
            </g>

            {/* beat 7: backward highlight + stop bar */}
            {backU > 0 && (
              <g>
                <path d={BACK_PATH} fill="none" stroke={NEGATIVE} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
                  pathLength={1} strokeDasharray={1} strokeDashoffset={1 - backU} opacity={0.9} />
                <circle cx={OUT_X} cy={rowY(Q_LAST)} r={9} fill={PANEL} stroke={NEGATIVE} strokeWidth={2} opacity={clamp01(backU * 4)} />
                <Code x={OUT_X} y={rowY(Q_LAST) + 4} text="L" color={NEGATIVE} size={10} anchor="middle" o={clamp01(backU * 4)} />
              </g>
            )}
            {stopU > 0 && (
              <g opacity={stopU}>
                <rect x={colX(Z1_COL) - ST.cell / 2 + 2} y={HEADER_Y - 2} width={ST.cell - 4} height={5} rx={2} fill={NEGATIVE} />
                <Code x={colX(Z1_COL)} y={HEADER_Y - 22} text="stop · detached Z1" color={NEGATIVE} size={10} anchor="middle" />
                <circle cx={colX(Z1_COL)} cy={HEADER_Y + 30} r={8} fill="none" stroke={SECONDARY} strokeWidth={2} />
                <MathLabel tex={'\\tfrac{\\partial L}{\\partial \\theta_{K,V}} \\neq 0 \\text{ reaches here}'} x={colX(Z1_COL) + 14} y={HEADER_Y + 31}
                  fontSize={12} color={SECONDARY} anchor="start" boxWidth={240} />
              </g>
            )}
            <g opacity={g(scene.backLbl)}>
              <Note x={ST.x} y={LBL_Y} text="gradient reaches the parameters that encoded Z1's history…" color={SECONDARY} size={12} />
              <Note x={ST.x} y={LBL_Y + 18} text="…and stops at the recorded latent itself" color={NEGATIVE} size={12} />
            </g>

            {/* beat 8: two loss pointers onto x0 */}
            {lossU > 0 && (
              <g opacity={lossU}>
                <circle cx={OUT_X} cy={rowY(Q_LAST)} r={11} fill={PANEL} stroke={WARM} strokeWidth={2} />
                <Code x={OUT_X} y={rowY(Q_LAST) + 4} text="x0" color={WARM} size={10} anchor="middle" />
                <line x1={lerp(OUT_X + 150, OUT_X + 16, lossU)} y1={rowY(Q_LAST) - 34} x2={OUT_X + 10} y2={rowY(Q_LAST) - 8} stroke={POSITIVE} strokeWidth={2} />
                <line x1={lerp(OUT_X + 150, OUT_X + 16, lossU)} y1={rowY(Q_LAST) + 34} x2={OUT_X + 10} y2={rowY(Q_LAST) + 8} stroke={TEAL} strokeWidth={2} />
                <rect x={OUT_X + 20} y={rowY(Q_LAST) - 58} width={210} height={26} rx={7} fill={PANEL} stroke={POSITIVE} strokeOpacity={0.8} />
                <MathLabel tex={'\\text{dmd\\_loss} \\propto \\lVert x_0 - \\text{target} \\rVert^2'} x={OUT_X + 125} y={rowY(Q_LAST) - 45}
                  fontSize={11} color={POSITIVE} boxWidth={200} />
                <rect x={OUT_X + 20} y={rowY(Q_LAST) + 32} width={210} height={26} rx={7} fill={PANEL} stroke={TEAL} strokeOpacity={0.8} />
                <Code x={OUT_X + 125} y={rowY(Q_LAST) + 49} text="(x0 · gan_gradient).sum()" color={TEAL} size={10} anchor="middle" />
              </g>
            )}
            <g opacity={g(scene.lossLbl)}>
              <Code x={ST.x} y={LBL_Y} text="_student_loss · x0 = rf_x0(rollout.noisy, rollout.sigma, velocity)" color={WARM} size={12} />
              <Note x={ST.x} y={LBL_Y + 18} text="pass-1 sampling trajectory: never retained, not differentiated through" color={MUTED} size={11} />
            </g>
          </g>
        )}

        {/* ---------------- beat 9: takeaway over the quiet strip ---------------- */}
        {g(scene.takeO) > 0 && (
          <g opacity={g(scene.takeO)}>
            <Note x={C0_X} y={KV_Y + 44} text="fixed latents" color={NEGATIVE} size={13} />
            <Note x={C0_X + 120} y={KV_Y + 44} text="trainable history encodings" color={SECONDARY} size={13} />
            <rect x={340} y={541} width={600} height={48} rx={10} fill={PANEL} stroke={WARM} strokeOpacity={0.7} />
            <text x={640} y={571} fill={TEXT} fontFamily={font.ui} fontSize={20} fontWeight={600} textAnchor="middle">
              Fixed frames as evidence; the memory of them learns
            </text>
          </g>
        )}

        {/* the filmstrip / header tiles — drawn last so the headers sit over the stencil edge */}
        {strip}
        {/* beat 9: encodings emphasized under the restored strip */}
        {g(scene.takeO) > 0 && foldU < 0.5 && (
          <MathLabel tex={'\\tfrac{\\partial L}{\\partial \\theta_{K,V}} \\neq 0,\\qquad \\tfrac{\\partial L}{\\partial Z_b} \\text{ not taken}'} x={blockX0(2)} y={KV_Y + 60}
            fontSize={15} color={TEXT} opacity={g(scene.takeO)} />
        )}
      </Camera>

      {/* HUD — outside the camera transform */}
      <text x={48} y={64} fill={TEXT} fontFamily={font.ui} fontSize={24} fontWeight={600}>Replay restores the history gradient</text>
      <Chip x={48} text="Illustrative values; no model inference" o={g(scene.chipO)} color={WARM} />
      <Chip x={330} text="3 blocks × 4 latent frames · toy adjacency" o={g(scene.chipO)} color={MUTED} />
    </g>
  );
}

export const vizScene = () => scene;
