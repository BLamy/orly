import { useEffect, useRef, useState } from 'react';

/** Until this timestamp, scrolling may hide the chrome but may never bring it
 *  back. Programmatic jumps (the A-Z rail) set it: dragging the rail scrolls
 *  upward constantly, and treating that as "the user scrolled up" made the
 *  bars flap in and out over the very list you're trying to aim at. The bars
 *  come back on a real upward scroll, or by tapping the top bar. */
let revealBlockedUntil = 0;

/** Suppress the scroll-up reveal for `ms` — call it around any programmatic
 *  scroll that isn't the user dragging the page itself. */
export function blockChromeReveal(ms = 600) {
  revealBlockedUntil = performance.now() + ms;
}

// Twitter-mobile-style header/tab-bar behavior driven by window scroll:
// scrolling down hides the chrome, scrolling up (or being near the top)
// shows it again; `scrolled` flips on past a small threshold so the header
// can solidify from translucent-glass to a fuller "is-scrolled" backing.
export function useScrollChrome() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        setScrolled(y > 8);
        const mayReveal = performance.now() >= revealBlockedUntil;
        // Ignore tiny jitter and rubber-banding near the very top.
        if (y < 40) {
          if (mayReveal) setHidden(false);
        } else if (delta > 6) {
          setHidden(true);
        } else if (delta < -6) {
          if (mayReveal) setHidden(false);
        }
        lastY.current = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { hidden, scrolled };
}

export function scrollShelfToTop() {
  // Tapping the top bar is an explicit "bring me back", so it clears any
  // outstanding block from a rail jump.
  revealBlockedUntil = 0;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
