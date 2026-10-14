/**
 * Film Editor — project model (the contract every editor module builds against).
 *
 * A non-linear editor (Vegas-style) over the orly-2 film media. Everything is an EVENT on a TRACK:
 *   video tracks : procedural film SHOTS (painted live by the film engine at any source time), stills,
 *                  video files, text and solid-colour generators
 *   audio tracks : narration line clips, music cue renders, imported audio (SFX, room tone, …)
 * Times are SECONDS (float). Timeline time = film time. An event plays its media's SOURCE time
 *   src(t) = event.srcIn + (t - event.start) * event.rate
 * Procedural shots accept any source time (negative or past their length: the shot clamps / keeps
 * atmosphere moving), which is how the film's straddling transitions are represented: two events on the
 * same track that OVERLAP form a transition (Vegas auto-crossfade); the later event's `transition` says
 * how the overlap is composited (default crossfade).
 *
 * Stacking (Vegas): track 0 is the TOP track; in video it is in FRONT. Audio tracks sum.
 * The project is plain JSON (films/<slug>/edit/project.json), immutable in the app (ops return new objects).
 */

export const PROJECT_VERSION = 1;

/** keyframe: `t` is EVENT-relative seconds (0 = event start), `v` the value */
export interface Keyframe<V = number> {
  t: number;
  v: V;
  /** interpolation from this key to the next (Vegas curve types) */
  curve?: 'linear' | 'hold' | 'smooth' | 'fast' | 'slow';
}

export type FadeCurve = 'linear' | 'fast' | 'slow' | 'smooth' | 'sharp';
export interface Fade {
  /** seconds */
  len: number;
  curve: FadeCurve;
}

/** Event Pan/Crop: the source frame placed in the output. Identity = {x:0,y:0,zoom:1,rot:0}.
 *  x/y are the offset of the source centre in OUTPUT-relative units (-0.5..0.5 = half a frame), zoom > 1 enlarges. */
export interface PanCrop {
  x: number;
  y: number;
  zoom: number;
  /** degrees, clockwise */
  rot: number;
}
export const PANCROP_IDENTITY: PanCrop = { x: 0, y: 0, zoom: 1, rot: 0 };

/** Video FX (applied per event, then per track). Parameters are keyframable. */
export type VideoFxKind =
  | 'brightness' // v: -1..1
  | 'contrast' // v: 0..3 (1 = none)
  | 'saturation' // v: 0..3 (1 = none)
  | 'hue' // degrees
  | 'blur' // px at 1080p
  | 'sepia' // 0..1
  | 'grayscale' // 0..1
  | 'invert' // 0..1
  | 'vignette' // 0..1 strength
  | 'filmFinish'; // the film kit's finish pass (grain, gate weave, halation) — v: 0..1 mix
export interface VideoFx {
  id: string;
  kind: VideoFxKind;
  enabled: boolean;
  /** constant value, or keyframes (event-relative for event FX, timeline time for track FX) */
  value: number | Keyframe[];
}

/** Audio FX on an event or track bus (WebAudio nodes; the same graph renders offline for export). */
export type AudioFxKind = 'eq3' | 'compressor' | 'highpass' | 'lowpass' | 'reverb' | 'delay';
export interface AudioFx {
  id: string;
  kind: AudioFxKind;
  enabled: boolean;
  params: Record<string, number>;
}

/** text generator content (rendered in the 1280×720 stage space, scaled to the output) */
export interface TextSpec {
  content: string;
  font: string;
  /** px at 1280×720 */
  size: number;
  color: string;
  align: 'left' | 'center' | 'right';
  /** anchor position, stage px (0..1280, 0..720) */
  x: number;
  y: number;
  weight?: number;
  italic?: boolean;
  outline?: { color: string; width: number };
  shadow?: { color: string; blur: number; dx: number; dy: number };
  /** background plate behind the text */
  plate?: { color: string; padding: number; radius: number };
  /** characters per second type-on (0 = all at once) */
  typeOn?: number;
}

