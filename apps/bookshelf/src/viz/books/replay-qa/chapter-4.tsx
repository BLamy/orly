// Book scene — replay-qa, chapter 4: "A Finding Carries Its Proof".
//
// The centerpiece: the anatomy of a filed finding, assembled live on top of
// the ONE persistent tape from chapters 2–3. Each numbered reproduction step
// is anchored by a dropped link line to the exact moment on the recording
// where it happened; the camera then dives INTO the anchored 500 moment (the
// skeptic's click), pulls back for the webhook payload, and runs the dedup
// scan before the bug files as open/critical with the recording attached.
//
// Epistemics: believing "it's broken" is cheap (worst case you check and it
// isn't) — so the finding's job is to survive that check. Doubt is never
// aimed at the bug report; it is aimed at any claim that things WORK.
//
// Ground truth (~/Dev/loop-qa):
// - AppSpec.md: bugs carry severity, title, description, reproduction_steps,
//   replay_recording_id, status (open/confirmed/fixed/dismissed); bugs are
//   listed on the project or sent to a webhook.
// - netlify/functions/lib/bugs.ts: severity ∈ critical/high/medium/low;
//   webhookPayload() ships { body, referrer: 'loop-qa', callback_url:
//   …/api/bug-fixed-webhook/{bug_id}, title, severity, reproduction_steps,
//   expected_behavior, actual_behavior, replay_recording_id, … };
//   findDuplicateBug() has a model compare the new report against existing
//   bugs and answer ONLY "unique" or an existing bug's id; duplicates are
//   recorded as rediscoveries (filed_bugs.is_duplicate) and can reopen a
//   fixed bug rather than filing twice.
import { CAMERA_HOME, Camera, Timeline, colors, ease , cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage is 1280×720; the caption strip owns y ≳ 630 — nothing lives there. */
const TAPE = { x: 120, y: 545, w: 1040, h: 46 };
const CARD = { x: 84, y: 84, w: 500 };
const PAYLOAD = { x: 664, y: 92, w: 512 };
const DEDUP = { x: 664, y: 300, w: 512, h: 200 };

/* ------------------------------------------------------------------ data */
/** The recording's notable moments (fractions along the tape). */
const MOMENTS = [
  { u: 0.1, kind: 'nav', label: 'GET /products' },
  { u: 0.3, kind: 'click', label: 'click “Add to cart”' },
  { u: 0.52, kind: 'nav', label: 'GET /checkout' },
  { u: 0.72, kind: 'net', label: 'POST /api/checkout → 500' },
  { u: 0.84, kind: 'console', label: 'console.error: payment failed' },
] as const;

/** Numbered repro steps, each anchored to a tape moment (by MOMENTS index). */
const STEPS = [
  { text: '1. Browse to the products page', anchor: 0 },
  { text: '2. Add any item to the cart', anchor: 1 },
  { text: '3. Open checkout and submit payment', anchor: 3 },
  { text: '4. Server responds 500; console logs the failure', anchor: 4 },
] as const;

const PAYLOAD_KEYS = [
  '"title", "severity", "description"',
  '"reproduction_steps", "expected_behavior"',
  '"replay_recording_id": "rec-7f3a…"',
  '"callback_url": "…/api/bug-fixed-webhook/bug-002"',
  '"referrer": "loop-qa"',
] as const;

/** Dedup candidates: the project's existing bugs, with a precomputed
 *  similarity for the sweep bars. Deterministic, module scope. */
const CANDIDATES = [
  { label: 'bug-001 · Product image 404 on search results', sim: 0.22 },
  { label: 'bug-003 · Cart badge count lags one item behind', sim: 0.31 },
  { label: 'bug-004 · Coupon field accepts expired codes', sim: 0.14 },
  { label: 'bug-005 · Login form loses email on bad password', sim: 0.09 },
] as const;

/* ------------------------------------------------------------- cameras */
const CAM_CARD: CameraState = { x: 560, y: 330, k: 1.1 };
const momentX = (u: number) => TAPE.x + u * TAPE.w;
const CAM_MOMENT: CameraState = { x: momentX(MOMENTS[3].u), y: 468, k: 1.9 };
const CAM_CLOSE: CameraState = { x: 590, y: 335, k: 1.16 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tapeU = tl.channel('tapeReveal', 0);
  const momentsU = tl.channel('moments', 0); // 0..MOMENTS.length, staggered
  const cardU = tl.channel('findingCard', 0);
  const sevU = tl.channel('severityChip', 0);
  const stepsU = tl.channel('reproSteps', 0); // 0..STEPS.length, drives anchors too
  const focusM = tl.channel('momentFocus', 0); // glow on the 500 moment
  const insetU = tl.channel('momentInset', 0); // the magnified interrogation
  const payU = tl.channel('webhookPanel', 0);
  const payRows = tl.channel('payloadRows', 0); // 0..PAYLOAD_KEYS.length
  const gPay = tl.channel('payloadFade', 1);
  const ddU = tl.channel('dedupPanel', 0);
  const scanU = tl.channel('dedupScan', 0); // 0..CANDIDATES.length
  const verdictU = tl.channel('uniqueVerdict', 0);
  const gDd = tl.channel('dedupFade', 1);
  const gTape = tl.channel('tapeFade', 1);
  const openU = tl.channel('openChip', 0);
  const linkGlow = tl.channel('recordingLinkGlow', 0);

  /* — beat 1 · the asymmetry, restated where it bites ——————————————— */
  let t = 0.5;
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Believing an app is broken costs almost nothing — the worst case of checking a bug report is a few wasted minutes. So a finding has exactly one job: survive the checking.',
  });
  tl.tween(tapeU, 1, { at: t - 6.0, dur: 1.5, ease: ease.draw });
  tl.tween(momentsU, MOMENTS.length, { at: t - 4.6, dur: 1.8, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* — beat 2 · the tape is the foundation ———————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The run already left this behind: a Replay recording of the whole browser session. The finding is built on top of the tape, not beside it.',
  });
  t = tl.hold(t, 0.6);

  /* — beat 3 · severity and title ————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'It starts with a severity and a title. Critical: checkout fails with a server error when payment is submitted.',
  });
  tl.tween(cam, CAM_CARD, { at: t - 5.2, dur: 1.4, ease: ease.move });
  tl.tween(cardU, 1, { at: t - 4.6, dur: 0.7, ease: ease.enter });
  tl.tween(sevU, 1, { at: t - 3.4, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 4 · steps anchored to moments (the centerpiece assembles) —— */
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Then the reproduction steps — and each numbered step is anchored to the exact moment on the tape where it happened. The words point at the evidence.',
  });
  tl.tween(stepsU, STEPS.length, { at: t - 6.4, dur: 4.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 5 · the heart of it: the 500 —————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'Step three is the heart of it: the payment request goes out, and the server answers with a five hundred.',
  });
  tl.tween(focusM, 1, { at: t - 4.8, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 6 · the skeptic clicks in (camera dives into the moment) ——— */
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'A skeptic never has to take those words on faith. They open the recording, jump to the anchored moment, and interrogate it themselves — the request, the response, the console at that instant.',
  });
  tl.tween(cam, CAM_MOMENT, { at: t - 6.8, dur: 1.6, ease: ease.move });
  tl.tween(insetU, 1, { at: t - 5.0, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.8);

  /* — beat 7 · the webhook payload ———————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'If the project has a webhook, the same finding ships as a payload: title, severity, the reproduction steps, the recording id — and a callback URL for the day someone claims a fix.',
  });
  tl.tween(insetU, 0, { at: t - 6.4, dur: 0.6, ease: ease.move });
  tl.tween(focusM, 0, { at: t - 6.4, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: t - 6.2, dur: 1.4, ease: ease.move });
  tl.tween(payU, 1, { at: t - 4.8, dur: 0.7, ease: ease.enter });
  tl.tween(payRows, PAYLOAD_KEYS.length, { at: t - 4.2, dur: 2.4, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 8 · dedup: is this already known? —————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'One more gate before filing: is this bug already known? A model compares the new report against the project’s existing bugs — titles, steps, behavior — and answers with one word.',
  });
  tl.tween(gPay, 0.12, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(ddU, 1, { at: t - 5.0, dur: 0.7, ease: ease.enter });
  tl.tween(scanU, CANDIDATES.length, { at: t - 4.2, dur: 2.8, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 9 · unique — or a rediscovery ——————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'A duplicate would not be filed twice — it is recorded as a rediscovery of the old bug, and it can even reopen one that had been marked fixed. This report comes back unique.',
  });
  tl.tween(verdictU, 1, { at: t - 4.6, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 10 · filed: a claim with its proof stapled on ———————————————— */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'So it is filed: open, critical, with the recording attached. Not a story about a bug — a claim that arrives holding the evidence a skeptic will ask for.',
  });
  tl.tween(gDd, 0.1, { at: t - 6.2, dur: 0.8, ease: ease.move });
  tl.tween(gPay, 0, { at: t - 6.2, dur: 0.8, ease: ease.move });
  tl.tween(gTape, 0.15, { at: t - 6.0, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_CLOSE, { at: t - 5.8, dur: 1.6, ease: ease.move });
  tl.tween(openU, 1, { at: t - 4.4, dur: 0.5, ease: ease.pop });
  tl.tween(linkGlow, 1, { at: t - 3.2, dur: 1.0, ease: ease.enter });
  tl.hold(t, 1.4);

  return {
    tl, cam, tapeU, momentsU, cardU, sevU, stepsU, focusM, insetU,
    payU, payRows, gPay, ddU, scanU, verdictU, gDd, gTape, openU, linkGlow,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

const MOMENT_COLOR: Record<string, string> = {
  nav: colors.ACCENT,
  click: colors.SECONDARY,
  net: colors.NEGATIVE,
  console: colors.WARM,
};

/** The persistent recording — a film strip with notable moments. */
function TapeStrip({
  reveal, moments, focus, fade,
}: { reveal: number; moments: number; focus: number; fade: number }) {
  const r = clamp01(reveal);
  if (r <= 0) return null;
  const { x, y, w, h } = TAPE;
  const drawnW = w * r;
  return (
    <g opacity={0.15 + 0.85 * clamp01(fade)}>
      <rect x={x} y={y} width={drawnW} height={h} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      {/* sprocket holes */}
      {Array.from({ length: 26 }, (_, i) => {
        const hx = x + 20 + i * 40;
        if (hx > x + drawnW - 14) return null;
        return (
          <g key={i}>
            <rect x={hx} y={y + 5} width={8} height={5} rx={2} fill={colors.BG} opacity={0.8} />
            <rect x={hx} y={y + h - 10} width={8} height={5} rx={2} fill={colors.BG} opacity={0.8} />
          </g>
        );
      })}
      <text x={x} y={y - 10} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        replay_recording_id: rec-7f3a…
      </text>
      {MOMENTS.map((m, i) => {
        const mu = clamp01(moments - i);
        if (mu <= 0) return null;
        const mx = momentX(m.u);
        const hot = i === 3 ? clamp01(focus) : 0;
        const c = MOMENT_COLOR[m.kind];
        return (
          <g key={i} opacity={mu}>
            {hot > 0 && (
              <circle cx={mx} cy={y + h / 2} r={14 + 8 * hot} fill={c} opacity={0.18 * hot} />
            )}
            <line x1={mx} y1={y + 12} x2={mx} y2={y + h - 12} stroke={c} strokeWidth={hot > 0 ? 3 : 2} />
            <circle cx={mx} cy={y + h / 2} r={3.4 + 1.6 * hot} fill={c} />
          </g>
        );
      })}
    </g>
  );
}

/** The finding card — severity, title, and anchored repro steps. */
function FindingCard({
  u, sev, steps, open, glow, tapeFade,
}: { u: number; sev: number; steps: number; open: number; glow: number; tapeFade: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w } = CARD;
  const stepY = (i: number) => y + 112 + i * 34;
  return (
    <g opacity={uu}>
      <g transform={`translate(${x}, ${y + (1 - uu) * 12})`}>
        <rect width={w} height={112 + STEPS.length * 34 + 16} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
        <text x={20} y={30} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
          bug-002 · discovered by run-004
        </text>
        {clamp01(sev) > 0 && (
          <g opacity={clamp01(sev)} transform={`scale(${0.9 + 0.1 * clamp01(sev)})`}>
            <rect x={20} y={44} width={78} height={24} rx={12} fill={colors.NEGATIVE} opacity={0.2} />
            <text x={59} y={61} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
              critical
            </text>
          </g>
        )}
        {clamp01(open) > 0 && (
          <g opacity={clamp01(open)}>
            <rect x={108} y={44} width={58} height={24} rx={12} fill={colors.POSITIVE} opacity={0.2} />
            <text x={137} y={61} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
              open
            </text>
          </g>
        )}
        <text x={20} y={92} fill={colors.TEXT} fontSize={15.5} fontWeight={700}>
          Checkout fails with 500 on payment submission
        </text>
        <text x={20} y={112 + STEPS.length * 34 + 2} fill={clamp01(glow) > 0.5 ? colors.ACCENT : colors.MUTED} fontSize={11.5} fontFamily={mono} opacity={0.4 + 0.6 * clamp01(glow)}>
          ▶ open recording rec-7f3a…
        </text>
        {STEPS.map((st, i) => {
          const su = clamp01(steps - i);
          if (su <= 0) return null;
          return (
            <text key={i} x={20} y={130 + i * 34} fill={colors.TEXT} fontSize={13} fontFamily={mono} opacity={su}>
              {st.text}
            </text>
          );
        })}
      </g>
      {/* anchor lines: step → tape moment (drawn in stage space) */}
      {STEPS.map((st, i) => {
        const su = clamp01(steps - i);
        if (su <= 0.3) return null;
        const au = clamp01((su - 0.3) / 0.7);
        const sx = x + w + 2;
        const sy = stepY(i) + (1 - clamp01(u)) * 12 + 12;
        const mx = momentX(MOMENTS[st.anchor].u);
        const my = TAPE.y + 6;
        const c = MOMENT_COLOR[MOMENTS[st.anchor].kind];
        // simple elbow: out from the step, down to just above the moment
        const midX = sx + (mx - sx) * au;
        const dropY = sy + (my - sy) * au;
        return (
          <g key={i} opacity={(0.25 + 0.55 * (i === 2 || i === 3 ? 1 : 0.5)) * clamp01(tapeFade)}>
            <path
              d={`M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${dropY}`}
              fill="none"
              stroke={c}
              strokeWidth={1.4}
              strokeDasharray="5 4"
            />
            {au >= 1 && <circle cx={mx} cy={my - 2} r={3} fill={c} />}
          </g>
        );
      })}
    </g>
  );
}

/** The magnified interrogation of the 500 moment (shown while zoomed in). */
function MomentInset({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const mx = momentX(MOMENTS[3].u);
  const y = TAPE.y - 96;
  return (
    <g transform={`translate(${mx}, ${y + (1 - uu) * 8})`} opacity={uu}>
      <line x1={0} y1={72} x2={0} y2={92} stroke={colors.NEGATIVE} strokeWidth={1.2} />
      <rect x={-158} y={-2} width={316} height={74} rx={8} fill={colors.BG} opacity={0.94} />
      <rect x={-158} y={-2} width={316} height={74} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.3} />
      <text x={-144} y={20} fill={colors.TEXT} fontSize={11} fontFamily={mono}>
        POST /api/checkout
      </text>
      <text x={-144} y={40} fill={colors.NEGATIVE} fontSize={11} fontWeight={700} fontFamily={mono}>
        ← 500 Internal Server Error
      </text>
      <text x={-144} y={60} fill={colors.WARM} fontSize={10.5} fontFamily={mono}>
        console.error: payment failed
      </text>
    </g>
  );
}

/** The webhook payload — real keys from webhookPayload(). */
function PayloadPanel({ u, rows, fade }: { u: number; rows: number; fade: number }) {
  const uu = clamp01(u) * clamp01(fade);
  if (uu <= 0.002) return null;
  const { x, y, w } = PAYLOAD;
  return (
    <g transform={`translate(${x}, ${y + (1 - clamp01(u)) * 10})`} opacity={uu}>
      <rect width={w} height={40 + PAYLOAD_KEYS.length * 26 + 14} rx={10} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.4} />
      <text x={16} y={26} fill={colors.TEAL} fontSize={12} fontWeight={700} fontFamily={mono}>
        POST project.webhook_url · JSON
      </text>
      {PAYLOAD_KEYS.map((k, i) => {
        const ru = clamp01(rows - i);
        if (ru <= 0) return null;
        return (
          <text key={i} x={26} y={52 + i * 26} fill={i >= 2 ? colors.ACCENT : colors.TEXT} fontSize={11.5} fontFamily={mono} opacity={ru}>
            {k}
          </text>
        );
      })}
    </g>
  );
}

/** Dedup: candidate bugs, similarity bars, and the one-word verdict. */
function DedupPanel({ u, scan, verdict, fade }: { u: number; scan: number; verdict: number; fade: number }) {
  const uu = clamp01(u) * clamp01(fade);
  if (uu <= 0.002) return null;
  const { x, y, w, h } = DEDUP;
  const v = clamp01(verdict);
  return (
    <g transform={`translate(${x}, ${y + (1 - clamp01(u)) * 10})`} opacity={uu}>
      <rect width={w} height={h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={16} y={24} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        findDuplicateBug() · answer “unique” or a bug id
      </text>
      {CANDIDATES.map((c, i) => {
        const cu = clamp01(scan - i);
        const yy = 48 + i * 28;
        return (
          <g key={i} opacity={0.25 + 0.75 * cu}>
            <text x={16} y={yy + 4} fill={colors.TEXT} fontSize={10.5} fontFamily={mono}>
              {c.label}
            </text>
            <rect x={w - 130} y={yy - 6} width={110} height={10} rx={5} fill={colors.GRID} opacity={0.5} />
            <rect x={w - 130} y={yy - 6} width={110 * c.sim * cu} height={10} rx={5} fill={colors.SECONDARY} opacity={0.9} />
          </g>
        );
      })}
      {v > 0 && (
        <g transform={`translate(${w / 2}, ${h - 26}) scale(${0.85 + 0.15 * v})`} opacity={v}>
          <rect x={-78} y={-15} width={156} height={30} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} />
          <text y={5} textAnchor="middle" fill={colors.POSITIVE} fontSize={14.5} fontWeight={800} letterSpacing={2} fontFamily={mono}>
            “unique”
          </text>
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  return (
    <Camera {...s.get(scene.cam)}>
      <TapeStrip
        reveal={s.get(scene.tapeU)}
        moments={s.get(scene.momentsU)}
        focus={s.get(scene.focusM)}
        fade={s.get(scene.gTape)}
      />
      <FindingCard
        u={s.get(scene.cardU)}
        sev={s.get(scene.sevU)}
        steps={s.get(scene.stepsU)}
        open={s.get(scene.openU)}
        glow={s.get(scene.linkGlow)}
        tapeFade={s.get(scene.gTape)}
      />
      <MomentInset u={s.get(scene.insetU)} />
      <PayloadPanel u={s.get(scene.payU)} rows={s.get(scene.payRows)} fade={s.get(scene.gPay)} />
      <DedupPanel u={s.get(scene.ddU)} scan={s.get(scene.scanU)} verdict={s.get(scene.verdictU)} fade={s.get(scene.gDd)} />
    </Camera>
  );
}
export const vizScene = () => scene;
