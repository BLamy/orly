import type { Meta, StoryObj } from '@storybook/react-vite';
import { HybridPlacement } from './HybridPlacement';

/**
 * Placement — Explained: Hybrid Attention, chapter 4.
 * Measured toy: needle retrieval with a noisy cue. Attention placed before
 * recurrent smoothing: 40% at noise 0.6; placed after (noise halved by
 * averaging four mentions): 85%. 400 seeded trials per point.
 */
const meta: Meta<typeof HybridPlacement> = {
  title: 'Explainers/Hybrid Placement',
  component: HybridPlacement,
};
export default meta;

export const Explainer: StoryObj<typeof HybridPlacement> = {};
