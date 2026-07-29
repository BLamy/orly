// Chapter 2 — The Determinant That Collapses
//
// ONE persistent object: the 3×3 Jacobian of the announced map. Its nine
// entries (term counts 5,6,4 / 5,5,3 / 3,1,1 — computed symbolically for this
// book) feed six signed permutation products of 13, 9, 14, 17, 11 and 18
// monomials — 82 in all — which annihilate down to the constant −2. A live
// probe recomputes det J numerically in-frame from hand-derived partials
// (independently verified against the symbolic expansion), and the hidden
// coupling (1+xy)(F2 − y) = 3x·F1 explains the miracle.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ------------------------------------------------------------- the math */
// Hand-derived Jacobian entries (verified: det ≡ −2 symbolically, and
// numerically at random complex probes). u = 1 + x·y throughout.
function jac(x: number, y: number, z: number): number[][] {
  const u = 1 + x * y;
  return [
    [
      3 * u * u * y * z + y * y * y * (4 + 3 * x * y) + 3 * y * y * y * u,
      3 * u * u * x * z + 2 * y * u * (4 + 3 * x * y) + x * y * y * (4 + 3 * x * y) + 3 * x * y * y * u,
      u * u * u,
    ],
    [
      3 * u * u * z + 6 * x * y * u * z + 12 * y * y + 18 * x * y * y * y,
      1 + 6 * x * x * u * z + 24 * x * y + 27 * x * x * y * y,
      3 * x * u * u,
    ],
    [2 - 6 * x * y - 3 * x * x * z, -3 * x * x, -x * x * x],
  ];
}
function det3(m: number[][]): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}
// the roaming probe: a closed-form path through a real slice of the space
const probeAt = (pt: number): [number, number, number] => [
  1.3 * Math.sin(6.283 * pt + 0.7),
  1.1 * Math.sin(12.566 * pt + 2.1),
  1.6 * Math.sin(6.283 * pt + 4.2),
];

