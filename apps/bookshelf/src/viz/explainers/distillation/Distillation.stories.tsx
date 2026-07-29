import type { Meta, StoryObj } from '@storybook/react-vite';
import { Distillation } from './Distillation';

/**
 * Distillation — real temperature softmax over teacher logits (dark
 * knowledge at T=4) and a student actually trained by 400 GD steps to match
 * the soft targets, versus a hard-label control converging to a spike.
 */
const meta: Meta<typeof Distillation> = {
  title: 'Explainers/Distillation',
  component: Distillation,
};
export default meta;

export const Explainer: StoryObj<typeof Distillation> = {};
