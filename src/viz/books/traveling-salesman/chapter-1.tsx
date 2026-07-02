// Book scene — traveling-salesman, chapter 1: "The Salesman's Map".
// The problem itself: n cities, visit each once, come home. Fix the home city
// (brute_force fixes node 0) and the number of distinct routes is (n−1)!/2 — a
// factorial that swallows the stage as n climbs past ~15. Cities are seeded and
// every route count is really factorial(n−1)/2, computed live.
import { MathLabel, Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { distanceMatrix, factorial, formatCount, makeCities, place, tourPoints } from './tsp';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout: 1280×720 stage, bottom ~12% clear —————
const MAP = { x: 96, y: 92, w: 620, h: 460 };
const N = 9;
const CITIES = makeCities(17, N);
const STAGED = CITIES.map((p) => place(p, MAP));
const D = distanceMatrix(CITIES);
// an illustrative route (just "a" valid tour, not the optimum)
const SAMPLE = [0, 3, 8, 4, 2, 6, 1, 5, 7];

// the route-count explosion: n and its (n−1)!/2 distinct tours
const GROW = [5, 9, 15, 20];
const PANEL = { x: 792, y: 150 };

export function buildScene() {
  const tl = new Timeline();

  const cityU = tl.channel('cityU', 0); // per-city entrance via cityU·N − i
  const homeU = tl.channel('homeU', 0);
  const tourU = tl.channel('tourU', 0); // draw-on of the sample route
  const formulaU = tl.channel('formulaU', 0);
  const fixU = tl.channel('fixU', 0); // "fix city 0" chip
  const countU = tl.channel('countU', 0); // reveal 9-city count
  const nSel = tl.channel('nSel', 9); // current n in the explosion
  const explodeU = tl.channel('explodeU', 0); // size of the exploding number
  const hardU = tl.channel('hardU', 0);

  // BEAT 0 — the map: n cities, visit each once, return home
  tl.caption({ at: 0.3, dur: 4, text: 'Nine cities. Visit each once and return home — one closed tour.' });
  tl.tween(cityU, 1, { at: 0.5, dur: 1.6, ease: ease.enter });
  tl.tween(homeU, 1, { at: 1.6, dur: 0.6, ease: ease.pop });
  tl.tween(tourU, 1, { at: 2.6, dur: 1.8, ease: ease.draw });
  tl.hold(4.6, 0.8);

  // BEAT 1 — fix the home city; by symmetry the count is (n−1)!/2
  tl.caption({ at: 5.6, dur: 4.2, text: 'Pin the start, drop mirror images: (n−1)!/2 distinct routes.' });
  tl.tween(fixU, 1, { at: 5.9, dur: 0.5, ease: ease.pop });
  tl.tween(formulaU, 1, { at: 6.6, dur: 0.7, ease: ease.enter });
  tl.hold(9.8, 0.8);

  // BEAT 2 — for this map, that is already 20,160 routes
  tl.caption({ at: 10.8, dur: 4, text: 'For nine cities that is already 20,160 possible tours.' });
  tl.tween(countU, 1, { at: 11.1, dur: 0.7, ease: ease.enter });
  tl.set(nSel, 9, 11.1);
  tl.hold(14.6, 0.8);

  // BEAT 3 — the factorial explosion as n climbs
  tl.caption({ at: 15.6, dur: 4.4, text: 'Add cities and the count explodes — factorial growth.' });
  tl.set(nSel, 5, 15.9);
  tl.tween(explodeU, 0.25, { at: 15.9, dur: 0.5, ease: ease.move });
  tl.set(nSel, 9, 16.9);
  tl.tween(explodeU, 0.5, { at: 16.9, dur: 0.5, ease: ease.move });
  tl.set(nSel, 15, 17.9);
  tl.tween(explodeU, 0.8, { at: 17.9, dur: 0.6, ease: ease.move });
  tl.set(nSel, 20, 19.1);
  tl.tween(explodeU, 1, { at: 19.1, dur: 0.7, ease: ease.pop });
  tl.hold(20.6, 0.8);

  // BEAT 4 — past ~15 cities it is astronomical; that is the whole problem
  tl.caption({ at: 21.6, dur: 4.6, text: 'Twenty cities: 6×10¹⁶ tours. No computer enumerates that.' });
  tl.tween(hardU, 1, { at: 22.0, dur: 0.8, ease: ease.enter });
  tl.hold(25.6, 1.2);

  return { tl, cityU, homeU, tourU, formulaU, fixU, countU, nSel, explodeU, hardU };
}

const scene = buildScene();

// ————— pure subcomponents —————

function CityDots({ u, home }: { u: number; home: number }) {
  return (
    <>
      {STAGED.map((p, i) => {
        const e = clamp01(u * N - i);
        if (e <= 0) return null;
        const isHome = i === 0 && home > 0;
        const r = (isHome ? 9 : 6.5) * e;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={r} fill={isHome ? colors.WARM : colors.ACCENT} opacity={e} />
            {isHome && <circle cx={p.x} cy={p.y} r={13 * e} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={0.5 * home} />}
            <text x={p.x} y={p.y - 13} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={mono} opacity={e * 0.9}>
              {i === 0 ? 'home' : i}
            </text>
          </g>
        );
      })}
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  const tourU = clamp01(s.get(scene.tourU));
  const n = Math.round(s.get(scene.nSel));
  const routes = factorial(n - 1) / 2;
  const explode = clamp01(s.get(scene.explodeU));
  const countU = clamp01(s.get(scene.countU));
  const hardU = clamp01(s.get(scene.hardU));

  return (
    <>
      {/* the map frame */}
      <rect x={MAP.x - 24} y={MAP.y - 24} width={MAP.w + 48} height={MAP.h + 48} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />

      {/* the sample route, drawn on */}
      {tourU > 0 && (
        <polyline
          points={tourPoints(SAMPLE, STAGED)}
          fill="none"
          stroke={colors.ACCENT}
          strokeWidth={2}
          strokeLinejoin="round"
          opacity={0.55 * tourU}
          strokeDasharray={2000}
          strokeDashoffset={2000 * (1 - tourU)}
        />
      )}

      <CityDots u={s.get(scene.cityU)} home={s.get(scene.homeU)} />

      {/* "fix home" chip */}
      {s.get(scene.fixU) > 0.01 && (
        <g opacity={clamp01(s.get(scene.fixU))}>
          <rect x={STAGED[0].x - 46} y={STAGED[0].y + 16} width={92} height={22} rx={11} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.3} />
          <text x={STAGED[0].x} y={STAGED[0].y + 31} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={mono}>
            city 0 fixed
          </text>
        </g>
      )}

      {/* right panel — the formula and the exploding count */}
      {s.get(scene.formulaU) > 0.01 && (
        <g opacity={clamp01(s.get(scene.formulaU))}>
          <text x={PANEL.x} y={PANEL.y - 34} fill={colors.MUTED} fontSize={14} fontFamily={mono}>
            distinct closed tours
          </text>
          <MathLabel tex={'\\dfrac{(n-1)!}{2}'} x={PANEL.x} y={PANEL.y + 6} fontSize={40} color={colors.TEXT} anchor="start" />
        </g>
      )}

      {countU > 0.01 && (
        <g opacity={countU} transform={`translate(${PANEL.x}, ${PANEL.y + 118})`}>
          <text x={0} y={0} fill={colors.MUTED} fontSize={15} fontFamily={mono}>
            n = {n}
          </text>
          <text
            x={0}
            y={44 + explode * 8}
            fill={explode > 0.85 ? colors.NEGATIVE : colors.WARM}
            fontSize={26 + explode * 30}
            fontWeight={700}
            fontFamily={mono}
          >
            {formatCount(routes)}
          </text>
          <text x={0} y={78 + explode * 40} fill={colors.MUTED} fontSize={13} fontFamily={mono}>
            routes
          </text>
        </g>
      )}

      {hardU > 0.01 && (
        <g opacity={hardU}>
          <MathLabel
            tex={'19! / 2 \\approx 6.08\\times10^{16}'}
            x={PANEL.x}
            y={PANEL.y + 300}
            fontSize={20}
            color={colors.NEGATIVE}
            anchor="start"
          />
          <text x={PANEL.x} y={PANEL.y + 336} fill={colors.MUTED} fontSize={13} fontFamily={mono}>
            the search space is the whole problem
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
