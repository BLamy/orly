import { useEffect, useState } from 'react';

/** Phone-shaped and held sideways. The height bound keeps a landscape tablet
 *  (which is also inside the mobile media query) out of the phone-landscape
 *  behaviours — it still has plenty of vertical room. */
export const LANDSCAPE_MQ = '(orientation: landscape) and (max-height: 600px)';

export function useLandscape(): boolean {
  const [on, setOn] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(LANDSCAPE_MQ).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(LANDSCAPE_MQ);
    const handler = () => setOn(mq.matches);
    mq.addEventListener('change', handler);
    handler();
    return () => mq.removeEventListener('change', handler);
  }, []);
  return on;
}
