import { Camera, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Packet } from '../../primitives';
import overrides from './overrides.json';
import { EDGES, FOCUS, FOCUS_NEIGH, H0, H1, H2, POS, buildScene } from './scene';
import type { Feat } from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const RED = colors.NEGATIVE;
const BLUE = colors.ACCENT;

/** feature → fill color: mix red/blue channels */
function featColor([r, b]: Feat): string {
  const mix = (a: string, c: string, u: number) => {
    const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
    const pc = [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
    return `#${pa.map((v, i) => Math.round(lerp(v, pc[i], u)).toString(16).padStart(2, '0')).join('')}`;
  };
  return mix(RED, BLUE, b / Math.max(1e-9, r + b));
}

function lerpFeat(a: Feat, b: Feat, u: number): Feat {
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
}

function renderFrame(s: SceneState) {
  const graphU = s.get(scene.graphU);
  const featU = s.get(scene.featU);
  const focusU = s.get(scene.focusU);
  const msgP = s.get(scene.msgP);
  const blend4 = s.get(scene.blend4);
  const blendAll = s.get(scene.blendAll);
  const blend2 = s.get(scene.blend2);
  const panelU = s.get(scene.panelU);
  const closeU = s.get(scene.closeU);

  // per-node displayed feature
  const feat = (i: number): Feat => {
    const u1 = i === FOCUS ? Math.max(blend4, blendAll) : blendAll;
    return lerpFeat(lerpFeat(H0[i], H1[i], u1), H2[i], blend2);
  };

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

      {/* messages into the focus node */}
      {FOCUS_NEIGH.map((j, k) => (
        <Packet
          key={j}
          from={POS[j]}
          to={POS[FOCUS]}
          u={clamp01(msgP * 1.6 - k * 0.3)}
          r={7}
          color={featColor(H0[j])}
        />
      ))}

      {/* nodes with feature fills + bars */}
      {POS.map((p, i) => {
        const u = clamp01(graphU * 10 - i * 0.5);
        const h = feat(i);
        const isFocus = i === FOCUS;
        return (
          <g key={i} opacity={u}>
            <circle
              cx={p.x}
              cy={p.y}
              r={15}
              fill={featU > 0.02 ? featColor(h) : colors.PANEL}
              fillOpacity={featU > 0.02 ? 0.85 : 1}
              stroke={isFocus && focusU > 0.02 ? colors.WARM : colors.MUTED}
              strokeWidth={isFocus ? 2 + 2 * focusU : 1.5}
            />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fill="#0a0e1a" fontSize={13} fontWeight={700}>
              {i}
            </text>
            {/* two-channel feature bar */}
            <g opacity={featU}>
              <rect x={p.x - 20} y={p.y + 22} width={40 * h[0]} height={6} rx={2} fill={RED} />
              <rect x={p.x - 20} y={p.y + 30} width={40 * h[1]} height={6} rx={2} fill={BLUE} />
            </g>
          </g>
        );
      })}

      {/* the arithmetic panel */}
      <g opacity={panelU}>
        <rect x={700} y={520} width={470} height={78} rx={12} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
        <text x={725} y={552} fill={colors.TEXT} fontSize={15} fontFamily="ui-monospace, Menlo, monospace">
          node 4: mean(1,1,1,0) = 0.75 red
        </text>
        <text x={725} y={580} fill={colors.TEXT} fontSize={15} fontFamily="ui-monospace, Menlo, monospace">
          mean(0,0,0,1) = 0.25 blue
        </text>
      </g>

      {/* closing */}
      <g opacity={closeU}>
        <text x={640} y={80} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
          one layer = one hop of influence
        </text>
      </g>
    </Camera>
  );
}

export function GraphMessagePassing() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/graph-message-passing/overrides.json', slug: 'graph-message-passing' }}
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
