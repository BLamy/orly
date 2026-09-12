// Grounding: arXiv:2609.10715 Sections 2.1–2.2 and 4.1;
// official source files src/ncp_olmo_eval/vllm_plugin/model.py and
// src/ncp_olmo_eval/vllm_plugin/token_tower.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Brace } from '../../primitives';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const TOKENS = Array.from({ length: 16 }, (_, i) => ({
  i,
  x: 130 + i * 68,
  group: Math.floor(i / 4),
}));
const GROUP_COLORS = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const ribbonU = tl.channel('token ribbon', 0);
  const targetP = tl.channel('next token target', 0);
  const encoderU = tl.channel('sixteen encoder layers', 0);
  const hiddenU = tl.channel('hidden states', 0);
  const braceU = tl.channel('groups of four', 0);
  const poolU = tl.channel('mean pooling', 0);
  const conceptU = tl.channel('concept beads', 0);
  const clockP = tl.channel('concept clock', 0);
  const scaleU = tl.channel('two prediction scales', 0);
  const closeU = tl.channel('closing invariant', 0);
  const pulse = tl.channel('pulse', 0);
  tl.tween(pulse, 1, { at: 0, dur: 67, ease: ease.linear });

  tl.caption({ at: 0.4, dur: 5.5, text: 'A standard language model advances one token at a time, with its supervision fixed on the next position.' });
  tl.tween(ribbonU, 1, { at: 0.8, dur: 1.5, ease: ease.draw });
  tl.tween(targetP, 4, { at: 2.2, dur: 3.2, ease: ease.linear });
  tl.tween(cam, { x: 365, y: 380, k: 1.10 }, { at: 2.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.5, text: 'The concept model keeps that token clock, but asks the hidden states to carry a second, slower rhythm.' });
  tl.tween(cam, CAMERA_HOME, { at: 8.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.5, text: 'Sixteen encoder layers turn each token position into a four-thousand-ninety-six-dimensional hidden state.' });
  tl.tween(encoderU, 1, { at: 12.8, dur: 1.6, ease: ease.draw });
  tl.tween(hiddenU, 1, { at: 14.2, dur: 2.3, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 390, k: 1.06 }, { at: 14.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.4, dur: 5.5, text: 'Now place a brace under every four neighboring states. Those four positions become one unit of meaning.' });
  tl.tween(braceU, 1, { at: 18.9, dur: 2.0, ease: ease.enter });
  tl.tween(cam, { x: 265, y: 390, k: 1.16 }, { at: 20.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.5, text: 'The implementation requires mean-pooled chunks, so each group folds toward its average rather than choosing a favorite token.' });
  tl.tween(poolU, 1, { at: 25.0, dur: 2.5, ease: ease.move });
  tl.tween(conceptU, 1, { at: 26.7, dur: 0.7, ease: ease.pop });

  tl.caption({ at: 30.4, dur: 5.5, text: 'Sixteen token states have become four concept states. Sequence length drops by exactly the compression factor.' });
  tl.tween(cam, CAMERA_HOME, { at: 31.0, dur: 1.3, ease: ease.move });
  tl.tween(scaleU, 0.45, { at: 32.0, dur: 0.7, ease: ease.enter });

  tl.caption({ at: 36.4, dur: 5.5, text: 'The concept clock ticks once whenever four token ticks complete.' });
  tl.tween(clockP, 4, { at: 36.8, dur: 4.2, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 235, k: 1.08 }, { at: 37.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.5, text: 'Each concept summarizes a contiguous span, so the model gets an explicit target above the surface-token level.' });
  tl.tween(scaleU, 1, { at: 43.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 48.4, dur: 5.5, text: 'Nothing replaces the original stream. Token representations still travel onward to the decoder.' });
  tl.tween(cam, CAMERA_HOME, { at: 49.0, dur: 1.2, ease: ease.move });
  tl.tween(targetP, 8, { at: 49.4, dur: 3.4, ease: ease.linear });

  tl.caption({ at: 54.4, dur: 5.8, text: 'The extra scale simply makes the abstraction predictable, instead of leaving it as an accidental byproduct of token training.' });
  tl.tween(scaleU, 1.7, { at: 55.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 60.7, dur: 5.5, text: 'The first invariant is the whole trick: token input, token output, and a concept clock ticking every four positions.' });
  tl.tween(closeU, 1, { at: 61.2, dur: 1.3, ease: ease.move });
  tl.hold(66.3, 1.0);

  return { tl, cam, ribbonU, targetP, encoderU, hiddenU, braceU, poolU, conceptU, clockP, scaleU, closeU, pulse };
}

const scene = buildScene();

