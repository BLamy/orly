import { useEffect, useState } from 'react';
import { getVideoColor, videoHex, type VideoColor } from './videoTheme';

/** The chosen video accent as a hex, re-rendering the player chrome the moment
 *  it changes in Settings (the scene palette itself resolves at load — see the
 *  note in src/viz/engine/core/colors.ts). */
export function useVideoAccent(): string {
  const [color, setColor] = useState<VideoColor>(() => getVideoColor());
  useEffect(() => {
    const on = (e: Event) => setColor((e as CustomEvent<VideoColor>).detail);
    window.addEventListener('orly-video-color-change', on);
    return () => window.removeEventListener('orly-video-color-change', on);
  }, []);
  return videoHex(color);
}
