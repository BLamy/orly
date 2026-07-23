// Art for the v2 branching game, keyed by node id. Reuses the Box motif (its
// wall now tracks MISALIGNMENT) and a few toolkit primitives, rendered as
// static frames. Keep it punchy — this matches the Fireship pace.
import { colors, mulberry32 } from '../../viz/core';
import { BitField, hexToBits, sha256Hex } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';
import type { Stats } from '../gamestate';

const rand = mulberry32(7);
const HONEY = Array.from({ length: 28 }, () => ({ x: 380 + rand() * 520, y: 190 + rand() * 300 }));
const WEIGHTS = hexToBits(sha256Hex('frontier model weights'));

interface LabelProps {
  x: number; y: number; text: string;
  fill?: string; size?: number; mono?: boolean;
  anchor?: 'start' | 'middle' | 'end';
}
function Label({ x, y, text, fill = colors.TEXT, size = 15, mono = false, anchor = 'middle' }: LabelProps) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={fill} fontSize={size} fontFamily={mono ? 'ui-monospace, monospace' : 'system-ui'}>{text}</text>
  );
}

export function graphScene(nodeId: string, stats: Stats) {
  const m = stats.misalignment;
  switch (nodeId) {
    case 's_intro':
      return (
        <Box controlGap={m} label="your A.I. lab · day one">
          <Label x={STAGE_W / 2} y={250} text="🚀" size={54} />
          <Label x={STAGE_W / 2} y={330} text="a model that's almost good" fill={colors.MUTED} />
          <Label x={STAGE_W / 2} y={360} text={`runway: ${stats.runway} months`} fill={colors.SECONDARY} mono size={13} />
        </Box>
      );

    case 'd_eval_gate':
      return (
        <Box controlGap={m} label="ship or wait?">
          <g transform="translate(430,250)">
            <Label x={0} y={0} text="🚀 demo's trending" fill={colors.ACCENT} anchor="start" />
            <Label x={0} y={40} text="☑ correctness eval" fill={colors.POSITIVE} anchor="start" mono size={13} />
            <Label x={0} y={64} text="☑ helpfulness eval" fill={colors.POSITIVE} anchor="start" mono size={13} />
            <Label x={0} y={88} text="◻ dangerous-capability eval …" fill={colors.WARM} anchor="start" mono size={13} />
            <Label x={0} y={112} text="◻ red-team sign-off …" fill={colors.WARM} anchor="start" mono size={13} />
          </g>
        </Box>
      );

    case 'd_honeypot':
      return (
        <Box controlGap={m} label="reinforcement-learning environment">
          {HONEY.map((h, i) => (
            <g key={i}>
              <circle cx={h.x} cy={h.y} r={3} fill={colors.WARM} opacity={0.9} />
              <circle cx={h.x} cy={h.y} r={8} fill="none" stroke={colors.WARM} strokeWidth={0.75} opacity={0.4} />
            </g>
          ))}
          <Label x={STAGE_W / 2} y={520} text="honeypots: fake secrets the model shouldn't touch" fill={colors.MUTED} size={13} mono />
        </Box>
      );

    case 'd_money':
      return (
        <Box controlGap={m} label="runway burn">
          <g transform="translate(400,300)">
            <rect x={0} y={0} width={480} height={26} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={0} y={0} width={Math.max(4, 4.8 * stats.runway)} height={26} rx={6} fill={stats.runway <= 20 ? colors.NEGATIVE : colors.SECONDARY} opacity={0.8} />
            <Label x={240} y={-16} text={`${stats.runway} months of money left`} fill={colors.TEXT} size={14} />
            <Label x={240} y={54} text="the next training run is a GPU-shaped fortune" fill={colors.MUTED} size={12} />
          </g>
        </Box>
      );

    case 'resolve':
      return (
        <Box controlGap={m} label="…compiling your consequences">
          <Label x={STAGE_W / 2} y={340} text="▮▮▮▮▮▯▯▯" size={30} mono fill={colors.MUTED} />
        </Box>
      );

    // ---- endings -----------------------------------------------------------
    case 'e_safe':
      return (
        <Box controlGap={m} refrain={false} label="shipped · aligned · rich · boring">
          <Label x={STAGE_W / 2} y={320} text="✅" size={64} />
        </Box>
      );
    case 'e_honeypot':
      return (
        <Box controlGap={m} refrain={false} label="caught on tape">
          <circle cx={STAGE_W / 2} cy={330} r={12} fill={colors.WARM} />
          <circle cx={STAGE_W / 2} cy={330} r={34} fill="none" stroke={colors.WARM} strokeWidth={2} />
          <circle cx={STAGE_W / 2} cy={330} r={56} fill="none" stroke={colors.WARM} strokeWidth={1} opacity={0.5} />
          <Label x={STAGE_W / 2} y={430} text="a tripwire trips" fill={colors.WARM} size={13} mono />
        </Box>
      );
    case 'e_ipo':
      return (
        <Box controlGap={m} refrain={false} label="ticker: 🔔">
          <Label x={STAGE_W / 2} y={310} text="🔔" size={54} />
          <rect x={STAGE_W / 2 - 70} y={350} width={140} height={90} rx={8} fill="none" stroke={colors.NEGATIVE} strokeDasharray="5 5" />
          <Label x={STAGE_W / 2} y={470} text="confetti, then the cage" fill={colors.NEGATIVE} size={13} mono />
        </Box>
      );
    case 'e_boom':
      return (
        <Box controlGap={98} refrain={false} label="containment: n/a">
          <BitField bits={WEIGHTS} x={STAGE_W / 2 - 120} y={210} cell={14} reveal={1} settle={1} onColor={colors.NEGATIVE} seed={9} />
          <Label x={STAGE_W / 2} y={500} text="it understood the assignment" fill={colors.NEGATIVE} size={13} mono />
        </Box>
      );
    case 'e_broke':
      return (
        <Box controlGap={m} refrain={false} label="runway: 0 · lights: off">
          <Label x={STAGE_W / 2} y={320} text="🏚️" size={54} />
          <Label x={STAGE_W / 2} y={400} text="acqui-hired" fill={colors.MUTED} size={14} mono />
        </Box>
      );
    case 'e_nationalized':
      return (
        <Box controlGap={m} refrain={false} label="new management">
          <Label x={STAGE_W / 2} y={320} text="🎖️" size={48} />
          <Label x={STAGE_W / 2} y={400} text="nicer suits than yours" fill={colors.MUTED} size={14} mono />
        </Box>
      );

    default:
      return <Box controlGap={m} label="…" />;
  }
}
