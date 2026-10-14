/**
 * Import a film into an editor Project (docs/film/EDITOR.md "Import from a film").
 *
 *   const data: FilmBundle = await (await fetch(`/__editor/film/${slug}`)).json()
 *   const { project, warnings } = importFilmReport(data)      // or importFilm(data) for the project alone
 *
 * Input is the server's FilmBundle (types.ts) or the same film files read from disk (tests): FilmImportData is
 * the structural minimum both satisfy.
 *
 * Layout (track ids are fixed so tools and tests can find them):
 *   V0 "Titles"     empty, for user text events (top = in front)
 *   V1 "Picture"    one shot event per timeline shot. A cut is a butt edit. A shot whose transitionIn is K with
 *                   duration d (reel rules: never on the first shot, d ≤ 90 % of either neighbour) straddles the cut
 *                   exactly as reel.ts paints it: the previous event runs d/2 past the cut, this one starts d/2 early
 *                   with srcIn = −d/2 and transition.kind = K, so src(t) = t − shot.start in both.
 *   A1 "Narration"  one event per line clip (narration/clips/<lineId>.wav) placed so its speech lands where the
 *                   timeline has the line: start = shot.start + line.start − speechStart (timeline.mjs placements).
 *                   Neighbouring clips whose silent heads/tails overlap are trimmed to meet in the silence between
 *                   the two speech spans (the stem summed them; trimming silence keeps the sound and avoids a
 *                   crossfade). Event gain approximates the stem chain from narration/stem.json when given
 *                   (ride + per-line clip gain + stem gain − compressor/peak-stage gain reduction); word rides
 *                   become volume-envelope bumps with the stem's 15 ms ramps. media.speech/words are filled.
 *   A2.. "Music"    the score cues: render sample 0 at cue.start, gainDb, fades (qsin ≈ 'fast'), the mix's fade
 *                   rules (a fade-out ends at cue.end and starts no sooner than fadeAfterStrike after lastStrike; with
 *                   no fade-out the render rings out). Overlapping cues alternate between A2 and A3 (more tracks
 *                   only if three overlap). Ducked music tracks carry duck {by: [A1], depthDb, attack, release} in
 *                   SECONDS from the first ducked cue's settings (cues.json has milliseconds; default 6 dB, 20/500 ms).
 *                   Cues with duck: false go to an un-ducked music track.
 *   groups          each shot event and its narration line events share a group (`shotGroup(shotId)`), so they select
                  and move together (Vegas event grouping): a shot's animation beats are keyed to the locked film
                  clock, so moving a shot without its lines (or a line without its shot) silently desyncs picture
                  and voice. Each line medium carries `tags.at` (the line's shot-local start) for the timeline's
                  sync-offset badge.
  markers         chapter starts and cue starts; regions: chapters.
 * Everything is clamped to the film's duration (the mix is cut there), so project length = film length.
 * Picture round-trips frame for frame; audio within the mix's loudness tolerance (no keyed shelf, room tone or
 * loudnorm stage in the editor; master.gainDb takes the mix's loudnorm gain when mix/loudness.json is given).
 */
import type { AudioMedia, EditEvent, Fade, FilmBundleTimeline, FilmLine, Keyframe, Marker, Media, Project, Region, ShotMedia, Track, TransitionKind } from './types.ts';
import { PROJECT_VERSION } from './types.ts';
import { slugId } from './id.ts';

// ---------------------------------------------------------------------------
// Input: the server's FilmBundle (GET /__editor/film/<slug>, types.ts), or the same files read from disk.
// The shapes below are the structural minimum, so a FilmBundle, a raw lines.json / cues.json / stem.json and the
// film engine's FilmTimelineData are all accepted as they are.
// ---------------------------------------------------------------------------
/** a file under films/<slug>/ with its probed properties; a bare string is a path (or a file name) */
export interface FilmFileInfo {
  path: string;
  /** dev-server URL, when the server already made one */
  url?: string;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  /** FilmClipFile.lineId / FilmCueRender.cueId: preferred over the path for lookup */
  lineId?: string;
  cueId?: string;
}

/** a score cue (score/cues.json entry: FilmCue on the wire, MusicCue in the film engine) */
export interface ImportCue {
  id: string;
  start: number;
  end: number;
  render?: string;
  gainDb?: number;
  fadeIn?: number;
  fadeOut?: number;
  /** true/false, or the sidechain settings (attack/release in MILLISECONDS, the score convention) */
  duck?: boolean | { depthDb?: number; attack?: number; release?: number; ratio?: number; threshold?: number };
  /** film seconds of the cue's final strike, and the clear air the fade keeps after it (mix.mjs) */
  lastStrike?: number;
  fadeAfterStrike?: number;
  mood?: string;
  key?: string;
}

