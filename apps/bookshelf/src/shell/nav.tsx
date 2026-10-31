// The shelf's navigation: @brett_lamy/ui's NavigationStack (the iOS push/pop, back button, edge-swipe back and
// browser back) with the pushed screens kept in the URL, so a reload or a shared link lands on the same screen.
//
//   ?series=<name>   a series' books (mobile)
//   ?bundle=<slug>   a book (mobile; desktop opens the full-page player)
//   ?film=<slug>     a film in the VCR (desktop and mobile)
//
// Each stack owns its routes (useNavRoutes). push() adds a history entry; pop() goes back through history when the
// entry is ours (so the browser's Back and the stack's Back agree) and otherwise (a deep link straight to a screen)
// replaces the URL with the parent. On touch devices the library also arms its own history entry per push
// ({blNav: 1}, lib/back-history) and pops the stack on hardware Back; pop() steps over that entry first.
import '@brett_lamy/ui/styles.css';
import { NavigationStack, type Screen } from '@brett_lamy/ui';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import './nav.css';

export type Route = { kind: 'series'; name: string } | { kind: 'book'; slug: string } | { kind: 'film'; slug: string };

const PARAM: Record<Route['kind'], string> = { series: 'series', book: 'bundle', film: 'film' };

export function routesFromUrl(): Route[] {
  const p = new URLSearchParams(window.location.search);
  const out: Route[] = [];
  const series = p.get('series');
  if (series) out.push({ kind: 'series', name: series });
  const book = p.get('bundle');
  if (book) out.push({ kind: 'book', slug: book });
  const film = p.get('film');
  if (film) out.push({ kind: 'film', slug: film });
  return out;
}

/** the URL with this stack's routes in it; other stacks' parameters are left as they are */
function urlFor(routes: Route[], kinds: Route['kind'][]): URL {
  const url = new URL(window.location.href);
  for (const k of kinds) url.searchParams.delete(PARAM[k]);
  for (const r of routes) url.searchParams.set(PARAM[r.kind], r.kind === 'series' ? r.name : r.slug);
  return url;
}

export const routeKey = (r: Route) => `${r.kind}:${r.kind === 'series' ? r.name : r.slug}`;

/** stop anything playing on a screen that is leaving (a native pop stops playback at once, not after the slide) */
function silence() {
  for (const a of document.querySelectorAll('audio, video')) (a as HTMLMediaElement).pause();
}

/**
 * The routes of one stack, synced with the URL. `kinds` are the routes this stack owns (the shelf's outer stack
 * holds films, a mobile tab's stack holds series and books); `active` = false ignores the URL and history (a hidden
 * tab's stack keeps its own place).
 */
export function useNavRoutes({ kinds, active = true }: { kinds: Route['kind'][]; active?: boolean }) {
  const kindsRef = useRef(kinds);
  kindsRef.current = kinds;
  const read = () => routesFromUrl().filter((r) => kindsRef.current.includes(r.kind));
  const [routes, setRoutes] = useState<Route[]>(() => (active ? read() : []));
  const routesRef = useRef(routes);
  routesRef.current = routes;
  const popping = useRef(false);

  useEffect(() => {
    if (!active) return;
    const onPopState = () => {
      popping.current = false;
      const next = read();
      const cur = routesRef.current;
      if (next.length === cur.length && next.every((r, i) => routeKey(r) === routeKey(cur[i]))) return;
      if (next.length < cur.length) silence();
      setRoutes(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const push = useCallback((r: Route) => {
    const cur = routesRef.current;
    if (cur.length && routeKey(cur[cur.length - 1]) === routeKey(r)) return;
    const next = [...cur, r];
    window.history.pushState({ orlyNav: next.length }, '', urlFor(next, kindsRef.current));
    setRoutes(next);
  }, []);

  const pop = useCallback(() => {
    const cur = routesRef.current;
    if (!cur.length || popping.current) return;
    const state = window.history.state as { orlyNav?: number; blNav?: number } | null;
    if (state?.blNav) {
      // the library's own touch back-history entry sits on top of ours: stepping over it pops the stack, whose
      // onPop calls back in here with our entry on top
      window.history.back();
      return;
    }
    popping.current = true;
    silence();
    if (state?.orlyNav) {
      window.history.back();
      return;
    }
    // landed straight on this screen (a shared link): there is no entry of ours to go back to
    const next = cur.slice(0, -1);
    window.history.replaceState(null, '', urlFor(next, kindsRef.current));
    popping.current = false;
    setRoutes(next);
  }, []);

  return { routes, push, pop };
}

/**
 * NavigationStack with the shelf's look: the root screen is the shelf itself (its own header, no nav bar, edge to
 * edge); every pushed screen gets the library's bar with a back button labelled with the screen under it.
 */
export function ShelfStack({
  root,
  rootTitle = 'Library',
  screens,
  onPop,
  className,
}: {
  root: ReactNode;
  rootTitle?: string;
  screens: (Omit<Screen, 'bottomInset'> & { bottomInset?: number })[];
  onPop: () => void;
  className?: string;
}) {
  const all: Screen[] = [
    { key: 'root', title: rootTitle, content: root, bottomInset: -28, hideChromeOnScroll: false },
    ...screens.map((s) => ({ hideChromeOnScroll: false, bottomInset: -28, ...s })),
  ];
  return (
    <div className={`orly-nav${className ? ` ${className}` : ''}`}>
      <NavigationStack screens={all} onPop={onPop} rootBack={false} />
    </div>
  );
}

export { screenScroller } from './screenScroller';
