import type { Timeline } from './timeline';

/**
 * A tiny Storybook-agnostic registry connecting the mounted Player to the
 * Motion addon's preview bridge. The Player publishes its timeline +
 * transport controls here; the bridge (which knows about Storybook's
 * channel) subscribes. Keeping this module free of Storybook imports means
 * the Player stays usable outside Storybook.
 */

export interface MotionControls {
  seek(t: number): void;
  toggle(): void;
  setLooping(on: boolean): void;
}

export interface MotionBinding {
  timeline: Timeline;
  /** repo-relative path of the scene's overrides.json (null = not saveable) */
  file: string | null;
  slug: string;
  controls: MotionControls;
}

export interface MotionTimeReport {
  t: number;
  playing: boolean;
  looping: boolean;
}

let current: MotionBinding | null = null;
const bindingSubs = new Set<(b: MotionBinding | null) => void>();

let lastTime: MotionTimeReport = { t: 0, playing: false, looping: false };
const timeSubs = new Set<(tm: MotionTimeReport) => void>();

export function publishMotion(b: MotionBinding): void {
  current = b;
  bindingSubs.forEach((fn) => fn(current));
}

export function clearMotion(b: MotionBinding): void {
  if (current !== b) return;
  current = null;
  bindingSubs.forEach((fn) => fn(null));
}

/** Subscribe to binding changes; fires immediately with the current one. */
export function onMotionBinding(fn: (b: MotionBinding | null) => void): () => void {
  bindingSubs.add(fn);
  fn(current);
  return () => bindingSubs.delete(fn);
}

export function reportMotionTime(tm: MotionTimeReport): void {
  lastTime = tm;
  timeSubs.forEach((fn) => fn(tm));
}

export function onMotionTime(fn: (tm: MotionTimeReport) => void): () => void {
  timeSubs.add(fn);
  fn(lastTime);
  return () => timeSubs.delete(fn);
}
