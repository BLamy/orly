// A Million Tokens Deep — chapter 1: Decay Without Overflow.
//
// Grounded in MoonshotAI/Kimi-K3 k3_tech_report.pdf §§2.1–2.1.2,
// especially equations 1–7 and Figure 3. Kimi K3 uses three KDA layers
// followed by one Gated MLA layer, bounds per-step log-decay at g_min=-5,
// and thereby makes every causal 16-token tile suitable for dense Tensor
// Core matrix multiplication.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TOKENS = Array.from({ length: 48 }, (_, i) => i);
const TILE = Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => col <= row));
const STATE_STEPS = ['read S', 'forget a little', 'write new information'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tapeU = tl.channel('tapeU', 0);
  const stateU = tl.channel('stateU', 0);
  const chunkU = tl.channel('chunkU', 0);
  const riskU = tl.channel('riskU', 0);
  const boundU = tl.channel('boundU', 0);
  const tensorU = tl.channel('tensorU', 0);
  const rhythmU = tl.channel('rhythmU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.8, text: 'A million-token sequence is too long for every position to compare itself with every other position.' });
  tl.tween(tapeU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 340, k: 1.03 }, { at: 1.1, dur: 1.3, ease: ease.move });
  tl.hold(6.3, 0.5);

  tl.caption({ at: 6.8, dur: 5.8, text: 'Kimi Delta Attention carries a recurrent state instead. Each token reads it, forgets a little, then writes new information.' });
  tl.tween(stateU, 1, { at: 7.3, dur: 2.4, ease: ease.linear });
  tl.hold(12.6, 0.5);

  tl.caption({ at: 13.1, dur: 5.8, text: 'Across chunks the state remains recurrent, while every token inside one chunk can be computed in parallel.' });
  tl.tween(chunkU, 1, { at: 13.6, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 360, k: 1.04 }, { at: 14.0, dur: 1.3, ease: ease.move });
  tl.hold(18.9, 0.5);

  tl.caption({ at: 19.4, dur: 5.5, text: 'But multiplying many retention factors can make the reciprocal rescaling explode beyond finite precision.' });
  tl.tween(riskU, 1, { at: 19.9, dur: 1.2, ease: ease.enter });
  tl.hold(24.9, 0.5);

  tl.caption({ at: 25.4, dur: 5.7, text: 'Kimi K3 changes the gate: log-decay stops at negative five instead of falling without bound.' });
  tl.tween(boundU, 1, { at: 25.9, dur: 1.4, ease: ease.move });
  tl.hold(31.1, 0.5);

  tl.caption({ at: 31.6, dur: 5.8, text: 'Over a sixteen-token tile, that bound keeps the rescaling inside the dynamic range used by the training arithmetic.' });
  tl.hold(37.4, 0.5);

  tl.caption({ at: 37.9, dur: 5.8, text: 'The orange diagonal special case disappears. Every causal tile becomes a dense Tensor Core multiplication.' });
  tl.tween(tensorU, 1, { at: 38.4, dur: 1.5, ease: ease.move });
  tl.hold(43.7, 0.5);

  tl.caption({ at: 44.2, dur: 6.0, text: 'Three delta-attention layers handle efficient sequence mixing, then one global layer reconnects distant content without restriction.' });
  tl.tween(cam, CAMERA_HOME, { at: 44.7, dur: 1.3, ease: ease.move });
  tl.tween(rhythmU, 1, { at: 45.0, dur: 1.4, ease: ease.enter });
  tl.hold(50.2, 0.5);

  tl.caption({ at: 50.7, dur: 6.2, text: 'The trick is not to remember every comparison. It is to keep one stable state moving forward without numerical collapse.' });
  tl.tween(dimU, 1, { at: 51.2, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 52.0, dur: 0.7, ease: ease.enter });
  tl.hold(56.9, 1.0);

  return { tl, cam, tapeU, stateU, chunkU, riskU, boundU, tensorU, rhythmU, dimU, endU };
}

const scene = buildScene();

