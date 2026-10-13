/**
 * Edit operations: pure, immutable Project -> Project functions (the store wraps each in an undo step).
 *
 *   editor.apply('Split', (p) => splitEvents(p, ids, cursor))
 *   editor.apply('Move', (p) => moveEvents(p, ids, dt, { trackDelta, ripple }), { coalesce: 'drag' })
 *
 * Conventions
 *   - Every op returns the SAME Project reference when it changes nothing (unknown id, locked track, no-op
 *     value), so `editor.apply` records no empty undo steps. Untouched tracks/events keep their identity.
 *   - Events on a locked track, and locked events, are not edited (lock/unlock themselves always work).
 *   - Times are seconds. Event-relative keyframes (envelopes, Pan/Crop, event FX) stay attached to the
 *     material: a head trim shifts them, a stretch scales them, a split keeps both halves evaluating exactly as
 *     the original did. Track envelopes and track FX keys are timeline time and are never moved by event edits.
 *   - Source limits: audio/video FILE media cannot play outside [0, duration]; procedural shots, stills, text and
 *     colour generators accept any source time (a shot clamps its own timeline), so they trim without limit.
 *   - Ripple ('off' | 'tracks' | 'all', the Vegas auto-ripple modes): 'tracks' moves later events on the edited
 *     tracks; 'all' moves later events on every track plus markers and regions.
 *
 * Index
 *   lookup     findEvent findTrack mediaOf eventsAt eventsInRange expandGroups sourceLimits isEditable canHost syncOffsets
 *   split      splitEvents splitBlocked
 *   events     makeEvent addEvent insertMedia removeEvents moveEvents trimStart trimEnd splitEvents slipEvents
 *              stretchEvent setRate setFade setEventGain setEventOpacity setEventProps setEventText
 *   envelopes  addEnvelopePoint moveEnvelopePoint deleteEnvelopePoint setEnvelopeCurve clearEnvelope clampEnvelopeValue
 *   pan/crop   setPanCropKey movePanCropKey deletePanCropKey resetPanCrop
 *   fx         addVideoFx addAudioFx removeFx moveFx setFxEnabled setVideoFxValue setAudioFxParam
 *   transitions setTransition setOverlapAtCut previousNeighbour
 *   tracks     addTrack removeTrack moveTrack renameTrack setTrackProps toggleTrackFlag setTrackLevel setTrackPan
 *              setTrackHeight setTrackDuck
 *   media      addMedia updateMedia removeMedia
 *   markers    addMarker updateMarker moveMarker deleteMarkers addRegion updateRegion moveRegion deleteRegions
 *   clipboard  copyEvents pasteEvents serializeClipboard parseClipboard isClipboard
 *   groups     groupEvents ungroupEvents
 *   cleanup    normalize
 */
import type {
  AudioFx,
  AudioFxKind,
  EditEvent,
  Fade,
  Keyframe,
  Marker,
  Media,
  PanCrop,
  Project,
  Region,
  TextSpec,
  Track,
  TransitionKind,
  VideoFx,
  VideoFxKind,
} from './types.ts';
import { eventEnd } from './types.ts';
import { newId, projectIds, uniqueId } from './id.ts';
import { fadeInGain, fadeOutGain, gainToDb, linearize, sampleEnvelope } from '../engine/envelope.ts';

// ---------------------------------------------------------------------------
// Constants and small helpers
// ---------------------------------------------------------------------------
export type RippleMode = 'off' | 'tracks' | 'all';
export type TrackKind = Track['kind'];

/** time comparisons (seconds) */
export const EPS = 1e-6;
/** shortest event a trim/stretch may leave */
export const MIN_EVENT_LEN = 0.01;
/** velocity range for rate stretch */
export const RATE_MIN = 0.25;
export const RATE_MAX = 4;
/** event/track gain range (dB); -96 is silence for every practical purpose */
export const GAIN_MIN_DB = -96;
export const GAIN_MAX_DB = 12;
export const TRACK_HEIGHT_MIN = 24;
export const TRACK_HEIGHT_MAX = 480;
/** default length of an event whose media has no natural length (stills, text, colour) */
export const DEFAULT_STILL_LEN = 5;
export const NO_FADE: Fade = { len: 0, curve: 'smooth' };

/** a video FX's value when it is added: visible but tasteful (neutral for the tone controls) */
export const VIDEO_FX_DEFAULT: Record<VideoFxKind, number> = {
  brightness: 0,
  contrast: 1,
  saturation: 1,
  hue: 0,
  blur: 2,
  sepia: 1,
  grayscale: 1,
  invert: 1,
  vignette: 0.5,
  filmFinish: 1,
};

/** default text generator spec (stage px, 1280×720) */
export const DEFAULT_TEXT: TextSpec = {
  content: 'Title',
  font: '"Cormorant Garamond", "EB Garamond", Garamond, Georgia, serif',
  size: 64,
  color: '#f3e9d2',
  align: 'center',
  x: 640,
  y: 360,
  weight: 600,
};

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const finite = (v: number, fallback: number): number => (Number.isFinite(v) ? v : fallback);

/** stable sort by start (ties keep their order, so a transition pair never swaps) */
function sortByStart(events: EditEvent[]): EditEvent[] {
  for (let i = 1; i < events.length; i++) if (events[i].start < events[i - 1].start) return [...events].sort((a, b) => a.start - b.start);
  return events;
}

/** replace a project's tracks, keeping the project's identity when no track changed */
function withTracks(p: Project, tracks: Track[]): Project {
  if (tracks.length === p.tracks.length && tracks.every((t, i) => t === p.tracks[i])) return p;
  return { ...p, tracks };
}

