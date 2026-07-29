import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentReactLoop } from './AgentReactLoop';

/**
 * From Predictor to Actor — Explained: Agents, chapter 1.
 * A real toy ReAct loop: two lookups against a module-scope fact table and
 * one computed subtraction (45.16 − 31.47 = 13.69 km), around the LoopRing.
 */
const meta: Meta<typeof AgentReactLoop> = {
  title: 'Explainers/Agent React Loop',
  component: AgentReactLoop,
};
export default meta;
export const Explainer: StoryObj<typeof AgentReactLoop> = {};
