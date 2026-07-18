// Raising Day
//
// Backing source: "Build a Simple Shed: a Complete Guide" (Instructables,
// seamster, steps 19–31): back wall raised first and fastened with 4-in
// exterior screws down through the floorboards into the frame; side walls
// butted against it, corners screwed from inside, short screws along the
// panel skirts; the last wall held by helpers; the door panel cut free with
// a reciprocating saw and SAVED — it becomes the door; the bottom plate cut
// out of the doorway; remaining trusses screwed to the wall plates inline
// with the studs; two sheets of 7/16" OSB screwed every 8 in plus 7-in
// strips at the lower edges; roofing paper, aluminum drip edge,
// architectural shingles; 2x4 roof trim, caulked window/corner trim; Behr
// "Boston Brick" walls; two vents on the windowless side wall; Rustoleum
// deck paint on the floor, two coats.
//
// Centerpiece: the isometric shed assembling in real order — walls rotate up
// about their bottom edges, the saw traces a door out of its own wall, and
// shingle courses climb to the ridge. The chapter-one clutter finally moves in.
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
import type { ReactNode } from 'react';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// linear hex-color lerp (for the paint going on)
const lerpColor = (a: string, b: string, u: number): string => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => {
    const va = (pa >> sh) & 0xff;
    const vb = (pb >> sh) & 0xff;
    return Math.round(va + (vb - va) * clamp01(u));
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
};

// ---------------------------------------------------------------------------
// Isometric world: feet in, pixels out. Same projection language as ch. 1.
// ---------------------------------------------------------------------------

const S = 26;
const CX = 490;
const CY = 388;
const COS30 = Math.cos(Math.PI / 6);
const iso = (x: number, y: number, z: number): { X: number; Y: number } => ({
  X: CX + (x - z) * COS30 * S,
  Y: CY + (x + z) * 0.5 * S - y * S,
});

type P3 = [number, number, number];
const EAVE = 7;
const RISE = 4 * Math.tan(Math.PI / 8); // the 22.5° roof
const PEAK = EAVE + RISE;

// wall shapes in wall-local coords (w along the bottom edge, h up)
const END_SHAPE: [number, number][] = [[0, 0], [8, 0], [8, EAVE], [4, PEAK], [0, EAVE]];
const SIDE_SHAPE: [number, number][] = [[0, 0], [8, 0], [8, EAVE], [0, EAVE]];

// each wall rotates about its bottom edge: a = 0 lying flat, a = 1 upright
type WallFn = (w: number, h: number, a: number) => P3;
const rot = (a: number) => [Math.sin((a * Math.PI) / 2), Math.cos((a * Math.PI) / 2)];
const backWall: WallFn = (w, h, a) => { const [sn, cs] = rot(a); return [w, h * sn, h * cs]; };
const leftWall: WallFn = (w, h, a) => { const [sn, cs] = rot(a); return [h * cs, h * sn, w]; };
const rightWall: WallFn = (w, h, a) => { const [sn, cs] = rot(a); return [8 - h * cs, h * sn, w]; };
const frontWall: WallFn = (w, h, a) => { const [sn, cs] = rot(a); return [w, h * sn, 8 - h * cs]; };

const wallPoly = (shape: [number, number][], fn: WallFn, a: number): string =>
  shape
    .map(([w, h]) => {
      const p = iso(...fn(w, h, a));
      return `${p.X},${p.Y}`;
    })
    .join(' ');

// door on the front wall, in wall-local inches-of-feet
const DOOR = { w0: 4.7, w1: 7.1, h1: 5.9 } as const;

// trusses stand across x, spaced every 24 in along z
const TRUSS_Z = [0, 2, 4, 6, 8];

// shingle courses climb the right roof slope (x from 8 → 4), with overhang
const COURSES = 6;
const OVER = 0.35;
const courseQuad = (i: number): P3[] => {
  const t0 = i / COURSES;
  const t1 = (i + 1) / COURSES;
  const x0 = 8 - 4 * t0;
  const x1 = 8 - 4 * t1;
  const y0 = EAVE + RISE * t0;
  const y1 = EAVE + RISE * t1;
  return [
    [x0, y0, -OVER],
    [x0, y0, 8 + OVER],
    [x1, y1, 8 + OVER],
    [x1, y1, -OVER],
  ];
};

