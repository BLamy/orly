// Grounding: arXiv:2609.08183 Sections 4.1–4.2, Equations 1–2; official NeoHorse README.md.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const SCORES = [0.12, 0.28, 0.42, 0.63, 0.18, 0.76, 0.55, 0.92, 0.34, 0.69, 0.83, 0.48];
const SORTED = SCORES.map((score, index) => ({ score, index })).sort((a, b) => a.score - b.score);
const STAGES = [
  [0, 1, 2, 4],
  [8, 3, 11, 6],
  [9, 5, 10, 7],
] as const;
const TOKENS = [
  ['system', 'context'], ['user', 'request'], ['assistant', 'reason'], ['assistant', 'tool call'],
  ['tool', 'result'], ['assistant', 'recover'], ['assistant', 'answer'], ['assistant', 'end'],
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const cardsU = tl.channel('turn cards', 0);
  const supportU = tl.channel('tier support', 0);
  const scoreU = tl.channel('routing score', 0);
  const sortU = tl.channel('score ordering', 0);
  const stagesU = tl.channel('three stages', 0);
  const reserveU = tl.channel('reserved low scores', 0);
  const passU = tl.channel('single pass', 0);
  const tokenU = tl.channel('serialized turn', 0);
  const maskU = tl.channel('assistant loss mask', 0);
  const closeU = tl.channel('curriculum close', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'Agent turns do not ask for equal capability, so the training design gives each complete turn a routing-derived place in the lesson.' });
  tl.tween(cardsU, 1, { at: 0.9, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 300, y: 340, k: 1.08 }, { at: 2.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.2, dur: 5.5, text: 'The router provides support across four capability tiers, not just the identity of whichever model happened to serve the turn.' });
  tl.tween(supportU, 1, { at: 6.8, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 9.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.0, dur: 5.5, text: 'Hard ordering uses the assigned tier. Soft ordering uses the score-weighted mean of all four tier indices.' });
  tl.tween(scoreU, 1, { at: 12.6, dur: 1.2, ease: ease.pop });

  tl.caption({ at: 17.8, dur: 5.5, text: 'Those scores sort the turns by estimated capability demand without changing the recorded assistant targets.' });
  tl.tween(sortU, 1, { at: 18.4, dur: 2.2, ease: ease.move });
  tl.tween(cam, { x: 650, y: 330, k: 1.08 }, { at: 20.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 23.6, dur: 5.5, text: 'Training unfolds in three roughly equal stages, progressively introducing higher-scored examples.' });
  tl.tween(stagesU, 1, { at: 24.2, dur: 1.6, ease: ease.draw });

  tl.caption({ at: 29.4, dur: 5.5, text: 'Some lower-scored turns are deliberately reserved for later, so the ending is not only the hardest slice.' });
  tl.tween(reserveU, 1, { at: 30.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 35.2, dur: 5.5, text: 'Every example appears once per pass, while the optimizer and learning-rate schedule continue across stage boundaries.' });
  tl.tween(passU, 1, { at: 35.8, dur: 1.3, ease: ease.pop });

  tl.caption({ at: 41.0, dur: 5.5, text: 'Each example keeps historical context and the current user turn in one causal sequence.' });
  tl.tween(tokenU, 1, { at: 41.6, dur: 2.2, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 475, k: 1.08 }, { at: 42.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 46.8, dur: 5.5, text: 'Prediction loss lands only on current-turn assistant spans; prompts, tools, results, history, and padding carry a zero mask.' });
  tl.tween(maskU, 1, { at: 47.4, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 49.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 52.6, dur: 6.0, text: 'Routing changes when the model sees each turn, while masked supervision preserves exactly what the turn is meant to teach.' });
  tl.tween(closeU, 1, { at: 53.3, dur: 1.2, ease: ease.move });
  tl.hold(58.8, 1.0);

  return { tl, cam, cardsU, supportU, scoreU, sortU, stagesU, reserveU, passU, tokenU, maskU, closeU };
}

const scene = buildScene();

