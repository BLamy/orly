import type { Meta, StoryObj } from '@storybook/react-vite';
import { LossLandscape } from './LossLandscape';

/**
 * The Loss Landscape — where training lives.
 * A real two-parameter fit (y = a·sin(b·x) to seeded noisy data from a=1,
 * b=2) whose mean-squared-error surface genuinely ripples: mirror global
 * minima, a shallow aliased dent, saddles — and two real gradient-descent
 * walks whose fates the terrain decides.
 */
const meta: Meta<typeof LossLandscape> = {
  title: 'Explainers/The Loss Landscape',
  component: LossLandscape,
};
export default meta;

export const Explainer: StoryObj<typeof LossLandscape> = {};
