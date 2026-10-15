// Speaking in Coordinates — chapter 1: The thousand-step ruler
//
// Source evidence (github.com/groundingpi/GroundingPI @ 0047d4510e201fecfd77126f6036088638aa85d2):
//   grounding_pi/protocol.py L7-L41   — grammar docstring; GRID_SIZE = 1000, GRID_MAX = 999;
//     OBJECT_REF_START/END, BOX_START/END, NEGATIVE_PAYLOAD = "None";
//     COORDINATE_TOKENS = tuple(f"<{value}>" for value in range(GRID_SIZE))
//   grounding_pi/protocol.py L121-L136 — TaskType.BBOX / TaskType.POINT; arity 4 / 2
//   grounding_pi/protocol.py L265-L295 — _validate_scalar (0 ≤ q ≤ 999), _validate_tuple (x1 < x2, y1 < y2)
//   train/tokenizer/extend_tokens.py L135-L166 — the 1000 coordinate tokens (+ </c>) are appended as
//     additional special tokens: one vocabulary id per coordinate (added == 1001)
//   README.md L229-L259 — referring-box prompt "the red car", integer grid 0..999, example answers
//   paper §3.1 (arXiv 2609.39601) — one shared coordinate vocabulary for points, boxes and labels (P1)
//
// Exact canonical response (unbroken; on stage it is shown as a phrase row and a payload row, and the
// marker labels are wrapped onto two lines for presentation only):
//   <|object_ref_start|>the red car<|object_ref_end|><|box_start|><100><200><500><650><|box_end|>
// Negative illustration (no yellow car in the picture):
//   <|object_ref_start|>the yellow car<|object_ref_end|><|box_start|>None<|box_end|>
//
// The picture, both cars, the point (300, 425) and the box (100, 200, 500, 650) are ILLUSTRATIVE,
// derived from the README usage phrase. They are not a recorded inference or a benchmark sample.
import type { ReactNode } from 'react';
// Standalone blog sections mount this scene without ChapterPlayer's math stylesheet.
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

// ---------------------------------------------------------------------------
// Protocol facts (mirrors protocol.py; asserted at module scope)
// ---------------------------------------------------------------------------
const GRID_SIZE = 1000;
const GRID_MAX = GRID_SIZE - 1;
const OBJECT_REF_START = '<|object_ref_start|>';
const OBJECT_REF_END = '<|object_ref_end|>';
const BOX_START = '<|box_start|>';
const BOX_END = '<|box_end|>';
const NEGATIVE_PAYLOAD = 'None';
const PHRASE = 'the red car';
const ALT_PHRASE = 'the yellow car';
const RED_BOX = [100, 200, 500, 650] as const; // (x1, y1, x2, y2) on the 0..999 grid
const POINT = [300, 425] as const; // (x, y) on the 0..999 grid

const coordToken = (v: number): string => {
  if (!Number.isInteger(v) || v < 0 || v > GRID_MAX) throw new Error(`coordinate ${v} is outside the inclusive grid [0, ${GRID_MAX}]`);
  return `<${v}>`;
};
const CANONICAL = `${OBJECT_REF_START}${PHRASE}${OBJECT_REF_END}${BOX_START}${RED_BOX.map(coordToken).join('')}${BOX_END}`;
if (CANONICAL !== '<|object_ref_start|>the red car<|object_ref_end|><|box_start|><100><200><500><650><|box_end|>') {
  throw new Error('canonical bbox serialization drifted from protocol.py');
}
const NEGATIVE = `${OBJECT_REF_START}${ALT_PHRASE}${OBJECT_REF_END}${BOX_START}${NEGATIVE_PAYLOAD}${BOX_END}`;
if (NEGATIVE !== '<|object_ref_start|>the yellow car<|object_ref_end|><|box_start|>None<|box_end|>') {
  throw new Error('negative serialization drifted from protocol.py');
}

// ---------------------------------------------------------------------------
// Illustrative picture: W = 1000, H = 600, mapped with the client.py visualize() formula
//   pixel = q / 999 * (W − 1 | H − 1)
// ---------------------------------------------------------------------------
const IMG_W = 1000;
const IMG_H = 600;
const IMG = { x: 130, y: 130, w: 500, h: 300 } as const;
const gridToPx = (q: number, axis: 'x' | 'y'): number => (q / GRID_MAX) * ((axis === 'x' ? IMG_W : IMG_H) - 1);
const gx = (q: number): number => IMG.x + (gridToPx(q, 'x') / IMG_W) * IMG.w;
const gy = (q: number): number => IMG.y + (gridToPx(q, 'y') / IMG_H) * IMG.h;
// sanity: the plan's pixel bounds (100, 119.9199, 500, 389.7397) and point (300, 254.8298)
const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-3;
if (!near(gridToPx(RED_BOX[0], 'x'), 100) || !near(gridToPx(RED_BOX[1], 'y'), 119.9199) || !near(gridToPx(RED_BOX[2], 'x'), 500) || !near(gridToPx(RED_BOX[3], 'y'), 389.7397)) {
  throw new Error('pixel mapping drifted from client.py visualize()');
}
if (!near(gridToPx(POINT[0], 'x'), 300) || !near(gridToPx(POINT[1], 'y'), 254.8298)) throw new Error('point pixel mapping drifted');

const BLUE_BOX = [620, 420, 930, 800] as const; // the muted blue car — never serialized, never the target
const RED_STAGE = { x1: gx(RED_BOX[0]), y1: gy(RED_BOX[1]), x2: gx(RED_BOX[2]), y2: gy(RED_BOX[3]) } as const;
const BLUE_STAGE = { x1: gx(BLUE_BOX[0]), y1: gy(BLUE_BOX[1]), x2: gx(BLUE_BOX[2]), y2: gy(BLUE_BOX[3]) } as const;
const POINT_STAGE = { x: gx(POINT[0]), y: gy(POINT[1]) } as const;
const CROSS_START = { x: 780, y: 170 } as const; // grid coords: empty sky, right of the red car

