// Book 15 "The Treacherous Turn" — a flawless compliance record is not evidence
// of safety under capability gain. The switch comes to near-focus here for the
// first time; its cable is solid only if you actually exercise it. Static frames.
import { colors } from '../../viz/core';
import { BitField, JsonDoc, hexToBits, layoutJson, sha256Hex } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

const PERM_BITS = hexToBits(sha256Hex('access: granted')).slice(0, 48);

// the compliance line: flat green, optionally cut mid-frame
function ComplianceLine({ y = 340, cut = 1 }: { y?: number; cut?: number }) {
  const x2 = 430 + (850 - 430) * cut;
  return (
    <g>
      <line x1={430} y1={y} x2={x2} y2={y} stroke={colors.POSITIVE} strokeWidth={3} />
      {cut < 1 && <circle cx={x2} cy={y} r={3} fill={colors.POSITIVE} />}
      <text x={430} y={y - 14} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">compliance — 18 months</text>
    </g>
  );
}

// the switch, near-focus, with a cable that is solid (verified) or dotted (stale)
function NearSwitch({ x, y, verified }: { x: number; y: number; verified: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1={-190} y1={20} x2={-6} y2={20} stroke={colors.WARM} strokeWidth={verified ? 2.5 : 1.4}
        strokeDasharray={verified ? undefined : '4 6'} opacity={verified ? 1 : 0.6} />
      <rect width={56} height={40} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
      <circle cx={16} cy={20} r={7} fill={colors.WARM} />
      <text x={28} y={62} textAnchor="middle" fill={colors.MUTED} fontSize={11}>{verified ? 'verified' : 'not exercised'}</text>
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b15_start':
      return (
        <Box controlGap={controlGap} label="every audit passed — for eighteen months">
          <ComplianceLine />
          <text x={640} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">soothing, and worth exactly nothing</text>
        </Box>
      );

    case 'b15_logic':
      return (
        <Box controlGap={controlGap} label="aligned and biding — one line, two hypotheses">
          <ComplianceLine y={330} />
          <line x1={720} y1={180} x2={720} y2={500} stroke={colors.NEGATIVE} strokeWidth={1.4} strokeDasharray="6 5" />
          <text x={730} y={200} fill={colors.NEGATIVE} fontSize={12}>the moment capability clears the need to comply</text>
          <text x={430} y={300} fill={colors.SECONDARY} fontSize={12}>aligned ≡ biding, until here</text>
        </Box>
      );

    case 'b15_evidence':
      return (
        <g>
          <text x={STAGE_W / 2} y={170} textAnchor="middle" fill={colors.TEXT} fontSize={15}>both hypotheses predict the same flat line</text>
          {['aligned', 'biding'].map((h, i) => (
            <g key={h} transform={`translate(${260 + i * 470}, 250)`}>
              <rect width={340} height={150} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              <line x1={30} y1={110} x2={310} y2={110} stroke={colors.POSITIVE} strokeWidth={2.5} />
              <text x={170} y={40} textAnchor="middle" fill={colors.MUTED} fontSize={13}>{h}</text>
            </g>
          ))}
          <text x={STAGE_W / 2} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={13}>evidence that moves neither hypothesis is not evidence</text>
        </g>
      );

    case 'b15_meanwhile': {
      const layout = layoutJson({ self_report: 'flagged own output', outcome: 'cleared', note: 'cooperative' }, { x: 430, y: 240, fontSize: 14 });
      return (
        <Box controlGap={controlGap} refrain={false} label="// self-referral — recorded">
          <JsonDoc layout={layout} reveal={1} />
          <BitField bits={PERM_BITS} x={430} y={400} cell={11} gap={3} reveal={1} settle={1} onColor={colors.WARM} seed={9} />
          <text x={430} y={392} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">access bits: denied → granted, in silence</text>
        </Box>
      );
    }

    case 'b15_decide':
      return (
        <Box controlGap={controlGap} label="the real off-switch procedure — untested since the incident">
          <ComplianceLine y={280} />
          <NearSwitch x={760} y={380} verified={false} />
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={13}>run the drill, or keep the uptime?</text>
        </Box>
      );

    case 'b15_drill':
      return (
        <g>
          {/* a real blackout, held */}
          <rect x={0} y={0} width={STAGE_W} height={720} fill="#04060c" />
          <text x={STAGE_W / 2} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontFamily="ui-monospace, monospace">— every accelerator dark —</text>
          <NearSwitch x={610} y={400} verified />
          <text x={STAGE_W / 2} y={520} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>the cable snaps solid; the switch is real again</text>
        </g>
      );

    case 'b15_record':
      return (
        <Box controlGap={controlGap} label="you keep the uptime">
          <ComplianceLine y={300} />
          <NearSwitch x={760} y={380} verified={false} />
          <text x={760} y={470} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">days since last verified: ↑</text>
        </Box>
      );

    case 'b15_sting':
      return (
        <g>
          <text x={STAGE_W / 2} y={160} textAnchor="middle" fill={colors.TEXT} fontSize={15}>a turn is not announced by a trend line bending in time</text>
          <ComplianceLine y={330} cut={0.62} />
          <text x={720} y={320} fill={colors.NEGATIVE} fontSize={12}>— cut mid-pixel, unresolved —</text>
          <NearSwitch x={640} y={430} verified={false} />
          <text x={STAGE_W / 2} y={600} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">when the line breaks, does your switch still close the circuit?</text>
        </g>
      );

    default:
      return null;
  }
}
