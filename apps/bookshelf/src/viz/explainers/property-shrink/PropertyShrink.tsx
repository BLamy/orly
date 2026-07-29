// Explained: Testing Without an Oracle — chapter 2: properties over examples.
// Real property-based testing, run at module scope against chapter 1's buggy
// median (default lexicographic sort). The property needs NO oracle: the
// median must be an element of the list, with at most half the elements
// strictly below it and at most half strictly above. A seeded generator
// (lists of 1–8 values in 0–999) falsifies the property on trial 9 with
// [18, 529, 82, 190, 414, 118]; greedy shrinking (drop an element / shrink a
// value, keep only if still failing) reaches the minimal witness [2, 0, 100]
// in 28 steps — where the buggy median is 100 with two elements below it,
// naming the bug: multi-digit numbers sort as text.
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
// The run, for real.
// ---------------------------------------------------------------------------

const buggyMedian = (xs: number[]): number => {
  const s = [...xs].sort();
  return s[Math.floor(s.length / 2)];
};
const prop = (xs: number[]): boolean => {
  if (!xs.length) return true;
  const m = buggyMedian(xs);
  const less = xs.filter((x) => x < m).length;
  const greater = xs.filter((x) => x > m).length;
  return xs.includes(m) && less <= Math.floor(xs.length / 2) && greater <= Math.floor(xs.length / 2);
};

// generate until falsified
const rand = mulberry32(13);
const TRIALS: Array<{ xs: number[]; ok: boolean }> = [];
let FOUND: number[] = [];
for (let i = 1; i <= 1000; i++) {
  const len = 1 + Math.floor(rand() * 8);
  const xs = Array.from({ length: len }, () => Math.floor(rand() * 1000));
  const ok = prop(xs);
  TRIALS.push({ xs, ok });
  if (!ok) { FOUND = xs; break; }
}
const FAIL_TRIAL = TRIALS.length; // 9

// greedy shrink
const STEPS: number[][] = [[...FOUND]];
let cur = FOUND;
let changed = true;
while (changed) {
  changed = false;
  for (let i = 0; i < cur.length; i++) {
    const cand = cur.slice(0, i).concat(cur.slice(i + 1));
    if (cand.length && !prop(cand)) { cur = cand; STEPS.push([...cur]); changed = true; break; }
  }
  if (changed) continue;
  outer: for (let i = 0; i < cur.length; i++) {
    for (const v of [0, Math.floor(cur[i] / 2), cur[i] - 1]) {
      if (v >= 0 && v < cur[i]) {
        const cand = [...cur];
        cand[i] = v;
        if (!prop(cand)) { cur = cand; STEPS.push([...cur]); changed = true; break outer; }
      }
    }
  }
}
const MINIMAL = cur; // [2, 0, 100]
const N_SHRINK = STEPS.length - 1; // 28
const MIN_MEDIAN = buggyMedian(MINIMAL); // 100
const MIN_LESS = MINIMAL.filter((x) => x < MIN_MEDIAN).length; // 2

