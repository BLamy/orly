import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentMemory } from './AgentMemory';

/**
 * Memory and Context — Explained: Agents, chapter 3.
 * Real context arithmetic: 490 tokens/step fills 128k at step 258; the
 * quadratic 2.59M-token bill by step 100 vs 258k with retrieval (10.1×).
 */
const meta: Meta<typeof AgentMemory> = {
  title: 'Explainers/Agent Memory',
  component: AgentMemory,
};
export default meta;
export const Explainer: StoryObj<typeof AgentMemory> = {};
