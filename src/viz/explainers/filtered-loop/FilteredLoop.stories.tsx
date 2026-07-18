import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilteredLoop } from './FilteredLoop';

/**
 * What Filtering Saves — the same 30-generation loop with one reality-
 * anchored veto: unfiltered collapses to sigma 0.24; filtered wobbles (min
 * 0.68) but ends at 0.96. The RLVR verifier doctrine, guarding the gene pool.
 */
const meta: Meta<typeof FilteredLoop> = {
  title: 'Explainers/Filtered Loop',
  component: FilteredLoop,
};
export default meta;

export const Explainer: StoryObj<typeof FilteredLoop> = {};
