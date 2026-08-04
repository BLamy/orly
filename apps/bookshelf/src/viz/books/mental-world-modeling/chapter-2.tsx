// Model the Mind - chapter 2: Show Each Agent Only Their World.
//
// Grounded in arXiv:2607.27201 Sections 3.2-3.3 and Figure 1, plus
// mentis/engine.py MentisEngine._render_observation and
// mentis/prompts.py observation_prompt. The prompt explicitly forbids
// copying hidden global mental state as mind reading.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type Fact = { label: string; kind: 'physical' | 'mental'; visible: boolean; x: number; y: number };

const FACTS: Fact[] = [
  { label: 'Alice at desk', kind: 'physical', visible: true, x: 210, y: 226 },
  { label: 'Bob in hallway', kind: 'physical', visible: true, x: 390, y: 226 },
  { label: 'gift in closet', kind: 'physical', visible: false, x: 210, y: 322 },
  { label: 'Alice speaks', kind: 'physical', visible: true, x: 390, y: 322 },
  { label: 'Bob believes: kitchen', kind: 'mental', visible: true, x: 210, y: 454 },
  { label: 'Alice intends: redirect', kind: 'mental', visible: false, x: 390, y: 454 },
  { label: 'Bob goal: find gift', kind: 'mental', visible: true, x: 210, y: 550 },
  { label: 'Alice knows: closet', kind: 'mental', visible: false, x: 390, y: 550 },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stateU = tl.channel('stateU', 0);
  const lensU = tl.channel('lensU', 0);
  const lensX = tl.channel('lensX', 300);
  const lensY = tl.channel('lensY', 270);
  const physicalP = tl.channel('physicalP', 0);
  const hiddenBounce = tl.channel('hiddenBounce', 0);
  const mentalP = tl.channel('mentalP', 0);
  const mindReadBounce = tl.channel('mindReadBounce', 0);
  const observationU = tl.channel('observationU', 0);
  const keysU = tl.channel('keysU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.2, text: 'Mentis begins with an omniscient world state: every physical fact and every modeled mental variable in one place.' });
  tl.tween(stateU, 1, { at: 0.9, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 330, y: 380, k: 1.10 }, { at: 1.4, dur: 1.3, ease: ease.move });
  tl.hold(6.7, 0.7);

  tl.caption({ at: 7.4, dur: 6.0, text: 'The target agent never receives that god’s-eye view. Observation generation renders a first-person slice.' });
  tl.tween(lensU, 1, { at: 7.9, dur: 0.7, ease: ease.enter });
  tl.tween(lensX, 390, { at: 9.0, dur: 1.3, ease: ease.move });
  tl.tween(lensY, 322, { at: 9.0, dur: 1.3, ease: ease.move });
  tl.hold(13.4, 0.7);

  tl.caption({ at: 14.1, dur: 6.1, text: 'Visible people, audible speech, and reachable objects pass into the physical observation.' });
  tl.tween(physicalP, 1, { at: 14.6, dur: 3.4, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 360, k: 1.03 }, { at: 15.2, dur: 1.3, ease: ease.move });
  tl.hold(20.2, 0.7);

  tl.caption({ at: 20.9, dur: 5.9, text: 'The hidden gift location stops at the boundary because the target cannot see it.' });
  tl.tween(hiddenBounce, 1, { at: 21.4, dur: 1.7, ease: ease.move });
  tl.tween(lensX, 210, { at: 21.5, dur: 1.3, ease: ease.move });
  tl.tween(lensY, 322, { at: 21.5, dur: 1.3, ease: ease.move });
  tl.hold(26.8, 0.7);

  tl.caption({ at: 27.5, dur: 6.1, text: 'The target’s own belief and goal pass through the mental side of the same observation.' });
  tl.tween(mentalP, 1, { at: 28.0, dur: 3.2, ease: ease.linear });
  tl.tween(lensX, 210, { at: 28.1, dur: 1.3, ease: ease.move });
  tl.tween(lensY, 500, { at: 28.1, dur: 1.3, ease: ease.move });
  tl.hold(33.6, 0.7);

  tl.caption({ at: 34.3, dur: 6.2, text: 'Another person’s private intention stays behind unless behavior, speech, gaze, or expression supports the inference.' });
  tl.tween(mindReadBounce, 1, { at: 34.8, dur: 1.8, ease: ease.move });
  tl.tween(lensX, 390, { at: 34.9, dur: 1.3, ease: ease.move });
  tl.tween(lensY, 454, { at: 34.9, dur: 1.3, ease: ease.move });
  tl.hold(40.5, 0.7);

  tl.caption({ at: 41.2, dur: 6.0, text: 'The repository preserves that boundary in two typed keys: physical observation and mental observation.' });
  tl.tween(observationU, 1, { at: 41.7, dur: 1.3, ease: ease.draw });
  tl.tween(keysU, 1, { at: 43.2, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 43.5, dur: 1.3, ease: ease.move });
  tl.hold(47.2, 0.7);

  tl.caption({ at: 47.9, dur: 6.6, text: 'That partial world is not missing data by accident. It is the perspective from which the target must choose an action.' });
  tl.tween(dimU, 1, { at: 48.4, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 49.2, dur: 0.7, ease: ease.enter });
  tl.hold(54.5, 1.0);

  return { tl, cam, stateU, lensU, lensX, lensY, physicalP, hiddenBounce, mentalP, mindReadBounce, observationU, keysU, dimU, endU };
}

const scene = buildScene();

function FactCard({ fact, u, dim = 0 }: { fact: Fact; u: number; dim?: number }) {
  const color = fact.kind === 'physical' ? colors.ACCENT : colors.WARM;
  return <g opacity={u * (1 - dim * 0.82)} transform={`translate(${fact.x} ${fact.y}) scale(${0.82 + u * 0.18})`}>
    <rect x={-76} y={-32} width={152} height={64} rx={15} fill={colors.PANEL} stroke={color} strokeWidth={2} />
    <text y={5} textAnchor="middle" fill={colors.TEXT} fontSize={12}>{fact.label}</text>
    <circle cx={-58} cy={-16} r={5} fill={fact.visible ? colors.POSITIVE : colors.NEGATIVE} />
  </g>;
}

function Transfer({ from, to, u, color, label, bounce = false }: { from: { x: number; y: number }; to: { x: number; y: number }; u: number; color: string; label: string; bounce?: boolean }) {
  const raw = clamp01(u);
  if (raw <= 0.002) return null;
  const travel = bounce ? (raw < 0.55 ? raw / 0.55 : 1 - ((raw - 0.55) / 0.45) * 0.38) : raw;
  const x = lerp(from.x, to.x, travel);
  const y = lerp(from.y, to.y, travel) - Math.sin(travel * Math.PI) * 32;
  return <g>
    <path d={`M${from.x} ${from.y} Q${(from.x + to.x) / 2} ${Math.min(from.y, to.y) - 72} ${to.x} ${to.y}`} fill="none" stroke={color} strokeWidth={2} strokeDasharray="6 7" opacity={0.35} />
    <circle cx={x} cy={y} r={10} fill={color} />
    <text x={x} y={y - 19} textAnchor="middle" fill={color} fontSize={10} fontFamily={MONO}>{label}</text>
    {bounce && raw > 0.62 && <path d={`M${to.x - 9} ${to.y - 9} L${to.x + 9} ${to.y + 9} M${to.x + 9} ${to.y - 9} L${to.x - 9} ${to.y + 9}`} stroke={colors.NEGATIVE} strokeWidth={4} strokeLinecap="round" />}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const stateU = s.get(scene.stateU);
  const dim = 1 - 0.9 * s.get(scene.dimU);
  const lensX = s.get(scene.lensX);
  const lensY = s.get(scene.lensY);
  const lensU = s.get(scene.lensU);
  const observationU = s.get(scene.observationU);

  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={50} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800}>Observation is a perspective, not a copy</text>
      <text x={640} y={76} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>MentisEngine._render_observation</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        <rect x={92} y={130} width={430} height={484} rx={24} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={2} opacity={stateU} />
        <text x={307} y={168} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={750} opacity={stateU}>omniscient WorldState</text>
        <text x={307} y={190} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={stateU}>physical_state + mental_state</text>
        {FACTS.map((fact, i) => <FactCard key={fact.label} fact={fact} u={clamp01(stateU * FACTS.length - i)} dim={lensU > 0 ? (Math.hypot(fact.x - lensX, fact.y - lensY) > 120 ? 1 : 0) : 0} />)}

        <g opacity={lensU}>
          <circle cx={lensX} cy={lensY} r={102} fill={colors.ACCENT} opacity={0.07} />
          <circle cx={lensX} cy={lensY} r={102} fill="none" stroke={colors.POSITIVE} strokeWidth={4} strokeDasharray="11 8" />
          <path d={`M${lensX + 72} ${lensY + 72} L${lensX + 128} ${lensY + 128}`} stroke={colors.POSITIVE} strokeWidth={12} strokeLinecap="round" />
          <text x={lensX} y={lensY - 118} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>target-specific lens</text>
        </g>

        <path d="M540 372 H720" stroke={colors.GRID} strokeWidth={4} strokeLinecap="round" opacity={observationU} />
        <path d="M700 354 L724 372 L700 390" fill="none" stroke={colors.GRID} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={observationU} />

        <rect x={744} y={154} width={434} height={428} rx={24} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} opacity={Math.max(observationU, s.get(scene.physicalP) * 0.35)} />
        <text x={961} y={194} textAnchor="middle" fill={colors.POSITIVE} fontSize={18} fontWeight={750} opacity={Math.max(observationU, s.get(scene.physicalP) * 0.35)}>target Observation</text>

        <g opacity={s.get(scene.physicalP)}>
          <rect x={786} y={226} width={350} height={110} rx={18} fill={colors.BG} stroke={colors.ACCENT} />
          <text x={808} y={252} fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>physical_observation</text>
          <text x={808} y={284} fill={colors.TEXT} fontSize={14}>Alice at desk · Bob in hallway</text>
          <text x={808} y={311} fill={colors.TEXT} fontSize={14}>Alice speaks · gift location unknown</text>
        </g>
        <g opacity={s.get(scene.mentalP)}>
          <rect x={786} y={380} width={350} height={110} rx={18} fill={colors.BG} stroke={colors.WARM} />
          <text x={808} y={406} fill={colors.WARM} fontSize={12} fontFamily={MONO}>mental_observation</text>
          <text x={808} y={438} fill={colors.TEXT} fontSize={14}>Bob believes the gift is in the kitchen</text>
          <text x={808} y={465} fill={colors.TEXT} fontSize={14}>Bob’s goal is to find the gift</text>
        </g>
        <g opacity={s.get(scene.keysU)} transform="translate(790 514)">
          <text fill={colors.MUTED} fontSize={11} fontFamily={MONO}>normalize_observation(observation.as_dict())</text>
        </g>

        <Transfer from={{ x: 390, y: 322 }} to={{ x: 820, y: 282 }} u={s.get(scene.physicalP)} color={colors.ACCENT} label="perceived" />
        <Transfer from={{ x: 210, y: 322 }} to={{ x: 720, y: 326 }} u={s.get(scene.hiddenBounce)} color={colors.NEGATIVE} label="hidden" bounce />
        <Transfer from={{ x: 210, y: 454 }} to={{ x: 820, y: 434 }} u={s.get(scene.mentalP)} color={colors.WARM} label="own belief" />
        <Transfer from={{ x: 390, y: 454 }} to={{ x: 720, y: 468 }} u={s.get(scene.mindReadBounce)} color={colors.NEGATIVE} label="unsupported" bounce />
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={188} y={236} width={904} height={198} rx={26} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={304} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={850}>Global state → target’s partial world</text>
      <text x={640} y={352} textAnchor="middle" fill={colors.ACCENT} fontSize={18}>what the target can perceive</text>
      <text x={640} y={388} textAnchor="middle" fill={colors.WARM} fontSize={18}>what the target can justifiably infer</text>
    </g>
  </>;
}

export const vizScene = () => scene;
