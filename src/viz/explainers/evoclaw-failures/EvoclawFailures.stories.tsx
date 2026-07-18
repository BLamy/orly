import type { Meta, StoryObj } from '@storybook/react-vite';
import { EvoclawFailures } from './EvoclawFailures';

/** arXiv:2607.09711 — EvoClawBench. */
const meta: Meta<typeof EvoclawFailures> = {
  title: 'Explainers/EvoclawFailures',
  component: EvoclawFailures,
};
export default meta;

export const Explainer: StoryObj<typeof EvoclawFailures> = {};
