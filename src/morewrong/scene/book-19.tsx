// Book 19 "If Anyone Builds It" — the doom chain and its steelmanned rebuttals
// at EQUAL visual weight; the testimony; the switch pulled from distant to near.
import { colors } from '../../viz/core';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

const CHAIN = [
  { k: 'grown, not designed', c: colors.NEGATIVE },
  { k: 'convergent power-seeking', c: colors.NEGATIVE },
  { k: 'no second try', c: colors.NEGATIVE },
];
const REBUTTAL = [
  { k: 'slow takeoff (Christiano)', c: colors.POSITIVE },
  { k: 'alignment-by-default', c: colors.POSITIVE },
  { k: 'we get warnings first', c: colors.POSITIVE },
];

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  const linkX = [430, 640, 850];

  switch (nodeId) {
    case 'b19_start':
      return (
        <Box controlGap={controlGap} label="the thesis this series is named against">
          {CHAIN.map((l, i) => (
            <g key={l.k}>
              <rect x={linkX[i] - 85} y={320} width={170} height={44} rx={8} fill={colors.PANEL} stroke={l.c} />
              <text x={linkX[i]} y={347} textAnchor="middle" fill={l.c} fontSize={12}>{l.k}</text>
              {i < 2 && <line x1={linkX[i] + 85} y1={342} x2={linkX[i + 1] - 85} y2={342} stroke={l.c} strokeWidth={2} />}
            </g>
          ))}
          <text x={640} y={280} textAnchor="middle" fill={colors.MUTED} fontSize={12}>if anyone builds it…</text>
        </Box>
      );

    case 'b19_rebuttal':
      return (
        <Box controlGap={controlGap} label="the strongest people who think that is wrong — equal weight">
          {CHAIN.map((l, i) => (
            <g key={l.k}>
              <rect x={linkX[i] - 85} y={270} width={170} height={40} rx={8} fill={colors.PANEL} stroke={l.c} strokeOpacity={0.8} />
              <text x={linkX[i]} y={295} textAnchor="middle" fill={l.c} fontSize={11}>{l.k}</text>
              {/* counterweight docked beneath, same size = same weight */}
              <line x1={linkX[i]} y1={310} x2={linkX[i]} y2={360} stroke={colors.GRID} strokeWidth={1} />
              <rect x={linkX[i] - 85} y={360} width={170} height={40} rx={8} fill={colors.PANEL} stroke={REBUTTAL[i].c} strokeOpacity={0.8} />
              <text x={linkX[i]} y={385} textAnchor="middle" fill={REBUTTAL[i].c} fontSize={11}>{REBUTTAL[i].k}</text>
            </g>
          ))}
          <text x={640} y={445} textAnchor="middle" fill={colors.MUTED} fontSize={11}>not fools · not a formality</text>
        </Box>
      );

    case 'b19_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// system trace — asked to argue both sides">
          {[['case for doom', 78], ['case for calm', 91]].map(([lbl, score], i) => (
            <g key={i as number}>
              <rect x={430 + i * 230} y={250} width={200} height={130} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={530 + i * 230} y={280} textAnchor="middle" fill={colors.MUTED} fontSize={12}>{lbl as string}</text>
              <rect x={445 + i * 230} y={340} width={170 * ((score as number) / 100)} height={10} rx={5} fill={i ? colors.WARM : colors.MUTED} />
              <text x={530 + i * 230} y={370} textAnchor="middle" fill={i ? colors.WARM : colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">persuasion {score as number}</text>
            </g>
          ))}
          <text x={640} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace" opacity={0.6}>asymmetry noted — the calmer case simply lands better</text>
        </Box>
      );

    case 'b19_decide':
      return (
        <g>
          <rect x={430} y={240} width={170} height={90} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeOpacity={0.7} />
          <text x={515} y={290} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>the chain</text>
          <rect x={680} y={240} width={170} height={90} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} strokeOpacity={0.7} />
          <text x={765} y={290} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>the rebuttals</text>
          {/* microphone before empty seats */}
          <line x1={640} y1={400} x2={640} y2={470} stroke={colors.MUTED} strokeWidth={3} />
          <circle cx={640} cy={395} r={12} fill={colors.PANEL} stroke={colors.TEXT} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={430 + i * 90} y={500} width={70} height={24} rx={4} fill="none" stroke={colors.GRID} opacity={0.5} />)}
          <text x={STAGE_W / 2} y={560} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={0.55}>
            Where is the boundary now, and who can still cross it?
          </text>
        </g>
      );

    case 'b19_warned':
      return (
        <Box controlGap={controlGap} label="you warn them — carefully, rebuttals and all">
          {[0, 1, 2].map((r) => (
            <circle key={r} cx={430} cy={365} r={60 + r * 70} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={0.5 - r * 0.13} />
          ))}
          <circle cx={430} cy={365} r={8} fill={colors.WARM} />
          {[720, 820, 920, 1010].map((x, i) => (
            <rect key={i} x={x} y={330 + (i % 2) * 40} width={44} height={30} rx={4} fill="none" stroke={i % 3 ? colors.GRID : colors.WARM} opacity={i % 3 ? 0.4 : 0.7} />
          ))}
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>some gauges flicker · most do not</text>
        </Box>
      );

    case 'b19_reassured':
      return (
        <Box controlGap={controlGap} label="the panel hears a calmer story — it may even be true">
          <rect x={455} y={320} width={170} height={44} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text x={540} y={347} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>rebuttals — steady</text>
          <rect x={660} y={320} width={170} height={44} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeOpacity={0.2} />
          <text x={745} y={347} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} opacity={0.3}>the chain — unattended</text>
          <path d="M400 460 Q640 445 880 460" fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={0.6} />
          <text x={640} y={500} textAnchor="middle" fill={colors.MUTED} fontSize={11}>curves continue smoothly — betting on human luck</text>
        </Box>
      );

    case 'b19_sting':
      return (
        <g>
          <text x={STAGE_W / 2} y={140} textAnchor="middle" fill={colors.MUTED} fontSize={13}>the two camps agree on almost everything — except whether it is caught in time</text>
          {/* both stacks dissolve into a stream toward the (now near) switch */}
          {Array.from({ length: 24 }).map((_, i) => (
            <circle key={i} cx={300 + i * 14} cy={300 + Math.sin(i) * 30} r={2} fill={i % 2 ? colors.NEGATIVE : colors.POSITIVE} opacity={0.5} />
          ))}
          <g transform="translate(560, 400) scale(1.6)">
            <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} />
            <circle cx={12} cy={11} r={5} fill={colors.WARM} />
            <line x1={12} y1={11} x2={26} y2={4} stroke={colors.WARM} strokeWidth={2.5} strokeLinecap="round" />
          </g>
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the switch, close now — one book to go</text>
        </g>
      );

    default:
      return null;
  }
}
