// An Eight-Foot Cube
//
// Backing source: "Build a Simple Shed: a Complete Guide" (Instructables,
// seamster, steps 1–3): an 8x8x8-ft shed, ~$1200 in 2015 dollars, sized to
// standard lumber (8-ft boards, 4x8 sheet goods, so almost zero waste);
// permit-free as an "accessory structure" (≤120 sq ft, ≤8 ft tall, not wired
// for power); built over a backyard lawn with about 12 inches of slope.
//
// Centerpiece: an isometric wireframe cube that assembles itself from the
// dimensions lumber already comes in — 8-ft boards slide onto its edges, two
// 4x8 sheets tile its floor — then the ground line arrives and one whole
// corner is left floating in the air.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Isometric projection — feet in, stage pixels out. The cube is the one
// persistent object of the chapter (and of the whole book).
// ---------------------------------------------------------------------------

const S = 27; // pixels per foot
const CX = 500;
const CY = 348;
const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;
const iso = (x: number, y: number, z: number): { X: number; Y: number } => ({
  X: CX + (x - z) * COS30 * S,
  Y: CY + (x + z) * SIN30 * S - y * S,
});

// the 12 cube edges, ordered so the draw-on sweeps bottom ring → posts → top ring
type P3 = [number, number, number];
const EDGES: { a: P3; b: P3; delay: number }[] = [
  { a: [0, 0, 0], b: [8, 0, 0], delay: 0.0 },
  { a: [8, 0, 0], b: [8, 0, 8], delay: 0.06 },
  { a: [8, 0, 8], b: [0, 0, 8], delay: 0.12 },
  { a: [0, 0, 8], b: [0, 0, 0], delay: 0.18 },
  { a: [0, 0, 0], b: [0, 8, 0], delay: 0.3 },
  { a: [8, 0, 0], b: [8, 8, 0], delay: 0.34 },
  { a: [8, 0, 8], b: [8, 8, 8], delay: 0.38 },
  { a: [0, 0, 8], b: [0, 8, 8], delay: 0.42 },
  { a: [0, 8, 0], b: [8, 8, 0], delay: 0.54 },
  { a: [8, 8, 0], b: [8, 8, 8], delay: 0.6 },
  { a: [8, 8, 8], b: [0, 8, 8], delay: 0.66 },
  { a: [0, 8, 8], b: [0, 8, 0], delay: 0.72 },
];

// three 8-ft boards that slide onto the edges meeting at the front corner
const BOARDS: { a: P3; b: P3; slide: P3 }[] = [
  { a: [0, 0, 8], b: [8, 0, 8], slide: [0, -1.4, 1.2] },
  { a: [8, 0, 0], b: [8, 0, 8], slide: [1.4, -1.4, 0] },
  { a: [8, 0, 8], b: [8, 8, 8], slide: [1.3, 0, 1.3] },
];

// the floor face, tiled by exactly two 4x8 sheets
const SHEETS: P3[][] = [
  [
    [0, 0, 0],
    [8, 0, 0],
    [8, 0, 4],
    [0, 0, 4],
  ],
  [
    [0, 0, 4],
    [8, 0, 4],
    [8, 0, 8],
    [0, 0, 8],
  ],
];

// ground plane: the lawn drops 1 ft (12 in) along +x
const groundY = (x: number): number => -(x / 8);
const GROUND: P3[] = [
  [-1.6, groundY(-1.6), -1.6],
  [9.4, groundY(9.4), -1.6],
  [9.4, groundY(9.4), 9.4],
  [-1.6, groundY(-1.6), 9.4],
];

// the clutter with nowhere to live (step 1's inventory)
const CLUTTER = [
  { label: 'bikes', x: 200, y: 170 },
  { label: 'lawnmower', x: 330, y: 250 },
  { label: 'wheelbarrow', x: 165, y: 320 },
  { label: 'garden tools', x: 310, y: 400 },
] as const;
const STASH = iso(4, 1.4, 4); // where the clutter disappears to

// permit checklist (the guide's real city rules)
const RULES = [
  { rule: '120 sq ft or less', fact: 'this shed: 64' },
  { rule: '8 ft tall or less', fact: 'exactly 8' },
  { rule: 'not wired for power', fact: 'no wiring' },
] as const;

