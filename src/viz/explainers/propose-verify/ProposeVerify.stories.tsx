import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProposeVerify } from './ProposeVerify';

/**
 * Propose, Check, Retry — Explained: Proof or It Didn't Happen, ch. 3.
 * A real propose–verify search on the ch.2 logic, 200 seeded runs per
 * proposer: uniform median 417 proposals (98.5% rejected, 21 DNF) vs a
 * state-conditioned policy median 14 (54.7% rejected, 0 DNF).
 */
const meta: Meta<typeof ProposeVerify> = {
  title: 'Explainers/Propose Verify',
  component: ProposeVerify,
};
export default meta;
export const Explainer: StoryObj<typeof ProposeVerify> = {};
