import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisitAlignment } from './VisitAlignment';

/**
 * Gradients That Compound — arXiv:2607.13491, chapter 2.
 * Per-visit gradient contributions to shared weights, computed exactly by
 * central differences; they align (avg cosine ≈ 0.53), so the summed update
 * barely cancels. κ_R and the first-order perturbation bound.
 */
const meta: Meta<typeof VisitAlignment> = {
  title: 'Explainers/Visit Alignment',
  component: VisitAlignment,
};
export default meta;

export const Explainer: StoryObj<typeof VisitAlignment> = {};
