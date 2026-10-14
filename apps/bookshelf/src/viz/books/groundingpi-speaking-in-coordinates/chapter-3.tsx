// Speaking in Coordinates — chapter 3: A box must survive the parser
//
// Source evidence (github.com/groundingpi/GroundingPI @ 0047d4510e201fecfd77126f6036088638aa85d2):
//   grounding_pi/client.py L39-L59  — parse_response(response, task): raw = choice["message"]["content"];
//     entries = parse_answer(raw, task=task, require_canonical=True); on ValueError → parse_error;
//     if finish != "stop": error = error or f"incomplete generation: finish_reason={finish!r}";
//     if error: predictions = ().  Result.valid = parse_error is None and finish_reason == "stop"
//   grounding_pi/protocol.py L265-L295 — _validate_scalar: 0 <= value <= GRID_MAX else CoordinateError
//     "coordinate 1000 is outside the inclusive grid [0, 999]"; _validate_tuple: arity, x1 < x2, y1 < y2
//   grounding_pi/protocol.py L412-L534 — _parse_coordinate_token, _parse_payload (payload == "None" →
//     None), parse_answer: _expect OBJECT_REF_START, find OBJECT_REF_END, _expect BOX_START, find BOX_END;
//     the grammar must consume the complete string
//   grounding_pi/client.py L101-L118 — visualize(image, result): raises on an invalid result;
//     pixels = [v / 999 * (canvas.width - 1 if i % 2 == 0 else canvas.height - 1) ...];
//     bbox → draw.rectangle(pixels, outline="red", width=3); point → draw.ellipse((x-4, y-4, x+4, y+4))
//   grounding_pi/protocol.py L7-L41 — NEGATIVE_PAYLOAD = "None"
//
// Exact strings (unbroken; the stage shows each as a phrase row and a payload row, marker labels wrapped
// onto two lines for presentation only):
//   valid box:      <|object_ref_start|>the red car<|object_ref_end|><|box_start|><100><200><500><650><|box_end|>
//   valid negative: <|object_ref_start|>the yellow car<|object_ref_end|><|box_start|>None<|box_end|>
//   malformed:      <|object_ref_start|>the red car<|object_ref_end|><|box_start|><100><200><1000><650><|box_end|>
//
// The picture, cars and coordinates are ILLUSTRATIVE (W = 1000, H = 600). `valid` means well formed and
// complete; it never means the object was localized correctly.
import type { ReactNode } from 'react';
// Standalone blog sections mount this scene without ChapterPlayer's math stylesheet.
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

// ---------------------------------------------------------------------------
// Protocol + client facts, mirrored and asserted against the run's parser fixtures
// ---------------------------------------------------------------------------
const GRID_MAX = 999;
const OBJECT_REF_START = '<|object_ref_start|>';
const OBJECT_REF_END = '<|object_ref_end|>';
const BOX_START = '<|box_start|>';
const BOX_END = '<|box_end|>';
const NEGATIVE_PAYLOAD = 'None';
const PHRASE = 'the red car';
const ALT_PHRASE = 'the yellow car';
const RED_BOX = [100, 200, 500, 650] as const;
const BAD_BOX = [100, 200, 1000, 650] as const; // one coordinate pushed off the grid
const POINT = [300, 425] as const;

const tokenOf = (v: number): string => `<${v}>`;
const serialize = (phrase: string, payload: string): string => `${OBJECT_REF_START}${phrase}${OBJECT_REF_END}${BOX_START}${payload}${BOX_END}`;
const CANONICAL = serialize(PHRASE, RED_BOX.map(tokenOf).join(''));
const NEGATIVE = serialize(ALT_PHRASE, NEGATIVE_PAYLOAD);
const MALFORMED = serialize(PHRASE, BAD_BOX.map(tokenOf).join(''));
if (CANONICAL !== '<|object_ref_start|>the red car<|object_ref_end|><|box_start|><100><200><500><650><|box_end|>') throw new Error('canonical string drifted');
if (NEGATIVE !== '<|object_ref_start|>the yellow car<|object_ref_end|><|box_start|>None<|box_end|>') throw new Error('negative string drifted');
if (MALFORMED !== '<|object_ref_start|>the red car<|object_ref_end|><|box_start|><100><200><1000><650><|box_end|>') throw new Error('malformed string drifted');

// a faithful schematic of the two checks this chapter animates (protocol.py + client.py)
const validateScalar = (value: number): string | null =>
  value >= 0 && value <= GRID_MAX ? null : `coordinate ${value} is outside the inclusive grid [0, ${GRID_MAX}]`;
const validateBox = (box: readonly number[]): string | null => {
  for (const v of box) { const e = validateScalar(v); if (e) return e; }
  const [x1, y1, x2, y2] = box;
  return x1 < x2 && y1 < y2 ? null : `bbox must be non-degenerate with x1 < x2 and y1 < y2: (${box.join(', ')})`;
};
const clientResult = (parseError: string | null, finish: string): { error: string | null; valid: boolean } => {
  let error = parseError;
  if (finish !== 'stop') error = error ?? `incomplete generation: finish_reason='${finish}'`;
  return { error, valid: error === null && finish === 'stop' };
};
const BAD_ERROR = validateBox(BAD_BOX);
if (validateBox(RED_BOX) !== null) throw new Error('the canonical box must validate');
if (BAD_ERROR !== 'coordinate 1000 is outside the inclusive grid [0, 999]') throw new Error('out-of-range message drifted');
if (!clientResult(null, 'stop').valid) throw new Error('stop + no error must be valid');
if (clientResult(null, 'length').valid || clientResult(null, 'length').error !== "incomplete generation: finish_reason='length'") throw new Error('finish_reason gate drifted');
if (clientResult(BAD_ERROR, 'stop').valid) throw new Error('an out-of-range coordinate must not be valid');