/** the parts of narration/stem.json the importer reads (compressor/peak stage are optional extras) */
export interface FilmStemInfo {
  gainDb?: number;
  compressor?: { grDb?: number } | null;
  peakStage?: { speechGrDb?: number } | null;
  rides?: Record<string, { rideDb?: number; clipGainDb?: number; words?: Record<string, number> }>;
}

export type ImportShot = FilmBundleTimeline['shots'][number];

export interface FilmImportData {
  slug: string;
  title?: string;
  /** narration/timeline.json (the film clock) */
  timeline: FilmBundleTimeline;
  /** score/cues.json */
  cues?: ImportCue[] | null;
  /** narration/lines.json `lines` (or the whole document) */
  lines?: Record<string, FilmLine> | { lines: Record<string, FilmLine> } | null;
  /** narration clip files with probed lengths (FilmClipFile[]); a list given here makes absent clips "missing" */
  clips?: (string | FilmFileInfo)[] | null;
  /** score renders (FilmCueRender[]); a list given here makes absent renders "missing" */
  renders?: (string | FilmFileInfo)[] | null;
  /** narration/stem.json */
  stem?: FilmStemInfo | null;
  /** mix/loudness.json: its loudnorm gain becomes master.gainDb (the mix's one constant gain to -16 LUFS) */
  loudness?: { loudnorm?: { gainDb?: number } } | null;
  sha?: { timeline?: string | null; cues?: string | null };
  /** the server's own warnings (passed through) */
  warnings?: string[];
}

export interface ImportOptions {
  /** ISO time stamp for createdAt/updatedAt/source.at (tests pass a fixed one) */
  now?: string;
  width?: number;
  height?: number;
  sampleRate?: number;
  /** URL the editor fetches a film file from (default: the dev server's /__editor/media/<slug>/<path>) */
  mediaUrl?: (slug: string, path: string) => string;
}

export interface ImportResult {
  project: Project;
  warnings: string[];
}

/** fixed track ids of an imported project */
export const IMPORT_TRACKS = { titles: 'V0', picture: 'V1', narration: 'A1', music: 'A2', music2: 'A3' } as const;

/** the kit's default transition lengths (silhouette/transitions.ts TRANSITION_DUR, registered by film/setup.ts) */
export const FILM_TRANSITION_DUR: Record<string, number> = {
  cut: 0,
  crossfade: 1.2,
  iris: 2.2,
  inkBleed: 2,
  paperWipe: 1.1,
  fadeBlack: 1.6,
  lampChange: 3,
};

/** the mix's minimum clear air between a cue's last strike and its fade-out (mix.mjs --fade-after-strike) */
export const FADE_AFTER_STRIKE = 1.6;

const EDITOR_TRANSITIONS = new Set<TransitionKind>(['crossfade', 'cut', 'iris', 'inkBleed', 'paperWipe', 'fadeBlack', 'lampChange', 'wipeLeft', 'wipeRight', 'push', 'dipWhite']);
const EPS = 1e-6;
/** round to µs (and never −0, which strict deep-equality and Object.is tell apart from 0) */
const r6 = (v: number) => Math.round(v * 1e6) / 1e6 + 0;

