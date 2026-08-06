// Clamp It Before You Glue It
//
// Backing source: Lee Valley, "How to Build a Contemporary Cedar Garden Bench"
// — pre-assemble with clamps first to verify accuracy and visualize the final
// result; sand all pieces before final assembly, because access becomes limited
// afterward; check level frequently during assembly; and allow a full 24-hour
// cure after the final glue-up.
//
// Centerpiece: one sub-assembly — a 48 in rail with an 18 in leg at each end —
// held together by nothing but clamps. A level rides across it, the faces that
// will soon be unreachable light up one by one, and then the clock starts.
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
// The sub-assembly, seen from the side. 1 in = 9.6 px.
// ---------------------------------------------------------------------------

const PXI = 9.6;
const RAIL_IN = 48;
const LEG_IN = 18;
const THICK_IN = 1.5; // a 2x4 laid flat
const WIDE_IN = 3.5;

const CX = 620;
const RAIL_Y = 250;
const RAIL_W = RAIL_IN * PXI;
const RAIL_H = THICK_IN * PXI * 2.2; // drawn a little heavy so it reads
const LEG_W = WIDE_IN * PXI;
const LEG_H = LEG_IN * PXI;
const LEFT = CX - RAIL_W / 2;

const CEDAR = '#a2653a';
const CEDAR_LIT = '#c98a4f';

// The clamps of the dry run: two at the joints, one across the middle.
const CLAMPS = [
  { x: LEFT + LEG_W / 2, y: RAIL_Y + RAIL_H / 2 },
  { x: LEFT + RAIL_W - LEG_W / 2, y: RAIL_Y + RAIL_H / 2 },
  { x: CX, y: RAIL_Y + RAIL_H / 2 },
];

// Faces that disappear once the stack closes up.
const HIDDEN = [
  { x: LEFT + LEG_W, y: RAIL_Y + RAIL_H, w: 10, h: LEG_H - RAIL_H, label: 'inside of the leg' },
  { x: LEFT + RAIL_W - LEG_W - 10, y: RAIL_Y + RAIL_H, w: 10, h: LEG_H - RAIL_H, label: '' },
  { x: LEFT, y: RAIL_Y + RAIL_H - 8, w: RAIL_W, h: 8, label: 'underside of the rail' },
];

