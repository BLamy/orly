// Rendering the Rules — Chapter 1: Geometry becomes tokens
//
// Backing (AgentGarten, https://github.com/MirroS-Lab/AgentGarten @ 06bb4621deb9b380c34abb6dac42fe0b31eec2e3;
// local checkout verified at that commit):
//   wm/networks/cosmos3/geometry.py      colorize_depth (t = 1 − (1 + d·scale/10)^−2, seven linear RGB
//                                        segments black→red→yellow→green→cyan→blue→magenta→white),
//                                        downsample_geometry (avg_pool2d, kernel = stride = factor)
//   wm/networks/cosmos3/conditioner.py   _geometry_pixels (colorize → prepare_normal → downsample),
//                                        _encode_geometry (frozen codec.encode on the depth/normal pair)
//   wm/networks/cosmos3/network.py       Cosmos3Condition {text, depth, normal, fps}; geometry_frames
//                                        (proj_in(lerp(depth, normal, 0.5)) + geometry_modality_embed);
//                                        GeometryFrames.chunk — frame-major [R_f, G_f]; _grid_positions
//                                        ((i + ½)·rgb/grid − ½); rgb_tokens; decode_velocity
//   paper arxiv:2610.12374 §§3.1–3.2, Appendix A.1–A.2 (28 geometry + 390 image tokens per latent
//                                        frame at the 480×832 output setting)
//
// Illustrative data: the 8×12 depth toy, its normals, the hand-pooled 4×4 regions and every
// "latent" tile value are made up for display and carry no model inference. The 4×7 = 28 and
// 15×26 = 390 grids are the paper's actual per-latent-frame token counts at 480×832 output.
// The released code packs tokens frame-major [R_f, G_f] (GeometryFrames.chunk), not the
// modality-major schematic of the paper's Eq. 4 — the ribbon follows the code.
//
// Machine: ONE depth silhouette is colorized, pooled, pushed through a frozen encoder,
// averaged with its normal twin, and finally laid out as the 28-token strip beside the
// 390-token image grid that shares its extent.
import type { ReactElement } from 'react';
// Standalone blog sections load these scenes without ChapterPlayer's math stylesheet.
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Brace } from '../../primitives';

const { ACCENT, SECONDARY, POSITIVE, WARM, NEGATIVE, MUTED, TEXT, PANEL, TEAL, font } = colors;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, u: number): RGB => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const css = (c: RGB): string => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;

export const CAPTIONS = [
  "A simulator can decide where a surface moves. The renderer's job is to turn that geometry into the next visible frame.",
  'The released renderer takes depth and surface normals, alongside text and a clean reference frame that anchors appearance.',
  'Depth becomes a color signal. Nearby and distant surfaces move along a fixed color path instead of becoming arbitrary labels.',
  'Spatial averaging shrinks the geometry before a frozen video encoder turns it into latent patches.',
  'Depth and normal patches are averaged, then passed through the shared image projection with a learned geometry marker.',
  "At the paper's output resolution, each latent frame has twenty-eight geometry tokens beside three hundred and ninety image tokens.",
  'Both grids share the same image extent and time coordinates, even though the geometry grid is much coarser.',
  'The transformer reads geometry and image tokens together. Only the noisy image tokens produce the velocity used to clean the frame.',
  'The geometry guides what the frame depicts, while the reference and text guide its appearance. The next problem is remembering earlier frames.',
] as const;

// ---------------------------------------------------------------------------
// Module-scope data — the toy depth field and the REAL colorize_depth mapping.
// ---------------------------------------------------------------------------

const ROWS = 8;
const COLS = 12;
const FAR = 9; // illustrative background depth
/** Toy depth: a raised ellipse on a far background; `shift` moves it one column. */
function toyDepth(shift: number): number[][] {
  const ci = 3.5;
  const cj = 5.0 + shift;
  return Array.from({ length: ROWS }, (_, i) =>
    Array.from({ length: COLS }, (_, j) => {
      const d2 = ((i - ci) / 2.7) ** 2 + ((j - cj) / 2.5) ** 2;
      return d2 < 1 ? 2.2 + 1.8 * d2 : FAR;
    }),
  );
}
export const DEPTH0 = toyDepth(0);
export const DEPTH1 = toyDepth(1);

/** colorize_depth: t = 1 − (1 + d·scale/10)^−2 with scale = 1. */
export const depthU = (d: number, scale = 1): number => 1 - Math.pow(1 + (d * scale) / 10, -2);
/** The seven linear RGB-cube segments of colorize_depth (geometry.py:99–106). */
export function colorizeRGB(u: number): RGB {
  const s = u * 7;
  const c = (v: number) => clamp01(v);
  const red = c(s) - c(s - 2) + c(s - 5);
  const green = c(s - 1) - c(s - 4) + c(s - 6);
  const blue = c(s - 3);
  return [red, green, blue];
}
const gray = (d: number): RGB => {
  const g = 0.15 + 0.75 * clamp01(1 - (d - 2) / 8);
  return [g, g, g];
};

