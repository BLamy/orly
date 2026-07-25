import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Timeline, usePlayback } from '../viz/core';
import { VIZ_SCENES, type VizSceneEntry } from '../viz/scenes';
import { assetUrl } from './shared';
import type { BookMeta } from './cover';

// A TikTok-style vertical feed of book videos. The active card autoplays its
// scene muted (a muted <audio> is the clock, so animation stays aligned to the
// real narration length even with the sound off). Gestures:
//   • swipe up / down, or wheel → jump to a new RANDOM book
//   • tap right / left          → scrub the video forward / back
//   • double tap (center)       → ❤ (visual only — nothing is recorded yet)
//
// The vertical axis only ever changes the book and the horizontal axis only
// ever moves within it, which is the whole grammar of the format.
//
// Nothing here persists likes/history; the heart is pure delight.

interface ChapterLite {
  number: number;
  title: string;
  scene: string;
  audio?: string;
  duration?: number;
}
interface ManifestLite {
  chapters: ChapterLite[];
}

const FALLBACK_TL = new Timeline();
const DOUBLE_TAP_MS = 280;
const SWIPE_PX = 55;
/** How far a tap on the left/right edge scrubs. */
const SCRUB_S = 5;
/** Wheel events arrive in bursts; one book per burst. */
const WHEEL_COOLDOWN_MS = 500;

/** Fisher–Yates using a caller-provided rng so callers control determinism. */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function BrowseFeed({
  books,
  active,
  mobile,
}: {
  books: BookMeta[] | null;
  active: boolean;
  mobile: boolean;
}) {
  // A shuffled queue; `pos` indexes into it. Swiping advances the queue and
  // reshuffles+appends when it runs dry, so you never repeat until you've seen
  // everything.
  const [queue, setQueue] = useState<BookMeta[]>([]);
  const [pos, setPos] = useState(0);

  useEffect(() => {
    if (!books || books.length === 0) return;
    // Seed the shuffle off the catalog size + first slug so the module has no
    // Math.random() at import; per-session variety comes from Date.now here in
    // an effect (allowed — this is app code, not a scrub-pure scene).
    let seed = Date.now() >>> 0;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    setQueue(shuffle(books, rng));
    setPos(0);
  }, [books]);

  const nextRandom = useCallback(() => {
    setPos((p) => {
      const np = p + 1;
      if (np < queue.length) return np;
      return 0; // wrap; the queue order is already shuffled
    });
  }, [queue.length]);

  const book = queue[pos];

  if (!books) return <div className="feed-empty">Loading…</div>;
  if (books.length === 0) return <div className="feed-empty">No books yet.</div>;
  if (!book) return <div className="feed-empty">Loading…</div>;

  return (
    <div className={`feed-root ${mobile ? 'is-mobile' : 'is-desktop'}`}>
      <FeedCard key={`${book.slug}:${pos}`} book={book} active={active} onSwitchBook={nextRandom} />
    </div>
  );
}

