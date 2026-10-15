// Read the Gate
//
// Already Clean — chapter 2. Planned by Claude Sonnet 5.5 (.orly-work/visual-plan-sonnet.md, chapter 2);
// research and source checks by Claude Haiku 5.5. D3/SVG scene authored by Claude Opus 5.5:
// requested claude-opus-5-5, actual claude-opus-5-5 (session model id; launched through npx
// @anthropic-ai/claude-code, CLI build 2.1.300). Captions are the fixed narration contract, verbatim.
// Revision pass (Claude Opus 5.5, requested and actual claude-opus-5-5) after a Claude Haiku 5.5 contact-sheet critique.
//
// Sources (ledger IDs from .orly-work/research/neurons-claim-ledger.md):
//   V1–V4, G1–G2, P1–P3  essay + figure details   https://already-clean.goodfire.com/essay.md
//                                                 https://already-clean.goodfire.com/
//   V1, P1 (earlier readings)  Feature Visualization  https://distill.pub/2017/feature-visualization/
//                              Zoom In                https://distill.pub/2020/circuits/zoom-in/
//   Unit ids drawn on stage come from the essay's figures: 4e:55; inputs 4d:493, 4d:477, 4d:201;
//   readers 5a:94, 5a:352, 5a:317; the separate Zoom In circuit's car unit 4c:447.
//
// Schematic vs reported. Everything drawn is schematic: the door, the vote beam, every weight size, the sum
// values, the rectifier graph, the glyph shapes, the car/dog packets, the pose wireframes, the gallery
// (six pairs stand for "more than a hundred", not a count) and the downstream blocks. Reported by the author
// (not measured here): the V-versus-O reading of 4e:55, its listed inputs and readers, the pose rereading of
// the 4c:447 circuit, "more than a hundred" pose neurons, and the two car + two car/dog pose neurons found
// after steering optimization toward natural image paths. The 4e:55 circuit and the 4c:447 circuit are
// separate; the shrunken door in the second half is a schematic downstream gate, not 4e:55. The sum before the
// rectifier may be negative; the rectified output drawn here never is.
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import 'katex/dist/katex.min.css';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const DEG = Math.PI / 180;
const MONO = colors.font.mono;

// ---------------------------------------------------------------------------
// Captions (verbatim) and pacing: dur = max(5.4, words × 0.4 + 1.1), 0.7 s apart
// ---------------------------------------------------------------------------

const CAPS = [
  // [V1]
  "Neuron four e fifty-five became famous for responding to cat faces and car fronts. Those categories made it look like an arbitrary mixture.",
  // [V2]
  "Cammarata's new reading is a shared shape: a V. Pointed contours link objects whose names sound unrelated.",
  // [V2]
  "Its inputs include a fox snout, a wolf face, and the front of a van. Each can supply part of that pointed pattern.",
  // [V2]
  "Downstream readers include flames, a coyote face, and a martini glass. The same shape helps explain those connections too.",
  // [V2]
  "Every neuron has two poles: what pushes it up and what pushes it down. Pointed shapes push this one up, and round shapes push it negative. The contrast is a V against an O.",
  // [G2]
  "Incoming signals carry weighted votes for either side, and the votes add up first. Only then does the activation rule act, clipping a negative total to zero.",
  // [V3, G1]
  "The gate picture asks what that distinction does next. A shared pattern can admit useful signals to specialists and keep other signals out.",
  // [G2]
  "A negative vote can close a gate even when the neuron cannot pass a negative activation onward.",
  // [V4]
  "Why did the old image have whiskers? Once the optimizer found a cat route, it added details from that route along with the useful shape.",
  // [P1]
  "A separate circuit in Zoom In seemed to hide a car signal among dog neurons. Cammarata now challenges that interpretation too.",
  // [P2]
  "His rereading groups cars and dogs by pose. Their shared viewing angle matters more here than their object category.",
  // [P2]
  "He reports more than a hundred generalized pose neurons in Inception version one, with later circuits building on their distinctions.",
  // [P3]
  "Image optimization had favored dog imagery. Guiding it toward natural image paths exposed car responses and shared poses.",
  // [P2, P3]
  "The corrected view shows two car neurons and two car-and-dog pose neurons. Later processing develops car specialists and finer poses instead of decoding a hidden car.",
];

const T: number[] = [];
const D: number[] = [];
{
  let t = 0.6;
  for (const c of CAPS) {
    const d = Math.max(5.4, c.split(/\s+/).length * 0.4 + 1.1);
    T.push(t);
    D.push(d);
    t += d + 0.7;
  }
}
const END = T[13] + D[13] + 1.0;

/** Screen-space status chip, one per phase, replaced (never stacked). */
const CHIPS = [
  'neuron 4e:55 · InceptionV1',
  '4e:55 · proposed V-shape reading',
  '4e:55 · inputs and readers',
  '4e:55 · inputs and readers',
  '4e:55 · two poles',
  'schematic votes',
  'schematic gate',
  'schematic gate · output never below 0',
  'old feature visualization',
  'Zoom In circuit · 4c:447',
  'pose, not category',
  'pose neurons · reported',
  'image optimization',
  'corrected view',
];

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; load-bearing content y 100–605; y ≥ 630 empty)
// ---------------------------------------------------------------------------

// the door: lintel and sill, a leaf hinged at the lintel that swings right only
const HX = 640;
const HY = 300;
const LEAF_L = 140;
const LEAF_W = 22;
const DOOR_C = { x: 640, y: 371 };
const theta = (sum: number): number => 70 * clamp01(sum);
/** a point in the leaf's local frame (x across, y down the leaf) → world */
function leafPt(lx: number, ly: number, th: number): [number, number] {
  const c = Math.cos(th * DEG);
  const s = Math.sin(th * DEG);
  return [HX + lx * c + ly * s, HY - lx * s + ly * c];
}

// signal lanes through the doorway
const LANE_Y = 410;
const INLET_X = 612;
const OUTLET_X = 668;
const TRUNK_IN_X = 470;
const TRUNK_OUT_X = 830;
const IN_X = 172;
const RD_X = 1060;

// the vote beam above the door
const PIV = { x: 640, y: 172 };
const ARM = 150;
const PAN_DROP = 62;
const PAN_W = 130;

// rectifier graph
const RO = { x: 930, y: 205 };
const RS = 60;

// second half
const SMALL1 = { x: 900, y: 330 };
const SMALL2 = { x: 840, y: 235 };
const GX = [270, 410, 550, 690];
const GY = [245, 375];
const FX = [200, 340, 480, 620];
const FY = 235;

const CAM_C1: CameraState = { x: 575, y: 350, k: 1.1 };
const CAM_C2: CameraState = { x: 620, y: 335, k: 1.42 };
const CAM_C6: CameraState = { x: 650, y: 250, k: 1.35 };
const CAM_C7: CameraState = { x: 680, y: 400, k: 1.15 };
const CAM_C8: CameraState = { x: 740, y: 292, k: 1.22 };
const CAM_C9: CameraState = { x: 420, y: 345, k: 1.45 };
const CAM_C11: CameraState = { x: 470, y: 365, k: 1.2 };

// votes (sizes illustrative): three for the V side, three for the O side, then one heavy O vote
const VOTES = [
  { w: 0.35, slot: -34 },
  { w: -0.2, slot: -48 },
  { w: 0.3, slot: 0 },
  { w: -0.15, slot: -22 },
  { w: 0.25, slot: 34 },
  { w: -0.1, slot: 4 },
];
const HEAVY = { w: -0.9, slot: 40 };
const voteSize = (w: number): number => 16 + 30 * Math.abs(w);
const landed = (d: number): number => ease.move(clamp01((d - 0.55) / 0.45));

// ---------------------------------------------------------------------------
// 2-D glyphs (local box ±40). `v` is the pointed contour the V reading picks out.
// ---------------------------------------------------------------------------

type GlyphKind = 'cat' | 'carFront' | 'fox' | 'wolf' | 'van' | 'flames' | 'coyote' | 'martini' | 'ball' | 'clock';

