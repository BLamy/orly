// Chapter 5 — The Escape to Infinity
//
// ONE persistent object: the three sheets of the cover, and where they go.
// det J ≡ −2 makes F a local biholomorphism (three smooth sheets); ℂ³ is
// simply connected, so a PROPER 3-sheeted cover could not exist — the
// loophole is properness. Driving the target along the verified segment
// (−1,1,1) → (−16/27,0,1), Δ = b²−16a+18abc−27a²c²−b³c runs −29 → 0 and the
// complex root pair of the fiber cubic spirals into s = 0, i.e. x = ∞: over
// the escape surface {Δ = 0} exactly ONE finite preimage remains — verified
// exactly: F(1/2, −8/3, 16) = (−16/27, 0, 1) and no other. Aftermath: Keller
// false for all n ≥ 3 (pad with identity coordinates), Smale's 16th settled,
// Dixmier for the third Weyl algebra falls (DC ⇒ JC); n = 2 remains open.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { trackRoots, rootsAt, delta } from './roots';
import type { Cx } from './roots';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ------------------------------------------------------------- the math */
// the verified escape segment: target (−1, 1, 1) → (−16/27, 0, 1);
// Δ runs −29 → 0 with a single touch at the endpoint (checked numerically).
const SEG_N = 241;
const A1 = -16 / 27;
const segPath = (tau: number): [number, number, number] => [lerp(-1, A1, tau), lerp(1, 0, tau), 1];
const SEG_ROOTS = trackRoots(segPath, SEG_N);
const invC = (s: Cx): Cx => {
  const d = s[0] * s[0] + s[1] * s[1] || 1e-9;
  return [s[0] / d, -s[1] / d];
};

