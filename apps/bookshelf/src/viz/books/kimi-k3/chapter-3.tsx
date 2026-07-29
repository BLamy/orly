// A Million Tokens Deep — chapter 3: Sixteen Experts, No Stampede.
//
// Grounded in MoonshotAI/Kimi-K3 k3_tech_report.pdf §2.3, equations 11–14
// and Figures 4–5. Stable LatentMoE projects routed tokens to latent width
// 3584, uses 896 routed experts with 16 active per token plus two shared
// experts, inserts RMSNorm before W-up, bounds activations with SiTU-GLU,
// and balances dispatch with Quantile Balancing.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ROWS = 28;
const COLS = 32;
const EXPERTS = Array.from({ length: ROWS * COLS }, (_, i) => i);
const ACTIVE = new Set([3, 41, 78, 132, 179, 205, 268, 317, 364, 411, 478, 533, 608, 701, 792, 861]);
const HOT_LOAD = [15, 13, 11, 10, 8, 7, 6, 5, 3, 3, 2, 1, 1, 0, 0, 0];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tokenU = tl.channel('tokenU', 0);
  const gridU = tl.channel('gridU', 0);
  const routeU = tl.channel('routeU', 0);
  const latentU = tl.channel('latentU', 0);
  const sharedU = tl.channel('sharedU', 0);
  const normU = tl.channel('normU', 0);
  const curveU = tl.channel('curveU', 0);
  const heatU = tl.channel('heatU', 0);
  const balanceU = tl.channel('balanceU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.7, text: 'Kimi K3 owns eight hundred ninety-six routed experts, but each token wakes only sixteen of them.' });
  tl.tween(gridU, 1, { at: 0.8, dur: 1.8, ease: ease.enter });
  tl.tween(tokenU, 1, { at: 1.2, dur: 0.7, ease: ease.pop });
  tl.tween(routeU, 1, { at: 2.2, dur: 2.2, ease: ease.draw });
  tl.hold(6.2, 0.5);

  tl.caption({ at: 6.7, dur: 5.8, text: 'Routing the full model-width vector sixteen times would multiply communication and expert-weight traffic.' });
  tl.tween(cam, { x: 640, y: 350, k: 1.02 }, { at: 7.2, dur: 1.3, ease: ease.move });
  tl.hold(12.5, 0.5);

  tl.caption({ at: 13.0, dur: 6.0, text: 'Latent mixture of experts compresses the routed path to width three thousand five hundred eighty-four before dispatch.' });
  tl.tween(latentU, 1, { at: 13.5, dur: 1.4, ease: ease.move });
  tl.hold(19.0, 0.5);

  tl.caption({ at: 19.5, dur: 5.8, text: 'Two shared experts keep a full-width path for common work, while the compact path handles specialization.' });
  tl.tween(sharedU, 1, { at: 20.0, dur: 1.0, ease: ease.enter });
  tl.hold(25.3, 0.5);

  tl.caption({ at: 25.8, dur: 5.7, text: 'After the routed experts combine, root-mean-square normalization steadies their scale before projection back up.' });
  tl.tween(normU, 1, { at: 26.3, dur: 0.7, ease: ease.pop });
  tl.hold(31.5, 0.5);

  tl.caption({ at: 32.0, dur: 5.9, text: 'A smooth tanh cap also bounds both multiplicative branches, preventing large coordinates from exploding.' });
  tl.tween(curveU, 1, { at: 32.5, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 365, k: 1.03 }, { at: 32.7, dur: 1.3, ease: ease.move });
  tl.hold(37.9, 0.5);

  tl.caption({ at: 38.4, dur: 5.7, text: 'Stability is not enough. Ordinary top-sixteen routing can overheat popular experts and leave others idle.' });
  tl.tween(heatU, 1, { at: 38.9, dur: 1.4, ease: ease.enter });
  tl.hold(44.1, 0.5);

  tl.caption({ at: 44.6, dur: 6.1, text: 'Quantile Balancing adjusts each expert’s next dispatch bias to the score margin that matches its target load.' });
  tl.tween(balanceU, 1, { at: 45.1, dur: 2.0, ease: ease.move });
  tl.hold(50.7, 0.5);

  tl.caption({ at: 51.2, dur: 5.8, text: 'The bias chooses where tokens go, but it never changes the mixture weights or the router’s learned gradients.' });
  tl.tween(cam, CAMERA_HOME, { at: 51.7, dur: 1.3, ease: ease.move });
  tl.hold(57.0, 0.5);

  tl.caption({ at: 57.5, dur: 6.3, text: 'Extreme sparsity works only when the narrow path stays numerically calm and the expert field shares the traffic.' });
  tl.tween(dimU, 1, { at: 58.0, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 58.8, dur: 0.7, ease: ease.enter });
  tl.hold(63.8, 1.0);

  return { tl, cam, tokenU, gridU, routeU, latentU, sharedU, normU, curveU, heatU, balanceU, dimU, endU };
}

const scene = buildScene();