// the chapter-one clutter, finally moving in
const CLUTTER = ['bikes', 'lawnmower', 'wheelbarrow', 'garden tools'] as const;
const DOOR_TARGET = iso(6, 2, 8.3);

const CAM_SHED: CameraState = { x: 500, y: 370, k: 1.22 };
const CAM_DOOR: CameraState = { x: 400, y: 430, k: 1.5 };
const CAM_ROOF: CameraState = { x: 520, y: 250, k: 1.34 };
const CAM_FINISH: CameraState = { x: 640, y: 340, k: 1.18 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  floorU: ChannelRef<number>;
  backA: ChannelRef<number>;
  sideA: ChannelRef<number>;
  frontA: ChannelRef<number>;
  screwU: ChannelRef<number>;
  cutU: ChannelRef<number>;
  doorU: ChannelRef<number>;
  plateU: ChannelRef<number>;
  trussU: ChannelRef<number>;
  alignU: ChannelRef<number>;
  sheathU: ChannelRef<number>;
  stripU: ChannelRef<number>;
  paperU: ChannelRef<number>;
  dripU: ChannelRef<number>;
  shingleU: ChannelRef<number>;
  trimU: ChannelRef<number>;
  paintU: ChannelRef<number>;
  chipsU: ChannelRef<number>;
  recapU: ChannelRef<number>;
  moveInU: ChannelRef<number>;
  sideDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SHED, cameraInterp);
  const floorU = tl.channel('floorU', 0);
  const backA = tl.channel('backA', 0);
  const sideA = tl.channel('sideA', 0);
  const frontA = tl.channel('frontA', 0);
  const screwU = tl.channel('screwU', 0);
  const cutU = tl.channel('cutU', 0);
  const doorU = tl.channel('doorU', 0);
  const plateU = tl.channel('plateU', 0);
  const trussU = tl.channel('trussU', 0);
  const alignU = tl.channel('alignU', 0);
  const sheathU = tl.channel('sheathU', 0);
  const stripU = tl.channel('stripU', 0);
  const paperU = tl.channel('paperU', 0);
  const dripU = tl.channel('dripU', 0);
  const shingleU = tl.channel('shingleU', 0);
  const trimU = tl.channel('trimU', 0);
  const paintU = tl.channel('paintU', 0);
  const chipsU = tl.channel('chipsU', 0);
  const recapU = tl.channel('recapU', 0);
  const moveInU = tl.channel('moveInU', 0);
  const sideDim = tl.channel('sideDim', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the back wall goes up —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Raising day. The back wall goes up first — tilted upright, walked to its edge, and fastened with four-inch screws driven down through the floorboards into the frame below.',
  });
  tl.tween(floorU, 1, { at: 0.5, dur: 1.0, ease: ease.enter });
  tl.tween(backA, 1, { at: 1.8, dur: 2.2, ease: ease.move });
  tl.tween(screwU, 0.34, { at: 4.4, dur: 0.8, ease: ease.linear });
  tl.hold(6.9, 0.5);

  // — Beat 2 · side walls —
  tl.caption({
    at: 7.4,
    dur: 6.6,
    text: 'The side walls rise next, butted tight against the back wall. The corners get screwed together from the inside, frame to frame, and short screws pin each panel skirt to the floor frame.',
  });
  tl.tween(sideA, 1, { at: 8.0, dur: 2.6, ease: ease.move });
  tl.tween(screwU, 0.67, { at: 11.2, dur: 0.9, ease: ease.linear });
  tl.hold(14.0, 0.5);

  // — Beat 3 · the last wall —
  tl.caption({
    at: 14.5,
    dur: 6.0,
    text: 'The last wall takes a couple of helpers to hold it steady while it is screwed down like the others. Four walls in an afternoon — because every one was finished flat on the ground.',
  });
  tl.tween(frontA, 1, { at: 15.1, dur: 2.4, ease: ease.move });
  tl.tween(screwU, 1, { at: 18.0, dur: 0.8, ease: ease.linear });
  tl.hold(20.5, 0.5);

  // — Beat 4 · a door from its own wall —
  tl.caption({
    at: 21.0,
    dur: 7.0,
    text: 'Now the door. A reciprocating saw follows the framed opening — carefully, because the panel it frees is not scrap. That exact cut-out becomes the door itself, a perfect match for its own hole.',
  });
  tl.tween(cam, CAM_DOOR, { at: 21.2, dur: 1.6, ease: ease.move });
  tl.tween(cutU, 1, { at: 22.2, dur: 2.8, ease: ease.linear });
  tl.tween(doorU, 1, { at: 25.4, dur: 1.8, ease: ease.move });
  tl.hold(28.0, 0.5);

  // — Beat 5 · walk inside —
  tl.caption({
    at: 28.5,
    dur: 5.2,
    text: 'The strip of bottom plate crossing the doorway is cut away too — and suddenly you can walk inside the thing you built.',
  });
  tl.tween(plateU, 1, { at: 29.1, dur: 1.2, ease: ease.move });
  tl.hold(33.2, 0.5);

  // — Beat 6 · trusses inline with studs —
  tl.caption({
    at: 33.7,
    dur: 6.6,
    text: 'Up top, the remaining trusses are screwed to the wall plates, each one standing directly in line with a wall stud — so the roof load flows straight down through framing to the floor.',
  });
  tl.tween(cam, CAM_ROOF, { at: 33.9, dur: 1.6, ease: ease.move });
  tl.tween(trussU, 1, { at: 34.7, dur: 2.6, ease: ease.move });
  tl.tween(alignU, 1, { at: 37.6, dur: 1.0, ease: ease.draw });
  tl.hold(40.3, 0.5);

  // — Beat 7 · sheathing —
  tl.caption({
    at: 40.8,
    dur: 6.2,
    text: 'Sheathing next: two sheets of seven-sixteenths strand board screwed down every eight inches, plus seven-inch strips to finish the lower edges — sized, once again, so whole sheets do the work.',
  });
  tl.tween(sheathU, 1, { at: 41.4, dur: 2.2, ease: ease.move });
  tl.tween(stripU, 1, { at: 44.4, dur: 1.0, ease: ease.enter });
  tl.hold(47.0, 0.5);

  // — Beat 8 · shingles —
  tl.caption({
    at: 47.5,
    dur: 6.6,
    text: 'Then the weather gets its answer: roofing paper, an aluminum drip edge around the eaves, and architectural shingles climbing course over course to the ridge.',
  });
  tl.tween(paperU, 1, { at: 48.0, dur: 1.2, ease: ease.move });
  tl.tween(dripU, 1, { at: 49.4, dur: 1.0, ease: ease.draw });
  tl.tween(shingleU, 1, { at: 50.6, dur: 3.0, ease: ease.linear });
  tl.hold(54.6, 0.5);

  // — Beat 9 · trim —
  tl.caption({
    at: 55.1,
    dur: 5.8,
    text: 'Trim goes on: actual two-by-fours around the roof for a substantial look, painted trim at the window and corners, and every seam caulked tight against the rain.',
  });
  tl.tween(cam, CAM_FINISH, { at: 55.3, dur: 1.5, ease: ease.move });
  tl.tween(trimU, 1, { at: 55.9, dur: 2.0, ease: ease.draw });
  tl.hold(61.4, 0.5);

  // — Beat 10 · paint and vents —
  tl.caption({
    at: 61.9,
    dur: 5.8,
    text: 'Two coats of exterior paint in a color called Boston Brick, and a pair of vents on the far wall to keep air moving through the shed all year.',
  });
  tl.tween(paintU, 1, { at: 62.5, dur: 2.2, ease: ease.move });
  tl.tween(chipsU, 0.5, { at: 64.4, dur: 0.8, ease: ease.enter });
  tl.hold(67.2, 0.4);

  // — Beat 11 · the floor, again —
  tl.caption({
    at: 67.6,
    dur: 5.2,
    text: 'Inside, that overbuilt floor gets two heavy coats of waterproof deck paint — tough enough to shrug off shovels, bike tires, and winter boots.',
  });
  tl.tween(chipsU, 1, { at: 68.2, dur: 0.8, ease: ease.enter });
  tl.hold(72.3, 0.5);

  // — Beat 12 · retrace the journey —
  tl.caption({
    at: 72.8,
    dur: 6.8,
    text: 'And that is the whole story: level blocks arguing a slope flat, a floor built like furniture, walls squared by their own siding, and a roof that repeats one friendly angle.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 73.0, dur: 1.8, ease: ease.move });
  tl.tween(sideDim, 0.15, { at: 73.2, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 1, { at: 74.2, dur: 2.4, ease: ease.move });
  tl.hold(80.1, 0.4);

  // — Beat 13 · move in —
  tl.caption({
    at: 80.5,
    dur: 6.4,
    text: 'An eight-foot cube, about twelve hundred dollars, and a string of weekends. The bikes, the mower, and every garden tool finally have a home. Go build one.',
  });
  tl.tween(moveInU, 1, { at: 81.1, dur: 2.6, ease: ease.move });
  tl.tween(closeU, 1, { at: 84.0, dur: 0.9, ease: ease.enter });
  tl.hold(86.9, 1.8);

  return {
    tl,
    cam,
    floorU,
    backA,
    sideA,
    frontA,
    screwU,
    cutU,
    doorU,
    plateU,
    trussU,
    alignU,
    sheathU,
    stripU,
    paperU,
    dripU,
    shingleU,
    trimU,
    paintU,
    chipsU,
    recapU,
    moveInU,
    sideDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const floorU = s.get(scene.floorU);
  const backA = s.get(scene.backA);
  const sideA = s.get(scene.sideA);
  const frontA = s.get(scene.frontA);
  const screwU = s.get(scene.screwU);
  const cutU = s.get(scene.cutU);
  const doorU = s.get(scene.doorU);
  const plateU = s.get(scene.plateU);
  const trussU = s.get(scene.trussU);
  const alignU = s.get(scene.alignU);
  const sheathU = s.get(scene.sheathU);
  const stripU = s.get(scene.stripU);
  const paperU = s.get(scene.paperU);
  const dripU = s.get(scene.dripU);
  const shingleU = s.get(scene.shingleU);
  const trimU = s.get(scene.trimU);
  const paintU = s.get(scene.paintU);
  const chipsU = s.get(scene.chipsU);
  const recapU = s.get(scene.recapU);
  const moveInU = s.get(scene.moveInU);
  const sideDim = s.get(scene.sideDim);
  const closeU = s.get(scene.closeU);

  // wall fill crossfades to Boston Brick as paint goes on
  const BRICK = '#9c4438';
  const wallFill = lerpColor('#a78bfa', BRICK, paintU);
  const wallFillOp = 0.24 + 0.3 * paintU;

  const wall = (
    shape: [number, number][],
    fn: WallFn,
    a: number,
    key: string,
    extra?: ReactNode,
  ) =>
    a > 0 && (
      <g key={key}>
        <polygon
          points={wallPoly(shape, fn, a)}
          fill={wallFill}
          opacity={wallFillOp}
          stroke={lerpColor('#a78bfa', '#c98d7a', paintU)}
          strokeWidth={1.6}
        />
        {extra}
      </g>
    );

  // door cut path on the front wall (upright): three sides of a rectangle
  const dp = (w: number, h: number) => iso(...frontWall(w, h, 1));
  const doorPath = `M ${dp(DOOR.w0, 0).X} ${dp(DOOR.w0, 0).Y} L ${dp(DOOR.w0, DOOR.h1).X} ${dp(DOOR.w0, DOOR.h1).Y} L ${dp(DOOR.w1, DOOR.h1).X} ${dp(DOOR.w1, DOOR.h1).Y} L ${dp(DOOR.w1, 0).X} ${dp(DOOR.w1, 0).Y}`;
  // the freed panel swings out along +z
  const doorOut = doorU * 1.6;
  const doorQuad = [
    frontWall(DOOR.w0, 0, 1),
    frontWall(DOOR.w0, DOOR.h1, 1),
    frontWall(DOOR.w1, DOOR.h1, 1),
    frontWall(DOOR.w1, 0, 1),
  ].map(([x, y, z]) => iso(x + doorOut * 0.2, y, z + doorOut));

  const quad = (pts: P3[]): string => pts.map((p) => {
    const q = iso(...p);
    return `${q.X},${q.Y}`;
  }).join(' ');

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the platform ---- */}
        {floorU > 0 && (
          <g opacity={floorU}>
            <polygon points={quad([[0, 0, 0], [8, 0, 0], [8, 0, 8], [0, 0, 8]])} fill={colors.SECONDARY} opacity={0.18} stroke={colors.SECONDARY} strokeWidth={1.4} />
          </g>
        )}

        {/* ---- walls, in raising order (painter-friendly: back → sides → front) ---- */}
        {wall(END_SHAPE, backWall, backA, 'back')}
        {wall(SIDE_SHAPE, leftWall, sideA, 'left')}
        {wall(
          SIDE_SHAPE,
          rightWall,
          Math.max(0, sideA - 0.12),
          'right',
          sideA > 0.9 ? (
            <g opacity={clamp01((sideA - 0.9) * 10)}>
              {/* the secondhand window on the visible side wall */}
              <polygon
                points={quad([
                  rightWall(2.2, 3.4, 1),
                  rightWall(2.2, 5.2, 1),
                  rightWall(4.0, 5.2, 1),
                  rightWall(4.0, 3.4, 1),
                ])}
                fill={colors.ACCENT}
                opacity={0.25}
                stroke={colors.ACCENT}
                strokeWidth={1.4}
              />
            </g>
          ) : null,
        )}
        {wall(END_SHAPE, frontWall, frontA, 'front')}

        {/* screws pin the walls down as each lands */}
        {screwU > 0 &&
          [
            [1, 0.1, 0.15], [3, 0.1, 0.1], [5, 0.1, 0.1], [7, 0.1, 0.15],
            [0.15, 0.1, 2], [0.15, 0.1, 5], [7.85, 0.1, 2], [7.85, 0.1, 5],
            [1, 0.1, 7.85], [3, 0.1, 7.85], [7, 0.1, 7.85], [5, 0.1, 7.85],
          ].map(([x, y, z], i) => {
            const u = clamp01(screwU * 12 - i);
            if (u <= 0) return null;
            const p = iso(x, y, z);
            return <circle key={i} cx={p.X} cy={p.Y} r={2.2} fill={colors.TEXT} opacity={0.8 * u} />;
          })}
        {screwU > 0.05 && screwU < 0.4 && (
          <text x={iso(4, -0.9, 0).X} y={iso(4, -0.9, 0).Y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
            4 in screws, through the floor into the frame
          </text>
        )}

        {/* ---- the door, cut from its own wall ---- */}
        {cutU > 0 && (
          <path
            d={doorPath}
            fill="none"
            stroke={colors.NEGATIVE}
            strokeWidth={2.4}
            strokeDasharray="7 5"
            pathLength={1}
            strokeDashoffset={1 - cutU}
            opacity={0.95 * (1 - doorU * 0.6)}
          />
        )}
        {cutU > 0.15 && cutU < 1 && (
          <text x={dp(3.2, 6.7).X} y={dp(3.2, 6.7).Y} fill={colors.NEGATIVE} fontSize={12.5}>
            reciprocating saw — save the panel
          </text>
        )}
        {doorU > 0 && (
          <g opacity={Math.min(1, doorU * 1.5)}>
            <polygon points={doorQuad.map((p) => `${p.X},${p.Y}`).join(' ')} fill={wallFill} opacity={0.5} stroke={colors.WARM} strokeWidth={2} />
            <text x={DOOR_TARGET.X - 40} y={DOOR_TARGET.Y + 60} fill={colors.WARM} fontSize={12.5}>
              the door — a perfect match for its own hole
            </text>
          </g>
        )}
        {plateU > 0 && (
          <g opacity={plateU}>
            <line
              x1={dp(DOOR.w0, 0.12).X}
              y1={dp(DOOR.w0, 0.12).Y}
              x2={dp(DOOR.w1, 0.12).X}
              y2={dp(DOOR.w1, 0.12).Y}
              stroke={colors.BG}
              strokeWidth={7}
            />
            <text x={dp(DOOR.w1 + 0.3, 0.4).X} y={dp(DOOR.w1 + 0.3, 0.4).Y} fill={colors.MUTED} fontSize={11.5}>
              bottom plate cut away
            </text>
          </g>
        )}

        {/* ---- trusses ---- */}
        {TRUSS_Z.map((z, i) => {
          const u = clamp01(trussU * 3.4 - i * 0.5);
          if (u <= 0) return null;
          const lift = (1 - u) * 40;
          const a = iso(0, EAVE, z);
          const b = iso(4, PEAK, z);
          const c = iso(8, EAVE, z);
          return (
            <g key={z} opacity={u}>
              <path d={`M ${a.X} ${a.Y - lift} L ${b.X} ${b.Y - lift} L ${c.X} ${c.Y - lift}`} fill="none" stroke="#d9b87c" strokeWidth={4.5} strokeLinejoin="round" />
            </g>
          );
        })}
        {alignU > 0 && (
          <g opacity={alignU * (1 - sheathU)}>
            {[2, 4, 6].map((z) => {
              const top = iso(8, EAVE, z);
              const bot = iso(8, 0.2, z);
              return <line key={z} x1={top.X} y1={top.Y} x2={bot.X} y2={bot.Y} stroke={colors.ACCENT} strokeWidth={1.2} strokeDasharray="4 5" opacity={0.8} />;
            })}
            <text x={iso(8, 3.4, 6).X + 12} y={iso(8, 3.4, 6).Y} fill={colors.ACCENT} fontSize={11.5}>
              trusses inline with studs
            </text>
          </g>
        )}

        {/* ---- roof sheathing ---- */}
        {sheathU > 0 && (
          <g>
            {/* left slope */}
            <polygon
              points={quad([
                [4, PEAK, -OVER],
                [4, PEAK, 8 + OVER],
                [4 - 4 * clamp01(sheathU * 1.3), PEAK - RISE * clamp01(sheathU * 1.3), 8 + OVER],
                [4 - 4 * clamp01(sheathU * 1.3), PEAK - RISE * clamp01(sheathU * 1.3), -OVER],
              ])}
              fill={lerpColor('#8fa3bd', '#4a5568', paperU)}
              opacity={0.5}
              stroke={colors.GRID}
            />
            {/* right slope */}
            <polygon
              points={quad([
                [4, PEAK, -OVER],
                [4, PEAK, 8 + OVER],
                [4 + 4 * clamp01(sheathU * 1.3), PEAK - RISE * clamp01(sheathU * 1.3), 8 + OVER],
                [4 + 4 * clamp01(sheathU * 1.3), PEAK - RISE * clamp01(sheathU * 1.3), -OVER],
              ])}
              fill={lerpColor('#8fa3bd', '#4a5568', paperU)}
              opacity={0.55}
              stroke={colors.GRID}
            />
            {sheathU > 0.4 && shingleU < 0.3 && (
              <text x={iso(6.2, EAVE + 1.1, -1.2).X} y={iso(6.2, EAVE + 1.1, -1.2).Y} fill={colors.MUTED} fontSize={11.5} opacity={clamp01(sheathU * 2 - 1) * (1 - clamp01(shingleU * 4))}>
                7/16 in OSB · screws every 8 in
              </text>
            )}
          </g>
        )}
        {stripU > 0 && shingleU < 0.5 && (
          <g opacity={stripU * (1 - clamp01(shingleU * 2))}>
            <polygon points={quad(courseQuad(0))} fill={colors.WARM} opacity={0.35} stroke={colors.WARM} strokeWidth={1} />
            <text x={iso(8.4, EAVE - 0.4, 4).X} y={iso(8.4, EAVE - 0.4, 4).Y + 16} fill={colors.WARM} fontSize={11.5}>
              7-inch strips finish the edge
            </text>
          </g>
        )}

        {/* ---- drip edge + shingle courses ---- */}
        {dripU > 0 && (
          <g opacity={dripU}>
            <line x1={iso(8, EAVE, -OVER).X} y1={iso(8, EAVE, -OVER).Y} x2={iso(8, EAVE, 8 + OVER).X} y2={iso(8, EAVE, 8 + OVER).Y} stroke={colors.ACCENT} strokeWidth={2.4} />
            <text x={iso(8, EAVE - 0.9, 8.6).X} y={iso(8, EAVE - 0.9, 8.6).Y} fill={colors.ACCENT} fontSize={11.5}>
              aluminum drip edge
            </text>
          </g>
        )}
        {Array.from({ length: COURSES }, (_, i) => {
          const u = clamp01(shingleU * (COURSES + 1) - i);
          if (u <= 0) return null;
          return (
            <polygon
              key={i}
              points={quad(courseQuad(i))}
              fill={i % 2 === 0 ? '#5a6472' : '#4e5866'}
              opacity={0.9 * u}
              stroke="#3a4250"
              strokeWidth={1}
            />
          );
        })}
        {shingleU > 0.85 && (
          <text x={iso(6, PEAK + 0.5, 4).X} y={iso(6, PEAK + 0.5, 4).Y - 10} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} opacity={clamp01(shingleU * 6 - 5)}>
            architectural shingles, to the ridge
          </text>
        )}

        {/* ---- trim ---- */}
        {trimU > 0 && (
          <g opacity={trimU}>
            <path
              d={`M ${iso(0, EAVE, 8 + OVER).X} ${iso(0, EAVE, 8 + OVER).Y} L ${iso(4, PEAK, 8 + OVER).X} ${iso(4, PEAK, 8 + OVER).Y} L ${iso(8, EAVE, 8 + OVER).X} ${iso(8, EAVE, 8 + OVER).Y}`}
              fill="none"
              stroke="#e8e2d0"
              strokeWidth={3}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - trimU}
            />
            <line x1={iso(8, 0, 8).X} y1={iso(8, 0, 8).Y} x2={iso(8, EAVE * trimU, 8).X} y2={iso(8, EAVE * trimU, 8).Y} stroke="#e8e2d0" strokeWidth={3} />
            <text x={iso(4, PEAK + 1.2, 8).X} y={iso(4, PEAK + 1.2, 8).Y} textAnchor="middle" fill="#e8e2d0" fontSize={11.5}>
              2x4 roof trim · corners caulked
            </text>
          </g>
        )}

        {/* ---- finish chips (right column) ---- */}
        <g opacity={chipsU * sideDim}>
          <rect x={950} y={150} width={260} height={168} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <circle cx={984} cy={188} r={14} fill={BRICK} />
          <text x={1010} y={184} fill={colors.TEXT} fontSize={13}>
            Behr exterior paint
          </text>
          <text x={1010} y={201} fill={colors.MUTED} fontSize={11.5}>
            color: Boston Brick
          </text>
          <g opacity={clamp01(chipsU * 2 - 0.4)}>
            <rect x={972} y={222} width={24} height={16} rx={3} fill="none" stroke={colors.TEXT} strokeWidth={1.5} />
            {[0, 1, 2].map((i) => (
              <line key={i} x1={975} y1={226 + i * 4} x2={993} y2={226 + i * 4} stroke={colors.TEXT} strokeWidth={1} />
            ))}
            <text x={1010} y={236} fill={colors.TEXT} fontSize={13}>
              vents × 2 — far wall
            </text>
          </g>
          <g opacity={clamp01(chipsU * 2 - 1)}>
            <rect x={970} y={258} width={28} height={12} rx={2} fill={colors.POSITIVE} opacity={0.7} />
            <text x={1010} y={270} fill={colors.TEXT} fontSize={13}>
              floor: deck paint, 2 coats
            </text>
            <text x={1010} y={287} fill={colors.MUTED} fontSize={11.5}>
              waterproof · one gallon
            </text>
          </g>
        </g>

        {/* ---- recap strip ---- */}
        {recapU > 0 && (
          <g opacity={recapU * sideDim}>
            {(['level blocks', 'a furniture floor', 'walls built flat', 'squared by siding', 'one friendly angle'] as const).map((t, i) => {
              const u = clamp01(recapU * 3 - i * 0.45);
              if (u <= 0) return null;
              const x = 950 + 0;
              return (
                <g key={t} opacity={u}>
                  <circle cx={x} cy={360 + i * 34} r={4} fill={colors.ACCENT} />
                  <text x={x + 16} y={364 + i * 34} fill={colors.TEXT} fontSize={13.5}>
                    {t}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ---- the clutter moves in ---- */}
        {moveInU > 0 &&
          CLUTTER.map((label, i) => {
            const u = clamp01(moveInU * 2.6 - i * 0.4);
            if (u <= 0) return null;
            const x0 = 130;
            const y0 = 160 + i * 60;
            const x = x0 + (DOOR_TARGET.X - x0) * u;
            const y = y0 + (DOOR_TARGET.Y - y0) * u;
            const k = 1 - 0.6 * u;
            const w = (label.length * 7.5 + 30) * k;
            return (
              <g key={label} opacity={Math.min(1, u * 3) * (1 - u * u * 0.9)}>
                <rect x={x - w / 2} y={y - 14 * k} width={w} height={28 * k} rx={14 * k} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={x} y={y + 4 * k} textAnchor="middle" fill={colors.TEXT} fontSize={13 * k}>
                  {label}
                </text>
              </g>
            );
          })}

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={330} y={190} width={620} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={246} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              an 8-ft cube · ≈ $1,200 · a string of weekends
            </text>
            <text x={640} y={288} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              everything finally has a home
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
