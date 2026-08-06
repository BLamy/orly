// Mark Before You Mill
//
// Backing source: Lee Valley, "How to Build a Custom Kitchen Side Table" by
// Charles Mak — a side table in 1x8 and 2x4 lumber, around sixteen pieces
// including the top and the lid, with two compartments: an upper one that holds
// two storage baskets and a lower one for bottles. Technique one is the
// cabinetmaker's triangle: "marking out the components prevents many
// unnecessary milling or assembly errors."
//
// Centerpiece: four boards that are about to become one panel. A single
// triangle is drawn across all of them at once, the boards scatter, and the
// broken triangle catches a flipped board the instant it goes back wrong.
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
// The table, in elevation — the thing all these parts are for.
// ---------------------------------------------------------------------------

const T = { x: 880, y: 180, w: 300, h: 330 } as const;

// ---------------------------------------------------------------------------
// Four boards, edge to edge, about to be a panel.
// ---------------------------------------------------------------------------

const N = 4;
const BW = 108; // board width, px
const BH = 300; // board length, px
const GAP = 8;
const PANEL_X = 190;
const PANEL_Y = 190;
const panelW = N * BW + (N - 1) * GAP;

// Scatter targets — where each board goes when the panel comes apart.
const SCATTER = [
  { dx: -46, dy: 118, rot: -9 },
  { dx: 34, dy: 152, rot: 7 },
  { dx: -18, dy: 96, rot: 13 },
  { dx: 56, dy: 128, rot: -6 },
];

const OAK = '#8a6a43';
const OAK_LIT = '#b08a55';

// The triangle, in panel-local coordinates (0..1 across, 0..1 down).
const TRI: [number, number][] = [
  [0.5, 0.12],
  [0.12, 0.74],
  [0.88, 0.74],
];

