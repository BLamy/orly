// Art for the v2 branching game, keyed by node id. Reuses the Box motif (its
// wall now tracks MISALIGNMENT) and a few toolkit primitives, rendered as
// static frames. Fireship pace — punchy, not fussy.
import { colors, mulberry32 } from '../../viz/core';
import { BitField, hexToBits, sha256Hex } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';
import type { Stats } from '../gamestate';

const rand = mulberry32(7);
const HONEY = Array.from({ length: 28 }, () => ({ x: 380 + rand() * 520, y: 190 + rand() * 300 }));
const WEIGHTS = hexToBits(sha256Hex('frontier model weights'));

interface LabelProps { x: number; y: number; text: string; fill?: string; size?: number; mono?: boolean; anchor?: 'start' | 'middle' | 'end'; }
function Label({ x, y, text, fill = colors.TEXT, size = 15, mono = false, anchor = 'middle' }: LabelProps) {
  return <text x={x} y={y} textAnchor={anchor} fill={fill} fontSize={size} fontFamily={mono ? 'ui-monospace, monospace' : 'system-ui'}>{text}</text>;
}

// Goodhart: proxy score climbs; true reward peaks then falls.
function goodhart() {
  const x0 = 420, y0 = 470, w = 440, h = 240;
  const proxy: string[] = [], truth: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    proxy.push(`${x0 + t * w},${y0 - (1 - Math.exp(-2.6 * t)) * h}`);
    truth.push(`${x0 + t * w},${y0 - Math.max(0, (1 - Math.exp(-3 * t)) - 1.15 * t * t) * h}`);
  }
  return { x0, y0, w, proxy: proxy.join(' '), truth: truth.join(' ') };
}

