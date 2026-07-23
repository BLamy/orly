import { useEffect, useRef, useState } from 'react';

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
        // Ignore tiny jitter and rubber-banding near the very top.
        if (y < 40) {
          setHidden(false);
        } else if (delta > 6) {
          setHidden(true);
        } else if (delta < -6) {
          setHidden(false);
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
