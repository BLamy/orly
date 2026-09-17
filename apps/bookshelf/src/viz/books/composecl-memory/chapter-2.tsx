// Grounding: arXiv:2609.06986 Section 3; official source
// core/generative_replay.py, core/self_distillation.py, core/si.py,
// core/ewc.py, and core/training.py.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const PARAMS = Array.from({ length: 18 }, (_, i) => ({
  x: 498 + (i % 6) * 58,
  y: 246 + Math.floor(i / 6) * 58,
  important: [1, 4, 6, 9, 11, 14, 16].includes(i),
}));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const coreU = tl.channel('model core', 0);
  const updateU = tl.channel('new task update', 0);
  const memoryU = tl.channel('old association', 0);
  const replayU = tl.channel('generated replay', 0);
  const replayP = tl.channel('replay packet', 0);
  const functionU = tl.channel('previous state teacher', 0);
  const logitsU = tl.channel('teacher student distributions', 0);
  const weightsU = tl.channel('parameter field', 0);
  const driftU = tl.channel('parameter drift', 0);
  const springU = tl.channel('importance springs', 0);
  const composeU = tl.channel('three anchors compose', 0);
  const lossU = tl.channel('composed loss', 0);
  const surviveU = tl.channel('memory survives', 0);
  const closeU = tl.channel('closing composition', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'A new task pushes the model toward a new answer. The old association moves even though nobody asked to erase it.' });
  tl.tween(coreU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(memoryU, 1, { at: 1.4, dur: 0.7, ease: ease.pop });
  tl.tween(updateU, 1, { at: 2.1, dur: 2.0, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 334, k: 1.12 }, { at: 2.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.5, text: 'The method protects three different surfaces: the data the model rehearses, the function it computes, and the weights that carry it.' });
  tl.tween(composeU, 0.18, { at: 7.0, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 9.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.5, text: 'The data anchor asks the previous model to generate replay examples from a dedicated seed token.' });
  tl.tween(replayU, 1, { at: 12.9, dur: 1.2, ease: ease.enter });
  tl.tween(replayP, 1, { at: 14.1, dur: 2.3, ease: ease.linear });
  tl.tween(cam, { x: 420, y: 340, k: 1.08 }, { at: 13.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.4, dur: 5.5, text: 'Those generated prompts carry soft targets from the frozen teacher, so rehearsal needs no stored examples from earlier tasks.' });
  tl.tween(replayP, 2, { at: 18.9, dur: 2.4, ease: ease.linear });

  tl.caption({ at: 24.4, dur: 5.5, text: 'The function anchor keeps a frozen previous-state adapter and compares its full output distribution with the student.' });
  tl.tween(functionU, 1, { at: 24.9, dur: 1.2, ease: ease.enter });
  tl.tween(logitsU, 1, { at: 26.0, dur: 2.0, ease: ease.draw });
  tl.tween(cam, { x: 860, y: 330, k: 1.08 }, { at: 25.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.5, text: 'Forward Kullback-Leibler divergence penalizes changed predictions on the current inputs, preserving behavior rather than examples.' });
  tl.tween(logitsU, 1.8, { at: 30.9, dur: 1.6, ease: ease.move });

  tl.caption({ at: 36.4, dur: 5.5, text: 'The weight anchor watches each trainable parameter during a task and accumulates how much its path contributed to the objective.' });
  tl.tween(weightsU, 1, { at: 36.9, dur: 1.8, ease: ease.enter });
  tl.tween(driftU, 1, { at: 38.1, dur: 2.2, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 340, k: 1.08 }, { at: 37.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.5, text: 'At the boundary, Synaptic Intelligence turns that path into importance. Valuable parameters get a quadratic spring back toward their saved values.' });
  tl.tween(springU, 1, { at: 42.9, dur: 1.5, ease: ease.pop });
  tl.tween(driftU, 0.25, { at: 44.0, dur: 1.5, ease: ease.move });

  tl.caption({ at: 48.4, dur: 5.5, text: 'Replay guards remembered data. Distillation guards outputs. Synaptic Intelligence guards important coordinates.' });
  tl.tween(composeU, 1, { at: 49.0, dur: 2.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 50.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 54.4, dur: 5.5, text: 'The training loop adds all three penalties to the current-task objective. They act together on the same update, not in a relay.' });
  tl.tween(lossU, 1, { at: 55.0, dur: 1.5, ease: ease.enter });

  tl.caption({ at: 60.4, dur: 5.5, text: 'Because the anchors constrain different failure modes, their composition can preserve what any single restraint still lets drift.' });
  tl.tween(surviveU, 1, { at: 61.0, dur: 1.2, ease: ease.pop });

  tl.caption({ at: 66.4, dur: 5.8, text: 'Three anchors hold the memory. The remaining question is where each new low-rank update should live.' });
  tl.tween(closeU, 1, { at: 67.0, dur: 1.3, ease: ease.move });
  tl.hold(72.2, 1.0);

  return { tl, cam, coreU, updateU, memoryU, replayU, replayP, functionU, logitsU, weightsU, driftU, springU, composeU, lossU, surviveU, closeU };
}

