import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { SceneState, Timeline } from './timeline';
import type { Playback } from './playback';
import { usePlayback, useReducedMotion } from './playback';
import { publishMotion, clearMotion, reportMotionTime } from './motion-bus';
import { Stage, STAGE_W, STAGE_H } from './stage';
import { Captions } from './captions';
import './player.css';

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <path d="M3 1.5 12 7 3 12.5Z" fill="currentColor" />
  </svg>
);
const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <rect x="2.5" y="1.5" width="3.2" height="11" rx="1" fill="currentColor" />
    <rect x="8.3" y="1.5" width="3.2" height="11" rx="1" fill="currentColor" />
  </svg>
);
const LoopIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path
      d="M2.5 7.5a5 5 0 0 1 8.6-3.4M12.5 7.5a5 5 0 0 1-8.6 3.4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M11.5 1.6v2.8h-2.8M3.5 13.4v-2.8h2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The shared transport bar. */
export function Transport({ pb, children }: { pb: Playback; children?: ReactNode }) {
  const wasPlayingRef = useRef(false);
  return (
    <div className="viz-player-transport">
      <button onClick={pb.toggle} aria-label={pb.playing ? 'Pause' : 'Play'} title="Space">
        {pb.playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <input
        type="range"
        min={0}
        max={pb.duration}
        step={0.01}
        value={pb.t}
        aria-label="Seek"
        onChange={(e) => pb.seek(Number(e.target.value))}
        onPointerDown={() => {
          wasPlayingRef.current = pb.playing;
          pb.pause();
        }}
        onPointerUp={() => {
          if (wasPlayingRef.current) pb.play();
        }}
      />
      <span className="viz-player-time">
        {fmt(pb.t)} / {fmt(pb.duration)}
      </span>
      <button
        className={pb.looping ? 'viz-active' : ''}
        onClick={() => pb.setLooping((v) => !v)}
        aria-label="Loop"
        title="L"
      >
        <LoopIcon />
      </button>
      {children}
    </div>
  );
}

/** Keyboard handling shared by Player wrappers. */
export function playbackKeyHandler(pb: Playback) {
  return (e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        pb.toggle();
        break;
      case 'ArrowRight':
        e.preventDefault();
        e.shiftKey ? pb.seek(pb.t + 1) : pb.stepBeat(1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        e.shiftKey ? pb.seek(pb.t - 1) : pb.stepBeat(-1);
        break;
      case 'Home':
        e.preventDefault();
        pb.seek(0);
        break;
      case 'End':
        e.preventDefault();
        pb.seek(pb.duration);
        break;
      case 'l':
      case 'L':
        pb.setLooping((v) => !v);
        break;
    }
  };
}

export interface PlayerAudio {
  /** published ElevenLabs narration MP3 (see generator/viz-narrate.mjs) */
  url: string;
  /** caption retimes from the narration alignment (<slug>.cues.json) */
  cues?: { lines: Array<{ id: number; at: number }> };
}

export interface PlayerMotion {
  /** repo-relative overrides.json path the Motion addon saves edits into */
  file: string;
  slug: string;
}

/**
 * The player: stage + captions + transport.
 *
 * - `motion` exposes the timeline to the Storybook Motion addon (the "✎"
 *   panel), which edits it live and saves timings back into `motion.file`.
 * - `audio` is the published mode: the ElevenLabs MP3 becomes the clock, so
 *   narration and animation can never drift.
 */
export function Player({
  timeline,
  children,
  width = STAGE_W,
  height = STAGE_H,
  loop = false,
  autoplay = false,
  showCaptions = true,
  motion,
  audio,
}: {
  timeline: Timeline;
  children: (s: SceneState) => ReactNode;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
  showCaptions?: boolean;
  motion?: PlayerMotion;
  audio?: PlayerAudio;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pb = usePlayback(timeline, { audioRef, useAudioClock: !!audio });
  const reduced = useReducedMotion();

  const pbRef = useRef(pb);
  pbRef.current = pb;

  useEffect(() => {
    if (audio?.cues) for (const l of audio.cues.lines) timeline.updateCaption(l.id, { at: l.at });
    pb.setLooping(loop);
    if (autoplay && !reduced) pb.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // expose to the Motion addon (no-op outside Storybook)
  useEffect(() => {
    const binding = {
      timeline,
      file: motion?.file ?? null,
      slug: motion?.slug ?? 'scene',
      controls: {
        seek: (t: number) => pbRef.current.seek(t),
        toggle: () => pbRef.current.toggle(),
        setLooping: (on: boolean) => pbRef.current.setLooping(on),
      },
    };
    publishMotion(binding);
    return () => clearMotion(binding);
  }, [timeline, motion?.file, motion?.slug]);

  useEffect(() => {
    reportMotionTime({ t: pb.t, playing: pb.playing, looping: pb.looping });
  }, [pb.t, pb.playing, pb.looping]);

  return (
    <div className="viz-player" tabIndex={0} onKeyDown={playbackKeyHandler(pb)}>
      <div className="viz-player-stage" onClick={pb.toggle}>
        <Stage width={width} height={height}>
          {children(pb.state)}
        </Stage>
        {showCaptions && <Captions items={pb.state.captions} />}
        {!pb.playing && pb.t === 0 && (
          <div className="viz-player-bigplay">
            <div>
              <svg width="30" height="30" viewBox="0 0 14 14">
                <path d="M4 1.5 12.5 7 4 12.5Z" fill="#38bdf8" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <Transport pb={pb} />
      {audio && <audio ref={audioRef} src={audio.url} preload="auto" />}
    </div>
  );
}
