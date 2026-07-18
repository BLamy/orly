import type { Meta, StoryObj } from '@storybook/react-vite';
import { DecisionTree } from './DecisionTree';

/**
 * Decision Trees — twenty questions with data.
 * A real greedy split search on 90 seeded points: sweeping candidate cuts
 * with the live information-gain curve, the actual chosen thresholds, the
 * growing tree diagram, and the axis-aligned staircase boundary.
 */
const meta: Meta<typeof DecisionTree> = {
  title: 'Explainers/Decision Trees',
  component: DecisionTree,
};
export default meta;

export const Explainer: StoryObj<typeof DecisionTree> = {};
