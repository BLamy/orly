import type { Meta, StoryObj } from '@storybook/react-vite';
import { PositionalEncoding } from './PositionalEncoding';

/**
 * Positional Encoding — order from sinusoids.
 * The real 32 × 24 transformer encoding matrix as a heatmap, its columns
 * pulled out as fast/medium/slow waveforms, and the actual cosine-similarity
 * falloff between row fingerprints.
 */
const meta: Meta<typeof PositionalEncoding> = {
  title: 'Explainers/Positional Encoding',
  component: PositionalEncoding,
};
export default meta;

export const Explainer: StoryObj<typeof PositionalEncoding> = {};
