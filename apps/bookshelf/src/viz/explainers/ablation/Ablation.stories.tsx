import type { Meta, StoryObj } from '@storybook/react-vite';
import { Ablation } from './Ablation';

/**
 * Ablation — proof by removal.
 * Real knockouts of the induction circuit: 9/9 whole, 0/9 with either head
 * zeroed, and head 1's attention verified bit-for-bit identical under the
 * head-2 cut — surgical damage, surgical survival.
 */
const meta: Meta<typeof Ablation> = {
  title: 'Explainers/Ablation',
  component: Ablation,
};
export default meta;

export const Explainer: StoryObj<typeof Ablation> = {};