// shrink chain rows to display: first 4, ellipsis, last 4
const CHAIN: Array<{ label: string; xs: number[] | null }> = [];
for (let i = 0; i < STEPS.length; i++) {
  if (i < 4 || i >= STEPS.length - 4) CHAIN.push({ label: `${i}`, xs: STEPS[i] });
  else if (i === 4) CHAIN.push({ label: '⋮', xs: null });
}

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const CAM_TRIALS: CameraState = { x: 520, y: 340, k: 1.15 };
const CAM_CHAIN: CameraState = { x: 600, y: 380, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  propU: ChannelRef<number>; // the property panel
  genU: ChannelRef<number>; // trials appear
  failU: ChannelRef<number>; // the failing trial highlighted
  chainU: ChannelRef<number>; // shrink chain
  minU: ChannelRef<number>; // minimal witness spotlight
  contrastU: ChannelRef<number>; // examples-vs-properties panel
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const propU = tl.channel('propU', 0);
  const genU = tl.channel('genU', 0);
  const failU = tl.channel('failU', 0);
  const chainU = tl.channel('chainU', 0);
  const minU = tl.channel('minU', 0);
  const contrastU = tl.channel('contrastU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the property
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Here is the escape from the oracle. Do not write down what the median of some list should be — write down what must be true of any median of any list. It has to be an element, with at most half the values below it and at most half above.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(propU, 1, { at: 1.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 4.6,
    text: 'Notice what is missing: an expected value. No hand computation, no oracle. The property quantifies over every list at once — which means a machine can now hunt for lists that break it.',
  });
  tl.hold(11.3, 0.6);

  // Beat 2 — the generator
  tl.caption({
    at: 11.9,
    dur: 5.6,
    text: 'So hunt. A seeded generator throws random lists at chapter one’s buggy median — up to eight values, up to a thousand each. Trials one through eight pass. Trial nine does not.',
  });
  tl.tween(cam, CAM_TRIALS, { at: 12.2, dur: 1.3, ease: ease.move });
  tl.tween(genU, 1, { at: 12.9, dur: 3.4, ease: ease.linear });
  tl.tween(failU, 1, { at: 16.6, dur: 0.8, ease: ease.pop });
  tl.caption({
    at: 17.9,
    dur: 5.2,
    text: 'The ninth list reports a median of four hundred fourteen — with four of its six values below it. The property caught in nine random tries what eight curated examples never could. But the witness is ugly: six values, all noise.',
  });
  tl.hold(23.1, 0.6);

  // Beat 3 — shrinking
  tl.caption({
    at: 23.7,
    dur: 5.8,
    text: 'This is where property testing earns its reputation: shrinking. Try deleting an element — does the property still fail? Keep the smaller list. Try shrinking a value toward zero — still failing? Keep it. Repeat until nothing smaller fails.',
  });
  tl.tween(cam, CAM_CHAIN, { at: 24.0, dur: 1.3, ease: ease.move });
  tl.tween(chainU, 1, { at: 24.9, dur: 3.6, ease: ease.linear });
  tl.caption({
    at: 29.9,
    dur: 5.6,
    text: 'Twenty eight steps later the noise is gone, and what remains is the bug with nothing else attached: the list two, zero, one hundred. The claimed median is one hundred — with both other values below it.',
  });
  tl.tween(minU, 1, { at: 31.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 35.9,
    dur: 5.2,
    text: 'Read the witness and the bug names itself: one hundred sorts before two when you compare text. A failing case this small is not just a report — it is the diagnosis. Shrinking is the machine writing your minimal reproduction for you.',
  });
  tl.hold(41.1, 0.6);

  // Beat 4 — the shape of the idea
  tl.caption({
    at: 41.7,
    dur: 5.8,
    text: 'Step back and look at the division of labor. You supply an invariant. The machine supplies the inputs, the search, and the minimal counterexample. The oracle never appears — the property replaced it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.9, dur: 1.3, ease: ease.move });
  tl.tween(contrastU, 1, { at: 43.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 47.9,
    dur: 5.0,
    text: 'And this is chapter three of the proof book in miniature: propose and verify, with the roles flipped. There the machine searched for a proof that a property always holds. Here it searches for the input that proves it does not.',
  });
  tl.hold(52.9, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 53.5,
    dur: 5.2,
    text: 'One catch: median had a crisp invariant. What is the invariant of a summarizer, or a chat model? That needs a different trick — relations between outputs, not properties of one. That trick is next.',
  });
  tl.tween(dimU, 1, { at: 54.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.5, dur: 1.0, ease: ease.enter });
  tl.hold(58.7, 1.4);

  return { tl, cam, titleU, propU, genU, failU, chainU, minU, contrastU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/property-shrink/overrides.json',
  slug: 'property-shrink',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const propU = s.get(scene.propU);
  const genU = s.get(scene.genU);
  const failU = s.get(scene.failU);
  const chainU = s.get(scene.chainU);
  const minU = s.get(scene.minU);
  const contrastU = s.get(scene.contrastU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const trialsFade = 1 - 0.8 * clamp01(chainU * 3);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* trial rows */}
          {genU > 0 &&
            TRIALS.map((t, i) => {
              const u = clamp01(genU * TRIALS.length - i);
              if (u <= 0) return null;
              const y = 180 + i * 42;
              const isFail = !t.ok;
              return (
                <g key={i} opacity={u * (isFail ? 1 : trialsFade * 0.9)}>
                  <rect
                    x={170}
                    y={y}
                    width={560}
                    height={32}
                    rx={6}
                    fill={colors.PANEL}
                    opacity={0.9}
                    stroke={isFail ? colors.NEGATIVE : colors.POSITIVE}
                    strokeWidth={isFail ? 2 + failU : 1}
                  />
                  <text x={186} y={y + 21} fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
                    trial {i + 1}
                  </text>
                  <text x={262} y={y + 21} fill={colors.TEXT} fontSize={12} fontFamily="monospace">
                    [{t.xs.join(', ')}]
                  </text>
                  <text x={690} y={y + 21} fill={isFail ? colors.NEGATIVE : colors.POSITIVE} fontSize={13} fontFamily="monospace" fontWeight={700} textAnchor="end">
                    {isFail ? '✗' : '✓'}
                  </text>
                </g>
              );
            })}
          {failU > 0 && (
            <text x={170} y={180 + TRIALS.length * 42 + 22} fill={colors.NEGATIVE} fontSize={13.5} fontFamily="monospace" fontWeight={700} opacity={failU * trialsFade}>
              falsified on trial {FAIL_TRIAL}: median {buggyMedian(FOUND)} has {FOUND.filter((x) => x < buggyMedian(FOUND)).length}/{FOUND.length} values below it
            </text>
          )}

          {/* the shrink chain */}
          {chainU > 0 && (
            <g>
              <text x={790} y={168} fill={colors.TEXT} fontSize={14.5} fontWeight={600} opacity={chainU}>
                shrinking — keep only what still fails
              </text>
              {CHAIN.map((c, i) => {
                const u = clamp01(chainU * CHAIN.length - i);
                if (u <= 0) return null;
                const y = 190 + i * 40;
                const last = i === CHAIN.length - 1;
                return (
                  <g key={i} opacity={u}>
                    {c.xs ? (
                      <>
                        <rect x={790} y={y} width={400} height={30} rx={6} fill={colors.PANEL} opacity={0.9} stroke={last ? colors.WARM : colors.GRID} strokeWidth={last ? 2 : 1} />
                        <text x={804} y={y + 20} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                          {c.label === '0' ? 'start' : `step ${c.label}`}
                        </text>
                        <text x={874} y={y + 20} fill={last ? colors.WARM : colors.TEXT} fontSize={12} fontFamily="monospace" fontWeight={last ? 700 : 400}>
                          [{c.xs.join(', ')}]
                        </text>
                      </>
                    ) : (
                      <text x={880} y={y + 20} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
                        ⋮ {N_SHRINK - 7} more failing shrinks ⋮
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* minimal witness spotlight */}
          {minU > 0 && (
            <g opacity={minU}>
              <rect x={790} y={190 + CHAIN.length * 40 + 10} width={400} height={104} rx={10} fill={colors.PANEL} opacity={0.97} stroke={colors.WARM} strokeWidth={2} />
              <text x={814} y={190 + CHAIN.length * 40 + 40} fill={colors.WARM} fontSize={14} fontFamily="monospace" fontWeight={700}>
                minimal witness: [{MINIMAL.join(', ')}]
              </text>
              <text x={814} y={190 + CHAIN.length * 40 + 64} fill={colors.TEXT} fontSize={12} fontFamily="monospace">
                claimed median: {MIN_MEDIAN} · {MIN_LESS}/{MINIMAL.length} values below
              </text>
              <text x={814} y={190 + CHAIN.length * 40 + 86} fill={colors.MUTED} fontSize={11}>
                as text, “100” sorts before “2” — the diagnosis, free
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* the property — screen space */}
      {propU > 0 && (
        <g opacity={propU * mainOp * (1 - 0.8 * clamp01(chainU * 3))}>
          <rect x={760} y={96} width={480} height={118} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.SECONDARY} />
          <text x={784} y={126} fill={colors.SECONDARY} fontSize={14} fontWeight={700}>
            the property — no expected values anywhere
          </text>
          <MathLabel
            tex="m \in xs \;\wedge\; \#\{x < m\} \le \lfloor n/2 \rfloor \;\wedge\; \#\{x > m\} \le \lfloor n/2 \rfloor"
            x={784}
            y={148}
            fontSize={14}
            color={colors.TEXT}
            opacity={1}
          />
          <text x={784} y={198} fill={colors.MUTED} fontSize={11.5}>
            for every list — the generator’s job is to find the “every” you forgot
          </text>
        </g>
      )}

      {/* contrast panel */}
      {contrastU > 0 && (
        <g opacity={contrastU * mainOp}>
          <rect x={790} y={110} width={450} height={172} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={816} y={142} fill={colors.TEXT} fontSize={14} fontWeight={600}>
            the division of labor
          </text>
          <text x={816} y={172} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
            you:     one invariant
          </text>
          <text x={816} y={196} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
            machine: inputs · search · shrinking
          </text>
          <text x={816} y={220} fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace">
            oracle:  not invited
          </text>
          <text x={816} y={254} fill={colors.WARM} fontSize={12}>
            found on trial {FAIL_TRIAL} · shrunk in {N_SHRINK} steps · all computed live
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Properties over examples
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            State the invariant. The machine finds the “every”.
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            falsified on trial {FAIL_TRIAL} · {N_SHRINK} shrinks · minimal witness [{MINIMAL.join(', ')}]
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            the counterexample so small it is the diagnosis
          </text>
          <text x={640} y={412} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            next: what to assert when even the invariant is out of reach
          </text>
        </g>
      )}
    </>
  );
}

export function PropertyShrink() {
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
