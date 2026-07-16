import { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Stage, Timeline, usePlayback, type CaptionItem } from '../viz/core';
import { VIZ_SCENES, type VizSceneEntry } from '../viz/scenes';
import { fmtDur, type ChapterV3 } from './BookPlayer';

// A stable empty timeline so usePlayback (a hook — unconditional) has
// something to sample while the real scene chunk is still loading.
const FALLBACK_TL = new Timeline();

/** Closed-caption pill for the sampled caption envelope (crossfades on cue). */
function CaptionPill({ c }: { c: CaptionItem }) {
  const tex = c.tex;
  const texHtml = useMemo(
    () => (tex ? katex.renderToString(tex, { throwOnError: false }) : null),
    [tex]
  );
  return (
    <div
      className="captions-pill"
      style={{ opacity: c.u, transform: `translateY(${(1 - c.u) * 8}px)` }}
    >
      {c.text}
      {texHtml && (
        <span style={{ marginLeft: 12 }} dangerouslySetInnerHTML={{ __html: texHtml }} />
      )}
    </div>
  );
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M8 5l11 7-11 7z" />
    </svg>
  );
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
      {on ? (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" />
      ) : (
        <path d="M16 9l6 6M22 9l-6 6" />
      )}
    </svg>
  );
}

/**
 * One chapter = one authored viz scene + one narration MP3.
 *
 * The MP3 is the playback clock (usePlayback's `useAudioClock`), so narration
 * and animation can never drift; the manifest's `cues` retime the scene's
 * captions to the recording (Timeline.updateCaption, exactly like the 3b1bd3
 * Player's `audio.cues`). If the MP3 is missing or errors, we fall back to the
 * timeline's own rAF clock, muted.
 */
