import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, ease } from '../core';
import type { TimelineOverrides } from '../core';
import { RecordingStrip } from './recording-strip';
import type { RecordingPoint } from './recording-strip';
import { LayerStack } from './layer-stack';
import { PredictionCard } from './prediction-card';
import { DiffLanes } from './diff-lanes';
import type { DiffHunk } from './diff-lanes';
import { GauntletRail } from './gauntlet-rail';
import overrides from './replay-primitives.overrides.json';

/**
 * The Replay verification vocabulary in one tour — the adversarial
 * worker/critic loop (Replay.io). A recording of the SAVE20 checkout bug is
 * the running example: the screen showed $79.20, the wire carried 99.00.
 * RecordingStrip (the runtime, interrogable), PredictionCard (predict, THEN
 * peek), LayerStack (render/store/wire equality), DiffLanes (sufficiency),
 * GauntletRail (fail anywhere → back to the top).
 */
const POINTS: RecordingPoint[] = [
  { at: 0.07, kind: 'interaction', label: 'load /checkout' },
  { at: 0.24, kind: 'interaction', label: 'type SAVE20' },
  { at: 0.38, kind: 'render', label: '$79.20' },
  { at: 0.55, kind: 'interaction', label: 'click Pay' },
  { at: 0.68, kind: 'network', label: 'POST /api/checkout' },
  { at: 0.84, kind: 'render', label: 'confirmation' },
  { at: 0.93, kind: 'exception' },
];

const HUNKS: Omit<DiffHunk, 'hits' | 'u' | 'classU'>[] = [
  { label: 'applyDiscount(cart)', kind: 'executed' },
  { label: 'invalid-code error path', kind: 'needs-proof' },
  { label: 'roundCurrency()', kind: 'dead' },
  { label: 'types + config', kind: 'waived' },
];

const GATE_LABELS = ['lint', 'agent sessions', 'replay verify', 'PR', 'full suite', 'AI review', 'merge'];

function buildDemo() {
  const tl = new Timeline();
  // beat A — the recording
  const stripR = tl.channel('stripReveal', 0);
  const stripU = tl.channel('stripSweep', 0);
  const linkPop = tl.channel('linkPop', 0);
  const gStrip = tl.channel('stripFade', 1);
  // beat B/C — predict-then-verify
  const predE = tl.channel('predEnter', 0);
  const predStamp = tl.channel('predStamp', 0);
  const predText = tl.channel('predText', 0);
  const predObs = tl.channel('predObserved', 0);
  const predV = tl.channel('predVerdict', 0);
  const predLink = tl.channel('predLink', 0);
  const stackU = tl.channel('stackRows', 0);
  const connU = tl.channel('connReveal', 0);
  const snap1 = tl.channel('connSnap', 0);
  const stackV = tl.channel('stackVerdict', 0);
  const gPV = tl.channel('pvFade', 1);
  // beat D — sufficiency
  const diffU = tl.channel('diffRows', 0);
  const hitsExec = tl.channel('hitsExecuted', 0);
  const classU = tl.channel('diffClass', 0);
  const gDiff = tl.channel('diffFade', 1);
  // beat E — the gauntlet
  const railR = tl.channel('railReveal', 0);
  const railU = tl.channel('railToken', -1);
  const arcU = tl.channel('railArc', 0);
  const gates = GATE_LABELS.map((_, i) => tl.channel(`gate${i}`, 0));
  const dep = tl.channel('deposit', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 5.0, text: 'A Replay recording is the whole runtime on a strip — every call, request, render.' });
  tl.tween(stripR, 1, { at: t - 4.6, dur: 1.3, ease: ease.draw });
  tl.tween(stripU, 1, { at: t - 3.2, dur: 3.0, ease: ease.linear });
  tl.tween(linkPop, 1, { at: t - 0.9, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 4.8, text: 'The critic writes its prediction first — timestamped before it peeks at anything.' });
  tl.tween(predE, 1, { at: t - 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(predStamp, 1, { at: t - 3.8, dur: 0.5, ease: ease.pop });
  tl.tween(predText, 1, { at: t - 3.2, dur: 2.4, ease: ease.linear });
  t = tl.hold(t, 0.4);

  t = tl.caption({ at: t, dur: 4.8, text: 'Then it checks the layers: the render says 79.20 — the store and the wire say 99.' });
  tl.tween(stackU, 1, { at: t - 4.4, dur: 1.4, ease: ease.enter });
  tl.tween(connU, 1, { at: t - 2.8, dur: 0.8, ease: ease.draw });
  t = tl.caption({ at: t, dur: 4.6, text: 'The connector snaps, the verdict stamps — and the finding cites a point link.' });
  tl.tween(snap1, 1, { at: t - 4.2, dur: 0.5, ease: ease.pop });
  tl.tween(predObs, 1, { at: t - 3.6, dur: 0.6, ease: ease.enter });
  tl.tween(stackV, 1, { at: t - 2.8, dur: 0.5, ease: ease.pop });
  tl.tween(predV, 1, { at: t - 2.2, dur: 0.5, ease: ease.pop });
  tl.tween(predLink, 1, { at: t - 1.6, dur: 0.5, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 4.8, text: 'Sufficiency: hold the PR diff against the recording, hunk by hunk.' });
  tl.tween(gPV, 0, { at: t - 4.6, dur: 0.7, ease: ease.move });
  tl.tween(diffU, 1, { at: t - 3.8, dur: 1.4, ease: ease.enter });
  tl.tween(hitsExec, 14, { at: t - 2.4, dur: 1.4, ease: ease.move });
  t = tl.caption({ at: t, dur: 4.2, text: 'Executed, needs proof, dead, waived — nothing ships unclassified.' });
  tl.tween(classU, 1, { at: t - 3.8, dur: 1.6, ease: ease.enter });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 5.2, text: 'The gauntlet: fail any gate and you go back to the top, report in hand.' });
  tl.tween(gDiff, 0, { at: t - 5.0, dur: 0.7, ease: ease.move });
  tl.tween(gStrip, 0, { at: t - 5.0, dur: 0.7, ease: ease.move });
  tl.tween(railR, 1, { at: t - 4.2, dur: 1.3, ease: ease.draw });
  tl.set(railU, 0, t - 2.9);
  tl.tween(railU, 2, { at: t - 2.8, dur: 1.6, ease: ease.move });
  tl.tween(gates[0], 1, { at: t - 2.6, dur: 0.4, ease: ease.pop });
  tl.tween(gates[1], 1, { at: t - 1.9, dur: 0.4, ease: ease.pop });
  tl.tween(gates[2], -1, { at: t - 1.1, dur: 0.4, ease: ease.pulse });
  tl.tween(arcU, 1, { at: t - 0.6, dur: 1.2, ease: ease.move });
  tl.set(railU, 0, t + 0.55);
  t = tl.caption({ at: t + 0.7, dur: 5.6, text: 'Second lap: replay passes this time — and deposits a spec into the suite.' });
  tl.tween(gates[2], 0, { at: t - 5.4, dur: 0.8, ease: ease.move });
  tl.tween(railU, 6, { at: t - 4.8, dur: 4.4, ease: ease.linear });
  for (let i = 0; i < 7; i++) {
    tl.tween(gates[i], 1, { at: t - 4.8 + i * (4.4 / 6), dur: 0.4, ease: ease.pop });
  }
  tl.tween(dep, 1, { at: t - 4.8 + 4 * (4.4 / 6) + 0.2, dur: 0.5, ease: ease.pop });
  tl.hold(t, 1.4);

  return {
    tl, stripR, stripU, linkPop, gStrip, predE, predStamp, predText, predObs,
    predV, predLink, stackU, connU, snap1, stackV, gPV, diffU, hitsExec,
    classU, gDiff, railR, railU, arcU, gates, dep,
  };
}