const GLYPHS: Record<GlyphKind, { body: string; detail?: string; dots?: [number, number, number][]; v?: string }> = {
  cat: {
    body: 'M-30,-12 L-24,-38 L-9,-23 Q0,-26 9,-23 L24,-38 L30,-12 Q31,6 17,20 L0,33 L-17,20 Q-31,6 -30,-12 Z',
    detail: 'M-4,9 L4,9 L0,14 Z',
    dots: [[-11, -5, 3], [11, -5, 3]],
    v: 'M-22,8 L0,33 L22,8',
  },
  carFront: {
    body: 'M-36,-2 L-26,-6 L-18,-26 L18,-26 L26,-6 L36,-2 L36,20 L-36,20 Z',
    detail: 'M-15,-22 L15,-22 L20,-8 L-20,-8 Z M-30,20 L-30,28 L-20,28 L-20,20 M20,20 L20,28 L30,28 L30,20',
    dots: [[-27, 5, 4], [27, 5, 4]],
    v: 'M-16,0 L0,14 L16,0',
  },
  // fox: tall ears, cheek fluffs flaring out, a long narrow snout
  fox: {
    body: 'M-12,-22 L-28,-44 L-25,-14 L-40,2 L-21,5 L-5,34 L5,34 L21,5 L40,2 L25,-14 L28,-44 L12,-22 Z',
    detail: 'M-24,-36 L-17,-22 M24,-36 L17,-22 M-15,-8 L-6,-4 M15,-8 L6,-4',
    dots: [[0, 30, 3]],
    v: 'M-21,5 L0,34 L21,5',
  },
  // wolf: wide-set ears, a jagged ruff, a broad blunt muzzle
  wolf: {
    body: 'M-18,-24 L-28,-40 L-32,-16 L-42,-6 L-34,0 L-40,10 L-28,12 L-14,30 L0,34 L14,30 L28,12 L40,10 L34,0 L42,-6 L32,-16 L28,-40 L18,-24 Z',
    detail: 'M-11,6 L-9,22 L9,22 L11,6 M-18,-8 L-7,-4 M18,-8 L7,-4',
    dots: [[0, 18, 3.5]],
    v: 'M-28,12 L0,34 L28,12',
  },
  van: {
    body: 'M-30,-32 L30,-32 L32,24 L-32,24 Z',
    detail: 'M-24,-26 L24,-26 L22,-6 L-22,-6 Z M-28,10 L-20,10 M20,10 L28,10',
    v: 'M-14,2 L0,15 L14,2',
  },
  flames: {
    body: 'M-20,30 Q-30,8 -17,-12 L-8,6 L0,-36 L8,6 L17,-12 Q30,8 20,30 Z',
    v: 'M-17,-12 L-8,6 L0,-36 L8,6 L17,-12',
  },
  coyote: {
    body: 'M-26,-12 L-22,-40 L-8,-23 L8,-23 L22,-40 L26,-12 L4,30 L-4,30 Z',
    dots: [[-8, -8, 2.5], [8, -8, 2.5]],
    v: 'M-26,-12 L0,32 L26,-12',
  },
  martini: {
    body: 'M-30,-26 L30,-26 L0,6 Z M0,6 L0,28 M-14,30 L14,30',
    dots: [[8, -15, 4]],
    v: 'M-30,-26 L0,6 L30,-26',
  },
  ball: {
    body: 'M-28,0 A28,28 0 1,0 28,0 A28,28 0 1,0 -28,0 Z',
    detail: 'M-20,-19 Q0,0 -20,19 M20,-19 Q0,0 20,19',
  },
  clock: {
    body: 'M-28,0 A28,28 0 1,0 28,0 A28,28 0 1,0 -28,0 Z',
    detail: 'M0,0 L0,-18 M0,0 L12,6 M0,-28 L0,-22 M28,0 L22,0 M0,28 L0,22 M-28,0 L-22,0',
  },
};

function Glyph({
  kind,
  x,
  y,
  sc = 1,
  color,
  op = 1,
  vU = 0,
  vOp = 0,
}: {
  kind: GlyphKind;
  x: number;
  y: number;
  sc?: number;
  color: string;
  op?: number;
  vU?: number;
  vOp?: number;
}) {
  if (op <= 0.01) return null;
  const g = GLYPHS[kind];
  return (
    <g transform={`translate(${x},${y}) scale(${sc})`} opacity={op}>
      <path d={g.body} fill={color} fillOpacity={0.1} stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
      {g.detail && <path d={g.detail} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" opacity={0.85} />}
      {g.dots?.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity={0.85} />)}
      {g.v && vU > 0.01 && vOp > 0.01 && (
        <path
          d={g.v}
          fill="none"
          stroke={colors.WARM}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={`${vU} 1`}
          opacity={vOp}
        />
      )}
    </g>
  );
}

const CC = [
  { kind: 'cat' as const, noun: 'cat', y0: 285, y1: 322, py: 300 },
  { kind: 'carFront' as const, noun: 'car', y0: 425, y1: 428, py: 352 },
];
const INPUTS = [
  { kind: 'fox' as const, id: '4d:493', noun: 'fox snout', y: 250 },
  { kind: 'wolf' as const, id: '4d:477', noun: 'wolf face', y: 340 },
  { kind: 'van' as const, id: '4d:201', noun: 'van front', y: 430 },
];
const READERS = [
  { kind: 'flames' as const, id: '5a:94', noun: 'flames', y: 250 },
  { kind: 'coyote' as const, id: '5a:352', noun: 'coyote face', y: 340 },
  { kind: 'martini' as const, id: '5a:317', noun: 'martini glass', y: 430 },
];
const ROUND = [
  { kind: 'ball' as const, x: 200, y: 545 },
  { kind: 'clock' as const, x: 300, y: 545 },
];

// tiny packet icons and the dog silhouette used for the veil
const CAR_ICON = 'M-12,3 L-12,-3 L-6,-3 L-3,-9 L6,-9 L9,-3 L12,-3 L12,3 Z';
const DOG_ICON =
  'M-16,1 L-13,-6 L7,-6 L10,-12 L16,-12 L19,-8 L16,-4 L13,-4 L13,1 L11,10 L8,10 L8,3 L-9,3 L-11,10 L-14,10 L-14,3 Z M-16,-3 L-21,-10';

// C9: the old image's details, plus a faint seeded texture inside the frame
const FRAME = { x: 310, y: 250, w: 220, h: 180 };
const FRAME_C = { x: FRAME.x + FRAME.w / 2, y: FRAME.y + FRAME.h / 2 };
const WHISKERS = [
  'M-20,10 L-92,-8',
  'M-20,16 L-96,16',
  'M-20,22 L-90,40',
  'M20,10 L92,-8',
  'M20,16 L96,16',
  'M20,22 L90,40',
  'M-60,-42 L-50,-74 L-34,-50',
  'M60,-42 L50,-74 L34,-50',
];
const SPECKLE = (() => {
  const rnd = mulberry32(2055);
  return Array.from({ length: 70 }, () => ({
    x: FRAME.x + 8 + rnd() * (FRAME.w - 16),
    y: FRAME.y + 8 + rnd() * (FRAME.h - 16),
    r: 1 + rnd() * 2.2,
    o: 0.08 + rnd() * 0.18,
  }));
})();

// ---------------------------------------------------------------------------
// Pose wireframes: tiny orthographic 3-D models so "same viewing angle" is literal
// ---------------------------------------------------------------------------

type V3 = [number, number, number];
type Seg = [V3, V3];
const ELEV = 19 * DEG;

function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Seg[] {
  const c = (i: number): V3 => [i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0];
  const out: Seg[] = [];
  for (let i = 0; i < 8; i++)
    for (const b of [1, 2, 4]) if (!(i & b)) out.push([c(i), c(i | b)]);
  return out;
}
function frustum(bx0: number, bx1: number, bz: number, by: number, tx0: number, tx1: number, tz: number, ty: number): Seg[] {
  const B: V3[] = [[bx0, by, -bz], [bx1, by, -bz], [bx1, by, bz], [bx0, by, bz]];
  const U: V3[] = [[tx0, ty, -tz], [tx1, ty, -tz], [tx1, ty, tz], [tx0, ty, tz]];
  const out: Seg[] = [];
  for (let i = 0; i < 4; i++) out.push([B[i], B[(i + 1) % 4]], [U[i], U[(i + 1) % 4]], [B[i], U[i]]);
  return out;
}
function wheel(cx: number, cy: number, z: number, r: number): Seg[] {
  const n = 10;
  const p = (i: number): V3 => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI), z];
  return Array.from({ length: n }, (_, i) => [p(i), p(i + 1)] as Seg);
}

const CAR_SEGS: Seg[] = [
  ...box(-1, 1, 0.2, 0.55, -0.45, 0.45),
  ...frustum(-0.62, 0.42, 0.42, 0.55, -0.45, 0.18, 0.36, 0.9),
  ...wheel(0.6, 0.2, 0.46, 0.19),
  ...wheel(-0.6, 0.2, 0.46, 0.19),
  ...wheel(0.6, 0.2, -0.46, 0.19),
  ...wheel(-0.6, 0.2, -0.46, 0.19),
];
const DOG_SEGS: Seg[] = [
  ...box(-0.75, 0.45, 0.5, 0.85, -0.22, 0.22),
  ...box(0.45, 0.85, 0.75, 1.12, -0.2, 0.2),
  ...box(0.85, 1.12, 0.78, 0.93, -0.11, 0.11),
  [[0.32, 0.5, 0.14], [0.32, 0, 0.14]],
  [[0.32, 0.5, -0.14], [0.32, 0, -0.14]],
  [[-0.62, 0.5, 0.14], [-0.62, 0, 0.14]],
  [[-0.62, 0.5, -0.14], [-0.62, 0, -0.14]],
  [[-0.75, 0.78, 0], [-1.02, 1.05, 0]],
  [[0.52, 1.12, 0.14], [0.6, 1.32, 0.14]],
  [[0.6, 1.32, 0.14], [0.72, 1.12, 0.14]],
  [[0.52, 1.12, -0.14], [0.6, 1.32, -0.14]],
  [[0.6, 1.32, -0.14], [0.72, 1.12, -0.14]],
];

