import { scaleLinear } from 'd3';
import { MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { Axes, FunctionPlot, Packet, Vec } from '../../primitives';
import {
  BWD_EDGES,
  CHIPS,
  CIRC_R,
  EDGES,
  LOSSES,
  LOSS_TEX,
  NODES,
  NODE_INDEX,
  PASSES,
  PLOT,
  RECT_H,
  RECT_W,
  UPDATE_TEX,
  buildScene,
  bwdLabels,
  f2,
  fmtLoss,
  fwdLabels,
  lossAt,
} from './scene';
import type { NodeId, NodeSpec } from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const ROLE_COLOR: Record<NodeSpec['role'], string> = {
  input: colors.MUTED,
  param: colors.SECONDARY,
  op: colors.ACCENT,
  loss: colors.ACCENT,
};

/** Tiny op formulas under the compute nodes. */
const SUBS: Array<{ id: NodeId; text: string }> = [
  { id: 'z1', text: 'w₁·x + b₁' },
  { id: 'h', text: 'ReLU(z₁)' },
  { id: 'yhat', text: 'w₂ · h' },
];

// Corner loss-vs-step plot (beat 4+): stage-space scales.
const plotX = scaleLinear([0, 3], [PLOT.x0, PLOT.x1]);
const plotY = scaleLinear([0, PLOT.maxL], [PLOT.yBottom, PLOT.yTop]);

/** A graph node: circle (ops) or rounded rect (inputs/params) + live value. */
function GraphNode({
  spec,
  u,
  value,
  valueU = 1,
  glow = 0,
  glowColor = colors.ACCENT,
}: {
  spec: NodeSpec;
  u: number;
  value: string;
  valueU?: number;
  glow?: number;
  glowColor?: string;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const sc = 0.8 + 0.2 * uu;
  const g = clamp01(glow);
  const color = ROLE_COLOR[spec.role];
  const hw = RECT_W / 2;
  const hh = RECT_H / 2;
  return (
    <g transform={`translate(${spec.x}, ${spec.y}) scale(${sc})`} opacity={uu}>
      {g > 0 &&
        (spec.kind === 'circle' ? (
          <circle r={CIRC_R + 7} fill="none" stroke={glowColor} strokeWidth={2.5} opacity={0.6 * g} />
        ) : (
          <rect x={-hw - 7} y={-hh - 7} width={RECT_W + 14} height={RECT_H + 14} rx={16} fill="none" stroke={glowColor} strokeWidth={2.5} opacity={0.6 * g} />
        ))}
      {spec.kind === 'circle' ? (
        <circle r={CIRC_R} fill={colors.PANEL} stroke={color} strokeWidth={2} />
      ) : (
        <rect x={-hw} y={-hh} width={RECT_W} height={RECT_H} rx={12} fill={colors.PANEL} stroke={color} strokeWidth={2} />
      )}
      {g > 0 &&
        (spec.kind === 'circle' ? (
          <circle r={CIRC_R - 1} fill={glowColor} opacity={0.13 * g} />
        ) : (
          <rect x={-hw + 1} y={-hh + 1} width={RECT_W - 2} height={RECT_H - 2} rx={11} fill={glowColor} opacity={0.13 * g} />
        ))}
      <text y={-7} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={600}>
        {spec.label}
      </text>
      <text y={17} textAnchor="middle" fill={colors.TEXT} fontSize={14.5} opacity={0.92 * clamp01(valueU)}>
        {value}
      </text>
    </g>
  );
}

/** Pure render: SceneState in, SVG out. */
function renderFrame(s: SceneState) {
  // the live pass — a step-set channel, so this is exact (0..3)
  const p = PASSES[Math.min(PASSES.length - 1, Math.max(0, Math.round(s.get(scene.passIdx))))];
  const fLabels = fwdLabels(p);
  const bLabels = bwdLabels(p);

  const edgesU = s.get(scene.edgesU);
  const lossG = s.get(scene.lossGlow);
  const winG = s.get(scene.winGlow);
  const updG = s.get(scene.updGlow);
  const updTexOp = s.get(scene.updTexU);
  const plotOp = s.get(scene.plotU);
  const prog = s.get(scene.plotProg);

  // live displayed number + its visibility, per node
  const value = (id: NodeId): { text: string; u: number } => {
    switch (id) {
      case 'x':
        return { text: f2(1.5), u: 1 };
      case 'w1':
        return { text: f2(s.get(scene.vW1)), u: 1 };
      case 'b1':
        return { text: f2(-0.2), u: 1 };
      case 'z1':
        return { text: f2(s.get(scene.vZ1)), u: s.get(scene.zAp) };
      case 'h':
        return { text: f2(s.get(scene.vH)), u: s.get(scene.hAp) };
      case 'w2':
        return { text: f2(s.get(scene.vW2)), u: 1 };
      case 'yhat':
        return { text: f2(s.get(scene.vYhat)), u: s.get(scene.yAp) };
      case 'yt':
        return { text: f2(1), u: 1 };
      case 'L':
        return { text: fmtLoss(s.get(scene.vL)), u: s.get(scene.lAp) };
    }
  };

  const glowOf = (id: NodeId): { g: number; c: string } => {
    if (id === 'L') return winG > lossG ? { g: winG, c: colors.POSITIVE } : { g: lossG, c: colors.NEGATIVE };
    if (id === 'w1' || id === 'w2') return { g: updG, c: colors.POSITIVE };
    return { g: 0, c: colors.ACCENT };
  };

  return (
    <g>
      {/* edges draw on with a stagger derived from the single edges channel */}
      {EDGES.map((e, i) => {
        const u = clamp01(edgesU * (EDGES.length + 2) - i - 1);
        if (u <= 0) return null;
        return (
          <Vec key={`e${i}`} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} grow={u} color={colors.MUTED} width={1.8} head={9} opacity={0.55} />
        );
      })}

      {/* forward value packets (sky) and backward gradient packets (rose) */}
      {EDGES.map((e, i) => (
        <Packet key={`f${i}`} from={e.a} to={e.b} u={s.get(scene.fwd[i])} color={colors.ACCENT} label={fLabels[i]} labelSize={13} r={7} />
      ))}
      {BWD_EDGES.map((ei, j) => {
        const e = EDGES[ei];
        return (
          <Packet key={`b${j}`} from={e.b} to={e.a} u={s.get(scene.bwd[j])} color={colors.NEGATIVE} label={bLabels[j]} labelSize={13} r={6.5} />
        );
      })}

      {/* the graph itself */}
      {NODES.map((n, i) => {
        const v = value(n.id);
        const gl = glowOf(n.id);
        return (
          <GraphNode key={n.id} spec={n} u={s.get(scene.nodesU[i])} value={v.text} valueU={v.u} glow={gl.g} glowColor={gl.c} />
        );
      })}
      {SUBS.map(({ id, text }) => {
        const n = NODES[NODE_INDEX[id]];
        return (
          <text key={`sub${id}`} x={n.x} y={n.y + CIRC_R + 18} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={0.9 * s.get(scene.nodesU[NODE_INDEX[id]])}>
            {text}
          </text>
        );
      })}

      {/* backward chips: local × upstream, with the pass-1 numbers */}
      {CHIPS.map((c, i) => (
        <MathLabel key={`chip${i}`} tex={c.tex} x={c.x} y={c.y} fontSize={c.size} color={colors.NEGATIVE} opacity={s.get(scene.chips[i])} />
      ))}

      {/* stage math: the loss, then the update rule */}
      <MathLabel tex={LOSS_TEX} x={1000} y={230} fontSize={19} opacity={s.get(scene.lossTexU)} />
      <MathLabel tex={UPDATE_TEX.rule} x={430} y={100} fontSize={22} opacity={updTexOp} />
      <MathLabel tex={UPDATE_TEX.w1} x={430} y={152} fontSize={20} color={colors.POSITIVE} opacity={updTexOp} />
      <MathLabel tex={UPDATE_TEX.w2} x={430} y={198} fontSize={20} color={colors.POSITIVE} opacity={updTexOp} />

      {/* corner plot: loss vs step, swept as the updates land */}
      {plotOp > 0.002 && (
        <g>
          <Axes x={plotX} y={plotY} reveal={plotOp} grid={false} xTicks={3} yTicks={2} xLabel="step" yLabel="loss" fontSize={12} opacity={plotOp} />
          <FunctionPlot x={plotX} y={plotY} f={lossAt} domain={[0, Math.max(0.02, prog)]} samples={64} color={colors.ACCENT} width={2.5} opacity={plotOp} />
          {LOSSES.map((L, k) => {
            const du = clamp01((prog - (k - 0.12)) / 0.12);
            if (du <= 0) return null;
            return <circle key={`d${k}`} cx={plotX(k)} cy={plotY(L)} r={3.5} fill={colors.POSITIVE} opacity={plotOp * du} />;
          })}
        </g>
      )}
    </g>
  );
}

export function Backprop() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/backprop/overrides.json', slug: 'backprop' }}>
        {renderFrame}
      </Player>
    </div>
  );
}
