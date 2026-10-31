// Proving Training Data — chapter 2: Make the Data Prove It.
//
// Grounded in README.md, Experiment.md, run_all_bench.sh,
// simple-evaluation/run_evaluation.sh, judge.py, and extract_score.py from the
// official DataPrep-Bench repository. The benchmark evaluates constructed data
// by fine-tuning under shared protocols and measuring downstream performance
// across math, general, science, business, medicine, and law.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const METHODS = [
  { name: 'Data-Construction-Skill', role: 'constructed by skill', color: colors.ACCENT },
  { name: 'agent baseline', role: 'constructed by agent', color: colors.SECONDARY },
  { name: 'DataFlow method', role: 'constructed by DataFlow', color: colors.WARM },
];
const DOMAINS = ['math', 'general', 'science', 'business', 'medicine', 'law'];
const DOMAIN_COLORS = [colors.ACCENT, colors.TEAL, colors.SECONDARY, colors.WARM, colors.POSITIVE, colors.NEGATIVE];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const sourceU = tl.channel('sourceU', 0);
  const methodU = tl.channel('methodU', 0);
  const anchorU = tl.channel('anchorU', 0);
  const trainU = tl.channel('trainU', 0);
  const wheelU = tl.channel('wheelU', 0);
  const runU = tl.channel('runU', 0);
  const scoreU = tl.channel('scoreU', 0);
  const resultU = tl.channel('resultU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.8, text: 'Training data can look polished and still teach nothing. Data Prep Bench asks the expensive question: does the model improve?' });
  tl.tween(sourceU, 1, { at: 0.9, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 330, y: 330, k: 1.16 }, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.hold(6.3, 0.5);

  tl.caption({ at: 6.8, dur: 5.4, text: 'Every construction method receives the same raw sources, so the comparison begins before anyone can move the goalposts.' });
  tl.tween(methodU, 1, { at: 7.3, dur: 1.5, ease: ease.enter });
  tl.hold(12.2, 0.5);

  tl.caption({ at: 12.7, dur: 5.5, text: 'Each candidate output joins the same Dolly fifteen thousand anchor before fine-tuning. The shared base makes the data the variable.' });
  tl.tween(anchorU, 1, { at: 13.2, dur: 1.1, ease: ease.pop });
  tl.tween(cam, { x: 620, y: 330, k: 1.08 }, { at: 13.4, dur: 1.3, ease: ease.move });
  tl.hold(18.2, 0.5);

  tl.caption({ at: 18.7, dur: 5.8, text: 'The released construction recipe trains for three epochs with cosine scheduling and Deep Speed stage three partitioning.' });
  tl.tween(trainU, 1, { at: 19.2, dur: 3.2, ease: ease.linear });
  tl.hold(24.5, 0.5);

  tl.caption({ at: 25.0, dur: 5.3, text: 'Then six spokes open: math, general knowledge, science, business, medicine, and law.' });
  tl.tween(wheelU, 1, { at: 25.5, dur: 1.7, ease: ease.enter });
  tl.tween(cam, { x: 680, y: 340, k: 1.0 }, { at: 25.7, dur: 1.3, ease: ease.move });
  tl.hold(30.3, 0.5);

  tl.caption({ at: 30.8, dur: 5.8, text: 'The runner serves the trained model, generates answers, dispatches domain-specific judges, and aggregates the results.' });
  tl.tween(runU, 4, { at: 31.4, dur: 4.3, ease: ease.linear });
  tl.hold(36.6, 0.5);

  tl.caption({ at: 37.1, dur: 5.5, text: 'Now each candidate card becomes a downstream score. Surface style has been replaced by measured training utility.' });
  tl.tween(scoreU, 1, { at: 37.7, dur: 1.4, ease: ease.move });
  tl.hold(42.6, 0.5);

  tl.caption({ at: 43.1, dur: 6.1, text: 'The paper reports that the construction skill lifts the Dolly-only finance baseline by nearly twenty points on an eight-billion-parameter Llama model.' });
  tl.tween(resultU, 1, { at: 43.7, dur: 0.8, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 47.2, dur: 1.3, ease: ease.move });
  tl.hold(49.2, 0.5);

  tl.caption({ at: 49.7, dur: 6.2, text: 'Prepared data earns its name only when a model trained on it can do more than the model trained without it.' });
  tl.tween(dimU, 1, { at: 50.2, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 51.1, dur: 0.7, ease: ease.enter });
  tl.hold(55.9, 1.0);

  return { tl, cam, sourceU, methodU, anchorU, trainU, wheelU, runU, scoreU, resultU, dimU, endU };
}

const scene = buildScene();

function MethodCard({ i, u, scoreU }: { i: number; u: number; scoreU: number }) {
  const m = METHODS[i];
  const y = 190 + i * 118;
  const uu = clamp01(u * 5 - i * 0.7);
  return (
    <g transform={`translate(${360 + scoreU * 270} ${y})`} opacity={uu}>
      <rect x={-128} y={-36} width={256} height={72} rx={12} fill={colors.PANEL} stroke={m.color} strokeWidth={1.5} />
      <text x={-108} y={-4} fill={colors.TEXT} fontSize={14} fontWeight={700} fontFamily={MONO}>{m.name}</text>
      <text x={-108} y={18} fill={m.color} fontSize={14} fontFamily={MONO}>{m.role}</text>
      {scoreU > 0 && (
        <g opacity={scoreU}>
          <rect x={-46} y={40} width={92} height={26} rx={13} fill={m.color} opacity={0.2} />
          <text x={0} y={58} textAnchor="middle" fill={m.color} fontSize={14} fontWeight={800}>score</text>
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const mainOpacity = 1 - s.get(scene.dimU);
  const wheelU = s.get(scene.wheelU);
  const runU = s.get(scene.runU);
  const phase = Math.min(3, Math.floor(runU));
  const phaseU = runU - phase;
  const pipeline = ['serve', 'infer', 'judge', 'aggregate'];
  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={62} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={700}>Downstream training is the judge</text>
          <text x={640} y={90} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>same sources · same anchor · same training protocol · same evaluations</text>

          <g opacity={s.get(scene.sourceU)}>
            <rect x={52} y={196} width={130} height={286} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} />
            <text x={117} y={228} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>raw sources</text>
            {Array.from({ length: 14 }, (_, i) => <rect key={i} x={74} y={255 + i * 14} width={96 - (i % 3) * 9} height={5} rx={2} fill={colors.MUTED} opacity={0.45} />)}
            {METHODS.map((m, i) => <line key={m.name} x1={182} y1={240 + i * 80} x2={232} y2={190 + i * 118} stroke={m.color} strokeWidth={1.5} opacity={s.get(scene.methodU) * (1 - s.get(scene.scoreU))} />)}
          </g>

          {METHODS.map((_, i) => <MethodCard key={i} i={i} u={s.get(scene.methodU)} scoreU={s.get(scene.scoreU)} />)}

          {s.get(scene.anchorU) > 0 && (
            <g opacity={s.get(scene.anchorU)} transform="translate(360 530)">
              <rect x={-116} y={-28} width={232} height={56} rx={28} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={0} y={5} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO}>+ Dolly-15k anchor</text>
            </g>
          )}

          {s.get(scene.trainU) > 0 && (
            <g opacity={clamp01(s.get(scene.trainU) * 2) * (1 - s.get(scene.scoreU))} transform="translate(620 335)">
              <circle r={82} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
              <circle r={60} fill="none" stroke={colors.GRID} strokeWidth={8} />
              <circle r={60} fill="none" stroke={colors.SECONDARY} strokeDasharray={`${Math.min(1, s.get(scene.trainU) / 3.2) * 377} 377`} strokeWidth={8} transform="rotate(-90)" />
              <text y={5} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={700}>fine-tune</text>
              <text y={106} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>3 epochs · cosine</text>
              <text y={128} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>DeepSpeed ZeRO-3</text>
            </g>
          )}

          {wheelU > 0 && (
            <g transform="translate(965 320)" opacity={wheelU}>
              <circle r={140} fill={colors.PANEL} stroke={colors.GRID} />
              <circle r={54} fill={colors.BG} stroke={colors.TEXT} opacity={0.95} />
              <text y={-2} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700}>downstream</text>
              <text y={18} textAnchor="middle" fill={colors.MUTED} fontSize={14}>evaluation</text>
              {DOMAINS.map((d, i) => {
                const a = -Math.PI / 2 + (i / DOMAINS.length) * Math.PI * 2;
                const x = Math.cos(a) * 88;
                const y = Math.sin(a) * 88;
                return (
                  <g key={d} transform={`translate(${x} ${y})`} opacity={clamp01(wheelU * 8 - i)}>
                    <circle r={40} fill={DOMAIN_COLORS[i]} opacity={0.22} stroke={DOMAIN_COLORS[i]} />
                    <text y={5} textAnchor="middle" fill={DOMAIN_COLORS[i]} fontSize={14} fontWeight={700}>{d}</text>
                  </g>
                );
              })}
              {runU > 0 && runU < 4 && (() => {
                // Place the marker by angle instead of rotating the group, so its digit stays upright.
                const a = (phase * 90 + phaseU * 90 - 90) * (Math.PI / 180);
                return (
                  <g transform={`translate(${Math.cos(a) * 158} ${Math.sin(a) * 158})`}>
                    <circle r={12} fill={colors.WARM} />
                    <text y={4} textAnchor="middle" fill={colors.BG} fontSize={12} fontWeight={800}>{phase + 1}</text>
                  </g>
                );
              })()}
            </g>
          )}

          {runU > 0 && (
            <g transform="translate(965 512)">
              {pipeline.map((p, i) => (
                <g key={p} transform={`translate(${-156 + i * 104} 0)`} opacity={i <= phase ? 1 : 0.5}>
                  <rect x={-46} y={-18} width={92} height={36} rx={8} fill={i <= phase ? colors.POSITIVE : colors.PANEL} opacity={i <= phase ? 0.18 : 1} stroke={i <= phase ? colors.POSITIVE : colors.GRID} />
                  <text y={5} textAnchor="middle" fill={i <= phase ? colors.POSITIVE : colors.MUTED} fontSize={14} fontFamily={MONO}>{p}</text>
                </g>
              ))}
            </g>
          )}

          {s.get(scene.resultU) > 0 && (
            <g opacity={s.get(scene.resultU)} transform="translate(640 592)">
              <rect x={-275} y={-25} width={550} height={50} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={0} y={-2} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={750}>Data-Construction-Skill · Finance · Llama-3.1-8B</text>
              <text x={0} y={17} textAnchor="middle" fill={colors.TEXT} fontSize={14}>nearly +20 points over Dolly-only baseline</text>
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={235} y={226} width={810} height={236} rx={20} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
          <text x={640} y={290} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={750}>Make the data prove it</text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={16}>prepare → fine-tune → evaluate → compare</text>
          <rect x={300} y={362} width={250} height={44} rx={12} fill={colors.BG} stroke={colors.GRID} />
          <text x={425} y={390} textAnchor="middle" fill={colors.MUTED} fontSize={16}>trained without it</text>
          <text x={640} y={390} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontWeight={700}>→ does more</text>
          <rect x={730} y={362} width={250} height={44} rx={12} fill={colors.POSITIVE} opacity={0.18} stroke={colors.POSITIVE} />
          <text x={855} y={390} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={700}>trained on it</text>
          <text x={640} y={440} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>quality = downstream training utility</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
