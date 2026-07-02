// Book scene — traveling-salesman, chapter 6: "Why Hard Problems Stay Hard".
// The honest close. No polynomial-time exact algorithm is known: brute force is
// (n−1)! and Held–Karp is 2ⁿ·n² — both exponential (docs/solvers.rst notes exact
// solvers suit "less than 15 nodes"; branch_and_bound stretches a little further).
// The heuristics return a tour that is "not necessarily optimal" (their own
// docstrings) but land within a few percent, fast — and that is the toolbox that
// ships: setup_initial_solution → local search → simulated annealing → Lin–Kernighan.
import { MathLabel, Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// the real heuristic pipeline (python_tsp.heuristics)
const PIPE = [
  { t: 'setup_initial_solution', c: colors.MUTED },
  { t: 'solve_tsp_local_search', c: colors.ACCENT },
  { t: 'solve_tsp_simulated_annealing', c: colors.WARM },
  { t: 'solve_tsp_lin_kernighan', c: colors.SECONDARY },
];
const PW = 250;
const PGAP = 40;
const PIPE_Y = 470;
const PIPE_X0 = 640 - ((PW * PIPE.length + PGAP * (PIPE.length - 1)) / 2) + PW / 2;

export function buildScene() {
  const tl = new Timeline();

  const expU = tl.channel('expU', 0);
  const openU = tl.channel('openU', 0);
  const exactU = tl.channel('exactU', 0);
  const bnbU = tl.channel('bnbU', 0);
  const heurU = tl.channel('heurU', 0);
  const pipeU = tl.channel('pipeU', 0); // 0..PIPE.length
  const shipU = tl.channel('shipU', 0);

  // BEAT 0 — no polynomial algorithm is known; both exact routes are exponential
  tl.caption({ at: 0.3, dur: 4.4, text: 'No polynomial-time exact algorithm is known. Both routes stay exponential.' });
  tl.tween(expU, 1, { at: 0.6, dur: 0.9, ease: ease.enter });
  tl.tween(openU, 1, { at: 2.6, dur: 0.8, ease: ease.enter });
  tl.hold(4.8, 0.8);

  // BEAT 1 — exact solvers only pay off for small n
  tl.caption({ at: 5.8, dur: 4.2, text: 'So exact solvers are for small n — under ~15 cities in a few minutes.' });
  tl.tween(exactU, 1, { at: 6.1, dur: 0.9, ease: ease.enter });
  tl.tween(bnbU, 1, { at: 8.0, dur: 0.8, ease: ease.enter });
  tl.hold(10.2, 0.8);

  // BEAT 2 — heuristics drop the guarantee but land within a few percent
  tl.caption({ at: 11.2, dur: 4.4, text: 'Heuristics drop the guarantee — "not necessarily optimal" — but stay close.' });
  tl.tween(exactU, 0.25, { at: 11.2, dur: 0.5, ease: ease.move });
  tl.tween(openU, 0.25, { at: 11.2, dur: 0.5, ease: ease.move });
  tl.tween(heurU, 1, { at: 11.6, dur: 0.9, ease: ease.enter });
  tl.hold(15.8, 0.8);

  // BEAT 3 — the toolbox that actually ships
  tl.caption({ at: 16.8, dur: 4.6, text: 'The shipping toolbox: an initial tour, then local search, annealing, Lin–Kernighan.' });
  tl.tween(pipeU, PIPE.length, { at: 17.2, dur: 3.0, ease: ease.linear });
  tl.hold(20.6, 0.8);

  // BEAT 4 — give up the guarantee, keep the good-enough answer
  tl.caption({ at: 21.6, dur: 4.6, text: 'Give up the perfect answer, keep the good-enough one. That is what ships.' });
  tl.tween(shipU, 1, { at: 22.0, dur: 0.9, ease: ease.pop });
  tl.hold(25.4, 1.2);

  return { tl, expU, openU, exactU, bnbU, heurU, pipeU, shipU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const expU = clamp01(s.get(scene.expU));
  const exactU = clamp01(s.get(scene.exactU));
  const heurU = clamp01(s.get(scene.heurU));
  const pipe = s.get(scene.pipeU);

  return (
    <>
      {/* the two exact complexities */}
      {expU > 0.01 && (
        <g opacity={expU}>
          <text x={640} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={mono}>
            exact — guaranteed optimal, exponential
          </text>
          <MathLabel tex={'\\text{brute force: } (n-1)!'} x={400} y={150} fontSize={22} color={colors.NEGATIVE} anchor="middle" />
          <MathLabel tex={'\\text{Held–Karp: } 2^{n}\\,n^{2}'} x={880} y={150} fontSize={22} color={colors.WARM} anchor="middle" />
        </g>
      )}
      {s.get(scene.openU) > 0.01 && (
        <text x={640} y={200} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16} fontWeight={700} fontFamily={mono} opacity={clamp01(s.get(scene.openU))}>
          P vs NP — still open
        </text>
      )}

      {/* exact usable range */}
      {exactU > 0.01 && (
        <g opacity={exactU}>
          <text x={300} y={262} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={mono}>
            n {'<'} 15: solvable
          </text>
          <rect x={200} y={276} width={200} height={16} rx={8} fill={colors.POSITIVE} opacity={0.5} />
          <text x={640} y={262} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={mono}>
            beyond: blows up
          </text>
          <rect x={440} y={276} width={400} height={16} rx={8} fill={colors.NEGATIVE} opacity={0.35} />
          {s.get(scene.bnbU) > 0.01 && (
            <text x={980} y={287} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={mono} opacity={clamp01(s.get(scene.bnbU))}>
              branch_and_bound stretches further
            </text>
          )}
        </g>
      )}

      {/* heuristics framing */}
      {heurU > 0.01 && (
        <g opacity={heurU}>
          <text x={640} y={352} textAnchor="middle" fill={colors.POSITIVE} fontSize={17} fontWeight={700} fontFamily={mono}>
            heuristics — no guarantee, within a few %
          </text>
        </g>
      )}

      {/* the shipping pipeline */}
      {PIPE.map((p, i) => {
        const u = clamp01(pipe - i);
        if (u <= 0) return null;
        const x = PIPE_X0 + i * (PW + PGAP);
        return (
          <g key={i} opacity={u}>
            {i > 0 && <line x1={x - PW / 2 - PGAP} y1={PIPE_Y} x2={x - PW / 2} y2={PIPE_Y} stroke={colors.GRID} strokeWidth={1.6} />}
            <rect x={x - PW / 2} y={PIPE_Y - 22} width={PW} height={44} rx={9} fill={colors.PANEL} stroke={p.c} strokeWidth={1.6} />
            <text x={x} y={PIPE_Y + 5} textAnchor="middle" fill={p.c} fontSize={14} fontFamily={mono}>
              {p.t}
            </text>
          </g>
        );
      })}

      {/* closing line */}
      {s.get(scene.shipU) > 0.01 && (
        <text x={640} y={556} textAnchor="middle" fill={colors.WARM} fontSize={19} fontWeight={700} fontFamily={mono} opacity={clamp01(s.get(scene.shipU))}>
          good enough, fast — that is what ships
        </text>
      )}
    </>
  );
}

export const vizScene = () => scene;
