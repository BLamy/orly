// Book scene — traveling-salesman, chapter 4: "Uncross to Improve".
// Local search (heuristics/local_search.py) scans a tour's neighbours and takes
// the FIRST that is shorter (first-improvement), repeating until none improves —
// a local minimum. The default neighbour is the 2-opt move (two_opt_gen): reverse
// a segment of the tour, which swaps two edges for two others. Crossed edges are
// always improvable. Starting from the greedy 265.2 tour, the real descent runs
// 265.2 → 245.8 → 215.6 → 211.2 → 192.6 (the optimum) in four accepted moves.
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { distanceMatrix, makeCities, nearestNeighbor, place, tourPoints, twoOptSteps } from './tsp';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout —————
const MAP = { x: 96, y: 92, w: 620, h: 460 };
const N = 9;
const CITIES = makeCities(17, N);
const STAGED = CITIES.map((p) => place(p, MAP));
const D = distanceMatrix(CITIES);
const NN = nearestNeighbor(D, 0);
const DESC = twoOptSteps(NN.order, D); // real first-improvement descent

// tours after each accepted move: [NN, move1, move2, move3, move4]
const TOURS = [NN.order, ...DESC.steps.map((m) => m.to)];
const LENS = [NN.len, ...DESC.steps.map((m) => m.after)];
const LAST = TOURS.length - 1;

// per move: which edges are removed (crossed) and which are added (uncrossed)
const MOVES = DESC.steps.map((m) => {
  const f = m.from;
  const a = f[m.i - 1];
  const b = f[m.i];
  const c = f[m.j];
  const d = f[(m.j + 1) % N];
  return { removed: [[a, b], [c, d]] as [number, number][], added: [[a, c], [b, d]] as [number, number][] };
});

const PANEL = { x: 792, y: 150 };

export function buildScene() {
  const tl = new Timeline();

  const cityU = tl.channel('cityU', 0);
  const prog = tl.channel('prog', 0); // 0..LAST, position in the descent
  const minU = tl.channel('minU', 0); // "local minimum" badge

  // BEAT 0 — local search: scan neighbours, take the first shorter one
  tl.caption({ at: 0.3, dur: 4.2, text: 'Local search: scan a tour’s neighbours, keep the first that is shorter.' });
  tl.tween(cityU, 1, { at: 0.5, dur: 1.0, ease: ease.enter });
  tl.hold(4.6, 0.8);

  // BEAT 1 — the 2-opt neighbour: reverse a segment (move 1)
  tl.caption({ at: 5.6, dur: 4.2, text: 'The 2-opt neighbour reverses a segment — swapping two edges for two.' });
  tl.tween(prog, 1, { at: 6.2, dur: 2.4, ease: ease.move });
  tl.hold(9.6, 0.8);

  // BEAT 2 — crossed edges are always improvable (move 2)
  tl.caption({ at: 10.6, dur: 4.2, text: 'Two edges that cross can always be uncrossed for a shorter tour.' });
  tl.tween(prog, 2, { at: 11.2, dur: 2.4, ease: ease.move });
  tl.hold(14.6, 0.8);

  // BEAT 3 — keep going: the tour untangles toward the optimum (moves 3 & 4)
  tl.caption({ at: 15.6, dur: 4.4, text: 'Keep taking improvements — the tour untangles down to 192.6.' });
  tl.tween(prog, 3, { at: 16.1, dur: 1.9, ease: ease.move });
  tl.tween(prog, 4, { at: 18.4, dur: 1.9, ease: ease.move });
  tl.hold(20.8, 0.8);

  // BEAT 4 — no neighbour improves: a local minimum
  tl.caption({ at: 21.8, dur: 4.2, text: 'When no neighbour is shorter, local search stops: a local minimum.' });
  tl.tween(minU, 1, { at: 22.2, dur: 0.8, ease: ease.pop });
  tl.hold(25.4, 1.2);

  return { tl, cityU, prog, minU };
}

