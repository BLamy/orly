// The Answer Audits Itself — chapter 3: The Confidence Gate.
//
// Grounded in AREX paper §§2.2.2–2.3 and the official repository's
// web/index.html framework copy. The paper's structured finish emits a
// provisional answer, evidence, and confidence in [0,100]. The outer loop
// chooses Accept, Refine, or Restart. This outer loop is described by the
// paper and project page; it is not implemented by the public quickstart.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TRACKS = [
  { name: 'ACCEPT', y: 215, color: colors.POSITIVE, note: 's ≥ τ' },
  { name: 'REFINE', y: 360, color: colors.WARM, note: 's < τ  ∧  v = 1' },
  { name: 'RESTART', y: 505, color: colors.NEGATIVE, note: 's < τ  ∧  v = 0' },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cardU = tl.channel('cardU', 0);
  const evidenceU = tl.channel('evidenceU', 0);
  const confidence = tl.channel('confidence', 0);
  const gateU = tl.channel('gateU', 0);
  const acceptP = tl.channel('acceptP', 0);
  const rewindU = tl.channel('rewindU', 0);
  const refineP = tl.channel('refineP', 0);
  const restartP = tl.channel('restartP', 0);
  const boundedU = tl.channel('boundedU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.7, text: 'The paper adds a second loop beyond the public quickstart. Finishing research does not yet mean finishing the job.' });
  tl.tween(cardU, 1, { at: 0.9, dur: 0.8, ease: ease.enter });
  tl.tween(cam, { x: 410, y: 340, k: 1.13 }, { at: 1.1, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.5);

  tl.caption({ at: 6.6, dur: 5.3, text: 'A structured finish exposes three things: the provisional answer, its supporting evidence, and a confidence score.' });
  tl.tween(evidenceU, 1, { at: 7.1, dur: 1.2, ease: ease.draw });
  tl.tween(confidence, 0.86, { at: 8.0, dur: 1.6, ease: ease.move });
  tl.hold(11.9, 0.5);

  tl.caption({ at: 12.4, dur: 4.9, text: 'Confidence summarizes completeness, consistency, provenance, and whether the evidence is still timely.' });
  tl.tween(gateU, 1, { at: 12.9, dur: 1.3, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 13.1, dur: 1.4, ease: ease.move });
  tl.hold(17.3, 0.5);

  tl.caption({ at: 17.8, dur: 4.9, text: 'Above the threshold, the outer loop accepts the answer.' });
  tl.tween(acceptP, 1, { at: 18.3, dur: 2.4, ease: ease.linear });
  tl.hold(22.7, 0.5);

  tl.caption({ at: 23.2, dur: 5.2, text: 'Below the threshold, it asks a different question: does this trajectory contain useful progress?' });
  tl.tween(confidence, 0.43, { at: 23.7, dur: 1.2, ease: ease.move });
  tl.tween(rewindU, 1, { at: 24.9, dur: 0.8, ease: ease.enter });
  tl.hold(28.4, 0.5);

  tl.caption({ at: 28.9, dur: 5.3, text: 'If it is recoverable, reliable findings survive while remaining issues become a targeted objective.' });
  tl.tween(refineP, 1, { at: 29.4, dur: 2.8, ease: ease.linear });
  tl.hold(34.2, 0.5);

  tl.caption({ at: 34.7, dur: 5.0, text: 'If the trajectory is too noisy or misleading, the next round restarts from the original problem.' });
  tl.tween(restartP, 1, { at: 35.2, dur: 2.8, ease: ease.linear });
  tl.hold(39.7, 0.5);

  tl.caption({ at: 40.2, dur: 5.2, text: 'Recursive rounds are bounded. If none clears the threshold, the system returns the completed answer with the highest score.' });
  tl.tween(boundedU, 1, { at: 40.8, dur: 1.2, ease: ease.enter });
  tl.hold(45.4, 0.5);

  tl.caption({ at: 45.9, dur: 6.4, text: 'The gate makes verification a control signal: accept what is strong, refine what is salvageable, restart what is not.' });
  tl.tween(dimU, 1, { at: 46.5, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 47.4, dur: 0.7, ease: ease.enter });
  tl.hold(52.3, 1.0);

  return { tl, cam, cardU, evidenceU, confidence, gateU, acceptP, rewindU, refineP, restartP, boundedU, dimU, endU };
}

const scene = buildScene();

function AnswerCard({ u, evidenceU }: { u: number; evidenceU: number }) {
  return (
    <g transform={`translate(105 ${205 + (1 - u) * 20})`} opacity={u}>
      <rect width={355} height={280} rx={18} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
      <text x={24} y={38} fill={colors.ACCENT} fontSize={12} fontWeight={700} fontFamily={MONO}>structured finish</text>
      <rect x={24} y={62} width={307} height={62} rx={10} fill={colors.ACCENT} fillOpacity={0.09} stroke={colors.GRID} />
      <text x={40} y={88} fill={colors.TEXT} fontSize={11}>provisional answer</text>
      <text x={40} y={108} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>y⁽ᵏ⁾</text>
      <g opacity={evidenceU}>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={24} y={145 + i * 31} width={307} height={23} rx={6} fill={i === 2 ? colors.WARM : colors.POSITIVE} fillOpacity={0.08} />
            <circle cx={40} cy={157 + i * 31} r={4} fill={i === 2 ? colors.WARM : colors.POSITIVE} />
            <text x={52} y={161 + i * 31} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>{i === 2 ? 'unresolved constraint' : `source id ${i + 1}`}</text>
          </g>
        ))}
      </g>
      <text x={24} y={261} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>r⁽ᵏ⁾ = (y⁽ᵏ⁾, E⁽ᵏ⁾, s⁽ᵏ⁾)</text>
    </g>
  );
}

