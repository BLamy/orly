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

type Pt = { x: number; y: number };
type Fact = { label: string; kind: 'physical' | 'mental'; visible: boolean; x: number; y: number };

// Two columns of cards with a clear gutter; rows leave gaps for the transfer routes.
const FACTS: Fact[] = [
  { label: 'Alice at desk', kind: 'physical', visible: true, x: 200, y: 226 },
  { label: 'Bob in hallway', kind: 'physical', visible: true, x: 400, y: 226 },
  { label: 'gift in closet', kind: 'physical', visible: false, x: 200, y: 322 },
  { label: 'Alice speaks', kind: 'physical', visible: true, x: 400, y: 322 },
  { label: 'Bob believes: kitchen', kind: 'mental', visible: true, x: 200, y: 454 },
  { label: 'Alice intends: redirect', kind: 'mental', visible: false, x: 400, y: 454 },
  { label: 'Bob goal: find gift', kind: 'mental', visible: true, x: 200, y: 550 },
  { label: 'Alice knows: closet', kind: 'mental', visible: false, x: 400, y: 550 },
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
  tl.tween(lensX, 400, { at: 9.0, dur: 1.3, ease: ease.move });
  tl.tween(lensY, 322, { at: 9.0, dur: 1.3, ease: ease.move });
  tl.hold(13.4, 0.7);

  tl.caption({ at: 14.1, dur: 6.1, text: 'Visible people, audible speech, and reachable objects pass into the physical observation.' });
  tl.tween(physicalP, 1, { at: 14.6, dur: 3.4, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 360, k: 1.03 }, { at: 15.2, dur: 1.3, ease: ease.move });
  tl.hold(20.2, 0.7);

  tl.caption({ at: 20.9, dur: 5.9, text: 'The hidden gift location stops at the boundary because the target cannot see it.' });
  tl.tween(hiddenBounce, 1, { at: 21.4, dur: 1.7, ease: ease.move });
  tl.tween(lensX, 200, { at: 21.5, dur: 1.3, ease: ease.move });
  tl.tween(lensY, 322, { at: 21.5, dur: 1.3, ease: ease.move });
  tl.hold(26.8, 0.7);

  tl.caption({ at: 27.5, dur: 6.1, text: 'The target’s own belief and goal pass through the mental side of the same observation.' });
  tl.tween(mentalP, 1, { at: 28.0, dur: 3.2, ease: ease.linear });
  tl.tween(lensX, 200, { at: 28.1, dur: 1.3, ease: ease.move });
  tl.tween(lensY, 500, { at: 28.1, dur: 1.3, ease: ease.move });
  tl.hold(33.6, 0.7);

  tl.caption({ at: 34.3, dur: 6.2, text: 'Another person’s private intention stays behind unless behavior, speech, gaze, or expression supports the inference.' });
  tl.tween(mindReadBounce, 1, { at: 34.8, dur: 1.8, ease: ease.move });
  tl.tween(lensX, 400, { at: 34.9, dur: 1.3, ease: ease.move });
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
  return <g opacity={u * (1 - dim * 0.55)} transform={`translate(${fact.x} ${fact.y}) scale(${0.82 + u * 0.18})`}>
    <rect x={-92} y={-32} width={184} height={64} rx={15} fill={colors.PANEL} stroke={color} strokeWidth={2} />
    <text y={5} textAnchor="middle" fill={colors.TEXT} fontSize={14}>{fact.label}</text>
    <circle cx={-78} cy={-16} r={5} fill={fact.visible ? colors.POSITIVE : colors.NEGATIVE} />
  </g>;
}

// Point at arc-length fraction t along a polyline, so a dot never leaves its route.
function alongRoute(route: Pt[], t: number): Pt {
  const total = route.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - route[i].x, p.y - route[i].y), 0);
  let d = clamp01(t) * total;
  for (let i = 1; i < route.length; i++) {
    const seg = Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y);
    if (d <= seg || i === route.length - 1) {
      const u = seg === 0 ? 0 : Math.min(1, d / seg);
      return { x: lerp(route[i - 1].x, route[i].x, u), y: lerp(route[i - 1].y, route[i].y, u) };
    }
    d -= seg;
  }
  return route[route.length - 1];
}

