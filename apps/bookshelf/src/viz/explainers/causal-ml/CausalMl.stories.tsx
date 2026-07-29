import type { Meta, StoryObj } from '@storybook/react-vite';
import { CausalMl } from './CausalMl';

/**
 * Causality and ML — a real logistic regression that leans on a spurious
 * feature: 94% in training, 53% after the shift; the causal-only model
 * holds 86% → 84% (all counted at module scope).
 */
const meta: Meta<typeof CausalMl> = {
  title: 'Explainers/Causal ML',
  component: CausalMl,
};
export default meta;

export const Explainer: StoryObj<typeof CausalMl> = {};
