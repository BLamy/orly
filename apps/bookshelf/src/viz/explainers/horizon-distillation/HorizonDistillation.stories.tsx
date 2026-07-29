import type { Meta, StoryObj } from '@storybook/react-vite';
import { HorizonDistillation } from './HorizonDistillation';

/** arXiv:2606.30616 — Scaling the Horizon, chapter 3: the training recipe. */
const meta: Meta<typeof HorizonDistillation> = {
  title: 'Explainers/Horizon Distillation',
  component: HorizonDistillation,
};
export default meta;

export const Explainer: StoryObj<typeof HorizonDistillation> = {};
