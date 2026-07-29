import type { Meta, StoryObj } from '@storybook/react-vite';
import { BestOfNVote } from './BestOfNVote';

/**
 * Best-of-N and Self-Consistency — a real 300-problem sweep: majority vote
 * plateaus at ~68% (the trap answers win their elections) while verified
 * pass@N climbs to 100% by N=128. The verifier gap: ~32 points.
 */
const meta: Meta<typeof BestOfNVote> = {
  title: 'Explainers/Best-of-N Vote',
  component: BestOfNVote,
};
export default meta;

export const Explainer: StoryObj<typeof BestOfNVote> = {};
