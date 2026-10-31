/**
 * Ducking: deterministic sidechain gain automation for a track bus, computed from the keying tracks' SPEECH.
 *
 *   const spans = keySpans(project, track.duck.by)          // timeline spans where the keys speak
 *   const pts = duckPoints(spans, duckSettings(track.duck))  // dB breakpoints (0 = unducked, −depthDb = ducked)
 *   duckDbAt(pts, t)                                         // the duck at any time
 *
 * The film mix (generator/film/mix.mjs) ducks the music with an ffmpeg sidechain compressor keyed by the
 * narration. The editor needs the SAME automation in its live preview and its offline export, sample for sample,
 * so instead of a signal-driven compressor it derives the gain from where the keying tracks speak:
 *   - a narration event whose media carries `words` keys on its words (gaps shorter than `bridge` are bridged,
 *     as a compressor's release would hold across them), clipped to the media's `speech` span when present;
 *   - else on its media's `speech` span;
 *   - else on the whole event.
 * The level follows the spans like a compressor's gain computer: it falls towards −depthDb at depthDb/attack dB
 * per second from each span's start and recovers at depthDb/release dB per second from its end, linear in dB
 * (a compressor's exponential ballistics). A span that starts mid-release attacks from wherever the level is.
 * Keying tracks that are muted (or silenced by another track's solo) and muted events do not key, as their
 * signal would not reach a sidechain. `threshold` is not used: the key is speech/no speech.
 *
 * Erasable TypeScript only (node --test runs this file directly).
 */
import type { AudioMedia, EditEvent, Project, Track } from '../model/types.ts';
import type { Point } from './envelope.ts';

export interface Span {
  start: number;
  end: number;
}

/** duck ballistics in SECONDS (see duckSettings for the model's raw values) */
export interface DuckSettings {
  /** dB of gain reduction at full duck (positive) */
  depthDb: number;
  /** seconds to fall the full depth */
  attack: number;
  /** seconds to recover the full depth */
  release: number;
}

/** word gaps shorter than this (s) are bridged into one span (a compressor's release holds across them) */
export const DEFAULT_BRIDGE = 0.35;

/**
 * A duck attack/release value in seconds. The contract (Track.duck) stores SECONDS and the importer converts
 * score/cues.json's milliseconds; hand-edited projects that still carry ms are tolerated: values of 5 or more
 * are read as ms (a 5-second duck attack is not a duck), smaller values are seconds.
 */
export const duckTimeSeconds = (v: number): number => (!Number.isFinite(v) || v <= 0 ? 0 : v >= 5 ? v / 1000 : v);

/** normalise a Track.duck into seconds (defaults: 6 dB, 20 ms attack, 500 ms release) */
export function duckSettings(d: { depthDb?: number; attack?: number; release?: number } | undefined): DuckSettings {
  return {
    depthDb: Math.max(0, d?.depthDb ?? 6),
    attack: duckTimeSeconds(d?.attack ?? 20),
    release: duckTimeSeconds(d?.release ?? 500),
  };
}

/** union of spans: sorted, overlapping (or closer than `bridge`) spans merged; empty spans dropped */
export function mergeSpans(spans: readonly Span[], bridge = 0): Span[] {
  const s = spans.filter((x) => x.end > x.start).sort((a, b) => a.start - b.start);
  const out: Span[] = [];
  for (const x of s) {
    const last = out[out.length - 1];
    if (last && x.start <= last.end + bridge) last.end = Math.max(last.end, x.end);
    else out.push({ start: x.start, end: x.end });
  }
  return out;
}

/** Vegas solo semantics: when any audio track is soloed, only soloed tracks sound; mute always silences */
export function trackAudible(tracks: readonly Track[], track: Track): boolean {
  if (track.mute) return false;
  const anySolo = tracks.some((t) => t.kind === 'audio' && t.solo);
  return !anySolo || track.solo;
}