export type TransitionKind = 'crossfade' | 'cut' | 'iris' | 'inkBleed' | 'paperWipe' | 'fadeBlack' | 'lampChange' | 'wipeLeft' | 'wipeRight' | 'push' | 'dipWhite';

// ---------------------------------------------------------------------------
// Media pool
// ---------------------------------------------------------------------------
interface MediaBase {
  id: string;
  label: string;
  /** natural length in seconds (Infinity for generators and stills) */
  duration: number;
  /** free tags shown in the media pool (chapter, line id, cue id, …) */
  tags?: Record<string, string>;
}
/** a procedural film shot (painted by the film engine); source time = shot-local seconds */
export interface ShotMedia extends MediaBase {
  kind: 'shot';
  /** film slug that owns the shot module (usually the project's own film) */
  film: string;
  shotId: string;
}
export interface AudioMedia extends MediaBase {
  kind: 'audio';
  /** URL the editor can fetch (dev server: /__editor/media/<slug>/<path>) */
  url: string;
  role: 'narration' | 'music' | 'sfx' | 'other';
  /** for narration clips: the speech span inside the file (seconds), so trims can snap to speech */
  speech?: { start: number; end: number };
  /** word timings inside the file (narration), used for snapping and captions */
  words?: { w: string; start: number; end: number }[];
  sampleRate?: number;
  channels?: number;
}
export interface ImageMedia extends MediaBase {
  kind: 'image';
  url: string;
  width: number;
  height: number;
}
export interface VideoMedia extends MediaBase {
  kind: 'video';
  url: string;
  width: number;
  height: number;
  fps?: number;
  hasAudio?: boolean;
}
export interface TextMedia extends MediaBase {
  kind: 'text';
  text: TextSpec;
}
export interface ColorMedia extends MediaBase {
  kind: 'color';
  color: string;
}
export type Media = ShotMedia | AudioMedia | ImageMedia | VideoMedia | TextMedia | ColorMedia;
export type MediaKind = Media['kind'];

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
export interface EditEvent {
  id: string;
  mediaId: string;
  /** timeline seconds */
  start: number;
  /** timeline seconds (> 0) */
  length: number;
  /** source seconds at event start */
  srcIn: number;
  /** velocity (playback rate), 1 = normal; audio pitch follows rate (Vegas default) */
  rate: number;
  fadeIn: Fade;
  fadeOut: Fade;
  /** how this event composites over the overlap with the previous event on its track (video); audio overlaps
   *  always crossfade using the two events' fade curves */
  transition?: { kind: TransitionKind };
  mute?: boolean;
  lock?: boolean;
  /** display colour / label override */
  color?: string;
  label?: string;
  /** audio: event gain (dB) — the Vegas "event volume" line */
  gainDb?: number;
  /** video: event opacity 0..1 (the Vegas event "level") */
  opacity?: number;
  /** keyframed envelopes, event-relative time */
  envelopes?: {
    /** audio: dB offset, 0 = unity */
    volume?: Keyframe[];
    /** audio: -1 (L) .. 1 (R) */
    pan?: Keyframe[];
    /** video: 0..1 multiplier */
    opacity?: Keyframe[];
  };
  /** video: Event Pan/Crop keyframes (event-relative); empty/absent = identity */
  panCrop?: Keyframe<PanCrop>[];
  videoFx?: VideoFx[];
  audioFx?: AudioFx[];
  /** text events may override their media's text spec */
  text?: Partial<TextSpec>;
  /** events in the same group move/select together */
  group?: string;
}

export type BlendMode = 'normal' | 'screen' | 'multiply' | 'add' | 'overlay' | 'lighten' | 'darken';

