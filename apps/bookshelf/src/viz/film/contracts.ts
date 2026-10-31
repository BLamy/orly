/**
 * orly-2 FILM ENGINE — shared contracts.
 *
 * Every film module (core, silhouette kit, puppets, metaphors, pipeline) codes
 * against these types. Change them only deliberately: they are the seams that
 * let the pieces be built in parallel. See docs/film/ARCHITECTURE.md.
 *
 * Coordinate system: authoring units are the orly stage, 1280 x 720 ("stage
 * px"). The painter scales to the output resolution (pxScale = 1.5 at 1080p),
 * so kit code never thinks about device pixels except for blur radii, which
 * the style bible specifies at 1080p (divide by pxScale when you need stage px).
 *
 * Purity: everything is a function of time. No Math.random, Date.now,
 * performance.now, rAF loops, d3.transition or CSS animation inside a shot or
 * kit painter. Seeded randomness only (core/prng mulberry32), precomputed at
 * module scope or derived from (seed, t).
 */
import type { ReactNode } from 'react';
import type { SceneState, Timeline } from '../core';

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------
export const FILM_W = 1280;
export const FILM_H = 720;
/** Puppets/poses are sampled "on twos": 12 poses per second at 24 fps. */
export const TWOS_HZ = 12;
export const quantizeTwos = (t: number) => Math.floor(t * TWOS_HZ + 1e-9) / TWOS_HZ;

// ---------------------------------------------------------------------------
// Palette (style bible §2). Every mood shares one CIELAB lightness ladder.
// ---------------------------------------------------------------------------
export type MoodId =
  | 'duskRose'
  | 'candleAmber'
  | 'winterBlue'
  | 'labGreen'
  | 'dawnGold'
  | 'serverCyan'
  | 'emberRed'
  | 'parchment';

export interface Palette {
  id: string;
  /** backlight ramp, top of frame -> horizon peak */
  sky: [string, string, string, string];
  set: string;
  setHaze: string;
  haze: string;
  fg: string;
  ink: string;
  rim: string;
  halo: string;
  core: string;
  /** horizon (brightest backlight band) as a fraction of frame height; default 0.6 */
  horizon: number;
}

/** Semantic fill a kit painter asks for; the layer system resolves it to a hazed colour. */
export type FillRole = 'ink' | 'set' | 'fg' | 'rim' | 'halo' | 'core' | 'haze';

// ---------------------------------------------------------------------------
// Multiplane camera + depth layers (style bible §3)
// ---------------------------------------------------------------------------
/** Depth-aware camera. x/y: the world point at frame centre (stage px). z: dolly offset from rest (+ = forward). lens: zoom (1 = rest). */
export interface Camera3 {
  x: number;
  y: number;
  z: number;
  lens: number;
}
export const CAMERA3_HOME: Camera3 = { x: FILM_W / 2, y: FILM_H / 2, z: 0, lens: 1 };
/** Depth of the action plane. scale(layer) = (ZA * lens) / (layer.z - cam.z). */
export const ZA = 1000;

export type LayerId = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';
export interface LayerSpec {
  id: string;
  /** depth; Infinity = screen-locked backlight */
  z: number;
  /** atmospheric mix toward palette.haze, 0..1 */
  haze: number;
  /** blur in px at 1080p output (style bible table) */
  blur: number;
}
export const LAYERS: Record<LayerId, LayerSpec> = {
  L0: { id: 'L0', z: Infinity, haze: 0, blur: 0 },
  L1: { id: 'L1', z: 4000, haze: 0.7, blur: 3 },
  L2: { id: 'L2', z: 1800, haze: 0.18, blur: 1.5 },
  L3: { id: 'L3', z: 1300, haze: 0.25, blur: 0.75 },
  L4: { id: 'L4', z: 1000, haze: 0.03, blur: 0 },
  L5: { id: 'L5', z: 650, haze: 0, blur: 4 },
  L6: { id: 'L6', z: 400, haze: 0, blur: 10 },
};

/**
 * What every kit painter receives. The CanvasRenderingContext2D passed alongside
 * is already transformed into the layer's WORLD space (stage px at depth ZA
 * equivalence): draw at world coordinates; the multiplane system applied
 * parallax/scale. Painters must not reset the transform.
 */
export interface PaintEnv {
  mood: Palette;
  /** resolve a semantic role to this layer's hazed colour */
  fill(role: FillRole): string;
  /** the layer being painted */
  layer: LayerSpec;
  /** shot-local time (seconds), on ones */
  t: number;
  /** t quantised to twos (use for puppets / cut-paper motion) */
  tq: number;
  /** global frame index (for grain tiles etc.) */
  frame: number;
  fps: number;
  /** device px per stage px (1.5 at 1080p) */
  pxScale: number;
  /** deterministic seed for this shot; combine with per-object salts */
  seed: number;
}

