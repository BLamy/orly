import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeepLoopScaling } from './DeepLoopScaling';

/**
 * From Fourth Root to Square Root — arXiv:2607.13491, chapter 3.
 * DeepNorm's p = 1/4 vs DeepLoop's p = 1/2 with N the unrolled depth;
 * perturbation growth computed on a tied Post-LN toy net, plus the paper's
 * reported p-sweep boundary at R = 3.
 */
const meta: Meta<typeof DeepLoopScaling> = {
  title: 'Explainers/DeepLoop Scaling',
  component: DeepLoopScaling,
};
export default meta;

export const Explainer: StoryObj<typeof DeepLoopScaling> = {};
