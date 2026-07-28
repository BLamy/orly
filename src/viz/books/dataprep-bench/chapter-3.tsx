// Proving Training Data — chapter 3: Measure the Gap Between Clouds.
//
// Grounded in examples/compute_mmd.py, Experiment.md, and
// src/distflow/data/dataset.py. The released configuration samples 5,000
// records with shuffle seed 42, embeds with Qwen3-Embedding-8B at 4,096
// dimensions, and computes biased MMD with an RBF kernel and sigma 1.0.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const COUNT = 48;
const rand = mulberry32(42);

interface Point {
  x: number;
  y: number;
  tx: number;
  ty: number;
}

const CANDIDATE: Point[] = Array.from({ length: COUNT }, (_, i) => {
  const a = rand() * Math.PI * 2;
  const r = 28 + rand() * 126;
  const x = 390 + Math.cos(a) * r * 1.05;
  const y = 350 + Math.sin(a) * r * 0.72 + Math.sin(i * 1.7) * 16;
  const ta = a + 0.28;
  const tr = 24 + rand() * 98;
  return { x, y, tx: 785 + Math.cos(ta) * tr, ty: 350 + Math.sin(ta) * tr * 0.76 };
});

const PROXY = Array.from({ length: COUNT }, (_, i) => {
  const a = rand() * Math.PI * 2;
  const r = 24 + rand() * 104;
  return { x: 865 + Math.cos(a) * r, y: 350 + Math.sin(a) * r * 0.74 + Math.cos(i * 1.3) * 10 };
});

