// Book scene — traveling-salesman, chapter 2: "Two Ways to Be Exact".
// Brute force enumerates all (n−1)! tours and keeps the best (exact/brute_force.py);
// Held–Karp (exact/dynamic_programming.py) rewrites the search as overlapping
// subproblems dist(ni, N) = min over nj in N ( c[ni,nj] + dist(nj, N−{nj}) ),
// memoised with lru_cache over a frozenset — cutting (n−1)! work to 2ⁿ·n². Both
// return the SAME optimal tour, really solved here by brute force on the map.
import { MathLabel, Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { bruteForce, distanceMatrix, makeCities, mulberry32, place, tourPoints } from './tsp';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout —————
const MAP = { x: 72, y: 116, w: 420, h: 400 };
const N = 9;
const CITIES = makeCities(17, N);
const STAGED = CITIES.map((p) => place(p, MAP));
const D = distanceMatrix(CITIES);
const OPT = bruteForce(D); // the real optimum, found by brute force (n=9)

// a few candidate tours to flash through while "checking all permutations"
const rnd = mulberry32(99);
const CANDIDATES = Array.from({ length: 8 }, () => {
  const rest = [1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [0, ...rest];
});

// the subset-recursion DAG (Held–Karp): two parents reuse ONE memoised child.
const PILL = { w: 118, h: 30 };
const NODES = {
  root: { x: 690, y: 150, t: 'dist(0, {1,2,3})' },
  a: { x: 600, y: 232, t: 'dist(1, {2,3})' },
  b: { x: 780, y: 232, t: 'dist(2, {1,3})' },
  shared: { x: 690, y: 320, t: 'dist(3, {2})' }, // reached from both a and b
};

export function buildScene() {
  const tl = new Timeline();

  const cityU = tl.channel('cityU', 0);
  const scanU = tl.channel('scanU', 0); // flashing candidate index
  const optU = tl.channel('optU', 0); // lock the optimal tour
  const wallU = tl.channel('wallU', 0); // (n−1)! wall
  const recurU = tl.channel('recurU', 0); // Held–Karp recurrence
  const dagU = tl.channel('dagU', 0); // subset DAG entrance
  const cacheU = tl.channel('cacheU', 0); // memo cache-hit highlight
  const cmpU = tl.channel('cmpU', 0); // complexity comparison
  const sameU = tl.channel('sameU', 0); // "same optimum" badge

  // BEAT 0 — brute force: try every ordering, keep the shortest
  tl.caption({ at: 0.3, dur: 4.2, text: 'Brute force: try every ordering, keep the shortest. Guaranteed optimal.' });
  tl.tween(cityU, 1, { at: 0.5, dur: 1.2, ease: ease.enter });
  tl.tween(scanU, 1, { at: 1.8, dur: 2.6, ease: ease.linear });
  tl.tween(optU, 1, { at: 4.6, dur: 0.8, ease: ease.draw });
  tl.hold(5.6, 0.8);

  // BEAT 1 — but that is (n−1)! work: an exponential wall
  tl.caption({ at: 6.6, dur: 4, text: 'But it walks (n−1)! orderings — 40,320 just for nine cities.' });
  tl.tween(wallU, 1, { at: 6.9, dur: 0.8, ease: ease.enter });
  tl.hold(10.2, 0.8);

  // BEAT 2 — Held–Karp: rewrite it as subproblems by (city, remaining set)
  tl.caption({ at: 11.2, dur: 4.6, text: 'Held–Karp reframes it: best cost from a city through a set of the rest.' });
  tl.tween(wallU, 0, { at: 11.2, dur: 0.5, ease: ease.move });
  tl.tween(recurU, 1, { at: 11.6, dur: 0.8, ease: ease.enter });
  tl.tween(dagU, 1, { at: 12.6, dur: 1.4, ease: ease.draw });
  tl.hold(15.8, 0.8);

  // BEAT 3 — overlapping subproblems, memoised with lru_cache over a frozenset
  tl.caption({ at: 16.8, dur: 4.4, text: 'Subproblems repeat — lru_cache over a frozenset returns them instantly.' });
  tl.tween(cacheU, 1, { at: 17.2, dur: 1.0, ease: ease.pop });
  tl.hold(21.2, 0.8);

  // BEAT 4 — the payoff: (n−1)! collapses to 2ⁿ·n²
  tl.caption({ at: 22.2, dur: 4.6, text: '2ⁿ subsets × n cities: at n=15, ten billion tours becomes seven million.' });
  tl.tween(cmpU, 1, { at: 22.6, dur: 0.9, ease: ease.enter });
  tl.hold(26.8, 0.8);

  // BEAT 5 — still exponential, but both return the SAME optimal tour
  tl.caption({ at: 27.8, dur: 4.4, text: 'Still exponential — a different universe. Same exact answer, less work.' });
  tl.tween(sameU, 1, { at: 28.2, dur: 0.8, ease: ease.pop });
  tl.hold(31.6, 1.2);

  return { tl, cityU, scanU, optU, wallU, recurU, dagU, cacheU, cmpU, sameU };
}

const scene = buildScene();

function Pill({ x, y, t, u, glow }: { x: number; y: number; t: string; u: number; glow?: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const g = clamp01(glow ?? 0);
  return (
    <g opacity={uu}>
      <rect
        x={x - PILL.w / 2}
        y={y - PILL.h / 2}
        width={PILL.w}
        height={PILL.h}
        rx={7}
        fill={colors.PANEL}
        stroke={g > 0 ? colors.POSITIVE : colors.SECONDARY}
        strokeWidth={g > 0 ? 2.2 : 1.4}
      />
      <text x={x} y={y + 4} textAnchor="middle" fill={g > 0 ? colors.POSITIVE : colors.TEXT} fontSize={11.5} fontFamily={mono}>
        {t}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cityU = clamp01(s.get(scene.cityU));
  const scanU = clamp01(s.get(scene.scanU));
  const optU = clamp01(s.get(scene.optU));
  const dagU = clamp01(s.get(scene.dagU));
  const cacheU = clamp01(s.get(scene.cacheU));

  // which candidate is flashing right now
  const idx = Math.min(CANDIDATES.length - 1, Math.floor(scanU * CANDIDATES.length));
  const showCandidate = scanU > 0 && optU < 0.99;

  return (
    <>
      <rect x={MAP.x - 22} y={MAP.y - 22} width={MAP.w + 44} height={MAP.h + 44} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />

      {/* candidate tours flashing while brute force scans */}
      {showCandidate && (
        <polyline points={tourPoints(CANDIDATES[idx], STAGED)} fill="none" stroke={colors.MUTED} strokeWidth={1.6} opacity={0.4} strokeLinejoin="round" />
      )}

      {/* the locked optimal tour */}
      {optU > 0 && (
        <polyline
          points={tourPoints(OPT.order, STAGED)}
          fill="none"
          stroke={colors.POSITIVE}
          strokeWidth={2.4}
          strokeLinejoin="round"
          opacity={optU}
          strokeDasharray={2000}
          strokeDashoffset={2000 * (1 - optU)}
        />
      )}

      {/* cities */}
      {STAGED.map((p, i) => {
        const e = clamp01(cityU * N - i);
        if (e <= 0) return null;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === 0 ? 8 : 5.5} fill={i === 0 ? colors.WARM : colors.ACCENT} opacity={e} />
          </g>
        );
      })}
      {optU > 0.5 && (
        <text x={MAP.x + MAP.w / 2} y={MAP.y + MAP.h + 6} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontFamily={mono} opacity={optU}>
          optimal tour = {OPT.len.toFixed(1)}
        </text>
      )}

      {/* (n−1)! wall */}
      {s.get(scene.wallU) > 0.01 && (
        <g opacity={clamp01(s.get(scene.wallU))}>
          <MathLabel tex={'(n-1)!'} x={690} y={230} fontSize={44} color={colors.NEGATIVE} anchor="middle" />
          <text x={690} y={286} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={mono}>
            8! = 40,320 orderings
          </text>
        </g>
      )}

      {/* Held–Karp recurrence */}
      {s.get(scene.recurU) > 0.01 && (
        <g opacity={clamp01(s.get(scene.recurU))}>
          <MathLabel
            tex={'\\mathrm{dist}(n_i, N) = \\min_{n_j \\in N}\\; c_{n_i,n_j} + \\mathrm{dist}(n_j,\\, N\\!\\setminus\\!\\{n_j\\})'}
            x={912}
            y={92}
            fontSize={17}
            color={colors.TEXT}
            anchor="middle"
          />
        </g>
      )}

      {/* subset DAG — two parents reuse one memoised child */}
      {dagU > 0.01 && (
        <g opacity={dagU}>
          <line x1={NODES.root.x - 30} y1={NODES.root.y + 16} x2={NODES.a.x + 8} y2={NODES.a.y - 16} stroke={colors.GRID} strokeWidth={1.4} />
          <line x1={NODES.root.x + 30} y1={NODES.root.y + 16} x2={NODES.b.x - 8} y2={NODES.b.y - 16} stroke={colors.GRID} strokeWidth={1.4} />
          <line x1={NODES.a.x + 10} y1={NODES.a.y + 16} x2={NODES.shared.x - 30} y2={NODES.shared.y - 16} stroke={cacheU > 0 ? colors.POSITIVE : colors.GRID} strokeWidth={cacheU > 0 ? 2.2 : 1.4} />
          <line x1={NODES.b.x - 10} y1={NODES.b.y + 16} x2={NODES.shared.x + 30} y2={NODES.shared.y - 16} stroke={cacheU > 0 ? colors.POSITIVE : colors.GRID} strokeWidth={cacheU > 0 ? 2.2 : 1.4} strokeDasharray={cacheU > 0 ? '5 3' : undefined} />
          <Pill {...NODES.root} u={dagU} />
          <Pill {...NODES.a} u={dagU} />
          <Pill {...NODES.b} u={dagU} />
          <Pill {...NODES.shared} u={dagU} glow={cacheU} />
          {cacheU > 0.3 && (
            <text x={NODES.shared.x + 74} y={NODES.shared.y + 4} fill={colors.POSITIVE} fontSize={12} fontWeight={700} fontFamily={mono} opacity={cacheU}>
              lru_cache hit
            </text>
          )}
        </g>
      )}

      {/* complexity comparison */}
      {s.get(scene.cmpU) > 0.01 && (
        <g opacity={clamp01(s.get(scene.cmpU))}>
          <text x={690} y={430} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={mono}>
            n = 15
          </text>
          <MathLabel tex={'(n{-}1)! \\approx 4.4\\times10^{10}'} x={690} y={470} fontSize={19} color={colors.NEGATIVE} anchor="middle" />
          <MathLabel tex={'2^{n}\\,n^{2} \\approx 7.4\\times10^{6}'} x={690} y={512} fontSize={19} color={colors.POSITIVE} anchor="middle" />
        </g>
      )}

      {s.get(scene.sameU) > 0.01 && (
        <g opacity={clamp01(s.get(scene.sameU))}>
          <text x={1088} y={470} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700} fontFamily={mono}>
            same optimum
          </text>
          <text x={1088} y={492} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={mono}>
            less work
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
