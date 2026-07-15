// Book scene — replay-qa, chapter 1: "The Claim Problem".
// One coherent stage: an agent's bare claim gets stamped CLAIM; then the real
// machine dispatches a run — a tasks row lands in the queue, a warm-pool
// container is stolen and bound to proj-acme-store (single-project invariant),
// claimNextTask hands over the journey, and the agent drives the Acme store
// checkout while a recording strip grows beneath the browser. The payment POST
// comes back 500 — and the moment is already on tape.
// Backing files (replayio/loop-qa): docs/architecture.md,
// docs/backend/tasks-and-containers.md (warm pool, stealPoolContainer,
// claimNextTask, triggerSpawnForProject, single-project invariant),
// netlify/functions/container-task-webhook.ts, scripts/seed-db.ts
// (proj-acme-store, run-001, bug-002 "Checkout fails with 500 error on
// payment submission" and its reproduction steps).
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, RequestFlow, ServiceNode, Zone } from '../../primitives';
import { MessageCard, RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage is 1280×720; captions own the bottom ~12% (y ≳ 630). */
const CLAIM_CARD = { x: 380, y: 150, w: 520 };
const POOL = { x: 60, y: 84, w: 330, h: 150 };
const POOL_SLOTS = [
  { x: 128, y: 168 },
  { x: 225, y: 168 },
  { x: 322, y: 168 },
];
const QUEUE = { x: 172, y: 316 };
const WEBHOOK = { x: 172, y: 452 };
const PROJ = { x: 440, y: 84, w: 780, h: 344 };
const WORKER = { x: 560, y: 210 };
const BROWSER = { x: 690, y: 116, w: 500, h: 276 };
const STEPS_PANEL = { x: 468, y: 286, w: 190 };
const STRIP = { x: 80, y: 532, w: 1120, h: 26 };
const REC_CHIP = { x: 1024, y: 496 };

/* ------------------------------------------------------------------ data */
const CLAIM_TEXT = 'I tested the app. Checkout is broken — trust me.';

/** bug-002's real reproduction steps (scripts/seed-db.ts). */
const JOURNEY_STEPS = [
  'Add item to cart',
  'Go to checkout',
  'Fill payment details',
  'Click Submit Payment',
];

/** The run's tape: what the browser actually did, as recording points. */
const POINTS: RecordingPoint[] = [
  { at: 0.06, kind: 'interaction', label: 'load store' },
  { at: 0.17, kind: 'render' },
  { at: 0.28, kind: 'interaction', label: 'add to cart' },
  { at: 0.38, kind: 'network' },
  { at: 0.5, kind: 'interaction', label: 'checkout' },
  { at: 0.6, kind: 'render' },
  { at: 0.72, kind: 'interaction', label: 'type card #' },
  { at: 0.84, kind: 'interaction', label: 'submit' },
  { at: 0.91, kind: 'network', label: 'POST' },
  { at: 0.97, kind: 'exception', label: '500' },
];

const RECORDING_ID = 'b5f2a3c1-7d4e';

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  // beat 1 — the bare claim
  const claimE = tl.channel('claimEnter', 0);
  const claimT = tl.channel('claimText', 0);
  const stampU = tl.channel('claimStamp', 0);
  const gClaim = tl.channel('claimFade', 1);

  // beats 2–5 — the dispatch machine
  const poolZ = tl.channel('poolZone', 0);
  const projZ = tl.channel('projZone', 0);
  const poolU = tl.channel('poolContainers', 0);
  const queueE = tl.channel('queueEnter', 0);
  const taskPop = tl.channel('taskRowPop', 0);
  const stealU = tl.channel('stealMove', 0);
  const webhookE = tl.channel('webhookEnter', 0);
  const queueConnU = tl.channel('queueConn', 0);
  const pollU = tl.channel('pollFlow', 0);
  const gMachine = tl.channel('machineFade', 1);

  // beats 6–8 — the run + the tape
  const browserE = tl.channel('browserEnter', 0);
  const stepsU = tl.channel('journeySteps', 0); // 0..4, checkmarks
  const stripR = tl.channel('stripReveal', 0); // the tape GROWS as it records
  const failU = tl.channel('fail500', 0);
  const recChip = tl.channel('recChipPop', 0);
  const gBrowser = tl.channel('browserFade', 1);

  /* ---- beat 1: a sentence, with nothing behind it ---------------------- */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'An AI agent tells you the checkout is broken. Do you believe it? On its own, that sentence is a claim — exactly as trustworthy as the thing that said it.',
  });
  tl.tween(claimE, 1, { at: t - 5.8, dur: 0.6, ease: ease.enter });
  tl.tween(claimT, 1, { at: t - 5.4, dur: 1.6, ease: ease.linear });
  tl.tween(stampU, 1, { at: t - 3.2, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.7);

  /* ---- beat 2: the machine that refuses bare claims -------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Replay QA is built on a refusal: no finding leaves this system as just a sentence. Here is the machine — starting where a test run is born.',
  });
  tl.tween(gClaim, 0, { at: t - 5.6, dur: 0.7, ease: ease.move });
  tl.tween(poolZ, 1, { at: t - 4.6, dur: 1.0, ease: ease.draw });
  tl.tween(projZ, 1, { at: t - 4.2, dur: 1.0, ease: ease.draw });
  tl.tween(poolU, 1, { at: t - 3.2, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* ---- beat 3: a task row lands in the queue --------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Someone queues a run for the Acme store project. A task row lands in the queue, and creating work always triggers a container spawn for that project.',
  });
  tl.tween(queueE, 1, { at: t - 5.2, dur: 0.6, ease: ease.enter });
  tl.tween(taskPop, 1, { at: t - 4.2, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* ---- beat 4: steal a warm container, bind it for life ---------------- */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'A warm container is stolen from the pool and bound to this project for life. Containers never serve two projects — one tenant’s leftover recordings must never leak into another’s bugs.',
  });
  tl.tween(stealU, 1, { at: t - 5.6, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0.6);

  /* ---- beat 5: the container claims its task --------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The container polls the task webhook, and claim-next-task hands it this project’s next queued run: walk the store’s checkout journey.',
  });
  tl.tween(webhookE, 1, { at: t - 5.4, dur: 0.6, ease: ease.enter });
  tl.tween(queueConnU, 1, { at: t - 4.8, dur: 0.8, ease: ease.draw });
  tl.tween(pollU, 1, { at: t - 4.0, dur: 3.2, ease: ease.linear });
  t = tl.hold(t, 0.6);

  /* ---- beat 6: the agent drives a real browser ------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Inside, the agent drives a real browser: add an item to the cart, go to checkout, fill in the payment details.',
  });
  tl.tween(gMachine, 0, { at: t - 5.4, dur: 0.7, ease: ease.move });
  tl.tween(browserE, 1, { at: t - 4.8, dur: 0.7, ease: ease.enter });
  tl.tween(stepsU, 3, { at: t - 3.8, dur: 3.4, ease: ease.linear });
  tl.tween(stripR, 0.55, { at: t - 3.8, dur: 3.6, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* ---- beat 7: the tape, growing under everything ---------------------- */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'And notice the tape. Everything the browser does — every click, every request, every render — is being recorded as it happens.',
  });
  tl.tween(stripR, 0.78, { at: t - 5.2, dur: 4.6, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* ---- beat 8: submit payment → 500 ------------------------------------ */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Step four: submit payment. The request goes out... and comes back a five hundred. Internal server error. The order never happened.',
  });
  tl.tween(stepsU, 4, { at: t - 5.6, dur: 0.8, ease: ease.move });
  tl.tween(stripR, 1, { at: t - 5.0, dur: 2.2, ease: ease.linear });
  tl.tween(failU, 1, { at: t - 2.9, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.7);

  /* ---- beat 9: the moment is already on tape ---------------------------- */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'In most QA setups, this is where you’d get the sentence: checkout is broken, trust me. Here, the moment is already on the tape — and the tape outlives the agent.',
  });
  tl.tween(recChip, 1, { at: t - 2.8, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* ---- beat 10: close — the recording is the spine ---------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'This is now test run one of the Acme store, and its recording is the spine of everything that follows. Next: how that tape gets made.',
  });
  tl.tween(gBrowser, 0.15, { at: t - 5.4, dur: 0.8, ease: ease.move });
  tl.hold(t, 1.2);

  return {
    tl,
    claimE, claimT, stampU, gClaim,
    poolZ, projZ, poolU, queueE, taskPop, stealU, webhookE, queueConnU, pollU, gMachine,
    browserE, stepsU, stripR, failU, recChip, gBrowser,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The CLAIM stamp — a sentence with nothing behind it. */
function ClaimStamp({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g
      transform={`translate(${CLAIM_CARD.x + CLAIM_CARD.w / 2}, ${CLAIM_CARD.y + 46}) rotate(-9) scale(${0.7 + 0.3 * uu})`}
      opacity={uu}
    >
      <rect x={-92} y={-22} width={184} height={44} rx={7} fill={colors.BG} opacity={0.5} />
      <rect x={-92} y={-22} width={184} height={44} rx={7} fill="none" stroke={colors.WARM} strokeWidth={3.5} />
      <text y={7} textAnchor="middle" fill={colors.WARM} fontSize={20} fontWeight={800} letterSpacing={3} fontFamily={mono}>
        CLAIM
      </text>
    </g>
  );
}

/** The Acme store checkout page the agent is driving. */
function AcmeBrowser({ enter, steps, fail }: { enter: number; steps: number; fail: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const f = clamp01(fail);
  const { x, y, w, h } = BROWSER;
  const cartIn = clamp01(steps); // step 1 done → item row
  const payIn = clamp01(steps - 2); // step 3 done → card row
  const submitted = clamp01(steps - 3);
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {/* URL bar */}
      <rect x={14} y={12} width={w - 28} height={28} rx={14} fill={colors.BG} opacity={0.6} />
      <circle cx={30} cy={26} r={4} fill={colors.MUTED} opacity={0.7} />
      <text x={46} y={31} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
        acme-store.example.com/checkout
      </text>
      <text x={22} y={74} fill={colors.TEXT} fontSize={16} fontWeight={700}>
        Checkout
      </text>
      <g opacity={cartIn}>
        <text x={22} y={106} fill={colors.MUTED} fontSize={13.5}>
          1 × Laptop
        </text>
        <text x={w - 22} y={106} textAnchor="end" fill={colors.TEXT} fontSize={13.5} fontFamily={mono}>
          $1,299.00
        </text>
      </g>
      <g opacity={payIn}>
        <text x={22} y={136} fill={colors.MUTED} fontSize={13.5}>
          card
        </text>
        <text x={w - 22} y={136} textAnchor="end" fill={colors.TEXT} fontSize={13.5} fontFamily={mono}>
          •••• •••• •••• 4242
        </text>
      </g>
      <line x1={22} y1={156} x2={w - 22} y2={156} stroke={colors.GRID} strokeWidth={1.5} />
      {/* Submit Payment — bug-002's step 4 */}
      <rect x={22} y={172} width={w - 44} height={40} rx={9} fill={colors.ACCENT} opacity={0.2 + 0.15 * submitted} />
      <rect x={22} y={172} width={w - 44} height={40} rx={9} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={w / 2} y={197} textAnchor="middle" fill={colors.ACCENT} fontSize={14.5} fontWeight={700}>
        Submit Payment
      </text>
      {/* the 500 — the seeded actual_behavior, verbatim */}
      {f > 0 && (
        <g transform={`translate(22, ${224 + (1 - f) * 8})`} opacity={f}>
          <rect width={w - 44} height={36} rx={8} fill={colors.NEGATIVE} opacity={0.14} />
          <rect width={w - 44} height={36} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} />
          <text x={16} y={23} fill={colors.NEGATIVE} fontSize={14} fontWeight={700} fontFamily={mono}>
            500 Internal Server Error
          </text>
        </g>
      )}
    </g>
  );
}

