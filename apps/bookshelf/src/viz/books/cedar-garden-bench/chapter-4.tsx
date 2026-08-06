// Dowels, Not Screw Heads
//
// Backing source: Lee Valley, "How to Build a Contemporary Cedar Garden Bench"
// — mark screw and dowel locations on the outer faces 1 in from the edges;
// drill 3/8 in countersink holes 1/2 in deep; on the legs, space them 3 in from
// the top and bottom; on the top length, mark 1-3/4 in from the edge (the
// centre of the legs); glue 3/8 in dowels in place, trim the excess with a
// Japanese saw, then sand with a belt sander followed by an orbital sander.
//
// Centerpiece: one hole in cross-section — countersink, screw, glue, dowel,
// flush cut — and then the camera pulls back to watch that single detail
// multiply into the grid of dots that is the whole look of the bench.
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
// Stage A — one hole, in section. 1 in = 96 px at this magnification.
// ---------------------------------------------------------------------------

const MAG = 96;
const FACE_X = 250; // the outer face of the board, in stage coords
const SEC_Y = 150;
const SEC_H = 300;
const BORE_D = (3 / 8) * MAG; // 3/8 in dowel + countersink
const BORE_DEEP = 0.5 * MAG; // 1/2 in deep
const BORE_Y = SEC_Y + SEC_H / 2;

// ---------------------------------------------------------------------------
// Stage B — the outer face of the bench, and where the marks go.
// ---------------------------------------------------------------------------

const FPX = 8.2; // px per inch on the elevation
const BENCH_L = 48;
const LEG_H = 18;
const F = { x: 640 - (BENCH_L * FPX) / 2, y: 470 } as const;
const FX = (x: number): number => F.x + x * FPX;
const FY = (y: number): number => F.y - y * FPX; // y measured up from the ground

// The 2x4 is 3-1/2 in wide, so its centre line is 1-3/4 in in — which is
// exactly where the article says to mark the top length.
const STOCK_W = 3.5;
const HALF = STOCK_W / 2; // 1.75

// Dowel positions on the outer face: legs get holes 3 in from top and bottom,
// the long top piece gets holes 1-3/4 in from its edge, over the leg centres.
const LEG_X = [HALF, BENCH_L - HALF];
const LEG_DOTS = LEG_X.flatMap((x) => [
  { x, y: 3 },
  { x, y: LEG_H - 3 },
]);
const TOP_DOTS = [0.15, 0.38, 0.62, 0.85].map((f) => ({ x: f * BENCH_L, y: LEG_H + HALF }));

const CEDAR = '#a2653a';
const CEDAR_LIT = '#c98a4f';
const DOWEL = '#d9b184';

