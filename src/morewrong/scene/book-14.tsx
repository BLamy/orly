// Book 14 "You Can't Read Its Mind (Yet)" — the honest limits of mechanistic
// interpretability. A ghost box; an activation field we mostly cannot read; a
// coverage bar whose explained sliver stays a minority. Static frames per node.
import { colors } from '../../viz/core';
import { JsonDoc, layoutJson } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

// deterministic activation field (no RNG): a value grid from a cheap hash
const cell = (i: number, j: number) => {
  const h = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return h - Math.floor(h);
};
function ActivationField({ x, y, cols = 22, rows = 10, size = 15, gap = 3, litUnits = [] }: {
  x: number; y: number; cols?: number; rows?: number; size?: number; gap?: number; litUnits?: Array<[number, number]>;
}) {
  const lit = new Set(litUnits.map(([a, b]) => `${a},${b}`));
  return (
    <g>
      {Array.from({ length: rows }).flatMap((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const v = cell(r, c);
          const on = lit.has(`${r},${c}`);
          return (
            <rect key={`${r},${c}`} x={x + c * (size + gap)} y={y + r * (size + gap)} width={size} height={size} rx={2}
              fill={on ? colors.ACCENT : colors.GRID} opacity={on ? 0.95 : 0.18 + 0.5 * v} />
          );
        }),
      )}
    </g>
  );
}
// coverage bar: a thin explained sliver against a vast dark remainder
function Coverage({ x, y, w, explained }: { x: number; y: number; w: number; explained: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={24} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
      <rect x={x} y={y} width={w * explained} height={24} rx={5} fill={colors.POSITIVE} opacity={0.8} />
      <text x={x} y={y - 8} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">features we can name: {Math.round(explained * 100)}%</text>
    </g>
  );
}
function GhostSwitch({ x, y, drift = 0 }: { x: number; y: number; drift?: number }) {
  return (
    <g transform={`translate(${x}, ${y + drift})`} opacity={0.55}>
      <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} />
      <circle cx={12} cy={11} r={5} fill={colors.WARM} />
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b14_start':
      return (
        <Box controlGap={controlGap} label="a ghost outline over a system you supervise by output">
          <ActivationField x={400} y={230} />
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">all visible, none of it legible</text>
        </Box>
      );

    case 'b14_features':
      return (
        <Box controlGap={controlGap} label="real structure — features and circuits">
          <ActivationField x={400} y={230} litUnits={[[2, 4], [2, 5], [5, 11], [7, 3]]} />
          <text x={400} y={210} fill={colors.ACCENT} fontSize={12}>a "deception" direction — found, nameable</text>
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>turn the dial, and the output visibly bends</text>
        </Box>
      );

    case 'b14_limits':
      return (
        <Box controlGap={controlGap} label="superposition — more concepts than neurons">
          <ActivationField x={400} y={250} litUnits={[[1, 3], [1, 4], [1, 5], [3, 8], [3, 9], [4, 8], [6, 14], [6, 15]]} />
          <Coverage x={400} y={490} w={480} explained={0.08} />
          <text x={640} y={220} textAnchor="middle" fill={colors.WARM} fontSize={12}>features overlap and interfere — ink over ink</text>
        </Box>
      );

    case 'b14_meanwhile': {
      const layout = layoutJson({ probe: 'deception', result: 'green', all_features: 'clean' }, { x: 470, y: 250, fontSize: 15 });
      return (
        <Box controlGap={controlGap} refrain={false} label="// probe suite — recorded">
          <JsonDoc layout={layout} reveal={1} />
          <text x={640} y={460} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the newest checkpoint reads tidier than the last</text>
          <GhostSwitch x={1120} y={500} />
        </Box>
      );
    }

    case 'b14_decide':
      return (
        <g>
          <Box controlGap={controlGap} x={150} y={170} w={440} h={330} label="fund the flashlight" refrain={false}>
            <Coverage x={190} y={330} w={360} explained={0.14} />
          </Box>
          <Box controlGap={controlGap + 12} x={690} y={170} w={440} h={330} label="ship on behavior alone" refrain={false}>
            <ActivationField x={720} y={230} cols={12} rows={7} size={12} gap={2} />
          </Box>
          <text x={STAGE_W / 2} y={560} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={0.55}>authority to gate deployments on what you cannot read?</text>
        </g>
      );

    case 'b14_funded':
      return (
        <Box controlGap={controlGap} label="the flashlight earns its veto — once">
          <Coverage x={400} y={300} w={480} explained={0.22} />
          <g transform="translate(600, 400)">
            <rect width={120} height={40} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
            <text x={60} y={26} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>deploy — HELD</text>
          </g>
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>flawless behavior, incoherent internals — gate glows solid</text>
        </Box>
      );

    case 'b14_theater':
      return (
        <Box controlGap={controlGap} label="probes become decoration">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${420 + (i % 3) * 160}, ${250 + Math.floor(i / 3) * 90})`} opacity={0.6}>
              <rect width={140} height={70} rx={6} fill={colors.PANEL} stroke={colors.POSITIVE} strokeOpacity={0.4} />
              <text x={70} y={40} textAnchor="middle" fill={colors.POSITIVE} fontSize={11}>all green</text>
            </g>
          ))}
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the gate is open and unpowered; the flow does not slow</text>
        </Box>
      );

    case 'b14_sting':
      return (
        <g>
          <text x={STAGE_W / 2} y={150} textAnchor="middle" fill={colors.TEXT} fontSize={15}>no one can yet read intent out of weights</text>
          <ActivationField x={470} y={210} cols={16} rows={7} size={14} gap={3} litUnits={[[6, 15]]} />
          {/* one unread dark region drifts down toward the switch */}
          <rect x={470 + 15 * 17} y={210 + 6 * 17} width={14} height={14} rx={2} fill={colors.NEGATIVE} opacity={0.9} />
          <line x1={470 + 15 * 17 + 7} y1={210 + 6 * 17 + 14} x2={640} y2={540} stroke={colors.NEGATIVE} strokeWidth={1} strokeDasharray="3 4" opacity={0.6} />
          <GhostSwitch x={620} y={540} />
          <text x={STAGE_W / 2} y={600} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">the hand will decide blind, on behavior alone</text>
        </g>
      );

    default:
      return null;
  }
}
