import { useEffect, useState } from 'react';

/** phones, either way up: the players' compact layout (the video sized by its aspect ratio, no side column) */
export const COMPACT_MQ =
  '(max-width: 720px) and (orientation: portrait), (max-width: 1000px) and (orientation: landscape) and (max-height: 520px)';
/** phones held upright: the compact layout plus the bottom sheet (sideways there is no room for it) */
export const PORTRAIT_COMPACT_MQ = '(max-width: 720px) and (orientation: portrait)';

/** Reactively track a CSS media query (SSR-safe). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
