// Explained: Testing Without an Oracle — chapter 4: fuzzing the harness.
// Coverage guidance, measured for real at module scope. The program under
// test hides a crash behind six nested guards: the input must spell a
// six-letter secret, one letter checked per guard. The input space is
// 26^6 ≈ 309 million strings.
//   random fuzzing: 200,000 seeded executions — the crash is never reached
//     (deepest prefix ever matched is shown, computed);
//   coverage-guided: keep any input that gets DEEPER than before, mutate one
//     character of a kept input — 50 seeded campaigns all reach the crash,
//     median 3,156 executions, worst 6,067.
// Guidance converts an exponential problem (guess all six letters at once)
// into a linear one (guess one letter, keep it, guess the next) — the whole
// argument for coverage-guided fuzzing, run live.
import {
  CAMERA_HOME,
  Camera,
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
// The experiment, module scope.
// ---------------------------------------------------------------------------

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const SECRET = 'hidden';
const L = SECRET.length;
// depth = number of leading guards passed
const runTarget = (s: string): number => {
  let d = 0;
  for (let i = 0; i < L; i++) {
    if (s[i] === SECRET[i]) d++;
    else break;
  }
  return d;
};

// random campaign
const RAND_BUDGET = 200000;
let RAND_HIT = -1;
let RAND_BEST = 0;
{
  const rand = mulberry32(101);
  for (let i = 1; i <= RAND_BUDGET; i++) {
    let s = '';
    for (let k = 0; k < L; k++) s += ALPHA[Math.floor(rand() * 26)];
    const d = runTarget(s);
    if (d > RAND_BEST) RAND_BEST = d;
    if (d === L) { RAND_HIT = i; break; }
  }
}

// guided campaigns
interface Campaign { execs: number }
const GUIDED: number[] = [];
let SAMPLE_CORPUS: Array<{ s: string; d: number }> = [];
for (let seed = 200; seed < 250; seed++) {
  const rand = mulberry32(seed);
  const corpus: Array<{ s: string; d: number }> = [{ s: 'aaaaaa', d: runTarget('aaaaaa') }];
  let best = corpus[0].d;
  let execs = 1;
  let found = 0;
  while (execs < 100000 && !found) {
    const parent = corpus[Math.floor(rand() * corpus.length)].s;
    const i = Math.floor(rand() * L);
    const cand = parent.slice(0, i) + ALPHA[Math.floor(rand() * 26)] + parent.slice(i + 1);
    execs++;
    const d = runTarget(cand);
    if (d === L) { found = execs; corpus.push({ s: cand, d }); break; }
    if (d > best) { best = d; corpus.push({ s: cand, d }); }
  }
  GUIDED.push(found);
  if (seed === 200) SAMPLE_CORPUS = corpus;
}
const G_SORTED = [...GUIDED].sort((a, b) => a - b);
const G_MEDIAN = G_SORTED[Math.floor(G_SORTED.length / 2)]; // 3156
const G_MAX = G_SORTED[G_SORTED.length - 1]; // 6067
const G_FOUND = GUIDED.filter((g) => g > 0).length; // 50

const SPACE = Math.pow(26, L); // ≈ 3.09e8

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

// The corridor spans x 130–1130 and y 150–220 at home; the side panels sit in
// the right-hand column (x 760–1130) so they never sit on the corridor, and the
// corpus ladder sits in the left column below it.
const GUARD_X = 130;
const GUARD_Y = 150;
const GUARD_DX = 150;
const PANEL_X = 760;
const PANEL_Y = 300;
const LADDER_Y = 330;
const CAM_GUARDS: CameraState = { x: 600, y: 300, k: 1.1 };
const CAM_CORPUS: CameraState = { x: 600, y: 400, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  guardsU: ChannelRef<number>; // the guard corridor
  randU: ChannelRef<number>; // random attempts bounce at guard 1–2
  randStatU: ChannelRef<number>;
  covU: ChannelRef<number>; // the coverage signal note
  corpusU: ChannelRef<number>; // the kept-corpus ladder
  crashU: ChannelRef<number>; // the crash reached
  statU: ChannelRef<number>; // guided stats
  mathU: ChannelRef<number>; // exponential→linear
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const guardsU = tl.channel('guardsU', 0);
  const randU = tl.channel('randU', 0);
  const randStatU = tl.channel('randStatU', 0);
  const covU = tl.channel('covU', 0);
  const corpusU = tl.channel('corpusU', 0);
  const crashU = tl.channel('crashU', 0);
  const statU = tl.channel('statU', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the target
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Properties and relations tell you what to check. This chapter is about the other half: finding the inputs worth checking. Here is a program hiding a crash behind six nested guards — each one tests a single letter of the input.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_GUARDS, { at: 1.2, dur: 1.4, ease: ease.move });
  tl.tween(guardsU, 1, { at: 1.8, dur: 1.6, ease: ease.draw });
  tl.caption({
    at: 6.7,
    dur: 4.6,
    text: 'Only one string in three hundred nine million reaches the end. That is a toy number with an honest shape — real bugs live behind exactly this kind of conjunction of conditions.',
  });
  tl.hold(11.3, 0.6);

  // Beat 2 — random
  tl.caption({
    at: 11.9,
    dur: 5.8,
    text: 'Attack it randomly first: two hundred thousand seeded strings. Watch where they die. Nearly all bounce off the first guard, about seven thousand pass one letter, three hundred sixteen pass two, and exactly eleven pass three. None get further — zero crashes in the entire budget.',
  });
  tl.tween(randU, 1, { at: 12.9, dur: 3.0, ease: ease.linear });
  tl.tween(randStatU, 1, { at: 16.3, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 18.1,
    dur: 5.0,
    text: 'The cruel arithmetic: passing each extra guard costs a factor of twenty six, and random search pays the full product — twenty six multiplied by itself six times. Random fuzzing is blind to how close it got.',
  });
  tl.hold(23.1, 0.6);

  // Beat 3 — the coverage signal
  tl.caption({
    at: 23.7,
    dur: 5.8,
    text: 'Now add one bit of instrumentation: report how many guards an input passed before dying. That is coverage — not whether the test found anything, but where the execution reached. And it changes everything, because depth is a gradient.',
  });
  tl.tween(covU, 1, { at: 24.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 29.9,
    dur: 5.8,
    text: 'The guided loop: keep any input that got deeper than ever before, mutate one character of a kept input, repeat. Watch the corpus climb — each rung is a real input from the seeded run, one letter of the secret locked in at a time.',
  });
  tl.tween(cam, CAM_CORPUS, { at: 30.2, dur: 1.3, ease: ease.move });
  tl.tween(corpusU, 1, { at: 31.1, dur: 3.4, ease: ease.linear });
  tl.tween(crashU, 1, { at: 35.0, dur: 0.7, ease: ease.pop });
  tl.hold(36.3, 0.5);

  // Beat 4 — the numbers
  tl.caption({
    at: 36.8,
    dur: 5.8,
    text: 'Fifty seeded campaigns, and all fifty reach the crash — median three thousand one hundred fifty six executions, worst case just over six thousand. Random spent two hundred thousand and never got more than three letters deep.',
  });
  tl.tween(statU, 1, { at: 37.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 43.0,
    dur: 5.4,
    text: 'Coverage converted an exponential problem into a linear one: guess a letter, bank it, guess the next. The corpus is a memory of partial progress — the thing random search throws away after every try.',
  });
  tl.tween(mathU, 1, { at: 44.2, dur: 0.9, ease: ease.enter });
  tl.hold(48.4, 0.6);

  // Beat 5 — for AI harnesses, and close
  tl.caption({
    at: 49.0,
    dur: 5.8,
    text: 'For AI systems, point this at the harness: fuzz the tool call parser, the prompt template, the retry logic, the sandbox boundary — the deterministic shell around the model, where guided search genuinely compounds. The model itself gives you no coverage map, but its scaffolding does.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 49.2, dur: 1.3, ease: ease.move });
  tl.caption({
    at: 55.2,
    dur: 4.8,
    text: 'So: properties say what must hold, relations say what must agree, and guided search finds where they break. One question left — what, concretely, can you assert about a model itself? That is the finale.',
  });
  tl.tween(dimU, 1, { at: 56.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 57.2, dur: 1.0, ease: ease.enter });
  tl.hold(60.0, 1.4);

  return { tl, cam, titleU, guardsU, randU, randStatU, covU, corpusU, crashU, statU, mathU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/coverage-fuzz/overrides.json',
  slug: 'coverage-fuzz',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// random-death histogram for display (depth 0..2 typical)
const DEATHS = [0.9615, 0.037, 0.0014]; // ~1, 1/26, 1/26² — illustrative bar heights

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const guardsU = s.get(scene.guardsU);
  const randU = s.get(scene.randU);
  const randStatU = s.get(scene.randStatU);
  const covU = s.get(scene.covU);
  const corpusU = s.get(scene.corpusU);
  const crashU = s.get(scene.crashU);
  const statU = s.get(scene.statU);
  const mathU = s.get(scene.mathU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  // the finale fades everything under the closing panel down to 0.1
  const mainOp = 1 - 0.9 * dimU;
  const showMain = mainOp > 0.12;
  // random attempts give way completely to the corpus (no ghost labels)
  const randFade = 1 - clamp01(corpusU * 3);
  // 0 until the camera is back home after the corpus, 1 once it has settled
  const harnessP = crashU * clamp01((CAM_CORPUS.k - cam.k) / (CAM_CORPUS.k - 1));
  const statOp = statU * (1 - harnessP) * mainOp;
  const mathOp = mathU * (1 - harnessP) * mainOp;
  const noteOp = covU * mainOp * (1 - clamp01(statU * 4));

  // corpus ladder rows (unique depths from the real seed-200 corpus)
  const ladder: Array<{ s: string; d: number }> = [];
  const seen = new Set<number>();
  for (const c of SAMPLE_CORPUS) {
    if (!seen.has(c.d)) { seen.add(c.d); ladder.push(c); }
  }

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      {showMain && (
        <g opacity={mainOp}>
          <Camera {...cam}>
            {/* the guard corridor, one letter per guard */}
            {guardsU > 0 && (
              <g>
                {SECRET.split('').map((ch, i) => {
                  const u = clamp01(guardsU * L - i);
                  if (u <= 0) return null;
                  return (
                    <g key={i} opacity={u}>
                      <text x={GUARD_X + i * GUARD_DX + 55} y={GUARD_Y - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                        letter {i + 1}
                      </text>
                      <rect x={GUARD_X + i * GUARD_DX} y={GUARD_Y} width={110} height={70} rx={10} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
                      <text x={GUARD_X + i * GUARD_DX + 55} y={GUARD_Y + 30} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                        guard {i + 1}
                      </text>
                      <text x={GUARD_X + i * GUARD_DX + 55} y={GUARD_Y + 54} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily="monospace">
                        s[{i}] = ‘{ch}’ ?
                      </text>
                      {i < L - 1 && <line x1={GUARD_X + i * GUARD_DX + 110} y1={GUARD_Y + 35} x2={GUARD_X + (i + 1) * GUARD_DX} y2={GUARD_Y + 35} stroke={colors.GRID} strokeWidth={2} />}
                    </g>
                  );
                })}
                {guardsU >= 1 && (
                  <g opacity={crashU > 0 ? 1 : 0.55}>
                    <rect x={GUARD_X + L * GUARD_DX} y={GUARD_Y} width={100} height={70} rx={10} fill={crashU > 0 ? colors.NEGATIVE : colors.PANEL} opacity={crashU > 0 ? 0.9 : 0.6} stroke={colors.NEGATIVE} />
                    <text x={GUARD_X + L * GUARD_DX + 50} y={GUARD_Y + 42} textAnchor="middle" fill={crashU > 0 ? colors.BG : colors.NEGATIVE} fontSize={14} fontWeight={700}>
                      crash
                    </text>
                    <text x={GUARD_X + L * GUARD_DX + 50} y={GUARD_Y + 96} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                      only “hidden”
                    </text>
                    <text x={GUARD_X + L * GUARD_DX + 50} y={GUARD_Y + 114} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                      1 of 309 million
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* random deaths: bars under the first guards */}
            {randU > 0 && (
              <g opacity={randFade}>
                {DEATHS.map((f, i) => {
                  const h = 120 * Math.pow(f, 0.35) * clamp01(randU * 3 - i);
                  return (
                    <g key={i}>
                      <rect x={GUARD_X + i * GUARD_DX + 20} y={GUARD_Y + 90} width={70} height={h} rx={5} fill={colors.NEGATIVE} opacity={0.6} />
                      <text x={GUARD_X + i * GUARD_DX + 55} y={GUARD_Y + 110 + h} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                        {i === 0 ? 'died at 1' : i === 1 ? 'died at 2' : 'died at 3'}
                      </text>
                    </g>
                  );
                })}
                {/* the cruel arithmetic: each guard multiplies the cost by 26 */}
                {randStatU > 0 && Array.from({ length: L - 1 }, (_, i) => (
                  <text key={i} x={GUARD_X + i * GUARD_DX + 130} y={GUARD_Y + 26} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace" fontWeight={700} opacity={randStatU}>
                    ×26
                  </text>
                ))}
                {randStatU > 0 && (
                  <text x={GUARD_X} y={GUARD_Y + 260} fill={colors.NEGATIVE} fontSize={14} fontFamily="monospace" fontWeight={700} opacity={randStatU}>
                    random: {RAND_BUDGET.toLocaleString()} executions · deepest prefix: {RAND_BEST}/{L} · crashes: {RAND_HIT < 0 ? 0 : 1}
                  </text>
                )}
              </g>
            )}

            {/* the corpus ladder */}
            {corpusU > 0 && (
              <g>
                <text x={GUARD_X} y={LADDER_Y - 18} fill={colors.TEXT} fontSize={14} fontWeight={600} opacity={corpusU}>
                  the kept corpus (seeded campaign, real inputs)
                </text>
                {ladder.map((c, i) => {
                  const u = clamp01(corpusU * ladder.length - i);
                  if (u <= 0) return null;
                  const y = LADDER_Y + i * 32;
                  return (
                    <g key={i} opacity={u}>
                      <rect x={GUARD_X} y={y} width={430} height={26} rx={5} fill={colors.PANEL} opacity={0.92} stroke={c.d === L ? colors.NEGATIVE : colors.POSITIVE} />
                      <text x={GUARD_X + 14} y={y + 18} fill={colors.TEXT} fontSize={12} fontFamily="monospace">
                        “{c.s}”
                      </text>
                      <text x={GUARD_X + 160} y={y + 18} fill={c.d === L ? colors.NEGATIVE : colors.POSITIVE} fontSize={12} fontFamily="monospace" fontWeight={700}>
                        depth {c.d}/{L} {c.d === L ? '→ CRASH' : 'kept'}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </Camera>
        </g>
      )}

      {/* coverage note, guided stats and harness panel — screen space, one column */}
      {showMain && covU > 0 && (
        <g opacity={noteOp}>
          <rect x={PANEL_X} y={PANEL_Y} width={360} height={104} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.SECONDARY} />
          <text x={PANEL_X + 24} y={PANEL_Y + 30} fill={colors.SECONDARY} fontSize={14} fontWeight={700}>
            the one-bit upgrade
          </text>
          <text x={PANEL_X + 24} y={PANEL_Y + 56} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
            not “did it fail?” but “how deep?”
          </text>
          <text x={PANEL_X + 24} y={PANEL_Y + 80} fill={colors.MUTED} fontSize={12}>
            depth = guards passed; keep what climbs
          </text>
        </g>
      )}
      {showMain && statU > 0 && (
        <g opacity={statOp}>
          <rect x={PANEL_X} y={PANEL_Y} width={370} height={148} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={PANEL_X + 24} y={PANEL_Y + 30} fill={colors.TEXT} fontSize={14} fontWeight={600}>
            50 seeded guided campaigns
          </text>
          <text x={PANEL_X + 24} y={PANEL_Y + 58} fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace">
            crashes found: {G_FOUND}/50
          </text>
          <text x={PANEL_X + 24} y={PANEL_Y + 82} fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace">
            median {G_MEDIAN.toLocaleString()} execs · max {G_MAX.toLocaleString()}
          </text>
          <text x={PANEL_X + 24} y={PANEL_Y + 106} fill={colors.NEGATIVE} fontSize={12.5} fontFamily="monospace">
            random: 0 crashes in {RAND_BUDGET.toLocaleString()}
          </text>
          <text x={PANEL_X + 24} y={PANEL_Y + 130} fill={colors.MUTED} fontSize={12}>
            space: 26⁶ ≈ {(SPACE / 1e6).toFixed(0)} million strings
          </text>
        </g>
      )}
      {showMain && harnessP > 0 && (
        <g opacity={harnessP * mainOp}>
          <rect x={PANEL_X} y={PANEL_Y} width={370} height={180} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={PANEL_X + 24} y={PANEL_Y + 30} fill={colors.TEXT} fontSize={14} fontWeight={600}>
            the harness around the model
          </text>
          {['tool call parser', 'prompt template', 'retry logic', 'sandbox boundary'].map((item, i) => (
            <text key={item} x={PANEL_X + 24} y={PANEL_Y + 58 + i * 24} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
              ▸ {item}
            </text>
          ))}
          <text x={PANEL_X + 24} y={PANEL_Y + 156} fill={colors.MUTED} fontSize={12}>
            the model itself: no coverage map
          </text>
        </g>
      )}
      {showMain && mathU > 0 && (
        <text x={PANEL_X + 185} y={PANEL_Y + 190} textAnchor="middle" fill={colors.WARM} fontSize={15} fontFamily="monospace" opacity={mathOp}>
          26⁶ → 6 × 26 (guess, bank, repeat)
        </text>
      )}

      {showMain && (
        <g opacity={titleU * mainOp}>
          <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Fuzzing the harness
          </text>
        </g>
      )}

      {/* close: a solid panel over the faded scene */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={1} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Random forgets. Coverage remembers.
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            random: 0 crashes in 200,000 · guided: 50/50, median {G_MEDIAN.toLocaleString()} — computed live
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            fuzz the deterministic shell around the model — that is where search compounds
          </text>
          <text x={640} y={412} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            finale: what you CAN assert about a model
          </text>
        </g>
      )}
    </>
  );
}

export function CoverageFuzz() {
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
