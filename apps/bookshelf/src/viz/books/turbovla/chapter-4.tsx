// Skip the Giant Model — chapter 4: Put Speed on the Same Plot as Success.
//
// Grounded in arXiv:2607.27205 Table 1, Sections 5.2–5.4 and Tables 3–6;
// README benchmark recipe; turbovla/training/trainer.py masked L1 behavior-
// cloning loop. All plotted measurements below are copied from paper Table 1.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { scaleLinear } from 'd3';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const METHODS = [
  { name: 'OpenVLA', latency: 202.9, success: 76.5, params: 7.5, vram: 14.9 },
  { name: 'π0', latency: 84.2, success: 94.2, params: 3.2, vram: 12.3 },
  { name: 'π0.5', latency: 93.6, success: 96.9, params: 3.4, vram: 12.8 },
  { name: 'CogVLA', latency: 115.5, success: 97.4, params: 8.3, vram: 16.1 },
  { name: 'Mantis', latency: 198.7, success: 96.7, params: 4.9, vram: 7.9 },
  { name: 'VLA-JEPA', latency: 108.7, success: 97.2, params: 2.8, vram: 5.3 },
  { name: 'DDVLA', latency: 60.8, success: 96.4, params: 7.5, vram: 14.5 },
  { name: 'VLA-Adapter', latency: 87.3, success: 97.3, params: 1.5, vram: 4.3 },
  { name: 'Evo-1', latency: 137.2, success: 94.8, params: 0.8, vram: 1.7 },
  { name: 'TurboVLA', latency: 31.2, success: 97.7, params: 0.2, vram: 0.9 },
];
const SUITES = [{ name: 'spatial', v: 99.2 }, { name: 'object', v: 99.8 }, { name: 'goal', v: 97.4 }, { name: 'long', v: 94.2 }];
const sx = scaleLinear([20, 220], [130, 830]);
const sy = scaleLinear([74, 100], [540, 120]);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axesU = tl.channel('axesU', 0);
  const pointsU = tl.channel('pointsU', 0);
  const turboU = tl.channel('turboU', 0);
  const sizeU = tl.channel('sizeU', 0);
  const vramU = tl.channel('vramU', 0);
  const suitesU = tl.channel('suitesU', 0);
  const languageU = tl.channel('languageU', 0);
  const recipeU = tl.channel('recipeU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.9, text: 'Success alone hides the deployment problem, so the paper measures every runnable policy on the same graphics card at batch size one.' });
  tl.tween(axesU, 1, { at: 0.9, dur: 1.3, ease: ease.draw });
  tl.tween(pointsU, 1, { at: 1.6, dur: 2.1, ease: ease.enter });
  tl.hold(6.4, 0.6);

  tl.caption({ at: 7.0, dur: 5.8, text: 'On latency versus average Libero success, Turbo V L A lands at thirty one point two milliseconds and ninety seven point seven percent.' });
  tl.tween(turboU, 1, { at: 7.5, dur: 1.0, ease: ease.pop });
  tl.tween(cam, { x: sx(31.2), y: sy(97.7), k: 1.38 }, { at: 8.0, dur: 1.4, ease: ease.move });
  tl.hold(12.8, 0.6);

  tl.caption({ at: 13.4, dur: 5.7, text: 'Now let point size show parameter count. The highlighted policy stays smallest at two hundred million parameters.' });
  tl.tween(sizeU, 1, { at: 13.9, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 14.5, dur: 1.3, ease: ease.move });
  tl.hold(19.1, 0.6);

  tl.caption({ at: 19.7, dur: 5.7, text: 'Add a memory halo and the same point remains the lightest: nine tenths of a gigabyte for the complete online policy.' });
  tl.tween(vramU, 1, { at: 20.2, dur: 1.3, ease: ease.enter });
  tl.hold(25.4, 0.6);

  tl.caption({ at: 26.0, dur: 5.9, text: 'Its average comes from ninety nine point two spatial, ninety nine point eight object, ninety seven point four goal, and ninety four point two long-horizon success.' });
  tl.tween(suitesU, 1, { at: 26.5, dur: 1.7, ease: ease.enter });
  tl.tween(cam, { x: 1020, y: 350, k: 1.14 }, { at: 27.0, dur: 1.3, ease: ease.move });
  tl.hold(31.9, 0.6);

  tl.caption({ at: 32.5, dur: 5.9, text: 'This is not a language-free policy. Removing language drops the average to seventy point eight and the goal suite to eleven point six.' });
  tl.tween(languageU, 1, { at: 33.0, dur: 1.5, ease: ease.move });
  tl.hold(38.4, 0.6);

  tl.caption({ at: 39.0, dur: 6.0, text: 'The working recipe keeps semantic instructions, six bidirectional fusion layers, twelve-step chunks, and masked behavior-cloning loss.' });
  tl.tween(recipeU, 1, { at: 39.5, dur: 1.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 40.0, dur: 1.3, ease: ease.move });
  tl.hold(45.0, 0.6);

  tl.caption({ at: 45.6, dur: 6.4, text: 'The result is an execution specialist: fast, compact, and language-conditioned, while high-level planning remains outside its claim.' });
  tl.tween(dimU, 1, { at: 46.1, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 46.8, dur: 0.7, ease: ease.enter });
  tl.hold(52.0, 1.0);

  return { tl, cam, axesU, pointsU, turboU, sizeU, vramU, suitesU, languageU, recipeU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const axesU = s.get(scene.axesU);
  const pointsU = s.get(scene.pointsU);
  const turboU = s.get(scene.turboU);
  const sizeU = s.get(scene.sizeU);
  const vramU = s.get(scene.vramU);
  const suitesU = s.get(scene.suitesU);
  const languageU = s.get(scene.languageU);
  const recipeU = s.get(scene.recipeU);
  const mainOpacity = 1 - 0.9 * s.get(scene.dimU);
  const camera = s.get(scene.cam);
  const axesOpacity = axesU * clamp01((1.08 - camera.k) / 0.08);

  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={mainOpacity}>
      <text x={640} y={50} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={760}>Put speed on the same plot as success</text>
      <text x={640} y={76} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>paper Table 1 · RTX 4090 · batch size 1</text>
    </g>
    <Camera {...camera}>
      <g opacity={mainOpacity}>
        <g opacity={axesOpacity}>
          <line x1={110} y1={560} x2={860} y2={560} stroke={colors.GRID} strokeWidth={2} />
          <line x1={110} y1={560} x2={110} y2={100} stroke={colors.GRID} strokeWidth={2} />
          {[50, 100, 150, 200].map((v) => <g key={v}><line x1={sx(v)} y1={552} x2={sx(v)} y2={568} stroke={colors.GRID} /><text x={sx(v)} y={590} textAnchor="middle" fill={colors.MUTED} fontSize={11}>{v}</text></g>)}
          {[80, 85, 90, 95, 100].map((v) => <g key={v}><line x1={102} y1={sy(v)} x2={118} y2={sy(v)} stroke={colors.GRID} /><text x={92} y={sy(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11}>{v}</text></g>)}
          <text x={485} y={608} textAnchor="middle" fill={colors.MUTED} fontSize={12}>latency in milliseconds → lower is better</text>
          <text x={30} y={332} transform="rotate(-90 30 332)" textAnchor="middle" fill={colors.MUTED} fontSize={12}>average success → higher is better</text>
        </g>

        {METHODS.map((m, i) => {
          const u = clamp01(pointsU * METHODS.length - i);
          const isTurbo = m.name === 'TurboVLA';
          const r = 7 + sizeU * Math.sqrt(m.params) * 5;
          return <g key={m.name} opacity={u}>
            {vramU > 0 && <circle cx={sx(m.latency)} cy={sy(m.success)} r={r + m.vram * 0.7} fill="none" stroke={isTurbo ? colors.POSITIVE : colors.SECONDARY} strokeWidth={1.5} opacity={0.12 + 0.35 * vramU} />}
            <circle cx={sx(m.latency)} cy={sy(m.success)} r={isTurbo ? r + turboU * 7 : r} fill={isTurbo ? colors.POSITIVE : colors.ACCENT} opacity={isTurbo ? 0.95 : 0.48} stroke={isTurbo ? colors.WARM : colors.ACCENT} strokeWidth={isTurbo ? 3 : 1} />
            <text x={sx(m.latency) + 10} y={sy(m.success) - 10} fill={isTurbo ? colors.POSITIVE : colors.MUTED} fontSize={isTurbo ? 13 : 9} fontWeight={isTurbo ? 800 : 500}>{m.name}</text>
          </g>;
        })}

        <g transform="translate(920 126)" opacity={suitesU}>
          <rect width={260} height={245} rx={20} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={130} y={34} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={700}>LIBERO suites</text>
          {SUITES.map((d, i) => {
            const w = (d.v - 90) * 17;
            return <g key={d.name} transform={`translate(28 ${65 + i * 43})`}>
              <text x={0} y={14} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>{d.name}</text>
              <rect x={74} y={0} width={w} height={18} rx={9} fill={colors.POSITIVE} opacity={0.78} />
              <text x={82 + w} y={14} fill={colors.TEXT} fontSize={11}>{d.v}</text>
            </g>;
          })}
        </g>

        {languageU > 0 && <g transform="translate(920 404)" opacity={languageU}>
          <rect width={260} height={160} rx={20} fill={colors.PANEL} stroke={colors.NEGATIVE} />
          <text x={130} y={32} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={700}>language ablation</text>
          <text x={24} y={73} fill={colors.MUTED} fontSize={11}>average</text>
          <rect x={86} y={58} width={languageU * 126} height={18} rx={9} fill={colors.NEGATIVE} />
          <text x={220} y={72} fill={colors.NEGATIVE} fontSize={12}>70.8</text>
          <text x={24} y={117} fill={colors.MUTED} fontSize={11}>goal</text>
          <rect x={86} y={102} width={languageU * 21} height={18} rx={9} fill={colors.NEGATIVE} />
          <text x={116} y={116} fill={colors.NEGATIVE} fontSize={12}>11.6</text>
          <text x={130} y={145} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>w/o Language</text>
        </g>}

        {recipeU > 0 && <g transform="translate(170 102)" opacity={recipeU}>
          <rect x={0} y={0} width={660} height={54} rx={17} fill={colors.PANEL} stroke={colors.WARM} />
          {['semantic text', '6 × bidirectional', '12-step chunk', 'masked L1 loss'].map((label, i) => <g key={label} transform={`translate(${18 + i * 160} 11)`}>
            <rect width={145} height={32} rx={16} fill={i === 1 ? colors.SECONDARY : i === 2 ? colors.POSITIVE : colors.BG} stroke={i === 1 ? colors.SECONDARY : i === 2 ? colors.POSITIVE : colors.GRID} />
            <text x={72} y={21} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>{label}</text>
          </g>)}
        </g>}
      </g>
    </Camera>
    {s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}>
      <rect x={185} y={218} width={910} height={232} rx={26} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={31} fontWeight={800}>An execution specialist</text>
      <text x={640} y={326} textAnchor="middle" fill={colors.POSITIVE} fontSize={19}>97.7% · 31.2 ms · 0.9 GB</text>
      <text x={640} y={370} textAnchor="middle" fill={colors.MUTED} fontSize={15}>semantic language + direct interaction + parallel actions</text>
      <text x={640} y={410} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>scope: execution-level control · high-level planning remains future work</text>
    </g>}
  </>;
}

export const vizScene = () => scene;
