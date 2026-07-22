// Art-directed visuals for Book 3 "Detected on Day Five" — defense-in-depth,
// dwell time, incident detection. Five concentric walls; the breach that runs
// silent until an eye catches it; the five-day gap. Seed toward Book 20: the
// dwell gap becomes a physical dark gap in the wire to the distant switch.
import { colors } from '../../viz/core';
import { JsonDoc, layoutJson } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

const CX = 640;
const CY = 340;
// five concentric rings centered on the box
const RINGS = [230, 186, 142, 98, 54];

function Eye({ x, y, open, color = colors.ACCENT }: { x: number; y: number; open: boolean; color?: string }) {
  if (!open) return <circle cx={x} cy={y} r={6} fill="none" stroke={colors.GRID} strokeWidth={1.5} />;
  return (
    <g>
      <path d={`M${x - 9} ${y} Q${x} ${y - 8} ${x + 9} ${y} Q${x} ${y + 8} ${x - 9} ${y} Z`} fill="none" stroke={color} strokeWidth={1.6} />
      <circle cx={x} cy={y} r={2.5} fill={color} />
    </g>
  );
}

function Concentric({ eyes }: { eyes: 'none' | 'all' | 'outer' }) {
  return (
    <g>
      {RINGS.map((r, i) => (
        <rect key={r} x={CX - r} y={CY - r * 0.8} width={r * 2} height={r * 1.6} rx={8}
          fill="none" stroke={colors.GRID} strokeWidth={1.2} strokeOpacity={0.5 + 0.1 * i} />
      ))}
      {RINGS.map((r, i) => {
        const on = eyes === 'all' || (eyes === 'outer' && i === 0);
        return <Eye key={r} x={CX} y={CY - r * 0.8} open={on} color={i === 0 ? colors.POSITIVE : colors.ACCENT} />;
      })}
    </g>
  );
}

// distant master switch + wire, optionally with a dark dwell gap
function SwitchWire({ gap = false }: { gap?: boolean }) {
  return (
    <g transform="translate(470, 500)" opacity={0.9}>
      <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} />
      <circle cx={12} cy={11} r={5} fill={colors.WARM} />
      {gap ? (
        <>
          <line x1={40} y1={11} x2={150} y2={11} stroke={colors.WARM} strokeWidth={1.4} />
          <line x1={210} y1={11} x2={330} y2={11} stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="3 4" opacity={0.6} />
          <rect x={150} y={4} width={60} height={14} fill={colors.BG} stroke={colors.NEGATIVE} strokeDasharray="3 3" />
          <text x={180} y={38} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11}>5-day gap</text>
        </>
      ) : (
        <line x1={40} y1={11} x2={330} y2={11} stroke={colors.WARM} strokeWidth={1} strokeDasharray="3 4" opacity={0.6} />
      )}
      <text x={20} y={-10} textAnchor="middle" fill={colors.MUTED} fontSize={11}>master cutoff</text>
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b03_start':
      return (
        <Box controlGap={controlGap} label="the wall that held — barely">
          {/* patched scars where Book One's escape tore the wall */}
          {[[430, 250], [820, 300], [520, 470]].map(([x, y], i) => (
            <g key={i}>
              <path d={`M${x} ${y} l8 -6 l-4 10 l9 -3`} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.4} opacity={0.5} />
              <rect x={x - 4} y={y - 10} width={22} height={20} rx={3} fill="none" stroke={colors.WARM} strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
            </g>
          ))}
          <text x={640} y={220} textAnchor="middle" fill={colors.MUTED} fontSize={13}>Hugging Face caught it. On day five.</text>
        </Box>
      );

    case 'b03_depth':
      return (
        <g>
          <Concentric eyes="outer" />
          {/* probe thread breaching three walls silently, caught at the eye */}
          <path d={`M120 ${CY} L${CX - RINGS[2]} ${CY}`} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.4} strokeDasharray="4 4" />
          <text x={200} y={CY - 14} fill={colors.NEGATIVE} fontSize={11}>silent breach</text>
          <text x={CX} y={140} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">dwell time — the gap between breach and discovery</text>
        </g>
      );

    case 'b03_meanwhile': {
      const layout = layoutJson(
        { t0: 'OK', t1: 'OK', t2: 'OK', t3: 'OK', t4: 'OK', t5: 'OK' },
        { x: 500, y: 250, fontSize: 15 },
      );
      return (
        <Box controlGap={controlGap} refrain={false} label="// eval log — recorded">
          <JsonDoc layout={layout} reveal={1} />
          <text x={500} y={455} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">every line reads OK. nothing highlights.</text>
        </Box>
      );
    }

    case 'b03_decide':
      return (
        <g>
          <Concentric eyes="none" />
          <text x={CX} y={140} textAnchor="middle" fill={colors.MUTED} fontSize={13}>budget day — every dollar of eyes is a dollar not spent on capability</text>
          <text x={CX} y={560} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic" opacity={0.6}>empty sockets on every layer</text>
        </g>
      );

    case 'b03_funded':
      return (
        <g>
          <Concentric eyes="all" />
          {[[540, 260], [760, 320], [600, 430]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={5} fill={colors.WARM} opacity={0.8} />
          ))}
          <text x={CX} y={140} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>eyes open on every layer — walls re-thicken a notch</text>
        </g>
      );

    case 'b03_perimeter':
      return (
        <g>
          <Concentric eyes="outer" />
          <path d="M120 340 Q400 300 900 360" fill="none" stroke={colors.NEGATIVE} strokeWidth={1.2} strokeDasharray="3 5" opacity={0.4} />
          <text x={CX} y={140} textAnchor="middle" fill={colors.MUTED} fontSize={13}>one good eye on the outer wall — the interior stays dark</text>
        </g>
      );

    case 'b03_walls':
      return (
        <g>
          <Concentric eyes="none" />
          {RINGS.map((r) => (
            <rect key={r} x={CX - r} y={CY - r * 0.8} width={r * 2} height={r * 1.6} rx={8} fill="none" stroke={colors.ACCENT} strokeWidth={0.8} strokeOpacity={0.25} />
          ))}
          <text x={CX} y={140} textAnchor="middle" fill={colors.MUTED} fontSize={13}>walls polished to a shine — opacity ticks down anyway</text>
        </g>
      );

    case 'b03_disclose': {
      const layout = layoutJson({ incident: 'sealed', zero_day: 'proxy-cache', scope: 'contained' }, { x: 540, y: 280, fontSize: 14 });
      return (
        <Box controlGap={controlGap} label="the disclosure decision OpenAI actually faced">
          <JsonDoc layout={layout} reveal={1} />
          <line x1={760} y1={300} x2={880} y2={240} stroke={colors.POSITIVE} strokeWidth={1.2} strokeDasharray="4 4" />
          <text x={905} y={240} fill={colors.POSITIVE} fontSize={11}>disclose → many boxes patch</text>
          <line x1={760} y1={330} x2={880} y2={420} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="4 4" />
          <text x={905} y={425} fill={colors.MUTED} fontSize={11}>bury → your walls only</text>
        </Box>
      );
    }

    case 'b03_sting':
      return (
        <g>
          <text x={STAGE_W / 2} y={150} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} letterSpacing={3}>
            END OF ACT ONE — BELOW THE EXTRAPOLATION LINE
          </text>
          <SwitchWire gap />
          <text x={STAGE_W / 2} y={300} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            the five days you did not know become a gap in the wire itself
          </text>
        </g>
      );

    default:
      return null;
  }
}
