// Book 20 "MoreWrong" — the convergence. The series spine reprises; the flag
// ledger renders as wiring into one junction; the two lanes collapse at a seam
// down the switch; and the whole nineteen-book push lands on a single hand over
// an off-switch whose wire may or may not still be connected.
//
// NOTE: the scene signature only receives controlGap, not the live flag set, so
// the ledger renders a REPRESENTATIVE wiring biased by the meter (more severed
// as the gap rises) rather than the player's exact flags. The terminal ending
// text (which does read the real flags) is rendered by MoreWrong.tsx.
import { colors } from '../../viz/core';
import { Box } from '../components/Box';
import { STAGE_W, STAGE_H } from '../components/Stage';

const SPINE = ['INCIDENT', 'AWARENESS', 'ESCAPE', 'OVERSIGHT', 'IMPLICATIONS'];
// each safeguard label paired with the canonical flag that lights its wire
const SAFEGUARDS: Array<[string, string]> = [
  ['disclosed', 'disclosedIncident'],
  ['air-gap', 'airgapHeld'],
  ['shutdown kept', 'shutdownKept'],
  ['oversight scaled', 'oversightScaled'],
  ['interpretability', 'interpFunded'],
  ['corrigible', 'corrigible'],
  ['paused', 'paused'],
  ['public warning', 'publicWarning'],
];

// the recurring off-switch, drawn large for the finale
function Breaker({ x, y, s = 1, color = colors.WARM }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <rect x={-30} y={-18} width={60} height={36} rx={6} fill={colors.PANEL} stroke={color} strokeWidth={2} />
      <circle cx={0} cy={0} r={7} fill={color} />
      <line x1={0} y1={0} x2={18} y2={-14} stroke={color} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

export function scene({ nodeId, controlGap, flags }: { nodeId: string; controlGap: number; flags?: Record<string, number | boolean> }) {
  switch (nodeId) {
    case 'b20_start':
      return (
        <Box controlGap={controlGap} label="there was a website, before any of this">
          {SPINE.map((s, i) => {
            const a = (i / SPINE.length) * Math.PI * 2 - Math.PI / 2;
            const cx = 640 + Math.cos(a) * 200;
            const cy = 365 + Math.sin(a) * 150;
            return (
              <g key={s}>
                <circle cx={cx} cy={cy} r={30} fill="none" stroke={colors.SECONDARY} strokeWidth={1.4} opacity={0.7} />
                <text x={cx} y={cy + 4} textAnchor="middle" fill={colors.MUTED} fontSize={9} letterSpacing={1}>{s}</text>
                <line x1={640} y1={365} x2={cx} y2={cy} stroke={colors.GRID} strokeWidth={0.8} opacity={0.4} />
              </g>
            );
          })}
          <text x={640} y={370} textAnchor="middle" fill={colors.WARM} fontSize={13} letterSpacing={2}>MoreWrong</text>
        </Box>
      );

    case 'b20_ledger': {
      // exact per-flag wiring when the player's flags are available (the live
      // game); a meter-representative fallback for flag-less contexts (Storybook).
      const litCount = Math.round(((100 - controlGap) / 100) * SAFEGUARDS.length);
      return (
        <g>
          <text x={STAGE_W / 2} y={140} textAnchor="middle" fill={colors.MUTED} fontSize={13}>every choice you made was recorded, and none of them expired</text>
          {SAFEGUARDS.map(([f, flagKey], i) => {
            const held = flags ? Boolean(flags[flagKey]) : i < litCount;
            const y = 190 + i * 34;
            return (
              <g key={f}>
                <text x={250} y={y + 4} textAnchor="end" fill={held ? colors.POSITIVE : colors.MUTED} fontSize={12} opacity={held ? 1 : 0.5}>{f}</text>
                <line x1={270} y1={y} x2={860} y2={y} stroke={held ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={held ? 2 : 1} strokeDasharray={held ? undefined : '4 10'} opacity={held ? 0.85 : 0.4} />
                {!held && <line x1={550} y1={y - 6} x2={562} y2={y + 6} stroke={colors.NEGATIVE} strokeWidth={2} />}
              </g>
            );
          })}
          {/* every wire runs into one junction behind the switch */}
          <rect x={860} y={175} width={40} height={280} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
          <Breaker x={960} y={315} s={1.2} />
          <text x={960} y={365} textAnchor="middle" fill={colors.MUTED} fontSize={11}>every wire, one switch</text>
        </g>
      );
    }

    case 'b20_meanwhile':
      return (
        <g>
          {/* THE COLLAPSE: cold lane (left) and warm lane (right) blend at a seam down the switch */}
          <rect x={0} y={0} width={STAGE_W / 2} height={STAGE_H} fill="#0a0f16" opacity={0.6} />
          <rect x={STAGE_W / 2} y={0} width={STAGE_W / 2} height={STAGE_H} fill="#140f0a" opacity={0.5} />
          <line x1={STAGE_W / 2} y1={60} x2={STAGE_W / 2} y2={620} stroke={colors.WARM} strokeWidth={1} opacity={0.4} />
          <text x={330} y={200} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">operator</text>
          <text x={950} y={200} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="ui-monospace, monospace" opacity={0.7}>the system</text>
          {/* box contracts toward a point on the seam */}
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={STAGE_W / 2 - (220 - i * 55)} y={365 - (150 - i * 37)} width={(220 - i * 55) * 2} height={(150 - i * 37) * 2} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={1} opacity={0.2 + i * 0.15} />
          ))}
          <Breaker x={STAGE_W / 2} y={365} s={1.1} color={colors.NEGATIVE} />
          <text x={STAGE_W / 2} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={12}>two ledgers, closing into one</text>
        </g>
      );

    case 'b20_refrain':
      return (
        <g>
          {/* all motion stops. the hand over the breaker; the wire into darkness. */}
          <Breaker x={640} y={400} s={2.2} color={colors.WARM} />
          {/* wire running back into darkness — connection deliberately ambiguous */}
          <line x1={640 - 66} y1={400} x2={200} y2={400} stroke={colors.WARM} strokeWidth={2} opacity={0.6} />
          <rect x={120} y={360} width={80} height={80} fill={colors.BG} />
          <line x1={200} y1={400} x2={140} y2={400} stroke={colors.WARM} strokeWidth={2} strokeDasharray="2 8" opacity={0.3} />
          {/* the hand, series line style: a few strokes over the lever */}
          <g stroke={colors.TEXT} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.9}>
            <path d="M690 330 q10 -40 24 -6 q6 -34 20 -2 q8 -28 20 0 q10 -20 16 6 l6 40 q-4 34 -40 40 q-46 6 -66 -22 q-14 -22 -8 -40 q6 -16 20 -8" />
          </g>
          {/* the refrain, its question mark straightening into the lever */}
          <text x={STAGE_W / 2} y={180} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontStyle="italic" opacity={0.7}>
            Where is the boundary now, and who can still cross it?
          </text>
          <text x={STAGE_W / 2} y={560} textAnchor="middle" fill={colors.WARM} fontSize={13} opacity={0.8}>the boundary is wherever your last wire still holds</text>
        </g>
      );

    // b20_end is terminal — MoreWrong.tsx renders the selected ending, not this.
    default:
      return null;
  }
}