/** Ground point (model origin) of a figure whose mid-height sits at (cx, cy). */
const groundOf = (cx: number, cy: number, S: number): [number, number] => [cx, cy + 0.5 * S * Math.cos(ELEV)];
function project(p: V3, yawDeg: number, S: number, cx: number, cy: number): [number, number] {
  const c = Math.cos(yawDeg * DEG);
  const s = Math.sin(yawDeg * DEG);
  const xr = p[0] * c - p[2] * s;
  const zr = p[0] * s + p[2] * c;
  const [gx, gy] = groundOf(cx, cy, S);
  return [gx + xr * S, gy + (-p[1] * Math.cos(ELEV) + zr * Math.sin(ELEV)) * S];
}
function wirePath(segs: Seg[], yaw: number, S: number, cx: number, cy: number): string {
  let d = '';
  for (const [a, b] of segs) {
    const [ax, ay] = project(a, yaw, S, cx, cy);
    const [bx, by] = project(b, yaw, S, cx, cy);
    d += `M${ax.toFixed(1)},${ay.toFixed(1)}L${bx.toFixed(1)},${by.toFixed(1)}`;
  }
  return d;
}
/** Projected heading (unit) for a yaw: the direction the figure faces on screen. */
function heading(yaw: number): [number, number] {
  const hx = Math.cos(yaw * DEG);
  const hy = Math.sin(yaw * DEG) * Math.sin(ELEV);
  const n = Math.hypot(hx, hy) || 1;
  return [hx / n, hy / n];
}

const POSE_YAW = 40; // the shared three-quarter view in caption 11
const ALIGN_CAR = { x: 330, y: 335 };
const ALIGN_DOG = (() => {
  const [hx, hy] = heading(POSE_YAW);
  return { x: ALIGN_CAR.x + 270 * hx, y: ALIGN_CAR.y + 270 * hy };
})();

interface Pose {
  x: number;
  y: number;
  S: number;
  yaw: number;
  op: number;
}
const mixPose = (a: Pose, b: Pose, u: number): Pose =>
  u <= 0 ? a : u >= 1 ? b : { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), S: lerp(a.S, b.S, u), yaw: lerp(a.yaw, b.yaw, u), op: lerp(a.op, b.op, u) };

// gallery cells: K = car-only (revealed in caption 13), P = car/dog pose pair
type CellId = 'K0' | 'K1' | 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
const CELLS: Record<CellId, { gx: number; gy: number; yaw: number; final: number | null }> = {
  K0: { gx: GX[0], gy: GY[0], yaw: 25, final: 0 },
  K1: { gx: GX[0], gy: GY[1], yaw: -45, final: 1 },
  P0: { gx: GX[1], gy: GY[0], yaw: POSE_YAW, final: 2 },
  P1: { gx: GX[2], gy: GY[0], yaw: -25, final: 3 },
  P2: { gx: GX[3], gy: GY[0], yaw: 115, final: null },
  P3: { gx: GX[1], gy: GY[1], yaw: 5, final: null },
  P4: { gx: GX[2], gy: GY[1], yaw: 70, final: null },
  P5: { gx: GX[3], gy: GY[1], yaw: -65, final: null },
};
const CELL_IDS = Object.keys(CELLS) as CellId[];
const PAIR_DX = 30;
const PAIR_S = 20;
const SOLO_S = 24;

/** Gallery / final pose for a figure sitting in a cell (role: solo car, or the car/dog of a pair). */
function cellPose(id: CellId, role: 'solo' | 'car' | 'dog', final: boolean, op: number): Pose {
  const c = CELLS[id];
  const dx = role === 'solo' ? 0 : role === 'car' ? -PAIR_DX : PAIR_DX;
  const S = role === 'solo' ? SOLO_S : PAIR_S;
  if (final && c.final !== null) return { x: FX[c.final] + dx * 1.07, y: FY + 4, S: S * 1.15, yaw: c.yaw, op };
  return { x: c.gx + dx, y: c.gy + 4, S, yaw: c.yaw, op };
}

interface Figure {
  kind: 'car' | 'dog';
  cell: CellId;
  role: 'solo' | 'car' | 'dog';
  /** caption-10 cluster pose (null: not in the cluster) */
  cluster: { x: number; y: number; S: number; yaw: number } | null;
  /** caption-11 role: 'hero' moves and rotates, 'rest' whispers, null hidden */
  align: 'heroCar' | 'heroDog' | 'rest' | null;
}

const FIGURES: Figure[] = [
  { kind: 'car', cell: 'P0', role: 'car', cluster: { x: 190, y: 338, S: 36, yaw: 75 }, align: 'heroCar' },
  { kind: 'dog', cell: 'P0', role: 'dog', cluster: { x: 430, y: 240, S: 33, yaw: 160 }, align: 'heroDog' },
  { kind: 'dog', cell: 'P1', role: 'dog', cluster: { x: 570, y: 240, S: 33, yaw: -20 }, align: 'rest' },
  { kind: 'dog', cell: 'P2', role: 'dog', cluster: { x: 500, y: 335, S: 33, yaw: 100 }, align: 'rest' },
  { kind: 'dog', cell: 'P3', role: 'dog', cluster: { x: 430, y: 430, S: 33, yaw: -120 }, align: 'rest' },
  { kind: 'dog', cell: 'P4', role: 'dog', cluster: { x: 570, y: 430, S: 33, yaw: 30 }, align: 'rest' },
  { kind: 'car', cell: 'P1', role: 'car', cluster: null, align: null },
  { kind: 'car', cell: 'P2', role: 'car', cluster: null, align: null },
  { kind: 'car', cell: 'P3', role: 'car', cluster: null, align: null },
  { kind: 'car', cell: 'P4', role: 'car', cluster: null, align: null },
  { kind: 'car', cell: 'P5', role: 'car', cluster: null, align: null },
  { kind: 'dog', cell: 'P5', role: 'dog', cluster: null, align: null },
  { kind: 'car', cell: 'K0', role: 'solo', cluster: null, align: null },
  { kind: 'car', cell: 'K1', role: 'solo', cluster: null, align: null },
];
const CLUSTER_TILES = FIGURES.filter((f) => f.cluster).map((f) => f.cluster!);

/** Dog-veil pattern (caption 13), precomputed. */
const VEIL = { x0: 200, x1: 760, y0: 185, y1: 437 };
const VEIL_DOGS = (() => {
  const out: { x: number; y: number }[] = [];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 8; c++) out.push({ x: VEIL.x0 + 36 + c * 70 + (r % 2) * 22, y: VEIL.y0 + 28 + r * 50 });
  return out.filter((p) => p.x < VEIL.x1 - 20);
})();

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

