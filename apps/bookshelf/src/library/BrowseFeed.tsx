import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Timeline, usePlayback } from '../viz/core';
import { VIZ_SCENES, type VizSceneEntry } from '../viz/scenes';
import { assetUrl } from './shared';
import type { BookMeta } from './cover';

// A TikTok-style vertical feed of book videos. The active card autoplays its
// scene muted (a muted <audio> is the clock, so animation stays aligned to the
// real narration length even with the sound off). Gestures:
//   • swipe up / down, or wheel → slide to the next / previous book
//   • tap right / left          → scrub the video forward / back
//   • double tap (center)       → ❤ (visual only — nothing is recorded yet)
//
// The vertical axis only ever changes the book and the horizontal axis only
// ever moves within it, which is the whole grammar of the format.
//
// The slide is a real one: three cards (prev / current / next) live in a single
// keyed list inside a track that follows the finger, so the neighbours are
// already mounted — manifest fetched, scene module loaded, audio preloaded —
// before you ever reach them. They are mounted INACTIVE, which is what keeps
// them silent and paused at frame 0 until the track has fully snapped and the
// card becomes the current one. Because all three share one parent list, the
// incoming card keeps its DOM/React instance across the commit; it doesn't
// remount at the moment it starts playing.
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
/** How long the release takes to snap home / carry through. */
const SETTLE_MS = 330;
/** Resistance applied when you drag toward an edge there's nothing past. */
const RUBBER = 0.32;
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
  fullBleed = false,
}: {
  books: BookMeta[] | null;
  active: boolean;
  mobile: boolean;
  /** Phone held sideways: the tab bar is hidden (see Library.tsx), so the feed
   *  takes the whole screen instead of leaving a gap where the bar was. */
  fullBleed?: boolean;
}) {
  // A shuffled queue; `pos` indexes into it. Swiping advances the queue and
  // reshuffles+appends when it runs dry, so you never repeat until you've seen
  // everything.
  const [queue, setQueue] = useState<BookMeta[]>([]);
  const [pos, setPos] = useState(0);
  // Sound preference lives here, not in the card, so it survives switching
  // books. It starts ON — this is a video feed — but whether it's actually
  // audible depends on the browser's autoplay policy, which the card resolves.
  const [soundOn, setSoundOn] = useState(true);

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

  // ---- slide state ----
  // `drag` is the live finger offset in px (null when not dragging), `settle`
  // is the direction we're animating toward on release (0 = snap back home),
  // and `snap` suppresses the transition for the single frame where we commit
  // the new position — that frame moves the track back to 0 and the cards to
  // their new slots at once, which must not be animated.
  const [drag, setDrag] = useState<number | null>(null);
  const [settle, setSettle] = useState<-1 | 0 | 1 | null>(null);
  const [snap, setSnap] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // ONE <audio> for the whole feed, owned here and lent to whichever card is
  // active (it swaps the src). This is what makes "tap for sound" stick: a
  // browser unlocks audible playback per media ELEMENT, granted by the gesture
  // that started it. When each card had its own element, every swipe produced a
  // fresh, still-locked one, so the sound died and the tap-to-unmute prompt came
  // back on every single book. An element that has been unlocked once stays
  // unlocked across src changes, so the sound now carries across swipes.
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const nextPos = pos + 1 < queue.length ? pos + 1 : 0; // wrap; order is shuffled
  const prevPos = pos - 1;
  const hasPrev = prevPos >= 0;

  /** Land on the neighbour in `dir` (or back home when it's 0). */
  const commit = useCallback((dir: -1 | 0 | 1) => {
    setDrag(null);
    setSettle(dir);
  }, []);

  // The track finished its settle animation: adopt the new position with the
  // transition off, then turn it back on once that frame has painted.
  const onSettled = useCallback(() => {
    if (settle === null) return;
    if (settle === 1) {
      setPos(nextPos);
      setSnap(true);
    } else if (settle === -1 && hasPrev) {
      setPos(prevPos);
      setSnap(true);
    }
    setSettle(null);
  }, [settle, nextPos, prevPos, hasPrev]);

  // Re-arm the transition once the committed frame has painted. A backgrounded
  // or unpainted tab never runs rAF, so a timer races it — otherwise the feed
  // could come back to the foreground with its transition still switched off.
  useEffect(() => {
    if (!snap) return;
    const raf = requestAnimationFrame(() => setSnap(false));
    const id = window.setTimeout(() => setSnap(false), 80);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
  }, [snap]);

  // transitionend is the normal path, but it never fires when the release
  // needed no movement at all (a snap-back from zero, a swipe against the top
  // of the queue). Without this the feed would wedge on `settle`, ignoring
  // every later gesture.
  useEffect(() => {
    if (settle === null) return;
    const id = window.setTimeout(onSettled, SETTLE_MS + 60);
    return () => window.clearTimeout(id);
  }, [settle, onSettled]);

  /** A swipe/wheel/key gesture asking for the neighbour in `dir`. */
  const go = useCallback(
    (dir: -1 | 1) => {
      if (settle !== null) return; // already in flight
      if (dir === -1 && !hasPrev) {
        commit(0);
        return;
      }
      commit(dir);
    },
    [settle, hasPrev, commit]
  );

  /** Finger moved: follow it, resisting past the top of the queue. */
  const onDrag = useCallback(
    (dy: number) => {
      if (settle !== null) return;
      setDrag(dy > 0 && !hasPrev ? dy * RUBBER : dy);
    },
    [settle, hasPrev]
  );

  /** Finger lifted after a drag: carry through if it went far enough. */
  const onDragEnd = useCallback(
    (dy: number) => {
      if (Math.abs(dy) < SWIPE_PX) {
        commit(0);
        return;
      }
      go(dy < 0 ? 1 : -1);
    },
    [commit, go]
  );

  const book = queue[pos];

  if (!books) return <div className="feed-empty">Loading…</div>;
  if (books.length === 0) return <div className="feed-empty">No books yet.</div>;
  if (!book) return <div className="feed-empty">Loading…</div>;

  const h = rootRef.current?.clientHeight ?? 0;
  // Track offset as a fraction of a card height, so the CSS can express it in
  // % and stay correct across resizes.
  const offset =
    drag !== null && h > 0 ? drag / h : settle !== null ? -settle : 0;

  // prev / current / next in ONE keyed list — see the note at the top of the
  // file for why they can't be three separate wrappers.
  const slots: { p: number; book: BookMeta; at: -1 | 0 | 1 }[] = [];
  if (hasPrev && queue[prevPos]) slots.push({ p: prevPos, book: queue[prevPos], at: -1 });
  slots.push({ p: pos, book, at: 0 });
  if (nextPos !== pos && queue[nextPos]) slots.push({ p: nextPos, book: queue[nextPos], at: 1 });

  return (
    <div
      ref={rootRef}
      className={`feed-root ${mobile ? 'is-mobile' : 'is-desktop'}${fullBleed ? ' is-full' : ''}`}
    >
      <div
        className={`feed-track${drag !== null || snap ? ' is-instant' : ''}`}
        style={{
          transform: `translate3d(0, ${offset * 100}%, 0)`,
          transitionDuration: `${SETTLE_MS}ms`,
        }}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform' && e.currentTarget === e.target) onSettled();
        }}
      >
        {slots.map((s) => (
          <div
            key={`${s.p}:${s.book.slug}`}
            className={`feed-slot${s.at === 0 ? ' is-current' : ''}`}
            style={{ transform: `translate3d(0, ${s.at * 100}%, 0)` }}
            aria-hidden={s.at !== 0}
          >
            <FeedCard
              book={s.book}
              // Neighbours stay inactive — mounted and buffered, but silent and
              // parked at frame 0 until they've fully snapped into view. The
              // outgoing card keeps playing while it slides away; it only goes
              // inactive (pause + rewind) once the commit moves it to a
              // neighbour slot, off screen.
              active={active && s.at === 0}
              interactive={s.at === 0}
              onSwipe={go}
              onDrag={onDrag}
              onDragEnd={onDragEnd}
              soundOn={soundOn}
              onToggleSound={() => setSoundOn((s2) => !s2)}
              audioRef={audioRef}
            />
          </div>
        ))}
      </div>
      {/* src/muted are set imperatively by the active card (see its autoplay
          effect) rather than as props, so React never re-mutes it or reloads it
          behind the autoplay-policy handling. */}
      <audio ref={audioRef} preload="auto" />
    </div>
  );
}

