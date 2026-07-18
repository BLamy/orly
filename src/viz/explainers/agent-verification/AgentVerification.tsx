// Explained: Agents — chapter 5, the series capstone: verifying agent work.
// The epistemic asymmetry made quantitative, with the arithmetic run for
// real at module scope: 5,000 seeded tasks with a 60% true success rate,
// every one of which the agent CLAIMS succeeded. Accepting claims: 60%
// precision by construction. An adversarial critic that demands evidence —
// catches 90% of failures, false-flags 2% of successes — lifts accepted-claim
// precision to 93.6% by Bayes (measured 93.3%: 2,938 true accepts, 210 false).
// Closes the shelf's thesis and points at its implementations: the books
// wasm-vm-loop, electric-forest-loop, and the-progress-judge.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The verification arithmetic, module scope.
// ---------------------------------------------------------------------------

const BASE = 0.6; // true success rate
const CATCH = 0.9; // critic catches this share of failures
const FALSE_FLAG = 0.02; // critic wrongly rejects this share of successes

// Bayes: precision of an accepted claim under the critic
const BAYES_PREC =
  (BASE * (1 - FALSE_FLAG)) / (BASE * (1 - FALSE_FLAG) + (1 - BASE) * (1 - CATCH)); // 0.9364

// the seeded population
const N_TASKS = 5000;
const rand = mulberry32(9);
let TP = 0; // true successes accepted
let FP = 0; // failures that slipped past the critic
interface Dot { good: boolean; accepted: boolean }
const DOTS: Dot[] = [];
for (let i = 0; i < N_TASKS; i++) {
  const good = rand() < BASE;
  let accepted: boolean;
  if (good) {
    accepted = rand() >= FALSE_FLAG;
    if (accepted) TP++;
  } else {
    accepted = rand() >= CATCH;
    if (accepted) FP++;
  }
  if (DOTS.length < 220) DOTS.push({ good, accepted });
}
const MEASURED_PREC = TP / (TP + FP); // 0.933
const GOOD_SHOWN = DOTS.filter((d) => d.good).length;

// dot layout: queue (left) → verdict bins (right), position pure in u
const DOT_COLS = 11;
const dotQueue = (i: number) => ({
  x: 200 + (i % DOT_COLS) * 17,
  y: 190 + Math.floor(i / DOT_COLS) * 17,
});
let accSeen = 0;
let rejSeen = 0;
const DOT_TARGETS = DOTS.map((d) => {
  if (d.accepted) {
    const k = accSeen++;
    return { x: 830 + (k % 12) * 15, y: 180 + Math.floor(k / 12) * 15 };
  }
  const k = rejSeen++;
  return { x: 830 + (k % 12) * 15, y: 470 + Math.floor(k / 12) * 15 };
});

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const GATE_X = 620;
const CAM_DOTS: CameraState = { x: 620, y: 360, k: 1.15 };