function Transfer({ route, labelAt, u, color, label, bounce = false }: { route: Pt[]; labelAt: Pt; u: number; color: string; label: string; bounce?: boolean }) {
  const raw = clamp01(u);
  if (raw <= 0.002) return null;
  const travel = bounce ? (raw < 0.55 ? raw / 0.55 : 1 - ((raw - 0.55) / 0.45) * 0.38) : raw;
  const p = alongRoute(route, travel);
  const end = route[route.length - 1];
  const d = route.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x} ${q.y}`).join(' ');
  return <g>
    <path d={d} fill="none" stroke={color} strokeWidth={2} strokeDasharray="6 7" strokeLinejoin="round" opacity={0.45} />
    <circle cx={p.x} cy={p.y} r={9} fill={color} />
    <text x={labelAt.x} y={labelAt.y} textAnchor="middle" fill={color} fontSize={14} fontFamily={MONO} opacity={Math.min(1, raw * 4)}>{label}</text>
    {bounce && raw > 0.62 && <path d={`M${end.x - 9} ${end.y - 9} L${end.x + 9} ${end.y + 9} M${end.x + 9} ${end.y - 9} L${end.x - 9} ${end.y + 9}`} stroke={colors.NEGATIVE} strokeWidth={4} strokeLinecap="round" />}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const stateU = s.get(scene.stateU);
  const dim = 1 - 0.9 * s.get(scene.dimU);
  const lensX = s.get(scene.lensX);
  const lensY = s.get(scene.lensY);
  const lensU = s.get(scene.lensU);
  const observationU = s.get(scene.observationU);
  const physicalP = s.get(scene.physicalP);
  const mentalP = s.get(scene.mentalP);

  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={50} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800}>Observation is a perspective, not a copy</text>
      <text x={640} y={76} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>MentisEngine._render_observation</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        <rect x={92} y={130} width={430} height={484} rx={24} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={2} opacity={stateU} />
        <text x={307} y={142} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO} opacity={lensU}>target-specific lens</text>
        <text x={307} y={168} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={750} opacity={stateU}>omniscient WorldState</text>
        <text x={307} y={186} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={stateU}>physical_state + mental_state</text>

        {/* The lens sits behind the cards so its ring never cuts through a label. */}
        <g opacity={lensU}>
          <circle cx={lensX} cy={lensY} r={102} fill={colors.ACCENT} opacity={0.07} />
          <circle cx={lensX} cy={lensY} r={102} fill="none" stroke={colors.POSITIVE} strokeWidth={4} strokeDasharray="11 8" />
          <path d={`M${lensX + 72} ${lensY + 72} L${lensX + 128} ${lensY + 128}`} stroke={colors.POSITIVE} strokeWidth={12} strokeLinecap="round" />
        </g>
        {FACTS.map((fact, i) => <FactCard key={fact.label} fact={fact} u={clamp01(stateU * FACTS.length - i)} dim={lensU > 0 ? (Math.hypot(fact.x - lensX, fact.y - lensY) > 120 ? 1 : 0) : 0} />)}

        <path d="M540 372 H720" stroke={colors.GRID} strokeWidth={4} strokeLinecap="round" opacity={observationU} />
        <path d="M700 354 L724 372 L700 390" fill="none" stroke={colors.GRID} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={observationU} />

        {/* Key to the state panel, shown while the world is the only thing on screen. */}
        <g opacity={stateU * clamp01(1 - physicalP * 3)}>
          <rect x={744} y={154} width={164} height={150} rx={24} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={2} />
          <text x={762} y={190} fill={colors.TEXT} fontSize={18} fontWeight={750}>key</text>
          <rect x={762} y={210} width={14} height={14} rx={3} fill={colors.ACCENT} />
          <text x={786} y={222} fill={colors.TEXT} fontSize={14}>physical fact</text>
          <rect x={762} y={236} width={14} height={14} rx={3} fill={colors.WARM} />
          <text x={786} y={248} fill={colors.TEXT} fontSize={14}>mental variable</text>
          <circle cx={769} cy={262} r={5} fill={colors.POSITIVE} />
          <text x={786} y={267} fill={colors.TEXT} fontSize={14}>visible to target</text>
          <circle cx={769} cy={288} r={5} fill={colors.NEGATIVE} />
          <text x={786} y={293} fill={colors.TEXT} fontSize={14}>hidden</text>
        </g>

        <rect x={744} y={154} width={434} height={428} rx={24} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} opacity={Math.max(observationU, physicalP * 0.35)} />
        <text x={961} y={194} textAnchor="middle" fill={colors.POSITIVE} fontSize={18} fontWeight={750} opacity={Math.max(observationU, physicalP * 0.35)}>target Observation</text>

        <g opacity={physicalP}>
          <rect x={786} y={226} width={350} height={110} rx={18} fill={colors.BG} stroke={colors.ACCENT} />
          <text x={808} y={252} fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>physical_observation</text>
          <text x={808} y={284} fill={colors.TEXT} fontSize={14}>Alice at desk · Bob in hallway</text>
          <text x={808} y={311} fill={colors.TEXT} fontSize={14}>Alice speaks · gift location unknown</text>
        </g>
        <g opacity={mentalP}>
          <rect x={786} y={380} width={350} height={110} rx={18} fill={colors.BG} stroke={colors.WARM} />
          <text x={808} y={406} fill={colors.WARM} fontSize={12} fontFamily={MONO}>mental_observation</text>
          <text x={808} y={438} fill={colors.TEXT} fontSize={14}>Bob believes the gift is in the kitchen</text>
          <text x={808} y={465} fill={colors.TEXT} fontSize={14}>Bob’s goal is to find the gift</text>
        </g>
        <g opacity={s.get(scene.keysU)} transform="translate(790 514)">
          <text fill={colors.MUTED} fontSize={12} fontFamily={MONO}>normalize_observation(observation.as_dict())</text>
        </g>

        {/* Routes run through the gaps between card rows, so no dot or dashed line crosses a card. */}
        <Transfer route={[{ x: 492, y: 322 }, { x: 540, y: 322 }, { x: 728, y: 282 }]} labelAt={{ x: 640, y: 284 }} u={physicalP} color={colors.ACCENT} label="perceived" />
        <Transfer route={[{ x: 200, y: 354 }, { x: 200, y: 388 }, { x: 512, y: 388 }]} labelAt={{ x: 250, y: 374 }} u={s.get(scene.hiddenBounce)} color={colors.NEGATIVE} label="hidden" bounce />
        <Transfer route={[{ x: 200, y: 486 }, { x: 200, y: 502 }, { x: 500, y: 502 }, { x: 728, y: 468 }]} labelAt={{ x: 620, y: 478 }} u={mentalP} color={colors.WARM} label="own belief" />
        <Transfer route={[{ x: 492, y: 454 }, { x: 540, y: 454 }, { x: 728, y: 420 }]} labelAt={{ x: 640, y: 404 }} u={s.get(scene.mindReadBounce)} color={colors.NEGATIVE} label="unsupported" bounce />
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
