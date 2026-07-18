import { Camera, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BRIDGE_CONF,
  CANDIDATES,
  EDGES,
  N,
  POS,
  SEED_BLUE,
  SEED_RED,
  buildScene,
  propAt,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const RED = colors.NEGATIVE;
const BLUE = colors.ACCENT;
const GRAY = '#5c6478';

function mixHex(a: string, c: string, u: number): string {
  const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
  const pc = [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
  return `#${pa.map((v, i) => Math.round(lerp(v, pc[i], u)).toString(16).padStart(2, '0')).join('')}`;
}

function renderFrame(s: SceneState) {
  const graphU = s.get(scene.graphU);
  const seedU = s.get(scene.seedU);
  const iterT = s.get(scene.iterT);
  const confU = s.get(scene.confU);
  const swapU = s.get(scene.taskSwapU);
  const candP = s.get(scene.candP);
  const bestU = s.get(scene.bestU);
  const closeU = s.get(scene.closeU);

  return (
    <Camera {...s.get(scene.cam)}>
      {/* edges */}
      {EDGES.map(([a, b], k) => (
        <line
          key={k}
          x1={POS[a].x}
          y1={POS[a].y}
          x2={POS[b].x}
          y2={POS[b].y}
          stroke={colors.MUTED}
          strokeWidth={2}
          opacity={0.55 * clamp01(graphU * EDGES.length - k)}
        />
      ))}

      {/* candidate (absent) edges with common-neighbor scores */}
      {CANDIDATES.map(([a, b, cn], k) => {
        const u = clamp01(candP * CANDIDATES.length - k);
        const best = cn === 3;
        const op = u * (best ? 0.4 + 0.6 * Math.max(bestU, 0.4) : swapU * 0.55);
        const mx = (POS[a].x + POS[b].x) / 2;
        const my = (POS[a].y + POS[b].y) / 2;
        return (
          <g key={`c${k}`} opacity={op}>
            <line
              x1={POS[a].x}
              y1={POS[a].y}
              x2={POS[b].x}
              y2={POS[b].y}
              stroke={best ? colors.WARM : colors.MUTED}
              strokeWidth={best ? 3 : 1.5}
              strokeDasharray="6 6"
            />
            <circle cx={mx} cy={my} r={11} fill={colors.PANEL} stroke={best ? colors.WARM : colors.GRID} strokeWidth={1.5} />
            <text x={mx} y={my + 4} textAnchor="middle" fill={best ? colors.WARM : colors.MUTED} fontSize={12}>
              {cn}
            </text>
          </g>
        );
      })}

      {/* nodes colored by propagated label */}
      {POS.map((p, i) => {
        const u = clamp01(graphU * N - i * 0.5);
        const isSeed = i === SEED_RED || i === SEED_BLUE;
        const pRed = propAt(i, iterT);
        // gray until seeding/propagation reaches this node
        const labeled = isSeed ? seedU : clamp01(iterT);
        const fill =
          labeled < 0.02 ? GRAY : mixHex(GRAY, mixHex(BLUE, RED, pRed), isSeed ? seedU : clamp01(iterT * 0.9));
        return (
          <g key={i} opacity={u}>
            <circle
              cx={p.x}
              cy={p.y}
              r={15}
              fill={fill}
              fillOpacity={0.9}
              stroke={isSeed && seedU > 0.02 ? colors.WARM : colors.MUTED}
              strokeWidth={isSeed ? 1.5 + 2 * seedU : 1.5}
            />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fill="#0a0e1a" fontSize={13} fontWeight={700}>
              {i}
            </text>
          </g>
        );
      })}

      {/* seed tags */}
      <g opacity={seedU * (1 - swapU)}>
        <text x={POS[SEED_RED].x} y={POS[SEED_RED].y - 24} textAnchor="middle" fill={RED} fontSize={14}>
          known: red
        </text>
        <text x={POS[SEED_BLUE].x} y={POS[SEED_BLUE].y - 24} textAnchor="middle" fill={BLUE} fontSize={14}>
          known: blue
        </text>
      </g>

      {/* bridge confidence chip */}
      <g opacity={confU}>
        <rect x={POS[4].x - 74} y={POS[4].y + 26} width={148} height={34} rx={9} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
        <text x={POS[4].x} y={POS[4].y + 48} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
          P(red) = {BRIDGE_CONF.toFixed(2)}
        </text>
      </g>

      {/* closing */}
      <g opacity={closeU}>
        <text x={640} y={80} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
          same graph, same flow — two answers
        </text>
      </g>
    </Camera>
  );
}

export function GraphTasks() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/graph-tasks/overrides.json', slug: 'graph-tasks' }}
      >
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