export interface Track {
  id: string;
  kind: 'video' | 'audio';
  name: string;
  /** sorted by start, non-negative lengths; overlaps on one track = transitions/crossfades */
  events: EditEvent[];
  mute: boolean;
  solo: boolean;
  lock: boolean;
  /** UI row height (px) */
  height: number;
  color?: string;
  /** audio: track volume (dB) and pan (-1..1); video: track opacity 0..1 (the composite level) */
  gainDb?: number;
  pan?: number;
  opacity?: number;
  blend?: BlendMode;
  /** timeline-time automation envelopes (Vegas track envelopes) */
  envelopes?: { volume?: Keyframe[]; pan?: Keyframe[]; opacity?: Keyframe[] };
  videoFx?: VideoFx[];
  audioFx?: AudioFx[];
  /** audio: duck this track's bus under the summed signal of these tracks (film-style sidechain).
   *  attack/release are SECONDS (score/cues.json uses ms; the importer converts). `threshold` is advisory: the
   *  duck is keyed on the keying tracks' speech spans, not their level. */
  duck?: { by: string[]; depthDb: number; attack: number; release: number; threshold?: number };
}

export interface Marker {
  id: string;
  t: number;
  label: string;
  color?: string;
}
export interface Region {
  id: string;
  start: number;
  end: number;
  label: string;
  color?: string;
}

/** the timeline view a project remembers (cursor, zoom, scroll, loop bar) */
export interface ProjectView {
  cursor: number;
  pxPerSec: number;
  scrollT: number;
  loop: { start: number; end: number } | null;
  looping: boolean;
}

export interface Project {
  version: typeof PROJECT_VERSION;
  /** film slug the project belongs to */
  slug: string;
  title: string;
  fps: number;
  /** output size (render) */
  width: number;
  height: number;
  sampleRate: number;
  media: Record<string, Media>;
  tracks: Track[];
  markers: Marker[];
  regions: Region[];
  master: {
    gainDb: number;
    /** -16 LUFS film master: a final brickwall at this ceiling (dBTP-ish, sample peak in the browser) */
    limiterDb: number;
    /** the film kit finish pass (grain, weave, halation) applied to the output, 0..1 */
    finish: number;
  };
  /** where the project came from (import provenance) */
  source?: { kind: 'film-import'; at: string; timelineSha?: string; cuesSha?: string };
  /** (shell) the timeline view saved with the project, as Vegas does: restored on load */
  view?: ProjectView;
  createdAt: string;
  updatedAt: string;
}

/** project length = end of the last event (or 0) */
export function projectDuration(p: Project): number {
  let end = 0;
  for (const tr of p.tracks) for (const e of tr.events) end = Math.max(end, e.start + e.length);
  return end;
}

/** source time of an event at timeline time t */
export const srcAt = (e: EditEvent, t: number): number => e.srcIn + (t - e.start) * e.rate;
export const eventEnd = (e: EditEvent): number => e.start + e.length;

// ---------------------------------------------------------------------------
// Engine contracts (implemented in editor/engine/*)
// ---------------------------------------------------------------------------
/** what the compositor needs to paint shots: loaded by the editor shell from the film engine */
export interface ShotSource {
  /** paint shot `shotId` at shot-local `local` (s) into `c` (device px, w×h). `t` = timeline time (grain/weave seeds).
   *  Returns stage-space SVG overlay nodes (1280×720) the shot queued, if any. */
  paint(shotId: string, local: number, c: CanvasRenderingContext2D, t: number): { overlay?: unknown; placeholder: boolean; ms: number };
  has(shotId: string): boolean;
  /** natural length of the shot in the film's locked timeline */
  duration(shotId: string): number;
  /** (video area) the shot's mood id: palette for film transitions and the finish pass (default 'duskRose') */
  moodId?(shotId: string): string;
  /** (video area) the shot's seed as the reel derives it (transition noise), so round trips match the reel */
  seed?(shotId: string): number;
}

export interface CompositorFrame {
  t: number;
  ms: number;
  /** ids of events that contributed */
  events: string[];
  /** overlays to stack above the canvas (stage space), with opacity */
  overlays: { id: string; node: unknown; opacity: number; transform?: string }[];
}

export interface VideoCompositor {
  /** paint the composite at timeline time t into ctx (sized width×height) */
  render(t: number, ctx: CanvasRenderingContext2D): CompositorFrame;
  setProject(p: Project): void;
  /** low-res thumbnail of an event's media at source time (for the timeline) */
  thumbnail(mediaId: string, src: number, w: number, h: number): HTMLCanvasElement | null;
  /** (timeline) subscribe to "async media or a queued thumbnail became ready, ask again"; returns the unsubscribe */
  onInvalidate?(fn: () => void): () => void;
  /** (timeline) has this medium painted as a placeholder card (a shot that failed to load or threw)? */
  failed?(mediaId: string): boolean;
  dispose(): void;
}