// ---------------------------------------------------------------------------
// Illustrative picture (W = 1000, H = 600) and the client.py pixel mapping
// ---------------------------------------------------------------------------
const IMG_W = 1000;
const IMG_H = 600;
const IMG = { x: 150, y: 164, w: 400, h: 240 } as const;
const gridToPx = (q: number, axis: 'x' | 'y'): number => (q / GRID_MAX) * ((axis === 'x' ? IMG_W : IMG_H) - 1);
const gx = (q: number): number => IMG.x + (gridToPx(q, 'x') / IMG_W) * IMG.w;
const gy = (q: number): number => IMG.y + (gridToPx(q, 'y') / IMG_H) * IMG.h;
const PX = RED_BOX.map((q, i) => gridToPx(q, i % 2 === 0 ? 'x' : 'y')); // (100, 119.9199…, 500, 389.7397…)
const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-3;
if (!near(PX[0], 100) || !near(PX[1], 119.9199) || !near(PX[2], 500) || !near(PX[3], 389.7397)) throw new Error('pixel mapping drifted from client.py');
const fmtPx = (v: number): string => { const s = v.toFixed(2); return s.endsWith('.00') ? s.slice(0, -3) : s; };
const PX_TEX = `(${PX.map(fmtPx).join(',\\ ')})`; // (100, 119.92, 500, 389.74)
const BLUE_BOX = [620, 420, 930, 800] as const;
const RED_STAGE = { x1: gx(RED_BOX[0]), y1: gy(RED_BOX[1]), x2: gx(RED_BOX[2]), y2: gy(RED_BOX[3]) } as const;
const BLUE_STAGE = { x1: gx(BLUE_BOX[0]), y1: gy(BLUE_BOX[1]), x2: gx(BLUE_BOX[2]), y2: gy(BLUE_BOX[3]) } as const;
const POINT_STAGE = { x: gx(POINT[0]), y: gy(POINT[1]) } as const;
// the query chip rides the picture's top edge as a tag: under every camera state it stays below the fixed
// source notes (y ≤ 114) and above the red car's roof (gy(200) ≈ 212)
const CHIP_HOME = { x: IMG.x + 110, y: IMG.y + 2 } as const;

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
  ok: colors.POSITIVE,
  bad: colors.NEGATIVE,
  yellow: '#fde047',
  car: '#e0484f',
  carDark: '#8f1f27',
  glass: '#9fd3ff',
  blue: '#3b5f8f',
  blueDark: '#243a5a',
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

function TapeCell({ x, y, w, h, lines, color, opacity = 1, ghost = false, glow = 0, size, stroke }: {
  x: number; y: number; w: number; h: number; lines: readonly string[]; color: string; opacity?: number; ghost?: boolean; glow?: number; size?: number; stroke?: string;
}) {
  if (opacity <= 0.003) return null;
  const fs = size ?? (lines.length > 1 ? 18 : 24);
  return (
    <g opacity={opacity}>
      {glow > 0 && <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={12} fill="none" stroke={stroke ?? color} strokeWidth={3} opacity={glow} />}
      <rect x={x} y={y} width={w} height={h} rx={8} fill={ghost ? 'none' : INK.panel} stroke={stroke ?? color} strokeWidth={ghost ? 1.2 : 1.8} strokeDasharray={ghost ? '5 5' : undefined} opacity={ghost ? 0.55 : 1} />
      {!ghost && lines.length === 1 && <text x={x + w / 2} y={y + h / 2 + fs * 0.36} fontSize={fs} textAnchor="middle" fill={color} fontFamily={MONO}>{lines[0]}</text>}
      {!ghost && lines.length === 2 && (
        <>
          <text x={x + w / 2} y={y + h / 2 - 2} fontSize={fs} textAnchor="middle" fill={color} fontFamily={MONO}>{lines[0]}</text>
          <text x={x + w / 2} y={y + h / 2 + fs} fontSize={fs} textAnchor="middle" fill={color} fontFamily={MONO}>{lines[1]}</text>
        </>
      )}
    </g>
  );
}

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
// Tape variants (same layout; the parser reads cells in serialization order)
// ---------------------------------------------------------------------------
type Cls = 'marker' | 'phrase' | 'coord' | 'none';
interface Cell { key: string; lines: readonly string[]; w: number; cls: Cls; x: number; y: number; bad?: boolean }
const CLS_COLOR: Record<Cls, string> = { marker: INK.marker, phrase: INK.phrase, coord: INK.coord, none: INK.text };
const TAPE_X = 620;
const CELL_H = 48;
const GAP = 8;
const PHRASE_Y = 100;
const PAYLOAD_Y = 156;
const layoutRow = (specs: ReadonlyArray<Omit<Cell, 'x' | 'y'>>, y: number): Cell[] => {
  let x = TAPE_X;
  return specs.map((c) => { const cell = { ...c, x, y }; x += c.w + GAP; return cell; });
};
const phraseRow = (phrase: string, w: number): Cell[] => layoutRow([
  { key: 'ref_start', lines: ['<|object_ref_', 'start|>'], w: 152, cls: 'marker' },
  { key: 'phrase', lines: [phrase], w, cls: 'phrase' },
  { key: 'ref_end', lines: ['<|object_ref_', 'end|>'], w: 152, cls: 'marker' },
], PHRASE_Y);
const boxRow = (box: readonly number[]): Cell[] => layoutRow([
  { key: 'box_start', lines: ['<|box_', 'start|>'], w: 96, cls: 'marker' },
  ...box.map((q, i) => ({ key: `c${i}`, lines: [tokenOf(q)], w: q > 999 ? 96 : 84, cls: 'coord' as Cls, bad: q > GRID_MAX })),
  { key: 'box_end', lines: ['<|box_', 'end|>'], w: 96, cls: 'marker' },
], PAYLOAD_Y);
const noneRow = (): Cell[] => layoutRow([
  { key: 'box_start', lines: ['<|box_', 'start|>'], w: 96, cls: 'marker' },
  { key: 'none', lines: [NEGATIVE_PAYLOAD], w: 96, cls: 'none' },
  { key: 'box_end', lines: ['<|box_', 'end|>'], w: 96, cls: 'marker' },
], PAYLOAD_Y);