const demo = buildDemo();
demo.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/agent/replay-primitives.overrides.json', slug: 'agent-replay-primitives' };

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop motion={MOTION}>
        {(s) => {
          const stackRows = s.get(demo.stackU);
          const conn = s.get(demo.connU);
          const cU = s.get(demo.classU);
          return (
            <>
              <g opacity={s.get(demo.gStrip)}>
                <RecordingStrip
                  x={150}
                  y={104}
                  w={980}
                  points={POINTS}
                  u={s.get(demo.stripU)}
                  reveal={s.get(demo.stripR)}
                  links={[{ at: 0.68, label: 'point @ 12.4s', pop: s.get(demo.linkPop) }]}
                />
              </g>
              <g opacity={s.get(demo.gPV)}>
                <PredictionCard
                  x={150}
                  y={250}
                  w={470}
                  text="at the checkout click, payload total = store total = rendered total"
                  stamp="predicted @ 12.4s"
                  stampU={s.get(demo.predStamp)}
                  u={s.get(demo.predText)}
                  observed="observed: render 79.20 · store 99.00 · wire 99.00"
                  observedU={s.get(demo.predObs)}
                  verdictKind="failed"
                  verdictU={s.get(demo.predV)}
                  link="⌖ 12.4s"
                  linkU={s.get(demo.predLink)}
                  enter={s.get(demo.predE)}
                />
                <LayerStack
                  x={690}
                  y={250}
                  w={440}
                  rows={[
                    { label: 'RENDER', value: '$79.20', u: clamp01(stackRows * 3) },
                    { label: 'STORE', value: '99.00', u: clamp01(stackRows * 3 - 1) },
                    { label: 'WIRE', value: '{total: 99.00}', u: clamp01(stackRows * 3 - 2) },
                  ]}
                  connectors={[
                    { u: conn, snap: s.get(demo.snap1) },
                    { u: conn, snap: 0 },
                  ]}
                  verdict="FAILED"
                  verdictU={s.get(demo.stackV)}
                />
              </g>
              <g opacity={s.get(demo.gDiff)}>
                <DiffLanes
                  x={150}
                  y={250}
                  w={620}
                  hunks={HUNKS.map((hk, i) => ({
                    ...hk,
                    hits: i === 0 ? s.get(demo.hitsExec) : 0,
                    u: clamp01(s.get(demo.diffU) * 4 - i),
                    classU: clamp01(cU * 4 - i),
                  }))}
                />
              </g>
              <GauntletRail
                x={170}
                y={340}
                w={940}
                gates={GATE_LABELS.map((label, i) => ({ label, state: s.get(demo.gates[i]) }))}
                u={s.get(demo.railU)}
                reveal={s.get(demo.railR)}
                arcU={s.get(demo.arcU)}
                arcFrom={2}
                deposit={{ gate: 4, label: '+1 spec', u: s.get(demo.dep) }}
              />
            </>
          );
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Agent/Replay Verification Primitives',
  component: Demo,
};
export default meta;

export const ProveTheWork: StoryObj<typeof Demo> = {};