const KERNEL_PAIRS = Array.from({ length: 18 }, (_, i) => [i * 2 % COUNT, (i * 7 + 3) % COUNT] as const);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cloudsU = tl.channel('cloudsU', 0);
  const sampleU = tl.channel('sampleU', 0);
  const embedU = tl.channel('embedU', 0);
  const kernelU = tl.channel('kernelU', 0);
  const withinCandidateU = tl.channel('withinCandidateU', 0);
  const withinProxyU = tl.channel('withinProxyU', 0);
  const crossU = tl.channel('crossU', 0);
  const formulaU = tl.channel('formulaU', 0);
  const alignU = tl.channel('alignU', 0);
  const verdictU = tl.channel('verdictU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.7, text: 'Suppose a candidate dataset claims to belong in a domain. Distributional Alignment Score asks how its cloud compares with a trusted proxy.' });
  tl.tween(cloudsU, 1, { at: 0.9, dur: 1.6, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 345, k: 1.08 }, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.hold(6.2, 0.5);

  tl.caption({ at: 6.7, dur: 5.5, text: 'The released experiment takes five thousand samples from each dataset and shuffles them with seed forty-two.' });
  tl.tween(sampleU, 1, { at: 7.2, dur: 1.3, ease: ease.draw });
  tl.hold(12.2, 0.5);

  tl.caption({ at: 12.7, dur: 5.8, text: 'Qwen three Embedding maps every sample into four thousand ninety-six dimensions. The screen shows a two-dimensional shadow.' });
  tl.tween(embedU, 1, { at: 13.2, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: 620, y: 342, k: 1.06 }, { at: 13.5, dur: 1.3, ease: ease.move });
  tl.hold(18.5, 0.5);

  tl.caption({ at: 19.0, dur: 5.4, text: 'A radial basis kernel turns distance into soft similarity. Near neighbors pull a bright thread; distant points barely notice each other.' });
  tl.tween(kernelU, 1, { at: 19.5, dur: 1.5, ease: ease.draw });
  tl.hold(24.4, 0.5);

  tl.caption({ at: 24.9, dur: 5.4, text: 'First, the biased estimator averages similarities inside the candidate cloud.' });
  tl.tween(withinCandidateU, 1, { at: 25.4, dur: 1.3, ease: ease.enter });
  tl.hold(30.3, 0.5);

  tl.caption({ at: 30.8, dur: 5.3, text: 'Then it averages similarities inside the domain proxy, using the same kernel and the same scale.' });
  tl.tween(withinProxyU, 1, { at: 31.3, dur: 1.3, ease: ease.enter });
  tl.hold(36.1, 0.5);

  tl.caption({ at: 36.6, dur: 5.8, text: 'Cross-cloud similarity is subtracted twice. What remains is maximum mean discrepancy: the gap between distributions.' });
  tl.tween(crossU, 1, { at: 37.1, dur: 1.5, ease: ease.draw });
  tl.tween(formulaU, 1, { at: 39.1, dur: 0.7, ease: ease.enter });
  tl.hold(42.4, 0.5);

  tl.caption({ at: 42.9, dur: 5.7, text: 'Move the candidate toward the proxy and the gap contracts. Better alignment means a smaller distributional distance.' });
  tl.tween(alignU, 1, { at: 43.5, dur: 3.2, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 46.3, dur: 1.3, ease: ease.move });
  tl.hold(48.6, 0.5);

  tl.caption({ at: 49.1, dur: 6.2, text: 'The score needs no model training of its own, but Data Prep Bench still judges it by whether it predicts downstream training utility.' });
  tl.tween(verdictU, 1, { at: 49.6, dur: 0.8, ease: ease.pop });
  tl.tween(dimU, 1, { at: 51.0, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 51.9, dur: 0.7, ease: ease.enter });
  tl.hold(55.3, 1.0);

  return { tl, cam, cloudsU, sampleU, embedU, kernelU, withinCandidateU, withinProxyU, crossU, formulaU, alignU, verdictU, dimU, endU };
}

const scene = buildScene();

function pointPosition(i: number, alignU: number) {
  const p = CANDIDATE[i];
  return { x: lerp(p.x, p.tx, alignU), y: lerp(p.y, p.ty, alignU) };
}

export function Render({ s }: { s: SceneState }) {
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);
  const cloudsU = s.get(scene.cloudsU);
  const alignU = s.get(scene.alignU);
  const kernelU = s.get(scene.kernelU);
  const withinCandidateU = s.get(scene.withinCandidateU);
  const withinProxyU = s.get(scene.withinProxyU);
  const crossU = s.get(scene.crossU);
  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={700}>Distributional Alignment Score</text>
          <text x={640} y={84} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>DistflowDataset → OpenAIEmbed → MMDDistance</text>

          <g opacity={cloudsU}>
            <rect x={182} y={114} width={420} height={430} rx={20} fill={colors.PANEL} fillOpacity={0.58} stroke={colors.ACCENT} strokeOpacity={0.6} />
            <rect x={678} y={114} width={420} height={430} rx={20} fill={colors.PANEL} fillOpacity={0.58} stroke={colors.SECONDARY} strokeOpacity={0.6} />
            <text x={210} y={146} fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>candidate dataset</text>
            <text x={706} y={146} fill={colors.SECONDARY} fontSize={13} fontFamily={MONO}>domain proxy</text>

            {withinCandidateU > 0 && KERNEL_PAIRS.map(([a, b], i) => {
              const pa = pointPosition(a, alignU);
              const pb = pointPosition(b, alignU);
              return <line key={`c${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={colors.ACCENT} strokeWidth={1.2} opacity={0.2 * withinCandidateU} />;
            })}
            {withinProxyU > 0 && KERNEL_PAIRS.map(([a, b], i) => {
              const pa = PROXY[a];
              const pb = PROXY[b];
              return <line key={`p${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={colors.SECONDARY} strokeWidth={1.2} opacity={0.2 * withinProxyU} />;
            })}
            {crossU > 0 && KERNEL_PAIRS.map(([a, b], i) => {
              const pa = pointPosition(a, alignU);
              const pb = PROXY[b];
              const dx = pa.x - pb.x;
              const dy = pa.y - pb.y;
              const similarity = Math.exp(-(dx * dx + dy * dy) / 80000);
              return <line key={`x${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={colors.WARM} strokeWidth={1 + 2 * similarity} opacity={0.34 * similarity * crossU} />;
            })}

            {CANDIDATE.map((_, i) => {
              const p = pointPosition(i, alignU);
              const u = clamp01(cloudsU * 9 - i / 6);
              return <circle key={`candidate${i}`} cx={p.x} cy={p.y} r={4.6} fill={colors.ACCENT} opacity={0.34 + 0.58 * u} />;
            })}
            {PROXY.map((p, i) => {
              const u = clamp01(cloudsU * 9 - i / 6);
              return <circle key={`proxy${i}`} cx={p.x} cy={p.y} r={4.6} fill={colors.SECONDARY} opacity={0.34 + 0.58 * u} />;
            })}

            {s.get(scene.sampleU) > 0 && (
              <g opacity={s.get(scene.sampleU)}>
                <text x={392} y={522} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>5,000 samples · seed=42</text>
                <text x={888} y={522} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>5,000 samples · seed=42</text>
              </g>
            )}
            {s.get(scene.embedU) > 0 && (
              <text x={640} y={574} textAnchor="middle" fill={colors.POSITIVE} opacity={s.get(scene.embedU)} fontSize={12} fontFamily={MONO}>Qwen3-Embedding-8B · 4096 dimensions · display is a 2D projection</text>
            )}
            {kernelU > 0 && (
              <g opacity={kernelU}>
                <rect x={506} y={100} width={268} height={34} rx={17} fill={colors.PANEL} stroke={colors.WARM} />
                <text x={640} y={122} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>RBF kernel · sigma=1.0 · biased estimator</text>
              </g>
            )}
          </g>

          <MathLabel
            tex={'\\operatorname{MMD}^2 = \\mathbb{E}[k(x,x\')] + \\mathbb{E}[k(y,y\')] - 2\\mathbb{E}[k(x,y)]'}
            x={640}
            y={612}
            fontSize={21}
            opacity={s.get(scene.formulaU)}
          />

          {alignU > 0 && (
            <g opacity={clamp01(alignU * 3)}>
              <rect x={500} y={584} width={280} height={14} rx={7} fill={colors.GRID} />
              <rect x={500} y={584} width={280 * (1 - 0.78 * alignU)} height={14} rx={7} fill={colors.WARM} />
              <text x={790} y={596} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>MMD gap</text>
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={230} y={238} width={820} height={182} rx={20} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
          <text x={640} y={301} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={750}>Measure the gap between clouds</text>
          <text x={640} y={347} textAnchor="middle" fill={colors.MUTED} fontSize={16}>embed · compare within · compare across · subtract</text>
          <text x={640} y={384} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>DAS · training-free estimate of downstream utility</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
