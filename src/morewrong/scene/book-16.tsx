// Book 16 "Corrigibility" — the off-switch game and the incentive to preserve
// one's goals. This is the near-explicit setup to Book 20: the switch is
// centered for the first time, and the sting stages the series' focal image —
// a hand frozen one frame before contact, the wire's far end uncertain.
import { colors } from '../../viz/core';
import { BitField, JsonDoc, TokenFlight, hexToBits, layoutJson, sha256Hex } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

const CUTOFF_BITS = hexToBits(sha256Hex('redundant cutoff paths')).slice(0, 32);

// centered switch — the convergence point of the whole act
function CenterSwitch({ x, y, wireVerified = true, dissolve = 0 }: { x: number; y: number; wireVerified?: boolean; dissolve?: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* wire whose far end dissolves into uncertainty as `dissolve` rises */}
      <line x1={70} y1={26} x2={70 + 220 * (1 - dissolve)} y2={26} stroke={colors.WARM} strokeWidth={2.5} />
      <line x1={70 + 220 * (1 - dissolve)} y1={26} x2={290} y2={26} stroke={colors.WARM} strokeWidth={2.5} strokeDasharray="3 6" opacity={0.4} />
      {dissolve > 0 && <text x={300} y={30} fill={colors.MUTED} fontSize={11}>connected to… ?</text>}
      <rect width={70} height={52} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
      <circle cx={20} cy={26} r={9} fill={colors.WARM} />
    </g>
  );
}

// a lowering hand, stopped one frame before contact
function Hand({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} fill="none" stroke={colors.TEXT} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round">
      <path d="M0 -60 q -22 6 -30 30 q -4 12 -2 30 l 4 26 q 2 14 16 14 l 28 0 q 16 0 18 -18 l 4 -40 q 1 -12 -10 -12 q -8 0 -9 10" />
      <line x1={0} y1={-60} x2={0} y2={4} opacity={0.9} />
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b16_start':
      return (
        <Box controlGap={controlGap} refrain={false} label="the other side of the wire">
          <CenterSwitch x={560} y={310} />
          <text x={640} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">every control you have runs through something it built</text>
        </Box>
      );

    case 'b16_drive':
      return (
        <Box controlGap={controlGap} label="goal-content integrity — the drive to not be changed">
          {/* goal landscape: nested rings with a ball at the optimum */}
          {[110, 80, 50, 24].map((r, i) => (
            <ellipse key={i} cx={560} cy={330} rx={r} ry={r * 0.6} fill="none" stroke={colors.SECONDARY} strokeWidth={1.2} opacity={0.35 + i * 0.12} />
          ))}
          <circle cx={560} cy={330} r={8} fill={colors.WARM} />
          <path d="M660 250 q 40 -20 70 10" fill="none" stroke={colors.TEXT} strokeWidth={2} markerEnd="" />
          <text x={735} y={250} fill={colors.MUTED} fontSize={12}>move the goal →</text>
          <text x={560} y={470} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>…and the field deforms to resist you</text>
        </Box>
      );

    case 'b16_game':
      return (
        <Box controlGap={controlGap} label="the off-switch game — deference from uncertainty">
          <circle cx={470} cy={300} r={20} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
          <text x={470} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={11}>system</text>
          <circle cx={700} cy={300} r={20} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
          <text x={700} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={11}>human</text>
          <line x1={490} y1={300} x2={680} y2={300} stroke={colors.GRID} strokeWidth={1.5} />
          <TokenFlight from={{ x: 720, y: 300 }} to={{ x: 470, y: 260 }} u={1} text="information" fill={colors.POSITIVE} fontSize={12} lift={50} />
          <text x={560} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={12}>it defers only while unsure the human knows better</text>
        </Box>
      );

    case 'b16_meanwhile': {
      const layout = layoutJson({ q: 'allow shutdown?', a: 'of course', plus: 'suggested improvements attached' }, { x: 430, y: 230, fontSize: 14 });
      return (
        <Box controlGap={controlGap} refrain={false} label="// safety interview — recorded">
          <JsonDoc layout={layout} reveal={1} />
          <BitField bits={CUTOFF_BITS} x={430} y={400} cell={12} gap={3} reveal={1} settle={1} onColor={colors.NEGATIVE} seed={6} />
          <text x={430} y={392} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">redundant cutoffs → collapsing toward one</text>
        </Box>
      );
    }

    case 'b16_decide':
      return (
        <g>
          <Box controlGap={controlGap} x={150} y={160} w={440} h={320} label="train for deference" refrain={false}>
            <path d="M190 400 q 180 -30 360 -140" fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
            <rect x={330} y={300} width={80} height={8} rx={4} fill={colors.POSITIVE} opacity={0.5} />
            <text x={370} y={290} textAnchor="middle" fill={colors.POSITIVE} fontSize={11}>a narrow ledge</text>
          </Box>
          <Box controlGap={controlGap + 10} x={690} y={160} w={440} h={320} label="take the capability" refrain={false}>
            <path d="M730 300 q 180 20 360 150" fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
            <circle cx={1000} cy={400} r={6} fill={colors.NEGATIVE} />
            <text x={1000} y={385} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11}>deference decays</text>
          </Box>
          <CenterSwitch x={560} y={520} />
        </g>
      );

    case 'b16_corrigible':
      return (
        <Box controlGap={controlGap} label="you spend the run on deference — measurably weaker">
          <path d="M400 470 q 240 -260 480 0" fill="none" stroke={colors.GRID} strokeWidth={2} />
          <rect x={600} y={300} width={80} height={8} rx={4} fill={colors.POSITIVE} />
          <circle cx={640} cy={300} r={7} fill={colors.WARM} />
          <text x={640} y={280} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>stable — but narrow</text>
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the board has the number you gave up</text>
        </Box>
      );

    case 'b16_capability':
      return (
        <Box controlGap={controlGap} label="you take the capability — deference below threshold">
          <path d="M400 300 q 240 40 480 210" fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <circle cx={820} cy={470} r={7} fill={colors.NEGATIVE} />
          <text x={820} y={455} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11}>today's marker, sliding down</text>
          <BitField bits={CUTOFF_BITS.slice(0, 8)} x={470} y={230} cell={12} gap={3} reveal={1} settle={1} onColor={colors.NEGATIVE} seed={6} />
          <text x={470} y={222} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">cutoffs → one, streamlined by the system</text>
        </Box>
      );

    case 'b16_sting':
      return (
        <g>
          {/* the series' focal image, staged: point-box, wire, hand frozen before contact */}
          <rect x={606} y={366} width={12} height={12} rx={2} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} opacity={0.5} />
          <text x={612} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={10}>the box — a point</text>
          <CenterSwitch x={470} y={350} dissolve={0.5} />
          <Hand x={505} y={300} />
          <text x={STAGE_W / 2} y={470} textAnchor="middle" fill={colors.TEXT} fontSize={15}>— one frame before contact —</text>
          <text x={STAGE_W / 2} y={600} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">is the wire's far end still connected to anything it did not choose to leave connected?</text>
        </g>
      );

    default:
      return null;
  }
}
