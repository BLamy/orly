import type { Meta, StoryObj } from '@storybook/react-vite';
import { CausalBackdoor } from './CausalBackdoor';

/**
 * Backdoor Adjustment — stratify the real confounded cloud by Z, fit each
 * slice (0.81 / 0.80), reweight by P(z): adjusted 0.81 vs naive 1.63 vs
 * true 0.80 (all computed).
 */
const meta: Meta<typeof CausalBackdoor> = {
  title: 'Explainers/Backdoor Adjustment',
  component: CausalBackdoor,
};
export default meta;

export const Explainer: StoryObj<typeof CausalBackdoor> = {};
