// Grounding: paper section 3.2; voicemem/rightbrain/brain.py::search, write,
// learn_from_reaction, _write_trait; emotion/graph_memory.py::add_attribution.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EPISODES = [
  { x: 350, y: 314, label: 'uneasy', v: -0.45, a: 0.55 },
  { x: 392, y: 280, label: 'tense', v: -0.32, a: 0.72 },
  { x: 328, y: 360, label: 'guarded', v: -0.53, a: 0.34 },
  { x: 430, y: 332, label: 'hesitant', v: -0.22, a: 0.46 },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axesU = tl.channel('valence arousal field', 0);
  const episodeP = tl.channel('emotion episodes', 0);
  const splitU = tl.channel('episode versus persona', 0);
  const independentU = tl.channel('independent persona node', 0);
  const leftEntityU = tl.channel('left brain entity', 0);
  const crossU = tl.channel('cross entity node', 0);
  const evidenceP = tl.channel('short horizon evidence', 0);
  const traitU = tl.channel('long horizon trait', 0);
  const queryU = tl.channel('dual node query', 0);
  const close = tl.channel('person plus context', 0);

  tl.caption({ at: 0.4, dur: 6.4, text: 'Facts alone cannot explain why the same topic feels different to the same person over time.' });
  tl.tween(axesU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(episodeP, 1, { at: 2.2, dur: 0.7, ease: ease.pop });

  tl.caption({ at: 6.8, dur: 6.4, text: 'The right brain records an emotion episode with acoustic and semantic evidence, while keeping it tied to its turn.' });
  tl.tween(episodeP, 4, { at: 7.4, dur: 2.1, ease: ease.enter });
  tl.tween(cam, { x: 520, y: 360, k: 1.05 }, { at: 9.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 13.2, dur: 6.4, text: 'A transient feeling is not automatically a personality claim, so the architecture separates episodes from persistent nodes.' });
  tl.tween(splitU, 1, { at: 13.8, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 16.1, dur: 1.2, ease: ease.move });

  tl.caption({ at: 19.6, dur: 6.4, text: 'Independent nodes capture tendencies that belong to the person across topics, such as a stable response style.' });
  tl.tween(independentU, 1, { at: 20.2, dur: 0.7, ease: ease.pop });
  tl.tween(cam, { x: 680, y: 340, k: 1.05 }, { at: 22.1, dur: 1.2, ease: ease.move });

  tl.caption({ at: 26.0, dur: 6.5, text: 'Cross-entity nodes capture something narrower: emotion or preference attached to a real entity from the left brain.' });
  tl.tween(leftEntityU, 1, { at: 26.5, dur: 0.7, ease: ease.enter });
  tl.tween(crossU, 1, { at: 27.6, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 29.7, dur: 1.2, ease: ease.move });

  tl.caption({ at: 32.5, dur: 6.4, text: 'Repeated short-horizon evidence thickens the relationship, instead of letting one dramatic turn define the person forever.' });
  tl.tween(evidenceP, 4, { at: 33.1, dur: 3.2, ease: ease.enter });

  tl.caption({ at: 38.9, dur: 6.4, text: 'Long-horizon attribution can consolidate that evidence into a trait while retaining the memory links that support it.' });
  tl.tween(traitU, 1, { at: 39.5, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: 700, y: 360, k: 1.05 }, { at: 41.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 45.3, dur: 6.5, text: 'At query time, the partial transcript activates both person-level tendencies and feelings connected to the current entity.' });
  tl.tween(queryU, 1, { at: 45.9, dur: 2.2, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 48.3, dur: 1.2, ease: ease.move });

  tl.caption({ at: 51.8, dur: 6.4, text: 'The result knows two different things: who the person tends to be, and how this particular part of their world affects them.' });
  tl.tween(close, 1, { at: 52.5, dur: 1.1, ease: ease.move });
  tl.hold(58.4, 1.0);

  return { tl, cam, axesU, episodeP, splitU, independentU, leftEntityU, crossU, evidenceP, traitU, queryU, close };
}

const scene = buildScene();

