// Grounding: src/guidance/core/product-knowledge.md (explorations, journeys, credits, bug limit),
// src/lib/projectEnvironment.ts (a production environment), src/components/ProjectSettings.tsx
// (Budget / Bug limit / Design document rows), agent RecordingStrip vocabulary.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { RecordingStrip } from '../../agent';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// The app map: pages the exploration can reach. Positions are the stage layout.
const PAGES = [
  { id: 'home', label: '/', x: 250, y: 200 },
  { id: 'catalog', label: '/catalog', x: 430, y: 150 },
  { id: 'product', label: '/product/:id', x: 610, y: 210 },
  { id: 'cart', label: '/cart', x: 760, y: 320 },
  { id: 'checkout', label: '/checkout', x: 610, y: 430 },
  { id: 'account', label: '/account', x: 300, y: 380 },
  { id: 'orders', label: '/orders', x: 430, y: 480 },
  { id: 'help', label: '/help', x: 800, y: 160 },
];
const EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [1, 7], [4, 6]];
// Exploration visit order (index into PAGES) — the dot walks this.
const VISIT = [0, 1, 7, 1, 2, 3, 4, 6, 5, 0];
// The journey QA keeps: the purchase path.
const JOURNEY = [0, 1, 2, 3, 4];
const FAIL_STEP = 4; // the checkout step fails on replay

const RECORDING_POINTS = [
  { at: 0.08, kind: 'interaction' as const },
  { at: 0.26, kind: 'network' as const },
  { at: 0.44, kind: 'interaction' as const, label: 'add to cart' },
  { at: 0.66, kind: 'network' as const },
  { at: 0.8, kind: 'exception' as const, label: 'TypeError' },
  { at: 0.9, kind: 'render' as const },
];