const NUM_INIT = {
  chip: 0,
  doorU: 0,
  beamU: 0,
  beamOp: 1,
  doorOp: 1,
  base: 0,
  voteU: 0,
  heavyU: 0,
  ccU: 0,
  ccDrift: 0,
  ccNoun: 1,
  ccV: 0,
  ccPark: 0,
  ccOut: 0,
  vBadge: 0,
  oBadge: 0,
  inU: 0,
  inLines: 0,
  inFlash: 0,
  inId: 0,
  inOp: 1,
  rdU: 0,
  rdLines: 0,
  rdId: 0,
  rdOp: 1,
  rdLineOp: 1,
  pulseU: 0,
  roundU: 0,
  roundOp: 1,
  roundLines: 0,
  dialLbl: 0,
  sigmaU: 0,
  reluU: 0,
  lanesU: 0,
  carU: 0,
  dogU: 0,
  zeroLbl: 0,
  frameU: 0,
  whiskU: 0,
  whiskLbl: 0,
  shrink: 0,
  doorLbl: 0,
  clusterU: 0,
  wireU: 0,
  veilU: 0,
  stampU: 0,
  alignU: 0,
  rotateU: 0,
  guideU: 0,
  galleryU: 0,
  badgeU: 0,
  fanU: 0,
  rightDim: 0,
  dogVeil: 0,
  sweepU: 0,
  sweepOp: 0,
  kGlow: 0,
  finalU: 0,
  splitU: 0,
  panelU: 0,
};
type NumKey = keyof typeof NUM_INIT;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ch = {} as Record<NumKey, ChannelRef<number>>;
  for (const k of Object.keys(NUM_INIT) as NumKey[]) ch[k] = tl.channel(k, NUM_INIT[k]);
  const tw = (k: NumKey, to: number, at: number, dur: number, e = ease.move) => tl.tween(ch[k], to, { at, dur, ease: e });
  const mv = (to: CameraState, at: number, dur = 1.4) => tl.tween(cam, to, { at, dur, ease: ease.move });

  CAPS.forEach((text, i) => {
    // each line holds until the next starts, so the caption never blinks off between lines
    tl.caption({ at: T[i], dur: i < CAPS.length - 1 ? T[i + 1] - T[i] : D[i], text });
    if (i > 0 && CHIPS[i] !== CHIPS[i - 1]) tl.set(ch.chip, i, T[i] - 0.1);
  });

  // — C1 · one gate, two unlike inputs —
  let t = T[0];
  tw('doorU', 1, t + 0.1, 0.8, ease.enter);
  tw('beamU', 1, t + 0.5, 0.8, ease.enter);
  mv(CAM_C1, t + 0.3, 1.6);
  tw('ccU', 1, t + 1.0, 0.7, ease.enter);
  tw('ccDrift', 1, t + 2.0, 1.5);
  tw('base', 0.15, t + 3.2, 0.8);
  tl.hold(t + 4.0, 1.0);

  // — C2 · one shape: a V —
  t = T[1];
  mv(CAM_C2, t, 1.4);
  tw('ccV', 1, t + 0.7, 1.2, ease.draw);
  tw('ccNoun', 0, t + 1.6, 0.6);
  tw('base', 0.8, t + 2.1, 1.0);
  tw('vBadge', 1, t + 2.6, 0.6, ease.enter);
  tw('ccPark', 1, t + 4.0, 1.0);
  tw('ccOut', 1, t + D[1] - 1.6, 0.8);

  // — C3 · inputs —
  t = T[2];
  mv(CAMERA_HOME, t - 0.2, 1.3);
  tw('inU', 3, t + 0.4, 1.8, ease.linear);
  tw('inId', 1, t + 1.0, 0.7, ease.enter);
  tw('inLines', 1, t + 1.6, 1.2, ease.draw);
  tw('inFlash', 3, t + 3.2, 3.9, ease.linear);

  // — C4 · readers, one pulse —
  t = T[3];
  tw('inId', 0.1, t, 0.6);
  tw('rdU', 3, t + 0.3, 1.6, ease.linear);
  tw('rdId', 1, t + 0.8, 0.7, ease.enter);
  tw('rdLines', 1, t + 1.3, 1.2, ease.draw);
  tw('pulseU', 1, t + 3.0, 1.6, ease.linear);

  // — C5 · two poles: up and down, then pointed up and round negative —
  t = T[4];
  tw('inOp', 0.6, t + 0.2, 0.6);
  tw('rdId', 0.1, t + 0.2, 0.6);
  tw('dialLbl', 1, t + 1.4, 0.6, ease.enter); // "two poles"
  tw('base', 1.0, t + 2.6, 0.7); // "what pushes it up"
  tw('base', 0.25, t + 4.3, 0.8); // "what pushes it down"
  tw('base', 0.8, t + 5.9, 0.8); // "pointed shapes push this one up"
  tw('inOp', 1, t + 5.9, 0.5);
  tw('inOp', 0.35, t + 8.2, 0.6);
  tw('roundU', 1, t + 8.2, 1.0); // "round shapes"
  tw('rdLineOp', 0.25, t + 8.9, 0.6);
  tw('roundLines', 1, t + 8.9, 1.0, ease.draw);
  tw('base', -0.6, t + 9.3, 1.0); // "push it negative": the door shuts
  tw('oBadge', 1, t + 12.7, 0.6, ease.enter); // "a V against an O"

  // — C6 · weighted votes add up first; then the rule clips a negative total to zero —
  t = T[5];
  mv(CAM_C6, t, 1.4);
  tw('roundOp', 0, t, 0.6);
  tw('inOp', 0, t, 0.6);
  tw('rdOp', 0, t, 0.6);
  tw('dialLbl', 0, t, 0.5);
  tw('base', 0, t + 0.3, 0.8);
  tw('sigmaU', 1, t + 1.0, 0.7, ease.enter);
  tw('voteU', 6, t + 1.4, 3.6, ease.linear);
  tw('reluU', 1, t + 6.1, 0.8, ease.enter); // "only then does the activation rule act"
  tw('heavyU', 1, t + 8.6, 1.4); // total goes negative: the door reaches its stop, the output dot stays at 0

  // — C7 · admit and keep out (schematic gate) —
  t = T[6];
  mv(CAM_C7, t, 1.3);
  tw('sigmaU', 0, t, 0.5);
  tw('reluU', 0, t, 0.5);
  tw('voteU', 0, t + 0.2, 1.0, ease.linear);
  tw('heavyU', 0, t + 0.2, 1.0, ease.linear);
  tw('base', 0.8, t + 0.2, 1.0);
  tw('lanesU', 1, t + 0.9, 0.8, ease.enter);
  tw('carU', 1, t + 1.7, 2.6, ease.linear);
  tw('dogU', 1, t + 4.6, 3.8, ease.linear);
  tw('base', -0.5, t + 4.6, 0.8);

  // — C8 · a negative vote shuts the door; the output stays 0 —
  t = T[7];
  mv(CAM_C8, t, 1.3);
  tw('lanesU', 0, t, 0.6);
  tw('sigmaU', 1, t + 0.3, 0.6, ease.enter);
  tw('reluU', 1, t + 0.3, 0.6, ease.enter);
  tw('base', 0, t + 0.2, 0.8);
  tw('voteU', 6, t + 0.4, 1.8, ease.linear);
  tw('heavyU', 1, t + 2.6, 0.8);
  tw('zeroLbl', 1, t + 3.4, 0.6, ease.enter);

  // — C9 · whiskers came with the route —
  t = T[8];
  tw('zeroLbl', 0, t, 0.5);
  tw('sigmaU', 0, t, 0.5);
  tw('reluU', 0, t, 0.5);
  tw('beamOp', 0, t, 0.6);
  tw('doorOp', 0.3, t, 0.6);
  mv(CAM_C9, t + 0.1, 1.3);
  tw('frameU', 1, t + 0.6, 0.7, ease.enter);
  tw('whiskU', 1, t + 1.6, 1.4, ease.draw);
  tw('whiskLbl', 1, t + 3.9, 0.6, ease.enter);
  tw('whiskU', 2, t + 5.4, 1.2);

  // — C10 · a separate circuit; the door shrinks to a schematic downstream gate —
  t = T[9];
  tw('frameU', 0, t, 0.6);
  tw('whiskLbl', 0, t, 0.5);
  tw('beamOp', 0, t, 0.8);
  tw('vBadge', 0, t, 0.6);
  tw('oBadge', 0, t, 0.6);
  mv(CAMERA_HOME, t, 1.4);
  tl.set(ch.voteU, 0, t + 0.9);
  tl.set(ch.heavyU, 0, t + 0.9);
  tl.set(ch.base, 0, t + 0.9);
  tw('shrink', 1, t + 0.4, 1.2);
  tw('doorOp', 1, t + 0.4, 0.8);
  tw('doorLbl', 1, t + 1.5, 0.6, ease.enter);
  tw('clusterU', 1, t + 1.2, 1.2, ease.enter);
  tw('wireU', 1, t + 2.4, 1.2, ease.draw);
  tw('veilU', 1, t + 3.7, 0.7, ease.enter);
  tw('stampU', 1, t + 5.6, 0.5, ease.pop);

  // — C11 · pose, not category —
  t = T[10];
  tw('veilU', 0, t + 0.2, 0.7);
  tw('stampU', 0, t + 0.2, 0.5);
  tw('wireU', 0, t + 0.2, 0.6);
  mv(CAM_C11, t + 0.6, 1.4);
  tw('alignU', 1, t + 0.6, 1.3);
  tw('guideU', 1, t + 1.8, 0.6, ease.enter);
  tw('rotateU', 1, t + 2.5, 1.2);

  // — C12 · the gallery and later circuits —
  t = T[11];
  mv(CAMERA_HOME, t, 1.3);
  tw('guideU', 0, t, 0.5);
  tw('galleryU', 1, t + 0.3, 1.4);
  tw('badgeU', 1, t + 1.9, 0.6, ease.enter);
  tw('fanU', 1, t + 2.6, 1.4, ease.draw);
  tw('base', 0.6, t + 3.2, 0.9);

  // — C13 · dog-biased optimization, then natural image paths —
  t = T[12];
  tw('badgeU', 0, t, 0.5);
  tw('rightDim', 1, t, 0.6);
  tw('dogVeil', 1, t + 0.4, 0.8, ease.enter);
  tw('sweepOp', 1, t + 2.4, 0.4, ease.enter);
  tw('sweepU', 1, t + 2.6, 2.4, ease.linear);
  tw('kGlow', 1, t + 5.1, 0.5, ease.pop);
  tw('sweepOp', 0, t + 5.4, 0.5);
  tw('dogVeil', 0, t + 5.4, 0.5);

  // — C14 · corrected view, then the closing panel —
  t = T[13];
  tw('rightDim', 0, t, 0.6);
  tw('kGlow', 0, t, 0.5);
  tw('finalU', 1, t + 0.3, 1.4);
  tw('splitU', 1, t + 1.8, 0.6, ease.enter);
  tw('panelU', 1, t + 3.2, 0.8, ease.enter);
  tl.hold(T[13] + D[13], END - (T[13] + D[13]));

  return { tl, cam, ch };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function Badge({ x, y, kind, op }: { x: number; y: number; kind: 'V' | 'O'; op: number }) {
  if (op <= 0.01) return null;
  const c = kind === 'V' ? colors.WARM : colors.NEGATIVE;
  return (
    <g transform={`translate(${x},${y})`} opacity={op}>
      <circle r={24} fill={colors.PANEL} stroke={c} strokeWidth={2.4} />
      {kind === 'V' ? (
        <path d="M-11,-9 L0,11 L11,-9" fill="none" stroke={c} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <circle r={10} fill="none" stroke={c} strokeWidth={4.5} />
      )}
    </g>
  );
}