// ---------------------------------------------------------------------------
// Tiny pure kit (local; no shared edits)
// ---------------------------------------------------------------------------
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const INK = {
  phrase: colors.SECONDARY,
  marker: colors.TEAL,
  coord: colors.WARM,
  box: colors.ACCENT,
  car: '#e0484f',
  carDark: '#8f1f27',
  glass: '#9fd3ff',
  blue: '#3b5f8f',
  blueDark: '#243a5a',
  yellow: '#fde047',
  sky: '#162440',
  ground: '#262d3b',
  text: colors.TEXT,
  muted: colors.MUTED,
  faint: colors.ink.faint,
  panel: colors.PANEL,
  bg: colors.BG,
} as const;

function Txt({ x, y, children, size = 18, fill = INK.text, opacity = 1, anchor = 'start', mono = false, weight = 400 }: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string; opacity?: number;
  anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number;
}) {
  if (opacity <= 0.003) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={fill} opacity={opacity} textAnchor={anchor} fontWeight={weight} fontFamily={mono ? MONO : UI}>
      {children}
    </text>
  );
}

const monoW = (text: string, size: number): number => text.length * size * 0.62;

function Chip({ x, y, text, color, opacity = 1, size = 20 }: { x: number; y: number; text: string; color: string; opacity?: number; size?: number }) {
  if (opacity <= 0.003) return null;
  const w = monoW(text, size) + 28;
  const h = size + 16;
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={INK.panel} stroke={color} strokeWidth={1.6} />
      <text x={x} y={y + size * 0.36} fontSize={size} textAnchor="middle" fill={color} fontFamily={MONO}>{text}</text>
    </g>
  );
}

/** One token cell: a rounded box with one (24px coordinate) or two (18px marker) mono lines. */
function TapeCell({ x, y, w, h, lines, color, opacity = 1, ghost = false, glow = 0, size }: {
  x: number; y: number; w: number; h: number; lines: readonly string[]; color: string; opacity?: number; ghost?: boolean; glow?: number; size?: number;
}) {
  if (opacity <= 0.003) return null;
  const fs = size ?? (lines.length > 1 ? 18 : 24);
  return (
    <g opacity={opacity}>
      {glow > 0 && <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={12} fill="none" stroke={color} strokeWidth={3} opacity={glow} />}
      <rect x={x} y={y} width={w} height={h} rx={8} fill={ghost ? 'none' : INK.panel} stroke={color} strokeWidth={ghost ? 1.2 : 1.8} strokeDasharray={ghost ? '5 5' : undefined} opacity={ghost ? 0.55 : 1} />
      {!ghost && lines.length === 1 && (
        <text x={x + w / 2} y={y + h / 2 + fs * 0.36} fontSize={fs} textAnchor="middle" fill={color} fontFamily={MONO}>{lines[0]}</text>
      )}
      {!ghost && lines.length === 2 && (
        <>
          <text x={x + w / 2} y={y + h / 2 - 2} fontSize={fs} textAnchor="middle" fill={color} fontFamily={MONO}>{lines[0]}</text>
          <text x={x + w / 2} y={y + h / 2 + fs} fontSize={fs} textAnchor="middle" fill={color} fontFamily={MONO}>{lines[1]}</text>
        </>
      )}
    </g>
  );
}

