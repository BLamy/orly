import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoopedTransformer } from './LoopedTransformer';

/**
 * Around the Block — arXiv:2607.13491, chapter 1.
 * What a looped transformer is: a compact stack of M blocks applied R times,
 * unrolled depth N = M·R. The tied-block trajectory is genuinely computed.
 */
const meta: Meta<typeof LoopedTransformer> = {
  title: 'Explainers/Looped Transformer',
  component: LoopedTransformer,
};
export default meta;

export const Explainer: StoryObj<typeof LoopedTransformer> = {};
