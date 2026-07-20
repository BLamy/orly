// Chapter 3 — Three Points, One Image
//
// ONE persistent object: three marked points of the source space —
// (0, 0, −1/4), (1, −3/2, 13/2), (−1, 3/2, 13/2) — whose images under the
// announced map coincide at (−1/4, 0, 0). The worksheet beats replay the
// exact fraction arithmetic for the second point (−13/16 + 9/16 = −1/4;
// −3/2 + 39/8 − 27/8 = 0; 2 + 9/2 − 13/2 = 0), the mirror beat uses the
// verified equivariance F(−x,−y,z) = (F1, −F2, −F3), and the collision kills
// injectivity — hence the conjecture. All identities checked symbolically
// and in exact rational arithmetic for this book.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const SRC = { x: 70, y: 120, w: 480, h: 430 };
const TGT = { x: 730, y: 120, w: 480, h: 430 };
const WS = { x: 330, y: 140, w: 620, h: 360 };
const VERDICT = { x: 370, y: 190, w: 540, h: 240 };

const P1 = { x: 300, y: 445, label: '(0, 0, −1/4)', c: colors.ACCENT };
const P2 = { x: 470, y: 220, label: '(1, −3/2, 13/2)', c: colors.SECONDARY };
const P3 = { x: 155, y: 220, label: '(−1, 3/2, 13/2)', c: colors.WARM };
const Q = { x: 965, y: 330, label: '(−1/4, 0, 0)' };
const MIRROR_X = 312; // the σ mirror inside the source panel

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_SRC: CameraState = { x: 350, y: 340, k: 1.12 };
const CAM_WS: CameraState = { x: 640, y: 330, k: 1.1 };
const CAM_BOTH: CameraState = { x: 640, y: 340, k: 1.0 };
const CAM_TGT: CameraState = { x: 900, y: 340, k: 1.1 };

// the P2 worksheet: exact fractions, line by line (verified)
const WS_LINES: [string, boolean][] = [
  ['x = 1, \\quad y = -\\tfrac{3}{2}, \\quad z = \\tfrac{13}{2}', false],
  ['u = 1 + xy = -\\tfrac{1}{2}', false],
  ['F_1 = u^3 z + y^2 u\\,(4+3xy) = -\\tfrac{13}{16} + \\tfrac{9}{16} = -\\tfrac{1}{4}', true],
  ['F_2 = y + 3xu^2 z + 3xy^2(4+3xy) = -\\tfrac{3}{2} + \\tfrac{39}{8} - \\tfrac{27}{8} = 0', true],
  ['F_3 = 2x - 3x^2 y - x^3 z = 2 + \\tfrac{9}{2} - \\tfrac{13}{2} = 0', true],
];

