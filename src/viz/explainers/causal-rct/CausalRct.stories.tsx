import type { Meta, StoryObj } from '@storybook/react-vite';
import { CausalRct } from './CausalRct';

/**
 * The Randomized Trial — one simulated drug (+0.5 true effect), two real
 * simulated studies: observational says −0.25, randomized says +0.46.
 */
const meta: Meta<typeof CausalRct> = {
  title: 'Explainers/Randomized Trial',
  component: CausalRct,
};
export default meta;

export const Explainer: StoryObj<typeof CausalRct> = {};
