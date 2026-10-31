import { useEffect, useRef, type RefObject } from 'react';

/**
 * A chapter's Strudel music bed (generator/book-score.mjs → music/chapter-<n>.mp3), played under the narration.
 * The narration MP3 is the playback clock, so the bed simply mirrors it: play / pause / seek / end follow the
 * narration element, mute follows the player's mute button, and the last few seconds fade out. The bed is optional
 * and silent on any failure (blocked autoplay, missing file): narration never depends on it.
 */
export function useMusicBed(
  narrationRef: RefObject<HTMLAudioElement | null>,
  url: string | null,
  { gain = 0.3, muted = false, enabled = true }: { gain?: number; muted?: boolean; enabled?: boolean },
): void {
  const bedRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    const narration = narrationRef.current;
    if (!enabled || !url || !narration) return;
    const bed = new Audio(url);
    bed.preload = 'auto';
    bed.loop = false;
    bedRef.current = bed;

    const FADE_S = 3;
    const level = () => {
      if (mutedRef.current) return 0;
      const left = (narration.duration || bed.duration || Infinity) - narration.currentTime;
      const fade = Number.isFinite(left) ? Math.min(1, Math.max(0, left / FADE_S)) : 1;
      return Math.min(1, Math.max(0, gain * fade));
    };
    const sync = () => {
      bed.volume = level();
      if (Math.abs(bed.currentTime - narration.currentTime) > 0.35) {
        try {
          bed.currentTime = narration.currentTime;
        } catch {
          /* metadata not ready yet; the next timeupdate retries */
        }
      }
    };
    const onPlay = () => {
      sync();
      bed.play().catch(() => {});
    };
    const onPause = () => bed.pause();

    narration.addEventListener('play', onPlay);
    narration.addEventListener('playing', onPlay);
    narration.addEventListener('pause', onPause);
    narration.addEventListener('ended', onPause);
    narration.addEventListener('seeked', sync);
    narration.addEventListener('timeupdate', sync);
    if (!narration.paused) onPlay();

    return () => {
      narration.removeEventListener('play', onPlay);
      narration.removeEventListener('playing', onPlay);
      narration.removeEventListener('pause', onPause);
      narration.removeEventListener('ended', onPause);
      narration.removeEventListener('seeked', sync);
      narration.removeEventListener('timeupdate', sync);
      bed.pause();
      bed.removeAttribute('src');
      bed.load();
      bedRef.current = null;
    };
  }, [narrationRef, url, gain, enabled]);

  useEffect(() => {
    const bed = bedRef.current;
    if (bed && muted) bed.volume = 0;
  }, [muted]);
}