// flight paths: quadratic beziers from each source point to the shared image
const FLIGHTS = [P1, P2, P3].map((p, i) => ({
  x0: SRC.x + 0,
  p,
  ctrlY: [70, -60, -110][i],
  delay: i * 0.16,
}));

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const srcU = tl.channel('srcU', 0);
  const tgtU = tl.channel('tgtU', 0);
  const ptsN = tl.channel('ptsN', 0); // the three points
  const wsU = tl.channel('wsU', 0); // worksheet card
  const wsN = tl.channel('wsN', 0); // worksheet lines revealed
  const mirrorU = tl.channel('mirrorU', 0); // σ mirror sweep
  const eqU = tl.channel('eqU', 0); // equivariance card
  const flyU = tl.channel('flyU', 0); // the three trails
  const hitU = tl.channel('hitU', 0); // collision flash
  const verdictU = tl.channel('verdictU', 0);
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · the corpse, delivered — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Chapter two ended with a promise. Here it is: three perfectly ordinary points of complex three-space, sitting in the source of our map.',
  });
  tl.tween(cam, CAM_SRC, { at: t - 5.6, dur: 1.4, ease: ease.move });
  tl.tween(srcU, 1, { at: t - 5.2, dur: 1.0, ease: ease.enter });
  tl.tween(ptsN, 3, { at: t - 4.2, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 2 · name them — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'The first sits at zero, zero, minus one quarter. The other two are mirror partners: one, minus three halves, thirteen halves — and its reflection across the origin in the first two coordinates.',
  });
  t = tl.hold(t, 0.5);

  /* — beat 3 · the arithmetic, part one — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'Feed the second point to the map and just do the fractions. The gear u becomes minus one half. Cube it, multiply by thirteen halves: minus thirteen sixteenths.',
  });
  tl.tween(cam, CAM_WS, { at: t - 6.2, dur: 1.4, ease: ease.move });
  tl.tween(wsU, 1, { at: t - 5.8, dur: 0.8, ease: ease.enter });
  tl.tween(wsN, 2.4, { at: t - 5.0, dur: 2.6, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 4 · the first output lands — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The second piece contributes plus nine sixteenths. Add them: minus one quarter. The first output lands exactly where the first point is headed.',
  });
  tl.tween(wsN, 3, { at: t - 5.4, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 5 · the other two outputs die — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The second and third outputs both telescope to zero. Nothing here is approximate — it is fraction arithmetic, and it closes.',
  });
  tl.tween(wsN, 5, { at: t - 5.2, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 6 · symmetry handles the third point — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'Symmetry does the third point for free. Flip the signs of x and y, and the map flips the signs of its last two outputs. Those outputs are zero — so the image is identical.',
  });
  tl.tween(wsU, 0, { at: t - 6.4, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_SRC, { at: t - 6.2, dur: 1.2, ease: ease.move });
  tl.tween(mirrorU, 1, { at: t - 5.0, dur: 1.4, ease: ease.draw });
  tl.tween(eqU, 1, { at: t - 3.4, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 7 · watch all three at once — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Now watch all three at once. Three different starting points, one map, and every trail bends toward the same landing site: minus one quarter, zero, zero.',
  });
  tl.tween(cam, CAM_BOTH, { at: t - 6.2, dur: 1.4, ease: ease.move });
  tl.tween(tgtU, 1, { at: t - 6.0, dur: 0.9, ease: ease.enter });
  tl.tween(mirrorU, 0, { at: t - 6.0, dur: 0.6, ease: ease.move });
  tl.tween(flyU, 1, { at: t - 5.0, dur: 3.2, ease: ease.move });
  tl.tween(hitU, 1, { at: t - 1.6, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 8 · injectivity dies, and that is everything — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'Three distinct inputs, one output. The map is not one to one. And for polynomial maps of complex space, one to one is exactly what invertible means — an injective polynomial map inverts automatically.',
  });
  tl.tween(cam, CAM_TGT, { at: t - 6.2, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 9 · the verdict — */
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Constant determinant minus two. Three points, one image. Together those two facts end an eighty-seven year conjecture. What remains is to understand how the map gets away with it.',
  });
  tl.tween(dimU, 0.9, { at: t - 6.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_HOME, { at: t - 6.4, dur: 1.5, ease: ease.move });
  tl.tween(verdictU, 1, { at: t - 5.2, dur: 0.9, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, srcU, tgtU, ptsN, wsU, wsN, mirrorU, eqU, flyU, hitU, verdictU, dimU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

function SpacePanel({ u, title, x, w, dim }: { u: number; title: string; x: number; w: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  return (
    <g opacity={a}>
      <rect x={x} y={SRC.y} width={w} height={SRC.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} opacity={0.75} />
      <text x={x + 18} y={SRC.y + 28} fill={colors.MUTED} fontSize={12.5} fontWeight={700} fontFamily={mono}>
        {title}
      </text>
      {/* a light axes triad so the panel reads as a space, not a slide */}
      <g opacity={0.5} transform={`translate(${x + 42}, ${SRC.y + SRC.h - 44})`}>
        <line x1={0} y1={0} x2={40} y2={0} stroke={colors.MUTED} strokeWidth={1.2} />
        <line x1={0} y1={0} x2={0} y2={-40} stroke={colors.MUTED} strokeWidth={1.2} />
        <line x1={0} y1={0} x2={-24} y2={22} stroke={colors.MUTED} strokeWidth={1.2} />
      </g>
    </g>
  );
}

function SourcePoints({ n, mirror, dim }: { n: number; mirror: number; dim: number }) {
  if (n <= 0) return null;
  const a = 1 - 0.88 * clamp01(dim);
  const pts = [P1, P2, P3];
  const m = clamp01(mirror);
  return (
    <g opacity={a}>
      {m > 0 && (
        <g opacity={m}>
          <line x1={MIRROR_X} y1={SRC.y + 40} x2={MIRROR_X} y2={SRC.y + SRC.h - 20} stroke={colors.WARM} strokeWidth={1.6} strokeDasharray="6 6" />
          <text x={MIRROR_X} y={SRC.y + 56} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={mono}>
            σ : (x, y, z) ↦ (−x, −y, z)
          </text>
          <path
            d={`M ${P2.x - 14} ${P2.y - 26} Q ${MIRROR_X} ${P2.y - 64} ${P3.x + 14} ${P3.y - 26}`}
            fill="none"
            stroke={colors.WARM}
            strokeWidth={1.6}
            strokeDasharray="120"
            strokeDashoffset={120 * (1 - m)}
          />
        </g>
      )}
      {pts.map((p, i) => {
        const u = clamp01(n - i);
        if (u <= 0) return null;
        return (
          <g key={i} opacity={u}>
            <circle cx={p.x} cy={p.y} r={8} fill={p.c} />
            <circle cx={p.x} cy={p.y} r={13} fill={p.c} opacity={0.22} />
            <text x={p.x} y={p.y + (i === 0 ? 28 : -18)} textAnchor="middle" fill={p.c} fontSize={12.5} fontWeight={700} fontFamily={mono}>
              {p.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function TargetPoint({ u, hit, dim }: { u: number; hit: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.6 * clamp01(dim));
  const h = clamp01(hit);
  return (
    <g opacity={a}>
      <circle cx={Q.x} cy={Q.y} r={9} fill={colors.NEGATIVE} />
      <circle cx={Q.x} cy={Q.y} r={16 + 18 * h} fill={colors.NEGATIVE} opacity={0.3 * (1 - 0.5 * h)} />
      {h > 0 && <circle cx={Q.x} cy={Q.y} r={30 + 26 * h} fill="none" stroke={colors.NEGATIVE} strokeWidth={2 * (1 - h)} opacity={1 - h} />}
      <text x={Q.x} y={Q.y + 34} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontWeight={700} fontFamily={mono}>
        {Q.label}
      </text>
      {h > 0.5 && (
        <text x={Q.x} y={Q.y - 30} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={mono} opacity={(h - 0.5) * 2}>
          three arrivals, one address
        </text>
      )}
    </g>
  );
}

/** Ghost dots fly the beziers from each source point to the shared image. */
function Flights({ u }: { u: number }) {
  const fu = clamp01(u);
  if (fu <= 0) return null;
  return (
    <g>
      {FLIGHTS.map((f, i) => {
        const p = clamp01((fu - f.delay) / (1 - 0.32));
        if (p <= 0) return null;
        const x0 = f.p.x;
        const y0 = f.p.y;
        const mx = (x0 + Q.x) / 2;
        const my = Math.min(y0, Q.y) + f.ctrlY;
        const om = 1 - p;
        const bx = om * om * x0 + 2 * om * p * mx + p * p * Q.x;
        const by = om * om * y0 + 2 * om * p * my + p * p * Q.y;
        const dpath = `M ${x0} ${y0} Q ${mx} ${my} ${Q.x} ${Q.y}`;
        return (
          <g key={i}>
            <path d={dpath} fill="none" stroke={f.p.c} strokeWidth={1.6} strokeDasharray="900" strokeDashoffset={900 * (1 - p)} opacity={0.5} />
            {p < 1 && <circle cx={bx} cy={by} r={6} fill={f.p.c} />}
          </g>
        );
      })}
    </g>
  );
}

/** The exact-fraction worksheet for the second point. */
function Worksheet({ u, n, dim }: { u: number; n: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  return (
    <g opacity={a} transform={`translate(${WS.x}, ${WS.y + (1 - uu) * 12})`}>
      <rect width={WS.w} height={WS.h} rx={14} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={2} />
      <text x={22} y={34} fill={colors.SECONDARY} fontSize={13.5} fontWeight={700} fontFamily={mono}>
        checking the second point — exact fractions only
      </text>
      {WS_LINES.map(([tex, hasCheck], i) => {
        const lu = clamp01(n - i);
        if (lu <= 0) return null;
        return (
          <g key={i} opacity={lu}>
            <MathLabel anchor="start" tex={tex} x={26} y={52 + i * 58} fontSize={15.5} color={colors.TEXT} opacity={lu} boxWidth={WS.w - 100} />
            {hasCheck && lu > 0.8 && (
              <text x={WS.w - 44} y={78 + i * 58} fill={colors.POSITIVE} fontSize={18} fontWeight={800} opacity={(lu - 0.8) * 5}>
                ✓
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** F ∘ σ = (F1, −F2, −F3): the mirror pairing, verified symbolically. */
function EquivarianceCard({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  return (
    <g opacity={a} transform={`translate(${SRC.x + 40}, ${SRC.y + SRC.h + 12})`}>
      <rect width={400} height={44} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
      <MathLabel anchor="start" tex={'F(-x,\\,-y,\\,z) \\;=\\; (F_1,\\ -F_2,\\ -F_3)'} x={18} y={8} fontSize={14.5} color={colors.WARM} opacity={uu} />
    </g>
  );
}

/** Keller's card returns — and takes the stamp. */
function VerdictCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const stamp = clamp01(uu * 2 - 1);
  return (
    <g transform={`translate(${VERDICT.x}, ${VERDICT.y + (1 - uu) * 12})`} opacity={uu}>
      <rect width={VERDICT.w} height={VERDICT.h} rx={14} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={24} y={38} fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={mono}>
        the Jacobian conjecture · Keller 1939
      </text>
      <MathLabel anchor="start" tex={'\\det DF \\equiv \\text{const} \\neq 0 \\ \\Longrightarrow\\ F \\ \\text{injective}'} x={24} y={64} fontSize={16} color={colors.TEXT} opacity={uu} />
      <MathLabel anchor="start" tex={'\\det DF = -2, \\qquad F(p_1) = F(p_2) = F(p_3)'} x={24} y={110} fontSize={16} color={colors.TEXT} opacity={uu} />
      {stamp > 0 && (
        <g transform={`translate(${VERDICT.w - 170}, ${150}) rotate(-9) scale(${1.6 - 0.6 * stamp})`} opacity={stamp}>
          <rect x={-78} y={-30} width={156} height={60} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={4} />
          <text textAnchor="middle" y={12} fill={colors.NEGATIVE} fontSize={34} fontWeight={900} fontFamily={mono} letterSpacing={4}>
            FALSE
          </text>
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <SpacePanel u={s.get(scene.srcU)} title="source · ℂ³" x={SRC.x} w={SRC.w} dim={dim} />
      <SpacePanel u={s.get(scene.tgtU)} title="target · ℂ³" x={TGT.x} w={TGT.w} dim={dim} />
      <SourcePoints n={s.get(scene.ptsN)} mirror={s.get(scene.mirrorU)} dim={dim} />
      <Flights u={s.get(scene.flyU)} />
      <TargetPoint u={s.get(scene.tgtU)} hit={s.get(scene.hitU)} dim={dim} />
      <EquivarianceCard u={s.get(scene.eqU)} dim={dim} />
      <Worksheet u={s.get(scene.wsU)} n={s.get(scene.wsN)} dim={dim} />
      <VerdictCard u={s.get(scene.verdictU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
