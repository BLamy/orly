import type { Meta, StoryObj } from '@storybook/react-vite';
import { CoverageFuzz } from './CoverageFuzz';

/**
 * Fuzzing the Harness — Explained: Testing Without an Oracle, ch. 4.
 * Six nested guards, a 26⁶ input space: random fuzzing finds 0 crashes in
 * 200,000 executions; coverage-guided finds it in all 50 seeded campaigns,
 * median 3,156 executions — computed live.
 */
const meta: Meta<typeof CoverageFuzz> = {
  title: 'Explainers/Coverage Fuzz',
  component: CoverageFuzz,
};
export default meta;
export const Explainer: StoryObj<typeof CoverageFuzz> = {};
