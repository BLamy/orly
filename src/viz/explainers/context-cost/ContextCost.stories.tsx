import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextCost } from './ContextCost';

/** The Bill — Explained: Long Context, chapter 5. KV memory linear (192 GiB at 1M tokens), prefill quadratic (16,384x for 128x length), decode capped near 16 tokens/s by cache streaming. */
const meta: Meta<typeof ContextCost> = {
  title: 'Explainers/Context Cost',
  component: ContextCost,
};
export default meta;

export const Explainer: StoryObj<typeof ContextCost> = {};
