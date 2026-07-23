import { colors } from '../../viz/core';
import type { Stats } from '../gamestate';

// The three-stat HUD. misalignment is the outcome variable and gets a fuzzy
// "vibes" label — you never see it exactly, which is the whole point.
const vibes = (m: number) => (m <= 34 ? 'ok' : m <= 64 ? 'sus' : 'cooked');
const misColor = (m: number) => (m > 64 ? colors.NEGATIVE : m > 34 ? colors.WARM : colors.POSITIVE);

function Bar({ label, value, color, suffix }: { label: string; value: number; color: string; suffix?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="mw-stat">
      <div className="mw-stat-head">
        <span className="mw-stat-label">{label}</span>
        <span className="mw-stat-val" style={{ color }}>{value}{suffix ?? ''}</span>
      </div>
      <div className="mw-stat-track"><div className="mw-stat-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

export function Hud({ stats }: { stats: Stats }) {
  return (
    <div className="mw-hud">
      <div className="mw-hud-you">you are: <b>the founder</b></div>
      <div className="mw-hud-bars">
        <Bar label={`misalignment · ${vibes(stats.misalignment)}`} value={stats.misalignment} color={misColor(stats.misalignment)} />
        <Bar label="capability" value={stats.capability} color={colors.ACCENT} />
        <Bar label="runway" value={stats.runway} color={stats.runway <= 20 ? colors.NEGATIVE : colors.SECONDARY} suffix="mo" />
      </div>
    </div>
  );
}
