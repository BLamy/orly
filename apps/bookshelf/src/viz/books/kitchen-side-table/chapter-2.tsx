// Wide From Narrow
//
// Backing source: Lee Valley, "How to Build a Custom Kitchen Side Table" by
// Charles Mak — "the wider pieces such as the top and compartment bottoms were
// formed by gluing up 1 x 8 boards together", with cauls used to keep the
// panels flat during the cure and squeeze-out removed with chisels and
// scrapers; scraps are used as clamping pads to avoid marring the softwood.
//
// Centerpiece: an end-on section of a panel in clamps. Side pressure alone
// makes it buckle; cauls above and below flatten it; and the glue that gets
// squeezed out of every joint is dealt with before it turns to glass.
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

// ---------------------------------------------------------------------------
// The panel, seen end-on: four 1x8s standing edge to edge.
// ---------------------------------------------------------------------------

const N = 4;
const BOARD_W = 150; // px — the 7-1/4 in face of a 1x8
const BOARD_T = 34; // px — its thickness
const CXX = 620;
const PY = 300;
const PANEL_W = N * BOARD_W;
const PX0 = CXX - PANEL_W / 2;

const OAK = '#8a6a43';
const OAK_LIT = '#b08a55';

// Joint centres — where glue squeezes out.
const JOINTS = Array.from({ length: N - 1 }, (_, i) => PX0 + (i + 1) * BOARD_W);

// Without cauls the panel buckles: each joint rides up on a smooth arc.
const buckleAt = (x: number, amt: number): number => {
  const u = (x - PX0) / PANEL_W; // 0..1 across the panel
  return -Math.sin(u * Math.PI) * amt;
};