/** the timeline spans where one event's media speaks (see the header for the rules) */
export function eventSpeechSpans(e: EditEvent, media: AudioMedia | undefined, bridge = DEFAULT_BRIDGE): Span[] {
  const start = e.start;
  const end = e.start + e.length;
  const rate = e.rate > 0 ? e.rate : 1;
  // source seconds → timeline seconds, clipped to the event
  const toT = (src: number): number => start + (src - e.srcIn) / rate;
  const clip = (s: Span): Span => ({ start: Math.max(start, s.start), end: Math.min(end, s.end) });
  if (media?.words && media.words.length > 0) {
    const lo = media.speech ? media.speech.start : -Infinity;
    const hi = media.speech ? media.speech.end : Infinity;
    const words: Span[] = [];
    for (const w of media.words) {
      const a = Math.max(lo, w.start);
      const b = Math.min(hi, w.end);
      if (b > a) words.push(clip({ start: toT(a), end: toT(b) }));
    }
    return mergeSpans(words, bridge);
  }
  if (media?.speech) return mergeSpans([clip({ start: toT(media.speech.start), end: toT(media.speech.end) })]);
  return [{ start, end }];
}

/**
 * The keying spans for a ducked track: the union of the speech of every sounding event on the `by` tracks.
 * Non-audio media on a key track key on the event span.
 */
export function keySpans(project: Pick<Project, 'tracks' | 'media'>, by: readonly string[], bridge = DEFAULT_BRIDGE): Span[] {
  const spans: Span[] = [];
  for (const id of by) {
    const tr = project.tracks.find((t) => t.id === id);
    if (!tr || tr.kind !== 'audio' || !trackAudible(project.tracks, tr)) continue;
    for (const e of tr.events) {
      if (e.mute || !(e.length > 0)) continue;
      const m = project.media[e.mediaId];
      spans.push(...eventSpeechSpans(e, m && m.kind === 'audio' ? m : undefined, bridge));
    }
  }
  return mergeSpans(spans, 0);
}

/**
 * The duck as dB breakpoints (piecewise linear in dB): 0 outside the keys, falling to −depthDb at the attack
 * rate inside them, recovering at the release rate after. Starts with a point at the first span's start and
 * ends with the final recovery; before/after the list the duck is 0 dB. A zero attack or release is a step
 * (two points at one time).
 */
export function duckPoints(spans: readonly Span[], s: DuckSettings): Point[] {
  const D = s.depthDb;
  const merged = mergeSpans(spans, 0);
  if (!(D > 0) || merged.length === 0) return [];
  const out: Point[] = [];
  const add = (t: number, v: number): void => {
    const last = out[out.length - 1];
    if (last && Math.abs(last.t - t) < 1e-9 && Math.abs(last.v - v) < 1e-9) return;
    out.push({ t, v });
  };
  // dB per second; Infinity = instantaneous
  const down = s.attack > 0 ? D / s.attack : Infinity;
  const up = s.release > 0 ? D / s.release : Infinity;
  let level = 0;
  let t = merged[0].start;
  for (let i = 0; i < merged.length; i++) {
    const sp = merged[i];
    // release from the previous span's end until this span starts (or full recovery)
    if (i > 0 && level < 0) {
      const full = t + -level / up;
      if (full <= sp.start) {
        add(full, 0);
        level = 0;
      } else {
        level = Math.min(0, level + (sp.start - t) * up);
      }
    }
    t = sp.start;
    add(t, level);
    // attack until fully ducked or the span ends
    const reach = t + (level + D) / down;
    if (reach <= sp.end) {
      add(reach, -D);
      level = -D;
    } else {
      level = level - (sp.end - t) * down;
    }
    t = sp.end;
    add(t, level);
  }
  // final release
  if (level < 0) add(t + -level / up, 0);
  return out;
}

/** duck (dB, ≤ 0) at time t from duckPoints() output (0 outside) */
export function duckDbAt(points: readonly Point[], t: number): number {
  const n = points.length;
  if (n === 0 || t <= points[0].t || t >= points[n - 1].t) return n === 0 ? 0 : t <= points[0].t ? points[0].v : points[n - 1].v;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (points[m].t <= t) lo = m;
    else hi = m - 1;
  }
  const a = points[lo];
  const b = points[lo + 1];
  if (b.t <= a.t) return b.v;
  return a.v + ((b.v - a.v) * (t - a.t)) / (b.t - a.t);
}
