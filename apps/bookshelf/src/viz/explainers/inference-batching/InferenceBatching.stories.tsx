import type { Meta, StoryObj } from '@storybook/react-vite';
import { InferenceBatching } from './InferenceBatching';

/**
 * Continuous Batching — Explained: Inference, chapter 3.
 * A real 24-request / 8-slot serving simulation: static batching 441 steps
 * at 55% utilization vs continuous 322 steps at 76% — 1.37× throughput on
 * identical work, and the throughput-vs-latency trade.
 */
const meta: Meta<typeof InferenceBatching> = {
  title: 'Explainers/Inference Batching',
  component: InferenceBatching,
};
export default meta;
export const Explainer: StoryObj<typeof InferenceBatching> = {};
