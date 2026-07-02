import type { Meta, StoryObj } from '@storybook/react-vite';
import { Attention } from './Attention';

/**
 * "Self-Attention, Visually" — the cat sat on the mat, six tokens attending.
 * Handcrafted raw scores (so the story reads well), REAL softmax weights,
 * one timeline; scrub it — every frame is a pure function of t.
 */
const meta: Meta<typeof Attention> = {
  title: 'Explainers/Self-Attention',
  component: Attention,
};
export default meta;

export const SelfAttention: StoryObj<typeof Attention> = {};