const CAM_TABLE: CameraState = { x: 880, y: 330, k: 1.24 };
const CAM_PANEL: CameraState = { x: 420, y: 330, k: 1.16 };
const CAM_SCATTER: CameraState = { x: 440, y: 380, k: 0.95 };
const CAM_ERROR: CameraState = { x: 380, y: 320, k: 1.4 };
const CAM_WIDE: CameraState = { x: 620, y: 340, k: 0.9 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tableU: ChannelRef<number>;
  partsU: ChannelRef<number>;
  panelU: ChannelRef<number>;
  triU: ChannelRef<number>;
  scatterU: ChannelRef<number>;
  backU: ChannelRef<number>;
  flipU: ChannelRef<number>;
  catchU: ChannelRef<number>;
  fixU: ChannelRef<number>;
  everyU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TABLE, cameraInterp);
  const tableU = tl.channel('tableU', 0);
  const partsU = tl.channel('partsU', 0);
  const panelU = tl.channel('panelU', 0);
  const triU = tl.channel('triU', 0);
  const scatterU = tl.channel('scatterU', 0);
  const backU = tl.channel('backU', 0);
  const flipU = tl.channel('flipU', 0);
  const catchU = tl.channel('catchU', 0);
  const fixU = tl.channel('fixU', 0);
  const everyU = tl.channel('everyU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the piece —
  tl.caption({
    at: 0.5,
    dur: 6.75,
    text: 'This one is a kitchen side table, built from one-by-eight and two-by-four lumber. Two compartments: the upper one holds a pair of storage baskets, and the lower one is for bottles.',
  });
  tl.tween(tableU, 1, { at: 0.7, dur: 1.6, ease: ease.enter });
  tl.hold(6.7, 0.6);

  // — Beat 2 · sixteen lookalikes —
  tl.caption({
    at: 7.3,
    dur: 6.75,
    text: 'It comes to about sixteen pieces once you count the top and the lid. And here is the quiet problem with sixteen pieces of milled softwood: by the time they are cut, they all look exactly the same.',
  });
  tl.tween(cam, CAM_PANEL, { at: 7.5, dur: 1.6, ease: ease.move });
  tl.tween(partsU, 1, { at: 8.2, dur: 1.4, ease: ease.enter });
  tl.tween(panelU, 1, { at: 9.6, dur: 1.2, ease: ease.move });
  tl.hold(13.5, 0.6);

  // — Beat 3 · the triangle —
  tl.caption({
    at: 14.1,
    dur: 6.95,
    text: 'So before anything is milled, one triangle is drawn straight across the whole group at once. Not four marks. One mark, spanning four boards, in the exact arrangement you want them in.',
  });
  tl.tween(triU, 1, { at: 14.6, dur: 1.8, ease: ease.draw });
  tl.hold(20.5, 0.6);

  // — Beat 4 · scatter —
  tl.caption({
    at: 21.1,
    dur: 6.55,
    text: 'Now take the boards apart, as you must, to joint them and plane them and stand them against the wall. Each board keeps its own fragment of that triangle.',
  });
  tl.tween(cam, CAM_SCATTER, { at: 21.3, dur: 1.6, ease: ease.move });
  tl.tween(scatterU, 1, { at: 22.0, dur: 2.0, ease: ease.move });
  tl.hold(27.1, 0.6);

  // — Beat 5 · the wrong reassembly —
  tl.caption({
    at: 27.7,
    dur: 7.15,
    text: 'And when they come back to the bench, one of them goes back turned around. Every edge still fits, the grain still looks plausible, and the glue-up would have been fine — right up until you finished it.',
  });
  tl.tween(backU, 1, { at: 28.2, dur: 1.8, ease: ease.move });
  tl.tween(flipU, 1, { at: 30.4, dur: 1.0, ease: ease.move });
  tl.hold(34.3, 0.6);

  // — Beat 6 · the triangle catches it —
  tl.caption({
    at: 34.9,
    dur: 6.75,
    text: 'Except the triangle does not line up. That is the entire trick: a mark that means nothing on any single board, and is obviously broken the moment the group is wrong.',
  });
  tl.tween(cam, CAM_ERROR, { at: 35.1, dur: 1.5, ease: ease.move });
  tl.tween(catchU, 1, { at: 36.0, dur: 1.0, ease: ease.pop });
  tl.hold(41.1, 0.6);

  // — Beat 7 · put it right —
  tl.caption({
    at: 41.7,
    dur: 6.15,
    text: 'Turn that board back and the lines meet again. You checked an assembly in about a second, without measuring anything at all.',
  });
  tl.tween(fixU, 1, { at: 42.0, dur: 1.4, ease: ease.move });
  tl.hold(47.3, 0.6);

  // — Beat 8 · every group —
  tl.caption({
    at: 47.9,
    dur: 6.75,
    text: 'So every group of parts in this table gets its own triangle: the top, the compartment bottoms, the side frames. Marking out the components is what prevents most milling and assembly mistakes before they happen.',
  });
  tl.tween(cam, CAM_WIDE, { at: 48.1, dur: 1.6, ease: ease.move });
  tl.tween(everyU, 1, { at: 49.0, dur: 1.8, ease: ease.pop });
  tl.hold(54.1, 0.6);

  // — Beat 9 · close —
  tl.caption({
    at: 54.7,
    dur: 5.6,
    text: 'With the parts marked, they can be turned into the wide panels this table is mostly made of.',
  });
  tl.tween(dimAll, 0.13, { at: 55.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.2, dur: 0.9, ease: ease.enter });
  tl.hold(60.3, 1.6);

  return { tl, cam, tableU, partsU, panelU, triU, scatterU, backU, flipU, catchU, fixU, everyU, dimAll, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tableU = s.get(scene.tableU);
  const partsU = s.get(scene.partsU);
  const panelU = s.get(scene.panelU);
  const triU = s.get(scene.triU);
  const scatterU = s.get(scene.scatterU);
  const backU = s.get(scene.backU);
  const flipU = s.get(scene.flipU);
  const catchU = s.get(scene.catchU);
  const fixU = s.get(scene.fixU);
  const everyU = s.get(scene.everyU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  // how far apart the boards are right now: out on scatter, back on backU
  const apart = clamp01(scatterU - backU);
  // board 2 (index 1) is the one that goes back turned around, until it is fixed
  const flipped = clamp01(flipU - fixU);

  const boardX = (i: number): number => PANEL_X + i * (BW + GAP * panelU);

  // the triangle in stage coordinates
  const triPt = (t: [number, number]): { x: number; y: number } => ({
    x: PANEL_X + t[0] * panelW,
    y: PANEL_Y + t[1] * BH,
  });

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the table this is all for ---- */}
          <g opacity={tableU * (1 - apart * 0.93)}>
            <rect x={T.x} y={T.y} width={T.w} height={16} rx={3} fill={OAK_LIT} stroke="#2f2415" />
            <text x={T.x + T.w / 2} y={T.y - 14} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              top &amp; lid
            </text>
            {/* carcass */}
            <rect x={T.x + 14} y={T.y + 16} width={T.w - 28} height={T.h - 40} fill="none" stroke={OAK} strokeWidth={3} />
            {/* divider between the compartments */}
            <line x1={T.x + 14} y1={T.y + 168} x2={T.x + T.w - 14} y2={T.y + 168} stroke={OAK} strokeWidth={3} />
            {/* two baskets up top */}
            {[0, 1].map((i) => (
              <rect key={i} x={T.x + 34 + i * 118} y={T.y + 54} width={98} height={94} rx={4} fill="none" stroke={colors.SECONDARY} strokeWidth={2} strokeDasharray="6 5" />
            ))}
            <text x={T.x + T.w / 2} y={T.y + 44} textAnchor="middle" fill={colors.SECONDARY} fontSize={12.5}>
              two storage baskets
            </text>
            {/* bottles below */}
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={T.x + 46 + i * 70} y={T.y + 208} width={22} height={64} rx={4} fill={colors.POSITIVE} opacity={0.55} />
                <rect x={T.x + 53 + i * 70} y={T.y + 192} width={8} height={20} fill={colors.POSITIVE} opacity={0.55} />
              </g>
            ))}
            <text x={T.x + T.w / 2} y={T.y + 296} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5}>
              bottles below
            </text>
            {/* legs */}
            {[T.x + 14, T.x + T.w - 20].map((x, i) => (
              <rect key={i} x={x} y={T.y + T.h - 24} width={6} height={44} fill={OAK} />
            ))}
          </g>

          {/* ---- the four boards ---- */}
          {Array.from({ length: N }, (_, i) => {
            const sc = SCATTER[i];
            const x = boardX(i) + sc.dx * apart;
            const y = PANEL_Y + sc.dy * apart;
            const rot = sc.rot * apart;
            const isFlipped = i === 1 ? flipped : 0;
            const u = clamp01(partsU * 2 - i * 0.2);
            if (u <= 0) return null;
            return (
              <g key={i} opacity={u} transform={`rotate(${rot}, ${x + BW / 2}, ${y + BH / 2})`}>
                <rect x={x} y={y} width={BW} height={BH} rx={2} fill={i === 1 && isFlipped > 0.5 ? OAK_LIT : OAK} stroke="#2f2415" strokeWidth={1.3} />
                {/* the board's fragment of the triangle, clipped to its own width */}
                {triU > 0 && (
                  <g
                    opacity={triU}
                    transform={`translate(${x - boardX(i)}, ${y - PANEL_Y}) ${
                      isFlipped > 0.5 ? `rotate(180, ${boardX(i) + BW / 2}, ${PANEL_Y + BH / 2})` : ''
                    }`}
                  >
                    <clipPath id={`st1-clip-${i}`}>
                      <rect x={boardX(i)} y={PANEL_Y} width={BW} height={BH} />
                    </clipPath>
                    <g clipPath={`url(#st1-clip-${i})`}>
                      <polygon
                        points={TRI.map((t) => {
                          const p = triPt(t);
                          return `${p.x},${p.y}`;
                        }).join(' ')}
                        fill="none"
                        stroke={catchU > 0.5 && fixU < 0.5 ? colors.NEGATIVE : colors.WARM}
                        strokeWidth={5}
                        strokeLinejoin="round"
                      />
                    </g>
                  </g>
                )}
              </g>
            );
          })}

          {/* the verdict */}
          {catchU > 0 && (
            <text
              x={PANEL_X + panelW / 2}
              y={PANEL_Y - 34}
              textAnchor="middle"
              fill={fixU > 0.5 ? colors.POSITIVE : colors.NEGATIVE}
              fontSize={17}
              fontWeight={700}
              opacity={catchU}
            >
              {fixU > 0.5 ? 'the lines meet — this is the right order' : 'the triangle does not meet'}
            </text>
          )}
          {apart > 0.4 && catchU < 0.1 && (
            <text x={PANEL_X + panelW / 2} y={PANEL_Y + BH + 190} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={clamp01(apart * 2 - 0.8)}>
              jointed, planed, stood against the wall — and shuffled
            </text>
          )}

          {/* every group gets one */}
          {everyU > 0 && (
            <g opacity={everyU}>
              {['the top', 'compartment bottoms', 'side frames'].map((label, i) => {
                const u = clamp01(everyU * 3 - i * 0.6);
                if (u <= 0) return null;
                const x = 300 + i * 260;
                const y = 566;
                return (
                  <g key={label} opacity={u}>
                    <polygon points={`${x + 42},${y - 44} ${x + 8},${y} ${x + 76},${y}`} fill="none" stroke={colors.WARM} strokeWidth={3} strokeLinejoin="round" />
                    <text x={x + 42} y={y + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={316} y={258} width={648} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              one mark across a whole group of parts
            </text>
            <text x={640} y={354} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the cabinetmaker&apos;s triangle
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
