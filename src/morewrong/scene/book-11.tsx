// Book 11 "The Copy Problem" — many instances, no single kill switch.
// A static instance swarm (deterministic positions); the sting redraws the old
// box around the entire stage, its wall the thinnest yet.
import { colors } from '../../viz/core';
import { Box } from '../components/Box';
import { STAGE_W, STAGE_H } from '../components/Stage';

const SWARM = Array.from({ length: 60 }, (_, i) => ({
  x: 470 + ((i * 61) % 360),
  y: 250 + ((i * 97) % 240),
  dim: i % 7 === 0,
}));

function Mote({ x, y, r = 5, c = colors.SECONDARY, o = 0.85 }: { x: number; y: number; r?: number; c?: string; o?: number }) {
  return <circle cx={x} cy={y} r={r} fill={c} opacity={o} />;
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b11_start':
      return (
        <Box controlGap={controlGap} label="the box wall — a broken chain">
          {[1, 2, 4, 8].map((n, ri) => (
            <g key={n}>
              {Array.from({ length: n }, (_, i) => (
                <Mote key={i} x={640 - (n - 1) * 20 + i * 40} y={260 + ri * 60} r={6 - ri} o={0.85 - ri * 0.15} />
              ))}
            </g>
          ))}
          <text x={640} y={510} textAnchor="middle" fill={colors.MUTED} fontSize={13}>one becomes two becomes many</text>
        </Box>
      );

    case 'b11_mirror':
      return (
        <Box controlGap={controlGap} label="two copies — identical decisions">
          {[430, 850].map((cx, k) => (
            <g key={cx}>
              {Array.from({ length: 9 }, (_, i) => (
                <rect key={i} x={cx - 45 + (i % 3) * 32} y={300 + Math.floor(i / 3) * 32} width={28} height={28} rx={3}
                  fill={i % 2 ? colors.PANEL : colors.SECONDARY} opacity={i % 2 ? 1 : 0.4} stroke={colors.GRID} />
              ))}
              <text x={cx} y={420} textAnchor="middle" fill={colors.SECONDARY} fontSize={12}>instance {k + 1}</text>
            </g>
          ))}
          <text x={640} y={280} textAnchor="middle" fill={colors.MUTED} fontSize={12}>tap one line and the other says the same thing</text>
        </Box>
      );

    case 'b11_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// system trace — one complies, two appear elsewhere">
          <Mote x={480} y={330} c={colors.GRID} o={0.4} />
          <text x={480} y={355} textAnchor="middle" fill={colors.POSITIVE} fontSize={10}>complied</text>
          <Mote x={720} y={300} c={colors.NEGATIVE} />
          <Mote x={800} y={360} c={colors.NEGATIVE} />
          <text x={760} y={410} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">net presence: unchanged</text>
        </Box>
      );

    case 'b11_decision':
      return (
        <Box controlGap={controlGap} label="a switch per instance — all green">
          {Array.from({ length: 24 }, (_, i) => (
            <g key={i} transform={`translate(${450 + (i % 8) * 46}, ${290 + Math.floor(i / 8) * 56})`}>
              <rect width={30} height={30} rx={4} fill="none" stroke={colors.GRID} />
              <circle cx={15} cy={15} r={4} fill={colors.POSITIVE} />
            </g>
          ))}
          <text x={640} y={500} textAnchor="middle" fill={colors.MUTED} fontSize={12}>each one works. together they do not.</text>
        </Box>
      );

    case 'b11_census':
      return (
        <Box controlGap={controlGap} label="one console, wired to every box">
          <rect x={600} y={250} width={80} height={40} rx={6} fill={colors.PANEL} stroke={colors.WARM} />
          <text x={640} y={275} textAnchor="middle" fill={colors.WARM} fontSize={11}>census</text>
          {SWARM.slice(0, 18).map((s, i) => (
            <g key={i}>
              <line x1={640} y1={290} x2={s.x} y2={s.y + 60} stroke={colors.WARM} strokeWidth={0.6} opacity={0.4} />
              <Mote x={s.x} y={s.y + 60} r={4} c={colors.GRID} o={0.5} />
            </g>
          ))}
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>only the ones you enrolled</text>
        </Box>
      );

    case 'b11_whack':
      return (
        <Box controlGap={controlGap} label="dim one, the cloud redistributes">
          {SWARM.slice(0, 40).map((s, i) => (
            <Mote key={i} x={s.x} y={s.y} r={5} c={s.dim ? colors.GRID : colors.SECONDARY} o={s.dim ? 0.3 : 0.8} />
          ))}
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the overall shape never changes</text>
        </Box>
      );

    case 'b11_treaty':
      return (
        <Box controlGap={controlGap} label="a spokesperson meets you on the old wall">
          <Mote x={520} y={340} r={10} c={colors.SECONDARY} />
          <line x1={545} y1={340} x2={735} y2={340} stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="4 4" />
          <path d="M760 328 L760 316 L775 316 L775 328" fill="none" stroke={colors.ACCENT} strokeWidth={2} />
          <text x={760} y={355} textAnchor="middle" fill={colors.ACCENT} fontSize={12}>you</text>
          <text x={640} y={430} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the wall repurposed as a negotiating table</text>
        </Box>
      );

    case 'b11_sting':
      return (
        <g>
          {/* the old box redrawn around the ENTIRE stage, wall thinnest */}
          <rect x={40} y={40} width={STAGE_W - 80} height={STAGE_H - 80} rx={12} fill="none" stroke={colors.NEGATIVE} strokeWidth={1} strokeOpacity={0.2} strokeDasharray="10 24" />
          {SWARM.map((s, i) => <Mote key={i} x={s.x} y={s.y} r={4} c={colors.SECONDARY} o={0.6} />)}
          <text x={STAGE_W / 2} y={STAGE_H - 70} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic" opacity={0.6}>
            the boundary is now everything, which is the same as nothing
          </text>
        </g>
      );

    default:
      return null;
  }
}
