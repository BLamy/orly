import { useEffect, useRef, useState } from 'react';

let revealBlockedUntil = 0;

export function blockChromeReveal(ms = 600) {
  revealBlockedUntil = performance.now() + ms;
}

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

        if (y < 40) {
          if (mayReveal) setHidden(false);
        } else if (delta > 6) {
          setHidden(true);
        } else if (delta < -6 && mayReveal) {
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

export function scrollToTop() {
  revealBlockedUntil = 0;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
