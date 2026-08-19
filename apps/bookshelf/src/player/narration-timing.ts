import type { Timeline } from '../viz/core';

export interface NarrationTimeMap {
  sourceDuration: number;
  playbackDuration: number;
  toPlayback(sourceTime: number): number;
  toSource(playbackTime: number): number;
}

/**
 * Map an authored scene clock to the published narration clock.
 *
 * Scenes are authored at comfortable visual timings, while the MP3's cue
 * times are measured from the final recording. The chapter player uses this
 * map to keep the two clocks aligned. The blog uses the inverse so a live
 * section can request manifest cue times without sampling past the end of a
 * shorter authored scene.
 */
export function createNarrationTimeMap(
  timeline: Timeline,
  cues?: number[],
  duration?: number,
): NarrationTimeMap {
  const authoredCaptions = timeline.describe().captions;
  const source: number[] = [0];
  const playback: number[] = [0];

  for (const [index, cue] of (cues ?? []).entries()) {
    const authoredAt = authoredCaptions[index]?.at;
    if (
      typeof cue !== 'number' ||
      !Number.isFinite(cue) ||
      authoredAt === undefined ||
      authoredAt <= source[source.length - 1] ||
      cue <= playback[playback.length - 1]
    ) {
      continue;
    }
    source.push(authoredAt);
    playback.push(cue);
  }

  const sourceDuration = Math.max(
    timeline.duration,
    source[source.length - 1] + 0.001,
  );
  const playbackDuration = Math.max(
    duration ?? playback[playback.length - 1] + 0.001,
    playback[playback.length - 1] + 0.001,
  );
  source.push(sourceDuration);
  playback.push(playbackDuration);

  const map = (value: number, input: number[], output: number[]) => {
    if (value <= 0) return 0;
    if (value >= input[input.length - 1]) return output[output.length - 1];
    let i = 1;
    while (i < input.length - 1 && value > input[i]) i++;
    const span = input[i] - input[i - 1];
    const u = span > 0 ? (value - input[i - 1]) / span : 0;
    return output[i - 1] + u * (output[i] - output[i - 1]);
  };

  return {
    sourceDuration,
    playbackDuration,
    toPlayback: (sourceTime) => map(sourceTime, source, playback),
    toSource: (playbackTime) => map(playbackTime, playback, source),
  };
}

/** Apply the same piecewise map used by the narrated chapter player. */
export function retimeTimelineToNarration(
  timeline: Timeline,
  cues?: number[],
  duration?: number,
): NarrationTimeMap {
  const map = createNarrationTimeMap(timeline, cues, duration);
  const { channels, captions } = timeline.describe();

  for (const channel of channels) {
    for (const keyframe of channel.keys) {
      const at = map.toPlayback(keyframe.at);
      // A very compressed map segment must still leave a visible tween.
      const dur = Math.max(
        Math.min(keyframe.dur, 0.25),
        map.toPlayback(keyframe.at + keyframe.dur) - at,
      );
      timeline.updateKeyframe(keyframe.id, { at, dur });
    }
  }

  for (const caption of captions) {
    const at = map.toPlayback(caption.at);
    const dur = Math.max(0.5, map.toPlayback(caption.at + caption.dur) - at);
    timeline.updateCaption(caption.id, { at, dur });
  }

  return map;
}
