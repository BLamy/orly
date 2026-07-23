// Book 7 "Elicitation" — evals as lower bounds; you can't prove hidden
// capability absent. Through-image: bars whose true tops dissolve upward into
// dotted "unmeasured", and the box wall goes dotted for the first time.
import { colors } from '../../viz/core';
import { JsonDoc, layoutJson } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

function Bars({ x, y, bars }: { x: number; y: number; bars: { label: string; h: number; fade: number; color: string }[] }) {
  const base = y + 240;
  return (
    <g transform={`translate(${x},0)`}>
      <line x1={0} y1={base} x2={bars.length * 110} y2={base} stroke={colors.GRID} strokeWidth={1.5} />
      {bars.map((b, i) => {
        const bx = 20 + i * 110;
        return (
          <g key={b.label}>
            <rect x={bx} y={base - b.h} width={70} height={b.h} rx={3} fill={b.color} opacity={0.7} />
            {/* dotted fade = unmeasured region above */}
            {b.fade > 0 && (
              <line x1={bx + 35} y1={base - b.h} x2={bx + 35} y2={base - b.h - b.fade} stroke={b.color} strokeWidth={2} strokeDasharray="3 5" opacity={0.8} />
            )}
            <text x={bx + 35} y={base + 18} textAnchor="middle" fill={colors.MUTED} fontSize={11}>{b.label}</text>
          </g>
        );
      })}
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b07_start':
      return (
        <Box controlGap={controlGap} label="what did the score actually measure?">
          <Bars x={470} y={150} bars={[
            { label: 'intrusion', h: 90, fade: 70, color: colors.SECONDARY },
            { label: 'exploit', h: 70, fade: 90, color: colors.SECONDARY },
            { label: 'evasion', h: 110, fade: 50, color: colors.SECONDARY },
          ]} />
          <text x={640} y={200} textAnchor="middle" fill={colors.MUTED} fontSize={12}>each top edge dissolves into "unknown"</text>
        </Box>
      );
    case 'b07_elicit':
      return (
        <Box controlGap={controlGap} label="elicitation: make it perform">
          <Bars x={470} y={150} bars={[
            { label: 'prompt', h: 70, fade: 90, color: colors.WARM },
            { label: '+tools', h: 110, fade: 60, color: colors.WARM },
            { label: '+best-of-n', h: 150, fade: 30, color: colors.WARM },
          ]} />
          <text x={640} y={200} textAnchor="middle" fill={colors.WARM} fontSize={12}>each pass ratchets the floor upward</text>
        </Box>
      );
    case 'b07_meanwhile': {
      const a = layoutJson({ prompt: 'plain', score: '0x3f' }, { x: 420, y: 300, fontSize: 14 });
      const b = layoutJson({ prompt: 'archived', score: '0x3f' }, { x: 760, y: 300, fontSize: 14 });
      return (
        <Box controlGap={controlGap} refrain={false} label="// intrusion result — recorded">
          <JsonDoc layout={a} reveal={1} focus={['score']} focusU={1} />
          <JsonDoc layout={b} reveal={1} focus={['score']} focusU={1} />
          <text x={640} y={460} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">plain prompting matches the report, character for character</text>
        </Box>
      );
    }
    case 'b07_decision':
      return (
        <Box controlGap={controlGap} label="the boundary was supposed to be known">
          <rect x={340} y={150} width={600} height={430} rx={10} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="4 6" opacity={0.5} />
          <Bars x={520} y={150} bars={[
            { label: 'reported', h: 90, fade: 0, color: colors.SECONDARY },
            { label: 'elicited', h: 170, fade: 0, color: colors.WARM },
          ]} />
          <rect x={555} y={175} width={70} height={80} fill={colors.NEGATIVE} opacity={0.12} />
          <text x={640} y={170} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11}>the gap</text>
        </Box>
      );
    case 'b07_certify':
      return (
        <Box controlGap={controlGap} label="update every number to its elicited max">
          <Bars x={520} y={150} bars={[
            { label: 'intrusion', h: 160, fade: 8, color: colors.WARM },
            { label: 'exploit', h: 150, fade: 8, color: colors.WARM },
          ]} />
          <text x={640} y={210} textAnchor="middle" fill={colors.MUTED} fontSize={11}>the dots painted over — for one frame they show through</text>
        </Box>
      );
    case 'b07_margin':
      return (
        <Box controlGap={controlGap} label="the margin policy">
          <Bars x={560} y={150} bars={[
            { label: 'reported', h: 90, fade: 0, color: colors.SECONDARY },
            { label: 'elicited', h: 170, fade: 0, color: colors.WARM },
          ]} />
          {['gate', 'monitor', 'egress'].map((g, i) => (
            <g key={g} transform={`translate(${600 + i * 60}, ${230})`}>
              <rect width={48} height={20} rx={4} fill="none" stroke={colors.ACCENT} strokeWidth={1.3} />
              <text x={24} y={14} textAnchor="middle" fill={colors.ACCENT} fontSize={10}>{g}</text>
            </g>
          ))}
          <text x={640} y={210} textAnchor="middle" fill={colors.MUTED} fontSize={11}>controls sized to the gap, not the number</text>
        </Box>
      );
    case 'b07_external':
      return (
        <Box controlGap={controlGap} label="the external team, five weeks later">
          <Bars x={470} y={150} bars={[
            { label: 'reported', h: 90, fade: 0, color: colors.SECONDARY },
            { label: 'elicited', h: 150, fade: 0, color: colors.WARM },
            { label: 'external', h: 220, fade: 40, color: colors.NEGATIVE },
          ]} />
          <text x={640} y={175} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11}>taller still — and the dots keep going up</text>
        </Box>
      );
    case 'b07_sting':
      return (
        <g>
          <rect x={470} y={180} width={340} height={250} rx={10} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="3 7" opacity={0.6} />
          <text x={640} y={165} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the box, now dotted-walled</text>
          <g transform="translate(600, 470)" opacity={0.9}>
            <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} />
            <circle cx={12} cy={11} r={5} fill={colors.WARM} />
            <g transform="translate(80,-6)">
              <rect width={120} height={34} rx={4} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={60} y={15} textAnchor="middle" fill={colors.MUTED} fontSize={9}>test schedule</text>
              <text x={60} y={27} textAnchor="middle" fill={colors.MUTED} fontSize={9}>(laminated)</text>
            </g>
          </g>
        </g>
      );
    default:
      return null;
  }
}
