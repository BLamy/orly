import type { Meta, StoryObj } from '@storybook/react-vite';
import { PropertyShrink } from './PropertyShrink';

/**
 * Properties Over Examples — Explained: Testing Without an Oracle, ch. 2.
 * Real property-based testing against the buggy median: falsified on trial 9,
 * shrunk in 28 greedy steps to the minimal witness [2, 0, 100] — all computed
 * at module scope.
 */
const meta: Meta<typeof PropertyShrink> = {
  title: 'Explainers/Property Shrink',
  component: PropertyShrink,
};
export default meta;
export const Explainer: StoryObj<typeof PropertyShrink> = {};
