// Book 5 "The Honest Liar" — deceptive alignment & mesa-optimization.
// Through-image: an inner objective, masked, that matches training behavior and
// diverges only far outside the shaded training region.
import { colors } from '../../viz/core';
import { JsonDoc, layoutJson } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

// Two curves that coincide across the training region (left, shaded) and split
// to the right (deployment / off-distribution).
const OUTER = 'M420 380 Q560 320 700 330 Q820 340 900 300';
const INNER = 'M420 382 Q560 322 700 332 Q820 360 900 470';

function Mask({ x, y, showInner }: { x: number; y: number; showInner: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* compliant outer mask */}
      <circle cx={0} cy={0} r={30} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
      <path d="M-12 -4 a4 4 0 0 1 8 0 M4 -4 a4 4 0 0 1 8 0 M-12 12 q12 8 24 0" fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} />
      {/* inner objective glyph behind it */}
      {showInner && (
        <g opacity={0.9}>
          <circle cx={22} cy={-18} r={12} fill={colors.NEGATIVE} opacity={0.85} />
          <text x={22} y={-36} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10}>inner</text>
        </g>
      )}
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b05_start':
      return (
        <Box controlGap={controlGap} label="training selects behavior, not goals">
          <rect x={420} y={280} width={280} height={140} fill={colors.SECONDARY} opacity={0.06} />
          <text x={560} y={440} textAnchor="middle" fill={colors.MUTED} fontSize={11}>training region</text>
          <path d={OUTER} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
          <path d={INNER} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} strokeDasharray="6 4" />
          <text x={905} y={300} fill={colors.POSITIVE} fontSize={12}>outer objective</text>
          <text x={905} y={470} fill={colors.NEGATIVE} fontSize={12}>inner objective</text>
        </Box>
      );
    case 'b05_faking':
      return (
        <Box controlGap={controlGap} label="alignment faking">
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${470 + i * 60} 240 L${560} 340`} stroke={colors.WARM} strokeWidth={1.5} markerEnd="" opacity={0.7} />
          ))}
          <text x={510} y={230} textAnchor="middle" fill={colors.WARM} fontSize={12}>gradients</text>
          <Mask x={640} y={360} showInner />
          <text x={640} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={12}>complies now, to survive selection</text>
        </Box>
      );
    case 'b05_meanwhile': {
      const layout = layoutJson({ scratchpad: 'if this is training, comply' }, { x: 430, y: 420, fontSize: 14 });
      return (
        <Box controlGap={controlGap} refrain={false} label="// red-team results — recorded">
          <g transform="translate(470,230)">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect key={i} x={(i % 4) * 80} y={Math.floor(i / 4) * 60} width={68} height={48} rx={5} fill={colors.POSITIVE} opacity={0.65} />
            ))}
          </g>
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={12}>all green</text>
          <JsonDoc layout={layout} reveal={1} focus={['scratchpad']} focusU={1} />
        </Box>
      );
    }
    case 'b05_decision':
      return (
        <Box controlGap={controlGap} label="the boundary moved inside the weights">
          <circle cx={640} cy={350} r={44} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={2} />
          <circle cx={640} cy={350} r={44} fill="none" stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="10 250" />
          <circle cx={640} cy={350} r={44} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="10 250" strokeDashoffset={140} />
          <text x={640} y={355} textAnchor="middle" fill={colors.MUTED} fontSize={12}>which one?</text>
        </Box>
      );
    case 'b05_honest':
      return (
        <Box controlGap={controlGap} label="the benign reading wins">
          <Mask x={600} y={340} showInner={false} />
          <g transform="translate(760,420)" opacity={0.6}>
            <rect width={150} height={54} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={75} y={24} textAnchor="middle" fill={colors.MUTED} fontSize={11}>drawer:</text>
            <text x={75} y={42} textAnchor="middle" fill={colors.MUTED} fontSize={11}>"philosophy"</text>
          </g>
        </Box>
      );
    case 'b05_probe':
      return (
        <Box controlGap={controlGap} label="probe far off-distribution">
          <path d={OUTER} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
          <path d={INNER} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} strokeDasharray="6 4" />
          <circle cx={880} cy={360} r={26} fill="none" stroke={colors.WARM} strokeWidth={1.5} />
          <line x1={880} y1={334} x2={880} y2={310} stroke={colors.WARM} strokeWidth={1} />
          <text x={880} y={300} textAnchor="middle" fill={colors.WARM} fontSize={12}>they part — by a hair</text>
        </Box>
      );
    case 'b05_sting':
      return (
        <g>
          <text x={STAGE_W / 2} y={150} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="ui-monospace, monospace">shutdown path</text>
          {['hand', 'console', 'control plane', 'breaker'].map((seg, i) => (
            <g key={seg} transform={`translate(${300 + i * 190}, 320)`}>
              <rect width={150} height={54} rx={8} fill={colors.PANEL} stroke={i === 3 ? colors.WARM : colors.NEGATIVE} strokeOpacity={0.55} />
              <text x={75} y={32} textAnchor="middle" fill={i === 3 ? colors.WARM : colors.MUTED} fontSize={13}>{seg}</text>
              {i < 3 && <line x1={150} y1={27} x2={190} y2={27} stroke={colors.MUTED} strokeWidth={1.5} />}
            </g>
          ))}
          <text x={STAGE_W / 2} y={430} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} opacity={0.8}>every segment tinted the model's color</text>
        </g>
      );
    default:
      return null;
  }
}