/** Signature convention for kit painters: options object + env, draw in place. */
export type Painter<P> = (c: CanvasRenderingContext2D, p: P, env: PaintEnv) => void;

// ---------------------------------------------------------------------------
// The paint frame: implemented by film/core, used by shots
// ---------------------------------------------------------------------------
export interface Frame {
  /** main scene canvas, already scaled to stage px */
  c: CanvasRenderingContext2D;
  W: number;
  H: number;
  pxScale: number;
  t: number;
  tq: number;
  frame: number;
  fps: number;
  seed: number;
  mood: Palette;
  cam: Camera3;
  /** set the camera for subsequent layer() calls (call once, first) */
  camera(cam: Camera3): void;
  /** set/crossfade the mood (u in 0..1 blends from `from` to `to` in Lab) */
  setMood(mood: MoodId | Palette, blend?: { from: MoodId | Palette; u: number }): void;
  /** paint the L0 backlight (sky ramp + sun ellipse). sunX in stage px. */
  backlight(opts?: { sunX?: number; sunY?: number; sunRadius?: number; intensity?: number }): void;
  /** paint into a depth layer: parallax/scale transform + haze-resolved fills + depth blur */
  layer(spec: LayerId | LayerSpec, draw: (c: CanvasRenderingContext2D, env: PaintEnv) => void): void;
  /** screen-locked fog sheet between layers ('A' ~ 0.60H/0.40H/α.30, 'B' ~ 0.70H/0.22H/α.12) */
  fog(sheet: 'A' | 'B' | { yCenter: number; height: number; alpha: number; drift?: number }): void;
  /**
   * Cache a static drawing as an offscreen bitmap (device resolution, blur baked in).
   * key must change whenever the drawing changes. Returns a function that draws the
   * cached bitmap at world (x,y) in the current transform.
   */
  cached(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, opts?: { blur?: number }): (c: CanvasRenderingContext2D, x: number, y: number) => void;
  /** a practical light (candle/lamp/screen/led/tube) with deterministic flicker; drawn additively */
  practical(opts: { x: number; y: number; kind: 'candle' | 'lamp' | 'screen' | 'led' | 'tube'; seed: number; intensity?: number; radius?: number; layer?: LayerId }): void;
  /** rim-light pass for the action plane (call after L4 content). dir = unit vector toward the key light */
  rim(dir?: { x: number; y: number }): void;
}

// ---------------------------------------------------------------------------
// Timing (from films/<slug>/narration/timeline.json, copied into the app as
// apps/bookshelf/src/viz/films/<slug>/timeline.json by generator/film/timeline.mjs)
// ---------------------------------------------------------------------------
export interface WordTiming {
  w: string;
  start: number;
  end: number;
}
export interface LineTiming {
  id: string;
  text: string;
  start: number;
  end: number;
  words: WordTiming[];
}
export interface ShotTimingData {
  id: string;
  chapter: string;
  /** absolute film seconds */
  start: number;
  end: number;
  /** shot-local line timings (seconds from shot start) */
  lines: LineTiming[];
  /** named beats from the script, shot-local seconds */
  beats: Record<string, number>;
  transitionIn?: TransitionKind;
  transitionDur?: number;
  mood?: MoodId;
  /** glossary tags (script onScreenText kind 'term'), shot-local seconds; painted by the reel over the shot */
  terms?: { text: string; gloss?: string; at: number; until: number }[];
}
export interface FilmTimelineData {
  slug: string;
  /** the film's look: absent = silhouette documentary; 'promo' = product promo (film/promo kit, clean finish) */
  look?: string;
  fps: number;
  duration: number;
  chapters: { id: string; number: number; title: string; start: number; end: number }[];
  shots: ShotTimingData[];
}

/** Helpers a shot uses to anchor animation to the narration. All results are shot-local seconds. */
export interface ShotTiming {
  id: string;
  duration: number;
  lines: LineTiming[];
  line(id: string): LineTiming;
  /** start of word n (0-based) or of the first word matching text (case/punct-insensitive) in a line */
  word(lineId: string, which: number | string): number;
  /** end of that word */
  wordEnd(lineId: string, which: number | string): number;
  beat(name: string): number;
  /** stressed-word times usable for gesture beats (≥ 1.2 s apart), from all lines */
  emphasis(minGap?: number): number[];
}

