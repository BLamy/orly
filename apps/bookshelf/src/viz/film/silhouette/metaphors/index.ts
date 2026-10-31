/**
 * Teaching machines (style bible §6): neural-network ideas drawn in the silhouette
 * language, every visual variable bound to a real quantity. All painters have the kit
 * signature (c, opts, env) and are driven by explicit progress params from Timeline
 * channels; all math is precomputed at module scope with fixed seeds.
 *
 *   lanternNetwork   neurons = paper lanterns, weights = loom strings; XOR trained offline
 *                    params: epoch, sample, wave, back, reveal
 *   perceptronRetina Mark I: 20x20 retina -> 64 A-unit knobs -> response dial; real rule
 *                    params: step, reveal
 *   xorPlate         parchment plate: one cut fails, two hidden cuts succeed, fold to h-space
 *                    params: sweep, solve, fold, epoch, reveal
 *   mistyHills       gradient descent: traveller with a lantern on the real loss curve
 *                    params: lr, step, fog, tangent, reveal
 *   stencilLantern   convolution: 3x3 pierced lantern over a stitched "4", real feature map
 *                    params: step, kernel, showKernel, reveal
 *   alexnetCathedral two GPU towers with true layer shapes, bridges where the paper crosses
 *                    params: reveal, flow ; + alexnetResultPlate (top-5 15.3% vs 26.2%)
 *   threadsOfLight   attention over "The animal didn't cross the street because it was too tired"
 *                    params: query, heads, threads, pour, reveal
 *   transformerLoom  residual-stream ribbons through attention looms and MLP lanterns
 *                    params: reveal, flow, phase, focus
 *   typeSlugs / nextToken  tokens as type; next-token softmax as a typesetter's case
 *                    params: reveal, slide, choose, temperature
 * Shared kit: paperLantern, thread, knot, glow, practicalGlow, candle, parchmentPlate, label, ...
 * metaphorBackdrop(c, mood, {pxScale, t, room?}): a cached backlit gothic hall (or open sky)
 * for galleries and quick staging; real shots should stage machines on the film's own sets.
 * Galleries: film-gallery.html?g=metaphors (overview) and one per machine.
 */
export * from './kit';
export * from './mlp';
export * from './lanternNetwork';
export * from './perceptronRetina';
export { RETINA, N_A, TASK, TASK_NAMES, trainPerceptron, testAccuracy } from './perceptronMath';
export * from './xorPlate';
export * from './mistyHills';
export * from './stencilLantern';
export * from './alexnetCathedral';
export * from './threadsOfLight';
export { EMBED, HEADS, attentionScores } from './attentionMath';
export * from './transformerLoom';
export * from './typeSlugs';
export { metaphorBackdrop } from './stage';
export type { BackdropOpts } from './stage';
