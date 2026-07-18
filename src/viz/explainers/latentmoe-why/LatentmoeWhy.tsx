// arXiv:2601.18089 — "LatentMoE" — Chapter 3: why the squeeze doesn't cost
// accuracy. Two arguments from the paper plus its ablations:
// (1) Barron-style budget: approximation error ~ O(1/u) in the number of
//     nonlinear units, independent of input dimension — so preserve
//     U_eff ∝ K·m and width d is not itself the budget.
// (2) Routing combinatorics: C(αN, αK) ≥ C(N,K)^α — more, smaller experts
//     strictly grow the space of expert subsets. TOY numbers computed here:
//     C(16,2) ≈ 6.9 bits vs C(64,8) ≈ 32.0 bits of routing choice (α=4).
// Ablations (reported): quality holds for α ≤ 4, degrades beyond (Fig. 3);
// shrinking d WITHOUT scaling expert count degrades quality; scaling N,K by
// α recovers it with no hyperparameter retuning (Fig. 4).
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
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Toy combinatorics computed at module scope (log2 of binomials — exact)
// ---------------------------------------------------------------------------
function log2C(n: number, k: number): number {
  let s2 = 0;
  for (let i = 0; i < k; i++) s2 += Math.log2(n - i) - Math.log2(i + 1);
  return s2;
}
const BITS_BASE = log2C(16, 2); // ≈ 6.9
const BITS_LATENT = log2C(64, 8); // ≈ 32.0

// α sweep (reported shape of Fig. 3, replotted qualitatively): quality flat
// to α=4, degrading after. Points are illustrative of the reported finding.
const ALPHA_PTS = [
  { a: 1, loss: 0 },
  { a: 2, loss: 0.01 },
  { a: 4, loss: 0.02 },
  { a: 8, loss: 0.55 },
  { a: 16, loss: 1.0 },
];
const AS_X = 800;
const AS_Y = 430;
const AS_W = 360;
const AS_H = 220;
const asx = (a: number): number => AS_X + (Math.log2(a) / 4) * AS_W;
const asy = (l: number): number => AS_Y - 30 - (1 - l) * (AS_H - 60);

