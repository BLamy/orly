import type { Meta, StoryObj } from '@storybook/react-vite';
import { OracleProblem } from './OracleProblem';

/**
 * The Oracle Problem — Explained: Testing Without an Oracle, ch. 1.
 * A median with the default (lexicographic) sort passes 8/8 hand-labeled
 * examples and disagrees with the true median on 23.7% of 2,000 seeded
 * lists — and for AI outputs the oracle doesn't exist at all.
 */
const meta: Meta<typeof OracleProblem> = {
  title: 'Explainers/Oracle Problem',
  component: OracleProblem,
};
export default meta;
export const Explainer: StoryObj<typeof OracleProblem> = {};
