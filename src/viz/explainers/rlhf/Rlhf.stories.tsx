import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rlhf } from './Rlhf';

/**
 * RLHF — aligning a model with a preference loop.
 * A real preference-learning run: Bradley-Terry human comparisons, a reward
 * model fit by gradient ascent, and a softmax policy that concentrates on the
 * two genuinely best answers — with the proxy-gaming hazard called out.
 */
const meta: Meta<typeof Rlhf> = {
  title: 'Explainers/RLHF',
  component: Rlhf,
};
export default meta;

export const Explainer: StoryObj<typeof Rlhf> = {};
