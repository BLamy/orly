import type { Meta, StoryObj } from '@storybook/react-vite';
import { EvoclawResults } from './EvoclawResults';

/** arXiv:2607.09711 — EvoClawBench. */
const meta: Meta<typeof EvoclawResults> = {
  title: 'Explainers/EvoclawResults',
  component: EvoclawResults,
};
export default meta;

export const Explainer: StoryObj<typeof EvoclawResults> = {};
