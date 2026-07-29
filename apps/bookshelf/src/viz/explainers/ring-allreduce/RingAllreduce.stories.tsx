import type { Meta, StoryObj } from '@storybook/react-vite';
import { RingAllreduce } from './RingAllreduce';

/**
 * Data Parallelism and the Ring — the ring all-reduce simulated exactly on
 * real seeded gradient chunks (6 steps, asserted convergent), plus the
 * bandwidth ledger: 2(N-1)/N·G vs naive (N-1)·G.
 */
const meta: Meta<typeof RingAllreduce> = {
  title: 'Explainers/Ring All-Reduce',
  component: RingAllreduce,
};
export default meta;

export const Explainer: StoryObj<typeof RingAllreduce> = {};
