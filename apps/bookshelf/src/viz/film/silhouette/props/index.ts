/**
 * Props and machines (style bible §5). Every prop is a Painter (c, opts, env)
 * that draws in layer world space with env.fill('ink'), plus:
 *   prop.anchors(opts) -> named world points (flame, screen, grip …) for practical lights
 *   prop.bounds(opts)  -> world bounding box (staging, QA)
 * Placement: { x, y } is the base centre on the floor/table, s = scale (1 = real size next
 * to a 175 cm / 320 px puppet), flip mirrors, rot rotates about the base.
 */
export { CM, propGlow, flicker, type Prop, type PropAt, type Pt } from './_kit';
export * from './lights';
export * from './furniture';
export * from './perceptron';
export * from './machines';
export * from './modern';
export * from './study';
export * from './symbolic';
