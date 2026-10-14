import { useEffect, useState } from 'react';

/** the phone portrait layout the players share: video on top, everything else in the bottom sheet */
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
