import type { Meta, StoryObj } from '@storybook/react-vite';
import { HybridRetrievalTasks } from './HybridRetrievalTasks';

/**
 * Spotlights and Floodlights — Explained: Hybrid Attention, chapter 2.
 * Needle retrieval measured over 300 seeded trials per store size: softmax
 * attention 100% everywhere; the linear associative memory degrades with
 * interference (90% at 16 pairs, 59% at 32, 31% at 64). The fuzzy-summary
 * task (EMA) is exactly one recurrent state slot.
 */
const meta: Meta<typeof HybridRetrievalTasks> = {
  title: 'Explainers/Hybrid Retrieval Tasks',
  component: HybridRetrievalTasks,
};
export default meta;

export const Explainer: StoryObj<typeof HybridRetrievalTasks> = {};