/** Toy normals from the depth gradient, displayed as (n + 1) / 2. */
function toyNormals(depth: number[][]): RGB[][] {
  return depth.map((row, i) =>
    row.map((_, j) => {
      const l = depth[i][Math.max(0, j - 1)];
      const r = depth[i][Math.min(COLS - 1, j + 1)];
      const up = depth[Math.max(0, i - 1)][j];
      const dn = depth[Math.min(ROWS - 1, i + 1)][j];
      const gx = (r - l) / 2;
      const gy = (dn - up) / 2;
      const len = Math.hypot(gx, gy, 1);
      const n: RGB = [-gx / len, -gy / len, 1 / len];
      return [(n[0] + 1) / 2, (n[1] + 1) / 2, (n[2] + 1) / 2];
    }),
  );
}
export const NORMAL1 = toyNormals(DEPTH1);
const COLOR1: RGB[][] = DEPTH1.map((row) => row.map((d) => colorizeRGB(depthU(d))));

/** Hand pooling of the toy in 4×4 regions → 2×3 (display only; not model latents). */
const POOL = 4;
const PR = ROWS / POOL; // 2
const PC = COLS / POOL; // 3
function poolRGB(field: RGB[][]): RGB[][] {
  return Array.from({ length: PR }, (_, a) =>
    Array.from({ length: PC }, (_, b) => {
      const acc: RGB = [0, 0, 0];
      for (let i = 0; i < POOL; i++)
        for (let j = 0; j < POOL; j++) {
          const c = field[a * POOL + i][b * POOL + j];
          acc[0] += c[0] / 16;
          acc[1] += c[1] / 16;
          acc[2] += c[2] / 16;
        }
      return acc;
    }),
  );
}
const POOLED_COLOR = poolRGB(COLOR1);
const POOLED_NORMAL = poolRGB(NORMAL1);

// The paper's per-latent-frame token grids at 480×832 output.
export const IMG_GRID = { rows: 15, cols: 26 }; // 390
export const GEO_GRID = { rows: 4, cols: 7 }; // 28
export const N_IMG = IMG_GRID.rows * IMG_GRID.cols;
export const N_GEO = GEO_GRID.rows * GEO_GRID.cols;
/** _grid_positions: coarse cell (i, j) → dense coordinates. */
export const gridPos = (i: number, j: number) => ({
  row: (i + 0.5) * (IMG_GRID.rows / GEO_GRID.rows) - 0.5,
  col: (j + 0.5) * (IMG_GRID.cols / GEO_GRID.cols) - 0.5,
});
const FOCUS_CELL = { i: 1, j: 3 };
const FOCUS_POS = gridPos(FOCUS_CELL.i, FOCUS_CELL.j); // row 5.125, col 12.5

/** Schematic clean-frame mask on the dense grid (the same silhouette, nothing decoded). */
const CLEAN_MASK: number[][] = Array.from({ length: IMG_GRID.rows }, (_, i) =>
  Array.from({ length: IMG_GRID.cols }, (_, j) => {
    const d2 = ((i - 7) / 5.2) ** 2 + ((j - 13) / 5.6) ** 2;
    return d2 < 1 ? 1 - 0.5 * d2 : 0;
  }),
);

// ---------------------------------------------------------------------------
// Layout. Load-bearing content lives in y = 100…580; y ≥ 630 stays clear.
// ---------------------------------------------------------------------------

const CELL = 22;
const DEPTH_AT = { x: 110, y: 210 };
const NORMAL_AT = { x: 400, y: 210 };
const FRAME_AT = { x: 760, y: 190, w: 400, h: 225 }; // schematic frame (beat 1)
const BOUNDARY_X = 660;
const LAT = 50; // latent tile size
const latentTile = (kind: 'd' | 'n', r: number) => ({
  x: (kind === 'd' ? 720 : 940) + (r % PC) * 60,
  y: 210 + Math.floor(r / PC) * 60,
});
const MERGE_AT = { x: 820, y: 300 };
const MERGE_REGION = 1; // the illustrative pair that converges in beat 5

