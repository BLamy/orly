/**
 * Side-effect module: wires the silhouette kit into the core registries.
 * Imported by the barrel (./index) and the harness, so any reel gets the kit's
 * transitions (iris, inkBleed, paperWipe, lampChange…), the film finish pass
 * (bloom, flicker, vignette, dust, grain) and the film fonts.
 */
import { registerFonts, registerTransition, setFinish } from './core/registry';
import { filmFinish } from './silhouette/finish';
import { TRANSITIONS, TRANSITION_DUR } from './silhouette/transitions';
import { FILM_FONTS, loadFilmFonts } from './silhouette/type';

for (const [kind, fn] of Object.entries(TRANSITIONS)) {
  registerTransition(kind, fn, TRANSITION_DUR[kind as keyof typeof TRANSITION_DUR]);
}
setFinish(filmFinish);
registerFonts(...FILM_FONTS);

/** Resolves once the film webfonts' stylesheet is injected and every face is loaded. */
export const filmFontsReady: Promise<void> = typeof document === 'undefined' ? Promise.resolve() : loadFilmFonts();