function pathPoint(order: number[], u: number) {
  const segs = order.length - 1;
  const t = clamp01(u) * segs;
  const i = Math.min(segs - 1, Math.floor(t));
  const f = t - i;
  const a = PAGES[order[i]!]!;
  const b = PAGES[order[i + 1]!]!;
  return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), reached: i + (f > 0.98 ? 1 : 0) };
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const mapU = tl.channel('app map reveal', 0);
  const doorU = tl.channel('production door', 0);
  const exploreU = tl.channel('exploration walk', 0);
  const journeyU = tl.channel('journey solidifies', 0);
  const replayU = tl.channel('replay run', 0);
  const failU = tl.channel('checkout step fails', 0);
  const bugU = tl.channel('bug card', 0);
  const recU = tl.channel('recording playhead', 0);
  const dialsU = tl.channel('budget and bug limit dials', 0);
  const budgetSpent = tl.channel('credits spent', 0);
  const designU = tl.channel('design document', 0);
  const close = tl.channel('closing recap', 0);

  // BEAT 1 — the door: production
  tl.caption({ at: 0.4, dur: 6.4, text: 'Every Replay QA project starts the same way: point it at the app your users already touch, production, and let a browser go look.' });
  tl.tween(doorU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(mapU, 1, { at: 1.6, dur: 1.6, ease: ease.draw });

  // BEAT 2 — exploration walks the map
  tl.caption({ at: 7.2, dur: 6.4, text: 'An exploration is an agent driving your app in a real browser, discovering what it can do the way a new user would.' });
  tl.tween(cam, { x: 540, y: 330, k: 1.12 }, { at: 7.4, dur: 1.3, ease: ease.move });
  tl.tween(exploreU, 1, { at: 7.8, dur: 6.0, ease: ease.linear });
  tl.tween(budgetSpent, 1, { at: 7.8, dur: 6.0, ease: ease.linear });

  // BEAT 3 — a journey is kept
  tl.caption({ at: 14.0, dur: 6.6, text: 'Each path worth protecting becomes a journey: a recorded sequence of steps with checks, versioned so it can be run again later.' });
  tl.tween(journeyU, 1, { at: 14.4, dur: 1.4, ease: ease.draw });
  tl.hold(20.6, 0.4);

  // BEAT 4 — replay against production
  tl.caption({ at: 21.0, dur: 5.6, text: 'A test run replays those journeys against production and watches every step for anything that breaks.' });
  tl.tween(replayU, 1, { at: 21.4, dur: 4.4, ease: ease.linear });
  tl.tween(budgetSpent, 4, { at: 21.4, dur: 4.4, ease: ease.linear });

  // BEAT 5 — the failing step and the bug with a recording
  tl.caption({ at: 26.8, dur: 6.8, text: 'When a step fails, you get a bug with a recording behind it, so believing the report costs a look, not a debate.' });
  tl.tween(failU, 1, { at: 26.9, dur: 0.5, ease: ease.pop });
  tl.tween(cam, { x: 720, y: 360, k: 1.06 }, { at: 27.2, dur: 1.2, ease: ease.move });
  tl.tween(bugU, 1, { at: 28.2, dur: 0.8, ease: ease.enter });
  tl.tween(recU, 0.82, { at: 29.2, dur: 3.6, ease: ease.linear });
  tl.hold(33.6, 0.4);

  // BEAT 6 — budget and bug limit
  tl.caption({ at: 34.0, dur: 6.6, text: 'Two dials keep the loop honest: a budget of credits the project may spend, and a bug limit that stops QA from burying you.' });
  tl.tween(cam, CAMERA_HOME, { at: 34.2, dur: 1.2, ease: ease.move });
  tl.tween(dialsU, 1, { at: 34.6, dur: 0.8, ease: ease.enter });

  // BEAT 7 — design document
  tl.caption({ at: 40.8, dur: 6.6, text: 'A design document tells QA what the app is supposed to do, so a judgment about whether some behavior is a bug has something to check against.' });
  tl.tween(designU, 1, { at: 41.2, dur: 0.7, ease: ease.enter });

  // BEAT 8 — production alone is a fine start
  tl.caption({ at: 47.6, dur: 5.8, text: 'Your first environment is just production, run once or once a week. That is a fine place to start.' });
  tl.hold(53.4, 0.4);

  // BEAT 9 — recap
  tl.caption({ at: 53.8, dur: 6.2, text: 'One environment, one loop: explore, record journeys, run them again, and file bugs with evidence.' });
  tl.tween(close, 1, { at: 54.2, dur: 1.0, ease: ease.move });
  tl.hold(60.0, 1.0);

  return { tl, cam, mapU, doorU, exploreU, journeyU, replayU, failU, bugU, recU, dialsU, budgetSpent, designU, close };
}

const scene = buildScene();

const LOOP_STOPS = ['explore', 'record journeys', 'run again', 'file bugs'];

