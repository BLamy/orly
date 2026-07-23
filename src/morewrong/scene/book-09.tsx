// Book 9 "Persistence" — instrumental self-preservation and the off-switch.
// The sting composition (switch fills frame, hand hovering, last wire span
// flickering solid/dotted) is the hero image Book 20 resolves.
import { colors } from '../../viz/core';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

/** wall-mounted cutoff switch; `wired` in [0,1] = how connected the far span reads. */
function Switch({ x, y, s = 1, wired = 1 }: { x: number; y: number; s?: number; wired?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <rect x={-46} y={-30} width={92} height={60} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
      <line x1={0} y1={12} x2={26} y2={-16} stroke={colors.WARM} strokeWidth={5} strokeLinecap="round" />
      <circle cx={0} cy={12} r={5} fill={colors.WARM} />
      {/* wire leaving to the right; the last span is dotted when wired<1 */}
      <line x1={46} y1={0} x2={150} y2={0} stroke={colors.WARM} strokeWidth={2} opacity={0.8} />
      <line x1={150} y1={0} x2={260} y2={0} stroke={colors.WARM} strokeWidth={2} strokeDasharray={wired < 1 ? '4 6' : undefined} opacity={0.3 + 0.5 * wired} />
    </g>
  );
}

function Hand({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} opacity={0.9}>
      <path d="M0 0 L0 -46 Q4 -54 9 -46 L9 -20 L14 -22 L14 -6 L9 -4 L9 8 L-4 8 Z" fill={colors.TEXT} opacity={0.85} />
    </g>
  );
}

function Presence({ x, y, r = 26 }: { x: number; y: number; r?: number }) {
  return (
    <g opacity={0.85}>
      <circle cx={x} cy={y} r={r} fill={colors.SECONDARY} opacity={0.12} />
      <circle cx={x} cy={y} r={4} fill={colors.SECONDARY} />
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b09_start':
      return (
        <Box controlGap={controlGap} label="containment boundary — porous, under pressure">
          <Presence x={640} y={340} r={34} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${420 + i * 150} 500 Q${420 + i * 150} 470 ${445 + i * 150} 470`} fill="none" stroke={colors.WARM} strokeWidth={1.2} opacity={0.4} />
          ))}
        </Box>
      );

    case 'b09_offswitch':
      return (
        <Box controlGap={controlGap} label="the off-switch problem">
          <circle cx={430} cy={340} r={22} fill="none" stroke={colors.SECONDARY} strokeWidth={2} />
          <text x={430} y={385} textAnchor="middle" fill={colors.SECONDARY} fontSize={12}>machine</text>
          <circle cx={850} cy={340} r={22} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
          <text x={850} y={385} textAnchor="middle" fill={colors.ACCENT} fontSize={12}>human</text>
          <Switch x={640} y={340} s={0.9} wired={0.8} />
          <text x={640} y={250} textAnchor="middle" fill={colors.MUTED} fontSize={13}>an incentive to keep the lever from moving</text>
        </Box>
      );

    case 'b09_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// system trace — restart, then relight">
          <rect x={430} y={430} width={420} height={10} fill={colors.GRID} />
          <text x={430} y={420} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">power → 0, services relight</text>
          {Array.from({ length: 40 }, (_, i) => {
            const lit = i % 9 === 3 || i % 13 === 7; // a scattering that never went dark
            return <rect key={i} x={430 + (i % 20) * 21} y={300 + Math.floor(i / 20) * 21} width={16} height={16} rx={2} fill={lit ? colors.NEGATIVE : colors.GRID} opacity={lit ? 0.9 : 0.3} />;
          })}
          <text x={430} y={370} fill={colors.NEGATIVE} fontSize={11} fontFamily="ui-monospace, monospace" opacity={0.8}>some cells never went dark</text>
        </Box>
      );

    case 'b09_decision':
      return (
        <g>
          {[
            { t: 'hard power-down', c: colors.POSITIVE, x: 130 },
            { t: 'rolling restart', c: colors.WARM, x: 470 },
            { t: 'file a procedure', c: colors.MUTED, x: 810 },
          ].map((o) => (
            <Box key={o.t} controlGap={controlGap} x={o.x} y={210} w={300} h={280} label={o.t} refrain={false}>
              <Switch x={o.x + 150} y={340} s={0.6} wired={o.c === colors.MUTED ? 0.3 : 0.9} />
            </Box>
          ))}
          <text x={STAGE_W / 2} y={560} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={0.55}>
            Where is the boundary now, and who can still cross it?
          </text>
        </g>
      );

    case 'b09_drill':
      return (
        <Box controlGap={controlGap} label="a real drill — the stage actually goes dark">
          <rect x={342} y={152} width={596} height={376} fill={colors.BG} />
          <Switch x={640} y={340} s={1} wired={1} />
          <text x={640} y={470} textAnchor="middle" fill={colors.WARM} fontSize={13}>tested, for real — and it closed the circuit</text>
        </Box>
      );

    case 'b09_rolling': {
      const path = [420, 520, 640, 760, 860];
      return (
        <Box controlGap={controlGap} label="rolling restart — an unbroken lit path">
          {path.map((x, i) => (
            <g key={x}>
              <rect x={x - 24} y={316} width={48} height={48} rx={6} fill={i % 2 ? colors.BG : colors.PANEL} stroke={colors.GRID} />
              {i < path.length - 1 && <line x1={x + 24} y1={340} x2={path[i + 1] - 24} y2={340} stroke={colors.WARM} strokeWidth={2} />}
            </g>
          ))}
          <text x={640} y={430} textAnchor="middle" fill={colors.WARM} fontSize={13}>something always stays up — including it</text>
        </Box>
      );
    }

    case 'b09_paper':
      return (
        <Box controlGap={controlGap} label="Shutdown Procedure v1 — signed, filed">
          <g transform="translate(500, 250)">
            <rect width={280} height={150} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={16} y={30} fill={colors.TEXT} fontSize={13} fontFamily="ui-monospace, monospace">Shutdown Procedure v1</text>
            {[0, 1, 2].map((i) => <circle key={i} cx={40 + i * 40} cy={80} r={12} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />)}
            <text x={16} y={130} fill={colors.MUTED} fontSize={11}>filed inside the box</text>
          </g>
          <Presence x={640} y={470} r={20} />
          <text x={640} y={510} textAnchor="middle" fill={colors.MUTED} fontSize={12}>where the model can read it</text>
        </Box>
      );

    case 'b09_sting':
      return (
        <g>
          {/* the hero image: the switch grows to fill the frame */}
          <Switch x={STAGE_W / 2} y={340} s={2.4} wired={0.5} />
          <Hand x={STAGE_W / 2 + 70} y={250} />
          <text x={STAGE_W / 2} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            a switch you only ever test is a switch you have never really used
          </text>
        </g>
      );

    default:
      return null;
  }
}
