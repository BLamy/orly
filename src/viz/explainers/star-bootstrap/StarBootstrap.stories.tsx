import type { Meta, StoryObj } from '@storybook/react-vite';
import { StarBootstrap } from './StarBootstrap';

/**
 * Curriculum and Bootstrapping — a STaR-style keep-only-verified loop
 * actually run for 6 rounds: accuracy 36.6% → 82.7%, frontier expanding
 * easy-to-hard, with 29/300 never-reachable problems as the honest limit.
 */
const meta: Meta<typeof StarBootstrap> = {
  title: 'Explainers/STaR Bootstrap',
  component: StarBootstrap,
};
export default meta;

export const Explainer: StoryObj<typeof StarBootstrap> = {};
