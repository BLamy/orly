// Chapter 4 — The Crushed Surfaces
//
// ONE persistent object: the fiber — how many source points sit over a
// target. The third component factors, F3 = −x·(x²z + 3xy − 2), so TWO
// hypersurfaces (the plane x = 0 and the surface x²z + 3xy = 2) are crushed
// onto the single target plane {C = 0}: the plane bijectively via
// (0,y,z) ↦ (4y² + z, y, 0), the surface two-to-one via s = 1/x
// (image ((y+s)(y+2s), 4y+6s, 0), so s² = (b² − 16a)/4). Over (−1/4, 0, 0):
// 1 + 2 = 3 — the chapter-three collision. Then the general fiber: in
// (s,t) = (1/x, xy) coordinates the fiber is the cubic 2c·s³+(3bc−4)s²+Δ = 0,
// whose three roots dance in the complex s-plane as the target rides a loop
// with Δ ≤ −4.25 (verified numerically) — an honest 3-to-1 étale cover.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { trackRoots, rootsAt } from './roots';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ------------------------------------------------------------- the math */
// the verified chapter-4 loop: c = 1, (a,b) circles (−0.8, 1.0) ± (0.4, 0.5);
// Δ stays ≤ −4.25 and all roots stay inside |s| < 3 (checked numerically).
const LOOP_N = 241;
const loopPath = (tau: number): [number, number, number] => {
  const th = 2 * Math.PI * tau;
  return [-0.8 + 0.4 * Math.cos(th), 1.0 + 0.5 * Math.sin(th), 1.0];
};
const LOOP_ROOTS = trackRoots(loopPath, LOOP_N);

/* ---------------------------------------------------------------- layout */
const FACT = { x: 70, y: 76, w: 520, h: 62 };
const SPLANE = { x: 660, y: 168, w: 540, h: 430 };
const SP_CX = SPLANE.x + SPLANE.w / 2;
const SP_CY = SPLANE.y + SPLANE.h / 2 + 8;
const SP_SCALE = 64;

// the crush diagram: two source sheets + the target plane (fake-3D quads)
type Quad = [number, number][];
const PLANE_Q: Quad = [
  [110, 205],
  [330, 185],
  [395, 245],
  [175, 265],
];
const SURF_TOP: Quad = [
  [105, 330],
  [200, 298],
  [300, 352],
  [400, 315],
];
const SURF_BOT: Quad = [
  [395, 395],
  [295, 432],
  [195, 378],
  [115, 415],
];
const TARGET_Q: Quad = [
  [115, 505],
  [360, 483],
  [432, 548],
  [187, 570],
];
// crushed destinations: both sheets land flat INSIDE the target quad
const PLANE_FLAT: Quad = [
  [150, 512],
  [330, 496],
  [380, 540],
  [200, 556],
];
const SURF_FLAT_TOP: Quad = [
  [150, 514],
  [235, 502],
  [320, 522],
  [378, 508],
];
const SURF_FLAT_BOT: Quad = [
  [375, 538],
  [300, 550],
  [215, 532],
  [152, 548],
];

