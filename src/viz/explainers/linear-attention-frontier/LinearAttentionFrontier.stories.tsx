import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinearAttentionFrontier } from './LinearAttentionFrontier';

/**
 * The 2026 Linear-Attention Frontier — closing map for arXiv:2605.22791.
 * DeltaNet -> Gated DeltaNet -> Kimi Delta Attention -> Gated DeltaNet-2,
 * with the paper's reported Tables 2-4 numbers replotted (labeled as
 * published results, not re-run).
 */
const meta: Meta<typeof LinearAttentionFrontier> = {
  title: 'Explainers/Linear Attention Frontier',
  component: LinearAttentionFrontier,
};
export default meta;

export const Explainer: StoryObj<typeof LinearAttentionFrontier> = {};
