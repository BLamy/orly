import type { Meta, StoryObj } from '@storybook/react-vite';
import { InferenceSpeculative } from './InferenceSpeculative';

/**
 * Speculative Decoding — Explained: Inference, chapter 4.
 * Draft/verify simulated for real: p=0.7, k=4, 2000 seeded rounds — closed
 * form 2.773 tokens/pass vs measured 2.737, ≈2× end to end with a 10% drafter.
 */
const meta: Meta<typeof InferenceSpeculative> = {
  title: 'Explainers/Inference Speculative',
  component: InferenceSpeculative,
};
export default meta;
export const Explainer: StoryObj<typeof InferenceSpeculative> = {};
