import type { Meta, StoryObj } from '@storybook/react-vite';
import { AttentionSinks } from './AttentionSinks';

/** Attention Sinks — Explained: Long Context, chapter 3. Toy: 40 weak tokens + one sink logit 3.5 takes 43% of softmax mass; evicting it swings the output vector by 99% of its length. */
const meta: Meta<typeof AttentionSinks> = {
  title: 'Explainers/Attention Sinks',
  component: AttentionSinks,
};
export default meta;

export const Explainer: StoryObj<typeof AttentionSinks> = {};
