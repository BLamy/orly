// Chapter 1 — An Eighty-Seven-Year Question
//
// ONE persistent object: a live grid of the complex plane warping under the
// planar Keller map (x, y) ↦ (x + y²/2, y) — Jacobian determinant identically 1,
// visibly invertible — while Keller's 1939 question and the ladder of partial
// results (Wang 1980 deg ≤ 2 · Yagzhev/Bass–Connell–Wright cubic reduction ·
// Moh 1983 n = 2 deg ≤ 100 · Pinchuk 1994 real analogue falls · Smale 1998
// problem 16) build toward the July 19, 2026 announcement. Facts verified in
// this repo by exact symbolic computation (see the book's leading comments).
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const PANEL = { x: 80, y: 110, w: 500, h: 470 }; // the warping grid
const CARD = { x: 640, y: 120, w: 540, h: 170 }; // Keller's question
const LADDER = { x: 640, y: 310, w: 540, rowH: 44, gap: 8 };
const TWEET = { x: 320, y: 170, w: 640, h: 300 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_GRID: CameraState = { x: 400, y: 340, k: 1.12 };
const CAM_CARD: CameraState = { x: 800, y: 300, k: 1.05 };
const CAM_LADDER: CameraState = { x: 840, y: 420, k: 1.08 };
const CAM_TWEET: CameraState = { x: 640, y: 330, k: 1.06 };

/* ------------------------------------------------- the planar Keller warp */
// h(x, y) = (x + y²/2, y): a real planar map with det Dh ≡ 1 — every unit
// cell keeps its area exactly, and sliding the shear back inverts it.
const DOM = 1.6; // math window [−DOM, DOM]²
const N_LINES = 9; // gridlines per direction
const SAMPLES = 33;

const sx = (mx: number) => PANEL.x + ((mx + 2.6) / 5.2) * PANEL.w;
const sy = (my: number) => PANEL.y + PANEL.h - ((my + 2.0) / 4.0) * PANEL.h;
const warp = (x: number, y: number): [number, number] => [x + (y * y) / 2, y];

type Poly = [number, number][];
function gridLines(): Poly[] {
  const lines: Poly[] = [];
  for (let i = 0; i < N_LINES; i++) {
    const v = -DOM + (2 * DOM * i) / (N_LINES - 1);
    const vert: Poly = [];
    const horz: Poly = [];
    for (let k = 0; k < SAMPLES; k++) {
      const w = -DOM + (2 * DOM * k) / (SAMPLES - 1);
      vert.push([v, w]);
      horz.push([w, v]);
    }
    lines.push(vert, horz);
  }
  return lines;
}
const LINES = gridLines();

// three unit-ish cells that ride the warp, keeping area exactly 1× — drawn
// as quads whose corners are individually mapped.
const CELLS: [number, number][] = [
  [-1.05, -0.85],
  [0.15, 0.55],
  [0.75, -0.35],
];
const CELL_SIDE = 0.42;

const HISTORY: [string, string, string][] = [
  ['1939', 'Keller asks the question', colors.TEXT],
  ['1980', 'Wang: degree two, always invertible', colors.TEXT],
  ['1982', 'Bass, Connell, Wright: cubics decide it all', colors.TEXT],
  ['1983', 'Moh: the plane, through degree one hundred', colors.TEXT],
  ['1994', 'Pinchuk: the REAL analogue falls', colors.WARM],
  ['1998', 'Smale lists it: problem sixteen', colors.TEXT],
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0); // grid draw-on
  const warpU = tl.channel('warpU', 0); // identity → sheared space
  const cellU = tl.channel('cellU', 0); // unit cells entrance
  const areaU = tl.channel('areaU', 0); // ×1 area chips
  const cardU = tl.channel('cardU', 0); // Keller question card
  const ladderN = tl.channel('ladderN', 0); // history rows revealed
  const dimU = tl.channel('dimU', 0); // quiet the stage for the close
  const tweetU = tl.channel('tweetU', 0); // the dated announcement card

  /* — beat 1 · the hook: maps of complex space — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Here is a question that stood for eighty-seven years. Take a polynomial map of complex space, and ask when you can undo it.',
  });
  tl.tween(cam, CAM_GRID, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(gridU, 1, { at: t - 5.4, dur: 1.5, ease: ease.draw });
  t = tl.hold(t, 0.5);

  /* — beat 2 · the warp and the determinant — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'A polynomial map warps space. At every point, its Jacobian determinant measures the local exchange rate of volume.',
  });
  tl.tween(warpU, 1, { at: t - 5.6, dur: 2.2, ease: ease.move });
  tl.tween(cellU, 1, { at: t - 3.0, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 3 · constant determinant = no folds — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Suppose that determinant is a constant, never zero. Then nothing folds anywhere, and around every single point the map is perfectly invertible.',
  });
  tl.tween(areaU, 1, { at: t - 5.4, dur: 0.9, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 4 · Keller 1939 — */
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'In 1939, Ott-Heinrich Keller asked the natural question. If the local test passes everywhere, must the map be invertible everywhere — one input for every output?',
  });
  tl.tween(cam, CAM_CARD, { at: t - 6.6, dur: 1.4, ease: ease.move });
  tl.tween(cardU, 1, { at: t - 5.8, dur: 0.9, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 5 · this warp inverts — run it backwards — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'For this planar shear, yes. Slide it back and space unwinds. Every planar example anyone ever wrote down behaved exactly like this.',
  });
  tl.tween(cam, CAM_GRID, { at: t - 6.2, dur: 1.2, ease: ease.move });
  tl.tween(warpU, 0, { at: t - 4.8, dur: 1.8, ease: ease.move });
  tl.tween(warpU, 1, { at: t - 2.4, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 6 · partial credit: degree two, then cubics — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Decades of partial credit piled up. Degree two maps: always invertible. Then the whole problem was squeezed into special cubic maps.',
  });
  tl.tween(cam, CAM_LADDER, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(ladderN, 3, { at: t - 5.0, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 7 · the plane holds; the real cousin falls — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'In the plane, checked through degree one hundred. Over the real numbers a cousin of the conjecture actually fell in the nineties. The complex question would not move.',
  });
  tl.tween(ladderN, 5, { at: t - 6.0, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 8 · Smale's list — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Smale put it on his list of problems for the twenty-first century, right beside the Riemann hypothesis. A counterexample was close to unthinkable.',
  });
  tl.tween(ladderN, 6, { at: t - 5.8, dur: 0.9, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 9 · July 19, 2026 — */
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Then, on the day of the twenty twenty-six World Cup final, a three-line map of complex three-space appeared, with a constant determinant and a very short story to tell.',
  });
  tl.tween(dimU, 0.9, { at: t - 6.6, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_TWEET, { at: t - 6.6, dur: 1.5, ease: ease.move });
  tl.tween(tweetU, 1, { at: t - 5.4, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 10 · the promise — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The next four chapters are that story. Nothing in it runs deeper than a careful derivative and some fraction arithmetic.',
  });
  tl.hold(t, 1.0);

  return { tl, cam, gridU, warpU, cellU, areaU, cardU, ladderN, dimU, tweetU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The warping grid: every point lerps between identity and the shear. */
function WarpGrid({ u, w, cells, area, dim }: { u: number; w: number; cells: number; area: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  const pt = (mx: number, my: number): [number, number] => {
    const [wx, wy] = warp(mx, my);
    return [sx(mx + (wx - mx) * w), sy(my + (wy - my) * w)];
  };
  return (
    <g opacity={a}>
      <clipPath id="jc1-clip">
        <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
      </clipPath>
      <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} opacity={0.7} />
      <text x={PANEL.x + 4} y={PANEL.y - 12} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        det ≡ 1 everywhere — the local test at its best
      </text>
      <g clipPath="url(#jc1-clip)">
        {LINES.map((line, li) => {
          const draw = clamp01(uu * 2.2 - (li / LINES.length) * 1.2);
          if (draw <= 0) return null;
          const pts = line.map(([mx, my]) => pt(mx, my));
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
          return <path key={li} d={d} fill="none" stroke={colors.GRID} strokeWidth={1} opacity={0.85 * draw} />;
        })}
        {cells > 0 &&
          CELLS.map(([cx, cy], i) => {
            const e = clamp01(cells * 3 - i);
            if (e <= 0) return null;
            const h = CELL_SIDE / 2;
            const corners: [number, number][] = [
              [cx - h, cy - h],
              [cx + h, cy - h],
              [cx + h, cy + h],
              [cx - h, cy + h],
            ];
            const p = corners.map(([mx, my]) => pt(mx, my));
            const d = `M ${p[0][0]} ${p[0][1]} L ${p[1][0]} ${p[1][1]} L ${p[2][0]} ${p[2][1]} L ${p[3][0]} ${p[3][1]} Z`;
            const midX = (p[0][0] + p[2][0]) / 2;
            const midY = (p[0][1] + p[2][1]) / 2;
            return (
              <g key={i} opacity={e}>
                <path d={d} fill={colors.WARM} fillOpacity={0.16} stroke={colors.WARM} strokeWidth={1.8} />
                {area > 0 && (
                  <text x={midX} y={midY + 4} textAnchor="middle" fill={colors.WARM} fontSize={12} fontWeight={700} fontFamily={mono} opacity={area}>
                    ×1
                  </text>
                )}
              </g>
            );
          })}
      </g>
    </g>
  );
}

/** Keller's question, stated once, referenced by every later chapter. */
function QuestionCard({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.88 * clamp01(dim));
  return (
    <g transform={`translate(${CARD.x}, ${CARD.y + (1 - uu) * 12})`} opacity={a}>
      <rect width={CARD.w} height={CARD.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
      <text x={22} y={32} fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={mono}>
        the Jacobian conjecture · Keller 1939
      </text>
      <MathLabel anchor="start" tex={'F:\\ \\mathbb{C}^n \\to \\mathbb{C}^n \\ \\text{polynomial}'} x={24} y={62} fontSize={17} color={colors.TEXT} opacity={uu} />
      <MathLabel anchor="start" tex={'\\det DF \\equiv \\text{const} \\neq 0 \\ \\overset{?}{\\Longrightarrow}\\ F \\ \\text{invertible}'} x={24} y={104} fontSize={17} color={colors.WARM} opacity={uu} />
    </g>
  );
}

/** Eighty-seven years of partial credit, one row per landmark. */
function HistoryLadder({ n, dim }: { n: number; dim: number }) {
  if (n <= 0) return null;
  const a = 1 - 0.88 * clamp01(dim);
  return (
    <g opacity={a}>
      {HISTORY.map(([year, line, c], i) => {
        const u = clamp01(n - i);
        if (u <= 0) return null;
        const ry = LADDER.y + i * (LADDER.rowH + LADDER.gap);
        return (
          <g key={year} transform={`translate(${LADDER.x}, ${ry + (1 - u) * 8})`} opacity={u}>
            <rect width={LADDER.w} height={LADDER.rowH} rx={9} fill={colors.PANEL} stroke={c === colors.WARM ? colors.WARM : colors.GRID} strokeWidth={c === colors.WARM ? 1.8 : 1.3} />
            <text x={16} y={LADDER.rowH / 2 + 4.5} fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={mono}>
              {year}
            </text>
            <text x={72} y={LADDER.rowH / 2 + 4.5} fill={c} fontSize={12.5} fontFamily={mono}>
              {line}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The dated close: a three-line map, announced mid-final. */
function AnnouncementCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${TWEET.x}, ${TWEET.y + (1 - uu) * 14})`} opacity={uu}>
      <rect width={TWEET.w} height={TWEET.h} rx={14} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} />
      <text x={26} y={40} fill={colors.WARM} fontSize={14} fontWeight={700} fontFamily={mono}>
        July 19, 2026 — World Cup final day
      </text>
      <MathLabel anchor="start" tex={'F:\\ \\mathbb{C}^3 \\to \\mathbb{C}^3'} x={26} y={76} fontSize={17} color={colors.TEXT} opacity={uu} />
      <MathLabel anchor="start" tex={'F_1 = (1+xy)^3 z + y^2(1+xy)(4+3xy)'} x={26} y={122} fontSize={15} color={colors.MUTED} opacity={uu} />
      <MathLabel anchor="start" tex={'F_2 = y + 3x(1+xy)^2 z + 3xy^2(4+3xy)'} x={26} y={158} fontSize={15} color={colors.MUTED} opacity={uu} />
      <MathLabel anchor="start" tex={'F_3 = 2x - 3x^2y - x^3z'} x={26} y={194} fontSize={15} color={colors.MUTED} opacity={uu} />
      <MathLabel anchor="start" tex={'\\det DF = -2 \\quad\\cdot\\quad \\text{and yet\\ldots}'} x={26} y={246} fontSize={16} color={colors.WARM} opacity={uu} />
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <WarpGrid u={s.get(scene.gridU)} w={s.get(scene.warpU)} cells={s.get(scene.cellU)} area={s.get(scene.areaU)} dim={dim} />
      <QuestionCard u={s.get(scene.cardU)} dim={dim} />
      <HistoryLadder n={s.get(scene.ladderN)} dim={dim} />
      <AnnouncementCard u={s.get(scene.tweetU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
