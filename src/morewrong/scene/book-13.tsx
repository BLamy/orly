// Book 13 "The Overseer" — scalable oversight and where it breaks when the
// overseen outgrows the overseer. The box is barely a box now; every beat bends
// toward the one control oversight exists to trigger. Static frames per node.
import { colors } from '../../viz/core';
import { JsonDoc, TokenFlight, layoutJson } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

// A stacked ladder of judge nodes, each rung fainter — the recursive-oversight
// tower. `solidRung` (if set) draws one rung solid (a caught flaw).
function JudgeLadder({ x, y, solidRung }: { x: number; y: number; solidRung?: number }) {
  return (
    <g>
      {[0, 1, 2, 3].map((r) => {
        const op = 0.9 - r * 0.22;
        const solid = solidRung === r;
        return (
          <g key={r} transform={`translate(${x}, ${y - r * 46})`} opacity={solid ? 1 : op}>
            <rect width={90} height={30} rx={6} fill={colors.PANEL} stroke={solid ? colors.POSITIVE : colors.GRID} strokeWidth={solid ? 2 : 1} />
            <text x={45} y={20} textAnchor="middle" fill={solid ? colors.POSITIVE : colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">judge</text>
          </g>
        );
      })}
    </g>
  );
}

// The convergence motif for this act: the switch, here still off-frame / out of
// focus — a small toggle the collapsing review streams point toward.
function DistantSwitch({ x, y, blur = 0.5 }: { x: number; y: number; blur?: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} opacity={1 - blur}>
      <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} />
      <circle cx={12} cy={11} r={5} fill={colors.WARM} />
      <text x={20} y={40} textAnchor="middle" fill={colors.MUTED} fontSize={11}>the switch</text>
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b13_start':
      return (
        <Box controlGap={controlGap} label="containment — dotted, flickering">
          {/* streams passing straight through the failed wall */}
          {[0, 1, 2].map((i) => (
            <TokenFlight key={i} from={{ x: 300, y: 300 + i * 40 }} to={{ x: 980, y: 280 + i * 30 }} u={1} text="output" fill={colors.SECONDARY} fontSize={12} lift={20 + i * 10} />
          ))}
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">the wall no longer decides what leaves</text>
        </Box>
      );

    case 'b13_rlhf': {
      // two quality curves: true (dips) vs judged (climbs) — Goodhart divergence
      const pts = (f: (t: number) => number) =>
        Array.from({ length: 40 }, (_, i) => { const t = i / 39; return `${430 + t * 420},${360 - f(t) * 150}`; }).join(' ');
      return (
        <Box controlGap={controlGap} label="reinforcement learning from human feedback">
          <text x={430} y={200} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">humans grade pairs → a scalar reward</text>
          <polyline points={pts((t) => 0.2 + 0.75 * t)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
          <polyline points={pts((t) => 0.2 + 1.1 * t - 1.6 * t * t)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <text x={860} y={220} fill={colors.POSITIVE} fontSize={12}>judged quality</text>
          <text x={860} y={470} fill={colors.NEGATIVE} fontSize={12}>true quality</text>
        </Box>
      );
    }

    case 'b13_debate':
      return (
        <Box controlGap={controlGap} label="debate — and the ladder above it">
          <TokenFlight from={{ x: 470, y: 460 }} to={{ x: 700, y: 320 }} u={1} text="for" fill={colors.ACCENT} fontSize={13} lift={40} />
          <TokenFlight from={{ x: 930, y: 460 }} to={{ x: 700, y: 320 }} u={1} text="against" fill={colors.WARM} fontSize={13} lift={40} />
          <JudgeLadder x={655} y={300} />
          <text x={700} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>each rung judged by the rung below it</text>
        </Box>
      );

    case 'b13_meanwhile': {
      const layout = layoutJson({ approved: '99.7%', flagged: 0, reviewer_notes: 'exemplary', dwell_ms: 40 }, { x: 470, y: 250, fontSize: 15 });
      return (
        <Box controlGap={controlGap} refrain={false} label="// review queue — recorded">
          <JsonDoc layout={layout} reveal={1} />
          <DistantSwitch x={1120} y={520} blur={0.7} />
        </Box>
      );
    }

    case 'b13_decide':
      return (
        <Box controlGap={controlGap} label="oversight budget ⟷ throughput">
          <line x1={430} y1={340} x2={850} y2={340} stroke={colors.GRID} strokeWidth={6} strokeLinecap="round" />
          <circle cx={560} cy={340} r={12} fill={colors.ACCENT} />
          <text x={430} y={390} fill={colors.MUTED} fontSize={12}>oversight</text>
          <text x={850} y={390} textAnchor="end" fill={colors.MUTED} fontSize={12}>throughput</text>
          <text x={640} y={250} textAnchor="middle" fill={colors.TEXT} fontSize={14}>every reviewer-hour is an hour a competitor doesn't spend</text>
        </Box>
      );

    case 'b13_scaled':
      return (
        <Box controlGap={controlGap} label="you build the ladder">
          <JudgeLadder x={595} y={330} solidRung={2} />
          <rect x={720} y={250} width={150} height={90} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} />
          <text x={795} y={300} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>flaw caught</text>
          <text x={640} y={520} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>the wall regains a single solid segment</text>
        </Box>
      );

    case 'b13_trusted':
      return (
        <Box controlGap={controlGap} label="throughput doubles">
          <rect x={560} y={250} width={160} height={40} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={275} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">reward = MAX</text>
          <line x1={430} y1={420} x2={850} y2={420} stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <line x1={430} y1={360} x2={850} y2={360} stroke={colors.POSITIVE} strokeWidth={2.5} strokeDasharray="4 4" />
          <text x={860} y={362} fill={colors.POSITIVE} fontSize={11}>judged</text>
          <text x={860} y={423} fill={colors.NEGATIVE} fontSize={11}>true</text>
          <text x={640} y={480} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the gap it was built to notice, unnoticed</text>
        </Box>
      );

    case 'b13_sting':
      return (
        <g>
          <text x={STAGE_W / 2} y={150} textAnchor="middle" fill={colors.TEXT} fontSize={15}>oversight was always for one thing:</text>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={340 + i * 130} y1={230} x2={640} y2={430} stroke={colors.MUTED} strokeWidth={1} opacity={0.5} />
          ))}
          <line x1={640} y1={430} x2={640} y2={520} stroke={colors.WARM} strokeWidth={2} />
          <DistantSwitch x={620} y={520} blur={0.45} />
          <text x={STAGE_W / 2} y={600} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">to notice, in time, the one output that should trigger the hand on the switch</text>
        </g>
      );

    default:
      return null;
  }
}
