// Book scene — builder-critic-loop, chapter 3: "The Critic Attacks".
// The AGENTS.md Critic charter as one attack run: a fresh session receives
// the readme, the diff, and the evidence (ORIENT), writes a falsifiable
// prediction BEFORE inspecting state, interrogates the builder's recorded
// session through the Replay MCP, holds every changed hunk against the run
// (COVERAGE via DiffLanes), cold-clones and sabotages, then issues a
// verdict where every finding cites a point — and promotes what deserves
// to outlive the pass into the permanent suite.
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { DiffLanes, PredictionCard, RecordingStrip } from '../../agent';
import type { DiffHunk, HunkClass, RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------- layout at module scope — 1280×720, bottom ~12% clear */

const INPUTS = [
  { x: 60, title: 'task readme.md', color: colors.ACCENT, lines: ['claims · acceptance criteria', 'the task’s own attack list'] },
  { x: 460, title: 'the diff', color: colors.WARM, lines: ['git diff, scoped to the', 'task’s commits'] },
  { x: 860, title: 'the evidence', color: colors.TEAL, lines: ['event log + digests', 'Replay recording URL'] },
];
const INPUT_Y = 108;
const INPUT_W = 360;
const INPUT_H = 118;

const PRED = { x: 60, y: 300, w: 520 };
const PRED_TEXT = 'replay of evidence/e0-t12-final.jsonl reaches digest 4f21… at offset 009000';
const OBSERVED = 'observed: a01c… — the cited log is stale';

const STRIP = { x: 660, y: 322, w: 540 };
const MCP_TOOLS = ['Evaluate', 'Logpoint', 'NetworkRequest', 'GetPointLink'];
const POINTS: RecordingPoint[] = [
  { at: 0.1, kind: 'interaction', label: 'walkthrough starts' },
  { at: 0.3, kind: 'network', label: 'POST /streams' },
  { at: 0.48, kind: 'render', label: 'offset in DOM' },
  { at: 0.66, kind: 'exception', label: '' },
  { at: 0.86, kind: 'render', label: 'digest render' },
];
const LINK_AT = 0.66;

const DIFF = { x: 80, y: 130, w: 560 };
const HUNKS: { label: string; kind: HunkClass; hits: number }[] = [
  { label: 'bisect-command.ts: runBisect()', kind: 'executed', hits: 14 },
  { label: 'malformed-input error path', kind: 'needs-proof', hits: 0 },
  { label: 'replay-command.ts: unused helper', kind: 'dead', hits: 0 },
  { label: 'types + config', kind: 'waived', hits: 0 },
];

const HUNT = { x: 720, y: 130, w: 490, h: 118 };
const SAB = { x: 720, y: 282, w: 490, h: 118 };

const VERDICT = { x: 80, y: 428, w: 660, h: 168 };
const SUITE = { x: 800, y: 428, w: 410, h: 168 };
const VERDICT_LINES = [
  '### 2026-07-15 — critic — VERDICT: refuted',
  '- P1 digest parity — FAILED. predicted 4f21…, observed a01c…;',
  '  bisect pins offset 009000. recording …?point=8241&time=41250',
  '- COVERAGE malformed-path — INSUFFICIENT: never executed. record or delete.',
];

/* -------------------------------------------------------------- timeline */

export function buildScene() {
  const tl = new Timeline();

  // beat 0 — orient: readme, diff, evidence
  const inputE = tl.channel('inputCards', 0);
  const freshU = tl.channel('freshChip', 0);
  const orientU = tl.channel('orientSweep', 0);
  const gA = tl.channel('inputsFade', 1);

  // beat 1 — predict, then verify
  const predE = tl.channel('predEnter', 0);
  const stampU = tl.channel('predStamp', 0);
  const predT = tl.channel('predText', 0);

  // beat 2 — interrogate the recording through the Replay MCP
  const stripR = tl.channel('stripReveal', 0);
  const stripU = tl.channel('stripSweep', 0);
  const mcpU = tl.channel('mcpChips', 0);
  const linkU = tl.channel('pointLink', 0);
  const obsU = tl.channel('predObserved', 0);
  const failU = tl.channel('predFailed', 0);

  // beat 3 — coverage: the diff held against the recording
  const diffU = tl.channel('diffRows', 0);
  const hitsU = tl.channel('diffHits', 0);
  const classU = tl.channel('diffClass', 0);
  const gB = tl.channel('coverageFade', 1);

  // beat 4 — mock & env hunt + sabotage
  const huntE = tl.channel('huntEnter', 0);
  const coldU = tl.channel('coldChip', 0);
  const sabE = tl.channel('sabEnter', 0);
  const redU = tl.channel('testsRed', 0);

  // beat 5 — the verdict, cited
  const verdictE = tl.channel('verdictEnter', 0);
  const verdictT = tl.channel('verdictLines', 0);
  const citeU = tl.channel('citeChip', 0);

  // beat 6 — promotion into the suite
  const suiteE = tl.channel('suiteEnter', 0);
  const promoU = tl.channel('promoChips', 0);

  /* beat 0 — a fresh session, oriented before it attacks */
  let t = 0.4;
  t = tl.caption({ at: t, dur: 5.8, text: 'A fresh session gets the readme, the diff, and the evidence. Orient first.' });
  tl.tween(inputE, 3, { at: t - 5.4, dur: 1.8, ease: ease.enter });
  tl.tween(freshU, 1, { at: t - 3.2, dur: 0.5, ease: ease.pop });
  tl.tween(orientU, 1, { at: t - 2.4, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.7);

  /* beat 1 — the falsifiable prediction lands BEFORE any state is read */
  t = tl.caption({ at: t, dur: 6.0, text: 'Write the falsifiable prediction BEFORE looking — else it is just a caption.' });
  tl.tween(predE, 1, { at: t - 5.6, dur: 0.6, ease: ease.enter });
  tl.tween(stampU, 1, { at: t - 5.0, dur: 0.5, ease: ease.pop });
  tl.tween(predT, 1, { at: t - 4.3, dur: 2.6, ease: ease.linear });
  t = tl.hold(t, 0.7);

  /* beat 2 — the Replay MCP: interrogate the session, never a rerun */
  t = tl.caption({ at: t, dur: 6.4, text: 'Never re-drive the app: interrogate the recorded session through the Replay MCP.' });
  tl.tween(stripR, 1, { at: t - 6.0, dur: 1.3, ease: ease.draw });
  tl.tween(mcpU, 1, { at: t - 4.8, dur: 1.1, ease: ease.enter });
  tl.tween(stripU, 1, { at: t - 4.2, dur: 3.4, ease: ease.linear });
  tl.tween(linkU, 1, { at: t - 1.8, dur: 0.5, ease: ease.pop });
  tl.tween(obsU, 1, { at: t - 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(failU, 1, { at: t - 0.5, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.8);

  /* beat 3 — coverage: hold every changed hunk against the recorded run */
  t = tl.caption({ at: t, dur: 6.2, text: 'Coverage: every changed hunk executed, needs-evidence, dead, or waived.' });
  tl.tween(gA, 0.1, { at: t - 6.0, dur: 0.8, ease: ease.move });
  tl.tween(diffU, HUNKS.length, { at: t - 5.2, dur: 1.8, ease: ease.enter });
  tl.tween(hitsU, HUNKS[0].hits, { at: t - 3.2, dur: 1.2, ease: ease.move });
  tl.tween(classU, HUNKS.length, { at: t - 2.0, dur: 1.6, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* beat 4 — cold clones and sabotage */
  t = tl.caption({ at: t, dur: 6.0, text: 'Cold-clone the acceptance run; sabotage the impl — tests must go red.' });
  tl.tween(huntE, 1, { at: t - 5.6, dur: 0.6, ease: ease.enter });
  tl.tween(coldU, 1, { at: t - 4.6, dur: 0.5, ease: ease.pop });
  tl.tween(sabE, 1, { at: t - 3.4, dur: 0.6, ease: ease.enter });
  tl.tween(redU, 1, { at: t - 2.0, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.7);

  /* beat 5 — the verdict: every finding cites a point */
  t = tl.caption({ at: t, dur: 6.2, text: 'VERDICT: refuted — and every finding cites a point anyone can jump to.' });
  tl.tween(gB, 0.35, { at: t - 6.0, dur: 0.8, ease: ease.move });
  tl.tween(verdictE, 1, { at: t - 5.4, dur: 0.6, ease: ease.enter });
  tl.tween(verdictT, VERDICT_LINES.length, { at: t - 4.6, dur: 3.0, ease: ease.linear });
  tl.tween(citeU, 1, { at: t - 1.2, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* beat 6 — promote what compounds */
  t = tl.caption({ at: t, dur: 5.8, text: 'What survives gets promoted: a test, a golden log, fuzz seeds.' });
  tl.tween(suiteE, 1, { at: t - 5.4, dur: 0.6, ease: ease.enter });
  tl.tween(promoU, 4, { at: t - 4.4, dur: 2.4, ease: ease.enter });
  tl.hold(t, 1.6);

  return {
    tl,
    inputE, freshU, orientU, gA,
    predE, stampU, predT,
    stripR, stripU, mcpU, linkU, obsU, failU,
    diffU, hitsU, classU, gB,
    huntE, coldU, sabE, redU,
    verdictE, verdictT, citeU,
    suiteE, promoU,
  };
}

const scene = buildScene();

/* ------------------------------------------- local subcomponents (pure) */

function Chip({ x, y, text, u, color, size = 12 }: { x: number; y: number; text: string; u: number; color: string; size?: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * size * 0.62 + 22;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * -6})`} opacity={uu}>
      <rect x={-w / 2} y={-13} width={w} height={26} rx={13} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fill={color} fontSize={size} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

function Panel({ x, y, w, h, u, title, color, lines = [] }: { x: number; y: number; w: number; h: number; u: number; title: string; color: string; lines?: { text: string; color?: string }[] }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 14})`} opacity={uu}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={16} y={26} fill={color} fontSize={14} fontWeight={700} fontFamily={mono}>
        {title}
      </text>
      {lines.map((l, i) => (
        <text key={i} x={16} y={52 + i * 22} fill={l.color ?? colors.MUTED} fontSize={12.5} fontFamily={mono}>
          {l.text}
        </text>
      ))}
    </g>
  );
}

/* --------------------------------- render (pure function of SceneState) */

export function Render({ s }: { s: SceneState }) {
  const gA = clamp01(s.get(scene.gA));
  const gB = clamp01(s.get(scene.gB));
  const inputN = s.get(scene.inputE);
  const orient = clamp01(s.get(scene.orientU));
  const verdictN = s.get(scene.verdictT);
  const promoN = s.get(scene.promoU);

  const hunks: DiffHunk[] = HUNKS.map((h, i) => ({
    label: h.label,
    kind: h.kind,
    hits: i === 0 ? s.get(scene.hitsU) : 0,
    u: clamp01(s.get(scene.diffU) - i),
    classU: clamp01(s.get(scene.classU) - i),
  }));

  return (
    <>
      {/* ——— beats 0–2: orient, predict, interrogate ——— */}
      <g opacity={gA}>
        {INPUTS.map((p, i) => (
          <Panel key={p.title} x={p.x} y={INPUT_Y} w={INPUT_W} h={INPUT_H} u={clamp01(inputN - i)} title={p.title} color={p.color}
            lines={p.lines.map((text) => ({ text }))}
          />
        ))}
        <Chip x={640} y={64} text="a FRESH session — read-only, out to refute" u={s.get(scene.freshU)} color={colors.NEGATIVE} size={12.5} />
        {orient > 0 && (
          <g opacity={orient}>
            <Chip x={200} y={INPUT_Y + INPUT_H + 26} text="cheap sweeps: exceptions? .skip’d tests?" u={orient} color={colors.MUTED} size={11.5} />
            <Chip x={1010} y={INPUT_Y + INPUT_H + 26} text="stale digest = fail immediately" u={clamp01(orient * 2 - 1)} color={colors.NEGATIVE} size={11.5} />
          </g>
        )}

        <PredictionCard
          x={PRED.x} y={PRED.y} w={PRED.w}
          text={PRED_TEXT}
          stamp="predicted — before inspecting"
          stampU={s.get(scene.stampU)}
          u={s.get(scene.predT)}
          enter={s.get(scene.predE)}
          observed={OBSERVED}
          observedU={s.get(scene.obsU)}
          verdictKind="failed"
          verdictU={s.get(scene.failU)}
          link="⌖ point @ 41.2s"
          linkU={s.get(scene.linkU)}
        />

        <RecordingStrip
          x={STRIP.x} y={STRIP.y} w={STRIP.w}
          points={POINTS}
          reveal={s.get(scene.stripR)}
          u={s.get(scene.stripU)}
          links={[{ at: LINK_AT, label: 'point @ 41.2s', pop: s.get(scene.linkU) }]}
          title="the builder’s recording — interrogated, not re-run"
        />
        {clamp01(s.get(scene.mcpU)) > 0 && (
          <g>
            {MCP_TOOLS.map((tool, i) => (
              <Chip key={tool} x={STRIP.x + 70 + i * 136} y={STRIP.y + 92} text={tool} u={clamp01(s.get(scene.mcpU) * (MCP_TOOLS.length + 1) - i)} color={colors.SECONDARY} size={11.5} />
            ))}
            <text x={STRIP.x} y={STRIP.y + 128} fill={colors.MUTED} fontSize={11.5} fontFamily={mono} opacity={clamp01(s.get(scene.mcpU))}>
              Replay MCP — .mcp.json: npx -y replayio mcp
            </text>
          </g>
        )}
      </g>

      {/* ——— beats 3–4: coverage + the dirty tricks ——— */}
      <g opacity={gB < 1 ? 0.1 + 0.9 * gB : 1}>
        <DiffLanes x={DIFF.x} y={DIFF.y} w={DIFF.w} hunks={hunks} title="the diff, held against the recording" />
        <Panel x={HUNT.x} y={HUNT.y} w={HUNT.w} h={HUNT.h} u={s.get(scene.huntE)} title="MOCK & ENV HUNT" color={colors.WARM}
          lines={[
            { text: 'self-licking goldens · seeded RNG · warm servers' },
            { text: 'tools/verify/cold_clone.sh — pristine clone,', color: colors.TEXT },
            { text: 'scrubbed env (NODE_ENV, npm_config_* unset)', color: colors.TEXT },
          ]}
        />
        <Chip x={HUNT.x + HUNT.w - 116} y={HUNT.y + 24} text="cold clone ✓" u={s.get(scene.coldU)} color={colors.POSITIVE} size={11.5} />
        <Panel x={SAB.x} y={SAB.y} w={SAB.w} h={SAB.h} u={s.get(scene.sabE)} title="SABOTAGE — scratch worktree" color={colors.NEGATIVE}
          lines={[
            { text: 'invert a condition · off-by-one an offset', color: colors.TEXT },
            { text: 'a suite that stays green under sabotage', color: colors.MUTED },
            { text: 'is itself a finding', color: colors.MUTED },
          ]}
        />
        <Chip x={SAB.x + SAB.w - 130} y={SAB.y + 24} text="pnpm test → RED ✓" u={s.get(scene.redU)} color={colors.NEGATIVE} size={11.5} />
      </g>

      {/* ——— beats 5–6: the cited verdict, then promotion ——— */}
      <Panel x={VERDICT.x} y={VERDICT.y} w={VERDICT.w} h={VERDICT.h} u={s.get(scene.verdictE)} title="Verification log entry" color={colors.NEGATIVE}
        lines={VERDICT_LINES.map((text, i) => ({ text, color: clamp01(verdictN - i) > 0.5 ? (i === 0 ? colors.NEGATIVE : colors.TEXT) : 'transparent' }))}
      />
      <Chip x={VERDICT.x + VERDICT.w - 150} y={VERDICT.y - 4} text="citations, not vibes" u={s.get(scene.citeU)} color={colors.TEAL} size={11.5} />

      <Panel x={SUITE.x} y={SUITE.y} w={SUITE.w} h={SUITE.h} u={s.get(scene.suiteE)} title="SUITE — what outlives the pass" color={colors.POSITIVE} />
      <Chip x={SUITE.x + 160} y={SUITE.y + 62} text="bisect_critic_attacks.mjs" u={clamp01(promoN)} color={colors.POSITIVE} size={11.5} />
      <Chip x={SUITE.x + 310} y={SUITE.y + 100} text="golden log + digest" u={clamp01(promoN - 1)} color={colors.POSITIVE} size={11.5} />
      <Chip x={SUITE.x + 110} y={SUITE.y + 100} text="fuzz seeds" u={clamp01(promoN - 2)} color={colors.POSITIVE} size={11.5} />
      <Chip x={SUITE.x + 240} y={SUITE.y + 138} text="make verify-*" u={clamp01(promoN - 3)} color={colors.POSITIVE} size={11.5} />
    </>
  );
}

// registry adapter — steps embed this via viz { scene: 'books/builder-critic-loop/chapter-3', beat: i }
export const vizScene = () => scene;