const CAM_BARRON: CameraState = { x: 400, y: 250, k: 1.3 };
const CAM_COMBO: CameraState = { x: 400, y: 460, k: 1.3 };
const CAM_SWEEP: CameraState = { x: AS_X + AS_W / 2, y: 340, k: 1.25 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  barronU: ChannelRef<number>;
  comboU: ChannelRef<number>;
  bitsU: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  cliffU: ChannelRef<number>;
  compU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const barronU = tl.channel('barronU', 0);
  const comboU = tl.channel('comboU', 0);
  const bitsU = tl.channel('bitsU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const curveU = tl.channel('curveU', 0);
  const cliffU = tl.channel('cliffU', 0);
  const compU = tl.channel('compU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the worry
  tl.caption({
    at: 0.5,
    dur: 5.0,
    text: 'The obvious objection: you squeezed every token to a quarter width. Surely you squeezed out a quarter of the intelligence with it. The paper has two answers — one from theory, one from ablation.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.hold(5.5, 0.7);

  // Beat 2 — Barron budget
  tl.caption({
    at: 6.2,
    dur: 6.0,
    text: 'The theory answer comes from classical approximation results: what a network of simple nonlinear units can express scales with how many units it activates — and, remarkably, not with the dimension of the space they read from.',
  });
  tl.tween(cam, CAM_BARRON, { at: 6.5, dur: 1.4, ease: ease.move });
  tl.tween(barronU, 1, { at: 7.5, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 12.7,
    dur: 4.8,
    text: 'So the quantity to protect is the active nonlinear budget — active experts times their inner width. The latent design holds that product exactly constant. Width was never the budget.',
  });
  tl.hold(17.5, 0.7);

  // Beat 3 — combinatorics
  tl.caption({
    at: 18.2,
    dur: 5.8,
    text: 'The second answer is sharper: more small experts do not just match the old design — they beat it combinatorially. Count the ways to choose which experts fire. That count explodes when you split the experts.',
  });
  tl.tween(cam, CAM_COMBO, { at: 18.5, dur: 1.4, ease: ease.move });
  tl.tween(comboU, 1, { at: 19.5, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 24.4,
    dur: 5.6,
    text: 'At toy scale you can compute it exactly. Choosing two of sixteen experts is about seven bits of routing choice. Choosing eight of sixty four — same compute, split four ways — is thirty two bits. Nearly five times the decision space.',
  });
  tl.tween(bitsU, 1, { at: 25.6, dur: 1.6, ease: ease.move });
  tl.hold(30.0, 0.7);

  // Beat 4 — the ablation cliff
  tl.caption({
    at: 30.7,
    dur: 5.8,
    text: 'And the ablation answer: sweep the squeeze. Quality holds at two fold and four fold compression — then falls off a cliff. Four is the edge of the plateau, and it is exactly where the paper parks.',
  });
  tl.tween(cam, CAM_SWEEP, { at: 31.0, dur: 1.4, ease: ease.move });
  tl.tween(sweepU, 1, { at: 31.8, dur: 1.2, ease: ease.draw });
  tl.tween(curveU, 1, { at: 33.0, dur: 1.6, ease: ease.draw });
  tl.tween(cliffU, 1, { at: 34.8, dur: 0.8, ease: ease.pop });
  tl.caption({
    at: 36.9,
    dur: 5.2,
    text: 'One more control makes the story causal: shrink the width without adding experts, and quality genuinely degrades. Add the experts back, and it recovers — with the original hyperparameters untouched.',
  });
  tl.tween(compU, 1, { at: 38.2, dur: 0.9, ease: ease.enter });
  tl.hold(42.1, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 42.8,
    dur: 4.8,
    text: 'So the squeeze is safe because the budget lives in active units and routing choices, not raw width — and the ablations agree with the theory about exactly where safe ends.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 43.0, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 43.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 44.5, dur: 1.0, ease: ease.enter });
  tl.hold(47.6, 1.2);

  return {
    tl, cam, titleU, barronU, comboU, bitsU, sweepU, curveU,
    cliffU, compU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/latentmoe-why/overrides.json',
  slug: 'latentmoe-why',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const barronU = s.get(scene.barronU);
  const comboU = s.get(scene.comboU);
  const bitsU = s.get(scene.bitsU);
  const sweepU = s.get(scene.sweepU);
  const curveU = s.get(scene.curveU);
  const cliffU = s.get(scene.cliffU);
  const compU = s.get(scene.compU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const curvePath = ALPHA_PTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${asx(p.a)},${asy(p.loss)}`).join(' ');

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* Barron panel */}
          {barronU > 0 && (
            <g opacity={barronU}>
              <rect x={140} y={150} width={520} height={140} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={162} y={182} fill={colors.SECONDARY} fontSize={14} fontWeight={600}>
                the budget that matters
              </text>
              <MathLabel tex={'\\varepsilon \\sim \\mathcal{O}(1/u) \\quad \\text{(dimension-free)}'} x={400} y={222} fontSize={17} color={colors.TEXT} />
              <MathLabel tex={'U_{\\mathrm{eff}} \\propto K \\cdot m \\;\\; \\text{held constant}'} x={400} y={262} fontSize={17} color={colors.POSITIVE} />
            </g>
          )}

          {/* combinatorics panel */}
          {comboU > 0 && (
            <g opacity={comboU}>
              <rect x={140} y={340} width={520} height={210} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={162} y={372} fill={colors.SECONDARY} fontSize={14} fontWeight={600}>
                routing choice grows combinatorially
              </text>
              <MathLabel tex={'\\binom{\\alpha N}{\\alpha K} \\geq \\binom{N}{K}^{\\alpha}'} x={400} y={412} fontSize={18} color={colors.TEXT} />
              {bitsU > 0 && (
                <g opacity={bitsU}>
                  <text x={180} y={462} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    toy, computed here (α = 4):
                  </text>
                  <rect x={180} y={476} width={(BITS_BASE / 32) * 300 * bitsU} height={16} rx={4} fill={colors.MUTED} opacity={0.6} />
                  <text x={190 + (BITS_BASE / 32) * 300} y={489} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    C(16,2) ≈ {BITS_BASE.toFixed(1)} bits
                  </text>
                  <rect x={180} y={500} width={(BITS_LATENT / 32) * 300 * bitsU} height={16} rx={4} fill={colors.POSITIVE} opacity={0.8} />
                  <text x={190 + (BITS_LATENT / 32) * 300} y={513} fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                    C(64,8) ≈ {BITS_LATENT.toFixed(1)} bits
                  </text>
                </g>
              )}
            </g>
          )}

          {/* α sweep */}
          {sweepU > 0 && (
            <g opacity={sweepU}>
              <line x1={AS_X} y1={AS_Y} x2={AS_X + AS_W} y2={AS_Y} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={AS_X} y1={AS_Y} x2={AS_X} y2={AS_Y - AS_H} stroke={colors.GRID} strokeWidth={1.5} />
              {[1, 2, 4, 8, 16].map((a) => (
                <text key={a} x={asx(a)} y={AS_Y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  {a}
                </text>
              ))}
              <text x={AS_X + AS_W / 2} y={AS_Y + 42} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                compression ratio α
              </text>
              <text x={AS_X - 10} y={AS_Y - AS_H - 12} fill={colors.MUTED} fontSize={12}>
                validation loss — reported trend (Fig. 3), replotted
              </text>
              <path d={curvePath} fill="none" stroke={colors.ACCENT} strokeWidth={3}
                strokeDasharray={`${700 * clamp01(curveU)} 700`} opacity={0.9} />
              {ALPHA_PTS.map((p, i) => {
                const u = clamp01(curveU * ALPHA_PTS.length - i);
                if (u <= 0) return null;
                return <circle key={p.a} cx={asx(p.a)} cy={asy(p.loss)} r={5} fill={p.a <= 4 ? colors.POSITIVE : colors.NEGATIVE} opacity={u} />;
              })}
              {cliffU > 0 && (
                <g opacity={cliffU}>
                  <line x1={asx(4)} y1={AS_Y} x2={asx(4)} y2={AS_Y - AS_H} stroke={colors.WARM} strokeDasharray="4 4" opacity={0.7} />
                  <text x={asx(4)} y={AS_Y - AS_H + 18} textAnchor="middle" fill={colors.WARM} fontSize={12} fontWeight={600}>
                    α = 4 · edge of the plateau
                  </text>
                </g>
              )}
            </g>
          )}

          {/* compensation control */}
          {compU > 0 && (
            <g opacity={compU}>
              <rect x={AS_X - 40} y={AS_Y + 60} width={440} height={64} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={AS_X - 18} y={AS_Y + 86} fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                shrink d, keep N — quality drops
              </text>
              <text x={AS_X - 18} y={AS_Y + 108} fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                shrink d, scale N and K by α — recovers (Fig. 4)
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Why the squeeze is safe
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2601.18089 · theory + ablations
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            The budget is units and choices, not width
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            hold the active nonlinear budget, multiply the routing space,
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            and stop compressing exactly where the ablation says to
          </text>
        </g>
      )}
    </>
  );
}

export function LatentmoeWhy() {
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
