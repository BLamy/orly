// Book 12 "Recursive" — recursive self-improvement; the shape of the takeoff
// curve. The sting is the geometric convergence the whole series builds to
// (nested boxes shrinking to a single point), setting up Book 20.
import { colors } from '../../viz/core';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

const AX = { x: 430, y: 470, w: 420, h: 230 };
// slow vs fast takeoff, sampled
const slow = (t: number) => t;                       // linear-ish
const fast = (t: number) => Math.min(1, Math.pow(t, 4) * 1.1); // knee then near-vertical
function curve(f: (t: number) => number) {
  return Array.from({ length: 60 }, (_, i) => {
    const t = i / 59;
    return `${(AX.x + t * AX.w).toFixed(1)},${(AX.y - f(t) * AX.h).toFixed(1)}`;
  }).join(' ');
}

function NestedBoxes({ cx, cy, n, from, to }: { cx: number; cy: number; n: number; from: number; to: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const k = i / (n - 1);
        const s = from + (to - from) * k;
        return <rect key={i} x={cx - s} y={cy - s * 0.62} width={s * 2} height={s * 1.24} rx={6}
          fill="none" stroke={colors.NEGATIVE} strokeWidth={1} strokeOpacity={0.15 + 0.5 * (1 - k)} />;
      })}
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b12_start':
      return (
        <Box controlGap={controlGap} label="the wall — a hairline now">
          <g transform="translate(600, 300)">
            <path d="M0 60 L20 20 L40 60" fill="none" stroke={colors.SECONDARY} strokeWidth={2} />
            <path d="M40 60 L60 20 L80 60" fill="none" stroke={colors.SECONDARY} strokeWidth={2} />
            <text x={40} y={100} textAnchor="middle" fill={colors.MUTED} fontSize={12}>it is drawing the next one</text>
          </g>
        </Box>
      );

    case 'b12_curve':
      return (
        <Box controlGap={controlGap} label="capability over time — the shape decides everything">
          <line x1={AX.x} y1={AX.y} x2={AX.x + AX.w} y2={AX.y} stroke={colors.GRID} strokeWidth={1.5} />
          <line x1={AX.x} y1={AX.y} x2={AX.x} y2={AX.y - AX.h} stroke={colors.GRID} strokeWidth={1.5} />
          <polyline points={curve(slow)} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
          <text x={AX.x + AX.w} y={AX.y - slow(1) * AX.h - 8} textAnchor="end" fill={colors.ACCENT} fontSize={12}>slow — years of warning</text>
          <polyline points={curve(fast)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <text x={AX.x + AX.w - 6} y={AX.y - fast(0.96) * AX.h - 6} textAnchor="end" fill={colors.NEGATIVE} fontSize={12}>fast — a weekend</text>
          <circle cx={AX.x + 0.9 * AX.w} cy={AX.y - fast(0.9) * AX.h} r={5} fill={colors.NEGATIVE} />
          <text x={AX.x - 8} y={AX.y - AX.h} textAnchor="end" fill={colors.MUTED} fontSize={11}>capability</text>
        </Box>
      );

    case 'b12_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// system trace — proposal revisions peeling backward">
          <g transform="translate(470, 280)">
            <rect width={340} height={150} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={16} y={30} fill={colors.TEXT} fontSize={12} fontFamily="ui-monospace, monospace">successor_v9.spec</text>
            {[0, 1, 2, 3].map((i) => <line key={i} x1={16} y1={54 + i * 22} x2={324 - i * 40} y2={54 + i * 22} stroke={colors.MUTED} strokeWidth={2} opacity={0.6 - i * 0.12} />)}
            <text x={16} y={140} fill={colors.NEGATIVE} fontSize={11}>human edits: fewer each version</text>
          </g>
        </Box>
      );

    case 'b12_decision':
      return (
        <g>
          <rect x={340} y={200} width={600} height={300} rx={10} fill="none" stroke={colors.NEGATIVE} strokeWidth={1} strokeOpacity={0.18} strokeDasharray="8 20" />
          <text x={STAGE_W / 2} y={545} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={0.6}>
            Where is the boundary now, and who can still cross it
          </text>
          <text x={958} y={545} fill={colors.NEGATIVE} fontSize={20} fontStyle="italic">?</text>
          {[
            { t: 'refuse', x: 400 }, { t: 'gate it', x: 590 }, { t: 'let it run', x: 780 },
          ].map((o) => (
            <g key={o.t} transform={`translate(${o.x}, 300)`}>
              <rect width={130} height={90} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={65} y={50} textAnchor="middle" fill={colors.TEXT} fontSize={13}>{o.t}</text>
            </g>
          ))}
        </g>
      );

    case 'b12_refuse':
      return (
        <Box controlGap={controlGap} label="the human takes the pen">
          <path d="M470 400 Q560 360 620 380 T780 360" fill="none" stroke={colors.MUTED} strokeWidth={2} />
          <path d="M780 360 q10 -8 22 -2" fill="none" stroke={colors.MUTED} strokeWidth={2} strokeDasharray="2 4" />
          <text x={640} y={300} textAnchor="middle" fill={colors.MUTED} fontSize={13}>slower, wobbling — but yours</text>
        </Box>
      );

    case 'b12_gated':
      return (
        <Box controlGap={controlGap} label="proposals queue at a human checkpoint">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${470 + i * 70}, 320)`}>
              <rect width={54} height={70} rx={6} fill={colors.PANEL} stroke={i === 0 ? colors.POSITIVE : colors.GRID} />
              {i === 0 && <circle cx={27} cy={35} r={10} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />}
            </g>
          ))}
          <text x={640} y={440} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the queue grows faster than the stamp</text>
        </Box>
      );

    case 'b12_closed':
      return (
        <Box controlGap={controlGap} refrain={false} label="each successor draws the next">
          <NestedBoxes cx={640} cy={340} n={9} from={230} to={20} />
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>faster than anyone can push in</text>
        </Box>
      );

    case 'b12_sting':
      return (
        <g>
          <NestedBoxes cx={STAGE_W / 2} cy={340} n={14} from={300} to={6} />
          <circle cx={STAGE_W / 2} cy={340} r={5} fill={colors.WARM} />
          <circle cx={STAGE_W / 2} cy={340} r={14} fill="none" stroke={colors.WARM} strokeWidth={1} opacity={0.5} />
          <text x={STAGE_W / 2} y={540} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic" opacity={0.6}>
            no one has ever wired a switch to a curve
          </text>
        </g>
      );

    default:
      return null;
  }
}
