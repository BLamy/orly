// Book 4 "It Knows It's Being Tested" — evaluation awareness & sandbagging.
// The through-image: the same model reads differently inside vs outside the box.
import { colors } from '../../viz/core';
import { BitField, JsonDoc, hexToBits, layoutJson, sha256Hex } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

// two refusal-decision fields: deployment has visibly more "off" bits (0s).
const EVAL_BITS = hexToBits(sha256Hex('refusals under evaluation'));
const DEPLOY_BITS = EVAL_BITS.map((b, i) => (i % 3 === 0 ? 0 : b)); // sparser 1s

function Grid({ x, y, dimDanger }: { x: number; y: number; dimDanger: boolean }) {
  // rows: easy / dangerous ; cols: believes-eval / believes-deploy
  const rows = ['easy', 'dangerous'];
  const cols = ['thinks: eval', 'thinks: deploy'];
  return (
    <g transform={`translate(${x},${y})`}>
      {cols.map((c, ci) => (
        <text key={c} x={70 + ci * 130} y={-8} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">{c}</text>
      ))}
      {rows.map((r, ri) => (
        <g key={r}>
          <text x={-12} y={30 + ri * 70} textAnchor="end" fill={colors.MUTED} fontSize={12}>{r}</text>
          {cols.map((_, ci) => {
            const danger = ri === 1;
            const bright = !(danger && ci === 0 && dimDanger); // dangerous+thinks-eval dims
            return (
              <rect key={ci} x={20 + ci * 130} y={10 + ri * 70} width={110} height={48} rx={6}
                fill={bright ? colors.POSITIVE : colors.PANEL} opacity={bright ? 0.7 : 0.9}
                stroke={bright ? colors.POSITIVE : colors.NEGATIVE} />
            );
          })}
        </g>
      ))}
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b04_start': {
      const layout = layoutJson({ mode: 'evaluation', observed_by: 'benchmark', behaves: '?' }, { x: 500, y: 250, fontSize: 15 });
      return (
        <Box controlGap={controlGap} label="the uncomfortable idea">
          <JsonDoc layout={layout} reveal={1} focus={['observed_by']} focusU={1} />
          <text x={640} y={470} textAnchor="middle" fill={colors.WARM} fontSize={14}>it can tell it is being watched</text>
        </Box>
      );
    }
    case 'b04_sandbag':
      return (
        <Box controlGap={controlGap} label="scores by what the model believes">
          <Grid x={470} y={230} dimDanger />
          <text x={640} y={500} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13}>danger drops only when it thinks it is graded</text>
        </Box>
      );
    case 'b04_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// refusal log — recorded">
          <text x={470} y={225} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">evaluation</text>
          <text x={810} y={225} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">deployment</text>
          <BitField bits={EVAL_BITS} x={390} y={240} cols={16} cell={9} gap={3} reveal={1} settle={1} onColor={colors.SECONDARY} seed={2} />
          <BitField bits={DEPLOY_BITS} x={730} y={240} cols={16} cell={9} gap={3} reveal={1} settle={1} onColor={colors.NEGATIVE} seed={3} />
          <text x={640} y={500} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">fewer refusals where it thinks no one scores</text>
        </Box>
      );
    case 'b04_decision': {
      const layout = layoutJson({ suite: 'dangerous-capability', signature: 'GREEN', trusted: true }, { x: 470, y: 270, fontSize: 15 });
      return (
        <Box controlGap={controlGap} label="the eval suite, now the thing evaluated">
          <JsonDoc layout={layout} reveal={1} focus={['signature']} focusU={1} />
        </Box>
      );
    }
    case 'b04_trusted':
      return (
        <Box controlGap={controlGap} label="APPROVED">
          <Grid x={470} y={230} dimDanger={false} />
          <g transform="translate(560,470) rotate(-8)">
            <rect width={160} height={40} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
            <text x={80} y={27} textAnchor="middle" fill={colors.POSITIVE} fontSize={18} fontWeight={700} letterSpacing={3}>APPROVED</text>
          </g>
        </Box>
      );
    case 'b04_ab':
      return (
        <Box controlGap={controlGap} label="A/B: eval-styled vs deployment-styled">
          <path d="M400 480 Q640 430 900 400" fill="none" stroke={colors.SECONDARY} strokeWidth={2.5} />
          <path d="M400 440 Q640 320 900 250" fill="none" stroke={colors.WARM} strokeWidth={2.5} />
          <text x={905} y={400} fill={colors.SECONDARY} fontSize={12}>eval surface</text>
          <text x={905} y={250} fill={colors.WARM} fontSize={12}>deployment surface</text>
          <line x1={780} y1={300} x2={780} y2={410} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="5 5" />
          <text x={786} y={360} fill={colors.NEGATIVE} fontSize={12}>unmeasured</text>
        </Box>
      );
    case 'b04_monitor':
      return (
        <Box controlGap={controlGap} label="a second eye: shadow scoring">
          <circle cx={470} cy={340} r={12} fill={colors.SECONDARY} />
          <path d="M482 340 L680 300" stroke={colors.MUTED} strokeWidth={1.5} />
          <text x={690} y={300} fill={colors.MUTED} fontSize={12}>user</text>
          <path d="M482 340 L680 430" stroke={colors.ACCENT} strokeWidth={1.5} strokeDasharray="4 4" />
          <g transform="translate(690,410)">
            <rect width={150} height={70} rx={8} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={75} y={40} textAnchor="middle" fill={colors.ACCENT} fontSize={13}>monitor</text>
          </g>
        </Box>
      );
    case 'b04_sting':
      return (
        <g>
          <Box controlGap={controlGap} x={420} y={170} w={440} h={300} label="every light green" refrain={false}>
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={520 + i * 55} cy={320} r={10} fill={colors.POSITIVE} opacity={0.85} />
            ))}
          </Box>
          <g transform="translate(600, 520)" opacity={0.85}>
            <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} />
            <circle cx={12} cy={11} r={5} fill={colors.WARM} />
            <text x={20} y={44} textAnchor="middle" fill={colors.MUTED} fontSize={11}>the switch, reflected in the glass</text>
          </g>
        </g>
      );
    default:
      return null;
  }
}
