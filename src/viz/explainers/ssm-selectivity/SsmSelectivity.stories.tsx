import type { Meta, StoryObj } from '@storybook/react-vite';
import { SsmSelectivity } from './SsmSelectivity';

/**
 * Selectivity — Explained: State-Space Models, chapter 2.
 * A real copy task (d = 8, 20 tokens): fixed gates end at recall cosine
 * ≈ 0.05; input-dependent (Mamba-style) gates end at 1.00. Both runs are
 * genuinely computed at module scope.
 */
const meta: Meta<typeof SsmSelectivity> = {
  title: 'Explainers/SSM Selectivity',
  component: SsmSelectivity,
};
export default meta;

export const Explainer: StoryObj<typeof SsmSelectivity> = {};