/** replace a track's events (sorted); keeps identity when nothing changed */
function withEvents(tr: Track, events: EditEvent[]): Track {
  if (events.length === tr.events.length && events.every((e, i) => e === tr.events[i])) return tr;
  return { ...tr, events: sortByStart(events) };
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------
export interface EventRef {
  track: Track;
  trackIndex: number;
  event: EditEvent;
  index: number;
}

export function findEvent(p: Project, id: string): EventRef | null {
  for (let ti = 0; ti < p.tracks.length; ti++) {
    const track = p.tracks[ti];
    const index = track.events.findIndex((e) => e.id === id);
    if (index >= 0) return { track, trackIndex: ti, event: track.events[index], index };
  }
  return null;
}

export function findTrack(p: Project, id: string): { track: Track; index: number } | null {
  const index = p.tracks.findIndex((t) => t.id === id);
  return index >= 0 ? { track: p.tracks[index], index } : null;
}

export function mediaOf(p: Project, e: EditEvent): Media | undefined {
  return p.media[e.mediaId];
}

/** ids of events whose span contains timeline time t (start ≤ t < end), optionally on some tracks only */
export function eventsAt(p: Project, t: number, trackIds?: Iterable<string>): string[] {
  const only = trackIds ? new Set(trackIds) : null;
  const out: string[] = [];
  for (const tr of p.tracks) {
    if (only && !only.has(tr.id)) continue;
    for (const e of tr.events) if (e.start <= t + EPS && t < eventEnd(e) - EPS) out.push(e.id);
  }
  return out;
}

/** ids of events overlapping [t0, t1] (marquee selection), optionally on some tracks only */
export function eventsInRange(p: Project, t0: number, t1: number, trackIds?: Iterable<string>): string[] {
  const a = Math.min(t0, t1);
  const b = Math.max(t0, t1);
  const only = trackIds ? new Set(trackIds) : null;
  const out: string[] = [];
  for (const tr of p.tracks) {
    if (only && !only.has(tr.id)) continue;
    for (const e of tr.events) if (e.start < b && eventEnd(e) > a) out.push(e.id);
  }
  return out;
}

/**
 * ids plus every event that shares a group with one of them (Vegas groups select and move together). With
 * `enabled` false (Vegas "Ignore Event Grouping") the ids come back as they are.
 */
export function expandGroups(p: Project, ids: Iterable<string>, enabled = true): string[] {
  const want = new Set(ids);
  if (!enabled) return [...want];
  const groups = new Set<string>();
  for (const tr of p.tracks) for (const e of tr.events) if (e.group && want.has(e.id)) groups.add(e.group);
  if (!groups.size) return [...want];
  for (const tr of p.tracks) for (const e of tr.events) if (e.group && groups.has(e.group)) want.add(e.id);
  return [...want];
}

/**
 * A/V sync offsets (Vegas's red out-of-sync numbers): for every narration line event whose medium knows its shot
 * (`tags.shot`) and its shot-local start (`tags.at`, set by the importer), how far its speech now lands from where
 * the shot's picture expects it (seconds; positive = the voice is late). The shot event is the one in the line's
 * group, else the nearest event playing that shot. Lines within half a frame are omitted.
 */
export function syncOffsets(p: Project): Map<string, number> {
  const out = new Map<string, number>();
  const shots = new Map<string, EditEvent[]>();
  for (const tr of p.tracks) {
    if (tr.kind !== 'video') continue;
    for (const e of tr.events) {
      const m = p.media[e.mediaId];
      if (m?.kind !== 'shot') continue;
      const list = shots.get(m.shotId) ?? [];
      list.push(e);
      shots.set(m.shotId, list);
    }
  }
  if (!shots.size) return out;
  const half = 0.5 / (p.fps || 24);
  for (const tr of p.tracks) {
    if (tr.kind !== 'audio') continue;
    for (const e of tr.events) {
      const m = p.media[e.mediaId];
      if (m?.kind !== 'audio' || !m.speech || !m.tags?.shot || m.tags.at === undefined) continue;
      const at = Number(m.tags.at);
      const cands = shots.get(m.tags.shot);
      if (!cands?.length || !Number.isFinite(at)) continue;
      const shot = (e.group && cands.find((s) => s.group === e.group)) || cands.reduce((a, b) => (Math.abs(b.start - e.start) < Math.abs(a.start - e.start) ? b : a));
      const expected = shot.start + (at - shot.srcIn) / (shot.rate || 1);
      const actual = e.start + (m.speech.start - e.srcIn) / (e.rate || 1);
      const d = actual - expected;
      if (Math.abs(d) >= half) out.set(e.id, d);
    }
  }
  return out;
}

/** the source-time window a medium can play: files are bounded by their length, generators and shots are not */
export function sourceLimits(m: Media | undefined): { min: number; max: number } {
  if (m && (m.kind === 'audio' || m.kind === 'video') && Number.isFinite(m.duration) && m.duration > 0) return { min: 0, max: m.duration };
  return { min: -Infinity, max: Infinity };
}

export function isEditable(track: Track, e: EditEvent): boolean {
  return !track.lock && !e.lock;
}

/** can a medium live on a track of this kind (audio media on audio tracks, pictures on video tracks) */
export function canHost(kind: TrackKind, m: Media): boolean {
  if (kind === 'audio') return m.kind === 'audio' || (m.kind === 'video' && m.hasAudio === true);
  return m.kind !== 'audio';
}

// ---------------------------------------------------------------------------
// Keyframes attached to an event (event-relative time)
// ---------------------------------------------------------------------------
type KeyMap = <V>(keys: Keyframe<V>[]) => Keyframe<V>[];

/** apply fn to every event-relative keyframe list (envelopes, Pan/Crop, keyframed event FX) */
function mapEventKeys(e: EditEvent, fn: KeyMap): EditEvent {
  let out = e;
  if (e.envelopes) {
    const env = { ...e.envelopes };
    if (env.volume) env.volume = fn(env.volume);
    if (env.pan) env.pan = fn(env.pan);
    if (env.opacity) env.opacity = fn(env.opacity);
    out = { ...out, envelopes: env };
  }
  if (e.panCrop?.length) out = { ...out, panCrop: fn(e.panCrop) };
  if (e.videoFx?.some((fx) => Array.isArray(fx.value))) {
    out = { ...out, videoFx: e.videoFx.map((fx) => (Array.isArray(fx.value) ? { ...fx, value: fn(fx.value) } : fx)) };
  }
  return out;
}

const shiftKeys =
  (dt: number): KeyMap =>
  (keys) =>
    keys.map((k) => ({ ...k, t: k.t + dt }));

const scaleKeys =
  (s: number): KeyMap =>
  (keys) =>
    keys.map((k) => ({ ...k, t: k.t * s }));

/** keep keys inside [t0, t1] plus the nearest key on each side, so every value inside the window is unchanged */
const pruneKeys =
  (t0: number, t1: number): KeyMap =>
  (keys) => {
    let first = 0;
    let last = keys.length - 1;
    while (first + 1 < keys.length && keys[first + 1].t <= t0 + EPS) first++;
    while (last - 1 >= 0 && keys[last - 1].t >= t1 - EPS) last--;
    return first <= last ? keys.slice(first, last + 1) : keys;
  };

// ---------------------------------------------------------------------------
// Ripple
// ---------------------------------------------------------------------------
/**
 * Shift later material by dt. `anchors` maps an edited track to the time at/after which its events move; in 'all'
 * mode every other track (and markers/regions) moves at/after `globalAnchor`. Events in `skip` never move.
 */
function rippleShift(p: Project, mode: RippleMode, anchors: Map<string, number>, globalAnchor: number, dt: number, skip: Set<string>): Project {
  if (mode === 'off' || Math.abs(dt) < EPS) return p;
  const tracks = p.tracks.map((tr) => {
    const a = anchors.get(tr.id) ?? (mode === 'all' ? globalAnchor : undefined);
    if (a === undefined || tr.lock) return tr;
    return withEvents(
      tr,
      tr.events.map((e) => (!skip.has(e.id) && e.start >= a - EPS ? { ...e, start: Math.max(0, e.start + dt) } : e)),
    );
  });
  let out = withTracks(p, tracks);
  if (mode === 'all') out = shiftMarkersAndRegions(out, globalAnchor, dt);
  return out;
}

function shiftMarkersAndRegions(p: Project, anchor: number, dt: number): Project {
  const at = (t: number) => (t >= anchor - EPS ? Math.max(0, t + dt) : t);
  const markers = p.markers.map((m) => (m.t >= anchor - EPS ? { ...m, t: at(m.t) } : m));
  const regions = p.regions.map((r) => {
    if (r.end < anchor - EPS) return r;
    const start = at(r.start);
    const end = Math.max(start + EPS * 10, at(r.end));
    return { ...r, start, end };
  });
  return { ...p, markers, regions };
}

/** merge [a, b] spans into sorted disjoint spans */
function mergeSpans(spans: [number, number][]): [number, number][] {
  const s = spans.filter(([a, b]) => b > a + EPS).sort((x, y) => x[0] - y[0]);
  const out: [number, number][] = [];
  for (const [a, b] of s) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + EPS) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

/** the time map that closes the given spans: t -> t − |spans ∩ (−∞, t)| (monotone, continuous) */
function closeSpans(spans: [number, number][]): (t: number) => number {
  const m = mergeSpans(spans);
  return (t) => {
    let removed = 0;
    for (const [a, b] of m) {
      if (t <= a) break;
      removed += Math.min(t, b) - a;
    }
    return t - removed;
  };
}

// ---------------------------------------------------------------------------
// Event edits (internal driver)
// ---------------------------------------------------------------------------
/**
 * Rewrite events by id. fn returns the new event, the same event (no change) or null (delete).
 * Locked events / tracks are skipped unless `ignoreLock`.
 */
function mapEvents(
  p: Project,
  ids: Iterable<string>,
  fn: (e: EditEvent, tr: Track) => EditEvent | null,
  opts: { ignoreLock?: boolean } = {},
): Project {
  const want = new Set(ids);
  if (!want.size) return p;
  const tracks = p.tracks.map((tr) => {
    if (!tr.events.some((e) => want.has(e.id))) return tr;
    const events: EditEvent[] = [];
    for (const e of tr.events) {
      if (!want.has(e.id) || (!opts.ignoreLock && !isEditable(tr, e))) {
        events.push(e);
        continue;
      }
      const n = fn(e, tr);
      if (n) events.push(n);
    }
    return withEvents(tr, events);
  });
  return withTracks(p, tracks);
}

const eq = (a: number, b: number) => Math.abs(a - b) < EPS;

// ---------------------------------------------------------------------------
// Add / remove / move
// ---------------------------------------------------------------------------
/** a new event for a medium at `start` with editor defaults */
export function makeEvent(m: Media, start: number, opts: { length?: number; srcIn?: number; id?: string } = {}): EditEvent {
  const srcIn = opts.srcIn ?? 0;
  const natural = Number.isFinite(m.duration) && m.duration > 0 ? m.duration - (m.kind === 'shot' ? 0 : srcIn) : DEFAULT_STILL_LEN;
  const length = Math.max(MIN_EVENT_LEN, opts.length ?? natural);
  return {
    id: opts.id ?? newId('e'),
    mediaId: m.id,
    start: Math.max(0, start),
    length,
    srcIn,
    rate: 1,
    fadeIn: { ...NO_FADE },
    fadeOut: { ...NO_FADE },
  };
}

/** add a complete event to a track; with ripple, later material moves right by its length first */
export function addEvent(p: Project, trackId: string, ev: EditEvent, opts: { ripple?: RippleMode } = {}): Project {
  const hit = findTrack(p, trackId);
  const m = p.media[ev.mediaId];
  if (!hit || hit.track.lock || !m || !canHost(hit.track.kind, m) || !(ev.length > 0)) return p;
  if (findEvent(p, ev.id)) return p;
  let out = rippleShift(p, opts.ripple ?? 'off', new Map([[trackId, ev.start]]), ev.start, ev.length, new Set());
  const tr = out.tracks[hit.index];
  out = withTracks(
    out,
    out.tracks.map((t) => (t === tr ? withEvents(t, [...t.events, ev]) : t)),
  );
  return out;
}

/** put a medium on a track at `start` (adds it to the pool if it is new); returns the project */
export function insertMedia(
  p: Project,
  trackId: string,
  m: Media,
  start: number,
  opts: { length?: number; srcIn?: number; id?: string; ripple?: RippleMode } = {},
): Project {
  const hit = findTrack(p, trackId);
  if (!hit || hit.track.lock || !canHost(hit.track.kind, m)) return p;
  const withMedia = p.media[m.id] ? p : { ...p, media: { ...p.media, [m.id]: m } };
  const out = addEvent(withMedia, trackId, makeEvent(m, start, opts), { ripple: opts.ripple });
  return out === withMedia ? p : out;
}

/** grouping switch shared by the ops that act on whole groups (`groups: false` = Ignore Event Grouping) */
export interface GroupOpts {
  groups?: boolean;
}

/** delete events (and their group mates); with ripple the time they occupied closes up */
export function removeEvents(p: Project, ids: Iterable<string>, ripple: RippleMode = 'off', opts: GroupOpts = {}): Project {
  const all = new Set(expandGroups(p, ids, opts.groups !== false));
  const spansByTrack = new Map<string, [number, number][]>();
  const allSpans: [number, number][] = [];
  for (const tr of p.tracks)
    for (const e of tr.events)
      if (all.has(e.id) && isEditable(tr, e)) {
        const s: [number, number] = [e.start, eventEnd(e)];
        allSpans.push(s);
        spansByTrack.set(tr.id, [...(spansByTrack.get(tr.id) ?? []), s]);
      }
  if (!allSpans.length) return p;
  let out = mapEvents(p, all, () => null);
  if (ripple === 'off') return out;
  const globalMap = closeSpans(allSpans);
  const tracks = out.tracks.map((tr) => {
    if (tr.lock) return tr;
    const spans = ripple === 'all' ? allSpans : spansByTrack.get(tr.id);
    if (!spans) return tr;
    const map = ripple === 'all' ? globalMap : closeSpans(spans);
    return withEvents(
      tr,
      tr.events.map((e) => {
        const s = map(e.start);
        return eq(s, e.start) ? e : { ...e, start: Math.max(0, s) };
      }),
    );
  });
  out = withTracks(out, tracks);
  if (ripple === 'all') {
    out = {
      ...out,
      markers: out.markers.map((m) => ({ ...m, t: globalMap(m.t) })),
      regions: out.regions
        .map((r) => ({ ...r, start: globalMap(r.start), end: globalMap(r.end) }))
        .filter((r) => r.end > r.start + EPS),
    };
  }
  return out;
}

/**
 * Move events (and their group mates) by dt seconds and optionally `trackDelta` rows (to tracks of the same kind).
 * The move is refused (same project returned) if any event would land on a missing, locked or different-kind track.
 * dt is clamped so nothing starts before 0. Ripple moves the material after the moved events by the same dt.
 */
export function moveEvents(p: Project, ids: Iterable<string>, dt: number, opts: { trackDelta?: number; ripple?: RippleMode } & GroupOpts = {}): Project {
  const delta = Math.round(opts.trackDelta ?? 0);
  const all = new Set(expandGroups(p, ids, opts.groups !== false));
  const moving: { e: EditEvent; ti: number }[] = [];
  p.tracks.forEach((tr, ti) => {
    for (const e of tr.events) if (all.has(e.id) && isEditable(tr, e)) moving.push({ e, ti });
  });
  if (!moving.length) return p;
  const minStart = Math.min(...moving.map((m) => m.e.start));
  const d = Math.max(finite(dt, 0), -minStart);
  for (const { ti } of moving) {
    const dest = p.tracks[ti + delta];
    if (!dest || dest.lock || dest.kind !== p.tracks[ti].kind) return p;
  }
  if (Math.abs(d) < EPS && delta === 0) return p;
  const movedIds = new Set(moving.map((m) => m.e.id));
  // ripple first (on the source tracks, with the original positions as anchors)
  let out = p;
  const ripple = opts.ripple ?? 'off';
  if (ripple !== 'off' && Math.abs(d) >= EPS) {
    const anchors = new Map<string, number>();
    for (const { e, ti } of moving) {
      const id = p.tracks[ti].id;
      anchors.set(id, Math.min(anchors.get(id) ?? Infinity, e.start));
    }
    out = rippleShift(p, ripple, anchors, minStart, d, movedIds);
  }
  const arriving = new Map<number, EditEvent[]>();
  for (const { e, ti } of moving) {
    const list = arriving.get(ti + delta) ?? [];
    list.push(Math.abs(d) < EPS ? e : { ...e, start: Math.max(0, e.start + d) });
    arriving.set(ti + delta, list);
  }
  const tracks = out.tracks.map((tr, ti) => {
    const kept = tr.events.filter((e) => !movedIds.has(e.id));
    const add = arriving.get(ti) ?? [];
    if (kept.length === tr.events.length && !add.length) return tr;
    return { ...tr, events: sortByStart([...kept, ...add]) };
  });
  return withTracks(out, tracks);
}

// ---------------------------------------------------------------------------
// Trim, split, slip, stretch
// ---------------------------------------------------------------------------
/** the timeline window an event's edges may reach without playing outside its medium (files only) */
function edgeLimits(e: EditEvent, m: Media | undefined): { minStart: number; maxEnd: number } {
  const lim = sourceLimits(m);
  // start may go back until srcIn hits lim.min; end may go forward until the source end hits lim.max
  const minStart = Number.isFinite(lim.min) ? Math.min(e.start, e.start - (e.srcIn - lim.min) / e.rate) : -Infinity;
  const srcEnd = e.srcIn + e.length * e.rate;
  const maxEnd = Number.isFinite(lim.max) ? Math.max(eventEnd(e), eventEnd(e) + (lim.max - srcEnd) / e.rate) : Infinity;
  return { minStart: Math.max(0, minStart), maxEnd };
}

/** clamp fades into a new length (each fade ≤ length) */
function fitFades(e: EditEvent): EditEvent {
  const fi = Math.min(e.fadeIn.len, e.length);
  const fo = Math.min(e.fadeOut.len, e.length);
  if (eq(fi, e.fadeIn.len) && eq(fo, e.fadeOut.len)) return e;
  return { ...e, fadeIn: { ...e.fadeIn, len: fi }, fadeOut: { ...e.fadeOut, len: fo } };
}

/**
 * Trim an event's head to timeline time t (clamped to the source and to MIN_EVENT_LEN). The material stays in
 * place on the timeline: srcIn advances by the trimmed amount × rate. With ripple the event's start stays put and
 * everything after it on the affected tracks closes up instead (Vegas ripple trim).
 */
export function trimStart(p: Project, id: string, t: number, opts: { ripple?: RippleMode } = {}): Project {
  const ref = findEvent(p, id);
  if (!ref || !isEditable(ref.track, ref.event)) return p;
  const e = ref.event;
  const { minStart } = edgeLimits(e, p.media[e.mediaId]);
  const ns = clamp(finite(t, e.start), minStart, eventEnd(e) - MIN_EVENT_LEN);
  const delta = ns - e.start;
  if (Math.abs(delta) < EPS) return p;
  const ripple = opts.ripple ?? 'off';
  const moved: EditEvent = fitFades(
    mapEventKeys(
      { ...e, start: ripple === 'off' ? ns : e.start, length: e.length - delta, srcIn: e.srcIn + delta * e.rate },
      shiftKeys(-delta),
    ),
  );
  let out = mapEvents(p, [id], () => moved);
  if (ripple !== 'off') {
    out = rippleShift(out, ripple, new Map([[ref.track.id, e.start + EPS * 2]]), eventEnd(e), -delta, new Set([id]));
  }
  return out;
}

/** Trim an event's tail to timeline time t (clamped to the source end for files). Ripple moves later material. */
export function trimEnd(p: Project, id: string, t: number, opts: { ripple?: RippleMode } = {}): Project {
  const ref = findEvent(p, id);
  if (!ref || !isEditable(ref.track, ref.event)) return p;
  const e = ref.event;
  const { maxEnd } = edgeLimits(e, p.media[e.mediaId]);
  const ne = clamp(finite(t, eventEnd(e)), e.start + MIN_EVENT_LEN, maxEnd);
  const delta = ne - eventEnd(e);
  if (Math.abs(delta) < EPS) return p;
  let out = mapEvents(p, [id], () => fitFades({ ...e, length: ne - e.start }));
  if ((opts.ripple ?? 'off') !== 'off') {
    out = rippleShift(out, opts.ripple ?? 'off', new Map([[ref.track.id, e.start + EPS * 2]]), eventEnd(e), delta, new Set([id]));
  }
  return out;
}

/**
 * Event ids among `ids` whose split at t would fall inside a TRANSITION: t is covered by another event on the same
 * track too (an overlap is a crossfade / film transition). Splitting there would restart the transition from 0 % on
 * the right halves, so splitEvents leaves these alone and the shell says why.
 */
export function splitBlocked(p: Project, ids: Iterable<string>, t: number): string[] {
  const want = new Set(ids);
  const out: string[] = [];
  for (const tr of p.tracks) {
    const covering = tr.events.filter((e) => e.start < t - EPS && t < eventEnd(e) - EPS);
    if (covering.length < 2) continue;
    for (const e of covering) if (want.has(e.id)) out.push(e.id);
  }
  return out;
}

/** a fade-out's gain at event-relative x, for an event of length `len` (1 before the fade starts) */
const fadeOutAt = (f: Fade, len: number, x: number): number => (f.len > 0 && x > len - f.len ? fadeOutGain(f.curve, (x - (len - f.len)) / f.len) : 1);
const fadeInAt = (f: Fade, x: number): number => (f.len > 0 && x < f.len ? fadeInGain(f.curve, x / f.len) : 1);

/** the quietest a baked volume key goes (dB): far below audibility, and it keeps the dB curve short */
const BAKE_FLOOR_DB = -60;

/**
 * Multiply a gain curve `g` over event-relative [t0, t1] into an event's own envelope: the volume envelope (dB, audio)
 * or the opacity envelope (0..1, video). Used when a split leaves part of a fade that no whole Fade can express, so
 * both halves keep playing exactly the gain the original did. Keys outside the window are kept; inside it the
 * existing envelope and g are sampled together (g linearised to a small tolerance).
 */
function bakeGain(e: EditEvent, kind: 'volume' | 'opacity', t0: number, t1: number, g: (t: number) => number): EditEvent {
  if (!(t1 > t0 + EPS)) return e;
  const keys = e.envelopes?.[kind] ?? [];
  const dflt = kind === 'volume' ? 0 : 1;
  const toEnv = kind === 'volume' ? (x: number) => Math.max(BAKE_FLOOR_DB, gainToDb(x)) : (x: number) => x;
  const times = new Set(linearize((t) => toEnv(g(t)), t0, t1, kind === 'volume' ? 0.25 : 0.004).map((pt) => pt.t));
  for (const k of keys) if (k.t > t0 + EPS && k.t < t1 - EPS) times.add(k.t);
  const combine = (t: number): number => {
    const base = sampleEnvelope(keys, t, dflt);
    return clampEnvelopeValue(kind, kind === 'volume' ? base + toEnv(g(t)) : base * g(t));
  };
  const inside: Keyframe[] = [...times].sort((a, b) => a - b).map((t) => ({ t, v: combine(t) }));
  const before = keys.filter((k) => k.t < t0 - EPS);
  const after = keys.filter((k) => k.t > t1 + EPS);
  // past the window the envelope must read what it read before: hold the existing value at t1 when no key follows
  return { ...e, envelopes: { ...e.envelopes, [kind]: [...before, ...inside, ...after] } };
}

/**
 * Split events at timeline time t (events that do not strictly contain t are left alone, and so are events where t
 * is inside a transition: see splitBlocked). The left part keeps the id, fade-in and transition; the right part gets
 * a new id (or `opts.rightIds[id]`), the fade-out, no transition and its keyframes rebased. Both halves play exactly
 * what the original played: a fade the split cuts through becomes envelope points on the half that holds the cut
 * part (volume for audio, opacity for video), since a Fade can only start at an event edge. Grouped events split into
 * a fresh group for the right halves.
 */
export function splitEvents(p: Project, ids: Iterable<string>, t: number, opts: { rightIds?: Record<string, string> } = {}): Project {
  const want = new Set(ids);
  for (const id of splitBlocked(p, want, t)) want.delete(id);
  const taken = projectIds(p);
  const groupMap = new Map<string, string>();
  let changed = false;
  const tracks = p.tracks.map((tr) => {
    if (tr.lock || !tr.events.some((e) => want.has(e.id))) return tr;
    const envKind = tr.kind === 'audio' ? 'volume' : 'opacity';
    const events: EditEvent[] = [];
    tr.events.forEach((e, i) => {
      const local = t - e.start;
      if (!want.has(e.id) || e.lock || local <= MIN_EVENT_LEN / 2 || local >= e.length - MIN_EVENT_LEN / 2) {
        events.push(e);
        return;
      }
      changed = true;
      const len = e.length;
      const rightLen = len - local;
      // an edge that overlaps a neighbour is a transition: its fade is the crossfade's, not ours to bake
      const headShared = tr.events.some((o, j) => j !== i && o.start < e.start - EPS && eventEnd(o) > e.start + EPS);
      const tailShared = tr.events.some((o, j) => j !== i && o.start > e.start + EPS && o.start < eventEnd(e) - EPS && eventEnd(o) > eventEnd(e) + EPS);
      const fi = e.fadeIn;
      const fo = e.fadeOut;

      // left half [0, local]: keeps a fade-in that ends before the cut; anything else of the fades is baked
      const inCut = fi.len > local + EPS;
      const outCut = fo.len > 0 && len - fo.len < local - EPS;
      let left: EditEvent = mapEventKeys({ ...e, length: local, fadeOut: { ...fo, len: 0 } }, pruneKeys(0, local));
      if (inCut && headShared) left = { ...left, fadeIn: { ...fi, len: local } };
      else if (inCut || outCut) {
        if (inCut) left = { ...left, fadeIn: { ...fi, len: 0 } };
        const g = (x: number) => (inCut ? fadeInAt(fi, x) : 1) * (outCut ? fadeOutAt(fo, len, x) : 1);
        left = bakeGain(left, envKind, inCut ? 0 : Math.max(0, len - fo.len), local, g);
      }

      // right half [local, len] (right-relative x' = x − local): keeps a fade-out that starts after the cut
      const rightId = opts.rightIds?.[e.id] ?? uniqueId('e', taken);
      taken.add(rightId);
      let group: string | undefined;
      if (e.group) {
        group = groupMap.get(e.group) ?? uniqueId('g', taken);
        groupMap.set(e.group, group);
      }
      const { transition: _drop, ...rest } = e;
      let right: EditEvent = mapEventKeys(
        { ...rest, id: rightId, start: t, length: rightLen, srcIn: e.srcIn + local * e.rate, fadeIn: { ...fi, len: 0 }, ...(group ? { group } : {}) },
        (keys) => pruneKeys(0, rightLen)(shiftKeys(-local)(keys)),
      );
      const rInCut = fi.len > local + EPS;
      const rOutCut = fo.len > rightLen + EPS;
      if (rOutCut && tailShared) right = { ...right, fadeOut: { ...fo, len: rightLen } };
      else if (rInCut || rOutCut) {
        if (rOutCut) right = { ...right, fadeOut: { ...fo, len: 0 } };
        const g = (x: number) => (rInCut ? fadeInAt(fi, x + local) : 1) * (rOutCut ? fadeOutAt(fo, len, x + local) : 1);
        right = bakeGain(right, envKind, 0, rOutCut ? rightLen : fi.len - local, g);
      }
      events.push(left, right);
    });
    return withEvents(tr, events);
  });
  return changed ? withTracks(p, tracks) : p;
}

/** slip: move the material inside the events (srcIn += dSrc source seconds), clamped to the source for files */
export function slipEvents(p: Project, ids: Iterable<string>, dSrc: number): Project {
  if (!Number.isFinite(dSrc) || Math.abs(dSrc) < EPS) return p;
  return mapEvents(p, ids, (e) => {
    const lim = sourceLimits(p.media[e.mediaId]);
    const span = e.length * e.rate;
    let s = e.srcIn + dSrc;
    if (Number.isFinite(lim.max)) s = Math.min(s, Math.max(e.srcIn, lim.max - span));
    if (Number.isFinite(lim.min)) s = Math.max(s, Math.min(e.srcIn, lim.min));
    return eq(s, e.srcIn) ? e : { ...e, srcIn: s };
  });
}

/**
 * Rate stretch (Vegas ctrl-drag an edge): the event's source span is kept and its timeline length changes, so the
 * rate becomes span / length (clamped to RATE_MIN..RATE_MAX). Dragging 'end' keeps the start, 'start' keeps the end.
 */
export function stretchEvent(p: Project, id: string, edge: 'start' | 'end', t: number): Project {
  const ref = findEvent(p, id);
  if (!ref || !isEditable(ref.track, ref.event)) return p;
  const e = ref.event;
  const span = e.length * e.rate;
  const wanted = edge === 'end' ? finite(t, eventEnd(e)) - e.start : eventEnd(e) - finite(t, e.start);
  const rate = clamp(span / Math.max(MIN_EVENT_LEN, wanted), RATE_MIN, RATE_MAX);
  const length = span / rate;
  if (eq(length, e.length)) return p;
  const start = edge === 'end' ? e.start : Math.max(0, eventEnd(e) - length);
  return mapEvents(p, [id], () => fitFades(mapEventKeys({ ...e, start, length, rate }, scaleKeys(length / e.length))));
}

/**
 * Set an event's rate. keep 'span' (default) keeps the source span and changes the length (start fixed);
 * keep 'length' keeps the timeline length and plays more or less source (clamped to the source for files).
 */
export function setRate(p: Project, id: string, rate: number, keep: 'span' | 'length' = 'span'): Project {
  const ref = findEvent(p, id);
  if (!ref || !isEditable(ref.track, ref.event) || !Number.isFinite(rate)) return p;
  const e = ref.event;
  let r = clamp(rate, RATE_MIN, RATE_MAX);
  if (keep === 'length') {
    const lim = sourceLimits(p.media[e.mediaId]);
    if (Number.isFinite(lim.max)) r = Math.min(r, Math.max(RATE_MIN, (lim.max - e.srcIn) / e.length));
    return eq(r, e.rate) ? p : mapEvents(p, [id], () => ({ ...e, rate: r }));
  }
  const length = (e.length * e.rate) / r;
  if (eq(r, e.rate)) return p;
  return mapEvents(p, [id], () => fitFades(mapEventKeys({ ...e, rate: r, length }, scaleKeys(length / e.length))));
}

// ---------------------------------------------------------------------------
// Fades, levels, properties
// ---------------------------------------------------------------------------
/** set a fade's length (clamped to 0..event length) and/or curve */
export function setFade(p: Project, ids: string | Iterable<string>, which: 'in' | 'out', patch: Partial<Fade>): Project {
  return mapEvents(p, typeof ids === 'string' ? [ids] : ids, (e) => {
    const key = which === 'in' ? 'fadeIn' : 'fadeOut';
    const cur = e[key];
    const len = patch.len === undefined ? cur.len : clamp(finite(patch.len, cur.len), 0, e.length);
    const curve = patch.curve ?? cur.curve;
    if (eq(len, cur.len) && curve === cur.curve) return e;
    return { ...e, [key]: { len, curve } };
  });
}

/** the event volume line (audio, dB) */
export function setEventGain(p: Project, ids: string | Iterable<string>, db: number): Project {
  const v = clamp(finite(db, 0), GAIN_MIN_DB, GAIN_MAX_DB);
  return mapEvents(p, typeof ids === 'string' ? [ids] : ids, (e) => (eq(e.gainDb ?? 0, v) ? e : { ...e, gainDb: v }));
}

/** the event opacity line (video, 0..1) */
export function setEventOpacity(p: Project, ids: string | Iterable<string>, opacity: number): Project {
  const v = clamp(finite(opacity, 1), 0, 1);
  return mapEvents(p, typeof ids === 'string' ? [ids] : ids, (e) => (eq(e.opacity ?? 1, v) ? e : { ...e, opacity: v }));
}

export type EventPropsPatch = Partial<Pick<EditEvent, 'label' | 'color' | 'mute' | 'lock'>>;

/** label / colour / mute / lock (lock and unlock work on locked events; locked tracks still refuse) */
export function setEventProps(p: Project, ids: string | Iterable<string>, patch: EventPropsPatch): Project {
  const onlyLock = Object.keys(patch).every((k) => k === 'lock');
  return mapEvents(
    p,
    typeof ids === 'string' ? [ids] : ids,
    (e, tr) => {
      if (tr.lock) return e;
      // absent, '' and false are the same value (the key is dropped)
      const keys = (Object.keys(patch) as (keyof EventPropsPatch)[]).filter((k) => patch[k] !== undefined);
      if (keys.every((k) => (e[k] || undefined) === (patch[k] || undefined))) return e;
      const out: EditEvent = { ...e };
      if (patch.label !== undefined) {
        if (patch.label) out.label = patch.label;
        else delete out.label;
      }
      if (patch.color !== undefined) {
        if (patch.color) out.color = patch.color;
        else delete out.color;
      }
      if (patch.mute !== undefined) {
        if (patch.mute) out.mute = true;
        else delete out.mute;
      }
      if (patch.lock !== undefined) {
        if (patch.lock) out.lock = true;
        else delete out.lock;
      }
      return out;
    },
    { ignoreLock: onlyLock },
  );
}

/** override a text event's spec (merged into event.text; `null` clears the override) */
export function setEventText(p: Project, id: string, patch: Partial<TextSpec> | null): Project {
  return mapEvents(p, [id], (e) => {
    if (patch === null) {
      if (!e.text) return e;
      const { text: _t, ...rest } = e;
      return rest;
    }
    return { ...e, text: { ...e.text, ...patch } };
  });
}

// ---------------------------------------------------------------------------
// Envelopes
// ---------------------------------------------------------------------------
export type EnvelopeName = 'volume' | 'pan' | 'opacity';
/** an event envelope (event-relative time) or a track envelope (timeline time) */
export interface EnvelopeTarget {
  scope: 'event' | 'track';
  id: string;
  env: EnvelopeName;
}

/** clamp an envelope value: volume is a dB offset, pan -1..1, opacity 0..1 */
export function clampEnvelopeValue(env: EnvelopeName, v: number): number {
  if (env === 'volume') return clamp(finite(v, 0), GAIN_MIN_DB, GAIN_MAX_DB);
  if (env === 'pan') return clamp(finite(v, 0), -1, 1);
  return clamp(finite(v, 1), 0, 1);
}

/** read / write an envelope through a target; returns p when the target is missing or not editable */
function editEnvelope(p: Project, target: EnvelopeTarget, fn: (keys: Keyframe[], maxT: number) => Keyframe[] | null): Project {
  if (target.scope === 'event') {
    return mapEvents(p, [target.id], (e) => {
      const keys = e.envelopes?.[target.env] ?? [];
      const next = fn(keys, e.length);
      if (!next) return e;
      const envelopes = { ...e.envelopes };
      if (next.length) envelopes[target.env] = next;
      else delete envelopes[target.env];
      return { ...e, envelopes };
    });
  }
  const hit = findTrack(p, target.id);
  if (!hit || hit.track.lock) return p;
  const keys = hit.track.envelopes?.[target.env] ?? [];
  const next = fn(keys, Infinity);
  if (!next) return p;
  const envelopes = { ...hit.track.envelopes };
  if (next.length) envelopes[target.env] = next;
  else delete envelopes[target.env];
  const tracks = p.tracks.slice();
  tracks[hit.index] = { ...hit.track, envelopes };
  return { ...p, tracks };
}

/** add a point (replaces a point at the same time); keys stay sorted */
export function addEnvelopePoint(p: Project, target: EnvelopeTarget, key: Keyframe): Project {
  return editEnvelope(p, target, (keys, maxT) => {
    const t = clamp(finite(key.t, 0), 0, maxT);
    const k: Keyframe = { t, v: clampEnvelopeValue(target.env, key.v), ...(key.curve ? { curve: key.curve } : {}) };
    const rest = keys.filter((x) => Math.abs(x.t - t) > EPS);
    return [...rest, k].sort((a, b) => a.t - b.t);
  });
}

/** move a point; its time is held between its neighbours so point indices are stable while dragging */
export function moveEnvelopePoint(p: Project, target: EnvelopeTarget, index: number, patch: { t?: number; v?: number }): Project {
  return editEnvelope(p, target, (keys, maxT) => {
    const k = keys[index];
    if (!k) return null;
    const lo = index > 0 ? keys[index - 1].t + EPS * 10 : 0;
    const hi = index < keys.length - 1 ? keys[index + 1].t - EPS * 10 : maxT;
    const t = patch.t === undefined ? k.t : clamp(finite(patch.t, k.t), lo, Math.max(lo, hi));
    const v = patch.v === undefined ? k.v : clampEnvelopeValue(target.env, patch.v);
    if (eq(t, k.t) && eq(v, k.v)) return null;
    const out = keys.slice();
    out[index] = { ...k, t, v };
    return out;
  });
}

export function deleteEnvelopePoint(p: Project, target: EnvelopeTarget, index: number): Project {
  return editEnvelope(p, target, (keys) => (keys[index] ? keys.filter((_, i) => i !== index) : null));
}

export function setEnvelopeCurve(p: Project, target: EnvelopeTarget, index: number, curve: NonNullable<Keyframe['curve']>): Project {
  return editEnvelope(p, target, (keys) => {
    const k = keys[index];
    if (!k || k.curve === curve) return null;
    const out = keys.slice();
    out[index] = { ...k, curve };
    return out;
  });
}

export function clearEnvelope(p: Project, target: EnvelopeTarget): Project {
  return editEnvelope(p, target, (keys) => (keys.length ? [] : null));
}

// ---------------------------------------------------------------------------
// Event Pan/Crop
// ---------------------------------------------------------------------------
function cleanPanCrop(v: PanCrop): PanCrop {
  return { x: finite(v.x, 0), y: finite(v.y, 0), zoom: Math.max(0.01, finite(v.zoom, 1)), rot: finite(v.rot, 0) };
}

/** set the Pan/Crop at event-relative t (adds a key, or replaces the key at that time) */
export function setPanCropKey(p: Project, id: string, t: number, value: PanCrop, curve?: Keyframe['curve']): Project {
  return mapEvents(p, [id], (e) => {
    const tt = clamp(finite(t, 0), 0, e.length);
    const keys = (e.panCrop ?? []).filter((k) => Math.abs(k.t - tt) > EPS);
    const k: Keyframe<PanCrop> = { t: tt, v: cleanPanCrop(value), ...(curve ? { curve } : {}) };
    return { ...e, panCrop: [...keys, k].sort((a, b) => a.t - b.t) };
  });
}

export function movePanCropKey(p: Project, id: string, index: number, t: number): Project {
  return mapEvents(p, [id], (e) => {
    const keys = e.panCrop ?? [];
    const k = keys[index];
    if (!k) return e;
    const lo = index > 0 ? keys[index - 1].t + EPS * 10 : 0;
    const hi = index < keys.length - 1 ? keys[index + 1].t - EPS * 10 : e.length;
    const tt = clamp(finite(t, k.t), lo, Math.max(lo, hi));
    if (eq(tt, k.t)) return e;
    const out = keys.slice();
    out[index] = { ...k, t: tt };
    return { ...e, panCrop: out };
  });
}

export function deletePanCropKey(p: Project, id: string, index: number): Project {
  return mapEvents(p, [id], (e) => {
    const keys = e.panCrop ?? [];
    if (!keys[index]) return e;
    const out = keys.filter((_, i) => i !== index);
    if (out.length) return { ...e, panCrop: out };
    const { panCrop: _pc, ...rest } = e;
    return rest;
  });
}

export function resetPanCrop(p: Project, id: string): Project {
  return mapEvents(p, [id], (e) => {
    if (!e.panCrop) return e;
    const { panCrop: _pc, ...rest } = e;
    return rest;
  });
}

// ---------------------------------------------------------------------------
// FX chains (events and tracks)
// ---------------------------------------------------------------------------
export interface FxTarget {
  scope: 'event' | 'track';
  id: string;
}

type FxOwner = Pick<EditEvent, 'videoFx' | 'audioFx'>;

function editFx<T extends FxOwner>(owner: T, fn: (o: FxOwner) => FxOwner | null): T | null {
  const n = fn(owner);
  if (!n) return null;
  const out: T = { ...owner };
  if (n.videoFx?.length) out.videoFx = n.videoFx;
  else delete out.videoFx;
  if (n.audioFx?.length) out.audioFx = n.audioFx;
  else delete out.audioFx;
  return out;
}

function withFx(p: Project, target: FxTarget, fn: (o: FxOwner) => FxOwner | null): Project {
  if (target.scope === 'event') return mapEvents(p, [target.id], (e) => editFx(e, fn) ?? e);
  const hit = findTrack(p, target.id);
  if (!hit || hit.track.lock) return p;
  const n = editFx(hit.track, fn);
  if (!n) return p;
  const tracks = p.tracks.slice();
  tracks[hit.index] = n;
  return { ...p, tracks };
}

export function addVideoFx(p: Project, target: FxTarget, kind: VideoFxKind, opts: { value?: number | Keyframe[]; id?: string } = {}): Project {
  const fx: VideoFx = { id: opts.id ?? newId('fx'), kind, enabled: true, value: opts.value ?? VIDEO_FX_DEFAULT[kind] };
  return withFx(p, target, (o) => ({ ...o, videoFx: [...(o.videoFx ?? []), fx] }));
}

/** add an audio FX; params the engine does not get here take its defaults */
export function addAudioFx(p: Project, target: FxTarget, kind: AudioFxKind, opts: { params?: Record<string, number>; id?: string } = {}): Project {
  const fx: AudioFx = { id: opts.id ?? newId('fx'), kind, enabled: true, params: { ...opts.params } };
  return withFx(p, target, (o) => ({ ...o, audioFx: [...(o.audioFx ?? []), fx] }));
}

export function removeFx(p: Project, target: FxTarget, fxId: string): Project {
  return withFx(p, target, (o) => {
    const v = o.videoFx?.filter((f) => f.id !== fxId);
    const a = o.audioFx?.filter((f) => f.id !== fxId);
    if ((v?.length ?? 0) === (o.videoFx?.length ?? 0) && (a?.length ?? 0) === (o.audioFx?.length ?? 0)) return null;
    return { videoFx: v, audioFx: a };
  });
}

/** reorder an FX within its chain */
export function moveFx(p: Project, target: FxTarget, fxId: string, toIndex: number): Project {
  const reorder = <F extends { id: string }>(list: F[] | undefined): F[] | undefined | null => {
    if (!list) return undefined;
    const i = list.findIndex((f) => f.id === fxId);
    if (i < 0) return undefined;
    const j = clamp(Math.round(toIndex), 0, list.length - 1);
    if (i === j) return null;
    const out = list.slice();
    const [f] = out.splice(i, 1);
    out.splice(j, 0, f);
    return out;
  };
  return withFx(p, target, (o) => {
    const v = reorder(o.videoFx);
    const a = reorder(o.audioFx);
    if (v === null || a === null || (v === undefined && a === undefined)) return null;
    return { videoFx: v ?? o.videoFx, audioFx: a ?? o.audioFx };
  });
}

export function setFxEnabled(p: Project, target: FxTarget, fxId: string, enabled: boolean): Project {
  return withFx(p, target, (o) => {
    const hitV = o.videoFx?.some((f) => f.id === fxId && f.enabled !== enabled);
    const hitA = o.audioFx?.some((f) => f.id === fxId && f.enabled !== enabled);
    if (!hitV && !hitA) return null;
    return {
      videoFx: o.videoFx?.map((f) => (f.id === fxId ? { ...f, enabled } : f)),
      audioFx: o.audioFx?.map((f) => (f.id === fxId ? { ...f, enabled } : f)),
    };
  });
}

/** a video FX's constant value or keyframes (event FX: event-relative time; track FX: timeline time) */
export function setVideoFxValue(p: Project, target: FxTarget, fxId: string, value: number | Keyframe[]): Project {
  const v = Array.isArray(value) ? value.filter((k) => Number.isFinite(k.t) && Number.isFinite(k.v)).sort((a, b) => a.t - b.t) : value;
  if (!Array.isArray(v) && !Number.isFinite(v)) return p;
  return withFx(p, target, (o) => {
    if (!o.videoFx?.some((f) => f.id === fxId)) return null;
    return { ...o, videoFx: o.videoFx.map((f) => (f.id === fxId ? { ...f, value: v } : f)) };
  });
}

export function setAudioFxParam(p: Project, target: FxTarget, fxId: string, name: string, value: number): Project {
  if (!Number.isFinite(value)) return p;
  return withFx(p, target, (o) => {
    const fx = o.audioFx?.find((f) => f.id === fxId);
    if (!fx || fx.params[name] === value) return null;
    return { ...o, audioFx: o.audioFx!.map((f) => (f.id === fxId ? { ...f, params: { ...f.params, [name]: value } } : f)) };
  });
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------
/** how this event composites over its overlap with the previous event (null removes it = default crossfade) */
export function setTransition(p: Project, id: string, kind: TransitionKind | null): Project {
  return mapEvents(p, [id], (e) => {
    if (kind === null) {
      if (!e.transition) return e;
      const { transition: _t, ...rest } = e;
      return rest;
    }
    return e.transition?.kind === kind ? e : { ...e, transition: { kind } };
  });
}

/** the event on the same track that the given event transitions from (starts earlier, ends at/after its start) */
export function previousNeighbour(track: Track, e: EditEvent): EditEvent | null {
  let best: EditEvent | null = null;
  for (const o of track.events) {
    if (o.id === e.id || o.start >= e.start - EPS) continue;
    if (eventEnd(o) < e.start - 1e-4) continue;
    if (!best || o.start > best.start) best = o;
  }
  return best;
}

/**
 * Make (or resize, or remove with dur 0) the transition at the cut before `rightId`, the way the film does it:
 * the overlap straddles the cut, the left event extends dur/2 past it and the right event starts dur/2 early with
 * its srcIn pulled back by the same amount (a shot then plays negative local time). The cut point is the centre of
 * any existing overlap. dur is limited by both events' lengths (≤ 90 %, as the reel does) and by file sources.
 */
export function setOverlapAtCut(p: Project, rightId: string, dur: number, kind?: TransitionKind): Project {
  const ref = findEvent(p, rightId);
  if (!ref || !isEditable(ref.track, ref.event)) return p;
  const right = ref.event;
  const left = previousNeighbour(ref.track, right);
  if (!left || left.lock) return p;
  const cut = (right.start + Math.min(eventEnd(left), eventEnd(right))) / 2;
  const curHalf = Math.max(0, eventEnd(left) - right.start) / 2;
  // core lengths (without the current overlap halves) bound the new overlap
  const leftCore = cut - left.start;
  const rightCore = eventEnd(right) - cut;
  let half = Math.max(0, finite(dur, 0)) / 2;
  half = Math.min(half, leftCore * 0.9, rightCore * 0.9);
  const lim = edgeLimits({ ...left, length: leftCore }, p.media[left.mediaId]);
  half = Math.min(half, lim.maxEnd - cut);
  const rLim = edgeLimits({ ...right, start: cut, length: rightCore, srcIn: right.srcIn + (cut - right.start) * right.rate }, p.media[right.mediaId]);
  half = Math.max(0, Math.min(half, cut - rLim.minStart));
  if (eq(half, curHalf) && (half === 0 || !kind || right.transition?.kind === kind)) return p;
  const newLeft: EditEvent = { ...left, length: cut + half - left.start };
  const rs = cut - half;
  let newRight: EditEvent = mapEventKeys(
    { ...right, start: rs, length: eventEnd(right) - rs, srcIn: right.srcIn + (rs - right.start) * right.rate },
    shiftKeys(right.start - rs),
  );
  if (half > 0) newRight = { ...newRight, transition: { kind: kind ?? right.transition?.kind ?? 'crossfade' } };
  else if (newRight.transition) {
    const { transition: _t, ...rest } = newRight;
    newRight = rest;
  }
  return mapEvents(p, [left.id, right.id], (e) => (e.id === left.id ? newLeft : newRight));
}

// ---------------------------------------------------------------------------
// Tracks
// ---------------------------------------------------------------------------
export function addTrack(p: Project, kind: TrackKind, opts: { index?: number; name?: string; id?: string; height?: number } = {}): Project {
  const id = opts.id ?? uniqueId(kind === 'video' ? 'tv' : 'ta', projectIds(p));
  if (findTrack(p, id)) return p;
  const n = p.tracks.filter((t) => t.kind === kind).length + 1;
  const track: Track = {
    id,
    kind,
    name: opts.name ?? (kind === 'video' ? `Video ${n}` : `Audio ${n}`),
    events: [],
    mute: false,
    solo: false,
    lock: false,
    height: clamp(opts.height ?? (kind === 'video' ? 64 : 56), TRACK_HEIGHT_MIN, TRACK_HEIGHT_MAX),
    ...(kind === 'audio' ? { gainDb: 0, pan: 0 } : { opacity: 1 }),
  };
  // default position: video tracks after the last video track, audio tracks at the bottom
  let lastVideo = -1;
  for (let i = 0; i < p.tracks.length; i++) if (p.tracks[i].kind === 'video') lastVideo = i;
  const index = clamp(Math.round(opts.index ?? (kind === 'video' ? lastVideo + 1 : p.tracks.length)), 0, p.tracks.length);
  const tracks = p.tracks.slice();
  tracks.splice(index, 0, track);
  return { ...p, tracks };
}

/** remove a track with its events; other tracks stop ducking under it */
export function removeTrack(p: Project, id: string): Project {
  if (!findTrack(p, id)) return p;
  const tracks = p.tracks
    .filter((t) => t.id !== id)
    .map((t) => {
      if (!t.duck?.by.includes(id)) return t;
      const by = t.duck.by.filter((b) => b !== id);
      if (by.length) return { ...t, duck: { ...t.duck, by } };
      const { duck: _d, ...rest } = t;
      return rest;
    });
  return { ...p, tracks };
}

export function moveTrack(p: Project, id: string, toIndex: number): Project {
  const hit = findTrack(p, id);
  if (!hit) return p;
  const j = clamp(Math.round(toIndex), 0, p.tracks.length - 1);
  if (j === hit.index) return p;
  const tracks = p.tracks.slice();
  tracks.splice(hit.index, 1);
  tracks.splice(j, 0, hit.track);
  return { ...p, tracks };
}

export type TrackPatch = Partial<Pick<Track, 'name' | 'mute' | 'solo' | 'lock' | 'height' | 'color' | 'gainDb' | 'pan' | 'opacity' | 'blend'>>;

/** set track properties (values clamped to their ranges); lock/unlock and mute/solo work on locked tracks */
export function setTrackProps(p: Project, id: string, patch: TrackPatch): Project {
  const hit = findTrack(p, id);
  if (!hit) return p;
  const t = hit.track;
  const n: Track = { ...t };
  if (patch.name !== undefined) n.name = patch.name.trim() || t.name;
  if (patch.mute !== undefined) n.mute = patch.mute;
  if (patch.solo !== undefined) n.solo = patch.solo;
  if (patch.lock !== undefined) n.lock = patch.lock;
  if (patch.height !== undefined) n.height = Math.round(clamp(finite(patch.height, t.height), TRACK_HEIGHT_MIN, TRACK_HEIGHT_MAX));
  if (patch.color !== undefined) n.color = patch.color;
  if (patch.gainDb !== undefined) n.gainDb = clamp(finite(patch.gainDb, 0), GAIN_MIN_DB, GAIN_MAX_DB);
  if (patch.pan !== undefined) n.pan = clamp(finite(patch.pan, 0), -1, 1);
  if (patch.opacity !== undefined) n.opacity = clamp(finite(patch.opacity, 1), 0, 1);
  if (patch.blend !== undefined) n.blend = patch.blend;
  const keys = Object.keys(n) as (keyof Track)[];
  if (keys.length === Object.keys(t).length && keys.every((k) => n[k] === t[k])) return p;
  const tracks = p.tracks.slice();
  tracks[hit.index] = n;
  return { ...p, tracks };
}

export function renameTrack(p: Project, id: string, name: string): Project {
  return setTrackProps(p, id, { name });
}

export function toggleTrackFlag(p: Project, id: string, flag: 'mute' | 'solo' | 'lock'): Project {
  const hit = findTrack(p, id);
  return hit ? setTrackProps(p, id, { [flag]: !hit.track[flag] }) : p;
}

/** the track level: audio = gain (dB), video = composite opacity (0..1) */
export function setTrackLevel(p: Project, id: string, v: number): Project {
  const hit = findTrack(p, id);
  if (!hit) return p;
  return setTrackProps(p, id, hit.track.kind === 'audio' ? { gainDb: v } : { opacity: v });
}

export function setTrackPan(p: Project, id: string, pan: number): Project {
  return setTrackProps(p, id, { pan });
}

export function setTrackHeight(p: Project, id: string, height: number): Project {
  return setTrackProps(p, id, { height });
}

/** duck an audio track under other audio tracks (null removes it); attack/release in seconds */
export function setTrackDuck(p: Project, id: string, duck: Track['duck'] | null): Project {
  const hit = findTrack(p, id);
  if (!hit || hit.track.kind !== 'audio') return p;
  if (!duck) {
    if (!hit.track.duck) return p;
    const { duck: _d, ...rest } = hit.track;
    const tracks = p.tracks.slice();
    tracks[hit.index] = rest;
    return { ...p, tracks };
  }
  const audio = new Set(p.tracks.filter((t) => t.kind === 'audio' && t.id !== id).map((t) => t.id));
  const by = [...new Set(duck.by)].filter((b) => audio.has(b));
  if (!by.length) return setTrackDuck(p, id, null);
  const clean: NonNullable<Track['duck']> = {
    by,
    depthDb: clamp(finite(duck.depthDb, 6), 0, 60),
    attack: Math.max(0, finite(duck.attack, 0.02)),
    release: Math.max(0, finite(duck.release, 0.5)),
    ...(duck.threshold !== undefined && Number.isFinite(duck.threshold) ? { threshold: duck.threshold } : {}),
  };
  const tracks = p.tracks.slice();
  tracks[hit.index] = { ...hit.track, duck: clean };
  return { ...p, tracks };
}

// ---------------------------------------------------------------------------
// Media pool
// ---------------------------------------------------------------------------
export function addMedia(p: Project, m: Media): Project {
  if (p.media[m.id] === m) return p;
  return { ...p, media: { ...p.media, [m.id]: m } };
}

/** patch a medium (label, tags, a text generator's spec …); id and kind cannot change */
export function updateMedia(p: Project, id: string, patch: Partial<Media>): Project {
  const m = p.media[id];
  if (!m) return p;
  const next = { ...m, ...patch, id: m.id, kind: m.kind } as Media;
  return { ...p, media: { ...p.media, [id]: next } };
}

/** remove a medium and every event that uses it */
export function removeMedia(p: Project, id: string): Project {
  if (!p.media[id]) return p;
  const { [id]: _gone, ...media } = p.media;
  const tracks = p.tracks.map((tr) => withEvents(tr, tr.events.filter((e) => e.mediaId !== id)));
  return { ...p, media, tracks };
}

// ---------------------------------------------------------------------------
// Markers and regions
// ---------------------------------------------------------------------------
const byT = (a: Marker, b: Marker) => a.t - b.t;
const byStart = (a: Region, b: Region) => a.start - b.start;

export function addMarker(p: Project, t: number, label = '', opts: { id?: string; color?: string } = {}): Project {
  if (!Number.isFinite(t)) return p;
  const m: Marker = { id: opts.id ?? newId('mk'), t: Math.max(0, t), label, ...(opts.color ? { color: opts.color } : {}) };
  return { ...p, markers: [...p.markers, m].sort(byT) };
}

export function updateMarker(p: Project, id: string, patch: Partial<Omit<Marker, 'id'>>): Project {
  const i = p.markers.findIndex((m) => m.id === id);
  if (i < 0) return p;
  const cur = p.markers[i];
  const next: Marker = { ...cur, ...patch, id, t: Math.max(0, finite(patch.t ?? cur.t, cur.t)) };
  if (next.t === cur.t && next.label === cur.label && next.color === cur.color) return p;
  const markers = p.markers.slice();
  markers[i] = next;
  return { ...p, markers: markers.sort(byT) };
}

export function moveMarker(p: Project, id: string, t: number): Project {
  return updateMarker(p, id, { t });
}

export function deleteMarkers(p: Project, ids: Iterable<string>): Project {
  const gone = new Set(ids);
  const markers = p.markers.filter((m) => !gone.has(m.id));
  return markers.length === p.markers.length ? p : { ...p, markers };
}

export function addRegion(p: Project, start: number, end: number, label = '', opts: { id?: string; color?: string } = {}): Project {
  const a = Math.max(0, Math.min(start, end));
  const b = Math.max(start, end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b - a < EPS) return p;
  const r: Region = { id: opts.id ?? newId('rg'), start: a, end: b, label, ...(opts.color ? { color: opts.color } : {}) };
  return { ...p, regions: [...p.regions, r].sort(byStart) };
}

/** patch a region; start/end are re-ordered if they cross, and a region keeps a positive length */
export function updateRegion(p: Project, id: string, patch: Partial<Omit<Region, 'id'>>): Project {
  const i = p.regions.findIndex((r) => r.id === id);
  if (i < 0) return p;
  const cur = p.regions[i];
  const s = Math.max(0, finite(patch.start ?? cur.start, cur.start));
  const e = Math.max(0, finite(patch.end ?? cur.end, cur.end));
  const start = Math.min(s, e);
  const end = Math.max(Math.max(s, e), start + EPS * 10);
  const next: Region = { ...cur, ...patch, id, start, end };
  if (next.start === cur.start && next.end === cur.end && next.label === cur.label && next.color === cur.color) return p;
  const regions = p.regions.slice();
  regions[i] = next;
  return { ...p, regions: regions.sort(byStart) };
}

/** move a whole region by dt (it cannot start before 0) */
export function moveRegion(p: Project, id: string, dt: number): Project {
  const r = p.regions.find((x) => x.id === id);
  if (!r) return p;
  const d = Math.max(finite(dt, 0), -r.start);
  return updateRegion(p, id, { start: r.start + d, end: r.end + d });
}

export function deleteRegions(p: Project, ids: Iterable<string>): Project {
  const gone = new Set(ids);
  const regions = p.regions.filter((r) => !gone.has(r.id));
  return regions.length === p.regions.length ? p : { ...p, regions };
}

// ---------------------------------------------------------------------------
// Clipboard (plain JSON; times relative to the earliest copied start)
// ---------------------------------------------------------------------------
export interface ClipboardItem {
  kind: TrackKind;
  /** row offset from the topmost copied track of the same kind */
  rank: number;
  /** that track's absolute rank among tracks of its kind when copied (paste falls back to it) */
  srcRank: number;
  /** the event; `start` is relative to the clipboard origin */
  event: EditEvent;
}
export interface EditClipboard {
  type: 'orly-editor/clipboard';
  version: 1;
  /** seconds from the earliest copied start to the latest copied end */
  length: number;
  items: ClipboardItem[];
  /** every medium the items use (pasting into another project brings them along) */
  media: Record<string, Media>;
}

export function isClipboard(x: unknown): x is EditClipboard {
  if (!x || typeof x !== 'object') return false;
  const c = x as Partial<EditClipboard>;
  return c.type === 'orly-editor/clipboard' && c.version === 1 && Array.isArray(c.items) && !!c.media && typeof c.media === 'object';
}

/** copy events (with their group mates) into a clipboard; null when nothing is selected */
export function copyEvents(p: Project, ids: Iterable<string>, opts: GroupOpts = {}): EditClipboard | null {
  const want = new Set(expandGroups(p, ids, opts.groups !== false));
  const found: { e: EditEvent; tr: Track; rank: number }[] = [];
  const rankOf = new Map<string, number>();
  const count: Record<TrackKind, number> = { video: 0, audio: 0 };
  for (const tr of p.tracks) rankOf.set(tr.id, count[tr.kind]++);
  for (const tr of p.tracks) for (const e of tr.events) if (want.has(e.id)) found.push({ e, tr, rank: rankOf.get(tr.id)! });
  if (!found.length) return null;
  const origin = Math.min(...found.map((f) => f.e.start));
  const end = Math.max(...found.map((f) => eventEnd(f.e)));
  const top: Record<TrackKind, number> = { video: Infinity, audio: Infinity };
  for (const f of found) top[f.tr.kind] = Math.min(top[f.tr.kind], f.rank);
  const media: Record<string, Media> = {};
  for (const f of found) {
    const m = p.media[f.e.mediaId];
    if (m) media[m.id] = m;
  }
  return {
    type: 'orly-editor/clipboard',
    version: 1,
    length: end - origin,
    items: found.map((f) => ({ kind: f.tr.kind, rank: f.rank - top[f.tr.kind], srcRank: f.rank, event: { ...f.e, start: f.e.start - origin } })),
    media,
  };
}

/** clipboard -> text (Infinity media lengths survive as the string "Infinity") */
export function serializeClipboard(c: EditClipboard): string {
  return JSON.stringify(c, (_k, v: unknown) => (v === Infinity ? 'Infinity' : v));
}

/** text -> clipboard, or null when the text is not one */
export function parseClipboard(text: string): EditClipboard | null {
  try {
    const raw: unknown = JSON.parse(text, (k, v: unknown) => (k === 'duration' && (v === 'Infinity' || v === null) ? Infinity : v));
    return isClipboard(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Paste a clipboard at timeline time t. Items of the target track's kind land on that track (and the rows below it,
 * by their relative rank); items of the other kind land back on their original rows. Missing rows are created.
 * Pasted events get new ids (and new group ids); missing media are added to the pool. With ripple, later material on
 * the target tracks (or everything, 'all') moves right by the clipboard length first.
 */
export function pasteEvents(p: Project, clip: EditClipboard, t: number, opts: { trackId?: string | null; ripple?: RippleMode } = {}): Project {
  if (!clip.items.length || !Number.isFinite(t)) return p;
  const at = Math.max(0, t);
  let out: Project = p;
  // pool
  const missing = Object.values(clip.media).filter((m) => !out.media[m.id]);
  if (missing.length) out = { ...out, media: { ...out.media, ...Object.fromEntries(missing.map((m) => [m.id, m])) } };
  // destination rows per kind
  const target = opts.trackId ? findTrack(out, opts.trackId)?.track : undefined;
  const rowsOf = (pp: Project, kind: TrackKind) => pp.tracks.filter((tr) => tr.kind === kind);
  const base: Record<TrackKind, number> = { video: 0, audio: 0 };
  for (const kind of ['video', 'audio'] as const) {
    const items = clip.items.filter((i) => i.kind === kind);
    if (!items.length) continue;
    base[kind] = target?.kind === kind ? rowsOf(out, kind).indexOf(target) : Math.min(...items.map((i) => i.srcRank - i.rank));
    const need = base[kind] + Math.max(...items.map((i) => i.rank)) + 1;
    while (rowsOf(out, kind).length < need) out = addTrack(out, kind);
  }
  const dest = (i: ClipboardItem): Track => rowsOf(out, i.kind)[base[i.kind] + i.rank];
  if (clip.items.some((i) => dest(i).lock)) return p;
  // ripple: open a gap on the destination tracks
  const ripple = opts.ripple ?? 'off';
  if (ripple !== 'off') {
    const anchors = new Map(clip.items.map((i) => [dest(i).id, at] as const));
    out = rippleShift(out, ripple, anchors, at, clip.length, new Set());
  }
  const taken = projectIds(out);
  const groups = new Map<string, string>();
  const adds = new Map<string, EditEvent[]>();
  for (const i of clip.items) {
    if (!out.media[i.event.mediaId]) continue;
    const ev: EditEvent = { ...i.event, id: uniqueId('e', taken), start: at + i.event.start };
    if (i.event.group) {
      const g = groups.get(i.event.group) ?? uniqueId('g', taken);
      groups.set(i.event.group, g);
      ev.group = g;
    }
    const tr = dest(i);
    adds.set(tr.id, [...(adds.get(tr.id) ?? []), ev]);
  }
  return withTracks(
    out,
    out.tracks.map((tr) => (adds.has(tr.id) ? { ...tr, events: sortByStart([...tr.events, ...adds.get(tr.id)!]) } : tr)),
  );
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------
/** put events in one group (a fresh id unless given); needs at least two events */
export function groupEvents(p: Project, ids: Iterable<string>, groupId?: string): Project {
  const list = [...new Set(ids)].filter((id) => findEvent(p, id));
  if (list.length < 2) return p;
  const g = groupId ?? uniqueId('g', projectIds(p));
  return mapEvents(p, list, (e) => (e.group === g ? e : { ...e, group: g }), { ignoreLock: true });
}

/** take events out of their groups (a group left with one member dissolves) */
export function ungroupEvents(p: Project, ids: Iterable<string>): Project {
  const out = mapEvents(
    p,
    ids,
    (e) => {
      if (!e.group) return e;
      const { group: _g, ...rest } = e;
      return rest;
    },
    { ignoreLock: true },
  );
  return out === p ? p : dissolveSingletonGroups(out);
}

function dissolveSingletonGroups(p: Project): Project {
  const count = new Map<string, number>();
  for (const tr of p.tracks) for (const e of tr.events) if (e.group) count.set(e.group, (count.get(e.group) ?? 0) + 1);
  const lonely = [...count].filter(([, n]) => n < 2).map(([g]) => g);
  if (!lonely.length) return p;
  const set = new Set(lonely);
  return withTracks(
    p,
    p.tracks.map((tr) =>
      withEvents(
        tr,
        tr.events.map((e) => {
          if (!e.group || !set.has(e.group)) return e;
          const { group: _g, ...rest } = e;
          return rest;
        }),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Normalize
// ---------------------------------------------------------------------------
function sortKeys<V>(keys: Keyframe<V>[] | undefined): Keyframe<V>[] | undefined {
  if (!keys) return keys;
  const ok = keys.filter((k) => Number.isFinite(k.t));
  for (let i = 1; i < ok.length; i++) if (ok[i].t < ok[i - 1].t) return [...ok].sort((a, b) => a.t - b.t);
  return ok.length === keys.length ? keys : ok;
}

/** one event made consistent; returns the same object when it already is, null when it should go */
function normalizeEvent(e: EditEvent): EditEvent | null {
  if (!(e.length > EPS) || !Number.isFinite(e.length) || !Number.isFinite(e.start)) return null;
  let out = e;
  const set = <K extends keyof EditEvent>(k: K, v: EditEvent[K]) => {
    if (out[k] !== v) out = { ...out, [k]: v };
  };
  if (e.start < 0) {
    // keep the material where it was: a negative start becomes a head trim
    const cut = -e.start;
    if (cut >= e.length - EPS) return null;
    out = mapEventKeys({ ...out, start: 0, length: e.length - cut, srcIn: e.srcIn + cut * e.rate }, shiftKeys(-cut));
  }
  if (!(out.rate > 0) || !Number.isFinite(out.rate)) set('rate', 1);
  else if (out.rate < RATE_MIN || out.rate > RATE_MAX) set('rate', clamp(out.rate, RATE_MIN, RATE_MAX));
  if (!Number.isFinite(out.srcIn)) set('srcIn', 0);
  out = fitFades(out);
  if (out.opacity !== undefined && (out.opacity < 0 || out.opacity > 1)) set('opacity', clamp(out.opacity, 0, 1));
  if (out.gainDb !== undefined && (out.gainDb < GAIN_MIN_DB || out.gainDb > GAIN_MAX_DB)) set('gainDb', clamp(out.gainDb, GAIN_MIN_DB, GAIN_MAX_DB));
  if (out.envelopes) {
    const v = sortKeys(out.envelopes.volume);
    const pn = sortKeys(out.envelopes.pan);
    const o = sortKeys(out.envelopes.opacity);
    if (v !== out.envelopes.volume || pn !== out.envelopes.pan || o !== out.envelopes.opacity) {
      out = { ...out, envelopes: { ...(v ? { volume: v } : {}), ...(pn ? { pan: pn } : {}), ...(o ? { opacity: o } : {}) } };
    }
  }
  const pc = sortKeys(out.panCrop);
  if (pc !== out.panCrop) set('panCrop', pc);
  return out;
}

/**
 * Make a project consistent: events sorted by start, zero/negative-length events removed, a negative start turned
 * into a head trim, rates/fades/levels clamped, keyframes sorted, single-member groups dissolved, markers and
 * regions sorted (empty regions removed), duck sources that are not audio tracks dropped. Idempotent; returns
 * the same project when nothing needed fixing.
 */
export function normalize(p: Project): Project {
  const audio = new Set(p.tracks.filter((t) => t.kind === 'audio').map((t) => t.id));
  let out = withTracks(
    p,
    p.tracks.map((tr) => {
      const events: EditEvent[] = [];
      for (const e of tr.events) {
        const n = normalizeEvent(e);
        if (n) events.push(n);
      }
      let t2 = withEvents(tr, events);
      if (t2.duck) {
        const by = t2.duck.by.filter((b) => b !== t2.id && audio.has(b));
        if (by.length !== t2.duck.by.length) {
          if (by.length) t2 = { ...t2, duck: { ...t2.duck, by } };
          else {
            const { duck: _d, ...rest } = t2;
            t2 = rest;
          }
        }
      }
      return t2;
    }),
  );
  out = dissolveSingletonGroups(out);
  const markersSorted = out.markers.every((m, i) => i === 0 || out.markers[i - 1].t <= m.t);
  const regionsOk = out.regions.every((r, i) => r.end > r.start + EPS && (i === 0 || out.regions[i - 1].start <= r.start));
  if (!markersSorted) out = { ...out, markers: [...out.markers].sort(byT) };
  if (!regionsOk) out = { ...out, regions: out.regions.filter((r) => r.end > r.start + EPS).sort(byStart) };
  return out;
}