const scene = buildScene();

function poly(order: number[], color: string, opacity: number, width = 2.4) {
  if (opacity <= 0.001) return null;
  return <polyline points={tourPoints(order, STAGED)} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" opacity={opacity} />;
}

function EdgeLine({ a, b, color, opacity, width = 3.4 }: { a: number; b: number; color: string; opacity: number; width?: number }) {
  if (opacity <= 0.001) return null;
  return <line x1={STAGED[a].x} y1={STAGED[a].y} x2={STAGED[b].x} y2={STAGED[b].y} stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity} />;
}

export function Render({ s }: { s: SceneState }) {
  const cityU = clamp01(s.get(scene.cityU));
  const prog = s.get(scene.prog);
  const lower = Math.max(0, Math.min(LAST, Math.floor(prog)));
  const upper = Math.min(LAST, lower + 1);
  const frac = clamp01(prog - lower);
  const transitioning = frac > 0.001 && frac < 0.999 && upper !== lower;
  const settledIdx = Math.round(prog);
  const displayLen = LENS[Math.max(0, Math.min(LAST, settledIdx))];
  const minU = clamp01(s.get(scene.minU));

  const colFor = (i: number) => (i === LAST ? colors.POSITIVE : colors.ACCENT);
  const mv = transitioning ? MOVES[lower] : null;
  const flash = transitioning ? clamp01((0.55 - frac) * 2.2) : 0;
  const addU = transitioning ? clamp01((frac - 0.35) * 2) : 0;

  return (
    <>
      <rect x={MAP.x - 24} y={MAP.y - 24} width={MAP.w + 48} height={MAP.h + 48} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />

      {/* crossfade the settled tours during a move */}
      {poly(TOURS[lower], colFor(lower), transitioning ? 1 - frac : 1)}
      {transitioning && poly(TOURS[upper], colFor(upper), frac)}

      {/* highlight the crossed edges being removed, then the uncrossed replacements */}
      {mv && (
        <>
          {mv.removed.map(([a, b], k) => (
            <EdgeLine key={`r${k}`} a={a} b={b} color={colors.NEGATIVE} opacity={flash} />
          ))}
          {mv.added.map(([a, b], k) => (
            <EdgeLine key={`a${k}`} a={a} b={b} color={colors.POSITIVE} opacity={addU} />
          ))}
        </>
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

      {/* right panel — the descent ledger */}
      <g transform={`translate(${PANEL.x}, ${PANEL.y})`}>
        <text x={0} y={0} fill={colors.MUTED} fontSize={14} fontFamily={mono}>
          tour length
        </text>
        <text x={0} y={46} fill={settledIdx === LAST ? colors.POSITIVE : colors.ACCENT} fontSize={40} fontWeight={700} fontFamily={mono}>
          {displayLen.toFixed(1)}
        </text>
        {LENS.map((l, k) => {
          const done = settledIdx >= k;
          const active = settledIdx === k;
          return (
            <g key={k} opacity={done ? 1 : 0.3} transform={`translate(0, ${86 + k * 30})`}>
              <circle cx={6} cy={-4} r={4} fill={k === LAST ? colors.POSITIVE : colors.ACCENT} />
              <text x={22} y={0} fill={active ? colors.TEXT : colors.MUTED} fontSize={14} fontWeight={active ? 700 : 400} fontFamily={mono}>
                {k === 0 ? 'greedy start' : `move ${k}`} — {l.toFixed(1)}
              </text>
            </g>
          );
        })}
        {minU > 0.01 && (
          <g opacity={minU} transform={`translate(0, ${86 + (LAST + 1) * 30 + 14})`}>
            <rect x={0} y={-18} width={210} height={28} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
            <text x={12} y={1} fill={colors.POSITIVE} fontSize={13} fontWeight={700} fontFamily={mono}>
              local minimum — stop
            </text>
          </g>
        )}
      </g>
    </>
  );
}

export const vizScene = () => scene;
