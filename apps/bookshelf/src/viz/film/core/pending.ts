/**
 * Async readiness for DOM footage (shot.dom()): anything a frame shows that loads asynchronously (an rrweb
 * recording's JSON, the fonts and images inside its replay iframe) registers its promise here, and the
 * frame-exact harness awaits settlePending() before a frame is captured. Live playback ignores it.
 */
const pending = new Set<Promise<unknown>>();

export function trackPending<T>(p: Promise<T>): Promise<T> {
  pending.add(p);
  const done = () => pending.delete(p);
  p.then(done, done);
  return p;
}

/** resolves once nothing is pending (including work registered while waiting), or after timeoutMs */
export async function settlePending(timeoutMs = 15000): Promise<void> {
  const until = performance.now() + timeoutMs;
  while (pending.size && performance.now() < until) {
    await Promise.race([Promise.allSettled([...pending]), new Promise((r) => setTimeout(r, Math.max(0, until - performance.now())))]);
  }
}

export const pendingCount = () => pending.size;
