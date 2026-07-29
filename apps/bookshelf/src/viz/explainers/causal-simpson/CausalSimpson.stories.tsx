import type { Meta, StoryObj } from '@storybook/react-vite';
import { CausalSimpson } from './CausalSimpson';

/**
 * Simpson's Paradox — a real confounded dataset where the pooled
 * least-squares slope is −0.84 while every group's slope is +0.7…+0.8
 * (all computed at module scope).
 */
const meta: Meta<typeof CausalSimpson> = {
  title: 'Explainers/Simpson Paradox',
  component: CausalSimpson,
};
export default meta;

export const Explainer: StoryObj<typeof CausalSimpson> = {};
