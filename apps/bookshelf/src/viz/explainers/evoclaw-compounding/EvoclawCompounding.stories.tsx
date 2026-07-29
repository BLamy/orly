import type { Meta, StoryObj } from '@storybook/react-vite';
import { EvoclawCompounding } from './EvoclawCompounding';

/** arXiv:2607.09711 — EvoClawBench. */
const meta: Meta<typeof EvoclawCompounding> = {
  title: 'Explainers/EvoclawCompounding',
  component: EvoclawCompounding,
};
export default meta;

export const Explainer: StoryObj<typeof EvoclawCompounding> = {};