const CAM_WIDE: CameraState = { x: 620, y: 336, k: 1.0 };
const CAM_JOINT: CameraState = { x: LEFT + 70, y: 300, k: 1.7 };
const CAM_LEVEL: CameraState = { x: 620, y: 250, k: 1.35 };
const CAM_FACES: CameraState = { x: 620, y: 340, k: 1.15 };
const CAM_CLOCK: CameraState = { x: 700, y: 350, k: 1.05 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  partsU: ChannelRef<number>;
  clampU: ChannelRef<number>;
  errU: ChannelRef<number>;
  fixU: ChannelRef<number>;
  levelU: ChannelRef<number>;
  bubbleU: ChannelRef<number>;
  facesU: ChannelRef<number>;
  sandU: ChannelRef<number>;
  glueU: ChannelRef<number>;
  screwU: ChannelRef<number>;
  clockU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const partsU = tl.channel('partsU', 0);
  const clampU = tl.channel('clampU', 0);
  const errU = tl.channel('errU', 0);
  const fixU = tl.channel('fixU', 0);
  const levelU = tl.channel('levelU', 0);
  const bubbleU = tl.channel('bubbleU', 0);
  const facesU = tl.channel('facesU', 0);
  const sandU = tl.channel('sandU', 0);
  const glueU = tl.channel('glueU', 0);
  const screwU = tl.channel('screwU', 0);
  const clockU = tl.channel('clockU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the sub-assembly —
  tl.caption({
    at: 0.5,
    dur: 6.35,
    text: 'Start with the smallest piece of the bench that means anything: one forty-eight inch length, with an eighteen inch leg standing under each end.',
  });
  tl.tween(partsU, 1, { at: 0.7, dur: 1.6, ease: ease.enter });
  tl.hold(6.3, 0.6);

  // — Beat 2 · clamps only —
  tl.caption({
    at: 6.9,
    dur: 6.95,
    text: 'And build it with clamps and nothing else first. No glue, no screws. A dry assembly costs you ten minutes and it is the only chance you get to look at the real thing before it is permanent.',
  });
  tl.tween(clampU, 1, { at: 7.2, dur: 1.6, ease: ease.pop });
  tl.hold(13.3, 0.6);

  // — Beat 3 · what the dry run catches —
  tl.caption({
    at: 13.9,
    dur: 6.75,
    text: 'This is where you find the piece that is an eighth of an inch proud, or the leg that is on backwards. In a clamped assembly that is a shrug. In a glued one it is a new board.',
  });
  tl.tween(cam, CAM_JOINT, { at: 14.1, dur: 1.5, ease: ease.move });
  tl.tween(errU, 1, { at: 15.2, dur: 0.8, ease: ease.enter });
  tl.tween(fixU, 1, { at: 17.6, dur: 1.2, ease: ease.move });
  tl.hold(20.1, 0.6);

  // — Beat 4 · level, and keep checking —
  tl.caption({
    at: 20.7,
    dur: 6.75,
    text: 'Then the level goes on, and it keeps going on. A bench that is out of level does not look wrong from across the garden — you find out when a glass of wine slides toward one end of it.',
  });
  tl.tween(cam, CAM_LEVEL, { at: 20.9, dur: 1.5, ease: ease.move });
  tl.tween(levelU, 1, { at: 21.8, dur: 0.9, ease: ease.enter });
  tl.tween(bubbleU, 1, { at: 23.2, dur: 1.8, ease: ease.move });
  tl.hold(26.9, 0.6);

  // — Beat 5 · the faces you will never reach again —
  tl.caption({
    at: 27.5,
    dur: 7.15,
    text: 'While it is still apart, look at which surfaces are about to vanish. The inside of every leg, the underside of every rail — once this stack closes up, no sander will ever reach them again.',
  });
  tl.tween(cam, CAM_FACES, { at: 27.7, dur: 1.6, ease: ease.move });
  tl.tween(facesU, 1, { at: 28.6, dur: 2.0, ease: ease.enter });
  tl.hold(34.1, 0.6);

  // — Beat 6 · so sand first —
  tl.caption({
    at: 34.7,
    dur: 6.55,
    text: 'So every piece gets sanded before final assembly, not after. It feels backwards to sand parts that are still loose on the bench, and it is the difference between a bench that is smooth and one that is only smooth on top.',
  });
  tl.tween(sandU, 1, { at: 35.2, dur: 2.6, ease: ease.linear });
  tl.hold(40.7, 0.6);

  // — Beat 7 · now the glue —
  tl.caption({
    at: 41.3,
    dur: 6.75,
    text: 'Only now does anything become permanent. Wood glue on the joint, clamps back on in the same places, and two inch pressure-treated screws through the first layer to hold it while the glue does the real work.',
  });
  tl.tween(cam, CAM_WIDE, { at: 41.5, dur: 1.6, ease: ease.move });
  tl.tween(glueU, 1, { at: 42.4, dur: 1.4, ease: ease.draw });
  tl.tween(screwU, 1, { at: 44.2, dur: 1.2, ease: ease.pop });
  tl.hold(47.5, 0.6);

  // — Beat 8 · the twenty-four hours —
  tl.caption({
    at: 48.1,
    dur: 6.95,
    text: 'And then the least popular instruction in woodworking: leave the clamps on for a full twenty-four hours. Glue that is dry to the touch in an hour is nowhere near strong yet, and this bench is going to live outdoors.',
  });
  tl.tween(cam, CAM_CLOCK, { at: 48.3, dur: 1.5, ease: ease.move });
  tl.tween(clockU, 1, { at: 49.2, dur: 3.0, ease: ease.linear });
  tl.hold(54.5, 0.6);

  // — Beat 9 · close —
  tl.caption({
    at: 55.1,
    dur: 5.6,
    text: 'Dry run, level, sand, glue, wait. With that rhythm established, the bench can start going up one layer at a time.',
  });
  tl.tween(dimAll, 0.13, { at: 55.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.6, dur: 0.9, ease: ease.enter });
  tl.hold(60.7, 1.6);

  return {
    tl, cam, partsU, clampU, errU, fixU, levelU, bubbleU, facesU, sandU, glueU, screwU, clockU, dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Clamp({ x, y, u }: { x: number; y: number; u: number }) {
  if (u <= 0) return null;
  const open = (1 - u) * 26;
  return (
    <g opacity={u}>
      <rect x={x - 13} y={y - RAIL_H / 2 - 16 - open} width={26} height={12} rx={3} fill={colors.SECONDARY} />
      <rect x={x - 13} y={y + RAIL_H / 2 + 4 + open} width={26} height={12} rx={3} fill={colors.SECONDARY} />
      <line x1={x} y1={y - RAIL_H / 2 - 16 - open} x2={x} y2={y + RAIL_H / 2 + 16 + open} stroke={colors.SECONDARY} strokeWidth={3} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const partsU = s.get(scene.partsU);
  const clampU = s.get(scene.clampU);
  const errU = s.get(scene.errU);
  const fixU = s.get(scene.fixU);
  const levelU = s.get(scene.levelU);
  const bubbleU = s.get(scene.bubbleU);
  const facesU = s.get(scene.facesU);
  const sandU = s.get(scene.sandU);
  const glueU = s.get(scene.glueU);
  const screwU = s.get(scene.screwU);
  const clockU = s.get(scene.clockU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  // the deliberate error: the left leg sits 1/8 in proud until it is fixed
  const proud = (errU - fixU) * 0.125 * PXI * 6;
  const bubbleX = CX + (1 - bubbleU) * 40;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* legs */}
          {[LEFT, LEFT + RAIL_W - LEG_W].map((x, i) => (
            <rect
              key={i}
              x={x}
              y={RAIL_Y + RAIL_H - (i === 0 ? proud : 0)}
              width={LEG_W}
              height={LEG_H}
              rx={2}
              fill={CEDAR}
              stroke="#3a2515"
              strokeWidth={1.2}
              opacity={clamp01(partsU * 2 - i * 0.3)}
            />
          ))}
          {/* the 48-inch rail */}
          <rect
            x={LEFT}
            y={RAIL_Y}
            width={RAIL_W}
            height={RAIL_H}
            rx={2}
            fill={CEDAR_LIT}
            stroke="#3a2515"
            strokeWidth={1.4}
            opacity={partsU}
          />
          {partsU > 0.5 && (
            <>
              <text x={CX} y={RAIL_Y - 14} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontWeight={700} opacity={partsU}>
                48 in
              </text>
              <text x={LEFT - 16} y={RAIL_Y + RAIL_H + LEG_H / 2} textAnchor="end" fill={colors.SECONDARY} fontSize={14} fontWeight={700} opacity={partsU}>
                18 in
              </text>
            </>
          )}

          {/* the dry-run clamps */}
          {CLAMPS.map((c, i) => (
            <Clamp key={i} x={c.x} y={c.y} u={clamp01(clampU * 3 - i * 0.5)} />
          ))}
          {clampU > 0.7 && glueU < 0.2 && (
            <text x={CX} y={RAIL_Y + RAIL_H + LEG_H + 42} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} opacity={clamp01(clampU * 2 - 1.4)}>
              dry assembly — clamps only, no glue
            </text>
          )}

          {/* the caught error */}
          {errU > 0 && fixU < 1 && (
            <g opacity={errU * (1 - fixU)}>
              <line x1={LEFT - 30} y1={RAIL_Y + RAIL_H} x2={LEFT - 30} y2={RAIL_Y + RAIL_H - proud} stroke={colors.NEGATIVE} strokeWidth={2.4} />
              <text x={LEFT - 38} y={RAIL_Y + RAIL_H + 6} textAnchor="end" fill={colors.NEGATIVE} fontSize={13.5} fontWeight={700}>
                ⅛ in proud
              </text>
            </g>
          )}
          {fixU > 0.6 && (
            <text x={LEFT + LEG_W / 2} y={RAIL_Y + RAIL_H + LEG_H + 28} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={700} opacity={clamp01(fixU * 3 - 1.8)}>
              caught while it is still free
            </text>
          )}

          {/* the level */}
          {levelU > 0 && (
            <g opacity={levelU}>
              <rect x={CX - 110} y={RAIL_Y - 34} width={220} height={22} rx={4} fill={colors.PANEL} stroke={colors.ACCENT} />
              <circle cx={bubbleX} cy={RAIL_Y - 23} r={6} fill={bubbleU > 0.9 ? colors.POSITIVE : colors.WARM} />
              <line x1={CX - 12} y1={RAIL_Y - 34} x2={CX - 12} y2={RAIL_Y - 12} stroke={colors.GRID} />
              <line x1={CX + 12} y1={RAIL_Y - 34} x2={CX + 12} y2={RAIL_Y - 12} stroke={colors.GRID} />
            </g>
          )}

          {/* the surfaces about to disappear */}
          {facesU > 0 &&
            HIDDEN.map((h, i) => {
              const u = clamp01(facesU * 3 - i * 0.6);
              if (u <= 0) return null;
              return (
                <g key={i} opacity={u}>
                  <rect x={h.x} y={h.y} width={h.w} height={h.h} fill={colors.NEGATIVE} opacity={0.45 * (1 - sandU * 0.75)} />
                  {h.label && (
                    <text x={h.x + h.w + 12} y={h.y + h.h / 2} fill={colors.NEGATIVE} fontSize={13} opacity={1 - sandU * 0.6}>
                      {h.label}
                    </text>
                  )}
                </g>
              );
            })}
          {facesU > 0.8 && (
            <text x={CX} y={RAIL_Y + RAIL_H + LEG_H + 66} textAnchor="middle" fill={sandU > 0.6 ? colors.POSITIVE : colors.NEGATIVE} fontSize={14} fontWeight={700}>
              {sandU > 0.6 ? 'sanded while you can still reach them' : 'unreachable once assembled'}
            </text>
          )}
          {/* the sanding pass */}
          {sandU > 0 && sandU < 1 && (
            <rect x={LEFT + sandU * (RAIL_W - 60)} y={RAIL_Y + RAIL_H + 6} width={60} height={26} rx={5} fill={colors.SECONDARY} opacity={0.85} />
          )}

          {/* glue lines and screws */}
          {glueU > 0 &&
            [LEFT + LEG_W / 2, LEFT + RAIL_W - LEG_W / 2].map((x, i) => (
              <rect
                key={i}
                x={x - LEG_W / 2}
                y={RAIL_Y + RAIL_H - 3}
                width={LEG_W * glueU}
                height={4}
                fill={colors.POSITIVE}
                opacity={0.9}
              />
            ))}
          {screwU > 0 && (
            <g opacity={screwU}>
              {[LEFT + LEG_W / 2, LEFT + RAIL_W - LEG_W / 2].map((x, i) => (
                <circle key={i} cx={x} cy={RAIL_Y + RAIL_H / 2} r={5} fill={colors.ACCENT} stroke={colors.BG} />
              ))}
              <text x={CX} y={RAIL_Y + RAIL_H + LEG_H + 42} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5}>
                glue, clamps, and 2 in pressure-treated screws
              </text>
            </g>
          )}

          {/* the 24-hour cure */}
          {clockU > 0 && (
            <g opacity={clockU}>
              {(() => {
                const cx = 1000;
                const cy = 330;
                const r = 62;
                const a = -Math.PI / 2 + clockU * Math.PI * 2;
                const large = clockU > 0.5 ? 1 : 0;
                return (
                  <>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.GRID} strokeWidth={6} />
                    <path
                      d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`}
                      fill="none"
                      stroke={colors.WARM}
                      strokeWidth={6}
                      strokeLinecap="round"
                    />
                    <text x={cx} y={cy + 7} textAnchor="middle" fill={colors.WARM} fontSize={26} fontWeight={700}>
                      {Math.round(lerp(0, 24, clockU))}h
                    </text>
                    <text x={cx} y={cy + r + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                      clamps stay on
                    </text>
                  </>
                );
              })()}
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={318} y={268} width={644} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={322} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              dry run · level · sand · glue · wait
            </text>
            <text x={640} y={364} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              every mistake is cheap before the glue
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
