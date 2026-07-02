import { useEffect, useMemo, useRef, useState } from 'react';
import { VIZ_SCENES, type VizSceneEntry } from '../viz/scenes';

// KaTeX styling for MathLabel-heavy scenes. Loaded dynamically so the
// stylesheet (and its fonts) ship with the first viz step a visitor actually
// hits — shelf/book visitors who never reach one don't pay for it. Vite turns
// this into a lazy CSS chunk alongside the scene chunks.
const loadKatexCss = () => import('katex/dist/katex.min.css');

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/**
 * The play-surface swap for `step.viz`: renders a registered 3b1b-style scene
 * in place of the D3 diagram while its step is active.
 *
 * Clocking — the scene's timeline is time-scaled onto the step's window:
 * - AUDIO MODE (`audio` prop): mapped = clamp((t − start)/(end − start), 0, 1)
 *   × tl.duration, where t is the MP3's currentTime sampled per rAF. Seeking
 *   the track scrubs the scene exactly (sample(t) is pure).
 * - DWELL MODE (no `audio`): a local rAF accumulator advances only while
 *   `playing`, mapping elapsed/durationMs onto the timeline.
 *
 * The scene's own lower-third captions (s.captions) are deliberately NOT
 * rendered — the book's narration panel owns the words.
 */
export function VizStepView({
  scene,
  playing,
  durationMs,
  audio,
}: {
  /** registry slug from src/viz/scenes.ts */
  scene: string;
  playing: boolean;
  /** dwell-mode length of this step (ms) — the scene is time-scaled onto it */
  durationMs: number;
  /** audio mode: the narration MP3's clock + this step's cue window (seconds) */
  audio?: { getTime: () => number; start: number; end: number };
}) {
  const [entry, setEntry] = useState<VizSceneEntry | null>(null);
  const [failed, setFailed] = useState(false);

  // Lazily load the registry entry (one chunk per scene).
  useEffect(() => {
    let alive = true;
    setEntry(null);
    setFailed(false);
    const load = VIZ_SCENES[scene];
    if (!load) {
      setFailed(true);
      return;
    }
    void loadKatexCss().catch(() => {});
    load().then(
      (e) => alive && setEntry(e),
      () => alive && setFailed(true)
    );
    return () => {
      alive = false;
    };
  }, [scene]);

  // Build the timeline once per scene mount (the entry memoizes internally too).
  const built = useMemo(() => (entry ? entry.buildScene() : null), [entry]);

  // Live refs so the rAF loop reads fresh playback state without restarting.
  const playingRef = useRef(playing);
  const audioRef = useRef(audio);
  const durRef = useRef(durationMs);
  useEffect(() => {
    playingRef.current = playing;
    audioRef.current = audio;
    durRef.current = durationMs;
  });

  // The clock: map the step window onto the scene timeline every frame.
  const [sceneT, setSceneT] = useState(0);
  useEffect(() => {
    if (!built) return;
    const dur = Math.max(0.001, built.tl.duration);
    let raf = 0;
    let prev = performance.now();
    let elapsed = 0; // dwell-mode ms into this step
    const tick = (now: number) => {
      const a = audioRef.current;
      let f: number;
      if (a) {
        f = clamp01((a.getTime() - a.start) / Math.max(0.001, a.end - a.start));
      } else {
        if (playingRef.current) elapsed += now - prev;
        prev = now;
        f = clamp01(elapsed / Math.max(1, durRef.current));
      }
      setSceneT(f * dur);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [built]);

  if (failed) {
    return <div className="stage viz-stage" aria-label={`Unknown scene ${scene}`} />;
  }
  if (!entry || !built) {
    return (
      <div className="stage viz-stage">
        <div className="viz-spinner" role="status" aria-label="Loading animation" />
      </div>
    );
  }

  const s = built.tl.sample(sceneT);
  const Render = entry.Render;
  return (
    <div className="stage viz-stage">
      <svg className="viz-stage-svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid meet">
        <Render s={s} />
      </svg>
    </div>
  );
}
