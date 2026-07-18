import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExpertParallelTraining } from './ExpertParallelTraining';

/**
 * Expert Parallelism — the training-side MoE bill: 36.6B total / 10.9B
 * active, 4 GB of all-to-all per step, and a real top-2 routing simulation
 * (hot expert 2.66× the mean load; 1.21× with the balancing loss).
 */
const meta: Meta<typeof ExpertParallelTraining> = {
  title: 'Explainers/Expert-Parallel Training',
  component: ExpertParallelTraining,
};
export default meta;

export const Explainer: StoryObj<typeof ExpertParallelTraining> = {};
