// Explained: The Delta Rule — chapter 5: the chunked frontier. Grounded in
// the local LaTeX source of arXiv:2607.11897 (sections/04_theory_main.tex,
// Theorem "Constructive left-to-right chunk-WY recursion"): every delta-rule
// transition is diagonal-plus-rank-one, A_t = Λ_t − u_t r_tᵀ, and a chunk
// product P = A_C ··· A_1 factors as P = Γ − Y M Wᵀ with rank growing only
// inside the chunk. We RUN the paper's recursion for a real chunk of C = 8
// transitions (d = 8, real diagonal case) and compare against the dense
// product: max |difference| ≈ 3.9e-16 with this seed — the theorem checked
// numerically, exactly as the paper does. Closes with the frontier map:
// KDA (real decay), Gated DeltaNet-2 (erase/write decoupling), SFDA (phase).
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real math, module scope: the paper's constructive WY recursion, run.
// ---------------------------------------------------------------------------

const D = 8;
const C = 8;
const rand = mulberry32(20260714);

function randUnit(): number[] {
  const v = Array.from({ length: D }, () => rand() * 2 - 1);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

const LAM: number[][] = [];
const US: number[][] = [];
const RS: number[][] = [];
for (let t = 0; t < C; t++) {
  LAM.push(Array.from({ length: D }, () => 0.85 + rand() * 0.14));
  const k = randUnit();
  const beta = 0.5 + rand() * 0.5;
  US.push(k.map((x) => beta * x)); // u_t = β_t k_t
  RS.push(k.map((x, i) => LAM[t][i] * x)); // r_t = Λ_tᵀ k_t
}

type Mat = number[][];
const matmul = (A: Mat, B: Mat): Mat =>
  A.map((r) => B[0].map((_, j) => r.reduce((acc, x, k) => acc + x * B[k][j], 0)));
const denseA = (t: number): Mat =>
  Array.from({ length: D }, (_, i) =>
    Array.from({ length: D }, (_, j) => (i === j ? LAM[t][i] : 0) - US[t][i] * RS[t][j]),
  );

/** Dense product P = A_C ··· A_1. */
const P_DENSE: Mat = (() => {
  let P = denseA(0);
  for (let t = 1; t < C; t++) P = matmul(denseA(t), P);
  return P;
})();

/** The paper's recursion: Γ, Y, M, W snapshots after each token. */
interface WY {
  Gam: number[]; // diagonal
  Y: number[][]; // columns (length D each)
  W: number[][];
  M: number[][]; // rows
}
const WY_STEPS: WY[] = (() => {
  const out: WY[] = [];
  let Gam = new Array(D).fill(1) as number[];
  let Y: number[][] = [];
  let W: number[][] = [];
  let Mm: number[][] = [];
  for (let t = 0; t < C; t++) {
    const wcol = RS[t].map((x, i) => Gam[i] * x); // Γ_{t-1}ᵀ r_t
    const rY = Y.map((col) => RS[t].reduce((acc, x, i) => acc + x * col[i], 0));
    const rYM = Mm.length
      ? Mm[0].map((_, j) => rY.reduce((acc, x, i) => acc + x * (Mm[i][j] ?? 0), 0))
      : [];
    Mm = Mm.map((r) => [...r, 0]);
    Mm.push([...rYM.map((x) => -x), 1]);
    Y = Y.map((col) => col.map((x, i) => LAM[t][i] * x));
    Y.push([...US[t]]);
    W = [...W, wcol];
    Gam = Gam.map((g, i) => LAM[t][i] * g);
    out.push({ Gam: [...Gam], Y: Y.map((c) => [...c]), W: W.map((c) => [...c]), M: Mm.map((r) => [...r]) });
  }
  return out;
})();

/** Reconstruct P from the factors and measure the error — the theorem check. */
const MAX_DIFF: number = (() => {
  const { Gam, Y, W, M: Mm } = WY_STEPS[C - 1];
  let md = 0;
  for (let i = 0; i < D; i++)
    for (let j = 0; j < D; j++) {
      let s = i === j ? Gam[i] : 0;
      for (let a = 0; a < C; a++) for (let b = 0; b < C; b++) s -= Y[a][i] * Mm[a][b] * W[b][j];
      md = Math.max(md, Math.abs(P_DENSE[i][j] - s));
    }
  return md; // ≈ 3.9e-16
})();

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const CHAIN_Y = 150;
const FACT_Y = 320;
const CELLF = 14;

const CAM_CHAIN: CameraState = { x: 640, y: 170, k: 1.25 };
const CAM_FACT: CameraState = { x: 640, y: 380, k: 1.2 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  chainU: ChannelRef<number>;
  formU: ChannelRef<number>;
  factTok: ChannelRef<number>;
  factU: ChannelRef<number>;
  checkU: ChannelRef<number>;
  mapU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const chainU = tl.channel('chainU', 0);
  const formU = tl.channel('formU', 0);
  const factTok = tl.channel('factTok', 0);
  const factU = tl.channel('factU', 0);
  const checkU = tl.channel('checkU', 0);
  const mapU = tl.channel('mapU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the wall
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'One problem stands between the delta rule and real hardware: the updates are a chain. Each state needs the one before it — and a chain is the worst possible shape for a parallel machine.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_CHAIN, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(chainU, 1, { at: 1.2, dur: 1.8, ease: ease.draw });
  tl.caption({
    at: 7.0,
    dur: 5.8,
    text: 'The way out starts with a structural gift: every delta-rule transition, gated or phased, is a diagonal matrix minus one rank-one correction. Cheap structure, not a dense matrix.',
  });
  tl.tween(formU, 1, { at: 8.6, dur: 0.8, ease: ease.enter });
  tl.hold(13.0, 0.6);

  // Beat 2 — the factorization
  tl.caption({
    at: 13.6,
    dur: 6.2,
    text: 'The paper proves you can multiply a whole chunk of these transitions — here, eight of them — while keeping that structure. The product stays one diagonal minus a skinny correction.',
  });
  tl.tween(cam, CAM_FACT, { at: 13.8, dur: 1.5, ease: ease.move });
  tl.tween(factU, 1, { at: 14.6, dur: 1.0, ease: ease.draw });
  tl.tween(factTok, C, { at: 16.2, dur: 6.5, ease: ease.linear });
  tl.caption({
    at: 20.4,
    dur: 6.0,
    text: 'Watch the factors grow as tokens are absorbed: the diagonal accumulates the decay, and the correction gains exactly one column per token. Rank grows inside the chunk — never across the sequence.',
  });
  tl.hold(26.6, 0.6);

  // Beat 3 — the check
  tl.caption({
    at: 27.2,
    dur: 5.8,
    text: 'And this is not an existence proof — it is a recipe you can run. We ran it: multiply the eight matrices densely, then rebuild the product from the factors.',
  });
  tl.tween(checkU, 1, { at: 28.6, dur: 0.8, ease: ease.pop });
  tl.caption({
    at: 33.4,
    dur: 5.4,
    text: 'The largest disagreement across all sixty four entries is about four times ten to the minus sixteen. Floating point dust. The chunk algebra is exact.',
  });
  tl.caption({
    at: 39.2,
    dur: 5.6,
    text: 'That is what makes these layers trainable at scale: inside a chunk, everything is parallel matrix work the accelerator loves; between chunks, one cheap sequential handoff.',
  });
  tl.hold(45.0, 0.7);

  // Beat 4 — the frontier map
  tl.caption({
    at: 45.7,
    dur: 6.4,
    text: 'Step back and the frontier snaps into focus. One family, three levers on the same recurrence: what the decay is, and whether erase and write share a knob.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 45.9, dur: 1.5, ease: ease.move });
  tl.tween(mapU, 1, { at: 47.1, dur: 1.1, ease: ease.enter });
  tl.caption({
    at: 52.3,
    dur: 6.2,
    text: 'Kimi Delta Attention gates a real decay. Gated Delta Net two decouples the erase strength from the write strength. Semidirect Fourier Delta Attention lets the decay rotate. All three ride the same chunked kernel.',
  });
  tl.hold(58.7, 0.6);

  // Beat 5 — close the book
  tl.caption({
    at: 59.3,
    dur: 6.0,
    text: 'From a matrix of fast weights, to writes that correct their own errors, to decay, phase, and a factorization that makes it all trainable. That is the delta rule — the little update the frontier converged on.',
  });
  tl.tween(dimU, 1, { at: 59.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 60.5, dur: 0.9, ease: ease.enter });
  tl.hold(65.3, 1.2);

  return { tl, cam, titleU, chainU, formU, factTok, factU, checkU, mapU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/delta-chunk-frontier/overrides.json',
  slug: 'delta-chunk-frontier',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const chainU = s.get(scene.chainU);
  const formU = s.get(scene.formU);
  const factTok = s.get(scene.factTok);
  const factU = s.get(scene.factU);
  const checkU = s.get(scene.checkU);
  const mapU = s.get(scene.mapU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const nCols = Math.max(0, Math.min(C, factTok));
  const step = Math.max(0, Math.min(C - 1, Math.ceil(nCols) - 1));
  const wy = WY_STEPS[Math.max(0, step)];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the sequential chain */}
          <g opacity={chainU}>
            <text x={200} y={CHAIN_Y - 40} fill={colors.TEXT} fontSize={16}>
              a chunk of eight delta-rule transitions
            </text>
            {Array.from({ length: C }, (_, t) => (
              <g key={t} opacity={clamp01(chainU * C - t)}>
                <rect x={200 + t * 110} y={CHAIN_Y - 20} width={84} height={44} rx={8} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
                <text x={200 + t * 110 + 42} y={CHAIN_Y + 7} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily="monospace">
                  A{t + 1}
                </text>
                {t < C - 1 && (
                  <text x={200 + t * 110 + 96} y={CHAIN_Y + 7} fill={colors.MUTED} fontSize={15}>
                    ·
                  </text>
                )}
              </g>
            ))}
          </g>

          {/* the growing factorization */}
          <g opacity={factU}>
            <text x={200} y={FACT_Y - 24} fill={colors.TEXT} fontSize={16}>
              the chunk product, factored — rank grows only inside the chunk
            </text>
            {/* Γ diagonal */}
            <g>
              <text x={200} y={FACT_Y + 4} fill={colors.WARM} fontSize={14} fontFamily="monospace">
                Γ
              </text>
              {wy.Gam.map((g, i) => (
                <rect
                  key={i}
                  x={224 + i * CELLF}
                  y={FACT_Y + i * CELLF - 4}
                  width={CELLF - 2}
                  height={CELLF - 2}
                  rx={2}
                  fill={colors.heat(clamp01(g))}
                />
              ))}
            </g>
            {/* Y (d × t) */}
            <g>
              <text x={420} y={FACT_Y + 4} fill={colors.ACCENT} fontSize={14} fontFamily="monospace">
                Y
              </text>
              {wy.Y.map((col, c) =>
                col.map((v, i) => (
                  <rect
                    key={`${c}-${i}`}
                    x={444 + c * CELLF}
                    y={FACT_Y + i * CELLF - 4}
                    width={CELLF - 2}
                    height={CELLF - 2}
                    rx={2}
                    fill={colors.heat(clamp01(0.5 + v))}
                    opacity={c < nCols ? 1 : 0}
                  />
                )),
              )}
            </g>
            {/* M (t × t lower-tri) */}
            <g>
              <text x={610} y={FACT_Y + 4} fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
                M
              </text>
              {wy.M.map((row, i) =>
                row.map((v, j) => (
                  <rect
                    key={`${i}-${j}`}
                    x={634 + j * CELLF}
                    y={FACT_Y + i * CELLF - 4}
                    width={CELLF - 2}
                    height={CELLF - 2}
                    rx={2}
                    fill={colors.heat(clamp01(0.5 + v * 0.5))}
                    opacity={i < nCols && j < nCols ? 1 : 0}
                  />
                )),
              )}
            </g>
            {/* W (d × t) */}
            <g>
              <text x={800} y={FACT_Y + 4} fill={colors.POSITIVE} fontSize={14} fontFamily="monospace">
                W
              </text>
              {wy.W.map((col, c) =>
                col.map((v, i) => (
                  <rect
                    key={`${c}-${i}`}
                    x={824 + c * CELLF}
                    y={FACT_Y + i * CELLF - 4}
                    width={CELLF - 2}
                    height={CELLF - 2}
                    rx={2}
                    fill={colors.heat(clamp01(0.5 + v))}
                    opacity={c < nCols ? 1 : 0}
                  />
                )),
              )}
            </g>
            <text x={444} y={FACT_Y + D * CELLF + 20} fill={colors.MUTED} fontSize={12}>
              columns absorbed: {Math.round(nCols)} of {C} — rank ≤ {C}
            </text>

            {/* verification badge */}
            {checkU > 0 && (
              <g opacity={checkU}>
                <rect x={960} y={FACT_Y - 8} width={230} height={104} rx={10} fill={colors.PANEL} stroke={colors.GRID} opacity={0.95} />
                <text x={1075} y={FACT_Y + 18} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
                  dense product vs factors
                </text>
                <text x={1075} y={FACT_Y + 46} textAnchor="middle" fill={colors.POSITIVE} fontSize={19} fontFamily="monospace" fontWeight={700}>
                  {MAX_DIFF.toExponential(1)}
                </text>
                <text x={1075} y={FACT_Y + 72} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                  max error, 64 entries
                </text>
              </g>
            )}
          </g>

          {/* the frontier map */}
          {mapU > 0 && (
            <g opacity={mapU}>
              {[
                { x: 240, name: 'KDA', desc: 'gated real decay', tex: true, color: colors.WARM },
                { x: 640, name: 'Gated DeltaNet-2', desc: 'erase ≠ write', tex: false, color: colors.ACCENT },
                { x: 1040, name: 'SFDA', desc: 'phase-decay Λ', tex: false, color: colors.SECONDARY },
              ].map((p) => (
                <g key={p.name}>
                  <rect x={p.x - 130} y={520} width={260} height={78} rx={10} fill={colors.PANEL} stroke={p.color} strokeWidth={1.5} opacity={0.95} />
                  <text x={p.x} y={552} textAnchor="middle" fill={p.color} fontSize={17} fontWeight={600}>
                    {p.name}
                  </text>
                  <text x={p.x} y={578} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                    {p.desc}
                  </text>
                </g>
              ))}
              <line x1={370} y1={559} x2={510} y2={559} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={770} y1={559} x2={910} y2={559} stroke={colors.GRID} strokeWidth={1.5} />
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The chunked frontier
        </text>
        <text x={40} y={70} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
          arXiv:2607.11897 · chunk-WY
        </text>
      </g>
      <MathLabel
        tex="A_t = \Lambda_t - u_t r_t^{*}"
        x={560}
        y={44}
        fontSize={20}
        color={colors.ACCENT}
        opacity={formU * mainOp}
      />
      <MathLabel
        tex="P = \Gamma - Y M W^{*}"
        x={820}
        y={44}
        fontSize={20}
        color={colors.POSITIVE}
        opacity={factU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={220} width={840} height={210} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            The little update the frontier converged on.
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Fast weights → error correction → decay and gates →
          </text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            phase — all riding one exact chunked factorization.
          </text>
          <text x={640} y={392} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
            The Explainers · The Delta Rule
          </text>
        </g>
      )}
    </>
  );
}

export function DeltaChunkFrontier() {
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
