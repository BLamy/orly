import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoopAsCompute } from './LoopAsCompute';

/**
 * Depth You Can Dial — arXiv:2607.13491, chapter 5.
 * Looping as a run-time compute dial; a tied fixed-point solver whose error
 * genuinely collapses with visits; bridges to test-time compute and
 * fixed-state recurrence.
 */
const meta: Meta<typeof LoopAsCompute> = {
  title: 'Explainers/Loop As Compute',
  component: LoopAsCompute,
};
export default meta;

export const Explainer: StoryObj<typeof LoopAsCompute> = {};
