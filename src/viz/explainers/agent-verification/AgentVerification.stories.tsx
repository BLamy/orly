import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentVerification } from './AgentVerification';

/**
 * The Expensive Claim — Explained: Agents, chapter 5 (series capstone).
 * 5,000 seeded claims through an adversarial critic: precision 60% → 93.3%
 * measured (93.6% by Bayes) — and the bridge to the shelf's loop books.
 */
const meta: Meta<typeof AgentVerification> = {
  title: 'Explainers/Agent Verification',
  component: AgentVerification,
};
export default meta;
export const Explainer: StoryObj<typeof AgentVerification> = {};
