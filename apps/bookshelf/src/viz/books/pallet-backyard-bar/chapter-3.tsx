// The Top That Ties It Together
//
// Backing source: Lee Valley, "Make a Backyard Bar Using Pallets" — the front
// top is an existing wooden shelf, 65 in long by 17.5 in wide; a purchased
// board is cut in half to make two side tops of 17.5 in by 9.5 in. The top is
// attached with screws driven through it, "making sure to secure it to a
// board", with a 4 in overhang at the sides and 8 in at the front — and the
// author notes that attaching the top is what reinforces the structure.
//
// Centerpiece: the same overhead footprint as chapter two, now receiving a lid.
// The 65-inch dimension is derived on screen tick by tick, the top turns
// x-ray so you can see what a screw lands in, and the finale is a racking
// test — wings splaying without the top, locked solid with it.
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
// Same plan geometry as chapter two. 1 in = 6.4 px, y grows toward the customer.
// ---------------------------------------------------------------------------

const PX = 6.4;
const FRONT_LEN = 47;
const THICK = 5;
const SIDE_CUT = 24;
const FRONT_Y = SIDE_CUT;

const TOP_LEN = 65; // in — the shelf that becomes the front top
const TOP_DEEP = 17.5; // in
const SIDE_TOP_W = 9.5; // in — the purchased board, cut in half
const OVER_SIDE = 4; // in — overhang past each side
const OVER_FRONT = 8; // in — overhang past the bar face

const ORIGIN = { x: 640 - (FRONT_LEN * PX) / 2, y: 300 };
const X = (x: number): number => ORIGIN.x + x * PX;
const Y = (y: number): number => ORIGIN.y + y * PX;

const WOOD = '#7d5a34';
const WOOD_LIT = '#a3763f';
const TOP_WOOD = '#b98346';

// The 65-inch derivation, laid out left to right across the face.
const TICKS: { from: number; to: number; label: string; color: string }[] = [
  { from: -OVER_SIDE, to: 0, label: '4', color: colors.WARM },
  { from: 0, to: THICK, label: '5', color: colors.SECONDARY },
  { from: THICK, to: FRONT_LEN - THICK, label: '37', color: colors.ACCENT },
  { from: FRONT_LEN - THICK, to: FRONT_LEN, label: '5', color: colors.SECONDARY },
  { from: FRONT_LEN, to: FRONT_LEN + OVER_SIDE, label: '4', color: colors.WARM },
];

// Where screws can go: through the top into a stringer (solid) or into a gap.
const SCREW_TARGETS = [
  { x: THICK / 2, good: true },
  { x: FRONT_LEN / 2, good: true },
  { x: FRONT_LEN - THICK / 2, good: true },
];
const BAD_SCREW = { x: FRONT_LEN * 0.3 };

