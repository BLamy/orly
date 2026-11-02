// Chapter 1 — Read the picture in the weights.
//
// Source: "Sparks of Weight-Space Programming" (Takehi, Teoh, Zhang, Khattab; MIT CSAIL; November 2, 2026),
// https://rikiyat.github.io/blog/weight-space-programming/ . Experiment 1: four PPO game networks, MLP 500 to 32
// to 32 to 5, tanh, 17,253 weights; Astra names Breakout, Pong, Pac-Man, Freeway from the weights alone.
// Experiment 2: DDPM models for circles, triangles and squares, MLP 160 to 64 to 64 to 144, ReLU, 23,824 weights;
// Astra finds each shape's edge pieces in the output layer and draws outlines, not filled shapes.
//
// Beat sheet. One machine: a weight matrix drawn as a picture, read where its weights concentrate.
//  1. [Exp 1] Five 10 x 10 first-layer maps, one per input channel, fill in cell by cell.
//  2. [Exp 1] The camera pushes into the agent map: its weights gather along the bottom row, where a paddle sits.
//  3. [Exp 1] With no tools and no game named, Astra answers Breakout (the answer card, Breakout ringed).
//  4. [Exp 1] Pong, Pac-Man and Freeway chips light: the same reading names all four networks.
//  5. [Exp 2] The maps clear; a 12 x 12 output grid appears, with a faint filled triangle (the trained output).
//  6. [Exp 2] Each hidden unit's output weights draw one edge piece; the pieces run round the perimeter and close.
//  7. [Exp 2] The fill drops away: Astra drew only the outline, so it read the geometry, not a forward pass.
//  8. [Exp 2] The outline morphs circle to triangle to square, redrawn by the same reading.
//  9. Closing: the stage clears under the last line; the next chapter moves to the middle layers.
//
// Schematic note on screen: the maps show where weights concentrate, not measured values.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MatrixGrid } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// Seconds a caption takes to say, with a breath: pacing follows the words.
const speakSeconds = (text: string) => Math.round((text.split(/\s+/).length / 2.6 + 0.5) * 10) / 10;

// ---- Experiment 1 (schematic): first-layer weight magnitude per cell, 10 x 10 per input channel ----
const rand = mulberry32(7);
const agentMap: number[][] = Array.from({ length: 10 }, (_, i) =>
  Array.from({ length: 10 }, (_, j) => (i === 9 ? 0.8 + 0.2 * (0.5 + 0.5 * Math.cos(j * 0.8)) : 0.03 + 0.07 * rand())),
);
const diffuseMap = (): number[][] =>
  Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0.04 + 0.26 * rand() * rand()));
const MAPS: number[][][] = [agentMap, diffuseMap(), diffuseMap(), diffuseMap(), diffuseMap()];
const MAP_NAMES = ['agent', 'moving objects', 'reward targets', 'obstacles', 'previous frame'];
const MAP_X = [80, 309, 538, 767, 996];
const MAP_Y = 200;
const MAP_CELL = 17;
const MAP_GAP = 3;
const CHIPS = ['Breakout', 'Pong', 'Pac-Man', 'Freeway'];
const CHIP_X = [330, 540, 750, 960];

// ---- Experiment 2 (schematic): outline cells of three shapes on a 12 x 12 output grid ----
const N = 12;
const CEN = (N - 1) / 2;
const GX = 440;
const GY = 120;
const GCELL = 30;
const GGAP = 4;
type Shape = 'circle' | 'triangle' | 'square';

function inside(shape: Shape, i: number, j: number): boolean {
  if (shape === 'circle') return (j - CEN) ** 2 + (i - CEN) ** 2 <= 4.8 ** 2;
  if (shape === 'square') return j >= 2 && j <= 9 && i >= 2 && i <= 9;
  const cross = (p: number[], a: number[], b: number[]) => (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
  const p = [j, i];
  const a = [CEN, 0.5];
  const b = [0.5, 10.5];
  const c = [10.5, 10.5];
  const d1 = cross(p, a, b);
  const d2 = cross(p, b, c);
  const d3 = cross(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

function filledOf(shape: Shape): number[][] {
  return Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (inside(shape, i, j) ? 1 : 0)));
}

function outlineOf(shape: Shape): number[][] {
  return Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => {
      if (!inside(shape, i, j)) return 0;
      const edge = [
        [i - 1, j],
        [i + 1, j],
        [i, j - 1],
        [i, j + 1],
      ].some(([a, b]) => a < 0 || a >= N || b < 0 || b >= N || !inside(shape, a, b));
      return edge ? 1 : 0;
    }),
  );
}

const OUT_C = outlineOf('circle');
const OUT_T = outlineOf('triangle');
const OUT_S = outlineOf('square');
const FILL_C = filledOf('circle');
const EDGE_TOTAL = OUT_C.flat().reduce((a, b) => a + b, 0);

