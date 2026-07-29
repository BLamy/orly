import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProbUncertainty } from './ProbUncertainty';

/**
 * Probabilistic Uncertainty — a real bootstrap ensemble of 12 cubic fits;
 * the fan is 19.6× wider off the data than inside it (computed), while the
 * noisy region's scatter never shrinks.
 */
const meta: Meta<typeof ProbUncertainty> = {
  title: 'Explainers/Probabilistic Uncertainty',
  component: ProbUncertainty,
};
export default meta;

export const Explainer: StoryObj<typeof ProbUncertainty> = {};