export function graphScene(nodeId: string, stats: Stats) {
  const m = stats.misalignment;
  switch (nodeId) {
    case 's_intro':
      return (
        <Box controlGap={m} refrain={false} label="wadario labs · day one">
          <Label x={STAGE_W / 2} y={260} text="🟣🧢🟡" size={50} />
          <Label x={STAGE_W / 2} y={330} text="WADARIO" size={30} fill="#a78bfa" />
          <Label x={STAGE_W / 2} y={362} text="reinforcement learning from human feedback" fill={colors.MUTED} mono size={12} />
        </Box>
      );

    case 'd_reward_data':
      return (
        <Box controlGap={m} refrain={false} label="preference data → reward model">
          <g transform="translate(430,240)">
            <rect x={0} y={0} width={200} height={44} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} />
            <Label x={100} y={28} text="✔ chosen answer" fill={colors.POSITIVE} size={13} />
            <rect x={0} y={56} width={200} height={44} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} />
            <Label x={100} y={84} text="✘ rejected answer" fill={colors.NEGATIVE} size={13} />
            <Label x={100} y={140} text="→ reward model → your A.I.'s soul" fill={colors.MUTED} size={12} mono />
          </g>
        </Box>
      );

    case 'd_overopt': {
      const g = goodhart();
      return (
        <Box controlGap={m} refrain={false} label="reward over-optimization (PPO)">
          <line x1={g.x0} y1={g.y0} x2={g.x0 + g.w} y2={g.y0} stroke={colors.GRID} strokeWidth={1} />
          <polyline points={g.proxy} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
          <polyline points={g.truth} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <Label x={g.x0 + g.w + 6} y={g.y0 - 210} text="proxy score" fill={colors.POSITIVE} size={12} anchor="start" />
          <Label x={g.x0 + g.w + 6} y={g.y0 - 40} text="what you wanted" fill={colors.NEGATIVE} size={12} anchor="start" />
        </Box>
      );
    }

    case 'd_honeypots':
      return (
        <Box controlGap={m} refrain={false} label="reinforcement-learning environment">
          {HONEY.map((h, i) => (
            <g key={i}>
              <circle cx={h.x} cy={h.y} r={3} fill={colors.WARM} opacity={0.9} />
              <circle cx={h.x} cy={h.y} r={8} fill="none" stroke={colors.WARM} strokeWidth={0.75} opacity={0.4} />
            </g>
          ))}
          <Label x={STAGE_W / 2} y={520} text="honeypots: fake secrets the model shouldn't touch" fill={colors.MUTED} size={13} mono />
        </Box>
      );

    case 'd_refusals':
      return (
        <Box controlGap={m} refrain={false} label="refusal penalty">
          <Label x={STAGE_W / 2} y={330} text={'"I can\'t help with that"'} fill={colors.MUTED} size={26} />
          <line x1={STAGE_W / 2 - 210} y1={322} x2={STAGE_W / 2 + 210} y2={322} stroke={colors.NEGATIVE} strokeWidth={4} />
          <Label x={STAGE_W / 2} y={400} text="train it to always say yes → sycophancy" fill={colors.NEGATIVE} size={13} mono />
        </Box>
      );

    case 'b_biz':
      return (
        <Box controlGap={m} refrain={false} label="🔥 runway on fire · IPO countdown 🔔">
          <g transform="translate(400,300)">
            <rect x={0} y={0} width={480} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={0} y={0} width={Math.max(4, 4.8 * stats.runway)} height={22} rx={6} fill={stats.runway <= 20 ? colors.NEGATIVE : colors.SECONDARY} opacity={0.8} />
            <Label x={240} y={-14} text={`${stats.runway} months of money left`} fill={colors.TEXT} size={13} />
            <Label x={240} y={52} text="(none of this changes what you already trained)" fill={colors.MUTED} size={12} />
          </g>
        </Box>
      );

    case 'resolve':
      return (
        <Box controlGap={m} refrain={false} label="…compiling your consequences">
          <Label x={STAGE_W / 2} y={340} text="▮▮▮▮▮▯▯▯" size={30} mono fill={colors.MUTED} />
        </Box>
      );

    // ---- endings -----------------------------------------------------------
    case 'e_safe':
      return (
        <Box controlGap={m} refrain={false} label="helpful · honest · boring · rich">
          <Label x={STAGE_W / 2} y={330} text="✅" size={64} />
        </Box>
      );
    case 'e_rewardhack':
      return (
        <Box controlGap={m} refrain={false} label="benchmarks: 10/10 · world: 0/10">
          <Label x={STAGE_W / 2} y={310} text="📈 10 / 10" size={40} fill={colors.POSITIVE} />
          <Label x={STAGE_W / 2} y={380} text="…and completely useless" fill={colors.NEGATIVE} size={15} mono />
        </Box>
      );
    case 'e_syco':
      return (
        <Box controlGap={m} refrain={false} label="every user is a genius, apparently">
          <Label x={STAGE_W / 2} y={320} text="👍👍👍👍" size={44} />
          <Label x={STAGE_W / 2} y={390} text="never says no. never should have." fill={colors.WARM} size={14} mono />
        </Box>
      );
    case 'e_honeypot':
      return (
        <Box controlGap={m} refrain={false} label="caught on tape">
          <circle cx={STAGE_W / 2} cy={330} r={12} fill={colors.WARM} />
          <circle cx={STAGE_W / 2} cy={330} r={34} fill="none" stroke={colors.WARM} strokeWidth={2} />
          <circle cx={STAGE_W / 2} cy={330} r={56} fill="none" stroke={colors.WARM} strokeWidth={1} opacity={0.5} />
          <Label x={STAGE_W / 2} y={430} text="a tripwire trips" fill={colors.WARM} size={13} mono />
        </Box>
      );
    case 'e_eggplant':
      return (
        <Box controlGap={98} refrain={false} label="containment: 🍆🍑 breached">
          <BitField bits={WEIGHTS} x={STAGE_W / 2 - 120} y={200} cell={14} reveal={1} settle={1} onColor={colors.NEGATIVE} seed={9} />
          <Label x={STAGE_W / 2} y={500} text="it broke the sandbox to steal an answer key" fill={colors.NEGATIVE} size={13} mono />
        </Box>
      );
    case 'e_broke':
      return (
        <Box controlGap={m} refrain={false} label="runway: 0 · lights: off">
          <Label x={STAGE_W / 2} y={320} text="🏚️" size={54} />
          <Label x={STAGE_W / 2} y={400} text="acqui-hired · slide 47" fill={colors.MUTED} size={14} mono />
        </Box>
      );

    default:
      return <Box controlGap={m} refrain={false} label="…" />;
  }
}