// Reveal order: each edge cell's angle around the centre, so the outline draws round the perimeter.
const RANK: number[][] = (() => {
  const cells: Array<[number, number, number]> = [];
  OUT_C.forEach((row, i) =>
    row.forEach((v, j) => {
      if (v) cells.push([i, j, Math.atan2(i - CEN, j - CEN)]);
    }),
  );
  cells.sort((a, b) => a[2] - b[2]);
  const r = Array.from({ length: N }, () => Array.from({ length: N }, () => 0));
  cells.forEach(([i, j], k) => {
    r[i][j] = k;
  });
  return r;
})();

function outlineAt(m1: number, m2: number): number[][] {
  return OUT_C.map((row, i) =>
    row.map((v, j) => {
      const mid = v + (OUT_T[i][j] - v) * m1;
      return mid + (OUT_S[i][j] - mid) * m2;
    }),
  );
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const mapsU = tl.channel('mapsU', 0); // five first-layer maps fill in
  const labelsU = tl.channel('labelsU', 0); // channel names
  const hlU = tl.channel('hlU', 0); // bottom-row highlight on the agent map
  const cardU = tl.channel('cardU', 0); // answer card, Breakout ringed
  const chipsU = tl.channel('chipsU', 0); // Pong, Pac-Man, Freeway chips
  const outU = tl.channel('outU', 0); // Experiment 1 clears
  const act2U = tl.channel('act2U', 0); // Experiment 2 appears
  const fillU = tl.channel('fillU', 0); // faint filled reference (the trained output)
  const edgeU = tl.channel('edgeU', 0); // outline draws round the perimeter
  const outLblU = tl.channel('outLblU', 0); // "outline only" label
  const m1U = tl.channel('m1U', 0); // circle to triangle
  const m2U = tl.channel('m2U', 0); // triangle to square
  const endU = tl.channel('endU', 0); // closing fade

  // Captions run one after another; visual beats are placed inside the caption they accompany.
  let t = 0.3;
  const line = (text: string, gap = 0.4) => {
    const at = t;
    tl.caption({ at, dur: speakSeconds(text), text });
    t = at + speakSeconds(text) + gap;
    return at;
  };

  // ---- Experiment 1: five first-layer maps --------------------------------------
  const c1 = line('This book retells a blog post from researchers at the Massachusetts Institute of Technology, published in November twenty twenty-six.');
  tl.tween(mapsU, 1, { at: c1 + 0.5, dur: 1.8, ease: ease.move });
  tl.tween(labelsU, 1, { at: c1 + 2.0, dur: 0.8, ease: ease.enter });
  line("The post calls the approach Weight-Space Programming. A language model reads a neural network's weights directly, with no gradient descent.");
  line('All four game networks share one shape, with seventeen thousand, two hundred fifty-three weights. The shape alone cannot name the game.');
  line('The first layer gives each of five input channels its own ten by ten map of weights.');

  // ---- the agent map and the paddle row -----------------------------------------
  const c5 = line('For this network\'s agent channel, the weights gather along the bottom row, which is where a paddle would sit.');
  tl.tween(cam, { x: 180, y: 330, k: 2.4 }, { at: c5 + 0.4, dur: 1.6, ease: ease.move });
  tl.tween(hlU, 1, { at: c5 + 2.2, dur: 1.0, ease: ease.enter });

  // ---- the answer, then all four networks named -----------------------------------
  const c6 = line('The model, which the post calls G P T six Astra, gets the weights as plain text, with the board described and no game named. It answers Breakout.');
  tl.tween(cam, CAMERA_HOME, { at: c6 + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(cardU, 1, { at: c6 + 1.2, dur: 0.8, ease: ease.enter });
  const c7 = line('The same test named all four networks correctly: Breakout, Pong, Pac-Man, and Freeway.');
  tl.tween(chipsU, 1, { at: c7 + 0.4, dur: 1.8, ease: ease.enter });

  // ---- Experiment 2: the output layer ---------------------------------------------
  const c8 = line('Next, images. Three denoising diffusion models each draw one shape on a twelve by twelve grayscale grid: a circle, a triangle, or a square.');
  tl.tween(outU, 1, { at: c8 - 0.6, dur: 1.0, ease: ease.move });
  tl.tween(act2U, 1, { at: c8 - 0.2, dur: 1.0, ease: ease.enter });
  tl.tween(fillU, 1, { at: c8 + 1.4, dur: 1.0, ease: ease.enter });
  const c9 = line("Astra was told not to run these models. It found each shape in the output layer, where each hidden unit's weights draw one piece of an edge.");
  tl.tween(edgeU, 1, { at: c9 + 1.2, dur: 3.2, ease: ease.linear });
  const c10 = line('Stack those pieces, and an outline appears. The trained models make filled shapes, but Astra drew only the outlines.');
  tl.tween(fillU, 0, { at: c10 + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(outLblU, 1, { at: c10 + 0.8, dur: 0.8, ease: ease.enter });
  const c11 = line('That mismatch is a clue. Astra read the geometry in the weights, rather than calculating a forward pass through the model.');
  tl.tween(m1U, 1, { at: c11 + 0.8, dur: 1.6, ease: ease.move });
  tl.tween(m2U, 1, { at: c11 + 3.6, dur: 1.6, ease: ease.move });

  // ---- closing: the stage clears under the last line ----------------------------
  const closing = 'Reading the first layer found the game, and reading the last layer found the shape. Next, the middle layers, with both ends removed.';
  const c12 = line(closing, 0.5);
  tl.tween(endU, 1, { at: c12 + speakSeconds(closing) + 0.1, dur: 1.4, ease: ease.move });
  tl.hold(t + 0.6, 0.8);

  return {
    tl,
    cam,
    mapsU,
    labelsU,
    hlU,
    cardU,
    chipsU,
    outU,
    act2U,
    fillU,
    edgeU,
    outLblU,
    m1U,
    m2U,
    endU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const endFade = 1 - s.get(scene.endU);
  const act1 = (1 - s.get(scene.outU)) * endFade;
  const act2 = s.get(scene.act2U) * endFade;
  const mapsU = s.get(scene.mapsU);
  const labelsU = s.get(scene.labelsU);
  const hlU = s.get(scene.hlU);
  const cardU = s.get(scene.cardU);
  const chipsU = s.get(scene.chipsU);
  const edgeU = s.get(scene.edgeU);
  const fillU = s.get(scene.fillU);
  const outLblU = s.get(scene.outLblU);
  const m1 = s.get(scene.m1U);
  const m2 = s.get(scene.m2U);

  const mapCell = (i: number, j: number) => clamp01(mapsU * 100 - (i * 10 + j));
  const edgeCell = (i: number, j: number) => (OUT_C[i][j] ? clamp01(edgeU * (EDGE_TOTAL + 3) - RANK[i][j]) : 1);
  const shapeName = m2 > 0.5 ? 'square' : m1 > 0.5 ? 'triangle' : 'circle';
  const heat = (v: number) => colors.heat(clamp01(v));

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      {act1 > 0 && (
        <g opacity={act1}>
          <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700}>
            Experiment 1: four game networks, one shape, 17,253 weights each
          </text>
          <text x={640} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            first layer: 500 inputs from five 10 × 10 channels
          </text>
        </g>
      )}

      <Camera {...s.get(scene.cam)}>
        {act1 > 0 && (
          <g opacity={act1}>
            {MAPS.map((values, k) => (
              <g key={MAP_NAMES[k]}>
                <MatrixGrid
                  x={MAP_X[k]}
                  y={MAP_Y}
                  values={values}
                  cell={MAP_CELL}
                  gap={MAP_GAP}
                  cellU={mapCell}
                  fill={heat}
                  highlight={k === 0 && hlU > 0 ? { row: 9, u: hlU } : undefined}
                />
                <text x={MAP_X[k] + 98} y={424} textAnchor="middle" fill={colors.MUTED} fontSize={16} opacity={labelsU}>
                  {MAP_NAMES[k]}
                </text>
              </g>
            ))}
          </g>
        )}
      </Camera>

      {act1 > 0 && (
        <g opacity={act1}>
          <text x={640} y={452} textAnchor="middle" fill={colors.MUTED} fontSize={16} opacity={cardU}>
            named by Astra from the weights alone
          </text>
          <text x={640} y={546} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={cardU}>
            schematic: where the weights concentrate, not measured values
          </text>
          {CHIPS.map((name, k) => {
            const u = k === 0 ? cardU : clamp01(chipsU * 3 - (k - 1));
            return (
              <g key={name} opacity={u}>
                <rect
                  x={CHIP_X[k] - 80}
                  y={470}
                  width={160}
                  height={44}
                  rx={12}
                  fill={colors.PANEL}
                  stroke={k === 0 ? colors.WARM : colors.MUTED}
                  strokeWidth={k === 0 ? 3 : 1.5}
                />
                <text x={CHIP_X[k]} y={498} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={600}>
                  {name}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {act2 > 0 && (
        <g opacity={act2}>
          <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700}>
            Experiment 2: diffusion models, 23,824 weights each
          </text>
          <text x={640} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            output layer: one twelve by twelve image, 144 pixels
          </text>
          <g opacity={fillU * 0.22}>
            <MatrixGrid x={GX} y={GY} values={FILL_C} cell={GCELL} gap={GGAP} fill={() => colors.ACCENT} />
          </g>
          <MatrixGrid x={GX} y={GY} values={outlineAt(m1, m2)} cell={GCELL} gap={GGAP} cellU={edgeCell} fill={heat} />
          <text x={GX + 202} y={556} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontFamily={MONO}>
            {shapeName}
          </text>
          <text x={884} y={250} fill={colors.MUTED} fontSize={16} opacity={fillU}>
            trained model: filled shape
          </text>
          <text x={884} y={280} fill={colors.ACCENT} fontSize={16} opacity={outLblU}>
            Astra's drawing: outline only
          </text>
          <text x={884} y={306} fill={colors.MUTED} fontSize={14} opacity={outLblU}>
            schematic outlines of each shape's edge
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
