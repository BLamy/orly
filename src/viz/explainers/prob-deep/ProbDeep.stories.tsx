import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProbDeep } from './ProbDeep';

/**
 * Bayesian Deep Learning, honestly — the claimed-90% band really audited
 * on 200 fresh points: ensemble spread alone catches 32%, spread + learned
 * noise catches 86% (computed at module scope).
 */
const meta: Meta<typeof ProbDeep> = {
  title: 'Explainers/Bayesian Deep Learning',
  component: ProbDeep,
};
export default meta;

export const Explainer: StoryObj<typeof ProbDeep> = {};
