// Book scene — wasm-vm-rr, chapter 4: "Chaos and the Gauntlet".
// Chaos-mode race hunting and the worker/verifier loop: `rr record --chaos`
// reshuffles thread schedules until a race collides — into a REPLAYABLE
// trace; the verifier mints its own seed; the task lifecycle gates
// "implemented" behind a fresh adversarial session; refutations always cite
// an rr event; and the whole gauntlet restarts at the top on any failure.
// 5 beats = the chapter's 5 non-cover steps (captions define the beats).
import { Timeline, colors, ease, mulberry32 } from '../../core';
import type { SceneState } from '../../core';
import { GauntletRail } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------- layout ---
// 1280×720 stage; keep y ≳ 633 clear for captions.

// BEAT 0 — chaos lanes: two threads × 7 slots, reshuffled per run.
const N_RUNS = 4;
const SLOTS = 7;
const SLOT_W = 88;
const LANE = { x0: 150, y: [168, 250], h: 36 };
const slotX = (col: number) => LANE.x0 + col * SLOT_W + SLOT_W / 2;
const MID_Y = (LANE.y[0] + LANE.y[1]) / 2 + LANE.h / 2; // between the lanes
// The conflict pair: T0 stores, T1 loads the same address. Their column per
// run — apart on runs 1–3, colliding (same column) on run 4.
const SPECIAL_COL = [
  [1, 5, 2, 4], // T0 `st x`
  [4, 0, 6, 4], // T1 `ld x`
];
const CRASH_COL = 4;
const TRACE_BOX = { x: 950, y: 168, w: 230, h: 118 };
// Seeded filler blocks — deterministic, computed once at module scope.
const rand = mulberry32(0x5eed);
const FILL_COLORS = [colors.MUTED, colors.SECONDARY, colors.ACCENT];
const FILLER = Array.from({ length: N_RUNS }, () =>
  [0, 1].map(() =>
    Array.from({ length: SLOTS }, () => ({
      w: 54 + Math.floor(rand() * 3) * 9,
      color: FILL_COLORS[Math.floor(rand() * FILL_COLORS.length)],
    })),
  ),
);

// BEAT 1 — the seed exchange.
const WORKER = { x: 170, y: 190, w: 220, h: 96 };
const VERIFIER = { x: 890, y: 190, w: 220, h: 96 };
const SEED_Y = WORKER.y + WORKER.h / 2;
const MINT = { x: 640, y: 420 };

// BEAT 2 — the task lifecycle.
const LIFE_Y = 300;
const STATES = [
  { label: 'pending', x: 165 },
  { label: 'in-progress', x: 385 },
  { label: 'implemented', x: 645 },
  { label: 'verified', x: 1085 },
];
const GATE_X = 880; // the fresh-verifier gate between implemented → verified

// BEAT 3 — the refutation card + the recorded run.
const CARD = { x: 110, y: 140, w: 500, h: 210 };
const MK = { x: 700, y: 160, w: 250, h: 40 };
const TRACES = { x: 850, y: 340, w: 300, h: 96 };

// BEAT 4 — the gauntlet, end to end.
const RAIL = { x: 150, y: 340, w: 1000 };
const GATE_LABELS = ['fmt', 'clippy', 'test', 'diff-vs-Spike', 'rr verify'];
const FAIL_GATE = 4;