const IMG_AT = { x: 140, y: 190, cell: 14 };
const GEO_AT = { x: 760, y: 190, cellW: (IMG_GRID.cols * 14) / GEO_GRID.cols, cellH: (IMG_GRID.rows * 14) / GEO_GRID.rows };
const GRID_W = IMG_GRID.cols * IMG_AT.cell; // 364
const GRID_H = IMG_GRID.rows * IMG_AT.cell; // 210
const RIBBON = { x: 140, y: 476, h: 26, unit: 2.1 };
const TAPE = { x: 560, y: 540, w: 44, h: 28, n: 6, dx: 52 };

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

  const depthO = n('depthO');
  const moveU = n('moveU'); // silhouette shifts one column
  const frameO = n('frameO'); // schematic frame outline
  const scopeLbl = n('scopeLbl');
  const normalO = n('normalO');
  const condLbl = n('condLbl'); // Cosmos3Condition chips
  const colorU = n('colorU'); // gray → colorize_depth
  const colorLbl = n('colorLbl');
  const poolU = n('poolU'); // cells converge to 4×4 region means
  const encU = n('encU'); // pooled regions cross the frozen boundary
  const boundaryO = n('boundaryO');
  const encLbl = n('encLbl');
  const focusTiles = n('focusTiles'); // beat 5: dim the other tiles
  const mergeU = n('mergeU');
  const projO = n('projO');
  const embedU = n('embedU');
  const mergeLbl = n('mergeLbl');
  const stageAO = n('stageAO', 1); // everything from beats 1–5
  const gridsU = n('gridsU');
  const gridLbl = n('gridLbl');
  const overlayU = n('overlayU');
  const focusU = n('focusU');
  const posLbl = n('posLbl');
  const ribbonU = n('ribbonU');
  const ribbonLbl = n('ribbonLbl');
  const sweepU = n('sweepU');
  const cleanU = n('cleanU');
  const geoO = n('geoO', 1);
  const ribbonO = n('ribbonO', 1);
  const cuesO = n('cuesO');
  const tapeU = n('tapeU');
  const chipO = n('chipO');

  CAPTIONS.forEach((text, i) => tl.caption({ at: B(i + 1), dur: i < 8 ? 8 : 7.5, text }));

  // 1 — the silhouette moves; the schematic frame follows
  to(depthO, 1, 0.5, 0.8);
  to(frameO, 1, 1.2, 0.8);
  to(chipO, 1, 1.4);
  to(moveU, 1, 2.4, 1.4, ease.move);
  to(scopeLbl, 1, 4.2);
  tl.hold(B(1) + 7, 0.8);

  // 2 — depth + normals, with text and reference as quiet supports
  to(frameO, 0.15, B(2), 0.8);
  to(scopeLbl, 0, B(2));
  tl.tween(cam, { x: 420, y: 300, k: 1.25 }, { at: B(2), dur: 1.2, ease: ease.move });
  to(normalO, 1, B(2) + 1.0, 0.8);
  to(condLbl, 1, B(2) + 2.6);
  tl.hold(B(2) + 7, 0.8);

  // 3 — push into the depth field; colorize_depth morphs the cells
  to(frameO, 0, B(3));
  to(normalO, 0.15, B(3), 0.8);
  to(condLbl, 0, B(3)); // fully hidden: colorize_depth takes over the depth label slot
  tl.tween(cam, { x: 300, y: 310, k: 1.7 }, { at: B(3), dur: 1.2, ease: ease.move });
  to(colorU, 1, B(3) + 1.4, 1.5, ease.move);
  to(colorLbl, 1, B(3) + 3.2);
  tl.hold(B(3) + 7, 0.8);

  // 4 — pool 4×4, pull back, cross the frozen-encoder boundary
  to(colorLbl, 0, B(4));
  to(normalO, 1, B(4), 0.8);
  tl.tween(cam, { x: 640, y: 320, k: 1.05 }, { at: B(4) + 1.4, dur: 1.4, ease: ease.move });
  to(poolU, 1, B(4) + 0.3, 1.3, ease.move);
  to(boundaryO, 1, B(4) + 1.8, 0.8);
  to(encU, 1, B(4) + 2.8, 1.4, ease.move);
  to(encLbl, 1, B(4) + 4.4);
  tl.hold(B(4) + 7, 0.8);

  // 5 — two tiles converge to their mean, through proj_in, plus e_geo
  to(encLbl, 0, B(5));
  to(boundaryO, 0.15, B(5));
  to(focusTiles, 1, B(5), 0.8);
  tl.tween(cam, { x: 840, y: 300, k: 1.55 }, { at: B(5), dur: 1.2, ease: ease.move });
  to(mergeU, 1, B(5) + 1.2, 1.3, ease.move);
  to(projO, 1, B(5) + 2.6, 0.6);
  to(embedU, 1, B(5) + 3.4, 1.0, ease.move);
  to(mergeLbl, 1, B(5) + 4.2);
  tl.hold(B(5) + 7, 0.8);

  // 6 — camera home; the full 28 and 390 grids emerge
  to(mergeLbl, 0, B(6));
  to(stageAO, 0, B(6), 1.0, ease.move);
  tl.tween(cam, CAMERA_HOME, { at: B(6), dur: 1.2, ease: ease.move });
  to(gridsU, 1, B(6) + 0.8, 2.2, ease.linear);
  to(gridLbl, 1, B(6) + 3.4);
  tl.hold(B(6) + 7, 0.8);

  // 7 — the coarse grid lays over the dense one; one cell center maps across
  tl.tween(cam, { x: 420, y: 320, k: 1.5 }, { at: B(7), dur: 1.2, ease: ease.move });
  to(overlayU, 1, B(7) + 0.4, 1.3, ease.move);
  to(focusU, 1, B(7) + 1.9, 0.8);
  to(posLbl, 1, B(7) + 3.0);
  tl.hold(B(7) + 7, 0.8);

  // 8 — frame-major ribbon [R_f, G_f]; sweep; only R cells clean up
  to(posLbl, 0, B(8));
  to(focusU, 0, B(8), 0.6);
  tl.tween(cam, CAMERA_HOME, { at: B(8), dur: 1.2, ease: ease.move });
  to(overlayU, 0, B(8), 1.2, ease.move);
  to(ribbonU, 1, B(8) + 1.2, 1.2, ease.draw);
  to(ribbonLbl, 1, B(8) + 2.2);
  to(sweepU, 1, B(8) + 2.8, 1.6, ease.linear);
  to(cleanU, 1, B(8) + 4.0, 1.4, ease.move);
  tl.hold(B(8) + 7, 0.8);

  // 9 — quiet payoff: the schematic frame with three cues; a tape grows
  to(ribbonLbl, 0, B(9));
  to(gridLbl, 0, B(9));
  to(ribbonO, 0, B(9), 0.8);
  to(geoO, 0.15, B(9), 0.8);
  to(cuesO, 1, B(9) + 1.2, 0.8);
  to(tapeU, 1, B(9) + 2.8, 2.0, ease.linear);
  tl.hold(B(9) + 7, 0.5); // ends at 72.0

  return {
    tl, cam, depthO, moveU, frameO, scopeLbl, normalO, condLbl, colorU, colorLbl, poolU, encU,
    boundaryO, encLbl, focusTiles, mergeU, projO, embedU, mergeLbl, stageAO, gridsU, gridLbl,
    overlayU, focusU, posLbl, ribbonU, ribbonLbl, sweepU, cleanU, geoO, ribbonO, cuesO, tapeU, chipO,
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

function Chip({ x, y = 88, text, o, color = MUTED }: { x: number; y?: number; text: string; o: number; color?: string }) {
  if (o <= 0) return null;
  const w = text.length * 6.7 + 18;
  return (
    <g opacity={o}>
      <rect x={x} y={y} width={w} height={24} rx={12} fill={PANEL} stroke={color} strokeOpacity={0.6} />
      <text x={x + w / 2} y={y + 16} fill={color} fontFamily={font.mono} fontSize={11} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

/** The toy field: cells gray→colorized, converge into 4×4 region means, then fly to latent tiles. */
function ToyField({ at, kind, o, moveU, colorU, poolU, encU }: {
  at: { x: number; y: number }; kind: 'd' | 'n'; o: number; moveU: number; colorU: number; poolU: number; encU: number;
}) {
  if (o <= 0) return null;
  const cells: ReactElement[] = [];
  for (let i = 0; i < ROWS; i++)
    for (let j = 0; j < COLS; j++) {
      const a = Math.floor(i / POOL);
      const b = Math.floor(j / POOL);
      const r = a * PC + b;
      let base: RGB;
      if (kind === 'd') {
        const d = lerp(DEPTH0[i][j], DEPTH1[i][j], moveU);
        base = mix(gray(d), colorizeRGB(depthU(d)), colorU);
      } else {
        base = NORMAL1[i][j];
      }
      const pooled = kind === 'd' ? POOLED_COLOR[a][b] : POOLED_NORMAL[a][b];
      const col = mix(base, pooled, poolU);
      // region center in the field
      const cx0 = at.x + j * CELL;
      const cy0 = at.y + i * CELL;
      const rcx = at.x + (b * POOL + POOL / 2) * CELL - LAT / 2;
      const rcy = at.y + (a * POOL + POOL / 2) * CELL - LAT / 2;
      const px = lerp(cx0, rcx, poolU);
      const py = lerp(cy0, rcy, poolU);
      const size = lerp(CELL - 1, LAT, poolU);
      const tile = latentTile(kind, r);
      const x = lerp(px, tile.x, encU);
      const y = lerp(py, tile.y, encU);
      // once encoded, the cells read as schematic latent tiles (hue by modality, shade by region)
      const latent: RGB = kind === 'd' ? [0.45 + 0.08 * r, 0.3, 0.75] : [0.15, 0.55 + 0.06 * r, 0.6];
      const fill = css(mix(col, latent, encU));
      // after pooling the 16 cells of a region coincide — draw only one of them past poolU
      const dup = poolU > 0.999 && (i % POOL !== 0 || j % POOL !== 0);
      if (dup) continue;
      cells.push(
        <rect key={`${i}-${j}`} x={x} y={y} width={size} height={size} rx={lerp(1.5, 6, encU)} fill={fill}
          stroke={encU > 0 ? (kind === 'd' ? SECONDARY : TEAL) : 'none'} strokeOpacity={0.8 * encU} />,
      );
    }
  return <g opacity={o}>{cells}</g>;
}

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>) => s.get(ch);
  const moveU = g(scene.moveU);
  const colorU = g(scene.colorU);
  const poolU = g(scene.poolU);
  const encU = g(scene.encU);
  const mergeU = g(scene.mergeU);
  const embedU = g(scene.embedU);
  const stageAO = g(scene.stageAO);
  const gridsU = g(scene.gridsU);
  const overlayU = g(scene.overlayU);
  const focusU = g(scene.focusU);
  const ribbonU = g(scene.ribbonU);
  const sweepU = g(scene.sweepU);
  const cleanU = g(scene.cleanU);
  const focusTiles = g(scene.focusTiles);
  const geoO = g(scene.geoO);
  const tapeU = g(scene.tapeU);

  // beat 1: the schematic frame's silhouette follows the depth silhouette
  const silX = FRAME_AT.x + FRAME_AT.w * ((5.0 + moveU + 0.5) / COLS);
  const silY = FRAME_AT.y + FRAME_AT.h * (4 / ROWS);

  // beat 5: the two converging tiles
  const dT = latentTile('d', MERGE_REGION);
  const nT = latentTile('n', MERGE_REGION);
  const dx = lerp(dT.x, MERGE_AT.x - LAT / 2, mergeU);
  const nx = lerp(nT.x, MERGE_AT.x - LAT / 2, mergeU);
  const my = lerp(dT.y, MERGE_AT.y - LAT / 2, mergeU);
  const dCol: RGB = [0.45 + 0.08 * MERGE_REGION, 0.3, 0.75];
  const nCol: RGB = [0.15, 0.55 + 0.06 * MERGE_REGION, 0.6];
  const meanCol = mix(dCol, nCol, 0.5);

  // beat 7: the geometry grid slides over the image grid
  const geoX = lerp(GEO_AT.x, IMG_AT.x, overlayU);
  const focusCx = IMG_AT.x + (FOCUS_POS.col + 0.5) * IMG_AT.cell;
  const focusCy = IMG_AT.y + (FOCUS_POS.row + 0.5) * IMG_AT.cell;

  // beat 8: sweep position across the ribbon and both grids
  const ribbonW = (N_IMG + N_GEO) * RIBBON.unit;
  const sweepX = RIBBON.x + ribbonW * sweepU;
  const sweepOn = sweepU > 0 && sweepU < 1;

  return (
    <g>
      <Camera {...g(scene.cam)}>
        {/* ------------------------------------------------ beats 1–5 */}
        {stageAO > 0 && (
          <g opacity={stageAO}>
            {/* schematic frame the renderer must produce (beat 1) */}
            {g(scene.frameO) > 0 && (
              <g opacity={g(scene.frameO)}>
                <rect x={FRAME_AT.x} y={FRAME_AT.y} width={FRAME_AT.w} height={FRAME_AT.h} rx={10} fill={PANEL}
                  stroke={MUTED} strokeOpacity={0.6} strokeDasharray="6 5" />
                <ellipse cx={silX} cy={silY} rx={FRAME_AT.w * (2.5 / COLS)} ry={FRAME_AT.h * (2.7 / ROWS)}
                  fill={POSITIVE} fillOpacity={0.18} stroke={POSITIVE} strokeOpacity={0.7} />
                <Note x={FRAME_AT.x + FRAME_AT.w / 2} y={FRAME_AT.y + FRAME_AT.h + 22} text="next visible frame — schematic, nothing decoded here"
                  size={12} anchor="middle" />
                <line x1={DEPTH_AT.x + COLS * CELL + 8} y1={300} x2={FRAME_AT.x - 10} y2={300} stroke={MUTED}
                  strokeOpacity={0.5} strokeDasharray="4 4" />
              </g>
            )}
            <g opacity={g(scene.scopeLbl)}>
              <Note x={DEPTH_AT.x} y={DEPTH_AT.y - 36} text="simulator decides the geometry" color={WARM} />
              <Note x={FRAME_AT.x} y={FRAME_AT.y - 36} text="renderer scope: geometry → frame" color={POSITIVE} />
              <Code x={DEPTH_AT.x} y={DEPTH_AT.y - 16} text="condition.depth" color={MUTED} size={12} />
            </g>

            {/* frozen encoder boundary (beat 4) */}
            {g(scene.boundaryO) > 0 && (
              <g opacity={g(scene.boundaryO)}>
                <line x1={BOUNDARY_X} y1={170} x2={BOUNDARY_X} y2={450} stroke={SECONDARY} strokeWidth={2} strokeDasharray="8 6" />
                <Code x={BOUNDARY_X} y={160} text="frozen video encoder · codec.encode" color={SECONDARY} size={12} anchor="middle" />
                <Note x={BOUNDARY_X} y={468} text="pixels → latent patches (schematic values)" size={11} anchor="middle" />
              </g>
            )}

            {/* the persistent depth field and its normal twin */}
            <g opacity={1 - 0.85 * focusTiles}>
              <ToyField at={DEPTH_AT} kind="d" o={g(scene.depthO)} moveU={moveU} colorU={colorU} poolU={poolU} encU={encU} />
              <ToyField at={NORMAL_AT} kind="n" o={g(scene.normalO)} moveU={moveU} colorU={1} poolU={poolU} encU={encU} />
            </g>
            {/* focused pair: re-drawn on top so it can converge (beat 5) */}
            {focusTiles > 0 && (
              <g opacity={focusTiles}>
                <rect x={dx} y={my} width={LAT} height={LAT} rx={6} fill={css(mix(dCol, meanCol, mergeU))} stroke={SECONDARY} strokeOpacity={0.9} />
                <rect x={nx} y={my} width={LAT} height={LAT} rx={6} fill={css(mix(nCol, meanCol, mergeU))} stroke={TEAL} strokeOpacity={0.9} />
                <Code x={dT.x + LAT / 2} y={dT.y - 8} text="D" o={1 - mergeU} color={SECONDARY} size={12} anchor="middle" />
                <Code x={nT.x + LAT / 2} y={nT.y - 8} text="N" o={1 - mergeU} color={TEAL} size={12} anchor="middle" />
                <Code x={MERGE_AT.x} y={MERGE_AT.y - LAT / 2 - 8} text="(D + N) / 2" o={clamp01(mergeU * 2 - 1)} color={TEXT} size={12} anchor="middle" />
                {/* proj_in box below, the mean falls through it */}
                <g opacity={g(scene.projO)}>
                  <rect x={MERGE_AT.x - 70} y={MERGE_AT.y + 48} width={140} height={34} rx={8} fill={PANEL} stroke={ACCENT} strokeOpacity={0.8} />
                  <Code x={MERGE_AT.x} y={MERGE_AT.y + 70} text="proj_in (shared)" color={ACCENT} size={12} anchor="middle" />
                  <line x1={MERGE_AT.x} y1={MERGE_AT.y + 26} x2={MERGE_AT.x} y2={MERGE_AT.y + 46} stroke={ACCENT} strokeOpacity={0.7} />
                </g>
                {/* geometry_modality_embed joins from the right */}
                {embedU > 0 && (
                  <g opacity={clamp01(embedU * 3)}>
                    <circle cx={lerp(MERGE_AT.x + 160, MERGE_AT.x + 86, embedU)} cy={MERGE_AT.y + 65} r={9} fill={PANEL} stroke={WARM} strokeWidth={2} />
                    <Code x={lerp(MERGE_AT.x + 160, MERGE_AT.x + 86, embedU)} y={MERGE_AT.y + 69} text="+" color={WARM} size={12} anchor="middle" />
                    <Code x={MERGE_AT.x + 104} y={MERGE_AT.y + 69} text="geometry_modality_embed" o={clamp01(embedU * 2 - 1)} color={WARM} size={11} />
                  </g>
                )}
                {/* the finished geometry token */}
                <g opacity={clamp01(embedU * 2 - 1)}>
                  <rect x={MERGE_AT.x - 18} y={MERGE_AT.y + 104} width={36} height={36} rx={6} fill={css(meanCol)} stroke={WARM} strokeWidth={2} />
                  <Code x={MERGE_AT.x + 30} y={MERGE_AT.y + 128} text="G — one geometry token" color={TEXT} size={12} />
                </g>
              </g>
            )}

            {/* condition chips (beat 2) */}
            <g opacity={g(scene.condLbl)}>
              <Code x={DEPTH_AT.x} y={DEPTH_AT.y - 16} text="condition.depth" color={ACCENT} size={12} />
              <Code x={NORMAL_AT.x} y={NORMAL_AT.y - 16} text="condition.normal" color={TEAL} size={12} />
              <Code x={DEPTH_AT.x} y={DEPTH_AT.y + ROWS * CELL + 26} text="Cosmos3Condition { text, depth, normal, fps }" color={MUTED} size={12} />
              <rect x={DEPTH_AT.x} y={DEPTH_AT.y + ROWS * CELL + 40} width={118} height={26} rx={6} fill={PANEL} stroke={MUTED} strokeOpacity={0.5} />
              <Code x={DEPTH_AT.x + 59} y={DEPTH_AT.y + ROWS * CELL + 57} text="text prompt" color={MUTED} size={11} anchor="middle" />
              <rect x={DEPTH_AT.x + 130} y={DEPTH_AT.y + ROWS * CELL + 40} width={196} height={26} rx={6} fill={PANEL} stroke={POSITIVE} strokeOpacity={0.6} />
              <Code x={DEPTH_AT.x + 228} y={DEPTH_AT.y + ROWS * CELL + 57} text="clean reference frame C0" color={POSITIVE} size={11} anchor="middle" />
              <Note x={DEPTH_AT.x + 340} y={DEPTH_AT.y + ROWS * CELL + 58} text="anchor appearance" size={11} />
            </g>

            {/* colorize_depth (beat 3) */}
            <g opacity={g(scene.colorLbl)}>
              <Code x={DEPTH_AT.x} y={DEPTH_AT.y - 16} text="colorize_depth(depth, scale)" color={WARM} size={12} />
              <MathLabel tex={'u(d) = 1 - \\left(1 + \\tfrac{d \\cdot \\text{scale}}{10}\\right)^{-2},\\quad \\text{scale}=1'} x={DEPTH_AT.x}
                y={DEPTH_AT.y + ROWS * CELL + 30} fontSize={15} color={TEXT} anchor="start" boxWidth={420} />
              {/* the fixed RGB-cube path, seven segments */}
              {Array.from({ length: 70 }, (_, k) => (
                <rect key={k} x={DEPTH_AT.x + k * 3.8} y={DEPTH_AT.y + ROWS * CELL + 58} width={3.8} height={12}
                  fill={css(colorizeRGB((k + 0.5) / 70))} />
              ))}
              <Note x={DEPTH_AT.x} y={DEPTH_AT.y + ROWS * CELL + 86} text="near: u→0 (black)" size={10} />
              <Note x={DEPTH_AT.x + 266} y={DEPTH_AT.y + ROWS * CELL + 86} text="far: u→1 (white)" size={10} anchor="end" />
            </g>

            {/* downsample / encode labels (beat 4) */}
            <g opacity={g(scene.encLbl)}>
              <Code x={DEPTH_AT.x} y={DEPTH_AT.y - 16} text="downsample_geometry · avg_pool2d(factor)" color={ACCENT} size={12} />
              <Note x={DEPTH_AT.x} y={DEPTH_AT.y + ROWS * CELL + 26} text="toy 4×4 pooling of the display field — not model latents" size={11} />
              <Code x={720} y={190} text="_encode_geometry → latent patches" color={SECONDARY} size={12} />
              <Code x={720} y={350} text="depth" color={SECONDARY} size={11} />
              <Code x={940} y={350} text="normal" color={TEAL} size={11} />
            </g>

            {/* beat 5 formula */}
            <g opacity={g(scene.mergeLbl)}>
              <MathLabel tex={'G = W_{\\text{in}}\\,\\tfrac{D + N}{2} + e_{\\text{geo}}'} x={MERGE_AT.x - 160} y={MERGE_AT.y - 100} fontSize={18} color={TEXT}
                anchor="start" boxWidth={360} />
              <Code x={MERGE_AT.x - 160} y={MERGE_AT.y - 70} text="proj_in(torch.lerp(depth, normal, 0.5)) + geometry_modality_embed" color={MUTED} size={10} />
              <Note x={MERGE_AT.x - 160} y={MERGE_AT.y - 54} text="illustrative tile values" size={10} />
            </g>
          </g>
        )}

        {/* ------------------------------------------------ beats 6–9: the real grids */}
        {gridsU > 0 && (
          <g>
            {/* image grid, 15×26 = 390 */}
            {Array.from({ length: IMG_GRID.rows }, (_, i) =>
              Array.from({ length: IMG_GRID.cols }, (_, j) => {
                const k = i * IMG_GRID.cols + j;
                const u = clamp01(gridsU * (N_IMG + N_GEO) * 1.15 - k);
                const x = IMG_AT.x + j * IMG_AT.cell;
                const y = IMG_AT.y + i * IMG_AT.cell;
                const near = focusU * clamp01(1 - Math.hypot(j - FOCUS_POS.col, i - FOCUS_POS.row) / 2.6);
                const hot = sweepOn ? clamp01(1 - Math.abs(sweepX - (RIBBON.x + k * RIBBON.unit)) / 40) : 0;
                const m = CLEAN_MASK[i][j];
                const base: RGB = [0.13, 0.2, 0.36];
                const cleanCol: RGB = m > 0 ? mix([0.1, 0.22, 0.2], [0.2, 0.83, 0.6], m) : [0.09, 0.12, 0.2];
                const fill = css(mix(base, cleanCol, cleanU));
                return (
                  <rect key={k} x={x + 0.5} y={y + 0.5} width={IMG_AT.cell - 1} height={IMG_AT.cell - 1} rx={1.5} fill={fill}
                    opacity={u * (focusU > 0 ? 0.3 + 0.7 * near : 1)} stroke={hot > 0 ? WARM : ACCENT}
                    strokeOpacity={hot > 0 ? hot : 0.35} />
                );
              }),
            )}
            {/* geometry grid, 4×7 = 28 — same extent, coarser cells */}
            <g opacity={geoO}>
              {Array.from({ length: GEO_GRID.rows }, (_, i) =>
                Array.from({ length: GEO_GRID.cols }, (_, j) => {
                  const k = N_IMG + i * GEO_GRID.cols + j;
                  const u = clamp01(gridsU * (N_IMG + N_GEO) * 1.15 - k);
                  const x = geoX + j * GEO_AT.cellW;
                  const y = GEO_AT.y + i * GEO_AT.cellH;
                  const isFocus = i === FOCUS_CELL.i && j === FOCUS_CELL.j;
                  const hot = sweepOn ? clamp01(1 - Math.abs(sweepX - (RIBBON.x + k * RIBBON.unit)) / 40) : 0;
                  const dim = focusU > 0 && !isFocus ? 0.25 : 1;
                  return (
                    <rect key={k} x={x + 1} y={y + 1} width={GEO_AT.cellW - 2} height={GEO_AT.cellH - 2} rx={4}
                      fill={SECONDARY} fillOpacity={lerp(0.28, 0.06, overlayU) * (isFocus && focusU > 0 ? 2 : 1)}
                      stroke={hot > 0 ? WARM : isFocus && focusU > 0 ? WARM : SECONDARY} strokeOpacity={hot > 0 ? 1 : 0.8}
                      strokeWidth={isFocus && focusU > 0 ? 2 : 1} opacity={u * dim} />
                  );
                }),
              )}
            </g>
            {/* focus: coarse center → dense coordinates (beat 7) */}
            {focusU > 0 && (
              <g opacity={focusU}>
                <circle cx={focusCx} cy={focusCy} r={6} fill={WARM} />
                <circle cx={focusCx} cy={focusCy} r={14} fill="none" stroke={WARM} strokeWidth={1.5} strokeDasharray="3 3" />
                <line x1={focusCx} y1={IMG_AT.y - 6} x2={focusCx} y2={IMG_AT.y + GRID_H + 6} stroke={WARM} strokeOpacity={0.45} />
                <line x1={IMG_AT.x - 6} y1={focusCy} x2={IMG_AT.x + GRID_W + 6} y2={focusCy} stroke={WARM} strokeOpacity={0.45} />
              </g>
            )}
            <g opacity={g(scene.posLbl)}>
              <Code x={IMG_AT.x} y={IMG_AT.y + GRID_H + 36} text="_grid_positions(temporal, grid, rgb_grid)" color={WARM} size={12} />
              <MathLabel tex={`\\text{row} = (i+\\tfrac12)\\tfrac{${IMG_GRID.rows}}{${GEO_GRID.rows}} - \\tfrac12 = ${FOCUS_POS.row}\\qquad \\text{col} = (j+\\tfrac12)\\tfrac{${IMG_GRID.cols}}{${GEO_GRID.cols}} - \\tfrac12 = ${FOCUS_POS.col}`}
                x={IMG_AT.x} y={IMG_AT.y + GRID_H + 54} fontSize={14} color={TEXT} anchor="start" boxWidth={520} />
              <Note x={IMG_AT.x} y={IMG_AT.y + GRID_H + 86} text={`coarse cell (${FOCUS_CELL.i}, ${FOCUS_CELL.j}) · same temporal coordinate as the image tokens of its frame`} size={11} />
            </g>

            {/* grid labels + braces (beat 6) */}
            <g opacity={g(scene.gridLbl)}>
              <Brace x0={IMG_AT.x} x1={IMG_AT.x + GRID_W} y={IMG_AT.y + GRID_H + 8} below u={1} color={ACCENT}
                label={`${N_IMG} image tokens · ${IMG_GRID.rows}×${IMG_GRID.cols}`} fontSize={13} opacity={1 - overlayU} />
              <Brace x0={geoX} x1={geoX + GRID_W} y={IMG_AT.y + GRID_H + 8} below u={1} color={SECONDARY}
                label={`${N_GEO} geometry tokens · ${GEO_GRID.rows}×${GEO_GRID.cols}`} fontSize={13} opacity={(1 - overlayU) * geoO} />
              {/* separate labels while the grids sit apart; one alignment label once they coincide */}
              <Code x={IMG_AT.x} y={IMG_AT.y - 14} text="rgb_tokens — noisy image latents" color={ACCENT} size={12} o={(1 - cleanU) * (1 - overlayU)} />
              <Code x={geoX} y={IMG_AT.y - 14} text="geometry tokens" color={SECONDARY} size={12} o={geoO * (1 - overlayU)} />
              <Code x={IMG_AT.x} y={IMG_AT.y - 14} text="geometry tokens laid over rgb_tokens — same image extent" color={SECONDARY} size={12} o={overlayU} />
              <Note x={640} y={150} text="at 480×832 output · per latent frame · actual counts, illustrative values" size={12} anchor="middle" o={1 - overlayU} />
            </g>

            {/* frame-major ribbon [R_f, G_f] (beat 8) */}
            {ribbonU > 0 && (
              <g opacity={g(scene.ribbonO)}>
                <rect x={RIBBON.x} y={RIBBON.y} width={N_IMG * RIBBON.unit * ribbonU} height={RIBBON.h} rx={4} fill={ACCENT} fillOpacity={0.3} stroke={ACCENT} />
                <rect x={RIBBON.x + N_IMG * RIBBON.unit} y={RIBBON.y} width={N_GEO * RIBBON.unit * ribbonU} height={RIBBON.h} rx={4}
                  fill={SECONDARY} fillOpacity={0.4} stroke={SECONDARY} />
                {sweepOn && <rect x={sweepX - 10} y={RIBBON.y - 6} width={20} height={RIBBON.h + 12} rx={4} fill={WARM} fillOpacity={0.45} />}
                <g opacity={g(scene.ribbonLbl)}>
                  <Code x={RIBBON.x} y={RIBBON.y - 10} text="GeometryFrames.chunk → frame-major [R_f, G_f]" color={TEXT} size={12} />
                  <Code x={RIBBON.x + (N_IMG * RIBBON.unit) / 2} y={RIBBON.y + RIBBON.h + 18} text={`R_f · ${N_IMG}`} color={ACCENT} size={11} anchor="middle" />
                  <Code x={RIBBON.x + (N_IMG + N_GEO / 2) * RIBBON.unit} y={RIBBON.y + RIBBON.h + 18} text={`G_f · ${N_GEO}`} color={SECONDARY} size={11} anchor="middle" />
                  <Note x={RIBBON.x + ribbonW + 16} y={RIBBON.y + 12} text="read together by every layer" size={11} />
                  <Code x={RIBBON.x + ribbonW + 16} y={RIBBON.y + 28} text="rgb_tokens(hidden) → decode_velocity" color={POSITIVE} size={11} o={cleanU} />
                </g>
              </g>
            )}
            <Code x={IMG_AT.x} y={IMG_AT.y - 14} text="velocity → cleaner frame (schematic)" color={POSITIVE} size={12} o={cleanU * (1 - g(scene.cuesO))} />

            {/* beat 9: three cues + the tape toward chapter 2 */}
            {g(scene.cuesO) > 0 && (
              <g opacity={g(scene.cuesO)}>
                <Note x={IMG_AT.x + GRID_W / 2} y={IMG_AT.y - 16} text="the frame" color={TEXT} size={14} anchor="middle" />
                <g>
                  <rect x={530} y={200} width={220} height={30} rx={8} fill={PANEL} stroke={SECONDARY} strokeOpacity={0.7} />
                  <Code x={640} y={220} text="geometry → what is depicted" color={SECONDARY} size={11} anchor="middle" />
                  <rect x={530} y={246} width={220} height={30} rx={8} fill={PANEL} stroke={POSITIVE} strokeOpacity={0.7} />
                  <Code x={640} y={266} text="reference C0 → appearance" color={POSITIVE} size={11} anchor="middle" />
                  <rect x={530} y={292} width={220} height={30} rx={8} fill={PANEL} stroke={MUTED} strokeOpacity={0.7} />
                  <Code x={640} y={312} text="text → appearance" color={MUTED} size={11} anchor="middle" />
                </g>
                <Note x={TAPE.x} y={TAPE.y - 12} text="next: remembering earlier frames" color={WARM} size={12} />
              </g>
            )}
            {tapeU > 0 &&
              Array.from({ length: TAPE.n }, (_, k) => {
                const u = clamp01(tapeU * TAPE.n - k);
                return (
                  <rect key={k} x={TAPE.x + k * TAPE.dx} y={TAPE.y} width={TAPE.w * u} height={TAPE.h} rx={4} fill={PANEL}
                    stroke={k === 0 ? POSITIVE : WARM} strokeOpacity={0.8} opacity={u} />
                );
              })}
          </g>
        )}
      </Camera>

      {/* HUD — outside the camera transform */}
      <text x={48} y={64} fill={TEXT} fontFamily={font.ui} fontSize={24} fontWeight={600}>Geometry becomes tokens</text>
      <Chip x={48} text="Illustrative values; no model inference" o={g(scene.chipO)} color={WARM} />
      <Chip x={330} text="released renderer only · 06bb462" o={g(scene.chipO)} color={MUTED} />
    </g>
  );
}

export const vizScene = () => scene;