/** The journey checklist — bug-002's reproduction steps, checked off live. */
function JourneyChecklist({ enter, steps, fail }: { enter: number; steps: number; fail: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const f = clamp01(fail);
  const { x, y, w } = STEPS_PANEL;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={e}>
      <text y={-8} fill={colors.MUTED} fontSize={11.5}>
        journey steps
      </text>
      {JOURNEY_STEPS.map((label, i) => {
        const done = clamp01(steps - i);
        const isFail = i === 3 && f > 0.3;
        const color = isFail ? colors.NEGATIVE : done > 0.5 ? colors.POSITIVE : colors.MUTED;
        return (
          <g key={label} transform={`translate(0, ${i * 28})`}>
            <circle cx={8} cy={8} r={7} fill="none" stroke={color} strokeWidth={1.8} />
            {done > 0.5 && !isFail && (
              <path d="M 4.5 8 l 2.5 3 l 4.5 -6" fill="none" stroke={colors.POSITIVE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            )}
            {isFail && (
              <g stroke={colors.NEGATIVE} strokeWidth={2} strokeLinecap="round">
                <line x1={5.5} y1={5.5} x2={10.5} y2={10.5} />
                <line x1={10.5} y1={5.5} x2={5.5} y2={10.5} />
              </g>
            )}
            <text x={24} y={12} fill={done > 0.5 ? colors.TEXT : colors.MUTED} fontSize={12} fontFamily={mono}>
              {label.length > 22 ? label.slice(0, 22) : label}
            </text>
            {i < JOURNEY_STEPS.length - 1 && <line x1={8} y1={17} x2={8} y2={26} stroke={colors.GRID} strokeWidth={1} />}
          </g>
        );
      })}
      <rect x={-10} y={-22} width={w + 10} height={JOURNEY_STEPS.length * 28 + 22} rx={9} fill="none" stroke={colors.GRID} strokeWidth={1} opacity={0.5} />
    </g>
  );
}

/** The recording-id chip — the tape now has a name. */
function RecordingChip({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const label = `recording ${RECORDING_ID}…`;
  const w = label.length * 6.8 + 26;
  return (
    <g transform={`translate(${REC_CHIP.x}, ${REC_CHIP.y + (1 - uu) * 8})`} opacity={uu}>
      <rect x={-w / 2} y={-13} width={w} height={26} rx={13} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
      <circle cx={-w / 2 + 14} r={4.5} fill={colors.NEGATIVE} />
      <text x={8} y={4.5} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const gClaim = s.get(scene.gClaim);
  const gMachine = s.get(scene.gMachine);
  const gBrowser = s.get(scene.gBrowser);
  const steal = s.get(scene.stealU);
  const taskPop = s.get(scene.taskPop);
  const poolU = s.get(scene.poolU);
  const projZ = s.get(scene.projZ);

  // the stolen container rides from its pool slot into the project zone
  const stolen = POOL_SLOTS[2];
  const workerX = lerp(stolen.x, WORKER.x, steal);
  const workerY = lerp(stolen.y, WORKER.y, steal);

  return (
    <>
      {/* beat 1 — the bare claim */}
      {gClaim > 0.002 && (
        <g opacity={gClaim}>
          <MessageCard
            x={CLAIM_CARD.x}
            y={CLAIM_CARD.y}
            w={CLAIM_CARD.w}
            role="assistant"
            text={CLAIM_TEXT}
            u={s.get(scene.claimT)}
            enter={s.get(scene.claimE)}
          />
          <ClaimStamp u={s.get(scene.stampU)} />
        </g>
      )}

      {/* beats 2–5 — the dispatch machine */}
      {gMachine > 0.002 && (
        <g opacity={gMachine}>
          <Zone {...POOL} label="warm pool · role='pool'" kind="group" u={s.get(scene.poolZ)} />
          {POOL_SLOTS.map((p, i) => {
            const cu = clamp01(poolU * 3 - i);
            if (i === 2 && steal > 0.001) return null; // this one is being stolen
            return <ServiceNode key={i} x={p.x} y={p.y} kind="server" label={`pool-${i + 1}`} w={92} u={cu} dim={0.35} labelSize={11} />;
          })}
          <ServiceNode
            x={QUEUE.x}
            y={QUEUE.y}
            kind="queue"
            label="tasks"
            sublabel="test_run_id: run-001"
            u={s.get(scene.queueE)}
            glow={0.6 * taskPop * (1 - steal)}
          />
          <ServiceNode
            x={WEBHOOK.x}
            y={WEBHOOK.y}
            kind="fn"
            label="container-task-webhook"
            sublabel="claimNextTask()"
            u={s.get(scene.webhookE)}
          />
          <Connection
            from={{ x: QUEUE.x, y: QUEUE.y + 34 }}
            to={{ x: WEBHOOK.x, y: WEBHOOK.y - 34 }}
            u={s.get(scene.queueConnU)}
            dashed
            label="FOR UPDATE SKIP LOCKED"
            labelSize={10}
          />
          {/* the poll: worker → webhook → worker, task handed back */}
          <RequestFlow
            path={[
              { x: workerX, y: workerY + 36 },
              { x: WEBHOOK.x + 120, y: WEBHOOK.y },
            ]}
            u={s.get(scene.pollU)}
            roundTrip
            label="poll"
            responseLabel="task: run-001"
            color={colors.ACCENT}
            responseColor={colors.POSITIVE}
          />
        </g>
      )}

      {/* the project zone + its bound worker persist into the browser phase */}
      {(gMachine > 0.002 || gBrowser > 0.002) && projZ > 0.002 && (
        <g opacity={Math.max(gMachine, gBrowser * 0.999)}>
          <Zone {...PROJ} label="proj-acme-store · Acme Online Store" kind="group" u={projZ} color={colors.SECONDARY} />
          {(steal > 0.001 || poolU > 0.66) && (
            <ServiceNode
              x={workerX}
              y={workerY}
              kind="server"
              label={steal > 0.6 ? 'worker' : 'pool-3'}
              w={lerp(92, 172, steal)}
              sublabel={steal > 0.6 ? 'ghcr.io/replayio/app-building' : undefined}
              u={1}
              glow={0.5 * steal * (1 - s.get(scene.browserE))}
              labelSize={12}
            />
          )}
        </g>
      )}

      {/* beats 6–10 — the run + the growing tape */}
      {gBrowser > 0.002 && (
        <g opacity={gBrowser}>
          <AcmeBrowser enter={s.get(scene.browserE)} steps={s.get(scene.stepsU)} fail={s.get(scene.failU)} />
          <JourneyChecklist enter={s.get(scene.browserE)} steps={s.get(scene.stepsU)} fail={s.get(scene.failU)} />
        </g>
      )}
      <RecordingStrip
        x={STRIP.x}
        y={STRIP.y}
        w={STRIP.w}
        h={STRIP.h}
        points={POINTS}
        reveal={s.get(scene.stripR)}
        title="the tape — recorded as it happens"
      />
      <RecordingChip u={s.get(scene.recChip)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