function DecayCurve({ boundU, riskU }: { boundU: number; riskU: number }) {
  const pts = Array.from({ length: 80 }, (_, i) => {
    const x = i / 79;
    const unbounded = -0.15 - 8.2 * x * x * x;
    const bounded = -5 / (1 + Math.exp(-8 * (x - 0.52)));
    const y = unbounded * (1 - boundU) + bounded * boundU;
    return `${170 + x * 350},${486 - y * 11}`;
  }).join(' ');
  return (
    <g opacity={riskU}>
      <rect x={138} y={340} width={420} height={250} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
      <line x1={170} y1={486} x2={520} y2={486} stroke={colors.MUTED} />
      <line x1={170} y1={370} x2={170} y2={550} stroke={colors.MUTED} />
      <line x1={170} y1={541} x2={520} y2={541} stroke={colors.NEGATIVE} strokeDasharray="6 6" opacity={boundU} />
      <polyline points={pts} fill="none" stroke={boundU > 0.5 ? colors.ACCENT : colors.NEGATIVE} strokeWidth={4} />
      <text x={190} y={370} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>log-decay g</text>
      <text x={440} y={506} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>input z</text>
      <text x={138} y={612} fill={colors.MUTED} fontSize={13}>Each step keeps e^g of old state; rescaling divides by products.</text>
      <text x={182} y={535} fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO} opacity={boundU}>g_min = -5</text>
      <text x={348} y={392} textAnchor="middle" fill={boundU > 0.5 ? colors.ACCENT : colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
        {boundU > 0.5 ? 'scaled sigmoid · bounded' : 'negative Softplus · unbounded'}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const tapeU = s.get(scene.tapeU);
  const stateU = s.get(scene.stateU);
  const chunkU = s.get(scene.chunkU);
  const boundU = s.get(scene.boundU);
  const tensorU = s.get(scene.tensorU);
  const rhythmU = s.get(scene.rhythmU);
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);
  const cursor = Math.floor(stateU * (TOKENS.length - 1));

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={750}>Lower-bounded Kimi Delta Attention</text>
        <text x={640} y={84} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>3 × KDA → 1 × Gated MLA · g_min=-5 · 16-token tiles</text>
        <text x={640} y={226} textAnchor="middle" fill={colors.MUTED} fontSize={16} opacity={tapeU * (1 - stateU) * (1 - rhythmU)}>every token × every token = 10⁶ × 10⁶ pairs</text>
        <text x={640} y={300} textAnchor="middle" fill={colors.ACCENT} fontSize={16} opacity={stateU * Math.max(0, 1 - 4 * chunkU)}>state S: read → forget a little → write new information</text>
        <g opacity={stateU * Math.max(0, 1 - 4 * chunkU)}>
          {STATE_STEPS.map((label, i) => {
            const active = clamp01(stateU * 3 - i);
            const x = 316 + i * 224;
            return (
              <g key={label}>
                <rect x={x} y={324} width={200} height={44} rx={10} fill={colors.ACCENT} opacity={0.12 + 0.3 * active} stroke={colors.ACCENT} strokeOpacity={0.35 + 0.65 * active} />
                <text x={x + 100} y={352} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>{label}</text>
              </g>
            );
          })}
          {[0, 1].map((i) => (
            <text key={i} x={540 + i * 224} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={18}>→</text>
          ))}
        </g>
      </g>
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <g transform="translate(90 120)">
            {TOKENS.map((i) => {
              const u = clamp01(tapeU * TOKENS.length - i);
              const x = i * 22;
              const active = i === cursor && stateU > 0 && stateU < 1;
              return <rect key={i} x={x} y={0} width={16} height={38} rx={4} fill={active ? colors.WARM : colors.ACCENT} opacity={0.12 + 0.7 * u} />;
            })}
            {chunkU > 0 && [0, 1, 2].map((i) => (
              <g key={i} opacity={chunkU}>
                <rect x={i * 352 - 8} y={-12} width={344} height={62} rx={10} fill="none" stroke={colors.SECONDARY} strokeWidth={2} />
                <text x={i * 352 + 164} y={72} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily={MONO}>chunk {i + 1}</text>
              </g>
            ))}
            {chunkU > 0 && (
              <text x={516} y={102} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={chunkU}>a chunk is a block of tokens computed together, in parallel</text>
            )}
            {stateU > 0 && (
              <g transform={`translate(${cursor * 22 + 8} 19)`}>
                <circle r={13} fill={colors.WARM} />
                <text y={4} textAnchor="middle" fill={colors.BG} fontSize={12} fontWeight={800}>S</text>
              </g>
            )}
          </g>

          <g opacity={chunkU * (1 - rhythmU)} transform="translate(670 280)">
            <text x={152} y={-24} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700}>one causal tile</text>
            {TILE.map((row, r) => row.map((on, c) => {
              const diagonal = r === c;
              const fill = !on ? colors.PANEL : diagonal && tensorU < 0.5 ? colors.WARM : colors.ACCENT;
              return <rect key={`${r}-${c}`} x={c * 38} y={r * 38} width={32} height={32} rx={4} fill={fill} opacity={!on ? 0.18 : 0.24 + 0.58 * chunkU} stroke={on ? fill : colors.GRID} />;
            }))}
            <text x={152} y={330} textAnchor="middle" fill={tensorU > 0.5 ? colors.ACCENT : colors.WARM} fontSize={14} fontFamily={MONO}>
              {tensorU > 0.5 ? 'all causal tiles → Tensor Core' : 'orange diagonal → special position-pair path'}
            </text>
          </g>

          <g opacity={1 - rhythmU}>
            <DecayCurve boundU={boundU} riskU={s.get(scene.riskU)} />
          </g>

          {rhythmU > 0 && (
            <g opacity={rhythmU * (1 - s.get(scene.dimU))} transform="translate(218 360)">
              {['KDA', 'KDA', 'KDA', 'Gated MLA'].map((label, i) => (
                <g key={label + i} transform={`translate(${i * 220} 0)`}>
                  <rect width={185} height={48} rx={10} fill={i === 3 ? colors.SECONDARY : colors.ACCENT} opacity={0.17} stroke={i === 3 ? colors.SECONDARY : colors.ACCENT} />
                  <text x={92.5} y={30} textAnchor="middle" fill={i === 3 ? colors.SECONDARY : colors.ACCENT} fontSize={14} fontFamily={MONO}>{label}</text>
                </g>
              ))}
              <text x={312.5} y={76} textAnchor="middle" fill={colors.ACCENT} fontSize={14}>3 × delta attention: efficient mixing</text>
              <text x={752.5} y={76} textAnchor="middle" fill={colors.SECONDARY} fontSize={14}>1 × global attention: distant content</text>
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={230} y={245} width={820} height={174} rx={20} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
          <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={750}>Carry state, not the whole square</text>
          <text x={640} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={16}>bounded decay · parallel chunks · periodic global attention</text>
          <text x={640} y={388} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>KDA · Eq. 5 · Figure 3</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
