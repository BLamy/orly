import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeltaChunkFrontier } from './DeltaChunkFrontier';

/**
 * The Chunked Frontier — Explained: The Delta Rule, chapter 5.
 * The paper's constructive chunk-WY recursion (P = Γ − Y M Wᵀ) run for a
 * real chunk of 8 transitions and checked against the dense product:
 * max error ≈ 3.9e-16.
 */
const meta: Meta<typeof DeltaChunkFrontier> = {
  title: 'Explainers/Delta Chunk Frontier',
  component: DeltaChunkFrontier,
};
export default meta;
export const Explainer: StoryObj<typeof DeltaChunkFrontier> = {};