function Token({ i, x, y, u, active }: { i: number; x: number; y: number; u: number; active: number }) {
  const color = GROUP_COLORS[Math.floor(i / 4)];
  return <g transform={`translate(${x} ${y})`} opacity={u}>
    <rect x="-25" y="-24" width="50" height="48" rx="13" fill="#111c2c" stroke={active > 0 ? colors.WARM : color} strokeWidth={active > 0 ? 3.5 : 1.8} />
    <text y="5" textAnchor="middle" fill={active > 0 ? colors.WARM : colors.TEXT} fontSize="14" fontFamily={colors.font.mono}>{`x${i + 1}`}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const ribbon = s.get(scene.ribbonU);
  const hidden = s.get(scene.hiddenU);
  const braces = s.get(scene.braceU);
  const pool = s.get(scene.poolU);
  const concepts = s.get(scene.conceptU);
  const target = s.get(scene.targetP);
  const clock = s.get(scene.clockP);
  const scale = s.get(scene.scaleU);
  const pulse = s.get(scene.pulse);
  const headingFade = 1 - clamp01(braces * 1.5);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="62" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850" opacity={headingFade}>the concept clock</text>
      <text x="640" y="91" textAnchor="middle" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono} opacity={headingFade}>Token Encoder · 16 layers · hidden_size: 4096 · k: 4</text>

      <g opacity={s.get(scene.encoderU)}>
        {Array.from({ length: 16 }, (_, i) => {
          const x = 105 + i * 71;
          return <g key={i} opacity={0.16 + 0.44 * clamp01(s.get(scene.encoderU) * 16 - i)}>
            <line x1={x} y1="148" x2={x} y2="360" stroke={i % 4 === 3 ? GROUP_COLORS[Math.floor(i / 4)] : colors.GRID} strokeWidth={i % 4 === 3 ? 3 : 1.2} />
            <text x={x} y="132" textAnchor="middle" fill={colors.MUTED} fontSize="9">{i + 1}</text>
          </g>;
        })}
        <text x="64" y="250" transform="rotate(-90 64 250)" textAnchor="middle" fill={colors.MUTED} fontSize="11">encoder depth</text>
      </g>

      {TOKENS.map((t) => {
        const u = clamp01(ribbon * 20 - t.i);
        const groupCenter = 232 + t.group * 272;
        const hx = t.x + (groupCenter - t.x) * pool;
        const hy = 414 - 150 * pool;
        const targetIndex = Math.floor(target) % 16;
        const active = t.i === targetIndex ? 0.55 + 0.45 * Math.sin(pulse * Math.PI * 22) ** 2 : 0;
        return <g key={t.i}>
          <line x1={t.x} y1="470" x2={t.x} y2={414 - 150 * pool} stroke={GROUP_COLORS[t.group]} strokeWidth="2" opacity={hidden * (1 - pool * 0.65)} />
          <Token i={t.i} x={t.x} y={470} u={u * (1 - pool * 0.45)} active={active} />
          {hidden > 0 && <g transform={`translate(${hx} ${hy})`} opacity={hidden * (1 - concepts * 0.55)}>
            <circle r={8 + 7 * (1 - pool)} fill={GROUP_COLORS[t.group]} opacity={0.45 + 0.4 * u} />
            <text y="-14" textAnchor="middle" fill={colors.MUTED} fontSize="9" opacity={1 - pool}>{`h${t.i + 1}`}</text>
          </g>}
        </g>;
      })}

      {Array.from({ length: 4 }, (_, g) => {
        const x0 = TOKENS[g * 4].x - 26;
        const x1 = TOKENS[g * 4 + 3].x + 26;
        const cx = (x0 + x1) / 2;
        const tick = clamp01(clock - g);
        return <g key={g}>
          <Brace x0={x0} x1={x1} y={526} u={clamp01(braces * 5 - g)} color={GROUP_COLORS[g]} label="mean" fontSize={11} opacity={1 - pool * 0.85} />
          {concepts > 0 && <g transform={`translate(${cx} 264) scale(${0.82 + 0.18 * concepts})`} opacity={concepts}>
            <circle r={35 + tick * 5} fill="#101827" stroke={tick > 0 ? colors.WARM : GROUP_COLORS[g]} strokeWidth={tick > 0 ? 4 : 3} />
            <circle r="22" fill={GROUP_COLORS[g]} opacity={0.22 + 0.18 * tick} />
            <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="15" fontFamily={colors.font.mono}>{`c${g + 1}`}</text>
          </g>}
        </g>;
      })}

      <g opacity={clamp01(scale)}>
        <line x1="116" y1="565" x2="1164" y2="565" stroke={colors.ACCENT} strokeWidth="3" strokeDasharray="10 8" />
        <text x="1164" y="590" textAnchor="end" fill={colors.ACCENT} fontSize="12">token clock · 16 positions</text>
        <line x1="232" y1="185" x2="1048" y2="185" stroke={colors.WARM} strokeWidth="4" strokeDasharray="14 10" />
        <text x="1048" y="167" textAnchor="end" fill={colors.WARM} fontSize="12">concept clock · 4 positions</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="190" y="126" width="900" height="430" rx="52" fill={colors.BG} stroke={colors.ACCENT} strokeWidth="4" />
      <text x="640" y="220" textAnchor="middle" fill={colors.TEXT} fontSize="46" fontWeight="850">four tokens ahead</text>
      <text x="640" y="258" textAnchor="middle" fill={colors.ACCENT} fontSize="17">one autoregressive stream · two prediction scales</text>
      {[0, 1, 2, 3].map((g) => <g key={g} transform={`translate(${334 + g * 204} 380)`}>
        <circle r="48" fill="#101827" stroke={GROUP_COLORS[g]} strokeWidth="4" />
        {[0, 1, 2, 3].map((j) => <circle key={j} cx={-24 + j * 16} cy="-4" r="5" fill={GROUP_COLORS[g]} />)}
        <text y="25" textAnchor="middle" fill={colors.TEXT} fontSize="13">one concept</text>
      </g>)}
      <text x="640" y="492" textAnchor="middle" fill={colors.MUTED} fontSize="16">token input → mean-pooled concept → token output</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