interface Variant {
  name: string;
  cells: Cell[]; // reading order
  lampCell: readonly number[]; // ref_start, phrase, ref_end, box_start, payload, box_end → cell index (−1: never reached)
  coords: readonly number[] | null;
  stopAt: number; // cell index where the parse halts (cells.length = consumed everything)
}
const MAIN: Variant = { name: 'valid box', cells: [...phraseRow(PHRASE, 160), ...boxRow(RED_BOX)], lampCell: [0, 1, 2, 3, 7, 8], coords: RED_BOX, stopAt: 9 };
const NONE: Variant = { name: 'valid negative', cells: [...phraseRow(ALT_PHRASE, 196), ...noneRow()], lampCell: [0, 1, 2, 3, 4, 5], coords: null, stopAt: 6 };
const BAD: Variant = { name: 'malformed', cells: [...phraseRow(PHRASE, 160), ...boxRow(BAD_BOX)], lampCell: [0, 1, 2, 3, -1, -1], coords: BAD_BOX, stopAt: 6 };
const VARIANTS = [MAIN, NONE, BAD] as const;
if (MAIN.cells.length !== 9 || NONE.cells.length !== 6 || BAD.cells[6].bad !== true) throw new Error('tape variants drifted');
const MAIN_COORD_CELLS = MAIN.cells.slice(4, 8);

// gauge panel
const GAUGE = { x: 620, y: 224, w: 580, h: 196 } as const;
const LAMPS = ['ref_start', 'phrase', 'ref_end', 'box_start', 'payload', 'box_end'] as const;
const LAMP_X0 = 760;
const LAMP_STEP = 80;
const LAMP_Y = 272;
const DOCK_X0 = 740;
const DOCK_STEP = 68;
const DOCK_Y = 320;
const DOCK_W = 60;
const DOCK_H = 36;
const CHECK_X = 1040;
const CHECK_Y = [328, 356, 384] as const;
const CHECK_TEX = ['0 \\le q \\le 999', 'x_1 < x_2', 'y_1 < y_2'] as const;
const COMPLETION_Y = 408;
const TOGGLE_X = 806; // the finish_reason toggle, right of the 'finish_reason' row label

// status cards (right, under the gauge) and formulas (left, under the picture)
const CARD = { x: 620, y: 436, w: 580, h: 130 } as const;
interface Card { title: string; lines: readonly string[]; color: string; mono?: boolean }
const CARDS: ReadonlyArray<Card | null> = [
  { title: 'parse_response(response, task)', color: INK.text, lines: ['raw = choice["message"]["content"]', 'parse_answer(raw, task=task, require_canonical=True)'] },
  { title: 'parse_answer: consume the whole string', color: INK.text, lines: ['_expect(text, position, OBJECT_REF_START, …)', 'then OBJECT_REF_END · BOX_START · payload · BOX_END'] },
  { title: '_validate_scalar · _validate_tuple', color: INK.text, lines: ['0 <= value <= GRID_MAX   and   x1 < x2, y1 < y2', 'format and geometry only · not localization accuracy'] },
  { title: 'valid negative / None', color: INK.yellow, lines: ['payload == NEGATIVE_PAYLOAD → coordinates = None', "predictions = (Prediction('the yellow car', None),)", 'valid = True · nothing to draw'] },
  { title: 'illustrative malformed response', color: INK.bad, lines: ['CoordinateError: coordinate 1000 is outside', 'the inclusive grid [0, 999]', 'predictions = () · valid = False · no clamping'] },
  { title: 'finish_reason != "stop" → not valid', color: INK.bad, lines: ["incomplete generation: finish_reason='length'", 'grammar passed · completion latch closed', 'predictions = () · valid = False'] },
  { title: 'visualize(image, result)', color: INK.text, lines: ['pixels = [v / 999 * (canvas.width - 1', '    if i % 2 == 0 else canvas.height - 1) …]', 'illustrative 1000 × 600 image'] },
  { title: 'visualize · draw.rectangle', color: INK.text, lines: ['draw.rectangle(pixels, outline="red", width=3)', 'point: draw.ellipse((x-4, y-4, x+4, y+4), fill="red")'] },
  { title: '✓ format + completion checked', color: INK.ok, lines: ['localization accuracy: needs evaluation', 'valid means well formed and complete, not correct'] },
  null,
];

