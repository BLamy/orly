// A Floor That Never Sags
//
// Backing source: "Build a Simple Shed: a Complete Guide" (Instructables,
// seamster, steps 7–10): floor frame of pressure-treated 8-ft 2x6 boards
// with the rim doubled and corners lapped; 3" galvanized 5/16" lag bolts in
// pre-drilled counterbored holes at the risers, 3" exterior screws (also
// pre-drilled) elsewhere; landscaping adhesive on the blocks; corner-to-
// corner square check; galvanized joist hangers nailed every 16 in; joists
// screwed through the hangers; 2x6 blocking toe-screwed mid-span; two 4x8
// sheets of 23/32" tongue-and-groove OSB screwed every 8 in; the overhanging
// tongue trimmed flush. Joists at 16" centers while walls get 24".
//
// Centerpiece: a plan-view assembly machine — the frame accretes ring by
// ring, hangers tick in on the 16-inch grid, joists drop into their saddles,
// and the deck lands as exactly two factory sheets under a rain of screws.
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
// Plan view: inches in, stage pixels out. The footprint is 96 x 96 in.
// ---------------------------------------------------------------------------

const PX = 4.55; // pixels per inch
const X0 = 176;
const Y0 = 112;
const px = (xin: number): number => X0 + xin * PX;
const py = (yin: number): number => Y0 + yin * PX;
const BOARD = 1.5 * PX * 1.35; // a 2x6 seen on edge (slightly exaggerated to read)

// inner ring: top/bottom boards run full width, sides tuck between
const INNER = [
  { x: 0, y: 0, w: 96, h: 1.5 },
  { x: 0, y: 94.5, w: 96, h: 1.5 },
  { x: 0, y: 1.5, w: 1.5, h: 93 },
  { x: 94.5, y: 1.5, w: 1.5, h: 93 },
] as const;
// outer ring laps the other way: sides run long, top/bottom tuck between
const OUTER = [
  { x: -1.5, y: -1.5, w: 1.5, h: 99 },
  { x: 96, y: -1.5, w: 1.5, h: 99 },
  { x: 0, y: -1.5, w: 96, h: 1.5 },
  { x: 0, y: 96, w: 96, h: 1.5 },
] as const;

const JOISTS_IN = [16, 32, 48, 64, 80]; // 16-in centers
const GAPS = [8, 24, 40, 56, 72, 88]; // midpoints between joists (blocking)

// deck screws: along each joist line + both rims, every 8 in
const SCREWS: { x: number; y: number; k: number }[] = [];
{
  let k = 0;
  for (const jx of [2, ...JOISTS_IN, 94]) {
    for (let y = 4; y <= 92; y += 8) SCREWS.push({ x: jx, y, k: k++ });
  }
}

