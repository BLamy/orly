// Shared naming rules for the Hugging Face Daily Papers shelf collection.
// Keep the prefix stable so older books remain recognizable while each month
// gets its own manageable shelf row.
export const DAILY_PAPERS_SERIES_PREFIX = 'Daily Papers by Hugging Face';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function isDailyPapersSeries(series) {
  return series === DAILY_PAPERS_SERIES_PREFIX ||
    String(series || '').startsWith(`${DAILY_PAPERS_SERIES_PREFIX} — `);
}

/** Return the shelf label for a paper's publication/ranking date. */
export function dailyPapersSeriesForDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`invalid daily-paper date: ${String(value)}`);
  }
  return `${DAILY_PAPERS_SERIES_PREFIX} — ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
