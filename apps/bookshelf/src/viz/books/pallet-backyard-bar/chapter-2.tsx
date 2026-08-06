// Two Cuts Make a U
//
// Backing source: Lee Valley, "Make a Backyard Bar Using Pallets" — two more
// identical pallets, matched to the height of the front one, are measured and
// cut to 2 ft of width to become the sides. The cut ends of each side pallet
// are placed toward the front, and the sides are fastened to the front with
// deck screws.
//
// Centerpiece: the footprint, seen from above. Two absurdly deep wings are
// trimmed to two feet, spun so their raw ends face front, and screwed home —
// and a side-elevation inset shows why a lone panel falls over and a U does not.
import {
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
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The footprint, in inches, seen from above. y grows toward the customer.
// ---------------------------------------------------------------------------

const PX = 6.4; // px per inch
const FRONT_LEN = 47; // in — the pallet chosen in chapter one
const THICK = 5; // in — a pallet's depth, standing on edge
const UNCUT = 47; // in — a side pallet before it is trimmed
const SIDE_CUT = 24; // in — 2 ft of width
const OFFCUT = UNCUT - SIDE_CUT;

const ORIGIN = { x: 640 - (FRONT_LEN * PX) / 2, y: 372 };
const X = (x: number): number => ORIGIN.x + x * PX;
const Y = (y: number): number => ORIGIN.y + y * PX; // y = 0 at the back of the wings

const FRONT_Y = SIDE_CUT; // front pallet sits at the customer end of the wings

const WOOD = '#7d5a34';
const WOOD_LIT = '#a3763f';
const CUT_FACE = '#c98a3f';

// Screws along the two side-to-front joints.
const SCREWS = [0, 1, 2, 3].flatMap((i) =>
  [0, 1].map((side) => ({
    key: `${side}-${i}`,
    x: side === 0 ? THICK / 2 : FRONT_LEN - THICK / 2,
    y: FRONT_Y + THICK / 2,
    n: i,
    jitter: i * 1.4 - 2.1,
  })),
);

// Side-elevation inset: does the front stand up on its own?
const INSET = { x: 936, y: 168, w: 300, h: 250 } as const;

const CAM_WIDE: CameraState = { x: 640, y: 330, k: 0.94 };
const CAM_CUT: CameraState = { x: 500, y: 250, k: 1.5 };
const CAM_JOINT: CameraState = { x: 560, y: 430, k: 1.55 };
const CAM_U: CameraState = { x: 620, y: 366, k: 1.22 };
const CAM_INSET: CameraState = { x: 1010, y: 300, k: 1.35 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  frontU: ChannelRef<number>;
  wingU: ChannelRef<number>;
  measureU: ChannelRef<number>;
  cutU: ChannelRef<number>;
  offcutU: ChannelRef<number>;
  flipU: ChannelRef<number>;
  seatU: ChannelRef<number>;
  screwU: ChannelRef<number>;
  insetU: ChannelRef<number>;
  tipU: ChannelRef<number>;
  braceU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const frontU = tl.channel('frontU', 0);
  const wingU = tl.channel('wingU', 0);
  const measureU = tl.channel('measureU', 0);
  const cutU = tl.channel('cutU', 0);
  const offcutU = tl.channel('offcutU', 0);
  const flipU = tl.channel('flipU', 0);
  const seatU = tl.channel('seatU', 0);
  const screwU = tl.channel('screwU', 0);
  const insetU = tl.channel('insetU', 0);
  const tipU = tl.channel('tipU', 0);
  const braceU = tl.channel('braceU', 0);
  const dimU = tl.channel('dimU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · from above —
  tl.caption({
    at: 0.5,
    dur: 6.55,
    text: 'Look straight down at the bar now. The front pallet from the last chapter is that long bar across the bottom, and it is the only piece so far that needs no work at all.',
  });
  tl.tween(frontU, 1, { at: 0.7, dur: 1.2, ease: ease.enter });
  tl.hold(6.5, 0.6);

  // — Beat 2 · two more, and they are far too deep —
  tl.caption({
    at: 7.1,
    dur: 6.75,
    text: 'The sides come from two more pallets, chosen to match the front exactly in height. Set them on edge as they are, though, and the bar is nearly four feet deep. Nobody has that much patio.',
  });
  tl.tween(wingU, 1, { at: 7.4, dur: 1.4, ease: ease.enter });
  tl.hold(13.3, 0.6);

  // — Beat 3 · measure two feet —
  tl.caption({
    at: 13.9,
    dur: 6.25,
    text: 'So they get measured and cut down to two feet of width. That is enough room for bottles and a working surface behind the bar, and not a step more.',
  });
  tl.tween(cam, CAM_CUT, { at: 14.1, dur: 1.5, ease: ease.move });
  tl.tween(measureU, 1, { at: 15.0, dur: 1.4, ease: ease.draw });
  tl.hold(19.7, 0.5);

  // — Beat 4 · the cut —
  tl.caption({
    at: 20.2,
    dur: 6.05,
    text: 'These are the only two cuts the frame of this bar ever needs — one across each side pallet, both to the same line.',
  });
  tl.tween(cutU, 1, { at: 20.5, dur: 1.3, ease: ease.draw });
  tl.tween(offcutU, 1, { at: 22.0, dur: 1.5, ease: ease.move });
  tl.hold(25.8, 0.5);

  // — Beat 5 · cut ends to the front —
  tl.caption({
    at: 26.3,
    dur: 7.15,
    text: 'And here is the detail that separates a build that looks finished from one that looks salvaged. Each side is turned so its raw cut end points forward, where the bar top will run out over it and hide it.',
  });
  tl.tween(cam, CAM_WIDE, { at: 26.5, dur: 1.5, ease: ease.move });
  tl.tween(flipU, 1, { at: 27.6, dur: 1.8, ease: ease.move });
  tl.hold(32.9, 0.6);

  // — Beat 6 · pull them in and screw them home —
  tl.caption({
    at: 33.5,
    dur: 6.75,
    text: 'The two sides come in tight against the back of the front pallet, and deck screws go through the stringers where the thick wood is. Screwed into a gap, they would hold nothing at all.',
  });
  tl.tween(seatU, 1, { at: 33.8, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAM_JOINT, { at: 35.4, dur: 1.5, ease: ease.move });
  tl.tween(screwU, 1, { at: 36.4, dur: 2.0, ease: ease.pop });
  tl.hold(39.7, 0.6);

  // — Beat 7 · the shape has a name —
  tl.caption({
    at: 40.3,
    dur: 6.35,
    text: 'What you have now is a U: forty-seven inches across the face, two feet deep on each wing, and wide open at the back so you can stand inside it and pour.',
  });
  tl.tween(cam, CAM_U, { at: 40.5, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 41.6, dur: 1.6, ease: ease.draw });
  tl.hold(46.1, 0.6);

  // — Beat 8 · why not a flat front —
  tl.caption({
    at: 46.7,
    dur: 6.95,
    text: 'The U is not only about storage. Watch the front pallet on its own from the side: lean on it and there is nothing to stop it going over. It is a fence panel, not furniture.',
  });
  tl.tween(cam, CAM_INSET, { at: 46.9, dur: 1.5, ease: ease.move });
  tl.tween(insetU, 1, { at: 47.4, dur: 0.9, ease: ease.enter });
  tl.tween(tipU, 1, { at: 49.2, dur: 1.8, ease: ease.move });
  tl.hold(53.1, 0.6);

  // — Beat 9 · the wings brace it —
  tl.caption({
    at: 53.7,
    dur: 6.55,
    text: 'Add two feet of pallet at right angles to it and that same push has to twist the whole shape. The sides are not just sides. They are the reason the bar stays upright.',
  });
  tl.tween(tipU, 0, { at: 53.9, dur: 0.9, ease: ease.move });
  tl.tween(braceU, 1, { at: 54.8, dur: 1.4, ease: ease.enter });
  tl.hold(59.7, 0.6);

  // — Beat 10 · close —
  tl.caption({
    at: 60.3,
    dur: 6.0,
    text: 'Three pallets, two cuts, one open shape. It stands, it holds, and it is still nowhere near stiff enough — which is the job of the top.',
  });
  tl.tween(cam, CAM_WIDE, { at: 60.5, dur: 1.6, ease: ease.move });
  tl.tween(dimAll, 0.14, { at: 61.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 62.6, dur: 0.9, ease: ease.enter });
  tl.hold(66.3, 1.6);

  return {
    tl,
    cam,
    frontU,
    wingU,
    measureU,
    cutU,
    offcutU,
    flipU,
    seatU,
    screwU,
    insetU,
    tipU,
    braceU,
    dimU,
    dimAll,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

// A pallet seen from above: a slab with the ends of its cross boards showing.
function SlabPlan({
  x0,
  y0,
  w,
  h,
  boards,
  fill,
  cutEnd,
  opacity = 1,
}: {
  x0: number;
  y0: number;
  w: number;
  h: number;
  boards: number;
  fill: string;
  cutEnd?: 'top' | 'bottom' | null;
  opacity?: number;
}) {
  if (opacity <= 0) return null;
  const along = w >= h; // boards run across the long dimension
  const n = Math.max(2, boards);
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y0} width={w} height={h} rx={2} fill={fill} stroke="#2a1f13" strokeWidth={1.2} />
      {Array.from({ length: n - 1 }, (_, i) => {
        const f = ((i + 1) / n) * (along ? w : h);
        return along ? (
          <line key={i} x1={x0 + f} y1={y0} x2={x0 + f} y2={y0 + h} stroke="#2a1f13" strokeWidth={0.9} opacity={0.65} />
        ) : (
          <line key={i} x1={x0} y1={y0 + f} x2={x0 + w} y2={y0 + f} stroke="#2a1f13" strokeWidth={0.9} opacity={0.65} />
        );
      })}
      {cutEnd && (
        <rect
          x={x0}
          y={cutEnd === 'top' ? y0 : y0 + h - 4}
          width={w}
          height={4}
          fill={CUT_FACE}
        />
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const frontU = s.get(scene.frontU);
  const wingU = s.get(scene.wingU);
  const measureU = s.get(scene.measureU);
  const cutU = s.get(scene.cutU);
  const offcutU = s.get(scene.offcutU);
  const flipU = s.get(scene.flipU);
  const seatU = s.get(scene.seatU);
  const screwU = s.get(scene.screwU);
  const insetU = s.get(scene.insetU);
  const tipU = s.get(scene.tipU);
  const braceU = s.get(scene.braceU);
  const dimU = s.get(scene.dimU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  // Wing geometry: before the cut it runs the full 47 in back from the front;
  // after the cut only 24 in of it remains, and `flipU` swaps which end is raw.
  const wingLen = lerp(UNCUT, SIDE_CUT, clamp01(offcutU));
  // seated wings sit tight behind the front pallet; before that they float out
  const gap = lerp(4, 0, clamp01(seatU));
  const wingBackY = FRONT_Y - wingLen - gap;
  const cutEnd: 'top' | 'bottom' | null =
    offcutU <= 0 ? null : flipU > 0.5 ? 'bottom' : 'top';

  const wings = [
    { x: 0 }, // left wing
    { x: FRONT_LEN - THICK }, // right wing
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- plan label ---- */}
          {frontU > 0 && (
            <text x={X(FRONT_LEN) + 22} y={Y(FRONT_Y + THICK) + 6} fill={colors.MUTED} fontSize={13} opacity={frontU}>
              seen from above
            </text>
          )}

          {/* ---- the two side pallets ---- */}
          {wings.map((w, i) => {
            const u = clamp01(wingU * 2 - i * 0.35);
            if (u <= 0) return null;
            return (
              <g key={i}>
                <SlabPlan
                  x0={X(w.x)}
                  y0={Y(wingBackY)}
                  w={THICK * PX}
                  h={wingLen * PX}
                  boards={Math.round(wingLen / 7)}
                  fill={WOOD}
                  cutEnd={cutEnd}
                  opacity={u}
                />
                {/* the offcut slides away */}
                {offcutU > 0 && offcutU < 1 && (
                  <SlabPlan
                    x0={X(w.x) - offcutU * (170 + i * 30)}
                    y0={Y(FRONT_Y - UNCUT) - offcutU * 60}
                    w={THICK * PX}
                    h={OFFCUT * PX}
                    boards={3}
                    fill={WOOD}
                    opacity={u * (1 - offcutU) * 0.9}
                  />
                )}
              </g>
            );
          })}

          {/* the 2-ft measurement */}
          {measureU > 0 && (
            <g opacity={measureU}>
              <line
                x1={X(-4)}
                y1={Y(FRONT_Y)}
                x2={X(-4)}
                y2={Y(FRONT_Y - SIDE_CUT * measureU)}
                stroke={colors.ACCENT}
                strokeWidth={2}
              />
              <text x={X(-7)} y={Y(FRONT_Y - SIDE_CUT / 2)} textAnchor="end" fill={colors.ACCENT} fontSize={16} fontWeight={700}>
                2 ft
              </text>
            </g>
          )}
          {/* the cut line */}
          {cutU > 0 && offcutU < 1 && (
            <g opacity={cutU * (1 - offcutU * 0.6)}>
              {wings.map((w, i) => (
                <line
                  key={i}
                  x1={X(w.x) - 12}
                  y1={Y(FRONT_Y - SIDE_CUT)}
                  x2={X(w.x + THICK) + 12 * cutU}
                  y2={Y(FRONT_Y - SIDE_CUT)}
                  stroke={colors.NEGATIVE}
                  strokeWidth={2.6}
                  strokeDasharray="7 5"
                />
              ))}
            </g>
          )}
          {/* cut-end callout */}
          {flipU > 0.35 && offcutU > 0.9 && (
            <text
              x={X(FRONT_LEN / 2)}
              y={Y(FRONT_Y) - 12}
              textAnchor="middle"
              fill={CUT_FACE}
              fontSize={13.5}
              opacity={clamp01(flipU * 1.6 - 0.5)}
            >
              cut ends face the front
            </text>
          )}

          {/* ---- the front pallet ---- */}
          <SlabPlan
            x0={X(0)}
            y0={Y(FRONT_Y)}
            w={FRONT_LEN * PX}
            h={THICK * PX}
            boards={8}
            fill={WOOD_LIT}
            opacity={frontU}
          />

          {/* ---- deck screws at the joints ---- */}
          {screwU > 0 &&
            SCREWS.map((sc, i) => {
              const u = clamp01(screwU * 3 - i * 0.24);
              if (u <= 0) return null;
              return (
                <circle
                  key={sc.key}
                  cx={X(sc.x)}
                  cy={Y(sc.y + sc.jitter)}
                  r={4.2 * u}
                  fill={colors.ACCENT}
                  stroke={colors.BG}
                  strokeWidth={1}
                />
              );
            })}
          {screwU > 0.6 && (
            <text x={X(FRONT_LEN) + 22} y={Y(FRONT_Y) - 6} fill={colors.ACCENT} fontSize={13} opacity={clamp01(screwU * 2 - 1.2)}>
              deck screws, into the stringers
            </text>
          )}

          {/* ---- the finished footprint ---- */}
          {dimU > 0 && (
            <g opacity={dimU}>
              <line
                x1={X(0)}
                y1={Y(FRONT_Y + THICK) + 26}
                x2={X(FRONT_LEN * dimU)}
                y2={Y(FRONT_Y + THICK) + 26}
                stroke={colors.POSITIVE}
                strokeWidth={2}
              />
              <text x={X(FRONT_LEN / 2)} y={Y(FRONT_Y + THICK) + 48} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontWeight={700}>
                47 in across the face
              </text>
              <text x={X(FRONT_LEN / 2)} y={Y(FRONT_Y - SIDE_CUT) - 24} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} opacity={clamp01(dimU * 2 - 1)}>
                open at the back — the bartender stands here
              </text>
            </g>
          )}
        </g>

        {/* ---- side-elevation inset: standing up, or not ---- */}
        {insetU > 0 && (
          <g opacity={insetU * dimAll}>
            <rect x={INSET.x - 34} y={INSET.y - 52} width={INSET.w} height={INSET.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={INSET.x + INSET.w / 2 - 34} y={INSET.y - 26} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
              the same bar, from the end
            </text>
            {(() => {
              const baseX = INSET.x + 66;
              const baseY = INSET.y + 158;
              const h = 132;
              const angle = tipU * 62; // degrees of falling over
              return (
                <>
                  <line x1={INSET.x - 14} y1={baseY} x2={INSET.x + INSET.w - 54} y2={baseY} stroke={colors.GRID} strokeWidth={2} />
                  {/* the front panel, hinging at its foot */}
                  <g transform={`rotate(${angle}, ${baseX}, ${baseY})`}>
                    <rect x={baseX - 7} y={baseY - h} width={14} height={h} rx={2} fill={WOOD_LIT} stroke="#2a1f13" />
                  </g>
                  {/* the wing that stops it */}
                  {braceU > 0 && (
                    <g opacity={braceU}>
                      <rect x={baseX} y={baseY - 16} width={SIDE_CUT * 3.4} height={14} rx={2} fill={WOOD} stroke="#2a1f13" />
                      <text x={baseX + 46} y={baseY + 30} fill={colors.POSITIVE} fontSize={13} fontWeight={600}>
                        2 ft of wing
                      </text>
                    </g>
                  )}
                  {/* the push */}
                  <g opacity={clamp01(insetU * 1.4 - 0.3)}>
                    <line x1={baseX - 78} y1={baseY - h + 14} x2={baseX - 20} y2={baseY - h + 14} stroke={colors.NEGATIVE} strokeWidth={3} />
                    <polygon
                      points={`${baseX - 16},${baseY - h + 14} ${baseX - 30},${baseY - h + 8} ${baseX - 30},${baseY - h + 20}`}
                      fill={colors.NEGATIVE}
                    />
                  </g>
                  <text
                    x={INSET.x + INSET.w / 2 - 34}
                    y={INSET.y + 190}
                    textAnchor="middle"
                    fill={braceU > 0.5 ? colors.POSITIVE : colors.NEGATIVE}
                    fontSize={14}
                    fontWeight={700}
                  >
                    {braceU > 0.5 ? 'braced' : tipU > 0.4 ? 'over it goes' : 'nothing holding it'}
                  </text>
                </>
              );
            })()}
          </g>
        )}

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={318} y={252} width={644} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              three pallets · two cuts · cut ends forward
            </text>
            <text x={640} y={348} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              a U that stands on its own
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
