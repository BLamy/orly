import type { Meta, StoryObj } from '@storybook/react-vite';
import { HorizonLimitsEconomics } from './HorizonLimitsEconomics';

/** arXiv:2606.30616 — Scaling the Horizon, chapter 4: limits and economics. */
const meta: Meta<typeof HorizonLimitsEconomics> = {
  title: 'Explainers/Horizon Limits Economics',
  component: HorizonLimitsEconomics,
};
export default meta;

export const Explainer: StoryObj<typeof HorizonLimitsEconomics> = {};