function FeedCard({
  book,
  active,
  onSwitchBook,
}: {
  book: BookMeta;
  active: boolean;
  onSwitchBook: () => void;
}) {
  const [manifest, setManifest] = useState<ManifestLite | null>(null);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [entry, setEntry] = useState<VizSceneEntry | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [portrait, setPortrait] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load this book's manifest (scene slug + audio per chapter).
  useEffect(() => {
    let alive = true;
    setManifest(null);
    setChapterIdx(0);
    fetch(assetUrl(`generated/${book.slug}/manifest.json`))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((m: ManifestLite) => alive && setManifest(m))
      .catch(() => alive && setManifest({ chapters: [] }));
    return () => {
      alive = false;
    };
  }, [book.slug]);

  const chapter = manifest?.chapters[chapterIdx];
  const base = assetUrl(`generated/${book.slug}/`);
  const audioUrl = chapter?.audio ? `${base}${chapter.audio}` : null;

  // Load the scene module for the current chapter.
  useEffect(() => {
    let alive = true;
    setEntry(null);
    if (!chapter) return;
    const load = VIZ_SCENES[chapter.scene];
    if (!load) return;
    load().then(
      (e) => alive && setEntry(e),
      () => {}
    );
    return () => {
      alive = false;
    };
  }, [chapter?.scene]);

  const built = useMemo(() => (entry ? entry.buildScene() : null), [entry]);
  const useAudioClock = !!audioUrl;
  const pb = usePlayback(built?.tl ?? FALLBACK_TL, { audioRef, useAudioClock });
  const pbRef = useRef(pb);
  pbRef.current = pb;

  // Autoplay MUTED when this card is active; pause + rewind when it isn't.
  useEffect(() => {
    if (!built) return;
    const a = audioRef.current;
    if (active) {
      if (useAudioClock && a) {
        a.muted = true;
        a.play().then(
          () => pbRef.current.play(),
          () => pbRef.current.play() // even if audio blocked, run the rAF clock
        );
      } else {
        pbRef.current.play();
      }
    } else {
      pbRef.current.pause();
      pbRef.current.seek(0);
    }
  }, [built, active, useAudioClock, chapterIdx]);

  // When a chapter finishes, roll to the next one (or loop the book).
  useEffect(() => {
    if (!active || !built || !manifest) return;
    const end = chapter?.duration ?? pb.duration;
    if (end > 0 && pb.t >= end - 0.08) {
      setChapterIdx((i) => (i + 1) % Math.max(1, manifest.chapters.length));
    }
  }, [pb.t, active, built, manifest, chapter?.duration, pb.duration]);

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const on = () => setPortrait(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const popHeart = useCallback((x: number, y: number) => {
    const id = performance.now();
    setHearts((h) => [...h, { id, x, y }]);
    window.setTimeout(() => setHearts((h) => h.filter((p) => p.id !== id)), 900);
  }, []);

  /** Scrub within the current chapter. seek() re-syncs the <audio> clock, so
   *  the narration and the animation stay together. */
  const scrub = useCallback((dir: 1 | -1) => {
    const p = pbRef.current;
    const next = Math.max(0, Math.min(p.duration, p.t + dir * SCRUB_S));
    p.seek(next);
  }, []);

  // ---- gesture handling ----
  const down = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = useRef(0);
  const wheelAt = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = down.current;
    down.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Swipe (vertical dominant) → new random book.
    if (Math.abs(dy) > SWIPE_PX && Math.abs(dy) > Math.abs(dx)) {
      onSwitchBook();
      return;
    }

    const now = performance.now();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const centerish = relX > 0.32 && relX < 0.68 && relY > 0.25 && relY < 0.75;

    // Double tap in the middle → ❤.
    if (centerish && now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      popHeart(e.clientX - rect.left, e.clientY - rect.top);
      return;
    }
    lastTap.current = now;

    // An edge tap scrubs, and does it IMMEDIATELY — it used to wait out the
    // double-tap window before doing anything, which read as the tap simply
    // not working. Nothing else is bound to the edges any more, so there's no
    // ambiguity left to wait on.
    if (!centerish) scrub(relX > 0.5 ? 1 : -1);
  };

  /** Desktop: a wheel/trackpad flick is the same gesture as a swipe. */
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 8 || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const now = performance.now();
    if (now - wheelAt.current < WHEEL_COOLDOWN_MS) return;
    wheelAt.current = now;
    onSwitchBook();
  };

  // Keyboard mirrors the gestures: up/down changes book, left/right scrubs.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        onSwitchBook();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrub(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrub(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onSwitchBook, scrub]);

  const chapterCount = manifest?.chapters.length ?? 0;

  return (
    <div
      className="feed-card"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      style={{ ['--accent' as string]: book.color || '#38bdf8' }}
    >
      <div className="feed-stage">
        {built ? (
          <Stage style={{ height: '100%' }}>{entry!.Render({ s: pb.state })}</Stage>
        ) : (
          <div className="feed-spinner" role="status" aria-label="Loading" />
        )}
        {/* No captions in the feed: it's a silent, glanceable format, and the
            pill covered the bottom of the very diagram you're skimming. */}
      </div>

      {/* right-rail meta (title + chapter dots), TikTok-style overlay */}
      <div className="feed-meta">
        <div className="feed-series">{book.series ?? 'Daily Papers by Hugging Face'}</div>
        <div className="feed-title">{book.title}</div>
        {chapter && (
          <div className="feed-chaptitle">
            {String(chapter.number).padStart(2, '0')} · {chapter.title}
          </div>
        )}
        <div className="feed-dots">
          {Array.from({ length: chapterCount }).map((_, i) => (
            <span key={i} className={`feed-dot${i === chapterIdx ? ' on' : ''}`} />
          ))}
        </div>
      </div>

      {/* landscape recommendation */}
      {portrait && (
        <div className="feed-rotate" aria-hidden>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="7" width="18" height="10" rx="2" />
            <path d="M7 3.5a6 6 0 0 1 5 0M12 20.5a6 6 0 0 0 5 0" strokeLinecap="round" />
          </svg>
          Rotate for the full picture
        </div>
      )}

      {/* hint strip */}
      <div className="feed-hint">swipe → new book · tap the sides → scrub</div>

      {/* hearts */}
      {hearts.map((h) => (
        <span key={h.id} className="feed-heart" style={{ left: h.x, top: h.y }}>
          ❤
        </span>
      ))}

      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" muted />}
    </div>
  );
}