export function ChapterPlayer({
  base,
  chapter,
  bookTitle,
  index,
  count,
  nextTitle,
  onPrev,
  onNext,
  onExit,
}: {
  /** asset base for this book's dir, e.g. `${BASE_URL}generated/replay-qa/` */
  base: string;
  chapter: ChapterV3;
  bookTitle: string;
  index: number;
  count: number;
  nextTitle?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onExit: () => void;
}) {
  const [entry, setEntry] = useState<VizSceneEntry | null>(null);
  const [failed, setFailed] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const audioUrl = chapter.audio ? `${base}${chapter.audio}` : null;
  const useAudioClock = !!audioUrl && !audioFailed;

  // Load the scene module (one chunk per scene) and build its timeline once.
  useEffect(() => {
    let alive = true;
    const load = VIZ_SCENES[chapter.scene];
    if (!load) {
      console.warn(`[player] unknown scene '${chapter.scene}'`);
      setFailed(true);
      return;
    }
    load().then(
      (e) => alive && setEntry(e),
      () => alive && setFailed(true)
    );
    return () => {
      alive = false;
    };
  }, [chapter.scene]);

  const built = useMemo(() => (entry ? entry.buildScene() : null), [entry]);

  // Retime the WHOLE timeline to the recording, not just the captions.
  // Authored scenes and narration never have the same length, and the MP3 is
  // the clock — if only captions moved, every tween after the first drift
  // point would fire at the wrong moment (or never, when the narration is
  // shorter than the authored timeline). Build a piecewise-linear time map
  // from authored anchor times (0, each caption's authored `at`, duration)
  // to audio times (0, each cue, the manifest duration), then run every
  // keyframe AND caption through it.
  useEffect(() => {
    if (!built || !chapter.cues?.length) return;
    const { channels, captions } = built.tl.describe();
    const authored = captions.map((c) => c.at);
    const src: number[] = [0];
    const dst: number[] = [0];
    chapter.cues.forEach((cue, i) => {
      const a = authored[i];
      if (typeof cue !== 'number' || a === undefined) return;
      if (a > src[src.length - 1] && cue > dst[dst.length - 1]) {
        src.push(a);
        dst.push(cue);
      }
    });
    const srcEnd = Math.max(built.tl.duration, src[src.length - 1] + 0.001);
    const dstEnd = Math.max(chapter.duration ?? dst[dst.length - 1] + 0.001, dst[dst.length - 1] + 0.001);
    src.push(srcEnd);
    dst.push(dstEnd);
    const map = (t: number) => {
      if (t <= 0) return 0;
      if (t >= srcEnd) return dstEnd;
      let i = 1;
      while (i < src.length - 1 && t > src[i]) i++;
      const f = (t - src[i - 1]) / (src[i] - src[i - 1]);
      return dst[i - 1] + f * (dst[i] - dst[i - 1]);
    };
    for (const ch of channels) {
      for (const k of ch.keys) {
        const at = map(k.at);
        const dur = Math.max(0, map(k.at + k.dur) - at);
        built.tl.updateKeyframe(k.id, { at, dur });
      }
    }
    for (const c of captions) {
      const at = map(c.at);
      const dur = Math.max(0.5, map(c.at + c.dur) - at);
      built.tl.updateCaption(c.id, { at, dur });
    }
  }, [built, chapter.cues, chapter.duration]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pb = usePlayback(built?.tl ?? FALLBACK_TL, { audioRef, useAudioClock });
  const pbRef = useRef(pb);
  pbRef.current = pb;

  // Autoplay once the scene is ready (the chapter click is the user gesture).
  const startedRef = useRef(false);
  useEffect(() => {
    if (!built || startedRef.current) return;
    startedRef.current = true;
    pbRef.current.play();
  }, [built]);

  // End detection → "Up next" card. Audio mode ends at the MANIFEST duration
  // (the aligned narration end) — TTS sometimes appends trailing junk to the
  // MP3, so the file's own length/`ended` can overshoot the real chapter.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnded = () => setEnded(true);
    const end = chapter.duration;
    const onTime = () => {
      if (end && a.currentTime >= end) {
        a.pause();
        setEnded(true);
      }
    };
    a.addEventListener('ended', onEnded);
    a.addEventListener('timeupdate', onTime);
    return () => {
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('timeupdate', onTime);
    };
  }, [useAudioClock, built, chapter.duration]);
  useEffect(() => {
    if (useAudioClock || !built) return;
    if (!pb.playing && startedRef.current && pb.t >= pb.duration - 0.05 && pb.duration > 0)
      setEnded(true);
  }, [pb.playing, pb.t, pb.duration, useAudioClock, built]);

  // "Up next" countdown → auto-advance.
  useEffect(() => {
    if (!ended || !onNext) return;
    setCountdown(5);
    const iv = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(iv);
  }, [ended, onNext]);
  useEffect(() => {
    if (ended && onNext && countdown <= 0) onNext();
  }, [ended, countdown, onNext]);

  const replay = () => {
    setEnded(false);
    pbRef.current.seek(0);
    pbRef.current.play();
  };

  // Keyboard: space play/pause, ←/→ chapters, Esc back to the menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' && e.key === ' ') return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          pbRef.current.toggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext?.();
          break;
        case 'Escape':
          e.preventDefault();
          onExit();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext, onExit]);

  // The seekable range: the manifest duration is authoritative — it is the
  // aligned end of the narration. The raw MP3 may be LONGER (TTS junk tail)
  // and the timeline may differ; never let either stretch the scrubber.
  const seekMax = Math.max(chapter.duration || pb.duration, 0.001);
  const soundAvailable = useAudioClock;

  return (
    <div className="bp-player">
      <header className="bp-topbar">
        <button className="bp-chip" onClick={onExit}>
          ← Chapters
        </button>
        <div className="bp-topbar-title">
          <span className="bp-topbar-book">{bookTitle}</span>
          <span className="bp-topbar-chapter">
            <b>{String(chapter.number).padStart(2, '0')}</b> {chapter.title}
          </span>
        </div>
        <span className="bp-topbar-count">
          {index + 1} / {count}
        </span>
      </header>

      <div className="bp-stagewrap" onClick={() => built && !ended && pb.toggle()}>
        {failed ? (
          <div className="bp-stage-msg">This chapter’s scene isn’t available.</div>
        ) : !built ? (
          <div className="bp-spinner" role="status" aria-label="Loading animation" />
        ) : (
          <div className="bp-stage">
            <Stage style={{ height: '100%' }}>{entry!.Render({ s: pb.state })}</Stage>
            <div className="captions" aria-live="polite">
              <div className="captions-col">
                {pb.state.captions.map((c) => (
                  <CaptionPill key={c.id} c={c} />
                ))}
              </div>
            </div>
            {!pb.playing && !ended && (
              <div className="bp-bigplay" aria-hidden>
                <PlayIcon playing={false} />
              </div>
            )}
            {ended && (
              <div className="bp-endcard" onClick={(e) => e.stopPropagation()}>
                <div className="bp-end-eyebrow">
                  {onNext ? 'Up next' : 'End of the book'}
                </div>
                <div className="bp-end-title">{onNext ? nextTitle : chapter.title}</div>
                {onNext && (
                  <div className="bp-end-countbar">
                    <span style={{ width: `${((5 - countdown) / 5) * 100}%` }} />
                  </div>
                )}
                <div className="bp-end-actions">
                  {onNext && (
                    <button className="bp-end-go" onClick={onNext}>
                      Play now →
                    </button>
                  )}
                  <button className="bp-end-alt" onClick={replay}>
                    Replay
                  </button>
                  <button className="bp-end-alt" onClick={onExit}>
                    Chapters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="bp-controls">
        <input
          className="bp-seek"
          type="range"
          min={0}
          max={seekMax}
          step={0.05}
          value={Math.min(pb.t, seekMax)}
          onChange={(e) => {
            setEnded(false);
            pb.seek(Number(e.target.value));
          }}
          aria-label="Seek"
        />
        <div className="bp-controls-row">
          <div className="bp-controls-left">
            <button className="bp-btn" onClick={onPrev} disabled={!onPrev} aria-label="Previous chapter">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                <path d="M6 5h2v14H6zM20 5l-11 7 11 7z" />
              </svg>
            </button>
            <button className="bp-btn bp-play" onClick={pb.toggle} aria-label={pb.playing ? 'Pause' : 'Play'}>
              <PlayIcon playing={pb.playing} />
            </button>
            <button className="bp-btn" onClick={onNext} disabled={!onNext} aria-label="Next chapter">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                <path d="M16 5h2v14h-2zM4 5l11 7-11 7z" />
              </svg>
            </button>
            <span className="bp-time">
              {fmtDur(Math.max(1, pb.t)) || '0:00'}
              <em> / {fmtDur(seekMax) || '0:00'}</em>
            </span>
          </div>
          <div className="bp-controls-right">
            <button
              className={`bp-btn${muted || !soundAvailable ? '' : ' on'}`}
              onClick={() => setMuted((m) => !m)}
              disabled={!soundAvailable}
              title={soundAvailable ? (muted ? 'Unmute' : 'Mute') : 'No narration audio'}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              <SoundIcon on={!muted && soundAvailable} />
            </button>
          </div>
        </div>
      </footer>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          muted={muted}
          onError={() => setAudioFailed(true)}
        />
      )}
    </div>
  );
}
