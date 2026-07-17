import type { Meta, StoryObj } from '@storybook/react-vite';
import { SampleLottery } from './SampleLottery';

/**
 * One Sample Is a Lottery Ticket — 300 toy problems with per-problem success
 * probabilities from 0.05 to 0.95 (mean pass@1 = 49.7%); 20 genuine draws on
 * a p=0.55 problem. The premise of test-time compute.
 */
const meta: Meta<typeof SampleLottery> = {
  title: 'Explainers/Sample Lottery',
  component: SampleLottery,
};
export default meta;

export const Explainer: StoryObj<typeof SampleLottery> = {};