function FeedCard({
  book,
  active,
  interactive,
  onSwipe,
  onDrag,
  onDragEnd,
  soundOn,
  onToggleSound,
  audioRef,
}: {
  book: BookMeta;
  active: boolean;
  /** Only the card in the current slot handles gestures. */
  interactive: boolean;
  onSwipe: (dir: -1 | 1) => void;
  onDrag: (dy: number) => void;
  onDragEnd: (dy: number) => void;
  soundOn: boolean;
  onToggleSound: () => void;
  /** The feed's single shared <audio>; only the active card drives it. */
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [manifest, setManifest] = useState<ManifestLite | null>(null);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [entry, setEntry] = useState<VizSceneEntry | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [portrait, setPortrait] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches
  );

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
  // The shared element belongs to the active card, so only the active card may
  // take its clock from it — a buffered neighbour would otherwise be reading the
  // currently-playing book's currentTime.
  const useAudioClock = !!audioUrl && active;
  const pb = usePlayback(built?.tl ?? FALLBACK_TL, { audioRef, useAudioClock });
  const pbRef = useRef(pb);
  pbRef.current = pb;

  // True when the browser refused to start audible playback and we fell back
  // to muted — the next real user gesture can lift that (see onPointerUp).
  const [blocked, setBlocked] = useState(false);

  // Autoplay when this card is active; pause + rewind when it isn't.
  //
  // Sound is attempted first. Browsers only allow audible autoplay once the
  // page has been interacted with, so a rejected play() is expected rather
  // than exceptional: fall back to muted (which is always allowed) so the
  // animation still runs on the audio clock, and flag it so the very next tap
  // or swipe turns the sound on.
  useEffect(() => {
    if (!built) return;
    const a = audioRef.current;
    if (active) {
      if (useAudioClock && a && audioUrl) {
        // Point the shared element at this chapter. Comparing against the
        // resolved .src (an absolute URL) rather than assigning blindly keeps a
        // re-run of this effect — a sound toggle, say — from reloading the file
        // and restarting the narration mid-chapter.
        if (!a.currentSrc.endsWith(audioUrl) && !a.src.endsWith(audioUrl)) {
          a.src = audioUrl;
          a.currentTime = 0;
        }
        a.muted = !soundOn;
        a.play().then(
          () => {
            setBlocked(false);
            pbRef.current.play();
          },
          () => {
            if (soundOn && !a.muted) {
              a.muted = true;
              setBlocked(true);
              a.play().catch(() => {});
            }
            pbRef.current.play(); // even if audio is blocked, run the rAF clock
          }
        );
      } else {
        pbRef.current.play();
      }
    } else {
      pbRef.current.pause();
      pbRef.current.seek(0);
    }
  }, [built, active, useAudioClock, audioUrl, chapterIdx, soundOn]);

  /** Roll to the next chapter. */
  const rollChapter = useCallback(() => {
    setChapterIdx((i) => (i + 1) % Math.max(1, manifest?.chapters.length ?? 1));
  }, [manifest?.chapters.length]);

  // A buffered card has no element of its own to preload with, so warm the HTTP
  // cache instead: by the time it slides in, the narration is local and starts
  // without a hitch.
  useEffect(() => {
    if (active || !audioUrl) return;
    const ac = new AbortController();
    fetch(audioUrl, { signal: ac.signal }).catch(() => {});
    return () => ac.abort();
  }, [active, audioUrl]);

  // The shared element's `ended` belongs to whichever card is driving it. See
  // the two-trigger note below for why `ended` and not just the clock.
  useEffect(() => {
    const a = audioRef.current;
    if (!active || !a) return;
    const on = () => rollChapter();
    a.addEventListener('ended', on);
    return () => a.removeEventListener('ended', on);
  }, [active, audioRef, rollChapter]);

  /** Take the first user gesture as the permission the autoplay policy wanted.
   *  Returns true if it consumed the gesture, so the caller doesn't ALSO scrub
   *  on the tap that was really just "turn the sound on". */
  const liftAutoplayBlock = useCallback(() => {
    const a = audioRef.current;
    if (!blocked || !a || !soundOn) return false;
    a.muted = false;
    a.play().catch(() => {});
    setBlocked(false);
    return true;
  }, [blocked, soundOn]);

  // When a chapter finishes, roll to the next one (or loop the book).
  //
  // Two triggers, because the manifest's declared duration and the real audio
  // file don't always agree: if the manifest says a chapter is a shade longer
  // than the mp3 actually is, the clock stalls at the audio's end and this
  // check never fires, leaving the card frozen on its last frame. The <audio>
  // element's own `ended` is the authority — see onEnded below.
  useEffect(() => {
    if (!active || !built || !manifest) return;
    const end = chapter?.duration ?? pb.duration;
    if (end > 0 && pb.t >= end - 0.08) rollChapter();
  }, [pb.t, active, built, manifest, chapter?.duration, pb.duration, rollChapter]);

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

  // Set once the pointer has clearly gone vertical: from then on the gesture is
  // a drag of the track, and it can no longer become a tap.
  const dragging = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    down.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    dragging.current = false;
    // Keep receiving moves even if the finger leaves the card.
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = down.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    // Claim the gesture as a drag only once it's both moved and committed to
    // the vertical axis, so an edge tap with a little jitter still scrubs.
    if (!dragging.current && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
      dragging.current = true;
    }
    if (dragging.current) onDrag(dy);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = down.current;
    down.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // A drag hands the release to the track, which decides whether it carried
    // far enough to land on the neighbour or snaps back. A swipe also counts as
    // the gesture that unblocks audio, and the new card inherits soundOn.
    if (dragging.current) {
      dragging.current = false;
      liftAutoplayBlock();
      onDragEnd(dy);
      return;
    }

    // Below the drag threshold but still an unmistakable vertical flick (a fast
    // trackpad/mouse gesture can arrive with barely any moves).
    if (Math.abs(dy) > SWIPE_PX && Math.abs(dy) > Math.abs(dx)) {
      liftAutoplayBlock();
      onSwipe(dy < 0 ? 1 : -1);
      return;
    }

    // A tap while sound is blocked means "turn it on", not "scrub".
    if (liftAutoplayBlock()) return;

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

  /** A pointer that never lifts (cancelled by the OS, a scroll takeover) still
   *  has to let the track settle back. */
  const onPointerCancel = () => {
    down.current = null;
    if (dragging.current) {
      dragging.current = false;
      onDragEnd(0);
    }
  };

  /** Desktop: a wheel/trackpad flick is the same gesture as a swipe. */
  const onWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    if (Math.abs(e.deltaY) < 8 || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const now = performance.now();
    if (now - wheelAt.current < WHEEL_COOLDOWN_MS) return;
    wheelAt.current = now;
    onSwipe(e.deltaY > 0 ? 1 : -1);
  };

  // Keyboard mirrors the gestures: up/down changes book, left/right scrubs.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        onSwipe(e.key === 'ArrowDown' ? 1 : -1);
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
  }, [active, onSwipe, scrub]);

  const chapterCount = manifest?.chapters.length ?? 0;

  return (
    <div
      className="feed-card"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
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

      {/* sound toggle — pointer events stop here so tapping it never scrubs */}
      <button
        className="feed-sound"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={() => {
          if (!soundOn) setBlocked(false);
          onToggleSound();
        }}
        aria-label={soundOn ? 'Mute' : 'Unmute'}
      >
        {soundOn && !blocked ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 9v6h4l5 4V5L8 9H4z" strokeLinejoin="round" />
            <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 9v6h4l5 4V5L8 9H4z" strokeLinejoin="round" />
            <path d="M17 9.5l4 5M21 9.5l-4 5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* The browser blocked audible autoplay — say so, since the fix is a tap */}
      {blocked && soundOn && <div className="feed-unmute">Tap for sound</div>}

      {/* hearts */}
      {hearts.map((h) => (
        <span key={h.id} className="feed-heart" style={{ left: h.x, top: h.y }}>
          ❤
        </span>
      ))}
    </div>
  );
}
