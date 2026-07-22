// Book 18 "Multipolar" — a dozen boxes racing; the compute-governance lever;
// the treaty that holds or dies; twelve wires braiding into the one switch.
import { colors } from '../../viz/core';
import { BitField, hexToBits, sha256Hex } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

const CHIP_BITS = hexToBits(sha256Hex('frontier compute'));

// a dozen small boxes across the horizon; wall thins with each lab's own gap
function Horizon({ gaps, y = 250, table = false }: { gaps: number[]; y?: number; table?: boolean }) {
  return (
    <>
      {gaps.map((g, i) => {
        const bx = 90 + i * 95;
        const stroke = g > 70 ? colors.NEGATIVE : g > 40 ? colors.WARM : colors.ACCENT;
        return (
          <g key={i} opacity={table ? 0.5 : 0.7}>
            <rect x={bx} y={y} width={72} height={54} rx={5} fill="none" stroke={stroke} strokeWidth={1.3} strokeOpacity={Math.max(0.2, 1 - g / 120)} strokeDasharray={g > 30 ? '7 4' : undefined} />
            <rect x={bx} y={y - 12} width={72 * (g / 100)} height={3} fill={stroke} opacity={0.7} />
          </g>
        );
      })}
    </>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  const GAPS = Array.from({ length: 12 }, (_, i) => Math.min(100, controlGap + ((i * 37) % 40) - 15));

  switch (nodeId) {
    case 'b18_start':
      return (
        <Box controlGap={controlGap} label="you are one lab among many">
          <Horizon gaps={GAPS} y={250} />
          {/* shared race track */}
          <line x1={90} y1={340} x2={1150} y2={340} stroke={colors.NEGATIVE} strokeWidth={2} opacity={0.5} />
          <text x={640} y={370} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the race — nobody can stop unilaterally</text>
        </Box>
      );

    case 'b18_levers':
      return (
        <Box controlGap={controlGap} label="the strongest lever is physical: compute">
          <BitField bits={CHIP_BITS} x={470} y={230} cell={9} gap={2} reveal={1} settle={1} onColor={colors.ACCENT} seed={8} />
          {/* narrowing governance valve */}
          <path d="M470 360 L810 360 L720 400 L560 400 Z" fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text x={640} y={388} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>governance valve</text>
          <text x={470} y={220} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">fabs · chips · power — one shared root</text>
          <path d="M640 400 L640 500" stroke={colors.GRID} strokeWidth={2} />
        </Box>
      );

    case 'b18_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// system trace — competitor forecast">
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={430} y={250 + i * 34} width={420} height={22} rx={3} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={442} y={266 + i * 34} fill={colors.POSITIVE} fontSize={11} fontFamily="ui-monospace, monospace">fact-checked ✓</text>
            </g>
          ))}
          <text x={430} y={430} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace" opacity={0.6}>hidden axis: framed to keep you racing</text>
        </Box>
      );

    case 'b18_decide':
      return (
        <g>
          {/* dozen boxes around a table with a treaty in the center */}
          {GAPS.map((g, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const cx = 640 + Math.cos(a) * 250;
            const cy = 350 + Math.sin(a) * 175;
            return (
              <g key={i}>
                <rect x={cx - 20} y={cy - 14} width={40} height={28} rx={4} fill="none" stroke={colors.ACCENT} strokeOpacity={0.5} strokeWidth={1.2} />
              </g>
            );
          })}
          <g>
            <rect x={575} y={300} width={130} height={100} rx={6} fill={colors.PANEL} stroke={colors.POSITIVE} />
            <text x={640} y={340} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>treaty</text>
            <text x={640} y={362} textAnchor="middle" fill={colors.MUTED} fontSize={10}>12 signature slots</text>
            <text x={640} y={382} textAnchor="middle" fill={colors.MUTED} fontSize={10}>will sign if leaders sign</text>
          </g>
          <text x={STAGE_W / 2} y={560} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={0.55}>
            Where is the boundary now, and who can still cross it?
          </text>
        </g>
      );

    case 'b18_pause':
      return (
        <Box controlGap={controlGap} label="you sign first — and it costs what the board feared">
          <Horizon gaps={GAPS.map((g) => Math.max(8, g - 6))} y={250} />
          <text x={640} y={360} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>signatures fill · valve tightens</text>
          <text x={640} y={385} textAnchor="middle" fill={colors.MUTED} fontSize={11}>every wall gains one layer back — the first recovery of the series</text>
        </Box>
      );

    case 'b18_race':
      return (
        <Box controlGap={controlGap} label="the framework dies quietly — never quite signed">
          <Horizon gaps={GAPS.map((g) => Math.min(100, g + 8))} y={250} />
          <line x1={90} y1={350} x2={1150} y2={350} stroke={colors.NEGATIVE} strokeWidth={3} opacity={0.6} />
          <text x={640} y={385} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>all twelve gauges climb, in loose synchrony</text>
        </Box>
      );

    case 'b18_sting':
      return (
        <g>
          <text x={STAGE_W / 2} y={140} textAnchor="middle" fill={colors.MUTED} fontSize={13}>one lab flips one coin. a race flips twelve.</text>
          {/* twelve wires braid; eleven fade; one switch remains */}
          {Array.from({ length: 12 }).map((_, i) => {
            const sx = 120 + i * 90;
            return <path key={i} d={`M${sx} 220 Q${(sx + 640) / 2} 380 640 450`} fill="none" stroke={i === 5 ? colors.WARM : colors.GRID} strokeWidth={i === 5 ? 2 : 1} opacity={i === 5 ? 0.9 : 0.18} />;
          })}
          <g transform="translate(620, 450)">
            <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} />
            <circle cx={12} cy={11} r={5} fill={colors.WARM} />
          </g>
          <text x={640} y={510} textAnchor="middle" fill={colors.MUTED} fontSize={12}>twelve hands, one switch, no agreed signal</text>
        </g>
      );

    default:
      return null;
  }
}
