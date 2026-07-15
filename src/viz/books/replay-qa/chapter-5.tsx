// Book scene — replay-qa, chapter 5: "A Finding You Can Interrogate".
// The shipped finding: bug-002 on run-001's page (Bugs Found (2)), with its
// real reproduction steps, a root cause, and the deep link — View Full
// Recording · app.replay.io/recording/b5f2a3c1… A skeptical reviewer probes
// the recording directly; the report folds into a webhook payload (carrying
// a callback_url) and POSTs to the project's webhook; the fix calls back via
// bug-fixed-webhook and the bug flips to fixed; resolving every bug on the
// journey version auto-queues a retry — the loop closes on a fresh recording.
// Backing files (replayio/loop-qa): docs/components/TestRunDetail/
// BugsFoundList.md, tests/replay-link.spec.ts ("View Full Recording",
// app.replay.io/recording/<id>), netlify/functions/lib/bugs.ts
// (buildWebhookBody, webhookPayload — callback_url = /api/bug-fixed-webhook/
// <id>, tryAutoSendWebhook → sent_to_webhook), scripts/seed-db.ts (bug-002 +
// its reproduction steps, the project's Slack webhook_url),
// docs/backend/tasks-and-containers.md (auto-queuing: resolving all bugs on
// a journey version triggers a retry).
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Packet, ServiceNode } from '../../primitives';
import { LoopRing } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage is 1280×720; captions own the bottom ~12% (y ≳ 630). */
const DOC = { x: 70, y: 96, w: 520, h: 430 };
const PROBES = { x: 640, y: 150 };
const WEBHOOK = { x: 1080, y: 210 };
const PAYLOAD = { x: 660, y: 300, w: 380 };
const RETRY = { x: 870, y: 500 };
const RING = { cx: 640, cy: 330, r: 168 };

/* ------------------------------------------------------------------ data */
/** bug-002's seeded reproduction steps, verbatim. */
const REPRO = ['Add item to cart', 'Go to checkout', 'Fill payment details', 'Click Submit Payment'];
const RECORDING_ID = 'b5f2a3c1-7d4e-4f8a-9b1c-0e2d3f4a5b6c';

const PROBE_CHIPS = ['ConsoleMessages @ 03:41', 'NetworkRequest · the POST', 'response body · 500'];

const PAYLOAD_LINES = [
  'title · severity · description',
  'reproduction steps + screenshots',
  'root cause · causal chain',
  'app.replay.io/recording/b5f2a3c1…',
  'callback_url: /api/bug-fixed-webhook/bug-002',
];

