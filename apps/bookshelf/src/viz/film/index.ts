/**
 * orly-2 film engine barrel: core + the silhouette kit.
 * Shot authors import everything from here (apps/bookshelf/src/viz/film).
 * See .claude/skills/film-shot/SKILL.md for the authoring guide.
 *
 *   contracts      types, FILM_W/H, LAYERS, ZA, CAMERA3_HOME, quantizeTwos
 *   palette        MOODS, mood, crossfadeMood, mixLab, hazed, makeEnv, withAlpha
 *   core           shotTiming, multiplane (cam3Interp, camMove, overscan), createFrame, registry, defineShot, createReel
 *   atmosphere     dust, god rays, snow, rain, embers, smoke, paper, fog banks (noise helpers come from core: hash1/vnoise/fbm)
 *   finish         filmFinish, makeFilmFinish, passes, gateWeave
 *   transitions    TRANSITIONS, iris, inkBleed, paperWipe, warmTransitions
 *   type           titleCard, chapterCard, placeStamp, nameCard, quoteCard, annotation, loadFilmFonts
 *   overlays       ParchmentPlate, EquationPlate, InkCaption (React SVG overlays)
 *   sets           ornament, lathe, architecture (walls, openings, floors, interiors, modern, exterior), nature
 *   props          ~50 parametric props with anchors() (lights, furniture, machines incl. Mark I photocellRetina)
 *   puppet         createPuppet, poses, motion (talkBeats, breathing), walk
 *   metaphors      lanternNetwork, perceptronRetina, xorPlate, mistyHills, stencilLantern, alexnetCathedral, threadsOfLight, transformerLoom, typeSlugs/nextToken
 */
import './setup';

export * from './contracts';
export * from './silhouette/palette';
export * from './core/timing';
export * from './core/multiplane';
export * from './core/frame';
export * from './core/registry';
export * from './core/shot';
export * from './core/reel';
export * from './core/paintContext';
export * from './core/terms';
export { filmFontsReady } from './setup';

export {
  vnoise2,
  fbm2,
  smoothstep,
  makeCanvas,
  softSprite,
  windowBeam,
  beamCoverage,
  dustMotes,
  godRays,
  snow,
  rain,
  embers,
  sparks,
  smoke,
  paperSheets,
  fogBank,
} from './silhouette/atmosphere';
export type { Beam, DustOpts, GodRayOpts, SnowOpts, RainOpts, EmberOpts, SparkOpts, SmokeOpts, PaperSheetOpts, FogBankOpts, Rect as AtmosRect } from './silhouette/atmosphere';
export * from './silhouette/finish';
export * from './silhouette/transitions';
export * from './silhouette/type';
export * from './silhouette/overlays';
export * from './silhouette/metaphors';
export * from './silhouette/ornament';
export * from './silhouette/lathe';
export * from './silhouette/architecture';
export * from './silhouette/nature';
export * from './silhouette/props';
export * from './silhouette/puppet';
// disambiguate star-export collisions (explicit re-exports win): the function memoizer is public;
// architecture's map-based memo stays importable from './silhouette/architecture/common'.
export { memo } from './silhouette/metaphors/kit';
export type { Pt } from './silhouette/architecture';