function lerp(a: number, b: number, u: number) { return a + (b - a) * clamp01(u); }

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const sort = s.get(scene.sortU);
  const stages = s.get(scene.stagesU);
  const reserve = s.get(scene.reserveU);
  const mask = s.get(scene.maskU);
  const sortedPos = new Map(SORTED.map((item, rank) => [item.index, rank]));
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="70" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">routing turns demand into order</text>
      <g opacity={s.get(scene.cardsU)}>
        {SCORES.map((score, i) => {
          const startX = 100 + (i % 4) * 145;
          const startY = 132 + Math.floor(i / 4) * 78;
          const rank = sortedPos.get(i) ?? i;
          const endX = 90 + (rank % 4) * 145;
          const endY = 132 + Math.floor(rank / 4) * 78;
          const x = lerp(startX, endX, sort);
          const y = lerp(startY, endY, sort);
          const tier = Math.min(3, Math.floor(score * 4));
          const color = [colors.POSITIVE, colors.ACCENT, colors.WARM, colors.SECONDARY][tier];
          return <g key={i} transform={`translate(${x} ${y})`}>
            <rect width="118" height="56" rx="16" fill="#142238" stroke={color} strokeWidth="2.5" />
            <text x="16" y="24" fill={color} fontSize="11" fontFamily={colors.font.mono}>{`turn ${i + 1}`}</text>
            <text x="16" y="43" fill={colors.TEXT} fontSize="12" fontFamily={colors.font.mono}>{score.toFixed(2)}</text>
            <rect x="75" y="37" width={35 * s.get(scene.supportU)} height="5" rx="3" fill={color} />
          </g>;
        })}
      </g>

      <g opacity={s.get(scene.scoreU)}>
        <rect x="690" y="112" width="480" height="112" rx="28" fill="#171a2c" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="930" y="145" textAnchor="middle" fill={colors.SECONDARY} fontSize="13" fontFamily={colors.font.mono}>soft routing score</text>
        <MathLabel tex={String.raw`s_i=\sum_{k=0}^{3}k\,\pi_{i,k}`} x={930} y={186} fontSize={28} opacity={1} />
      </g>

      <g opacity={stages}>
        {STAGES.map((indices, stage) => <g key={stage} transform={`translate(${690 + stage * 166} 258)`}>
          <rect width="142" height="238" rx="26" fill="#101a2a" stroke={[colors.POSITIVE, colors.ACCENT, colors.SECONDARY][stage]} strokeWidth="3" />
          <text x="71" y="34" textAnchor="middle" fill={[colors.POSITIVE, colors.ACCENT, colors.SECONDARY][stage]} fontSize="13" fontFamily={colors.font.mono}>{`STAGE ${stage + 1}`}</text>
          {indices.map((idx, j) => {
            const lowReserved = reserve > 0 && stage > 0 && SCORES[idx] < 0.5;
            return <g key={idx} transform={`translate(18 ${58 + j * 40})`}>
              <rect width="106" height="30" rx="10" fill={lowReserved ? '#2f2611' : '#18253a'} stroke={lowReserved ? colors.WARM : colors.MUTED} />
              <text x="12" y="20" fill={lowReserved ? colors.WARM : colors.TEXT} fontSize="10" fontFamily={colors.font.mono}>{`turn ${idx + 1} · ${SCORES[idx].toFixed(2)}`}</text>
            </g>;
          })}
          {stage < 2 && <path d="M148 118 H164" stroke={colors.MUTED} strokeWidth="4" />}
        </g>)}
        <g opacity={s.get(scene.passU)} transform="translate(930 525)">
          <path d="M-220 0 C-120 55 120 55 220 0" fill="none" stroke={colors.POSITIVE} strokeWidth="4" />
          <text y="58" textAnchor="middle" fill={colors.POSITIVE} fontSize="12" fontFamily={colors.font.mono}>one pass · no optimizer reset</text>
        </g>
      </g>

      <g opacity={s.get(scene.tokenU)} transform="translate(96 438)">
        <text x="0" y="-20" fill={colors.ACCENT} fontSize="12" fontFamily={colors.font.mono}>serialized user turn</text>
        {TOKENS.map(([role, label], i) => {
          const assistant = role === 'assistant';
          const u = clamp01(s.get(scene.tokenU) * TOKENS.length - i);
          return <g key={`${role}-${label}`} transform={`translate(${i * 67} 0)`} opacity={u}>
            <rect width="59" height="58" rx="12" fill={assistant ? '#231f3a' : '#162033'} stroke={assistant ? colors.SECONDARY : colors.MUTED} strokeWidth={1.5 + mask * (assistant ? 2 : 0)} />
            <text x="29.5" y="24" textAnchor="middle" fill={assistant ? colors.SECONDARY : colors.MUTED} fontSize="8" fontFamily={colors.font.mono}>{role}</text>
            <text x="29.5" y="42" textAnchor="middle" fill={colors.TEXT} fontSize="8">{label}</text>
            <rect x="5" y="51" width={49 * mask} height="4" rx="2" fill={assistant ? colors.POSITIVE : colors.NEGATIVE} opacity={mask} />
          </g>;
        })}
        <text x="265" y="84" textAnchor="middle" fill={colors.POSITIVE} fontSize="11" fontFamily={colors.font.mono} opacity={mask}>loss mask = 1 only on current assistant targets</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="210" y="126" width="860" height="420" rx="48" fill={colors.BG} stroke={colors.SECONDARY} strokeWidth="4" />
      <text x="640" y="210" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">change the order, keep the target</text>
      <g transform="translate(365 355)">
        {[0.2, 0.5, 0.8].map((score, i) => <rect key={score} x={i * 58} y={-score * 120} width="42" height={score * 120} rx="10" fill={[colors.POSITIVE, colors.ACCENT, colors.SECONDARY][i]} />)}
        <text x="79" y="48" textAnchor="middle" fill={colors.MUTED} fontSize="13">routing curriculum</text>
      </g>
      <path d="M540 355 H650" stroke={colors.WARM} strokeWidth="7" /><polygon points="650,355 626,341 626,369" fill={colors.WARM} />
      <g transform="translate(805 355)">
        {['0', '0', '1', '1', '0', '1'].map((v, i) => <rect key={i} x={-110 + i * 38} y="-28" width="30" height="56" rx="8" fill={v === '1' ? '#15352a' : '#202838'} stroke={v === '1' ? colors.POSITIVE : colors.MUTED} />)}
        <text y="62" textAnchor="middle" fill={colors.MUTED} fontSize="13">masked supervision</text>
      </g>
      <text x="640" y="492" textAnchor="middle" fill={colors.SECONDARY} fontSize="19">presentation changes; recorded targets do not</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
