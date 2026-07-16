import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoraRank } from './LoraRank';

/**
 * LoRA — a real 16×16 fine-tuning update decomposed by a real Jacobi SVD:
 * rank 1/2/4 reconstructions miss 33%/9%/4% while storing a fraction of the
 * numbers; at d=4096, r=8 that is 0.4% of the parameters.
 */
const meta: Meta<typeof LoraRank> = {
  title: 'Explainers/LoRA Low-Rank Updates',
  component: LoraRank,
};
export default meta;

export const Explainer: StoryObj<typeof LoraRank> = {};