const CAM_SECTION: CameraState = { x: 470, y: 292, k: 1.24 };
const CAM_BORE: CameraState = { x: 452, y: 300, k: 1.42 };
const CAM_FACE: CameraState = { x: 640, y: 400, k: 1.06 };
const CAM_MARK: CameraState = { x: 400, y: 420, k: 1.5 };
const CAM_FINAL: CameraState = { x: 640, y: 380, k: 0.95 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  secU: ChannelRef<number>;
  markU: ChannelRef<number>;
  boreU: ChannelRef<number>;
  screwU: ChannelRef<number>;
  dowelU: ChannelRef<number>;
  sawU: ChannelRef<number>;
  beltU: ChannelRef<number>;
  orbitU: ChannelRef<number>;
  secDim: ChannelRef<number>;
  faceU: ChannelRef<number>;
  legDotsU: ChannelRef<number>;
  halfU: ChannelRef<number>;
  topDotsU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SECTION, cameraInterp);
  const secU = tl.channel('secU', 0);
  const markU = tl.channel('markU', 0);
  const boreU = tl.channel('boreU', 0);
  const screwU = tl.channel('screwU', 0);
  const dowelU = tl.channel('dowelU', 0);
  const sawU = tl.channel('sawU', 0);
  const beltU = tl.channel('beltU', 0);
  const orbitU = tl.channel('orbitU', 0);
  const secDim = tl.channel('secDim', 1);
  const faceU = tl.channel('faceU', 0);
  const legDotsU = tl.channel('legDotsU', 0);
  const halfU = tl.channel('halfU', 0);
  const topDotsU = tl.channel('topDotsU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the problem —
  tl.caption({
    at: 0.5,
    dur: 6.55,
    text: 'A stacked bench is held together by screws, and screws are ugly. So this design never hides them — it covers each one with a plug of the same wood, and then makes a pattern out of where they are.',
  });
  tl.tween(secU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.hold(6.5, 0.6);

  // — Beat 2 · the mark —
  tl.caption({
    at: 7.1,
    dur: 6.15,
    text: 'It starts with a mark, and the mark is always one inch in from the edge. Closer than that and you risk splitting out the side of the board when the drill goes in.',
  });
  tl.tween(markU, 1, { at: 7.4, dur: 0.9, ease: ease.enter });
  tl.hold(12.7, 0.6);

  // — Beat 3 · the countersink —
  tl.caption({
    at: 13.3,
    dur: 6.75,
    text: 'Then a three-eighths inch hole, half an inch deep. Not all the way through — just deep enough to sink the screw head well below the surface and leave a clean round socket above it.',
  });
  tl.tween(cam, CAM_BORE, { at: 13.5, dur: 1.5, ease: ease.move });
  tl.tween(boreU, 1, { at: 14.4, dur: 1.4, ease: ease.move });
  tl.hold(19.5, 0.6);

  // — Beat 4 · the screw goes to the bottom —
  tl.caption({
    at: 20.1,
    dur: 5.95,
    text: 'The screw is driven from the bottom of that socket, so it starts half an inch further into the wood than it looks — which is another reason those screws had to get longer.',
  });
  tl.tween(screwU, 1, { at: 20.4, dur: 1.2, ease: ease.move });
  tl.hold(25.5, 0.6);

  // — Beat 5 · the dowel —
  tl.caption({
    at: 26.1,
    dur: 6.35,
    text: 'A three-eighths inch dowel is glued into the socket on top of it. Same diameter as the hole, same species as the bench, standing a little proud on purpose.',
  });
  tl.tween(dowelU, 1, { at: 26.4, dur: 1.4, ease: ease.move });
  tl.hold(31.9, 0.6);

  // — Beat 6 · the flush cut —
  tl.caption({
    at: 32.5,
    dur: 6.75,
    text: 'When the glue is set, the excess comes off with a Japanese saw. That saw cuts on the pull stroke and its blade flexes flat against the surface, so it trims the dowel without gouging the wood around it.',
  });
  tl.tween(sawU, 1, { at: 33.0, dur: 1.8, ease: ease.move });
  tl.hold(38.7, 0.6);

  // — Beat 7 · two sanders —
  tl.caption({
    at: 39.3,
    dur: 6.55,
    text: 'Then two sanders in order. The belt sander is the blunt instrument that levels the plug and the surface into one plane; the orbital comes after to take out everything the belt just did.',
  });
  tl.tween(beltU, 1, { at: 39.7, dur: 1.6, ease: ease.linear });
  tl.tween(orbitU, 1, { at: 41.6, dur: 1.8, ease: ease.linear });
  tl.hold(45.3, 0.6);

  // — Beat 8 · pull back to the face —
  tl.caption({
    at: 45.9,
    dur: 7.15,
    text: 'Now pull back and look at the whole outer face, because that single detail is about to become the design. On the legs the holes sit three inches down from the top and three up from the bottom.',
  });
  tl.tween(secDim, 0.1, { at: 46.1, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_FACE, { at: 46.1, dur: 1.8, ease: ease.move });
  tl.tween(faceU, 1, { at: 46.8, dur: 1.4, ease: ease.enter });
  tl.tween(legDotsU, 1, { at: 48.4, dur: 1.6, ease: ease.pop });
  tl.hold(52.5, 0.6);

  // — Beat 9 · one and three quarters —
  tl.caption({
    at: 53.1,
    dur: 7.15,
    text: 'And along the top length, the marks go one and three quarter inches in from the edge. That number is not a style choice: a two-by-four is three and a half inches wide, so half of it is one and three quarters. The dowels sit dead centre over the wood below.',
  });
  tl.tween(cam, CAM_MARK, { at: 53.3, dur: 1.5, ease: ease.move });
  tl.tween(halfU, 1, { at: 54.4, dur: 1.6, ease: ease.draw });
  tl.hold(59.7, 0.6);

  // — Beat 10 · the pattern —
  tl.caption({
    at: 60.3,
    dur: 6.75,
    text: 'Line them up and the fasteners stop being something to apologise for. A row of evenly spaced dots down the face is exactly what makes this bench read as contemporary rather than rustic.',
  });
  tl.tween(cam, CAM_FINAL, { at: 60.5, dur: 1.6, ease: ease.move });
  tl.tween(topDotsU, 1, { at: 61.2, dur: 2.0, ease: ease.pop });
  tl.hold(66.5, 0.6);

  // — Beat 11 · close —
  tl.caption({
    at: 67.1,
    dur: 5.8,
    text: 'Seven boards, four lengths, eight glued courses and a grid of dowels. Next time, the wood moves indoors and the joinery gets a great deal more ambitious.',
  });
  tl.tween(dimAll, 0.13, { at: 67.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 68.6, dur: 0.9, ease: ease.enter });
  tl.hold(72.9, 1.6);

  return {
    tl, cam, secU, markU, boreU, screwU, dowelU, sawU, beltU, orbitU, secDim,
    faceU, legDotsU, halfU, topDotsU, dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const secU = s.get(scene.secU);
  const markU = s.get(scene.markU);
  const boreU = s.get(scene.boreU);
  const screwU = s.get(scene.screwU);
  const dowelU = s.get(scene.dowelU);
  const sawU = s.get(scene.sawU);
  const beltU = s.get(scene.beltU);
  const orbitU = s.get(scene.orbitU);
  const secDim = s.get(scene.secDim);
  const faceU = s.get(scene.faceU);
  const legDotsU = s.get(scene.legDotsU);
  const halfU = s.get(scene.halfU);
  const topDotsU = s.get(scene.topDotsU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const boreDepth = BORE_DEEP * boreU;
  const proud = lerp(46, 0, clamp01(sawU)); // how far the dowel stands out
  const dowelX = FACE_X - proud * dowelU;
  const flush = clamp01(beltU) * clamp01(orbitU);
  // once the camera leaves the section, its callouts go with it
  const secText = secDim > 0.4;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= one hole, in section ================= */}
        <g opacity={secU * secDim * dimAll}>
          {secText && (
            <text x={FACE_X + 40} y={SEC_Y - 26} fill={colors.MUTED} fontSize={13}>
              one hole, in section — the outer face is on the left
            </text>
          )}
          {/* the stock */}
          <rect x={FACE_X} y={SEC_Y} width={430} height={SEC_H} fill={CEDAR} stroke="#3a2515" strokeWidth={1.4} />
          {/* the countersink bore */}
          {boreU > 0 && (
            <rect x={FACE_X} y={BORE_Y - BORE_D / 2} width={boreDepth} height={BORE_D} fill={colors.BG} stroke={colors.GRID} />
          )}
          {/* the screw, driven from the bottom of the bore */}
          {screwU > 0 && (
            <g opacity={screwU}>
              <rect x={FACE_X + BORE_DEEP} y={BORE_Y - 6} width={190 * screwU} height={12} rx={3} fill={colors.ACCENT} opacity={0.9} />
              {secText && (
                <text x={FACE_X + 190} y={SEC_Y + SEC_H + 34} fill={colors.ACCENT} fontSize={13.5}>
                  the screw starts ½ in deeper than it looks
                </text>
              )}
            </g>
          )}
          {/* the dowel */}
          {dowelU > 0 && (
            <rect
              x={dowelX}
              y={BORE_Y - BORE_D / 2}
              width={BORE_DEEP + proud * dowelU}
              height={BORE_D}
              rx={3}
              fill={DOWEL}
              stroke="#3a2515"
              opacity={dowelU}
            />
          )}
          {/* the pull saw */}
          {sawU > 0 && sawU < 1 && (
            <g>
              <rect x={FACE_X - 70 + sawU * 90} y={BORE_Y - 90} width={150} height={5} rx={2} fill={colors.SECONDARY} transform={`rotate(90, ${FACE_X - 4}, ${BORE_Y})`} />
              <text x={FACE_X - 30} y={SEC_Y - 6} textAnchor="end" fill={colors.SECONDARY} fontSize={13}>
                Japanese saw — cuts on the pull
              </text>
            </g>
          )}
          {/* dimension callouts */}
          {markU > 0 && (
            <g opacity={markU * (1 - clamp01(boreU))}>
              <line x1={FACE_X} y1={SEC_Y - 14} x2={FACE_X + MAG} y2={SEC_Y - 14} stroke={colors.WARM} strokeWidth={2.4} />
              <text x={FACE_X + MAG / 2} y={SEC_Y - 22} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={700}>
                1 in from the edge
              </text>
            </g>
          )}
          {boreU > 0.6 && (
            <g opacity={clamp01(boreU * 2 - 1.2) * (1 - dowelU * 0.7)}>
              <line x1={FACE_X} y1={BORE_Y + BORE_D / 2 + 16} x2={FACE_X + BORE_DEEP} y2={BORE_Y + BORE_D / 2 + 16} stroke={colors.POSITIVE} strokeWidth={2.4} />
              <text x={FACE_X + BORE_DEEP / 2} y={BORE_Y + BORE_D / 2 + 36} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={700}>
                ⅜ in wide · ½ in deep
              </text>
            </g>
          )}
          {/* the sanders */}
          {beltU > 0 && beltU < 1 && (
            <rect x={FACE_X - 40} y={SEC_Y + 40 + beltU * (SEC_H - 120)} width={70} height={40} rx={5} fill={colors.WARM} opacity={0.85} />
          )}
          {orbitU > 0 && orbitU < 1 && (
            <circle cx={FACE_X - 6} cy={SEC_Y + 40 + orbitU * (SEC_H - 80)} r={26} fill={colors.SECONDARY} opacity={0.8} />
          )}
          {flush > 0.9 && secText && (
            <text x={FACE_X + 60} y={SEC_Y + SEC_H + 30} fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
              plug and surface, one plane
            </text>
          )}
        </g>

        {/* ================= the outer face ================= */}
        <g opacity={faceU * dimAll}>
          {/* legs */}
          {LEG_X.map((x, i) => (
            <rect
              key={i}
              x={FX(x - HALF)}
              y={FY(LEG_H)}
              width={STOCK_W * FPX}
              height={LEG_H * FPX}
              rx={2}
              fill={CEDAR}
              stroke="#3a2515"
              strokeWidth={1.2}
            />
          ))}
          {/* the top length */}
          <rect x={FX(0)} y={FY(LEG_H + STOCK_W)} width={BENCH_L * FPX} height={STOCK_W * FPX} rx={2} fill={CEDAR_LIT} stroke="#3a2515" strokeWidth={1.3} />

          {/* leg dowels — 3 in from top and bottom */}
          {LEG_DOTS.map((d, i) => {
            const u = clamp01(legDotsU * 4 - i * 0.5);
            if (u <= 0) return null;
            return <circle key={i} cx={FX(d.x)} cy={FY(d.y)} r={5.5 * u} fill={DOWEL} stroke="#3a2515" />;
          })}
          {legDotsU > 0.7 && (
            <g opacity={clamp01(legDotsU * 3 - 2.1)}>
              <line x1={FX(-2.4)} y1={FY(LEG_H)} x2={FX(-2.4)} y2={FY(LEG_H - 3)} stroke={colors.WARM} strokeWidth={2.2} />
              <text x={FX(-3.2)} y={FY(LEG_H - 1.5)} textAnchor="end" fill={colors.WARM} fontSize={13} fontWeight={700}>
                3 in
              </text>
            </g>
          )}

          {/* the 1-3/4 derivation on the top length */}
          {halfU > 0 && (
            <g opacity={halfU}>
              <line x1={FX(6)} y1={FY(LEG_H + STOCK_W)} x2={FX(6)} y2={FY(LEG_H + STOCK_W) + STOCK_W * FPX * halfU} stroke={colors.ACCENT} strokeWidth={2.4} />
              <text x={FX(7)} y={FY(LEG_H + HALF) + 5} fill={colors.ACCENT} fontSize={14} fontWeight={700}>
                1¾ in
              </text>
              <text x={FX(BENCH_L / 2)} y={FY(LEG_H + STOCK_W) - 16} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={700} opacity={clamp01(halfU * 2 - 1)}>
                3½ in wide stock ÷ 2 = dead centre
              </text>
            </g>
          )}

          {/* the pattern along the top */}
          {TOP_DOTS.map((d, i) => {
            const u = clamp01(topDotsU * 4 - i * 0.6);
            if (u <= 0) return null;
            return <circle key={i} cx={FX(d.x)} cy={FY(d.y)} r={5.5 * u} fill={DOWEL} stroke="#3a2515" />;
          })}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={314} y={252} width={652} height={144} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              ⅜ in sockets · glued dowels · flush cut · two sanders
            </text>
            <text x={640} y={350} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the fasteners became the pattern
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
