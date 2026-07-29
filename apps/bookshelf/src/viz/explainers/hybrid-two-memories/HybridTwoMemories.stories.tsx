import type { Meta, StoryObj } from '@storybook/react-vite';
import { HybridTwoMemories } from './HybridTwoMemories';

/**
 * The Two Memories — Explained: Hybrid Attention, chapter 1.
 * One 48-step stream feeds both memories: the KV cache (exact recall, one
 * slot per token) and a real N = 6 diagonal recurrent state whose recall
 * error is measured by least-squares readout (≈2% now, ≈21% at lag 8,
 * ≈37% at lag 20).
 */
const meta: Meta<typeof HybridTwoMemories> = {
  title: 'Explainers/Hybrid Two Memories',
  component: HybridTwoMemories,
};
export default meta;

export const Explainer: StoryObj<typeof HybridTwoMemories> = {};
