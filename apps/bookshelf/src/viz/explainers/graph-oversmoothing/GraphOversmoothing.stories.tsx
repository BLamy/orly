import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphOversmoothing } from './GraphOversmoothing';

/**
 * Graph Over-smoothing — 16 real neighbor-mean layers on the community
 * graph; separation decays to 0.48× by depth 8 and 0.24× by depth 16
 * (computed at module scope with the core PRNG).
 */
const meta: Meta<typeof GraphOversmoothing> = {
  title: 'Explainers/Graph Over-smoothing',
  component: GraphOversmoothing,
};
export default meta;

export const Explainer: StoryObj<typeof GraphOversmoothing> = {};
