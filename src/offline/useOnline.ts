import { useEffect, useState } from 'react';

/** Reactive `navigator.onLine`, SSR-safe (mirrors the useMediaQuery pattern
 * already used in ChapterPlayer.tsx/BookPlayer.tsx). */
export function useOnline(): boolean {
  const [online, setOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine
  );
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  return online;
}