function Node({ x, y, r, color, label, sub, u = 1 }: { x: number; y: number; r: number; color: string; label: string; sub: string; u?: number }) {
  return <g opacity={u} transform={`translate(${x} ${y + (1 - u) * 20}) scale(${0.82 + u * 0.18})`}>
    <circle r={r} fill={color} fillOpacity="0.13" stroke={color} strokeWidth="3" />
    <text y="-4" textAnchor="middle" fill={color} fontSize="15" fontWeight="820">{label}</text>
    <text y="19" textAnchor="middle" fill={colors.MUTED} fontSize="11">{sub}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const split = s.get(scene.splitU);
  const cross = s.get(scene.crossU);
  const evidenceP = s.get(scene.evidenceP);
  const trait = s.get(scene.traitU);
  const query = s.get(scene.queryU);
  const indep = s.get(scene.independentU);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="58" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">The right brain keeps attribution, not just sentiment</text>

      <g opacity={s.get(scene.axesU)}>
        <rect x="72" y="112" width="518" height="438" rx="32" fill="#0e1728" stroke={colors.GRID} strokeWidth="2" />
        <line x1="112" y1="505" x2="548" y2="505" stroke={colors.GRID} strokeWidth="3" />
        <line x1="112" y1="505" x2="112" y2="152" stroke={colors.GRID} strokeWidth="3" />
        <text x="548" y="534" textAnchor="end" fill={colors.MUTED} fontSize="13">valence</text>
        <text x="96" y="158" textAnchor="end" fill={colors.MUTED} fontSize="13" transform="rotate(-90 96 158)">arousal</text>
        <line x1="330" y1="152" x2="330" y2="505" stroke={colors.GRID} strokeDasharray="7 8" />
        <line x1="112" y1="329" x2="548" y2="329" stroke={colors.GRID} strokeDasharray="7 8" />
        <text x="330" y="584" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>emotion_episodes</text>
      </g>

      {EPISODES.map((ep, i) => {
        const u = clamp01(s.get(scene.episodeP) - i);
        const x = ep.x + split * (i - 1.5) * 22;
        const y = ep.y + split * 56;
        return <g key={ep.label} opacity={u} transform={`translate(${x} ${y}) scale(${0.78 + u * 0.22})`}>
          <circle r={18 + i * 2} fill={colors.NEGATIVE} fillOpacity="0.22" stroke={colors.NEGATIVE} strokeWidth="3" />
          <circle r={30 + i * 4} fill="none" stroke={colors.NEGATIVE} strokeOpacity="0.2" />
          <text y={48 + i * 2} textAnchor="middle" fill={colors.MUTED} fontSize="11">{ep.label}</text>
        </g>;
      })}

      <g>
        <Node x={782} y={214} r={82 + trait * 10} color={colors.SECONDARY} label="guarded with advice" sub="independent persona node" u={indep} />
        <Node x={1060} y={430} r={68} color={colors.ACCENT} label="café" sub="left-brain entity" u={s.get(scene.leftEntityU)} />
        <Node x={790} y={450} r={76} color={colors.WARM} label="uneasy in cafés" sub="cross-entity node" u={cross} />
        <path d={`M${856} 438 C930 388 972 402 994 420`} fill="none" stroke={colors.WARM} strokeWidth={2 + cross * 5} strokeDasharray="10 8" opacity={cross} />
        <text x="930" y="378" textAnchor="middle" fill={colors.WARM} fontSize="12" opacity={cross} fontFamily={colors.font.mono}>ρv,e</text>
        <path d="M782 296 V370" stroke={colors.SECONDARY} strokeWidth={2 + trait * 6} opacity={Math.max(indep, trait)} />
        <text x="808" y="344" fill={colors.MUTED} fontSize="12" opacity={trait}>long horizon</text>
      </g>

      <g opacity={cross}>
        {Array.from({ length: 4 }, (_, i) => {
          const u = clamp01(evidenceP - i);
          const x = 642 + i * 52;
          const y = 530 - (i % 2) * 22;
          return <g key={i} opacity={u} transform={`translate(${x} ${y + (1 - u) * 18})`}>
            <circle r="13" fill={colors.NEGATIVE} />
            <path d={`M13 0 C42 -4 60 -26 ${790 - x - 66} ${450 - y}`} fill="none" stroke={colors.NEGATIVE} strokeWidth="2" opacity="0.45" />
          </g>;
        })}
        <text x="694" y="584" textAnchor="middle" fill={colors.MUTED} fontSize="12">linked evidence</text>
      </g>

      <g opacity={query}>
        <rect x="82" y="72" width="408" height="38" rx="19" fill="#12243a" stroke={colors.ACCENT} />
        <text x="286" y="97" textAnchor="middle" fill={colors.TEXT} fontSize="14">partial transcript: “the café yesterday…”</text>
        <path d={`M490 91 C640 78 692 126 ${748} 170`} fill="none" stroke={colors.SECONDARY} strokeWidth="5" strokeDasharray="10 8" />
        <path d={`M490 91 C666 162 708 314 ${746} 408`} fill="none" stroke={colors.WARM} strokeWidth="5" strokeDasharray="10 8" />
        <circle cx={490 + 258 * query} cy={91 + 79 * query} r="10" fill={colors.SECONDARY} />
        <circle cx={490 + 256 * query} cy={91 + 317 * query} r="10" fill={colors.WARM} />
      </g>
    </g>

    <g opacity={close}>
      <rect x="192" y="122" width="896" height="438" rx="42" fill={colors.BG} stroke={colors.SECONDARY} strokeWidth="4" />
      <text x="640" y="202" textAnchor="middle" fill={colors.TEXT} fontSize="37" fontWeight="850">person-level and entity-level memory</text>
      <Node x={410} y={356} r={102} color={colors.SECONDARY} label="who they tend to be" sub="independent node" />
      <path d="M516 356 H744" stroke={colors.GRID} strokeWidth="6" strokeDasharray="10 10" />
      <Node x={866} y={356} r={102} color={colors.WARM} label="how this affects them" sub="cross-entity node" />
      <text x="640" y="506" textAnchor="middle" fill={colors.POSITIVE} fontSize="20">two node families · one attributed history</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
