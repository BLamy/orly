// Grounding: paper section 3.3 and Figure 3; voicemem/stream.py::VoiceStream
// (_kick, _speculate, _confirm, feed); web/run.py streaming defaults.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const WORDS = ['What', 'did', 'I', 'say', 'about', 'the', 'café'];
const WAVE = Array.from({ length: 72 }, (_, i) => ({
  x: 92 + i * 14.8,
  h: 10 + 38 * Math.abs(Math.sin(i * 0.73) * Math.cos(i * 0.19)),
}));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const waveU = tl.channel('audio waveform', 0);
  const wordsP = tl.channel('partial transcript', 0);
  const thresholdU = tl.channel('six character threshold', 0);
  const specU = tl.channel('speculative search', 0);
  const replaceU = tl.channel('replace stale search', 0);
  const silenceU = tl.channel('silence clock', 0);
  const searchP = tl.channel('local retrieval progress', 0);
  const memoryP = tl.channel('memory tray', 0);
  const cancelU = tl.channel('barge in cancel', 0);
  const replayU = tl.channel('clean replay', 0);
  const confirmU = tl.channel('turn over confirmation', 0);
  const close = tl.channel('ready before silence ends', 0);

  tl.caption({ at: 0.4, dur: 6.4, text: 'A voice assistant cannot wait for the question to end before it starts remembering.' });
  tl.tween(waveU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(wordsP, 4, { at: 2.0, dur: 3.0, ease: ease.linear });

  tl.caption({ at: 6.8, dur: 6.4, text: 'As the partial transcript grows long enough, the memory system launches a local classification and search.' });
  tl.tween(wordsP, 6, { at: 7.2, dur: 1.5, ease: ease.linear });
  tl.tween(thresholdU, 1, { at: 8.4, dur: 0.6, ease: ease.pop });
  tl.tween(specU, 1, { at: 9.2, dur: 1.3, ease: ease.move });
  tl.tween(cam, { x: 560, y: 360, k: 1.05 }, { at: 10.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 13.2, dur: 6.4, text: 'If another word arrives, the stale task is canceled and a fresher search takes its place.' });
  tl.tween(wordsP, 7, { at: 13.7, dur: 0.8, ease: ease.linear });
  tl.tween(replaceU, 1, { at: 14.5, dur: 1.1, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 16.7, dur: 1.2, ease: ease.move });

  tl.caption({ at: 19.6, dur: 6.4, text: 'At two hundred milliseconds of silence, the system wagers that the turn is probably finished.' });
  tl.tween(silenceU, 0.67, { at: 20.2, dur: 2.8, ease: ease.linear });
  tl.tween(searchP, 0.45, { at: 22.3, dur: 1.5, ease: ease.linear });

  tl.caption({ at: 26.0, dur: 6.5, text: 'That leaves one hundred milliseconds to finish retrieval before voice activity detection confirms the boundary.' });
  tl.tween(silenceU, 1, { at: 26.5, dur: 2.0, ease: ease.linear });
  tl.tween(searchP, 1, { at: 26.4, dur: 1.6, ease: ease.linear });
  tl.tween(memoryP, 5, { at: 27.2, dur: 1.6, ease: ease.enter });
  tl.tween(cam, { x: 700, y: 360, k: 1.05 }, { at: 28.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 32.5, dur: 6.4, text: 'If the speaker resumes, barge-in throws away the wager. Only a cheap local search was wasted.' });
  tl.tween(cancelU, 1, { at: 33.0, dur: 0.6, ease: ease.pop });
  tl.tween(searchP, 0, { at: 33.8, dur: 0.8, ease: ease.move });
  tl.tween(memoryP, 0, { at: 33.8, dur: 0.8, ease: ease.move });
  tl.tween(silenceU, 0, { at: 34.0, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 36.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 38.9, dur: 6.4, text: 'On the clean path, the wager survives. The retrieval tray fills before the three-hundred-millisecond mark.' });
  tl.tween(replayU, 1, { at: 39.4, dur: 0.5, ease: ease.pop });
  tl.tween(silenceU, 1, { at: 39.6, dur: 2.7, ease: ease.linear });
  tl.tween(searchP, 1, { at: 40.8, dur: 1.2, ease: ease.linear });
  tl.tween(memoryP, 5, { at: 41.3, dur: 1.2, ease: ease.enter });
  tl.tween(confirmU, 1, { at: 42.4, dur: 0.6, ease: ease.pop });

  tl.caption({ at: 45.3, dur: 6.3, text: 'The confirmed turn inherits memory that is already ready, so retrieval disappears inside silence the conversation already needed.' });
  tl.tween(close, 1, { at: 46.0, dur: 1.1, ease: ease.move });
  tl.hold(51.8, 1.0);

  return { tl, cam, waveU, wordsP, thresholdU, specU, replaceU, silenceU, searchP, memoryP, cancelU, replayU, confirmU, close };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const wordsP = s.get(scene.wordsP);
  const silence = s.get(scene.silenceU);
  const search = s.get(scene.searchP);
  const memoryP = s.get(scene.memoryP);
  const cancel = s.get(scene.cancelU);
  const runnerX = 430 + 540 * search;

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="58" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">Retrieval starts before the turn ends</text>
      <g opacity={s.get(scene.waveU)}>
        <rect x="70" y="106" width="1140" height="122" rx="28" fill="#0d1728" stroke={colors.GRID} strokeWidth="2" />
        {WAVE.map((bar, i) => {
          const u = clamp01(s.get(scene.waveU) * WAVE.length - i);
          return <line key={i} x1={bar.x} x2={bar.x} y1={167 - bar.h * u} y2={167 + bar.h * u} stroke={i > 53 ? colors.SECONDARY : colors.ACCENT} strokeWidth="5" strokeLinecap="round" opacity={0.35 + 0.65 * u} />;
        })}
      </g>

      <g>
        {WORDS.map((word, i) => {
          const u = clamp01(wordsP - i);
          return <g key={word} opacity={u} transform={`translate(${124 + i * 142} 286) translate(0 ${(1 - u) * 18})`}>
            <rect x="-54" y="-24" width="108" height="48" rx="14" fill="#13243b" stroke={i >= 5 ? colors.WARM : colors.ACCENT} strokeWidth="2" />
            <text y="7" textAnchor="middle" fill={colors.TEXT} fontSize="17" fontWeight="720">{word}</text>
          </g>;
        })}
        <g opacity={s.get(scene.thresholdU)}>
          <path d="M86 326 H928" stroke={colors.WARM} strokeWidth="4" strokeLinecap="round" />
          <text x="507" y="350" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>spec_min_chars = 6</text>
        </g>
      </g>

      <g opacity={s.get(scene.specU)}>
        <rect x="94" y="398" width="312" height="82" rx="22" fill="#111d31" stroke={cancel ? colors.NEGATIVE : colors.SECONDARY} strokeWidth="3" />
        <text x="250" y="430" textAnchor="middle" fill={colors.SECONDARY} fontSize="15" fontFamily={colors.font.mono}>classify → search</text>
        <text x="250" y="458" textAnchor="middle" fill={colors.MUTED} fontSize="13">local embedding · no network</text>
        <circle cx={runnerX} cy="439" r="14" fill={cancel ? colors.NEGATIVE : colors.POSITIVE} opacity={1 - cancel * 0.7} />
        <path d={`M406 439 H${runnerX}`} stroke={colors.POSITIVE} strokeWidth="5" strokeLinecap="round" opacity={0.45} />
        <g opacity={s.get(scene.replaceU)} transform="translate(410 378)">
          <rect x="-106" y="-17" width="212" height="34" rx="17" fill="#2a1d0c" stroke={colors.WARM} />
          <text y="5" textAnchor="middle" fill={colors.WARM} fontSize="12" fontFamily={colors.font.mono}>cancel stale asyncio task</text>
        </g>
      </g>

      <g opacity={s.get(scene.specU)}>
        <rect x="94" y="526" width="876" height="42" rx="21" fill="#11192a" stroke={colors.GRID} />
        <rect x="94" y="526" width={876 * silence} height="42" rx="21" fill={silence < 0.67 ? colors.ACCENT : colors.WARM} opacity="0.32" />
        <line x1="678" y1="516" x2="678" y2="580" stroke={colors.WARM} strokeWidth="3" />
        <line x1="970" y1="516" x2="970" y2="580" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="94" y="602" fill={colors.MUTED} fontSize="13">0 ms</text>
        <text x="678" y="602" textAnchor="middle" fill={colors.WARM} fontSize="13">200 ms · gamble</text>
        <text x="970" y="602" textAnchor="middle" fill={colors.POSITIVE} fontSize="13">300 ms · confirm</text>
      </g>

      <g transform="translate(1006 390)">
        <rect x="-112" y="-42" width="224" height="146" rx="24" fill="#10251f" stroke={s.get(scene.confirmU) ? colors.POSITIVE : colors.GRID} strokeWidth="3" />
        <text y="-12" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>Turn.memory</text>
        {Array.from({ length: 5 }, (_, i) => {
          const u = clamp01(memoryP - i);
          return <rect key={i} x={-82 + i * 34} y={18 + (1 - u) * 28} width="24" height="58" rx="7" fill={i % 2 ? colors.SECONDARY : colors.ACCENT} opacity={0.2 + u * 0.8} />;
        })}
        <text y="94" textAnchor="middle" fill={colors.MUTED} fontSize="12">top five ready</text>
      </g>

      <g opacity={cancel} transform="translate(706 406)">
        <circle r="38" fill="#32141c" stroke={colors.NEGATIVE} strokeWidth="4" />
        <path d="M-15 -15 L15 15 M15 -15 L-15 15" stroke={colors.NEGATIVE} strokeWidth="7" strokeLinecap="round" />
        <text y="64" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14">barge-in</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="194" y="126" width="892" height="430" rx="42" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="204" textAnchor="middle" fill={colors.TEXT} fontSize="38" fontWeight="850">memory arrives before silence ends</text>
      <g transform="translate(326 350)">
        <path d="M-84 0 C-52 -90 -18 90 14 0 S82 -90 112 0" fill="none" stroke={colors.ACCENT} strokeWidth="8" />
        <text y="90" textAnchor="middle" fill={colors.MUTED} fontSize="16">unfinished speech</text>
      </g>
      <path d="M454 350 H792" stroke={colors.WARM} strokeWidth="8" strokeLinecap="round" />
      <circle cx="624" cy="350" r="16" fill={colors.WARM} />
      <text x="624" y="395" textAnchor="middle" fill={colors.WARM} fontSize="15">one hundred millisecond window</text>
      <g transform="translate(930 350)">
        {Array.from({ length: 5 }, (_, i) => <rect key={i} x={-70 + i * 30} y="-42" width="22" height="84" rx="7" fill={i % 2 ? colors.SECONDARY : colors.POSITIVE} />)}
        <text y="90" textAnchor="middle" fill={colors.MUTED} fontSize="16">ready context</text>
      </g>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