// -------------------------------------------------------------- timeline ---
export function buildScene() {
  const tl = new Timeline();
  const ch = {
    // group fades — one beat on stage at a time
    gChaos: tl.channel('gChaos', 0),
    gSeed: tl.channel('gSeed', 0),
    gLife: tl.channel('gLife', 0),
    gRef: tl.channel('gRef', 0),
    gRail: tl.channel('gRail', 0),
    // beat 0 — chaos
    chipU: tl.channel('chipU', 0),
    laneU: tl.channel('laneU', 0),
    runT: tl.channel('runT', 0),
    noteU: tl.channel('noteU', 0),
    flashU: tl.channel('flashU', 0),
    sealU: tl.channel('sealU', 0),
    // beat 1 — the seed
    wU: tl.channel('wU', 0),
    vU: tl.channel('vU', 0),
    seedX: tl.channel('seedX', WORKER.x + WORKER.w),
    seedO: tl.channel('seedO', 0),
    rejU: tl.channel('rejU', 0),
    mintU: tl.channel('mintU', 0),
    // beat 2 — the lifecycle
    lcU: tl.channel('lcU', 0),
    arrowU: tl.channel('arrowU', 0),
    gateU: tl.channel('gateU', 0),
    verPop: tl.channel('verPop', 0),
    refU: tl.channel('refU', 0),
    queueU: tl.channel('queueU', 0),
    // beat 3 — the citation
    cardE: tl.channel('cardE', 0),
    whenPop: tl.channel('whenPop', 0),
    mkU: tl.channel('mkU', 0),
    pktU: tl.channel('pktU', 0),
    // beat 4 — the gauntlet
    railR: tl.channel('railR', 0),
    railU: tl.channel('railU', -1),
    gates: GATE_LABELS.map((_, i) => tl.channel(`gate${i}`, 0)),
    arcU: tl.channel('arcU', 0),
    depU: tl.channel('depU', 0),
  };

  // BEAT 0 — chaos mode: reshuffle the schedule until the race collides
  tl.caption({ at: 0.4, dur: 5.5, text: 'Races hide in lucky schedules; rr record --chaos makes them unlucky on purpose.' });
  tl.tween(ch.gChaos, 1, { at: 0.5, dur: 0.5, ease: ease.enter });
  tl.tween(ch.chipU, 1, { at: 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(ch.laneU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(ch.runT, 3, { at: 2.2, dur: 5.4, ease: ease.linear }); // runs 1→4
  tl.tween(ch.noteU, 1, { at: 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(ch.flashU, 1, { at: 8.2, dur: 0.5, ease: ease.pop }); // run 4: collision
  tl.tween(ch.sealU, 1, { at: 9.4, dur: 1.2, ease: ease.move }); // sealed into a trace
  tl.hold(11.0, 1.0);
  tl.tween(ch.gChaos, 0, { at: 12.2, dur: 0.7, ease: ease.move });

  // BEAT 1 — the verifier's own seed, never the worker's
  tl.caption({ at: 13, dur: 5.5, text: "The verifier brings its own seed, never the worker's — authors don't pick the exam." });
  tl.tween(ch.gSeed, 1, { at: 13.2, dur: 0.6, ease: ease.enter });
  tl.tween(ch.wU, 1, { at: 13.4, dur: 0.6, ease: ease.enter });
  tl.tween(ch.vU, 1, { at: 13.7, dur: 0.6, ease: ease.enter });
  tl.tween(ch.seedO, 1, { at: 14.2, dur: 0.4, ease: ease.enter });
  tl.tween(ch.seedX, VERIFIER.x - 60, { at: 14.4, dur: 1.1, ease: ease.move }); // the offer
  tl.tween(ch.rejU, 1, { at: 15.5, dur: 0.4, ease: ease.pop }); // rejected
  tl.tween(ch.seedX, 560, { at: 15.7, dur: 0.9, ease: ease.move }); // bounced
  tl.tween(ch.seedO, 0, { at: 16.1, dur: 0.8, ease: ease.move });
  tl.tween(ch.mintU, 1, { at: 17.4, dur: 0.6, ease: ease.pop }); // mints its own
  tl.tween(ch.rejU, 0, { at: 18.2, dur: 0.8, ease: ease.move });
  tl.hold(21.5, 1.0);
  tl.tween(ch.gSeed, 0, { at: 23.2, dur: 0.7, ease: ease.move });

  // BEAT 2 — the lifecycle: implemented is a claim, verified survived an adversary
  tl.caption({ at: 24, dur: 5.5, text: 'Implemented is a claim; verified means a fresh adversary failed to refute it.' });
  tl.tween(ch.gLife, 1, { at: 24.2, dur: 0.6, ease: ease.enter });
  tl.tween(ch.lcU, 1, { at: 24.4, dur: 1.6, ease: ease.move });
  tl.tween(ch.arrowU, 1, { at: 25.6, dur: 1.2, ease: ease.draw });
  tl.tween(ch.gateU, 1, { at: 26.8, dur: 0.6, ease: ease.enter });
  tl.tween(ch.verPop, 1, { at: 27.8, dur: 0.5, ease: ease.pop });
  tl.tween(ch.refU, 1, { at: 29.2, dur: 1.3, ease: ease.draw }); // refuted → back to work
  tl.tween(ch.queueU, 1, { at: 31.0, dur: 0.6, ease: ease.enter });
  tl.hold(32.5, 1.0);
  tl.tween(ch.gLife, 0, { at: 34.2, dur: 0.7, ease: ease.move });

  // BEAT 3 — findings cite event numbers; refutations always come with a trace
  tl.caption({ at: 35, dur: 5.5, text: 'No finding without a citation — every refutation ships an rr event and a trace.' });
  tl.tween(ch.gRef, 1, { at: 35.2, dur: 0.6, ease: ease.enter });
  tl.tween(ch.cardE, 1, { at: 35.4, dur: 0.7, ease: ease.enter });
  tl.tween(ch.whenPop, 1, { at: 36.8, dur: 0.5, ease: ease.pop });
  tl.tween(ch.mkU, 1, { at: 38.0, dur: 0.6, ease: ease.enter });
  tl.tween(ch.pktU, 1, { at: 38.8, dur: 1.6, ease: ease.linear }); // final run → rr-traces/
  tl.hold(43.5, 1.0);
  tl.tween(ch.gRef, 0, { at: 45.2, dur: 0.7, ease: ease.move });

  // BEAT 4 — the gauntlet: fail anywhere, restart at the top
  tl.caption({ at: 46, dur: 6, text: "Fail anywhere, restart at the top — Replay's worker/critic loop on bare metal." });
  tl.tween(ch.gRail, 1, { at: 46.2, dur: 0.6, ease: ease.enter });
  tl.tween(ch.railR, 1, { at: 46.4, dur: 1.3, ease: ease.draw });
  // lap 1 — clean until the rr gate
  tl.set(ch.railU, 0, 47.9);
  tl.tween(ch.railU, 4, { at: 48.0, dur: 3.0, ease: ease.linear });
  for (let i = 0; i < 4; i++) tl.tween(ch.gates[i], 1, { at: 48.3 + i * 0.72, dur: 0.4, ease: ease.pop });
  tl.tween(ch.gates[FAIL_GATE], -1, { at: 51.0, dur: 0.35, ease: ease.pop }); // rr verify refutes
  tl.tween(ch.arcU, 1, { at: 51.6, dur: 1.1, ease: ease.move }); // back to the top
  for (let i = 0; i < 4; i++) tl.tween(ch.gates[i], 0, { at: 52.0, dur: 0.8, ease: ease.move });
  tl.tween(ch.gates[FAIL_GATE], 0, { at: 52.2, dur: 0.8, ease: ease.move });
  tl.set(ch.railU, 0, 52.7);
  // lap 2 — passes everywhere, banks the recorded run
  tl.tween(ch.railU, 4, { at: 53.4, dur: 3.4, ease: ease.linear });
  for (let i = 0; i < 4; i++) tl.tween(ch.gates[i], 1, { at: 53.7 + i * 0.68, dur: 0.4, ease: ease.pop });
  tl.tween(ch.gates[FAIL_GATE], 1, { at: 56.8, dur: 0.45, ease: ease.pop });
  tl.tween(ch.depU, 1, { at: 57.4, dur: 0.5, ease: ease.pop });
  tl.hold(58.4, 1.6);

  return { tl, ch };
}

const scene = buildScene();

// ------------------------------------------------------ local components ---

/** Rounded mono chip, centered on x. */
function Chip({ x, y, text, color, u, sub }: { x: number; y: number; text: string; color: string; u: number; sub?: string }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * 7.6 + 26;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu}>
      <rect x={-w / 2} y={-14} width={w} height={28} rx={14} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
      <text y={4.5} textAnchor="middle" fill={color} fontSize={12.5} fontWeight={700} fontFamily={MONO}>
        {text}
      </text>
      {sub !== undefined && (
        <text y={32} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
          {sub}
        </text>
      )}
    </g>
  );
}

/** A tiny five-pip die — the chaos scheduler's roulette. */
function Die({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-9} y={-9} width={18} height={18} rx={4} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
      {[[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]].map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={1.6} fill={colors.WARM} />
      ))}
    </g>
  );
}

