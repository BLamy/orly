// arXiv:2607.03502 — "Reading Between the Dots", chapter 2: how you would
// even test for hidden computation. We build a real two-layer attention-only
// toy transformer at module scope — actual softmax attention, hand-set query
// and key projections — where the filler positions provably act as scratch
// space: layer one copies operand A into filler slot one and operand B into
// filler slot two; layer two reads both slots from the question position and
// emits the sum (7 + 6 -> 13.00, softmax leakage included). Then we apply the
// paper's first instrument to it: a logit-lens style linear readout of the
// residual stream at every layer and position, which lights up exactly where
// the intermediates live.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The toy transformer (all real, module scope). Positions:
//   0:A  1:B  2:'.'  3:'.'  4:'.'  5:Q
// Dims: 0..5 position one-hot · 6 value · 7 slotA · 8 slotB · 9 answer.
// ---------------------------------------------------------------------------

const P = 6;
const DIM = 12;
const SCALE = 20;
const A_VAL = 7;
const B_VAL = 6;

type Vec = number[];
type Mat = number[][];

function embed(a: number, b: number): Mat {
  const X: Mat = Array.from({ length: P }, () => Array(DIM).fill(0));
  for (let i = 0; i < P; i++) X[i][i] = 1;
  X[0][6] = a / SCALE;
  X[1][6] = b / SCALE;
  return X;
}

const softmax = (r: Vec): Vec => {
  const m = Math.max(...r);
  const e = r.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
};

/** One attention head: row i puts logit 10 on its target positions. */
const attnRows = (targets: number[][]): Mat =>
  targets.map((tgt) => softmax(Array.from({ length: P }, (_, j) => (tgt.includes(j) ? 10 : 0))));

interface Fwd {
  X: Mat; // embeddings
  H: Mat; // after layer 1
  O: Mat; // after layer 2
  a1A: Mat;
  a1B: Mat;
  a2: Mat;
  ans: number;
}

function forward(a: number, b: number): Fwd {
  const X = embed(a, b);
  const tA = Array.from({ length: P }, (_, i) => (i === 2 ? [0] : [5]));
  const tB = Array.from({ length: P }, (_, i) => (i === 3 ? [1] : [5]));
  const a1A = attnRows(tA);
  const a1B = attnRows(tB);
  const H = X.map((r) => [...r]);
  for (let i = 0; i < P; i++) {
    H[i][7] += a1A[i].reduce((s, w, j) => s + w * X[j][6], 0);
    H[i][8] += a1B[i].reduce((s, w, j) => s + w * X[j][6], 0);
  }
  const tQ = Array.from({ length: P }, (_, i) => (i === 5 ? [2, 3] : [5]));
  const a2 = attnRows(tQ);
  const O = H.map((r) => [...r]);
  for (let i = 0; i < P; i++) {
    O[i][9] += 2 * a2[i].reduce((s, w, j) => s + w * (H[j][7] + H[j][8]), 0);
  }
  return { X, H, O, a1A, a1B, a2, ans: O[5][9] * SCALE };
}

const RUN = forward(A_VAL, B_VAL); // ans = 13.00

// the "logit lens": linear readout of (value, slotA, slotB, answer) dims at
// every layer/position, scaled back to token units.
const LENS_DIMS = [6, 7, 8, 9] as const;
const LENS_LABELS = ['value', 'slot A', 'slot B', 'answer'];
const LENS: number[][][] = [RUN.X, RUN.H, RUN.O].map((M) =>
  LENS_DIMS.map((d) => M.map((row) => row[d] * SCALE)),
); // LENS[layer][dim][pos]
const LENS_MAX = 13;

const TOK_LABELS = ['A = 7', 'B = 6', '.', '.', '.', 'Q'];

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const TOK_X0 = 170;
const TOK_DX = 120;
const TOK_W = 96;
const TOK_Y = 150;
const L1_Y = 300;
const L2_Y = 450;

const LENS_X0 = 880;
const LENS_Y0 = 170;
const LENS_CELL = 34;

const CAM_NET: CameraState = { x: 470, y: 320, k: 1.2 };
const CAM_LENS: CameraState = { x: 940, y: 330, k: 1.25 };

