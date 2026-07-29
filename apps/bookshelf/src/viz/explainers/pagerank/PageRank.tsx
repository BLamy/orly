import { MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Connection, NodeBadge, Packet } from '../../primitives';
import overrides from './overrides.json';
import {
  BARS,
  EDGES,
  FINAL,
  FRAC,
  NODES,
  ORDER,
  SEQ,
  WALK,
  buildScene,
} from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const { ch } = scene;

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const NODE_COLOR = [colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.WARM, colors.TEAL];

interface Pt {
  x: number;
  y: number;
}

/**
 * Trim an edge back to each badge's boundary (an ellipse just outside the
 * 112×48 rounded rect) so directed arrowheads stay visible — center-to-center
 * lines would bury them under the boxes.
 */
function trimEdge(f: Pt, t: Pt): { from: Pt; to: Pt } {
  const dx = t.x - f.x;
  const dy = t.y - f.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const off = 1 / Math.hypot(ux / 64, uy / 32); // ellipse semi-axes 64×32
  return {
    from: { x: f.x + ux * off, y: f.y + uy * off },
    to: { x: t.x - ux * off, y: t.y - uy * off },
  };
}

const EDGE_PTS = EDGES.map(([f, t]) => trimEdge(NODES[f], NODES[t]));

/** The teleport leap: shop → docs, dashed, clearly not a link. */
const TELE = trimEdge(NODES[3], NODES[1]);

/** Bar value: crossfade visit tallies → the iteration-k mass, per node. */
function barValue(i: number, walkP: number, iterP: number, mode: number): number {
  const j = Math.min(FRAC.length - 1, Math.max(0, Math.floor(walkP)));
  const tally = FRAC[j][i] * clamp01(walkP * 2);
  const k = Math.min(SEQ.length - 2, Math.max(0, Math.floor(iterP)));
  const mass = lerp(SEQ[k][i], SEQ[k + 1][i], clamp01(iterP - k));
  return lerp(tally, mass, mode);
}

/** The surfer's glow on a node: bright right when the packet lands there. */
function visitGlow(i: number, walkP: number): number {
  if (walkP <= 0 || walkP >= WALK.length) return 0;
  let g = 0;
  for (let j = 0; j < WALK.length; j++) {
    if (WALK[j] === i) g = Math.max(g, clamp01(1 - Math.abs(walkP - j) * 2.2));
  }
  return g;
}

function renderFrame(s: SceneState) {
  const edgeP = s.get(ch.edgeP);
  const walkP = s.get(ch.walkP);
  const barsAxisU = s.get(ch.barsAxisU);
  const barMode = s.get(ch.barMode);
  const iterP = s.get(ch.iterP);
  const flowPhase = s.get(ch.flowPhase);
  const teleU = s.get(ch.teleU);
  const teleP = s.get(ch.teleP);
  const rankU = s.get(ch.rankU);
  const chipP = s.get(ch.chipP);
  const glowTop = s.get(ch.glowTop);

  // the surfer packet's current hop
  const hop = Math.min(WALK.length - 2, Math.max(0, Math.floor(walkP)));
  const hopU = walkP - hop;

  const pass = Math.round(Math.min(SEQ.length - 1, iterP));

  return (
    <g>
      {/* ------- the web graph ------- */}
      {EDGES.map((_, e) => (
        <Connection
          key={e}
          from={EDGE_PTS[e].from}
          to={EDGE_PTS[e].to}
          u={clamp01(edgeP * EDGES.length - e)}
          flow={flowPhase}
          color={colors.MUTED}
          width={1.6}
          arrow
        />
      ))}

      {/* the teleport leap (beat 4) */}
      {teleU > 0.002 && (
        <g>
          <Connection
            from={TELE.from}
            to={TELE.to}
            u={teleU}
            color={colors.NEGATIVE}
            width={1.8}
            dashed
            arrow
            label="teleport (15%)"
          />
          <Packet from={TELE.from} to={TELE.to} u={teleP} r={8} color={colors.NEGATIVE} />
        </g>
      )}

      {/* pages — scaled by their final rank once the verdict is in */}
      {NODES.map((n, i) => {
        const scale = 1 + rankU * (FINAL[i] - 0.2) * 2.2;
        const isTop = i === ORDER[0];
        return (
          <g key={n.label} transform={`translate(${n.x} ${n.y}) scale(${scale}) translate(${-n.x} ${-n.y})`}>
            <NodeBadge
              x={n.x}
              y={n.y}
              w={112}
              h={48}
              label={n.label}
              color={NODE_COLOR[i]}
              u={s.get(ch.nodeU[i])}
              glow={Math.max(visitGlow(i, walkP), isTop ? glowTop * 0.9 : 0)}
            />
          </g>
        );
      })}

      {/* the random surfer (beat 2) */}
      {walkP > 0 && walkP < WALK.length - 1 && (
        <Packet
          from={NODES[WALK[hop]]}
          to={NODES[WALK[hop + 1]]}
          u={hopU}
          r={9}
          color={colors.TEXT}
          label="surfer"
          labelSize={12}
        />
      )}

      {/* ------- the rank panel ------- */}
      {barsAxisU > 0.002 && (
        <g opacity={barsAxisU}>
          <line
            x1={BARS.x0 - 14}
            y1={BARS.base}
            x2={BARS.x0 + NODES.length * BARS.step - 14}
            y2={BARS.base}
            stroke={colors.GRID}
            strokeWidth={1.5}
          />
          <text x={BARS.x0 - 14} y={220} fill={colors.MUTED} fontSize={14}>
            {barMode < 0.5 ? 'share of visits' : `probability mass — pass ${pass}`}
          </text>
          {NODES.map((n, i) => {
            const v = barValue(i, walkP, iterP, barMode);
            const h = Math.min(320, v * BARS.hMax);
            const x = BARS.x0 + i * BARS.step;
            const r = ORDER.indexOf(i);
            const chipU = clamp01(chipP * NODES.length - r);
            return (
              <g key={n.label}>
                <rect
                  x={x - BARS.w / 2}
                  y={BARS.base - h}
                  width={BARS.w}
                  height={Math.max(0, h)}
                  rx={5}
                  fill={NODE_COLOR[i]}
                  opacity={0.8}
                />
                <text x={x} y={BARS.base + 22} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                  {n.label}
                </text>
                {chipU > 0.002 && (
                  <g opacity={chipU}>
                    <text
                      x={x}
                      y={BARS.base - h - 12}
                      textAnchor="middle"
                      fill={r === 0 ? colors.WARM : colors.TEXT}
                      fontSize={r === 0 ? 19 : 15}
                      fontWeight={700}
                    >
                      #{r + 1}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* equations, as they earn their screen time */}
      <MathLabel tex="v_{k+1}=M\,v_k" x={990} y={120} fontSize={26} opacity={s.get(ch.texMU)} />
      <MathLabel
        tex="PR_i=\tfrac{1-d}{N}+d\sum_{j\to i}\tfrac{PR_j}{L_j},\;\;\; d=0.85"
        x={990}
        y={172}
        fontSize={20}
        opacity={s.get(ch.texPRU)}
      />
    </g>
  );
}

export function PageRank() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/pagerank/overrides.json', slug: 'pagerank' }}
      >
        {renderFrame}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
