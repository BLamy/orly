import type { Meta, StoryObj } from '@storybook/react-vite';
import { GradientDescent } from './GradientDescent';

/**
 * Gradient Descent — The Shape of Learning.
 * One loss landscape, three searches: vanilla GD rattles across the ravine
 * walls and crawls; momentum overshoots the deep basin and settles; Adam
 * adapts its per-axis step and cuts cleanly down the ravine.
 */
const meta: Meta<typeof GradientDescent> = {
  title: 'Explainers/Gradient Descent',
  component: GradientDescent,
};
export default meta;

export const Explainer: StoryObj<typeof GradientDescent> = {};
