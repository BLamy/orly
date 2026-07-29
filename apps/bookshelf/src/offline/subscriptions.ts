// Series subscriptions — "auto-download new books in this series as they're
// published." There's no backend/push for this static site, so "as they're
// published" means "the next time the app is open" — a poll of library.json
// against a last-seen snapshot, on load and on an interval.
import { downloadBook } from './downloads';

const SUBS_KEY = 'orly-subscriptions';
const SEEN_KEY = 'orly-subscriptions-seen';
const CHANGE_EVENT = 'orly-subscriptions-changed';

interface BookLike {
  slug: string;
  series?: string;
}

function readSubs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SUBS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeSubs(subs: string[]) {
  try {
    localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
  } catch {
    /* private mode — subscriptions just won't persist */
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function isSubscribed(series: string): boolean {
  return readSubs().includes(series);
}

export function toggleSubscription(series: string): void {
  const subs = readSubs();
  const i = subs.indexOf(series);
  if (i >= 0) subs.splice(i, 1);
  else subs.push(series);
  writeSubs(subs);
}

export function onSubscriptionsChanged(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

function readSeen(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeSeen(seen: Record<string, string[]>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    /* private mode */
  }
}

/** Compare every subscribed series' current book list against what we last
 * saw; any new slug gets downloaded automatically. Call on app load and on
 * an interval while the tab is open. */
export async function checkSubscriptions(allBooks: BookLike[]): Promise<void> {
  const subs = readSubs();
  if (!subs.length) return;
  const seen = readSeen();
  let changed = false;

  for (const series of subs) {
    const current = allBooks.filter((b) => b.series === series).map((b) => b.slug);
    const before = seen[series] ?? [];
    const isNew = current.filter((slug) => !before.includes(slug));
    if (isNew.length && before.length > 0) {
      // Only auto-download once we've SEEN this series before — the very
      // first time we subscribe, every book in it already "exists" and
      // shouldn't all download at once as if they were new releases.
      for (const slug of isNew) void downloadBook(slug);
    }
    if (current.length !== before.length || isNew.length) {
      seen[series] = current;
      changed = true;
    }
  }
  if (changed) writeSeen(seen);
}
