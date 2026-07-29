// A Level Foundation
//
// Backing source: "Build a Simple Shed: a Complete Guide" (Instructables,
// seamster, steps 5–6): level contact points at the corners and wall
// midpoints; 12x8-in "Olde Manor" garden blocks buried just below the sod on
// compacted ground for the uphill half; concrete pier blocks with bolted
// wooden risers (cut from a 4x6 pressure-treated post) for the ~12-in
// downhill half, like a low deck; a temporary placement frame to locate the
// piers; corner-to-corner diagonal measurement to prove squareness;
// landscaping adhesive where the frame rests on masonry.
//
// Centerpiece: a side-elevation cross-section of the sloping lawn. A dashed
// level line exposes the wedge of air; blocks and piers rise support by
// support until every top touches that one line.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The cross-section: x in feet (0 = uphill corner, 8 = downhill corner).
// 1 ft = 68 px. The lawn falls 12 in across the 8-ft run.
// ---------------------------------------------------------------------------

const FT = 68;
const EX = (x: number): number => 240 + x * FT;
const LEVEL_Y = 440; // top of every support — the one line that matters
const SOD_AT_0 = 470;

// gently bumpy terrain, precomputed with a seeded PRNG
const rand = mulberry32(20150507);
const BUMPS = Array.from({ length: 40 }, () => (rand() - 0.5) * 7);
const groundY = (x: number): number => {
  const i = clamp01((x + 1.5) / 11) * (BUMPS.length - 1);
  const a = BUMPS[Math.floor(i)];
  const b = BUMPS[Math.min(BUMPS.length - 1, Math.floor(i) + 1)];
  const bump = a + (b - a) * (i - Math.floor(i));
  return SOD_AT_0 + (x / 8) * FT + bump;
};
const TERRAIN: { x: number; y: number }[] = Array.from({ length: 45 }, (_, i) => {
  const x = -1.5 + (i / 44) * 11;
  return { x: EX(x), y: groundY(x) };
});

// the three supports visible in this wall's cross-section
const BLOCK_W = FT; // 12 in
const BLOCK_H = FT * (8 / 12); // 8 in
const PIER_TOP = 493;
const SUPPORTS = {
  corner0: { x: EX(0) },
  mid: { x: EX(4) },
  corner8: { x: EX(8) },
} as const;

// plan-view inset: footprint + 8 contact dots (corners + wall midpoints)
const PLAN = { x0: 890, y0: 150, w: 250, h: 250 } as const;
const DOTS: { u: number; v: number }[] = [
  { u: 0, v: 0 },
  { u: 1, v: 0 },
  { u: 1, v: 1 },
  { u: 0, v: 1 },
  { u: 0.5, v: 0 },
  { u: 1, v: 0.5 },
  { u: 0.5, v: 1 },
  { u: 0, v: 0.5 },
];
// skewed layout → true square: corners shear horizontally by (1 - squareU)
const SHEAR = 26;
const planPt = (u: number, v: number, squareU: number): { x: number; y: number } => ({
  x: PLAN.x0 + u * PLAN.w + (1 - v) * SHEAR * (1 - squareU),
  y: PLAN.y0 + v * PLAN.h,
});

