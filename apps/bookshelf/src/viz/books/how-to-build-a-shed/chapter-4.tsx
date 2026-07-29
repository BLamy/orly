// Built Flat, Pulled Square
//
// Backing source: "Build a Simple Shed: a Complete Guide" (Instructables,
// seamster, steps 11–15 + 17): walls framed with 2x4 studs on 24-in centers,
// built lying flat on the floor platform ("a large, perfectly-sized work
// table"); end walls the full 8 ft wide; wall height + platform height must
// equal the 8-ft siding panel (paper says 6 1/4 in of platform, the tape says
// 6 3/8 — go with real life); side walls 3 1/2 in short on each end, panels
// left full width to wrap the corners; factory-square panels nailed on to
// pull the frames square; panels overhang the bottom to cover the floor
// frame; a ReStore window framed in; the door panel left uncut (the wall is
// too weak without it); five roof trusses at the magic number 22.5°, laid
// out 24 in apart.
//
// Centerpiece: the racked-parallelogram side wall snapping true the moment a
// factory-square panel is nailed on — plus a protractor beat for 22.5°.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
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
// Wall elevations: inches in, pixels out. Everything is built lying on the
// platform, so the "table" is a slab at the bottom of the stage.
// ---------------------------------------------------------------------------

const IN = 3.75; // px per inch
const WX0 = 210;
const WBOT = 548; // bottom plate line
const wx = (xin: number): number => WX0 + xin * IN;
const wy = (yin: number): number => WBOT - yin * IN;

const EAVE = 68; // side-wall height, in
const RISE = 48 * Math.tan(Math.PI / 8); // 22.5° over the 48-in half span ≈ 19.9
const PEAK = EAVE + RISE;
const PLY = 1.5 * IN * 1.5; // a 2x4 plate/stud on edge, slightly exaggerated

// gable line height at position x (end wall)
const gable = (xin: number): number => EAVE + RISE - Math.abs(xin - 48) * Math.tan(Math.PI / 8);

const STUDS = [24, 48, 72];
const SHEAR_PX = 46; // how far the side wall racks before the panel arrives

// number-line: the 8-ft panel = wall + platform
const NL = { x: 700, w: 34 } as const;
const PLATFORM_IN = 6.375;