const CAM_CLUTTER: CameraState = { x: 400, y: 300, k: 1.32 };
const CAM_CUBE: CameraState = { x: 560, y: 340, k: 1.1 };
const CAM_RULES: CameraState = { x: 780, y: 330, k: 1.14 };
const CAM_SLOPE: CameraState = { x: 620, y: 400, k: 1.16 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  clutterU: ChannelRef<number>;
  stashU: ChannelRef<number>;
  cubeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  boardU: ChannelRef<number>;
  sheetU: ChannelRef<number>;
  costU: ChannelRef<number>;
  rulesU: ChannelRef<number>;
  digU: ChannelRef<number>;
  groundU: ChannelRef<number>;
  gapU: ChannelRef<number>;
  sideDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CLUTTER, cameraInterp);
  const clutterU = tl.channel('clutterU', 0);
  const stashU = tl.channel('stashU', 0);
  const cubeU = tl.channel('cubeU', 0);
  const dimU = tl.channel('dimU', 0);
  const boardU = tl.channel('boardU', 0);
  const sheetU = tl.channel('sheetU', 0);
  const costU = tl.channel('costU', 0);
  const rulesU = tl.channel('rulesU', 0);
  const digU = tl.channel('digU', 0);
  const groundU = tl.channel('groundU', 0);
  const gapU = tl.channel('gapU', 0);
  const sideDim = tl.channel('sideDim', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the clutter —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'A familiar backyard problem: a couple of bikes, a lawnmower, a wheelbarrow, and every garden tool you own — and nowhere to keep any of it.',
  });
  tl.tween(clutterU, 1, { at: 0.5, dur: 1.8, ease: ease.enter });
  tl.hold(6.7, 0.5);

  // — Beat 2 · the cube —
  tl.caption({
    at: 7.2,
    dur: 6.4,
    text: 'This build guide answers with a shed that is essentially an eight-foot cube. Big enough to swallow all of it, small enough to stay a backyard project.',
  });
  tl.tween(cam, CAM_CUBE, { at: 7.4, dur: 1.6, ease: ease.move });
  tl.tween(cubeU, 1, { at: 7.6, dur: 2.2, ease: ease.draw });
  tl.tween(stashU, 1, { at: 10.4, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 11.6, dur: 0.8, ease: ease.enter });
  tl.hold(13.6, 0.5);

  // — Beat 3 · lumber already comes in these sizes —
  tl.caption({
    at: 14.1,
    dur: 7.2,
    text: 'Eight feet is not a random number. Boards come eight feet long, and sheet goods come four feet by eight — so whole boards and whole sheets fit this cube with almost nothing left over.',
  });
  tl.tween(boardU, 1, { at: 14.6, dur: 1.5, ease: ease.move });
  tl.tween(sheetU, 1, { at: 17.2, dur: 2.2, ease: ease.draw });
  tl.hold(21.3, 0.5);

  // — Beat 4 · the budget —
  tl.caption({
    at: 21.8,
    dur: 5.6,
    text: 'Building to the sizes the lumberyard already sells kept the whole shed to about twelve hundred dollars — and left barely a scrap pile at all.',
  });
  tl.tween(costU, 1, { at: 22.4, dur: 0.6, ease: ease.pop });
  tl.hold(27.4, 0.5);

  // — Beat 5 · the permit rules —
  tl.caption({
    at: 27.9,
    dur: 7.4,
    text: 'The size buys something else, too. In the builder’s city, a structure one hundred twenty square feet or smaller, eight feet tall or less, and never wired for power needs no permit at all.',
  });
  tl.tween(cam, CAM_RULES, { at: 28.1, dur: 1.5, ease: ease.move });
  tl.tween(rulesU, 1, { at: 28.9, dur: 2.4, ease: ease.move });
  tl.hold(35.3, 0.4);

  // — Beat 6 · call before you dig —
  tl.caption({
    at: 35.7,
    dur: 5.8,
    text: 'Check your own city’s rules before you cut anything. And if you plan to dig, call first and have the buried utility lines marked. It costs nothing, and most places require it.',
  });
  tl.tween(digU, 1, { at: 36.3, dur: 0.8, ease: ease.enter });
  tl.hold(41.5, 0.5);

  // — Beat 7 · the sloped lawn —
  tl.caption({
    at: 42.0,
    dur: 6.6,
    text: 'There is one catch waiting in this particular backyard: the lawn drops about a foot across those eight feet. Set the cube down and one whole corner floats in the air.',
  });
  tl.tween(cam, CAM_SLOPE, { at: 42.2, dur: 1.6, ease: ease.move });
  tl.tween(sideDim, 0.18, { at: 42.2, dur: 1.2, ease: ease.move });
  tl.tween(groundU, 1, { at: 42.8, dur: 1.6, ease: ease.draw });
  tl.tween(gapU, 1, { at: 45.4, dur: 1.0, ease: ease.enter });
  tl.hold(48.6, 0.5);

  // — Beat 8 · the plan —
  tl.caption({
    at: 49.1,
    dur: 6.6,
    text: 'So that is the plan: one level cube, built from whole boards and whole sheets, on ground that has to be convinced first. Convincing the ground is where the real work begins.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 49.3, dur: 1.8, ease: ease.move });
  tl.tween(dimU, 0.15, { at: 49.5, dur: 1.2, ease: ease.move });
  tl.tween(boardU, 0.12, { at: 49.5, dur: 1.2, ease: ease.move });
  tl.tween(sheetU, 0.12, { at: 49.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.6, dur: 0.9, ease: ease.enter });
  tl.hold(55.7, 1.6);

  return {
    tl,
    cam,
    clutterU,
    stashU,
    cubeU,
    dimU,
    boardU,
    sheetU,
    costU,
    rulesU,
    digU,
    groundU,
    gapU,
    sideDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — every frame a pure function of the sampled channels.
// ---------------------------------------------------------------------------

function Edge({ a, b, u }: { a: P3; b: P3; u: number }) {
  if (u <= 0) return null;
  const p = iso(...a);
  const q = iso(...b);
  return (
    <line
      x1={p.X}
      y1={p.Y}
      x2={q.X}
      y2={q.Y}
      stroke={colors.ACCENT}
      strokeWidth={2.2}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - u}
      opacity={0.9}
    />
  );
}

const poly = (pts: P3[]): string => pts.map((p) => {
  const q = iso(...p);
  return `${q.X},${q.Y}`;
}).join(' ');

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const clutterU = s.get(scene.clutterU);
  const stashU = s.get(scene.stashU);
  const cubeU = s.get(scene.cubeU);
  const dimU = s.get(scene.dimU);
  const boardU = s.get(scene.boardU);
  const sheetU = s.get(scene.sheetU);
  const costU = s.get(scene.costU);
  const rulesU = s.get(scene.rulesU);
  const digU = s.get(scene.digU);
  const groundU = s.get(scene.groundU);
  const gapU = s.get(scene.gapU);
  const sideDim = s.get(scene.sideDim);
  const closeU = s.get(scene.closeU);

  const dimLabel = (a: P3, b: P3, dx: number, dy: number, text: string) => {
    const p = iso(...a);
    const q = iso(...b);
    return (
      <text
        x={(p.X + q.X) / 2 + dx}
        y={(p.Y + q.Y) / 2 + dy}
        textAnchor="middle"
        fill={colors.TEXT}
        fontSize={15}
        fontWeight={600}
        opacity={dimU}
      >
        {text}
      </text>
    );
  };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the lawn, arriving late ---- */}
        {groundU > 0 && (
          <g opacity={groundU}>
            <polygon points={poly(GROUND)} fill={colors.POSITIVE} opacity={0.1} />
            <line
              x1={iso(-1.6, groundY(-1.6), 8).X}
              y1={iso(-1.6, groundY(-1.6), 8).Y}
              x2={iso(9.4, groundY(9.4), 8).X}
              y2={iso(9.4, groundY(9.4), 8).Y}
              stroke={colors.POSITIVE}
              strokeWidth={2.5}
              opacity={0.8}
            />
            <line
              x1={iso(8, groundY(8), 8.9).X}
              y1={iso(8, groundY(8), 8.9).Y}
              x2={iso(8, groundY(8), -1.2).X}
              y2={iso(8, groundY(8), -1.2).Y}
              stroke={colors.POSITIVE}
              strokeWidth={1.6}
              opacity={0.5}
            />
          </g>
        )}
        {/* the floating-corner gap */}
        {gapU > 0 && (
          <g opacity={gapU}>
            <polygon
              points={poly([
                [8, 0, 8],
                [8, 0, 3.5],
                [8, groundY(8), 3.5],
                [8, groundY(8), 8],
              ])}
              fill={colors.NEGATIVE}
              opacity={0.3}
            />
            <line
              x1={iso(8.45, 0, 8).X}
              y1={iso(8.45, 0, 8).Y}
              x2={iso(8.45, groundY(8), 8).X}
              y2={iso(8.45, groundY(8), 8).Y}
              stroke={colors.NEGATIVE}
              strokeWidth={2}
            />
            <text
              x={iso(8.7, groundY(8) / 2, 8).X + 8}
              y={iso(8.7, groundY(8) / 2, 8).Y + 4}
              fill={colors.NEGATIVE}
              fontSize={14}
              fontWeight={600}
            >
              ~12 in
            </text>
          </g>
        )}

        {/* ---- the cube ---- */}
        {EDGES.map((e, i) => (
          <Edge key={i} a={e.a} b={e.b} u={clamp01((cubeU - e.delay) / 0.28)} />
        ))}

        {/* two 4x8 sheets tile the floor exactly */}
        {SHEETS.map((quad, i) => {
          const u = clamp01(sheetU * 2 - i * 0.8);
          if (u <= 0) return null;
          return (
            <g key={i} opacity={u}>
              <polygon points={poly(quad)} fill={colors.SECONDARY} opacity={0.24} stroke={colors.SECONDARY} strokeWidth={1.4} />
            </g>
          );
        })}
        {sheetU > 0.5 && (
          <text
            x={iso(4, 0, 6).X}
            y={iso(4, 0, 6).Y + 5}
            textAnchor="middle"
            fill={colors.SECONDARY}
            fontSize={13}
            fontWeight={600}
            opacity={clamp01(sheetU * 2 - 1)}
          >
            two 4×8 sheets — zero cuts
          </text>
        )}

        {/* boards slide onto the front edges */}
        {BOARDS.map((bd, i) => {
          const u = clamp01(boardU * 3 - i * 0.9);
          if (u <= 0) return null;
          const off = 1 - u;
          const a = iso(
            bd.a[0] + bd.slide[0] * off,
            bd.a[1] + bd.slide[1] * off,
            bd.a[2] + bd.slide[2] * off,
          );
          const b = iso(
            bd.b[0] + bd.slide[0] * off,
            bd.b[1] + bd.slide[1] * off,
            bd.b[2] + bd.slide[2] * off,
          );
          return (
            <line
              key={i}
              x1={a.X}
              y1={a.Y}
              x2={b.X}
              y2={b.Y}
              stroke={colors.WARM}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={0.85 * u}
            />
          );
        })}
        {boardU > 0.6 && (
          <text
            x={iso(4, 0, 8).X - 10}
            y={iso(4, 0, 8).Y + 30}
            textAnchor="middle"
            fill={colors.WARM}
            fontSize={13}
            fontWeight={600}
            opacity={clamp01(boardU * 2 - 1) * Math.min(1, boardU)}
          >
            8-ft boards, uncut
          </text>
        )}

        {/* dimension labels */}
        <g opacity={dimU}>
          {dimLabel([0, 0, 0], [8, 0, 0], 0, -14, '8 ft')}
          {dimLabel([8, 0, 0], [8, 8, 0], 34, 0, '8 ft')}
          {dimLabel([0, 0, 0], [0, 0, 8], -34, 0, '8 ft')}
        </g>

        {/* ---- the clutter chips ---- */}
        {CLUTTER.map((c, i) => {
          const inU = clamp01(clutterU * 3 - i * 0.5);
          if (inU <= 0) return null;
          const gone = clamp01(stashU * 2.4 - i * 0.35);
          const x = c.x + (STASH.X - c.x) * gone;
          const y = c.y + (STASH.Y - c.y) * gone;
          const k = 1 - 0.55 * gone;
          const w = (c.label.length * 7.5 + 30) * k;
          return (
            <g key={c.label} opacity={inU * (1 - gone * gone)}>
              <rect x={x - w / 2} y={y - 15 * k} width={w} height={30 * k} rx={15 * k} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={x} y={y + 4.5 * k} textAnchor="middle" fill={colors.TEXT} fontSize={13.5 * k}>
                {c.label}
              </text>
            </g>
          );
        })}

        {/* ---- right column: budget, rules, dig note ---- */}
        <g opacity={costU * sideDim}>
          <rect x={870} y={128} width={330} height={64} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={892} y={156} fill={colors.TEXT} fontSize={15}>
            all-in materials
          </text>
          <text x={1178} y={160} textAnchor="end" fill={colors.WARM} fontSize={22} fontWeight={700}>
            ≈ $1,200
          </text>
          <text x={892} y={178} fill={colors.MUTED} fontSize={11.5}>
            2015 prices · scrap pile: nearly empty
          </text>
        </g>
        <g opacity={rulesU * sideDim}>
          <rect x={870} y={214} width={330} height={170} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={892} y={244} fill={colors.TEXT} fontSize={15} fontWeight={600}>
            accessory structure — no permit
          </text>
          {RULES.map((r, i) => {
            const u = clamp01(rulesU * 3 - i * 0.8);
            return (
              <g key={r.rule} opacity={u}>
                <circle cx={902} cy={274 + i * 34} r={9} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
                <path
                  d={`M ${897} ${274 + i * 34} l 4 4.5 l 7 -8`}
                  fill="none"
                  stroke={colors.POSITIVE}
                  strokeWidth={2.2}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - u}
                />
                <text x={922} y={278 + i * 34} fill={colors.TEXT} fontSize={13.5}>
                  {r.rule}
                </text>
                <text x={1178} y={278 + i * 34} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                  {r.fact}
                </text>
              </g>
            );
          })}
        </g>
        <g opacity={digU * sideDim}>
          <rect x={870} y={404} width={330} height={54} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.5} />
          <text x={892} y={427} fill={colors.WARM} fontSize={13.5} fontWeight={600}>
            digging? call before you dig
          </text>
          <text x={892} y={446} fill={colors.MUTED} fontSize={11.5}>
            utility locates are free — and required
          </text>
        </g>

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={330} y={216} width={620} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              whole boards · whole sheets · one level cube
            </text>
            <text x={640} y={314} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              first, make the ground agree
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