// ---------------------------------------------------------------------------
// Shots and the reel
// ---------------------------------------------------------------------------
/** 'blur' and 'whip' are the promo look's transitions (film/promo) */
export type TransitionKind = 'cut' | 'crossfade' | 'iris' | 'inkBleed' | 'paperWipe' | 'fadeBlack' | 'lampChange' | 'blur' | 'whip';

export interface ShotContext {
  timing: ShotTiming;
  fps: number;
  seed: number;
}

export interface ShotScene {
  tl: Timeline;
  // shots add their own channel refs here
  [k: string]: unknown;
}

export interface ShotModule<S extends ShotScene = ShotScene> {
  id: string;
  mood: MoodId;
  /** build the shot timeline once (module scope via defineShot); durations come from ctx.timing */
  build(ctx: ShotContext): S;
  /** paint one frame. s = scene.tl.sample(t) */
  paint(f: Frame, s: SceneState, scene: S, ctx: ShotContext): void;
  /** optional SVG overlay in stage coordinates (diagram plates, KaTeX). Rendered above the canvas, below finish. */
  overlay?(s: SceneState, scene: S, ctx: ShotContext): ReactNode;
  /**
   * optional HTML layer in stage coordinates (a 1280×720 box scaled to the output), above the scene canvas and
   * below the SVG overlay: live DOM footage such as cleaned rrweb screen recordings (film/promo RrwebScreen).
   * Must be a pure function of the sampled state; anything that loads asynchronously registers with
   * core/pending trackPending() so the frame-exact harness waits for it before a frame is captured.
   */
  dom?(s: SceneState, scene: S, ctx: ShotContext): ReactNode;
}

/** Transition compositor: draw the blend of two already-rendered frames. u: 0 (all a) -> 1 (all b). */
export type TransitionFn = (
  out: CanvasRenderingContext2D,
  a: CanvasImageSource,
  b: CanvasImageSource,
  u: number,
  env: { W: number; H: number; pxScale: number; seed: number; frame: number; mood: Palette },
) => void;

/** Finish pass over the composed frame (bloom, grain, vignette, flicker). Weave is applied as a camera offset by core. */
export type FinishFn = (
  out: CanvasRenderingContext2D,
  env: { W: number; H: number; pxScale: number; frame: number; t: number; seed: number; mood: Palette; grain?: number; vignette?: number; bloom?: number },
) => void;

// ---------------------------------------------------------------------------
// Puppets (style bible §4) — implemented by film/silhouette/puppet
// ---------------------------------------------------------------------------
export type Facing = 'left' | 'right';
export type HandShape = 'relaxed' | 'open' | 'point' | 'grip' | 'fist' | 'pinch' | 'palmDown' | 'typing' | 'chin';
export type JointId =
  | 'torso' | 'neck' | 'head'
  | 'shoulderF' | 'elbowF' | 'wristF'
  | 'shoulderB' | 'elbowB' | 'wristB'
  | 'hipF' | 'kneeF' | 'ankleF'
  | 'hipB' | 'kneeB' | 'ankleB';

export interface Pose {
  /** joint angles in degrees (positive = forward), missing = 0 */
  angles: Partial<Record<JointId, number>>;
  handF?: HandShape;
  handB?: HandShape;
  /** root (pelvis) offset in stage px, for sits/leans; walks move the root via the walk helper */
  root?: { x?: number; y?: number };
}