const rowY = (layer: number): number => [TOK_Y, L1_Y, L2_Y][layer];

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  tokU: ChannelRef<number>;
  arc1U: ChannelRef<number>;
  arc2U: ChannelRef<number>;
  ansU: ChannelRef<number>;
  lensU: ChannelRef<number>;
  lensLayer: ChannelRef<number>;
  probeEqU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const tokU = tl.channel('tokU', 0);
  const arc1U = tl.channel('arc1U', 0);
  const arc2U = tl.channel('arc2U', 0);
  const ansU = tl.channel('ansU', 0);
  const lensU = tl.channel('lensU', 0);
  const lensLayer = tl.channel('lensLayer', 0);
  const probeEqU = tl.channel('probeEqU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — build the machine
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'You cannot probe a frontier model until you know what a positive result should look like. So build the smallest machine where the answer is known by construction.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_NET, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(tokU, 1, { at: 1.2, dur: 1.6, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 6.2,
    text: 'Two operands, three dots, one question mark. This is a real two layer attention network — the arrows you are about to see are its actual softmax attention weights, not a cartoon.',
  });
  tl.hold(12.7, 0.5);

  // Beat 2 — layer 1: copy into the dots
  tl.caption({
    at: 13.2,
    dur: 6.0,
    text: 'Layer one is a courier. The first dot attends back to operand A and copies its value into a private slot. The second dot does the same for operand B. The dots have become scratch paper.',
  });
  tl.tween(arc1U, 1, { at: 13.8, dur: 1.6, ease: ease.draw });
  tl.hold(19.2, 0.6);

  // Beat 3 — layer 2: read and sum
  tl.caption({
    at: 19.8,
    dur: 6.0,
    text: 'Layer two is the reader. The question position splits its attention evenly across the two dots, pulls both slots, and adds them. Out comes thirteen — computed entirely through the fillers.',
  });
  tl.tween(arc2U, 1, { at: 20.4, dur: 1.6, ease: ease.draw });
  tl.tween(ansU, 1, { at: 23.2, dur: 0.7, ease: ease.pop });
  tl.hold(25.8, 0.6);

  // Beat 4 — the lens
  tl.caption({
    at: 26.4,
    dur: 6.0,
    text: 'Now the instrument. A logit lens reads the residual stream at every layer and position through a linear map, and asks: which token values are written here?',
  });
  tl.tween(cam, CAM_LENS, { at: 26.7, dur: 1.5, ease: ease.move });
  tl.tween(lensU, 1, { at: 27.5, dur: 1.2, ease: ease.draw });
  tl.tween(probeEqU, 1, { at: 29.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 32.8,
    dur: 6.4,
    text: 'Scan down the layers. At the embedding, only the operands carry values. After layer one, seven and six glow at the two dot positions. After layer two, thirteen appears at the question. The whole computation is legible.',
  });
  tl.tween(lensLayer, 2, { at: 33.6, dur: 4.6, ease: ease.linear });
  tl.hold(39.4, 0.7);

  // Beat 5 — the transfer
  tl.caption({
    at: 40.1,
    dur: 6.0,
    text: 'This is the paper’s exact playbook: know the intermediates, read every layer and position, and see where they surface. The only question left is whether a trillion parameter model is this tidy.',
  });
  tl.tween(closeU, 1, { at: 41.0, dur: 1.0, ease: ease.enter });
  tl.hold(46.3, 1.2);

  return { tl, cam, titleU, tokU, arc1U, arc2U, ansU, lensU, lensLayer, probeEqU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/toy-filler-probe/overrides.json',
  slug: 'toy-filler-probe',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const tokX = (i: number): number => TOK_X0 + i * TOK_DX;

/** Attention arc between (fromPos, fromLayerY) and (toPos, toLayerY). */
function Arc({ from, to, y0, y1, w, color, u }: { from: number; to: number; y0: number; y1: number; w: number; color: string; u: number }) {
  if (u <= 0 || w < 0.02) return null;
  const x0 = tokX(from) + TOK_W / 2;
  const x1 = tokX(to) + TOK_W / 2;
  const my = (y0 + y1) / 2 + 26;
  return (
    <path
      d={`M${x0} ${y0} C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`}
      fill="none"
      stroke={color}
      strokeWidth={1 + 5 * w}
      opacity={0.75 * u * Math.min(1, 0.25 + w)}
      strokeDasharray="1 0"
    />
  );
}

function TokenRow({ y, label, u }: { y: number; label: string; u: number }) {
  return (
    <g opacity={u}>
      <text x={TOK_X0 - 24} y={y + 24} textAnchor="end" fill={colors.MUTED} fontSize={13}>
        {label}
      </text>
      {TOK_LABELS.map((t, i) => (
        <g key={i}>
          <rect x={tokX(i)} y={y} width={TOK_W} height={38} rx={7} fill={colors.PANEL} stroke={i >= 2 && i <= 4 ? colors.WARM : colors.GRID} />
          <text x={tokX(i) + TOK_W / 2} y={y + 24} textAnchor="middle" fill={i >= 2 && i <= 4 ? colors.WARM : colors.TEXT} fontSize={14} fontFamily="monospace">
            {t}
          </text>
        </g>
      ))}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const tokU = s.get(scene.tokU);
  const arc1U = s.get(scene.arc1U);
  const arc2U = s.get(scene.arc2U);
  const ansU = s.get(scene.ansU);
  const lensU = s.get(scene.lensU);
  const lensLayer = s.get(scene.lensLayer);
  const probeEqU = s.get(scene.probeEqU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;
  const layerIdx = Math.round(clamp01(lensLayer / 2) * 2);
  const lens = LENS[layerIdx];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the three residual rows */}
          <TokenRow y={TOK_Y} label="embedding" u={tokU} />
          <TokenRow y={L1_Y} label="after layer 1" u={tokU * Math.max(arc1U, 0.35)} />
          <TokenRow y={L2_Y} label="after layer 2" u={tokU * Math.max(arc2U, 0.35)} />

          {/* layer 1 attention: filler1 <- A, filler2 <- B (real weights) */}
          {arc1U > 0 && (
            <g>
              <Arc from={0} to={2} y0={TOK_Y + 38} y1={L1_Y} w={RUN.a1A[2][0]} color={colors.ACCENT} u={arc1U} />
              <Arc from={1} to={3} y0={TOK_Y + 38} y1={L1_Y} w={RUN.a1B[3][1]} color={colors.SECONDARY} u={arc1U} />
              <text x={tokX(2) + TOK_W / 2} y={L1_Y + 56} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily="monospace" opacity={arc1U}>
                slot A = {(RUN.H[2][7] * SCALE).toFixed(2)}
              </text>
              <text x={tokX(3) + TOK_W / 2} y={L1_Y + 72} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily="monospace" opacity={arc1U}>
                slot B = {(RUN.H[3][8] * SCALE).toFixed(2)}
              </text>
            </g>
          )}

          {/* layer 2 attention: Q <- fillers (real weights, ~0.5 each) */}
          {arc2U > 0 && (
            <g>
              <Arc from={2} to={5} y0={L1_Y + 38} y1={L2_Y} w={RUN.a2[5][2]} color={colors.POSITIVE} u={arc2U} />
              <Arc from={3} to={5} y0={L1_Y + 38} y1={L2_Y} w={RUN.a2[5][3]} color={colors.POSITIVE} u={arc2U} />
              <text x={tokX(5) + TOK_W / 2 + 8} y={(L1_Y + L2_Y) / 2 + 24} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace" opacity={arc2U}>
                0.50 / 0.50
              </text>
            </g>
          )}
          {ansU > 0 && (
            <g opacity={ansU}>
              <rect x={tokX(5) - 6} y={L2_Y - 6} width={TOK_W + 12} height={50} rx={9} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
              <text x={tokX(5) + TOK_W / 2} y={L2_Y + 72} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontWeight={600} fontFamily="monospace">
                answer = {RUN.ans.toFixed(2)}
              </text>
            </g>
          )}

          {/* the lens heatmap */}
          {lensU > 0 && (
            <g opacity={lensU}>
              <text x={LENS_X0} y={LENS_Y0 - 40} fill={colors.TEXT} fontSize={16}>
                logit lens readout
              </text>
              <text x={LENS_X0} y={LENS_Y0 - 20} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                {['at embedding', 'after layer 1', 'after layer 2'][layerIdx]}
              </text>
              {lens.map((row, r) => (
                <g key={r}>
                  <text x={LENS_X0 - 10} y={LENS_Y0 + r * LENS_CELL + 22} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                    {LENS_LABELS[r]}
                  </text>
                  {row.map((v, c) => (
                    <g key={c}>
                      <rect
                        x={LENS_X0 + c * LENS_CELL}
                        y={LENS_Y0 + r * LENS_CELL}
                        width={LENS_CELL - 3}
                        height={LENS_CELL - 3}
                        rx={4}
                        fill={colors.heat(clamp01(Math.abs(v) / LENS_MAX))}
                      />
                      {Math.abs(v) > 0.5 && (
                        <text
                          x={LENS_X0 + c * LENS_CELL + LENS_CELL / 2 - 1}
                          y={LENS_Y0 + r * LENS_CELL + 20}
                          textAnchor="middle"
                          fill={colors.BG}
                          fontSize={11}
                          fontWeight={700}
                          fontFamily="monospace"
                        >
                          {Math.round(v)}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
              ))}
              {TOK_LABELS.map((t, c) => (
                <text
                  key={c}
                  x={LENS_X0 + c * LENS_CELL + LENS_CELL / 2}
                  y={LENS_Y0 + 4 * LENS_CELL + 16}
                  textAnchor="middle"
                  fill={colors.MUTED}
                  fontSize={10}
                  fontFamily="monospace"
                >
                  {t.split(' ')[0]}
                </text>
              ))}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Build the machine, then probe it
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.03502 · toy 2-layer attention, computed
        </text>
      </g>
      <MathLabel
        tex="\mathrm{lens}(h^{(\ell)}_{i}) = W_U\, h^{(\ell)}_{i}"
        x={950}
        y={80}
        fontSize={20}
        color={colors.TEAL}
        opacity={probeEqU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Known intermediates, read at every layer and position.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            In the toy, the scratch work surfaces exactly where it was written.
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Next: what the same instruments say when the wiring is unknown.
          </text>
        </g>
      )}
    </>
  );
}

export function ToyFillerProbe() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
