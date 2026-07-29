import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentFailure } from './AgentFailure';

/**
 * Why Agents Fail — Explained: Agents, chapter 4.
 * 0.95^20 = 0.3585 with a 4,000-run Monte Carlo (36.5%), one poisoned
 * observation flipping 13.69 into 42.01, and the gamed checker.
 */
const meta: Meta<typeof AgentFailure> = {
  title: 'Explainers/Agent Failure',
  component: AgentFailure,
};
export default meta;
export const Explainer: StoryObj<typeof AgentFailure> = {};
