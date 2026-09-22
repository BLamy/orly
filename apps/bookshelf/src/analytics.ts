import { useEffect, useRef } from 'react';

// A Google Analytics measurement ID is public by design. Keep it here instead
// of .env so Cloudflare's production build uses the same configured stream.
const MEASUREMENT_ID = 'G-FG703786TR';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function initAnalytics() {
  if (typeof window === 'undefined' || window.gtag) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function (...args: unknown[]) {
    // gtag.js expects each queued command as the Arguments object used by its
    // documented bootstrap snippet, not an ordinary array from a rest param.
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

type VideoAnalyticsOptions = {
  contentId: string;
  title: string;
  duration: number;
  currentTime: number;
  playing: boolean;
  ended: boolean;
  source: 'chapter_player' | 'browse_feed';
};

/** Report aggregate video engagement without sending viewer identity or text
 * from controls/search fields. Each mounted chapter records its milestones once. */
export function useVideoAnalytics({
  contentId,
  title,
  duration,
  currentTime,
  playing,
  ended,
  source,
}: VideoAnalyticsOptions) {
  const session = useRef({ contentId, started: false, milestones: new Set<number>(), completed: false });

  useEffect(() => {
    if (session.current.contentId !== contentId) {
      session.current = { contentId, started: false, milestones: new Set<number>(), completed: false };
    }

    const emit = (event: string, extra: Record<string, string | number> = {}) => {
      window.gtag?.('event', event, {
        video_id: contentId,
        video_title: title,
        video_duration: Math.round(duration),
        video_source: source,
        ...extra,
      });
    };

    if (playing && !session.current.started) {
      session.current.started = true;
      emit('video_start');
    }

    if (playing && duration > 0) {
      for (const percent of [25, 50, 75]) {
        if (currentTime >= (duration * percent) / 100 && !session.current.milestones.has(percent)) {
          session.current.milestones.add(percent);
          emit('video_progress', { video_percent: percent });
        }
      }
    }

    if (ended && !session.current.completed) {
      session.current.completed = true;
      emit('video_complete', { video_percent: 100 });
    }
  }, [contentId, title, duration, currentTime, playing, ended, source]);
}
