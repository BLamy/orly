import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProofKernel } from './ProofKernel';

/**
 * The Kernel Says Yes — Explained: Proof or It Didn't Happen, ch. 2.
 * A real ~30-line natural-deduction kernel checks A∧B → B∧A line by line
 * (5/5 recomputed and matched) and rejects a one-line "clearly true" proof —
 * both verdicts are the checker's live output.
 */
const meta: Meta<typeof ProofKernel> = {
  title: 'Explainers/Proof Kernel',
  component: ProofKernel,
};
export default meta;
export const Explainer: StoryObj<typeof ProofKernel> = {};
