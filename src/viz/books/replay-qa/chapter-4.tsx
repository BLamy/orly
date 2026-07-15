// Book scene — replay-qa, chapter 4: "Wire It Into CI".
// One stage, 7 beats: a push starts a GitHub Actions run (beat 0), a newer
// push cancels the stale one via the branch concurrency group (beat 1), the
// stored secret maps to REPLAY_QA_API_KEY (beat 2), full-qa.js re-tests the
// commit and gates on open bugs (beat 3), a closing commit PATCHes the bug
// fixed — retry scheduled server-side (beat 4), start-exploration.js widens
// coverage on the new deploy (beat 5), and the closer runs a third commit
// through the whole lit pipeline (beat 6).
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, NodeBadge, Packet, RequestFlow, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

const COMMITS = [
  { x: 110, y: 175, sha: 'a1b2c3' },
  { x: 110, y: 255, sha: 'd4e5f6' },
  { x: 110, y: 335, sha: '78gh90' },
];
const ZONE = { x: 270, y: 64, w: 470, h: 340 };
const RUNS = [
  { y: 150, label: 'run #41 · qa · a1b2c3' },
  { y: 216, label: 'run #42 · qa · d4e5f6' },
];
const RUN_BAR = { x: 300, w: 410, h: 44 };
const JOB = { x: 505, y: 340 };
const SECRET = { x: 150, y: 480 };
const API = { x: 1010, y: 150 };
const DEPLOY = { x: 1130, y: 430 };

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const c1U = tl.channel('c1U', 0);
  const push1U = tl.channel('push1U', 0);
  const zoneU = tl.channel('zoneU', 0);
  const run1U = tl.channel('run1U', 0);
  const run1Prog = tl.channel('run1Prog', 0);
  const jobU = tl.channel('jobU', 0);

  const c2U = tl.channel('c2U', 0);
  const push2U = tl.channel('push2U', 0);
  const run2U = tl.channel('run2U', 0);
  const run2Prog = tl.channel('run2Prog', 0);
  const cancelU = tl.channel('cancelU', 0);
  const concChipU = tl.channel('concChipU', 0);

  const secretU = tl.channel('secretU', 0);
  const secretPktU = tl.channel('secretPktU', 0);
  const envChipU = tl.channel('envChipU', 0);

  const apiU = tl.channel('apiU', 0);
  const connU = tl.channel('connU', 0);
  const qaU = tl.channel('qaU', 0);
  const gateChipU = tl.channel('gateChipU', 0);
  const openN = tl.channel('openN', 2);

  const markPktU = tl.channel('markPktU', 0);
  const retryChipU = tl.channel('retryChipU', 0);

  const deployU = tl.channel('deployU', 0);
  const explorePktU = tl.channel('explorePktU', 0);
  const exploreConnU = tl.channel('exploreConnU', 0);
  const exploreFlow = tl.channel('exploreFlow', 0);
  const agentsChipU = tl.channel('agentsChipU', 0);

  const c3U = tl.channel('c3U', 0);
  const push3U = tl.channel('push3U', 0);
  const chainFlow = tl.channel('chainFlow', 0);
  const recapU = tl.channel('recapU', 0);

  // BEAT 0 — on: push — every commit starts a workflow run
  tl.caption({ at: 0.4, dur: 4.5, text: 'Every push starts a workflow run — the same replay-qa scripts, in CI.' });
  tl.tween(c1U, 1, { at: 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(push1U, 1, { at: 1.4, dur: 1.2, ease: ease.linear });
  tl.tween(zoneU, 1, { at: 2.4, dur: 1.2, ease: ease.draw });
  tl.tween(run1U, 1, { at: 3.8, dur: 0.6, ease: ease.enter });
  tl.tween(run1Prog, 0.55, { at: 4.6, dur: 8.0, ease: ease.linear });
  tl.tween(jobU, 1, { at: 4.8, dur: 0.6, ease: ease.enter });
  tl.hold(8.2, 1.0);

  // BEAT 1 — concurrency: the stale run never finishes against old code
  tl.caption({ at: 9.2, dur: 4.5, text: 'concurrency: one group per branch — a newer push cancels the stale run.' });
  tl.tween(c2U, 1, { at: 9.5, dur: 0.6, ease: ease.enter });
  tl.tween(push2U, 1, { at: 10.3, dur: 1.2, ease: ease.linear });
  tl.tween(run2U, 1, { at: 11.5, dur: 0.6, ease: ease.enter });
  tl.tween(cancelU, 1, { at: 12.6, dur: 0.5, ease: ease.pop });
  tl.tween(concChipU, 1, { at: 13.4, dur: 0.6, ease: ease.enter });
  tl.tween(run2Prog, 0.85, { at: 12.3, dur: 40.0, ease: ease.linear });
  tl.hold(17.2, 0.8);

  // BEAT 2 — the secret maps to the env var the scripts expect
  tl.caption({ at: 18.2, dur: 4.5, text: 'The secret maps to REPLAY_QA_API_KEY — an lqa_ bearer token, never echoed.' });
  tl.tween(secretU, 1, { at: 18.6, dur: 0.6, ease: ease.enter });
  tl.tween(secretPktU, 1, { at: 19.6, dur: 1.4, ease: ease.linear });
  tl.tween(envChipU, 1, { at: 21.1, dur: 0.5, ease: ease.pop });
  tl.hold(26.2, 0.8);

  // BEAT 3 — full-qa.js re-tests the commit, gating on open bugs
  tl.caption({ at: 27.2, dur: 4.5, text: 'node full-qa.js re-tests the commit, gating the build on open bugs.' });
  tl.tween(apiU, 1, { at: 27.5, dur: 0.6, ease: ease.enter });
  tl.tween(connU, 1, { at: 28.2, dur: 1.0, ease: ease.draw });
  tl.tween(qaU, 1, { at: 29.4, dur: 3.2, ease: ease.linear });
  tl.tween(gateChipU, 1, { at: 32.8, dur: 0.5, ease: ease.pop });
  tl.hold(35.2, 1.0);

  // BEAT 4 — the closing commit marks the bug fixed: the same single PATCH
  tl.caption({ at: 36.2, dur: 4.5, text: 'A commit that closes a bug marks it fixed — the same single PATCH.' });
  tl.tween(markPktU, 1, { at: 36.8, dur: 1.8, ease: ease.linear });
  tl.tween(retryChipU, 1, { at: 38.8, dur: 0.6, ease: ease.enter });
  tl.set(openN, 1, 39.2);
  tl.hold(43.6, 1.0);

  // BEAT 5 — start-exploration.js widens coverage on the fresh deploy
  tl.caption({ at: 44.6, dur: 4.5, text: 'start-exploration.js widens coverage against the freshly deployed build.' });
  tl.tween(deployU, 1, { at: 44.9, dur: 0.6, ease: ease.enter });
  tl.tween(explorePktU, 1, { at: 45.7, dur: 1.6, ease: ease.linear });
  tl.tween(exploreConnU, 1, { at: 47.4, dur: 1.0, ease: ease.draw });
  tl.tween(exploreFlow, 2.5, { at: 48.4, dur: 4.0, ease: ease.linear });
  tl.tween(agentsChipU, 1, { at: 48.6, dur: 0.5, ease: ease.pop });
  tl.hold(52.0, 1.0);

  // BEAT 6 — the whole pipeline, once per commit, forever
  tl.caption({ at: 53.0, dur: 5.0, text: 'Push → workflow → scripts → API: re-test, mark fixes, explore — every commit.' });
  tl.tween(c3U, 1, { at: 53.3, dur: 0.6, ease: ease.enter });
  tl.tween(push3U, 1, { at: 54.1, dur: 1.2, ease: ease.linear });
  tl.tween(chainFlow, 4, { at: 55.3, dur: 6.5, ease: ease.linear });
  tl.tween(recapU, 1, { at: 56.3, dur: 0.6, ease: ease.enter });
  tl.hold(61.8, 1.2);

  return {
    tl,
    c1U, push1U, zoneU, run1U, run1Prog, jobU,
    c2U, push2U, run2U, run2Prog, cancelU, concChipU,
    secretU, secretPktU, envChipU,
    apiU, connU, qaU, gateChipU, openN,
    markPktU, retryChipU,
    deployU, explorePktU, exploreConnU, exploreFlow, agentsChipU,
    c3U, push3U, chainFlow, recapU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

function Chip({ x, y, text, u, color, filled = false }: { x: number; y: number; text: string; u: number; color: string; filled?: boolean }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * 6.9 + 22;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * -6})`} opacity={uu}>
      <rect x={-w / 2} y={-12} width={w} height={24} rx={12} fill={filled ? color : colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fill={filled ? colors.BG : color} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** A commit dot in the push lane. */
function Commit({ x, y, sha, u }: { x: number; y: number; sha: string; u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={uu} transform={`translate(${x}, ${y}) scale(${0.7 + 0.3 * uu})`}>
      <circle r={11} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
      <circle r={4} fill={colors.ACCENT} />
      <text y={30} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        {sha}
      </text>
    </g>
  );
}

/** One workflow-run bar: progress fill, then a CANCELLED strike if unlucky. */
function RunBar({ y, label, enter, prog, cancel }: { y: number; label: string; enter: number; prog: number; cancel: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const c = clamp01(cancel);
  const w = RUN_BAR.w;
  const fillColor = c > 0.3 ? colors.NEGATIVE : colors.POSITIVE;
  return (
    <g transform={`translate(${RUN_BAR.x}, ${y + (1 - e) * 10})`} opacity={e * (1 - 0.45 * c)}>
      <rect width={w} height={RUN_BAR.h} rx={10} fill={colors.PANEL} stroke={c > 0.3 ? colors.NEGATIVE : colors.GRID} strokeWidth={1.4} />
      <rect x={3} y={RUN_BAR.h - 9} width={(w - 6) * clamp01(prog)} height={6} rx={3} fill={fillColor} opacity={0.7} />
      <text x={14} y={26} fill={colors.TEXT} fontSize={13} fontFamily={mono} textDecoration={c > 0.3 ? 'line-through' : 'none'}>
        {label}
      </text>
      {c > 0.3 && (
        <text x={w - 14} y={26} textAnchor="end" fill={colors.NEGATIVE} fontSize={12.5} fontWeight={700} fontFamily={mono} opacity={c}>
          ✗ cancelled
        </text>
      )}
    </g>
  );
}

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  const chainFlow = s.get(scene.chainFlow);
  const openBugs = Math.round(s.get(scene.openN));
  const gateU = clamp01(s.get(scene.gateChipU));

  return (
    <>
      {/* the push lane */}
      <text x={110} y={120} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={mono} opacity={clamp01(s.get(scene.c1U))}>
        git push
      </text>
      <Commit {...COMMITS[0]} u={s.get(scene.c1U)} />
      <Commit {...COMMITS[1]} u={s.get(scene.c2U)} />
      <Commit {...COMMITS[2]} u={s.get(scene.c3U)} />
      <Packet from={{ x: COMMITS[0].x + 16, y: COMMITS[0].y }} to={{ x: ZONE.x + 30, y: RUNS[0].y + 22 }} u={s.get(scene.push1U)} color={colors.ACCENT} label="on: push" />
      <Packet from={{ x: COMMITS[1].x + 16, y: COMMITS[1].y }} to={{ x: ZONE.x + 30, y: RUNS[1].y + 22 }} u={s.get(scene.push2U)} color={colors.ACCENT} label="on: push" />
      <Packet from={{ x: COMMITS[2].x + 16, y: COMMITS[2].y }} to={{ x: JOB.x - 70, y: JOB.y }} u={s.get(scene.push3U)} color={colors.ACCENT} label="on: push" />

      {/* GitHub Actions: two runs racing, one concurrency group */}
      <Zone {...ZONE} label="GitHub Actions" kind="group" u={s.get(scene.zoneU)} />
      <Chip
        x={ZONE.x + ZONE.w / 2}
        y={ZONE.y + 42}
        text="concurrency: qa-${branch} · cancel-in-progress"
        u={s.get(scene.concChipU)}
        color={colors.WARM}
      />
      <RunBar y={RUNS[0].y} label={RUNS[0].label} enter={s.get(scene.run1U)} prog={s.get(scene.run1Prog)} cancel={s.get(scene.cancelU)} />
      <RunBar y={RUNS[1].y} label={RUNS[1].label} enter={s.get(scene.run2U)} prog={s.get(scene.run2Prog)} cancel={0} />
      <ServiceNode {...JOB} kind="server" label="qa job" sublabel="replay-qa scripts" u={s.get(scene.jobU)} glow={clamp01(chainFlow) * 0.4} />

      {/* the secret rides in as REPLAY_QA_API_KEY */}
      <ServiceNode {...SECRET} kind="storage" label="repo secrets" sublabel="SECRET_REPLAY_QA_API_KEY" u={s.get(scene.secretU)} />
      <Packet from={{ x: SECRET.x + 70, y: SECRET.y - 14 }} to={{ x: JOB.x - 60, y: JOB.y + 18 }} u={s.get(scene.secretPktU)} color={colors.POSITIVE} label="lqa_ ····" />
      <Chip x={JOB.x} y={JOB.y + 52} text="env: REPLAY_QA_API_KEY — never echoed" u={s.get(scene.envChipU)} color={colors.POSITIVE} />

      {/* the job talks to the same API the agent uses */}
      <ServiceNode {...API} w={195} kind="external" label="Replay QA API" sublabel="qa.replay.io/api/v1" u={s.get(scene.apiU)} glow={clamp01(chainFlow) * 0.4} />
      <Connection from={{ x: JOB.x + 66, y: JOB.y - 14 }} to={{ x: API.x - 78, y: API.y + 20 }} u={s.get(scene.connU)} flow={chainFlow} />
      <RequestFlow
        path={[
          { x: JOB.x + 66, y: JOB.y - 14 },
          { x: API.x - 78, y: API.y + 20 },
        ]}
        u={s.get(scene.qaU)}
        roundTrip
        color={colors.ACCENT}
        responseColor={colors.WARM}
        label="GET /projects/:id/bugs?status=open"
        responseLabel="open bugs"
      />
      <Chip
        x={JOB.x + 280}
        y={JOB.y - 55}
        text={`gate: ${openBugs} open bug${openBugs === 1 ? '' : 's'}`}
        u={gateU}
        color={openBugs > 1 ? colors.WARM : colors.POSITIVE}
        filled
      />

      {/* mark the fixed bug from the build — retry happens server-side */}
      <Packet
        from={{ x: JOB.x + 66, y: JOB.y + 6 }}
        to={{ x: API.x - 60, y: API.y + 44 }}
        u={s.get(scene.markPktU)}
        color={colors.WARM}
        label="PATCH /bugs/147 { status: 'fixed' }"
      />
      <Chip x={API.x + 24} y={API.y + 78} text="journey retry — server-side" u={s.get(scene.retryChipU)} color={colors.TEAL} />

      {/* fresh coverage against the new deploy */}
      <Packet
        from={{ x: JOB.x + 66, y: JOB.y + 26 }}
        to={{ x: API.x - 40, y: API.y + 60 }}
        u={s.get(scene.explorePktU)}
        color={colors.SECONDARY}
        label="POST /projects/:id/explorations { prompt }"
      />
      <ServiceNode {...DEPLOY} kind="browser" label="new deploy" sublabel="this commit, live" u={s.get(scene.deployU)} replicas={3} />
      <Connection
        from={{ x: API.x + 30, y: API.y + 44 }}
        to={{ x: DEPLOY.x - 30, y: DEPLOY.y - 44 }}
        u={s.get(scene.exploreConnU)}
        flow={s.get(scene.exploreFlow) + chainFlow}
        color={colors.SECONDARY}
        label="exploration agents"
      />
      <Chip x={DEPLOY.x - 40} y={DEPLOY.y + 60} text="agent_count: 1–10" u={s.get(scene.agentsChipU)} color={colors.SECONDARY} />

      {/* the closer: QA rides along with every commit */}
      <g opacity={clamp01(s.get(scene.recapU))}>
        <text x={640} y={640} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={700} fontFamily={mono}>
          push → workflow → scripts → Replay QA API — on every commit
        </text>
      </g>
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/replay-qa/chapter-4', beat: i }
export const vizScene = () => scene;