// fiber-assembly geometry: the shared image and its three visitors
const QPT = { x: 273, y: 527 };
const R1 = { x: 252, y: 235, c: colors.ACCENT, label: 'x = 0 sheet' }; // on the plane
const R2 = { x: 330, y: 344, c: colors.SECONDARY, label: 'x = 1' };
const R3 = { x: 185, y: 372, c: colors.WARM, label: 'x = −1' };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_FACT: CameraState = { x: 420, y: 240, k: 1.1 };
const CAM_CRUSH: CameraState = { x: 320, y: 390, k: 1.12 };
const CAM_SPLANE: CameraState = { x: 900, y: 370, k: 1.08 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 0.97 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const factU = tl.channel('factU', 0); // the factorization card
  const sheetsU = tl.channel('sheetsU', 0); // the two source sheets + target
  const crushU = tl.channel('crushU', 0); // sheets flatten onto the target
  const formulaU = tl.channel('formulaU', 0); // per-sheet image formulas
  const fiberU = tl.channel('fiberU', 0); // risers: 1 + 2 = 3 assembly
  const subU = tl.channel('subU', 0); // s = 1/x, t = xy chip
  const planeU = tl.channel('planeU', 0); // the s-plane panel
  const danceT = tl.channel('danceT', 0); // loop parameter
  const danceOn = tl.channel('danceOn', 0); // roots visible
  const countU = tl.channel('countU', 0); // "preimages: 3" pulse
  const dimU = tl.channel('dimU', 0);
  const teaseU = tl.channel('teaseU', 0);

  /* — beat 1 · the third coordinate factors — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'How does a map with no folds anywhere lose track of three points? Look at its third coordinate. It factors — a product of two very different pieces.',
  });
  tl.tween(cam, CAM_FACT, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(factU, 1, { at: t - 5.2, dur: 0.9, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 2 · two worlds, crushed onto one plane — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'That product vanishes on two separate worlds: the flat plane where x is zero, and a curved surface. The map crushes both of them onto the same plane of targets.',
  });
  tl.tween(cam, CAM_CRUSH, { at: t - 6.4, dur: 1.4, ease: ease.move });
  tl.tween(sheetsU, 1, { at: t - 6.0, dur: 1.4, ease: ease.draw });
  tl.tween(crushU, 1, { at: t - 3.4, dur: 2.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 3 · the plane is honest — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'On the flat world the map is perfectly honest. Each point of that plane goes to its own private target — one visitor per address, no collisions.',
  });
  tl.tween(crushU, 0, { at: t - 5.6, dur: 1.4, ease: ease.move });
  tl.tween(formulaU, 1, { at: t - 3.8, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 4 · the surface doubles up — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'The curved world is the trick. Substitute one over x, and its trip through the map becomes a quadratic — almost every target on that plane receives exactly two visitors from the surface.',
  });
  t = tl.hold(t, 0.4);

  /* — beat 5 · one plus two equals the chapter-three fiber — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Over the point minus one quarter, zero, zero: one visitor from the plane, two from the surface, at x equals one and x equals minus one. That is the collision you watched last chapter.',
  });
  tl.tween(fiberU, 1, { at: t - 5.8, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 6 · one cubic to rule the fiber — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'And this is bigger than one unlucky target. Change variables, and the entire question of who maps where collapses into a single cubic equation in one unknown.',
  });
  tl.tween(cam, CAM_SPLANE, { at: t - 5.8, dur: 1.5, ease: ease.move });
  tl.tween(subU, 1, { at: t - 5.4, dur: 0.8, ease: ease.enter });
  tl.tween(planeU, 1, { at: t - 4.4, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.4);

  /* — beat 7 · three dancers — */
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'A cubic over the complex numbers has three roots. Watch them as the target wanders: three dancers in the complex plane — never merging, never leaving the floor.',
  });
  tl.tween(danceOn, 1, { at: t - 6.6, dur: 0.8, ease: ease.enter });
  tl.tween(danceT, 1, { at: t - 6.2, dur: 5.8, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 8 · what the dance means — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'Never merging is the constant determinant speaking: no folds, ever. Three dancers is the real headline: this map is an honest three to one cover of complex three-space.',
  });
  tl.tween(danceT, 2, { at: t - 6.4, dur: 6.0, ease: ease.linear });
  tl.tween(countU, 1, { at: t - 3.0, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.4);

  /* — beat 9 · as far from invertible as it gets — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Almost every point of the target space has exactly three preimages. An invertible map would have one. Keller did not fail by a technicality — he failed by a factor of three.',
  });
  tl.tween(danceT, 3, { at: t - 5.8, dur: 5.6, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 10 · the tease — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'But hold on. A three sheeted cover of a simply connected space is supposed to be impossible — that is a theorem. The final chapter is about the loophole.',
  });
  tl.tween(dimU, 0.9, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: t - 5.8, dur: 1.5, ease: ease.move });
  tl.tween(teaseU, 1, { at: t - 4.6, dur: 0.9, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, factU, sheetsU, crushU, formulaU, fiberU, subU, planeU, danceT, danceOn, countU, dimU, teaseU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

const quadPath = (q: Quad) => `M ${q.map((p) => p.join(' ')).join(' L ')} Z`;
const lerpQuad = (a: Quad, b: Quad, u: number): Quad => a.map((p, i) => [lerp(p[0], b[i][0], u), lerp(p[1], b[i][1], u)]) as Quad;

function FactorCard({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  return (
    <g opacity={a} transform={`translate(${FACT.x}, ${FACT.y + (1 - uu) * 10})`}>
      <rect width={FACT.w} height={FACT.h} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.8} />
      <MathLabel anchor="start" tex={'F_3 \\;=\\; 2x - 3x^2y - x^3z \\;=\\; -\\,x\\,(x^2 z + 3xy - 2)'} x={20} y={14} fontSize={16.5} color={colors.TEXT} opacity={uu} />
    </g>
  );
}

/** Two source sheets flatten onto the single target plane and spring back. */
function CrushDiagram({ u, crush, formula, fiber, dim }: { u: number; crush: number; formula: number; fiber: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  const cu = clamp01(crush);
  const fu = clamp01(fiber);
  const plane = lerpQuad(PLANE_Q, PLANE_FLAT, cu);
  const surfTop = lerpQuad(SURF_TOP, SURF_FLAT_TOP, cu);
  const surfBot = lerpQuad(SURF_BOT, SURF_FLAT_BOT, cu);
  const surfPath = `M ${surfTop[0].join(' ')} C ${surfTop[1].join(' ')} ${surfTop[2].join(' ')} ${surfTop[3].join(' ')} L ${surfBot[0].join(' ')} C ${surfBot[1].join(' ')} ${surfBot[2].join(' ')} ${surfBot[3].join(' ')} Z`;
  const riser = (from: { x: number; y: number; c: string; label: string }, i: number) => {
    const ru = clamp01(fu * 2.2 - i * 0.4);
    if (ru <= 0) return null;
    const yTop = from.y + (QPT.y - from.y) * (1 - ru);
    return (
      <g key={i}>
        <line x1={QPT.x} y1={QPT.y} x2={lerp(QPT.x, from.x, ru)} y2={yTop} stroke={from.c} strokeWidth={1.7} strokeDasharray="5 4" opacity={0.85} />
        <circle cx={from.x} cy={from.y} r={6.5 * ru} fill={from.c} />
        <text x={from.x + 12} y={from.y + 4} fill={from.c} fontSize={11.5} fontWeight={700} fontFamily={mono} opacity={ru}>
          {from.label}
        </text>
      </g>
    );
  };
  return (
    <g opacity={a}>
      {/* target plane */}
      <path d={quadPath(TARGET_Q)} fill={colors.NEGATIVE} fillOpacity={0.10} stroke={colors.NEGATIVE} strokeWidth={1.6} />
      <text x={TARGET_Q[3][0] + 6} y={TARGET_Q[3][1] + 22} fill={colors.NEGATIVE} fontSize={11.5} fontFamily={mono}>
        targets with third coordinate zero
      </text>
      {/* the curved surface */}
      <path d={surfPath} fill={colors.SECONDARY} fillOpacity={0.16} stroke={colors.SECONDARY} strokeWidth={1.8} />
      <MathLabel anchor="start" tex={'x^2 z + 3xy = 2'} x={SURF_TOP[0][0] + 8 + cu * 60} y={lerp(SURF_TOP[0][1], SURF_FLAT_TOP[0][1], cu) - 34} fontSize={13} color={colors.SECONDARY} opacity={a} />
      {/* the plane x = 0 */}
      <path d={quadPath(plane)} fill={colors.ACCENT} fillOpacity={0.16} stroke={colors.ACCENT} strokeWidth={1.8} />
      <MathLabel anchor="start" tex={'x = 0'} x={plane[0][0] + 10} y={plane[0][1] - 32} fontSize={13} color={colors.ACCENT} opacity={a} />
      {/* crush motion streaks */}
      {cu > 0.05 && cu < 0.98 && (
        <g opacity={0.5}>
          {[150, 250, 350].map((sx) => (
            <line key={sx} x1={sx} y1={300 + cu * 140} x2={sx} y2={330 + cu * 150} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="3 5" />
          ))}
        </g>
      )}
      {/* per-sheet image formulas */}
      {formula > 0 && (
        <g opacity={clamp01(formula)}>
          <MathLabel anchor="start" tex={'(0,y,z) \\mapsto (4y^2{+}z,\\ y,\\ 0)'} x={430} y={196} fontSize={13.5} color={colors.ACCENT} opacity={clamp01(formula) * a} />
          <MathLabel anchor="start" tex={'s = \\tfrac{1}{x}:\\ \\big((y{+}s)(y{+}2s),\\ 4y{+}6s,\\ 0\\big)'} x={430} y={330} fontSize={13.5} color={colors.SECONDARY} opacity={clamp01(formula) * a} />
          <MathLabel anchor="start" tex={'s^2 = \\tfrac{b^2 - 16a}{4}\\ \\Rightarrow\\ \\text{two } s'} x={430} y={368} fontSize={13.5} color={colors.SECONDARY} opacity={clamp01(formula) * a} />
        </g>
      )}
      {/* fiber assembly over (−1/4, 0, 0) */}
      {fu > 0 && (
        <g>
          <circle cx={QPT.x} cy={QPT.y} r={7} fill={colors.NEGATIVE} />
          <text x={QPT.x + 12} y={QPT.y + 18} fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
            (−1/4, 0, 0)
          </text>
          {riser(R1, 0)}
          {riser(R2, 1)}
          {riser(R3, 2)}
          {fu > 0.9 && (
            <text x={QPT.x - 120} y={QPT.y + 46} fill={colors.TEXT} fontSize={13} fontWeight={700} fontFamily={mono} opacity={(fu - 0.9) * 10}>
              fiber = 1 + 2 = 3 points
            </text>
          )}
        </g>
      )}
    </g>
  );
}

/** The complex s-plane where the three roots of the fiber cubic dance. */
function RootDance({ u, sub, tau, on, count, dim }: { u: number; sub: number; tau: number; on: number; count: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  const tt = tau % 1;
  const [ta, tb, tc] = loopPath(tt);
  const roots = rootsAt(LOOP_ROOTS, tt);
  const px = (re: number) => SP_CX + re * SP_SCALE;
  const py = (im: number) => SP_CY - im * SP_SCALE;
  const rootColors = [colors.ACCENT, colors.SECONDARY, colors.WARM];
  const onU = clamp01(on);
  // short trails from the precomputed samples
  const trailFor = (ri: number) => {
    const steps = 26;
    const pts: string[] = [];
    for (let k = steps; k >= 0; k--) {
      const tk = (tt - k * 0.004 + 1) % 1;
      const r = rootsAt(LOOP_ROOTS, tk)[ri];
      pts.push(`${k === steps ? 'M' : 'L'} ${px(r[0]).toFixed(1)} ${py(r[1]).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return (
    <g opacity={a}>
      <rect x={SPLANE.x} y={SPLANE.y} width={SPLANE.w} height={SPLANE.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} opacity={0.8} />
      <text x={SPLANE.x + 18} y={SPLANE.y + 26} fill={colors.MUTED} fontSize={12} fontWeight={700} fontFamily={mono}>
        the complex s plane · one dot per preimage
      </text>
      {/* axes + unit circle */}
      <line x1={SPLANE.x + 24} y1={SP_CY} x2={SPLANE.x + SPLANE.w - 24} y2={SP_CY} stroke={colors.GRID} strokeWidth={1} />
      <line x1={SP_CX} y1={SPLANE.y + 44} x2={SP_CX} y2={SPLANE.y + SPLANE.h - 20} stroke={colors.GRID} strokeWidth={1} />
      <circle cx={SP_CX} cy={SP_CY} r={SP_SCALE} fill="none" stroke={colors.GRID} strokeWidth={1} strokeDasharray="3 5" opacity={0.7} />
      {/* the fiber cubic */}
      {sub > 0 && (
        <g opacity={clamp01(sub)}>
          <MathLabel anchor="start" tex={'s = \\tfrac{1}{x},\\quad t = xy'} x={SPLANE.x + 18} y={SPLANE.y + 40} fontSize={13.5} color={colors.TEXT} opacity={clamp01(sub) * a} />
          <MathLabel anchor="start"
            tex={'2c\\,s^3 + (3bc - 4)\\,s^2 + \\Delta(a,b,c) = 0'}
            x={SPLANE.x + 210}
            y={SPLANE.y + 40}
            fontSize={14.5}
            color={colors.TEXT}
            opacity={clamp01(sub) * a}
          />
        </g>
      )}
      {/* the wandering target readout */}
      {onU > 0 && (
        <g opacity={onU}>
          <rect x={SPLANE.x + 18} y={SPLANE.y + SPLANE.h - 58} width={280} height={40} rx={8} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.1} />
          <text x={SPLANE.x + 32} y={SPLANE.y + SPLANE.h - 33} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
            target ({ta.toFixed(2)}, {tb.toFixed(2)}, {tc.toFixed(0)})
          </text>
          {roots.map((r, i) => (
            <g key={i}>
              <path d={trailFor(i)} fill="none" stroke={rootColors[i]} strokeWidth={1.6} opacity={0.45} />
              <circle cx={px(r[0])} cy={py(r[1])} r={7} fill={rootColors[i]} />
              <circle cx={px(r[0])} cy={py(r[1])} r={11.5} fill={rootColors[i]} opacity={0.22} />
            </g>
          ))}
        </g>
      )}
      {/* the counter */}
      {count > 0 && (
        <g opacity={clamp01(count)} transform={`translate(${SPLANE.x + SPLANE.w - 190}, ${SPLANE.y + SPLANE.h - 58})`}>
          <rect width={172} height={40} rx={8} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.6} />
          <text x={16} y={25} fill={colors.POSITIVE} fontSize={13.5} fontWeight={800} fontFamily={mono}>
            preimages: 3
          </text>
        </g>
      )}
    </g>
  );
}

/** Quiet close: the cover that should not exist. */
function TeaseCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${360}, ${250 + (1 - uu) * 12})`} opacity={uu}>
      <rect width={560} height={140} rx={14} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={2} />
      <text x={26} y={44} fill={colors.SECONDARY} fontSize={15} fontWeight={700} fontFamily={mono}>
        a 3-sheeted cover of ℂ³ · no folds anywhere
      </text>
      <text x={26} y={78} fill={colors.TEXT} fontSize={13.5} fontFamily={mono}>
        but ℂ³ is simply connected — covers like this cannot exist…
      </text>
      <text x={26} y={108} fill={colors.MUTED} fontSize={13.5} fontFamily={mono}>
        …unless the sheets can leak. next: the escape to infinity
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <FactorCard u={s.get(scene.factU)} dim={dim} />
      <CrushDiagram u={s.get(scene.sheetsU)} crush={s.get(scene.crushU)} formula={s.get(scene.formulaU)} fiber={s.get(scene.fiberU)} dim={dim} />
      <RootDance u={s.get(scene.planeU)} sub={s.get(scene.subU)} tau={s.get(scene.danceT)} on={s.get(scene.danceOn)} count={s.get(scene.countU)} dim={dim} />
      <TeaseCard u={s.get(scene.teaseU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