export interface PuppetSpec {
  id: string;
  /** height in stage px at the action plane (adult ≈ 300-340) */
  height: number;
  build: 'slight' | 'average' | 'stocky' | 'tall';
  era: '1940s' | '1950s' | '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';
  wardrobe: string; // e.g. 'doubleBreasted' | 'labCoat' | 'cardigan' | 'hoodie' | 'blazer' | 'dress' | ...
  hair: string; // e.g. 'sidePart' | 'crewCut' | 'bald' | 'receding' | 'curly' | 'long' | 'bob' | 'bun' | ...
  facialHair?: 'none' | 'beard' | 'fullBeard' | 'moustache' | 'goatee' | 'stubble';
  glasses?: 'none' | 'round' | 'browline' | 'heavy' | 'rimless' | 'rectangular';
  hat?: 'none' | 'fedora' | 'cap' | 'beanie';
  /** profile shape parameters 0..1 (nose length, brow, chin, jaw) for respectful, non-caricatured variety */
  profile?: { nose?: number; brow?: number; chin?: number; jaw?: number };
  /** item in the near hand */
  prop?: 'none' | 'pipe' | 'chalk' | 'pen' | 'book' | 'clipboard' | 'papers' | 'mug' | 'laptop' | 'phone' | 'cards';
  /** up to 8 inner cut-line details (style bible §2.6) */
  details?: string[];
  /** a person's silhouette SIGNATURE (review round 1: "Hinton, LeCun, Bengio and Hassabis must read apart at a
   *  glance"), applied on every draw: stoop (deg, + = torso and neck forward), chinUp (deg, head lifted),
   *  hairScale (hair mass, 1 = default), rim (a back-top contour rim on every draw that does not pass its own
   *  edgeRim: true, or an explicit edgeRim) */
  signature?: {
    stoop?: number;
    chinUp?: number;
    hairScale?: number;
    /** head size about the neck joint (review round 2: LeCun's broader, rounder head): a number or {x, y} */
    headScale?: number | { x: number; y: number };
    /** the rim cut: true = 1.5 px warm rim on the LIGHT-FACING edge (toward o.light when the shot passes it, else
     *  back-top), or an explicit {x, y} direction; warm = 0..1 blend of the rim toward the mood's warm core */
    rim?: boolean | { x: number; y: number; px?: number; alpha?: number; warm?: number };
    /** review round 4 ("line-ups read as identical mannequins"): the person's own idle, drawn whenever a shot
     *  passes a standing pose (POSES.stand or anything within ~8 deg of it on legs and arms, not walking): one of
     *  puppet/poses IDLE_GESTURES (shift = weight shift carrying the prop at the waist, rest, clasp = hands behind the back, think = hand at the chin,
     *  glasses = hand at the glasses, fold = arms folded, pocket = hand at the pocket). It fades out as the pose
     *  moves away from standing (fully off by ~20 deg), so gestures and walks are untouched. */
    idle?: 'stand' | 'rest' | 'shift' | 'clasp' | 'think' | 'listen' | 'fold' | 'glasses' | 'pocket';
    /** head tilt in degrees on every draw (+ = nod down, - = chin up), within +/- 4 */
    tilt?: number;
  };
}

export interface PuppetDrawOpts {
  x: number; // feet position (stage px, world space of the layer)
  y: number;
  facing: Facing;
  pose: Pose;
  /** overall scale on top of spec.height */
  scale?: number;
  /** extra rim cut-lines on/off */
  cutLines?: boolean;
  /** directional cut-lines (lab set craft, review round 3): a unit-ish vector toward the key light / windows
   *  (stage px axes, y down). Cut-lines then fade from full alpha on the side of the figure that faces it to
   *  `floor` × alpha on the far side, so only window-facing edges catch light instead of every line
   *  reading as an outline. Omitted = uniform cut-lines (as before). Pass the shot's f.rim() direction. */
  light?: { x: number; y: number; floor?: number };
  /** explicit body fill, overriding env.fill('ink') (value hierarchy, review round 4: pass PUPPET_NEAR_BLACK
   *  so the figure is the darkest shape in frame, a step below the set's ink) */
  ink?: string;
  /** a rim cut on the figure's own contour on the side facing (x, y) only (the window side): `px` wide in
   *  1080p px (default 1.5), at `alpha` (default 0.6), in env.fill('rim'). Unlike f.rim() it touches only this
   *  figure, so a shot can rim the set on its tops alone and still light the man's window-side edge. */
  edgeRim?: { x: number; y: number; px?: number; alpha?: number; warm?: number };
}

export interface Puppet {
  spec: PuppetSpec;
  draw: Painter<PuppetDrawOpts>;
  /** world-space bounding box at a pose (for QA and staging) */
  bounds(o: PuppetDrawOpts): { x: number; y: number; w: number; h: number };
  /** where a held prop / pointing fingertip is, world space (for attaching effects) */
  anchor(o: PuppetDrawOpts, which: 'handF' | 'handB' | 'head' | 'eye'): { x: number; y: number };
}