export function Render({ s }: { s: SceneState }) {
  const map = s.get(scene.mapU);
  const door = s.get(scene.doorU);
  const exploreU = s.get(scene.exploreU);
  const journey = s.get(scene.journeyU);
  const replay = s.get(scene.replayU);
  const fail = s.get(scene.failU);
  const bug = s.get(scene.bugU);
  const rec = s.get(scene.recU);
  const dials = s.get(scene.dialsU);
  const spent = s.get(scene.budgetSpent);
  const design = s.get(scene.designU);
  const close = s.get(scene.close);

  const walker = pathPoint(VISIT, exploreU);
  const visited = new Set<number>();
  VISIT.slice(0, walker.reached + 1).forEach((i) => visited.add(i));
  const replayer = pathPoint(JOURNEY, replay);
  const stageDim = 1 - close * 0.9;

  return <Camera {...s.get(scene.cam)}>
    <g opacity={stageDim}>
      <text x="640" y="64" textAnchor="middle" fill={colors.TEXT} fontSize="32" fontWeight="850">Start with production</text>

      {/* The production door */}
      <g opacity={door} transform={`translate(${lerp(-60, 0, door)} 0)`}>
        <rect x="76" y="110" width="176" height="52" rx="14" fill="#102033" stroke={colors.POSITIVE} strokeWidth="2.5" />
        <text x="164" y="132" textAnchor="middle" fill={colors.POSITIVE} fontSize="12" fontWeight="700" letterSpacing="1.5">PRODUCTION</text>
        <text x="164" y="151" textAnchor="middle" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>app.example.com</text>
      </g>

      {/* App map */}
      <g opacity={map}>
        {EDGES.map(([a, b], i) => {
          const pa = PAGES[a]!, pb = PAGES[b]!;
          const drawn = clamp01(map * EDGES.length - i * 0.6);
          const onJourney = JOURNEY.some((j, k) => k < JOURNEY.length - 1 && ((JOURNEY[k] === a && JOURNEY[k + 1] === b) || (JOURNEY[k] === b && JOURNEY[k + 1] === a)));
          return <line key={i} x1={pa.x} y1={pa.y} x2={lerp(pa.x, pb.x, drawn)} y2={lerp(pa.y, pb.y, drawn)}
            stroke={onJourney ? colors.ACCENT : colors.MUTED} strokeWidth={onJourney ? 2 + journey * 3 : 1.5}
            opacity={onJourney ? 0.35 + journey * 0.65 : 0.35} />;
        })}
        {PAGES.map((p, i) => {
          const lit = visited.has(i) ? 1 : 0;
          const onJourney = JOURNEY.includes(i);
          const failing = i === JOURNEY[FAIL_STEP] ? fail : 0;
          const stroke = failing > 0 ? colors.NEGATIVE : onJourney && journey > 0 ? colors.ACCENT : colors.MUTED;
          return <g key={p.id} opacity={clamp01(map * PAGES.length - i * 0.5)}>
            <circle cx={p.x} cy={p.y} r={22 + failing * 6} fill={lit ? '#1b2f4a' : '#0d1727'} stroke={lit && !(onJourney && journey > 0) ? colors.WARM : stroke} strokeWidth={onJourney && journey > 0 ? 3 : lit ? 2.2 : 1.6} />
            <circle cx={p.x} cy={p.y} r="6" fill={lit ? colors.WARM : '#2a3650'} opacity={0.4 + lit * 0.6} />
            <text x={p.x} y={p.y + 40} textAnchor="middle" fill={lit ? colors.TEXT : colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>{p.label}</text>
          </g>;
        })}
        {/* the exploring browser */}
        {exploreU > 0 && exploreU < 1 && <g>
          <circle cx={walker.x} cy={walker.y} r="11" fill={colors.WARM} />
          <circle cx={walker.x} cy={walker.y} r="18" fill="none" stroke={colors.WARM} strokeWidth="2" opacity="0.5" />
        </g>}
        {/* the replaying browser */}
        {replay > 0 && replay < 1 && <g>
          <circle cx={replayer.x} cy={replayer.y} r="10" fill={colors.ACCENT} />
          <circle cx={replayer.x} cy={replayer.y} r="17" fill="none" stroke={colors.ACCENT} strokeWidth="2" opacity="0.5" />
        </g>}
        {/* step badges along the kept journey */}
        {JOURNEY.map((idx, k) => {
          const p = PAGES[idx]!;
          const u = clamp01(journey * JOURNEY.length - k);
          const passed = replay * (JOURNEY.length - 1) >= k && k < FAIL_STEP ? 1 : 0;
          return <g key={k} opacity={u} transform={`translate(${p.x + 18} ${p.y - 30})`}>
            <circle r="10" fill={k === FAIL_STEP && fail > 0 ? colors.NEGATIVE : passed ? colors.POSITIVE : '#1b2a44'} stroke={colors.ACCENT} strokeWidth="1.5" />
            <text textAnchor="middle" y="4" fill={colors.TEXT} fontSize="10" fontWeight="700">{k + 1}</text>
          </g>;
        })}
      </g>

      {/* Bug card with recording */}
      <g opacity={bug} transform={`translate(0 ${(1 - bug) * 20})`}>
        <rect x="846" y="268" width="374" height="196" rx="18" fill="#1a0f18" stroke={colors.NEGATIVE} strokeWidth="2.5" />
        <text x="866" y="296" fill={colors.NEGATIVE} fontSize="11" fontWeight="700" letterSpacing="1.5">BUG · HIGH · PRODUCTION</text>
        <text x="866" y="322" fill={colors.TEXT} fontSize="15" fontWeight="700">Checkout button does nothing</text>
        <text x="866" y="342" fill={colors.MUTED} fontSize="12">Expected: order confirmation. Actual: a thrown error, no navigation.</text>
        <RecordingStrip x={866} y={362} w={334} h={28} points={RECORDING_POINTS} u={rec} title="replay recording" />
        <text x="866" y="444" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>evidence: recording · console · network</text>
      </g>

      {/* Dials: budget and bug limit */}
      <g opacity={dials}>
        <g transform="translate(900 96)">
          <text x="0" y="0" fill={colors.MUTED} fontSize="11" fontWeight="700" letterSpacing="1.5">BUDGET</text>
          <rect x="0" y="10" width="300" height="14" rx="7" fill="#1b2a44" />
          <rect x="0" y="10" width={300 * clamp01(spent / 50)} height="14" rx="7" fill={colors.WARM} />
          <text x="0" y="44" fill={colors.TEXT} fontSize="12" fontFamily={colors.font.mono}>{spent.toFixed(0)} of 50 credits spent</text>
        </g>
        <g transform="translate(900 164)">
          <text x="0" y="0" fill={colors.MUTED} fontSize="11" fontWeight="700" letterSpacing="1.5">BUG LIMIT</text>
          <rect x="0" y="10" width="300" height="14" rx="7" fill="#1b2a44" />
          <rect x="0" y="10" width={300 * (fail > 0 ? 1 / 25 : 0)} height="14" rx="7" fill={colors.NEGATIVE} />
          <text x="0" y="44" fill={colors.TEXT} fontSize="12" fontFamily={colors.font.mono}>{fail > 0 ? 1 : 0} of 25 bugs filed</text>
        </g>
      </g>

      {/* Design document */}
      <g opacity={design} transform={`translate(0 ${(1 - design) * 16})`}>
        <rect x="76" y="450" width="300" height="120" rx="16" fill="#102033" stroke={colors.SECONDARY} strokeWidth="2" />
        <text x="96" y="476" fill={colors.SECONDARY} fontSize="11" fontWeight="700" letterSpacing="1.5">DESIGN DOCUMENT</text>
        <text x="96" y="500" fill={colors.TEXT} fontSize="12">Guests can check out without an account.</text>
        <text x="96" y="520" fill={colors.TEXT} fontSize="12">Tax is shown before payment.</text>
        <text x="96" y="540" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>read when judging: is this a bug?</text>
      </g>
    </g>

    {/* Closing recap: the loop */}
    <g opacity={close}>
      <rect x="180" y="100" width="920" height="490" rx="40" fill="#0a0e1a" stroke={colors.ACCENT} strokeWidth="3" />
      <text x="640" y="162" textAnchor="middle" fill={colors.TEXT} fontSize="36" fontWeight="850">one environment, one loop</text>
      <circle cx="640" cy="400" r="120" fill="none" stroke={colors.GRID} strokeWidth="2" />
      {LOOP_STOPS.map((label, i) => {
        const a = -Math.PI / 2 + (i / LOOP_STOPS.length) * Math.PI * 2;
        const x = 640 + Math.cos(a) * 120, y = 400 + Math.sin(a) * 120;
        const u = clamp01(close * 4 - i * 0.7);
        const c = [colors.WARM, colors.ACCENT, colors.POSITIVE, colors.NEGATIVE][i]!;
        const lx = i === 1 ? x + 46 : i === 3 ? x - 46 : x;
        const ly = i === 0 ? y - 44 : i === 2 ? y + 56 : y + 6;
        const anchor = i === 1 ? 'start' : i === 3 ? 'end' : 'middle';
        return <g key={label} opacity={u}>
          <circle cx={x} cy={y} r="28" fill="#13233a" stroke={c} strokeWidth="3" />
          <text x={lx} y={ly} textAnchor={anchor} fill={colors.TEXT} fontSize="17" fontWeight="600">{label}</text>
        </g>;
      })}
      <text x="640" y="406" textAnchor="middle" fill={colors.POSITIVE} fontSize="15" fontFamily={colors.font.mono}>production · weekly</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
