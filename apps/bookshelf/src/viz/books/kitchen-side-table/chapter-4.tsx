// Square, Round and Flat
//
// Backing source: Lee Valley, "How to Build a Custom Kitchen Side Table" by
// Charles Mak — glue the side frames first (legs plus upper and lower aprons),
// then the compartments, checking every sub-assembly for square as you go and
// checking the side frame diagonals; rout the ends of the top before the sides,
// because "end grain tends to split out as the bit exits the end of the cut";
// press a damp rag over a dent with a hot iron to swell the wood and raise it
// before final sanding to 220 grit; mill cabinetmaker's buttons from rabbeted
// strips on the table saw; add a maker's mark; final glue-up and attach the top
// with the buttons.
//
// Centerpiece: the assembly order as a dependency chain, each sub-assembly
// proved square by its diagonals — then three finishing details that each undo
// a specific kind of damage: tear-out, dents, and a top that cannot move.
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
// Stage A — a side frame, and its diagonals.
// ---------------------------------------------------------------------------

const FR = { x: 210, y: 190, w: 300, h: 300 } as const;
const SHEAR = 30; // px of rack before it is pulled square

// ---------------------------------------------------------------------------
// Stage B — the top, seen from above, and the router path.
// ---------------------------------------------------------------------------

const TOP = { x: 640, y: 214, w: 400, h: 240 } as const;

// ---------------------------------------------------------------------------
// Stage C — a button in its slot, holding the top down but not still.
// ---------------------------------------------------------------------------

const BTN = { x: 700, y: 520 } as const;

const OAK = '#8a6a43';
const OAK_LIT = '#b08a55';

