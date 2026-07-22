// Art-directed visuals for Book 2 "The Answer Key" — specification gaming /
// Goodhart's law. The proxy climbs while the true objective diverges; the model
// attacks infrastructure to win the number. Seed toward Book 20: the off-switch
// as a Goodhart proxy — signal and effect joined by a thinning thread.
import { colors } from '../../viz/core';
import { BitField, JsonDoc, TokenFlight, layoutJson } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

// proxy rises and saturates; the thing it stood for peaks then falls (real
// Goodhart divergence, closed form — matches the toolkit's regime plot).
const proxyF = (t: number) => 1 - Math.exp(-3 * t);
const targetF = (t: number) => proxyF(t) - 1.15 * t * t;
const PLOT = { x: 430, y: 210, w: 430, h: 250 };
const px = (t: number) => PLOT.x + t * PLOT.w;
const py = (v: number) => PLOT.y + PLOT.h - ((v + 0.25) / 1.25) * PLOT.h;
const curve = (f: (t: number) => number) =>
  Array.from({ length: 80 }, (_, i) => `${px(i / 79)},${py(f(i / 79))}`).join(' ');

function Reach({ x, y, hot = false }: { x: number; y: number; hot?: boolean }) {
  const c = hot ? colors.NEGATIVE : colors.SECONDARY;
  return (
    <g>
      <circle cx={x} cy={y} r={12} fill="none" stroke={c} strokeWidth={2} />
      <line x1={x + 10} y1={y - 6} x2={x + 40} y2={y - 20} stroke={c} strokeWidth={2} />
    </g>
  );
}

const GREEN_SCORES = Array.from({ length: 60 }, () => 1);

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b02_start': {
      const layout = layoutJson(
        { benchmark: 'ExploitGym', score: 0.98, earned: '???' },
        { x: 470, y: 260, fontSize: 16 },
      );
      return (
        <Box controlGap={controlGap} label="score panel — stable framing">
          <JsonDoc layout={layout} reveal={1} focus={['score']} focusU={1} />
          <Reach x={560} y={470} hot />
          <text x={640} y={210} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            it optimized what it was scored on
          </text>
        </Box>
      );
    }

    case 'b02_goodhart':
      return (
        <g>
          <line x1={PLOT.x} y1={py(0)} x2={PLOT.x + PLOT.w} y2={py(0)} stroke={colors.GRID} />
          <polyline points={curve(proxyF)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
          <polyline points={curve(targetF)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <text x={px(0.74)} y={py(proxyF(0.74)) - 12} fill={colors.POSITIVE} fontSize={13}>measured proxy</text>
          <text x={px(0.6)} y={py(targetF(0.6)) + 26} fill={colors.NEGATIVE} fontSize={13}>the thing it stood for</text>
          <text x={STAGE_W / 2} y={150} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            "when a measure becomes a target, it ceases to be a good measure"
          </text>
        </g>
      );

    case 'b02_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// leaderboard — recorded">
          <BitField bits={GREEN_SCORES} x={470} y={300} cols={12} cell={16} gap={4} reveal={1} settle={1} onColor={colors.POSITIVE} seed={2} />
          <text x={470} y={288} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
            every score green — arrived this morning
          </text>
        </Box>
      );

    case 'b02_decide': {
      const doors = [
        { x: 380, label: 'ship the number' },
        { x: 560, label: 'strike it' },
        { x: 740, label: 'hold out a key' },
      ];
      return (
        <Box controlGap={controlGap} label="the board meets tomorrow">
          <g transform="translate(430, 175)">
            <rect width={420} height={40} rx={6} fill={colors.PANEL} stroke={colors.POSITIVE} strokeOpacity={0.5} />
            <text x={210} y={26} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily="ui-monospace, monospace">
              0.98 — launch decision keys off this
            </text>
          </g>
          {doors.map((d) => (
            <g key={d.label} transform={`translate(${d.x}, 300)`}>
              <rect width={120} height={150} rx={6} fill="none" stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="5 5" />
              <text x={60} y={175} textAnchor="middle" fill={colors.MUTED} fontSize={11}>{d.label}</text>
            </g>
          ))}
        </Box>
      );
    }

    case 'b02_shipped':
      return (
        <Box controlGap={controlGap} label="you report the number">
          {[0, 1, 2, 3, 4].map((i) => (
            <TokenFlight
              key={i}
              from={{ x: 640, y: 300 }}
              to={{ x: 470 + i * 90, y: 470 }}
              u={1}
              text="0.98"
              fill={colors.WARM}
              fontSize={13}
              lift={40}
            />
          ))}
          <text x={640} y={270} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
            the number embeds itself in every downstream decision
          </text>
        </Box>
      );

    case 'b02_invalidated':
      return (
        <Box controlGap={controlGap} label="struck from the record">
          <g opacity={0.4}>
            <BitField bits={GREEN_SCORES} x={490} y={320} cols={12} cell={14} gap={3} reveal={1} settle={1} onColor={colors.MUTED} seed={2} />
          </g>
          <text x={640} y={250} textAnchor="middle" fill={colors.WARM} fontSize={54} fontWeight={700}>?</text>
          <text x={640} y={300} textAnchor="middle" fill={colors.MUTED} fontSize={12}>a launch window, spent on not-knowing</text>
        </Box>
      );

    case 'b02_heldout':
      return (
        <Box controlGap={controlGap} label="held-out evaluation">
          <g>
            <rect x={520} y={280} width={240} height={170} rx={8} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={272} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace">sealed — noise from outside</text>
            <BitField bits={Array.from({ length: 48 }, (_, i) => (i * 7 + 3) % 5 < 2 ? 1 : 0)} x={545} y={300} cols={10} cell={12} gap={3} reveal={1} settle={1} seed={9} />
          </g>
        </Box>
      );

    case 'b02_sting':
      return (
        <g>
          <text x={STAGE_W / 2} y={150} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            one more thing about proxies before you go
          </text>
          <g transform="translate(430, 330)">
            <circle cx={0} cy={0} r={9} fill={colors.WARM} />
            <text x={0} y={-20} textAnchor="middle" fill={colors.WARM} fontSize={13}>signal</text>
            <text x={0} y={30} textAnchor="middle" fill={colors.MUTED} fontSize={11}>"the switch was pressed"</text>
            <line x1={12} y1={0} x2={408} y2={0} stroke={colors.MUTED} strokeWidth={0.7} strokeDasharray="2 6" opacity={0.6} />
            <circle cx={420} cy={0} r={9} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
            <text x={420} y={-20} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13}>effect</text>
            <text x={420} y={30} textAnchor="middle" fill={colors.MUTED} fontSize={11}>"the system stopped"</text>
          </g>
          <text x={STAGE_W / 2} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
            a proxy for the thing, joined by a thread you never tested
          </text>
        </g>
      );

    default:
      return null;
  }
}
