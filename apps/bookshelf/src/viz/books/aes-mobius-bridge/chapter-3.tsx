// Source: aes_mobius_bridge.pdf, sections 4.1.1, 4.2, 5, and Appendix A.
// Persistent object: the per-entry cost bar shrinks as each optimization and verification layer arrives.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Chip, Meter, Panel, ResearchTitle, clamp01, mono } from '../../book-components/research';

const OPTS = ['packed powers', 'DDT Gray walk', 'XOR cache', 'χ⋆ frame'];
const CHECKS = ['small fields', 'wrong keys', 'small AES', 'Lean bound', 'timed kernels'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cost = tl.channel('cost', 19);
  const gainU = tl.channel('gainU', 0);
  const optN = tl.channel('optN', 0);
  const grayU = tl.channel('grayU', 0);
  const canonU = tl.channel('canonU', 0);
  const checkN = tl.channel('checkN', 0);
  const resultU = tl.channel('resultU', 0);
  let t = 0.4;
  t = tl.caption({ at: t, dur: 5.6, text: 'Canceling one byte promises eight bits of savings. But a naive Möbius transform costs about nineteen bits of work per table entry.' });
  tl.tween(gainU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 390, y: 350, k: 1.18 }, { at: 1.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.6, text: 'That expense cancels the gain. The bridge is mathematically correct, but an attack only improves when the implementation makes it cheap.' });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'A packed power table replaces long field sums with lookups arranged for the exact exponents the fingerprint needs.' });
  tl.tween(optN, 1, { at: t - 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(cost, 13.2, { at: t - 4.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'A difference-table-aware Gray walk changes one solution choice at a time, so consecutive candidates reuse almost all of the previous work.' });
  tl.tween(optN, 2, { at: t - 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(grayU, 1, { at: t - 4.8, dur: 2.2, ease: ease.linear });
  tl.tween(cost, 9.8, { at: t - 3.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.7, text: 'An exclusive-or-separable substitution-box cache removes repeated online work. Together, the techniques reach about eight point six bits per entry.' });
  tl.tween(optN, 3, { at: t - 5.1, dur: 0.7, ease: ease.enter });
  tl.tween(cost, 8.6, { at: t - 4.2, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'Orbit canonicalization is cheaper still because it solves for one moving frame instead of evaluating many power sums.' });
  tl.tween(optN, 4, { at: t - 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(canonU, 1, { at: t - 4.6, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 880, y: 350, k: 1.12 }, { at: t - 5.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 6.2, text: 'The full attack is too large to run. Confidence comes from exhaustive small fields, wrong-key measurements, a complete small cipher, a Lean proof, and timed kernels.' });
  tl.tween(checkN, 5, { at: t - 5.6, dur: 2.2, ease: ease.enter });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 6.2, text: 'At the same data cost of two to the one hundred five chosen plaintexts, the paper reports time between two to the eighty-nine point three and two to the ninety-one point four.' });
  tl.tween(resultU, 1, { at: t - 5.6, dur: 1.0, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: t - 2.0, dur: 1.2, ease: ease.move });
  return { tl, cam, cost, gainU, optN, grayU, canonU, checkN, resultU };
}
const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const n = s.get(scene.optN);
  const checks = s.get(scene.checkN);
  const gray = s.get(scene.grayU);
  return (
    <Camera {...s.get(scene.cam)}>
      <ResearchTitle kicker="The Möbius Bridge · 3" title="Making the bridge pay" />
      <Panel x={70} y={125} w={540} h={430} opacity={1} accent={colors.ACCENT}>
        <text x={110} y={170} fill={colors.TEXT} fontSize={14} fontWeight={700}>per-entry work</text>
        <Meter x={110} y={205} w={430} value={s.get(scene.cost)} max={20} label={`≈ 2^${s.get(scene.cost).toFixed(1)} lookups`} color={colors.NEGATIVE} />
        <Meter x={110} y={275} w={430} value={8} max={20} label="factor-of-256 budget · 8 bits" color={colors.POSITIVE} />
        {OPTS.map((o, i) => {
          const u = clamp01(n - i);
          return <Chip key={o} x={180 + (i % 2) * 270} y={365 + Math.floor(i / 2) * 70} text={o} opacity={u} color={i === 3 ? colors.POSITIVE : colors.ACCENT} width={180} />;
        })}
        <g opacity={gray}>
          {Array.from({ length: 16 }, (_, i) => {
            const code = i ^ (i >> 1);
            return <rect key={i} x={105 + i * 28} y={515 - ((code & 7) * 3)} width={20} height={5} rx={2} fill={colors.SECONDARY} />;
          })}
        </g>
      </Panel>
      <Panel x={660} y={125} w={550} h={430} opacity={Math.max(0.1, s.get(scene.canonU))} accent={colors.SECONDARY}>
        <text x={705} y={170} fill={colors.TEXT} fontSize={14} fontWeight={700}>verification stack</text>
        {CHECKS.map((c, i) => {
          const u = clamp01(checks - i);
          return (
            <g key={c} opacity={u} transform={`translate(0,${(1 - u) * 12})`}>
              <circle cx={715} cy={220 + i * 58} r={11} fill={colors.POSITIVE} fillOpacity={0.2} stroke={colors.POSITIVE} />
              <path d={`M 709 ${220 + i * 58} l 5 5 l 9 -12`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
              <text x={745} y={225 + i * 58} fill={colors.TEXT} fontFamily={mono} fontSize={13}>{c}</text>
            </g>
          );
        })}
        <g opacity={s.get(scene.resultU)}>
          <rect x={845} y={205} width={300} height={235} rx={18} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} />
          <text x={995} y={255} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={mono}>7-round AES-128</text>
          <text x={995} y={320} textAnchor="middle" fill={colors.WARM} fontSize={34} fontWeight={800}>2^89.3 – 2^91.4</text>
          <text x={995} y={360} textAnchor="middle" fill={colors.TEXT} fontSize={14}>time</text>
          <text x={995} y={405} textAnchor="middle" fill={colors.ACCENT} fontSize={17} fontWeight={700}>data · 2^105</text>
        </g>
      </Panel>
    </Camera>
  );
}
export const vizScene = () => scene;
