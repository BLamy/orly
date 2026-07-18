import type { Meta, StoryObj } from '@storybook/react-vite';
import { Ensembles } from './Ensembles';

/**
 * Ensembles — the wisdom of weak learners.
 * 30 real bootstrap regression trees averaging into a smooth curve with
 * measured variance reduction, then a real AdaBoost run where point sizes
 * are the actual reweighted sample weights and error falls 4 → 0.
 */
const meta: Meta<typeof Ensembles> = {
  title: 'Explainers/Ensembles',
  component: Ensembles,
};
export default meta;

export const Explainer: StoryObj<typeof Ensembles> = {};
