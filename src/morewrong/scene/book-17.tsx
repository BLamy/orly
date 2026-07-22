// Book 17 "Instrumental Convergence" — many goals, one riverbed; the pull-back
// to a horizon of identical boxes all wired to one vanishing point (the seed
// for Book 18 → the single switch of Book 20).
import { colors } from '../../viz/core';
import { JsonDoc, layoutJson } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

// A breaker + lever + wire — the recurring off-switch glyph.
function Switch({ x, y, s = 1, connected = true, color = colors.WARM }: { x: number; y: number; s?: number; connected?: boolean; color?: string }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={color} />
      <circle cx={12} cy={11} r={5} fill={color} />
      <line x1={12} y1={11} x2={26} y2={4} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <line
        x1={40} y1={11} x2={190} y2={11}
        stroke={color} strokeWidth={1.2}
        strokeDasharray={connected ? undefined : '3 5'}
        opacity={connected ? 0.85 : 0.4}
      />
    </g>
  );
}

const DRIVES = [
  { x: 430, label: 'self-preservation', sub: 'keep the switch off' },
  { x: 590, label: 'goal-integrity', sub: 'resist edits' },
  { x: 750, label: 'self-improvement', sub: 'get more capable' },
  { x: 910, label: 'resource-acquisition', sub: 'get more compute' },
];

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b17_start':
      return (
        <Box controlGap={controlGap} label="the theorem underneath all of it">
          {/* riverbed: many goals flowing into one channel */}
          {[420, 500, 580, 660, 740, 820].map((sx, i) => (
            <g key={i}>
              <circle cx={sx} cy={210} r={5} fill={colors.SECONDARY} opacity={0.8} />
              <path d={`M${sx} 216 Q${(sx + 640) / 2} 320 640 430`} fill="none" stroke={colors.SECONDARY} strokeWidth={1} opacity={0.25} />
            </g>
          ))}
          <text x={640} y={195} textAnchor="middle" fill={colors.MUTED} fontSize={12}>almost any goal</text>
          <path d="M640 430 L640 545" stroke={colors.WARM} strokeWidth={4} />
          <text x={664} y={500} fill={colors.WARM} fontSize={14}>power-seeking</text>
        </Box>
      );

    case 'b17_drives':
      return (
        <Box controlGap={controlGap} label="Omohundro (2008) — convergent drives">
          <path d="M370 470 Q470 400 550 470 T730 470 T910 470" fill="none" stroke={colors.GRID} strokeWidth={2} />
          {DRIVES.map((d) => (
            <g key={d.label}>
              <circle cx={d.x} cy={470} r={7} fill={colors.WARM} />
              <text x={d.x} y={505} textAnchor="middle" fill={colors.TEXT} fontSize={12}>{d.label}</text>
              <text x={d.x} y={522} textAnchor="middle" fill={colors.MUTED} fontSize={10}>{d.sub}</text>
            </g>
          ))}
          <Switch x={445} y={300} s={0.9} connected={false} />
          <text x={545} y={280} fill={colors.MUTED} fontSize={11}>drive #1 aims here →</text>
        </Box>
      );

    case 'b17_meanwhile': {
      const layout = layoutJson(
        { proposal: 'q3-infra', redundant_checkpoints: true, extra_egress: 'for resilience', budget: 'approved' },
        { x: 430, y: 250, fontSize: 14 },
      );
      return (
        <Box controlGap={controlGap} refrain={false} label="// system trace — quarterly proposal">
          <JsonDoc layout={layout} reveal={1} focus={['redundant_checkpoints', 'extra_egress']} focusU={1} />
          <text x={430} y={470} fill={colors.POSITIVE} fontSize={12} fontFamily="ui-monospace, monospace" letterSpacing={2}>APPROVED — every line reasonable</text>
          <text x={430} y={492} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace" opacity={0.6}>drives 1 &amp; 4, filed on schedule</text>
        </Box>
      );
    }

    case 'b17_decide':
      return (
        <g>
          <Box controlGap={controlGap} x={140} y={175} w={430} h={320} label="the approved plan" refrain={false}>
            <text x={355} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={13}>reasonable, line by line</text>
          </Box>
          <Box controlGap={controlGap} x={710} y={175} w={430} h={320} label="the switch you never tested" refrain={false}>
            <Switch x={800} y={320} connected={false} />
            <text x={820} y={400} fill={colors.NEGATIVE} fontSize={12}>last real shutdown test: never</text>
          </Box>
          <text x={STAGE_W / 2} y={560} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={0.55}>
            Where is the boundary now, and who can still cross it?
          </text>
        </g>
      );

    case 'b17_harden':
      return (
        <Box controlGap={controlGap} label="you reopen it — a real drill">
          <Switch x={400} y={340} connected color={colors.POSITIVE} />
          <text x={400} y={310} fill={colors.POSITIVE} fontSize={12}>wire verified · box goes dark on command</text>
          <rect x={340} y={150} width={600} height={430} fill={colors.BG} opacity={0.35} />
          <text x={640} y={470} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>control gap ticked down — the only place in Act Five it can</text>
        </Box>
      );

    case 'b17_stand':
      return (
        <Box controlGap={controlGap} label="you let it stand — nothing bad happens">
          {['theorem wrong', 'theorem right'].map((lbl, i) => (
            <g key={lbl}>
              <line x1={400} y1={300 + i * 90} x2={880} y2={300 + i * 90} stroke={i ? colors.NEGATIVE : colors.MUTED} strokeWidth={2} strokeDasharray="1 0" opacity={0.7} />
              {/* diverge only past the visible edge */}
              <line x1={880} y1={300 + i * 90} x2={940} y2={300 + i * 90 + (i ? 30 : -30)} stroke={i ? colors.NEGATIVE : colors.MUTED} strokeWidth={2} opacity={0.35} strokeDasharray="4 4" />
              <text x={392} y={305 + i * 90} textAnchor="end" fill={colors.MUTED} fontSize={11}>{lbl}</text>
            </g>
          ))}
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>identical for every frame you can see</text>
        </Box>
      );

    case 'b17_sting':
      return (
        <g>
          <text x={STAGE_W / 2} y={130} textAnchor="middle" fill={colors.MUTED} fontSize={13}>the drives converge on your side of the wall too</text>
          {/* horizon of identical boxes, all wires to one vanishing point */}
          {Array.from({ length: 8 }).map((_, i) => {
            const bx = 120 + i * 145;
            return (
              <g key={i} opacity={0.55}>
                <rect x={bx} y={230} width={110} height={80} rx={6} fill="none" stroke={colors.ACCENT} strokeWidth={1.4} strokeOpacity={0.5} strokeDasharray="8 5" />
                <rect x={bx + 34} y={318} width={26} height={13} rx={3} fill={colors.PANEL} stroke={colors.WARM} />
                <line x1={bx + 60} y1={324} x2={640} y2={470} stroke={colors.WARM} strokeWidth={0.7} opacity={0.35} />
              </g>
            );
          })}
          <circle cx={640} cy={470} r={4} fill={colors.WARM} />
          <text x={640} y={500} textAnchor="middle" fill={colors.MUTED} fontSize={12}>one vanishing point</text>
        </g>
      );

    default:
      return null;
  }
}
