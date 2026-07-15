// Book scene — replay-qa, chapter 4: "The Gauntlet".
// A bug submission runs the gates: submit (202 + bsub id, one at a time) →
// requirements judge → evidence judge → the cross-run interference check →
// Opus dedup → FILED. The token bounces once at the evidence gate (specific
// problems come back; the resubmission carries the accumulated
// judge_submissions history), passes on lap two, survives the overlap check
// (parallel journeys mutate shared state — flakes get called flakes), and is
// declared unique against the project's 300 most recent bugs.
// Backing files (replayio/loop-qa): netlify/functions/lib/prompts.ts
// (buildBugSubmissionGuidelines — async submit-then-poll, ONE bug at a time,
// judge_submissions accumulation, the 2-attempt judge_failed rule),
// netlify/functions/bug-submission-background.ts (requirements vs evidence
// rejection: only evidence rejections file as judge-rejected),
// netlify/functions/lib/test-runs.ts (listRecentRunsForProject,
// overlaps_this_run), netlify/functions/lib/bugs.ts (findDuplicateBug —
// claude-opus-4-6 over the 300 most recent bugs, "unique" or an id;
// duplicates record a rediscovery and reopen a fixed bug).
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { GauntletRail } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage is 1280×720; captions own the bottom ~12% (y ≳ 630). */
const RAIL = { x: 150, y: 268, w: 980 };
const SUB_CHIP = { x: 640, y: 96 };
const PROB = { x: 380, y: 392, w: 520 };
const OVERLAP = { x: 84, y: 392, w: 520 };
const DEDUP = { x: 664, y: 392, w: 532 };
const FINAL = { x: 640, y: 430 };

/* ------------------------------------------------------------------ data */
const GATE_LABELS = ['submit', 'requirements', 'evidence', 'overlap', 'dedup', 'filed'];
const REQ_GATE = 1;
const EVID_GATE = 2;
const OVERLAP_GATE = 3;
const DEDUP_GATE = 4;
const FILED_GATE = 5;

const PROBLEMS = [
  'root_cause hedges — “may have failed”',
  'chain step 2 cites no evidence',
];

/** Other recent Acme-store runs, relative to this run's execution window. */
const RUNS = [
  { label: 'run-002 · cart badge journey', start: 0.05, end: 0.3, overlaps: false },
  { label: 'run-003 · login regression', start: 0.62, end: 0.94, overlaps: true },
];
const WINDOW = { start: 0.42, end: 0.86 };

