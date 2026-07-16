import type { Meta, StoryObj } from '@storybook/react-vite';
import { InContextLearning } from './InContextLearning';

/**
 * In-Context Learning — a new task, learned from the prompt alone.
 * A hidden linear rule fitted by exact least squares from only the examples in
 * the prompt: the line snaps to the truth and query error collapses as more
 * examples enter context — inference-time adaptation, weights frozen.
 */
const meta: Meta<typeof InContextLearning> = {
  title: 'Explainers/In-Context Learning',
  component: InContextLearning,
};
export default meta;

export const Explainer: StoryObj<typeof InContextLearning> = {};
