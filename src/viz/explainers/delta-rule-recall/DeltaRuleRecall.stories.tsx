import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeltaRuleRecall } from './DeltaRuleRecall';

/**
 * The Delta Rule — one step of online gradient descent, actually run.
 * Six key-value pairs, d = 10: the Hebbian write plateaus on interference;
 * the delta rule (write only the error) drives mean recall error toward zero.
 * Background for arXiv:2605.22791, chapter 2.
 */
const meta: Meta<typeof DeltaRuleRecall> = {
  title: 'Explainers/Delta Rule Recall',
  component: DeltaRuleRecall,
};
export default meta;

export const Explainer: StoryObj<typeof DeltaRuleRecall> = {};