/** A side-view car that fills its stage rectangle exactly (so the bbox is honest). */
function Car({ x1, y1, x2, y2, body, dark, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; body: string; dark: string; opacity?: number }) {
  const w = x2 - x1;
  const h = y2 - y1;
  const bodyY = y1 + h * 0.42;
  const r = h * 0.15;
  return (
    <g opacity={opacity}>
      <polygon points={`${x1 + w * 0.2},${bodyY + 2} ${x1 + w * 0.32},${y1 + h * 0.04} ${x1 + w * 0.7},${y1 + h * 0.04} ${x1 + w * 0.86},${bodyY + 2}`} fill={dark} />
      <polygon points={`${x1 + w * 0.26},${bodyY} ${x1 + w * 0.345},${y1 + h * 0.12} ${x1 + w * 0.49},${y1 + h * 0.12} ${x1 + w * 0.49},${bodyY}`} fill={INK.glass} opacity={0.8} />
      <polygon points={`${x1 + w * 0.53},${y1 + h * 0.12} ${x1 + w * 0.68},${y1 + h * 0.12} ${x1 + w * 0.78},${bodyY} ${x1 + w * 0.53},${bodyY}`} fill={INK.glass} opacity={0.8} />
      <rect x={x1} y={bodyY} width={w} height={h * 0.38} rx={h * 0.08} fill={body} />
      <rect x={x1 + w * 0.02} y={y1 + h * 0.58} width={w * 0.96} height={h * 0.05} fill={dark} opacity={0.5} />
      <circle cx={x1 + w * 0.24} cy={y2 - r} r={r} fill="#0b0f18" stroke="#6b7280" strokeWidth={2} />
      <circle cx={x1 + w * 0.76} cy={y2 - r} r={r} fill="#0b0f18" stroke="#6b7280" strokeWidth={2} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Tape layout — phrase row above payload row, left-aligned (presentation of CANONICAL)
// ---------------------------------------------------------------------------
type Cls = 'marker' | 'phrase' | 'coord' | 'none';
interface CellSpec { key: string; lines: readonly string[]; w: number; cls: Cls }
interface Cell extends CellSpec { x: number }
const TAPE_X = 640;
const CELL_H = 48;
const GAP = 8;
const PHRASE_Y = 196;
const PAYLOAD_Y = 268;
const layoutRow = (specs: readonly CellSpec[], x0: number): Cell[] => {
  let x = x0;
  return specs.map((c) => {
    const cell = { ...c, x };
    x += c.w + GAP;
    return cell;
  });
};
const PHRASE_CELLS = layoutRow([
  { key: 'ref_start', lines: ['<|object_ref_', 'start|>'], w: 152, cls: 'marker' },
  { key: 'phrase', lines: [PHRASE], w: 160, cls: 'phrase' },
  { key: 'ref_end', lines: ['<|object_ref_', 'end|>'], w: 152, cls: 'marker' },
], TAPE_X);
const PAYLOAD_CELLS = layoutRow([
  { key: 'box_start', lines: ['<|box_', 'start|>'], w: 96, cls: 'marker' },
  { key: 'c0', lines: [coordToken(RED_BOX[0])], w: 84, cls: 'coord' },
  { key: 'c1', lines: [coordToken(RED_BOX[1])], w: 84, cls: 'coord' },
  { key: 'c2', lines: [coordToken(RED_BOX[2])], w: 84, cls: 'coord' },
  { key: 'c3', lines: [coordToken(RED_BOX[3])], w: 84, cls: 'coord' },
  { key: 'box_end', lines: ['<|box_', 'end|>'], w: 96, cls: 'marker' },
], TAPE_X);
const COORD_CELLS = PAYLOAD_CELLS.slice(1, 5);
const POINT_TOKENS = POINT.map(coordToken); // ['<300>', '<425>'] — occupy the first two coordinate slots
const CLS_COLOR: Record<Cls, string> = { marker: INK.marker, phrase: INK.phrase, coord: INK.coord, none: INK.text };

// the alternate (negative) tape — appears below the dimmed red-car tape
const ALT_PHRASE_Y = 392;
const ALT_PAYLOAD_Y = 452;
const ALT_PHRASE_CELLS = layoutRow([
  { key: 'ref_start', lines: ['<|object_ref_', 'start|>'], w: 152, cls: 'marker' },
  { key: 'phrase', lines: [ALT_PHRASE], w: 196, cls: 'phrase' },
  { key: 'ref_end', lines: ['<|object_ref_', 'end|>'], w: 152, cls: 'marker' },
], TAPE_X);
const ALT_PAYLOAD_CELLS = layoutRow([
  { key: 'box_start', lines: ['<|box_', 'start|>'], w: 96, cls: 'marker' },
  { key: 'none', lines: [NEGATIVE_PAYLOAD], w: 96, cls: 'none' },
  { key: 'box_end', lines: ['<|box_', 'end|>'], w: 96, cls: 'marker' },
], TAPE_X);

const CHIP_HOME = { x: 730, y: 150 } as const; // the phrase chip before it joins the tape
const PHRASE_CELL = PHRASE_CELLS[1];
const CHIP_TAPE = { x: PHRASE_CELL.x + PHRASE_CELL.w / 2, y: PHRASE_Y + CELL_H / 2 } as const;

const RULER_TICKS = [0, 250, 500, 750, 999] as const;
const MAG = { x: 130, y: 466, w: 230, h: 92 } as const; // magnified ruler segment 498..502
const MAG_TICKS = [498, 499, 500, 501, 502] as const;

const CAPTIONS = [
  { at: 0.4, text: 'Finding the red car means choosing both an object and a place in the image.' },
  { at: 7.5, text: 'The grounding model describes that place with a shared vocabulary of coordinate tokens.' },
  { at: 14.6, text: 'Each axis uses one thousand positions, numbered from zero through nine hundred ninety-nine.' },
  { at: 21.7, text: 'A point needs two coordinates: one across the image, and one down.' },
  { at: 28.8, text: 'A bounding box needs four coordinates, marking its top-left and bottom-right corners.' },
  { at: 35.9, text: 'These numbers are atomic tokens, so each coordinate takes one place in the output sequence.' },
  { at: 43.0, text: 'The phrase and its coordinates travel together, wrapped in explicit boundary markers.' },
  { at: 50.1, text: 'When the requested target is absent, the same format carries the word none instead of coordinates.' },
  { at: 57.2, text: 'Points and boxes reuse the vocabulary, while the chosen task tells the parser how many coordinates to expect.' },
  { at: 64.3, text: 'A location has become a short, structured sequence that a language model can learn to generate.' },
] as const;
const CAPTION_DUR = 6.4;
const TOTAL = 73.0;

// read-only source overlays (top-right), one per beat, ≤ 2 short lines
const NOTES: ReadonlyArray<readonly [string, string]> = [
  ['README.md · Referring boxes', 'illustrative picture · not an inference'],
  ['grounding_pi/protocol.py', 'COORDINATE_TOKENS = ("<0>", …, "<999>")'],
  ['grounding_pi/protocol.py', 'GRID_SIZE = 1000 · GRID_MAX = 999'],
  ['protocol.py · TaskType.POINT', 'tuple := coord coord'],
  ['protocol.py · TaskType.BBOX', 'tuple := coord coord coord coord'],
  ['train/tokenizer/extend_tokens.py', 'one special-token id per coordinate'],
  ['protocol.py · serialize_answer', 'REF_START phrase REF_END BOX_START … BOX_END'],
  ['grounding_pi/protocol.py', 'NEGATIVE_PAYLOAD = "None"'],
  ['protocol.py · TaskType.arity', '4 if self is TaskType.BBOX else 2'],
  ['paper §3.1 · arXiv 2609.39601', 'one shared coordinate vocabulary'],
];

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  CAPTIONS.forEach((c, i) => {
    tl.caption({ at: c.at, dur: CAPTION_DUR, text: c.text });
    if (i > 0) tl.tween(beat, i, { at: c.at, dur: 0.4, ease: ease.enter });
  });

  const imgU = tl.channel('imgU', 0); // picture draw-on
  const chipU = tl.channel('chipU', 0); // phrase chip
  const crossU = tl.channel('crossU', 0); // crosshair
  const crossX = tl.channel('crossX', CROSS_START.x); // grid coords
  const crossY = tl.channel('crossY', CROSS_START.y);
  const liftU = tl.channel('liftU', 0); // crosshair ghost lifts into the first tape slot
  const slotsU = tl.channel('slotsU', 0); // empty tape slots
  const rulerU = tl.channel('rulerU', 0); // rulers draw-on
  const tickU = tl.channel('tickU', 0); // ruler labels
  const magU = tl.channel('magU', 0); // magnified ruler segment
  const projU = tl.channel('projU', 0); // crosshair → rulers projection
  const pointU = tl.channel('pointU', 0); // 0..2 point cells plucked
  const pointO = tl.channel('pointO', 1);
  const texPointU = tl.channel('texPointU', 0);
  const cornerU = tl.channel('cornerU', 0); // crosshair splits into two corners
  const boxU = tl.channel('boxU', 0); // 0..4 box cells plucked
  const rectU = tl.channel('rectU', 0); // rectangle draw-on
  const texBoxU = tl.channel('texBoxU', 0);
  const imgO = tl.channel('imgO', 1); // picture opacity during the token zoom
  const atomU = tl.channel('atomU', 0); // COORDINATE_TOKENS spotlight
  const wrapU = tl.channel('wrapU', 0); // chip joins the phrase row
  const markU = tl.channel('markU', 0); // 0..4 boundary markers enter
  const mainO = tl.channel('mainO', 1); // red-car tape dims behind the negative example
  const altU = tl.channel('altU', 0); // yellow-car query
  const altScan = tl.channel('altScan', 0); // yellow crosshair sweep (finds nothing)
  const combP = tl.channel('combP', 0); // TaskType.POINT comb
  const combB = tl.channel('combB', 0); // TaskType.BBOX comb
  const closeU = tl.channel('closeU', 0); // machinery fades to 0.10
  const labelU = tl.channel('labelU', 0); // closing label

  // BEAT 0 — picture, phrase, crosshair finds the red car; camera leans in
  tl.tween(imgU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(chipU, 1, { at: 2.0, dur: 0.6, ease: ease.enter });
  tl.tween(crossU, 1, { at: 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(crossX, POINT[0], { at: 3.4, dur: 1.2, ease: ease.move });
  tl.tween(crossY, POINT[1], { at: 3.4, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 380, y: 290, k: 1.3 }, { at: 3.6, dur: 1.3, ease: ease.move });

  // BEAT 1 — the crosshair lifts into the start of a tape; rulers grow
  tl.tween(cam, CAMERA_HOME, { at: 7.7, dur: 1.3, ease: ease.move });
  tl.tween(liftU, 1, { at: 8.4, dur: 1.2, ease: ease.move });
  tl.tween(slotsU, 1, { at: 9.2, dur: 0.8, ease: ease.enter });
  tl.tween(rulerU, 1, { at: 10.0, dur: 1.4, ease: ease.draw });

  // BEAT 2 — 0 … 999, with a magnified segment showing discrete ticks
  tl.tween(tickU, 1, { at: 15.0, dur: 0.8, ease: ease.enter });
  tl.tween(magU, 1, { at: 16.0, dur: 0.8, ease: ease.enter });

  // BEAT 3 — project onto both rulers; pluck <300> and <425>
  tl.tween(projU, 1, { at: 22.1, dur: 1.0, ease: ease.draw });
  tl.tween(pointU, 2, { at: 23.3, dur: 1.6, ease: ease.linear });
  tl.tween(texPointU, 1, { at: 25.2, dur: 0.6, ease: ease.enter });

  // BEAT 4 — the crosshair splits into two corners; four cells; the rectangle
  tl.tween(magU, 0, { at: 28.8, dur: 0.6, ease: ease.enter });
  tl.tween(projU, 0, { at: 29.0, dur: 0.5, ease: ease.enter });
  tl.tween(cornerU, 1, { at: 29.3, dur: 1.2, ease: ease.move });
  tl.tween(pointO, 0, { at: 29.6, dur: 0.6, ease: ease.enter });
  tl.tween(texPointU, 0, { at: 29.6, dur: 0.5, ease: ease.enter });
  tl.tween(boxU, 4, { at: 30.4, dur: 2.0, ease: ease.linear });
  tl.tween(rectU, 1, { at: 32.4, dur: 1.3, ease: ease.draw });
  tl.tween(texBoxU, 1, { at: 33.2, dur: 0.6, ease: ease.enter });

  // BEAT 5 — push into <500>: one token, three digits
  tl.tween(imgO, 0.35, { at: 36.0, dur: 0.8, ease: ease.enter });
  tl.tween(texBoxU, 0, { at: 36.0, dur: 0.5, ease: ease.enter });
  tl.tween(cam, { x: 820, y: 320, k: 1.6 }, { at: 36.2, dur: 1.4, ease: ease.move });
  tl.tween(atomU, 1, { at: 37.7, dur: 0.6, ease: ease.enter });

  // BEAT 6 — pull back; the phrase joins the tape; boundary markers bracket both rows
  tl.tween(cam, CAMERA_HOME, { at: 43.0, dur: 1.3, ease: ease.move });
  tl.tween(imgO, 1, { at: 43.2, dur: 0.8, ease: ease.enter });
  tl.tween(atomU, 0, { at: 43.2, dur: 0.5, ease: ease.enter });
  tl.tween(wrapU, 1, { at: 43.8, dur: 1.2, ease: ease.move });
  tl.tween(markU, 4, { at: 45.0, dur: 1.6, ease: ease.linear });

  // BEAT 7 — the yellow car: a sweep that finds nothing, and the word None
  tl.tween(mainO, 0.25, { at: 50.3, dur: 0.6, ease: ease.enter });
  tl.tween(altU, 1, { at: 50.6, dur: 0.8, ease: ease.enter });
  // the sweep finishes (and None lands) by 52.8, well inside the 50.1–56.5 caption that speaks it
  tl.tween(altScan, 1, { at: 51.2, dur: 1.6, ease: ease.linear });

  // BEAT 8 — two-slot and four-slot combs under the same ribbon
  tl.tween(altU, 0, { at: 57.2, dur: 0.6, ease: ease.enter });
  tl.tween(mainO, 1, { at: 57.6, dur: 0.6, ease: ease.enter });
  tl.tween(combP, 1, { at: 58.2, dur: 1.0, ease: ease.enter });
  tl.tween(combB, 1, { at: 60.8, dur: 1.0, ease: ease.enter });

  // BEAT 9 — quiet: picture + four coordinate cells; machinery whispers at 0.10
  tl.tween(closeU, 1, { at: 64.6, dur: 1.2, ease: ease.move });
  tl.tween(labelU, 1, { at: 66.0, dur: 0.8, ease: ease.enter });
  tl.hold(TOTAL - 1, 1);

  return {
    tl, cam, beat, imgU, chipU, crossU, crossX, crossY, liftU, slotsU, rulerU, tickU, magU, projU, pointU, pointO, texPointU,
    cornerU, boxU, rectU, texBoxU, imgO, atomU, wrapU, markU, mainO, altU, altScan, combP, combB, closeU, labelU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render pieces
// ---------------------------------------------------------------------------
function Picture({ u, opacity }: { u: number; opacity: number }) {
  if (u <= 0.003 || opacity <= 0.003) return null;
  const horizon = IMG.y + IMG.h * 0.72;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id="gpi-ch1-picture">
          <rect x={IMG.x} y={IMG.y} width={IMG.w * u} height={IMG.h} rx={6} />
        </clipPath>
      </defs>
      <g clipPath="url(#gpi-ch1-picture)">
        <rect x={IMG.x} y={IMG.y} width={IMG.w} height={IMG.h} fill={INK.sky} />
        <rect x={IMG.x} y={horizon} width={IMG.w} height={IMG.y + IMG.h - horizon} fill={INK.ground} />
        <line x1={IMG.x} y1={horizon} x2={IMG.x + IMG.w} y2={horizon} stroke="#3a4356" strokeWidth={1.5} />
        <line x1={IMG.x + 20} y1={IMG.y + IMG.h - 22} x2={IMG.x + IMG.w - 20} y2={IMG.y + IMG.h - 22} stroke="#4b5366" strokeWidth={3} strokeDasharray="26 22" />
        <Car {...BLUE_STAGE} body={INK.blue} dark={INK.blueDark} opacity={0.85} />
        <Car {...RED_STAGE} body={INK.car} dark={INK.carDark} />
      </g>
      <rect x={IMG.x} y={IMG.y} width={IMG.w} height={IMG.h} rx={6} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
    </g>
  );
}

function Rulers({ u, tick, opacity }: { u: number; tick: number; opacity: number }) {
  if (u <= 0.003 || opacity <= 0.003) return null;
  const topY = IMG.y - 10;
  const leftX = IMG.x - 10;
  return (
    <g opacity={opacity}>
      <line x1={IMG.x} y1={topY} x2={IMG.x + IMG.w * u} y2={topY} stroke={INK.muted} strokeWidth={1.5} />
      <line x1={leftX} y1={IMG.y} x2={leftX} y2={IMG.y + IMG.h * u} stroke={INK.muted} strokeWidth={1.5} />
      {RULER_TICKS.map((q) => {
        // at full draw every tick is on; without this the 999 tick (q / GRID_MAX = 1) stayed at 20% and read as a ghost
        const on = u >= 0.999 ? 1 : clamp01((u - q / GRID_MAX) * 8 + 0.2);
        return (
          <g key={q} opacity={on}>
            <line x1={gx(q)} y1={topY - 8} x2={gx(q)} y2={topY} stroke={INK.muted} strokeWidth={1.5} />
            <line x1={leftX - 8} y1={gy(q)} x2={leftX} y2={gy(q)} stroke={INK.muted} strokeWidth={1.5} />
            <Txt x={gx(q)} y={topY - 14} size={18} fill={INK.coord} anchor="middle" mono opacity={tick}>{q}</Txt>
            <Txt x={leftX - 14} y={gy(q) + 6} size={18} fill={INK.coord} anchor="end" mono opacity={tick}>{q}</Txt>
          </g>
        );
      })}
    </g>
  );
}

function Magnifier({ u }: { u: number }) {
  if (u <= 0.003) return null;
  const leftX = IMG.x - 10;
  const lineY = MAG.y + 58;
  return (
    <g opacity={u}>
      <rect x={leftX - 5} y={gy(498) - 3} width={10} height={gy(502) - gy(498) + 6} rx={3} fill="none" stroke={INK.coord} strokeWidth={1.5} />
      <line x1={leftX} y1={gy(502) + 3} x2={leftX} y2={MAG.y} stroke={INK.coord} strokeWidth={1} strokeDasharray="4 4" opacity={0.7} />
      <rect x={MAG.x} y={MAG.y} width={MAG.w} height={MAG.h} rx={10} fill={INK.panel} stroke={INK.coord} strokeWidth={1.2} />
      {/* one heading only: the 0 … 999 range is already on the rulers (a second label here overprinted it) */}
      <Txt x={MAG.x + 14} y={MAG.y + 24} size={18} fill={INK.coord} mono>GRID_SIZE = 1000</Txt>
      <line x1={MAG.x + 16} y1={lineY} x2={MAG.x + MAG.w - 16} y2={lineY} stroke={INK.muted} strokeWidth={1.5} />
      {MAG_TICKS.map((q, i) => {
        const x = MAG.x + 28 + i * ((MAG.w - 56) / (MAG_TICKS.length - 1));
        const hot = q === 500;
        return (
          <g key={q}>
            <line x1={x} y1={lineY - (hot ? 12 : 8)} x2={x} y2={lineY} stroke={hot ? INK.coord : INK.muted} strokeWidth={hot ? 2.5 : 1.5} />
            <Txt x={x} y={lineY + 22} size={15} fill={hot ? INK.coord : INK.muted} anchor="middle" mono>{q}</Txt>
          </g>
        );
      })}
    </g>
  );
}

function Crosshair({ x, y, u, color, dashed = false }: { x: number; y: number; u: number; color: string; dashed?: boolean }) {
  if (u <= 0.003) return null;
  return (
    <g opacity={u}>
      <line x1={IMG.x} y1={y} x2={IMG.x + IMG.w} y2={y} stroke={color} strokeWidth={1.2} strokeDasharray={dashed ? '6 6' : undefined} opacity={0.75} />
      <line x1={x} y1={IMG.y} x2={x} y2={IMG.y + IMG.h} stroke={color} strokeWidth={1.2} strokeDasharray={dashed ? '6 6' : undefined} opacity={0.75} />
      <circle cx={x} cy={y} r={11} fill="none" stroke={color} strokeWidth={2.2} />
      <circle cx={x} cy={y} r={2.5} fill={color} />
    </g>
  );
}

function Corner({ x, y, dir, u }: { x: number; y: number; dir: 1 | -1; u: number }) {
  if (u <= 0.003) return null;
  const L = 22;
  return (
    <g opacity={u}>
      <polyline points={`${x},${y + dir * L} ${x},${y} ${x + dir * L},${y}`} fill="none" stroke={INK.box} strokeWidth={3} strokeLinecap="round" />
      <circle cx={x} cy={y} r={4} fill={INK.box} />
    </g>
  );
}

/** A bracket with `slots` teeth under the first `slots` coordinate cells. */
function Comb({ slots, y, label, u, dim }: { slots: number; y: number; label: string; u: number; dim: number }) {
  if (u <= 0.003) return null;
  const first = COORD_CELLS[0];
  const last = COORD_CELLS[slots - 1];
  const x0 = first.x;
  const x1 = last.x + last.w;
  const color = slots === 2 ? INK.phrase : INK.box;
  return (
    <g opacity={u * (1 - 0.65 * dim)}>
      <path d={`M ${x0} ${y} v 14 h ${x1 - x0} v -14`} fill="none" stroke={color} strokeWidth={2} />
      {COORD_CELLS.slice(0, slots).map((c) => <line key={c.key} x1={c.x + c.w / 2} y1={y} x2={c.x + c.w / 2} y2={y + 14} stroke={color} strokeWidth={2} />)}
      <Txt x={(x0 + x1) / 2} y={y + 36} size={18} fill={color} anchor="middle" mono>{label}</Txt>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const bi = Math.round(b);
  const noteO = 1 - clamp01(Math.abs(b - bi) * 2);
  const imgU = s.get(scene.imgU);
  const imgO = s.get(scene.imgO);
  const chipU = s.get(scene.chipU);
  const crossU = s.get(scene.crossU);
  const cx = gx(s.get(scene.crossX));
  const cy = gy(s.get(scene.crossY));
  const liftU = s.get(scene.liftU);
  const slotsU = s.get(scene.slotsU);
  const rulerU = s.get(scene.rulerU);
  const tickU = s.get(scene.tickU);
  const magU = s.get(scene.magU);
  const projU = s.get(scene.projU);
  const pointU = s.get(scene.pointU);
  const pointO = s.get(scene.pointO);
  const cornerU = s.get(scene.cornerU);
  const boxU = s.get(scene.boxU);
  const rectU = s.get(scene.rectU);
  const atomU = s.get(scene.atomU);
  const wrapU = s.get(scene.wrapU);
  const markU = s.get(scene.markU);
  const mainO = s.get(scene.mainO);
  const altU = s.get(scene.altU);
  const altScan = s.get(scene.altScan);
  const combP = s.get(scene.combP);
  const combB = s.get(scene.combB);
  const closeU = s.get(scene.closeU);
  const labelU = s.get(scene.labelU);
  const machO = 1 - 0.9 * closeU; // obsolete machinery → 0.10
  const camK = s.get(scene.cam).k;
  const badgeO = clamp01((1.08 - camK) / 0.08); // the picture badge hides while the camera is pushed in

  const slot0 = PAYLOAD_CELLS[1];
  const liftPos = { x: lerp(cx, slot0.x + slot0.w / 2, liftU), y: lerp(cy, PAYLOAD_Y + CELL_H / 2, liftU) };
  const chipPos = { x: lerp(CHIP_HOME.x, CHIP_TAPE.x, wrapU), y: lerp(CHIP_HOME.y, CHIP_TAPE.y, wrapU) };
  const tl = { x: gx(RED_BOX[0]), y: gy(RED_BOX[1]) };
  const br = { x: gx(RED_BOX[2]), y: gy(RED_BOX[3]) };
  const cornerTL = { x: lerp(cx, tl.x, cornerU), y: lerp(cy, tl.y, cornerU) };
  const cornerBR = { x: lerp(cx, br.x, cornerU), y: lerp(cy, br.y, cornerU) };
  const altX = lerp(gx(120), gx(900), altScan);
  const noneU = clamp01((altScan - 0.7) / 0.3); // None is on stage from ~52.3 s
  const mainTapeO = mainO * machO;
  // during the <500> push-in (beat 5) the phrase chip is not the subject and would otherwise sit in the
  // protected header band at top-left; it whispers at 0.15 and returns with the camera
  const zoomDim = clamp01((1 - imgO) / 0.65);
  const chipZoomO = 1 - 0.85 * zoomDim;

  return (
    <>
      <rect width={1280} height={720} fill={INK.bg} />
      <Txt x={640} y={55} size={28} weight={750} anchor="middle">The thousand-step ruler</Txt>
      <g opacity={noteO}>
        <Txt x={1206} y={92} size={15} fill={INK.muted} anchor="end" mono>{NOTES[bi][0]}</Txt>
        <Txt x={1206} y={112} size={15} fill={INK.muted} anchor="end" mono>{NOTES[bi][1]}</Txt>
      </g>

      <Camera {...s.get(scene.cam)}>
        {/* ---- the picture (persistent object) ------------------------------ */}
        <Picture u={imgU} opacity={imgO} />
        <Txt x={IMG.x} y={IMG.y + IMG.h + 22} size={14} fill={INK.muted} mono opacity={imgU * badgeO}>Illustrative image and coordinates · W = 1000, H = 600</Txt>
        {/* the rulers hide fully during the <500> push-in: the zoomed camera would crop their dim labels at the stage edge */}
        <Rulers u={rulerU} tick={tickU} opacity={machO * imgO * (1 - zoomDim)} />
        <Magnifier u={magU} />

        {/* projection of the crosshair onto both rulers */}
        {projU > 0.003 && (
          <g opacity={projU * machO}>
            <line x1={cx} y1={cy} x2={cx} y2={IMG.y - 10 - (cy - IMG.y + 10) * (1 - projU)} stroke={INK.coord} strokeWidth={1.5} strokeDasharray="5 5" />
            <line x1={cx} y1={cy} x2={IMG.x - 10 + (cx - IMG.x + 10) * (1 - projU)} y2={cy} stroke={INK.coord} strokeWidth={1.5} strokeDasharray="5 5" />
            <circle cx={cx} cy={IMG.y - 10} r={5} fill={INK.coord} />
            <circle cx={IMG.x - 10} cy={cy} r={5} fill={INK.coord} />
          </g>
        )}

        {/* the rectangle between the exact normalized corners */}
        {rectU > 0.003 && (
          <rect x={tl.x} y={tl.y} width={br.x - tl.x} height={br.y - tl.y} fill={INK.box} fillOpacity={0.06 * rectU} stroke={INK.box} strokeWidth={3}
            strokeDasharray={`${(2 * (br.x - tl.x) + 2 * (br.y - tl.y))}`} strokeDashoffset={(1 - rectU) * (2 * (br.x - tl.x) + 2 * (br.y - tl.y))} />
        )}
        <Crosshair x={cx} y={cy} u={crossU * (1 - cornerU) * machO} color={INK.box} />
        <Corner x={cornerTL.x} y={cornerTL.y} dir={1} u={cornerU * machO} />
        <Corner x={cornerBR.x} y={cornerBR.y} dir={-1} u={cornerU * machO} />
        {/* the yellow query sweeps the picture and finds nothing */}
        <Crosshair x={altX} y={gy(500)} u={altU * (1 - noneU) * 0.9} color={INK.yellow} dashed />
        {/* sits in the empty sky above the red car so it never covers the subject */}
        <Chip x={500} y={165} text="no yellow car · None" color={INK.yellow} opacity={altU * noneU} size={18} />

        {/* the crosshair ghost lifting into the first slot */}
        {liftU > 0.003 && liftU < 0.997 && (
          <g opacity={1 - liftU * 0.3}>
            <line x1={cx} y1={cy} x2={liftPos.x} y2={liftPos.y} stroke={INK.box} strokeWidth={1} strokeDasharray="4 6" opacity={0.5} />
            <circle cx={liftPos.x} cy={liftPos.y} r={11} fill="none" stroke={INK.box} strokeWidth={2} />
          </g>
        )}

        {/* ---- the tape ------------------------------------------------------ */}
        {/* empty slots (structure of the sequence) */}
        {PHRASE_CELLS.map((c) => <TapeCell key={`slot-${c.key}`} x={c.x} y={PHRASE_Y} w={c.w} h={CELL_H} lines={c.lines} color={INK.muted} ghost opacity={slotsU * (1 - markU / 4) * mainTapeO} />)}
        {PAYLOAD_CELLS.map((c, i) => {
          const filled = c.cls === 'coord' ? clamp01(boxU - (i - 1)) : clamp01(markU - (i === 0 ? 2 : 3));
          return <TapeCell key={`slot-${c.key}`} x={c.x} y={PAYLOAD_Y} w={c.w} h={CELL_H} lines={c.lines} color={INK.muted} ghost opacity={slotsU * (1 - filled) * mainTapeO} />;
        })}

        {/* the phrase chip → the phrase cell */}
        {wrapU < 0.997 && <Chip x={chipPos.x} y={chipPos.y} text={PHRASE} color={INK.phrase} opacity={chipU * mainTapeO * chipZoomO} />}
        <TapeCell x={PHRASE_CELL.x} y={PHRASE_Y} w={PHRASE_CELL.w} h={CELL_H} lines={PHRASE_CELL.lines} color={INK.phrase} opacity={clamp01((wrapU - 0.85) / 0.15) * mainTapeO} size={20} />
        {/* boundary markers: ref_start, ref_end, box_start, box_end */}
        {[PHRASE_CELLS[0], PHRASE_CELLS[2], PAYLOAD_CELLS[0], PAYLOAD_CELLS[5]].map((c, i) => {
          const u = clamp01(markU - i);
          const y = i < 2 ? PHRASE_Y : PAYLOAD_Y;
          return <TapeCell key={`mark-${c.key}`} x={c.x} y={y - (1 - ease.enter(u)) * 10} w={c.w} h={CELL_H} lines={c.lines} color={INK.marker} opacity={u * mainTapeO} />;
        })}

        {/* point cells <300> <425> plucked from the rulers */}
        {POINT_TOKENS.map((tok, i) => {
          const u = ease.move(clamp01(pointU - i));
          if (u <= 0) return null;
          const from = i === 0 ? { x: cx, y: IMG.y - 10 } : { x: IMG.x - 10, y: cy };
          const cell = COORD_CELLS[i];
          const x = lerp(from.x - cell.w / 2, cell.x, u);
          const y = lerp(from.y - CELL_H / 2, PAYLOAD_Y, u);
          return <TapeCell key={tok} x={x} y={y} w={cell.w} h={CELL_H} lines={[tok]} color={INK.coord} opacity={pointO * (0.3 + 0.7 * u)} />;
        })}
        {/* box cells <100> <200> from the top-left corner, <500> <650> from the bottom-right */}
        {COORD_CELLS.map((cell, i) => {
          const u = ease.move(clamp01(boxU - i));
          if (u <= 0) return null;
          const from = i < 2 ? cornerTL : cornerBR;
          const x = lerp(from.x - cell.w / 2, cell.x, u);
          const y = lerp(from.y - CELL_H / 2, PAYLOAD_Y, u);
          return <TapeCell key={cell.key} x={x} y={y} w={cell.w} h={CELL_H} lines={cell.lines} color={INK.coord} opacity={(0.3 + 0.7 * u) * mainO} glow={i === 2 ? atomU : 0} />;
        })}

        {/* COORDINATE_TOKENS spotlight on <500> */}
        {atomU > 0.003 && (
          <g opacity={atomU}>
            <Txt x={COORD_CELLS[2].x + COORD_CELLS[2].w / 2} y={PAYLOAD_Y + CELL_H + 34} size={18} fill={INK.coord} anchor="middle" mono>COORDINATE_TOKENS[500] → "&lt;500&gt;"</Txt>
            <Txt x={COORD_CELLS[2].x + COORD_CELLS[2].w / 2} y={PAYLOAD_Y + CELL_H + 58} size={16} fill={INK.muted} anchor="middle">one token id, not three digits · extend_tokens.py</Txt>
          </g>
        )}

        <MathLabel tex={`(x,\\ y) = (${POINT[0]},\\ ${POINT[1]})`} x={TAPE_X} y={PAYLOAD_Y + CELL_H + 40} fontSize={24} anchor="start" color={INK.coord} opacity={s.get(scene.texPointU)} />
        <MathLabel tex={`(x_1,\\ y_1,\\ x_2,\\ y_2) = (${RED_BOX.join(',\\ ')})`} x={TAPE_X} y={PAYLOAD_Y + CELL_H + 40} fontSize={24} anchor="start" color={INK.coord} opacity={s.get(scene.texBoxU)} />

        {/* ---- the alternate (negative) tape --------------------------------- */}
        {altU > 0.003 && (
          <g opacity={altU}>
            <Txt x={TAPE_X} y={ALT_PHRASE_Y - 12} size={16} fill={INK.yellow} mono>alternate query · the picture has no yellow car</Txt>
            {ALT_PHRASE_CELLS.map((c) => <TapeCell key={`alt-${c.key}`} x={c.x} y={ALT_PHRASE_Y} w={c.w} h={CELL_H} lines={c.lines} color={c.cls === 'phrase' ? INK.yellow : INK.marker} size={c.cls === 'phrase' ? 20 : undefined} />)}
            {ALT_PAYLOAD_CELLS.map((c) => (
              c.cls === 'none' ? (
                <g key={`alt-${c.key}`}>
                  <TapeCell x={c.x} y={ALT_PAYLOAD_Y} w={c.w} h={CELL_H} lines={c.lines} color={INK.muted} ghost opacity={1 - noneU} />
                  <TapeCell x={c.x} y={ALT_PAYLOAD_Y} w={c.w} h={CELL_H} lines={c.lines} color={CLS_COLOR[c.cls]} opacity={noneU} />
                </g>
              ) : (
                <TapeCell key={`alt-${c.key}`} x={c.x} y={ALT_PAYLOAD_Y} w={c.w} h={CELL_H} lines={c.lines} color={CLS_COLOR[c.cls]} />
              )
            ))}
          </g>
        )}

        {/* ---- task combs ----------------------------------------------------- */}
        <Comb slots={2} y={PAYLOAD_Y + CELL_H + 14} label="TaskType.POINT · arity 2" u={combP * machO} dim={combB} />
        <Comb slots={4} y={PAYLOAD_Y + CELL_H + 62} label="TaskType.BBOX · arity 4" u={combB * machO} dim={0} />
      </Camera>

      {/* ---- closing label on an opaque panel ------------------------------- */}
      {labelU > 0.003 && (
        <g opacity={labelU}>
          <rect x={640} y={436} width={560} height={90} rx={16} fill={INK.bg} />
          <rect x={640} y={436} width={560} height={90} rx={16} fill={INK.panel} stroke={INK.coord} strokeWidth={1.5} />
          <Txt x={920} y={474} size={24} weight={700} anchor="middle">image location → shared token sequence</Txt>
          <Txt x={920} y={504} size={15} fill={INK.muted} anchor="middle" mono>&lt;100&gt;&lt;200&gt;&lt;500&gt;&lt;650&gt; · four atomic tokens</Txt>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