function Label({ x, y, text, op = 1, size = 18, color = colors.MUTED, anchor = 'middle', mono = false, weight = 500 }: {
  x: number;
  y: number;
  text: string;
  op?: number;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  mono?: boolean;
  weight?: number;
}) {
  if (op <= 0.01) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={size} fontWeight={weight} fontFamily={mono ? MONO : undefined} opacity={op}>
      {text}
    </text>
  );
}

/** polyline through points, sampled at arc-length fraction u */
function along(pts: [number, number][], u: number): [number, number] {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let d = clamp01(u) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? Math.min(1, d / lens[i]) : 0;
      return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
}
const ptsD = (pts: [number, number][]): string => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('');

const CAR_LANE: [number, number][] = [[250, LANE_Y], [INLET_X, LANE_Y], [OUTLET_X, LANE_Y], [860, LANE_Y]];
const DOG_IN: [number, number][] = [[250, LANE_Y], [556, LANE_Y]];
const DOG_OUT: [number, number][] = [[556, LANE_Y], [556, 522], [478, 522]];

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (k: NumKey): number => s.get(scene.ch[k]);
  const cam = s.get(scene.cam);

  const voteU = v('voteU');
  const heavyU = v('heavyU');
  const sum = v('base') + VOTES.reduce((a, w, i) => a + w.w * landed(clamp01(voteU - i)), 0) + HEAVY.w * landed(heavyU);
  const th = theta(sum);
  const shrink = v('shrink');
  const finalU = v('finalU');
  const press = clamp01(-sum / 0.4) * (1 - shrink);

  // door placement: full size at the centre → small downstream gate → its final spot
  const dpx = lerp(lerp(DOOR_C.x, SMALL1.x, shrink), SMALL2.x, finalU);
  const dpy = lerp(lerp(DOOR_C.y, SMALL1.y, shrink), SMALL2.y, finalU);
  const dsc = lerp(1, 0.5, shrink);
  const doorWorld = (x: number, y: number): [number, number] => [dpx + (x - DOOR_C.x) * dsc, dpy + (y - DOOR_C.y) * dsc];
  const rightDim = 1 - 0.75 * v('rightDim');
  const doorOp = v('doorU') * v('doorOp') * (shrink > 0 ? lerp(1, rightDim, shrink) : 1);

  const beamOp = v('beamU') * v('beamOp');
  const tilt = sum * 9;
  const beamEnd = (side: -1 | 1): [number, number] => [PIV.x + side * ARM * Math.cos(tilt * DEG), PIV.y + side * ARM * Math.sin(tilt * DEG)];
  const [lx, ly] = beamEnd(-1);
  const [rx, ry] = beamEnd(1);
  const panL = { x: lx, y: ly + PAN_DROP };
  const panR = { x: rx, y: ry + PAN_DROP };
  const needle = (-90 + Math.max(-1, Math.min(1, sum)) * 62) * DEG;

  const ccU = v('ccU');
  const ccDrift = ease.move(v('ccDrift'));
  const ccPark = v('ccPark');
  const inU = v('inU');
  const inFlash = v('inFlash');
  const inOp = v('inOp');
  const rdU = v('rdU');
  const rdOp = v('rdOp');
  const pulseU = v('pulseU');
  const roundU = v('roundU');
  const lanesU = v('lanesU');
  const whiskU = v('whiskU');
  const clusterU = v('clusterU');
  const alignU = v('alignU');
  const rotateU = v('rotateU');
  const galleryU = v('galleryU');
  const sweepU = v('sweepU');
  const sweepX = lerp(VEIL.x0 - 6, VEIL.x1 + 6, sweepU);
  const kRev = (gx: number): number => clamp01((sweepX - (gx - 64)) / 90);
  const fanU = v('fanU');
  const splitU = v('splitU');
  const panelU = v('panelU');

  // figure poses
  const poseOf = (f: Figure): Pose => {
    const cell = CELLS[f.cell];
    const gal = cellPose(f.cell, f.role, false, f.cell[0] === 'K' ? kRev(cell.gx) : 1);
    let p: Pose = f.cluster ? { ...f.cluster, op: clusterU } : { ...gal, op: 0 };
    if (f.align) {
      const a: Pose =
        f.align === 'heroCar'
          ? { ...ALIGN_CAR, S: 58, yaw: lerp(f.cluster!.yaw, POSE_YAW, ease.move(rotateU)), op: 1 }
          : f.align === 'heroDog'
            ? { ...ALIGN_DOG, S: 58, yaw: lerp(f.cluster!.yaw, POSE_YAW, ease.move(rotateU)), op: 1 }
            : { ...p, op: 0 };
      p = mixPose(p, a, alignU);
    }
    p = mixPose(p, gal, galleryU);
    return mixPose(p, cellPose(f.cell, f.role, true, cell.final !== null ? 1 : 0), finalU);
  };

  // sum readouts
  const reluDot: [number, number] = [RO.x + RS * Math.max(-1, Math.min(1, sum)), RO.y - RS * clamp01(sum)];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <pattern id="ch2-hatch" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={12} stroke={colors.NEGATIVE} strokeWidth={2} opacity={0.35} />
        </pattern>
        <linearGradient id="ch2-matte" x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" style={{ stopColor: colors.BG, stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: colors.BG, stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <Camera {...cam}>
        {/* ============ inputs (C3) and the C1 pair ============ */}
        {inOp > 0.01 && inU > 0.01 && (
          <g opacity={inOp}>
            {INPUTS.map((g, i) => {
              const u = ease.enter(clamp01(inU - i));
              const fl = clamp01(inFlash - i);
              const flash = Math.sin(Math.PI * fl);
              const keep = 0.5 * clamp01((inFlash - i - 0.5) * 2);
              const lineU = clamp01(v('inLines'));
              return (
                <g key={g.id}>
                  {lineU > 0.01 && (
                    <path
                      d={ptsD([[IN_X + 42, g.y], [TRUNK_IN_X, LANE_Y]])}
                      fill="none"
                      stroke={colors.MUTED}
                      strokeWidth={2}
                      pathLength={1}
                      strokeDasharray={`${lineU} 1`}
                      opacity={0.6}
                    />
                  )}
                  <Glyph kind={g.kind} x={IN_X - 24 * (1 - u)} y={g.y} color={colors.TEXT} op={u} vU={clamp01(fl * 2)} vOp={Math.max(flash, keep)} />
                  <Label x={IN_X - 50} y={g.y - 8} text={g.noun} anchor="end" size={20} color={colors.TEXT} op={u} />
                  <Label x={IN_X - 50} y={g.y + 22} text={g.id} anchor="end" mono size={24} weight={600} color={colors.TEXT} op={u * v('inId')} />
                </g>
              );
            })}
            {v('inLines') > 0.01 && (
              <path
                d={ptsD([[TRUNK_IN_X, LANE_Y], [INLET_X, LANE_Y]])}
                fill="none"
                stroke={colors.MUTED}
                strokeWidth={2}
                pathLength={1}
                strokeDasharray={`${v('inLines')} 1`}
                opacity={0.6}
              />
            )}
          </g>
        )}
        {CC.map((g, i) => {
          const op = ccU * (1 - v('ccOut'));
          if (op <= 0.01) return null;
          const x0 = lerp(150, 476, ccDrift);
          const y0 = lerp(g.y0, g.y1, ccDrift);
          const x = lerp(x0, 548, ccPark);
          const y = lerp(y0, g.py, ccPark);
          return (
            <g key={g.kind}>
              <Glyph kind={g.kind} x={x} y={y} sc={lerp(1, 0.5, ccPark)} color={i === 0 ? colors.SECONDARY : colors.ACCENT} op={op} vU={v('ccV')} vOp={1} />
              <Label x={x - 50} y={y + 8} text={g.noun} anchor="end" size={22} color={colors.TEXT} op={op * v('ccNoun')} />
            </g>
          );
        })}

        {/* ============ readers (C4) ============ */}
        {rdOp > 0.01 && rdU > 0.01 && (
          <g opacity={rdOp}>
            {v('rdLines') > 0.01 && (
              <g opacity={v('rdLineOp')}>
                <path d={ptsD([[OUTLET_X, LANE_Y], [TRUNK_OUT_X, LANE_Y]])} fill="none" stroke={colors.MUTED} strokeWidth={2} pathLength={1} strokeDasharray={`${v('rdLines')} 1`} opacity={0.6} />
                {READERS.map((g) => (
                  <path
                    key={g.id}
                    d={ptsD([[TRUNK_OUT_X, LANE_Y], [RD_X - 42, g.y]])}
                    fill="none"
                    stroke={colors.MUTED}
                    strokeWidth={2}
                    pathLength={1}
                    strokeDasharray={`${v('rdLines')} 1`}
                    opacity={0.6}
                  />
                ))}
              </g>
            )}
            {READERS.map((g, i) => {
              const u = ease.enter(clamp01(rdU - i));
              const arrive = clamp01((pulseU - 0.9) / 0.1);
              return (
                <g key={g.id}>
                  <Glyph kind={g.kind} x={RD_X + 24 * (1 - u)} y={g.y} color={colors.TEXT} op={u} vU={arrive} vOp={arrive} />
                  <Label x={RD_X + 50} y={g.y - 8} text={g.noun} anchor="start" size={20} color={colors.TEXT} op={u} />
                  <Label x={RD_X + 50} y={g.y + 22} text={g.id} anchor="start" mono size={24} weight={600} color={colors.TEXT} op={u * v('rdId')} />
                </g>
              );
            })}
          </g>
        )}
        {/* the single pulse, inputs → door → readers */}
        {pulseU > 0.001 && pulseU < 0.999 && (
          <g>
            {pulseU < 0.38 &&
              INPUTS.map((g) => {
                const [x, y] = along([[IN_X + 42, g.y], [TRUNK_IN_X, LANE_Y]], pulseU / 0.38);
                return <circle key={g.id} cx={x} cy={y} r={6} fill={colors.WARM} />;
              })}
            {pulseU >= 0.38 && pulseU < 0.62 && (
              <circle cx={lerp(TRUNK_IN_X, TRUNK_OUT_X, (pulseU - 0.38) / 0.24)} cy={LANE_Y} r={7} fill={colors.WARM} />
            )}
            {pulseU >= 0.62 &&
              READERS.map((g) => {
                const [x, y] = along([[TRUNK_OUT_X, LANE_Y], [RD_X - 42, g.y]], (pulseU - 0.62) / 0.38);
                return <circle key={g.id} cx={x} cy={y} r={6} fill={colors.WARM} />;
              })}
          </g>
        )}

        {/* ============ round inputs (C5) ============ */}
        {roundU > 0.01 && v('roundOp') > 0.01 && (
          <g opacity={v('roundOp')}>
            {ROUND.map((g) => (
              <g key={g.kind}>
                {v('roundLines') > 0.01 && (
                  <path
                    d={ptsD([[g.x + 30, g.y - 10], [TRUNK_IN_X, LANE_Y]])}
                    fill="none"
                    stroke={colors.NEGATIVE}
                    strokeWidth={2.2}
                    pathLength={1}
                    strokeDasharray={`${v('roundLines')} 1`}
                    opacity={0.7}
                  />
                )}
                <Glyph kind={g.kind} x={lerp(-80, g.x, ease.move(roundU))} y={g.y} color={colors.NEGATIVE} op={clamp01(roundU * 2)} />
              </g>
            ))}
          </g>
        )}

        {/* ============ the vote beam, dial and rectifier ============ */}
        {beamOp > 0.01 && (
          <g opacity={beamOp}>
            {/* dial: needle reads the signed sum, O at left, V at right */}
            <path
              d={`M${PIV.x + 48 * Math.cos(-150 * DEG)},${PIV.y + 48 * Math.sin(-150 * DEG)} A48,48 0 0,1 ${PIV.x + 48 * Math.cos(-30 * DEG)},${PIV.y + 48 * Math.sin(-30 * DEG)}`}
              fill="none"
              stroke={colors.MUTED}
              strokeWidth={2}
              opacity={0.7}
            />
            {[-150, -90, -30].map((a) => (
              <line key={a} x1={PIV.x + 42 * Math.cos(a * DEG)} y1={PIV.y + 42 * Math.sin(a * DEG)} x2={PIV.x + 54 * Math.cos(a * DEG)} y2={PIV.y + 54 * Math.sin(a * DEG)} stroke={colors.MUTED} strokeWidth={2} />
            ))}
            <circle cx={PIV.x + 66 * Math.cos(-160 * DEG)} cy={PIV.y + 66 * Math.sin(-160 * DEG)} r={7} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
            <path
              d={`M${PIV.x + 66 * Math.cos(-20 * DEG) - 7},${PIV.y + 66 * Math.sin(-20 * DEG) - 6} l7,13 l7,-13`}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1={PIV.x} y1={PIV.y} x2={PIV.x + 44 * Math.cos(needle)} y2={PIV.y + 44 * Math.sin(needle)} stroke={sum >= 0 ? colors.WARM : colors.NEGATIVE} strokeWidth={3.4} strokeLinecap="round" />
            <Label x={PIV.x} y={106} text="round ↔ pointed" size={20} color={colors.TEXT} op={v('dialLbl')} />

            {/* beam, fulcrum, rod to the lintel */}
            <line x1={PIV.x} y1={PIV.y + 22} x2={PIV.x} y2={280} stroke={colors.GRID} strokeWidth={3} />
            <path d={`M${PIV.x},${PIV.y} L${PIV.x - 13},${PIV.y + 22} L${PIV.x + 13},${PIV.y + 22} Z`} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.6} />
            <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={colors.TEXT} strokeWidth={4} strokeLinecap="round" />
            <circle cx={PIV.x} cy={PIV.y} r={5} fill={colors.TEXT} />
            {[panL, panR].map((p, i) => (
              <g key={i}>
                <path d={`M${p.x - PAN_W / 2 + 6},${p.y} L${i ? rx : lx},${i ? ry : ly} L${p.x + PAN_W / 2 - 6},${p.y}`} fill="none" stroke={colors.MUTED} strokeWidth={1.3} opacity={0.7} />
                <rect x={p.x - PAN_W / 2} y={p.y} width={PAN_W} height={5} rx={2} fill={i ? colors.WARM : colors.NEGATIVE} opacity={0.7} />
              </g>
            ))}
            {/* weights: positive votes on the V (right) pan, negative on the O (left) pan */}
            {[...VOTES.map((w, i) => ({ ...w, d: clamp01(voteU - i) })), { ...HEAVY, d: heavyU }].map((w, i) => {
              if (w.d <= 0.001) return null;
              const pan = w.w > 0 ? panR : panL;
              const sz = voteSize(w.w);
              const fall = 90 * (1 - ease.move(w.d));
              const x = pan.x + w.slot - sz / 2;
              const y = pan.y - sz - fall;
              const c = w.w > 0 ? colors.WARM : colors.NEGATIVE;
              return (
                <g key={i} opacity={clamp01(w.d * 4)}>
                  <rect x={x} y={y} width={sz} height={sz} rx={3} fill={c} opacity={0.88} />
                  <line x1={x + sz * 0.28} y1={y + sz / 2} x2={x + sz * 0.72} y2={y + sz / 2} stroke="#0a0e1a" strokeWidth={2.6} />
                  {w.w > 0 && <line x1={x + sz / 2} y1={y + sz * 0.28} x2={x + sz / 2} y2={y + sz * 0.72} stroke="#0a0e1a" strokeWidth={2.6} />}
                </g>
              );
            })}

            {/* Σ before the activation */}
            <MathLabel tex={'\\textstyle\\sum_i w_i\\,x_i'} x={368} y={150} fontSize={28} opacity={v('sigmaU')} boxWidth={260} />
            <Label x={368} y={194} text="before the activation" size={18} op={v('sigmaU')} />

            {/* rectifier: input marker on the sum axis, output dot on the curve */}
            {v('reluU') > 0.01 && (
              <g opacity={v('reluU')}>
                <line x1={RO.x - RS - 8} y1={RO.y} x2={RO.x + RS + 8} y2={RO.y} stroke={colors.MUTED} strokeWidth={1.6} />
                <line x1={RO.x} y1={RO.y + 6} x2={RO.x} y2={RO.y - RS - 8} stroke={colors.MUTED} strokeWidth={1.6} />
                <path d={`M${RO.x - RS},${RO.y} L${RO.x},${RO.y} L${RO.x + RS},${RO.y - RS}`} fill="none" stroke={colors.ACCENT} strokeWidth={3} />
                <circle cx={reluDot[0]} cy={RO.y} r={6} fill="none" stroke={sum >= 0 ? colors.WARM : colors.NEGATIVE} strokeWidth={2.4} />
                <circle cx={reluDot[0]} cy={reluDot[1]} r={6.5} fill={colors.ACCENT} />
                <MathLabel tex={'\\max(0,\\Sigma)'} x={RO.x} y={RO.y - RS - 30} fontSize={22} boxWidth={200} />
              </g>
            )}
          </g>
        )}

        {/* ============ C7 lanes: admit cars to specialists, keep dogs out ============ */}
        {lanesU > 0.01 && (
          <g opacity={lanesU}>
            <path d={ptsD(CAR_LANE)} fill="none" stroke={colors.ACCENT} strokeWidth={1.6} strokeDasharray="5 7" opacity={0.45} />
            <path d={ptsD([...DOG_IN, ...DOG_OUT.slice(1)])} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} strokeDasharray="5 7" opacity={0.45} />
            <rect x={860} y={388} width={160} height={44} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
            <Label x={940} y={416} text="car specialists" size={18} color={colors.TEXT} />
            <rect x={352} y={502} width={126} height={40} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
            <Label x={415} y={528} text="dog route" size={18} color={colors.TEXT} />
            {[0, 1, 2].map((i) => {
              const u = clamp01(v('carU') * 1.3 - i * 0.15);
              if (u <= 0 || u >= 1) return null;
              const [x, y] = along(CAR_LANE, u);
              return <path key={`c${i}`} d={CAR_ICON} transform={`translate(${x},${y - 2})`} fill={colors.ACCENT} />;
            })}
            {[0, 1, 2].map((i) => {
              const u = clamp01(v('dogU') * 1.45 - i * 0.22);
              if (u <= 0 || u >= 1) return null;
              const [x, y] = u < 0.42 ? along(DOG_IN, u / 0.42) : u < 0.55 ? DOG_IN[1] : along(DOG_OUT, (u - 0.55) / 0.45);
              return <path key={`d${i}`} d={DOG_ICON} transform={`translate(${x},${y - 2})`} fill={colors.SECONDARY} />;
            })}
          </g>
        )}

        {/* ============ the door (persistent) ============ */}
        {doorOp > 0.01 && (
          <g opacity={doorOp} transform={`translate(${dpx},${dpy}) scale(${dsc}) translate(${-DOOR_C.x},${-DOOR_C.y})`}>
            <rect x={604} y={300} width={72} height={146} fill={colors.PANEL} opacity={0.55} />
            <rect x={596} y={280} width={88} height={20} rx={4} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={2} />
            <rect x={596} y={446} width={88} height={16} rx={4} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={2} />
            <rect x={617} y={428} width={11} height={18} rx={2} fill={press > 0.01 ? colors.NEGATIVE : colors.MUTED} opacity={0.6 + 0.4 * press} />
            <g transform={`translate(${HX},${HY}) rotate(${-th})`}>
              <rect x={-LEAF_W / 2} y={0} width={LEAF_W} height={LEAF_L} rx={4} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={2.2} />
              <rect x={-LEAF_W / 2 + 2} y={4} width={LEAF_W / 2 - 2} height={LEAF_L - 8} fill={colors.NEGATIVE} opacity={0.3} />
              <rect x={0} y={4} width={LEAF_W / 2 - 2} height={LEAF_L - 8} fill={colors.WARM} opacity={0.3} />
            </g>
            <circle cx={HX} cy={HY} r={5} fill={colors.TEXT} />
            {/* pole badges ride on the leaf's faces: V on the opening face, O on the stop face */}
            {(() => {
              const vb = leafPt(36, 74, th);
              const ob = leafPt(-36, 74, th);
              const vs = leafPt(LEAF_W / 2, 74, th);
              const os = leafPt(-LEAF_W / 2, 74, th);
              return (
                <>
                  {v('vBadge') > 0.01 && <line x1={vs[0]} y1={vs[1]} x2={vb[0]} y2={vb[1]} stroke={colors.WARM} strokeWidth={2} opacity={v('vBadge')} />}
                  {v('oBadge') > 0.01 && <line x1={os[0]} y1={os[1]} x2={ob[0]} y2={ob[1]} stroke={colors.NEGATIVE} strokeWidth={2} opacity={v('oBadge')} />}
                  <Badge x={vb[0]} y={vb[1]} kind="V" op={v('vBadge')} />
                  <Badge x={ob[0]} y={ob[1]} kind="O" op={v('oBadge')} />
                </>
              );
            })()}
            {/* pressure: a negative sum pushes the leaf into its stop; it cannot swing the other way */}
            {press > 0.01 && (
              <g opacity={press} stroke={colors.NEGATIVE} strokeWidth={2.4} fill="none" strokeLinecap="round">
                {[0, 1, 2].map((i) => (
                  <path key={i} d={`M${660 + i * 12},${416} l-7,7 l7,7`} />
                ))}
                <path d="M607,432 l-8,-4 M607,438 l-9,0 M607,444 l-8,4" />
              </g>
            )}
          </g>
        )}
        {v('doorLbl') > 0.01 &&
          (() => {
            const [x, y] = doorWorld(640, 462);
            return <Label x={x} y={y + 26} text="schematic gate" size={20} op={v('doorLbl') * doorOp} />;
          })()}

        {/* C8: the rectified output cannot go below zero */}
        <Label x={712} y={334} text="output stays 0; door stays shut" anchor="start" size={18} color={colors.TEXT} op={v('zeroLbl')} />

        {/* ============ C9: the old image ============ */}
        {v('frameU') > 0.01 && (
          <g opacity={v('frameU')}>
            <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx={8} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={2} />
            {SPECKLE.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={colors.SECONDARY} opacity={p.o} />
            ))}
            <g transform={`translate(${FRAME_C.x},${FRAME_C.y})`}>
              {whiskU > 0.01 &&
                WHISKERS.map((d, i) => {
                  const strip = clamp01(whiskU - 1);
                  const dir = i % 4 === 3 || i >= 6 ? 0 : i < 3 ? -1 : 1;
                  return (
                    <path
                      key={i}
                      d={d}
                      transform={`translate(${dir * 40 * strip},${(i >= 6 ? -30 : 0) * strip})`}
                      fill="none"
                      stroke={colors.SECONDARY}
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={`${clamp01(whiskU)} 1`}
                      opacity={1 - strip}
                    />
                  );
                })}
              <path d="M-38,-40 L0,40 L38,-40" fill="none" stroke={colors.WARM} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <Label x={FRAME_C.x} y={FRAME.y + FRAME.h + 30} text="details came with the route" size={18} color={colors.TEXT} op={v('whiskLbl')} />
          </g>
        )}

        {/* ============ C10: the separate circuit read as hidden storage ============ */}
        {clusterU > 0.01 && alignU < 0.99 && (
          <g opacity={clusterU * (1 - alignU)}>
            {CLUSTER_TILES.map((c, i) => (
              <rect key={i} x={c.x - 60} y={c.y - 46} width={120} height={92} rx={10} fill={colors.PANEL} stroke={i === 0 ? colors.ACCENT : colors.GRID} strokeWidth={i === 0 ? 2 : 1.5} />
            ))}
            {v('wireU') > 0.01 &&
              CLUSTER_TILES.slice(1).map((c, i) => (
                <path
                  key={i}
                  d={ptsD([[CLUSTER_TILES[0].x + 60, CLUSTER_TILES[0].y], [c.x - 60, c.y]])}
                  fill="none"
                  stroke={colors.ACCENT}
                  strokeWidth={2}
                  pathLength={1}
                  strokeDasharray={`${v('wireU')} 1`}
                  opacity={0.6}
                />
              ))}
          </g>
        )}

        {/* ============ gallery cells (C12–C14) ============ */}
        {galleryU > 0.01 &&
          CELL_IDS.map((id) => {
            const c = CELLS[id];
            const solo = id[0] === 'K';
            const fin = c.final !== null;
            const x = fin ? lerp(c.gx, FX[c.final!], finalU) : c.gx;
            const y = fin ? lerp(c.gy, FY, finalU) : c.gy;
            const op = galleryU * (solo ? kRev(c.gx) : 1) * (fin ? 1 : 1 - finalU);
            if (op <= 0.01) return null;
            const glow = solo ? v('kGlow') : 0;
            return (
              <g key={id} opacity={op}>
                <rect x={x - 62} y={y - 54} width={124} height={108} rx={10} fill={colors.PANEL} stroke={glow > 0.01 ? colors.ACCENT : colors.GRID} strokeWidth={1.5 + 2 * glow} />
              </g>
            );
          })}

        {/* ============ figures (cars and dogs as pose wireframes) ============ */}
        {(clusterU > 0.01 || galleryU > 0.01) &&
          FIGURES.map((f, i) => {
            const p = poseOf(f);
            if (p.op <= 0.01) return null;
            return (
              <path
                key={i}
                d={wirePath(f.kind === 'car' ? CAR_SEGS : DOG_SEGS, p.yaw, p.S, p.x, p.y)}
                fill="none"
                stroke={f.kind === 'car' ? colors.ACCENT : colors.SECONDARY}
                strokeWidth={p.S > 40 ? 2.2 : 1.6}
                strokeLinecap="round"
                opacity={p.op}
              />
            );
          })}

        {/* C11 guides: each figure's heading line; they coincide once the view angles match */}
        {v('guideU') > 0.01 &&
          (() => {
            const g = v('guideU');
            const heroes = FIGURES.slice(0, 2).map(poseOf);
            const merged = clamp01((rotateU - 0.92) / 0.08);
            return (
              <g opacity={g}>
                {heroes.map((p, i) => {
                  const [hx, hy] = heading(p.yaw);
                  const [gx, gy] = groundOf(p.x, p.y, p.S);
                  return (
                    <line
                      key={i}
                      x1={gx - hx * 120}
                      y1={gy - hy * 120}
                      x2={gx + hx * 120}
                      y2={gy + hy * 120}
                      stroke={i ? colors.SECONDARY : colors.ACCENT}
                      strokeWidth={2}
                      strokeDasharray="7 6"
                      opacity={0.85 * (1 - merged)}
                    />
                  );
                })}
                {merged > 0.01 &&
                  (() => {
                    const [gx0, gy0] = groundOf(heroes[0].x, heroes[0].y, heroes[0].S);
                    const [hx, hy] = heading(POSE_YAW);
                    return <line x1={gx0 - hx * 150} y1={gy0 - hy * 150} x2={gx0 + hx * 430} y2={gy0 + hy * 430} stroke={colors.TEXT} strokeWidth={2.6} opacity={merged} />;
                  })()}
              </g>
            );
          })()}

        {/* C10 veil + stamp (above the figures) */}
        {v('veilU') > 0.01 && (
          <g opacity={v('veilU')}>
            <rect x={362} y={186} width={276} height={298} rx={12} fill={colors.PANEL} fillOpacity={0.55} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="6 6" />
            <rect x={362} y={186} width={276} height={298} rx={12} fill="url(#ch2-hatch)" />
            <Label x={500} y={174} text="read as hidden storage" size={18} color={colors.TEXT} />
          </g>
        )}
        {v('stampU') > 0.01 && (
          <g opacity={clamp01(v('stampU'))} transform={`rotate(-10, 500, 335) translate(500,335) scale(${v('stampU')}) translate(-500,-335)`}>
            <rect x={414} y={312} width={172} height={46} rx={6} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={3} />
            <Label x={500} y={344} text="challenged" size={26} color={colors.NEGATIVE} weight={700} />
          </g>
        )}

        {/* C12 badge + the fan to the gate and later circuits */}
        {v('badgeU') > 0.01 && (
          <g opacity={v('badgeU')}>
            <rect x={340} y={150} width={280} height={34} rx={17} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <Label x={480} y={173} text="more than 100 reported" size={18} color={colors.WARM} />
          </g>
        )}
        {fanU > 0.01 &&
          (() => {
            const [inX, inY] = doorWorld(INLET_X, LANE_Y);
            const [outX, outY] = doorWorld(OUTLET_X, LANE_Y);
            const blocks = [
              { x: lerp(1000, 960, finalU), y: lerp(255, 180, finalU), label: 'car specialists' },
              { x: lerp(1000, 960, finalU), y: lerp(335, 262, finalU), label: 'finer poses' },
            ];
            const bw = lerp(180, 190, finalU);
            const bracketOp = 1 - finalU;
            return (
              <g opacity={rightDim}>
                {bracketOp > 0.01 && (
                  <path
                    d={`M762,${GY[0] - 54} L776,${GY[0] - 54} L776,${GY[1] + 54} L762,${GY[1] + 54} M776,${(GY[0] + GY[1]) / 2} L${inX},${inY}`}
                    fill="none"
                    stroke={colors.MUTED}
                    strokeWidth={2}
                    pathLength={1}
                    strokeDasharray={`${fanU} 1`}
                    opacity={0.8 * bracketOp}
                  />
                )}
                {finalU > 0.01 && (
                  <path
                    d={`${FX.map((x) => `M${x},${FY + 54} L${x},${FY + 78}`).join('')} M${FX[0]},${FY + 78} L748,${FY + 78} L748,${inY} L${inX},${inY}`}
                    fill="none"
                    stroke={colors.MUTED}
                    strokeWidth={2}
                    opacity={0.8 * finalU}
                  />
                )}
                {blocks.map((b, i) => (
                  <g key={i}>
                    <path
                      d={`M${outX},${outY} C${outX + 40},${outY} ${b.x - 40},${b.y + 20} ${b.x},${b.y + 20}`}
                      fill="none"
                      stroke={colors.MUTED}
                      strokeWidth={2}
                      pathLength={1}
                      strokeDasharray={`${fanU} 1`}
                      opacity={0.8}
                    />
                    <rect x={b.x} y={b.y} width={bw} height={40} rx={10} fill={colors.PANEL} stroke={i ? colors.SECONDARY : colors.ACCENT} strokeWidth={1.8} opacity={clamp01((fanU - 0.5) * 2)} />
                    <Label x={b.x + bw / 2} y={b.y + 27} text={b.label} size={18} color={colors.TEXT} op={clamp01((fanU - 0.6) * 2.5)} />
                  </g>
                ))}
                <Label x={lerp(1090, 1055, finalU)} y={240} text="later circuits" size={20} op={clamp01((fanU - 0.6) * 2.5) * (1 - splitU)} />
              </g>
            );
          })()}

        {/* C13 dog veil and the natural-image sweep */}
        {v('dogVeil') > 0.01 && sweepX < VEIL.x1 && (
          <g opacity={v('dogVeil')}>
            {/* one veil panel per gallery column; each dissolves whole as the sweep crosses it, so no tile is ever sliced */}
            {GX.map((gx) => {
              const x0 = gx - 70;
              const op = 0.9 * (1 - clamp01((sweepX - x0) / 140));
              return op > 0.01 ? <rect key={gx} x={x0} y={VEIL.y0} width={140} height={VEIL.y1 - VEIL.y0} fill={colors.PANEL} opacity={op} /> : null;
            })}
            {VEIL_DOGS.map((p, i) => {
              const x0 = VEIL.x0 + 140 * Math.floor((p.x - VEIL.x0) / 140);
              const op = 0.5 * (1 - clamp01((sweepX - x0) / 140));
              if (op <= 0.01) return null;
              return <path key={i} d={DOG_ICON} transform={`translate(${p.x},${p.y}) scale(1.5)`} fill={colors.SECONDARY} opacity={op} />;
            })}
            <Label x={480} y={470} text="optimizer drifts toward dogs" size={18} color={colors.TEXT} op={clamp01(1 - sweepU * 1.5)} />
          </g>
        )}
        {v('sweepOp') > 0.01 && (
          <g opacity={v('sweepOp')}>
            <line x1={sweepX} y1={VEIL.y0 - 6} x2={sweepX} y2={VEIL.y1 + 6} stroke={colors.POSITIVE} strokeWidth={3} />
            <Label x={Math.min(Math.max(sweepX, 300), 700)} y={170} text="natural image paths" size={18} color={colors.POSITIVE} />
          </g>
        )}

        {/* ============ closing panel (opaque) ============ */}
        {panelU > 0.01 && (
          <g opacity={panelU}>
            <rect x={200} y={384} width={880} height={190} rx={16} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <rect x={200} y={384} width={880} height={190} rx={16} fill={colors.PANEL} opacity={0.6} />
            <g transform="translate(300,479)">
              <circle r={40} fill="none" stroke={colors.WARM} strokeWidth={2.4} />
              <path d="M-18,-15 L0,18 L18,-15" fill="none" stroke={colors.WARM} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <g transform="translate(400,479)">
              <circle r={40} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.4} />
              <circle r={16} fill="none" stroke={colors.NEGATIVE} strokeWidth={6} />
            </g>
            <Label x={470} y={489} text="Check the distinction and its readers." anchor="start" size={28} color={colors.TEXT} weight={650} />
          </g>
        )}
      </Camera>

      {/* screen-space: safe-area matte (keeps y ≥ 630 empty under any camera) and the status chip */}
      <rect x={0} y={598} width={STAGE_W} height={34} fill="url(#ch2-matte)" />
      <rect x={0} y={632} width={STAGE_W} height={STAGE_H - 632} fill={colors.BG} />
      {(() => {
        const text = CHIPS[Math.max(0, Math.min(CHIPS.length - 1, Math.round(v('chip'))))];
        const w = text.length * 10.6 + 32;
        const op = v('doorU');
        if (op <= 0.01) return null;
        return (
          <g opacity={op}>
            <rect x={28} y={24} width={w} height={40} rx={20} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={28 + 16} y={51} fill={colors.TEXT} fillOpacity={0.85} fontSize={20}>
              {text}
            </text>
          </g>
        );
      })()}
    </>
  );
}

export const vizScene = () => scene;