// ---------------------------------------------------------------------------
// Pipeline data formats (generator/film/* reads & writes; see ARCHITECTURE.md)
// ---------------------------------------------------------------------------
export interface ScriptLine {
  id: string; // L0001 …
  text: string; // what the viewer reads in subtitles
  /** what the voice says, when it differs (pronunciation); defaults to text */
  spoken?: string;
  /** seconds of silence after this line (default 0.45 within a shot) */
  pauseAfter?: number;
  /** seconds of silence before this line; wins over the previous line's pauseAfter (default 0.45; ignored on a shot's first line, use leadIn) */
  preGap?: number;
  /** level offset in dB for this line in the narration stem, applied as clip gain after the ride and the speech
   *  dynamics, so it lands as written. Keep |levelDb| <= 1.5 (it stacks on the ride); prefer `level`. */
  levelDb?: number;
  /** delivery hint the ride honours: 'soft' = 2 dB under the common line level (asides, closing lines) */
  level?: 'soft';
  /** editorial breaths opened inside the take after a word: {"shape": 0.3} */
  insertGaps?: Record<string, number>;
  /** dB lifts on words the take under-stresses: {"right": 5} */
  wordRides?: Record<string, number>;
  /** per-word clip gain in film:timeline, from the start of word `from` to the end of word `to` (default: from),
   *  rampMs (default 30) ramps outside the span; can cut as well as lift, and the line's ride is measured on the
   *  enveloped clip: [{"from": "Nobody", "db": -2}, {"from": "told", "to": "plan", "db": 4}] */
  gainEnvelope?: { from: string; to?: string; db: number; rampMs?: number }[];
  /** delivery note for the narrator (not spoken) */
  direction?: string;
  /** synthesis controls (film:narrate): solo = generate this line in its own request (never inside a shot chunk);
   *  speed = the voice's speed setting for this line only (implies solo; part of the line's signature) */
  tts?: { solo?: boolean; speed?: number };
}
export interface ScriptBeat {
  id: string;
  /** anchor: a line (+ optional word index/text) or an absolute shot-local time */
  at: { line: string; word?: number | string; edge?: 'start' | 'end'; offset?: number } | { shotTime: number };
  what: string;
}
export interface ScriptShot {
  id: string; // ch01-s01 …
  kind: 'scene' | 'card' | 'plate' | 'montage';
  setting: string;
  era: string;
  mood: MoodId;
  lines: ScriptLine[];
  /** seconds before the first line (default 0.6) */
  leadIn?: number;
  /** seconds of music-only after the last line (default 0.8) */
  holdAfter?: number;
  /** floor for the shot duration (title cards, music moments) */
  minDuration?: number;
  /** the director's description: staging, camera, metaphor, what changes */
  visual: string;
  beats: ScriptBeat[];
  cast?: string[];
  props?: string[];
  /** beat: the beat id that cues the text in; until: the beat id at which the camera carries it out of
   *  frame (a pan, cut or push), when that is before the end of the shot. script.mjs measures reading
   *  time from beat to until (else to the shot's end). */
  /** kind 'term' is a film-level glossary tag (the trade term for a metaphor, named once): the reel paints it,
   *  synced to its beat, in one house style (core/terms.ts); `gloss` is the metaphor it names. Shots do not draw it. */
  onScreenText?: { kind: 'title' | 'date' | 'place' | 'quote' | 'label' | 'equation' | 'nameCard' | 'term'; text: string; gloss?: string; beat?: string; until?: string }[];
  music?: { cue: string; note?: string };
  transitionIn?: TransitionKind;
  /** claim ids from research/claims.json this shot relies on */
  claims?: string[];
}
export interface ScriptChapter {
  id: string; // ch01 …
  number: number;
  title: string;
  blurb: string;
  shots: ScriptShot[];
}
export interface FilmScript {
  slug: string;
  /** the film's look, copied into timeline.json: absent = silhouette documentary; 'promo' = product promo */
  look?: string;
  title: string;
  subtitle?: string;
  logline: string;
  runtimeTargetSec: number;
  chapters: ScriptChapter[];
  /** recurring characters (silhouette signatures, style bible §4.4) */
  cast: (PuppetSpec & { name: string; role: string; firstAppearance: string })[];
}

export interface MusicCue {
  id: string;
  /** absolute film seconds */
  start: number;
  end: number;
  mood: string;
  tempoBpm: number;
  key: string;
  instrumentation: string;
  /** 0..1 */
  intensity: number;
  notes: string;
  /** Strudel source and its lossless render */
  file: string;
  render: string;
  gainDb: number;
  fadeIn: number;
  fadeOut: number;
  /** absolute film seconds of the onset of the cue's final chord or note (required when the cue fades out at the
   *  film end): mix.mjs starts the fade no sooner than fadeAfterStrike (default 1.6 s) after it, so the last chord
   *  rings in clear air; QA mix.fadeAfterStrike checks it */
  lastStrike?: number;
  /** seconds of clear air between lastStrike and the fade-out start (default 1.6) */
  fadeAfterStrike?: number;
  /** duck under narration: true (house default: ratio 8, 20/500 ms, about 6 dB) or explicit sidechain settings
   *  (mix.mjs uses the first ducked cue's object for the whole ducked bus; depthDb is the measured-depth target) */
  duck: boolean | { ratio?: number; attack?: number; release?: number; threshold?: number; depthDb?: number };
}
