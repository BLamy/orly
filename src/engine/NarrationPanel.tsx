import { useEffect, useRef } from 'react';
import type { Story } from '../types';
import { ChevronLeft, ChevronRight, Pause, Play, SoundOff, SoundOn } from './icons';

// Tiny inline markdown: **bold**, *italic*, `code`.
function renderRich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>;
    if (p.startsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>;
    return <span key={i}>{p}</span>;
  });
}

export function NarrationPanel({
  story,
  index,
  playing,
  muted,
  durations,
  progress,
  finished,
  onPrev,
  onNext,
  onTogglePlay,
  onToggleSound,
  onSeek,
}: {
  story: Story;
  index: number;
  playing: boolean;
  muted?: boolean;
  durations: number[];
  /** when set (audio mode), drives the fill directly: 0..1 of the whole chapter */
  progress?: number;
  finished?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onToggleSound?: () => void;
  onSeek?: (index: number) => void;
}) {
  const step = story.steps[index];
  const last = story.steps.length - 1;

  // Smooth progress: weight each slide by its estimated length, and animate the
  // fill across the current slide with requestAnimationFrame while playing.
  const fillRef = useRef<HTMLDivElement | null>(null);
  const elapsedRef = useRef(0);
  const total = durations.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  const cum = durations.map((d) => {
    const v = acc;
    acc += d;
    return v;
  });
  const base = cum[index] ?? 0;
  const dur = durations[index] ?? 0;

  // Restart the within-slide clock whenever the slide changes.
  useEffect(() => {
    elapsedRef.current = 0;
  }, [index]);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    const setFrac = (f: number) => {
      fill.style.width = `${Math.min(100, Math.max(0, f * 100))}%`;
    };
    // Audio mode: the track's clock drives the bar (smoothed with a CSS transition).
    if (progress != null) {
      fill.style.transition = 'width .26s linear';
      setFrac(finished ? 1 : progress);
      return;
    }
    if (finished) {
      fill.style.transition = 'width .4s ease';
      setFrac(1);
      return;
    }
    if (!playing) {
      fill.style.transition = 'width .35s ease';
      setFrac((base + elapsedRef.current) / total);
      return;
    }
    fill.style.transition = 'none';
    let raf = 0;
    const startTs = performance.now() - elapsedRef.current;
    const tick = (now: number) => {
      const el = Math.min(now - startTs, dur);
      elapsedRef.current = el;
      setFrac((base + el) / total);
      if (el < dur) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, index, finished, base, dur, total, progress]);

  // Seek: clicking the bar jumps to the start of whichever slide it lands on.
  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const targetMs = f * total;
    let slide = 0;
    for (let k = 0; k < durations.length; k++) {
      if (targetMs >= cum[k]) slide = k;
      else break;
    }
    onSeek(slide);
  };

  return (
    <div className="panel">
      <div
        className={`progress${onSeek ? ' seekable' : ''}`}
        onClick={onSeek ? seekTo : undefined}
        role={onSeek ? 'slider' : undefined}
        aria-label={onSeek ? 'Seek to a slide' : undefined}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
      >
        <div
          className="fill"
          ref={fillRef}
          style={{ width: `${((finished ? total : base) / total) * 100}%` }}
        />
      </div>
      <div className="inner">
        <div className="text">
          {/* keyed so it remounts and replays the CSS fade-in each step */}
          <div key={step.id} className="narration-body">
            {step.cover ? (
              <>
                <div className="eyebrow">{step.chapter ?? story.title}</div>
                <p className="hint">Use → / ← or ▶ to walk through. {renderRich(step.narration)}</p>
              </>
            ) : (
              <>
                <div className="eyebrow">{step.chapter ?? story.title}</div>
                {step.title && <h2>{step.title}</h2>}
                <p>{renderRich(step.narration)}</p>
              </>
            )}
          </div>
        </div>
        <div className="controls">
          {onToggleSound && (
            <button
              className={`sound${muted ? '' : ' on'}`}
              onClick={onToggleSound}
              aria-pressed={!muted}
              aria-label={muted ? 'Unmute narration' : 'Mute narration'}
              title={muted ? 'Unmute narration' : 'Mute narration'}
            >
              {muted ? <SoundOff /> : <SoundOn />}
            </button>
          )}
          <button onClick={onPrev} disabled={index === 0} aria-label="Previous">
            <ChevronLeft />
          </button>
          <button className="play" onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause /> : <Play />}
          </button>
          <span className="counter">
            {index + 1} / {last + 1}
          </span>
          <button onClick={onNext} disabled={index === last} aria-label="Next">
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
