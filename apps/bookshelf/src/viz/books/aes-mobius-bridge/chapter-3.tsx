// Source: aes_mobius_bridge.pdf, sections 4.1.1, 4.2, 5, and Appendix A.
// Persistent object: the per-entry cost bar shrinks as each optimization and verification layer arrives.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Meter, Panel, ResearchTitle, clamp01, mono } from '../../book-components/research';

const OPTS = ['packed powers', 'DDT Gray walk', 'XOR cache', 'χ⋆ frame'];
// One plain-language clause per technique, shown under its chip.
const GLOSS = ['lookups for exact exponents', 'one candidate changes per step', 'reuse repeated online work', 'solve one moving frame'];
// Each check gets a plain clause, so the stack reads without the paper beside it.
const CHECKS = [
  { name: 'small fields', note: 'every case checked on tiny fields' },
  { name: 'wrong keys', note: 'measured on keys the attack must reject' },
  { name: 'small AES', note: 'the full method on a complete small cipher' },
  { name: 'Lean bound', note: 'a proof checker verifies the bound' },
  { name: 'timed kernels', note: 'running time of the core loops measured' },
];

// Chip with 14px text (the shared Chip draws 12px).
function Tag({ x, y, text, opacity, color }: { x: number; y: number; text: string; opacity: number; color: string }) {
  if (opacity <= 0) return null;
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      <rect x={-100} y={-16} width={200} height={32} rx={16} fill={color} fillOpacity={0.13} stroke={color} />
      <text textAnchor="middle" y={5} fill={color} fontSize={14} fontWeight={700} fontFamily={mono}>{text}</text>
    </g>
  );
}

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
  tl.tween(cam, { x: 600, y: 360, k: 1 }, { at: 1.0, dur: 1.2, ease: ease.move });
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
  tl.tween(cam, { x: 680, y: 360, k: 1 }, { at: t - 5.0, dur: 1.2, ease: ease.move });
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
  const cost = s.get(scene.cost);
  // The 8-bit budget fills in while the first caption names the saving.
  const budget = 8 * s.get(scene.gainU);
  const canon = s.get(scene.canonU);
  const result = s.get(scene.resultU);
  return (
    <Camera {...s.get(scene.cam)}>
      <ResearchTitle kicker="The Möbius Bridge · 3" title="Making the bridge pay" />
      <Panel x={70} y={125} w={540} h={430} opacity={1} accent={colors.ACCENT}>
        <text x={110} y={170} fill={colors.TEXT} fontSize={14} fontWeight={700}>per-entry work</text>
        <text x={110} y={193} fill={colors.TEXT} fontSize={14} fontFamily={mono}>{`≈ 2^${cost.toFixed(1)} lookups`}</text>
        <Meter x={110} y={205} w={430} value={cost} max={20} label="" color={colors.NEGATIVE} />
        <text x={110} y={263} fill={colors.TEXT} fontSize={14} fontFamily={mono}>{`factor-of-256 budget · ${Math.round(budget)} bits`}</text>
        <Meter x={110} y={275} w={430} value={budget} max={20} label="" color={colors.POSITIVE} />
        {OPTS.map((o, i) => {
          const u = clamp01(n - i);
          const x = 220 + (i % 2) * 240;
          const y = 360 + Math.floor(i / 2) * 72;
          return (
            <g key={o}>
              <Tag x={x} y={y} text={o} opacity={u} color={i === 3 ? colors.POSITIVE : colors.ACCENT} />
              <text x={x} y={y + 42} textAnchor="middle" fill={colors.TEXT} fontSize={14} opacity={u * 0.85}>{GLOSS[i]}</text>
            </g>
          );
        })}
        <g opacity={gray}>
          {Array.from({ length: 16 }, (_, i) => {
            const code = i ^ (i >> 1);
            return <rect key={i} x={105 + i * 28} y={517 - ((code & 7) * 3)} width={20} height={5} rx={2} fill={colors.SECONDARY} />;
          })}
          <text x={340} y={543} textAnchor="middle" fill={colors.SECONDARY} fontSize={14}>each Gray step flips one bit</text>
        </g>
      </Panel>
      <Panel x={660} y={125} w={550} h={430} opacity={0.85 + 0.15 * canon} accent={colors.SECONDARY}>
        <text x={705} y={170} fill={colors.TEXT} fontSize={14} fontWeight={700}>verification stack</text>
        {CHECKS.map((c, i) => {
          const u = clamp01(checks - i);
          const y = 218 + i * 42;
          return (
            // Rows start as open rings, so the stack is visible before each check lands.
            <g key={c.name} opacity={0.7 + 0.3 * u} transform={`translate(0,${(1 - u) * 8})`}>
              <circle cx={715} cy={y - 4} r={11} fill="none" stroke={colors.MUTED} strokeWidth={1.5} />
              <g opacity={u}>
                <circle cx={715} cy={y - 4} r={11} fill={colors.POSITIVE} fillOpacity={0.2} stroke={colors.POSITIVE} />
                <path d={`M 709 ${y - 4} l 5 5 l 9 -12`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
              </g>
              <text x={740} y={y} fill={colors.TEXT} fontFamily={mono} fontSize={14} fontWeight={700}>{c.name}</text>
              <text x={740} y={y + 19} fill={colors.TEXT} fontSize={14} opacity={0.8}>{c.note}</text>
            </g>
          );
        })}
        <g opacity={result}>
          <rect x={705} y={436} width={460} height={108} rx={14} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} />
          <text x={730} y={462} fill={colors.MUTED} fontSize={14} fontFamily={mono}>7-round AES-128 · time</text>
          <text x={1140} y={462} textAnchor="end" fill={colors.ACCENT} fontSize={16} fontWeight={700}>data · 2^105</text>
          <text x={730} y={498} fill={colors.WARM} fontSize={26} fontWeight={800}>2^89.3 – 2^91.4</text>
          <text x={730} y={524} fill={colors.TEXT} fontSize={14}>still far below the 2^128 of full AES</text>
        </g>
      </Panel>
    </Camera>
  );
}
export const vizScene = () => scene;
