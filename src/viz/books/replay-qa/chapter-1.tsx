// Book scene — replay-qa, chapter 1: "The Autonomous Loop".
// One coherent stage across 6 beats: a single POST /projects on the left
// becomes a standing QA system — exploration agents fan out to the live app,
// every run lands on a replay recording strip along the bottom, an exception
// on that strip becomes a bug row (born open), a stable stretch of the
// recording is promoted to a journey, the journey re-runs as a test run that
// files a fresh bug of its own — and the closer zooms out to the loop itself.
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, NodeBadge, Packet, RequestFlow, ServiceNode, Zone } from '../../primitives';
import { LoopRing, RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

const YOU = { x: 130, y: 150 };
const ZONE = { x: 290, y: 60, w: 440, h: 430 };
const PROJECT = { x: 510, y: 150 };
const JOURNEY = { x: 510, y: 262 };
const BUG1 = { x: 510, y: 362 };
const BUG2 = { x: 510, y: 434 };
const APP = { x: 1100, y: 150 };
const AGENTS = [
  { x: 850, y: 84 },
  { x: 850, y: 162 },
  { x: 850, y: 240 },
];
const STRIP = { x: 80, y: 548, w: 1120, h: 30 };

// the recording's runtime points — one exception at 62% is the story's bug
const POINTS: RecordingPoint[] = [
  { at: 0.05, kind: 'interaction' },
  { at: 0.11, kind: 'render' },
  { at: 0.17, kind: 'network' },
  { at: 0.24, kind: 'interaction' },
  { at: 0.3, kind: 'render' },
  { at: 0.37, kind: 'network' },
  { at: 0.44, kind: 'interaction' },
  { at: 0.5, kind: 'interaction' },
  { at: 0.56, kind: 'network' },
  { at: 0.62, kind: 'exception', label: 'TypeError' },
  { at: 0.7, kind: 'render' },
  { at: 0.78, kind: 'interaction' },
  { at: 0.85, kind: 'network' },
  { at: 0.92, kind: 'render' },
];
const EXC_X = STRIP.x + 0.62 * STRIP.w; // the exception marker, in stage coords
const FLOW = { x0: STRIP.x + 0.24 * STRIP.w, x1: STRIP.x + 0.56 * STRIP.w }; // the stable stretch

const RING = { cx: 640, cy: 340, r: 175 };
const STOPS = [
  { label: 'explore', color: colors.ACCENT },
  { label: 'journey', color: colors.TEAL },
  { label: 'test run', color: colors.SECONDARY },
  { label: 'bug filed', color: colors.NEGATIVE },
  { label: 're-verify', color: colors.POSITIVE },
];

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const youU = tl.channel('youU', 0);
  const zoneU = tl.channel('zoneU', 0);
  const postU = tl.channel('postU', 0);
  const projU = tl.channel('projU', 0);

  const appU = tl.channel('appU', 0);
  const agentU = AGENTS.map((_, i) => tl.channel(`agent${i}U`, 0));
  const agentConnU = tl.channel('agentConnU', 0);
  const agentFlow = tl.channel('agentFlow', 0);
  const stripU = tl.channel('stripU', 0);
  const sweepU = tl.channel('sweepU', 0);

  const excPop = tl.channel('excPop', 0);
  const bugLineU = tl.channel('bugLineU', 0);
  const bugPktU = tl.channel('bugPktU', 0);
  const bug1U = tl.channel('bug1U', 0);
  const openChipU = tl.channel('openChipU', 0);

  const braceU = tl.channel('braceU', 0);
  const jrnPktU = tl.channel('jrnPktU', 0);
  const jrnU = tl.channel('jrnU', 0);

  const runU = tl.channel('runU', 0);
  const runChipU = tl.channel('runChipU', 0);
  const bug2U = tl.channel('bug2U', 0);

  const dimU = tl.channel('dimU', 0);
  const ringU = tl.channel('ringU', 0);
  const orbitU = tl.channel('orbitU', 0);
  const ringLabelU = tl.channel('ringLabelU', 0);

  // BEAT 0 — one POST /projects kicks off the whole autonomous run
  tl.caption({ at: 0.4, dur: 4.5, text: 'One call starts it all: POST /projects with a target_url and instructions.' });
  tl.tween(youU, 1, { at: 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(zoneU, 1, { at: 1.2, dur: 1.2, ease: ease.draw });
  tl.tween(postU, 1, { at: 2.6, dur: 1.6, ease: ease.linear });
  tl.tween(projU, 1, { at: 4.2, dur: 0.6, ease: ease.pop });
  tl.hold(8.2, 1.0);

  // BEAT 1 — exploration agents drive the live app; a recording captures it
  tl.caption({ at: 9.2, dur: 4.5, text: 'Exploration agents drive the live app — every run captured as a recording.' });
  tl.tween(appU, 1, { at: 9.5, dur: 0.6, ease: ease.enter });
  AGENTS.forEach((_, i) => tl.tween(agentU[i], 1, { at: 9.9 + i * 0.25, dur: 0.6, ease: ease.enter }));
  tl.tween(agentConnU, 1, { at: 10.9, dur: 1.2, ease: ease.draw });
  tl.tween(agentFlow, 4, { at: 12.1, dur: 6.0, ease: ease.linear });
  tl.tween(stripU, 1, { at: 12.2, dur: 1.3, ease: ease.draw });
  tl.tween(sweepU, 0.5, { at: 13.7, dur: 3.6, ease: ease.linear });
  tl.hold(17.3, 0.8);

  // BEAT 2 — the exception on the recording becomes a bug row, born open
  tl.caption({ at: 18.2, dur: 4.5, text: 'A defect becomes a bug row — createBug(), always born status: open.' });
  tl.tween(excPop, 1, { at: 18.7, dur: 0.5, ease: ease.pop });
  tl.tween(bugLineU, 1, { at: 19.4, dur: 1.0, ease: ease.draw });
  tl.tween(bugPktU, 1, { at: 20.4, dur: 1.1, ease: ease.linear });
  tl.tween(bug1U, 1, { at: 21.5, dur: 0.6, ease: ease.enter });
  tl.tween(openChipU, 1, { at: 22.3, dur: 0.5, ease: ease.pop });
  tl.hold(25.6, 1.0);

  // BEAT 3 — a stable stretch of the recording is promoted to a journey
  tl.caption({ at: 26.6, dur: 4.5, text: 'Stable flows are promoted to journeys: saved, repeatable test scripts.' });
  tl.tween(braceU, 1, { at: 27.0, dur: 1.2, ease: ease.draw });
  tl.tween(jrnPktU, 1, { at: 28.4, dur: 1.2, ease: ease.linear });
  tl.tween(jrnU, 1, { at: 29.6, dur: 0.6, ease: ease.enter });
  tl.hold(33.6, 1.0);

  // BEAT 4 — the journey re-runs as a test run; test runs file fresh bugs too
  tl.caption({ at: 34.6, dur: 4.5, text: 'Each journey re-runs as a test run — and test runs can file fresh bugs.' });
  tl.tween(runU, 1, { at: 35.2, dur: 3.4, ease: ease.linear });
  tl.tween(runChipU, 1, { at: 36.2, dur: 0.5, ease: ease.pop });
  tl.tween(sweepU, 0.95, { at: 35.4, dur: 3.4, ease: ease.linear });
  tl.tween(bug2U, 1, { at: 39.0, dur: 0.6, ease: ease.enter });
  tl.hold(43.2, 1.0);

  // BEAT 5 — zoom out: the standing loop a single URL bought you
  tl.caption({ at: 44.2, dur: 5.0, text: 'One URL becomes a standing loop: explore, journey, test, file bugs.' });
  tl.tween(dimU, 1, { at: 44.6, dur: 1.0, ease: ease.move });
  tl.tween(ringU, 1, { at: 45.4, dur: 1.4, ease: ease.draw });
  tl.tween(orbitU, 2, { at: 47.0, dur: 6.2, ease: ease.linear });
  tl.tween(ringLabelU, 1, { at: 48.2, dur: 0.6, ease: ease.enter });
  tl.hold(53.2, 1.2);

  return {
    tl,
    youU, zoneU, postU, projU,
    appU, agentU, agentConnU, agentFlow, stripU, sweepU,
    excPop, bugLineU, bugPktU, bug1U, openChipU,
    braceU, jrnPktU, jrnU,
    runU, runChipU, bug2U,
    dimU, ringU, orbitU, ringLabelU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

/** Small status chip. */
function Chip({ x, y, text, u, color }: { x: number; y: number; text: string; u: number; color: string }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * 6.9 + 22;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * -6})`} opacity={uu}>
      <rect x={-w / 2} y={-12} width={w} height={24} rx={12} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fill={color} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** Brace over the stable stretch of the recording strip. */
function FlowBrace({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const y = STRIP.y - 12;
  const mid = (FLOW.x0 + FLOW.x1) / 2;
  const half = ((FLOW.x1 - FLOW.x0) / 2) * uu;
  return (
    <g opacity={uu * (1 - 0.7 * clamp01(dim))}>
      <path d={`M ${mid - half} ${y} v -8 H ${mid + half} v 8`} fill="none" stroke={colors.TEAL} strokeWidth={1.6} />
      <text x={mid} y={y - 16} textAnchor="middle" fill={colors.TEAL} fontSize={12} fontFamily={mono}>
        stable flow → journey
      </text>
    </g>
  );
}

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const openChip = s.get(scene.openChipU);
  const ringU = clamp01(s.get(scene.ringU));

  return (
    <>
      {/* you → Replay QA: the single call that starts the run */}
      <ServiceNode {...YOU} kind="client" label="you" sublabel="one URL" u={s.get(scene.youU)} dim={dim} />
      <Zone {...ZONE} label="Replay QA" kind="group" u={s.get(scene.zoneU)} dim={dim} />
      <Packet
        from={{ x: YOU.x + 66, y: YOU.y }}
        to={{ x: PROJECT.x - 175, y: PROJECT.y }}
        u={s.get(scene.postU)}
        color={colors.ACCENT}
        label="POST /projects"
      />
      <NodeBadge
        {...PROJECT}
        w={340}
        h={62}
        label="project"
        sublabel="target_url + instructions"
        color={colors.ACCENT}
        u={s.get(scene.projU)}
        dim={dim}
      />

      {/* exploration agents fan out to the live app */}
      {AGENTS.map((a, i) => (
        <g key={i}>
          <NodeBadge {...a} w={130} h={40} label={`agent ${i + 1}`} color={colors.SECONDARY} u={s.get(scene.agentU[i])} dim={dim} />
          <Connection
            from={{ x: a.x + 68, y: a.y }}
            to={{ x: APP.x - 66, y: APP.y + (i - 1) * 16 }}
            u={s.get(scene.agentConnU)}
            flow={s.get(scene.agentFlow)}
            dim={dim}
          />
        </g>
      ))}
      <Connection
        from={{ x: PROJECT.x + 173, y: PROJECT.y }}
        to={{ x: AGENTS[1].x - 68, y: AGENTS[1].y }}
        u={s.get(scene.agentConnU)}
        label="explorations"
        dim={dim}
      />
      <ServiceNode {...APP} kind="browser" label="your app" sublabel="live at target_url" u={s.get(scene.appU)} dim={dim} />

      {/* the replay recording — every run captured, point by point */}
      <RecordingStrip
        x={STRIP.x}
        y={STRIP.y}
        w={STRIP.w}
        h={STRIP.h}
        points={POINTS}
        u={s.get(scene.sweepU)}
        reveal={s.get(scene.stripU)}
        links={[{ at: 0.62, label: 'exception @ 41.2s', pop: s.get(scene.excPop) }]}
        title="replay recording — every run captured"
        dim={dim}
      />

      {/* the exception climbs into the platform as a bug row */}
      <Connection
        from={{ x: EXC_X, y: STRIP.y - 6 }}
        to={{ x: BUG1.x + 173, y: BUG1.y }}
        via={[{ x: EXC_X, y: BUG1.y }]}
        u={s.get(scene.bugLineU)}
        color={colors.NEGATIVE}
        dashed
        dim={dim}
      />
      <Packet
        from={{ x: EXC_X, y: STRIP.y - 6 }}
        to={{ x: BUG1.x + 173, y: BUG1.y }}
        u={s.get(scene.bugPktU)}
        color={colors.NEGATIVE}
        label="createBug()"
      />
      <NodeBadge
        {...BUG1}
        w={340}
        h={54}
        label="bug #147 — checkout total wrong"
        sublabel="repro · expected vs actual · analysis"
        color={colors.NEGATIVE}
        u={s.get(scene.bug1U)}
        dim={dim}
      />
      <Chip x={BUG1.x + 130} y={BUG1.y - 27} text="status: open" u={openChip * (1 - 0.7 * dim)} color={colors.NEGATIVE} />

      {/* the stable stretch is promoted to a journey */}
      <FlowBrace u={s.get(scene.braceU)} dim={dim} />
      <Packet
        from={{ x: (FLOW.x0 + FLOW.x1) / 2, y: STRIP.y - 34 }}
        to={{ x: JOURNEY.x, y: JOURNEY.y + 30 }}
        u={s.get(scene.jrnPktU)}
        color={colors.TEAL}
      />
      <NodeBadge
        {...JOURNEY}
        w={340}
        h={54}
        label="journey — checkout flow"
        sublabel="saved, repeatable test script"
        color={colors.TEAL}
        u={s.get(scene.jrnU)}
        dim={dim}
      />

      {/* the journey re-runs as a test run against the app — and files bug #2 */}
      <RequestFlow
        path={[
          { x: JOURNEY.x + 173, y: JOURNEY.y },
          { x: APP.x - 40, y: APP.y + 40 },
          { x: JOURNEY.x + 173, y: JOURNEY.y },
        ]}
        u={s.get(scene.runU)}
        color={colors.SECONDARY}
        label="test run"
        opacity={1 - dim}
      />
      <Chip
        x={870}
        y={330}
        text="test_run #12 · countBugsForTestRun"
        u={s.get(scene.runChipU) * (1 - 0.85 * dim)}
        color={colors.SECONDARY}
      />
      <NodeBadge
        {...BUG2}
        w={340}
        h={48}
        label="bug #152 — filed by the test run"
        color={colors.NEGATIVE}
        u={s.get(scene.bug2U)}
        dim={dim}
      />

      {/* the closer: a scrim settles over the machinery, and the loop remains */}
      {dim > 0 && <rect width={1280} height={720} fill={colors.BG} opacity={0.82 * dim} />}
      {ringU > 0 && (
        <g>
          <LoopRing {...RING} stops={STOPS} u={s.get(scene.orbitU)} reveal={ringU} color={colors.ACCENT} />
          <g opacity={clamp01(s.get(scene.ringLabelU))}>
            <text x={RING.cx} y={RING.cy - 8} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700} fontFamily={mono}>
              one target_url in
            </text>
            <text x={RING.cx} y={RING.cy + 20} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              a self-sustaining QA system out
            </text>
          </g>
        </g>
      )}
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/replay-qa/chapter-1', beat: i }
export const vizScene = () => scene;