function SituCurve({ u }: { u: number }) {
  const pts = Array.from({ length: 100 }, (_, i) => {
    const x = -8 + i * (24 / 99);
    const swish = x / (1 + Math.exp(-x));
    const situ = 4 * Math.tanh(x / 4) / (1 + Math.exp(-x));
    const y = swish * (1 - u) + situ * u;
    return `${130 + i * 3.25},${550 - y * 13}`;
  }).join(' ');
  return (
    <g opacity={u}>
      <rect x={100} y={350} width={390} height={230} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
      <line x1={130} y1={550} x2={455} y2={550} stroke={colors.MUTED} />
      <line x1={238} y1={382} x2={238} y2={550} stroke={colors.MUTED} />
      <polyline points={pts} fill="none" stroke={colors.NEGATIVE} strokeWidth={3.5} />
      <line x1={130} y1={498} x2={455} y2={498} stroke={colors.WARM} strokeDasharray="6 6" />
      <text x={295} y={378} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={700}>SiTU-GLU smooth cap</text>
      <text x={445} y={490} textAnchor="end" fill={colors.WARM} fontSize={11} fontFamily={MONO}>β₁=4 · β₂=25</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const gridU = s.get(scene.gridU);
  const routeU = s.get(scene.routeU);
  const latentU = s.get(scene.latentU);
  const heatU = s.get(scene.heatU);
  const balanceU = s.get(scene.balanceU);
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={750}>Stable LatentMoE</text>
        <text x={640} y={84} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>896 routed experts · top-16 · latent width 3584 · 2 shared experts</text>
      </g>
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <g transform="translate(590 116)">
            {EXPERTS.map((i) => {
              const row = Math.floor(i / COLS);
              const col = i % COLS;
              const u = clamp01(gridU * 20 - i / 48);
              const active = ACTIVE.has(i);
              const heat = heatU > 0 && col < 5 ? (5 - col) / 5 : 0;
              const level = heat * (1 - balanceU) + (active ? 0.72 : 0.08) * balanceU;
              const fill = active ? colors.ACCENT : heat > 0 ? colors.NEGATIVE : colors.PANEL;
              return (
                <rect
                  key={i}
                  x={col * 17}
                  y={row * 15}
                  width={12}
                  height={10}
                  rx={2}
                  fill={fill}
                  opacity={u * (0.18 + (active ? 0.72 * routeU : 0) + 0.65 * level)}
                />
              );
            })}
            <text x={265} y={450} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>expert field E₁ … E₈₉₆</text>
          </g>

          {s.get(scene.tokenU) > 0 && (
            <g opacity={s.get(scene.tokenU)} transform="translate(130 170)">
              <rect width={220} height={74} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={110} y={31} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700}>token representation</text>
              <text x={110} y={54} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>d = 7168</text>
            </g>
          )}

          {latentU > 0 && (
            <g opacity={latentU}>
              <path d="M350 207 C430 207 450 275 540 275" fill="none" stroke={colors.SECONDARY} strokeWidth={5} />
              <rect x={400} y={244} width={120} height={62} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={460} y={270} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>W↓x</text>
              <text x={460} y={291} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>ℓ = 3584</text>
            </g>
          )}

          {routeU > 0 && (
            <g opacity={routeU}>
              {Array.from(ACTIVE).map((i, j) => {
                const row = Math.floor(i / COLS);
                const col = i % COLS;
                return <line key={i} x1={540} y1={275} x2={590 + col * 17} y2={116 + row * 15} stroke={colors.ACCENT} strokeWidth={1.2} opacity={0.25 + 0.55 * clamp01(routeU * 18 - j)} />;
              })}
            </g>
          )}

          {s.get(scene.sharedU) > 0 && (
            <g opacity={s.get(scene.sharedU)}>
              {[0, 1].map((i) => (
                <g key={i} transform={`translate(${170 + i * 130} 295)`}>
                  <rect width={110} height={54} rx={11} fill={colors.POSITIVE} opacity={0.16} stroke={colors.POSITIVE} />
                  <text x={55} y={31} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>shared {i + 1}</text>
                </g>
              ))}
            </g>
          )}

          {s.get(scene.normU) > 0 && (
            <g opacity={s.get(scene.normU)} transform="translate(1015 510)">
              <rect x={-105} y={-34} width={210} height={68} rx={13} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={0} y={-5} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontWeight={700}>RMSNorm</text>
              <text x={0} y={18} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>before W↑</text>
            </g>
          )}

          <SituCurve u={s.get(scene.curveU)} />

          {heatU > 0 && (
            <g opacity={heatU} transform="translate(540 548)">
              <text x={280} y={-15} textAnchor="middle" fill={balanceU > 0.5 ? colors.POSITIVE : colors.NEGATIVE} fontSize={12} fontWeight={700}>
                {balanceU > 0.5 ? 'QUANTILE-BALANCED LOAD' : 'OVERHEATED ROUTING'}
              </text>
              {HOT_LOAD.map((hot, i) => {
                const balanced = HOT_LOAD.reduce((a, b) => a + b, 0) / HOT_LOAD.length;
                const value = hot * (1 - balanceU) + balanced * balanceU;
                return <rect key={i} x={i * 35} y={70 - value * 4} width={23} height={value * 4} rx={4} fill={balanceU > 0.5 ? colors.POSITIVE : colors.NEGATIVE} opacity={0.75} />;
              })}
              <line x1={0} y1={70} x2={550} y2={70} stroke={colors.GRID} />
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={220} y={245} width={840} height={174} rx={20} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
          <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={750}>Sixteen experts, no stampede</text>
          <text x={640} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={16}>latent routing · bounded activations · quantile-balanced dispatch</text>
          <text x={640} y={388} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>Stable LatentMoE · Eq. 11–14</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
