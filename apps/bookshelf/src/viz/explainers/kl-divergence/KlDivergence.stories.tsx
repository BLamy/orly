import type { Meta, StoryObj } from '@storybook/react-vite';
import { KlDivergence } from './KlDivergence';

/**
 * KL Divergence — the price of the wrong model.
 * A true distribution, a codebook printed from wrong beliefs, the live
 * cross-entropy bill, and the waste strip that is the divergence itself
 * (0.250 bits for uniform beliefs, 0.051 for closer ones).
 */
const meta: Meta<typeof KlDivergence> = {
  title: 'Explainers/KL Divergence',
  component: KlDivergence,
};
export default meta;

export const Explainer: StoryObj<typeof KlDivergence> = {};