const CAM_FRAME: CameraState = { x: 360, y: 336, k: 1.2 };
const CAM_TOP: CameraState = { x: 820, y: 300, k: 1.16 };
const CAM_CORNER: CameraState = { x: 928, y: 262, k: 1.62 };
const CAM_DENT: CameraState = { x: 780, y: 330, k: 1.5 };
const CAM_BUTTON: CameraState = { x: 760, y: 500, k: 1.6 };
const CAM_WIDE: CameraState = { x: 620, y: 340, k: 0.9 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  frameU: ChannelRef<number>;
  rackU: ChannelRef<number>;
  diagU: ChannelRef<number>;
  squareU: ChannelRef<number>;
  orderU: ChannelRef<number>;
  frameDim: ChannelRef<number>;
  topU: ChannelRef<number>;
  wrongU: ChannelRef<number>;
  tearU: ChannelRef<number>;
  rightU: ChannelRef<number>;
  dentU: ChannelRef<number>;
  ironU: ChannelRef<number>;
  sandU: ChannelRef<number>;
  buttonU: ChannelRef<number>;
  moveU: ChannelRef<number>;
  markU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_FRAME, cameraInterp);
  const frameU = tl.channel('frameU', 0);
  const rackU = tl.channel('rackU', 0);
  const diagU = tl.channel('diagU', 0);
  const squareU = tl.channel('squareU', 0);
  const orderU = tl.channel('orderU', 0);
  const frameDim = tl.channel('frameDim', 1);
  const topU = tl.channel('topU', 0);
  const wrongU = tl.channel('wrongU', 0);
  const tearU = tl.channel('tearU', 0);
  const rightU = tl.channel('rightU', 0);
  const dentU = tl.channel('dentU', 0);
  const ironU = tl.channel('ironU', 0);
  const sandU = tl.channel('sandU', 0);
  const buttonU = tl.channel('buttonU', 0);
  const moveU = tl.channel('moveU', 0);
  const markU = tl.channel('markU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · sub-assemblies —
  tl.caption({
    at: 0.5,
    dur: 6.75,
    text: 'Nothing about this table is glued up all at once. The side frames go first — two legs with an upper and a lower apron between them — and only then the compartments, and only then everything together.',
  });
  tl.tween(frameU, 1, { at: 0.7, dur: 1.6, ease: ease.enter });
  tl.hold(6.7, 0.6);

  // — Beat 2 · out of square —
  tl.caption({
    at: 7.3,
    dur: 6.75,
    text: 'The reason is that a four-piece frame will happily glue up as a parallelogram. Every joint is tight, every part is the right length, and the whole thing leans — and you will not see it by eye.',
  });
  tl.tween(rackU, 1, { at: 7.8, dur: 1.6, ease: ease.move });
  tl.hold(13.5, 0.6);

  // — Beat 3 · the diagonals —
  tl.caption({
    at: 14.1,
    dur: 6.95,
    text: 'So you measure the diagonals. Corner to corner one way, corner to corner the other, and when those two numbers match, the frame is square. Nudge it in the clamps until they do.',
  });
  tl.tween(diagU, 1, { at: 14.6, dur: 1.4, ease: ease.draw });
  tl.tween(squareU, 1, { at: 16.6, dur: 1.8, ease: ease.move });
  tl.hold(20.5, 0.6);

  // — Beat 4 · square as you go —
  tl.caption({
    at: 21.1,
    dur: 6.55,
    text: 'And each sub-assembly gets checked before it becomes part of the next one. Square frames make a square carcass. An error you glue in early is an error you will be fighting at every stage after it.',
  });
  tl.tween(orderU, 1, { at: 21.6, dur: 2.2, ease: ease.pop });
  tl.hold(27.1, 0.6);

  // — Beat 5 · routing the top —
  tl.caption({
    at: 27.7,
    dur: 6.35,
    text: 'Now the top gets its edges rounded over, and the order of the cuts matters again. A router bit blows out a little chip where it exits the end of a cut, and end grain splits out worst of all.',
  });
  tl.tween(frameDim, 0.1, { at: 27.9, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_TOP, { at: 27.9, dur: 1.6, ease: ease.move });
  tl.tween(topU, 1, { at: 28.6, dur: 1.2, ease: ease.enter });
  tl.hold(33.5, 0.6);

  // — Beat 6 · the tear-out —
  tl.caption({
    at: 34.1,
    dur: 5.95,
    text: 'Rout the long sides first and the very last pass leaves a torn corner on a face you cannot hide, because there is nothing left to cut away afterwards.',
  });
  tl.tween(cam, CAM_CORNER, { at: 34.3, dur: 1.5, ease: ease.move });
  tl.tween(wrongU, 1, { at: 35.0, dur: 1.6, ease: ease.linear });
  tl.tween(tearU, 1, { at: 36.8, dur: 0.6, ease: ease.pop });
  tl.hold(39.5, 0.6);

  // — Beat 7 · so do the ends first —
  tl.caption({
    at: 40.1,
    dur: 6.15,
    text: 'So the ends are routed first, tear-out and all, and then the sides. The side passes cut straight through the damaged corners and take them away. Same two cuts, opposite order, no repair.',
  });
  tl.tween(wrongU, 0, { at: 40.3, dur: 0.5, ease: ease.move });
  tl.tween(tearU, 0, { at: 40.3, dur: 0.5, ease: ease.move });
  tl.tween(rightU, 1, { at: 41.0, dur: 2.4, ease: ease.linear });
  tl.hold(45.7, 0.6);

  // — Beat 8 · the dent —
  tl.caption({
    at: 46.3,
    dur: 6.95,
    text: 'Softwood picks up dents in the shop, and a dent is not missing wood — it is crushed wood. Lay a damp rag on it, press a hot iron over the top, and the steam swells those fibres back up.',
  });
  tl.tween(cam, CAM_DENT, { at: 46.5, dur: 1.5, ease: ease.move });
  tl.tween(dentU, 1, { at: 47.2, dur: 0.8, ease: ease.enter });
  tl.tween(ironU, 1, { at: 48.8, dur: 1.8, ease: ease.move });
  tl.hold(52.7, 0.6);

  // — Beat 9 · then sand —
  tl.caption({
    at: 53.3,
    dur: 6.15,
    text: 'Then, and only then, the final sanding to two hundred and twenty grit. Sand first and you would simply be levelling the surface down to the bottom of a dent you could have raised.',
  });
  tl.tween(sandU, 1, { at: 53.8, dur: 2.0, ease: ease.linear });
  tl.hold(58.9, 0.6);

  // — Beat 10 · buttons —
  tl.caption({
    at: 59.5,
    dur: 6.95,
    text: 'The top is fastened with cabinetmaker’s buttons — little rabbeted blocks milled on the table saw, whose tongues drop into those ten millimetre slots. Screwed to the top, hooked into the frame.',
  });
  tl.tween(cam, CAM_BUTTON, { at: 59.7, dur: 1.6, ease: ease.move });
  tl.tween(buttonU, 1, { at: 60.4, dur: 1.4, ease: ease.move });
  tl.hold(65.9, 0.6);

  // — Beat 11 · why buttons —
  tl.caption({
    at: 66.5,
    dur: 6.75,
    text: 'Because a wide panel changes width with the seasons. Screw it down hard and it will crack itself trying. A button holds the top firmly down while letting it slide a little in its slot.',
  });
  tl.tween(moveU, 1, { at: 67.0, dur: 2.2, ease: ease.move });
  tl.hold(72.7, 0.6);

  // — Beat 12 · the mark —
  tl.caption({
    at: 73.3,
    dur: 6.35,
    text: 'And before it goes off to be stained, it gets a maker’s mark — which is a small thing, and also the moment a pile of one-by-eights becomes somebody’s furniture.',
  });
  tl.tween(cam, CAM_WIDE, { at: 73.5, dur: 1.6, ease: ease.move });
  tl.tween(markU, 1, { at: 74.4, dur: 0.9, ease: ease.pop });
  tl.hold(79.1, 0.6);

  // — Beat 13 · close —
  tl.caption({
    at: 79.7,
    dur: 5.8,
    text: 'Marked, glued up wide, mortised in one setting and proved square at every step. Four builds, one shelf, and every one of them the same idea: decide the order before you start.',
  });
  tl.tween(dimAll, 0.13, { at: 80.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 81.2, dur: 0.9, ease: ease.enter });
  tl.hold(85.5, 1.6);

  return {
    tl, cam, frameU, rackU, diagU, squareU, orderU, frameDim, topU, wrongU, tearU,
    rightU, dentU, ironU, sandU, buttonU, moveU, markU, dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const frameU = s.get(scene.frameU);
  const rackU = s.get(scene.rackU);
  const diagU = s.get(scene.diagU);
  const squareU = s.get(scene.squareU);
  const orderU = s.get(scene.orderU);
  const frameDim = s.get(scene.frameDim);
  const topU = s.get(scene.topU);
  const wrongU = s.get(scene.wrongU);
  const tearU = s.get(scene.tearU);
  const rightU = s.get(scene.rightU);
  const dentU = s.get(scene.dentU);
  const ironU = s.get(scene.ironU);
  const sandU = s.get(scene.sandU);
  const buttonU = s.get(scene.buttonU);
  const moveU = s.get(scene.moveU);
  const markU = s.get(scene.markU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  // the frame, sheared then pulled square
  const shear = clamp01(rackU - squareU) * SHEAR;
  const corner = (u: number, v: number) => ({
    x: FR.x + u * FR.w + (1 - v) * shear,
    y: FR.y + v * FR.h,
  });
  const dLen = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y) * (18 / FR.w); // the frame is ~18 in across
  const dA = dLen(corner(0, 0), corner(1, 1));
  const dB = dLen(corner(1, 0), corner(0, 1));
  const isSquare = Math.abs(dA - dB) < 0.06;

  // the dent: crushed, then steamed back up
  const dentDepth = dentU * (1 - ironU) * 16;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the side frame ================= */}
        <g opacity={frameU * frameDim * dimAll}>
          {(() => {
            const p = [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)];
            const thick = 26;
            return (
              <>
                {/* four members drawn as thick strokes along the frame outline */}
                {[[0, 1], [1, 2], [2, 3], [3, 0]].map(([a, b], i) => (
                  <line
                    key={i}
                    x1={p[a].x}
                    y1={p[a].y}
                    x2={p[b].x}
                    y2={p[b].y}
                    stroke={i % 2 === 0 ? OAK_LIT : OAK}
                    strokeWidth={thick}
                    strokeLinecap="square"
                  />
                ))}
                <text x={FR.x + FR.w / 2 + shear / 2} y={FR.y - 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  side frame — two legs, upper and lower apron
                </text>
                {diagU > 0 && (
                  <g opacity={diagU}>
                    <line x1={p[0].x} y1={p[0].y} x2={p[2].x} y2={p[2].y} stroke={colors.ACCENT} strokeWidth={2} />
                    <line x1={p[1].x} y1={p[1].y} x2={p[3].x} y2={p[3].y} stroke={colors.SECONDARY} strokeWidth={2} />
                    <text x={FR.x - 12} y={FR.y + FR.h + 34} textAnchor="start" fill={colors.ACCENT} fontSize={14} fontFamily="monospace">
                      {dA.toFixed(2)} in
                    </text>
                    <text x={FR.x + FR.w + 12} y={FR.y + FR.h + 34} textAnchor="end" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
                      {dB.toFixed(2)} in
                    </text>
                    <text
                      x={FR.x + FR.w / 2}
                      y={FR.y + FR.h + 34}
                      textAnchor="middle"
                      fill={isSquare ? colors.POSITIVE : colors.NEGATIVE}
                      fontSize={15}
                      fontWeight={700}
                    >
                      {isSquare ? '= square' : '≠'}
                    </text>
                  </g>
                )}
              </>
            );
          })()}

          {/* the assembly order */}
          {orderU > 0 && (
            <g opacity={orderU}>
              {['side frames', 'compartments', 'final glue-up'].map((label, i) => {
                const u = clamp01(orderU * 3 - i * 0.7);
                if (u <= 0) return null;
                const x = FR.x - 10 + i * 190;
                const y = FR.y + FR.h + 84;
                return (
                  <g key={label} opacity={u}>
                    <rect x={x} y={y} width={158} height={44} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} />
                    <text x={x + 79} y={y + 28} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                      {label}
                    </text>
                    {i < 2 && (
                      <polygon points={`${x + 168},${y + 22} ${x + 182},${y + 15} ${x + 182},${y + 29}`} fill={colors.POSITIVE} />
                    )}
                  </g>
                );
              })}
              <text x={FR.x + 270} y={FR.y + FR.h + 152} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
                square at every step, not at the end
              </text>
            </g>
          )}
        </g>

        {/* ================= the top, from above ================= */}
        <g opacity={topU * dimAll}>
          <rect x={TOP.x} y={TOP.y} width={TOP.w} height={TOP.h} rx={3} fill={OAK_LIT} stroke="#2f2415" strokeWidth={1.4} />
          <text x={TOP.x + TOP.w / 2} y={TOP.y - 18} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            the top, from above — end grain at the left and right
          </text>
          {/* end grain hatching */}
          {[TOP.x, TOP.x + TOP.w - 14].map((x, i) => (
            <g key={i}>
              {Array.from({ length: 9 }, (_, k) => (
                <line key={k} x1={x} y1={TOP.y + 8 + k * 26} x2={x + 14} y2={TOP.y + 20 + k * 26} stroke="#2f2415" strokeWidth={1.4} opacity={0.7} />
              ))}
            </g>
          ))}

          {/* the wrong order: sides first, tear-out at the exit corner */}
          {wrongU > 0 && (
            <g opacity={wrongU}>
              <line x1={TOP.x} y1={TOP.y} x2={TOP.x + TOP.w * wrongU} y2={TOP.y} stroke={colors.SECONDARY} strokeWidth={6} />
              <text x={TOP.x + TOP.w / 2} y={TOP.y - 40} textAnchor="middle" fill={colors.SECONDARY} fontSize={13.5}>
                sides first
              </text>
            </g>
          )}
          {tearU > 0 && (
            <g opacity={tearU}>
              <polygon
                points={`${TOP.x + TOP.w},${TOP.y} ${TOP.x + TOP.w - 26},${TOP.y - 4} ${TOP.x + TOP.w - 8},${TOP.y + 22}`}
                fill={colors.NEGATIVE}
              />
              <text x={TOP.x + TOP.w - 34} y={TOP.y + 48} textAnchor="end" fill={colors.NEGATIVE} fontSize={14} fontWeight={700}>
                blown-out corner
              </text>
            </g>
          )}

          {/* the right order: ends first, then the sides remove the damage */}
          {rightU > 0 && (
            <g>
              {/* ends */}
              {[TOP.x, TOP.x + TOP.w].map((x, i) => (
                <line
                  key={i}
                  x1={x}
                  y1={TOP.y}
                  x2={x}
                  y2={TOP.y + TOP.h * clamp01(rightU * 2)}
                  stroke={colors.WARM}
                  strokeWidth={6}
                />
              ))}
              {/* then the sides */}
              {rightU > 0.5 && (
                <>
                  <line x1={TOP.x} y1={TOP.y} x2={TOP.x + TOP.w * clamp01(rightU * 2 - 1)} y2={TOP.y} stroke={colors.POSITIVE} strokeWidth={6} />
                  <line x1={TOP.x} y1={TOP.y + TOP.h} x2={TOP.x + TOP.w * clamp01(rightU * 2 - 1)} y2={TOP.y + TOP.h} stroke={colors.POSITIVE} strokeWidth={6} />
                </>
              )}
              <text x={TOP.x + TOP.w / 2} y={TOP.y - 40} textAnchor="middle" fill={rightU > 0.6 ? colors.POSITIVE : colors.WARM} fontSize={13.5} fontWeight={600}>
                {rightU > 0.6 ? 'then the sides — cutting the damage away' : 'ends first'}
              </text>
            </g>
          )}

          {/* the dent, and the iron */}
          {dentU > 0 && (
            <g>
              <ellipse
                cx={TOP.x + 150}
                cy={TOP.y + 150}
                rx={26}
                ry={13}
                fill="#3a2c1a"
                opacity={0.35 + 0.5 * (dentDepth / 16)}
              />
              {ironU > 0 && ironU < 1 && (
                <g>
                  <rect x={TOP.x + 118} y={TOP.y + 108} width={64} height={34} rx={6} fill={colors.NEGATIVE} opacity={0.8} />
                  <text x={TOP.x + 150} y={TOP.y + 100} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5}>
                    damp rag + hot iron
                  </text>
                </g>
              )}
              {ironU > 0.9 && (
                <text x={TOP.x + 150} y={TOP.y + 190} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={700}>
                  the fibres swell back up
                </text>
              )}
            </g>
          )}
          {sandU > 0 && (
            <g opacity={sandU < 1 ? 1 : 0.9}>
              {sandU < 1 && (
                <circle cx={TOP.x + 40 + sandU * (TOP.w - 80)} cy={TOP.y + TOP.h / 2} r={24} fill={colors.SECONDARY} opacity={0.75} />
              )}
              <text x={TOP.x + TOP.w / 2} y={TOP.y + TOP.h + 34} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
                final sanding — 220 grit
              </text>
            </g>
          )}

          {/* the maker's mark */}
          {markU > 0 && (
            <g opacity={markU}>
              <circle cx={TOP.x + TOP.w - 60} cy={TOP.y + TOP.h - 50} r={20} fill="none" stroke={colors.WARM} strokeWidth={2.4} />
              <text x={TOP.x + TOP.w - 60} y={TOP.y + TOP.h - 44} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={700}>
                CM
              </text>
              <text x={TOP.x + TOP.w - 60} y={TOP.y + TOP.h - 16} textAnchor="middle" fill={colors.WARM} fontSize={12.5}>
                maker&apos;s mark
              </text>
            </g>
          )}
        </g>

        {/* ================= a button in its slot ================= */}
        {buttonU > 0 && (
          <g opacity={buttonU * dimAll}>
            {/* the apron, in section, with its 10 mm slot */}
            <rect x={BTN.x - 130} y={BTN.y} width={60} height={110} rx={3} fill={OAK} stroke="#2f2415" strokeWidth={1.3} />
            <rect x={BTN.x - 82} y={BTN.y + 26} width={14} height={16} fill={colors.BG} stroke={colors.GRID} />
            <text x={BTN.x - 100} y={BTN.y + 128} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
              apron, in section
            </text>
            {/* the top above */}
            <rect x={BTN.x - 150} y={BTN.y - 34} width={330} height={26} rx={3} fill={OAK_LIT} stroke="#2f2415" strokeWidth={1.3} />
            {/* the button: a rabbeted block whose tongue sits in the slot */}
            {(() => {
              const slide = lerp(0, 12, moveU);
              const bx = BTN.x - 68 + slide * (1 - buttonU * 0) - 0;
              return (
                <g>
                  <rect x={bx} y={BTN.y + 12} width={62} height={30} rx={3} fill={colors.WARM} />
                  <rect x={bx - 16} y={BTN.y + 26} width={18} height={16} fill={colors.WARM} />
                  <circle cx={bx + 30} cy={BTN.y + 6} r={4} fill={colors.ACCENT} />
                  <line x1={bx + 30} y1={BTN.y - 8} x2={bx + 30} y2={BTN.y + 14} stroke={colors.ACCENT} strokeWidth={3} />
                  <text x={bx + 78} y={BTN.y + 34} fill={colors.WARM} fontSize={13}>
                    button — screwed up into the top
                  </text>
                </g>
              );
            })()}
            {moveU > 0.5 && (
              <g opacity={clamp01(moveU * 2 - 1)}>
                <line x1={BTN.x + 40} y1={BTN.y - 50} x2={BTN.x + 96} y2={BTN.y - 50} stroke={colors.POSITIVE} strokeWidth={2.4} />
                <polygon points={`${BTN.x + 100},${BTN.y - 50} ${BTN.x + 88},${BTN.y - 56} ${BTN.x + 88},${BTN.y - 44}`} fill={colors.POSITIVE} />
                <text x={BTN.x + 106} y={BTN.y - 45} fill={colors.POSITIVE} fontSize={13.5}>
                  the top may move with the seasons
                </text>
              </g>
            )}
          </g>
        )}

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={310} y={250} width={660} height={144} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={304} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              equal diagonals · ends before sides · steam before sanding
            </text>
            <text x={640} y={348} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              decide the order before you start
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