/* ---------------------------------------------------------------- layout */
const MAP = { x: 70, y: 84, w: 560, h: 190 };
const JAC = { x: 70, y: 312, w: 560, h: 288 };
const STR = { x: 690, y: 96, w: 510, rowH: 40, gap: 8 };
const CORE = { x: 945, y: 470 }; // where the monomials annihilate
const PROBE = { x: 690, y: 96, w: 510, h: 190 };
const REL = { x: 690, y: 330, w: 510, h: 120 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_MAP: CameraState = { x: 350, y: 240, k: 1.12 };
const CAM_JAC: CameraState = { x: 380, y: 430, k: 1.1 };
const CAM_STR: CameraState = { x: 900, y: 300, k: 1.05 };
const CAM_CORE: CameraState = { x: 880, y: 340, k: 1.0 };
const CAM_PROBE: CameraState = { x: 880, y: 260, k: 1.06 };
const CAM_WIDE: CameraState = { x: 640, y: 350, k: 0.98 };

// the six permutation products of the naive determinant expansion — real
// term counts from the symbolic expansion (sum = 82).
const STRANDS: [string, number, number][] = [
  ['J₁₁ J₂₂ J₃₃', +1, 13],
  ['J₁₁ J₂₃ J₃₂', -1, 9],
  ['J₁₂ J₂₁ J₃₃', -1, 14],
  ['J₁₂ J₂₃ J₃₁', +1, 17],
  ['J₁₃ J₂₁ J₃₂', +1, 11],
  ['J₁₃ J₂₂ J₃₁', -1, 18],
];

// a sample of REAL monomials from those products (signs as they appear)
const CHIP_LABELS = [
  '−18x⁸y⁴z²',
  '−117x⁷y⁵z',
  '−162x⁶y⁶',
  '9x²y²z',
  '24xy',
  '3yz',
  '8y',
  '12y²',
  '−x³',
  '−576x⁵y⁵',
  '7y³',
  '27x²y²',
];
const N_CHIPS = 26;
const rand = mulberry32(20260719);
const CHIPS = Array.from({ length: N_CHIPS }, (_, i) => ({
  strand: i % 6,
  jitterX: (rand() - 0.5) * 60,
  jitterY: (rand() - 0.5) * 18,
  arcY: 40 + rand() * 90,
  label: i < CHIP_LABELS.length ? CHIP_LABELS[i] : null,
  positive: rand() > 0.5,
}));

// entry term counts (row-major), shown as chips on the messy entries
const TERMS = [
  [5, 6, 4],
  [5, 5, 3],
  [3, 1, 1],
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const mapU = tl.channel('mapU', 0); // the three formulas
  const gearU = tl.channel('gearU', 0); // u = 1+xy highlight
  const jacU = tl.channel('jacU', 0); // 3×3 matrix panel
  const rowU = tl.channel('rowU', 0); // bottom-row emphasis
  const strandN = tl.channel('strandN', 0); // permutation products
  const chipsU = tl.channel('chipsU', 0); // cancellation cascade
  const resultU = tl.channel('resultU', 0); // −2 pop
  const strandOff = tl.channel('strandOff', 0); // clear the right column
  const probeU = tl.channel('probeU', 0);
  const probeT = tl.channel('probeT', 0); // roaming parameter
  const relU = tl.channel('relU', 0); // coupling identity
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  /* — beat 1 · the map, in full — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Here is the map, in full. Three polynomials in three complex variables, total degree seven. You could type it into a computer algebra system in under a minute.',
  });
  tl.tween(cam, CAM_MAP, { at: t - 6.2, dur: 1.4, ease: ease.move });
  tl.tween(mapU, 1, { at: t - 5.8, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 2 · the recurring gear — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'One gear repeats everywhere: the quantity one plus x times y. Call it u. The whole machine is assembled from powers of this one gear.',
  });
  tl.tween(gearU, 1, { at: t - 5.2, dur: 0.9, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 3 · differentiate: the 3×3 thicket — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Differentiate everything with respect to everything. The Jacobian is a three by three matrix of polynomials, and most of its entries are a thicket.',
  });
  tl.tween(cam, CAM_JAC, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(jacU, 1, { at: t - 5.2, dur: 1.6, ease: ease.draw });
  t = tl.hold(t, 0.4);

  /* — beat 4 · the tame bottom row — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Only the bottom row is tame, because the third output never touches anything complicated. The rest carries up to six terms apiece.',
  });
  tl.tween(rowU, 1, { at: t - 4.8, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 5 · six signed products, eighty-two monomials — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Now expand the determinant the schoolbook way: six signed products. Multiplied out, they hold eighty-two monomials between them.',
  });
  tl.tween(cam, CAM_STR, { at: t - 5.6, dur: 1.4, ease: ease.move });
  tl.tween(strandN, 6, { at: t - 5.0, dur: 2.0, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 6 · the annihilation — */
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'And they annihilate. Every monomial that contains a variable meets an equal and opposite twin somewhere in the pile. The dust settles on a single number: minus two.',
  });
  tl.tween(cam, CAM_CORE, { at: t - 6.6, dur: 1.4, ease: ease.move });
  tl.tween(chipsU, 1, { at: t - 6.2, dur: 3.6, ease: ease.linear });
  tl.tween(resultU, 1, { at: t - 2.2, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 7 · constant everywhere: the probe — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Not minus two at a few lucky points. Minus two identically. Watch the probe wander the space while the determinant is recomputed from scratch at every step.',
  });
  tl.tween(strandOff, 1, { at: t - 6.2, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_PROBE, { at: t - 6.0, dur: 1.4, ease: ease.move });
  tl.tween(probeU, 1, { at: t - 5.4, dur: 0.8, ease: ease.enter });
  tl.tween(probeT, 1, { at: t - 4.8, dur: 4.6, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 8 · the hidden coupling — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'The cancellation is not luck. The outputs are secretly coupled: one clean identity ties the first two components together, and it is exactly what the determinant needs.',
  });
  tl.tween(relU, 1, { at: t - 5.6, dur: 0.9, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 9 · the setup is complete — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'So the local test passes at every single point of complex three-space. By every instinct mathematicians trained on this problem since 1939, the map should be invertible. It is not.',
  });
  tl.tween(dimU, 0.9, { at: t - 6.2, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: t - 6.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 5.0, dur: 0.9, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, mapU, gearU, jacU, rowU, strandN, chipsU, resultU, strandOff, probeU, probeT, relU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The three formulas; the gear beat recolors every (1+xy) in warm. */
function MapCard({ u, gear, dim }: { u: number; gear: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  const g = clamp01(gear);
  const U = '\\textcolor{#fbbf24}{(1+xy)}';
  const plain = [
    'F_1 = (1+xy)^3 z + y^2(1+xy)(4+3xy)',
    'F_2 = y + 3x(1+xy)^2 z + 3xy^2(4+3xy)',
    'F_3 = 2x - 3x^2y - x^3z',
  ];
  const warm = [
    `F_1 = ${U}^3 z + y^2${U}(4+3xy)`,
    `F_2 = y + 3x${U}^2 z + 3xy^2(4+3xy)`,
    'F_3 = 2x - 3x^2y - x^3z',
  ];
  return (
    <g opacity={a}>
      <rect x={MAP.x} y={MAP.y} width={MAP.w} height={MAP.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={MAP.x + 20} y={MAP.y + 28} fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={mono}>
        the map · total degree 7
      </text>
      {plain.map((tex, i) => (
        <g key={i}>
          <MathLabel anchor="start" tex={tex} x={MAP.x + 22} y={MAP.y + 58 + i * 38} fontSize={15} color={colors.TEXT} opacity={a * (1 - g)} />
          <MathLabel anchor="start" tex={warm[i]} x={MAP.x + 22} y={MAP.y + 58 + i * 38} fontSize={15} color={colors.TEXT} opacity={a * g} />
        </g>
      ))}
      {g > 0 && (
        <g opacity={g}>
          <rect x={MAP.x + 400} y={MAP.y + 12} width={140} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.6} />
          <MathLabel anchor="start" tex={'u = 1 + xy'} x={MAP.x + 418} y={MAP.y + 16} fontSize={14} color={colors.WARM} opacity={g} />
        </g>
      )}
    </g>
  );
}

/** The 3×3 Jacobian: clean z-column and bottom row in u-form, counts elsewhere. */
function JacobianPanel({ u, row, dim }: { u: number; row: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  const cw = 170;
  const ch = 78;
  const ox = JAC.x + 32;
  const oy = JAC.y + 46;
  // compact tex where the entry is short, term-count chips where it is not
  const cellTex: (string | null)[][] = [
    [null, null, 'u^3'],
    [null, null, '3xu^2'],
    ['2 - 6xy - 3x^2z', '-3x^2', '-x^3'],
  ];
  return (
    <g opacity={a}>
      <rect x={JAC.x} y={JAC.y} width={JAC.w} height={JAC.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={JAC.x + 20} y={JAC.y + 28} fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={mono}>
        the Jacobian matrix J = DF
      </text>
      {[0, 1, 2].map((i) =>
        [0, 1, 2].map((j) => {
          const e = clamp01(uu * 4.5 - (i * 3 + j) * 0.35);
          if (e <= 0) return null;
          const cx = ox + j * (cw + 8);
          const cy = oy + i * (ch + 6);
          const isBottom = i === 2;
          const hot = isBottom ? clamp01(row) : 0;
          const tex = cellTex[i][j];
          return (
            <g key={`${i}${j}`} opacity={e}>
              <rect x={cx} y={cy} width={cw} height={ch} rx={8} fill={colors.BG} stroke={hot > 0 ? colors.POSITIVE : colors.GRID} strokeWidth={hot > 0 ? 1.8 : 1.1} opacity={0.9} />
              {tex ? (
                <MathLabel anchor="start" tex={tex} x={cx + 14} y={cy + ch / 2 - 14} fontSize={14} color={hot > 0 ? colors.POSITIVE : colors.TEXT} opacity={e} />
              ) : (
                <>
                  <text x={cx + 14} y={cy + 30} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
                    {TERMS[i][j]} terms
                  </text>
                  <text x={cx + 14} y={cy + 52} fill={colors.MUTED} fontSize={11.5} fontFamily={mono} opacity={0.7}>
                    degree {[[6, 6, 6], [5, 5, 4]][i]?.[j] ?? ''}
                  </text>
                </>
              )}
            </g>
          );
        }),
      )}
    </g>
  );
}

/** Six permutation strands; monomial chips fly to the core and annihilate. */
function Cascade({ n, chips, result, off, dim }: { n: number; chips: number; result: number; off: number; dim: number }) {
  const gone = clamp01(off);
  const a = (1 - 0.88 * clamp01(dim)) * (1 - gone);
  const cu = clamp01(chips);
  const rows = STRANDS.map((_, i) => STR.y + i * (STR.rowH + STR.gap));
  const remaining = Math.max(1, Math.round(82 - 81 * cu));
  return (
    <>
      {a > 0 && n > 0 && (
        <g opacity={a}>
          {STRANDS.map(([label, sign, count], i) => {
            const u = clamp01(n - i);
            if (u <= 0) return null;
            return (
              <g key={i} transform={`translate(${STR.x}, ${rows[i] + (1 - u) * 8})`} opacity={u}>
                <rect width={STR.w} height={STR.rowH} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
                <text x={14} y={STR.rowH / 2 + 4.5} fill={sign > 0 ? colors.POSITIVE : colors.NEGATIVE} fontSize={14} fontWeight={700} fontFamily={mono}>
                  {sign > 0 ? '+' : '−'}
                </text>
                <text x={36} y={STR.rowH / 2 + 4.5} fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>
                  {label}
                </text>
                <text x={STR.w - 92} y={STR.rowH / 2 + 4.5} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
                  {count} terms
                </text>
              </g>
            );
          })}
          {/* the chips: born on a strand, dying at the core */}
          {cu > 0 &&
            CHIPS.map((c, i) => {
              const p = clamp01(cu * 4.5 - i * 0.12);
              if (p <= 0 || p >= 1) return null;
              const x0 = STR.x + STR.w - 100 + c.jitterX;
              const y0 = rows[c.strand] + STR.rowH / 2 + c.jitterY;
              const x1 = CORE.x;
              const y1 = CORE.y;
              const mx = (x0 + x1) / 2 + 30;
              const my = Math.min(y0, y1) - c.arcY + 120;
              const om = 1 - p;
              const bx = om * om * x0 + 2 * om * p * mx + p * p * x1;
              const by = om * om * y0 + 2 * om * p * my + p * p * y1;
              const fade = p > 0.86 ? clamp01((1 - p) / 0.14) : 1;
              return (
                <g key={i} opacity={fade}>
                  <circle cx={bx} cy={by} r={4} fill={c.positive ? colors.POSITIVE : colors.NEGATIVE} />
                  {c.label && p < 0.75 && (
                    <text x={bx + 8} y={by + 4} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
                      {c.label}
                    </text>
                  )}
                </g>
              );
            })}
          {/* annihilation flash + counter */}
          {cu > 0 && (
            <g>
              <circle cx={CORE.x} cy={CORE.y} r={24 + 5 * Math.sin(cu * 28)} fill={colors.WARM} opacity={0.22 + 0.1 * cu} />
              <circle cx={CORE.x} cy={CORE.y} r={34 + 4 * Math.sin(cu * 20 + 2)} fill="none" stroke={colors.WARM} strokeWidth={1.4} opacity={0.5} />
              <text x={CORE.x} y={CORE.y - 58} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={700} fontFamily={mono}>
                monomials left: {result > 0.5 ? 1 : remaining}
              </text>
            </g>
          )}
        </g>
      )}
      {/* −2 survives even when the strands are cleared */}
      {result > 0 && (
        <g opacity={clamp01(result) * (1 - 0.4 * clamp01(dim))} transform={`translate(${CORE.x + gone * -180}, ${CORE.y + gone * 60})`}>
          <circle r={34} fill={colors.WARM} opacity={0.16} />
          <text y={10} textAnchor="middle" fill={colors.WARM} fontSize={30} fontWeight={800} fontFamily={mono}>
            {'−2'}
          </text>
        </g>
      )}
    </>
  );
}

/** A dot roams a real slice of the space; det J is recomputed each frame. */
function ProbePanel({ u, pt, dim }: { u: number; pt: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  const [px, py, pz] = probeAt(pt);
  const d = det3(jac(px, py, pz));
  const cx = PROBE.x + 120 + px * 60;
  const cy = PROBE.y + 100 + py * 55;
  return (
    <g opacity={a}>
      <rect x={PROBE.x} y={PROBE.y} width={PROBE.w} height={PROBE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={PROBE.x + 18} y={PROBE.y + 26} fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={mono}>
        probe · det recomputed live
      </text>
      <rect x={PROBE.x + 30} y={PROBE.y + 44} width={190} height={124} rx={9} fill={colors.BG} stroke={colors.GRID} strokeWidth={1} />
      {/* trail */}
      {Array.from({ length: 22 }, (_, i) => {
        const tp = Math.max(0, pt - i * 0.012);
        const [tx, ty] = probeAt(tp);
        return <circle key={i} cx={PROBE.x + 120 + tx * 60} cy={PROBE.y + 100 + ty * 55} r={2.4} fill={colors.ACCENT} opacity={0.32 * (1 - i / 22)} />;
      })}
      <circle cx={cx} cy={cy} r={6} fill={colors.ACCENT} />
      <circle cx={cx} cy={cy} r={10} fill={colors.ACCENT} opacity={0.25} />
      <text x={PROBE.x + 250} y={PROBE.y + 72} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        x = {px.toFixed(2)}   y = {py.toFixed(2)}   z = {pz.toFixed(2)}
      </text>
      <rect x={PROBE.x + 248} y={PROBE.y + 92} width={230} height={44} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.6} />
      <text x={PROBE.x + 264} y={PROBE.y + 120} fill={colors.WARM} fontSize={17} fontWeight={800} fontFamily={mono}>
        det J = {d.toFixed(3)}
      </text>
    </g>
  );
}

/** The identity that makes the cancellation run. */
function CouplingCard({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  return (
    <g opacity={a} transform={`translate(${REL.x}, ${REL.y + (1 - uu) * 10})`}>
      <rect width={REL.w} height={REL.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.8} />
      <text x={18} y={28} fill={colors.SECONDARY} fontSize={13} fontWeight={700} fontFamily={mono}>
        the hidden coupling
      </text>
      <MathLabel anchor="start" tex={'(1+xy)\\,(F_2 - y) \\;=\\; 3x\\,F_1'} x={24} y={48} fontSize={18} color={colors.TEXT} opacity={uu} />
    </g>
  );
}

/** Quiet close: the setup is armed. */
function CloseCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${370}, ${250 + (1 - uu) * 12})`} opacity={uu}>
      <rect width={540} height={150} rx={14} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} />
      <text x={26} y={44} fill={colors.WARM} fontSize={15} fontWeight={700} fontFamily={mono}>
        det J = −2, identically
      </text>
      <text x={26} y={78} fill={colors.TEXT} fontSize={13.5} fontFamily={mono}>
        locally invertible at every point of ℂ³
      </text>
      <text x={26} y={108} fill={colors.MUTED} fontSize={13.5} fontFamily={mono}>
        globally? · next: three points, one image
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <MapCard u={s.get(scene.mapU)} gear={s.get(scene.gearU)} dim={dim} />
      <JacobianPanel u={s.get(scene.jacU)} row={s.get(scene.rowU)} dim={dim} />
      <Cascade n={s.get(scene.strandN)} chips={s.get(scene.chipsU)} result={s.get(scene.resultU)} off={s.get(scene.strandOff)} dim={dim} />
      <ProbePanel u={s.get(scene.probeU)} pt={s.get(scene.probeT)} dim={dim} />
      <CouplingCard u={s.get(scene.relU)} dim={dim} />
      <CloseCard u={s.get(scene.closeU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