const RING_STOPS = [
  { label: 'run' },
  { label: 'record' },
  { label: 'file' },
  { label: 'judge' },
  { label: 'dedup' },
  { label: 'report' },
  { label: 'fix' },
  { label: 're-run' },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const docE = tl.channel('docEnter', 0);
  const stepsU = tl.channel('reproSteps', 0); // 0..4
  const linkU = tl.channel('replayLink', 0);
  const probeU = tl.channel('reviewerProbes', 0); // 0..3
  const whE = tl.channel('webhookNode', 0);
  const payE = tl.channel('payloadCard', 0);
  const payRows = tl.channel('payloadRows', 0); // 0..5
  const postU = tl.channel('postPacket', 0);
  const sentU = tl.channel('sentStamp', 0);
  const fixPkt = tl.channel('fixCallback', 0);
  const fixedU = tl.channel('statusFixed', 0);
  const retryU = tl.channel('journeyRetry', 0);
  const gProbes = tl.channel('probesFade', 1);
  const gPay = tl.channel('payloadFade', 1);
  const gDoc = tl.channel('docFade', 1);
  const gWh = tl.channel('webhookFade', 1);
  const ringR = tl.channel('ringReveal', 0);
  const ringU = tl.channel('ringOrbit', 0);

  /* ---- beat 1: what ships ------------------------------------------------ */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Here’s what ships. On the run’s page: bugs found, two. And bug two — checkout fails with a five hundred on payment submission. Critical. Open.',
  });
  tl.tween(docE, 1, { at: t - 5.4, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* ---- beat 2: a story a skeptic can audit ------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The report reads like a story a skeptic can audit: four numbered steps to reproduce, each one a moment in the tape, with the screenshot to prove it.',
  });
  tl.tween(stepsU, 4, { at: t - 5.0, dur: 2.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* ---- beat 3: the deep link ---------------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'And at the bottom, the part that changes the relationship: view full recording. Not a log excerpt the agent chose — the entire runtime, open to interrogation.',
  });
  tl.tween(linkU, 1, { at: t - 4.6, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 4: the reviewer re-asks the recording -------------------------- */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'A skeptical reviewer doesn’t take anyone’s word. They click in and re-ask the recording themselves: the console at that moment, the request, the exact response body of the five hundred.',
  });
  tl.tween(probeU, 3, { at: t - 5.2, dur: 2.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* ---- beat 5: the finding travels ------------------------------------------ */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Then the finding travels. The project has a webhook, and the payload carries everything — title, severity, the steps, the root cause, the recording links — and a callback URL.',
  });
  tl.tween(gProbes, 0, { at: t - 6.0, dur: 0.7, ease: ease.move });
  tl.tween(whE, 1, { at: t - 5.6, dur: 0.6, ease: ease.enter });
  tl.tween(payE, 1, { at: t - 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(payRows, 5, { at: t - 4.4, dur: 2.6, ease: ease.enter });
  tl.tween(postU, 1, { at: t - 1.6, dur: 1.2, ease: ease.linear });
  tl.tween(sentU, 1, { at: t - 0.4, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* ---- beat 6: the callback ---------------------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'That callback is the return path. When the team ships a fix, the fixed webhook calls back — and the bug flips to fixed.',
  });
  tl.tween(gPay, 0, { at: t - 5.2, dur: 0.7, ease: ease.move });
  tl.tween(fixPkt, 1, { at: t - 4.2, dur: 1.4, ease: ease.linear });
  tl.tween(fixedU, 1, { at: t - 2.4, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 7: the loop earns its name ------------------------------------------ */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'And now the loop earns its name. When every bug on a journey version is resolved, the journey re-queues itself — automatically.',
  });
  tl.tween(retryU, 1, { at: t - 4.0, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 8: a fresh run, a fresh tape ------------------------------------------ */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'A fresh run walks the same checkout path on a fresh recording. If the fix holds, the run comes back green — and there’s a tape to prove that, too.',
  });
  t = tl.hold(t, 0.4);

  /* ---- beat 9: if it doesn't hold --------------------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'If it doesn’t hold, the rediscovery matches the old bug and reopens it. Either way, nobody’s claim decided — a recording did.',
  });
  t = tl.hold(t, 0.5);

  /* ---- beat 10: the whole machine, one ring ------------------------------------------ */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'That’s the whole machine: a run is dispatched, everything is taped, evidence is re-executed, a judge interrogates, duplicates collapse, and the report ships with its proof attached.',
  });
  tl.tween(gDoc, 0, { at: t - 6.2, dur: 0.8, ease: ease.move });
  tl.tween(gWh, 0, { at: t - 6.2, dur: 0.8, ease: ease.move });
  tl.tween(ringR, 1, { at: t - 5.2, dur: 1.5, ease: ease.draw });
  tl.tween(ringU, 1, { at: t - 3.4, dur: 6.5, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* ---- beat 11: the close --------------------------------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Agents that prove their work aren’t more honest than other agents. They just work somewhere honesty is checked.',
  });
  tl.hold(t, 1.6);

  return {
    tl,
    docE, stepsU, linkU, probeU, whE, payE, payRows, postU, sentU,
    fixPkt, fixedU, retryU, gProbes, gPay, gDoc, gWh, ringR, ringU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The bug report as it appears — badges, steps, root cause, the link. */
function ReportDoc({
  e, steps, link, fixed,
}: {
  e: number; steps: number; link: number; fixed: number;
}) {
  const uu = clamp01(e);
  if (uu <= 0) return null;
  const f = clamp01(fixed);
  const lk = clamp01(link);
  const { x, y, w, h } = DOC;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 14})`} opacity={uu}>
      <text y={-12} fill={colors.MUTED} fontSize={12}>
        run-001 · Bugs Found (2)
      </text>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {/* badges — severity, then status (open → fixed) */}
      <rect x={18} y={18} width={78} height={24} rx={12} fill={colors.NEGATIVE} opacity={0.2} />
      <text x={57} y={35} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        critical
      </text>
      <rect x={104} y={18} width={62} height={24} rx={12} fill={f > 0.5 ? colors.TEAL : colors.POSITIVE} opacity={0.2} />
      <text x={135} y={35} textAnchor="middle" fill={f > 0.5 ? colors.TEAL : colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {f > 0.5 ? 'fixed' : 'open'}
      </text>
      <text x={18} y={68} fill={colors.TEXT} fontSize={14.5} fontWeight={700}>
        Checkout fails with 500 error on payment
      </text>
      <text x={18} y={88} fill={colors.TEXT} fontSize={14.5} fontWeight={700}>
        submission
      </text>
      <text x={18} y={116} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
        bug-002 · proj-acme-store
      </text>
      {/* steps to reproduce — the seeded reproduction_steps, verbatim */}
      <text x={18} y={148} fill={colors.MUTED} fontSize={12} fontWeight={700}>
        Steps to Reproduce
      </text>
      {REPRO.map((step, i) => {
        const cu = clamp01(steps - i);
        if (cu <= 0) return null;
        return (
          <g key={i} opacity={cu}>
            <text x={26} y={174 + i * 26} fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>
              {i + 1}. {step}
            </text>
            {/* each step is a moment in the tape — screenshot chip */}
            <rect x={w - 106} y={160 + i * 26} width={88} height={18} rx={9} fill={colors.BG} opacity={0.7 * cu} />
            <text x={w - 62} y={173 + i * 26} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={mono}>
              screenshot ▸
            </text>
          </g>
        );
      })}
      <text x={18} y={296} fill={colors.MUTED} fontSize={12} fontWeight={700}>
        Root Cause
      </text>
      <text x={26} y={318} fill={colors.TEXT} fontSize={12} fontFamily={mono}>
        payment endpoint returns 500; order never
      </text>
      <text x={26} y={336} fill={colors.TEXT} fontSize={12} fontFamily={mono}>
        created — evidence cited at every link
      </text>
      {/* the ReplayLink — tests/replay-link.spec.ts */}
      {lk > 0 && (
        <g transform={`translate(18, ${360 + (1 - lk) * 8})`} opacity={lk}>
          <rect width={w - 36} height={50} rx={10} fill={colors.SECONDARY} opacity={0.12} />
          <rect width={w - 36} height={50} rx={10} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} />
          <text x={16} y={22} fill={colors.SECONDARY} fontSize={13} fontWeight={700}>
            ▶ View Full Recording
          </text>
          <text x={16} y={40} fill={colors.MUTED} fontSize={10} fontFamily={mono}>
            app.replay.io/recording/{RECORDING_ID.slice(0, 23)}…
          </text>
        </g>
      )}
    </g>
  );
}

/** The reviewer's probes — re-asking the recording, not the agent. */
function ProbeChips({ u }: { u: number }) {
  const uu = clamp01(u / 3) * 3;
  if (uu <= 0) return null;
  return (
    <g>
      <text x={PROBES.x} y={PROBES.y - 26} fill={colors.MUTED} fontSize={12}>
        the reviewer, interrogating the recording:
      </text>
      {PROBE_CHIPS.map((label, i) => {
        const cu = clamp01(uu - i);
        if (cu <= 0) return null;
        const w = label.length * 6.8 + 24;
        return (
          <g key={i} transform={`translate(${PROBES.x}, ${PROBES.y + i * 40 + (1 - cu) * 8})`} opacity={cu}>
            <line x1={-24} y1={0} x2={-8} y2={0} stroke={colors.TEAL} strokeWidth={1.5} strokeDasharray="2 3" />
            <rect y={-13} width={w} height={26} rx={13} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.4} />
            <text x={w / 2} y={4.5} textAnchor="middle" fill={colors.TEAL} fontSize={11.5} fontFamily={mono}>
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The webhook payload — what buildWebhookBody actually carries. */
function PayloadCard({ e, rows }: { e: number; rows: number }) {
  const uu = clamp01(e);
  if (uu <= 0) return null;
  const { x, y, w } = PAYLOAD;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu}>
      <rect width={w} height={148} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={14} y={22} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        webhookPayload(bug)
      </text>
      {PAYLOAD_LINES.map((line, i) => {
        const cu = clamp01(rows - i);
        if (cu <= 0) return null;
        const isLink = i >= 3;
        return (
          <text key={i} x={14} y={44 + i * 20} fill={isLink ? colors.SECONDARY : colors.TEXT} fontSize={10.5} fontFamily={mono} opacity={cu}>
            {line}
          </text>
        );
      })}
    </g>
  );
}

/** journey retry — the auto-queued re-run. */
function RetryChip({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const label = 'all bugs resolved → journey re-queued';
  const w = label.length * 6.8 + 26;
  return (
    <g transform={`translate(${RETRY.x}, ${RETRY.y + (1 - uu) * 8})`} opacity={uu}>
      <rect x={-w / 2} y={-15} width={w} height={30} rx={15} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.6} />
      <path d="M -8 0 a 8 8 0 1 1 2.4 5.7 M -6 7 l 0.6 -2.8 l 2.8 0.9" transform={`translate(${-w / 2 + 18}, 0) scale(0.9)`} fill="none" stroke={colors.POSITIVE} strokeWidth={1.8} strokeLinecap="round" />
      <text x={10} y={4.5} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const gDoc = s.get(scene.gDoc);
  const gWh = s.get(scene.gWh);
  const gProbes = s.get(scene.gProbes);
  const gPay = s.get(scene.gPay);
  const post = s.get(scene.postU);
  const fix = s.get(scene.fixPkt);

  const docEdge = { x: DOC.x + DOC.w, y: DOC.y + 60 };
  const whEdge = { x: WEBHOOK.x - 80, y: WEBHOOK.y };

  return (
    <>
      {gDoc > 0.002 && (
        <g opacity={gDoc}>
          <ReportDoc
            e={s.get(scene.docE)}
            steps={s.get(scene.stepsU)}
            link={s.get(scene.linkU)}
            fixed={s.get(scene.fixedU)}
          />
        </g>
      )}
      {gProbes > 0.002 && gDoc > 0.002 && (
        <g opacity={gProbes * gDoc}>
          <ProbeChips u={s.get(scene.probeU)} />
        </g>
      )}

      {gWh > 0.002 && (
        <g opacity={gWh}>
          <ServiceNode
            x={WEBHOOK.x}
            y={WEBHOOK.y}
            kind="external"
            label="project webhook"
            sublabel="hooks.slack.com/…"
            u={s.get(scene.whE)}
            glow={0.6 * s.get(scene.sentU)}
          />
          {gPay > 0.002 && (
            <g opacity={gPay}>
              <PayloadCard e={s.get(scene.payE)} rows={s.get(scene.payRows)} />
            </g>
          )}
          <Packet from={docEdge} to={whEdge} u={post} color={colors.SECONDARY} label={post > 0.2 && post < 0.9 ? 'POST' : undefined} labelSize={10} />
          {/* the fix, calling back */}
          <Packet from={whEdge} to={{ x: DOC.x + DOC.w - 40, y: DOC.y + 30 }} u={fix} color={colors.POSITIVE} label={fix > 0.15 && fix < 0.9 ? 'bug-fixed-webhook' : undefined} labelSize={10} />
          {s.get(scene.sentU) > 0.01 && (
            <g transform={`translate(${WEBHOOK.x}, ${WEBHOOK.y + 66})`} opacity={s.get(scene.sentU)}>
              <rect x={-104} y={-12} width={208} height={24} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
              <text y={4.5} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily={mono}>
                sent_to_webhook = TRUE
              </text>
            </g>
          )}
          <RetryChip u={s.get(scene.retryU)} />
        </g>
      )}

      {/* the recap ring — the loop, closed */}
      <LoopRing
        cx={RING.cx}
        cy={RING.cy}
        r={RING.r}
        stops={RING_STOPS}
        u={s.get(scene.ringU)}
        reveal={s.get(scene.ringR)}
        color={colors.SECONDARY}
      />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