const CAM_TABLE: CameraState = { x: 470, y: 390, k: 1.22 };
const CAM_HEIGHT: CameraState = { x: 680, y: 380, k: 1.3 };
const CAM_CORNER: CameraState = { x: 960, y: 260, k: 1.3 };
const CAM_TRUSS: CameraState = { x: 640, y: 350, k: 1.16 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tableU: ChannelRef<number>;
  endU: ChannelRef<number>;
  studU: ChannelRef<number>;
  dim24U: ChannelRef<number>;
  heightU: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  cornerU: ChannelRef<number>;
  rackU: ChannelRef<number>;
  trueU: ChannelRef<number>;
  panelU: ChannelRef<number>;
  skirtU: ChannelRef<number>;
  openU: ChannelRef<number>;
  wallsDim: ChannelRef<number>;
  trussU: ChannelRef<number>;
  protU: ChannelRef<number>;
  fiveU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TABLE, cameraInterp);
  const tableU = tl.channel('tableU', 0);
  const endU = tl.channel('endU', 0);
  const studU = tl.channel('studU', 0);
  const dim24U = tl.channel('dim24U', 0);
  const heightU = tl.channel('heightU', 0);
  const tapeU = tl.channel('tapeU', 0);
  const endDim = tl.channel('endDim', 1);
  const cornerU = tl.channel('cornerU', 0);
  const rackU = tl.channel('rackU', 0);
  const trueU = tl.channel('trueU', 0);
  const panelU = tl.channel('panelU', 0);
  const skirtU = tl.channel('skirtU', 0);
  const openU = tl.channel('openU', 0);
  const wallsDim = tl.channel('wallsDim', 1);
  const trussU = tl.channel('trussU', 0);
  const protU = tl.channel('protU', 0);
  const fiveU = tl.channel('fiveU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the work table —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'With the platform finished, the cleverest habit in this build begins: every wall is framed lying flat on the floor, which doubles as a perfectly sized, perfectly square work table.',
  });
  tl.tween(tableU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.hold(6.5, 0.5);

  // — Beat 2 · end walls first —
  tl.caption({
    at: 7.0,
    dur: 6.4,
    text: 'The two peaked end walls come first — the full eight feet wide, with two-by-four studs landing every twenty-four inches. That spacing is plenty for a shed wall.',
  });
  tl.tween(endU, 1, { at: 7.4, dur: 2.2, ease: ease.draw });
  tl.tween(studU, 1, { at: 9.8, dur: 2.0, ease: ease.move });
  tl.tween(dim24U, 1, { at: 12.0, dur: 0.7, ease: ease.enter });
  tl.hold(13.9, 0.5);

  // — Beat 3 · the siding decides the height —
  tl.caption({
    at: 14.4,
    dur: 6.8,
    text: 'Height is decided by the siding. Each panel is eight feet tall and must cover the wall and the platform edge together — so wall height plus platform height has to equal exactly eight feet.',
  });
  tl.tween(cam, CAM_HEIGHT, { at: 14.6, dur: 1.5, ease: ease.move });
  tl.tween(heightU, 1, { at: 15.4, dur: 1.8, ease: ease.draw });
  tl.hold(21.7, 0.5);

  // — Beat 4 · trust the tape —
  tl.caption({
    at: 22.2,
    dur: 6.6,
    text: 'On paper, the platform stands six and a quarter inches tall. The tape measure says six and three eighths. When paper and tape disagree, the tape is telling the truth — always cut to reality.',
  });
  tl.tween(tapeU, 1, { at: 22.8, dur: 1.0, ease: ease.enter });
  tl.hold(29.3, 0.5);

  // — Beat 5 · side walls tuck between —
  tl.caption({
    at: 29.8,
    dur: 6.8,
    text: 'The side walls are framed three and a half inches short on each end, so they tuck between the peaked walls. Their panels stay the full eight feet wide, wrapping the corner to hide the end frames.',
  });
  tl.tween(cam, CAM_CORNER, { at: 30.0, dur: 1.5, ease: ease.move });
  tl.tween(cornerU, 1, { at: 30.7, dur: 1.6, ease: ease.draw });
  tl.hold(37.1, 0.5);

  // — Beat 6 · the squaring trick —
  tl.caption({
    at: 37.6,
    dur: 7.0,
    text: 'Now the trick that makes it all work: a bare frame can rack into a parallelogram, but a factory-cut panel is perfectly square. Nail the panel on, and it pulls the whole frame true.',
  });
  tl.tween(cam, CAM_TABLE, { at: 37.8, dur: 1.5, ease: ease.move });
  tl.tween(endDim, 0.15, { at: 37.8, dur: 1.2, ease: ease.move });
  tl.tween(cornerU, 0, { at: 37.8, dur: 1.0, ease: ease.move });
  tl.tween(rackU, 1, { at: 38.4, dur: 1.2, ease: ease.move });
  tl.tween(panelU, 1, { at: 40.6, dur: 1.6, ease: ease.move });
  tl.tween(trueU, 1, { at: 42.4, dur: 1.4, ease: ease.move });
  tl.hold(45.1, 0.5);

  // — Beat 7 · the skirt —
  tl.caption({
    at: 45.6,
    dur: 5.6,
    text: 'Each panel also hangs a touch low, so its bottom edge skirts past the floor frame once the wall stands up — siding and weather seal in one move.',
  });
  tl.tween(skirtU, 1, { at: 46.2, dur: 1.2, ease: ease.move });
  tl.hold(51.7, 0.5);

  // — Beat 8 · window and door —
  tl.caption({
    at: 52.2,
    dur: 7.0,
    text: 'One side wall gets a secondhand window, framed in with a header and sill. The door opening is framed too — but its panel stays uncut for now. Without it, the wall would be too floppy to lift.',
  });
  tl.tween(openU, 1, { at: 52.8, dur: 1.8, ease: ease.move });
  tl.hold(59.7, 0.5);

  // — Beat 9 · the magic number —
  tl.caption({
    at: 60.2,
    dur: 7.0,
    text: 'The work table has one product left: roof trusses, and the magic number — twenty-two and a half degrees. Cut a piece at that angle, and its mating piece is cut at the same angle. Every joint repeats it.',
  });
  tl.tween(cam, CAM_TRUSS, { at: 60.4, dur: 1.5, ease: ease.move });
  tl.tween(wallsDim, 0.12, { at: 60.4, dur: 1.2, ease: ease.move });
  tl.tween(trussU, 1, { at: 61.2, dur: 1.8, ease: ease.draw });
  tl.tween(protU, 1, { at: 63.4, dur: 1.4, ease: ease.draw });
  tl.hold(67.7, 0.5);

  // — Beat 10 · five to a template —
  tl.caption({
    at: 68.2,
    dur: 5.4,
    text: 'Five trusses are built to one identical template, destined to stand every twenty-four inches along the roof.',
  });
  tl.tween(fiveU, 1, { at: 68.7, dur: 2.2, ease: ease.move });
  tl.hold(73.1, 0.5);

  // — Beat 11 · flat pack complete —
  tl.caption({
    at: 73.6,
    dur: 6.2,
    text: 'And with that, the flat pack is complete: four square walls and five identical trusses, all born on the floor they are about to stand on. Next, this pile becomes a building in an afternoon.',
  });
  tl.tween(dimAll, 0.15, { at: 74.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 75.4, dur: 0.9, ease: ease.enter });
  tl.hold(79.8, 1.6);

  return {
    tl,
    cam,
    tableU,
    endU,
    studU,
    dim24U,
    heightU,
    tapeU,
    endDim,
    cornerU,
    rackU,
    trueU,
    panelU,
    skirtU,
    openU,
    wallsDim,
    trussU,
    protU,
    fiveU,
    dimAll,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const FRAME = '#d9b87c'; // bare framing lumber
const PANEL_C = colors.SECONDARY;

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tableU = s.get(scene.tableU);
  const endU = s.get(scene.endU);
  const studU = s.get(scene.studU);
  const dim24U = s.get(scene.dim24U);
  const heightU = s.get(scene.heightU);
  const tapeU = s.get(scene.tapeU);
  const endDim = s.get(scene.endDim);
  const cornerU = s.get(scene.cornerU);
  const rackU = s.get(scene.rackU);
  const trueU = s.get(scene.trueU);
  const panelU = s.get(scene.panelU);
  const skirtU = s.get(scene.skirtU);
  const openU = s.get(scene.openU);
  const wallsDim = s.get(scene.wallsDim);
  const trussU = s.get(scene.trussU);
  const protU = s.get(scene.protU);
  const fiveU = s.get(scene.fiveU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  // side wall: sheared by rack, restored by true
  const shear = SHEAR_PX * rackU * (1 - trueU);
  const sk = (xin: number, yin: number): { x: number; y: number } => ({
    x: wx(xin) + (yin / EAVE) * shear,
    y: wy(yin),
  });
  const sideVisible = rackU > 0;
  const panelDrop = (1 - panelU) * 130;

  // truss geometry (drawn over a quiet stage)
  const TX = 640;
  const TY = 350;
  const HALF = 210;
  const T_RISE = HALF * Math.tan(Math.PI / 8);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the platform / work table ---- */}
          <g opacity={tableU * wallsDim}>
            <rect x={wx(-4)} y={WBOT + 10} width={104 * IN} height={PLATFORM_IN * IN * 2} rx={3} fill={colors.SECONDARY} opacity={0.25} stroke={colors.SECONDARY} strokeWidth={1} />
            <text x={wx(48)} y={WBOT + 42} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
              the platform — now a work table
            </text>
          </g>

          {/* ---- end wall elevation ---- */}
          <g opacity={endU * endDim * wallsDim}>
            {/* plates + gable outline */}
            <path
              d={`M ${wx(0)} ${wy(0)} L ${wx(96)} ${wy(0)} L ${wx(96)} ${wy(EAVE)} L ${wx(48)} ${wy(PEAK)} L ${wx(0)} ${wy(EAVE)} Z`}
              fill="none"
              stroke={FRAME}
              strokeWidth={PLY}
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - endU}
              opacity={0.9}
            />
            {/* studs on 24-in centers */}
            {STUDS.map((sx, i) => {
              const u = clamp01(studU * 3 - i * 0.6);
              if (u <= 0) return null;
              return (
                <line
                  key={sx}
                  x1={wx(sx)}
                  y1={wy(1.5)}
                  x2={wx(sx)}
                  y2={wy(gable(sx) * u)}
                  stroke={FRAME}
                  strokeWidth={PLY * 0.85}
                  opacity={0.85}
                />
              );
            })}
            {/* 24-in dimension */}
            <g opacity={dim24U}>
              <line x1={wx(24)} y1={wy(-4)} x2={wx(48)} y2={wy(-4)} stroke={colors.ACCENT} strokeWidth={1.4} />
              <text x={wx(36)} y={wy(-8)} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5}>
                24 in o.c.
              </text>
              <text x={wx(48)} y={wy(PEAK) - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                end wall — full 8 ft wide
              </text>
            </g>
          </g>

          {/* ---- height number line: panel = wall + platform ---- */}
          <g opacity={heightU * wallsDim}>
            <rect x={NL.x} y={wy(96 - PLATFORM_IN)} width={NL.w} height={(96 - PLATFORM_IN) * IN} fill={colors.ACCENT} opacity={0.3} stroke={colors.ACCENT} />
            <rect x={NL.x} y={wy(0)} width={NL.w} height={PLATFORM_IN * IN} fill={colors.POSITIVE} opacity={0.45} stroke={colors.POSITIVE} />
            <line x1={NL.x + NL.w + 12} y1={wy(96 - PLATFORM_IN)} x2={NL.x + NL.w + 12} y2={wy(-PLATFORM_IN) - PLATFORM_IN * IN} stroke={colors.TEXT} strokeWidth={1.2} opacity={0} />
            <text x={NL.x + NL.w + 14} y={wy(45)} fill={colors.ACCENT} fontSize={12.5}>
              wall
            </text>
            <text x={NL.x + NL.w + 14} y={wy(0) + PLATFORM_IN * IN / 2 + 4} fill={colors.POSITIVE} fontSize={12.5}>
              platform
            </text>
            <text x={NL.x + NL.w / 2} y={wy(96 - PLATFORM_IN) - 12} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={600}>
              one 8-ft panel covers both
            </text>
          </g>
          {/* paper vs tape */}
          <g opacity={tapeU * wallsDim}>
            <rect x={780} y={430} width={224 * 1.0} height={92} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={800} y={460} fill={colors.MUTED} fontSize={13}>
              paper: 6 1/4 in
            </text>
            <line x1={798} y1={456} x2={902} y2={456} stroke={colors.NEGATIVE} strokeWidth={1.6} opacity={0.9} />
            <text x={800} y={488} fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
              tape: 6 3/8 in ✓
            </text>
            <text x={800} y={508} fill={colors.MUTED} fontSize={11}>
              build to the tape
            </text>
          </g>

          {/* ---- corner detail, from above ---- */}
          <g opacity={cornerU * wallsDim}>
            <rect x={840} y={130} width={360 * 1.0} height={250} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={862} y={162} fill={colors.TEXT} fontSize={13.5}>
              one corner, from above
            </text>
            {/* end wall frame runs full width */}
            <rect x={880} y={200} width={220} height={22} fill={FRAME} opacity={0.85} />
            <text x={1108} y={215} fill={colors.MUTED} fontSize={11.5}>
              end wall frame
            </text>
            {/* side wall frame tucks behind, 3.5 in back */}
            <rect x={880} y={222} width={22} height={110} fill={FRAME} opacity={0.65} />
            <text x={910} y={295} fill={colors.MUTED} fontSize={11.5}>
              side wall — held back 3 1/2 in
            </text>
            {/* side panel wraps the corner */}
            <rect x={862} y={196} width={10} height={150} fill={PANEL_C} opacity={0.8} />
            <rect x={862} y={186} width={248} height={10} fill={PANEL_C} opacity={0.45} />
            <text x={862} y={366} fill={PANEL_C} fontSize={11.5}>
              panels stay full width — the corner disappears
            </text>
          </g>

          {/* ---- the racked side wall + factory-square panel ---- */}
          {sideVisible && (
            <g opacity={rackU * wallsDim}>
              {/* frame outline (sheared) */}
              <polygon
                points={[sk(0, 0), sk(89, 0), sk(89, EAVE), sk(0, EAVE)]
                  .map((p) => `${p.x},${p.y}`)
                  .join(' ')}
                fill="none"
                stroke={FRAME}
                strokeWidth={PLY}
                strokeLinejoin="round"
                opacity={0.9}
              />
              {[22, 44.5, 67].map((sx) => (
                <line key={sx} x1={sk(sx, 1.5).x} y1={sk(sx, 1.5).y} x2={sk(sx, EAVE - 1.5).x} y2={sk(sx, EAVE - 1.5).y} stroke={FRAME} strokeWidth={PLY * 0.85} opacity={0.85} />
              ))}
              {/* rack angle callout */}
              {trueU < 0.6 && rackU > 0.5 && (
                <text x={sk(44, EAVE + 6).x} y={sk(44, EAVE + 6).y} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} opacity={(1 - trueU) * rackU}>
                  racked — not square
                </text>
              )}
              {/* the factory-square panel descends */}
              {panelU > 0 && (
                <g opacity={Math.min(1, panelU * 1.4)}>
                  <rect
                    x={wx(-3.5)}
                    y={wy(EAVE) - panelDrop - skirtU * PLATFORM_IN * IN}
                    width={96 * IN}
                    height={96 * IN * 0.72}
                    fill={PANEL_C}
                    opacity={0.3}
                    stroke={PANEL_C}
                    strokeWidth={2}
                  />
                  <text x={wx(44.5)} y={wy(EAVE) - panelDrop - 12} textAnchor="middle" fill={PANEL_C} fontSize={12.5}>
                    factory-cut panel — perfectly square
                  </text>
                </g>
              )}
              {trueU > 0.5 && (
                <text x={sk(44, EAVE + 6).x} y={sk(44, EAVE + 6).y - 20} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={700} opacity={trueU}>
                  pulled true
                </text>
              )}
              {/* skirt label */}
              {skirtU > 0.3 && (
                <text x={wx(100)} y={WBOT + 24} fill={PANEL_C} fontSize={12} opacity={skirtU}>
                  panel skirts the floor frame
                </text>
              )}
              {/* window + door openings once the wall is true */}
              {openU > 0 && (
                <g opacity={openU * trueU}>
                  <rect x={wx(10)} y={wy(52)} width={16 * IN} height={20 * IN} fill={colors.BG} opacity={0.85} stroke={colors.ACCENT} strokeWidth={1.6} />
                  <text x={wx(18)} y={wy(56)} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5}>
                    window
                  </text>
                  <rect x={wx(56)} y={wy(0) - 2} width={26 * IN} height={-(wy(0) - wy(58)) * 0 + (wy(0) - wy(58))} fill="none" stroke={colors.WARM} strokeWidth={1.6} strokeDasharray="6 5" transform={`translate(0, ${wy(58) - wy(0) + 2})`} />
                  <g>
                    <text x={wx(69)} y={wy(50)} textAnchor="middle" fill={colors.WARM} fontSize={11.5}>
                      door — framed
                    </text>
                    <text x={wx(69)} y={wy(44)} textAnchor="middle" fill={colors.WARM} fontSize={11} opacity={0.9}>
                      panel stays on for stiffness
                    </text>
                  </g>
                </g>
              )}
            </g>
          )}

          {/* ---- the 22.5° truss ---- */}
          {trussU > 0 && (
            <g opacity={trussU}>
              <rect x={TX - HALF - 70} y={TY - T_RISE - 90} width={(HALF + 70) * 2} height={T_RISE + 200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
              {/* bottom chord */}
              <line x1={TX - HALF} y1={TY + 40} x2={TX - HALF + 2 * HALF * clamp01(trussU * 1.4)} y2={TY + 40} stroke={FRAME} strokeWidth={9} strokeLinecap="round" />
              {/* rafters at 22.5° */}
              <line x1={TX - HALF} y1={TY + 40} x2={TX - HALF + HALF * clamp01(trussU * 1.4 - 0.2)} y2={TY + 40 - T_RISE * clamp01(trussU * 1.4 - 0.2)} stroke={FRAME} strokeWidth={9} strokeLinecap="round" />
              <line x1={TX + HALF} y1={TY + 40} x2={TX + HALF - HALF * clamp01(trussU * 1.4 - 0.35)} y2={TY + 40 - T_RISE * clamp01(trussU * 1.4 - 0.35)} stroke={FRAME} strokeWidth={9} strokeLinecap="round" />
              {/* protractor arc at the left heel */}
              {protU > 0 && (
                <g opacity={protU}>
                  <path
                    d={`M ${TX - HALF + 84} ${TY + 40} A 84 84 0 0 0 ${TX - HALF + 84 * Math.cos(Math.PI / 8)} ${TY + 40 - 84 * Math.sin(Math.PI / 8)}`}
                    fill="none"
                    stroke={colors.ACCENT}
                    strokeWidth={2.2}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - protU}
                  />
                  <MathLabel tex={'22.5^{\\circ}'} x={TX - HALF + 108} y={TY + 14} color={colors.ACCENT} fontSize={19} opacity={protU} />
                  <MathLabel tex={'22.5^{\\circ}'} x={TX + HALF - 148} y={TY + 14} color={colors.ACCENT} fontSize={19} opacity={clamp01(protU * 2 - 1)} />
                  <text x={TX} y={TY - T_RISE - 4} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                    every cut, the same angle — mating pieces match by construction
                  </text>
                </g>
              )}
              {/* five to a template, 24 in apart */}
              {fiveU > 0 && (
                <g opacity={fiveU}>
                  {[0, 1, 2, 3, 4].map((i) => {
                    const u = clamp01(fiveU * 3 - i * 0.45);
                    if (u <= 0) return null;
                    const mx = TX - 176 + i * 88;
                    return (
                      <g key={i} opacity={u}>
                        <path
                          d={`M ${mx - 34} ${TY + 128} L ${mx + 34} ${TY + 128} L ${mx} ${TY + 128 - 34 * Math.tan(Math.PI / 8) * 2}`}
                          fill="none"
                          stroke={FRAME}
                          strokeWidth={4}
                          strokeLinejoin="round"
                        />
                      </g>
                    );
                  })}
                  <line x1={TX - 176} y1={TY + 148} x2={TX - 88} y2={TY + 148} stroke={colors.ACCENT} strokeWidth={1.2} />
                  <text x={TX - 132} y={TY + 164} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5}>
                    24 in
                  </text>
                  <text x={TX + 110} y={TY + 164} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                    five trusses, one template
                  </text>
                </g>
              )}
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={330} y={216} width={620} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              four square walls · five identical trusses
            </text>
            <text x={640} y={314} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              a flat pack, born on its own floor
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
