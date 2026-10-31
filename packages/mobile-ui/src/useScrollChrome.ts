import { useEffect, useRef, useState, type RefObject } from 'react';

let revealBlockedUntil = 0;

export function blockChromeReveal(ms = 600) {
  revealBlockedUntil = performance.now() + ms;
}

/** the scroll position of a scroll event's target: the page itself or an element scroller */
function scrollTopOf(target: EventTarget | null): number {
  if (!target || target === document || target === document.documentElement || target === window) return window.scrollY;
  return (target as HTMLElement).scrollTop ?? 0;
}

/**
 * Hide-on-scroll chrome state. Listens in the capture phase, so it follows whichever element scrolls (the page, or a
 * navigation-stack screen's own scroller). `scope` limits it to scrollers inside that element, so a screen pushed on
 * top (its own scroller) does not move the chrome of the screen underneath.
 */
export function useScrollChrome(scope?: RefObject<HTMLElement | null>) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);
  const lastTarget = useRef<EventTarget | null>(null);

  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;
    const onScroll = (e: Event) => {
      const target = e.target;
      const root = scope?.current;
      if (root && !(target instanceof Node && root.contains(target))) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = scrollTopOf(target);
        // a different scroller: start its delta from where it is now
        if (target !== lastTarget.current) {
          lastTarget.current = target;
          lastY.current = y;
        }
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
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, [scope]);

  return { hidden, scrolled };
}

/** smooth-scroll back to the top: the page, or the given scroller */
export function scrollToTop(scroller?: HTMLElement | null) {
  revealBlockedUntil = 0;
  (scroller ?? window).scrollTo({ top: 0, behavior: 'smooth' });
}
