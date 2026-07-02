import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage } from '../viz/core';
import { VIZ_SCENES, type VizSceneEntry } from '../viz/scenes';

// KaTeX styling for MathLabel-heavy scenes. Loaded dynamically so the
// stylesheet (and its fonts) ship with the first viz step a visitor actually
// hits — shelf/book visitors who never reach one don't pay for it. Vite turns
// this into a lazy CSS chunk alongside the scene chunks.
const loadKatexCss = () => import('katex/dist/katex.min.css');

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Out-of-range beats warn once per scene+beat, not once per rAF frame. */
const warnedBeats = new Set<string>();

/**
 * The play-surface swap for `step.viz`: renders a registered 3b1b-style scene
 * in place of the D3 diagram while its step is active.
 *
 * Clocking — the step's window is mapped onto the scene's timeline:
 * - AUDIO MODE (`audio` prop): f = clamp((t − start)/(end − start), 0, 1),
 *   where t is the MP3's currentTime sampled per rAF. Seeking the track
 *   scrubs the scene exactly (sample(t) is pure).
 * - DWELL MODE (no `audio`): a local rAF accumulator advances only while
 *   `playing`; f = elapsed/durationMs.
 *
 * The fraction f then samples either the WHOLE timeline (no `beat`) or one
 * BEAT WINDOW: beats are the scene's caption start times (`tl.beats`);
 * window = [beats[beat], beats[beat+1] ?? tl.duration];
 * sample(beatStart + f × (beatEnd − beatStart)). That's how one authored
 * scene plays across N consecutive steps — each step's ElevenLabs cue window
 * drives its own beat, so the audio stays continuous while the visuals stay
 * beat-accurate. An out-of-range beat clamps to the last window (warn once).
 *
 * The scene's own lower-third captions (s.captions) are deliberately NOT
 * rendered — the book's narration panel owns the words.
 */
export function VizStepView({
  scene,
  beat,
  playing,
  durationMs,
  audio,
}: {
  /** registry slug from src/viz/scenes.ts */
  scene: string;
  /** index into the scene's beats (caption starts); omit to play the whole timeline */
  beat?: number;
  playing: boolean;
  /** dwell-mode length of this step (ms) — the scene window is time-scaled onto it */
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

  // The window of the timeline this step plays: the whole timeline, or —
  // when `beat` is set — that beat's window [beats[beat], beats[beat+1]].
  const beatWindow = useMemo(() => {
    if (!built) return null;
    const dur = Math.max(0.001, built.tl.duration);
    if (beat == null) return { start: 0, end: dur };
    const beats = built.tl.beats;
    let b = beat;
    if (!Number.isInteger(b) || b < 0 || b >= beats.length) {
      const key = `${scene}#${beat}`;
      if (!warnedBeats.has(key)) {
        warnedBeats.add(key);
        console.warn(
          `[viz] scene '${scene}' has ${beats.length} beats; beat ${beat} is out of range — clamping to the last window`
        );
      }
      b = beats.length - 1;
    }
    if (b < 0) return { start: 0, end: dur }; // scene with zero captions/beats
    return { start: beats[b], end: beats[b + 1] ?? dur };
  }, [built, beat, scene]);

  // Live refs so the rAF loop reads fresh playback state without restarting.
  const playingRef = useRef(playing);
  const audioRef = useRef(audio);
  const durRef = useRef(durationMs);
  useEffect(() => {
    playingRef.current = playing;
    audioRef.current = audio;
    durRef.current = durationMs;
  });

  // The clock: map the step window onto the scene's beat window every frame.
  const [sceneT, setSceneT] = useState(0);
  useEffect(() => {
    if (!built || !beatWindow) return;
    const { start, end } = beatWindow;
    setSceneT(start);
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
      setSceneT(start + f * (end - start));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [built, beatWindow]);

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
      {/* The SAME 1280×720 Stage surface the 3b1bd3 Player uses in Storybook —
          one render path, so a scene looks identical in the book player. */}
      <Stage style={{ height: '100%' }}>
        <Render s={s} />
      </Stage>
    </div>
  );
}