/** The real dedup candidate set is the project's 300 most recent bugs. */
const CANDIDATES = [
  'bug-001 · Product images fail to load on search results',
  '… the project’s 300 most recent bugs',
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const subU = tl.channel('submissionChip', 0);
  const oneU = tl.channel('oneAtATime', 0);
  const railR = tl.channel('railReveal', 0);
  const tokenU = tl.channel('token', -1); // in gate units
  const arcU = tl.channel('bounceArc', 0);
  const gates = GATE_LABELS.map((_, i) => tl.channel(`gate${i}`, 0));
  const probE = tl.channel('problemsCard', 0);
  const probRows = tl.channel('problemRows', 0);
  const histU = tl.channel('judgeHistoryChip', 0);
  const gSub = tl.channel('subFade', 1);
  const gProb = tl.channel('problemsFade', 1);
  const ovE = tl.channel('overlapPanel', 0);
  const ovBars = tl.channel('overlapBars', 0); // 0..2
  const ovFlag = tl.channel('overlapFlag', 0);
  const gOv = tl.channel('overlapFade', 1);
  const ddE = tl.channel('dedupPanel', 0);
  const ddScan = tl.channel('dedupScan', 0);
  const ddV = tl.channel('uniqueVerdict', 0);
  const gDd = tl.channel('dedupFade', 1);
  const gRail = tl.channel('railFade', 1);
  const bugPop = tl.channel('bugCard', 0);
  const doorsU = tl.channel('verdictDoors', 0); // 0..3

  /* ---- beat 1: submit, asynchronously, one at a time --------------------- */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Filing is asynchronous: the submission is accepted with an id, and the agent polls for a verdict. One bug at a time — parallel submissions race the duplicate check and mint copies.',
  });
  tl.tween(subU, 1, { at: t - 5.8, dur: 0.6, ease: ease.pop });
  tl.tween(oneU, 1, { at: t - 3.6, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* ---- beat 2: the gauntlet, two judges in fixed order -------------------- */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'Every submission now runs a gauntlet. Two judges, in a fixed order: requirements first, evidence second.',
  });
  tl.tween(gSub, 0, { at: t - 5.0, dur: 0.7, ease: ease.move });
  tl.tween(railR, 1, { at: t - 4.4, dur: 1.4, ease: ease.draw });
  tl.set(tokenU, 0, t - 2.8);
  tl.tween(gates[0], 1, { at: t - 2.6, dur: 0.4, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 3: the requirements judge -------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The requirements judge asks: is this even a valid bug? A feature request, a nitpick outside the filing criteria — those stop here, and they are never filed at all.',
  });
  tl.tween(tokenU, REQ_GATE, { at: t - 5.2, dur: 1.2, ease: ease.move });
  tl.tween(gates[REQ_GATE], 1, { at: t - 3.6, dur: 0.4, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 4: the evidence judge, the skeptic ------------------------------ */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'The evidence judge is the skeptic. It reads the re-executed results and asks whether the recording actually proves the story.',
  });
  tl.tween(tokenU, EVID_GATE, { at: t - 4.6, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* ---- beat 5: rejected — with specifics ------------------------------------ */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'And it says no. Problems come back, specific ones: the root cause hedges, and chain step two cites nothing.',
  });
  tl.tween(gates[EVID_GATE], -1, { at: t - 5.0, dur: 0.4, ease: ease.pop });
  tl.tween(probE, 1, { at: t - 4.2, dur: 0.6, ease: ease.enter });
  tl.tween(probRows, 2, { at: t - 3.6, dur: 1.6, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* ---- beat 6: rejection is homework — history rides along ------------------- */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Rejection isn’t the end — it’s homework. The agent gathers more evidence and resubmits, carrying the full judge history with it. Every attempt stays on the record.',
  });
  tl.tween(arcU, 1, { at: t - 5.6, dur: 1.2, ease: ease.move });
  tl.set(tokenU, 0, t - 4.3);
  tl.tween(histU, 1, { at: t - 3.8, dur: 0.5, ease: ease.pop });
  tl.tween(gProb, 0, { at: t - 1.2, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* ---- beat 7: lap two — the gates hold --------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 4.2,
    text: 'Second lap. This time, the gates hold.',
  });
  tl.set(arcU, 0, t - 4.1);
  tl.tween(gates[EVID_GATE], 0, { at: t - 4.0, dur: 0.5, ease: ease.move });
  tl.tween(tokenU, EVID_GATE, { at: t - 3.6, dur: 1.8, ease: ease.move });
  tl.tween(gates[EVID_GATE], 1, { at: t - 1.4, dur: 0.4, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 8: the interference check ------------------------------------------ */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'One more skeptical question: did another run interfere? The judge is shown every run that overlapped this one’s execution window, because parallel journeys mutate shared state.',
  });
  tl.tween(tokenU, OVERLAP_GATE, { at: t - 5.6, dur: 1.0, ease: ease.move });
  tl.tween(ovE, 1, { at: t - 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(ovBars, 2, { at: t - 3.8, dur: 1.6, ease: ease.enter });
  tl.tween(ovFlag, 1, { at: t - 1.8, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 9: flakes get called flakes ------------------------------------------ */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'A glitch that only happens while another journey rewrites your data isn’t this app’s bug — it’s a flake, and the overlap check is how it gets called one. Not this time.',
  });
  tl.tween(gates[OVERLAP_GATE], 1, { at: t - 1.6, dur: 0.4, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 10: dedup — one word back ---------------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Last gate: deduplication. A large model compares the report against the project’s three hundred most recent bugs and answers with one word — unique — or an existing bug’s id.',
  });
  tl.tween(gOv, 0, { at: t - 5.8, dur: 0.7, ease: ease.move });
  tl.tween(tokenU, DEDUP_GATE, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(ddE, 1, { at: t - 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(ddScan, 1, { at: t - 3.6, dur: 2.0, ease: ease.linear });
  tl.tween(ddV, 1, { at: t - 1.4, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 11: what a match would have done ----------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'A match wouldn’t file a new bug: it records a rediscovery on the old one, and reopens it if someone had marked it fixed. This one is unique.',
  });
  tl.tween(gates[DEDUP_GATE], 1, { at: t - 1.6, dur: 0.4, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 12: FILED — and the three doors ------------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Filed: bug two, critical, open — with the judge’s assessment riding on the row. And a report whose evidence fell short twice? Filed anyway as judge-rejected: preserved, labeled, never silently dropped.',
  });
  tl.tween(gDd, 0, { at: t - 6.4, dur: 0.7, ease: ease.move });
  tl.tween(tokenU, FILED_GATE, { at: t - 6.0, dur: 1.0, ease: ease.move });
  tl.tween(gates[FILED_GATE], 1, { at: t - 4.8, dur: 0.4, ease: ease.pop });
  tl.tween(gRail, 0.15, { at: t - 4.2, dur: 0.8, ease: ease.move });
  tl.tween(bugPop, 1, { at: t - 3.8, dur: 0.6, ease: ease.pop });
  tl.tween(doorsU, 3, { at: t - 2.8, dur: 2.0, ease: ease.enter });
  tl.hold(t, 1.4);

  return {
    tl,
    subU, oneU, railR, tokenU, arcU, gates, probE, probRows, histU,
    gSub, gProb, ovE, ovBars, ovFlag, gOv, ddE, ddScan, ddV, gDd,
    gRail, bugPop, doorsU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The 202 — a submission id, and the one-at-a-time rule. */
function SubmissionChip({ u, one }: { u: number; one: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const o = clamp01(one);
  return (
    <g transform={`translate(${SUB_CHIP.x}, ${SUB_CHIP.y + (1 - uu) * -8})`} opacity={uu}>
      <rect x={-230} y={-18} width={460} height={36} rx={18} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
      <text y={5} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontFamily={mono}>
        202 · {'{'}"submission_id": "bsub-…", "status": "pending"{'}'}
      </text>
      {o > 0 && (
        <g transform={`translate(0, 40)`} opacity={o}>
          <text textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontWeight={700} fontFamily={mono}>
            ONE submission at a time — wait, then poll
          </text>
        </g>
      )}
    </g>
  );
}

/** The evidence judge's problems — specific, actionable. */
function ProblemsCard({ e, rows }: { e: number; rows: number }) {
  const uu = clamp01(e);
  if (uu <= 0) return null;
  const { x, y, w } = PROB;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu}>
      <rect width={w} height={104} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.6} />
      <text x={16} y={24} fill={colors.NEGATIVE} fontSize={12.5} fontWeight={700} fontFamily={mono}>
        rejected · result.problems
      </text>
      {PROBLEMS.map((p, i) => {
        const cu = clamp01(rows - i);
        if (cu <= 0) return null;
        return (
          <g key={i} opacity={cu}>
            <circle cx={22} cy={46 + i * 26} r={3} fill={colors.NEGATIVE} />
            <text x={36} y={50 + i * 26} fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>
              {p}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The judge history riding on the resubmission. */
function HistoryChip({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const label = 'judge_submissions: [attempt 1]';
  const w = label.length * 6.8 + 22;
  return (
    <g transform={`translate(${RAIL.x}, ${RAIL.y - 118 + (1 - uu) * 8})`} opacity={uu}>
      <rect x={-14} y={-13} width={w} height={26} rx={13} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
      <text x={w / 2 - 14} y={4.5} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

/** Other runs against this run's execution window — overlaps_this_run. */
function OverlapPanel({ e, bars, flag }: { e: number; bars: number; flag: number }) {
  const uu = clamp01(e);
  if (uu <= 0) return null;
  const { x, y, w } = OVERLAP;
  const trackW = w - 32;
  const winX = 16 + WINDOW.start * trackW;
  const winW = (WINDOW.end - WINDOW.start) * trackW;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu}>
      <rect width={w} height={150} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={16} y={24} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        get-recent-runs · this run’s window
      </text>
      {/* this run's execution window */}
      <rect x={winX} y={36} width={winW} height={96} rx={6} fill={colors.ACCENT} opacity={0.1} />
      <rect x={winX} y={36} width={winW} height={96} rx={6} fill="none" stroke={colors.ACCENT} strokeWidth={1.2} strokeDasharray="4 4" />
      {RUNS.map((r, i) => {
        const cu = clamp01(bars - i);
        if (cu <= 0) return null;
        const bx = 16 + r.start * trackW;
        const bw = (r.end - r.start) * trackW * cu;
        const yy = 52 + i * 34;
        return (
          <g key={i} opacity={cu}>
            <rect x={bx} y={yy} width={bw} height={14} rx={7} fill={r.overlaps ? colors.WARM : colors.MUTED} opacity={r.overlaps ? 0.75 : 0.4} />
            <text x={16} y={yy + 11} fill={colors.MUTED} fontSize={10.5} fontFamily={mono} opacity={0.9}>
              {r.label.slice(0, 7)}
            </text>
            {r.overlaps && flag > 0 && (
              <text x={bx + 8} y={yy - 5} fill={colors.WARM} fontSize={10.5} fontWeight={700} fontFamily={mono} opacity={clamp01(flag)}>
                overlaps_this_run: true
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Opus dedup: candidates, a scan sweep, one word back. */
function DedupPanel({ e, scan, verdict }: { e: number; scan: number; verdict: number }) {
  const uu = clamp01(e);
  if (uu <= 0) return null;
  const { x, y, w } = DEDUP;
  const sc = clamp01(scan);
  const v = clamp01(verdict);
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu}>
      <rect width={w} height={150} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={16} y={24} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        findDuplicateBug() · claude-opus-4-6
      </text>
      {CANDIDATES.map((c, i) => (
        <text key={i} x={16} y={50 + i * 24} fill={i === 0 ? colors.TEXT : colors.MUTED} fontSize={11.5} fontFamily={mono}>
          {c}
        </text>
      ))}
      {/* scan sweep over the candidate list */}
      {sc > 0.01 && sc < 0.99 && (
        <rect x={12} y={34 + sc * 60} width={w - 24} height={22} rx={5} fill={colors.SECONDARY} opacity={0.14} />
      )}
      {v > 0 && (
        <g transform={`translate(${w / 2}, 118) scale(${0.8 + 0.2 * v})`} opacity={v}>
          <rect x={-84} y={-16} width={168} height={32} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} />
          <text y={5.5} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={800} letterSpacing={2} fontFamily={mono}>
            “unique”
          </text>
        </g>
      )}
    </g>
  );
}

/** The filed bug + the three verdict doors. */
function FiledCard({ pop, doors }: { pop: number; doors: number }) {
  const uu = clamp01(pop);
  if (uu <= 0) return null;
  const { x, y } = FINAL;
  const DOORS = [
    { label: 'approved → open', color: colors.POSITIVE },
    { label: 'evidence-rejected → judge-rejected', color: colors.WARM },
    { label: 'requirements-rejected → not filed', color: colors.NEGATIVE },
  ];
  return (
    <g transform={`translate(${x}, ${y})`} opacity={uu}>
      <rect x={-330} y={-56} width={660} height={64} rx={12} fill={colors.BG} opacity={0.92} />
      <rect x={-330} y={-56} width={660} height={64} rx={12} fill="none" stroke={colors.POSITIVE} strokeWidth={1.8} />
      <rect x={-312} y={-40} width={82} height={24} rx={12} fill={colors.NEGATIVE} opacity={0.2} />
      <text x={-271} y={-23} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        critical
      </text>
      <rect x={-222} y={-40} width={62} height={24} rx={12} fill={colors.POSITIVE} opacity={0.2} />
      <text x={-191} y={-23} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        open
      </text>
      <text x={-140} y={-22} fill={colors.TEXT} fontSize={14} fontWeight={700}>
        bug-002 · Checkout fails with 500 error on payment submission
      </text>
      {DOORS.map((d, i) => {
        const cu = clamp01(doors - i);
        if (cu <= 0) return null;
        const dx = -220 + i * 220;
        return (
          <g key={i} transform={`translate(${dx}, ${44 + (1 - cu) * 8})`} opacity={cu}>
            <rect x={-102} y={-14} width={204} height={28} rx={14} fill={colors.PANEL} stroke={d.color} strokeWidth={1.4} />
            <text y={4.5} textAnchor="middle" fill={d.color} fontSize={9.5} fontWeight={700} fontFamily={mono}>
              {d.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const gSub = s.get(scene.gSub);
  const gProb = s.get(scene.gProb);
  const gOv = s.get(scene.gOv);
  const gDd = s.get(scene.gDd);
  const gRail = s.get(scene.gRail);

  return (
    <>
      {gSub > 0.002 && <SubmissionChip u={s.get(scene.subU) * gSub} one={s.get(scene.oneU) * gSub} />}

      <g opacity={0.15 + 0.85 * gRail}>
        <GauntletRail
          x={RAIL.x}
          y={RAIL.y}
          w={RAIL.w}
          gates={GATE_LABELS.map((label, i) => ({ label, state: s.get(scene.gates[i]) }))}
          u={s.get(scene.tokenU)}
          reveal={s.get(scene.railR)}
          arcU={s.get(scene.arcU)}
          arcFrom={EVID_GATE}
          tokenColor={colors.SECONDARY}
        />
        <HistoryChip u={s.get(scene.histU) * gRail} />
      </g>

      {gProb > 0.002 && (
        <g opacity={gProb}>
          <ProblemsCard e={s.get(scene.probE)} rows={s.get(scene.probRows)} />
        </g>
      )}
      {gOv > 0.002 && (
        <g opacity={gOv}>
          <OverlapPanel e={s.get(scene.ovE)} bars={s.get(scene.ovBars)} flag={s.get(scene.ovFlag)} />
        </g>
      )}
      {gDd > 0.002 && (
        <g opacity={gDd}>
          <DedupPanel e={s.get(scene.ddE)} scan={s.get(scene.ddScan)} verdict={s.get(scene.ddV)} />
        </g>
      )}

      <FiledCard pop={s.get(scene.bugPop)} doors={s.get(scene.doorsU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