const CAM_WIDE: CameraState = { x: 560, y: 340, k: 1.12 };
const CAM_DETAIL: CameraState = { x: 940, y: 300, k: 1.32 };
const CAM_FRAME: CameraState = { x: 400, y: 330, k: 1.28 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  supportsU: ChannelRef<number>;
  innerU: ChannelRef<number>;
  detailU: ChannelRef<number>;
  boltU: ChannelRef<number>;
  outerU: ChannelRef<number>;
  lapU: ChannelRef<number>;
  diagU: ChannelRef<number>;
  hangerU: ChannelRef<number>;
  joistU: ChannelRef<number>;
  blockU: ChannelRef<number>;
  deckU: ChannelRef<number>;
  screwU: ChannelRef<number>;
  trimU: ChannelRef<number>;
  detailDim: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const supportsU = tl.channel('supportsU', 0);
  const innerU = tl.channel('innerU', 0);
  const detailU = tl.channel('detailU', 0);
  const boltU = tl.channel('boltU', 0);
  const outerU = tl.channel('outerU', 0);
  const lapU = tl.channel('lapU', 0);
  const diagU = tl.channel('diagU', 0);
  const hangerU = tl.channel('hangerU', 0);
  const joistU = tl.channel('joistU', 0);
  const blockU = tl.channel('blockU', 0);
  const deckU = tl.channel('deckU', 0);
  const screwU = tl.channel('screwU', 0);
  const trimU = tl.channel('trimU', 0);
  const detailDim = tl.channel('detailDim', 1);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the rule: overbuild the floor —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'The rule for this floor is simple: overbuild it. The walls will get studs every twenty-four inches. The floor gets joists every sixteen — nobody has ever complained that a shed floor felt too solid.',
  });
  tl.tween(gridU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(supportsU, 1, { at: 2.6, dur: 1.2, ease: ease.enter });
  tl.hold(7.1, 0.5);

  // — Beat 2 · the inner ring —
  tl.caption({
    at: 7.6,
    dur: 6.0,
    text: 'Four pressure-treated two-by-six boards form the first ring — eight feet on a side, resting on the blocks and risers from last chapter.',
  });
  tl.tween(innerU, 1, { at: 8.0, dur: 2.4, ease: ease.draw });
  tl.hold(13.6, 0.5);

  // — Beat 3 · how it is fastened —
  tl.caption({
    at: 14.1,
    dur: 7.0,
    text: 'Where the frame crosses a riser, it is held by three-inch galvanized lag bolts in pre-drilled, counterbored holes, so the heads sit below the surface. Everywhere else: three-inch exterior screws, always pre-drilled.',
  });
  tl.tween(cam, CAM_DETAIL, { at: 14.3, dur: 1.5, ease: ease.move });
  tl.tween(detailU, 1, { at: 14.8, dur: 0.9, ease: ease.enter });
  tl.tween(boltU, 1, { at: 16.4, dur: 2.2, ease: ease.move });
  tl.hold(21.1, 0.5);

  // — Beat 4 · double the rim, lap the corners —
  tl.caption({
    at: 21.6,
    dur: 6.2,
    text: 'A second ring doubles the rim, corners lapped like a log cabin so no two joints line up. The frame is now two boards thick all the way around.',
  });
  tl.tween(cam, CAM_FRAME, { at: 21.8, dur: 1.5, ease: ease.move });
  tl.tween(detailDim, 0, { at: 21.8, dur: 1.0, ease: ease.move });
  tl.tween(outerU, 1, { at: 22.4, dur: 2.4, ease: ease.draw });
  tl.tween(lapU, 1, { at: 25.4, dur: 0.8, ease: ease.pop });
  tl.hold(27.8, 0.5);

  // — Beat 5 · square, again —
  tl.caption({
    at: 28.3,
    dur: 5.4,
    text: 'Before anything lands on it: corner to corner, both ways, until the diagonals agree. Squareness is cheap now and impossible later.',
  });
  tl.tween(diagU, 1, { at: 28.8, dur: 1.4, ease: ease.draw });
  tl.tween(diagU, 0, { at: 33.4, dur: 1.0, ease: ease.move });
  tl.hold(33.7, 0.4);

  // — Beat 6 · sixteen-inch saddles —
  tl.caption({
    at: 34.1,
    dur: 6.0,
    text: 'Galvanized joist hangers are nailed inside the rim every sixteen inches — little steel saddles, each one waiting to catch a joist.',
  });
  tl.tween(hangerU, 1, { at: 34.6, dur: 2.6, ease: ease.move });
  tl.hold(40.1, 0.5);

  // — Beat 7 · joists drop in —
  tl.caption({
    at: 40.6,
    dur: 5.4,
    text: 'Five joists drop into the saddles and are screwed home through the hanger holes with three-inch exterior screws.',
  });
  tl.tween(joistU, 1, { at: 41.0, dur: 2.6, ease: ease.move });
  tl.hold(46.0, 0.5);

  // — Beat 8 · blocking at mid-span —
  tl.caption({
    at: 46.5,
    dur: 6.2,
    text: 'Across the middle of the span, short blocks are toe-screwed between the joists. They stiffen the floor, and they catch the edges of the two floor sheets that will meet right there.',
  });
  tl.tween(blockU, 1, { at: 47.0, dur: 2.2, ease: ease.move });
  tl.hold(52.7, 0.5);

  // — Beat 9 · the deck lands —
  tl.caption({
    at: 53.2,
    dur: 6.8,
    text: 'The deck is exactly two factory sheets of tongue-and-groove floor sheathing, just under three-quarters of an inch thick, screwed down every eight inches into the rims and every joist.',
  });
  tl.tween(cam, CAM_WIDE, { at: 53.4, dur: 1.5, ease: ease.move });
  tl.tween(deckU, 1, { at: 53.9, dur: 2.2, ease: ease.move });
  tl.tween(screwU, 1, { at: 56.3, dur: 2.8, ease: ease.linear });
  tl.hold(60.5, 0.5);

  // — Beat 10 · trim the tongue —
  tl.caption({
    at: 61.0,
    dur: 5.6,
    text: 'One tongue ends up hanging past the frame, so a single pass with the circular saw trims it flush. The platform is done: dead level, dead square.',
  });
  tl.tween(trimU, 1, { at: 61.6, dur: 2.0, ease: ease.move });
  tl.hold(66.1, 0.5);

  // — Beat 11 · the floor is the factory —
  tl.caption({
    at: 66.6,
    dur: 6.2,
    text: 'And remember this platform — it is not just a floor. Every wall and every roof truss is about to be built lying flat on top of it. The floor is the factory.',
  });
  tl.tween(dimAll, 0.18, { at: 67.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 68.4, dur: 0.9, ease: ease.enter });
  tl.hold(72.8, 1.6);

  return {
    tl,
    cam,
    gridU,
    supportsU,
    innerU,
    detailU,
    boltU,
    outerU,
    lapU,
    diagU,
    hangerU,
    joistU,
    blockU,
    deckU,
    screwU,
    trimU,
    detailDim,
    dimAll,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const boardRect = (
  b: { x: number; y: number; w: number; h: number },
  u: number,
  fill: string,
  key: number,
) => {
  if (u <= 0) return null;
  const horizontal = b.w > b.h;
  const w = horizontal ? b.w * PX * u : BOARD;
  const h = horizontal ? BOARD : b.h * PX * u;
  return (
    <rect
      key={key}
      x={px(b.x) - (horizontal ? 0 : (BOARD - b.w * PX) / 2)}
      y={py(b.y) - (horizontal ? (BOARD - b.h * PX) / 2 : 0)}
      width={w}
      height={h}
      fill={fill}
      opacity={0.85}
      stroke={colors.BG}
      strokeWidth={0.8}
    />
  );
};

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const supportsU = s.get(scene.supportsU);
  const innerU = s.get(scene.innerU);
  const detailU = s.get(scene.detailU);
  const boltU = s.get(scene.boltU);
  const outerU = s.get(scene.outerU);
  const lapU = s.get(scene.lapU);
  const diagU = s.get(scene.diagU);
  const hangerU = s.get(scene.hangerU);
  const joistU = s.get(scene.joistU);
  const blockU = s.get(scene.blockU);
  const deckU = s.get(scene.deckU);
  const screwU = s.get(scene.screwU);
  const trimU = s.get(scene.trimU);
  const detailDim = s.get(scene.detailDim);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const PT = '#6f9c6a'; // pressure-treated green
  const JOIST = colors.WARM;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* faint footprint + 16-in tick grid */}
          <g opacity={gridU}>
            <rect x={px(0)} y={py(0)} width={96 * PX} height={96 * PX} fill="none" stroke={colors.GRID} strokeDasharray="4 6" />
            {JOISTS_IN.map((x) => (
              <line key={x} x1={px(x)} y1={py(0)} x2={px(x)} y2={py(96)} stroke={colors.GRID} strokeWidth={0.8} opacity={0.5} />
            ))}
            <text x={px(48)} y={py(0) - 34} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              the platform, from above — joists on 16 in centers
            </text>
            {/* 16-in dimension between first two lines */}
            <line x1={px(16)} y1={py(-2.5)} x2={px(32)} y2={py(-2.5)} stroke={colors.MUTED} strokeWidth={1} />
            <text x={px(24)} y={py(-4)} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              16 in
            </text>
          </g>

          {/* ghost contact points from chapter 2 */}
          <g opacity={supportsU * 0.5}>
            {[0, 48, 96].flatMap((a) =>
              [0, 48, 96].map((b) =>
                (a === 48 && b === 48) ? null : (
                  <circle key={`${a}-${b}`} cx={px(a)} cy={py(b)} r={9} fill="#5b6478" opacity={0.7} />
                ),
              ),
            )}
          </g>

          {/* inner + outer rings */}
          {INNER.map((b, i) => boardRect(b, clamp01(innerU * 4 - i * 0.75), PT, i))}
          {OUTER.map((b, i) => boardRect(b, clamp01(outerU * 4 - i * 0.75), PT, i + 10))}
          {innerU > 0.9 && (
            <text x={px(0) - 14} y={py(48)} textAnchor="end" fill={PT} fontSize={12.5} opacity={clamp01(innerU * 4 - 3)}>
              2x6 PT · doubled
            </text>
          )}
          {/* lapped-corner emphasis */}
          {lapU > 0 && (
            <g opacity={lapU}>
              {[[0, 0], [96, 0], [96, 96], [0, 96]].map(([cx, cy], i) => (
                <circle key={i} cx={px(cx)} cy={py(cy)} r={17} fill="none" stroke={colors.ACCENT} strokeWidth={1.8} opacity={clamp01(lapU * 3 - i * 0.5)} />
              ))}
              <text x={px(96) + 26} y={py(0) + 4} fill={colors.ACCENT} fontSize={12}>
                lapped
              </text>
            </g>
          )}

          {/* diagonal square check */}
          {diagU > 0 && (
            <g opacity={diagU}>
              <line x1={px(0)} y1={py(0)} x2={px(96)} y2={py(96)} stroke={colors.ACCENT} strokeWidth={1.6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - diagU} />
              <line x1={px(96)} y1={py(0)} x2={px(0)} y2={py(96)} stroke={colors.SECONDARY} strokeWidth={1.6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - diagU} />
              <text x={px(48)} y={py(48) - 12} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
                equal diagonals
              </text>
            </g>
          )}

          {/* joist hangers — steel saddles on the 16-in grid */}
          {JOISTS_IN.map((x, i) => {
            const u = clamp01(hangerU * 3.2 - i * 0.45);
            if (u <= 0) return null;
            return (
              <g key={x} opacity={u}>
                {[py(3.2), py(92.8)].map((y, j) => (
                  <path
                    key={j}
                    d={`M ${px(x) - 6.5} ${y - 5} L ${px(x) - 6.5} ${y + 5} L ${px(x) + 6.5} ${y + 5} L ${px(x) + 6.5} ${y - 5}`}
                    fill="none"
                    stroke={colors.ACCENT}
                    strokeWidth={2.2}
                  />
                ))}
              </g>
            );
          })}
          {hangerU > 0.7 && (
            <text x={px(96) + 14} y={py(92.8) + 4} fill={colors.ACCENT} fontSize={12} opacity={clamp01(hangerU * 3 - 2)}>
              joist hangers, nailed
            </text>
          )}

          {/* joists slide down into their saddles */}
          {JOISTS_IN.map((x, i) => {
            const u = clamp01(joistU * 3.2 - i * 0.45);
            if (u <= 0) return null;
            const slide = (1 - u) * 60;
            return (
              <rect
                key={x}
                x={px(x) - BOARD / 2}
                y={py(3) - slide}
                width={BOARD}
                height={90 * PX}
                fill={JOIST}
                opacity={0.8 * u}
                stroke={colors.BG}
                strokeWidth={0.8}
              />
            );
          })}

          {/* mid-span blocking, staggered */}
          {GAPS.map((g, i) => {
            const u = clamp01(blockU * 3.4 - i * 0.4);
            if (u <= 0) return null;
            const off = (i % 2 === 0 ? -1 : 1) * 2.2;
            return (
              <rect
                key={g}
                x={px(g - 6.4)}
                y={py(48 + off) - BOARD / 2}
                width={12.8 * PX}
                height={BOARD}
                fill={JOIST}
                opacity={0.65 * u}
                stroke={colors.BG}
                strokeWidth={0.8}
              />
            );
          })}
          {blockU > 0.7 && (
            <text x={px(96) + 14} y={py(48) + 4} fill={JOIST} fontSize={12} opacity={clamp01(blockU * 3 - 2)}>
              blocking — toe-screwed
            </text>
          )}

          {/* the deck: two 4x8 sheets */}
          {[0, 1].map((i) => {
            const u = clamp01(deckU * 2.2 - i * 0.9);
            if (u <= 0) return null;
            return (
              <g key={i} opacity={u * 0.92}>
                <rect x={px(0)} y={py(i * 48)} width={96 * PX * u} height={48 * PX} fill={colors.SECONDARY} opacity={0.3} stroke={colors.SECONDARY} strokeWidth={1.2} />
              </g>
            );
          })}
          {deckU > 0.8 && (
            <g opacity={clamp01(deckU * 3 - 2)}>
              <text x={px(48)} y={py(24) + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontWeight={600}>
                4 × 8 sheet — 23/32 in T&amp;G OSB
              </text>
              <text x={px(48)} y={py(72) + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontWeight={600}>
                4 × 8 sheet
              </text>
            </g>
          )}

          {/* screws rain in along rims + joist lines */}
          {screwU > 0 &&
            SCREWS.map((sc) => {
              const u = clamp01(screwU * (SCREWS.length / 6) - sc.k * 0.16);
              if (u <= 0) return null;
              return <circle key={sc.k} cx={px(sc.x)} cy={py(sc.y)} r={1.9} fill={colors.TEXT} opacity={0.7 * u} />;
            })}
          {screwU > 0.6 && (
            <text x={px(0) - 14} y={py(72)} textAnchor="end" fill={colors.MUTED} fontSize={12} opacity={clamp01(screwU * 3 - 2)}>
              screws every 8 in
            </text>
          )}

          {/* the overhanging tongue, sawn flush */}
          {trimU > 0 && (
            <g>
              <rect
                x={px(96)}
                y={py(48)}
                width={2.2 * PX}
                height={48 * PX}
                fill={colors.SECONDARY}
                opacity={0.5 * (1 - clamp01(trimU * 1.6 - 0.5)) }
                transform={`translate(${clamp01(trimU * 1.6 - 0.5) * 46}, ${clamp01(trimU * 1.6 - 0.5) * 18}) rotate(${clamp01(trimU * 1.6 - 0.5) * 14} ${px(97)} ${py(72)})`}
              />
              <line
                x1={px(96)}
                y1={py(48)}
                x2={px(96)}
                y2={py(48) + 48 * PX * clamp01(trimU * 1.4)}
                stroke={colors.NEGATIVE}
                strokeWidth={2}
                strokeDasharray="5 4"
                opacity={Math.min(1, trimU * 2) * (1 - clamp01(trimU * 2 - 1.6))}
              />
              {trimU > 0.25 && trimU < 0.95 && (
                <text x={px(96) + 12} y={py(48 + 48 * clamp01(trimU * 1.4)) } fill={colors.NEGATIVE} fontSize={11.5}>
                  circular saw — trim the tongue
                </text>
              )}
            </g>
          )}
        </g>

        {/* ---- fastening detail inset ---- */}
        <g opacity={detailU * detailDim * dimAll}>
          <rect x={708} y={150} width={500} height={300} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={730} y={182} fill={colors.TEXT} fontSize={14} fontWeight={600}>
            fastening, in section
          </text>
          {/* riser post */}
          <rect x={960} y={230} width={70} height={190} fill={colors.WARM} opacity={0.75} stroke={colors.GRID} />
          <text x={995} y={444} textAnchor="middle" fill={colors.WARM} fontSize={11.5}>
            riser
          </text>
          {/* rim board against it */}
          <rect x={912} y={230} width={48} height={190} fill={PT} opacity={0.85} stroke={colors.GRID} />
          <text x={936} y={444} textAnchor="middle" fill={PT} fontSize={11.5}>
            rim 2x6
          </text>
          {/* counterbore pocket */}
          <rect x={912} y={296} width={16} height={26} fill={colors.BG} opacity={0.9} />
          {/* the lag bolt travels in and sinks below the surface */}
          {boltU > 0 && (
            <g>
              <line
                x1={790 + boltU * 132}
                y1={309}
                x2={790 + boltU * 132 + 88}
                y2={309}
                stroke="#c9d4e3"
                strokeWidth={7}
              />
              <rect x={790 + boltU * 132 - 13} y={298} width={14} height={22} rx={2.5} fill="#c9d4e3" />
              <text x={800} y={270} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
                5/16 × 3 in lag bolt
              </text>
              <text x={800} y={288} fill={colors.MUTED} fontSize={11.5}>
                pre-drilled · counterbored — head sits below the surface
              </text>
            </g>
          )}
          <text x={730} y={404} fill={colors.MUTED} fontSize={11.5}>
            everywhere else: 3 in exterior screws, pre-drilled
          </text>
        </g>

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={330} y={216} width={620} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              doubled rim · sixteen-inch joists · two whole sheets
            </text>
            <text x={640} y={314} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the floor is the factory
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