const SHELF_BOOKS = [
  { slug: 'wasm-vm-loop', note: 'a critic replays the VM' },
  { slug: 'electric-forest-loop', note: 'an adversarial test gauntlet' },
  { slug: 'the-progress-judge', note: 'a judge scores every claim' },
];

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  asymU: ChannelRef<number>; // the two-claims panel
  queueU: ChannelRef<number>; // dots appear
  naiveU: ChannelRef<number>; // naive acceptance note
  gateU: ChannelRef<number>; // critic gate
  flowU: ChannelRef<number>; // dots travel through the gate
  statU: ChannelRef<number>;
  evidU: ChannelRef<number>; // what evidence means
  shelfU: ChannelRef<number>; // the three loop books
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
  recapU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const asymU = tl.channel('asymU', 0);
  const queueU = tl.channel('queueU', 0);
  const naiveU = tl.channel('naiveU', 0);
  const gateU = tl.channel('gateU', 0);
  const flowU = tl.channel('flowU', 0);
  const statU = tl.channel('statU', 0);
  const evidU = tl.channel('evidU', 0);
  const shelfU = tl.channel('shelfU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);
  const recapU = tl.channel('recapU', 0);

  // Beat 1 — the asymmetry, stated
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'One idea has been under every book on this shelf, and it is time to say it plainly. When an agent says something is broken, believing it costs almost nothing — worst case, you look and it is fine.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(asymU, 1, { at: 1.6, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 6.9,
    dur: 5.4,
    text: 'When an agent says it succeeded, believing it is the expensive claim. You ship on it. It works, it is fixed, the run is green — those sentences need evidence behind them, in proportion to what they cost you if false.',
  });
  tl.hold(12.3, 0.6);

  // Beat 2 — the population of claims
  tl.caption({
    at: 12.9,
    dur: 5.8,
    text: 'Make it quantitative. Five thousand tasks, and the agent claims success on every single one. Unknown to it, sixty percent genuinely succeeded. Take the claims at face value and your precision is exactly that base rate — sixty percent.',
  });
  tl.tween(cam, CAM_DOTS, { at: 13.2, dur: 1.4, ease: ease.move });
  tl.tween(queueU, 1, { at: 14.0, dur: 2.6, ease: ease.linear });
  tl.tween(naiveU, 1, { at: 16.8, dur: 0.9, ease: ease.enter });
  tl.hold(18.9, 0.5);

  // Beat 3 — the critic gate
  tl.caption({
    at: 19.4,
    dur: 6.0,
    text: 'Now install an adversarial critic: a checker that does not read the agent’s summary, but interrogates the evidence — and rejects any claim the evidence cannot carry. Say it catches ninety percent of false claims and wrongly flags two percent of true ones.',
  });
  tl.tween(gateU, 1, { at: 20.4, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 25.6,
    dur: 5.6,
    text: 'Run the whole population through. Every dot is one task from the seeded simulation — green genuinely succeeded, red is a false claim. Watch where the critic sends them.',
  });
  tl.tween(flowU, 1, { at: 26.4, dur: 5.0, ease: ease.linear });
  tl.caption({
    at: 31.6,
    dur: 5.6,
    text: 'The accepted pile is now almost clean: measured precision ninety three point three percent, against ninety three point six from the arithmetic. A few red dots slip through — verification narrows doubt, it never deletes it.',
  });
  tl.tween(statU, 1, { at: 32.8, dur: 0.9, ease: ease.enter });
  tl.hold(37.2, 0.6);

  // Beat 4 — what counts as evidence
  tl.caption({
    at: 37.8,
    dur: 6.0,
    text: 'What makes a critic strong is what it demands: not prose, but artifacts. A recording of the run that can be replayed. Outputs diffed against ground truth. A test the agent did not write grading the work. Evidence the agent cannot fake by being fluent.',
  });
  tl.tween(evidU, 1, { at: 38.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 44.2,
    dur: 5.8,
    text: 'This shelf builds exactly those machines. The wasm virtual machine loop replays every claimed fix. The electric forest loop runs an adversarial gauntlet. The progress judge scores each iteration’s claim of progress. Same thesis, three implementations.',
  });
  tl.tween(shelfU, 1, { at: 45.4, dur: 1.2, ease: ease.enter });
  tl.hold(50.0, 0.6);

  // Beat 5 — the series closes
  tl.caption({
    at: 50.6,
    dur: 6.0,
    text: 'And that closes the arc. Twenty seven books ago a model learned to predict the next token. It learned attention, training, retrieval, alignment, evaluation, inference — and finally, here, to act.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.8, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 51.6, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 1, { at: 52.6, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 57.0,
    dur: 6.2,
    text: 'An actor’s word is a prediction like any other. So the last lesson of the series is the first rule of working with agents: cheap belief for bad news, expensive belief for good news — and a machine, not a mood, deciding which is which.',
  });
  tl.tween(closeU, 1, { at: 58.2, dur: 0.9, ease: ease.enter });
  tl.hold(63.2, 1.4);

  return { tl, cam, titleU, asymU, queueU, naiveU, gateU, flowU, statU, evidU, shelfU, dimU, closeU, recapU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/agent-verification/overrides.json',
  slug: 'agent-verification',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const asymU = s.get(scene.asymU);
  const queueU = s.get(scene.queueU);
  const naiveU = s.get(scene.naiveU);
  const gateU = s.get(scene.gateU);
  const flowU = s.get(scene.flowU);
  const statU = s.get(scene.statU);
  const evidU = s.get(scene.evidU);
  const shelfU = s.get(scene.shelfU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);
  const recapU = s.get(scene.recapU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the asymmetry panel */}
          {asymU > 0 && (
            <g opacity={asymU * (1 - 0.85 * clamp01(queueU * 3))}>
              <rect x={220} y={160} width={380} height={110} rx={10} fill={colors.PANEL} opacity={0.9} stroke={colors.POSITIVE} />
              <text x={244} y={196} fill={colors.POSITIVE} fontSize={16} fontWeight={600}>
                “it is broken”
              </text>
              <text x={244} y={222} fill={colors.MUTED} fontSize={13}>
                cheap to believe — worst case, you look
              </text>
              <rect x={680} y={160} width={380} height={110} rx={10} fill={colors.PANEL} opacity={0.9} stroke={colors.NEGATIVE} />
              <text x={704} y={196} fill={colors.NEGATIVE} fontSize={16} fontWeight={600}>
                “it works, ship it”
              </text>
              <text x={704} y={222} fill={colors.MUTED} fontSize={13}>
                expensive to believe — you act on it
              </text>
            </g>
          )}

          {/* the claim population and gate */}
          {queueU > 0 && (
            <g>
              <text x={200} y={160} fill={colors.TEXT} fontSize={15}>
                {N_TASKS.toLocaleString()} tasks, {N_TASKS.toLocaleString()} success claims
              </text>
              <text x={200} y={182} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                showing {DOTS.length} · {GOOD_SHOWN} genuinely good
              </text>
              {DOTS.map((d, i) => {
                const appear = clamp01(queueU * DOTS.length - i);
                if (appear <= 0) return null;
                const q = dotQueue(i);
                const t = DOT_TARGETS[i];
                // each dot departs on its own slice of flowU
                const u = clamp01(flowU * (DOTS.length + 30) - i) ;
                const x = lerp(q.x, t.x, u);
                const yy = lerp(q.y, t.y, u);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={yy}
                    r={5}
                    fill={d.good ? colors.POSITIVE : colors.NEGATIVE}
                    opacity={appear * 0.85}
                  />
                );
              })}
              {naiveU > 0 && flowU < 0.05 && (
                <text x={200} y={560} fill={colors.WARM} fontSize={14} fontFamily="monospace" fontWeight={700} opacity={naiveU}>
                  believe every claim → precision {(BASE * 100).toFixed(0)}%
                </text>
              )}
              {/* the critic gate */}
              {gateU > 0 && (
                <g opacity={gateU}>
                  <line x1={GATE_X} x2={GATE_X} y1={150} y2={620} stroke={colors.SECONDARY} strokeWidth={3} strokeDasharray="8 6" />
                  <rect x={GATE_X - 74} y={340} width={148} height={54} rx={10} fill={colors.SECONDARY} opacity={0.92} />
                  <text x={GATE_X} y={362} textAnchor="middle" fill={colors.BG} fontSize={14} fontWeight={700}>
                    the critic
                  </text>
                  <text x={GATE_X} y={382} textAnchor="middle" fill={colors.BG} fontSize={11} fontFamily="monospace">
                    show me the evidence
                  </text>
                </g>
              )}
              {/* bins */}
              {gateU > 0 && (
                <g opacity={gateU}>
                  <text x={830} y={160} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                    accepted
                  </text>
                  <text x={830} y={450} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                    rejected — go look
                  </text>
                </g>
              )}
              {statU > 0 && (
                <g opacity={statU}>
                  <text x={200} y={560} fill={colors.WARM} fontSize={14} fontFamily="monospace" fontWeight={700}>
                    accepted-claim precision: {(MEASURED_PREC * 100).toFixed(1)}% measured · {(BAYES_PREC * 100).toFixed(1)}% by Bayes
                  </text>
                  <text x={200} y={584} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                    {TP.toLocaleString()} true accepts · {FP.toLocaleString()} slipped through · critic: 90% catch, 2% false flag
                  </text>
                </g>
              )}
            </g>
          )}

          {/* evidence kinds */}
          {evidU > 0 && (
            <g opacity={evidU * (1 - 0.7 * shelfU)}>
              <text x={200} y={618} fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
                evidence = recordings · diffs vs ground truth · tests the agent did not write
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* the shelf bridge — screen space */}
      {shelfU > 0 && (
        <g opacity={shelfU * mainOp}>
          {SHELF_BOOKS.map((b, i) => (
            <g key={b.slug}>
              <rect x={80 + i * 390} y={92} width={360} height={54} rx={9} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
              <text x={100 + i * 390} y={116} fill={colors.ACCENT} fontSize={13} fontFamily="monospace" fontWeight={700}>
                {b.slug}
              </text>
              <text x={100 + i * 390} y={136} fill={colors.MUTED} fontSize={12}>
                {b.note}
              </text>
            </g>
          ))}
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The expensive claim
        </text>
      </g>
      <MathLabel
        tex="P(\text{good}\mid\text{accepted}) = \frac{0.6 \times 0.98}{0.6 \times 0.98 + 0.4 \times 0.1}"
        x={800}
        y={54}
        fontSize={17}
        color={colors.SECONDARY}
        opacity={statU * mainOp}
      />

      {/* series recap + close */}
      {recapU > 0 && (
        <g opacity={recapU}>
          <rect x={160} y={190} width={960} height={280} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={244} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            The Explainers — the arc, closed.
          </text>
          <text x={640} y={288} textAnchor="middle" fill={colors.MUTED} fontSize={15.5}>
            predict → attend → train → ground → align → evaluate → serve → act
          </text>
          {closeU > 0 && (
            <g opacity={closeU}>
              <text x={640} y={344} textAnchor="middle" fill={colors.WARM} fontSize={18} fontWeight={600}>
                Cheap belief for bad news. Expensive belief for good news.
              </text>
              <text x={640} y={378} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                60% → 93% precision, bought with a critic that reads evidence, not prose —
              </text>
              <text x={640} y={402} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                and a machine, not a mood, deciding what to believe.
              </text>
            </g>
          )}
        </g>
      )}
    </>
  );
}

export function AgentVerification() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
