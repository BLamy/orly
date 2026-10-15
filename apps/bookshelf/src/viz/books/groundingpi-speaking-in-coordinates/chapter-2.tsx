// Speaking in Coordinates — chapter 2: An image becomes a sentence
//
// Source evidence (github.com/groundingpi/GroundingPI @ 0047d4510e201fecfd77126f6036088638aa85d2):
//   grounding_pi/client.py L77-L98  — GroundingPi.predict(image, phrase, task="bbox"): builds the
//     referring prompt, sends one "image_url" (base64 data URI) part and one "text" part to
//     /chat/completions, then parse_response
//   models/vlm/modeling_groundingpi.py L964-L1013 — GroundingPITwoLayerProjector:
//     merge_area = spatial_merge_size ** 2 (= 4); input_size = hidden_size * merge_area;
//     item = self.pre_norm(item).reshape(item.shape[0], self.input_size): pre_norm is a LayerNorm over
//     EACH 1024-wide feature of the [tokens, 4, 1024] group, THEN the four are flattened to [tokens, 4096],
//     then fc1 → GELU → fc2 → post_norm (RMSNorm); nn.Linear(..., bias=False). No norm spans the 4096
//     vector. GroundingPIVisionModel:
//     vision_tower = MoonViT3dPretrainedModel(config); projector = GroundingPITwoLayerProjector
//   models/vlm/modeling_groundingpi.py L1301-L1355 — image_embeds = torch.cat(...);
//     image_mask from get_placeholder_mask; inputs_embeds = inputs_embeds.masked_scatter(image_mask,
//     image_embeds); outputs = self.language_model(inputs_embeds=...)
//   train/tokenizer/extend_tokens.py L135-L166 — coordinate tokens live in the same output vocabulary
//   paper §3.1 (arXiv 2609.39601) — MoonViT-V2 (Kimi K3) vision encoder, Qwen3-4B language decoder (P1)
//   paper §3.3 — supervised stage, then reinforcement stage scoring localization / coverage / format (P2)
//   README.md L338-L348 — the release is a grounding VLM; no direct action-policy adapter (C11)
//
// Exact canonical response (unbroken; shown on stage as a phrase row and a payload row, marker labels
// wrapped onto two lines for presentation only):
//   <|object_ref_start|>the red car<|object_ref_end|><|box_start|><100><200><500><650><|box_end|>
// The phrase "the red car" is ordinary text: several text tokens that the stage GROUPS INTO ONE DISPLAY
// CELL. Only the boundary markers and the coordinate values are single tokens (extend_tokens.py). The
// nine output cells are display segments of the serialized answer, not nine decoder steps, and no
// tokenizer ids or subword boundaries are asserted for the phrase.
//
// The picture, the 10 × 6 feature mosaic, the tile colors and the training insets are ILLUSTRATIVE
// display sampling / schematic diagrams. No attention, probability, loss, reward or accuracy is measured
// or implied. No robot action is animated.
import type { ReactNode } from 'react';
// Standalone blog sections mount this scene without ChapterPlayer's math stylesheet.
import 'katex/dist/katex.min.css';
import { interpolateRgb } from 'd3';
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

// ---------------------------------------------------------------------------
// Protocol facts (mirrors protocol.py)
// ---------------------------------------------------------------------------
const GRID_MAX = 999;
const OBJECT_REF_START = '<|object_ref_start|>';
const OBJECT_REF_END = '<|object_ref_end|>';
const BOX_START = '<|box_start|>';
const BOX_END = '<|box_end|>';
const PHRASE = 'the red car';
const RED_BOX = [100, 200, 500, 650] as const;
const PROMPT_PREFIX = 'Locate the target referred to by the following description: '; // REFER_BBOX_PROMPT_PREFIX
const coordToken = (v: number): string => {
  if (!Number.isInteger(v) || v < 0 || v > GRID_MAX) throw new Error(`coordinate ${v} is outside the inclusive grid [0, ${GRID_MAX}]`);
  return `<${v}>`;
};
const CANONICAL = `${OBJECT_REF_START}${PHRASE}${OBJECT_REF_END}${BOX_START}${RED_BOX.map(coordToken).join('')}${BOX_END}`;
if (CANONICAL !== '<|object_ref_start|>the red car<|object_ref_end|><|box_start|><100><200><500><650><|box_end|>') {
  throw new Error('canonical bbox serialization drifted from protocol.py');
}
const PROMPT = `${PROMPT_PREFIX}${PHRASE}.`; // build_refer_bbox_prompt("the red car")
if (PROMPT !== 'Locate the target referred to by the following description: the red car.') throw new Error('referring prompt drifted from protocol.py');

// projector shapes from modeling_groundingpi.py (K3 merged features [tokens, 4, 1024])
const SPATIAL_MERGE_SIZE = 2;
const MERGE_AREA = SPATIAL_MERGE_SIZE ** 2; // 4
const VISION_HIDDEN = 1024;
const PROJECTOR_INPUT = VISION_HIDDEN * MERGE_AREA; // 4096
if (MERGE_AREA !== 4 || PROJECTOR_INPUT !== 4096) throw new Error('projector shape drifted');

// ---------------------------------------------------------------------------
// Illustrative picture (W = 1000, H = 600) — identical cars, phrase and bbox to chapter 1
// ---------------------------------------------------------------------------
const IMG_W = 1000;
const IMG_H = 600;
const IMG = { x: 90, y: 125, w: 380, h: 228 } as const;
const gridToPx = (q: number, axis: 'x' | 'y'): number => (q / GRID_MAX) * ((axis === 'x' ? IMG_W : IMG_H) - 1);
const gx = (q: number): number => IMG.x + (gridToPx(q, 'x') / IMG_W) * IMG.w;
const gy = (q: number): number => IMG.y + (gridToPx(q, 'y') / IMG_H) * IMG.h;
const BLUE_BOX = [620, 420, 930, 800] as const;
const RED_STAGE = { x1: gx(RED_BOX[0]), y1: gy(RED_BOX[1]), x2: gx(RED_BOX[2]), y2: gy(RED_BOX[3]) } as const;
const BLUE_STAGE = { x1: gx(BLUE_BOX[0]), y1: gy(BLUE_BOX[1]), x2: gx(BLUE_BOX[2]), y2: gy(BLUE_BOX[3]) } as const;

