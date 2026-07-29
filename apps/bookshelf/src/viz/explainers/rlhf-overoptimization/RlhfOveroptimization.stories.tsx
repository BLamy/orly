import type { Meta, StoryObj } from '@storybook/react-vite';
import { RlhfOveroptimization } from './RlhfOveroptimization';

/**
 * RLHF and Its Limits — a real best-of-n sweep against a learned reward with
 * loopholes: proxy climbs monotonically while true quality peaks at 0.75
 * (n=8) and collapses to 0.34 as loopholes take 100% of wins.
 */
const meta: Meta<typeof RlhfOveroptimization> = {
  title: 'Explainers/RLHF Overoptimization',
  component: RlhfOveroptimization,
};
export default meta;

export const Explainer: StoryObj<typeof RlhfOveroptimization> = {};
