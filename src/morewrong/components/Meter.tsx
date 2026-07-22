import { colors } from '../../viz/core';
import { METER_MAX } from '../data';

// Persistent controlGap readout: the single scalar the whole game turns on.
// It only ever ratchets up — the horror is the ratchet, not a swing.
export function Meter({ value, book, bookTitle }: { value: number; book: number; bookTitle: string }) {
  const pct = Math.max(0, Math.min(100, (value / METER_MAX) * 100));
  const color = value > 70 ? colors.NEGATIVE : value > 40 ? colors.WARM : colors.ACCENT;
  return (
    <div className="mw-meter">
      <div className="mw-meter-head">
        <span className="mw-book">BOOK {book} · {bookTitle}</span>
        <span className="mw-gap" style={{ color }}>control gap {value}/100</span>
      </div>
      <div className="mw-meter-track">
        <div className="mw-meter-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
