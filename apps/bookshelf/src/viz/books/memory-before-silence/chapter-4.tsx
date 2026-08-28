// Grounding: paper sections 3.3, 4.2, 5.4 and conclusion;
// orchestrator.py::Utils and Search; fusion/reply_memory.py; fusion/prompt_builder.py;
// voicemem/stream.py::Turn.memory_context.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const LEFT = ['diet', 'café', 'yesterday'];
const RIGHT = ['guarded', 'uneasy'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const queryU = tl.channel('partial transcript', 0);
  const forkU = tl.channel('dual brain fork', 0);
  const leftP = tl.channel('left brain results', 0);
  const rightP = tl.channel('right brain results', 0);
  const parallelU = tl.channel('parallel search', 0);
  const mergeU = tl.channel('partitioned prompt merge', 0);
  const gateP = tl.channel('top five gate', 0);
  const metricsU = tl.channel('paper operating point', 0);
  const cartridgeU = tl.channel('replaceable memory engine', 0);
  const replyU = tl.channel('memory aware reply', 0);
  const recapU = tl.channel('journey recap', 0);
  const close = tl.channel('memory before silence', 0);

  tl.caption({ at: 0.4, dur: 6.4, text: 'Once the query is classified, factual ranking and affective retrieval can run on separate rails.' });
  tl.tween(queryU, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(forkU, 1, { at: 1.8, dur: 1.4, ease: ease.draw });

  tl.caption({ at: 6.8, dur: 6.1, text: 'The left rail ranks facts while the right rail follows activated entities into persona and emotional evidence.' });
  tl.tween(parallelU, 1, { at: 7.4, dur: 3.6, ease: ease.linear });
  tl.tween(leftP, 3, { at: 8.0, dur: 2.2, ease: ease.enter });
  tl.tween(rightP, 2, { at: 8.2, dur: 2.0, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 360, k: 1.05 }, { at: 10.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 13.3, dur: 6.5, text: 'The reply builder keeps facts, persona, emotion, and response directives in distinct prompt sections.' });
  tl.tween(mergeU, 1, { at: 13.9, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 16.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 19.8, dur: 6.4, text: 'A top-five gate turns those streams into a compact ribbon the speech model can actually consume.' });
  tl.tween(gateP, 5, { at: 20.4, dur: 2.6, ease: ease.enter });

  tl.caption({ at: 26.2, dur: 7.2, text: 'At the paper’s reported operating point, that ribbon uses four hundred thirty memory tokens and retrieval takes one hundred thirty-four milliseconds.' });
  tl.tween(metricsU, 1, { at: 26.8, dur: 0.7, ease: ease.pop });
  tl.tween(cam, { x: 720, y: 360, k: 1.05 }, { at: 28.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 32.9, dur: 7.2, text: 'The upper graph manages routing and streaming, while the lower memory engine remains replaceable.' });
  tl.tween(cartridgeU, 1, { at: 33.5, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: 600, y: 390, k: 1.05 }, { at: 35.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 39.5, dur: 6.5, text: 'That compact context reaches the speech model before turn confirmation, carrying both what happened and why it matters to this person.' });
  tl.tween(replyU, 1, { at: 40.1, dur: 2.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 42.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 46.0, dur: 6.6, text: 'Follow the path back: unfinished speech, an early wager, a factual funnel, an affect graph, and five memories ready for the reply.' });
  tl.tween(recapU, 1, { at: 46.6, dur: 3.6, ease: ease.linear });

  tl.caption({ at: 52.6, dur: 6.4, text: 'The memory system hides retrieval inside silence, so a real-time conversation can remember without sounding like it stopped to think.' });
  tl.tween(close, 1, { at: 53.3, dur: 1.1, ease: ease.move });
  tl.hold(59.2, 1.0);

  return { tl, cam, queryU, forkU, leftP, rightP, parallelU, mergeU, gateP, metricsU, cartridgeU, replyU, recapU, close };
}

const scene = buildScene();

function RailItem({ x, y, text, color, u }: { x: number; y: number; text: string; color: string; u: number }) {
  return <g opacity={u} transform={`translate(${x - (1 - u) * 24} ${y})`}>
    <rect x="-58" y="-20" width="116" height="40" rx="12" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
    <text y="5" textAnchor="middle" fill={color} fontSize="13" fontWeight="760">{text}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const fork = s.get(scene.forkU);
  const merge = s.get(scene.mergeU);
  const gateP = s.get(scene.gateP);
  const metrics = s.get(scene.metricsU);
  const cartridge = s.get(scene.cartridgeU);
  const reply = s.get(scene.replyU);
  const recap = s.get(scene.recapU);
  const pulseX = 236 + s.get(scene.parallelU) * 600;

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="58" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">Two rails feed one compact reply</text>

      <g opacity={s.get(scene.queryU)}>
        <rect x="64" y="122" width="236" height="92" rx="24" fill="#12243a" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="182" y="154" textAnchor="middle" fill={colors.ACCENT} fontSize="12" fontFamily={colors.font.mono}>partial transcript</text>
        <text x="182" y="184" textAnchor="middle" fill={colors.TEXT} fontSize="15">“the café yesterday…”</text>
      </g>

      <g opacity={fork}>
        <path d="M300 168 C360 168 356 270 430 270 H840" fill="none" stroke={colors.ACCENT} strokeWidth="6" strokeLinecap="round" />
        <path d="M300 168 C360 168 356 414 430 414 H840" fill="none" stroke={colors.SECONDARY} strokeWidth="6" strokeLinecap="round" />
        <text x="454" y="248" fill={colors.ACCENT} fontSize="13" fontFamily={colors.font.mono}>LeftBrain.rank</text>
        <text x="454" y="392" fill={colors.SECONDARY} fontSize="13" fontFamily={colors.font.mono}>RightBrain.search</text>
        <circle cx={pulseX} cy="270" r="12" fill={colors.ACCENT} />
        <circle cx={pulseX} cy="414" r="12" fill={colors.SECONDARY} />
      </g>

      {LEFT.map((item, i) => <RailItem key={item} x={572 + i * 118} y={270} text={item} color={colors.ACCENT} u={clamp01(s.get(scene.leftP) - i)} />)}
      {RIGHT.map((item, i) => <RailItem key={item} x={632 + i * 148} y={414} text={item} color={colors.SECONDARY} u={clamp01(s.get(scene.rightP) - i)} />)}

      <g opacity={merge}>
        <path d="M840 270 C900 270 890 334 934 334" fill="none" stroke={colors.ACCENT} strokeWidth="5" />
        <path d="M840 414 C900 414 890 352 934 352" fill="none" stroke={colors.SECONDARY} strokeWidth="5" />
        <rect x="924" y="232" width="286" height="236" rx="28" fill="#101a2d" stroke={colors.WARM} strokeWidth="3" />
        <text x="1067" y="266" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>ReplyContextPrompt</text>
        <text x="952" y="305" fill={colors.MUTED} fontSize="12">[Factual context]</text>
        <rect x="952" y="320" width="224" height="13" rx="6" fill={colors.ACCENT} opacity="0.55" />
        <text x="952" y="365" fill={colors.MUTED} fontSize="12">[Emotional context]</text>
        <rect x="952" y="380" width="180" height="13" rx="6" fill={colors.SECONDARY} opacity="0.55" />
        <text x="952" y="425" fill={colors.MUTED} fontSize="12">[Response directive]</text>
        <rect x="952" y="440" width="200" height="13" rx="6" fill={colors.WARM} opacity="0.55" />
      </g>

      <g>
        <rect x="330" y="512" width="510" height="92" rx="26" fill="#0e1b2c" stroke={colors.GRID} strokeWidth="2" />
        <text x="360" y="540" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>top_k = 5</text>
        {Array.from({ length: 5 }, (_, i) => {
          const u = clamp01(gateP - i);
          return <rect key={i} x={462 + i * 67} y={542 - (1 - u) * 22} width="48" height="42" rx="10" fill={i < 3 ? colors.ACCENT : colors.SECONDARY} opacity={0.18 + 0.82 * u} />;
        })}
        <g opacity={metrics} transform="translate(990 548)">
          <rect x="-140" y="-58" width="280" height="116" rx="25" fill="#10251f" stroke={colors.POSITIVE} strokeWidth="3" />
          <text x="-88" y="-12" textAnchor="middle" fill={colors.POSITIVE} fontSize="26" fontWeight="850">91.2</text>
          <text x="0" y="-12" textAnchor="middle" fill={colors.WARM} fontSize="26" fontWeight="850">430</text>
          <text x="92" y="-12" textAnchor="middle" fill={colors.ACCENT} fontSize="26" fontWeight="850">134</text>
          <text x="-88" y="18" textAnchor="middle" fill={colors.MUTED} fontSize="11">LoCoMo</text>
          <text x="0" y="18" textAnchor="middle" fill={colors.MUTED} fontSize="11">tokens</text>
          <text x="92" y="18" textAnchor="middle" fill={colors.MUTED} fontSize="11">ms</text>
        </g>
      </g>

      <g opacity={cartridge} transform={`translate(${430 + cartridge * 120} 468)`}>
        <rect x="-124" y="-34" width="248" height="68" rx="18" fill="#2a210d" stroke={colors.WARM} strokeWidth="3" />
        <text y="-6" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>memory_engine override</text>
        <text y="19" textAnchor="middle" fill={colors.MUTED} fontSize="12">replaceable lower layer</text>
      </g>

      <g opacity={reply}>
        <path d="M840 558 C894 558 896 516 930 500" fill="none" stroke={colors.POSITIVE} strokeWidth="6" />
        <circle cx={840 + 90 * reply} cy={558 - 58 * reply} r="12" fill={colors.POSITIVE} />
        <rect x="936" y="468" width="266" height="72" rx="22" fill="#10251f" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="1069" y="497" textAnchor="middle" fill={colors.POSITIVE} fontSize="13" fontFamily={colors.font.mono}>Turn.memory_context</text>
        <text x="1069" y="523" textAnchor="middle" fill={colors.TEXT} fontSize="14">speech model can answer</text>
      </g>

      <g opacity={recap}>
        <path d={`M94 94 H${94 + 1092 * recap}`} stroke={colors.WARM} strokeWidth="5" strokeLinecap="round" />
        {['speech', 'wager', 'funnel', 'affect', 'five'].map((label, i) => {
          const x = 120 + i * 250;
          const u = clamp01(recap * 5 - i);
          return <g key={label} opacity={u} transform={`translate(${x} 94)`}>
            <circle r="13" fill={i === 4 ? colors.POSITIVE : i === 3 ? colors.SECONDARY : colors.WARM} />
            <text y="-22" textAnchor="middle" fill={colors.MUTED} fontSize="12">{label}</text>
          </g>;
        })}
      </g>
    </g>

    <g opacity={close}>
      <rect x="192" y="122" width="896" height="438" rx="42" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="204" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">memory before silence</text>
      <path d="M270 354 C320 246 370 462 420 354 S520 246 570 354" fill="none" stroke={colors.ACCENT} strokeWidth="8" />
      <path d="M590 354 H760" stroke={colors.WARM} strokeWidth="8" strokeLinecap="round" />
      <circle cx="676" cy="354" r="17" fill={colors.WARM} />
      <g transform="translate(894 354)">
        {Array.from({ length: 5 }, (_, i) => <rect key={i} x={-70 + i * 30} y="-44" width="22" height="88" rx="7" fill={i < 3 ? colors.ACCENT : colors.SECONDARY} />)}
      </g>
      <text x="420" y="466" textAnchor="middle" fill={colors.MUTED} fontSize="17">unfinished speech</text>
      <text x="676" y="466" textAnchor="middle" fill={colors.WARM} fontSize="17">hidden retrieval</text>
      <text x="894" y="466" textAnchor="middle" fill={colors.POSITIVE} fontSize="17">ready reply context</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