const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.95 };
const CAM_FACE: CameraState = { x: 640, y: 400, k: 1.32 };
const CAM_XRAY: CameraState = { x: 560, y: 380, k: 1.7 };
const CAM_RACK: CameraState = { x: 640, y: 350, k: 1.05 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  carcassU: ChannelRef<number>;
  topU: ChannelRef<number>;
  tickU: ChannelRef<number>;
  sumU: ChannelRef<number>;
  overFrontU: ChannelRef<number>;
  kneeU: ChannelRef<number>;
  boardU: ChannelRef<number>;
  splitU: ChannelRef<number>;
  sideTopU: ChannelRef<number>;
  xrayU: ChannelRef<number>;
  goodU: ChannelRef<number>;
  badU: ChannelRef<number>;
  rackU: ChannelRef<number>;
  lockU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const carcassU = tl.channel('carcassU', 0);
  const topU = tl.channel('topU', 0);
  const tickU = tl.channel('tickU', 0);
  const sumU = tl.channel('sumU', 0);
  const overFrontU = tl.channel('overFrontU', 0);
  const kneeU = tl.channel('kneeU', 0);
  const boardU = tl.channel('boardU', 0);
  const splitU = tl.channel('splitU', 0);
  const sideTopU = tl.channel('sideTopU', 0);
  const xrayU = tl.channel('xrayU', 0);
  const goodU = tl.channel('goodU', 0);
  const badU = tl.channel('badU', 0);
  const rackU = tl.channel('rackU', 0);
  const lockU = tl.channel('lockU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the U, waiting —
  tl.caption({
    at: 0.5,
    dur: 6.15,
    text: 'Here is where the last chapter left off: a U of three pallets, screwed together, still open to the sky.',
  });
  tl.tween(carcassU, 1, { at: 0.7, dur: 1.2, ease: ease.enter });
  tl.hold(6.1, 0.6);

  // — Beat 2 · the shelf —
  tl.caption({
    at: 6.7,
    dur: 6.75,
    text: 'The bar top for the front is not built at all. It is a wooden shelf that already existed, sixty-five inches long and seventeen and a half deep, which is a very convenient size — and not by accident.',
  });
  tl.tween(topU, 1, { at: 7.0, dur: 1.5, ease: ease.move });
  tl.hold(12.9, 0.6);

  // — Beat 3 · derive the 65 —
  tl.caption({
    at: 13.5,
    dur: 7.55,
    text: 'Add it up across the face. Forty-seven inches of pallet, five more for each side pallet standing behind it, and four inches of overhang past each end. Forty-seven, plus ten, plus eight: sixty-five.',
  });
  tl.tween(cam, CAM_FACE, { at: 13.7, dur: 1.5, ease: ease.move });
  tl.tween(tickU, 1, { at: 14.6, dur: 2.6, ease: ease.draw });
  tl.tween(sumU, 1, { at: 18.4, dur: 0.7, ease: ease.pop });
  tl.hold(20.5, 0.6);

  // — Beat 4 · the eight inches out front —
  tl.caption({
    at: 21.1,
    dur: 6.95,
    text: 'Toward you it hangs over by eight inches, and that is the difference between a shelf and a bar. Eight inches is where your elbows go, and where your knees go when you pull the stool in.',
  });
  tl.tween(overFrontU, 1, { at: 21.4, dur: 1.3, ease: ease.draw });
  tl.tween(kneeU, 1, { at: 23.4, dur: 1.0, ease: ease.enter });
  tl.hold(27.5, 0.6);

  // — Beat 5 · the one purchased board —
  tl.caption({
    at: 28.1,
    dur: 6.75,
    text: 'The side tops are the only lumber bought for this build. One board, cut straight down the middle, gives two pieces of seventeen and a half by nine and a half — one for each wing.',
  });
  tl.tween(cam, CAM_WIDE, { at: 28.3, dur: 1.5, ease: ease.move });
  tl.tween(kneeU, 0, { at: 28.3, dur: 0.6, ease: ease.move });
  tl.tween(tickU, 0, { at: 28.3, dur: 0.8, ease: ease.move });
  tl.tween(sumU, 0, { at: 28.3, dur: 0.8, ease: ease.move });
  tl.tween(overFrontU, 0, { at: 28.3, dur: 0.8, ease: ease.move });
  tl.tween(boardU, 1, { at: 29.0, dur: 1.0, ease: ease.enter });
  tl.tween(splitU, 1, { at: 30.6, dur: 1.2, ease: ease.move });
  tl.tween(sideTopU, 1, { at: 32.2, dur: 1.4, ease: ease.move });
  tl.hold(34.3, 0.6);

  // — Beat 6 · screw into a board, not a gap —
  tl.caption({
    at: 34.9,
    dur: 7.35,
    text: 'Now the screws, driven down through the top. A pallet is half air, so look through the top before you drill: a screw that lands on a stringer grips hard, and one that lands in a gap grips nothing.',
  });
  tl.tween(cam, CAM_XRAY, { at: 35.1, dur: 1.5, ease: ease.move });
  tl.tween(xrayU, 1, { at: 35.6, dur: 1.0, ease: ease.move });
  tl.tween(badU, 1, { at: 37.6, dur: 0.8, ease: ease.enter });
  tl.tween(goodU, 1, { at: 39.4, dur: 1.4, ease: ease.pop });
  tl.hold(41.7, 0.6);

  // — Beat 7 · the wobble —
  tl.caption({
    at: 42.3,
    dur: 6.95,
    text: 'And here is the part that surprises people. Screws alone at those two joints let the wings swing. Push on a corner of the unfinished bar and the whole shape leans, like a cardboard box with no lid.',
  });
  tl.tween(cam, CAM_RACK, { at: 42.5, dur: 1.5, ease: ease.move });
  tl.tween(xrayU, 0, { at: 42.5, dur: 0.8, ease: ease.move });
  tl.tween(topU, 0.0, { at: 43.0, dur: 0.8, ease: ease.move });
  tl.tween(sideTopU, 0.0, { at: 43.0, dur: 0.8, ease: ease.move });
  tl.tween(rackU, 1, { at: 44.2, dur: 1.6, ease: ease.move });
  tl.hold(48.7, 0.6);

  // — Beat 8 · the lid locks it —
  tl.caption({
    at: 49.3,
    dur: 7.15,
    text: 'Put the top back on and it spans all three pallets at once. Every joint is now held at a fixed distance from every other, and the wobble simply has nowhere to go. The top is structure, not decoration.',
  });
  tl.tween(rackU, 0, { at: 49.6, dur: 1.5, ease: ease.move });
  tl.tween(topU, 1, { at: 50.4, dur: 1.0, ease: ease.move });
  tl.tween(sideTopU, 1, { at: 50.6, dur: 1.0, ease: ease.move });
  tl.tween(lockU, 1, { at: 52.0, dur: 1.4, ease: ease.draw });
  tl.hold(55.9, 0.6);

  // — Beat 9 · close —
  tl.caption({
    at: 56.5,
    dur: 5.8,
    text: 'The bar is now built. What is left is everything that decides whether it survives its first winter outdoors.',
  });
  tl.tween(dimAll, 0.14, { at: 56.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 58.0, dur: 0.9, ease: ease.enter });
  tl.hold(62.3, 1.6);

  return {
    tl,
    cam,
    carcassU,
    topU,
    tickU,
    sumU,
    overFrontU,
    kneeU,
    boardU,
    splitU,
    sideTopU,
    xrayU,
    goodU,
    badU,
    rackU,
    lockU,
    dimAll,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const carcassU = s.get(scene.carcassU);
  const topU = s.get(scene.topU);
  const tickU = s.get(scene.tickU);
  const sumU = s.get(scene.sumU);
  const overFrontU = s.get(scene.overFrontU);
  const kneeU = s.get(scene.kneeU);
  const boardU = s.get(scene.boardU);
  const splitU = s.get(scene.splitU);
  const sideTopU = s.get(scene.sideTopU);
  const xrayU = s.get(scene.xrayU);
  const goodU = s.get(scene.goodU);
  const badU = s.get(scene.badU);
  const rackU = s.get(scene.rackU);
  const lockU = s.get(scene.lockU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const rackDeg = rackU * 7;
  // the top floats down from above as topU goes 0 -> 1
  const drop = (1 - topU) * 74;
  const topY = Y(FRONT_Y + THICK - TOP_DEEP + OVER_FRONT);
  const topOpacity = topU * lerp(1, 0.38, xrayU);

  const wings = [
    { x: 0, sign: -1 },
    { x: FRONT_LEN - THICK, sign: 1 },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the U, with wings free to swing at their joints ---- */}
          <g opacity={carcassU}>
            {wings.map((w, i) => {
              const px = X(w.x + THICK / 2);
              const py = Y(FRONT_Y);
              return (
                <g key={i} transform={`rotate(${w.sign * rackDeg}, ${px}, ${py})`}>
                  <rect
                    x={X(w.x)}
                    y={Y(FRONT_Y - SIDE_CUT)}
                    width={THICK * PX}
                    height={SIDE_CUT * PX}
                    rx={2}
                    fill={WOOD}
                    stroke="#2a1f13"
                    strokeWidth={1.2}
                  />
                  {Array.from({ length: 3 }, (_, k) => (
                    <line
                      key={k}
                      x1={X(w.x)}
                      y1={Y(FRONT_Y - SIDE_CUT + ((k + 1) * SIDE_CUT) / 4)}
                      x2={X(w.x + THICK)}
                      y2={Y(FRONT_Y - SIDE_CUT + ((k + 1) * SIDE_CUT) / 4)}
                      stroke="#2a1f13"
                      strokeWidth={0.9}
                      opacity={0.6}
                    />
                  ))}
                </g>
              );
            })}

            {/* the front pallet, with its gaps showing for the x-ray beat */}
            <rect x={X(0)} y={Y(FRONT_Y)} width={FRONT_LEN * PX} height={THICK * PX} rx={2} fill={WOOD_LIT} stroke="#2a1f13" strokeWidth={1.2} />
            {Array.from({ length: 7 }, (_, i) => {
              const f = ((i + 1) / 8) * FRONT_LEN;
              return (
                <line key={i} x1={X(f)} y1={Y(FRONT_Y)} x2={X(f)} y2={Y(FRONT_Y + THICK)} stroke="#2a1f13" strokeWidth={0.9} opacity={0.6} />
              );
            })}
            {/* stringers — the solid wood a screw wants to find */}
            {xrayU > 0 &&
              SCREW_TARGETS.map((t, i) => (
                <rect
                  key={i}
                  x={X(t.x) - 7}
                  y={Y(FRONT_Y)}
                  width={14}
                  height={THICK * PX}
                  fill={colors.POSITIVE}
                  opacity={0.28 * xrayU}
                />
              ))}
          </g>

          {/* ---- the purchased board, cut in half ---- */}
          {boardU > 0 && splitU < 1 && (
            <g opacity={boardU * (1 - splitU * 0.85)}>
              {[0, 1].map((i) => (
                <rect
                  key={i}
                  x={X(FRONT_LEN + 16) + i * splitU * 26}
                  y={Y(-14) + i * (SIDE_TOP_W * PX + splitU * 14)}
                  width={TOP_DEEP * PX}
                  height={SIDE_TOP_W * PX}
                  rx={2}
                  fill={TOP_WOOD}
                  stroke="#2a1f13"
                />
              ))}
              <text x={X(FRONT_LEN + 16)} y={Y(-19)} fill={colors.MUTED} fontSize={12.5}>
                the one board bought · cut in half
              </text>
            </g>
          )}

          {/* ---- side tops on the wings ---- */}
          {wings.map((w, i) => {
            const u = clamp01(sideTopU * 2 - i * 0.3);
            if (u <= 0) return null;
            const x0 = w.sign < 0 ? X(-OVER_SIDE) : X(FRONT_LEN + OVER_SIDE - SIDE_TOP_W);
            return (
              <rect
                key={i}
                x={x0}
                y={topY - (1 - u) * 60}
                width={SIDE_TOP_W * PX}
                height={TOP_DEEP * PX}
                rx={2}
                fill={TOP_WOOD}
                stroke="#2a1f13"
                strokeWidth={1.2}
                opacity={u * lerp(1, 0.38, xrayU)}
              />
            );
          })}

          {/* ---- the front top ---- */}
          {topU > 0 && (
            <g opacity={topOpacity}>
              <rect
                x={X(-OVER_SIDE)}
                y={topY - drop}
                width={TOP_LEN * PX}
                height={TOP_DEEP * PX}
                rx={3}
                fill={TOP_WOOD}
                stroke="#2a1f13"
                strokeWidth={1.4}
              />
              <text x={X(FRONT_LEN / 2)} y={topY - drop + TOP_DEEP * PX * 0.55} textAnchor="middle" fill="#2a1f13" fontSize={14} fontWeight={700} opacity={0.75}>
                65 × 17.5 in shelf
              </text>
            </g>
          )}

          {/* ---- the 65-inch derivation ---- */}
          {tickU > 0 && (
            <g opacity={tickU}>
              {TICKS.map((t, i) => {
                const u = clamp01(tickU * 5 - i * 0.8);
                if (u <= 0) return null;
                const yy = Y(FRONT_Y + THICK) + 40;
                return (
                  <g key={i} opacity={u}>
                    <line x1={X(t.from)} y1={yy} x2={X(lerp(t.from, t.to, u))} y2={yy} stroke={t.color} strokeWidth={2.4} />
                    <line x1={X(t.from)} y1={yy - 6} x2={X(t.from)} y2={yy + 6} stroke={t.color} strokeWidth={2} />
                    <line x1={X(t.to)} y1={yy - 6} x2={X(t.to)} y2={yy + 6} stroke={t.color} strokeWidth={2} opacity={u} />
                    <text x={X((t.from + t.to) / 2)} y={yy + 24} textAnchor="middle" fill={t.color} fontSize={14} fontWeight={700}>
                      {t.label}
                    </text>
                  </g>
                );
              })}
              {sumU > 0 && (
                <text
                  x={X(FRONT_LEN / 2)}
                  y={Y(FRONT_Y + THICK) + 96}
                  textAnchor="middle"
                  fill={colors.POSITIVE}
                  fontSize={22}
                  fontWeight={700}
                  opacity={sumU}
                >
                  4 + 5 + 37 + 5 + 4 = 65 in
                </text>
              )}
            </g>
          )}

          {/* ---- the 8-inch front overhang, and what it is for ---- */}
          {overFrontU > 0 && (
            <g opacity={overFrontU}>
              <line
                x1={X(FRONT_LEN + 8)}
                y1={Y(FRONT_Y + THICK)}
                x2={X(FRONT_LEN + 8)}
                y2={Y(FRONT_Y + THICK) + OVER_FRONT * PX * overFrontU}
                stroke={colors.WARM}
                strokeWidth={2.4}
              />
              <text x={X(FRONT_LEN + 11)} y={Y(FRONT_Y + THICK) + OVER_FRONT * PX * 0.7} fill={colors.WARM} fontSize={15} fontWeight={700}>
                8 in
              </text>
            </g>
          )}
          {kneeU > 0 && (
            <g opacity={kneeU}>
              {[FRONT_LEN * 0.3, FRONT_LEN * 0.7].map((x, i) => (
                <g key={i}>
                  <circle cx={X(x)} cy={Y(FRONT_Y + THICK + OVER_FRONT + 7)} r={13} fill="none" stroke={colors.SECONDARY} strokeWidth={2.2} />
                  <line x1={X(x)} y1={Y(FRONT_Y + THICK + OVER_FRONT + 7) - 13} x2={X(x)} y2={Y(FRONT_Y + THICK) + 4} stroke={colors.SECONDARY} strokeWidth={2.2} strokeDasharray="4 4" />
                </g>
              ))}
              <text x={X(FRONT_LEN / 2)} y={Y(FRONT_Y + THICK + OVER_FRONT + 20) + 14} textAnchor="middle" fill={colors.SECONDARY} fontSize={13.5}>
                stools pull in under the overhang
              </text>
            </g>
          )}

          {/* ---- screw placement ---- */}
          {badU > 0 && (
            <g opacity={badU}>
              <circle cx={X(BAD_SCREW.x)} cy={Y(FRONT_Y + THICK / 2)} r={5.5} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.4} />
              <line x1={X(BAD_SCREW.x) - 7} y1={Y(FRONT_Y + THICK / 2) - 7} x2={X(BAD_SCREW.x) + 7} y2={Y(FRONT_Y + THICK / 2) + 7} stroke={colors.NEGATIVE} strokeWidth={2.4} />
              <text x={X(BAD_SCREW.x)} y={Y(FRONT_Y) - 14} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontWeight={600}>
                into a gap
              </text>
            </g>
          )}
          {goodU > 0 &&
            SCREW_TARGETS.map((t, i) => {
              const u = clamp01(goodU * 3 - i * 0.5);
              if (u <= 0) return null;
              return (
                <g key={i} opacity={u}>
                  <circle cx={X(t.x)} cy={Y(FRONT_Y + THICK / 2)} r={5 * u} fill={colors.POSITIVE} stroke={colors.BG} strokeWidth={1} />
                </g>
              );
            })}
          {goodU > 0.7 && (
            <text x={X(FRONT_LEN)} y={Y(FRONT_Y) - 14} fill={colors.POSITIVE} fontSize={13} fontWeight={600} opacity={clamp01(goodU * 3 - 2.1)}>
              into solid wood
            </text>
          )}

          {/* ---- rack / lock readout ---- */}
          {(rackU > 0.05 || lockU > 0) && (
            <g>
              {lockU > 0 && (
                <>
                  <line
                    x1={X(THICK / 2)}
                    y1={Y(FRONT_Y - SIDE_CUT + 3)}
                    x2={X(lerp(THICK / 2, FRONT_LEN - THICK / 2, lockU))}
                    y2={Y(FRONT_Y - SIDE_CUT + 3)}
                    stroke={colors.POSITIVE}
                    strokeWidth={2}
                    strokeDasharray="8 6"
                  />
                  <text x={X(FRONT_LEN / 2)} y={Y(FRONT_Y - SIDE_CUT) - 14} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={700} opacity={lockU}>
                    every joint held at a fixed distance
                  </text>
                </>
              )}
              {rackU > 0.05 && (
                <text x={X(FRONT_LEN / 2)} y={Y(FRONT_Y - SIDE_CUT) - 34} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={700} opacity={rackU}>
                  the wings swing
                </text>
              )}
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={310} y={250} width={660} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={304} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              65 by 17.5 · 8 in of elbow room · screwed into solid wood
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the top is what makes it stiff
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
