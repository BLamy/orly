// Book scene — builder-critic-loop, chapter 2: "The Builder's Gauntlet".
// The AGENTS.md Builder protocol, played out on one task: pick the top of
// QUEUE.md and read the attack list, run the gates in ascending cost (any
// failure returns to the top — the GauntletRail bounce), self-validate
// without limit in the gitignored work/ folder (none of it is evidence),
// prove browser-reaching work under Playwright + Replay Chromium, get BOTH
// artifacts from ONE recorded session, then write the claim as a
// Verification log entry and flip status: implemented.
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, ServiceNode } from '../../primitives';
import { GauntletRail, RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------- layout at module scope — 1280×720, bottom ~12% clear */

const QUEUE = { x: 60, y: 96, w: 320, h: 160 };
const README = { x: 440, y: 96, w: 380, h: 160 };
const WORK = { x: 870, y: 96, w: 350, h: 160 };
const RAIL = { x: 170, y: 452, w: 940 };
const GATE_LABELS = ['fmt + lint', 'typecheck', 'tests', 'build'];
const FAIL_GATE = 2; // pnpm test goes red on the first lap

const PW = { x: 200, y: 150 };
const APP = { x: 520, y: 150 };
const CHROMIUM = { x: 880, y: 150 };
const STRIP2 = { x: 100, y: 306, w: 580 };
const EVID = { x: 800, y: 272, w: 400, h: 158 };
const CLAIMP = { x: 100, y: 452, w: 640, h: 152 };

const POINTS: RecordingPoint[] = [
  { at: 0.06, kind: 'interaction', label: 'load app' },
  { at: 0.26, kind: 'interaction', label: 'drive walkthrough' },
  { at: 0.46, kind: 'network', label: 'append event' },
  { at: 0.64, kind: 'render', label: 'offset in DOM' },
  { at: 0.84, kind: 'render', label: 'digest match' },
];

const CLAIM_LINES = [
  '### 2026-07-14 — builder — claim',
  'commit 3f9c2e1 · pnpm test · ef replay evidence/e0-t12-final.jsonl --digest',
  'Replay: https://app.replay.io/recording/9f2e… · recordings/e0-t12-final.mp4',
  'the recording demonstrates: bisect pins divergence at offset 009000, exit 1',
];

/* -------------------------------------------------------------- timeline */

export function buildScene() {
  const tl = new Timeline();

  // beat 0 — pick work, read the attack list
  const queueE = tl.channel('queueEnter', 0);
  const pickU = tl.channel('pickChip', 0);
  const readmeE = tl.channel('readmeEnter', 0);
  const attackU = tl.channel('attackGlow', 0);
  const gA = tl.channel('pickFade', 1);

  // beat 1 — the gates, ascending cost, bounce on failure
  const railR = tl.channel('railReveal', 0);
  const tokU = tl.channel('railToken', -1);
  const arcU = tl.channel('railArc', 0);
  const gates = GATE_LABELS.map((_, i) => tl.channel(`gate${i}`, 0));
  const gRail = tl.channel('railFade', 1);

  // beat 2 — work/: the free inner loop that proves nothing
  const workE = tl.channel('workEnter', 0);
  const workChips = tl.channel('workChips', 0);
  const workStamp = tl.channel('workStamp', 0);

  // beat 3 — prove it in the browser
  const pwU = tl.channel('playwrightU', 0);
  const appU = tl.channel('appU', 0);
  const chromU = tl.channel('chromiumU', 0);
  const connU = tl.channel('connU', 0);
  const connFlow = tl.channel('connFlow', 0);
  const zeroU = tl.channel('zeroErrors', 0);
  const gB = tl.channel('browserFade', 1);

  // beat 4 — one session, both artifacts
  const stripR = tl.channel('stripReveal', 0);
  const stripU = tl.channel('stripSweep', 0);
  const mp4U = tl.channel('mp4Chip', 0);
  const urlU = tl.channel('urlChip', 0);
  const evidE = tl.channel('evidenceEnter', 0);
  const evidChips = tl.channel('evidenceChips', 0);

  // beat 5 — the claim
  const claimE = tl.channel('claimEnter', 0);
  const claimT = tl.channel('claimLines', 0);
  const silenceU = tl.channel('silenceNote', 0);

  // beat 6 — implemented, waiting for the critic
  const implU = tl.channel('implementedChip', 0);
  const rebuildU = tl.channel('rebuildChip', 0);
  const waitU = tl.channel('criticNote', 0);

  /* beat 0 — pick the top task; the readme says how you'll be attacked */
  let t = 0.4;
  t = tl.caption({ at: t, dur: 5.8, text: 'Read the whole task readme first — the attack list says how you will be judged.' });
  tl.tween(queueE, 1, { at: t - 5.4, dur: 0.6, ease: ease.enter });
  tl.tween(pickU, 1, { at: t - 4.4, dur: 0.5, ease: ease.pop });
  tl.tween(readmeE, 1, { at: t - 3.8, dur: 0.7, ease: ease.enter });
  tl.tween(attackU, 1, { at: t - 2.4, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.7);

  /* beat 1 — gates in ascending cost; any failure returns to the top */
  t = tl.caption({ at: t, dur: 6.4, text: 'Gates in ascending cost: fmt+lint → typecheck → tests → build. Fail = back to top.' });
  tl.tween(railR, 1, { at: t - 6.0, dur: 1.3, ease: ease.draw });
  tl.set(tokU, 0, t - 4.6);
  tl.tween(tokU, FAIL_GATE, { at: t - 4.5, dur: 1.6, ease: ease.move });
  tl.tween(gates[0], 1, { at: t - 4.2, dur: 0.4, ease: ease.pop });
  tl.tween(gates[1], 1, { at: t - 3.4, dur: 0.4, ease: ease.pop });
  tl.tween(gates[FAIL_GATE], -1, { at: t - 2.7, dur: 0.4, ease: ease.pulse });
  tl.tween(arcU, 1, { at: t - 2.2, dur: 1.1, ease: ease.move });
  tl.set(tokU, 0, t - 1.05);
  tl.tween(gates[FAIL_GATE], 0, { at: t - 1.0, dur: 0.5, ease: ease.move });
  tl.tween(tokU, GATE_LABELS.length - 1, { at: t - 0.9, dur: 2.6, ease: ease.linear });
  for (let i = 0; i < GATE_LABELS.length; i++) {
    tl.tween(gates[i], 1, { at: t - 0.9 + (i * 2.6) / (GATE_LABELS.length - 1), dur: 0.4, ease: ease.pop });
  }
  t = tl.hold(t, 2.1);

  /* beat 2 — self-validation is unlimited, gitignored, and not evidence */
  t = tl.caption({ at: t, dur: 5.6, text: 'Self-validate without limit in work/ — none of it is evidence.' });
  tl.tween(workE, 1, { at: t - 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(workChips, 3, { at: t - 4.3, dur: 1.6, ease: ease.enter });
  tl.tween(workStamp, 1, { at: t - 2.2, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.7);

  /* beat 3 — browser-impacting ⇒ prove it in the browser */
  t = tl.caption({ at: t, dur: 6.0, text: 'Browser-reaching change? Playwright drives it; Replay Chromium records the run.' });
  tl.tween(gA, 0.12, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(gRail, 0.12, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(pwU, 1, { at: t - 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(appU, 1, { at: t - 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(connU, 1, { at: t - 4.0, dur: 1.1, ease: ease.draw });
  tl.tween(connFlow, 1, { at: t - 2.9, dur: 2.0, ease: ease.linear });
  tl.tween(zeroU, 1, { at: t - 2.4, dur: 0.5, ease: ease.pop });
  tl.tween(chromU, 1, { at: t - 1.6, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* beat 4 — one recorded session yields the MP4 AND the Replay URL */
  t = tl.caption({ at: t, dur: 6.2, text: 'One session, two artifacts: a verified MP4 and the uploaded Replay recording.' });
  tl.tween(stripR, 1, { at: t - 5.8, dur: 1.3, ease: ease.draw });
  tl.tween(stripU, 1, { at: t - 4.4, dur: 4.6, ease: ease.linear });
  tl.tween(mp4U, 1, { at: t - 3.4, dur: 0.5, ease: ease.pop });
  tl.tween(urlU, 1, { at: t - 2.7, dur: 0.5, ease: ease.pop });
  tl.tween(evidE, 1, { at: t - 2.0, dur: 0.7, ease: ease.enter });
  tl.tween(evidChips, 3, { at: t - 1.2, dur: 1.4, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* beat 5 — the claim names its evidence; silence is forbidden */
  t = tl.caption({ at: t, dur: 6.2, text: 'The claim: commit, commands, evidence paths, Replay URL — silence is forbidden.' });
  tl.tween(claimE, 1, { at: t - 5.8, dur: 0.7, ease: ease.enter });
  tl.tween(claimT, CLAIM_LINES.length, { at: t - 5.0, dur: 3.4, ease: ease.linear });
  tl.tween(silenceU, 1, { at: t - 1.3, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* beat 6 — implemented ≠ verified; the critic is next */
  t = tl.caption({ at: t, dur: 6.0, text: 'status: implemented. Queue rebuilt, committed — now it waits for the critic.' });
  tl.tween(gB, 0.6, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(implU, 1, { at: t - 5.0, dur: 0.5, ease: ease.pop });
  tl.tween(rebuildU, 1, { at: t - 4.0, dur: 0.5, ease: ease.pop });
  tl.tween(waitU, 1, { at: t - 2.8, dur: 0.7, ease: ease.enter });
  tl.hold(t, 1.6);

  return {
    tl,
    queueE, pickU, readmeE, attackU, gA,
    railR, tokU, arcU, gates, gRail,
    workE, workChips, workStamp,
    pwU, appU, chromU, connU, connFlow, zeroU, gB,
    stripR, stripU, mp4U, urlU, evidE, evidChips,
    claimE, claimT, silenceU,
    implU, rebuildU, waitU,
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

function Stamp({ x, y, text, u, color }: { x: number; y: number; text: string; u: number; color: string }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * 9.5 + 26;
  const k = 1.5 - 0.5 * uu;
  return (
    <g transform={`translate(${x}, ${y}) rotate(-7) scale(${k})`} opacity={uu}>
      <rect x={-w / 2} y={-16} width={w} height={32} rx={5} fill="none" stroke={color} strokeWidth={2.5} />
      <text y={5.5} textAnchor="middle" fill={color} fontSize={15} fontWeight={800} fontFamily={mono} letterSpacing={2}>
        {text}
      </text>
    </g>
  );
}

function Panel({ x, y, w, h, u, title, color, dim = 0, lines = [] }: { x: number; y: number; w: number; h: number; u: number; title: string; color: string; dim?: number; lines?: { text: string; color?: string; mono?: boolean }[] }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 14})`} opacity={uu * (1 - 0.88 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={16} y={26} fill={color} fontSize={14} fontWeight={700} fontFamily={mono}>
        {title}
      </text>
      {lines.map((l, i) => (
        <text key={i} x={16} y={52 + i * 22} fill={l.color ?? colors.MUTED} fontSize={12.5} fontFamily={l.mono === false ? undefined : mono}>
          {l.text}
        </text>
      ))}
    </g>
  );
}

/* --------------------------------- render (pure function of SceneState) */

export function Render({ s }: { s: SceneState }) {
  const gA = clamp01(s.get(scene.gA));
  const gRail = clamp01(s.get(scene.gRail));
  const gB = clamp01(s.get(scene.gB));
  const workChips = s.get(scene.workChips);
  const evidChips = s.get(scene.evidChips);
  const claimN = s.get(scene.claimT);
  const attack = clamp01(s.get(scene.attackU));

  return (
    <>
      {/* ——— beat 0: QUEUE.md → the task readme and its attack list ——— */}
      <g opacity={gA}>
        <Panel
          x={QUEUE.x} y={QUEUE.y} w={QUEUE.w} h={QUEUE.h} u={s.get(scene.queueE)} title="QUEUE.md — Next up" color={colors.ACCENT}
          lines={[
            { text: '1. E0-T12 — ef bisect', color: colors.TEXT },
            { text: '2. E0-T13 — snapshot read' },
            { text: '3. E0-T14 — watch events' },
          ]}
        />
        <Chip x={QUEUE.x + QUEUE.w / 2} y={QUEUE.y + QUEUE.h + 24} text="top of Next up · status: in-progress" u={s.get(scene.pickU)} color={colors.ACCENT} size={11.5} />
        <Panel
          x={README.x} y={README.y} w={README.w} h={README.h} u={s.get(scene.readmeE)} title="E0-T12/readme.md" color={colors.TEXT}
          lines={[
            { text: 'acceptance criteria: exit 1 + first offset' },
            { text: 'Adversarial verification:', color: colors.NEGATIVE },
            { text: '· reconvergent logs · malformed events', color: colors.NEGATIVE },
            { text: '· 10k-event probe budget', color: colors.NEGATIVE },
          ]}
        />
        {attack > 0 && (
          <rect x={README.x + 8} y={README.y + 62} width={README.w - 16} height={88} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} opacity={attack * 0.9} />
        )}
        <Chip x={README.x + README.w / 2} y={README.y + README.h + 24} text="build for the attack" u={attack} color={colors.NEGATIVE} />

        {/* ——— beat 2: work/ — the whole workshop, none of it evidence ——— */}
        <Panel x={WORK.x} y={WORK.y} w={WORK.w} h={WORK.h} u={s.get(scene.workE)} title="work/ (gitignored)" color={colors.TEAL} />
        <Chip x={WORK.x + 90} y={WORK.y + 62} text="probe.mjs" u={clamp01(workChips)} color={colors.TEAL} size={11.5} />
        <Chip x={WORK.x + 240} y={WORK.y + 62} text="ad-hoc runs" u={clamp01(workChips - 1)} color={colors.TEAL} size={11.5} />
        <Chip x={WORK.x + 140} y={WORK.y + 104} text="throwaway sessions" u={clamp01(workChips - 2)} color={colors.TEAL} size={11.5} />
        <Stamp x={WORK.x + WORK.w - 78} y={WORK.y + 128} text="NOT EVIDENCE" u={s.get(scene.workStamp)} color={colors.WARM} />
      </g>

      {/* ——— beat 1: the gauntlet rail — fail anywhere, back to the top ——— */}
      <g opacity={gRail}>
        <GauntletRail
          x={RAIL.x} y={RAIL.y} w={RAIL.w}
          gates={GATE_LABELS.map((label, i) => ({ label, state: s.get(scene.gates[i]) }))}
          reveal={s.get(scene.railR)}
          u={s.get(scene.tokU)}
          arcU={s.get(scene.arcU)}
          arcFrom={FAIL_GATE}
          tokenColor={colors.POSITIVE}
        />
        {s.get(scene.railR) > 0.9 && (
          <text x={RAIL.x + RAIL.w / 2} y={RAIL.y + 64} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} opacity={gRail}>
            ascending cost — cheap checks fail fast, any failure returns to the top
          </text>
        )}
      </g>

      {/* ——— beats 3–5: the browser proof, the artifacts, the claim ——— */}
      <g opacity={gB < 1 ? 0.12 + 0.88 * gB : 1}>
        <ServiceNode {...PW} kind="server" label="Playwright" sublabel="headless driver" u={s.get(scene.pwU)} />
        <ServiceNode {...APP} kind="browser" label="built web app" sublabel="apps/web" u={s.get(scene.appU)} />
        <ServiceNode {...CHROMIUM} kind="external" label="Replay Chromium" sublabel="record-run.sh" u={s.get(scene.chromU)} glow={clamp01(s.get(scene.chromU)) * 0.5} />
        <Connection from={{ x: PW.x + 60, y: PW.y }} to={{ x: APP.x - 60, y: APP.y }} u={s.get(scene.connU)} flow={s.get(scene.connFlow)} label="pointer + keyboard" />
        <Chip x={(APP.x + CHROMIUM.x) / 2} y={APP.y - 46} text="zero console errors" u={s.get(scene.zeroU)} color={colors.POSITIVE} />

        <RecordingStrip x={STRIP2.x} y={STRIP2.y} w={STRIP2.w} points={POINTS} reveal={s.get(scene.stripR)} u={s.get(scene.stripU)} title="the final walkthrough — ONE recorded session" />
        <Chip x={STRIP2.x + 150} y={STRIP2.y + 86} text="recordings/e0-t12-final.mp4" u={s.get(scene.mp4U)} color={colors.SECONDARY} size={11.5} />
        <Chip x={STRIP2.x + 442} y={STRIP2.y + 86} text="app.replay.io/recording/9f2e…" u={s.get(scene.urlU)} color={colors.TEAL} size={11.5} />

        <Panel x={EVID.x} y={EVID.y} w={EVID.w} h={EVID.h} u={s.get(scene.evidE)} title="evidence/ (committed)" color={colors.POSITIVE} />
        <Chip x={EVID.x + 118} y={EVID.y + 62} text="e0-t12-final.jsonl" u={clamp01(evidChips)} color={colors.POSITIVE} size={11.5} />
        <Chip x={EVID.x + 290} y={EVID.y + 62} text="digest 4f21…" u={clamp01(evidChips - 1)} color={colors.POSITIVE} size={11.5} />
        <Chip x={EVID.x + 160} y={EVID.y + 104} text="critic-attacks.md" u={clamp01(evidChips - 2)} color={colors.POSITIVE} size={11.5} />

        <Panel x={CLAIMP.x} y={CLAIMP.y} w={CLAIMP.w} h={CLAIMP.h} u={s.get(scene.claimE)} title="Verification log — the claim" color={colors.WARM}
          lines={CLAIM_LINES.map((text, i) => ({ text, color: clamp01(claimN - i) > 0.5 ? colors.TEXT : 'transparent' }))}
        />
        <text x={CLAIMP.x + 16} y={CLAIMP.y + CLAIMP.h + 26} fill={colors.MUTED} fontSize={12.5} fontStyle="italic" opacity={clamp01(s.get(scene.silenceU))}>
          name the evidence layer for every claim — declare absence: “Replay: N/A (reason) + mitigation”
        </text>
      </g>

      {/* ——— beat 6: implemented, not verified ——— */}
      <Chip x={950} y={488} text="status: implemented" u={s.get(scene.implU)} color={colors.WARM} size={13} />
      <Chip x={950} y={530} text="build_queue.py · commit" u={s.get(scene.rebuildU)} color={colors.MUTED} size={11.5} />
      {s.get(scene.waitU) > 0 && (
        <text x={950} y={576} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontStyle="italic" opacity={clamp01(s.get(scene.waitU))}>
          the critic inspects the full runtime — not what the test printed
        </text>
      )}
    </>
  );
}

// registry adapter — steps embed this via viz { scene: 'books/builder-critic-loop/chapter-2', beat: i }
export const vizScene = () => scene;