const CAPTIONS = [
  { at: 0.4, text: 'A generated answer is still text. The client checks its structure before treating it as a prediction.' },
  { at: 7.9, text: 'The parser reads the whole response, requiring the phrase and coordinate boundaries in the right places.' },
  { at: 15.4, text: 'For a box, four coordinates must stay within the grid and describe corners with positive width and height.' },
  { at: 22.9, text: 'A missing target remains a valid structured answer, with no box to draw.' },
  { at: 30.4, text: 'An out-of-range coordinate stops the parse, and the client clears the predictions.' },
  { at: 37.9, text: 'Even a well-formed answer is rejected when generation ends without the normal stop signal.' },
  { at: 45.4, text: 'Accepted coordinates scale back to pixels using the image width and height.' },
  { at: 52.9, text: 'The visualizer draws the recovered box onto the original image.' },
  { at: 60.4, text: 'Passing these checks proves the answer is well formed and complete, but it does not prove the object was localized correctly.' },
  { at: 67.9, text: 'The image and phrase become tokens, the tokens pass a strict parser, and their coordinates return to the image.' },
] as const;
const CAPTION_DUR = 6.8;
const TOTAL = 77.0;

const NOTES: ReadonlyArray<readonly [string, string]> = [
  ['grounding_pi/client.py · parse_response', 'raw text → parse_answer → Result'],
  ['grounding_pi/protocol.py · parse_answer', '_expect(…) · text.find(…) · whole string'],
  ['protocol.py · _validate_scalar / _validate_tuple', '0 ≤ q ≤ 999 · x1 < x2 · y1 < y2'],
  ['protocol.py · _parse_payload', 'payload == "None" → coordinates None'],
  ['client.py · parse_response', 'except ValueError → predictions = ()'],
  ['client.py · Result.valid', 'parse_error is None and finish_reason == "stop"'],
  ['client.py · visualize', 'v / 999 * (canvas.width - 1 | canvas.height - 1)'],
  ['client.py · visualize', 'draw.rectangle(pixels, outline="red", width=3)'],
  ['client.py · Result.valid', 'format + completion · not accuracy'],
  ['client.py → protocol.py → client.py', 'predict · parse_answer · visualize'],
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

  const imgU = tl.channel('imgU', 0);
  const chipU = tl.channel('chipU', 0);
  const tapeU = tl.channel('tapeU', 0); // cells stagger in
  const gaugeU = tl.channel('gaugeU', 0);
  const gaugeO = tl.channel('gaugeO', 1);
  const variant = tl.channel('variant', 0); // 0 valid box · 1 valid negative · 2 malformed (set, never tweened)
  const tapeMainO = tl.channel('tapeMainO', 1);
  const tapeNoneO = tl.channel('tapeNoneO', 0);
  const tapeBadO = tl.channel('tapeBadO', 0);
  const cursorP = tl.channel('cursorP', 0); // cells consumed (0..9)
  const dockU = tl.channel('dockU', 0); // 0..4 coordinates docked in the gauge
  const checksU = tl.channel('checksU', 0); // 0..3 geometry checks shown
  const stopU = tl.channel('stopU', 0); // the malformed parse halts
  const noneImgU = tl.channel('noneImgU', 0); // "nothing drawn" overlay
  const finishLen = tl.channel('finishLen', 0); // 0 = "stop", 1 = "length"
  const formU = tl.channel('formU', 0);
  const formNumU = tl.channel('formNumU', 0);
  const raysU = tl.channel('raysU', 0);
  const rectU = tl.channel('rectU', 0);
  const pointU = tl.channel('pointU', 0);
  const cardsO = tl.channel('cardsO', 1);
  const retraceU = tl.channel('retraceU', 0); // 0..3
  const panelU = tl.channel('panelU', 0);

  // BEAT 0 — the completed answer arrives as text; the parser and gauge appear
  tl.tween(imgU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(chipU, 1, { at: 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(tapeU, 1, { at: 2.4, dur: 1.4, ease: ease.linear });
  tl.tween(cam, { x: 700, y: 350, k: 1.1 }, { at: 3.8, dur: 1.3, ease: ease.move });
  tl.tween(gaugeU, 1, { at: 4.2, dur: 0.8, ease: ease.enter });

  // BEAT 1 — the cursor consumes every cell; boundary lamps light in order
  tl.tween(cursorP, 9, { at: 8.4, dur: 4.8, ease: ease.linear });

  // BEAT 2 — four coordinates dock; three geometry checks
  tl.tween(cam, { x: 720, y: 352, k: 1.12 }, { at: 15.6, dur: 1.3, ease: ease.move });
  tl.tween(dockU, 4, { at: 15.9, dur: 1.6, ease: ease.linear });
  tl.tween(checksU, 3, { at: 17.9, dur: 1.8, ease: ease.linear });

  // BEAT 3 — the yellow car: None traverses the grammar; nothing is drawn; then the red-car tape returns
  tl.tween(cam, CAMERA_HOME, { at: 23.0, dur: 1.3, ease: ease.move });
  tl.tween(tapeMainO, 0, { at: 23.3, dur: 0.5, ease: ease.enter });
  tl.set(variant, 1, 23.6);
  tl.set(cursorP, 0, 23.6);
  tl.set(dockU, 0, 23.6);
  tl.set(checksU, 0, 23.6);
  tl.tween(tapeNoneO, 1, { at: 23.6, dur: 0.5, ease: ease.enter });
  tl.tween(cursorP, 6, { at: 24.0, dur: 3.2, ease: ease.linear });
  tl.tween(noneImgU, 1, { at: 27.0, dur: 0.6, ease: ease.enter });
  tl.tween(noneImgU, 0, { at: 29.0, dur: 0.5, ease: ease.enter });
  tl.tween(tapeNoneO, 0, { at: 29.0, dur: 0.5, ease: ease.enter });
  tl.set(variant, 0, 29.3);
  tl.set(cursorP, 9, 29.3);
  tl.set(dockU, 4, 29.3);
  tl.set(checksU, 3, 29.3);
  tl.tween(tapeMainO, 1, { at: 29.3, dur: 0.5, ease: ease.enter });

  // BEAT 4 — <1000>: the parse halts at the cell; predictions = ()
  tl.tween(tapeMainO, 0, { at: 30.8, dur: 0.5, ease: ease.enter });
  tl.set(variant, 2, 31.1);
  tl.set(cursorP, 0, 31.1);
  tl.set(dockU, 0, 31.1);
  tl.set(checksU, 0, 31.1);
  tl.tween(tapeBadO, 1, { at: 31.1, dur: 0.5, ease: ease.enter });
  tl.tween(cursorP, 6, { at: 31.5, dur: 3.2, ease: ease.linear });
  tl.tween(dockU, 3, { at: 33.4, dur: 1.3, ease: ease.linear });
  tl.tween(stopU, 1, { at: 34.7, dur: 0.5, ease: ease.enter });
  tl.tween(checksU, 1, { at: 34.9, dur: 0.4, ease: ease.enter });

  // BEAT 5 — a valid tape, but finish_reason = "length": the completion latch closes
  tl.tween(tapeBadO, 0, { at: 38.2, dur: 0.5, ease: ease.enter });
  tl.tween(stopU, 0, { at: 38.2, dur: 0.4, ease: ease.enter });
  tl.set(variant, 0, 38.5);
  tl.set(cursorP, 9, 38.5);
  tl.set(dockU, 4, 38.5);
  tl.set(checksU, 3, 38.5);
  tl.tween(tapeMainO, 1, { at: 38.5, dur: 0.5, ease: ease.enter });
  tl.tween(finishLen, 1, { at: 40.2, dur: 0.6, ease: ease.enter });

  // BEAT 6 — "stop" restored; the pixel formula under the picture
  tl.tween(finishLen, 0, { at: 45.9, dur: 0.6, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 378, k: 1.06 }, { at: 46.4, dur: 1.3, ease: ease.move });
  tl.tween(formU, 1, { at: 47.2, dur: 0.8, ease: ease.enter });
  tl.tween(formNumU, 1, { at: 49.2, dur: 0.8, ease: ease.enter });

  // BEAT 7 — guide rays from the four cells to the corners; the rectangle; a brief point
  tl.tween(cam, CAMERA_HOME, { at: 53.0, dur: 1.3, ease: ease.move });
  tl.tween(raysU, 1, { at: 53.8, dur: 1.3, ease: ease.draw });
  tl.tween(rectU, 1, { at: 55.2, dur: 1.3, ease: ease.draw });
  tl.tween(raysU, 0.25, { at: 56.8, dur: 0.6, ease: ease.enter });
  tl.tween(pointU, 1, { at: 57.6, dur: 0.6, ease: ease.enter });
  tl.tween(pointU, 0, { at: 59.6, dur: 0.5, ease: ease.enter });

  // BEAT 8 — one split label: checked format, unproven localization
  tl.tween(raysU, 0, { at: 60.6, dur: 0.5, ease: ease.enter });

  // BEAT 9 — retrace, then quiet
  tl.tween(cardsO, 0, { at: 68.0, dur: 0.8, ease: ease.enter });
  tl.tween(formU, 0, { at: 68.0, dur: 0.8, ease: ease.enter });
  tl.tween(formNumU, 0, { at: 68.0, dur: 0.8, ease: ease.enter });
  tl.tween(gaugeO, 0, { at: 68.6, dur: 0.8, ease: ease.enter });
  tl.tween(retraceU, 3, { at: 68.8, dur: 3.0, ease: ease.linear });
  tl.tween(panelU, 1, { at: 71.4, dur: 0.8, ease: ease.enter });
  tl.hold(TOTAL - 1, 1);

  return {
    tl, cam, beat, imgU, chipU, tapeU, gaugeU, gaugeO, variant, tapeMainO, tapeNoneO, tapeBadO, cursorP, dockU, checksU, stopU, noneImgU,
    finishLen, formU, formNumU, raysU, rectU, pointU, cardsO, retraceU, panelU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render pieces
// ---------------------------------------------------------------------------
function Picture({ u }: { u: number }) {
  if (u <= 0.003) return null;
  const horizon = IMG.y + IMG.h * 0.72;
  return (
    <g>
      <defs>
        <clipPath id="gpi-ch3-picture">
          <rect x={IMG.x} y={IMG.y} width={IMG.w * u} height={IMG.h} rx={6} />
        </clipPath>
      </defs>
      <g clipPath="url(#gpi-ch3-picture)">
        <rect x={IMG.x} y={IMG.y} width={IMG.w} height={IMG.h} fill={INK.sky} />
        <rect x={IMG.x} y={horizon} width={IMG.w} height={IMG.y + IMG.h - horizon} fill={INK.ground} />
        <line x1={IMG.x} y1={horizon} x2={IMG.x + IMG.w} y2={horizon} stroke="#3a4356" strokeWidth={1.5} />
        <line x1={IMG.x + 18} y1={IMG.y + IMG.h - 20} x2={IMG.x + IMG.w - 18} y2={IMG.y + IMG.h - 20} stroke="#4b5366" strokeWidth={3} strokeDasharray="24 20" />
        <Car {...BLUE_STAGE} body={INK.blue} dark={INK.blueDark} opacity={0.85} />
        <Car {...RED_STAGE} body={INK.car} dark={INK.carDark} />
      </g>
      <rect x={IMG.x} y={IMG.y} width={IMG.w} height={IMG.h} rx={6} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
    </g>
  );
}

/** One tape variant with its reading cursor. `p` = cells consumed so far. */
function Tape({ v, opacity, p, stagger, halted }: { v: Variant; opacity: number; p: number; stagger: number; halted: number }) {
  if (opacity <= 0.003) return null;
  const i0 = Math.min(v.cells.length - 1, Math.floor(p));
  const i1 = Math.min(v.cells.length - 1, i0 + 1);
  const f = p - i0;
  const a = v.cells[i0];
  const b = v.cells[i1];
  const reading = p > 0 && p < v.cells.length;
  const cur = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), w: lerp(a.w, b.w, f) };
  return (
    <g opacity={opacity}>
      {v.cells.map((c, i) => {
        const u = clamp01(stagger * v.cells.length - i);
        const consumed = p >= i + 0.6 ? 1 : 0;
        const badHere = c.bad && halted > 0;
        const color = badHere ? INK.bad : CLS_COLOR[c.cls];
        return (
          <g key={c.key}>
            <TapeCell x={c.x} y={c.y - (1 - u) * 8} w={c.w} h={CELL_H} lines={c.lines} color={color} opacity={u} size={c.cls === 'phrase' ? 20 : undefined}
              glow={badHere ? halted : 0} stroke={badHere ? INK.bad : undefined} />
            {consumed > 0 && !badHere && <line x1={c.x + 8} y1={c.y + CELL_H + 6} x2={c.x + c.w - 8} y2={c.y + CELL_H + 6} stroke={INK.ok} strokeWidth={2.5} opacity={0.9} />}
          </g>
        );
      })}
      {reading && (
        <rect x={cur.x - 4} y={cur.y - 4} width={cur.w + 8} height={CELL_H + 8} rx={11} fill="none" stroke={halted > 0 ? INK.bad : INK.text} strokeWidth={2.5} opacity={0.9} />
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const bi = Math.round(b);
  const noteO = 1 - clamp01(Math.abs(b - bi) * 2);
  const imgU = s.get(scene.imgU);
  const chipU = s.get(scene.chipU);
  const tapeU = s.get(scene.tapeU);
  const gaugeA = s.get(scene.gaugeU) * s.get(scene.gaugeO);
  const vi = Math.round(s.get(scene.variant)) as 0 | 1 | 2;
  const v = VARIANTS[vi];
  const tapeO = [s.get(scene.tapeMainO), s.get(scene.tapeNoneO), s.get(scene.tapeBadO)];
  const p = s.get(scene.cursorP);
  const dockU = s.get(scene.dockU);
  const checksU = s.get(scene.checksU);
  const stopU = s.get(scene.stopU);
  const noneImgU = s.get(scene.noneImgU);
  const finishLen = s.get(scene.finishLen);
  const formU = s.get(scene.formU);
  const formNumU = s.get(scene.formNumU);
  const raysU = s.get(scene.raysU);
  const rectU = s.get(scene.rectU);
  const pointU = s.get(scene.pointU);
  const cardsO = s.get(scene.cardsO);
  const retraceU = s.get(scene.retraceU);
  const panelU = s.get(scene.panelU);

  // derived parser state (pure functions of the sampled channels)
  const grammarDone = p >= v.stopAt - 0.4 && vi !== 2;
  const parseError = vi === 2 && stopU > 0.5;
  const finishIsStop = finishLen < 0.5;
  const valid = !parseError && finishIsStop && grammarDone;
  const card = CARDS[bi];
  const tl = { x: gx(RED_BOX[0]), y: gy(RED_BOX[1]) };
  const br = { x: gx(RED_BOX[2]), y: gy(RED_BOX[3]) };
  const perim = 2 * (br.x - tl.x) + 2 * (br.y - tl.y);
  const noDraw = clamp01(Math.max(stopU, finishLen));

  // retrace ring: phrase chip → tape → the box
  const STOPS = [
    { x: CHIP_HOME.x, y: CHIP_HOME.y },
    { x: TAPE_X + 290, y: (PHRASE_Y + PAYLOAD_Y + CELL_H) / 2 },
    { x: (tl.x + br.x) / 2, y: (tl.y + br.y) / 2 },
  ];
  const rs = Math.min(2, Math.floor(retraceU));
  const rf = retraceU - rs;
  const ring = retraceU <= 0 ? null : {
    x: lerp(STOPS[rs].x, STOPS[Math.min(2, rs + 1)].x, ease.move(clamp01(rf * 1.4))),
    y: lerp(STOPS[rs].y, STOPS[Math.min(2, rs + 1)].y, ease.move(clamp01(rf * 1.4))),
    r: retraceU >= 2.95 ? Math.hypot(br.x - tl.x, br.y - tl.y) / 2 + 10 : 34,
  };

  return (
    <>
      <rect width={1280} height={720} fill={INK.bg} />
      <Txt x={640} y={55} size={28} weight={750} anchor="middle">A box must survive the parser</Txt>
      <g opacity={noteO}>
        <Txt x={74} y={90} size={15} fill={INK.muted} mono>{NOTES[bi][0]}</Txt>
        <Txt x={74} y={110} size={15} fill={INK.muted} mono>{NOTES[bi][1]}</Txt>
      </g>

      <Camera {...s.get(scene.cam)}>
        {/* ---- picture + phrase -------------------------------------------------- */}
        <Picture u={imgU} />
        <Txt x={IMG.x} y={IMG.y + IMG.h + 22} size={14} fill={INK.muted} mono opacity={imgU}>Illustrative image and coordinates · W = 1000, H = 600</Txt>
        {/* the query chip: the red-car phrase, swapped for the yellow-car query while the None tape is read */}
        <Chip x={CHIP_HOME.x} y={CHIP_HOME.y} text={PHRASE} color={INK.phrase} opacity={chipU * (1 - tapeO[1])} />
        <Chip x={CHIP_HOME.x} y={CHIP_HOME.y} text={ALT_PHRASE} color={INK.yellow} opacity={chipU * tapeO[1]} />

        {/* guide rays: <100>,<200> → top-left corner · <500>,<650> → bottom-right corner */}
        {raysU > 0.003 && MAIN_COORD_CELLS.map((c, i) => {
          const from = { x: c.x + c.w / 2, y: c.y + CELL_H };
          const to = i < 2 ? tl : br;
          const u = clamp01(raysU * 1.6 - i * 0.2);
          return (
            <line key={c.key} x1={from.x} y1={from.y} x2={lerp(from.x, to.x, u)} y2={lerp(from.y, to.y, u)} stroke={INK.coord} strokeWidth={1.5} strokeDasharray="6 6" opacity={raysU} />
          );
        })}
        {rectU > 0.003 && (
          <>
            <rect x={tl.x} y={tl.y} width={br.x - tl.x} height={br.y - tl.y} fill="none" stroke="#ef4444" strokeWidth={3} strokeDasharray={`${perim}`} strokeDashoffset={(1 - rectU) * perim} />
            <Txt x={tl.x} y={tl.y - 8} size={16} fill="#ef4444" mono opacity={clamp01((rectU - 0.8) / 0.2) * (1 - panelU)}>draw.rectangle · outline="red", width=3</Txt>
          </>
        )}
        {pointU > 0.003 && (
          <g opacity={pointU}>
            <circle cx={POINT_STAGE.x} cy={POINT_STAGE.y} r={5} fill="#ef4444" />
            <Txt x={POINT_STAGE.x + 12} y={POINT_STAGE.y - 10} size={16} fill="#ef4444" mono>draw.ellipse · point mode (300, 425)</Txt>
          </g>
        )}
        {/* deliberate emptiness for None; refusal for invalid results */}
        {noneImgU > 0.003 && (
          <g opacity={noneImgU}>
            <rect x={IMG.x + 4} y={IMG.y + 4} width={IMG.w - 8} height={IMG.h - 8} rx={5} fill="none" stroke={INK.yellow} strokeWidth={1.5} strokeDasharray="8 8" />
            <Chip x={IMG.x + IMG.w / 2} y={IMG.y + IMG.h / 2} text="None · nothing drawn" color={INK.yellow} size={18} />
          </g>
        )}
        <Chip x={IMG.x + IMG.w / 2} y={IMG.y + IMG.h / 2} text="visualize() raises · no rectangle" color={INK.bad} size={18} opacity={noDraw * (1 - rectU)} />

        {/* ---- the response tape and its reading cursor ---------------------------- */}
        {VARIANTS.map((vv, i) => (
          <Tape key={vv.name} v={vv} opacity={tapeO[i]} p={vi === i ? p : 0} stagger={tapeU} halted={i === 2 ? stopU : 0} />
        ))}
        <Txt x={TAPE_X} y={PAYLOAD_Y + CELL_H + 16} size={14} fill={INK.muted} mono opacity={tapeU}>raw_output · {v.name}</Txt>

        {/* ---- the gauge ------------------------------------------------------------ */}
        {gaugeA > 0.003 && (
          <g opacity={gaugeA}>
            <rect x={GAUGE.x} y={GAUGE.y} width={GAUGE.w} height={GAUGE.h} rx={14} fill={INK.panel} stroke={colors.GRID} strokeWidth={1.5} />
            <Txt x={GAUGE.x + 16} y={GAUGE.y + 26} size={18} fill={INK.text} mono>parse_response → parse_answer</Txt>
            <Txt x={GAUGE.x + GAUGE.w - 16} y={GAUGE.y + 26} size={14} fill={INK.muted} anchor="end" mono>require_canonical=True</Txt>

            {/* grammar lamps */}
            <Txt x={GAUGE.x + 16} y={LAMP_Y + 5} size={16} fill={INK.muted}>grammar</Txt>
            {LAMPS.map((name, i) => {
              const cell = v.lampCell[i];
              const lit = cell >= 0 && p >= cell + 0.7;
              const failed = vi === 2 && cell < 0 && stopU > 0.5 && i === 4;
              const color = failed ? INK.bad : lit ? INK.ok : INK.faint;
              return (
                <g key={name}>
                  <circle cx={LAMP_X0 + i * LAMP_STEP} cy={LAMP_Y} r={8} fill={lit || failed ? color : 'none'} stroke={color} strokeWidth={1.8} />
                  <Txt x={LAMP_X0 + i * LAMP_STEP} y={LAMP_Y + 28} size={13} fill={lit ? INK.text : INK.muted} anchor="middle" mono>{name}</Txt>
                </g>
              );
            })}

            {/* geometry dock */}
            <Txt x={GAUGE.x + 16} y={DOCK_Y + 24} size={16} fill={INK.muted}>geometry</Txt>
            {v.coords ? v.coords.map((q, i) => {
              const u = ease.move(clamp01(dockU - i));
              if (u <= 0) return null;
              const src = v.cells[4 + i];
              const x = lerp(src.x + src.w / 2 - DOCK_W / 2, DOCK_X0 + i * DOCK_STEP, u);
              const y = lerp(src.y + CELL_H / 2 - DOCK_H / 2, DOCK_Y, u);
              const badQ = q > GRID_MAX && stopU > 0.5;
              return (
                <g key={i} opacity={0.3 + 0.7 * u}>
                  <rect x={x} y={y} width={DOCK_W} height={DOCK_H} rx={6} fill={INK.bg} stroke={badQ ? INK.bad : INK.coord} strokeWidth={badQ ? 2.5 : 1.5} />
                  <text x={x + DOCK_W / 2} y={y + DOCK_H / 2 + 8} fontSize={q > GRID_MAX ? 22 : 24} textAnchor="middle" fill={badQ ? INK.bad : INK.coord} fontFamily={MONO}>{q}</text>
                </g>
              );
            }) : (
              <Txt x={DOCK_X0} y={DOCK_Y + 24} size={18} fill={INK.yellow} mono opacity={clamp01(p - 4.5)}>None → no coordinates to validate</Txt>
            )}
            {/* geometry checks (MathLabel) with verdicts */}
            {CHECK_TEX.map((tex, j) => {
              const u = clamp01(checksU - j);
              if (u <= 0) return null;
              const fail = j === 0 && vi === 2 && stopU > 0.5;
              const color = fail ? INK.bad : INK.text;
              return (
                <g key={tex} opacity={u}>
                  <MathLabel tex={tex} x={CHECK_X} y={CHECK_Y[j]} fontSize={19} anchor="start" color={color} />
                  <Txt x={GAUGE.x + GAUGE.w - 20} y={CHECK_Y[j] + 7} size={20} fill={fail ? INK.bad : INK.ok} anchor="end" weight={700}>{fail ? '✗' : '✓'}</Txt>
                </g>
              );
            })}
            {vi === 2 && stopU > 0.5 && (
              <Txt x={CHECK_X} y={CHECK_Y[1] + 6} size={14} fill={INK.muted} opacity={clamp01(checksU)}>later checks not reached</Txt>
            )}

            {/* completion latch — separate from the grammar. Row label · toggle · value · verdict occupy
                disjoint x ranges (636..765 · 782..830 · 842..954 · 1039..1184) so nothing overprints */}
            <Txt x={GAUGE.x + 16} y={COMPLETION_Y + 5} size={16} fill={INK.muted} mono>finish_reason</Txt>
            <rect x={TOGGLE_X - 24} y={COMPLETION_Y - 12} width={48} height={24} rx={12} fill={INK.bg} stroke={finishIsStop ? INK.ok : INK.bad} strokeWidth={1.8} />
            <circle cx={lerp(TOGGLE_X - 12, TOGGLE_X + 12, finishLen)} cy={COMPLETION_Y} r={8} fill={finishIsStop ? INK.ok : INK.bad} />
            <Txt x={TOGGLE_X + 36} y={COMPLETION_Y + 6} size={18} fill={finishIsStop ? INK.ok : INK.bad} mono>{`= "${finishIsStop ? 'stop' : 'length'}"`}</Txt>
            <Txt x={GAUGE.x + GAUGE.w - 20} y={COMPLETION_Y + 6} size={18} fill={valid ? INK.ok : grammarDone || parseError ? INK.bad : INK.muted} anchor="end" mono>
              {grammarDone || parseError ? `valid = ${valid ? 'True' : 'False'}` : 'valid = …'}
            </Txt>
          </g>
        )}

        {/* ---- status card ------------------------------------------------------------ */}
        {card && cardsO > 0.003 && (
          <g opacity={cardsO * noteO}>
            <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={12} fill={INK.panel} stroke={card.color} strokeWidth={1.2} opacity={0.95} />
            <Txt x={CARD.x + 16} y={CARD.y + 30} size={18} fill={card.color} mono={bi !== 8}>{card.title}</Txt>
            {card.lines.map((line, i) => (
              <Txt key={i} x={CARD.x + 16} y={CARD.y + 60 + i * 26} size={16} fill={bi === 8 && i === 0 ? INK.coord : INK.muted} mono={bi !== 8}>{line}</Txt>
            ))}
          </g>
        )}

        {/* ---- pixel formulas under the picture ---------------------------------------- */}
        <MathLabel tex={'x_{px} = \\frac{q_x}{999}\\,(W-1)\\qquad y_{px} = \\frac{q_y}{999}\\,(H-1)'} x={IMG.x} y={452} fontSize={22} anchor="start" opacity={formU} />
        <MathLabel tex={'W = 1000,\\ H = 600:\\quad \\frac{500}{999}\\cdot 999 = 500'} x={IMG.x} y={496} fontSize={22} anchor="start" opacity={formNumU} color={INK.coord} />
        <MathLabel tex={`(${RED_BOX.join(',\\,')}) \\to ${PX_TEX}`} x={IMG.x} y={540} fontSize={22} anchor="start" opacity={formNumU} color={INK.coord} />

        {/* ---- the retrace ring ------------------------------------------------------- */}
        {ring && retraceU < 3 && (
          <circle cx={ring.x} cy={ring.y} r={ring.r} fill="none" stroke={INK.coord} strokeWidth={2.5} opacity={0.9} />
        )}
      </Camera>

      {/* ---- closing label on an opaque panel ------------------------------------------ */}
      {panelU > 0.003 && (
        <g opacity={panelU}>
          <rect x={620} y={272} width={580} height={100} rx={16} fill={INK.bg} />
          <rect x={620} y={272} width={580} height={100} rx={16} fill={INK.panel} stroke={INK.coord} strokeWidth={1.5} />
          <Txt x={910} y={314} size={24} weight={700} anchor="middle">phrase → tokens → checked geometry</Txt>
          <Txt x={910} y={346} size={15} fill={INK.muted} anchor="middle" mono>predict · parse_answer · visualize</Txt>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