const CAM_WIDE: CameraState = { x: 620, y: 320, k: 1.05 };
const CAM_EDGE: CameraState = { x: 470, y: 300, k: 1.7 };
const CAM_BUCKLE: CameraState = { x: 620, y: 268, k: 1.3 };
const CAM_SQUEEZE: CameraState = { x: 560, y: 292, k: 1.75 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  boardsU: ChannelRef<number>;
  glueU: ChannelRef<number>;
  closeUpU: ChannelRef<number>;
  clampU: ChannelRef<number>;
  buckleU: ChannelRef<number>;
  caulU: ChannelRef<number>;
  flatU: ChannelRef<number>;
  padU: ChannelRef<number>;
  beadU: ChannelRef<number>;
  scrapeU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const boardsU = tl.channel('boardsU', 0);
  const glueU = tl.channel('glueU', 0);
  const closeUpU = tl.channel('closeUpU', 0);
  const clampU = tl.channel('clampU', 0);
  const buckleU = tl.channel('buckleU', 0);
  const caulU = tl.channel('caulU', 0);
  const flatU = tl.channel('flatU', 0);
  const padU = tl.channel('padU', 0);
  const beadU = tl.channel('beadU', 0);
  const scrapeU = tl.channel('scrapeU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · why glue up at all —
  tl.caption({
    at: 0.5,
    dur: 6.75,
    text: 'The top of this table and the bottoms of both compartments are wider than any board you can buy in one-by-eight. So they are not bought wide. They are made wide, out of narrow boards glued edge to edge.',
  });
  tl.tween(boardsU, 1, { at: 0.7, dur: 1.8, ease: ease.enter });
  tl.hold(6.7, 0.6);

  // — Beat 2 · the joint —
  tl.caption({
    at: 7.3,
    dur: 6.55,
    text: 'Each joint is just glue on two long-grain edges, and that is enough — a properly fitted edge joint is stronger than the wood on either side of it. What it is not is self-aligning.',
  });
  tl.tween(cam, CAM_EDGE, { at: 7.5, dur: 1.5, ease: ease.move });
  tl.tween(closeUpU, 1, { at: 8.2, dur: 1.0, ease: ease.enter });
  tl.tween(glueU, 1, { at: 9.4, dur: 1.4, ease: ease.draw });
  tl.hold(13.3, 0.6);

  // — Beat 3 · clamps push sideways —
  tl.caption({
    at: 13.9,
    dur: 6.95,
    text: 'Clamps pull the boards together from the sides, and side pressure has to go somewhere. Push hard enough on a row of thin boards and the whole panel lifts in the middle like a drawbridge.',
  });
  tl.tween(cam, CAM_BUCKLE, { at: 14.1, dur: 1.5, ease: ease.move });
  tl.tween(closeUpU, 0, { at: 14.1, dur: 0.6, ease: ease.move });
  tl.tween(clampU, 1, { at: 14.8, dur: 1.2, ease: ease.pop });
  tl.tween(buckleU, 1, { at: 16.2, dur: 1.6, ease: ease.move });
  tl.hold(20.3, 0.6);

  // — Beat 4 · cauls —
  tl.caption({
    at: 20.9,
    dur: 6.95,
    text: 'Cauls are the fix: stiff bars clamped across the panel, above and below, at right angles to the joints. They take the buckling away without adding a single squeeze to the joints themselves.',
  });
  tl.tween(caulU, 1, { at: 21.4, dur: 1.4, ease: ease.enter });
  tl.tween(flatU, 1, { at: 23.0, dur: 1.6, ease: ease.move });
  tl.hold(27.3, 0.6);

  // — Beat 5 · clamping pads —
  tl.caption({
    at: 27.9,
    dur: 6.15,
    text: 'Scrap offcuts go between the clamp jaws and the wood as pads. This is softwood — a steel jaw pressed straight onto it leaves a dent you will be steaming out later.',
  });
  tl.tween(padU, 1, { at: 28.3, dur: 1.0, ease: ease.pop });
  tl.hold(33.5, 0.6);

  // — Beat 6 · squeeze-out —
  tl.caption({
    at: 34.1,
    dur: 6.75,
    text: 'Squeeze the joints and glue comes out of every one of them. That bead is a good sign — it means the joint is full — and it is also the thing that will ruin the finish if you leave it.',
  });
  tl.tween(cam, CAM_SQUEEZE, { at: 34.3, dur: 1.5, ease: ease.move });
  tl.tween(beadU, 1, { at: 35.2, dur: 1.4, ease: ease.enter });
  tl.hold(40.3, 0.6);

  // — Beat 7 · chisel and scraper —
  tl.caption({
    at: 40.9,
    dur: 6.95,
    text: 'So it comes off with a chisel and a scraper. Not a wet rag, which only spreads it into the grain, and not a sander later, when it has cured into something closer to glass than to wood.',
  });
  tl.tween(scrapeU, 1, { at: 41.4, dur: 2.4, ease: ease.linear });
  tl.hold(47.3, 0.6);

  // — Beat 8 · the result —
  tl.caption({
    at: 47.9,
    dur: 6.55,
    text: 'What comes out of the clamps is a single flat panel wide enough to be a table top, made of boards that were never wide enough on their own.',
  });
  tl.tween(cam, CAM_WIDE, { at: 48.1, dur: 1.6, ease: ease.move });
  tl.tween(clampU, 0, { at: 49.2, dur: 1.0, ease: ease.move });
  tl.tween(caulU, 0, { at: 49.4, dur: 1.0, ease: ease.move });
  tl.tween(padU, 0, { at: 49.4, dur: 0.8, ease: ease.move });
  tl.hold(53.9, 0.6);

  // — Beat 9 · close —
  tl.caption({
    at: 54.5,
    dur: 5.6,
    text: 'Panels done, the table needs joints that hold the frame together — and a machine that is only fast if you use it in the right order.',
  });
  tl.tween(dimAll, 0.13, { at: 54.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.0, dur: 0.9, ease: ease.enter });
  tl.hold(60.1, 1.6);

  return {
    tl, cam, boardsU, glueU, closeUpU, clampU, buckleU, caulU, flatU, padU, beadU, scrapeU, dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const boardsU = s.get(scene.boardsU);
  const glueU = s.get(scene.glueU);
  const closeUpU = s.get(scene.closeUpU);
  const clampU = s.get(scene.clampU);
  const buckleU = s.get(scene.buckleU);
  const caulU = s.get(scene.caulU);
  const flatU = s.get(scene.flatU);
  const padU = s.get(scene.padU);
  const beadU = s.get(scene.beadU);
  const scrapeU = s.get(scene.scrapeU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const buckle = clamp01(buckleU - flatU) * 62;
  const yAt = (x: number): number => PY + buckleAt(x, buckle);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the boards, end-on ---- */}
          {Array.from({ length: N }, (_, i) => {
            const u = clamp01(boardsU * 2.4 - i * 0.3);
            if (u <= 0) return null;
            const x = PX0 + i * BOARD_W;
            const y0 = yAt(x);
            const y1 = yAt(x + BOARD_W);
            const drop = (1 - u) * 44;
            return (
              <polygon
                key={i}
                points={`${x},${y0 - drop} ${x + BOARD_W},${y1 - drop} ${x + BOARD_W},${y1 + BOARD_T - drop} ${x},${y0 + BOARD_T - drop}`}
                fill={i % 2 === 0 ? OAK : OAK_LIT}
                stroke="#2f2415"
                strokeWidth={1.3}
                opacity={u}
              />
            );
          })}
          {boardsU > 0.6 && (
            <text x={CXX} y={PY - 120} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={clamp01(boardsU * 2 - 1.2)}>
              four 1×8 boards, seen end-on
            </text>
          )}

          {/* ---- glue on the joint faces ---- */}
          {glueU > 0 &&
            JOINTS.map((x, i) => (
              <rect
                key={i}
                x={x - 2}
                y={yAt(x)}
                width={4}
                height={BOARD_T * glueU}
                fill={colors.POSITIVE}
                opacity={0.85}
              />
            ))}
          {closeUpU > 0 && (
            <text x={JOINTS[0]} y={PY + BOARD_T + 40} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} opacity={closeUpU}>
              long grain to long grain
            </text>
          )}

          {/* ---- side clamps ---- */}
          {clampU > 0 && (
            <g opacity={clampU}>
              {[-1, 1].map((sgn, i) => {
                const x = sgn < 0 ? PX0 - 46 : PX0 + PANEL_W + 46;
                return (
                  <g key={i}>
                    <rect x={x - 16} y={PY - 6} width={32} height={BOARD_T + 12} rx={4} fill={colors.SECONDARY} />
                    <line x1={x} y1={PY + BOARD_T / 2} x2={x - sgn * 40} y2={PY + BOARD_T / 2} stroke={colors.SECONDARY} strokeWidth={4} />
                    <polygon
                      points={`${x - sgn * 42},${PY + BOARD_T / 2} ${x - sgn * 62},${PY + BOARD_T / 2 - 9} ${x - sgn * 62},${PY + BOARD_T / 2 + 9}`}
                      fill={colors.SECONDARY}
                    />
                  </g>
                );
              })}
              {/* clamping pads */}
              {padU > 0 &&
                [-1, 1].map((sgn, i) => {
                  const x = sgn < 0 ? PX0 - 12 : PX0 + PANEL_W + 12;
                  return (
                    <rect key={i} x={x - 10} y={PY - 4} width={20} height={BOARD_T + 8} rx={3} fill={colors.WARM} opacity={0.9 * padU} />
                  );
                })}
              {padU > 0.5 && (
                <text x={PX0 - 30} y={PY + BOARD_T + 52} textAnchor="middle" fill={colors.WARM} fontSize={13} opacity={clamp01(padU * 2 - 1)}>
                  scrap pads — softwood dents
                </text>
              )}
            </g>
          )}

          {/* ---- buckling verdict ---- */}
          {buckle > 4 && (
            <text x={CXX} y={PY - 88} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16} fontWeight={700}>
              side pressure has to go somewhere
            </text>
          )}

          {/* ---- cauls ---- */}
          {caulU > 0 && (
            <g opacity={caulU}>
              <rect x={PX0 - 24} y={PY - 30 - (1 - caulU) * 40} width={PANEL_W + 48} height={16} rx={4} fill="#4a5568" stroke={colors.GRID} />
              <rect x={PX0 - 24} y={PY + BOARD_T + 14 + (1 - caulU) * 40} width={PANEL_W + 48} height={16} rx={4} fill="#4a5568" stroke={colors.GRID} />
              <text x={PX0 - 34} y={PY - 18} textAnchor="end" fill={colors.TEXT} fontSize={13.5}>
                cauls
              </text>
              {flatU > 0.6 && (
                <text x={CXX} y={PY - 88} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontWeight={700} opacity={clamp01(flatU * 3 - 1.8)}>
                  flat while it cures
                </text>
              )}
            </g>
          )}

          {/* ---- squeeze-out, and taking it off ---- */}
          {beadU > 0 &&
            JOINTS.map((x, i) => {
              const gone = clamp01(scrapeU * 1.4 - i * 0.3);
              const alive = beadU * (1 - gone);
              if (alive <= 0.02) return null;
              return (
                <g key={i} opacity={alive}>
                  <ellipse cx={x} cy={yAt(x) - 2} rx={13} ry={7} fill={colors.POSITIVE} opacity={0.8} />
                  <ellipse cx={x} cy={yAt(x) + BOARD_T + 2} rx={11} ry={6} fill={colors.POSITIVE} opacity={0.6} />
                </g>
              );
            })}
          {scrapeU > 0 && scrapeU < 1 && (
            <g>
              <rect x={PX0 + scrapeU * PANEL_W - 24} y={PY - 44} width={48} height={26} rx={3} fill={colors.WARM} />
              <text x={PX0 + scrapeU * PANEL_W} y={PY - 54} textAnchor="middle" fill={colors.WARM} fontSize={12.5}>
                chisel &amp; scraper
              </text>
            </g>
          )}
          {scrapeU > 0.95 && (
            <text x={CXX} y={PY + BOARD_T + 78} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
              taken off before it cures to glass
            </text>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={316} y={252} width={648} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              edge joints · cauls · scrap pads · squeeze-out gone
            </text>
            <text x={640} y={348} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              wide panels out of narrow boards
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