export interface AudioEngine {
  readonly ctx: AudioContext;
  setProject(p: Project): void;
  /** start playback at timeline time t (resumes the context) */
  play(t: number, opts?: { loop?: { start: number; end: number }; rate?: number }): void;
  stop(): void;
  /** current timeline time (the master clock while playing) */
  now(): number;
  readonly playing: boolean;
  /** short audible grain at t (scrubbing) */
  scrub(t: number): void;
  /** decode + cache every audio media url; resolves when all are ready (progress 0..1) */
  preload(onProgress?: (p: number) => void): Promise<void>;
  /** min/max peaks for drawing waveforms: `buckets` columns over [src0, src1] source seconds */
  peaks(mediaId: string, src0: number, src1: number, buckets: number): Float32Array | null;
  /** master meter levels (dBFS peak, L/R) */
  meters(): { l: number; r: number };
  /** render [from, to) offline through the identical graph → interleaved stereo Float32 at project.sampleRate */
  renderOffline(from: number, to: number): Promise<{ sampleRate: number; channels: [Float32Array, Float32Array] }>;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Dev-server wire types: the /__editor/* routes (apps/bookshelf/editor-server.ts) and the export job
// (generator/film/edit-render.mjs). Additive (server + export area).
// JSON cannot carry Infinity: on the wire a media `duration` of null means Infinity (stills, generators);
// clients map it back on load.
// ---------------------------------------------------------------------------
/** GET /__editor/films */
export interface FilmListEntry {
  slug: string;
  title: string;
  /** locked timeline length (s) */
  duration: number;
  fps: number;
  hasProject: boolean;
  /** project.json `updatedAt`, when a project exists */
  projectUpdatedAt: string | null;
}

/** a narration line clip on disk (narration/clips/<lineId>.wav) */
export interface FilmClipFile {
  lineId: string;
  /** film-relative path, e.g. narration/clips/L0101.wav */
  path: string;
  /** /__editor/media/<slug>/<path> */
  url: string;
  /** probed length of the file (s) */
  duration: number;
  sampleRate?: number;
  channels?: number;
}

/** a music cue render on disk (score/renders/<cueId>.wav), with its render report fields */
export interface FilmCueRender {
  cueId: string;
  path: string;
  url: string;
  duration: number;
  sampleRate?: number;
  channels?: number;
  /** cue body length and the ring-out tail after it (s), from score/renders/<id>.json */
  bodySeconds?: number;
  tailSeconds?: number;
}

/** score/cues.json entry (the fields the editor uses; the file carries more prose) */
export interface FilmCue {
  id: string;
  /** film seconds */
  start: number;
  end: number;
  /** film-relative render path (score/renders/<id>.wav) */
  render?: string;
  gainDb?: number;
  /** seconds */
  fadeIn?: number;
  fadeOut?: number;
  /** sidechain duck under narration (false = never ducked): attack/release in MILLISECONDS (score convention) */
  duck?: boolean | { depthDb?: number; attack?: number; release?: number; ratio?: number; threshold?: number };
  /** ring-out allowed past `end` (s) */
  tail?: number;
  /** film seconds of the cue's final strike, and the clear air a fade-out keeps after it (mix.mjs) */
  lastStrike?: number;
  fadeAfterStrike?: number;
  shots?: string[];
  mood?: string;
}

/** narration/lines.json `lines[id]`: clip-local speech span and words */
export interface FilmLine {
  shot: string;
  chapter: string;
  text: string;
  /** film-relative clip path */
  clip?: string;
  /** clip length (s) */
  duration?: number;
  /** speech span inside the clip (s) */
  speechStart?: number;
  speechEnd?: number;
  /** clip-local word timings */
  words?: { w: string; start: number; end: number }[];
}

/** story/script.json onScreenText, resolved onto the film clock where the shot's beats allow */
export interface FilmOnScreenText {
  shotId: string;
  /** script kind: label | date | term | quote | title | credit | … */
  kind: string;
  text: string;
  beat?: string;
  until?: string;
  /** film seconds, when the beat (or the shot start) resolves */
  start?: number;
  end?: number;
}

/** narration/timeline.json: a structural mirror of viz/film/contracts FilmTimelineData (which is assignable to it),
 *  kept local so this contract has no imports */
export interface FilmBundleTimeline {
  slug: string;
  fps: number;
  duration: number;
  chapters: { id: string; number: number; title: string; start: number; end: number }[];
  shots: {
    id: string;
    chapter: string;
    /** film seconds */
    start: number;
    end: number;
    /** shot-local line timings */
    lines: { id: string; text: string; start: number; end: number; words: { w: string; start: number; end: number }[] }[];
    /** named beats, shot-local seconds */
    beats: Record<string, number>;
    transitionIn?: string;
    transitionDur?: number;
    mood?: string;
  }[];
}

/** GET /__editor/film/<slug>: everything model/importFilm.ts needs */
export interface FilmBundle {
  slug: string;
  title: string;
  fps: number;
  duration: number;
  /** narration/timeline.json verbatim (the film clock) */
  timeline: FilmBundleTimeline;
  cues: FilmCue[];
  lines: Record<string, FilmLine>;
  /** narration/stem.json: per-line rides and clip gains (dB, word rides by word index), the stem make-up gain and
   *  the compressor / peak-stage gain reduction, if the stem was built */
  stem: {
    gainDb?: number;
    compressor?: { grDb?: number } | null;
    peakStage?: { speechGrDb?: number } | null;
    rides: Record<string, { clipGainDb?: number; rideDb?: number; trimDb?: number; words?: Record<string, number> }>;
  } | null;
  /** mix/loudness.json: the mix's constant loudnorm gain (dB), if the film was mixed */
  loudness: { loudnorm?: { gainDb?: number } } | null;
  clips: FilmClipFile[];
  renders: FilmCueRender[];
  text: FilmOnScreenText[];
  /** the film's own mix (mix/master.wav), for A/B against the edit */
  master: { path: string; url: string; duration: number } | null;
  /** content hashes for Project.source provenance */
  sha: { timeline: string; cues: string | null };
  /** non-fatal problems (missing clips, app timeline copy out of date, …) */
  warnings: string[];
}

/** POST /__editor/import/<slug> response */
export type ImportedMedia = AudioMedia | ImageMedia | VideoMedia;

/** export quality presets (RenderDialog): final = project size crf 18 medium, preview = 960×540 crf 23 veryfast, draft = 640×360 crf 28 ultrafast */
export type RenderPreset = 'final' | 'preview' | 'draft';

/** POST /__editor/render/<slug> body. Times are timeline seconds; omitted = whole project. */
export interface RenderRequest {
  from?: number;
  to?: number;
  width?: number;
  height?: number;
  fps?: number;
  preset?: RenderPreset;
  /** output file name (no extension) under films/<slug>/edit/exports/ */
  name?: string;
  workers?: number;
  /** render this project (e.g. the unsaved in-memory one) instead of the saved project.json */
  project?: Project;
}

export type RenderPhase = 'queued' | 'site' | 'probe' | 'audio' | 'video' | 'mux' | 'verify' | 'done' | 'error' | 'cancelled';

/** GET /__editor/render/<slug>/status (also the payload of edit-render.mjs `PROGRESS {json}` lines) */
export interface RenderStatus {
  state: 'idle' | 'running' | 'done' | 'error' | 'cancelled';
  phase: RenderPhase;
  /** overall 0..1 */
  progress: number;
  /** video frames captured / to capture */
  frames?: number;
  totalFrames?: number;
  /** aggregate capture rate (frames/s) and estimated seconds left */
  fps?: number;
  etaSec?: number;
  message?: string;
  /** finished file: film-relative path and its media URL */
  out?: string;
  url?: string;
  checks?: Record<string, boolean>;
  startedAt?: string;
  endedAt?: string;
  /** last lines of the job's log */
  log?: string[];
}
