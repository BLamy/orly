import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReasoningSearch } from './ReasoningSearch';

/**
 * Search Over Reasoning — beam search actually run on a toy reasoning tree:
 * greedy 11% at 18 nodes, beam-16 77% at 183; one real tree where greedy
 * dies at the first fork and the beam keeps the correct branch alive.
 */
const meta: Meta<typeof ReasoningSearch> = {
  title: 'Explainers/Reasoning Search',
  component: ReasoningSearch,
};
export default meta;

export const Explainer: StoryObj<typeof ReasoningSearch> = {};
