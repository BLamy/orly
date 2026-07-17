import type { Meta, StoryObj } from '@storybook/react-vite';
import { DurableDesign } from './DurableDesign';

/**
 * Designing for Durability — frozen vs refreshed pools (gap 13.3→0.7 vs a
 * constant 13.2), the six-rule checklist, and the arena's own Goodhart.
 */
const meta: Meta<typeof DurableDesign> = {
  title: 'Explainers/Durable Design',
  component: DurableDesign,
};
export default meta;

export const Explainer: StoryObj<typeof DurableDesign> = {};
