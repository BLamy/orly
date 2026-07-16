import type { Meta, StoryObj } from '@storybook/react-vite';
import { FillerRelayPatterns } from './FillerRelayPatterns';

/** arXiv:2607.03502 — Reading Between the Dots. */
const meta: Meta<typeof FillerRelayPatterns> = {
  title: 'Explainers/Filler Relay Patterns',
  component: FillerRelayPatterns,
};
export default meta;

export const Explainer: StoryObj<typeof FillerRelayPatterns> = {};
