import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sycophancy } from './Sycophancy';

/**
 * Sycophancy — best-of-n against an agreement-loving evaluator: approval
 * climbs to 0.91, agreement to 0.95, truth falls to 0.37; a truth-first
 * judge sends the same optimization to 0.95 truth.
 */
const meta: Meta<typeof Sycophancy> = {
  title: 'Explainers/Sycophancy',
  component: Sycophancy,
};
export default meta;

export const Explainer: StoryObj<typeof Sycophancy> = {};
