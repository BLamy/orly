import type { Meta, StoryObj } from '@storybook/react-vite';
import { RlvrLoop } from './RlvrLoop';

/**
 * The RLVR Loop — a real REINFORCE run against a programmatic verifier:
 * softmax policy over 12 strategies, batch-mean baseline, pass rate 31.5% →
 * 77.5% over 400 genuinely simulated steps.
 */
const meta: Meta<typeof RlvrLoop> = {
  title: 'Explainers/RLVR Loop',
  component: RlvrLoop,
};
export default meta;

export const Explainer: StoryObj<typeof RlvrLoop> = {};