const CAM_WIDE: CameraState = { x: 560, y: 400, k: 1.14 };
const CAM_UPHILL: CameraState = { x: 330, y: 450, k: 1.7 };
const CAM_DOWNHILL: CameraState = { x: 760, y: 460, k: 1.7 };
const CAM_PLAN: CameraState = { x: 950, y: 300, k: 1.3 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  terrainU: ChannelRef<number>;
  levelU: ChannelRef<number>;
  wedgeU: ChannelRef<number>;
  dropU: ChannelRef<number>;
  planU: ChannelRef<number>;
  dotsU: ChannelRef<number>;
  blockU: ChannelRef<number>;
  midU: ChannelRef<number>;
  pierU: ChannelRef<number>;
  boltU: ChannelRef<number>;
  ghostU: ChannelRef<number>;
  planDim: ChannelRef<number>;
  diagU: ChannelRef<number>;
  squareU: ChannelRef<number>;
  meetU: ChannelRef<number>;
  glueU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const terrainU = tl.channel('terrainU', 0);
  const levelU = tl.channel('levelU', 0);
  const wedgeU = tl.channel('wedgeU', 0);
  const dropU = tl.channel('dropU', 0);
  const planU = tl.channel('planU', 0);
  const dotsU = tl.channel('dotsU', 0);
  const blockU = tl.channel('blockU', 0);
  const midU = tl.channel('midU', 0);
  const pierU = tl.channel('pierU', 0);
  const boltU = tl.channel('boltU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const planDim = tl.channel('planDim', 1);
  const diagU = tl.channel('diagU', 0);
  const squareU = tl.channel('squareU', 0);
  const meetU = tl.channel('meetU', 0);
  const glueU = tl.channel('glueU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the level line finds the problem —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'A small shed can rest right on the ground. But ground is never truly flat and never truly firm — stretch a level line across this lawn and the problem draws itself.',
  });
  tl.tween(terrainU, 1, { at: 0.5, dur: 1.5, ease: ease.draw });
  tl.tween(levelU, 1, { at: 2.8, dur: 1.6, ease: ease.draw });
  tl.tween(wedgeU, 1, { at: 4.6, dur: 1.2, ease: ease.move });
  tl.hold(6.9, 0.5);

  // — Beat 2 · twelve inches of trouble —
  tl.caption({
    at: 7.4,
    dur: 5.8,
    text: 'Across eight feet, this lawn falls about twelve inches. Ignore that, and the floor twists, the doors bind, and nothing built on top will ever square up.',
  });
  tl.tween(dropU, 1, { at: 7.9, dur: 0.9, ease: ease.enter });
  tl.hold(13.2, 0.5);

  // — Beat 3 · contact points —
  tl.caption({
    at: 13.7,
    dur: 6.6,
    text: 'The fix is a handful of solid, level contact points: one under each corner, and one at the midpoint of every wall. Masonry, not soil, decides where this shed stands.',
  });
  tl.tween(cam, CAM_PLAN, { at: 13.9, dur: 1.5, ease: ease.move });
  tl.tween(planU, 1, { at: 14.3, dur: 1.0, ease: ease.draw });
  tl.tween(dotsU, 1, { at: 15.5, dur: 2.2, ease: ease.move });
  tl.hold(20.3, 0.5);

  // — Beat 4 · uphill garden blocks —
  tl.caption({
    at: 20.8,
    dur: 6.8,
    text: 'On the uphill half, chunky twelve-by-eight garden blocks sit just below the sod — each one leveled, and tamped onto firm, compacted ground. It is backbreaking work, and worth every minute.',
  });
  tl.tween(cam, CAM_UPHILL, { at: 21.0, dur: 1.6, ease: ease.move });
  tl.tween(planDim, 0.08, { at: 21.0, dur: 1.2, ease: ease.move });
  tl.tween(blockU, 1, { at: 22.0, dur: 1.2, ease: ease.move });
  tl.tween(midU, 1, { at: 24.4, dur: 1.2, ease: ease.move });
  tl.hold(27.6, 0.5);

  // — Beat 5 · downhill piers and risers —
  tl.caption({
    at: 28.1,
    dur: 6.8,
    text: 'The downhill half borrows a trick from low decks: concrete pier blocks topped with short wooden risers, cut from a pressure-treated four-by-six post and bolted down so nothing can wander.',
  });
  tl.tween(cam, CAM_DOWNHILL, { at: 28.3, dur: 1.6, ease: ease.move });
  tl.tween(pierU, 1, { at: 29.3, dur: 1.4, ease: ease.move });
  tl.tween(boltU, 1, { at: 32.4, dur: 0.7, ease: ease.pop });
  tl.hold(34.9, 0.5);

  // — Beat 6 · the temporary placement frame —
  tl.caption({
    at: 35.4,
    dur: 6.2,
    text: 'Piers have to land exactly where the floor frame will. So a temporary frame — a throwaway rectangle built to the exact footprint — is set over the layout to mark every spot.',
  });
  tl.tween(cam, CAM_PLAN, { at: 35.6, dur: 1.6, ease: ease.move });
  tl.tween(planDim, 1, { at: 35.8, dur: 1.0, ease: ease.move });
  tl.tween(ghostU, 1, { at: 36.6, dur: 1.4, ease: ease.draw });
  tl.hold(41.6, 0.4);

  // — Beat 7 · prove it square —
  tl.caption({
    at: 42.0,
    dur: 6.6,
    text: 'Then the layout is proven, not eyeballed. Measure corner to corner, both ways: when the two diagonals read the same, the rectangle is square. Nudge the blocks until they do.',
  });
  tl.tween(diagU, 1, { at: 42.5, dur: 1.2, ease: ease.draw });
  tl.tween(squareU, 1, { at: 45.2, dur: 2.0, ease: ease.move });
  tl.hold(48.6, 0.5);

  // — Beat 8 · everything meets the line —
  tl.caption({
    at: 49.1,
    dur: 6.4,
    text: 'Support by support, every top rises to meet one line. A bead of landscaping adhesive will lock the frame to the masonry — and the slope has been argued flat.',
  });
  tl.tween(cam, CAM_WIDE, { at: 49.3, dur: 1.7, ease: ease.move });
  tl.tween(meetU, 1, { at: 50.5, dur: 1.6, ease: ease.draw });
  tl.tween(glueU, 1, { at: 52.6, dur: 0.8, ease: ease.enter });
  tl.tween(wedgeU, 0.25, { at: 50.5, dur: 1.4, ease: ease.move });
  tl.hold(55.5, 0.5);

  // — Beat 9 · close —
  tl.caption({
    at: 56.0,
    dur: 5.8,
    text: 'None of this will show once the shed is finished — and everything above depends on it. Next comes a floor frame worthy of the foundation.',
  });
  tl.tween(dimAll, 0.15, { at: 56.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 57.6, dur: 0.9, ease: ease.enter });
  tl.hold(61.8, 1.6);

  return {
    tl,
    cam,
    terrainU,
    levelU,
    wedgeU,
    dropU,
    planU,
    dotsU,
    blockU,
    midU,
    pierU,
    boltU,
    ghostU,
    planDim,
    diagU,
    squareU,
    meetU,
    glueU,
    dimAll,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function GardenBlock({ x, top, u, label }: { x: number; top: number; u: number; label?: string }) {
  if (u <= 0) return null;
  const drop = (1 - u) * 46;
  return (
    <g opacity={u}>
      <rect
        x={x - BLOCK_W / 2}
        y={top - drop}
        width={BLOCK_W}
        height={BLOCK_H}
        rx={3}
        fill="#5b6478"
        stroke={colors.GRID}
      />
      <line
        x1={x - BLOCK_W / 2 + 8}
        y1={top - drop + BLOCK_H / 2}
        x2={x + BLOCK_W / 2 - 8}
        y2={top - drop + BLOCK_H / 2}
        stroke={colors.BG}
        strokeWidth={1.2}
        opacity={0.5}
      />
      {label && (
        <text x={x} y={top - drop - 8} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
          {label}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const terrainU = s.get(scene.terrainU);
  const levelU = s.get(scene.levelU);
  const wedgeU = s.get(scene.wedgeU);
  const dropU = s.get(scene.dropU);
  const planU = s.get(scene.planU);
  const dotsU = s.get(scene.dotsU);
  const blockU = s.get(scene.blockU);
  const midU = s.get(scene.midU);
  const pierU = s.get(scene.pierU);
  const boltU = s.get(scene.boltU);
  const ghostU = s.get(scene.ghostU);
  const planDim = s.get(scene.planDim);
  const diagU = s.get(scene.diagU);
  const squareU = s.get(scene.squareU);
  const meetU = s.get(scene.meetU);
  const glueU = s.get(scene.glueU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  // terrain path (surface + filled soil below)
  const surface = TERRAIN.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const soil = `${surface} L ${TERRAIN[TERRAIN.length - 1].x} 620 L ${TERRAIN[0].x} 620 Z`;

  // wedge of air between the level line (top) and the ground surface (below)
  const wedgePts = TERRAIN.filter((p) => p.x >= EX(0) && p.x <= EX(8.4)).map((p) => `${p.x},${Math.max(p.y, LEVEL_Y)}`);
  const wedge = `${EX(0)},${LEVEL_Y} ${EX(8.4)},${LEVEL_Y} ${wedgePts.reverse().join(' ')}`;

  const riserH = PIER_TOP - LEVEL_Y;

  // plan diagonals — real lengths from the sheared geometry, in inches
  const c = (u: number, v: number) => planPt(u, v, squareU);
  const dLen = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y) * (96 / PLAN.w); // footprint is 96 in wide
  const dA = dLen(c(0, 0), c(1, 1));
  const dB = dLen(c(1, 0), c(0, 1));
  const square = Math.abs(dA - dB) < 0.35;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- cross-section ---- */}
        <g opacity={dimAll}>
          <g opacity={terrainU}>
            <path d={soil} fill="#233042" opacity={0.55} />
            <path d={surface} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - terrainU} opacity={0.85} />
          </g>

          {/* wedge of air */}
          {wedgeU > 0 && (
            <polygon points={wedge} fill={colors.NEGATIVE} opacity={0.13 * wedgeU} />
          )}

          {/* the level line */}
          {levelU > 0 && (
            <g>
              <line
                x1={EX(-1)}
                y1={LEVEL_Y}
                x2={EX(9)}
                y2={LEVEL_Y}
                stroke={colors.ACCENT}
                strokeWidth={2}
                strokeDasharray="10 7"
                pathLength={1}
                strokeDashoffset={0}
                opacity={levelU * 0.9}
              />
              <text x={EX(8.75)} y={LEVEL_Y - 10} fill={colors.ACCENT} fontSize={13} opacity={levelU}>
                level
              </text>
            </g>
          )}

          {/* 12-in drop marker */}
          {dropU > 0 && (
            <g opacity={dropU}>
              <line x1={EX(8.5)} y1={LEVEL_Y + BLOCK_H} x2={EX(8.5)} y2={groundY(8.5)} stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={EX(8.5) + 10} y={(LEVEL_Y + BLOCK_H + groundY(8.5)) / 2 + 4} fill={colors.NEGATIVE} fontSize={14} fontWeight={600}>
                ~12 in
              </text>
            </g>
          )}

          {/* uphill: corner garden block, buried just below the sod */}
          <GardenBlock x={SUPPORTS.corner0.x} top={LEVEL_Y} u={blockU} label="garden block · 12×8" />
          {/* midpoint: stacked blocks partway down the slope */}
          <GardenBlock x={SUPPORTS.mid.x} top={LEVEL_Y} u={midU} />
          <GardenBlock x={SUPPORTS.mid.x} top={LEVEL_Y + BLOCK_H} u={clamp01(midU * 1.4 - 0.2)} />

          {/* downhill: pier block + bolted riser */}
          {pierU > 0 && (
            <g opacity={pierU}>
              {/* pier block (tapered) */}
              <polygon
                points={`${SUPPORTS.corner8.x - 34},${PIER_TOP + 52} ${SUPPORTS.corner8.x + 34},${PIER_TOP + 52} ${SUPPORTS.corner8.x + 22},${PIER_TOP} ${SUPPORTS.corner8.x - 22},${PIER_TOP}`}
                fill="#5b6478"
                stroke={colors.GRID}
              />
              {/* riser grows up to the level line */}
              <rect
                x={SUPPORTS.corner8.x - 16}
                y={PIER_TOP - riserH * clamp01(pierU * 1.3)}
                width={32}
                height={riserH * clamp01(pierU * 1.3)}
                fill={colors.WARM}
                opacity={0.8}
                stroke={colors.GRID}
              />
              <text x={SUPPORTS.corner8.x + 44} y={PIER_TOP - 12} fill={colors.WARM} fontSize={11.5}>
                riser — 4x6 PT
              </text>
              <text x={SUPPORTS.corner8.x - 44} y={PIER_TOP + 34} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                pier block
              </text>
            </g>
          )}
          {boltU > 0 && (
            <g opacity={boltU}>
              <circle cx={SUPPORTS.corner8.x} cy={PIER_TOP - 10} r={3.5} fill={colors.ACCENT} />
              <circle cx={SUPPORTS.corner8.x} cy={PIER_TOP - 26} r={3.5} fill={colors.ACCENT} />
              <text x={SUPPORTS.corner8.x - 26} y={PIER_TOP - 16} textAnchor="end" fill={colors.ACCENT} fontSize={11.5}>
                bolted
              </text>
            </g>
          )}

          {/* every top meets the line */}
          {meetU > 0 && (
            <g opacity={meetU}>
              {[SUPPORTS.corner0.x, SUPPORTS.mid.x, SUPPORTS.corner8.x].map((x, i) => (
                <circle key={i} cx={x} cy={LEVEL_Y} r={7} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} opacity={clamp01(meetU * 3 - i * 0.6)} />
              ))}
              <line x1={EX(-0.6)} y1={LEVEL_Y} x2={EX(8.6)} y2={LEVEL_Y} stroke={colors.POSITIVE} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - meetU} />
            </g>
          )}
          {glueU > 0 && (
            <g opacity={glueU}>
              {[SUPPORTS.corner0.x, SUPPORTS.mid.x].map((x, i) => (
                <ellipse key={i} cx={x} cy={LEVEL_Y - 3} rx={16} ry={4} fill={colors.SECONDARY} opacity={0.8} />
              ))}
              <text x={SUPPORTS.mid.x} y={LEVEL_Y - 16} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5}>
                landscaping adhesive
              </text>
            </g>
          )}
        </g>

        {/* ---- plan-view inset ---- */}
        <g opacity={planU * planDim * dimAll}>
          <rect x={PLAN.x0 - 40} y={PLAN.y0 - 60} width={PLAN.w + 80} height={PLAN.h + 110} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={PLAN.x0 + PLAN.w / 2} y={PLAN.y0 - 34} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
            footprint, from above — 8 × 8 ft
          </text>

          {/* temporary placement frame (ghost) */}
          {ghostU > 0 && (
            <polygon
              points={DOTS.slice(0, 4).map((d) => {
                const p = planPt(d.u, d.v, squareU);
                return `${p.x},${p.y}`;
              }).join(' ')}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={2.5}
              strokeDasharray="8 6"
              opacity={ghostU * 0.9}
            />
          )}

          {/* contact dots */}
          {DOTS.map((d, i) => {
            const u = clamp01(dotsU * 4 - i * 0.45);
            if (u <= 0) return null;
            const p = planPt(d.u, d.v, squareU);
            return <circle key={i} cx={p.x} cy={p.y} r={7 * u} fill="#5b6478" stroke={colors.TEXT} strokeWidth={1.2} />;
          })}

          {/* diagonals + live readout */}
          {diagU > 0 && (
            <g opacity={diagU}>
              <line x1={c(0, 0).x} y1={c(0, 0).y} x2={c(1, 1).x} y2={c(1, 1).y} stroke={colors.ACCENT} strokeWidth={1.8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - diagU} />
              <line x1={c(1, 0).x} y1={c(1, 0).y} x2={c(0, 1).x} y2={c(0, 1).y} stroke={colors.SECONDARY} strokeWidth={1.8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - diagU} />
              <text x={PLAN.x0 + 4} y={PLAN.y0 + PLAN.h + 32} fill={colors.ACCENT} fontSize={13} fontFamily="monospace">
                {dA.toFixed(1)} in
              </text>
              <text x={PLAN.x0 + PLAN.w} y={PLAN.y0 + PLAN.h + 32} textAnchor="end" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
                {dB.toFixed(1)} in
              </text>
              <text x={PLAN.x0 + PLAN.w / 2} y={PLAN.y0 + PLAN.h + 32} textAnchor="middle" fill={square ? colors.POSITIVE : colors.NEGATIVE} fontSize={13} fontWeight={700}>
                {square ? '= square' : '≠'}
              </text>
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={330} y={216} width={620} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              level tops · equal diagonals · firm ground
            </text>
            <text x={640} y={314} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the slope has been argued flat
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
