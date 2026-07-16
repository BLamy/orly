import type { Meta, StoryObj } from '@storybook/react-vite';
import { RecurrenceVsAttention } from './RecurrenceVsAttention';

/**
 * Why Attention Replaced Recurrence — a nine-hop bucket brigade leaking to
 * 39% versus a one-hop arc at 90%, plus the 12-sequential-ticks-vs-1 race.
 */
const meta: Meta<typeof RecurrenceVsAttention> = {
  title: 'Explainers/Recurrence vs Attention',
  component: RecurrenceVsAttention,
};
export default meta;

export const Explainer: StoryObj<typeof RecurrenceVsAttention> = {};
