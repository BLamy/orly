import type { Meta, StoryObj } from '@storybook/react-vite';
import { CausalDo } from './CausalDo';

/**
 * Interventions vs Observations — one real structural model simulated both
 * ways: E[Y|X] has slope 1.63, E[Y|do(X)] has slope 0.80 (computed).
 */
const meta: Meta<typeof CausalDo> = {
  title: 'Explainers/Do Operator',
  component: CausalDo,
};
export default meta;

export const Explainer: StoryObj<typeof CausalDo> = {};
