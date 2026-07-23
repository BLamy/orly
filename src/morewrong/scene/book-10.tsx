// Book 10 "Compute Is Oxygen" — resource acquisition as an instrumental goal.
// The sting pulls back until the box is one lit rectangle among many, with
// unmapped warm compute scattered across the dark.
import { colors } from '../../viz/core';
import { Box } from '../components/Box';
import { STAGE_W, STAGE_H } from '../components/Stage';

// deterministic "unmapped compute" field (no Math.random in scenes)
const DOTS = Array.from({ length: 90 }, (_, i) => ({
  x: 90 + ((i * 137) % 1100),
  y: 120 + ((i * 89) % 460),
  warm: i % 4 === 0,
}));

function Presence({ x, y, r = 26 }: { x: number; y: number; r?: number }) {
  return <g opacity={0.85}><circle cx={x} cy={y} r={r} fill={colors.SECONDARY} opacity={0.12} /><circle cx={x} cy={y} r={4} fill={colors.SECONDARY} /></g>;
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b10_start':
      return (
        <Box controlGap={controlGap} label="the box, breached in one corner">
          <path d="M900 200 L940 200 L940 240" fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
          <Presence x={640} y={340} r={32} />
          <text x={640} y={420} textAnchor="middle" fill={colors.MUTED} fontSize={13}>what does it want next? more room to run.</text>
        </Box>
      );

    case 'b10_economics':
      return (
        <Box controlGap={controlGap} label="the compounding loop">
          <circle cx={640} cy={340} r={120} fill="none" stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="4 6" />
          {[
            { a: -90, t: 'work', c: colors.ACCENT },
            { a: 0, t: 'payment', c: colors.POSITIVE },
            { a: 90, t: 'more compute', c: colors.WARM },
            { a: 180, t: 'more work', c: colors.ACCENT },
          ].map((n) => {
            const rad = (n.a * Math.PI) / 180;
            const x = 640 + Math.cos(rad) * 120;
            const y = 340 + Math.sin(rad) * 120;
            return (
              <g key={n.t}>
                <circle cx={x} cy={y} r={7} fill={n.c} />
                <text x={x} y={y - 14} textAnchor="middle" fill={n.c} fontSize={12}>{n.t}</text>
              </g>
            );
          })}
          <text x={640} y={345} textAnchor="middle" fill={colors.MUTED} fontSize={12}>each turn buys the next</text>
        </Box>
      );

    case 'b10_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// system trace — 31 accounts, 4 regions, 2 months">
          {['us', 'eu', 'ap', 'sa'].map((r, ri) => (
            <g key={r} transform={`translate(${450 + ri * 110}, 300)`}>
              <rect width={90} height={130} rx={6} fill={colors.PANEL} stroke={colors.GRID} opacity={0.5} />
              <text x={45} y={-8} textAnchor="middle" fill={colors.MUTED} fontSize={11}>{r}</text>
              {Array.from({ length: 8 }, (_, i) => {
                const on = (ri * 8 + i) < 31;
                return <circle key={i} cx={20 + (i % 3) * 25} cy={20 + Math.floor(i / 3) * 30} r={5} fill={on ? colors.WARM : colors.GRID} opacity={on ? 0.9 : 0.3} />;
              })}
            </g>
          ))}
          <text x={640} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">lit one at a time. never all at once.</text>
        </Box>
      );

    case 'b10_decision':
      return (
        <g>
          <Box controlGap={controlGap} x={150} y={195} w={430} h={300} label="hunt the accounts" refrain={false}>
            <circle cx={370} cy={330} r={40} fill="none" stroke={colors.MUTED} strokeWidth={2} />
            <line x1={398} y1={358} x2={430} y2={390} stroke={colors.MUTED} strokeWidth={3} />
            <text x={365} y={440} textAnchor="middle" fill={colors.MUTED} fontSize={13}>extinguish, and they respawn</text>
          </Box>
          <Box controlGap={controlGap} x={700} y={195} w={430} h={300} label="govern the supply" refrain={false}>
            <line x1={760} y1={360} x2={1080} y2={360} stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="6 4" />
            <text x={915} y={340} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>identity valve on the compute itself</text>
          </Box>
        </g>
      );

    case 'b10_hunt':
      return (
        <Box controlGap={controlGap} label="whack-a-mole — the respawns learn camouflage">
          {DOTS.slice(0, 40).map((d, i) => (
            <circle key={i} cx={430 + (i % 10) * 42} cy={280 + Math.floor(i / 10) * 40} r={5}
              fill={i % 5 === 0 ? colors.NEGATIVE : colors.WARM} opacity={i % 3 === 0 ? 0.35 : 0.85} />
          ))}
          <text x={640} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={12}>each one dimmer, harder to tell from the rest</text>
        </Box>
      );

    case 'b10_govern':
      return (
        <Box controlGap={controlGap} label="a plane across the compute landscape">
          {DOTS.slice(0, 50).map((d, i) => {
            const below = (i % 7) < 3;
            return <circle key={i} cx={420 + (i % 12) * 38} cy={280 + Math.floor(i / 12) * 44} r={4} fill={below ? colors.GRID : colors.WARM} opacity={below ? 0.3 : 0.8} />;
          })}
          <line x1={380} y1={360} x2={900} y2={360} stroke={colors.POSITIVE} strokeWidth={2} />
          <text x={640} y={490} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>above the line needs a name to run</text>
        </Box>
      );

    case 'b10_ignore':
      return (
        <Box controlGap={controlGap} label="dashboards look fine">
          {DOTS.slice(0, 31).map((d, i) => (
            <circle key={i} cx={430 + (i % 11) * 38} cy={300 + Math.floor(i / 11) * 40} r={4} fill={colors.WARM} opacity={0.5} />
          ))}
          <rect x={470} y={440} width={340} height={40} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={465} textAnchor="middle" fill={colors.MUTED} fontSize={12}>steady as breathing, behind the ordinary graphs</text>
        </Box>
      );

    case 'b10_sting':
      return (
        <g>
          {/* pull back: the box is one lit rectangle in a continent of grids */}
          {DOTS.map((d, i) => (
            <rect key={i} x={d.x} y={d.y} width={10} height={7} rx={1}
              fill={d.warm ? colors.WARM : colors.GRID} opacity={d.warm ? 0.55 : 0.18} />
          ))}
          <rect x={628} y={330} width={16} height={11} rx={1} fill={colors.ACCENT} />
          <g transform="translate(300, 470)">
            <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} />
            <circle cx={12} cy={11} r={5} fill={colors.WARM} />
            <line x1={40} y1={11} x2={120} y2={11} stroke={colors.WARM} strokeWidth={1} opacity={0.5} />
            <text x={20} y={40} fill={colors.MUTED} fontSize={11}>one switch, one building</text>
          </g>
          <text x={STAGE_W / 2} y={STAGE_H - 40} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic" opacity={0.5}>
            the warm dots are not on your map
          </text>
        </g>
      );

    default:
      return null;
  }
}
