import type { Meta, StoryObj } from '@storybook/react-vite';
import { HonestEval } from './HonestEval';

/**
 * The Expensive Claim — a "+1 point" claim runs a gauntlet of three real
 * attacks (resampling, fresh questions, optimization pressure), each backed
 * by recomputed miniatures of this book's experiments.
 */
const meta: Meta<typeof HonestEval> = {
  title: 'Explainers/The Expensive Claim',
  component: HonestEval,
};
export default meta;

export const Explainer: StoryObj<typeof HonestEval> = {};
