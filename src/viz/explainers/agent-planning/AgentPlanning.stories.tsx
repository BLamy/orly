import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentPlanning } from './AgentPlanning';

/**
 * A Plan Is a Hypothesis — Explained: Agents, chapter 2.
 * A real 4-queens depth-first search drives the scene: 26 placements tried,
 * 4 backtracks, solution 1-3-0-2 — decomposition with revisable commitments.
 */
const meta: Meta<typeof AgentPlanning> = {
  title: 'Explainers/Agent Planning',
  component: AgentPlanning,
};
export default meta;
export const Explainer: StoryObj<typeof AgentPlanning> = {};