// ---------------------------------------------------------------------------
// Tiny pure kit (local; no shared edits)
// ---------------------------------------------------------------------------
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const smooth = (u: number): number => { const c = clamp01(u); return c * c * (3 - 2 * c); };
const MONO = colors.font.mono;
const UI = colors.font.ui;
const INK = {
  phrase: colors.SECONDARY,
  marker: colors.TEAL,
  coord: colors.WARM,
  embed: colors.ACCENT,
  gold: colors.WARM,
  ok: colors.POSITIVE,
  car: '#e0484f',
  carDark: '#8f1f27',
  glass: '#9fd3ff',
  blue: '#3b5f8f',
  blueDark: '#243a5a',
  sky: '#162440',
  ground: '#262d3b',
  text: colors.TEXT,
  muted: colors.MUTED,
  faint: colors.MUTED,
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

function TapeCell({ x, y, w, h, lines, color, opacity = 1, ghost = false, glow = 0, size }: {
  x: number; y: number; w: number; h: number; lines: readonly string[]; color: string; opacity?: number; ghost?: boolean; glow?: number; size?: number;
}) {
  if (opacity <= 0.003) return null;
  const fs = size ?? (lines.length > 1 ? 18 : 24);
  return (
    <g opacity={opacity}>
      {glow > 0 && <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={12} fill="none" stroke={color} strokeWidth={3} opacity={glow} />}
      <rect x={x} y={y} width={w} height={h} rx={8} fill={ghost ? 'none' : INK.panel} stroke={color} strokeWidth={ghost ? 1.2 : 1.8} strokeDasharray={ghost ? '5 5' : undefined} opacity={ghost ? 0.55 : 1} />
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
// Display-sampled feature mosaic: 10 × 6 tiles over the picture (illustrative)
// ---------------------------------------------------------------------------
const COLS = 10;
const ROWS = 6;
const TILE = IMG.w / COLS; // 38
const norm = (box: readonly [number, number, number, number]) => ({
  x1: gridToPx(box[0], 'x') / IMG_W, y1: gridToPx(box[1], 'y') / IMG_H, x2: gridToPx(box[2], 'x') / IMG_W, y2: gridToPx(box[3], 'y') / IMG_H,
});
const RED_N = norm(RED_BOX);
const BLUE_N = norm(BLUE_BOX);
const inCar = (u: number, v: number, b: { x1: number; y1: number; x2: number; y2: number }): boolean => {
  const w = b.x2 - b.x1;
  const h = b.y2 - b.y1;
  const body = u >= b.x1 && u <= b.x2 && v >= b.y1 + 0.42 * h && v <= b.y1 + 0.8 * h;
  const cabin = u >= b.x1 + 0.2 * w && u <= b.x1 + 0.86 * w && v >= b.y1 + 0.04 * h && v < b.y1 + 0.42 * h;
  const wheels = v > b.y1 + 0.7 * h && v <= b.y2 && (Math.abs(u - (b.x1 + 0.24 * w)) < 0.15 * w || Math.abs(u - (b.x1 + 0.76 * w)) < 0.15 * w);
  return body || cabin || wheels;
};
const SHADES = {
  red: ['#d9434a', '#c43a41', '#e85a60'],
  blue: ['#3b5f8f', '#34547f', '#44699b'],
  ground: ['#2a3140', '#2f3747', '#262d3b'],
  sky: ['#1a2744', '#1e2d4e', '#17233d'],
} as const;
interface Tile { idx: number; r: number; c: number; x: number; y: number; color: string; inGroup: boolean }
const GROUP = { r0: 2, c0: 2 } as const; // the 2 × 2 block the camera follows (rows 2-3, cols 2-3: red car body)
const TILES: Tile[] = Array.from({ length: ROWS * COLS }, (_, idx) => {
  const r = Math.floor(idx / COLS);
  const c = idx % COLS;
  const u = (c + 0.5) / COLS;
  const v = (r + 0.5) / ROWS;
  const shade = (r * 7 + c * 13) % 3;
  const cls = inCar(u, v, RED_N) ? 'red' : inCar(u, v, BLUE_N) ? 'blue' : v > 0.72 ? 'ground' : 'sky';
  const inGroup = r >= GROUP.r0 && r < GROUP.r0 + 2 && c >= GROUP.c0 && c < GROUP.c0 + 2;
  return { idx, r, c, x: IMG.x + c * TILE, y: IMG.y + r * TILE, color: SHADES[cls][shade], inGroup };
});
// 2x2 block order (the Qwen2VL processor already emits patches in that order)
const GROUP_TILES = TILES.filter((t) => t.inGroup).sort((a, b) => (a.r - b.r) || (a.c - b.c));
if (GROUP_TILES.length !== MERGE_AREA) throw new Error('the 2 × 2 group must hold exactly four tiles');

// ---------------------------------------------------------------------------
// Station (projector) geometry
// ---------------------------------------------------------------------------
const ROW_Y = 240; // merged-row center line
const ROW_X0 = 533; // the four folded feature vectors start left of pre_norm (533..727; pre_norm edge 731)
const ROW_END_X = 1140; // the finished embedding cell center
// station order mirrors forward(): pre_norm on each of the four 1024-wide features, THEN the reshape to
// 4096 (FLAT_X, no learned layer and no norm there), then fc1 → GELU → fc2 → post_norm.
// Sub-labels alternate between two rows so neighbours never overprint at the beat-3 zoom.
const SHUTTERS = [
  { x: 744, label: 'pre_norm', sub: 'LayerNorm · each 1024' },
  { x: 864, label: 'fc1', sub: '4096 → hidden' },
  { x: 936, label: 'GELU', sub: 'nn.GELU()' },
  { x: 1008, label: 'fc2', sub: 'hidden → out' },
  { x: 1080, label: 'post_norm', sub: 'RMSNorm' },
] as const;
const FLAT_X = (SHUTTERS[0].x + SHUTTERS[1].x) / 2; // 804 — reshape point, after pre_norm, before fc1
const toSecondary = (c: string, u: number): string => interpolateRgb(c, INK.phrase)(u);
const toTeal = (c: string, u: number): string => interpolateRgb(c, INK.marker)(u);
const toEmbed = (c: string, u: number): string => interpolateRgb(c, INK.embed)(u);

// ---------------------------------------------------------------------------
// Tapes
// ---------------------------------------------------------------------------
type Cls = 'marker' | 'phrase' | 'coord';
interface CellSpec { key: string; lines: readonly string[]; w: number; cls: Cls }
interface Cell extends CellSpec { x: number }
const GAP = 8;
const layoutRow = (specs: readonly CellSpec[], x0: number): Cell[] => {
  let x = x0;
  return specs.map((c) => { const cell = { ...c, x }; x += c.w + GAP; return cell; });
};
// input sequence: 15 image positions (one per 2×2 group: 10×6 tiles → 5×3 groups) + prompt tokens
const N_IMAGE_SLOTS = (COLS / SPATIAL_MERGE_SIZE) * (ROWS / SPATIAL_MERGE_SIZE); // 15
const IN_Y = 424;
const IN_H = 40;
const SLOT_W = 30;
const SLOT_STEP = 34;
const SLOT_X0 = 120;
const slotX = (i: number): number => SLOT_X0 + i * SLOT_STEP;
const PREFIX_CELL = { x: slotX(N_IMAGE_SLOTS) + 4, w: 232, lines: ['Locate the target …'] } as const;
const IN_PHRASE_CELL = { x: PREFIX_CELL.x + PREFIX_CELL.w + GAP, w: 160, lines: [PHRASE] } as const;
const CHIP_HOME = { x: IMG.x + IMG.w / 2, y: 404 } as const;
const CHIP_TAPE = { x: IN_PHRASE_CELL.x + IN_PHRASE_CELL.w / 2, y: IN_Y + IN_H / 2 } as const;

// output tape (the canonical response), two rows, left-aligned with the input tape
const OUT_X = 120;
const CELL_H = 44;
const PHRASE_Y = 496;
const PAYLOAD_Y = 550;
const PHRASE_CELLS = layoutRow([
  { key: 'ref_start', lines: ['<|object_ref_', 'start|>'], w: 152, cls: 'marker' },
  { key: 'phrase', lines: [PHRASE], w: 160, cls: 'phrase' },
  { key: 'ref_end', lines: ['<|object_ref_', 'end|>'], w: 152, cls: 'marker' },
], OUT_X);
const PAYLOAD_CELLS = layoutRow([
  { key: 'box_start', lines: ['<|box_', 'start|>'], w: 96, cls: 'marker' },
  { key: 'c0', lines: [coordToken(RED_BOX[0])], w: 84, cls: 'coord' },
  { key: 'c1', lines: [coordToken(RED_BOX[1])], w: 84, cls: 'coord' },
  { key: 'c2', lines: [coordToken(RED_BOX[2])], w: 84, cls: 'coord' },
  { key: 'c3', lines: [coordToken(RED_BOX[3])], w: 84, cls: 'coord' },
  { key: 'box_end', lines: ['<|box_', 'end|>'], w: 96, cls: 'marker' },
], OUT_X);
// display order = serialization order. Each cell is one DISPLAY SEGMENT of the answer: markers and
// coordinate values are single tokens, while the phrase cell groups the phrase's ordinary text tokens.
const OUT_CELLS: Array<Cell & { y: number }> = [
  ...PHRASE_CELLS.map((c) => ({ ...c, y: PHRASE_Y })),
  ...PAYLOAD_CELLS.map((c) => ({ ...c, y: PAYLOAD_Y })),
];
const N_OUT = OUT_CELLS.length; // 9 display segments (not 9 decoder steps)
const CLS_COLOR: Record<Cls, string> = { marker: INK.marker, phrase: INK.phrase, coord: INK.coord };
// the read head's prefix path: every input position, then every output segment already written (the
// head sweeps the prefix once per display segment; the phrase segment stands for several text tokens)
const PREFIX_PATH: Array<{ x: number; y: number }> = [
  ...Array.from({ length: N_IMAGE_SLOTS }, (_, i) => ({ x: slotX(i) + SLOT_W / 2, y: IN_Y + IN_H / 2 })),
  { x: PREFIX_CELL.x + PREFIX_CELL.w / 2, y: IN_Y + IN_H / 2 },
  { x: CHIP_TAPE.x, y: CHIP_TAPE.y },
];
const OUT_CENTERS = OUT_CELLS.map((c) => ({ x: c.x + c.w / 2, y: c.y + CELL_H / 2 }));

// request boundary (beat 0) and vocabulary shelf (beat 6) share the station region
const REQ = { x: 560, y: 150, w: 500, h: 150 } as const;
const SHELF = [
  { label: 'labels / words', color: INK.phrase },
  { label: 'boundary markers', color: INK.marker },
  { label: '<0> … <999>', color: INK.coord },
] as const;
const HEAD = { x: 1000, y: 266, r: 32 } as const;

// paper-method inset (gold edge) in the station region
const INSET = { x: 560, y: 118, w: 640, h: 252 } as const;
const MINI_W = 48;
const MINI_X0 = 700;
const G_CANDIDATES = 8;
const CHECKED_ROW = 2;

const CAPTIONS = [
  { at: 0.4, text: 'The released client sends an image and a referring phrase together to the model service.' },
  { at: 7.9, text: 'A vision encoder turns the image into a grid of visual features.' },
  { at: 15.4, text: 'The projector groups neighboring features in squares of two by two.' },
  { at: 22.9, text: 'Two learned layers transform each merged group into the language model’s embedding space.' },
  { at: 30.4, text: 'Those visual embeddings fill image positions in the input sequence, alongside the words of the query.' },
  { at: 37.9, text: 'The language decoder predicts the next output token using the image, the query, and the tokens already written.' },
  { at: 45.4, text: 'Labels, boundary markers, and coordinates all come from that same output vocabulary.' },
  { at: 52.9, text: 'In the paper’s supervised stage, examples teach the model to match locations and follow the output format.' },
  { at: 60.4, text: 'Reinforcement training then scores sampled answers for localization, target coverage, and structured output quality.' },
  { at: 67.9, text: 'The released inference path uses those learned weights to generate a grounding answer for the image and phrase.' },
] as const;
const CAPTION_DUR = 6.8;
const TOTAL = 77.0;

const NOTES: ReadonlyArray<readonly [string, string]> = [
  ['grounding_pi/client.py · GroundingPi.predict', 'image_url (base64 data URI) + text prompt'],
  ['models/vlm/modeling_groundingpi.py', 'vision_tower = MoonViT3dPretrainedModel(config)'],
  ['GroundingPITwoLayerProjector', 'merge_area = spatial_merge_size ** 2 = 4'],
  ['pre_norm(each) · reshape 4096 · fc1 · GELU · fc2 · post_norm', 'LayerNorm per feature · nn.Linear(bias=False) · RMSNorm'],
  ['modeling_groundingpi.py · get_placeholder_mask', 'inputs_embeds.masked_scatter(image_mask, …)'],
  ['paper §3.1 · language decoder', 'language_model = AutoModel.from_config(…)'],
  ['train/tokenizer/extend_tokens.py', 'words · markers · <0>…<999> · one vocabulary'],
  ['paper §3.3 · supervised stage', 'schematic · no measured loss'],
  ['paper §3.3 · reinforcement stage', 'schematic · no measured reward'],
  ['README.md · release scope', 'grounding VLM · no action-policy adapter'],
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
  const artO = tl.channel('artO', 1); // the photo artwork under the mosaic
  const chipU = tl.channel('chipU', 0);
  const reqU = tl.channel('reqU', 0); // request boundary draw-on
  const reqP = tl.channel('reqP', 0); // two lane packets
  const reqO = tl.channel('reqO', 1);
  const inTapeU = tl.channel('inTapeU', 0); // empty input slots
  const mosaicU = tl.channel('mosaicU', 0); // tiles stagger in
  const mosaicO = tl.channel('mosaicO', 1);
  const encU = tl.channel('encU', 0); // encoder labels
  const groupU = tl.channel('groupU', 0); // the 2 × 2 block highlighted
  const foldU = tl.channel('foldU', 0); // four tiles fold side by side
  const foldLabelU = tl.channel('foldLabelU', 0);
  const shutU = tl.channel('shutU', 0); // shutters enter
  const projU = tl.channel('projU', 0); // the merged row travels through the projector
  const stationO = tl.channel('stationO', 1);
  const scatterU = tl.channel('scatterU', 0); // embeddings fill the image slots
  const scatLabelU = tl.channel('scatLabelU', 0);
  const chipMoveU = tl.channel('chipMoveU', 0); // phrase chip joins the input tape
  const decU = tl.channel('decU', 0); // decoder label
  const genU = tl.channel('genU', 0); // 0..9 output cells written
  const shelfU = tl.channel('shelfU', 0);
  const shelfO = tl.channel('shelfO', 1);
  const insetU = tl.channel('insetU', 0);
  const insetO = tl.channel('insetO', 1);
  const alignU = tl.channel('alignU', 0); // 0..9 alignment ticks
  const sftO = tl.channel('sftO', 1);
  const candU = tl.channel('candU', 0); // 0..1 eight candidate tapes
  const checkU = tl.channel('checkU', 0);
  const inTapeO = tl.channel('inTapeO', 1);
  const bandO = tl.channel('bandO', 1); // the bottom tape band hides while the camera is inside the station
  const badgeO = tl.channel('badgeO', 1); // the picture badge hides while the picture is off-frame
  const panelU = tl.channel('panelU', 0);

  // BEAT 0 — the request: image_url lane + text lane into GroundingPi.predict
  tl.tween(imgU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(chipU, 1, { at: 2.0, dur: 0.6, ease: ease.enter });
  tl.tween(reqU, 1, { at: 2.6, dur: 1.0, ease: ease.draw });
  tl.tween(reqP, 1, { at: 3.6, dur: 1.4, ease: ease.linear });
  tl.tween(inTapeU, 1, { at: 5.2, dur: 0.8, ease: ease.enter });

  // BEAT 1 — the encoder: picture → feature mosaic
  tl.tween(reqO, 0, { at: 7.9, dur: 0.6, ease: ease.enter });
  tl.tween(mosaicU, 1, { at: 8.4, dur: 1.6, ease: ease.linear });
  tl.tween(artO, 0.15, { at: 8.6, dur: 1.2, ease: ease.enter });
  tl.tween(encU, 1, { at: 9.8, dur: 0.6, ease: ease.enter });

  // BEAT 2 — push into one 2 × 2 block; fold its four tiles side by side (four separate vectors)
  tl.tween(bandO, 0, { at: 15.4, dur: 0.6, ease: ease.enter });
  tl.tween(encU, 0, { at: 15.4, dur: 0.6, ease: ease.enter }); // encoder labels would land in the header band at 1.6×
  tl.tween(cam, { x: 450, y: 245, k: 1.6 }, { at: 15.6, dur: 1.4, ease: ease.move });
  tl.tween(groupU, 1, { at: 16.2, dur: 0.8, ease: ease.enter });
  tl.tween(foldU, 1, { at: 17.4, dur: 1.4, ease: ease.move });
  tl.tween(foldLabelU, 1, { at: 18.8, dur: 0.6, ease: ease.enter });

  // BEAT 3 — through pre_norm (each vector), the reshape to 4096, fc1, GELU, fc2, post_norm
  tl.tween(cam, { x: 820, y: 250, k: 1.4 }, { at: 23.0, dur: 1.3, ease: ease.move });
  tl.tween(badgeO, 0, { at: 23.0, dur: 0.6, ease: ease.enter });
  tl.tween(shutU, 1, { at: 23.4, dur: 0.8, ease: ease.enter });
  tl.tween(projU, 1, { at: 24.4, dur: 2.8, ease: ease.linear });

  // BEAT 4 — masked_scatter: embeddings fill the empty image positions; the phrase sits beside them
  tl.tween(cam, CAMERA_HOME, { at: 30.6, dur: 1.3, ease: ease.move });
  tl.tween(bandO, 1, { at: 31.6, dur: 0.6, ease: ease.enter });
  tl.tween(badgeO, 1, { at: 31.4, dur: 0.6, ease: ease.enter });
  tl.tween(scatterU, 1, { at: 31.6, dur: 2.2, ease: ease.linear });
  tl.tween(scatLabelU, 1, { at: 32.4, dur: 0.6, ease: ease.enter });
  tl.tween(chipMoveU, 1, { at: 34.0, dur: 1.2, ease: ease.move });

  // BEAT 5 — the decoder fills the answer one display segment at a time; the read head sweeps the prefix
  tl.tween(stationO, 0, { at: 38.0, dur: 0.6, ease: ease.enter });
  tl.tween(groupU, 0, { at: 38.0, dur: 0.6, ease: ease.enter });
  tl.tween(decU, 1, { at: 38.4, dur: 0.6, ease: ease.enter });
  tl.tween(genU, 4, { at: 38.6, dur: 6.0, ease: ease.linear });

  // BEAT 6 — one vocabulary shelf feeds one output head; the coordinates follow
  tl.tween(shelfU, 1, { at: 45.8, dur: 1.0, ease: ease.enter });
  tl.tween(genU, N_OUT, { at: 46.8, dur: 5.5, ease: ease.linear });

  // BEAT 7 — paper method: supervised stage (schematic)
  tl.tween(shelfO, 0, { at: 52.9, dur: 0.5, ease: ease.enter });
  tl.tween(decU, 0, { at: 52.9, dur: 0.5, ease: ease.enter });
  tl.tween(insetU, 1, { at: 53.4, dur: 0.8, ease: ease.enter });
  tl.tween(alignU, N_OUT, { at: 54.6, dur: 2.4, ease: ease.linear });

  // BEAT 8 — paper method: reinforcement stage, G = 8 sampled answers (schematic)
  tl.tween(sftO, 0, { at: 60.6, dur: 0.6, ease: ease.enter });
  tl.tween(candU, 1, { at: 61.0, dur: 1.6, ease: ease.linear });
  tl.tween(checkU, 1, { at: 63.2, dur: 0.8, ease: ease.enter });

  // BEAT 9 — quiet: picture, phrase, completed response
  tl.tween(insetO, 0, { at: 68.0, dur: 0.8, ease: ease.enter });
  tl.tween(mosaicO, 0, { at: 68.2, dur: 1.0, ease: ease.enter });
  tl.tween(artO, 1, { at: 68.2, dur: 1.0, ease: ease.enter });
  tl.tween(chipMoveU, 1, { at: 68.4, dur: 1.0, ease: ease.move }); // the phrase stays in its input slot; no chip bounce back
  tl.tween(inTapeO, 0.12, { at: 68.4, dur: 0.8, ease: ease.enter });
  tl.tween(panelU, 1, { at: 69.6, dur: 0.8, ease: ease.enter });
  tl.hold(TOTAL - 1, 1);

  return {
    tl, cam, beat, imgU, artO, chipU, reqU, reqP, reqO, inTapeU, mosaicU, mosaicO, encU, groupU, foldU, foldLabelU, shutU, projU, stationO,
    scatterU, scatLabelU, chipMoveU, decU, genU, shelfU, shelfO, insetU, insetO, alignU, sftO, candU, checkU, inTapeO, bandO, badgeO, panelU,
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
        <clipPath id="gpi-ch2-picture">
          <rect x={IMG.x} y={IMG.y} width={IMG.w * u} height={IMG.h} rx={6} />
        </clipPath>
      </defs>
      <g clipPath="url(#gpi-ch2-picture)">
        <rect x={IMG.x} y={IMG.y} width={IMG.w} height={IMG.h} fill={INK.sky} />
        <rect x={IMG.x} y={horizon} width={IMG.w} height={IMG.y + IMG.h - horizon} fill={INK.ground} />
        <line x1={IMG.x} y1={horizon} x2={IMG.x + IMG.w} y2={horizon} stroke="#3a4356" strokeWidth={1.5} />
        <line x1={IMG.x + 16} y1={IMG.y + IMG.h - 16} x2={IMG.x + IMG.w - 16} y2={IMG.y + IMG.h - 16} stroke="#4b5366" strokeWidth={3} strokeDasharray="20 16" />
        <Car {...BLUE_STAGE} body={INK.blue} dark={INK.blueDark} opacity={0.85} />
        <Car {...RED_STAGE} body={INK.car} dark={INK.carDark} />
      </g>
    </g>
  );
}

/**
 * Where the i-th group tile sits once folded into the row, at projector progress p.
 * The four vectors stay separate (gap 6) through pre_norm — each is normalized on its own — and close
 * ranks only at FLAT_X, the reshape to one 4096-wide vector, before fc1.
 */
function rowCell(i: number, p: number): { x: number; y: number; w: number; color: string; glow: number; merged: number } {
  const base = GROUP_TILES[i].color;
  const xc = lerp(ROW_X0 + (4 * 44 + 3 * 6) / 2, ROW_END_X, p); // row center travels right
  const s = SHUTTERS.map((sh) => smooth((xc - sh.x) / 36 + 0.5));
  const flat = smooth((xc - FLAT_X) / 36 + 0.5);
  const gap = 6 * (1 - flat);
  const w = lerp(lerp(44, 32, flat), 15, s[3]);
  const total = 4 * w + 3 * gap;
  const x = xc - total / 2 + i * (w + gap);
  let color = base;
  color = interpolateRgb(color, '#cbd5e1')(s[0] * 0.3); // pre_norm: each feature re-scaled, still four
  color = toSecondary(color, s[1] * 0.85);
  color = toTeal(color, s[2] * 0.6);
  color = toEmbed(color, s[3]);
  return { x, y: ROW_Y - 22, w, color, glow: s[4], merged: flat };
}
/** Progress of the row center past the reshape point (0 before pre_norm's output is flattened). */
const flatU = (p: number): number => smooth((lerp(ROW_X0 + (4 * 44 + 3 * 6) / 2, ROW_END_X, p) - FLAT_X) / 36 + 0.5);

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const bi = Math.round(b);
  const noteO = 1 - clamp01(Math.abs(b - bi) * 2);
  const imgU = s.get(scene.imgU);
  const artO = s.get(scene.artO);
  const chipU = s.get(scene.chipU);
  const reqU = s.get(scene.reqU);
  const reqP = s.get(scene.reqP);
  const reqO = s.get(scene.reqO);
  const inTapeU = s.get(scene.inTapeU);
  const inTapeO = s.get(scene.inTapeO);
  const mosaicU = s.get(scene.mosaicU);
  const mosaicO = s.get(scene.mosaicO);
  const encU = s.get(scene.encU);
  const groupU = s.get(scene.groupU);
  const foldU = s.get(scene.foldU);
  const foldLabelU = s.get(scene.foldLabelU);
  const shutU = s.get(scene.shutU);
  const projU = s.get(scene.projU);
  const stationO = s.get(scene.stationO);
  const scatterU = s.get(scene.scatterU);
  const scatLabelU = s.get(scene.scatLabelU);
  const chipMoveU = s.get(scene.chipMoveU);
  const decU = s.get(scene.decU);
  const genU = s.get(scene.genU);
  const shelfU = s.get(scene.shelfU) * s.get(scene.shelfO);
  const insetA = s.get(scene.insetU) * s.get(scene.insetO);
  const alignU = s.get(scene.alignU);
  const sftO = s.get(scene.sftO);
  const candU = s.get(scene.candU);
  const checkU = s.get(scene.checkU);
  const panelU = s.get(scene.panelU);
  const bandO = s.get(scene.bandO);
  const badgeO = s.get(scene.badgeO);

  const foldVis = foldU * stationO; // folded copies exist only while the station is alive
  const chipPos = { x: lerp(CHIP_HOME.x, CHIP_TAPE.x, chipMoveU), y: lerp(CHIP_HOME.y, CHIP_TAPE.y, chipMoveU) };
  const laneA = { from: { x: IMG.x + IMG.w, y: IMG.y + IMG.h * 0.5 }, to: { x: REQ.x, y: REQ.y + 48 } };
  const laneB = { from: { x: CHIP_HOME.x + 90, y: CHIP_HOME.y }, to: { x: REQ.x, y: REQ.y + 104 } };

  // autoregressive state
  const k = Math.min(N_OUT, Math.floor(genU + 1e-9));
  const f = genU - k;
  const writing = k < N_OUT && f > 0;
  const path = writing ? [...PREFIX_PATH, ...OUT_CENTERS.slice(0, k)] : PREFIX_PATH;
  let head = { x: 0, y: 0, o: 0 };
  if (writing) {
    const o = f < 0.1 ? f / 0.1 : f > 0.92 ? (1 - f) / 0.08 : 1;
    if (f < 0.75) {
      const idx = (f / 0.75) * (path.length - 1);
      const i0 = Math.floor(idx);
      const i1 = Math.min(path.length - 1, i0 + 1);
      const u = idx - i0;
      head = { x: lerp(path[i0].x, path[i1].x, u), y: lerp(path[i0].y, path[i1].y, u), o };
    } else {
      head = { x: OUT_CENTERS[k].x, y: OUT_CENTERS[k].y, o };
    }
  }
  const cellVis = (i: number): number => (i < k ? 1 : i === k ? clamp01((f - 0.75) / 0.12) : 0);
  const emitPulse = writing ? clamp01((f - 0.75) / 0.08) * (1 - clamp01((f - 0.9) / 0.1)) : 0;

  return (
    <>
      <rect width={1280} height={720} fill={INK.bg} />
      <Txt x={640} y={55} size={28} weight={750} anchor="middle">An image becomes a sentence</Txt>
      <g opacity={noteO}>
        <Txt x={1206} y={92} size={15} fill={INK.muted} anchor="end" mono>{NOTES[bi][0]}</Txt>
        <Txt x={1206} y={112} size={15} fill={INK.muted} anchor="end" mono>{NOTES[bi][1]}</Txt>
      </g>

      <Camera {...s.get(scene.cam)}>
        {/* ---- the picture and its feature mosaic ------------------------------ */}
        <Picture u={imgU} opacity={artO} />
        {mosaicO > 0.003 && TILES.map((t) => {
          const u = clamp01((mosaicU * 70 - t.idx) / 10);
          if (u <= 0) return null;
          const dim = t.inGroup ? 1 : 1 - 0.65 * groupU * stationO;
          const vis = t.inGroup ? 1 - foldVis : 1;
          return (
            <rect key={t.idx} x={t.x + 1} y={t.y + 1} width={TILE - 2} height={TILE - 2} rx={3} fill={t.color} stroke={colors.GRID} strokeWidth={1}
              opacity={u * dim * vis * mosaicO} />
          );
        })}
        {groupU > 0.003 && (
          <rect x={IMG.x + GROUP.c0 * TILE} y={IMG.y + GROUP.r0 * TILE} width={2 * TILE} height={2 * TILE} rx={4} fill="none" stroke={INK.coord} strokeWidth={2.5} opacity={groupU * stationO} />
        )}
        <rect x={IMG.x} y={IMG.y} width={IMG.w} height={IMG.h} rx={6} fill="none" stroke={colors.GRID} strokeWidth={1.5} opacity={imgU} />
        <Txt x={IMG.x} y={IMG.y + IMG.h + 20} size={14} fill={INK.muted} mono opacity={imgU * badgeO}>Illustrative image and coordinates · W = 1000, H = 600</Txt>
        <Txt x={IMG.x} y={100} size={18} fill={INK.text} mono opacity={encU}>MoonViT-V2 (paper) · MoonViT3dPretrainedModel (code)</Txt>
        <Txt x={IMG.x} y={118} size={14} fill={INK.muted} mono opacity={encU}>illustrative feature layout · 10 × 6 display tiles, not real patch counts</Txt>

        {/* ---- beat 0: request boundary ------------------------------------------ */}
        {reqU > 0.003 && reqO > 0.003 && (
          <g opacity={reqO}>
            <rect x={REQ.x} y={REQ.y} width={REQ.w * reqU} height={REQ.h} rx={14} fill={INK.panel} stroke={INK.embed} strokeWidth={1.5} strokeDasharray="7 5" />
            <Txt x={REQ.x + 16} y={REQ.y - 12} size={16} fill={INK.embed} mono opacity={reqU}>GroundingPi.predict(image, phrase, task="bbox")</Txt>
            <Txt x={REQ.x + 18} y={REQ.y + 54} size={16} fill={INK.muted} mono opacity={reqU}>"image_url" · base64 data URI</Txt>
            <Txt x={REQ.x + 18} y={REQ.y + 110} size={16} fill={INK.phrase} mono opacity={reqU}>"text" · Locate the target … the red car.</Txt>
            <Txt x={REQ.x + 18} y={REQ.y + 136} size={14} fill={INK.faint} mono opacity={reqU}>POST /chat/completions · skip_special_tokens: false</Txt>
            <line x1={laneA.from.x} y1={laneA.from.y} x2={lerp(laneA.from.x, laneA.to.x, reqU)} y2={lerp(laneA.from.y, laneA.to.y, reqU)} stroke={INK.embed} strokeWidth={1.5} opacity={0.6} />
            <line x1={laneB.from.x} y1={laneB.from.y} x2={lerp(laneB.from.x, laneB.to.x, reqU)} y2={lerp(laneB.from.y, laneB.to.y, reqU)} stroke={INK.phrase} strokeWidth={1.5} opacity={0.6} />
            {reqP > 0 && reqP < 1 && (
              <>
                <circle cx={lerp(laneA.from.x, laneA.to.x, reqP)} cy={lerp(laneA.from.y, laneA.to.y, reqP)} r={7} fill={INK.embed} />
                <circle cx={lerp(laneB.from.x, laneB.to.x, reqP)} cy={lerp(laneB.from.y, laneB.to.y, reqP)} r={7} fill={INK.phrase} />
              </>
            )}
          </g>
        )}

        {/* ---- beats 1-3: the projector station ----------------------------------- */}
        {stationO > 0.003 && (
          <g opacity={stationO}>
            {/* shutters */}
            {SHUTTERS.map((sh, i) => {
              const u = clamp01(shutU * 5 - i * 0.8);
              if (u <= 0) return null;
              const norm = sh.label.endsWith('norm');
              return (
                <g key={sh.label} opacity={u}>
                  <rect x={sh.x - 13} y={ROW_Y - 58} width={26} height={116} rx={6} fill={INK.panel} stroke={norm ? INK.muted : INK.phrase} strokeWidth={norm ? 1.2 : 1.8} strokeDasharray={norm ? '4 4' : undefined} />
                  <Txt x={sh.x} y={ROW_Y + 84} size={16} fill={norm ? INK.muted : INK.text} anchor="middle" mono>{sh.label}</Txt>
                  <Txt x={sh.x} y={ROW_Y + (i % 2 === 0 ? 104 : 122)} size={14} fill={INK.faint} anchor="middle" mono>{sh.sub}</Txt>
                </g>
              );
            })}
            {/* the reshape point: four normalized 1024-wide vectors → one 4096-wide vector (no layer, no norm) */}
            {shutU > 0.003 && (
              <g opacity={clamp01(shutU * 5 - 0.8)}>
                <line x1={FLAT_X} y1={ROW_Y - 40} x2={FLAT_X} y2={ROW_Y + 40} stroke={INK.coord} strokeWidth={1} strokeDasharray="3 5" opacity={0.6} />
              </g>
            )}
            {projU > 0.02 && flatU(projU) > 0.003 && (
              <g opacity={flatU(projU)}>
                {/* both lines sit above the shutter tops (ROW_Y − 58) so the digits never touch pre_norm / fc1 */}
                <Txt x={FLAT_X} y={ROW_Y - 90} size={14} fill={INK.muted} anchor="middle">reshape · after pre_norm, before fc1</Txt>
                <MathLabel tex={`[\\,${MERGE_AREA},\\ ${VISION_HIDDEN}\\,] \\to ${PROJECTOR_INPUT}`} x={FLAT_X} y={ROW_Y - 68} fontSize={20} anchor="middle" color={INK.coord} />
              </g>
            )}
            {/* the four tiles: mosaic → merged row → through the shutters → one embedding */}
            {GROUP_TILES.map((t, i) => {
              const u = ease.move(clamp01(foldU * 1.3 - i * 0.1));
              if (u <= 0) return null;
              const rc = rowCell(i, projU);
              const x = lerp(t.x + 1, rc.x, u);
              const y = lerp(t.y + 1, rc.y, u);
              const w = lerp(TILE - 2, rc.w, u);
              const h = lerp(TILE - 2, 44, u);
              return (
                <g key={t.idx}>
                  {rc.glow > 0 && i === 0 && <rect x={rc.x - 8} y={rc.y - 8} width={4 * rc.w + 16} height={60} rx={10} fill="none" stroke={INK.embed} strokeWidth={2.5} opacity={rc.glow} />}
                  <rect x={x} y={y} width={w} height={h} rx={rc.merged > 0.5 ? 2 : 4} fill={rc.color} stroke={projU > 0.02 ? 'none' : colors.GRID} />
                </g>
              );
            })}
            {foldLabelU > 0.003 && shutU < 0.997 && (
              <g opacity={foldLabelU * (1 - shutU)}>
                {/* grouping only: four separate vectors; the 4096 flatten is shown later, after pre_norm */}
                <Txt x={ROW_X0} y={ROW_Y - 40} size={18} fill={INK.coord} mono>four neighboring features</Txt>
                <Txt x={ROW_X0} y={ROW_Y + 50} size={16} fill={INK.muted}>1024-wide each · not averaged</Txt>
                <MathLabel tex={`[\\,${MERGE_AREA},\\ ${VISION_HIDDEN}\\,]`} x={ROW_X0} y={ROW_Y + 88} fontSize={22} anchor="start" color={INK.text} />
              </g>
            )}
            {projU > 0.02 && (
              <g opacity={clamp01(projU * 6)}>
                {/* above the shutter tops (ROW_Y − 58) so the label never crosses post_norm */}
                <Txt x={ROW_END_X} y={ROW_Y - 84} size={18} fill={INK.embed} anchor="middle" mono opacity={clamp01((projU - 0.9) / 0.1)}>one visual embedding</Txt>
                <Txt x={ROW_END_X} y={ROW_Y - 66} size={14} fill={INK.muted} anchor="middle" opacity={clamp01((projU - 0.9) / 0.1)}>language-model width</Txt>
                <Txt x={560} y={ROW_Y + 140} size={14} fill={INK.faint}>colors mark a change of space · not measured activations</Txt>
              </g>
            )}
          </g>
        )}

        {/* ---- the input sequence: image positions + prompt tokens ---------------- */}
        {inTapeU > 0.003 && (
          <g opacity={inTapeU * inTapeO * bandO}>
            {Array.from({ length: N_IMAGE_SLOTS }, (_, i) => {
              const u = ease.move(clamp01((scatterU * (N_IMAGE_SLOTS + 4) - i) / 4));
              const x = lerp(ROW_END_X - SLOT_W / 2, slotX(i), u);
              const y = lerp(ROW_Y - 22, IN_Y, u);
              return (
                <g key={i}>
                  <rect x={slotX(i)} y={IN_Y} width={SLOT_W} height={IN_H} rx={5} fill="none" stroke={INK.muted} strokeWidth={1.2} strokeDasharray="4 4" opacity={0.55 * (1 - u)} />
                  {u > 0 && <rect x={x} y={y} width={SLOT_W} height={IN_H} rx={5} fill={INK.embed} opacity={0.35 + 0.65 * u} />}
                </g>
              );
            })}
            <Txt x={IN_PHRASE_CELL.x + IN_PHRASE_CELL.w} y={IN_Y - 10} size={14} fill={INK.muted} anchor="end" mono opacity={1 - scatLabelU}>input sequence · {N_IMAGE_SLOTS} image positions (empty) · prompt tokens</Txt>
            <Txt x={IN_PHRASE_CELL.x + IN_PHRASE_CELL.w} y={IN_Y - 10} size={18} fill={INK.embed} anchor="end" mono opacity={scatLabelU}>inputs_embeds.masked_scatter(image_mask, image_embeds)</Txt>
            <TapeCell x={PREFIX_CELL.x} y={IN_Y} w={PREFIX_CELL.w} h={IN_H} lines={PREFIX_CELL.lines} color={INK.muted} ghost opacity={1 - clamp01(chipMoveU * 3)} />
            <TapeCell x={PREFIX_CELL.x} y={IN_Y} w={PREFIX_CELL.w} h={IN_H} lines={PREFIX_CELL.lines} color={INK.muted} opacity={clamp01(chipMoveU * 3)} size={18} />
            <TapeCell x={IN_PHRASE_CELL.x} y={IN_Y} w={IN_PHRASE_CELL.w} h={IN_H} lines={IN_PHRASE_CELL.lines} color={INK.muted} ghost opacity={1 - clamp01((chipMoveU - 0.85) / 0.15)} />
            <TapeCell x={IN_PHRASE_CELL.x} y={IN_Y} w={IN_PHRASE_CELL.w} h={IN_H} lines={IN_PHRASE_CELL.lines} color={INK.phrase} opacity={clamp01((chipMoveU - 0.85) / 0.15)} size={20} />
          </g>
        )}
        {chipMoveU < 0.997 && <Chip x={chipPos.x} y={chipPos.y} text={PHRASE} color={INK.phrase} opacity={chipU * bandO} />}

        {/* ---- beats 5-6: the decoder and the vocabulary shelf -------------------- */}
        {decU > 0.003 && (
          <g opacity={decU}>
            <Txt x={880} y={170} size={20} fill={INK.text} anchor="middle" mono>Qwen3-4B (paper) · language_model (code)</Txt>
            <Txt x={880} y={196} size={16} fill={INK.muted} anchor="middle">autoregressive · the next token from the image, the query, and the written prefix</Txt>
          </g>
        )}
        {shelfU > 0.003 && (
          <g opacity={shelfU}>
            {SHELF.map((p, i) => {
              const y = 226 + i * 40;
              return (
                <g key={p.label}>
                  <rect x={620} y={y} width={240} height={30} rx={8} fill={INK.panel} stroke={p.color} strokeWidth={1.5} />
                  <Txt x={740} y={y + 21} size={16} fill={p.color} anchor="middle" mono>{p.label}</Txt>
                  <line x1={860} y1={y + 15} x2={HEAD.x - HEAD.r - 4} y2={HEAD.y} stroke={p.color} strokeWidth={1.5} opacity={0.7} />
                </g>
              );
            })}
            <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={INK.panel} stroke={INK.text} strokeWidth={2} />
            <Txt x={HEAD.x} y={HEAD.y + 6} size={16} fill={INK.text} anchor="middle" mono>head</Txt>
            <Txt x={HEAD.x + HEAD.r + 14} y={HEAD.y + 6} size={16} fill={INK.muted}>one output vocabulary</Txt>
            {emitPulse > 0 && k < N_OUT && (
              <line x1={HEAD.x} y1={HEAD.y + HEAD.r} x2={OUT_CENTERS[k].x} y2={OUT_CENTERS[k].y - CELL_H / 2} stroke={CLS_COLOR[OUT_CELLS[k].cls]} strokeWidth={2} strokeDasharray="6 6" opacity={emitPulse} />
            )}
          </g>
        )}

        {/* ---- the output tape (canonical response), revealed one display segment at a time --- */}
        {OUT_CELLS.map((c, i) => {
          const v = cellVis(i);
          return (
            <g key={c.key}>
              <TapeCell x={c.x} y={c.y} w={c.w} h={CELL_H} lines={c.lines} color={INK.muted} ghost opacity={inTapeU * (1 - v) * bandO} />
              <TapeCell x={c.x} y={c.y - (1 - v) * 8} w={c.w} h={CELL_H} lines={c.lines} color={CLS_COLOR[c.cls]} opacity={v} size={c.cls === 'phrase' ? 20 : undefined} />
            </g>
          );
        })}
        {head.o > 0.003 && (
          <g opacity={head.o}>
            <rect x={head.x - 4} y={head.y - 30} width={8} height={60} rx={4} fill={INK.text} opacity={0.9} />
            <rect x={head.x - 12} y={head.y - 36} width={24} height={72} rx={8} fill="none" stroke={INK.text} strokeWidth={1} opacity={0.35} />
          </g>
        )}
        <Txt x={OUT_X} y={PHRASE_Y - 10} size={14} fill={INK.muted} mono opacity={inTapeU * inTapeO * bandO}>output sequence · phrase tokens grouped for display · markers and &lt;0&gt;…&lt;999&gt; are single tokens</Txt>

        {/* ---- beats 7-8: paper-method inset (gold edge, schematic) ---------------- */}
        {insetA > 0.003 && (
          <g opacity={insetA}>
            <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} rx={14} fill={INK.bg} />
            <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} rx={14} fill={INK.panel} stroke={INK.gold} strokeWidth={2} />
            <Txt x={INSET.x + 20} y={INSET.y + 28} size={18} fill={INK.gold} mono>Paper method · §3.3 · schematic, not measured</Txt>
            {/* supervised: target over predicted, token-level alignment */}
            {sftO > 0.003 && (
              <g opacity={sftO}>
                <Txt x={INSET.x + 20} y={INSET.y + 86} size={18} fill={INK.text}>target</Txt>
                <Txt x={INSET.x + 20} y={INSET.y + 146} size={18} fill={INK.text}>predicted</Txt>
                {OUT_CELLS.map((c, i) => {
                  const x = MINI_X0 + i * (MINI_W + 6);
                  const a = clamp01(alignU - i);
                  return (
                    <g key={c.key}>
                      <rect x={x} y={INSET.y + 66} width={MINI_W} height={26} rx={5} fill={CLS_COLOR[c.cls]} opacity={0.85} />
                      <rect x={x} y={INSET.y + 126} width={MINI_W} height={26} rx={5} fill="none" stroke={CLS_COLOR[c.cls]} strokeWidth={1.6} />
                      <rect x={x} y={INSET.y + 126} width={MINI_W} height={26} rx={5} fill={CLS_COLOR[c.cls]} opacity={0.55 * a} />
                      <line x1={x + MINI_W / 2} y1={INSET.y + 92} x2={x + MINI_W / 2} y2={INSET.y + 92 + 34 * a} stroke={INK.gold} strokeWidth={1.5} opacity={a} />
                    </g>
                  );
                })}
                <Txt x={INSET.x + 20} y={INSET.y + 200} size={16} fill={INK.muted}>supervised: match locations, follow the format · illustrative</Txt>
              </g>
            )}
            {/* reinforcement: G = 8 candidate tapes, one marked on three criteria */}
            {candU > 0.003 && (
              <g>
                <Txt x={INSET.x + 20} y={INSET.y + 60} size={18} fill={INK.text} mono opacity={clamp01(candU * 3)}>G = {G_CANDIDATES} sampled answers</Txt>
                {Array.from({ length: G_CANDIDATES }, (_, r) => {
                  const u = clamp01((candU * (G_CANDIDATES + 2) - r) / 2);
                  if (u <= 0) return null;
                  const y = INSET.y + 72 + r * 18;
                  const hot = r === CHECKED_ROW;
                  return (
                    <g key={r} opacity={u}>
                      <Txt x={INSET.x + 36} y={y + 12} size={14} fill={INK.faint} mono>{r + 1}</Txt>
                      {OUT_CELLS.map((c, i) => (
                        <rect key={c.key} x={MINI_X0 + i * 30} y={y} width={26} height={14} rx={3} fill={CLS_COLOR[c.cls]} opacity={hot ? 0.9 : 0.35} />
                      ))}
                      {hot && checkU > 0.003 && (
                        <g opacity={checkU}>
                          <line x1={MINI_X0 + 9 * 30 + 4} y1={y + 7} x2={MINI_X0 + 9 * 30 + 24} y2={y + 7} stroke={INK.ok} strokeWidth={1.5} />
                          <Txt x={MINI_X0 + 9 * 30 + 32} y={y - 8} size={16} fill={INK.ok} mono>✓ location</Txt>
                          <Txt x={MINI_X0 + 9 * 30 + 32} y={y + 12} size={16} fill={INK.ok} mono>✓ coverage</Txt>
                          <Txt x={MINI_X0 + 9 * 30 + 32} y={y + 32} size={16} fill={INK.ok} mono>✓ format</Txt>
                        </g>
                      )}
                    </g>
                  );
                })}
                <Txt x={INSET.x + 20} y={INSET.y + 236} size={14} fill={INK.muted} opacity={clamp01(candU * 3)}>reward criteria shown as checkmarks only · no scores are measured here</Txt>
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* ---- closing label on an opaque panel -------------------------------------- */}
      {panelU > 0.003 && (
        <g opacity={panelU}>
          <rect x={580} y={196} width={600} height={100} rx={16} fill={INK.bg} />
          <rect x={580} y={196} width={600} height={100} rx={16} fill={INK.panel} stroke={INK.embed} strokeWidth={1.5} />
          <Txt x={880} y={238} size={24} weight={700} anchor="middle">learned perception → structured answer</Txt>
          <Txt x={880} y={270} size={15} fill={INK.muted} anchor="middle" mono>GroundingPi.predict → parse_response</Txt>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
