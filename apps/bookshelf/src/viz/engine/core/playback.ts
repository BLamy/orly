import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { SceneState, Timeline } from './timeline';

export interface Playback {
  t: number;
  duration: number;
  state: SceneState;
  playing: boolean;
  looping: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (t: number) => void;
  setLooping: (v: boolean | ((v: boolean) => boolean)) => void;
  stepBeat: (dir: 1 | -1) => void;
  /** bumps when the timeline is edited */
  version: number;
}

/**
 * The one clock. rAF accumulates deltas while playing so pause/seek are
 * exact; with `useAudioClock`, the <audio> element IS the clock (published
 * ElevenLabs narration drives the animation, so they can never drift).
 * Subscribes to timeline edits so the Studio re-samples live while dragging
 * keyframes.
 */
export function usePlayback(
  timeline: Timeline,
  opts: { audioRef?: RefObject<HTMLAudioElement | null>; useAudioClock?: boolean } = {},
): Playback {
  const { audioRef, useAudioClock = false } = opts;

  const [version, setVersion] = useState(0);
  useEffect(() => timeline.subscribe(() => setVersion((v) => v + 1)), [timeline]);

  const duration = useMemo(() => timeline.duration, [timeline, version]);
  const beats = useMemo(() => timeline.beats, [timeline, version]);

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [looping, setLooping] = useState(false);

  const tRef = useRef(0);
  const loopingRef = useRef(looping);
  loopingRef.current = looping;

  const audio = () => (useAudioClock ? audioRef?.current ?? null : null);

  const seek = (next: number) => {
    const v = Math.max(0, Math.min(next, duration));
    tRef.current = v;
    setT(v);
    const a = audio();
    if (a && Math.abs(a.currentTime - v) > 0.05) a.currentTime = v;
  };

  const play = () => {
    if (tRef.current >= duration - 1e-6) seek(0);
    audio()?.play().catch(() => {});
    setPlaying(true);
  };
  const pause = () => {
    audio()?.pause();
    setPlaying(false);
  };
  const toggle = () => (playing ? pause() : play());

  // duration can shrink while editing — keep the playhead in range
  useEffect(() => {
    if (tRef.current > duration) seek(duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const a = audio();
      let next: number;
      if (a) {
        next = a.currentTime;
        if (a.ended) {
          if (loopingRef.current) {
            a.currentTime = 0;
            a.play().catch(() => {});
            next = 0;
          } else {
            setPlaying(false);
          }
        }
      } else {
        const dt = (now - last) / 1000;
        last = now;
        next = tRef.current + dt;
        if (next >= duration) {
          if (loopingRef.current) {
            next = duration > 0 ? next % duration : 0;
          } else {
            next = duration;
            setPlaying(false);
          }
        }
      }
      tRef.current = next;
      setT(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration, useAudioClock]);

  const stepBeat = (dir: 1 | -1) => {
    const eps = 0.05;
    const targets = [0, ...beats, duration];
    const next =
      dir === 1
        ? targets.find((b) => b > tRef.current + eps)
        : [...targets].reverse().find((b) => b < tRef.current - eps);
    if (next !== undefined) seek(next);
  };

  const state = useMemo(() => timeline.sample(t), [timeline, t, version]);

  return { t, duration, state, playing, looping, play, pause, toggle, seek, setLooping, stepBeat, version };
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