/* ---------------------------------------------------------------- layout */
const SHEETS = { x: 70, y: 96, w: 500, h: 250 };
const TOPO = { x: 70, y: 380, w: 500, h: 110 };
const SPL = { x: 650, y: 90, w: 550, h: 320 };
const SP_CX = SPL.x + SPL.w / 2;
const SP_CY = SPL.y + SPL.h / 2 + 16;
const SP_SCALE = 52;
const XV = { x: 650, y: 440, w: 550, h: 170 };
const XV_CX = XV.x + XV.w / 2;
const XV_CY = XV.y + XV.h / 2 + 8;
const XV_SCALE = 58;
const LADDER = { x: 70, y: 110, w: 500, rowH: 46, gap: 10 };
const RECAP = { x: 78, y: 560, w: 250, h: 52, gap: 16 };
const PROV = { x: 340, y: 200, w: 600, h: 240 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_SHEETS: CameraState = { x: 360, y: 280, k: 1.1 };
const CAM_SPL: CameraState = { x: 900, y: 300, k: 1.05 };
const CAM_XV: CameraState = { x: 900, y: 420, k: 1.02 };
const CAM_LADDER: CameraState = { x: 400, y: 280, k: 1.06 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 0.96 };

const FALLS: [string, string][] = [
  ['falls', 'Keller 1939 — every dimension three and up'],
  ['falls', 'Smale problem 16 — settled, in the negative'],
  ['falls', 'Dixmier conjecture, Weyl algebra A₃ (it implied Keller)'],
  ['open', 'the plane n = 2 — the question still breathes'],
];

const RECAPS = ['det J ≡ −2', '3 points → 1 image', 'two crushed surfaces', 'sheets escape to ∞'];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const sheetsU = tl.channel('sheetsU', 0); // the 3-sheet cover picture
  const topoU = tl.channel('topoU', 0); // simply connected card
  const splU = tl.channel('splU', 0); // s-plane panel
  const driveT = tl.channel('driveT', 0); // walk to the escape surface
  const xvU = tl.channel('xvU', 0); // honest-coordinates view
  const survU = tl.channel('survU', 0); // the lone survivor chip
  const deltaU = tl.channel('deltaU', 0); // Δ card
  const leftDim = tl.channel('leftDim', 0); // whisper the left column during the drive
  const leftOff = tl.channel('leftOff', 0); // clear left column for the ladder
  const ladderN = tl.channel('ladderN', 0);
  const dimU = tl.channel('dimU', 0);
  const recapN = tl.channel('recapN', 0);
  const provU = tl.channel('provU', 0);

  /* — beat 1 · three smooth sheets — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'One puzzle remains. A constant determinant makes the map a local isomorphism at every point, so it spreads three smooth sheets over its targets — a covering, wherever the sheets hold.',
  });
  tl.tween(cam, CAM_SHEETS, { at: t - 6.2, dur: 1.4, ease: ease.move });
  tl.tween(sheetsU, 1, { at: t - 5.8, dur: 1.6, ease: ease.draw });
  t = tl.hold(t, 0.5);

  /* — beat 2 · the iron rule — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'And topology has an iron rule: over a simply connected space, a connected three sheeted cover cannot exist. Complex three-space is as simply connected as spaces get.',
  });
  tl.tween(topoU, 1, { at: t - 5.6, dur: 0.9, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 3 · what the conjecture really was — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'So Keller was never really betting on calculus. He was betting that the sheets can never slip out the side of the picture. Here is the slip, live.',
  });
  tl.tween(cam, CAM_SPL, { at: t - 5.4, dur: 1.5, ease: ease.move });
  tl.tween(leftDim, 1, { at: t - 5.4, dur: 1.2, ease: ease.move });
  tl.tween(splU, 1, { at: t - 4.8, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.4);

  /* — beat 4 · drive to the wall — */
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'Walk the target toward one special surface and watch the three roots. Two of them spiral together — straight into the point that stands for x equals infinity.',
  });
  tl.tween(driveT, 1, { at: t - 6.6, dur: 6.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 5 · honest coordinates — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'In honest coordinates, those two preimages are racing off the edge of space. At the wall, exactly one preimage of the target remains: one half, minus eight thirds, sixteen.',
  });
  tl.tween(cam, CAM_XV, { at: t - 6.4, dur: 1.4, ease: ease.move });
  tl.tween(xvU, 1, { at: t - 6.0, dur: 0.9, ease: ease.enter });
  tl.tween(driveT, 0.35, { at: t - 5.2, dur: 0.01, ease: ease.linear });
  tl.tween(driveT, 1, { at: t - 5.0, dur: 4.4, ease: ease.move });
  tl.tween(survU, 1, { at: t - 1.4, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 6 · the escape surface — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'There is a whole cubic surface of such targets. Cross it, and two sheets of the cover simply are not there anymore. The map has no folds — but it is not proper. Points can leave.',
  });
  tl.tween(deltaU, 1, { at: t - 5.8, dur: 0.9, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 7 · the loophole, named — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'That is the loophole. The covering argument needs sheets that stay. These leak to infinity, and eighty-seven years of intuition leaked out with them.',
  });
  t = tl.hold(t, 0.5);

  /* — beat 8 · the damage list — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'The damage list. Keller’s conjecture: false in dimension three, and false in every higher dimension — just pad the map with coordinates it never touches.',
  });
  tl.tween(leftOff, 1, { at: t - 6.0, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_LADDER, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(ladderN, 1, { at: t - 4.4, dur: 0.7, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 9 · Smale and Dixmier — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Smale’s sixteenth problem: settled in the negative. And the Dixmier conjecture for the third Weyl algebra falls with it, because Dixmier would have implied Keller.',
  });
  tl.tween(ladderN, 3, { at: t - 5.8, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 10 · the survivor — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'One question survives untouched: the plane. In two variables nobody has found a counterexample — this one needed a third dimension to hide its crushed surfaces in.',
  });
  tl.tween(ladderN, 4, { at: t - 5.0, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 11 · the recap — */
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'The whole disproof, one more time: a determinant that collapses to minus two. Three points with one image. Two surfaces crushed onto one plane. And an escape hatch at infinity.',
  });
  tl.tween(dimU, 0.85, { at: t - 6.6, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: t - 6.6, dur: 1.5, ease: ease.move });
  tl.tween(recapN, 4, { at: t - 5.6, dur: 3.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 12 · provenance — */
  t = tl.caption({
    at: t,
    dur: 7.4,
    text: 'It was announced on the day of the World Cup final, in a post short enough to fit in a caption, and every claim in it checks by hand. Some eras end with a treatise. This one ended with a tweet.',
  });
  tl.tween(provU, 1, { at: t - 6.2, dur: 1.0, ease: ease.enter });
  tl.hold(t, 1.2);

  return { tl, cam, sheetsU, topoU, splU, driveT, xvU, survU, deltaU, leftDim, leftOff, ladderN, dimU, recapN, provU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** Three sheets over a base — the picture Keller's era trusted. */
function SheetStack({ u, off, ldim, dim }: { u: number; off: number; ldim: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.9 * clamp01(dim)) * (1 - clamp01(off)) * (1 - 0.85 * clamp01(ldim));
  if (a <= 0.01) return null;
  const { x, w } = SHEETS;
  const sheetY = [130, 188, 246];
  const sheetC = [colors.ACCENT, colors.SECONDARY, colors.WARM];
  const baseY = 320;
  return (
    <g opacity={a}>
      {sheetY.map((sy, i) => {
        const d = clamp01(uu * 2.4 - i * 0.5);
        if (d <= 0) return null;
        return (
          <g key={i} opacity={d}>
            <path
              d={`M ${x} ${sy + 12} C ${x + w * 0.3} ${sy - 14}, ${x + w * 0.6} ${sy + 26}, ${x + w} ${sy - 4}`}
              fill="none"
              stroke={sheetC[i]}
              strokeWidth={2.4}
              strokeDasharray={String(w * 1.2)}
              strokeDashoffset={w * 1.2 * (1 - d)}
            />
            <text x={x + w + 10} y={sy + 2} fill={sheetC[i]} fontSize={11.5} fontFamily={mono}>
              sheet {i + 1}
            </text>
          </g>
        );
      })}
      <line x1={x} y1={baseY} x2={x + w} y2={baseY} stroke={colors.MUTED} strokeWidth={2} />
      <text x={x} y={baseY + 22} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        the target space ℂ³ — every loop shrinks to a point
      </text>
      {[0.28, 0.55, 0.8].map((f) => (
        <line key={f} x1={x + w * f} y1={140} x2={x + w * f} y2={baseY} stroke={colors.GRID} strokeWidth={1} strokeDasharray="3 6" opacity={0.7} />
      ))}
    </g>
  );
}

/** π₁(ℂ³) = 1: a proper connected 3-sheet cover is impossible. */
function TopologyCard({ u, off, ldim, dim }: { u: number; off: number; ldim: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.9 * clamp01(dim)) * (1 - clamp01(off)) * (1 - 0.85 * clamp01(ldim));
  if (a <= 0.01) return null;
  return (
    <g opacity={a} transform={`translate(${TOPO.x}, ${TOPO.y + (1 - uu) * 10})`}>
      <rect width={TOPO.w} height={TOPO.h} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
      <MathLabel anchor="start" tex={'\\pi_1(\\mathbb{C}^3) = 1'} x={22} y={16} fontSize={17} color={colors.WARM} opacity={a} />
      <text x={190} y={40} fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>
        proper étale + simply connected base
      </text>
      <text x={190} y={62} fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>
        ⇒ one sheet only. so… how?
      </text>
      <text x={22} y={92} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        the assumption to attack: “proper” — sheets that never run away
      </text>
    </g>
  );
}

/** The s-plane drive: the root pair spirals into s = 0 as Δ → 0. */
function EscapeDrive({ u, tau, dlt, dim }: { u: number; tau: number; dlt: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  const tt = clamp01(tau);
  const [ta, tb, tc] = segPath(tt);
  const D = delta(ta, tb, tc);
  const roots = rootsAt(SEG_ROOTS, tt);
  const px = (re: number) => SP_CX + re * SP_SCALE;
  const py = (im: number) => SP_CY - im * SP_SCALE;
  // the tracked pair (indices 0 and 2) escapes; index 1 is the survivor s = 2
  const rc = [colors.NEGATIVE, colors.POSITIVE, colors.NEGATIVE];
  const trailFor = (ri: number) => {
    const steps = 30;
    const pts: string[] = [];
    for (let k = steps; k >= 0; k--) {
      const tk = Math.max(0, tt - k * 0.012);
      const r = rootsAt(SEG_ROOTS, tk)[ri];
      pts.push(`${k === steps ? 'M' : 'L'} ${px(r[0]).toFixed(1)} ${py(r[1]).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return (
    <g opacity={a}>
      <rect x={SPL.x} y={SPL.y} width={SPL.w} height={SPL.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} opacity={0.8} />
      <text x={SPL.x + 18} y={SPL.y + 26} fill={colors.MUTED} fontSize={12} fontWeight={700} fontFamily={mono}>
        the s plane · s = 0 stands for x = ∞
      </text>
      <line x1={SPL.x + 24} y1={SP_CY} x2={SPL.x + SPL.w - 24} y2={SP_CY} stroke={colors.GRID} strokeWidth={1} />
      <line x1={SP_CX} y1={SPL.y + 40} x2={SP_CX} y2={SPL.y + SPL.h - 16} stroke={colors.GRID} strokeWidth={1} />
      {/* the doorway to infinity */}
      <circle cx={SP_CX} cy={SP_CY} r={9} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} strokeDasharray="3 4" />
      <text x={SP_CX + 14} y={SP_CY - 10} fill={colors.NEGATIVE} fontSize={11} fontFamily={mono} opacity={0.85}>
        x = ∞
      </text>
      {roots.map((r, i) => (
        <g key={i}>
          <path d={trailFor(i)} fill="none" stroke={rc[i]} strokeWidth={1.6} opacity={0.45} />
          <circle cx={px(r[0])} cy={py(r[1])} r={7} fill={rc[i]} />
          <circle cx={px(r[0])} cy={py(r[1])} r={11.5} fill={rc[i]} opacity={0.2} />
        </g>
      ))}
      {/* Δ readout riding the drive */}
      <rect x={SPL.x + 18} y={SPL.y + SPL.h - 54} width={300} height={38} rx={8} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.1} />
      <text x={SPL.x + 32} y={SPL.y + SPL.h - 30} fill={D > -0.5 ? colors.NEGATIVE : colors.MUTED} fontSize={12.5} fontFamily={mono}>
        target ({ta.toFixed(2)}, {tb.toFixed(2)}, 1) · Δ = {D.toFixed(1)}
      </text>
      {/* the escape surface card */}
      {dlt > 0 && (
        <g opacity={clamp01(dlt)}>
          <rect x={SPL.x + 296} y={SPL.y + 40} width={240} height={62} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.5} />
          <text x={SPL.x + 310} y={SPL.y + 60} fill={colors.NEGATIVE} fontSize={11} fontWeight={700} fontFamily={mono}>
            Δ = 0 — the escape surface
          </text>
          <MathLabel anchor="start"
            tex={'\\Delta = b^2\\!-\\!16a+18abc-27a^2c^2-b^3c'}
            x={SPL.x + 310}
            y={SPL.y + 66}
            fontSize={10}
            color={colors.NEGATIVE}
            opacity={clamp01(dlt) * a}
            boxWidth={220}
          />
        </g>
      )}
    </g>
  );
}

/** Honest coordinates: x = 1/s. Two dots leave the window; one stays. */
function HonestView({ u, tau, surv, dim }: { u: number; tau: number; surv: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  const tt = clamp01(tau);
  const roots = rootsAt(SEG_ROOTS, tt);
  const xs = roots.map(invC);
  const rc = [colors.NEGATIVE, colors.POSITIVE, colors.NEGATIVE];
  const px = (re: number) => XV_CX + re * XV_SCALE;
  const py = (im: number) => XV_CY - im * XV_SCALE;
  const sv = clamp01(surv);
  return (
    <g opacity={a}>
      <clipPath id="jc5-xclip">
        <rect x={XV.x} y={XV.y} width={XV.w} height={XV.h} rx={14} />
      </clipPath>
      <rect x={XV.x} y={XV.y} width={XV.w} height={XV.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} opacity={0.8} />
      <text x={XV.x + 18} y={XV.y + 24} fill={colors.MUTED} fontSize={12} fontWeight={700} fontFamily={mono}>
        honest coordinates · the three preimages, x = 1/s
      </text>
      <g clipPath="url(#jc5-xclip)">
        <line x1={XV.x + 20} y1={XV_CY} x2={XV.x + XV.w - 20} y2={XV_CY} stroke={colors.GRID} strokeWidth={1} />
        {xs.map((xp, i) => {
          const mag = Math.hypot(xp[0], xp[1]);
          const gone = clamp01((mag - 3.2) / 1.6);
          return (
            <g key={i} opacity={1 - gone}>
              <circle cx={px(xp[0])} cy={py(xp[1])} r={7} fill={rc[i]} />
              {i !== 1 && mag > 1.4 && (
                <line
                  x1={px(xp[0] * 0.82)}
                  y1={py(xp[1] * 0.82)}
                  x2={px(xp[0])}
                  y2={py(xp[1])}
                  stroke={rc[i]}
                  strokeWidth={1.6}
                  opacity={0.6}
                />
              )}
            </g>
          );
        })}
      </g>
      {sv > 0 && (
        <g opacity={sv} transform={`translate(${XV.x + XV.w - 260}, ${XV.y + XV.h - 52})`}>
          <rect width={242} height={38} rx={8} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.6} />
          <text x={14} y={24} fill={colors.POSITIVE} fontSize={12.5} fontWeight={700} fontFamily={mono}>
            lone survivor (1/2, −8/3, 16)
          </text>
        </g>
      )}
    </g>
  );
}

/** What falls, what survives. */
function Aftermath({ n, dim }: { n: number; dim: number }) {
  if (n <= 0) return null;
  const a = 1 - 0.85 * clamp01(dim);
  return (
    <g opacity={a}>
      <text x={LADDER.x} y={LADDER.y - 18} fill={colors.MUTED} fontSize={12.5} fontWeight={700} fontFamily={mono}>
        aftermath
      </text>
      {FALLS.map(([kind, line], i) => {
        const u = clamp01(n - i);
        if (u <= 0) return null;
        const ry = LADDER.y + i * (LADDER.rowH + LADDER.gap);
        const open = kind === 'open';
        const c = open ? colors.POSITIVE : colors.NEGATIVE;
        return (
          <g key={i} transform={`translate(${LADDER.x}, ${ry + (1 - u) * 8})`} opacity={u}>
            <rect width={LADDER.w} height={LADDER.rowH} rx={9} fill={colors.PANEL} stroke={c} strokeWidth={1.5} />
            <text x={16} y={LADDER.rowH / 2 + 4.5} fill={c} fontSize={12} fontWeight={800} fontFamily={mono}>
              {open ? 'OPEN' : 'FALLS'}
            </text>
            <text x={86} y={LADDER.rowH / 2 + 4.5} fill={colors.TEXT} fontSize={12} fontFamily={mono}>
              {line}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The four-step recap strip. */
function RecapStrip({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <g>
      {RECAPS.map((label, i) => {
        const u = clamp01(n - i);
        if (u <= 0) return null;
        const rx = RECAP.x + i * (RECAP.w + RECAP.gap);
        return (
          <g key={i} transform={`translate(${rx}, ${RECAP.y + (1 - u) * 8})`} opacity={u}>
            <rect width={RECAP.w} height={RECAP.h} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
            <text x={14} y={22} fill={colors.ACCENT} fontSize={11} fontWeight={700} fontFamily={mono}>
              step {i + 1}
            </text>
            <text x={14} y={40} fill={colors.TEXT} fontSize={11.5} fontFamily={mono}>
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The closing card. */
function Provenance({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${PROV.x}, ${PROV.y + (1 - uu) * 14})`} opacity={uu}>
      <rect width={PROV.w} height={PROV.h} rx={16} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} />
      <text x={28} y={44} fill={colors.WARM} fontSize={15} fontWeight={800} fontFamily={mono}>
        the Jacobian conjecture · 1939 — 2026
      </text>
      <text x={28} y={80} fill={colors.TEXT} fontSize={13} fontFamily={mono}>
        announced July 19, 2026 — during the World Cup final
      </text>
      <MathLabel anchor="start" tex={'\\det DF \\equiv -2, \\qquad F(p_1)=F(p_2)=F(p_3)'} x={28} y={100} fontSize={15} color={colors.TEXT} opacity={uu} />
      <text x={28} y={156} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
        every identity in this book re-verified in exact arithmetic
      </text>
      <text x={28} y={182} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
        a derivative, some fractions — and an escape hatch at infinity
      </text>
      <text x={28} y={216} fill={colors.WARM} fontSize={12.5} fontWeight={700} fontFamily={mono}>
        check it yourself. it fits on an index card.
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const off = clamp01(s.get(scene.leftOff));
  return (
    <>
      <SheetStack u={s.get(scene.sheetsU)} off={off} ldim={s.get(scene.leftDim)} dim={dim} />
      <TopologyCard u={s.get(scene.topoU)} off={off} ldim={s.get(scene.leftDim)} dim={dim} />
      <EscapeDrive u={s.get(scene.splU)} tau={s.get(scene.driveT)} dlt={s.get(scene.deltaU)} dim={dim} />
      <HonestView u={s.get(scene.xvU)} tau={s.get(scene.driveT)} surv={s.get(scene.survU)} dim={dim} />
      <Aftermath n={s.get(scene.ladderN)} dim={dim} />
      <RecapStrip n={s.get(scene.recapN)} />
      <Provenance u={s.get(scene.provU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
