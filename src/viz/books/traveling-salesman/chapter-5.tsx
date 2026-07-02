// Book scene — traveling-salesman, chapter 5: "Climbing Out".
// On a trickier seeded map, first-improvement 2-opt freezes in a local minimum
// (208.6) short of the optimum (191.2). Simulated annealing (heuristics/
// simulated_annealing.py) escapes it: the Metropolis rule _acceptance_rule
// accepts a WORSE neighbour with probability exp(−Δ/T), and the temperature cools
// geometrically (temp *= alpha, alpha=0.9). The escape move shown is real —
// Δ=+22.4 at T=41.8 gives p=0.59 — and the run lands back on the optimum, 191.2.
import { MathLabel, Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { TimerArc } from '../../primitives';
import { bruteForce, distanceMatrix, makeCities, place, simulatedAnnealing, tourLength, tourPoints } from './tsp';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout —————
const MAP = { x: 72, y: 104, w: 500, h: 430 };
const N = 9;
const CITIES = makeCities(55, N);
const STAGED = CITIES.map((p) => place(p, MAP));
const D = distanceMatrix(CITIES);
const OPT = bruteForce(D); // 191.2
const TRAP = [0, 1, 7, 5, 4, 6, 8, 2, 3]; // a real 2-opt local minimum (208.6)
const TRAP_LEN = tourLength(TRAP, D);
const SA = simulatedAnnealing(TRAP, D, 1); // deterministic run that escapes
const WORSE = SA.firstWorse ? SA.firstWorse.to : TRAP; // the accepted-worse tour
const WORSE_LEN = tourLength(WORSE, D);
const DFX = SA.firstWorse ? SA.firstWorse.dfx : 0;
const TEMP = SA.firstWorse ? SA.firstWorse.temp : SA.temp0;
const PROB = SA.firstWorse ? SA.firstWorse.p : 1;

const TOURS = [TRAP, WORSE, OPT.order];
const LENS = [TRAP_LEN, WORSE_LEN, OPT.len];

const DIAL = { cx: 858, cy: 214, r: 74 };
const MATH_X = 720;

export function buildScene() {
  const tl = new Timeline();

  const cityU = tl.channel('cityU', 0);
  const trapU = tl.channel('trapU', 0);
  const optGhostU = tl.channel('optGhostU', 0);
  const morph = tl.channel('morph', 0); // 0=trap, 1=worse, 2=optimum
  const acceptU = tl.channel('acceptU', 0); // Metropolis rule reveal
  const workedU = tl.channel('workedU', 0); // worked probability
  const badgeU = tl.channel('badgeU', 0); // "accepted" badge
  const tempU = tl.channel('tempU', 1); // dial fill (hot→cold)
  const coolU = tl.channel('coolU', 0); // temp *= alpha reveal
  const gapU = tl.channel('gapU', 0);

  // BEAT 0 — a local minimum: 2-opt froze here, short of the optimum
  tl.caption({ at: 0.3, dur: 4.2, text: 'A trickier map. Local search froze at 208.6 — the optimum is 191.2.' });
  tl.tween(cityU, 1, { at: 0.5, dur: 1.0, ease: ease.enter });
  tl.tween(trapU, 1, { at: 1.4, dur: 1.4, ease: ease.draw });
  tl.tween(optGhostU, 1, { at: 3.2, dur: 1.2, ease: ease.draw });
  tl.hold(4.6, 0.8);

  // BEAT 1 — annealing sometimes accepts a WORSE tour to escape
  tl.caption({ at: 5.6, dur: 4.0, text: 'Annealing’s trick: sometimes accept a worse tour to escape the trap.' });
  tl.tween(acceptU, 1, { at: 6.0, dur: 0.8, ease: ease.enter });
  tl.tween(tempU, 1, { at: 6.0, dur: 0.3, ease: ease.linear });
  tl.hold(9.6, 0.8);

  // BEAT 2 — Metropolis: accept worse with probability exp(−Δ/T)
  tl.caption({ at: 10.6, dur: 4.6, text: 'Metropolis rule: a step +22.4 longer is taken with probability 0.59.' });
  tl.tween(morph, 1, { at: 11.0, dur: 1.6, ease: ease.move });
  tl.tween(workedU, 1, { at: 12.4, dur: 0.7, ease: ease.enter });
  tl.tween(badgeU, 1, { at: 13.2, dur: 0.5, ease: ease.pop });
  tl.hold(15.2, 0.8);

  // BEAT 3 — the temperature cools each cycle: temp *= alpha
  tl.caption({ at: 16.2, dur: 4.4, text: 'Each cycle the temperature cools: temp *= alpha, with alpha = 0.9.' });
  tl.tween(coolU, 1, { at: 16.6, dur: 0.6, ease: ease.enter });
  tl.tween(badgeU, 0, { at: 16.6, dur: 0.4, ease: ease.move });
  tl.tween(tempU, 0.12, { at: 16.9, dur: 3.4, ease: ease.move });
  tl.hold(20.6, 0.8);

  // BEAT 4 — hot jumps early, cold refinement late: it lands on the optimum
  tl.caption({ at: 21.6, dur: 4.6, text: 'Wild early, picky late — the cooled run settles back onto 191.2.' });
  tl.tween(morph, 2, { at: 22.0, dur: 2.0, ease: ease.move });
  tl.tween(gapU, 1, { at: 23.4, dur: 0.8, ease: ease.enter });
  tl.hold(25.8, 1.2);

  return { tl, cityU, trapU, optGhostU, morph, acceptU, workedU, badgeU, tempU, coolU, gapU };
}

const scene = buildScene();

function poly(order: number[], color: string, opacity: number, width = 2.4, dash?: string) {
  if (opacity <= 0.001) return null;
  return <polyline points={tourPoints(order, STAGED)} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" opacity={opacity} strokeDasharray={dash} />;
}

export function Render({ s }: { s: SceneState }) {
  const cityU = clamp01(s.get(scene.cityU));
  const trapU = clamp01(s.get(scene.trapU));
  const optGhostU = clamp01(s.get(scene.optGhostU));
  const morph = s.get(scene.morph);
  const lower = Math.max(0, Math.min(2, Math.floor(morph)));
  const upper = Math.min(2, lower + 1);
  const frac = clamp01(morph - lower);
  const trans = frac > 0.001 && frac < 0.999 && upper !== lower;
  const settled = Math.round(morph);
  const curLen = LENS[Math.max(0, Math.min(2, settled))];
  const tempU = clamp01(s.get(scene.tempU));
  const badgeU = clamp01(s.get(scene.badgeU));
  const gapU = clamp01(s.get(scene.gapU));

  // tour color: trap=NEGATIVE, worse=WARM, optimum=POSITIVE
  const TCOL = [colors.NEGATIVE, colors.WARM, colors.POSITIVE];
  const dialColor = tempU > 0.5 ? colors.NEGATIVE : tempU > 0.25 ? colors.WARM : colors.ACCENT;

  return (
    <>
      <rect x={MAP.x - 22} y={MAP.y - 22} width={MAP.w + 44} height={MAP.h + 44} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />

      {/* optimum ghost for comparison */}
      {optGhostU > 0 && poly(OPT.order, colors.POSITIVE, 0.4 * optGhostU * (settled === 2 ? 0 : 1), 2, '4 5')}

      {/* current tour (crossfade trap → worse → optimum) */}
      {poly(TOURS[lower], TCOL[lower], trapU * (trans ? 1 - frac : 1))}
      {trans && poly(TOURS[upper], TCOL[upper], trapU * frac)}

      {/* cities */}
      {STAGED.map((p, i) => {
        const e = clamp01(cityU * N - i);
        if (e <= 0) return null;
        return <circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 8 : 5.5} fill={i === 0 ? colors.WARM : colors.ACCENT} opacity={e} />;
      })}
      <text x={MAP.x + MAP.w / 2} y={MAP.y + MAP.h + 4} textAnchor="middle" fill={TCOL[Math.max(0, Math.min(2, settled))]} fontSize={15} fontWeight={700} fontFamily={mono} opacity={trapU}>
        current tour = {curLen.toFixed(1)}
      </text>

      {/* the temperature dial */}
      {s.get(scene.acceptU) > 0.01 && (
        <g opacity={clamp01(s.get(scene.acceptU))}>
          <circle cx={DIAL.cx} cy={DIAL.cy} r={DIAL.r} fill="none" stroke={colors.GRID} strokeWidth={10} />
          <TimerArc cx={DIAL.cx} cy={DIAL.cy} r={DIAL.r} u={tempU} color={dialColor} width={10} />
          <text x={DIAL.cx} y={DIAL.cy - 6} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={mono}>
            temperature
          </text>
          <text x={DIAL.cx} y={DIAL.cy + 22} textAnchor="middle" fill={dialColor} fontSize={26} fontWeight={700} fontFamily={mono}>
            {(TEMP * tempU).toFixed(1)}
          </text>
          {s.get(scene.coolU) > 0.01 && (
            <MathLabel tex={'T \\leftarrow \\alpha\\,T,\\ \\alpha = 0.9'} x={DIAL.cx} y={DIAL.cy + DIAL.r + 34} fontSize={16} color={colors.MUTED} anchor="middle" opacity={clamp01(s.get(scene.coolU))} />
          )}
        </g>
      )}

      {/* the acceptance rule + worked number */}
      {s.get(scene.acceptU) > 0.01 && (
        <g opacity={clamp01(s.get(scene.acceptU))}>
          <MathLabel tex={'P_{\\text{accept}} = e^{-\\Delta / T}'} x={MATH_X} y={392} fontSize={24} color={colors.TEXT} anchor="start" />
          {s.get(scene.workedU) > 0.01 && (
            <g opacity={clamp01(s.get(scene.workedU))}>
              <MathLabel tex={`e^{-${DFX.toFixed(1)}/${TEMP.toFixed(1)}} = ${PROB.toFixed(2)}`} x={MATH_X} y={440} fontSize={20} color={colors.WARM} anchor="start" />
              <text x={MATH_X} y={474} fill={colors.MUTED} fontSize={13} fontFamily={mono}>
                Δ = +{DFX.toFixed(1)} longer, accepted anyway
              </text>
            </g>
          )}
          {badgeU > 0.01 && (
            <g opacity={badgeU} transform={`translate(${MATH_X + 250}, 388)`}>
              <rect x={-8} y={-20} width={112} height={28} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={48} y={-1} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700} fontFamily={mono}>
                accepted
              </text>
            </g>
          )}
        </g>
      )}

      {/* final gap */}
      {gapU > 0.01 && (
        <g opacity={gapU}>
          <text x={MATH_X} y={510} fill={colors.POSITIVE} fontSize={22} fontWeight={700} fontFamily={mono}>
            escaped → 191.2 (optimum)
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