/** One thread lane for the current run's arrangement. */
function ThreadLane({ lane, run, frac, laneU }: { lane: 0 | 1; run: number; frac: number; laneU: number }) {
  const y = LANE.y[lane];
  const enter = clamp01(laneU * 2 - lane); // T0 first, then T1
  if (enter <= 0) return null;
  const flick = clamp01(frac / 0.28); // each new run slides its blocks in
  const special = SPECIAL_COL[lane][run];
  return (
    <g opacity={enter}>
      <text x={LANE.x0 - 44} y={y + LANE.h / 2 + 4} fill={colors.MUTED} fontSize={13} fontWeight={700} fontFamily={MONO}>
        T{lane}
      </text>
      <rect x={LANE.x0 - 10} y={y - 4} width={SLOTS * SLOT_W + 20} height={LANE.h + 8} rx={8} fill={colors.PANEL} opacity={0.6} />
      {Array.from({ length: SLOTS }, (_, col) => {
        const isSpecial = col === special;
        const f = FILLER[run][lane][col];
        const w = isSpecial ? 62 : f.w;
        const color = isSpecial ? colors.WARM : f.color;
        return (
          <g key={col} transform={`translate(${slotX(col)}, ${y + LANE.h / 2 + (1 - flick) * 6})`} opacity={flick}>
            <rect x={-w / 2} y={-LANE.h / 2} width={w} height={LANE.h} rx={6} fill={color} opacity={isSpecial ? 0.85 : 0.28} />
            {isSpecial && (
              <text y={4.5} textAnchor="middle" fill={colors.BG} fontSize={12} fontWeight={800} fontFamily={MONO}>
                {lane === 0 ? 'st x' : 'ld x'}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Lifecycle state chip. */
function StateChip({ label, x, u, color, pop = 0 }: { label: string; x: number; u: number; color: string; pop?: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = label.length * 8.4 + 30;
  const k = 1 + 0.12 * clamp01(pop) * Math.sin(clamp01(pop) * Math.PI);
  return (
    <g transform={`translate(${x}, ${LIFE_Y + (1 - uu) * 12}) scale(${k})`} opacity={uu}>
      <rect x={-w / 2} y={-19} width={w} height={38} rx={19} fill={colors.PANEL} stroke={color} strokeWidth={1.8} />
      <text y={5} textAnchor="middle" fill={color} fontSize={14} fontWeight={700} fontFamily={MONO}>
        {label}
      </text>
    </g>
  );
}

function FlowArrow({ x1, x2, u, y = LIFE_Y }: { x1: number; x2: number; u: number; y?: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const xe = lerp(x1, x2, uu);
  return (
    <g stroke={colors.MUTED} strokeWidth={2} opacity={0.85}>
      <line x1={x1} y1={y} x2={xe} y2={y} />
      {uu > 0.95 && <path d={`M ${x2 - 7} ${y - 5} L ${x2} ${y} L ${x2 - 7} ${y + 5}`} fill="none" strokeLinecap="round" />}
    </g>
  );
}

// ---------------------------------------------------------------- render ---
export function Render({ s }: { s: SceneState }) {
  const { ch } = scene;
  const gChaos = s.get(ch.gChaos);
  const gSeed = s.get(ch.gSeed);
  const gLife = s.get(ch.gLife);
  const gRef = s.get(ch.gRef);
  const gRail = s.get(ch.gRail);

  return (
    <>
      {/* ------------------------------------------ BEAT 0 — chaos mode --- */}
      {gChaos > 0.002 && (() => {
        const chipU = clamp01(s.get(ch.chipU));
        const laneU = s.get(ch.laneU);
        const runT = s.get(ch.runT);
        const run = Math.max(0, Math.min(N_RUNS - 1, Math.floor(runT)));
        const frac = run === N_RUNS - 1 && runT >= N_RUNS - 1 ? 1 : runT - run;
        const flashU = clamp01(s.get(ch.flashU));
        const sealU = clamp01(s.get(ch.sealU));
        const crashX = slotX(CRASH_COL);
        const boxE = clamp01(sealU * 2.5);
        const gx = lerp(crashX, TRACE_BOX.x + TRACE_BOX.w / 2, sealU);
        const gy = lerp(MID_Y, TRACE_BOX.y + TRACE_BOX.h / 2 + 10, sealU);
        const gk = lerp(1, 0.55, sealU);
        return (
          <g opacity={gChaos}>
            {/* the attack tool, named */}
            <g opacity={chipU}>
              <Die x={168} y={104} />
              <text x={190} y={109} fill={colors.WARM} fontSize={14} fontWeight={700} fontFamily={MONO}>
                rr record --chaos
              </text>
              <text x={190} y={128} fill={colors.MUTED} fontSize={12}>
                randomized thread scheduling, every run a new permutation
              </text>
            </g>
            {/* run counter ticks with the reshuffles */}
            <text x={LANE.x0 + SLOTS * SLOT_W + 10} y={LANE.y[0] - 16} textAnchor="end" fill={colors.TEXT} fontSize={13} fontWeight={700} fontFamily={MONO} opacity={clamp01(laneU)}>
              run {run + 1} / {N_RUNS}
            </text>
            <ThreadLane lane={0} run={run} frac={frac} laneU={laneU} />
            <ThreadLane lane={1} run={run} frac={frac} laneU={laneU} />
            {/* what chaos is hunting */}
            <text x={LANE.x0} y={330} fill={colors.MUTED} fontSize={12.5} opacity={clamp01(s.get(ch.noteU))}>
              the attack tool for atomics · JIT cache · worker threads · SMP — doctrine says run several
            </text>
            {/* run 4: st x and ld x land in the same column — the collision */}
            {flashU > 0.002 && sealU < 0.98 && (
              <g opacity={flashU * (1 - sealU)}>
                <circle cx={crashX} cy={MID_Y} r={12 + 22 * flashU} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} opacity={0.9} />
                <circle cx={crashX} cy={MID_Y} r={30} fill={colors.NEGATIVE} opacity={0.18 * flashU} />
                <text x={crashX} y={MID_Y - 48} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontWeight={800} fontFamily={MONO}>
                  data race
                </text>
              </g>
            )}
            {/* ...and it is instantly sealed into a replayable trace */}
            {sealU > 0.002 && (
              <g>
                <g opacity={boxE}>
                  <rect x={TRACE_BOX.x} y={TRACE_BOX.y} width={TRACE_BOX.w} height={TRACE_BOX.h} rx={10} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.8} strokeOpacity={0.5 + 0.5 * sealU} />
                  <circle cx={TRACE_BOX.x + 20} cy={TRACE_BOX.y + 22} r={5} fill={colors.NEGATIVE} />
                  <text x={TRACE_BOX.x + 34} y={TRACE_BOX.y + 27} fill={colors.TEXT} fontSize={13} fontWeight={700} fontFamily={MONO}>
                    rr trace
                  </text>
                  <text x={TRACE_BOX.x + 16} y={TRACE_BOX.y + TRACE_BOX.h - 16} fill={colors.TEAL} fontSize={12} fontFamily={MONO} opacity={clamp01(sealU * 3 - 2)}>
                    replayable — same race, every time
                  </text>
                </g>
                {/* the colliding pair flies into the box */}
                <g transform={`translate(${gx}, ${gy}) scale(${gk})`}>
                  <rect x={-31} y={-22} width={62} height={20} rx={5} fill={colors.WARM} opacity={0.9} />
                  <rect x={-31} y={2} width={62} height={20} rx={5} fill={colors.WARM} opacity={0.9} />
                  <text y={-8} textAnchor="middle" fill={colors.BG} fontSize={11} fontWeight={800} fontFamily={MONO}>st x</text>
                  <text y={16} textAnchor="middle" fill={colors.BG} fontSize={11} fontWeight={800} fontFamily={MONO}>ld x</text>
                </g>
              </g>
            )}
          </g>
        );
      })()}

      {/* ----------------------------------- BEAT 1 — the verifier's seed --- */}
      {gSeed > 0.002 && (() => {
        const wU = clamp01(s.get(ch.wU));
        const vU = clamp01(s.get(ch.vU));
        const seedX = s.get(ch.seedX);
        const seedO = clamp01(s.get(ch.seedO));
        const rejU = clamp01(s.get(ch.rejU));
        const mintU = clamp01(s.get(ch.mintU));
        return (
          <g opacity={gSeed}>
            {[{ box: WORKER, label: 'worker', color: colors.ACCENT, u: wU, sub: 'implements the task' },
              { box: VERIFIER, label: 'verifier', color: colors.TEAL, u: vU, sub: 'a fresh adversarial session' }].map(({ box, label, color, u, sub }) => (
              u > 0 && (
                <g key={label} transform={`translate(0, ${(1 - u) * 12})`} opacity={u}>
                  <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={12} fill={colors.PANEL} stroke={color} strokeWidth={1.8} />
                  <text x={box.x + box.w / 2} y={box.y + 42} textAnchor="middle" fill={color} fontSize={17} fontWeight={700} fontFamily={MONO}>
                    {label}
                  </text>
                  <text x={box.x + box.w / 2} y={box.y + 68} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                    {sub}
                  </text>
                </g>
              )
            ))}
            {/* the worker's offered seed — rejected at the door */}
            {seedO > 0.002 && (
              <g transform={`translate(${seedX}, ${SEED_Y})`} opacity={seedO}>
                <rect x={-76} y={-14} width={152} height={28} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
                <text y={4.5} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>
                  worker's seed?
                </text>
              </g>
            )}
            {rejU > 0.002 && (
              <g transform={`translate(${VERIFIER.x - 26}, ${SEED_Y})`} opacity={rejU} stroke={colors.NEGATIVE} strokeWidth={3.5} strokeLinecap="round">
                <line x1={-9} y1={-9} x2={9} y2={9} />
                <line x1={9} y1={-9} x2={-9} y2={9} />
              </g>
            )}
            {/* the verifier mints its own */}
            {mintU > 0.002 && (
              <g transform={`translate(${MINT.x}, ${MINT.y}) scale(${0.85 + 0.15 * mintU})`} opacity={mintU}>
                <rect x={-260} y={-30} width={520} height={60} rx={12} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={2} />
                <text y={-2} textAnchor="middle" fill={colors.TEAL} fontSize={17} fontWeight={800} fontFamily={MONO} letterSpacing={0.5}>
                  SEED = 0x5EED_2026_0702_CAFE
                </text>
                <text y={20} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  splitmix64 · verifier_fuzz.rs
                </text>
              </g>
            )}
          </g>
        );
      })()}

      {/* -------------------------------------- BEAT 2 — the lifecycle --- */}
      {gLife > 0.002 && (() => {
        const lcU = s.get(ch.lcU);
        const arrowU = s.get(ch.arrowU);
        const gateU = clamp01(s.get(ch.gateU));
        const verPop = s.get(ch.verPop);
        const refU = clamp01(s.get(ch.refU));
        const chipHalf = (label: string) => (label.length * 8.4 + 30) / 2;
        return (
          <g opacity={gLife}>
            <StateChip label="pending" x={STATES[0].x} u={clamp01(lcU * 4)} color={colors.MUTED} />
            <StateChip label="in-progress" x={STATES[1].x} u={clamp01(lcU * 4 - 1)} color={colors.ACCENT} />
            <StateChip label="implemented" x={STATES[2].x} u={clamp01(lcU * 4 - 2)} color={colors.WARM} />
            <StateChip label="verified" x={STATES[3].x} u={clamp01(lcU * 4 - 3)} color={colors.POSITIVE} pop={verPop} />
            <FlowArrow x1={STATES[0].x + chipHalf('pending') + 6} x2={STATES[1].x - chipHalf('in-progress') - 6} u={clamp01(arrowU * 3)} />
            <FlowArrow x1={STATES[1].x + chipHalf('in-progress') + 6} x2={STATES[2].x - chipHalf('implemented') - 6} u={clamp01(arrowU * 3 - 1)} />
            <FlowArrow x1={STATES[2].x + chipHalf('implemented') + 6} x2={STATES[3].x - chipHalf('verified') - 6} u={clamp01(arrowU * 3 - 2)} />
            {/* the gate: a fresh adversarial verifier session must FAIL to refute */}
            {gateU > 0.002 && (
              <g transform={`translate(${GATE_X}, ${LIFE_Y})`} opacity={gateU}>
                <line x1={0} y1={-34} x2={0} y2={34} stroke={colors.TEAL} strokeWidth={3} strokeDasharray="5 5" />
                <text y={-46} textAnchor="middle" fill={colors.TEAL} fontSize={12.5} fontWeight={700} fontFamily={MONO}>
                  fresh verifier session
                </text>
                <text y={54} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                  verified only when it FAILS to refute
                </text>
              </g>
            )}
            {/* refuted — the negative return arc back to in-progress */}
            {refU > 0.002 && (
              <g opacity={clamp01(refU * 3)}>
                <path
                  d={`M ${GATE_X} ${LIFE_Y + 76} Q ${(GATE_X + STATES[1].x) / 2} ${LIFE_Y + 190} ${STATES[1].x} ${LIFE_Y + 32}`}
                  fill="none"
                  stroke={colors.NEGATIVE}
                  strokeWidth={2.5}
                  pathLength={1}
                  strokeDasharray={`${refU} 1`}
                  strokeOpacity={0.9}
                />
                {refU > 0.97 && (
                  <path
                    d={`M ${STATES[1].x - 7} ${LIFE_Y + 46} L ${STATES[1].x} ${LIFE_Y + 32} L ${STATES[1].x + 9} ${LIFE_Y + 43}`}
                    fill="none"
                    stroke={colors.NEGATIVE}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                )}
                <text x={(GATE_X + STATES[1].x) / 2} y={LIFE_Y + 158} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5} fontWeight={800} fontFamily={MONO} opacity={clamp01(refU * 2 - 1)}>
                  refuted → in-progress
                </text>
              </g>
            )}
            <text x={640} y={594} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={clamp01(s.get(ch.queueU))}>
              python3 tools/build_queue.py → tasks/QUEUE.md
            </text>
          </g>
        );
      })()}

      {/* ------------------------------------- BEAT 3 — the citation --- */}
      {gRef > 0.002 && (() => {
        const cardE = clamp01(s.get(ch.cardE));
        const whenPop = clamp01(s.get(ch.whenPop));
        const mkU = clamp01(s.get(ch.mkU));
        const pktU = clamp01(s.get(ch.pktU));
        const glow = clamp01(pktU * 5 - 4);
        // packet path: make target → down into rr-traces/
        const px = lerp(MK.x + MK.w / 2, TRACES.x + TRACES.w / 2, pktU);
        const py = lerp(MK.y + MK.h, TRACES.y, pktU) - Math.sin(pktU * Math.PI) * 24;
        return (
          <g opacity={gRef}>
            {/* the refutation card */}
            {cardE > 0.002 && (
              <g transform={`translate(0, ${(1 - cardE) * 14})`} opacity={cardE}>
                <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.8} />
                <rect x={CARD.x} y={CARD.y} width={5} height={CARD.h} rx={2.5} fill={colors.NEGATIVE} opacity={0.85} />
                <text x={CARD.x + 24} y={CARD.y + 38} fill={colors.NEGATIVE} fontSize={16} fontWeight={800} fontFamily={MONO} letterSpacing={1}>
                  REFUTED · E0-T17
                </text>
                <text x={CARD.x + 24} y={CARD.y + 72} fill={colors.TEXT} fontSize={14.5} fontFamily={MONO}>
                  atomic RMW lost under chaos scheduling
                </text>
                {/* the point-link: every finding cites an rr event number */}
                {whenPop > 0.002 && (
                  <g transform={`translate(${CARD.x + 24}, ${CARD.y + 112}) scale(${0.9 + 0.1 * whenPop})`} opacity={whenPop}>
                    <rect y={-2} width={232} height={30} rx={15} fill={colors.TEAL} opacity={0.14} />
                    <rect y={-2} width={232} height={30} rx={15} fill="none" stroke={colors.TEAL} strokeWidth={1.6} />
                    <text x={14} y={18} fill={colors.TEAL} fontSize={13} fontWeight={700} fontFamily={MONO}>
                      ⌖ when → event 41982
                    </text>
                  </g>
                )}
                <text x={CARD.x + 24} y={CARD.y + 176} fill={colors.MUTED} fontSize={12.5} opacity={whenPop}>
                  a claim you can seek to — not an anecdote
                </text>
              </g>
            )}
            {/* the recorded final run */}
            {mkU > 0.002 && (
              <g opacity={mkU}>
                <g transform={`translate(0, ${(1 - mkU) * 10})`}>
                  <rect x={MK.x} y={MK.y} width={MK.w} height={MK.h} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
                  <text x={MK.x + MK.w / 2} y={MK.y + 26} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={700} fontFamily={MONO}>
                    make verify-E0-Tnn
                  </text>
                </g>
                <text x={(MK.x + MK.w / 2 + TRACES.x + TRACES.w / 2) / 2 + 40} y={(MK.y + MK.h + TRACES.y) / 2 - 18} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  record-test.sh · records the final run
                </text>
                <rect x={TRACES.x} y={TRACES.y} width={TRACES.w} height={TRACES.h} rx={10} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.6} strokeOpacity={0.5 + 0.5 * glow} />
                {glow > 0.002 && <rect x={TRACES.x} y={TRACES.y} width={TRACES.w} height={TRACES.h} rx={10} fill={colors.TEAL} opacity={0.08 * glow} />}
                <circle cx={TRACES.x + 22} cy={TRACES.y + 26} r={5} fill={colors.NEGATIVE} />
                <text x={TRACES.x + 36} y={TRACES.y + 31} fill={colors.TEXT} fontSize={14} fontWeight={700} fontFamily={MONO}>
                  rr-traces/
                </text>
                <text x={TRACES.x + 20} y={TRACES.y + 66} fill={colors.MUTED} fontSize={12.5} opacity={glow}>
                  refutations always have a trace
                </text>
                {pktU > 0.002 && pktU < 0.995 && <circle cx={px} cy={py} r={6} fill={colors.WARM} />}
              </g>
            )}
          </g>
        );
      })()}

      {/* ------------------------------------- BEAT 4 — the gauntlet --- */}
      {gRail > 0.002 && (
        <g opacity={gRail}>
          <text x={640} y={200} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={clamp01(s.get(ch.railR))}>
            every task runs the whole gauntlet — a failure anywhere restarts it at the top
          </text>
          <GauntletRail
            x={RAIL.x}
            y={RAIL.y}
            w={RAIL.w}
            gates={GATE_LABELS.map((label, i) => ({ label, state: s.get(ch.gates[i]) }))}
            u={s.get(ch.railU)}
            reveal={s.get(ch.railR)}
            arcU={s.get(ch.arcU)}
            arcFrom={FAIL_GATE}
            deposit={{ gate: FAIL_GATE, label: '+1 trace', u: s.get(ch.depU) }}
          />
          <text x={640} y={470} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO} opacity={clamp01(s.get(ch.depU))}>
            verified ⇒ a recorded run in the bank
          </text>
        </g>
      )}
    </>
  );
}

/** The module-scope scene; the book player samples its timeline per beat. */
export const vizScene = () => scene;
