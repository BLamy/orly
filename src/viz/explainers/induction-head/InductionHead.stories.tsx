import type { Meta, StoryObj } from '@storybook/react-vite';
import { InductionHead } from './InductionHead';

/**
 * Circuits — an induction head you can read.
 * A minimal two-head attention circuit computed honestly: real previous-token
 * and induction attention patterns on a repeated 20-token sequence, copying
 * the repeat 9/9.
 */
const meta: Meta<typeof InductionHead> = {
  title: 'Explainers/The Induction Circuit',
  component: InductionHead,
};
export default meta;

export const Explainer: StoryObj<typeof InductionHead> = {};