function movingPoint(p: number, y: number) {
  return { x: 565 + clamp01(p) * 560, y };
}

export function Render({ s }: { s: SceneState }) {
  const confidence = s.get(scene.confidence);
  const mainOpacity = 1 - 0.86 * s.get(scene.dimU);
  const gaugeX = 595;
  const gaugeW = 530;
  const thresholdX = gaugeX + gaugeW * 0.72;
  const markerX = gaugeX + gaugeW * confidence;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={68} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={700}>The paper's outer loop</text>
          <text x={640} y={95} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>public quickstart boundary → paper mechanism</text>
          <AnswerCard u={s.get(scene.cardU)} evidenceU={s.get(scene.evidenceU)} />

          {s.get(scene.gateU) > 0 && (
            <g opacity={s.get(scene.gateU)}>
              <rect x={gaugeX} y={122} width={gaugeW} height={34} rx={17} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={gaugeX} y={122} width={gaugeW * confidence} height={34} rx={17} fill={confidence >= 0.72 ? colors.POSITIVE : colors.WARM} opacity={0.55} />
              <line x1={thresholdX} y1={112} x2={thresholdX} y2={168} stroke={colors.TEXT} strokeWidth={2} />
              <text x={thresholdX} y={103} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily={MONO}>τ</text>
              <circle cx={markerX} cy={139} r={7} fill={confidence >= 0.72 ? colors.POSITIVE : colors.WARM} />
              <text x={1125} y={183} textAnchor="end" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>s⁽ᵏ⁾ ∈ [0, 100]</text>
            </g>
          )}

          {TRACKS.map((track, i) => (
            <g key={track.name} opacity={s.get(scene.gateU)}>
              <path d={`M 565 ${track.y} C 745 ${track.y - 24} 915 ${track.y + 24} 1125 ${track.y}`} fill="none" stroke={track.color} strokeWidth={2} strokeOpacity={0.5} />
              <rect x={1025} y={track.y - 25} width={120} height={50} rx={12} fill={track.color} fillOpacity={0.1} stroke={track.color} />
              <text x={1085} y={track.y - 3} textAnchor="middle" fill={track.color} fontSize={12} fontWeight={700}>{track.name}</text>
              <text x={1085} y={track.y + 15} textAnchor="middle" fill={colors.MUTED} fontSize={8.5} fontFamily={MONO}>{track.note}</text>
              {i === 1 && s.get(scene.rewindU) > 0 && (
                <text x={750} y={track.y - 28} fill={colors.WARM} fontSize={9.5} fontFamily={MONO}>preserve P⁽ᵏ⁾ · investigate I⁽ᵏ⁾</text>
              )}
            </g>
          ))}

          {s.get(scene.acceptP) > 0 && s.get(scene.acceptP) < 1 && (() => {
            const p = movingPoint(s.get(scene.acceptP), TRACKS[0].y);
            return <circle cx={p.x} cy={p.y} r={10} fill={colors.POSITIVE} />;
          })()}
          {s.get(scene.refineP) > 0 && s.get(scene.refineP) < 1 && (() => {
            const p = movingPoint(s.get(scene.refineP), TRACKS[1].y);
            return <circle cx={p.x} cy={p.y} r={10} fill={colors.WARM} />;
          })()}
          {s.get(scene.restartP) > 0 && s.get(scene.restartP) < 1 && (() => {
            const p = movingPoint(s.get(scene.restartP), TRACKS[2].y);
            return <circle cx={p.x} cy={p.y} r={10} fill={colors.NEGATIVE} />;
          })()}

          {s.get(scene.boundedU) > 0 && (
            <g opacity={s.get(scene.boundedU)}>
              <MathLabel tex={'k \\le K_{\\max}'} x={785} y={580} color={colors.ACCENT} fontSize={25} />
              <text x={785} y={614} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>fallback: highest completed confidence</text>
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={235} y={240} width={810} height={192} rx={20} fill={colors.PANEL} stroke={colors.WARM} />
          <text x={640} y={299} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={700}>Accept · refine · restart</text>
          <text x={640} y={347} textAnchor="middle" fill={colors.MUTED} fontSize={16}>confidence and recoverability steer the next recursive round</text>
          <text x={640} y={389} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>paper §§2.2.2–2.3 · not shipped in the public quickstart</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
