import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModelCollapse } from './ModelCollapse';

/**
 * Model Collapse — the self-training ring cranked 30 real generations:
 * spread 1.00 → 0.24, mean drifts +0.46, tails extinct from generation one.
 * Recursion + finite sampling is enough.
 */
const meta: Meta<typeof ModelCollapse> = {
  title: 'Explainers/Model Collapse',
  component: ModelCollapse,
};
export default meta;

export const Explainer: StoryObj<typeof ModelCollapse> = {};
