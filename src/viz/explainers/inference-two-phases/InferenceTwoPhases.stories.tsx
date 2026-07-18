import type { Meta, StoryObj } from '@storybook/react-vite';
import { InferenceTwoPhases } from './InferenceTwoPhases';

/**
 * What Serving Actually Costs — Explained: Inference, chapter 1.
 * Honest prefill-vs-decode arithmetic for a 7B fp16 model: 7 ms/token
 * bandwidth-bound decode (143 tok/s) vs a 22k tok/s compute roof — 0.6%
 * utilization, the memory wall.
 */
const meta: Meta<typeof InferenceTwoPhases> = {
  title: 'Explainers/Inference Two Phases',
  component: InferenceTwoPhases,
};
export default meta;
export const Explainer: StoryObj<typeof InferenceTwoPhases> = {};