export function defaultMediaUrl(slug: string, path: string): string {
  return `/__editor/media/${encodeURIComponent(slug)}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

const noFade = (): Fade => ({ len: 0, curve: 'smooth' });

/** the group shared by a shot's picture event and its narration line events */
export const shotGroup = (shotId: string): string => slugId('g', shotId);

function lineRecords(lines: FilmImportData['lines']): Record<string, FilmLine> {
  if (!lines) return {};
  const inner = (lines as { lines?: unknown }).lines;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) return inner as Record<string, FilmLine>;
  return lines as Record<string, FilmLine>;
}

/** index file infos by owner id (lineId/cueId), full relative path and base name */
function fileIndex(...lists: (FilmImportData['clips'] | undefined)[]): { get(id: string, path: string): FilmFileInfo | undefined } {
  const byId = new Map<string, FilmFileInfo>();
  const byPath = new Map<string, FilmFileInfo>();
  const base = (p: string) => p.split('/').pop()!;
  for (const list of lists) {
    for (const x of list ?? []) {
      const info: FilmFileInfo = typeof x === 'string' ? { path: x } : x;
      if (!info?.path) continue;
      const id = info.lineId ?? info.cueId;
      if (id) byId.set(id, info);
      byPath.set(info.path, info);
      byPath.set(base(info.path), info);
    }
  }
  return { get: (id, path) => byId.get(id) ?? byPath.get(path) ?? byPath.get(base(path)) };
}

// ---------------------------------------------------------------------------
// Picture
// ---------------------------------------------------------------------------
/** transition into each shot after the reel's rules (first shot cut; d ≤ 90 % of either neighbour) */
export function shotTransitions(shots: readonly ImportShot[]): { kind: string; dur: number }[] {
  const out = shots.map((d, i) => {
    const kind = i === 0 ? 'cut' : (d.transitionIn ?? 'cut');
    const dur = kind === 'cut' ? 0 : (d.transitionDur ?? FILM_TRANSITION_DUR[kind] ?? 1);
    return { kind, dur };
  });
  for (let i = 1; i < shots.length; i++) {
    out[i].dur = Math.min(out[i].dur, (shots[i].end - shots[i].start) * 0.9, (shots[i - 1].end - shots[i - 1].start) * 0.9);
  }
  return out;
}

function pictureTrack(data: FilmImportData, media: Record<string, Media>, duration: number, warnings: string[]): Track {
  const { timeline } = data;
  const shots = timeline.shots;
  const trans = shotTransitions(shots);
  const events: EditEvent[] = [];
  shots.forEach((s, i) => {
    const m: ShotMedia = {
      id: slugId('shot', s.id),
      kind: 'shot',
      label: s.id,
      film: timeline.slug || data.slug,
      shotId: s.id,
      duration: r6(s.end - s.start),
      tags: { chapter: s.chapter, ...(s.mood ? { mood: s.mood } : {}), ...(s.transitionIn && i > 0 ? { transitionIn: s.transitionIn } : {}) },
    };
    media[m.id] = m;
    const halfIn = trans[i].dur / 2;
    const halfOut = i + 1 < shots.length ? trans[i + 1].dur / 2 : 0;
    // the reel holds the last shot until the film's duration
    const end = i + 1 < shots.length ? s.end + halfOut : Math.max(s.end, duration);
    const start = s.start - halfIn;
    const ev: EditEvent = {
      id: slugId('v', s.id),
      mediaId: m.id,
      start: r6(start),
      length: r6(end - start),
      srcIn: r6(-halfIn),
      rate: 1,
      fadeIn: noFade(),
      fadeOut: noFade(),
      ...(s.lines.length ? { group: shotGroup(s.id) } : {}),
    };
    if (halfIn > 0) {
      let kind = trans[i].kind as TransitionKind;
      if (!EDITOR_TRANSITIONS.has(kind)) {
        warnings.push(`${s.id}: transition "${trans[i].kind}" is unknown to the editor; using crossfade`);
        kind = 'crossfade';
      }
      ev.transition = { kind };
    }
    events.push(ev);
  });
  return { id: IMPORT_TRACKS.picture, kind: 'video', name: 'Picture', events, mute: false, solo: false, lock: false, height: 72, opacity: 1 };
}

// ---------------------------------------------------------------------------
// Narration
// ---------------------------------------------------------------------------
const wordKey = (w: string) => String(w).toLowerCase().replace(/[^a-z0-9']/g, '');

/** timeline.mjs word rides: +db over each matching word with 15 ms linear ramps (event-relative volume envelope) */
function wordRideEnvelope(words: FilmLine['words'], rides: Record<string, number> | undefined, srcIn: number): Keyframe[] {
  if (!rides || !words?.length) return [];
  const RAMP = 0.015;
  const keys: Keyframe[] = [];
  for (const [word, db] of Object.entries(rides)) {
    if (!Number.isFinite(db) || !db) continue;
    for (const w of words.filter((x) => wordKey(x.w) === wordKey(word))) {
      const a = w.start - srcIn;
      const b = w.end - srcIn;
      keys.push({ t: r6(Math.max(0, a - RAMP)), v: 0 }, { t: r6(Math.max(0, a)), v: db }, { t: r6(Math.max(0, b)), v: db }, { t: r6(b + RAMP), v: 0 });
    }
  }
  return keys.sort((x, y) => x.t - y.t);
}

interface PlacedLine {
  ev: EditEvent;
  /** absolute speech span */
  a: number;
  b: number;
}

function narrationTrack(data: FilmImportData, media: Record<string, Media>, duration: number, mediaUrl: (slug: string, path: string) => string, warnings: string[]): Track {
  const recs = lineRecords(data.lines);
  const files = fileIndex(data.clips);
  const stem = data.stem ?? null;
  if (!stem) warnings.push('no narration/stem.json: narration events play at clip level (gain 0 dB)');
  const placed: PlacedLine[] = [];
  for (const s of data.timeline.shots)
    for (const l of s.lines) {
      const rec = recs[l.id];
      const clipPath = rec?.clip ?? `narration/clips/${l.id}.wav`;
      const info = files.get(l.id, clipPath);
      if (data.clips && !info) {
        warnings.push(`${l.id}: clip ${clipPath} is missing on disk; line not placed`);
        continue;
      }
      if (!rec || !Number.isFinite(rec.speechStart) || !Number.isFinite(rec.speechEnd)) {
        warnings.push(`${l.id}: no speech span in narration/lines.json; line not placed`);
        continue;
      }
      const speechStart = rec.speechStart!;
      const speechEnd = rec.speechEnd!;
      const clipLen = info?.duration !== undefined && info.duration > 0 && Number.isFinite(info.duration) ? info.duration : (rec.duration ?? NaN);
      if (!(clipLen > 0)) {
        warnings.push(`${l.id}: clip ${clipPath} has no duration; line not placed`);
        continue;
      }
      const m: AudioMedia = {
        id: slugId('line', l.id),
        kind: 'audio',
        label: l.id,
        url: info?.url ?? mediaUrl(data.slug, clipPath),
        role: 'narration',
        duration: clipLen,
        speech: { start: speechStart, end: speechEnd },
        ...(rec.words?.length ? { words: rec.words.map((w) => ({ w: w.w, start: w.start, end: w.end })) } : {}),
        ...(info?.sampleRate ? { sampleRate: info.sampleRate } : {}),
        ...(info?.channels ? { channels: info.channels } : {}),
        tags: { line: l.id, shot: s.id, chapter: s.chapter, text: l.text, at: String(r6(l.start)) },
      };
      media[m.id] = m;
      // where clip sample 0 goes (timeline.mjs placements: shot-local line start − speechStart)
      const at = s.start + l.start - speechStart;
      let start = at;
      let srcIn = 0;
      if (start < 0) {
        srcIn = -start;
        start = 0;
      }
      const length = Math.min(clipLen - srcIn, duration - start);
      if (!(length > EPS)) {
        warnings.push(`${l.id}: clip lies outside the film; line not placed`);
        continue;
      }
      const ride = stem?.rides?.[l.id];
      const gainDb = stem
        ? (ride?.rideDb ?? 0) + (ride?.clipGainDb ?? 0) + (stem.gainDb ?? 0) - (stem.compressor?.grDb ?? 0) - (stem.peakStage?.speechGrDb ?? 0)
        : 0;
      const ev: EditEvent = {
        id: slugId('n', l.id),
        mediaId: m.id,
        start: r6(start),
        length: r6(length),
        srcIn: r6(srcIn),
        rate: 1,
        fadeIn: noFade(),
        fadeOut: noFade(),
        ...(Math.abs(gainDb) > 1e-3 ? { gainDb: Math.round(gainDb * 100) / 100 } : {}),
        group: shotGroup(s.id),
      };
      const env = wordRideEnvelope(rec.words, ride?.words, srcIn);
      if (env.length) ev.envelopes = { volume: env };
      placed.push({ ev, a: at + speechStart, b: at + speechEnd });
    }
  placed.sort((x, y) => x.ev.start - y.ev.start);
  // meet in the silence: trim overlapping heads/tails between consecutive clips
  for (let i = 1; i < placed.length; i++) {
    const p = placed[i - 1];
    const n = placed[i];
    const pEnd = p.ev.start + p.ev.length;
    if (pEnd <= n.ev.start + EPS) continue;
    if (p.b > n.a + EPS) {
      warnings.push(`${p.ev.id} and ${n.ev.id}: speech overlaps; left as a crossfade`);
      continue;
    }
    const cut = r6(Math.min(Math.max((Math.max(p.b, n.ev.start) + Math.min(n.a, pEnd)) / 2, p.b), n.a));
    p.ev.length = r6(cut - p.ev.start);
    const d = cut - n.ev.start;
    if (d > 0) {
      n.ev.start = cut;
      n.ev.srcIn = r6(n.ev.srcIn + d);
      n.ev.length = r6(n.ev.length - d);
      if (n.ev.envelopes?.volume) n.ev.envelopes.volume = n.ev.envelopes.volume.map((k) => ({ ...k, t: r6(k.t - d) }));
    }
  }
  return {
    id: IMPORT_TRACKS.narration,
    kind: 'audio',
    name: 'Narration',
    events: placed.map((x) => x.ev),
    mute: false,
    solo: false,
    lock: false,
    height: 64,
    gainDb: 0,
    pan: 0,
  };
}

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------
type DuckObj = Exclude<NonNullable<ImportCue['duck']>, boolean>;

/** the mix's fade-out window for a cue (mix.mjs): returns the fade length; the fade always ends at cue.end */
export function cueFadeOut(c: Pick<ImportCue, 'start' | 'end' | 'fadeOut' | 'lastStrike' | 'fadeAfterStrike'>): number {
  const body = c.end - c.start;
  const configured = Math.max(0, c.fadeOut ?? 0);
  if (!(configured > 0)) return 0;
  let st = Math.max(0, body - configured);
  let d = configured;
  if (Number.isFinite(c.lastStrike)) {
    const minGap = Number.isFinite(c.fadeAfterStrike) ? c.fadeAfterStrike! : FADE_AFTER_STRIKE;
    const earliest = c.lastStrike! - c.start + minGap;
    if (st < earliest) {
      st = earliest;
      d = body - st;
    }
    if (d < 0.3 - 1e-6) d = 0.3;
  }
  return Math.max(0, Math.min(d, body));
}

function musicTracks(data: FilmImportData, media: Record<string, Media>, duration: number, mediaUrl: (slug: string, path: string) => string, warnings: string[]): Track[] {
  const cues = [...(data.cues ?? [])].sort((a, b) => a.start - b.start);
  const files = fileIndex(data.renders, data.clips);
  const ducked: Track[] = [];
  const free: Track[] = [];
  const firstDuck = cues.find((c) => c.duck && typeof c.duck === 'object')?.duck as DuckObj | undefined;
  const duck: NonNullable<Track['duck']> = {
    by: [IMPORT_TRACKS.narration],
    depthDb: firstDuck?.depthDb ?? 6,
    attack: (firstDuck?.attack ?? 20) / 1000,
    release: (firstDuck?.release ?? 500) / 1000,
    ...(firstDuck?.threshold !== undefined ? { threshold: firstDuck.threshold } : {}),
  };
  const newTrack = (isDucked: boolean, n: number): Track => ({
    id: isDucked ? (n === 0 ? IMPORT_TRACKS.music : n === 1 ? IMPORT_TRACKS.music2 : `A${n + 2}`) : `AF${n + 1}`,
    kind: 'audio',
    name: isDucked ? `Music ${String.fromCharCode(65 + n)}` : `Music (no duck)${n ? ` ${n + 1}` : ''}`,
    events: [],
    mute: false,
    solo: false,
    lock: false,
    height: 56,
    gainDb: 0,
    pan: 0,
    ...(isDucked ? { duck: { ...duck, by: [...duck.by] } } : {}),
  });
  // always offer the two alternating music rows, even for a single-cue film
  ducked.push(newTrack(true, 0), newTrack(true, 1));
  for (const c of cues) {
    const path = c.render || `score/renders/${c.id}.wav`;
    const info = files.get(c.id, path);
    if (data.renders && !info) {
      warnings.push(`cue ${c.id}: render ${path} is missing; cue not placed`);
      continue;
    }
    if (!(c.end > c.start) || c.start >= duration) {
      warnings.push(`cue ${c.id}: window ${c.start}..${c.end} is outside the film; cue not placed`);
      continue;
    }
    const body = c.end - c.start;
    const renderLen = info?.duration !== undefined && info.duration > 0 && Number.isFinite(info.duration) ? info.duration : undefined;
    const fades = (c.fadeOut ?? 0) > 0;
    const fadeOut = cueFadeOut(c);
    if (fades && !Number.isFinite(c.lastStrike)) warnings.push(`cue ${c.id}: no lastStrike; the mix may start its fade later than the editor does`);
    if (!fades && renderLen === undefined) warnings.push(`cue ${c.id}: render length unknown; its ring-out tail is cut at cue.end`);
    // a fading cue is cut at its end; otherwise the render rings out (both cut at the film's end, like the mix)
    let length = fades ? body : (renderLen ?? body);
    if (renderLen !== undefined && renderLen < length) {
      if (fades) warnings.push(`cue ${c.id}: render (${renderLen.toFixed(2)} s) is shorter than its window (${body.toFixed(2)} s)`);
      length = renderLen;
    }
    length = Math.min(length, duration - c.start);
    // the fade starts where the mix starts it (body − fadeOut); a render that ends sooner cuts the fade short
    const fadeLen = Math.max(0, Math.min(fadeOut, length - (body - fadeOut)));
    const m: AudioMedia = {
      id: slugId('cue', c.id),
      kind: 'audio',
      label: c.id,
      url: info?.url ?? mediaUrl(data.slug, path),
      role: 'music',
      duration: renderLen ?? body,
      ...(info?.sampleRate ? { sampleRate: info.sampleRate } : {}),
      ...(info?.channels ? { channels: info.channels } : {}),
      tags: { cue: c.id, ...(c.mood ? { mood: c.mood } : {}), ...(c.key ? { key: c.key } : {}) },
    };
    media[m.id] = m;
    const ev: EditEvent = {
      id: slugId('m', c.id),
      mediaId: m.id,
      start: r6(c.start),
      length: r6(length),
      srcIn: 0,
      rate: 1,
      fadeIn: { len: r6(Math.min(Math.max(0, c.fadeIn || 0), length)), curve: 'fast' },
      fadeOut: { len: r6(fadeLen), curve: 'fast' },
      ...(c.gainDb ? { gainDb: c.gainDb } : {}),
    };
    // first row of the right family whose last event has ended
    const rows = c.duck === false ? free : ducked;
    let row = rows.find((t) => {
      const last = t.events[t.events.length - 1];
      return !last || last.start + last.length <= ev.start + EPS;
    });
    if (!row) {
      row = newTrack(c.duck !== false, rows.length);
      rows.push(row);
    }
    row.events.push(ev);
  }
  return [...ducked, ...free];
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------
export function importFilmReport(data: FilmImportData, opts: ImportOptions = {}): ImportResult {
  const warnings: string[] = [...(data.warnings ?? [])];
  const { timeline } = data;
  if (!timeline || !Array.isArray(timeline.shots) || !timeline.shots.length) throw new Error(`film "${data.slug}": timeline has no shots`);
  const now = opts.now ?? new Date().toISOString();
  const mediaUrl = opts.mediaUrl ?? defaultMediaUrl;
  const duration = timeline.duration || timeline.shots[timeline.shots.length - 1].end;
  const media: Record<string, Media> = {};
  const titles: Track = { id: IMPORT_TRACKS.titles, kind: 'video', name: 'Titles', events: [], mute: false, solo: false, lock: false, height: 48, opacity: 1 };
  const picture = pictureTrack(data, media, duration, warnings);
  const narration = narrationTrack(data, media, duration, mediaUrl, warnings);
  const music = musicTracks(data, media, duration, mediaUrl, warnings);
  const markers: Marker[] = [];
  const regions: Region[] = [];
  for (const ch of timeline.chapters ?? []) {
    markers.push({ id: slugId('mk', ch.id), t: ch.start, label: `${ch.number}. ${ch.title}` });
    if (ch.end > ch.start) regions.push({ id: slugId('rg', ch.id), start: ch.start, end: Math.min(ch.end, duration), label: `Chapter ${ch.number}: ${ch.title}` });
  }
  for (const c of data.cues ?? []) if (c.start < duration) markers.push({ id: slugId('mk-cue', c.id), t: c.start, label: `♪ ${c.id}`, color: '#7fb4d8' });
  markers.sort((a, b) => a.t - b.t);
  regions.sort((a, b) => a.start - b.start);
  const project: Project = {
    version: PROJECT_VERSION,
    slug: data.slug,
    title: data.title || data.slug,
    fps: timeline.fps || 24,
    width: opts.width ?? 1920,
    height: opts.height ?? 1080,
    sampleRate: opts.sampleRate ?? 48000,
    media,
    tracks: [titles, picture, narration, ...music],
    markers,
    regions,
    master: { gainDb: data.loudness?.loudnorm?.gainDb ?? 0, limiterDb: -1.5, finish: 1 },
    source: { kind: 'film-import', at: now, ...(data.sha?.timeline ? { timelineSha: data.sha.timeline } : {}), ...(data.sha?.cues ? { cuesSha: data.sha.cues } : {}) },
    createdAt: now,
    updatedAt: now,
  };
  return { project, warnings };
}

/** the imported project alone (warnings are dropped; use importFilmReport to show them) */
export function importFilm(data: FilmImportData, opts: ImportOptions = {}): Project {
  return importFilmReport(data, opts).project;
}
