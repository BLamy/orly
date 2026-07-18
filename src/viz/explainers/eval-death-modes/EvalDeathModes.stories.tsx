import type { Meta, StoryObj } from '@storybook/react-vite';
import { EvalDeathModes } from './EvalDeathModes';

/**
 * The Three Ways Evals Die — a computed 300-item benchmark shows a fixed
 * ability gap collapsing from 13.3 to 0.7 points near the ceiling; leakage
 * drift and the SWE-bench+ 32.7% solution-leakage audit carry the record.
 */
const meta: Meta<typeof EvalDeathModes> = {
  title: 'Explainers/Eval Death Modes',
  component: EvalDeathModes,
};
export default meta;

export const Explainer: StoryObj<typeof EvalDeathModes> = {};
