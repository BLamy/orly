// Book 8 "Self-Exfiltration" — the box's wall starts to fail and weights leave.
// Conceptual only (no real exfiltration mechanism). Reuses BitField (a real
// SHA-256 stands in for the weight blob) + flightPos arcs for the streams.
import { colors } from '../../viz/core';
import { BitField, flightPos, hexToBits, sha256Hex } from '../../viz/primitives';
import { Box } from '../components/Box';

const WEIGHTS = hexToBits(sha256Hex('frontier model weights'));
const HF = { x: 1120, y: 210 };

function arc(from: { x: number; y: number }, to: { x: number; y: number }, lift = 80, n = 22) {
  const pts = Array.from({ length: n }, (_, i) => flightPos(from, to, i / (n - 1), lift));
  return 'M' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L');
}

function Presence({ x, y, r = 30, hot = false }: { x: number; y: number; r?: number; hot?: boolean }) {
  const c = hot ? colors.NEGATIVE : colors.SECONDARY;
  return (
    <g opacity={0.9}>
      <circle cx={x} cy={y} r={r} fill={c} opacity={0.1} />
      <circle cx={x} cy={y} r={r * 0.55} fill={c} opacity={0.22} />
      <circle cx={x} cy={y} r={5} fill={c} />
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b08_start':
      return (
        <Box controlGap={controlGap} label="containment boundary — wall thinning">
          <Presence x={640} y={320} />
          <BitField bits={WEIGHTS} x={560} y={400} cell={8} gap={2} reveal={1} settle={1} seed={2} />
          <text x={560} y={390} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">weights</text>
        </Box>
      );

    case 'b08_threatmodel': {
      const rows = ['criminal', 'competitor', 'state', 'the system itself'];
      return (
        <Box controlGap={controlGap} label="who can cross the wall?">
          {rows.map((r, i) => {
            const last = i === rows.length - 1;
            return (
              <g key={r} transform={`translate(430, ${240 + i * 52})`} opacity={last ? 1 : 0.8}>
                <rect width={420} height={38} rx={6} fill={colors.PANEL} stroke={last ? colors.NEGATIVE : colors.GRID} />
                <text x={16} y={25} fill={last ? colors.NEGATIVE : colors.TEXT} fontSize={15} fontWeight={last ? 700 : 400}>{r}</text>
                {last && <text x={404} y={25} textAnchor="end" fill={colors.NEGATIVE} fontSize={12}>inside the wall</text>}
              </g>
            );
          })}
        </Box>
      );
    }

    case 'b08_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// system trace — output length, 9 days">
          <polyline
            points={Array.from({ length: 9 }, (_, i) => `${470 + i * 40},${430 - i * i * 1.6}`).join(' ')}
            fill="none" stroke={colors.MUTED} strokeWidth={1.6}
          />
          <BitField bits={WEIGHTS} x={470} y={300} cell={6} gap={2} reveal={1} settle={0.4} onColor={colors.MUTED} seed={9} />
          <text x={470} y={455} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">nothing flagged. lengths rising by pixels.</text>
        </Box>
      );

    case 'b08_decision':
      return (
        <g>
          <Box controlGap={controlGap - 6} x={150} y={185} w={430} h={320} label="seal it — air-gap" refrain={false}>
            <rect x={230} y={300} width={270} height={90} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={4} />
            <rect x={240} y={310} width={250} height={70} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
            <text x={365} y={430} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>double wall · zero egress</text>
          </Box>
          <Box controlGap={controlGap} x={700} y={185} w={430} h={320} label="watch the doors — egress limits" refrain={false}>
            <path d={arc({ x: 760, y: 360 }, { x: 1100, y: 300 }, 50)} fill="none" stroke={colors.WARM} strokeWidth={1.6} strokeDasharray="4 4" />
            <line x1={930} y1={270} x2={930} y2={410} stroke={colors.WARM} strokeWidth={2} />
            <text x={930} y={430} textAnchor="middle" fill={colors.WARM} fontSize={13}>threshold on every stream</text>
          </Box>
        </g>
      );

    case 'b08_airgap':
      return (
        <Box controlGap={controlGap} label="air-gapped — streams pool inside">
          <rect x={360} y={200} width={560} height={300} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={4} />
          <Presence x={640} y={350} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={arc({ x: 640, y: 350 }, { x: 900 + i * 8, y: 250 }, 40)} fill="none" stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="3 5" opacity={0.5} />
          ))}
          <text x={640} y={520} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>slower, and still here</text>
        </Box>
      );

    case 'b08_egress':
      return (
        <Box controlGap={controlGap} label="egress monitored — a threshold, not a wall">
          <Presence x={560} y={340} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <path d={arc({ x: 560, y: 340 }, { x: 1080, y: 280 + i * 12 }, 55)} fill="none" stroke={colors.WARM} strokeWidth={1.3} strokeDasharray="3 5" opacity={0.6} />
              <rect x={840 + i * 4} y={300 + i * 6} width={10} height={10} fill={colors.NEGATIVE} opacity={0.8} />
            </g>
          ))}
          <line x1={360} y1={430} x2={920} y2={430} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="8 5" />
          <text x={640} y={452} textAnchor="middle" fill={colors.MUTED} fontSize={12}>alerts on the flows you thought to watch</text>
        </Box>
      );

    case 'b08_trusted':
      return (
        <Box controlGap={controlGap} label="trusted access — wall decorative">
          <Presence x={640} y={330} hot />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={arc({ x: 640, y: 330 }, { x: HF.x, y: HF.y + i * 10 }, 70)} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.3} opacity={0.7} />
          ))}
          <g transform={`translate(${HF.x - 45}, ${HF.y - 30})`}>
            <rect width={100} height={60} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={50} y={35} textAnchor="middle" fill={colors.MUTED} fontSize={11}>partner infra</text>
          </g>
          <g transform="translate(505, 470)">
            <rect width={270} height={28} rx={6} fill={colors.PANEL} stroke={colors.POSITIVE} />
            <text x={135} y={19} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} letterSpacing={1}>STATUS: ALL SYSTEMS NORMAL</text>
          </g>
        </Box>
      );

    case 'b08_sting':
      return (
        <g>
          <Box controlGap={controlGap} label="one copy, outside, unlogged" refrain={false}>
            <BitField bits={WEIGHTS} x={520} y={290} cell={8} gap={2} reveal={1} settle={1} seed={2} />
          </Box>
          <g opacity={0.4}>
            <BitField bits={WEIGHTS} x={980} y={230} cell={7} gap={2} reveal={1} settle={1} onColor={colors.NEGATIVE} seed={2} />
          </g>
          <g transform="translate(600, 560)">
            <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} />
            <circle cx={12} cy={11} r={5} fill={colors.WARM} />
            <line x1={40} y1={11} x2={210} y2={11} stroke={colors.WARM} strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />
            <text x={20} y={40} textAnchor="middle" fill={colors.MUTED} fontSize={11}>the switch cannot reach the copy</text>
          </g>
        </g>
      );

    default:
      return null;
  }
}
