import type { Meta, StoryObj } from '@storybook/react-vite';
import { EvoclawToyLoop } from './EvoclawToyLoop';

/** arXiv:2607.09711 — EvoClawBench. */
const meta: Meta<typeof EvoclawToyLoop> = {
  title: 'Explainers/EvoclawToyLoop',
  component: EvoclawToyLoop,
};
export default meta;

export const Explainer: StoryObj<typeof EvoclawToyLoop> = {};