const scene = buildScene();

function Anchor({ x, y, color, label, u }: { x: number; y: number; color: string; label: string; u: number }) {
  return <g transform={`translate(${x} ${y + (1 - u) * 22})`} opacity={u}>
    <circle r="54" fill="#101827" stroke={color} strokeWidth="4" />
    <path d="M0 -33 V24 M-20 3 H20 M-20 3 C-20 28 -40 34 -48 18 M20 3 C20 28 40 34 48 18" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <text y="78" textAnchor="middle" fill={color} fontSize="14" fontWeight="800">{label}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const compose = s.get(scene.composeU);
  const replay = s.get(scene.replayU);
  const replayP = s.get(scene.replayP);
  const fn = s.get(scene.functionU);
  const logits = s.get(scene.logitsU);
  const weights = s.get(scene.weightsU);
  const drift = s.get(scene.driftU);
  const springs = s.get(scene.springU);
  const update = s.get(scene.updateU);
  const survive = s.get(scene.surviveU);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="96" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">three surfaces of memory</text>

      <g opacity={s.get(scene.coreU)}>
        <circle cx="640" cy="340" r="128" fill="#111c2c" stroke={colors.GRID} strokeWidth="4" />
        <circle cx={640 + update * 34} cy={340 - update * 18} r="72" fill="#15253a" stroke={survive > 0 ? colors.POSITIVE : colors.ACCENT} strokeWidth={3 + survive * 3} />
        <text x={640 + update * 34} y={332 - update * 18} textAnchor="middle" fill={colors.TEXT} fontSize="18" fontWeight="800">Qwen3-4B-Base</text>
        <text x={640 + update * 34} y={360 - update * 18} textAnchor="middle" fill={colors.MUTED} fontSize="12">current learner</text>
        <g opacity={s.get(scene.memoryU)} transform={`translate(${640 + update * 25} ${420 - update * 8})`}>
          <rect x="-96" y="-20" width="192" height="40" rx="16" fill="#2b2513" stroke={survive > 0 ? colors.POSITIVE : colors.WARM} strokeWidth="2.5" />
          <text y="5" textAnchor="middle" fill={survive > 0 ? colors.POSITIVE : colors.WARM} fontSize="12" fontFamily={colors.font.mono}>oHBvRP → OIvG</text>
        </g>
      </g>

      <g opacity={replay * (1 - compose * 0.72)}>
        <rect x="90" y="150" width="318" height="340" rx="34" fill="#101827" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="249" y="188" textAnchor="middle" fill={colors.ACCENT} fontSize="15" fontFamily={colors.font.mono}>GenerativeReplay</text>
        <circle cx="150" cy="245" r="24" fill="#182b3e" stroke={colors.ACCENT} strokeWidth="2" />
        <text x="150" y="251" textAnchor="middle" fill={colors.TEXT} fontSize="12">seed</text>
        <path d="M176 245 C246 200 320 214 356 270 C390 324 324 390 244 410 C180 426 130 386 150 330" fill="none" stroke={colors.ACCENT} strokeWidth="4" strokeDasharray="10 8" />
        {[0, 1, 2].map((i) => {
          const phase = (replayP + i * 0.22) % 1;
          const angle = phase * Math.PI * 2;
          return <circle key={i} cx={250 + Math.cos(angle) * 104} cy={315 + Math.sin(angle) * 86} r="9" fill={i === 0 ? colors.WARM : colors.ACCENT} />;
        })}
        <text x="249" y="462" textAnchor="middle" fill={colors.MUTED} fontSize="12">generated prompt + teacher soft target</text>
      </g>

      <g opacity={fn * (1 - compose * 0.72)}>
        <rect x="872" y="150" width="318" height="340" rx="34" fill="#101827" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="1031" y="188" textAnchor="middle" fill={colors.SECONDARY} fontSize="15" fontFamily={colors.font.mono}>SelfDistillation</text>
        {Array.from({ length: 7 }, (_, i) => {
          const teacher = [0.88, 0.58, 0.34, 0.23, 0.17, 0.11, 0.07][i];
          const student0 = [0.45, 0.78, 0.48, 0.31, 0.22, 0.16, 0.11][i];
          const student = student0 + (teacher - student0) * clamp01(logits - 0.8);
          return <g key={i} transform={`translate(920 ${230 + i * 31})`} opacity={clamp01(logits * 8 - i)}>
            <rect width={180 * teacher} height="9" rx="4.5" fill={colors.SECONDARY} opacity="0.42" />
            <rect y="12" width={180 * student} height="9" rx="4.5" fill={colors.WARM} opacity="0.78" />
          </g>;
        })}
        <text x="1031" y="468" textAnchor="middle" fill={colors.MUTED} fontSize="12">teacher distribution ↔ student distribution</text>
      </g>

      <g opacity={weights * (1 - compose * 0.72)}>
        {PARAMS.map((p, i) => {
          const dx = (i % 2 === 0 ? -1 : 1) * drift * (p.important ? 14 : 42);
          const dy = ((i % 3) - 1) * drift * (p.important ? 10 : 30);
          return <g key={i}>
            {p.important && springs > 0 && <line x1={p.x} y1={p.y} x2={p.x + dx} y2={p.y + dy} stroke={colors.WARM} strokeWidth={2 + springs * 2} opacity={springs} />}
            <circle cx={p.x + dx} cy={p.y + dy} r={p.important ? 11 : 8} fill={p.important ? colors.WARM : colors.MUTED} opacity={p.important ? 0.95 : 0.46} />
          </g>;
        })}
        <text x="640" y="520" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>SynapticIntelligence · importance · saved parameters</text>
      </g>

      <g opacity={compose}>
        <Anchor x={230} y={250} color={colors.ACCENT} label="data" u={clamp01(compose * 4)} />
        <Anchor x={640} y={150} color={colors.SECONDARY} label="function" u={clamp01(compose * 4 - 1)} />
        <Anchor x={1050} y={250} color={colors.WARM} label="weight" u={clamp01(compose * 4 - 2)} />
        <path d="M280 272 C390 420 500 436 570 388 M640 220 V270 M1000 272 C890 420 780 436 710 388" fill="none" stroke={colors.POSITIVE} strokeWidth="4" opacity={clamp01(compose * 4 - 3)} />
        <g opacity={s.get(scene.lossU)}>
          <rect x="356" y="520" width="568" height="62" rx="22" fill="#12291f" stroke={colors.POSITIVE} strokeWidth="3" />
          <MathLabel tex={'L=(1-w)L_{current}+wL_{replay}+L_{SD}+L_{SI}'} x={640} y={558} fontSize={22} opacity={1} />
        </g>
      </g>
    </g>

    <g opacity={close}>
      <rect x="176" y="116" width="928" height="452" rx="56" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="212" textAnchor="middle" fill={colors.TEXT} fontSize="48" fontWeight="880">three anchors · one update</text>
      {[{ x: 360, c: colors.ACCENT, l: 'rehearse data' }, { x: 640, c: colors.SECONDARY, l: 'match outputs' }, { x: 920, c: colors.WARM, l: 'protect weights' }].map((a) => <g key={a.l} transform={`translate(${a.x} 370)`}>
        <circle r="70" fill="#101827" stroke={a.c} strokeWidth="4" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="14">{a.l}</text>
      </g>)}
      <text x="640" y="500" textAnchor="middle" fill={colors.MUTED} fontSize="16">different failure modes · composed protection</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
